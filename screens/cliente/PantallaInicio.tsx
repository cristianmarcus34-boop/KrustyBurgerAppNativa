// screens/cliente/PantallaInicio.tsx - V14 (Modo oscuro + Onboarding fix + timing fix)
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
  Platform,
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
  ZoomIn,
} from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { supabase } from '../../lib/supabase';
import { useResponsive } from '../../lib/colores';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

// 🚀 Imports para el sistema de permisos amigables
import { yaVioModalPermisos, marcarModalPermisosVisto, solicitarPermisosCompletosApp } from '../../utils/permisosHelper';
import ModalPermisosEntrada from '../../components/ModalPermisosEntrada';

// 🎯 Imports para el onboarding progresivo de datos
import ModalDatoFaltante from '../../components/ModalDatoFaltante';
import {
  leerEstadoOnboarding,
  siguienteDatoFaltante,
  marcarOfrecido,
  parsearCumpleanosDDMMAAAA,
} from '../../utils/perfilOnboardingHelper';
import type { EstadoOnboarding, TipoDatoFaltante } from '../../utils/perfilOnboardingHelper';

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
  ringSize: number;
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

  const ringSize = categoriaSize + 10;

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
    ringSize,
  };
};

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

const construirCategorias = (colores: PaletaTema): CategoriaData[] => [
  { id: 'ofertas', nombre: 'Ofertas', imagen: ofertasImg, color: colores.danger, descripcion: 'Descuentos', icono: 'flame', esOferta: true },
  { id: 'burgers', nombre: 'Burgers', imagen: hamburguesasImg, color: colores.danger, descripcion: 'Premium', icono: 'fast-food' },
  { id: 'acompanantes', nombre: 'Extras', imagen: acompanantesImg, color: colores.warning, descripcion: 'Papas y más', icono: 'pizza' },
  { id: 'bebidas', nombre: 'Bebidas', imagen: bebidasImg, color: colores.info, descripcion: 'Refrescos', icono: 'beer' },
  { id: 'postres', nombre: 'Postres', imagen: postresImg, color: colores.rosa, descripcion: 'Dulces', icono: 'ice-cream' },
];

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
// 🔘 BOTÓN AÑADIR
// ============================================================
const AddButton: React.FC<{
  onPress: () => void;
  size?: number;
  nombre?: string;
  colores: PaletaTema;
  estilos: any;
}> = ({ onPress, size = 32, nombre, colores, estilos }) => {
  const [added, setAdded] = useState(false);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.6 }],
  }));

  const handle = () => {
    if (added) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    scale.value = withSequence(
      withSpring(0.82, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    glow.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 400 }),
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
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colores.success,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={animStyle}>
        <TouchableOpacity
          onPress={handle}
          activeOpacity={0.85}
          style={[
            estilos.addButton,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: added ? colores.success : colores.accent,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={added ? 'Agregado' : 'Agregar al carrito'}
        >
          <Ionicons name={added ? 'checkmark' : 'add'} size={size * 0.55} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================================
// 💀 SKELETON
// ============================================================
const SkeletonCard: React.FC<{
  width: number;
  height: number;
  radius?: number;
  colores: PaletaTema;
}> = ({ width, height, radius = 16, colores }) => {
  const opacity = useSharedValue(0.35);
  const translateX = useSharedValue(-1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.75, { duration: 900 }), -1, true);
    translateX.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
  }, [opacity, translateX]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * width }],
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colores.surfaceHover,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: width * 0.4,
            height: '100%',
            backgroundColor: colores.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)',
          },
          shimmerStyle,
        ]}
      />
    </Animated.View>
  );
};

// ============================================================
// 🔗 BOTÓN VER
// ============================================================
const BotonVer: React.FC<{
  texto: string;
  onPress: () => void;
  fontSize: number;
  colores: PaletaTema;
  estilos: any;
}> = ({ texto, onPress, fontSize, colores, estilos }) => (
  <TouchableOpacity
    style={estilos.botonVer}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={texto}
  >
    <Text
      style={[estilos.botonVerTexto, { fontSize }]}
      numberOfLines={1}
      allowFontScaling={false}
    >
      {texto}
    </Text>
    <Ionicons
      name="chevron-forward"
      size={14}
      color={colores.accent}
      style={{ marginLeft: 2 }}
    />
  </TouchableOpacity>
);

