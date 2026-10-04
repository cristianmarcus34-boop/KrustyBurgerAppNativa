// screens/repartidor/PantallaTransmision.tsx - V4 (Modo oscuro + Reportar problema + Pausa + Sonido)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  RefreshControl,
  Animated,
  Alert,
  Image,
  Linking,
  Platform,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { TouchableRipple } from 'react-native-paper';
import { useAudioPlayer } from 'expo-audio';

import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Pedido } from '../../lib/tipos';
import { useResponsive, Sizes } from '../../lib/colores';
import { useTema, useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { notificacionService } from '../../services/notificacionService';
import { useToast, Toast } from '../../components/Toast';
import {
  detenerSeguimientoUbicacionEnSegundoPlano,
  iniciarSeguimientoUbicacionEnSegundoPlano,
} from '../../services/seguimientoUbicacionRepartidor';
import {
  obtenerRuta,
  guardarRutaPedido,
  obtenerRutaPedido,
  obtenerInfoRutaPedido,
} from '../../lib/directions';

// ✅ MARCADORES
const marcadorLocal = require('../../assets/icon.png');
const marcadorCasa = require('../../assets/iconos/casa.png');

// ✅ SONIDO DE PEDIDO NUEVO
const SONIDO_PEDIDO_NUEVO = require('../../assets/sounds/saxolisa.wav');

// ✅ COORDENADAS KRUSTY
const UBICACION_KRUSTY = { latitude: -34.776484410467525, longitude: -58.29220250409459 };

const validarCoordenadas = (coords: { latitude: number; longitude: number }[]) => {
  if (!coords || coords.length < 2) return false;
  return coords.every(
    (coord) =>
      coord.latitude !== undefined &&
      coord.longitude !== undefined &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude) &&
      Math.abs(coord.latitude) <= 90 &&
      Math.abs(coord.longitude) <= 180
  );
};

/**
 * Normaliza un teléfono argentino para usarlo en tel:/whatsapp:
 */
const normalizarTelefonoAR = (tel: string): string => {
  let limpio = tel.replace(/[^\d+]/g, '');

  if (limpio.startsWith('+54')) {
    if (!limpio.startsWith('+549')) {
      limpio = '+549' + limpio.slice(3);
    }
    return limpio;
  }

  if (limpio.startsWith('54')) {
    if (!limpio.startsWith('549')) {
      limpio = '549' + limpio.slice(2);
    }
    return '+' + limpio;
  }

  if (limpio.startsWith('9')) {
    return '+54' + limpio;
  }

  return '+549' + limpio;
};

// ✅ MOTIVOS DE PROBLEMA
const MOTIVOS_PROBLEMA = [
  { id: 'cliente_ausente', label: 'Cliente ausente', icono: 'person-remove-outline', color: '#FF6F00' },
  { id: 'direccion_incorrecta', label: 'Dirección incorrecta', icono: 'location-outline', color: '#E53935' },
  { id: 'cliente_rechazo', label: 'Cliente rechazó el pedido', icono: 'close-circle-outline', color: '#C62828' },
  { id: 'otro', label: 'Otro problema', icono: 'alert-circle-outline', color: '#7B1FA2' },
] as const;

