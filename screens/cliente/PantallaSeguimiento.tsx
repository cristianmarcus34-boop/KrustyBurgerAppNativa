// screens/cliente/PantallaSeguimiento.tsx - V4 (Modo oscuro + Contacto al Repartidor)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  RefreshControl,
  useWindowDimensions,
  Image,
  Alert,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { TouchableRipple } from 'react-native-paper';
import Animated2, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { useResponsive } from '../../lib/colores';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { obtenerRutaPedido, obtenerInfoRutaPedido } from '../../lib/directions';
import { formatearPrecio } from '../../lib/formateador';
import { MarcadorPersonalizado } from '../../components/Mapa/MarcadorPersonalizado';
import { normalizarEstadoPedido } from '../../lib/estadoPedido';

const marcadorCasa = require('../../assets/iconos/casa.png');
const marcadorRepartidor = require('../../assets/icon.png');

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

// ============================================================
// 🎨 COLORES DE ESTADOS (semánticos, funcionan en ambos temas)
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

const CONTACTO_COLORES = {
  llamar: '#E53935',
  whatsappMensaje: '#25D366',
  whatsappLlamada: '#128C7E',
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaSeguimiento(props: any) {
  const { perfil, sesion, esAdministrador, cargando: cargandoAuth } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { width } = useWindowDimensions();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

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
  const [noAutorizado, setNoAutorizado] = useState(false);

  const [mostrarContactoSheet, setMostrarContactoSheet] = useState(false);

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
  const marcadorCasaSize = responsive.getValor({ tablet: 68, normal: 60, small: 54 });
  const marcadorRepartidorSize = responsive.getValor({ tablet: 76, normal: 68, small: 62 });

  const contactoSheetRadius = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const contactoItemHeight = isTablet ? 72 : isSmallPhone ? 56 : 64;
  const contactoIconSize = isTablet ? 26 : isSmallPhone ? 20 : 22;
  const contactoTitleSize = isTablet ? 16 : isSmallPhone ? 14 : 15;
  const contactoSubtitleSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
  const contactoHeaderSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const contactoPadding = isTablet ? 24 : isSmallPhone ? 16 : 20;

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
          { text: 'Volver', style: 'cancel', onPress: () => props.navigation.goBack() },
          { text: 'Iniciar sesión', onPress: () => props.navigation.replace('Login') },
        ],
        { cancelable: false },
      );
    }
  }, [sesion, cargandoAuth]);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
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
      setRutaPuntos([ubicacionRepartidor || UBICACION_KRUSTY, destino]);
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

      setRutaRecorrida((actuales) =>
        combinarPuntosRecorrido(
          actuales,
          (data || []).map((punto) => ({
            id: Number(punto.id),
            latitude: Number(punto.latitud),
            longitude: Number(punto.longitud),
            registrado_en: punto.registrado_en,
          })),
        ),
      );
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
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) { }
      channelRef.current = null;
    }
  };

  const cargarPedido = async (id: number) => {
    try {
      const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).single();

      if (error) {
        setError('No se pudo cargar el pedido');
        return;
      }

      if (data) {
        const esMio = data.id_de_usuario === perfil?.id;
        if (!esMio && !esAdministrador) {
          console.warn('⛔ [Seguimiento] Pedido no pertenece al usuario');
          setNoAutorizado(true);
          setError('No tenés permiso para ver este pedido');
          return;
        }

        const pedidoNormalizado = { ...data, estado: normalizarEstadoPedido(data.estado) } as Pedido;
        setPedido(pedidoNormalizado);
        extraerDireccion(pedidoNormalizado);
        actualizarUbicacion(pedidoNormalizado);
        actualizarInfoEnvio(pedidoNormalizado);
        actualizarPagoEfectivo(pedidoNormalizado);
        extraerDatosPrecios(pedidoNormalizado);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        (payload) => {
          const nuevoPedido = {
            ...payload.new,
            estado: normalizarEstadoPedido(payload.new.estado),
          } as Pedido;
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
        },
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
          )
            return;

          setRutaRecorrida((actuales) =>
            combinarPuntosRecorrido(actuales, [
              {
                id: Number(punto.id),
                latitude: Number(punto.latitud),
                longitude: Number(punto.longitud),
                registrado_en: punto.registrado_en,
              },
            ]),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;
  };

  const actualizarUbicacion = (p: Pedido) => {
    if (
      p.lat_repartidor !== null &&
      p.lat_repartidor !== undefined &&
      p.repartidor_de_lng !== null &&
      p.repartidor_de_lng !== undefined
    ) {
      const posRepartidor = {
        latitude: Number(p.lat_repartidor),
        longitude: Number(p.repartidor_de_lng),
      };
      setUbicacionRepartidor(posRepartidor);

      if (
        !p.distancia_km &&
        p.lat_cliente !== null &&
        p.lat_cliente !== undefined &&
        p.lng_cliente !== null &&
        p.lng_cliente !== undefined
      ) {
        const dist = calcularDistancia(
          posRepartidor.latitude,
          posRepartidor.longitude,
          p.lat_cliente,
          p.lng_cliente,
        );
        setDistancia(dist);
      }
    }
  };

  // ============================================================
  // 📱 CONTACTO AL REPARTIDOR
  // ============================================================
  const llamarTelefono = async (tel: string) => {
    const numero = normalizarTelefonoAR(tel);
    try {
      await Linking.openURL(`tel:${numero}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la llamada.');
    }
  };

  const abrirWhatsAppChat = async (tel: string) => {
    const numero = normalizarTelefonoAR(tel);

    try {
      const urlNativa = `whatsapp://send?phone=${numero}`;
      const puedeAbrir = await Linking.canOpenURL(urlNativa);
      if (puedeAbrir) {
        await Linking.openURL(urlNativa);
        return;
      }
    } catch (error) {
      console.warn('No se pudo abrir WhatsApp nativo:', error);
    }

    try {
      await Linking.openURL(`https://wa.me/${numero.replace('+', '')}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verificá que esté instalado.');
    }
  };

  const abrirWhatsAppLlamada = async (tel: string) => {
    const numero = normalizarTelefonoAR(tel);

    try {
      const urlLlamada = `whatsapp://call?phone=${numero}`;
      const puedeAbrir = await Linking.canOpenURL(urlLlamada);
      if (puedeAbrir) {
        await Linking.openURL(urlLlamada);
        return;
      }
    } catch (error) {
      console.warn('No se pudo abrir WhatsApp call:', error);
    }

    Alert.alert(
      'Llamada por WhatsApp',
      'Tu versión de WhatsApp no soporta iniciar llamadas desde un link. ¿Querés abrir el chat para llamar desde ahí?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir chat', onPress: () => abrirWhatsAppChat(tel) },
      ],
    );
  };

  const contactarRepartidor = () => {
    if (pedido?.estado !== 'en_camino') {
      Alert.alert(
        'Repartidor no disponible',
        'Solo podés contactar al repartidor cuando tu pedido esté en camino.',
      );
      return;
    }

    if (!pedido?.telefono_repartidor) {
      Alert.alert(
        'Sin teléfono del repartidor',
        'El repartidor todavía no cargó su teléfono. Probá de nuevo en un momento.',
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setMostrarContactoSheet(true);
  };

  const handleContactoOpcion = (
    tipo: 'llamar' | 'whatsappMensaje' | 'whatsappLlamada',
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setMostrarContactoSheet(false);

    setTimeout(() => {
      const tel = pedido?.telefono_repartidor;
      if (!tel) return;

      if (tipo === 'llamar') llamarTelefono(tel);
      else if (tipo === 'whatsappMensaje') abrirWhatsAppChat(tel);
      else abrirWhatsAppLlamada(tel);
    }, 220);
  };

  // ============================================================
  // ✅ GENERAR TICKET
  // ============================================================
  const generarTicketHTML = () => {
    const items = pedido?.items_json || [];
    const itemsHTML = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding:8px 4px; border-bottom:1px solid #eee;">${item.nombre || 'Producto'}</td>
        <td style="padding:8px 4px; border-bottom:1px solid #eee; text-align:center;">x${item.cantidad || 1}</td>
        <td style="padding:8px 4px; border-bottom:1px solid #eee; text-align:right;">${formatearPrecio(item.total || 0)}</td>
      </tr>
    `,
      )
      .join('');

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
          .header h1 { font-size: 24px; color: #E53935; letter-spacing: 1px; }
          .header p { color: #666; font-size: 12px; margin-top: 4px; }
          .pedido-info { background: #f8f6f2; border-radius: 10px; padding: 12px; margin-bottom: 16px; }
          .pedido-info .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .pedido-info .label { color: #888; }
          .pedido-info .value { font-weight: 600; color: #1a1a1a; }
          .productos { margin-bottom: 16px; }
          .productos table { width: 100%; border-collapse: collapse; }
          .productos th { text-align: left; font-size: 12px; color: #888; padding-bottom: 8px; border-bottom: 1px solid #eee; }
          .productos th:last-child { text-align: right; }
          .productos td { font-size: 13px; color: #1a1a1a; }
          .totales { border-top: 2px solid #F5C518; padding-top: 12px; margin-top: 4px; }
          .totales .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
          .totales .total { font-size: 18px; font-weight: 700; color: #E53935; border-top: 2px solid #eee; padding-top: 8px; margin-top: 4px; }
          .footer { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
          .footer .gracias { color: #E53935; font-weight: 600; font-size: 14px; }
          .metodo-pago { background: #E53935; color: white; padding: 8px 16px; border-radius: 8px; text-align: center; margin-top: 12px; font-weight: 600; }
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
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
    { key: 'pago_pendiente', label: 'Pago pendiente', icono: 'card-outline' },
    { key: 'pendiente', label: 'Pedido Recibido', icono: 'receipt-outline' },
    { key: 'confirmado', label: 'Confirmado', icono: 'checkmark-circle-outline' },
    { key: 'preparando', label: 'Preparando', icono: 'flame-outline' },
    { key: 'listo', label: 'Listo para entregar', icono: 'bag-check-outline' },
    { key: 'en_camino', label: 'En Camino', icono: 'bicycle-outline' },
    { key: 'entregado', label: 'Entregado', icono: 'home-outline' },
  ];

  const estadoActual = pedido?.estado || 'pendiente';
  const indiceActual = Math.max(0, estados.findIndex((e) => e.key === estadoActual));

  const estadoColor = (estado: string) => ESTADO_COLORES[estado] || colores.textSecondary;

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

  const centrarMapaEnSeguimiento = useCallback(() => {
    const puntos = [
      UBICACION_KRUSTY,
      ...coordenadasRuta,
      ...coordenadasRecorrido,
      posRepartidor,
      destinoCliente,
    ];
    const unicos = Array.from(
      new Map(puntos.map((punto) => [`${punto.latitude}:${punto.longitude}`, punto])).values(),
    );
    if (unicos.length < 2) return;

    mapRef.current?.fitToCoordinates(unicos, {
      edgePadding: { top: 56, right: 48, bottom: 56, left: 48 },
      animated: true,
    });
  }, [coordenadasRuta, coordenadasRecorrido, posRepartidor, destinoCliente]);

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
  }, [
    pedido?.id,
    rutaCargada,
    ubicacionRepartidor,
    rutaPuntos,
    rutaRecorrida.length,
    centrarMapaEnSeguimiento,
  ]);

  const puedeContactarRepartidor =
    pedido?.estado === 'en_camino' &&
    !!pedido?.encabezado_repartidor &&
    !!pedido?.telefono_repartidor;

  // ============================================================
  // 🔒 RENDER TEMPRANO
  // ============================================================
  if (cargandoAuth || !sesion) {
    return (
      <View style={estilos.centered}>
        <ActivityIndicator size="large" color={colores.accent} />
        <Text style={[estilos.loadingText, { color: colores.textSecondary }]}>
          {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
        </Text>
      </View>
    );
  }

  if (noAutorizado) {
    return (
      <View style={estilos.centered}>
        <Ionicons name="lock-closed-outline" size={60} color={colores.accent} />
        <Text style={[estilos.errorText, { color: colores.accent, marginTop: 12 }]}>
          No tenés permiso para ver este pedido
        </Text>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colores.accent, colores.accentSecondary]}
            style={estilos.botonVolverGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
            <Text style={[estilos.botonVolverTexto, { color: '#FFF' }]}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.centered}>
        <Ionicons name="alert-circle-outline" size={60} color={colores.accent} />
        <Text style={[estilos.errorText, { color: colores.accent }]}>{error}</Text>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colores.accent, colores.accentSecondary]}
            style={estilos.botonVolverGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
            <Text style={[estilos.botonVolverTexto, { color: '#FFF' }]}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={estilos.centered}>
        <ActivityIndicator size="large" color={colores.accent} />
        <Text style={[estilos.loadingText, { color: colores.textSecondary }]}>
          Cargando seguimiento...
        </Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={estilos.centered}>
        <Ionicons name="alert-circle-outline" size={60} color={colores.textTertiary} />
        <Text style={[estilos.errorText, { color: colores.text }]}>Pedido no encontrado</Text>
      </View>
    );
  }

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={estilos.container}>
      <LinearGradient
        colors={[colores.fondo, colores.surface, colores.fondo]}
        style={estilos.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[estilos.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={colores.accent}
            colors={[colores.accent]}
          />
        }
      >
        {/* ✅ HEADER CON CURVA */}
        <LinearGradient
          colors={[colores.accent, colores.accentSecondary]}
          style={[
            estilos.headerGradient,
            {
              height: insets.top + (isTablet ? 100 : 80),
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <Animated.View
          style={[
            estilos.header,
            {
              paddingHorizontal: padding,
              paddingTop: insets.top + (isTablet ? 20 : 10),
              paddingBottom: isTablet ? 16 : 10,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={estilos.backButtonGlass}
            onPress={() => {
              Haptics.selectionAsync().catch(() => { });
              props.navigation.goBack();
            }}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={isTablet ? 24 : 20} color="#FFF" />
          </TouchableOpacity>

          <View style={estilos.headerTitleBlock}>
            <Text style={[estilos.title, { fontSize: tituloSize, color: '#FFF' }]} allowFontScaling={false}>
              Seguimiento
            </Text>
            <Text style={estilos.headerSubtitle} allowFontScaling={false}>
              Pedido #{pedido.id}
            </Text>
          </View>

          <TouchableOpacity
            style={estilos.backButtonGlass}
            onPress={manejarRefresh}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="refresh" size={isTablet ? 22 : 18} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* ✅ MAPA */}
        <Animated.View
          style={[
            estilos.mapContainer,
            {
              marginHorizontal: padding,
              borderRadius: isTablet ? 24 : 18,
              padding: isTablet ? 16 : 12,
              backgroundColor: colores.surface,
              borderColor: colores.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View
            style={[
              estilos.mapFrame,
              { height: mapaHeight, borderRadius: isTablet ? 18 : 14 },
            ]}
          >
            <MapView
              ref={mapRef}
              style={estilos.map}
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
                <MarcadorPersonalizado color={colores.accent} size="small" showRing={false} />
              </Marker>
              <Marker coordinate={posRepartidor}>
                <Image
                  source={marcadorRepartidor}
                  style={{ width: marcadorRepartidorSize, height: marcadorRepartidorSize }}
                  resizeMode="contain"
                />
              </Marker>
              <Marker coordinate={destinoCliente}>
                <Image
                  source={marcadorCasa}
                  style={{ width: marcadorCasaSize, height: marcadorCasaSize }}
                  resizeMode="contain"
                />
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
                  strokeColor={colores.accent}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Encuadrar ruta y ubicación del repartidor"
              onPress={() => {
                Haptics.selectionAsync().catch(() => { });
                centrarMapaEnSeguimiento();
              }}
              style={[
                estilos.mapRecenterButton,
                {
                  backgroundColor: colores.isDark ? 'rgba(26,26,26,0.95)' : 'rgba(255,255,255,0.95)',
                  borderColor: colores.border,
                },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons name="locate" size={20} color={colores.text} />
            </TouchableOpacity>
          </View>

          <View style={estilos.routeLegend}>
            <View style={estilos.routeLegendItem}>
              <View style={[estilos.routeLegendLine, estilos.suggestedRouteLine]} />
              <Text style={[estilos.routeLegendText, { color: colores.textSecondary }]} allowFontScaling={false}>
                {rutaPuntos.length > 2 ? 'Ruta sugerida' : 'Referencia'}
              </Text>
            </View>
            <View style={estilos.routeLegendItem}>
              <View style={[estilos.routeLegendLine, { backgroundColor: colores.accent }]} />
              <Text style={[estilos.routeLegendText, { color: colores.textSecondary }]} allowFontScaling={false}>
                Recorrido real
              </Text>
            </View>
          </View>

          {rutaRecorrida.length < 2 && pedido?.estado === 'en_camino' && (
            <Text style={[estilos.routeStatus, { color: colores.textSecondary }]} allowFontScaling={false}>
              Actualizando el recorrido del repartidor…
            </Text>
          )}

          <View style={estilos.mapInfo}>
            <View style={estilos.mapInfoItem}>
              <View style={[estilos.mapInfoIconWrap, { backgroundColor: colores.accent + '12' }]}>
                <Ionicons name="navigate" size={isTablet ? 18 : 15} color={colores.accent} />
              </View>
              <Text style={[estilos.mapInfoText, { fontSize: isTablet ? 14 : 12, color: colores.text }]} allowFontScaling={false}>
                {distancia.toFixed(1)} km
              </Text>
            </View>

            <View style={estilos.mapInfoItem}>
              <View style={[estilos.mapInfoIconWrap, { backgroundColor: colores.warning + '15' }]}>
                <Ionicons name="time" size={isTablet ? 18 : 15} color={colores.warning} />
              </View>
              <Text style={[estilos.mapInfoText, { fontSize: isTablet ? 14 : 12, color: colores.text }]} allowFontScaling={false}>
                {tiempoEstimado}
              </Text>
            </View>

            <View style={estilos.mapInfoItem}>
              <View
                style={[
                  estilos.mapInfoIconWrap,
                  {
                    backgroundColor:
                      (envioGratis ? colores.success : colores.textSecondary) + '15',
                  },
                ]}
              >
                <Ionicons
                  name="cash"
                  size={isTablet ? 18 : 15}
                  color={envioGratis ? colores.success : colores.textSecondary}
                />
              </View>
              <Text
                style={[
                  estilos.mapInfoText,
                  {
                    fontSize: isTablet ? 14 : 12,
                    color: envioGratis ? colores.success : colores.text,
                  },
                ]}
                allowFontScaling={false}
              >
                {envioGratis ? 'Gratis' : formatearPrecio(costoEnvio)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ✅ REPARTIDOR INFO CON BOTÓN DE CONTACTO */}
        {estadoActual === 'en_camino' && pedido.encabezado_repartidor && (
          <Animated.View
            style={[
              estilos.repartidorInfo,
              {
                marginHorizontal: padding,
                borderRadius: isTablet ? 18 : 14,
                padding: isTablet ? 18 : 14,
                backgroundColor: colores.surface,
                borderColor: colores.accent + '20',
              },
            ]}
          >
            <LinearGradient
              colors={[colores.accent + '15', colores.accentSecondary + '08']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={estilos.repartidorAvatarWrap}>
              <View style={[estilos.repartidorAvatarGlow, { backgroundColor: colores.accent + '20' }]} />
              <View style={[estilos.repartidorAvatar, { backgroundColor: colores.accent + '25', borderColor: colores.surface }]}>
                <Ionicons
                  name="bicycle"
                  size={isTablet ? 22 : 18}
                  color={colores.accent}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[estilos.repartidorNombre, { fontSize: isTablet ? 16 : 14, color: colores.text }]}
                allowFontScaling={false}
              >
                {pedido.encabezado_repartidor}
              </Text>
              <View style={estilos.repartidorEstadoRow}>
                <View style={[estilos.repartidorLiveDot, { backgroundColor: colores.success }]} />
                <Text
                  style={[estilos.repartidorEstado, { fontSize: isTablet ? 13 : 11, color: colores.accent }]}
                  allowFontScaling={false}
                >
                  Tu pedido está en camino
                </Text>
              </View>
            </View>

            {puedeContactarRepartidor && (
              <TouchableOpacity
                onPress={contactarRepartidor}
                style={[
                  estilos.repartidorContactButton,
                  {
                    width: isTablet ? 48 : 42,
                    height: isTablet ? 48 : 42,
                    borderRadius: isTablet ? 24 : 21,
                    shadowColor: colores.accent,
                  },
                ]}
                activeOpacity={0.85}
                hitSlop={8}
              >
                <LinearGradient
                  colors={[colores.accent, colores.accentSecondary]}
                  style={[
                    estilos.repartidorContactGradient,
                    {
                      width: isTablet ? 48 : 42,
                      height: isTablet ? 48 : 42,
                      borderRadius: isTablet ? 24 : 21,
                    },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="call"
                    size={isTablet ? 22 : 18}
                    color="#FFF"
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* ✅ ESTADO ACTUAL */}
        <Animated.View
          style={[
            estilos.estadoActual,
            {
              marginHorizontal: padding,
              padding: isTablet ? 26 : 20,
              borderRadius: isTablet ? 24 : 18,
              backgroundColor: estadoColor(estadoActual) + '10',
              borderColor: estadoColor(estadoActual) + '25',
            },
          ]}
        >
          <View
            style={[
              estilos.estadoIconCircle,
              {
                backgroundColor: estadoColor(estadoActual) + '20',
                width: isTablet ? 88 : 72,
                height: isTablet ? 88 : 72,
                borderRadius: isTablet ? 44 : 36,
              },
            ]}
          >
            <Ionicons
              name={(estados[indiceActual]?.icono as any) || 'help-circle'}
              size={isTablet ? 42 : 34}
              color={estadoColor(estadoActual)}
            />
          </View>
          <Text
            style={[
              estilos.estadoActualText,
              {
                fontSize: estadoTextSize,
                color: estadoColor(estadoActual),
              },
            ]}
            allowFontScaling={false}
          >
            {estados[indiceActual]?.label || estadoActual}
          </Text>
          <Text style={[estilos.pedidoId, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]} allowFontScaling={false}>
            Pedido #{pedido.id}
          </Text>
        </Animated.View>

        {/* ✅ TIMELINE */}
        <Animated.View
          style={[
            estilos.timeline,
            {
              paddingHorizontal: isTablet ? 36 : 20,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {estados.map((estado, index) => {
            const completado = index <= indiceActual;
            const actual = index === indiceActual;
            const color = estadoColor(estado.key);

            return (
              <View key={estado.key} style={estilos.timelineItem}>
                <View style={estilos.timelineLinea}>
                  <View
                    style={[
                      estilos.timelinePunto,
                      {
                        backgroundColor: completado ? color : colores.surfaceHover,
                        borderColor: completado ? color : colores.border,
                        width: isTablet ? 34 : 26,
                        height: isTablet ? 34 : 26,
                        borderRadius: isTablet ? 17 : 13,
                      },
                      actual && [estilos.timelinePuntoActual, { shadowColor: colores.accent }],
                    ]}
                  >
                    {completado && (
                      <Ionicons
                        name="checkmark"
                        size={isTablet ? 18 : 12}
                        color="#FFF"
                      />
                    )}
                  </View>
                  {index < estados.length - 1 && (
                    <View
                      style={[
                        estilos.timelineBarra,
                        {
                          backgroundColor: completado ? color : colores.border,
                          height: isTablet ? 50 : 32,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={estilos.timelineInfo}>
                  <Text
                    style={[
                      estilos.timelineLabel,
                      {
                        fontSize: isTablet ? 15 : 13,
                        color: completado ? colores.text : colores.textTertiary,
                      },
                      actual && estilos.timelineLabelActual,
                    ]}
                    allowFontScaling={false}
                  >
                    {estado.label}
                  </Text>
                  {actual && (
                    <View style={estilos.timelineAhoraRow}>
                      <View style={[estilos.timelineAhoraDot, { backgroundColor: color }]} />
                      <Text
                        style={[estilos.timelineAhora, { fontSize: isTablet ? 12 : 10, color: colores.accent }]}
                        allowFontScaling={false}
                      >
                        Ahora
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* ✅ INFO PEDIDO */}
        <Animated.View
          style={[
            estilos.infoPedido,
            {
              marginHorizontal: padding,
              padding: isTablet ? 22 : 16,
              borderRadius: isTablet ? 20 : 18,
              backgroundColor: colores.surface,
              borderColor: colores.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={estilos.infoSectionHeader}>
            <View style={[estilos.infoSectionAccent, { backgroundColor: colores.accent }]} />
            <Text style={[estilos.infoTitulo, { fontSize: isTablet ? 16 : 14, color: colores.text }]} allowFontScaling={false}>
              Detalles del Pedido
            </Text>
          </View>

          <View style={estilos.infoFila}>
            <View style={estilos.infoFilaLeft}>
              <Ionicons name="location-outline" size={isTablet ? 15 : 13} color={colores.info} />
              <Text style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]} allowFontScaling={false}>
                Dirección
              </Text>
            </View>
            <Text
              style={[
                estilos.infoValor,
                {
                  fontSize: isTablet ? 13 : 12,
                  flex: 1,
                  textAlign: 'right',
                  color: colores.text,
                },
              ]}
              allowFontScaling={false}
              numberOfLines={3}
            >
              {direccionCliente}
            </Text>
          </View>

          {puedeContactarRepartidor && (
            <TouchableRipple
              onPress={contactarRepartidor}
              borderless
              rippleColor={colores.accent + '15'}
              style={estilos.telefonoFila}
            >
              <View style={estilos.infoFilaInner}>
                <View style={estilos.infoFilaLeft}>
                  <Ionicons name="bicycle-outline" size={isTablet ? 15 : 13} color={colores.accent} />
                  <Text
                    style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]}
                    allowFontScaling={false}
                  >
                    Tu repartidor
                  </Text>
                </View>
                <View style={estilos.telefonoBoton}>
                  <Text
                    style={[
                      estilos.infoValor,
                      {
                        fontSize: isTablet ? 13 : 12,
                        color: colores.accent,
                        marginRight: 8,
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    {pedido.encabezado_repartidor}
                  </Text>
                  <View style={estilos.telefonoIconosWrap}>
                    <Ionicons name="call" size={isTablet ? 13 : 11} color={colores.accent} />
                    <Ionicons
                      name="logo-whatsapp"
                      size={isTablet ? 14 : 12}
                      color="#25D366"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </View>
              </View>
            </TouchableRipple>
          )}

          {esAdministrador && pedido.telefono && (
            <View style={estilos.infoFila}>
              <View style={estilos.infoFilaLeft}>
                <Ionicons name="call-outline" size={isTablet ? 15 : 13} color={colores.accent} />
                <Text
                  style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]}
                  allowFontScaling={false}
                >
                  Teléfono
                </Text>
              </View>
              <Text
                style={[
                  estilos.infoValor,
                  { fontSize: isTablet ? 13 : 12, color: colores.accent },
                ]}
                allowFontScaling={false}
              >
                {pedido.telefono}
              </Text>
            </View>
          )}

          <View style={estilos.infoFila}>
            <View style={estilos.infoFilaLeft}>
              <Ionicons name="ribbon-outline" size={isTablet ? 15 : 13} color={colores.accentSecondary} />
              <Text style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]} allowFontScaling={false}>
                Nivel
              </Text>
            </View>
            <Text
              style={[
                estilos.infoValor,
                { fontSize: isTablet ? 13 : 12, color: colores.accent },
              ]}
              allowFontScaling={false}
            >
              {nivelCliente}
            </Text>
          </View>

          <View style={estilos.infoFila}>
            <View style={estilos.infoFilaLeft}>
              <Ionicons name="card-outline" size={isTablet ? 15 : 13} color={colores.textSecondary} />
              <Text style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.textSecondary }]} allowFontScaling={false}>
                Pago
              </Text>
            </View>
            <Text style={[estilos.infoValor, { fontSize: isTablet ? 13 : 12, color: colores.text }]} allowFontScaling={false}>
              {metodoPago === 'efectivo' ? 'Efectivo' : metodoPago || 'Efectivo'}
            </Text>
          </View>

          {/* RESUMEN DE PRECIOS */}
          <View style={[estilos.resumenContainer, { borderTopColor: colores.border }]}>
            <View style={estilos.resumenHeader}>
              <Ionicons name="receipt-outline" size={isTablet ? 15 : 13} color={colores.text} />
              <Text style={[estilos.resumenTitulo, { fontSize: isTablet ? 14 : 13, color: colores.text }]} allowFontScaling={false}>
                Resumen de precios
              </Text>
            </View>

            <View style={estilos.resumenFila}>
              <Text style={[estilos.resumenLabel, { fontSize: isTablet ? 13 : 12, color: colores.textSecondary }]} allowFontScaling={false}>
                Subtotal
              </Text>
              <Text style={[estilos.resumenValor, { fontSize: isTablet ? 13 : 12, color: colores.text }]} allowFontScaling={false}>
                {formatearPrecio(subtotal)}
              </Text>
            </View>

            {descuentoNivel > 0 && (
              <View style={[estilos.resumenFila, estilos.resumenDescuento, { backgroundColor: colores.success + '08' }]}>
                <Text
                  style={[estilos.resumenLabel, { fontSize: isTablet ? 13 : 12, color: colores.accent }]}
                  allowFontScaling={false}
                >
                  Descuento {nivelCliente} ({Math.round((descuentoNivel / subtotal) * 100)}%)
                </Text>
                <Text
                  style={[estilos.resumenValor, { fontSize: isTablet ? 13 : 12, color: colores.success }]}
                  allowFontScaling={false}
                >
                  -{formatearPrecio(descuentoNivel)}
                </Text>
              </View>
            )}

            {descuentoCupon > 0 && (
              <View style={[estilos.resumenFila, estilos.resumenDescuento, { backgroundColor: colores.success + '08' }]}>
                <Text
                  style={[estilos.resumenLabel, { fontSize: isTablet ? 13 : 12, color: colores.success }]}
                  allowFontScaling={false}
                >
                  Descuento cupón
                </Text>
                <Text
                  style={[estilos.resumenValor, { fontSize: isTablet ? 13 : 12, color: colores.success }]}
                  allowFontScaling={false}
                >
                  -{formatearPrecio(descuentoCupon)}
                </Text>
              </View>
            )}

            {descuentoPuntos > 0 && (
              <View style={[estilos.resumenFila, estilos.resumenDescuento, { backgroundColor: colores.success + '08' }]}>
                <Text
                  style={[
                    estilos.resumenLabel,
                    { fontSize: isTablet ? 13 : 12, color: colores.accentSecondary },
                  ]}
                  allowFontScaling={false}
                >
                  Descuento por puntos
                </Text>
                <Text
                  style={[estilos.resumenValor, { fontSize: isTablet ? 13 : 12, color: colores.success }]}
                  allowFontScaling={false}
                >
                  -{formatearPrecio(descuentoPuntos)}
                </Text>
              </View>
            )}

            <View style={estilos.resumenFila}>
              <Text style={[estilos.resumenLabel, { fontSize: isTablet ? 13 : 12, color: colores.textSecondary }]} allowFontScaling={false}>
                {envioGratis ? 'Envío (gratis)' : 'Envío'}
              </Text>
              <Text
                style={[
                  estilos.resumenValor,
                  {
                    fontSize: isTablet ? 13 : 12,
                    color: envioGratis ? colores.success : colores.text,
                  },
                ]}
                allowFontScaling={false}
              >
                {envioGratis ? 'Gratis' : formatearPrecio(costoEnvio)}
              </Text>
            </View>

            <View style={[estilos.resumenFila, estilos.resumenTotal, { borderTopColor: colores.border }]}>
              <Text
                style={[estilos.resumenTotalLabel, { fontSize: isTablet ? 16 : 14, color: colores.text }]}
                allowFontScaling={false}
              >
                Total
              </Text>
              <Text
                style={[estilos.resumenTotalValor, { fontSize: isTablet ? 18 : 16, color: colores.accent }]}
                allowFontScaling={false}
              >
                {formatearPrecio(totalFinal)}
              </Text>
            </View>
          </View>

          {/* PAGO EN EFECTIVO */}
          {metodoPago === 'efectivo' && montoPago !== null && (
            <View style={[estilos.efectivoContainer, { borderTopColor: colores.border }]}>
              <View style={estilos.infoFila}>
                <View style={estilos.infoFilaLeft}>
                  <Ionicons name="cash-outline" size={isTablet ? 15 : 13} color={colores.accent} />
                  <Text
                    style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.accent }]}
                    allowFontScaling={false}
                  >
                    Pagó con
                  </Text>
                </View>
                <Text
                  style={[estilos.infoValor, { fontSize: isTablet ? 13 : 12, color: colores.accent }]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(montoPago)}
                </Text>
              </View>
              {vuelto !== null && vuelto > 0 && (
                <View style={estilos.infoFila}>
                  <View style={estilos.infoFilaLeft}>
                    <Ionicons name="return-down-back" size={isTablet ? 15 : 13} color={colores.success} />
                    <Text
                      style={[estilos.infoLabel, { fontSize: isTablet ? 13 : 11, color: colores.success }]}
                      allowFontScaling={false}
                    >
                      Vuelto
                    </Text>
                  </View>
                  <Text
                    style={[estilos.infoValor, { fontSize: isTablet ? 13 : 12, color: colores.success }]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(vuelto)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* BOTÓN TICKET */}
          {pedido.estado === 'entregado' && (
            <TouchableOpacity
              style={[estilos.botonTicket, { shadowColor: colores.accent }]}
              onPress={generarTicket}
              disabled={generandoTicket}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colores.accent, colores.accentSecondary]}
                style={estilos.botonTicketGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {generandoTicket ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={isTablet ? 20 : 18} color="#FFF" />
                    <Text style={estilos.botonTicketTexto} allowFontScaling={false}>
                      Descargar Ticket
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* PRODUCTOS */}
          {pedido.items_json && (
            <View style={[estilos.productos, { borderTopColor: colores.border }]}>
              <View style={estilos.productosHeader}>
                <Ionicons name="bag-handle-outline" size={isTablet ? 15 : 13} color={colores.text} />
                <Text style={[estilos.productosTitulo, { fontSize: isTablet ? 14 : 13, color: colores.text }]} allowFontScaling={false}>
                  Productos
                </Text>
              </View>
              {(() => {
                let items = pedido.items_json;
                if (typeof items === 'string') {
                  try {
                    items = JSON.parse(items);
                  } catch (e) {
                    items = [];
                  }
                }
                if (Array.isArray(items) && items.length > 0) {
                  return items.map((item: any, index: number) => (
                    <View key={index} style={[estilos.productoItem, { backgroundColor: colores.surfaceHover }]}>
                      <View style={[estilos.productoQtyBadge, { backgroundColor: colores.accent + '12' }]}>
                        <Text style={[estilos.productoQtyText, { color: colores.accent }]} allowFontScaling={false}>
                          {item.cantidad || 1}x
                        </Text>
                      </View>
                      <Text
                        style={[estilos.productoNombre, { fontSize: isTablet ? 13 : 12, color: colores.text }]}
                        allowFontScaling={false}
                        numberOfLines={1}
                      >
                        {item.nombre || item.producto_nombre || 'Producto'}
                      </Text>
                      <Text
                        style={[estilos.productoPrecio, { fontSize: isTablet ? 13 : 12, color: colores.text }]}
                        allowFontScaling={false}
                      >
                        {formatearPrecio(item.total || item.precio || item.subtotal || 0)}
                      </Text>
                    </View>
                  ));
                } else {
                  return (
                    <Text style={[estilos.productoError, { color: colores.textSecondary }]} allowFontScaling={false}>
                      No hay productos disponibles
                    </Text>
                  );
                }
              })()}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM SHEET DE CONTACTO */}
      <Modal
        visible={mostrarContactoSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarContactoSheet(false)}
        statusBarTranslucent
      >
        <View style={estilos.sheetRoot}>
          <Pressable
            style={estilos.sheetBackdrop}
            onPress={() => setMostrarContactoSheet(false)}
          />

          <View
            style={[
              estilos.sheetContainer,
              {
                borderTopLeftRadius: contactoSheetRadius,
                borderTopRightRadius: contactoSheetRadius,
                paddingBottom: insets.bottom + 20,
                backgroundColor: colores.surface,
              },
            ]}
          >
            <View style={estilos.sheetHandleWrap}>
              <View style={[estilos.sheetHandle, { backgroundColor: colores.textTertiary }]} />
            </View>

            <View style={[estilos.sheetHeader, { paddingHorizontal: contactoPadding }]}>
              <View style={[estilos.sheetHeaderIconWrap, { backgroundColor: colores.accent, shadowColor: colores.accent }]}>
                <Ionicons name="bicycle" size={isTablet ? 22 : 18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.sheetTitle, { fontSize: contactoHeaderSize, color: colores.text }]} allowFontScaling={false}>
                  Contactar a {pedido.encabezado_repartidor || 'tu repartidor'}
                </Text>
                <Text style={[estilos.sheetSubtitle, { fontSize: contactoSubtitleSize, color: colores.textSecondary }]} allowFontScaling={false}>
                  {pedido.telefono_repartidor}
                </Text>
              </View>
            </View>

            <View style={[estilos.sheetDivider, { marginHorizontal: contactoPadding, backgroundColor: colores.border }]} />

            <View style={{ paddingHorizontal: contactoPadding }}>
              {/* Llamar */}
              <TouchableRipple
                onPress={() => handleContactoOpcion('llamar')}
                borderless
                rippleColor={CONTACTO_COLORES.llamar + '20'}
                style={[
                  estilos.sheetOption,
                  {
                    height: contactoItemHeight,
                    borderRadius: isTablet ? 16 : 14,
                    marginBottom: 10,
                    borderColor: CONTACTO_COLORES.llamar + '25',
                    backgroundColor: CONTACTO_COLORES.llamar + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      {
                        backgroundColor: CONTACTO_COLORES.llamar + '18',
                        width: contactoItemHeight - 20,
                        height: contactoItemHeight - 20,
                        borderRadius: (contactoItemHeight - 20) / 2,
                      },
                    ]}
                  >
                    <Ionicons name="call" size={contactoIconSize} color={CONTACTO_COLORES.llamar} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[
                        estilos.sheetOptionTitle,
                        { fontSize: contactoTitleSize, color: CONTACTO_COLORES.llamar },
                      ]}
                      allowFontScaling={false}
                    >
                      Llamar al repartidor
                    </Text>
                    <Text
                      style={[estilos.sheetOptionSubtitle, { fontSize: contactoSubtitleSize, color: colores.textSecondary }]}
                      allowFontScaling={false}
                    >
                      Llamada normal al celular
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={CONTACTO_COLORES.llamar + '80'}
                  />
                </View>
              </TouchableRipple>

              {/* WhatsApp mensaje */}
              <TouchableRipple
                onPress={() => handleContactoOpcion('whatsappMensaje')}
                borderless
                rippleColor={CONTACTO_COLORES.whatsappMensaje + '20'}
                style={[
                  estilos.sheetOption,
                  {
                    height: contactoItemHeight,
                    borderRadius: isTablet ? 16 : 14,
                    marginBottom: 10,
                    borderColor: CONTACTO_COLORES.whatsappMensaje + '30',
                    backgroundColor: CONTACTO_COLORES.whatsappMensaje + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      {
                        backgroundColor: CONTACTO_COLORES.whatsappMensaje + '18',
                        width: contactoItemHeight - 20,
                        height: contactoItemHeight - 20,
                        borderRadius: (contactoItemHeight - 20) / 2,
                      },
                    ]}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={contactoIconSize}
                      color={CONTACTO_COLORES.whatsappMensaje}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[
                        estilos.sheetOptionTitle,
                        { fontSize: contactoTitleSize, color: CONTACTO_COLORES.whatsappMensaje },
                      ]}
                      allowFontScaling={false}
                    >
                      Mensaje al repartidor
                    </Text>
                    <Text
                      style={[estilos.sheetOptionSubtitle, { fontSize: contactoSubtitleSize, color: colores.textSecondary }]}
                      allowFontScaling={false}
                    >
                      Mandale un WhatsApp
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={CONTACTO_COLORES.whatsappMensaje + '80'}
                  />
                </View>
              </TouchableRipple>

              {/* WhatsApp llamada */}
              <TouchableRipple
                onPress={() => handleContactoOpcion('whatsappLlamada')}
                borderless
                rippleColor={CONTACTO_COLORES.whatsappLlamada + '20'}
                style={[
                  estilos.sheetOption,
                  {
                    height: contactoItemHeight,
                    borderRadius: isTablet ? 16 : 14,
                    marginBottom: 14,
                    borderColor: CONTACTO_COLORES.whatsappLlamada + '30',
                    backgroundColor: CONTACTO_COLORES.whatsappLlamada + '08',
                  },
                ]}
              >
                <View style={estilos.sheetOptionInner}>
                  <View
                    style={[
                      estilos.sheetOptionIcon,
                      {
                        backgroundColor: CONTACTO_COLORES.whatsappLlamada + '18',
                        width: contactoItemHeight - 20,
                        height: contactoItemHeight - 20,
                        borderRadius: (contactoItemHeight - 20) / 2,
                      },
                    ]}
                  >
                    <Ionicons
                      name="call"
                      size={contactoIconSize}
                      color={CONTACTO_COLORES.whatsappLlamada}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={[
                        estilos.sheetOptionTitle,
                        { fontSize: contactoTitleSize, color: CONTACTO_COLORES.whatsappLlamada },
                      ]}
                      allowFontScaling={false}
                    >
                      Llamada por WhatsApp
                    </Text>
                    <Text
                      style={[estilos.sheetOptionSubtitle, { fontSize: contactoSubtitleSize, color: colores.textSecondary }]}
                      allowFontScaling={false}
                    >
                      Llamada de voz vía WhatsApp
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={CONTACTO_COLORES.whatsappLlamada + '80'}
                  />
                </View>
              </TouchableRipple>

              {/* Cancelar */}
              <TouchableRipple
                onPress={() => {
                  Haptics.selectionAsync().catch(() => { });
                  setMostrarContactoSheet(false);
                }}
                borderless
                rippleColor={colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                style={[
                  estilos.sheetCancel,
                  {
                    height: contactoItemHeight - 8,
                    borderRadius: isTablet ? 14 : 12,
                    backgroundColor: colores.surfaceHover,
                    borderColor: colores.border,
                  },
                ]}
              >
                <View style={estilos.sheetCancelInner}>
                  <Text
                    style={[estilos.sheetCancelText, { fontSize: contactoTitleSize, color: colores.textSecondary }]}
                    allowFontScaling={false}
                  >
                    Cancelar
                  </Text>
                </View>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },
    backgroundGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    scrollContent: { flexGrow: 1 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
      backgroundColor: colores.fondo,
    },

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButtonGlass: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    headerTitleBlock: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    title: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    headerSubtitle: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
      includeFontPadding: false,
    },
    loadingText: {
      fontFamily: FUENTES.regular,
      marginTop: 16,
      fontSize: 14,
    },
    errorText: {
      fontFamily: FUENTES.display,
      fontSize: 18,
      textAlign: 'center',
      marginTop: 20,
    },

    mapContainer: {
      marginTop: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    map: { width: '100%', height: '100%' },
    mapFrame: {
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: colores.surfaceHover,
    },
    mapRecenterButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
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
    routeLegendText: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
    },
    routeStatus: {
      marginTop: 8,
      textAlign: 'center',
      fontFamily: FUENTES.regular,
      fontSize: 11,
    },
    mapInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 14,
      paddingHorizontal: 4,
      flexWrap: 'wrap',
      gap: 8,
    },
    mapInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mapInfoIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapInfoText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },

    repartidorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 14,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    repartidorAvatarWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    repartidorAvatarGlow: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    repartidorAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    repartidorNombre: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    repartidorEstadoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    repartidorLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    repartidorEstado: {
      fontFamily: FUENTES.regular,
      fontWeight: '600',
    },
    repartidorContactButton: {
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
      marginLeft: 8,
    },
    repartidorContactGradient: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    estadoActual: {
      alignItems: 'center',
      marginTop: 12,
      borderWidth: 1,
    },
    estadoIconCircle: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    estadoActualText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    pedidoId: {
      fontFamily: FUENTES.regular,
      marginTop: 4,
    },

    timeline: { paddingVertical: 20 },
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
      paddingTop: 4,
    },
    timelineLabel: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
    },
    timelineLabelActual: {
      fontWeight: '700',
    },
    timelineAhoraRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 3,
    },
    timelineAhoraDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    timelineAhora: {
      fontFamily: FUENTES.regular,
      fontWeight: '700',
    },

    infoPedido: {
      marginTop: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    infoSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    infoSectionAccent: {
      width: 4,
      height: 18,
      borderRadius: 2,
      marginRight: 10,
    },
    infoTitulo: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    infoFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 10,
    },
    infoFilaInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    infoFilaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 90,
    },
    infoLabel: {
      fontFamily: FUENTES.regular,
    },
    infoValor: {
      fontFamily: FUENTES.regular,
      fontWeight: '600',
    },
    telefonoFila: {
      borderRadius: 10,
      marginBottom: 4,
      overflow: 'hidden',
    },
    telefonoBoton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    telefonoIconosWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    resumenContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    resumenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    resumenTitulo: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    resumenFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    resumenDescuento: {
      paddingHorizontal: 6,
      borderRadius: 6,
      marginVertical: 2,
    },
    resumenLabel: {
      fontFamily: FUENTES.regular,
    },
    resumenValor: {
      fontFamily: FUENTES.regular,
      fontWeight: '600',
    },
    resumenTotal: {
      borderTopWidth: 1,
      paddingTop: 8,
      marginTop: 6,
    },
    resumenTotalLabel: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
    },
    resumenTotalValor: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.3,
    },

    efectivoContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
    },

    botonTicket: {
      marginTop: 14,
      borderRadius: 14,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    botonTicketGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      paddingHorizontal: 20,
    },
    botonTicketTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      fontSize: 14,
      color: '#FFF',
      letterSpacing: 0.2,
    },

    productos: {
      marginTop: 14,
      borderTopWidth: 1,
      paddingTop: 14,
    },
    productosHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    productosTitulo: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    productoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 10,
      gap: 10,
    },
    productoQtyBadge: {
      minWidth: 34,
      height: 26,
      paddingHorizontal: 8,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    productoQtyText: {
      fontFamily: FUENTES.display,
      fontSize: 12,
      fontWeight: '700',
      includeFontPadding: false,
    },
    productoNombre: {
      fontFamily: FUENTES.regular,
      flex: 1,
      fontWeight: '500',
    },
    productoPrecio: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
    },
    productoError: {
      fontFamily: FUENTES.regular,
      fontSize: 14,
      textAlign: 'center',
      padding: 10,
    },

    botonVolver: {
      marginTop: 20,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
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
      fontWeight: '700',
      fontSize: 14,
    },

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
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    sheetTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    sheetSubtitle: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
    },
    sheetDivider: {
      height: 1,
      marginVertical: 16,
    },
    sheetOption: {
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    sheetOptionInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      flex: 1,
    },
    sheetOptionIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetOptionTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    sheetOptionSubtitle: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
    },
    sheetCancel: {
      borderWidth: 1,
      overflow: 'hidden',
    },
    sheetCancelInner: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    sheetCancelText: {
      fontFamily: FUENTES.display,
      fontWeight: '600',
    },
  });