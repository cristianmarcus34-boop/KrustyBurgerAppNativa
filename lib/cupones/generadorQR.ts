// lib/cupones/generadorQR.ts
import * as Linking from 'expo-linking';

// ✅ Generar URL para QR (contiene la info del cupón)
export const generarUrlCupon = (cuponCodigo: string): string => {
    // URL para canjear cupón
    return `krustyburger://canjear-cupon?codigo=${cuponCodigo}`;
};

// ✅ Generar datos para QR (formato JSON)
export const generarDatosQR = (cupon: {
    codigo: string;
    titulo: string;
    tipo: string;
    valor_descuento?: number | null;
}): string => {
    const datos = {
        tipo: 'CUPON_KRUSTY',
        codigo: cupon.codigo,
        titulo: cupon.titulo,
        tipo_cupon: cupon.tipo,
        valor: cupon.valor_descuento || 0,
        fecha: new Date().toISOString(),
    };
    return JSON.stringify(datos);
};

// ✅ Validar código QR (para el escaneo)
export const validarDatosQR = (datos: string): { valido: boolean; codigo?: string; error?: string } => {
    try {
        const parsed = JSON.parse(datos);
        if (parsed.tipo !== 'CUPON_KRUSTY' || !parsed.codigo) {
            return { valido: false, error: 'Formato de QR inválido' };
        }
        return { valido: true, codigo: parsed.codigo };
    } catch {
        return { valido: false, error: 'No se pudo leer el código QR' };
    }
};