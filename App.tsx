// ============================================================
// 📱 App.tsx - PUNTO DE ENTRADA DE KRUSTY BURGER
// ============================================================

import './setup.js';

// ============================================================
// 🚫 FILTRO DE ERRORES DE CONSOLA (NO CRÍTICOS)
// ============================================================
const originalConsoleError = console.error;

console.error = (...args: any[]) => {
  const message = args[0] || '';

  if (typeof message === 'string') {
    const ignorar = [
      'rate limit',
      'email rate limit',
      'too many requests',
      'try again later',
      'Text strings',
      'Text string',
      'react-native-paper',
      'Paper',
      'TouchableRipple',
      'MD3',
      'LogBox'
    ];

    if (ignorar.some(texto => message.toLowerCase().includes(texto.toLowerCase()))) {
      return;
    }
  }

  originalConsoleError(...args);
};

// ============================================================
// 📦 IMPORTACIONES DE REACT Y NAVEGACIÓN
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppState, View, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// ============================================================
// 📦 IMPORTACIONES DE EXPO Y LIBRERÍAS NATIVAS
// ============================================================
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// ============================================================
// 📦 COMPONENTES PROPIOS
// ============================================================
import SplashScreen from './components/SplashScreen';
import BarraInferiorProfesional from './components/BarraInferiorProfesional';

// ============================================================
// 📦 STORES Y SERVICIOS (Estado global)
// ============================================================
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { notificacionService, setNavigationRef } from './services/notificacionService';

// ============================================================
// 📦 CONFIGURACIÓN CENTRALIZADA (Temas, headers)
// ============================================================
import {
  temaApp,
  HEADER_OPTIONS,
  HEADER_LEGAL_OPTIONS
} from './config/tema';

// ============================================================
// 📦 TEMA (nuevo sistema claro/oscuro)
// ============================================================
import { ThemeProvider, useTema } from './lib/theme';

// ============================================================
// 📦 PANTALLAS - AUTENTICACIÓN
// ============================================================
import PantallaBienvenida from './screens/PantallaBienvenida';
import PantallaLogin from './screens/auth/PantallaLogin';
import PantallaRegistro from './screens/auth/PantallaRegistro';
import PantallaResetPassword from './screens/auth/PantallaResetPassword';
import PantallaNuevaContrasena from './screens/auth/PantallaNuevaContrasena';

// ============================================================
// 📦 PANTALLAS - CLIENTE
// ============================================================
import PantallaInicio from './screens/cliente/PantallaInicio';
import PantallaMenu from './screens/cliente/PantallaMenu';
import PantallaOfertas from './screens/cliente/PantallaOfertas';
import PantallaPedidos from './screens/cliente/PantallaPedidos';
import PantallaCarrito from './screens/cliente/PantallaCarrito';
import PantallaSeguimiento from './screens/cliente/PantallaSeguimiento';
import PantallaPerfil from './screens/cliente/PantallaPerfil';
import PantallaDetalleProducto from './screens/cliente/PantallaDetalleProducto';
import PantallaRecompensas from './screens/cliente/PantallaRecompensas';
import PantallaCheckout from './screens/cliente/PantallaCheckout';
import PantallaNotificacionesUsuario from './screens/cliente/PantallaNotificacionesUsuario';
import PantallaDetalleOferta from './screens/cliente/PantallaDetalleOferta';
import PantallaTerminos from './screens/cliente/PantallaTerminos';
import PantallaPrivacidad from './screens/cliente/PantallaPrivacidad';

// ============================================================
// 📦 PANTALLAS - CUPONES (CLIENTE)
// ============================================================
import PantallaMisCupones from './screens/cliente/PantallaMisCupones';
import PantallaCanjearCupon from './screens/cliente/PantallaCanjearCupon';

// ============================================================
// 📦 PANTALLAS - ADMIN
// ============================================================
import PantallaPanelAdmin from './screens/admin/PantallaPanelAdmin';
import PantallaGestionPedidos from './screens/admin/PantallaGestionPedidos';
import PantallaGestionMenu from './screens/admin/PantallaGestionMenu';
import PantallaGestionClientes from './screens/admin/PantallaGestionClientes';
import PantallaEstadisticas from './screens/admin/PantallaEstadisticas';
import PantallaGestionOfertas from './screens/admin/PantallaGestionOfertas';
import PantallaConfiguracionEnvios from './screens/admin/PantallaConfiguracionEnvios';
import PantallaGestionRecompensas from './screens/admin/PantallaGestionRecompensas';
import PantallaNotificacionesAdmin from './screens/admin/PantallaNotificacionesAdmin';

