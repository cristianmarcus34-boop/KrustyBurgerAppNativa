import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { notificacionService } from './notificacionService';

export const TAREA_UBICACION_REPARTIDOR = 'krustyburger-delivery-location';

const CLAVE_SEGUIMIENTO_ACTIVO = 'krustyburger:seguimiento-repartidor-activo';

let seguimientoVisualActivo = false;

export const marcarSeguimientoVisualActivo = (activo: boolean) => {
  seguimientoVisualActivo = activo;
};

export interface SeguimientoEntregaActivo {
  pedidoId: number;
  repartidorId: string;
  clienteId: string | null;
  latCliente: number | null;
  lngCliente: number | null;
  tipoEntrega: string | null;
}

const calcularDistanciaMetros = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const aLat = (lat2 - lat1) * Math.PI / 180;
  const aLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(aLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(aLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const obtenerSeguimientoEntregaActivo = async (): Promise<SeguimientoEntregaActivo | null> => {
  const datos = await AsyncStorage.getItem(CLAVE_SEGUIMIENTO_ACTIVO);
  return datos ? JSON.parse(datos) as SeguimientoEntregaActivo : null;
};

export const iniciarSeguimientoUbicacionEnSegundoPlano = async (
  seguimiento: SeguimientoEntregaActivo
): Promise<boolean> => {
  let tareaYaRegistrada = false;
  try {
    const disponible = await TaskManager.isAvailableAsync();
    if (!disponible) {
      throw new Error('El seguimiento en segundo plano no está disponible en esta versión de la app.');
    }

    tareaYaRegistrada = await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION_REPARTIDOR);
    if (tareaYaRegistrada) {
      const seguimientoAnterior = await obtenerSeguimientoEntregaActivo();
      if (!seguimientoAnterior) {
        throw new Error('Hay una tarea de ubicación activa sin datos de entrega. Reiniciá la app antes de iniciar otra.');
      }
      if (seguimientoAnterior.pedidoId !== seguimiento.pedidoId) {
        throw new Error('Ya hay otra entrega con seguimiento activo en este dispositivo.');
      }

      await AsyncStorage.setItem(CLAVE_SEGUIMIENTO_ACTIVO, JSON.stringify(seguimiento));
      return false;
    }

    await AsyncStorage.setItem(CLAVE_SEGUIMIENTO_ACTIVO, JSON.stringify(seguimiento));

    const opciones: Location.LocationTaskOptions = {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Entrega en curso',
        notificationBody: 'KrustyBurger comparte tu ubicación mientras entregás el pedido.',
        notificationColor: '#F5C518',
        killServiceOnDestroy: false,
      },
    };

    await Location.startLocationUpdatesAsync(TAREA_UBICACION_REPARTIDOR, opciones);
    return true;
  } catch (error) {
    if (!tareaYaRegistrada) {
      await AsyncStorage.removeItem(CLAVE_SEGUIMIENTO_ACTIVO);
    }
    throw error;
  }
};

export const detenerSeguimientoUbicacionEnSegundoPlano = async (pedidoId?: number) => {
  const seguimiento = await obtenerSeguimientoEntregaActivo();
  if (pedidoId !== undefined && seguimiento && seguimiento.pedidoId !== pedidoId) return;

  const registrada = await Location.hasStartedLocationUpdatesAsync(TAREA_UBICACION_REPARTIDOR);
  if (registrada) {
    await Location.stopLocationUpdatesAsync(TAREA_UBICACION_REPARTIDOR);
  }

  await AsyncStorage.removeItem(CLAVE_SEGUIMIENTO_ACTIVO);
};

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  TAREA_UBICACION_REPARTIDOR,
  async ({ data, error }) => {
    if (error) {
      console.error('Error en la tarea de ubicación del repartidor:', error.message);
      return;
    }
    if (AppState.currentState === 'active' && seguimientoVisualActivo) return;

    const ubicaciones = data?.locations;
    if (!ubicaciones?.length) return;

    try {
      const seguimiento = await obtenerSeguimientoEntregaActivo();
      if (!seguimiento) {
        console.warn('La tarea de ubicación se ejecutó sin una entrega activa guardada.');
        return;
      }

      const ahora = Date.now();
      const ubicacionesValidas = ubicaciones.filter(({ coords, timestamp }) =>
        Number.isFinite(coords.latitude) &&
        Number.isFinite(coords.longitude) &&
        Math.abs(coords.latitude) <= 90 &&
        Math.abs(coords.longitude) <= 180 &&
        ahora - timestamp >= 0 &&
        ahora - timestamp <= 5 * 60 * 1000
      );
      const ultimaUbicacion = ubicacionesValidas[ubicacionesValidas.length - 1];
      if (!ultimaUbicacion) return;

      const { latitude, longitude } = ultimaUbicacion.coords;
      const { data: pedidoActualizado, error: errorUbicacion } = await supabase
        .from('pedidos')
        .update({
          lat_repartidor: latitude,
          repartidor_de_lng: longitude,
        })
        .eq('id', seguimiento.pedidoId)
        .eq('repartidor_id', seguimiento.repartidorId)
        .eq('estado', 'en_camino')
        .select('id')
        .maybeSingle();

      if (errorUbicacion) throw errorUbicacion;
      if (!pedidoActualizado) return;

      const tieneDestino =
        seguimiento.tipoEntrega !== 'retiro' &&
        seguimiento.clienteId &&
        seguimiento.latCliente !== null &&
        seguimiento.lngCliente !== null &&
        Number.isFinite(seguimiento.latCliente) &&
        Number.isFinite(seguimiento.lngCliente);

      const latCliente = seguimiento.latCliente;
      const lngCliente = seguimiento.lngCliente;
      const estaCerca = Boolean(
        tieneDestino &&
        latCliente !== null &&
        lngCliente !== null &&
        ubicacionesValidas.some(({ coords }) =>
          calcularDistanciaMetros(
            coords.latitude,
            coords.longitude,
            latCliente,
            lngCliente
          ) <= 200
        )
      );

      if (!estaCerca || !seguimiento.clienteId) return;

      const { data: avisoTomado, error: errorAviso } = await supabase
        .from('pedidos')
        .update({ aviso_cercania_enviado: true })
        .eq('id', seguimiento.pedidoId)
        .eq('repartidor_id', seguimiento.repartidorId)
        .eq('estado', 'en_camino')
        .eq('aviso_cercania_enviado', false)
        .select('id')
        .maybeSingle();

      if (errorAviso) throw errorAviso;

      if (avisoTomado) {
        const resultado = await notificacionService.notificarClienteCerca(
          seguimiento.clienteId,
          seguimiento.pedidoId
        );
        if (!resultado.success) {
          console.warn('No se pudo enviar el aviso de cercanía:', resultado);
        }
      }
    } catch (taskError) {
      console.error('No se pudo publicar la ubicación del repartidor:', taskError);
    }
  }
);
