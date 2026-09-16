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
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, StyleSheet } from 'react-native';

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

// ============================================================
// 📦 PANTALLAS - CUPONES (ADMIN)
// ============================================================
import PantallaListaCupones from './screens/admin/PantallaListaCupones';
import PantallaCrearCupon from './screens/admin/PantallaCrearCupon';

// ============================================================
// 📦 PANTALLAS - REPARTIDOR
// ============================================================
import PantallaTransmision from './screens/repartidor/PantallaTransmision';

// ============================================================
// ⏱️ CONSTANTES DE TIMING DEL SPLASH
// ============================================================
const SPLASH_MIN_DURATION = 1600;   // Mínimo 1.2s para que se vea la animación
const SPLASH_MAX_DURATION = 2300;   // Máximo 2.5s antes de forzar la salida
const SPLASH_LOGO_FADE_DURATION = 800;   // 👈 NUEVO: tiempo que tarda el logo custom en aparecer

// ============================================================
// 🎨 THEME DE NAVEGACIÓN CON FONDO BLANCO
// ============================================================
const themeAppKrusty = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

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
// 🚀 COMPONENTE PRINCIPAL DE LA APP
// ============================================================
export default function App() {
  console.log('🟩 [App] Componente App renderizó');

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

  // 👈 NUEVO: Ref para asegurar que hideAsync se llame UNA sola vez
  const yaOcultoSplashNativo = useRef(false);

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
  // ✅ OCULTAR EL SPLASH NATIVO DESPUÉS DE LA ANIMACIÓN DEL CUSTOM
  // ============================================================
  // 👈 NUEVO: Esperamos a que el logo del custom termine de aparecer
  // (SPLASH_LOGO_FADE_DURATION) antes de ocultar el splash nativo.
  // Esto evita el hueco blanco entre ambos splashes.
  //
  // El ref `yaOcultoSplashNativo` garantiza que hideAsync se llame
  // UNA sola vez, sin importar cuántas veces re-renderice App.
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
  // 🚀 INICIALIZACIÓN (sesión + carrito + navigation bar)
  // ============================================================
  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          const navBar = NavigationBar as any;

          if (typeof navBar.setBackgroundColorAsync === 'function') {
            await navBar.setBackgroundColorAsync(temaApp.fondo);
            await navBar.setButtonStyleAsync('light');
          } else if (typeof navBar.setStyle === 'function') {
            await navBar.setStyle('dark');
          }
        } catch (error) {
          console.warn('⚠️ Error configurando barra de navegación:', error);
        }
      }
    };

    setupNavigationBar();
    inicializarSesion();
    cargarCarrito();
  }, []);

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
  // 🔔 REGISTRO DE TOKEN FCM
  // ============================================================
  useEffect(() => {
    const configurarNotificaciones = async () => {
      try {
        await notificacionService.solicitarPermisos();

        if (sesion && perfil?.id) {
          await notificacionService.registrarToken(perfil.id);
        }
      } catch (error) {
        // Silencioso
      }
    };

    configurarNotificaciones();
  }, [sesion, perfil]);

  // ============================================================
  // 🔄 REDIRECCIÓN AUTOMÁTICA AL CERRAR SESIÓN
  // ============================================================
  useEffect(() => {
    if (!sesion && !cargando && navigationRef.current && splashTerminado) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Bienvenida' }],
      });
    }
  }, [sesion, cargando, splashTerminado]);

  // ============================================================
  // 🔗 MANEJAR DEEP LINKING (CUPONES Y RECUPERACIÓN)
  // ============================================================
  useEffect(() => {
    const handleDeepLink = async (event: any) => {
      const url = event.url;
      if (!url) return;

      try {
        const cuponMatch = url.match(/krustyburger:\/\/cupon\/(.+)/);
        if (cuponMatch) {
          const codigo = cuponMatch[1];
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('CanjearCupon', { codigo });
            }
          }, 500);
          return;
        }

        if (url.includes('nueva-contrasena')) {
          const hashMatch = url.match(/#access_token=([^&]+)/);
          const tokenMatch = url.match(/access_token=([^&]+)/);
          const token = hashMatch?.[1] || tokenMatch?.[1] || null;

          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('NuevaContrasena', token ? { token } : undefined);
            }
          }, 500);
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
  }, []);

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
  // 🚀 RENDER: app + splash superpuesto
  // ============================================================
  // 👈 CLAVE: La app se monta SIEMPRE debajo. El splash se superpone
  // con position: absolute. Cuando el splash termina, se desmonta SOLO
  // el splash, y la app ya está ahí (sin huecos).
  // ============================================================
  return (
    <View style={styles.root}>
      {/* ================================================== */}
      {/* 1️⃣ LA APP DE FONDO (siempre montada) */}
      {/* ================================================== */}
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        theme={themeAppKrusty}
        fallback={<View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />}
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

      {/* ================================================== */}
      {/* 2️⃣ SPLASH SUPERPUESTO (encima de la app) */}
      {/* ================================================== */}
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
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});