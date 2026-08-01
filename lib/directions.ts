// lib/directions.ts
import { supabase } from './supabase';

// ✅ Clave API para pruebas (reemplázala con tu clave real si las variables no funcionan)
const API_KEY_FALLBACK = 'AIzaSyCiAUoNj0Pf_U9hZvctk2wCToe-AjJvC1I';

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

// ✅ Función mejorada con más información y manejo de errores
export async function obtenerRuta(
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    modo: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<RutaResponse | null> {
    try {
        // ✅ Intentar obtener la clave desde variables de entorno primero
        let apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

        // ✅ Si no está en variables, usar el fallback
        if (!apiKey) {
            console.warn('⚠️ Google Maps API Key no configurada en variables de entorno, usando fallback');
            apiKey = API_KEY_FALLBACK;
        }

        // ✅ Validar que las coordenadas sean válidas
        if (!origenLat || !origenLng || !destinoLat || !destinoLng) {
            console.error('❌ Coordenadas inválidas:', { origenLat, origenLng, destinoLat, destinoLng });
            return null;
        }

        console.log('🔑 Clave API cargada:', apiKey ? '✅ Si' : '❌ No');
        console.log(`📍 Origen: ${origenLat}, ${origenLng}`);
        console.log(`📍 Destino: ${destinoLat}, ${destinoLng}`);
        console.log(`🚗 Modo de viaje: ${modo}`);

        // ✅ Construir URL con más opciones
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

        console.log('🌐 URL de la petición:', url.toString().replace(apiKey, 'API_KEY_OCULTA'));

        // ✅ Timeout para la petición (10 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        console.log('📡 Respuesta de Directions API:', data.status);

        // ✅ Manejo detallado de errores
        if (data.status !== 'OK') {
            const errorInfo: ErrorResponse = {
                status: data.status,
                message: data.error_message || 'Error desconocido',
            };

            // ✅ Errores comunes de Directions API
            switch (data.status) {
                case 'REQUEST_DENIED':
                    console.error('❌ Clave API no autorizada. Verifica que la Directions API esté habilitada y la clave sea correcta.');
                    console.error('🔑 Sugerencia: Crea una nueva clave API sin restricciones en Google Cloud Console.');
                    break;
                case 'ZERO_RESULTS':
                    console.warn('⚠️ No se encontró ninguna ruta entre los puntos especificados.');
                    console.warn('💡 Sugerencia: Verifica que las coordenadas sean correctas y accesibles.');
                    break;
                case 'OVER_QUERY_LIMIT':
                    console.error('❌ Límite de consultas excedido. Espera un momento y vuelve a intentar.');
                    break;
                case 'INVALID_REQUEST':
                    console.error('❌ Petición inválida. Verifica los parámetros enviados.');
                    break;
                case 'UNKNOWN_ERROR':
                    console.error('❌ Error desconocido de Google Maps. Intenta nuevamente más tarde.');
                    break;
                default:
                    console.error(`❌ Error en Directions API: ${data.status}`, data);
            }

            if (data.error_message) {
                console.error(`📝 Mensaje: ${data.error_message}`);
            }

            return null;
        }

        if (!data.routes || data.routes.length === 0) {
            console.warn('⚠️ No se encontraron rutas');
            return null;
        }

        const route = data.routes[0];
        const leg = route.legs[0];

        // ✅ Validar que la ruta tenga pasos
        if (!leg.steps || leg.steps.length === 0) {
            console.warn('⚠️ La ruta no tiene pasos detallados');
            return null;
        }

        // ✅ Extraer los puntos de la ruta (polyline)
        const points: { latitude: number; longitude: number }[] = [];

        for (const step of leg.steps) {
            if (step.polyline && step.polyline.points) {
                const decodedPoints = decodePolyline(step.polyline.points);
                points.push(...decodedPoints);
            }
        }

        // ✅ Si no hay puntos, intentar decodificar el polyline completo de la ruta
        if (points.length === 0 && route.overview_polyline && route.overview_polyline.points) {
            const overviewPoints = decodePolyline(route.overview_polyline.points);
            points.push(...overviewPoints);
            console.log('📍 Usando polyline de resumen de la ruta');
        }

        // ✅ Si aún no hay puntos, usar los puntos de inicio y fin
        if (points.length === 0) {
            console.warn('⚠️ No se pudieron decodificar los polylines, usando puntos de inicio y fin');
            points.push(
                { latitude: leg.start_location.lat, longitude: leg.start_location.lng },
                { latitude: leg.end_location.lat, longitude: leg.end_location.lng }
            );
        }

        // ✅ Extraer distancia y duración
        const distanceText = leg.distance?.text || '0 km';
        const distanceMeters = leg.distance?.value || 0;
        const durationText = leg.duration?.text || '0 min';
        const durationSeconds = leg.duration?.value || 0;

        console.log(`✅ Ruta obtenida: ${distanceText}, ${durationText}`);
        console.log(`📍 Puntos de la ruta: ${points.length}`);
        console.log(`📊 Distancia en metros: ${distanceMeters}`);
        console.log(`⏱️ Duración en segundos: ${durationSeconds}`);

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
            console.error('❌ Timeout al obtener la ruta (10 segundos)');
        } else {
            console.error('❌ Error obteniendo ruta:', error.message || error);
        }
        return null;
    }
}

// ✅ Función para decodificar el polyline de Google Maps (optimizada)
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

// ✅ Función para guardar la ruta de un pedido en Supabase
export async function guardarRutaPedido(
    pedidoId: number,
    puntos: { latitude: number; longitude: number }[],
    distancia?: string,
    duracion?: string
): Promise<boolean> {
    try {
        // ⚠️ Asegúrate de tener las columnas en tu tabla `pedidos`
        const updateData: any = {
            ruta_puntos: puntos,
        };

        // ✅ Si se proporcionan distancia y duración, guardarlas también
        if (distancia) {
            updateData.distancia_ruta = distancia;
        }
        if (duracion) {
            updateData.duracion_ruta = duracion;
        }

        const { error } = await supabase
            .from('pedidos')
            .update(updateData)
            .eq('id', pedidoId);

        if (error) {
            console.error('❌ Error guardando ruta:', error);
            return false;
        }

        console.log(`✅ Ruta guardada para pedido ${pedidoId}`);
        return true;
    } catch (error) {
        console.error('❌ Error guardando ruta:', error);
        return false;
    }
}

// ✅ Función para obtener la ruta de un pedido desde Supabase
export async function obtenerRutaPedido(pedidoId: number): Promise<{ latitude: number; longitude: number }[] | null> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('ruta_puntos')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.error('❌ Error obteniendo ruta:', error);
            return null;
        }

        return data?.ruta_puntos || null;
    } catch (error) {
        console.error('❌ Error obteniendo ruta:', error);
        return null;
    }
}

// ✅ Función para obtener distancia y duración guardada
export async function obtenerInfoRutaPedido(pedidoId: number): Promise<{ distancia: string; duracion: string } | null> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('distancia_ruta, duracion_ruta')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.error('❌ Error obteniendo info de ruta:', error);
            return null;
        }

        return {
            distancia: data?.distancia_ruta || '0 km',
            duracion: data?.duracion_ruta || '0 min',
        };
    } catch (error) {
        console.error('❌ Error obteniendo info de ruta:', error);
        return null;
    }
}