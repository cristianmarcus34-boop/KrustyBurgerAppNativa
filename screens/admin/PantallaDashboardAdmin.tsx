// screens/admin/PantallaDashboardAdmin.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

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
    naranja: '#FF6F00',
    morado: '#AB47BC',
    celeste: '#42A5F5',
    cyan: '#00BCD4',
    rosa: '#EC407A',
    blanco: '#FFFFFF',
    negro: '#0A0A0A',
    grisOscuro: '#1A1A1A',
    gris: '#333333',
    grisClaro: '#B0B0B0',
};

const { width, height } = Dimensions.get('window');

interface DashboardStats {
    pedidos_hoy: number;
    pedidos_pendientes: number;
    ingresos_hoy: number;
    ingresos_mes: number;
    usuarios_totales: number;
    usuarios_nuevos_hoy: number;
    recompensas_canjeadas_mes: number;
    producto_mas_vendido: { nombre: string; cantidad: number } | null;
    pedidos_por_estado: { estado: string; cantidad: number }[];
    ventas_por_dia: { dia: string; total: number; pedidos: number }[];
}

export default function PantallaDashboardAdmin(props: any) {
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        cargarDashboard();
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

    const cargarDashboard = async () => {
        try {
            setError(null);
            const hoy = new Date().toISOString().split('T')[0];
            const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            // 1. Pedidos de hoy
            const { count: pedidosHoy } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .gte('creado_en', hoy);

            // 2. Pedidos pendientes
            const { count: pedidosPendientes } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .in('estado', ['pendiente', 'confirmado', 'preparando']);

            // 3. Ingresos de hoy
            const { data: ingresosHoyData } = await supabase
                .from('pedidos')
                .select('total')
                .gte('creado_en', hoy)
                .eq('estado', 'entregado');

            const ingresosHoy = ingresosHoyData?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;

            // 4. Ingresos del mes
            const { data: ingresosMesData } = await supabase
                .from('pedidos')
                .select('total')
                .gte('creado_en', primerDiaMes)
                .eq('estado', 'entregado');

            const ingresosMes = ingresosMesData?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;

            // 5. Usuarios totales
            const { count: usuariosTotales } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('rol', 'cliente');

            // 6. Usuarios nuevos hoy
            const { count: usuariosNuevosHoy } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('rol', 'cliente')
                .gte('ultimo_acceso', hoy);

            // 7. Recompensas canjeadas este mes
            const { count: recompensasCanjeadas } = await supabase
                .from('canjes')
                .select('*', { count: 'exact', head: true })
                .gte('fecha', primerDiaMes);

            // 8. Producto más vendido
            const { data: productosVendidos } = await supabase
                .from('pedidos')
                .select('items_json')
                .eq('estado', 'entregado')
                .not('items_json', 'is', null);

            let productoMasVendido: { nombre: string; cantidad: number } | null = null;
            if (productosVendidos) {
                const conteo: { [key: string]: number } = {};
                productosVendidos.forEach(pedido => {
                    if (pedido.items_json && Array.isArray(pedido.items_json)) {
                        pedido.items_json.forEach((item: any) => {
                            const nombre = item.nombre || 'Producto';
                            conteo[nombre] = (conteo[nombre] || 0) + (item.cantidad || 1);
                        });
                    }
                });
                const entries = Object.entries(conteo);
                if (entries.length > 0) {
                    const [nombre, cantidad] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
                    productoMasVendido = { nombre, cantidad };
                }
            }

            // 9. Pedidos por estado
            const { data: pedidosPorEstado } = await supabase
                .from('pedidos')
                .select('estado');

            const estadoCount: { [key: string]: number } = {};
            pedidosPorEstado?.forEach(p => {
                const estado = p.estado || 'desconocido';
                estadoCount[estado] = (estadoCount[estado] || 0) + 1;
            });
            const pedidosPorEstadoArray = Object.entries(estadoCount).map(([estado, cantidad]) => ({
                estado,
                cantidad
            }));

            // 10. Ventas por día (últimos 7 días)
            const ventasPorDia: { dia: string; total: number; pedidos: number }[] = [];
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                const fechaStr = fecha.toISOString().split('T')[0];
                const diaNombre = fecha.toLocaleDateString('es-ES', { weekday: 'short' });

                const { data: ventasDia } = await supabase
                    .from('pedidos')
                    .select('total')
                    .gte('creado_en', fechaStr)
                    .lt('creado_en', new Date(fecha.getTime() + 86400000).toISOString().split('T')[0])
                    .eq('estado', 'entregado');

                const total = ventasDia?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
                const pedidos = ventasDia?.length || 0;

                ventasPorDia.push({
                    dia: diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1),
                    total,
                    pedidos
                });
            }

            setStats({
                pedidos_hoy: pedidosHoy || 0,
                pedidos_pendientes: pedidosPendientes || 0,
                ingresos_hoy: ingresosHoy,
                ingresos_mes: ingresosMes,
                usuarios_totales: usuariosTotales || 0,
                usuarios_nuevos_hoy: usuariosNuevosHoy || 0,
                recompensas_canjeadas_mes: recompensasCanjeadas || 0,
                producto_mas_vendido: productoMasVendido,
                pedidos_por_estado: pedidosPorEstadoArray,
                ventas_por_dia: ventasPorDia
            });
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            setError('Error al cargar las estadísticas');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const onRefresh = async () => {
        setRefrescando(true);
        await cargarDashboard();
    };

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    // Tamaños responsive
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tarjetaPadding = isTablet ? 20 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 32 : isSmallPhone ? 22 : 26;

    // Renderizar tarjeta de estadística
    const StatCard = ({
        icon,
        label,
        value,
        color,
        subtext
    }: {
        icon: string;
        label: string;
        value: string | number;
        color: string;
        subtext?: string;
    }) => (
        <View style={[
            estilos.statCard,
            {
                padding: tarjetaPadding,
                borderRadius: isTablet ? 20 : 16,
                borderColor: color + '30',
                width: (width - paddingHorizontal * 2 - 12) / 2,
            }
        ]}>
            <View style={[
                estilos.statIconContainer,
                {
                    backgroundColor: color + '20',
                    borderRadius: isTablet ? 14 : 10,
                    padding: isTablet ? 12 : 8,
                }
            ]}>
                <Ionicons name={icon as any} size={isTablet ? 28 : 22} color={color} />
            </View>
            <Text style={[
                estilos.statValue,
                {
                    fontSize: isTablet ? 28 : isSmallPhone ? 20 : 24,
                    color: color,
                }
            ]}>
                {typeof value === 'number' && value >= 1000 ? `$${value.toLocaleString()}` : value}
            </Text>
            <Text style={[
                estilos.statLabel,
                {
                    fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                }
            ]}>
                {label}
            </Text>
            {subtext && (
                <Text style={[
                    estilos.statSubtext,
                    {
                        fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10,
                    }
                ]}>
                    {subtext}
                </Text>
            )}
        </View>
    );

    if (cargando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={estilos.loadingText}>Cargando estadísticas...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={estilos.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color={COLORS.rojo} />
                <Text style={estilos.errorText}>{error}</Text>
                <TouchableOpacity style={estilos.errorButton} onPress={onRefresh}>
                    <Text style={estilos.errorButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={onRefresh}
                        tintColor={COLORS.amarillo}
                        colors={[COLORS.amarillo]}
                    />
                }
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingTop: insets.top + (isTablet ? 20 : 10),
                        paddingBottom: insets.bottom + 150,
                    }
                ]}
            >
                {/* ✅ HEADER CON BOTÓN DE VOLVER A PANEL ADMIN */}
                <Animated.View style={[
                    estilos.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    <TouchableOpacity
                        style={estilos.botonVolver}
                        onPress={() => props.navigation.navigate('PanelAdmin')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                    </TouchableOpacity>
                    <View style={estilos.headerCenter}>
                        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                            📊 Dashboard
                        </Text>
                        <Text style={[estilos.subtitulo, { fontSize: isTablet ? 14 : 11 }]}>
                            Resumen del negocio
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            estilos.botonActualizar,
                            {
                                padding: isTablet ? 12 : 8,
                                borderRadius: isTablet ? 14 : 10,
                            }
                        ]}
                        onPress={onRefresh}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={isTablet ? 24 : 20} color={COLORS.blanco} />
                    </TouchableOpacity>
                </Animated.View>

                {/* STATS GRID */}
                <Animated.View style={[
                    estilos.statsGrid,
                    {
                        gap: 12,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    <StatCard
                        icon="receipt-outline"
                        label="Pedidos Hoy"
                        value={stats?.pedidos_hoy || 0}
                        color={COLORS.amarillo}
                        subtext={`${stats?.pedidos_pendientes || 0} pendientes`}
                    />

                    <StatCard
                        icon="cash-outline"
                        label="Ingresos Hoy"
                        value={stats?.ingresos_hoy || 0}
                        color={COLORS.verdeClaro}
                        subtext={stats?.ingresos_hoy ? `$${stats.ingresos_hoy.toLocaleString()}` : '$0'}
                    />

                    <StatCard
                        icon="calendar-outline"
                        label="Ingresos Mes"
                        value={stats?.ingresos_mes || 0}
                        color={COLORS.celeste}
                        subtext={`${stats?.pedidos_hoy || 0} pedidos hoy`}
                    />

                    <StatCard
                        icon="people-outline"
                        label="Clientes"
                        value={stats?.usuarios_totales || 0}
                        color={COLORS.morado}
                        subtext={`${stats?.usuarios_nuevos_hoy || 0} nuevos hoy`}
                    />

                    <StatCard
                        icon="gift-outline"
                        label="Recompensas"
                        value={stats?.recompensas_canjeadas_mes || 0}
                        color={COLORS.rosa}
                        subtext="Canjeadas este mes"
                    />

                    <StatCard
                        icon="restaurant-outline"
                        label="Top Producto"
                        value={stats?.producto_mas_vendido?.nombre || 'N/A'}
                        color={COLORS.naranja}
                        subtext={stats?.producto_mas_vendido?.cantidad ? `${stats.producto_mas_vendido.cantidad} vendidos` : ''}
                    />
                </Animated.View>

                {/* PRODUCTO MÁS VENDIDO */}
                {stats?.producto_mas_vendido && (
                    <Animated.View style={[
                        estilos.seccion,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginTop: 16,
                        }
                    ]}>
                        <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                            🏆 Producto Más Vendido
                        </Text>
                        <View style={[
                            estilos.productoCard,
                            {
                                padding: tarjetaPadding,
                                borderRadius: isTablet ? 16 : 12,
                                borderColor: COLORS.amarillo + '30',
                            }
                        ]}>
                            <Text style={[estilos.productoNombre, { fontSize: isTablet ? 20 : 17 }]}>
                                {stats.producto_mas_vendido.nombre}
                            </Text>
                            <Text style={[estilos.productoCantidad, { fontSize: isTablet ? 14 : 12 }]}>
                                {stats.producto_mas_vendido.cantidad} unidades vendidas
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* PEDIDOS POR ESTADO */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 16,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                        📋 Pedidos por Estado
                    </Text>
                    <View style={estilos.estadosContainer}>
                        {stats?.pedidos_por_estado.map((item, index) => (
                            <View key={index} style={[
                                estilos.estadoItem,
                                {
                                    paddingVertical: isTablet ? 12 : 8,
                                    paddingHorizontal: isTablet ? 16 : 12,
                                    borderRadius: isTablet ? 12 : 8,
                                    backgroundColor: COLORS.negro + '40',
                                    borderColor: COLORS.blanco + '10',
                                }
                            ]}>
                                <View style={estilos.estadoInfo}>
                                    <Text style={[estilos.estadoNombre, { fontSize: isTablet ? 14 : 12 }]}>
                                        {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                                    </Text>
                                    <View style={[
                                        estilos.estadoBarra,
                                        {
                                            width: `${Math.min((item.cantidad / (stats?.pedidos_por_estado.reduce((sum, e) => sum + e.cantidad, 0) || 1)) * 100, 100)}%`,
                                            backgroundColor: getEstadoColor(item.estado),
                                            height: isTablet ? 6 : 4,
                                        }
                                    ]} />
                                </View>
                                <Text style={[estilos.estadoCantidad, { fontSize: isTablet ? 16 : 14 }]}>
                                    {item.cantidad}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* VENTAS POR DÍA */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 16,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                        📈 Ventas Últimos 7 Días
                    </Text>
                    <View style={estilos.ventasContainer}>
                        {stats?.ventas_por_dia.map((item, index) => (
                            <View key={index} style={estilos.ventaItem}>
                                <View style={[
                                    estilos.ventaBarra,
                                    {
                                        height: isTablet ? 80 : 60,
                                        backgroundColor: COLORS.amarillo + '20',
                                        borderRadius: isTablet ? 8 : 6,
                                    }
                                ]}>
                                    <View style={[
                                        estilos.ventaBarraFill,
                                        {
                                            height: `${Math.min((item.total / (stats?.ventas_por_dia.reduce((max, v) => Math.max(max, v.total), 0) || 1)) * 100, 100)}%`,
                                            backgroundColor: COLORS.amarillo,
                                            borderRadius: isTablet ? 8 : 6,
                                        }
                                    ]} />
                                </View>
                                <Text style={[estilos.ventaDia, { fontSize: isTablet ? 12 : 10 }]}>
                                    {item.dia}
                                </Text>
                                <Text style={[estilos.ventaTotal, { fontSize: isTablet ? 12 : 10 }]}>
                                    ${item.total}
                                </Text>
                                <Text style={[estilos.ventaPedidos, { fontSize: isTablet ? 10 : 8 }]}>
                                    {item.pedidos} ped
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* RECOMPENSAS */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 16,
                    }
                ]}>
                    <View style={[
                        estilos.recompensaCard,
                        {
                            padding: tarjetaPadding,
                            borderRadius: isTablet ? 16 : 12,
                            borderColor: COLORS.naranja + '30',
                        }
                    ]}>
                        <View style={estilos.recompensaIcon}>
                            <Ionicons name="gift-outline" size={isTablet ? 32 : 24} color={COLORS.naranja} />
                        </View>
                        <View style={estilos.recompensaInfo}>
                            <Text style={[estilos.recompensaNumero, { fontSize: isTablet ? 28 : 22 }]}>
                                {stats?.recompensas_canjeadas_mes || 0}
                            </Text>
                            <Text style={[estilos.recompensaLabel, { fontSize: isTablet ? 14 : 12 }]}>
                                Recompensas canjeadas este mes
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// Helper para colores de estado
const getEstadoColor = (estado: string): string => {
    switch (estado) {
        case 'pendiente': return COLORS.naranja;
        case 'confirmado': return COLORS.celeste;
        case 'preparando': return COLORS.morado;
        case 'listo': return COLORS.verdeClaro;
        case 'en_camino': return COLORS.cyan;
        case 'entregado': return COLORS.verde;
        case 'cancelado': return COLORS.rojo;
        default: return COLORS.grisClaro;
    }
};

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
    scroll: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    botonVolver: {
        padding: 4,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
    },
    subtitulo: {
        color: COLORS.grisClaro,
        marginTop: 2,
        fontWeight: '300',
        letterSpacing: 0.5,
    },
    botonActualizar: {
        backgroundColor: COLORS.blanco + '10',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    statCard: {
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
        marginBottom: 8,
    },
    statIconContainer: {
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    statValue: {
        fontWeight: 'bold',
    },
    statLabel: {
        color: COLORS.grisClaro,
        opacity: 0.7,
        fontWeight: '500',
    },
    statSubtext: {
        color: COLORS.grisClaro,
        opacity: 0.5,
        marginTop: 2,
    },
    seccion: {
        width: '100%',
    },
    seccionTitulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        marginBottom: 10,
    },
    productoCard: {
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
    },
    productoNombre: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    productoCantidad: {
        color: COLORS.grisClaro,
        opacity: 0.7,
        marginTop: 2,
    },
    estadosContainer: {
        gap: 6,
    },
    estadoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    estadoInfo: {
        flex: 1,
        marginRight: 12,
    },
    estadoNombre: {
        color: COLORS.blanco,
        fontWeight: '500',
        marginBottom: 4,
    },
    estadoBarra: {
        borderRadius: 4,
    },
    estadoCantidad: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    ventasContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingVertical: 8,
        gap: 4,
    },
    ventaItem: {
        alignItems: 'center',
        flex: 1,
    },
    ventaBarra: {
        width: '80%',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: 4,
    },
    ventaBarraFill: {
        width: '100%',
    },
    ventaDia: {
        color: COLORS.grisClaro,
        opacity: 0.6,
        fontWeight: '500',
    },
    ventaTotal: {
        color: COLORS.amarillo,
        fontWeight: 'bold',
    },
    ventaPedidos: {
        color: COLORS.grisClaro,
        opacity: 0.4,
    },
    recompensaCard: {
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recompensaIcon: {
        marginRight: 16,
    },
    recompensaInfo: {
        flex: 1,
    },
    recompensaNumero: {
        fontWeight: 'bold',
        color: COLORS.naranja,
    },
    recompensaLabel: {
        color: COLORS.grisClaro,
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.negro,
    },
    loadingText: {
        color: COLORS.grisClaro,
        marginTop: 12,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.negro,
        padding: 20,
    },
    errorText: {
        color: COLORS.grisClaro,
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: COLORS.amarillo,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    errorButtonText: {
        color: COLORS.negro,
        fontWeight: 'bold',
    },
});