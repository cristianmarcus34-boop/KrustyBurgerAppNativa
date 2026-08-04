// lib/ubicacionStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ubicacion_seleccionada';

export interface UbicacionGuardada {
    latitude: number;
    longitude: number;
    direccion: string;
}

export const guardarUbicacion = async (ubicacion: UbicacionGuardada): Promise<void> => {
    try {
        const json = JSON.stringify(ubicacion);
        await AsyncStorage.setItem(STORAGE_KEY, json);
        console.log('✅ Ubicación guardada en AsyncStorage');
    } catch (error) {
        console.error('❌ Error guardando ubicación:', error);
    }
};

export const obtenerUbicacionGuardada = async (): Promise<UbicacionGuardada | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
            console.log('✅ Ubicación obtenida de AsyncStorage');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('❌ Error obteniendo ubicación guardada:', error);
        return null;
    }
};

export const eliminarUbicacionGuardada = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('✅ Ubicación eliminada de AsyncStorage');
    } catch (error) {
        console.error('❌ Error eliminando ubicación:', error);
    }
};