// screens/cliente/PantallaInicio.tsx - CON TÍTULO Y LOGO
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { supabase } from '../../lib/supabase';
import { Colores, getTematica } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';
import { Producto, Perfil } from '../../lib/tipos';

// ✅ IMPORTAR IMÁGENES DE CATEGORÍAS
const hamburguesasImg = require('../../assets/imagenes/categorias/hamburguesaCat.jpg');
const combosImg = require('../../assets/imagenes/categorias/combosCat.jpg');
const bebidasImg = require('../../assets/imagenes/categorias/bebidasCat.jpg');
const postresImg = require('../../assets/imagenes/categorias/postresCat.jpg');

// ✅ IMPORTAR LOGO DE KRUSTY
const logoKrusty = require('../../assets/icon.png');

// ✅ IMPORTAR IMAGEN DE BIENVENIDA
const bienvenidaImg = require('../../assets/imagenes/bienvenidos.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.04)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentLight: '#FF6B6B',
    accentSecondary: '#F5C518',
    accentSecondaryLight: '#FFE135',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};

// ============================================================
// 📋 DATOS DE CATEGORÍAS
// ============================================================
interface CategoriaData {
  id: string;
  nombre: string;
  imagen: any;
  color: string;
  descripcion: string;
}

const CATEGORIAS: CategoriaData[] = [
  {
    id: 'hamburguesas',
    nombre: 'Hamburguesas',
    imagen: hamburguesasImg,
    color: '#E53935',
    descripcion: 'Las mejores de Springfield',
  },
  {
    id: 'combos',
    nombre: 'Combos',
    imagen: combosImg,
    color: '#F5C518',
    descripcion: 'Con papas y bebida',
  },
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    imagen: bebidasImg,
    color: '#1A237E',
    descripcion: 'Refrescos y más',
  },
  {
    id: 'postres',
    nombre: 'Postres',
    imagen: postresImg,
    color: '#F48FB1',
    descripcion: 'Dulces tentaciones',
  },
];

