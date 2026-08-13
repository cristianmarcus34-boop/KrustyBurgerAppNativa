// screens/admin/PantallaEstadisticas.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
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
    pendiente: '#FF9800',
    naranja: '#FF6F00',
    morado: '#AB47BC',
    celeste: '#42A5F5',
    cyan: '#00BCD4',
    rosa: '#EC407A',
};

const { width, height } = Dimensions.get('window');

// ============================================================
// 🏷️ TIPADO
// ============================================================
interface TarjetaStats {
    id: string;
    titulo: string;
    valor: string | number;
    icono: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
    subtexto?: string;
}

interface StatsCompletos {
    totalPedidos: number;
    ingresosTotales: number;
    pedidosPendientes: number;
    pedidosHoy: number;
    ticketPromedio: number;
    clientesRegistrados: number;
    // ✅ NUEVAS MÉTRICAS
    pedidosConfirmados: number;
    pedidosPreparando: number;
    pedidosEnCamino: number;
    pedidosEntregados: number;
    pedidosCancelados: number;
    recompensasCanjeadas: number;
    productosVendidos: number;
    ingresosHoy: number;
    ingresosSemana: number;
    ingresosMes: number;
    clientesNuevosHoy: number;
    clientesNuevosSemana: number;
    pedidosUltimaSemana: { dia: string; total: number; pedidos: number }[];
}

