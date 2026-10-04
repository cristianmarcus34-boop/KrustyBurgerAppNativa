// screens/admin/PantallaGestionPedidos.tsx - V2 KRUSTY + MODO OSCURO + REPORTES DE PROBLEMA
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
import { useResponsive } from '../../lib/colores';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { notificacionService } from '../../services/notificacionService';
import { useToast, Toast } from '../../components/Toast';

// ============================================================
// 🎨 ESTADOS DE PEDIDO (colores dinámicos, se calculan en el componente)
// ============================================================
const ESTADOS_LABELS: Record<string, { label: string; icono: string; siguiente?: string }> = {
  pendiente: { label: 'Pendiente', icono: 'time-outline', siguiente: 'confirmado' },
  confirmado: { label: 'Confirmado', icono: 'checkmark-circle-outline', siguiente: 'preparando' },
  preparando: { label: 'Preparando', icono: 'restaurant-outline', siguiente: 'listo' },
  listo: { label: 'Listo', icono: 'checkmark-done-outline' },
  en_camino: { label: 'En camino', icono: 'bicycle-outline' },
  entregado: { label: 'Entregado', icono: 'checkmark-done-circle-outline' },
  cancelado: { label: 'Cancelado', icono: 'close-circle-outline' },
};

const ESTADOS_FINALIZADOS = ['entregado', 'cancelado'];
const ESTADOS_ACTIVOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'];
const MINUTOS_URGENTE = 15;

const COLOR_WHATSAPP = '#25D366';

// ============================================================
// 🆕 MOTIVOS DE PROBLEMA (texto legible)
// ============================================================
const MOTIVOS_PROBLEMA_TEXTO: Record<string, string> = {
  cliente_ausente: 'Cliente ausente',
  direccion_incorrecta: 'Dirección incorrecta',
  cliente_rechazo: 'Cliente rechazó el pedido',
  otro: 'Otro problema',
};

const MOTIVOS_PROBLEMA_ICONO: Record<string, string> = {
  cliente_ausente: 'person-remove-outline',
  direccion_incorrecta: 'location-outline',
  cliente_rechazo: 'close-circle-outline',
  otro: 'alert-circle-outline',
};

// ============================================================
// 🆕 INTERFAZ
// ============================================================
interface PedidoConCliente extends Pedido {
  cliente_nombre_completo?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  items_nombres?: string[];
  // Reporte de problema
  problema_repartidor?: string | null;
  problema_detalle?: string | null;
  reportado_en?: string | null;
  problema_repartidor_id?: string | null;
  // Repartidor info (para mostrar quién reportó)
  repartidor_nombre?: string | null;
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

const normalizarTelefonoParaWhatsApp = (telefono: string): string | null => {
  if (!telefono) return null;

  let numero = telefono.replace(/\D/g, '');

  if (!numero || numero.length < 8) return null;

  if (numero.startsWith('549')) return numero;

  if (numero.startsWith('54')) {
    return `549${numero.slice(2)}`;
  }

  if (numero.startsWith('0')) {
    numero = numero.slice(1);
  }

  const match15 = numero.match(/^(\d{2,4})15(\d{6,8})$/);
  if (match15) {
    numero = `${match15[1]}${match15[2]}`;
  }

  if (numero.length === 10) {
    return `549${numero}`;
  }

  return `54${numero}`;
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionPedidos(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const ESTADOS_PEDIDO = useMemo(
    () => ({
      pendiente: { label: 'Pendiente', color: colores.accentSecondary, icono: 'time-outline', siguiente: 'confirmado' },
      confirmado: { label: 'Confirmado', color: colores.info, icono: 'checkmark-circle-outline', siguiente: 'preparando' },
      preparando: { label: 'Preparando', color: colores.naranja, icono: 'restaurant-outline', siguiente: 'listo' },
      listo: { label: 'Listo', color: colores.verde, icono: 'checkmark-done-outline' },
      en_camino: { label: 'En camino', color: colores.morado, icono: 'bicycle-outline' },
      entregado: { label: 'Entregado', color: colores.success, icono: 'checkmark-done-circle-outline' },
      cancelado: { label: 'Cancelado', color: colores.danger, icono: 'close-circle-outline' },
    }) as Record<string, { label: string; color: string; icono: string; siguiente?: string }>,
    [colores]
  );

  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalLimpieza, setMostrarModalLimpieza] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [tipoLimpieza, setTipoLimpieza] = useState<'todos' | 'finalizados' | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConCliente | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);

