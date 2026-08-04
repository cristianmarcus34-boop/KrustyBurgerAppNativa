// screens/cliente/PantallaPedidos.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { Pedido } from '../../lib/tipos';

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
  pendiente: '#FF9800',
  confirmado: '#2196F3',
  preparando: '#9C27B0',
  listo: '#4CAF50',
  enCamino: '#FF5722',
  entregado: '#4CAF50',
  cancelado: '#F44336',
};

const { width, height } = Dimensions.get('window');

// ✅ CONFIGURACIÓN DE ESTADOS
const ESTADOS_CONFIG: Record<string, { label: string; icono: keyof typeof Ionicons.glyphMap; color: string }> = {
  pendiente: { label: 'Pendiente', icono: 'time-outline', color: COLORS.pendiente },
  confirmado: { label: 'Confirmado', icono: 'checkmark-circle-outline', color: COLORS.confirmado },
  preparando: { label: 'Preparando', icono: 'flame-outline', color: COLORS.preparando },
  listo: { label: 'Listo', icono: 'bag-check-outline', color: COLORS.listo },
  en_camino: { label: 'En camino', icono: 'bicycle-outline', color: COLORS.enCamino },
  entregado: { label: 'Entregado', icono: 'home-outline', color: COLORS.entregado },
  cancelado: { label: 'Cancelado', icono: 'close-circle-outline', color: COLORS.cancelado },
};

