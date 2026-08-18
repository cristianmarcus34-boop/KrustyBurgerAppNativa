// stores/tiendaEnvios.ts - COMPLETO Y OPTIMIZADO
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
        console.log('🔄 [Store] Iniciando carga de configuración...');
        set({ cargando: true, error: null });

        try {
            // ✅ Cargar configuración de envíos (sin filtros para obtener siempre el registro)
            const { data: configData, error: configError } = await supabase
                .from('configuracion_envios')
                .select('*')
                .single();

            if (configError) {
                console.error('❌ [Store] Error cargando configuracion_envios:', configError);
                throw configError;
            }

            console.log('✅ [Store] Configuración de envíos cargada:', configData);

            // ✅ Cargar ubicación del local
            const { data: localData, error: localError } = await supabase
                .from('configuracion_local')
                .select('*')
                .single();

            if (localError) {
                console.error('❌ [Store] Error cargando configuracion_local:', localError);
                throw localError;
            }

            console.log('✅ [Store] Ubicación del local cargada:', localData);

            set({
                configuracion: configData as ConfiguracionEnvio,
                configuracionLocal: localData as ConfiguracionLocal,
                cargando: false,
                error: null,
            });

            console.log('✅ [Store] Estado actualizado correctamente');
        } catch (error: any) {
            console.error('❌ [Store] Error cargando configuración:', error);
            set({
                error: error.message || 'Error al cargar configuración',
                cargando: false,
            });
        }
    },

    actualizarConfiguracion: async (datos: Partial<ConfiguracionEnvio>) => {
        console.log('💾 [Store] Actualizando configuración de envíos...');
        const { configuracion } = get();

        if (!configuracion) {
            console.error('❌ [Store] No hay configuración cargada');
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
                if (datosValidados.distancia_maxima_km <= 0) {
                    return { success: false, error: 'La distancia máxima debe ser mayor a 0' };
                }
            }
            if (datos.activo !== undefined) {
                datosValidados.activo = Boolean(datos.activo);
            }

            // ✅ Siempre actualizar updated_at
            datosValidados.updated_at = new Date().toISOString();

            console.log('📦 [Store] Datos a guardar en configuracion_envios:', datosValidados);

            const { error } = await supabase
                .from('configuracion_envios')
                .update(datosValidados)
                .eq('id', configuracion.id);

            if (error) {
                console.error('❌ [Store] Error actualizando configuracion_envios:', error);
                throw error;
            }

            // ✅ Actualizar el estado local
            const nuevaConfiguracion = { ...configuracion, ...datosValidados };
            set({ configuracion: nuevaConfiguracion });

            console.log('✅ [Store] Configuración actualizada correctamente:', nuevaConfiguracion);
            return { success: true };

        } catch (error: any) {
            console.error('❌ [Store] Error actualizando configuración:', error);
            return { success: false, error: error.message || 'Error al actualizar' };
        }
    },

    actualizarUbicacionLocal: async (datos: Partial<ConfiguracionLocal>) => {
        console.log('💾 [Store] Actualizando ubicación del local...');
        const { configuracionLocal } = get();

        if (!configuracionLocal) {
            console.error('❌ [Store] No hay ubicación cargada');
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

            // ✅ Siempre actualizar updated_at
            datosValidados.updated_at = new Date().toISOString();

            console.log('📦 [Store] Datos a guardar en configuracion_local:', datosValidados);

            const { error } = await supabase
                .from('configuracion_local')
                .update(datosValidados)
                .eq('id', configuracionLocal.id);

            if (error) {
                console.error('❌ [Store] Error actualizando configuracion_local:', error);
                throw error;
            }

            // ✅ Actualizar el estado local
            const nuevaUbicacion = { ...configuracionLocal, ...datosValidados };
            set({ configuracionLocal: nuevaUbicacion });

            console.log('✅ [Store] Ubicación actualizada correctamente:', nuevaUbicacion);
            return { success: true };

        } catch (error: any) {
            console.error('❌ [Store] Error actualizando ubicación:', error);
            return { success: false, error: error.message || 'Error al actualizar' };
        }
    },

    recargar: async () => {
        console.log('🔄 [Store] Recargando configuración...');
        await get().cargarConfiguracion();
        console.log('✅ [Store] Recarga completada');
    },
}));