// ============================================================
// 🏠 PANTALLA DE INICIO
// ============================================================
export default function PantallaInicio(props: any) {
  const { perfil, esAdministrador } = tiendaAutenticacion();
  const { cantidadTotal, agregarProducto } = tiendaCarrito();
  const { favoritos, favoritosData, cargando: cargandoFavoritos, cargarFavoritos, limpiarFavoritos } = tiendaFavoritos();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  const [ofertas, setOfertas] = useState<any[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [cantidadProductos, setCantidadProductos] = useState<Record<string, number>>({});

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // ============================================================
  // 📐 TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getEspaciado('LG'),
    ofertaCardWidth: responsive.isDesktop ? SCREEN_WIDTH * 0.25 :
      responsive.isTablet ? SCREEN_WIDTH * 0.35 : SCREEN_WIDTH * 0.7,
    ofertaImagenHeight: responsive.getValor({ tablet: 210, normal: 160, small: 130 }),
    favoritoCardWidth: responsive.isDesktop ? SCREEN_WIDTH * 0.18 :
      responsive.isTablet ? SCREEN_WIDTH * 0.28 : SCREEN_WIDTH * 0.55,
    categoriaSize: responsive.getValor({ tablet: 60, normal: 50, small: 42 }),
    logoSize: responsive.getValor({ tablet: 600, normal: 600, small: 115 }),
    tituloSize: responsive.getValor({ tablet: 52, normal: 36, small: 32 }),
    bienvenidaSize: responsive.getValor({ tablet: 200, normal: 350, small: 120 }),
  }), [responsive]);

  // ============================================================
  // 🔄 FUNCIONES
  // ============================================================
  const cargarOfertas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activa', true);
      if (error) throw error;
      setOfertas(data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setOfertas([]);
    } finally {
      setCargandoOfertas(false);
    }
  }, []);

  const cargarFavoritosUsuario = useCallback(async () => {
    if (perfil?.id) {
      await cargarFavoritos(perfil.id);
    } else {
      limpiarFavoritos();
    }
  }, [perfil?.id, cargarFavoritos, limpiarFavoritos]);

  const cargarCantidadProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('categoria', { count: 'exact', head: true })
        .eq('disponible', true);

      if (error) throw error;

      const conteo: Record<string, number> = {};
      data?.forEach((item: any) => {
        conteo[item.categoria] = (conteo[item.categoria] || 0) + 1;
      });
      setCantidadProductos(conteo);
    } catch (error) {
      console.error('Error contando productos:', error);
    }
  }, []);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    cargarOfertas();
    cargarFavoritosUsuario();
    cargarCantidadProductos();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 40, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarOfertas(), cargarFavoritosUsuario(), cargarCantidadProductos()]);
    setRefrescando(false);
  }, [cargarOfertas, cargarFavoritosUsuario, cargarCantidadProductos]);

  // ============================================================
  // 🎨 FUNCIONES AUXILIARES
  // ============================================================
  const getColorPorId = useCallback((id: number) => {
    const colores = ['#E53935', '#F5C518', '#43A047', '#1A237E', '#7B1FA2', '#FF6F00', '#F48FB1'];
    return colores[id % colores.length];
  }, []);

  // ============================================================
  // 🖼️ RENDER DE OFERTAS
  // ============================================================
  const renderOferta = useCallback(({ item }: { item: any }) => {
    const color = getColorPorId(item.id);
    const hasFreeShipping = item.descuento?.toLowerCase().includes('envío gratis') ||
      item.descuento?.toLowerCase().includes('envio gratis');

    return (
      <Animated.View
        style={[
          styles.ofertaWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.ofertaCard,
            {
              width: tamanos.ofertaCardWidth,
              backgroundColor: DESIGN.colors.card,
              borderColor: color + '25',
            }
          ]}
          activeOpacity={0.9}
          onPress={() => props.navigation.navigate('DetalleOferta', { oferta: item })}
        >
          <LinearGradient
            colors={[color + '10', 'transparent']}
            style={styles.ofertaGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Badges */}
          <View style={styles.ofertaBadges}>
            <View style={[styles.badgeDescuento, { backgroundColor: color }]}>
              <Text style={styles.badgeDescuentoText}>🔥 {item.descuento}</Text>
            </View>
            {hasFreeShipping && (
              <View style={[styles.badgeEnvio, { backgroundColor: '#43A047' }]}>
                <Ionicons name="rocket" size={12} color="#fff" />
                <Text style={styles.badgeEnvioText}>Envío gratis</Text>
              </View>
            )}
          </View>

          {/* Imagen */}
          <View style={[styles.ofertaImagenContainer, { height: tamanos.ofertaImagenHeight }]}>
            {item.imagen ? (
              <Image source={{ uri: item.imagen }} style={styles.ofertaImagen} resizeMode="cover" />
            ) : (
              <View style={styles.ofertaImagenPlaceholder}>
                <Text style={styles.ofertaImagenEmoji}>🍔</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.05)']}
              style={styles.ofertaImagenOverlay}
              start={{ x: 0, y: 0.6 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          {/* Info */}
          <View style={styles.ofertaInfo}>
            <Text style={styles.ofertaTitulo} numberOfLines={1}>
              {item.titulo}
            </Text>
            <View style={styles.ofertaPrecios}>
              <Text style={[styles.ofertaPrecioActual, { color }]}>
                {formatearPrecio(item.precio_oferta)}
              </Text>
              <Text style={styles.ofertaPrecioOriginal}>
                {formatearPrecio(item.precio_original)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [tamanos, fadeAnim, slideAnim]);

  // ============================================================
  // ⭐ RENDER DE FAVORITOS
  // ============================================================
  const renderFavorito = useCallback(({ item }: { item: any }) => {
    const count = favoritosData.find((f) => f.producto_id === item.id)?.contador || 1;

    return (
      <Animated.View
        style={[
          styles.favoritoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.favoritoCard,
            {
              width: tamanos.favoritoCardWidth,
              backgroundColor: DESIGN.colors.card,
              borderColor: DESIGN.colors.borderLight,
            }
          ]}
          onPress={() => props.navigation.navigate('DetalleProducto', { producto: item })}
          activeOpacity={0.8}
        >
          <View style={styles.favoritoImagenContainer}>
            {item.imagen ? (
              <Image source={{ uri: item.imagen }} style={styles.favoritoImagen} resizeMode="cover" />
            ) : (
              <View style={styles.favoritoImagenPlaceholder}>
                <Text style={styles.favoritoImagenEmoji}>🍔</Text>
              </View>
            )}
            {count > 1 && (
              <View style={styles.favoritoCount}>
                <Text style={styles.favoritoCountText}>×{count}</Text>
              </View>
            )}
          </View>

          <View style={styles.favoritoInfo}>
            <Text style={styles.favoritoNombre} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={styles.favoritoPrecio}>
              {formatearPrecio(item.precio)}
            </Text>
            <TouchableOpacity
              style={styles.favoritoBoton}
              onPress={() => {
                agregarProducto(item);
                Alert.alert('🎉', `${item.nombre} agregado al carrito`);
              }}
            >
              <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={styles.favoritoBotonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.favoritoBotonText}>+ Agregar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [tamanos, favoritosData, agregarProducto, fadeAnim, slideAnim]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const padding = tamanos.padding;
  const cantidad = cantidadTotal();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F5F2ED', '#FFFFFF', '#F5F2ED']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + responsive.spacing(16),
            paddingBottom: insets.bottom + responsive.spacing(48) * 2,
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={DESIGN.colors.accent}
            colors={[DESIGN.colors.accent]}
          />
        }
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* ============================================================ */}
        {/* HEADER CON BIENVENIDA Y LOGO */}
        {/* ============================================================ */}
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View style={styles.headerLeft}>
            {/* ✅ TÍTULO "BIENVENIDOS" EN GRANDE CON IMAGEN ARRIBA DEL LOGO */}
            <Animated.View
              style={[
                styles.bienvenidaContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                }
              ]}
            >
              {/* ✅ IMAGEN DE BIENVENIDA (ARRIBA DEL LOGO) */}
              <Image
                source={bienvenidaImg}
                style={[
                  styles.bienvenidaImagen,
                  {
                    width: tamanos.bienvenidaSize,
                    height: tamanos.bienvenidaSize,
                  }
                ]}
                resizeMode="contain"
              />

              {/* ✅ LOGO DE KRUSTY (DEBAJO DE LA IMAGEN) */}
              <Image
                source={logoKrusty}
                style={[
                  styles.logoBienvenida,
                  {
                    width: tamanos.logoSize,
                    height: tamanos.logoSize,
                  }
                ]}
                resizeMode="contain"
              />
            </Animated.View>

            {/* ✅ SALUDO AL USUARIO */}
            <View style={styles.saludoContainer}>
              <Text style={styles.headerGreeting}>☀️ Buenos días,</Text>
              <Text style={styles.headerName}>
                {perfil?.nombre_cliente || 'Cliente'}
              </Text>
              <View style={styles.headerPoints}>
                <Ionicons name="star" size={14} color={DESIGN.colors.accentSecondary} />
                <Text style={styles.headerPointsText}>
                  {perfil?.puntos_acumulados || 0} pts
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {esAdministrador && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => props.navigation.navigate('PanelAdmin')}
              >
                <LinearGradient
                  colors={['#43A047', '#FFD700']}
                  style={styles.headerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => props.navigation.navigate('Carrito')}
            >
              <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={styles.headerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="bag-outline" size={20} color="#fff" />
                {cantidad > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>
                      {cantidad > 99 ? '99+' : cantidad}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* OFERTAS */}
        {/* ============================================================ */}
        <View style={[styles.section, { paddingHorizontal: padding }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Ofertas del Día</Text>
            <TouchableOpacity>
              <Text style={styles.sectionSeeAll}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          {cargandoOfertas ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={DESIGN.colors.accent} />
            </View>
          ) : ofertas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No hay ofertas disponibles</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={ofertas}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOferta}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={tamanos.ofertaCardWidth + 14}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          )}
        </View>

        <View style={styles.divider} />

        {/* ============================================================ */}
        {/* CATEGORÍAS */}
        {/* ============================================================ */}
        <View style={[styles.section, { paddingHorizontal: padding }]}>
          <Text style={styles.sectionTitle}>🍔 Categorías</Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIAS.map((cat) => {
              const width = (SCREEN_WIDTH - padding * 2 - 12) / 2 - 6;
              const count = cantidadProductos[cat.id] || 0;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    {
                      width,
                      backgroundColor: DESIGN.colors.card,
                      borderColor: cat.color + '20',
                    }
                  ]}
                  onPress={() => props.navigation.navigate('Menu')}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryImageContainer}>
                    <Image source={cat.imagen} style={styles.categoryImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)']}
                      style={styles.categoryOverlay}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 0, y: 1 }}
                    />
                    {count > 0 && (
                      <View style={styles.categoryBadgeContainer}>
                        <View style={[styles.categoryBadge, { backgroundColor: cat.color }]}>
                          <Text style={styles.categoryBadgeText}>{count}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.nombre}</Text>
                    <Text style={styles.categoryDesc}>{cat.descripcion}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ============================================================ */}
        {/* FAVORITOS */}
        {/* ============================================================ */}
        <View style={[styles.section, { paddingHorizontal: padding }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Tus Favoritos</Text>
            {favoritos.length > 0 && (
              <TouchableOpacity onPress={() => props.navigation.navigate('Perfil')}>
                <Text style={styles.sectionSeeAll}>Ver todos →</Text>
              </TouchableOpacity>
            )}
          </View>

          {cargandoFavoritos ? (
            <View style={styles.loadingContainerSmall}>
              <ActivityIndicator size="small" color={DESIGN.colors.accent} />
            </View>
          ) : favoritos.length > 0 ? (
            <FlatList
              horizontal
              data={favoritos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={tamanos.favoritoCardWidth + 14}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          ) : (
            <View style={styles.emptyContainerSmall}>
              <Ionicons name="heart-outline" size={32} color={DESIGN.colors.textTertiary} />
              <Text style={styles.emptyTextSmall}>Aún no tienes favoritos</Text>
              <Text style={styles.emptySubText}>Los productos que más te gusten aparecerán aquí</Text>
            </View>
          )}
        </View>

        <View style={styles.footerSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ============================================================
  // HEADER
  // ============================================================
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },

  // ============================================================
  // BIENVENIDA CON IMAGEN + LOGO
  // ============================================================
  bienvenidaContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  bienvenidaImagen: {
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginTop: 20,
    marginBottom: -250,
    marginLeft: 60,

  },
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: 32,
    marginLeft: 60,
  },


  // ============================================================
  // SALUDO
  // ============================================================
  saludoContainer: {
    marginTop: 4,
  },
  headerGreeting: {
    fontSize: 13,
    color: DESIGN.colors.textSecondary,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN.colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: DESIGN.radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerPointsText: {
    fontSize: 11,
    fontWeight: '500',
    color: DESIGN.colors.textSecondary,
  },

  // ============================================================
  // BOTONES HEADER
  // ============================================================
  headerButton: {
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtonGradient: {
    padding: 10,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: DESIGN.colors.accent,
    borderRadius: DESIGN.radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: DESIGN.colors.surface,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },

  // ============================================================
  // SECCIONES
  // ============================================================
  section: {
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN.colors.text,
    letterSpacing: -0.3,
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: DESIGN.colors.textSecondary,
  },
  divider: {
    height: 20,
  },
  horizontalList: {
    paddingVertical: 6,
  },

  // ============================================================
  // OFERTAS
  // ============================================================
  ofertaWrapper: {
    paddingVertical: 4,
    marginRight: 14,
  },
  ofertaCard: {
    borderRadius: DESIGN.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  ofertaGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  ofertaBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badgeDescuento: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DESIGN.radius.full,
  },
  badgeDescuentoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  badgeEnvio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DESIGN.radius.full,
  },
  badgeEnvioText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  ofertaImagenContainer: {
    width: '100%',
    position: 'relative',
  },
  ofertaImagen: {
    width: '100%',
    height: '100%',
  },
  ofertaImagenPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surface,
  },
  ofertaImagenEmoji: {
    fontSize: 40,
  },
  ofertaImagenOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  ofertaInfo: {
    padding: 12,
  },
  ofertaTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN.colors.text,
    letterSpacing: -0.2,
  },
  ofertaPrecios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ofertaPrecioActual: {
    fontSize: 18,
    fontWeight: '700',
  },
  ofertaPrecioOriginal: {
    fontSize: 12,
    color: DESIGN.colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  // ============================================================
  // CATEGORÍAS
  // ============================================================
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  categoryBadge: {
    width: 24,
    height: 24,
    borderRadius: DESIGN.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  categoryInfo: {
    padding: 10,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN.colors.text,
  },
  categoryDesc: {
    fontSize: 11,
    color: DESIGN.colors.textSecondary,
    marginTop: 1,
  },

  // ============================================================
  // FAVORITOS
  // ============================================================
  favoritoWrapper: {
    paddingVertical: 4,
    marginRight: 14,
  },
  favoritoCard: {
    borderRadius: DESIGN.radius.md,
    padding: 12,
    borderWidth: 1,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  favoritoImagenContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: DESIGN.radius.sm,
    overflow: 'hidden',
    backgroundColor: DESIGN.colors.surface,
  },
  favoritoImagen: {
    width: '100%',
    height: '100%',
  },
  favoritoImagenPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritoImagenEmoji: {
    fontSize: 28,
  },
  favoritoCount: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: DESIGN.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DESIGN.radius.full,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoritoCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: DESIGN.colors.text,
  },
  favoritoInfo: {
    marginTop: 8,
  },
  favoritoNombre: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN.colors.text,
  },
  favoritoPrecio: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN.colors.accent,
    marginTop: 2,
  },
  favoritoBoton: {
    marginTop: 8,
    borderRadius: DESIGN.radius.sm,
    overflow: 'hidden',
  },
  favoritoBotonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  favoritoBotonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },

  // ============================================================
  // LOADING & EMPTY
  // ============================================================
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  loadingContainerSmall: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.lg,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emptyContainerSmall: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: DESIGN.colors.textSecondary,
  },
  emptyTextSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: DESIGN.colors.textSecondary,
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 11,
    color: DESIGN.colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  footerSpacing: {
    height: 20,
  },
});

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const getTexto = useCallback((escala: keyof typeof DISEÑO.TIPOGRAFIA) =>
    getValor(DISEÑO.TIPOGRAFIA[escala]), [getValor]);

  const getEspaciado = useCallback((escala: keyof typeof DISEÑO.ESPACIADO) =>
    getValor(DISEÑO.ESPACIADO[escala]), [getValor]);

  const getRadio = useCallback((escala: keyof typeof DISEÑO.RADIO) =>
    getValor(DISEÑO.RADIO[escala]), [getValor]);

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor, getTexto, getEspaciado, getRadio, spacing };
};

