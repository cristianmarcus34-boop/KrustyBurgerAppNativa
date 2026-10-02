// utils/permisosHelper.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { notificacionService } from '../services/notificacionService';
import { supabase } from '../lib/supabase';

const KEY_PERMISOS_VISTOS = '@krusty_permisos_onboarding_v1';

export async function yaVioModalPermisos(): Promise<boolean> {
    const valor = await AsyncStorage.getItem(KEY_PERMISOS_VISTOS);
    return valor === 'true';
}

export async function marcarModalPermisosVisto() {
    await AsyncStorage.setItem(KEY_PERMISOS_VISTOS, 'true');
}

/**
 * Solicita permisos de notificaciones + ubicación y, si las notificaciones
 * fueron concedidas, activa al usuario en push_subscriptions.
 *
 * ⚠️ Si el permiso nativo está DENEGADO permanentemente (Android 13+),
 * no se puede volver a pedir desde la app: el caller debe abrir ajustes.
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
            } else {
                console.log('✅ [permisosHelper] push_subscriptions activado para', userId);
            }
        } else if (userId) {
            console.warn('⚠️ [permisosHelper] Notificaciones NO concedidas — no se activa en BD');
        }

        // ─────────────────────────────────────────────
        // 2. Ubicación
        // ─────────────────────────────────────────────
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus === 'granted') {
            await Location.requestBackgroundPermissionsAsync();
        }
    } catch (error) {
        console.error('❌ [permisosHelper] Error solicitando permisos completos:', error);
    }
}