// 🆕 NUEVA PANTALLA DE REPARTIDORES
import PantallaRepartidores from './screens/admin/PantallaRepartidores';

// ============================================================
// 📦 PANTALLAS - CUPONES (ADMIN)
// ============================================================
import PantallaListaCupones from './screens/admin/PantallaListaCupones';
import PantallaCrearCupon from './screens/admin/PantallaCrearCupon';

// ============================================================
// 📦 PANTALLAS - REPARTIDOR
// ============================================================
import PantallaTransmision from './screens/repartidor/PantallaTransmision';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  sendDefaultPii: true,
  enableLogs: true,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

// ============================================================
// ⏱️ CONSTANTES DE TIMING DEL SPLASH
// ============================================================
const SPLASH_MIN_DURATION = 2000;
const SPLASH_MAX_DURATION = 3000;
const SPLASH_LOGO_FADE_DURATION = 400;

// ============================================================
// 🏗️ CREACIÓN DE NAVEGADORES
// ============================================================
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// 🎬 BLOQUEAR EL SPLASH NATIVO HASTA QUE EL CUSTOM ESTÉ LISTO
// ============================================================
console.log('🟦 [Module] App.tsx cargado');

ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  // Ignorar si ya estaba oculto (hot reload, etc)
});

console.log('🟦 [Module] preventAutoHideAsync llamado');

// ============================================================
// 🔗 CONFIGURACIÓN DE DEEP LINKING
// ============================================================
const linking = {
  prefixes: [
    'krustyburger://',
    'https://www.krustyburger.com.ar',
    'https://krustyburger.com'
  ],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      NuevaContrasena: {
        path: 'nueva-contrasena',
        parse: { token: (token: string) => token },
      },
      Login: 'login',
      Registro: 'registro',
      Bienvenida: 'bienvenida',

      Ofertas: 'ofertas',
      Terminos: 'terminos',
      Privacidad: 'privacidad',

      Principal: {
        screens: {
          Inicio: 'inicio',
          Menu: 'menu',
          Carrito: 'carrito',
          Pedidos: 'pedidos',
          Perfil: 'perfil',
        }
      },

      NotificacionesUsuario: 'notificaciones',
      Recompensas: 'recompensas',
      Seguimiento: 'seguimiento',

      MisCupones: 'mis-cupones',
      CanjearCupon: {
        path: 'cupon/:codigo',
        parse: { codigo: (codigo: string) => codigo },
      },

      ListaCupones: 'lista-cupones',
      CrearCupon: 'crear-cupon',
      EditarCupon: 'editar-cupon',
    }
  }
};

// ============================================================
// 🎨 FUNCIÓN QUE RENDERIZA LA BARRA INFERIOR
// ============================================================
const renderTabBar = (props: any) => {
  return <BarraInferiorProfesional {...props} />;
};

// ============================================================
// 📱 PESTAÑAS DEL CLIENTE
// ============================================================
function PestanasCliente() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Menu" component={PantallaMenu} />
      <Tab.Screen name="Carrito" component={PantallaCarrito} />
      <Tab.Screen name="Pedidos" component={PantallaPedidos} />
      <Tab.Screen name="Perfil" component={PantallaPerfil} />
    </Tab.Navigator>
  );
}

