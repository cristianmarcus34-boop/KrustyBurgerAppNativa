// lib/formateador.ts

/**
 * Formatea un número como precio en pesos argentinos
 * @param precio - Número a formatear
 * @param conSigno - Si incluye el signo $ (por defecto true)
 * @returns Precio formateado ej: "$9.500"
 */
export const formatearPrecio = (precio: number, conSigno: boolean = true): string => {
    // Redondear a entero
    const precioEntero = Math.round(precio);
    // Formatear con separador de miles
    const formateado = precioEntero.toLocaleString('es-AR');
    return conSigno ? `$${formateado}` : formateado;
};

/**
 * Formatea un número con separador de miles
 * @param numero - Número a formatear
 * @returns Número formateado ej: "15.000"
 */
export const formatearNumero = (numero: number): string => {
    return Math.round(numero).toLocaleString('es-AR');
};

/**
 * Formatea un precio sin redondear (para subtotales)
 * @param precio - Número a formatear
 * @param conSigno - Si incluye el signo $
 * @returns Precio formateado con 2 decimales ej: "$1.250,50"
 */
export const formatearPrecioConDecimales = (precio: number, conSigno: boolean = true): string => {
    const formateado = precio.toFixed(2).replace('.', ',');
    return conSigno ? `$${formateado}` : formateado;
};

/**
 * Formatea un precio para mostrar en el carrito (con decimales)
 */
export const formatearPrecioCarrito = (precio: number): string => {
    return formatearPrecioConDecimales(precio, true);
};

/**
 * Formatea el total de un pedido
 */
export const formatearTotal = (total: number): string => {
    return formatearPrecio(total, true);
};