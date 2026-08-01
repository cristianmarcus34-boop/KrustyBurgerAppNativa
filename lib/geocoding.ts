// lib/geocoding.ts
import { supabase } from './supabase';

// ✅ COORDENADAS REALES DE KRUSTY BURGER
const UBICACION_KRUSTY = {
    lat: -34.776484410467525,
    lng: -58.29220250409459
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// ✅ Geocodificar usando la API REST de Google (desde el cliente)
export async function geocodificarDireccion(direccion: string): Promise<{ lat: number; lng: number } | null> {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('⚠️ Google Maps API Key no configurada');
            return null;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccion)}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else if (data.status === 'ZERO_RESULTS') {
            console.warn(`❌ No se encontró la dirección: ${direccion}`);
            return null;
        } else {
            console.error(`❌ Error en geocodificación: ${data.status}`, data);
            return null;
        }
    } catch (error) {
        console.error('❌ Error en geocodificación:', error);
        return null;
    }
}

// ✅ Geocodificar usando Supabase RPC (recomendado para producción)
export async function geocodificarConSupabase(direccion: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const { data, error } = await supabase
            .rpc('geocode_address', { address: direccion });

        if (error) {
            console.error('❌ Error en geocodificación con Supabase:', error);
            return null;
        }

        // ✅ Manejar diferentes estructuras de respuesta de Supabase
        let lat = null;
        let lng = null;

        if (data) {
            // Si la respuesta es un array con resultados
            if (Array.isArray(data) && data.length > 0) {
                const result = data[0];
                if (result.geometry?.location) {
                    lat = result.geometry.location.lat;
                    lng = result.geometry.location.lng;
                } else if (result.lat !== undefined && result.lng !== undefined) {
                    lat = result.lat;
                    lng = result.lng;
                }
            }
            // Si la respuesta es un objeto con results
            else if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                lat = location.lat;
                lng = location.lng;
            }
            // Si la respuesta es un objeto con lat/lng directamente
            else if (data.lat !== undefined && data.lng !== undefined) {
                lat = data.lat;
                lng = data.lng;
            }
        }

        if (lat !== null && lng !== null) {
            console.log(`✅ Geocodificado con Supabase: ${lat}, ${lng}`);
            return { lat, lng };
        }

        console.warn(`❌ No se encontró la dirección en Supabase: ${direccion}`);
        return null;
    } catch (error) {
        console.error('❌ Error en geocodificación con Supabase:', error);
        return null;
    }
}

// ✅ Geocodificar con fallback (prueba Supabase, luego Google)
export async function geocodificarConFallback(direccion: string): Promise<{ lat: number; lng: number } | null> {
    try {
        // 1. Intentar con Supabase primero
        let coordenadas = await geocodificarConSupabase(direccion);

        if (coordenadas) {
            console.log('✅ Geocodificado con Supabase');
            return coordenadas;
        }

        // 2. Si falla, intentar con Google Maps API
        console.log('⚠️ Falló Supabase, intentando con Google Maps...');
        coordenadas = await geocodificarDireccion(direccion);

        if (coordenadas) {
            console.log('✅ Geocodificado con Google Maps');
            return coordenadas;
        }

        console.warn(`❌ No se pudo geocodificar: ${direccion}`);
        return null;
    } catch (error) {
        console.error('❌ Error en geocodificación con fallback:', error);
        return null;
    }
}

// ✅ Geocodificar y guardar en Supabase automáticamente
export async function guardarCoordenadasPedido(pedidoId: number, direccion: string): Promise<boolean> {
    try {
        // ✅ Usar fallback para geocodificar
        const coordenadas = await geocodificarConFallback(direccion);

        // ✅ Si no hay coordenadas, usar las coordenadas reales de Krusty Burger
        if (!coordenadas) {
            console.log(`⚠️ No se pudo geocodificar la dirección, usando coordenadas reales de Krusty Burger para pedido ${pedidoId}`);
            const { error } = await supabase
                .from('pedidos')
                .update({
                    lat_cliente: UBICACION_KRUSTY.lat,
                    lng_cliente: UBICACION_KRUSTY.lng
                })
                .eq('id', pedidoId);

            if (error) {
                console.error('❌ Error actualizando pedido con coordenadas por defecto:', error);
                return false;
            }
            return false;
        }

        // ✅ Guardar coordenadas en la base de datos
        const { error } = await supabase
            .from('pedidos')
            .update({
                lat_cliente: coordenadas.lat,
                lng_cliente: coordenadas.lng
            })
            .eq('id', pedidoId);

        if (error) {
            console.error('❌ Error guardando coordenadas:', error);
            return false;
        }

        console.log(`✅ Pedido ${pedidoId} actualizado con coordenadas:`, coordenadas);
        return true;
    } catch (error) {
        console.error('❌ Error guardando coordenadas:', error);
        return false;
    }
}

// ✅ Función para actualizar múltiples pedidos sin coordenadas
export async function actualizarPedidosSinCoordenadas(): Promise<void> {
    try {
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select('id, direccion')
            .is('lat_cliente', null)
            .or('lng_cliente.is.null');

        if (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            return;
        }

        if (!pedidos || pedidos.length === 0) {
            console.log('✅ Todos los pedidos tienen coordenadas');
            return;
        }

        console.log(`📦 Actualizando ${pedidos.length} pedidos...`);

        let actualizados = 0;
        let fallidos = 0;

        for (const pedido of pedidos) {
            if (pedido.direccion) {
                const exito = await guardarCoordenadasPedido(pedido.id, pedido.direccion);
                if (exito) {
                    actualizados++;
                } else {
                    fallidos++;
                }
                // Esperar un poco para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`✅ Actualización completada: ${actualizados} actualizados, ${fallidos} fallidos`);
    } catch (error) {
        console.error('❌ Error actualizando pedidos:', error);
    }
}

// ✅ Función para obtener las coordenadas de un pedido
export async function obtenerCoordenadasPedido(pedidoId: number): Promise<{ lat: number; lng: number } | null> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('lat_cliente, lng_cliente')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.error('❌ Error obteniendo coordenadas del pedido:', error);
            return null;
        }

        if (data && data.lat_cliente && data.lng_cliente) {
            return {
                lat: data.lat_cliente,
                lng: data.lng_cliente
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error obteniendo coordenadas:', error);
        return null;
    }
}

// ✅ Función para validar si un pedido tiene coordenadas
export async function pedidoTieneCoordenadas(pedidoId: number): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select('lat_cliente, lng_cliente')
            .eq('id', pedidoId)
            .single();

        if (error) {
            console.error('❌ Error verificando coordenadas:', error);
            return false;
        }

        return !!(data && data.lat_cliente && data.lng_cliente);
    } catch (error) {
        console.error('❌ Error verificando coordenadas:', error);
        return false;
    }
}

// ✅ Función para actualizar la ubicación del repartidor en tiempo real
export async function actualizarUbicacionRepartidor(
    pedidoId: number,
    lat: number,
    lng: number
): Promise<boolean> {
    try {
        console.log(`📍 Actualizando ubicación del repartidor para pedido ${pedidoId}: ${lat}, ${lng}`);

        const { error } = await supabase
            .from('pedidos')
            .update({
                lat_repartidor: lat,
                repartidor_de_lng: lng
            })
            .eq('id', pedidoId);

        if (error) {
            console.error('❌ Error actualizando ubicación del repartidor:', error);
            return false;
        }

        console.log(`✅ Ubicación del repartidor actualizada para pedido ${pedidoId}`);
        return true;
    } catch (error) {
        console.error('❌ Error actualizando ubicación del repartidor:', error);
        return false;
    }
}