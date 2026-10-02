// screens/cliente/PantallaInicio.tsx - V8 (fix Ver todas en Galaxy A20)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated as RNAnimated,
  RefreshControl,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

// ✅ ASSETS
const hamburguesasImg = require('../../assets/imagenes/categorias/hamburguesaCat.jpg');
const bebidasImg = require('../../assets/imagenes/categorias/bebidasCat.jpg');
const postresImg = require('../../assets/imagenes/categorias/postresCat.jpg');
const acompanantesImg = require('../../assets/imagenes/categorias/acompanantes.jpg');
const ofertasImg = require('../../assets/imagenes/categorias/ofertas.jpg');
const logoKrusty = require('../../assets/icon.png');
const springfieldFondo = require('../../assets/imagenes/simpsons/springfieldbannerinicio.jpg');

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface Tamanos {
  padding: number;
  logoSize: number;
  logoHorizontalMargin: number;
  avatarSize: number;
  adminButtonSize: number;
  greetingSize: number;
  promptSize: number;
  heroHeight: number;
  heroTitleSize: number;
  heroSubtitleSize: number;
  heroCtaPaddingH: number;
  heroCtaPaddingV: number;
  categoriaSize: number;
  categoriaIconSize: number;
  categoriaNombreSize: number;
  categoriaCountSize: number;
  favoritoWidth: number;
  favoritoImageHeight: number;
  favoritoNombreSize: number;
  favoritoPrecioSize: number;
  ofertaCardWidth: number;
  ofertaCardHeight: number;
  ofertaImageSize: number;
  ofertaTituloSize: number;
  ofertaPrecioSize: number;
  sectionTitleSize: number;
  seeAllSize: number;
  fondoOffset: number;
}

const calcularTamanos = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmall: boolean,
): Tamanos => {
  const padding = isDesktop ? 40 : isTablet ? 32 : isSmall ? 16 : 20;

  const anchoUtil = width - padding * 2;
  const logoBase = anchoUtil * 0.85;

  const logoSize = isDesktop
    ? Math.min(logoBase, 520)
    : isTablet
      ? Math.min(logoBase, 460)
      : isSmall
        ? Math.min(logoBase, 320)
        : Math.min(logoBase, 400);

  const logoHorizontalMargin = isDesktop ? 40 : isTablet ? 32 : isSmall ? 12 : 16;
  const avatarSize = isDesktop ? 64 : isTablet ? 58 : isSmall ? 44 : 50;
  const adminButtonSize = isDesktop ? 56 : isTablet ? 52 : isSmall ? 42 : 46;
  const greetingSize = isDesktop ? 18 : isTablet ? 17 : isSmall ? 14 : 16;
  const promptSize = isDesktop ? 34 : isTablet ? 30 : isSmall ? 22 : 27;

  const heroHeight = isDesktop ? 360 : isTablet ? 320 : isSmall ? 260 : 300;
  const heroTitleSize = isDesktop ? 30 : isTablet ? 28 : isSmall ? 22 : 25;
  const heroSubtitleSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 12 : 13;
  const heroCtaPaddingH = isDesktop ? 20 : isTablet ? 18 : isSmall ? 14 : 16;
  const heroCtaPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmall ? 10 : 12;

  const categoriaBase = Math.min(width * 0.24, 130);
  const categoriaSize = isDesktop
    ? 130
    : isTablet
      ? 118
      : isSmall
        ? 84
        : Math.max(categoriaBase, 92);

  const categoriaIconSize = isDesktop ? 18 : isTablet ? 16 : isSmall ? 13 : 14;
  const categoriaNombreSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 12 : 13;
  const categoriaCountSize = isDesktop ? 12 : isTablet ? 11 : isSmall ? 10 : 11;

  const favoritoWidth = isDesktop
    ? Math.min(width * 0.22, 240)
    : isTablet
      ? Math.min(width * 0.32, 280)
      : isSmall
        ? width * 0.58
        : width * 0.48;

  const favoritoImageHeight = isDesktop ? 160 : isTablet ? 145 : isSmall ? 115 : 135;
  const favoritoNombreSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 12 : 13;
  const favoritoPrecioSize = isDesktop ? 14 : isTablet ? 13 : isSmall ? 11 : 12;

  const ofertaCardWidth = isDesktop
    ? 400
    : isTablet
      ? 360
      : isSmall
        ? Math.min(width * 0.85, 270)
        : Math.min(width * 0.78, 310);

  const ofertaCardHeight = isDesktop ? 150 : isTablet ? 140 : isSmall ? 120 : 130;
  const ofertaImageSize = isDesktop ? 120 : isTablet ? 110 : isSmall ? 88 : 100;
  const ofertaTituloSize = isDesktop ? 18 : isTablet ? 17 : isSmall ? 14 : 15;
  const ofertaPrecioSize = isDesktop ? 18 : isTablet ? 17 : isSmall ? 14 : 15;

  const sectionTitleSize = isDesktop ? 26 : isTablet ? 24 : isSmall ? 18 : 21;
  const seeAllSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 13 : 14;

  const fondoOffset = isDesktop ? -380 : isTablet ? -300 : isSmall ? -140 : -220;

  return {
    padding,
    logoSize,
    logoHorizontalMargin,
    avatarSize,
    adminButtonSize,
    greetingSize,
    promptSize,
    heroHeight,
    heroTitleSize,
    heroSubtitleSize,
    heroCtaPaddingH,
    heroCtaPaddingV,
    categoriaSize,
    categoriaIconSize,
    categoriaNombreSize,
    categoriaCountSize,
    favoritoWidth,
    favoritoImageHeight,
    favoritoNombreSize,
    favoritoPrecioSize,
    ofertaCardWidth,
    ofertaCardHeight,
    ofertaImageSize,
    ofertaTituloSize,
    ofertaPrecioSize,
    sectionTitleSize,
    seeAllSize,
    fondoOffset,
  };
};

