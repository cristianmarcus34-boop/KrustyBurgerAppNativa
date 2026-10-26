// utils/ubicacionHelper.ts
// Helper de ubicación: permisos, posición actual, reverse geocoding y normalización

import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

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

// ============================================================
// 📋 CÓDIGOS DE ERROR
// ============================================================
export type CodigoErrorUbicacion =
    | 'PERMISO_DENEGADO'
    | 'GPS_DESACTIVADO'
    | 'GPS_SIN_SENAL'
    | 'TIMEOUT'
    | 'GPS_COORDS_INVALIDAS'
    | 'GPS_ERROR'
    | 'GEOCODE_ERROR';

export interface ErrorUbicacion extends Error {
    codigo: CodigoErrorUbicacion;
}

/**
 * Crea un error tipado de ubicación.
 */
const crearErrorUbicacion = (codigo: CodigoErrorUbicacion): ErrorUbicacion => {
    const error = new Error(codigo) as ErrorUbicacion;
    error.codigo = codigo;
    return error;
};

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
 * Obtiene la posición actual del dispositivo con timeout manual.
 * Requiere permiso foreground ya concedido.
 *
 * ⚠️ Lanza ErrorUbicacion tipado en caso de fallo:
 *    - GPS_DESACTIVADO: el GPS del sistema está apagado
 *    - GPS_SIN_SENAL: el dispositivo no puede obtener señal
 *    - TIMEOUT: no respondió en 15 segundos
 *    - GPS_COORDS_INVALIDAS: coordenadas fuera de rango
 *    - GPS_ERROR: error genérico
 */
