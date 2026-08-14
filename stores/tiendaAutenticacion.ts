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

// ============================================================
// 🛡️ INTERFACES Y TIPOS
// ============================================================
interface EstadoAutenticacion {
  sesion: any | null;
  perfil: Perfil | null;
  cargando: boolean;
  esAdministrador: boolean;
  esRepartidor: boolean;
  ubicacionSeleccionada: UbicacionGuardada | null;
  error: string | null;

  // Acciones
  inicializarSesion: () => Promise<void>;
  iniciarSesion: (correo: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
  registrarCliente: (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => Promise<{ success: boolean; error?: string }>;
  cerrarSesion: () => Promise<void>;
  actualizarPerfil: (datos: Partial<Perfil>) => Promise<{ success: boolean; error?: string }>;
  guardarUbicacionTemporal: (ubicacion: UbicacionGuardada) => Promise<void>;
  cargarUbicacionTemporal: () => Promise<UbicacionGuardada | null>;
  limpiarUbicacionTemporal: () => Promise<void>;
  resetearContrasena: (correo: string) => Promise<{ success: boolean; error?: string; errorType?: string }>;
  actualizarContrasena: (nuevaContrasena: string) => Promise<{ success: boolean; error?: string }>;
  limpiarError: () => void;
}

// ============================================================
// 📦 STORE DE AUTENTICACIÓN
// ============================================================
export const tiendaAutenticacion = create<EstadoAutenticacion>((set, get) => ({
  // Estado inicial
  sesion: null,
  perfil: null,
  cargando: true,
  esAdministrador: false,
  esRepartidor: false,
  ubicacionSeleccionada: null,
  error: null,

  // ============================================================
  // 🔄 INICIALIZAR SESIÓN
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
        // ✅ Cargar perfil del usuario
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

        // ✅ Actualizar estado
        set({
          sesion: session,
          perfil: perfil as Perfil,
          esAdministrador: perfil?.rol === 'admin',
          esRepartidor: perfil?.rol === 'repartidor',
          cargando: false,
          error: null
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
      console.log('🔍 [Login] Intentando iniciar sesión:', correo);

      // ✅ Validaciones
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

      // ✅ Autenticar
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (error) {
        console.error('❌ [Login] Error de autenticación:', error.message);
        // ✅ Siempre devolver string
        return { success: false, error: String(error.message) };
      }

      console.log('✅ [Login] Usuario autenticado:', data.user.id);

      // ✅ Cargar perfil
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (perfilError) {
        console.error('❌ [Login] Error cargando perfil:', perfilError);
        return { success: false, error: 'Error al cargar el perfil' };
      }

      // ✅ Actualizar estado
      set({
        sesion: data.session,
        perfil: perfil as Perfil,
        esAdministrador: perfil?.rol === 'admin',
        esRepartidor: perfil?.rol === 'repartidor',
        error: null
      });

      console.log('✅ [Login] Perfil cargado:', perfil);

      // ✅ Actualizar último acceso
      await supabase
        .from('perfiles')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', data.user.id);

      // ✅ Registrar token FCM
      try {
        const service = await getNotificacionService();
        await service.registrarToken(data.user.id);
        console.log('✅ [Login] Token FCM registrado');
      } catch (error) {
        console.warn('⚠️ [Login] No se pudo registrar token FCM:', error);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ [Login] Error catastrófico:', error);
      set({ error: error.message });
      // ✅ Siempre devolver string
      return { success: false, error: String(error.message || 'Error inesperado') };
    }
  },

  // ============================================================
  // 📝 REGISTRAR CLIENTE
  // ============================================================
  registrarCliente: async ({ correo, contrasena, nombre, telefono }) => {
    set({ error: null });

    try {
      // ✅ Validaciones
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

      // ✅ Crear usuario en Supabase
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: contrasena,
      });

      if (error) {
        console.error('❌ Error en signUp:', error);
        return { success: false, error: String(error.message) };
      }

      if (!data.user) {
        return { success: false, error: 'Error al crear usuario' };
      }

      // ✅ Crear perfil
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
        return { success: false, error: String(errorPerfil.message) };
      }

      console.log('✅ [Registro] Usuario creado:', data.user.id);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      set({ error: error.message });
      return { success: false, error: String(error.message || 'Error inesperado') };
    }
  },

  // ============================================================
  // 🚪 CERRAR SESIÓN
  // ============================================================
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
  actualizarPerfil: async (datos: Partial<Perfil>) => {
    const { perfil, sesion } = get();

    if (!perfil || !sesion) {
      return { success: false, error: 'No hay sesión activa' };
    }

    try {
      console.log('📝 Actualizando perfil:', datos);

      const { error } = await supabase
        .from('perfiles')
        .update(datos)
        .eq('id', perfil.id);

      if (error) {
        console.error('❌ Error actualizando perfil:', error);
        return { success: false, error: String(error.message) };
      }

      const perfilActualizado = { ...perfil, ...datos };
      set({ perfil: perfilActualizado });

      console.log('✅ Perfil actualizado correctamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en actualizarPerfil:', error);
      return { success: false, error: String(error.message || 'Error inesperado') };
    }
  },

  // ============================================================
  // 📍 UBICACIÓN TEMPORAL
  // ============================================================
  guardarUbicacionTemporal: async (ubicacion: UbicacionGuardada) => {
    try {
      set({ ubicacionSeleccionada: ubicacion });
      const json = JSON.stringify(ubicacion);
      await AsyncStorage.setItem(STORAGE_UBICACION_KEY, json);
      console.log('✅ Ubicación guardada:', ubicacion);
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
        console.log('✅ Ubicación cargada');
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
      console.log('✅ Ubicación limpiada');
    } catch (error) {
      console.error('❌ Error limpiando ubicación:', error);
    }
  },

  // ============================================================
  // 🔑 RESETEAR CONTRASEÑA
  // ============================================================
  resetearContrasena: async (correo: string) => {
    set({ error: null });

    try {
      console.log('📧 [Reset] Intentando para:', correo);

      // ✅ Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        return { success: false, error: 'Ingresa un correo electrónico válido' };
      }

      // ✅ Verificar que el correo existe
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

      // ✅ Enviar correo de reset
      const { error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: 'https://www.krustyburger.com.ar/reset-password',
      });

      if (error) {
        const mensaje = error.message || '';
        const mensajeLower = mensaje.toLowerCase();

        // ✅ Manejo de errores específicos
        if (mensajeLower.includes('rate limit') ||
          mensajeLower.includes('too many requests')) {
          return {
            success: false,
            errorType: 'rate_limit',
            error: '⏳ Has excedido el límite de intentos. Espera 1 hora y vuelve a intentarlo.'
          };
        }

        if (mensajeLower.includes('invalid email')) {
          return {
            success: false,
            errorType: 'invalid_email',
            error: '❌ El formato del correo electrónico no es válido.'
          };
        }

        if (mensajeLower.includes('not confirmed')) {
          return {
            success: false,
            errorType: 'unconfirmed',
            error: '⚠️ Tu correo no ha sido verificado. Por favor, verifica tu correo.'
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
      console.error('❌ Error en resetearContrasena:', error);
      set({ error: error.message });
      return {
        success: false,
        errorType: 'unknown',
        error: '❌ Ocurrió un error inesperado. Intenta nuevamente.'
      };
    }
  },

  // ============================================================
  // 🔄 ACTUALIZAR CONTRASEÑA
  // ============================================================
  actualizarContrasena: async (nuevaContrasena: string) => {
    set({ error: null });

    try {
      console.log('🔄 [Update] Intentando actualizar contraseña...');

      // ✅ Validaciones
      if (!nuevaContrasena || nuevaContrasena.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      // ✅ Verificar sesión activa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Error verificando sesión:', sessionError);
        return { success: false, error: 'Error al verificar la sesión: ' + sessionError.message };
      }

      if (!session) {
        console.warn('⚠️ No hay sesión activa');
        return { success: false, error: 'No hay sesión activa. Solicita un nuevo enlace de recuperación.' };
      }

      console.log('✅ Sesión activa verificada');

      // ✅ Actualizar contraseña
      const { error } = await supabase.auth.updateUser({
        password: nuevaContrasena,
      });

      if (error) {
        console.error('❌ Error actualizando contraseña:', error);
        return { success: false, error: String(error.message) };
      }

      console.log('✅ Contraseña actualizada correctamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error en actualizarContrasena:', error);
      set({ error: error.message });
      return { success: false, error: String(error.message || 'Error al actualizar la contraseña') };
    }
  },

  // ============================================================
  // 🧹 LIMPIAR ERROR
  // ============================================================
  limpiarError: () => {
    set({ error: null });
  },
}));