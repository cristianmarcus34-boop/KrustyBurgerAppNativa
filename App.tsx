// App.tsx
import './setup.js';

// ✅ FILTRO DE ERRORES DE TEXTO
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
import { ActivityIndicator, View, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Linking from 'expo-linking';

// ✅ IMPORTACIONES DE STORES Y SERVICIOS
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { notificacionService, setNavigationRef } from './services/notificacionService';

// ✅ IMPORTACIÓN DE LA BARRA INFERIOR
import BarraInferiorProfesional from './components/BarraInferiorProfesional';

// ✅ IMPORTACIÓN DE CONFIGURACIÓN CENTRALIZADA
import {
  temaApp,
  HEADER_OPTIONS,
  HEADER_LEGAL_OPTIONS
} from './config/tema';

// ✅ IMPORTACIONES DE PANTALLAS
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
import PantallaNotificacionesAdmin from './screens/admin/PantallaNotificacionesAdmin';
import PantallaTerminos from './screens/cliente/PantallaTerminos';
import PantallaPrivacidad from './screens/cliente/PantallaPrivacidad';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ CONFIGURACIÓN DE DEEP LINKING
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
    }
  }
};

// ✅ FUNCIÓN QUE RENDERIZA LA BARRA INFERIOR
const renderTabBar = (props: any) => {
  return <BarraInferiorProfesional {...props} />;
};

// ✅ PESTAÑAS DEL CLIENTE
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
      <Tab.Screen name="Carrito" component={PantallaCarrito} />
      <Tab.Screen name="Pedidos" component={PantallaPedidos} />
      <Tab.Screen name="Perfil" component={PantallaPerfil} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { sesion, cargando, esAdministrador, esRepartidor, inicializarSesion, perfil } = tiendaAutenticacion();
  const { cargarCarrito } = tiendaCarrito();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ✅ CONFIGURAR NAVIGATION REF
  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
      console.log('✅ NavigationRef conectado a notificacionService');
      notificacionService.procesarNotificacionInicial();
    }
  }, [navigationRef.current]);

  // ✅ ESCUCHA DE NOTIFICACIONES
  useEffect(() => {
    const { subscription, responseSubscription } = notificacionService.escucharNotificaciones();
    console.log('✅ Escucha de notificaciones activada');

    return () => {
      subscription.remove();
      responseSubscription.remove();
      console.log('✅ Escucha de notificaciones desactivada');
    };
  }, []);

  // ✅ REGISTRO DE TOKEN
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

  // ✅ NAVIGATIONBAR
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
          <Stack.Group>
            {/* ✅ PRIMERA PANTALLA - BIENVENIDA */}
            <Stack.Screen name="Bienvenida" component={PantallaBienvenida} />
            <Stack.Screen name="Login" component={PantallaLogin} />
            <Stack.Screen name="Registro" component={PantallaRegistro} />
            <Stack.Screen name="ResetPassword" component={PantallaResetPassword} />
            <Stack.Screen name="NuevaContrasena" component={PantallaNuevaContrasena} initialParams={{ token: null }} />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Ofertas" component={PantallaOfertas} options={{ headerShown: false }} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
            {/* ✅ PANTALLAS LEGALES - DENTRO DEL GRUPO */}
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
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Ofertas" component={PantallaOfertas} options={{ headerShown: false }} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
            {/* ✅ PANTALLAS LEGALES - DENTRO DEL GRUPO ADMIN */}
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
          <Stack.Group>
            <Stack.Screen name="Transmision" component={PantallaTransmision} />
            {/* ✅ PANTALLAS LEGALES - DENTRO DEL GRUPO REPARTIDOR */}
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
            {/* ✅ PANTALLAS LEGALES - DENTRO DEL GRUPO CLIENTE */}
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