// ============================================================
// 📱 App.tsx - PUNTO DE ENTRADA DE KRUSTY BURGER
// ============================================================
// Este archivo es el corazón de la app. Aquí se configura:
// 1. La carga de fuentes personalizadas
// 2. La navegación (Stack + Tabs)
// 3. El Deep Linking (cupones y recuperación de contraseña)
// 4. Las notificaciones push
// 5. La sesión del usuario
// ============================================================

import './setup.js';

// ============================================================
// 🚫 FILTRO DE ERRORES DE CONSOLA (NO CRÍTICOS)
// ============================================================
// Algunos errores de terceros (Supabase, Paper, etc.) no son
// relevantes para el desarrollo. Los filtramos para tener una
// consola más limpia.

const originalConsoleError = console.error;

console.error = (...args: any[]) => {
  const message = args[0] || '';

  if (typeof message === 'string') {
    const ignorar = [
      'rate limit',           // Supabase: límite de correos
      'email rate limit',
      'too many requests',
      'try again later',
      'Text strings',         // React Native Paper
      'Text string',
      'react-native-paper',
      'Paper',
      'LogBox'
    ];

    if (ignorar.some(texto => message.toLowerCase().includes(texto.toLowerCase()))) {
      return; // Ignorar este error
    }
  }

  originalConsoleError(...args);
};

// ============================================================
// 📦 IMPORTACIONES DE REACT Y NAVEGACIÓN
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform, Text } from 'react-native';

// ============================================================
// 📦 IMPORTACIONES DE EXPO Y LIBRERÍAS NATIVAS
// ============================================================
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';  // ✅ NUEVO: Para cargar fuentes


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
// 🏗️ CREACIÓN DE NAVEGADORES
// ============================================================
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// 🔗 CONFIGURACIÓN DE DEEP LINKING
// ============================================================
// Esto permite que la app se abra con enlaces como:
// - krustyburger://cupon/KB381L7MUA
// - krustyburger://nueva-contrasena?token=XXX
// - https://krustyburger.com.ar/canjear

