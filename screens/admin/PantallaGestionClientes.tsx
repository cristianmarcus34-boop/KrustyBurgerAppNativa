// screens/admin/PantallaGestionClientes.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Modal, TextInput, ScrollView,
    Dimensions, Animated, RefreshControl, ActivityIndicator,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { Perfil } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        card: '#FFFFFF',
        cardShadow: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.06)',
        borderLight: 'rgba(0,0,0,0.04)',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        accent: '#E53935',
        accentLight: '#FF6B6B',
        accentSecondary: '#F5C518',
        accentSecondaryLight: '#FFE135',
        gradientStart: '#E53935',
        gradientEnd: '#F5C518',
        verde: '#43A047',
        verdeClaro: '#66BB6A',
        rosa: '#EC407A',
        azul: '#1A237E',
        azulClaro: '#3949AB',
        platino: '#78909C',
        oro: '#F9A825',
        plata: '#BDBDBD',
        bronce: '#A1887F',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 999,
    },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isSmallPhone = width < 375;

    const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
        if (isDesktop || isTablet) return valores.tablet;
        if (isSmallPhone) return valores.small;
        return valores.normal;
    }, [isDesktop, isTablet, isSmallPhone]);

    return { isTablet, isDesktop, isSmallPhone, width, height, getValor };
};

// ✅ Configuración de roles
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

const getRol = (rol: string): RolConfig => {
    return ROLES[rol as RolKey] || ROLES.cliente;
};

// ✅ INTERFAZ PARA DETALLE DEL CLIENTE
interface DetalleCliente extends Perfil {
    total_pedidos: number;
    total_gastado: number;
    ultimo_pedido: string | null;
    direccion_completa: string;
    fecha_registro: string;
}

// ✅ INTERFAZ PARA PEDIDO CON ITEMS
interface PedidoConItems {
    id: number;
    creado_en: string;
    estado: string;
    total: number;
    items_json: any;
    tipo_entrega: string;
    metodo_pago: string;
}

