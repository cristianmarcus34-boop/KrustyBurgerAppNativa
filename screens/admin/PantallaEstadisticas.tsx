// screens/admin/PantallaEstadisticas.tsx - CON FILTRO DE FECHAS PROFESIONAL + CHIPS GRANDES
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    RefreshControl,
    FlatList,
    Modal,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { useToast, Toast } from '../../components/Toast';

// ============================================================
// 🏷️ TIPADO
// ============================================================
interface TarjetaStats {
    id: string;
    titulo: string;
    valor: string | number;
    icono: keyof typeof Ionicons.glyphMap;
    color: string;
    subtexto?: string;
}

interface StatsCompletos {
    totalPedidos: number;
    ingresosTotales: number;
    pedidosPendientes: number;
    pedidosHoy: number;
    ticketPromedio: number;
    clientesRegistrados: number;
    pedidosConfirmados: number;
    pedidosPreparando: number;
    pedidosEnCamino: number;
    pedidosEntregados: number;
    pedidosCancelados: number;
    recompensasCanjeadas: number;
    productosVendidos: number;
    ingresosRango: number;
    clientesNuevosRango: number;
    pedidosUltimaSemana: { dia: string; total: number; pedidos: number }[];
}

type PresetRango = 'hoy' | 'ayer' | '7d' | '30d' | 'mes' | 'año' | 'custom';

interface RangoFecha {
    desde: Date;
    hasta: Date;
    preset: PresetRango;
}

// ============================================================
// 🔧 HELPERS DE FECHA
// ============================================================
const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
};

const getRangoPreset = (preset: PresetRango): { desde: Date; hasta: Date } => {
    const hoy = new Date();

    switch (preset) {
        case 'hoy':
            return { desde: startOfDay(hoy), hasta: endOfDay(hoy) };

        case 'ayer': {
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);
            return { desde: startOfDay(ayer), hasta: endOfDay(ayer) };
        }

        case '7d': {
            const d = new Date(hoy);
            d.setDate(d.getDate() - 6);
            return { desde: startOfDay(d), hasta: endOfDay(hoy) };
        }

        case '30d': {
            const d = new Date(hoy);
            d.setDate(d.getDate() - 29);
            return { desde: startOfDay(d), hasta: endOfDay(hoy) };
        }

        case 'mes': {
            const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            return { desde: startOfDay(d), hasta: endOfDay(hoy) };
        }

        case 'año': {
            const d = new Date(hoy.getFullYear(), 0, 1);
            return { desde: startOfDay(d), hasta: endOfDay(hoy) };
        }

        default:
            return { desde: startOfDay(hoy), hasta: endOfDay(hoy) };
    }
};

const formatearRango = (desde: Date, hasta: Date): string => {
    const opciones: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    };

    const dStr = desde.toLocaleDateString('es-AR', opciones);
    const hStr = hasta.toLocaleDateString('es-AR', opciones);

    if (dStr === hStr) return dStr;
    return `${dStr} - ${hStr}`;
};

