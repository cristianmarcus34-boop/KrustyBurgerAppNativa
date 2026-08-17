// services/notificacionService.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ NAVIGATION REF - Para navegar desde notificaciones
let navigationRef: any = null;
let isAppReady = false;
let notificacionesPendientes: any[] = [];

export const setNavigationRef = (ref: any) => {
    navigationRef = ref;
    isAppReady = true;
    console.log('✅ NavigationRef configurado para notificaciones');

    // ✅ Procesar notificaciones pendientes
    if (notificacionesPendientes.length > 0) {
        console.log(`📱 Procesando ${notificacionesPendientes.length} notificaciones pendientes...`);
        notificacionesPendientes.forEach(notif => {
            procesarNotificacion(notif);
        });
        notificacionesPendientes = [];
    }
};

// ✅ FUNCIÓN PARA PROCESAR NOTIFICACIÓN
const procesarNotificacion = (data: any) => {
    if (!navigationRef) {
        // ✅ Guardar para después
        notificacionesPendientes.push(data);
        console.log('📱 Notificación guardada para procesar después');
        return;
    }

    const tipo = data?.tipo || 'sistema';

    // ✅ Verificar si el usuario está logueado (usando el store)
    try {
        const { tiendaAutenticacion } = require('../stores/tiendaAutenticacion');
        const state = tiendaAutenticacion.getState();
        const { sesion } = state;

        if (!sesion) {
            // ✅ Si no está logueado, guardar la notificación y redirigir al Login
            console.log('🔒 Usuario no logueado, guardando notificación para después');
            notificacionesPendientes.push(data);

            // ✅ Navegar al Login
            navigationRef.navigate('Login');
            return;
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        // Si hay error, redirigir al Login por seguridad
        navigationRef.navigate('Login');
        return;
    }

    // ✅ Usuario logueado - navegar según tipo
    switch (tipo) {
        case 'pedido':
            if (data?.pedidoId) {
                console.log('🔗 Navegando a Seguimiento con pedido:', data.pedidoId);
                navigationRef.navigate('Seguimiento', { pedidoId: data.pedidoId });
            } else {
                console.log('🔗 Navegando a NotificacionesUsuario');
                navigationRef.navigate('NotificacionesUsuario');
            }
            break;
        case 'recompensa':
            console.log('🔗 Navegando a Recompensas');
            navigationRef.navigate('Recompensas');
            break;
        case 'promocion':
        case 'oferta':
        case 'sistema':
        default:
            console.log('🔗 Navegando a NotificacionesUsuario');
            navigationRef.navigate('NotificacionesUsuario');
            break;
    }
};

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
const NOTIFICACIONES_OCULTAS_KEY = '@notificaciones_ocultas';

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
            console.log('✅ Token FCM registrado:', token.data);
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
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#42A5F5',
                    enableVibrate: true,
                    enableLights: true,
                    sound: 'saxolisa.wav',
                });

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

    // ✅ ESCUCHAR NOTIFICACIONES CON NAVEGACIÓN
    escucharNotificaciones() {
        const subscription = Notifications.addNotificationReceivedListener(n => {
            console.log('📱 Notificación recibida:', n.request.content.title);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(n => {
            console.log('👆 Click en notificación:', n.notification.request.content.data);
            const data = n.notification.request.content.data;
            procesarNotificacion(data);
        });

        return { subscription, responseSubscription };
    },

    // ✅ PROCESAR NOTIFICACIÓN INICIAL (app cerrada)
    async procesarNotificacionInicial() {
        try {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response) {
                console.log('📱 Notificación inicial (app cerrada):', response.notification.request.content.data);
                const data = response.notification.request.content.data;
                // ✅ Esperar a que la app esté lista
                if (navigationRef) {
                    procesarNotificacion(data);
                } else {
                    notificacionesPendientes.push(data);
                    console.log('📱 Notificación guardada para procesar después (app iniciando)');
                }
            }
        } catch (error) {
            console.error('Error procesando notificación inicial:', error);
        }
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

            const messages = tokensValidos.map(token => {
                const sonidoSeleccionado = data?.sonido;
                const hasCustomSound = sonidoSeleccionado && sonidoSeleccionado !== 'default';

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
                    channelId: data?.tipo === 'promocion' ? 'promociones' :
                        data?.tipo === 'oferta' ? 'ofertas' :
                            data?.tipo === 'recompensa' ? 'recompensa' :
                                data?.tipo === 'pedido' ? 'pedidos' :
                                    data?.tipo === 'sistema' ? 'sistema' : 'default',
                };

                if (hasCustomSound) {
                    const soundFile = sonidoSeleccionado.endsWith('.wav')
                        ? sonidoSeleccionado
                        : `${sonidoSeleccionado}.wav`;
                    message.sound = soundFile;
                    console.log('🔊 Sonido personalizado agregado al payload:', soundFile);
                }

                const imagenUrl = data?.imagen;
                if (imagenUrl && typeof imagenUrl === 'string') {
                    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
                        message.image = imagenUrl;
                        message.sticky = true;
                        console.log('✅ IMAGEN AGREGADA AL PAYLOAD:', imagenUrl);
                    }
                }

                return message;
            });

            const response = await fetch(EXPO_PUSH_API, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(messages),
            });

            const result = await response.json();

            if (result.errors) {
                console.error('❌ Errores en la respuesta:', result.errors);
                return { success: false, errores: result.errors };
            }

            const exitos = result.data?.filter((r: any) => r.status === 'ok').length || 0;
            const fallidos = result.data?.filter((r: any) => r.status === 'error').length || 0;

            console.log(`✅ Enviados: ${exitos}, Fallidos: ${fallidos}`);

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

    async enviarNotificacionAUsuario(usuarioId: string, titulo: string, mensaje: string, tipo: string = 'sistema', imagen?: string, sonido?: string) {
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
                    data: {
                        tipo,
                        screen: 'NotificacionesUsuario',
                        timestamp: Date.now(),
                    },
                    priority: 'high',
                };

                if (sonido && sonido !== 'default') {
                    const soundFile = sonido.endsWith('.wav') ? sonido : `${sonido}.wav`;
                    message.sound = soundFile;
                }

                if (imagen && imagen.startsWith('http')) {
                    message.image = imagen;
                    message.sticky = true;
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
    // 📥 OBTENER NOTIFICACIONES (CON FILTRO DE OCULTAS)
    // ============================================================

    async obtenerNotificacionesOcultas(usuarioId: string): Promise<number[]> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo notificaciones ocultas:', error);
            return [];
        }
    },

    async guardarNotificacionesOcultas(usuarioId: string, ids: number[]): Promise<void> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            await AsyncStorage.setItem(key, JSON.stringify(ids));
        } catch (error) {
            console.error('Error guardando notificaciones ocultas:', error);
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
            console.error('Error ocultando notificación:', error);
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
            console.error('Error ocultando todas las notificaciones:', error);
            return false;
        }
    },

    async mostrarTodasNotificaciones(usuarioId: string): Promise<void> {
        try {
            const key = `${NOTIFICACIONES_OCULTAS_KEY}_${usuarioId}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error mostrando todas las notificaciones:', error);
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
            console.error('Error obteniendo notificaciones:', error);
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
        if (error) console.error('Error obteniendo notificaciones de admin:', error);
        return data || [];
    },

    // ⚠️ DEPRECADO: Usar ocultarNotificacion en su lugar
    async eliminarNotificacion(notificacionId: number) {
        console.warn('⚠️ eliminarNotificacion está deprecado. Usar ocultarNotificacion en su lugar.');
        const { error } = await supabase
            .from('notificaciones_usuarios')
            .delete()
            .eq('id', notificacionId);
        return !error;
    },
};