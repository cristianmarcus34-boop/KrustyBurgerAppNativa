// screens/cliente/PantallaPedidos.tsx - CON FORMATEADOR DE PRECIOS
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { Pedido } from '../../lib/tipos';
import { formatearPrecio, formatearPrecioConDecimales } from '../../lib/formateador'; // ✅ IMPORTAR FORMATEADOR

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
    platino: '#78909C',
    oro: '#F9A825',
    plata: '#BDBDBD',
    bronce: '#A1887F',
    pendiente: '#FF9800',
    confirmado: '#2196F3',
    preparando: '#9C27B0',
    listo: '#4CAF50',
    enCamino: '#FF5722',
    entregado: '#4CAF50',
    cancelado: '#F44336',
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

// ✅ CONFIGURACIÓN DE ESTADOS
const ESTADOS_CONFIG: Record<string, { label: string; icono: keyof typeof Ionicons.glyphMap; color: string }> = {
  pendiente: { label: 'Pendiente', icono: 'time-outline', color: DESIGN.colors.pendiente },
  confirmado: { label: 'Confirmado', icono: 'checkmark-circle-outline', color: DESIGN.colors.confirmado },
  preparando: { label: 'Preparando', icono: 'flame-outline', color: DESIGN.colors.preparando },
  listo: { label: 'Listo', icono: 'bag-check-outline', color: DESIGN.colors.listo },
  en_camino: { label: 'En camino', icono: 'bicycle-outline', color: DESIGN.colors.enCamino },
  entregado: { label: 'Entregado', icono: 'home-outline', color: DESIGN.colors.entregado },
  cancelado: { label: 'Cancelado', icono: 'close-circle-outline', color: DESIGN.colors.cancelado },
};

