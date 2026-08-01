import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { obtenerRutaPedido } from '../../lib/directions';

const { width } = Dimensions.get('window');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = { latitude: -34.776484410467525, longitude: -58.29220250409459 };

export default function PantallaSeguimiento(props: any) {
  const { perfil, esAdministrador } = tiendaAutenticacion();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ubicacionRepartidor, setUbicacionRepartidor] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distancia, setDistancia] = useState(0);
  const [tiempoEstimado, setTiempoEstimado] = useState('--');
  const [error, setError] = useState<string | null>(null);
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);

  const mapRef = useRef<MapView>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const pedidoId = props.route?.params?.pedidoId;

    if (!pedidoId) {
      setCargando(false);
      setError('No se especificó un pedido');
      return;
    }

    cargarPedido(pedidoId);

    if (!esAdministrador) {
      suscribirCambios(pedidoId);
    }

    return () => {
      limpiarSuscripcion();
    };
  }, []);

  // ✅ Cargar ruta guardada cuando se carga el pedido
  useEffect(() => {
    if (pedido && pedido.id) {
      const cargarRuta = async () => {
        const ruta = await obtenerRutaPedido(pedido.id);
        if (ruta && ruta.length > 0) {
          setRutaPuntos(ruta);
          console.log('✅ Ruta cargada desde Supabase');
        }
      };
      cargarRuta();
    }
  }, [pedido]);

  useEffect(() => {
    if (mapRef.current && ubicacionRepartidor && pedido) {
      const destinoCliente = {
        latitude: pedido.lat_cliente || UBICACION_KRUSTY.latitude + 0.01,
        longitude: pedido.lng_cliente || UBICACION_KRUSTY.longitude + 0.01,
      };

      mapRef.current.fitToCoordinates([ubicacionRepartidor, destinoCliente], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [ubicacionRepartidor, pedido]);

  const limpiarSuscripcion = () => {
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.log('Error removiendo canal:', e);
      }
      channelRef.current = null;
    }
    console.log('🧹 Canal Realtime liberado');
  };

  const cargarPedido = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error cargando pedido:', error);
        setError('No se pudo cargar el pedido');
        return;
      }

      if (data) {
        setPedido(data as Pedido);
        actualizarUbicacion(data as Pedido);
      }
    } catch (err) {
      console.error('Error general cargando pedido:', err);
      setError('Error al cargar el pedido');
    } finally {
      setCargando(false);
    }
  };

  const suscribirCambios = (id: number) => {
    limpiarSuscripcion();

    console.log(`📡 Suscribiendo a cambios en tiempo real del pedido #${id}...`);

    const channel = supabase
      .channel(`seguimiento_pedido_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('⚡ Cambio en tiempo real detectado:', payload.new);
          const nuevoPedido = payload.new as Pedido;
          setPedido(nuevoPedido);
          actualizarUbicacion(nuevoPedido);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Canal conectado para el pedido #${id}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error al conectar canal del pedido #${id}`);
        }
      });

    channelRef.current = channel;
  };

  const actualizarUbicacion = (p: Pedido) => {
    if (p.lat_repartidor && p.repartidor_de_lng) {
      const posRepartidor = {
        latitude: Number(p.lat_repartidor),
        longitude: Number(p.repartidor_de_lng),
      };

      setUbicacionRepartidor(posRepartidor);

      const destLat = p.lat_cliente || UBICACION_KRUSTY.latitude;
      const destLng = p.lng_cliente || UBICACION_KRUSTY.longitude;

      const dist = calcularDistancia(posRepartidor.latitude, posRepartidor.longitude, destLat, destLng);
      setDistancia(dist);
      setTiempoEstimado(Math.ceil(dist * 12) + ' min');
    }
  };

  const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const estados = [
    { key: 'pendiente', label: 'Pedido Recibido', icono: 'receipt-outline' },
    { key: 'confirmado', label: 'Confirmado', icono: 'checkmark-circle-outline' },
    { key: 'preparando', label: 'Preparando', icono: 'flame-outline' },
    { key: 'listo', label: 'Listo para entregar', icono: 'bag-check-outline' },
    { key: 'en_camino', label: 'En Camino', icono: 'bicycle-outline' },
    { key: 'entregado', label: 'Entregado', icono: 'home-outline' },
  ];

  const estadoActual = pedido?.estado || 'pendiente';
  const indiceActual = estados.findIndex((e) => e.key === estadoActual);

  const estadoColor = (estado: string) => {
    const c: any = {
      pendiente: Colores.pendiente,
      confirmado: Colores.confirmado,
      preparando: Colores.preparando,
      listo: Colores.listo,
      en_camino: Colores.enCamino,
      entregado: Colores.entregado,
      cancelado: Colores.cancelado,
    };
    return c[estado] || Colores.textoGris;
  };

  if (error) {
    return (
      <View style={estilos.centrado}>
        <Ionicons name="alert-circle-outline" size={60} color={Colores.acento} />
        <Text style={[estilos.errorTexto, { color: Colores.acento }]}>{error}</Text>
        <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
          <Text style={estilos.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color={Colores.secundario} />
        <Text style={estilos.cargandoTexto}>Cargando seguimiento...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={estilos.centrado}>
        <Ionicons name="alert-circle-outline" size={60} color={Colores.textoGris} />
        <Text style={estilos.errorTexto}>Pedido no encontrado</Text>
      </View>
    );
  }

  const destinoCliente = {
    latitude: pedido.lat_cliente || UBICACION_KRUSTY.latitude + 0.01,
    longitude: pedido.lng_cliente || UBICACION_KRUSTY.longitude + 0.01,
  };

  const posRepartidor = ubicacionRepartidor || UBICACION_KRUSTY;

  // ✅ Usar ruta guardada si existe, si no, línea recta
  const coordenadasRuta = rutaPuntos.length > 0 ? rutaPuntos : [posRepartidor, destinoCliente];

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <View style={estilos.mapaContenedor}>
        <MapView
          ref={mapRef}
          style={estilos.mapa}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: posRepartidor.latitude,
            longitude: posRepartidor.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
        >
          {/* ✅ Marcador del Local - Coordenadas Reales */}
          <Marker
            coordinate={UBICACION_KRUSTY}
            title="Krusty Burger"
            description="📍 Local"
            pinColor="#FF5722"
          />

          {/* ✅ Marcador del Repartidor (Dinámico) */}
          <Marker
            coordinate={posRepartidor}
            title="Repartidor"
            description="🚲 En camino"
            pinColor="#2196F3"
          />

          {/* ✅ Marcador del Cliente */}
          <Marker
            coordinate={destinoCliente}
            title="Destino"
            description="📍 Entrega de pedido"
            pinColor={Colores.primario}
          />

          {/* ✅ RUTA REAL CON POLYLINE */}
          <Polyline
            coordinates={coordenadasRuta}
            strokeColor={Colores.primario}
            strokeWidth={rutaPuntos.length > 0 ? 5 : 4}
            lineDashPattern={rutaPuntos.length > 0 ? [] : [5, 5]}
            lineCap="round"
            lineJoin="round"
            strokeColors={[Colores.primario, Colores.secundario, Colores.primario]}
          />
        </MapView>

        <View style={estilos.mapaInfo}>
          <View style={estilos.mapaInfoItem}>
            <Ionicons name="navigate" size={18} color={Colores.secundario} />
            <Text style={estilos.mapaInfoTexto}>{distancia.toFixed(1)} km</Text>
          </View>
          <View style={estilos.mapaInfoItem}>
            <Ionicons name="time" size={18} color={Colores.secundario} />
            <Text style={estilos.mapaInfoTexto}>{tiempoEstimado}</Text>
          </View>
        </View>
      </View>

      {estadoActual === 'en_camino' && pedido.encabezado_repartidor && (
        <View style={estilos.repartidorInfo}>
          <Ionicons name="person-circle" size={30} color={Colores.enCamino} />
          <View style={{ flex: 1 }}>
            <Text style={estilos.repartidorNombre}>{pedido.encabezado_repartidor}</Text>
            <Text style={estilos.repartidorEstado}>¡Tu pedido está en camino!</Text>
          </View>
        </View>
      )}

      <View style={[estilos.estadoActual, { backgroundColor: estadoColor(estadoActual) + '20' }]}>
        <Ionicons name={(estados[indiceActual]?.icono as any) || 'help-circle'} size={50} color={estadoColor(estadoActual)} />
        <Text style={[estilos.estadoActualTexto, { color: estadoColor(estadoActual) }]}>
          {estados[indiceActual]?.label || estadoActual}
        </Text>
        <Text style={estilos.pedidoId}>Pedido #{pedido.id}</Text>
      </View>

      <View style={estilos.timeline}>
        {estados.map((estado, index) => {
          const completado = index <= indiceActual;
          const actual = index === indiceActual;
          return (
            <View key={estado.key} style={estilos.timelineItem}>
              <View style={estilos.timelineLinea}>
                <View style={[
                  estilos.timelinePunto,
                  completado && { backgroundColor: estadoColor(estado.key) },
                  actual && estilos.timelinePuntoActual
                ]}>
                  {completado && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                {index < estados.length - 1 && (
                  <View style={[estilos.timelineBarra, completado && { backgroundColor: estadoColor(estado.key) }]} />
                )}
              </View>
              <View style={estilos.timelineInfo}>
                <Text style={[
                  estilos.timelineLabel,
                  completado && { color: Colores.textoClaro },
                  actual && { fontWeight: 'bold' }
                ]}>
                  {estado.label}
                </Text>
                {actual && <Text style={estilos.timelineAhora}>Ahora</Text>}
              </View>
            </View>
          );
        })}
      </View>

      <View style={estilos.infoPedido}>
        <Text style={estilos.infoTitulo}>Detalles del Pedido</Text>
        <View style={estilos.infoFila}>
          <Text style={estilos.infoLabel}>Total</Text>
          <Text style={estilos.infoValor}>${pedido.total?.toFixed(2)}</Text>
        </View>
        <View style={estilos.infoFila}>
          <Text style={estilos.infoLabel}>Envío</Text>
          <Text style={estilos.infoValor}>${pedido.costo_envio?.toFixed(2) || '2.99'}</Text>
        </View>
        <View style={estilos.infoFila}>
          <Text style={estilos.infoLabel}>Pago</Text>
          <Text style={estilos.infoValor}>{pedido.metodo_pago || 'Efectivo'}</Text>
        </View>

        {pedido.items_json && (
          <View style={estilos.productos}>
            <Text style={estilos.productosTitulo}>Productos</Text>
            {(() => {
              let items = pedido.items_json;
              if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
              }
              if (Array.isArray(items) && items.length > 0) {
                return items.map((item: any, index: number) => (
                  <View key={index} style={estilos.productoItem}>
                    <Text style={estilos.productoNombre}>
                      {item.nombre || item.producto_nombre || 'Producto'}
                    </Text>
                    <Text style={estilos.productoCantidad}>
                      x{item.cantidad || 1}
                    </Text>
                    <Text style={estilos.productoPrecio}>
                      ${(item.total || item.precio || item.subtotal || 0).toFixed(2)}
                    </Text>
                  </View>
                ));
              } else {
                return <Text style={estilos.productoError}>No hay productos disponibles</Text>;
              }
            })()}
          </View>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  centrado: { flex: 1, backgroundColor: Colores.fondoOscuro, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  scroll: { paddingBottom: 40 },
  cargandoTexto: { color: Colores.textoGris, marginTop: 16, fontSize: 14 },
  errorTexto: { color: Colores.textoGris, fontSize: 20, textAlign: 'center', marginTop: 20 },
  mapaContenedor: {
    margin: 16,
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  mapa: { height: 250, width: '100%', borderRadius: 14 },
  mapaInfo: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  mapaInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapaInfoTexto: { color: Colores.textoClaro, fontSize: 14, fontWeight: 'bold' },
  repartidorInfo: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colores.enCamino + '20', borderRadius: 16, padding: 14, gap: 12 },
  repartidorNombre: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  repartidorEstado: { fontSize: 13, color: Colores.enCamino, marginTop: 2 },
  estadoActual: { alignItems: 'center', padding: 30, margin: 16, borderRadius: 20 },
  estadoActualTexto: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  pedidoId: { fontSize: 14, color: Colores.textoGris, marginTop: 4 },
  timeline: { padding: 20 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineLinea: { alignItems: 'center', marginRight: 16 },
  timelinePunto: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colores.textoGris, justifyContent: 'center', alignItems: 'center' },
  timelinePuntoActual: { borderWidth: 4, borderColor: Colores.secundario },
  timelineBarra: { width: 2, height: 40, backgroundColor: Colores.textoGris, marginTop: 4 },
  timelineInfo: { flex: 1, paddingTop: 4 },
  timelineLabel: { fontSize: 16, color: Colores.textoGris },
  timelineAhora: { fontSize: 12, color: Colores.secundario, marginTop: 2 },
  infoPedido: { padding: 20, marginHorizontal: 16, backgroundColor: Colores.fondoTarjeta, borderRadius: 16 },
  infoTitulo: { fontSize: 18, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 16 },
  infoFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: Colores.textoGris },
  infoValor: { fontSize: 14, fontWeight: 'bold', color: Colores.textoClaro },
  productos: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 16 },
  productosTitulo: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 12 },
  productoItem: { flexDirection: 'row', marginBottom: 6 },
  productoNombre: { flex: 1, fontSize: 14, color: Colores.textoClaro },
  productoCantidad: { fontSize: 14, color: Colores.textoGris, marginHorizontal: 12 },
  productoPrecio: { fontSize: 14, fontWeight: 'bold', color: Colores.primario },
  productoError: { fontSize: 14, color: Colores.textoGris, textAlign: 'center', padding: 10 },
  botonVolver: { marginTop: 20, backgroundColor: Colores.secundario, padding: 14, borderRadius: 12 },
  botonVolverTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});