// screens/admin/PantallaGestionRecompensas.tsx - REDISEÑO KRUSTY MODERNO
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    Animated,
    RefreshControl,
    Switch,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { useToast, Toast } from '../../components/Toast';

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
    { id: 'DESCUENTO', label: '💰 Descuento', icon: 'pricetag-outline', color: DISENO.colors.accentSecondary },
    { id: 'PRODUCTO_GRATIS', label: '🍔 Producto Gratis', icon: 'restaurant-outline', color: DISENO.colors.success },
    { id: 'ENVIO_GRATIS', label: '🚚 Envío Gratis', icon: 'car-outline', color: DISENO.colors.info },
];

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionRecompensas(props: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

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
    // 📊 MÉTRICAS
    // ============================================================
    const metricas = useMemo(() => {
        const total = recompensas.length;
        const activas = recompensas.filter(r => r.activa).length;
        const inactivas = total - activas;
        return { total, activas, inactivas };
    }, [recompensas]);

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
                toast.error('No se pudieron cargar las recompensas');
                return;
            }

            setRecompensas(data || []);
        } catch (error) {
            console.error('❌ Error:', error);
            toast.error('Ocurrió un error inesperado');
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
            toast.advertencia('El nombre es obligatorio');
            return;
        }

        if (!puntosNecesarios) {
            toast.advertencia('Los puntos necesarios son obligatorios');
            return;
        }

        const puntos = parseInt(puntosNecesarios);
        if (isNaN(puntos) || puntos < 1) {
            toast.advertencia('Los puntos deben ser un número válido mayor a 0');
            return;
        }

        if (tipo === 'DESCUENTO' && !valorDescuento) {
            toast.advertencia('El porcentaje de descuento es obligatorio');
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
                toast.error(error.message || 'No se pudo guardar la recompensa');
                return;
            }

            toast.exito(`Recompensa ${editando ? 'actualizada' : 'creada'} correctamente`);
            cerrarModal();
            await cargarRecompensas();

        } catch (error) {
            console.error('❌ Error:', error);
            toast.error('Ocurrió un error inesperado');
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
                toast.error(error.message || 'No se pudo cambiar el estado');
                return;
            }

            toast.exito(!estadoActual ? '✅ Recompensa activada' : '😴 Recompensa desactivada');
            await cargarRecompensas();
        } catch (error) {
            console.error('❌ Error:', error);
            toast.error('Ocurrió un error inesperado');
        }
    };

    // ============================================================
    // 🗑️ ELIMINAR CON VALIDACIÓN DE CANJES
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
                            const { count, error: countError } = await supabase
                                .from('canjes')
                                .select('*', { count: 'exact', head: true })
                                .eq('recompensa_id', id);

                            if (countError) {
                                console.error('❌ Error verificando canjes:', countError);
                                toast.error('No se pudo verificar los canjes asociados');
                                return;
                            }

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

                            const { error } = await supabase
                                .from('recompensas')
                                .delete()
                                .eq('id', id);

                            if (error) {
                                console.error('❌ Error eliminando recompensa:', error);
                                toast.error(error.message || 'No se pudo eliminar');
                                return;
                            }

                            toast.exito('Recompensa eliminada correctamente');
                            await cargarRecompensas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            toast.error('Ocurrió un error inesperado');
                        }
                    }
                }
            ]
        );
    };

    // ============================================================
    // 😴 DESACTIVAR RECOMPENSA
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
                                toast.error(error.message || 'No se pudo desactivar');
                                return;
                            }

                            toast.exito('Recompensa desactivada');
                            await cargarRecompensas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            toast.error('Ocurrió un error inesperado');
                        }
                    }
                }
            ]
        );
    };

    // ============================================================
    // 📊 HELPERS
    // ============================================================
    const getTipoInfo = (tipoRec: string) => {
        const found = TIPOS_RECOMPENSA.find(t => t.id === tipoRec);
        return found || { label: tipoRec, icon: 'gift-outline', color: DISENO.colors.accentSecondary };
    };

    // ============================================================
    // 🖼️ RENDER RECOMPENSA
    // ============================================================
    const renderRecompensa = ({ item }: { item: Recompensa }) => {
        const tipoInfo = getTipoInfo(item.tipo);
        const estaActiva = item.activa;

        // ✅ Responsive
        const cardPadding = responsive.getValor({ tablet: 16, normal: 12, small: 10 });
        const tituloSize = responsive.getValor({ tablet: 17, normal: 15, small: 14 });
        const descSize = responsive.getValor({ tablet: 13, normal: 12, small: 11 });
        const puntosSize = responsive.getValor({ tablet: 15, normal: 14, small: 12 });
        const valorSize = responsive.getValor({ tablet: 14, normal: 13, small: 11 });
        const badgeSize = responsive.getValor({ tablet: 11, normal: 10, small: 9 });
        const iconoAccionSize = responsive.getValor({ tablet: 20, normal: 18, small: 15 });

        return (
            <View
                style={[
                    estilos.tarjeta,
                    {
                        padding: cardPadding,
                        borderLeftColor: estaActiva ? tipoInfo.color : DISENO.colors.textTertiary,
                        opacity: estaActiva ? 1 : 0.65,
                    },
                ]}
            >
                {/* HEADER: NOMBRE + TIPO */}
                <View style={estilos.tarjetaHeader}>
                    <View style={estilos.tarjetaInfo}>
                        <Text
                            style={[estilos.tarjetaTitulo, { fontSize: tituloSize }]}
                            numberOfLines={2}
                        >
                            {item.nombre}
                        </Text>

                        <View
                            style={[
                                estilos.tipoBadge,
                                {
                                    backgroundColor: tipoInfo.color + '20',
                                    borderColor: tipoInfo.color + '40',
                                    paddingHorizontal: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                                    paddingVertical: responsive.getValor({ tablet: 4, normal: 3, small: 2 }),
                                },
                            ]}
                        >
                            <Ionicons
                                name={tipoInfo.icon as any}
                                size={badgeSize + 2}
                                color={tipoInfo.color}
                            />
                            <Text
                                style={[
                                    estilos.tipoBadgeText,
                                    { fontSize: badgeSize, color: tipoInfo.color },
                                ]}
                            >
                                {tipoInfo.label}
                            </Text>
                        </View>
                    </View>

                    <Switch
                        value={item.activa}
                        onValueChange={() => manejarToggleActiva(item.id, item.activa)}
                        trackColor={{
                            false: DISENO.colors.grisClaro,
                            true: DISENO.colors.accentSecondary,
                        }}
                        thumbColor={DISENO.colors.surface}
                    />
                </View>

                {/* DESCRIPCIÓN */}
                {item.descripcion ? (
                    <Text
                        style={[estilos.tarjetaDesc, { fontSize: descSize }]}
                        numberOfLines={2}
                    >
                        {item.descripcion}
                    </Text>
                ) : null}

                {/* PUNTOS + VALOR */}
                <View style={estilos.tarjetaPuntosRow}>
                    <View style={estilos.puntosBadge}>
                        <Ionicons name="star" size={badgeSize + 2} color={DISENO.colors.accentSecondary} />
                        <Text style={[estilos.puntosTexto, { fontSize: puntosSize }]}>
                            {item.puntos_necesarios} pts
                        </Text>
                    </View>

                    {item.valor_descuento > 0 && (
                        <View style={[estilos.valorBadge, { backgroundColor: DISENO.colors.success + '15' }]}>
                            <Text style={[estilos.valorTexto, { fontSize: valorSize }]}>
                                {item.tipo === 'DESCUENTO'
                                    ? `-${item.valor_descuento}%`
                                    : formatearPrecio(item.valor_descuento)}
                            </Text>
                        </View>
                    )}

                    {!estaActiva && (
                        <View style={[estilos.inactivaBadge, { backgroundColor: DISENO.colors.danger + '15' }]}>
                            <Text style={[estilos.inactivaTexto, { fontSize: badgeSize }]}>
                                ❌ Inactiva
                            </Text>
                        </View>
                    )}
                </View>

                {/* BOTONES DE ACCIÓN */}
                <View style={estilos.tarjetaAcciones}>
                    <TouchableOpacity
                        style={[estilos.botonAccion, { backgroundColor: DISENO.colors.accentSecondary + '20' }]}
                        onPress={() => abrirFormulario(item)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="create-outline" size={iconoAccionSize} color={DISENO.colors.accentSecondary} />
                        <Text style={[estilos.botonAccionTexto, { fontSize: badgeSize, color: DISENO.colors.accentSecondary }]}>
                            Editar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[estilos.botonAccion, { backgroundColor: DISENO.colors.info + '15' }]}
                        onPress={() => desactivarRecompensa(item.id, item.nombre)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="eye-off-outline" size={iconoAccionSize} color={DISENO.colors.info} />
                        <Text style={[estilos.botonAccionTexto, { fontSize: badgeSize, color: DISENO.colors.info }]}>
                            Desactivar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[estilos.botonAccion, { backgroundColor: DISENO.colors.danger + '15' }]}
                        onPress={() => eliminarRecompensa(item.id, item.nombre)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={iconoAccionSize} color={DISENO.colors.danger} />
                        <Text style={[estilos.botonAccionTexto, { fontSize: badgeSize, color: DISENO.colors.danger }]}>
                            Eliminar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ============================================================
    // ⏳ LOADING
    // ============================================================
    if (cargando && !refrescando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={estilos.loadingTexto}>Cargando recompensas...</Text>
            </View>
        );
    }

    // ============================================================
    // 🏗️ RENDER PRINCIPAL
    // ============================================================
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
                        style={estilos.botonHeader}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color={DISENO.colors.text} />
                    </TouchableOpacity>

                    <View style={estilos.headerCentro}>
                        <Text style={estilos.titulo}>🎁 Recompensas</Text>
                    </View>

                    <TouchableOpacity
                        style={[estilos.botonHeader, { backgroundColor: DISENO.colors.accentSecondary }]}
                        onPress={() => abrirFormulario()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={24} color={DISENO.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* RESUMEN */}
                <View
                    style={[
                        estilos.resumenHoy,
                        { marginHorizontal: responsive.getEspaciado('LG') },
                    ]}
                >
                    <View style={estilos.resumenItem}>
                        <Text style={estilos.resumenLabel}>Activas</Text>
                        <Text style={[estilos.resumenValor, { color: DISENO.colors.success }]}>
                            {metricas.activas}
                        </Text>
                    </View>
                    <View style={estilos.resumenDivider} />
                    <View style={estilos.resumenItem}>
                        <Text style={estilos.resumenLabel}>Inactivas</Text>
                        <Text style={[estilos.resumenValor, { color: DISENO.colors.danger }]}>
                            {metricas.inactivas}
                        </Text>
                    </View>
                    <View style={estilos.resumenDivider} />
                    <View style={estilos.resumenItem}>
                        <Text style={estilos.resumenLabel}>Total</Text>
                        <Text style={estilos.resumenValor}>{metricas.total}</Text>
                    </View>
                </View>

                {/* LISTA */}
                <FlatList
                    data={recompensas}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderRecompensa}
                    contentContainerStyle={[
                        estilos.lista,
                        {
                            paddingHorizontal: responsive.getEspaciado('LG'),
                            paddingBottom: insets.bottom + 120,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={onRefresh}
                            tintColor={DISENO.colors.accent}
                            colors={[DISENO.colors.accent]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={estilos.vacioContenedor}>
                            <Ionicons
                                name="gift-outline"
                                size={60}
                                color={DISENO.colors.textTertiary}
                            />
                            <Text style={estilos.vacio}>No hay recompensas</Text>
                            <Text style={estilos.vacioSubtexto}>
                                Creá tu primera recompensa con el botón +
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* ============================================================
                📝 MODAL FORMULARIO
            ============================================================ */}
            <Modal
                key={modalKey}
                visible={modalVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={cerrarModal}
            >
                <View style={estilos.modalFondo}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={estilos.modalKeyboard}
                    >
                        <View style={estilos.modal}>
                            {/* HEADER DEL MODAL */}
                            <LinearGradient
                                colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                                style={estilos.modalHeaderGradiente}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons
                                    name={editando ? 'create' : 'gift'}
                                    size={22}
                                    color={DISENO.colors.surface}
                                />
                                <Text style={estilos.modalTitulo}>
                                    {editando ? 'Editar Recompensa' : 'Nueva Recompensa'}
                                </Text>
                                <TouchableOpacity
                                    style={estilos.modalCerrarHeader}
                                    onPress={cerrarModal}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={22} color={DISENO.colors.surface} />
                                </TouchableOpacity>
                            </LinearGradient>

                            <ScrollView
                                style={estilos.modalScroll}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            >
                                {/* NOMBRE */}
                                <Text style={estilos.label}>🎁 Nombre *</Text>
                                <TextInput
                                    style={estilos.input}
                                    value={nombre}
                                    onChangeText={setNombre}
                                    placeholder="Ej: 20% de descuento"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    selectionColor={DISENO.colors.accent}
                                />

                                {/* DESCRIPCIÓN */}
                                <Text style={estilos.label}>📝 Descripción</Text>
                                <TextInput
                                    style={[estilos.input, estilos.textArea]}
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    placeholder="Descripción de la recompensa"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    selectionColor={DISENO.colors.accent}
                                />

                                {/* PUNTOS */}
                                <Text style={estilos.label}>⭐ Puntos necesarios *</Text>
                                <TextInput
                                    style={estilos.input}
                                    value={puntosNecesarios}
                                    onChangeText={setPuntosNecesarios}
                                    placeholder="Ej: 500"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    keyboardType="numeric"
                                    selectionColor={DISENO.colors.accent}
                                />

                                {/* TIPO */}
                                <Text style={estilos.label}>🏷️ Tipo de recompensa *</Text>
                                <View style={estilos.tiposContainer}>
                                    {TIPOS_RECOMPENSA.map(t => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[
                                                estilos.tipoOpcion,
                                                tipo === t.id && {
                                                    backgroundColor: t.color + '20',
                                                    borderColor: t.color,
                                                },
                                            ]}
                                            onPress={() => setTipo(t.id as any)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={t.icon as any}
                                                size={16}
                                                color={tipo === t.id ? t.color : DISENO.colors.textSecondary}
                                            />
                                            <Text
                                                style={[
                                                    estilos.tipoOpcionTexto,
                                                    {
                                                        color: tipo === t.id ? t.color : DISENO.colors.textSecondary,
                                                        fontWeight: tipo === t.id ? '700' : '500',
                                                    },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {t.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* VALOR (solo descuento) */}
                                {tipo === 'DESCUENTO' && (
                                    <>
                                        <Text style={estilos.label}>💰 Porcentaje de descuento *</Text>
                                        <TextInput
                                            style={estilos.input}
                                            value={valorDescuento}
                                            onChangeText={setValorDescuento}
                                            placeholder="Ej: 20"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            keyboardType="numeric"
                                            selectionColor={DISENO.colors.accent}
                                        />
                                    </>
                                )}

                                {/* ACTIVA */}
                                <View style={estilos.switchContainer}>
                                    <Text style={[estilos.label, { marginTop: 0, marginBottom: 0 }]}>
                                        ✅ Activa
                                    </Text>
                                    <Switch
                                        value={activa}
                                        onValueChange={setActiva}
                                        trackColor={{
                                            false: DISENO.colors.grisClaro,
                                            true: DISENO.colors.accentSecondary,
                                        }}
                                        thumbColor={DISENO.colors.surface}
                                    />
                                </View>
                            </ScrollView>

                            {/* BOTONES */}
                            <View style={estilos.modalBotones}>
                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalCancelar]}
                                    onPress={cerrarModal}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={18} color={DISENO.colors.text} />
                                    <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalGuardar]}
                                    onPress={guardarRecompensa}
                                    disabled={guardando}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                                        style={estilos.modalGuardarGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {guardando ? (
                                            <ActivityIndicator size="small" color={DISENO.colors.surface} />
                                        ) : (
                                            <>
                                                <Ionicons name="save" size={18} color={DISENO.colors.surface} />
                                                <Text style={estilos.modalGuardarTexto}>
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

    // LOADING
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: DISENO.colors.fondo,
    },
    loadingTexto: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
    },

    // LISTA
    lista: {
        flexGrow: 1,
    },
    vacioContenedor: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    vacio: {
        fontFamily: FUENTES.display,
        fontSize: 16,
        color: DISENO.colors.text,
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },

    // TARJETA
    tarjeta: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.lg,
        marginBottom: 12,
        borderLeftWidth: 4,
        ...DISENO.shadow.sm,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    tarjetaInfo: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    tarjetaTitulo: {
        fontFamily: FUENTES.display,
        color: DISENO.colors.text,
    },
    tipoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    tipoBadgeText: {
        fontFamily: FUENTES.regular,
        fontWeight: '700',
    },
    tarjetaDesc: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        marginBottom: 8,
        lineHeight: 18,
    },

    // PUNTOS Y VALOR
    tarjetaPuntosRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    puntosBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: DISENO.colors.accentSecondary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    puntosTexto: {
        fontFamily: FUENTES.display,
        color: DISENO.colors.text,
    },
    valorBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    valorTexto: {
        fontFamily: FUENTES.regular,
        fontWeight: '700',
        color: DISENO.colors.success,
    },
    inactivaBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    inactivaTexto: {
        fontFamily: FUENTES.regular,
        fontWeight: '700',
        color: DISENO.colors.danger,
    },

    // ACCIONES
    tarjetaAcciones: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: DISENO.colors.border,
    },
    botonAccion: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 8,
    },
    botonAccionTexto: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
    },

    // MODAL
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalKeyboard: {
        width: '100%',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.xl,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        overflow: 'hidden',
        ...DISENO.shadow.lg,
    },
    modalHeaderGradiente: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    modalTitulo: {
        flex: 1,
        fontFamily: FUENTES.display,
        fontSize: 18,
        color: DISENO.colors.surface,
    },
    modalCerrarHeader: {
        padding: 4,
    },
    modalScroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    label: {
        fontFamily: FUENTES.display,
        fontSize: 13,
        color: DISENO.colors.text,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.text,
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: DISENO.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    tiposContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    tipoOpcion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.surfaceHover,
        flex: 1,
        minWidth: '30%',
    },
    tipoOpcionTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingVertical: 10,
    },
    modalBotones: {
        flexDirection: 'row',
        gap: 10,
        padding: 20,
        paddingTop: 10,
    },
    modalBoton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        overflow: 'hidden',
    },
    modalCancelar: {
        backgroundColor: DISENO.colors.surfaceHover,
    },
    modalCancelarTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        fontWeight: '600',
        color: DISENO.colors.text,
    },
    modalGuardar: {
        overflow: 'hidden',
        paddingVertical: 0,
    },
    modalGuardarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        width: '100%',
    },
    modalGuardarTexto: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.surface,
    },
});