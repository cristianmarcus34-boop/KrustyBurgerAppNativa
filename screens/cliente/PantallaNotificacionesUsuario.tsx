// screens/cliente/PantallaNotificacionesUsuario.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificacionService } from '../../services/notificacionService';
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

// ✅ FUNCIONES PARA TIPOS DE NOTIFICACIONES
const getIconForTipo = (tipo: string) => {
    const map: any = {
        promocion: '🎉',
        oferta: '💰',
        recompensa: '🎁',
        sistema: '⚙️',
        pedido: '📦',
    };
    return map[tipo] || '📱';
};

const getColorForTipo = (tipo: string) => {
    const map: any = {
        promocion: DESIGN.colors.accentSecondary,
        oferta: DESIGN.colors.verde,
        recompensa: DESIGN.colors.rosa,
        sistema: DESIGN.colors.azulClaro,
        pedido: DESIGN.colors.accent,
    };
    return map[tipo] || DESIGN.colors.textTertiary;
};

export default function PantallaNotificacionesUsuario(props: any) {
    const { perfil } = tiendaAutenticacion();
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [notificacionesOcultas, setNotificacionesOcultas] = useState<number[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);

    // ✅ Estados para el modal
    const [modalVisible, setModalVisible] = useState(false);
    const [notificacionAOcultar, setNotificacionAOcultar] = useState<number | null>(null);
    const [ocultandoTodas, setOcultandoTodas] = useState(false);

    useFocusEffect(
        useCallback(() => {
            cargarNotificaciones();
        }, [])
    );

    const cargarNotificaciones = async () => {
        if (!perfil?.id) {
            setCargando(false);
            return;
        }

        setCargando(true);
        try {
            const data = await notificacionService.obtenerNotificaciones(perfil.id);
            const ocultas = await notificacionService.obtenerNotificacionesOcultas(perfil.id);

            setNotificaciones(data);
            setNotificacionesOcultas(ocultas);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const marcarComoLeida = async (id: number) => {
        await notificacionService.marcarComoLeida(id);
        cargarNotificaciones();
    };

    const marcarTodasComoLeidas = async () => {
        if (!perfil?.id) return;
        await notificacionService.marcarTodasComoLeidas(perfil.id);
        cargarNotificaciones();
        Alert.alert('✅ Leídas', 'Todas las notificaciones fueron marcadas como leídas.');
    };

    const ocultarNotificacion = async (id: number) => {
        if (!perfil?.id) return;
        const exito = await notificacionService.ocultarNotificacion(perfil.id, id);
        if (exito) {
            setNotificaciones(prev => prev.filter(n => n.id !== id));
            setNotificacionesOcultas(prev => [...prev, id]);
            Alert.alert('🙈 Ocultada', 'La notificación fue ocultada para ti.');
        } else {
            Alert.alert('❌ Error', 'No se pudo ocultar la notificación');
        }
        setModalVisible(false);
        setNotificacionAOcultar(null);
    };

    const ocultarTodasNotificaciones = async () => {
        if (!perfil?.id) return;
        setOcultandoTodas(true);
        const exito = await notificacionService.ocultarTodasNotificaciones(perfil.id);
        setOcultandoTodas(false);
        if (exito) {
            const ids = notificaciones.map(n => n.id);
            setNotificaciones([]);
            setNotificacionesOcultas(prev => [...prev, ...ids]);
            Alert.alert('🙈 Ocultadas', 'Todas las notificaciones fueron ocultadas.');
        } else {
            Alert.alert('❌ Error', 'No se pudieron ocultar las notificaciones');
        }
    };

    const restaurarTodasNotificaciones = async () => {
        if (!perfil?.id) return;
        await notificacionService.mostrarTodasNotificaciones(perfil.id);
        setNotificacionesOcultas([]);
        cargarNotificaciones();
        Alert.alert('👀 Restauradas', 'Todas las notificaciones ocultas fueron restauradas.');
    };

    const confirmarOcultar = (id: number) => {
        setNotificacionAOcultar(id);
        setModalVisible(true);
    };

    const confirmarOcultarTodas = () => {
        Alert.alert(
            '🙈 Ocultar todas',
            '¿Quieres ocultar todas las notificaciones? Podrás restaurarlas después.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Ocultar todas', style: 'destructive', onPress: ocultarTodasNotificaciones }
            ]
        );
    };

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 28 : isSmallPhone ? 20 : 24;

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={DESIGN.colors.accent} />
                <Text style={[styles.loadingText, { color: DESIGN.colors.textSecondary }]}>
                    Cargando notificaciones...
                </Text>
            </View>
        );
    }

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
                    paddingTop: insets.top + 16,
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                </TouchableOpacity>

                <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
                    🔔 Notificaciones
                </Text>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={cargarNotificaciones} style={styles.iconButton}>
                        <Ionicons name="refresh" size={isTablet ? 24 : 20} color={DESIGN.colors.surface} />
                    </TouchableOpacity>

                    {notificaciones.length > 0 && (
                        <TouchableOpacity onPress={confirmarOcultarTodas} style={styles.iconButton}>
                            <Ionicons name="eye-off-outline" size={isTablet ? 24 : 20} color={DESIGN.colors.surface} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ✅ CONTADOR DE NO LEÍDAS */}
            {noLeidas > 0 && (
                <View style={[
                    styles.counterContainer,
                    {
                        backgroundColor: DESIGN.colors.accent + '15',
                        borderBottomColor: DESIGN.colors.accent + '20',
                        paddingHorizontal: paddingHorizontal,
                        paddingVertical: isTablet ? 10 : 8,
                    }
                ]}>
                    <Text style={[styles.counterText, { color: DESIGN.colors.textSecondary, fontSize: isTablet ? 14 : 13 }]}>
                        🔔 {noLeidas} notificación{noLeidas !== 1 ? 'es' : ''} sin leer
                    </Text>
                    <TouchableOpacity onPress={marcarTodasComoLeidas} activeOpacity={0.7}>
                        <Text style={[styles.markAllText, { color: DESIGN.colors.accent, fontSize: isTablet ? 13 : 12 }]}>
                            Marcar todas como leídas
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ✅ OPCIONES DE RECUPERACIÓN */}
            {notificacionesOcultas.length > 0 && (
                <TouchableOpacity
                    style={[
                        styles.restaurarContainer,
                        {
                            backgroundColor: DESIGN.colors.verde + '15',
                            borderBottomColor: DESIGN.colors.verde + '20',
                            paddingHorizontal: paddingHorizontal,
                            paddingVertical: isTablet ? 10 : 8,
                        }
                    ]}
                    onPress={restaurarTodasNotificaciones}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh-circle-outline" size={isTablet ? 22 : 18} color={DESIGN.colors.verde} />
                    <Text style={[styles.restaurarTexto, { color: DESIGN.colors.verde, fontSize: isTablet ? 14 : 13 }]}>
                        Restaurar {notificacionesOcultas.length} notificación{notificacionesOcultas.length !== 1 ? 'es' : ''} oculta{notificacionesOcultas.length !== 1 ? 's' : ''}
                    </Text>
                </TouchableOpacity>
            )}

            {/* ✅ LISTA DE NOTIFICACIONES */}
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 20,
                        paddingTop: isTablet ? 8 : 4,
                    }
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={cargarNotificaciones}
                        tintColor={DESIGN.colors.accent}
                        colors={[DESIGN.colors.accent]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {notificaciones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.textTertiary + '40'} />
                        <Text style={[styles.emptyText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.text }]}>
                            No tienes notificaciones
                        </Text>
                        <Text style={[styles.emptySubtext, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                            {notificacionesOcultas.length > 0
                                ? `Tienes ${notificacionesOcultas.length} ocultas. Toca arriba para restaurarlas.`
                                : '¡Estás al día! 🎉'}
                        </Text>
                    </View>
                ) : (
                    notificaciones.map((item) => {
                        const hasImage = item.imagen_url || item.imagen;
                        const imageUrl = item.imagen_url || item.imagen;
                        const tipoColor = getColorForTipo(item.tipo);

                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.notificacionItem,
                                    !item.leida && styles.notificacionNoLeida,
                                    {
                                        backgroundColor: DESIGN.colors.surface,
                                        borderColor: !item.leida ? tipoColor + '30' : DESIGN.colors.border,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        shadowColor: DESIGN.colors.cardShadow,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 1,
                                        shadowRadius: 4,
                                        elevation: 2,
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.notificacionContent}
                                    onPress={() => marcarComoLeida(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.notificacionHeader}>
                                        <View style={styles.notificacionTipo}>
                                            <Text style={[styles.notificacionIcono, { fontSize: isTablet ? 18 : 16 }]}>
                                                {getIconForTipo(item.tipo)}
                                            </Text>
                                            <Text style={[styles.notificacionTipoText, { color: tipoColor, fontSize: isTablet ? 12 : 11 }]}>
                                                {item.tipo.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.notificacionHeaderRight}>
                                            {!item.leida && <View style={[styles.notificacionNoLeidaDot, { backgroundColor: tipoColor }]} />}
                                            <TouchableOpacity
                                                onPress={() => confirmarOcultar(item.id)}
                                                style={styles.ocultarButton}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="eye-off-outline" size={isTablet ? 20 : 18} color={DESIGN.colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {hasImage && (
                                        <View style={[
                                            styles.bannerContainer,
                                            {
                                                borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                                borderColor: DESIGN.colors.border,
                                                backgroundColor: DESIGN.colors.surfaceHover,
                                            }
                                        ]}>
                                            <Image
                                                source={{ uri: imageUrl }}
                                                style={styles.bannerImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}

                                    <Text style={[styles.notificacionTitulo, { fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15, color: DESIGN.colors.text }]}>
                                        {item.titulo}
                                    </Text>
                                    <Text style={[styles.notificacionMensaje, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                        {item.mensaje}
                                    </Text>
                                    <Text style={[styles.notificacionFecha, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textTertiary }]}>
                                        {new Date(item.created_at).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* ✅ MODAL DE CONFIRMACIÓN */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContainer,
                        {
                            backgroundColor: DESIGN.colors.surface,
                            borderRadius: isTablet ? 24 : 20,
                            padding: isTablet ? 32 : 24,
                            maxWidth: isTablet ? 400 : 340,
                            borderColor: DESIGN.colors.border,
                        }
                    ]}>
                        <View style={[
                            styles.modalIconContainer,
                            {
                                backgroundColor: DESIGN.colors.accent + '15',
                                width: isTablet ? 72 : 64,
                                height: isTablet ? 72 : 64,
                                borderRadius: isTablet ? 36 : 32,
                            }
                        ]}>
                            <Ionicons name="eye-off-outline" size={isTablet ? 52 : 48} color={DESIGN.colors.accent} />
                        </View>
                        <Text style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18, color: DESIGN.colors.text }]}>
                            Ocultar notificación
                        </Text>
                        <Text style={[styles.modalMessage, { fontSize: isTablet ? 15 : 14, color: DESIGN.colors.textSecondary }]}>
                            Esta notificación se ocultará solo para ti. Podrás restaurarla después.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonCancel,
                                    {
                                        backgroundColor: DESIGN.colors.surfaceHover,
                                        borderColor: DESIGN.colors.border,
                                        borderRadius: isTablet ? 14 : 12,
                                        paddingVertical: isTablet ? 14 : 12,
                                    }
                                ]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNotificacionAOcultar(null);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalButtonCancelText, { fontSize: isTablet ? 15 : 14, color: DESIGN.colors.textSecondary }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonOcultar,
                                    {
                                        backgroundColor: DESIGN.colors.accent,
                                        borderRadius: isTablet ? 14 : 12,
                                        paddingVertical: isTablet ? 14 : 12,
                                    }
                                ]}
                                onPress={() => {
                                    if (notificacionAOcultar !== null) {
                                        ocultarNotificacion(notificacionAOcultar);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="eye-off-outline" size={isTablet ? 20 : 18} color={DESIGN.colors.surface} />
                                <Text style={[styles.modalButtonOcultarText, { fontSize: isTablet ? 15 : 14, color: DESIGN.colors.surface }]}>
                                    Ocultar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ INDICADOR DE CARGA */}
            {ocultandoTodas && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={DESIGN.colors.accent} />
                    <Text style={[styles.loadingOverlayText, { color: DESIGN.colors.textSecondary, fontSize: 14 }]}>
                        Ocultando notificaciones...
                    </Text>
                </View>
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DESIGN.colors.fondo,
    },
    loadingText: {
        marginTop: 12,
        opacity: 0.6,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.surface + '10',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        padding: 8,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    markAllText: {
        fontWeight: '500',
        opacity: 0.8,
    },
    scroll: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    emptySubtext: {
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },
    notificacionItem: {
        marginBottom: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    notificacionContent: {
        padding: 16,
    },
    notificacionNoLeida: {
        borderWidth: 2,
    },
    notificacionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    notificacionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    notificacionTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    notificacionIcono: {
        fontWeight: 'bold',
    },
    notificacionTipoText: {
        fontWeight: 'bold',
        opacity: 0.8,
    },
    notificacionNoLeidaDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    ocultarButton: {
        padding: 4,
    },
    notificacionTitulo: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificacionMensaje: {
        marginBottom: 6,
        opacity: 0.7,
    },
    notificacionFecha: {
        opacity: 0.4,
    },
    bannerContainer: {
        marginTop: 8,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        width: '100%',
        aspectRatio: 16 / 9,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    counterText: {
        fontWeight: '500',
        opacity: 0.8,
    },
    restaurarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        gap: 8,
    },
    restaurarTexto: {
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '90%',
        alignItems: 'center',
        borderWidth: 1,
    },
    modalIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalMessage: {
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
        opacity: 0.8,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: 1,
    },
    modalButtonCancel: {
        borderWidth: 1,
    },
    modalButtonCancelText: {
        fontWeight: '600',
    },
    modalButtonOcultar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modalButtonOcultarText: {
        fontWeight: '600',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loadingOverlayText: {
        marginTop: 12,
        opacity: 0.7,
    },
});