import './setup.js';

// ✅ FILTRO DE ERRORES DE TEXTO
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0] || '';
  if (typeof message === 'string') {
    if (message.includes('Text strings') ||
      message.includes('Text string') ||
      message.includes('react-native-paper') ||
      message.includes('Paper') ||
      message.includes('LogBox')) {
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { Colores } from './lib/colores';

import PantallaBienvenida from './screens/PantallaBienvenida';
import PantallaLogin from './screens/auth/PantallaLogin';
import PantallaRegistro from './screens/auth/PantallaRegistro';
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
import PantallaPanelAdmin from './screens/admin/PantallaPanelAdmin';
import PantallaGestionPedidos from './screens/admin/PantallaGestionPedidos';
import PantallaGestionMenu from './screens/admin/PantallaGestionMenu';
import PantallaGestionClientes from './screens/admin/PantallaGestionClientes';
import PantallaEstadisticas from './screens/admin/PantallaEstadisticas';
import PantallaTransmision from './screens/repartidor/PantallaTransmision';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PestanasCliente() {
  const { cantidadTotal } = tiendaCarrito();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let nombreIcono: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Inicio') nombreIcono = focused ? 'home' : 'home-outline';
          else if (route.name === 'Menu') nombreIcono = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Ofertas') nombreIcono = focused ? 'pricetag' : 'pricetag-outline';
          else if (route.name === 'Pedidos') nombreIcono = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Mas') nombreIcono = focused ? 'person' : 'person-outline';
          return <Ionicons name={nombreIcono} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colores.secundario,
        tabBarInactiveTintColor: Colores.textoGris,
        tabBarStyle: {
          backgroundColor: Colores.fondoOscuro,
          borderTopColor: '#333',
          // ✅ AGREGAR PADDING INFERIOR PARA LA BARRA DE NAVEGACIÓN DE ANDROID
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 5 : 5,
          height: Platform.OS === 'android' ? 60 + insets.bottom : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Menu" component={PantallaMenu} />
      <Tab.Screen name="Ofertas" component={PantallaOfertas} />
      <Tab.Screen name="Pedidos" component={PantallaPedidos} />
      <Tab.Screen name="Mas" component={PantallaPerfil} options={{ tabBarBadge: cantidadTotal() > 0 ? cantidadTotal() : undefined }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { sesion, cargando, esAdministrador, esRepartidor, inicializarSesion } = tiendaAutenticacion();
  const { cargarCarrito } = tiendaCarrito();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // ✅ Configurar la barra de navegación en Android
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          // @ts-ignore - Ignorar error de TypeScript
          await NavigationBar.setBackgroundColorAsync(Colores.fondoOscuro || '#1a1a1a');
          // @ts-ignore - Ignorar error de TypeScript
          await NavigationBar.setButtonStyleAsync('light');
          console.log('✅ Barra de navegación configurada correctamente');
        } catch (error) {
          console.warn('⚠️ Error configurando barra de navegación:', error);
        }
      }
    };

    setupNavigationBar();
    inicializarSesion();
    cargarCarrito();
  }, []);

  // ✅ Efecto para redirigir cuando se cierra sesión
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
        <ActivityIndicator size="large" color={Colores.secundario} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!sesion ? (
          <>
            <Stack.Screen name="Bienvenida" component={PantallaBienvenida} />
            <Stack.Screen name="Login" component={PantallaLogin} />
            <Stack.Screen name="Registro" component={PantallaRegistro} />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={{ headerShown: true, title: 'Mi Carrito', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={{ headerShown: true, title: 'Seguimiento', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={{ headerShown: true, title: 'Producto', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
          </>
        ) : esAdministrador ? (
          <>
            <Stack.Screen name="PanelAdmin" component={PantallaPanelAdmin} />
            <Stack.Screen name="GestionPedidos" component={PantallaGestionPedidos} />
            <Stack.Screen name="GestionMenu" component={PantallaGestionMenu} />
            <Stack.Screen name="GestionClientes" component={PantallaGestionClientes} />
            <Stack.Screen name="Estadisticas" component={PantallaEstadisticas} />
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={{ headerShown: true, title: 'Mi Carrito', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={{ headerShown: true, title: 'Seguimiento', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={{ headerShown: true, title: 'Producto', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
          </>
        ) : esRepartidor ? (
          <Stack.Screen name="Transmision" component={PantallaTransmision} />
        ) : (
          <>
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen name="Carrito" component={PantallaCarrito} options={{ headerShown: true, title: 'Mi Carrito', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Seguimiento" component={PantallaSeguimiento} options={{ headerShown: true, title: 'Seguimiento', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="DetalleProducto" component={PantallaDetalleProducto} options={{ headerShown: true, title: 'Producto', headerStyle: { backgroundColor: Colores.fondoOscuro }, headerTintColor: Colores.textoClaro }} />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}