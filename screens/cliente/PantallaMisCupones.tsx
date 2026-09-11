// screens/cliente/PantallaMisCupones.tsx - CON SIMPSONFONT Y DISEÑO CENTRALIZADO
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
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import { cuponService } from '../../lib/cupones/cuponService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO, useResponsive } from '../../lib/colores';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';
import { useToast, Toast } from '../../components/Toast';
// ✅ IMPORTAMOS FUENTES
import { FUENTES } from '../../lib/fuentes';

// ============================================================
// 🎨 COMPONENTE DE TARJETA DE CUPÓN - CON SIMPSONFONT
// ============================================================
const CuponCard = ({
    cuponUsuario,
    onCopiarCodigo,
    navigation,
}: {
    cuponUsuario: CuponUsuario;
    onCopiarCodigo: (codigo: string) => void;
    navigation: any;
}) => {
    const cupon = cuponUsuario.cupon;
    if (!cupon) return null;

    const ahora = new Date();
    const expiracion = new Date(cupon.fecha_expiracion);
    const expirado = expiracion < ahora;
    const usado = cuponUsuario.usado_en_pedido;

    const diasRestantes = Math.ceil((expiracion.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

    // ✅ Determinar estado y colores
    let estado = 'Activo';
    let estadoColor = DISENO.colors.success;
    let estadoIcono = 'checkmark-circle';
    let estadoBg = 'rgba(67, 160, 71, 0.12)';

    if (usado) {
        estado = 'Usado';
        estadoColor = DISENO.colors.textSecondary;
        estadoIcono = 'checkmark-done-circle';
        estadoBg = 'rgba(0,0,0,0.04)';
    } else if (expirado) {
        estado = 'Expirado';
        estadoColor = DISENO.colors.danger;
        estadoIcono = 'alert-circle';
        estadoBg = 'rgba(229, 57, 53, 0.12)';
    } else if (diasRestantes <= 3) {
        estado = `¡Vence en ${diasRestantes} días!`;
        estadoColor = DISENO.colors.warning;
        estadoIcono = 'time';
        estadoBg = 'rgba(255, 152, 0, 0.12)';
    }

    const tipoTexto =
        cupon.tipo === 'descuento' ? '💰 Descuento' :
            cupon.tipo === 'producto_gratis' ? '🎁 Producto Gratis' :
                cupon.tipo === 'envio_gratis' ? '📦 Envío Gratis' :
                    cupon.tipo === '2x1' ? '🔄 2x1' : '🎟️ Cupón';

    const tipoColor =
        cupon.tipo === 'descuento' ? DISENO.colors.success :
            cupon.tipo === 'producto_gratis' ? DISENO.colors.warning :
                cupon.tipo === 'envio_gratis' ? DISENO.colors.info :
                    cupon.tipo === '2x1' ? DISENO.colors.morado : DISENO.colors.textSecondary;

    return (
        <View style={[
            styles.cuponCard,
            (expirado || usado) && styles.cuponCardInactivo,
            !usado && !expirado && diasRestantes <= 3 && styles.cuponCardPorVencer
        ]}>
            {/* ENCABEZADO */}
            <View style={styles.cuponHeader}>
                <View style={[styles.cuponTipo, { borderColor: tipoColor + '40' }]}>
                    {/* ✅ TIPO CON SIMPSONFONT - REDUCIDO */}
                    <Text style={[styles.cuponTipoTexto, { color: tipoColor }]}>
                        {tipoTexto}
                    </Text>
                </View>
                <View style={[styles.cuponEstado, { backgroundColor: estadoBg }]}>
                    <Ionicons name={estadoIcono as any} size={14} color={estadoColor} />
                    {/* ✅ ESTADO CON FUENTE REGULAR */}
                    <Text style={[styles.cuponEstadoTexto, { color: estadoColor }]}>
                        {estado}
                    </Text>
                </View>
            </View>

            {/* TÍTULO */}
            {/* ✅ TÍTULO CON SIMPSONFONT - REDUCIDO */}
            <Text style={[
                styles.cuponTitulo,
                (expirado || usado) && styles.cuponTituloInactivo
            ]}>
                {cupon.titulo}
            </Text>

            {/* DESCRIPCIÓN */}
            {cupon.descripcion && (
                <Text style={[
                    styles.cuponDescripcion,
                    (expirado || usado) && styles.cuponTextoInactivo
                ]}>
                    {cupon.descripcion}
                </Text>
            )}

            {/* VALOR DEL DESCUENTO */}
            <View style={styles.cuponValorGrande}>
                {/* ✅ VALOR CON SIMPSONFONT - REDUCIDO */}
                <Text style={[
                    styles.cuponValorGrandeTexto,
                    { color: (expirado || usado) ? DISENO.colors.textTertiary : DISENO.colors.accent }
                ]}>
                    {cuponService.formatearDescuento(cupon)}
                </Text>
                {!usado && !expirado && (
                    <View style={styles.cuponValorBadge}>
                        <Text style={styles.cuponValorBadgeText}>¡Válido!</Text>
                    </View>
                )}
            </View>

            {/* CÓDIGO */}
            <View style={styles.cuponFooter}>
                <View style={styles.cuponCodigoContainer}>
                    <Text style={styles.cuponCodigoLabel}>🔑 Código</Text>
                    <View style={styles.cuponCodigoRow}>
                        {/* ✅ CÓDIGO CON MONO */}
                        <Text style={styles.cuponCodigo}>{cupon.codigo}</Text>
                        <TouchableOpacity
                            style={styles.cuponCopiarBoton}
                            onPress={() => onCopiarCodigo(cupon.codigo)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="copy-outline" size={16} color={DISENO.colors.accent} />
                            {/* ✅ TEXTO COPIAR CON SIMPSONFONT */}
                            <Text style={styles.cuponCopiarTexto}>Copiar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* VENCIMIENTO */}
            {!usado && !expirado && (
                <View style={styles.cuponVencimiento}>
                    <Ionicons name="calendar-outline" size={14} color={DISENO.colors.textSecondary} />
                    <Text style={styles.cuponVencimientoTexto}>
                        Vence el {expiracion.toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}
                        {diasRestantes > 0 && ` (${diasRestantes} días)`}
                    </Text>
                </View>
            )}

            {/* FECHA DE CANJE */}
            {usado && cuponUsuario.fecha_canje && (
                <Text style={styles.cuponFecha}>
                    ✅ Usado el {new Date(cuponUsuario.fecha_canje).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                </Text>
            )}

            {/* FECHA DE EXPIRACIÓN */}
            {expirado && (
                <Text style={[styles.cuponFecha, { color: DISENO.colors.danger }]}>
                    ⏰ Expirado el {expiracion.toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                </Text>
            )}

            {/* PEDIDO */}
            {cuponUsuario.pedido_id && (
                <View style={styles.cuponPedido}>
                    <Ionicons name="receipt-outline" size={14} color={DISENO.colors.textSecondary} />
                    <Text style={styles.cuponPedidoTexto}>
                        Pedido #{cuponUsuario.pedido_id}
                    </Text>
                </View>
            )}

            {/* BOTÓN USAR CUPÓN */}
            {!usado && !expirado && (
                <TouchableOpacity
                    style={styles.cuponUsarBoton}
                    onPress={() => {
                        navigation.navigate('Carrito', {
                            cuponAplicado: cupon,
                        });
                    }}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={[DISENO.colors.gradientButtonStart, DISENO.colors.gradientButtonEnd]}
                        style={styles.cuponUsarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="cart-outline" size={18} color={DISENO.colors.text} />
                        {/* ✅ BOTÓN USAR CON SIMPSONFONT - REDUCIDO */}
                        <Text style={styles.cuponUsarTexto}>Usar en mi pedido</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};

// ============================================================
// 🖥️ PANTALLA PRINCIPAL
// ============================================================
export default function PantallaMisCupones({ navigation }: any) {
    const { perfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

    const [cupones, setCupones] = useState<CuponUsuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'usados' | 'expirados'>('todos');

    const copiarCodigo = async (codigo: string) => {
        try {
            await Clipboard.setStringAsync(codigo);
            toast.exito(`✅ Código ${codigo} copiado`);
        } catch (error) {
            console.error('Error copiando:', error);
            toast.error('No se pudo copiar el código');
        }
    };

    const cargarCupones = useCallback(async () => {
        if (!perfil?.id) return;
        try {
            const data = await cuponService.obtenerCuponesUsuario(perfil.id);
            setCupones(data);
        } catch (error) {
            console.error('Error cargando cupones:', error);
            toast.error('No se pudieron cargar tus cupones');
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

    const activos = cupones.filter(c =>
        !c.usado_en_pedido &&
        new Date(c.cupon!.fecha_expiracion) > new Date() &&
        c.cupon!.activo
    ).length;

    const usados = cupones.filter(c => c.usado_en_pedido).length;
    const expirados = cupones.filter(c =>
        !c.usado_en_pedido &&
        new Date(c.cupon!.fecha_expiracion) < new Date()
    ).length;

    if (cargando) {
        return (
            <View style={[styles.centrado, { backgroundColor: DISENO.colors.fondo }]}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={styles.cargandoTexto}>Cargando tus cupones...</Text>
            </View>
        );
    }

    const padding = responsive.getEspaciado('LG');

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingTop: insets.top + responsive.spacing(16),
                        paddingBottom: insets.bottom + responsive.spacing(48) * 2,
                        paddingHorizontal: padding,
                    }
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
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={28} color={DISENO.colors.text} />
                    </TouchableOpacity>
                    {/* ✅ TÍTULO CON SIMPSONFONT - REDUCIDO */}
                    <Text style={[
                        styles.title,
                        { fontSize: responsive.getValor({ tablet: 22, normal: 18, small: 16 }) }
                    ]}>
                        🎫 Mis Cupones
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CanjearCupon')}
                        style={styles.scanButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="scan-outline" size={24} color={DISENO.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* RESUMEN */}
                <View style={styles.resumenContainer}>
                    <View style={styles.resumenCard}>
                        <View style={styles.resumenItem}>
                            {/* ✅ NÚMEROS CON SIMPSONFONT - REDUCIDOS */}
                            <Text style={styles.resumenNumero}>{activos}</Text>
                            <Text style={styles.resumenLabel}>Activos</Text>
                            <View style={[styles.resumenDot, { backgroundColor: DISENO.colors.success }]} />
                        </View>
                        <View style={styles.resumenDivider} />
                        <View style={styles.resumenItem}>
                            <Text style={styles.resumenNumero}>{usados}</Text>
                            <Text style={styles.resumenLabel}>Usados</Text>
                            <View style={[styles.resumenDot, { backgroundColor: DISENO.colors.textTertiary }]} />
                        </View>
                        <View style={styles.resumenDivider} />
                        <View style={styles.resumenItem}>
                            <Text style={styles.resumenNumero}>{expirados}</Text>
                            <Text style={styles.resumenLabel}>Expirados</Text>
                            <View style={[styles.resumenDot, { backgroundColor: DISENO.colors.danger }]} />
                        </View>
                    </View>
                </View>

                {/* AYUDA */}
                {activos > 0 && (
                    <View style={styles.ayudaContainer}>
                        <Ionicons name="bulb-outline" size={18} color={DISENO.colors.accentSecondary} />
                        <Text style={styles.ayudaTexto}>
                            💡 Tocá un cupón activo para copiar su código y usarlo en tu pedido
                        </Text>
                    </View>
                )}

                {/* FILTROS */}
                <View style={styles.filtrosContainer}>
                    {['todos', 'activos', 'usados', 'expirados'].map((f) => {
                        const esActivo = filtro === f;
                        const cant = f === 'todos' ? cupones.length :
                            f === 'activos' ? activos :
                                f === 'usados' ? usados : expirados;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filtroBoton,
                                    esActivo && styles.filtroBotonActivo,
                                ]}
                                onPress={() => setFiltro(f as any)}
                                activeOpacity={0.7}
                            >
                                {/* ✅ FILTROS CON SIMPSONFONT - REDUCIDOS */}
                                <Text style={[
                                    styles.filtroTexto,
                                    esActivo && styles.filtroTextoActivo
                                ]}>
                                    {f === 'todos' && '📋 Todos'}
                                    {f === 'activos' && `✅ Activos (${cant})`}
                                    {f === 'usados' && `📌 Usados (${cant})`}
                                    {f === 'expirados' && `⏰ Expirados (${cant})`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* LISTA DE CUPONES */}
                {cuponesFiltrados.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="gift-outline" size={64} color={DISENO.colors.textTertiary} />
                        </View>
                        {/* ✅ EMPTY TITLE CON SIMPSONFONT */}
                        <Text style={styles.emptyTitle}>
                            {filtro === 'todos' && '🎯 No tienes cupones aún'}
                            {filtro === 'activos' && '✅ No tienes cupones activos'}
                            {filtro === 'usados' && '📌 No has usado ningún cupón'}
                            {filtro === 'expirados' && '⏰ No tienes cupones expirados'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {filtro === 'todos' && 'Escaneá un código QR o ingresá uno manualmente para canjear tu primer cupón 🚀'}
                            {filtro === 'activos' && 'Canjeá un cupón nuevo para verlo aquí'}
                            {filtro === 'usados' && 'Cuando uses un cupón aparecerá aquí'}
                            {filtro === 'expirados' && '¡Buenas noticias! No tienes cupones vencidos'}
                        </Text>
                        {filtro !== 'usados' && filtro !== 'expirados' && (
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('CanjearCupon')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="scan-outline" size={20} color={DISENO.colors.text} />
                                {/* ✅ BOTÓN EMPTY CON SIMPSONFONT */}
                                <Text style={styles.emptyButtonText}>Canjear cupón</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.cuponesList}>
                        {cuponesFiltrados.map((cu) => (
                            <CuponCard
                                key={cu.id}
                                cuponUsuario={cu}
                                onCopiarCodigo={copiarCodigo}
                                navigation={navigation}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            <Toast
                visible={toast.visible}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                ocultar={toast.ocultar}
            />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - CON SIMPSONFONT
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DISENO.colors.fondo,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scroll: {
        flexGrow: 1,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ CARGANDO CON SIMPSONFONT
    cargandoTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.textSecondary,
        marginTop: 16,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        padding: 10,
        borderRadius: 14,
        backgroundColor: DISENO.colors.surface,
        ...DISENO.shadow.sm,
    },
    // ✅ TÍTULO CON SIMPSONFONT
    title: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.text,
        letterSpacing: 0.5,
    },
    scanButton: {
        padding: 10,
        borderRadius: 14,
        backgroundColor: DISENO.colors.surface,
        ...DISENO.shadow.sm,
    },
    // Resumen
    resumenContainer: {
        marginBottom: 16,
    },
    resumenCard: {
        flexDirection: 'row',
        backgroundColor: DISENO.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    resumenItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    // ✅ NÚMEROS CON SIMPSONFONT - REDUCIDOS
    resumenNumero: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 24,
        color: DISENO.colors.text,
    },
    // ✅ LABEL CON FUENTE REGULAR
    resumenLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
    resumenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 4,
    },
    resumenDivider: {
        width: 1,
        backgroundColor: DISENO.colors.border,
    },
    // Ayuda
    ayudaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 197, 24, 0.08)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(245, 197, 24, 0.15)',
    },
    // ✅ AYUDA CON FUENTE REGULAR
    ayudaTexto: {
        fontFamily: FUENTES.regular,
        flex: 1,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        lineHeight: 18,
    },
    // Filtros
    filtrosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    filtroBoton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: DISENO.colors.surface,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    filtroBotonActivo: {
        backgroundColor: DISENO.colors.accent + '15',
        borderColor: DISENO.colors.accent,
    },
    // ✅ FILTROS CON SIMPSONFONT - REDUCIDOS
    filtroTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 12,
        color: DISENO.colors.textSecondary,
    },
    filtroTextoActivo: {
        color: DISENO.colors.accent,
    },
    // Lista
    cuponesList: {
        gap: 12,
        paddingBottom: 20,
    },
    // Tarjeta de cupón
    cuponCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        backgroundColor: DISENO.colors.surface,
        padding: 16,
        gap: 8,
        ...DISENO.shadow.sm,
    },
    cuponCardInactivo: {
        opacity: 0.6,
    },
    cuponCardPorVencer: {
        borderColor: DISENO.colors.warning,
        borderWidth: 2,
    },
    cuponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cuponTipo: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: DISENO.colors.surfaceHover,
    },
    // ✅ TIPO CON SIMPSONFONT
    cuponTipoTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 11,
    },
    cuponEstado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    // ✅ ESTADO CON FUENTE REGULAR
    cuponEstadoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        fontWeight: '600',
    },
    // ✅ TÍTULO CON SIMPSONFONT - REDUCIDO
    cuponTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 16,
        color: DISENO.colors.text,
        marginTop: 4,
    },
    cuponTituloInactivo: {
        color: DISENO.colors.textSecondary,
    },
    // ✅ DESCRIPCIÓN CON FUENTE REGULAR
    cuponDescripcion: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
        lineHeight: 20,
    },
    cuponTextoInactivo: {
        color: DISENO.colors.textTertiary,
    },
    cuponValorGrande: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    // ✅ VALOR CON SIMPSONFONT - REDUCIDO
    cuponValorGrandeTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 20,
    },
    cuponValorBadge: {
        backgroundColor: DISENO.colors.accent + '15',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '30',
    },
    // ✅ BADGE CON SIMPSONFONT
    cuponValorBadgeText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 9,
        color: DISENO.colors.accent,
    },
    cuponFooter: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: DISENO.colors.border,
    },
    cuponCodigoContainer: {
        gap: 4,
    },
    // ✅ LABEL CÓDIGO CON FUENTE REGULAR
    cuponCodigoLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        color: DISENO.colors.textTertiary,
        letterSpacing: 1,
    },
    cuponCodigoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // ✅ CÓDIGO CON MONO
    cuponCodigo: {
        fontFamily: 'monospace',
        fontSize: 16,
        fontWeight: 'bold',
        color: DISENO.colors.text,
        letterSpacing: 1.5,
    },
    cuponCopiarBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: DISENO.colors.accent + '10',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '20',
    },
    // ✅ COPIAR CON SIMPSONFONT
    cuponCopiarTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 10,
        color: DISENO.colors.accent,
    },
    cuponVencimiento: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    // ✅ VENCIMIENTO CON FUENTE REGULAR
    cuponVencimientoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
    },
    cuponFecha: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textTertiary,
        marginTop: 4,
    },
    cuponPedido: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    cuponPedidoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
    },
    cuponUsarBoton: {
        marginTop: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    cuponUsarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
    },
    // ✅ BOTÓN USAR CON SIMPSONFONT - REDUCIDO
    cuponUsarTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
        color: DISENO.colors.text,
    },
    // Empty state
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        marginBottom: 16,
    },
    // ✅ EMPTY TITLE CON SIMPSONFONT - REDUCIDO
    emptyTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 17,
        color: DISENO.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    // ✅ EMPTY TEXT CON FUENTE REGULAR
    emptyText: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DISENO.colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        ...DISENO.shadow.md,
    },
    // ✅ BOTÓN EMPTY CON SIMPSONFONT
    emptyButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
        color: DISENO.colors.surface,
    },
});