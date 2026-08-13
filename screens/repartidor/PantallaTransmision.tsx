// screens/repartidor/PantallaTransmision.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, Dimensions, RefreshControl, Animated, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { obtenerRuta, guardarRutaPedido, obtenerRutaPedido, obtenerInfoRutaPedido } from '../../lib/directions';

const { width, height } = Dimensions.get('window');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = { latitude: -34.776484410467525, longitude: -58.29220250409459 };

// ✅ PALETA DE COLORES CONSISTENTE
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
  pendiente: '#FF9800',
  confirmado: '#2196F3',
  preparando: '#9C27B0',
  listo: '#4CAF50',
  enCamino: '#FF5722',
  entregado: '#4CAF50',
  cancelado: '#F44336',
};

// ✅ FUNCIÓN PARA VALIDAR COORDENADAS
const validarCoordenadas = (coords: { latitude: number; longitude: number }[]) => {
  if (!coords || coords.length < 2) return false;
  return coords.every(coord =>
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
  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [pedidosEntregados, setPedidosEntregados] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState({
    lat: -34.776484410467525,
    lng: -58.29220250409459
  });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [pestana, setPestana] = useState<'activos' | 'historial'>('activos');
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanciaReal, setDistanciaReal] = useState<string>('');
  const [tiempoReal, setTiempoReal] = useState<string>('');

  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<any>(null);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ✅ Animación de pulso para la moto
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ============================================================
  // 📱 RESPONSIVE - TAMAÑOS DINÁMICOS
  // ============================================================
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 32 : isSmallPhone ? 8 : 12;
  const paddingVertical = isTablet ? 14 : isSmallPhone ? 6 : 8;
  const tituloSize = isTablet ? 26 : isSmallPhone ? 18 : 20;
  const subtituloSize = isTablet ? 14 : isSmallPhone ? 10 : 11;
  const statValorSize = isTablet ? 22 : isSmallPhone ? 16 : 18;
  const statLabelSize = isTablet ? 11 : isSmallPhone ? 8 : 9;
  const pestanaTextSize = isTablet ? 14 : isSmallPhone ? 10 : 11;
  const pestanaPaddingV = isTablet ? 10 : isSmallPhone ? 6 : 7;
  const mapaHeight = isTablet ? 280 : isSmallPhone ? 180 : 210;
  const mapaPadding = isTablet ? 14 : isSmallPhone ? 8 : 10;
  const mapaBorderRadius = isTablet ? 18 : isSmallPhone ? 10 : 12;
  const tarjetaPadding = isTablet ? 14 : isSmallPhone ? 8 : 10;
  const tarjetaBorderRadius = isTablet ? 12 : isSmallPhone ? 8 : 10;
  const pedidoIdSize = isTablet ? 15 : isSmallPhone ? 11 : 12;
  const clienteNombreSize = isTablet ? 13 : isSmallPhone ? 9 : 10;
  const botonTextSize = isTablet ? 15 : isSmallPhone ? 11 : 12;
  const iconSize = isTablet ? 24 : isSmallPhone ? 16 : 18;
  const modalPadding = isTablet ? 28 : isSmallPhone ? 18 : 20;
  const gap = isTablet ? 10 : isSmallPhone ? 5 : 6;
  const statsGap = isTablet ? 12 : isSmallPhone ? 5 : 6;
  const headerPaddingTop = isTablet ? 18 : isSmallPhone ? 8 : 10;

  // ✅ Preparar coordenadas para el Polyline con validación
  const obtenerCoordenadasPolyline = () => {
    if (rutaPuntos.length > 1) return rutaPuntos;
    if (pedidoSeleccionado) {
      return [
        { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
        {
          latitude: pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
          longitude: pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
        }
      ];
    }
    return [
      { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
      { latitude: UBICACION_KRUSTY.latitude, longitude: UBICACION_KRUSTY.longitude }
    ];
  };

  const coordenadasPolyline = obtenerCoordenadasPolyline();
  const puntosValidos = validarCoordenadas(coordenadasPolyline);

  // ✅ LOGS DE DEPURACIÓN PARA POLYLINE (fuera del JSX)
  useEffect(() => {
    if (transmitiendo && pedidoSeleccionado) {
      console.log('🔍 ========== DEPURACIÓN POLYLINE ==========');
      console.log('  - puntosValidos:', puntosValidos);
      console.log('  - pedidoSeleccionado:', pedidoSeleccionado?.id);
      console.log('  - rutaPuntos.length:', rutaPuntos.length);
      console.log('  - rutaPuntos (primeros 3):', JSON.stringify(rutaPuntos.slice(0, 3), null, 2));
      console.log('  - coordenadasPolyline length:', coordenadasPolyline.length);
      console.log('  - coordenadasPolyline (primeros 3):', JSON.stringify(coordenadasPolyline.slice(0, 3), null, 2));
      console.log('  - ¿Se debe renderizar?', puntosValidos && pedidoSeleccionado && rutaPuntos.length > 1);
      console.log('🔍 ==========================================');
    }
  }, [transmitiendo, pedidoSeleccionado, rutaPuntos, puntosValidos, coordenadasPolyline]);

  useEffect(() => {
    cargarPedidos();
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

  // ✅ Animación de pulso para la moto cuando está transmitiendo
  useEffect(() => {
    if (transmitiendo) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [transmitiendo]);

  // ✅ Obtener ruta real - MEJORADO
  useEffect(() => {
    if (transmitiendo && pedidoSeleccionado && ubicacionActual) {
      const obtenerRutaReal = async () => {
        const origenLat = ubicacionActual.lat;
        const origenLng = ubicacionActual.lng;
        const destinoLat = pedidoSeleccionado?.lat_cliente || UBICACION_KRUSTY.latitude;
        const destinoLng = pedidoSeleccionado?.lng_cliente || UBICACION_KRUSTY.longitude;

        // ✅ Intentar cargar ruta guardada en la DB
        const rutaGuardada = await obtenerRutaPedido(pedidoSeleccionado.id);
        if (rutaGuardada && rutaGuardada.length > 1) {
          console.log('📦 Ruta cargada de la DB:', rutaGuardada.length, 'puntos');
          setRutaPuntos(rutaGuardada);

          // ✅ Cargar distancia y tiempo desde la DB
          const infoRuta = await obtenerInfoRutaPedido(pedidoSeleccionado.id);
          if (infoRuta) {
            setDistanciaReal(infoRuta.distancia);
            setTiempoReal(infoRuta.duracion);
          }
          return;
        }

        // ✅ Si no hay ruta guardada, obtener nueva de Google Maps
        console.log('🔄 Obteniendo nueva ruta de Google Maps...');
        const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);

        if (ruta && ruta.points.length > 1) {
          console.log('✅ Ruta obtenida:', ruta.points.length, 'puntos');
          setRutaPuntos(ruta.points);
          setDistanciaReal(ruta.distance);
          setTiempoReal(ruta.duration);

          // ✅ Guardar en la DB
          await guardarRutaPedido(pedidoSeleccionado.id, ruta.points, ruta.distance, ruta.duration);
          console.log('💾 Ruta guardada en la DB');
        } else {
          // ✅ Fallback: línea recta
          console.warn('⚠️ Usando línea recta como fallback');
          setRutaPuntos([
            { latitude: origenLat, longitude: origenLng },
            { latitude: destinoLat, longitude: destinoLng }
          ]);
        }
      };
      obtenerRutaReal();
    }
  }, [transmitiendo, pedidoSeleccionado, ubicacionActual]);

  // ✅ ZOOM MEJORADO - Mostrar toda la ruta
  useEffect(() => {
    if (transmitiendo && ubicacionActual && mapRef.current) {
      // ✅ Calcular el zoom para mostrar toda la ruta
      if (rutaPuntos.length > 1) {
        // Encontrar los límites de la ruta
        const lats = rutaPuntos.map(p => p.latitude);
        const lngs = rutaPuntos.map(p => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const latDelta = (maxLat - minLat) * 1.5 + 0.005;
        const lngDelta = (maxLng - minLng) * 1.5 + 0.005;

        mapRef.current.animateToRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(latDelta, 0.02),
          longitudeDelta: Math.max(lngDelta, 0.02),
        }, 1000);
      } else {
        // Fallback: centrar en el repartidor con zoom más amplio
        mapRef.current.animateToRegion({
          latitude: ubicacionActual.lat,
          longitude: ubicacionActual.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
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

      if (!errorActivos) {
        setPedidosActivos(activos as Pedido[] || []);
      }

      const { data: entregados, error: errorEntregados } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'entregado')
        .order('creado_en', { ascending: false })
        .limit(20);

      if (!errorEntregados) {
        setPedidosEntregados(entregados as Pedido[] || []);
      }
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
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
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

  const actualizarUbicacionEnSupabase = async (lat: number, lng: number, pedidoId: number) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          lat_repartidor: lat,
          repartidor_de_lng: lng
        })
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ Error actualizando ubicación:', error);
      }
    } catch (error) {
      console.error('❌ Error en actualización:', error);
    }
  };

  // ✅ INICIAR TRANSMISIÓN - MEJORADO CON RUTA
  const iniciarTransmision = async (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setTransmitiendo(true);

    // ✅ OBTENER RUTA AL INICIAR
    const origenLat = ubicacionActual.lat;
    const origenLng = ubicacionActual.lng;
    const destinoLat = pedido.lat_cliente || UBICACION_KRUSTY.latitude;
    const destinoLng = pedido.lng_cliente || UBICACION_KRUSTY.longitude;

    // ✅ 1. Intentar cargar ruta guardada en la DB
    const rutaGuardada = await obtenerRutaPedido(pedido.id);
    if (rutaGuardada && rutaGuardada.length > 1) {
      console.log('📦 Ruta cargada de la DB:', rutaGuardada.length, 'puntos');
      setRutaPuntos(rutaGuardada);

      // Cargar distancia y tiempo desde la DB
      const infoRuta = await obtenerInfoRutaPedido(pedido.id);
      if (infoRuta) {
        setDistanciaReal(infoRuta.distancia);
        setTiempoReal(infoRuta.duracion);
      }
    } else {
      // ✅ 2. Obtener nueva ruta de Google Maps
      console.log('🔄 Obteniendo nueva ruta...');
      const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);

      if (ruta && ruta.points.length > 1) {
        setRutaPuntos(ruta.points);
        setDistanciaReal(ruta.distance);
        setTiempoReal(ruta.duration);

        // ✅ Guardar en la DB
        await guardarRutaPedido(pedido.id, ruta.points, ruta.distance, ruta.duration);
        console.log('💾 Ruta guardada en la DB');
      } else {
        // ✅ 3. Fallback: línea recta
        console.warn('⚠️ Usando línea recta como fallback');
        setRutaPuntos([
          { latitude: origenLat, longitude: origenLng },
          { latitude: destinoLat, longitude: destinoLng }
        ]);
      }
    }

    // ✅ ACTUALIZAR ESTADO DEL PEDIDO
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          estado: 'en_camino',
          repartidor_id: perfil?.id,
          encabezado_repartidor: perfil?.nombre_cliente || 'Repartidor Krusty'
        })
        .eq('id', pedido.id);

      if (error) {
        console.error('❌ Error actualizando estado:', error);
      }
    } catch (error) {
      console.error('❌ Error en actualización de estado:', error);
    }

    // ✅ INICIAR SEGUIMIENTO DE UBICACIÓN
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          setUbicacionActual({ lat: latitude, lng: longitude });
          await actualizarUbicacionEnSupabase(latitude, longitude, pedido.id);

          const distancia = calcularDistancia(
            latitude,
            longitude,
            pedido.lat_cliente || UBICACION_KRUSTY.latitude,
            pedido.lng_cliente || UBICACION_KRUSTY.longitude
          );

          if (distancia < 0.1) {
            const { error } = await supabase
              .from('pedidos')
              .update({ estado: 'entregado' })
              .eq('id', pedido.id);

            if (!error) {
              mostrarExito('🎉 Llegaste al destino! Entrega completada');
              setTransmitiendo(false);
              setPedidoSeleccionado(null);
              if (watchRef.current) {
                watchRef.current.remove();
                watchRef.current = null;
              }
              cargarPedidos();
            }
          }
        }
      );
    } else {
      simularMovimiento(pedido);
    }
  };

  const simularMovimiento = (pedido: Pedido) => {
    let paso = 0;
    const intervalo = setInterval(async () => {
      paso += 0.001;
      const nuevaLat = (pedido.lat_cliente || UBICACION_KRUSTY.latitude) + paso;
      const nuevaLng = (pedido.lng_cliente || UBICACION_KRUSTY.longitude) + paso;

      setUbicacionActual({ lat: nuevaLat, lng: nuevaLng });
      await actualizarUbicacionEnSupabase(nuevaLat, nuevaLng, pedido.id);

      if (paso >= 0.01) {
        clearInterval(intervalo);
        await supabase.from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id);
        mostrarExito('🎉 Entrega completada exitosamente!');
        setTransmitiendo(false);
        setPedidoSeleccionado(null);
        cargarPedidos();
      }
    }, 2000);
  };

  const detenerTransmision = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTransmitiendo(false);
    setPedidoSeleccionado(null);
  };

  const confirmarCerrarSesion = async () => {
    setMostrarModalCerrar(false);
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  const estadoColor = (estado: string) => {
    const c: any = {
      listo: COLORS.listo,
      en_camino: COLORS.enCamino,
      entregado: COLORS.entregado
    };
    return c[estado] || COLORS.grisClaro;
  };

  // ✅ Render de pedido con información de envío
  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={[
      estilos.tarjeta,
      {
        borderColor: estadoColor(item.estado) + '40',
        padding: tarjetaPadding,
        borderRadius: tarjetaBorderRadius,
        marginBottom: gap,
      }
    ]}>
      <View style={estilos.tarjetaHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[estilos.pedidoId, { fontSize: pedidoIdSize }]}
            numberOfLines={1}
          >
            Pedido #{item.id}
          </Text>
          <Text
            style={[estilos.clienteNombre, { fontSize: clienteNombreSize }]}
            numberOfLines={1}
          >
            {item.cliente_nombre || 'Cliente'}
          </Text>
        </View>
        <View style={[
          estilos.estadoBadge,
          {
            backgroundColor: estadoColor(item.estado) + '20',
            paddingHorizontal: isTablet ? 10 : isSmallPhone ? 4 : 6,
            paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
            borderRadius: isTablet ? 10 : isSmallPhone ? 4 : 6,
          }
        ]}>
          <Text style={[
            estilos.estadoTexto,
            {
              color: estadoColor(item.estado),
              fontSize: isTablet ? 11 : isSmallPhone ? 8 : 9,
            }
          ]}>
            {item.estado === 'listo' ? '📦' :
              item.estado === 'en_camino' ? '🚲' : '✅'}
          </Text>
        </View>
      </View>

      {/* ✅ INFORMACIÓN DE ENVÍO */}
      <View style={[
        estilos.infoEnvioContainer,
        {
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: COLORS.negro + '30',
          paddingVertical: isTablet ? 6 : isSmallPhone ? 3 : 4,
          paddingHorizontal: isTablet ? 8 : isSmallPhone ? 4 : 6,
          borderRadius: isTablet ? 8 : isSmallPhone ? 4 : 6,
          marginBottom: isTablet ? 6 : isSmallPhone ? 3 : 4,
          borderWidth: 1,
          borderColor: COLORS.blanco + '5',
          flexWrap: 'wrap',
        }
      ]}>
        {/* Distancia */}
        {item.distancia_km !== undefined && item.distancia_km !== null ? (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="navigate" size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.amarillo} />
            <Text style={[estilos.infoEnvioTexto, {
              fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
              color: COLORS.grisClaro,
            }]}>
              {item.distancia_km.toFixed(1)} km
            </Text>
          </View>
        ) : (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="navigate" size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.grisClaro} />
            <Text style={[estilos.infoEnvioTexto, {
              fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
              color: COLORS.grisClaro,
              opacity: 0.5,
            }]}>
              ---
            </Text>
          </View>
        )}

        {/* Tiempo estimado */}
        {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null ? (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="time" size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.amarillo} />
            <Text style={[estilos.infoEnvioTexto, {
              fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
              color: COLORS.grisClaro,
            }]}>
              {item.tiempo_estimado} min
            </Text>
          </View>
        ) : (
          <View style={estilos.infoEnvioItem}>
            <Ionicons name="time" size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.grisClaro} />
            <Text style={[estilos.infoEnvioTexto, {
              fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
              color: COLORS.grisClaro,
              opacity: 0.5,
            }]}>
              ---
            </Text>
          </View>
        )}

        {/* Costo de envío */}
        <View style={estilos.infoEnvioItem}>
          <Ionicons name="cash" size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.verdeClaro} />
          <Text style={[estilos.infoEnvioTexto, {
            fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
            color: item.costo_envio && item.costo_envio > 0 ? COLORS.verdeClaro : COLORS.grisClaro,
          }]}>
            {item.costo_envio && item.costo_envio > 0 ? `$${item.costo_envio.toFixed(2)}` : 'Gratis'}
          </Text>
        </View>

        {/* Tipo de entrega */}
        <View style={estilos.infoEnvioItem}>
          <Ionicons name={item.tipo_entrega === 'retiro' ? 'storefront' : 'home'} size={isTablet ? 14 : isSmallPhone ? 10 : 12} color={COLORS.grisClaro} />
          <Text style={[estilos.infoEnvioTexto, {
            fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
            color: COLORS.grisClaro,
          }]}>
            {item.tipo_entrega === 'retiro' ? 'Retiro' : 'Domicilio'}
          </Text>
        </View>
      </View>

      <View style={estilos.tarjetaInfo}>
        <Text
          style={[estilos.tarjetaDireccion, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}
          numberOfLines={1}
        >
          📍 {item.direccion || 'Retiro en local'}
        </Text>
        <Text
          style={[estilos.tarjetaTelefono, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}
          numberOfLines={1}
        >
          📱 {item.telefono || 'Sin teléfono'}
        </Text>
        <Text style={[estilos.tarjetaTotal, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
          💰 ${item.total?.toFixed(2)}
        </Text>
      </View>

      {item.estado !== 'entregado' && !transmitiendo && (
        <TouchableOpacity
          style={[
            estilos.botonIniciar,
            {
              paddingVertical: isTablet ? 12 : isSmallPhone ? 6 : 8,
              borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
            }
          ]}
          onPress={() => iniciarTransmision(item)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
            style={estilos.botonIniciarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="play-circle" size={isTablet ? 20 : isSmallPhone ? 14 : 16} color={COLORS.negro} />
            <Text style={[estilos.botonIniciarTexto, { fontSize: botonTextSize }]}>
              Iniciar Entrega
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={estilos.scrollView}
        contentContainerStyle={[
          estilos.scrollContent,
          {
            paddingBottom: insets.bottom + 80,
          }
        ]}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={COLORS.amarillo}
            colors={[COLORS.amarillo]}
          />
        }
      >
        {/* ✅ HEADER */}
        <View style={[
          estilos.encabezado,
          {
            paddingTop: insets.top + headerPaddingTop,
            paddingHorizontal: paddingHorizontal,
            paddingBottom: paddingVertical,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.blanco + '10',
          }
        ]}>
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
            style={[
              estilos.botonCerrarSesion,
              {
                padding: isTablet ? 8 : isSmallPhone ? 4 : 6,
                borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 18,
              }
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 18} color={COLORS.rojo} />
          </TouchableOpacity>
        </View>

        {/* ✅ STATS */}
        <View style={[
          estilos.stats,
          {
            paddingVertical: isTablet ? 12 : isSmallPhone ? 6 : 8,
            paddingHorizontal: paddingHorizontal,
            gap: statsGap,
          }
        ]}>
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>{pedidosActivos.length}</Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Pend.</Text>
          </View>
          <View style={estilos.statDivider} />
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>{pedidosEntregados.length}</Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Ent.</Text>
          </View>
          <View style={estilos.statDivider} />
          <View style={estilos.statItem}>
            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
              ${pedidosEntregados.reduce((s, p) => s + (p.total || 0), 0).toFixed(0)}
            </Text>
            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Total</Text>
          </View>
        </View>

        {/* ✅ PESTAÑAS */}
        <View style={[
          estilos.pestanas,
          {
            paddingHorizontal: paddingHorizontal,
            marginVertical: isTablet ? 10 : isSmallPhone ? 4 : 6,
            gap: isTablet ? 8 : isSmallPhone ? 4 : 5,
          }
        ]}>
          <TouchableOpacity
            style={[
              estilos.pestana,
              {
                paddingVertical: pestanaPaddingV,
                borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                backgroundColor: pestana === 'activos' ? COLORS.amarillo : COLORS.negro + '40',
                borderWidth: 1,
                borderColor: pestana === 'activos' ? COLORS.amarillo : COLORS.blanco + '8',
              }
            ]}
            onPress={() => setPestana('activos')}
            activeOpacity={0.7}
          >
            <Text style={[
              estilos.pestanaTexto,
              {
                fontSize: pestanaTextSize,
                color: pestana === 'activos' ? COLORS.negro : COLORS.grisClaro,
                fontWeight: pestana === 'activos' ? '700' : '500',
              }
            ]}>
              🚀 Activos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              estilos.pestana,
              {
                paddingVertical: pestanaPaddingV,
                borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                backgroundColor: pestana === 'historial' ? COLORS.amarillo : COLORS.negro + '40',
                borderWidth: 1,
                borderColor: pestana === 'historial' ? COLORS.amarillo : COLORS.blanco + '8',
              }
            ]}
            onPress={() => setPestana('historial')}
            activeOpacity={0.7}
          >
            <Text style={[
              estilos.pestanaTexto,
              {
                fontSize: pestanaTextSize,
                color: pestana === 'historial' ? COLORS.negro : COLORS.grisClaro,
                fontWeight: pestana === 'historial' ? '700' : '500',
              }
            ]}>
              📋 Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* ✅ MAPA EN TRANSMISIÓN - VERSIÓN MEJORADA TIPO UBER */}
        {transmitiendo && pedidoSeleccionado && (
          <Animated.View style={[
            estilos.mapaContenedor,
            {
              marginHorizontal: paddingHorizontal,
              borderRadius: mapaBorderRadius,
              padding: mapaPadding,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
              marginBottom: gap,
            }
          ]}>
            <MapView
              ref={mapRef}
              style={[estilos.mapa, { height: mapaHeight, borderRadius: isTablet ? 14 : isSmallPhone ? 6 : 8 }]}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: ubicacionActual.lat,
                longitude: ubicacionActual.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* 🛵 REPARTIDOR CON MOTO ANIMADA */}
              <Marker coordinate={{ latitude: ubicacionActual.lat, longitude: ubicacionActual.lng }}>
                <Animated.View style={[estilos.motoMarker, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={estilos.motoCircle}>
                    <Ionicons name="bicycle" size={isTablet ? 32 : 24} color="#000000" />
                  </View>
                  <View style={estilos.motoPulseOuter} />
                  <View style={estilos.motoPulseInner} />
                </Animated.View>
              </Marker>

              {/* 📍 DESTINO CLIENTE CON BANDERA */}
              {pedidoSeleccionado && (
                <Marker
                  coordinate={{
                    latitude: pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                    longitude: pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
                  }}
                >
                  <View style={estilos.destinoMarker}>
                    <Ionicons name="flag" size={isTablet ? 28 : 22} color="#FFFFFF" />
                  </View>
                </Marker>
              )}

              {/* 🗺️ RUTA TIPO UBER - CON SOMBRA Y DEGRADADO */}
              {puntosValidos && pedidoSeleccionado && rutaPuntos.length > 1 && (
                <>
                  {/* Sombra de la ruta */}
                  <Polyline
                    coordinates={rutaPuntos}
                    strokeColor="rgba(0,0,0,0.3)"
                    strokeWidth={10}
                    lineCap="round"
                    lineJoin="round"
                  />
                  {/* Línea principal - ROJA PARA DEPURAR */}
                  <Polyline
                    coordinates={rutaPuntos}
                    strokeColor="red"
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                  />
                  {/* Línea interior (brillo) */}
                  <Polyline
                    coordinates={rutaPuntos}
                    strokeColor={COLORS.amarilloClaro}
                    strokeWidth={2}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              )}
            </MapView>

            <View style={[
              estilos.mapaInfo,
              {
                marginTop: isTablet ? 8 : isSmallPhone ? 4 : 6,
                gap: isTablet ? 10 : isSmallPhone ? 4 : 6,
              }
            ]}>
              <View style={estilos.mapaInfoItem}>
                <Ionicons name="navigate" size={isTablet ? 18 : isSmallPhone ? 12 : 14} color={COLORS.amarillo} />
                <Text style={[estilos.mapaInfoTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 9 : 10 }]}>
                  {distanciaReal ||
                    (pedidoSeleccionado && calcularDistancia(
                      ubicacionActual.lat,
                      ubicacionActual.lng,
                      pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                      pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
                    ).toFixed(1) + ' km')}
                </Text>
              </View>
              <View style={estilos.mapaInfoItem}>
                <Ionicons name="time" size={isTablet ? 18 : isSmallPhone ? 12 : 14} color={COLORS.amarillo} />
                <Text style={[estilos.mapaInfoTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 9 : 10 }]}>
                  {tiempoReal ||
                    (pedidoSeleccionado && Math.ceil(
                      calcularDistancia(
                        ubicacionActual.lat,
                        ubicacionActual.lng,
                        pedidoSeleccionado.lat_cliente || UBICACION_KRUSTY.latitude,
                        pedidoSeleccionado.lng_cliente || UBICACION_KRUSTY.longitude
                      ) * 15
                    ) + ' min')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                estilos.botonDetenerMapa,
                {
                  paddingVertical: isTablet ? 12 : isSmallPhone ? 6 : 8,
                  borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                  marginTop: isTablet ? 8 : isSmallPhone ? 4 : 6,
                }
              ]}
              onPress={detenerTransmision}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.rojo, COLORS.rojoOscuro]}
                style={estilos.botonDetenerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="stop-circle" size={isTablet ? 20 : isSmallPhone ? 14 : 16} color={COLORS.blanco} />
                <Text style={[estilos.botonDetenerMapaTexto, { fontSize: botonTextSize }]}>
                  Detener
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ✅ TARJETA DE TRANSMISIÓN ACTIVA */}
        {transmitiendo && pedidoSeleccionado && (
          <Animated.View style={[
            estilos.tarjetaTransmision,
            {
              marginHorizontal: paddingHorizontal,
              borderRadius: tarjetaBorderRadius,
              padding: tarjetaPadding,
              borderColor: COLORS.amarillo + '40',
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
              marginTop: isTablet ? 6 : isSmallPhone ? 2 : 4,
              marginBottom: gap,
              minHeight: isTablet ? 100 : isSmallPhone ? 70 : 80,
            }
          ]}>
            <View style={[estilos.transmisionHeader, { marginBottom: isTablet ? 4 : isSmallPhone ? 1 : 2 }]}>
              <View style={estilos.puntoVivo} />
              <Text style={[estilos.transmitiendoTexto, {
                fontSize: isTablet ? 14 : isSmallPhone ? 10 : 11,
                flex: 1,
                flexWrap: 'wrap',
              }]}>
                Transmitiendo
              </Text>
            </View>
            <Text style={[estilos.pedidoTransmision, {
              fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11,
              marginTop: isTablet ? 2 : isSmallPhone ? 1 : 2,
            }]}>
              Pedido #{pedidoSeleccionado.id}
            </Text>
            <Text style={[estilos.clienteTransmision, {
              fontSize: isTablet ? 13 : isSmallPhone ? 9 : 10,
              marginTop: isTablet ? 1 : isSmallPhone ? 0 : 1,
            }]}>
              {pedidoSeleccionado.cliente_nombre}
            </Text>
            <Text
              style={[estilos.direccionTransmision, {
                fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10,
                marginTop: isTablet ? 2 : isSmallPhone ? 1 : 2,
                flexWrap: 'wrap',
              }]}
              numberOfLines={1}
            >
              📍 {pedidoSeleccionado.direccion || 'Sin dirección'}
            </Text>
            <View style={[estilos.gpsInfo, {
              marginTop: isTablet ? 6 : isSmallPhone ? 2 : 4,
              padding: isTablet ? 6 : isSmallPhone ? 3 : 4,
            }]}>
              <Text style={[estilos.gpsTexto, {
                fontSize: isTablet ? 11 : isSmallPhone ? 8 : 9,
              }]}>
                GPS: {ubicacionActual.lat.toFixed(6)}, {ubicacionActual.lng.toFixed(6)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ✅ LISTA DE PEDIDOS */}
        <View style={[
          estilos.listaContainer,
          {
            paddingHorizontal: paddingHorizontal,
            paddingTop: isTablet ? 6 : 2,
          }
        ]}>
          {pedidosActivos.length === 0 && pedidosEntregados.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons
                name={pestana === 'activos' ? 'bicycle-outline' : 'checkmark-done-outline'}
                size={isTablet ? 56 : isSmallPhone ? 36 : 40}
                color={COLORS.grisClaro + '30'}
              />
              <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 11 : 12 }]}>
                {pestana === 'activos' ? 'No hay pedidos' : 'No hay entregas'}
              </Text>
              <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>
                {pestana === 'activos'
                  ? 'Los pedidos listos aparecerán aquí'
                  : 'Tus entregas completadas aparecerán aquí'}
              </Text>
            </View>
          ) : (
            (pestana === 'activos' ? pedidosActivos : pedidosEntregados).map((item) => (
              <View key={item.id}>
                {renderPedido({ item })}
              </View>
            ))
          )}
        </View>

        {/* ✅ Espacio extra al final */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ✅ MODAL CERRAR SESIÓN */}
      <Modal
        visible={mostrarModalCerrar}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={[
          estilos.modalFondo,
          {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }
        ]}>
          <View style={[
            estilos.modal,
            {
              padding: modalPadding,
              borderRadius: isTablet ? 22 : isSmallPhone ? 14 : 18,
              borderColor: COLORS.rojo + '40',
              width: isTablet ? '55%' : '90%',
              maxWidth: 380,
              backgroundColor: COLORS.grisOscuro,
              alignItems: 'center',
              borderWidth: 2,
              shadowColor: COLORS.negro,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }
          ]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 56 : isSmallPhone ? 40 : 48 }]}>🚪</Text>
            <Text style={[estilos.modalTitulo, {
              fontSize: isTablet ? 22 : isSmallPhone ? 16 : 18,
              fontWeight: 'bold',
              color: COLORS.blanco,
              marginBottom: 6,
            }]}>
              Cerrar Sesión
            </Text>
            <Text style={[estilos.modalTexto, {
              fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
              color: COLORS.grisClaro,
              textAlign: 'center',
              marginBottom: 18,
            }]}>
              ¿Estás seguro de que quieres salir?
            </Text>
            <View style={[estilos.modalBotones, {
              flexDirection: 'row',
              gap: isTablet ? 10 : isSmallPhone ? 4 : 6,
              width: '100%',
            }]}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar, {
                  flex: 1,
                  paddingVertical: isTablet ? 12 : isSmallPhone ? 6 : 8,
                  borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                  backgroundColor: COLORS.negro + '50',
                  borderWidth: 1,
                  borderColor: COLORS.blanco + '10',
                  alignItems: 'center',
                  justifyContent: 'center',
                }]}
                onPress={() => setMostrarModalCerrar(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalCancelarTexto, {
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  color: COLORS.blanco,
                  fontWeight: '600',
                }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar, {
                  flex: 1,
                  paddingVertical: isTablet ? 12 : isSmallPhone ? 6 : 8,
                  borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.rojo, COLORS.rojoOscuro]}
                  style={[estilos.modalConfirmarGradient, {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    paddingHorizontal: 14,
                    width: '100%',
                    height: '100%',
                  }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={isTablet ? 18 : isSmallPhone ? 12 : 14} color={COLORS.blanco} />
                  <Text style={[estilos.modalConfirmarTexto, {
                    fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                    color: COLORS.blanco,
                    fontWeight: 'bold',
                  }]}>
                    Salir
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MODAL ÉXITO */}
      <Modal
        visible={mostrarModalExito}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={[
          estilos.modalFondo,
          {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
          }
        ]}>
          <View style={[
            estilos.modal,
            estilos.modalExito,
            {
              padding: modalPadding,
              borderRadius: isTablet ? 22 : isSmallPhone ? 14 : 18,
              borderColor: COLORS.verdeClaro + '40',
              width: isTablet ? '55%' : '90%',
              maxWidth: 380,
              backgroundColor: COLORS.grisOscuro,
              alignItems: 'center',
              borderWidth: 2,
              shadowColor: COLORS.negro,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }
          ]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 56 : isSmallPhone ? 40 : 48 }]}>🎉</Text>
            <Text style={[estilos.modalTitulo, {
              fontSize: isTablet ? 22 : isSmallPhone ? 16 : 18,
              fontWeight: 'bold',
              color: COLORS.verdeClaro,
              marginBottom: 6,
            }]}>
              ¡Éxito!
            </Text>
            <Text style={[estilos.modalTexto, {
              fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
              color: COLORS.grisClaro,
              textAlign: 'center',
            }]}>
              {mensajeExito}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 0.5,
  },
  subtitulo: {
    color: COLORS.grisClaro,
    marginTop: 1,
    opacity: 0.7,
  },
  botonCerrarSesion: {
    backgroundColor: COLORS.rojo + '15',
    borderWidth: 1,
    borderColor: COLORS.rojo + '20',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '8',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.blanco + '8',
  },
  statValor: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  statLabel: {
    color: COLORS.grisClaro,
    marginTop: 1,
    opacity: 0.6,
  },
  pestanas: {
    flexDirection: 'row',
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
  },
  pestanaTexto: {
    fontWeight: '600',
  },
  mapaContenedor: {
    backgroundColor: COLORS.negro + '60',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  mapa: {
    width: '100%',
  },
  mapaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mapaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mapaInfoTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  botonDetenerMapa: {
    overflow: 'hidden',
  },
  botonDetenerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
  },
  botonDetenerMapaTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  tarjetaTransmision: {
    backgroundColor: COLORS.amarillo + '10',
    borderWidth: 1,
  },
  transmisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  puntoVivo: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.amarillo,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  transmitiendoTexto: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  pedidoTransmision: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  clienteTransmision: {
    color: COLORS.grisClaro,
    marginTop: 1,
    opacity: 0.7,
  },
  direccionTransmision: {
    color: COLORS.blanco,
    marginTop: 2,
  },
  gpsInfo: {
    backgroundColor: COLORS.negro + '40',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.blanco + '5',
  },
  gpsTexto: {
    color: COLORS.amarillo,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  listaContainer: {
    flex: 1,
  },
  tarjeta: {
    backgroundColor: COLORS.negro + '60',
    borderWidth: 1,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  pedidoId: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  clienteNombre: {
    color: COLORS.grisClaro,
    marginTop: 1,
    opacity: 0.7,
  },
  estadoBadge: {
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  estadoTexto: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  infoEnvioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: COLORS.negro + '30',
    borderWidth: 1,
    borderColor: COLORS.blanco + '5',
  },
  infoEnvioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoEnvioTexto: {
    color: COLORS.grisClaro,
    fontWeight: '500',
  },
  tarjetaInfo: {
    marginBottom: 4,
  },
  tarjetaDireccion: {
    color: COLORS.blanco,
    marginBottom: 1,
  },
  tarjetaTelefono: {
    color: COLORS.grisClaro,
    marginBottom: 1,
    opacity: 0.6,
  },
  tarjetaTotal: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
    marginTop: 1,
  },
  botonIniciar: {
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  botonIniciarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
  },
  botonIniciarTexto: {
    color: COLORS.negro,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  vacioTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  vacioSubtexto: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.6,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: COLORS.grisOscuro,
    alignItems: 'center',
    borderWidth: 2,
  },
  modalExito: {
    borderColor: COLORS.verdeClaro,
  },
  modalIcono: {
    marginBottom: 6,
  },
  modalTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 4,
  },
  modalTexto: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginBottom: 14,
  },
  modalBotones: {
    flexDirection: 'row',
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
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
  modalConfirmar: {
    overflow: 'hidden',
  },
  modalConfirmarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    width: '100%',
    height: '100%',
  },
  modalConfirmarTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  // ✅ ESTILOS PARA MARCADORES MEJORADOS
  motoMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  motoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 2,
  },
  motoPulseOuter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(245, 197, 24, 0.2)',
    zIndex: 1,
  },
  motoPulseInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    zIndex: 0,
  },
  destinoMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.rojo,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});