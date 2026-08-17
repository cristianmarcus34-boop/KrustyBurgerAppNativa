// screens/cliente/PantallaMisCupones.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { cuponService } from '../../lib/cupones/cuponService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores, getTematica } from '../../lib/colores';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';

// Componente de tarjeta de cupón
const CuponCard = ({ cuponUsuario }: { cuponUsuario: CuponUsuario }) => {
    const cupon = cuponUsuario.cupon;
    if (!cupon) return null;

    const expirado = new Date(cupon.fecha_expiracion) < new Date();
    const usado = cuponUsuario.usado_en_pedido;

    return (
        <View style={[styles.cuponCard, (expirado || usado) && styles.cuponCardUsado]}>
            <LinearGradient
                colors={expirado || usado ? ['#333', '#222'] : [Colores.primario + '33', Colores.secundario + '33']}
                style={styles.cuponGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cuponHeader}>
                    <View style={styles.cuponTipo}>
                        <Text style={styles.cuponTipoTexto}>
                            {cupon.tipo === 'descuento' && '💰 Descuento'}
                            {cupon.tipo === 'producto_gratis' && '🎁 Producto Gratis'}
                            {cupon.tipo === 'envio_gratis' && '📦 Envío Gratis'}
                            {cupon.tipo === '2x1' && '🔄 2x1'}
                        </Text>
                    </View>
                    <View style={[styles.cuponEstado, usado && styles.cuponEstadoUsado]}>
                        <Text style={styles.cuponEstadoTexto}>
                            {usado ? 'Usado' : expirado ? 'Expirado' : 'Activo'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.cuponTitulo, (expirado || usado) && styles.cuponTituloUsado]}>
                    {cupon.titulo}
                </Text>

                {cupon.descripcion && (
                    <Text style={[styles.cuponDescripcion, (expirado || usado) && styles.cuponDescripcionUsado]}>
                        {cupon.descripcion}
                    </Text>
                )}

                <View style={styles.cuponFooter}>
                    <View style={styles.cuponCodigoContainer}>
                        <Text style={styles.cuponCodigoLabel}>Código</Text>
                        <Text style={styles.cuponCodigo}>{cupon.codigo}</Text>
                    </View>
                    <View style={styles.cuponValorContainer}>
                        <Text style={styles.cuponValor}>
                            {cuponService.formatearDescuento(cupon)}
                        </Text>
                    </View>
                </View>

                {cuponUsuario.fecha_canje && (
                    <Text style={styles.cuponFecha}>
                        Canjeado: {new Date(cuponUsuario.fecha_canje).toLocaleDateString()}
                    </Text>
                )}

                {cuponUsuario.pedido_id && (
                    <View style={styles.cuponPedido}>
                        <Ionicons name="receipt-outline" size={14} color={Colores.textoGris} />
                        <Text style={styles.cuponPedidoTexto}>Pedido #{cuponUsuario.pedido_id}</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

export default function PantallaMisCupones({ navigation }: any) {
    const { perfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const temaKrusty = getTematica('krusty');

    const [cupones, setCupones] = useState<CuponUsuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'usados' | 'expirados'>('todos');

    const cargarCupones = useCallback(async () => {
        if (!perfil?.id) return;

        try {
            const data = await cuponService.obtenerCuponesUsuario(perfil.id);
            setCupones(data);
        } catch (error) {
            console.error('Error cargando cupones:', error);
            Alert.alert('Error', 'No se pudieron cargar tus cupones');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, [perfil?.id]);

    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    const onRefresh = () => {
        setRefrescando(true);
        cargarCupones();
    };

    const cuponesFiltrados = cupones.filter((cu) => {
        const cupon = cu.cupon;
        if (!cupon) return false;
        const expirado = new Date(cupon.fecha_expiracion) < new Date();

        if (filtro === 'activos') return !cu.usado_en_pedido && !expirado && cupon.activo;
        if (filtro === 'usados') return cu.usado_en_pedido;
        if (filtro === 'expirados') return expirado;
        return true;
    });

    if (cargando) {
        return (
            <View style={[styles.centrado, { backgroundColor: Colores.fondoOscuro }]}>
                <ActivityIndicator size="large" color={Colores.secundario} />
                <Text style={styles.cargandoTexto}>Cargando tus cupones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={[Colores.secundario]} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color={Colores.textoClaro} />
                    </TouchableOpacity>
                    <Text style={styles.title}>🎫 Mis Cupones</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CanjearCupon')} style={styles.scanButton}>
                        <Ionicons name="scan-outline" size={24} color={Colores.textoClaro} />
                    </TouchableOpacity>
                </View>

                {/* Contador */}
                <View style={styles.counterContainer}>
                    <Text style={styles.counterText}>
                        Tienes <Text style={styles.counterNumber}>
                            {cupones.filter(c => !c.usado_en_pedido && new Date(c.cupon!.fecha_expiracion) > new Date() && c.cupon!.activo).length}
                        </Text> cupones disponibles
                    </Text>
                </View>

                {/* Filtros */}
                <View style={styles.filtrosContainer}>
                    {['todos', 'activos', 'usados', 'expirados'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filtroBoton, filtro === f && styles.filtroBotonActivo]}
                            onPress={() => setFiltro(f as any)}
                        >
                            <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoActivo]}>
                                {f === 'todos' && 'Todos'}
                                {f === 'activos' && 'Activos'}
                                {f === 'usados' && 'Usados'}
                                {f === 'expirados' && 'Expirados'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Lista de cupones */}
                {cuponesFiltrados.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="gift-outline" size={64} color={Colores.textoGris + '40'} />
                        <Text style={styles.emptyTitle}>No hay cupones</Text>
                        <Text style={styles.emptyText}>
                            {filtro === 'todos' && 'Aún no tienes cupones. ¡Canjea uno ahora!'}
                            {filtro === 'activos' && 'No tienes cupones activos disponibles'}
                            {filtro === 'usados' && 'No has usado ningún cupón aún'}
                            {filtro === 'expirados' && 'No tienes cupones expirados'}
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('CanjearCupon')}
                        >
                            <Text style={styles.emptyButtonText}>Canjear cupón</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.cuponesList}>
                        {cuponesFiltrados.map((cu) => (
                            <CuponCard key={cu.id} cuponUsuario={cu} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colores.fondoOscuro,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
        opacity: 0.2,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cargandoTexto: {
        color: Colores.textoGris,
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colores.textoClaro,
    },
    scanButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    counterContainer: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        alignItems: 'center',
    },
    counterText: {
        fontSize: 15,
        color: Colores.textoGris,
    },
    counterNumber: {
        color: Colores.secundario,
        fontWeight: 'bold',
        fontSize: 18,
    },
    filtrosContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    filtroBoton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    filtroBotonActivo: {
        backgroundColor: Colores.secundario + '30',
        borderColor: Colores.secundario,
    },
    filtroTexto: {
        fontSize: 13,
        color: Colores.textoGris,
        fontWeight: '500',
    },
    filtroTextoActivo: {
        color: Colores.textoClaro,
    },
    cuponesList: {
        gap: 12,
        paddingBottom: 20,
    },
    cuponCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cuponCardUsado: {
        opacity: 0.6,
    },
    cuponGradiente: {
        padding: 16,
        gap: 8,
    },
    cuponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cuponTipo: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cuponTipoTexto: {
        fontSize: 12,
        color: Colores.textoClaro,
        fontWeight: '500',
    },
    cuponEstado: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    cuponEstadoUsado: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cuponEstadoTexto: {
        fontSize: 11,
        color: Colores.textoClaro,
        fontWeight: '600',
    },
    cuponTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colores.textoClaro,
    },
    cuponTituloUsado: {
        color: Colores.textoGris,
    },
    cuponDescripcion: {
        fontSize: 14,
        color: Colores.textoGris,
        lineHeight: 20,
    },
    cuponDescripcionUsado: {
        color: Colores.textoGris + '80',
    },
    cuponFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    cuponCodigoContainer: {
        gap: 2,
    },
    cuponCodigoLabel: {
        fontSize: 10,
        color: Colores.textoGris + '60',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cuponCodigo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        letterSpacing: 1.5,
    },
    cuponValorContainer: {
        backgroundColor: Colores.secundario + '20',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
    },
    cuponValor: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.secundario,
    },
    cuponFecha: {
        fontSize: 12,
        color: Colores.textoGris + '60',
        marginTop: 4,
    },
    cuponPedido: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    cuponPedidoTexto: {
        fontSize: 12,
        color: Colores.textoGris + '80',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colores.textoGris,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    emptyButton: {
        marginTop: 24,
        backgroundColor: Colores.secundario,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 14,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoOscuro,
    },
});