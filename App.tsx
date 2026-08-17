// App.tsx
import './setup.js';

// ✅ FILTRO DE ERRORES DE TEXTO - MEJORADO CON FILTRO DE RATE LIMIT
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

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { Colores } from './lib/colores';

// ✅ IMPORTACIÓN DE LA BARRA INFERIOR PROFESIONAL
import BarraInferiorProfesional from './components/BarraInferiorProfesional';

// ✅ IMPORTAR setNavigationRef DEL SERVICIO
import { notificacionService, setNavigationRef } from './services/notificacionService';

// ✅ IMPORTACIONES DE PANTALLAS EXISTENTES
import PantallaBienvenida from './screens/PantallaBienvenida';
import PantallaLogin from './screens/auth/PantallaLogin';
import PantallaRegistro from './screens/auth/PantallaRegistro';
import PantallaResetPassword from './screens/auth/PantallaResetPassword';
import PantallaNuevaContrasena from './screens/auth/PantallaNuevaContrasena';
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
import PantallaPanelAdmin from './screens/admin/PantallaPanelAdmin';
import PantallaGestionPedidos from './screens/admin/PantallaGestionPedidos';
import PantallaGestionMenu from './screens/admin/PantallaGestionMenu';
import PantallaGestionClientes from './screens/admin/PantallaGestionClientes';
import PantallaEstadisticas from './screens/admin/PantallaEstadisticas';
import PantallaTransmision from './screens/repartidor/PantallaTransmision';
import PantallaGestionOfertas from './screens/admin/PantallaGestionOfertas';
import PantallaDetalleOferta from './screens/cliente/PantallaDetalleOferta';
import PantallaConfiguracionEnvios from './screens/admin/PantallaConfiguracionEnvios';
import PantallaGestionRecompensas from './screens/admin/PantallaGestionRecompensas';
import PantallaDashboardAdmin from './screens/admin/PantallaDashboardAdmin';
import PantallaNotificacionesAdmin from './screens/admin/PantallaNotificacionesAdmin';

// ✅ IMPORTACIONES DE PANTALLAS DE CUPONES
//import PantallaCanjearCupon from './screens/cliente/PantallaCanjearCupon';
//import PantallaMisCupones from './screens/cliente/PantallaMisCupones';
//import PantallaGestionCupones from './screens/admin/PantallaGestionCupones';
//import PantallaDetalleCuponAdmin from './screens/admin/PantallaDetalleCuponAdmin';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ TEMÁTICA KRUSTY PARA LA APP
const temaApp = {
  primario: '#E53935',
  secundario: '#F5C518',
  verde: '#43A047',
  fondo: '#1A1A1A',
  texto: '#FFFFFF',
  textoGris: '#B0B0B0',
  gradiente: ['#E53935', '#F5C518'] as const,
};

// ✅ HEADER CONFIGURACIÓN
const HEADER_OPTIONS = {
  headerStyle: {
    backgroundColor: temaApp.fondo,
  },
  headerTintColor: temaApp.texto,
  headerTitleStyle: {
    fontWeight: 'bold' as const,
    fontSize: 18,
    color: temaApp.secundario,
  },
  headerBackTitle: '',
  headerShadowVisible: false,
};

// ✅ CONFIGURACIÓN DE DEEP LINKING (con soporte para cupones)
const linking = {
  prefixes: ['krustyburger://', 'https://www.krustyburger.com.ar', 'https://krustyburger.com'],
  config: {
    screens: {
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
      // ✅ Deep linking para cupones
      CanjearCupon: {
        path: 'canjear-cupon',
        parse: {
          codigo: (codigo: string) => codigo,
        },
      },
      Principal: {
        screens: {
          Inicio: 'inicio',
          Menu: 'menu',
          Ofertas: 'ofertas',
          Pedidos: 'pedidos',
          Perfil: 'perfil',
        }
      },
      NotificacionesUsuario: 'notificaciones',
      Recompensas: 'recompensas',
      Seguimiento: 'seguimiento',
      Carrito: 'carrito',
    }
  }
};

// ✅ FUNCIÓN QUE RENDERIZA LA BARRA INFERIOR
const renderTabBar = (props: any) => {
  return <BarraInferiorProfesional {...props} />;
};

