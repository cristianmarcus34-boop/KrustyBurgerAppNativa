// screens/admin/PantallaNotificacionesAdmin.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
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
import { Colores } from '../../lib/colores';

const { width } = Dimensions.get('window');

const COLORS = {
    amarillo: '#F5C518',
    amarilloOscuro: '#D4A800',
    rojo: '#E53935',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    blanco: '#FFFFFF',
    negro: '#0A0A0A',
    grisOscuro: '#1A1A1A',
    gris: '#333333',
    grisClaro: '#B0B0B0',
    celeste: '#42A5F5',
    rosa: '#EC407A',
    naranja: '#FF6F00',
};

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

export default function PantallaNotificacionesAdmin(props: any) {
    const insets = useSafeAreaInsets();
    const { perfil } = tiendaAutenticacion();
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
    const [cargandoUsuariosDetalle, setCargandoUsuariosDetalle] = useState(false);

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
    const sonidosDisponibles = [
        { id: 'default', label: '🔔 Predeterminado', file: null, desc: 'Sonido del sistema' },
        { id: 'krusty', label: '🤡 Krusty te quiero', file: 'krustyyotequieromucho', desc: 'Krusty cantando' },
        { id: 'saxo', label: '🎷 Saxo de Lisa', file: 'saxolisa', desc: 'Lisa tocando el saxo' },
        { id: 'circo', label: '🎪 Circopararapapa', file: 'circopararapapa', desc: 'Música de circo' },
    ];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    const isTablet = width >= 768;
    const isSmall = width < 375;

    const responsive = {
        padding: isTablet ? 24 : isSmall ? 12 : 16,
        paddingVertical: isTablet ? 20 : isSmall ? 8 : 12,
        gap: isTablet ? 12 : isSmall ? 4 : 6,
        fontSize: {
            title: isTablet ? 28 : isSmall ? 20 : 24,
            formTitle: isTablet ? 20 : isSmall ? 15 : 17,
            label: isTablet ? 15 : isSmall ? 12 : 13,
            input: isTablet ? 16 : isSmall ? 13 : 14,
            button: isTablet ? 18 : isSmall ? 14 : 16,
            small: isTablet ? 13 : isSmall ? 9 : 11,
            historialTitle: isTablet ? 20 : isSmall ? 15 : 17,
            modalTitle: isTablet ? 24 : isSmall ? 16 : 18,
            modalText: isTablet ? 17 : isSmall ? 13 : 15,
        },
        size: {
            icon: isTablet ? 24 : isSmall ? 16 : 20,
            iconSmall: isTablet ? 20 : isSmall ? 14 : 16,
            tipo: isTablet ? 14 : isSmall ? 9 : 11,
        },
        borderRadius: isTablet ? 16 : isSmall ? 8 : 12,
        inputHeight: isTablet ? 50 : isSmall ? 40 : 44,
    };

    useEffect(() => {
        cargarTodo();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    const cargarTodo = async () => {
        setCargando(true);
        await Promise.all([cargarHistorial(), cargarUsuarios()]);
        setCargando(false);
        setRefrescando(false);
    };

    const cargarHistorial = async () => {
        try {
            const todas: NotificacionHistorial[] = [];

            // ✅ 1. Notificaciones enviadas masivamente
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
                console.log('📱 Notificaciones masivas:', enviadas.length);
            }

            // ✅ 2. Notificaciones de usuarios
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
                console.log('📱 Notificaciones de usuarios:', usuarioNotifs.length);
            }

            todas.sort((a, b) => {
                const dateA = new Date(a.creado_en);
                const dateB = new Date(b.creado_en);
                return dateB.getTime() - dateA.getTime();
            });

            console.log('📱 TOTAL notificaciones en historial:', todas.length);
            setNotificaciones(todas);
            setNotificacionesFiltradas(todas);
        } catch (error) {
            console.error('Error cargando historial:', error);
            setNotificaciones([]);
            setNotificacionesFiltradas([]);
        }
    };

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

    const cargarUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre_cliente, email, fcm_token, rol')
                .in('rol', ['admin', 'cliente', 'repartidor'])
                .order('nombre_cliente');

            if (error) {
                console.error('Error cargando usuarios:', error);
                Alert.alert('Error', 'No se pudieron cargar los usuarios');
                return;
            }
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCargandoUsuarios(false);
        }
    };

    const obtenerDetalleNotificacion = async (notificacion: NotificacionHistorial) => {
        setCargandoDetalle(true);
        setDetalleVisible(true);
        setDetalleUsuarios([]);

        try {
            if (notificacion.origen === 'masiva') {
                const { data: usuariosNotif, error } = await supabase
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

                if (!error && usuariosNotif) {
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
                const { data: notif, error: notifError } = await supabase
                    .from('notificaciones_usuarios')
                    .select('*')
                    .eq('id', notificacion.id)
                    .single();

                if (notifError) throw notifError;

                if (notif) {
                    const { data: perfil, error: perfilError } = await supabase
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
            Alert.alert('Error', 'No se pudo obtener el detalle de la notificación');
            setDetalleVisible(false);
        } finally {
            setCargandoDetalle(false);
            setCargandoUsuariosDetalle(false);
        }
    };

    const eliminarNotificacion = async (notificacion: NotificacionHistorial) => {
        Alert.alert(
            '🗑️ Eliminar notificación',
            '¿Estás seguro de que quieres eliminar esta notificación? Esta acción no se puede deshacer.',
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

                            if (!eliminada) {
                                const { error: err1 } = await supabase
                                    .from('notificaciones_usuarios')
                                    .delete()
                                    .eq('id', notificacion.id);

                                const { error: err2 } = await supabase
                                    .from('notificaciones_enviadas')
                                    .delete()
                                    .eq('id', notificacion.id);

                                if (!err1 || !err2) eliminada = true;
                            }

                            if (eliminada) {
                                await cargarHistorial();
                                setDetalleVisible(false);
                                Alert.alert('✅ Eliminada', 'La notificación fue eliminada correctamente');
                            } else {
                                Alert.alert('❌ Error', 'No se pudo eliminar la notificación');
                            }
                        } catch (error) {
                            console.error('Error eliminando notificación:', error);
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
            '¿Estás seguro de que quieres eliminar TODAS las notificaciones? Esta acción no se puede deshacer.',
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

    const seleccionarImagen = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para seleccionar una imagen');
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
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar una foto');
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
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('notificaciones')
                .upload(filePath, blob, {
                    contentType: `image/${fileExt}`,
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('notificaciones')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            setImagenUrl(publicUrl);
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

    const enviarNotificacion = async () => {
        if (!titulo || !mensaje) {
            Alert.alert('Error', 'Completa título y mensaje');
            return;
        }

        setEnviando(true);
        setModalConfirm(false);

        try {
            const { data: destinatarios, count } = await obtenerDestinatarios();
            const conToken = destinatarios.filter((u: any) => u.fcm_token && u.fcm_token.length > 10);

            if (!conToken.length) {
                Alert.alert('Sin tokens', 'Ningún usuario tiene token FCM válido.');
                setEnviando(false);
                return;
            }

            await notificacionService.guardarNotificacionEnviada(titulo, mensaje, tipo, seleccionados.length > 0 ? 'seleccionados' : segmento, conToken.length);

            await notificacionService.guardarNotificacionesMultiples(
                conToken.map((u: any) => u.id),
                titulo,
                mensaje,
                tipo,
                imagenUrl || undefined
            );

            const sonidoFile = sonidosDisponibles.find(s => s.id === sonidoSeleccionado)?.file || null;

            const datosNotificacion: any = {
                tipo,
                segmento: seleccionados.length > 0 ? 'seleccionados' : segmento,
                imagen: imagenUrl || undefined,
            };

            if (sonidoFile) {
                datosNotificacion.sonido = sonidoFile;
            }

            const resultado = await notificacionService.enviarNotificacionesMasivas(
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
            limpiarSeleccion();
            await cargarHistorial();

            Alert.alert(
                resultado.success ? '✅ Enviado' : '⚠️ Parcial',
                `Enviados: ${resultado.resultados?.exitos || 0} de ${conToken.length}`
            );

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

    const tipos = [
        { id: 'promocion', label: '🎉 Promoción', icon: 'pricetag-outline', color: COLORS.amarillo },
        { id: 'oferta', label: '💰 Oferta', icon: 'cash-outline', color: COLORS.verdeClaro },
        { id: 'recompensa', label: '🎁 Recompensa', icon: 'gift-outline', color: COLORS.rosa },
        { id: 'sistema', label: '⚙️ Sistema', icon: 'settings-outline', color: COLORS.celeste },
        { id: 'pedido', label: '📦 Pedido', icon: 'cube-outline', color: COLORS.naranja },
    ];

    const segmentos = [
        { id: 'todos', label: '👥 Todos', desc: 'Todos los usuarios' },
        { id: 'clientes_frecuentes', label: '⭐ Frecuentes', desc: '+5 pedidos' },
        { id: 'clientes_nuevos', label: '🆕 Nuevos', desc: 'Últimos 7 días' },
        { id: 'con_puntos', label: '🎯 Con puntos', desc: 'Puntos disponibles' },
        { id: 'seleccionar', label: '👤 Seleccionar', desc: 'Elige manualmente' },
    ];

    const getRolIcon = (rol: string) => {
        if (rol === 'admin') return '👑';
        if (rol === 'repartidor') return '🚲';
        return '👤';
    };

    const getRolColor = (rol: string) => {
        if (rol === 'admin') return COLORS.amarillo;
        if (rol === 'repartidor') return COLORS.verdeClaro;
        return COLORS.grisClaro;
    };

    const getOrigenColor = (origen: string) => {
        if (origen === 'masiva') return COLORS.amarillo;
        if (origen === 'recibida') return COLORS.verdeClaro;
        return COLORS.grisClaro;
    };

    const getOrigenLabel = (origen: string) => {
        if (origen === 'masiva') return '📤 Envío masivo';
        if (origen === 'recibida') return '📩 Recibida';
        return '📨 Otro';
    };

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={[styles.loadingText, { fontSize: responsive.fontSize.label }]}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.verde, COLORS.negro]} style={styles.gradient} />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={cargarTodo} tintColor={COLORS.amarillo} />}
                contentContainerStyle={[styles.scroll, { padding: responsive.padding, paddingTop: insets.top + 16 }]}
            >
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <TouchableOpacity onPress={() => props.navigation.goBack()}>
                        <Ionicons name="arrow-back" size={responsive.size.icon + 4} color={COLORS.blanco} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { fontSize: responsive.fontSize.title }]}>📱 Notificaciones</Text>
                    <TouchableOpacity onPress={cargarHistorial}>
                        <Ionicons name="refresh" size={responsive.size.icon} color={COLORS.blanco} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Formulario */}
                <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], padding: responsive.padding, borderRadius: responsive.borderRadius }]}>
                    <Text style={[styles.formTitle, { fontSize: responsive.fontSize.formTitle }]}>✏️ Nueva Notificación</Text>

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label }]}>Título *</Text>
                    <TextInput
                        style={[styles.input, { fontSize: responsive.fontSize.input, height: responsive.inputHeight }]}
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder="Ej: ¡Oferta especial!"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        maxLength={100}
                    />

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label, marginTop: responsive.padding }]}>Mensaje *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { fontSize: responsive.fontSize.input, minHeight: isSmall ? 80 : 100 }]}
                        value={mensaje}
                        onChangeText={setMensaje}
                        placeholder="Escribe el mensaje..."
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label, marginTop: responsive.padding }]}>🖼️ Imagen / Banner (Opcional)</Text>

                    {imagenUrl ? (
                        <View style={styles.imagenPreviewContainer}>
                            <Image source={{ uri: imagenUrl }} style={styles.imagenPreview} resizeMode="cover" />
                            <TouchableOpacity style={styles.botonEliminarImagen} onPress={() => { setImagenUrl(''); setImagenSeleccionada(null); }}>
                                <Ionicons name="close-circle" size={28} color={COLORS.rojo} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.botonSeleccionarImagen} onPress={mostrarOpcionesImagen} disabled={subiendoImagen}>
                            {subiendoImagen ? (
                                <ActivityIndicator size="small" color={COLORS.amarillo} />
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={24} color={COLORS.grisClaro} />
                                    <Text style={styles.botonSeleccionarImagenTexto}>Seleccionar imagen de la galería</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label, marginTop: responsive.padding }]}>Tipo</Text>
                    <View style={[styles.tiposContainer, { gap: responsive.gap }]}>
                        {tipos.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.tipoOption,
                                    tipo === t.id && { backgroundColor: t.color + '20', borderColor: t.color },
                                    {
                                        paddingVertical: isSmall ? 6 : isTablet ? 12 : 8,
                                        paddingHorizontal: isSmall ? 6 : isTablet ? 14 : 10,
                                        borderRadius: responsive.borderRadius,
                                        flexBasis: isTablet ? '30%' : isSmall ? '45%' : '30%',
                                    }
                                ]}
                                onPress={() => setTipo(t.id)}
                            >
                                <Ionicons name={t.icon as any} size={responsive.size.iconSmall} color={tipo === t.id ? t.color : COLORS.grisClaro} />
                                <Text style={[styles.tipoLabel, { fontSize: responsive.size.tipo, color: tipo === t.id ? t.color : COLORS.grisClaro }]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label, marginTop: responsive.padding }]}>🔊 Sonido</Text>
                    <View style={[styles.tiposContainer, { gap: responsive.gap }]}>
                        {sonidosDisponibles.map(s => (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.tipoOption,
                                    sonidoSeleccionado === s.id && {
                                        backgroundColor: s.id === 'default' ? COLORS.gris + '30' : COLORS.amarillo + '20',
                                        borderColor: s.id === 'default' ? COLORS.gris : COLORS.amarillo
                                    },
                                    {
                                        paddingVertical: isSmall ? 6 : isTablet ? 12 : 8,
                                        paddingHorizontal: isSmall ? 6 : isTablet ? 14 : 10,
                                        borderRadius: responsive.borderRadius,
                                        flexBasis: isTablet ? '45%' : isSmall ? '90%' : '45%',
                                    }
                                ]}
                                onPress={() => setSonidoSeleccionado(s.id)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: responsive.size.tipo }}>{s.label}</Text>
                                </View>
                                {sonidoSeleccionado === s.id && <Ionicons name="checkmark-circle" size={16} color={s.id === 'default' ? COLORS.grisClaro : COLORS.amarillo} />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { fontSize: responsive.fontSize.label, marginTop: responsive.padding }]}>Segmento</Text>
                    {segmentos.map(s => (
                        <TouchableOpacity
                            key={s.id}
                            style={[
                                styles.segmentoOption,
                                segmento === s.id && { borderColor: COLORS.amarillo, backgroundColor: COLORS.amarillo + '15' },
                                { paddingVertical: isSmall ? 8 : isTablet ? 14 : 10, borderRadius: responsive.borderRadius }
                            ]}
                            onPress={() => {
                                setSegmento(s.id);
                                if (s.id === 'seleccionar') setModalUsuarios(true);
                                else setSeleccionados([]);
                            }}
                        >
                            <View>
                                <Text style={[styles.segmentoLabel, { fontSize: responsive.fontSize.label, color: segmento === s.id ? COLORS.amarillo : COLORS.blanco }]}>{s.label}</Text>
                                <Text style={[styles.segmentoDesc, { fontSize: responsive.fontSize.small }]}>{s.desc}</Text>
                            </View>
                            {segmento === s.id && <Ionicons name="checkmark-circle" size={responsive.size.icon} color={COLORS.amarillo} />}
                        </TouchableOpacity>
                    ))}

                    {seleccionados.length > 0 && (
                        <View style={[styles.seleccionadosContainer, { padding: responsive.padding, borderRadius: responsive.borderRadius, marginTop: responsive.padding }]}>
                            <Text style={[styles.seleccionadosLabel, { fontSize: responsive.fontSize.label }]}>👤 {seleccionados.length} seleccionados</Text>
                            <TouchableOpacity onPress={() => setModalUsuarios(true)}>
                                <Text style={[styles.seleccionadosEditar, { fontSize: responsive.fontSize.small }]}>Editar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.sendButton, (!titulo || !mensaje) && { opacity: 0.5 }, { borderRadius: responsive.borderRadius, marginTop: responsive.padding }]}
                        onPress={confirmarEnvio}
                        disabled={enviando || !titulo || !mensaje}
                    >
                        <LinearGradient colors={[COLORS.amarillo, COLORS.amarilloOscuro]} style={[styles.sendButtonGradient, { paddingVertical: isSmall ? 12 : isTablet ? 18 : 14 }]}>
                            {enviando ? <ActivityIndicator color={COLORS.negro} /> : (
                                <>
                                    <Ionicons name="send" size={responsive.size.icon} color={COLORS.negro} />
                                    <Text style={[styles.sendButtonText, { fontSize: responsive.fontSize.button }]}>Enviar Notificación</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* ✅ FILTROS */}
                <Animated.View style={{ opacity: fadeAnim, marginVertical: 12 }}>
                    <View style={styles.filtrosContainer}>
                        <Text style={[styles.filtrosTitulo, { fontSize: responsive.fontSize.small }]}>🔍 Filtros:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosScroll}>
                            <TouchableOpacity
                                style={[styles.filtroChip, !filtroTipo && styles.filtroChipActivo]}
                                onPress={() => setFiltroTipo(null)}
                            >
                                <Text style={[styles.filtroChipTexto, !filtroTipo && styles.filtroChipTextoActivo]}>Todos</Text>
                            </TouchableOpacity>
                            {tipos.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.filtroChip, filtroTipo === t.id && styles.filtroChipActivo]}
                                    onPress={() => setFiltroTipo(filtroTipo === t.id ? null : t.id)}
                                >
                                    <Text style={[styles.filtroChipTexto, filtroTipo === t.id && styles.filtroChipTextoActivo]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.filtroChip, filtroOrigen === 'masiva' && styles.filtroChipActivo]}
                                onPress={() => setFiltroOrigen(filtroOrigen === 'masiva' ? null : 'masiva')}
                            >
                                <Text style={[styles.filtroChipTexto, filtroOrigen === 'masiva' && styles.filtroChipTextoActivo]}>📤 Masivas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filtroChip, filtroOrigen === 'recibida' && styles.filtroChipActivo]}
                                onPress={() => setFiltroOrigen(filtroOrigen === 'recibida' ? null : 'recibida')}
                            >
                                <Text style={[styles.filtroChipTexto, filtroOrigen === 'recibida' && styles.filtroChipTextoActivo]}>📩 Recibidas</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <View style={styles.buscadorGlobalContainer}>
                        <Ionicons name="search" size={20} color={COLORS.grisClaro} />
                        <TextInput
                            style={[styles.buscadorGlobalInput, { fontSize: responsive.fontSize.input }]}
                            placeholder="Buscar en el historial..."
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            value={busquedaGlobal}
                            onChangeText={setBusquedaGlobal}
                        />
                        {busquedaGlobal.length > 0 && (
                            <TouchableOpacity onPress={() => setBusquedaGlobal('')}>
                                <Ionicons name="close-circle" size={20} color={COLORS.grisClaro} />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* ✅ HISTORIAL */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.historialHeader}>
                        <Text style={[styles.historialTitle, { fontSize: responsive.fontSize.historialTitle }]}>
                            📜 Historial Completo ({notificacionesFiltradas.length})
                        </Text>
                        {notificacionesFiltradas.length > 0 && (
                            <TouchableOpacity onPress={eliminarTodasNotificaciones} style={styles.botonEliminarTodas}>
                                <Ionicons name="trash-outline" size={20} color={COLORS.rojo} />
                                <Text style={[styles.botonEliminarTodasTexto, { fontSize: responsive.fontSize.small }]}>Eliminar todas</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {notificacionesFiltradas.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={50} color={COLORS.grisClaro + '30'} />
                            <Text style={[styles.emptyText, { fontSize: responsive.fontSize.label }]}>
                                {notificaciones.length === 0 ? 'No hay notificaciones en el historial' : 'No hay resultados para los filtros seleccionados'}
                            </Text>
                            <Text style={[styles.emptySubtext, { fontSize: responsive.fontSize.small }]}>
                                {notificaciones.length === 0 ? 'Las notificaciones que envíes o recibas aparecerán aquí' : 'Prueba cambiando los filtros de búsqueda'}
                            </Text>
                        </View>
                    ) : (
                        notificacionesFiltradas.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.id}-${index}`}
                                style={[styles.historialItem, { padding: responsive.padding, borderRadius: responsive.borderRadius }]}
                                onPress={() => obtenerDetalleNotificacion(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.historialItemHeader}>
                                    <View style={styles.historialHeaderLeft}>
                                        <Text style={[styles.historialTitulo, { fontSize: responsive.fontSize.label }]} numberOfLines={1}>
                                            {item.titulo}
                                        </Text>
                                        <View style={[styles.historialBadge, { backgroundColor: (tipos.find(t => t.id === item.tipo)?.color || COLORS.gris) + '20' }]}>
                                            <Text style={[styles.historialBadgeText, { fontSize: responsive.fontSize.small, color: tipos.find(t => t.id === item.tipo)?.color || COLORS.gris }]}>
                                                {tipos.find(t => t.id === item.tipo)?.label || item.tipo}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.historialActions}>
                                        <View style={[styles.origenBadge, { backgroundColor: getOrigenColor(item.origen) + '20' }]}>
                                            <Text style={[styles.origenBadgeTexto, { fontSize: responsive.fontSize.small, color: getOrigenColor(item.origen) }]}>
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
                                            <Ionicons name="trash-outline" size={18} color={COLORS.rojo} />
                                        </TouchableOpacity>
                                        <Ionicons name="chevron-forward" size={20} color={COLORS.grisClaro} />
                                    </View>
                                </View>

                                <Text style={[styles.historialMensaje, { fontSize: responsive.fontSize.label }]} numberOfLines={2}>
                                    {item.mensaje}
                                </Text>

                                {item.imagen_url && (
                                    <View style={styles.historialImagenPreview}>
                                        <Image source={{ uri: item.imagen_url }} style={styles.historialImagen} resizeMode="cover" />
                                    </View>
                                )}

                                {item.origen === 'recibida' && (
                                    <View style={styles.historialUsuarioInfo}>
                                        <Text style={[styles.historialUsuarioNombre, { fontSize: responsive.fontSize.small }]}>
                                            👤 {item.usuario_nombre}
                                        </Text>
                                        <Text style={[styles.historialUsuarioEmail, { fontSize: responsive.fontSize.small }]}>
                                            {item.usuario_email}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.historialFooter}>
                                    <Text style={[styles.historialInfo, { fontSize: responsive.fontSize.small }]}>
                                        {item.origen === 'masiva' ? `📤 ${item.enviados || 0} usuarios` : '📩 Individual'}
                                    </Text>
                                    <Text style={[styles.historialFecha, { fontSize: responsive.fontSize.small }]}>
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
                </Animated.View>
            </ScrollView>

            {/* ✅ MODAL DE DETALLE */}
            <Modal visible={detalleVisible} transparent animationType="slide" onRequestClose={() => setDetalleVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalDetalleContent, { borderRadius: responsive.borderRadius + 4 }]}>
                        {cargandoDetalle ? (
                            <View style={styles.modalDetalleLoading}>
                                <ActivityIndicator size="large" color={COLORS.amarillo} />
                                <Text style={[styles.loadingText, { marginTop: 12 }]}>Cargando detalle...</Text>
                            </View>
                        ) : detalleNotificacion ? (
                            <>
                                <View style={[styles.modalDetalleHeader, { padding: responsive.padding }]}>
                                    <TouchableOpacity onPress={() => setDetalleVisible(false)}>
                                        <Ionicons name="close" size={28} color={COLORS.blanco} />
                                    </TouchableOpacity>
                                    <Text style={[styles.modalDetalleTitle, { fontSize: responsive.fontSize.modalTitle }]}>
                                        📨 Detalle de Notificación
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            const notif = notificacionesFiltradas.find(n => n.id === detalleNotificacion.id);
                                            if (notif) eliminarNotificacion(notif);
                                        }}
                                        style={styles.modalDetalleEliminar}
                                    >
                                        <Ionicons name="trash-outline" size={24} color={COLORS.rojo} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalDetalleBody} showsVerticalScrollIndicator={false}>
                                    <View style={[styles.modalDetalleUsuario, { padding: responsive.padding }]}>
                                        <View style={styles.modalDetalleUsuarioAvatar}>
                                            <Text style={[styles.modalDetalleUsuarioAvatarText, { fontSize: responsive.fontSize.modalTitle }]}>
                                                {detalleNotificacion.usuario_nombre?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={styles.modalDetalleUsuarioInfo}>
                                            <Text style={[styles.modalDetalleUsuarioNombre, { fontSize: responsive.fontSize.label }]}>
                                                {detalleNotificacion.usuario_nombre}
                                            </Text>
                                            <Text style={[styles.modalDetalleUsuarioEmail, { fontSize: responsive.fontSize.small }]}>
                                                {detalleNotificacion.usuario_email}
                                            </Text>
                                            <View style={[styles.modalDetalleUsuarioRol, { backgroundColor: getRolColor(detalleNotificacion.usuario_rol) + '20' }]}>
                                                <Text style={[styles.modalDetalleUsuarioRolText, { fontSize: responsive.fontSize.small, color: getRolColor(detalleNotificacion.usuario_rol) }]}>
                                                    {getRolIcon(detalleNotificacion.usuario_rol)} {detalleNotificacion.usuario_rol?.toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={[styles.modalDetalleOrigenBadge, {
                                                backgroundColor: detalleNotificacion.origen === 'masiva' ? COLORS.amarillo + '20' : COLORS.verdeClaro + '20',
                                                marginTop: 4,
                                            }]}>
                                                <Text style={[styles.modalDetalleOrigenTexto, {
                                                    fontSize: responsive.fontSize.small,
                                                    color: detalleNotificacion.origen === 'masiva' ? COLORS.amarillo : COLORS.verdeClaro,
                                                }]}>
                                                    {detalleNotificacion.origen === 'masiva' ? '📤 Envío masivo' : '📩 Recibida'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={[styles.modalDetalleInfo, { padding: responsive.padding }]}>
                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>📌 Título</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.fontSize.label }]}>{detalleNotificacion.titulo}</Text>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>📝 Mensaje</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.fontSize.label }]}>{detalleNotificacion.mensaje}</Text>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>🏷️ Tipo</Text>
                                            <View style={[styles.modalDetalleTipoBadge, { backgroundColor: (tipos.find(t => t.id === detalleNotificacion.tipo)?.color || COLORS.gris) + '20' }]}>
                                                <Text style={[styles.modalDetalleTipoBadgeText, { fontSize: responsive.fontSize.small, color: tipos.find(t => t.id === detalleNotificacion.tipo)?.color || COLORS.gris }]}>
                                                    {tipos.find(t => t.id === detalleNotificacion.tipo)?.label || detalleNotificacion.tipo}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.modalDetalleInfoRow}>
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>📅 Fecha</Text>
                                            <Text style={[styles.modalDetalleInfoValue, { fontSize: responsive.fontSize.label }]}>
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
                                            <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>👁️ Estado</Text>
                                            <View style={[styles.modalDetalleEstadoBadge, { backgroundColor: detalleNotificacion.leida ? COLORS.verde + '20' : COLORS.amarillo + '20' }]}>
                                                <Text style={[styles.modalDetalleEstadoBadgeText, { fontSize: responsive.fontSize.small, color: detalleNotificacion.leida ? COLORS.verde : COLORS.amarillo }]}>
                                                    {detalleNotificacion.leida ? '✅ Leída' : '📬 No leída'}
                                                </Text>
                                            </View>
                                        </View>

                                        {detalleNotificacion.imagen_url && (
                                            <View style={styles.modalDetalleInfoRow}>
                                                <Text style={[styles.modalDetalleInfoLabel, { fontSize: responsive.fontSize.small }]}>🖼️ Imagen</Text>
                                                <Image source={{ uri: detalleNotificacion.imagen_url }} style={styles.modalDetalleImagen} resizeMode="cover" />
                                            </View>
                                        )}
                                    </View>
                                </ScrollView>

                                <View style={[styles.modalDetalleFooter, { padding: responsive.padding }]}>
                                    <TouchableOpacity
                                        style={[styles.modalDetalleBtn, styles.modalDetalleBtnEliminar]}
                                        onPress={() => {
                                            const notif = notificacionesFiltradas.find(n => n.id === detalleNotificacion.id);
                                            if (notif) eliminarNotificacion(notif);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={COLORS.blanco} />
                                        <Text style={[styles.modalDetalleBtnText, { fontSize: responsive.fontSize.small }]}>Eliminar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalDetalleBtn, styles.modalDetalleBtnCerrar]}
                                        onPress={() => setDetalleVisible(false)}
                                    >
                                        <Text style={[styles.modalDetalleBtnText, { fontSize: responsive.fontSize.small }]}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL DE USUARIOS */}
            <Modal visible={modalUsuarios} transparent animationType="slide" onRequestClose={limpiarSeleccion}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { borderRadius: responsive.borderRadius + 4 }]}>
                        <View style={[styles.modalHeader, { padding: responsive.padding }]}>
                            <Text style={[styles.modalTitle, { fontSize: responsive.fontSize.modalTitle }]}>👤 Seleccionar Usuarios</Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={seleccionarTodosConToken}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.fontSize.small }]}>✅ Con token</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSeleccionados([...usuarios])}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.fontSize.small }]}>👥 Todos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSeleccionados([])}>
                                    <Text style={[styles.modalAction, { fontSize: responsive.fontSize.small, color: COLORS.rojo }]}>Limpiar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.buscadorContainer, { padding: isSmall ? 8 : 12, marginHorizontal: responsive.padding, marginTop: responsive.padding }]}>
                            <Ionicons name="search" size={responsive.size.iconSmall} color={COLORS.grisClaro} />
                            <TextInput
                                style={[styles.buscadorInput, { fontSize: responsive.fontSize.input }]}
                                placeholder="Buscar..."
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                value={busqueda}
                                onChangeText={setBusqueda}
                            />
                            {busqueda.length > 0 && (
                                <TouchableOpacity onPress={() => setBusqueda('')}>
                                    <Ionicons name="close-circle" size={responsive.size.iconSmall} color={COLORS.grisClaro} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {cargandoUsuarios ? (
                            <View style={styles.modalUsuariosLoading}>
                                <ActivityIndicator size="large" color={COLORS.amarillo} />
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
                                        <TouchableOpacity style={[styles.usuarioItem, isSelected && styles.usuarioSelected, { padding: isSmall ? 10 : isTablet ? 14 : 12, marginHorizontal: responsive.padding }]} onPress={() => toggleSeleccion(item)}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={[styles.usuarioNombre, { fontSize: responsive.fontSize.label }]}>{item.nombre_cliente || 'Sin nombre'}</Text>
                                                <Text style={[styles.usuarioEmail, { fontSize: responsive.fontSize.small }]}>
                                                    {item.email}
                                                    {' • '}
                                                    <Text style={{ color: getRolColor(item.rol) }}>
                                                        {getRolIcon(item.rol)} {item.rol.charAt(0).toUpperCase() + item.rol.slice(1)}
                                                    </Text>
                                                </Text>
                                            </View>
                                            <View style={styles.usuarioStatus}>
                                                <View style={[styles.badgeToken, { backgroundColor: hasToken ? COLORS.verde + '20' : COLORS.rojo + '20' }]}>
                                                    <Text style={{ color: hasToken ? COLORS.verde : COLORS.rojo, fontSize: responsive.fontSize.small }}>
                                                        {hasToken ? '✅ Token' : '❌ Sin token'}
                                                    </Text>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark-circle" size={responsive.size.icon} color={COLORS.amarillo} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={() => (
                                    <View style={styles.modalEmpty}>
                                        <Text style={[styles.modalEmptyText, { fontSize: responsive.fontSize.label }]}>No hay usuarios</Text>
                                    </View>
                                )}
                            />
                        )}

                        <View style={[styles.modalFooter, { padding: responsive.padding }]}>
                            <Text style={[styles.modalCount, { fontSize: responsive.fontSize.small }]}>{seleccionados.length} seleccionados</Text>
                            <View style={styles.modalFooterButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.modalCancel, { paddingVertical: isSmall ? 8 : 10, paddingHorizontal: isSmall ? 12 : 20, minHeight: isSmall ? 36 : 40 }]} onPress={limpiarSeleccion}>
                                    <Text style={[styles.modalButtonText, { fontSize: responsive.fontSize.small }]}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalConfirm, { paddingVertical: isSmall ? 8 : 10, paddingHorizontal: isSmall ? 12 : 20, minHeight: isSmall ? 36 : 40 }]}
                                    onPress={() => {
                                        if (!seleccionados.length) { Alert.alert('Selecciona usuarios', 'Debes seleccionar al menos uno'); return; }
                                        setModalUsuarios(false);
                                        setSegmento('seleccionar');
                                    }}
                                >
                                    <LinearGradient colors={[COLORS.amarillo, COLORS.amarilloOscuro]} style={[styles.modalConfirmGradient, { paddingVertical: isSmall ? 8 : 10, paddingHorizontal: isSmall ? 12 : 20 }]}>
                                        <Text style={[styles.modalButtonText, { fontSize: responsive.fontSize.small, color: COLORS.negro }]}>Aplicar ({seleccionados.length})</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL DE CONFIRMACIÓN */}
            <Modal visible={modalConfirm} transparent animationType="fade" onRequestClose={() => setModalConfirm(false)}>
                <View style={styles.modalConfirmBackdrop}>
                    <View style={[styles.modalConfirmContent, { padding: isTablet ? 36 : isSmall ? 20 : 28, borderRadius: isTablet ? 30 : isSmall ? 18 : 24 }]}>
                        <Ionicons name="send" size={isTablet ? 64 : isSmall ? 44 : 54} color={COLORS.amarillo} />
                        <Text style={[styles.modalConfirmTitle, { fontSize: isTablet ? 26 : isSmall ? 18 : 22 }]}>Confirmar Envío</Text>
                        <Text style={[styles.modalConfirmText, { fontSize: isTablet ? 17 : isSmall ? 13 : 15 }]}>
                            ¿Enviar a <Text style={styles.modalHighlight}>{usuariosCount}</Text> usuarios?
                        </Text>
                        <Text style={[styles.modalConfirmSubtext, { fontSize: isTablet ? 15 : isSmall ? 11 : 13 }]}>
                            {seleccionados.length > 0 ? `Segmento: Seleccionados (${seleccionados.length})` : `Segmento: ${segmentos.find(s => s.id === segmento)?.label}`}
                        </Text>
                        <View style={[styles.modalConfirmButtons, { gap: isTablet ? 14 : isSmall ? 8 : 12 }]}>
                            <TouchableOpacity style={[styles.modalConfirmBtn, styles.modalConfirmCancel, { minHeight: isTablet ? 52 : isSmall ? 40 : 46 }]} onPress={() => setModalConfirm(false)}>
                                <Text style={[styles.modalConfirmBtnText, { fontSize: isTablet ? 17 : isSmall ? 13 : 15 }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmBtn, styles.modalConfirmSend, { minHeight: isTablet ? 52 : isSmall ? 40 : 46 }]} onPress={enviarNotificacion}>
                                <LinearGradient colors={[COLORS.amarillo, COLORS.amarilloOscuro]} style={[styles.modalConfirmBtnGradient, { paddingVertical: isTablet ? 14 : isSmall ? 10 : 12 }]}>
                                    <Text style={[styles.modalConfirmBtnText, { fontSize: isTablet ? 17 : isSmall ? 13 : 15, color: COLORS.negro }]}>Enviar</Text>
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
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.negro },
    gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    scroll: { flexGrow: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.negro },
    loadingText: { color: COLORS.grisClaro, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    title: { fontWeight: 'bold', color: COLORS.blanco, flex: 1, textAlign: 'center' },
    form: { backgroundColor: COLORS.negro + '60', borderWidth: 1, borderColor: COLORS.blanco + '10', marginBottom: 16 },
    formTitle: { fontWeight: 'bold', color: COLORS.blanco, marginBottom: 12 },
    label: { fontWeight: '600', color: COLORS.blanco, marginBottom: 6 },
    input: { backgroundColor: COLORS.negro + '40', borderWidth: 1, borderColor: COLORS.blanco + '10', color: COLORS.blanco, paddingHorizontal: 14 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    tiposContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    tipoOption: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.blanco + '10', justifyContent: 'center' },
    tipoLabel: { fontWeight: '600' },
    segmentoOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.blanco + '10', marginBottom: 6 },
    segmentoLabel: { fontWeight: '600' },
    segmentoDesc: { color: COLORS.grisClaro, opacity: 0.6, marginTop: 2 },
    seleccionadosContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.amarillo + '10', borderWidth: 1, borderColor: COLORS.amarillo + '30' },
    seleccionadosLabel: { color: COLORS.amarillo, fontWeight: '600' },
    seleccionadosEditar: { color: COLORS.amarillo, fontWeight: '500' },
    sendButton: { overflow: 'hidden' },
    sendButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendButtonText: { fontWeight: 'bold', color: COLORS.negro },
    historialTitle: { fontWeight: 'bold', color: COLORS.blanco },
    historialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historialItem: { backgroundColor: COLORS.negro + '40', borderWidth: 1, borderColor: COLORS.blanco + '5', marginBottom: 8 },
    historialItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    historialHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    historialActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    historialBotonEliminar: { padding: 4 },
    historialTitulo: { fontWeight: 'bold', color: COLORS.blanco, flex: 1 },
    historialBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: COLORS.blanco + '10' },
    historialBadgeText: { fontWeight: '600' },
    historialMensaje: { color: COLORS.grisClaro, opacity: 0.7, marginBottom: 6 },
    historialFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    historialInfo: { color: COLORS.grisClaro, opacity: 0.5 },
    historialFecha: { color: COLORS.grisClaro, opacity: 0.4 },
    historialImagenPreview: { marginTop: 8, marginBottom: 4, borderRadius: 6, overflow: 'hidden', height: 80, width: '100%' },
    historialImagen: { width: '100%', height: '100%' },
    historialUsuarioInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    historialUsuarioNombre: { color: COLORS.verdeClaro, fontWeight: '500' },
    historialUsuarioEmail: { color: COLORS.grisClaro, opacity: 0.5 },
    origenBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    origenBadgeTexto: { fontWeight: '500', fontSize: 9 },
    botonEliminarTodas: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, backgroundColor: COLORS.rojo + '15', borderRadius: 8 },
    botonEliminarTodasTexto: { color: COLORS.rojo, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: COLORS.grisClaro, opacity: 0.6, marginTop: 12, fontWeight: '500' },
    emptySubtext: { color: COLORS.grisClaro, opacity: 0.4, marginTop: 4 },
    filtrosContainer: { marginBottom: 8 },
    filtrosTitulo: { color: COLORS.grisClaro, marginBottom: 6, fontWeight: '600' },
    filtrosScroll: { gap: 8, paddingRight: 8 },
    filtroChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.negro + '40', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    filtroChipActivo: { backgroundColor: COLORS.amarillo + '20', borderColor: COLORS.amarillo },
    filtroChipTexto: { color: COLORS.grisClaro, fontSize: 11, fontWeight: '500' },
    filtroChipTextoActivo: { color: COLORS.amarillo },
    buscadorGlobalContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.negro + '40', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: COLORS.blanco + '10' },
    buscadorGlobalInput: { flex: 1, color: COLORS.blanco, padding: 0 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: COLORS.grisOscuro, width: '95%', maxWidth: 600, maxHeight: '85%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.blanco + '10', backgroundColor: COLORS.negro + '40', flexWrap: 'wrap', gap: 8 },
    modalTitle: { fontWeight: 'bold', color: COLORS.blanco },
    modalActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    modalAction: { color: COLORS.amarillo, fontWeight: '500', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: COLORS.amarillo + '15', borderRadius: 4 },
    buscadorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.negro + '30', borderRadius: 10, gap: 8 },
    buscadorInput: { flex: 1, color: COLORS.blanco, padding: 0 },
    usuarioItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, borderRadius: 10, backgroundColor: COLORS.negro + '40' },
    usuarioSelected: { backgroundColor: COLORS.amarillo + '15', borderColor: COLORS.amarillo, borderWidth: 1 },
    usuarioNombre: { fontWeight: '600', color: COLORS.blanco },
    usuarioEmail: { color: COLORS.grisClaro, opacity: 0.6 },
    usuarioStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badgeToken: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.blanco + '10', backgroundColor: COLORS.negro + '40', flexWrap: 'wrap', gap: 8 },
    modalCount: { color: COLORS.grisClaro, opacity: 0.6 },
    modalFooterButtons: { flexDirection: 'row', gap: 8 },
    modalButton: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    modalCancel: { backgroundColor: COLORS.negro + '60', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalConfirm: { overflow: 'hidden' },
    modalConfirmGradient: { alignItems: 'center', justifyContent: 'center' },
    modalButtonText: { fontWeight: 'bold', color: COLORS.blanco },
    modalEmpty: { padding: 40, alignItems: 'center' },
    modalEmptyText: { color: COLORS.grisClaro, opacity: 0.6, textAlign: 'center' },
    modalConfirmBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalConfirmContent: { backgroundColor: COLORS.grisOscuro, alignItems: 'center', borderWidth: 2, borderColor: COLORS.amarillo + '30' },
    modalConfirmTitle: { fontWeight: 'bold', color: COLORS.blanco, marginTop: 8 },
    modalConfirmText: { color: COLORS.grisClaro, textAlign: 'center', marginTop: 8 },
    modalHighlight: { color: COLORS.amarillo, fontWeight: 'bold' },
    modalConfirmSubtext: { color: COLORS.grisClaro, opacity: 0.6, textAlign: 'center', marginBottom: 16 },
    modalConfirmButtons: { flexDirection: 'row', width: '100%' },
    modalConfirmBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    modalConfirmCancel: { backgroundColor: COLORS.negro + '60', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalConfirmSend: { overflow: 'hidden' },
    modalConfirmBtnGradient: { width: '100%', alignItems: 'center', justifyContent: 'center' },
    modalConfirmBtnText: { fontWeight: 'bold', color: COLORS.blanco },
    modalUsuariosLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    imagenPreviewContainer: { position: 'relative', marginTop: 8, marginBottom: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: COLORS.negro + '40' },
    imagenPreview: { width: '100%', height: 120, borderRadius: 8 },
    botonEliminarImagen: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.negro + '80', borderRadius: 20, padding: 4 },
    botonSeleccionarImagen: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 2, borderColor: COLORS.blanco + '15', borderRadius: 12, borderStyle: 'dashed', marginTop: 4, marginBottom: 4, backgroundColor: COLORS.negro + '30', minHeight: 60 },
    botonSeleccionarImagenTexto: { color: COLORS.grisClaro, fontSize: 14, fontWeight: '500' },
    modalDetalleContent: { backgroundColor: COLORS.grisOscuro, width: '95%', maxWidth: 500, maxHeight: '90%', overflow: 'hidden' },
    modalDetalleLoading: { padding: 40, alignItems: 'center' },
    modalDetalleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.blanco + '10', backgroundColor: COLORS.negro + '40' },
    modalDetalleTitle: { fontWeight: 'bold', color: COLORS.blanco, flex: 1, textAlign: 'center' },
    modalDetalleEliminar: { padding: 4 },
    modalDetalleBody: { maxHeight: '70%' },
    modalDetalleUsuario: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.negro + '30', borderBottomWidth: 1, borderBottomColor: COLORS.blanco + '5' },
    modalDetalleUsuarioAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.amarillo + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    modalDetalleUsuarioAvatarText: { fontWeight: 'bold', color: COLORS.amarillo },
    modalDetalleUsuarioInfo: { flex: 1 },
    modalDetalleUsuarioNombre: { fontWeight: 'bold', color: COLORS.blanco },
    modalDetalleUsuarioEmail: { color: COLORS.grisClaro, opacity: 0.6 },
    modalDetalleUsuarioRol: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
    modalDetalleUsuarioRolText: { fontWeight: '500' },
    modalDetalleOrigenBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalDetalleOrigenTexto: { fontWeight: '600' },
    modalDetalleInfo: { gap: 12 },
    modalDetalleInfoRow: { gap: 2 },
    modalDetalleInfoLabel: { color: COLORS.grisClaro, opacity: 0.5, fontWeight: '500' },
    modalDetalleInfoValue: { color: COLORS.blanco, fontWeight: '500' },
    modalDetalleTipoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalDetalleTipoBadgeText: { fontWeight: '600' },
    modalDetalleEstadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalDetalleEstadoBadgeText: { fontWeight: '600' },
    modalDetalleImagen: { width: '100%', height: 150, borderRadius: 8, marginTop: 4, backgroundColor: COLORS.negro + '20' },
    modalDetalleFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.blanco + '10', backgroundColor: COLORS.negro + '40' },
    modalDetalleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    modalDetalleBtnEliminar: { backgroundColor: COLORS.rojo },
    modalDetalleBtnCerrar: { backgroundColor: COLORS.negro + '60', borderWidth: 1, borderColor: COLORS.blanco + '10' },
    modalDetalleBtnText: { fontWeight: 'bold', color: COLORS.blanco },
});