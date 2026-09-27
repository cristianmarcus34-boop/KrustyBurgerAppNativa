// screens/cliente/PantallaMenu.tsx - V2 RESPONSIVE
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { Producto } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { FUENTES } from '../../lib/fuentes';
import { useFocusEffect } from '@react-navigation/native';

// ============================================================
// 🎨 DISEÑO
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentSecondary: '#F5C518',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
    verde: '#43A047',
  },
};

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosMenu {
  padding: number;
  gridColumns: number;
  cardWidthGrid: number;
  cardWidthList: number;
  cardGap: number;
  // Card
  imageHeight: number;
  cardRadius: number;
  cardPadding: number;
  productNameSize: number;
  productDescSize: number;
  productPriceSize: number;
  addButtonSize: number;
  addIconSize: number;
  heartSize: number;
  heartPadding: number;
  badgeConPapasFontSize: number;
  badgeConPapasPaddingH: number;
  badgeConPapasPaddingV: number;
  badgeConPapasRadius: number;
  // Header
  headerTopPadding: number;
  headerBottomPadding: number;
  tituloSize: number;
  backIconSize: number;
  gridIconSize: number;
  // Search
  searchPadding: number;
  searchRadius: number;
  searchPaddingH: number;
  searchPaddingV: number;
  searchIconSize: number;
  searchTextSize: number;
  // Categorías
  catContainerPaddingV: number;
  catHeight: number;
  catWidth: number;
  catMarginRight: number;
  catRadius: number;
  catTextSize: number;
  // Empty / loading
  loadingTextSize: number;
  emptyTextSize: number;
  emptySubtextSize: number;
}

const calcularTamanosMenu = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,
): TamanosMenu => {
  const padding = isDesktop ? 40 : isTablet ? 32 : isSmallPhone ? 14 : 18;
  const gridColumns = isDesktop ? 3 : isTablet ? 2 : 2;
  const cardGap = isTablet ? 16 : isSmallPhone ? 10 : 12;

  const paddingTotal = padding * 2;
  const espacioTotal = paddingTotal + cardGap * (gridColumns - 1);
  const cardWidthGrid = (width - espacioTotal) / gridColumns;
  const cardWidthList = width - padding * 2;

  const imageHeight = isDesktop ? 200 : isTablet ? 180 : isSmallPhone ? 120 : 145;
  const cardRadius = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const cardPadding = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 10 : 12;

  const productNameSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 11 : 13;
  const productDescSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11.5;
  const productPriceSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;

  const addButtonSize = isDesktop ? 36 : isTablet ? 34 : isSmallPhone ? 28 : 30;
  const addIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 15 : 18;
  const heartSize = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const heartPadding = isSmallPhone ? 5 : 6;

  const badgeConPapasFontSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const badgeConPapasPaddingH = isDesktop ? 10 : isTablet ? 9 : isSmallPhone ? 6 : 8;
  const badgeConPapasPaddingV = isDesktop ? 5 : isTablet ? 5 : isSmallPhone ? 3 : 4;
  const badgeConPapasRadius = isDesktop ? 10 : isSmallPhone ? 6 : 8;

  const headerTopPadding = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 8 : 12;
  const headerBottomPadding = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 8 : 12;
  const tituloSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 18 : 21;
  const backIconSize = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 22 : 24;
  const gridIconSize = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 20 : 22;

  const searchPadding = isSmallPhone ? 8 : 12;
  const searchRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const searchPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
  const searchPaddingV = isDesktop ? 6 : isTablet ? 5 : isSmallPhone ? 3 : 4;
  const searchIconSize = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const searchTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;

  const catContainerPaddingV = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 8 : 10;
  const catHeight = isDesktop ? 44 : isTablet ? 42 : isSmallPhone ? 34 : 38;
  const catWidth = isDesktop ? 130 : isTablet ? 120 : isSmallPhone ? 90 : 100;
  const catMarginRight = isDesktop ? 10 : isTablet ? 10 : isSmallPhone ? 6 : 8;
  const catRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const catTextSize = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 11 : 12;

  const loadingTextSize = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const emptyTextSize = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 15 : 17;
  const emptySubtextSize = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 12 : 14;

  return {
    padding,
    gridColumns,
    cardWidthGrid,
    cardWidthList,
    cardGap,
    imageHeight,
    cardRadius,
    cardPadding,
    productNameSize,
    productDescSize,
    productPriceSize,
    addButtonSize,
    addIconSize,
    heartSize,
    heartPadding,
    badgeConPapasFontSize,
    badgeConPapasPaddingH,
    badgeConPapasPaddingV,
    badgeConPapasRadius,
    headerTopPadding,
    headerBottomPadding,
    tituloSize,
    backIconSize,
    gridIconSize,
    searchPadding,
    searchRadius,
    searchPaddingH,
    searchPaddingV,
    searchIconSize,
    searchTextSize,
    catContainerPaddingV,
    catHeight,
    catWidth,
    catMarginRight,
    catRadius,
    catTextSize,
    loadingTextSize,
    emptyTextSize,
    emptySubtextSize,
  };
};

