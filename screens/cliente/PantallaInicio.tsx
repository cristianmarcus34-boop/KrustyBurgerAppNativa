// screens/cliente/PantallaInicio.tsx - CON SIMPSONFONT Y DISEÑO CENTRALIZADO
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
// ✅ IMPORTAMOS DISEÑO CENTRALIZADO
import { DISENO, useResponsive } from '../../lib/colores';
// ✅ IMPORTAMOS FUENTES
import { FUENTES, TAMANOS_DISPLAY } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

// ✅ IMPORTAR IMÁGENES DE CATEGORÍAS
const hamburguesasImg = require('../../assets/imagenes/categorias/hamburguesaCat.jpg');
const combosImg = require('../../assets/imagenes/categorias/combosCat.jpg');
const bebidasImg = require('../../assets/imagenes/categorias/bebidasCat.jpg');
const postresImg = require('../../assets/imagenes/categorias/postresCat.jpg');
const acompanantesImg = require('../../assets/imagenes/categorias/acompanantes.jpg');
const ofertasImg = require('../../assets/imagenes/categorias/ofertas.jpg');

// ✅ IMPORTAR LOGO DE KRUSTY
const logoKrusty = require('../../assets/icon.png');

// ✅ IMPORTAR IMAGEN DE BIENVENIDA
const bienvenidaImg = require('../../assets/imagenes/bienvenidos.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// 📋 CONFIGURACIÓN DE CATEGORÍAS
// ============================================================
interface CategoriaData {
  id: string;
  nombre: string;
  imagen: any;
  color: string;
  descripcion: string;
  esOferta?: boolean;
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
    id: 'burgers',   // ✅ Cambiado para que coincida con Menu y DB
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
// 🏠 PANTALLA DE INICIO
// ============================================================
export default function PantallaInicio(props: any) {
  const { perfil, esAdministrador } = tiendaAutenticacion();
  const { agregarProducto } = tiendaCarrito();
  const { favoritos, cargando: cargandoFavoritos, cargarFavoritos, limpiarFavoritos } = tiendaFavoritos();

  // ✅ USAMOS EL HOOK CENTRALIZADO
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

  useFocusEffect(
    useCallback(() => {
      console.log('🔍 [Inicio] Ejecutando useFocusEffect, perfil.id =', perfil?.id);

      if (perfil?.id) {
        console.log('🔍 [Inicio] Llamando cargarFavoritos con:', perfil.id);

        cargarFavoritos(perfil.id).then(() => {
          const state = tiendaFavoritos.getState();
          console.log('🔍 [Inicio] DESPUÉS de cargar:');
          console.log('   - favoritos.length:', state.favoritos.length);
          console.log('   - idsFavoritos.length:', state.idsFavoritos.length);
          console.log('   - favoritos:', JSON.stringify(state.favoritos.map(f => f.id)));
          console.log('   - cargando:', state.cargando);
        }).catch((err) => {
          console.error('🔍 [Inicio] ERROR en cargarFavoritos:', err);
        });
      } else {
        console.log('🔍 [Inicio] perfil.id es null/undefined, no se cargan favoritos');
      }
      return () => { };
    }, [perfil?.id, cargarFavoritos])
  );

  // ============================================================
  // 📐 TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getEspaciado('LG'),
    categoriaWidth: responsive.isDesktop ? SCREEN_WIDTH * 0.18 :
      responsive.isTablet ? SCREEN_WIDTH * 0.25 : SCREEN_WIDTH * 0.35,
    favoritoWidth: responsive.isDesktop ? SCREEN_WIDTH * 0.22 :
      responsive.isTablet ? SCREEN_WIDTH * 0.30 : SCREEN_WIDTH * 0.42,
    logoSize: responsive.getValor({ tablet: 600, normal: 600, small: 115 }),
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
        .eq('activa', true)
        .limit(10);
      if (error) throw error;
      setOfertas(data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setOfertas([]);
    } finally {
      setCargandoOfertas(false);
    }
  }, []);

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

  const cargarFavoritosUsuario = useCallback(async () => {
    if (perfil?.id) {
      await cargarFavoritos(perfil.id);
    } else {
      limpiarFavoritos();
    }
  }, [perfil?.id, cargarFavoritos, limpiarFavoritos]);

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
  }, [cargarOfertas, cargarFavoritosUsuario, cargarCantidadProductos, fadeAnim, slideAnim, logoScale, logoOpacity]);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarOfertas(), cargarFavoritosUsuario(), cargarCantidadProductos()]);
    setRefrescando(false);
  }, [cargarOfertas, cargarFavoritosUsuario, cargarCantidadProductos]);

  // ============================================================
  // 🖼️ RENDER DE CATEGORÍA
  // ============================================================
  const renderCategoria = useCallback(({ item }: { item: CategoriaData }) => {
    const width = tamanos.categoriaWidth;
    const count = cantidadProductos[item.id] || 0;
    const cantidadMostrar = item.esOferta ? ofertas.length : count;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.categoriaItem,
          {
            width: width,
            backgroundColor: DISENO.colors.surface,
            borderColor: item.color + '20',
            ...DISENO.shadow.sm,
          }
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
              {
                fontSize: responsive.getValor({ tablet: 16, normal: 12, small: 12 })
              }
            ]}
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          <Text
            style={[
              styles.categoriaDesc,
              {
                fontSize: responsive.getValor({ tablet: 11, normal: 8, small: 8 })
              }
            ]}
            numberOfLines={1}
          >
            {item.descripcion}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [tamanos.categoriaWidth, cantidadProductos, ofertas.length, responsive, props.navigation]);

  // ============================================================
  // ⭐ RENDER DE FAVORITO RÁPIDO
  // ============================================================
  const renderFavorito = useCallback(({ item }: { item: any }) => {
    const producto = item.productos || item;
    if (!producto) return null;

    return (
      <TouchableOpacity
        style={[
          styles.favoritoItem,
          {
            width: tamanos.favoritoWidth,
            backgroundColor: DISENO.colors.surface,
            ...DISENO.shadow.sm,
          }
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
            <Ionicons name="heart" size={14} color={DISENO.colors.danger} />
          </View>
        </View>

        <View style={styles.favoritoInfo}>
          <Text style={styles.favoritoNombre} numberOfLines={1}>
            {producto.nombre}
          </Text>
          <View style={styles.favoritoFooter}>
            <Text style={styles.favoritoPrecio}>
              {formatearPrecio(producto.precio)}
            </Text>
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
  }, [tamanos.favoritoWidth, props.navigation, agregarProducto]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const padding = tamanos.padding;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
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
            tintColor={DISENO.colors.accent}
            colors={[DISENO.colors.accent]}
          />
        }
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View style={styles.headerLeft}>
            <Animated.View
              style={[
                styles.bienvenidaContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                }
              ]}
            >
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

            <View style={styles.saludoContainer}>
              <Text
                style={[
                  styles.headerGreeting,
                  {
                    fontSize: responsive.getValor({ tablet: 15, normal: 12, small: 11 })
                  }
                ]}
              >
                Hola
              </Text>
              <Text
                style={[
                  styles.headerName,
                  {
                    fontSize: responsive.getValor({ tablet: 30, normal: 24, small: 22 })
                  }
                ]}
              >
                {perfil?.nombre_cliente || 'Cliente'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {esAdministrador && (
              <TouchableOpacity
                style={styles.headerButtonAdmin}
                onPress={() => props.navigation.navigate('PanelAdmin')}
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
          </View>
        </View>

        {/* ⭐ SECCIÓN DE FAVORITOS RÁPIDOS */}
        {favoritos && favoritos.length > 0 && (
          <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 17 }) }
              ]}
            >
              ⭐ Tus Favoritos
            </Text>

            <FlatList
              horizontal
              data={favoritos}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={tamanos.favoritoWidth + 12}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* CATEGORÍAS */}
        <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 17 })
              }
            ]}
          >
            Categorías
          </Text>

          <FlatList
            horizontal
            data={CATEGORIAS}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoria}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={tamanos.categoriaWidth + 12}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        </View>

        <View style={styles.footerSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - USANDO DISENO CENTRALIZADO Y FUENTES
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 0,
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
  bienvenidaContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  bienvenidaImagen: {
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginTop: -100,
    marginBottom: -300,
    marginLeft: 0,
  },
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: -100,
    marginLeft: 0,
    marginTop: 0,
  },
  saludoContainer: {
    marginTop: 2,
  },
  headerGreeting: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    letterSpacing: 0.3,
    fontWeight: '400',
    marginBottom: 2,
  },
  headerName: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    letterSpacing: -0.5,
    marginTop: 0,
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
  sectionTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.verde,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  horizontalList: {
    paddingVertical: 4,
    gap: 12,
  },
  categoriaItem: {
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 12,
  },
  categoriaImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
  },
  categoriaImagen: {
    width: '100%',
    height: '100%',
  },
  categoriaInfo: {
    padding: 8,
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
    opacity: 0.6,
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
    height: 20,
  },
});