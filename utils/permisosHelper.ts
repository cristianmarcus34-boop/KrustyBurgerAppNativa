// utils/permisosHelper.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { notificacionService } from '../services/notificacionService';
import { supabase } from '../lib/supabase';

const getKeyPermisosVistos = (userId: string) =>
    `@krusty_permisos_onboarding_v1_${userId}`;

export async function yaVioModalPermisos(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
        const valor = await AsyncStorage.getItem(getKeyPermisosVistos(userId));
        return valor === 'true';
    } catch (error) {
        console.error('❌ [permisosHelper] Error leyendo yaVioModalPermisos:', error);
        return false;
    }
}

/**
 * ✅ IMPORTANTE (Google Play compliance):
 * Este helper SOLO pide permisos de FOREGROUND (ubicación mientras la app está abierta).
 *
 * El permiso de BACKGROUND_LOCATION se pide ÚNICAMENTE en PantallaTransmision.tsx
 * con su propia divulgación destacada, porque solo el repartidor lo necesita
 * (para transmitir ubicación con la pantalla bloqueada).
 *
 * Si este helper pidiera BACKGROUND sin divulgación, Google Play rechazaría
 * la app por "Falta información destacada" (prominent disclosure).
 */
export async function solicitarPermisosCompletosApp(userId: string) {
    try {
        // ─────────────────────────────────────────────
        // 1. Notificaciones
        // ─────────────────────────────────────────────
        const notifConcedida = await notificacionService.solicitarPermisos();
        console.log('🔔 [permisosHelper] notifConcedida =', notifConcedida);

        if (notifConcedida && userId) {
            const tokenRegistrado = await notificacionService.registrarToken(userId);
            console.log('🔔 [permisosHelper] tokenRegistrado =', tokenRegistrado);

            const { error: upsertError } = await supabase
                .from('push_subscriptions')
                .upsert(
                    {
                        usuario_id: userId,
                        is_active: true,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'usuario_id' }
                );

            if (upsertError) {
                console.error('❌ [permisosHelper] Error upsert push_subscriptions:', upsertError);
            }
        } else {
            console.log('❌ [permisosHelper] Notificaciones NO concedidas — no se activa en BD');
        }

        // ─────────────────────────────────────────────
        // 2. Ubicación FOREGROUND (solo mientras la app está abierta)
        //    NO pedir BACKGROUND acá. Eso lo hace PantallaTransmision.tsx
        //    con su propia divulgación destacada.
        // ─────────────────────────────────────────────
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 [permisosHelper] foreground status =', fgStatus);

        if (fgStatus !== 'granted') {
            console.log('⚠️ [permisosHelper] Foreground denegado, no se pide background');
            return;
        }

        // ⚠️ NO llamar a Location.requestBackgroundPermissionsAsync() acá.
        //    El repartidor lo pide en PantallaTransmision.tsx con divulgación.
    } catch (error) {
        console.error('❌ [permisosHelper] Error solicitando permisos:', error);
    }
}