// hooks/useNotificaciones.ts
import { useEffect, useState, useCallback } from 'react';
import { Alert, Linking, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificacionService } from '../services/notificacionService';
import { tiendaAutenticacion } from '../stores/tiendaAutenticacion';
import { supabase } from '../lib/supabase';

interface Notificacion {
    id: number;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    leida: boolean;
    created_at: string;
}

export const useNotificaciones = () => {
    const { perfil } = tiendaAutenticacion();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [notificacionesPermitidas, setNotificacionesPermitidas] = useState(false);
    const [cargandoPermisos, setCargandoPermisos] = useState(false);

    // ✅ Verifica permiso nativo + fila en BD, con auto-reparación
    const verificarEstadoNotificaciones = useCallback(async () => {
        try {
            const tienePermisoNativo = await notificacionService.tienePermisos();
            console.log('🔍 [useNotif] Permiso nativo:', tienePermisoNativo);

            // 🚫 Si el permiso nativo es false, NO tocamos la BD: el permiso manda
            if (!tienePermisoNativo) {
                setNotificacionesPermitidas(false);
                return false;
            }

            if (!perfil?.id) {
                setNotificacionesPermitidas(true);
                return true;
            }

            // Defensivo: .order().limit(1) por si hubiera duplicados residuales
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('is_active')
                .eq('usuario_id', perfil.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('❌ [useNotif] Error consultando push_subscriptions:', error);
                setNotificacionesPermitidas(true);
                return true;
            }

            // 🔧 Auto-reparación: hay permiso nativo pero no hay fila
            if (!data) {
                console.log('🔧 [useNotif] No existe fila, creándola...');
                const { error: insertError } = await supabase
                    .from('push_subscriptions')
                    .upsert(
                        {
                            usuario_id: perfil.id,
                            is_active: true,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'usuario_id' }
                    );

                if (insertError) {
                    console.error('❌ [useNotif] Error creando fila:', insertError);
                }

                setNotificacionesPermitidas(true);
                return true;
            }

            const activo = Boolean(data.is_active);
            console.log('📊 [useNotif] is_active =', activo);
            setNotificacionesPermitidas(activo);
            return activo;
        } catch (error) {
            console.error('❌ [useNotif] Error general:', error);
            return false;
        }
    }, [perfil?.id]);

    // Activar: pide permiso nativo, registra token y upsert en BD
    const solicitarPermisosYRegistrar = useCallback(
        async (usuarioId?: string) => {
            const idAUsar = usuarioId || perfil?.id;
            setCargandoPermisos(true);
            try {
                let concedido = await notificacionService.tienePermisos();
                if (!concedido) {
                    concedido = await notificacionService.solicitarPermisos();
                }

                if (!concedido) {
                    setNotificacionesPermitidas(false);
                    Alert.alert(
                        'Permiso de notificaciones',
                        'Para recibir avisos de pedidos, habilitá las notificaciones de Krusty Burger en los ajustes del dispositivo.',
                        [
                            { text: 'Ahora no', style: 'cancel' },
                            {
                                text: 'Abrir ajustes',
                                onPress: () =>
                                    Linking.openSettings().catch(() => {
                                        Alert.alert(
                                            'Error',
                                            'No se pudieron abrir los ajustes del dispositivo.'
                                        );
                                    }),
                            },
                        ]
                    );
                    return false;
                }

                if (idAUsar) {
                    const registrado = await notificacionService.registrarToken(idAUsar);
                    if (registrado) {
                        await supabase
                            .from('push_subscriptions')
                            .upsert(
                                {
                                    usuario_id: idAUsar,
                                    is_active: true,
                                    updated_at: new Date().toISOString(),
                                },
                                { onConflict: 'usuario_id' }
                            );

                        setNotificacionesPermitidas(true);
                        Alert.alert('✅ ¡Listo!', 'Notificaciones activadas correctamente.');
                        return true;
                    }
                }
                return false;
            } catch (error) {
                console.error('❌ [useNotif] Error al activar:', error);
                return false;
            } finally {
                setCargandoPermisos(false);
            }
        },
        [perfil?.id]
    );

    // Desactivar
    const desactivarNotificaciones = useCallback(async () => {
        setCargandoPermisos(true);
        try {
            if (perfil?.id) {
                await supabase
                    .from('push_subscriptions')
                    .upsert(
                        {
                            usuario_id: perfil.id,
                            is_active: false,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'usuario_id' }
                    );
                setNotificacionesPermitidas(false);
            }
        } finally {
            setCargandoPermisos(false);
        }
    }, [perfil?.id]);

    // ✅ Re-verifica cada vez que la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            if (perfil?.id) {
                verificarEstadoNotificaciones();
            }
        }, [perfil?.id, verificarEstadoNotificaciones])
    );

    // ✅ Re-verifica al volver del background
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && perfil?.id) {
                verificarEstadoNotificaciones();
            }
        });
        return () => sub.remove();
    }, [perfil?.id, verificarEstadoNotificaciones]);

    // Cargar notificaciones + listeners entrantes
    useEffect(() => {
        if (!perfil?.id) return;

        const cargarDatosIniciales = async () => {
            try {
                await verificarEstadoNotificaciones();
                const notis = await notificacionService.obtenerNotificaciones(perfil.id, true);
                setNotificaciones(notis as Notificacion[]);
                setNoLeidas(notis.length);
            } catch (error) {
                console.error('Error cargando notificaciones:', error);
            }
        };

        cargarDatosIniciales();
        const { subscription, responseSubscription } = notificacionService.escucharNotificaciones();

        return () => {
            subscription.remove();
            responseSubscription.remove();
        };
    }, [perfil?.id, verificarEstadoNotificaciones]);

    const marcarComoLeida = async (notificacionId: number) => {
        if (!perfil?.id) return false;
        const resultado = await notificacionService.marcarComoLeida(notificacionId);
        if (resultado) {
            setNotificaciones((prev) =>
                prev.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n))
            );
            setNoLeidas((prev) => Math.max(0, prev - 1));
        }
        return resultado;
    };

    const marcarTodasComoLeidas = async () => {
        if (!perfil?.id) return false;
        const resultado = await notificacionService.marcarTodasComoLeidas(perfil.id);
        if (resultado) {
            setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
            setNoLeidas(0);
        }
        return resultado;
    };

    return {
        notificaciones,
        noLeidas,
        notificacionesPermitidas,
        cargandoPermisos,
        verificarEstadoNotificaciones,
        verificarPermisosNotificaciones: verificarEstadoNotificaciones,
        activarNotificaciones: solicitarPermisosYRegistrar,
        solicitarPermisosYRegistrar,
        desactivarNotificaciones,
        marcarComoLeida,
        marcarTodasComoLeidas,
    };
};