// lib/constantes.ts

import { BeneficiosNivel } from './tipos';

// ✅ CONFIGURACIÓN DE BENEFICIOS POR NIVEL CON REGLAS
export const BENEFICIOS_POR_NIVEL: Record<string, BeneficiosNivel> = {
    bronce: {
        descuento: 0,
        descuentoMinimo: null,
        descuentoLimiteDiario: 0,
        envioGratis: false,
        envioGratisMinimo: null,
        productosGratisPorMes: 0,
        accesoAnticipadoOfertas: false,
        soportePrioritario: false,
        prioridadEntrega: 1,
        descripcion: 'Sin beneficios especiales',
    },
    plata: {
        descuento: 5,
        descuentoMinimo: 10000,
        descuentoLimiteDiario: 1,
        envioGratis: true,
        envioGratisMinimo: 15000,
        productosGratisPorMes: 0,
        accesoAnticipadoOfertas: false,
        soportePrioritario: false,
        prioridadEntrega: 1,
        descripcion: '5% OFF • Envío gratis desde $15.000',
    },
    oro: {
        descuento: 10,
        descuentoMinimo: 0,
        descuentoLimiteDiario: 1,
        envioGratis: true,
        envioGratisMinimo: null,
        productosGratisPorMes: 1,
        accesoAnticipadoOfertas: true,
        soportePrioritario: true,
        prioridadEntrega: 2,
        descripcion: '10% OFF • Envío gratis • 1 producto gratis/mes',
    },
    platino: {
        descuento: 15,
        descuentoMinimo: 0,
        descuentoLimiteDiario: 1,
        envioGratis: true,
        envioGratisMinimo: null,
        productosGratisPorMes: 2,
        accesoAnticipadoOfertas: true,
        soportePrioritario: true,
        prioridadEntrega: 3,
        descripcion: '15% OFF • Envío gratis • Prioridad',
    },
};