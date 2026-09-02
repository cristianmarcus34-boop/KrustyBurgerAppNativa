// screens/admin/PantallaNotificacionesAdmin.tsx - CON DISEÑO CENTRALIZADO
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Animated,
    RefreshControl,
    Alert,
    Modal,
    FlatList,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { notificacionService } from '../../services/notificacionService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
// ✅ IMPORTAMOS DESDE EL ARCHIVO CENTRALIZADO
import {
    DISENO,
    useResponsive,
    responsiveSize,
    Colores
} from '../../lib/colores';

// ============================================================
// 📋 TIPOS
// ============================================================
interface Usuario {
    id: string;
    nombre_cliente: string;
    email: string;
    fcm_token: string | null;
    rol: string;
}

interface DetalleNotificacion {
    id: number;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    imagen_url: string | null;
    leida: boolean;
    created_at: string;
    usuario_nombre: string;
    usuario_email: string;
    usuario_rol: string;
    origen: 'masiva' | 'recibida';
}

interface NotificacionHistorial {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    imagen_url?: string;
    leida?: boolean;
    creado_en: string;
    created_at?: string;
    enviados?: number;
    segmento?: string;
    origen: 'masiva' | 'recibida';
    usuario_nombre?: string;
    usuario_email?: string;
    usuario_rol?: string;
}

// ============================================================
// 📋 CONFIGURACIÓN
// ============================================================
const TIPOS = [
    { id: 'promocion', label: '🎉 Promoción', icon: 'pricetag-outline' },
    { id: 'oferta', label: '💰 Oferta', icon: 'cash-outline' },
    { id: 'recompensa', label: '🎁 Recompensa', icon: 'gift-outline' },
    { id: 'sistema', label: '⚙️ Sistema', icon: 'settings-outline' },
    { id: 'pedido', label: '📦 Pedido', icon: 'cube-outline' },
];

const SEGMENTOS = [
    { id: 'todos', label: '👥 Todos', desc: 'Todos los usuarios' },
    { id: 'clientes_frecuentes', label: '⭐ Frecuentes', desc: '+5 pedidos' },
    { id: 'clientes_nuevos', label: '🆕 Nuevos', desc: 'Últimos 7 días' },
    { id: 'con_puntos', label: '🎯 Con puntos', desc: 'Puntos disponibles' },
    { id: 'seleccionar', label: '👤 Seleccionar', desc: 'Elige manualmente' },
];