  // 🆕 Estados para reporte de problema
  const [mostrarModalProblema, setMostrarModalProblema] = useState(false);
  const [resolviendoProblema, setResolviendoProblema] = useState(false);

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

      // 🆕 Cargar nombres de repartidores que reportaron problemas
      const repartidoresIds = [...new Set(
        pedidosData
          .map(p => p.problema_repartidor_id)
          .filter(Boolean)
      )] as string[];

      let repartidoresMap: Record<string, string> = {};
      if (repartidoresIds.length > 0) {
        const { data: repartidoresData } = await supabase
          .from('perfiles')
          .select('id, nombre_cliente')
          .in('id', repartidoresIds);

        if (repartidoresData) {
          repartidoresMap = repartidoresData.reduce((acc, r) => {
            acc[r.id] = r.nombre_cliente || 'Repartidor';
            return acc;
          }, {} as Record<string, string>);
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

        const repartidorNombre = pedido.problema_repartidor_id
          ? repartidoresMap[pedido.problema_repartidor_id] || null
          : null;

        return {
          ...pedido,
          cliente_nombre_completo: perfil.nombre_cliente || pedido.cliente_nombre || 'Cliente',
          cliente_email: perfil.email || 'Sin email',
          cliente_telefono: perfil.telefono || pedido.telefono || 'Sin teléfono',
          cliente_direccion: direccionCompleta,
          items_nombres: itemsNombres,
          repartidor_nombre: repartidorNombre,
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
    const conProblema = pedidos.filter(p => !!p.problema_repartidor).length;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vendidoHoy = pedidos
      .filter(p => new Date(p.creado_en).getTime() >= hoy.getTime())
      .filter(p => p.estado !== 'cancelado')
      .reduce((sum, p) => sum + (p.total || 0), 0);

    return { total, activos, finalizados, urgentes, vendidoHoy, conProblema };
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
    } else if (filtroEstado === 'con_problema') {
      resultado = resultado.filter(p => !!p.problema_repartidor);
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
  // 🆕 MARCAR PROBLEMA COMO RESUELTO
  // ============================================================
  const marcarProblemaResuelto = async (pedido: PedidoConCliente) => {
    Alert.alert(
      '¿Marcar como resuelto?',
      `El reporte "${MOTIVOS_PROBLEMA_TEXTO[pedido.problema_repartidor || ''] || 'reporte'}" del pedido #${pedido.id} se va a eliminar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, resolver',
          onPress: async () => {
            setResolviendoProblema(true);
            try {
              const { error } = await supabase
                .from('pedidos')
                .update({
                  problema_repartidor: null,
                  problema_detalle: null,
                  reportado_en: null,
                  problema_repartidor_id: null,
                })
                .eq('id', pedido.id);

              if (error) throw error;

              toast.exito('✅ Reporte marcado como resuelto');
              setMostrarModalProblema(false);
              await cargarPedidos();
            } catch (e: any) {
              console.error('Error resolviendo problema:', e);
              toast.error('No se pudo resolver el reporte');
            } finally {
              setResolviendoProblema(false);
            }
          },
        },
      ]
    );
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

  // 🆕 Abrir modal de problema
  const abrirModalProblema = (pedido: PedidoConCliente) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalProblema(true);
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
    const tieneProblema = !!item.problema_repartidor;

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
    const badgeProblemaSize = responsive.getValor({ tablet: 12, normal: 11, small: 10 });

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
                borderLeftColor: tieneProblema ? colores.danger : estadoInfo.color,
                padding: cardPadding,
              },
            ]}
          >
            {/* 🆕 BANNER DE PROBLEMA */}
            {tieneProblema && (
              <TouchableOpacity
                style={[
                  estilos.bannerProblema,
                  { backgroundColor: colores.danger + '15', borderColor: colores.danger + '40' },
                ]}
                onPress={() => abrirModalProblema(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="warning" size={badgeProblemaSize} color={colores.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[estilos.bannerProblemaTitulo, { color: colores.danger }]}>
                    ⚠️ {MOTIVOS_PROBLEMA_TEXTO[item.problema_repartidor || ''] || 'Problema reportado'}
                  </Text>
                  {item.repartidor_nombre && (
                    <Text style={[estilos.bannerProblemaSub, { color: colores.danger }]}>
                      Reportado por {item.repartidor_nombre}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colores.danger} />
              </TouchableOpacity>
            )}

            {/* ENCABEZADO */}
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

            {/* CLIENTE + CONTACTO */}
            <View style={estilos.clienteRow}>
              <Ionicons
                name="person-circle-outline"
                size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })}
                color={colores.accent}
              />
              <Text
                style={[estilos.clienteNombre, { fontSize: clienteNombreSize }]}
                numberOfLines={1}
              >
                {item.cliente_nombre_completo}
              </Text>

              <TouchableOpacity
                onPress={() => llamarCliente(item.cliente_telefono || '')}
                style={[
                  estilos.botonContacto,
                  {
                    backgroundColor: colores.success + '15',
                    padding: botonContactoPad,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="call"
                  size={iconoContactoSize}
                  color={colores.success}
                />
              </TouchableOpacity>

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
                  color={colores.textSecondary}
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
                  color={colores.textSecondary}
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
                    color={colores.success}
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
                <View style={[estilos.pagoBadge, { backgroundColor: colores.info + '15' }]}>
                  <Ionicons
                    name="card-outline"
                    size={responsive.getValor({ tablet: 14, normal: 12, small: 10 })}
                    color={colores.info}
                  />
                  <Text
                    style={[
                      estilos.pagoBadgeText,
                      {
                        color: colores.info,
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
                    color={colores.danger}
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
    { id: 'con_problema', label: '⚠️ Reportes', count: metricas.conProblema },
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
        <ActivityIndicator size="large" color={colores.accent} />
        <Text style={[estilos.cargandoText, { color: colores.textSecondary }]}>
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={estilos.contenedor}>
        <LinearGradient
          colors={[colores.fondo, colores.surface]}
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
            <Ionicons name="arrow-back" size={22} color={colores.text} />
          </TouchableOpacity>

          <View style={estilos.headerCentro}>
            <Text style={[estilos.titulo, { color: colores.text }]}>📋 Pedidos</Text>
            {metricas.conProblema > 0 && (
              <View style={[estilos.alertaUrgentes, { backgroundColor: colores.danger }]}>
                <Ionicons name="warning" size={12} color="#FFF" />
                <Text style={estilos.alertaUrgentesText}>
                  {metricas.conProblema} reporte{metricas.conProblema > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {metricas.conProblema === 0 && metricas.urgentes > 0 && (
              <View style={[estilos.alertaUrgentes, { backgroundColor: colores.danger }]}>
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
              color={pedidos.length === 0 ? colores.textTertiary : colores.danger}
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
            <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Vendido hoy</Text>
            <Text style={[estilos.resumenValor, { color: colores.text }]}>
              {formatearPrecio(metricas.vendidoHoy)}
            </Text>
          </View>
          <View style={[estilos.resumenDivider, { backgroundColor: colores.border }]} />
          <View style={estilos.resumenItem}>
            <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Activos</Text>
            <Text style={[estilos.resumenValor, { color: colores.accent }]}>
              {metricas.activos}
            </Text>
          </View>
          <View style={[estilos.resumenDivider, { backgroundColor: colores.border }]} />
          <View style={estilos.resumenItem}>
            <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Total</Text>
            <Text style={[estilos.resumenValor, { color: colores.text }]}>
              {metricas.total}
            </Text>
          </View>
        </View>

        {/* BUSCADOR */}
        <View
          style={[
            estilos.buscadorContainer,
            { marginHorizontal: responsive.getEspaciado('LG') },
          ]}
        >
          <Ionicons name="search" size={18} color={colores.textSecondary} />
          <TextInput
            style={[estilos.buscadorInput, { color: colores.text }]}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por ID, cliente o teléfono..."
            placeholderTextColor={colores.textTertiary}
            selectionColor={colores.accent}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={colores.textTertiary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[estilos.botonOrden, { backgroundColor: colores.accent + '15' }]}
            onPress={() => setOrden(orden === 'recientes' ? 'antiguos' : 'recientes')}
          >
            <Ionicons
              name={orden === 'recientes' ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={colores.accent}
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
            const esReportes = chip.id === 'con_problema';
            return (
              <TouchableOpacity
                key={chip.id}
                style={[
                  estilos.chip,
                  { borderColor: colores.border },
                  activo && {
                    backgroundColor: esReportes ? colores.danger : colores.accent,
                    borderColor: esReportes ? colores.danger : colores.accent,
                  },
                ]}
                onPress={() => setFiltroEstado(chip.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    estilos.chipText,
                    { color: colores.textSecondary },
                    activo && { color: '#FFF' },
                  ]}
                >
                  {chip.label}
                </Text>
                {chip.count > 0 && (
                  <View
                    style={[
                      estilos.chipBadge,
                      { backgroundColor: esReportes && chip.count > 0 ? colores.danger : colores.textTertiary },
                      activo && { backgroundColor: 'rgba(255,255,255,0.3)' },
                    ]}
                  >
                    <Text style={[estilos.chipBadgeText]}>
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
              <Ionicons name="receipt-outline" size={60} color={colores.textTertiary} />
              <Text style={[estilos.vacioTexto, { color: colores.text }]}>
                {busqueda ? 'Sin resultados' : filtroEstado === 'con_problema' ? 'Sin reportes' : 'No hay pedidos'}
              </Text>
              <Text style={[estilos.vacioSubtexto, { color: colores.textSecondary }]}>
                {busqueda ? 'Probá con otra búsqueda' : filtroEstado === 'con_problema' ? 'Todo en orden ✅' : 'Los pedidos aparecerán acá'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={colores.accent}
              colors={[colores.accent]}
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
            <View style={[estilos.modalIcono, { backgroundColor: colores.danger + '15' }]}>
              <Ionicons name="trash" size={40} color={colores.danger} />
            </View>
            <Text style={[estilos.modalTitulo, { color: colores.text }]}>Limpiar pedidos</Text>
            <Text style={[estilos.modalDescripcion, { color: colores.textSecondary }]}>
              Esta acción elimina pedidos de forma permanente.
              {metricas.finalizados > 0 && `\n\nHay ${metricas.finalizados} pedidos finalizados.`}
            </Text>

            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, { backgroundColor: colores.surfaceHover }]}
                onPress={() => setMostrarModalLimpieza(false)}
              >
                <Text style={[estilos.modalBotonTextoSecundario, { color: colores.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.modalBoton,
                  { backgroundColor: colores.danger },
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
                style={[estilos.modalBotonTodos, { borderColor: colores.danger + '30' }]}
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
                  <ActivityIndicator size="small" color={colores.danger} />
                ) : (
                  <Text style={[estilos.modalBotonTodosTexto, { color: colores.danger }]}>
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
            <View style={[estilos.modalDetalleHeader, { borderBottomColor: colores.border }]}>
              <Text style={[estilos.modalDetalleTitulo, { color: colores.text }]}>
                Pedido #{pedidoSeleccionado?.id}
              </Text>
              <TouchableOpacity onPress={() => setMostrarModalDetalle(false)}>
                <Ionicons name="close" size={24} color={colores.text} />
              </TouchableOpacity>
            </View>

            {pedidoSeleccionado && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.modalDetalleScroll}
              >
                {/* 🆕 PROBLEMA REPORTADO */}
                {pedidoSeleccionado.problema_repartidor && (
                  <View
                    style={[
                      estilos.seccionProblema,
                      { backgroundColor: colores.danger + '10', borderColor: colores.danger + '40' },
                    ]}
                  >
                    <Text style={[estilos.seccionTitulo, { color: colores.danger }]}>
                      ⚠️ Problema reportado
                    </Text>
                    <Text style={[estilos.seccionTexto, { color: colores.text }]}>
                      {MOTIVOS_PROBLEMA_TEXTO[pedidoSeleccionado.problema_repartidor] || 'Problema'}
                    </Text>
                    {pedidoSeleccionado.problema_detalle && (
                      <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary, fontStyle: 'italic' }]}>
                        "{pedidoSeleccionado.problema_detalle}"
                      </Text>
                    )}
                    {pedidoSeleccionado.repartidor_nombre && (
                      <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                        Reportado por: {pedidoSeleccionado.repartidor_nombre}
                      </Text>
                    )}
                    {pedidoSeleccionado.reportado_en && (
                      <Text style={[estilos.seccionTextoChico, { color: colores.textTertiary }]}>
                        {formatearTiempoTranscurrido(pedidoSeleccionado.reportado_en)}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[
                        estilos.botonResolver,
                        { backgroundColor: colores.success },
                        resolviendoProblema && { opacity: 0.6 },
                      ]}
                      onPress={() => marcarProblemaResuelto(pedidoSeleccionado)}
                      disabled={resolviendoProblema}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={estilos.botonResolverTexto}>
                        {resolviendoProblema ? 'Resolviendo...' : 'Marcar como resuelto'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CLIENTE */}
                <View style={estilos.seccion}>
                  <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>👤 Cliente</Text>
                  <Text style={[estilos.seccionTexto, { color: colores.text }]}>
                    {pedidoSeleccionado.cliente_nombre_completo}
                  </Text>
                  <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                    📧 {pedidoSeleccionado.cliente_email}
                  </Text>
                  <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                    📞 {pedidoSeleccionado.cliente_telefono}
                  </Text>

                  <View style={estilos.modalContactoRow}>
                    <TouchableOpacity
                      style={[
                        estilos.modalContactoBoton,
                        { backgroundColor: colores.success + '15' },
                      ]}
                      onPress={() => llamarCliente(pedidoSeleccionado.cliente_telefono || '')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={16} color={colores.success} />
                      <Text style={[estilos.modalContactoTexto, { color: colores.success }]}>
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
                        { backgroundColor: colores.info + '15' },
                      ]}
                      onPress={() => copiarTelefono(pedidoSeleccionado.cliente_telefono || '')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="copy-outline" size={16} color={colores.info} />
                      <Text style={[estilos.modalContactoTexto, { color: colores.info }]}>
                        Copiar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DIRECCIÓN */}
                {pedidoSeleccionado.tipo_entrega === 'domicilio' && (
                  <View style={estilos.seccion}>
                    <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>📍 Dirección</Text>
                    <Text style={[estilos.seccionTexto, { color: colores.text }]}>
                      {pedidoSeleccionado.cliente_direccion}
                    </Text>
                  </View>
                )}

                {/* PRODUCTOS */}
                <View style={estilos.seccion}>
                  <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>🛒 Productos</Text>
                  {pedidoSeleccionado.items_nombres?.map((item, idx) => (
                    <Text key={idx} style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                      • {item}
                    </Text>
                  ))}
                </View>

                {/* RESUMEN */}
                <View style={estilos.seccion}>
                  <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>📊 Resumen</Text>

                  <View style={estilos.filaResumen}>
                    <Text style={[estilos.labelResumen, { color: colores.textSecondary }]}>Subtotal</Text>
                    <Text style={[estilos.valorResumen, { color: colores.text }]}>
                      {formatearPrecio(pedidoSeleccionado.total_parcial || 0)}
                    </Text>
                  </View>

                  <View style={estilos.filaResumen}>
                    <Text style={[estilos.labelResumen, { color: colores.textSecondary }]}>Envío</Text>
                    <Text style={[estilos.valorResumen, { color: colores.text }]}>
                      {formatearPrecio(pedidoSeleccionado.costo_envio || 0)}
                    </Text>
                  </View>

                  {pedidoSeleccionado.metodo_pago === 'efectivo' &&
                    pedidoSeleccionado.monto_pago && (
                      <>
                        <View style={estilos.filaResumen}>
                          <Text style={[estilos.labelResumen, { color: colores.accent }]}>
                            💰 Pagó con
                          </Text>
                          <Text style={[estilos.valorResumen, { color: colores.accent }]}>
                            {formatearPrecio(pedidoSeleccionado.monto_pago)}
                          </Text>
                        </View>
                        <View style={estilos.filaResumen}>
                          <Text style={[estilos.labelResumen, { color: colores.success }]}>
                            💵 Vuelto
                          </Text>
                          <Text style={[estilos.valorResumen, { color: colores.success }]}>
                            {formatearPrecio(pedidoSeleccionado.vuelto || 0)}
                          </Text>
                        </View>
                      </>
                    )}

                  <View style={[estilos.filaResumen, { borderTopWidth: 1, borderTopColor: colores.border, paddingTop: 8, marginTop: 6 }]}>
                    <Text style={[estilos.totalLabelModal, { color: colores.text }]}>TOTAL</Text>
                    <Text style={[estilos.totalValorGrandeModal, { color: colores.accent }]}>
                      {formatearPrecio(pedidoSeleccionado.total || 0)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[estilos.botonCerrarModal, { backgroundColor: colores.accent }]}
                  onPress={() => setMostrarModalDetalle(false)}
                >
                  <Text style={estilos.botonCerrarModalText}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 🆕 MODAL DE PROBLEMA */}
      <Modal
        visible={mostrarModalProblema}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMostrarModalProblema(false)}
      >
        <View style={estilos.modalDetalleOverlay}>
          <View style={estilos.modalDetalleContainer}>
            <View style={[estilos.modalDetalleHeader, { borderBottomColor: colores.border }]}>
              <Text style={[estilos.modalDetalleTitulo, { color: colores.danger }]}>
                ⚠️ Reporte del pedido #{pedidoSeleccionado?.id}
              </Text>
              <TouchableOpacity onPress={() => setMostrarModalProblema(false)}>
                <Ionicons name="close" size={24} color={colores.text} />
              </TouchableOpacity>
            </View>

            {pedidoSeleccionado && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.modalDetalleScroll}
              >
                {/* Motivo */}
                <View
                  style={[
                    estilos.cardProblema,
                    { backgroundColor: colores.danger + '10', borderColor: colores.danger + '40' },
                  ]}
                >
                  <View style={[estilos.iconoProblemaWrap, { backgroundColor: colores.danger + '20' }]}>
                    <Ionicons
                      name={(MOTIVOS_PROBLEMA_ICONO[pedidoSeleccionado.problema_repartidor || 'otro'] || 'alert-circle-outline') as any}
                      size={32}
                      color={colores.danger}
                    />
                  </View>
                  <Text style={[estilos.tituloProblema, { color: colores.danger }]}>
                    {MOTIVOS_PROBLEMA_TEXTO[pedidoSeleccionado.problema_repartidor || ''] || 'Problema reportado'}
                  </Text>
                </View>

                {/* Detalle */}
                {pedidoSeleccionado.problema_detalle && (
                  <View style={estilos.seccion}>
                    <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>💬 Detalle</Text>
                    <Text style={[estilos.seccionTexto, { color: colores.text, fontStyle: 'italic' }]}>
                      "{pedidoSeleccionado.problema_detalle}"
                    </Text>
                  </View>
                )}

                {/* Quién y cuándo */}
                <View style={estilos.seccion}>
                  <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>📋 Información</Text>
                  {pedidoSeleccionado.repartidor_nombre && (
                    <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                      🛵 Reportado por: {pedidoSeleccionado.repartidor_nombre}
                    </Text>
                  )}
                  {pedidoSeleccionado.reportado_en && (
                    <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                      🕐 Cuándo: {new Date(pedidoSeleccionado.reportado_en).toLocaleString('es-AR')}
                    </Text>
                  )}
                </View>

                {/* Cliente */}
                <View style={estilos.seccion}>
                  <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>👤 Cliente</Text>
                  <Text style={[estilos.seccionTexto, { color: colores.text }]}>
                    {pedidoSeleccionado.cliente_nombre_completo}
                  </Text>
                  <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                    📞 {pedidoSeleccionado.cliente_telefono}
                  </Text>
                  {pedidoSeleccionado.cliente_direccion && pedidoSeleccionado.tipo_entrega === 'domicilio' && (
                    <Text style={[estilos.seccionTextoChico, { color: colores.textSecondary }]}>
                      📍 {pedidoSeleccionado.cliente_direccion}
                    </Text>
                  )}

                  <View style={estilos.modalContactoRow}>
                    <TouchableOpacity
                      style={[estilos.modalContactoBoton, { backgroundColor: colores.success + '15' }]}
                      onPress={() => llamarCliente(pedidoSeleccionado.cliente_telefono || '')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={16} color={colores.success} />
                      <Text style={[estilos.modalContactoTexto, { color: colores.success }]}>Llamar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[estilos.modalContactoBoton, { backgroundColor: COLOR_WHATSAPP + '15' }]}
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
                      <Text style={[estilos.modalContactoTexto, { color: COLOR_WHATSAPP }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botón resolver */}
                <TouchableOpacity
                  style={[
                    estilos.botonResolver,
                    { backgroundColor: colores.success },
                    resolviendoProblema && { opacity: 0.6 },
                  ]}
                  onPress={() => marcarProblemaResuelto(pedidoSeleccionado)}
                  disabled={resolviendoProblema}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={estilos.botonResolverTexto}>
                    {resolviendoProblema ? 'Resolviendo...' : 'Marcar como resuelto'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[estilos.botonCerrarModal, { backgroundColor: colores.surfaceHover, marginTop: 8 }]}
                  onPress={() => setMostrarModalProblema(false)}
                >
                  <Text style={[estilos.botonCerrarModalText, { color: colores.text }]}>Cerrar</Text>
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
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    cargandoText: {
      fontFamily: FUENTES.display,
      marginTop: 16,
      fontSize: 14,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
    },
    botonHeader: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: colores.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    headerCentro: {
      flex: 1,
      alignItems: 'center',
    },
    titulo: {
      fontFamily: FUENTES.display,
      fontSize: 20,
    },
    alertaUrgentes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
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

    resumenHoy: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    resumenItem: {
      flex: 1,
      alignItems: 'center',
    },
    resumenLabel: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      marginBottom: 2,
    },
    resumenValor: {
      fontFamily: FUENTES.display,
      fontSize: 18,
    },
    resumenDivider: {
      width: 1,
      height: 30,
    },

    buscadorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colores.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    buscadorInput: {
      flex: 1,
      fontFamily: FUENTES.regular,
      fontSize: 13,
      paddingVertical: 4,
    },
    botonOrden: {
      padding: 6,
      borderRadius: 8,
    },

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
      backgroundColor: colores.surface,
      borderWidth: 1,
    },
    chipText: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      fontWeight: '600',
    },
    chipBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 8,
      minWidth: 18,
      alignItems: 'center',
    },
    chipBadgeText: {
      fontFamily: FUENTES.regular,
      fontSize: 10,
      fontWeight: '700',
      color: '#FFF',
    },

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
      marginTop: 12,
    },
    vacioSubtexto: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      marginTop: 4,
    },

    // 🆕 Banner de problema en la card
    bannerProblema: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 10,
    },
    bannerProblemaTitulo: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      fontWeight: '700',
    },
    bannerProblemaSub: {
      fontFamily: FUENTES.regular,
      fontSize: 10,
      marginTop: 1,
      opacity: 0.85,
    },

    tarjeta: {
      backgroundColor: colores.surface,
      borderRadius: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
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
      color: colores.text,
    },
    pedidoFecha: {
      fontFamily: FUENTES.regular,
      color: colores.textSecondary,
      marginTop: 2,
    },
    badgeUrgenteInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colores.danger,
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
      color: colores.text,
    },
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
      color: colores.textSecondary,
    },

    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      marginTop: 6,
      borderTopWidth: 1,
      borderTopColor: colores.border,
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
      color: colores.textSecondary,
      textTransform: 'uppercase',
    },
    totalValor: {
      fontFamily: FUENTES.display,
      color: colores.accent,
    },
    pagoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colores.success + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      flexShrink: 0,
    },
    pagoBadgeText: {
      fontFamily: FUENTES.regular,
      fontWeight: '600',
      color: colores.success,
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
      borderColor: colores.danger + '30',
      backgroundColor: colores.danger + '08',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    swipeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
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
      backgroundColor: colores.surface,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
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
      marginBottom: 8,
    },
    modalDescripcion: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
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
    modalBotonTextoSecundario: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      fontWeight: '600',
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
    },
    modalBotonTodosTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      fontWeight: '600',
    },

    // MODAL DETALLE / PROBLEMA
    modalDetalleOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalDetalleContainer: {
      backgroundColor: colores.surface,
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
      marginBottom: 16,
    },
    modalDetalleTitulo: {
      fontFamily: FUENTES.display,
      fontSize: 20,
    },
    modalDetalleScroll: {
      paddingBottom: 8,
    },
    seccion: {
      marginBottom: 16,
    },
    seccionProblema: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
    },
    seccionTitulo: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      marginBottom: 6,
    },
    seccionTexto: {
      fontFamily: FUENTES.regular,
      fontSize: 14,
      paddingVertical: 2,
    },
    seccionTextoChico: {
      fontFamily: FUENTES.regular,
      fontSize: 12,
      paddingVertical: 2,
    },
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
    },
    valorResumen: {
      fontFamily: FUENTES.regular,
      fontSize: 13,
      fontWeight: '600',
    },
    totalLabelModal: {
      fontFamily: FUENTES.display,
      fontSize: 16,
    },
    totalValorGrandeModal: {
      fontFamily: FUENTES.display,
      fontSize: 22,
    },
    botonCerrarModal: {
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

    // 🆕 Modal de problema
    cardProblema: {
      alignItems: 'center',
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
    },
    iconoProblemaWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    tituloProblema: {
      fontFamily: FUENTES.display,
      fontSize: 18,
      textAlign: 'center',
    },
    botonResolver: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 10,
    },
    botonResolverTexto: {
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
    },
  });