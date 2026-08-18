// screens/admin/PantallaPanelAdmin.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Dimensions, Animated, Alert, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { notificacionService } from '../../services/notificacionService';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.04)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentLight: '#FF6B6B',
    accentSecondary: '#F5C518',
    accentSecondaryLight: '#FFE135',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    rosa: '#EC407A',
    azul: '#1A237E',
    azulClaro: '#3949AB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};

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
  // ✅ CONFIGURAR NOTIFICACIONES
  // ============================================================
  const notificacionesInicializadas = useRef(false);

  useEffect(() => {
    if (notificacionesInicializadas.current) {
      console.log('⏭️ Notificaciones ya inicializadas, saltando...');
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

    notificacionesInicializadas.current = true;

    const configurarNotificaciones = async () => {
      try {
        await notificacionService.registrarToken(perfil.id);
        await notificacionService.solicitarPermisos();
        console.log('✅ Admin notificaciones configuradas');
      } catch (error) {
        console.error('❌ Error configurando notificaciones:', error);
      }
    };

    configurarNotificaciones();

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
      notificacionesInicializadas.current = false;
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

  // ✅ Tamaños responsive - MEJORADOS PARA 2 COLUMNAS
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

  // ✅ Calcular ancho de las tarjetas (2 columnas para mejor legibilidad)
  const cardWidth = (responsive.width - paddingHorizontal * 2 - gap) / 2;

  // ✅ MENU ITEMS
  const menuItems: MenuItem[] = [
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      sub: 'Enviar promociones',
      icono: 'notifications-outline',
      color: DESIGN.colors.accentSecondary,
      navigate: 'NotificacionesAdmin'
    },

    {
      id: 'pedidos',
      label: 'Pedidos',
      sub: 'Gestionar pedidos',
      icono: 'receipt-outline',
      color: DESIGN.colors.accent,
      navigate: 'GestionPedidos'
    },
    {
      id: 'menu',
      label: 'Menú',
      sub: 'Editar productos',
      icono: 'restaurant-outline',
      color: DESIGN.colors.verde,
      navigate: 'GestionMenu'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      sub: 'Gestionar usuarios',
      icono: 'people-outline',
      color: DESIGN.colors.azulClaro,
      navigate: 'GestionClientes'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      sub: 'Ventas y más',
      icono: 'bar-chart-outline',
      color: DESIGN.colors.accentSecondary,
      navigate: 'Estadisticas'
    },
    {
      id: 'ofertas',
      label: 'Ofertas',
      sub: 'Gestionar promociones',
      icono: 'pricetag-outline',
      color: DESIGN.colors.accent,
      navigate: 'GestionOfertas'
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      sub: 'Gestionar puntos y premios',
      icono: 'gift-outline',
      color: DESIGN.colors.accentSecondary,
      navigate: 'GestionRecompensas'
    },
    {
      id: 'envios',
      label: 'Envíos',
      sub: 'Tarifas y cobertura',
      icono: 'car-outline',
      color: DESIGN.colors.verde,
      navigate: 'ConfiguracionEnvios'
    },
  ];

  // ✅ Función de navegación personalizada
  const handleNavigate = (item: MenuItem) => {
    props.navigation.navigate(item.navigate);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: paddingHorizontal,
            paddingTop: insets.top + (isTablet ? 30 : 20),
            paddingBottom: insets.bottom + 150,
          }
        ]}
      >
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
            marginBottom: isTablet ? 8 : 4,
          }
        ]}>
          <View>
            <Text style={[styles.title, { fontSize: tituloSize }]}>
              Panel Admin
            </Text>
            <Text style={[styles.subtitle, { fontSize: subtituloSize }]}>
              Gestiona tu restaurante 🍔
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMostrarModal(true)}
            style={[
              styles.logoutButton,
              {
                width: botonSize,
                height: botonSize,
                borderRadius: botonSize / 2,
              }
            ]}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[DESIGN.colors.accent, DESIGN.colors.accentLight]}
              style={[
                styles.logoutButtonGradient,
                {
                  width: botonSize,
                  height: botonSize,
                  borderRadius: botonSize / 2,
                }
              ]}
            >
              <Ionicons name="log-out-outline" size={botonIconSize} color={DESIGN.colors.surface} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[
          styles.grid,
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
                styles.card,
                {
                  width: cardWidth,
                  padding: tarjetaPadding,
                  borderRadius: borderRadius,
                  backgroundColor: DESIGN.colors.surface,
                  borderColor: DESIGN.colors.border,
                  shadowColor: DESIGN.colors.cardShadow,
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
                styles.cardIconContainer,
                {
                  backgroundColor: item.color + '15',
                  borderRadius: borderRadius,
                  padding: iconContainerPadding,
                  marginBottom: 8,
                }
              ]}>
                <Ionicons name={item.icono as any} size={tarjetaIconSize} color={item.color} />
              </View>
              <Text style={[styles.cardTitle, { fontSize: tarjetaTituloSize, color: item.color }]}>
                {item.label}
              </Text>
              <Text style={[styles.cardSub, { fontSize: tarjetaSubSize }]}>
                {item.sub}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Tarjeta ancha: Ver Tienda */}
          <TouchableOpacity
            style={[
              styles.wideCard,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: DESIGN.colors.surface,
                borderColor: DESIGN.colors.border,
                shadowColor: DESIGN.colors.cardShadow,
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
              styles.wideCardIconContainer,
              {
                backgroundColor: DESIGN.colors.accentSecondary + '15',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="storefront-outline" size={tarjetaIconSize} color={DESIGN.colors.accentSecondary} />
            </View>
            <View style={styles.wideCardInfo}>
              <Text style={[styles.wideCardTitle, { fontSize: tarjetaTituloSize, color: DESIGN.colors.accentSecondary }]}>
                Ver Tienda
              </Text>
              <Text style={[styles.wideCardSub, { fontSize: tarjetaSubSize }]}>
                Ir al menú como cliente
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta ancha: Cerrar Sesión */}
          <TouchableOpacity
            style={[
              styles.wideCard,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: DESIGN.colors.surface,
                borderColor: DESIGN.colors.border,
                shadowColor: DESIGN.colors.cardShadow,
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
              styles.wideCardIconContainer,
              {
                backgroundColor: DESIGN.colors.accent + '15',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="log-out-outline" size={tarjetaIconSize} color={DESIGN.colors.accent} />
            </View>
            <View style={styles.wideCardInfo}>
              <Text style={[styles.wideCardTitle, { fontSize: tarjetaTituloSize, color: DESIGN.colors.accent }]}>
                Cerrar Sesión
              </Text>
              <Text style={[styles.wideCardSub, { fontSize: tarjetaSubSize }]}>
                Salir de la cuenta
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modal,
            {
              padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
              borderRadius: isTablet ? 28 : 24,
              borderColor: DESIGN.colors.accent + '30',
              backgroundColor: DESIGN.colors.surface,
            }
          ]}>
            <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>👔</Text>
            <Text style={[styles.modalTitle, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              ¿Cerrar Sesión?
            </Text>
            <Text style={[styles.modalText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              ¿Estás seguro de que quieres salir del panel de administración?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  borderColor: DESIGN.colors.border,
                }]}
                onPress={() => setMostrarModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  overflow: 'hidden',
                  backgroundColor: DESIGN.colors.accent,
                }]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.surface} />
                <Text style={[styles.modalConfirmText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
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
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
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
    color: DESIGN.colors.surface,
    letterSpacing: 1,
  },
  subtitle: {
    color: DESIGN.colors.surface + '70',
    marginTop: 2,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  logoutButton: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: DESIGN.colors.accent,
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
    color: DESIGN.colors.textSecondary,
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
    color: DESIGN.colors.textSecondary,
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
    color: DESIGN.colors.text,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 24,
    color: DESIGN.colors.textSecondary,
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
    backgroundColor: DESIGN.colors.surfaceHover,
    borderWidth: 1,
  },
  modalCancelText: {
    color: DESIGN.colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    color: DESIGN.colors.surface,
    fontWeight: 'bold',
  },
});