export default function PantallaPedidos(props: any) {
  const { pedidos, cargando, cargarPedidosUsuario } = tiendaPedidos();
  const { perfil } = tiendaAutenticacion();
  const responsive = useResponsive();
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

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
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

  // ✅ RenderItem memoizado con useCallback - USANDO FORMATEADOR
  const renderPedido = useCallback(({ item, index }: { item: Pedido; index: number }) => {
    const estado = item.estado || 'pendiente';
    const estadoInfo = getEstadoInfo(estado);
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

    const mostrarInfoEnvio = item.distancia_km !== undefined && item.distancia_km !== null;

    return (
      <Animated.View
        key={item.id?.toString() || index.toString()}
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            {
              padding: tarjetaPadding,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
              borderColor: estadoInfo.color + '40',
              backgroundColor: DESIGN.colors.surface,
              shadowColor: DESIGN.colors.cardShadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}
          onPress={() => props.navigation.navigate('Seguimiento', { pedidoId: item.id })}
          activeOpacity={0.8}
        >
          {/* ✅ ENCABEZADO */}
          <View style={styles.cardHeader}>
            <View style={styles.pedidoInfo}>
              <View style={[
                styles.iconContainer,
                {
                  backgroundColor: estadoInfo.color + '15',
                  padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                }
              ]}>
                <Ionicons name={estadoInfo.icono} size={isTablet ? 28 : isSmallPhone ? 18 : 22} color={estadoInfo.color} />
              </View>
              <View style={styles.pedidoTexto}>
                <Text style={[styles.pedidoId, { fontSize: pedidoIdSize, color: DESIGN.colors.text }]}>
                  Pedido #{item.id}
                </Text>
                <Text style={[styles.fecha, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
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
              styles.estado,
              {
                backgroundColor: estadoInfo.color + '15',
                paddingHorizontal: isTablet ? 14 : isSmallPhone ? 8 : 10,
                paddingVertical: isTablet ? 6 : isSmallPhone ? 4 : 5,
                borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                borderWidth: 1,
                borderColor: estadoInfo.color + '30',
              }
            ]}>
              <Text style={[
                styles.estadoTexto,
                {
                  fontSize: estadoTextSize,
                  color: estadoInfo.color,
                }
              ]}>
                {estadoInfo.label}
              </Text>
            </View>
          </View>

          {/* ✅ DETALLES Y PRECIO - USANDO FORMATEADOR */}
          <View style={styles.detalles}>
            <View>
              {/* ✅ USAR formatearPrecio para el total */}
              <Text style={[styles.total, { fontSize: totalSize, color: DESIGN.colors.accent }]}>
                {formatearPrecio(item.total || 0)}
              </Text>
              {item.items_json && (
                <Text style={[styles.cantidadItems, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: DESIGN.colors.textSecondary }]}>
                  {item.items_json.length} producto(s)
                </Text>
              )}
            </View>
            <View style={styles.accion}>
              <Text style={[styles.verDetalle, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                Ver detalle
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 22 : isSmallPhone ? 16 : 18} color={DESIGN.colors.textTertiary} />
            </View>
          </View>

          {/* ✅ INFORMACIÓN DE ENVÍO - USANDO FORMATEADOR */}
          {mostrarInfoEnvio && (
            <View style={[
              styles.infoEnvioContainer,
              {
                marginTop: 10,
                padding: isTablet ? 14 : isSmallPhone ? 8 : 10,
                borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                backgroundColor: DESIGN.colors.surfaceHover,
                borderColor: DESIGN.colors.border,
                borderWidth: 1,
              }
            ]}>
              {/* Distancia */}
              {item.distancia_km !== undefined && item.distancia_km !== null && (
                <View style={styles.infoEnvioFila}>
                  <Ionicons name="navigate" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={DESIGN.colors.accentSecondary} />
                  <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                    📏 Distancia: {item.distancia_km.toFixed(1)} km
                  </Text>
                </View>
              )}

              {/* Tiempo estimado */}
              {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null && (
                <View style={styles.infoEnvioFila}>
                  <Ionicons name="time-outline" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={DESIGN.colors.accentSecondary} />
                  <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                    ⏱️ Tiempo estimado: {item.tiempo_estimado} min
                  </Text>
                </View>
              )}

              {/* ✅ Costo de envío - USANDO FORMATEADOR */}
              <View style={styles.infoEnvioFila}>
                <Ionicons name="cash" size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={DESIGN.colors.verde} />
                <Text style={[
                  styles.infoEnvioTexto,
                  {
                    fontSize: infoEnvioSize,
                    color: item.costo_envio && item.costo_envio > 0 ? DESIGN.colors.verde : DESIGN.colors.textTertiary,
                  }
                ]}>
                  💰 Costo de envío: {item.costo_envio && item.costo_envio > 0 ? formatearPrecio(item.costo_envio) : 'Gratis'}
                </Text>
              </View>

              {/* Tipo de entrega */}
              {item.tipo_entrega && (
                <View style={styles.infoEnvioFila}>
                  <Ionicons name={item.tipo_entrega === 'retiro' ? 'storefront-outline' : 'home-outline'} size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={DESIGN.colors.textTertiary} />
                  <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                    {item.tipo_entrega === 'retiro' ? '📦 Retiro en local' : '🚚 Domicilio'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [pedidos, isTablet, isSmallPhone, tarjetaPadding, pedidoIdSize, totalSize, estadoTextSize, infoEnvioSize, fadeAnim, slideUpAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
          📋 Mis Pedidos
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.counter, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.surface + '60' }]}>
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>
      </View>

      {/* ✅ LISTA DE PEDIDOS */}
      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
          <Text style={[styles.loadingText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.surface + '70' }]}>
            Cargando tus pedidos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[
            styles.list,
            {
              paddingHorizontal: paddingHorizontal,
              paddingBottom: insets.bottom + 150,
              paddingTop: isTablet ? 8 : 4,
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={DESIGN.colors.accentSecondary}
              colors={[DESIGN.colors.accentSecondary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.surface + '20'} />
              <Text style={[styles.emptyText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.surface }]}>
                No tienes pedidos aún
              </Text>
              <Text style={[styles.emptySubText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.surface + '60' }]}>
                Tus pedidos aparecerán aquí cuando realices tu primera compra 🍔
              </Text>
            </View>
          }
        />
      )}
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
  // ✅ HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.surface + '10',
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counter: {
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
  loadingText: {
    fontWeight: '400',
    opacity: 0.7,
  },
  // ✅ LISTA
  list: {
    flexGrow: 1,
  },
  // ✅ TARJETA
  card: {
    marginBottom: 10,
    borderWidth: 1,
  },
  cardHeader: {
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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedidoTexto: {
    flex: 1,
  },
  pedidoId: {
    fontWeight: 'bold',
  },
  fecha: {
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
    borderTopColor: DESIGN.colors.border,
    paddingTop: 10,
  },
  total: {
    fontWeight: 'bold',
  },
  cantidadItems: {
    marginTop: 2,
    opacity: 0.5,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verDetalle: {
    fontWeight: '500',
    opacity: 0.6,
  },
  // ✅ INFORMACIÓN DE ENVÍO
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
    fontWeight: '400',
    opacity: 0.8,
  },
  // ✅ VACÍO
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});