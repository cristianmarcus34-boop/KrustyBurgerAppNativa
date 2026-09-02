// hooks/useBeneficios.ts - SIN PRODUCTOS GRATIS

import { useState, useEffect, useCallback } from 'react';
import { beneficiosService } from '../services/beneficiosService';
import { obtenerNivel } from '../lib/tipos';
import { BeneficiosNivel, NivelCliente } from '../lib/tipos';

export function useBeneficios(puntos: number, usuarioId?: string) {
    const [nivel, setNivel] = useState<NivelCliente | null>(null);
    const [beneficios, setBeneficios] = useState<BeneficiosNivel | null>(null);
    const [cargando, setCargando] = useState(true);

    // ✅ Cargar nivel y beneficios
    useEffect(() => {
        if (puntos !== undefined && puntos !== null) {
            const nivelObtenido = obtenerNivel(puntos);
            const beneficiosObtenidos = beneficiosService.obtenerBeneficios(puntos);

            setNivel(nivelObtenido);
            setBeneficios(beneficiosObtenidos);
            setCargando(false);
        }
    }, [puntos]);

    // ✅ Calcular descuento
    const calcularDescuento = useCallback((total: number) => {
        if (!beneficios) return 0;
        return total * (beneficios.descuento / 100);
    }, [beneficios]);

    // ✅ Verificar si tiene envío gratis
    const tieneEnvioGratis = useCallback((subtotal: number) => {
        if (!beneficios) return false;
        return beneficiosService.verificarEnvioGratis(puntos, subtotal);
    }, [beneficios, puntos]);

    // ✅ Obtener información completa
    const obtenerInfoCompleta = useCallback(async () => {
        if (!usuarioId) return null;
        return await beneficiosService.obtenerInfoBeneficios(usuarioId, puntos);
    }, [usuarioId, puntos]);

    return {
        // Estado
        nivel,
        beneficios,
        cargando,

        // Funciones
        calcularDescuento,
        tieneEnvioGratis,
        obtenerInfoCompleta,

        // Propiedades útiles
        descuento: beneficios?.descuento || 0,
        envioGratis: beneficios?.envioGratis || false,
        prioridadEntrega: beneficios?.prioridadEntrega || 1,
        descripcionBeneficios: beneficios?.descripcion || '',
    };
}