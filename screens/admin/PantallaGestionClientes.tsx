// screens/admin/PantallaGestionClientes.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Modal, TextInput, ScrollView,
    Animated, RefreshControl, ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Perfil } from '../../lib/tipos';
import { adminUsuariosService } from '../../lib/adminUsuariosService';

// ============================================================
// 🎨 DISEÑO
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        cardShadow: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.06)',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        accent: '#E53935',
        accentSecondary: '#F5C518',
        gradientStart: '#E53935',
        gradientEnd: '#F5C518',
        verde: '#43A047',
        azulClaro: '#3949AB',
        platino: '#78909C',
        oro: '#F9A825',
        plata: '#BDBDBD',
        bronce: '#A1887F',
        naranja: '#FF9800',
        morado: '#7B1FA2',
    },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;
    return { isTablet, isSmallPhone, width, height };
};

// ============================================================
// 🎭 TIPOS Y ROLES
// ============================================================
type RolKey = 'admin' | 'cliente' | 'repartidor';

interface RolConfig {
    label: string;
    color: string;
    icono: keyof typeof Ionicons.glyphMap;
}

const ROLES: Record<RolKey, RolConfig> = {
    admin: { label: 'Admin', color: DESIGN.colors.accent, icono: 'shield-checkmark' },
    cliente: { label: 'Cliente', color: DESIGN.colors.verde, icono: 'person' },
    repartidor: { label: 'Repartidor', color: DESIGN.colors.azulClaro, icono: 'bicycle' },
};

const getRol = (rol: string): RolConfig => ROLES[rol as RolKey] || ROLES.cliente;

interface PerfilExtendido extends Perfil {
    activo?: boolean;
    created_at?: string;
    updated_at?: string;
    baneado_hasta?: string | null;
    motivo_ban?: string | null;
    notas_admin?: string | null;
}

interface DetalleCliente extends PerfilExtendido {
    total_pedidos: number;
    total_gastado: number;
    ultimo_pedido: string | null;
    direccion_completa: string;
    fecha_registro: string;
    estado_cuenta: 'activo' | 'inactivo' | 'baneado';
}

