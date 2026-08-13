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

const COLORS = {
    amarillo: '#F5C518',
    blanco: '#FFFFFF',
    negro: '#0A0A0A',
    grisOscuro: '#1A1A1A',
    grisClaro: '#B0B0B0',
    verde: '#43A047',
    rojo: '#E53935',
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
        promocion: '#F5C518',
        oferta: '#66BB6A',
        recompensa: '#EC407A',
        sistema: '#42A5F5',
        pedido: '#FF6F00',
    };
    return map[tipo] || COLORS.grisClaro;
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
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#43A047', '#0A0A0A']} style={styles.gradient} />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={COLORS.blanco} />
                </TouchableOpacity>
                <Text style={styles.title}>📱 Notificaciones</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={cargarNotificaciones} style={styles.reloadButton}>
                        <Ionicons name="refresh" size={22} color={COLORS.amarillo} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={marcarTodasComoLeidas} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>Leer todas</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={cargarNotificaciones} tintColor={COLORS.amarillo} />}
            >
                {notificaciones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={60} color={COLORS.grisClaro} />
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

                                {/* ✅ BANNER / IMAGEN - ESTILO MOSTAZA */}
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
    container: { flex: 1, backgroundColor: COLORS.negro },
    gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.negro },
    loadingText: { color: COLORS.grisClaro, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grisClaro + '20' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backButton: { padding: 4 },
    reloadButton: { padding: 8 },
    title: { fontWeight: 'bold', color: COLORS.blanco, fontSize: 20, flex: 1, textAlign: 'center' },
    markAllButton: { padding: 8 },
    markAllText: { color: COLORS.amarillo, fontSize: 12, fontWeight: '500' },
    scroll: { padding: 16, flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyText: { color: COLORS.grisClaro, fontSize: 16, marginTop: 12, opacity: 0.6 },
    emptySubtext: { color: COLORS.grisClaro, fontSize: 12, marginTop: 4, opacity: 0.4 },
    notificacionItem: { backgroundColor: COLORS.negro + '60', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.grisClaro + '10' },
    notificacionNoLeida: { borderColor: COLORS.amarillo, backgroundColor: COLORS.amarillo + '10' },
    notificacionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    notificacionTipo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    notificacionIcono: { fontSize: 16 },
    notificacionTipoText: { fontSize: 11, fontWeight: 'bold' },
    notificacionNoLeidaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amarillo },
    notificacionTitulo: { color: COLORS.blanco, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    notificacionMensaje: { color: COLORS.grisClaro, fontSize: 13, marginBottom: 6, opacity: 0.8 },
    notificacionFecha: { color: COLORS.grisClaro, fontSize: 11, opacity: 0.4 },
    // ✅ BANNER / IMAGEN - ESTILO MOSTAZA
    bannerContainer: {
        marginTop: 8,
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: COLORS.grisOscuro,
        width: '100%',
        aspectRatio: 16 / 9, // 👈 Relación de aspecto 16:9 como Mostaza
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
});