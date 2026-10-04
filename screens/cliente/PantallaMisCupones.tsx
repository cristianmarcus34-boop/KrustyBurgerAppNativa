// screens/cliente/PantallaMisCupones.tsx - V2 DISEÑO SOFISTICADO
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
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { cuponService } from '../../lib/cupones/cuponService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO, useResponsive } from '../../lib/colores';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';
import { useToast, Toast } from '../../components/Toast';
import { FUENTES } from '../../lib/fuentes';

// ============================================================
// 🎨 HELPERS DE ESTILO POR TIPO DE CUPÓN
// ============================================================
const getEstiloPorTipo = (tipo: string) => {
    switch (tipo) {
        case 'descuento':
            return {
                emoji: '💰',
                label: 'Descuento',
                color: DISENO.colors.success,
                gradient: [DISENO.colors.success, DISENO.colors.success + 'B0'],
            };
        case 'producto_gratis':
            return {
                emoji: '🎁',
                label: 'Producto Gratis',
                color: DISENO.colors.warning,
                gradient: [DISENO.colors.warning, DISENO.colors.warning + 'B0'],
            };
        case 'envio_gratis':
            return {
                emoji: '📦',
                label: 'Envío Gratis',
                color: DISENO.colors.info,
                gradient: [DISENO.colors.info, DISENO.colors.info + 'B0'],
            };
        case '2x1':
            return {
                emoji: '🔄',
                label: '2x1',
                color: DISENO.colors.morado || '#9C27B0',
                gradient: [DISENO.colors.morado || '#9C27B0', (DISENO.colors.morado || '#9C27B0') + 'B0'],
            };
        default:
            return {
                emoji: '🎟️',
                label: 'Cupón',
                color: DISENO.colors.textSecondary,
                gradient: [DISENO.colors.textSecondary, DISENO.colors.textSecondary + 'B0'],
            };
    }
};

