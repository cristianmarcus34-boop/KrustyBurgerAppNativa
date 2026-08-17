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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificacionService } from '../../services/notificacionService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

// 🎷 COLORES DE LISA SIMPSON
const LISA_COLORS = {
    morado: Colores.moradoLisa,
    rosa: Colores.rosaMaggie,
    blanco: Colores.textoClaro,
    negro: Colores.textoOscuro,
    gris: Colores.textoGris,
    amarillo: Colores.primario,
    verde: Colores.verdeClaro,
};

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
        promocion: Colores.primario,
        oferta: Colores.verdeClaro,
        recompensa: LISA_COLORS.rosa,
        sistema: Colores.azulClaro,
        pedido: Colores.acento,
    };
    return map[tipo] || LISA_COLORS.gris;
};

export default function PantallaNotificacionesUsuario(props: any) {
    const { perfil } = tiendaAutenticacion();
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
            // ✅ Obtener notificaciones (ya filtradas por el servicio)
            const data = await notificacionService.obtenerNotificaciones(perfil.id);
            // ✅ Obtener IDs de notificaciones ocultas
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

    // ✅ OCULTAR UNA NOTIFICACIÓN
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

    // ✅ OCULTAR TODAS LAS NOTIFICACIONES
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

    // ✅ RESTAURAR TODAS LAS NOTIFICACIONES
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

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={LISA_COLORS.morado} />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 🎷 GRADIENTE LISA: Morado → Rosa */}
            <LinearGradient
                colors={[LISA_COLORS.morado, LISA_COLORS.rosa]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={LISA_COLORS.blanco} />
                </TouchableOpacity>

                <Text style={styles.title}>🎷 Notificaciones</Text>

                <View style={styles.headerActions}>
                    {/* ✅ Recargar */}
                    <TouchableOpacity onPress={cargarNotificaciones} style={styles.iconButton}>
                        <Ionicons name="refresh" size={22} color={LISA_COLORS.blanco} />
                    </TouchableOpacity>

                    {/* ✅ Ocultar todas */}
                    {notificaciones.length > 0 && (
                        <TouchableOpacity onPress={confirmarOcultarTodas} style={styles.iconButton}>
                            <Ionicons name="eye-off-outline" size={22} color={LISA_COLORS.rosa} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ✅ CONTADOR DE NO LEÍDAS */}
            {noLeidas > 0 && (
                <View style={styles.counterContainer}>
                    <Text style={styles.counterText}>
                        🔔 {noLeidas} notificación{noLeidas !== 1 ? 'es' : ''} sin leer
                    </Text>
                    <TouchableOpacity onPress={marcarTodasComoLeidas} activeOpacity={0.7}>
                        <Text style={styles.markAllText}>Marcar todas como leídas</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ✅ OPCIONES DE RECUPERACIÓN */}
            {notificacionesOcultas.length > 0 && (
                <TouchableOpacity
                    style={styles.restaurarContainer}
                    onPress={restaurarTodasNotificaciones}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh-circle-outline" size={20} color={LISA_COLORS.verde} />
                    <Text style={styles.restaurarTexto}>
                        Restaurar {notificacionesOcultas.length} notificación{notificacionesOcultas.length !== 1 ? 'es' : ''} oculta{notificacionesOcultas.length !== 1 ? 's' : ''}
                    </Text>
                </TouchableOpacity>
            )}

            {/* ✅ LISTA DE NOTIFICACIONES */}
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={cargarNotificaciones}
                        tintColor={LISA_COLORS.morado}
                    />
                }
            >
                {notificaciones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={60} color={LISA_COLORS.blanco + '40'} />
                        <Text style={styles.emptyText}>No tienes notificaciones</Text>
                        <Text style={styles.emptySubtext}>
                            {notificacionesOcultas.length > 0
                                ? `Tienes ${notificacionesOcultas.length} ocultas. Toca arriba para restaurarlas.`
                                : '¡Estás al día! 🎉'}
                        </Text>
                    </View>
                ) : (
                    notificaciones.map((item) => {
                        const hasImage = item.imagen_url || item.imagen;
                        const imageUrl = item.imagen_url || item.imagen;

                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.notificacionItem,
                                    !item.leida && styles.notificacionNoLeida
                                ]}
                            >
                                <TouchableOpacity
                                    style={styles.notificacionContent}
                                    onPress={() => marcarComoLeida(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.notificacionHeader}>
                                        <View style={styles.notificacionTipo}>
                                            <Text style={styles.notificacionIcono}>
                                                {getIconForTipo(item.tipo)}
                                            </Text>
                                            <Text style={[styles.notificacionTipoText, { color: getColorForTipo(item.tipo) }]}>
                                                {item.tipo.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.notificacionHeaderRight}>
                                            {!item.leida && <View style={styles.notificacionNoLeidaDot} />}
                                            {/* ✅ Botón ocultar */}
                                            <TouchableOpacity
                                                onPress={() => confirmarOcultar(item.id)}
                                                style={styles.ocultarButton}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="eye-off-outline" size={18} color={LISA_COLORS.blanco + '30'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {hasImage && (
                                        <View style={styles.bannerContainer}>
                                            <Image
                                                source={{ uri: imageUrl }}
                                                style={styles.bannerImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}

                                    <Text style={styles.notificacionTitulo}>{item.titulo}</Text>
                                    <Text style={styles.notificacionMensaje}>{item.mensaje}</Text>
                                    <Text style={styles.notificacionFecha}>
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
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Ionicons name="eye-off-outline" size={48} color={LISA_COLORS.rosa} />
                        </View>
                        <Text style={styles.modalTitle}>Ocultar notificación</Text>
                        <Text style={styles.modalMessage}>
                            Esta notificación se ocultará solo para ti. Podrás restaurarla después.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNotificacionAOcultar(null);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonOcultar]}
                                onPress={() => {
                                    if (notificacionAOcultar !== null) {
                                        ocultarNotificacion(notificacionAOcultar);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="eye-off-outline" size={18} color={LISA_COLORS.blanco} />
                                <Text style={styles.modalButtonOcultarText}>Ocultar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ INDICADOR DE CARGA */}
            {ocultandoTodas && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={LISA_COLORS.morado} />
                    <Text style={styles.loadingOverlayText}>Ocultando notificaciones...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LISA_COLORS.negro,
    },
    gradient: {
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
        backgroundColor: LISA_COLORS.negro,
    },
    loadingText: {
        color: LISA_COLORS.gris,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: LISA_COLORS.blanco + '20',
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
        color: LISA_COLORS.blanco,
        fontSize: 20,
        flex: 1,
        textAlign: 'center',
    },
    markAllText: {
        color: LISA_COLORS.rosa,
        fontSize: 12,
        fontWeight: '500',
    },
    scroll: {
        padding: 16,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: LISA_COLORS.blanco,
        fontSize: 16,
        marginTop: 12,
        opacity: 0.6,
    },
    emptySubtext: {
        color: LISA_COLORS.blanco,
        fontSize: 12,
        marginTop: 4,
        opacity: 0.4,
    },
    notificacionItem: {
        backgroundColor: LISA_COLORS.negro + '60',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: LISA_COLORS.blanco + '10',
        overflow: 'hidden',
    },
    notificacionContent: {
        padding: 16,
    },
    notificacionNoLeida: {
        borderColor: LISA_COLORS.rosa,
        backgroundColor: LISA_COLORS.rosa + '10',
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
        fontSize: 16,
    },
    notificacionTipoText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    notificacionNoLeidaDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: LISA_COLORS.rosa,
    },
    ocultarButton: {
        padding: 4,
    },
    notificacionTitulo: {
        color: LISA_COLORS.blanco,
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notificacionMensaje: {
        color: LISA_COLORS.blanco,
        fontSize: 13,
        marginBottom: 6,
        opacity: 0.7,
    },
    notificacionFecha: {
        color: LISA_COLORS.blanco,
        fontSize: 11,
        opacity: 0.4,
    },
    bannerContainer: {
        marginTop: 8,
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: LISA_COLORS.negro + '40',
        width: '100%',
        aspectRatio: 16 / 9,
        borderWidth: 1,
        borderColor: LISA_COLORS.rosa + '30',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: LISA_COLORS.rosa + '15',
        borderBottomWidth: 1,
        borderBottomColor: LISA_COLORS.rosa + '20',
    },
    counterText: {
        color: LISA_COLORS.blanco,
        fontSize: 13,
        fontWeight: '500',
    },
    restaurarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: LISA_COLORS.verde + '15',
        borderBottomWidth: 1,
        borderBottomColor: LISA_COLORS.verde + '20',
        gap: 8,
    },
    restaurarTexto: {
        color: LISA_COLORS.verde,
        fontSize: 13,
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
        backgroundColor: LISA_COLORS.negro,
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 340,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LISA_COLORS.blanco + '10',
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: LISA_COLORS.rosa + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        color: LISA_COLORS.blanco,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalMessage: {
        color: LISA_COLORS.gris,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    modalButtonCancel: {
        backgroundColor: LISA_COLORS.negro + '40',
        borderWidth: 1,
        borderColor: LISA_COLORS.blanco + '10',
    },
    modalButtonCancelText: {
        color: LISA_COLORS.blanco,
        fontWeight: '600',
        fontSize: 14,
    },
    modalButtonOcultar: {
        backgroundColor: LISA_COLORS.morado,
    },
    modalButtonOcultarText: {
        color: LISA_COLORS.blanco,
        fontWeight: '600',
        fontSize: 14,
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
        color: LISA_COLORS.blanco,
        marginTop: 12,
        fontSize: 14,
    },
});