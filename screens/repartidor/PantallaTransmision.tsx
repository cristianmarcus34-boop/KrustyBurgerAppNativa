// screens/repartidor/PantallaTransmision.tsx - CON MARCADOR DE LOCAL CON LOGO Y CASA
import React, { useEffect, useState, useRef } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  RefreshControl,
  Animated,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Pedido } from '../../lib/tipos';
import { DISENO, useResponsive } from '../../lib/colores';
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

// ✅ MARCADORES CON IMÁGENES
const marcadorLocal = require('../../assets/icon.png');
const marcadorCasa = require('../../assets/iconos/casa.png');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = { latitude: -34.776484410467525, longitude: -58.29220250409459 };

// ✅ COLORES DE ESTADO (se mantienen porque son semánticos)
const COLORES_ESTADO: Record<string, string> = {
  listo: DISENO.colors.success,
  en_camino: DISENO.colors.naranja,
  entregado: DISENO.colors.success,
};

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

export default function PantallaTransmision(props: any) {
  const { perfil, cerrarSesion } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

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

  // ✅ Estados del modal de divulgación
  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false);
  const [pedidoPendienteTransmision, setPedidoPendienteTransmision] = useState<Pedido | null>(null);

  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ✅ Tamaños responsive (con el sistema de la app)
  const paddingHorizontal = responsive.getEspaciado('LG');
  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 18 });
  const subtituloSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });
  const statValorSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });
  const statLabelSize = responsive.getValor({ tablet: 11, normal: 10, small: 9 });
  const pestanaTextSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });
  const mapaHeight = responsive.getValor({ tablet: 260, normal: 200, small: 170 });
  const pedidoIdSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });
  const clienteNombreSize = responsive.getValor({ tablet: 13, normal: 12, small: 10 });
  const botonTextSize = responsive.getValor({ tablet: 15, normal: 14, small: 12 });
  const tarjetaPadding = responsive.getValor({ tablet: 16, normal: 14, small: 10 });
  const marcadorLocalSize = responsive.getValor({ tablet: 88, normal: 76, small: 64 });
  const marcadorCasaSize = responsive.getValor({ tablet: 48, normal: 40, small: 34 });

  const obtenerCoordenadasPolyline = () => {
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
  };

  const coordenadasPolyline = obtenerCoordenadasPolyline();
  const puntosValidos = validarCoordenadas(coordenadasPolyline);

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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || !watchRef.current) return;

      watchRef.current.remove();
      watchRef.current = null;
      setTransmitiendo(false);
      setPedidoSeleccionado(null);
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [transmitiendo]);

  useEffect(() => {
    if (transmitiendo && pedidoSeleccionado) {
      const cargarRuta = async () => {
        const origenLat = pedidoSeleccionado.lat_repartidor ?? UBICACION_KRUSTY.latitude;
        const origenLng = pedidoSeleccionado.repartidor_de_lng ?? UBICACION_KRUSTY.longitude;
        const destinoLat = pedidoSeleccionado.lat_cliente ?? UBICACION_KRUSTY.latitude;
        const destinoLng = pedidoSeleccionado.lng_cliente ?? UBICACION_KRUSTY.longitude;

        try {
          const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);
          if (ruta && ruta.points.length > 1) {
            setRutaPuntos(ruta.points);
            setDistanciaReal(ruta.distance);
            setTiempoReal(ruta.duration);
            await guardarRutaPedido(pedidoSeleccionado.id, ruta.points, ruta.distance, ruta.duration);
            return;
          }
        } catch (error) {
          console.warn('⚠️ No se pudo calcular la ruta:', error);
        }

        setRutaPuntos([
          { latitude: origenLat, longitude: origenLng },
          { latitude: destinoLat, longitude: destinoLng },
        ]);
        setDistanciaReal('');
        setTiempoReal('');
      };
      cargarRuta();
    }
  }, [transmitiendo, pedidoSeleccionado]);

  const previsualizarRuta = async (pedido: Pedido) => {
    setCargandoRuta(true);
    try {
      const origenLat = UBICACION_KRUSTY.latitude;
      const origenLng = UBICACION_KRUSTY.longitude;
      const destinoLat = pedido.lat_cliente || UBICACION_KRUSTY.latitude;
      const destinoLng = pedido.lng_cliente || UBICACION_KRUSTY.longitude;

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
  };

  const seleccionarPedido = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    if (!transmitiendo) {
      previsualizarRuta(pedido);
    }
  };

  useEffect(() => {
    if (transmitiendo && ubicacionActual && mapRef.current) {
      if (rutaPuntos.length > 1) {
        const lats = rutaPuntos.map((p) => p.latitude);
        const lngs = rutaPuntos.map((p) => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const latDelta = (maxLat - minLat) * 1.5 + 0.005;
        const lngDelta = (maxLng - minLng) * 1.5 + 0.005;

        mapRef.current.animateToRegion(
          {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(latDelta, 0.02),
            longitudeDelta: Math.max(lngDelta, 0.02),
          },
          1000
        );
      } else {
        mapRef.current.animateToRegion(
          {
            latitude: ubicacionActual.lat,
            longitude: ubicacionActual.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          1000
        );
      }
    }
  }, [ubicacionActual, transmitiendo, rutaPuntos]);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const { data: activos, error: errorActivos } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['listo', 'en_camino'])
        .order('creado_en', { ascending: false });

      if (errorActivos) throw errorActivos;
      setPedidosActivos(activos as Pedido[] || []);

      const { data: entregados, error: errorEntregados } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'entregado')
        .order('creado_en', { ascending: false })
        .limit(20);

      if (errorEntregados) throw errorEntregados;
      setPedidosEntregados(entregados as Pedido[] || []);
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const manejarRefresh = async () => {
    setRefrescando(true);
    await cargarPedidos();
  };

  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const mostrarExito = (mensaje: string) => {
    setMensajeExito(mensaje);
    setMostrarModalExito(true);
    setTimeout(() => {
      setMostrarModalExito(false);
    }, 2500);
  };

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
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
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
        lat_repartidor: latitude,
        repartidor_de_lng: longitude,
      };
      setPedidoSeleccionado(pedidoEnCamino);
      setUbicacionActual({ lat: latitude, lng: longitude });
      setTransmitiendo(true);
      setPedidosActivos((actuales) => actuales.map((actual) =>
        actual.id === pedido.id ? pedidoEnCamino : actual
      ));

      toast.exito('🛵 Transmitiendo ubicación');

      if (!reanudar && pedido.id_de_usuario) {
        notificacionService.notificarClienteCambioEstado(
          pedido.id_de_usuario,
          pedido.id,
          'en_camino'
        ).catch((error) => console.warn('⚠️ No se pudo notificar la salida del pedido:', error));
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
          console.error('No se pudo limpiar la tarea de ubicación tras fallar el inicio:', errorAlLimpiar);
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
        error instanceof Error ? error.message : 'Verificá la ubicación y tu conexión e intentá nuevamente.'
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
              if (pedido.id_de_usuario) {
                notificacionService.notificarClienteCambioEstado(
                  pedido.id_de_usuario,
                  pedido.id,
                  'entregado'
                ).catch((error) => console.warn('⚠️ No se pudo notificar la entrega:', error));
              }
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
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTransmitiendo(false);
    setPedidoSeleccionado(null);
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

  const estadoColor = (estado: string) => COLORES_ESTADO[estado] || DISENO.colors.textTertiary;

  const renderPedido = ({ item }: { item: Pedido }) => (
    <TouchableOpacity
      style={[
        estilos.tarjeta,
        {
          borderLeftColor: estadoColor(item.estado),
          padding: tarjetaPadding,
        },
        pedidoSeleccionado?.id === item.id && {
          borderColor: DISENO.colors.accent,
          borderWidth: 2,
          backgroundColor: DISENO.colors.accent + '05',
        },
      ]}
      onPress={() => seleccionarPedido(item)}
      activeOpacity={0.8}
    >
      <View style={estilos.tarjetaHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[estilos.pedidoId, { fontSize: pedidoIdSize }]} numberOfLines={1}>
            Pedido #{item.id}
          </Text>
          <Text style={[estilos.clienteNombre, { fontSize: clienteNombreSize }]} numberOfLines={1}>
            {item.cliente_nombre || 'Cliente'}
          </Text>
        </View>
        <View
          style={[
            estilos.estadoBadge,
            {
              backgroundColor: estadoColor(item.estado) + '20',
              borderColor: estadoColor(item.estado) + '40',
            },
          ]}
        >
          <Text style={[estilos.estadoTexto, { color: estadoColor(item.estado) }]}>
            {item.estado === 'listo' ? '📦' : item.estado === 'en_camino' ? '🚲' : '✅'}
          </Text>
        </View>
      </View>

      <View style={estilos.infoEnvioContainer}>
        {item.distancia_km !== undefined && item.distancia_km !== null ? (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="navigate" size={12} color={DISENO.colors.accent} />
            <Text style={estilos.infoEnvioTexto}>
              {item.distancia_km.toFixed(1)} km
            </Text>
          </View>
        ) : (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="navigate" size={12} color={DISENO.colors.textTertiary} />
            <Text style={[estilos.infoEnvioTexto, { opacity: 0.5 }]}>---</Text>
          </View>
        )}

        {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null ? (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="time" size={12} color={DISENO.colors.accent} />
            <Text style={estilos.infoEnvioTexto}>
              {item.tiempo_estimado} min
            </Text>
          </View>
        ) : (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="time" size={12} color={DISENO.colors.textTertiary} />
            <Text style={[estilos.infoEnvioTexto, { opacity: 0.5 }]}>---</Text>
          </View>
        )}

        <View style={estilos.infoEnvioItem}>
          <Ionicons name="cash" size={12} color={item.costo_envio && item.costo_envio > 0 ? DISENO.colors.success : DISENO.colors.textTertiary} />
          <Text style={[estilos.infoEnvioTexto, { color: item.costo_envio && item.costo_envio > 0 ? DISENO.colors.success : DISENO.colors.textSecondary }]}>
            {item.costo_envio && item.costo_envio > 0 ? formatearPrecio(item.costo_envio) : 'Gratis'}
          </Text>
        </View>

        <View style={estilos.infoEnvioItem}>
          <Ionicons
            name={item.tipo_entrega === 'retiro' ? 'storefront' : 'home'}
            size={12}
            color={DISENO.colors.textTertiary}
          />
          <Text style={estilos.infoEnvioTexto}>
            {item.tipo_entrega === 'retiro' ? 'Retiro' : 'Domicilio'}
          </Text>
        </View>
      </View>

      <View style={estilos.tarjetaInfo}>
        <Text style={[estilos.tarjetaDireccion, { fontSize: clienteNombreSize }]} numberOfLines={1}>
          📍 {item.direccion || 'Retiro en local'}
        </Text>
        <Text style={[estilos.tarjetaTelefono, { fontSize: clienteNombreSize }]} numberOfLines={1}>
          📱 {item.telefono || 'Sin teléfono'}
        </Text>
        <Text style={[estilos.tarjetaTotal, { fontSize: pedidoIdSize + 2 }]}>
          💰 {formatearPrecio(item.total || 0)}
        </Text>
      </View>

      {item.estado === 'listo' && !transmitiendo && (
        <TouchableOpacity
          style={estilos.botonIniciar}
          onPress={() => iniciarTransmision(item)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[DISENO.colors.accentSecondary, DISENO.colors.amarilloOscuro]}
            style={estilos.botonIniciarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="play-circle" size={18} color={DISENO.colors.text} />
            <Text style={[estilos.botonIniciarTexto, { fontSize: botonTextSize }]}>
              Iniciar Entrega
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {item.estado === 'en_camino' && !transmitiendo && (!item.repartidor_id || item.repartidor_id === perfil?.id) && (
        <TouchableOpacity
          style={estilos.botonIniciar}
          onPress={() => iniciarTransmision(item, true)}
          activeOpacity={0.7}
          disabled={procesandoEntrega}
        >
          <LinearGradient
            colors={[DISENO.colors.accentSecondary, DISENO.colors.amarilloOscuro]}
            style={estilos.botonIniciarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="refresh-circle" size={18} color={DISENO.colors.text} />
            <Text style={[estilos.botonIniciarTexto, { fontSize: botonTextSize }]}>
              {procesandoEntrega ? 'Reanudando...' : 'Reanudar seguimiento'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {item.estado === 'en_camino' && (
        <View style={estilos.enCaminoBadge}>
          <Ionicons name="bicycle" size={14} color={DISENO.colors.naranja} />
          <Text style={estilos.enCaminoTexto}>En camino 🚲</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={estilos.scrollView}
        contentContainerStyle={[estilos.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={DISENO.colors.accent}
            colors={[DISENO.colors.accent]}
          />
        }
      >
        {/* HEADER */}
        <View style={[estilos.encabezado, { paddingTop: insets.top + 12, paddingHorizontal: paddingHorizontal }]}>
          <View style={{ flex: 1 }}>
            <Text style={[estilos.titulo, { fontSize: tituloSize }]} numberOfLines={1}>
              🚲 Reparto
            </Text>
            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]} numberOfLines={1}>
              {perfil?.nombre_cliente || 'Repartidor'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMostrarModalCerrar(true)}
            style={estilos.botonCerrarSesion}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={DISENO.colors.danger} />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={[estilos.stats, { marginHorizontal: paddingHorizontal }]}>
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
              {pedidosActivos.length}
            </Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Pend.</Text>
          </View>
          <View style={estilos.statDivider} />
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
              {pedidosEntregados.length}
            </Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Ent.</Text>
          </View>
          <View style={estilos.statDivider} />
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize, color: DISENO.colors.accent }]}>
              {formatearPrecio(pedidosEntregados.reduce((s, p) => s + (p.total || 0), 0))}
            </Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Total</Text>
          </View>
        </View>

        {/* PESTAÑAS */}
        <View style={[estilos.pestanas, { paddingHorizontal: paddingHorizontal }]}>
          <TouchableOpacity
            style={[
              estilos.pestana,
              pestana === 'activos' && estilos.pestanaActiva,
            ]}
            onPress={() => setPestana('activos')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                estilos.pestanaTexto,
                { fontSize: pestanaTextSize },
                pestana === 'activos' && estilos.pestanaTextoActiva,
              ]}
            >
              🚀 Activos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              estilos.pestana,
              pestana === 'historial' && estilos.pestanaActiva,
            ]}
            onPress={() => setPestana('historial')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                estilos.pestanaTexto,
                { fontSize: pestanaTextSize },
                pestana === 'historial' && estilos.pestanaTextoActiva,
              ]}
            >
              📋 Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* MAPA */}
        {pedidoSeleccionado && (
          <Animated.View
            style={[
              estilos.mapaContenedor,
              {
                marginHorizontal: paddingHorizontal,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <MapView
              ref={mapRef}
              style={[estilos.mapa, { height: mapaHeight }]}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: UBICACION_KRUSTY.latitude,
                longitude: UBICACION_KRUSTY.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={transmitiendo}
              showsMyLocationButton={transmitiendo}
            >
              {/* ✅ MARCADOR DEL LOCAL CON LOGO */}
              <Marker coordinate={UBICACION_KRUSTY}>
                <Image
                  source={marcadorLocal}
                  style={{ width: marcadorLocalSize, height: marcadorLocalSize }}
                  resizeMode="contain"
                />
              </Marker>

              {/* ✅ MARCADOR DEL DESTINO CON CASA */}
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
                  <Polyline coordinates={rutaPuntos} strokeColor="rgba(0,0,0,0.15)" strokeWidth={9} lineCap="round" lineJoin="round" />
                  <Polyline coordinates={rutaPuntos} strokeColor={DISENO.colors.accent} strokeWidth={4} lineCap="round" lineJoin="round" />
                </>
              )}
            </MapView>

            <View style={estilos.mapaInfo}>
              <View style={estilos.mapaInfoItem}>
                <Ionicons name="navigate" size={14} color={DISENO.colors.accent} />
                <Text style={estilos.mapaInfoTexto}>
                  {cargandoRuta ? 'Cargando...' : distanciaReal || (pedidoSeleccionado && calcularDistancia(UBICACION_KRUSTY.latitude, UBICACION_KRUSTY.longitude, pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude, pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude).toFixed(1) + ' km')}
                </Text>
              </View>
              <View style={estilos.mapaInfoItem}>
                <Ionicons name="time" size={14} color={DISENO.colors.accent} />
                <Text style={estilos.mapaInfoTexto}>
                  {cargandoRuta ? 'Cargando...' : tiempoReal || (pedidoSeleccionado && Math.ceil(calcularDistancia(UBICACION_KRUSTY.latitude, UBICACION_KRUSTY.longitude, pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude, pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude) * 15) + ' min')}
                </Text>
              </View>
            </View>

            {transmitiendo && (
              <TouchableOpacity style={estilos.botonDetenerMapa} onPress={detenerTransmision} activeOpacity={0.7}>
                <LinearGradient colors={[DISENO.colors.danger, '#B71C1C']} style={estilos.botonDetenerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="stop-circle" size={16} color="#FFF" />
                  <Text style={estilos.botonDetenerMapaTexto}>Pausar GPS</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* TARJETA TRANSMISIÓN ACTIVA */}
        {transmitiendo && pedidoSeleccionado && (
          <Animated.View
            style={[
              estilos.tarjetaTransmision,
              {
                marginHorizontal: paddingHorizontal,
                padding: tarjetaPadding,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={estilos.transmisionHeader}>
              <View style={estilos.puntoVivo} />
              <Text style={estilos.transmitiendoTexto}>Transmitiendo</Text>
            </View>
            <Text style={estilos.pedidoTransmision}>Pedido #{pedidoSeleccionado.id}</Text>
            <Text style={estilos.clienteTransmision}>{pedidoSeleccionado.cliente_nombre}</Text>
            <Text style={estilos.direccionTransmision} numberOfLines={1}>
              📍 {pedidoSeleccionado.direccion || 'Sin dirección'}
            </Text>
            <View style={estilos.gpsInfo}>
              <Text style={estilos.gpsTexto}>
                GPS: {ubicacionActual.lat.toFixed(6)}, {ubicacionActual.lng.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.botonConfirmarEntrega}
              onPress={() => confirmarEntrega(pedidoSeleccionado)}
              activeOpacity={0.8}
              disabled={procesandoEntrega}
            >
              <LinearGradient colors={[DISENO.colors.success, DISENO.colors.verdeOscuro]} style={estilos.botonIniciarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={[estilos.botonIniciarTexto, { color: '#FFF', fontSize: botonTextSize }]}>
                  {procesandoEntrega ? 'Procesando...' : 'Confirmar entrega'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* LISTA */}
        <View style={[estilos.listaContainer, { paddingHorizontal: paddingHorizontal }]}>
          {pedidosActivos.length === 0 && pedidosEntregados.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons
                name={pestana === 'activos' ? 'bicycle-outline' : 'checkmark-done-outline'}
                size={56}
                color={DISENO.colors.textTertiary}
              />
              <Text style={estilos.vacioTexto}>
                {pestana === 'activos' ? 'No hay pedidos' : 'No hay entregas'}
              </Text>
              <Text style={estilos.vacioSubtexto}>
                {pestana === 'activos'
                  ? 'Los pedidos listos aparecerán acá'
                  : 'Tus entregas completadas aparecerán acá'}
              </Text>
            </View>
          ) : (
            (pestana === 'activos' ? pedidosActivos : pedidosEntregados).map((item) => (
              <View key={item.id}>{renderPedido({ item })}</View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DIVULGACIÓN UBICACIÓN */}
      <Modal
        visible={mostrarModalUbicacion}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={cancelarUbicacionBackground}
      >
        <View style={estilos.modalFondo}>
          <View style={estilos.modalUbicacionContainer}>
            <LinearGradient
              colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
              style={estilos.modalUbicacionHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={estilos.modalUbicacionIconContainer}>
                <Ionicons name="location" size={22} color="#FFF" />
              </View>
              <Text style={estilos.modalUbicacionTitulo}>
                Ubicación durante la entrega
              </Text>
            </LinearGradient>

            <View style={estilos.modalUbicacionBody}>
              <Text style={estilos.modalUbicacionPregunta}>
                📍 ¿Por qué necesitamos tu ubicación?
              </Text>

              <Text style={estilos.modalUbicacionExplicacion}>
                Para que <Text style={estilos.modalUbicacionDestacado}>el cliente vea el recorrido de su pedido en tiempo real</Text> mientras vos hacés la entrega.
              </Text>

              <View style={estilos.modalUbicacionLista}>
                <View style={estilos.modalUbicacionItem}>
                  <Ionicons name="time-outline" size={18} color={DISENO.colors.success} />
                  <Text style={estilos.modalUbicacionItemTexto}>
                    Solo durante la <Text style={estilos.modalUbicacionItemDestacado}>entrega activa</Text>
                  </Text>
                </View>

                <View style={estilos.modalUbicacionItem}>
                  <Ionicons name="eye-outline" size={18} color={DISENO.colors.success} />
                  <Text style={estilos.modalUbicacionItemTexto}>
                    Solo la ve el <Text style={estilos.modalUbicacionItemDestacado}>cliente del pedido</Text>
                  </Text>
                </View>

                <View style={estilos.modalUbicacionItem}>
                  <Ionicons name="stop-circle-outline" size={18} color={DISENO.colors.success} />
                  <Text style={estilos.modalUbicacionItemTexto}>
                    Se <Text style={estilos.modalUbicacionItemDestacado}>detiene al confirmar</Text> la entrega
                  </Text>
                </View>
              </View>

              <Text style={estilos.modalUbicacionAviso}>
                Vas a ver un aviso del sistema para elegir <Text style={estilos.modalUbicacionDestacado}>"Permitir todo el tiempo"</Text>. Es lo que permite que siga funcionando con la pantalla bloqueada.
              </Text>
            </View>

            <View style={estilos.modalUbicacionBotones}>
              <TouchableOpacity
                style={estilos.modalUbicacionBotonCancelar}
                onPress={cancelarUbicacionBackground}
                activeOpacity={0.7}
              >
                <Text style={estilos.modalUbicacionBotonCancelarTexto}>Ahora no</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.modalUbicacionBotonContinuar}
                onPress={confirmarUbicacionBackground}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                  style={estilos.modalUbicacionBotonContinuarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="location" size={18} color="#FFF" />
                  <Text style={estilos.modalUbicacionBotonContinuarTexto}>Continuar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CERRAR SESIÓN */}
      <Modal visible={mostrarModalCerrar} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalIcono}>🚪</Text>
            <Text style={estilos.modalTitulo}>Cerrar Sesión</Text>
            <Text style={estilos.modalTexto}>¿Estás seguro de que querés salir?</Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar]}
                onPress={() => setMostrarModalCerrar(false)}
                activeOpacity={0.7}
              >
                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <LinearGradient colors={[DISENO.colors.danger, '#B71C1C']} style={estilos.modalConfirmarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="log-out-outline" size={16} color="#FFF" />
                  <Text style={estilos.modalConfirmarTexto}>Salir</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ÉXITO */}
      <Modal visible={mostrarModalExito} transparent animationType="fade" statusBarTranslucent={true}>
        <View style={estilos.modalFondo}>
          <View style={[estilos.modal, estilos.modalExito]}>
            <Text style={estilos.modalIcono}>🎉</Text>
            <Text style={[estilos.modalTitulo, { color: DISENO.colors.success }]}>
              ¡Éxito!
            </Text>
            <Text style={estilos.modalTexto}>{mensajeExito}</Text>
          </View>
        </View>
      </Modal>

      {/* TOAST GLOBAL */}
      <Toast
        visible={toast.visible}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        ocultar={toast.ocultar}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // HEADER
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  titulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  subtitulo: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  botonCerrarSesion: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },

  // STATS
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    padding: 14,
    marginBottom: 12,
    ...DISENO.shadow.sm,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: DISENO.colors.border,
  },
  statValor: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
  },
  statLabel: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },

  // PESTAÑAS
  pestanas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pestana: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  pestanaActiva: {
    backgroundColor: DISENO.colors.accentSecondary,
    borderColor: DISENO.colors.accentSecondary,
  },
  pestanaTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.textSecondary,
  },
  pestanaTextoActiva: {
    color: DISENO.colors.text,
    fontWeight: '700',
  },

  // MAPA
  mapaContenedor: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    padding: 10,
    marginBottom: 12,
    ...DISENO.shadow.sm,
  },
  mapa: {
    width: '100%',
    borderRadius: DISENO.radius.md,
  },
  mapaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  mapaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapaInfoTexto: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.text,
  },

  // ✅ MARCADOR DEL LOCAL CON LOGO
  marcadorLocalContainer: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: DISENO.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  marcadorLocalImagen: {
    width: '100%',
    height: '100%',
  },

  botonDetenerMapa: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  botonDetenerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  botonDetenerMapaTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },

  // TARJETA TRANSMISIÓN
  tarjetaTransmision: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    borderWidth: 1,
    borderColor: DISENO.colors.accentSecondary + '40',
    marginBottom: 12,
    ...DISENO.shadow.sm,
  },
  transmisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  puntoVivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DISENO.colors.success,
  },
  transmitiendoTexto: {
    fontFamily: FUENTES.display,
    fontSize: 14,
    color: DISENO.colors.success,
  },
  pedidoTransmision: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: DISENO.colors.text,
    marginTop: 2,
  },
  clienteTransmision: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  direccionTransmision: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.text,
    marginTop: 4,
  },
  gpsInfo: {
    backgroundColor: DISENO.colors.surfaceHover,
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  gpsTexto: {
    fontFamily: FUENTES.mono,
    fontSize: 10,
    color: DISENO.colors.accent,
  },
  botonConfirmarEntrega: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // LISTA
  listaContainer: { flex: 1 },
  tarjeta: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    borderLeftWidth: 4,
    marginBottom: 10,
    ...DISENO.shadow.sm,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  pedidoId: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
  },
  clienteNombre: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoEnvioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: DISENO.colors.surfaceHover,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 4,
  },
  infoEnvioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoEnvioTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 10,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
  },
  tarjetaInfo: { marginBottom: 8 },
  tarjetaDireccion: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    marginBottom: 2,
  },
  tarjetaTelefono: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginBottom: 2,
  },
  tarjetaTotal: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.accent,
    marginTop: 2,
  },
  botonIniciar: {
    borderRadius: 10,
    overflow: 'hidden',
    ...DISENO.shadow.sm,
  },
  botonIniciarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  botonIniciarTexto: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
  },
  enCaminoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  enCaminoTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    fontWeight: '600',
    color: DISENO.colors.naranja,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  vacioTexto: {
    fontFamily: FUENTES.display,
    fontSize: 16,
    color: DISENO.colors.text,
    marginTop: 12,
  },
  vacioSubtexto: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  // MODALES
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...DISENO.shadow.lg,
  },
  modalExito: {
    borderWidth: 2,
    borderColor: DISENO.colors.success + '40',
  },
  modalIcono: {
    fontSize: 48,
    marginBottom: 10,
  },
  modalTitulo: {
    fontFamily: FUENTES.display,
    fontSize: 20,
    color: DISENO.colors.text,
    marginBottom: 6,
  },
  modalTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelar: {
    backgroundColor: DISENO.colors.surfaceHover,
  },
  modalCancelarTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  modalConfirmar: {
    overflow: 'hidden',
  },
  modalConfirmarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    width: '100%',
  },
  modalConfirmarTexto: {
    fontFamily: FUENTES.display,
    fontSize: 13,
    color: '#FFF',
  },

  // MODAL DIVULGACIÓN UBICACIÓN
  modalUbicacionContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.xl,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    ...DISENO.shadow.lg,
  },
  modalUbicacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalUbicacionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUbicacionTitulo: {
    flex: 1,
    fontFamily: FUENTES.display,
    fontSize: 17,
    color: '#FFF',
  },
  modalUbicacionBody: {
    padding: 20,
    gap: 14,
  },
  modalUbicacionPregunta: {
    fontFamily: FUENTES.display,
    fontSize: 15,
    color: DISENO.colors.text,
  },
  modalUbicacionExplicacion: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    color: DISENO.colors.textSecondary,
    lineHeight: 20,
  },
  modalUbicacionDestacado: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.accent,
    fontWeight: '700',
  },
  modalUbicacionLista: {
    gap: 10,
    backgroundColor: DISENO.colors.surfaceHover,
    borderRadius: 12,
    padding: 14,
  },
  modalUbicacionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalUbicacionItemTexto: {
    flex: 1,
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
    lineHeight: 18,
  },
  modalUbicacionItemDestacado: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '700',
  },
  modalUbicacionAviso: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textTertiary,
    lineHeight: 17,
    fontStyle: 'italic',
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
    backgroundColor: DISENO.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUbicacionBotonCancelarTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    fontWeight: '600',
    color: DISENO.colors.textSecondary,
  },
  modalUbicacionBotonContinuar: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalUbicacionBotonContinuarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    width: '100%',
  },
  modalUbicacionBotonContinuarTexto: {
    fontFamily: FUENTES.display,
    fontSize: 14,
    color: '#FFF',
  },
});