// ============================================================
// 📐 SISTEMA DE DISEÑO
// ============================================================
const DISEÑO = {
  BREAKPOINTS: { TABLET: 768, DESKTOP: 1024, SMALL_PHONE: 375 },
  TIPOGRAFIA: {
    HERO: { tablet: 28, normal: 22, small: 18 },
    TITULO: { tablet: 22, normal: 18, small: 15 },
    SUBTITULO: { tablet: 18, normal: 15, small: 13 },
    CUERPO: { tablet: 16, normal: 14, small: 12 },
    PEQUENO: { tablet: 14, normal: 12, small: 10 },
    MICRO: { tablet: 12, normal: 10, small: 9 },
  },
  ESPACIADO: {
    XL: { tablet: 32, normal: 20, small: 14 },
    LG: { tablet: 24, normal: 16, small: 12 },
    MD: { tablet: 20, normal: 14, small: 10 },
    SM: { tablet: 14, normal: 10, small: 8 },
    XS: { tablet: 10, normal: 8, small: 6 },
  },
  RADIO: {
    LG: { tablet: 20, normal: 16, small: 12 },
    MD: { tablet: 16, normal: 12, small: 10 },
    SM: { tablet: 12, normal: 10, small: 8 },
    XS: { tablet: 8, normal: 6, small: 4 },
  },
};