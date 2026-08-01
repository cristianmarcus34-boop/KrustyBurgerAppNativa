import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase'; // Ajusta la ruta a tu cliente de supabase

interface OpcionesRastreo {
    pedidoId: number | null;
    activo: boolean; // Solo rastrear cuando el estado sea 'en_camino'
}

export function useRastreoRepartidor({ pedidoId, activo }: OpcionesRastreo) {
    const [rastreando, setRastreando] = useState(false);
    const [errorRastreo, setErrorRastreo] = useState<string | null>(null);
    const suscripcionUbicacion = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        if (activo && pedidoId) {
            iniciarSeguimientoGPS();
        } else {
            detenerSeguimientoGPS();
        }

        return () => {
            detenerSeguimientoGPS();
        };
    }, [pedidoId, activo]);

    const iniciarSeguimientoGPS = async () => {
        try {
            setErrorRastreo(null);

            // 1. Pedir permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorRastreo('Permiso para acceder a la ubicación denegado.');
                console.error('❌ Permiso de ubicación denegado');
                return;
            }

            setRastreando(true);
            console.log(`🚀 Iniciando rastreo GPS para el pedido #${pedidoId}...`);

            // 2. Escuchar cambios de ubicación
            suscripcionUbicacion.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 4000, // Enviar actualización cada 4 segundos
                    distanceInterval: 5, // o cada 5 metros recorridos
                },
                async (location) => {
                    const { latitude, longitude } = location.coords;

                    // 3. Actualizar coordenadas en Supabase
                    const { error } = await supabase
                        .from('pedidos')
                        .update({
                            lat_repartidor: latitude,
                            repartidor_de_lng: longitude, // Campo exacto de tu DB
                        })
                        .eq('id', pedidoId);

                    if (error) {
                        console.error('❌ Error al actualizar coordenadas en DB:', error.message);
                    } else {
                        console.log(`📍 Posición del repartidor enviada: [Lat: ${latitude}, Lng: ${longitude}]`);
                    }
                }
            );
        } catch (err: any) {
            console.error('❌ Error iniciando el GPS:', err);
            setErrorRastreo(err.message || 'Error al iniciar GPS');
            setRastreando(false);
        }
    };

    const detenerSeguimientoGPS = () => {
        if (suscripcionUbicacion.current) {
            suscripcionUbicacion.current.remove();
            suscripcionUbicacion.current = null;
            setRastreando(false);
            console.log('🛑 Rastreo GPS detenido.');
        }
    };

    return { rastreando, errorRastreo };
}