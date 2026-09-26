// screens/admin/PantallaGestionPedidos.tsx - REDISEÑO KRUSTY + FILTROS + BÚSQUEDA + SWIPE + NOTIFICACIONES + RESPONSIVE + WHATSAPP
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
  Modal,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { notificacionService } from '../../services/notificacionService';
import { useToast, Toast } from '../../components/Toast';

// ============================================================
// 🎨 ESTADOS DE PEDIDO
// ============================================================
const ESTADOS_PEDIDO: Record<string, { label: string; color: string; icono: string; siguiente?: string }> = {
  pendiente: { label: 'Pendiente', color: DISENO.colors.accentSecondary, icono: 'time-outline', siguiente: 'confirmado' },
  confirmado: { label: 'Confirmado', color: DISENO.colors.info, icono: 'checkmark-circle-outline', siguiente: 'preparando' },
  preparando: { label: 'Preparando', color: DISENO.colors.naranja, icono: 'restaurant-outline', siguiente: 'listo' },
  listo: { label: 'Listo', color: DISENO.colors.verde, icono: 'checkmark-done-outline' },
  en_camino: { label: 'En camino', color: DISENO.colors.morado, icono: 'bicycle-outline' },
  entregado: { label: 'Entregado', color: DISENO.colors.success, icono: 'checkmark-done-circle-outline' },
  cancelado: { label: 'Cancelado', color: DISENO.colors.danger, icono: 'close-circle-outline' },
};

const ESTADOS_FINALIZADOS = ['entregado', 'cancelado'];
const ESTADOS_ACTIVOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'];
const MINUTOS_URGENTE = 15;

const COLOR_WHATSAPP = '#25D366';

// ============================================================
// 🆕 INTERFAZ
// ============================================================
interface PedidoConCliente extends Pedido {
  cliente_nombre_completo?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  items_nombres?: string[];
}

