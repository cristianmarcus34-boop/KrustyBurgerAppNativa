// utils/ubicacionHelper.ts
// Helper de ubicación: permisos, posición actual, reverse geocoding y normalización

import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export interface DireccionNormalizada {
    latitude: number;
    longitude: number;
    calle: string;
    numero: string;
    piso: string;
    departamento: string;
    barrio: string;
    ciudad: string;
    codigoPostal: string;
    direccionCompleta: string;
    /** true si el reverse geocoding devolvió datos útiles */
    tieneDireccionReal: boolean;
}

/**
 * Asegura permiso foreground de ubicación.
 * Devuelve true si está concedido, false si el usuario lo negó.
 * Si fue denegado permanentemente, muestra un Alert con opción "Abrir ajustes".
 */
export const asegurarPermisoUbicacion = async (
    mostrarAlertaSiDenegado: boolean = true,
): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return true;

        // Si está denegado permanentemente, no se puede volver a pedir
        if (status === 'denied') {
            if (mostrarAlertaSiDenegado) {
                Alert.alert(
                    '📍 Permiso de ubicación',
                    'Para autocompletar tu dirección necesitamos acceso a tu ubicación. Podés habilitarlo desde los ajustes del dispositivo.',
                    [
                        { text: 'Ahora no', style: 'cancel' },
                        {
                            text: 'Abrir ajustes',
                            onPress: () =>
                                Linking.openSettings().catch(() => {
                                    Alert.alert('Error', 'No se pudieron abrir los ajustes.');
                                }),
                        },
                    ],
                );
            }
            return false;
        }

        // status === 'undetermined' → primera vez
        const { status: nuevoStatus } = await Location.requestForegroundPermissionsAsync();
        return nuevoStatus === 'granted';
    } catch (error) {
        console.error('❌ [ubicacionHelper] Error asegurando permiso:', error);
        return false;
    }
};

/**
 * Obtiene la posición actual del dispositivo.
 * Requiere permiso foreground ya concedido.
 */
export const obtenerPosicionActual = async (): Promise<{
    latitude: number;
    longitude: number;
} | null> => {
    try {
        const posicion = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        return {
            latitude: posicion.coords.latitude,
            longitude: posicion.coords.longitude,
        };
    } catch (error) {
        console.error('❌ [ubicacionHelper] Error obteniendo posición:', error);
        return null;
    }
};

/**
 * Reverse geocoding: coordenadas → dirección legible.
 * Devuelve null si falla o si no hay resultados.
 */
export const reverseGeocode = async (
    latitude: number,
    longitude: number,
): Promise<DireccionNormalizada | null> => {
    try {
        const resultados = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (!resultados || resultados.length === 0) return null;

        const lugar = resultados[0];

        // Normalizar campos (pueden venir null o vacíos según la plataforma)
        const calle = (lugar.street || lugar.name || '').trim();
        const numero = (lugar.streetNumber || '').trim();
        const piso = '';
        const departamento = '';
        const barrio = (lugar.district || lugar.subregion || '').trim();
        const ciudad = (lugar.city || lugar.region || '').trim();
        const codigoPostal = (lugar.postalCode || '').trim();

        const partes = [
            calle && numero ? `${calle} ${numero}` : calle,
            barrio,
            ciudad,
            codigoPostal ? `CP ${codigoPostal}` : '',
        ].filter(Boolean);

        const direccionCompleta = partes.join(', ');

        const tieneDireccionReal = Boolean(calle) || Boolean(ciudad);

        return {
            latitude,
            longitude,
            calle,
            numero,
            piso,
            departamento,
            barrio,
            ciudad,
            codigoPostal,
            direccionCompleta,
            tieneDireccionReal,
        };
    } catch (error) {
        console.error('❌ [ubicacionHelper] Error en reverseGeocode:', error);
        return null;
    }
};

/**
 * Flujo completo: permiso → posición → reverse geocoding.
 * Devuelve null si el usuario niega permiso o falla la posición.
 * Si el reverse falla, igual devuelve las coordenadas con tieneDireccionReal=false.
 */
export const obtenerUbicacionConDireccion = async (
    mostrarAlertaSiDenegado: boolean = true,
): Promise<DireccionNormalizada | null> => {
    const tienePermiso = await asegurarPermisoUbicacion(mostrarAlertaSiDenegado);
    if (!tienePermiso) return null;

    const posicion = await obtenerPosicionActual();
    if (!posicion) return null;

    const direccion = await reverseGeocode(posicion.latitude, posicion.longitude);

    // Fallback: si el reverse falla, devolvemos al menos las coordenadas
    if (!direccion) {
        return {
            latitude: posicion.latitude,
            longitude: posicion.longitude,
            calle: '',
            numero: '',
            piso: '',
            departamento: '',
            barrio: '',
            ciudad: '',
            codigoPostal: '',
            direccionCompleta: `${posicion.latitude.toFixed(6)}, ${posicion.longitude.toFixed(6)}`,
            tieneDireccionReal: false,
        };
    }

    return direccion;
};