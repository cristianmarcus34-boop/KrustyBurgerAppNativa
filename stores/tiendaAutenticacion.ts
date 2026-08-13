import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Perfil, UbicacionGuardada } from '../lib/tipos';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_UBICACION_KEY = '@ubicacion_seleccionada';

// ✅ Importación dinámica de notificacionService
let notificacionService: any = null;

const getNotificacionService = async () => {
  if (!notificacionService) {
    const module = await import('../services/notificacionService');
    notificacionService = module.notificacionService;
  }
  return notificacionService;
};

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
  resetearContrasena: (correo: string) => Promise<{ success: boolean; error?: string; errorType?: string }>;
  actualizarContrasena: (nuevaContrasena: string) => Promise<{ success: boolean; error?: string }>;
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

        // ✅ Registrar token FCM después de restaurar sesión
        try {
          const service = await getNotificacionService();
          await service.registrarToken(session.user.id);
          console.log('✅ Token FCM registrado al restaurar sesión');
        } catch (error) {
          console.warn('⚠️ No se pudo registrar token FCM al restaurar sesión:', error);
        }

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
      console.log('🔍 [Login] Intentando iniciar sesión:', correo);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (error) {
        console.error('❌ [Login] Error de autenticación:', error.message);
        return error.message;
      }

      console.log('✅ [Login] Usuario autenticado:', data.user.id);

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (perfilError) {
        console.error('❌ [Login] Error cargando perfil:', perfilError);
        return 'Error al cargar el perfil';
      }

      console.log('✅ [Login] Perfil cargado:', perfil);
      console.log('✅ [Login] ID del perfil:', perfil?.id);

      set({
        sesion: data.session,
        perfil: perfil as Perfil,
        esAdministrador: perfil?.rol === 'admin',
        esRepartidor: perfil?.rol === 'repartidor',
      });

      console.log('✅ [Login] Estado actualizado - perfil:', get().perfil);
      console.log('✅ [Login] Estado actualizado - perfil.id:', get().perfil?.id);

      await supabase
        .from('perfiles')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', data.user.id);

      // ✅ REGISTRAR TOKEN DESPUÉS DEL LOGIN
      try {
        const service = await getNotificacionService();
        await service.registrarToken(data.user.id);
        console.log('✅ [Login] Token FCM registrado después de login');
      } catch (error) {
        console.warn('⚠️ [Login] No se pudo registrar token FCM:', error);
      }

      return null;
    } catch (error: any) {
      console.error('❌ [Login] Error catastrófico:', error);
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
      console.log('📝 ID del perfil:', perfil.id);

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

  resetearContrasena: async (correo: string) => {
    try {
      console.log('📧 [Reset] Intentando para:', correo);

      const { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('email')
        .eq('email', correo)
        .single();

      if (errorPerfil || !perfil) {
        return {
          success: false,
          errorType: 'not_found',
          error: 'No existe una cuenta con este correo electrónico'
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: 'krustyburger://reset-password',
      });

      if (error) {
        const mensaje = error.message || '';
        const mensajeLower = mensaje.toLowerCase();

        if (mensajeLower.includes('rate limit') ||
          mensajeLower.includes('too many requests') ||
          mensajeLower.includes('try again later')) {
          return {
            success: false,
            errorType: 'rate_limit',
            error: '⏳ Has excedido el límite de intentos. Espera 1 hora y vuelve a intentarlo.\n\n📌 Consejo: Revisa tu carpeta de SPAM por si el correo ya fue enviado.'
          };
        }

        if (mensajeLower.includes('invalid email')) {
          return {
            success: false,
            errorType: 'invalid_email',
            error: '❌ El formato del correo electrónico no es válido.'
          };
        }

        if (mensajeLower.includes('not confirmed') || mensajeLower.includes('unconfirmed')) {
          return {
            success: false,
            errorType: 'unconfirmed',
            error: '⚠️ Tu correo no ha sido verificado. Por favor, verifica tu correo antes de continuar.'
          };
        }

        return {
          success: false,
          errorType: 'unknown',
          error: '❌ Error al enviar el correo: ' + mensaje
        };
      }

      console.log('✅ [Reset] Correo enviado a:', correo);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errorType: 'unknown',
        error: '❌ Ocurrió un error inesperado. Intenta nuevamente.'
      };
    }
  },

  actualizarContrasena: async (nuevaContrasena: string) => {
    try {
      if (nuevaContrasena.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const { error } = await supabase.auth.updateUser({
        password: nuevaContrasena,
      });

      if (error) {
        console.error('❌ Error actualizando contraseña:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Contraseña actualizada correctamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en actualizarContrasena:', error);
      return { success: false, error: error.message || 'Error al actualizar la contraseña' };
    }
  },
}));