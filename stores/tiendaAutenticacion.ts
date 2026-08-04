// stores/tiendaAutenticacion.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Perfil, UbicacionGuardada } from '../lib/tipos'; // ✅ IMPORTAR DESDE TIPOS
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_UBICACION_KEY = '@ubicacion_seleccionada';

interface EstadoAutenticacion {
  sesion: any | null;
  perfil: Perfil | null;
  cargando: boolean;
  esAdministrador: boolean;
  esRepartidor: boolean;
  ubicacionSeleccionada: UbicacionGuardada | null;
  inicializarSesion: () => Promise<void>;
  iniciarSesion: (correo: string, contrasena: string) => Promise<string | null>;
  registrarCliente: (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
  actualizarPerfil: (datos: Partial<Perfil>) => Promise<void>;
  guardarUbicacionTemporal: (ubicacion: UbicacionGuardada) => Promise<void>;
  cargarUbicacionTemporal: () => Promise<UbicacionGuardada | null>;
  limpiarUbicacionTemporal: () => Promise<void>;
}

export const tiendaAutenticacion = create<EstadoAutenticacion>((set, get) => ({
  sesion: null,
  perfil: null,
  cargando: true,
  esAdministrador: false,
  esRepartidor: false,
  ubicacionSeleccionada: null,

  inicializarSesion: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          sesion: session,
          perfil: perfil as Perfil,
          esAdministrador: perfil?.rol === 'admin',
          esRepartidor: perfil?.rol === 'repartidor',
          cargando: false
        });
      } else {
        set({ cargando: false });
      }
    } catch (error) {
      console.error('Error al inicializar sesión:', error);
      set({ cargando: false });
    }
  },

  iniciarSesion: async (correo, contrasena) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (error) return error.message;

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        sesion: data.session,
        perfil: perfil as Perfil,
        esAdministrador: perfil?.rol === 'admin',
        esRepartidor: perfil?.rol === 'repartidor',
      });

      await supabase
        .from('perfiles')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', data.user.id);

      return null;
    } catch (error: any) {
      return error.message;
    }
  },

  registrarCliente: async ({ correo, contrasena, nombre, telefono }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: contrasena,
      });

      if (error) return error.message;
      if (!data.user) return 'Error al crear usuario';

      const { error: errorPerfil } = await supabase.from('perfiles').insert({
        id: data.user.id,
        nombre_cliente: nombre,
        email: correo,
        telefono: telefono,
        rol: 'cliente',
        puntos_acumulados: 100,
        ultimo_acceso: new Date().toISOString(),
        direccion_calle: null,
        direccion_numero: null,
        direccion_piso: null,
        direccion_departamento: null,
        direccion_barrio: null,
        direccion_ciudad: null,
        direccion_codigo_postal: null,
        preferencias_comida: null,
        metodo_pago: null,
      });

      if (errorPerfil) return errorPerfil.message;

      return null;
    } catch (error: any) {
      return error.message;
    }
  },

  cerrarSesion: async () => {
    try {
      await supabase.auth.signOut();

      try {
        await AsyncStorage.clear();
      } catch (e) {
        console.warn('Error al limpiar AsyncStorage:', e);
      }

      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false,
        ubicacionSeleccionada: null,
      });

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false,
        ubicacionSeleccionada: null,
      });
    }
  },

  actualizarPerfil: async (datos: Partial<Perfil>) => {
    const { perfil, sesion } = get();

    if (!perfil || !sesion) {
      console.error('❌ No hay sesión activa para actualizar perfil');
      throw new Error('No hay sesión activa');
    }

    try {
      console.log('📝 Actualizando perfil:', datos);

      const { error } = await supabase
        .from('perfiles')
        .update(datos)
        .eq('id', perfil.id);

      if (error) {
        console.error('❌ Error actualizando perfil:', error);
        throw error;
      }

      const perfilActualizado = { ...perfil, ...datos };
      set({ perfil: perfilActualizado });

      console.log('✅ Perfil actualizado correctamente');
    } catch (error) {
      console.error('❌ Error en actualizarPerfil:', error);
      throw error;
    }
  },

  guardarUbicacionTemporal: async (ubicacion: UbicacionGuardada) => {
    try {
      set({ ubicacionSeleccionada: ubicacion });
      const json = JSON.stringify(ubicacion);
      await AsyncStorage.setItem(STORAGE_UBICACION_KEY, json);
      console.log('✅ Ubicación guardada en store y AsyncStorage:', ubicacion);
    } catch (error) {
      console.error('❌ Error guardando ubicación:', error);
    }
  },

  cargarUbicacionTemporal: async (): Promise<UbicacionGuardada | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_UBICACION_KEY);
      if (data) {
        const ubicacion = JSON.parse(data) as UbicacionGuardada;
        set({ ubicacionSeleccionada: ubicacion });
        console.log('✅ Ubicación cargada al store:', ubicacion);
        return ubicacion;
      } else {
        console.log('ℹ️ No hay ubicación guardada en AsyncStorage');
        return null;
      }
    } catch (error) {
      console.error('❌ Error cargando ubicación:', error);
      return null;
    }
  },

  limpiarUbicacionTemporal: async () => {
    try {
      set({ ubicacionSeleccionada: null });
      await AsyncStorage.removeItem(STORAGE_UBICACION_KEY);
      console.log('✅ Ubicación limpiada de store y AsyncStorage');
    } catch (error) {
      console.error('❌ Error limpiando ubicación:', error);
    }
  },
}));