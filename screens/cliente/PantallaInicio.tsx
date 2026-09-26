// screens/cliente/PantallaInicio.tsx - ADAPTADO AL NUEVO SISTEMA DUAL DE FAVORITOS
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

// ✅ IMÁGENES DE CATEGORÍAS
const hamburguesasImg = require('../../assets/imagenes/categorias/hamburguesaCat.jpg');
const combosImg = require('../../assets/imagenes/categorias/combosCat.jpg');
const bebidasImg = require('../../assets/imagenes/categorias/bebidasCat.jpg');
const postresImg = require('../../assets/imagenes/categorias/postresCat.jpg');
const acompanantesImg = require('../../assets/imagenes/categorias/acompanantes.jpg');
const ofertasImg = require('../../assets/imagenes/categorias/ofertas.jpg');

// ✅ LOGO
const logoKrusty = require('../../assets/icon.png');

// ✅ FONDO SIMPSONS
const springfieldFondo = require('../../assets/imagenes/simpsons/springfieldbannerinicio.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// 📋 CATEGORÍAS
// ============================================================
interface CategoriaData {
  id: string;
  nombre: string;
  imagen: any;
  color: string;
  descripcion: string;
  esOferta?: boolean;
}

interface OfertaInicio {
  id: number;
  titulo: string;
  descripcion?: string;
  descuento?: string;
  precio_original?: number | string | null;
  precio_oferta?: number | string | null;
  imagen?: string;
}

const CATEGORIAS: CategoriaData[] = [
  {
    id: 'ofertas',
    nombre: '🔥 Ofertas',
    imagen: ofertasImg,
    color: DISENO.colors.danger,
    descripcion: 'Descuentos imperdibles',
    esOferta: true,
  },
  {
    id: 'burgers',
    nombre: 'Burgers',
    imagen: hamburguesasImg,
    color: DISENO.colors.danger,
    descripcion: 'Premium',
  },
  {
    id: 'acompanantes',
    nombre: 'Extras',
    imagen: acompanantesImg,
    color: DISENO.colors.warning,
    descripcion: 'Papas, aros y más',
  },
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    imagen: bebidasImg,
    color: DISENO.colors.info,
    descripcion: 'Refrescos y más',
  },
  {
    id: 'postres',
    nombre: 'Postres',
    imagen: postresImg,
    color: DISENO.colors.rosa,
    descripcion: 'Dulces tentaciones',
  },
];

// ============================================================
// 🧠 HELPER: Unificar manuales + ranking sin duplicados
// ============================================================
interface FavoritoConOrigen {
  producto: any;
  origen: 'manual' | 'ranking';
}

const unificarFavoritos = (
  favoritosManuales: any[],
  topRanking: any[],
  maxItems: number = 10
): FavoritoConOrigen[] => {
  const yaIncluidos = new Set<number>();
  const resultado: FavoritoConOrigen[] = [];

  for (const producto of favoritosManuales) {
    if (!producto?.id || yaIncluidos.has(producto.id)) continue;
    yaIncluidos.add(producto.id);
    resultado.push({ producto, origen: 'manual' });
    if (resultado.length >= maxItems) return resultado;
  }

  for (const producto of topRanking) {
    if (!producto?.id || yaIncluidos.has(producto.id)) continue;
    yaIncluidos.add(producto.id);
    resultado.push({ producto, origen: 'ranking' });
    if (resultado.length >= maxItems) return resultado;
  }

  return resultado;
};

