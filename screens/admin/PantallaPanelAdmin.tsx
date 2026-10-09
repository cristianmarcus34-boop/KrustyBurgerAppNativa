// screens/admin/PantallaPanelAdmin.tsx - V2 MODO OSCURO + REPARTIDORES
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Dimensions, Animated, Alert, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { useColores, type PaletaTema } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

// ✅ CANAL GLOBAL PARA REUTILIZAR
let canalActivo: any = null;

// ============================================================
// 📋 TIPOS LOCALES
// ============================================================
interface MenuItem {
  id: string;
  label: string;
  sub: string;
  icono: string;
  color: string;
  navigate: string;
  show?: boolean;
}

export default function PantallaPanelAdmin(props: any) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const { cerrarSesion, perfil, esAdministrador } = tiendaAutenticacion();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ============================================================
  // ✅ CANAL DE NOTIFICACIONES EN TIEMPO REAL
  // ============================================================
  const canalInicializado = useRef(false);

  useEffect(() => {
    if (canalInicializado.current) {
      console.log('⏭️ Canal de notificaciones ya inicializado, saltando...');
      return;
    }

    if (!esAdministrador || !perfil?.id) {
      console.log('❌ No es admin o no tiene perfil');
      if (canalActivo) {
        canalActivo.unsubscribe();
        canalActivo = null;
      }
      return;
    }

    canalInicializado.current = true;

    if (canalActivo) {
      console.log('🔄 Limpiando canal anterior...');
      canalActivo.unsubscribe();
      canalActivo = null;
    }

    console.log('📡 Creando nuevo canal de notificaciones...');
    console.log('📡 Usuario ID:', perfil.id);

    canalActivo = supabase
      .channel('admin_notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones_usuarios',
          filter: `usuario_id=eq.${perfil.id}`,
        },
        (payload) => {
          console.log('🔔🔔🔔 NUEVA NOTIFICACIÓN RECIBIDA EN REALTIME 🔔🔔🔔');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));

          const data = payload.new as any;

          Alert.alert(
            data.titulo || '🔔 Nueva notificación',
            data.mensaje || 'Tenés una nueva notificación',
            [
              {
                text: 'Ver',
                onPress: () => {
                  props.navigation.navigate('NotificacionesAdmin');
                }
              },
              { text: 'Cerrar', style: 'cancel' }
            ],
            { cancelable: true }
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado del canal:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅✅✅ CANAL SUSCRIPTO CORRECTAMENTE ✅✅✅');
        }
      });

    return () => {
      console.log('🧹 Limpiando canal...');
      canalInicializado.current = false;
      if (canalActivo) {
        canalActivo.unsubscribe();
        canalActivo = null;
      }
    };
  }, [esAdministrador, perfil]);

  const confirmarCerrarSesion = useCallback(async () => {
    setMostrarModal(false);
    if (canalActivo) {
      canalActivo.unsubscribe();
      canalActivo = null;
    }
    try {
      await cerrarSesion();
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [cerrarSesion]);

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

  // ✅ Tamaños responsive
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const subtituloSize = isTablet ? 18 : isSmallPhone ? 13 : 14;
  const tarjetaPadding = isTablet ? 20 : isSmallPhone ? 14 : 16;
  const tarjetaIconSize = isTablet ? 44 : isSmallPhone ? 32 : 38;
  const tarjetaTituloSize = isTablet ? 17 : isSmallPhone ? 13 : 15;
  const tarjetaSubSize = isTablet ? 13 : isSmallPhone ? 10 : 11;
  const gap = isTablet ? 16 : isSmallPhone ? 10 : 12;
  const borderRadius = isTablet ? 20 : isSmallPhone ? 14 : 16;
  const iconContainerPadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const botonSize = isTablet ? 50 : isSmallPhone ? 40 : 44;
  const botonIconSize = isTablet ? 26 : isSmallPhone ? 18 : 22;

  // ✅ Ancho de las tarjetas (2 columnas)
  const cardWidth = (responsive.width - paddingHorizontal * 2 - gap) / 2;

  // ✅ MENU ITEMS - CON REPARTIDORES
  const menuItems: MenuItem[] = [
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      sub: 'Enviar promociones',
      icono: 'notifications-outline',
      color: colores.accentSecondary,
      navigate: 'NotificacionesAdmin'
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      sub: 'Gestionar pedidos',
      icono: 'receipt-outline',
      color: colores.accent,
      navigate: 'GestionPedidos'
    },
    {
      id: 'menu',
      label: 'Menú',
      sub: 'Editar productos',
      icono: 'restaurant-outline',
      color: colores.verde,
      navigate: 'GestionMenu'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      sub: 'Gestionar usuarios',
      icono: 'people-outline',
      color: colores.azulClaro,
      navigate: 'GestionClientes'
    },
    // 🆕 CARD REPARTIDORES
    {
      id: 'repartidores',
      label: 'Repartidores',
      sub: 'Estado y disponibilidad',
      icono: 'bicycle',
      color: colores.info,
      navigate: 'Repartidores'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      sub: 'Ventas y más',
      icono: 'bar-chart-outline',
      color: colores.accentSecondary,
      navigate: 'Estadisticas'
    },
    {
      id: 'ofertas',
      label: 'Ofertas',
      sub: 'Gestionar promociones',
      icono: 'pricetag-outline',
      color: colores.accent,
      navigate: 'GestionOfertas'
    },
    {
      id: 'hero',
      label: 'Hero Portada',
      sub: 'Imagen de inicio',
      icono: 'image-outline',   // 🆕
      color: colores.morado,    // 🆕 (usá un color que ya tengas en PaletaTema)
      navigate: 'GestionHero',  // 🆕
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      sub: 'Gestionar puntos y premios',
      icono: 'gift-outline',
      color: colores.accentSecondary,
      navigate: 'GestionRecompensas'
    },
    {
      id: 'envios',
      label: 'Envíos',
      sub: 'Tarifas y cobertura',
      icono: 'car-outline',
      color: colores.verde,
      navigate: 'ConfiguracionEnvios'
    },
    {
      id: 'cupones',
      label: 'Cupones',
      sub: 'Crear y gestionar',
      icono: 'ticket-outline',
      color: colores.morado,
      navigate: 'ListaCupones'
    },
  ];

  const handleNavigate = (item: MenuItem) => {
    props.navigation.navigate(item.navigate);
  };

  return (
    <View style={estilos.container}>
      <LinearGradient
        colors={[colores.gradientStart, colores.gradientEnd]}
        style={estilos.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scroll,
          {
            paddingHorizontal: paddingHorizontal,
            paddingTop: insets.top + (isTablet ? 30 : 20),
            paddingBottom: insets.bottom + 150,
          }
        ]}
      >
        <Animated.View style={[
          estilos.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
            marginBottom: isTablet ? 8 : 4,
          }
        ]}>
          <View>
            <Text style={[estilos.title, { fontSize: tituloSize }]}>
              Panel Admin
            </Text>
            <Text style={[estilos.subtitle, { fontSize: subtituloSize }]}>
              Gestiona tu restaurante 🍔
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMostrarModal(true)}
            style={[
              estilos.logoutButton,
              {
                width: botonSize,
                height: botonSize,
                borderRadius: botonSize / 2,
              }
            ]}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colores.accent, colores.accentLight]}
              style={[
                estilos.logoutButtonGradient,
                {
                  width: botonSize,
                  height: botonSize,
                  borderRadius: botonSize / 2,
                }
              ]}
            >
              <Ionicons name="log-out-outline" size={botonIconSize} color={colores.surface} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[
          estilos.grid,
          {
            gap: gap,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                estilos.card,
                {
                  width: cardWidth,
                  padding: tarjetaPadding,
                  borderRadius: borderRadius,
                  backgroundColor: colores.surface,
                  borderColor: colores.border,
                  shadowColor: colores.cardShadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  elevation: 3,
                }
              ]}
              onPress={() => handleNavigate(item)}
              activeOpacity={0.7}
            >
              <View style={[
                estilos.cardIconContainer,
                {
                  backgroundColor: item.color + '15',
                  borderRadius: borderRadius,
                  padding: iconContainerPadding,
                  marginBottom: 8,
                }
              ]}>
                <Ionicons name={item.icono as any} size={tarjetaIconSize} color={item.color} />
              </View>
              <Text style={[estilos.cardTitle, { fontSize: tarjetaTituloSize, color: item.color }]}>
                {item.label}
              </Text>
              <Text style={[estilos.cardSub, { fontSize: tarjetaSubSize }]}>
                {item.sub}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Tarjeta ancha: Ver Tienda */}
          <TouchableOpacity
            style={[
              estilos.wideCard,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: colores.surface,
                borderColor: colores.border,
                shadowColor: colores.cardShadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}
            onPress={() => props.navigation.navigate('Principal')}
            activeOpacity={0.7}
          >
            <View style={[
              estilos.wideCardIconContainer,
              {
                backgroundColor: colores.accentSecondary + '15',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="storefront-outline" size={tarjetaIconSize} color={colores.accentSecondary} />
            </View>
            <View style={estilos.wideCardInfo}>
              <Text style={[estilos.wideCardTitle, { fontSize: tarjetaTituloSize, color: colores.accentSecondary }]}>
                Ver Tienda
              </Text>
              <Text style={[estilos.wideCardSub, { fontSize: tarjetaSubSize }]}>
                Ir al menú como cliente
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta ancha: Cerrar Sesión */}
          <TouchableOpacity
            style={[
              estilos.wideCard,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: colores.surface,
                borderColor: colores.border,
                shadowColor: colores.cardShadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
              }
            ]}
            onPress={() => setMostrarModal(true)}
            activeOpacity={0.7}
          >
            <View style={[
              estilos.wideCardIconContainer,
              {
                backgroundColor: colores.accent + '15',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="log-out-outline" size={tarjetaIconSize} color={colores.accent} />
            </View>
            <View style={estilos.wideCardInfo}>
              <Text style={[estilos.wideCardTitle, { fontSize: tarjetaTituloSize, color: colores.accent }]}>
                Cerrar Sesión
              </Text>
              <Text style={[estilos.wideCardSub, { fontSize: tarjetaSubSize }]}>
                Salir de la cuenta
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={[
            estilos.modal,
            {
              padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
              borderRadius: isTablet ? 28 : 24,
              borderColor: colores.accent + '30',
              backgroundColor: colores.surface,
            }
          ]}>
            <Text style={[estilos.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>👔</Text>
            <Text style={[estilos.modalTitle, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              ¿Cerrar Sesión?
            </Text>
            <Text style={[estilos.modalText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              ¿Estás seguro de que quieres salir del panel de administración?
            </Text>
            <View style={estilos.modalButtons}>
              <TouchableOpacity
                style={[estilos.modalButton, estilos.modalCancel, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  borderColor: colores.border,
                }]}
                onPress={() => setMostrarModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalCancelText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalButton, estilos.modalConfirm, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  overflow: 'hidden',
                  backgroundColor: colores.accent,
                }]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={colores.surface} />
                <Text style={[estilos.modalConfirmText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    backgroundGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    scroll: {
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    subtitle: {
      color: 'rgba(255,255,255,0.85)',
      marginTop: 2,
      fontWeight: '300',
      letterSpacing: 0.5,
    },
    logoutButton: {
      overflow: 'hidden',
      elevation: 4,
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    logoutButtonGradient: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 16,
    },
    card: {
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: 0,
    },
    cardIconContainer: {
      marginBottom: 8,
    },
    cardTitle: {
      fontWeight: 'bold',
      marginTop: 4,
      textAlign: 'center',
    },
    cardSub: {
      marginTop: 2,
      textAlign: 'center',
      color: colores.textSecondary,
    },
    wideCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: 0,
    },
    wideCardIconContainer: {
      // El marginRight se aplica dinámicamente
    },
    wideCardInfo: {
      flex: 1,
      flexDirection: 'column',
    },
    wideCardTitle: {
      fontWeight: 'bold',
    },
    wideCardSub: {
      marginTop: 2,
      color: colores.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
      borderWidth: 2,
    },
    modalIcon: {
      marginBottom: 12,
    },
    modalTitle: {
      fontWeight: 'bold',
      marginBottom: 8,
      color: colores.text,
    },
    modalText: {
      textAlign: 'center',
      marginBottom: 24,
      color: colores.textSecondary,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    modalCancel: {
      backgroundColor: colores.surfaceHover,
      borderWidth: 1,
    },
    modalCancelText: {
      color: colores.textSecondary,
      fontWeight: '600',
    },
    modalConfirm: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    modalConfirmText: {
      color: colores.surface,
      fontWeight: 'bold',
    },
  });