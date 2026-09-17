// screens/cliente/PantallaInicio.tsx - ADAPTADO AL NUEVO SISTEMA DUAL DE FAVORITOS
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

// ✅ LOGO Y BIENVENIDA
const logoKrusty = require('../../assets/icon.png');
const bienvenidaImg = require('../../assets/imagenes/bienvenidos.png');

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

  // 1. Primero los favoritos manuales (❤️)
  for (const producto of favoritosManuales) {
    if (!producto?.id || yaIncluidos.has(producto.id)) continue;
    yaIncluidos.add(producto.id);
    resultado.push({ producto, origen: 'manual' });
    if (resultado.length >= maxItems) return resultado;
  }

  // 2. Después el ranking (🔥), sin duplicar
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

  // ✅ NUEVO: usamos las dos listas
  const {
    favoritosManuales,
    topRanking,
    cargando: cargandoFavoritos,
    cargarFavoritos,
    limpiarFavoritos,
  } = tiendaFavoritos();

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
  // 🎬 CARGAR FAVORITOS AL ENFOCAR
  // ============================================================
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

  // ============================================================
  // 📐 TAMAÑOS
  // ============================================================
  const tamanos = useMemo(
    () => ({
      padding: responsive.getEspaciado('LG'),
      categoriaWidth: responsive.isDesktop
        ? SCREEN_WIDTH * 0.18
        : responsive.isTablet
          ? SCREEN_WIDTH * 0.25
          : SCREEN_WIDTH * 0.35,
      favoritoWidth: responsive.isDesktop
        ? SCREEN_WIDTH * 0.22
        : responsive.isTablet
          ? SCREEN_WIDTH * 0.3
          : SCREEN_WIDTH * 0.42,
      logoSize: responsive.getValor({ tablet: 180, normal: 160, small: 115 }),
      bienvenidaSize: responsive.getValor({ tablet: 240, normal: 300, small: 180 }),
    }),
    [responsive]
  );

  // ============================================================
  // 🔄 CARGA DE DATOS
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
      console.error('❌ Error cargando ofertas:', error);
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
      console.error('❌ Error contando productos:', error);
    }
  }, []);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
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
    await Promise.all(promesas);
    setRefrescando(false);
  }, [cargarOfertas, cargarCantidadProductos, cargarFavoritos, perfil?.id]);

  // ============================================================
  // 📊 UNIFICAR FAVORITOS
  // ============================================================
  const favoritosUnificados = useMemo(
    () => unificarFavoritos(favoritosManuales, topRanking, 10),
    [favoritosManuales, topRanking]
  );

  const tieneFavoritos = favoritosUnificados.length > 0;
  const todosSonManuales = favoritosUnificados.every((f) => f.origen === 'manual');

  // ============================================================
  // 🖼️ RENDER CATEGORÍA
  // ============================================================
  const renderCategoria = useCallback(
    ({ item }: { item: CategoriaData }) => {
      const width = tamanos.categoriaWidth;
      const count = cantidadProductos[item.id] || 0;
      const cantidadMostrar = item.esOferta ? ofertas.length : count;

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
                { fontSize: responsive.getValor({ tablet: 16, normal: 12, small: 12 }) },
              ]}
              numberOfLines={1}
            >
              {item.nombre}
            </Text>
            <Text
              style={[
                styles.categoriaDesc,
                { fontSize: responsive.getValor({ tablet: 11, normal: 8, small: 8 }) },
              ]}
              numberOfLines={1}
            >
              {item.descripcion}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [tamanos.categoriaWidth, cantidadProductos, ofertas.length, responsive, props.navigation]
  );

  // ============================================================
  // ⭐ RENDER FAVORITO (con badge de origen)
  // ============================================================
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
            {/* ✅ BADGE de origen: ❤️ si es manual, 🔥 si es ranking */}
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

  // ============================================================
  // 🏗️ RENDER
  // ============================================================
  const padding = tamanos.padding;
  const nombreMostrar = perfil?.nombre_cliente || (sesion ? 'Cliente' : 'Invitado');

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
        {/* HEADER */}
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <View style={styles.headerLeft}>
            <Animated.View
              style={[
                styles.bienvenidaContainer,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <Image
                source={bienvenidaImg}
                style={[
                  styles.bienvenidaImagen,
                  { width: tamanos.bienvenidaSize, height: tamanos.bienvenidaSize },
                ]}
                resizeMode="contain"
              />
              <Image
                source={logoKrusty}
                style={[
                  styles.logoBienvenida,
                  { width: tamanos.logoSize, height: tamanos.logoSize },
                ]}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.saludoContainer}>
              <Text
                style={[
                  styles.headerGreeting,
                  { fontSize: responsive.getValor({ tablet: 15, normal: 12, small: 11 }) },
                ]}
              >
                Hola
              </Text>
              <Text
                style={[
                  styles.headerName,
                  { fontSize: responsive.getValor({ tablet: 30, normal: 24, small: 22 }) },
                ]}
              >
                {nombreMostrar}
              </Text>
            </View>

            {/* ✅ CTA login para invitados */}
            {!sesion && (
              <TouchableOpacity
                style={styles.loginCTA}
                onPress={() => props.navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                  style={styles.loginCTAGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-in-outline" size={16} color={DISENO.colors.surface} />
                  <Text style={styles.loginCTATexto}>Iniciar sesión / Registrarse</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
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

        {/* CATEGORÍAS */}
        <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 17 }) },
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
    marginTop: -40,
    marginBottom: -60,
    marginLeft: 0,
  },
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: -30,
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
  loginCTA: {
    marginTop: 12,
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    ...DISENO.shadow.sm,
  },
  loginCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginCTATexto: {
    fontFamily: FUENTES.display,
    fontSize: 12,
    color: DISENO.colors.surface,
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
  // ✅ Loading de favoritos
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