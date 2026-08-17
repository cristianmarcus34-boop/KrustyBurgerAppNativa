// screens/cliente/PantallaMenu.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Producto } from '../../lib/tipos';
import { Colores, getTematica } from '../../lib/colores';
import TarjetaProducto from '../../components/TarjetaProducto';

// ============================================================
// 📐 SISTEMA DE DISEÑO
// ============================================================
const DISEÑO = {
  BREAKPOINTS: {
    TABLET: 768,
    DESKTOP: 1024,
    SMALL_PHONE: 375,
  },
  TIPOGRAFIA: {
    HERO: { tablet: 32, normal: 26, small: 22 },
    TITULO: { tablet: 24, normal: 20, small: 17 },
    SUBTITULO: { tablet: 18, normal: 16, small: 14 },
    CUERPO: { tablet: 16, normal: 14, small: 12 },
    PEQUENO: { tablet: 14, normal: 12, small: 10 },
    MICRO: { tablet: 12, normal: 10, small: 9 },
  },
  ESPACIADO: {
    XL: { tablet: 40, normal: 24, small: 16 },
    LG: { tablet: 32, normal: 20, small: 14 },
    MD: { tablet: 24, normal: 16, small: 12 },
    SM: { tablet: 16, normal: 12, small: 10 },
    XS: { tablet: 12, normal: 8, small: 6 },
  },
  RADIO: {
    LG: { tablet: 24, normal: 18, small: 14 },
    MD: { tablet: 18, normal: 14, small: 10 },
    SM: { tablet: 12, normal: 10, small: 8 },
    XS: { tablet: 8, normal: 6, small: 4 },
  },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = Dimensions.get('window');

  const isTablet = width >= DISEÑO.BREAKPOINTS.TABLET;
  const isDesktop = width >= DISEÑO.BREAKPOINTS.DESKTOP;
  const isSmallPhone = width < DISEÑO.BREAKPOINTS.SMALL_PHONE;
  const isLandscape = width > height;

  const getValor = useCallback((
    valores: { tablet: any; normal: any; small: any }
  ) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const getTexto = useCallback((
    escala: keyof typeof DISEÑO.TIPOGRAFIA
  ) => {
    return getValor(DISEÑO.TIPOGRAFIA[escala]);
  }, [getValor]);

  const getEspaciado = useCallback((
    escala: keyof typeof DISEÑO.ESPACIADO
  ) => {
    return getValor(DISEÑO.ESPACIADO[escala]);
  }, [getValor]);

  const getRadio = useCallback((
    escala: keyof typeof DISEÑO.RADIO
  ) => {
    return getValor(DISEÑO.RADIO[escala]);
  }, [getValor]);

  return {
    isTablet,
    isDesktop,
    isSmallPhone,
    isLandscape,
    width,
    height,
    getValor,
    getTexto,
    getEspaciado,
    getRadio,
  };
};

// ============================================================
// 📋 CONFIGURACIÓN DE CATEGORÍAS
// ============================================================
const CATEGORIAS = [
  { id: 'Todas', label: '🌟 Todas', icono: 'grid' },
  { id: 'burgers', label: '🍔 Hamburguesas', icono: 'fast-food' },
  { id: 'combos', label: '🍟 Combos', icono: 'restaurant' },
  { id: 'bebidas', label: '🥤 Bebidas', icono: 'cafe' },
  { id: 'postres', label: '🍦 Postres', icono: 'ice-cream' },
  { id: 'acompanantes', label: '🍿 Acompañantes', icono: 'barbell' },
];

// ============================================================
// 🏠 PANTALLA MENU
// ============================================================
export default function PantallaMenu(props: any) {
  // ✅ Hooks
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { agregarProducto, cantidadTotal } = tiendaCarrito();
  const temaKrusty = getTematica('krusty');

  // ✅ Estados
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modoGrid, setModoGrid] = useState(true);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const carritoScale = useRef(new Animated.Value(0)).current;
  const carritoTranslateY = useRef(new Animated.Value(50)).current;

  // ✅ Cantidad del carrito
  const cantidad = cantidadTotal();

  // ============================================================
  // 📦 CÁLCULOS DE TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getEspaciado('LG'),
    gridColumns: responsive.isDesktop ? 3 : responsive.isTablet ? 2 : 2,
    // ✅ CARRITO MÁS PEQUEÑO Y SUTIL
    carritoSize: responsive.getValor({ tablet: 52, normal: 48, small: 42 }),
    carritoIconSize: responsive.getValor({ tablet: 24, normal: 20, small: 18 }),
  }), [responsive]);

  const padding = tamanos.padding;
  const numColumns = modoGrid ? tamanos.gridColumns : 1;

  // ✅ Calcular ancho de tarjeta
  const cardWidth = useMemo(() => {
    if (modoGrid) {
      const paddingHorizontal = padding * 2;
      const gapEntreColumnas = responsive.isTablet ? 16 : 12;
      const espacioTotal = paddingHorizontal + (gapEntreColumnas * (numColumns - 1));
      return (responsive.width - espacioTotal) / numColumns;
    }
    return responsive.width - 32;
  }, [modoGrid, padding, numColumns, responsive]);

  // ============================================================
  // 🎬 ANIMACIÓN DEL CARRITO
  // ============================================================
  useEffect(() => {
    if (cantidad > 0) {
      Animated.parallel([
        Animated.spring(carritoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(carritoTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(carritoScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(carritoTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cantidad]);

  // ============================================================
  // 🔄 FUNCIONES DE CARGA
  // ============================================================
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      let consulta = supabase.from('productos').select('*');

      if (categoriaSeleccionada !== 'Todas') {
        consulta = consulta.eq('categoria', categoriaSeleccionada);
      }

      const { data, error } = await consulta;

      if (error) throw error;

      setProductos(data as Producto[] || []);
      setProductosFiltrados(data as Producto[] || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  }, [categoriaSeleccionada]);

  // ============================================================
  // 🔍 FUNCIÓN DE BÚSQUEDA
  // ============================================================
  const filtrarPorBusqueda = useCallback((texto: string) => {
    setBusqueda(texto);
    if (texto.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter((p) =>
        p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(texto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  }, [productos]);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ============================================================
  // 🔄 REFRESH
  // ============================================================
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarProductos();
    setRefreshing(false);
  }, [cargarProductos]);

  // ============================================================
  // 🎯 MANEJADORES
  // ============================================================
  const handleAgregarProducto = useCallback((item: Producto) => {
    agregarProducto(item);
  }, [agregarProducto]);

  const handleDetalleProducto = useCallback((item: Producto) => {
    props.navigation.navigate('DetalleProducto', { producto: item });
  }, [props.navigation]);

  // ============================================================
  // 📦 FUNCIÓN PARA DISTRIBUIR EN COLUMNAS
  // ============================================================
  const formatData = useCallback((data: Producto[], numColumns: number) => {
    if (!modoGrid) return data;

    const result = [...data];
    const numberOfFullRows = Math.floor(result.length / numColumns);
    let numberOfElementsLastRow = result.length - (numberOfFullRows * numColumns);

    if (numberOfElementsLastRow > 0 && numberOfElementsLastRow < numColumns) {
      const emptyItems = numColumns - numberOfElementsLastRow;
      for (let i = 0; i < emptyItems; i++) {
        result.push({
          id: -1 - i,
          nombre: '',
          descripcion: null,
          precio: 0,
          imagen: null,
          categoria: '',
          disponible: false
        } as Producto);
      }
    }

    return result;
  }, [modoGrid]);

  // ============================================================
  // 🖼️ RENDER DE PRODUCTOS
  // ============================================================
  const renderProducto = useCallback(({ item }: { item: Producto }) => {
    if (item.id < 0) {
      return <View style={{ width: cardWidth }} />;
    }

    return (
      <TarjetaProducto
        producto={item}
        onAgregar={handleAgregarProducto}
        onDetalle={handleDetalleProducto}
        modoGrid={modoGrid}
      />
    );
  }, [handleAgregarProducto, handleDetalleProducto, modoGrid, cardWidth]);

  // ✅ Formatear datos para columnas
  const datosFormateados = useMemo(() => {
    if (!modoGrid) return productosFiltrados;
    return formatData([...productosFiltrados], numColumns);
  }, [productosFiltrados, modoGrid, numColumns, formatData]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={[estilos.contenedor, { backgroundColor: Colores.fondoOscuro }]}>
      {/* Gradiente de fondo estilo Krusty */}
      <LinearGradient
        colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ============================================================ */}
      {/* 🔹 HEADER */}
      {/* ============================================================ */}
      <Animated.View style={[
        estilos.encabezado,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 12, small: 8 }),
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderBottomColor: Colores.textoClaro + '8',
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={estilos.botonVolver}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 30, normal: 26, small: 22 })} color={Colores.textoClaro} />
        </TouchableOpacity>

        <Text style={[
          estilos.titulo,
          {
            fontSize: responsive.getTexto('TITULO'),
            color: Colores.textoClaro,
          }
        ]}>
          🍔 Menú Krusty
        </Text>

        <TouchableOpacity
          onPress={() => setModoGrid(!modoGrid)}
          style={estilos.botonGrid}
          activeOpacity={0.7}
        >
          <Ionicons
            name={modoGrid ? 'list' : 'grid'}
            size={responsive.getValor({ tablet: 26, normal: 22, small: 18 })}
            color={Colores.textoClaro}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================ */}
      {/* 🔹 BÚSQUEDA */}
      {/* ============================================================ */}
      <Animated.View style={[
        estilos.contenedorBusqueda,
        {
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          opacity: fadeAnim,
        }
      ]}>
        <View style={[
          estilos.inputBusqueda,
          {
            backgroundColor: Colores.fondoOscuro + '60',
            borderRadius: responsive.getRadio('MD'),
            borderColor: Colores.textoClaro + '15',
            paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
          }
        ]}>
          <Ionicons name="search" size={20} color={Colores.textoGris} />
          <TextInput
            style={[
              estilos.inputBusquedaTexto,
              {
                fontSize: responsive.getTexto('CUERPO'),
                color: Colores.textoClaro,
                marginLeft: 10,
                flex: 1,
              }
            ]}
            placeholder="Buscar productos..."
            placeholderTextColor={Colores.textoGris + '60'}
            value={busqueda}
            onChangeText={filtrarPorBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => filtrarPorBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={Colores.textoGris} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ============================================================ */}
      {/* 🔹 CATEGORÍAS */}
      {/* ============================================================ */}
      <Animated.View style={[
        estilos.contenedorCategorias,
        {
          opacity: fadeAnim,
          paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
          backgroundColor: Colores.fondoOscuro + '40',
          borderBottomWidth: 1,
          borderBottomColor: Colores.textoClaro + '8',
        }
      ]}>
        <FlatList
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            estilos.listaCategorias,
            { paddingHorizontal: padding }
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                estilos.categoria,
                {
                  paddingHorizontal: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
                  paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                  borderRadius: responsive.getRadio('SM'),
                  marginRight: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                  backgroundColor: categoriaSeleccionada === item.id ?
                    temaKrusty.secundario :
                    Colores.fondoOscuro + '50',
                  borderColor: categoriaSeleccionada === item.id ?
                    temaKrusty.secundario :
                    Colores.textoClaro + '10',
                }
              ]}
              onPress={() => setCategoriaSeleccionada(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                estilos.categoriaTexto,
                {
                  fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  color: categoriaSeleccionada === item.id ?
                    Colores.textoOscuro :
                    Colores.textoClaro,
                  fontWeight: categoriaSeleccionada === item.id ? '700' : '500',
                }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
        />
      </Animated.View>

      {/* ============================================================ */}
      {/* 🔹 PRODUCTOS */}
      {/* ============================================================ */}
      {cargando ? (
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={temaKrusty.secundario} />
          <Text style={[
            estilos.loadingTexto,
            {
              fontSize: responsive.getTexto('CUERPO'),
              color: Colores.textoGris,
            }
          ]}>
            Cargando deliciosos productos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={datosFormateados}
          renderItem={renderProducto}
          keyExtractor={(item, index) => item.id?.toString() || `empty-${index}`}
          contentContainerStyle={[
            estilos.listaProductos,
            {
              paddingHorizontal: padding,
              paddingBottom: insets.bottom + responsive.getValor({ tablet: 100, normal: 80, small: 60 }),
              paddingTop: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={temaKrusty.secundario}
              colors={[temaKrusty.secundario]}
            />
          }
          ListEmptyComponent={
            <View style={[
              estilos.vacioContenedor,
              {
                paddingTop: responsive.getValor({ tablet: 80, normal: 60, small: 40 }),
                paddingHorizontal: padding,
              }
            ]}>
              <Text style={[estilos.vacioEmoji, { fontSize: responsive.getValor({ tablet: 80, normal: 60, small: 50 }) }]}>
                📭
              </Text>
              <Text style={[
                estilos.vacio,
                {
                  fontSize: responsive.getTexto('TITULO'),
                  color: Colores.textoClaro,
                }
              ]}>
                No hay productos en esta categoría
              </Text>
              <Text style={[
                estilos.vacioSub,
                {
                  fontSize: responsive.getTexto('CUERPO'),
                  color: Colores.textoGris,
                }
              ]}>
                Pronto tendremos más opciones para vos 🍔
              </Text>
            </View>
          }
          key={modoGrid ? 'grid' : 'list'}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? estilos.columnWrapper : undefined}
        />
      )}

      {/* ============================================================ */}
      {/* 🔹 BOTÓN FLOTANTE DEL CARRITO - SUTIL */}
      {/* ============================================================ */}
      {cantidad > 0 && (
        <Animated.View
          style={[
            estilos.botonCarritoFlotante,
            {
              // ✅ SUBIR MÁS EL BOTÓN (más padding desde abajo)
              bottom: insets.bottom + responsive.getValor({ tablet: 80, normal: 695, small: 60 }),
              right: responsive.getValor({ tablet: 24, normal: 20, small: 16 }),
              transform: [
                { scale: carritoScale },
                { translateY: carritoTranslateY },
              ],
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => props.navigation.navigate('Carrito')}
            activeOpacity={0.8}
            style={estilos.botonCarritoTouch}
          >
            <LinearGradient
              colors={[temaKrusty.secundario, temaKrusty.primario]}
              style={[
                estilos.carritoGradient,
                {
                  width: tamanos.carritoSize,
                  height: tamanos.carritoSize,
                  borderRadius: tamanos.carritoSize / 2,
                }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cart" size={tamanos.carritoIconSize} color={Colores.textoOscuro} />
              <View style={[
                estilos.carritoBadge,
                {
                  top: -3,
                  right: -3,
                  minWidth: responsive.getValor({ tablet: 22, normal: 20, small: 18 }),
                  height: responsive.getValor({ tablet: 22, normal: 20, small: 18 }),
                  borderRadius: responsive.getValor({ tablet: 11, normal: 10, small: 9 }),
                }
              ]}>
                <Text style={[
                  estilos.carritoBadgeTexto,
                  {
                    fontSize: responsive.getValor({ tablet: 11, normal: 9, small: 8 }),
                  }
                ]}>
                  {cantidad > 99 ? '99+' : cantidad}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // ============================================================
  // HEADER
  // ============================================================
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  botonVolver: {
    padding: 4,
  },
  titulo: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  botonGrid: {
    padding: 4,
  },

  // ============================================================
  // BÚSQUEDA
  // ============================================================
  contenedorBusqueda: {
    backgroundColor: Colores.fondoOscuro + '20',
  },
  inputBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  inputBusquedaTexto: {
    padding: 0,
  },

  // ============================================================
  // CATEGORÍAS
  // ============================================================
  contenedorCategorias: {
    borderBottomWidth: 1,
  },
  listaCategorias: {
    gap: 8,
  },
  categoria: {
    borderWidth: 1,
  },
  categoriaTexto: {
    letterSpacing: 0.5,
  },

  // ============================================================
  // PRODUCTOS
  // ============================================================
  listaProductos: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },

  // ============================================================
  // LOADING
  // ============================================================
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTexto: {
    fontWeight: '400',
    opacity: 0.7,
  },

  // ============================================================
  // VACÍO
  // ============================================================
  vacioContenedor: {
    alignItems: 'center',
  },
  vacioEmoji: {
    marginBottom: 16,
  },
  vacio: {
    fontWeight: '600',
    textAlign: 'center',
  },
  vacioSub: {
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
  },

  // ============================================================
  // BOTÓN FLOTANTE DEL CARRITO - SUTIL
  // ============================================================
  botonCarritoFlotante: {
    position: 'absolute',
    zIndex: 100,
    shadowColor: Colores.secundario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  botonCarritoTouch: {
    borderRadius: 50,
  },
  carritoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '15',
  },
  carritoBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colores.secundario,
    borderWidth: 1.5,
    borderColor: Colores.fondoOscuro,
  },
  carritoBadgeTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
});