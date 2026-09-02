// services/beneficiosService.ts

import { supabase } from '../lib/supabase';
import { obtenerNivel } from '../lib/tipos';
import { BENEFICIOS_POR_NIVEL } from '../lib/constantes';
import { BeneficiosNivel } from '../lib/tipos';

class BeneficiosService {
    private static instance: BeneficiosService;

    static getInstance(): BeneficiosService {
        if (!BeneficiosService.instance) {
            BeneficiosService.instance = new BeneficiosService();
        }
        return BeneficiosService.instance;
    }

    // ✅ Obtener beneficios según puntos
    obtenerBeneficios(puntos: number): BeneficiosNivel {
        const nivel = obtenerNivel(puntos);
        const key = nivel.nombre.toLowerCase() as keyof typeof BENEFICIOS_POR_NIVEL;
        return BENEFICIOS_POR_NIVEL[key] || BENEFICIOS_POR_NIVEL.bronce;
    }

    // ✅ Calcular descuento
    calcularDescuento(puntos: number, total: number): number {
        const beneficios = this.obtenerBeneficios(puntos);
        return total * (beneficios.descuento / 100);
    }

    // ✅ Verificar envío gratis
    verificarEnvioGratis(puntos: number, subtotal: number): boolean {
        const beneficios = this.obtenerBeneficios(puntos);
        if (!beneficios.envioGratis) return false;
        if (beneficios.envioGratisMinimo === null) return true;
        if (beneficios.envioGratisMinimo === undefined) return false;
        return subtotal >= beneficios.envioGratisMinimo;
    }

    // ❌ ELIMINADO: usarProductoGratis()
    // ❌ ELIMINADO: resetearBeneficiosMensuales()
    // ❌ ELIMINADO: verificarProductosGratisDisponibles()

    // ✅ OBTENER INFORMACIÓN COMPLETA DE BENEFICIOS (SIN PRODUCTOS GRATIS)
    async obtenerInfoBeneficios(usuarioId: string, puntos: number): Promise<{
        nivel: string;
        descuento: number;
        envioGratis: boolean;
        envioGratisMinimo: number | null;
        accesoAnticipadoOfertas: boolean;
        soportePrioritario: boolean;
        prioridadEntrega: number;
        descripcion: string;
    }> {
        const nivel = obtenerNivel(puntos);
        const beneficios = this.obtenerBeneficios(puntos);

        return {
            nivel: nivel.nombre,
            descuento: beneficios.descuento,
            envioGratis: beneficios.envioGratis,
            envioGratisMinimo: beneficios.envioGratisMinimo,
            accesoAnticipadoOfertas: beneficios.accesoAnticipadoOfertas,
            soportePrioritario: beneficios.soportePrioritario,
            prioridadEntrega: beneficios.prioridadEntrega,
            descripcion: beneficios.descripcion || '',
        };
    }
}

export const beneficiosService = BeneficiosService.getInstance();