// screens/cliente/PantallaInicio.tsx - COMPLETO Y ACTUALIZADO
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
import { useFocusEffect } from '@react-navigation/native';
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
const acompanantesImg = require('../../assets/imagenes/categorias/acompanantes.jpg');
const ofertasImg = require('../../assets/imagenes/categorias/ofertas.jpg');

// ✅ IMPORTAR LOGO DE KRUSTY
const logoKrusty = require('../../assets/icon.png');

// ✅ IMPORTAR IMAGEN DE BIENVENIDA
const bienvenidaImg = require('../../assets/imagenes/bienvenidos.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    color: '#E53935',
    descripcion: 'Descuentos imperdibles',
    esOferta: true,
  },
  {
    id: 'hamburguesas',
    nombre: 'Burgers',
    imagen: hamburguesasImg,
    color: '#E53935',
    descripcion: 'Premium',
  },
  {
    id: 'acompanantes',
    nombre: 'Extras',
    imagen: acompanantesImg,
    color: '#FF6F00',
    descripcion: 'Papas, aros y más',
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
  const { agregarProducto } = tiendaCarrito();
  const { favoritos, cargando: cargandoFavoritos, cargarFavoritos, limpiarFavoritos } = tiendaFavoritos();
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

  // ✅ USEFOCUSEFFECT - FORZAR ACTUALIZACIÓN DEL BADGE
  useFocusEffect(
    useCallback(() => {
      const cantidad = tiendaCarrito.getState().cantidadTotal();
      console.log('🛒 [PantallaInicio] Forzando actualización badge:', cantidad);
      return () => { };
    }, [])
  );

  // ============================================================
  // 📐 TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getEspaciado('LG'),
    categoriaWidth: responsive.isDesktop ? SCREEN_WIDTH * 0.18 :
      responsive.isTablet ? SCREEN_WIDTH * 0.25 : SCREEN_WIDTH * 0.35,
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarOfertas(), cargarFavoritosUsuario(), cargarCantidadProductos()]);
    setRefrescando(false);
  }, [cargarOfertas, cargarFavoritosUsuario, cargarCantidadProductos]);

  // ============================================================
  // 🖼️ RENDER DE CATEGORÍA (horizontal)
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
            backgroundColor: DESIGN.colors.surface,
            borderColor: item.color + '20',
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 2,
          }
        ]}
        onPress={() => {
          if (item.esOferta) {
            // ✅ CORREGIDO: navegar directamente a la pantalla stack Ofertas
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
          <Text style={[styles.categoriaNombre, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }]} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={[styles.categoriaDesc, { fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 8 }) }]} numberOfLines={1}>
            {item.descripcion}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [tamanos, cantidadProductos, ofertas, responsive]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const padding = tamanos.padding;

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
              <Text style={styles.headerGreeting}> Buenos días</Text>
              <Text style={styles.headerName}>
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
                  colors={['#43A047', '#FFD700']}
                  style={styles.headerButtonAdminGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CATEGORÍAS - FILA HORIZONTAL SCROLLEABLE */}
        <View style={[styles.categoriasContainer, { paddingHorizontal: padding }]}>
          <Text style={styles.sectionTitle}> Categorías</Text>

          <FlatList
            horizontal
            data={CATEGORIAS}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoria}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriasList}
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

  // HEADER
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

  // BIENVENIDA
  bienvenidaContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  bienvenidaImagen: {
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginTop: 20,
    marginBottom: -300,
    marginLeft: 0,
  },
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    marginLeft: 0,
  },

  // SALUDO
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

  // BOTÓN ADMIN
  headerButtonAdmin: {
    borderRadius: DESIGN.radius.full,
    overflow: 'hidden',
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  headerButtonAdminGradient: {
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DESIGN.radius.full,
  },

  // CATEGORÍAS
  categoriasContainer: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN.colors.text,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  categoriasList: {
    paddingVertical: 4,
    gap: 12,
  },
  categoriaItem: {
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 12,
  },
  categoriaImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: DESIGN.colors.surfaceHover,
  },
  categoriaImagen: {
    width: '100%',
    height: '100%',
  },
  categoriaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriaBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  categoriaInfo: {
    padding: 8,
    alignItems: 'center',
  },
  categoriaNombre: {
    fontWeight: '600',
    color: DESIGN.colors.text,
    textAlign: 'center',
  },
  categoriaDesc: {
    color: DESIGN.colors.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 1,
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