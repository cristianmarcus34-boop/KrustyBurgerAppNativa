import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { obtenerRuta, guardarRutaPedido, obtenerRutaPedido } from '../../lib/directions';

const { width, height } = Dimensions.get('window');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = { latitude: -34.776484410467525, longitude: -58.29220250409459 };

export default function PantallaTransmision(props: any) {
  const { perfil, cerrarSesion } = tiendaAutenticacion();
  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [pedidosEntregados, setPedidosEntregados] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [transmitiendo, setTransmitiendo] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState({ lat: -34.776484410467525, lng: -58.29220250409459 });
  const [cargando, setCargando] = useState(true);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [pestana, setPestana] = useState<'activos' | 'historial'>('activos');
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distanciaReal, setDistanciaReal] = useState<string>('');
  const [tiempoReal, setTiempoReal] = useState<string>('');
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔄 PantallaTransmision montada');
    cargarPedidos();
  }, []);

  // ✅ Obtener ruta real cuando el pedido cambia o la ubicación cambia significativamente
  useEffect(() => {
    if (transmitiendo && pedidoSeleccionado && ubicacionActual) {
      const obtenerRutaReal = async () => {
        const origenLat = ubicacionActual.lat;
        const origenLng = ubicacionActual.lng;
        const destinoLat = pedidoSeleccionado?.lat_cliente || -34.776484410467525;
        const destinoLng = pedidoSeleccionado?.lng_cliente || -58.29220250409459;

        // Verificar si la distancia ha cambiado significativamente (cada 100 metros)
        const distanciaActual = calcularDistancia(origenLat, origenLng, destinoLat, destinoLng);
        if (distanciaActual * 1000 > 100 || rutaPuntos.length === 0) {
          // Intentar obtener ruta desde Supabase primero
          const rutaGuardada = await obtenerRutaPedido(pedidoSeleccionado.id);
          if (rutaGuardada && rutaGuardada.length > 0) {
            console.log('✅ Ruta cargada desde Supabase');
            setRutaPuntos(rutaGuardada);
            return;
          }

          // Si no hay ruta guardada, obtener de Google Maps
          const ruta = await obtenerRuta(origenLat, origenLng, destinoLat, destinoLng);
          if (ruta && ruta.points.length > 0) {
            setRutaPuntos(ruta.points);
            setDistanciaReal(ruta.distance);
            setTiempoReal(ruta.duration);
            await guardarRutaPedido(pedidoSeleccionado.id, ruta.points);
            console.log(`📏 Distancia real: ${ruta.distance}, Duración: ${ruta.duration}`);
          }
        }
      };

      obtenerRutaReal();
    }
  }, [transmitiendo, pedidoSeleccionado, ubicacionActual]);

  useEffect(() => {
    if (transmitiendo && ubicacionActual && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ubicacionActual.lat,
        longitude: ubicacionActual.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [ubicacionActual, transmitiendo]);

  const cargarPedidos = async () => {
    console.log('🔄 Cargando pedidos...');
    setCargando(true);
    try {
      const { data: activos, error: errorActivos } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['listo', 'en_camino'])
        .order('creado_en', { ascending: false });

      if (errorActivos) {
        console.error('❌ Error cargando pedidos activos:', errorActivos);
      } else {
        console.log(`📦 Pedidos activos: ${activos?.length || 0}`);
        setPedidosActivos(activos as Pedido[] || []);
      }

      const { data: entregados, error: errorEntregados } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'entregado')
        .order('creado_en', { ascending: false })
        .limit(20);

      if (errorEntregados) {
        console.error('❌ Error cargando pedidos entregados:', errorEntregados);
      } else {
        console.log(`📦 Pedidos entregados: ${entregados?.length || 0}`);
        setPedidosEntregados(entregados as Pedido[] || []);
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
    } finally {
      setCargando(false);
      console.log('✅ Carga de pedidos completada');
    }
  };

  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const mostrarExito = (mensaje: string) => {
    console.log(`🎉 Éxito: ${mensaje}`);
    setMensajeExito(mensaje);
    setMostrarModalExito(true);
    setTimeout(() => {
      setMostrarModalExito(false);
      console.log('🔕 Modal de éxito cerrado');
    }, 2500);
  };

  const actualizarUbicacionEnSupabase = async (lat: number, lng: number, pedidoId: number) => {
    try {
      console.log(`📍 Guardando ubicación: lat=${lat}, lng=${lng}, pedido=${pedidoId}`);

      const { error } = await supabase
        .from('pedidos')
        .update({
          lat_repartidor: lat,
          repartidor_de_lng: lng
        })
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ Error actualizando ubicación en Supabase:', error);
      } else {
        console.log(`✅ Ubicación guardada correctamente en Supabase para pedido ${pedidoId}`);
      }
    } catch (error) {
      console.error('❌ Error en actualización de ubicación:', error);
    }
  };

  const iniciarTransmision = async (pedido: Pedido) => {
    console.log(`🚲 Iniciando transmisión para pedido #${pedido.id}`);
    console.log(`📍 Destino: ${pedido.lat_cliente}, ${pedido.lng_cliente}`);

    setPedidoSeleccionado(pedido);
    setTransmitiendo(true);

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
        console.error('❌ Error actualizando estado del pedido:', error);
      } else {
        console.log(`✅ Pedido #${pedido.id} actualizado a "en_camino"`);
      }
    } catch (error) {
      console.error('❌ Error en actualización de estado:', error);
    }

    console.log('📱 Solicitando permisos de ubicación...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log(`📱 Permisos de ubicación: ${status}`);

    if (status === 'granted') {
      console.log('✅ Permisos de ubicación concedidos');

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          console.log(`📍 Nueva ubicación GPS: ${latitude}, ${longitude}`);

          setUbicacionActual({ lat: latitude, lng: longitude });
          await actualizarUbicacionEnSupabase(latitude, longitude, pedido.id);

          const distancia = calcularDistancia(
            latitude,
            longitude,
            pedido.lat_cliente || -34.776484410467525,
            pedido.lng_cliente || -58.29220250409459
          );

          console.log(`📏 Distancia al destino: ${(distancia * 1000).toFixed(0)}m`);

          if (distancia < 0.1) {
            console.log(`🎯 ¡Llegó al destino! Distancia: ${(distancia * 1000).toFixed(0)}m`);

            const { error } = await supabase
              .from('pedidos')
              .update({ estado: 'entregado' })
              .eq('id', pedido.id);

            if (error) {
              console.error('❌ Error marcando pedido como entregado:', error);
            } else {
              console.log(`✅ Pedido #${pedido.id} marcado como entregado`);
            }

            mostrarExito('🎉 Llegaste al destino! Entrega completada');
            setTransmitiendo(false);
            setPedidoSeleccionado(null);

            if (watchRef.current) {
              watchRef.current.remove();
              watchRef.current = null;
              console.log('🛑 GPS detenido');
            }

            cargarPedidos();
          }
        }
      );

      console.log('✅ GPS iniciado correctamente');
    } else {
      console.warn('⚠️ Sin permisos de ubicación, usando simulación');
      simularMovimiento(pedido);
    }
  };

  const simularMovimiento = (pedido: Pedido) => {
    console.log(`🔄 Iniciando simulación de movimiento para pedido #${pedido.id}`);
    let paso = 0;

    const intervalo = setInterval(async () => {
      paso += 0.001;
      const nuevaLat = (pedido.lat_cliente || -34.776484410467525) + paso;
      const nuevaLng = (pedido.lng_cliente || -58.29220250409459) + paso;

      console.log(`📍 Simulación paso ${paso}: ${nuevaLat}, ${nuevaLng}`);
      setUbicacionActual({ lat: nuevaLat, lng: nuevaLng });
      await actualizarUbicacionEnSupabase(nuevaLat, nuevaLng, pedido.id);

      if (paso >= 0.01) {
        clearInterval(intervalo);
        console.log(`✅ Simulación completada para pedido #${pedido.id}`);

        await supabase.from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id);
        mostrarExito('🎉 Entrega completada exitosamente!');
        setTransmitiendo(false);
        setPedidoSeleccionado(null);
        cargarPedidos();
      }
    }, 2000);
  };

  const detenerTransmision = () => {
    console.log('🛑 Deteniendo transmisión manualmente');
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
      console.log('✅ GPS detenido');
    }
    setTransmitiendo(false);
    setPedidoSeleccionado(null);
    console.log('✅ Transmisión detenida');
  };

  const confirmarCerrarSesion = async () => {
    console.log('🔒 Cerrando sesión...');
    setMostrarModalCerrar(false);
    try {
      await cerrarSesion();
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  const estadoColor = (estado: string) => {
    const c: any = { listo: Colores.listo, en_camino: Colores.enCamino, entregado: Colores.entregado };
    return c[estado] || Colores.textoGris;
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <View style={estilos.tarjeta}>
      <View style={estilos.tarjetaHeader}>
        <View>
          <Text style={estilos.pedidoId}>Pedido #{item.id}</Text>
          <Text style={estilos.clienteNombre}>{item.cliente_nombre || 'Cliente'}</Text>
        </View>
        <View style={[estilos.estadoBadge, { backgroundColor: estadoColor(item.estado) + '30' }]}>
          <Text style={[estilos.estadoTexto, { color: estadoColor(item.estado) }]}>
            {item.estado === 'listo' ? '📦 Listo' : item.estado === 'en_camino' ? '🚲 En camino' : '✅ Entregado'}
          </Text>
        </View>
      </View>
      <View style={estilos.tarjetaInfo}>
        <Text style={estilos.tarjetaDireccion}>📍 {item.direccion || 'Retiro en local'}</Text>
        <Text style={estilos.tarjetaTelefono}>📱 {item.telefono || 'Sin telefono'}</Text>
        <Text style={estilos.tarjetaTotal}>💰 ${item.total?.toFixed(2)}</Text>
      </View>
      {item.estado !== 'entregado' && !transmitiendo && (
        <TouchableOpacity style={estilos.botonIniciar} onPress={() => iniciarTransmision(item)}>
          <Ionicons name="play-circle" size={20} color="white" />
          <Text style={estilos.botonIniciarTexto}>Iniciar Entrega</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <View>
          <Text style={estilos.titulo}>Reparto Krusty</Text>
          <Text style={estilos.subtitulo}>{perfil?.nombre_cliente || 'Repartidor'}</Text>
        </View>
        <TouchableOpacity onPress={() => setMostrarModalCerrar(true)}>
          <Ionicons name="log-out-outline" size={28} color={Colores.acento} />
        </TouchableOpacity>
      </View>

      <View style={estilos.stats}>
        <View style={estilos.statItem}>
          <Text style={estilos.statValor}>{pedidosActivos.length}</Text>
          <Text style={estilos.statLabel}>Pendientes</Text>
        </View>
        <View style={estilos.statItem}>
          <Text style={estilos.statValor}>{pedidosEntregados.length}</Text>
          <Text style={estilos.statLabel}>Entregados</Text>
        </View>
        <View style={estilos.statItem}>
          <Text style={estilos.statValor}>
            ${pedidosEntregados.reduce((s, p) => s + (p.total || 0), 0).toFixed(0)}
          </Text>
          <Text style={estilos.statLabel}>Total hoy</Text>
        </View>
      </View>

      <View style={estilos.pestanas}>
        <TouchableOpacity
          style={[estilos.pestana, pestana === 'activos' && estilos.pestanaActiva]}
          onPress={() => {
            console.log('📋 Cambiando a pestana: Activos');
            setPestana('activos');
          }}
        >
          <Text style={[estilos.pestanaTexto, pestana === 'activos' && estilos.pestanaTextoActiva]}>
            🚀 Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.pestana, pestana === 'historial' && estilos.pestanaActiva]}
          onPress={() => {
            console.log('📋 Cambiando a pestana: Historial');
            setPestana('historial');
          }}
        >
          <Text style={[estilos.pestanaTexto, pestana === 'historial' && estilos.pestanaTextoActiva]}>
            📋 Historial
          </Text>
        </TouchableOpacity>
      </View>

      {transmitiendo && pedidoSeleccionado && (
        <View style={estilos.mapaContenedor}>
          <MapView
            ref={mapRef}
            style={estilos.mapa}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: ubicacionActual.lat,
              longitude: ubicacionActual.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={{ latitude: ubicacionActual.lat, longitude: ubicacionActual.lng }}
              title="Tu ubicación"
              description="🚲 Repartidor"
              pinColor="#2196F3"
            />

            {pedidoSeleccionado && (
              <Marker
                coordinate={{
                  latitude: pedidoSeleccionado.lat_cliente || -34.776484410467525,
                  longitude: pedidoSeleccionado.lng_cliente || -58.29220250409459
                }}
                title="Destino"
                description="📍 Cliente"
                pinColor={Colores.primario}
              />
            )}

            {/* ✅ RUTA REAL CON POLYLINE */}
            {pedidoSeleccionado && (
              <Polyline
                coordinates={rutaPuntos.length > 0 ? rutaPuntos : [
                  { latitude: ubicacionActual.lat, longitude: ubicacionActual.lng },
                  {
                    latitude: pedidoSeleccionado.lat_cliente || -34.776484410467525,
                    longitude: pedidoSeleccionado.lng_cliente || -58.29220250409459
                  }
                ]}
                strokeColor={Colores.primario}
                strokeWidth={rutaPuntos.length > 0 ? 5 : 4}
                lineDashPattern={rutaPuntos.length > 0 ? [] : [5, 5]}
                lineCap="round"
                lineJoin="round"
                strokeColors={[Colores.primario, Colores.secundario, Colores.primario]}
              />
            )}
          </MapView>

          <View style={estilos.mapaInfo}>
            <View style={estilos.mapaInfoItem}>
              <Ionicons name="navigate" size={18} color={Colores.secundario} />
              <Text style={estilos.mapaInfoTexto}>
                {distanciaReal ||
                  (pedidoSeleccionado && calcularDistancia(
                    ubicacionActual.lat,
                    ubicacionActual.lng,
                    pedidoSeleccionado.lat_cliente || -34.776484410467525,
                    pedidoSeleccionado.lng_cliente || -58.29220250409459
                  ).toFixed(1) + ' km')}
              </Text>
            </View>
            <View style={estilos.mapaInfoItem}>
              <Ionicons name="time" size={18} color={Colores.secundario} />
              <Text style={estilos.mapaInfoTexto}>
                {tiempoReal ||
                  (pedidoSeleccionado && Math.ceil(
                    calcularDistancia(
                      ubicacionActual.lat,
                      ubicacionActual.lng,
                      pedidoSeleccionado.lat_cliente || -34.776484410467525,
                      pedidoSeleccionado.lng_cliente || -58.29220250409459
                    ) * 15
                  ) + ' min')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botonDetenerMapa} onPress={detenerTransmision}>
            <Ionicons name="stop-circle" size={20} color="white" />
            <Text style={estilos.botonDetenerMapaTexto}>Detener Transmisión</Text>
          </TouchableOpacity>
        </View>
      )}

      {transmitiendo && pedidoSeleccionado && (
        <View style={[estilos.tarjetaTransmision, { backgroundColor: Colores.primario + '20' }]}>
          <View style={estilos.transmisionHeader}>
            <Ionicons name="radio" size={24} color={Colores.primario} />
            <Text style={estilos.transmitiendoTexto}>Transmitiendo ubicación</Text>
            <View style={estilos.puntoVivo} />
          </View>
          <Text style={estilos.pedidoTransmision}>Pedido #{pedidoSeleccionado.id}</Text>
          <Text style={estilos.clienteTransmision}>{pedidoSeleccionado.cliente_nombre}</Text>
          <Text style={estilos.direccionTransmision}>📍 {pedidoSeleccionado.direccion || 'Sin dirección'}</Text>
          <View style={estilos.gpsInfo}>
            <Text style={estilos.gpsTexto}>
              GPS: {ubicacionActual.lat.toFixed(6)}, {ubicacionActual.lng.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={pestana === 'activos' ? pedidosActivos : pedidosEntregados}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        refreshing={cargando}
        onRefresh={cargarPedidos}
        contentContainerStyle={estilos.lista}
        renderItem={renderPedido}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Ionicons
              name={pestana === 'activos' ? 'bicycle-outline' : 'checkmark-done-outline'}
              size={60}
              color={Colores.textoGris}
            />
            <Text style={estilos.vacioTexto}>
              {pestana === 'activos' ? 'No hay pedidos pendientes' : 'No hay entregas'}
            </Text>
          </View>
        }
      />

      <Modal visible={mostrarModalCerrar} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalIcono}>🍔</Text>
            <Text style={estilos.modalTitulo}>Cerrar Sesion</Text>
            <Text style={estilos.modalTexto}>Estas seguro de que queres salir?</Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar]}
                onPress={() => {
                  console.log('❌ Cancelando cierre de sesión');
                  setMostrarModalCerrar(false);
                }}
              >
                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={confirmarCerrarSesion}
              >
                <Ionicons name="log-out-outline" size={18} color="white" />
                <Text style={estilos.modalConfirmarTexto}>Cerrar Sesion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={mostrarModalExito} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={[estilos.modal, estilos.modalExito]}>
            <Text style={estilos.modalIcono}>🎉</Text>
            <Text style={[estilos.modalTitulo, { color: Colores.primario }]}>Exito!</Text>
            <Text style={estilos.modalTexto}>{mensajeExito}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: Colores.textoClaro },
  subtitulo: { fontSize: 14, color: Colores.textoGris, marginTop: 2 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  statItem: { alignItems: 'center' },
  statValor: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro },
  statLabel: { fontSize: 11, color: Colores.textoGris, marginTop: 4 },
  pestanas: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 12, gap: 8 },
  pestana: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colores.fondoTarjeta, alignItems: 'center' },
  pestanaActiva: { backgroundColor: Colores.secundario },
  pestanaTexto: { color: Colores.textoGris, fontWeight: '600' },
  pestanaTextoActiva: { color: Colores.fondoOscuro },
  mapaContenedor: { margin: 16, backgroundColor: Colores.fondoTarjeta, borderRadius: 20, padding: 16 },
  mapa: { height: 300, borderRadius: 14, width: width - 64 },
  mapaInfo: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  mapaInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapaInfoTexto: { color: Colores.textoClaro, fontSize: 14, fontWeight: 'bold' },
  marcadorRepartidor: { alignItems: 'center', justifyContent: 'center' },
  marcadorCliente: { alignItems: 'center', justifyContent: 'center' },
  botonDetenerMapa: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colores.acento, borderRadius: 12, padding: 14, marginTop: 12, gap: 8 },
  botonDetenerMapaTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  tarjetaTransmision: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: Colores.primario },
  transmisionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  transmitiendoTexto: { fontSize: 16, fontWeight: 'bold', color: Colores.primario },
  puntoVivo: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colores.primario },
  pedidoTransmision: { fontSize: 20, fontWeight: 'bold', color: Colores.textoClaro },
  clienteTransmision: { fontSize: 14, color: Colores.textoGris, marginTop: 4 },
  direccionTransmision: { fontSize: 14, color: Colores.textoClaro, marginTop: 8 },
  gpsInfo: { backgroundColor: Colores.fondoOscuro, borderRadius: 8, padding: 8, marginTop: 12 },
  gpsTexto: { fontSize: 11, color: Colores.primario, fontFamily: 'monospace' },
  lista: { paddingHorizontal: 16, paddingBottom: 20 },
  tarjeta: { backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 16, marginBottom: 12 },
  tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  pedidoId: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  clienteNombre: { fontSize: 13, color: Colores.textoGris, marginTop: 2 },
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  estadoTexto: { fontSize: 12, fontWeight: 'bold' },
  tarjetaInfo: { marginBottom: 12 },
  tarjetaDireccion: { fontSize: 14, color: Colores.textoClaro, marginBottom: 4 },
  tarjetaTelefono: { fontSize: 14, color: Colores.textoGris, marginBottom: 2 },
  tarjetaTotal: { fontSize: 16, fontWeight: 'bold', color: Colores.primario },
  botonIniciar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colores.primario, borderRadius: 12, padding: 14, gap: 8 },
  botonIniciarTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  vacio: { alignItems: 'center', marginTop: 60 },
  vacioTexto: { color: Colores.textoGris, fontSize: 16, marginTop: 16 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 30, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: Colores.secundario + '40' },
  modalExito: { borderColor: Colores.primario },
  modalIcono: { fontSize: 60, marginBottom: 12 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 8 },
  modalTexto: { fontSize: 14, color: Colores.textoGris, textAlign: 'center', marginBottom: 24 },
  modalBotones: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBoton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalCancelar: { backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
  modalCancelarTexto: { color: Colores.textoClaro, fontWeight: 'bold' },
  modalConfirmar: { backgroundColor: Colores.acento },
  modalConfirmarTexto: { color: 'white', fontWeight: 'bold' },
});