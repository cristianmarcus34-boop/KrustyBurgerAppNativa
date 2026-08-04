// screens/cliente/PantallaCarrito.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Modal, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
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

export default function PantallaCarrito(props: any) {
  const { elementos, aumentarCantidad, disminuirCantidad, quitarProducto, vaciarCarrito, calcularTotal } = tiendaCarrito();
  const {
    perfil,
    ubicacionSeleccionada: ubicacionStore,
    cargarUbicacionTemporal
  } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();

  const total = calcularTotal();

  const [cupones, setCupones] = useState<any[]>([]);
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [mostrarCupones, setMostrarCupones] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);

  // ✅ ESTADOS PARA ENVÍO DINÁMICO
  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState(0);
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [distanciaFormateada, setDistanciaFormateada] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [ubicacionGuardada, setUbicacionGuardada] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => { cargarCupones(); }, [perfil, cuponAplicado]);

  // ✅ CARGAR UBICACIÓN DESDE EL STORE AL MONTAR
  useEffect(() => {
    cargarUbicacionDesdeStore();
  }, []);

  // ✅ CALCULAR ENVÍO CUANDO HAY UBICACIÓN Y PRODUCTOS
  useEffect(() => {
    if (ubicacionGuardada && elementos.length > 0) {
      calcularEnvioEstimado();
    } else {
      setCostoEnvioEstimado(0);
      setDistanciaEstimada(null);
      setDistanciaFormateada('');
      setEnvioDisponible(true);
      setMensajeEnvio('');
    }
  }, [ubicacionGuardada, elementos.length]);

  // ✅ Función para cargar ubicación desde el store
  const cargarUbicacionDesdeStore = async () => {
    console.log('📍 [Carrito] Cargando ubicación desde store...');
    setCargandoUbicacion(true);

    try {
      // Intentar cargar desde AsyncStorage al store
      const ubicacionCargada = await cargarUbicacionTemporal();

      if (ubicacionCargada) {
        console.log('📍 [Carrito] Ubicación cargada desde AsyncStorage:', ubicacionCargada);
        setUbicacionGuardada({
          latitude: ubicacionCargada.latitude,
          longitude: ubicacionCargada.longitude,
        });
        setCargandoUbicacion(false);
        return;
      }

      // Si no hay ubicación en AsyncStorage, verificar el store
      if (ubicacionStore) {
        console.log('📍 [Carrito] Usando ubicación del store:', ubicacionStore);
        setUbicacionGuardada({
          latitude: ubicacionStore.latitude,
          longitude: ubicacionStore.longitude,
        });
        setCargandoUbicacion(false);
        return;
      }

      // Si no hay ubicación guardada, usar coordenadas por defecto del local
      console.log('📍 [Carrito] No hay ubicación guardada, usando local por defecto');
      setUbicacionGuardada({
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
      });

    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
      // Fallback a coordenadas del local
      setUbicacionGuardada({
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
      });
    } finally {
      setCargandoUbicacion(false);
    }
  };

  // ✅ Función para calcular envío estimado
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
        setDistanciaEstimada(resultado.distancia);
        setDistanciaFormateada(resultado.distanciaFormateada);
        setEnvioDisponible(true);
        setMensajeEnvio('');
      } else {
        setEnvioDisponible(false);
        setMensajeEnvio(resultado.mensaje || 'No disponible');
        setCostoEnvioEstimado(0);
        setDistanciaEstimada(null);
      }
    } catch (error) {
      console.error('Error calculando envío estimado:', error);
      setEnvioDisponible(false);
      setMensajeEnvio('Error al calcular envío');
      setCostoEnvioEstimado(0);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  // ✅ Calcular descuento y total final
  const calcularDescuento = () => {
    if (!cuponAplicado || !cuponAplicado.recompensas) return 0;
    const r = cuponAplicado.recompensas;
    if (r.tipo === 'DESCUENTO') return (total * r.valor_descuento) / 100;
    if (r.tipo === 'ENVIO_GRATIS') return costoEnvioEstimado;
    return r.valor_descuento || 0;
  };

  const costoEnvioFinal = cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
    ? 0
    : (envioDisponible ? costoEnvioEstimado : 0);

  const descuento = calcularDescuento();
  const totalFinal = total + costoEnvioFinal - descuento;

  const cargarCupones = async () => {
    if (!perfil?.id) return;
    const { data: canjesData } = await supabase
      .from('canjes')
      .select('id, recompensa_id, puntos_usados, fecha')
      .eq('usuario_id', perfil.id)
      .eq('usado_en_pedido', false);
    if (!canjesData || canjesData.length === 0) { setCupones([]); return; }
    const ids = canjesData.map((c: any) => c.recompensa_id);
    const { data: recompensasData } = await supabase.from('recompensas').select('*').in('id', ids);
    const cuponesCombinados = canjesData.map((canje: any) => ({
      ...canje, recompensas: recompensasData?.find((r: any) => r.id === canje.recompensa_id),
    }));
    setCupones(cuponesCombinados);
  };

  const aplicarCupon = (cupon: any) => { setCuponAplicado(cupon); setMostrarCupones(false); };

  const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

  // ✅ Responsive
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const imagenSize = isTablet ? 90 : isSmallPhone ? 60 : 70;
  const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 15;
  const botonControlSize = isTablet ? 36 : isSmallPhone ? 28 : 32;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: slideUpAnim }],
        }}
      >
        <View style={[
          estilos.item,
          {
            padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
            borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
          }
        ]}>
          {item.producto.imagen ? (
            <Image
              source={{ uri: item.producto.imagen }}
              style={[estilos.imagen, { width: imagenSize, height: imagenSize, borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[estilos.imagenPlaceholder, { width: imagenSize, height: imagenSize, borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>
              <Text style={[estilos.emoji, { fontSize: isTablet ? 36 : isSmallPhone ? 24 : 30 }]}>🍔</Text>
            </View>
          )}
          <View style={estilos.itemInfo}>
            <Text style={[estilos.itemNombre, { fontSize: nombreSize }]} numberOfLines={1}>
              {item.producto.nombre}
            </Text>
            <Text style={[estilos.itemDescripcion, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]} numberOfLines={1}>
              {item.producto.descripcion || ''}
            </Text>
            <Text style={[estilos.itemPrecioUnitario, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
              ${precioUnitario(item.producto.precio).toFixed(2)} c/u
            </Text>
            <Text style={[estilos.itemPrecioTotal, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
              ${(precioUnitario(item.producto.precio) * item.cantidad).toFixed(2)}
            </Text>
          </View>
          <View style={estilos.controles}>
            <TouchableOpacity
              onPress={() => disminuirCantidad(item.producto.id)}
              style={[estilos.botonControl, { width: botonControlSize, height: botonControlSize, borderRadius: botonControlSize / 2 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={isTablet ? 20 : isSmallPhone ? 14 : 18} color={COLORS.blanco} />
            </TouchableOpacity>
            <Text style={[estilos.cantidad, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
              {item.cantidad}
            </Text>
            <TouchableOpacity
              onPress={() => aumentarCantidad(item.producto.id)}
              style={[estilos.botonControl, { width: botonControlSize, height: botonControlSize, borderRadius: botonControlSize / 2 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={isTablet ? 20 : isSmallPhone ? 14 : 18} color={COLORS.blanco} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => quitarProducto(item.producto.id)}
              style={estilos.botonEliminar}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={isTablet ? 20 : isSmallPhone ? 16 : 18} color={COLORS.rojo} />
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

      {elementos.length === 0 ? (
        <View style={estilos.vacio}>
          <Ionicons name="cart-outline" size={isTablet ? 100 : 80} color={COLORS.grisClaro + '40'} />
          <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 24 : isSmallPhone ? 18 : 20 }]}>
            Tu carrito está vacío
          </Text>
          <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
            Agrega productos del menú 🍔
          </Text>
          <TouchableOpacity
            style={[estilos.botonVolver, { paddingHorizontal: isTablet ? 32 : isSmallPhone ? 20 : 24, paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 12 }]}
            onPress={() => props.navigation.goBack()}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
              style={estilos.botonVolverGradient}
            >
              <Ionicons name="restaurant" size={isTablet ? 24 : 20} color={COLORS.negro} />
              <Text style={[estilos.botonVolverTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                Ir al Menú
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ✅ INDICADOR DE CARGA DE UBICACIÓN */}
          {cargandoUbicacion && (
            <View style={estilos.cargandoUbicacion}>
              <ActivityIndicator size="small" color={COLORS.amarillo} />
              <Text style={estilos.cargandoUbicacionTexto}>Cargando ubicación...</Text>
            </View>
          )}

          <FlatList
            data={elementos}
            keyExtractor={item => item.producto.id?.toString() || Math.random().toString()}
            contentContainerStyle={[
              estilos.lista,
              {
                paddingHorizontal: paddingHorizontal,
                paddingTop: isTablet ? 12 : 8,
                paddingBottom: isTablet ? 12 : 8,
              }
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
          />

          {/* ✅ FOOTER */}
          <Animated.View style={[
            estilos.footer,
            {
              paddingHorizontal: paddingHorizontal,
              paddingBottom: insets.bottom + (isTablet ? 24 : 16),
              paddingTop: isTablet ? 16 : 12,
              opacity: fadeAnim,
            }
          ]}>
            {/* Cupones */}
            {cupones.length > 0 && !cuponAplicado && (
              <TouchableOpacity
                style={[estilos.botonCupones, { padding: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}
                onPress={() => setMostrarCupones(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pricetag" size={isTablet ? 22 : isSmallPhone ? 18 : 20} color={COLORS.amarillo} />
                <Text style={[estilos.botonCuponesTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                  Tenés {cupones.length} cupón(es) disponible(s)
                </Text>
                <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={COLORS.grisClaro} />
              </TouchableOpacity>
            )}

            {cuponAplicado && (
              <View style={[estilos.cuponAplicado, { padding: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>
                <Ionicons name="checkmark-circle" size={isTablet ? 22 : 20} color={COLORS.verdeClaro} />
                <Text style={[estilos.cuponAplicadoTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13 }]}>
                  Cupón: {cuponAplicado.recompensas?.nombre}
                </Text>
                <TouchableOpacity
                  onPress={() => setCuponAplicado(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={isTablet ? 22 : 20} color={COLORS.rojo} />
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ INFORMACIÓN DE ENVÍO ESTIMADO */}
            {elementos.length > 0 && !cargandoUbicacion && (
              <View style={estilos.resumenEnvio}>
                {calculandoEnvio ? (
                  <View style={estilos.resumenFila}>
                    <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                      Calculando envío...
                    </Text>
                    <ActivityIndicator size="small" color={COLORS.amarillo} />
                  </View>
                ) : (
                  <>
                    {distanciaEstimada !== null && (
                      <View style={estilos.resumenFila}>
                        <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                          📏 Distancia estimada
                        </Text>
                        <Text style={[estilos.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                          {distanciaFormateada}
                        </Text>
                      </View>
                    )}

                    <View style={estilos.resumenFila}>
                      <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                        {cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? '🚚 Envío (gratis)' : '🚚 Costo de envío'}
                      </Text>
                      <Text style={[
                        estilos.resumenValor,
                        {
                          fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                          color: cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? COLORS.verdeClaro : COLORS.blanco,
                        }
                      ]}>
                        {cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
                          ? 'GRATIS'
                          : (envioDisponible ? `$${costoEnvioEstimado.toFixed(2)}` : mensajeEnvio)
                        }
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Resumen */}
            <View style={estilos.resumen}>
              <View style={estilos.resumenFila}>
                <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>Subtotal</Text>
                <Text style={[estilos.resumenValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>${total.toFixed(2)}</Text>
              </View>
              {descuento > 0 && (
                <View style={estilos.resumenFila}>
                  <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: COLORS.verdeClaro }]}>
                    Descuento
                  </Text>
                  <Text style={[estilos.resumenValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: COLORS.verdeClaro }]}>
                    -${descuento.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={[estilos.resumenFila, estilos.resumenTotal]}>
                <Text style={[estilos.totalTexto, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>Total</Text>
                <Text style={[estilos.totalPrecio, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 24 }]}>
                  ${totalFinal.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* ✅ BOTÓN CHECKOUT */}
            <TouchableOpacity
              style={[
                estilos.botonCheckout,
                {
                  paddingVertical: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  borderRadius: isTablet ? 50 : isSmallPhone ? 30 : 40,
                }
              ]}
              onPress={() => {
                if (!perfil || !perfil.id) {
                  setMostrarModalLogin(true);
                  return;
                }
                props.navigation.navigate('Checkout', { cuponAplicado, descuento });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                style={[
                  estilos.botonCheckoutGradient,
                  {
                    paddingHorizontal: isTablet ? 24 : isSmallPhone ? 16 : 20,
                    borderRadius: isTablet ? 50 : isSmallPhone ? 30 : 40,
                  }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={estilos.botonCheckoutIcon}>
                  <Ionicons name="cart" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                </View>
                <Text style={[estilos.botonCheckoutTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                  Ir al Checkout
                </Text>
                <View style={estilos.botonCheckoutPrecio}>
                  <Text style={[estilos.botonCheckoutPrecioTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                    ${totalFinal.toFixed(2)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonVaciar}
              onPress={vaciarCarrito}
              activeOpacity={0.6}
            >
              <Text style={[estilos.botonVaciarTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                Vaciar carrito
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* ✅ MODAL LOGIN */}
      <Modal visible={mostrarModalLogin} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={[estilos.modal, { padding: isTablet ? 40 : isSmallPhone ? 24 : 30 }]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>🔐</Text>
            <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              Inicia sesión
            </Text>
            <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              Debes iniciar sesión o crear una cuenta para realizar pedidos
            </Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={() => {
                  setMostrarModalLogin(false);
                  props.navigation.navigate('Login');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in" size={isTablet ? 20 : 18} color={COLORS.blanco} />
                <Text style={[estilos.modalConfirmarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => {
                setMostrarModalLogin(false);
                props.navigation.navigate('Registro');
              }}
              activeOpacity={0.6}
            >
              <Text style={[estilos.modalRegistro, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                Crear una cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL CUPONES */}
      <Modal visible={mostrarCupones} transparent animationType="slide">
        <View style={estilos.modalFondo}>
          <View style={[estilos.modalCupones, { padding: isTablet ? 32 : isSmallPhone ? 20 : 24 }]}>
            <Text style={[estilos.modalCuponTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              🎫 Tus Cupones
            </Text>
            {cupones.length === 0 ? (
              <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                No tenés cupones disponibles
              </Text>
            ) : (
              cupones.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={[estilos.cuponItem, { padding: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}
                  onPress={() => aplicarCupon(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[estilos.cuponIcono, { fontSize: isTablet ? 36 : isSmallPhone ? 28 : 32 }]}>🎫</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.cuponNombre, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                      {c.recompensas?.nombre}
                    </Text>
                    <Text style={[estilos.cuponDesc, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                      {c.recompensas?.descripcion}
                    </Text>
                  </View>
                  <Text style={[estilos.cuponAplicar, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13 }]}>
                    Usar →
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[estilos.botonCerrarCupones, { padding: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}
              onPress={() => setMostrarCupones(false)}
              activeOpacity={0.7}
            >
              <Text style={[estilos.botonCerrarCuponesTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 15 : 16 }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
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
  // ✅ VACÍO
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  vacioTexto: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSubtexto: {
    color: COLORS.grisClaro,
    marginTop: 8,
    textAlign: 'center',
  },
  botonVolver: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 12,
    elevation: 4,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  botonVolverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  botonVolverTexto: {
    color: COLORS.negro,
    fontWeight: 'bold',
  },
  // ✅ LISTA
  lista: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negro + '60',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  imagen: {
    marginRight: 12,
  },
  imagenPlaceholder: {
    backgroundColor: COLORS.amarillo + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    // Tamaño dinámico
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 0.3,
  },
  itemDescripcion: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.7,
  },
  itemPrecioUnitario: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.6,
  },
  itemPrecioTotal: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
    marginTop: 4,
  },
  controles: {
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  botonControl: {
    backgroundColor: COLORS.amarillo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidad: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  botonEliminar: {
    padding: 4,
    marginTop: 2,
  },
  // ✅ FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.blanco + '10',
    backgroundColor: COLORS.negro + '80',
  },
  botonCupones: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amarillo + '15',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.amarillo + '20',
  },
  botonCuponesTexto: {
    color: COLORS.amarillo,
    fontWeight: '600',
    flex: 1,
  },
  cuponAplicado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verdeClaro + '15',
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.verdeClaro + '20',
  },
  cuponAplicadoTexto: {
    flex: 1,
    color: COLORS.verdeClaro,
    fontWeight: '600',
  },
  // ✅ RESUMEN ENVÍO
  resumenEnvio: {
    backgroundColor: COLORS.negro + '30',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  resumen: {
    marginBottom: 16,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resumenTexto: {
    color: COLORS.grisClaro,
  },
  resumenValor: {
    color: COLORS.blanco,
    fontWeight: '600',
  },
  resumenTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.blanco + '15',
    paddingTop: 10,
    marginTop: 4,
  },
  totalTexto: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  totalPrecio: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  // ✅ BOTÓN CHECKOUT
  botonCheckout: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    marginBottom: 8,
  },
  botonCheckoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  botonCheckoutIcon: {
    backgroundColor: COLORS.negro + '20',
    padding: 4,
    borderRadius: 20,
  },
  botonCheckoutTexto: {
    color: COLORS.negro,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  botonCheckoutPrecio: {
    backgroundColor: COLORS.negro + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.negro + '10',
  },
  botonCheckoutPrecioTexto: {
    color: COLORS.negro,
    fontWeight: '800',
  },
  botonVaciar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  botonVaciarTexto: {
    color: COLORS.rojo,
    fontWeight: '500',
    opacity: 0.7,
  },
  // ✅ MODALES
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.grisOscuro,
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.amarillo + '30',
  },
  modalIcono: {
    marginBottom: 12,
  },
  modalTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 8,
  },
  modalTexto: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalCancelar: {
    backgroundColor: COLORS.negro + '60',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  modalCancelarTexto: {
    color: COLORS.blanco,
    fontWeight: '600',
  },
  modalConfirmar: {
    backgroundColor: COLORS.amarillo,
  },
  modalConfirmarTexto: {
    color: COLORS.negro,
    fontWeight: 'bold',
  },
  modalRegistro: {
    color: COLORS.amarillo,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalCupones: {
    backgroundColor: COLORS.grisOscuro,
    borderRadius: 24,
    width: '92%',
    maxWidth: 500,
    maxHeight: '75%',
    borderWidth: 2,
    borderColor: COLORS.amarillo + '20',
  },
  modalCuponTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    textAlign: 'center',
    marginBottom: 16,
  },
  cuponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negro + '40',
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  cuponIcono: {
    // Tamaño dinámico
  },
  cuponNombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  cuponDesc: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.7,
  },
  cuponAplicar: {
    color: COLORS.amarillo,
    fontWeight: '600',
  },
  botonCerrarCupones: {
    backgroundColor: COLORS.amarillo,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  botonCerrarCuponesTexto: {
    color: COLORS.negro,
    fontWeight: 'bold',
  },
  // ✅ NUEVOS ESTILOS
  cargandoUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.negro + '30',
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blanco + '5',
    gap: 10,
  },
  cargandoUbicacionTexto: {
    color: COLORS.grisClaro,
    fontSize: 13,
    fontWeight: '500',
  },
});