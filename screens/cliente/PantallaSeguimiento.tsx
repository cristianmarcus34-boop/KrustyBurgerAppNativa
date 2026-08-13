// screens/cliente/PantallaSeguimiento.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Dimensions, Animated, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { obtenerRutaPedido } from '../../lib/directions';

const { width } = Dimensions.get('window');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = {
  latitude: -34.776484410467525,
  longitude: -58.29220250409459
};

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

// ✅ FUNCIÓN PARA CALCULAR DISTANCIA (Haversine)
const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function PantallaSeguimiento(props: any) {
  const { perfil, esAdministrador } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ubicacionRepartidor, setUbicacionRepartidor] = useState<{
    latitude: number;
    longitude: number
  } | null>(null);
  const [distancia, setDistancia] = useState(0);
  const [tiempoEstimado, setTiempoEstimado] = useState('--');
  const [error, setError] = useState<string | null>(null);
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [distanciaBD, setDistanciaBD] = useState<number | null>(null);
  const [tiempoBD, setTiempoBD] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);
  const channelRef = useRef<any>(null);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

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

    return () => {
      limpiarSuscripcion();
    };
  }, []);

  // ✅ Cargar ruta guardada
  useEffect(() => {
    if (pedido && pedido.id) {
      const cargarRuta = async () => {
        const ruta = await obtenerRutaPedido(pedido.id);
        if (ruta && ruta.length > 0) {
          setRutaPuntos(ruta);
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
  };

  const cargarPedido = async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError('No se pudo cargar el pedido');
        return;
      }

      if (data) {
        setPedido(data as Pedido);
        actualizarUbicacion(data as Pedido);
        actualizarInfoEnvio(data as Pedido);
      }
    } catch (err) {
      setError('Error al cargar el pedido');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const manejarRefresh = async () => {
    if (pedido) {
      setRefrescando(true);
      await cargarPedido(pedido.id);
    }
  };

  // ✅ ACTUALIZAR INFORMACIÓN DE ENVÍO DESDE LA BD
  const actualizarInfoEnvio = (p: Pedido) => {
    if (p.distancia_km !== undefined && p.distancia_km !== null) {
      setDistanciaBD(p.distancia_km);
      setDistancia(p.distancia_km);
    }

    if (p.tiempo_estimado !== undefined && p.tiempo_estimado !== null) {
      setTiempoBD(p.tiempo_estimado);
      setTiempoEstimado(p.tiempo_estimado + ' min');
    }

    if (p.costo_envio !== undefined && p.costo_envio !== null) {
      setCostoEnvio(p.costo_envio);
    }
  };

  const suscribirCambios = (id: number) => {
    limpiarSuscripcion();

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
          const nuevoPedido = payload.new as Pedido;
          setPedido(nuevoPedido);
          actualizarUbicacion(nuevoPedido);
          actualizarInfoEnvio(nuevoPedido);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const actualizarUbicacion = (p: Pedido) => {
    if (p.lat_repartidor && p.repartidor_de_lng) {
      const posRepartidor = {
        latitude: Number(p.lat_repartidor),
        longitude: Number(p.repartidor_de_lng),
      };

      setUbicacionRepartidor(posRepartidor);

      if (!p.distancia_km && p.lat_cliente && p.lng_cliente) {
        const dist = calcularDistancia(
          posRepartidor.latitude,
          posRepartidor.longitude,
          p.lat_cliente,
          p.lng_cliente
        );
        setDistancia(dist);
      }
    }
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
      pendiente: COLORS.pendiente,
      confirmado: COLORS.confirmado,
      preparando: COLORS.preparando,
      listo: COLORS.listo,
      en_camino: COLORS.enCamino,
      entregado: COLORS.entregado,
      cancelado: COLORS.cancelado,
    };
    return c[estado] || COLORS.grisClaro;
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const mapaHeight = isTablet ? 350 : isSmallPhone ? 200 : 250;
  const tituloSize = isTablet ? 24 : isSmallPhone ? 18 : 20;
  const estadoTextSize = isTablet ? 28 : isSmallPhone ? 20 : 24;

  // ✅ Preparar coordenadas para el Polyline con validación
  const destinoCliente = {
    latitude: pedido?.lat_cliente || UBICACION_KRUSTY.latitude + 0.01,
    longitude: pedido?.lng_cliente || UBICACION_KRUSTY.longitude + 0.01,
  };

  const posRepartidor = ubicacionRepartidor || UBICACION_KRUSTY;
  const coordenadasRuta = rutaPuntos.length > 0 ? rutaPuntos : [posRepartidor, destinoCliente];
  const puntosValidos = validarCoordenadas(coordenadasRuta);

  if (error) {
    return (
      <View style={estilos.centrado}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.rojo} />
        <Text style={[estilos.errorTexto, { color: COLORS.rojo }]}>{error}</Text>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
            style={estilos.botonVolverGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.negro} />
            <Text style={estilos.botonVolverTexto}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color={COLORS.amarillo} />
        <Text style={estilos.cargandoTexto}>Cargando seguimiento...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={estilos.centrado}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.grisClaro} />
        <Text style={estilos.errorTexto}>Pedido no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scroll,
          {
            paddingBottom: insets.bottom + 20,
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={COLORS.amarillo}
            colors={[COLORS.amarillo]}
          />
        }
      >
        {/* ✅ TÍTULO */}
        <Animated.View style={[
          estilos.header,
          {
            paddingHorizontal: paddingHorizontal,
            paddingTop: insets.top + (isTablet ? 20 : 10),
            paddingBottom: isTablet ? 16 : 10,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          <TouchableOpacity
            style={estilos.botonVolverHeader}
            onPress={() => props.navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
          </TouchableOpacity>
          <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
            📍 Seguimiento
          </Text>
          <View style={{ width: isTablet ? 28 : 24 }} />
        </Animated.View>

        {/* ✅ MAPA CON MOTO DEL REPARTIDOR */}
        <Animated.View style={[
          estilos.mapaContenedor,
          {
            marginHorizontal: paddingHorizontal,
            borderRadius: isTablet ? 24 : isSmallPhone ? 14 : 18,
            padding: isTablet ? 20 : isSmallPhone ? 12 : 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          <MapView
            ref={mapRef}
            style={[estilos.mapa, { height: mapaHeight, borderRadius: isTablet ? 18 : isSmallPhone ? 10 : 14 }]}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: posRepartidor.latitude,
              longitude: posRepartidor.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={false}
          >
            {/* 📍 Krusty Burger */}
            <Marker
              coordinate={UBICACION_KRUSTY}
              title="Krusty Burger"
              description="📍 Local"
              pinColor="#FF5722"
            />

            {/* 🛵 REPARTIDOR CON MOTO */}
            {/* 🛵 REPARTIDOR CON MOTO - VERSIÓN MEJORADA */}
            <Marker coordinate={posRepartidor}>
              <View style={estilos.motoWrapper}>
                <View style={estilos.motoCircle}>
                  <Ionicons name="bicycle" size={isTablet ? 30 : 24} color="#000000" />
                </View>
                <View style={estilos.motoPulseOuter} />
                <View style={estilos.motoPulseInner} />
              </View>
            </Marker>

            {/* 📍 DESTINO CLIENTE */}
            <Marker
              coordinate={destinoCliente}
              title="Destino"
              description="📍 Entrega de pedido"
              pinColor={COLORS.amarillo}
            />

            {/* 🗺️ RUTA */}
            {puntosValidos && (
              <Polyline
                coordinates={coordenadasRuta}
                strokeColor={COLORS.amarillo}
                strokeWidth={rutaPuntos.length > 0 ? 5 : 4}
                lineDashPattern={rutaPuntos.length > 0 ? [] : [5, 5]}
                lineCap="round"
                lineJoin="round"
                strokeColors={[COLORS.amarillo, COLORS.amarilloOscuro, COLORS.amarillo]}
              />
            )}
          </MapView>

          {/* ✅ INFORMACIÓN DE ENVÍO EN EL MAPA */}
          <View style={estilos.mapaInfo}>
            <View style={estilos.mapaInfoItem}>
              <Ionicons name="navigate" size={isTablet ? 22 : 18} color={COLORS.amarillo} />
              <Text style={[estilos.mapaInfoTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                📏 {distancia.toFixed(1)} km
              </Text>
            </View>
            <View style={estilos.mapaInfoItem}>
              <Ionicons name="time" size={isTablet ? 22 : 18} color={COLORS.amarillo} />
              <Text style={[estilos.mapaInfoTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                ⏱️ {tiempoEstimado}
              </Text>
            </View>
            <View style={estilos.mapaInfoItem}>
              <Ionicons name="cash" size={isTablet ? 22 : 18} color={COLORS.verdeClaro} />
              <Text style={[estilos.mapaInfoTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                💰 ${costoEnvio.toFixed(2)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ✅ REPARTIDOR INFO */}
        {estadoActual === 'en_camino' && pedido.encabezado_repartidor && (
          <Animated.View style={[
            estilos.repartidorInfo,
            {
              marginHorizontal: paddingHorizontal,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
              padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }
          ]}>
            <Ionicons name="person-circle" size={isTablet ? 36 : 30} color={COLORS.enCamino} />
            <View style={{ flex: 1 }}>
              <Text style={[estilos.repartidorNombre, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                {pedido.encabezado_repartidor}
              </Text>
              <Text style={[estilos.repartidorEstado, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                ¡Tu pedido está en camino! 🚀
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ✅ ESTADO ACTUAL */}
        <Animated.View style={[
          estilos.estadoActual,
          {
            marginHorizontal: paddingHorizontal,
            padding: isTablet ? 36 : isSmallPhone ? 20 : 30,
            borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 20,
            backgroundColor: estadoColor(estadoActual) + '20',
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          <Ionicons
            name={(estados[indiceActual]?.icono as any) || 'help-circle'}
            size={isTablet ? 64 : isSmallPhone ? 40 : 50}
            color={estadoColor(estadoActual)}
          />
          <Text style={[
            estilos.estadoActualTexto,
            {
              fontSize: estadoTextSize,
              color: estadoColor(estadoActual),
            }
          ]}>
            {estados[indiceActual]?.label || estadoActual}
          </Text>
          <Text style={[estilos.pedidoId, { fontSize: isTablet ? 16 : isSmallPhone ? 11 : 14 }]}>
            Pedido #{pedido.id}
          </Text>
        </Animated.View>

        {/* ✅ TIMELINE */}
        <Animated.View style={[
          estilos.timeline,
          {
            paddingHorizontal: isTablet ? 36 : isSmallPhone ? 16 : 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          {estados.map((estado, index) => {
            const completado = index <= indiceActual;
            const actual = index === indiceActual;
            return (
              <View key={estado.key} style={estilos.timelineItem}>
                <View style={estilos.timelineLinea}>
                  <View style={[
                    estilos.timelinePunto,
                    {
                      backgroundColor: completado ? estadoColor(estado.key) : COLORS.grisOscuro,
                      borderColor: completado ? estadoColor(estado.key) : COLORS.gris,
                      width: isTablet ? 34 : isSmallPhone ? 24 : 28,
                      height: isTablet ? 34 : isSmallPhone ? 24 : 28,
                      borderRadius: isTablet ? 17 : isSmallPhone ? 12 : 14,
                    },
                    actual && estilos.timelinePuntoActual
                  ]}>
                    {completado && <Ionicons name="checkmark" size={isTablet ? 18 : isSmallPhone ? 12 : 14} color="white" />}
                  </View>
                  {index < estados.length - 1 && (
                    <View style={[
                      estilos.timelineBarra,
                      {
                        backgroundColor: completado ? estadoColor(estado.key) : COLORS.gris,
                        height: isTablet ? 50 : isSmallPhone ? 30 : 40,
                      }
                    ]} />
                  )}
                </View>
                <View style={estilos.timelineInfo}>
                  <Text style={[
                    estilos.timelineLabel,
                    {
                      fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16,
                      color: completado ? COLORS.blanco : COLORS.grisClaro,
                    },
                    actual && { fontWeight: 'bold' }
                  ]}>
                    {estado.label}
                  </Text>
                  {actual && (
                    <Text style={[estilos.timelineAhora, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                      Ahora
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* ✅ INFO PEDIDO */}
        <Animated.View style={[
          estilos.infoPedido,
          {
            marginHorizontal: paddingHorizontal,
            padding: isTablet ? 24 : isSmallPhone ? 14 : 18,
            borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          <Text style={[estilos.infoTitulo, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
            📋 Detalles del Pedido
          </Text>

          <View style={estilos.infoFila}>
            <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Total</Text>
            <Text style={[estilos.infoValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              ${pedido.total?.toFixed(2)}
            </Text>
          </View>

          <View style={estilos.infoFila}>
            <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Envío</Text>
            <Text style={[
              estilos.infoValor,
              {
                fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                color: costoEnvio > 0 ? COLORS.verdeClaro : COLORS.grisClaro
              }
            ]}>
              {costoEnvio > 0 ? `$${costoEnvio.toFixed(2)}` : 'Gratis'}
            </Text>
          </View>

          {distanciaBD !== null && (
            <View style={estilos.infoFila}>
              <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Distancia</Text>
              <Text style={[estilos.infoValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                {distanciaBD.toFixed(1)} km
              </Text>
            </View>
          )}

          {tiempoBD !== null && (
            <View style={estilos.infoFila}>
              <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Tiempo estimado</Text>
              <Text style={[estilos.infoValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                {tiempoBD} min
              </Text>
            </View>
          )}

          <View style={estilos.infoFila}>
            <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Pago</Text>
            <Text style={[estilos.infoValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              {pedido.metodo_pago || 'Efectivo'}
            </Text>
          </View>

          <View style={estilos.infoFila}>
            <Text style={[estilos.infoLabel, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Entrega</Text>
            <Text style={[estilos.infoValor, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              {pedido.tipo_entrega === 'retiro' ? '📦 Retiro en local' : '🚚 Domicilio'}
            </Text>
          </View>

          {pedido.items_json && (
            <View style={estilos.productos}>
              <Text style={[estilos.productosTitulo, { fontSize: isTablet ? 17 : isSmallPhone ? 14 : 15 }]}>
                🍔 Productos
              </Text>
              {(() => {
                let items = pedido.items_json;
                if (typeof items === 'string') {
                  try { items = JSON.parse(items); }
                  catch (e) { items = []; }
                }
                if (Array.isArray(items) && items.length > 0) {
                  return items.map((item: any, index: number) => (
                    <View key={index} style={estilos.productoItem}>
                      <Text style={[estilos.productoNombre, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                        {item.nombre || item.producto_nombre || 'Producto'}
                      </Text>
                      <Text style={[estilos.productoCantidad, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                        x{item.cantidad || 1}
                      </Text>
                      <Text style={[estilos.productoPrecio, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
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
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  centrado: {
    flex: 1,
    backgroundColor: COLORS.negro,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '10',
  },
  botonVolverHeader: {
    padding: 4,
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  cargandoTexto: {
    color: COLORS.grisClaro,
    marginTop: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  errorTexto: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  mapaContenedor: {
    backgroundColor: COLORS.negro + '60',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    marginTop: 12,
  },
  mapa: {
    width: '100%',
  },
  mapaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  mapaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapaInfoTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  repartidorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.enCamino + '15',
    borderWidth: 1,
    borderColor: COLORS.enCamino + '20',
    marginTop: 12,
    gap: 12,
  },
  repartidorNombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  repartidorEstado: {
    color: COLORS.enCamino,
    marginTop: 2,
    fontWeight: '500',
  },
  estadoActual: {
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
  },
  estadoActualTexto: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  pedidoId: {
    color: COLORS.grisClaro,
    marginTop: 4,
    opacity: 0.6,
  },
  timeline: {
    paddingVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLinea: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelinePunto: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePuntoActual: {
    borderWidth: 3,
    borderColor: COLORS.amarillo,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineBarra: {
    width: 2,
    marginTop: 2,
  },
  timelineInfo: {
    flex: 1,
    paddingTop: 2,
  },
  timelineLabel: {
    fontWeight: '500',
  },
  timelineAhora: {
    color: COLORS.amarillo,
    marginTop: 2,
    fontWeight: '600',
  },
  infoPedido: {
    backgroundColor: COLORS.negro + '60',
    borderWidth: 1,
    borderColor: COLORS.blanco + '8',
    marginTop: 12,
  },
  infoTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 12,
  },
  infoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: COLORS.grisClaro,
    opacity: 0.7,
  },
  infoValor: {
    fontWeight: '600',
    color: COLORS.blanco,
  },
  productos: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.blanco + '8',
    paddingTop: 12,
  },
  productosTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 8,
  },
  productoItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '5',
  },
  productoNombre: {
    flex: 1,
    color: COLORS.grisClaro,
  },
  productoCantidad: {
    color: COLORS.grisClaro,
    marginHorizontal: 10,
    opacity: 0.6,
  },
  productoPrecio: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  productoError: {
    fontSize: 14,
    color: COLORS.grisClaro,
    textAlign: 'center',
    padding: 10,
    opacity: 0.6,
  },
  botonVolver: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
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
    fontSize: 16,
  },
  // ✅ ESTILOS PARA EL MARCADOR DE MOTO
  motoMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  motoGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  motoGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
    zIndex: -1,
  },
  motoPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    zIndex: -2,
  },
  // ✅ ESTILOS PARA EL MARCADOR DE MOTO (VERSIÓN MEJORADA)
  motoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  motoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 2,
  },
  motoPulseOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
    zIndex: 1,
  },
  motoPulseInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    zIndex: 0,
  },
});