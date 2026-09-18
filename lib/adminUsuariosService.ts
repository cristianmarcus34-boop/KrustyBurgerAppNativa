// lib/admin/adminUsuariosService.ts
import { supabase } from '../lib/supabase';

// ============================================================
// 🔐 HELPERS
// ============================================================
const getAdminId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
};

const registrarAuditoria = async (params: {
    usuario_id: string;
    accion: string;
    datos_antes?: any;
    datos_despues?: any;
    motivo?: string;
}): Promise<void> => {
    try {
        const admin_id = await getAdminId();
        if (!admin_id) return;

        await supabase.from('admin_audit_log').insert({
            admin_id,
            usuario_id: params.usuario_id,
            accion: params.accion,
            datos_antes: params.datos_antes ?? null,
            datos_despues: params.datos_despues ?? null,
            motivo: params.motivo ?? null,
        });
    } catch (error) {
        console.warn('⚠️ No se pudo registrar auditoría:', error);
    }
};

// ============================================================
// 🚫 BANEAR / DESBANEAR
// ============================================================
export const adminUsuariosService = {
    async banearUsuario(
        usuarioId: string,
        motivo: string,
        baneadoHasta: string | null, // null = indefinido
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: antes } = await supabase
                .from('perfiles')
                .select('baneado_hasta, motivo_ban')
                .eq('id', usuarioId)
                .single();

            const { error } = await supabase
                .from('perfiles')
                .update({
                    baneado_hasta: baneadoHasta,
                    motivo_ban: motivo,
                })
                .eq('id', usuarioId);

            if (error) throw error;

            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: baneadoHasta ? 'ban_temporal' : 'ban_indefinido',
                datos_antes: antes,
                datos_despues: { baneado_hasta: baneadoHasta, motivo_ban: motivo },
                motivo,
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error baneando:', error);
            return { success: false, error: error?.message || 'Error al banear' };
        }
    },

    async desbanearUsuario(usuarioId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: antes } = await supabase
                .from('perfiles')
                .select('baneado_hasta, motivo_ban')
                .eq('id', usuarioId)
                .single();

            const { error } = await supabase
                .from('perfiles')
                .update({
                    baneado_hasta: null,
                    motivo_ban: null,
                })
                .eq('id', usuarioId);

            if (error) throw error;

            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: 'desban',
                datos_antes: antes,
                datos_despues: { baneado_hasta: null, motivo_ban: null },
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error desbaneando:', error);
            return { success: false, error: error?.message || 'Error al desbanear' };
        }
    },

    // ============================================================
    // ⭐ AJUSTAR PUNTOS
    // ============================================================
    async ajustarPuntos(
        usuarioId: string,
        delta: number, // positivo o negativo
        motivo: string,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Traer saldo actual
            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('puntos_acumulados, puntos_disponibles')
                .eq('id', usuarioId)
                .single();

            if (errorPerfil || !perfil) {
                throw new Error('Perfil no encontrado');
            }

            const puntosAcumuladosAntes = perfil.puntos_acumulados || 0;
            const puntosDisponiblesAntes = perfil.puntos_disponibles || 0;

            const nuevosAcumulados = Math.max(0, puntosAcumuladosAntes + delta);
            const nuevosDisponibles = Math.max(0, puntosDisponiblesAntes + delta);

            // 2. Actualizar perfil
            const { error: errorUpdate } = await supabase
                .from('perfiles')
                .update({
                    puntos_acumulados: nuevosAcumulados,
                    puntos_disponibles: nuevosDisponibles,
                })
                .eq('id', usuarioId);

            if (errorUpdate) throw errorUpdate;

            // 3. Registrar en historial_puntos
            await supabase.from('historial_puntos').insert({
                usuario_id: usuarioId,
                tipo: delta >= 0 ? 'ajuste_admin_suma' : 'ajuste_admin_resta',
                puntos: delta,
                descripcion: motivo || 'Ajuste manual del admin',
            });

            // 4. ✅ Notificación + push con motivo estructurado
            const titulo = delta >= 0
                ? `⭐ ¡Ganaste ${delta} puntos!`
                : `⚠️ Ajuste de ${delta} puntos`;

            const mensaje = motivo || 'Ajuste de puntos';

            // 4.1 Insert en notificaciones_usuarios
            const { error: errorNotif } = await supabase
                .from('notificaciones_usuarios')
                .insert({
                    usuario_id: usuarioId,
                    titulo,
                    mensaje,
                    tipo: 'sistema',
                    leida: false,
                });

            if (errorNotif) {
                console.error('❌ Error insertando notificación de puntos:', errorNotif);
            } else {
                console.log('✅ Notificación de puntos insertada');
            }

            // 4.2 Push
            const { data: dispositivos } = await supabase
                .from('dispositivos_push')
                .select('expo_push_token')
                .eq('usuario_actual_id', usuarioId)
                .eq('activo', true);

            const tokens = (dispositivos || [])
                .map((d: any) => d.expo_push_token)
                .filter(Boolean);

            if (tokens.length > 0) {
                try {
                    const { notificacionService } = require('../services/notificacionService');
                    await notificacionService.enviarNotificacionesMasivas(
                        tokens,
                        titulo,
                        mensaje,
                        {
                            tipo: 'sistema',
                            pantalla: 'HistorialPuntos',
                            motivo,
                            delta,
                            puntos_nuevos: nuevosAcumulados,
                            puntos_antes: puntosAcumuladosAntes,
                        },
                    );
                    console.log('✅ Push enviada al cliente');
                } catch (errorPush) {
                    console.error('❌ Error enviando push:', errorPush);
                }
            } else {
                console.log('ℹ️ Usuario sin tokens activos, solo queda en historial');
            }

            // 5. Auditoría
            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: 'ajuste_puntos',
                datos_antes: {
                    puntos_acumulados: puntosAcumuladosAntes,
                    puntos_disponibles: puntosDisponiblesAntes,
                },
                datos_despues: {
                    puntos_acumulados: nuevosAcumulados,
                    puntos_disponibles: nuevosDisponibles,
                },
                motivo: `${delta >= 0 ? '+' : ''}${delta} · ${motivo}`,
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error ajustando puntos:', error);
            return { success: false, error: error?.message || 'Error al ajustar puntos' };
        }
    },

    // ============================================================
    // 🔔 NOTIFICACIÓN INDIVIDUAL
    // ============================================================
    async enviarNotificacionIndividual(
        usuarioId: string,
        titulo: string,
        mensaje: string,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Guardar en notificaciones_usuarios (así le queda en el historial)
            const { error: errorNotif } = await supabase
                .from('notificaciones_usuarios')
                .insert({
                    usuario_id: usuarioId,
                    titulo,
                    mensaje,
                    tipo: 'sistema',
                    leida: false,
                });

            if (errorNotif) throw errorNotif;

            // 2. Enviar push a los dispositivos del usuario
            const { data: dispositivos } = await supabase
                .from('dispositivos_push')
                .select('expo_push_token')
                .eq('usuario_actual_id', usuarioId)
                .eq('activo', true);

            const tokens = (dispositivos || [])
                .map((d: any) => d.expo_push_token)
                .filter(Boolean);

            if (tokens.length > 0) {
                const { notificacionService } = require('../services/notificacionService');
                await notificacionService.enviarNotificacionesMasivas(
                    tokens,
                    titulo,
                    mensaje,
                    { tipo: 'sistema' },
                );
            }

            // 3. Auditoría
            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: 'notificacion_individual',
                datos_despues: { titulo, mensaje, tokens: tokens.length },
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error enviando notificación:', error);
            return { success: false, error: error?.message || 'Error al enviar notificación' };
        }
    },

    // ============================================================
    // 📝 NOTAS ADMIN
    // ============================================================
    async actualizarNotas(
        usuarioId: string,
        notas: string,
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: antes } = await supabase
                .from('perfiles')
                .select('notas_admin')
                .eq('id', usuarioId)
                .single();

            const { error } = await supabase
                .from('perfiles')
                .update({ notas_admin: notas })
                .eq('id', usuarioId);

            if (error) throw error;

            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: 'actualizar_notas',
                datos_antes: { notas_admin: antes?.notas_admin },
                datos_despues: { notas_admin: notas },
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error actualizando notas:', error);
            return { success: false, error: error?.message || 'Error al actualizar notas' };
        }
    },

    // ============================================================
    // ✏️ EDITAR DATOS BÁSICOS
    // ============================================================
    async actualizarDatosBasicos(
        usuarioId: string,
        datos: {
            nombre_cliente?: string;
            telefono?: string;
            direccion_manual?: string;
            direccion_calle?: string;
            direccion_numero?: string;
            direccion_piso?: string;
            direccion_departamento?: string;
            direccion_barrio?: string;
            direccion_ciudad?: string;
            direccion_codigo_postal?: string;
        },
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: antes } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', usuarioId)
                .single();

            const { error } = await supabase
                .from('perfiles')
                .update(datos)
                .eq('id', usuarioId);

            if (error) throw error;

            await registrarAuditoria({
                usuario_id: usuarioId,
                accion: 'editar_datos_basicos',
                datos_antes: antes,
                datos_despues: datos,
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error actualizando datos:', error);
            return { success: false, error: error?.message || 'Error al actualizar datos' };
        }
    },
};