// ============================================================
// 📋 TIPOS
// ============================================================
interface CategoriaData {
  id: string;
  nombre: string;
  imagen: any;
  color: string;
  descripcion: string;
  icono: keyof typeof Ionicons.glyphMap;
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

interface FavoritoConOrigen {
  producto: any;
  origen: 'manual' | 'ranking';
}

// ============================================================
// 📋 CATEGORÍAS
// ============================================================
const CATEGORIAS: CategoriaData[] = [
  { id: 'ofertas', nombre: 'Ofertas', imagen: ofertasImg, color: DISENO.colors.danger, descripcion: 'Descuentos', icono: 'flame', esOferta: true },
  { id: 'burgers', nombre: 'Burgers', imagen: hamburguesasImg, color: DISENO.colors.danger, descripcion: 'Premium', icono: 'fast-food' },
  { id: 'acompanantes', nombre: 'Extras', imagen: acompanantesImg, color: DISENO.colors.warning, descripcion: 'Papas y más', icono: 'pizza' },
  { id: 'bebidas', nombre: 'Bebidas', imagen: bebidasImg, color: DISENO.colors.info, descripcion: 'Refrescos', icono: 'beer' },
  { id: 'postres', nombre: 'Postres', imagen: postresImg, color: DISENO.colors.rosa, descripcion: 'Dulces', icono: 'ice-cream' },
];

// ============================================================
// 🧠 HELPER
// ============================================================
const unificarFavoritos = (
  favoritosManuales: any[],
  topRanking: any[],
  maxItems: number = 10,
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
// 🔘 BOTÓN AGREGAR
// ============================================================
const AddButton: React.FC<{ onPress: () => void; size?: number; nombre?: string }> = ({
  onPress,
  size = 32,
  nombre,
}) => {
  const [added, setAdded] = useState(false);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handle = () => {
    if (added) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    scale.value = withSequence(
      withSpring(0.82, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    setAdded(true);
    onPress();
    Toast.show({
      type: 'success',
      text1: '¡Agregado al carrito!',
      text2: nombre || 'Producto añadido',
      visibilityTime: 1500,
      position: 'bottom',
    });
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handle}
        activeOpacity={0.85}
        style={[
          styles.addButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: added ? DISENO.colors.success : DISENO.colors.accent,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={added ? 'Agregado' : 'Agregar al carrito'}
      >
        <Ionicons name={added ? 'checkmark' : 'add'} size={size * 0.55} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================
// 💀 SKELETON CARD
// ============================================================
const SkeletonCard: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 16, backgroundColor: DISENO.colors.surfaceHover },
        style,
      ]}
    />
  );
};

// ============================================================
// 🎯 COMPONENTE REUTILIZABLE: "Ver todas" / "Ver menú"
// ============================================================
const BotonVer: React.FC<{
  texto: string;
  onPress: () => void;
  fontSize: number;
}> = ({ texto, onPress, fontSize }) => (
  <TouchableOpacity
    style={styles.botonVer}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={texto}
  >
    <Text
      style={[styles.botonVerTexto, { fontSize }]}
      numberOfLines={1}
      allowFontScaling={false}
    >
      {texto}
    </Text>
    <Ionicons
      name="chevron-forward"
      size={14}
      color={DISENO.colors.accent}
      style={{ marginLeft: 2 }}
    />
  </TouchableOpacity>
);

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const tamanos = useMemo(
    () =>
      calcularTamanos(
        screenWidth,
        screenHeight,
        responsive.isTablet,
        responsive.isDesktop,
        responsive.isSmallPhone
      ),
    [screenWidth, screenHeight, responsive.isTablet, responsive.isDesktop, responsive.isSmallPhone],
  );

  const [ofertas, setOfertas] = useState<OfertaInicio[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
  const [errorOfertas, setErrorOfertas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [cantidadProductos, setCantidadProductos] = useState<Record<string, number>>({});
  const [ofertaActiva, setOfertaActiva] = useState(0);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(25)).current;
  const logoScale = useRef(new RNAnimated.Value(0.85)).current;
  const logoOpacity = useRef(new RNAnimated.Value(0)).current;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  useFocusEffect(
    useCallback(() => {
      if (perfil?.id) {
        cargarFavoritos(perfil.id).catch((err) => console.error('❌ favoritos:', err));
      } else {
        limpiarFavoritos();
      }
      return () => { };
    }, [perfil?.id, cargarFavoritos, limpiarFavoritos]),
  );

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
      console.error('❌ ofertas:', error);
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
          await new Promise((r) => setTimeout(r, 1000));
          return cargarCantidadProductos(intento + 1);
        }
        if (error.code === 'PGRST303') return;
        throw error;
      }
      const conteo: Record<string, number> = {};
      data?.forEach((item: any) => {
        conteo[item.categoria] = (conteo[item.categoria] || 0) + 1;
      });
      setCantidadProductos(conteo);
    } catch (error: any) {
      if (error?.code !== 'PGRST303') console.error('❌ conteo:', error);
    }
  }, []);

  useEffect(() => {
    cargarOfertas();
    cargarCantidadProductos();
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      RNAnimated.spring(slideAnim, { toValue: 0, friction: 12, tension: 40, useNativeDriver: true }),
      RNAnimated.spring(logoScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
      RNAnimated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [cargarOfertas, cargarCantidadProductos, fadeAnim, slideAnim, logoScale, logoOpacity]);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    const promesas: Promise<any>[] = [cargarOfertas(), cargarCantidadProductos()];
    if (perfil?.id) promesas.push(cargarFavoritos(perfil.id));
    await Promise.allSettled(promesas);
    setRefrescando(false);
  }, [cargarOfertas, cargarCantidadProductos, cargarFavoritos, perfil?.id]);

  // ============================================================
  // DERIVADOS
  // ============================================================
  const favoritosUnificados = useMemo(
    () => unificarFavoritos(favoritosManuales, topRanking, 10),
    [favoritosManuales, topRanking],
  );
  const tieneFavoritos = favoritosUnificados.length > 0;
  const todosSonManuales = favoritosUnificados.every((f) => f.origen === 'manual');
  const ofertaHero = ofertas[0];

  const padding = tamanos.padding;
  const nombreMostrar = perfil?.nombre_cliente || (sesion ? 'Cliente' : 'Invitado');
  const avatarUrl = perfil?.avatar_url;

  const handlePressAvatar = () => {
    if (!sesion || !perfil?.id) return;
    Haptics.selectionAsync().catch(() => { });
    props.navigation.navigate('Principal', { screen: 'Perfil' });
  };

  // ============================================================
  // RENDER: categoría
  // ============================================================
  const renderCategoria = useCallback(
    ({ item, index }: { item: CategoriaData; index: number }) => {
      const count = cantidadProductos[item.id] || 0;
      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
          <TouchableOpacity
            style={styles.categoriaItem}
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              if (item.esOferta) props.navigation.navigate('Ofertas');
              else props.navigation.navigate('Menu', { categoria: item.id });
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${item.nombre}, ${count} productos`}
          >
            <View style={styles.categoriaImageWrap}>
              <Image
                source={item.imagen}
                style={{
                  width: tamanos.categoriaSize,
                  height: tamanos.categoriaSize,
                  borderRadius: tamanos.categoriaSize / 2,
                  backgroundColor: DISENO.colors.surfaceHover,
                }}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.categoriaIconBadge,
                  { backgroundColor: item.color },
                ]}
              >
                <Ionicons name={item.icono} size={tamanos.categoriaIconSize} color="#fff" />
              </View>
            </View>
            <Text
              style={[styles.categoriaNombre, { fontSize: tamanos.categoriaNombreSize }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {item.nombre}
            </Text>
            {count > 0 && (
              <Text
                style={[styles.categoriaCount, { fontSize: tamanos.categoriaCountSize }]}
                allowFontScaling={false}
              >
                {count} items
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [cantidadProductos, tamanos, props.navigation],
  );

  // ============================================================
  // RENDER: favorito
  // ============================================================
  const renderFavorito = useCallback(
    ({ item, index }: { item: FavoritoConOrigen; index: number }) => {
      const producto = item.producto;
      if (!producto) return null;
      const esManual = item.origen === 'manual';
      return (
        <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
          <Shadow
            distance={6}
            startColor="rgba(0,0,0,0.06)"
            offset={[0, 3]}
            style={{ borderRadius: DISENO.radius.md, marginRight: 12 }}
          >
            <TouchableOpacity
              style={[
                styles.favoritoItem,
                { width: tamanos.favoritoWidth, backgroundColor: DISENO.colors.surface },
              ]}
              onPress={() => props.navigation.navigate('DetalleProducto', { producto })}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.favoritoImageContainer,
                  { height: tamanos.favoritoImageHeight },
                ]}
              >
                <Image
                  source={{ uri: producto.imagen || 'https://via.placeholder.com/300' }}
                  style={styles.favoritoImagen}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.favoritoBadge,
                    esManual ? styles.badgeManual : styles.badgeRanking,
                  ]}
                >
                  <Ionicons
                    name={esManual ? 'heart' : 'flame'}
                    size={12}
                    color={esManual ? '#E63946' : '#FF6B00'}
                  />
                </View>
              </View>
              <View style={styles.favoritoInfo}>
                <Text
                  style={[styles.favoritoNombre, { fontSize: tamanos.favoritoNombreSize }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {producto.nombre}
                </Text>
                <View style={styles.favoritoFooter}>
                  <Text
                    style={[styles.favoritoPrecio, { fontSize: tamanos.favoritoPrecioSize }]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(producto.precio)}
                  </Text>
                  <AddButton
                    onPress={() => agregarProducto(producto)}
                    size={30}
                    nombre={producto.nombre}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Shadow>
        </Animated.View>
      );
    },
    [tamanos, props.navigation, agregarProducto],
  );

  // ============================================================
  // RENDER: oferta
  // ============================================================
  const renderOferta = useCallback(
    ({ item }: { item: OfertaInicio }) => (
      <TouchableOpacity
        style={[
          styles.ofertaCard,
          {
            width: tamanos.ofertaCardWidth,
            minHeight: tamanos.ofertaCardHeight,
          },
        ]}
        onPress={() => {
          Haptics.selectionAsync().catch(() => { });
          props.navigation.navigate('DetalleOferta', { oferta: item });
        }}
        activeOpacity={0.85}
      >
        {item.imagen ? (
          <Image
            source={{ uri: item.imagen }}
            style={[
              styles.ofertaImagen,
              { width: tamanos.ofertaImageSize, height: tamanos.ofertaImageSize },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.ofertaImagenFallback,
              { width: tamanos.ofertaImageSize, height: tamanos.ofertaImageSize },
            ]}
          >
            <Ionicons name="fast-food-outline" size={30} color={DISENO.colors.accent} />
          </View>
        )}
        <View style={styles.ofertaInfo}>
          {!!item.descuento && (
            <Text style={styles.ofertaDescuento} numberOfLines={1} allowFontScaling={false}>
              {item.descuento}
            </Text>
          )}
          <Text
            style={[styles.ofertaTitulo, { fontSize: tamanos.ofertaTituloSize }]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {item.titulo}
          </Text>
          <View style={styles.ofertaPrecioRow}>
            <Text
              style={[styles.ofertaPrecio, { fontSize: tamanos.ofertaPrecioSize }]}
              allowFontScaling={false}
            >
              {item.precio_oferta != null && Number.isFinite(Number(item.precio_oferta))
                ? formatearPrecio(Number(item.precio_oferta))
                : 'Ver oferta'}
            </Text>
            <Ionicons name="arrow-forward-circle" size={23} color={DISENO.colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [tamanos, props.navigation],
  );

  // ============================================================
  // RETURN
  // ============================================================
  return (
    <View style={styles.container}>
      {/* FONDO */}
      <View style={styles.backgroundGradient}>
        <Image
          source={springfieldFondo}
          style={[StyleSheet.absoluteFill, { top: tamanos.fondoOffset }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(245,242,237,0.90)', 'rgba(255,255,255,0.82)', 'rgba(245,242,237,0.90)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 100,
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
      >
        {/* ============ HEADER ============ */}
        <RNAnimated.View
          style={[
            styles.header,
            {
              paddingHorizontal: padding,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {esAdministrador && (
            <View style={styles.headerActionsTop}>
              <TouchableOpacity
                style={[
                  styles.headerButtonAdmin,
                  {
                    width: tamanos.adminButtonSize,
                    height: tamanos.adminButtonSize,
                    borderRadius: tamanos.adminButtonSize / 2,
                  },
                ]}
                onPress={() => props.navigation.navigate('PanelAdmin')}
                accessibilityRole="button"
                accessibilityLabel="Panel de administración"
              >
                <LinearGradient
                  colors={[DISENO.colors.success, DISENO.colors.accentSecondary]}
                  style={[
                    styles.headerButtonAdminGradient,
                    {
                      width: tamanos.adminButtonSize,
                      height: tamanos.adminButtonSize,
                      borderRadius: tamanos.adminButtonSize / 2,
                    },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={tamanos.adminButtonSize * 0.45}
                    color={DISENO.colors.text}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <RNAnimated.Image
            source={logoKrusty}
            style={{
              width: tamanos.logoSize,
              height: tamanos.logoSize,
              alignSelf: 'center',
              marginVertical: tamanos.logoHorizontalMargin,
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              backgroundColor: 'transparent',
            }}
            resizeMode="contain"
          />

          <View style={styles.greetingRow}>
            <View style={styles.greetingTextBlock}>
              <Text
                style={[styles.headerGreeting, { fontSize: tamanos.greetingSize }]}
                allowFontScaling={false}
              >
                Hola, {nombreMostrar} 👋
              </Text>
              <Text
                style={[styles.headerPrompt, { fontSize: tamanos.promptSize }]}
                allowFontScaling={false}
              >
                ¿Qué se te antoja hoy?
              </Text>
            </View>

            {sesion ? (
              <TouchableOpacity
                onPress={handlePressAvatar}
                activeOpacity={0.75}
                disabled={!perfil?.id}
                style={{ marginLeft: 12 }}
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
                        { fontSize: tamanos.avatarSize * 0.45 },
                      ]}
                      allowFontScaling={false}
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
                <Text style={styles.loginButtonText} allowFontScaling={false}>
                  Entrar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </RNAnimated.View>

        {/* ============ HERO ============ */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={[styles.heroWrap, { paddingHorizontal: padding }]}
        >
          <Shadow
            distance={0}
            startColor="rgba(0,0,0,0)"
            offset={[0, 0]}
            style={{ borderRadius: 0, width: '100%' }}
          >
            <View style={[styles.heroCard, { height: tamanos.heroHeight, backgroundColor: 'transparent' }]}>
              <View
                style={[
                  styles.heroImage,
                  {
                    backgroundColor: 'transparent',
                  },
                ]}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.00)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.00)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                {ofertaHero?.descuento && (
                  <View style={styles.heroBadge}>
                    <Ionicons name="flame" size={11} color="#fff" />
                    <Text style={styles.heroBadgeText} allowFontScaling={false}>
                      {ofertaHero.descuento}
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.heroTitle, { fontSize: tamanos.heroTitleSize }]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {ofertaHero?.titulo || '¡Bienvenido a Krusty Burgers!'}
                </Text>
                <Text
                  style={[styles.heroSubtitle, { fontSize: tamanos.heroSubtitleSize }]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {ofertaHero?.descripcion || 'Las mejores burgers de Springfield'}
                </Text>
                {ofertaHero && (
                  <TouchableOpacity
                    style={[
                      styles.heroCta,
                      {
                        paddingHorizontal: 0,
                        paddingVertical: 0,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                      props.navigation.navigate('DetalleOferta', { oferta: ofertaHero });
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.heroCtaText, { color: DISENO.colors.accent, textDecorationLine: 'underline' }]} allowFontScaling={false}>
                      Ver oferta
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Shadow>
        </Animated.View>

        {/* ============ CATEGORÍAS ============ */}
        <View style={styles.seccionContainer}>
          <View style={[styles.sectionHeading, { paddingHorizontal: padding }]}>
            <Text
              style={[styles.sectionTitle, { fontSize: tamanos.sectionTitleSize }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Categorías
            </Text>
            <BotonVer
              texto="Ver menú"
              onPress={() => props.navigation.navigate('Menu')}
              fontSize={tamanos.seeAllSize}
            />
          </View>
          <FlatList
            horizontal
            data={CATEGORIAS}
            keyExtractor={(i) => i.id}
            renderItem={renderCategoria}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList, { paddingHorizontal: padding }]}
          />
        </View>

        {/* ============ FAVORITOS ============ */}
        {cargandoFavoritos && sesion && (
          <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
            <View style={styles.horizontalList}>
              <SkeletonCard
                width={tamanos.favoritoWidth}
                height={tamanos.favoritoImageHeight + 60}
              />
            </View>
          </View>
        )}

        {!cargandoFavoritos && tieneFavoritos && (
          <View style={styles.seccionContainer}>
            <View style={[styles.sectionHeading, { paddingHorizontal: padding }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text
                  style={[styles.sectionTitle, { fontSize: tamanos.sectionTitleSize }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {todosSonManuales ? 'Tus Favoritos' : 'Favoritos y top'}
                </Text>
                <Ionicons name="star" size={15} color="#F4A261" />
              </View>
            </View>
            <FlatList
              horizontal
              data={favoritosUnificados}
              keyExtractor={(item, index) => item.producto?.id?.toString() || `fav-${index}`}
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.horizontalList, { paddingHorizontal: padding }]}
              snapToInterval={tamanos.favoritoWidth + 12}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* ============ OFERTAS ============ */}
        <View style={styles.seccionContainer}>
          <View style={[styles.sectionHeading, { paddingHorizontal: padding }]}>
            <Text
              style={[styles.sectionTitle, { fontSize: tamanos.sectionTitleSize }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              Hoy te conviene
            </Text>
            <BotonVer
              texto="Ver todas"
              onPress={() => props.navigation.navigate('Ofertas')}
              fontSize={tamanos.seeAllSize}
            />
          </View>

          {cargandoOfertas ? (
            <View
              style={[
                styles.horizontalList,
                { paddingHorizontal: padding, flexDirection: 'row', gap: 12 },
              ]}
            >
              <SkeletonCard
                width={tamanos.ofertaCardWidth}
                height={tamanos.ofertaCardHeight}
              />
            </View>
          ) : errorOfertas ? (
            <View style={[styles.offerStatus, { marginHorizontal: padding }]}>
              <Text style={styles.offerStatusText} allowFontScaling={false}>
                No pudimos cargar las ofertas.
              </Text>
              <TouchableOpacity onPress={cargarOfertas} style={styles.retryButton}>
                <Text style={styles.retryButtonText} allowFontScaling={false}>
                  Reintentar
                </Text>
              </TouchableOpacity>
            </View>
          ) : ofertas.length > 0 ? (
            <>
              <FlatList
                horizontal
                data={ofertas.slice(0, 6)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOferta}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.horizontalList, { paddingHorizontal: padding }]}
                snapToInterval={tamanos.ofertaCardWidth + 12}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / (tamanos.ofertaCardWidth + 12),
                  );
                  setOfertaActiva(index);
                }}
              />
              {ofertas.length > 1 && (
                <View style={styles.dotsContainer}>
                  {ofertas.slice(0, 6).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === ofertaActiva && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.emptyOffers, { marginHorizontal: padding }]}>
              <Ionicons name="pricetag-outline" size={20} color={DISENO.colors.textSecondary} />
              <Text style={styles.emptyOffersText} allowFontScaling={false}>
                Por ahora no hay ofertas activas.
              </Text>
            </View>
          )}
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
  container: { flex: 1, backgroundColor: DISENO.colors.fondo },
  backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrollContent: { flexGrow: 1 },

  // Header
  header: { marginBottom: 20, position: 'relative' },
  headerActionsTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  greetingTextBlock: { flex: 1, minWidth: 0 },
  headerGreeting: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    lineHeight: 22,
  },
  headerPrompt: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    lineHeight: 36,
    marginTop: 2,
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: DISENO.radius.full,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '35',
    marginLeft: 12,
  },
  loginButtonText: { fontFamily: FUENTES.display, fontSize: 14, color: DISENO.colors.accent },
  headerButtonAdmin: { overflow: 'hidden', ...DISENO.shadow.md },
  headerButtonAdminGradient: { alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroWrap: { marginBottom: 16 },
  heroCard: {
    width: '100%',
    borderRadius: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  heroImage: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  heroContent: { position: 'absolute', bottom: 18, left: 18, right: 18 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: DISENO.radius.full,
    backgroundColor: '#E63946',
    marginBottom: 10,
  },
  heroBadgeText: { color: '#fff', fontFamily: FUENTES.display, fontSize: 11 },
  heroTitle: { fontFamily: FUENTES.display, color: DISENO.colors.text, lineHeight: 32 },
  heroSubtitle: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: DISENO.radius.full,
    marginTop: 14,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '25',
  },
  heroCtaText: { fontFamily: FUENTES.display, fontSize: 13, color: DISENO.colors.accent },

  // Secciones
  seccionContainer: { marginVertical: 10 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 32,
  },
  sectionTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    color: DISENO.colors.text,
    letterSpacing: -0.3,
    lineHeight: 28,
    includeFontPadding: false,
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // ✅ FIX definitivo para "Ver todas" / "Ver menú" en Galaxy A20
  botonVer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: DISENO.colors.accent + '10',
    flexShrink: 0,
    minHeight: 30,
    marginLeft: 8,
  },
  botonVerTexto: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.accent,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingBottom: 1,
  },

  // Categorías
  categoriaItem: { alignItems: 'center', marginRight: 18 },
  categoriaImageWrap: { position: 'relative' },
  categoriaIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    padding: 7,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: DISENO.colors.fondo,
  },
  categoriaNombre: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    marginTop: 10,
    lineHeight: 18,
    includeFontPadding: false,
  },
  categoriaCount: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    lineHeight: 16,
  },

  // Favoritos
  favoritoItem: { borderRadius: DISENO.radius.md, overflow: 'hidden' },
  favoritoImageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
  },
  favoritoImagen: { width: '100%', height: '100%' },
  favoritoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: DISENO.radius.full,
    ...DISENO.shadow.sm,
  },
  badgeManual: { backgroundColor: '#FFE5E7' },
  badgeRanking: { backgroundColor: '#FFEEDD' },
  favoritoInfo: { padding: 12 },
  favoritoNombre: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    marginBottom: 8,
    lineHeight: 18,
    includeFontPadding: false,
  },
  favoritoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  favoritoPrecio: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accent,
    fontWeight: '600',
    lineHeight: 18,
  },
  addButton: { alignItems: 'center', justifyContent: 'center' },

  // Ofertas
  ofertaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: DISENO.radius.md,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '18',
    backgroundColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },
  ofertaImagen: {
    borderRadius: DISENO.radius.sm,
    backgroundColor: DISENO.colors.surfaceHover,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '18',
  },
  ofertaImagenFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DISENO.radius.sm,
    backgroundColor: DISENO.colors.accent + '12',
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '18',
  },
  ofertaInfo: { flex: 1, minWidth: 0, paddingLeft: 12 },
  ofertaDescuento: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    borderRadius: DISENO.radius.full,
    backgroundColor: DISENO.colors.accent + '14',
    color: DISENO.colors.accent,
    fontFamily: FUENTES.display,
    fontSize: 11,
    lineHeight: 16,
    includeFontPadding: false,
  },
  ofertaTitulo: {
    marginTop: 6,
    fontFamily: FUENTES.display,
    lineHeight: 20,
    color: DISENO.colors.text,
    includeFontPadding: false,
  },
  ofertaPrecioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ofertaPrecio: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.accent,
    lineHeight: 22,
    includeFontPadding: false,
  },

  // Dots
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DISENO.colors.textSecondary + '40',
  },
  dotActive: { width: 20, backgroundColor: DISENO.colors.accent },

  horizontalList: { paddingVertical: 4, gap: 12 },

  // Estados
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
    lineHeight: 18,
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
    lineHeight: 18,
    includeFontPadding: false,
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
    lineHeight: 18,
  },

  footerSpacing: { height: 150 },
});