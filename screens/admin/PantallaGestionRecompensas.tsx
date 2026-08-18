// screens/admin/PantallaGestionRecompensas.tsx - CON VALIDACIÓN DE CANJES
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Dimensions,
    Animated,
    RefreshControl,
    Switch,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

// ============================================================
// 📋 INTERFAZ
// ============================================================
interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
    imagen?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// 📋 CONFIGURACIÓN DE TIPOS
// ============================================================
const TIPOS_RECOMPENSA = [
    { id: 'DESCUENTO', label: '💰 Descuento', icon: 'pricetag-outline', color: Colores.burnsDorado },
    { id: 'PRODUCTO_GRATIS', label: '🍔 Producto Gratis', icon: 'restaurant-outline', color: Colores.burnsVerde },
    { id: 'ENVIO_GRATIS', label: '🚚 Envío Gratis', icon: 'car-outline', color: Colores.burnsBlanco },
];

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = Dimensions.get('window');
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isSmallPhone = width < 375;

    return {
        isTablet,
        isDesktop,
        isSmallPhone,
        width,
        height,
        paddingHorizontal: isTablet ? 40 : isSmallPhone ? 12 : 16,
        tituloSize: isTablet ? 28 : isSmallPhone ? 20 : 22,
        tarjetaPadding: isTablet ? 16 : isSmallPhone ? 10 : 12,
        modalWidth: isTablet ? width * 0.7 : width * 0.92,
        labelSize: isTablet ? 15 : isSmallPhone ? 12 : 13,
        inputSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
        modalMaxHeight: isTablet ? height * 0.8 : height * 0.85,
    };
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionRecompensas(props: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();

    // ✅ ESTADOS
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalKey, setModalKey] = useState(0);
    const [editando, setEditando] = useState<Recompensa | null>(null);

    // ✅ FORMULARIO
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [puntosNecesarios, setPuntosNecesarios] = useState('');
    const [tipo, setTipo] = useState<'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS'>('DESCUENTO');
    const [valorDescuento, setValorDescuento] = useState('');
    const [activa, setActiva] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // ✅ ANIMACIONES
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        cargarRecompensas();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    // ============================================================
    // 🔄 CRUD
    // ============================================================
    const cargarRecompensas = async () => {
        try {
            const { data, error } = await supabase
                .from('recompensas')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('❌ Error cargando recompensas:', error);
                Alert.alert('Error', 'No se pudieron cargar las recompensas');
                return;
            }

            setRecompensas(data || []);
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const onRefresh = async () => {
        setRefrescando(true);
        await cargarRecompensas();
    };

    // ============================================================
    // 📝 FORMULARIO
    // ============================================================
    const abrirFormulario = (recompensa?: Recompensa) => {
        setNombre('');
        setDescripcion('');
        setPuntosNecesarios('');
        setTipo('DESCUENTO');
        setValorDescuento('');
        setActiva(true);

        if (recompensa) {
            setEditando(recompensa);
            setTimeout(() => {
                setNombre(recompensa.nombre);
                setDescripcion(recompensa.descripcion || '');
                setPuntosNecesarios(String(recompensa.puntos_necesarios || 0));
                setTipo(recompensa.tipo || 'DESCUENTO');
                setValorDescuento(String(recompensa.valor_descuento || 0));
                setActiva(recompensa.activa !== undefined ? recompensa.activa : true);
                setModalKey(prev => prev + 1);
                setModalVisible(true);
            }, 100);
        } else {
            setEditando(null);
            setModalKey(prev => prev + 1);
            setModalVisible(true);
        }
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setNombre('');
            setDescripcion('');
            setPuntosNecesarios('');
            setTipo('DESCUENTO');
            setValorDescuento('');
            setActiva(true);
            setEditando(null);
        }, 300);
    };

    // ============================================================
    // 💾 GUARDAR RECOMPENSA
    // ============================================================
    const guardarRecompensa = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        if (!puntosNecesarios) {
            Alert.alert('Error', 'Los puntos necesarios son obligatorios');
            return;
        }

        const puntos = parseInt(puntosNecesarios);
        if (isNaN(puntos) || puntos < 1) {
            Alert.alert('Error', 'Los puntos deben ser un número válido mayor a 0');
            return;
        }

        if (tipo === 'DESCUENTO' && !valorDescuento) {
            Alert.alert('Error', 'El porcentaje de descuento es obligatorio para este tipo');
            return;
        }

        const datos = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || '',
            puntos_necesarios: puntos,
            tipo,
            valor_descuento: parseFloat(valorDescuento) || 0,
            activa,
        };

        setGuardando(true);

        try {
            let error = null;

            if (editando) {
                const { error: updateError } = await supabase
                    .from('recompensas')
                    .update({
                        ...datos,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editando.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('recompensas')
                    .insert([{
                        ...datos,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }]);
                error = insertError;
            }

            if (error) {
                console.error('❌ Error guardando recompensa:', error);
                Alert.alert('❌ Error', error.message || 'No se pudo guardar la recompensa');
                return;
            }

            Alert.alert('✅ Éxito', `Recompensa ${editando ? 'actualizada' : 'creada'} correctamente`);
            cerrarModal();
            await cargarRecompensas();

        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('❌ Error', 'Ocurrió un error inesperado');
        } finally {
            setGuardando(false);
        }
    };

    // ============================================================
    // 🔄 TOGGLE ACTIVA
    // ============================================================
    const manejarToggleActiva = async (id: number, estadoActual: boolean) => {
        try {
            const { error } = await supabase
                .from('recompensas')
                .update({
                    activa: !estadoActual,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) {
                Alert.alert('❌ Error', error.message || 'No se pudo cambiar el estado');
                return;
            }

            await cargarRecompensas();
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('❌ Error', 'Ocurrió un error inesperado');
        }
    };

    // ============================================================
    // 🗑️ ELIMINAR RECOMPENSA (CON VALIDACIÓN DE CANJES)
    // ============================================================
    const eliminarRecompensa = (id: number, nombre: string) => {
        Alert.alert(
            '🗑️ Eliminar recompensa',
            `¿Estás seguro de eliminar "${nombre}"?\n\n⚠️ Esta acción es irreversible.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // ✅ PRIMERO: Verificar si tiene canjes asociados
                            const { count, error: countError } = await supabase
                                .from('canjes')
                                .select('*', { count: 'exact', head: true })
                                .eq('recompensa_id', id);

                            if (countError) {
                                console.error('❌ Error verificando canjes:', countError);
                                Alert.alert('❌ Error', 'No se pudo verificar los canjes asociados');
                                return;
                            }

                            // ✅ Si tiene canjes, mostrar mensaje y ofrecer desactivar
                            if (count && count > 0) {
                                Alert.alert(
                                    '⚠️ No se puede eliminar',
                                    `Esta recompensa tiene ${count} canje${count > 1 ? 's' : ''} asociado${count > 1 ? 's' : ''}.\n\n` +
                                    '📌 No se puede eliminar porque hay clientes que ya la canjearon.\n\n' +
                                    '💡 Podés DESACTIVARLA para que no se muestre a nuevos clientes.',
                                    [
                                        { text: 'OK', style: 'default' },
                                        {
                                            text: 'Desactivar',
                                            style: 'default',
                                            onPress: () => desactivarRecompensa(id, nombre)
                                        }
                                    ]
                                );
                                return;
                            }

                            // ✅ Si no tiene canjes, eliminar normalmente
                            const { error } = await supabase
                                .from('recompensas')
                                .delete()
                                .eq('id', id);

                            if (error) {
                                console.error('❌ Error eliminando recompensa:', error);
                                Alert.alert('❌ Error', error.message || 'No se pudo eliminar');
                                return;
                            }

                            Alert.alert('✅ Éxito', 'Recompensa eliminada correctamente');
                            await cargarRecompensas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('❌ Error', 'Ocurrió un error inesperado');
                        }
                    }
                }
            ]
        );
    };

    // ============================================================
    // 😴 DESACTIVAR RECOMPENSA (solo cambia activa a false)
    // ============================================================
    const desactivarRecompensa = (id: number, nombre: string) => {
        Alert.alert(
            '😴 Desactivar recompensa',
            `¿Deseas desactivar "${nombre}"?\n\nLa recompensa no se mostrará a los clientes, pero los canjes existentes se mantienen.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desactivar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('recompensas')
                                .update({
                                    activa: false,
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', id);

                            if (error) {
                                console.error('❌ Error desactivando recompensa:', error);
                                Alert.alert('❌ Error', error.message || 'No se pudo desactivar');
                                return;
                            }

                            Alert.alert('✅ Éxito', 'Recompensa desactivada correctamente');
                            await cargarRecompensas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('❌ Error', 'Ocurrió un error inesperado');
                        }
                    }
                }
            ]
        );
    };

    // ============================================================
    // 📊 UTILIDADES
    // ============================================================
    const getTipoLabel = (tipo: string) => {
        return TIPOS_RECOMPENSA.find(t => t.id === tipo)?.label || tipo;
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'DESCUENTO': return Colores.burnsDorado;
            case 'PRODUCTO_GRATIS': return Colores.burnsVerde;
            case 'ENVIO_GRATIS': return Colores.burnsBlanco;
            default: return Colores.burnsBlanco + '60';
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'DESCUENTO': return 'pricetag-outline';
            case 'PRODUCTO_GRATIS': return 'restaurant-outline';
            case 'ENVIO_GRATIS': return 'car-outline';
            default: return 'gift-outline';
        }
    };

    // ============================================================
    // 🖼️ RENDER RECOMPENSA
    // ============================================================
    const renderRecompensa = ({ item, index }: { item: Recompensa; index: number }) => {
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });
        const itemSlide = slideUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 * (index + 1), 0],
        });
        const tipoColor = getTipoColor(item.tipo);
        const estaActiva = item.activa;

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
                        padding: responsive.tarjetaPadding,
                        borderRadius: responsive.isTablet ? 18 : responsive.isSmallPhone ? 12 : 16,
                        borderColor: estaActiva ? Colores.burnsDorado + '40' : Colores.burnsBlanco + '20',
                        backgroundColor: estaActiva ? Colores.burnsNegro + '60' : Colores.burnsNegro + '40',
                        opacity: estaActiva ? 1 : 0.6,
                    }
                ]}>
                    <View style={estilos.tarjetaHeader}>
                        <View style={estilos.tarjetaInfo}>
                            <View style={estilos.tarjetaTituloContainer}>
                                <Text style={[estilos.tarjetaTitulo, {
                                    fontSize: responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16,
                                    color: estaActiva ? Colores.burnsBlanco : Colores.burnsBlanco + '50',
                                }]}>
                                    {item.nombre}
                                </Text>
                                <View style={[
                                    estilos.tipoBadge,
                                    {
                                        backgroundColor: tipoColor + '20',
                                        paddingHorizontal: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                        paddingVertical: responsive.isTablet ? 4 : responsive.isSmallPhone ? 2 : 3,
                                        borderRadius: responsive.isTablet ? 12 : responsive.isSmallPhone ? 6 : 8,
                                        borderColor: tipoColor + '30',
                                    }
                                ]}>
                                    <Ionicons
                                        name={getTipoIcon(item.tipo) as any}
                                        size={responsive.isTablet ? 14 : responsive.isSmallPhone ? 10 : 12}
                                        color={tipoColor}
                                    />
                                    <Text style={[
                                        estilos.tipoBadgeTexto,
                                        {
                                            fontSize: responsive.isTablet ? 11 : responsive.isSmallPhone ? 8 : 9,
                                            color: tipoColor,
                                        }
                                    ]}>
                                        {getTipoLabel(item.tipo)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[estilos.tarjetaDesc, {
                                fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
                                color: estaActiva ? Colores.burnsBlanco + '60' : Colores.burnsBlanco + '30',
                            }]}>
                                {item.descripcion || 'Sin descripción'}
                            </Text>

                            <View style={estilos.tarjetaPuntosContainer}>
                                <Text style={[estilos.tarjetaPuntos, {
                                    fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                                    color: estaActiva ? Colores.burnsDorado : Colores.burnsDorado + '50',
                                }]}>
                                    ⭐ {item.puntos_necesarios} pts
                                </Text>
                                {item.valor_descuento > 0 && (
                                    <Text style={[estilos.tarjetaValor, {
                                        fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
                                        color: estaActiva ? Colores.burnsVerde : Colores.burnsVerde + '50',
                                    }]}>
                                        {item.tipo === 'DESCUENTO' ? `-${item.valor_descuento}%` : `$${item.valor_descuento}`}
                                    </Text>
                                )}
                                {!estaActiva && (
                                    <View style={[estilos.estadoInactivoBadge, {
                                        backgroundColor: Colores.burnsRojo + '20',
                                        paddingHorizontal: responsive.isTablet ? 8 : responsive.isSmallPhone ? 4 : 6,
                                        paddingVertical: responsive.isTablet ? 3 : responsive.isSmallPhone ? 1 : 2,
                                        borderRadius: responsive.isTablet ? 8 : responsive.isSmallPhone ? 4 : 6,
                                        borderWidth: 1,
                                        borderColor: Colores.burnsRojo + '30',
                                    }]}>
                                        <Text style={[estilos.estadoInactivoTexto, {
                                            fontSize: responsive.isTablet ? 10 : responsive.isSmallPhone ? 7 : 8,
                                            color: Colores.burnsRojo,
                                        }]}>
                                            ❌ Inactiva
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={estilos.tarjetaAcciones}>
                            <Switch
                                value={item.activa}
                                onValueChange={() => manejarToggleActiva(item.id, item.activa)}
                                trackColor={{ false: Colores.burnsBlanco + '30', true: Colores.burnsDorado }}
                                thumbColor={item.activa ? Colores.burnsBlanco : Colores.burnsBlanco}
                            />

                            {/* ✅ Botón Editar */}
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: Colores.burnsDorado + '20',
                                    padding: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderRadius: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderWidth: 1,
                                    borderColor: Colores.burnsDorado + '30',
                                }]}
                                onPress={() => abrirFormulario(item)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={Colores.burnsDorado} />
                            </TouchableOpacity>

                            {/* ✅ Botón Desactivar */}
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: Colores.burnsDorado + '15',
                                    padding: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderRadius: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderWidth: 1,
                                    borderColor: Colores.burnsDorado + '20',
                                }]}
                                onPress={() => desactivarRecompensa(item.id, item.nombre)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="eye-off-outline" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={Colores.burnsDorado} />
                            </TouchableOpacity>

                            {/* ✅ Botón Eliminar */}
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: Colores.burnsRojo + '20',
                                    padding: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderRadius: responsive.isTablet ? 10 : responsive.isSmallPhone ? 6 : 8,
                                    borderWidth: 1,
                                    borderColor: Colores.burnsRojo + '30',
                                }]}
                                onPress={() => eliminarRecompensa(item.id, item.nombre)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={Colores.burnsRojo} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // ⏳ LOADING
    // ============================================================
    if (cargando && !refrescando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={Colores.burnsDorado} />
                <Text style={[estilos.loadingTexto, {
                    fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                    color: Colores.burnsBlanco + '60',
                }]}>
                    Cargando recompensas...
                </Text>
            </View>
        );
    }

    // ============================================================
    // 🏗️ RENDER PRINCIPAL
    // ============================================================
    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[Colores.burnsVerde, Colores.burnsNegro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[
                estilos.header,
                {
                    paddingTop: insets.top + (responsive.isTablet ? 20 : 10),
                    paddingHorizontal: responsive.paddingHorizontal,
                    paddingBottom: responsive.isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={responsive.isTablet ? 28 : 24} color={Colores.burnsBlanco} />
                </TouchableOpacity>

                <Text style={[estilos.titulo, {
                    fontSize: responsive.tituloSize,
                    color: Colores.burnsDorado,
                }]}>
                    🎁 Gestionar Recompensas
                </Text>

                <TouchableOpacity
                    style={[estilos.botonAgregar, {
                        paddingHorizontal: responsive.isTablet ? 18 : responsive.isSmallPhone ? 12 : 16,
                        paddingVertical: responsive.isTablet ? 12 : responsive.isSmallPhone ? 8 : 10,
                        backgroundColor: Colores.burnsDorado,
                    }]}
                    onPress={() => abrirFormulario()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={responsive.isTablet ? 26 : responsive.isSmallPhone ? 18 : 22} color={Colores.burnsNegro} />
                </TouchableOpacity>
            </View>

            <View style={[estilos.contadorContainer, { paddingHorizontal: responsive.paddingHorizontal }]}>
                <Text style={[estilos.contador, {
                    fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
                    color: Colores.burnsBlanco + '50',
                }]}>
                    {recompensas.length} {recompensas.length === 1 ? 'recompensa' : 'recompensas'}
                    {recompensas.filter(r => r.activa).length > 0 &&
                        ` · ${recompensas.filter(r => r.activa).length} activas`
                    }
                </Text>
            </View>

            <FlatList
                data={recompensas}
                keyExtractor={item => item.id.toString()}
                renderItem={renderRecompensa}
                contentContainerStyle={[
                    estilos.lista,
                    {
                        paddingHorizontal: responsive.paddingHorizontal,
                        paddingBottom: insets.bottom + 150,
                        paddingTop: responsive.isTablet ? 8 : 4,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={onRefresh}
                        tintColor={Colores.burnsDorado}
                        colors={[Colores.burnsDorado]}
                    />
                }
                ListEmptyComponent={
                    <View style={estilos.vacioContenedor}>
                        <Ionicons name="gift-outline" size={responsive.isTablet ? 80 : 60} color={Colores.burnsBlanco + '20'} />
                        <Text style={[estilos.vacio, {
                            fontSize: responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16,
                            color: Colores.burnsBlanco,
                        }]}>
                            No hay recompensas
                        </Text>
                        <Text style={[estilos.vacioSubtexto, {
                            fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
                            color: Colores.burnsBlanco + '40',
                        }]}>
                            Crea tu primera recompensa presionando el botón +
                        </Text>
                    </View>
                }
            />

            {/* ============================================================
            📝 MODAL
            ============================================================ */}
            <Modal
                key={modalKey}
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={estilos.modalFondo}>
                    <LinearGradient
                        colors={[Colores.burnsVerde, Colores.burnsNegro]}
                        style={estilos.modalGradiente}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={estilos.modalKeyboard}
                    >
                        <View style={[
                            estilos.modal,
                            {
                                padding: responsive.isTablet ? 32 : responsive.isSmallPhone ? 16 : 24,
                                borderRadius: responsive.isTablet ? 28 : 24,
                                width: responsive.modalWidth,
                                maxHeight: responsive.modalMaxHeight,
                                borderColor: Colores.burnsDorado + '30',
                            }
                        ]}>
                            <View style={estilos.modalHeader}>
                                <LinearGradient
                                    colors={[Colores.burnsDorado, Colores.burnsRojo]}
                                    style={estilos.modalHeaderGradiente}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="gift" size={responsive.isTablet ? 32 : responsive.isSmallPhone ? 24 : 28} color={Colores.burnsNegro} />
                                    <Text style={[estilos.modalTitulo, {
                                        fontSize: responsive.isTablet ? 26 : responsive.isSmallPhone ? 20 : 22,
                                        color: Colores.burnsNegro,
                                    }]}>
                                        {editando ? '✏️ Editar Recompensa' : '➕ Nueva Recompensa'}
                                    </Text>
                                </LinearGradient>
                            </View>

                            <ScrollView
                                style={estilos.modalScroll}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            >
                                <Text style={[estilos.label, {
                                    fontSize: responsive.labelSize,
                                    color: Colores.burnsBlanco,
                                }]}>
                                    <Ionicons name="gift-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Nombre *
                                </Text>
                                <TextInput
                                    style={[estilos.input, {
                                        fontSize: responsive.inputSize,
                                        color: Colores.burnsBlanco,
                                    }]}
                                    value={nombre}
                                    onChangeText={setNombre}
                                    placeholder="Ej: 20% de descuento"
                                    placeholderTextColor={Colores.burnsBlanco + '40'}
                                    selectionColor={Colores.burnsDorado}
                                />

                                <Text style={[estilos.label, {
                                    fontSize: responsive.labelSize,
                                    marginTop: 14,
                                    color: Colores.burnsBlanco,
                                }]}>
                                    <Ionicons name="document-text-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Descripción
                                </Text>
                                <TextInput
                                    style={[estilos.input, estilos.textArea, {
                                        fontSize: responsive.inputSize,
                                        color: Colores.burnsBlanco,
                                    }]}
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    placeholder="Descripción de la recompensa"
                                    placeholderTextColor={Colores.burnsBlanco + '40'}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    selectionColor={Colores.burnsDorado}
                                />

                                <Text style={[estilos.label, {
                                    fontSize: responsive.labelSize,
                                    marginTop: 14,
                                    color: Colores.burnsBlanco,
                                }]}>
                                    <Ionicons name="star" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Puntos necesarios *
                                </Text>
                                <TextInput
                                    style={[estilos.input, {
                                        fontSize: responsive.inputSize,
                                        color: Colores.burnsBlanco,
                                    }]}
                                    value={puntosNecesarios}
                                    onChangeText={setPuntosNecesarios}
                                    placeholder="Ej: 500"
                                    placeholderTextColor={Colores.burnsBlanco + '40'}
                                    keyboardType="numeric"
                                    selectionColor={Colores.burnsDorado}
                                />

                                <Text style={[estilos.label, {
                                    fontSize: responsive.labelSize,
                                    marginTop: 14,
                                    color: Colores.burnsBlanco,
                                }]}>
                                    <Ionicons name="pricetag" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Tipo de recompensa *
                                </Text>
                                <View style={[estilos.tiposContainer, { gap: responsive.isTablet ? 8 : 6 }]}>
                                    {TIPOS_RECOMPENSA.map(t => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[
                                                estilos.tipoOpcion,
                                                {
                                                    paddingVertical: responsive.isTablet ? 12 : responsive.isSmallPhone ? 8 : 10,
                                                    paddingHorizontal: responsive.isTablet ? 16 : responsive.isSmallPhone ? 10 : 12,
                                                    borderRadius: responsive.isTablet ? 12 : responsive.isSmallPhone ? 8 : 10,
                                                    backgroundColor: tipo === t.id ? Colores.burnsDorado : Colores.burnsNegro + '40',
                                                    borderColor: tipo === t.id ? Colores.burnsDorado : Colores.burnsBlanco + '10',
                                                }
                                            ]}
                                            onPress={() => setTipo(t.id as any)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name={t.icon as any} size={responsive.isTablet ? 20 : responsive.isSmallPhone ? 14 : 16} color={tipo === t.id ? Colores.burnsNegro : Colores.burnsBlanco + '50'} />
                                            <Text style={[
                                                estilos.tipoOpcionTexto,
                                                {
                                                    fontSize: responsive.isTablet ? 14 : responsive.isSmallPhone ? 11 : 12,
                                                    color: tipo === t.id ? Colores.burnsNegro : Colores.burnsBlanco + '50',
                                                    fontWeight: tipo === t.id ? '700' : '500',
                                                }
                                            ]}>
                                                {t.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {tipo === 'DESCUENTO' && (
                                    <>
                                        <Text style={[estilos.label, {
                                            fontSize: responsive.labelSize,
                                            marginTop: 14,
                                            color: Colores.burnsBlanco,
                                        }]}>
                                            <Ionicons name="pricetag" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Porcentaje de descuento *
                                        </Text>
                                        <TextInput
                                            style={[estilos.input, {
                                                fontSize: responsive.inputSize,
                                                color: Colores.burnsBlanco,
                                            }]}
                                            value={valorDescuento}
                                            onChangeText={setValorDescuento}
                                            placeholder="Ej: 20"
                                            placeholderTextColor={Colores.burnsBlanco + '40'}
                                            keyboardType="numeric"
                                            selectionColor={Colores.burnsDorado}
                                        />
                                    </>
                                )}

                                <View style={estilos.switchContainer}>
                                    <Text style={[estilos.label, {
                                        fontSize: responsive.labelSize,
                                        marginBottom: 0,
                                        color: Colores.burnsBlanco,
                                    }]}>
                                        <Ionicons name="checkmark-circle-outline" size={responsive.isTablet ? 18 : responsive.isSmallPhone ? 14 : 16} color={Colores.burnsDorado} /> Activa
                                    </Text>
                                    <Switch
                                        value={activa}
                                        onValueChange={setActiva}
                                        trackColor={{ false: Colores.burnsBlanco + '30', true: Colores.burnsDorado }}
                                        thumbColor={activa ? Colores.burnsBlanco : Colores.burnsBlanco}
                                    />
                                </View>
                            </ScrollView>

                            <View style={[estilos.modalBotones, {
                                gap: responsive.isTablet ? 14 : responsive.isSmallPhone ? 8 : 12,
                                marginTop: 16,
                            }]}>
                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalCancelar, {
                                        paddingVertical: responsive.isTablet ? 16 : responsive.isSmallPhone ? 10 : 14,
                                    }]}
                                    onPress={cerrarModal}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={Colores.burnsBlanco} />
                                    <Text style={[estilos.modalCancelarTexto, {
                                        fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                                        color: Colores.burnsBlanco,
                                    }]}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalGuardar, {
                                        paddingVertical: responsive.isTablet ? 16 : responsive.isSmallPhone ? 10 : 14,
                                    }]}
                                    onPress={guardarRecompensa}
                                    disabled={guardando}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={[Colores.burnsDorado, Colores.burnsRojo]}
                                        style={estilos.modalGuardarGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {guardando ? (
                                            <ActivityIndicator size="small" color={Colores.burnsNegro} />
                                        ) : (
                                            <>
                                                <Ionicons name="save" size={responsive.isTablet ? 22 : responsive.isSmallPhone ? 16 : 20} color={Colores.burnsNegro} />
                                                <Text style={[estilos.modalGuardarTexto, {
                                                    fontSize: responsive.isTablet ? 16 : responsive.isSmallPhone ? 13 : 14,
                                                    color: Colores.burnsNegro,
                                                }]}>
                                                    {editando ? 'Actualizar' : 'Crear'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: Colores.burnsNegro,
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
        borderBottomColor: Colores.burnsBlanco + '10',
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
        shadowColor: Colores.burnsDorado,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    contadorContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colores.burnsBlanco + '5',
    },
    contador: {
        fontWeight: '500',
        opacity: 0.6,
    },
    lista: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: Colores.burnsNegro,
    },
    loadingTexto: {
        fontWeight: '400',
        opacity: 0.7,
    },
    tarjeta: {
        marginBottom: 10,
        borderWidth: 1,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tarjetaInfo: {
        flex: 1,
        marginRight: 8,
    },
    tarjetaTituloContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    tarjetaTitulo: {
        fontWeight: 'bold',
    },
    tipoBadge: {
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tipoBadgeTexto: {
        fontWeight: '600',
    },
    tarjetaDesc: {
        opacity: 0.7,
        marginBottom: 4,
    },
    tarjetaPuntosContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    tarjetaPuntos: {
        fontWeight: 'bold',
    },
    tarjetaValor: {
        fontWeight: '600',
    },
    tarjetaAcciones: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    botonAccion: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    estadoInactivoBadge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    estadoInactivoTexto: {
        fontWeight: '600',
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
        borderRadius: 28,
    },
    modalKeyboard: {
        width: '100%',
        alignItems: 'center',
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
        backgroundColor: Colores.burnsNegro + '40',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colores.burnsBlanco + '10',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    tiposContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tipoOpcion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minWidth: '30%',
    },
    tipoOpcionTexto: {
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
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
        backgroundColor: Colores.burnsNegro + '50',
        borderWidth: 1,
        borderColor: Colores.burnsBlanco + '10',
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
});