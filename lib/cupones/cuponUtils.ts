// lib/cupones/cuponUtils.ts
import { Cupon, TipoCupon } from './cuponTypes';

/**
 * Genera un código aleatorio para cupón
 * Formato: KB + 8 caracteres alfanuméricos
 */
export const generarCodigoCupon = (): string => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return `KB${codigo}`;
};

/**
 * Valida si un cupón está activo y dentro de fechas
 */
export const validarCuponActivo = (cupon: Cupon): { valido: boolean; mensaje?: string } => {
    const ahora = new Date();
    const inicio = new Date(cupon.fecha_inicio);
    const expiracion = new Date(cupon.fecha_expiracion);

    if (!cupon.activo) {
        return { valido: false, mensaje: 'El cupón no está activo' };
    }

    if (isNaN(inicio.getTime()) || isNaN(expiracion.getTime())) {
        return { valido: false, mensaje: 'Fechas inválidas' };
    }

    if (ahora < inicio) {
        return { valido: false, mensaje: 'El cupón aún no está disponible' };
    }

    if (ahora > expiracion) {
        return { valido: false, mensaje: 'El cupón ha expirado' };
    }

    if (cupon.usos_maximos !== null && cupon.usos_totales >= cupon.usos_maximos) {
        return { valido: false, mensaje: 'El cupón ha alcanzado su límite de usos' };
    }

    return { valido: true };
};

/**
 * Formatea el descuento para mostrar
 */
export const formatearDescuento = (cupon: Cupon): string => {
    if (cupon.tipo === 'envio_gratis') {
        return '🚚 Envío gratis';
    }
    if (cupon.tipo === 'producto_gratis') {
        return '🎁 Producto gratis';
    }
    if (cupon.tipo === '2x1') {
        return '🎯 2x1';
    }
    if (cupon.valor_descuento === null || cupon.valor_descuento === undefined) {
        return 'Gratis';
    }
    if (cupon.es_porcentaje) {
        return `${cupon.valor_descuento}% OFF`;
    }
    return `$${Number(cupon.valor_descuento).toFixed(2)} OFF`;
};

/**
 * Obtiene el color del tipo de cupón
 */
export const colorPorTipo = (tipo: TipoCupon): string => {
    const colores = {
        descuento: '#4CAF50',
        producto_gratis: '#FF9800',
        envio_gratis: '#2196F3',
        '2x1': '#9C27B0',
    };
    return colores[tipo] || '#757575';
};

/**
 * Obtiene el ícono del tipo de cupón
 */
export const iconoPorTipo = (tipo: TipoCupon): string => {
    const iconos = {
        descuento: '🏷️',
        producto_gratis: '🎁',
        envio_gratis: '🚚',
        '2x1': '🎯',
    };
    return iconos[tipo] || '🎫';
};

/**
 * Valida si un código de cupón es válido (formato)
 */
export const validarCodigoCupon = (codigo: string): boolean => {
    const regex = /^KB[A-Z0-9]{8}$/;
    return regex.test(codigo.trim().toUpperCase());
};

/**
 * Normaliza un código de cupón
 */
export const normalizarCodigo = (codigo: string): string => {
    return codigo.trim().toUpperCase().replace(/\s/g, '');
};

/**
 * Calcula el descuento aplicable
 */
export const calcularDescuentoAplicable = (
    cupon: Cupon,
    subtotal: number,
    cantidadProductos?: number
): number => {
    if (cupon.tipo === 'envio_gratis') return 0;
    if (cupon.tipo === 'producto_gratis') return 0;
    if (cupon.tipo === '2x1') return 0;

    if (cupon.tipo !== 'descuento') return 0;

    const valor = Number(cupon.valor_descuento) || 0;

    if (cupon.es_porcentaje) {
        return (subtotal * valor) / 100;
    }

    return Math.min(subtotal, valor);
};

/**
 * Verifica si el cupón es de envío gratis
 */
export const esCuponEnvioGratis = (cupon: Cupon): boolean => {
    return cupon.tipo === 'envio_gratis';
};

/**
 * Verifica si el cupón es de producto gratis
 */
export const esCuponProductoGratis = (cupon: Cupon): boolean => {
    return cupon.tipo === 'producto_gratis';
};

/**
 * Verifica si el cupón es 2x1
 */
export const esCupon2x1 = (cupon: Cupon): boolean => {
    return cupon.tipo === '2x1';
};

/**
 * Obtiene el estado del cupón para mostrar
 */
export const obtenerEstadoCupon = (cupon: Cupon): { texto: string; color: string } => {
    const validacion = validarCuponActivo(cupon);

    if (!validacion.valido) {
        return { texto: 'INACTIVO', color: '#E53935' };
    }

    return { texto: 'ACTIVO', color: '#4CAF50' };
};

/**
 * Genera texto para compartir cupón
 */
export const generarTextoCompartir = (cupon: Cupon): string => {
    return `🎫 ¡Cupón Krusty Burger!\n\n📌 ${cupon.titulo}\n💰 ${formatearDescuento(cupon)}\n🔑 Código: ${cupon.codigo}\n⏰ Válido hasta: ${new Date(cupon.fecha_expiracion).toLocaleDateString('es-AR')}`;
};

/**
 * Obtiene el título del tipo de cupón
 */
export const tituloPorTipo = (tipo: TipoCupon): string => {
    const titulos = {
        descuento: 'Descuento',
        producto_gratis: 'Producto Gratis',
        envio_gratis: 'Envío Gratis',
        '2x1': '2x1',
    };
    return titulos[tipo] || 'Cupón';
};

/**
 * Verifica si el cupón es válido para un producto específico
 */
export const esCuponValidoParaProducto = (cupon: Cupon, productoId: number): boolean => {
    if (cupon.tipo !== 'producto_gratis') return true;
    if (!cupon.producto_id) return true;
    return cupon.producto_id === productoId;
};

/**
 * Obtiene el mensaje de estado del cupón
 */
export const obtenerMensajeEstado = (cupon: Cupon): string => {
    const validacion = validarCuponActivo(cupon);
    return validacion.mensaje || 'Cupón disponible';
};