// ============================================================
// 🔧 HELPERS
// ============================================================
const formatearTiempoTranscurrido = (fecha: string): string => {
  const ahora = new Date().getTime();
  const creado = new Date(fecha).getTime();
  const minutos = Math.floor((ahora - creado) / 60000);

  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias}d`;
};

const esPedidoUrgente = (fecha: string, estado: string): boolean => {
  if (estado !== 'pendiente' && estado !== 'confirmado') return false;
  const ahora = new Date().getTime();
  const creado = new Date(fecha).getTime();
  const minutos = Math.floor((ahora - creado) / 60000);
  return minutos >= MINUTOS_URGENTE;
};

/**
 * ✅ Normaliza el teléfono argentino para WhatsApp.
 * Casos soportados:
 *  - "+54 9 11 1234-5678" → "5491112345678"
 *  - "011 15-1234-5678"   → "5491112345678"
 *  - "11 1234-5678"       → "5491112345678"
 *  - "5491112345678"      → "5491112345678" (sin cambios)
 */
const normalizarTelefonoParaWhatsApp = (telefono: string): string | null => {
  if (!telefono) return null;

  // Dejar solo dígitos
  let numero = telefono.replace(/\D/g, '');

  if (!numero || numero.length < 8) return null;

  // Si ya empieza con 549 → listo
  if (numero.startsWith('549')) return numero;

  // Si empieza con 54 (pero no 549) → agregar el 9
  if (numero.startsWith('54')) {
    return `549${numero.slice(2)}`;
  }

  // Sacar el 0 inicial (ej: "011..." → "11...")
  if (numero.startsWith('0')) {
    numero = numero.slice(1);
  }

  // Sacar el 15 después del código de área (ej: "11 15 1234..." → "11 1234...")
  // El 15 suele estar entre el código de área (2-4 dígitos) y el número
  const match15 = numero.match(/^(\d{2,4})15(\d{6,8})$/);
  if (match15) {
    numero = `${match15[1]}${match15[2]}`;
  }

  // Si tiene 10 dígitos (ej: "11 1234 5678") → agregar 549
  if (numero.length === 10) {
    return `549${numero}`;
  }

  // Fallback: agregar 54
  return `54${numero}`;
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionPedidos(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalLimpieza, setMostrarModalLimpieza] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [tipoLimpieza, setTipoLimpieza] = useState<'todos' | 'finalizados' | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConCliente | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);

  // ✅ Filtros y búsqueda
  const [filtroEstado, setFiltroEstado] = useState<string>('activos');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'recientes' | 'antiguos'>('recientes');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    cargarPedidos();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ============================================================
  // 📥 CARGAR PEDIDOS
  // ============================================================
  const cargarPedidos = async () => {
    try {
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (pedidosError) throw pedidosError;

      if (!pedidosData || pedidosData.length === 0) {
        setPedidos([]);
        return;
      }

      const userIds = [...new Set(pedidosData.map(p => p.id_de_usuario).filter(Boolean))];

      let perfilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: perfilesData, error: perfilesError } = await supabase
          .from('perfiles')
          .select('id, nombre_cliente, email, telefono, direccion_calle, direccion_numero, direccion_piso, direccion_departamento, direccion_barrio, direccion_ciudad')
          .in('id', userIds);

        if (!perfilesError && perfilesData) {
          perfilesMap = perfilesData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      const pedidosConCliente: PedidoConCliente[] = pedidosData.map(pedido => {
        const perfil = perfilesMap[pedido.id_de_usuario || ''] || {};

        const partesDireccion = [];
        if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
        if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
        if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
        if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
        if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
        if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
        const direccionCompleta = partesDireccion.length > 0
          ? partesDireccion.join(', ')
          : pedido.direccion || 'Sin dirección';

        let itemsNombres: string[] = [];
        try {
          if (pedido.items_json && typeof pedido.items_json === 'string') {
            const items = JSON.parse(pedido.items_json);
            if (Array.isArray(items)) {
              itemsNombres = items.map(item => `${item.cantidad}x ${item.nombre}`);
            }
          } else if (Array.isArray(pedido.items_json)) {
            itemsNombres = (pedido.items_json as any[]).map(item => `${item.cantidad}x ${item.nombre}`);
          }
        } catch (e) {
          itemsNombres = ['Ver detalles del pedido'];
        }

        return {
          ...pedido,
          cliente_nombre_completo: perfil.nombre_cliente || pedido.cliente_nombre || 'Cliente',
          cliente_email: perfil.email || 'Sin email',
          cliente_telefono: perfil.telefono || pedido.telefono || 'Sin teléfono',
          cliente_direccion: direccionCompleta,
          items_nombres: itemsNombres,
        };
      });

      setPedidos(pedidosConCliente);
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  // ============================================================
  // 📊 MÉTRICAS
  // ============================================================
  const metricas = useMemo(() => {
    const total = pedidos.length;
    const activos = pedidos.filter(p => ESTADOS_ACTIVOS.includes(p.estado)).length;
    const finalizados = pedidos.filter(p => ESTADOS_FINALIZADOS.includes(p.estado)).length;
    const urgentes = pedidos.filter(p => esPedidoUrgente(p.creado_en, p.estado)).length;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vendidoHoy = pedidos
      .filter(p => new Date(p.creado_en).getTime() >= hoy.getTime())
      .filter(p => p.estado !== 'cancelado')
      .reduce((sum, p) => sum + (p.total || 0), 0);

    return { total, activos, finalizados, urgentes, vendidoHoy };
  }, [pedidos]);

  // ============================================================
  // 🔍 FILTRADO Y ORDENAMIENTO
  // ============================================================
  const pedidosFiltrados = useMemo(() => {
    let resultado = [...pedidos];

    if (filtroEstado === 'activos') {
      resultado = resultado.filter(p => ESTADOS_ACTIVOS.includes(p.estado));
    } else if (filtroEstado === 'finalizados') {
      resultado = resultado.filter(p => ESTADOS_FINALIZADOS.includes(p.estado));
    } else if (filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      resultado = resultado.filter(p =>
        String(p.id).includes(q) ||
        (p.cliente_nombre_completo || '').toLowerCase().includes(q) ||
        (p.cliente_telefono || '').toLowerCase().includes(q)
      );
    }

    resultado.sort((a, b) => {
      const ta = new Date(a.creado_en).getTime();
      const tb = new Date(b.creado_en).getTime();
      return orden === 'recientes' ? tb - ta : ta - tb;
    });

    return resultado;
  }, [pedidos, filtroEstado, busqueda, orden]);

  // ============================================================
  // 🗑️ LIMPIAR PEDIDOS
  // ============================================================
  const limpiarPedidos = async (tipo: 'todos' | 'finalizados') => {
    setLimpiando(true);
    setTipoLimpieza(tipo);

    try {
      let idsAEliminar: number[] = [];

      if (tipo === 'todos') {
        idsAEliminar = pedidos.map(p => p.id);
      } else {
        idsAEliminar = pedidos
          .filter(p => ESTADOS_FINALIZADOS.includes(p.estado))
          .map(p => p.id);
      }

      if (idsAEliminar.length === 0) {
        toast.advertencia('No hay pedidos para eliminar');
        setLimpiando(false);
        setMostrarModalLimpieza(false);
        setTipoLimpieza(null);
        return;
      }

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .in('id', idsAEliminar);

      if (error) throw error;

      toast.exito(`Se eliminaron ${idsAEliminar.length} pedidos`);
      await cargarPedidos();

    } catch (error: any) {
      console.error('❌ Error en limpieza:', error);
      toast.error('Error al limpiar los pedidos');
    } finally {
      setLimpiando(false);
      setMostrarModalLimpieza(false);
      setTipoLimpieza(null);
    }
  };

  // ============================================================
  // 🔄 CAMBIAR ESTADO + NOTIFICAR AL CLIENTE
  // ============================================================
  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const pedido = pedidos.find(p => p.id === id);
      if (!pedido) return;

      const { error } = await supabase
        .from('pedidos')
        .update({ estado })
        .eq('id', id);

      if (error) throw error;

      toast.exito(`Pedido #${id} → ${ESTADOS_PEDIDO[estado]?.label || estado}`);

      if (pedido.id_de_usuario) {
        notificacionService.notificarClienteCambioEstado(
          pedido.id_de_usuario,
          id,
          estado
        ).catch((err) => {
          console.warn('⚠️ Error notificando al cliente:', err);
        });
      }

      cargarPedidos();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('No se pudo actualizar el estado');
    }
  };

  // ============================================================
  // 📞 LLAMAR CLIENTE
  // ============================================================
  const llamarCliente = (telefono: string) => {
    if (!telefono || telefono === 'Sin teléfono') {
      toast.advertencia('Este cliente no tiene teléfono');
      return;
    }
    Linking.openURL(`tel:${telefono}`).catch(() => {
      toast.error('No se pudo realizar la llamada');
    });
  };

  // ============================================================
  // 💬 ABRIR WHATSAPP CON MENSAJE CONTEXTUAL
  // ============================================================
  const abrirWhatsApp = (
    telefono: string,
    nombre?: string,
    pedidoId?: number,
    estado?: string
  ) => {
    if (!telefono || telefono === 'Sin teléfono') {
      toast.advertencia('Este cliente no tiene teléfono');
      return;
    }

    const numero = normalizarTelefonoParaWhatsApp(telefono);

    if (!numero) {
      toast.advertencia('El número de teléfono no es válido');
      return;
    }

    // ✅ Mensaje contextual según el estado
    const nombreCorto = (nombre || '').split(' ')[0] || '';
    let mensaje = '';

    if (pedidoId && estado) {
      const mensajesPorEstado: Record<string, string> = {
        pendiente: `¡Hola ${nombreCorto}! Te escribo de Krusty Burger 🍔 para confirmar tu pedido #${pedidoId}.`,
        confirmado: `¡Hola ${nombreCorto}! Tu pedido #${pedidoId} ya está confirmado ✅. En breve empezamos a prepararlo.`,
        preparando: `¡Hola ${nombreCorto}! Estamos preparando tu pedido #${pedidoId} 🍔. En un rato sale.`,
        listo: `¡Hola ${nombreCorto}! Tu pedido #${pedidoId} está listo ✅. Ya casi sale.`,
        en_camino: `¡Hola ${nombreCorto}! Tu pedido #${pedidoId} está en camino 🛵. Llega en un toque.`,
        entregado: `¡Hola ${nombreCorto}! Esperamos que hayas disfrutado tu pedido #${pedidoId} 🎉. ¡Gracias por elegirnos!`,
        cancelado: `¡Hola ${nombreCorto}! Lamentablemente tu pedido #${pedidoId} fue cancelado. Cualquier duda, escribinos.`,
      };
      mensaje = mensajesPorEstado[estado] || `¡Hola ${nombreCorto}! Te escribo de Krusty Burger 🍔 por tu pedido #${pedidoId}.`;
    } else if (pedidoId) {
      mensaje = `¡Hola ${nombreCorto}! Te escribo de Krusty Burger 🍔 por tu pedido #${pedidoId}.`;
    } else if (nombreCorto) {
      mensaje = `¡Hola ${nombreCorto}! Te escribo de Krusty Burger 🍔.`;
    } else {
      mensaje = '¡Hola! Te escribo de Krusty Burger 🍔.';
    }

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    Linking.openURL(url).catch(() => {
      toast.error('No se pudo abrir WhatsApp');
    });
  };

  // ============================================================
  // 📋 COPIAR TELÉFONO
  // ============================================================
  const copiarTelefono = async (telefono: string) => {
    if (!telefono || telefono === 'Sin teléfono') {
      toast.advertencia('Este cliente no tiene teléfono');
      return;
    }
    await Clipboard.setStringAsync(telefono);
    toast.exito('📋 Teléfono copiado');
  };

  // ============================================================
  // 👁️ ABRIR DETALLE
  // ============================================================
  const abrirDetalle = (pedido: PedidoConCliente) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalDetalle(true);
  };

  const manejarRefresh = useCallback(() => {
    setRefrescando(true);
    cargarPedidos();
  }, []);

  // ============================================================
  // 🎨 RENDER DE CADA PEDIDO (RESPONSIVE)
  // ============================================================
  const renderPedido = ({ item }: { item: PedidoConCliente }) => {
    const estadoInfo = ESTADOS_PEDIDO[item.estado] || ESTADOS_PEDIDO.pendiente;
    const isTerminado = ESTADOS_FINALIZADOS.includes(item.estado);
    const esUrgente = esPedidoUrgente(item.creado_en, item.estado);
    const esEfectivo = item.metodo_pago === 'efectivo';

    // ✅ Tamaños responsive
    const cardPadding = responsive.getValor({ tablet: 16, normal: 12, small: 10 });
    const pedidoIdSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });
    const fechaSize = responsive.getValor({ tablet: 12, normal: 11, small: 10 });
    const estadoTextSize = responsive.getValor({ tablet: 11, normal: 10, small: 9 });
    const estadoIconSize = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
    const clienteNombreSize = responsive.getValor({ tablet: 15, normal: 14, small: 12 });
    const infoTextSize = responsive.getValor({ tablet: 13, normal: 12, small: 10 });
    const totalLabelSize = responsive.getValor({ tablet: 12, normal: 11, small: 10 });
    const totalValorSize = responsive.getValor({ tablet: 22, normal: 20, small: 17 });
    const botonAvanzarSize = responsive.getValor({ tablet: 14, normal: 13, small: 11 });
    const botonAvanzarPad = responsive.getValor({ tablet: 12, normal: 10, small: 8 });
    const badgeUrgenteSize = responsive.getValor({ tablet: 10, normal: 9, small: 8 });
    const iconoContactoSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });
    const botonContactoPad = responsive.getValor({ tablet: 8, normal: 7, small: 6 });

    const renderRightActions = () => {
      if (isTerminado || !estadoInfo.siguiente) return null;

      const siguienteEstado = estadoInfo.siguiente;
      const siguienteInfo = ESTADOS_PEDIDO[siguienteEstado];

      return (
        <TouchableOpacity
          style={[
            estilos.swipeAction,
            {
              backgroundColor: siguienteInfo.color,
              width: responsive.getValor({ tablet: 110, normal: 100, small: 80 }),
            },
          ]}
          onPress={() => cambiarEstado(item.id, siguienteEstado)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-forward"
            size={responsive.getValor({ tablet: 26, normal: 24, small: 20 })}
            color="#FFF"
          />
          <Text
            style={[
              estilos.swipeActionText,
              { fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }) },
            ]}
            numberOfLines={1}
          >
            {siguienteInfo.label}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        enabled={!isTerminado && !!estadoInfo.siguiente}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => abrirDetalle(item)}
        >
          <View
            style={[
              estilos.tarjeta,
              {
                borderLeftColor: estadoInfo.color,
                padding: cardPadding,
              },
            ]}
          >
            {/* ENCABEZADO: ID + URGENTE inline + ESTADO */}
            <View style={estilos.encabezado}>
              <View style={estilos.encabezadoIzq}>
                <View style={estilos.pedidoIdRow}>
                  <Text style={[estilos.pedidoId, { fontSize: pedidoIdSize }]}>
                    #{item.id}
                  </Text>
                  {esUrgente && (
                    <View style={estilos.badgeUrgenteInline}>
                      <Ionicons name="alert-circle" size={badgeUrgenteSize} color="#FFF" />
                      <Text style={[estilos.badgeUrgenteInlineText, { fontSize: badgeUrgenteSize }]}>
                        URGENTE
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[estilos.pedidoFecha, { fontSize: fechaSize }]}>
                  {formatearTiempoTranscurrido(item.creado_en)}
                </Text>
              </View>

              <View
                style={[
                  estilos.estadoBadge,
                  {
                    backgroundColor: estadoInfo.color + '20',
                    borderColor: estadoInfo.color + '40',
                    paddingHorizontal: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                    paddingVertical: responsive.getValor({ tablet: 6, normal: 5, small: 4 }),
                  },
                ]}
              >
                <Ionicons
                  name={estadoInfo.icono as any}
                  size={estadoIconSize}
                  color={estadoInfo.color}
                />
                <Text
                  style={[
                    estilos.estadoBadgeText,
                    { color: estadoInfo.color, fontSize: estadoTextSize },
                  ]}
                  numberOfLines={1}
                >
                  {estadoInfo.label}
                </Text>
              </View>
            </View>

            {/* CLIENTE + BOTONES DE CONTACTO */}
            <View style={estilos.clienteRow}>
              <Ionicons
                name="person-circle-outline"
                size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })}
                color={DISENO.colors.accent}
              />
              <Text
                style={[estilos.clienteNombre, { fontSize: clienteNombreSize }]}
                numberOfLines={1}
              >
                {item.cliente_nombre_completo}
              </Text>

              {/* Botón llamada */}
              <TouchableOpacity
                onPress={() => llamarCliente(item.cliente_telefono || '')}
                style={[
                  estilos.botonContacto,
                  {
                    backgroundColor: DISENO.colors.success + '15',
                    padding: botonContactoPad,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="call"
                  size={iconoContactoSize}
                  color={DISENO.colors.success}
                />
              </TouchableOpacity>

              {/* Botón WhatsApp */}
              <TouchableOpacity
                onPress={() =>
                  abrirWhatsApp(
                    item.cliente_telefono || '',
                    item.cliente_nombre_completo,
                    item.id,
                    item.estado
                  )
                }
                style={[
                  estilos.botonContacto,
                  {
                    backgroundColor: COLOR_WHATSAPP + '15',
                    padding: botonContactoPad,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={iconoContactoSize}
                  color={COLOR_WHATSAPP}
                />
              </TouchableOpacity>
            </View>

            {/* DIRECCIÓN */}
            {item.tipo_entrega === 'domicilio' && item.cliente_direccion && (
              <View style={estilos.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={responsive.getValor({ tablet: 14, normal: 12, small: 11 })}
                  color={DISENO.colors.textSecondary}
                />
                <Text style={[estilos.infoText, { fontSize: infoTextSize }]} numberOfLines={1}>
                  {item.cliente_direccion}
                </Text>
              </View>
            )}

            {/* PRODUCTOS */}
            {item.items_nombres && item.items_nombres.length > 0 && (
              <View style={estilos.infoRow}>
                <Ionicons
                  name="fast-food-outline"
                  size={responsive.getValor({ tablet: 14, normal: 12, small: 11 })}
                  color={DISENO.colors.textSecondary}
                />
                <Text style={[estilos.infoText, { fontSize: infoTextSize }]} numberOfLines={1}>
                  {item.items_nombres.slice(0, 2).join(' · ')}
                  {item.items_nombres.length > 2 && ` +${item.items_nombres.length - 2}`}
                </Text>
              </View>
            )}

            {/* TOTAL + PAGO */}
            <View style={estilos.totalRow}>
              <View style={estilos.totalIzq}>
                <Text style={[estilos.totalLabel, { fontSize: totalLabelSize }]}>Total</Text>
                <Text style={[estilos.totalValor, { fontSize: totalValorSize }]}>
                  {formatearPrecio(item.total || 0)}
                </Text>
              </View>

              {esEfectivo && item.monto_pago ? (
                <View style={estilos.pagoBadge}>
                  <Ionicons
                    name="cash-outline"
                    size={responsive.getValor({ tablet: 14, normal: 12, small: 10 })}
                    color={DISENO.colors.success}
                  />
                  <Text
                    style={[
                      estilos.pagoBadgeText,
                      { fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 9 }) },
                    ]}
                  >
                    Vuelto: {formatearPrecio(item.vuelto || 0)}
                  </Text>
                </View>
              ) : (
                <View style={[estilos.pagoBadge, { backgroundColor: DISENO.colors.info + '15' }]}>
                  <Ionicons
                    name="card-outline"
                    size={responsive.getValor({ tablet: 14, normal: 12, small: 10 })}
                    color={DISENO.colors.info}
                  />
                  <Text
                    style={[
                      estilos.pagoBadgeText,
                      {
                        color: DISENO.colors.info,
                        fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 9 }),
                      },
                    ]}
                  >
                    {item.metodo_pago === 'transferencia' ? 'Transfer.' : 'Sin pago'}
                  </Text>
                </View>
              )}
            </View>

            {/* BOTONES */}
            {!isTerminado && estadoInfo.siguiente && (
              <View style={estilos.botonesRow}>
                <TouchableOpacity
                  style={[
                    estilos.botonAvanzar,
                    {
                      backgroundColor: estadoInfo.color,
                      paddingVertical: botonAvanzarPad,
                    },
                  ]}
                  onPress={() => cambiarEstado(item.id, estadoInfo.siguiente!)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-forward-circle"
                    size={responsive.getValor({ tablet: 20, normal: 18, small: 15 })}
                    color="#FFF"
                  />
                  <Text
                    style={[estilos.botonAvanzarText, { fontSize: botonAvanzarSize }]}
                    numberOfLines={1}
                  >
                    {ESTADOS_PEDIDO[estadoInfo.siguiente!].label}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.botonCancelar,
                    { paddingVertical: botonAvanzarPad },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      '¿Cancelar pedido?',
                      `¿Seguro que querés cancelar el pedido #${item.id}?`,
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Sí, cancelar',
                          style: 'destructive',
                          onPress: () => cambiarEstado(item.id, 'cancelado'),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={responsive.getValor({ tablet: 20, normal: 18, small: 15 })}
                    color={DISENO.colors.danger}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // ============================================================
  // 🎯 CHIPS DE FILTRO
  // ============================================================
  const chipsFiltro = [
    { id: 'activos', label: '🔥 Activos', count: metricas.activos },
    { id: 'pendiente', label: '⏳ Pendientes', count: pedidos.filter(p => p.estado === 'pendiente').length },
    { id: 'preparando', label: '🍔 Preparando', count: pedidos.filter(p => p.estado === 'preparando').length },
    { id: 'en_camino', label: '🛵 En camino', count: pedidos.filter(p => p.estado === 'en_camino').length },
    { id: 'finalizados', label: '✅ Finalizados', count: metricas.finalizados },
    { id: 'todos', label: '📋 Todos', count: metricas.total },
  ];

  // ============================================================
  // 🏗️ RENDER
  // ============================================================
  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={DISENO.colors.accent} />
        <Text style={estilos.cargandoText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={estilos.contenedor}>
        <LinearGradient
          colors={[DISENO.colors.fondo, DISENO.colors.surface]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* HEADER */}
        <View
          style={[
            estilos.header,
            {
              paddingTop: insets.top + 12,
              paddingHorizontal: responsive.getEspaciado('LG'),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={estilos.botonHeader}
          >
            <Ionicons name="arrow-back" size={22} color={DISENO.colors.text} />
          </TouchableOpacity>

          <View style={estilos.headerCentro}>
            <Text style={estilos.titulo}>📋 Pedidos</Text>
            {metricas.urgentes > 0 && (
              <View style={estilos.alertaUrgentes}>
                <Ionicons name="alert-circle" size={12} color="#FFF" />
                <Text style={estilos.alertaUrgentesText}>
                  {metricas.urgentes} urgente{metricas.urgentes > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={estilos.botonHeader}
            onPress={() => setMostrarModalLimpieza(true)}
            disabled={pedidos.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={pedidos.length === 0 ? DISENO.colors.textTertiary : DISENO.colors.danger}
            />
          </TouchableOpacity>
        </View>

        {/* RESUMEN DEL DÍA */}
        <View
          style={[
            estilos.resumenHoy,
            { marginHorizontal: responsive.getEspaciado('LG') },
          ]}
        >
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenLabel}>Vendido hoy</Text>
            <Text style={estilos.resumenValor}>{formatearPrecio(metricas.vendidoHoy)}</Text>
          </View>
          <View style={estilos.resumenDivider} />
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenLabel}>Activos</Text>
            <Text style={[estilos.resumenValor, { color: DISENO.colors.accent }]}>
              {metricas.activos}
            </Text>
          </View>
          <View style={estilos.resumenDivider} />
          <View style={estilos.resumenItem}>
            <Text style={estilos.resumenLabel}>Total</Text>
            <Text style={estilos.resumenValor}>{metricas.total}</Text>
          </View>
        </View>

        {/* BUSCADOR */}
        <View
          style={[
            estilos.buscadorContainer,
            { marginHorizontal: responsive.getEspaciado('LG') },
          ]}
        >
          <Ionicons name="search" size={18} color={DISENO.colors.textSecondary} />
          <TextInput
            style={estilos.buscadorInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por ID, cliente o teléfono..."
            placeholderTextColor={DISENO.colors.textTertiary}
            selectionColor={DISENO.colors.accent}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={DISENO.colors.textTertiary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={estilos.botonOrden}
            onPress={() => setOrden(orden === 'recientes' ? 'antiguos' : 'recientes')}
          >
            <Ionicons
              name={orden === 'recientes' ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={DISENO.colors.accent}
            />
          </TouchableOpacity>
        </View>

        {/* CHIPS DE FILTRO */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            estilos.chipsScroll,
            { paddingHorizontal: responsive.getEspaciado('LG') },
          ]}
        >
          {chipsFiltro.map(chip => {
            const activo = filtroEstado === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[estilos.chip, activo && estilos.chipActivo]}
                onPress={() => setFiltroEstado(chip.id)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.chipText, activo && estilos.chipTextActivo]}>
                  {chip.label}
                </Text>
                {chip.count > 0 && (
                  <View style={[estilos.chipBadge, activo && estilos.chipBadgeActivo]}>
                    <Text style={[estilos.chipBadgeText, activo && estilos.chipBadgeTextActivo]}>
                      {chip.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* LISTA */}
        <FlatList
          data={pedidosFiltrados}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPedido}
          contentContainerStyle={[
            estilos.lista,
            {
              paddingHorizontal: responsive.getEspaciado('LG'),
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <Ionicons name="receipt-outline" size={60} color={DISENO.colors.textTertiary} />
              <Text style={estilos.vacioTexto}>
                {busqueda ? 'Sin resultados' : 'No hay pedidos'}
              </Text>
              <Text style={estilos.vacioSubtexto}>
                {busqueda ? 'Probá con otra búsqueda' : 'Los pedidos aparecerán acá'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={DISENO.colors.accent}
              colors={[DISENO.colors.accent]}
            />
          }
        />
      </View>

      {/* MODAL LIMPIEZA */}
      <Modal
        visible={mostrarModalLimpieza}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMostrarModalLimpieza(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContainer}>
            <View style={[estilos.modalIcono, { backgroundColor: DISENO.colors.danger + '15' }]}>
              <Ionicons name="trash" size={40} color={DISENO.colors.danger} />
            </View>
            <Text style={estilos.modalTitulo}>Limpiar pedidos</Text>
            <Text style={estilos.modalDescripcion}>
              Esta acción elimina pedidos de forma permanente.
              {metricas.finalizados > 0 && `\n\nHay ${metricas.finalizados} pedidos finalizados.`}
            </Text>

            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalBotonSecundario]}
                onPress={() => setMostrarModalLimpieza(false)}
              >
                <Text style={estilos.modalBotonTextoSecundario}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.modalBoton,
                  estilos.modalBotonPeligro,
                  { opacity: metricas.finalizados === 0 ? 0.5 : 1 },
                ]}
                onPress={() => limpiarPedidos('finalizados')}
                disabled={metricas.finalizados === 0 || limpiando}
              >
                {limpiando && tipoLimpieza === 'finalizados' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={estilos.modalBotonTextoPeligro}>
                    Eliminar finalizados ({metricas.finalizados})
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {metricas.total > 0 && (
              <TouchableOpacity
                style={estilos.modalBotonTodos}
                onPress={() => {
                  Alert.alert(
                    '⚠️ Eliminar TODOS',
                    '¿Seguro? No se puede deshacer.',
                    [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Sí, eliminar todos',
                        style: 'destructive',
                        onPress: () => limpiarPedidos('todos'),
                      },
                    ]
                  );
                }}
                disabled={limpiando}
              >
                {limpiando && tipoLimpieza === 'todos' ? (
                  <ActivityIndicator size="small" color={DISENO.colors.danger} />
                ) : (
                  <Text style={estilos.modalBotonTodosTexto}>
                    ⚠️ Eliminar TODOS ({metricas.total})
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DETALLE */}
      <Modal
        visible={mostrarModalDetalle}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMostrarModalDetalle(false)}
      >
        <View style={estilos.modalDetalleOverlay}>
          <View style={estilos.modalDetalleContainer}>
            <View style={estilos.modalDetalleHeader}>
              <Text style={estilos.modalDetalleTitulo}>
                Pedido #{pedidoSeleccionado?.id}
              </Text>
              <TouchableOpacity onPress={() => setMostrarModalDetalle(false)}>
                <Ionicons name="close" size={24} color={DISENO.colors.text} />
              </TouchableOpacity>
            </View>

            {pedidoSeleccionado && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.modalDetalleScroll}
              >
                {/* CLIENTE */}
                <View style={estilos.seccion}>
                  <Text style={estilos.seccionTitulo}>👤 Cliente</Text>
                  <Text style={estilos.seccionTexto}>
                    {pedidoSeleccionado.cliente_nombre_completo}
                  </Text>
                  <Text style={estilos.seccionTextoChico}>
                    📧 {pedidoSeleccionado.cliente_email}
                  </Text>
                  <Text style={estilos.seccionTextoChico}>
                    📞 {pedidoSeleccionado.cliente_telefono}
                  </Text>

                  {/* ✅ BOTONES DE CONTACTO EN EL MODAL */}
                  <View style={estilos.modalContactoRow}>
                    <TouchableOpacity
                      style={[
                        estilos.modalContactoBoton,
                        { backgroundColor: DISENO.colors.success + '15' },
                      ]}
                      onPress={() => llamarCliente(pedidoSeleccionado.cliente_telefono || '')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={16} color={DISENO.colors.success} />
                      <Text style={[estilos.modalContactoTexto, { color: DISENO.colors.success }]}>
                        Llamar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        estilos.modalContactoBoton,
                        { backgroundColor: COLOR_WHATSAPP + '15' },
                      ]}
                      onPress={() =>
                        abrirWhatsApp(
                          pedidoSeleccionado.cliente_telefono || '',
                          pedidoSeleccionado.cliente_nombre_completo,
                          pedidoSeleccionado.id,
                          pedidoSeleccionado.estado
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={COLOR_WHATSAPP} />
                      <Text style={[estilos.modalContactoTexto, { color: COLOR_WHATSAPP }]}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        estilos.modalContactoBoton,
                        { backgroundColor: DISENO.colors.info + '15' },
                      ]}
                      onPress={() => copiarTelefono(pedidoSeleccionado.cliente_telefono || '')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="copy-outline" size={16} color={DISENO.colors.info} />
                      <Text style={[estilos.modalContactoTexto, { color: DISENO.colors.info }]}>
                        Copiar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DIRECCIÓN */}
                {pedidoSeleccionado.tipo_entrega === 'domicilio' && (
                  <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>📍 Dirección</Text>
                    <Text style={estilos.seccionTexto}>
                      {pedidoSeleccionado.cliente_direccion}
                    </Text>
                  </View>
                )}

                {/* PRODUCTOS */}
                <View style={estilos.seccion}>
                  <Text style={estilos.seccionTitulo}>🛒 Productos</Text>
                  {pedidoSeleccionado.items_nombres?.map((item, idx) => (
                    <Text key={idx} style={estilos.seccionTextoChico}>
                      • {item}
                    </Text>
                  ))}
                </View>

                {/* RESUMEN */}
                <View style={estilos.seccion}>
                  <Text style={estilos.seccionTitulo}>📊 Resumen</Text>

                  <View style={estilos.filaResumen}>
                    <Text style={estilos.labelResumen}>Subtotal</Text>
                    <Text style={estilos.valorResumen}>
                      {formatearPrecio(pedidoSeleccionado.total_parcial || 0)}
                    </Text>
                  </View>

                  <View style={estilos.filaResumen}>
                    <Text style={estilos.labelResumen}>Envío</Text>
                    <Text style={estilos.valorResumen}>
                      {formatearPrecio(pedidoSeleccionado.costo_envio || 0)}
                    </Text>
                  </View>

                  {pedidoSeleccionado.metodo_pago === 'efectivo' &&
                    pedidoSeleccionado.monto_pago && (
                      <>
                        <View style={estilos.filaResumen}>
                          <Text
                            style={[
                              estilos.labelResumen,
                              { color: DISENO.colors.accent },
                            ]}
                          >
                            💰 Pagó con
                          </Text>
                          <Text
                            style={[
                              estilos.valorResumen,
                              { color: DISENO.colors.accent },
                            ]}
                          >
                            {formatearPrecio(pedidoSeleccionado.monto_pago)}
                          </Text>
                        </View>
                        <View style={estilos.filaResumen}>
                          <Text
                            style={[
                              estilos.labelResumen,
                              { color: DISENO.colors.success },
                            ]}
                          >
                            💵 Vuelto
                          </Text>
                          <Text
                            style={[
                              estilos.valorResumen,
                              { color: DISENO.colors.success },
                            ]}
                          >
                            {formatearPrecio(pedidoSeleccionado.vuelto || 0)}
                          </Text>
                        </View>
                      </>
                    )}

                  <View style={[estilos.filaResumen, estilos.filaTotal]}>
                    <Text style={estilos.totalLabelModal}>TOTAL</Text>
                    <Text style={estilos.totalValorGrandeModal}>
                      {formatearPrecio(pedidoSeleccionado.total || 0)}
                    </Text>
                  </View>
                </View>

                {/* BOTÓN CERRAR */}
                <TouchableOpacity
                  style={estilos.botonCerrarModal}
                  onPress={() => setMostrarModalDetalle(false)}
                >
                  <Text style={estilos.botonCerrarModalText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        ocultar={toast.ocultar}
      />
    </>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  cargandoText: {
    fontFamily: FUENTES.display,
    marginTop: 16,
    color: DISENO.colors.textSecondary,
    fontSize: 14,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  botonHeader: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  headerCentro: {
    flex: 1,
    alignItems: 'center',
  },
  titulo: {
    fontFamily: FUENTES.display,
    fontSize: 20,
    color: DISENO.colors.text,
  },
  alertaUrgentes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DISENO.colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  alertaUrgentesText: {
    fontFamily: FUENTES.regular,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },

  // RESUMEN
  resumenHoy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    padding: 14,
    marginBottom: 12,
    ...DISENO.shadow.sm,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenLabel: {
    fontFamily: FUENTES.regular,
    fontSize: 11,
    color: DISENO.colors.textSecondary,
    marginBottom: 2,
  },
  resumenValor: {
    fontFamily: FUENTES.display,
    fontSize: 18,
    color: DISENO.colors.text,
  },
  resumenDivider: {
    width: 1,
    height: 30,
    backgroundColor: DISENO.colors.border,
  },

  // BUSCADOR
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    ...DISENO.shadow.sm,
  },
  buscadorInput: {
    flex: 1,
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.text,
    paddingVertical: 4,
  },
  botonOrden: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: DISENO.colors.accent + '15',
  },

  // CHIPS
  chipsScroll: {
    gap: 8,
    paddingBottom: 12,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  chipActivo: {
    backgroundColor: DISENO.colors.accent,
    borderColor: DISENO.colors.accent,
  },
  chipText: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    fontWeight: '600',
    color: DISENO.colors.textSecondary,
  },
  chipTextActivo: {
    color: '#FFF',
  },
  chipBadge: {
    backgroundColor: DISENO.colors.textTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  chipBadgeActivo: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  chipBadgeText: {
    fontFamily: FUENTES.regular,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  chipBadgeTextActivo: {
    color: '#FFF',
  },

  // LISTA
  lista: {
    flexGrow: 1,
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
    marginTop: 4,
  },

  // ============================================================
  // ✅ TARJETA (RESPONSIVE)
  // ============================================================
  tarjeta: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...DISENO.shadow.sm,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  encabezadoIzq: {
    flex: 1,
    minWidth: 0,
  },
  pedidoIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pedidoId: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
  },
  pedidoFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  badgeUrgenteInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DISENO.colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeUrgenteInlineText: {
    fontFamily: FUENTES.regular,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  estadoBadgeText: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  clienteNombre: {
    flex: 1,
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  // ✅ Botón de contacto (llamada / WhatsApp)
  botonContacto: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    gap: 8,
  },
  totalIzq: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 1,
  },
  totalLabel: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    textTransform: 'uppercase',
  },
  totalValor: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.accent,
  },
  pagoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DISENO.colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  pagoBadgeText: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.success,
  },

  botonesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  botonAvanzar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    minWidth: 0,
  },
  botonAvanzarText: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: '#FFF',
    flexShrink: 1,
  },
  botonCancelar: {
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DISENO.colors.danger + '30',
    backgroundColor: DISENO.colors.danger + '08',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // SWIPE
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderTopRightRadius: DISENO.radius.lg,
    borderBottomRightRadius: DISENO.radius.lg,
    gap: 4,
  },
  swipeActionText: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: '#FFF',
  },

  // MODAL LIMPIEZA
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...DISENO.shadow.lg,
  },
  modalIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontFamily: FUENTES.display,
    fontSize: 20,
    color: DISENO.colors.text,
    marginBottom: 8,
  },
  modalDescripcion: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotonSecundario: {
    backgroundColor: DISENO.colors.surfaceHover,
  },
  modalBotonPeligro: {
    backgroundColor: DISENO.colors.danger,
  },
  modalBotonTextoSecundario: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  modalBotonTextoPeligro: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  modalBotonTodos: {
    marginTop: 12,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DISENO.colors.danger + '30',
  },
  modalBotonTodosTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    fontWeight: '600',
    color: DISENO.colors.danger,
  },

  // MODAL DETALLE
  modalDetalleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDetalleContainer: {
    backgroundColor: DISENO.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalDetalleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DISENO.colors.border,
    marginBottom: 16,
  },
  modalDetalleTitulo: {
    fontFamily: FUENTES.display,
    fontSize: 20,
    color: DISENO.colors.text,
  },
  modalDetalleScroll: {
    paddingBottom: 8,
  },
  seccion: {
    marginBottom: 16,
  },
  seccionTitulo: {
    fontFamily: FUENTES.display,
    fontSize: 14,
    color: DISENO.colors.accent,
    marginBottom: 6,
  },
  seccionTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    color: DISENO.colors.text,
    paddingVertical: 2,
  },
  seccionTextoChico: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textSecondary,
    paddingVertical: 2,
  },
  // ✅ Botones de contacto del modal
  modalContactoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modalContactoBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalContactoTexto: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    fontWeight: '600',
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  labelResumen: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: DISENO.colors.textSecondary,
  },
  valorResumen: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  filaTotal: {
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    paddingTop: 8,
    marginTop: 6,
  },
  totalLabelModal: {
    fontFamily: FUENTES.display,
    fontSize: 16,
    color: DISENO.colors.text,
  },
  totalValorGrandeModal: {
    fontFamily: FUENTES.display,
    fontSize: 22,
    color: DISENO.colors.accent,
  },
  botonCerrarModal: {
    backgroundColor: DISENO.colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  botonCerrarModalText: {
    fontFamily: FUENTES.display,
    fontSize: 15,
    color: '#FFF',
  },
});