// lib/servicioEnvios.ts
import { supabase } from './supabase';
import { calcularDistancia, formatearDistancia } from './distancia';

// ============================================================
// 📋 INTERFACES
// ============================================================

interface ConfiguracionEnvio {
    id: number;
    tipo: string;
    precio_base: number;
    precio_por_km: number;
    distancia_minima_km: number;
    distancia_maxima_km: number;
    activo: boolean;
}

interface LocalConfig {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    direccion: string;
    telefono: string;
}

export interface ResultadoEnvio {
    costo: number;
    distancia: number;
    distanciaFormateada: string;
    tiempoEstimado: number;
    esValido: boolean;
    mensaje?: string;
    dentroCobertura: boolean;
}

// ============================================================
// 🚚 SERVICIO DE ENVÍOS
// ============================================================

export class ServicioEnvios {
    private localConfig: LocalConfig | null = null;
    private configuracion: ConfiguracionEnvio | null = null;
    private inicializado: boolean = false;

    /**
     * 🚀 Inicializar el servicio (cargar configuración)
     */
    async inicializar(): Promise<void> {
        if (this.inicializado) return;
        await this.cargarConfiguracion();
        this.inicializado = true;
    }

    /**
     * 📦 Carga la configuración desde Supabase
     */
    private async cargarConfiguracion(): Promise<void> {
        try {
            // 1. Cargar configuración de envíos
            const { data: configData, error: configError } = await supabase
                .from('configuracion_envios')
                .select('*')
                .eq('activo', true)
                .eq('tipo', 'domicilio')
                .single();

            if (configError) {
                console.warn('⚠️ Error cargando configuración de envíos, usando valores por defecto');
            } else {
                this.configuracion = configData as ConfiguracionEnvio;
                console.log('✅ Configuración de envíos cargada:', this.configuracion);
            }

            // 2. Cargar ubicación del local
            const { data: localData, error: localError } = await supabase
                .from('configuracion_local')
                .select('*')
                .single();

            if (localError) {
                console.warn('⚠️ Error cargando ubicación del local, usando valores por defecto');
            } else {
                this.localConfig = localData as LocalConfig;
                console.log('✅ Ubicación del local cargada:', this.localConfig);
            }

        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }

        // ✅ Valores por defecto SIEMPRE disponibles
        if (!this.configuracion) {
            this.configuracion = {
                id: 0,
                tipo: 'domicilio',
                precio_base: 2.99,
                precio_por_km: 0.50,
                distancia_minima_km: 0,
                distancia_maxima_km: 10,
                activo: true,
            };
        }

        if (!this.localConfig) {
            this.localConfig = {
                id: 0,
                nombre: 'Krusty Burger',
                latitud: -34.776484410467525,
                longitud: -58.29220250409459,
                direccion: 'Av. Principal 1234',
                telefono: '11 1234-5678',
            };
        }
    }

    /**
     * 💰 Calcula el costo de envío basado en la distancia
     */
    async calcularCostoEnvio(
        latCliente: number,
        lngCliente: number
    ): Promise<ResultadoEnvio> {
        // Asegurar que el servicio está inicializado
        await this.inicializar();

        if (!this.localConfig || !this.configuracion) {
            return {
                costo: 0,
                distancia: 0,
                distanciaFormateada: '0 km',
                tiempoEstimado: 0,
                esValido: false,
                dentroCobertura: false,
                mensaje: 'Error cargando configuración',
            };
        }

        // 📐 Calcular distancia
        const distancia = calcularDistancia(
            this.localConfig.latitud,
            this.localConfig.longitud,
            latCliente,
            lngCliente
        );

        const distanciaFormateada = formatearDistancia(distancia);
        const tiempoEstimado = this.calcularTiempoEstimado(distancia);

        // 🚫 Verificar si está dentro del rango de cobertura
        if (distancia > this.configuracion.distancia_maxima_km) {
            return {
                costo: 0,
                distancia,
                distanciaFormateada,
                tiempoEstimado,
                esValido: false,
                dentroCobertura: false,
                mensaje: `Lo sentimos, no realizamos envíos a más de ${this.configuracion.distancia_maxima_km} km del local`,
            };
        }

        // 💰 Calcular costo
        let costo = this.configuracion.precio_base;

        if (distancia > this.configuracion.distancia_minima_km) {
            const kmExtra = distancia - this.configuracion.distancia_minima_km;
            costo += kmExtra * this.configuracion.precio_por_km;
        }

        // Redondear a 2 decimales
        costo = Math.round(costo * 100) / 100;

        return {
            costo,
            distancia,
            distanciaFormateada,
            tiempoEstimado,
            esValido: true,
            dentroCobertura: true,
        };
    }

    /**
     * ⏱️ Calcular tiempo estimado de entrega
     */
    private calcularTiempoEstimado(distanciaKm: number): number {
        const velocidadPromedio = 15; // km/h en ciudad
        const tiempoViaje = (distanciaKm / velocidadPromedio) * 60;
        const tiempoPreparacion = 15; // minutos
        return Math.ceil(tiempoViaje + tiempoPreparacion);
    }

    /**
     * 📍 Obtener ubicación del local
     */
    getUbicacionLocal(): LocalConfig | null {
        return this.localConfig;
    }

    /**
     * 🔍 Verificar cobertura
     */
    async verificarCobertura(
        latCliente: number,
        lngCliente: number
    ): Promise<{ disponible: boolean; mensaje?: string }> {
        await this.inicializar();

        if (!this.configuracion) {
            return {
                disponible: false,
                mensaje: 'Error cargando configuración',
            };
        }

        const distancia = calcularDistancia(
            this.localConfig?.latitud || 0,
            this.localConfig?.longitud || 0,
            latCliente,
            lngCliente
        );

        if (distancia > this.configuracion.distancia_maxima_km) {
            return {
                disponible: false,
                mensaje: `No realizamos envíos a más de ${this.configuracion.distancia_maxima_km} km`,
            };
        }

        return { disponible: true };
    }

    /**
     * 🔄 Actualizar configuración (para admin)
     */
    async actualizarConfiguracion(nuevosDatos: Partial<ConfiguracionEnvio>): Promise<void> {
        if (!this.configuracion) return;

        try {
            const { error } = await supabase
                .from('configuracion_envios')
                .update(nuevosDatos)
                .eq('id', this.configuracion.id);

            if (error) throw error;

            // ✅ Actualizar cache local
            this.configuracion = { ...this.configuracion, ...nuevosDatos };
            console.log('✅ Configuración actualizada:', this.configuracion);
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            throw error;
        }
    }
}

// ✅ Exportar una instancia única (Singleton)
export const servicioEnvios = new ServicioEnvios();