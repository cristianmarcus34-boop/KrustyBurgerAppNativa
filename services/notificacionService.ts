// services/notificacionService.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ✅ CONFIGURACIÓN DE NOTIFICACIONES
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowList: true,
    }),
});

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export const notificacionService = {

    // ============================================================
    // 📱 REGISTRO Y PERMISOS
    // ============================================================

    async registrarToken(usuarioId: string) {
        try {
            const config = Constants.expoConfig as any;
            const projectId = config?.extra?.eas?.projectId ||
                config?.projectId ||
                '709ab55b-7649-4a00-8a9c-a9dfd6aa2277';

            const token = await Notifications.getExpoPushTokenAsync({ projectId });

            const { error } = await supabase
                .from('perfiles')
                .update({ fcm_token: token.data, ultimo_acceso: new Date().toISOString() })
                .eq('id', usuarioId);

            if (error) throw error;
            console.log('✅ Token FCM registrado');
            return true;
        } catch (error) {
            console.error('❌ Error registrando token:', error);
            return false;
        }
    },

    // ✅ SOLICITAR PERMISOS CON CANALES CONFIGURADOS CON SONIDOS
    async solicitarPermisos() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('❌ Permisos denegados');
                return false;
            }

            if (Platform.OS === 'android') {
                // ✅ CANAL PROMOCIONES (con sonido Krusty por defecto)
                await Notifications.setNotificationChannelAsync('promociones', {
                    name: '🎪 Promociones Krusty',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#F5C518',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'krustyyotequieromucho.wav', // 👈 SONIDO POR DEFECTO
                });

                // ✅ CANAL OFERTAS (con sonido Saxo por defecto)
                await Notifications.setNotificationChannelAsync('ofertas', {
                    name: '💰 Ofertas Krusty',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF6F00',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'saxolisa.wav', // 👈 SONIDO POR DEFECTO
                });

                // ✅ CANAL RECOMPENSAS (con sonido Circo por defecto)
                await Notifications.setNotificationChannelAsync('recompensa', {
                    name: '🎁 Recompensas',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#EC407A',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: 'circopararapapa.wav', // 👈 SONIDO POR DEFECTO
                });

                // ✅ CANAL PEDIDOS
                await Notifications.setNotificationChannelAsync('pedidos', {
                    name: '📦 Pedidos',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#E53935',
                    enableVibrate: true,
                    enableLights: true,
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    sound: null,
                });

                // ✅ CANAL SISTEMA
                await Notifications.setNotificationChannelAsync('sistema', {
                    name: '⚙️ Sistema',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#42A5F5',
                    enableVibrate: true,
                    enableLights: true,
                    sound: 'saxolisa.wav',
                });

                // ✅ CANAL DEFAULT
                await Notifications.setNotificationChannelAsync('default', {
                    name: '🔔 General',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#B0B0B0',
                    enableVibrate: true,
                    enableLights: true,
                    sound: 'saxolisa.wav',
                });
            }
            console.log('✅ Permisos concedidos y canales configurados con sonidos');
            return true;
        } catch (error) {
            console.error('❌ Error solicitando permisos:', error);
            return false;
        }
    },

    escucharNotificaciones() {
        const subscription = Notifications.addNotificationReceivedListener(n => {
            console.log('📱 Notificación recibida:', n.request.content.title);
        });
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(n => {
            console.log('👆 Click en notificación:', n.notification.request.content.data);
        });
        return { subscription, responseSubscription };
    },

    // ============================================================
    // 📤 ENVÍO DE NOTIFICACIONES CON IMAGEN Y SONIDO
    // ============================================================

    async enviarNotificacionesMasivas(tokens: string[], titulo: string, mensaje: string, data?: any) {
        try {
            const tokensValidos = tokens.filter(t => t && t.length > 10);
            if (!tokensValidos.length) {
                return { success: false, errores: ['No hay tokens válidos'] };
            }

            console.log('📷 ========== ENVIANDO NOTIFICACIONES ==========');
            console.log('📷 Tokens válidos:', tokensValidos.length);
            console.log('📷 Título:', titulo);
            console.log('📷 Mensaje:', mensaje);
            console.log('📷 Datos recibidos:', JSON.stringify(data, null, 2));

            // ✅ CONSTRUIR MENSAJES CON IMAGEN Y SONIDO
            const messages = tokensValidos.map(token => {
                // ✅ OBTENER EL SONIDO DE LOS DATOS
                const sonidoSeleccionado = data?.sonido;

                // ✅ SOLO agregar sound si NO es 'default' y existe
                const hasCustomSound = sonidoSeleccionado && sonidoSeleccionado !== 'default';
                console.log('🔊 Sonido para esta notificación:', hasCustomSound ? sonidoSeleccionado : 'sin sonido personalizado');

                const message: any = {
                    to: token,
                    title: titulo,
                    body: mensaje,
                    data: data || {},
                    priority: 'high',
                    channelId: data?.tipo === 'promocion' ? 'promociones' :
                        data?.tipo === 'oferta' ? 'ofertas' :
                            data?.tipo === 'recompensa' ? 'recompensa' :
                                data?.tipo === 'pedido' ? 'pedidos' :
                                    data?.tipo === 'sistema' ? 'sistema' : 'default',
                };

                // ✅ Agregar sound SOLO si es un sonido personalizado
                if (hasCustomSound) {
                    message.sound = sonidoSeleccionado;
                    console.log('🔊 Sonido personalizado agregado al payload:', sonidoSeleccionado);
                }

                // ✅ AGREGAR IMAGEN SI EXISTE
                const imagenUrl = data?.imagen;
                console.log('📷 URL de imagen a procesar:', imagenUrl);

                if (imagenUrl && typeof imagenUrl === 'string') {
                    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
                        message.image = imagenUrl;
                        message.sticky = true;
                        console.log('✅ IMAGEN AGREGADA AL PAYLOAD:', imagenUrl);
                    } else {
                        console.log('⚠️ URL de imagen no válida (no comienza con http):', imagenUrl);
                    }
                } else {
                    console.log('ℹ️ No hay imagen para esta notificación');
                }

                return message;
            });

            // ✅ LOG DETALLADO DEL PAYLOAD
            console.log('📷 ========== PAYLOAD COMPLETO ==========');
            console.log(JSON.stringify(messages, null, 2));
            console.log('📷 ========================================');

            const response = await fetch(EXPO_PUSH_API, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(messages),
            });

            const result = await response.json();

            console.log('📷 ========== RESPUESTA DE EXPO ==========');
            console.log(JSON.stringify(result, null, 2));
            console.log('📷 ========================================');

            if (result.errors) {
                console.error('❌ Errores en la respuesta:', result.errors);
                return { success: false, errores: result.errors };
            }

            const exitos = result.data?.filter((r: any) => r.status === 'ok').length || 0;
            const fallidos = result.data?.filter((r: any) => r.status === 'error').length || 0;

            console.log(`✅ Enviados: ${exitos}, Fallidos: ${fallidos}`);

            if (result.data) {
                result.data.forEach((r: any, index: number) => {
                    if (r.status === 'error') {
                        console.log(`❌ Error en mensaje ${index + 1}:`, r.message);
                        console.log(`   Token: ${messages[index]?.to?.substring(0, 30)}...`);
                    }
                });
            }

            return {
                success: fallidos === 0,
                resultados: { total: tokensValidos.length, exitos, fallidos },
                data: result.data,
                errores: fallidos > 0 ? 'Algunos mensajes fallaron' : undefined,
            };

        } catch (error: any) {
            console.error('❌ Error enviando notificaciones:', error);
            return { success: false, errores: [error?.message || 'Error desconocido'] };
        }
    },

    async enviarNotificacionAUsuario(usuarioId: string, titulo: string, mensaje: string, tipo: string = 'sistema', imagen?: string) {
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

            const { data: usuario } = await supabase
                .from('perfiles')
                .select('fcm_token')
                .eq('id', usuarioId)
                .single();

            if (usuario?.fcm_token) {
                const message: any = {
                    to: usuario.fcm_token,
                    title: titulo,
                    body: mensaje,
                    data: { tipo },
                    priority: 'high',
                };

                if (imagen && imagen.startsWith('http')) {
                    message.image = imagen;
                    message.sticky = true;
                    console.log('📷 Imagen agregada a notificación individual:', imagen);
                }

                await fetch(EXPO_PUSH_API, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(message),
                });
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error };
        }
    },

    // ============================================================
    // 📥 OBTENER NOTIFICACIONES
    // ============================================================

    async obtenerNotificaciones(usuarioId: string, soloNoLeidas: boolean = false) {
        if (!usuarioId) return [];
        let query = supabase
            .from('notificaciones_usuarios')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (soloNoLeidas) query = query.eq('leida', false);

        const { data, error } = await query;
        if (error) console.error('Error obteniendo notificaciones:', error);
        return data || [];
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
            console.log('📷 Notificaciones guardadas con imagen:', imagenUrl || 'sin imagen');
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

    async eliminarNotificacion(notificacionId: number) {
        const { error } = await supabase
            .from('notificaciones_usuarios')
            .delete()
            .eq('id', notificacionId);
        return !error;
    },
};