// ============================================================
// 📋 CATEGORÍAS
// ============================================================
const CATEGORIAS = [
  { id: 'Todas', label: 'Todas' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'postres', label: 'Postres' },
  { id: 'acompanantes', label: 'Extras' },
];

// ============================================================
// 🎴 PRODUCT CARD
// ============================================================
interface ProductCardProps {
  item: Producto;
  cardWidth: number;
  modoGrid: boolean;
  estaAgregado: boolean;
  esFavorito: boolean;
  onPress: (item: Producto) => void;
  onAdd: (item: Producto) => void;
  onToggleFavorito: (item: Producto) => void;
  tamanos: TamanosMenu;
}

const ProductCard = memo(function ProductCard({
  item,
  cardWidth,
  modoGrid,
  estaAgregado,
  esFavorito,
  onPress,
  onAdd,
  onToggleFavorito,
  tamanos,
}: ProductCardProps) {
  if (item.id < 0) return <View style={{ width: cardWidth }} />;

  return (
    <View
      style={[
        styles.productCardWrapper,
        { width: modoGrid ? cardWidth : '100%', marginBottom: tamanos.cardGap },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.productCard,
          {
            backgroundColor: DESIGN.colors.surface,
            borderRadius: tamanos.cardRadius,
            borderColor: DESIGN.colors.border,
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.productImageContainer,
            {
              height: tamanos.imageHeight,
              borderTopLeftRadius: tamanos.cardRadius,
              borderTopRightRadius: tamanos.cardRadius,
            },
          ]}
        >
          {item.imagen ? (
            <Image source={{ uri: item.imagen }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.productImagePlaceholder,
                { backgroundColor: DESIGN.colors.surfaceHover },
              ]}
            >
              <Text style={{ fontSize: 40 }}>🍔</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)']}
            style={styles.productImageOverlay}
            start={{ x: 0, y: 0.6 }}
            end={{ x: 0, y: 1 }}
          />

          {item.incluye_papas && (
            <View
              style={[
                styles.badgeConPapas,
                {
                  paddingHorizontal: tamanos.badgeConPapasPaddingH,
                  paddingVertical: tamanos.badgeConPapasPaddingV,
                  borderRadius: tamanos.badgeConPapasRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeConPapasTexto,
                  { fontSize: tamanos.badgeConPapasFontSize },
                ]}
                allowFontScaling={false}
              >
                🍟 Con papas
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.favoritoBadge, { padding: tamanos.heartPadding }]}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorito(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={tamanos.heartSize}
              color={esFavorito ? DESIGN.colors.accent : DESIGN.colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.productInfo, { padding: tamanos.cardPadding }]}>
          <Text
            style={[
              styles.productName,
              { fontSize: tamanos.productNameSize, color: DESIGN.colors.text },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {item.nombre}
          </Text>
          <Text
            style={[
              styles.productDesc,
              { fontSize: tamanos.productDescSize, color: DESIGN.colors.textSecondary },
            ]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {item.descripcion || 'Sin descripción'}
          </Text>

          <View style={styles.productFooter}>
            <Text
              style={[
                styles.productPrice,
                { fontSize: tamanos.productPriceSize, color: DESIGN.colors.accent },
              ]}
              allowFontScaling={false}
            >
              {formatearPrecio(item.precio)}
            </Text>

            <TouchableOpacity
              onPress={() => onAdd(item)}
              style={[
                styles.addButton,
                {
                  width: tamanos.addButtonSize,
                  height: tamanos.addButtonSize,
                  borderRadius: tamanos.cardRadius / 2,
                  backgroundColor: estaAgregado ? DESIGN.colors.verde : DESIGN.colors.accent,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={estaAgregado ? 'checkmark' : 'add'}
                size={tamanos.addIconSize}
                color={DESIGN.colors.surface}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.nombre === next.item.nombre &&
    prev.item.precio === next.item.precio &&
    prev.item.imagen === next.item.imagen &&
    prev.item.incluye_papas === next.item.incluye_papas &&
    prev.estaAgregado === next.estaAgregado &&
    prev.esFavorito === next.esFavorito &&
    prev.cardWidth === next.cardWidth &&
    prev.modoGrid === next.modoGrid
  );
});

// ============================================================
// 🏠 PANTALLA
// ============================================================
export default function PantallaMenu(props: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ✅ Responsive helpers (para grids)
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isSmallPhone = screenWidth < 375;

  const tamanos = useMemo(
    () => calcularTamanosMenu(screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone),
    [screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone],
  );

  const { agregarProducto } = tiendaCarrito();
  const { perfil, sesion } = tiendaAutenticacion();
  const { idsFavoritos, agregarFavoritoManual, eliminarFavoritoManual } = tiendaFavoritos();

  const categoriaInicial: string | undefined = props.route?.params?.categoria;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(
    categoriaInicial || 'Todas',
  );
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modoGrid, setModoGrid] = useState(true);
  const [agregados, setAgregados] = useState<Record<number, boolean>>({});

  const categoriasListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (props.route?.params?.categoria) {
          props.navigation.setParams({ categoria: undefined });
        }
      };
    }, [props.navigation, props.route?.params?.categoria]),
  );

  const numColumns = modoGrid ? tamanos.gridColumns : 1;
  const cardWidth = modoGrid ? tamanos.cardWidthGrid : tamanos.cardWidthList;
  const categoriaItemFullWidth = tamanos.catWidth + tamanos.catMarginRight;

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      let consulta = supabase.from('productos').select('*');
      if (categoriaSeleccionada !== 'Todas') {
        consulta = consulta.eq('categoria', categoriaSeleccionada);
      }
      const { data, error } = await consulta;
      if (error) throw error;
      setProductos((data as Producto[]) || []);
      setProductosFiltrados((data as Producto[]) || []);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  }, [categoriaSeleccionada]);

  const filtrarPorBusqueda = useCallback(
    (texto: string) => {
      setBusqueda(texto);
      if (texto.trim() === '') {
        setProductosFiltrados(productos);
      } else {
        const filtrados = productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
            p.descripcion?.toLowerCase().includes(texto.toLowerCase()),
        );
        setProductosFiltrados(filtrados);
      }
    },
    [productos],
  );

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

  useEffect(() => {
    if (!categoriaInicial) return;
    setCategoriaSeleccionada(categoriaInicial);
  }, [categoriaInicial]);

  const scrollCategoriaA = useCallback(
    (categoriaId: string, animated: boolean = true) => {
      const index = CATEGORIAS.findIndex((c) => c.id === categoriaId);
      if (index === -1) return;

      requestAnimationFrame(() => {
        try {
          categoriasListRef.current?.scrollToIndex({ index, animated, viewPosition: 0.5 });
        } catch {
          categoriasListRef.current?.scrollToOffset({
            offset: Math.max(0, categoriaItemFullWidth * index - 100),
            animated,
          });
        }
      });
    },
    [categoriaItemFullWidth],
  );

  useEffect(() => {
    if (!categoriaSeleccionada) return;
    const timer = setTimeout(() => {
      scrollCategoriaA(categoriaSeleccionada, true);
    }, 200);
    return () => clearTimeout(timer);
  }, [categoriaSeleccionada, scrollCategoriaA]);

  const handleAgregarProducto = useCallback(
    (item: Producto) => {
      const id = item.id;
      setAgregados((prev) => ({ ...prev, [id]: true }));
      requestAnimationFrame(() => agregarProducto(item));
      setTimeout(() => {
        setAgregados((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 800);
    },
    [agregarProducto],
  );

  const handleToggleFavorito = useCallback(
    (item: Producto) => {
      if (!sesion || !perfil?.id) {
        Alert.alert(
          'Iniciá sesión',
          'Necesitás una cuenta para guardar tus favoritos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Iniciar sesión', onPress: () => props.navigation.navigate('Login') },
            { text: 'Registrarme', onPress: () => props.navigation.navigate('Registro') },
          ],
        );
        return;
      }

      const usuarioId = String(perfil.id);
      const productoId = Number(item.id);

      if (!productoId || isNaN(productoId) || productoId < 0) {
        console.warn('⚠️ ID de producto inválido:', item?.id);
        return;
      }

      const yaEsFavorito = idsFavoritos?.includes(productoId);

      if (yaEsFavorito) {
        eliminarFavoritoManual(usuarioId, productoId);
      } else {
        agregarFavoritoManual(usuarioId, item);
      }
    },
    [sesion, perfil?.id, idsFavoritos, agregarFavoritoManual, eliminarFavoritoManual, props.navigation],
  );

  const handleDetalleProducto = useCallback(
    (item: Producto) => {
      props.navigation.navigate('DetalleProducto', { producto: item });
    },
    [props.navigation],
  );

  const formatData = useCallback(
    (data: Producto[], numColumns: number) => {
      if (!modoGrid) return data;
      const result = [...data];
      const numberOfFullRows = Math.floor(result.length / numColumns);
      const numberOfElementsLastRow = result.length - numberOfFullRows * numColumns;
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
            disponible: false,
          } as Producto);
        }
      }
      return result;
    },
    [modoGrid],
  );

  const renderProducto = useCallback(
    ({ item }: { item: Producto }) => {
      const esFavorito = idsFavoritos?.includes(Number(item.id));
      return (
        <ProductCard
          item={item}
          cardWidth={cardWidth}
          modoGrid={modoGrid}
          estaAgregado={!!agregados[item.id]}
          esFavorito={!!esFavorito}
          onPress={handleDetalleProducto}
          onAdd={handleAgregarProducto}
          onToggleFavorito={handleToggleFavorito}
          tamanos={tamanos}
        />
      );
    },
    [
      cardWidth,
      modoGrid,
      agregados,
      idsFavoritos,
      handleDetalleProducto,
      handleAgregarProducto,
      handleToggleFavorito,
      tamanos,
    ],
  );

  const datosFormateados = useMemo(() => {
    if (!modoGrid) return productosFiltrados;
    return formatData([...productosFiltrados], numColumns);
  }, [productosFiltrados, modoGrid, numColumns, formatData]);

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
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + tamanos.headerTopPadding,
            paddingHorizontal: tamanos.padding,
            paddingBottom: tamanos.headerBottomPadding,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={tamanos.backIconSize} color={DESIGN.colors.surface} />
        </TouchableOpacity>

        <Text
          style={[styles.title, { fontSize: tamanos.tituloSize, color: DESIGN.colors.surface }]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          Menú Krusty
        </Text>

        <TouchableOpacity
          onPress={() => setModoGrid(!modoGrid)}
          style={styles.gridButton}
          activeOpacity={0.7}
          hitSlop={12}
        >
          <Ionicons
            name={modoGrid ? 'grid-outline' : 'list-outline'}
            size={tamanos.gridIconSize}
            color={DESIGN.colors.surface}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* BUSCADOR */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            paddingHorizontal: tamanos.padding,
            paddingBottom: tamanos.headerBottomPadding,
            paddingTop: tamanos.searchPadding,
            opacity: fadeAnim,
          },
        ]}
      >
        <View
          style={[
            styles.searchInput,
            {
              backgroundColor: DESIGN.colors.surface,
              borderRadius: tamanos.searchRadius,
              borderColor: DESIGN.colors.border,
              paddingHorizontal: tamanos.searchPaddingH,
              paddingVertical: tamanos.searchPaddingV,
              shadowColor: DESIGN.colors.cardShadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 3,
            },
          ]}
        >
          <Ionicons name="search" size={tamanos.searchIconSize} color={DESIGN.colors.textTertiary} />
          <TextInput
            style={[
              styles.searchInputText,
              {
                fontSize: tamanos.searchTextSize,
                color: DESIGN.colors.text,
                marginLeft: 10,
                flex: 1,
              },
            ]}
            placeholder="Buscar productos..."
            placeholderTextColor={DESIGN.colors.textTertiary}
            value={busqueda}
            onChangeText={filtrarPorBusqueda}
            allowFontScaling={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => filtrarPorBusqueda('')} hitSlop={8}>
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
            paddingVertical: tamanos.catContainerPaddingV,
            backgroundColor: DESIGN.colors.surface + '90',
            borderBottomWidth: 1,
            borderBottomColor: DESIGN.colors.border,
          },
        ]}
      >
        <FlatList
          ref={categoriasListRef}
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoriesList, { paddingHorizontal: tamanos.padding }]}
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
                    width: tamanos.catWidth,
                    height: tamanos.catHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: tamanos.catMarginRight,
                    borderRadius: tamanos.catRadius,
                    backgroundColor: seleccionada
                      ? DESIGN.colors.accentSecondary
                      : DESIGN.colors.surface,
                    borderColor: seleccionada
                      ? DESIGN.colors.accentSecondary
                      : DESIGN.colors.border,
                    borderWidth: 1,
                    shadowColor: DESIGN.colors.cardShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: seleccionada ? 1 : 0,
                    shadowRadius: 4,
                    elevation: seleccionada ? 3 : 0,
                  },
                ]}
                onPress={() => setCategoriaSeleccionada(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      fontSize: tamanos.catTextSize,
                      color: seleccionada
                        ? DESIGN.colors.text
                        : DESIGN.colors.textSecondary,
                    },
                  ]}
                  allowFontScaling={false}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      </Animated.View>

      {/* LISTA PRODUCTOS */}
      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
          <Text
            style={[
              styles.loadingText,
              { fontSize: tamanos.loadingTextSize, color: DESIGN.colors.textSecondary },
            ]}
            allowFontScaling={false}
          >
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
              paddingHorizontal: tamanos.padding,
              paddingBottom: insets.bottom + 80,
              paddingTop: tamanos.cardGap,
            },
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
            <View
              style={[
                styles.emptyContainer,
                { paddingTop: 60, paddingHorizontal: tamanos.padding },
              ]}
            >
              <Text
                style={[
                  styles.emptyText,
                  { fontSize: tamanos.emptyTextSize, color: DESIGN.colors.text },
                ]}
                allowFontScaling={false}
              >
                Productos en esta categoría
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { fontSize: tamanos.emptySubtextSize, color: DESIGN.colors.textSecondary },
                ]}
                allowFontScaling={false}
              >
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DESIGN.colors.fondo,
  },
  headerGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: '19%',
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 4 },
  title: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.5,
    includeFontPadding: false,
    flex: 1,
    textAlign: 'center',
    paddingTop: 20,
  },
  gridButton: { padding: 4 },
  searchContainer: { backgroundColor: 'transparent' },
  searchInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  searchInputText: {
    fontFamily: FUENTES.regular,
    padding: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  categoriesContainer: { borderBottomWidth: 1 },
  categoriesList: { gap: 4 },
  category: { borderWidth: 1 },
  categoryText: {
    fontFamily: FUENTES.display,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  productList: { flexGrow: 1 },
  productCardWrapper: { flex: 1 },
  productCard: { borderWidth: 1, overflow: 'hidden' },
  productImageContainer: { width: '100%', overflow: 'hidden', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%' },
  badgeConPapas: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeConPapasTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DESIGN.colors.accent,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  favoritoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  productInfo: { flex: 1 },
  productName: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginBottom: 2,
    includeFontPadding: false,
    lineHeight: 18,
  },
  productDesc: {
    fontFamily: FUENTES.regular,
    marginBottom: 8,
    opacity: 0.7,
    includeFontPadding: false,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    flexShrink: 0,
    includeFontPadding: false,
    lineHeight: 22,
  },
  addButton: { justifyContent: 'center', alignItems: 'center', padding: 0 },
  columnWrapper: { justifyContent: 'space-between', gap: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
    opacity: 0.7,
    includeFontPadding: false,
  },
  emptyContainer: { alignItems: 'center' },
  emptyText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptySubtext: {
    fontFamily: FUENTES.regular,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
    includeFontPadding: false,
  },
});