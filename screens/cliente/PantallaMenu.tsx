// screens/cliente/PantallaMenu.tsx - CON PRODUCT CARD MEMOIZADO
import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
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
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Producto } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { FUENTES } from '../../lib/fuentes';

// ============================================================
// 🎨 SISTEMA DE DISEÑO
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    cardShadowHeavy: 'rgba(0,0,0,0.08)',
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
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    rosa: '#EC407A',
    azul: '#1A237E',
    azulClaro: '#3949AB',
    platino: '#78909C',
    oro: '#F9A825',
    plata: '#BDBDBD',
    bronce: '#A1887F',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 999 },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
type ResponsiveType = {
  isTablet: boolean;
  isDesktop: boolean;
  isSmallPhone: boolean;
  width: number;
  height: number;
  getValor: (valores: { tablet: any; normal: any; small: any }) => any;
};

const useResponsive = (): ResponsiveType => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor };
};

// ============================================================
// 📋 CONFIGURACIÓN DE CATEGORÍAS
// ============================================================
const CATEGORIAS = [
  { id: 'Todas', label: 'Todas' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'postres', label: 'Postres' },
  { id: 'acompanantes', label: 'Extras' },
];

// ============================================================
// 🎴 PRODUCT CARD - MEMOIZADO
// Solo se re-renderiza si sus props cambian (item, estaAgregado, etc.)
// ============================================================
interface ProductCardProps {
  item: Producto;
  cardWidth: number;
  modoGrid: boolean;
  estaAgregado: boolean;
  onPress: (item: Producto) => void;
  onAdd: (item: Producto) => void;
  responsive: ResponsiveType;
}