// ============================================================
// 🎫 COMPONENTE DE TARJETA DE CUPÓN
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

    const estilo = getEstiloPorTipo(cupon.tipo);

    // Estado
    let estadoLabel = 'Disponible';
    let estadoColor = DISENO.colors.success;
    let estadoIcono: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

    if (usado) {
        estadoLabel = 'Usado';
        estadoColor = DISENO.colors.textSecondary;
        estadoIcono = 'checkmark-done-circle';
    } else if (expirado) {
        estadoLabel = 'Expirado';
        estadoColor = DISENO.colors.danger;
        estadoIcono = 'alert-circle';
    } else if (diasRestantes <= 3) {
        estadoLabel = `Vence en ${diasRestantes}d`;
        estadoColor = DISENO.colors.warning;
        estadoIcono = 'time';
    }

    const inactivo = usado || expirado;

    return (
        <View
            style={[
                styles.cuponCard,
                inactivo && styles.cuponCardInactivo,
                !usado && !expirado && diasRestantes <= 3 && styles.cuponCardPorVencer,
            ]}
        >
            {/* Franja vertical de color según tipo */}
            <LinearGradient
                colors={estilo.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cuponFranja}
            />

            {/* Muescas tipo ticket (decorativas) */}
            <View style={[styles.muescaTop, { backgroundColor: DISENO.colors.fondo }]} />
            <View style={[styles.muescaBottom, { backgroundColor: DISENO.colors.fondo }]} />

            <View style={styles.cuponContenido}>
                {/* ─── HEADER ─── */}
                <View style={styles.cuponHeader}>
                    <View style={styles.cuponHeaderLeft}>
                        <View
                            style={[
                                styles.cuponTipoBadge,
                                { backgroundColor: estilo.color + '15', borderColor: estilo.color + '35' },
                            ]}
                        >
                            <Text style={styles.cuponTipoEmoji}>{estilo.emoji}</Text>
                            <Text style={[styles.cuponTipoTexto, { color: estilo.color }]}>
                                {estilo.label}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.cuponEstadoBadge,
                            { backgroundColor: estadoColor + '15', borderColor: estadoColor + '35' },
                        ]}
                    >
                        <Ionicons name={estadoIcono} size={12} color={estadoColor} />
                        <Text style={[styles.cuponEstadoTexto, { color: estadoColor }]}>
                            {estadoLabel}
                        </Text>
                    </View>
                </View>

                {/* ─── TÍTULO + DESCRIPCIÓN ─── */}
                <Text
                    style={[styles.cuponTitulo, inactivo && styles.cuponTextoInactivo]}
                    numberOfLines={2}
                >
                    {cupon.titulo}
                </Text>

                {cupon.descripcion && (
                    <Text
                        style={[styles.cuponDescripcion, inactivo && styles.cuponTextoInactivo]}
                        numberOfLines={2}
                    >
                        {cupon.descripcion}
                    </Text>
                )}

                {/* ─── VALOR DESTACADO ─── */}
                <View style={styles.cuponValorRow}>
                    <Text
                        style={[
                            styles.cuponValorGrande,
                            inactivo && { color: DISENO.colors.textTertiary },
                        ]}
                    >
                        {cuponService.formatearDescuento(cupon)}
                    </Text>
                    {!inactivo && (
                        <View
                            style={[
                                styles.cuponValorBadge,
                                { backgroundColor: estilo.color + '15' },
                            ]}
                        >
                            <Text style={[styles.cuponValorBadgeText, { color: estilo.color }]}>
                                ¡VÁLIDO!
                            </Text>
                        </View>
                    )}
                </View>

                {/* ─── SEPARADOR TROQUELADO ─── */}
                <View style={styles.cuponSeparador}>
                    <View style={styles.cuponSeparadorPuntos}>
                        {Array.from({ length: 30 }).map((_, i) => (
                            <View key={i} style={styles.cuponPunto} />
                        ))}
                    </View>
                </View>

                {/* ─── CÓDIGO ─── */}
                <View style={styles.cuponCodigoBox}>
                    <View style={styles.cuponCodigoInfo}>
                        <Text style={styles.cuponCodigoLabel}>CÓDIGO</Text>
                        <Text style={styles.cuponCodigo}>{cupon.codigo}</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.cuponCopiarBoton,
                            { backgroundColor: estilo.color + '15' },
                        ]}
                        onPress={() => onCopiarCodigo(cupon.codigo)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="copy-outline" size={16} color={estilo.color} />
                        <Text style={[styles.cuponCopiarTexto, { color: estilo.color }]}>
                            Copiar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ─── INFO ADICIONAL ─── */}
                {!usado && !expirado && (
                    <View style={styles.cuponInfoRow}>
                        <Ionicons name="calendar-outline" size={13} color={DISENO.colors.textTertiary} />
                        <Text style={styles.cuponInfoTexto}>
                            Vence el{' '}
                            <Text style={{ fontWeight: '600', color: DISENO.colors.text }}>
                                {expiracion.toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: 'short',
                                })}
                            </Text>
                            {diasRestantes > 0 && ` · ${diasRestantes} días restantes`}
                        </Text>
                    </View>
                )}

                {usado && cuponUsuario.fecha_canje && (
                    <View style={styles.cuponInfoRow}>
                        <Ionicons name="checkmark-done-outline" size={13} color={DISENO.colors.textTertiary} />
                        <Text style={styles.cuponInfoTexto}>
                            Usado el{' '}
                            {new Date(cuponUsuario.fecha_canje).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                            })}
                        </Text>
                    </View>
                )}

                {expirado && (
                    <View style={styles.cuponInfoRow}>
                        <Ionicons name="time-outline" size={13} color={DISENO.colors.danger} />
                        <Text style={[styles.cuponInfoTexto, { color: DISENO.colors.danger }]}>
                            Expirado el{' '}
                            {expiracion.toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                            })}
                        </Text>
                    </View>
                )}

                {cuponUsuario.pedido_id && (
                    <View style={styles.cuponInfoRow}>
                        <Ionicons name="receipt-outline" size={13} color={DISENO.colors.textTertiary} />
                        <Text style={styles.cuponInfoTexto}>
                            Pedido #{cuponUsuario.pedido_id}
                        </Text>
                    </View>
                )}

                {/* ─── BOTÓN USAR ─── */}
                {!inactivo && (
                    <TouchableOpacity
                        style={styles.cuponUsarBoton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                            navigation.navigate('Carrito', { cuponAplicado: cupon });
                        }}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                            style={styles.cuponUsarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="cart" size={18} color={DISENO.colors.text} />
                            <Text style={styles.cuponUsarTexto}>Usar en mi pedido</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ============================================================
// 🖥️ PANTALLA PRINCIPAL
// ============================================================
export default function PantallaMisCupones({ navigation }: any) {
    const { perfil, sesion, cargando: cargandoAuth } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

    const [cupones, setCupones] = useState<CuponUsuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'usados' | 'expirados'>('todos');

    // ============================================================
    // 🔒 GUARD DE SESIÓN
    // ============================================================
    useEffect(() => {
        if (!cargandoAuth && !sesion) {
            Alert.alert(
                'Iniciá sesión',
                'Necesitás una cuenta para ver tus cupones.',
                [
                    { text: 'Volver', style: 'cancel', onPress: () => navigation.goBack() },
                    { text: 'Iniciar sesión', onPress: () => navigation.replace('Login') },
                ]
            );
        }
    }, [sesion, cargandoAuth, navigation]);

    const copiarCodigo = async (codigo: string) => {
        try {
            await Clipboard.setStringAsync(codigo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            toast.exito(`✅ Código ${codigo} copiado`);
        } catch (error) {
            console.error('Error copiando:', error);
            toast.error('No se pudo copiar el código');
        }
    };

    const cargarCupones = useCallback(async () => {
        if (!perfil?.id) {
            setCupones([]);
            setCargando(false);
            setRefrescando(false);
            return;
        }

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

    // ============================================================
    // FILTRADO Y CONTEO
    // ============================================================
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

    // ============================================================
    // 🔒 RENDER: invitado o cargando auth
    // ============================================================
    if (cargandoAuth || !sesion) {
        return (
            <View style={[styles.centrado, { backgroundColor: DISENO.colors.fondo }]}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={styles.cargandoTexto}>
                    {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
                </Text>
            </View>
        );
    }

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
                {/* ═══════════════════════════════════════════════ */}
                {/* HEADER                                          */}
                {/* ═══════════════════════════════════════════════ */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color={DISENO.colors.text} />
                    </TouchableOpacity>
                    <Text
                        style={[
                            styles.title,
                            { fontSize: responsive.getValor({ tablet: 22, normal: 18, small: 16 }) }
                        ]}
                        numberOfLines={1}
                    >
                        🎫 Mis Cupones
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CanjearCupon')}
                        style={styles.iconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="scan-outline" size={22} color={DISENO.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* ═══════════════════════════════════════════════ */}
                {/* RESUMEN CON BARRAS VISUALES                     */}
                {/* ═══════════════════════════════════════════════ */}
                <View style={styles.resumenContainer}>
                    <View style={styles.resumenCard}>
                        <ResumenItem
                            numero={activos}
                            label="Activos"
                            color={DISENO.colors.success}
                            icono="checkmark-circle"
                        />
                        <View style={styles.resumenDivider} />
                        <ResumenItem
                            numero={usados}
                            label="Usados"
                            color={DISENO.colors.textSecondary}
                            icono="checkmark-done-circle"
                        />
                        <View style={styles.resumenDivider} />
                        <ResumenItem
                            numero={expirados}
                            label="Expirados"
                            color={DISENO.colors.danger}
                            icono="alert-circle"
                        />
                    </View>
                </View>

                {/* ═══════════════════════════════════════════════ */}
                {/* CÓMO FUNCIONA (solo si hay cupones activos)    */}
                {/* ═══════════════════════════════════════════════ */}
                {activos > 0 && cupones.length <= 3 && (
                    <View style={styles.comoFunciona}>
                        <View style={styles.comoFuncionaHeader}>
                            <Ionicons name="bulb-outline" size={16} color={DISENO.colors.accent} />
                            <Text style={styles.comoFuncionaTitulo}>Cómo usar tus cupones</Text>
                        </View>
                        <View style={styles.comoFuncionaPasos}>
                            <Paso numero={1} texto="Copiá el código del cupón" />
                            <Paso numero={2} texto="Andá al carrito y agregá productos" />
                            <Paso numero={3} texto="Pegá el código al confirmar el pedido" />
                        </View>
                    </View>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* FILTROS                                         */}
                {/* ═══════════════════════════════════════════════ */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtrosContainer}
                >
                    <FiltroChip
                        label="Todos"
                        emoji="📋"
                        count={cupones.length}
                        activo={filtro === 'todos'}
                        color={DISENO.colors.accent}
                        onPress={() => setFiltro('todos')}
                    />
                    <FiltroChip
                        label="Activos"
                        emoji="✅"
                        count={activos}
                        activo={filtro === 'activos'}
                        color={DISENO.colors.success}
                        onPress={() => setFiltro('activos')}
                    />
                    <FiltroChip
                        label="Usados"
                        emoji="📌"
                        count={usados}
                        activo={filtro === 'usados'}
                        color={DISENO.colors.textSecondary}
                        onPress={() => setFiltro('usados')}
                    />
                    <FiltroChip
                        label="Expirados"
                        emoji="⏰"
                        count={expirados}
                        activo={filtro === 'expirados'}
                        color={DISENO.colors.danger}
                        onPress={() => setFiltro('expirados')}
                    />
                </ScrollView>

                {/* ═══════════════════════════════════════════════ */}
                {/* LISTA DE CUPONES                                */}
                {/* ═══════════════════════════════════════════════ */}
                {cuponesFiltrados.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons
                                name="gift-outline"
                                size={56}
                                color={DISENO.colors.accent}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {filtro === 'todos' && '🎯 No tenés cupones aún'}
                            {filtro === 'activos' && '✅ No tenés cupones activos'}
                            {filtro === 'usados' && '📌 No usaste ningún cupón'}
                            {filtro === 'expirados' && '⏰ No tenés cupones expirados'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {filtro === 'todos' && 'Escaneá un código QR o ingresá uno manualmente para canjear tu primer cupón'}
                            {filtro === 'activos' && 'Canjeá un cupón nuevo para verlo acá'}
                            {filtro === 'usados' && 'Cuando uses un cupón, aparecerá acá'}
                            {filtro === 'expirados' && '¡Buenas noticias! No tenés cupones vencidos'}
                        </Text>
                        {(filtro === 'todos' || filtro === 'activos') && (
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('CanjearCupon')}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                                    style={styles.emptyButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="scan-outline" size={18} color={DISENO.colors.text} />
                                    <Text style={styles.emptyButtonText}>Canjear cupón</Text>
                                </LinearGradient>
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
// 🧩 SUB-COMPONENTES
// ============================================================
const ResumenItem: React.FC<{
    numero: number;
    label: string;
    color: string;
    icono: keyof typeof Ionicons.glyphMap;
}> = ({ numero, label, color, icono }) => (
    <View style={styles.resumenItem}>
        <View style={[styles.resumenIconWrap, { backgroundColor: color + '15' }]}>
            <Ionicons name={icono} size={14} color={color} />
        </View>
        <Text style={[styles.resumenNumero, { color }]}>{numero}</Text>
        <Text style={styles.resumenLabel}>{label}</Text>
    </View>
);

const FiltroChip: React.FC<{
    label: string;
    emoji: string;
    count: number;
    activo: boolean;
    color: string;
    onPress: () => void;
}> = ({ label, emoji, count, activo, color, onPress }) => (
    <TouchableOpacity
        style={[
            styles.filtroChip,
            activo && { backgroundColor: color + '15', borderColor: color },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.filtroEmoji}>{emoji}</Text>
        <Text style={[styles.filtroLabel, activo && { color }]}>
            {label}
        </Text>
        {count > 0 && (
            <View
                style={[
                    styles.filtroCount,
                    activo && { backgroundColor: color },
                ]}
            >
                <Text
                    style={[
                        styles.filtroCountText,
                        activo && { color: '#FFFFFF' },
                    ]}
                >
                    {count}
                </Text>
            </View>
        )}
    </TouchableOpacity>
);

const Paso: React.FC<{ numero: number; texto: string }> = ({ numero, texto }) => (
    <View style={styles.pasoRow}>
        <View style={styles.pasoNumero}>
            <Text style={styles.pasoNumeroTexto}>{numero}</Text>
        </View>
        <Text style={styles.pasoTexto}>{texto}</Text>
    </View>
);

// ============================================================
// 🎨 ESTILOS
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
    cargandoTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.textSecondary,
        marginTop: 16,
        fontSize: 14,
    },

    // ─── HEADER ───
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DISENO.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...DISENO.shadow.sm,
    },
    title: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.text,
        letterSpacing: 0.5,
        flex: 1,
        textAlign: 'center',
    },

    // ─── RESUMEN ───
    resumenContainer: {
        marginBottom: 16,
    },
    resumenCard: {
        flexDirection: 'row',
        backgroundColor: DISENO.colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    resumenItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    resumenIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    resumenNumero: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 22,
        lineHeight: 24,
        includeFontPadding: false,
    },
    resumenLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },
    resumenDivider: {
        width: 1,
        backgroundColor: DISENO.colors.border,
        marginVertical: 4,
    },

    // ─── CÓMO FUNCIONA ───
    comoFunciona: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '25',
        gap: 10,
    },
    comoFuncionaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    comoFuncionaTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 13,
        color: DISENO.colors.text,
        includeFontPadding: false,
    },
    comoFuncionaPasos: {
        gap: 8,
    },
    pasoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    pasoNumero: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: DISENO.colors.accent + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pasoNumeroTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 11,
        color: DISENO.colors.accent,
        includeFontPadding: false,
    },
    pasoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
        flex: 1,
        includeFontPadding: false,
    },

    // ─── FILTROS ───
    filtrosContainer: {
        gap: 8,
        paddingBottom: 16,
        paddingRight: 8,
    },
    filtroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: DISENO.colors.surface,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    filtroEmoji: {
        fontSize: 13,
    },
    filtroLabel: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 12,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },
    filtroCount: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        backgroundColor: DISENO.colors.surfaceHover,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtroCountText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 10,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },

    // ─── LISTA CUPONES ───
    cuponesList: {
        gap: 14,
        paddingBottom: 20,
    },

    // ─── TARJETA CUPÓN ───
    cuponCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: DISENO.colors.surface,
        ...DISENO.shadow.sm,
        position: 'relative',
    },
    cuponCardInactivo: {
        opacity: 0.65,
    },
    cuponCardPorVencer: {
        borderWidth: 2,
        borderColor: DISENO.colors.warning,
    },
    cuponFranja: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 5,
    },
    muescaTop: {
        position: 'absolute',
        left: -10,
        top: '50%',
        marginTop: -14,
        width: 20,
        height: 20,
        borderRadius: 10,
        zIndex: 2,
    },
    muescaBottom: {
        position: 'absolute',
        right: -10,
        top: '50%',
        marginTop: -14,
        width: 20,
        height: 20,
        borderRadius: 10,
        zIndex: 2,
    },
    cuponContenido: {
        padding: 16,
        paddingLeft: 20,
        gap: 8,
    },

    // ─── HEADER DE CUPÓN ───
    cuponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    cuponHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cuponTipoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    cuponTipoEmoji: {
        fontSize: 12,
    },
    cuponTipoTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 10,
        letterSpacing: 0.3,
        includeFontPadding: false,
    },
    cuponEstadoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    cuponEstadoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        fontWeight: '600',
        includeFontPadding: false,
    },

    // ─── CONTENIDO ───
    cuponTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 16,
        color: DISENO.colors.text,
        lineHeight: 20,
        includeFontPadding: false,
    },
    cuponDescripcion: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        lineHeight: 18,
        includeFontPadding: false,
    },
    cuponTextoInactivo: {
        color: DISENO.colors.textTertiary,
    },

    // ─── VALOR ───
    cuponValorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 2,
    },
    cuponValorGrande: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 22,
        color: DISENO.colors.accent,
        lineHeight: 26,
        includeFontPadding: false,
    },
    cuponValorBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cuponValorBadgeText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 9,
        letterSpacing: 0.5,
        includeFontPadding: false,
    },

    // ─── SEPARADOR TROQUELADO ───
    cuponSeparador: {
        marginVertical: 8,
        paddingHorizontal: 4,
    },
    cuponSeparadorPuntos: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cuponPunto: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: DISENO.colors.border,
    },

    // ─── CÓDIGO ───
    cuponCodigoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: DISENO.colors.fondo,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        borderStyle: 'dashed',
        gap: 10,
    },
    cuponCodigoInfo: {
        flex: 1,
        gap: 2,
    },
    cuponCodigoLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 9,
        color: DISENO.colors.textTertiary,
        letterSpacing: 1.2,
        includeFontPadding: false,
    },
    cuponCodigo: {
        fontFamily: 'monospace',
        fontSize: 17,
        fontWeight: 'bold',
        color: DISENO.colors.text,
        letterSpacing: 2,
        includeFontPadding: false,
    },
    cuponCopiarBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    cuponCopiarTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 11,
        includeFontPadding: false,
    },

    // ─── INFO ROW ───
    cuponInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    cuponInfoTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },

    // ─── BOTÓN USAR ───
    cuponUsarBoton: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        ...DISENO.shadow.sm,
    },
    cuponUsarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    cuponUsarTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
        color: DISENO.colors.text,
        includeFontPadding: false,
    },

    // ─── EMPTY STATE ───
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: DISENO.colors.accent + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 17,
        color: DISENO.colors.text,
        marginBottom: 8,
        textAlign: 'center',
        includeFontPadding: false,
    },
    emptyText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        maxWidth: 300,
        includeFontPadding: false,
    },
    emptyButton: {
        borderRadius: 14,
        overflow: 'hidden',
        ...DISENO.shadow.sm,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    emptyButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
        color: DISENO.colors.text,
        includeFontPadding: false,
    },
});