export default function PantallaGestionClientes(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();

    const [clientes, setClientes] = useState<Perfil[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalKey, setModalKey] = useState(0);

    // ✅ Estado para detalle del cliente
    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<DetalleCliente | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [historialPedidos, setHistorialPedidos] = useState<PedidoConItems[]>([]);
    const [historialCanjes, setHistorialCanjes] = useState<any[]>([]);
    const [notificaciones, setNotificaciones] = useState<any[]>([]);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    useEffect(() => {
        cargarClientes();
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
    }, []);

    const cargarClientes = async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .order('ultimo_acceso', { ascending: false });

            if (error) throw error;
            setClientes(data as Perfil[] || []);
        } catch (error) {
            console.error('Error cargando clientes:', error);
            Alert.alert('Error', 'No se pudieron cargar los clientes');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarClientes();
    }, []);

    // ✅ FUNCIÓN PARA CARGAR DETALLE COMPLETO DEL CLIENTE
    const cargarDetalleCliente = async (cliente: Perfil) => {
        setCargandoDetalle(true);
        setModalDetalleVisible(true);
        setHistorialPedidos([]);
        setHistorialCanjes([]);
        setNotificaciones([]);

        try {
            // 1. Obtener dirección completa
            const partesDireccion = [];
            if (cliente.direccion_calle) partesDireccion.push(cliente.direccion_calle);
            if (cliente.direccion_numero) partesDireccion.push(cliente.direccion_numero);
            if (cliente.direccion_piso) partesDireccion.push(`Piso ${cliente.direccion_piso}`);
            if (cliente.direccion_departamento) partesDireccion.push(`Depto ${cliente.direccion_departamento}`);
            if (cliente.direccion_barrio) partesDireccion.push(cliente.direccion_barrio);
            if (cliente.direccion_ciudad) partesDireccion.push(cliente.direccion_ciudad);
            if (cliente.direccion_codigo_postal) partesDireccion.push(`CP ${cliente.direccion_codigo_postal}`);
            const direccionCompleta = partesDireccion.length > 0 ? partesDireccion.join(', ') : 'No especificada';

            // 2. Obtener pedidos del cliente
            const { data: pedidosData, error: pedidosError } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id_de_usuario', cliente.id)
                .order('creado_en', { ascending: false });

            if (!pedidosError && pedidosData) {
                setHistorialPedidos(pedidosData as PedidoConItems[]);
            }

            // 3. Calcular total de pedidos y gastado
            const totalPedidos = pedidosData?.length || 0;
            let totalGastado = 0;
            if (pedidosData) {
                totalGastado = pedidosData.reduce((sum, p) => sum + (p.total || 0), 0);
            }

            // 4. Obtener último pedido
            const ultimoPedido = pedidosData && pedidosData.length > 0 ? pedidosData[0].creado_en : null;

            // 5. Obtener historial de canjes
            const { data: canjesData, error: canjesError } = await supabase
                .from('canjes')
                .select(`
                    *,
                    recompensas:recompensa_id (
                        nombre,
                        descripcion,
                        puntos_necesarios,
                        tipo
                    )
                `)
                .eq('usuario_id', cliente.id)
                .order('created_at', { ascending: false });

            if (!canjesError && canjesData) {
                setHistorialCanjes(canjesData);
            }

            // 6. Obtener notificaciones del usuario
            const { data: notificacionesData, error: notifError } = await supabase
                .from('notificaciones_usuarios')
                .select('*')
                .eq('usuario_id', cliente.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!notifError && notificacionesData) {
                setNotificaciones(notificacionesData);
            }

            // 7. Actualizar cliente seleccionado con todos los datos
            setClienteSeleccionado({
                ...cliente,
                direccion_completa: direccionCompleta,
                total_pedidos: totalPedidos,
                total_gastado: totalGastado,
                ultimo_pedido: ultimoPedido,
                fecha_registro: cliente.created_at || cliente.ultimo_acceso || '',
            });

        } catch (error) {
            console.error('Error cargando detalle:', error);
            Alert.alert('Error', 'No se pudo cargar el detalle del cliente');
        } finally {
            setCargandoDetalle(false);
        }
    };

    // ✅ FUNCIÓN CREAR CLIENTE
    const crearCliente = async () => {
        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Completa nombre, email y contraseña');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    nombre_cliente: nombre,
                    telefono: telefono || '',
                },
            });

            if (error) {
                if (error.message && error.message.includes('rate limit')) {
                    Alert.alert(
                        '⏳ Límite de intentos',
                        'Has excedido el límite de envío de emails. Espera 1 hora para continuar.'
                    );
                    return;
                }
                Alert.alert('Error', error.message);
                return;
            }

            if (data?.user) {
                const { error: errorPerfil } = await supabase.from('perfiles').insert({
                    id: data.user.id,
                    nombre_cliente: nombre,
                    email: email,
                    telefono: telefono || null,
                    rol: 'cliente',
                    puntos_acumulados: 100,
                    ultimo_acceso: new Date().toISOString(),
                });

                if (errorPerfil) {
                    console.error('Error creando perfil:', errorPerfil);
                    Alert.alert('Error', 'El usuario se creó pero hubo un problema con el perfil.');
                    return;
                }
            }

            setModalVisible(false);
            setNombre('');
            setEmail('');
            setTelefono('');
            setPassword('');
            cargarClientes();
            Alert.alert('✅ Éxito', 'Cliente creado correctamente');

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Ocurrió un error al crear el cliente');
        }
    };

    const cambiarRol = async (id: string, nuevoRol: string) => {
        const rolInfo = getRol(nuevoRol);
        Alert.alert(
            'Cambiar rol',
            `¿Estás seguro de cambiar el rol a "${rolInfo.label}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cambiar',
                    onPress: async () => {
                        await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id);
                        cargarClientes();
                        Alert.alert('Éxito', 'Rol actualizado correctamente');
                    }
                }
            ]
        );
    };

    const eliminarCliente = (id: string, nombre: string) => {
        Alert.alert(
            'Eliminar cliente',
            `¿Estás seguro de eliminar a "${nombre}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.from('perfiles').delete().eq('id', id);
                        cargarClientes();
                        Alert.alert('Éxito', 'Cliente eliminado correctamente');
                    }
                }
            ]
        );
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setNombre('');
            setEmail('');
            setTelefono('');
            setPassword('');
        }, 300);
    };

    const rolColor = (rol: string) => getRol(rol).color;
    const rolLabel = (rol: string) => getRol(rol).label;
    const rolIcono = (rol: string) => getRol(rol).icono;

    const nivelCliente = (puntos: number) => {
        if (puntos >= 5000) return { label: '💎 Platino', color: DESIGN.colors.platino };
        if (puntos >= 1500) return { label: '👑 Oro', color: DESIGN.colors.oro };
        if (puntos >= 500) return { label: '🥈 Plata', color: DESIGN.colors.plata };
        return { label: '🥉 Bronce', color: DESIGN.colors.bronce };
    };

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const avatarSize = isTablet ? 56 : isSmallPhone ? 40 : 48;
    const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;

    const formatFecha = (fecha: string) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ RENDER CLIENTE
    const renderCliente = ({ item, index }: { item: Perfil; index: number }) => {
        const delay = index * 100;
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });
        const itemSlide = slideUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 * (index + 1), 0],
        });
        const nivel = nivelCliente(item.puntos_acumulados || 0);
        const rolInfo = getRol(item.rol || 'cliente');

        return (
            <Animated.View
                style={{
                    opacity: itemFade,
                    transform: [{ translateY: itemSlide }],
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => cargarDetalleCliente(item)}
                >
                    <View style={[
                        estilos.tarjeta,
                        {
                            padding: tarjetaPadding,
                            borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
                            borderColor: rolInfo.color + '40',
                            backgroundColor: DESIGN.colors.surface,
                            shadowColor: DESIGN.colors.cardShadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 8,
                            elevation: 3,
                        }
                    ]}>
                        <View style={estilos.fila}>
                            <View style={[
                                estilos.avatar,
                                {
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarSize / 2,
                                    backgroundColor: rolInfo.color + '20',
                                    borderColor: rolInfo.color + '30',
                                }
                            ]}>
                                <Text style={[estilos.avatarTexto, { fontSize: isTablet ? 24 : isSmallPhone ? 16 : 20 }]}>
                                    {item.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                            </View>

                            <View style={estilos.info}>
                                <Text style={[estilos.nombre, { fontSize: nombreSize, color: DESIGN.colors.text }]} numberOfLines={1}>
                                    {item.nombre_cliente || 'Sin nombre'}
                                </Text>
                                <Text style={[estilos.email, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]} numberOfLines={1}>
                                    {item.email}
                                </Text>
                                <Text style={[estilos.telefono, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                    {item.telefono || 'Sin teléfono'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => eliminarCliente(item.id, item.nombre_cliente || 'Cliente')}
                                style={estilos.botonEliminar}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.accent} />
                            </TouchableOpacity>
                        </View>

                        <View style={[estilos.detalles, { borderColor: DESIGN.colors.border }]}>
                            <View style={estilos.detalleItem}>
                                <Text style={[estilos.detalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                                    ⭐ {item.puntos_acumulados || 0}
                                </Text>
                                <Text style={[estilos.detalleLabel, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10, color: DESIGN.colors.textSecondary }]}>
                                    Puntos
                                </Text>
                            </View>

                            <View style={estilos.detalleItem}>
                                <Text style={[estilos.detalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: nivel.color }]}>
                                    {nivel.label}
                                </Text>
                                <Text style={[estilos.detalleLabel, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10, color: DESIGN.colors.textSecondary }]}>
                                    Nivel
                                </Text>
                            </View>

                            <View style={[
                                estilos.rolBadge,
                                {
                                    backgroundColor: rolInfo.color + '20',
                                    paddingHorizontal: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                    paddingVertical: isTablet ? 6 : isSmallPhone ? 4 : 5,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                    borderColor: rolInfo.color + '30',
                                    borderWidth: 1,
                                }
                            ]}>
                                <Ionicons name={rolInfo.icono} size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={rolInfo.color} />
                                <Text style={[
                                    estilos.rolTexto,
                                    {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11,
                                        color: rolInfo.color,
                                    }
                                ]}>
                                    {rolInfo.label}
                                </Text>
                            </View>
                        </View>

                        <View style={[estilos.acciones, { gap: isTablet ? 10 : isSmallPhone ? 6 : 8 }]}>
                            {Object.entries(ROLES).map(([key, value]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        estilos.botonAccion,
                                        {
                                            backgroundColor: value.color,
                                            paddingVertical: isTablet ? 8 : isSmallPhone ? 5 : 6,
                                            borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                            opacity: item.rol === key ? 0.5 : 1,
                                        }
                                    ]}
                                    onPress={() => cambiarRol(item.id, key)}
                                    disabled={item.rol === key}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[estilos.botonAccionTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 9 : 11, color: DESIGN.colors.surface }]}>
                                        {value.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={[estilos.verDetalle, { borderTopColor: DESIGN.colors.border }]}>
                            <Text style={[estilos.verDetalleTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                👆 Toca para ver todos los detalles
                            </Text>
                            <Ionicons name="chevron-forward" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.textTertiary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[
                estilos.header,
                {
                    paddingTop: insets.top + (isTablet ? 20 : 10),
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
                    👥 Clientes
                </Text>
                <TouchableOpacity
                    style={[estilos.botonAgregar, {
                        paddingHorizontal: isTablet ? 18 : isSmallPhone ? 12 : 16,
                        paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10,
                        backgroundColor: DESIGN.colors.accentSecondary,
                    }]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={isTablet ? 26 : isSmallPhone ? 18 : 22} color={DESIGN.colors.text} />
                </TouchableOpacity>
            </View>

            <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal, borderColor: DESIGN.colors.border }]}>
                <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                    {clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}
                </Text>
            </View>

            <FlatList
                data={clientes}
                keyExtractor={item => item.id}
                renderItem={renderCliente}
                contentContainerStyle={[
                    estilos.lista,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 150,
                        paddingTop: isTablet ? 8 : 4,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={estilos.vacioContenedor}>
                        <Ionicons name="people-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.textTertiary + '30'} />
                        <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16, color: DESIGN.colors.text }]}>
                            No hay clientes registrados
                        </Text>
                        <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                            Los clientes aparecerán aquí cuando se registren
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={manejarRefresh}
                        tintColor={DESIGN.colors.accentSecondary}
                        colors={[DESIGN.colors.accentSecondary]}
                    />
                }
            />

            {/* ✅ MODAL - NUEVO CLIENTE */}
            <Modal
                key={modalKey}
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={estilos.modalFondo}>
                    <LinearGradient
                        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                        style={estilos.modalGradiente}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <View style={[
                        estilos.modal,
                        {
                            padding: isTablet ? 32 : isSmallPhone ? 20 : 24,
                            borderRadius: isTablet ? 28 : 24,
                            width: isTablet ? '70%' : '92%',
                            maxHeight: isTablet ? '80%' : '85%',
                            borderColor: DESIGN.colors.accentSecondary + '30',
                            backgroundColor: DESIGN.colors.surface,
                        }
                    ]}>
                        <View style={estilos.modalHeader}>
                            <LinearGradient
                                colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                                style={estilos.modalHeaderGradiente}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="person-add" size={isTablet ? 32 : isSmallPhone ? 24 : 28} color={DESIGN.colors.text} />
                                <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22, color: DESIGN.colors.text }]}>
                                    Nuevo Cliente
                                </Text>
                            </LinearGradient>
                        </View>

                        <ScrollView
                            style={estilos.modalScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                                <Ionicons name="person-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accentSecondary} /> Nombre *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text, borderColor: DESIGN.colors.border }]}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Nombre completo"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                selectionColor={DESIGN.colors.accentSecondary}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text, marginTop: 14 }]}>
                                <Ionicons name="mail-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accentSecondary} /> Email *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text, borderColor: DESIGN.colors.border }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="cliente@ejemplo.com"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                selectionColor={DESIGN.colors.accentSecondary}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text, marginTop: 14 }]}>
                                <Ionicons name="call-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accentSecondary} /> Teléfono
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text, borderColor: DESIGN.colors.border }]}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="1134567890"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="phone-pad"
                                selectionColor={DESIGN.colors.accentSecondary}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text, marginTop: 14 }]}>
                                <Ionicons name="lock-closed-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accentSecondary} /> Contraseña *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text, borderColor: DESIGN.colors.border }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                secureTextEntry
                                selectionColor={DESIGN.colors.accentSecondary}
                            />
                        </ScrollView>

                        <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalCancelar, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    backgroundColor: DESIGN.colors.surfaceHover,
                                    borderColor: DESIGN.colors.border,
                                    borderWidth: 1,
                                }]}
                                onPress={cerrarModal}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.textSecondary} />
                                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.textSecondary }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalGuardar, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    overflow: 'hidden',
                                }]}
                                onPress={crearCliente}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                                    style={estilos.modalGuardarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="person-add" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.text} />
                                    <Text style={[estilos.modalGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                        Crear Cliente
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL DE DETALLE COMPLETO DEL CLIENTE */}
            <Modal
                visible={modalDetalleVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalDetalleVisible(false);
                    setClienteSeleccionado(null);
                }}
            >
                <View style={estilos.modalFondo}>
                    <LinearGradient
                        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                        style={estilos.modalGradiente}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <View style={[
                        estilos.modalDetalle,
                        {
                            padding: isTablet ? 28 : isSmallPhone ? 16 : 20,
                            borderRadius: isTablet ? 28 : 24,
                            width: isTablet ? '80%' : '95%',
                            maxHeight: isTablet ? '85%' : '90%',
                            borderColor: DESIGN.colors.accentSecondary + '30',
                            backgroundColor: DESIGN.colors.surface,
                        }
                    ]}>
                        {cargandoDetalle ? (
                            <View style={estilos.cargandoDetalle}>
                                <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
                                <Text style={[estilos.cargandoDetalleTexto, { color: DESIGN.colors.textSecondary }]}>
                                    Cargando datos del cliente...
                                </Text>
                            </View>
                        ) : clienteSeleccionado ? (
                            <>
                                {/* HEADER */}
                                <View style={estilos.modalDetalleHeader}>
                                    <View style={estilos.modalDetalleHeaderLeft}>
                                        <View style={[
                                            estilos.modalDetalleAvatar,
                                            {
                                                width: isTablet ? 56 : 48,
                                                height: isTablet ? 56 : 48,
                                                borderRadius: isTablet ? 28 : 24,
                                                backgroundColor: (clienteSeleccionado.rol ? getRol(clienteSeleccionado.rol).color : DESIGN.colors.verde) + '20',
                                                borderColor: (clienteSeleccionado.rol ? getRol(clienteSeleccionado.rol).color : DESIGN.colors.verde) + '30',
                                                borderWidth: 2,
                                            }
                                        ]}>
                                            <Text style={[estilos.modalDetalleAvatarTexto, { fontSize: isTablet ? 24 : isSmallPhone ? 18 : 20 }]}>
                                                {clienteSeleccionado.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={estilos.modalDetalleHeaderInfo}>
                                            <Text style={[estilos.modalDetalleNombre, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.text }]}>
                                                {clienteSeleccionado.nombre_cliente}
                                            </Text>
                                            <Text style={[estilos.modalDetalleEmail, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                                {clienteSeleccionado.email}
                                            </Text>
                                            <View style={estilos.modalDetalleRolBadge}>
                                                <Ionicons
                                                    name={(clienteSeleccionado.rol ? getRol(clienteSeleccionado.rol).icono : 'person') as any}
                                                    size={isTablet ? 14 : 12}
                                                    color={clienteSeleccionado.rol ? getRol(clienteSeleccionado.rol).color : DESIGN.colors.verde}
                                                />
                                                <Text style={[
                                                    estilos.modalDetalleRolText,
                                                    {
                                                        fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                                        color: clienteSeleccionado.rol ? getRol(clienteSeleccionado.rol).color : DESIGN.colors.verde,
                                                    }
                                                ]}>
                                                    {clienteSeleccionado.rol ? rolLabel(clienteSeleccionado.rol) : 'Cliente'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setModalDetalleVisible(false);
                                            setClienteSeleccionado(null);
                                        }}
                                        style={estilos.modalDetalleCerrar}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={isTablet ? 28 : 24} color={DESIGN.colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={estilos.modalDetalleScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 10 }}
                                >
                                    {/* 📊 ESTADÍSTICAS RÁPIDAS */}
                                    <View style={[estilos.modalDetalleStats, { gap: isTablet ? 12 : 8 }]}>
                                        <View style={[estilos.modalDetalleStatItem, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}>
                                            <Text style={[estilos.modalDetalleStatValor, { fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20, color: DESIGN.colors.accentSecondary }]}>
                                                {clienteSeleccionado.total_pedidos}
                                            </Text>
                                            <Text style={[estilos.modalDetalleStatLabel, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                                Pedidos
                                            </Text>
                                        </View>
                                        <View style={[estilos.modalDetalleStatItem, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}>
                                            <Text style={[estilos.modalDetalleStatValor, { fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20, color: DESIGN.colors.verde }]}>
                                                ${clienteSeleccionado.total_gastado?.toFixed(2) || '0'}
                                            </Text>
                                            <Text style={[estilos.modalDetalleStatLabel, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                                Gastado
                                            </Text>
                                        </View>
                                        <View style={[estilos.modalDetalleStatItem, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}>
                                            <Text style={[estilos.modalDetalleStatValor, { fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20, color: DESIGN.colors.accent }]}>
                                                ⭐ {clienteSeleccionado.puntos_acumulados || 0}
                                            </Text>
                                            <Text style={[estilos.modalDetalleStatLabel, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                                Puntos
                                            </Text>
                                        </View>
                                    </View>

                                    {/* 👤 DATOS PERSONALES */}
                                    <View style={[estilos.modalDetalleSeccion, { borderColor: DESIGN.colors.border }]}>
                                        <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.accentSecondary }]}>
                                            👤 Datos Personales
                                        </Text>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="call-outline" size={isTablet ? 18 : 16} color={DESIGN.colors.textSecondary} />
                                            <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                                {clienteSeleccionado.telefono || 'No especificado'}
                                            </Text>
                                        </View>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="calendar-outline" size={isTablet ? 18 : 16} color={DESIGN.colors.textSecondary} />
                                            <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                                Registro: {formatFecha(clienteSeleccionado.fecha_registro)}
                                            </Text>
                                        </View>
                                        <View style={estilos.modalDetalleFila}>
                                            <Ionicons name="time-outline" size={isTablet ? 18 : 16} color={DESIGN.colors.textSecondary} />
                                            <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                                Último acceso: {formatFecha(clienteSeleccionado.ultimo_acceso)}
                                            </Text>
                                        </View>
                                        {clienteSeleccionado.ultimo_pedido && (
                                            <View style={estilos.modalDetalleFila}>
                                                <Ionicons name="receipt-outline" size={isTablet ? 18 : 16} color={DESIGN.colors.textSecondary} />
                                                <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                                    Último pedido: {formatFecha(clienteSeleccionado.ultimo_pedido)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* 📍 DIRECCIÓN */}
                                    <View style={[estilos.modalDetalleSeccion, { borderColor: DESIGN.colors.border }]}>
                                        <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.accentSecondary }]}>
                                            📍 Dirección
                                        </Text>
                                        <Text style={[estilos.modalDetalleDireccion, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                            {clienteSeleccionado.direccion_completa}
                                        </Text>
                                        {clienteSeleccionado.direccion_calle && (
                                            <View style={estilos.modalDetalleFila}>
                                                <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                                                    Preferencias: {clienteSeleccionado.preferencias_comida || 'No especificadas'}
                                                </Text>
                                            </View>
                                        )}
                                        {clienteSeleccionado.metodo_pago && (
                                            <View style={estilos.modalDetalleFila}>
                                                <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                                                    Pago preferido: {clienteSeleccionado.metodo_pago}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* 📦 HISTORIAL DE PEDIDOS */}
                                    <View style={[estilos.modalDetalleSeccion, { borderColor: DESIGN.colors.border }]}>
                                        <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.accentSecondary }]}>
                                            📦 Pedidos ({historialPedidos.length})
                                        </Text>
                                        {historialPedidos.length > 0 ? (
                                            historialPedidos.slice(0, 5).map((pedido, idx) => (
                                                <View key={idx} style={[estilos.modalDetallePedido, { borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover }]}>
                                                    <View style={estilos.modalDetallePedidoHeader}>
                                                        <Text style={[estilos.modalDetallePedidoId, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                                                            Pedido #{pedido.id}
                                                        </Text>
                                                        <View style={[
                                                            estilos.modalDetallePedidoEstado,
                                                            {
                                                                backgroundColor:
                                                                    pedido.estado === 'entregado' ? DESIGN.colors.verde + '20' :
                                                                        pedido.estado === 'cancelado' ? DESIGN.colors.accent + '20' :
                                                                            DESIGN.colors.accentSecondary + '20',
                                                                paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                                                paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                                                borderRadius: isTablet ? 8 : isSmallPhone ? 4 : 6,
                                                            }
                                                        ]}>
                                                            <Text style={[
                                                                estilos.modalDetallePedidoEstadoText,
                                                                {
                                                                    fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10,
                                                                    color:
                                                                        pedido.estado === 'entregado' ? DESIGN.colors.verde :
                                                                            pedido.estado === 'cancelado' ? DESIGN.colors.accent :
                                                                                DESIGN.colors.accentSecondary,
                                                                }
                                                            ]}>
                                                                {pedido.estado}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={estilos.modalDetallePedidoInfo}>
                                                        <Text style={[estilos.modalDetallePedidoFecha, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                                            {formatFecha(pedido.creado_en)}
                                                        </Text>
                                                        <Text style={[estilos.modalDetallePedidoTotal, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.accentSecondary }]}>
                                                            ${pedido.total?.toFixed(2) || '0'}
                                                        </Text>
                                                    </View>
                                                    <Text style={[estilos.modalDetallePedidoMeta, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10, color: DESIGN.colors.textTertiary }]}>
                                                        {pedido.tipo_entrega === 'retiro' ? '📦 Retiro' : '🚚 Domicilio'} · {pedido.metodo_pago || 'Efectivo'}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={[estilos.modalDetalleVacio, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                                No hay pedidos registrados
                                            </Text>
                                        )}
                                    </View>

                                    {/* 🎁 HISTORIAL DE CANJES */}
                                    <View style={[estilos.modalDetalleSeccion, { borderColor: DESIGN.colors.border }]}>
                                        <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.accentSecondary }]}>
                                            🎁 Canjes ({historialCanjes.length})
                                        </Text>
                                        {historialCanjes.length > 0 ? (
                                            historialCanjes.slice(0, 5).map((canje, idx) => (
                                                <View key={idx} style={[estilos.modalDetalleCanje, { borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover }]}>
                                                    <View style={estilos.modalDetalleCanjeHeader}>
                                                        <Text style={[estilos.modalDetalleCanjeRecompensa, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                                                            {canje.recompensas?.nombre || 'Recompensa'}
                                                        </Text>
                                                        <Text style={[estilos.modalDetalleCanjePuntos, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DESIGN.colors.accent }]}>
                                                            -{canje.puntos_usados} pts
                                                        </Text>
                                                    </View>
                                                    <Text style={[estilos.modalDetalleCanjeFecha, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10, color: DESIGN.colors.textSecondary }]}>
                                                        {formatFecha(canje.created_at)}
                                                    </Text>
                                                    {canje.usado_en_pedido && (
                                                        <Text style={[estilos.modalDetalleCanjeUsado, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10, color: DESIGN.colors.verde }]}>
                                                            ✅ Usado en pedido
                                                        </Text>
                                                    )}
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={[estilos.modalDetalleVacio, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                                No hay canjes registrados
                                            </Text>
                                        )}
                                    </View>

                                    {/* 🔔 NOTIFICACIONES RECIENTES */}
                                    <View style={[estilos.modalDetalleSeccion, { borderColor: DESIGN.colors.border }]}>
                                        <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.accentSecondary }]}>
                                            🔔 Notificaciones ({notificaciones.length})
                                        </Text>
                                        {notificaciones.length > 0 ? (
                                            notificaciones.slice(0, 3).map((notif, idx) => (
                                                <View key={idx} style={[estilos.modalDetalleNotif, { borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surfaceHover }]}>
                                                    <Text style={[estilos.modalDetalleNotifTitulo, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DESIGN.colors.text }]}>
                                                        {notif.titulo}
                                                    </Text>
                                                    <Text style={[estilos.modalDetalleNotifMensaje, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                                        {notif.mensaje}
                                                    </Text>
                                                    <Text style={[estilos.modalDetalleNotifFecha, { fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9, color: DESIGN.colors.textTertiary }]}>
                                                        {formatFecha(notif.created_at)}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={[estilos.modalDetalleVacio, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                                No hay notificaciones
                                            </Text>
                                        )}
                                    </View>
                                </ScrollView>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
    },
    fondoGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.surface + '10',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    botonAgregar: {
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: DESIGN.colors.accentSecondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    contadorContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    contador: {
        fontWeight: '500',
        opacity: 0.7,
    },
    lista: {
        flexGrow: 1,
    },
    tarjeta: {
        marginBottom: 10,
        borderWidth: 1,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
    },
    avatarTexto: {
        fontWeight: 'bold',
        color: DESIGN.colors.accentSecondary,
    },
    info: {
        flex: 1,
    },
    nombre: {
        fontWeight: 'bold',
    },
    email: {
        marginTop: 2,
        opacity: 0.7,
    },
    telefono: {
        marginTop: 2,
        opacity: 0.5,
    },
    botonEliminar: {
        padding: 4,
    },
    detalles: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    detalleItem: {
        alignItems: 'center',
    },
    detalleValor: {
        fontWeight: 'bold',
    },
    detalleLabel: {
        marginTop: 2,
        opacity: 0.6,
    },
    rolBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'center',
        borderWidth: 1,
    },
    rolTexto: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    acciones: {
        flexDirection: 'row',
    },
    botonAccion: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonAccionTexto: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    verDetalle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        gap: 4,
    },
    verDetalleTexto: {
        fontWeight: '500',
        opacity: 0.6,
    },
    vacioContenedor: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    vacio: {
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modal: {
        borderWidth: 2,
        overflow: 'hidden',
    },
    modalHeader: {
        marginBottom: 16,
    },
    modalHeaderGradiente: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    modalTitulo: {
        fontWeight: 'bold',
    },
    modalScroll: {
        maxHeight: '70%',
        paddingHorizontal: 4,
    },
    label: {
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
    },
    modalBotones: {
        flexDirection: 'row',
        marginTop: 8,
    },
    modalBoton: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        overflow: 'hidden',
    },
    modalCancelar: {
        borderWidth: 1,
    },
    modalCancelarTexto: {
        fontWeight: '600',
    },
    modalGuardar: {
        overflow: 'hidden',
    },
    modalGuardarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: '100%',
        height: '100%',
    },
    modalGuardarTexto: {
        fontWeight: 'bold',
    },
    // ✅ MODAL DE DETALLE
    modalDetalle: {
        borderWidth: 2,
        overflow: 'hidden',
    },
    modalDetalleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
        paddingBottom: 12,
        marginBottom: 16,
    },
    modalDetalleHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalDetalleAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    modalDetalleAvatarTexto: {
        fontWeight: 'bold',
        color: DESIGN.colors.accentSecondary,
    },
    modalDetalleHeaderInfo: {
        flex: 1,
    },
    modalDetalleNombre: {
        fontWeight: 'bold',
    },
    modalDetalleEmail: {
        marginTop: 2,
        opacity: 0.7,
    },
    modalDetalleRolBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    modalDetalleRolText: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    modalDetalleCerrar: {
        padding: 4,
    },
    modalDetalleScroll: {
        maxHeight: '70%',
    },
    cargandoDetalle: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    cargandoDetalleTexto: {
        fontWeight: '500',
        opacity: 0.7,
    },
    modalDetalleStats: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    modalDetalleStatItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    modalDetalleStatValor: {
        fontWeight: 'bold',
    },
    modalDetalleStatLabel: {
        marginTop: 2,
        opacity: 0.6,
    },
    modalDetalleSeccion: {
        marginBottom: 16,
        borderTopWidth: 1,
        paddingTop: 12,
    },
    modalDetalleSeccionTitulo: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalDetalleFila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    modalDetalleValor: {
        fontWeight: '500',
        flex: 1,
    },
    modalDetalleDireccion: {
        fontWeight: '500',
        marginBottom: 4,
    },
    modalDetalleVacio: {
        textAlign: 'center',
        paddingVertical: 8,
        opacity: 0.6,
    },
    modalDetallePedido: {
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
    },
    modalDetallePedidoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDetallePedidoId: {
        fontWeight: 'bold',
    },
    modalDetallePedidoEstado: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    modalDetallePedidoEstadoText: {
        fontWeight: '600',
    },
    modalDetallePedidoInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    modalDetallePedidoFecha: {
        opacity: 0.6,
    },
    modalDetallePedidoTotal: {
        fontWeight: 'bold',
    },
    modalDetallePedidoMeta: {
        marginTop: 2,
        opacity: 0.5,
    },
    modalDetalleCanje: {
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
    },
    modalDetalleCanjeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDetalleCanjeRecompensa: {
        fontWeight: 'bold',
    },
    modalDetalleCanjePuntos: {
        fontWeight: 'bold',
    },
    modalDetalleCanjeFecha: {
        opacity: 0.6,
    },
    modalDetalleCanjeUsado: {
        fontWeight: '500',
    },
    modalDetalleNotif: {
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        borderWidth: 1,
    },
    modalDetalleNotifTitulo: {
        fontWeight: 'bold',
    },
    modalDetalleNotifMensaje: {
        opacity: 0.7,
        marginTop: 2,
    },
    modalDetalleNotifFecha: {
        opacity: 0.4,
        marginTop: 2,
    },
});