interface PedidoConItems {
    id: number;
    creado_en: string;
    estado: string;
    total: number;
    items_json: any;
    tipo_entrega: string;
    metodo_pago: string;
}

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaGestionClientes(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();

    const [clientes, setClientes] = useState<PerfilExtendido[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<PerfilExtendido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState<'todos' | RolKey>('todos');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo' | 'baneado'>('todos');

    // Detalle
    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<DetalleCliente | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [historialPedidos, setHistorialPedidos] = useState<PedidoConItems[]>([]);
    const [historialCanjes, setHistorialCanjes] = useState<any[]>([]);
    const [historialPuntos, setHistorialPuntos] = useState<any[]>([]);
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [dispositivos, setDispositivos] = useState<any[]>([]);
    const [auditoria, setAuditoria] = useState<any[]>([]);

    // Crear cliente
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    // Modales de acción
    const [modalBan, setModalBan] = useState(false);
    const [modalPuntos, setModalPuntos] = useState(false);
    const [modalNotificar, setModalNotificar] = useState(false);
    const [modalNotas, setModalNotas] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [procesando, setProcesando] = useState(false);

    // Estados de los inputs
    const [banMotivo, setBanMotivo] = useState('');
    const [banFecha, setBanFecha] = useState('');
    const [puntosCantidad, setPuntosCantidad] = useState('');
    const [puntosMotivo, setPuntosMotivo] = useState('');
    const [notifTitulo, setNotifTitulo] = useState('');
    const [notifMensaje, setNotifMensaje] = useState('');
    const [notas, setNotas] = useState('');
    const [editNombre, setEditNombre] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [editDireccion, setEditDireccion] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        cargarClientes();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        let filtrados = [...clientes];

        if (filtroRol !== 'todos') filtrados = filtrados.filter((c) => c.rol === filtroRol);

        if (filtroEstado !== 'todos') {
            filtrados = filtrados.filter((c) => getEstadoCuenta(c) === filtroEstado);
        }

        if (busqueda.trim()) {
            const q = busqueda.toLowerCase().trim();
            filtrados = filtrados.filter((c) =>
                (c.nombre_cliente || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.telefono || '').toLowerCase().includes(q)
            );
        }

        setClientesFiltrados(filtrados);
    }, [clientes, filtroRol, filtroEstado, busqueda]);

    // ============================================================
    // 📋 CARGAR
    // ============================================================
    const cargarClientes = async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) {
                if (error.code === 'PGRST303') return;
                throw error;
            }

            setClientes((data as PerfilExtendido[]) || []);
        } catch (error: any) {
            if (error?.code !== 'PGRST303') {
                console.error('Error cargando clientes:', error);
            }
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarClientes();
    }, []);

    // ============================================================
    // 🧮 HELPERS
    // ============================================================
    const getEstadoCuenta = (perfil: PerfilExtendido): 'activo' | 'inactivo' | 'baneado' => {
        if (perfil.baneado_hasta && new Date(perfil.baneado_hasta) > new Date()) return 'baneado';
        if (perfil.activo === false) return 'inactivo';
        return 'activo';
    };

    const nivelCliente = (puntos: number) => {
        if (puntos >= 5000) return { label: '💎 Platino', color: DESIGN.colors.platino };
        if (puntos >= 1500) return { label: '👑 Oro', color: DESIGN.colors.oro };
        if (puntos >= 500) return { label: '🥈 Plata', color: DESIGN.colors.plata };
        return { label: '🥉 Bronce', color: DESIGN.colors.bronce };
    };

    const formatFecha = (fecha?: string | null) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    // ============================================================
    // 📂 CARGAR DETALLE
    // ============================================================
    const cargarDetalleCliente = async (cliente: PerfilExtendido) => {
        setCargandoDetalle(true);
        setModalDetalleVisible(true);
        setHistorialPedidos([]);
        setHistorialCanjes([]);
        setHistorialPuntos([]);
        setNotificaciones([]);
        setDispositivos([]);
        setAuditoria([]);

        try {
            const partes = [];
            if (cliente.direccion_calle) partes.push(cliente.direccion_calle);
            if (cliente.direccion_numero) partes.push(cliente.direccion_numero);
            if (cliente.direccion_piso) partes.push(`Piso ${cliente.direccion_piso}`);
            if (cliente.direccion_departamento) partes.push(`Depto ${cliente.direccion_departamento}`);
            if (cliente.direccion_barrio) partes.push(cliente.direccion_barrio);
            if (cliente.direccion_ciudad) partes.push(cliente.direccion_ciudad);
            if (cliente.direccion_codigo_postal) partes.push(`CP ${cliente.direccion_codigo_postal}`);
            const direccionCompleta = partes.length > 0 ? partes.join(', ') : 'No especificada';

            const { data: pedidosData } = await supabase
                .from('pedidos')
                .select('id, creado_en, estado, total, tipo_entrega, metodo_pago')
                .eq('id_de_usuario', cliente.id)
                .order('creado_en', { ascending: false });

            if (pedidosData) setHistorialPedidos(pedidosData as PedidoConItems[]);

            const totalPedidos = pedidosData?.length || 0;
            const totalGastado = (pedidosData || []).reduce((s, p) => s + (p.total || 0), 0);
            const ultimoPedido = pedidosData && pedidosData.length > 0 ? pedidosData[0].creado_en : null;

            const { data: canjesData } = await supabase
                .from('canjes')
                .select('*, recompensas:recompensa_id (nombre, descripcion, puntos_necesarios, tipo)')
                .eq('usuario_id', cliente.id)
                .order('created_at', { ascending: false });

            if (canjesData) setHistorialCanjes(canjesData);

            const { data: puntosData } = await supabase
                .from('historial_puntos')
                .select('*')
                .eq('usuario_id', cliente.id)
                .order('fecha', { ascending: false })
                .limit(20);

            if (puntosData) setHistorialPuntos(puntosData);

            const { data: notifData } = await supabase
                .from('notificaciones_usuarios')
                .select('*')
                .eq('usuario_id', cliente.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (notifData) setNotificaciones(notifData);

            const { data: dispData } = await supabase
                .from('dispositivos_push')
                .select('*')
                .eq('usuario_actual_id', cliente.id)
                .eq('activo', true);

            if (dispData) setDispositivos(dispData);

            const { data: audData } = await supabase
                .from('admin_audit_log')
                .select('*')
                .eq('usuario_id', cliente.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (audData) setAuditoria(audData);

            setClienteSeleccionado({
                ...cliente,
                direccion_completa: direccionCompleta,
                total_pedidos: totalPedidos,
                total_gastado: totalGastado,
                ultimo_pedido: ultimoPedido,
                fecha_registro: cliente.created_at || cliente.ultimo_acceso || '',
                estado_cuenta: getEstadoCuenta(cliente),
            });
        } catch (error) {
            console.error('Error cargando detalle:', error);
            Alert.alert('Error', 'No se pudo cargar el detalle');
        } finally {
            setCargandoDetalle(false);
        }
    };

    const recargarDetalle = async () => {
        if (!clienteSeleccionado) return;
        await cargarDetalleCliente(clienteSeleccionado);
    };

    // ============================================================
    // ✅ CREAR CLIENTE
    // ============================================================
    const crearCliente = async () => {
        if (procesando) return;

        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Completa nombre, email y contraseña');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setProcesando(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-crear-cliente', {
                body: {
                    nombre,
                    email,
                    telefono,
                    password,
                },
            });

            if (error) {
                console.error('No se pudo crear el cliente mediante la Edge Function:', error);
                let mensaje = data?.error;
                if (error instanceof FunctionsHttpError) {
                    const respuesta = await error.context.json().catch(() => null);
                    mensaje = respuesta?.error;
                }
                throw new Error(mensaje || 'No se pudo conectar con el servicio de altas.');
            }

            if (!data?.success) {
                throw new Error(data?.error || 'El servicio no confirmó la creación del cliente.');
            }

            setModalVisible(false);
            setNombre(''); setEmail(''); setTelefono(''); setPassword('');
            cargarClientes();
            Alert.alert('✅ Éxito', 'Cliente creado');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al crear');
        } finally {
            setProcesando(false);
        }
    };

    // ============================================================
    // 🔄 ACCIONES
    // ============================================================
    const cambiarRol = async (id: string, nuevoRol: RolKey) => {
        const rolInfo = getRol(nuevoRol);
        Alert.alert(
            'Cambiar rol',
            `¿Cambiar el rol a "${rolInfo.label}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cambiar',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('perfiles')
                            .update({ rol: nuevoRol })
                            .eq('id', id);

                        if (error) {
                            Alert.alert('Error', 'No se pudo cambiar el rol');
                            return;
                        }

                        await supabase.from('admin_audit_log').insert({
                            admin_id: (await supabase.auth.getUser()).data.user?.id,
                            usuario_id: id,
                            accion: 'cambio_rol',
                            datos_despues: { rol: nuevoRol },
                        });

                        cargarClientes();
                        if (clienteSeleccionado?.id === id) recargarDetalle();
                        Alert.alert('Éxito', 'Rol actualizado');
                    },
                },
            ]
        );
    };

    const toggleActivo = async (cliente: PerfilExtendido) => {
        const nuevoEstado = !cliente.activo;
        Alert.alert(
            nuevoEstado ? 'Activar cuenta' : 'Desactivar cuenta',
            `¿${nuevoEstado ? 'activar' : 'desactivar'} a "${cliente.nombre_cliente}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: nuevoEstado ? 'Activar' : 'Desactivar',
                    style: nuevoEstado ? 'default' : 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('perfiles')
                            .update({ activo: nuevoEstado })
                            .eq('id', cliente.id);

                        if (error) {
                            Alert.alert('Error', 'No se pudo actualizar');
                            return;
                        }

                        await supabase.from('admin_audit_log').insert({
                            admin_id: (await supabase.auth.getUser()).data.user?.id,
                            usuario_id: cliente.id,
                            accion: nuevoEstado ? 'activar_cuenta' : 'desactivar_cuenta',
                            datos_antes: { activo: cliente.activo },
                            datos_despues: { activo: nuevoEstado },
                        });

                        cargarClientes();
                        if (clienteSeleccionado?.id === cliente.id) recargarDetalle();
                    },
                },
            ]
        );
    };

    const eliminarCliente = (id: string, nombre: string) => {
        Alert.alert(
            'Eliminar cliente',
            `¿Eliminar a "${nombre}"? No se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('perfiles').delete().eq('id', id);
                        if (error) {
                            Alert.alert('Error', 'No se pudo eliminar');
                            return;
                        }
                        cargarClientes();
                        Alert.alert('Éxito', 'Cliente eliminado');
                    },
                },
            ]
        );
    };

    // ============================================================
    // 🎯 ABRIR MODALES
    // ============================================================
    const abrirModalBan = (cliente: DetalleCliente) => {
        setBanMotivo('');
        setBanFecha('');
        setModalBan(true);
    };

    const abrirModalPuntos = (cliente: DetalleCliente) => {
        setPuntosCantidad('');
        setPuntosMotivo('');
        setModalPuntos(true);
    };

    const abrirModalNotificar = (cliente: DetalleCliente) => {
        setNotifTitulo('');
        setNotifMensaje('');
        setModalNotificar(true);
    };

    const abrirModalNotas = (cliente: DetalleCliente) => {
        setNotas(cliente.notas_admin || '');
        setModalNotas(true);
    };

    const abrirModalEditar = (cliente: DetalleCliente) => {
        setEditNombre(cliente.nombre_cliente || '');
        setEditTelefono(cliente.telefono || '');
        setEditDireccion(cliente.direccion_manual || '');
        setModalEditar(true);
    };

    // ============================================================
    // ✅ EJECUTAR ACCIONES
    // ============================================================
    const ejecutarBan = async () => {
        if (!clienteSeleccionado) return;

        if (clienteSeleccionado.estado_cuenta === 'baneado') {
            setProcesando(true);
            const res = await adminUsuariosService.desbanearUsuario(clienteSeleccionado.id);
            setProcesando(false);
            if (res.success) {
                setModalBan(false);
                await recargarDetalle();
                await cargarClientes();
                Alert.alert('✅ Desbaneado', 'Cuenta reactivada');
            } else {
                Alert.alert('Error', res.error || 'Error al desbanear');
            }
            return;
        }

        if (!banMotivo.trim()) {
            Alert.alert('Error', 'Ingresá un motivo');
            return;
        }

        setProcesando(true);
        const fechaISO = banFecha.trim()
            ? new Date(banFecha).toISOString()
            : null;

        const res = await adminUsuariosService.banearUsuario(
            clienteSeleccionado.id,
            banMotivo.trim(),
            fechaISO,
        );
        setProcesando(false);

        if (res.success) {
            setModalBan(false);
            await recargarDetalle();
            await cargarClientes();
            Alert.alert('✅ Baneado', 'Usuario baneado correctamente');
        } else {
            Alert.alert('Error', res.error || 'Error al banear');
        }
    };

    const ejecutarPuntos = async () => {
        if (!clienteSeleccionado) return;

        const cant = parseInt(puntosCantidad);
        if (isNaN(cant) || cant === 0) {
            Alert.alert('Error', 'Ingresá una cantidad válida (positiva o negativa)');
            return;
        }
        if (!puntosMotivo.trim()) {
            Alert.alert('Error', 'Ingresá un motivo');
            return;
        }

        setProcesando(true);
        const res = await adminUsuariosService.ajustarPuntos(
            clienteSeleccionado.id,
            cant,
            puntosMotivo.trim(),
        );
        setProcesando(false);

        if (res.success) {
            setModalPuntos(false);
            await recargarDetalle();
            await cargarClientes();
            Alert.alert('✅ Puntos ajustados', `${cant > 0 ? '+' : ''}${cant} puntos`);
        } else {
            Alert.alert('Error', res.error || 'Error al ajustar puntos');
        }
    };

    const ejecutarNotificar = async () => {
        if (!clienteSeleccionado) return;

        if (!notifTitulo.trim() || !notifMensaje.trim()) {
            Alert.alert('Error', 'Completá título y mensaje');
            return;
        }

        setProcesando(true);
        const res = await adminUsuariosService.enviarNotificacionIndividual(
            clienteSeleccionado.id,
            notifTitulo.trim(),
            notifMensaje.trim(),
        );
        setProcesando(false);

        if (res.success) {
            setModalNotificar(false);
            await recargarDetalle();
            Alert.alert('✅ Enviada', 'Notificación enviada');
        } else {
            Alert.alert('Error', res.error || 'Error al enviar');
        }
    };

    const ejecutarNotas = async () => {
        if (!clienteSeleccionado) return;

        setProcesando(true);
        const res = await adminUsuariosService.actualizarNotas(
            clienteSeleccionado.id,
            notas.trim(),
        );
        setProcesando(false);

        if (res.success) {
            setModalNotas(false);
            await recargarDetalle();
            Alert.alert('✅ Guardado', 'Notas actualizadas');
        } else {
            Alert.alert('Error', res.error || 'Error al guardar');
        }
    };

    const ejecutarEditar = async () => {
        if (!clienteSeleccionado) return;

        if (!editNombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setProcesando(true);
        const res = await adminUsuariosService.actualizarDatosBasicos(
            clienteSeleccionado.id,
            {
                nombre_cliente: editNombre.trim(),
                telefono: editTelefono.trim() || undefined,
                direccion_manual: editDireccion.trim() || undefined,
            },
        );
        setProcesando(false);

        if (res.success) {
            setModalEditar(false);
            await recargarDetalle();
            await cargarClientes();
            Alert.alert('✅ Guardado', 'Datos actualizados');
        } else {
            Alert.alert('Error', res.error || 'Error al guardar');
        }
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setNombre(''); setEmail(''); setTelefono(''); setPassword('');
        }, 300);
    };

    // ============================================================
    // 🎨 RENDER
    // ============================================================
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const avatarSize = isTablet ? 56 : isSmallPhone ? 40 : 48;
    const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;

    const renderEstadoBadge = (estado: 'activo' | 'inactivo' | 'baneado') => {
        const config = {
            activo: { color: DESIGN.colors.verde, label: 'Activo', icono: 'checkmark-circle' as const },
            inactivo: { color: DESIGN.colors.textTertiary, label: 'Inactivo', icono: 'pause-circle' as const },
            baneado: { color: DESIGN.colors.naranja, label: 'Baneado', icono: 'ban' as const },
        }[estado];

        return (
            <View style={[estilos.estadoBadge, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
                <Ionicons name={config.icono} size={12} color={config.color} />
                <Text style={[estilos.estadoTexto, { color: config.color, fontSize: 10 }]}>
                    {config.label}
                </Text>
            </View>
        );
    };

    const renderCliente = ({ item, index }: { item: PerfilExtendido; index: number }) => {
        const itemFade = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
        const itemSlide = slideUpAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * Math.min(index + 1, 5), 0] });
        const nivel = nivelCliente(item.puntos_acumulados || 0);
        const rolInfo = getRol(item.rol || 'cliente');
        const estado = getEstadoCuenta(item);

        return (
            <Animated.View style={{ opacity: itemFade, transform: [{ translateY: itemSlide }] }}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => cargarDetalleCliente(item)}>
                    <View style={[estilos.tarjeta, {
                        padding: tarjetaPadding,
                        borderRadius: 16,
                        borderColor: rolInfo.color + '40',
                        backgroundColor: DESIGN.colors.surface,
                        shadowColor: DESIGN.colors.cardShadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 8,
                        elevation: 3,
                    }]}>
                        <View style={estilos.fila}>
                            <View style={[estilos.avatar, {
                                width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
                                backgroundColor: rolInfo.color + '20', borderColor: rolInfo.color + '30',
                            }]}>
                                <Text style={[estilos.avatarTexto, { fontSize: 20 }]}>
                                    {item.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>

                            <View style={estilos.info}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <Text style={[estilos.nombre, { fontSize: nombreSize }]} numberOfLines={1}>
                                        {item.nombre_cliente || 'Sin nombre'}
                                    </Text>
                                    {renderEstadoBadge(estado)}
                                </View>
                                <Text style={estilos.email} numberOfLines={1}>{item.email}</Text>
                                <Text style={estilos.telefono}>{item.telefono || 'Sin teléfono'}</Text>
                            </View>

                            <TouchableOpacity onPress={() => eliminarCliente(item.id, item.nombre_cliente || 'Cliente')} style={estilos.botonEliminar}>
                                <Ionicons name="trash-outline" size={20} color={DESIGN.colors.accent} />
                            </TouchableOpacity>
                        </View>

                        <View style={estilos.detalles}>
                            <View style={estilos.detalleItem}>
                                <Text style={estilos.detalleValor}>⭐ {item.puntos_acumulados || 0}</Text>
                                <Text style={estilos.detalleLabel}>Puntos</Text>
                            </View>
                            <View style={estilos.detalleItem}>
                                <Text style={[estilos.detalleValor, { color: nivel.color }]}>{nivel.label}</Text>
                                <Text style={estilos.detalleLabel}>Nivel</Text>
                            </View>
                            <View style={[estilos.rolBadge, { backgroundColor: rolInfo.color + '20', borderColor: rolInfo.color + '30' }]}>
                                <Ionicons name={rolInfo.icono} size={14} color={rolInfo.color} />
                                <Text style={[estilos.rolTexto, { color: rolInfo.color }]}>{rolInfo.label}</Text>
                            </View>
                        </View>

                        <View style={[estilos.acciones, { gap: 8 }]}>
                            {Object.entries(ROLES).map(([key, value]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[estilos.botonAccion, {
                                        backgroundColor: value.color,
                                        paddingVertical: 6, borderRadius: 8,
                                        opacity: item.rol === key ? 0.5 : 1,
                                    }]}
                                    onPress={() => cambiarRol(item.id, key as RolKey)}
                                    disabled={item.rol === key}
                                >
                                    <Text style={[estilos.botonAccionTexto, { color: DESIGN.colors.surface }]}>{value.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[estilos.botonEstado, {
                                backgroundColor: item.activo === false ? DESIGN.colors.verde : DESIGN.colors.naranja,
                                marginTop: 6, paddingVertical: 6,
                            }]}
                            onPress={() => toggleActivo(item)}
                        >
                            <Ionicons name={item.activo === false ? 'checkmark-circle-outline' : 'pause-circle-outline'} size={14} color="#FFF" />
                            <Text style={estilos.botonEstadoTexto}>
                                {item.activo === false ? 'Activar cuenta' : 'Desactivar cuenta'}
                            </Text>
                        </TouchableOpacity>

                        <View style={estilos.verDetalle}>
                            <Text style={estilos.verDetalleTexto}>👆 Toca para ver todos los detalles</Text>
                            <Ionicons name="chevron-forward" size={16} color={DESIGN.colors.textTertiary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // ============================================================
    // 🖥️ RENDER PRINCIPAL
    // ============================================================
    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />

            {/* HEADER */}
            <View style={[estilos.header, {
                paddingTop: insets.top + 10,
                paddingHorizontal,
                paddingBottom: 12,
            }]}>
                <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={DESIGN.colors.surface} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>👥 Clientes</Text>
                <TouchableOpacity
                    style={[estilos.botonAgregar, { backgroundColor: DESIGN.colors.accentSecondary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={22} color={DESIGN.colors.text} />
                </TouchableOpacity>
            </View>

            {/* BÚSQUEDA */}
            <View style={{ paddingHorizontal, paddingVertical: 10 }}>
                <View style={estilos.busquedaInput}>
                    <Ionicons name="search" size={18} color={DESIGN.colors.textSecondary} />
                    <TextInput
                        style={estilos.busquedaTexto}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        placeholder="Buscar por nombre, email o teléfono..."
                        placeholderTextColor={DESIGN.colors.textTertiary}
                    />
                    {busqueda.length > 0 && (
                        <TouchableOpacity onPress={() => setBusqueda('')}>
                            <Ionicons name="close-circle" size={18} color={DESIGN.colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* FILTROS */}
            <View style={{ paddingHorizontal, paddingBottom: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    <TouchableOpacity
                        style={[estilos.filtroChip, filtroRol === 'todos' && estilos.filtroChipActivo]}
                        onPress={() => setFiltroRol('todos')}
                    >
                        <Text style={[estilos.filtroChipTexto, filtroRol === 'todos' && estilos.filtroChipTextoActivo]}>Todos</Text>
                    </TouchableOpacity>
                    {Object.entries(ROLES).map(([key, value]) => (
                        <TouchableOpacity
                            key={key}
                            style={[estilos.filtroChip, filtroRol === key && estilos.filtroChipActivo]}
                            onPress={() => setFiltroRol(key as RolKey)}
                        >
                            <Ionicons name={value.icono} size={12} color={filtroRol === key ? DESIGN.colors.text : value.color} />
                            <Text style={[estilos.filtroChipTexto, filtroRol === key && estilos.filtroChipTextoActivo]}>
                                {value.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 6 }}>
                    {(['todos', 'activo', 'inactivo', 'baneado'] as const).map((estado) => (
                        <TouchableOpacity
                            key={estado}
                            style={[estilos.filtroChip, filtroEstado === estado && estilos.filtroChipActivo]}
                            onPress={() => setFiltroEstado(estado)}
                        >
                            <Text style={[estilos.filtroChipTexto, filtroEstado === estado && estilos.filtroChipTextoActivo]}>
                                {estado === 'todos' ? '📋 Todos' : estado === 'activo' ? '✅ Activos' : estado === 'inactivo' ? '⏸️ Inactivos' : '🚫 Baneados'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* CONTADOR */}
            <View style={[estilos.contadorContainer, { paddingHorizontal }]}>
                <Text style={estilos.contador}>
                    {clientesFiltrados.length} de {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
                </Text>
            </View>

            {/* LISTA */}
            {cargando ? (
                <View style={estilos.cargandoContainer}>
                    <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
                    <Text style={estilos.cargandoTexto}>Cargando clientes...</Text>
                </View>
            ) : (
                <FlatList
                    data={clientesFiltrados}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCliente}
                    contentContainerStyle={[
                        estilos.lista,
                        { paddingHorizontal, paddingBottom: insets.bottom + 150, paddingTop: 4 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={estilos.vacioContenedor}>
                            <Ionicons name="people-outline" size={60} color={DESIGN.colors.textTertiary + '30'} />
                            <Text style={estilos.vacio}>
                                {clientes.length === 0 ? 'No hay clientes registrados' : 'No hay resultados'}
                            </Text>
                            <Text style={estilos.vacioSubtexto}>
                                {clientes.length === 0 ? 'Los clientes aparecerán aquí' : 'Probá cambiando los filtros'}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refrescando} onRefresh={manejarRefresh} tintColor={DESIGN.colors.accentSecondary} />
                    }
                />
            )}

            {/* MODAL NUEVO CLIENTE */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={cerrarModal}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '92%', maxHeight: '85%' }]}>
                        <View style={estilos.modalHeader}>
                            <LinearGradient colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]} style={estilos.modalHeaderGradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="person-add" size={28} color={DESIGN.colors.text} />
                                <Text style={[estilos.modalTitulo, { color: DESIGN.colors.text }]}>Nuevo Cliente</Text>
                            </LinearGradient>
                        </View>

                        <ScrollView style={estilos.modalScroll} showsVerticalScrollIndicator={false}>
                            <Text style={estilos.label}>Nombre *</Text>
                            <TextInput style={estilos.input} value={nombre} onChangeText={setNombre} placeholder="Nombre completo" placeholderTextColor={DESIGN.colors.textTertiary} />

                            <Text style={estilos.label}>Email *</Text>
                            <TextInput style={estilos.input} value={email} onChangeText={setEmail} placeholder="cliente@ejemplo.com" placeholderTextColor={DESIGN.colors.textTertiary} keyboardType="email-address" autoCapitalize="none" />

                            <Text style={estilos.label}>Teléfono</Text>
                            <TextInput style={estilos.input} value={telefono} onChangeText={setTelefono} placeholder="1134567890" placeholderTextColor={DESIGN.colors.textTertiary} keyboardType="phone-pad" />

                            <Text style={estilos.label}>Contraseña *</Text>
                            <TextInput style={estilos.input} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={DESIGN.colors.textTertiary} secureTextEntry />
                        </ScrollView>

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={cerrarModal}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { overflow: 'hidden', paddingVertical: 14 }]}
                                onPress={crearCliente}
                            >
                                <LinearGradient colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]} style={estilos.modalGuardarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <Text style={{ fontWeight: 'bold', color: DESIGN.colors.text }}>Crear Cliente</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL DETALLE */}
            <Modal
                visible={modalDetalleVisible}
                transparent animationType="slide"
                onRequestClose={() => { setModalDetalleVisible(false); setClienteSeleccionado(null); }}
            >
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modalDetalle, { padding: 20, borderRadius: 24, width: '95%', maxHeight: '90%' }]}>
                        {cargandoDetalle ? (
                            <View style={estilos.cargandoDetalle}>
                                <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
                                <Text style={estilos.cargandoDetalleTexto}>Cargando datos...</Text>
                            </View>
                        ) : clienteSeleccionado ? (
                            <>
                                <View style={estilos.modalDetalleHeader}>
                                    <View style={estilos.modalDetalleHeaderLeft}>
                                        <View style={[estilos.modalDetalleAvatar, {
                                            backgroundColor: getRol(clienteSeleccionado.rol || 'cliente').color + '20',
                                            borderColor: getRol(clienteSeleccionado.rol || 'cliente').color + '30',
                                        }]}>
                                            <Text style={estilos.modalDetalleAvatarTexto}>
                                                {clienteSeleccionado.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={estilos.modalDetalleHeaderInfo}>
                                            <Text style={estilos.modalDetalleNombre}>{clienteSeleccionado.nombre_cliente}</Text>
                                            <Text style={estilos.modalDetalleEmail}>{clienteSeleccionado.email}</Text>
                                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                                <View style={[estilos.modalDetalleRolBadge, {
                                                    backgroundColor: getRol(clienteSeleccionado.rol || 'cliente').color + '15',
                                                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                                                }]}>
                                                    <Ionicons name={getRol(clienteSeleccionado.rol || 'cliente').icono} size={12} color={getRol(clienteSeleccionado.rol || 'cliente').color} />
                                                    <Text style={[estilos.modalDetalleRolText, { fontSize: 11, color: getRol(clienteSeleccionado.rol || 'cliente').color }]}>
                                                        {getRol(clienteSeleccionado.rol || 'cliente').label}
                                                    </Text>
                                                </View>
                                                {renderEstadoBadge(clienteSeleccionado.estado_cuenta)}
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => { setModalDetalleVisible(false); setClienteSeleccionado(null); }} style={estilos.modalDetalleCerrar}>
                                        <Ionicons name="close" size={24} color={DESIGN.colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={estilos.modalDetalleScroll} showsVerticalScrollIndicator={false}>
                                    {/* STATS */}
                                    <View style={[estilos.modalDetalleStats, { gap: 8 }]}>
                                        <View style={estilos.modalDetalleStatItem}>
                                            <Text style={[estilos.modalDetalleStatValor, { color: DESIGN.colors.accentSecondary }]}>
                                                {clienteSeleccionado.total_pedidos}
                                            </Text>
                                            <Text style={estilos.modalDetalleStatLabel}>Pedidos</Text>
                                        </View>
                                        <View style={estilos.modalDetalleStatItem}>
                                            <Text style={[estilos.modalDetalleStatValor, { color: DESIGN.colors.verde }]}>
                                                ${clienteSeleccionado.total_gastado?.toFixed(0) || '0'}
                                            </Text>
                                            <Text style={estilos.modalDetalleStatLabel}>Gastado</Text>
                                        </View>
                                        <View style={estilos.modalDetalleStatItem}>
                                            <Text style={[estilos.modalDetalleStatValor, { color: DESIGN.colors.accent }]}>
                                                ⭐ {clienteSeleccionado.puntos_acumulados || 0}
                                            </Text>
                                            <Text style={estilos.modalDetalleStatLabel}>Puntos</Text>
                                        </View>
                                    </View>

                                    {/* BOTONES DE ACCIÓN */}
                                    <View style={[estilos.accionesAdmin, { gap: 6, marginBottom: 16 }]}>
                                        <TouchableOpacity
                                            style={[estilos.botonAdmin, { backgroundColor: clienteSeleccionado.estado_cuenta === 'baneado' ? DESIGN.colors.verde : DESIGN.colors.naranja }]}
                                            onPress={() => abrirModalBan(clienteSeleccionado)}
                                        >
                                            <Ionicons name={clienteSeleccionado.estado_cuenta === 'baneado' ? 'checkmark-circle' : 'ban'} size={14} color="#FFF" />
                                            <Text style={estilos.botonAdminTexto}>
                                                {clienteSeleccionado.estado_cuenta === 'baneado' ? 'Desbanear' : 'Banear'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[estilos.botonAdmin, { backgroundColor: DESIGN.colors.accentSecondary }]}
                                            onPress={() => abrirModalPuntos(clienteSeleccionado)}
                                        >
                                            <Ionicons name="star" size={14} color={DESIGN.colors.text} />
                                            <Text style={[estilos.botonAdminTexto, { color: DESIGN.colors.text }]}>Puntos</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[estilos.botonAdmin, { backgroundColor: DESIGN.colors.azulClaro }]}
                                            onPress={() => abrirModalNotificar(clienteSeleccionado)}
                                        >
                                            <Ionicons name="notifications" size={14} color="#FFF" />
                                            <Text style={estilos.botonAdminTexto}>Notificar</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[estilos.botonAdmin, { backgroundColor: DESIGN.colors.verde }]}
                                            onPress={() => abrirModalNotas(clienteSeleccionado)}
                                        >
                                            <Ionicons name="document-text" size={14} color="#FFF" />
                                            <Text style={estilos.botonAdminTexto}>Notas</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[estilos.botonAdmin, { backgroundColor: DESIGN.colors.morado }]}
                                            onPress={() => abrirModalEditar(clienteSeleccionado)}
                                        >
                                            <Ionicons name="create" size={14} color="#FFF" />
                                            <Text style={estilos.botonAdminTexto}>Editar</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* INFO */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>👤 Datos Personales</Text>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="call-outline" size={16} color={DESIGN.colors.textSecondary} />
                                            <Text style={estilos.modalDetalleValor}>{clienteSeleccionado.telefono || 'No especificado'}</Text>
                                        </View>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="calendar-outline" size={16} color={DESIGN.colors.textSecondary} />
                                            <Text style={estilos.modalDetalleValor}>Registro: {formatFecha(clienteSeleccionado.fecha_registro)}</Text>
                                        </View>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="time-outline" size={16} color={DESIGN.colors.textSecondary} />
                                            <Text style={estilos.modalDetalleValor}>Último acceso: {formatFecha(clienteSeleccionado.ultimo_acceso)}</Text>
                                        </View>
                                        {clienteSeleccionado.baneado_hasta && (
                                            <View style={[estilos.modalDetalleFila, { backgroundColor: DESIGN.colors.naranja + '15', padding: 8, borderRadius: 8, marginTop: 6 }]}>
                                                <Ionicons name="ban" size={16} color={DESIGN.colors.naranja} />
                                                <Text style={[estilos.modalDetalleValor, { color: DESIGN.colors.naranja }]}>
                                                    Baneado hasta: {formatFecha(clienteSeleccionado.baneado_hasta)}
                                                </Text>
                                            </View>
                                        )}
                                        {clienteSeleccionado.motivo_ban && (
                                            <Text style={{ fontSize: 12, color: DESIGN.colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                                                Motivo: {clienteSeleccionado.motivo_ban}
                                            </Text>
                                        )}
                                        {clienteSeleccionado.notas_admin && (
                                            <View style={[estilos.modalDetalleFila, { marginTop: 6, backgroundColor: DESIGN.colors.accentSecondary + '10', padding: 8, borderRadius: 8 }]}>
                                                <Ionicons name="document-text-outline" size={16} color={DESIGN.colors.accentSecondary} />
                                                <Text style={[estilos.modalDetalleValor, { fontSize: 13 }]}>
                                                    Notas: {clienteSeleccionado.notas_admin}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* DIRECCIÓN */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>📍 Dirección</Text>
                                        <Text style={estilos.modalDetalleDireccion}>{clienteSeleccionado.direccion_completa}</Text>
                                    </View>

                                    {/* PEDIDOS */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>📦 Pedidos ({historialPedidos.length})</Text>
                                        {historialPedidos.length > 0 ? (
                                            historialPedidos.slice(0, 5).map((p, i) => (
                                                <View key={i} style={estilos.modalDetallePedido}>
                                                    <View style={estilos.modalDetallePedidoHeader}>
                                                        <Text style={estilos.modalDetallePedidoId}>Pedido #{p.id}</Text>
                                                        <View style={[estilos.modalDetallePedidoEstado, {
                                                            backgroundColor: p.estado === 'entregado' ? DESIGN.colors.verde + '20' :
                                                                p.estado === 'cancelado' ? DESIGN.colors.accent + '20' :
                                                                    DESIGN.colors.accentSecondary + '20',
                                                        }]}>
                                                            <Text style={{ fontSize: 10, color: p.estado === 'entregado' ? DESIGN.colors.verde : DESIGN.colors.accent }}>
                                                                {p.estado}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={estilos.modalDetallePedidoInfo}>
                                                        <Text style={estilos.modalDetallePedidoFecha}>{formatFecha(p.creado_en)}</Text>
                                                        <Text style={estilos.modalDetallePedidoTotal}>${p.total?.toFixed(2) || '0'}</Text>
                                                    </View>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={estilos.modalDetalleVacio}>Sin pedidos</Text>
                                        )}
                                    </View>

                                    {/* CANJES */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>🎁 Canjes ({historialCanjes.length})</Text>
                                        {historialCanjes.length > 0 ? (
                                            historialCanjes.slice(0, 5).map((c, i) => (
                                                <View key={i} style={estilos.modalDetalleCanje}>
                                                    <View style={estilos.modalDetalleCanjeHeader}>
                                                        <Text style={estilos.modalDetalleCanjeRecompensa}>{c.recompensas?.nombre || 'Recompensa'}</Text>
                                                        <Text style={estilos.modalDetalleCanjePuntos}>-{c.puntos_usados} pts</Text>
                                                    </View>
                                                    <Text style={estilos.modalDetalleCanjeFecha}>{formatFecha(c.created_at)}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={estilos.modalDetalleVacio}>Sin canjes</Text>
                                        )}
                                    </View>

                                    {/* DISPOSITIVOS */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>📱 Dispositivos ({dispositivos.length})</Text>
                                        {dispositivos.length > 0 ? (
                                            dispositivos.map((d, i) => (
                                                <View key={i} style={estilos.modalDetalleNotif}>
                                                    <Text style={{ fontSize: 12, fontWeight: '500' }}>{d.plataforma === 'ios' ? '🍎 iOS' : '🤖 Android'}</Text>
                                                    <Text style={{ fontSize: 10, color: DESIGN.colors.textTertiary }}>{formatFecha(d.ultima_actividad)}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={estilos.modalDetalleVacio}>Sin dispositivos</Text>
                                        )}
                                    </View>

                                    {/* AUDITORÍA */}
                                    <View style={estilos.modalDetalleSeccion}>
                                        <Text style={estilos.modalDetalleSeccionTitulo}>📋 Historial de cambios ({auditoria.length})</Text>
                                        {auditoria.length > 0 ? (
                                            auditoria.slice(0, 5).map((a, i) => (
                                                <View key={i} style={estilos.modalDetalleNotif}>
                                                    <Text style={{ fontSize: 12, fontWeight: '500' }}>{a.accion}</Text>
                                                    <Text style={{ fontSize: 10, color: DESIGN.colors.textTertiary }}>{formatFecha(a.created_at)}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={estilos.modalDetalleVacio}>Sin cambios</Text>
                                        )}
                                    </View>
                                </ScrollView>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* MODAL BAN */}
            <Modal visible={modalBan} transparent animationType="fade" onRequestClose={() => setModalBan(false)}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '90%', maxHeight: '80%' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
                            {clienteSeleccionado?.estado_cuenta === 'baneado' ? '🚫 Desbanear usuario' : '🚫 Banear usuario'}
                        </Text>

                        {clienteSeleccionado?.estado_cuenta === 'baneado' ? (
                            <Text style={{ fontSize: 14, color: DESIGN.colors.textSecondary, marginBottom: 16 }}>
                                ¿Reactivar la cuenta de {clienteSeleccionado.nombre_cliente}? Se le quitará el ban y podrá volver a usar la app.
                            </Text>
                        ) : (
                            <>
                                <Text style={estilos.label}>Motivo *</Text>
                                <TextInput
                                    style={estilos.input}
                                    value={banMotivo}
                                    onChangeText={setBanMotivo}
                                    placeholder="Ej: Comportamiento inapropiado"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    multiline
                                />

                                <Text style={estilos.label}>Fecha de fin (opcional)</Text>
                                <TextInput
                                    style={estilos.input}
                                    value={banFecha}
                                    onChangeText={setBanFecha}
                                    placeholder="YYYY-MM-DD (vacío = indefinido)"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                />
                                <Text style={{ fontSize: 11, color: DESIGN.colors.textTertiary, marginTop: 4 }}>
                                    Dejalo vacío para un ban permanente.
                                </Text>
                            </>
                        )}

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={() => setModalBan(false)}
                                disabled={procesando}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, {
                                    backgroundColor: clienteSeleccionado?.estado_cuenta === 'baneado' ? DESIGN.colors.verde : DESIGN.colors.naranja,
                                    paddingVertical: 14,
                                }]}
                                onPress={ejecutarBan}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                                        {clienteSeleccionado?.estado_cuenta === 'baneado' ? 'Desbanear' : 'Banear'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL PUNTOS */}
            <Modal visible={modalPuntos} transparent animationType="fade" onRequestClose={() => setModalPuntos(false)}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '90%' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>⭐ Ajustar puntos</Text>
                        <Text style={{ fontSize: 13, color: DESIGN.colors.textSecondary, marginBottom: 12 }}>
                            Puntos actuales: {clienteSeleccionado?.puntos_acumulados || 0}
                        </Text>

                        <Text style={estilos.label}>Cantidad * (+/-)</Text>
                        <TextInput
                            style={estilos.input}
                            value={puntosCantidad}
                            onChangeText={setPuntosCantidad}
                            placeholder="Ej: 50 (suma) o -30 (resta)"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            keyboardType="numeric"
                        />

                        <Text style={estilos.label}>Motivo *</Text>
                        <TextInput
                            style={estilos.input}
                            value={puntosMotivo}
                            onChangeText={setPuntosMotivo}
                            placeholder="Ej: Compensación por demora"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            multiline
                        />

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={() => setModalPuntos(false)}
                                disabled={procesando}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.accentSecondary, paddingVertical: 14 }]}
                                onPress={ejecutarPuntos}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <ActivityIndicator color={DESIGN.colors.text} />
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: DESIGN.colors.text }}>Aplicar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL NOTIFICAR */}
            <Modal visible={modalNotificar} transparent animationType="fade" onRequestClose={() => setModalNotificar(false)}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '90%' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>🔔 Enviar notificación</Text>

                        <Text style={estilos.label}>Título *</Text>
                        <TextInput
                            style={estilos.input}
                            value={notifTitulo}
                            onChangeText={setNotifTitulo}
                            placeholder="Ej: ¡Tenés una promoción!"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                        />

                        <Text style={estilos.label}>Mensaje *</Text>
                        <TextInput
                            style={[estilos.input, { minHeight: 80, textAlignVertical: 'top' }]}
                            value={notifMensaje}
                            onChangeText={setNotifMensaje}
                            placeholder="Escribí el mensaje..."
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            multiline
                        />

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={() => setModalNotificar(false)}
                                disabled={procesando}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.azulClaro, paddingVertical: 14 }]}
                                onPress={ejecutarNotificar}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Enviar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL NOTAS */}
            <Modal visible={modalNotas} transparent animationType="fade" onRequestClose={() => setModalNotas(false)}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '90%' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>📝 Notas internas</Text>

                        <TextInput
                            style={[estilos.input, { minHeight: 120, textAlignVertical: 'top' }]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Notas sobre el cliente (solo visibles para admins)..."
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            multiline
                        />

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={() => setModalNotas(false)}
                                disabled={procesando}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.verde, paddingVertical: 14 }]}
                                onPress={ejecutarNotas}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL EDITAR */}
            <Modal visible={modalEditar} transparent animationType="fade" onRequestClose={() => setModalEditar(false)}>
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { padding: 24, borderRadius: 24, width: '90%', maxHeight: '85%' }]}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>✏️ Editar datos</Text>

                        <ScrollView>
                            <Text style={estilos.label}>Nombre *</Text>
                            <TextInput
                                style={estilos.input}
                                value={editNombre}
                                onChangeText={setEditNombre}
                                placeholder="Nombre completo"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                            />

                            <Text style={estilos.label}>Teléfono</Text>
                            <TextInput
                                style={estilos.input}
                                value={editTelefono}
                                onChangeText={setEditTelefono}
                                placeholder="1134567890"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="phone-pad"
                            />

                            <Text style={estilos.label}>Dirección manual</Text>
                            <TextInput
                                style={[estilos.input, { minHeight: 60, textAlignVertical: 'top' }]}
                                value={editDireccion}
                                onChangeText={setEditDireccion}
                                placeholder="Dirección completa"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                multiline
                            />
                        </ScrollView>

                        <View style={[estilos.modalBotones, { gap: 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.surfaceHover, borderWidth: 1, borderColor: DESIGN.colors.border, paddingVertical: 14 }]}
                                onPress={() => setModalEditar(false)}
                                disabled={procesando}
                            >
                                <Text style={{ fontWeight: '600', color: DESIGN.colors.textSecondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.modalBoton, { backgroundColor: DESIGN.colors.morado, paddingVertical: 14 }]}
                                onPress={ejecutarEditar}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: DESIGN.colors.fondo },
    fondoGradiente: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: DESIGN.colors.border,
    },
    botonVolver: { padding: 4 },
    titulo: { fontWeight: 'bold', letterSpacing: 1, flex: 1, textAlign: 'center' },
    botonAgregar: {
        borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10,
    },
    busquedaInput: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: DESIGN.colors.surface, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: DESIGN.colors.border,
    },
    busquedaTexto: { flex: 1, padding: 0, fontSize: 13, color: DESIGN.colors.text },
    filtroChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, backgroundColor: DESIGN.colors.surface,
        borderWidth: 1, borderColor: DESIGN.colors.border,
    },
    filtroChipActivo: { backgroundColor: DESIGN.colors.accentSecondary, borderColor: DESIGN.colors.accentSecondary },
    filtroChipTexto: { fontSize: 12, fontWeight: '500', color: DESIGN.colors.textSecondary },
    filtroChipTextoActivo: { color: DESIGN.colors.text, fontWeight: '600' },
    contadorContainer: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DESIGN.colors.border },
    contador: { fontSize: 12, fontWeight: '500', opacity: 0.7, color: DESIGN.colors.textSecondary },
    lista: { flexGrow: 1 },
    tarjeta: { marginBottom: 10, borderWidth: 1 },
    fila: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2 },
    avatarTexto: { fontWeight: 'bold', color: DESIGN.colors.accentSecondary },
    info: { flex: 1 },
    nombre: { fontWeight: 'bold', color: DESIGN.colors.text },
    email: { fontSize: 11, marginTop: 2, opacity: 0.7, color: DESIGN.colors.textSecondary },
    telefono: { fontSize: 11, marginTop: 2, opacity: 0.5, color: DESIGN.colors.textSecondary },
    botonEliminar: { padding: 4 },
    estadoBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
    },
    estadoTexto: { fontWeight: '600' },
    detalles: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: DESIGN.colors.border, marginBottom: 10,
    },
    detalleItem: { alignItems: 'center' },
    detalleValor: { fontSize: 13, fontWeight: 'bold', color: DESIGN.colors.text },
    detalleLabel: { fontSize: 10, marginTop: 2, opacity: 0.6, color: DESIGN.colors.textSecondary },
    rolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    rolTexto: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
    acciones: { flexDirection: 'row' },
    botonAccion: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    botonAccionTexto: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
    botonEstado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8 },
    botonEstadoTexto: { fontSize: 11, fontWeight: '600', color: DESIGN.colors.surface },
    verDetalle: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: DESIGN.colors.border, gap: 4,
    },
    verDetalleTexto: { fontSize: 11, fontWeight: '500', opacity: 0.6, color: DESIGN.colors.textSecondary },
    vacioContenedor: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    vacio: { fontSize: 16, fontWeight: 'bold', marginTop: 16, textAlign: 'center', color: DESIGN.colors.text },
    vacioSubtexto: { fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.6, color: DESIGN.colors.textSecondary },
    cargandoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    cargandoTexto: { fontSize: 14, fontWeight: '500', color: DESIGN.colors.text },
    modalFondo: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    modal: { backgroundColor: DESIGN.colors.surface, borderWidth: 2, borderColor: DESIGN.colors.border, overflow: 'hidden' },
    modalHeader: { marginBottom: 16 },
    modalHeaderGradiente: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
    },
    modalTitulo: { fontWeight: 'bold', fontSize: 20 },
    modalScroll: { maxHeight: 400 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14, color: DESIGN.colors.text },
    input: {
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1, borderColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.surfaceHover,
        fontSize: 14, color: DESIGN.colors.text,
    },
    modalBotones: { flexDirection: 'row' },
    modalBoton: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    modalGuardarGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, width: '100%', height: '100%',
    },
    modalDetalle: { backgroundColor: DESIGN.colors.surface, borderWidth: 2, borderColor: DESIGN.colors.border, overflow: 'hidden' },
    modalDetalleHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottomWidth: 1, borderBottomColor: DESIGN.colors.border,
        paddingBottom: 12, marginBottom: 16,
    },
    modalDetalleHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    modalDetalleAvatar: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2,
    },
    modalDetalleAvatarTexto: { fontSize: 20, fontWeight: 'bold', color: DESIGN.colors.accentSecondary },
    modalDetalleHeaderInfo: { flex: 1 },
    modalDetalleNombre: { fontSize: 18, fontWeight: 'bold', color: DESIGN.colors.text },
    modalDetalleEmail: { fontSize: 13, marginTop: 2, opacity: 0.7, color: DESIGN.colors.textSecondary },
    modalDetalleRolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    modalDetalleRolText: { fontWeight: '600', textTransform: 'capitalize' },
    modalDetalleCerrar: { padding: 4 },
    modalDetalleScroll: { maxHeight: 500 },
    cargandoDetalle: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
    cargandoDetalleTexto: { fontSize: 14, fontWeight: '500', opacity: 0.7, color: DESIGN.colors.textSecondary },
    modalDetalleStats: { flexDirection: 'row', marginBottom: 16 },
    modalDetalleStatItem: {
        flex: 1, alignItems: 'center', paddingVertical: 10,
        borderRadius: 12, borderWidth: 1,
        borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover,
    },
    modalDetalleStatValor: { fontSize: 20, fontWeight: 'bold' },
    modalDetalleStatLabel: { fontSize: 11, marginTop: 2, opacity: 0.6, color: DESIGN.colors.textSecondary },
    accionesAdmin: { flexDirection: 'row', flexWrap: 'wrap' },
    botonAdmin: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    },
    botonAdminTexto: { fontSize: 11, fontWeight: '600', color: '#FFF' },
    modalDetalleSeccion: { marginBottom: 16, borderTopWidth: 1, borderTopColor: DESIGN.colors.border, paddingTop: 12 },
    modalDetalleSeccionTitulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: DESIGN.colors.accentSecondary },
    modalDetalleFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    modalDetalleValor: { fontSize: 14, fontWeight: '500', flex: 1, color: DESIGN.colors.text },
    modalDetalleDireccion: { fontSize: 14, fontWeight: '500', color: DESIGN.colors.text },
    modalDetalleVacio: { fontSize: 13, textAlign: 'center', paddingVertical: 8, opacity: 0.6, color: DESIGN.colors.textSecondary },
    modalDetallePedido: {
        borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1,
        borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover,
    },
    modalDetallePedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalDetallePedidoId: { fontSize: 13, fontWeight: 'bold', color: DESIGN.colors.text },
    modalDetallePedidoEstado: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    modalDetallePedidoInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    modalDetallePedidoFecha: { fontSize: 11, opacity: 0.6, color: DESIGN.colors.textSecondary },
    modalDetallePedidoTotal: { fontSize: 13, fontWeight: 'bold', color: DESIGN.colors.accentSecondary },
    modalDetalleCanje: {
        borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1,
        borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover,
    },
    modalDetalleCanjeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalDetalleCanjeRecompensa: { fontSize: 13, fontWeight: 'bold', color: DESIGN.colors.text },
    modalDetalleCanjePuntos: { fontSize: 12, fontWeight: 'bold', color: DESIGN.colors.accent },
    modalDetalleCanjeFecha: { fontSize: 10, opacity: 0.6, color: DESIGN.colors.textSecondary },
    modalDetalleNotif: {
        borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1,
        borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover,
    },
});