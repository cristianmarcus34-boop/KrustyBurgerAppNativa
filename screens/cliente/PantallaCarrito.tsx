// screens/cliente/PantallaCarrito.tsx - CON DESCUENTO POR NIVEL Y AHORRO TOTAL
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { cuponService } from '../../lib/cupones/cuponService';
import { useBeneficios } from '../../hooks/useBeneficios';
import { calcularResumenPedido } from '../../services/servicioPreciosPedido';

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
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

export default function PantallaCarrito(props: any) {
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

  const {
    nivel,
    beneficios,
    calcularDescuento,
    tieneEnvioGratis,
  } = useBeneficios(perfil?.puntos_acumulados || 0, perfil?.id);

  // ✅ Estados
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState(0);
  const [puntosMaximos, setPuntosMaximos] = useState(0);
  const [puntosOriginales, setPuntosOriginales] = useState(0);
  const [puntosOriginalesAntesCanje, setPuntosOriginalesAntesCanje] = useState(0);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);
  const [cuponPuntosAplicado, setCuponPuntosAplicado] = useState<any>(null);
  const [cuponAplicado, setCuponAplicado] = useState<any>(
    () => props.route?.params?.cuponAplicado || null
  );
  const intentoRecuperarCupon = useRef(false);
  const [inputPuntos, setInputPuntos] = useState('');

  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState(0);
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [distanciaFormateada, setDistanciaFormateada] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [ubicacionGuardada, setUbicacionGuardada] = useState<UbicacionGuardada | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  const total = calcularTotal();
  const totalProductos = elementos.reduce((sum, item) => sum + item.cantidad, 0);
  const tieneProductos = elementos.length > 0;

  // ✅ Porcentaje de descuento del nivel actual
  const porcentajeDescuentoNivel = useMemo(() => {
    if (!beneficios) return 0;
    return beneficios.descuento || 0;
  }, [beneficios]);

  // ✅ Efectos
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (perfil) cargarPuntosUsuario();
  }, [perfil]);

  useEffect(() => {
    const cuponRecibido = props.route?.params?.cuponAplicado;
    if (cuponRecibido) {
      setCuponAplicado(cuponRecibido);
    }
  }, [props.route?.params?.cuponAplicado]);

  useEffect(() => {
    if (!perfil?.id || cuponAplicado || intentoRecuperarCupon.current) return;
    intentoRecuperarCupon.current = true;

    const recuperarCuponDisponible = async () => {
      const cuponesDisponibles = await cuponService.obtenerCuponesDisponibles(perfil.id);
      const cuponReservado = cuponesDisponibles[0]?.cupon;
      if (cuponReservado) setCuponAplicado(cuponReservado);
    };

    recuperarCuponDisponible();
  }, [perfil?.id, cuponAplicado]);

  useEffect(() => { cargarUbicacionDesdeStore(); }, []);

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

  useFocusEffect(
    useCallback(() => {
      const recargarUbicacion = async () => {
        if (perfil) {
          const partesDireccion = [];
          if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
          if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
          if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
          if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
          if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
          if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
          if (perfil.direccion_codigo_postal) partesDireccion.push(`CP ${perfil.direccion_codigo_postal}`);

          const direccionCompleta = partesDireccion.length > 0 ? partesDireccion.join(', ') : '';

          if (direccionCompleta) {
            const ubicacionPerfil: UbicacionGuardada = {
              latitude: perfil.lat_cliente || -34.776484410467525,
              longitude: perfil.lng_cliente || -58.29220250409459,
              direccion: direccionCompleta,
              seleccionadaPorUsuario: false,
            };
            setUbicacionGuardada(ubicacionPerfil);
            await guardarUbicacionTemporal(ubicacionPerfil);
            setCargandoUbicacion(false);
            return;
          }
        }

        const ubicacionCargada = await cargarUbicacionTemporal();
        if (ubicacionCargada) {
          setUbicacionGuardada(ubicacionCargada);
          setCargandoUbicacion(false);
          return;
        }

        const ubicacionDefault: UbicacionGuardada = {
          latitude: -34.776484410467525,
          longitude: -58.29220250409459,
          direccion: 'Local Krusty Burger',
          seleccionadaPorUsuario: false,
        };
        setUbicacionGuardada(ubicacionDefault);
        await guardarUbicacionTemporal(ubicacionDefault);
        setCargandoUbicacion(false);
      };

      recargarUbicacion();
    }, [perfil])
  );

  // ============================================================
  // 🔄 FUNCIONES DE CARGA
  // ============================================================
  const cargarUbicacionDesdeStore = async () => {
    setCargandoUbicacion(true);
    try {
      const ubicacionCargada = await cargarUbicacionTemporal();
      if (ubicacionCargada) {
        setUbicacionGuardada(ubicacionCargada);
        setCargandoUbicacion(false);
        return;
      }
      if (ubicacionStore) {
        setUbicacionGuardada(ubicacionStore);
        setCargandoUbicacion(false);
        return;
      }
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
        seleccionadaPorUsuario: false,
      };
      setUbicacionGuardada(ubicacionDefault);
      await guardarUbicacionTemporal(ubicacionDefault);
    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
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

  const cargarPuntosUsuario = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('puntos_acumulados')
        .eq('id', perfil.id)
        .single();
      if (error) throw error;
      const puntos = data?.puntos_acumulados || 0;
      setPuntosMaximos(puntos);
      setPuntosOriginales(puntos);
      setPuntosOriginalesAntesCanje(0);
      setInputPuntos('');
    } catch (error) {
      console.error('Error cargando puntos:', error);
      setPuntosMaximos(0);
      setPuntosOriginales(0);
    }
  };

  // ============================================================
  // 🎯 MANEJADORES DE PUNTOS
  // ============================================================
  const restaurarPuntos = async () => {
    if (!perfil?.id) return;
    const puntosARestaurar = cuponPuntosAplicado?.puntos_antes_canje || puntosOriginalesAntesCanje || puntosOriginales;
    if (puntosARestaurar === 0) return;

    try {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ puntos_acumulados: puntosARestaurar })
        .eq('id', perfil.id);

      if (updateError) { console.error('❌ Error restaurando puntos:', updateError); return; }

      setPuntosMaximos(puntosARestaurar);
      setPuntosOriginales(puntosARestaurar);
      setPuntosOriginalesAntesCanje(0);
      setCuponPuntosAplicado(null);
      setPuntosSeleccionados(0);
      setInputPuntos('');
      await cargarPuntosUsuario();
    } catch (error) {
      console.error('❌ Error restaurando puntos:', error);
    }
  };

  const quitarDescuento = () => { restaurarPuntos(); };

  const handleInputPuntos = (text: string) => {
    const num = parseInt(text) || 0;
    if (num < 0) return;
    setInputPuntos(text);
    setPuntosSeleccionados(num);
  };

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
    const puntosAntesCanje = puntosMaximos;

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
        .update({ puntos_acumulados: puntosMaximos - puntosSeleccionados })
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

      setPuntosOriginalesAntesCanje(puntosAntesCanje);
      setPuntosMaximos(puntosMaximos - puntosSeleccionados);
      setPuntosOriginales(puntosOriginales - puntosSeleccionados);

      const cuponVirtual = {
        id: Date.now(),
        recompensas: {
          nombre: `${formatearPrecio(descuentoEnPesos)} de descuento`,
          descripcion: `Canjeado por ${puntosSeleccionados} puntos`,
          tipo: 'DESCUENTO_FIJO',
          valor_descuento: descuentoEnPesos,
        },
        puntos_usados: puntosSeleccionados,
        puntos_antes_canje: puntosAntesCanje,
      };

      setCuponPuntosAplicado(cuponVirtual);
      setMostrarModalPuntos(false);
      setPuntosSeleccionados(0);
      setInputPuntos('');

      Alert.alert(
        '🎉 ¡Éxito!',
        `Canjeaste ${puntosSeleccionados} puntos por ${formatearPrecio(descuentoEnPesos)} de descuento`,
        [{ text: '¡Genial!' }]
      );

      await cargarPuntosUsuario();
    } catch (error) {
      console.error('Error canjeando puntos:', error);
      Alert.alert('❌ Error', 'No se pudo canjear los puntos. Intentá de nuevo.');
    } finally {
      setCanjeandoPuntos(false);
    }
  };

  const cancelarCanje = () => {
    setPuntosSeleccionados(0);
    setInputPuntos('');
    setMostrarModalPuntos(false);
  };

  // ============================================================
  // 📊 CÁLCULOS
  // ============================================================
  const descuentoNivel = beneficios ? calcularDescuento(total) : 0;
  const envioGratisNivel = beneficios ? tieneEnvioGratis(total) : false;

  const resumenPedido = calcularResumenPedido({
    subtotal: total,
    cuponAplicado,
    cuponPuntosAplicado,
    descuentoNivel,
    costoEnvio: envioDisponible ? costoEnvioEstimado : 0,
    tipoEntrega: 'domicilio',
    envioGratisNivel,
  });

  const descuentoPuntos = resumenPedido.descuentoPuntos;
  const descuentoCupon = resumenPedido.descuentoCupon;
  const descuento = resumenPedido.descuentoTotal;
  const cuponEsEnvioGratis = resumenPedido.envioGratisPorCupon;
  const cuponEsDescuento = String(cuponAplicado?.tipo || '').toLowerCase() === 'descuento';
  const envioGratisPorPuntos = resumenPedido.envioGratisPorPuntos;
  const envioGratisPorCupon = resumenPedido.envioGratisPorCupon;
  const costoEnvioFinal = resumenPedido.costoEnvioFinal;
  const totalFinal = resumenPedido.totalFinal;

  // ✅ Cálculo del ahorro total (descuentos + envío gratis)
  const ahorroPorEnvio = (envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel)
    ? costoEnvioEstimado
    : 0;
  const ahorroTotal = descuento + ahorroPorEnvio;
  const mostrarAhorro = ahorroTotal > 0;

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 17 });

  // ============================================================
  // 🖼️ RENDER DE PRODUCTOS
  // ============================================================
  const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const itemFade = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
      <Animated.View style={{ opacity: itemFade, transform: [{ translateY: slideUpAnim }] }}>
        <View style={[
          styles.item,
          {
            padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
            borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            backgroundColor: DISENO.colors.surface,
            borderColor: DISENO.colors.border,
            ...DISENO.shadow.sm,
          }
        ]}>
          {item.producto.imagen ? (
            <Image
              source={{ uri: item.producto.imagen }}
              style={[
                styles.imagen,
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
              styles.imagenPlaceholder,
              {
                width: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                height: responsive.getValor({ tablet: 80, normal: 70, small: 60 }),
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                backgroundColor: DISENO.colors.surfaceHover,
              }
            ]}>
              <Text style={[styles.emoji, { fontSize: responsive.getValor({ tablet: 32, normal: 28, small: 24 }) }]}>
                🍔
              </Text>
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={[
              styles.itemNombre,
              { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }), color: DISENO.colors.text }
            ]} numberOfLines={1}>
              {item.producto.nombre}
            </Text>
            <Text style={[
              styles.itemPrecioTotal,
              { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 13 }), color: DISENO.colors.accent }
            ]}>
              {formatearPrecio(precioUnitario(item.producto.precio) * item.cantidad)}
            </Text>
          </View>

          <View style={styles.controles}>
            <TouchableOpacity
              onPress={() => disminuirCantidad(item.producto.id)}
              style={[
                styles.botonControl,
                {
                  width: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  height: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  backgroundColor: DISENO.colors.accentSecondary,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DISENO.colors.text} />
            </TouchableOpacity>

            <Text style={[
              styles.cantidad,
              { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 12 }), color: DISENO.colors.text }
            ]}>
              {item.cantidad}
            </Text>

            <TouchableOpacity
              onPress={() => aumentarCantidad(item.producto.id)}
              style={[
                styles.botonControl,
                {
                  width: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  height: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  backgroundColor: DISENO.colors.accentSecondary,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DISENO.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => quitarProducto(item.producto.id)} style={styles.botonEliminar} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DISENO.colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }, [responsive, fadeAnim, slideUpAnim, disminuirCantidad, aumentarCantidad, quitarProducto]);

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================

  if (elementos.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={responsive.getValor({ tablet: 100, normal: 80, small: 60 })} color={DISENO.colors.textTertiary} />
          <Text style={[
            styles.emptyText,
            { fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }), color: DISENO.colors.text }
          ]}>
            Tu carrito está vacío
          </Text>
          <Text style={[
            styles.emptySubtext,
            { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }), color: DISENO.colors.textSecondary }
          ]}>
            Agrega productos del menú 🍔
          </Text>
          {cuponAplicado && (
            <View style={styles.cuponVacioCard}>
              <Ionicons name="ticket-outline" size={22} color={DISENO.colors.accent} />
              <View style={styles.cuponVacioContenido}>
                <Text style={styles.cuponVacioTitulo}>
                  Cupón listo para usar: {cuponAplicado.codigo || 'Cupón aplicado'}
                </Text>
                <Text style={styles.cuponVacioDetalle}>
                  {cuponAplicado.titulo || 'Agregá productos y se aplicará al confirmar tu pedido.'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => props.navigation.navigate('Principal', { screen: 'Menu' })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="restaurant" size={responsive.getValor({ tablet: 22, normal: 20, small: 18 })} color={DISENO.colors.text} />
              <Text style={[
                styles.emptyButtonText,
                { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 13 }), color: DISENO.colors.text }
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
    <View style={styles.container}>
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
        }
      ]}>
        <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 26, normal: 22, small: 20 })} color={DISENO.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: tituloSize, color: DISENO.colors.text }]}>
          🛒 Carrito
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* ✅ LISTA DE PRODUCTOS */}
      <FlatList
        data={elementos}
        keyExtractor={item => item.producto.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: padding,
            paddingTop: responsive.getValor({ tablet: 8, normal: 6, small: 4 }),
            paddingBottom: responsive.getValor({ tablet: 260, normal: 240, small: 220 }),
          }
        ]}
        showsVerticalScrollIndicator={true}
        renderItem={renderItem}
        ListFooterComponent={
          <View style={[
            styles.footerContainer,
            {
              marginTop: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              padding: responsive.getValor({ tablet: 20, normal: 16, small: 14 }),
              borderRadius: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
              backgroundColor: DISENO.colors.surface,
              borderColor: DISENO.colors.border,
              ...DISENO.shadow.md,
            }
          ]}>
            {/* ✅ BOTÓN DE PUNTOS */}
            <TouchableOpacity
              style={[
                styles.puntosButton,
                {
                  backgroundColor: DISENO.colors.accentSecondary + '10',
                  borderColor: DISENO.colors.accentSecondary + '40',
                  borderWidth: 1.5,
                  paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                  paddingHorizontal: responsive.getValor({ tablet: 20, normal: 16, small: 16 }),
                  borderRadius: 14,
                  marginBottom: 10,
                  ...DISENO.shadow.sm,
                }
              ]}
              onPress={() => {
                if (cuponPuntosAplicado) {
                  setPuntosMaximos(puntosOriginalesAntesCanje || puntosOriginales);
                }
                setPuntosSeleccionados(0);
                setInputPuntos('');
                setMostrarModalPuntos(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.puntosButtonContent}>
                <View style={styles.puntosButtonLeft}>
                  <Text style={[styles.actionButtonText, {
                    color: DISENO.colors.text,
                    fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                  }]}>
                    ⭐ {puntosMaximos} pts
                  </Text>
                </View>
                <View style={styles.puntosButtonRight}>
                  <Text style={[styles.puntosButtonLabel, {
                    color: DISENO.colors.accent,
                    fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 9 }),
                    backgroundColor: DISENO.colors.accent + '10',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }]}>
                    Canjear X descuento
                  </Text>
                  <Ionicons name="chevron-forward" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DISENO.colors.accent} />
                </View>
              </View>
            </TouchableOpacity>

            {/* ✅ BADGE DE NIVEL DEL USUARIO */}
            {nivel && (
              <View style={[
                styles.nivelBadge,
                {
                  backgroundColor: (nivel.color || DISENO.colors.accentSecondary) + '12',
                  borderColor: (nivel.color || DISENO.colors.accentSecondary) + '40',
                  padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: 12,
                }
              ]}>
                <Text style={[styles.nivelBadgeEmoji, { fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }) }]}>
                  {nivel.icono || '🏆'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.nivelBadgeTitulo,
                    {
                      color: nivel.color || DISENO.colors.accentSecondary,
                      fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                    }
                  ]}>
                    Nivel {nivel.nombre || 'Sin nivel'}
                  </Text>
                  {porcentajeDescuentoNivel > 0 ? (
                    <Text style={[
                      styles.nivelBadgeDetalle,
                      {
                        color: DISENO.colors.textSecondary,
                        fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 9 }),
                      }
                    ]}>
                      Tenés {porcentajeDescuentoNivel}% de descuento en todos tus pedidos
                    </Text>
                  ) : (
                    <Text style={[
                      styles.nivelBadgeDetalle,
                      {
                        color: DISENO.colors.textSecondary,
                        fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 9 }),
                      }
                    ]}>
                      Sumá puntos para desbloquear descuentos 🎯
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* RESUMEN */}
            <View style={[styles.summary, { backgroundColor: DISENO.colors.surfaceHover, borderColor: DISENO.colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: DISENO.colors.textSecondary }]}>Productos ({totalProductos})</Text>
                <Text style={[styles.summaryValue, { color: DISENO.colors.text }]}>{formatearPrecio(total)}</Text>
              </View>

              {!calculandoEnvio && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DISENO.colors.textSecondary }]}>
                    {envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel
                      ? '🚚 Envío '
                      : '🚚 Envío'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[
                      styles.summaryValue,
                      (envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel) && { color: DISENO.colors.success }
                    ]}>
                      {envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel
                        ? 'GRATIS'
                        : (envioDisponible ? formatearPrecio(costoEnvioEstimado) : mensajeEnvio || '$0')
                      }
                    </Text>
                  </View>
                </View>
              )}

              {/* ✅ DESCUENTO POR NIVEL */}
              {descuentoNivel > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DISENO.colors.success }]}>
                    🏆 Descuento {nivel?.nombre || ''}
                  </Text>
                  <Text style={[styles.summaryValue, { color: DISENO.colors.success }]}>
                    -{formatearPrecio(descuentoNivel)}
                  </Text>
                </View>
              )}

              {descuentoPuntos > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DISENO.colors.success }]}>
                    🎯 Descuento por puntos
                  </Text>
                  <Text style={[styles.summaryValue, { color: DISENO.colors.success }]}>
                    -{formatearPrecio(descuentoPuntos)}
                  </Text>
                </View>
              )}

              {descuentoCupon > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DISENO.colors.success }]}>
                    🎟️ Descuento cupón
                  </Text>
                  <Text style={[styles.summaryValue, { color: DISENO.colors.success }]}>
                    -{formatearPrecio(descuentoCupon)}
                  </Text>
                </View>
              )}

              {cuponPuntosAplicado && (
                <View style={[styles.cuponAplicado, { backgroundColor: DISENO.colors.success + '15', borderColor: DISENO.colors.success + '20' }]}>
                  <Text style={[styles.cuponAplicadoText, { color: DISENO.colors.success }]} numberOfLines={1}>
                    {cuponPuntosAplicado.recompensas?.nombre}
                  </Text>
                  <TouchableOpacity onPress={quitarDescuento} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color={DISENO.colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {cuponAplicado && (
                <View style={[styles.cuponAplicado, { backgroundColor: DISENO.colors.success + '15', borderColor: DISENO.colors.success + '20' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cuponAplicadoText, { color: DISENO.colors.success }]} numberOfLines={1}>
                      🎟️ {cuponAplicado.codigo || 'Cupón aplicado'}
                    </Text>
                    <Text style={[styles.cuponAplicadoSubtext, { color: DISENO.colors.textSecondary }]} numberOfLines={1}>
                      {cuponAplicado.titulo || 'Cupón disponible'}
                      {cuponEsEnvioGratis ? ' · Envío gratis' : ''}
                      {cuponEsDescuento && cuponAplicado.es_porcentaje
                        ? ` · ${cuponAplicado.valor_descuento}% de descuento`
                        : ''}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => { setCuponAplicado(null); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color={DISENO.colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ✅ AHORRO TOTAL */}
              {mostrarAhorro && (
                <View style={[
                  styles.ahorroContainer,
                  {
                    backgroundColor: DISENO.colors.success + '12',
                    borderColor: DISENO.colors.success + '30',
                    paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 7 }),
                    paddingHorizontal: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                    borderRadius: 10,
                    marginTop: 8,
                    marginBottom: 6,
                  }
                ]}>
                  <Text style={[
                    styles.ahorroEmoji,
                    { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 13 }) }
                  ]}>
                    🎉
                  </Text>
                  <Text style={[
                    styles.ahorroTexto,
                    {
                      fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                      color: DISENO.colors.success,
                    }
                  ]}>
                    ¡Ahorrás {formatearPrecio(ahorroTotal)}!
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.totalLabel, { color: DISENO.colors.text }]}>Total</Text>
                <Text style={[styles.totalPrice, { color: DISENO.colors.accent }]}>{formatearPrecio(totalFinal)}</Text>
              </View>
            </View>

            {/* BOTÓN CHECKOUT */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => {
                if (!perfil || !perfil.id) {
                  setMostrarModalLogin(true);
                  return;
                }
                props.navigation.navigate('Checkout', {
                  cuponPuntosAplicado,
                  cuponAplicado,
                  ubicacionGuardada,
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                style={styles.checkoutButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cart" size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })} color={DISENO.colors.text} />
                <Text style={[
                  styles.checkoutButtonText,
                  { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 12 }), color: DISENO.colors.text }
                ]}>
                  Finalizar compra
                </Text>
                <View style={[styles.checkoutPrice, { backgroundColor: DISENO.colors.text + '15' }]}>
                  <Text style={[
                    styles.checkoutPriceText,
                    { fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 10 }), color: DISENO.colors.text }
                  ]}>
                    {formatearPrecio(totalFinal)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* VACIAR CARRITO */}
            <TouchableOpacity style={styles.emptyCartButton} onPress={vaciarCarrito} activeOpacity={0.6}>
              <Text style={[
                styles.emptyCartText,
                { fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }), color: DISENO.colors.textTertiary }
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border, borderWidth: 1, ...DISENO.shadow.lg }]}>
            <Text style={[styles.modalIcon, { fontSize: 60 }]}>🔐</Text>
            <Text style={[styles.modalTitle, { fontSize: 18, color: DISENO.colors.text }]}>Inicia sesión</Text>
            <Text style={[styles.modalText, { color: DISENO.colors.textSecondary }]}>
              Debes iniciar sesión para realizar pedidos
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { backgroundColor: DISENO.colors.surfaceHover, borderColor: DISENO.colors.border }]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: DISENO.colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: DISENO.colors.accentSecondary }]}
                onPress={() => { setMostrarModalLogin(false); props.navigation.navigate('Login'); }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in" size={18} color={DISENO.colors.text} />
                <Text style={[styles.modalConfirmText, { color: DISENO.colors.text }]}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL DE PUNTOS */}
      <Modal visible={mostrarModalPuntos} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalPuntos,
            {
              backgroundColor: DISENO.colors.surface,
              borderColor: DISENO.colors.border,
              borderRadius: 24,
              width: responsive.getValor({ tablet: '60%', normal: '92%', small: '95%' }),
              maxWidth: 450,
              padding: responsive.getValor({ tablet: 28, normal: 20, small: 16 }),
              borderWidth: 1,
              alignSelf: 'center',
              ...DISENO.shadow.lg,
            }
          ]}>
            <View style={styles.modalPuntosHeader}>
              <Text style={[styles.modalPuntosTitle, {
                fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }),
                color: DISENO.colors.text,
                textAlign: 'center',
              }]}>
                ⭐ Canjear Puntos
              </Text>
              <Text style={[styles.modalPuntosSubtitle, {
                fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                color: DISENO.colors.textSecondary,
                textAlign: 'center',
                marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              }]}>
                Ingresá cuántos puntos querés canjear
              </Text>
            </View>

            <View style={[styles.modalPuntosInfoContainer, {
              backgroundColor: DISENO.colors.accentSecondary + '08',
              borderRadius: 12,
              padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
              marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              borderWidth: 1,
              borderColor: DISENO.colors.accentSecondary + '20',
            }]}>
              <View>
                <Text style={[styles.modalPuntosInfoLabel, {
                  fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }),
                  color: DISENO.colors.textSecondary,
                  fontWeight: '500',
                }]}>
                  Puntos disponibles
                </Text>
                <Text style={[styles.modalPuntosInfoValue, {
                  fontSize: responsive.getValor({ tablet: 22, normal: 18, small: 16 }),
                  color: DISENO.colors.accentSecondary,
                }]}>
                  {puntosMaximos} pts
                </Text>
              </View>
            </View>

            <View style={[styles.inputContainer, { marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }) }]}>
              <Text style={[styles.inputLabel, {
                fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                color: DISENO.colors.textSecondary,
                marginBottom: 6,
              }]}>
                Cantidad de puntos
              </Text>
              <View style={[styles.inputWrapper, {
                borderColor: DISENO.colors.border,
                backgroundColor: DISENO.colors.surfaceHover,
                borderRadius: 10,
                borderWidth: 1,
              }]}>
                <TouchableOpacity
                  style={[styles.inputButton, {
                    paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                    paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                    backgroundColor: DISENO.colors.surface,
                    borderRightWidth: 1,
                    borderRightColor: DISENO.colors.border,
                  }]}
                  onPress={() => {
                    const nuevo = Math.max(0, puntosSeleccionados - 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={responsive.getValor({ tablet: 22, normal: 20, small: 18 })} color={DISENO.colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.inputField, {
                    fontSize: responsive.getValor({ tablet: 20, normal: 18, small: 16 }),
                    color: DISENO.colors.text,
                    paddingHorizontal: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                    paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                    flex: 1,
                    textAlign: 'center',
                    minWidth: 60,
                  }]}
                  value={inputPuntos}
                  onChangeText={handleInputPuntos}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  selectionColor={DISENO.colors.accent}
                />

                <TouchableOpacity
                  style={[styles.inputButton, {
                    paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                    paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                    backgroundColor: DISENO.colors.surface,
                    borderLeftWidth: 1,
                    borderLeftColor: DISENO.colors.border,
                  }]}
                  onPress={() => {
                    const nuevo = Math.min(puntosMaximos, puntosSeleccionados + 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={responsive.getValor({ tablet: 22, normal: 20, small: 18 })} color={DISENO.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {puntosSeleccionados > 0 && (
              <View style={[styles.modalPuntosDescuentoContainer, {
                backgroundColor: DISENO.colors.accentSecondary + '08',
                borderRadius: 12,
                padding: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                borderWidth: 1,
                borderColor: DISENO.colors.accentSecondary + '20',
              }]}>
                <Text style={[styles.modalPuntosDescuentoLabel, {
                  fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                  color: DISENO.colors.text,
                  fontWeight: '500',
                }]}>
                  💰 Descuento:
                </Text>
                <Text style={[styles.modalPuntosDescuento, {
                  fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }),
                  color: DISENO.colors.accent,
                }]}>
                  {formatearPrecio(Math.floor(puntosSeleccionados / 100) * 100)}
                </Text>
              </View>
            )}

            <View style={[styles.modalPuntosBotones, { flexDirection: 'row', gap: 12 }]}>
              <TouchableOpacity
                style={[styles.puntosAction, {
                  flex: 1,
                  paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: DISENO.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor: DISENO.colors.border,
                }]}
                onPress={cancelarCanje}
                activeOpacity={0.7}
              >
                <Text style={[styles.puntosCancelText, {
                  color: DISENO.colors.textSecondary,
                  fontWeight: '600',
                  fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.puntosAction, {
                  flex: 1,
                  paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: puntosSeleccionados >= 100 ? DISENO.colors.accentSecondary : DISENO.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor: puntosSeleccionados >= 100 ? DISENO.colors.accentSecondary : DISENO.colors.border,
                }]}
                onPress={canjearPuntos}
                disabled={canjeandoPuntos || puntosSeleccionados < 100}
                activeOpacity={0.7}
              >
                {canjeandoPuntos ? (
                  <ActivityIndicator size="small" color={DISENO.colors.text} />
                ) : (
                  <Text style={[styles.puntosConfirmText, {
                    color: puntosSeleccionados >= 100 ? DISENO.colors.text : DISENO.colors.textTertiary,
                    fontWeight: 'bold',
                    fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                  }]}>
                    {puntosSeleccionados < 100 ? 'Mínimo 100 pts' : '✅ Canjear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {puntosSeleccionados < 100 && puntosSeleccionados > 0 && (
              <Text style={[styles.modalPuntosMinimo, {
                fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 9 }),
                color: DISENO.colors.accent,
                textAlign: 'center',
                marginTop: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
              }]}>
                ⚠️ Mínimo 100 puntos (${formatearPrecio(100)} de descuento)
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - CON SIMPSONFONT Y TEMA CLARO
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  headerTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: FUENTES.regular,
    marginTop: 8,
    textAlign: 'center',
  },
  cuponVacioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginTop: 20,
    marginBottom: 4,
    padding: 14,
    gap: 10,
    borderRadius: 12,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '30',
    ...DISENO.shadow.sm,
  },
  cuponVacioContenido: { flex: 1 },
  cuponVacioTitulo: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    fontSize: 12,
    fontWeight: '400',
  },
  cuponVacioDetalle: {
    fontFamily: FUENTES.regular,
    marginTop: 3,
    color: DISENO.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  emptyButton: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 12,
    ...DISENO.shadow.md,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  list: { flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  imagen: {
    marginRight: 10,
    backgroundColor: DISENO.colors.surfaceHover,
  },
  imagenPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  emoji: {},
  itemInfo: { flex: 1 },
  itemNombre: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  itemPrecioTotal: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 2,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  botonControl: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  cantidad: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    minWidth: 24,
    textAlign: 'center',
  },
  botonEliminar: { padding: 4, marginLeft: 2 },
  footerContainer: {
    borderWidth: 1,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  summary: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontFamily: FUENTES.regular,
    fontSize: 11,
  },
  summaryValue: {
    fontFamily: FUENTES.regular,
    fontSize: 11,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    fontSize: 14,
  },
  totalPrice: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    fontSize: 16,
  },
  cuponAplicado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
    borderWidth: 1,
  },
  cuponAplicadoText: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cuponAplicadoSubtext: {
    fontFamily: FUENTES.regular,
    fontSize: 10,
    marginTop: 2,
  },
  // ✅ NUEVO: Ahorro total
  ahorroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  ahorroEmoji: {},
  ahorroTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  checkoutButton: {
    overflow: 'hidden',
    marginBottom: 6,
    borderRadius: 12,
    ...DISENO.shadow.md,
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  checkoutButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  checkoutPrice: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DISENO.colors.text + '10',
  },
  checkoutPriceText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  emptyCartButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyCartText: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    opacity: 0.5,
  },
  puntosButton: { flex: 1 },
  puntosButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  puntosButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puntosButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  puntosButtonLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    marginLeft: 6,
  },
  inputContainer: { width: '100%' },
  inputLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  inputButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    minWidth: 60,
  },
  modalPuntos: {
    alignSelf: 'center',
  },
  modalPuntosHeader: { marginBottom: 4 },
  modalPuntosTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  modalPuntosSubtitle: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
  },
  modalPuntosInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPuntosInfoLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
  },
  modalPuntosInfoValue: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  modalPuntosEquivalencia: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalPuntosEquivalenciaText: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
  },
  modalPuntosMinimo: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    marginTop: 8,
  },
  modalPuntosDescuentoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalPuntosDescuentoLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
  },
  modalPuntosDescuento: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  modalPuntosBotones: {
    flexDirection: 'row',
    gap: 12,
  },
  puntosAction: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  puntosCancel: { borderWidth: 1 },
  puntosCancelText: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
  },
  puntosConfirm: {
    borderWidth: 1,
    borderColor: DISENO.colors.accentSecondary,
  },
  puntosConfirmText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalIcon: { marginBottom: 12 },
  modalTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginBottom: 8,
  },
  modalText: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalCancel: { borderWidth: 1 },
  modalCancelText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    fontSize: 13,
  },
  modalConfirm: {
    borderWidth: 1,
    borderColor: DISENO.colors.accentSecondary,
  },
  modalConfirmText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    fontSize: 13,
  },

  // ✅ BADGE DE NIVEL
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  nivelBadgeEmoji: {},
  nivelBadgeTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  nivelBadgeDetalle: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
  },
  envioGratisTag: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});