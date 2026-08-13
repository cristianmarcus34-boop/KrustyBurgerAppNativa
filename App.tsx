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
import { ActivityIndicator, View, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { Colores } from './lib/colores';

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
import PantallaDashboardAdmin from './screens/admin/PantallaDashboardAdmin';
import PantallaNotificacionesAdmin from './screens/admin/PantallaNotificacionesAdmin';
import { notificacionService } from './services/notificacionService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ CONFIGURACIÓN DE DEEP LINKING
const linking = {
  prefixes: ['krustyburger://', 'https://krustyburger.com'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      NuevaContrasena: 'nueva-contrasena',
      Login: 'login',
      Registro: 'registro',
      Bienvenida: 'bienvenida',
      Principal: {
        screens: {
          Inicio: 'inicio',
          Menu: 'menu',
          Ofertas: 'ofertas',
          Pedidos: 'pedidos',
          Perfil: 'perfil',
        }
      }
    }
  }
};

// ✅ HEADER CONFIGURACIÓN CONSISTENTE (AHORA CON COLORES SIMPSONS)
const HEADER_OPTIONS = {
  headerStyle: {
    backgroundColor: Colores.fondoOscuro,
  },
  headerTintColor: Colores.textoClaro,
  headerTitleStyle: {
    fontWeight: 'bold' as const,
    fontSize: 18,
    color: Colores.primario, // ✅ Títulos en amarillo Simpsons
  },
  headerBackTitle: '',
  headerShadowVisible: false,
};

// ✅ ICONO CON BADGE PARA LA BARRA INFERIOR
const TabIcon = ({ focused, color, size, routeName, badge }: any) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

  if (routeName === 'Inicio') iconName = focused ? 'home' : 'home-outline';
  else if (routeName === 'Menu') iconName = focused ? 'restaurant' : 'restaurant-outline';
  else if (routeName === 'Ofertas') iconName = focused ? 'pricetag' : 'pricetag-outline';
  else if (routeName === 'Pedidos') iconName = focused ? 'receipt' : 'receipt-outline';
  else if (routeName === 'Perfil') iconName = focused ? 'person' : 'person-outline';

  return (
    <View style={estilos.iconoContainer}>
      <Ionicons name={iconName} size={size} color={color} />
      {badge && badge > 0 && routeName === 'Perfil' && (
        <View style={estilos.badgeContainer}>
          <Text style={estilos.badgeTexto}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
};

// ✅ BOTÓN PERSONALIZADO PARA LA BARRA INFERIOR
const TabBarButton = (props: any) => {
  const { children, onPress, accessibilityState } = props;
  const isFocused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      style={[
        estilos.tabButton,
        isFocused && estilos.tabButtonActivo,
      ]}
    >
      <View style={estilos.tabButtonContent}>
        {children}
        {isFocused && (
          <View style={estilos.tabIndicator}>
            <LinearGradient
              colors={Colores.gradientKrusty} // ✅ Gradiente Krusty (Rojo a Amarillo)
              style={estilos.tabIndicatorLine}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

function PestanasCliente() {
  const { cantidadTotal } = tiendaCarrito();
  const insets = useSafeAreaInsets();

  const cantidad = cantidadTotal();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          return (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              routeName={route.name}
              badge={cantidad}
            />
          );
        },
        tabBarActiveTintColor: Colores.primario, // ✅ Amarillo Simpsons
        tabBarInactiveTintColor: Colores.textoGris,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: Colores.fondoOscuro,
          borderTopWidth: 0,
          height: Platform.OS === 'android' ? 60 + insets.bottom : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 6 : insets.bottom + 6,
          paddingTop: 6,
          elevation: 20,
          shadowColor: Colores.primario,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        headerShown: false,
        tabBarButton: (props: any) => <TabBarButton {...props} />,
      })}
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

  // ✅ CONFIGURACIÓN DE NOTIFICACIONES
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

  // ✅ NAVIGATIONBAR - CORREGIDO PARA VERSIÓN ACTUAL
  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          console.log('📋 Métodos disponibles en NavigationBar:', Object.keys(NavigationBar));

          const navBar = NavigationBar as any;

          // ✅ NUEVA VERSIÓN - Usar setStyle
          if (typeof navBar.setStyle === 'function') {
            await navBar.setStyle('dark');
            console.log('✅ NavigationBar configurada con setStyle');
          } else if (typeof navBar.setBackgroundColorAsync === 'function') {
            await navBar.setBackgroundColorAsync(Colores.fondoOscuro);
            await navBar.setButtonStyleAsync('light');
            console.log('✅ NavigationBar configurada (versión Async)');
          } else if (typeof navBar.setBackgroundColor === 'function') {
            await navBar.setBackgroundColor(Colores.fondoOscuro);
            if (typeof navBar.setButtonStyle === 'function') {
              await navBar.setButtonStyle('light');
            } else if (typeof navBar.setBarStyle === 'function') {
              await navBar.setBarStyle('light');
            }
            console.log('✅ NavigationBar configurada (versión estándar)');
          } else if (typeof navBar.setNavigationBarColors === 'function') {
            await navBar.setNavigationBarColors({
              backgroundColor: Colores.fondoOscuro,
              buttonStyle: 'light',
            });
            console.log('✅ NavigationBar configurada (versión antigua)');
          } else {
            console.warn('⚠️ No se encontró ningún método compatible para NavigationBar');
            console.log('📋 Métodos disponibles:', Object.keys(navBar));
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

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep Link recibido:', url);

      if (url.includes('reset-password')) {
        setTimeout(() => {
          navigationRef.current?.navigate('NuevaContrasena');
        }, 500);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App abierta con deep link:', url);
        if (url.includes('reset-password')) {
          setTimeout(() => {
            navigationRef.current?.navigate('NuevaContrasena');
          }, 800);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colores.fondoOscuro }}>
        <ActivityIndicator size="large" color={Colores.primario} /> {/* ✅ Ahora amarillo */}
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
            <Stack.Screen name="NuevaContrasena" component={PantallaNuevaContrasena} options={{ headerShown: false }} />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
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
            <Stack.Screen name="NotificacionesAdmin" component={PantallaNotificacionesAdmin} options={{ headerShown: false }} />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={HEADER_OPTIONS} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={HEADER_OPTIONS} />
            <Stack.Screen name="DetalleOferta" component={PantallaDetalleOferta} options={{ headerShown: false }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
            <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
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
            <Stack.Screen name="NotificacionesUsuario" component={PantallaNotificacionesUsuario} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================
// 🎨 ESTILOS DE LA BARRA INFERIOR
// ============================================================
const estilos = StyleSheet.create({
  iconoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colores.secundario, // ✅ Rojo Krusty
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colores.textoOscuro,
    elevation: 3,
    shadowColor: Colores.textoOscuro,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  badgeTexto: {
    color: Colores.textoClaro,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabButtonActivo: {},
  tabButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: [{ translateX: -15 }],
    width: 30,
    height: 3,
  },
  tabIndicatorLine: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
});