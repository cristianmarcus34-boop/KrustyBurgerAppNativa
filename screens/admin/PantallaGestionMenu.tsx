// screens/admin/PantallaGestionMenu.tsx - CON EXPO-IMAGE-PICKER
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // ✅ IMPORTADO
import { supabase } from '../../lib/supabase';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - BLANCO Y ELEGANTE
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

const { width, height } = Dimensions.get('window');

// ✅ Etiquetas de categorías
const ETIQUETAS_CATEGORIA: Record<string, string> = {
  burgers: '🍔 Hamburguesas',
  combos: '🍟 Combos',
  bebidas: '🥤 Bebidas',
  postres: '🍦 Postres',
  acompanantes: '🍿 Acompañantes',
};

const CATEGORIAS_OPCIONES = ['burgers', 'combos', 'bebidas', 'postres', 'acompanantes'];

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = Dimensions.get('window');
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  return {
    isTablet,
    isDesktop,
    isSmallPhone,
    width,
    height,
    paddingHorizontal: isTablet ? 40 : isSmallPhone ? 12 : 16,
    tituloSize: isTablet ? 28 : isSmallPhone ? 20 : 22,
    tarjetaPadding: isTablet ? 16 : isSmallPhone ? 10 : 12,
    imagenSize: isTablet ? 90 : isSmallPhone ? 60 : 75,
    nombreSize: isTablet ? 17 : isSmallPhone ? 13 : 15,
    precioSize: isTablet ? 18 : isSmallPhone ? 14 : 16,
    labelSize: isTablet ? 15 : isSmallPhone ? 12 : 13,
    inputSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
    modalWidth: isTablet ? width * 0.7 : width * 0.92,
    modalMaxHeight: isTablet ? height * 0.8 : height * 0.85,
  };
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionMenu(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  // ✅ ESTADOS
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // ✅ FORMULARIO
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('burgers');
  const [imagen, setImagen] = useState('');

  // ✅ ANIMACIONES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const [modalKey, setModalKey] = useState(0);

  // ✅ REF PARA SCROLL
  const scrollViewRef = useRef<ScrollView>(null);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    // ✅ SOLICITAR PERMISOS DE GALERÍA
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a tu galería para subir imágenes');
      }
    })();

    cargarProductos();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ============================================================
  // 🔄 FUNCIONES CRUD
  // ============================================================
  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setProductos(data as Producto[] || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const manejarRefresh = useCallback(() => {
    setRefrescando(true);
    cargarProductos();
  }, []);

  // ============================================================
  // 📷 IMAGEN - CON EXPO-IMAGE-PICKER
  // ============================================================
  const seleccionarImagen = async () => {
    try {
      // ✅ Verificar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a tu galería para subir imágenes');
        return;
      }

      // ✅ ABRIR GALERÍA
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // ✅ Mostrar preview inmediatamente
        setImagen(uri);

        // ✅ SUBIR A SUPABASE
        setSubiendoImagen(true);

        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileExt = uri.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('productos_imagenes')
            .upload(fileName, blob, {
              contentType: `image/${fileExt}`,
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Error subiendo imagen:', uploadError);
            Alert.alert('Error', 'No se pudo subir la imagen: ' + uploadError.message);
            setSubiendoImagen(false);
            return;
          }

          const { data: urlData } = supabase.storage
            .from('productos_imagenes')
            .getPublicUrl(fileName);

          const publicUrl = urlData.publicUrl;
          setImagen(publicUrl);
          Alert.alert('✅ Éxito', 'Imagen subida correctamente');
        } catch (error: any) {
          console.error('Error:', error);
          Alert.alert('Error', error.message || 'No se pudo subir la imagen');
        } finally {
          setSubiendoImagen(false);
        }
      }
    } catch (error: any) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', error.message || 'No se pudo seleccionar la imagen');
    }
  };

  // ============================================================
  // 📝 FORMULARIO
  // ============================================================
  const abrirFormulario = (producto?: Producto) => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('burgers');
    setImagen('');

    if (producto) {
      setProductoEditando(producto);
      setTimeout(() => {
        setNombre(producto.nombre);
        setDescripcion(producto.descripcion || '');
        setPrecio(String(producto.precio));
        setCategoria(producto.categoria);
        setImagen(producto.imagen || '');
        setModalKey(prev => prev + 1);
        setModalVisible(true);
        setTimeout(() => {
          Keyboard.dismiss();
        }, 100);
      }, 100);
    } else {
      setProductoEditando(null);
      setModalKey(prev => prev + 1);
      setModalVisible(true);
    }
  };

  const cerrarModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    setTimeout(() => {
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setCategoria('burgers');
      setImagen('');
      setProductoEditando(null);
    }, 300);
  };

  // ============================================================
  // 💾 GUARDAR PRODUCTO
  // ============================================================
  const guardarProducto = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!precio) {
      Alert.alert('Error', 'El precio es obligatorio');
      return;
    }
    if (!categoria) {
      Alert.alert('Error', 'La categoría es obligatoria');
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || '',
      precio: precioNum,
      categoria,
      imagen: imagen || null,
    };

    try {
      if (productoEditando) {
        const { error } = await supabase
          .from('productos')
          .update(datos)
          .eq('id', productoEditando.id);
        if (error) throw error;
        Alert.alert('✅ Éxito', 'Producto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert(datos);
        if (error) throw error;
        Alert.alert('✅ Éxito', 'Producto creado correctamente');
      }

      setModalVisible(false);
      cargarProductos();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'No se pudo guardar el producto');
    }
  };

  // ============================================================
  // 🗑️ ELIMINAR PRODUCTO
  // ============================================================
  const eliminarProducto = (id: number, nombre: string) => {
    Alert.alert(
      '🗑️ Eliminar producto',
      `¿Estás seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id);
              if (error) throw error;
              Alert.alert('✅ Éxito', 'Producto eliminado correctamente');
              cargarProductos();
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  // ============================================================
  // 🖼️ RENDER DE PRODUCTO
  // ============================================================
  const renderProducto = useCallback(({ item, index }: { item: Producto; index: number }) => {
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

    const imagenSize = responsive.imagenSize;

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <View style={[
          estilos.tarjeta,
          {
            padding: responsive.tarjetaPadding,
            borderRadius: responsive.isTablet ? 18 : responsive.isSmallPhone ? 12 : 16,
            backgroundColor: DESIGN.colors.surface,
            borderColor: DESIGN.colors.border,
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
          }
        ]}>
          {/* Imagen */}
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[estilos.imagen, { width: imagenSize, height: imagenSize, borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[estilos.imagenPlaceholder, {
              width: imagenSize,
              height: imagenSize,
              borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
              backgroundColor: DESIGN.colors.surfaceHover,
            }]}>
              <Text style={[estilos.emoji, { fontSize: responsive.isTablet ? 36 : responsive.isSmallPhone ? 24 : 30 }]}>🍔</Text>
            </View>
          )}

          {/* Info */}
          <View style={estilos.info}>
            <View style={[estilos.categoriaBadge, {
              backgroundColor: DESIGN.colors.accentSecondary + '15',
              paddingHorizontal: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
              paddingVertical: responsive.isTablet ? 3 : responsive.isSmallPhone ? 1 : 2,
              borderRadius: responsive.isTablet ? 8 : responsive.isSmallPhone ? 4 : 6,
              borderWidth: 1,
              borderColor: DESIGN.colors.accentSecondary + '20',
            }]}>
              <Text style={[estilos.categoriaTexto, {
                fontSize: responsive.isTablet ? 11 : responsive.isSmallPhone ? 8 : 9,
                color: DESIGN.colors.accentSecondary,
                fontWeight: '600',
              }]}>
                {ETIQUETAS_CATEGORIA[item.categoria] || item.categoria}
              </Text>
            </View>
            <Text style={[estilos.nombre, {
              fontSize: responsive.nombreSize,
              color: DESIGN.colors.text,
            }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={[estilos.descripcion, {
              fontSize: responsive.isTablet ? 13 : responsive.isSmallPhone ? 10 : 11,
              color: DESIGN.colors.textSecondary,
            }]} numberOfLines={2}>
              {item.descripcion || 'Sin descripción'}
            </Text>
            <Text style={[estilos.precio, {
              fontSize: responsive.precioSize,
              color: DESIGN.colors.accent,
              fontWeight: '700',
            }]}>
              {formatearPrecio(typeof item.precio === 'number' ? item.precio : parseFloat(item.precio) || 0)}
            </Text>
          </View>

          {/* Acciones */}
          <View style={estilos.acciones}>
            <TouchableOpacity
              style={[estilos.botonAccion, {
                width: responsive.isTablet ? 40 : responsive.isSmallPhone ? 30 : 36,
                height: responsive.isTablet ? 40 : responsive.isSmallPhone ? 30 : 36,
                borderRadius: responsive.isTablet ? 20 : responsive.isSmallPhone ? 15 : 18,
                backgroundColor: DESIGN.colors.accentSecondary + '15',
                borderColor: DESIGN.colors.accentSecondary + '30',
                borderWidth: 1,
              }]}
              onPress={() => abrirFormulario(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={responsive.isTablet ? 20 : responsive.isSmallPhone ? 14 : 18} color={DESIGN.colors.accentSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonAccion, estilos.botonEliminar, {
                width: responsive.isTablet ? 40 : responsive.isSmallPhone ? 30 : 36,
                height: responsive.isTablet ? 40 : responsive.isSmallPhone ? 30 : 36,
                borderRadius: responsive.isTablet ? 20 : responsive.isSmallPhone ? 15 : 18,
                backgroundColor: DESIGN.colors.accent + '15',
                borderColor: DESIGN.colors.accent + '30',
                borderWidth: 1,
              }]}
              onPress={() => eliminarProducto(item.id, item.nombre)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={responsive.isTablet ? 20 : responsive.isSmallPhone ? 14 : 18} color={DESIGN.colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }, [responsive, fadeAnim, slideUpAnim, abrirFormulario, eliminarProducto]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const paddingHorizontal = responsive.paddingHorizontal;

  return (
    <View style={estilos.contenedor}>
      {/* Fondo blanco/crema */}
      <View style={estilos.background} />

      {/* Header con gradiente */}
      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
        style={estilos.headerGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[
          estilos.header,
          {
            paddingTop: insets.top + (responsive.isTablet ? 20 : 10),
            paddingHorizontal: paddingHorizontal,
            paddingBottom: responsive.isTablet ? 16 : 12,
          }
        ]}>
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => props.navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={responsive.isTablet ? 28 : 24} color={DESIGN.colors.surface} />
          </TouchableOpacity>

          <Text style={[estilos.titulo, {
            fontSize: responsive.tituloSize,
            color: DESIGN.colors.surface,
            fontWeight: '700',
            letterSpacing: 0.5,
          }]}>
            📋 Gestión de Menú
          </Text>

          <TouchableOpacity
            style={[estilos.botonAgregar, {
              paddingHorizontal: responsive.isTablet ? 18 : responsive.isSmallPhone ? 12 : 16,
              paddingVertical: responsive.isTablet ? 12 : responsive.isSmallPhone ? 8 : 10,
              backgroundColor: DESIGN.colors.surface,
              borderRadius: 30,
              shadowColor: DESIGN.colors.cardShadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 4,
            }]}
            onPress={() => abrirFormulario()}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={responsive.isTablet ? 26 : responsive.isSmallPhone ? 18 : 22} color={DESIGN.colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contador */}
      <View style={[estilos.contadorContainer, {
        paddingHorizontal: paddingHorizontal,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.surface + '90',
      }]}>
        <Text style={[estilos.contador, {
          fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
          color: DESIGN.colors.textSecondary,
          fontWeight: '500',
        }]}>
          {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>

      <FlatList
        data={productos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProducto}
        contentContainerStyle={[
          estilos.lista,
          {
            paddingHorizontal: paddingHorizontal,
            paddingBottom: insets.bottom + (responsive.isTablet ? 200 : 160),
            paddingTop: responsive.isTablet ? 8 : 4,
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={DESIGN.colors.accent}
            colors={[DESIGN.colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={estilos.vacioContenedor}>
            <Ionicons name="restaurant-outline" size={responsive.isTablet ? 80 : 60} color={DESIGN.colors.textTertiary} />
            <Text style={[estilos.vacio, {
              fontSize: responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16,
              color: DESIGN.colors.text,
              fontWeight: '600',
            }]}>
              No hay productos
            </Text>
            <Text style={[estilos.vacioSubtexto, {
              fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
              color: DESIGN.colors.textSecondary,
            }]}>
              Agrega tu primer producto presionando el botón +
            </Text>
          </View>
        }
      />

      {/* ============================================================ */}
      {/* 📝 MODAL - FORMULARIO */}
      {/* ============================================================ */}
      <Modal
        key={modalKey}
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <TouchableOpacity
          style={estilos.modalBackdrop}
          activeOpacity={1}
          onPress={cerrarModal}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.modalKeyboard}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[
            estilos.modal,
            {
              padding: responsive.isTablet ? 32 : responsive.isSmallPhone ? 16 : 24,
              borderRadius: responsive.isTablet ? 28 : 24,
              width: responsive.modalWidth,
              maxHeight: responsive.modalMaxHeight,
              borderColor: DESIGN.colors.border,
              backgroundColor: DESIGN.colors.surface,
            }
          ]}>
            {/* Header del modal */}
            <View style={estilos.modalHeader}>
              <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={estilos.modalHeaderGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name={productoEditando ? 'create' : 'add-circle'}
                  size={responsive.isTablet ? 32 : responsive.isSmallPhone ? 24 : 28}
                  color={DESIGN.colors.surface}
                />
                <Text style={[estilos.modalTitulo, {
                  fontSize: responsive.isTablet ? 26 : responsive.isSmallPhone ? 20 : 22,
                  color: DESIGN.colors.surface,
                  fontWeight: '700',
                }]}>
                  {productoEditando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                </Text>
              </LinearGradient>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={estilos.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: responsive.isTablet ? 40 : 80,
                paddingTop: 4,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              scrollEnabled={true}
              automaticallyAdjustKeyboardInsets={true}
            >
              {/* Nombre */}
              <Text style={[estilos.label, {
                fontSize: responsive.labelSize,
                color: DESIGN.colors.text,
              }]}>
                <Ionicons name="restaurant-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Nombre *
              </Text>
              <TextInput
                style={[estilos.input, {
                  fontSize: responsive.inputSize,
                  color: DESIGN.colors.text,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Krusty Burger"
                placeholderTextColor={DESIGN.colors.textTertiary}
                selectionColor={DESIGN.colors.accent}
              />

              {/* Descripción */}
              <Text style={[estilos.label, {
                fontSize: responsive.labelSize,
                marginTop: 14,
                color: DESIGN.colors.text,
              }]}>
                <Ionicons name="document-text-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Descripción
              </Text>
              <TextInput
                style={[estilos.input, estilos.textArea, {
                  fontSize: responsive.inputSize,
                  color: DESIGN.colors.text,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                  minHeight: 80,
                }]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción del producto"
                placeholderTextColor={DESIGN.colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={DESIGN.colors.accent}
              />

              {/* Precio */}
              <Text style={[estilos.label, {
                fontSize: responsive.labelSize,
                marginTop: 14,
                color: DESIGN.colors.text,
              }]}>
                <Ionicons name="cash-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Precio *
              </Text>
              <TextInput
                style={[estilos.input, {
                  fontSize: responsive.inputSize,
                  color: DESIGN.colors.text,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                }]}
                value={precio}
                onChangeText={setPrecio}
                placeholder="Ej: 9500"
                placeholderTextColor={DESIGN.colors.textTertiary}
                keyboardType="numeric"
                selectionColor={DESIGN.colors.accent}
              />

              {/* Categoría */}
              <Text style={[estilos.label, {
                fontSize: responsive.labelSize,
                marginTop: 14,
                color: DESIGN.colors.text,
              }]}>
                <Ionicons name="grid-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Categoría *
              </Text>
              <View style={[estilos.categoriasGrid, { gap: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8 }]}>
                {CATEGORIAS_OPCIONES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      estilos.categoriaOpcion,
                      {
                        paddingHorizontal: responsive.isTablet ? 18 : responsive.isSmallPhone ? 10 : 14,
                        paddingVertical: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                        borderRadius: responsive.isTablet ? 22 : responsive.isSmallPhone ? 14 : 18,
                        backgroundColor: categoria === cat ? DESIGN.colors.accentSecondary : DESIGN.colors.surfaceHover,
                        borderColor: categoria === cat ? DESIGN.colors.accentSecondary : DESIGN.colors.border,
                        borderWidth: 1,
                        shadowColor: DESIGN.colors.cardShadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: categoria === cat ? 1 : 0,
                        shadowRadius: 4,
                        elevation: categoria === cat ? 3 : 0,
                      }
                    ]}
                    onPress={() => setCategoria(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      estilos.categoriaOpcionTexto,
                      {
                        fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
                        color: categoria === cat ? DESIGN.colors.text : DESIGN.colors.textSecondary,
                        fontWeight: categoria === cat ? '700' : '500',
                      }
                    ]}>
                      {ETIQUETAS_CATEGORIA[cat] || cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Imagen */}
              <Text style={[estilos.label, {
                fontSize: responsive.labelSize,
                marginTop: 14,
                color: DESIGN.colors.text,
              }]}>
                <Ionicons name="image-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Imagen
              </Text>

              <TouchableOpacity
                style={[estilos.botonImagen, {
                  padding: responsive.isTablet ? 18 : responsive.isSmallPhone ? 12 : 16,
                  borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                }]}
                onPress={seleccionarImagen}
                activeOpacity={0.7}
                disabled={subiendoImagen}
              >
                {subiendoImagen ? (
                  <ActivityIndicator size="small" color={DESIGN.colors.accent} />
                ) : (
                  <Ionicons name="cloud-upload" size={responsive.isTablet ? 28 : responsive.isSmallPhone ? 20 : 24} color={DESIGN.colors.accent} />
                )}
                <Text style={[estilos.botonImagenTexto, {
                  fontSize: responsive.isTablet ? 15 : responsive.isSmallPhone ? 12 : 13,
                  color: subiendoImagen ? DESIGN.colors.textTertiary : DESIGN.colors.accent,
                  fontWeight: '600',
                }]}>
                  {subiendoImagen ? '⏳ Subiendo...' : imagen ? '✅ Imagen seleccionada' : '📷 Seleccionar imagen'}
                </Text>
              </TouchableOpacity>

              {/* Previa imagen */}
              {imagen ? (
                <View style={estilos.previaImagen}>
                  <Image
                    source={{ uri: imagen }}
                    style={[estilos.previaFoto, {
                      height: responsive.isTablet ? 200 : responsive.isSmallPhone ? 140 : 180,
                      borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
                    }]}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[estilos.botonQuitarImagen, {
                      width: responsive.isTablet ? 34 : responsive.isSmallPhone ? 24 : 30,
                      height: responsive.isTablet ? 34 : responsive.isSmallPhone ? 24 : 30,
                      borderRadius: responsive.isTablet ? 17 : responsive.isSmallPhone ? 12 : 15,
                      backgroundColor: DESIGN.colors.accent + '90',
                    }]}
                    onPress={() => setImagen('')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={responsive.isTablet ? 20 : responsive.isSmallPhone ? 14 : 18} color={DESIGN.colors.surface} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* URL manual */}
              <TextInput
                style={[estilos.input, {
                  fontSize: responsive.inputSize,
                  marginTop: 10,
                  color: DESIGN.colors.text,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                }]}
                value={imagen}
                onChangeText={setImagen}
                placeholder="🔗 O pega la URL manualmente"
                placeholderTextColor={DESIGN.colors.textTertiary}
                autoCapitalize="none"
                selectionColor={DESIGN.colors.accent}
              />
            </ScrollView>

            {/* Botones */}
            <View style={[estilos.modalBotones, { gap: responsive.isTablet ? 14 : responsive.isSmallPhone ? 8 : 12, marginTop: 16 }]}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar, {
                  paddingVertical: responsive.isTablet ? 16 : responsive.isSmallPhone ? 10 : 14,
                  borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderColor: DESIGN.colors.border,
                  borderWidth: 1,
                }]}
                onPress={cerrarModal}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={DESIGN.colors.textSecondary} />
                <Text style={[estilos.modalCancelarTexto, {
                  fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                  color: DESIGN.colors.textSecondary,
                  fontWeight: '600',
                }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalGuardar, {
                  paddingVertical: responsive.isTablet ? 16 : responsive.isSmallPhone ? 10 : 14,
                  borderRadius: responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12,
                  overflow: 'hidden',
                }]}
                onPress={guardarProducto}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                  style={estilos.modalGuardarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="save" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={DESIGN.colors.surface} />
                  <Text style={[estilos.modalGuardarTexto, {
                    fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                    color: DESIGN.colors.surface,
                    fontWeight: '700',
                  }]}>
                    {productoEditando ? 'Actualizar' : 'Crear'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - BLANCOS Y ELEGANTES
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DESIGN.colors.fondo,
  },
  headerGradiente: {
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  botonVolver: {
    padding: 4,
  },
  titulo: {
    fontWeight: '700',
    color: DESIGN.colors.surface,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  botonAgregar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorContainer: {
    borderBottomWidth: 1,
  },
  contador: {
    fontWeight: '500',
  },
  lista: {
    flexGrow: 1,
  },
  tarjeta: {
    flexDirection: 'row',
    marginBottom: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  imagen: {
    marginRight: 12,
  },
  imagenPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {},
  info: {
    flex: 1,
  },
  categoriaBadge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoriaTexto: {
    textTransform: 'capitalize',
  },
  nombre: {
    fontWeight: '600',
    marginBottom: 1,
  },
  descripcion: {
    lineHeight: 16,
    opacity: 0.7,
    marginBottom: 2,
  },
  precio: {
    fontWeight: '700',
  },
  acciones: {
    gap: 8,
    marginLeft: 8,
  },
  botonAccion: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  botonEliminar: {
    borderWidth: 1,
  },
  vacioContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  vacio: {
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSubtexto: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  modalFondo: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalKeyboard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modal: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: DESIGN.colors.cardShadowHeavy,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
    width: '100%',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalHeaderGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalTitulo: {
    fontWeight: '700',
    color: DESIGN.colors.surface,
  },
  modalScroll: {
    maxHeight: '70%',
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoriaOpcion: {
    borderWidth: 1,
  },
  categoriaOpcionTexto: {
    fontWeight: '600',
  },
  botonImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  botonImagenTexto: {
    fontWeight: '600',
  },
  previaImagen: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previaFoto: {
    width: '100%',
  },
  botonQuitarImagen: {
    position: 'absolute',
    top: 8,
    right: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.surface,
  },
  modalBotones: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalBoton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  modalCancelar: {
    borderWidth: 1,
  },
  modalCancelarTexto: {
    fontWeight: '600',
  },
  modalGuardar: {
    overflow: 'hidden',
  },
  modalGuardarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    height: '100%',
  },
  modalGuardarTexto: {
    fontWeight: '700',
  },
});