const diasDelRango = (desde: Date, hasta: Date): number => {
    const diff = hasta.getTime() - desde.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ============================================================
// 📱 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaEstadisticas(props: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

    // ✅ Rango activo (default: últimos 30 días)
    const [rango, setRango] = useState<RangoFecha>(() => {
        const r = getRangoPreset('30d');
        return { ...r, preset: '30d' };
    });

    // ✅ Estado del modal custom
    const [modalRangoVisible, setModalRangoVisible] = useState(false);
    const [tempDesde, setTempDesde] = useState<Date>(rango.desde);
    const [tempHasta, setTempHasta] = useState<Date>(rango.hasta);
    const [mostrarPicker, setMostrarPicker] = useState<'desde' | 'hasta' | null>(null);

    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
    const [stats, setStats] = useState<StatsCompletos>({
        totalPedidos: 0,
        ingresosTotales: 0,
        pedidosPendientes: 0,
        pedidosHoy: 0,
        ticketPromedio: 0,
        clientesRegistrados: 0,
        pedidosConfirmados: 0,
        pedidosPreparando: 0,
        pedidosEnCamino: 0,
        pedidosEntregados: 0,
        pedidosCancelados: 0,
        recompensasCanjeadas: 0,
        productosVendidos: 0,
        ingresosRango: 0,
        clientesNuevosRango: 0,
        pedidosUltimaSemana: [],
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    // ============================================================
    // 🔄 EFECTOS
    // ============================================================
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    // Recargar cuando cambia el rango
    useEffect(() => {
        cargarEstadisticas();
    }, [rango.desde.toISOString(), rango.hasta.toISOString()]);

    // ============================================================
    // 📊 CARGA DE DATOS
    // ============================================================
    const cargarEstadisticas = async () => {
        try {
            setError(null);
            setCargando(true);

            const desdeStr = rango.desde.toISOString();
            const hastaStr = rango.hasta.toISOString();

            const [
                { data: pedidosRango },
                { count: pendientesRango },
                { count: confirmadosRango },
                { count: preparandoRango },
                { count: enCaminoRango },
                { count: entregadosRango },
                { count: canceladosRango },
                { count: totalPedidosRango },
                { count: clientesTotales },
                { count: clientesNuevosRango },
                { count: recompensasCanjeadasRango },
                { data: pedidosUltimaSemanaData },
            ] = await Promise.all([
                supabase
                    .from('pedidos')
                    .select('total, items_json, estado, creado_en')
                    .gte('creado_en', desdeStr)
                    .lte('creado_en', hastaStr),

                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'pendiente').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'confirmado').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'preparando').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'en_camino').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'entregado').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .eq('estado', 'cancelado').gte('creado_en', desdeStr).lte('creado_en', hastaStr),
                supabase.from('pedidos').select('*', { count: 'exact', head: true })
                    .gte('creado_en', desdeStr).lte('creado_en', hastaStr),

                supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),

                supabase.from('perfiles').select('*', { count: 'exact', head: true })
                    .eq('rol', 'cliente').gte('ultimo_acceso', desdeStr).lte('ultimo_acceso', hastaStr),

                supabase.from('canjes').select('*', { count: 'exact', head: true })
                    .gte('fecha', desdeStr).lte('fecha', hastaStr),

                supabase
                    .from('pedidos')
                    .select('total, creado_en, estado')
                    .gte('creado_en', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .eq('estado', 'entregado'),
            ]);

            const ingresosRango = pedidosRango
                ?.filter(p => p.estado === 'entregado')
                ?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;

            let productosVendidos = 0;
            pedidosRango?.forEach(p => {
                if (p.items_json && Array.isArray(p.items_json)) {
                    p.items_json.forEach((item: any) => {
                        productosVendidos += item.cantidad || 0;
                    });
                }
            });

            const pedidosEntregadosRango = pedidosRango?.filter(p => p.estado === 'entregado').length || 0;
            const ticketPromedio = pedidosEntregadosRango > 0
                ? ingresosRango / pedidosEntregadosRango
                : 0;

            const pedidosUltimaSemana: { dia: string; total: number; pedidos: number }[] = [];
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                fecha.setHours(0, 0, 0, 0);
                const fechaStr = fecha.toISOString();
                const diaNombre = diasSemana[fecha.getDay()];

                const pedidosDia = pedidosUltimaSemanaData?.filter(p =>
                    p.creado_en >= fechaStr &&
                    p.creado_en < new Date(fecha.getTime() + 86400000).toISOString()
                ) || [];

                pedidosUltimaSemana.push({
                    dia: diaNombre,
                    total: pedidosDia.reduce((sum, p) => sum + (p.total || 0), 0),
                    pedidos: pedidosDia.length,
                });
            }

            const hoyStr = startOfDay(new Date()).toISOString();

            setStats({
                totalPedidos: totalPedidosRango || 0,
                ingresosTotales: ingresosRango,
                pedidosPendientes: pendientesRango || 0,
                pedidosHoy: pedidosRango?.filter(p => p.creado_en >= hoyStr).length || 0,
                ticketPromedio,
                clientesRegistrados: clientesTotales || 0,
                pedidosConfirmados: confirmadosRango || 0,
                pedidosPreparando: preparandoRango || 0,
                pedidosEnCamino: enCaminoRango || 0,
                pedidosEntregados: entregadosRango || 0,
                pedidosCancelados: canceladosRango || 0,
                recompensasCanjeadas: recompensasCanjeadasRango || 0,
                productosVendidos,
                ingresosRango,
                clientesNuevosRango: clientesNuevosRango || 0,
                pedidosUltimaSemana,
            });

            setUltimaActualizacion(new Date());
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            setError('Error al cargar las estadísticas');
            toast.error('No se pudieron cargar las estadísticas');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarEstadisticas();
    }, [rango]);

    // ============================================================
    // 📅 CAMBIO DE RANGO
    // ============================================================
    const aplicarPreset = (preset: PresetRango) => {
        if (preset === 'custom') {
            setTempDesde(rango.desde);
            setTempHasta(rango.hasta);
            setModalRangoVisible(true);
            return;
        }

        const { desde, hasta } = getRangoPreset(preset);
        setRango({ desde, hasta, preset });
    };

    const aplicarRangoCustom = () => {
        if (tempDesde > tempHasta) {
            toast.advertencia('La fecha "desde" debe ser anterior a "hasta"');
            return;
        }

        setRango({
            desde: startOfDay(tempDesde),
            hasta: endOfDay(tempHasta),
            preset: 'custom',
        });
        setModalRangoVisible(false);
        toast.exito('📅 Rango aplicado');
    };

    const onCambiarFecha = (event: any, fecha?: Date) => {
        if (Platform.OS === 'android') {
            setMostrarPicker(null);
        }
        if (event.type === 'dismissed' || !fecha) return;

        if (mostrarPicker === 'desde') {
            setTempDesde(fecha);
        } else if (mostrarPicker === 'hasta') {
            setTempHasta(fecha);
        }
    };

    // ============================================================
    // 📋 TARJETAS
    // ============================================================
    const tarjetas: TarjetaStats[] = useMemo(() => [
        {
            id: 'total-pedidos',
            titulo: 'Pedidos',
            valor: stats.totalPedidos,
            icono: 'receipt-outline',
            color: DISENO.colors.accentSecondary,
        },
        {
            id: 'ingresos-totales',
            titulo: 'Ingresos',
            valor: formatearPrecio(stats.ingresosTotales),
            icono: 'cash-outline',
            color: DISENO.colors.success,
        },
        {
            id: 'pendientes',
            titulo: 'Pendientes',
            valor: stats.pedidosPendientes,
            icono: 'time-outline',
            color: DISENO.colors.naranja,
        },
        {
            id: 'pedidos-hoy',
            titulo: 'Hoy',
            valor: stats.pedidosHoy,
            icono: 'today-outline',
            color: DISENO.colors.info,
        },
        {
            id: 'ticket-promedio',
            titulo: 'Ticket Prom.',
            valor: formatearPrecio(stats.ticketPromedio),
            icono: 'pricetag-outline',
            color: DISENO.colors.morado,
        },
        {
            id: 'clientes',
            titulo: 'Clientes',
            valor: stats.clientesRegistrados,
            icono: 'people-outline',
            color: DISENO.colors.naranja,
            subtexto: `+${stats.clientesNuevosRango} nuevos`,
        },
        {
            id: 'entregados',
            titulo: 'Entregados',
            valor: stats.pedidosEntregados,
            icono: 'checkmark-circle-outline',
            color: DISENO.colors.success,
        },
        {
            id: 'recompensas',
            titulo: 'Recompensas',
            valor: stats.recompensasCanjeadas,
            icono: 'gift-outline',
            color: DISENO.colors.rosa,
        },
        {
            id: 'productos',
            titulo: 'Productos',
            valor: stats.productosVendidos,
            icono: 'restaurant-outline',
            color: DISENO.colors.naranja,
        },
    ], [stats]);

    // ============================================================
    // 🎴 RENDER TARJETA
    // ============================================================
    const renderTarjeta = ({ item }: { item: TarjetaStats }) => {
        const valorSize = responsive.getValor({ tablet: 22, normal: 18, small: 15 });
        const tituloSize = responsive.getValor({ tablet: 12, normal: 10, small: 9 });
        const iconoSize = responsive.getValor({ tablet: 24, normal: 20, small: 18 });
        const padding = responsive.getValor({ tablet: 16, normal: 12, small: 10 });

        return (
            <Animated.View
                style={[
                    estilos.tarjetaWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    },
                ]}
            >
                <View
                    style={[
                        estilos.tarjeta,
                        {
                            borderLeftColor: item.color,
                            padding,
                        },
                    ]}
                >
                    <View style={[estilos.tarjetaIcono, { backgroundColor: item.color + '15' }]}>
                        <Ionicons name={item.icono} size={iconoSize} color={item.color} />
                    </View>

                    <Text
                        style={[estilos.tarjetaValor, { fontSize: valorSize, color: item.color }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                    >
                        {item.valor}
                    </Text>

                    <Text
                        style={[estilos.tarjetaTitulo, { fontSize: tituloSize }]}
                        numberOfLines={1}
                    >
                        {item.titulo}
                    </Text>

                    {item.subtexto && (
                        <Text
                            style={[estilos.tarjetaSubtexto, { fontSize: tituloSize - 1 }]}
                            numberOfLines={1}
                        >
                            {item.subtexto}
                        </Text>
                    )}
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 📈 GRÁFICO SEMANAL
    // ============================================================
    const renderGraficoSemanal = () => {
        const maxValor = Math.max(...stats.pedidosUltimaSemana.map(d => d.total), 1);
        const barraHeight = responsive.getValor({ tablet: 100, normal: 80, small: 60 });
        const padding = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
        const seccionTituloSize = responsive.getValor({ tablet: 17, normal: 15, small: 14 });

        return (
            <Animated.View
                style={[
                    estilos.seccion,
                    { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                ]}
            >
                <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
                    📈 Últimos 7 días
                </Text>

                <View style={[estilos.graficoCard, { padding }]}>
                    <View style={estilos.graficoBarras}>
                        {stats.pedidosUltimaSemana.map((item, index) => {
                            const alturaPorcentaje = Math.max(
                                Math.min((item.total / maxValor) * 100, 100),
                                item.total > 0 ? 8 : 0
                            );

                            return (
                                <View key={index} style={estilos.barraItem}>
                                    <Text style={estilos.barraTotal} numberOfLines={1}>
                                        {item.total > 0 ? formatearPrecio(item.total) : '—'}
                                    </Text>
                                    <View
                                        style={[
                                            estilos.barra,
                                            {
                                                height: barraHeight,
                                                backgroundColor: DISENO.colors.border,
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                estilos.barraFill,
                                                {
                                                    height: `${alturaPorcentaje}%`,
                                                    backgroundColor: DISENO.colors.accentSecondary,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={estilos.barraDia}>{item.dia}</Text>
                                    <Text style={estilos.barraPedidos}>{item.pedidos}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 📊 DISTRIBUCIÓN
    // ============================================================
    const renderDistribucionEstados = () => {
        const estados = [
            { key: 'Pendientes', value: stats.pedidosPendientes, color: DISENO.colors.naranja, icono: 'time-outline' },
            { key: 'Confirmados', value: stats.pedidosConfirmados, color: DISENO.colors.info, icono: 'checkmark-circle-outline' },
            { key: 'Preparando', value: stats.pedidosPreparando, color: DISENO.colors.morado, icono: 'restaurant-outline' },
            { key: 'En Camino', value: stats.pedidosEnCamino, color: DISENO.colors.morado, icono: 'bicycle-outline' },
            { key: 'Entregados', value: stats.pedidosEntregados, color: DISENO.colors.success, icono: 'checkmark-done-circle-outline' },
            { key: 'Cancelados', value: stats.pedidosCancelados, color: DISENO.colors.danger, icono: 'close-circle-outline' },
        ];

        const total = estados.reduce((sum, e) => sum + e.value, 0) || 1;
        const padding = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
        const seccionTituloSize = responsive.getValor({ tablet: 17, normal: 15, small: 14 });
        const itemNombreSize = responsive.getValor({ tablet: 14, normal: 13, small: 11 });
        const itemCantidadSize = responsive.getValor({ tablet: 16, normal: 15, small: 13 });
        const iconSize = responsive.getValor({ tablet: 20, normal: 18, small: 15 });

        return (
            <Animated.View
                style={[
                    estilos.seccion,
                    { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
                ]}
            >
                <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
                    📋 Distribución
                </Text>

                <View style={[estilos.distribucionCard, { padding }]}>
                    {estados.map((estado, index) => {
                        const porcentaje = (estado.value / total) * 100;

                        return (
                            <View key={index} style={estilos.distribucionItem}>
                                <View
                                    style={[
                                        estilos.distribucionIcono,
                                        { backgroundColor: estado.color + '15' },
                                    ]}
                                >
                                    <Ionicons
                                        name={estado.icono as any}
                                        size={iconSize}
                                        color={estado.color}
                                    />
                                </View>

                                <View style={estilos.distribucionInfo}>
                                    <View style={estilos.distribucionHeader}>
                                        <Text
                                            style={[
                                                estilos.distribucionNombre,
                                                { fontSize: itemNombreSize },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {estado.key}
                                        </Text>
                                        <Text
                                            style={[
                                                estilos.distribucionPorcentaje,
                                                { color: estado.color },
                                            ]}
                                        >
                                            {Math.round(porcentaje)}%
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            estilos.distribucionBarraContainer,
                                            { backgroundColor: DISENO.colors.border },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                estilos.distribucionBarra,
                                                {
                                                    width: `${porcentaje}%`,
                                                    backgroundColor: estado.color,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>

                                <Text
                                    style={[
                                        estilos.distribucionCantidad,
                                        {
                                            fontSize: itemCantidadSize,
                                            color: estado.color,
                                        },
                                    ]}
                                >
                                    {estado.value}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 📅 PRESETS
    // ============================================================
    const PRESETS: { id: PresetRango; label: string }[] = [
        { id: 'hoy', label: 'Hoy' },
        { id: 'ayer', label: 'Ayer' },
        { id: '7d', label: '7d' },
        { id: '30d', label: '30d' },
        { id: 'mes', label: 'Mes' },
        { id: 'año', label: 'Año' },
    ];

    // ============================================================
    // 🖥️ RENDER
    // ============================================================
    if (error) {
        return (
            <View style={estilos.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color={DISENO.colors.danger} />
                <Text style={estilos.errorText}>{error}</Text>
                <TouchableOpacity
                    style={estilos.errorButton}
                    onPress={manejarRefresh}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh" size={18} color={DISENO.colors.surface} />
                    <Text style={estilos.errorButtonText}>Reintentar</Text>
                </TouchableOpacity>
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
                        style={estilos.botonHeader}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color={DISENO.colors.text} />
                    </TouchableOpacity>

                    <View style={estilos.headerCentro}>
                        <Text style={estilos.titulo}>📊 Estadísticas</Text>
                    </View>

                    <TouchableOpacity
                        style={estilos.botonHeader}
                        onPress={() => aplicarPreset('custom')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="calendar-outline" size={22} color={DISENO.colors.accent} />
                    </TouchableOpacity>
                </View>

                <View style={estilos.presetsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={estilos.presetsContent}
                    >
                        {PRESETS.map((preset, index) => {
                            const activo = rango.preset === preset.id;
                            return (
                                <TouchableOpacity
                                    key={preset.id}
                                    style={[
                                        estilos.presetChip,
                                        activo && estilos.presetChipActivo,
                                        { marginRight: 10 },
                                    ]}
                                    onPress={() => aplicarPreset(preset.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            estilos.presetChipText,
                                            activo && estilos.presetChipTextActivo,
                                        ]}
                                    >
                                        {preset.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {rango.preset === 'custom' && (
                            <View style={[estilos.presetChip, estilos.presetChipActivo]}>
                                <Text style={[estilos.presetChipText, estilos.presetChipTextActivo]}>
                                    Personalizado
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* CHIP DEL RANGO ACTIVO */}
                <TouchableOpacity
                    style={[
                        estilos.rangoActivo,
                        { marginHorizontal: responsive.getEspaciado('LG') },
                    ]}
                    onPress={() => aplicarPreset('custom')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="calendar" size={16} color={DISENO.colors.accent} />
                    <Text style={estilos.rangoActivoTexto} numberOfLines={1}>
                        {formatearRango(rango.desde, rango.hasta)} · {diasDelRango(rango.desde, rango.hasta)} días
                    </Text>
                    <Ionicons name="pencil" size={14} color={DISENO.colors.textSecondary} />
                </TouchableOpacity>

                {cargando ? (
                    <View style={estilos.loadingContainer}>
                        <ActivityIndicator size="large" color={DISENO.colors.accent} />
                        <Text style={estilos.loadingTexto}>Cargando...</Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={[
                            estilos.scrollContent,
                            {
                                paddingBottom: insets.bottom + 120,
                                paddingTop: 6,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refrescando}
                                onRefresh={manejarRefresh}
                                tintColor={DISENO.colors.accent}
                                colors={[DISENO.colors.accent]}
                            />
                        }
                    >
                        <FlatList
                            data={tarjetas}
                            keyExtractor={item => item.id}
                            renderItem={renderTarjeta}
                            numColumns={2}
                            scrollEnabled={false}
                            contentContainerStyle={{
                                paddingHorizontal: responsive.getEspaciado('LG'),
                            }}
                            columnWrapperStyle={estilos.columnWrapper}
                        />

                        <View style={{ paddingHorizontal: responsive.getEspaciado('LG') }}>
                            {renderGraficoSemanal()}
                        </View>

                        <View style={{ paddingHorizontal: responsive.getEspaciado('LG') }}>
                            {renderDistribucionEstados()}
                        </View>
                    </ScrollView>
                )}

                {/* ÚLTIMA ACTUALIZACIÓN */}
                <View
                    style={[
                        estilos.contadorContainer,
                        { paddingHorizontal: responsive.getEspaciado('LG') },
                    ]}
                >
                    <Text style={estilos.contador}>
                        {cargando
                            ? ''
                            : `🔄 ${ultimaActualizacion.toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}`}
                    </Text>
                </View>
            </View>

            {/* MODAL DE RANGO CUSTOM */}
            <Modal
                visible={modalRangoVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setModalRangoVisible(false)}
            >
                <View style={estilos.modalFondo}>
                    <View style={estilos.modalContainer}>
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                            style={estilos.modalHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="calendar" size={22} color={DISENO.colors.surface} />
                            <Text style={estilos.modalTitulo}>Rango personalizado</Text>
                            <TouchableOpacity onPress={() => setModalRangoVisible(false)}>
                                <Ionicons name="close" size={22} color={DISENO.colors.surface} />
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={estilos.modalBody}>
                            <Text style={estilos.modalLabel}>Desde</Text>
                            <TouchableOpacity
                                style={estilos.fechaBtn}
                                onPress={() => setMostrarPicker('desde')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={18} color={DISENO.colors.accent} />
                                <Text style={estilos.fechaBtnTexto}>
                                    {tempDesde.toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <Text style={[estilos.modalLabel, { marginTop: 16 }]}>Hasta</Text>
                            <TouchableOpacity
                                style={estilos.fechaBtn}
                                onPress={() => setMostrarPicker('hasta')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={18} color={DISENO.colors.accent} />
                                <Text style={estilos.fechaBtnTexto}>
                                    {tempHasta.toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <View style={estilos.resumenRango}>
                                <Ionicons name="information-circle-outline" size={16} color={DISENO.colors.info} />
                                <Text style={estilos.resumenRangoTexto}>
                                    {diasDelRango(tempDesde, tempHasta)} días seleccionados
                                </Text>
                            </View>
                        </View>

                        <View style={estilos.modalBotones}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalCancelar]}
                                onPress={() => setModalRangoVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalAplicar]}
                                onPress={aplicarRangoCustom}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                                    style={estilos.modalAplicarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="checkmark" size={18} color={DISENO.colors.surface} />
                                    <Text style={estilos.modalAplicarTexto}>Aplicar</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* DATE PICKER */}
            {mostrarPicker && (
                <DateTimePicker
                    value={mostrarPicker === 'desde' ? tempDesde : tempHasta}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onCambiarFecha}
                    maximumDate={new Date()}
                />
            )}

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

    // ✅ PRESETS - CONTENEDOR CON ALTURA FIJA
    presetsWrapper: {
        height: 60,
        marginBottom: 4,
    },
    presetsContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    presetChip: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: DISENO.colors.surface,
        borderWidth: 1.5,
        borderColor: DISENO.colors.border,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    presetChipActivo: {
        backgroundColor: DISENO.colors.accent,
        borderColor: DISENO.colors.accent,
    },
    presetChipText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '700',
        color: DISENO.colors.textSecondary,
    },
    presetChipTextActivo: {
        color: '#FFF',
    },

    // ✅ RANGO ACTIVO - MÁS GRANDE
    rangoActivo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DISENO.colors.accent + '10',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '25',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        minHeight: 44,
    },
    rangoActivoTexto: {
        flex: 1,
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '600',
        color: DISENO.colors.text,
    },

    // LOADING
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
    },
    loadingTexto: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
    },

    // SCROLL
    scrollContent: {
        flexGrow: 1,
    },

    // GRID
    columnWrapper: {
        gap: 10,
        marginBottom: 10,
    },
    tarjetaWrapper: {
        flex: 1,
        maxWidth: '50%',
    },
    tarjeta: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.lg,
        borderLeftWidth: 4,
        minHeight: 100,
        ...DISENO.shadow.sm,
    },
    tarjetaIcono: {
        padding: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    tarjetaValor: {
        fontFamily: FUENTES.display,
        marginBottom: 2,
    },
    tarjetaTitulo: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        color: DISENO.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tarjetaSubtexto: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textTertiary,
        marginTop: 4,
    },

    // SECCIÓN
    seccion: {
        marginTop: 20,
        width: '100%',
    },
    seccionTitulo: {
        fontFamily: FUENTES.display,
        color: DISENO.colors.text,
        marginBottom: 10,
    },

    // GRÁFICO
    graficoCard: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.lg,
        ...DISENO.shadow.sm,
    },
    graficoBarras: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 4,
    },
    barraItem: {
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    barra: {
        width: '80%',
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barraFill: {
        width: '100%',
        borderRadius: 6,
    },
    barraDia: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        fontWeight: '600',
        color: DISENO.colors.textSecondary,
    },
    barraTotal: {
        fontFamily: FUENTES.regular,
        fontSize: 9,
        fontWeight: '700',
        color: DISENO.colors.text,
    },
    barraPedidos: {
        fontFamily: FUENTES.regular,
        fontSize: 9,
        color: DISENO.colors.textTertiary,
        fontWeight: '600',
    },

    // DISTRIBUCIÓN
    distribucionCard: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.lg,
        gap: 14,
        ...DISENO.shadow.sm,
    },
    distribucionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    distribucionIcono: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    distribucionInfo: {
        flex: 1,
        minWidth: 0,
    },
    distribucionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    distribucionNombre: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        color: DISENO.colors.text,
        flex: 1,
        marginRight: 4,
    },
    distribucionPorcentaje: {
        fontFamily: FUENTES.display,
        fontSize: 12,
    },
    distribucionBarraContainer: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    distribucionBarra: {
        height: 6,
        borderRadius: 3,
    },
    distribucionCantidad: {
        fontFamily: FUENTES.display,
        minWidth: 32,
        textAlign: 'right',
    },

    // CONTADOR
    contadorContainer: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    contador: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        color: DISENO.colors.textTertiary,
    },

    // MODAL RANGO
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.xl,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        ...DISENO.shadow.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    modalTitulo: {
        flex: 1,
        fontFamily: FUENTES.display,
        fontSize: 17,
        color: DISENO.colors.surface,
    },
    modalBody: {
        padding: 20,
    },
    modalLabel: {
        fontFamily: FUENTES.display,
        fontSize: 13,
        color: DISENO.colors.text,
        marginBottom: 8,
    },
    fechaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: DISENO.radius.md,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    fechaBtnTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '600',
        color: DISENO.colors.text,
        textTransform: 'capitalize',
        flex: 1,
    },
    resumenRango: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: DISENO.colors.info + '10',
        borderRadius: DISENO.radius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 16,
    },
    resumenRangoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        fontWeight: '600',
        color: DISENO.colors.info,
    },
    modalBotones: {
        flexDirection: 'row',
        gap: 10,
        padding: 20,
        paddingTop: 0,
    },
    modalBoton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    modalAplicar: {
        paddingVertical: 0,
    },
    modalAplicarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        width: '100%',
    },
    modalAplicarTexto: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.surface,
    },

    // ERROR
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DISENO.colors.fondo,
        padding: 20,
    },
    errorText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        marginTop: 12,
        fontSize: 15,
        textAlign: 'center',
    },
    errorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DISENO.colors.accent,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        ...DISENO.shadow.md,
    },
    errorButtonText: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.surface,
    },
});