// ============================================================
// 📝 SECTION HEADER
// ============================================================
const SectionHeader: React.FC<{
  titulo: string;
  fontSize: number;
  padding: number;
  onVerTodo?: () => void;
  verTodoTexto?: string;
  seeAllSize: number;
  icono?: keyof typeof Ionicons.glyphMap;
  iconoColor?: string;
  colores: PaletaTema;
  estilos: any;
}> = ({ titulo, fontSize, padding, onVerTodo, verTodoTexto, seeAllSize, icono, iconoColor, colores, estilos }) => (
  <View style={[estilos.sectionHeading, { paddingHorizontal: padding }]}>
    <View style={estilos.sectionTitleWrap}>
      <View style={estilos.sectionAccentBar} />
      <Text
        style={[estilos.sectionTitle, { fontSize }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {titulo}
      </Text>
      {icono && (
        <Ionicons
          name={icono}
          size={fontSize * 0.75}
          color={iconoColor || '#F4A261'}
          style={{ marginLeft: 6 }}
        />
      )}
    </View>
    {onVerTodo && verTodoTexto && (
      <BotonVer
        texto={verTodoTexto}
        onPress={onVerTodo}
        fontSize={seeAllSize}
        colores={colores}
        estilos={estilos}
      />
    )}
  </View>
);

export default function PantallaInicio(props: any) {
  const { perfil, esAdministrador, sesion, actualizarPerfil } = tiendaAutenticacion();
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

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const CATEGORIAS = useMemo(() => construirCategorias(colores), [colores]);

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

  // 🚀 Estado para el Modal Amigable de Permisos
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);

  // 🎯 Estado para el onboarding progresivo de datos
  const [estadoOnboarding, setEstadoOnboarding] = useState<EstadoOnboarding>({
    bienvenidaVista: false,
    telefonoOfrecido: false,
    direccionOfrecida: false,
    cumpleanosOfrecido: false,
  });

  // 🆕 NUEVO: flag para saber si ya terminó de cargar el estado desde AsyncStorage
  const [estadoOnboardingCargado, setEstadoOnboardingCargado] = useState(false);

  const [datoFaltanteActual, setDatoFaltanteActual] = useState<TipoDatoFaltante | null>(null);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(25)).current;
  const logoScale = useRef(new RNAnimated.Value(0.85)).current;
  const logoOpacity = useRef(new RNAnimated.Value(0)).current;

  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-10);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(scrollY.value / 120, 0), 1);
    return {
      opacity: 1 - progress * 0.15,
    };
  });

  // ============================================================
  // 🚀 PERMISOS ONBOARDING
  // ============================================================
  useEffect(() => {
    const verificarPermisosOnboarding = async () => {
      const userId = sesion?.user?.id;
      if (userId) {
        const yaVisto = await yaVioModalPermisos(userId);
        if (!yaVisto) {
          setMostrarModalPermisos(true);
        }
      }
    };
    verificarPermisosOnboarding();
  }, [sesion]);

  const handleAceptarModalPermisos = async () => {
    const userId = sesion?.user?.id;
    if (!userId) return;

    setMostrarModalPermisos(false);
    await marcarModalPermisosVisto(userId);

    try {
      await solicitarPermisosCompletosApp(userId);
      const resultado = await actualizarPerfil({ acepta_promociones: true });

      if (resultado.success) {
        console.log('✅ [Onboarding] Permisos y promociones activados');
      } else {
        console.warn('⚠️ [Onboarding] No se pudo activar promociones:', resultado.error);
      }
    } catch (error) {
      console.error('❌ [Onboarding] Error activando permisos:', error);
    }
  };

  const handleOmitirModalPermisos = async () => {
    const userId = sesion?.user?.id;
    if (!userId) return;

    setMostrarModalPermisos(false);
    await marcarModalPermisosVisto(userId);
  };

  // ============================================================
  // 🎯 ONBOARDING DE DATOS
  // ============================================================
  useEffect(() => {
    const cargar = async () => {
      const userId = sesion?.user?.id;
      if (!userId) {
        setEstadoOnboardingCargado(true);  // no hay usuario → ya está "cargado"
        return;
      }
      const estado = await leerEstadoOnboarding(userId);
      setEstadoOnboarding(estado);
      setEstadoOnboardingCargado(true);  // ← marcamos como cargado
    };
    setEstadoOnboardingCargado(false);  // al cambiar de usuario, resetear
    cargar();
  }, [sesion?.user?.id]);

  useEffect(() => {
    const userId = sesion?.user?.id;
    if (!userId || !perfil) return;
    if (!estadoOnboardingCargado) return;  // 🆕 NO EVALUAR HASTA QUE CARGUE
    if (mostrarModalPermisos) return;
    if (datoFaltanteActual) return;

    const siguiente = siguienteDatoFaltante(perfil, estadoOnboarding, 'onboarding');
    if (siguiente) {
      const timer = setTimeout(() => setDatoFaltanteActual(siguiente), 800);
      return () => clearTimeout(timer);
    }
  }, [
    sesion?.user?.id,
    perfil,
    estadoOnboarding,
    estadoOnboardingCargado,  // 🆕 AGREGAR A LAS DEPS
    mostrarModalPermisos,
    datoFaltanteActual,
  ]);

  const handleGuardarDatoFaltante = async (valor: string) => {
    const userId = sesion?.user?.id;
    if (!userId || !datoFaltanteActual) return;

    try {
      if (datoFaltanteActual === 'bienvenida') {
        await marcarOfrecido(userId, 'bienvenida');
        setEstadoOnboarding((prev) => ({ ...prev, bienvenidaVista: true }));
      } else if (datoFaltanteActual === 'telefono') {
        const resultado = await actualizarPerfil({ telefono: valor });
        if (resultado.success) {
          await marcarOfrecido(userId, 'telefono');
          setEstadoOnboarding((prev) => ({ ...prev, telefonoOfrecido: true }));
        }
      } else if (datoFaltanteActual === 'cumpleanos') {
        const fechaISO = parsearCumpleanosDDMMAAAA(valor);
        if (fechaISO) {
          await actualizarPerfil({ fecha_nacimiento: fechaISO } as any);
        }
        await marcarOfrecido(userId, 'cumpleanos');
        setEstadoOnboarding((prev) => ({ ...prev, cumpleanosOfrecido: true }));
      }

      setDatoFaltanteActual(null);
    } catch (error) {
      console.error('❌ [Onboarding] Error guardando dato:', error);
      setDatoFaltanteActual(null);
    }
  };

  const handleSaltarDatoFaltante = async () => {
    const userId = sesion?.user?.id;
    if (!userId || !datoFaltanteActual) return;

    await marcarOfrecido(userId, datoFaltanteActual);
    setEstadoOnboarding((prev) => ({
      ...prev,
      ...(datoFaltanteActual === 'bienvenida' && { bienvenidaVista: true }),
      ...(datoFaltanteActual === 'telefono' && { telefonoOfrecido: true }),
      ...(datoFaltanteActual === 'direccion' && { direccionOfrecida: true }),
      ...(datoFaltanteActual === 'cumpleanos' && { cumpleanosOfrecido: true }),
    }));
    setDatoFaltanteActual(null);
  };

  // ============================================================
  // 📦 FAVORITOS + OFERTAS + CONTEO
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

    headerOpacity.value = withTiming(1, { duration: 500 });
    headerTranslate.value = withSpring(0, { damping: 14, stiffness: 120 });
  }, [cargarOfertas, cargarCantidadProductos, fadeAnim, slideAnim, logoScale, logoOpacity, headerOpacity, headerTranslate]);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    const promesas: Promise<any>[] = [cargarOfertas(), cargarCantidadProductos()];
    if (perfil?.id) promesas.push(cargarFavoritos(perfil.id));
    await Promise.allSettled(promesas);
    setRefrescando(false);
  }, [cargarOfertas, cargarCantidadProductos, cargarFavoritos, perfil?.id]);

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
  // 🎨 RENDER CATEGORÍA
  // ============================================================
  const renderCategoria = useCallback(
    ({ item, index }: { item: CategoriaData; index: number }) => {
      const count = cantidadProductos[item.id] || 0;
      return (
        <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
          <TouchableOpacity
            style={estilos.categoriaItem}
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              if (item.esOferta) props.navigation.navigate('Ofertas');
              else props.navigation.navigate('Menu', { categoria: item.id });
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${item.nombre}, ${count} productos`}
          >
            <View
              style={[
                estilos.categoriaRing,
                {
                  width: tamanos.ringSize,
                  height: tamanos.ringSize,
                  borderRadius: tamanos.ringSize / 2,
                  borderColor: item.color + '30',
                },
              ]}
            >
              <View
                style={[
                  estilos.categoriaImageWrap,
                  {
                    width: tamanos.categoriaSize,
                    height: tamanos.categoriaSize,
                    borderRadius: tamanos.categoriaSize / 2,
                    borderColor: item.color + '55',
                  },
                ]}
              >
                <Image
                  source={item.imagen}
                  style={{
                    width: tamanos.categoriaSize,
                    height: tamanos.categoriaSize,
                    borderRadius: tamanos.categoriaSize / 2,
                    backgroundColor: colores.surfaceHover,
                  }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.25)']}
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: tamanos.categoriaSize / 2 },
                  ]}
                />
              </View>
              <View
                style={[
                  estilos.categoriaIconBadge,
                  {
                    backgroundColor: item.color,
                    shadowColor: item.color,
                  },
                ]}
              >
                <Ionicons name={item.icono} size={tamanos.categoriaIconSize} color="#fff" />
              </View>
            </View>
            <Text
              style={[estilos.categoriaNombre, { fontSize: tamanos.categoriaNombreSize }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {item.nombre}
            </Text>
            {count > 0 && (
              <View style={estilos.categoriaCountBadge}>
                <Text
                  style={[estilos.categoriaCount, { fontSize: tamanos.categoriaCountSize }]}
                  allowFontScaling={false}
                >
                  {count} items
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [cantidadProductos, tamanos, props.navigation, colores, estilos],
  );

  // ============================================================
  // 🎨 RENDER FAVORITO
  // ============================================================
  const renderFavorito = useCallback(
    ({ item, index }: { item: FavoritoConOrigen; index: number }) => {
      const producto = item.producto;
      if (!producto) return null;
      const esManual = item.origen === 'manual';
      return (
        <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
          <Shadow
            distance={8}
            startColor={colores.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.07)'}
            offset={[0, 4]}
            style={{ borderRadius: 16, marginRight: 14 }}
          >
            <TouchableOpacity
              style={[
                estilos.favoritoItem,
                { width: tamanos.favoritoWidth, backgroundColor: colores.surface },
              ]}
              onPress={() => props.navigation.navigate('DetalleProducto', { producto })}
              activeOpacity={0.92}
            >
              <View
                style={[
                  estilos.favoritoImageContainer,
                  { height: tamanos.favoritoImageHeight },
                ]}
              >
                <Image
                  source={{ uri: producto.imagen || 'https://via.placeholder.com/300' }}
                  style={estilos.favoritoImagen}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.35)']}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    estilos.favoritoBadge,
                    esManual ? estilos.badgeManual : estilos.badgeRanking,
                  ]}
                >
                  <Ionicons
                    name={esManual ? 'heart' : 'flame'}
                    size={12}
                    color={esManual ? '#E63946' : '#FF6B00'}
                  />
                  <Text
                    style={[
                      estilos.favoritoBadgeText,
                      { color: esManual ? '#E63946' : '#FF6B00' },
                    ]}
                    allowFontScaling={false}
                  >
                    {esManual ? 'Favorito' : 'Top'}
                  </Text>
                </View>
              </View>
              <View style={estilos.favoritoInfo}>
                <Text
                  style={[estilos.favoritoNombre, { fontSize: tamanos.favoritoNombreSize }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {producto.nombre}
                </Text>
                <View style={estilos.favoritoFooter}>
                  <Text
                    style={[estilos.favoritoPrecio, { fontSize: tamanos.favoritoPrecioSize }]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(producto.precio)}
                  </Text>
                  <AddButton
                    onPress={() => agregarProducto(producto)}
                    size={30}
                    nombre={producto.nombre}
                    colores={colores}
                    estilos={estilos}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Shadow>
        </Animated.View>
      );
    },
    [tamanos, props.navigation, agregarProducto, colores, estilos],
  );

  // ============================================================
  // 🎨 RENDER OFERTA
  // ============================================================
  const renderOferta = useCallback(
    ({ item }: { item: OfertaInicio }) => (
      <TouchableOpacity
        style={[
          estilos.ofertaCard,
          {
            width: tamanos.ofertaCardWidth,
            minHeight: tamanos.ofertaCardHeight,
          },
        ]}
        onPress={() => {
          Haptics.selectionAsync().catch(() => { });
          props.navigation.navigate('DetalleOferta', { oferta: item });
        }}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={[colores.accent + '08', colores.accent + '02']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {item.imagen ? (
          <View style={estilos.ofertaImageWrap}>
            <Image
              source={{ uri: item.imagen }}
              style={[
                estilos.ofertaImagen,
                { width: tamanos.ofertaImageSize, height: tamanos.ofertaImageSize },
              ]}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)']}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 12 },
              ]}
            />
          </View>
        ) : (
          <LinearGradient
            colors={[colores.accent + '22', colores.accent + '10']}
            style={[
              estilos.ofertaImagenFallback,
              { width: tamanos.ofertaImageSize, height: tamanos.ofertaImageSize },
            ]}
          >
            <Ionicons name="fast-food-outline" size={32} color={colores.accent} />
          </LinearGradient>
        )}
        <View style={estilos.ofertaInfo}>
          {!!item.descuento && (
            <View style={estilos.ofertaDescuentoBadge}>
              <Ionicons name="pricetag" size={10} color="#fff" />
              <Text style={estilos.ofertaDescuentoText} numberOfLines={1} allowFontScaling={false}>
                {item.descuento}
              </Text>
            </View>
          )}
          <Text
            style={[estilos.ofertaTitulo, { fontSize: tamanos.ofertaTituloSize }]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {item.titulo}
          </Text>
          <View style={estilos.ofertaPrecioRow}>
            <Text
              style={[estilos.ofertaPrecio, { fontSize: tamanos.ofertaPrecioSize }]}
              allowFontScaling={false}
            >
              {item.precio_oferta != null && Number.isFinite(Number(item.precio_oferta))
                ? formatearPrecio(Number(item.precio_oferta))
                : 'Ver oferta'}
            </Text>
            <View style={estilos.ofertaArrowCircle}>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [tamanos, props.navigation, colores, estilos],
  );

  return (
    <View style={estilos.container}>
      {/* 🌄 FONDO MULTICAPA */}
      <View style={estilos.backgroundGradient}>
        <Image
          source={springfieldFondo}
          style={[StyleSheet.absoluteFill, { top: tamanos.fondoOffset }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={
            colores.isDark
              ? [
                'rgba(13,13,13,0.94)',
                'rgba(26,26,26,0.86)',
                'rgba(13,13,13,0.94)',
              ]
              : [
                'rgba(245,242,237,0.94)',
                'rgba(255,255,255,0.86)',
                'rgba(245,242,237,0.94)',
              ]
          }
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={
            colores.isDark
              ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']
              : ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']
          }
          style={[StyleSheet.absoluteFill, { height: 220 }]}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          estilos.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={colores.accent}
            colors={[colores.accent]}
          />
        }
      >
        {/* ============ HEADER ============ */}
        <Animated.View
          style={[
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            },
          ]}
        >
          <RNAnimated.View
            style={[
              estilos.header,
              {
                paddingHorizontal: padding,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {esAdministrador && (
              <View style={estilos.headerActionsTop}>
                <TouchableOpacity
                  style={[
                    estilos.headerButtonAdmin,
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
                    colors={[colores.success, colores.accentSecondary]}
                    style={[
                      estilos.headerButtonAdminGradient,
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
                      color={colores.text}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <View style={estilos.logoWrap}>
              <View
                style={[
                  estilos.logoGlow,
                  {
                    width: tamanos.logoSize * 0.85,
                    height: tamanos.logoSize * 0.85,
                    borderRadius: tamanos.logoSize * 0.85,
                  },
                ]}
              />
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
            </View>

            <View style={estilos.greetingRow}>
              <View style={estilos.greetingTextBlock}>
                <View style={estilos.greetingChip}>
                  <Text style={estilos.greetingChipEmoji} allowFontScaling={false}>
                    👋
                  </Text>
                  <Text
                    style={[estilos.headerGreeting, { fontSize: tamanos.greetingSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    Hola, {nombreMostrar}
                  </Text>
                </View>
                <Text
                  style={[estilos.headerPrompt, { fontSize: tamanos.promptSize }]}
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
                  style={estilos.avatarTouchable}
                >
                  <View style={estilos.avatarRing}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={[
                          estilos.avatar,
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
                          estilos.avatarFallback,
                          {
                            width: tamanos.avatarSize,
                            height: tamanos.avatarSize,
                            borderRadius: tamanos.avatarSize / 2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            estilos.avatarInicial,
                            { fontSize: tamanos.avatarSize * 0.45 },
                          ]}
                          allowFontScaling={false}
                        >
                          {nombreMostrar.trim().charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={estilos.avatarOnlineDot} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={estilos.loginButton}
                  onPress={() => props.navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-outline" size={16} color={colores.accent} />
                  <Text style={estilos.loginButtonText} allowFontScaling={false}>
                    Entrar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </RNAnimated.View>
        </Animated.View>

        {/* ============ HERO ============ */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={[estilos.heroWrap, { paddingHorizontal: padding }]}
        >
          <Shadow
            distance={12}
            startColor={colores.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.10)'}
            offset={[0, 6]}
            style={{ borderRadius: 20, width: '100%' }}
          >
            <View
              style={[
                estilos.heroCard,
                { height: tamanos.heroHeight, backgroundColor: colores.surface },
              ]}
            >
              <Image
                source={springfieldFondo}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={
                  colores.isDark
                    ? [
                      'rgba(13,13,13,0.65)',
                      'rgba(13,13,13,0.40)',
                      'rgba(13,13,13,0.90)',
                    ]
                    : [
                      'rgba(255,255,255,0.55)',
                      'rgba(255,255,255,0.20)',
                      'rgba(255,255,255,0.85)',
                    ]
                }
                locations={[0, 0.45, 1]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <LinearGradient
                colors={
                  colores.isDark
                    ? ['rgba(229,57,53,0.20)', 'transparent']
                    : ['rgba(230,57,70,0.12)', 'transparent']
                }
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={estilos.heroContent}>
                {ofertaHero?.descuento && (
                  <View style={estilos.heroBadge}>
                    <Ionicons name="flame" size={11} color="#fff" />
                    <Text style={estilos.heroBadgeText} allowFontScaling={false}>
                      {ofertaHero.descuento}
                    </Text>
                  </View>
                )}
                <Text
                  style={[estilos.heroTitle, { fontSize: tamanos.heroTitleSize }]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {ofertaHero?.titulo || '¡Bienvenido a Krusty Burgers!'}
                </Text>
                <Text
                  style={[estilos.heroSubtitle, { fontSize: tamanos.heroSubtitleSize }]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
                  {ofertaHero?.descripcion || 'Las mejores burgers de Springfield'}
                </Text>
                {ofertaHero && (
                  <TouchableOpacity
                    style={estilos.heroCta}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                      props.navigation.navigate('DetalleOferta', { oferta: ofertaHero });
                    }}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="flash" size={14} color="#fff" />
                    <Text style={estilos.heroCtaText} allowFontScaling={false}>
                      Ver oferta
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Shadow>
        </Animated.View>

        {/* ============ CATEGORÍAS ============ */}
        <View style={estilos.seccionContainer}>
          <SectionHeader
            titulo="Categorías"
            fontSize={tamanos.sectionTitleSize}
            padding={padding}
            onVerTodo={() => props.navigation.navigate('Menu')}
            verTodoTexto="Ver menú"
            seeAllSize={tamanos.seeAllSize}
            colores={colores}
            estilos={estilos}
          />
          <FlatList
            horizontal
            data={CATEGORIAS}
            keyExtractor={(i) => i.id}
            renderItem={renderCategoria}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[estilos.horizontalList, { paddingHorizontal: padding }]}
          />
        </View>

        {/* ============ FAVORITOS ============ */}
        {cargandoFavoritos && sesion && (
          <View style={[estilos.seccionContainer, { paddingHorizontal: padding }]}>
            <View style={estilos.horizontalList}>
              <SkeletonCard
                width={tamanos.favoritoWidth}
                height={tamanos.favoritoImageHeight + 60}
                radius={16}
                colores={colores}
              />
            </View>
          </View>
        )}

        {!cargandoFavoritos && tieneFavoritos && (
          <View style={estilos.seccionContainer}>
            <SectionHeader
              titulo={todosSonManuales ? 'Tus Favoritos' : 'Favoritos y top'}
              fontSize={tamanos.sectionTitleSize}
              padding={padding}
              seeAllSize={tamanos.seeAllSize}
              icono="star"
              iconoColor="#F4A261"
              colores={colores}
              estilos={estilos}
            />
            <FlatList
              horizontal
              data={favoritosUnificados}
              keyExtractor={(item, index) => item.producto?.id?.toString() || `fav-${index}`}
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[estilos.horizontalList, { paddingHorizontal: padding }]}
              snapToInterval={tamanos.favoritoWidth + 14}
              decelerationRate="fast"
            />
          </View>
        )}

        {/* ============ OFERTAS ============ */}
        <View style={estilos.seccionContainer}>
          <SectionHeader
            titulo="Hoy te conviene"
            fontSize={tamanos.sectionTitleSize}
            padding={padding}
            onVerTodo={() => props.navigation.navigate('Ofertas')}
            verTodoTexto="Ver todas"
            seeAllSize={tamanos.seeAllSize}
            icono="flame"
            iconoColor="#E63946"
            colores={colores}
            estilos={estilos}
          />

          {cargandoOfertas ? (
            <View
              style={[
                estilos.horizontalList,
                { paddingHorizontal: padding, flexDirection: 'row', gap: 12 },
              ]}
            >
              <SkeletonCard
                width={tamanos.ofertaCardWidth}
                height={tamanos.ofertaCardHeight}
                radius={16}
                colores={colores}
              />
            </View>
          ) : errorOfertas ? (
            <View style={[estilos.offerStatus, { marginHorizontal: padding }]}>
              <Ionicons name="cloud-offline-outline" size={20} color={colores.textSecondary} />
              <Text style={estilos.offerStatusText} allowFontScaling={false}>
                No pudimos cargar las ofertas.
              </Text>
              <TouchableOpacity onPress={cargarOfertas} style={estilos.retryButton}>
                <Text style={estilos.retryButtonText} allowFontScaling={false}>
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
                contentContainerStyle={[estilos.horizontalList, { paddingHorizontal: padding }]}
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
                <View style={estilos.dotsContainer}>
                  {ofertas.slice(0, 6).map((_, i) => (
                    <View
                      key={i}
                      style={[estilos.dot, i === ofertaActiva && estilos.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[estilos.emptyOffers, { marginHorizontal: padding }]}>
              <Ionicons name="pricetag-outline" size={20} color={colores.textSecondary} />
              <Text style={estilos.emptyOffersText} allowFontScaling={false}>
                Por ahora no hay ofertas activas.
              </Text>
            </View>
          )}
        </View>

        <View style={estilos.footerSpacing} />
      </Animated.ScrollView>

      {/* 🚀 MODAL AMIGABLE GLOBAL DE PERMISOS */}
      <ModalPermisosEntrada
        visible={mostrarModalPermisos}
        onAceptar={handleAceptarModalPermisos}
        onOmitir={handleOmitirModalPermisos}
      />

      {/* 🎯 MODAL DE DATOS FALTANTES */}
      {datoFaltanteActual && (
        <ModalDatoFaltante
          visible={!!datoFaltanteActual}
          tipo={datoFaltanteActual}
          nombreUsuario={perfil?.nombre_cliente || ''}
          valorInicial={datoFaltanteActual === 'telefono' ? perfil?.telefono || '' : ''}
          obligatorio={false}
          onGuardar={handleGuardarDatoFaltante}
          onSaltar={handleSaltarDatoFaltante}
        />
      )}
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },
    backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    scrollContent: { flexGrow: 1 },

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
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    logoGlow: {
      position: 'absolute',
      backgroundColor: colores.accent + '12',
      alignSelf: 'center',
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    greetingTextBlock: { flex: 1, minWidth: 0 },
    greetingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colores.accent + '18',
      gap: 6,
      marginBottom: 6,
    },
    greetingChipEmoji: { fontSize: 14 },
    headerGreeting: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      lineHeight: 20,
    },
    headerPrompt: {
      fontFamily: FUENTES.display,
      color: colores.text,
      lineHeight: 38,
      marginTop: 2,
      letterSpacing: -0.4,
    },
    avatarTouchable: { position: 'relative', marginLeft: 12 },
    avatarRing: {
      padding: 3,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colores.accent + '55',
      backgroundColor: colores.surface,
    },
    avatar: {
      backgroundColor: colores.surfaceHover,
      borderWidth: 1,
      borderColor: colores.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarFallback: {
      backgroundColor: colores.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colores.accent + '30',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarInicial: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      color: colores.accent,
      textAlign: 'center',
    },
    avatarOnlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colores.success,
      borderWidth: 2,
      borderColor: colores.surface,
    },
    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
      borderWidth: 1.5,
      borderColor: colores.accent + '40',
      marginLeft: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    loginButtonText: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      color: colores.accent,
    },
    headerButtonAdmin: {
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    headerButtonAdminGradient: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    heroWrap: { marginBottom: 20 },
    heroCard: {
      width: '100%',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
    },
    heroContent: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: '#E63946',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    heroBadgeText: {
      color: '#fff',
      fontFamily: FUENTES.display,
      fontSize: 11,
      letterSpacing: 0.3,
    },
    heroTitle: {
      fontFamily: FUENTES.display,
      color: colores.text,
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      marginTop: 6,
      lineHeight: 19,
    },
    heroCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      alignSelf: 'flex-start',
      backgroundColor: colores.accent,
      borderRadius: 999,
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 11,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    heroCtaText: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      color: '#fff',
      letterSpacing: 0.2,
    },

    seccionContainer: { marginVertical: 12 },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      minHeight: 32,
    },
    sectionTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    sectionAccentBar: {
      width: 4,
      height: 20,
      borderRadius: 2,
      backgroundColor: colores.accent,
      marginRight: 10,
    },
    sectionTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: colores.text,
      letterSpacing: -0.4,
      lineHeight: 28,
      includeFontPadding: false,
      flexShrink: 1,
    },

    botonVer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colores.accent + '10',
      borderWidth: 1,
      borderColor: colores.accent + '18',
      flexShrink: 0,
      minHeight: 30,
      marginLeft: 8,
    },
    botonVerTexto: {
      fontFamily: FUENTES.display,
      color: colores.accent,
      lineHeight: 20,
      includeFontPadding: false,
      textAlignVertical: 'center',
      paddingBottom: 1,
    },

    categoriaItem: { alignItems: 'center', marginRight: 20 },
    categoriaRing: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      position: 'relative',
    },
    categoriaImageWrap: {
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 2,
    },
    categoriaIconBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      padding: 7,
      borderRadius: 999,
      borderWidth: 2.5,
      borderColor: colores.surface,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
      elevation: 5,
    },
    categoriaNombre: {
      fontFamily: FUENTES.display,
      color: colores.text,
      marginTop: 12,
      lineHeight: 18,
      includeFontPadding: false,
      letterSpacing: -0.2,
    },
    categoriaCountBadge: {
      marginTop: 3,
      paddingHorizontal: 8,
      paddingVertical: 1,
      borderRadius: 999,
      backgroundColor: colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
    },
    categoriaCount: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      lineHeight: 15,
    },

    favoritoItem: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colores.border,
    },
    favoritoImageContainer: {
      width: '100%',
      position: 'relative',
      backgroundColor: colores.surfaceHover,
    },
    favoritoImagen: { width: '100%', height: '100%' },
    favoritoBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    favoritoBadgeText: {
      fontFamily: FUENTES.display,
      fontSize: 10,
      letterSpacing: 0.2,
    },
    badgeManual: { backgroundColor: 'rgba(255,229,231,0.95)' },
    badgeRanking: { backgroundColor: 'rgba(255,238,221,0.95)' },
    favoritoInfo: { padding: 12 },
    favoritoNombre: {
      fontFamily: FUENTES.display,
      color: colores.text,
      marginBottom: 8,
      lineHeight: 18,
      includeFontPadding: false,
    },
    favoritoFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    favoritoPrecio: {
      fontFamily: FUENTES.display,
      color: colores.accent,
      fontWeight: '600',
      lineHeight: 18,
    },
    addButton: { alignItems: 'center', justifyContent: 'center' },

    ofertaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colores.accent + '20',
      backgroundColor: colores.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    ofertaImageWrap: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
    },
    ofertaImagen: {
      borderRadius: 12,
      backgroundColor: colores.surfaceHover,
    },
    ofertaImagenFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    ofertaInfo: { flex: 1, minWidth: 0, paddingLeft: 14 },
    ofertaDescuentoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colores.accent,
    },
    ofertaDescuentoText: {
      color: '#fff',
      fontFamily: FUENTES.display,
      fontSize: 11,
      lineHeight: 14,
      includeFontPadding: false,
    },
    ofertaTitulo: {
      marginTop: 8,
      fontFamily: FUENTES.display,
      lineHeight: 21,
      color: colores.text,
      includeFontPadding: false,
      letterSpacing: -0.2,
    },
    ofertaPrecioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    ofertaPrecio: {
      fontFamily: FUENTES.display,
      color: colores.accent,
      lineHeight: 22,
      includeFontPadding: false,
    },
    ofertaArrowCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colores.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colores.textSecondary + '40',
    },
    dotActive: { width: 22, backgroundColor: colores.accent },

    horizontalList: { paddingVertical: 4, gap: 12 },

    offerStatus: {
      minHeight: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colores.surface,
      borderWidth: 1,
      borderColor: colores.border,
    },
    offerStatusText: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      color: colores.textSecondary,
      lineHeight: 18,
      flexShrink: 1,
    },
    retryButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colores.accent + '12',
      borderWidth: 1,
      borderColor: colores.accent + '25',
    },
    retryButtonText: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      color: colores.accent,
      lineHeight: 18,
      includeFontPadding: false,
    },
    emptyOffers: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colores.surface,
      borderWidth: 1,
      borderColor: colores.border,
    },
    emptyOffersText: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      color: colores.textSecondary,
      lineHeight: 18,
    },

    footerSpacing: { height: 150 },
  });