// lib/directions.ts
import { supabase } from './supabase';

// ✅ Tipos mejorados
interface RutaResponse {
    points: { latitude: number; longitude: number }[];
    distance: string;
    distanceMeters: number;
    duration: string;
    durationSeconds: number;
    polyline: string;
    steps: any[];
}

interface ErrorResponse {
    status: string;
    message: string;
    code?: number;
}

// ✅ NUEVO: Evitar spam de logs con el mismo error repetido
let ultimoErrorRegistrado: string | null = null;
let ultimoErrorTimestamp = 0;

function registrarErrorUnaVez(mensaje: string, esCritico = false) {
    const ahora = Date.now();
    const esMismoError = ultimoErrorRegistrado === mensaje;
    const pasaronSuficientesSegundos = (ahora - ultimoErrorTimestamp) > 60000; // 1 minuto

    // ✅ Solo loguear si es un error DISTINTO o pasó más de 1 minuto
    if (!esMismoError || pasaronSuficientesSegundos) {
        if (esCritico) {
            console.warn(mensaje);
        } else {
            console.warn(mensaje);
        }
        ultimoErrorRegistrado = mensaje;
        ultimoErrorTimestamp = ahora;
    }
}

// ✅ Función mejorada con más información y manejo de errores
export async function obtenerRuta(
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    modo: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<RutaResponse | null> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
        if (!apiKey) {
            registrarErrorUnaVez('⚠️ Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
            return null;
        }

        const coordenadas = [origenLat, origenLng, destinoLat, destinoLng];
        if (
            !coordenadas.every(Number.isFinite) ||
            Math.abs(origenLat) > 90 ||
            Math.abs(destinoLat) > 90 ||
            Math.abs(origenLng) > 180 ||
            Math.abs(destinoLng) > 180
        ) {
            registrarErrorUnaVez(`⚠️ Coordenadas inválidas: ${origenLat},${origenLng} → ${destinoLat},${destinoLng}`);
            return null;
        }

        // ✅ Silencioso por defecto (solo se ven si DEBUG_ROUTES = true)
        const DEBUG_ROUTES = false;
        if (DEBUG_ROUTES) {
            console.log(`📍 Origen: ${origenLat}, ${origenLng}`);
            console.log(`📍 Destino: ${destinoLat}, ${destinoLng}`);
            console.log(`🚗 Modo de viaje: ${modo}`);
        }

        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.append('origin', `${origenLat},${origenLng}`);
        url.searchParams.append('destination', `${destinoLat},${destinoLng}`);
        url.searchParams.append('key', apiKey);
        url.searchParams.append('mode', modo);
        url.searchParams.append('language', 'es');
        url.searchParams.append('units', 'metric');
        url.searchParams.append('alternatives', 'false');
        url.searchParams.append('traffic_model', 'best_guess');
        url.searchParams.append('departure_time', 'now');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            registrarErrorUnaVez(`⚠️ Google Maps HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (DEBUG_ROUTES) {
            console.log('📡 Respuesta de Directions API:', data.status);
        }

        if (data.status !== 'OK') {
            const errorInfo: ErrorResponse = {
                status: data.status,
                message: data.error_message || 'Error desconocido',
            };

            // ✅ Todos los errores de Google son console.warn, no console.error
            switch (data.status) {
                case 'REQUEST_DENIED':
                    registrarErrorUnaVez(
                        '⚠️ Google Maps: Clave sin billing o Directions API no habilitada. La app usará línea recta mientras tanto.'
                    );
                    break;
                case 'ZERO_RESULTS':
                    registrarErrorUnaVez('⚠️ No se encontró ruta entre los puntos indicados.');
                    break;
                case 'OVER_QUERY_LIMIT':
                    registrarErrorUnaVez('⚠️ Google Maps: límite de consultas excedido.');
                    break;
                case 'INVALID_REQUEST':
                    registrarErrorUnaVez('⚠️ Google Maps: petición inválida.');
                    break;
                default:
                    registrarErrorUnaVez(`⚠️ Google Maps: ${data.status}`);
            }

            if (data.error_message && DEBUG_ROUTES) {
                console.warn(`📝 Google: ${data.error_message}`);
            }

            return null;
        }

        if (!data.routes || data.routes.length === 0) {
            registrarErrorUnaVez('⚠️ No se encontraron rutas');
            return null;
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        if (!leg.steps || leg.steps.length === 0) {
            registrarErrorUnaVez('⚠️ La ruta no tiene pasos detallados');
            return null;
        }

        const points: { latitude: number; longitude: number }[] = [];

        for (const step of leg.steps) {
            if (step.polyline && step.polyline.points) {
                const decodedPoints = decodePolyline(step.polyline.points);
                points.push(...decodedPoints);
            }
        }

        if (points.length === 0 && route.overview_polyline && route.overview_polyline.points) {
            const overviewPoints = decodePolyline(route.overview_polyline.points);
            points.push(...overviewPoints);
            if (DEBUG_ROUTES) {
                console.log('📍 Usando polyline de resumen de la ruta');
            }
        }

        if (points.length === 0) {
            if (DEBUG_ROUTES) {
                console.warn('⚠️ No se pudieron decodificar los polylines, usando puntos de inicio y fin');
            }
            points.push(
                { latitude: leg.start_location.lat, longitude: leg.start_location.lng },
                { latitude: leg.end_location.lat, longitude: leg.end_location.lng }
            );
        }

        const distanceText = leg.distance?.text || '0 km';
        const distanceMeters = leg.distance?.value || 0;
        const durationText = leg.duration?.text || '0 min';
        const durationSeconds = leg.duration?.value || 0;

        // ✅ Reset del cache de errores cuando la API funciona
        ultimoErrorRegistrado = null;
        ultimoErrorTimestamp = 0;

        if (DEBUG_ROUTES) {
            console.log(`✅ Ruta obtenida: ${distanceText}, ${durationText}`);
            console.log(`📍 Puntos de la ruta: ${points.length}`);
        }

        return {
            points,
            distance: distanceText,
            distanceMeters,
            duration: durationText,
            durationSeconds,
            polyline: route.overview_polyline?.points || '',
            steps: leg.steps,
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            registrarErrorUnaVez('⚠️ Timeout al obtener la ruta (10 segundos)');
        } else {
            registrarErrorUnaVez(`⚠️ Error obteniendo ruta: ${error.message || error}`);
        }
        return null;
    }
}

// ✅ Función para decodificar el polyline de Google Maps
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    if (!encoded) return [];

    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
}

// ✅ GUARDAR RUTA EN SUPABASE
export async function guardarRutaPedido(
    pedidoId: number,
    puntos: { latitude: number; longitude: number }[],
    distancia?: string,
    duracion?: string
): Promise<boolean> {
    try {
        const puntosValidos = puntos.filter(p =>
            p.latitude !== undefined &&
            p.longitude !== undefined &&
            !isNaN(p.latitude) &&
            !isNaN(p.longitude) &&
            Math.abs(p.latitude) <= 90 &&
            Math.abs(p.longitude) <= 180
        );

        if (puntosValidos.length < 2) {
            return false;
        }

        const updateData: any = {
            ruta_puntos: puntosValidos,
        };

        if (distancia) {
            const distanciaNum = parseFloat(distancia.replace(' km', '').replace(',', '.').trim());
            if (!isNaN(distanciaNum) && distanciaNum > 0) {
                updateData.distancia_km = distanciaNum;
            }
        }

        if (duracion) {
            const tiempoNum = parseInt(duracion.replace(' min', '').trim());
            if (!isNaN(tiempoNum) && tiempoNum > 0) {
                updateData.tiempo_estimado = tiempoNum;
            }
        }

        const { error } = await supabase
            .from('pedidos')
            .update(updateData)
            .eq('id', pedidoId);

        if (error) {
            console.warn('⚠️ Error guardando ruta:', error.message);
            return false;
        }

        return true;
    } catch (error) {
        console.warn('⚠️ Error guardando ruta:', error);
        return false;
    }
}

// ✅ OBTENER RUTA DESDE SUPABASE
export async function obtenerRutaPedido(pedidoId: number): Promise<{ latitude: number; longitude: number }[] | null> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('ruta_puntos')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.warn('⚠️ Error obteniendo ruta:', error.message);
            return null;
        }

        if (data?.ruta_puntos && Array.isArray(data.ruta_puntos) && data.ruta_puntos.length > 0) {
            return data.ruta_puntos;
        }

        return null;
    } catch (error) {
        console.warn('⚠️ Error obteniendo ruta:', error);
        return null;
    }
}

// ✅ OBTENER INFORMACIÓN DE RUTA (distancia y tiempo)
export async function obtenerInfoRutaPedido(pedidoId: number): Promise<{ distancia: string; duracion: string } | null> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('distancia_km, tiempo_estimado')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.warn('⚠️ Error obteniendo info de ruta:', error.message);
            return null;
        }

        return {
            distancia: data?.distancia_km ? data.distancia_km + ' km' : '0 km',
            duracion: data?.tiempo_estimado ? data.tiempo_estimado + ' min' : '0 min',
        };
    } catch (error) {
        console.warn('⚠️ Error obteniendo info de ruta:', error);
        return null;
    }
}