export const obtenerPosicionActual = async (): Promise<{
    latitude: number;
    longitude: number;
}> => {
    try {
        // 1. Verificar que el GPS del sistema esté activado
        const serviciosActivos = await Location.hasServicesEnabledAsync();
        if (!serviciosActivos) {
            throw crearErrorUbicacion('GPS_DESACTIVADO');
        }

        // 2. Intentar obtener posición con timeout manual de 15s
        let posicion: Location.LocationObject;
        try {
            posicion = await Promise.race([
                Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    mayShowUserSettingsDialog: true,
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(crearErrorUbicacion('TIMEOUT')), 15000),
                ),
            ]);
        } catch (posError: any) {
            // Si ya es un ErrorUbicacion tipado, re-lanzar
            if (posError?.codigo) throw posError;

            const msg = String(posError?.message || '').toLowerCase();

            if (
                msg.includes('unavailable') ||
                msg.includes('location services') ||
                msg.includes('location is unavailable')
            ) {
                throw crearErrorUbicacion('GPS_SIN_SENAL');
            }

            throw crearErrorUbicacion('GPS_ERROR');
        }

        const { latitude, longitude } = posicion.coords;

        // 3. Validar coordenadas
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
        ) {
            throw crearErrorUbicacion('GPS_COORDS_INVALIDAS');
        }

        return { latitude, longitude };
    } catch (error: any) {
        // Re-lanzar errores tipados tal cual
        if (error?.codigo) throw error;

        console.error('❌ [ubicacionHelper] Error obteniendo posición:', error);
        throw crearErrorUbicacion('GPS_ERROR');
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
 *
 * ⚠️ Lanza ErrorUbicacion tipado si:
 *    - Permiso denegado → PERMISO_DENEGADO
 *    - GPS desactivado → GPS_DESACTIVADO
 *    - Sin señal → GPS_SIN_SENAL
 *    - Timeout → TIMEOUT
 *    - Coordenadas inválidas → GPS_COORDS_INVALIDAS
 *
 * Si reverse geocoding falla, devuelve las coordenadas con tieneDireccionReal=false.
 */
export const obtenerUbicacionConDireccion = async (
    mostrarAlertaSiDenegado: boolean = true,
): Promise<DireccionNormalizada> => {
    // 1. Permiso
    const tienePermiso = await asegurarPermisoUbicacion(mostrarAlertaSiDenegado);
    if (!tienePermiso) {
        throw crearErrorUbicacion('PERMISO_DENEGADO');
    }

    // 2. Posición (puede lanzar GPS_DESACTIVADO, GPS_SIN_SENAL, TIMEOUT, etc.)
    const posicion = await obtenerPosicionActual();

    // 3. Reverse geocoding
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

// ============================================================
// 💬 MENSAJES AMIGABLES DE ERROR
// ============================================================
export interface MensajeErrorUbicacion {
    titulo: string;
    mensaje: string;
    mostrarBotonAjustes: boolean;
    tipoAjustes?: 'app' | 'gps';
    esTimeout: boolean;
}

/**
 * Convierte un error técnico de ubicación en un mensaje amigable
 * con instrucciones claras para el usuario.
 */
export const mensajeErrorUbicacion = (error: any): MensajeErrorUbicacion => {
    const codigo: CodigoErrorUbicacion | undefined = error?.codigo;

    switch (codigo) {
        case 'PERMISO_DENEGADO':
            return {
                titulo: '📍 Permiso de ubicación requerido',
                mensaje:
                    'Krusty Burger necesita permiso de ubicación para detectar tu dirección.\n\n' +
                    'Podés activarlo desde:\n' +
                    'Ajustes → Aplicaciones → Krusty Burger → Permisos → Ubicación',
                mostrarBotonAjustes: true,
                tipoAjustes: 'app',
                esTimeout: false,
            };

        case 'GPS_DESACTIVADO':
            return {
                titulo: '📡 GPS desactivado',
                mensaje:
                    'El GPS de tu dispositivo está apagado.\n\n' +
                    'Para detectar tu ubicación:\n' +
                    '1. Deslizá la barra de notificaciones\n' +
                    '2. Tocá el ícono "Ubicación" para activarlo\n' +
                    '3. Volvé a intentar',
                mostrarBotonAjustes: true,
                tipoAjustes: 'gps',
                esTimeout: false,
            };

        case 'GPS_SIN_SENAL':
            return {
                titulo: '📡 No pudimos obtener tu ubicación',
                mensaje:
                    'Esto puede pasar por:\n\n' +
                    '• Estás en un lugar sin señal GPS (sótano, interior)\n' +
                    '• El GPS todavía no enganchó señal\n' +
                    '• Problema de conexión a internet\n\n' +
                    'Probá salir al aire libre o ingresá tu dirección manualmente.',
                mostrarBotonAjustes: false,
                esTimeout: false,
            };

        case 'TIMEOUT':
            return {
                titulo: '⏱️ La ubicación tardó demasiado',
                mensaje:
                    'El GPS no respondió en 15 segundos.\n\n' +
                    'Probá:\n' +
                    '• Salir al aire libre\n' +
                    '• Activar el modo "Alta precisión" en Ajustes → Ubicación\n' +
                    '• Reintentar\n\n' +
                    'O ingresá tu dirección manualmente.',
                mostrarBotonAjustes: false,
                esTimeout: true,
            };

        case 'GPS_COORDS_INVALIDAS':
            return {
                titulo: '⚠️ Ubicación inválida',
                mensaje:
                    'El dispositivo devolvió coordenadas inválidas.\n\n' +
                    'Probá reiniciar la app o ingresá tu dirección manualmente.',
                mostrarBotonAjustes: false,
                esTimeout: false,
            };

        case 'GEOCODE_ERROR':
            return {
                titulo: '📍 Dirección no detectada',
                mensaje:
                    'Obtuvimos tus coordenadas pero no pudimos detectar la dirección.\n\n' +
                    'Podés completarla manualmente en el formulario.',
                mostrarBotonAjustes: false,
                esTimeout: false,
            };

        default:
            return {
                titulo: '📍 No pudimos detectar tu ubicación',
                mensaje:
                    'Ocurrió un problema al obtener tu ubicación.\n\n' +
                    'Verificá que:\n' +
                    '• El GPS esté activado\n' +
                    '• Tengas conexión a internet\n' +
                    '• Estés en un lugar con señal\n\n' +
                    'O ingresá tu dirección manualmente.',
                mostrarBotonAjustes: false,
                esTimeout: false,
            };
    }
};

// ============================================================
// 🔗 HELPERS PARA ABRIR AJUSTES
// ============================================================

/**
 * Abre los ajustes de la app (permisos).
 */
export const abrirAjustesApp = async (): Promise<void> => {
    try {
        if (Platform.OS === 'ios') {
            await Linking.openURL('app-settings:');
        } else {
            await Linking.openSettings();
        }
    } catch (error) {
        console.warn('⚠️ No se pudo abrir ajustes de la app:', error);
        Alert.alert(
            'Abrí los ajustes manualmente',
            'Andá a Ajustes → Aplicaciones → Krusty Burger → Permisos → Ubicación',
        );
    }
};

/**
 * Abre los ajustes de ubicación del sistema (para activar/desactivar GPS).
 */
export const abrirAjustesGPS = async (): Promise<void> => {
    try {
        if (Platform.OS === 'android') {
            await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        } else {
            await Linking.openURL('App-Prefs:Privacy&path=LOCATION');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo abrir ajustes de GPS:', error);
        // Fallback: abrir ajustes de la app
        await abrirAjustesApp();
    }
};