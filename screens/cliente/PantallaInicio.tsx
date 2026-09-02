// screens/cliente/PantallaInicio.tsx - CON DISEÑO CENTRALIZADO
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
// ✅ IMPORTAMOS DESDE EL ARCHIVO CENTRALIZADO
import { DISENO, useResponsive } from '../../lib/colores';
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
    id: 'hamburguesas',
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

  // ✅ USEFOCUSEFFECT
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
              <Text style={[styles.headerGreeting, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]}>
                Buenos días
              </Text>
              <Text style={[styles.headerName, { fontSize: responsive.getValor({ tablet: 28, normal: 24, small: 20 }) }]}>
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

        {/* CATEGORÍAS */}
        <View style={[styles.categoriasContainer, { paddingHorizontal: padding }]}>
          <Text style={[styles.sectionTitle, { fontSize: responsive.getValor({ tablet: 20, normal: 18, small: 15 }) }]}>
            Categorías
          </Text>

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
// 🎨 ESTILOS - USANDO DISENO CENTRALIZADO
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
    marginTop: 20,
    marginBottom: -300,
    marginLeft: 0,
  },
  logoBienvenida: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    marginLeft: 0,
  },
  saludoContainer: {
    marginTop: 4,
  },
  headerGreeting: {
    color: DISENO.colors.textSecondary,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  headerName: {
    fontWeight: '700',
    color: DISENO.colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
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
  categoriasContainer: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    color: DISENO.colors.text,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  categoriasList: {
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
    fontWeight: '600',
    color: DISENO.colors.text,
    textAlign: 'center',
  },
  categoriaDesc: {
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 1,
  },
  footerSpacing: {
    height: 20,
  },
});