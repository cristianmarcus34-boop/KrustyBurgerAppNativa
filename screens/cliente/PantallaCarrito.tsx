// screens/cliente/PantallaCarrito.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { Colores, getTematica } from '../../lib/colores';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

const { width, height } = Dimensions.get('window');

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  return {
    isTablet,
    isSmallPhone,
    width,
    height,
    padding: isTablet ? 32 : isSmallPhone ? 14 : 20,
    getValor: (valores: { tablet: any; normal: any; small: any }) => {
      if (isTablet) return valores.tablet;
      if (isSmallPhone) return valores.small;
      return valores.normal;
    },
  };
};

export default function PantallaCarrito(props: any) {
  // ✅ Hooks
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { elementos, aumentarCantidad, disminuirCantidad, quitarProducto, vaciarCarrito, calcularTotal } = tiendaCarrito();
  const {
    perfil,
    ubicacionSeleccionada: ubicacionStore,
    cargarUbicacionTemporal,
    guardarUbicacionTemporal,
    limpiarUbicacionTemporal
  } = tiendaAutenticacion();
  const temaKrusty = getTematica('krusty');

  // ✅ Estados
  const [cupones, setCupones] = useState<any[]>([]);
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [mostrarCupones, setMostrarCupones] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState(0);
  const [puntosMaximos, setPuntosMaximos] = useState(0);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);

  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState(0);
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [distanciaFormateada, setDistanciaFormateada] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [ubicacionGuardada, setUbicacionGuardada] = useState<UbicacionGuardada | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ✅ Cálculos
  const total = calcularTotal();
  const totalProductos = elementos.reduce((sum, item) => sum + item.cantidad, 0);
  const tieneProductos = elementos.length > 0;

  // ✅ Efectos
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

  useEffect(() => {
    cargarCupones();
    if (perfil) {
      cargarPuntosUsuario();
    }
  }, [perfil]);

  useEffect(() => {
    cargarUbicacionDesdeStore();
  }, []);

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

  // ============================================================
  // 🔄 FUNCIONES DE CARGA
  // ============================================================
  const cargarUbicacionDesdeStore = async () => {
    console.log('📍 [Carrito] Cargando ubicación desde store...');
    setCargandoUbicacion(true);

    try {
      const ubicacionCargada = await cargarUbicacionTemporal();

      if (ubicacionCargada) {
        console.log('📍 [Carrito] Ubicación cargada desde AsyncStorage:', ubicacionCargada);
        setUbicacionGuardada(ubicacionCargada);
        setCargandoUbicacion(false);
        return;
      }

      if (ubicacionStore) {
        console.log('📍 [Carrito] Usando ubicación del store:', ubicacionStore);
        setUbicacionGuardada(ubicacionStore);
        setCargandoUbicacion(false);
        return;
      }

      console.log('📍 [Carrito] No hay ubicación guardada, usando local por defecto');
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
      };
      setUbicacionGuardada(ubicacionDefault);
      await guardarUbicacionTemporal(ubicacionDefault);

    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
      };
      setUbicacionGuardada(ubicacionDefault);
    } finally {
      setCargandoUbicacion(false);
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
      console.error('Error calculando envío:', error);
      setEnvioDisponible(false);
      setMensajeEnvio('Error al calcular envío');
      setCostoEnvioEstimado(0);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  const cargarCupones = async () => {
    if (!perfil?.id) {
      setCupones([]);
      return;
    }
    const { data: canjesData } = await supabase
      .from('canjes')
      .select('id, recompensa_id, puntos_usados, fecha')
      .eq('usuario_id', perfil.id)
      .eq('usado_en_pedido', false);
    if (!canjesData || canjesData.length === 0) {
      setCupones([]);
      return;
    }
    const ids = canjesData.map((c: any) => c.recompensa_id);
    const { data: recompensasData } = await supabase.from('recompensas').select('*').in('id', ids);
    const cuponesCombinados = canjesData.map((canje: any) => ({
      ...canje,
      recompensas: recompensasData?.find((r: any) => r.id === canje.recompensa_id),
    }));
    setCupones(cuponesCombinados);
  };

  const cargarPuntosUsuario = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('puntos_acumulados')
        .eq('id', perfil.id)
        .single();
      if (error) throw error;
      setPuntosMaximos(data?.puntos_acumulados || 0);
    } catch (error) {
      console.error('Error cargando puntos:', error);
      setPuntosMaximos(0);
    }
  };

  // ============================================================
  // 🎯 MANEJADORES DE PUNTOS
  // ============================================================
  const canjearPuntos = async () => {
    if (puntosSeleccionados < 100) {
      Alert.alert('Mínimo 100 puntos', 'Necesitas al menos 100 puntos para canjear ($100 de descuento)');
      return;
    }

    if (puntosSeleccionados > puntosMaximos) {
      Alert.alert('Puntos insuficientes', `Tenés ${puntosMaximos} puntos disponibles`);
      return;
    }

    const descuentoEnPesos = Math.floor(puntosSeleccionados / 100) * 100;

    setCanjeandoPuntos(true);
    try {
      const { data: recompensa, error: recompensaError } = await supabase
        .from('recompensas')
        .select('id')
        .eq('nombre', 'Descuento por puntos')
        .single();

      if (recompensaError) throw recompensaError;

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          puntos_acumulados: puntosMaximos - puntosSeleccionados,
        })
        .eq('id', perfil!.id);

      if (updateError) throw updateError;

      const { error: canjeError } = await supabase
        .from('canjes')
        .insert({
          usuario_id: perfil!.id,
          recompensa_id: recompensa.id,
          puntos_usados: puntosSeleccionados,
          usado_en_pedido: false,
          created_at: new Date().toISOString(),
        });

      if (canjeError) throw canjeError;

      const cuponVirtual = {
        id: Date.now(),
        recompensas: {
          nombre: `${formatearPrecio(descuentoEnPesos)} de descuento`,
          descripcion: `Canjeado por ${puntosSeleccionados} puntos`,
          tipo: 'DESCUENTO_FIJO',
          valor_descuento: descuentoEnPesos,
        },
        puntos_usados: puntosSeleccionados,
      };

      setCuponAplicado(cuponVirtual);
      setPuntosMaximos(puntosMaximos - puntosSeleccionados);
      setMostrarModalPuntos(false);
      setPuntosSeleccionados(0);

      Alert.alert(
        '¡Éxito! 🎉',
        `Canjeaste ${puntosSeleccionados} puntos por ${formatearPrecio(descuentoEnPesos)} de descuento`,
        [{ text: '¡Genial!' }]
      );
    } catch (error) {
      console.error('Error canjeando puntos:', error);
      Alert.alert('Error', 'No se pudo canjear los puntos. Intentá de nuevo.');
    } finally {
      setCanjeandoPuntos(false);
    }
  };

  // ============================================================
  // 📊 CÁLCULOS DE PRECIOS
  // ============================================================
  const calcularDescuento = useCallback(() => {
    if (!cuponAplicado || !cuponAplicado.recompensas) return 0;
    const r = cuponAplicado.recompensas;

    if (r.tipo === 'DESCUENTO_FIJO') {
      return Math.min(r.valor_descuento || 0, total);
    }
    if (r.tipo === 'DESCUENTO') {
      return (total * r.valor_descuento) / 100;
    }
    if (r.tipo === 'ENVIO_GRATIS') return costoEnvioEstimado;
    return 0;
  }, [cuponAplicado, total, costoEnvioEstimado]);

  const costoEnvioFinal = cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
    ? 0
    : (envioDisponible ? costoEnvioEstimado : 0);

  const descuento = calcularDescuento();
  const totalFinal = total + costoEnvioFinal - descuento;

  // ============================================================
  // 🖼️ RENDER DE PRODUCTOS
  // ============================================================
  const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
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
            padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
            borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
          }
        ]}>
          {/* Imagen */}
          {item.producto.imagen ? (
            <Image
              source={{ uri: item.producto.imagen }}
              style={[
                estilos.imagen,
                {
                  width: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                  height: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                  borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              estilos.imagenPlaceholder,
              {
                width: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                height: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
              }
            ]}>
              <Text style={[estilos.emoji, { fontSize: responsive.getValor({ tablet: 32, normal: 28, small: 24 }) }]}>
                🍔
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={estilos.itemInfo}>
            <Text style={[
              estilos.itemNombre,
              { fontSize: responsive.getValor({ tablet: 16, normal: 15, small: 13 }) }
            ]} numberOfLines={1}>
              {item.producto.nombre}
            </Text>
            <Text style={[
              estilos.itemPrecioTotal,
              { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }) }
            ]}>
              {formatearPrecio(precioUnitario(item.producto.precio) * item.cantidad)}
            </Text>
          </View>

          {/* Controles */}
          <View style={estilos.controles}>
            <TouchableOpacity
              onPress={() => disminuirCantidad(item.producto.id)}
              style={[
                estilos.botonControl,
                {
                  width: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  height: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={Colores.textoOscuro} />
            </TouchableOpacity>

            <Text style={[
              estilos.cantidad,
              { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }
            ]}>
              {item.cantidad}
            </Text>

            <TouchableOpacity
              onPress={() => aumentarCantidad(item.producto.id)}
              style={[
                estilos.botonControl,
                {
                  width: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  height: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={Colores.textoOscuro} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quitarProducto(item.producto.id)}
              style={estilos.botonEliminar}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={Colores.secundario} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }, [responsive, fadeAnim, slideUpAnim, disminuirCantidad, aumentarCantidad, quitarProducto]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const padding = responsive.padding;

  if (elementos.length === 0) {
    return (
      <View style={estilos.contenedor}>
        <LinearGradient
          colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
          style={estilos.fondoGradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={estilos.vacio}>
          <Ionicons name="cart-outline" size={responsive.getValor({ tablet: 100, normal: 80, small: 60 })} color={Colores.textoClaro + '30'} />
          <Text style={[
            estilos.vacioTexto,
            { fontSize: responsive.getValor({ tablet: 24, normal: 20, small: 18 }) }
          ]}>
            Tu carrito está vacío
          </Text>
          <Text style={[
            estilos.vacioSubtexto,
            { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }
          ]}>
            Agrega productos del menú 🍔
          </Text>
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => props.navigation.goBack()}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[temaKrusty.secundario, temaKrusty.primario]}
              style={estilos.botonVolverGradient}
            >
              <Ionicons name="restaurant" size={responsive.getValor({ tablet: 24, normal: 20, small: 18 })} color={Colores.textoOscuro} />
              <Text style={[
                estilos.botonVolverTexto,
                { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }) }
              ]}>
                Ir al Menú
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        estilos.header,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={estilos.botonAtras}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 28, normal: 24, small: 20 })} color={Colores.textoClaro} />
        </TouchableOpacity>
        <Text style={[
          estilos.headerTitulo,
          { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }) }
        ]}>
          🛒 Carrito
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* ✅ LISTA DE PRODUCTOS CON ESPACIO PARA EL FOOTER */}
      <FlatList
        data={elementos}
        keyExtractor={item => item.producto.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          estilos.lista,
          {
            paddingHorizontal: padding,
            paddingTop: responsive.getValor({ tablet: 8, normal: 6, small: 4 }),
            // ✅ ESPACIO SUFICIENTE PARA EL FOOTER
            paddingBottom: responsive.getValor({ tablet: 240, normal: 220, small: 200 }),
          }
        ]}
        showsVerticalScrollIndicator={true}
        renderItem={renderItem}
        ListFooterComponent={
          // ✅ FOOTER COMO PARTE DEL FLATLIST (SCROLLABLE)
          <View style={[
            estilos.footerContainer,
            {
              marginTop: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              padding: responsive.getValor({ tablet: 20, normal: 16, small: 14 }),
              borderRadius: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
            }
          ]}>
            {/* FILA DE PUNTOS Y CUPONES */}
            <View style={estilos.filaAcciones}>
              {perfil && puntosMaximos > 0 && (
                <TouchableOpacity
                  style={estilos.botonPuntos}
                  onPress={() => setMostrarModalPuntos(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="star" size={16} color={temaKrusty.secundario} />
                  <Text style={estilos.botonPuntosTexto}>
                    {puntosMaximos} pts
                  </Text>
                </TouchableOpacity>
              )}

              {cupones.length > 0 && !cuponAplicado && (
                <TouchableOpacity
                  style={estilos.botonCupones}
                  onPress={() => setMostrarCupones(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pricetag" size={16} color={temaKrusty.secundario} />
                  <Text style={estilos.botonCuponesTexto}>
                    {cupones.length} cupones
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* RESUMEN */}
            <View style={estilos.resumenCompacto}>
              <View style={estilos.resumenFila}>
                <Text style={estilos.resumenLabel}>Productos ({totalProductos})</Text>
                <Text style={estilos.resumenValor}>{formatearPrecio(total)}</Text>
              </View>

              {!calculandoEnvio && (
                <View style={estilos.resumenFila}>
                  <Text style={estilos.resumenLabel}>
                    {cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? '🚚 Envío (gratis)' : '🚚 Envío'}
                  </Text>
                  <Text style={[
                    estilos.resumenValor,
                    cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' && { color: Colores.verdeClaro }
                  ]}>
                    {cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
                      ? 'GRATIS'
                      : (envioDisponible ? formatearPrecio(costoEnvioEstimado) : mensajeEnvio || '$0')
                    }
                  </Text>
                </View>
              )}

              {descuento > 0 && (
                <View style={estilos.resumenFila}>
                  <Text style={[estilos.resumenLabel, { color: Colores.verdeClaro }]}>🎯 Descuento</Text>
                  <Text style={[estilos.resumenValor, { color: Colores.verdeClaro }]}>-{formatearPrecio(descuento)}</Text>
                </View>
              )}

              {cuponAplicado && (
                <View style={estilos.cuponAplicadoCompacto}>
                  <Text style={estilos.cuponAplicadoTexto} numberOfLines={1}>
                    {cuponAplicado.recompensas?.nombre}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCuponAplicado(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color={Colores.secundario} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={[estilos.resumenFila, estilos.resumenTotal]}>
                <Text style={estilos.totalLabel}>Total</Text>
                <Text style={estilos.totalPrecio}>{formatearPrecio(totalFinal)}</Text>
              </View>
            </View>

            {/* BOTÓN CHECKOUT */}
            <TouchableOpacity
              style={estilos.botonCheckout}
              onPress={() => {
                if (!perfil || !perfil.id) {
                  setMostrarModalLogin(true);
                  return;
                }
                props.navigation.navigate('Checkout', {
                  cuponAplicado,
                  descuento,
                  costoEnvio: costoEnvioFinal,
                  totalFinal,
                  ubicacionGuardada,
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[temaKrusty.secundario, temaKrusty.primario]}
                style={estilos.botonCheckoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cart" size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })} color={Colores.textoOscuro} />
                <Text style={[
                  estilos.botonCheckoutTexto,
                  { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }
                ]}>
                  Ir al Checkout
                </Text>
                <View style={estilos.botonCheckoutPrecio}>
                  <Text style={[
                    estilos.botonCheckoutPrecioTexto,
                    { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }
                  ]}>
                    {formatearPrecio(totalFinal)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* VACIAR CARRITO */}
            <TouchableOpacity
              style={estilos.botonVaciar}
              onPress={vaciarCarrito}
              activeOpacity={0.6}
            >
              <Text style={[
                estilos.botonVaciarTexto,
                { fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }) }
              ]}>
                Vaciar carrito
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ============================================================ */}
      {/* 🔹 MODALES */}
      {/* ============================================================ */}

      {/* Modal de Login */}
      <Modal visible={mostrarModalLogin} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalIcono}>🔐</Text>
            <Text style={estilos.modalTitulo}>Inicia sesión</Text>
            <Text style={estilos.modalTexto}>
              Debes iniciar sesión para realizar pedidos
            </Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={() => {
                  setMostrarModalLogin(false);
                  props.navigation.navigate('Login');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in" size={18} color={Colores.textoOscuro} />
                <Text style={estilos.modalConfirmarTexto}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cupones */}
      <Modal visible={mostrarCupones} transparent animationType="slide">
        <View style={estilos.modalFondo}>
          <View style={estilos.modalCupones}>
            <Text style={estilos.modalCuponTitulo}>🎫 Tus Cupones</Text>
            {cupones.length === 0 ? (
              <Text style={estilos.vacioTexto}>No tenés cupones disponibles</Text>
            ) : (
              cupones.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={estilos.cuponItem}
                  onPress={() => {
                    setCuponAplicado(c);
                    setMostrarCupones(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={estilos.cuponIcono}>🎫</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.cuponNombre}>{c.recompensas?.nombre}</Text>
                    <Text style={estilos.cuponDesc}>{c.recompensas?.descripcion}</Text>
                  </View>
                  <Text style={estilos.cuponAplicar}>Usar →</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={estilos.botonCerrarCupones}
              onPress={() => setMostrarCupones(false)}
              activeOpacity={0.7}
            >
              <Text style={estilos.botonCerrarCuponesTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Canje de Puntos */}
      <Modal visible={mostrarModalPuntos} transparent animationType="slide">
        <View style={estilos.modalFondo}>
          <View style={estilos.modalPuntos}>
            <Text style={estilos.modalPuntosTitulo}>⭐ Canjear Puntos</Text>

            <Text style={estilos.modalPuntosInfo}>
              Tenés <Text style={{ fontWeight: 'bold', color: temaKrusty.secundario }}>{puntosMaximos}</Text> puntos disponibles
            </Text>

            <View style={estilos.modalPuntosRegla}>
              <Text style={estilos.modalPuntosReglaTexto}>
                💰 100 puntos = $100 de descuento
              </Text>
            </View>

            <View style={estilos.selectorPuntos}>
              <TouchableOpacity
                style={estilos.botonPuntosControl}
                onPress={() => setPuntosSeleccionados(Math.max(0, puntosSeleccionados - 100))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color={Colores.textoClaro} />
              </TouchableOpacity>

              <View style={estilos.puntosDisplay}>
                <Text style={estilos.puntosSeleccionados}>
                  {puntosSeleccionados}
                </Text>
                <Text style={estilos.puntosLabel}>puntos</Text>
              </View>

              <TouchableOpacity
                style={estilos.botonPuntosControl}
                onPress={() => setPuntosSeleccionados(Math.min(puntosMaximos, puntosSeleccionados + 100))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color={Colores.textoClaro} />
              </TouchableOpacity>
            </View>

            {puntosSeleccionados > 0 && (
              <View style={estilos.modalPuntosDescuentoContainer}>
                <Text style={estilos.modalPuntosDescuentoLabel}>Descuento a aplicar:</Text>
                <Text style={estilos.modalPuntosDescuento}>
                  {formatearPrecio(Math.floor(puntosSeleccionados / 100) * 100)}
                </Text>
              </View>
            )}

            <View style={estilos.modalPuntosBotones}>
              <TouchableOpacity
                style={[estilos.botonPuntosAccion, estilos.botonPuntosCancelar]}
                onPress={() => {
                  setMostrarModalPuntos(false);
                  setPuntosSeleccionados(0);
                }}
                activeOpacity={0.7}
              >
                <Text style={estilos.botonPuntosCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botonPuntosAccion, estilos.botonPuntosConfirmar]}
                onPress={canjearPuntos}
                disabled={canjeandoPuntos || puntosSeleccionados < 100}
                activeOpacity={0.7}
              >
                {canjeandoPuntos ? (
                  <ActivityIndicator size="small" color={Colores.textoOscuro} />
                ) : (
                  <Text style={estilos.botonPuntosConfirmarTexto}>
                    {puntosSeleccionados < 100 ? 'Mínimo 100 pts' : 'Canjear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - PROFESIONALES
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondoOscuro,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colores.textoClaro + '8',
    backgroundColor: Colores.fondoOscuro + '50',
  },
  botonAtras: {
    padding: 4,
  },
  headerTitulo: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
  },

  // ============================================================
  // VACÍO
  // ============================================================
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  vacioTexto: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSubtexto: {
    color: Colores.textoGris,
    marginTop: 8,
    textAlign: 'center',
  },
  botonVolver: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 12,
    elevation: 4,
    shadowColor: Colores.secundario,
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
    color: Colores.textoOscuro,
    fontWeight: 'bold',
  },

  // ============================================================
  // LISTA DE PRODUCTOS
  // ============================================================
  lista: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.fondoOscuro + '60',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '6',
  },
  imagen: {
    marginRight: 10,
  },
  imagenPlaceholder: {
    backgroundColor: Colores.secundario + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emoji: {},
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
    letterSpacing: 0.3,
  },
  itemPrecioTotal: {
    fontWeight: 'bold',
    color: '#F5C518',
    marginTop: 2,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  botonControl: {
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidad: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  botonEliminar: {
    padding: 4,
    marginLeft: 2,
  },

  // ============================================================
  // FOOTER - DENTRO DEL FLATLIST
  // ============================================================
  footerContainer: {
    backgroundColor: Colores.fondoOscuro + '85',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '8',
    marginBottom: 20,
  },
  filaAcciones: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  botonPuntos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colores.fondoOscuro + '40',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '8',
  },
  botonPuntosTexto: {
    fontSize: 12,
    color: Colores.textoClaro,
    fontWeight: '500',
  },
  botonCupones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colores.fondoOscuro + '40',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '8',
  },
  botonCuponesTexto: {
    fontSize: 12,
    color: Colores.textoClaro,
    fontWeight: '500',
  },

  // ============================================================
  // RESUMEN
  // ============================================================
  resumenCompacto: {
    backgroundColor: Colores.fondoOscuro + '30',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '5',
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  resumenLabel: {
    fontSize: 13,
    color: Colores.textoGris,
  },
  resumenValor: {
    fontSize: 13,
    color: Colores.textoClaro,
    fontWeight: '500',
  },
  resumenTotal: {
    borderTopWidth: 1,
    borderTopColor: Colores.textoClaro + '10',
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colores.textoClaro,
  },
  totalPrecio: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F5C518',
  },
  cuponAplicadoCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colores.verdeClaro + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colores.verdeClaro + '20',
  },
  cuponAplicadoTexto: {
    fontSize: 12,
    color: Colores.verdeClaro,
    fontWeight: '500',
    flex: 1,
  },

  // ============================================================
  // BOTÓN CHECKOUT
  // ============================================================
  botonCheckout: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#F5C518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 6,
  },
  botonCheckoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonCheckoutTexto: {
    color: Colores.textoOscuro,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  botonCheckoutPrecio: {
    backgroundColor: Colores.textoOscuro + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.textoOscuro + '10',
  },
  botonCheckoutPrecioTexto: {
    color: Colores.textoOscuro,
    fontWeight: '800',
  },
  botonVaciar: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  botonVaciarTexto: {
    color: Colores.secundario,
    fontWeight: '500',
    opacity: 0.5,
    fontSize: 12,
  },

  // ============================================================
  // MODALES
  // ============================================================
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colores.fondoOscuro,
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5C518' + '30',
  },
  modalIcono: {
    fontSize: 60,
    marginBottom: 12,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colores.textoClaro,
    marginBottom: 8,
  },
  modalTexto: {
    fontSize: 14,
    color: Colores.textoGris,
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
    backgroundColor: Colores.fondoOscuro + '60',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  modalCancelarTexto: {
    color: Colores.textoClaro,
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmar: {
    backgroundColor: '#F5C518',
  },
  modalConfirmarTexto: {
    color: Colores.textoOscuro,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ============================================================
  // MODAL CUPONES
  // ============================================================
  modalCupones: {
    backgroundColor: Colores.fondoOscuro,
    borderRadius: 24,
    width: '92%',
    maxWidth: 500,
    maxHeight: '75%',
    padding: 24,
    borderWidth: 2,
    borderColor: '#F5C518' + '20',
  },
  modalCuponTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colores.textoClaro,
    textAlign: 'center',
    marginBottom: 16,
  },
  cuponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.fondoOscuro + '40',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '8',
  },
  cuponIcono: {
    fontSize: 32,
  },
  cuponNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colores.textoClaro,
  },
  cuponDesc: {
    fontSize: 11,
    color: Colores.textoGris,
    marginTop: 2,
    opacity: 0.7,
  },
  cuponAplicar: {
    fontSize: 13,
    color: '#F5C518',
    fontWeight: '600',
  },
  botonCerrarCupones: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botonCerrarCuponesTexto: {
    color: Colores.textoOscuro,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // ============================================================
  // MODAL PUNTOS
  // ============================================================
  modalPuntos: {
    backgroundColor: Colores.fondoOscuro,
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderWidth: 2,
    borderColor: '#F5C518' + '20',
  },
  modalPuntosTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colores.textoClaro,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalPuntosInfo: {
    fontSize: 14,
    color: Colores.textoGris,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalPuntosRegla: {
    backgroundColor: '#F5C518' + '15',
    padding: 8,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F5C518' + '30',
  },
  modalPuntosReglaTexto: {
    fontSize: 14,
    color: '#F5C518',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectorPuntos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  botonPuntosControl: {
    backgroundColor: Colores.fondoOscuro + '40',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  puntosDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  puntosSeleccionados: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colores.textoClaro,
    textAlign: 'center',
  },
  puntosLabel: {
    fontSize: 12,
    color: Colores.textoGris,
    marginTop: 2,
  },
  modalPuntosDescuentoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalPuntosDescuentoLabel: {
    fontSize: 14,
    color: Colores.textoClaro,
  },
  modalPuntosDescuento: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5C518',
  },
  modalPuntosBotones: {
    flexDirection: 'row',
    gap: 12,
  },
  botonPuntosAccion: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonPuntosCancelar: {
    backgroundColor: Colores.fondoOscuro + '40',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  botonPuntosCancelarTexto: {
    color: Colores.textoClaro,
    fontWeight: '600',
    fontSize: 14,
  },
  botonPuntosConfirmar: {
    backgroundColor: '#F5C518',
  },
  botonPuntosConfirmarTexto: {
    color: Colores.textoOscuro,
    fontWeight: 'bold',
    fontSize: 14,
  },
});