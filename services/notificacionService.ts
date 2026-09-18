// services/notificacionService.ts - CON SOPORTE MULTI-DISPOSITIVO + IMÁGENES
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ NAVIGATION REF
let navigationRef: any = null;
let isAppReady = false;
let notificacionesPendientes: any[] = [];

export const setNavigationRef = (ref: any) => {
    navigationRef = ref;
    isAppReady = true;
    console.log('✅ NavigationRef configurado');

    if (notificacionesPendientes.length > 0) {
        console.log(`📱 Procesando ${notificacionesPendientes.length} notificaciones pendientes...`);
        notificacionesPendientes.forEach(notif => procesarNotificacion(notif));
        notificacionesPendientes = [];
    }
};

// ✅ PROCESAR NOTIFICACIÓN
const procesarNotificacion = (data: any) => {
    if (!navigationRef) {
        notificacionesPendientes.push(data);
        console.log('📱 Notificación guardada para después');
        return;
    }

    const tipo = data?.tipo || 'sistema';

    try {
        const { tiendaAutenticacion } = require('../stores/tiendaAutenticacion');
        const state = tiendaAutenticacion.getState();
        const { sesion } = state;

        if (!sesion) {
            console.log('🔒 Usuario no logueado, guardando notificación');
            notificacionesPendientes.push(data);
            navigationRef.navigate('Login');
            return;
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        navigationRef.navigate('Login');
        return;
    }

    switch (tipo) {
        case 'pedido':
            if (data?.pedidoId) {
                navigationRef.navigate('Seguimiento', { pedidoId: data.pedidoId });
            } else {
                navigationRef.navigate('NotificacionesUsuario');
            }
            break;
        case 'recompensa':
            navigationRef.navigate('Recompensas');
            break;
        case 'promocion':
        case 'oferta':
        case 'sistema':
        default:
            navigationRef.navigate('NotificacionesUsuario');
            break;
    }
};

// ✅ CONFIG
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowList: true,
    }),
});

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';
const NOTIFICACIONES_OCULTAS_KEY = '@notificaciones_ocultas';

// ✅ Project ID
const getProjectId = (): string => {
    const config = Constants.expoConfig as any;
    return config?.extra?.eas?.projectId ||
        config?.projectId ||
        '709ab55b-7649-4a00-8a9c-a9dfd6aa2277';
};

