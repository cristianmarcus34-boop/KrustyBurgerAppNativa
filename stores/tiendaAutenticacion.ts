import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Perfil } from '../lib/tipos';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EstadoAutenticacion {
  sesion: any | null;
  perfil: Perfil | null;
  cargando: boolean;
  esAdministrador: boolean;
  esRepartidor: boolean;
  inicializarSesion: () => Promise<void>;
  iniciarSesion: (correo: string, contrasena: string) => Promise<string | null>;
  registrarCliente: (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

export const tiendaAutenticacion = create<EstadoAutenticacion>((set) => ({
  sesion: null,
  perfil: null,
  cargando: true,
  esAdministrador: false,
  esRepartidor: false,

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
      });

      if (errorPerfil) return errorPerfil.message;

      return null;
    } catch (error: any) {
      return error.message;
    }
  },

  cerrarSesion: async () => {
    try {
      // ✅ Cerrar sesión en Supabase
      await supabase.auth.signOut();

      // ✅ Limpiar AsyncStorage (funciona en todas las plataformas)
      try {
        await AsyncStorage.clear();
      } catch (e) {
        console.warn('Error al limpiar AsyncStorage:', e);
      }

      // ✅ Resetear el estado
      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false
      });

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así reseteamos el estado
      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false
      });
    }
  },
}));