function PestanasCliente() {
  const { cantidadTotal } = tiendaCarrito();
  const cantidad = cantidadTotal();

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Menu" component={PantallaMenu} />
      <Tab.Screen name="Ofertas" component={PantallaOfertas} />
      <Tab.Screen name="Pedidos" component={PantallaPedidos} />
      <Tab.Screen name="Perfil" component={PantallaPerfil} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { sesion, cargando, esAdministrador, esRepartidor, inicializarSesion, perfil } = tiendaAutenticacion();
  const { cargarCarrito } = tiendaCarrito();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ✅ CONFIGURAR NAVIGATION REF PARA NOTIFICACIONES
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
      console.log('✅ NavigationRef conectado a notificacionService');

      // ✅ Procesar notificación que abrió la app
      notificacionService.procesarNotificacionInicial();
    }
  }, [navigationRef.current]);

  // ✅ CONFIGURAR ESCUCHA DE NOTIFICACIONES
  useEffect(() => {
    const { subscription, responseSubscription } = notificacionService.escucharNotificaciones();
    console.log('✅ Escucha de notificaciones activada');

    return () => {
      subscription.remove();
      responseSubscription.remove();
      console.log('✅ Escucha de notificaciones desactivada');
    };
  }, []);

  // ✅ CONFIGURACIÓN DE NOTIFICACIONES (registro de token)
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

  // ✅ NAVIGATIONBAR - CONFIGURACIÓN ANDROID
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
    inicializarSesion();
    cargarCarrito();
  }, []);

  /*/ ✅ MANEJO DE DEEP LINKING (con soporte para cupones)
  useEffect(() => {
    const procesarDeepLink = (url: string) => {
      console.log('🔗 Procesando Deep Link:', url);

      if (!url) return;

      const tokenMatch = url.match(/token=([^&]+)/);
      const codigoMatch = url.match(/codigo=([^&]+)/);

      / ✅ Deep link para reset-password
      if (url.includes('reset-password')) {
        console.log('🔑 Deep Link de reset-password detectado');

        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          console.log('🔑 Token extraído');

          setTimeout(() => {
            navigationRef.current?.navigate('NuevaContrasena', { token });
          }, 500);
        } else {
          console.log('⚠️ No se encontró token en el deep link');
          setTimeout(() => {
            navigationRef.current?.navigate('NuevaContrasena');
          }, 500);
        }
      }

      // ✅ Deep link para cupones
      if (url.includes('canjear-cupon') || url.includes('cupon')) {
        console.log('🎫 Deep Link de cupón detectado');

        if (codigoMatch) {
          const codigo = decodeURIComponent(codigoMatch[1]);
          console.log('🎫 Código de cupón extraído:', codigo);

          setTimeout(() => {
            navigationRef.current?.navigate('CanjearCupon', { codigo });
          }, 500);
        } else {
          console.log('⚠️ No se encontró código en el deep link');
          setTimeout(() => {
            navigationRef.current?.navigate('CanjearCupon');
          }, 500);
        }
      }
    };

    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Evento de Deep Link recibido:', event.url);
      procesarDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App abierta con deep link inicial:', url);
        procesarDeepLink(url);
      } else {
        console.log('ℹ️ App abierta normalmente (sin deep link)');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);*/

  // ✅ REDIRECCIÓN POR SESIÓN
  useEffect(() => {
    if (!sesion && !cargando && navigationRef.current) {
      console.log('🔄 Redirigiendo a login (sesión cerrada)');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Bienvenida' }],
      });
    }
  }, [sesion, cargando]);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: temaApp.fondo }}>
        <ActivityIndicator size="large" color={temaApp.secundario} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!sesion ? (
          // ============================================================
          // 🔹 SECCIÓN: PANTALLAS PÚBLICAS (SIN SESIÓN)
          // ============================================================
          <>
            <Stack.Screen name="Bienvenida" component={PantallaBienvenida} />
            <Stack.Screen name="Login" component={PantallaLogin} />
            <Stack.Screen name="Registro" component={PantallaRegistro} />
            <Stack.Screen name="ResetPassword" component={PantallaResetPassword} options={{ headerShown: false }} />
            <Stack.Screen
              name="NuevaContrasena"
              component={PantallaNuevaContrasena}
              options={{ headerShown: false }}
              initialParams={{ token: null }}
            />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />
            {/* ✅ PANTALLAS DE CUPONES PARA CLIENTES */}
            {/* <Stack.Screen name="CanjearCupon" component={PantallaCanjearCupon} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="MisCupones" component={PantallaMisCupones} options={{ headerShown: false }} /> */}
          </>
        ) : esAdministrador ? (
          // ============================================================
          // 🔹 SECCIÓN: PANTALLAS DE ADMINISTRADOR
          // ============================================================
          <>
            <Stack.Screen name="PanelAdmin" component={PantallaPanelAdmin} />
            <Stack.Screen name="DashboardAdmin" component={PantallaDashboardAdmin} options={{ headerShown: false }} />
            <Stack.Screen name="GestionPedidos" component={PantallaGestionPedidos} />
            <Stack.Screen name="GestionMenu" component={PantallaGestionMenu} />
            <Stack.Screen name="GestionClientes" component={PantallaGestionClientes} />
            <Stack.Screen name="Estadisticas" component={PantallaEstadisticas} />
            <Stack.Screen name="GestionOfertas" component={PantallaGestionOfertas} options={HEADER_OPTIONS} />
            <Stack.Screen name="ConfiguracionEnvios" component={PantallaConfiguracionEnvios} options={HEADER_OPTIONS} />
            <Stack.Screen name="GestionRecompensas" component={PantallaGestionRecompensas} options={HEADER_OPTIONS} />
            <Stack.Screen
              name="NotificacionesAdmin"
              component={PantallaNotificacionesAdmin}
              options={{ headerShown: false }}
            />
            {/* ✅ PANTALLAS DE GESTIÓN DE CUPONES PARA ADMIN */}
            {/* <Stack.Screen name="GestionCupones" component={PantallaGestionCupones} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="DetalleCuponAdmin" component={PantallaDetalleCuponAdmin} options={{ headerShown: false }} /> */}
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />
            {/* ✅ PANTALLAS DE CUPONES PARA CLIENTES (también en admin) */}
            {/* <Stack.Screen name="CanjearCupon" component={PantallaCanjearCupon} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="MisCupones" component={PantallaMisCupones} options={{ headerShown: false }} /> */}
          </>
        ) : esRepartidor ? (
          // ============================================================
          // 🔹 SECCIÓN: PANTALLAS DE REPARTIDOR
          // ============================================================
          <Stack.Screen name="Transmision" component={PantallaTransmision} />
        ) : (
          // ============================================================
          // 🔹 SECCIÓN: PANTALLAS DE CLIENTE (CON SESIÓN)
          // ============================================================
          <>
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen
              name="NotificacionesUsuario"
              component={PantallaNotificacionesUsuario}
              options={{ headerShown: false }}
            />
            {/* ✅ PANTALLAS DE CUPONES PARA CLIENTES */}
            {/* <Stack.Screen name="CanjearCupon" component={PantallaCanjearCupon} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="MisCupones" component={PantallaMisCupones} options={{ headerShown: false }} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}