const ProductCard = memo(function ProductCard({
  item,
  cardWidth,
  modoGrid,
  estaAgregado,
  onPress,
  onAdd,
  responsive,
}: ProductCardProps) {
  // ✅ Debug: cuántas veces se re-renderiza cada card
  console.log('🎨 [ProductCard] render:', item.nombre, '| agregado:', estaAgregado);

  if (item.id < 0) {
    return <View style={{ width: cardWidth }} />;
  }

  const priceSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });
  const buttonSize = responsive.getValor({ tablet: 34, normal: 30, small: 28 });
  const iconSize = responsive.getValor({ tablet: 20, normal: 18, small: 15 });

  return (
    <View style={[
      styles.productCardWrapper,
      {
        width: modoGrid ? cardWidth : '100%',
        marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.productCard,
          {
            backgroundColor: DESIGN.colors.surface,
            borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            borderColor: DESIGN.colors.border,
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 4,
          }
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <View style={[
          styles.productImageContainer,
          {
            height: responsive.getValor({ tablet: 180, normal: 150, small: 130 }),
            borderTopLeftRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            borderTopRightRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
          }
        ]}>
          {item.imagen ? (
            <Image source={{ uri: item.imagen }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: DESIGN.colors.surfaceHover }]}>
              <Text style={{ fontSize: 40 }}>🍔</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)']}
            style={styles.productImageOverlay}
            start={{ x: 0, y: 0.6 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        <View style={[
          styles.productInfo,
          { padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }
        ]}>
          <Text style={[
            styles.productName,
            {
              fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
              color: DESIGN.colors.text,
            }
          ]} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={[
            styles.productDesc,
            {
              fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 10 }),
              color: DESIGN.colors.textSecondary,
            }
          ]} numberOfLines={2}>
            {item.descripcion || 'Sin descripción'}
          </Text>

          <View style={styles.productFooter}>
            <Text style={[
              styles.productPrice,
              { fontSize: priceSize, color: DESIGN.colors.accent }
            ]}>
              {formatearPrecio(item.precio)}
            </Text>

            <TouchableOpacity
              onPress={() => onAdd(item)}
              style={[
                styles.addButton,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                  backgroundColor: estaAgregado
                    ? DESIGN.colors.verde
                    : DESIGN.colors.accent,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={estaAgregado ? 'checkmark' : 'add'}
                size={iconSize}
                color={DESIGN.colors.surface}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prev, next) => {
  // ✅ Comparación custom: solo re-renderizamos si cambia algo importante
  const iguales = (
    prev.item.id === next.item.id &&
    prev.item.nombre === next.item.nombre &&
    prev.item.precio === next.item.precio &&
    prev.item.imagen === next.item.imagen &&
    prev.estaAgregado === next.estaAgregado &&
    prev.cardWidth === next.cardWidth &&
    prev.modoGrid === next.modoGrid
  );
  if (!iguales) {
    console.log('🔄 [ProductCard] CAMBIA:', prev.item.nombre,
      '| antes:', prev.estaAgregado, '→ ahora:', next.estaAgregado);
  }
  return iguales;
});

// ============================================================
// 🏠 PANTALLA MENU
// ============================================================
export default function PantallaMenu(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  const { agregarProducto } = tiendaCarrito();
  const { perfil } = tiendaAutenticacion();

  const categoriaInicial: string | undefined = props.route?.params?.categoria;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    categoriaInicial || 'Todas'
  );
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modoGrid, setModoGrid] = useState(true);

  // ✅ Estado para el feedback visual del botón "+"
  const [agregados, setAgregados] = useState<Record<number, boolean>>({});

  const categoriasListRef = useRef<FlatList>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // ✅ USEFOCUSEFFECT (badge del carrito)
  useFocusEffect(
    useCallback(() => {
      const cantidad = tiendaCarrito.getState().cantidadTotal();
      console.log('🛒 [PantallaMenu] Focus, cantidad badge:', cantidad);
      return () => { };
    }, [])
  );

  // ✅ Limpiar el param al desenfocar
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (props.route?.params?.categoria) {
          props.navigation.setParams({ categoria: undefined });
        }
      };
    }, [props.navigation, props.route?.params?.categoria])
  );

  // ============================================================
  // 📦 CÁLCULOS DE TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getValor({ tablet: 40, normal: 20, small: 16 }),
    gridColumns: responsive.isDesktop ? 3 : responsive.isTablet ? 2 : 2,
  }), [responsive]);

  const padding = tamanos.padding;
  const numColumns = modoGrid ? tamanos.gridColumns : 1;

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
  // 📏 TAMAÑOS DE CATEGORÍA
  // ============================================================
  const categoriaItemHeight = useMemo(() => {
    return responsive.getValor({ tablet: 42, normal: 36, small: 32 });
  }, [responsive]);

  const categoriaItemWidth = useMemo(() => {
    return responsive.getValor({ tablet: 120, normal: 100, small: 90 });
  }, [responsive]);

  const categoriaItemMarginRight = useMemo(() => {
    return responsive.getValor({ tablet: 10, normal: 8, small: 6 });
  }, [responsive]);

  const categoriaItemFullWidth = categoriaItemWidth + categoriaItemMarginRight;

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

  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarProductos();
    setRefreshing(false);
  }, [cargarProductos]);

  // ============================================================
  // 🔄 SINCRONIZAR CATEGORÍA POR PARAMS
  // ============================================================
  useEffect(() => {
    if (!categoriaInicial) return;
    setCategoriaSeleccionada(categoriaInicial);
  }, [categoriaInicial]);

  // ============================================================
  // 📜 SCROLL AUTOMÁTICO A LA CATEGORÍA
  // ============================================================
  const scrollCategoriaA = useCallback((categoriaId: string, animated: boolean = true) => {
    const index = CATEGORIAS.findIndex(c => c.id === categoriaId);
    if (index === -1) return;

    requestAnimationFrame(() => {
      try {
        categoriasListRef.current?.scrollToIndex({
          index,
          animated,
          viewPosition: 0.5,
        });
      } catch (e) {
        categoriasListRef.current?.scrollToOffset({
          offset: Math.max(0, categoriaItemFullWidth * index - 100),
          animated,
        });
      }
    });
  }, [categoriaItemFullWidth]);

  useEffect(() => {
    if (!categoriaSeleccionada) return;
    const timer = setTimeout(() => {
      scrollCategoriaA(categoriaSeleccionada, true);
    }, 200);
    return () => clearTimeout(timer);
  }, [categoriaSeleccionada, scrollCategoriaA]);

  // ============================================================
  // 🎯 MANEJADORES
  // ============================================================
  const handleAgregarProducto = useCallback((item: Producto) => {
    const id = item.id;
    console.log('🖱️ [PantallaMenu] TAP en + de:', item.nombre);

    // 1. Feedback visual instantáneo
    setAgregados(prev => ({ ...prev, [id]: true }));

    // 2. Trabajo del store en el siguiente frame
    requestAnimationFrame(() => {
      agregarProducto(item);
    });

    // 3. Restaurar el ícono después de 800ms
    setTimeout(() => {
      setAgregados(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 800);
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
    return (
      <ProductCard
        item={item}
        cardWidth={cardWidth}
        modoGrid={modoGrid}
        estaAgregado={!!agregados[item.id]}
        onPress={handleDetalleProducto}
        onAdd={handleAgregarProducto}
        responsive={responsive}
      />
    );
  }, [cardWidth, modoGrid, agregados, handleDetalleProducto, handleAgregarProducto, responsive]);

  const datosFormateados = useMemo(() => {
    if (!modoGrid) return productosFiltrados;
    return formatData([...productosFiltrados], numColumns);
  }, [productosFiltrados, modoGrid, numColumns, formatData]);

  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 17 });

  return (
    <View style={[styles.container, { backgroundColor: DESIGN.colors.fondo }]}>
      <View style={styles.background} />

      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
        style={styles.headerGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* HEADER */}
      <Animated.View style={[
        styles.header,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 12, small: 8 }),
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 30, normal: 26, small: 22 })} color={DESIGN.colors.surface} />
        </TouchableOpacity>

        <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
          Menú Krusty
        </Text>

        <TouchableOpacity
          onPress={() => setModoGrid(!modoGrid)}
          style={styles.gridButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={modoGrid ? 'grid-outline' : 'list-outline'}
            size={responsive.getValor({ tablet: 28, normal: 24, small: 20 })}
            color={DESIGN.colors.surface}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* BÚSQUEDA */}
      <Animated.View style={[
        styles.searchContainer,
        {
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          paddingTop: responsive.getValor({ tablet: 12, normal: 8, small: 6 }),
          opacity: fadeAnim,
        }
      ]}>
        <View style={[
          styles.searchInput,
          {
            backgroundColor: DESIGN.colors.surface,
            borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
            borderColor: DESIGN.colors.border,
            paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            paddingVertical: responsive.getValor({ tablet: 6, normal: 4, small: 2 }),
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
          }
        ]}>
          <Ionicons name="search" size={20} color={DESIGN.colors.textTertiary} />
          <TextInput
            style={[
              styles.searchInputText,
              {
                fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                color: DESIGN.colors.text,
                marginLeft: 10,
                flex: 1,
              }
            ]}
            placeholder="Buscar productos..."
            placeholderTextColor={DESIGN.colors.textTertiary}
            value={busqueda}
            onChangeText={filtrarPorBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => filtrarPorBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={DESIGN.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* CATEGORÍAS */}
      <Animated.View
        style={[
          styles.categoriesContainer,
          {
            opacity: fadeAnim,
            paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
            backgroundColor: DESIGN.colors.surface + '90',
            borderBottomWidth: 1,
            borderBottomColor: DESIGN.colors.border,
          }
        ]}
      >
        <FlatList
          ref={categoriasListRef}
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.categoriesList,
            { paddingHorizontal: padding }
          ]}
          getItemLayout={(_, index) => ({
            length: categoriaItemFullWidth,
            offset: categoriaItemFullWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            const offset = info.averageItemLength * info.index;
            categoriasListRef.current?.scrollToOffset({ offset, animated: true });
            setTimeout(() => {
              categoriasListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          renderItem={({ item }) => {
            const seleccionada = categoriaSeleccionada === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.category,
                  {
                    width: categoriaItemWidth,
                    height: categoriaItemHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: categoriaItemMarginRight,
                    borderRadius: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                    backgroundColor: seleccionada ?
                      DESIGN.colors.accentSecondary :
                      DESIGN.colors.surface,
                    borderColor: seleccionada ?
                      DESIGN.colors.accentSecondary :
                      DESIGN.colors.border,
                    borderWidth: 1,
                    shadowColor: DESIGN.colors.cardShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: seleccionada ? 1 : 0,
                    shadowRadius: 4,
                    elevation: seleccionada ? 3 : 0,
                  }
                ]}
                onPress={() => setCategoriaSeleccionada(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryText,
                  {
                    fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                    color: seleccionada ?
                      DESIGN.colors.text :
                      DESIGN.colors.textSecondary,
                    fontWeight: '400',
                  }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.id}
        />
      </Animated.View>

      {/* PRODUCTOS */}
      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
          <Text style={[
            styles.loadingText,
            {
              fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
              color: DESIGN.colors.textSecondary,
            }
          ]}>
            Cargando...
          </Text>
        </View>
      ) : (
        <FlatList
          data={datosFormateados}
          renderItem={renderProducto}
          keyExtractor={(item, index) => item.id?.toString() || `empty-${index}`}
          contentContainerStyle={[
            styles.productList,
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
              tintColor={DESIGN.colors.accentSecondary}
              colors={[DESIGN.colors.accentSecondary]}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          windowSize={5}
          ListEmptyComponent={
            <View style={[
              styles.emptyContainer,
              {
                paddingTop: responsive.getValor({ tablet: 80, normal: 60, small: 40 }),
                paddingHorizontal: padding,
              }
            ]}>
              <Text style={[
                styles.emptyText,
                {
                  fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }),
                  color: DESIGN.colors.text,
                }
              ]}>
                Productos en esta categoría
              </Text>
              <Text style={[
                styles.emptySubtext,
                {
                  fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  color: DESIGN.colors.textSecondary,
                }
              ]}>
                Pronto tendremos más opciones para vos
              </Text>
            </View>
          }
          key={modoGrid ? 'grid' : 'list'}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        />
      )}
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.fondo },
  background: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: DESIGN.colors.fondo,
  },
  headerGradiente: {
    position: 'absolute', top: 0, left: 0, right: 0,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    height: '19%',
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { padding: 4 },
  title: {
    fontFamily: FUENTES.display, fontWeight: '400', letterSpacing: 0.5,
  },
  gridButton: { padding: 4 },
  searchContainer: { backgroundColor: 'transparent' },
  searchInput: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
  },
  searchInputText: { fontFamily: FUENTES.regular, padding: 0 },
  categoriesContainer: { borderBottomWidth: 1 },
  categoriesList: { gap: 4 },
  category: { borderWidth: 1 },
  categoryText: {
    fontFamily: FUENTES.display, letterSpacing: 0.3,
  },
  productList: { flexGrow: 1 },
  productCardWrapper: { flex: 1 },
  productCard: { borderWidth: 1, overflow: 'hidden' },
  productImageContainer: { width: '100%', overflow: 'hidden', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  productImageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
  },
  productInfo: { flex: 1 },
  productName: {
    fontFamily: FUENTES.display, fontWeight: '400', marginBottom: 2,
  },
  productDesc: {
    fontFamily: FUENTES.regular, marginBottom: 8, opacity: 0.7,
  },
  productFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 8,
  },
  productPrice: {
    fontFamily: FUENTES.regular, fontWeight: '700', flexShrink: 0,
  },
  addButton: {
    justifyContent: 'center', alignItems: 'center', padding: 0,
  },
  columnWrapper: { justifyContent: 'space-between', gap: 12 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  loadingText: {
    fontFamily: FUENTES.regular, fontWeight: '400', opacity: 0.7,
  },
  emptyContainer: { alignItems: 'center' },
  emptyEmoji: { marginBottom: 16 },
  emptyText: {
    fontFamily: FUENTES.display, fontWeight: '400', textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FUENTES.regular, textAlign: 'center', marginTop: 6, opacity: 0.7,
  },
});