export const notificacionService = {

    // ============================================================
    // 📱 REGISTRO Y PERMISOS
    // ============================================================

    async registrarToken(usuarioId: string) {
        try {
            const projectId = getProjectId();
            const token = await Notifications.getExpoPushTokenAsync({ projectId });
            const plataforma = Platform.OS;

            const { error: errorDispositivo } = await supabase
                .from('dispositivos_push')
                .upsert(
                    {
                        expo_push_token: token.data,
                        usuario_actual_id: usuarioId,
                        plataforma,
                        activo: true,
                        ultima_actividad: new Date().toISOString(),
                    },
                    { onConflict: 'expo_push_token' }
                );

            if (errorDispositivo) {
                console.error('❌ Error en dispositivos_push:', errorDispositivo);
            }

            const { error: errorPerfil } = await supabase
                .from('perfiles')
                .update({
                    fcm_token: token.data,
                    ultimo_acceso: new Date().toISOString(),
                })
                .eq('id', usuarioId);

            if (errorPerfil) {
                console.warn('⚠️ Error actualizando perfiles.fcm_token:', errorPerfil);
            }

            console.log('✅ Token registrado:', token.data);
            return true;
        } catch (error) {
            console.error('❌ Error registrando token:', error);
            return false;
        }
    },

    async obtenerTokenActual(): Promise<string | null> {
        try {
            const projectId = getProjectId();
            const token = await Notifications.getExpoPushTokenAsync({ projectId });
            return token.data;
        } catch (error) {
            console.warn('⚠️ Error obteniendo token actual:', error);
            return null;
        }
    },

    async desasociarUsuario(usuarioId: string): Promise<boolean> {
        if (!usuarioId) return false;

        try {
            const { error } = await supabase
                .from('dispositivos_push')
                .update({ usuario_actual_id: null })
                .eq('usuario_actual_id', usuarioId);

            if (error) {
                console.error('❌ Error desasociando:', error);
                return false;
            }

            console.log('✅ Usuario desasociado de dispositivos');
            return true;
        } catch (error) {
            console.error('❌ Error:', error);
            return false;
        }
    },

    async actualizarActividad(usuarioId?: string): Promise<boolean> {
        try {
            const token = await this.obtenerTokenActual();
            if (!token) return false;

            const update: any = {
                ultima_actividad: new Date().toISOString(),
                activo: true,
            };

            if (usuarioId) {
                update.usuario_actual_id = usuarioId;
            }

            const { error } = await supabase
                .from('dispositivos_push')
                .update(update)
                .eq('expo_push_token', token);

            if (error) {
                console.warn('⚠️ Error actualizando actividad:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.warn('⚠️ Error:', error);
            return false;
        }
    },

    async solicitarPermisos() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('❌ Permisos denegados');
                return false;
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('promociones', {
                    name: '🎪 Promociones Krusty',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#F5C518',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'krustyyotequieromucho.wav',
                });

                await Notifications.setNotificationChannelAsync('ofertas', {
                    name: '💰 Ofertas Krusty',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6F00',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'saxolisa.wav',
                });

                await Notifications.setNotificationChannelAsync('recompensa', {
                    name: '🎁 Recompensas',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#EC407A',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'circopararapapa.wav',
                });

                await Notifications.setNotificationChannelAsync('pedidos', {
                    name: '📦 Pedidos',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#E53935',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'saxolisa.wav',
                });

                await Notifications.setNotificationChannelAsync('sistema', {
                    name: '⚙️ Sistema',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#42A5F5',
                    enableVibrate: true,
                    enableLights: true,
                    sound: 'saxolisa.wav',
                });

                await Notifications.setNotificationChannelAsync('default', {
                    name: '🔔 General',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#B0B0B0',
                    enableVibrate: true,
                    enableLights: true,
                    sound: 'saxolisa.wav',
                });

                // ✅ Canal dedicado para notificaciones con imagen
                await Notifications.setNotificationChannelAsync('imagenes', {
                    name: '🖼️ Promociones con imagen',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#F5C518',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'saxolisa.wav',
                });
            }
            console.log('✅ Permisos concedidos y canales configurados');
            return true;
        } catch (error) {
            console.error('❌ Error solicitando permisos:', error);
            return false;
        }
    },

    escucharNotificaciones() {
        const subscription = Notifications.addNotificationReceivedListener(n => {
            console.log('📱 Notificación recibida:', n.request.content.title);
            console.log('   attachments:', (n.request.content as any).attachments);
            console.log('   data:', n.request.content.data);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(n => {
            console.log('👆 Click en notificación:', n.notification.request.content.data);
            procesarNotificacion(n.notification.request.content.data);
        });

        return { subscription, responseSubscription };
    },

    async procesarNotificacionInicial() {
        try {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response) {
                const data = response.notification.request.content.data;
                if (navigationRef) {
                    procesarNotificacion(data);
                } else {
                    notificacionesPendientes.push(data);
                }
            }
        } catch (error) {
            console.error('Error procesando notificación inicial:', error);
        }
    },

    // ============================================================
    // 📤 ENVÍO
    // ============================================================

    /**
     * Envía a múltiples tokens (con imagen y sonido)
     *
     * ✅ CAMBIOS IMPORTANTES:
     * - Quitado `sticky: true` (interfería con la imagen)
     * - Si hay imagen → fuerza `sound: 'default'` (sonidos custom rompen BigPicture)
     * - Si hay imagen → usa canal 'imagenes' con importance MAX
     * - ✅ NUEVO: usa `richContent.image` (formato correcto de Expo Push API para renderizar imagen)
     * - Log del payload final para debug
     */
    async enviarNotificacionesMasivas(tokens: string[], titulo: string, mensaje: string, data?: any) {
        try {
            const tokensValidos = tokens.filter(t => t && t.length > 10);
            if (!tokensValidos.length) {
                return { success: false, errores: ['No hay tokens válidos'] };
            }

            console.log('📷 ========== ENVIANDO ==========');
            console.log('📷 Tokens:', tokensValidos.length, '| Título:', titulo);
            console.log('📷 Imagen:', data?.imagen ? 'SÍ' : 'NO');

            const messages = tokensValidos.map(token => {
                const sonidoSeleccionado = data?.sonido;
                const imagenUrl = data?.imagen;

                // ✅ ¿Tiene imagen válida?
                const tieneImagen = !!(imagenUrl
                    && typeof imagenUrl === 'string'
                    && imagenUrl.startsWith('https://'));

                // ✅ Si hay imagen, NO usar sonido custom (rompe el BigPicture)
                const hasCustomSound = !!sonidoSeleccionado
                    && sonidoSeleccionado !== 'default'
                    && !tieneImagen;

                // ✅ Elegir canal
                let channelId = 'default';
                if (tieneImagen) {
                    channelId = 'imagenes';
                } else if (data?.tipo === 'promocion') {
                    channelId = 'promociones';
                } else if (data?.tipo === 'oferta') {
                    channelId = 'ofertas';
                } else if (data?.tipo === 'recompensa') {
                    channelId = 'recompensa';
                } else if (data?.tipo === 'pedido') {
                    channelId = 'pedidos';
                } else if (data?.tipo === 'sistema') {
                    channelId = 'sistema';
                }

                const message: any = {
                    to: token,
                    title: titulo,
                    body: mensaje,
                    data: {
                        ...data,
                        screen: 'NotificacionesUsuario',
                        timestamp: Date.now(),
                    },
                    priority: 'high',
                    channelId,
                };

                // ✅ Sonido
                if (hasCustomSound) {
                    const soundFile = sonidoSeleccionado.endsWith('.wav')
                        ? sonidoSeleccionado
                        : `${sonidoSeleccionado}.wav`;
                    message.sound = soundFile;
                } else {
                    message.sound = 'default';
                }

                // ✅ Imagen (formato correcto Expo Push API)
                if (tieneImagen) {
                    message.richContent = {
                        image: imagenUrl,
                    };
                    // Compatibilidad con algunos clientes que siguen leyendo "image"
                    message.image = imagenUrl;
                }

                // Log del payload final
                console.log('📦 [Notif] Payload final:', JSON.stringify({
                    to: '...' + token.slice(-10),
                    title: message.title,
                    body: message.body,
                    sound: message.sound,
                    channelId: message.channelId,
                    image: message.image,
                    richContent: message.richContent,
                    hasSticky: 'sticky' in message,
                }, null, 2));

                return message;
            });

            const response = await fetch(EXPO_PUSH_API, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(messages),
            });

            const result = await response.json();

            if (result.errors) {
                console.error('❌ Errores:', result.errors);
                return { success: false, errores: result.errors };
            }

            const exitos = result.data?.filter((r: any) => r.status === 'ok').length || 0;
            const fallidos = result.data?.filter((r: any) => r.status === 'error').length || 0;

            console.log(`✅ Enviados: ${exitos}, Fallidos: ${fallidos}`);

            return {
                success: fallidos === 0,
                resultados: { total: tokensValidos.length, exitos, fallidos },
                data: result.data,
            };
        } catch (error: any) {
            console.error('❌ Error enviando:', error);
            return { success: false, errores: [error?.message || 'Error desconocido'] };
        }
    },

    async enviarNotificacionAUsuario(
        usuarioId: string,
        titulo: string,
        mensaje: string,
        tipo: string = 'sistema',
        imagen?: string,
        sonido?: string
    ) {
        try {
            const { error: insertError } = await supabase
                .from('notificaciones_usuarios')
                .insert({
                    usuario_id: usuarioId,
                    titulo,
                    mensaje,
                    tipo,
                    imagen_url: imagen || null,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            const { data: dispositivos } = await supabase
                .from('dispositivos_push')
                .select('expo_push_token')
                .eq('usuario_actual_id', usuarioId)
                .eq('activo', true);

            if (!dispositivos || dispositivos.length === 0) {
                console.log('ℹ️ Usuario sin dispositivos activos');
                return { success: true, enviados: 0 };
            }

            const tokens = dispositivos.map((d: any) => d.expo_push_token);

            return await this.enviarNotificacionesMasivas(tokens, titulo, mensaje, {
                tipo, imagen, sonido
            });
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error };
        }
    },

    async enviarNotificacionMasiva(
        titulo: string,
        mensaje: string,
        tipo: string = 'sistema',
        imagen?: string,
        sonido?: string
    ) {
        try {
            const hace60dias = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

            const { data: dispositivos, error } = await supabase
                .from('dispositivos_push')
                .select('expo_push_token')
                .eq('activo', true)
                .gte('ultima_actividad', hace60dias);

            if (error) throw error;
            if (!dispositivos || dispositivos.length === 0) {
                return { success: true, enviados: 0 };
            }

            const tokens = dispositivos.map((d: any) => d.expo_push_token);

            const BATCH_SIZE = 100;
            let exitosTotales = 0;
            let fallidosTotales = 0;

            for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                const batch = tokens.slice(i, i + BATCH_SIZE);
                const resultado = await this.enviarNotificacionesMasivas(
                    batch, titulo, mensaje, { tipo, imagen, sonido }
                );

                if (resultado.resultados) {
                    exitosTotales += resultado.resultados.exitos;
                    fallidosTotales += resultado.resultados.fallidos;
                }
            }

            console.log(`✅ Masiva: ${exitosTotales} OK, ${fallidosTotales} fallidos`);

            return {
                success: true,
                resultados: {
                    total: tokens.length,
                    exitos: exitosTotales,
                    fallidos: fallidosTotales,
                },
            };
        } catch (error) {
            console.error('❌ Error masiva:', error);
            return { success: false, error };
        }
    },

    // ============================================================
    // 📥 NOTIFICACIONES (con filtro de ocultas)
    // ============================================================

    async obtenerNotificacionesOcultas(usuarioId: string): Promise<number[]> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo ocultas:', error);
            return [];
        }
    },

    async guardarNotificacionesOcultas(usuarioId: string, ids: number[]): Promise<void> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            await AsyncStorage.setItem(key, JSON.stringify(ids));
        } catch (error) {
            console.error('Error guardando ocultas:', error);
        }
    },

    async ocultarNotificacion(usuarioId: string, id: number): Promise<boolean> {
        try {
            const ocultas = await this.obtenerNotificacionesOcultas(usuarioId);
            if (!ocultas.includes(id)) {
                ocultas.push(id);
                await this.guardarNotificacionesOcultas(usuarioId, ocultas);
            }
            return true;
        } catch (error) {
            console.error('Error ocultando:', error);
            return false;
        }
    },

    async ocultarTodasNotificaciones(usuarioId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('notificaciones_usuarios')
                .select('id')
                .eq('usuario_id', usuarioId);

            if (error) throw error;

            const ids = data?.map(n => n.id) || [];
            await this.guardarNotificacionesOcultas(usuarioId, ids);
            return true;
        } catch (error) {
            console.error('Error ocultando todas:', error);
            return false;
        }
    },

    async mostrarTodasNotificaciones(usuarioId: string): Promise<void> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error mostrando todas:', error);
        }
    },

    async obtenerNotificaciones(usuarioId: string, soloNoLeidas: boolean = false) {
        if (!usuarioId) return [];

        let query = supabase
            .from('notificaciones_usuarios')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (soloNoLeidas) query = query.eq('leida', false);

        const { data, error } = await query;
        if (error) {
            console.error('Error obteniendo:', error);
            return [];
        }

        const ocultas = await this.obtenerNotificacionesOcultas(usuarioId);
        return data?.filter(n => !ocultas.includes(n.id)) || [];
    },

    async marcarComoLeida(notificacionId: number) {
        const { error } = await supabase
            .from('notificaciones_usuarios')
            .update({ leida: true })
            .eq('id', notificacionId);
        return !error;
    },

    async marcarTodasComoLeidas(usuarioId: string) {
        if (!usuarioId) return false;
        const { error } = await supabase
            .from('notificaciones_usuarios')
            .update({ leida: true })
            .eq('usuario_id', usuarioId)
            .eq('leida', false);
        return !error;
    },

    // ============================================================
    // 📊 HISTORIAL (ADMIN)
    // ============================================================

    async guardarNotificacionEnviada(titulo: string, mensaje: string, tipo: string, segmento: string, enviados: number) {
        try {
            const { data, error } = await supabase
                .rpc('guardar_notificacion_enviada', {
                    p_titulo: titulo,
                    p_mensaje: mensaje,
                    p_tipo: tipo,
                    p_segmento: segmento,
                    p_enviados: enviados
                });
            return { success: !error, data };
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false };
        }
    },

    async guardarNotificacionesMultiples(
        usuariosIds: string[],
        titulo: string,
        mensaje: string,
        tipo: string,
        imagenUrl?: string
    ) {
        if (!usuariosIds?.length) return { success: false, error: 'No hay usuarios' };
        try {
            const { error } = await supabase
                .rpc('guardar_notificaciones_multiples', {
                    p_usuarios_ids: usuariosIds,
                    p_titulo: titulo,
                    p_mensaje: mensaje,
                    p_tipo: tipo,
                    p_imagen_url: imagenUrl || null,
                });
            return { success: !error, error };
        } catch (error) {
            return { success: false, error };
        }
    },

    async obtenerHistorial() {
        try {
            const { data, error } = await supabase
                .from('notificaciones_enviadas')
                .select('*')
                .order('creado_en', { ascending: false })
                .limit(20);
            return { success: !error, data: data || [] };
        } catch (error) {
            return { success: false, data: [] };
        }
    },

    async obtenerNotificacionesAdmin(adminId: string, soloNoLeidas: boolean = false) {
        if (!adminId) return [];

        let query = supabase
            .from('notificaciones_usuarios')
            .select('*')
            .eq('usuario_id', adminId)
            .order('created_at', { ascending: false });

        if (soloNoLeidas) query = query.eq('leida', false);

        const { data, error } = await query;
        if (error) console.error('Error:', error);
        return data || [];
    },

    async eliminarNotificacion(notificacionId: number) {
        console.warn('⚠️ eliminarNotificacion deprecado. Usar ocultarNotificacion.');
        const { error } = await supabase
            .from('notificaciones_usuarios')
            .delete()
            .eq('id', notificacionId);
        return !error;
    },

    // ============================================================
    // 📊 CONTADORES (para el admin)
    // ============================================================

    async contarDispositivosActivos(): Promise<number> {
        try {
            const { count } = await supabase
                .from('dispositivos_push')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true);
            return count || 0;
        } catch {
            return 0;
        }
    },

    async contarUsuariosAlcanzables(): Promise<number> {
        try {
            const { data } = await supabase
                .from('dispositivos_push')
                .select('usuario_actual_id')
                .eq('activo', true)
                .not('usuario_actual_id', 'is', null);

            const usuariosUnicos = new Set(data?.map((d: any) => d.usuario_actual_id));
            return usuariosUnicos.size;
        } catch {
            return 0;
        }
    },
};