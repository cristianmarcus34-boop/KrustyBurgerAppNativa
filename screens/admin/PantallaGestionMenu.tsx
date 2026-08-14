import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Image, Modal, TextInput, ScrollView,
  Dimensions, Animated, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES (CONSISTENTE CON EL RESTO DE LA APP)
// ============================================================
const COLORS = {
  amarillo: '#F5C518',
  amarilloClaro: '#FFE066',
  amarilloOscuro: '#D4A800',
  rojo: '#E53935',
  rojoOscuro: '#B71C1C',
  verde: '#43A047',
  verdeClaro: '#66BB6A',
  blanco: '#FFFFFF',
  negro: '#0A0A0A',
  grisOscuro: '#1A1A1A',
  gris: '#333333',
  grisClaro: '#B0B0B0',
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

export default function PantallaGestionMenu(props: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('burgers');
  const [imagen, setImagen] = useState('');

  const insets = useSafeAreaInsets();

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    cargarProductos();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    setProductos(data as Producto[] || []);
    setCargando(false);
    setRefrescando(false);
  };

  const manejarRefresh = useCallback(() => {
    setRefrescando(true);
    cargarProductos();
  }, []);

  const seleccionarImagen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setSubiendoImagen(true);
      const nombreArchivo = Date.now() + '_' + file.name.replace(/\s/g, '_');
      const { error } = await supabase.storage
        .from('productos_imagenes')
        .upload(nombreArchivo, file);
      if (error) {
        Alert.alert('Error', 'No se pudo subir la imagen');
        setSubiendoImagen(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('productos_imagenes')
        .getPublicUrl(nombreArchivo);
      setImagen(urlData.publicUrl);
      setSubiendoImagen(false);
    };
    input.click();
  };

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
      }, 50);
    } else {
      setProductoEditando(null);
      setModalKey(prev => prev + 1);
      setModalVisible(true);
    }
  };

  const guardarProducto = async () => {
    if (!nombre || !precio || !categoria) {
      Alert.alert('Error', 'Completa nombre, precio y categoría');
      return;
    }

    const datos = {
      nombre,
      descripcion,
      precio: Number(precio),
      categoria,
      imagen: imagen || null,
    };

    if (productoEditando) {
      await supabase.from('productos').update(datos).eq('id', productoEditando.id);
    } else {
      await supabase.from('productos').insert(datos);
    }
    setModalVisible(false);
    cargarProductos();
    Alert.alert('Éxito', productoEditando ? 'Producto actualizado' : 'Producto creado');
  };

  const eliminarProducto = (id: number, nombre: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('productos').delete().eq('id', id);
            cargarProductos();
          }
        }
      ]
    );
  };

  const cerrarModal = () => {
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

  const categorias = ['burgers', 'combos', 'bebidas', 'postres', 'acompanantes'];

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const tarjetaPadding = isTablet ? 16 : isSmallPhone ? 10 : 12;
  const imagenSize = isTablet ? 100 : isSmallPhone ? 70 : 90;
  const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const precioSize = isTablet ? 20 : isSmallPhone ? 16 : 18;

  const renderProducto = ({ item, index }: { item: Producto; index: number }) => {
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

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
            padding: tarjetaPadding,
            borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
          }
        ]}>
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[estilos.imagen, { width: imagenSize, height: imagenSize, borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[estilos.imagenPlaceholder, { width: imagenSize, height: imagenSize, borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>
              <Text style={[estilos.emoji, { fontSize: isTablet ? 40 : isSmallPhone ? 28 : 36 }]}>🍔</Text>
            </View>
          )}

          <View style={estilos.info}>
            <View style={estilos.categoriaBadge}>
              <Text style={[estilos.categoriaTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>
                {ETIQUETAS_CATEGORIA[item.categoria] || item.categoria}
              </Text>
            </View>
            <Text style={[estilos.nombre, { fontSize: nombreSize }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={[estilos.descripcion, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]} numberOfLines={2}>
              {item.descripcion || 'Sin descripción'}
            </Text>
            <Text style={[estilos.precio, { fontSize: precioSize }]}>
              ${typeof item.precio === 'number' ? item.precio.toFixed(2) : item.precio}
            </Text>
          </View>

          <View style={estilos.acciones}>
            <TouchableOpacity
              style={[estilos.botonAccion, { width: isTablet ? 42 : isSmallPhone ? 32 : 38, height: isTablet ? 42 : isSmallPhone ? 32 : 38, borderRadius: isTablet ? 21 : isSmallPhone ? 16 : 19 }]}
              onPress={() => abrirFormulario(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.amarillo} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonAccion, estilos.botonEliminar, { width: isTablet ? 42 : isSmallPhone ? 32 : 38, height: isTablet ? 42 : isSmallPhone ? 32 : 38, borderRadius: isTablet ? 21 : isSmallPhone ? 16 : 19 }]}
              onPress={() => eliminarProducto(item.id, item.nombre)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.rojo} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[
        estilos.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
          📋 Gestión de Menú
        </Text>
        <TouchableOpacity
          style={[estilos.botonAgregar, { paddingHorizontal: isTablet ? 18 : isSmallPhone ? 12 : 16, paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10 }]}
          onPress={() => abrirFormulario()}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={isTablet ? 26 : isSmallPhone ? 18 : 22} color={COLORS.negro} />
        </TouchableOpacity>
      </View>

      <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal }]}>
        <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
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
            paddingBottom: insets.bottom + 150,
            paddingTop: isTablet ? 8 : 4,
          }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={estilos.vacioContenedor}>
            <Ionicons name="restaurant-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
            <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
              No hay productos
            </Text>
            <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
              Agrega tu primer producto presionando el botón +
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={COLORS.amarillo}
            colors={[COLORS.amarillo]}
          />
        }
      />

      {/* ✅ MODAL REDISEÑADO - CON ESTILO CONSISTENTE */}
      <Modal
        key={modalKey}
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <View style={estilos.modalFondo}>
          <LinearGradient
            colors={[COLORS.verde, COLORS.negro]}
            style={estilos.modalGradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={[
            estilos.modal,
            {
              padding: isTablet ? 32 : isSmallPhone ? 20 : 24,
              borderRadius: isTablet ? 28 : 24,
              width: isTablet ? '70%' : '92%',
              maxHeight: isTablet ? '80%' : '85%',
              borderColor: COLORS.amarillo + '30',
            }
          ]}>
            {/* ✅ Header del modal con gradiente */}
            <View style={estilos.modalHeader}>
              <LinearGradient
                colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                style={estilos.modalHeaderGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name={productoEditando ? 'create' : 'add-circle'}
                  size={isTablet ? 32 : isSmallPhone ? 24 : 28}
                  color={COLORS.negro}
                />
                <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                  {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
                </Text>
              </LinearGradient>
            </View>

            <ScrollView
              style={estilos.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {/* Nombre */}
              <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                <Ionicons name="restaurant-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Nombre *
              </Text>
              <TextInput
                key={`nombre-${modalKey}`}
                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Krusty Burger"
                placeholderTextColor={COLORS.grisClaro + '60'}
                selectionColor={COLORS.amarillo}
              />

              {/* Descripción */}
              <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                <Ionicons name="document-text-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Descripción
              </Text>
              <TextInput
                key={`descripcion-${modalKey}`}
                style={[estilos.input, estilos.textArea, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción del producto"
                placeholderTextColor={COLORS.grisClaro + '60'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={COLORS.amarillo}
              />

              {/* Precio */}
              <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                <Ionicons name="cash-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Precio *
              </Text>
              <TextInput
                key={`precio-${modalKey}`}
                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                value={precio}
                onChangeText={setPrecio}
                placeholder="Ej: 9500"
                placeholderTextColor={COLORS.grisClaro + '60'}
                keyboardType="numeric"
                selectionColor={COLORS.amarillo}
              />

              {/* Categoría */}
              <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                <Ionicons name="grid-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Categoría *
              </Text>
              <View style={[estilos.categoriasGrid, { gap: isTablet ? 10 : isSmallPhone ? 6 : 8 }]}>
                {categorias.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      estilos.categoriaOpcion,
                      {
                        paddingHorizontal: isTablet ? 18 : isSmallPhone ? 10 : 14,
                        paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                        borderRadius: isTablet ? 22 : isSmallPhone ? 14 : 18,
                        backgroundColor: categoria === cat ? COLORS.amarillo : COLORS.negro + '50',
                        borderColor: categoria === cat ? COLORS.amarillo : COLORS.blanco + '10',
                      }
                    ]}
                    onPress={() => setCategoria(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      estilos.categoriaOpcionTexto,
                      {
                        fontSize: isTablet ? 14 : isSmallPhone ? 10 : 12,
                        color: categoria === cat ? COLORS.negro : COLORS.grisClaro,
                        fontWeight: categoria === cat ? '700' : '500',
                      }
                    ]}>
                      {ETIQUETAS_CATEGORIA[cat] || cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Imagen */}
              <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                <Ionicons name="image-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Imagen
              </Text>
              <TouchableOpacity
                style={[estilos.botonImagen, { padding: isTablet ? 18 : isSmallPhone ? 12 : 16 }]}
                onPress={seleccionarImagen}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={COLORS.amarillo} />
                <Text style={[estilos.botonImagenTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                  {subiendoImagen ? '⏳ Subiendo...' : imagen ? '✅ Imagen seleccionada' : '📷 Seleccionar imagen'}
                </Text>
              </TouchableOpacity>

              {imagen ? (
                <View style={estilos.previaImagen}>
                  <Image
                    source={{ uri: imagen }}
                    style={[estilos.previaFoto, { height: isTablet ? 200 : isSmallPhone ? 140 : 180 }]}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[estilos.botonQuitarImagen, { width: isTablet ? 34 : isSmallPhone ? 24 : 30, height: isTablet ? 34 : isSmallPhone ? 24 : 30, borderRadius: isTablet ? 17 : isSmallPhone ? 12 : 15 }]}
                    onPress={() => setImagen('')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={isTablet ? 20 : isSmallPhone ? 14 : 18} color={COLORS.blanco} />
                  </TouchableOpacity>
                </View>
              ) : null}

              <TextInput
                key={`url-${modalKey}`}
                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, marginTop: 10 }]}
                value={imagen}
                onChangeText={setImagen}
                placeholder="🔗 O pega la URL manualmente"
                placeholderTextColor={COLORS.grisClaro + '60'}
                autoCapitalize="none"
                selectionColor={COLORS.amarillo}
              />
            </ScrollView>

            {/* ✅ Botones con gradiente consistente */}
            <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12, marginTop: 16 }]}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                onPress={cerrarModal}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.blanco} />
                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalGuardar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                onPress={guardarProducto}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                  style={estilos.modalGuardarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="save" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                  <Text style={[estilos.modalGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                    {productoEditando ? 'Actualizar' : 'Crear'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.negro,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // ✅ HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '10',
  },
  botonVolver: {
    padding: 4,
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  botonAgregar: {
    backgroundColor: COLORS.amarillo,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  contadorContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '5',
  },
  contador: {
    color: COLORS.grisClaro,
    fontWeight: '500',
    opacity: 0.7,
  },
  lista: {
    flexGrow: 1,
  },
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: COLORS.negro + '60',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
    alignItems: 'center',
  },
  imagen: {
    marginRight: 12,
  },
  imagenPlaceholder: {
    backgroundColor: COLORS.amarillo + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {},
  info: {
    flex: 1,
  },
  categoriaBadge: {
    backgroundColor: COLORS.amarillo + '20',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.amarillo + '15',
  },
  categoriaTexto: {
    color: COLORS.amarillo,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  nombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  descripcion: {
    color: COLORS.grisClaro,
    marginTop: 2,
    lineHeight: 16,
    opacity: 0.7,
  },
  precio: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
    marginTop: 4,
  },
  acciones: {
    gap: 8,
    marginLeft: 8,
  },
  botonAccion: {
    backgroundColor: COLORS.negro + '40',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  botonEliminar: {
    backgroundColor: COLORS.rojo + '15',
    borderColor: COLORS.rojo + '20',
  },
  vacioContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  vacio: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSubtexto: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  // ✅ MODAL REDISEÑADO - ESTILO CONSISTENTE
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  modal: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    overflow: 'hidden',
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
    fontWeight: 'bold',
    color: COLORS.negro,
  },
  modalScroll: {
    maxHeight: '70%',
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '600',
    color: COLORS.blanco,
    marginBottom: 6,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.negro + '40',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    color: COLORS.blanco,
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
    backgroundColor: COLORS.amarillo + '10',
    borderRadius: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.amarillo + '20',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  botonImagenTexto: {
    color: COLORS.blanco,
    fontWeight: '600',
  },
  previaImagen: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: COLORS.negro + '40',
  },
  previaFoto: {
    width: '100%',
    borderRadius: 12,
  },
  botonQuitarImagen: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.negro + '75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blanco + '15',
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
    backgroundColor: COLORS.negro + '50',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  modalCancelarTexto: {
    color: COLORS.blanco,
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
    color: COLORS.negro,
    fontWeight: 'bold',
  },
});