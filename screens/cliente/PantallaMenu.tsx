// screens/cliente/PantallaMenu.tsx - V7 (Modo oscuro + Android safe + filtros + responsive)
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
  Alert,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from '@react-native-community/blur';
import { TouchableRipple } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { Producto } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { FUENTES } from '../../lib/fuentes';
import { useColores, type PaletaTema } from '../../lib/theme';
import { useFocusEffect } from '@react-navigation/native';

// ============================================================
// 🧮 TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosMenu {
  padding: number;
  gridColumns: number;
  cardWidthGrid: number;
  cardWidthList: number;
  cardGap: number;
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
  headerTopPadding: number;
  headerBottomPadding: number;
  tituloSize: number;
  backIconSize: number;
  gridIconSize: number;
  iconButtonSize: number;
  searchPadding: number;
  searchRadius: number;
  searchPaddingH: number;
  searchPaddingV: number;
  searchIconSize: number;
  searchTextSize: number;
  catContainerPaddingV: number;
  catHeight: number;
  catWidth: number;
  catMarginRight: number;
  catRadius: number;
  catTextSize: number;
  catIconSize: number;
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

  const imageHeight = isDesktop ? 200 : isTablet ? 180 : isSmallPhone ? 120 : 150;
  const cardRadius = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const cardPadding = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 10 : 12;

  const productNameSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 11 : 13;
  const productDescSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11.5;
  const productPriceSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;

  const addButtonSize = isDesktop ? 38 : isTablet ? 36 : isSmallPhone ? 30 : 32;
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
  const backIconSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 20 : 22;
  const gridIconSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 18 : 20;
  const iconButtonSize = isDesktop ? 46 : isTablet ? 44 : isSmallPhone ? 38 : 42;

  const searchPadding = isSmallPhone ? 8 : 12;
  const searchRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
  const searchPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
  const searchPaddingV = isDesktop ? 6 : isTablet ? 5 : isSmallPhone ? 3 : 4;
  const searchIconSize = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const searchTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;

  const catContainerPaddingV = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 8 : 10;
  const catHeight = isDesktop ? 44 : isTablet ? 42 : isSmallPhone ? 34 : 38;
  const catWidth = isDesktop ? 130 : isTablet ? 120 : isSmallPhone ? 90 : 100;
  const catMarginRight = isDesktop ? 10 : isTablet ? 10 : isSmallPhone ? 6 : 8;
  const catRadius = 999;
  const catTextSize = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 11 : 12;
  const catIconSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 13;

  const loadingTextSize = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const emptyTextSize = isDesktop ? 20 : isTablet ? 20 : isSmallPhone ? 15 : 17;
  const emptySubtextSize = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 12 : 14;

  return {
    padding, gridColumns, cardWidthGrid, cardWidthList, cardGap,
    imageHeight, cardRadius, cardPadding,
    productNameSize, productDescSize, productPriceSize,
    addButtonSize, addIconSize, heartSize, heartPadding,
    badgeConPapasFontSize, badgeConPapasPaddingH, badgeConPapasPaddingV, badgeConPapasRadius,
    headerTopPadding, headerBottomPadding, tituloSize, backIconSize, gridIconSize, iconButtonSize,
    searchPadding, searchRadius, searchPaddingH, searchPaddingV, searchIconSize, searchTextSize,
    catContainerPaddingV, catHeight, catWidth, catMarginRight, catRadius, catTextSize, catIconSize,
    loadingTextSize, emptyTextSize, emptySubtextSize,
  };
};

// ============================================================
// 📋 CATEGORÍAS
// ============================================================
const CATEGORIAS = [
  { id: 'Todas', label: 'Todas', icono: 'apps-outline' as const },
  { id: 'burgers', label: 'Burgers', icono: 'fast-food-outline' as const },
  { id: 'bebidas', label: 'Bebidas', icono: 'beer-outline' as const },
  { id: 'postres', label: 'Postres', icono: 'ice-cream-outline' as const },
  { id: 'acompanantes', label: 'Extras', icono: 'pizza-outline' as const },
];

type OrdenTipo = 'default' | 'precio-asc' | 'precio-desc' | 'nombre';
type FiltroTipo = 'todos' | 'con-papas' | 'favoritos';

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
  colores: PaletaTema;
  estilos: any;
}

