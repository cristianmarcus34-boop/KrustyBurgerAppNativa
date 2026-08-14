// screens/cliente/PantallaNotificacionesUsuario.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, ActivityIndicator, Image
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
    morado: Colores.moradoLisa,      // '#7B1FA2' - Vestido de Lisa
    rosa: Colores.rosaMaggie,        // '#F48FB1' - Collar de Lisa
    blanco: Colores.textoClaro,      // '#FFFFFF'
    negro: Colores.textoOscuro,      // '#0A0A0A'
    gris: Colores.textoGris,         // '#B0B0B0'
    amarillo: Colores.primario,      // '#F5C518' - Piel de Lisa
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
        recompensa: Colores.rosaMaggie,
        sistema: Colores.azulClaro,
        pedido: Colores.acento,
    };
    return map[tipo] || LISA_COLORS.gris;
};

export default function PantallaNotificacionesUsuario(props: any) {
    const { perfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);

    console.log('🔍 PantallaNotificacionesUsuario - perfil:', perfil);
    console.log('🔍 PantallaNotificacionesUsuario - perfil.id:', perfil?.id);
    console.log('🔍 PantallaNotificacionesUsuario - perfil.nombre:', perfil?.nombre_cliente);

    useFocusEffect(
        useCallback(() => {
            console.log('🔄 useFocusEffect - cargando notificaciones...');
            cargarNotificaciones();
        }, [])
    );

    const cargarNotificaciones = async () => {
        console.log('📱 cargarNotificaciones - iniciando...');
        console.log('📱 cargarNotificaciones - perfil actual:', perfil);
        console.log('📱 cargarNotificaciones - perfil.id actual:', perfil?.id);

        if (!perfil?.id) {
            console.log('❌ cargarNotificaciones - perfil sin ID');
            setCargando(false);
            return;
        }
        console.log('📱 cargarNotificaciones - ID del usuario:', perfil.id);
        setCargando(true);
        const data = await notificacionService.obtenerNotificaciones(perfil.id);
        console.log('📱 cargarNotificaciones - notificaciones obtenidas:', data.length);
        console.log('📱 cargarNotificaciones - datos:', JSON.stringify(data, null, 2));
        setNotificaciones(data);
        setCargando(false);
        setRefrescando(false);
    };

    const marcarComoLeida = async (id: number) => {
        console.log('📱 marcando como leída:', id);
        await notificacionService.marcarComoLeida(id);
        cargarNotificaciones();
    };

    const marcarTodasComoLeidas = async () => {
        if (!perfil?.id) return;
        console.log('📱 marcando todas como leídas');
        await notificacionService.marcarTodasComoLeidas(perfil.id);
        cargarNotificaciones();
    };

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

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={LISA_COLORS.blanco} />
                </TouchableOpacity>
                <Text style={styles.title}>🎷 Notificaciones</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={cargarNotificaciones} style={styles.reloadButton}>
                        <Ionicons name="refresh" size={22} color={LISA_COLORS.blanco} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={marcarTodasComoLeidas} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Leer todas</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={cargarNotificaciones} tintColor={LISA_COLORS.morado} />}
            >
                {notificaciones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={60} color={LISA_COLORS.blanco + '40'} />
                        <Text style={styles.emptyText}>No tienes notificaciones</Text>
                        <Text style={styles.emptySubtext}>ID de usuario: {perfil?.id || 'N/A'}</Text>
                    </View>
                ) : (
                    notificaciones.map((item) => {
                        const hasImage = item.imagen_url || item.imagen;
                        const imageUrl = item.imagen_url || item.imagen;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.notificacionItem,
                                    !item.leida && styles.notificacionNoLeida
                                ]}
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
                                    {!item.leida && <View style={styles.notificacionNoLeidaDot} />}
                                </View>

                                {/* 🎷 BANNER / IMAGEN */}
                                {hasImage && (
                                    <View style={styles.bannerContainer}>
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.bannerImage}
                                            resizeMode="cover"
                                            onError={(e) => console.log('❌ Error cargando banner:', e.nativeEvent.error)}
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
                        );
                    })
                )}
            </ScrollView>
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
    backButton: {
        padding: 4,
    },
    reloadButton: {
        padding: 8,
    },
    title: {
        fontWeight: 'bold',
        color: LISA_COLORS.blanco,
        fontSize: 20,
        flex: 1,
        textAlign: 'center',
    },
    markAllButton: {
        padding: 8,
    },
    markAllText: {
        color: LISA_COLORS.blanco,
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.8,
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
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: LISA_COLORS.blanco + '10',
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
});