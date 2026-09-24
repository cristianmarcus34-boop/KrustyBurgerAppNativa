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

  const [ofertas, setOfertas] = useState<any[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
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
    const logoFactor = responsive.isTablet ? 0.85 : responsive.isSmallPhone ? 1.5 : 1.15;
    const bienvenidaFactor = responsive.isTablet ? 0.55 : responsive.isSmallPhone ? 0.95 : 0.78;

    return {
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
      logoSize: SCREEN_WIDTH * logoFactor,
      bienvenidaSize: SCREEN_WIDTH * bienvenidaFactor,
      fondoOffset: responsive.getValor({ tablet: -220, normal: -300, small: -150 }),
      contenidoOffset: responsive.getValor({ tablet: 60, normal: 60, small: 30 }),
    };
  }, [responsive]);

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
                { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 9 }) },
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

  const nombreMostrar = perfil?.nombre_cliente || (sesion ? 'Cliente' : 'Invitado');

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
            paddingTop: insets.top + responsive.spacing(16) + tamanos.contenidoOffset,
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
                source={logoKrusty}
                style={[
                  styles.logoBienvenida,
                  { width: tamanos.logoSize, height: tamanos.logoSize },
                ]}
                resizeMode="contain"
              />

              {/* ✅ SUBTÍTULO EN DOS LÍNEAS: frase gris arriba, "Krusty" rojo abajo */}
              <View style={styles.subtituloContainer}>
                <Text
                  style={[
                    styles.subtituloLinea1,
                    {
                      fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }),
                      lineHeight: responsive.getValor({ tablet: 19, normal: 17, small: 15 }),
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Si no te atragantás, no es una
                </Text>
                <Text
                  style={[
                    styles.subtituloKrusty,
                    {
                      fontSize: responsive.getValor({ tablet: 30, normal: 26, small: 22 }),
                      lineHeight: responsive.getValor({ tablet: 36, normal: 32, small: 26 }),
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Krusty
                </Text>
              </View>
            </Animated.View>

            <View style={styles.saludoContainer}>
              <Text
                style={[
                  styles.headerName,
                  { fontSize: responsive.getValor({ tablet: 30, normal: 24, small: 22 }) },
                ]}
              >
                {nombreMostrar}
              </Text>
            </View>

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

        {/* CATEGORÍAS EN 2 COLUMNAS */}
        <View style={[styles.seccionContainer, { paddingHorizontal: padding }]}>
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
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: 0,
    marginLeft: 0,
    marginTop: -40,
  },
  // ✅ Contenedor de las dos líneas (frase + Krusty)
  subtituloContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -65,
    marginBottom: 70,
    paddingHorizontal: 20,
  },
  subtituloLinea1: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,      // 👈 negro en vez de textSecondary
    textAlign: 'center',
    letterSpacing: 0,
    opacity: 1,                     // 👈 quitamos la opacidad 0.85
  },
  subtituloKrusty: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: '#a80e0e',       // 👈 bordo oscuro
    textAlign: 'center',
    letterSpacing: 0,
    marginTop: 1,
  },
  saludoContainer: {
    marginTop: 200,
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
    height: 150,
  },
});