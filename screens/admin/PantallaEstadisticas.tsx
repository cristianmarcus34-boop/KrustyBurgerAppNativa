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
}

// ============================================================
// 📱 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaEstadisticas(props: any) {
    // ✅ Estados
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [stats, setStats] = useState({
        totalPedidos: 0,
        ingresosTotales: 0,
        pedidosPendientes: 0,
        pedidosHoy: 0,
        ticketPromedio: 0,
        clientesRegistrados: 0,
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
    // 📊 FUNCIONES DE CARGA
    // ============================================================
    const cargarEstadisticas = async () => {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const [
                { count: totalPedidos },
                { count: pendientes },
                { count: pedidosHoy },
                { count: clientes },
                { data: pedidos }
            ] = await Promise.all([
                supabase.from('pedidos').select('*', { count: 'exact', head: true }),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('pedidos').select('*', { count: 'exact', head: true }).gte('creado_en', hoy.toISOString()),
                supabase.from('perfiles').select('*', { count: 'exact', head: true }),
                supabase.from('pedidos').select('total'),
            ]);

            const ingresos = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
            const ticketPromedio = totalPedidos ? ingresos / totalPedidos : 0;

            setStats({
                totalPedidos: totalPedidos || 0,
                ingresosTotales: ingresos,
                pedidosPendientes: pendientes || 0,
                pedidosHoy: pedidosHoy || 0,
                ticketPromedio,
                clientesRegistrados: clientes || 0,
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
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

    // ✅ Ancho de tarjeta con cálculo preciso para alineación perfecta
    const getTarjetaWidth = () => {
        const totalGap = gap;
        if (isTablet) {
            // 3 columnas en tablet
            return (width - (paddingHorizontal * 2) - (totalGap * 2)) / 3;
        } else {
            // 2 columnas en phone
            return (width - (paddingHorizontal * 2) - totalGap) / 2;
        }
    };

    const tarjetaWidth = getTarjetaWidth();

    // ============================================================
    // 📋 DATOS DE TARJETAS
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
            color: '#42A5F5',
            bgColor: '#42A5F5' + '15',
        },
        {
            id: 'ticket-promedio',
            titulo: 'Ticket Promedio',
            valor: `$${stats.ticketPromedio.toFixed(2)}`,
            icono: 'pricetag-outline',
            color: '#AB47BC',
            bgColor: '#AB47BC' + '15',
        },
        {
            id: 'clientes',
            titulo: 'Clientes',
            valor: stats.clientesRegistrados,
            icono: 'people-outline',
            color: '#FF7043',
            bgColor: '#FF7043' + '15',
        },
    ];

    // ============================================================
    // 🎴 RENDER DE TARJETA - SIN translateY
    // ============================================================
    const renderTarjeta = ({ item, index }: { item: TarjetaStats; index: number }) => {
        const delay = index * 100;
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
                        // ✅ ELIMINADO: transform: [{ translateY: itemSlide }],
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
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 🖥️ RENDER PRINCIPAL
    // ============================================================
    return (
        <View style={estilos.contenedor}>
            {/* Fondo con gradiente */}
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ HEADER */}
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

                <View style={{ width: isTablet ? 26 : 22 }} />
            </View>

            {/* ✅ INFO DE ACTUALIZACIÓN */}
            <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal }]}>
                <Text style={[estilos.contador, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                    {cargando
                        ? '⏳ Cargando...'
                        : `🔄 ${new Date().toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}`
                    }
                </Text>
            </View>

            {/* ✅ CONTENIDO */}
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
                        estilos.grid,
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
                    {/* ✅ GRID CONTAINER - ALINEACIÓN PERFECTA */}
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

    // ✅ HEADER
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

    // ✅ INFO ACTUALIZACIÓN
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

    // ✅ LOADING
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

    // ✅ GRID
    grid: {
        flexGrow: 1,
    },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    // ✅ TARJETA
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
});