// ============================================================
// 🏠 PANTALLA
// ============================================================
export default function PantallaInicio(props: any) {
  const { perfil, esAdministrador, sesion } = tiendaAutenticacion();
  const { agregarProducto } = tiendaCarrito();

  const {
    favoritosManuales,
    topRanking,
    cargando: cargandoFavoritos,
    cargarFavoritos,
    limpiarFavoritos,
  } = tiendaFavoritos();

  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  const [ofertas, setOfertas] = useState<OfertaInicio[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
  const [errorOfertas, setErrorOfertas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [cantidadProductos, setCantidadProductos] = useState<Record<string, number>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (perfil?.id) {
        cargarFavoritos(perfil.id).catch((err) => {
          console.error('❌ Error cargando favoritos:', err);
        });
      } else {
        limpiarFavoritos();
      }
      return () => { };
    }, [perfil?.id, cargarFavoritos, limpiarFavoritos])
  );

  const tamanos = useMemo(() => {
    return {
      padding: responsive.getEspaciado('LG'),
      favoritoWidth: responsive.isDesktop
        ? SCREEN_WIDTH * 0.22
        : responsive.isTablet
          ? SCREEN_WIDTH * 0.3
          : SCREEN_WIDTH * 0.42,
      logoSize: responsive.getValor({ tablet: 180, normal: 160, small: 140 }),
      fondoOffset: responsive.getValor({ tablet: -220, normal: -300, small: -150 }),
      avatarSize: responsive.getValor({ tablet: 56, normal: 48, small: 42 }),
    };
  }, [responsive]);

  const cargarOfertas = useCallback(async () => {
    setCargandoOfertas(true);
    setErrorOfertas(false);
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activa', true)
        .limit(10);
      if (error) throw error;
      setOfertas((data || []) as OfertaInicio[]);
    } catch (error) {
      console.error('❌ Error cargando ofertas:', error);
      setOfertas([]);
      setErrorOfertas(true);
    } finally {
      setCargandoOfertas(false);
    }
  }, []);

  const cargarCantidadProductos = useCallback(async (intento: number = 1) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('categoria')
        .eq('disponible', true);

      if (error) {
        if (error.code === 'PGRST303' && intento < 2) {
          console.log('🔄 Token con fecha futura, reintentando en 1s...');
          await new Promise((r) => setTimeout(r, 1000));
          return cargarCantidadProductos(intento + 1);
        }

        if (error.code === 'PGRST303') {
          console.log('ℹ️ JWT desfasado, ignorando (se resolverá solo)');
          return;
        }

        throw error;
      }

      const conteo: Record<string, number> = {};
      data?.forEach((item: any) => {
        conteo[item.categoria] = (conteo[item.categoria] || 0) + 1;
      });
      setCantidadProductos(conteo);
    } catch (error: any) {
      if (error?.code !== 'PGRST303') {
        console.error('❌ Error contando productos:', error);
      }
    }
  }, []);

  useEffect(() => {
    cargarOfertas();
    cargarCantidadProductos();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 40, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [cargarOfertas, cargarCantidadProductos, fadeAnim, slideAnim, logoScale, logoOpacity]);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    const promesas: Promise<any>[] = [cargarOfertas(), cargarCantidadProductos()];
    if (perfil?.id) promesas.push(cargarFavoritos(perfil.id));
    await Promise.allSettled(promesas);
    setRefrescando(false);
  }, [cargarOfertas, cargarCantidadProductos, cargarFavoritos, perfil?.id]);

  const favoritosUnificados = useMemo(
    () => unificarFavoritos(favoritosManuales, topRanking, 10),
    [favoritosManuales, topRanking]
  );

  const tieneFavoritos = favoritosUnificados.length > 0;
  const todosSonManuales = favoritosUnificados.every((f) => f.origen === 'manual');

  const padding = tamanos.padding;
  const categoriaGridWidth = (SCREEN_WIDTH - padding * 2 - 12) / 2;

  const renderCategoria = useCallback(
    ({ item }: { item: CategoriaData }) => {
      const width = categoriaGridWidth;
      const count = cantidadProductos[item.id] || 0;

      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.categoriaItem,
            {
              width,
              backgroundColor: DISENO.colors.surface,
              borderColor: item.color + '20',
              ...DISENO.shadow.sm,
            },
          ]}
          onPress={() => {
            if (item.esOferta) {
              props.navigation.navigate('Ofertas');
            } else {
              props.navigation.navigate('Menu', { categoria: item.id });
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.categoriaImageContainer}>
            <Image source={item.imagen} style={styles.categoriaImagen} resizeMode="cover" />
          </View>
          <View style={styles.categoriaInfo}>
            <Text
              style={[
                styles.categoriaNombre,
                { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) },
              ]}
              numberOfLines={1}
            >
              {item.nombre}
            </Text>
            <Text
              style={[
                styles.categoriaDesc,
                { fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }) },
              ]}
              numberOfLines={1}
            >
              {item.descripcion}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [categoriaGridWidth, cantidadProductos, responsive, props.navigation]
  );

  const renderFavorito = useCallback(
    ({ item }: { item: FavoritoConOrigen }) => {
      const producto = item.producto;
      if (!producto) return null;

      const esManual = item.origen === 'manual';

      return (
        <TouchableOpacity
          style={[
            styles.favoritoItem,
            {
              width: tamanos.favoritoWidth,
              backgroundColor: DISENO.colors.surface,
              ...DISENO.shadow.sm,
            },
          ]}
          onPress={() => props.navigation.navigate('DetalleProducto', { producto })}
          activeOpacity={0.8}
        >
          <View style={styles.favoritoImageContainer}>
            <Image
              source={{ uri: producto.imagen || 'https://via.placeholder.com/150' }}
              style={styles.favoritoImagen}
              resizeMode="cover"
            />
            <View style={styles.favoritoBadge}>
              <Text style={{ fontSize: 14 }}>{esManual ? '❤️' : '🔥'}</Text>
            </View>
          </View>

          <View style={styles.favoritoInfo}>
            <Text style={styles.favoritoNombre} numberOfLines={1}>
              {producto.nombre}
            </Text>
            <View style={styles.favoritoFooter}>
              <Text style={styles.favoritoPrecio}>{formatearPrecio(producto.precio)}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => agregarProducto(producto)}
              >
                <Ionicons name="add" size={18} color={DISENO.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [tamanos.favoritoWidth, props.navigation, agregarProducto]
  );

  const renderOferta = useCallback(
    ({ item }: { item: OfertaInicio }) => (
      <TouchableOpacity
        style={styles.ofertaCard}
        onPress={() => props.navigation.navigate('DetalleOferta', { oferta: item })}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Ver oferta ${item.titulo}`}
      >
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={styles.ofertaImagen} resizeMode="cover" />
        ) : (
          <View style={styles.ofertaImagenFallback}>
            <Ionicons name="fast-food-outline" size={30} color={DISENO.colors.accent} />
          </View>
        )}
        <View style={styles.ofertaInfo}>
          {!!item.descuento && (
            <Text style={styles.ofertaDescuento} numberOfLines={1}>
              {item.descuento}
            </Text>
          )}
          <Text style={styles.ofertaTitulo} numberOfLines={2}>
            {item.titulo}
          </Text>
          <View style={styles.ofertaPrecioRow}>
            <Text style={styles.ofertaPrecio}>
              {item.precio_oferta !== undefined &&
              item.precio_oferta !== null &&
              Number.isFinite(Number(item.precio_oferta))
                ? formatearPrecio(Number(item.precio_oferta))
                : 'Ver oferta'}
            </Text>
            <Ionicons name="arrow-forward-circle" size={23} color={DISENO.colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [props.navigation]
  );

  const nombreMostrar = perfil?.nombre_cliente || (sesion ? 'Cliente' : 'Invitado');
  const avatarUrl = perfil?.avatar_url;

  // ✅ Ir al perfil (solo si está logueado) y abrir el selector de foto
  const handlePressAvatar = () => {
    if (!sesion || !perfil?.id) return;

    // Si el perfil ya tiene avatar, va a Perfil normal (el usuario ve su foto y la cambia ahí)
    // Si NO tiene avatar, igual va a Perfil — el avatar ? invita a tocarlo para subir uno
    props.navigation.navigate('Principal', { screen: 'Perfil' });
  };

  return (
    <View style={styles.container}>
      {/* ✅ FONDO SIMPSONS A PANTALLA COMPLETA + GRADIENTE SEMITRANSPARENTE */}
      <View style={styles.backgroundGradient}>
        <Image
          source={springfieldFondo}
          style={[
            StyleSheet.absoluteFill,
            { top: tamanos.fondoOffset },
          ]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            'rgba(245,242,237,0.90)',
            'rgba(255,255,255,0.82)',
            'rgba(245,242,237,0.90)',
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + responsive.spacing(12),
            paddingBottom: insets.bottom + responsive.spacing(48) * 2,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={DISENO.colors.accent}
            colors={[DISENO.colors.accent]}
          />
        }
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View style={styles.headerTop}>
            <Animated.Image
              source={logoKrusty}
              style={[
                styles.logoBienvenida,
                {
                  width: tamanos.logoSize,
                  height: tamanos.logoSize,
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
              resizeMode="contain"
            />

            <View style={styles.headerActions}>
              {esAdministrador && (
                <TouchableOpacity
                  style={styles.headerButtonAdmin}
                  onPress={() => props.navigation.navigate('PanelAdmin')}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir panel de administración"
                >
                  <LinearGradient
                    colors={[DISENO.colors.success, DISENO.colors.accentSecondary]}
                    style={styles.headerButtonAdminGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="shield-checkmark" size={20} color={DISENO.colors.text} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {sesion ? (
                <TouchableOpacity
                  onPress={handlePressAvatar}
                  activeOpacity={0.75}
                  disabled={!perfil?.id}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir mi perfil"
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={[
                        styles.avatar,
                        {
                          width: tamanos.avatarSize,
                          height: tamanos.avatarSize,
                          borderRadius: tamanos.avatarSize / 2,
                        },
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        {
                          width: tamanos.avatarSize,
                          height: tamanos.avatarSize,
                          borderRadius: tamanos.avatarSize / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInicial,
                          { fontSize: tamanos.avatarSize * 0.5 },
                        ]}
                      >
                        {nombreMostrar.trim().charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => props.navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-outline" size={16} color={DISENO.colors.accent} />
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.headerGreeting}>Hola, {nombreMostrar}</Text>
            <Text style={styles.headerPrompt}>¿Qué se te antoja hoy?</Text>
          </View>
        </View>

        <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
          <View style={styles.sectionHeading}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }) },
              ]}
            >
              Ofertas para vos
            </Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => props.navigation.navigate('Ofertas')}
              accessibilityRole="button"
              accessibilityLabel="Ver todas las ofertas"
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={16} color={DISENO.colors.accent} />
            </TouchableOpacity>
          </View>

          {cargandoOfertas ? (
            <View style={styles.offerStatus}>
              <ActivityIndicator size="small" color={DISENO.colors.accent} />
              <Text style={styles.offerStatusText}>Buscando ofertas...</Text>
            </View>
          ) : errorOfertas ? (
            <View style={styles.offerStatus}>
              <Text style={styles.offerStatusText}>No pudimos cargar las ofertas.</Text>
              <TouchableOpacity onPress={cargarOfertas} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : ofertas.length > 0 ? (
            <FlatList
              horizontal
              data={ofertas.slice(0, 4)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOferta}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyOffers}>
              <Ionicons name="pricetag-outline" size={20} color={DISENO.colors.textSecondary} />
              <Text style={styles.emptyOffersText}>Por ahora no hay ofertas activas.</Text>
            </View>
          )}
        </View>

        {/* ⭐ SECCIÓN DE FAVORITOS / MÁS PEDIDOS */}
        {cargandoFavoritos && sesion && (
          <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
            <View style={styles.favoritosLoading}>
              <ActivityIndicator size="small" color={DISENO.colors.accent} />
              <Text style={styles.favoritosLoadingText}>Cargando tus favoritos...</Text>
            </View>
          </View>
        )}

        {!cargandoFavoritos && tieneFavoritos && (
          <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 17 }) },
              ]}
            >
              {todosSonManuales ? '⭐ Tus Favoritos' : '⭐ Tus favoritos y más pedidos'}
            </Text>

            <FlatList
              horizontal
              data={favoritosUnificados}
              keyExtractor={(item, index) =>
                item.producto?.id?.toString() || `fav-${index}`
              }
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={tamanos.favoritoWidth + 12}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* CATEGORÍAS EN 2 COLUMNAS */}
        <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
          <View style={styles.sectionHeading}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }) },
              ]}
            >
              Explorá el menú
            </Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => props.navigation.navigate('Menu')}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú completo"
            >
              <Text style={styles.seeAllText}>Ver menú</Text>
              <Ionicons name="chevron-forward" size={16} color={DISENO.colors.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIAS}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoria}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.categoriasRow}
            contentContainerStyle={styles.categoriasGrid}
          />
        </View>

        <View style={styles.footerSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
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
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  logoBienvenida: {
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  avatar: {
    backgroundColor: DISENO.colors.surfaceHover,
    borderWidth: 2,
    borderColor: DISENO.colors.accent + '30',
    ...DISENO.shadow.sm,
  },
  avatarFallback: {
    backgroundColor: DISENO.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DISENO.colors.accent + '50',
    borderStyle: 'dashed',
    ...DISENO.shadow.sm,
  },
  avatarInicial: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
    textAlign: 'center',
  },
  headerGreeting: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
  },
  greetingBlock: {
    marginTop: 10,
  },
  headerPrompt: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    fontSize: 24,
    lineHeight: 29,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: DISENO.radius.full,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '35',
  },
  loginButtonText: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.accent,
  },
  headerButtonAdmin: {
    borderRadius: DISENO.radius.full,
    overflow: 'hidden',
    ...DISENO.shadow.md,
  },
  headerButtonAdminGradient: {
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DISENO.radius.full,
  },
  seccionContainer: {
    marginVertical: 8,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    letterSpacing: -0.3,
    marginBottom: 0,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 8,
  },
  seeAllText: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.accent,
  },
  offerStatus: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: DISENO.radius.md,
    backgroundColor: DISENO.colors.surface,
  },
  offerStatusText: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: DISENO.radius.full,
    backgroundColor: DISENO.colors.accent + '12',
  },
  retryButtonText: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.accent,
  },
  emptyOffers: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: DISENO.radius.md,
    backgroundColor: DISENO.colors.surface,
  },
  emptyOffersText: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
  },
  ofertaCard: {
    width: 264,
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: DISENO.radius.md,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '25',
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  ofertaImagen: {
    width: 88,
    height: 88,
    borderRadius: DISENO.radius.sm,
    backgroundColor: DISENO.colors.surfaceHover,
  },
  ofertaImagenFallback: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DISENO.radius.sm,
    backgroundColor: DISENO.colors.accent + '12',
  },
  ofertaInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
  },
  ofertaDescuento: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    borderRadius: DISENO.radius.full,
    backgroundColor: DISENO.colors.accent + '14',
    color: DISENO.colors.accent,
    fontFamily: FUENTES.display,
    fontSize: 11,
  },
  ofertaTitulo: {
    marginTop: 5,
    fontFamily: FUENTES.display,
    fontSize: 15,
    lineHeight: 19,
    color: DISENO.colors.text,
  },
  ofertaPrecioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ofertaPrecio: {
    fontFamily: FUENTES.display,
    fontSize: 15,
    color: DISENO.colors.accent,
  },
  horizontalList: {
    paddingVertical: 4,
    gap: 12,
  },
  categoriasRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoriasGrid: {
    paddingVertical: 4,
  },
  favoritosLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  favoritosLoadingText: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
  },
  categoriaItem: {
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  categoriaImageContainer: {
    width: '100%',
    aspectRatio: 1.55,
    position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
  },
  categoriaImagen: {
    width: '100%',
    height: '100%',
  },
  categoriaInfo: {
    padding: 10,
    alignItems: 'center',
  },
  categoriaNombre: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    textAlign: 'center',
  },
  categoriaDesc: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  favoritoItem: {
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DISENO.colors.surfaceHover,
    marginRight: 12,
  },
  favoritoImageContainer: {
    width: '100%',
    height: 110,
    position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
  },
  favoritoImagen: {
    width: '100%',
    height: '100%',
  },
  favoritoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: DISENO.colors.surface,
    padding: 6,
    borderRadius: DISENO.radius.full,
    ...DISENO.shadow.sm,
  },
  favoritoInfo: {
    padding: 10,
  },
  favoritoNombre: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.text,
    marginBottom: 6,
  },
  favoritoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoritoPrecio: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.accent,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: DISENO.colors.accent,
    padding: 6,
    borderRadius: DISENO.radius.full,
  },
  footerSpacing: {
    height: 150,
  },
});