export default function PantallaTransmision(props: any) {
  const { perfil, cerrarSesion } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

  // ✅ TEMA
  const { tema, esOscuro } = useTema();
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // ✅ COLORES DE ESTADO (dependientes del tema)
  const COLORES_ESTADO: Record<string, string> = useMemo(
    () => ({
      listo: colores.success,
      en_camino: colores.naranja,
      entregado: colores.success,
    }),
    [colores]
  );

  // ✅ SONIDO DE PEDIDOS NUEVOS
  const player = useAudioPlayer(SONIDO_PEDIDO_NUEVO);

  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [pedidosEntregados, setPedidosEntregados] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState({
    lat: -34.776484410467525,
    lng: -58.29220250409459,
  });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [procesandoEntrega, setProcesandoEntrega] = useState(false);
  const [pestana, setPestana] = useState<'activos' | 'historial'>('activos');
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanciaReal, setDistanciaReal] = useState<string>('');
  const [tiempoReal, setTiempoReal] = useState<string>('');
  const [cargandoRuta, setCargandoRuta] = useState(false);

  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false);
  const [pedidoPendienteTransmision, setPedidoPendienteTransmision] = useState<Pedido | null>(null);

  // 🆕 Bottom sheet para contactar al cliente
  const [mostrarModalContacto, setMostrarModalContacto] = useState(false);

  // 🆕 Estados de disponibilidad
  const [disponible, setDisponible] = useState<boolean>(true);
  const [guardandoDisponibilidad, setGuardandoDisponibilidad] = useState(false);

  // 🆕 Estados de reportar problema
  const [mostrarModalProblema, setMostrarModalProblema] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string | null>(null);
  const [detalleProblema, setDetalleProblema] = useState('');
  const [reportandoProblema, setReportandoProblema] = useState(false);

  // 🆕 Último pedido visto (para no repetir sonido)
  const [ultimoPedidoVisto, setUltimoPedidoVisto] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<any>(null);
  const rutaCargadaRef = useRef<number | null>(null);

  const usuarioInteractuandoMapaRef = useRef(false);
  const mapaCentradoRef = useRef<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const liveDotScale = useSharedValue(1);

  // ✅ Tamaños responsive
  const paddingHorizontal = responsive.getEspaciado('LG');
  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 18 });
  const subtituloSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });
  const statValorSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });
  const statLabelSize = responsive.getValor({ tablet: 11, normal: 10, small: 9 });
  const pestanaTextSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });
  const mapaHeight = responsive.getValor({ tablet: 280, normal: 220, small: 180 });
  const pedidoIdSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });
  const clienteNombreSize = responsive.getValor({ tablet: 13, normal: 12, small: 10 });
  const botonTextSize = responsive.getValor({ tablet: 15, normal: 14, small: 12 });
  const tarjetaPadding = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
  const marcadorLocalSize = responsive.getValor({ tablet: 88, normal: 76, small: 64 });
  const marcadorCasaSize = responsive.getValor({ tablet: 48, normal: 40, small: 34 });
  const avatarSize = responsive.getValor({ tablet: 48, normal: 42, small: 38 });

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    cargarPedidos();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  // ✅ Cargar disponibilidad del perfil
  useEffect(() => {
    if (!perfil?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('disponible_repartidor')
          .eq('id', perfil.id)
          .maybeSingle();
        if (!error && data) {
          setDisponible(data.disponible_repartidor !== false);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo cargar disponibilidad:', e);
      }
    })();
  }, [perfil?.id]);

  // ✅ Suscripción realtime a pedidos nuevos
  useEffect(() => {
    if (!disponible) return;
    if (!perfil?.id) return;

    const canal = supabase
      .channel('pedidos-nuevos-repartidor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: 'estado=eq.listo',
        },
        async (payload: any) => {
          const pedido = payload.new;
          if (!pedido?.id) return;
          if (ultimoPedidoVisto === pedido.id) return;
          setUltimoPedidoVisto(pedido.id);

          // Verificar preferencia de sonido
          try {
            const { data: perfilData } = await supabase
              .from('perfiles')
              .select('sonido_pedidos_activo')
              .eq('id', perfil.id)
              .maybeSingle();

            if (perfilData?.sonido_pedidos_activo !== false) {
              try {
                player.seekTo(0);
                player.play();
              } catch (audioErr) {
                console.warn('⚠️ No se pudo reproducir sonido:', audioErr);
              }
            }
          } catch (e) {
            console.warn('⚠️ No se pudo chequear preferencia de sonido:', e);
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
          toast.info(`🛵 Pedido #${pedido.id} disponible`);

          // Refrescar lista
          cargarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [disponible, perfil?.id, ultimoPedidoVisto]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || !watchRef.current) return;
      console.log('📱 App en background — la transmisión sigue activa');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (transmitiendo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      liveDotScale.value = withRepeat(
        withSequence(withTiming(1.5, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        false
      );
    } else {
      pulseAnim.setValue(1);
      liveDotScale.value = 1;
    }
  }, [transmitiendo]);

  useEffect(() => {
    if (!transmitiendo || !pedidoSeleccionado) return;
    if (rutaCargadaRef.current === pedidoSeleccionado.id) return;
    rutaCargadaRef.current = pedidoSeleccionado.id;

    const cargarRuta = async () => {
      try {
        const rutaGuardada = await obtenerRutaPedido(pedidoSeleccionado.id);
        if (rutaGuardada && rutaGuardada.length > 1) {
          setRutaPuntos(rutaGuardada);
          const infoRuta = await obtenerInfoRutaPedido(pedidoSeleccionado.id);
          if (infoRuta) {
            setDistanciaReal(infoRuta.distancia);
            setTiempoReal(infoRuta.duracion);
          }
          return;
        }

        const origenLat = pedidoSeleccionado.lat_repartidor ?? UBICACION_KRUSTY.latitude;
        const origenLng = pedidoSeleccionado.repartidor_de_lng ?? UBICACION_KRUSTY.longitude;
        const destinoLat = pedidoSeleccionado.lat_cliente ?? UBICACION_KRUSTY.latitude;
        const destinoLng = pedidoSeleccionado.lng_cliente ?? UBICACION_KRUSTY.longitude;

        const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);
        if (ruta && ruta.points.length > 1) {
          setRutaPuntos(ruta.points);
          setDistanciaReal(ruta.distance);
          setTiempoReal(ruta.duration);
          await guardarRutaPedido(
            pedidoSeleccionado.id,
            ruta.points,
            ruta.distance,
            ruta.duration
          );
          return;
        }

        setRutaPuntos([
          { latitude: origenLat, longitude: origenLng },
          { latitude: destinoLat, longitude: destinoLng },
        ]);
        setDistanciaReal('');
        setTiempoReal('');
      } catch (error) {
        console.warn('⚠️ Error cargando ruta en transmisión:', error);
      }
    };

    cargarRuta();
  }, [transmitiendo, pedidoSeleccionado]);

  useEffect(() => {
    if (!transmitiendo || !pedidoSeleccionado) {
      mapaCentradoRef.current = null;
      return;
    }
    if (!mapRef.current) return;
    if (mapaCentradoRef.current === pedidoSeleccionado.id) return;

    mapaCentradoRef.current = pedidoSeleccionado.id;

    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      centrarMapaEnRutaYRepartidor();
    }, 500);

    return () => clearTimeout(timer);
  }, [transmitiendo, pedidoSeleccionado]);

  const previsualizarRuta = useCallback(async (pedido: Pedido) => {
    setCargandoRuta(true);
    try {
      const rutaGuardada = await obtenerRutaPedido(pedido.id);
      if (rutaGuardada && rutaGuardada.length > 1) {
        setRutaPuntos(rutaGuardada);
        const infoRuta = await obtenerInfoRutaPedido(pedido.id);
        if (infoRuta) {
          setDistanciaReal(infoRuta.distancia);
          setTiempoReal(infoRuta.duracion);
        }
        setCargandoRuta(false);
        return;
      }

      const origenLat = UBICACION_KRUSTY.latitude;
      const origenLng = UBICACION_KRUSTY.longitude;
      const destinoLat = pedido.lat_cliente || UBICACION_KRUSTY.latitude;
      const destinoLng = pedido.lng_cliente || UBICACION_KRUSTY.longitude;

      const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);

      if (ruta && ruta.points.length > 1) {
        setRutaPuntos(ruta.points);
        setDistanciaReal(ruta.distance);
        setTiempoReal(ruta.duration);
        await guardarRutaPedido(pedido.id, ruta.points, ruta.distance, ruta.duration);
      } else {
        const puntosLineaRecta = [
          { latitude: origenLat, longitude: origenLng },
          { latitude: destinoLat, longitude: destinoLng },
        ];
        setRutaPuntos(puntosLineaRecta);
        setDistanciaReal('0.0 km');
        setTiempoReal('0 min');
        await guardarRutaPedido(pedido.id, puntosLineaRecta, '0.0 km', '0 min');
      }
    } catch (error) {
      console.error('❌ Error previsualizando ruta:', error);
    } finally {
      setCargandoRuta(false);
    }
  }, []);

  const seleccionarPedido = (pedido: Pedido) => {
    Haptics.selectionAsync().catch(() => { });
    setPedidoSeleccionado(pedido);
    mapaCentradoRef.current = null;
    if (!transmitiendo) {
      rutaCargadaRef.current = null;
      previsualizarRuta(pedido);
    }
  };

  const centrarMapaEnRutaYRepartidor = useCallback(() => {
    if (!mapRef.current) return;

    const puntos = [
      { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
      { latitude: UBICACION_KRUSTY.latitude, longitude: UBICACION_KRUSTY.longitude },
    ];

    if (pedidoSeleccionado?.lat_cliente && pedidoSeleccionado?.lng_cliente) {
      puntos.push({
        latitude: pedidoSeleccionado.lat_cliente,
        longitude: pedidoSeleccionado.lng_cliente,
      });
    }

    if (rutaPuntos.length > 1) {
      puntos.push(...rutaPuntos);
    }

    if (puntos.length === 0) return;

    const lats = puntos.map((p) => p.latitude);
    const lngs = puntos.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max((maxLat - minLat) * 1.4 + 0.005, 0.02);
    const lngDelta = Math.max((maxLng - minLng) * 1.4 + 0.005, 0.02);

    mapRef.current.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      800
    );
  }, [ubicacionActual, pedidoSeleccionado, rutaPuntos]);

  // ============================================================
  // CARGA
  // ============================================================
  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const { data: activos, error: errorActivos } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['listo', 'en_camino'])
        .order('creado_en', { ascending: false });

      if (errorActivos) throw errorActivos;
      setPedidosActivos((activos as Pedido[]) || []);

      const { data: entregados, error: errorEntregados } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'entregado')
        .order('creado_en', { ascending: false })
        .limit(20);

      if (errorEntregados) throw errorEntregados;
      setPedidosEntregados((entregados as Pedido[]) || []);
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const manejarRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setRefrescando(true);
    await cargarPedidos();
  };

  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const mostrarExito = (mensaje: string) => {
    setMensajeExito(mensaje);
    setMostrarModalExito(true);
    setTimeout(() => {
      setMostrarModalExito(false);
    }, 2500);
  };

  // ============================================================
  // 🆕 TOGGLE DISPONIBILIDAD
  // ============================================================
  const toggleDisponibilidad = async (valor: boolean) => {
    if (!perfil?.id || guardandoDisponibilidad) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setGuardandoDisponibilidad(true);
    setDisponible(valor);

    try {
      const { error } = await supabase
        .from('perfiles')
        .update({ disponible_repartidor: valor })
        .eq('id', perfil.id);

      if (error) throw error;

      toast.exito(valor ? '🟢 Disponible' : '🟡 Pausado');
    } catch (e: any) {
      console.error('❌ Error guardando disponibilidad:', e);
      setDisponible(!valor);
      toast.error('No se pudo cambiar disponibilidad');
    } finally {
      setGuardandoDisponibilidad(false);
    }
  };

  // ============================================================
  // 🆕 REPORTAR PROBLEMA
  // ============================================================
  const abrirModalProblema = () => {
    if (!pedidoSeleccionado) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setMotivoSeleccionado(null);
    setDetalleProblema('');
    setMostrarModalProblema(true);
  };

  const enviarReporteProblema = async () => {
    if (!pedidoSeleccionado || !motivoSeleccionado || !perfil?.id) return;

    setReportandoProblema(true);
    try {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          problema_repartidor: motivoSeleccionado,
          problema_detalle: detalleProblema.trim() || null,
          reportado_en: new Date().toISOString(),
          problema_repartidor_id: perfil.id,
        })
        .eq('id', pedidoSeleccionado.id);

      if (updateError) throw updateError;

      await notificacionService.notificarAdminsProblemaPedido({
        pedidoId: pedidoSeleccionado.id,
        motivo: motivoSeleccionado as any,
        detalle: detalleProblema.trim() || undefined,
        repartidorNombre: perfil.nombre_cliente || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      setMostrarModalProblema(false);
      toast.exito('✅ Problema reportado al admin');
    } catch (e: any) {
      console.error('❌ Error reportando problema:', e);
      toast.error('No se pudo reportar el problema');
    } finally {
      setReportandoProblema(false);
    }
  };

  // ============================================================
  // 🆕 ABRIR NAVEGACIÓN
  // ============================================================
  const abrirNavegacion = async (pedido: Pedido) => {
    const lat = pedido.lat_cliente;
    const lng = pedido.lng_cliente;

    if (!lat || !lng) {
      Alert.alert(
        'Sin coordenadas',
        'Este pedido no tiene coordenadas de destino. Contactá al cliente por teléfono.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });

    const destination = `${lat},${lng}`;
    const label = encodeURIComponent(`Pedido #${pedido.id}`);

    const urls = Platform.select({
      ios: [
        `comgooglemaps://?daddr=${destination}&directionsmode=driving&q=${label}`,
        `waze://?ll=${destination}&navigate=yes`,
        `maps://?daddr=${destination}&q=${label}`,
        `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
      ],
      android: [
        `google.navigation:q=${destination}`,
        `waze://?ll=${destination}&navigate=yes`,
        `geo:${destination}?q=${destination}(${label})`,
        `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
      ],
      default: [
        `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
      ],
    }) || [];

    for (const url of urls) {
      try {
        const puedeAbrir = await Linking.canOpenURL(url);
        if (puedeAbrir) {
          await Linking.openURL(url);
          return;
        }
      } catch (error) {
        // Sigue con el siguiente
      }
    }

    Alert.alert('Error', 'No se pudo abrir ninguna app de navegación.');
  };

  // ============================================================
  // 🆕 CONTACTAR AL CLIENTE
  // ============================================================
  const llamarCliente = async (telefono: string) => {
    const numero = normalizarTelefonoAR(telefono);
    try {
      await Linking.openURL(`tel:${numero}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la llamada.');
    }
  };

  const abrirWhatsAppChat = async (telefono: string) => {
    const numero = normalizarTelefonoAR(telefono);
    try {
      const urlNativa = `whatsapp://send?phone=${numero}`;
      const puedeAbrir = await Linking.canOpenURL(urlNativa);
      if (puedeAbrir) {
        await Linking.openURL(urlNativa);
        return;
      }
    } catch (error) {
      // Sigue con el fallback
    }
    try {
      await Linking.openURL(`https://wa.me/${numero.replace('+', '')}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verificá que esté instalado.');
    }
  };

  const abrirWhatsAppLlamada = async (telefono: string) => {
    const numero = normalizarTelefonoAR(telefono);
    try {
      const urlLlamada = `whatsapp://call?phone=${numero}`;
      const puedeAbrir = await Linking.canOpenURL(urlLlamada);
      if (puedeAbrir) {
        await Linking.openURL(urlLlamada);
        return;
      }
    } catch (error) {
      // Sigue con el fallback
    }
    Alert.alert(
      'Llamada por WhatsApp',
      'Tu versión de WhatsApp no soporta iniciar llamadas desde un link. ¿Querés abrir el chat para llamar desde ahí?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir chat', onPress: () => abrirWhatsAppChat(telefono) },
      ]
    );
  };

  const contactarCliente = () => {
    const telefono = pedidoSeleccionado?.telefono;
    if (!telefono) {
      Alert.alert('Sin teléfono', 'Este pedido no tiene teléfono registrado.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setMostrarModalContacto(true);
  };

  const handleContactoOpcion = (tipo: 'llamar' | 'whatsappMensaje' | 'whatsappLlamada') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setMostrarModalContacto(false);

    setTimeout(() => {
      const telefono = pedidoSeleccionado?.telefono;
      if (!telefono) return;

      if (tipo === 'llamar') llamarCliente(telefono);
      else if (tipo === 'whatsappMensaje') abrirWhatsAppChat(telefono);
      else abrirWhatsAppLlamada(telefono);
    }, 220);
  };

  // ============================================================
  // TRANSMISIÓN
  // ============================================================
  const iniciarTransmision = async (pedido: Pedido, reanudar = false) => {
    if (procesandoEntrega || watchRef.current) return;
    if (!perfil?.id) {
      Alert.alert('Sesión requerida', 'Volvé a iniciar sesión para comenzar la entrega.');
      return;
    }
    if (pedido.estado === 'en_camino' && pedido.repartidor_id && pedido.repartidor_id !== perfil.id) {
      Alert.alert('Entrega asignada', 'Este pedido ya está asignado a otro repartidor.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setProcesandoEntrega(true);
    let seguimientoNuevo = false;
    let pedidoYaActualizado = false;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Ubicación necesaria',
          'Para iniciar el seguimiento, habilitá el permiso de ubicación mientras usás la app. El pedido no cambiará de estado hasta poder obtener tu ubicación.'
        );
        return;
      }

      const permisoSegundoPlano = await Location.getBackgroundPermissionsAsync();
      if (permisoSegundoPlano.status !== 'granted') {
        setPedidoPendienteTransmision(pedido);
        setMostrarModalUbicacion(true);
        return;
      }

      const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = ubicacion.coords;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        throw new Error('El dispositivo devolvió coordenadas inválidas.');
      }

      let actualizarPedido;
      if (reanudar) {
        actualizarPedido = supabase
          .from('pedidos')
          .update({
            lat_repartidor: latitude,
            repartidor_de_lng: longitude,
          })
          .eq('id', pedido.id)
          .eq('estado', 'en_camino')
          .eq('repartidor_id', perfil.id);
      } else {
        actualizarPedido = supabase
          .from('pedidos')
          .update({
            estado: 'en_camino',
            repartidor_id: perfil.id,
            encabezado_repartidor: perfil.nombre_cliente || 'Repartidor Krusty',
            telefono_repartidor: perfil.telefono || null,
            lat_repartidor: latitude,
            repartidor_de_lng: longitude,
          })
          .eq('id', pedido.id)
          .eq('estado', 'listo');

        if (pedido.repartidor_id && pedido.repartidor_id !== perfil.id) {
          throw new Error('Este pedido está asignado a otro repartidor.');
        }
      }

      seguimientoNuevo = await iniciarSeguimientoUbicacionEnSegundoPlano({
        pedidoId: pedido.id,
        repartidorId: perfil.id,
        clienteId: pedido.id_de_usuario,
        latCliente: pedido.lat_cliente,
        lngCliente: pedido.lng_cliente,
        tipoEntrega: pedido.tipo_entrega,
      });

      const { data: pedidoActualizado, error } = await actualizarPedido.select('id').maybeSingle();

      if (error) throw error;
      if (!pedidoActualizado) {
        const { data: pedidoActual } = await supabase
          .from('pedidos')
          .select('estado, repartidor_id')
          .eq('id', pedido.id)
          .maybeSingle();

        if (!pedidoActual) {
          throw new Error('El pedido ya no existe. Puede haber sido eliminado.');
        }
        if (pedidoActual.estado === 'entregado') {
          throw new Error('Este pedido ya fue entregado.');
        }
        if (pedidoActual.estado === 'cancelado') {
          throw new Error('Este pedido fue cancelado.');
        }
        if (pedidoActual.repartidor_id && pedidoActual.repartidor_id !== perfil.id) {
          throw new Error('Otro repartidor tomó este pedido.');
        }
        throw new Error('El estado del pedido cambió. Actualizá la lista e intentá nuevamente.');
      }
      pedidoYaActualizado = true;

      const pedidoEnCamino: Pedido = {
        ...pedido,
        estado: 'en_camino',
        repartidor_id: perfil.id,
        encabezado_repartidor: perfil.nombre_cliente || 'Repartidor Krusty',
        telefono_repartidor: perfil.telefono || null,
        lat_repartidor: latitude,
        repartidor_de_lng: longitude,
      };
      setPedidoSeleccionado(pedidoEnCamino);
      setUbicacionActual({ lat: latitude, lng: longitude });
      setTransmitiendo(true);
      mapaCentradoRef.current = null;
      setPedidosActivos((actuales) =>
        actuales.map((actual) => (actual.id === pedido.id ? pedidoEnCamino : actual))
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      toast.exito('🛵 Transmitiendo ubicación');

      if (!reanudar && pedido.id_de_usuario) {
        notificacionService
          .notificarClienteCambioEstado(pedido.id_de_usuario, pedido.id, 'en_camino')
          .catch((error) =>
            console.warn('⚠️ No se pudo notificar la salida del pedido:', error)
          );
      }

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            console.warn('⚠️ Se ignoró una actualización GPS con coordenadas inválidas.');
            return;
          }
          setUbicacionActual({ lat: latitude, lng: longitude });
        }
      );
    } catch (error) {
      console.error('❌ No se pudo iniciar o reanudar el seguimiento:', error);
      if (seguimientoNuevo && !pedidoYaActualizado) {
        try {
          await detenerSeguimientoUbicacionEnSegundoPlano(pedido.id);
        } catch (errorAlLimpiar) {
          console.error(
            'No se pudo limpiar la tarea de ubicación tras fallar el inicio:',
            errorAlLimpiar
          );
        }
      }
      if (pedidoYaActualizado) {
        Alert.alert(
          'Entrega activa',
          'El seguimiento en segundo plano quedó iniciado, pero no se pudo actualizar el mapa en esta pantalla. Podés reanudar la vista desde el pedido.'
        );
        return;
      }
      Alert.alert(
        'No se pudo iniciar el seguimiento',
        error instanceof Error
          ? error.message
          : 'Verificá la ubicación y tu conexión e intentá nuevamente.'
      );
      if (!watchRef.current) {
        setTransmitiendo(false);
        setPedidoSeleccionado(null);
      }
    } finally {
      setProcesandoEntrega(false);
    }
  };

  const confirmarUbicacionBackground = async () => {
    if (!pedidoPendienteTransmision) return;

    setMostrarModalUbicacion(false);
    const pedido = pedidoPendienteTransmision;
    setPedidoPendienteTransmision(null);

    try {
      const permisoSolicitado = await Location.requestBackgroundPermissionsAsync();

      if (permisoSolicitado.status !== 'granted') {
        toast.advertencia('⚠️ Sin ubicación no se puede rastrear');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      toast.exito('✅ Ubicación activada');

      await iniciarTransmision(pedido);
    } catch (error) {
      console.error('❌ Error solicitando permiso de segundo plano:', error);
      toast.error('No se pudo solicitar el permiso');
    }
  };

  const cancelarUbicacionBackground = () => {
    setMostrarModalUbicacion(false);
    setPedidoPendienteTransmision(null);
  };

  const confirmarEntrega = (pedido: Pedido) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    Alert.alert(
      'Confirmar entrega',
      `¿Confirmás que el pedido #${pedido.id} ya fue entregado al cliente?`,
      [
        { text: 'Todavía no', style: 'cancel' },
        {
          text: 'Sí, entregado',
          onPress: async () => {
            if (procesandoEntrega) return;
            setProcesandoEntrega(true);
            try {
              const { data, error } = await supabase
                .from('pedidos')
                .update({ estado: 'entregado' })
                .eq('id', pedido.id)
                .eq('estado', 'en_camino')
                .select('id')
                .maybeSingle();

              if (error) throw error;
              if (!data) throw new Error('El pedido ya no está en camino. Actualizá la lista.');

              watchRef.current?.remove();
              watchRef.current = null;
              let errorAlDetenerSeguimiento: unknown = null;
              try {
                await detenerSeguimientoUbicacionEnSegundoPlano(pedido.id);
              } catch (error) {
                errorAlDetenerSeguimiento = error;
                console.error('No se pudo detener el seguimiento en segundo plano:', error);
              }
              setTransmitiendo(false);
              setPedidoSeleccionado(null);
              rutaCargadaRef.current = null;
              mapaCentradoRef.current = null;
              if (pedido.id_de_usuario) {
                notificacionService
                  .notificarClienteCambioEstado(pedido.id_de_usuario, pedido.id, 'entregado')
                  .catch((error) =>
                    console.warn('⚠️ No se pudo notificar la entrega:', error)
                  );
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
              mostrarExito(`✅ Pedido #${pedido.id} marcado como entregado`);
              if (errorAlDetenerSeguimiento) {
                Alert.alert(
                  'Entrega confirmada',
                  'El pedido se cerró correctamente, pero no se pudo detener el servicio de ubicación. Abrí la app y volvé a intentar para detenerlo.'
                );
              }
              await cargarPedidos();
            } catch (error) {
              console.error('❌ No se pudo confirmar la entrega:', error);
              Alert.alert(
                'No se pudo confirmar',
                error instanceof Error ? error.message : 'Revisá tu conexión e intentá nuevamente.'
              );
            } finally {
              setProcesandoEntrega(false);
            }
          },
        },
      ]
    );
  };

  const detenerTransmision = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTransmitiendo(false);
    setPedidoSeleccionado(null);
    rutaCargadaRef.current = null;
    mapaCentradoRef.current = null;
    toast.info('⏸️ GPS pausado');
  };

  const confirmarCerrarSesion = async () => {
    setMostrarModalCerrar(false);
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  const estadoColor = (estado: string) => COLORES_ESTADO[estado] || colores.textTertiary;

  const coordenadasPolyline = useMemo(() => {
    if (rutaPuntos.length > 1) return rutaPuntos;
    if (pedidoSeleccionado) {
      return [
        { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
        {
          latitude: pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
          longitude: pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude,
        },
      ];
    }
    return [
      { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
      { latitude: UBICACION_KRUSTY.latitude, longitude: UBICACION_KRUSTY.longitude },
    ];
  }, [rutaPuntos, pedidoSeleccionado, ubicacionActual]);

  const puntosValidos = useMemo(
    () => validarCoordenadas(coordenadasPolyline),
    [coordenadasPolyline]
  );

  const liveDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liveDotScale.value }],
  }));

  // ============================================================
  // RENDER PEDIDO
  // ============================================================
  const renderPedido = useCallback(
    ({ item, index }: { item: Pedido; index: number }) => {
      const color = estadoColor(item.estado);
      const inicial = (item.cliente_nombre || 'C').trim().charAt(0).toUpperCase();
      const tieneCoordenadas = !!(item.lat_cliente && item.lng_cliente);

      return (
        <Animated2.View entering={FadeInDown.delay(index * 40).springify()}>
          <TouchableRipple
            onPress={() => seleccionarPedido(item)}
            borderless
            rippleColor={colores.accent + '15'}
            style={[
              estilos.tarjeta,
              {
                padding: tarjetaPadding,
                borderLeftColor: color,
              },
              pedidoSeleccionado?.id === item.id && estilos.tarjetaSeleccionada,
            ]}
          >
            <View>
              <View style={estilos.tarjetaHeader}>
                <View
                  style={[
                    estilos.avatarCliente,
                    {
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                      backgroundColor: color + '15',
                      borderColor: color + '40',
                    },
                  ]}
                >
                  <Text
                    style={[estilos.avatarClienteTexto, { fontSize: avatarSize * 0.42, color }]}
                    allowFontScaling={false}
                  >
                    {inicial}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[estilos.pedidoId, { fontSize: pedidoIdSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    Pedido #{item.id}
                  </Text>
                  <Text
                    style={[estilos.clienteNombre, { fontSize: clienteNombreSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {item.cliente_nombre || 'Cliente'}
                  </Text>
                </View>

                <View
                  style={[
                    estilos.estadoBadge,
                    {
                      backgroundColor: color + '15',
                      borderColor: color + '40',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.estado === 'listo'
                        ? 'cube-outline'
                        : item.estado === 'en_camino'
                          ? 'bicycle-outline'
                          : 'checkmark-circle-outline'
                    }
                    size={14}
                    color={color}
                  />
                </View>
              </View>

              <View style={estilos.infoEnvioContainer}>
                <View style={estilos.infoEnvioItem}>
                  <View
                    style={[
                      estilos.infoEnvioIconWrap,
                      { backgroundColor: colores.accent + '15' },
                    ]}
                  >
                    <Ionicons name="navigate" size={12} color={colores.accent} />
                  </View>
                  <Text style={estilos.infoEnvioTexto} allowFontScaling={false}>
                    {item.distancia_km !== undefined && item.distancia_km !== null
                      ? `${item.distancia_km.toFixed(1)} km`
                      : '---'}
                  </Text>
                </View>

                <View style={estilos.infoEnvioItem}>
                  <View
                    style={[
                      estilos.infoEnvioIconWrap,
                      { backgroundColor: colores.warning + '15' },
                    ]}
                  >
                    <Ionicons name="time" size={12} color={colores.warning} />
                  </View>
                  <Text style={estilos.infoEnvioTexto} allowFontScaling={false}>
                    {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null
                      ? `${item.tiempo_estimado} min`
                      : '---'}
                  </Text>
                </View>

                <View style={estilos.infoEnvioItem}>
                  <View
                    style={[
                      estilos.infoEnvioIconWrap,
                      {
                        backgroundColor:
                          (item.costo_envio && item.costo_envio > 0
                            ? colores.success
                            : colores.textTertiary) + '15',
                      },
                    ]}
                  >
                    <Ionicons
                      name="cash"
                      size={12}
                      color={
                        item.costo_envio && item.costo_envio > 0
                          ? colores.success
                          : colores.textTertiary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      estilos.infoEnvioTexto,
                      {
                        color:
                          item.costo_envio && item.costo_envio > 0
                            ? colores.success
                            : colores.textSecondary,
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    {item.costo_envio && item.costo_envio > 0
                      ? formatearPrecio(item.costo_envio)
                      : 'Gratis'}
                  </Text>
                </View>

                <View style={estilos.infoEnvioItem}>
                  <View
                    style={[
                      estilos.infoEnvioIconWrap,
                      { backgroundColor: colores.info + '15' },
                    ]}
                  >
                    <Ionicons
                      name={item.tipo_entrega === 'retiro' ? 'storefront' : 'home'}
                      size={12}
                      color={colores.info}
                    />
                  </View>
                  <Text style={estilos.infoEnvioTexto} allowFontScaling={false}>
                    {item.tipo_entrega === 'retiro' ? 'Retiro' : 'Envío'}
                  </Text>
                </View>
              </View>

              <View style={estilos.tarjetaInfo}>
                <View style={estilos.infoLinea}>
                  <Ionicons name="location-outline" size={13} color={colores.textSecondary} />
                  <Text
                    style={[estilos.tarjetaDireccion, { fontSize: clienteNombreSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {item.direccion || 'Retiro en local'}
                  </Text>
                </View>
                <View style={estilos.infoLinea}>
                  <Ionicons name="call-outline" size={13} color={colores.textSecondary} />
                  <Text
                    style={[estilos.tarjetaTelefono, { fontSize: clienteNombreSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {item.telefono || 'Sin teléfono'}
                  </Text>
                </View>
                <View style={estilos.tarjetaTotalRow}>
                  <Ionicons name="cash-outline" size={14} color={colores.accent} />
                  <Text
                    style={[estilos.tarjetaTotal, { fontSize: pedidoIdSize + 2 }]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(item.total || 0)}
                  </Text>
                </View>
              </View>

              {/* 🆕 BOTÓN NAVEGAR */}
              {tieneCoordenadas && (
                <TouchableOpacity
                  style={[estilos.botonNavegar, { backgroundColor: colores.info }]}
                  onPress={() => abrirNavegacion(item)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="navigate-circle" size={18} color="#FFF" />
                  <Text style={estilos.botonNavegarTexto} allowFontScaling={false}>
                    Navegar al destino
                  </Text>
                </TouchableOpacity>
              )}

              {item.estado === 'listo' && !transmitiendo && (
                <TouchableOpacity
                  style={estilos.botonIniciar}
                  onPress={() => iniciarTransmision(item)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colores.accentSecondary, colores.amarilloOscuro]}
                    style={estilos.botonIniciarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={estilos.botonIconWrap}>
                      <Ionicons name="play-circle" size={18} color={colores.text} />
                    </View>
                    <Text style={[estilos.botonIniciarTexto, { fontSize: botonTextSize }]}>
                      Iniciar Entrega
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {item.estado === 'en_camino' &&
                !transmitiendo &&
                (!item.repartidor_id || item.repartidor_id === perfil?.id) && (
                  <TouchableOpacity
                    style={estilos.botonIniciar}
                    onPress={() => iniciarTransmision(item, true)}
                    activeOpacity={0.85}
                    disabled={procesandoEntrega}
                  >
                    <LinearGradient
                      colors={[colores.accentSecondary, colores.amarilloOscuro]}
                      style={estilos.botonIniciarGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={estilos.botonIconWrap}>
                        <Ionicons name="refresh-circle" size={18} color={colores.text} />
                      </View>
                      <Text style={[estilos.botonIniciarTexto, { fontSize: botonTextSize }]}>
                        {procesandoEntrega ? 'Reanudando...' : 'Reanudar seguimiento'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

              {item.estado === 'en_camino' && (
                <View style={[estilos.enCaminoBadge, { backgroundColor: colores.naranja + '12' }]}>
                  <Ionicons name="bicycle" size={14} color={colores.naranja} />
                  <Text style={[estilos.enCaminoTexto, { color: colores.naranja }]} allowFontScaling={false}>
                    En camino
                  </Text>
                </View>
              )}
            </View>
          </TouchableRipple>
        </Animated2.View>
      );
    },
    [
      tarjetaPadding,
      pedidoIdSize,
      clienteNombreSize,
      botonTextSize,
      avatarSize,
      transmitiendo,
      procesandoEntrega,
      perfil?.id,
      pedidoSeleccionado?.id,
      colores,
      estilos,
    ]
  );

  // ============================================================
  // HEADER DEL FLATLIST
  // ============================================================
  const renderHeader = () => (
    <>
      <View style={[estilos.stats, { marginHorizontal: paddingHorizontal }]}>
        <View style={estilos.statItem}>
          <View style={[estilos.statIconWrap, { backgroundColor: colores.naranja + '15' }]}>
            <Ionicons name="cube-outline" size={18} color={colores.naranja} />
          </View>
          <Text style={[estilos.statValor, { fontSize: statValorSize }]} allowFontScaling={false}>
            {pedidosActivos.length}
          </Text>
          <Text style={[estilos.statLabel, { fontSize: statLabelSize }]} allowFontScaling={false}>
            Pendientes
          </Text>
        </View>

        <View style={[estilos.statDivider, { backgroundColor: colores.border }]} />

        <View style={estilos.statItem}>
          <View style={[estilos.statIconWrap, { backgroundColor: colores.success + '15' }]}>
            <Ionicons name="checkmark-done-outline" size={18} color={colores.success} />
          </View>
          <Text style={[estilos.statValor, { fontSize: statValorSize }]} allowFontScaling={false}>
            {pedidosEntregados.length}
          </Text>
          <Text style={[estilos.statLabel, { fontSize: statLabelSize }]} allowFontScaling={false}>
            Entregados
          </Text>
        </View>

        <View style={[estilos.statDivider, { backgroundColor: colores.border }]} />

        <View style={estilos.statItem}>
          <View style={[estilos.statIconWrap, { backgroundColor: colores.accent + '15' }]}>
            <Ionicons name="cash-outline" size={18} color={colores.accent} />
          </View>
          <Text
            style={[estilos.statValor, { fontSize: statValorSize, color: colores.accent }]}
            allowFontScaling={false}
          >
            {formatearPrecio(pedidosEntregados.reduce((s, p) => s + (p.total || 0), 0))}
          </Text>
          <Text style={[estilos.statLabel, { fontSize: statLabelSize }]} allowFontScaling={false}>
            Total
          </Text>
        </View>
      </View>

      <View style={[estilos.pestanas, { paddingHorizontal: paddingHorizontal }]}>
        <TouchableOpacity
          style={[
            estilos.pestana,
            { backgroundColor: colores.surface, borderColor: colores.border },
            pestana === 'activos' && [
              estilos.pestanaActiva,
              { backgroundColor: colores.accentSecondary, borderColor: colores.accentSecondary },
            ],
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => { });
            setPestana('activos');
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="rocket-outline"
            size={16}
            color={pestana === 'activos' ? colores.text : colores.textSecondary}
          />
          <Text
            style={[
              estilos.pestanaTexto,
              { fontSize: pestanaTextSize, color: colores.textSecondary },
              pestana === 'activos' && { color: colores.text, fontWeight: '700' },
            ]}
            allowFontScaling={false}
          >
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            estilos.pestana,
            { backgroundColor: colores.surface, borderColor: colores.border },
            pestana === 'historial' && [
              estilos.pestanaActiva,
              { backgroundColor: colores.accentSecondary, borderColor: colores.accentSecondary },
            ],
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => { });
            setPestana('historial');
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={pestana === 'historial' ? colores.text : colores.textSecondary}
          />
          <Text
            style={[
              estilos.pestanaTexto,
              { fontSize: pestanaTextSize, color: colores.textSecondary },
              pestana === 'historial' && { color: colores.text, fontWeight: '700' },
            ]}
            allowFontScaling={false}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {pedidoSeleccionado && (
        <Animated.View
          style={[
            estilos.mapaContenedor,
            {
              marginHorizontal: paddingHorizontal,
              backgroundColor: colores.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={[estilos.mapFrame, { height: mapaHeight }]}>
            <MapView
              ref={mapRef}
              style={estilos.mapa}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: UBICACION_KRUSTY.latitude,
                longitude: UBICACION_KRUSTY.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={transmitiendo}
              showsMyLocationButton={false}
              onPanDrag={() => {
                usuarioInteractuandoMapaRef.current = true;
              }}
              onMapReady={() => {
                if (pedidoSeleccionado) {
                  setTimeout(() => centrarMapaEnRutaYRepartidor(), 300);
                }
              }}
            >
              <Marker coordinate={UBICACION_KRUSTY}>
                <Image
                  source={marcadorLocal}
                  style={{ width: marcadorLocalSize, height: marcadorLocalSize }}
                  resizeMode="contain"
                />
              </Marker>

              {pedidoSeleccionado && (
                <Marker
                  coordinate={{
                    latitude: pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                    longitude: pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude,
                  }}
                >
                  <Image
                    source={marcadorCasa}
                    style={{ width: marcadorCasaSize, height: marcadorCasaSize }}
                    resizeMode="contain"
                  />
                </Marker>
              )}

              {puntosValidos && rutaPuntos.length > 1 && (
                <>
                  <Polyline
                    coordinates={rutaPuntos}
                    strokeColor="rgba(0,0,0,0.15)"
                    strokeWidth={9}
                    lineCap="round"
                    lineJoin="round"
                  />
                  <Polyline
                    coordinates={rutaPuntos}
                    strokeColor={colores.accent}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              )}
            </MapView>

            <TouchableOpacity
              style={[estilos.botonCentrarMapa, { backgroundColor: colores.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                usuarioInteractuandoMapaRef.current = false;
                centrarMapaEnRutaYRepartidor();
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="locate" size={20} color={colores.text} />
            </TouchableOpacity>
          </View>

          <View style={estilos.mapaInfo}>
            <View style={estilos.mapaInfoItem}>
              <View
                style={[estilos.mapaInfoIconWrap, { backgroundColor: colores.accent + '12' }]}
              >
                <Ionicons name="navigate" size={14} color={colores.accent} />
              </View>
              <Text style={[estilos.mapaInfoTexto, { color: colores.text }]} allowFontScaling={false}>
                {cargandoRuta
                  ? 'Cargando...'
                  : distanciaReal ||
                  (pedidoSeleccionado &&
                    calcularDistancia(
                      UBICACION_KRUSTY.latitude,
                      UBICACION_KRUSTY.longitude,
                      pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                      pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
                    ).toFixed(1) + ' km')}
              </Text>
            </View>

            <View style={estilos.mapaInfoItem}>
              <View
                style={[estilos.mapaInfoIconWrap, { backgroundColor: colores.warning + '15' }]}
              >
                <Ionicons name="time" size={14} color={colores.warning} />
              </View>
              <Text style={[estilos.mapaInfoTexto, { color: colores.text }]} allowFontScaling={false}>
                {cargandoRuta
                  ? 'Cargando...'
                  : tiempoReal ||
                  (pedidoSeleccionado &&
                    Math.ceil(
                      calcularDistancia(
                        UBICACION_KRUSTY.latitude,
                        UBICACION_KRUSTY.longitude,
                        pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                        pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
                      ) * 15
                    ) + ' min')}
              </Text>
            </View>
          </View>

          {transmitiendo && (
            <TouchableOpacity
              style={estilos.botonDetenerMapa}
              onPress={detenerTransmision}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colores.danger, '#B71C1C']}
                style={estilos.botonDetenerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="stop-circle" size={16} color="#FFF" />
                <Text style={estilos.botonDetenerMapaTexto} allowFontScaling={false}>
                  Pausar GPS
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {transmitiendo && pedidoSeleccionado && (
        <Animated2.View
          entering={FadeIn.duration(400)}
          style={[
            estilos.tarjetaTransmision,
            {
              marginHorizontal: paddingHorizontal,
              padding: tarjetaPadding,
              backgroundColor: colores.surface,
              borderColor: colores.success + '40',
            },
          ]}
        >
          <LinearGradient
            colors={[colores.success + '10', colores.accentSecondary + '05']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={estilos.transmisionHeader}>
            <View style={estilos.puntoVivoWrap}>
              <Animated2.View style={[estilos.puntoVivo, { backgroundColor: colores.success }, liveDotStyle]} />
            </View>
            <Text style={[estilos.transmitiendoTexto, { color: colores.success }]} allowFontScaling={false}>
              Transmitiendo en vivo
            </Text>
          </View>

          <View style={estilos.transmisionInfo}>
            <Text style={[estilos.pedidoTransmision, { color: colores.text }]} allowFontScaling={false}>
              Pedido #{pedidoSeleccionado.id} · {pedidoSeleccionado.cliente_nombre}
            </Text>
            <View style={estilos.transmisionDirRow}>
              <Ionicons name="location-outline" size={13} color={colores.textSecondary} />
              <Text
                style={[estilos.direccionTransmision, { color: colores.text }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {pedidoSeleccionado.direccion || 'Sin dirección'}
              </Text>
            </View>
          </View>

          <View style={[estilos.gpsInfo, { backgroundColor: colores.surfaceHover }]}>
            <Ionicons name="navigate-circle-outline" size={14} color={colores.accent} />
            <Text style={[estilos.gpsTexto, { color: colores.accent }]} allowFontScaling={false}>
              {ubicacionActual.lat.toFixed(6)}, {ubicacionActual.lng.toFixed(6)}
            </Text>
          </View>

          {/* 🆕 BOTONES DE ACCIÓN: REPORTAR + CONTACTAR + CONFIRMAR */}
          <View style={estilos.accionesRow}>
            <TouchableOpacity
              style={[
                estilos.botonReportar,
                { borderColor: colores.warning, backgroundColor: colores.warning + '12' },
              ]}
              onPress={abrirModalProblema}
              activeOpacity={0.85}
            >
              <Ionicons name="warning" size={18} color={colores.warning} />
              <Text style={[estilos.botonReportarTexto, { color: colores.warning }]} allowFontScaling={false}>
                Reportar
              </Text>
            </TouchableOpacity>

            {!!pedidoSeleccionado.telefono && (
              <TouchableOpacity
                style={estilos.botonContactar}
                onPress={contactarCliente}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colores.info, '#1976D2']}
                  style={estilos.botonContactarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="call" size={18} color="#FFF" />
                  <Text style={estilos.botonContactarTexto} allowFontScaling={false}>
                    Contactar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={estilos.botonConfirmarEntrega}
            onPress={() => confirmarEntrega(pedidoSeleccionado)}
            activeOpacity={0.85}
            disabled={procesandoEntrega}
          >
            <LinearGradient
              colors={[colores.success, colores.verdeOscuro]}
              style={estilos.botonIniciarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={[estilos.botonIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              </View>
              <Text style={[estilos.botonIniciarTexto, { color: '#FFF', fontSize: botonTextSize }]}>
                {procesandoEntrega ? 'Procesando...' : 'Confirmar entrega'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated2.View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (cargando) {
      return (
        <View style={estilos.cargandoWrap}>
          <View style={[estilos.skeletonCard, { backgroundColor: colores.surfaceHover }]} />
          <View style={[estilos.skeletonCard, { backgroundColor: colores.surfaceHover }]} />
          <View style={[estilos.skeletonCard, { backgroundColor: colores.surfaceHover }]} />
        </View>
      );
    }

    return (
      <Animated2.View entering={FadeIn.duration(500)} style={estilos.vacio}>
        <View style={[estilos.vacioIconWrap, { backgroundColor: colores.accent + '10', borderColor: colores.accent + '20' }]}>
          <Ionicons
            name={pestana === 'activos' ? 'bicycle-outline' : 'checkmark-done-outline'}
            size={56}
            color={colores.accent}
          />
        </View>
        <Text style={[estilos.vacioTexto, { color: colores.text }]} allowFontScaling={false}>
          {pestana === 'activos' ? 'No hay pedidos activos' : 'No hay entregas aún'}
        </Text>
        <Text style={[estilos.vacioSubtexto, { color: colores.textSecondary }]} allowFontScaling={false}>
          {pestana === 'activos'
            ? 'Los pedidos listos van a aparecer acá'
            : 'Tus entregas completadas van a aparecer acá'}
        </Text>
        <TouchableOpacity style={estilos.vacioCTA} onPress={manejarRefresh} activeOpacity={0.85}>
          <LinearGradient
            colors={[colores.accent, colores.accentSecondary]}
            style={estilos.vacioCTAGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={estilos.vacioCTATexto} allowFontScaling={false}>
              Refrescar
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated2.View>
    );
  };

  const pedidosMostrados = pestana === 'activos' ? pedidosActivos : pedidosEntregados;

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
      <LinearGradient
        colors={[colores.fondo, colores.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <LinearGradient
        colors={[colores.accent, colores.accentSecondary]}
        style={[
          estilos.headerGradient,
          {
            height: insets.top + 100,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          estilos.encabezado,
          {
            paddingTop: insets.top + 12,
            paddingHorizontal: paddingHorizontal,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <View style={estilos.headerTitleBlock}>
          <Text style={[estilos.titulo, { fontSize: tituloSize, color: '#FFF' }]} numberOfLines={1}>
            Reparto
          </Text>
          <Text
            style={[
              estilos.subtitulo,
              { fontSize: subtituloSize, color: 'rgba(255,255,255,0.85)' },
            ]}
            numberOfLines={1}
          >
            {perfil?.nombre_cliente || 'Repartidor'}
          </Text>

          {/* 🆕 SWITCH DE DISPONIBILIDAD */}
          <View style={estilos.disponibilidadRow}>
            <View
              style={[
                estilos.disponibilidadDot,
                { backgroundColor: disponible ? '#4CAF50' : '#FFA726' },
              ]}
            />
            <Text style={estilos.disponibilidadTexto} allowFontScaling={false}>
              {disponible ? 'Disponible' : 'Pausado'}
            </Text>
            <Switch
              value={disponible}
              onValueChange={toggleDisponibilidad}
              disabled={guardandoDisponibilidad}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(76,175,80,0.6)' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMostrarModalCerrar(true)}
          style={estilos.botonCerrarSesion}
          activeOpacity={0.85}
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {!disponible && (
        <View
          style={[
            estilos.bannerPausado,
            {
              marginHorizontal: paddingHorizontal,
              backgroundColor: colores.warning + '20',
              borderColor: colores.warning + '40',
            },
          ]}
        >
          <Ionicons name="pause-circle" size={18} color={colores.warning} />
          <Text style={[estilos.bannerPausadoTexto, { color: colores.text }]} allowFontScaling={false}>
            Estás pausado. No vas a recibir pedidos nuevos.
          </Text>
        </View>
      )}

      <FlatList
        data={pedidosMostrados}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          estilos.scrollContent,
          { paddingBottom: insets.bottom + 80, paddingTop: 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={colores.accent}
            colors={[colores.accent]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={6}
        windowSize={5}
      />

      {/* MODAL DIVULGACIÓN UBICACIÓN */}
      <Modal
        visible={mostrarModalUbicacion}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={cancelarUbicacionBackground}
      >
        <View style={estilos.modalFondo}>
          <View style={[estilos.modalUbicacionContainer, { backgroundColor: colores.surface }]}>
            <LinearGradient
              colors={[colores.accent, colores.accentSecondary]}
              style={estilos.modalUbicacionHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={estilos.modalUbicacionIconContainer}>
                <Ionicons name="location" size={22} color="#FFF" />
              </View>
              <Text style={estilos.modalUbicacionTitulo} allowFontScaling={false}>
                Ubicación durante la entrega
              </Text>
            </LinearGradient>

            <View style={estilos.modalUbicacionBody}>
              <Text style={[estilos.modalUbicacionPregunta, { color: colores.text }]} allowFontScaling={false}>
                📍 ¿Por qué necesitamos tu ubicación?
              </Text>

              <Text style={[estilos.modalUbicacionExplicacion, { color: colores.textSecondary }]} allowFontScaling={false}>
                Para que{' '}
                <Text style={[estilos.modalUbicacionDestacado, { color: colores.accent }]}>
                  el cliente vea el recorrido de su pedido en tiempo real
                </Text>{' '}
                mientras vos hacés la entrega.
              </Text>

              <View style={[estilos.modalUbicacionLista, { backgroundColor: colores.surfaceHover }]}>
                <View style={estilos.modalUbicacionItem}>
                  <View
                    style={[
                      estilos.modalUbicacionIcono,
                      { backgroundColor: colores.success + '15' },
                    ]}
                  >
                    <Ionicons name="time-outline" size={16} color={colores.success} />
                  </View>
                  <Text style={[estilos.modalUbicacionItemTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
                    Solo durante la{' '}
                    <Text style={[estilos.modalUbicacionItemDestacado, { color: colores.text }]}>entrega activa</Text>
                  </Text>
                </View>

                <View style={estilos.modalUbicacionItem}>
                  <View
                    style={[
                      estilos.modalUbicacionIcono,
                      { backgroundColor: colores.success + '15' },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={16} color={colores.success} />
                  </View>
                  <Text style={[estilos.modalUbicacionItemTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
                    Solo la ve el{' '}
                    <Text style={[estilos.modalUbicacionItemDestacado, { color: colores.text }]}>cliente del pedido</Text>
                  </Text>
                </View>

                <View style={estilos.modalUbicacionItem}>
                  <View
                    style={[
                      estilos.modalUbicacionIcono,
                      { backgroundColor: colores.success + '15' },
                    ]}
                  >
                    <Ionicons name="stop-circle-outline" size={16} color={colores.success} />
                  </View>
                  <Text style={[estilos.modalUbicacionItemTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
                    Se <Text style={[estilos.modalUbicacionItemDestacado, { color: colores.text }]}>detiene al confirmar</Text>{' '}
                    la entrega
                  </Text>
                </View>
              </View>

              <Text style={[estilos.modalUbicacionAviso, { color: colores.textTertiary }]} allowFontScaling={false}>
                Vas a ver un aviso del sistema para elegir{' '}
                <Text style={[estilos.modalUbicacionDestacado, { color: colores.accent }]}>"Permitir todo el tiempo"</Text>. Es lo
                que permite que siga funcionando con la pantalla bloqueada.
              </Text>
            </View>

            <View style={estilos.modalUbicacionBotones}>
              <TouchableOpacity
                style={[
                  estilos.modalUbicacionBotonCancelar,
                  { backgroundColor: colores.surfaceHover, borderColor: colores.border },
                ]}
                onPress={cancelarUbicacionBackground}
                activeOpacity={0.85}
              >
                <Text style={[estilos.modalUbicacionBotonCancelarTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
                  Ahora no
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.modalUbicacionBotonContinuar}
                onPress={confirmarUbicacionBackground}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colores.accent, colores.accentSecondary]}
                  style={estilos.modalUbicacionBotonContinuarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="location" size={18} color="#FFF" />
                  <Text style={estilos.modalUbicacionBotonContinuarTexto} allowFontScaling={false}>
                    Continuar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONTACTO CLIENTE */}
      <Modal
        visible={mostrarModalContacto}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMostrarModalContacto(false)}
      >
        <View style={estilos.sheetRoot}>
          <TouchableOpacity
            style={estilos.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setMostrarModalContacto(false)}
          />

          <View
            style={[
              estilos.sheetContainer,
              {
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: insets.bottom + 20,
                backgroundColor: colores.surface,
              },
            ]}
          >
            <View style={estilos.sheetHandleWrap}>
              <View style={[estilos.sheetHandle, { backgroundColor: colores.textTertiary }]} />
            </View>

            <View style={[estilos.sheetHeader, { paddingHorizontal: 20 }]}>
              <View style={[estilos.sheetHeaderIconWrap, { backgroundColor: colores.accent }]}>
                <Ionicons name="call" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.sheetTitle, { color: colores.text }]} allowFontScaling={false}>
                  Contactar a {pedidoSeleccionado?.cliente_nombre || 'cliente'}
                </Text>
                <Text style={[estilos.sheetSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                  {pedidoSeleccionado?.telefono || ''}
                </Text>
              </View>
            </View>

            <View style={[estilos.sheetDivider, { backgroundColor: colores.border, marginHorizontal: 20 }]} />

            <View style={{ paddingHorizontal: 20 }}>
              <TouchableRipple
                onPress={() => handleContactoOpcion('llamar')}
                borderless
                rippleColor="rgba(229,57,53,0.15)"
                style={[
                  estilos.sheetOption,
                  {
                    borderColor: '#E53935' + '25',
                    backgroundColor: '#E53935' + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      { backgroundColor: '#E53935' + '18' },
                    ]}
                  >
                    <Ionicons name="call" size={22} color="#E53935" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[estilos.sheetOptionTitle, { color: '#E53935' }]}
                      allowFontScaling={false}
                    >
                      Llamar al cliente
                    </Text>
                    <Text style={[estilos.sheetOptionSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                      Llamada normal al celular
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#E5393580" />
                </View>
              </TouchableRipple>

              <TouchableRipple
                onPress={() => handleContactoOpcion('whatsappMensaje')}
                borderless
                rippleColor="rgba(37,211,102,0.15)"
                style={[
                  estilos.sheetOption,
                  {
                    borderColor: '#25D366' + '30',
                    backgroundColor: '#25D366' + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      { backgroundColor: '#25D366' + '18' },
                    ]}
                  >
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[estilos.sheetOptionTitle, { color: '#25D366' }]}
                      allowFontScaling={false}
                    >
                      Enviar WhatsApp
                    </Text>
                    <Text style={[estilos.sheetOptionSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                      Mandar mensaje de texto
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#25D36680" />
                </View>
              </TouchableRipple>

              <TouchableRipple
                onPress={() => handleContactoOpcion('whatsappLlamada')}
                borderless
                rippleColor="rgba(18,140,126,0.15)"
                style={[
                  estilos.sheetOption,
                  {
                    borderColor: '#128C7E' + '30',
                    backgroundColor: '#128C7E' + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      { backgroundColor: '#128C7E' + '18' },
                    ]}
                  >
                    <Ionicons name="call" size={22} color="#128C7E" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[estilos.sheetOptionTitle, { color: '#128C7E' }]}
                      allowFontScaling={false}
                    >
                      Llamada por WhatsApp
                    </Text>
                    <Text style={[estilos.sheetOptionSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                      Llamada de voz vía WhatsApp
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#128C7E80" />
                </View>
              </TouchableRipple>

              <TouchableRipple
                onPress={() => {
                  Haptics.selectionAsync().catch(() => { });
                  setMostrarModalContacto(false);
                }}
                borderless
                rippleColor="rgba(0,0,0,0.08)"
                style={[
                  estilos.sheetCancel,
                  { backgroundColor: colores.surfaceHover, borderColor: colores.border },
                ]}
              >
                <View style={estilos.sheetCancelInner}>
                  <Text style={[estilos.sheetCancelText, { color: colores.textSecondary }]} allowFontScaling={false}>
                    Cancelar
                  </Text>
                </View>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🆕 MODAL REPORTAR PROBLEMA */}
      <Modal
        visible={mostrarModalProblema}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMostrarModalProblema(false)}
      >
        <View style={estilos.sheetRoot}>
          <TouchableOpacity
            style={estilos.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setMostrarModalProblema(false)}
          />
          <View
            style={[
              estilos.sheetContainer,
              {
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: insets.bottom + 20,
                backgroundColor: colores.surface,
              },
            ]}
          >
            <View style={estilos.sheetHandleWrap}>
              <View style={[estilos.sheetHandle, { backgroundColor: colores.textTertiary }]} />
            </View>

            <View style={[estilos.sheetHeader, { paddingHorizontal: 20 }]}>
              <View style={[estilos.sheetHeaderIconWrap, { backgroundColor: colores.warning }]}>
                <Ionicons name="warning" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.sheetTitle, { color: colores.text }]} allowFontScaling={false}>
                  Reportar problema
                </Text>
                <Text style={[estilos.sheetSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
                  Pedido #{pedidoSeleccionado?.id}
                </Text>
              </View>
            </View>

            <View style={[estilos.sheetDivider, { backgroundColor: colores.border, marginHorizontal: 20 }]} />

            <View style={{ paddingHorizontal: 20 }}>
              {MOTIVOS_PROBLEMA.map((motivo) => {
                const seleccionado = motivoSeleccionado === motivo.id;
                return (
                  <TouchableRipple
                    key={motivo.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => { });
                      setMotivoSeleccionado(motivo.id);
                    }}
                    borderless
                    style={[
                      estilos.sheetOption,
                      {
                        borderColor: seleccionado ? motivo.color : colores.border,
                        backgroundColor: seleccionado ? motivo.color + '15' : colores.surfaceHover,
                      },
                    ]}
                  >
                    <View style={estilos.sheetOptionInner}>
                      <View
                        style={[
                          estilos.sheetOptionIcon,
                          { backgroundColor: motivo.color + '18' },
                        ]}
                      >
                        <Ionicons name={motivo.icono as any} size={22} color={motivo.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[estilos.sheetOptionTitle, { color: colores.text }]} allowFontScaling={false}>
                          {motivo.label}
                        </Text>
                      </View>
                      {seleccionado && (
                        <Ionicons name="checkmark-circle" size={22} color={motivo.color} />
                      )}
                    </View>
                  </TouchableRipple>
                );
              })}

              {motivoSeleccionado && (
                <TextInput
                  style={[
                    estilos.problemaDetalleInput,
                    {
                      backgroundColor: colores.fondo,
                      color: colores.text,
                      borderColor: colores.border,
                    },
                  ]}
                  value={detalleProblema}
                  onChangeText={setDetalleProblema}
                  placeholder="Detalle opcional..."
                  placeholderTextColor={colores.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  allowFontScaling={false}
                />
              )}

              <TouchableOpacity
                style={[
                  estilos.problemaEnviarBtn,
                  {
                    backgroundColor: motivoSeleccionado ? colores.warning : colores.grisClaro,
                    opacity: reportandoProblema ? 0.6 : 1,
                  },
                ]}
                onPress={enviarReporteProblema}
                disabled={!motivoSeleccionado || reportandoProblema}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={18} color="#FFF" />
                <Text style={estilos.problemaEnviarTexto} allowFontScaling={false}>
                  {reportandoProblema ? 'Enviando...' : 'Enviar reporte al admin'}
                </Text>
              </TouchableOpacity>

              <TouchableRipple
                onPress={() => setMostrarModalProblema(false)}
                borderless
                style={[
                  estilos.sheetCancel,
                  { backgroundColor: colores.surfaceHover, borderColor: colores.border },
                ]}
              >
                <View style={estilos.sheetCancelInner}>
                  <Text style={[estilos.sheetCancelText, { color: colores.textSecondary }]} allowFontScaling={false}>
                    Cancelar
                  </Text>
                </View>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CERRAR SESIÓN */}
      <Modal
        visible={mostrarModalCerrar}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={estilos.modalFondo}>
          <View style={[estilos.modal, { backgroundColor: colores.surface }]}>
            <View
              style={[estilos.modalIconoWrap, { backgroundColor: colores.danger + '15' }]}
            >
              <Ionicons name="log-out-outline" size={32} color={colores.danger} />
            </View>
            <Text style={[estilos.modalTitulo, { color: colores.text }]} allowFontScaling={false}>
              Cerrar sesión
            </Text>
            <Text style={[estilos.modalTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
              ¿Estás seguro que querés salir?
            </Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[
                  estilos.modalBoton,
                  estilos.modalCancelar,
                  { backgroundColor: colores.surfaceHover, borderColor: colores.border },
                ]}
                onPress={() => setMostrarModalCerrar(false)}
                activeOpacity={0.85}
              >
                <Text style={[estilos.modalCancelarTexto, { color: colores.text }]} allowFontScaling={false}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colores.danger, '#B71C1C']}
                  style={estilos.modalConfirmarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={16} color="#FFF" />
                  <Text style={estilos.modalConfirmarTexto} allowFontScaling={false}>
                    Salir
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ÉXITO */}
      <Modal
        visible={mostrarModalExito}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={estilos.modalFondo}>
          <View
            style={[
              estilos.modal,
              estilos.modalExito,
              {
                backgroundColor: colores.surface,
                borderColor: colores.success + '30',
              },
            ]}
          >
            <View
              style={[estilos.modalIconoWrap, { backgroundColor: colores.success + '15' }]}
            >
              <Ionicons name="checkmark-circle" size={36} color={colores.success} />
            </View>
            <Text
              style={[estilos.modalTitulo, { color: colores.success }]}
              allowFontScaling={false}
            >
              ¡Listo!
            </Text>
            <Text style={[estilos.modalTexto, { color: colores.textSecondary }]} allowFontScaling={false}>
              {mensajeExito}
            </Text>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        ocultar={toast.ocultar}
      />
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    scrollContent: { flexGrow: 1 },

    headerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    encabezado: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: 20,
    },
    headerTitleBlock: {
      flex: 1,
      minWidth: 0,
    },
    titulo: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    subtitulo: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      includeFontPadding: false,
    },

    // 🆕 Switch de disponibilidad
    disponibilidadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    disponibilidadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    disponibilidadTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      includeFontPadding: false,
    },

    // 🆕 Banner pausado
    bannerPausado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderWidth: 1,
    },
    bannerPausadoTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      flex: 1,
      includeFontPadding: false,
    },

    botonCerrarSesion: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },

    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: colores.surface,
      borderRadius: Sizes.radius.lg,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: colores.border,
    },
    statItem: { alignItems: 'center', flex: 1, gap: 4 },
    statIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    statDivider: {
      width: 1,
      height: 40,
    },
    statValor: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: colores.text,
      includeFontPadding: false,
    },
    statLabel: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      includeFontPadding: false,
    },

    pestanas: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    pestana: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    pestanaActiva: {
      shadowColor: colores.accentSecondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    pestanaTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '600',
      includeFontPadding: false,
    },

    mapaContenedor: {
      borderRadius: Sizes.radius.lg,
      padding: 10,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
      borderWidth: 1,
      borderColor: colores.border,
    },
    mapFrame: {
      width: '100%',
      borderRadius: Sizes.radius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    mapa: {
      width: '100%',
      height: '100%',
    },
    botonCentrarMapa: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colores.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    mapaInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    mapaInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mapaInfoIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapaInfoTexto: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      fontWeight: '700',
      includeFontPadding: false,
    },
    botonDetenerMapa: {
      marginTop: 12,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    botonDetenerGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    botonDetenerMapaTexto: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFF',
      includeFontPadding: false,
    },

    tarjetaTransmision: {
      borderRadius: Sizes.radius.lg,
      borderWidth: 1,
      marginBottom: 12,
      shadowColor: colores.success,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
      overflow: 'hidden',
    },
    transmisionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    puntoVivoWrap: {
      width: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    puntoVivo: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    transmitiendoTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '700',
      includeFontPadding: false,
    },
    transmisionInfo: {
      marginBottom: 8,
    },
    pedidoTransmision: {
      fontFamily: FUENTES.display,
      fontSize: 13,
      fontWeight: '600',
      includeFontPadding: false,
    },
    transmisionDirRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    direccionTransmision: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      flex: 1,
      includeFontPadding: false,
    },
    gpsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    gpsTexto: {
      fontFamily: FUENTES.mono,
      fontSize: 11,
      includeFontPadding: false,
    },

    accionesRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'stretch',
      marginBottom: 10,
    },
    botonReportar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      flex: 1,
    },
    botonReportarTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      fontSize: 13,
      includeFontPadding: false,
    },
    botonContactar: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.info,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    botonContactarGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    botonContactarTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: '#FFF',
      fontSize: 13,
      includeFontPadding: false,
    },
    botonConfirmarEntrega: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },

    botonNavegar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: colores.info,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    botonNavegarTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: '#FFF',
      fontSize: 13,
      includeFontPadding: false,
    },

    tarjeta: {
      backgroundColor: colores.surface,
      borderRadius: Sizes.radius.lg,
      borderLeftWidth: 4,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: colores.border,
      overflow: 'hidden',
      marginHorizontal: 18,
    },
    tarjetaSeleccionada: {
      borderColor: colores.accent,
      borderWidth: 2,
      backgroundColor: colores.accent + '05',
      shadowColor: colores.accent,
      shadowOpacity: 0.15,
    },
    tarjetaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarCliente: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    avatarClienteTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      includeFontPadding: false,
    },
    pedidoId: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: colores.text,
      includeFontPadding: false,
    },
    clienteNombre: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      marginTop: 2,
      includeFontPadding: false,
    },
    estadoBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    infoEnvioContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colores.surfaceHover,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 12,
      gap: 4,
    },
    infoEnvioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoEnvioIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoEnvioTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      color: colores.textSecondary,
      fontWeight: '600',
      includeFontPadding: false,
    },
    tarjetaInfo: {
      gap: 6,
      marginBottom: 12,
    },
    infoLinea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tarjetaDireccion: {
      fontFamily: FUENTES.regular,
      color: colores.text,
      flex: 1,
      includeFontPadding: false,
    },
    tarjetaTelefono: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      flex: 1,
      includeFontPadding: false,
    },
    tarjetaTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    tarjetaTotal: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: colores.accent,
      includeFontPadding: false,
    },
    botonIniciar: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.accentSecondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    botonIniciarGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    botonIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
    botonIniciarTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      color: colores.text,
      includeFontPadding: false,
    },
    enCaminoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      alignSelf: 'center',
    },
    enCaminoTexto: {
      fontFamily: FUENTES.display,
      fontSize: 12,
      fontWeight: '700',
      includeFontPadding: false,
    },

    vacio: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    vacioIconWrap: {
      width: 130,
      height: 130,
      borderRadius: 65,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 2,
    },
    vacioTexto: {
      fontFamily: FUENTES.display,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      includeFontPadding: false,
    },
    vacioSubtexto: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 6,
      includeFontPadding: false,
      maxWidth: 280,
    },
    vacioCTA: {
      marginTop: 24,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
    vacioCTAGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    vacioCTATexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
      includeFontPadding: false,
    },

    cargandoWrap: {
      paddingHorizontal: 18,
      paddingTop: 12,
      gap: 12,
    },
    skeletonCard: {
      height: 180,
      borderRadius: Sizes.radius.lg,
      marginBottom: 12,
    },

    modalFondo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      borderRadius: Sizes.radius.xl,
      padding: 28,
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 40,
      elevation: 20,
    },
    modalExito: {
      borderWidth: 2,
    },
    modalIconoWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    modalTitulo: {
      fontFamily: FUENTES.display,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
      includeFontPadding: false,
    },
    modalTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
      includeFontPadding: false,
    },
    modalBotones: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    modalBoton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelar: {
      borderWidth: 1,
    },
    modalCancelarTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '600',
      includeFontPadding: false,
    },
    modalConfirmar: {
      overflow: 'hidden',
      shadowColor: colores.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    modalConfirmarGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      width: '100%',
    },
    modalConfirmarTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
      includeFontPadding: false,
    },

    // MODAL UBICACIÓN
    modalUbicacionContainer: {
      borderRadius: Sizes.radius.xl,
      width: '100%',
      maxWidth: 440,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 40,
      elevation: 20,
    },
    modalUbicacionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 18,
      paddingHorizontal: 20,
    },
    modalUbicacionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalUbicacionTitulo: {
      flex: 1,
      fontFamily: FUENTES.display,
      fontSize: 17,
      fontWeight: '700',
      color: '#FFF',
      includeFontPadding: false,
    },
    modalUbicacionBody: {
      padding: 20,
      gap: 14,
    },
    modalUbicacionPregunta: {
      fontFamily: FUENTES.display,
      fontSize: 15,
      fontWeight: '700',
      includeFontPadding: false,
    },
    modalUbicacionExplicacion: {
      fontFamily: FUENTES.regular,
      fontSize: 14,
      lineHeight: 20,
      includeFontPadding: false,
    },
    modalUbicacionDestacado: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
    },
    modalUbicacionLista: {
      gap: 12,
      borderRadius: 12,
      padding: 14,
    },
    modalUbicacionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalUbicacionIcono: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalUbicacionItemTexto: {
      flex: 1,
      fontFamily: FUENTES.regular,
      fontSize: 13,
      lineHeight: 18,
      includeFontPadding: false,
    },
    modalUbicacionItemDestacado: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
    },
    modalUbicacionAviso: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      lineHeight: 17,
      fontStyle: 'italic',
      includeFontPadding: false,
    },
    modalUbicacionBotones: {
      flexDirection: 'row',
      gap: 10,
      padding: 20,
      paddingTop: 0,
    },
    modalUbicacionBotonCancelar: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    modalUbicacionBotonCancelarTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '600',
      includeFontPadding: false,
    },
    modalUbicacionBotonContinuar: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    modalUbicacionBotonContinuarGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      width: '100%',
    },
    modalUbicacionBotonContinuarTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
      includeFontPadding: false,
    },

    // SHEET CONTACTO / REPORTAR
    sheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheetBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sheetContainer: {
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 20,
    },
    sheetHandleWrap: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    sheetHeaderIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    sheetTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      fontSize: 16,
      includeFontPadding: false,
    },
    sheetSubtitle: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      fontSize: 13,
      includeFontPadding: false,
    },
    sheetDivider: {
      height: 1,
      marginVertical: 16,
    },
    sheetOption: {
      borderWidth: 1.5,
      overflow: 'hidden',
      borderRadius: 14,
      marginBottom: 10,
      height: 64,
    },
    sheetOptionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      flex: 1,
    },
    sheetOptionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetOptionTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
      fontSize: 15,
      includeFontPadding: false,
    },
    sheetOptionSubtitle: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      fontSize: 12,
      includeFontPadding: false,
    },
    sheetCancel: {
      borderWidth: 1,
      overflow: 'hidden',
      borderRadius: 12,
      height: 52,
      marginBottom: 8,
    },
    sheetCancelInner: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    sheetCancelText: {
      fontFamily: FUENTES.display,
      fontWeight: '600',
      fontSize: 15,
      includeFontPadding: false,
    },

    // Reportar problema
    problemaDetalleInput: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: FUENTES.regular,
      fontSize: 13,
      minHeight: 70,
      textAlignVertical: 'top',
      marginTop: 4,
      marginBottom: 10,
    },
    problemaEnviarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 6,
      marginBottom: 10,
    },
    problemaEnviarTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      fontSize: 14,
      color: '#FFF',
      includeFontPadding: false,
    },
  });