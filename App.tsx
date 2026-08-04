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
import { ActivityIndicator, View, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from './stores/tiendaAutenticacion';
import { tiendaCarrito } from './stores/tiendaCarrito';
import { Colores } from './lib/colores';
import CarritoFlotante from './components/CarritoFlotante';

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
import PantallaGestionOfertas from './screens/admin/PantallaGestionOfertas';
// ✅ NUEVA IMPORTACIÓN - Detalle de Oferta
import PantallaDetalleOferta from './screens/cliente/PantallaDetalleOferta';
import PantallaConfiguracionEnvios from './screens/admin/PantallaConfiguracionEnvios';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ✅ HEADER CONFIGURACIÓN CONSISTENTE
const HEADER_OPTIONS = {
  headerStyle: {
    backgroundColor: Colores.fondoOscuro,
  },
  headerTintColor: Colores.textoClaro,
  headerTitleStyle: {
    fontWeight: 'bold' as const,
    fontSize: 18,
  },
  headerBackTitle: '',
  headerShadowVisible: false,
};

// ============================================================
// 🎨 PALETA DE COLORES PARA LA BARRA
// ============================================================
const TAB_COLORS = {
  amarillo: '#F5C518',
  amarilloOscuro: '#D4A800',
  rojo: '#E53935',
  blanco: '#FFFFFF',
  negro: '#0A0A0A',
  grisClaro: '#B0B0B0',
  fondoOscuro: '#1A1A1A',
};

// ✅ ICONO CON BADGE PARA LA BARRA INFERIOR
const TabIcon = ({ focused, color, size, routeName, badge }: any) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

  if (routeName === 'Inicio') iconName = focused ? 'home' : 'home-outline';
  else if (routeName === 'Menu') iconName = focused ? 'restaurant' : 'restaurant-outline';
  else if (routeName === 'Ofertas') iconName = focused ? 'pricetag' : 'pricetag-outline';
  else if (routeName === 'Pedidos') iconName = focused ? 'receipt' : 'receipt-outline';
  else if (routeName === 'Mas') iconName = focused ? 'person' : 'person-outline';

  return (
    <View style={estilos.iconoContainer}>
      <Ionicons name={iconName} size={size} color={color} />
      {badge && badge > 0 && routeName === 'Mas' && (
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
              colors={[TAB_COLORS.amarillo, TAB_COLORS.amarilloOscuro]}
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
  const { cantidadTotal, calcularTotal } = tiendaCarrito();
  const insets = useSafeAreaInsets();
  const navigationRef = useRef<any>(null);

  const cantidad = cantidadTotal();
  const total = calcularTotal();

  return (
    <>
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
          tabBarActiveTintColor: TAB_COLORS.amarillo,
          tabBarInactiveTintColor: TAB_COLORS.grisClaro,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
            letterSpacing: 0.3,
          },
          tabBarStyle: {
            backgroundColor: TAB_COLORS.fondoOscuro,
            borderTopWidth: 0,
            height: Platform.OS === 'android' ? 60 + insets.bottom : 60 + insets.bottom,
            paddingBottom: Platform.OS === 'android' ? insets.bottom + 6 : insets.bottom + 6,
            paddingTop: 6,
            elevation: 20,
            shadowColor: TAB_COLORS.amarillo,
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
        <Tab.Screen name="Mas" component={PantallaPerfil} />
      </Tab.Navigator>



    </>
  );
}

export default function App() {
  const { sesion, cargando, esAdministrador, esRepartidor, inicializarSesion } = tiendaAutenticacion();
  const { cargarCarrito } = tiendaCarrito();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          // @ts-ignore
          if (NavigationBar.setBackgroundColorAsync) {
            // @ts-ignore
            await NavigationBar.setBackgroundColorAsync(Colores.fondoOscuro || '#1a1a1a');
            // @ts-ignore
            await NavigationBar.setButtonStyleAsync('light');
          }
          // @ts-ignore
          else if (NavigationBar.setBackgroundColor) {
            // @ts-ignore
            await NavigationBar.setBackgroundColor(Colores.fondoOscuro || '#1a1a1a');
            // @ts-ignore
            await NavigationBar.setButtonStyle('light');
          }
          // @ts-ignore
          else if (NavigationBar.setNavigationBarColors) {
            // @ts-ignore
            await NavigationBar.setNavigationBarColors({
              backgroundColor: Colores.fondoOscuro || '#1a1a1a',
              buttonStyle: 'light',
            });
          }
          // @ts-ignore
          else if (NavigationBar.setBarStyle) {
            // @ts-ignore
            await NavigationBar.setBarStyle('dark-content');
          }
          else {
            console.log('⚠️ API de NavigationBar no detectada');
            const methods = Object.keys(NavigationBar);
            console.log('📋 Métodos disponibles:', methods);
          }
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
            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
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
            {/* ✅ NUEVA RUTA - Detalle de Oferta */}
            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />
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
            <Stack.Screen name="GestionOfertas" component={PantallaGestionOfertas} options={HEADER_OPTIONS} />
            <Stack.Screen name="Principal" component={PestanasCliente} />

            <Stack.Screen
              name="ConfiguracionEnvios"
              component={PantallaConfiguracionEnvios}
              options={HEADER_OPTIONS}
            />
            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
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
            {/* ✅ NUEVA RUTA - Detalle de Oferta */}
            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
          </>
        ) : esRepartidor ? (
          <Stack.Screen name="Transmision" component={PantallaTransmision} />
        ) : (
          <>
            <Stack.Screen name="Principal" component={PestanasCliente} />
            <Stack.Screen
              name="Carrito"
              component={PantallaCarrito}
              options={HEADER_OPTIONS}
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
            {/* ✅ NUEVA RUTA - Detalle de Oferta */}
            <Stack.Screen
              name="DetalleOferta"
              component={PantallaDetalleOferta}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Recompensas" component={PantallaRecompensas} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={PantallaCheckout} options={{ headerShown: false }} />
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
    backgroundColor: TAB_COLORS.rojo,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: TAB_COLORS.negro,
    elevation: 3,
    shadowColor: TAB_COLORS.negro,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  badgeTexto: {
    color: TAB_COLORS.blanco,
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
  tabButtonActivo: {
    // Sin fondo adicional
  },
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