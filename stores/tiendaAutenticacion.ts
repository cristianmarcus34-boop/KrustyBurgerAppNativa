// stores/tiendaAutenticacion.ts - ACTUALIZADO CON DESASOCIACIÓN DE TOKEN PUSH
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Perfil, UbicacionGuardada } from '../lib/tipos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tiendaFavoritos } from './tiendaFavoritos';
import { tiendaCarrito } from './tiendaCarrito';

const STORAGE_UBICACION_KEY = '@ubicacion_seleccionada';
const STORAGE_ULTIMO_USUARIO = '@ultimo_usuario_id';

// ✅ Importación dinámica de notificacionService
let notificacionService: any = null;

const getNotificacionService = async () => {
  if (!notificacionService) {
    const module = await import('../services/notificacionService');
    notificacionService = module.notificacionService;
  }
  return notificacionService;
};

// ============================================================
// 🛡️ INTERFACES
// ============================================================
interface EstadoAutenticacion {
  sesion: any | null;
  perfil: Perfil | null;
  cargando: boolean;
  esAdministrador: boolean;
  esRepartidor: boolean;
  ubicacionSeleccionada: UbicacionGuardada | null;
  error: string | null;

  inicializarSesion: () => Promise<void>;
  iniciarSesion: (correo: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
  registrarCliente: (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => Promise<{ success: boolean; error?: string }>;
  cerrarSesion: () => Promise<void>;
  actualizarPerfil: (datos: Partial<Perfil>) => Promise<{ success: boolean; error?: string }>;
  cargarPerfil: (id: string) => Promise<void>;

  guardarUbicacionTemporal: (ubicacion: UbicacionGuardada) => Promise<void>;
  cargarUbicacionTemporal: () => Promise<UbicacionGuardada | null>;
  limpiarUbicacionTemporal: () => Promise<void>;

  resetearContrasena: (correo: string) => Promise<{ success: boolean; error?: string; errorType?: string }>;
  actualizarContrasena: (nuevaContrasena: string) => Promise<{ success: boolean; error?: string }>;
  limpiarError: () => void;
}

// ============================================================
// 📦 STORE
// ============================================================
export const tiendaAutenticacion = create<EstadoAutenticacion>((set, get) => ({
  sesion: null,
  perfil: null,
  cargando: true,
  esAdministrador: false,
  esRepartidor: false,
  ubicacionSeleccionada: null,
  error: null,

  // ============================================================
  // 🔄 INICIALIZAR
  // ============================================================
  inicializarSesion: async () => {
    set({ cargando: true, error: null });

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        set({ cargando: false, error: error.message });
        return;
      }

      if (session) {
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (perfilError) {
          console.error('❌ Error cargando perfil:', perfilError);
          set({ cargando: false, error: perfilError.message });
          return;
        }

        const ultimoUsuarioId = await AsyncStorage.getItem(STORAGE_ULTIMO_USUARIO);
        if (ultimoUsuarioId && ultimoUsuarioId !== session.user.id) {
          console.log('🔄 Cambio de usuario detectado → vaciando carrito');
          await tiendaCarrito.getState().vaciarCarrito();
        }
        await AsyncStorage.setItem(STORAGE_ULTIMO_USUARIO, session.user.id);

        set({
          sesion: session,
          perfil: perfil as Perfil,
          esAdministrador: perfil?.rol === 'admin',
          esRepartidor: perfil?.rol === 'repartidor',
          cargando: false,
          error: null,
        });

        try {
          const service = await getNotificacionService();
          await service.registrarToken(session.user.id);
          console.log('✅ Token FCM registrado al restaurar sesión');
        } catch (error) {
          console.warn('⚠️ No se pudo registrar token FCM:', error);
        }
      } else {
        set({ cargando: false, sesion: null, perfil: null });
      }
    } catch (error: any) {
      console.error('❌ Error al inicializar sesión:', error);
      set({ cargando: false, error: error.message });
    }
  },

  // ============================================================
  // 🔐 INICIAR SESIÓN
  // ============================================================
  iniciarSesion: async (correo: string, contrasena: string) => {
    set({ error: null });

    try {
      if (!correo || !contrasena) {
        return { success: false, error: 'Completa todos los campos' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return { success: false, error: 'Ingresa un correo electrónico válido' };
      }

      if (contrasena.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (error) {
        console.log('🔑 [Login] Error:', error.message);
        return { success: false, error: error.message };
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (perfilError) {
        console.error('❌ [Login] Error cargando perfil:', perfilError);
        return { success: false, error: 'Error al cargar el perfil' };
      }

      const ultimoUsuarioId = await AsyncStorage.getItem(STORAGE_ULTIMO_USUARIO);
      if (ultimoUsuarioId && ultimoUsuarioId !== data.user.id) {
        console.log('🔄 Cambio de usuario → vaciando carrito');
        await tiendaCarrito.getState().vaciarCarrito();
      }
      await AsyncStorage.setItem(STORAGE_ULTIMO_USUARIO, data.user.id);

      set({
        sesion: data.session,
        perfil: perfil as Perfil,
        esAdministrador: perfil?.rol === 'admin',
        esRepartidor: perfil?.rol === 'repartidor',
        error: null,
      });

      await supabase
        .from('perfiles')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', data.user.id);

      try {
        const service = await getNotificacionService();
        await service.registrarToken(data.user.id);
      } catch (error) {
        console.warn('⚠️ [Login] No se pudo registrar token FCM:', error);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ [Login] Error catastrófico:', error);
      set({ error: error.message });
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // ============================================================
  // 📝 REGISTRAR
  // ============================================================
  registrarCliente: async ({ correo, contrasena, nombre, telefono }) => {
    set({ error: null });

    try {
      if (!correo || !contrasena || !nombre || !telefono) {
        return { success: false, error: 'Completa todos los campos' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return { success: false, error: 'Ingresa un correo electrónico válido' };
      }

      if (contrasena.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      if (telefono.length < 8) {
        return { success: false, error: 'Ingresa un número de teléfono válido' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: contrasena,
      });

      if (error) {
        console.error('❌ Error en signUp:', error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Error al crear usuario' };
      }

      const { error: errorPerfil } = await supabase.from('perfiles').insert({
        id: data.user.id,
        nombre_cliente: nombre,
        email: correo,
        telefono: telefono,
        rol: 'cliente',
        puntos_acumulados: 500,
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

      if (errorPerfil) {
        console.error('❌ Error creando perfil:', errorPerfil);
        return { success: false, error: errorPerfil.message };
      }

      await AsyncStorage.setItem(STORAGE_ULTIMO_USUARIO, data.user.id);

      // ✅ NUEVO: intentar registrar token después del registro
      //    (solo funciona si la sesión se crea automáticamente tras el signUp,
      //     es decir, si la confirmación por email está desactivada)
      try {
        const service = await getNotificacionService();
        await service.registrarToken(data.user.id);
        console.log('✅ Token FCM registrado tras registro');
      } catch (error) {
        console.warn('⚠️ No se pudo registrar token tras registro:', error);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      set({ error: error.message });
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // ============================================================
  // 🚪 CERRAR SESIÓN (CON DESASOCIACIÓN DE TOKEN)
  // ============================================================
  cerrarSesion: async () => {
    const { perfil } = get();

    try {
      console.log('🚪 [Logout] Cerrando sesión...');

      // ✅ 1. Desasociar token push del usuario
      if (perfil?.id) {
        try {
          const service = await getNotificacionService();
          if (typeof service.desasociarUsuario === 'function') {
            await service.desasociarUsuario(perfil.id);
            console.log('✅ [Logout] Token push desasociado');
          } else {
            console.warn('⚠️ [Logout] desasociarUsuario no existe en el servicio');
          }
        } catch (e) {
          console.warn('⚠️ [Logout] No se pudo desasociar token:', e);
        }
      }

      // ✅ 2. Cerrar sesión en Supabase
      await supabase.auth.signOut();

      // ✅ 3. Limpiar estado global de favoritos
      try {
        tiendaFavoritos.getState().limpiarFavoritos();
      } catch (e) {
        console.warn('⚠️ Error limpiando favoritos:', e);
      }

      // ✅ 4. Limpiar AsyncStorage selectivamente
      //    NO vaciamos el carrito (persiste) ni el último usuario ni la ubicación
      try {
        const keysToKeep = [STORAGE_ULTIMO_USUARIO, 'carrito_krusty', STORAGE_UBICACION_KEY];
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter((k) => !keysToKeep.includes(k));
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      } catch (e) {
        console.warn('⚠️ Error limpiando AsyncStorage:', e);
      }

      // ✅ 5. Resetear estado
      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false,
        ubicacionSeleccionada: null,
        error: null,
      });

      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      set({
        sesion: null,
        perfil: null,
        esAdministrador: false,
        esRepartidor: false,
        cargando: false,
        ubicacionSeleccionada: null,
        error: null,
      });
    }
  },

  // ============================================================
  // 👤 ACTUALIZAR PERFIL
  // ============================================================
  actualizarPerfil: async (datos) => {
    const { perfil, sesion } = get();

    if (!perfil || !sesion) {
      return { success: false, error: 'No hay sesión activa' };
    }

    try {
      const { error } = await supabase
        .from('perfiles')
        .update(datos)
        .eq('id', perfil.id);

      if (error) {
        console.error('❌ Error actualizando perfil:', error);
        return { success: false, error: error.message };
      }

      const perfilActualizado = { ...perfil, ...datos };
      set({ perfil: perfilActualizado });

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en actualizarPerfil:', error);
      return { success: false, error: error.message || 'Error inesperado' };
    }
  },

  // ============================================================
  // ✅ CARGAR PERFIL
  // ============================================================
  cargarPerfil: async (id: string) => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ [cargarPerfil] Error:', error);
        return;
      }

      if (data) {
        set({ perfil: data });
      }
    } catch (error) {
      console.error('❌ [cargarPerfil] Error inesperado:', error);
    }
  },

  // ============================================================
  // 📍 UBICACIÓN
  // ============================================================
  guardarUbicacionTemporal: async (ubicacion) => {
    try {
      set({ ubicacionSeleccionada: ubicacion });
      await AsyncStorage.setItem(STORAGE_UBICACION_KEY, JSON.stringify(ubicacion));
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
        return ubicacion;
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando ubicación:', error);
      return null;
    }
  },

  limpiarUbicacionTemporal: async () => {
    try {
      set({ ubicacionSeleccionada: null });
      await AsyncStorage.removeItem(STORAGE_UBICACION_KEY);
    } catch (error) {
      console.error('❌ Error limpiando ubicación:', error);
    }
  },

  // ============================================================
  // 🔑 RESET PASSWORD
  // ============================================================
  resetearContrasena: async (correo: string) => {
    set({ error: null });

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return { success: false, error: 'Ingresa un correo electrónico válido' };
      }

      const { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('email')
        .eq('email', correo)
        .single();

      if (errorPerfil || !perfil) {
        return {
          success: false,
          errorType: 'not_found',
          error: 'No existe una cuenta con este correo electrónico',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: 'krustyburger://nueva-contrasena',
      });

      if (error) {
        const mensajeLower = (error.message || '').toLowerCase();

        if (mensajeLower.includes('rate limit') || mensajeLower.includes('too many requests')) {
          return {
            success: false,
            errorType: 'rate_limit',
            error: '⏳ Has excedido el límite de intentos. Espera 1 hora.',
          };
        }

        return {
          success: false,
          errorType: 'unknown',
          error: '❌ Error al enviar el correo: ' + error.message,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        errorType: 'unknown',
        error: '❌ Ocurrió un error inesperado. Intenta nuevamente.',
      };
    }
  },

  // ============================================================
  // 🔄 UPDATE PASSWORD
  // ============================================================
  actualizarContrasena: async (nuevaContrasena: string) => {
    set({ error: null });

    try {
      if (!nuevaContrasena || nuevaContrasena.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { success: false, error: 'No hay sesión activa. Solicita un nuevo enlace.' };
      }

      const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al actualizar la contraseña' };
    }
  },

  limpiarError: () => set({ error: null }),
}));