// screens/admin/PantallaGestionClientes.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Modal, TextInput, ScrollView,
    Dimensions, Animated, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, supabaseAdmin } from '../../lib/supabase'; // ✅ IMPORTAR supabaseAdmin
import { Perfil } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES
// ============================================================
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
};

const { width, height } = Dimensions.get('window');

// ✅ Configuración de roles
type RolKey = 'admin' | 'cliente' | 'repartidor';

interface RolConfig {
    label: string;
    color: string;
    icono: keyof typeof Ionicons.glyphMap;
}

const ROLES: Record<RolKey, RolConfig> = {
    admin: { label: 'Admin', color: '#FF5722', icono: 'shield-checkmark' },
    cliente: { label: 'Cliente', color: '#4CAF50', icono: 'person' },
    repartidor: { label: 'Repartidor', color: '#2196F3', icono: 'bicycle' },
};

const getRol = (rol: string): RolConfig => {
    return ROLES[rol as RolKey] || ROLES.cliente;
};

export default function PantallaGestionClientes(props: any) {
    const [clientes, setClientes] = useState<Perfil[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalKey, setModalKey] = useState(0);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

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
        const { data } = await supabase
            .from('perfiles')
            .select('*')
            .order('ultimo_acceso', { ascending: false });
        setClientes(data as Perfil[] || []);
        setCargando(false);
        setRefrescando(false);
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarClientes();
    }, []);

    // ✅ FUNCIÓN CREAR CLIENTE - CORREGIDA CON supabaseAdmin
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
            // ✅ USAR supabaseAdmin.auth.admin.createUser (tiene permisos de admin)
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // ✅ NO ENVÍA CORREO DE CONFIRMACIÓN
                user_metadata: {
                    nombre_cliente: nombre,
                    telefono: telefono || '',
                },
            });

            if (error) {
                // ✅ MANEJO DE RATE LIMIT
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
        if (puntos >= 5000) return { label: '💎 Platino', color: '#9C27B0' };
        if (puntos >= 1500) return { label: '👑 Oro', color: '#FF9800' };
        if (puntos >= 500) return { label: '🥈 Plata', color: '#78909C' };
        return { label: '🥉 Bronce', color: '#8D6E63' };
    };

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const avatarSize = isTablet ? 56 : isSmallPhone ? 40 : 48;
    const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;

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
                <View style={[
                    estilos.tarjeta,
                    {
                        padding: tarjetaPadding,
                        borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
                        borderColor: rolInfo.color + '40',
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
                            }
                        ]}>
                            <Text style={[estilos.avatarTexto, { fontSize: isTablet ? 24 : isSmallPhone ? 16 : 20 }]}>
                                {item.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>

                        <View style={estilos.info}>
                            <Text style={[estilos.nombre, { fontSize: nombreSize }]} numberOfLines={1}>
                                {item.nombre_cliente || 'Sin nombre'}
                            </Text>
                            <Text style={[estilos.email, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]} numberOfLines={1}>
                                {item.email}
                            </Text>
                            <Text style={[estilos.telefono, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                                {item.telefono || 'Sin teléfono'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => eliminarCliente(item.id, item.nombre_cliente || 'Cliente')}
                            style={estilos.botonEliminar}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.rojo} />
                        </TouchableOpacity>
                    </View>

                    <View style={estilos.detalles}>
                        <View style={estilos.detalleItem}>
                            <Text style={[estilos.detalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                ⭐ {item.puntos_acumulados || 0}
                            </Text>
                            <Text style={[estilos.detalleLabel, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10 }]}>
                                Puntos
                            </Text>
                        </View>

                        <View style={estilos.detalleItem}>
                            <Text style={[estilos.detalleValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: nivel.color }]}>
                                {nivel.label}
                            </Text>
                            <Text style={[estilos.detalleLabel, { fontSize: isTablet ? 11 : isSmallPhone ? 9 : 10 }]}>
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
                                <Text style={[estilos.botonAccionTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 9 : 11 }]}>
                                    {value.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
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
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                    👥 Clientes
                </Text>
                <TouchableOpacity
                    style={[estilos.botonAgregar, { paddingHorizontal: isTablet ? 18 : isSmallPhone ? 12 : 16, paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10 }]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={isTablet ? 26 : isSmallPhone ? 18 : 22} color={COLORS.negro} />
                </TouchableOpacity>
            </View>

            <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal }]}>
                <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
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
                        <Ionicons name="people-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
                        <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                            No hay clientes registrados
                        </Text>
                        <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            Los clientes aparecerán aquí cuando se registren
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={manejarRefresh}
                        tintColor={COLORS.amarillo}
                        colors={[COLORS.amarillo]}
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
                        colors={[COLORS.verde, COLORS.negro]}
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
                            borderColor: COLORS.amarillo + '30',
                        }
                    ]}>
                        <View style={estilos.modalHeader}>
                            <LinearGradient
                                colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                style={estilos.modalHeaderGradiente}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="person-add" size={isTablet ? 32 : isSmallPhone ? 24 : 28} color={COLORS.negro} />
                                <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                                    Nuevo Cliente
                                </Text>
                            </LinearGradient>
                        </View>

                        <ScrollView
                            style={estilos.modalScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                <Ionicons name="person-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Nombre *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Nombre completo"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="mail-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Email *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="cliente@ejemplo.com"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="call-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Teléfono
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="1134567890"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                keyboardType="phone-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="lock-closed-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Contraseña *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                secureTextEntry
                                selectionColor={COLORS.amarillo}
                            />
                        </ScrollView>

                        <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalCancelar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                                onPress={cerrarModal}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.blanco} />
                                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalGuardar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                                onPress={crearCliente}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                    style={estilos.modalGuardarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="person-add" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                                    <Text style={[estilos.modalGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                        Crear Cliente
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '10',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    botonAgregar: {
        backgroundColor: COLORS.amarillo,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.amarillo,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    contadorContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '5',
    },
    contador: {
        color: COLORS.grisClaro,
        fontWeight: '500',
        opacity: 0.7,
    },
    lista: {
        flexGrow: 1,
    },
    tarjeta: {
        backgroundColor: COLORS.negro + '60',
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
        borderColor: COLORS.amarillo + '30',
    },
    avatarTexto: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    info: {
        flex: 1,
    },
    nombre: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    email: {
        color: COLORS.grisClaro,
        marginTop: 2,
        opacity: 0.7,
    },
    telefono: {
        color: COLORS.grisClaro,
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
        borderColor: COLORS.blanco + '8',
        marginBottom: 10,
    },
    detalleItem: {
        alignItems: 'center',
    },
    detalleValor: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    detalleLabel: {
        color: COLORS.grisClaro,
        marginTop: 2,
        opacity: 0.6,
    },
    rolBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
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
        color: COLORS.blanco,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    vacioContenedor: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    vacio: {
        color: COLORS.blanco,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        color: COLORS.grisClaro,
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
        borderRadius: 28,
    },
    modal: {
        backgroundColor: 'transparent',
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
        color: COLORS.negro,
    },
    modalScroll: {
        maxHeight: '70%',
        paddingHorizontal: 4,
    },
    label: {
        fontWeight: '600',
        color: COLORS.blanco,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: COLORS.negro + '40',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        color: COLORS.blanco,
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
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    modalCancelarTexto: {
        color: COLORS.blanco,
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
        color: COLORS.negro,
        fontWeight: 'bold',
    },
});