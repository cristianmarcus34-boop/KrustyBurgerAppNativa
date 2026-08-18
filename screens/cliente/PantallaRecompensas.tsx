// screens/cliente/PantallaRecompensas.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, ActivityIndicator, Animated, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        card: '#FFFFFF',
        cardShadow: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.06)',
        borderLight: 'rgba(0,0,0,0.04)',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        accent: '#E53935',
        accentLight: '#FF6B6B',
        accentSecondary: '#F5C518',
        accentSecondaryLight: '#FFE135',
        gradientStart: '#E53935',
        gradientEnd: '#F5C518',
        verde: '#43A047',
        verdeClaro: '#66BB6A',
        rosa: '#EC407A',
        rosaClaro: '#F06292',
        azul: '#1A237E',
        azulClaro: '#3949AB',
        platino: '#78909C',
        oro: '#F9A825',
        plata: '#BDBDBD',
        bronce: '#A1887F',
        pendiente: '#FF9800',
        confirmado: '#2196F3',
        preparando: '#9C27B0',
        listo: '#4CAF50',
        enCamino: '#FF5722',
        entregado: '#4CAF50',
        cancelado: '#F44336',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 999,
    },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isSmallPhone = width < 375;

    const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
        if (isDesktop || isTablet) return valores.tablet;
        if (isSmallPhone) return valores.small;
        return valores.normal;
    }, [isDesktop, isTablet, isSmallPhone]);

    const spacing = (base: number) => {
        if (isTablet) return base * 1.5;
        if (isSmallPhone) return base * 0.75;
        return base;
    };

    return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    imagen?: string;
    activa: boolean;
}