// ============================================================
// 📱 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaEstadisticas(props: any) {
    // ✅ Estados
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        ingresosHoy: 0,
        ingresosSemana: 0,
        ingresosMes: 0,
        clientesNuevosHoy: 0,
        clientesNuevosSemana: 0,
        pedidosUltimaSemana: [],
    });

    const insets = useSafeAreaInsets();

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ============================================================
    // 🔄 EFECTOS
    // ============================================================
    useEffect(() => {
        cargarEstadisticas();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // ============================================================
    // 📊 FUNCIONES DE CARGA MEJORADAS
    // ============================================================
    const cargarEstadisticas = async () => {
        try {
            setError(null);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const hoyStr = hoy.toISOString();

            const semanaAtras = new Date(hoy);
            semanaAtras.setDate(semanaAtras.getDate() - 7);
            const semanaStr = semanaAtras.toISOString();

            const mesAtras = new Date(hoy);
            mesAtras.setMonth(mesAtras.getMonth() - 1);
            const mesStr = mesAtras.toISOString();

            // 1. Pedidos totales y por estado
            const [
                { count: totalPedidos },
                { count: pendientes },
                { count: confirmados },
                { count: preparando },
                { count: enCamino },
                { count: entregados },
                { count: cancelados },
                { count: pedidosHoy },
                { data: todosPedidos },
                { count: recompensasCanjeadas },
                { count: clientesTotales },
                { count: clientesNuevosHoy },
                { count: clientesNuevosSemana },
            ] = await Promise.all([
                supabase.from('pedidos').select('*', { count: 'exact', head: true }),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'confirmado'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'preparando'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'en_camino'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'entregado'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'cancelado'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).gte('creado_en', hoyStr),
                supabase.from('pedidos').select('total, items_json, creado_en, estado'),
                supabase.from('canjes').select('*', { count: 'exact', head: true }).gte('fecha', mesStr),
                supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),
                supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').gte('ultimo_acceso', hoyStr),
                supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'cliente').gte('ultimo_acceso', semanaStr),
            ]);

            // 2. Calcular ingresos
            const ingresosTotales = todosPedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const ingresosHoy = todosPedidos
                ?.filter(p => p.creado_en >= hoyStr && p.estado === 'entregado')
                ?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const ingresosSemana = todosPedidos
                ?.filter(p => p.creado_en >= semanaStr && p.estado === 'entregado')
                ?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const ingresosMes = todosPedidos
                ?.filter(p => p.creado_en >= mesStr && p.estado === 'entregado')
                ?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;

            // 3. Productos vendidos
            let productosVendidos = 0;
            todosPedidos?.forEach(p => {
                if (p.items_json && Array.isArray(p.items_json)) {
                    p.items_json.forEach((item: any) => {
                        productosVendidos += item.cantidad || 0;
                    });
                }
            });

            // 4. Pedidos por día (última semana)
            const pedidosUltimaSemana: { dia: string; total: number; pedidos: number }[] = [];
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            for (let i = 6; i >= 0; i--) {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                fecha.setHours(0, 0, 0, 0);
                const fechaStr = fecha.toISOString();
                const diaNombre = diasSemana[fecha.getDay()];

                const pedidosDia = todosPedidos?.filter(p =>
                    p.creado_en >= fechaStr &&
                    p.creado_en < new Date(fecha.getTime() + 86400000).toISOString() &&
                    p.estado === 'entregado'
                ) || [];

                pedidosUltimaSemana.push({
                    dia: diaNombre,
                    total: pedidosDia.reduce((sum, p) => sum + (p.total || 0), 0),
                    pedidos: pedidosDia.length,
                });
            }

            // 5. Ticket promedio
            const ticketPromedio = totalPedidos ? ingresosTotales / totalPedidos : 0;

            setStats({
                totalPedidos: totalPedidos || 0,
                ingresosTotales,
                pedidosPendientes: pendientes || 0,
                pedidosHoy: pedidosHoy || 0,
                ticketPromedio,
                clientesRegistrados: clientesTotales || 0,
                pedidosConfirmados: confirmados || 0,
                pedidosPreparando: preparando || 0,
                pedidosEnCamino: enCamino || 0,
                pedidosEntregados: entregados || 0,
                pedidosCancelados: cancelados || 0,
                recompensasCanjeadas: recompensasCanjeadas || 0,
                productosVendidos,
                ingresosHoy,
                ingresosSemana,
                ingresosMes,
                clientesNuevosHoy: clientesNuevosHoy || 0,
                clientesNuevosSemana: clientesNuevosSemana || 0,
                pedidosUltimaSemana,
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            setError('Error al cargar las estadísticas');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarEstadisticas();
    }, []);

    // ============================================================
    // 📱 RESPONSIVE
    // ============================================================
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    const paddingHorizontal = isTablet ? 32 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 30 : isSmallPhone ? 22 : 26;
    const tarjetaPadding = isTablet ? 16 : isSmallPhone ? 10 : 12;
    const valorSize = isTablet ? 24 : isSmallPhone ? 16 : 18;
    const tituloCardSize = isTablet ? 13 : isSmallPhone ? 10 : 11;
    const iconSize = isTablet ? 30 : isSmallPhone ? 20 : 24;
    const gap = isTablet ? 12 : isSmallPhone ? 8 : 10;
    const minHeight = isTablet ? 110 : isSmallPhone ? 80 : 95;
    const borderRadius = isTablet ? 16 : isSmallPhone ? 10 : 12;

    const getTarjetaWidth = () => {
        const totalGap = gap;
        if (isTablet) {
            return (width - (paddingHorizontal * 2) - (totalGap * 2)) / 3;
        } else {
            return (width - (paddingHorizontal * 2) - totalGap) / 2;
        }
    };

    const tarjetaWidth = getTarjetaWidth();

    // ============================================================
    // 📋 DATOS DE TARJETAS (ACTUALIZADO)
    // ============================================================
    const tarjetas: TarjetaStats[] = [
        {
            id: 'total-pedidos',
            titulo: 'Total Pedidos',
            valor: stats.totalPedidos,
            icono: 'receipt-outline',
            color: COLORS.amarillo,
            bgColor: COLORS.amarillo + '15',
        },
        {
            id: 'ingresos-totales',
            titulo: 'Ingresos Totales',
            valor: `$${stats.ingresosTotales.toFixed(2)}`,
            icono: 'cash-outline',
            color: COLORS.verdeClaro,
            bgColor: COLORS.verdeClaro + '15',
            subtexto: `Mes: $${stats.ingresosMes.toFixed(2)}`,
        },
        {
            id: 'pendientes',
            titulo: 'Pendientes',
            valor: stats.pedidosPendientes,
            icono: 'time-outline',
            color: COLORS.pendiente,
            bgColor: COLORS.pendiente + '15',
        },
        {
            id: 'pedidos-hoy',
            titulo: 'Pedidos Hoy',
            valor: stats.pedidosHoy,
            icono: 'today-outline',
            color: COLORS.celeste,
            bgColor: COLORS.celeste + '15',
            subtexto: `Ingresos: $${stats.ingresosHoy.toFixed(2)}`,
        },
        {
            id: 'ticket-promedio',
            titulo: 'Ticket Promedio',
            valor: `$${stats.ticketPromedio.toFixed(2)}`,
            icono: 'pricetag-outline',
            color: COLORS.morado,
            bgColor: COLORS.morado + '15',
        },
        {
            id: 'clientes',
            titulo: 'Clientes',
            valor: stats.clientesRegistrados,
            icono: 'people-outline',
            color: '#FF7043',
            bgColor: '#FF7043' + '15',
            subtexto: `${stats.clientesNuevosHoy} nuevos hoy`,
        },
        // ✅ NUEVAS TARJETAS
        {
            id: 'entregados',
            titulo: 'Entregados',
            valor: stats.pedidosEntregados,
            icono: 'checkmark-circle-outline',
            color: COLORS.verde,
            bgColor: COLORS.verde + '15',
        },
        {
            id: 'recompensas',
            titulo: 'Recompensas Canjeadas',
            valor: stats.recompensasCanjeadas,
            icono: 'gift-outline',
            color: COLORS.rosa,
            bgColor: COLORS.rosa + '15',
        },
        {
            id: 'productos',
            titulo: 'Productos Vendidos',
            valor: stats.productosVendidos,
            icono: 'restaurant-outline',
            color: COLORS.naranja,
            bgColor: COLORS.naranja + '15',
        },
    ];

    // ============================================================
    // 🎴 RENDER DE TARJETA
    // ============================================================
    const renderTarjeta = ({ item, index }: { item: TarjetaStats; index: number }) => {
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });

        return (
            <Animated.View
                key={item.id}
                style={[
                    {
                        opacity: itemFade,
                        width: tarjetaWidth,
                        marginBottom: gap,
                    }
                ]}
            >
                <View style={[
                    estilos.tarjeta,
                    {
                        padding: tarjetaPadding,
                        borderRadius: borderRadius,
                        backgroundColor: item.bgColor,
                        borderColor: item.color + '30',
                        minHeight: minHeight,
                    }
                ]}>
                    <View style={[
                        estilos.tarjetaIcono,
                        {
                            backgroundColor: item.color + '20',
                            padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                            borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                            marginBottom: 6,
                        }
                    ]}>
                        <Ionicons name={item.icono} size={iconSize} color={item.color} />
                    </View>
                    <Text style={[estilos.tarjetaValor, { fontSize: valorSize, color: item.color }]}>
                        {item.valor}
                    </Text>
                    <Text style={[estilos.tarjetaTitulo, { fontSize: tituloCardSize }]}>
                        {item.titulo}
                    </Text>
                    {item.subtexto && (
                        <Text style={[estilos.tarjetaSubtexto, { fontSize: tituloCardSize - 2 }]}>
                            {item.subtexto}
                        </Text>
                    )}
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 📈 RENDER DE GRÁFICO SEMANAL
    // ============================================================
    const renderGraficoSemanal = () => {
        const maxValor = Math.max(...stats.pedidosUltimaSemana.map(d => d.total), 1);

        return (
            <Animated.View style={[estilos.seccion, { opacity: fadeAnim }]}>
                <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                    📈 Ventas Última Semana
                </Text>
                <View style={[
                    estilos.graficoContainer,
                    {
                        padding: tarjetaPadding,
                        borderRadius: borderRadius,
                        backgroundColor: COLORS.negro + '50',
                        borderColor: COLORS.blanco + '10',
                    }
                ]}>
                    <View style={estilos.graficoBarras}>
                        {stats.pedidosUltimaSemana.map((item, index) => (
                            <View key={index} style={estilos.barraItem}>
                                <View style={[
                                    estilos.barra,
                                    {
                                        height: isTablet ? 80 : 60,
                                        backgroundColor: COLORS.amarillo + '20',
                                        borderRadius: isTablet ? 8 : 6,
                                    }
                                ]}>
                                    <View style={[
                                        estilos.barraFill,
                                        {
                                            height: `${Math.min((item.total / maxValor) * 100, 100)}%`,
                                            backgroundColor: COLORS.amarillo,
                                            borderRadius: isTablet ? 8 : 6,
                                        }
                                    ]} />
                                </View>
                                <Text style={[estilos.barraDia, { fontSize: isTablet ? 12 : 10 }]}>
                                    {item.dia}
                                </Text>
                                <Text style={[estilos.barraTotal, { fontSize: isTablet ? 11 : 9 }]}>
                                    ${item.total}
                                </Text>
                                <Text style={[estilos.barraPedidos, { fontSize: isTablet ? 10 : 8 }]}>
                                    {item.pedidos} ped
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 📊 RENDER DE DISTRIBUCIÓN DE ESTADOS
    // ============================================================
    const renderDistribucionEstados = () => {
        const estados = [
            { key: 'Pendientes', value: stats.pedidosPendientes, color: COLORS.pendiente },
            { key: 'Confirmados', value: stats.pedidosConfirmados, color: COLORS.celeste },
            { key: 'Preparando', value: stats.pedidosPreparando, color: COLORS.morado },
            { key: 'En Camino', value: stats.pedidosEnCamino, color: COLORS.cyan },
            { key: 'Entregados', value: stats.pedidosEntregados, color: COLORS.verde },
            { key: 'Cancelados', value: stats.pedidosCancelados, color: COLORS.rojo },
        ];

        const total = estados.reduce((sum, e) => sum + e.value, 0) || 1;

        return (
            <Animated.View style={[estilos.seccion, { opacity: fadeAnim }]}>
                <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                    📋 Distribución de Pedidos
                </Text>
                <View style={[
                    estilos.distribucionContainer,
                    {
                        padding: tarjetaPadding,
                        borderRadius: borderRadius,
                        backgroundColor: COLORS.negro + '50',
                        borderColor: COLORS.blanco + '10',
                    }
                ]}>
                    {estados.map((estado, index) => (
                        <View key={index} style={estilos.distribucionItem}>
                            <View style={estilos.distribucionInfo}>
                                <Text style={[estilos.distribucionNombre, { fontSize: isTablet ? 14 : 12 }]}>
                                    {estado.key}
                                </Text>
                                <View style={[
                                    estilos.distribucionBarra,
                                    {
                                        width: `${Math.min((estado.value / total) * 100, 100)}%`,
                                        backgroundColor: estado.color,
                                        height: isTablet ? 6 : 4,
                                    }
                                ]} />
                            </View>
                            <Text style={[estilos.distribucionCantidad, { fontSize: isTablet ? 16 : 14, color: estado.color }]}>
                                {estado.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 🖥️ RENDER PRINCIPAL
    // ============================================================
    if (error) {
        return (
            <View style={estilos.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color={COLORS.rojo} />
                <Text style={estilos.errorText}>{error}</Text>
                <TouchableOpacity style={estilos.errorButton} onPress={manejarRefresh}>
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

            <View style={[
                estilos.header,
                {
                    paddingTop: insets.top + (isTablet ? 16 : 8),
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 14 : 10,
                }
            ]}>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 26 : 22} color={COLORS.blanco} />
                </TouchableOpacity>

                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                    📊 Estadísticas
                </Text>

                <TouchableOpacity
                    style={estilos.botonRefresh}
                    onPress={manejarRefresh}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh" size={isTablet ? 22 : 18} color={COLORS.blanco} />
                </TouchableOpacity>
            </View>

            <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal }]}>
                <Text style={[estilos.contador, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                    {cargando
                        ? '⏳ Cargando...'
                        : `🔄 Actualizado: ${new Date().toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}`
                    }
                </Text>
            </View>

            {cargando ? (
                <View style={estilos.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.amarillo} />
                    <Text style={[estilos.loadingTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                        Cargando estadísticas...
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[
                        estilos.scrollContent,
                        {
                            paddingHorizontal: paddingHorizontal,
                            paddingBottom: insets.bottom + (isTablet ? 80 : 60),
                            paddingTop: 6,
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={manejarRefresh}
                            tintColor={COLORS.amarillo}
                            colors={[COLORS.amarillo]}
                        />
                    }
                >
                    <View style={[
                        estilos.gridContainer,
                        {
                            gap: gap,
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                        }
                    ]}>
                        {tarjetas.map((item, index) => renderTarjeta({ item, index }))}
                    </View>

                    {/* GRÁFICO SEMANAL */}
                    {renderGraficoSemanal()}

                    {/* DISTRIBUCIÓN DE ESTADOS */}
                    {renderDistribucionEstados()}
                </ScrollView>
            )}
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
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

    botonRefresh: {
        padding: 8,
        backgroundColor: COLORS.blanco + '10',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },

    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },

    contadorContainer: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '5',
    },

    contador: {
        color: COLORS.grisClaro,
        fontWeight: '500',
        opacity: 0.6,
        textAlign: 'center',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
    },

    loadingTexto: {
        color: COLORS.grisClaro,
        fontWeight: '400',
        opacity: 0.7,
    },

    scrollContent: {
        flexGrow: 1,
    },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    tarjeta: {
        borderWidth: 1,
        alignItems: 'flex-start',
    },

    tarjetaIcono: {
        marginBottom: 6,
    },

    tarjetaValor: {
        fontWeight: 'bold',
        marginBottom: 2,
    },

    tarjetaTitulo: {
        color: COLORS.grisClaro,
        fontWeight: '500',
        opacity: 0.7,
    },

    tarjetaSubtexto: {
        color: COLORS.grisClaro,
        opacity: 0.5,
        marginTop: 2,
    },

    seccion: {
        marginTop: 16,
        width: '100%',
    },

    seccionTitulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        marginBottom: 10,
    },

    graficoContainer: {
        borderWidth: 1,
    },

    graficoBarras: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingVertical: 8,
        gap: 4,
    },

    barraItem: {
        alignItems: 'center',
        flex: 1,
    },

    barra: {
        width: '80%',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        marginBottom: 4,
    },

    barraFill: {
        width: '100%',
    },

    barraDia: {
        color: COLORS.grisClaro,
        opacity: 0.6,
        fontWeight: '500',
    },

    barraTotal: {
        color: COLORS.amarillo,
        fontWeight: 'bold',
    },

    barraPedidos: {
        color: COLORS.grisClaro,
        opacity: 0.4,
    },

    distribucionContainer: {
        borderWidth: 1,
        gap: 8,
    },

    distribucionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    distribucionInfo: {
        flex: 1,
        marginRight: 12,
    },

    distribucionNombre: {
        color: COLORS.blanco,
        fontWeight: '500',
        marginBottom: 4,
    },

    distribucionBarra: {
        borderRadius: 4,
    },

    distribucionCantidad: {
        fontWeight: 'bold',
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