const ProductCard = memo(function ProductCard({
  item, cardWidth, modoGrid, estaAgregado, esFavorito,
  onPress, onAdd, onToggleFavorito, tamanos, colores, estilos,
}: ProductCardProps) {
  const cardScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const favScale = useSharedValue(1);
  const favStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };
  const handleFavPress = () => {
    favScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    Haptics.selectionAsync().catch(() => { });
    onToggleFavorito(item);
  };

  if (item.id < 0) return <View style={{ width: cardWidth }} />;

  return (
    <Animated2.View
      style={[
        estilos.productCardWrapper,
        { width: modoGrid ? cardWidth : '100%', marginBottom: tamanos.cardGap },
        cardStyle,
      ]}
    >
      <TouchableOpacity
        style={[
          estilos.productCard,
          {
            backgroundColor: colores.surface,
            borderRadius: tamanos.cardRadius,
            borderColor: colores.border,
          },
        ]}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View
          style={[
            estilos.productImageContainer,
            {
              height: tamanos.imageHeight,
              borderTopLeftRadius: tamanos.cardRadius,
              borderTopRightRadius: tamanos.cardRadius,
            },
          ]}
        >
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={estilos.productImage}
              contentFit="cover"
              transition={250}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              cachePolicy="memory-disk"
            />
          ) : (
            <View
              style={[
                estilos.productImagePlaceholder,
                { backgroundColor: colores.surfaceHover },
              ]}
            >
              <Text style={{ fontSize: 42 }}>🍔</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.30)']}
            style={estilos.productImageOverlay}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />

          {item.incluye_papas && (
            <View
              style={[
                estilos.badgeConPapas,
                {
                  paddingHorizontal: tamanos.badgeConPapasPaddingH,
                  paddingVertical: tamanos.badgeConPapasPaddingV,
                  borderRadius: tamanos.badgeConPapasRadius,
                },
              ]}
            >
              <Text style={{ fontSize: tamanos.badgeConPapasFontSize - 1 }}>🍟</Text>
              <Text
                style={[
                  estilos.badgeConPapasTexto,
                  { fontSize: tamanos.badgeConPapasFontSize, marginLeft: 4 },
                ]}
                allowFontScaling={false}
              >
                Con papas
              </Text>
            </View>
          )}

          <Animated2.View style={[estilos.favoritoBadgeWrap, favStyle]}>
            <TouchableOpacity
              style={[
                estilos.favoritoBadge,
                {
                  padding: tamanos.heartPadding,
                  backgroundColor: esFavorito
                    ? 'rgba(255,255,255,0.98)'
                    : 'rgba(255,255,255,0.85)',
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleFavPress();
              }}
              activeOpacity={0.85}
              hitSlop={6}
            >
              <Ionicons
                name={esFavorito ? 'heart' : 'heart-outline'}
                size={tamanos.heartSize}
                color={esFavorito ? colores.accent : colores.textSecondary}
              />
            </TouchableOpacity>
          </Animated2.View>
        </View>

        <View style={[estilos.productInfo, { padding: tamanos.cardPadding }]}>
          <Text
            style={[
              estilos.productName,
              { fontSize: tamanos.productNameSize, color: colores.text },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {item.nombre}
          </Text>
          <Text
            style={[
              estilos.productDesc,
              { fontSize: tamanos.productDescSize, color: colores.textSecondary },
            ]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {item.descripcion || 'Sin descripción'}
          </Text>

          <View style={estilos.productFooter}>
            <View style={estilos.priceBlock}>
              <Text
                style={[
                  estilos.productPrice,
                  { fontSize: tamanos.productPriceSize, color: colores.accent },
                ]}
                allowFontScaling={false}
              >
                {formatearPrecio(item.precio)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onAdd(item)}
              style={[
                estilos.addButton,
                {
                  width: tamanos.addButtonSize,
                  height: tamanos.addButtonSize,
                  borderRadius: tamanos.addButtonSize / 2,
                  backgroundColor: estaAgregado ? colores.verde : colores.accent,
                },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons
                name={estaAgregado ? 'checkmark' : 'add'}
                size={tamanos.addIconSize}
                color={colores.surface}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated2.View>
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
    prev.modoGrid === next.modoGrid &&
    prev.colores === next.colores
  );
});

// ============================================================
// 💀 SKELETON CARD
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
    <Animated2.View
      style={[
        {
          width, height, borderRadius: radius,
          backgroundColor: colores.surfaceHover,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated2.View
        style={[
          {
            width: width * 0.4,
            height: '100%',
            backgroundColor: colores.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
          },
          shimmerStyle,
        ]}
      />
    </Animated2.View>
  );
};

// ============================================================
// 🏠 PANTALLA
// ============================================================
export default function PantallaMenu(props: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

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

  const [orden, setOrden] = useState<OrdenTipo>('default');
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');

  const [sheetVisible, setSheetVisible] = useState(false);

  const categoriasListRef = useRef<FlatList>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const headerShrinkStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollY.value, [0, 80], [0, 1], Extrapolate.CLAMP);
    return {
      opacity: 1 - progress * 0.1,
    };
  });

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

  const aplicarFiltros = useCallback(
    (texto: string, listaBase: Producto[], ord: OrdenTipo, fil: FiltroTipo) => {
      let resultado = [...listaBase];

      if (texto.trim() !== '') {
        const q = texto.toLowerCase();
        resultado = resultado.filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.descripcion?.toLowerCase().includes(q),
        );
      }

      if (fil === 'con-papas') {
        resultado = resultado.filter((p) => p.incluye_papas);
      } else if (fil === 'favoritos') {
        resultado = resultado.filter((p) => idsFavoritos?.includes(Number(p.id)));
      }

      if (ord === 'precio-asc') {
        resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
      } else if (ord === 'precio-desc') {
        resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
      } else if (ord === 'nombre') {
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }

      return resultado;
    },
    [idsFavoritos],
  );

  const filtrarPorBusqueda = useCallback(
    (texto: string) => {
      setBusqueda(texto);
      setProductosFiltrados(aplicarFiltros(texto, productos, orden, filtro));
    },
    [productos, orden, filtro, aplicarFiltros],
  );

  useEffect(() => {
    setProductosFiltrados(aplicarFiltros(busqueda, productos, orden, filtro));
  }, [orden, filtro, productos, busqueda, aplicarFiltros]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
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
          colores={colores}
          estilos={estilos}
        />
      );
    },
    [
      cardWidth, modoGrid, agregados, idsFavoritos,
      handleDetalleProducto, handleAgregarProducto, handleToggleFavorito, tamanos,
      colores, estilos,
    ],
  );

  const datosFormateados = useMemo(() => {
    if (!modoGrid) return productosFiltrados;
    return formatData([...productosFiltrados], numColumns);
  }, [productosFiltrados, modoGrid, numColumns, formatData]);

  const headerGradientHeight = insets.top + tamanos.headerTopPadding + 220;

  const filtrosActivos = (orden !== 'default' ? 1 : 0) + (filtro !== 'todos' ? 1 : 0);

  const aplicarOrden = (o: OrdenTipo) => {
    Haptics.selectionAsync().catch(() => { });
    setOrden(o);
  };
  const aplicarFiltro = (f: FiltroTipo) => {
    Haptics.selectionAsync().catch(() => { });
    setFiltro(f);
  };
  const limpiarFiltros = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setOrden('default');
    setFiltro('todos');
  };

  return (
    <View style={[estilos.container, { backgroundColor: colores.fondo }]}>
      {/* FONDO */}
      <LinearGradient
        colors={[colores.fondoAlt, colores.fondo]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={[colores.gradientStart, colores.gradientMid, colores.gradientEnd]}
        locations={[0, 0.55, 1]}
        style={[estilos.headerGradiente, { height: headerGradientHeight }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {Platform.OS === 'ios' && (
        <BlurView
          style={[estilos.headerBlur, { height: insets.top + 60 }]}
          blurType={colores.isDark ? 'dark' : 'light'}
          blurAmount={8}
          reducedTransparencyFallbackColor={
            colores.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)'
          }
        />
      )}
      <View
        style={[
          estilos.headerCurve,
          {
            height: 28,
            marginTop: headerGradientHeight - 28,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colores.fondo,
          },
        ]}
      />

      {/* HEADER */}
      <Animated2.View style={[headerShrinkStyle]}>
        <Animated.View
          style={[
            estilos.header,
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
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              props.navigation.goBack();
            }}
            style={[
              estilos.iconButton,
              {
                width: tamanos.iconButtonSize,
                height: tamanos.iconButtonSize,
                borderRadius: tamanos.iconButtonSize / 2,
              },
            ]}
            activeOpacity={0.85}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={tamanos.backIconSize} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={estilos.titleBlock}>
            <Text
              style={[estilos.title, { fontSize: tamanos.tituloSize }]}
              allowFontScaling={false}
              numberOfLines={1}
            >
              Menú Krusty
            </Text>
            <Text style={estilos.titleSub} allowFontScaling={false} numberOfLines={1}>
              {productosFiltrados.length}{' '}
              {productosFiltrados.length === 1 ? 'producto' : 'productos'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              setModoGrid(!modoGrid);
            }}
            style={[
              estilos.iconButton,
              {
                width: tamanos.iconButtonSize,
                height: tamanos.iconButtonSize,
                borderRadius: tamanos.iconButtonSize / 2,
              },
            ]}
            activeOpacity={0.85}
            hitSlop={8}
          >
            <Ionicons
              name={modoGrid ? 'grid-outline' : 'list-outline'}
              size={tamanos.gridIconSize}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated2.View>

      {/* BUSCADOR + BOTÓN FILTROS */}
      <Animated.View
        style={[
          estilos.searchContainer,
          {
            paddingHorizontal: tamanos.padding,
            paddingBottom: tamanos.headerBottomPadding,
            paddingTop: tamanos.searchPadding,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            estilos.searchInput,
            {
              backgroundColor: colores.surface,
              borderRadius: tamanos.searchRadius,
              paddingHorizontal: tamanos.searchPaddingH,
              paddingVertical: tamanos.searchPaddingV,
            },
          ]}
        >
          <View style={estilos.searchIconWrap}>
            <Ionicons name="search" size={tamanos.searchIconSize} color={colores.accent} />
          </View>
          <TextInput
            style={[
              estilos.searchInputText,
              {
                fontSize: tamanos.searchTextSize,
                color: colores.text,
                marginLeft: 10,
                flex: 1,
              },
            ]}
            placeholder="Buscar en el menú..."
            placeholderTextColor={colores.textTertiary}
            value={busqueda}
            onChangeText={filtrarPorBusqueda}
            allowFontScaling={false}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => { });
                filtrarPorBusqueda('');
              }}
              style={[estilos.clearButton, { backgroundColor: colores.textTertiary }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
            setSheetVisible(true);
          }}
          style={[
            estilos.filterButton,
            {
              backgroundColor: filtrosActivos > 0 ? colores.accent : colores.surface,
              borderColor: filtrosActivos > 0 ? colores.accent : colores.border,
            },
          ]}
          activeOpacity={0.85}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={filtrosActivos > 0 ? '#FFFFFF' : colores.text}
          />
          {filtrosActivos > 0 && (
            <View style={[estilos.filterBadge, { backgroundColor: colores.accentSecondary, borderColor: colores.fondo }]}>
              <Text style={[estilos.filterBadgeText, { color: colores.text }]} allowFontScaling={false}>
                {filtrosActivos}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* CATEGORÍAS */}
      <Animated.View
        style={[
          estilos.categoriesContainer,
          {
            opacity: fadeAnim,
            paddingVertical: tamanos.catContainerPaddingV,
          },
        ]}
      >
        <FlatList
          ref={categoriasListRef}
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[estilos.categoriesList, { paddingHorizontal: tamanos.padding }]}
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
          renderItem={({ item, index }) => {
            const seleccionada = categoriaSeleccionada === item.id;
            return (
              <Animated2.View entering={FadeInDown.delay(index * 40).springify()}>
                <TouchableRipple
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => { });
                    setCategoriaSeleccionada(item.id);
                  }}
                  borderless
                  rippleColor={seleccionada ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}
                  style={[
                    estilos.category,
                    {
                      height: tamanos.catHeight,
                      paddingHorizontal: tamanos.catWidth * 0.14,
                      marginRight: tamanos.catMarginRight,
                      borderRadius: tamanos.catRadius,
                      backgroundColor: seleccionada ? colores.accent : colores.surface,
                      borderColor: seleccionada ? colores.accent : colores.border,
                    },
                  ]}
                >
                  <View style={estilos.categoryInner}>
                    <Ionicons
                      name={item.icono}
                      size={tamanos.catIconSize}
                      color={seleccionada ? '#FFFFFF' : colores.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        estilos.categoryText,
                        {
                          fontSize: tamanos.catTextSize,
                          color: seleccionada ? '#FFFFFF' : colores.textSecondary,
                        },
                      ]}
                      allowFontScaling={false}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                </TouchableRipple>
              </Animated2.View>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      </Animated.View>

      {/* LISTA PRODUCTOS */}
      {cargando ? (
        <View style={estilos.loadingContainer}>
          <View style={estilos.skeletonRow}>
            <SkeletonCard
              width={(screenWidth - tamanos.padding * 2 - tamanos.cardGap) / 2}
              height={tamanos.imageHeight + 70}
              radius={tamanos.cardRadius}
              colores={colores}
            />
            <SkeletonCard
              width={(screenWidth - tamanos.padding * 2 - tamanos.cardGap) / 2}
              height={tamanos.imageHeight + 70}
              radius={tamanos.cardRadius}
              colores={colores}
            />
          </View>
          <View style={estilos.skeletonRow}>
            <SkeletonCard
              width={(screenWidth - tamanos.padding * 2 - tamanos.cardGap) / 2}
              height={tamanos.imageHeight + 70}
              radius={tamanos.cardRadius}
              colores={colores}
            />
            <SkeletonCard
              width={(screenWidth - tamanos.padding * 2 - tamanos.cardGap) / 2}
              height={tamanos.imageHeight + 70}
              radius={tamanos.cardRadius}
              colores={colores}
            />
          </View>
          <View style={estilos.loadingIndicatorRow}>
            <ActivityIndicator size="small" color={colores.accent} />
            <Text
              style={[
                estilos.loadingText,
                { fontSize: tamanos.loadingTextSize, color: colores.textSecondary },
              ]}
              allowFontScaling={false}
            >
              Cargando el menú...
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={datosFormateados}
          renderItem={renderProducto}
          keyExtractor={(item, index) => item.id?.toString() || `empty-${index}`}
          contentContainerStyle={[
            estilos.productList,
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
              tintColor={colores.accent}
              colors={[colores.accent]}
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
                estilos.emptyContainer,
                { paddingTop: 60, paddingHorizontal: tamanos.padding },
              ]}
            >
              <View
                style={[
                  estilos.emptyIconWrap,
                  {
                    backgroundColor: colores.accent + '12',
                    borderColor: colores.accent + '20',
                  },
                ]}
              >
                <Ionicons
                  name={busqueda ? 'search-outline' : 'restaurant-outline'}
                  size={36}
                  color={colores.accent}
                />
              </View>
              <Text
                style={[
                  estilos.emptyText,
                  { fontSize: tamanos.emptyTextSize, color: colores.text },
                ]}
                allowFontScaling={false}
              >
                {busqueda ? 'Sin resultados' : 'Productos en esta categoría'}
              </Text>
              <Text
                style={[
                  estilos.emptySubtext,
                  { fontSize: tamanos.emptySubtextSize, color: colores.textSecondary },
                ]}
                allowFontScaling={false}
              >
                {busqueda
                  ? `No encontramos "${busqueda}". Probá otra búsqueda.`
                  : 'Pronto tendremos más opciones para vos'}
              </Text>
            </View>
          }
          key={modoGrid ? 'grid' : 'list'}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? estilos.columnWrapper : undefined}
        />
      )}

      {/* MODAL DE FILTROS */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
        statusBarTranslucent
      >
        <View style={estilos.modalRoot}>
          <Pressable
            style={estilos.modalBackdrop}
            onPress={() => setSheetVisible(false)}
          />

          <View style={[estilos.sheetContainer, { backgroundColor: colores.surface }]}>
            <View style={estilos.sheetHandleWrapper}>
              <View style={[estilos.sheetHandle, { backgroundColor: colores.textTertiary }]} />
            </View>

            <View style={estilos.sheetContent}>
              <View style={estilos.sheetHeader}>
                <Text style={[estilos.sheetTitle, { color: colores.text }]} allowFontScaling={false}>
                  Filtros y orden
                </Text>
                <TouchableOpacity onPress={limpiarFiltros} hitSlop={8}>
                  <Text style={[estilos.sheetClear, { color: colores.accent }]} allowFontScaling={false}>
                    Limpiar
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[estilos.sheetSectionTitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                Ordenar por
              </Text>
              <View style={estilos.chipsRow}>
                {([
                  { key: 'default', label: 'Recomendado', icon: 'sparkles-outline' },
                  { key: 'precio-asc', label: 'Menor precio', icon: 'trending-up-outline' },
                  { key: 'precio-desc', label: 'Mayor precio', icon: 'trending-down-outline' },
                  { key: 'nombre', label: 'A-Z', icon: 'text-outline' },
                ] as const).map((opt) => {
                  const activo = orden === opt.key;
                  return (
                    <TouchableRipple
                      key={opt.key}
                      onPress={() => aplicarOrden(opt.key)}
                      borderless
                      rippleColor="rgba(0,0,0,0.1)"
                      style={[
                        estilos.sheetChip,
                        {
                          backgroundColor: activo ? colores.accent : colores.surfaceHover,
                          borderColor: activo ? colores.accent : colores.border,
                        },
                      ]}
                    >
                      <View style={estilos.sheetChipInner}>
                        <Ionicons
                          name={opt.icon as any}
                          size={14}
                          color={activo ? '#FFFFFF' : colores.textSecondary}
                        />
                        <Text
                          style={[
                            estilos.sheetChipText,
                            { color: activo ? '#FFFFFF' : colores.textSecondary },
                          ]}
                          allowFontScaling={false}
                        >
                          {opt.label}
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>

              <Text style={[estilos.sheetSectionTitle, { color: colores.textSecondary, marginTop: 20 }]} allowFontScaling={false}>
                Filtrar
              </Text>
              <View style={estilos.chipsRow}>
                {([
                  { key: 'todos', label: 'Todos', icon: 'apps-outline' },
                  { key: 'con-papas', label: 'Con papas', icon: 'fast-food-outline' },
                  { key: 'favoritos', label: 'Solo favoritos', icon: 'heart-outline' },
                ] as const).map((opt) => {
                  const activo = filtro === opt.key;
                  return (
                    <TouchableRipple
                      key={opt.key}
                      onPress={() => aplicarFiltro(opt.key)}
                      borderless
                      rippleColor="rgba(0,0,0,0.1)"
                      style={[
                        estilos.sheetChip,
                        {
                          backgroundColor: activo ? colores.accent : colores.surfaceHover,
                          borderColor: activo ? colores.accent : colores.border,
                        },
                      ]}
                    >
                      <View style={estilos.sheetChipInner}>
                        <Ionicons
                          name={opt.icon as any}
                          size={14}
                          color={activo ? '#FFFFFF' : colores.textSecondary}
                        />
                        <Text
                          style={[
                            estilos.sheetChipText,
                            { color: activo ? '#FFFFFF' : colores.textSecondary },
                          ]}
                          allowFontScaling={false}
                        >
                          {opt.label}
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                  setSheetVisible(false);
                }}
                style={[estilos.sheetApplyButton, { backgroundColor: colores.accent }]}
                activeOpacity={0.85}
              >
                <Text style={estilos.sheetApplyText} allowFontScaling={false}>
                  Ver {productosFiltrados.length}{' '}
                  {productosFiltrados.length === 1 ? 'producto' : 'productos'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },

    headerGradiente: {
      position: 'absolute', top: 0, left: 0, right: 0,
    },
    headerBlur: {
      position: 'absolute', top: 0, left: 0, right: 0,
    },
    headerCurve: {
      position: 'absolute', left: 0, right: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconButton: {
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    title: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      letterSpacing: 0.5,
      includeFontPadding: false,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    titleSub: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
      includeFontPadding: false,
      textAlign: 'center',
    },

    searchContainer: {
      backgroundColor: 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colores.border,
      shadowColor: colores.cardShadowHeavy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    searchIconWrap: { alignItems: 'center', justifyContent: 'center' },
    searchInputText: {
      fontFamily: FUENTES.regular,
      padding: 0,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    clearButton: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
    },
    filterButton: {
      width: 46, height: 46,
      borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
      shadowColor: colores.cardShadowHeavy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
      position: 'relative',
    },
    filterBadge: {
      position: 'absolute',
      top: -4, right: -4,
      minWidth: 18, height: 18, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
    },
    filterBadgeText: {
      fontFamily: FUENTES.display,
      fontSize: 10,
      includeFontPadding: false,
    },

    categoriesContainer: { backgroundColor: 'transparent' },
    categoriesList: { gap: 0, paddingVertical: 2 },
    category: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: colores.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    categoryInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryText: {
      fontFamily: FUENTES.display,
      letterSpacing: 0.3,
      includeFontPadding: false,
    },

    productList: { flexGrow: 1 },
    productCardWrapper: { flex: 1 },
    productCard: {
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: colores.cardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 14,
      elevation: 4,
    },
    productImageContainer: {
      width: '100%', overflow: 'hidden', position: 'relative',
      backgroundColor: colores.surfaceHover,
    },
    productImage: { width: '100%', height: '100%' },
    productImagePlaceholder: {
      width: '100%', height: '100%',
      justifyContent: 'center', alignItems: 'center',
    },
    productImageOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
    },
    badgeConPapas: {
      position: 'absolute', top: 10, left: 10,
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
    },
    badgeConPapasTexto: {
      fontFamily: FUENTES.regular,
      fontWeight: '700',
      color: colores.accent,
      letterSpacing: 0.2,
      includeFontPadding: false,
    },
    favoritoBadgeWrap: { position: 'absolute', top: 8, right: 8, zIndex: 10 },
    favoritoBadge: {
      borderRadius: 999,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
    },
    productInfo: { flex: 1 },
    productName: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      marginBottom: 3,
      includeFontPadding: false,
      lineHeight: 18,
      letterSpacing: -0.2,
    },
    productDesc: {
      fontFamily: FUENTES.regular,
      marginBottom: 10,
      opacity: 0.7,
      includeFontPadding: false,
      lineHeight: 16,
    },
    productFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', gap: 8,
    },
    priceBlock: { flexShrink: 1 },
    productPrice: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      flexShrink: 0,
      includeFontPadding: false,
      lineHeight: 22,
      letterSpacing: -0.3,
    },
    addButton: {
      justifyContent: 'center', alignItems: 'center', padding: 0,
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
    },
    columnWrapper: { justifyContent: 'space-between', gap: 12 },

    loadingContainer: {
      flex: 1, paddingHorizontal: 18, paddingTop: 16, gap: 12,
    },
    skeletonRow: { flexDirection: 'row', gap: 12 },
    loadingIndicatorRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 10, marginTop: 12,
    },
    loadingText: {
      fontFamily: FUENTES.regular,
      fontWeight: '400', opacity: 0.75,
      includeFontPadding: false,
    },

    emptyContainer: { alignItems: 'center' },
    emptyIconWrap: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, borderWidth: 1,
    },
    emptyText: {
      fontFamily: FUENTES.display,
      fontWeight: '400', textAlign: 'center',
      includeFontPadding: false,
    },
    emptySubtext: {
      fontFamily: FUENTES.regular, textAlign: 'center',
      marginTop: 8, opacity: 0.75,
      includeFontPadding: false, lineHeight: 20, maxWidth: 280,
    },

    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 16,
    },
    sheetHandleWrapper: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    sheetTitle: {
      fontFamily: FUENTES.display,
      fontSize: 20,
      includeFontPadding: false,
    },
    sheetClear: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      includeFontPadding: false,
    },
    sheetSectionTitle: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      marginBottom: 10,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      includeFontPadding: false,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      overflow: 'hidden',
    },
    sheetChipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sheetChipText: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      includeFontPadding: false,
    },
    sheetApplyButton: {
      marginTop: 24,
      height: 54,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    sheetApplyText: {
      fontFamily: FUENTES.display,
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      includeFontPadding: false,
    },
  });