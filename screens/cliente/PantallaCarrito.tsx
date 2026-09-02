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
import { Colores } from '../../lib/colores';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
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

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
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

  // ✅ Estados
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState(0);
  const [puntosMaximos, setPuntosMaximos] = useState(0);
  const [puntosOriginales, setPuntosOriginales] = useState(0);
  const [puntosOriginalesAntesCanje, setPuntosOriginalesAntesCanje] = useState(0);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);
  const [cuponPuntosAplicado, setCuponPuntosAplicado] = useState<any>(null);
  const [inputPuntos, setInputPuntos] = useState('');

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

  // ✅ RECARGAR UBICACIÓN CUANDO LA PANTALLA OBTIENE FOCO
  useFocusEffect(
    useCallback(() => {
      const recargarUbicacion = async () => {
        console.log('🔄 [Carrito] Recargando ubicación al obtener foco...');

        // ✅ PRIORIDAD 1: Usar la dirección del perfil SIEMPRE si existe
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
            console.log('📍 [Carrito] Usando dirección del perfil (prioridad máxima):', direccionCompleta);

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

        // 2️⃣ Si no hay dirección en perfil, intentar cargar desde el store
        const ubicacionCargada = await cargarUbicacionTemporal();

        if (ubicacionCargada) {
          console.log('📍 [Carrito] Usando ubicación del store (sin perfil):', ubicacionCargada);
          setUbicacionGuardada(ubicacionCargada);
          setCargandoUbicacion(false);
          return;
        }

        // 3️⃣ Si no hay ubicación en perfil ni en store, usar local por defecto
        console.log('📍 [Carrito] No hay ubicación, usando local por defecto');
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
    }, [perfil]) // ✅ Dependencia: perfil
  );

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
        seleccionadaPorUsuario: false,
      };
      setUbicacionGuardada(ubicacionDefault);
      await guardarUbicacionTemporal(ubicacionDefault);

    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
        seleccionadaPorUsuario: false,
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
      setPuntosOriginalesAntesCanje(0);
    }
  };

  // ============================================================
  // 🎯 MANEJADORES DE PUNTOS
  // ============================================================

  // ✅ Función para restaurar puntos - SILENCIOSA
  const restaurarPuntos = async () => {
    if (!perfil?.id) return;

    const puntosARestaurar = cuponPuntosAplicado?.puntos_antes_canje || puntosOriginalesAntesCanje || puntosOriginales;

    if (puntosARestaurar === 0) return;

    console.log('🔄 Restaurando puntos a:', puntosARestaurar);

    try {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          puntos_acumulados: puntosARestaurar,
        })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ Error restaurando puntos:', updateError);
        return;
      }

      setPuntosMaximos(puntosARestaurar);
      setPuntosOriginales(puntosARestaurar);
      setPuntosOriginalesAntesCanje(0);
      setCuponPuntosAplicado(null);
      setPuntosSeleccionados(0);
      setInputPuntos('');

      await cargarPuntosUsuario();
      console.log('✅ Puntos restaurados correctamente');

    } catch (error) {
      console.error('❌ Error restaurando puntos:', error);
    }
  };

  // ✅ Función para quitar el descuento - SIN ALERTA
  const quitarDescuento = () => {
    restaurarPuntos();
  };

  // ✅ Función para validar y seleccionar puntos desde el input
  const handleInputPuntos = (text: string) => {
    const num = parseInt(text) || 0;
    if (num < 0) return;
    setInputPuntos(text);
    setPuntosSeleccionados(num);
  };

  // ✅ Función de canje mejorada
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

  // ✅ Función para cancelar el modal
  const cancelarCanje = () => {
    setPuntosSeleccionados(0);
    setInputPuntos('');
    setMostrarModalPuntos(false);
  };

  // ============================================================
  // 📊 CÁLCULOS DE PRECIOS
  // ============================================================
  const calcularDescuento = useCallback(() => {
    if (!cuponPuntosAplicado || !cuponPuntosAplicado.recompensas) return 0;
    const r = cuponPuntosAplicado.recompensas;

    if (r.tipo === 'DESCUENTO_FIJO') {
      return Math.min(r.valor_descuento || 0, total);
    }
    if (r.tipo === 'DESCUENTO') {
      return (total * r.valor_descuento) / 100;
    }
    if (r.tipo === 'ENVIO_GRATIS') return costoEnvioEstimado;
    return 0;
  }, [cuponPuntosAplicado, total, costoEnvioEstimado]);

  const costoEnvioFinal = cuponPuntosAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
    ? 0
    : (envioDisponible ? costoEnvioEstimado : 0);

  const descuento = calcularDescuento();
  const totalFinal = total + costoEnvioFinal - descuento;

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
  const tituloSize = responsive.getValor({ tablet: 28, normal: 22, small: 18 });

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
          styles.item,
          {
            padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
            borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
            backgroundColor: DESIGN.colors.surface,
            borderColor: DESIGN.colors.border,
            shadowColor: DESIGN.colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}>
          {/* Imagen */}
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
                backgroundColor: DESIGN.colors.surfaceHover,
              }
            ]}>
              <Text style={[styles.emoji, { fontSize: responsive.getValor({ tablet: 32, normal: 28, small: 24 }) }]}>
                🍔
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.itemInfo}>
            <Text style={[
              styles.itemNombre,
              { fontSize: responsive.getValor({ tablet: 16, normal: 15, small: 13 }), color: DESIGN.colors.text }
            ]} numberOfLines={1}>
              {item.producto.nombre}
            </Text>
            <Text style={[
              styles.itemPrecioTotal,
              { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }), color: DESIGN.colors.accentSecondary }
            ]}>
              {formatearPrecio(precioUnitario(item.producto.precio) * item.cantidad)}
            </Text>
          </View>

          {/* Controles */}
          <View style={styles.controles}>
            <TouchableOpacity
              onPress={() => disminuirCantidad(item.producto.id)}
              style={[
                styles.botonControl,
                {
                  width: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  height: responsive.getValor({ tablet: 32, normal: 28, small: 24 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  backgroundColor: DESIGN.colors.accentSecondary,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DESIGN.colors.text} />
            </TouchableOpacity>

            <Text style={[
              styles.cantidad,
              { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }), color: DESIGN.colors.text }
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
                  backgroundColor: DESIGN.colors.accentSecondary,
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DESIGN.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quitarProducto(item.producto.id)}
              style={styles.botonEliminar}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DESIGN.colors.accent} />
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
          colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={responsive.getValor({ tablet: 100, normal: 80, small: 60 })} color={DESIGN.colors.surface + '30'} />
          <Text style={[
            styles.emptyText,
            { fontSize: responsive.getValor({ tablet: 24, normal: 20, small: 18 }), color: DESIGN.colors.surface }
          ]}>
            Tu carrito está vacío
          </Text>
          <Text style={[
            styles.emptySubtext,
            { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }), color: DESIGN.colors.surface + '60' }
          ]}>
            Agrega productos del menú 🍔
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => props.navigation.navigate('Principal', { screen: 'Menu' })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="restaurant" size={responsive.getValor({ tablet: 24, normal: 20, small: 18 })} color={DESIGN.colors.text} />
              <Text style={[
                styles.emptyButtonText,
                { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }), color: DESIGN.colors.text }
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
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
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
          borderBottomColor: DESIGN.colors.surface + '10',
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 28, normal: 24, small: 20 })} color={DESIGN.colors.surface} />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { fontSize: tituloSize, color: DESIGN.colors.surface }
        ]}>
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
            paddingBottom: responsive.getValor({ tablet: 240, normal: 220, small: 200 }),
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
              backgroundColor: DESIGN.colors.surface + '90',
              borderColor: DESIGN.colors.border,
              shadowColor: DESIGN.colors.cardShadow,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            }
          ]}>
            {/* ✅ BOTÓN DE PUNTOS */}
            <TouchableOpacity
              style={[
                styles.puntosButton,
                {
                  backgroundColor: DESIGN.colors.accentSecondary + '15',
                  borderColor: DESIGN.colors.accent,
                  borderWidth: 2.5,
                  paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                  paddingHorizontal: responsive.getValor({ tablet: 20, normal: 16, small: 16 }),
                  borderRadius: 14,
                  flex: 1,
                  shadowColor: DESIGN.colors.accent,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 3,
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
                    color: DESIGN.colors.text,
                    fontWeight: '700',
                    fontSize: responsive.getValor({ tablet: 16, normal: 12, small: 13 }),
                  }]}>
                    {puntosMaximos} pts
                  </Text>
                </View>
                <View style={styles.puntosButtonRight}>
                  <Text style={[styles.puntosButtonLabel, {
                    color: DESIGN.colors.accent,
                    fontWeight: '700',
                    fontSize: responsive.getValor({ tablet: 13, normal: 10, small: 11 }),
                    backgroundColor: DESIGN.colors.accent + '10',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }]}>
                    💰 Canjear por descuento
                  </Text>
                  <Ionicons name="chevron-forward" size={responsive.getValor({ tablet: 20, normal: 16, small: 14 })} color={DESIGN.colors.accent} />
                </View>
              </View>
            </TouchableOpacity>

            {/* RESUMEN */}
            <View style={[styles.summary, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: DESIGN.colors.textSecondary }]}>Productos ({totalProductos})</Text>
                <Text style={[styles.summaryValue, { color: DESIGN.colors.text }]}>{formatearPrecio(total)}</Text>
              </View>

              {!calculandoEnvio && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DESIGN.colors.textSecondary }]}>
                    {cuponPuntosAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? '🚚 Envío (gratis)' : '🚚 Envío'}
                  </Text>
                  <Text style={[
                    styles.summaryValue,
                    cuponPuntosAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' && { color: DESIGN.colors.verde }
                  ]}>
                    {cuponPuntosAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
                      ? 'GRATIS'
                      : (envioDisponible ? formatearPrecio(costoEnvioEstimado) : mensajeEnvio || '$0')
                    }
                  </Text>
                </View>
              )}

              {descuento > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: DESIGN.colors.verde }]}>🎯 Descuento</Text>
                  <Text style={[styles.summaryValue, { color: DESIGN.colors.verde }]}>-{formatearPrecio(descuento)}</Text>
                </View>
              )}

              {cuponPuntosAplicado && (
                <View style={[styles.cuponAplicado, { backgroundColor: DESIGN.colors.verde + '15', borderColor: DESIGN.colors.verde + '20' }]}>
                  <Text style={[styles.cuponAplicadoText, { color: DESIGN.colors.verde }]} numberOfLines={1}>
                    {cuponPuntosAplicado.recompensas?.nombre}
                  </Text>
                  <TouchableOpacity
                    onPress={quitarDescuento}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color={DESIGN.colors.accent} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.totalLabel, { color: DESIGN.colors.text }]}>Total</Text>
                <Text style={[styles.totalPrice, { color: DESIGN.colors.accentSecondary }]}>{formatearPrecio(totalFinal)}</Text>
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
                  descuento,
                  costoEnvio: costoEnvioFinal,
                  totalFinal,
                  ubicacionGuardada,
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                style={styles.checkoutButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cart" size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })} color={DESIGN.colors.text} />
                <Text style={[
                  styles.checkoutButtonText,
                  { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }), color: DESIGN.colors.text }
                ]}>
                  Finalizar compra
                </Text>
                <View style={[styles.checkoutPrice, { backgroundColor: DESIGN.colors.text + '15' }]}>
                  <Text style={[
                    styles.checkoutPriceText,
                    { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }), color: DESIGN.colors.text }
                  ]}>
                    {formatearPrecio(totalFinal)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* VACIAR CARRITO */}
            <TouchableOpacity
              style={styles.emptyCartButton}
              onPress={vaciarCarrito}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.emptyCartText,
                { fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }), color: DESIGN.colors.textTertiary }
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
          <View style={[styles.modal, { backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.accent + '30' }]}>
            <Text style={[styles.modalIcon, { fontSize: 60 }]}>🔐</Text>
            <Text style={[styles.modalTitle, { fontSize: 22, color: DESIGN.colors.text }]}>Inicia sesión</Text>
            <Text style={[styles.modalText, { color: DESIGN.colors.textSecondary }]}>
              Debes iniciar sesión para realizar pedidos
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: DESIGN.colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm, { backgroundColor: DESIGN.colors.accentSecondary }]}
                onPress={() => {
                  setMostrarModalLogin(false);
                  props.navigation.navigate('Login');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="log-in" size={18} color={DESIGN.colors.text} />
                <Text style={[styles.modalConfirmText, { color: DESIGN.colors.text }]}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL DE PUNTOS SIMPLIFICADO Y CORREGIDO */}
      <Modal visible={mostrarModalPuntos} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalPuntos,
            {
              backgroundColor: DESIGN.colors.surface,
              borderColor: DESIGN.colors.accent + '20',
              borderRadius: 24,
              width: responsive.getValor({ tablet: '60%', normal: '92%', small: '95%' }),
              maxWidth: 450,
              padding: responsive.getValor({ tablet: 28, normal: 20, small: 16 }),
              borderWidth: 2,
              alignSelf: 'center',
            }
          ]}>

            {/* HEADER */}
            <View style={styles.modalPuntosHeader}>
              <Text style={[styles.modalPuntosTitle, {
                fontSize: responsive.getValor({ tablet: 24, normal: 20, small: 18 }),
                fontWeight: 'bold',
                color: DESIGN.colors.text,
                textAlign: 'center',
              }]}>
                ⭐ Canjear Puntos
              </Text>
              <Text style={[styles.modalPuntosSubtitle, {
                fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                color: DESIGN.colors.textSecondary,
                textAlign: 'center',
                marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              }]}>
                Ingresá cuántos puntos querés canjear
              </Text>
            </View>

            {/* INFO DE PUNTOS DISPONIBLES */}
            <View style={[styles.modalPuntosInfoContainer, {
              backgroundColor: DESIGN.colors.accentSecondary + '08',
              borderRadius: 12,
              padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
              marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
              borderWidth: 1,
              borderColor: DESIGN.colors.accentSecondary + '20',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }]}>
              <View>
                <Text style={[styles.modalPuntosInfoLabel, {
                  fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }),
                  color: DESIGN.colors.textSecondary,
                  fontWeight: '500',
                }]}>
                  Puntos disponibles
                </Text>
                <Text style={[styles.modalPuntosInfoValue, {
                  fontSize: responsive.getValor({ tablet: 26, normal: 22, small: 20 }),
                  fontWeight: 'bold',
                  color: DESIGN.colors.accentSecondary,
                }]}>
                  {puntosMaximos} pts
                </Text>
              </View>

            </View>

            {/* INPUT DE PUNTOS */}
            <View style={[styles.inputContainer, {
              marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
            }]}>
              <Text style={[styles.inputLabel, {
                fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                color: DESIGN.colors.textSecondary,
                marginBottom: 6,
              }]}>
                Cantidad de puntos
              </Text>
              <View style={[styles.inputWrapper, {
                borderColor: DESIGN.colors.border,
                backgroundColor: DESIGN.colors.surfaceHover,
                borderRadius: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                overflow: 'hidden',
              }]}>
                <TouchableOpacity
                  style={[styles.inputButton, {
                    paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                    paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                    backgroundColor: DESIGN.colors.surface,
                    borderRightWidth: 1,
                    borderRightColor: DESIGN.colors.border,
                  }]}
                  onPress={() => {
                    const nuevo = Math.max(0, puntosSeleccionados - 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={responsive.getValor({ tablet: 22, normal: 20, small: 18 })} color={DESIGN.colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.inputField, {
                    fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }),
                    color: DESIGN.colors.text,
                    paddingHorizontal: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                    paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                    flex: 1,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    minWidth: 60,
                  }]}
                  value={inputPuntos}
                  onChangeText={handleInputPuntos}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={DESIGN.colors.textTertiary}
                  selectionColor={DESIGN.colors.accent}
                />

                <TouchableOpacity
                  style={[styles.inputButton, {
                    paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                    paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                    backgroundColor: DESIGN.colors.surface,
                    borderLeftWidth: 1,
                    borderLeftColor: DESIGN.colors.border,
                  }]}
                  onPress={() => {
                    const nuevo = Math.min(puntosMaximos, puntosSeleccionados + 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={responsive.getValor({ tablet: 22, normal: 20, small: 18 })} color={DESIGN.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* RESUMEN DEL DESCUENTO */}
            {puntosSeleccionados > 0 && (
              <View style={[styles.modalPuntosDescuentoContainer, {
                backgroundColor: DESIGN.colors.accentSecondary + '08',
                borderRadius: 12,
                padding: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                marginBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                borderWidth: 1,
                borderColor: DESIGN.colors.accentSecondary + '20',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }]}>
                <Text style={[styles.modalPuntosDescuentoLabel, {
                  fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                  color: DESIGN.colors.text,
                  fontWeight: '500',
                }]}>
                  💰 Descuento:
                </Text>
                <Text style={[styles.modalPuntosDescuento, {
                  fontSize: responsive.getValor({ tablet: 22, normal: 20, small: 18 }),
                  fontWeight: 'bold',
                  color: DESIGN.colors.accentSecondary,
                }]}>
                  {formatearPrecio(Math.floor(puntosSeleccionados / 100) * 100)}
                </Text>
              </View>
            )}

            {/* BOTONES DE ACCIÓN */}
            <View style={[styles.modalPuntosBotones, {
              flexDirection: 'row',
              gap: 12,
            }]}>
              <TouchableOpacity
                style={[styles.puntosAction, styles.puntosCancel, {
                  flex: 1,
                  paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: DESIGN.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor: DESIGN.colors.border,
                }]}
                onPress={cancelarCanje}
                activeOpacity={0.7}
              >
                <Text style={[styles.puntosCancelText, {
                  color: DESIGN.colors.textSecondary,
                  fontWeight: '600',
                  fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.puntosAction, styles.puntosConfirm, {
                  flex: 1,
                  paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: puntosSeleccionados >= 100 ? DESIGN.colors.accentSecondary : DESIGN.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor: puntosSeleccionados >= 100 ? DESIGN.colors.accentSecondary : DESIGN.colors.border,
                }]}
                onPress={canjearPuntos}
                disabled={canjeandoPuntos || puntosSeleccionados < 100}
                activeOpacity={0.7}
              >
                {canjeandoPuntos ? (
                  <ActivityIndicator size="small" color={DESIGN.colors.text} />
                ) : (
                  <Text style={[styles.puntosConfirmText, {
                    color: puntosSeleccionados >= 100 ? DESIGN.colors.text : DESIGN.colors.textTertiary,
                    fontWeight: 'bold',
                    fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                  }]}>
                    {puntosSeleccionados < 100 ? 'Mínimo 100 pts' : '✅ Canjear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* MENSAJE INFORMATIVO */}
            {puntosSeleccionados < 100 && puntosSeleccionados > 0 && (
              <Text style={[styles.modalPuntosMinimo, {
                fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }),
                color: DESIGN.colors.accent,
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
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
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
    borderBottomWidth: 1,
    backgroundColor: DESIGN.colors.surface + '10',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.5,
  },
  emptyButton: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 12,
    elevation: 4,
    shadowColor: DESIGN.colors.accentSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontWeight: 'bold',
  },
  list: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  imagen: {
    marginRight: 10,
    backgroundColor: DESIGN.colors.surfaceHover,
  },
  imagenPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emoji: {},
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  itemPrecioTotal: {
    fontWeight: 'bold',
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
    borderColor: DESIGN.colors.border,
  },
  cantidad: {
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  botonEliminar: {
    padding: 4,
    marginLeft: 2,
  },
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
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: 'bold',
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
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  checkoutButton: {
    overflow: 'hidden',
    elevation: 6,
    shadowColor: DESIGN.colors.accentSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 6,
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
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  checkoutPrice: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN.colors.text + '10',
  },
  checkoutPriceText: {
    fontWeight: '800',
  },
  emptyCartButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyCartText: {
    fontWeight: '500',
    opacity: 0.5,
  },
  puntosButton: {
    flex: 1,
  },
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
    fontWeight: '600',
  },
  // ✅ ESTILOS DEL INPUT
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
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
    fontWeight: 'bold',
    minWidth: 60,
  },
  // ✅ ESTILOS DEL MODAL PUNTOS
  modalPuntos: {
    alignSelf: 'center',
  },
  modalPuntosHeader: {
    marginBottom: 4,
  },
  modalPuntosTitle: {
    fontWeight: 'bold',
  },
  modalPuntosSubtitle: {
    fontWeight: '400',
  },
  modalPuntosInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPuntosInfoLabel: {
    fontWeight: '500',
  },
  modalPuntosInfoValue: {
    fontWeight: 'bold',
  },
  modalPuntosEquivalencia: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalPuntosEquivalenciaText: {
    fontWeight: '600',
  },
  modalPuntosMinimo: {
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
    fontWeight: '500',
  },
  modalPuntosDescuento: {
    fontWeight: 'bold',
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
  puntosCancel: {
    borderWidth: 1,
  },
  puntosCancelText: {
    fontWeight: '600',
  },
  puntosConfirm: {
    borderWidth: 1,
    borderColor: DESIGN.colors.accentSecondary,
  },
  puntosConfirmText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    borderWidth: 2,
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
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
  modalCancel: {
    borderWidth: 1,
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirm: {
    borderWidth: 1,
    borderColor: DESIGN.colors.accentSecondary,
  },
  modalConfirmText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});