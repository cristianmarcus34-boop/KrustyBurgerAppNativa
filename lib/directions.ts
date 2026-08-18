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
        let apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn('⚠️ Google Maps API Key no configurada en variables de entorno, usando fallback');
            apiKey = API_KEY_FALLBACK;
        }

        if (!origenLat || !origenLng || !destinoLat || !destinoLng) {
            console.error('❌ Coordenadas inválidas:', { origenLat, origenLng, destinoLat, destinoLng });
            return null;
        }

        console.log('🔑 Clave API cargada:', apiKey ? '✅ Si' : '❌ No');
        console.log(`📍 Origen: ${origenLat}, ${origenLng}`);
        console.log(`📍 Destino: ${destinoLat}, ${destinoLng}`);
        console.log(`🚗 Modo de viaje: ${modo}`);

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

        if (data.status !== 'OK') {
            const errorInfo: ErrorResponse = {
                status: data.status,
                message: data.error_message || 'Error desconocido',
            };

            switch (data.status) {
                case 'REQUEST_DENIED':
                    console.error('❌ Clave API no autorizada. Verifica que la Directions API esté habilitada y la clave sea correcta.');
                    break;
                case 'ZERO_RESULTS':
                    console.warn('⚠️ No se encontró ninguna ruta entre los puntos especificados.');
                    break;
                case 'OVER_QUERY_LIMIT':
                    console.error('❌ Límite de consultas excedido. Espera un momento y vuelve a intentar.');
                    break;
                case 'INVALID_REQUEST':
                    console.error('❌ Petición inválida. Verifica los parámetros enviados.');
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

        if (!leg.steps || leg.steps.length === 0) {
            console.warn('⚠️ La ruta no tiene pasos detallados');
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
            console.log('📍 Usando polyline de resumen de la ruta');
        }

        if (points.length === 0) {
            console.warn('⚠️ No se pudieron decodificar los polylines, usando puntos de inicio y fin');
            points.push(
                { latitude: leg.start_location.lat, longitude: leg.start_location.lng },
                { latitude: leg.end_location.lat, longitude: leg.end_location.lng }
            );
        }

        const distanceText = leg.distance?.text || '0 km';
        const distanceMeters = leg.distance?.value || 0;
        const durationText = leg.duration?.text || '0 min';
        const durationSeconds = leg.duration?.value || 0;

        console.log(`✅ Ruta obtenida: ${distanceText}, ${durationText}`);
        console.log(`📍 Puntos de la ruta: ${points.length}`);

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
        // ✅ Validar puntos
        const puntosValidos = puntos.filter(p =>
            p.latitude !== undefined &&
            p.longitude !== undefined &&
            !isNaN(p.latitude) &&
            !isNaN(p.longitude) &&
            Math.abs(p.latitude) <= 90 &&
            Math.abs(p.longitude) <= 180
        );

        if (puntosValidos.length < 2) {
            console.warn('⚠️ Puntos insuficientes para guardar ruta');
            return false;
        }

        // ✅ Construir objeto con las columnas correctas de tu DB
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

        console.log('💾 Guardando ruta en DB:', {
            pedidoId,
            puntos: puntosValidos.length,
            distancia: updateData.distancia_km,
            tiempo: updateData.tiempo_estimado,
        });

        const { error } = await supabase
            .from('pedidos')
            .update(updateData)
            .eq('id', pedidoId);

        if (error) {
            console.error('❌ Error guardando ruta:', error);
            return false;
        }

        console.log(`✅ Ruta guardada correctamente para pedido ${pedidoId}`);
        return true;
    } catch (error) {
        console.error('❌ Error guardando ruta:', error);
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
            console.error('❌ Error obteniendo ruta:', error);
            return null;
        }

        if (data?.ruta_puntos && Array.isArray(data.ruta_puntos) && data.ruta_puntos.length > 0) {
            return data.ruta_puntos;
        }

        return null;
    } catch (error) {
        console.error('❌ Error obteniendo ruta:', error);
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
            console.error('❌ Error obteniendo info de ruta:', error);
            return null;
        }

        return {
            distancia: data?.distancia_km ? data.distancia_km + ' km' : '0 km',
            duracion: data?.tiempo_estimado ? data.tiempo_estimado + ' min' : '0 min',
        };
    } catch (error) {
        console.error('❌ Error obteniendo info de ruta:', error);
        return null;
    }
}