// screens/cliente/PantallaSeguimiento.tsx - CON SIMPSONFONT Y TEMA CLARO
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { obtenerRutaPedido, obtenerInfoRutaPedido } from '../../lib/directions';
import { formatearPrecio } from '../../lib/formateador';

// ✅ MARCADORES
import { MarcadorMoto } from '../../components/Mapa/MarcadorMoto';
import { MarcadorDestino } from '../../components/Mapa/MarcadorDestino';
import { MarcadorPersonalizado } from '../../components/Mapa/MarcadorPersonalizado';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = {
  latitude: -34.776484410467525,
  longitude: -58.29220250409459,
};
const COLOR_RUTA_SUGERIDA = '#3978D4';

interface PuntoRecorrido {
  id: number;
  latitude: number;
  longitude: number;
  registrado_en: string;
}

const combinarPuntosRecorrido = (actuales: PuntoRecorrido[], nuevos: PuntoRecorrido[]) => {
  const puntosPorId = new Map(actuales.map((punto) => [punto.id, punto]));
  nuevos.forEach((punto) => puntosPorId.set(punto.id, punto));
  return Array.from(puntosPorId.values())
    .sort((a, b) => Date.parse(a.registrado_en) - Date.parse(b.registrado_en))
    .slice(-1000);
};

// ============================================================
// 📋 FUNCIONES AUXILIARES
// ============================================================
const validarCoordenadas = (coords: { latitude: number; longitude: number }[]) => {
  if (!coords || coords.length < 2) return false;
  return coords.every((coord) =>
    coord.latitude !== undefined &&
    coord.longitude !== undefined &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude) &&
    Math.abs(coord.latitude) <= 90 &&
    Math.abs(coord.longitude) <= 180
  );
};

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

// ============================================================
// 🎨 COLORES DE ESTADOS
// ============================================================
const ESTADO_COLORES: Record<string, string> = {
  pendiente: '#FF9800',
  confirmado: '#2196F3',
  preparando: '#9C27B0',
  listo: '#43A047',
  en_camino: '#E53935',
  entregado: '#43A047',
  cancelado: '#E53935',
};

