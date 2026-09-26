// services/servicioEliminacionCuenta.ts
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SolicitudEliminacion {
    id: string;
    usuario_id: string;
    email: string;
    motivo: string;
    fecha_solicitud: string;
    fecha_eliminacion: string;
    estado: 'pendiente' | 'cancelada' | 'completada';
}

class ServicioEliminacionCuenta {
    private static instance: ServicioEliminacionCuenta;

    static getInstance(): ServicioEliminacionCuenta {
        if (!ServicioEliminacionCuenta.instance) {
            ServicioEliminacionCuenta.instance = new ServicioEliminacionCuenta();
        }
        return ServicioEliminacionCuenta.instance;
    }

    // ✅ SOLICITAR ELIMINACIÓN DE CUENTA
    async solicitarEliminacion(
        usuarioId: string,
        email: string,
        motivo: string,
        password: string
    ): Promise<{ success: boolean; error?: string; solicitud?: SolicitudEliminacion }> {
        try {
            // 1. Verificar contraseña
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                return {
                    success: false,
                    error: 'Contraseña incorrecta. Por favor, verificá tus credenciales.'
                };
            }

            if (
                authData.user.id !== usuarioId ||
                authData.user.email?.toLowerCase() !== email.toLowerCase()
            ) {
                await supabase.auth.signOut();
                return {
                    success: false,
                    error: 'Las credenciales no corresponden a esta cuenta.',
                };
            }

            // 2. Verificar si ya tiene una solicitud pendiente
            const { data: solicitudExistente, error: checkError } = await supabase
                .from('solicitudes_eliminacion')
                .select('*')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente')
                .maybeSingle();

            if (solicitudExistente) {
                return {
                    success: false,
                    error: 'Ya tenés una solicitud de eliminación pendiente. Podés cancelarla desde tu perfil.'
                };
            }

            // 3. Crear la solicitud de eliminación
            const fechaEliminacion = new Date();
            fechaEliminacion.setDate(fechaEliminacion.getDate() + 30);

            const { data: solicitud, error: insertError } = await supabase
                .from('solicitudes_eliminacion')
                .insert({
                    usuario_id: authData.user.id,
                    email: authData.user.email,
                    motivo: motivo.trim(),
                    fecha_solicitud: new Date().toISOString(),
                    fecha_eliminacion: fechaEliminacion.toISOString(),
                    estado: 'pendiente',
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creando solicitud:', insertError);
                return {
                    success: false,
                    error: 'No pudimos procesar tu solicitud. Intentá nuevamente.'
                };
            }

            // 4. Guardar en AsyncStorage
            await AsyncStorage.setItem('fecha_eliminacion_programada', fechaEliminacion.toISOString());
            await AsyncStorage.setItem('solicitud_eliminacion_id', solicitud.id);

            return {
                success: true,
                solicitud: solicitud as SolicitudEliminacion,
            };

        } catch (error) {
            console.error('Error en solicitud de eliminación:', error);
            return {
                success: false,
                error: 'Ocurrió un error inesperado. Intentá nuevamente.'
            };
        }
    }

    // ✅ CANCELAR ELIMINACIÓN
    async cancelarEliminacion(usuarioId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('solicitudes_eliminacion')
                .update({
                    estado: 'cancelada',
                    actualizado_en: new Date().toISOString()
                })
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente');

            if (error) {
                console.error('Error cancelando solicitud:', error);
                return {
                    success: false,
                    error: 'No pudimos cancelar la solicitud. Intentá nuevamente.'
                };
            }

            await AsyncStorage.removeItem('fecha_eliminacion_programada');
            await AsyncStorage.removeItem('solicitud_eliminacion_id');

            return { success: true };

        } catch (error) {
            console.error('Error cancelando eliminación:', error);
            return {
                success: false,
                error: 'Ocurrió un error inesperado.'
            };
        }
    }

    // ✅ OBTENER ESTADO DE LA SOLICITUD
    async obtenerEstadoEliminacion(usuarioId: string): Promise<{
        tieneSolicitud: boolean;
        solicitud?: SolicitudEliminacion;
        diasRestantes?: number;
    }> {
        try {
            const { data: solicitud, error } = await supabase
                .from('solicitudes_eliminacion')
                .select('*')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente')
                .maybeSingle();

            if (error || !solicitud) {
                return { tieneSolicitud: false };
            }

            const fechaEliminacion = new Date(solicitud.fecha_eliminacion);
            const ahora = new Date();
            const diffTime = fechaEliminacion.getTime() - ahora.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                tieneSolicitud: true,
                solicitud: solicitud as SolicitudEliminacion,
                diasRestantes: diffDays > 0 ? diffDays : 0,
            };

        } catch (error) {
            console.error('Error obteniendo estado:', error);
            return { tieneSolicitud: false };
        }
    }

    async verificarYEjecutarEliminaciones(): Promise<boolean> {
        const { data, error } = await supabase.functions.invoke('eliminar-cuenta-vencida');

        if (error) {
            throw error;
        }

        return data?.deleted === true;
    }
}

export const servicioEliminacionCuenta = ServicioEliminacionCuenta.getInstance();