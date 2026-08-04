// screens/cliente/PantallaDetalleProducto.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Alert, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { servicioEnvios } from '../../lib/servicioEnvios';

// ============================================================
// 🎨 PALETA DE COLORES
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

const etiquetasCategoria: Record<string, string> = {
  'burgers': '🍔 Hamburguesa',
  'combos': '🍟 Combo',
  'bebidas': '🥤 Bebida',
  'postres': '🍦 Postre',
  'acompanantes': '🍿 Acompañante',
};

export default function PantallaDetalleProducto(props: any) {
  const producto: Producto = props.route?.params?.producto;
  const { agregarProducto } = tiendaCarrito();
  const {
    ubicacionSeleccionada: ubicacionStore,
    cargarUbicacionTemporal
  } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();

  // ✅ ESTADOS PARA ESTIMADO DE ENVÍO
  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState<number | null>(null);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [ubicacionGuardada, setUbicacionGuardada] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // ✅ CARGAR UBICACIÓN AL MONTAR
  useEffect(() => {
    cargarUbicacion();
  }, []);

  // ✅ CALCULAR ENVÍO CUANDO HAY UBICACIÓN
  useEffect(() => {
    if (ubicacionGuardada) {
      calcularEnvioEstimado();
    }
  }, [ubicacionGuardada]);

  const cargarUbicacion = async () => {
    try {
      const ubicacionCargada = await cargarUbicacionTemporal();
      if (ubicacionCargada) {
        setUbicacionGuardada({
          latitude: ubicacionCargada.latitude,
          longitude: ubicacionCargada.longitude,
        });
        return;
      }
      if (ubicacionStore) {
        setUbicacionGuardada({
          latitude: ubicacionStore.latitude,
          longitude: ubicacionStore.longitude,
        });
        return;
      }
      // Fallback a coordenadas del local
      setUbicacionGuardada({
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
      });
    } catch (error) {
      console.log('Error cargando ubicación:', error);
    }
  };

  const calcularEnvioEstimado = async () => {
    if (!ubicacionGuardada) return;
    setCalculandoEnvio(true);
    try {
      const resultado = await servicioEnvios.calcularCostoEnvio(
        ubicacionGuardada.latitude,
        ubicacionGuardada.longitude
      );
      if (resultado.esValido && resultado.dentroCobertura) {
        setCostoEnvioEstimado(resultado.costo);
        setEnvioDisponible(true);
      } else {
        setEnvioDisponible(false);
        setCostoEnvioEstimado(null);
      }
    } catch (error) {
      console.log('Error calculando envío:', error);
      setEnvioDisponible(false);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!producto) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.errorTexto}>Producto no encontrado</Text>
      </View>
    );
  }

  const manejarAgregar = () => {
    agregarProducto(producto);
    Alert.alert(
      '¡Agregado! 🎉',
      `${producto.nombre} se agregó al carrito`,
      [
        {
          text: 'Seguir viendo',
          onPress: () => props.navigation.goBack(),
          style: 'cancel',
        },
        {
          text: 'Ver carrito',
          onPress: () => props.navigation.navigate('Carrito'),
        },
      ]
    );
  };

  const precio = typeof producto.precio === 'number' ? producto.precio : Number(producto.precio);
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const imagenHeight = isTablet ? 400 : isSmallPhone ? 220 : 300;
  const nombreSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const precioSize = isTablet ? 38 : isSmallPhone ? 28 : 32;
  const descripcionSize = isTablet ? 17 : isSmallPhone ? 14 : 15;
  const seccionTituloSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;

  const botonPaddingVertical = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const botonPaddingHorizontal = isTablet ? 20 : isSmallPhone ? 14 : 16;
  const botonTextSize = isTablet ? 17 : isSmallPhone ? 13 : 15;
  const botonIconSize = isTablet ? 22 : isSmallPhone ? 18 : 20;
  const precioBotonSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const botonBorderRadius = isTablet ? 14 : isSmallPhone ? 10 : 12;

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={estilos.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={[estilos.imagenContenedor, { height: imagenHeight }]}>
          {producto.imagen ? (
            <Image
              source={{ uri: producto.imagen }}
              style={estilos.imagen}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              estilos.imagenPlaceholder,
              { backgroundColor: COLORS.amarillo + '20' }
            ]}>
              <Text style={[estilos.emojiGrande, { fontSize: isTablet ? 120 : 80 }]}>🍔</Text>
            </View>
          )}

          <View style={[
            estilos.categoriaBadgeImagen,
            {
              bottom: 16,
              right: isTablet ? 24 : 16,
              paddingHorizontal: isTablet ? 16 : 12,
              paddingVertical: isTablet ? 8 : 6,
              borderRadius: isTablet ? 16 : 12,
            }
          ]}>
            <Text style={[estilos.categoriaTextoImagen, { fontSize: isTablet ? 14 : 12 }]}>
              {etiquetasCategoria[producto.categoria] || producto.categoria}
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            estilos.info,
            {
              paddingHorizontal: paddingHorizontal,
              paddingTop: isTablet ? 24 : 20,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }
          ]}
        >
          <View style={estilos.encabezado}>
            <Text style={[estilos.nombre, { fontSize: nombreSize }]}>
              {producto.nombre}
            </Text>
            <Text style={[estilos.precio, { fontSize: precioSize }]}>
              ${precio.toFixed(2)}
            </Text>
          </View>

          {/* ✅ ESTIMADO DE ENVÍO */}
          {!calculandoEnvio && (
            <View style={estilos.envioEstimadoContainer}>
              {costoEnvioEstimado !== null && envioDisponible ? (
                <Text style={[estilos.envioEstimadoTexto, { fontSize: isTablet ? 14 : 12 }]}>
                  🚚 Envío estimado: <Text style={estilos.envioEstimadoValor}>${costoEnvioEstimado.toFixed(2)}</Text>
                </Text>
              ) : (
                <Text style={[estilos.envioEstimadoTexto, { fontSize: isTablet ? 14 : 12, color: COLORS.grisClaro }]}>
                  📍 Selecciona una ubicación para ver el costo de envío
                </Text>
              )}
            </View>
          )}

          {calculandoEnvio && (
            <View style={estilos.envioEstimadoContainer}>
              <ActivityIndicator size="small" color={COLORS.amarillo} />
              <Text style={[estilos.envioEstimadoTexto, { fontSize: isTablet ? 14 : 12, marginLeft: 8 }]}>
                Calculando envío...
              </Text>
            </View>
          )}

          <View style={estilos.seccion}>
            <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
              📝 Descripción
            </Text>
            <Text style={[estilos.descripcion, { fontSize: descripcionSize }]}>
              {producto.descripcion || 'Deliciosa hamburguesa Krusty preparada con ingredientes frescos y la salsa secreta de la casa que la hace única.'}
            </Text>
          </View>

          <View style={estilos.seccion}>
            <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
              📊 Información Nutricional
            </Text>
            <View style={[
              estilos.nutricional,
              {
                gap: isTablet ? 16 : isSmallPhone ? 8 : 12,
                marginTop: isTablet ? 12 : 8,
              }
            ]}>
              <View style={[
                estilos.nutriItem,
                {
                  padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  width: isTablet ? '24%' : isSmallPhone ? '22%' : '23%',
                }
              ]}>
                <Text style={[estilos.nutriValor, { fontSize: isTablet ? 28 : isSmallPhone ? 18 : 22 }]}>🔥</Text>
                <Text style={[estilos.nutriTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>850 Cal</Text>
              </View>
              <View style={[
                estilos.nutriItem,
                {
                  padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  width: isTablet ? '24%' : isSmallPhone ? '22%' : '23%',
                }
              ]}>
                <Text style={[estilos.nutriValor, { fontSize: isTablet ? 28 : isSmallPhone ? 18 : 22 }]}>🍗</Text>
                <Text style={[estilos.nutriTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>35g Prot</Text>
              </View>
              <View style={[
                estilos.nutriItem,
                {
                  padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  width: isTablet ? '24%' : isSmallPhone ? '22%' : '23%',
                }
              ]}>
                <Text style={[estilos.nutriValor, { fontSize: isTablet ? 28 : isSmallPhone ? 18 : 22 }]}>🧈</Text>
                <Text style={[estilos.nutriTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>42g Grasas</Text>
              </View>
              <View style={[
                estilos.nutriItem,
                {
                  padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  width: isTablet ? '24%' : isSmallPhone ? '22%' : '23%',
                }
              ]}>
                <Text style={[estilos.nutriValor, { fontSize: isTablet ? 28 : isSmallPhone ? 18 : 22 }]}>🍞</Text>
                <Text style={[estilos.nutriTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>55g Carb</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          estilos.footer,
          {
            paddingHorizontal: paddingHorizontal,
            paddingBottom: insets.bottom + (isTablet ? 20 : 14),
            paddingTop: isTablet ? 12 : 10,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            estilos.botonAgregar,
            {
              borderRadius: botonBorderRadius,
            }
          ]}
          onPress={manejarAgregar}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
            style={[
              estilos.botonAgregarGradient,
              {
                paddingVertical: botonPaddingVertical,
                paddingHorizontal: botonPaddingHorizontal,
                borderRadius: botonBorderRadius,
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="cart" size={botonIconSize} color={COLORS.negro} />
            <Text style={[estilos.botonAgregarTexto, { fontSize: botonTextSize }]}>
              Agregar al carrito
            </Text>
            <View style={[
              estilos.precioBoton,
              {
                paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                paddingVertical: isTablet ? 3 : isSmallPhone ? 2 : 3,
                borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
              }
            ]}>
              <Text style={[estilos.precioBotonTexto, { fontSize: precioBotonSize }]}>
                ${precio.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
  scroll: {
    flex: 1,
  },
  errorTexto: {
    color: COLORS.blanco,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  imagenContenedor: {
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.negro + '40',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiGrande: {
    // Tamaño dinámico
  },
  categoriaBadgeImagen: {
    position: 'absolute',
    backgroundColor: COLORS.negro + '75',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    zIndex: 10,
  },
  categoriaTextoImagen: {
    color: COLORS.blanco,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  encabezado: {
    marginBottom: 16,
  },
  nombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  precio: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  seccion: {
    marginTop: 20,
  },
  seccionTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  descripcion: {
    color: COLORS.grisClaro,
    lineHeight: 24,
    opacity: 0.9,
  },
  nutricional: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutriItem: {
    alignItems: 'center',
    backgroundColor: COLORS.negro + '40',
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  nutriValor: {
    // Tamaño dinámico
  },
  nutriTexto: {
    color: COLORS.grisClaro,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  // ✅ NUEVO: Estilo para envío estimado
  envioEstimadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negro + '30',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  envioEstimadoTexto: {
    color: COLORS.grisClaro,
    fontWeight: '500',
  },
  envioEstimadoValor: {
    color: COLORS.verdeClaro,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.negro + '80',
    borderTopWidth: 1,
    borderTopColor: COLORS.blanco + '8',
  },
  botonAgregar: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  botonAgregarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonAgregarTexto: {
    color: COLORS.negro,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  precioBoton: {
    backgroundColor: COLORS.negro + '20',
  },
  precioBotonTexto: {
    color: COLORS.negro,
    fontWeight: '700',
  },
});