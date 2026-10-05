// screens/admin/PantallaRepartidores.tsx - NUEVA: Gestión de repartidores
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
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase';
import { useResponsive } from '../../lib/colores';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { useToast, Toast } from '../../components/Toast';

// ============================================================
// 🆕 INTERFAZ
// ============================================================
interface Repartidor {
    id: string;
    nombre_cliente: string | null;
    email: string | null;
    telefono: string | null;
    avatar_url: string | null;
    disponible_repartidor: boolean;
    ultimo_acceso: string | null;
    // Métricas calculadas
    entregas_hoy?: number;
    entregas_totales?: number;
    pedidos_activos?: number;
}

const COLOR_WHATSAPP = '#25D366';

// ============================================================
// 🔧 HELPERS
// ============================================================
const formatearTiempoTranscurrido = (fecha: string | null): string => {
    if (!fecha) return 'Nunca';

    const ahora = new Date().getTime();
    const creado = new Date(fecha).getTime();
    const minutos = Math.floor((ahora - creado) / 60000);

    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 30) return `hace ${dias}d`;
    const meses = Math.floor(dias / 30);
    return `hace ${meses}mes`;
};

const normalizarTelefonoParaWhatsApp = (telefono: string): string | null => {
    if (!telefono) return null;

    let numero = telefono.replace(/\D/g, '');
    if (!numero || numero.length < 8) return null;

    if (numero.startsWith('549')) return numero;
    if (numero.startsWith('54')) return `549${numero.slice(2)}`;

    if (numero.startsWith('0')) numero = numero.slice(1);

    const match15 = numero.match(/^(\d{2,4})15(\d{6,8})$/);
    if (match15) numero = `${match15[1]}${match15[2]}`;

    if (numero.length === 10) return `549${numero}`;
    return `54${numero}`;
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaRepartidores(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
    const toast = useToast();

    // ✅ TEMA
    const colores = useColores();
    const estilos = useMemo(() => crearEstilos(colores), [colores]);

    const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'disponibles' | 'pausados'>('todos');

    const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<Repartidor | null>(null);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        cargarRepartidores();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    // ============================================================
    // 📥 CARGAR REPARTIDORES
    // ============================================================
    const cargarRepartidores = async () => {
        try {
            // 1. Traer repartidores
            const { data: repartidoresData, error: repartidoresError } = await supabase
                .from('perfiles')
                .select('id, nombre_cliente, email, telefono, avatar_url, disponible_repartidor, ultimo_acceso')
                .eq('rol', 'repartidor')
                .order('nombre_cliente', { ascending: true });

            if (repartidoresError) throw repartidoresError;

            if (!repartidoresData || repartidoresData.length === 0) {
                setRepartidores([]);
                setCargando(false);
                setRefrescando(false);
                return;
            }

            const ids = repartidoresData.map(r => r.id);

            // 2. Contar pedidos activos (en_camino por repartidor)
            const { data: pedidosActivosData } = await supabase
                .from('pedidos')
                .select('repartidor_id')
                .in('repartidor_id', ids)
                .in('estado', ['en_camino', 'en camino']);

            const activosMap: Record<string, number> = {};
            (pedidosActivosData || []).forEach(p => {
                if (p.repartidor_id) {
                    activosMap[p.repartidor_id] = (activosMap[p.repartidor_id] || 0) + 1;
                }
            });

            // 3. Contar entregas totales por repartidor
            const { data: entregasData } = await supabase
                .from('pedidos')
                .select('repartidor_id')
                .in('repartidor_id', ids)
                .eq('estado', 'entregado');

            const entregasMap: Record<string, number> = {};
            (entregasData || []).forEach(p => {
                if (p.repartidor_id) {
                    entregasMap[p.repartidor_id] = (entregasMap[p.repartidor_id] || 0) + 1;
                }
            });

            // 4. Contar entregas de hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const { data: hoyData } = await supabase
                .from('pedidos')
                .select('repartidor_id, creado_en')
                .in('repartidor_id', ids)
                .eq('estado', 'entregado')
                .gte('creado_en', hoy.toISOString());

            const hoyMap: Record<string, number> = {};
            (hoyData || []).forEach(p => {
                if (p.repartidor_id) {
                    hoyMap[p.repartidor_id] = (hoyMap[p.repartidor_id] || 0) + 1;
                }
            });

            const lista: Repartidor[] = repartidoresData.map(r => ({
                ...r,
                disponible_repartidor: r.disponible_repartidor !== false,
                entregas_hoy: hoyMap[r.id] || 0,
                entregas_totales: entregasMap[r.id] || 0,
                pedidos_activos: activosMap[r.id] || 0,
            }));

            setRepartidores(lista);
        } catch (error) {
            console.error('❌ Error cargando repartidores:', error);
            Alert.alert('Error', 'No se pudieron cargar los repartidores');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    // ============================================================
    // 📊 MÉTRICAS GENERALES
    // ============================================================
    const metricas = useMemo(() => {
        const total = repartidores.length;
        const disponibles = repartidores.filter(r => r.disponible_repartidor).length;
        const pausados = repartidores.filter(r => !r.disponible_repartidor).length;
        const entregasHoy = repartidores.reduce((sum, r) => sum + (r.entregas_hoy || 0), 0);

        return { total, disponibles, pausados, entregasHoy };
    }, [repartidores]);

    // ============================================================
    // 🔍 FILTRADO
    // ============================================================
    const repartidoresFiltrados = useMemo(() => {
        let resultado = [...repartidores];

        if (filtroEstado === 'disponibles') {
            resultado = resultado.filter(r => r.disponible_repartidor);
        } else if (filtroEstado === 'pausados') {
            resultado = resultado.filter(r => !r.disponible_repartidor);
        }

        if (busqueda.trim()) {
            const q = busqueda.trim().toLowerCase();
            resultado = resultado.filter(r =>
                (r.nombre_cliente || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.telefono || '').includes(q)
            );
        }

        return resultado;
    }, [repartidores, filtroEstado, busqueda]);

    // ============================================================
    // 🔄 FORZAR CAMBIO DE DISPONIBILIDAD
    // ============================================================
    const toggleDisponibilidadForzada = async (repartidor: Repartidor, nuevoEstado: boolean) => {
        setCambiandoEstado(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({ disponible_repartidor: nuevoEstado })
                .eq('id', repartidor.id);

            if (error) throw error;

            // Actualizar local
            setRepartidores(prev =>
                prev.map(r => (r.id === repartidor.id ? { ...r, disponible_repartidor: nuevoEstado } : r))
            );
            setRepartidorSeleccionado(prev =>
                prev && prev.id === repartidor.id ? { ...prev, disponible_repartidor: nuevoEstado } : prev
            );

            toast.exito(
                nuevoEstado
                    ? `🟢 ${repartidor.nombre_cliente || 'Repartidor'} activado`
                    : `🟡 ${repartidor.nombre_cliente || 'Repartidor'} pausado`
            );
        } catch (e: any) {
            console.error('Error cambiando disponibilidad:', e);
            toast.error('No se pudo cambiar el estado');
        } finally {
            setCambiandoEstado(false);
        }
    };

    // ============================================================
    // 📞 LLAMAR
    // ============================================================
    const llamar = (telefono: string | null) => {
        if (!telefono) {
            toast.advertencia('Este repartidor no tiene teléfono');
            return;
        }
        Linking.openURL(`tel:${telefono}`).catch(() => {
            toast.error('No se pudo realizar la llamada');
        });
    };

    // ============================================================
    // 💬 WHATSAPP
    // ============================================================
    const abrirWhatsApp = (telefono: string | null, nombre?: string | null) => {
        if (!telefono) {
            toast.advertencia('Este repartidor no tiene teléfono');
            return;
        }

        const numero = normalizarTelefonoParaWhatsApp(telefono);
        if (!numero) {
            toast.advertencia('El número no es válido');
            return;
        }

        const nombreCorto = (nombre || '').split(' ')[0] || '';
        const mensaje = nombreCorto
            ? `¡Hola ${nombreCorto}! Te escribo de Krusty Burger 🍔.`
            : '¡Hola! Te escribo de Krusty Burger 🍔.';

        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
        Linking.openURL(url).catch(() => {
            toast.error('No se pudo abrir WhatsApp');
        });
    };

    // ============================================================
    // 📋 COPIAR
    // ============================================================
    const copiar = async (texto: string | null, label: string) => {
        if (!texto) {
            toast.advertencia(`Sin ${label}`);
            return;
        }
        await Clipboard.setStringAsync(texto);
        toast.exito(`📋 ${label} copiado`);
    };

    // ============================================================
    // 👁️ DETALLE
    // ============================================================
    const abrirDetalle = (repartidor: Repartidor) => {
        setRepartidorSeleccionado(repartidor);
        setMostrarModalDetalle(true);
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarRepartidores();
    }, []);

    // ============================================================
    // 🎨 RENDER DE CADA REPARTIDOR
    // ============================================================
    const renderRepartidor = ({ item }: { item: Repartidor }) => {
        const inicial = (item.nombre_cliente || 'R').trim().charAt(0).toUpperCase();
        const estaDisponible = item.disponible_repartidor;
        const colorEstado = estaDisponible ? colores.success : colores.warning;

        const avatarSize = responsive.getValor({ tablet: 56, normal: 52, small: 46 });
        const nombreSize = responsive.getValor({ tablet: 16, normal: 15, small: 13 });
        const infoSize = responsive.getValor({ tablet: 13, normal: 12, small: 11 });
        const statValorSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });
        const statLabelSize = responsive.getValor({ tablet: 10, normal: 9, small: 8 });
        const cardPadding = responsive.getValor({ tablet: 16, normal: 14, small: 12 });

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => abrirDetalle(item)}
            >
                <View
                    style={[
                        estilos.tarjeta,
                        {
                            padding: cardPadding,
                            borderLeftColor: colorEstado,
                        },
                    ]}
                >
                    {/* HEADER: avatar + info + estado */}
                    <View style={estilos.tarjetaHeader}>
                        <View
                            style={[
                                estilos.avatarWrap,
                                {
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarSize / 2,
                                    backgroundColor: colorEstado + '15',
                                    borderColor: colorEstado + '40',
                                },
                            ]}
                        >
                            {item.avatar_url ? (
                                <Text style={[estilos.avatarTexto, { fontSize: avatarSize * 0.4, color: colorEstado }]}>
                                    {inicial}
                                </Text>
                            ) : (
                                <Text style={[estilos.avatarTexto, { fontSize: avatarSize * 0.4, color: colorEstado }]}>
                                    {inicial}
                                </Text>
                            )}
                            <View
                                style={[
                                    estilos.puntoEstado,
                                    { backgroundColor: colorEstado, borderColor: colores.surface },
                                ]}
                            />
                        </View>

                        <View style={estilos.infoWrap}>
                            <Text
                                style={[estilos.nombre, { fontSize: nombreSize }]}
                                numberOfLines={1}
                            >
                                {item.nombre_cliente || 'Repartidor'}
                            </Text>
                            <Text
                                style={[estilos.email, { fontSize: infoSize }]}
                                numberOfLines={1}
                            >
                                {item.email || 'Sin email'}
                            </Text>
                            <View style={estilos.estadoRow}>
                                <View style={[estilos.estadoBadge, { backgroundColor: colorEstado + '20', borderColor: colorEstado + '40' }]}>
                                    <Ionicons
                                        name={estaDisponible ? 'checkmark-circle' : 'pause-circle'}
                                        size={12}
                                        color={colorEstado}
                                    />
                                    <Text style={[estilos.estadoBadgeText, { color: colorEstado }]}>
                                        {estaDisponible ? 'Disponible' : 'Pausado'}
                                    </Text>
                                </View>
                                {item.pedidos_activos && item.pedidos_activos > 0 ? (
                                    <View style={[estilos.estadoBadge, { backgroundColor: colores.info + '20', borderColor: colores.info + '40' }]}>
                                        <Ionicons name="bicycle" size={12} color={colores.info} />
                                        <Text style={[estilos.estadoBadgeText, { color: colores.info }]}>
                                            {item.pedidos_activos} activo{item.pedidos_activos > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    {/* STATS */}
                    <View style={estilos.statsRow}>
                        <View style={estilos.statItem}>
                            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
                                {item.entregas_hoy || 0}
                            </Text>
                            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>
                                Hoy
                            </Text>
                        </View>
                        <View style={[estilos.statDivider, { backgroundColor: colores.border }]} />
                        <View style={estilos.statItem}>
                            <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
                                {item.entregas_totales || 0}
                            </Text>
                            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>
                                Totales
                            </Text>
                        </View>
                        <View style={[estilos.statDivider, { backgroundColor: colores.border }]} />
                        <View style={estilos.statItem}>
                            <Text
                                style={[estilos.statValor, { fontSize: statValorSize - 4, color: colores.textSecondary }]}
                                numberOfLines={1}
                            >
                                {formatearTiempoTranscurrido(item.ultimo_acceso)}
                            </Text>
                            <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>
                                Últ. acceso
                            </Text>
                        </View>
                    </View>

                    {/* CONTACTO */}
                    <View style={estilos.contactoRow}>
                        <TouchableOpacity
                            style={[estilos.botonContacto, { backgroundColor: colores.success + '15' }]}
                            onPress={() => llamar(item.telefono)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="call" size={16} color={colores.success} />
                            <Text style={[estilos.botonContactoText, { color: colores.success }]}>
                                Llamar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[estilos.botonContacto, { backgroundColor: COLOR_WHATSAPP + '15' }]}
                            onPress={() => abrirWhatsApp(item.telefono, item.nombre_cliente)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-whatsapp" size={16} color={COLOR_WHATSAPP} />
                            <Text style={[estilos.botonContactoText, { color: COLOR_WHATSAPP }]}>
                                WhatsApp
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ============================================================
    // 🎯 FILTROS
    // ============================================================
    const chipsFiltro = [
        { id: 'todos', label: '👥 Todos', count: metricas.total },
        { id: 'disponibles', label: '🟢 Disponibles', count: metricas.disponibles },
        { id: 'pausados', label: '🟡 Pausados', count: metricas.pausados },
    ] as const;

    // ============================================================
    // 🏗️ RENDER
    // ============================================================
    if (cargando) {
        return (
            <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colores.accent} />
                <Text style={[estilos.cargandoText, { color: colores.textSecondary }]}>
                    Cargando repartidores...
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
                        <Text style={[estilos.titulo, { color: colores.text }]}>🛵 Repartidores</Text>
                        <Text style={[estilos.subtitulo, { color: colores.textSecondary }]}>
                            {metricas.disponibles} disponibles · {metricas.entregasHoy} entregas hoy
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={estilos.botonHeader}
                        onPress={manejarRefresh}
                    >
                        <Ionicons name="refresh" size={22} color={colores.accent} />
                    </TouchableOpacity>
                </View>

                {/* RESUMEN */}
                <View
                    style={[
                        estilos.resumen,
                        { marginHorizontal: responsive.getEspaciado('LG') },
                    ]}
                >
                    <View style={estilos.resumenItem}>
                        <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Total</Text>
                        <Text style={[estilos.resumenValor, { color: colores.text }]}>{metricas.total}</Text>
                    </View>
                    <View style={[estilos.resumenDivider, { backgroundColor: colores.border }]} />
                    <View style={estilos.resumenItem}>
                        <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Disponibles</Text>
                        <Text style={[estilos.resumenValor, { color: colores.success }]}>{metricas.disponibles}</Text>
                    </View>
                    <View style={[estilos.resumenDivider, { backgroundColor: colores.border }]} />
                    <View style={estilos.resumenItem}>
                        <Text style={[estilos.resumenLabel, { color: colores.textSecondary }]}>Pausados</Text>
                        <Text style={[estilos.resumenValor, { color: colores.warning }]}>{metricas.pausados}</Text>
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
                        placeholder="Buscar por nombre, email o teléfono..."
                        placeholderTextColor={colores.textTertiary}
                        selectionColor={colores.accent}
                    />
                    {busqueda.length > 0 && (
                        <TouchableOpacity onPress={() => setBusqueda('')}>
                            <Ionicons name="close-circle" size={18} color={colores.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* CHIPS */}
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
                        const esPausados = chip.id === 'pausados';
                        const esDisponibles = chip.id === 'disponibles';
                        const chipColor = esPausados ? colores.warning : esDisponibles ? colores.success : colores.accent;

                        return (
                            <TouchableOpacity
                                key={chip.id}
                                style={[
                                    estilos.chip,
                                    { borderColor: colores.border },
                                    activo && {
                                        backgroundColor: chipColor,
                                        borderColor: chipColor,
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
                                            { backgroundColor: activo ? 'rgba(255,255,255,0.3)' : colores.textTertiary },
                                        ]}
                                    >
                                        <Text style={estilos.chipBadgeText}>{chip.count}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* LISTA */}
                <FlatList
                    data={repartidoresFiltrados}
                    keyExtractor={item => item.id}
                    renderItem={renderRepartidor}
                    contentContainerStyle={[
                        estilos.lista,
                        {
                            paddingHorizontal: responsive.getEspaciado('LG'),
                            paddingBottom: insets.bottom + 80,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={estilos.vacio}>
                            <Ionicons name="people-outline" size={60} color={colores.textTertiary} />
                            <Text style={[estilos.vacioTexto, { color: colores.text }]}>
                                {busqueda ? 'Sin resultados' : 'No hay repartidores'}
                            </Text>
                            <Text style={[estilos.vacioSubtexto, { color: colores.textSecondary }]}>
                                {busqueda ? 'Probá con otra búsqueda' : 'Los repartidores aparecerán acá'}
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

            {/* MODAL DETALLE */}
            <Modal
                visible={mostrarModalDetalle}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setMostrarModalDetalle(false)}
            >
                <View style={estilos.modalOverlay}>
                    <View style={[estilos.modalContainer, { backgroundColor: colores.surface }]}>
                        <View style={[estilos.modalHeader, { borderBottomColor: colores.border }]}>
                            <Text style={[estilos.modalTitulo, { color: colores.text }]}>
                                Detalle del repartidor
                            </Text>
                            <TouchableOpacity onPress={() => setMostrarModalDetalle(false)}>
                                <Ionicons name="close" size={24} color={colores.text} />
                            </TouchableOpacity>
                        </View>

                        {repartidorSeleccionado && (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            >
                                {/* AVATAR + NOMBRE */}
                                <View style={estilos.modalAvatarWrap}>
                                    <View
                                        style={[
                                            estilos.modalAvatar,
                                            {
                                                backgroundColor: (repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning) + '20',
                                                borderColor: repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning,
                                            },
                                        ]}
                                    >
                                        <Text style={[estilos.modalAvatarText, { color: repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning }]}>
                                            {(repartidorSeleccionado.nombre_cliente || 'R').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={[estilos.modalNombre, { color: colores.text }]}>
                                        {repartidorSeleccionado.nombre_cliente || 'Repartidor'}
                                    </Text>
                                    <View
                                        style={[
                                            estilos.modalEstadoBadge,
                                            {
                                                backgroundColor: (repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning) + '20',
                                                borderColor: (repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning) + '40',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={repartidorSeleccionado.disponible_repartidor ? 'checkmark-circle' : 'pause-circle'}
                                            size={14}
                                            color={repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning}
                                        />
                                        <Text
                                            style={[
                                                estilos.modalEstadoTexto,
                                                { color: repartidorSeleccionado.disponible_repartidor ? colores.success : colores.warning },
                                            ]}
                                        >
                                            {repartidorSeleccionado.disponible_repartidor ? 'Disponible' : 'Pausado'}
                                        </Text>
                                    </View>
                                </View>

                                {/* FORZAR DISPONIBILIDAD */}
                                <View style={[estilos.seccionSwitch, { backgroundColor: colores.surfaceHover }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[estilos.switchTitulo, { color: colores.text }]}>
                                            Forzar disponibilidad
                                        </Text>
                                        <Text style={[estilos.switchDesc, { color: colores.textSecondary }]}>
                                            {repartidorSeleccionado.disponible_repartidor
                                                ? 'Actualmente disponible'
                                                : 'Actualmente pausado'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={repartidorSeleccionado.disponible_repartidor}
                                        onValueChange={(valor) =>
                                            toggleDisponibilidadForzada(repartidorSeleccionado, valor)
                                        }
                                        disabled={cambiandoEstado}
                                        trackColor={{ false: colores.border, true: colores.success }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>

                                {/* INFO */}
                                <View style={estilos.seccion}>
                                    <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>📋 Información</Text>

                                    <TouchableOpacity
                                        style={estilos.infoLinea}
                                        onPress={() => copiar(repartidorSeleccionado.email, 'Email')}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="mail-outline" size={16} color={colores.textSecondary} />
                                        <Text style={[estilos.infoTexto, { color: colores.text }]} numberOfLines={1}>
                                            {repartidorSeleccionado.email || 'Sin email'}
                                        </Text>
                                        {repartidorSeleccionado.email && (
                                            <Ionicons name="copy-outline" size={14} color={colores.textTertiary} />
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={estilos.infoLinea}
                                        onPress={() => copiar(repartidorSeleccionado.telefono, 'Teléfono')}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="call-outline" size={16} color={colores.textSecondary} />
                                        <Text style={[estilos.infoTexto, { color: colores.text }]} numberOfLines={1}>
                                            {repartidorSeleccionado.telefono || 'Sin teléfono'}
                                        </Text>
                                        {repartidorSeleccionado.telefono && (
                                            <Ionicons name="copy-outline" size={14} color={colores.textTertiary} />
                                        )}
                                    </TouchableOpacity>

                                    <View style={estilos.infoLinea}>
                                        <Ionicons name="time-outline" size={16} color={colores.textSecondary} />
                                        <Text style={[estilos.infoTexto, { color: colores.text }]}>
                                            Último acceso: {formatearTiempoTranscurrido(repartidorSeleccionado.ultimo_acceso)}
                                        </Text>
                                    </View>
                                </View>

                                {/* STATS */}
                                <View style={estilos.seccion}>
                                    <Text style={[estilos.seccionTitulo, { color: colores.accent }]}>📊 Estadísticas</Text>
                                    <View style={estilos.statsModalRow}>
                                        <View style={[estilos.statModalCard, { backgroundColor: colores.success + '15' }]}>
                                            <Text style={[estilos.statModalValor, { color: colores.success }]}>
                                                {repartidorSeleccionado.entregas_hoy || 0}
                                            </Text>
                                            <Text style={[estilos.statModalLabel, { color: colores.textSecondary }]}>
                                                Hoy
                                            </Text>
                                        </View>
                                        <View style={[estilos.statModalCard, { backgroundColor: colores.info + '15' }]}>
                                            <Text style={[estilos.statModalValor, { color: colores.info }]}>
                                                {repartidorSeleccionado.entregas_totales || 0}
                                            </Text>
                                            <Text style={[estilos.statModalLabel, { color: colores.textSecondary }]}>
                                                Totales
                                            </Text>
                                        </View>
                                        <View style={[estilos.statModalCard, { backgroundColor: colores.accent + '15' }]}>
                                            <Text style={[estilos.statModalValor, { color: colores.accent }]}>
                                                {repartidorSeleccionado.pedidos_activos || 0}
                                            </Text>
                                            <Text style={[estilos.statModalLabel, { color: colores.textSecondary }]}>
                                                Activos
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* CONTACTO */}
                                <View style={estilos.modalContactoRow}>
                                    <TouchableOpacity
                                        style={[estilos.modalContactoBoton, { backgroundColor: colores.success + '15' }]}
                                        onPress={() => llamar(repartidorSeleccionado.telefono)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="call" size={18} color={colores.success} />
                                        <Text style={[estilos.modalContactoTexto, { color: colores.success }]}>
                                            Llamar
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[estilos.modalContactoBoton, { backgroundColor: COLOR_WHATSAPP + '15' }]}
                                        onPress={() => abrirWhatsApp(repartidorSeleccionado.telefono, repartidorSeleccionado.nombre_cliente)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="logo-whatsapp" size={18} color={COLOR_WHATSAPP} />
                                        <Text style={[estilos.modalContactoTexto, { color: COLOR_WHATSAPP }]}>
                                            WhatsApp
                                        </Text>
                                    </TouchableOpacity>
                                </View>
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
        subtitulo: {
            fontFamily: FUENTES.regular,
            fontSize: 11,
            marginTop: 2,
        },

        // RESUMEN
        resumen: {
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
            fontSize: 20,
        },
        resumenDivider: {
            width: 1,
            height: 30,
        },

        // BUSCADOR
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
            marginTop: 12,
        },
        vacioSubtexto: {
            fontFamily: FUENTES.regular,
            fontSize: 12,
            marginTop: 4,
        },

        // TARJETA
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
        tarjetaHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
        },
        avatarWrap: {
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            position: 'relative',
        },
        avatarTexto: {
            fontFamily: FUENTES.display,
            fontWeight: '700',
            includeFontPadding: false,
        },
        puntoEstado: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2,
        },
        infoWrap: {
            flex: 1,
            minWidth: 0,
        },
        nombre: {
            fontFamily: FUENTES.display,
            color: colores.text,
            includeFontPadding: false,
        },
        email: {
            fontFamily: FUENTES.regular,
            color: colores.textSecondary,
            marginTop: 2,
            includeFontPadding: false,
        },
        estadoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            flexWrap: 'wrap',
        },
        estadoBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            borderWidth: 1,
        },
        estadoBadgeText: {
            fontFamily: FUENTES.regular,
            fontSize: 10,
            fontWeight: '700',
        },

        // STATS
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colores.surfaceHover,
            borderRadius: 12,
            paddingVertical: 10,
            marginBottom: 12,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statDivider: {
            width: 1,
            height: 24,
        },
        statValor: {
            fontFamily: FUENTES.display,
            color: colores.text,
            includeFontPadding: false,
        },
        statLabel: {
            fontFamily: FUENTES.regular,
            color: colores.textSecondary,
            marginTop: 2,
            includeFontPadding: false,
        },

        // CONTACTO
        contactoRow: {
            flexDirection: 'row',
            gap: 8,
        },
        botonContacto: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 10,
        },
        botonContactoText: {
            fontFamily: FUENTES.regular,
            fontSize: 12,
            fontWeight: '700',
        },

        // MODAL
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
        },
        modalContainer: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '92%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 12,
            borderBottomWidth: 1,
            marginBottom: 16,
        },
        modalTitulo: {
            fontFamily: FUENTES.display,
            fontSize: 20,
        },
        modalAvatarWrap: {
            alignItems: 'center',
            marginBottom: 20,
        },
        modalAvatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            marginBottom: 12,
        },
        modalAvatarText: {
            fontFamily: FUENTES.display,
            fontSize: 36,
            includeFontPadding: false,
        },
        modalNombre: {
            fontFamily: FUENTES.display,
            fontSize: 20,
            marginBottom: 8,
        },
        modalEstadoBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth: 1,
        },
        modalEstadoTexto: {
            fontFamily: FUENTES.regular,
            fontSize: 12,
            fontWeight: '700',
        },

        // SECCIÓN SWITCH
        seccionSwitch: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            borderRadius: 14,
            marginBottom: 16,
        },
        switchTitulo: {
            fontFamily: FUENTES.display,
            fontSize: 14,
            includeFontPadding: false,
        },
        switchDesc: {
            fontFamily: FUENTES.regular,
            fontSize: 12,
            marginTop: 2,
            includeFontPadding: false,
        },

        // SECCIONES
        seccion: {
            marginBottom: 20,
        },
        seccionTitulo: {
            fontFamily: FUENTES.display,
            fontSize: 14,
            marginBottom: 8,
        },
        infoLinea: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 8,
        },
        infoTexto: {
            fontFamily: FUENTES.regular,
            fontSize: 13,
            flex: 1,
        },

        // STATS MODAL
        statsModalRow: {
            flexDirection: 'row',
            gap: 10,
        },
        statModalCard: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 14,
            borderRadius: 12,
        },
        statModalValor: {
            fontFamily: FUENTES.display,
            fontSize: 22,
            includeFontPadding: false,
        },
        statModalLabel: {
            fontFamily: FUENTES.regular,
            fontSize: 11,
            marginTop: 2,
            includeFontPadding: false,
        },

        // CONTACTO MODAL
        modalContactoRow: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 4,
        },
        modalContactoBoton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
        },
        modalContactoTexto: {
            fontFamily: FUENTES.regular,
            fontSize: 13,
            fontWeight: '700',
        },
    });