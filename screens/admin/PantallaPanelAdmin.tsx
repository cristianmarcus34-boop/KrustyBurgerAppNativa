// screens/admin/PantallaPanelAdmin.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Dimensions, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES
// ============================================================
const COLORS = {
  amarillo: '#F5C518',
  amarilloClaro: '#FFE066',
  amarilloOscuro: '#D4A800',
  rojo: '#E53935',
  rojoOscuro: '#B71C1C',
  verde: '#43A047',
  verdeClaro: '#66BB6A',
  blanco: '#FFFFFF',
  negro: '#0A0A0A',
  grisOscuro: '#1A1A1A',
  gris: '#333333',
  grisClaro: '#B0B0B0',
};

const { width, height } = Dimensions.get('window');

export default function PantallaPanelAdmin(props: any) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const { cerrarSesion } = tiendaAutenticacion();
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

  const confirmarCerrarSesion = useCallback(async () => {
    setMostrarModal(false);
    try {
      await cerrarSesion();
      console.log('✅ Sesión cerrada correctamente desde el store');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [cerrarSesion]);

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  // ✅ Tamaños responsive
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const subtituloSize = isTablet ? 18 : isSmallPhone ? 13 : 14;
  const tarjetaPadding = isTablet ? 24 : isSmallPhone ? 14 : 18;
  const tarjetaIconSize = isTablet ? 48 : isSmallPhone ? 32 : 40;
  const tarjetaTituloSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const tarjetaSubSize = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const gap = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const borderRadius = isTablet ? 20 : isSmallPhone ? 14 : 16;
  const iconContainerPadding = isTablet ? 14 : isSmallPhone ? 10 : 12;

  // ✅ Tamaños del botón cerrar sesión
  const botonSize = isTablet ? 50 : isSmallPhone ? 40 : 44;
  const botonIconSize = isTablet ? 26 : isSmallPhone ? 18 : 22;

  // ✅ Menú de administración
  const menuItems = [
    {
      id: 'pedidos',
      label: 'Pedidos',
      sub: 'Gestionar pedidos',
      icono: 'receipt-outline',
      color: COLORS.amarillo,
      navigate: 'GestionPedidos'
    },
    {
      id: 'menu',
      label: 'Menú',
      sub: 'Editar productos',
      icono: 'restaurant-outline',
      color: COLORS.verdeClaro,
      navigate: 'GestionMenu'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      sub: 'Gestionar usuarios',
      icono: 'people-outline',
      color: '#42A5F5',
      navigate: 'GestionClientes'
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      sub: 'Ventas y más',
      icono: 'bar-chart-outline',
      color: '#AB47BC',
      navigate: 'Estadisticas'
    },
    {
      id: 'ofertas',
      label: 'Ofertas',
      sub: 'Gestionar promociones',
      icono: 'pricetag-outline',
      color: '#FF6F00',
      navigate: 'GestionOfertas'
    },
    // 🆕 NUEVO: Configuración de envíos
    {
      id: 'envios',
      label: 'Envíos',
      sub: 'Tarifas y cobertura',
      icono: 'car-outline',
      color: '#00BCD4',
      navigate: 'ConfiguracionEnvios'
    },
  ];

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
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
            paddingBottom: insets.bottom + 40,
          }
        ]}
      >
        {/* ✅ HEADER */}
        <Animated.View style={[
          estilos.encabezado,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
            marginBottom: isTablet ? 8 : 4,
          }
        ]}>
          <View>
            <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
              Panel Admin
            </Text>
            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
              🍔 Krusty Burger
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setMostrarModal(true)}
            style={[
              estilos.botonCerrarSesion,
              {
                width: botonSize,
                height: botonSize,
                borderRadius: botonSize / 2,
              }
            ]}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.rojo, COLORS.rojoOscuro]}
              style={[
                estilos.botonCerrarSesionGradient,
                {
                  width: botonSize,
                  height: botonSize,
                  borderRadius: botonSize / 2,
                }
              ]}
            >
              <Ionicons name="log-out-outline" size={botonIconSize} color={COLORS.blanco} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ✅ GRID DE TARJETAS */}
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
                estilos.tarjeta,
                {
                  width: (width - (paddingHorizontal * 2) - gap) / 2,
                  padding: tarjetaPadding,
                  borderRadius: borderRadius,
                  backgroundColor: COLORS.negro + '50',
                  borderColor: item.color + '30',
                }
              ]}
              onPress={() => props.navigation.navigate(item.navigate)}
              activeOpacity={0.7}
            >
              <View style={[
                estilos.tarjetaIconoContainer,
                {
                  backgroundColor: item.color + '20',
                  borderRadius: borderRadius,
                  padding: iconContainerPadding,
                }
              ]}>
                <Ionicons name={item.icono as any} size={tarjetaIconSize} color={item.color} />
              </View>
              <Text style={[estilos.tarjetaTitulo, { fontSize: tarjetaTituloSize }]}>
                {item.label}
              </Text>
              <Text style={[estilos.tarjetaSub, { fontSize: tarjetaSubSize }]}>
                {item.sub}
              </Text>
            </TouchableOpacity>
          ))}

          {/* ✅ Tarjeta ancha: Ver Tienda */}
          <TouchableOpacity
            style={[
              estilos.tarjetaAncha,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: COLORS.negro + '50',
                borderColor: COLORS.amarillo + '30',
              }
            ]}
            onPress={() => props.navigation.navigate('Principal')}
            activeOpacity={0.7}
          >
            <View style={[
              estilos.tarjetaIconoContainerAncho,
              {
                backgroundColor: COLORS.amarillo + '20',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="storefront-outline" size={tarjetaIconSize} color={COLORS.amarillo} />
            </View>
            <View style={estilos.tarjetaInfoAncho}>
              <Text style={[estilos.tarjetaTitulo, { fontSize: tarjetaTituloSize, textAlign: 'left' }]}>
                Ver Tienda
              </Text>
              <Text style={[estilos.tarjetaSub, { fontSize: tarjetaSubSize, textAlign: 'left' }]}>
                Ir al menú como cliente
              </Text>
            </View>
          </TouchableOpacity>

          {/* ✅ Tarjeta ancha: Cerrar Sesión */}
          <TouchableOpacity
            style={[
              estilos.tarjetaAncha,
              {
                padding: tarjetaPadding,
                borderRadius: borderRadius,
                backgroundColor: COLORS.negro + '50',
                borderColor: COLORS.rojo + '30',
              }
            ]}
            onPress={() => setMostrarModal(true)}
            activeOpacity={0.7}
          >
            <View style={[
              estilos.tarjetaIconoContainerAncho,
              {
                backgroundColor: COLORS.rojo + '20',
                borderRadius: borderRadius,
                padding: iconContainerPadding,
                marginRight: 12,
              }
            ]}>
              <Ionicons name="log-out-outline" size={tarjetaIconSize} color={COLORS.rojo} />
            </View>
            <View style={estilos.tarjetaInfoAncho}>
              <Text style={[estilos.tarjetaTitulo, { fontSize: tarjetaTituloSize, textAlign: 'left', color: COLORS.rojo }]}>
                Cerrar Sesión
              </Text>
              <Text style={[estilos.tarjetaSub, { fontSize: tarjetaSubSize, textAlign: 'left' }]}>
                Salir de la cuenta
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={[
            estilos.modal,
            {
              padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
              borderRadius: isTablet ? 28 : 24,
              borderColor: COLORS.rojo + '40',
            }
          ]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>🚪</Text>
            <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              Cerrar Sesión
            </Text>
            <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
              ¿Estás seguro de que quieres salir?
            </Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar]}
                onPress={() => setMostrarModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.rojo, COLORS.rojoOscuro]}
                  style={estilos.modalConfirmarGradient}
                >
                  <Ionicons name="log-out-outline" size={isTablet ? 20 : 18} color={COLORS.blanco} />
                  <Text style={[estilos.modalConfirmarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                    Cerrar Sesión
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.negro,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scroll: {
    flexGrow: 1,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 1,
  },
  subtitulo: {
    color: COLORS.grisClaro,
    marginTop: 2,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  botonCerrarSesion: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.rojo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  botonCerrarSesionGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tarjeta: {
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 0,
  },
  tarjetaIconoContainer: {
    marginBottom: 8,
  },
  tarjetaAncha: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 0,
  },
  tarjetaIconoContainerAncho: {
    // El marginRight se aplica dinámicamente
  },
  tarjetaInfoAncho: {
    flex: 1,
    flexDirection: 'column',
  },
  tarjetaTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginTop: 4,
  },
  tarjetaSub: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.7,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.grisOscuro,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
  },
  modalIcono: {
    marginBottom: 12,
  },
  modalTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 8,
  },
  modalTexto: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  modalCancelar: {
    backgroundColor: COLORS.negro + '60',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  modalCancelarTexto: {
    color: COLORS.blanco,
    fontWeight: '600',
  },
  modalConfirmar: {
    overflow: 'hidden',
  },
  modalConfirmarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    height: '100%',
  },
  modalConfirmarTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
});