const linking = {
  // ✅ Prefijos de URL que la app reconoce
  prefixes: [
    'krustyburger://',
    'https://www.krustyburger.com.ar',
    'https://krustyburger.com'
  ],

  // ✅ Configuración de rutas
  config: {
    screens: {
      // ------------------------------------------------
      // 🔐 AUTENTICACIÓN
      // ------------------------------------------------
      ResetPassword: 'reset-password',
      NuevaContrasena: {
        path: 'nueva-contrasena',
        parse: {
          token: (token: string) => token,
        },
      },
      Login: 'login',
      Registro: 'registro',
      Bienvenida: 'bienvenida',

      // ------------------------------------------------
      // 👤 CLIENTE
      // ------------------------------------------------
      Ofertas: 'ofertas',
      Terminos: 'terminos',
      Privacidad: 'privacidad',

      // ✅ Navegación por tabs
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

      // ------------------------------------------------
      // 🎫 CUPONES - CLIENTE
      // ------------------------------------------------
      MisCupones: 'mis-cupones',
      CanjearCupon: {
        path: 'cupon/:codigo',  // ✅ krustyburger://cupon/KB381L7MUA
        parse: {
          codigo: (codigo: string) => codigo,
        },
      },

      // ------------------------------------------------
      // 🎫 CUPONES - ADMIN
      // ------------------------------------------------
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
// Estas son las 5 pestañas principales del cliente:
// Inicio, Menú, Carrito, Pedidos, Perfil

function PestanasCliente() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,  // ✅ Sin header en las tabs
      }}
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

  // ============================================================
  // 🎨 CARGA DE FUENTES PERSONALIZADAS
  // ============================================================
  // Cargamos la fuente Simpsonfont desde assets/fonts/.
  // Mientras carga, mostramos un indicador.
  // Si falla, la app sigue funcionando con la fuente por defecto.

  const [fontsLoaded, fontError] = useFonts({
    'Simpsonfont': require('./assets/fonts/Simpsonfont.ttf'),
  });

  // ⚠️ Loguear error de fuente (si ocurre)
  if (fontError) {
    console.warn('⚠️ Error cargando Simpsonfont:', fontError);
  }

  // ============================================================
  // 🎬 ESTADOS LOCALES
  // ============================================================
  const [mostrarSplash, setMostrarSplash] = useState(true);

  // ============================================================
  // 📦 STORES GLOBALES
  // ============================================================
  const {
    sesion,              // Sesión activa de Supabase
    cargando,            // ¿Está cargando la sesión?
    esAdministrador,     // ¿El usuario es admin?
    esRepartidor,        // ¿El usuario es repartidor?
    inicializarSesion,   // Función para restaurar sesión
    perfil               // Perfil del usuario logueado
  } = tiendaAutenticacion();

  const { cargarCarrito } = tiendaCarrito();

  // ============================================================
  // 🔗 REFERENCIA DE NAVEGACIÓN
  // ============================================================
  // Permite navegar desde fuera de los componentes (servicios)
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ============================================================
  // 🔔 CONFIGURAR NAVIGATION REF EN EL SERVICIO DE NOTIFICACIONES
  // ============================================================
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
      console.log('✅ NavigationRef conectado a notificacionService');
      notificacionService.procesarNotificacionInicial();
    }
  }, [navigationRef.current]);

  // ============================================================
  // 🔔 ESCUCHA DE NOTIFICACIONES PUSH
  // ============================================================
  useEffect(() => {
    const {
      subscription,
      responseSubscription
    } = notificacionService.escucharNotificaciones();

    console.log('✅ Escucha de notificaciones activada');

    return () => {
      subscription.remove();
      responseSubscription.remove();
      console.log('✅ Escucha de notificaciones desactivada');
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
          console.log('✅ Token FCM registrado para usuario:', perfil.nombre_cliente);
        } else {
          console.log('ℹ️ Usuario no logueado, no se registra token');
        }

        console.log('✅ Notificaciones configuradas correctamente');
      } catch (error) {
        console.warn('⚠️ Error configurando notificaciones:', error);
      }
    };

    configurarNotificaciones();
  }, [sesion, perfil]);

  // ============================================================
  // 🎨 CONFIGURACIÓN DE LA BARRA DE NAVEGACIÓN (Android)
  // ============================================================
  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          const navBar = NavigationBar as any;

          if (typeof navBar.setBackgroundColorAsync === 'function') {
            await navBar.setBackgroundColorAsync(temaApp.fondo);
            await navBar.setButtonStyleAsync('light');
            console.log('✅ NavigationBar configurada (Async)');
          } else if (typeof navBar.setBackgroundColor === 'function') {
            await navBar.setBackgroundColor(temaApp.fondo);
            if (typeof navBar.setButtonStyle === 'function') {
              await navBar.setButtonStyle('light');
            }
            console.log('✅ NavigationBar configurada (estándar)');
          } else if (typeof navBar.setStyle === 'function') {
            await navBar.setStyle('dark');
            console.log('✅ NavigationBar configurada (setStyle)');
          } else {
            console.warn('⚠️ No se encontró método compatible para NavigationBar');
          }
        } catch (error) {
          console.warn('⚠️ Error configurando barra de navegación:', error);
        }
      }
    };

    setupNavigationBar();

    // ✅ Inicializar sesión y carrito
    inicializarSesion();
    cargarCarrito();
  }, []);

  // ============================================================
  // 🔄 REDIRECCIÓN AUTOMÁTICA POR SESIÓN
  // ============================================================
  // Si el usuario cierra sesión, lo mandamos a Bienvenida
  useEffect(() => {
    if (!sesion && !cargando && navigationRef.current) {
      console.log('🔄 Redirigiendo a login (sesión cerrada)');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Bienvenida' }],
      });
    }
  }, [sesion, cargando]);

  // ============================================================
  // 🔗 MANEJAR DEEP LINKING (CUPONES Y RECUPERACIÓN)
  // ============================================================
  // Detecta cuando la app se abre con un enlace como:
  // - krustyburger://cupon/KB381L7MUA
  // - krustyburger://nueva-contrasena?token=XXX
  useEffect(() => {
    const handleDeepLink = async (event: any) => {
      const url = event.url;
      console.log('📱 Deep link recibido:', url);

      if (!url) return;

      try {
        // ------------------------------------------------
        // 🎫 1. ENLACE DE CUPÓN
        // ------------------------------------------------
        // Formato: krustyburger://cupon/KB381L7MUA
        const cuponMatch = url.match(/krustyburger:\/\/cupon\/(.+)/);
        if (cuponMatch) {
          const codigo = cuponMatch[1];
          console.log('🎫 Código de cupón extraído:', codigo);

          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('CanjearCupon', { codigo });
              console.log('✅ Navegando a CanjearCupon con código:', codigo);
            }
          }, 500);
          return;
        }

        // ------------------------------------------------
        // 🔑 2. ENLACE DE RECUPERACIÓN DE CONTRASEÑA
        // ------------------------------------------------
        // Formato: krustyburger://nueva-contrasena#access_token=XXX&type=recovery
        if (url.includes('nueva-contrasena')) {
          console.log('🔑 Detectado enlace de recuperación de contraseña');

          // ✅ Extraer el access_token de la URL (después del #)
          const hashMatch = url.match(/#access_token=([^&]+)/);
          if (hashMatch) {
            const token = hashMatch[1];
            console.log('🔑 Token de acceso extraído:', token.substring(0, 30) + '...');
            console.log('🔑 Tipo:', url.match(/type=([^&]+)/)?.[1] || 'no especificado');

            setTimeout(() => {
              if (navigationRef.current) {
                navigationRef.current.navigate('NuevaContrasena', { token });
                console.log('✅ Navegando a NuevaContrasena con token');
              }
            }, 500);
            return;
          }

          // ✅ Fallback: buscar en la URL completa
          const tokenMatch = url.match(/access_token=([^&]+)/);
          if (tokenMatch) {
            const token = tokenMatch[1];
            console.log('🔑 Token extraído (fallback):', token.substring(0, 30) + '...');

            setTimeout(() => {
              if (navigationRef.current) {
                navigationRef.current.navigate('NuevaContrasena', { token });
                console.log('✅ Navegando a NuevaContrasena con token (fallback)');
              }
            }, 500);
            return;
          }

          // ✅ Si no hay token, navegar de todas formas
          console.log('⚠️ No se encontró token, navegando a NuevaContrasena sin token');
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('NuevaContrasena');
              console.log('✅ Navegando a NuevaContrasena sin token');
            }
          }, 500);
        }

      } catch (error) {
        console.error('❌ Error manejando deep link:', error);
      }
    };

    // ✅ Escuchar deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // ✅ Verificar si la app fue abierta con un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📱 Deep link inicial:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ============================================================
  // ⏳ PANTALLA DE CARGA DE FUENTES
  // ============================================================
  // Mientras carga la fuente, mostramos un indicador
  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: temaApp.fondo
        }}
      >
        <ActivityIndicator
          size="large"
          color={temaApp.secundario}
        />
      </View>
    );
  }

  // ============================================================
  // 🎬 SPLASH SCREEN
  // ============================================================
  if (mostrarSplash) {
    return (
      <SplashScreen
        onFinish={() => setMostrarSplash(false)}
        duration={4000}
      />
    );
  }

  // ============================================================
  // ⏳ PANTALLA DE CARGA DE SESIÓN
  // ============================================================
  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: temaApp.fondo
        }}
      >
        <ActivityIndicator
          size="large"
          color={temaApp.secundario}
        />
      </View>
    );
  }

  // ============================================================
  // 🚀 APP PRINCIPAL
  // ============================================================
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      fallback={<ActivityIndicator size="large" color={temaApp.secundario} />}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >

        {/* ================================================== */}
        {/* 👤 USUARIO NO AUTENTICADO */}
        {/* ================================================== */}
        {/* Este grupo se muestra cuando NO hay sesión activa */}
        {!sesion ? (

          <Stack.Group>

            {/* ✅ AUTENTICACIÓN */}
            <Stack.Screen
              name="Bienvenida"
              component={PantallaBienvenida}
            />

            <Stack.Screen
              name="Login"
              component={PantallaLogin}
            />

            <Stack.Screen
              name="Registro"
              component={PantallaRegistro}
            />

            <Stack.Screen
              name="ResetPassword"
              component={PantallaResetPassword}
            />

            <Stack.Screen
              name="NuevaContrasena"
              component={PantallaNuevaContrasena}
              initialParams={{
                token: null
              }}
            />

            {/* ✅ CLIENTE */}
            <Stack.Screen
              name="Principal"
              component={PestanasCliente}
            />

            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="Ofertas"
              component={PantallaOfertas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Seguimiento"
              component={PantallaSeguimiento}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleProducto"
              component={PantallaDetalleProducto}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Recompensas"
              component={PantallaRecompensas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Checkout"
              component={PantallaCheckout}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS DE CUPONES - CLIENTE */}
            <Stack.Screen
              name="MisCupones"
              component={PantallaMisCupones}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="CanjearCupon"
              component={PantallaCanjearCupon}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS LEGALES */}
            <Stack.Screen
              name="Terminos"
              component={PantallaTerminos}
              options={HEADER_LEGAL_OPTIONS}
            />

            <Stack.Screen
              name="Privacidad"
              component={PantallaPrivacidad}
              options={HEADER_LEGAL_OPTIONS}
            />

          </Stack.Group>

        ) : esAdministrador ? (

          // ==================================================
          // 👑 ADMINISTRADOR
          // ==================================================
          // Este grupo se muestra cuando el usuario es admin
          <Stack.Group>

            <Stack.Screen
              name="PanelAdmin"
              component={PantallaPanelAdmin}
            />

            <Stack.Screen
              name="GestionPedidos"
              component={PantallaGestionPedidos}
            />

            <Stack.Screen
              name="GestionMenu"
              component={PantallaGestionMenu}
            />

            <Stack.Screen
              name="GestionClientes"
              component={PantallaGestionClientes}
            />

            <Stack.Screen
              name="Estadisticas"
              component={PantallaEstadisticas}
            />

            <Stack.Screen
              name="GestionOfertas"
              component={PantallaGestionOfertas}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="ConfiguracionEnvios"
              component={PantallaConfiguracionEnvios}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="GestionRecompensas"
              component={PantallaGestionRecompensas}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="NotificacionesAdmin"
              component={PantallaNotificacionesAdmin}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS DE CUPONES - ADMIN */}
            <Stack.Screen
              name="ListaCupones"
              component={PantallaListaCupones}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="CrearCupon"
              component={PantallaCrearCupon}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="EditarCupon"
              component={PantallaCrearCupon}
              options={{ headerShown: false }}
            />

            {/* ✅ CLIENTE (admin también puede ver) */}
            <Stack.Screen
              name="Principal"
              component={PestanasCliente}
            />

            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="Ofertas"
              component={PantallaOfertas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Seguimiento"
              component={PantallaSeguimiento}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleProducto"
              component={PantallaDetalleProducto}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Recompensas"
              component={PantallaRecompensas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Checkout"
              component={PantallaCheckout}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="MisCupones"
              component={PantallaMisCupones}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="CanjearCupon"
              component={PantallaCanjearCupon}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS LEGALES */}
            <Stack.Screen
              name="Terminos"
              component={PantallaTerminos}
              options={HEADER_LEGAL_OPTIONS}
            />

            <Stack.Screen
              name="Privacidad"
              component={PantallaPrivacidad}
              options={HEADER_LEGAL_OPTIONS}
            />

          </Stack.Group>

        ) : esRepartidor ? (

          // ==================================================
          // 🛵 REPARTIDOR
          // ==================================================
          // Este grupo se muestra cuando el usuario es repartidor
          <Stack.Group>

            <Stack.Screen
              name="Transmision"
              component={PantallaTransmision}
            />

            {/* ✅ PANTALLAS LEGALES */}
            <Stack.Screen
              name="Terminos"
              component={PantallaTerminos}
              options={HEADER_LEGAL_OPTIONS}
            />

            <Stack.Screen
              name="Privacidad"
              component={PantallaPrivacidad}
              options={HEADER_LEGAL_OPTIONS}
            />

          </Stack.Group>

        ) : (

          // ==================================================
          // 👤 CLIENTE AUTENTICADO
          // ==================================================
          // Este grupo se muestra cuando el usuario es cliente
          <Stack.Group>

            <Stack.Screen
              name="Principal"
              component={PestanasCliente}
            />

            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="Ofertas"
              component={PantallaOfertas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Seguimiento"
              component={PantallaSeguimiento}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleProducto"
              component={PantallaDetalleProducto}
              options={HEADER_OPTIONS}
            />

            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Recompensas"
              component={PantallaRecompensas}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Checkout"
              component={PantallaCheckout}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS DE CUPONES - CLIENTE */}
            <Stack.Screen
              name="MisCupones"
              component={PantallaMisCupones}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="CanjearCupon"
              component={PantallaCanjearCupon}
              options={{ headerShown: false }}
            />

            {/* ✅ PANTALLAS LEGALES */}
            <Stack.Screen
              name="Terminos"
              component={PantallaTerminos}
              options={HEADER_LEGAL_OPTIONS}
            />

            <Stack.Screen
              name="Privacidad"
              component={PantallaPrivacidad}
              options={HEADER_LEGAL_OPTIONS}
            />

          </Stack.Group>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}