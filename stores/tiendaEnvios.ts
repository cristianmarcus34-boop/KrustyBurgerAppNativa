// stores/tiendaEnvios.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ConfiguracionEnvio, ConfiguracionLocal } from '../lib/tipos';

interface EstadoEnvios {
    configuracion: ConfiguracionEnvio | null;
    configuracionLocal: ConfiguracionLocal | null;
    cargando: boolean;
    error: string | null;

    cargarConfiguracion: () => Promise<void>;
    actualizarConfiguracion: (datos: Partial<ConfiguracionEnvio>) => Promise<{ success: boolean; error?: string }>;
    actualizarUbicacionLocal: (datos: Partial<ConfiguracionLocal>) => Promise<{ success: boolean; error?: string }>;
    recargar: () => Promise<void>;
}

export const tiendaEnvios = create<EstadoEnvios>((set, get) => ({
    configuracion: null,
    configuracionLocal: null,
    cargando: false,
    error: null,

    cargarConfiguracion: async () => {
        set({ cargando: true, error: null });
        try {
            const { data: configData, error: configError } = await supabase
                .from('configuracion_envios')
                .select('*')
                .eq('activo', true)
                .eq('tipo', 'domicilio')
                .single();

            if (configError) throw configError;

            const { data: localData, error: localError } = await supabase
                .from('configuracion_local')
                .select('*')
                .single();

            if (localError) throw localError;

            set({
                configuracion: configData as ConfiguracionEnvio,
                configuracionLocal: localData as ConfiguracionLocal,
                cargando: false,
                error: null,
            });
        } catch (error: any) {
            console.error('❌ Error cargando configuración de envíos:', error);
            set({
                error: error.message || 'Error al cargar configuración',
                cargando: false,
            });
        }
    },

    actualizarConfiguracion: async (datos: Partial<ConfiguracionEnvio>) => {
        const { configuracion } = get();
        if (!configuracion) {
            return { success: false, error: 'No hay configuración cargada' };
        }

        try {
            const datosValidados: any = {};
            if (datos.precio_base !== undefined) {
                datosValidados.precio_base = Number(datos.precio_base);
                if (isNaN(datosValidados.precio_base)) {
                    return { success: false, error: 'El precio base debe ser un número válido' };
                }
            }
            if (datos.precio_por_km !== undefined) {
                datosValidados.precio_por_km = Number(datos.precio_por_km);
                if (isNaN(datosValidados.precio_por_km)) {
                    return { success: false, error: 'El precio por km debe ser un número válido' };
                }
            }
            if (datos.distancia_minima_km !== undefined) {
                datosValidados.distancia_minima_km = Number(datos.distancia_minima_km);
                if (isNaN(datosValidados.distancia_minima_km)) {
                    return { success: false, error: 'La distancia mínima debe ser un número válido' };
                }
            }
            if (datos.distancia_maxima_km !== undefined) {
                datosValidados.distancia_maxima_km = Number(datos.distancia_maxima_km);
                if (isNaN(datosValidados.distancia_maxima_km)) {
                    return { success: false, error: 'La distancia máxima debe ser un número válido' };
                }
            }
            if (datos.activo !== undefined) {
                datosValidados.activo = Boolean(datos.activo);
            }

            const { error } = await supabase
                .from('configuracion_envios')
                .update(datosValidados)
                .eq('id', configuracion.id);

            if (error) throw error;

            set({
                configuracion: { ...configuracion, ...datosValidados },
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error actualizando configuración:', error);
            return { success: false, error: error.message || 'Error al actualizar' };
        }
    },

    actualizarUbicacionLocal: async (datos: Partial<ConfiguracionLocal>) => {
        const { configuracionLocal } = get();
        if (!configuracionLocal) {
            return { success: false, error: 'No hay ubicación cargada' };
        }

        try {
            const datosValidados: any = {};
            if (datos.latitud !== undefined) {
                datosValidados.latitud = Number(datos.latitud);
                if (isNaN(datosValidados.latitud) || datosValidados.latitud < -90 || datosValidados.latitud > 90) {
                    return { success: false, error: 'La latitud debe ser un número entre -90 y 90' };
                }
            }
            if (datos.longitud !== undefined) {
                datosValidados.longitud = Number(datos.longitud);
                if (isNaN(datosValidados.longitud) || datosValidados.longitud < -180 || datosValidados.longitud > 180) {
                    return { success: false, error: 'La longitud debe ser un número entre -180 y 180' };
                }
            }
            if (datos.nombre !== undefined) datosValidados.nombre = datos.nombre;
            if (datos.direccion !== undefined) datosValidados.direccion = datos.direccion;
            if (datos.telefono !== undefined) datosValidados.telefono = datos.telefono;

            const { error } = await supabase
                .from('configuracion_local')
                .update(datosValidados)
                .eq('id', configuracionLocal.id);

            if (error) throw error;

            set({
                configuracionLocal: { ...configuracionLocal, ...datosValidados },
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error actualizando ubicación:', error);
            return { success: false, error: error.message || 'Error al actualizar' };
        }
    },

    recargar: async () => {
        await get().cargarConfiguracion();
    },
}));