const SONIDOS = [
    { id: 'default', label: '🔔 Predeterminado', file: null, desc: 'Sonido del sistema' },
    { id: 'krusty', label: '🤡 Krusty te quiero', file: 'krustyyotequieromucho', desc: 'Krusty cantando' },
    { id: 'saxo', label: '🎷 Saxo de Lisa', file: 'saxolisa', desc: 'Lisa tocando el saxo' },
    { id: 'circo', label: '🎪 Circopararapapa', file: 'circopararapapa', desc: 'Música de circo' },
];

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaNotificacionesAdmin(props: any) {
    const insets = useSafeAreaInsets();
    const { perfil } = tiendaAutenticacion();
    // ✅ USAMOS EL HOOK CENTRALIZADO
    const responsive = useResponsive();

    // ✅ Estados
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [notificaciones, setNotificaciones] = useState<NotificacionHistorial[]>([]);
    const [notificacionesFiltradas, setNotificacionesFiltradas] = useState<NotificacionHistorial[]>([]);
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
    const [filtroOrigen, setFiltroOrigen] = useState<string | null>(null);
    const [busquedaGlobal, setBusquedaGlobal] = useState('');

    const [detalleVisible, setDetalleVisible] = useState(false);
    const [detalleNotificacion, setDetalleNotificacion] = useState<DetalleNotificacion | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [detalleUsuarios, setDetalleUsuarios] = useState<Usuario[]>([]);

    const [titulo, setTitulo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [tipo, setTipo] = useState('promocion');
    const [segmento, setSegmento] = useState('todos');
    const [enviando, setEnviando] = useState(false);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    const [modalUsuarios, setModalUsuarios] = useState(false);
    const [seleccionados, setSeleccionados] = useState<Usuario[]>([]);
    const [modalConfirm, setModalConfirm] = useState(false);
    const [usuariosCount, setUsuariosCount] = useState(0);

    const [sonidoSeleccionado, setSonidoSeleccionado] = useState('default');

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(25)).current;

    // ✅ Tamaños responsivos usando el hook centralizado
    const padding = responsive.getEspaciado('LG');

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        cargarTodo();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideUpAnim, { toValue: 0, friction: 12, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    // ============================================================
    // 🔄 FUNCIONES DE CARGA (se mantienen igual)
    // ============================================================
    const cargarTodo = async () => {
        setCargando(true);
        await Promise.all([cargarHistorial(), cargarUsuarios()]);
        setCargando(false);
        setRefrescando(false);
    };

    const cargarHistorial = async () => {
        try {
            const todas: NotificacionHistorial[] = [];

            const { data: enviadas, error: errorEnviadas } = await supabase
                .from('notificaciones_enviadas')
                .select('*')
                .order('creado_en', { ascending: false })
                .limit(100);

            if (!errorEnviadas && enviadas) {
                enviadas.forEach((n: any) => {
                    todas.push({
                        ...n,
                        creado_en: n.creado_en,
                        origen: 'masiva',
                        tipo: n.tipo || 'promocion',
                    });
                });
            }

            const { data: usuarioNotifs, error: errorUsuarioNotifs } = await supabase
                .from('notificaciones_usuarios')
                .select(`
                    *,
                    perfiles!usuario_id (
                        nombre_cliente,
                        email,
                        rol
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(200);

            if (!errorUsuarioNotifs && usuarioNotifs) {
                usuarioNotifs.forEach((n: any) => {
                    const perfil = n.perfiles;
                    todas.push({
                        id: n.id,
                        titulo: n.titulo,
                        mensaje: n.mensaje,
                        tipo: n.tipo,
                        imagen_url: n.imagen_url,
                        leida: n.leida,
                        creado_en: n.created_at,
                        origen: 'recibida',
                        usuario_nombre: perfil?.nombre_cliente || 'Usuario',
                        usuario_email: perfil?.email || 'Sin email',
                        usuario_rol: perfil?.rol || 'cliente',
                    });
                });
            }

            todas.sort((a, b) => {
                return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();
            });

            setNotificaciones(todas);
            setNotificacionesFiltradas(todas);
        } catch (error) {
            console.error('Error cargando historial:', error);
            setNotificaciones([]);
            setNotificacionesFiltradas([]);
        }
    };

    const cargarUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre_cliente, email, fcm_token, rol')
                .in('rol', ['admin', 'cliente', 'repartidor'])
                .order('nombre_cliente');

            if (error) throw error;
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            Alert.alert('Error', 'No se pudieron cargar los usuarios');
        } finally {
            setCargandoUsuarios(false);
        }
    };

    // ============================================================
    // 🔍 FILTROS
    // ============================================================
    useEffect(() => {
        let filtradas = [...notificaciones];

        if (filtroTipo) {
            filtradas = filtradas.filter(n => n.tipo === filtroTipo);
        }

        if (filtroOrigen) {
            filtradas = filtradas.filter(n => n.origen === filtroOrigen);
        }

        if (busquedaGlobal.trim()) {
            const search = busquedaGlobal.toLowerCase();
            filtradas = filtradas.filter(n =>
                n.titulo.toLowerCase().includes(search) ||
                n.mensaje.toLowerCase().includes(search)
            );
        }

        setNotificacionesFiltradas(filtradas);
    }, [notificaciones, filtroTipo, filtroOrigen, busquedaGlobal]);

    // ============================================================
    // 📊 FUNCIONES AUXILIARES (usando DISENO.colors)
    // ============================================================
    const getRolIcon = (rol: string) => {
        if (rol === 'admin') return '👑';
        if (rol === 'repartidor') return '🚲';
        return '👤';
    };

    const getRolColor = (rol: string) => {
        if (rol === 'admin') return DISENO.colors.accentSecondary;
        if (rol === 'repartidor') return DISENO.colors.success;
        return DISENO.colors.textTertiary;
    };

    const getOrigenColor = (origen: string) => {
        if (origen === 'masiva') return DISENO.colors.accentSecondary;
        if (origen === 'recibida') return DISENO.colors.success;
        return DISENO.colors.textTertiary;
    };

    const getOrigenLabel = (origen: string) => {
        if (origen === 'masiva') return '📤 Envío masivo';
        if (origen === 'recibida') return '📩 Recibida';
        return '📨 Otro';
    };

    const getTipoColor = (tipoId: string) => {
        const colors: Record<string, string> = {
            'promocion': DISENO.colors.accentSecondary,
            'oferta': DISENO.colors.success,
            'recompensa': DISENO.colors.rosa,
            'sistema': DISENO.colors.info,
            'pedido': DISENO.colors.warning,
        };
        return colors[tipoId] || DISENO.colors.textTertiary;
    };

    // ============================================================
    // 📷 IMAGEN (se mantiene igual)
    // ============================================================
    const seleccionarImagen = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setImagenSeleccionada(uri);
                await subirImagen(uri);
            }
        } catch (error) {
            console.error('Error seleccionando imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const tomarFoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setImagenSeleccionada(uri);
                await subirImagen(uri);
            }
        } catch (error) {
            console.error('Error tomando foto:', error);
            Alert.alert('Error', 'No se pudo tomar la foto');
        }
    };

    const subirImagen = async (uri: string) => {
        setSubiendoImagen(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const fileExt = uri.split('.').pop() || 'jpg';
            const fileName = `notificacion-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('notificaciones')
                .upload(fileName, blob, {
                    contentType: `image/${fileExt}`,
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('notificaciones')
                .getPublicUrl(fileName);

            setImagenUrl(urlData.publicUrl);
            Alert.alert('✅ Éxito', 'Imagen subida correctamente');
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            Alert.alert('Error', 'No se pudo subir la imagen');
        } finally {
            setSubiendoImagen(false);
        }
    };

    const mostrarOpcionesImagen = () => {
        Alert.alert(
            'Seleccionar imagen',
            'Elige una opción',
            [
                { text: '📷 Tomar foto', onPress: tomarFoto },
                { text: '🖼️ Elegir de galería', onPress: seleccionarImagen },
                { text: 'Cancelar', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    // ============================================================
    // 📨 ENVÍO DE NOTIFICACIONES
    // ============================================================
    const obtenerDestinatarios = async () => {
        if (seleccionados.length > 0) {
            return { count: seleccionados.length, data: seleccionados };
        }

        let query = supabase
            .from('perfiles')
            .select('id, nombre_cliente, email, fcm_token, rol', { count: 'exact' })
            .in('rol', ['admin', 'cliente', 'repartidor']);

        if (segmento === 'clientes_frecuentes') {
            const { data: pedidos } = await supabase
                .from('pedidos')
                .select('id_de_usuario')
                .eq('estado', 'entregado');

            const conteoPorUsuario = pedidos?.reduce((acc: any, p) => {
                if (p.id_de_usuario) {
                    acc[p.id_de_usuario] = (acc[p.id_de_usuario] || 0) + 1;
                }
                return acc;
            }, {});

            const idsFrecuentes = Object.keys(conteoPorUsuario || {})
                .filter(id => conteoPorUsuario[id] >= 5);

            if (idsFrecuentes.length > 0) {
                query = query.in('id', idsFrecuentes);
            } else {
                return { count: 0, data: [] };
            }
        }

        if (segmento === 'clientes_nuevos') {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - 7);
            query = query.eq('rol', 'cliente').gte('creado_en', fecha.toISOString());
        }

        if (segmento === 'con_puntos') {
            query = query.eq('rol', 'cliente').gt('puntos_disponibles', 0);
        }

        const { data, count } = await query;
        return { count: count || 0, data: data || [] };
    };

    const enviarNotificacion = async () => {
        if (!titulo || !mensaje) {
            Alert.alert('Error', 'Completa título y mensaje');
            return;
        }

        setEnviando(true);
        setModalConfirm(false);

        try {
            const { data: destinatarios } = await obtenerDestinatarios();
            const conToken = destinatarios.filter((u: any) => u.fcm_token && u.fcm_token.length > 10);

            if (!conToken.length) {
                Alert.alert('Sin tokens', 'Ningún usuario tiene token FCM válido.');
                setEnviando(false);
                return;
            }

            await notificacionService.guardarNotificacionEnviada(
                titulo, mensaje, tipo,
                seleccionados.length > 0 ? 'seleccionados' : segmento,
                conToken.length
            );

            await notificacionService.guardarNotificacionesMultiples(
                conToken.map((u: any) => u.id),
                titulo,
                mensaje,
                tipo,
                imagenUrl || undefined
            );

            const sonidoFile = SONIDOS.find(s => s.id === sonidoSeleccionado)?.file || null;

            const datosNotificacion: any = {
                tipo,
                segmento: seleccionados.length > 0 ? 'seleccionados' : segmento,
                imagen: imagenUrl || undefined,
            };

            if (sonidoFile) {
                datosNotificacion.sonido = sonidoFile;
            }

            await notificacionService.enviarNotificacionesMasivas(
                conToken.map((u: any) => u.fcm_token),
                titulo,
                mensaje,
                datosNotificacion
            );

            setTitulo('');
            setMensaje('');
            setImagenUrl('');
            setImagenSeleccionada(null);
            setSonidoSeleccionado('default');
            setSeleccionados([]);
            await cargarHistorial();

            Alert.alert('✅ Enviado', `Notificación enviada a ${conToken.length} usuarios`);
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const confirmarEnvio = async () => {
        const { count } = await obtenerDestinatarios();
        setUsuariosCount(count || 0);
        if (count === 0) {
            Alert.alert('Sin destinatarios', 'No hay usuarios en este segmento');
            return;
        }
        setModalConfirm(true);
    };

    // ============================================================
    // 🗑️ ELIMINAR
    // ============================================================
    const eliminarNotificacion = async (notificacion: NotificacionHistorial) => {
        Alert.alert(
            '🗑️ Eliminar notificación',
            '¿Estás seguro de que quieres eliminar esta notificación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            let eliminada = false;

                            if (notificacion.origen === 'masiva') {
                                const { error } = await supabase
                                    .from('notificaciones_enviadas')
                                    .delete()
                                    .eq('id', notificacion.id);
                                if (!error) eliminada = true;
                            }

                            if (notificacion.origen === 'recibida') {
                                const { error } = await supabase
                                    .from('notificaciones_usuarios')
                                    .delete()
                                    .eq('id', notificacion.id);
                                if (!error) eliminada = true;
                            }

                            if (eliminada) {
                                await cargarHistorial();
                                setDetalleVisible(false);
                                Alert.alert('✅ Eliminada', 'La notificación fue eliminada');
                            } else {
                                Alert.alert('❌ Error', 'No se pudo eliminar la notificación');
                            }
                        } catch (error) {
                            console.error('Error eliminando:', error);
                            Alert.alert('❌ Error', 'No se pudo eliminar la notificación');
                        }
                    }
                }
            ]
        );
    };

    const eliminarTodasNotificaciones = async () => {
        Alert.alert(
            '🗑️ Eliminar todas',
            '¿Estás seguro de que quieres eliminar TODAS las notificaciones?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar todas',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.from('notificaciones_enviadas').delete().neq('id', 0);
                            await supabase.from('notificaciones_usuarios').delete().neq('id', 0);
                            await cargarHistorial();
                            Alert.alert('✅ Eliminadas', 'Todas las notificaciones fueron eliminadas');
                        } catch (error) {
                            console.error('Error eliminando todas:', error);
                            Alert.alert('❌ Error', 'No se pudieron eliminar las notificaciones');
                        }
                    }
                }
            ]
        );
    };

    // ============================================================
    // 👥 SELECCIÓN DE USUARIOS
    // ============================================================
    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const toggleSeleccion = (u: Usuario) => {
        setSeleccionados(prev =>
            prev.find(p => p.id === u.id)
                ? prev.filter(p => p.id !== u.id)
                : [...prev, u]
        );
    };

    const seleccionarTodosConToken = () => {
        setSeleccionados(usuarios.filter(u => u.fcm_token && u.fcm_token.length > 10));
    };

    const limpiarSeleccion = () => {
        setSeleccionados([]);
        setModalUsuarios(false);
        setBusqueda('');
    };

    // ============================================================
    // 📋 DETALLE
    // ============================================================
    const obtenerDetalleNotificacion = async (notificacion: NotificacionHistorial) => {
        setCargandoDetalle(true);
        setDetalleVisible(true);
        setDetalleUsuarios([]);

        try {
            if (notificacion.origen === 'masiva') {
                const { data: usuariosNotif } = await supabase
                    .from('notificaciones_usuarios')
                    .select(`
                        usuario_id,
                        perfiles!usuario_id (
                            id,
                            nombre_cliente,
                            email,
                            rol,
                            fcm_token
                        )
                    `)
                    .eq('titulo', notificacion.titulo)
                    .eq('mensaje', notificacion.mensaje)
                    .limit(50);

                if (usuariosNotif) {
                    const usuariosList = usuariosNotif
                        .map((u: any) => u.perfiles)
                        .filter((p: any) => p !== null);
                    setDetalleUsuarios(usuariosList);
                }

                setDetalleNotificacion({
                    id: notificacion.id,
                    usuario_id: 'masiva',
                    titulo: notificacion.titulo,
                    mensaje: notificacion.mensaje,
                    tipo: notificacion.tipo,
                    imagen_url: notificacion.imagen_url || null,
                    leida: false,
                    created_at: notificacion.creado_en,
                    usuario_nombre: 'Envío masivo',
                    usuario_email: `${notificacion.enviados || 0} usuarios`,
                    usuario_rol: 'admin',
                    origen: 'masiva',
                });
            } else {
                const { data: notif } = await supabase
                    .from('notificaciones_usuarios')
                    .select('*')
                    .eq('id', notificacion.id)
                    .single();

                if (notif) {
                    const { data: perfil } = await supabase
                        .from('perfiles')
                        .select('nombre_cliente, email, rol')
                        .eq('id', notif.usuario_id)
                        .single();

                    setDetalleNotificacion({
                        id: notif.id,
                        usuario_id: notif.usuario_id,
                        titulo: notif.titulo,
                        mensaje: notif.mensaje,
                        tipo: notif.tipo,
                        imagen_url: notif.imagen_url,
                        leida: notif.leida,
                        created_at: notif.created_at,
                        usuario_nombre: perfil?.nombre_cliente || 'Usuario',
                        usuario_email: perfil?.email || 'Sin email',
                        usuario_rol: perfil?.rol || 'cliente',
                        origen: 'recibida',
                    });
                }
            }
        } catch (error) {
            console.error('Error obteniendo detalle:', error);
            Alert.alert('Error', 'No se pudo obtener el detalle');
            setDetalleVisible(false);
        } finally {
            setCargandoDetalle(false);
        }
    };

    // ============================================================
    // 🏗️ RENDER
    // ============================================================
    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={[styles.loadingText, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>
                    Cargando notificaciones...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F5F2ED', '#FFFFFF', '#F5F2ED']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <Animated.ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={cargarTodo}
                        tintColor={DISENO.colors.accent}
                        colors={[DISENO.colors.accent]}
                    />
                }
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingHorizontal: padding,
                        paddingTop: insets.top + responsive.spacing(16),
                        paddingBottom: insets.bottom + responsive.spacing(48) * 2,
                    }
                ]}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => props.navigation.goBack()}
                        style={styles.headerBack}
                    >
                        <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 28, normal: 24, small: 20 })} color={DISENO.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { fontSize: responsive.getValor({ tablet: 24, normal: 20, small: 17 }) }]}>
                        📱 Notificaciones
                    </Text>
                    <TouchableOpacity onPress={cargarHistorial} style={styles.headerRefresh}>
                        <Ionicons name="refresh" size={responsive.getValor({ tablet: 24, normal: 20, small: 17 })} color={DISENO.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Formulario */}
                <View style={[styles.form, { padding: responsive.getEspaciado('MD') }]}>
                    <Text style={[styles.formTitle, { fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }) }]}>
                        ✏️ Nueva Notificación
                    </Text>

                    {/* Título */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }) }]}>
                        Título *
                    </Text>
                    <TextInput
                        style={[styles.input, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder="Ej: ¡Oferta especial!"
                        placeholderTextColor={DISENO.colors.textTertiary}
                        maxLength={100}
                    />

                    {/* Mensaje */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }), marginTop: responsive.getEspaciado('MD') }]}>
                        Mensaje *
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}
                        value={mensaje}
                        onChangeText={setMensaje}
                        placeholder="Escribe el mensaje..."
                        placeholderTextColor={DISENO.colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />

                    {/* Imagen */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }), marginTop: responsive.getEspaciado('MD') }]}>
                        🖼️ Imagen / Banner (Opcional)
                    </Text>

                    {imagenUrl ? (
                        <View style={styles.imagenPreviewContainer}>
                            <Image source={{ uri: imagenUrl }} style={styles.imagenPreview} resizeMode="cover" />
                            <TouchableOpacity
                                style={styles.botonEliminarImagen}
                                onPress={() => { setImagenUrl(''); setImagenSeleccionada(null); }}
                            >
                                <Ionicons name="close-circle" size={28} color={DISENO.colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.botonSeleccionarImagen}
                            onPress={mostrarOpcionesImagen}
                            disabled={subiendoImagen}
                        >
                            {subiendoImagen ? (
                                <ActivityIndicator size="small" color={DISENO.colors.accent} />
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={24} color={DISENO.colors.textTertiary} />
                                    <Text style={[styles.botonSeleccionarImagenTexto, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }) }]}>
                                        Seleccionar imagen de la galería
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Tipo */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }), marginTop: responsive.getEspaciado('MD') }]}>
                        Tipo
                    </Text>
                    <View style={[styles.tiposContainer, { gap: responsive.getEspaciado('XS') }]}>
                        {TIPOS.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.tipoOption,
                                    tipo === t.id && styles.tipoOptionActive,
                                    {
                                        paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                                        paddingHorizontal: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                                        flexBasis: responsive.isTablet ? '30%' : responsive.isSmallPhone ? '45%' : '30%',
                                    }
                                ]}
                                onPress={() => setTipo(t.id)}
                            >
                                <Ionicons
                                    name={t.icon as any}
                                    size={responsive.getValor({ tablet: 22, normal: 18, small: 14 })}
                                    color={tipo === t.id ? DISENO.colors.accent : DISENO.colors.textTertiary}
                                />
                                <Text style={[
                                    styles.tipoLabel,
                                    {
                                        fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }),
                                        color: tipo === t.id ? DISENO.colors.accent : DISENO.colors.textTertiary
                                    }
                                ]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Sonido */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }), marginTop: responsive.getEspaciado('MD') }]}>
                        🔊 Sonido
                    </Text>
                    <View style={[styles.tiposContainer, { gap: responsive.getEspaciado('XS') }]}>
                        {SONIDOS.map(s => (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.tipoOption,
                                    sonidoSeleccionado === s.id && styles.tipoOptionActive,
                                    {
                                        paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                                        paddingHorizontal: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                                        flexBasis: responsive.isTablet ? '45%' : responsive.isSmallPhone ? '90%' : '45%',
                                    }
                                ]}
                                onPress={() => setSonidoSeleccionado(s.id)}
                            >
                                <Text style={[
                                    styles.tipoLabel,
                                    {
                                        fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }),
                                        color: sonidoSeleccionado === s.id ? DISENO.colors.accent : DISENO.colors.textTertiary
                                    }
                                ]}>
                                    {s.label}
                                </Text>
                                {sonidoSeleccionado === s.id && (
                                    <Ionicons name="checkmark-circle" size={responsive.getValor({ tablet: 18, normal: 16, small: 14 })} color={DISENO.colors.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Segmento */}
                    <Text style={[styles.label, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }), marginTop: responsive.getEspaciado('MD') }]}>
                        Segmento
                    </Text>
                    {SEGMENTOS.map(s => (
                        <TouchableOpacity
                            key={s.id}
                            style={[
                                styles.segmentoOption,
                                segmento === s.id && styles.segmentoOptionActive,
                                {
                                    paddingVertical: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                                    borderRadius: DISENO.radius.sm,
                                }
                            ]}
                            onPress={() => {
                                setSegmento(s.id);
                                if (s.id === 'seleccionar') setModalUsuarios(true);
                                else setSeleccionados([]);
                            }}
                        >
                            <View>
                                <Text style={[
                                    styles.segmentoLabel,
                                    {
                                        fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }),
                                        color: segmento === s.id ? DISENO.colors.accent : DISENO.colors.text
                                    }
                                ]}>
                                    {s.label}
                                </Text>
                                <Text style={[
                                    styles.segmentoDesc,
                                    { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }
                                ]}>
                                    {s.desc}
                                </Text>
                            </View>
                            {segmento === s.id && (
                                <Ionicons name="checkmark-circle" size={responsive.getValor({ tablet: 24, normal: 20, small: 16 })} color={DISENO.colors.accent} />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Seleccionados */}
                    {seleccionados.length > 0 && (
                        <View style={styles.seleccionadosContainer}>
                            <Text style={[styles.seleccionadosLabel, { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 11 }) }]}>
                                👤 {seleccionados.length} seleccionados
                            </Text>
                            <TouchableOpacity onPress={() => setModalUsuarios(true)}>
                                <Text style={[styles.seleccionadosEditar, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>
                                    Editar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Botón enviar */}
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!titulo || !mensaje) && styles.sendButtonDisabled,
                            { marginTop: responsive.getEspaciado('MD') }
                        ]}
                        onPress={confirmarEnvio}
                        disabled={enviando || !titulo || !mensaje}
                    >
                        <LinearGradient
                            colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                            style={styles.sendButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {enviando ? (
                                <ActivityIndicator color={DISENO.colors.surface} />
                            ) : (
                                <>
                                    <Ionicons name="send" size={responsive.getValor({ tablet: 24, normal: 20, small: 16 })} color={DISENO.colors.surface} />
                                    <Text style={[styles.sendButtonText, { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }) }]}>
                                        Enviar Notificación
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Filtros */}
                <View style={{ marginVertical: responsive.getEspaciado('MD') }}>
                    <View style={styles.filtrosContainer}>
                        <Text style={[styles.filtrosTitulo, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>
                            🔍 Filtros:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosScroll}>
                            <TouchableOpacity
                                style={[styles.filtroChip, !filtroTipo && styles.filtroChipActivo]}
                                onPress={() => setFiltroTipo(null)}
                            >
                                <Text style={[styles.filtroChipTexto, !filtroTipo && styles.filtroChipTextoActivo]}>
                                    Todos
                                </Text>
                            </TouchableOpacity>
                            {TIPOS.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.filtroChip, filtroTipo === t.id && styles.filtroChipActivo]}
                                    onPress={() => setFiltroTipo(filtroTipo === t.id ? null : t.id)}
                                >
                                    <Text style={[styles.filtroChipTexto, filtroTipo === t.id && styles.filtroChipTextoActivo]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.filtroChip, filtroOrigen === 'masiva' && styles.filtroChipActivo]}
                                onPress={() => setFiltroOrigen(filtroOrigen === 'masiva' ? null : 'masiva')}
                            >
                                <Text style={[styles.filtroChipTexto, filtroOrigen === 'masiva' && styles.filtroChipTextoActivo]}>
                                    📤 Masivas
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filtroChip, filtroOrigen === 'recibida' && styles.filtroChipActivo]}
                                onPress={() => setFiltroOrigen(filtroOrigen === 'recibida' ? null : 'recibida')}
                            >
                                <Text style={[styles.filtroChipTexto, filtroOrigen === 'recibida' && styles.filtroChipTextoActivo]}>
                                    📩 Recibidas
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Buscador global */}
                    <View style={styles.buscadorGlobalContainer}>
                        <Ionicons name="search" size={20} color={DISENO.colors.textTertiary} />
                        <TextInput
                            style={[styles.buscadorGlobalInput, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}
                            placeholder="Buscar en el historial..."
                            placeholderTextColor={DISENO.colors.textTertiary}
                            value={busquedaGlobal}
                            onChangeText={setBusquedaGlobal}
                        />
                        {busquedaGlobal.length > 0 && (
                            <TouchableOpacity onPress={() => setBusquedaGlobal('')}>
                                <Ionicons name="close-circle" size={20} color={DISENO.colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Historial */}
                <View>
                    <View style={styles.historialHeader}>
                        <Text style={[styles.historialTitle, { fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }) }]}>
                            📜 Historial Completo ({notificacionesFiltradas.length})
                        </Text>
                        {notificacionesFiltradas.length > 0 && (
                            <TouchableOpacity onPress={eliminarTodasNotificaciones} style={styles.botonEliminarTodas}>
                                <Ionicons name="trash-outline" size={responsive.getValor({ tablet: 22, normal: 20, small: 17 })} color={DISENO.colors.danger} />
                                <Text style={[styles.botonEliminarTodasTexto, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>
                                    Eliminar todas
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {notificacionesFiltradas.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={50} color={DISENO.colors.textTertiary} />
                            <Text style={[styles.emptyText, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>
                                {notificaciones.length === 0 ? 'No hay notificaciones en el historial' : 'No hay resultados para los filtros seleccionados'}
                            </Text>
                            <Text style={[styles.emptySubtext, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }]}>
                                {notificaciones.length === 0 ? 'Las notificaciones que envíes o recibas aparecerán aquí' : 'Prueba cambiando los filtros de búsqueda'}
                            </Text>
                        </View>
                    ) : (
                        notificacionesFiltradas.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.id}-${index}`}
                                style={[styles.historialItem, { padding: responsive.getEspaciado('MD') }]}
                                onPress={() => obtenerDetalleNotificacion(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.historialItemHeader}>
                                    <View style={styles.historialHeaderLeft}>
                                        <Text style={[styles.historialTitulo, { fontSize: responsive.getValor({ tablet: 15, normal: 14, small: 12 }) }]} numberOfLines={1}>
                                            {item.titulo}
                                        </Text>
                                        <View style={[styles.historialBadge, { backgroundColor: getTipoColor(item.tipo) + '20' }]}>
                                            <Text style={[styles.historialBadgeText, { fontSize: responsive.getValor({ tablet: 11, normal: 10, small: 8 }), color: getTipoColor(item.tipo) }]}>
                                                {TIPOS.find(t => t.id === item.tipo)?.label || item.tipo}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.historialActions}>
                                        <View style={[styles.origenBadge, { backgroundColor: getOrigenColor(item.origen) + '20' }]}>
                                            <Text style={[styles.origenBadgeTexto, { fontSize: responsive.getValor({ tablet: 10, normal: 9, small: 7 }), color: getOrigenColor(item.origen) }]}>
                                                {getOrigenLabel(item.origen)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                eliminarNotificacion(item);
                                            }}
                                            style={styles.historialBotonEliminar}
                                        >
                                            <Ionicons name="trash-outline" size={responsive.getValor({ tablet: 20, normal: 18, small: 15 })} color={DISENO.colors.danger} />
                                        </TouchableOpacity>
                                        <Ionicons name="chevron-forward" size={responsive.getValor({ tablet: 22, normal: 20, small: 17 })} color={DISENO.colors.textTertiary} />
                                    </View>
                                </View>

                                <Text style={[styles.historialMensaje, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]} numberOfLines={2}>
                                    {item.mensaje}
                                </Text>

                                {item.imagen_url && (
                                    <View style={styles.historialImagenPreview}>
                                        <Image source={{ uri: item.imagen_url }} style={styles.historialImagen} resizeMode="cover" />
                                    </View>
                                )}

                                {item.origen === 'recibida' && (
                                    <View style={styles.historialUsuarioInfo}>
                                        <Text style={[styles.historialUsuarioNombre, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>
                                            👤 {item.usuario_nombre}
                                        </Text>
                                        <Text style={[styles.historialUsuarioEmail, { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 8 }) }]}>
                                            {item.usuario_email}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.historialFooter}>
                                    <Text style={[styles.historialInfo, { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 8 }) }]}>
                                        {item.origen === 'masiva' ? `📤 ${item.enviados || 0} usuarios` : '📩 Individual'}
                                    </Text>
                                    <Text style={[styles.historialFecha, { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 8 }) }]}>
                                        {new Date(item.creado_en).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </Animated.ScrollView>

            {/* ============================================================ */}
            {/* MODALES - Todos usan DISENO.colors en lugar de DESIGN.colors */}
            {/* ============================================================ */}

            {/* Modal de Detalle */}
            <Modal visible={detalleVisible} transparent animationType="slide" onRequestClose={() => setDetalleVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalDetalleContent, { borderRadius: DISENO.radius.lg }]}>
                        {cargandoDetalle ? (
                            <View style={styles.modalDetalleLoading}>
                                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                                <Text style={[styles.loadingText, { marginTop: 12 }]}>Cargando detalle...</Text>
                            </View>
                        ) : detalleNotificacion ? (
                            <>
                                <View style={[styles.modalDetalleHeader, { padding: responsive.getEspaciado('MD') }]}>
                                    <TouchableOpacity onPress={() => setDetalleVisible(false)}>
                                        <Ionicons name="close" size={28} color={DISENO.colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.modalDetalleTitle, { fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }) }]}>
                                        📨 Detalle de Notificación
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const notif = notificacionesFiltradas.find(n => n.id === detalleNotificacion.id);
                                            if (notif) eliminarNotificacion(notif);
                                        }}
                                        style={styles.modalDetalleEliminar}
                                    >
                                        <Ionicons name="trash-outline" size={24} color={DISENO.colors.danger} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalDetalleBody} showsVerticalScrollIndicator={false}>
                                    <View style={[styles.modalDetalleUsuario, { padding: responsive.getEspaciado('MD') }]}>
                                        <View style={styles.modalDetalleUsuarioAvatar}>
                                            <Text style={[styles.modalDetalleUsuarioAvatarText, { fontSize: responsive.getValor({ tablet: 24, normal: 22, small: 18 }) }]}>
                                                {detalleNotificacion.usuario_nombre?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={styles.modalDetalleUsuarioInfo}>
                                            <Text style={[styles.modalDetalleUsuarioNombre, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>
                                                {detalleNotificacion.usuario_nombre}
                                            </Text>
                                            <Text style={[styles.modalDetalleUsuarioEmail, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }]}>
                                                {detalleNotificacion.usuario_email}
                                            </Text>
                                            <View style={[styles.modalDetalleUsuarioRol, { backgroundColor: getRolColor(detalleNotificacion.usuario_rol) + '20' }]}>
                                                <Text style={[styles.modalDetalleUsuarioRolText, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }), color: getRolColor(detalleNotificacion.usuario_rol) }]}>
                                                    {getRolIcon(detalleNotificacion.usuario_rol)} {detalleNotificacion.usuario_rol?.toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={[styles.modalDetalleOrigenBadge, {
                                                backgroundColor: detalleNotificacion.origen === 'masiva' ? DISENO.colors.accentSecondary + '20' : DISENO.colors.success + '20',
                                                marginTop: 4,
                                            }]}>
                                                <Text style={[styles.modalDetalleOrigenTexto, {
                                                    fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }),
                                                    color: detalleNotificacion.origen === 'masiva' ? DISENO.colors.accentSecondary : DISENO.colors.success,
                                                }]}>
                                                    {detalleNotificacion.origen === 'masiva' ? '📤 Envío masivo' : '📩 Recibida'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={[styles.modalDetalleInfo, { padding: responsive.getEspaciado('MD') }]}>
                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>📌 Título</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>{detalleNotificacion.titulo}</Text>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>📝 Mensaje</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>{detalleNotificacion.mensaje}</Text>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>🏷️ Tipo</Text>
                                            <View style={[styles.modalDetalleTipoBadge, { backgroundColor: getTipoColor(detalleNotificacion.tipo) + '20' }]}>
                                                <Text style={[styles.modalDetalleTipoBadgeText, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }), color: getTipoColor(detalleNotificacion.tipo) }]}>
                                                    {TIPOS.find(t => t.id === detalleNotificacion.tipo)?.label || detalleNotificacion.tipo}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>📅 Fecha</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>
                                                {new Date(detalleNotificacion.created_at).toLocaleString('es-AR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>👁️ Estado</Text>
                                            <View style={[styles.modalDetalleEstadoBadge, { backgroundColor: detalleNotificacion.leida ? DISENO.colors.success + '20' : DISENO.colors.accentSecondary + '20' }]}>
                                                <Text style={[styles.modalDetalleEstadoBadgeText, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }), color: detalleNotificacion.leida ? DISENO.colors.success : DISENO.colors.accentSecondary }]}>
                                                    {detalleNotificacion.leida ? '✅ Leída' : '📬 No leída'}
                                                </Text>
                                            </View>
                                        </View>

                                        {detalleNotificacion.imagen_url && (
                                            <View style={styles.modalDetalleInfoRow}>
                                                <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>🖼️ Imagen</Text>
                                                <Image source={{ uri: detalleNotificacion.imagen_url }} style={styles.modalDetalleImagen} resizeMode="cover" />
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>

                                <View style={[styles.modalDetalleFooter, { padding: responsive.getEspaciado('MD') }]}>
                                    <TouchableOpacity
                                        style={[styles.modalDetalleBtn, styles.modalDetalleBtnEliminar]}
                                        onPress={() => {
                                            const notif = notificacionesFiltradas.find(n => n.id === detalleNotificacion.id);
                                            if (notif) eliminarNotificacion(notif);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={DISENO.colors.surface} />
                                        <Text style={[styles.modalDetalleBtnText, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]}>Eliminar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalDetalleBtn, styles.modalDetalleBtnCerrar]}
                                        onPress={() => setDetalleVisible(false)}
                                    >
                                        <Text style={[styles.modalDetalleBtnText, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* Modal de Usuarios */}
            <Modal visible={modalUsuarios} transparent animationType="slide" onRequestClose={limpiarSeleccion}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { borderRadius: DISENO.radius.lg }]}>
                        <View style={[styles.modalHeader, { padding: responsive.getEspaciado('MD') }]}>
                            <Text style={[styles.modalTitle, { fontSize: responsive.getValor({ tablet: 20, normal: 17, small: 15 }) }]}>👤 Seleccionar Usuarios</Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={seleccionarTodosConToken}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>✅ Con token</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSeleccionados([...usuarios])}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>👥 Todos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSeleccionados([])}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }), color: DISENO.colors.danger }]}>Limpiar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.buscadorContainer, { padding: responsive.getEspaciado('XS'), marginHorizontal: responsive.getEspaciado('MD'), marginTop: responsive.getEspaciado('MD') }]}>
                            <Ionicons name="search" size={responsive.getValor({ tablet: 22, normal: 18, small: 14 })} color={DISENO.colors.textTertiary} />
                            <TextInput
                                style={[styles.buscadorInput, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}
                                placeholder="Buscar..."
                                placeholderTextColor={DISENO.colors.textTertiary}
                                value={busqueda}
                                onChangeText={setBusqueda}
                            />
                            {busqueda.length > 0 && (
                                <TouchableOpacity onPress={() => setBusqueda('')}>
                                    <Ionicons name="close-circle" size={responsive.getValor({ tablet: 22, normal: 18, small: 14 })} color={DISENO.colors.textTertiary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {cargandoUsuarios ? (
                            <View style={styles.modalUsuariosLoading}>
                                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                                <Text style={[styles.loadingText, { marginTop: 12 }]}>Cargando usuarios...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={usuariosFiltrados}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => {
                                    const isSelected = seleccionados.some(u => u.id === item.id);
                                    const hasToken = item.fcm_token && item.fcm_token.length > 10;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.usuarioItem,
                                                isSelected && styles.usuarioSelected,
                                                {
                                                    padding: responsive.getEspaciado('SM'),
                                                    marginHorizontal: responsive.getEspaciado('MD'),
                                                }
                                            ]}
                                            onPress={() => toggleSeleccion(item)}
                                        >
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={[styles.usuarioNombre, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>
                                                    {item.nombre_cliente || 'Sin nombre'}
                                                </Text>
                                                <Text style={[styles.usuarioEmail, { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }) }]}>
                                                    {item.email}
                                                    {' • '}
                                                    <Text style={{ color: getRolColor(item.rol) }}>
                                                        {getRolIcon(item.rol)} {item.rol.charAt(0).toUpperCase() + item.rol.slice(1)}
                                                    </Text>
                                                </Text>
                                            </View>
                                            <View style={styles.usuarioStatus}>
                                                <View style={[styles.badgeToken, { backgroundColor: hasToken ? DISENO.colors.success + '20' : DISENO.colors.danger + '20' }]}>
                                                    <Text style={{ color: hasToken ? DISENO.colors.success : DISENO.colors.danger, fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 8 }) }}>
                                                        {hasToken ? '✅ Token' : '❌ Sin token'}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <Ionicons name="checkmark-circle" size={responsive.getValor({ tablet: 24, normal: 20, small: 16 })} color={DISENO.colors.accent} />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={() => (
                                    <View style={styles.modalEmpty}>
                                        <Text style={[styles.modalEmptyText, { fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }) }]}>No hay usuarios</Text>
                                    </View>
                                )}
                            />
                        )}

                        <View style={[styles.modalFooter, { padding: responsive.getEspaciado('MD') }]}>
                            <Text style={[styles.modalCount, { fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }]}>{seleccionados.length} seleccionados</Text>
                            <View style={styles.modalFooterButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalCancel, { paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }), paddingHorizontal: responsive.getValor({ tablet: 18, normal: 14, small: 10 }) }]}
                                    onPress={limpiarSeleccion}
                                >
                                    <Text style={[styles.modalButtonText, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalConfirm]}
                                    onPress={() => {
                                        if (!seleccionados.length) {
                                            Alert.alert('Selecciona usuarios', 'Debes seleccionar al menos uno');
                                            return;
                                        }
                                        setModalUsuarios(false);
                                        setSegmento('seleccionar');
                                    }}
                                >
                                    <LinearGradient
                                        colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                                        style={[styles.modalConfirmGradient, { paddingVertical: responsive.getValor({ tablet: 12, normal: 10, small: 8 }), paddingHorizontal: responsive.getValor({ tablet: 18, normal: 14, small: 10 }) }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={[styles.modalButtonText, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }), color: DISENO.colors.surface }]}>
                                            Aplicar ({seleccionados.length})
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Confirmación */}
            <Modal visible={modalConfirm} transparent animationType="fade" onRequestClose={() => setModalConfirm(false)}>
                <View style={styles.modalConfirmBackdrop}>
                    <View style={[styles.modalConfirmContent, { padding: responsive.getEspaciado('XL'), borderRadius: DISENO.radius.lg }]}>
                        <Ionicons name="send" size={responsive.getValor({ tablet: 56, normal: 48, small: 40 })} color={DISENO.colors.accent} />
                        <Text style={[styles.modalConfirmTitle, { fontSize: responsive.getValor({ tablet: 22, normal: 18, small: 15 }) }]}>Confirmar Envío</Text>
                        <Text style={[styles.modalConfirmText, { fontSize: responsive.getValor({ tablet: 17, normal: 15, small: 12 }) }]}>
                            ¿Enviar a <Text style={styles.modalHighlight}>{usuariosCount}</Text> usuarios?
                        </Text>
                        <Text style={[styles.modalConfirmSubtext, { fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }) }]}>
                            {seleccionados.length > 0 ? `Segmento: Seleccionados (${seleccionados.length})` : `Segmento: ${SEGMENTOS.find(s => s.id === segmento)?.label}`}
                        </Text>
                        <View style={[styles.modalConfirmButtons, { gap: responsive.getEspaciado('SM') }]}>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, styles.modalConfirmCancel, { minHeight: responsive.getValor({ tablet: 52, normal: 46, small: 40 }) }]}
                                onPress={() => setModalConfirm(false)}
                            >
                                <Text style={[styles.modalConfirmBtnText, { fontSize: responsive.getValor({ tablet: 17, normal: 15, small: 12 }) }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, styles.modalConfirmSend, { minHeight: responsive.getValor({ tablet: 52, normal: 46, small: 40 }) }]}
                                onPress={enviarNotificacion}
                            >
                                <LinearGradient
                                    colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                                    style={[styles.modalConfirmBtnGradient, { paddingVertical: responsive.getValor({ tablet: 14, normal: 12, small: 10 }) }]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={[styles.modalConfirmBtnText, { fontSize: responsive.getValor({ tablet: 17, normal: 15, small: 12 }), color: DISENO.colors.surface }]}>
                                        Enviar
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - USANDO DISENO CENTRALIZADO
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
    scroll: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DISENO.colors.fondo,
    },
    loadingText: {
        color: DISENO.colors.textSecondary,
        marginTop: 12,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: DISENO.spacing.md,
    },
    headerBack: {
        padding: DISENO.spacing.xs,
    },
    headerRefresh: {
        padding: DISENO.spacing.xs,
    },
    title: {
        fontWeight: '700',
        color: DISENO.colors.text,
        flex: 1,
        textAlign: 'center',
    },
    form: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.md,
        marginBottom: DISENO.spacing.md,
        ...DISENO.shadow.sm,
    },
    formTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
        marginBottom: DISENO.spacing.md,
    },
    label: {
        fontWeight: '600',
        color: DISENO.colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        backgroundColor: DISENO.colors.fondo,
        borderRadius: DISENO.radius.sm,
        paddingHorizontal: DISENO.spacing.md,
        paddingVertical: DISENO.spacing.sm,
        color: DISENO.colors.text,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    tiposContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tipoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        borderRadius: DISENO.radius.sm,
        justifyContent: 'center',
        backgroundColor: DISENO.colors.surface,
    },
    tipoOptionActive: {
        borderColor: DISENO.colors.accent,
        backgroundColor: DISENO.colors.accent + '15',
    },
    tipoLabel: {
        fontWeight: '500',
    },
    segmentoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: 6,
        paddingHorizontal: DISENO.spacing.md,
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.sm,
    },
    segmentoOptionActive: {
        borderColor: DISENO.colors.accent,
        backgroundColor: DISENO.colors.accent + '10',
    },
    segmentoLabel: {
        fontWeight: '600',
    },
    segmentoDesc: {
        color: DISENO.colors.textTertiary,
        marginTop: 2,
    },
    seleccionadosContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: DISENO.colors.accent + '10',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '30',
        borderRadius: DISENO.radius.sm,
        padding: DISENO.spacing.sm,
        marginTop: DISENO.spacing.sm,
    },
    seleccionadosLabel: {
        color: DISENO.colors.accent,
        fontWeight: '600',
    },
    seleccionadosEditar: {
        color: DISENO.colors.accent,
        fontWeight: '500',
    },
    sendButton: {
        overflow: 'hidden',
        borderRadius: DISENO.radius.md,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: DISENO.spacing.sm,
        paddingVertical: DISENO.spacing.md,
    },
    sendButtonText: {
        fontWeight: '700',
        color: DISENO.colors.surface,
    },
    historialTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
    },
    historialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DISENO.spacing.md,
    },
    historialItem: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.md,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: DISENO.spacing.sm,
        ...DISENO.shadow.sm,
    },
    historialItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historialHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    historialActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historialBotonEliminar: {
        padding: 4,
    },
    historialTitulo: {
        fontWeight: '600',
        color: DISENO.colors.text,
    },
    historialBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    historialBadgeText: {
        fontWeight: '600',
    },
    historialMensaje: {
        color: DISENO.colors.textSecondary,
        marginBottom: 4,
    },
    historialFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    historialInfo: {
        color: DISENO.colors.textTertiary,
    },
    historialFecha: {
        color: DISENO.colors.textTertiary,
    },
    historialImagenPreview: {
        marginTop: 6,
        marginBottom: 4,
        borderRadius: 6,
        overflow: 'hidden',
        height: 80,
        width: '100%',
    },
    historialImagen: {
        width: '100%',
        height: '100%',
    },
    historialUsuarioInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    historialUsuarioNombre: {
        color: DISENO.colors.success,
        fontWeight: '500',
    },
    historialUsuarioEmail: {
        color: DISENO.colors.textTertiary,
    },
    origenBadge: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    origenBadgeTexto: {
        fontWeight: '500',
    },
    botonEliminarTodas: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        backgroundColor: DISENO.colors.danger + '15',
        borderRadius: DISENO.radius.sm,
    },
    botonEliminarTodasTexto: {
        color: DISENO.colors.danger,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: DISENO.colors.textSecondary,
        marginTop: 12,
        fontWeight: '500',
    },
    emptySubtext: {
        color: DISENO.colors.textTertiary,
        marginTop: 4,
    },
    filtrosContainer: {
        marginBottom: 8,
    },
    filtrosTitulo: {
        color: DISENO.colors.textSecondary,
        marginBottom: 6,
        fontWeight: '600',
    },
    filtrosScroll: {
        gap: 6,
        paddingRight: 8,
    },
    filtroChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: DISENO.colors.surface,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    filtroChipActivo: {
        backgroundColor: DISENO.colors.accent + '20',
        borderColor: DISENO.colors.accent,
    },
    filtroChipTexto: {
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
    filtroChipTextoActivo: {
        color: DISENO.colors.accent,
    },
    buscadorGlobalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.md,
        paddingHorizontal: DISENO.spacing.md,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    buscadorGlobalInput: {
        flex: 1,
        color: DISENO.colors.text,
        padding: 0,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: DISENO.colors.surface,
        width: '95%',
        maxWidth: 600,
        maxHeight: '85%',
        overflow: 'hidden',
        ...DISENO.shadow.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.fondo,
        flexWrap: 'wrap',
        gap: 8,
    },
    modalTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    modalAction: {
        color: DISENO.colors.accent,
        fontWeight: '500',
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: DISENO.colors.accent + '15',
        borderRadius: 4,
    },
    buscadorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DISENO.colors.fondo,
        borderRadius: DISENO.radius.sm,
        gap: 8,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    buscadorInput: {
        flex: 1,
        color: DISENO.colors.text,
        padding: 0,
    },
    usuarioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        borderRadius: DISENO.radius.sm,
        backgroundColor: DISENO.colors.fondo,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    usuarioSelected: {
        backgroundColor: DISENO.colors.accent + '15',
        borderColor: DISENO.colors.accent,
    },
    usuarioNombre: {
        fontWeight: '600',
        color: DISENO.colors.text,
    },
    usuarioEmail: {
        color: DISENO.colors.textSecondary,
    },
    usuarioStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeToken: {
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.fondo,
        flexWrap: 'wrap',
        gap: 8,
    },
    modalCount: {
        color: DISENO.colors.textSecondary,
    },
    modalFooterButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    modalButton: {
        borderRadius: DISENO.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    modalCancel: {
        backgroundColor: DISENO.colors.fondo,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalConfirm: {
        overflow: 'hidden',
        borderRadius: DISENO.radius.sm,
    },
    modalConfirmGradient: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        fontWeight: '600',
        color: DISENO.colors.text,
    },
    modalEmpty: {
        padding: 40,
        alignItems: 'center',
    },
    modalEmptyText: {
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
    },
    modalConfirmBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalConfirmContent: {
        backgroundColor: DISENO.colors.surface,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: DISENO.colors.accent + '30',
        ...DISENO.shadow.lg,
    },
    modalConfirmTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
        marginTop: 8,
    },
    modalConfirmText: {
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    modalHighlight: {
        color: DISENO.colors.accent,
        fontWeight: '700',
    },
    modalConfirmSubtext: {
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        marginBottom: DISENO.spacing.md,
    },
    modalConfirmButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    modalConfirmBtn: {
        flex: 1,
        borderRadius: DISENO.radius.md,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalConfirmCancel: {
        backgroundColor: DISENO.colors.fondo,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalConfirmSend: {
        overflow: 'hidden',
        borderRadius: DISENO.radius.md,
    },
    modalConfirmBtnGradient: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalConfirmBtnText: {
        fontWeight: '700',
        color: DISENO.colors.text,
    },
    modalUsuariosLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    imagenPreviewContainer: {
        position: 'relative',
        marginTop: 6,
        marginBottom: 6,
        borderRadius: DISENO.radius.sm,
        overflow: 'hidden',
        backgroundColor: DISENO.colors.fondo,
    },
    imagenPreview: {
        width: '100%',
        height: 120,
        borderRadius: DISENO.radius.sm,
    },
    botonEliminarImagen: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: DISENO.colors.surface + '90',
        borderRadius: 20,
        padding: 4,
        ...DISENO.shadow.sm,
    },
    botonSeleccionarImagen: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderColor: DISENO.colors.border,
        borderRadius: DISENO.radius.md,
        borderStyle: 'dashed',
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: DISENO.colors.fondo,
        minHeight: 60,
    },
    botonSeleccionarImagenTexto: {
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
    modalDetalleContent: {
        backgroundColor: DISENO.colors.surface,
        width: '95%',
        maxWidth: 500,
        maxHeight: '90%',
        overflow: 'hidden',
        ...DISENO.shadow.lg,
    },
    modalDetalleLoading: {
        padding: 40,
        alignItems: 'center',
    },
    modalDetalleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.fondo,
    },
    modalDetalleTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
        flex: 1,
        textAlign: 'center',
    },
    modalDetalleEliminar: {
        padding: 4,
    },
    modalDetalleBody: {
        maxHeight: '70%',
    },
    modalDetalleUsuario: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DISENO.colors.fondo,
        borderBottomWidth: 1,
        borderBottomColor: DISENO.colors.border,
    },
    modalDetalleUsuarioAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: DISENO.colors.accent + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalDetalleUsuarioAvatarText: {
        fontWeight: '700',
        color: DISENO.colors.accent,
    },
    modalDetalleUsuarioInfo: {
        flex: 1,
    },
    modalDetalleUsuarioNombre: {
        fontWeight: '700',
        color: DISENO.colors.text,
    },
    modalDetalleUsuarioEmail: {
        color: DISENO.colors.textSecondary,
    },
    modalDetalleUsuarioRol: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    modalDetalleUsuarioRolText: {
        fontWeight: '500',
    },
    modalDetalleOrigenBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalDetalleOrigenTexto: {
        fontWeight: '600',
    },
    modalDetalleInfo: {
        gap: 12,
    },
    modalDetalleInfoRow: {
        gap: 2,
    },
    modalDetalleInfoLabel: {
        color: DISENO.colors.textTertiary,
        fontWeight: '500',
    },
    modalDetalleInfoValue: {
        color: DISENO.colors.text,
        fontWeight: '500',
    },
    modalDetalleTipoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalDetalleTipoBadgeText: {
        fontWeight: '600',
    },
    modalDetalleEstadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalDetalleEstadoBadgeText: {
        fontWeight: '600',
    },
    modalDetalleImagen: {
        width: '100%',
        height: 150,
        borderRadius: DISENO.radius.sm,
        marginTop: 4,
        backgroundColor: DISENO.colors.fondo,
    },
    modalDetalleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.fondo,
    },
    modalDetalleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: DISENO.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    modalDetalleBtnEliminar: {
        backgroundColor: DISENO.colors.danger,
    },
    modalDetalleBtnCerrar: {
        backgroundColor: DISENO.colors.fondo,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalDetalleBtnText: {
        fontWeight: '700',
        color: DISENO.colors.surface,
    },
});