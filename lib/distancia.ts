// lib/distancia.ts

/**
 * 📐 FÓRMULA DE HAVERSINE
 * Calcula la distancia entre dos puntos en la Tierra
 * Usada por Google Maps, Uber, Airbnb, etc.
 * 
 * @param lat1 - Latitud del punto 1
 * @param lng1 - Longitud del punto 1
 * @param lat2 - Latitud del punto 2
 * @param lng2 - Longitud del punto 2
 * @returns Distancia en kilómetros
 */
export const calcularDistancia = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Radio de la Tierra en kilómetros

    // Convertir grados a radianes
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    // Fórmula de Haversine
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
};

/**
 * 📏 FORMATEAR DISTANCIA PARA MOSTRAR AL USUARIO
 * @param distanciaKm - Distancia en kilómetros
 * @returns String formateado (ej: "850 m" o "2.3 km")
 */
export const formatearDistancia = (distanciaKm: number): string => {
    if (distanciaKm < 1) {
        return `${Math.round(distanciaKm * 1000)} m`;
    }
    return `${distanciaKm.toFixed(1)} km`;
};

/**
 * ⏱️ CALCULAR TIEMPO ESTIMADO DE ENTREGA
 * @param distanciaKm - Distancia en kilómetros
 * @param velocidadPromedio - Velocidad promedio en km/h (default: 15 km/h en ciudad)
 * @returns Tiempo en minutos (incluye preparación)
 */
export const calcularTiempoEstimado = (
    distanciaKm: number,
    velocidadPromedio: number = 15
): number => {
    const tiempoViaje = (distanciaKm / velocidadPromedio) * 60; // minutos
    const tiempoPreparacion = 15; // minutos para preparar el pedido
    return Math.ceil(tiempoViaje + tiempoPreparacion);
};