const ESTADO_COLORES_TEXTO: Record<string, string> = {
  pendiente: '#FF9800',
  confirmado: '#2196F3',
  preparando: '#9C27B0',
  listo: '#43A047',
  en_camino: '#E53935',
  entregado: '#43A047',
  cancelado: '#E53935',
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaSeguimiento(props: any) {
  // ✅ NUEVO: sesion + cargandoAuth
  const { perfil, sesion, esAdministrador, cargando: cargandoAuth } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { width } = useWindowDimensions();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ubicacionRepartidor, setUbicacionRepartidor] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distancia, setDistancia] = useState(0);
  const [tiempoEstimado, setTiempoEstimado] = useState('--');
  const [error, setError] = useState<string | null>(null);
  const [rutaPuntos, setRutaPuntos] = useState<{ latitude: number; longitude: number }[]>([]);
  const [rutaRecorrida, setRutaRecorrida] = useState<PuntoRecorrido[]>([]);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [distanciaBD, setDistanciaBD] = useState<number | null>(null);
  const [tiempoBD, setTiempoBD] = useState<number | null>(null);
  const [montoPago, setMontoPago] = useState<number | null>(null);
  const [vuelto, setVuelto] = useState<number | null>(null);
  const [direccionCliente, setDireccionCliente] = useState<string>('');
  const [rutaCargada, setRutaCargada] = useState(false);
  const [generandoTicket, setGenerandoTicket] = useState(false);
  const [noAutorizado, setNoAutorizado] = useState(false);   // ✅ NUEVO

  // ✅ DETALLES DE PRECIOS
  const [subtotal, setSubtotal] = useState(0);
  const [descuentoNivel, setDescuentoNivel] = useState(0);
  const [descuentoCupon, setDescuentoCupon] = useState(0);
  const [descuentoPuntos, setDescuentoPuntos] = useState(0);
  const [totalFinal, setTotalFinal] = useState(0);
  const [nivelCliente, setNivelCliente] = useState('Bronce');
  const [envioGratis, setEnvioGratis] = useState(false);
  const [metodoPago, setMetodoPago] = useState('');

  const mapRef = useRef<MapView>(null);
  const channelRef = useRef<any>(null);
  const mapaListoRef = useRef(false);
  const pedidoEncuadradoRef = useRef<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = responsive.getEspaciado('LG');

  const mapaHeight = responsive.getValor({ tablet: 350, normal: 250, small: 200 });
  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 17 });
  const estadoTextSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });

  // ============================================================
  // 🔒 GUARD DE SESIÓN
  // ============================================================
  useEffect(() => {
    if (!cargandoAuth && !sesion) {
      console.log('🔒 [Seguimiento] Sin sesión → redirigiendo a Login');

      Alert.alert(
        'Iniciá sesión',
        'Necesitás una cuenta para ver el seguimiento del pedido.',
        [
          {
            text: 'Volver',
            style: 'cancel',
            onPress: () => props.navigation.goBack(),
          },
          {
            text: 'Iniciar sesión',
            onPress: () => props.navigation.replace('Login'),
          },
        ],
        { cancelable: false }
      );
    }
  }, [sesion, cargandoAuth]);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    // ✅ No cargar si no hay sesión
    if (!sesion) return;

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    return () => {
      limpiarSuscripcion();
    };
  }, [sesion]);

  // ✅ CARGAR RUTA DESDE LA DB
  useEffect(() => {
    if (!pedido?.id) return;
    let cancelado = false;
    setRutaPuntos([]);
    setRutaCargada(false);

    const cargarRuta = async () => {
      const ruta = Array.isArray(pedido.ruta_puntos) && pedido.ruta_puntos.length > 1
        ? pedido.ruta_puntos
        : await obtenerRutaPedido(pedido.id);

      if (cancelado) return;

      if (ruta && ruta.length > 1) {
        setRutaPuntos(ruta);
        setRutaCargada(true);

        const infoRuta = await obtenerInfoRutaPedido(pedido.id);
        if (!cancelado && infoRuta) {
          setDistancia(parseFloat(infoRuta.distancia) || 0);
          setTiempoEstimado(infoRuta.duracion);
          setDistanciaBD(parseFloat(infoRuta.distancia) || 0);
          setTiempoBD(parseInt(infoRuta.duracion) || 0);
        }
        return;
      }

      const destino = {
        latitude: pedido.lat_cliente ?? UBICACION_KRUSTY.latitude + 0.01,
        longitude: pedido.lng_cliente ?? UBICACION_KRUSTY.longitude + 0.01,
      };
      setRutaPuntos([
        ubicacionRepartidor || UBICACION_KRUSTY,
        destino,
      ]);
      setRutaCargada(true);
    };

    cargarRuta().catch((errorRuta) => {
      console.error('No se pudo cargar la ruta sugerida:', errorRuta);
    });

    return () => {
      cancelado = true;
    };
  }, [pedido?.id]);

  useEffect(() => {
    if (!pedido?.id) return;
    let cancelado = false;
    const pedidoId = pedido.id;
    setRutaRecorrida([]);
    pedidoEncuadradoRef.current = null;

    const cargarRecorrido = async () => {
      const { data, error: errorRecorrido } = await supabase
        .from('seguimiento_pedidos')
        .select('id, latitud, longitud, registrado_en')
        .eq('pedido_id', pedidoId)
        .order('registrado_en', { ascending: true })
        .limit(1000);

      if (errorRecorrido) throw errorRecorrido;
      if (cancelado) return;

      setRutaRecorrida((actuales) => combinarPuntosRecorrido(
        actuales,
        (data || []).map((punto) => ({
          id: Number(punto.id),
          latitude: Number(punto.latitud),
          longitude: Number(punto.longitud),
          registrado_en: punto.registrado_en,
        }))
      ));
    };

    cargarRecorrido().catch((errorRecorrido) => {
      console.error('No se pudo cargar el recorrido del repartidor:', errorRecorrido);
    });

    return () => {
      cancelado = true;
    };
  }, [pedido?.id]);

  // ============================================================
  // 🔄 FUNCIONES
  // ============================================================
  const limpiarSuscripcion = () => {
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (e) { }
      channelRef.current = null;
    }
  };

  const cargarPedido = async (id: number) => {
    try {
      const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).single();

      if (error) { setError('No se pudo cargar el pedido'); return; }

      if (data) {
        // ✅ VALIDACIÓN DE OWNERSHIP
        const esMio = data.id_de_usuario === perfil?.id;
        if (!esMio && !esAdministrador) {
          console.warn('⛔ [Seguimiento] Pedido no pertenece al usuario');
          setNoAutorizado(true);
          setError('No tenés permiso para ver este pedido');
          return;
        }

        setPedido(data as Pedido);
        extraerDireccion(data as Pedido);
        actualizarUbicacion(data as Pedido);
        actualizarInfoEnvio(data as Pedido);
        actualizarPagoEfectivo(data as Pedido);
        extraerDatosPrecios(data as Pedido);
      }
    } catch (err) {
      setError('Error al cargar el pedido');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const extraerDireccion = (p: Pedido) => {
    if (p.lat_cliente && p.lng_cliente) {
      if (p.direccion && !p.direccion.includes('Sin dirección')) {
        setDireccionCliente(p.direccion);
      } else {
        setDireccionCliente(`📍 ${p.lat_cliente.toFixed(6)}, ${p.lng_cliente.toFixed(6)}`);
      }
    } else if (p.direccion) {
      setDireccionCliente(p.direccion);
    } else {
      setDireccionCliente('📍 No especificada');
    }
  };

  const extraerDatosPrecios = (p: Pedido) => {
    setSubtotal(p.total_parcial || p.total || 0);
    setDescuentoNivel(p.descuento_nivel || 0);
    setDescuentoCupon(p.descuento_cupon || 0);
    setDescuentoPuntos(p.descuento_puntos || 0);
    setTotalFinal(p.total || 0);
    setNivelCliente(p.nivel_cliente || 'Bronce');
    setEnvioGratis(p.envio_gratis || false);
    setMetodoPago(p.metodo_pago || 'Efectivo');
    setCostoEnvio(p.costo_envio || 0);
  };

  const manejarRefresh = async () => {
    if (pedido) {
      setRefrescando(true);
      await cargarPedido(pedido.id);
    }
  };

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

  const actualizarPagoEfectivo = (p: Pedido) => {
    if (p.metodo_pago === 'efectivo') {
      if (p.monto_pago !== undefined && p.monto_pago !== null) setMontoPago(p.monto_pago);
      if (p.vuelto !== undefined && p.vuelto !== null) setVuelto(p.vuelto);
    }
  };

  const suscribirCambios = (id: number) => {
    limpiarSuscripcion();

    const channel = supabase
      .channel(`seguimiento_pedido_${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        (payload) => {
          const nuevoPedido = payload.new as Pedido;
          setPedido(nuevoPedido);
          extraerDireccion(nuevoPedido);
          actualizarUbicacion(nuevoPedido);
          actualizarInfoEnvio(nuevoPedido);
          actualizarPagoEfectivo(nuevoPedido);
          extraerDatosPrecios(nuevoPedido);
          if (Array.isArray(nuevoPedido.ruta_puntos) && nuevoPedido.ruta_puntos.length > 1) {
            setRutaPuntos(nuevoPedido.ruta_puntos);
            setRutaCargada(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'seguimiento_pedidos',
          filter: `pedido_id=eq.${id}`,
        },
        (payload) => {
          const punto = payload.new as {
            id: number;
            latitud: number;
            longitud: number;
            registrado_en: string;
          };
          if (
            !Number.isFinite(Number(punto.latitud)) ||
            !Number.isFinite(Number(punto.longitud))
          ) return;

          setRutaRecorrida((actuales) => combinarPuntosRecorrido(actuales, [{
            id: Number(punto.id),
            latitude: Number(punto.latitud),
            longitude: Number(punto.longitud),
            registrado_en: punto.registrado_en,
          }]));
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const actualizarUbicacion = (p: Pedido) => {
    if (p.lat_repartidor !== null && p.lat_repartidor !== undefined &&
        p.repartidor_de_lng !== null && p.repartidor_de_lng !== undefined) {
      const posRepartidor = {
        latitude: Number(p.lat_repartidor),
        longitude: Number(p.repartidor_de_lng),
      };
      setUbicacionRepartidor(posRepartidor);

      if (!p.distancia_km && p.lat_cliente !== null && p.lat_cliente !== undefined &&
          p.lng_cliente !== null && p.lng_cliente !== undefined) {
        const dist = calcularDistancia(
          posRepartidor.latitude, posRepartidor.longitude,
          p.lat_cliente, p.lng_cliente
        );
        setDistancia(dist);
      }
    }
  };

  // ============================================================
  // ✅ GENERAR TICKET
  // ============================================================
  const generarTicketHTML = () => {
    const items = pedido?.items_json || [];
    const itemsHTML = items.map((item: any) => `
      <tr>
        <td style="padding:8px 4px; border-bottom:1px solid #eee;">${item.nombre || 'Producto'}</td>
        <td style="padding:8px 4px; border-bottom:1px solid #eee; text-align:center;">x${item.cantidad || 1}</td>
        <td style="padding:8px 4px; border-bottom:1px solid #eee; text-align:right;">${formatearPrecio(item.total || 0)}</td>
      </tr>
    `).join('');

    const descuentosHTML = [];
    if (descuentoNivel > 0) {
      descuentosHTML.push(`
        <tr>
          <td style="padding:4px 4px; color:#E53935;">🏷️ Descuento ${nivelCliente} (${Math.round((descuentoNivel / subtotal) * 100)}%)</td>
          <td style="padding:4px 4px; text-align:right; color:#E53935;">-${formatearPrecio(descuentoNivel)}</td>
        </tr>
      `);
    }
    if (descuentoCupon > 0) {
      descuentosHTML.push(`
        <tr>
          <td style="padding:4px 4px; color:#43A047;">🎟️ Descuento cupón</td>
          <td style="padding:4px 4px; text-align:right; color:#43A047;">-${formatearPrecio(descuentoCupon)}</td>
        </tr>
      `);
    }
    if (descuentoPuntos > 0) {
      descuentosHTML.push(`
        <tr>
          <td style="padding:4px 4px; color:#FF9800;">⭐ Descuento por puntos</td>
          <td style="padding:4px 4px; text-align:right; color:#FF9800;">-${formatearPrecio(descuentoPuntos)}</td>
        </tr>
      `);
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket de Pedido #${pedido?.id}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f5f2ed; 
            display: flex; 
            justify-content: center; 
            padding: 20px;
          }
          .ticket {
            max-width: 380px;
            width: 100%;
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #F5C518;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .header h1 { 
            font-size: 24px; 
            color: #E53935; 
            letter-spacing: 1px;
          }
          .header p { 
            color: #666; 
            font-size: 12px; 
            margin-top: 4px; 
          }
          .pedido-info {
            background: #f8f6f2;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 16px;
          }
          .pedido-info .row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }
          .pedido-info .label { color: #888; }
          .pedido-info .value { font-weight: 600; color: #1a1a1a; }
          .productos { margin-bottom: 16px; }
          .productos table { width: 100%; border-collapse: collapse; }
          .productos th { 
            text-align: left; 
            font-size: 12px; 
            color: #888; 
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
          }
          .productos th:last-child { text-align: right; }
          .productos td { font-size: 13px; color: #1a1a1a; }
          .totales { 
            border-top: 2px solid #F5C518; 
            padding-top: 12px; 
            margin-top: 4px;
          }
          .totales .row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 14px;
          }
          .totales .total {
            font-size: 18px;
            font-weight: 700;
            color: #E53935;
            border-top: 2px solid #eee;
            padding-top: 8px;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #888;
          }
          .footer .gracias { color: #E53935; font-weight: 600; font-size: 14px; }
          .metodo-pago {
            background: #E53935;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            text-align: center;
            margin-top: 12px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>🍔 Krusty Burger</h1>
            <p>"El Jefe tiene la última palabra"</p>
            <p style="font-size:11px; color:#999; margin-top:4px;">Pedido #${pedido?.id} • ${new Date(pedido?.creado_en || '').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="pedido-info">
            <div class="row"><span class="label">Cliente</span><span class="value">${pedido?.cliente_nombre || 'Cliente'}</span></div>
            <div class="row"><span class="label">Teléfono</span><span class="value">${pedido?.telefono || 'No especificado'}</span></div>
            <div class="row"><span class="label">📍 Dirección</span><span class="value">${direccionCliente}</span></div>
            <div class="row"><span class="label">👑 Nivel</span><span class="value">${nivelCliente}</span></div>
            <div class="row"><span class="label">🚚 Envío</span><span class="value">${envioGratis ? '✅ Gratis' : formatearPrecio(costoEnvio)}</span></div>
          </div>

          <div class="productos">
            <table>
              <thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Total</th></tr></thead>
              <tbody>${itemsHTML}</tbody>
            </table>
          </div>

          <div class="totales">
            <div class="row"><span>Subtotal</span><span>${formatearPrecio(subtotal)}</span></div>
            ${descuentosHTML.join('')}
            <div class="row"><span>🚚 Envío</span><span>${envioGratis ? '✅ Gratis' : formatearPrecio(costoEnvio)}</span></div>
            <div class="row total"><span>Total</span><span>${formatearPrecio(totalFinal)}</span></div>
          </div>

          <div class="metodo-pago">
            ${metodoPago === 'efectivo' && montoPago ? `💰 Efectivo - Pagó ${formatearPrecio(montoPago)} ${vuelto ? `(Vuelto ${formatearPrecio(vuelto)})` : ''}` : `💳 ${metodoPago || 'Efectivo'}`}
          </div>

          <div class="footer">
            <p class="gracias">¡Gracias por tu compra! 🍔</p>
            <p style="margin-top:4px;">© 2026 Krusty Burger - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generarTicket = async () => {
    if (!pedido) return;
    setGenerandoTicket(true);
    try {
      const html = generarTicketHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Ticket Pedido #${pedido.id}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Descargar Ticket', `El ticket se guardó en: ${uri}`);
      }
    } catch (error) {
      console.error('Error generando ticket:', error);
      Alert.alert('Error', 'No se pudo generar el ticket');
    } finally {
      setGenerandoTicket(false);
    }
  };

  // ============================================================
  // 📋 ESTADOS
  // ============================================================
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

  const estadoColor = (estado: string) => ESTADO_COLORES[estado] || DISENO.colors.textSecondary;

  const destinoCliente = {
    latitude: pedido?.lat_cliente ?? UBICACION_KRUSTY.latitude + 0.01,
    longitude: pedido?.lng_cliente ?? UBICACION_KRUSTY.longitude + 0.01,
  };

  const posRepartidor = ubicacionRepartidor || UBICACION_KRUSTY;
  const coordenadasRuta = rutaPuntos.length > 1 ? rutaPuntos : [posRepartidor, destinoCliente];
  const puntosValidos = validarCoordenadas(coordenadasRuta);
  const coordenadasRecorrido = rutaRecorrida.map(({ latitude, longitude }) => ({
    latitude,
    longitude,
  }));

  const centrarMapaEnSeguimiento = () => {
    const puntos = [
      UBICACION_KRUSTY,
      ...coordenadasRuta,
      ...coordenadasRecorrido,
      posRepartidor,
      destinoCliente,
    ];
    const unicos = Array.from(
      new Map(puntos.map((punto) => [`${punto.latitude}:${punto.longitude}`, punto])).values()
    );
    if (unicos.length < 2) return;

    mapRef.current?.fitToCoordinates(unicos, {
      edgePadding: { top: 56, right: 48, bottom: 56, left: 48 },
      animated: true,
    });
  };

  const manejarMapaListo = () => {
    mapaListoRef.current = true;
    if (
      pedido &&
      pedidoEncuadradoRef.current !== pedido.id &&
      (rutaCargada || ubicacionRepartidor)
    ) {
      pedidoEncuadradoRef.current = pedido.id;
      requestAnimationFrame(centrarMapaEnSeguimiento);
    }
  };

  useEffect(() => {
    if (!pedido || !mapaListoRef.current || pedidoEncuadradoRef.current === pedido.id) return;
    if (!rutaCargada && !ubicacionRepartidor) return;

    pedidoEncuadradoRef.current = pedido.id;
    requestAnimationFrame(centrarMapaEnSeguimiento);
  }, [pedido?.id, rutaCargada, ubicacionRepartidor, rutaPuntos, rutaRecorrida.length]);

  // ============================================================
  // 🔒 RENDER TEMPRANO: invitado o cargando auth → spinner
  // ============================================================
  if (cargandoAuth || !sesion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DISENO.colors.accent} />
        <Text style={styles.loadingText}>
          {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
        </Text>
      </View>
    );
  }

  // ============================================================
  // ⛔ NO AUTORIZADO
  // ============================================================
  if (noAutorizado) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={60} color={DISENO.colors.accent} />
        <Text style={[styles.errorText, { color: DISENO.colors.accent, marginTop: 12 }]}>
          No tenés permiso para ver este pedido
        </Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => props.navigation.goBack()} activeOpacity={0.7}>
          <LinearGradient colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]} style={styles.botonVolverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="arrow-back" size={20} color={DISENO.colors.text} />
            <Text style={styles.botonVolverTexto}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // ⚠️ PANTALLAS DE ESTADO
  // ============================================================
  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={60} color={DISENO.colors.accent} />
        <Text style={[styles.errorText, { color: DISENO.colors.accent }]}>{error}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => props.navigation.goBack()} activeOpacity={0.7}>
          <LinearGradient colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]} style={styles.botonVolverGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="arrow-back" size={20} color={DISENO.colors.text} />
            <Text style={styles.botonVolverTexto}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={DISENO.colors.accent} />
        <Text style={styles.loadingText}>Cargando seguimiento...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={60} color={DISENO.colors.textTertiary} />
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={styles.container}>
      {/* ✅ FONDO TEMA CLARO */}
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={manejarRefresh} tintColor={DISENO.colors.accent} colors={[DISENO.colors.accent]} />
        }
      >
        {/* ✅ HEADER */}
        <Animated.View style={[styles.header, {
          paddingHorizontal: padding,
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingBottom: isTablet ? 16 : 10,
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => props.navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={isTablet ? 26 : 22} color={DISENO.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: tituloSize }]}>📍 Seguimiento</Text>
          <View style={{ width: isTablet ? 26 : 22 }} />
        </Animated.View>

        {/* ✅ MAPA */}
        <Animated.View style={[styles.mapContainer, {
          marginHorizontal: padding,
          borderRadius: isTablet ? 24 : 16,
          padding: isTablet ? 20 : 12,
          backgroundColor: DISENO.colors.surface,
          borderWidth: 1,
          borderColor: DISENO.colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
          ...DISENO.shadow.sm,
        }]}>
          <View style={[styles.mapFrame, { height: mapaHeight, borderRadius: isTablet ? 18 : 12 }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: posRepartidor.latitude,
                longitude: posRepartidor.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={false}
              onMapReady={manejarMapaListo}
            >
              <Marker coordinate={UBICACION_KRUSTY}>
                <MarcadorPersonalizado color={DISENO.colors.accent} size="small" showRing={false} />
              </Marker>
              <Marker coordinate={posRepartidor}>
                <MarcadorMoto size="normal" animated={true} />
              </Marker>
              <Marker coordinate={destinoCliente}>
                <MarcadorDestino size="normal" />
              </Marker>
              {puntosValidos && rutaCargada && (
                <Polyline
                  coordinates={coordenadasRuta}
                  strokeColor={COLOR_RUTA_SUGERIDA}
                  strokeWidth={5}
                  lineDashPattern={[12, 8]}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {coordenadasRecorrido.length > 1 && (
                <Polyline
                  coordinates={coordenadasRecorrido}
                  strokeColor={DISENO.colors.accent}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Encuadrar ruta y ubicación del repartidor"
              onPress={centrarMapaEnSeguimiento}
              style={styles.mapRecenterButton}
              activeOpacity={0.8}
            >
              <Ionicons name="locate" size={20} color={DISENO.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.routeLegend}>
            <View style={styles.routeLegendItem}>
              <View style={[styles.routeLegendLine, styles.suggestedRouteLine]} />
              <Text style={styles.routeLegendText}>
                {rutaPuntos.length > 2 ? 'Ruta sugerida por Maps' : 'Referencia aproximada'}
              </Text>
            </View>
            <View style={styles.routeLegendItem}>
              <View style={[styles.routeLegendLine, styles.actualRouteLine]} />
              <Text style={styles.routeLegendText}>Recorrido real</Text>
            </View>
          </View>
          {rutaRecorrida.length < 2 && pedido?.estado === 'en_camino' && (
            <Text style={styles.routeStatus}>
              Actualizando el recorrido del repartidor…
            </Text>
          )}

          <View style={styles.mapInfo}>
            <View style={styles.mapInfoItem}>
              <Ionicons name="navigate" size={isTablet ? 22 : 18} color={DISENO.colors.accent} />
              <Text style={[styles.mapInfoText, { fontSize: isTablet ? 14 : 12 }]}>
                {distancia.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.mapInfoItem}>
              <Ionicons name="time" size={isTablet ? 22 : 18} color={DISENO.colors.accent} />
              <Text style={[styles.mapInfoText, { fontSize: isTablet ? 14 : 12 }]}>
                ⏱️ {tiempoEstimado}
              </Text>
            </View>
            <View style={styles.mapInfoItem}>
              <Ionicons name="cash" size={isTablet ? 22 : 18} color={DISENO.colors.success} />
              <Text style={[styles.mapInfoText, { fontSize: isTablet ? 14 : 12 }]}>
                {formatearPrecio(costoEnvio)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ✅ REPARTIDOR INFO */}
        {estadoActual === 'en_camino' && pedido.encabezado_repartidor && (
          <Animated.View style={[styles.repartidorInfo, {
            marginHorizontal: padding,
            borderRadius: isTablet ? 18 : 12,
            padding: isTablet ? 18 : 14,
            backgroundColor: DISENO.colors.accent + '10',
            borderWidth: 1,
            borderColor: DISENO.colors.accent + '20',
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }]}>
            <Ionicons name="person-circle" size={isTablet ? 36 : 30} color={DISENO.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.repartidorNombre, { fontSize: isTablet ? 15 : 13 }]}>
                {pedido.encabezado_repartidor}
              </Text>
              <Text style={[styles.repartidorEstado, { fontSize: isTablet ? 13 : 11 }]}>
                ¡Tu pedido está en camino! 🚀
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ✅ ESTADO ACTUAL */}
        <Animated.View style={[styles.estadoActual, {
          marginHorizontal: padding,
          padding: isTablet ? 30 : 22,
          borderRadius: isTablet ? 24 : 16,
          backgroundColor: estadoColor(estadoActual) + '12',
          borderWidth: 1,
          borderColor: estadoColor(estadoActual) + '25',
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }]}>
          <Ionicons
            name={(estados[indiceActual]?.icono as any) || 'help-circle'}
            size={isTablet ? 56 : 42}
            color={estadoColor(estadoActual)}
          />
          <Text style={[styles.estadoActualText, {
            fontSize: estadoTextSize,
            color: estadoColor(estadoActual),
          }]}>
            {estados[indiceActual]?.label || estadoActual}
          </Text>
          <Text style={[styles.pedidoId, { fontSize: isTablet ? 14 : 12 }]}>Pedido #{pedido.id}</Text>
        </Animated.View>

        {/* ✅ TIMELINE */}
        <Animated.View style={[styles.timeline, {
          paddingHorizontal: isTablet ? 36 : 16,
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }]}>
          {estados.map((estado, index) => {
            const completado = index <= indiceActual;
            const actual = index === indiceActual;
            const color = estadoColor(estado.key);

            return (
              <View key={estado.key} style={styles.timelineItem}>
                <View style={styles.timelineLinea}>
                  <View style={[styles.timelinePunto, {
                    backgroundColor: completado ? color : DISENO.colors.surfaceHover,
                    borderColor: completado ? color : DISENO.colors.border,
                    width: isTablet ? 34 : 26,
                    height: isTablet ? 34 : 26,
                    borderRadius: isTablet ? 17 : 13,
                  }, actual && styles.timelinePuntoActual]}>
                    {completado && (
                      <Ionicons name="checkmark" size={isTablet ? 18 : 12} color={DISENO.colors.surface} />
                    )}
                  </View>
                  {index < estados.length - 1 && (
                    <View style={[styles.timelineBarra, {
                      backgroundColor: completado ? color : DISENO.colors.border,
                      height: isTablet ? 50 : 32,
                    }]} />
                  )}
                </View>
                <View style={styles.timelineInfo}>
                  <Text style={[styles.timelineLabel, {
                    fontSize: isTablet ? 15 : 13,
                    color: completado ? DISENO.colors.text : DISENO.colors.textTertiary,
                  }, actual && styles.timelineLabelActual]}>
                    {estado.label}
                  </Text>
                  {actual && (
                    <Text style={[styles.timelineAhora, { fontSize: isTablet ? 12 : 10 }]}>Ahora</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* ✅ INFO PEDIDO */}
        <Animated.View style={[styles.infoPedido, {
          marginHorizontal: padding,
          padding: isTablet ? 24 : 16,
          borderRadius: isTablet ? 20 : 16,
          backgroundColor: DISENO.colors.surface,
          borderWidth: 1,
          borderColor: DISENO.colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
          ...DISENO.shadow.sm,
        }]}>
          <Text style={[styles.infoTitulo, { fontSize: isTablet ? 16 : 14 }]}>
            📋 Detalles del Pedido
          </Text>

          <View style={styles.infoFila}>
            <Text style={[styles.infoLabel, { fontSize: isTablet ? 13 : 11 }]}>📍 Dirección</Text>
            <Text style={[styles.infoValor, { fontSize: isTablet ? 13 : 12, flex: 1, textAlign: 'right', flexWrap: 'wrap' }]}>
              {direccionCliente}
            </Text>
          </View>

          <View style={styles.infoFila}>
            <Text style={[styles.infoLabel, { fontSize: isTablet ? 13 : 11 }]}>👑 Nivel</Text>
            <Text style={[styles.infoValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.accent }]}>
              {nivelCliente}
            </Text>
          </View>

          <View style={styles.infoFila}>
            <Text style={[styles.infoLabel, { fontSize: isTablet ? 13 : 11 }]}>💳 Pago</Text>
            <Text style={[styles.infoValor, { fontSize: isTablet ? 13 : 12 }]}>
              {metodoPago === 'efectivo' ? '💰 Efectivo' : metodoPago || 'Efectivo'}
            </Text>
          </View>

          {/* ✅ RESUMEN DE PRECIOS */}
          <View style={styles.resumenContainer}>
            <Text style={[styles.resumenTitulo, { fontSize: isTablet ? 14 : 13 }]}>
              💰 Resumen de precios
            </Text>

            <View style={styles.resumenFila}>
              <Text style={[styles.resumenLabel, { fontSize: isTablet ? 13 : 12 }]}>Subtotal</Text>
              <Text style={[styles.resumenValor, { fontSize: isTablet ? 13 : 12 }]}>
                {formatearPrecio(subtotal)}
              </Text>
            </View>

            {descuentoNivel > 0 && (
              <View style={[styles.resumenFila, styles.resumenDescuento]}>
                <Text style={[styles.resumenLabel, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.accent }]}>
                  🏷️ Descuento {nivelCliente} ({Math.round((descuentoNivel / subtotal) * 100)}%)
                </Text>
                <Text style={[styles.resumenValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.success }]}>
                  -{formatearPrecio(descuentoNivel)}
                </Text>
              </View>
            )}

            {descuentoCupon > 0 && (
              <View style={[styles.resumenFila, styles.resumenDescuento]}>
                <Text style={[styles.resumenLabel, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.success }]}>
                  🎟️ Descuento cupón
                </Text>
                <Text style={[styles.resumenValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.success }]}>
                  -{formatearPrecio(descuentoCupon)}
                </Text>
              </View>
            )}

            {descuentoPuntos > 0 && (
              <View style={[styles.resumenFila, styles.resumenDescuento]}>
                <Text style={[styles.resumenLabel, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.accentSecondary }]}>
                  ⭐ Descuento por puntos
                </Text>
                <Text style={[styles.resumenValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.success }]}>
                  -{formatearPrecio(descuentoPuntos)}
                </Text>
              </View>
            )}

            <View style={styles.resumenFila}>
              <Text style={[styles.resumenLabel, { fontSize: isTablet ? 13 : 12 }]}>
                {envioGratis ? '🚚 Envío (gratis)' : '🚚 Envío'}
              </Text>
              <Text style={[styles.resumenValor, {
                fontSize: isTablet ? 13 : 12,
                color: envioGratis ? DISENO.colors.success : DISENO.colors.text,
              }]}>
                {envioGratis ? 'Gratis' : formatearPrecio(costoEnvio)}
              </Text>
            </View>

            <View style={[styles.resumenFila, styles.resumenTotal]}>
              <Text style={[styles.resumenTotalLabel, { fontSize: isTablet ? 16 : 14 }]}>Total</Text>
              <Text style={[styles.resumenTotalValor, { fontSize: isTablet ? 18 : 16 }]}>
                {formatearPrecio(totalFinal)}
              </Text>
            </View>
          </View>

          {/* ✅ PAGO EN EFECTIVO */}
          {metodoPago === 'efectivo' && montoPago !== null && (
            <View style={styles.efectivoContainer}>
              <View style={styles.infoFila}>
                <Text style={[styles.infoLabel, { fontSize: isTablet ? 13 : 11, color: DISENO.colors.accent }]}>
                  💰 Pagó con
                </Text>
                <Text style={[styles.infoValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.accent }]}>
                  {formatearPrecio(montoPago)}
                </Text>
              </View>
              {vuelto !== null && vuelto > 0 && (
                <View style={styles.infoFila}>
                  <Text style={[styles.infoLabel, { fontSize: isTablet ? 13 : 11, color: DISENO.colors.success }]}>
                    💵 Vuelto
                  </Text>
                  <Text style={[styles.infoValor, { fontSize: isTablet ? 13 : 12, color: DISENO.colors.success }]}>
                    {formatearPrecio(vuelto)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ✅ BOTÓN TICKET */}
          {pedido.estado === 'entregado' && (
            <TouchableOpacity style={styles.botonTicket} onPress={generarTicket} disabled={generandoTicket} activeOpacity={0.7}>
              <LinearGradient colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]} style={styles.botonTicketGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {generandoTicket ? (
                  <ActivityIndicator size="small" color={DISENO.colors.text} />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={20} color={DISENO.colors.text} />
                    <Text style={styles.botonTicketTexto}>📄 Descargar Ticket</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ✅ PRODUCTOS */}
          {pedido.items_json && (
            <View style={styles.productos}>
              <Text style={[styles.productosTitulo, { fontSize: isTablet ? 14 : 13 }]}>🍔 Productos</Text>
              {(() => {
                let items = pedido.items_json;
                if (typeof items === 'string') {
                  try { items = JSON.parse(items); } catch (e) { items = []; }
                }
                if (Array.isArray(items) && items.length > 0) {
                  return items.map((item: any, index: number) => (
                    <View key={index} style={styles.productoItem}>
                      <Text style={[styles.productoNombre, { fontSize: isTablet ? 12 : 11 }]}>
                        {item.nombre || item.producto_nombre || 'Producto'}
                      </Text>
                      <Text style={[styles.productoCantidad, { fontSize: isTablet ? 12 : 11 }]}>
                        x{item.cantidad || 1}
                      </Text>
                      <Text style={[styles.productoPrecio, { fontSize: isTablet ? 12 : 11 }]}>
                        {formatearPrecio(item.total || item.precio || item.subtotal || 0)}
                      </Text>
                    </View>
                  ));
                } else {
                  return <Text style={styles.productoError}>No hay productos disponibles</Text>;
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

// ============================================================
// 🎨 ESTILOS - TEMA CLARO CON SIMPSONFONT
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
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: DISENO.colors.fondo,
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
  title: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    fontFamily: FUENTES.display,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: DISENO.colors.text,
  },
  mapContainer: {
    marginTop: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFrame: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  mapRecenterButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  routeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  routeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLegendLine: {
    width: 26,
    height: 4,
    borderRadius: 2,
  },
  suggestedRouteLine: {
    backgroundColor: 'transparent',
    borderTopWidth: 3,
    borderColor: COLOR_RUTA_SUGERIDA,
    borderStyle: 'dashed',
  },
  actualRouteLine: {
    backgroundColor: DISENO.colors.accent,
  },
  routeLegendText: {
    fontFamily: FUENTES.regular,
    fontSize: 11,
    color: DISENO.colors.textSecondary,
  },
  routeStatus: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: FUENTES.regular,
    fontSize: 11,
    color: DISENO.colors.textSecondary,
  },
  mapInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  mapInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapInfoText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  repartidorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  repartidorNombre: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  repartidorEstado: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accent,
    marginTop: 2,
    fontWeight: '500',
  },
  estadoActual: {
    alignItems: 'center',
    marginTop: 12,
  },
  estadoActualText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 8,
  },
  pedidoId: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 4,
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
    borderColor: DISENO.colors.accent,
    shadowColor: DISENO.colors.accent,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  timelineLabelActual: {
    fontWeight: '400',
  },
  timelineAhora: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accent,
    marginTop: 2,
    fontWeight: '600',
  },
  infoPedido: {
    marginTop: 12,
  },
  infoTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 12,
  },
  infoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
  },
  infoValor: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  resumenContainer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
  },
  resumenTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 6,
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  resumenDescuento: {
    backgroundColor: DISENO.colors.success + '08',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginVertical: 1,
  },
  resumenLabel: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
  },
  resumenValor: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  resumenTotal: {
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  resumenTotalLabel: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  resumenTotalValor: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
  },
  efectivoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
  },
  botonTicket: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    ...DISENO.shadow.sm,
  },
  botonTicketGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  botonTicketTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    fontSize: 14,
    color: DISENO.colors.text,
  },
  productos: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    paddingTop: 12,
  },
  productosTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
  },
  productoItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: DISENO.colors.border,
  },
  productoNombre: {
    fontFamily: FUENTES.regular,
    flex: 1,
    color: DISENO.colors.textSecondary,
  },
  productoCantidad: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginHorizontal: 10,
  },
  productoPrecio: {
    fontFamily: FUENTES.regular,
    fontWeight: 'bold',
    color: DISENO.colors.accent,
  },
  productoError: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    padding: 10,
  },
  botonVolver: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...DISENO.shadow.sm,
  },
  botonVolverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  botonVolverTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    fontSize: 14,
  },
});