// ============================================================
// 🚀 COMPONENTE INTERNO (dentro de ThemeProvider)
// ============================================================
function AppInterna() {
  console.log('🟩 [App] Componente App renderizó');

  // ============================================================
  // 🎨 TEMA (claro/oscuro/sistema)
  // ============================================================
  const { tema, esOscuro } = useTema();

  // ============================================================
  // 🎨 CARGA DE FUENTES PERSONALIZADAS
  // ============================================================
  const [fontsLoaded, fontError] = useFonts({
    'Simpsonfont': require('./assets/fonts/Simpsonfont.ttf'),
  });

  if (fontError) {
    console.warn('⚠️ Error cargando Simpsonfont:', fontError);
  }

  // ============================================================
  // 🎬 ESTADOS DE ARRANQUE
  // ============================================================
  const [splashTerminado, setSplashTerminado] = useState(false);
  const [tiempoMinimoCumplido, setTiempoMinimoCumplido] = useState(false);

  // ============================================================
  // 📦 STORES GLOBALES
  // ============================================================
  const {
    sesion,
    cargando,
    esAdministrador,
    esRepartidor,
    inicializarSesion,
    perfil
  } = tiendaAutenticacion();

  const { cargarCarrito } = tiendaCarrito();

  // ============================================================
  // 🔗 REFERENCIA DE NAVEGACIÓN
  // ============================================================
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ============================================================
  // ⏱️ REFS DE TIMERS
  // ============================================================
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yaOcultoSplashNativo = useRef(false);
  const yaReseteoPorLogout = useRef(false);

  // ============================================================
  // 🎨 TEMAS DE NAVEGACIÓN Y PAPER
  // ============================================================
  const themeAppKrusty = esOscuro
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: tema.colors.fondo,
        card: tema.colors.surface,
        text: tema.colors.text,
        border: tema.colors.border,
        primary: tema.colors.accent,
        notification: tema.colors.accent,
      },
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: tema.colors.fondo,
        card: tema.colors.surface,
        text: tema.colors.text,
        border: tema.colors.border,
        primary: tema.colors.accent,
        notification: tema.colors.accent,
      },
    };

  const paperThemeKrusty = esOscuro
    ? {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        primary: tema.colors.accent,
        onPrimary: '#FFFFFF',
        primaryContainer: '#4A1A1A',
        onPrimaryContainer: '#FFDAD6',
        secondary: tema.colors.accentSecondary,
        onSecondary: '#1A1A1A',
        secondaryContainer: '#4A3A00',
        onSecondaryContainer: '#FFE082',
        background: tema.colors.fondo,
        onBackground: tema.colors.text,
        surface: tema.colors.surface,
        onSurface: tema.colors.text,
        surfaceVariant: tema.colors.surfaceHover,
        onSurfaceVariant: tema.colors.textSecondary,
        outline: tema.colors.border,
        outlineVariant: tema.colors.borderLight,
        error: tema.colors.danger,
        onError: '#FFFFFF',
        errorContainer: '#4A1A1A',
        onErrorContainer: '#FFDAD6',
      },
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: tema.colors.accent,
        onPrimary: '#FFFFFF',
        primaryContainer: '#FFE5E5',
        onPrimaryContainer: '#B71C1C',
        secondary: tema.colors.accentSecondary,
        onSecondary: '#1A1A1A',
        secondaryContainer: '#FFF6CC',
        onSecondaryContainer: '#7A5C00',
        background: tema.colors.fondo,
        onBackground: tema.colors.text,
        surface: tema.colors.surface,
        onSurface: tema.colors.text,
        surfaceVariant: tema.colors.surfaceHover,
        onSurfaceVariant: tema.colors.textSecondary,
        outline: tema.colors.border,
        outlineVariant: tema.colors.borderLight,
        error: tema.colors.danger,
        onError: '#FFFFFF',
        errorContainer: '#FFE5E5',
        onErrorContainer: '#B71C1C',
      },
    };

  // ============================================================
  // ⏱️ TIMER MÍNIMO DEL SPLASH
  // ============================================================
  useEffect(() => {
    minTimerRef.current = setTimeout(() => {
      console.log('⏱️ [App] Timer mínimo cumplido');
      setTiempoMinimoCumplido(true);
    }, SPLASH_MIN_DURATION);

    return () => {
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, []);

  // ============================================================
  // ⏱️ TIMER MÁXIMO DEL SPLASH
  // ============================================================
  useEffect(() => {
    maxTimerRef.current = setTimeout(() => {
      setSplashTerminado((prev) => {
        if (!prev) {
          console.warn('⚠️ [App] Splash excedió el tiempo máximo, forzando salida');
          return true;
        }
        return prev;
      });
    }, SPLASH_MAX_DURATION);

    return () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  // ============================================================
  // ✅ SALIR DEL SPLASH CUANDO TODO ESTÉ LISTO
  // ============================================================
  useEffect(() => {
    const appLista = (fontsLoaded || fontError) && !cargando;
    const puedeCerrar = tiempoMinimoCumplido && appLista && !splashTerminado;

    console.log('🔍 [App] Check salir splash:', {
      tiempoMinimoCumplido,
      fontsLoaded,
      fontError: !!fontError,
      cargando,
      appLista,
      splashTerminado,
      puedeCerrar,
    });

    if (puedeCerrar) {
      console.log('✅ [App] Sale del splash (todo listo)');

      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }

      setSplashTerminado(true);
    }
  }, [tiempoMinimoCumplido, fontsLoaded, fontError, cargando, splashTerminado]);

  // ============================================================
  // ✅ OCULTAR EL SPLASH NATIVO
  // ============================================================
  useEffect(() => {
    if (yaOcultoSplashNativo.current) return;
    if (splashTerminado) return;

    yaOcultoSplashNativo.current = true;

    const timer = setTimeout(() => {
      console.log('🟨 [App] Llamando hideAsync (después de animación del logo)');
      ExpoSplashScreen.hideAsync().catch(() => { });
    }, SPLASH_LOGO_FADE_DURATION);

    return () => clearTimeout(timer);
  }, [splashTerminado]);

  // ============================================================
  // 🚀 INICIALIZACIÓN
  // ============================================================
  useEffect(() => {
    inicializarSesion();
    cargarCarrito();
  }, []);

  // ============================================================
  // 🎨 BARRA DE NAVEGACIÓN ANDROID
  // ============================================================
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const setupNavigationBar = async () => {
      try {
        const navBar = NavigationBar as any;

        if (typeof navBar.setBackgroundColorAsync === 'function') {
          await navBar.setBackgroundColorAsync(tema.colors.surface);
        }
        if (typeof navBar.setButtonStyleAsync === 'function') {
          await navBar.setButtonStyleAsync(esOscuro ? 'light' : 'dark');
        } else if (typeof navBar.setStyle === 'function') {
          await navBar.setStyle(esOscuro ? 'light' : 'dark');
        }
      } catch (error) {
        console.warn('⚠️ Error configurando barra de navegación:', error);
      }
    };

    setupNavigationBar();
  }, [tema.colors.surface, esOscuro]);

  // ============================================================
  // 🔔 CONFIGURAR NAVIGATION REF
  // ============================================================
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
      notificacionService.procesarNotificacionInicial();
    }
  }, [navigationRef.current]);

  // ============================================================
  // 🔔 ESCUCHA DE NOTIFICACIONES PUSH
  // ============================================================
  useEffect(() => {
    const { subscription, responseSubscription } = notificacionService.escucharNotificaciones();

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // ============================================================
  // 🔔 REGISTRO DEL TOKEN
  // ============================================================
  useEffect(() => {
    if (sesion && perfil?.id) {
      notificacionService.tienePermisos().then((tienePermiso) => {
        if (tienePermiso) {
          notificacionService.registrarToken(perfil.id).catch((error) => {
            console.warn('⚠️ [Notif] Error registrando token existente:', error);
          });
        }
      });
    }
  }, [sesion, perfil?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !sesion || !perfil?.id) return;

      notificacionService.tienePermisos().then((tienePermiso) => {
        if (tienePermiso) {
          notificacionService.registrarToken(perfil.id).catch((error) => {
            console.warn('⚠️ [Notif] Error verificando permiso al reanudar:', error);
          });
        }
      });
    });

    return () => subscription.remove();
  }, [sesion, perfil?.id]);

  // ============================================================
  // 🔄 HEARTBEAT DE ACTIVIDAD
  // ============================================================
  useEffect(() => {
    const heartbeat = async () => {
      if (!sesion || !perfil?.id) return;

      try {
        await notificacionService.actualizarActividad(perfil.id);
      } catch (e) {
        // Silencioso
      }
    };

    heartbeat();
  }, [sesion, perfil?.id]);

  // ============================================================
  // 🔄 REDIRECCIÓN AUTOMÁTICA AL CERRAR SESIÓN
  // ============================================================
  useEffect(() => {
    if (!sesion && !cargando && navigationRef.current && splashTerminado) {
      if (!yaReseteoPorLogout.current) {
        yaReseteoPorLogout.current = true;
        console.log('🔄 [App] Reset por logout → Bienvenida');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Bienvenida' }],
        });
      }
    }
    if (sesion) {
      yaReseteoPorLogout.current = false;
    }
  }, [sesion, cargando, splashTerminado]);

  // ============================================================
  // 🔗 MANEJAR DEEP LINKING
  // ============================================================
  useEffect(() => {
    const handleDeepLink = async (event: any) => {
      const url = event.url;
      if (!url) return;

      const navegarSeguro = (nombre: string, params?: any) => {
        setTimeout(() => {
          if (!navigationRef.current) return;

          const requiereSesion = ['CanjearCupon', 'MisCupones', 'Recompensas',
            'Checkout', 'NotificacionesUsuario', 'Seguimiento'];

          if (requiereSesion.includes(nombre) && !sesion) {
            console.log(`🔒 Deep link a ${nombre} sin sesión → redirigiendo a Login`);
            navigationRef.current.navigate('Login');
            return;
          }

          navigationRef.current.navigate(nombre as any, params);
        }, 500);
      };

      try {
        const cuponMatch = url.match(/krustyburger:\/\/cupon\/(.+)/);
        if (cuponMatch) {
          const codigo = cuponMatch[1];
          navegarSeguro('CanjearCupon', { codigo });
          return;
        }

        if (url.includes('nueva-contrasena')) {
          const hashMatch = url.match(/#access_token=([^&]+)/);
          const tokenMatch = url.match(/access_token=([^&]+)/);
          const token = hashMatch?.[1] || tokenMatch?.[1] || null;

          navegarSeguro('NuevaContrasena', token ? { token } : undefined);
        }
      } catch (error) {
        // Silencioso
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [sesion]);

  // ============================================================
  // 🎬 LÓGICA DEL SPLASH
  // ============================================================
  const appLista = (fontsLoaded || fontError) && !cargando;
  const debeMostrarSplash = !splashTerminado;

  console.log('🎬 [App] Render:', {
    debeMostrarSplash,
    splashTerminado,
    tiempoMinimoCumplido,
    appLista,
  });

  // ============================================================
  // 🚀 RENDER
  // ============================================================
  return (
    <PaperProvider theme={paperThemeKrusty}>
      <BottomSheetModalProvider>
        <View style={[styles.root, { backgroundColor: tema.colors.fondo }]}>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
            theme={themeAppKrusty}
            fallback={<View style={{ flex: 1, backgroundColor: tema.colors.fondo }} />}
          >
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
              initialRouteName={
                !sesion ? 'Bienvenida'
                  : esAdministrador ? 'PanelAdmin'
                    : esRepartidor ? 'Transmision'
                      : 'Principal'
              }
            >

              {/* 👤 USUARIO NO AUTENTICADO */}
              {!sesion ? (
                <Stack.Group>
                  <Stack.Screen name="Bienvenida" component={PantallaBienvenida} />
                  <Stack.Screen name="Login" component={PantallaLogin} />
                  <Stack.Screen name="Registro" component={PantallaRegistro} />
                  <Stack.Screen name="ResetPassword" component={PantallaResetPassword} />
                  <Stack.Screen
                    name="NuevaContrasena"
                    component={PantallaNuevaContrasena}
                    initialParams={{ token: null }}
                  />

                  <Stack.Screen name="Principal" component={PestanasCliente} />
                  <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
                  <Stack.Screen name="Ofertas" component={PantallaOfertas} options={{ headerShown: false }} />
                  <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
                  <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
                  <Stack.Screen name="Terminos" component={PantallaTerminos} options={HEADER_LEGAL_OPTIONS} />
                  <Stack.Screen name="Privacidad" component={PantallaPrivacidad} options={HEADER_LEGAL_OPTIONS} />
                </Stack.Group>

              ) : esAdministrador ? (

                // 👑 ADMINISTRADOR
                <Stack.Group>
                  <Stack.Screen name="PanelAdmin" component={PantallaPanelAdmin} />
                  <Stack.Screen name="GestionPedidos" component={PantallaGestionPedidos} />
                  <Stack.Screen name="GestionMenu" component={PantallaGestionMenu} />
                  <Stack.Screen name="GestionClientes" component={PantallaGestionClientes} />
                  <Stack.Screen name="Estadisticas" component={PantallaEstadisticas} />
                  <Stack.Screen name="GestionOfertas" component={PantallaGestionOfertas} options={HEADER_OPTIONS} />
                  <Stack.Screen name="ConfiguracionEnvios" component={PantallaConfiguracionEnvios} options={HEADER_OPTIONS} />
                  <Stack.Screen name="GestionRecompensas" component={PantallaGestionRecompensas} options={HEADER_OPTIONS} />
                  <Stack.Screen name="NotificacionesAdmin" component={PantallaNotificacionesAdmin} options={{ headerShown: false }} />
                  <Stack.Screen name="ListaCupones" component={PantallaListaCupones} options={{ headerShown: false }} />
                  <Stack.Screen name="CrearCupon" component={PantallaCrearCupon} options={{ headerShown: false }} />
                  <Stack.Screen name="EditarCupon" component={PantallaCrearCupon} options={{ headerShown: false }} />

                  {/* 🆕 NUEVA PANTALLA DE REPARTIDORES */}
                  <Stack.Screen name="Repartidores" component={PantallaRepartidores} options={{ headerShown: false }} />

                  <Stack.Screen name="Principal" component={PestanasCliente} />
                  <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
                  <Stack.Screen name="Ofertas" component={PantallaOfertas} options={{ headerShown: false }} />
                  <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
                  <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
                  <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
                  <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
                  <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
                  <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
                  <Stack.Screen name="MisCupones" component={PantallaMisCupones} options={{ headerShown: false }} />
                  <Stack.Screen name="CanjearCupon" component={PantallaCanjearCupon} options={{ headerShown: false }} />
                  <Stack.Screen name="Terminos" component={PantallaTerminos} options={HEADER_LEGAL_OPTIONS} />
                  <Stack.Screen name="Privacidad" component={PantallaPrivacidad} options={HEADER_LEGAL_OPTIONS} />
                </Stack.Group>

              ) : esRepartidor ? (

                // 🛵 REPARTIDOR
                <Stack.Group>
                  <Stack.Screen name="Transmision" component={PantallaTransmision} />
                  <Stack.Screen name="Terminos" component={PantallaTerminos} options={HEADER_LEGAL_OPTIONS} />
                  <Stack.Screen name="Privacidad" component={PantallaPrivacidad} options={HEADER_LEGAL_OPTIONS} />
                </Stack.Group>

              ) : (

                // 👤 CLIENTE AUTENTICADO
                <Stack.Group>
                  <Stack.Screen name="Principal" component={PestanasCliente} />
                  <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
                  <Stack.Screen name="Ofertas" component={PantallaOfertas} options={{ headerShown: false }} />
                  <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
                  <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
                  <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
                  <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
                  <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
                  <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
                  <Stack.Screen name="MisCupones" component={PantallaMisCupones} options={{ headerShown: false }} />
                  <Stack.Screen name="CanjearCupon" component={PantallaCanjearCupon} options={{ headerShown: false }} />
                  <Stack.Screen name="Terminos" component={PantallaTerminos} options={HEADER_LEGAL_OPTIONS} />
                  <Stack.Screen name="Privacidad" component={PantallaPrivacidad} options={HEADER_LEGAL_OPTIONS} />
                </Stack.Group>
              )}

            </Stack.Navigator>
          </NavigationContainer>

          {debeMostrarSplash && (
            <View style={StyleSheet.absoluteFill} pointerEvents="auto">
              <SplashScreen
                onFinish={() => {
                  if (tiempoMinimoCumplido && appLista) {
                    setSplashTerminado(true);
                  }
                }}
                duration={SPLASH_MAX_DURATION}
              />
            </View>
          )}
        </View>
      </BottomSheetModalProvider>
    </PaperProvider>
  );
}

// ============================================================
// 🚀 EXPORT PRINCIPAL
// ============================================================
export default Sentry.wrap(function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>

        <AppInterna />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
});

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});