export default function PantallaPedidos(props: any) {
  // ✅ SOLO USAMOS LO QUE EXISTE EN EL STORE
  const { pedidos, cargando, cargarPedidosUsuario } = tiendaPedidos();
  const { perfil } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const [refrescando, setRefrescando] = useState(false);

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (perfil) {
      cargarPedidosUsuario(perfil.id);
    }
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
  }, [perfil]);

  const manejarRefresh = async () => {
    setRefrescando(true);
    if (perfil) {
      await cargarPedidosUsuario(perfil.id);
    }
    setRefrescando(false);
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const tarjetaPadding = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const pedidoIdSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const totalSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const estadoTextSize = isTablet ? 13 : isSmallPhone ? 10 : 11;
  const infoEnvioSize = isTablet ? 13 : isSmallPhone ? 10 : 11;

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_CONFIG[estado] || ESTADOS_CONFIG.pendiente;
  };

  const renderPedido = ({ item, index }: { item: Pedido; index: number }) => {
    const estado = item.estado || 'pendiente';
    const estadoInfo = getEstadoInfo(estado);
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

    // ✅ Determinar si mostrar info de envío
    const mostrarInfoEnvio = item.distancia_km !== undefined && item.distancia_km !== null;

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <TouchableOpacity
          style={[
            estilos.tarjeta,
            {
              padding: tarjetaPadding,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
              borderColor: estadoInfo.color + '40',
            }
          ]}
          onPress={() => props.navigation.navigate('Seguimiento', { pedidoId: item.id })}
          activeOpacity={0.8}
        >
          {/* ✅ ENCABEZADO */}
          <View style={estilos.encabezadoPedido}>
            <View style={estilos.pedidoInfo}>
              <View style={[
                estilos.iconoContainer,
                {
                  backgroundColor: estadoInfo.color + '20',
                  padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                }
              ]}>
                <Ionicons name={estadoInfo.icono} size={isTablet ? 28 : isSmallPhone ? 18 : 22} color={estadoInfo.color} />
              </View>
              <View style={estilos.pedidoTexto}>
                <Text style={[estilos.pedidoId, { fontSize: pedidoIdSize }]}>
                  Pedido #{item.id}
                </Text>
                <Text style={[estilos.fecha, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                  {item.creado_en ? new Date(item.creado_en).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Sin fecha'}
                </Text>
              </View>
            </View>
            <View style={[
              estilos.estado,
              {
                backgroundColor: estadoInfo.color + '20',
                paddingHorizontal: isTablet ? 14 : isSmallPhone ? 8 : 10,
                paddingVertical: isTablet ? 6 : isSmallPhone ? 4 : 5,
                borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                borderWidth: 1,
                borderColor: estadoInfo.color + '30',
              }
            ]}>
              <Text style={[
                estilos.estadoTexto,
                {
                  fontSize: estadoTextSize,
                  color: estadoInfo.color,
                }
              ]}>
                {estadoInfo.label}
              </Text>
            </View>
          </View>

          {/* ✅ DETALLES Y PRECIO */}
          <View style={estilos.detalles}>
            <View>
              <Text style={[estilos.total, { fontSize: totalSize }]}>
                ${item.total?.toFixed(2) || '0.00'}
              </Text>
              {item.items_json && (
                <Text style={[estilos.cantidadItems, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11 }]}>
                  {item.items_json.length} producto(s)
                </Text>
              )}
            </View>
            <View style={estilos.accion}>
              <Text style={[estilos.verDetalle, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                Ver detalle
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 22 : isSmallPhone ? 16 : 18} color={COLORS.grisClaro} />
            </View>
          </View>

          {/* ✅ INFORMACIÓN DE ENVÍO (NUEVO) */}
          {mostrarInfoEnvio && (
            <View style={[
              estilos.infoEnvioContainer,
              {
                marginTop: 10,
                padding: isTablet ? 14 : isSmallPhone ? 8 : 10,
                borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                backgroundColor: COLORS.negro + '30',
                borderColor: COLORS.blanco + '8',
                borderWidth: 1,
              }
            ]}>
              {/* Distancia */}
              {item.distancia_km !== undefined && item.distancia_km !== null && (
                <View style={estilos.infoEnvioFila}>
                  <Ionicons name="navigate" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={COLORS.amarillo} />
                  <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize }]}>
                    📏 Distancia: {item.distancia_km.toFixed(1)} km
                  </Text>
                </View>
              )}

              {/* Tiempo estimado */}
              {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null && (
                <View style={estilos.infoEnvioFila}>
                  <Ionicons name="time-outline" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={COLORS.amarillo} />
                  <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize }]}>
                    ⏱️ Tiempo estimado: {item.tiempo_estimado} min
                  </Text>
                </View>
              )}

              {/* Costo de envío */}
              <View style={estilos.infoEnvioFila}>
                <Ionicons name="cash" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={COLORS.verdeClaro} />
                <Text style={[
                  estilos.infoEnvioTexto,
                  {
                    fontSize: infoEnvioSize,
                    color: item.costo_envio && item.costo_envio > 0 ? COLORS.verdeClaro : COLORS.grisClaro,
                  }
                ]}>
                  💰 Costo de envío: {item.costo_envio && item.costo_envio > 0 ? `$${item.costo_envio.toFixed(2)}` : 'Gratis'}
                </Text>
              </View>

              {/* Tipo de entrega */}
              {item.tipo_entrega && (
                <View style={estilos.infoEnvioFila}>
                  <Ionicons name={item.tipo_entrega === 'retiro' ? 'storefront-outline' : 'home-outline'} size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={COLORS.grisClaro} />
                  <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize }]}>
                    {item.tipo_entrega === 'retiro' ? '📦 Retiro en local' : '🚚 Domicilio'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        estilos.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
          📋 Mis Pedidos
        </Text>
        <View style={estilos.headerRight}>
          <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>
      </View>

      {/* ✅ LISTA DE PEDIDOS */}
      {cargando ? (
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.amarillo} />
          <Text style={[estilos.loadingTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
            Cargando tus pedidos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[
            estilos.lista,
            {
              paddingHorizontal: paddingHorizontal,
              paddingBottom: insets.bottom + 40,
              paddingTop: isTablet ? 8 : 4,
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={COLORS.amarillo}
              colors={[COLORS.amarillo]}
            />
          }
          ListEmptyComponent={
            <View style={estilos.vacioContenedor}>
              <Ionicons name="receipt-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
              <Text style={[estilos.vacio, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                No tienes pedidos aún
              </Text>
              <Text style={[estilos.vacioSub, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                Tus pedidos aparecerán aquí cuando realices tu primera compra 🍔
              </Text>
            </View>
          }
        />
      )}
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
  // ✅ HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '10',
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 1,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contador: {
    color: COLORS.grisClaro,
    fontWeight: '500',
    opacity: 0.6,
  },
  // ✅ LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTexto: {
    color: COLORS.grisClaro,
    fontWeight: '400',
    opacity: 0.7,
  },
  // ✅ LISTA
  lista: {
    flexGrow: 1,
  },
  // ✅ TARJETA
  tarjeta: {
    backgroundColor: COLORS.negro + '60',
    marginBottom: 10,
    borderWidth: 1,
  },
  encabezadoPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  pedidoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedidoTexto: {
    flex: 1,
  },
  pedidoId: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  fecha: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.6,
  },
  estado: {
    alignSelf: 'flex-start',
  },
  estadoTexto: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  detalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.blanco + '8',
    paddingTop: 10,
  },
  total: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  cantidadItems: {
    color: COLORS.grisClaro,
    marginTop: 2,
    opacity: 0.5,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verDetalle: {
    color: COLORS.grisClaro,
    fontWeight: '500',
    opacity: 0.6,
  },
  // ✅ INFORMACIÓN DE ENVÍO (NUEVO)
  infoEnvioContainer: {
    borderWidth: 1,
    gap: 4,
  },
  infoEnvioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoEnvioTexto: {
    color: COLORS.grisClaro,
    fontWeight: '400',
    opacity: 0.8,
  },
  // ✅ VACÍO
  vacioContenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  vacio: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSub: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});