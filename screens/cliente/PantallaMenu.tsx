// screens/cliente/PantallaMenu.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Dimensions, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES (consistente con las demás pantallas)
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

const CATEGORIAS = ['Todas', 'burgers', 'combos', 'bebidas', 'postres', 'acompanantes'];

const etiquetasCategoria: Record<string, string> = {
  'burgers': '🍔 Hamburguesas',
  'combos': '🍟 Combos',
  'bebidas': '🥤 Bebidas',
  'postres': '🍦 Postres',
  'acompanantes': '🍿 Acompañantes',
};

export default function PantallaMenu(props: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [cargando, setCargando] = useState(true);
  const { agregarProducto } = tiendaCarrito();
  const insets = useSafeAreaInsets();

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    ]).start();
  }, []);

  const cargarProductos = async () => {
    setCargando(true);
    let consulta = supabase.from('productos').select('*');
    if (categoriaSeleccionada !== 'Todas') {
      consulta = consulta.eq('categoria', categoriaSeleccionada);
    }
    const { data } = await consulta;
    setProductos(data as Producto[] || []);
    setCargando(false);
  };

  // ✅ Responsive
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const tituloSize = isTablet ? 32 : isSmallPhone ? 22 : 26;
  const categoriaTextSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const categoriaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
  const productoPadding = isTablet ? 16 : isSmallPhone ? 10 : 12;
  const imagenSize = isTablet ? 120 : isSmallPhone ? 80 : 100;
  const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const precioSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const botonSize = isTablet ? 42 : isSmallPhone ? 32 : 36;

  const renderProducto = ({ item, index }: { item: Producto; index: number }) => {
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          style={[
            estilos.tarjetaProducto,
            {
              padding: productoPadding,
              minHeight: isTablet ? 140 : isSmallPhone ? 100 : 120,
            }
          ]}
          onPress={() => props.navigation.navigate('DetalleProducto', { producto: item })}
          activeOpacity={0.8}
        >
          <View style={[
            estilos.imagenContenedor,
            {
              width: imagenSize,
              height: imagenSize,
              borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
            }
          ]}>
            {item.imagen ? (
              <Image
                source={{ uri: item.imagen }}
                style={estilos.imagenProducto}
                resizeMode="cover"
              />
            ) : (
              <View style={[
                estilos.imagenPlaceholder,
                { backgroundColor: COLORS.amarillo + '20' }
              ]}>
                <Text style={[estilos.emojiProducto, { fontSize: isTablet ? 50 : isSmallPhone ? 30 : 40 }]}>
                  🍔
                </Text>
              </View>
            )}
          </View>

          <View style={estilos.infoProducto}>
            <Text style={[estilos.nombreProducto, { fontSize: nombreSize }]} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Text style={[estilos.descripcionProducto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]} numberOfLines={2}>
              {item.descripcion || 'Deliciosa hamburguesa Krusty'}
            </Text>
            <View style={estilos.filaPrecio}>
              <Text style={[estilos.precioProducto, { fontSize: precioSize }]}>
                ${typeof item.precio === 'number' ? item.precio.toFixed(2) : item.precio}
              </Text>
              <TouchableOpacity
                style={[
                  estilos.botonAgregar,
                  {
                    width: botonSize,
                    height: botonSize,
                    borderRadius: botonSize / 2,
                  }
                ]}
                onPress={() => agregarProducto(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                  style={estilos.botonAgregarGradient}
                >
                  <Ionicons name="add" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={COLORS.negro} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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

      {/* ✅ HEADER */}
      <View style={[
        estilos.encabezado,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={estilos.botonVolver}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
          🍔 Menú Krusty
        </Text>
        <View style={{ width: isTablet ? 28 : 24 }} />
      </View>

      {/* ✅ CATEGORÍAS */}
      <View style={estilos.contenedorCategorias}>
        <FlatList
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            estilos.listaCategorias,
            { paddingHorizontal: paddingHorizontal }
          ]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                estilos.categoria,
                {
                  paddingHorizontal: categoriaPadding,
                  paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10,
                  borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 20,
                  marginRight: isTablet ? 12 : isSmallPhone ? 8 : 10,
                  backgroundColor: categoriaSeleccionada === item ? COLORS.amarillo : COLORS.negro + '50',
                  borderColor: categoriaSeleccionada === item ? COLORS.amarillo : COLORS.blanco + '10',
                }
              ]}
              onPress={() => setCategoriaSeleccionada(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                estilos.categoriaTexto,
                {
                  fontSize: categoriaTextSize,
                  color: categoriaSeleccionada === item ? COLORS.negro : COLORS.grisClaro,
                  fontWeight: categoriaSeleccionada === item ? '700' : '500',
                }
              ]}>
                {item === 'Todas' ? '🌟 Todas' : etiquetasCategoria[item] || item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {/* ✅ PRODUCTOS */}
      {cargando ? (
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.amarillo} />
          <Text style={estilos.loadingTexto}>Cargando deliciosos productos...</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[
            estilos.listaProductos,
            {
              paddingHorizontal: paddingHorizontal,
              // ✅ ELIMINADO EL ESPACIO PARA CARRITO FLOTANTE
              paddingBottom: insets.bottom + 20, // Antes era + 100
              paddingTop: 8,
            }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={estilos.vacioContenedor}>
              <Text style={estilos.vacioEmoji}>📭</Text>
              <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : 16 }]}>
                No hay productos en esta categoría
              </Text>
              <Text style={[estilos.vacioSub, { fontSize: isTablet ? 14 : 12 }]}>
                Pronto tendremos más opciones para vos
              </Text>
            </View>
          }
        />
      )}
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
  encabezado: {
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
  },
  // ✅ CATEGORÍAS
  contenedorCategorias: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '10',
    paddingVertical: 12,
    backgroundColor: COLORS.negro + '30',
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
  // ✅ PRODUCTOS
  listaProductos: {
    flexGrow: 1,
  },
  tarjetaProducto: {
    flexDirection: 'row',
    backgroundColor: COLORS.negro + '60',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  imagenContenedor: {
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: COLORS.negro + '40',
  },
  imagenProducto: {
    width: '100%',
    height: '100%',
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiProducto: {
    // Tamaño dinámico
  },
  infoProducto: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nombreProducto: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 0.3,
  },
  descripcionProducto: {
    color: COLORS.grisClaro,
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.8,
    flex: 1,
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  precioProducto: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  botonAgregar: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  botonAgregarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTexto: {
    color: COLORS.grisClaro,
    fontSize: 14,
    fontWeight: '400',
  },
  // ✅ VACÍO
  vacioContenedor: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  vacioEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  vacio: {
    color: COLORS.blanco,
    fontWeight: '600',
    textAlign: 'center',
  },
  vacioSub: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
  },
});