export default function PantallaRecompensas(props: any) {
    const { perfil, actualizarPerfil } = tiendaAutenticacion();
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
    const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
    const [mensajeExito, setMensajeExito] = useState('');
    const [canjeando, setCanjeando] = useState(false);

    // ✅ Responsive
    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    // ✅ Tamaños dinámicos
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const paddingTop = insets.top + (isTablet ? 30 : 20);
    const paddingBottom = insets.bottom + 20;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const puntosSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
    const puntosBadgePadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const iconoSize = isTablet ? 60 : isSmallPhone ? 44 : 50;
    const iconoContainer = isTablet ? 64 : isSmallPhone ? 48 : 54;
    const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const descSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
    const puntosTextSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
    const botonTextSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
    const botonPaddingH = isTablet ? 20 : isSmallPhone ? 12 : 16;
    const botonPaddingV = isTablet ? 12 : isSmallPhone ? 8 : 10;
    const modalWidth = isTablet ? '60%' : '85%';
    const modalPadding = isTablet ? 36 : isSmallPhone ? 20 : 24;
    const modalTituloSize = isTablet ? 26 : isSmallPhone ? 20 : 22;
    const modalTextSize = isTablet ? 16 : isSmallPhone ? 13 : 14;

    useEffect(() => { cargarRecompensas(); }, []);

    const cargarRecompensas = async () => {
        const { data } = await supabase
            .from('recompensas')
            .select('*')
            .eq('activa', true)
            .order('puntos_necesarios', { ascending: true });
        setRecompensas(data as Recompensa[] || []);
        setCargando(false);
    };

    const mostrarExito = (mensaje: string) => {
        setMensajeExito(mensaje);
        setMostrarModalExito(true);
        setTimeout(() => setMostrarModalExito(false), 2500);
    };

    const confirmarCanje = (recompensa: Recompensa) => {
        const puntos = perfil?.puntos_disponibles || 0;
        if (puntos < recompensa.puntos_necesarios) {
            mostrarExito('❌ Puntos insuficientes');
            return;
        }
        setRecompensaSeleccionada(recompensa);
        setMostrarModalConfirmar(true);
    };

    const canjear = async () => {
        if (!recompensaSeleccionada || !perfil) return;
        setMostrarModalConfirmar(false);
        setCanjeando(true);

        try {
            const { data, error } = await supabase
                .rpc('canjear_recompensa', {
                    p_usuario_id: perfil.id,
                    p_recompensa_id: recompensaSeleccionada.id
                });

            if (error) {
                console.error('Error al canjear:', error);
                mostrarExito('❌ Error al canjear recompensa');
                setCanjeando(false);
                return;
            }

            if (!data || !data[0]) {
                mostrarExito('❌ Error al procesar el canje');
                setCanjeando(false);
                return;
            }

            const resultado = data[0];

            if (!resultado.exito) {
                mostrarExito(`❌ ${resultado.mensaje}`);
                setCanjeando(false);
                return;
            }

            const { data: perfilActualizado, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', perfil.id)
                .single();

            if (perfilActualizado && !errorPerfil) {
                tiendaAutenticacion.setState({ perfil: perfilActualizado });
            }

            mostrarExito(`🎉 ¡Cupón canjeado! ${recompensaSeleccionada.nombre}`);
            cargarRecompensas();

        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarExito('❌ Error al canjear recompensa');
        } finally {
            setCanjeando(false);
        }
    };

    const getIconoPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return '💰';
            case 'PRODUCTO_GRATIS': return '🍔';
            case 'ENVIO_GRATIS': return '🚚';
            default: return '🎁';
        }
    };

    const getTituloTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return 'Descuento';
            case 'PRODUCTO_GRATIS': return 'Producto Gratis';
            case 'ENVIO_GRATIS': return 'Envío Gratis';
            default: return 'Recompensa';
        }
    };

    const getColorPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return DESIGN.colors.accent;
            case 'PRODUCTO_GRATIS': return DESIGN.colors.verde;
            case 'ENVIO_GRATIS': return DESIGN.colors.azulClaro;
            default: return DESIGN.colors.accentSecondary;
        }
    };

    const renderRecompensa = ({ item }: { item: Recompensa }) => {
        const puntosDisponibles = perfil?.puntos_disponibles || 0;
        const disponible = puntosDisponibles >= item.puntos_necesarios;
        const tipoColor = getColorPorTipo(item.tipo);

        return (
            <View style={[
                styles.card,
                disponible && styles.cardDisponible,
                {
                    padding: tarjetaPadding,
                    borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
                    borderColor: disponible ? tipoColor + '40' : DESIGN.colors.border,
                    backgroundColor: DESIGN.colors.surface,
                    shadowColor: DESIGN.colors.cardShadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 8,
                    elevation: 3,
                }
            ]}>
                <View style={[
                    styles.cardIcon,
                    {
                        width: iconoContainer,
                        height: iconoContainer,
                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                        backgroundColor: disponible ? tipoColor + '15' : DESIGN.colors.surfaceHover,
                    }
                ]}>
                    <Text style={[styles.icon, { fontSize: iconoSize }]}>
                        {getIconoPorTipo(item.tipo)}
                    </Text>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardName, { fontSize: nombreSize, color: DESIGN.colors.text }]} numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <View style={[
                            styles.typeBadge,
                            {
                                paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8,
                                backgroundColor: disponible ? tipoColor + '15' : DESIGN.colors.surfaceHover,
                                borderColor: disponible ? tipoColor + '30' : DESIGN.colors.border,
                            }
                        ]}>
                            <Text style={[
                                styles.typeBadgeText,
                                {
                                    fontSize: isTablet ? 11 : isSmallPhone ? 8 : 9,
                                    color: disponible ? tipoColor : DESIGN.colors.textTertiary,
                                }
                            ]}>
                                {getTituloTipo(item.tipo)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.cardDesc, { fontSize: descSize, color: DESIGN.colors.textSecondary }]} numberOfLines={2}>
                        {item.descripcion}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.pointsContainer}>
                            <Text style={[styles.pointsIconSmall, { fontSize: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>⭐</Text>
                            <Text style={[
                                styles.cardPoints,
                                {
                                    fontSize: puntosTextSize,
                                    color: disponible ? DESIGN.colors.accentSecondary : DESIGN.colors.textTertiary,
                                }
                            ]}>
                                {item.puntos_necesarios} pts
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.redeemButton,
                                disponible && styles.redeemButtonActive,
                                {
                                    paddingHorizontal: botonPaddingH,
                                    paddingVertical: botonPaddingV,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: disponible ? DESIGN.colors.accentSecondary : DESIGN.colors.surfaceHover,
                                    borderColor: disponible ? DESIGN.colors.accentSecondary : DESIGN.colors.border,
                                }
                            ]}
                            onPress={() => confirmarCanje(item)}
                            disabled={!disponible || canjeando}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.redeemButtonText,
                                {
                                    fontSize: botonTextSize,
                                    color: disponible ? DESIGN.colors.text : DESIGN.colors.textTertiary,
                                    fontWeight: disponible ? '700' : '500',
                                }
                            ]}>
                                {canjeando ? '⏳ Canjeando...' : disponible ? '🔓 Canjear' : '🔒 Bloqueado'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // ✅ Verificar si hay recompensas disponibles
    const tieneRecompensasDisponibles = recompensas.some(r => (perfil?.puntos_disponibles || 0) >= r.puntos_necesarios);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ HEADER */}
            <View style={[
                styles.header,
                {
                    paddingTop: paddingTop,
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                </TouchableOpacity>

                <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
                    🎁 Recompensas
                </Text>

                <View style={[
                    styles.pointsBadge,
                    {
                        paddingHorizontal: puntosBadgePadding,
                        paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                        borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 20,
                        backgroundColor: DESIGN.colors.surface + '20',
                        borderColor: DESIGN.colors.accentSecondary + '30',
                    }
                ]}>
                    <Text style={[styles.pointsIcon, { fontSize: isTablet ? 18 : isSmallPhone ? 13 : 15 }]}>⭐</Text>
                    <Text style={[styles.pointsText, { fontSize: puntosSize, color: DESIGN.colors.accentSecondary }]}>
                        {perfil?.puntos_disponibles || 0}
                    </Text>
                </View>
            </View>

            {/* ✅ MENSAJE INFORMATIVO SOBRE CANJE EN CARRITO */}
            <View style={[
                styles.infoBanner,
                {
                    marginHorizontal: paddingHorizontal,
                    marginTop: 12,
                    marginBottom: 8,
                    padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                    backgroundColor: DESIGN.colors.accentSecondary + '12',
                    borderColor: DESIGN.colors.accentSecondary + '30',
                    borderWidth: 1,
                }
            ]}>
                <View style={styles.infoBannerContent}>
                    <View style={[
                        styles.infoBannerIcon,
                        {
                            width: isTablet ? 44 : isSmallPhone ? 32 : 36,
                            height: isTablet ? 44 : isSmallPhone ? 32 : 36,
                            borderRadius: isTablet ? 22 : isSmallPhone ? 16 : 18,
                            backgroundColor: DESIGN.colors.accentSecondary + '20',
                            marginRight: 12,
                        }
                    ]}>
                        <Ionicons name="cart-outline" size={isTablet ? 24 : isSmallPhone ? 16 : 20} color={DESIGN.colors.accentSecondary} />
                    </View>
                    <View style={styles.infoBannerTextContainer}>
                        <Text style={[
                            styles.infoBannerTitle,
                            {
                                fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13,
                                color: DESIGN.colors.text,
                                fontWeight: '600',
                            }
                        ]}>
                            💡 Canjeá tus puntos en el carrito
                        </Text>
                        <Text style={[
                            styles.infoBannerText,
                            {
                                fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11,
                                color: DESIGN.colors.textSecondary,
                            }
                        ]}>
                            Tus puntos acumulados se pueden canjear como descuento directo en el total de tu compra.
                            Agregá productos al carrito y aplicá tus puntos al finalizar.
                        </Text>
                    </View>
                </View>
            </View>

            {/* ✅ CONTENIDO */}
            {cargando ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
                    <Text style={[styles.loadingText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.textSecondary }]}>
                        Cargando recompensas...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={recompensas}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderRecompensa}
                    contentContainerStyle={[
                        styles.list,
                        {
                            paddingHorizontal: paddingHorizontal,
                            paddingBottom: paddingBottom + 20,
                            paddingTop: isTablet ? 12 : 8,
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="gift-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.textTertiary + '30'} />
                            <Text style={[styles.emptyText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.text }]}>
                                No hay recompensas disponibles
                            </Text>
                            <Text style={[styles.emptySubtext, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                                Pronto tendremos nuevas recompensas para vos 🎉
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        // ✅ Mostrar mensaje de ayuda si hay puntos pero no recompensas disponibles
                        (perfil?.puntos_disponibles || 0) > 0 && !tieneRecompensasDisponibles && recompensas.length > 0 ? (
                            <View style={[
                                styles.helpMessage,
                                {
                                    padding: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    backgroundColor: DESIGN.colors.accent + '08',
                                    borderColor: DESIGN.colors.accent + '20',
                                    borderWidth: 1,
                                    marginTop: 8,
                                    marginBottom: 16,
                                }
                            ]}>
                                <Ionicons name="bulb-outline" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={DESIGN.colors.accent} />
                                <View style={styles.helpMessageTextContainer}>
                                    <Text style={[styles.helpMessageTitle, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                                        💡 ¿Sabías que podés usar tus puntos?
                                    </Text>
                                    <Text style={[styles.helpMessageText, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                                        Aunque no haya recompensas disponibles ahora, podés usar tus {perfil?.puntos_disponibles || 0} puntos como descuento en tu próximo pedido.
                                        Simplemente agregá productos al carrito y aplicá tus puntos en el checkout.
                                    </Text>
                                </View>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* ✅ MODAL CONFIRMAR */}
            <Modal visible={mostrarModalConfirmar} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modal,
                        {
                            padding: modalPadding,
                            borderRadius: isTablet ? 28 : isSmallPhone ? 18 : 24,
                            width: modalWidth,
                            borderColor: DESIGN.colors.accentSecondary + '40',
                            backgroundColor: DESIGN.colors.surface,
                        }
                    ]}>
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>🎁</Text>
                        <Text style={[styles.modalTitle, { fontSize: modalTituloSize, color: DESIGN.colors.text }]}>
                            Confirmar Canje
                        </Text>
                        <Text style={[styles.modalText, { fontSize: modalTextSize, color: DESIGN.colors.textSecondary }]}>
                            Usar <Text style={[styles.modalTextHighlight, { color: DESIGN.colors.accentSecondary }]}>{recompensaSeleccionada?.puntos_necesarios} pts</Text> por:
                            {"\n"}
                            <Text style={[styles.modalTextReward, { color: DESIGN.colors.text }]}>"{recompensaSeleccionada?.nombre}"</Text>
                        </Text>

                        <View style={[styles.modalButtons, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12 }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    backgroundColor: DESIGN.colors.surfaceHover,
                                    borderColor: DESIGN.colors.border,
                                }]}
                                onPress={() => setMostrarModalConfirmar(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalCancelText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.textSecondary }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalConfirm, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    overflow: 'hidden',
                                    backgroundColor: DESIGN.colors.accentSecondary,
                                }]}
                                onPress={canjear}
                                disabled={canjeando}
                                activeOpacity={0.7}
                            >
                                {canjeando ? (
                                    <ActivityIndicator size="small" color={DESIGN.colors.text} />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.text} />
                                        <Text style={[styles.modalConfirmText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.text }]}>
                                            Canjear
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL ÉXITO */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modal,
                        styles.modalSuccess,
                        {
                            padding: modalPadding,
                            borderRadius: isTablet ? 28 : isSmallPhone ? 18 : 24,
                            width: modalWidth,
                            borderColor: DESIGN.colors.verde + '40',
                            backgroundColor: DESIGN.colors.surface,
                        }
                    ]}>
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[styles.modalTitle, { fontSize: modalTituloSize, color: DESIGN.colors.verde }]}>
                            {mensajeExito}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
    },
    backgroundGradient: {
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
        borderBottomColor: DESIGN.colors.surface + '10',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontWeight: 'bold',
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        gap: 6,
    },
    pointsIcon: {},
    pointsText: {
        fontWeight: 'bold',
    },
    // ✅ BANNER INFORMATIVO
    infoBanner: {
        borderWidth: 1,
    },
    infoBannerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoBannerIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    infoBannerTextContainer: {
        flex: 1,
    },
    infoBannerTitle: {
        marginBottom: 2,
    },
    infoBannerText: {
        lineHeight: 16,
        opacity: 0.8,
    },
    // ✅ MENSAJE DE AYUDA
    helpMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        gap: 12,
    },
    helpMessageTextContainer: {
        flex: 1,
    },
    helpMessageTitle: {
        fontWeight: '600',
        marginBottom: 2,
    },
    helpMessageText: {
        lineHeight: 16,
        opacity: 0.8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontWeight: '400',
        opacity: 0.7,
    },
    list: {
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        marginBottom: 12,
        opacity: 0.6,
    },
    cardDisponible: {
        opacity: 1,
        borderWidth: 2,
    },
    cardIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    icon: {},
    cardInfo: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        flexWrap: 'wrap',
        gap: 4,
    },
    cardName: {
        fontWeight: 'bold',
        flex: 1,
    },
    typeBadge: {
        borderWidth: 1,
    },
    typeBadgeText: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    cardDesc: {
        marginTop: 2,
        opacity: 0.7,
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 6,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pointsIconSmall: {},
    cardPoints: {
        fontWeight: 'bold',
    },
    redeemButton: {
        borderWidth: 1,
    },
    redeemButtonActive: {
        borderWidth: 2,
    },
    redeemButtonText: {
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        alignItems: 'center',
        borderWidth: 2,
        maxWidth: 500,
    },
    modalSuccess: {
        borderWidth: 2,
    },
    modalIcon: {
        marginBottom: 12,
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
        opacity: 0.8,
    },
    modalTextHighlight: {
        fontWeight: 'bold',
    },
    modalTextReward: {
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    modalCancel: {
        borderWidth: 1,
    },
    modalCancelText: {
        fontWeight: '600',
    },
    modalConfirm: {
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modalConfirmText: {
        fontWeight: 'bold',
    },
});