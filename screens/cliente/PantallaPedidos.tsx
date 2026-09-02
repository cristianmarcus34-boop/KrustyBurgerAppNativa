// screens/cliente/PantallaPedidos.tsx - VERSIÓN CORREGIDA
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { Pedido } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentSecondary: '#F5C518',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
    verde: '#43A047',
    pendiente: '#FF9800',
    confirmado: '#2196F3',
    preparando: '#9C27B0',
    listo: '#4CAF50',
    enCamino: '#FF5722',
    entregado: '#4CAF50',
    cancelado: '#F44336',
  },
};

const ESTADOS_CONFIG: Record<string, { label: string; icono: keyof typeof Ionicons.glyphMap; color: string }> = {
  pendiente: { label: 'Pendiente', icono: 'time-outline', color: '#FF9800' },
  confirmado: { label: 'Confirmado', icono: 'checkmark-circle-outline', color: '#2196F3' },
  preparando: { label: 'Preparando', icono: 'flame-outline', color: '#9C27B0' },
  listo: { label: 'Listo', icono: 'bag-check-outline', color: '#4CAF50' },
  en_camino: { label: 'En camino', icono: 'bicycle-outline', color: '#FF5722' },
  entregado: { label: 'Entregado', icono: 'home-outline', color: '#4CAF50' },
  cancelado: { label: 'Cancelado', icono: 'close-circle-outline', color: '#F44336' },
};

export default function PantallaPedidos(props: any) {
  const { pedidos, cargando, cargarPedidosUsuario } = tiendaPedidos();
  const { perfil } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const [refrescando, setRefrescando] = useState(false);
  const { width } = useWindowDimensions();

  // ✅ Detectar tamaño de pantalla
  const isTablet = width >= 768;
  const isSmall = width < 375;

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

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_CONFIG[estado] || ESTADOS_CONFIG.pendiente;
  };

  // ✅ Tamaños responsivos
  const paddingHorizontal = isTablet ? 40 : isSmall ? 12 : 16;
  const tituloSize = isTablet ? 34 : isSmall ? 22 : 28;
  const tarjetaPadding = isTablet ? 20 : isSmall ? 12 : 16;
  const pedidoIdSize = isTablet ? 18 : isSmall ? 13 : 16;
  const totalSize = isTablet ? 26 : isSmall ? 17 : 22;
  const estadoTextSize = isTablet ? 13 : isSmall ? 9 : 11;
  const infoEnvioSize = isTablet ? 13 : isSmall ? 9 : 11;
  const iconSize = isTablet ? 28 : isSmall ? 16 : 22;

  // ✅ RenderItem - AHORA CON ESTILOS DIRECTOS (sin Animated para evitar problemas)
  const renderPedido = useCallback(({ item, index }: { item: Pedido; index: number }) => {
    const estado = item.estado || 'pendiente';
    const estadoInfo = getEstadoInfo(estado);
    const mostrarInfoEnvio = item.distancia_km !== undefined && item.distancia_km !== null;

    return (
      <TouchableOpacity
        key={item.id?.toString() || index.toString()}
        style={[
          styles.card,
          {
            padding: tarjetaPadding,
            borderRadius: isTablet ? 18 : isSmall ? 10 : 16,
            borderColor: estadoInfo.color + '40',
            backgroundColor: DESIGN.colors.surface,
            shadowColor: 'rgba(0,0,0,0.06)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: 12, // ✅ Espacio entre tarjetas
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
                padding: isTablet ? 10 : isSmall ? 5 : 8,
                borderRadius: isTablet ? 14 : isSmall ? 8 : 10,
              }
            ]}>
              <Ionicons name={estadoInfo.icono} size={iconSize} color={estadoInfo.color} />
            </View>
            <View style={styles.pedidoTexto}>
              <Text style={[styles.pedidoId, { fontSize: pedidoIdSize, color: DESIGN.colors.text }]}>
                Pedido #{item.id}
              </Text>
              <Text style={[styles.fecha, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
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
              paddingHorizontal: isTablet ? 14 : isSmall ? 6 : 10,
              paddingVertical: isTablet ? 6 : isSmall ? 3 : 5,
              borderRadius: isTablet ? 14 : isSmall ? 6 : 10,
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

        {/* ✅ DETALLES Y PRECIO */}
        <View style={[styles.detalles, { borderTopColor: DESIGN.colors.border }]}>
          <View>
            <Text style={[styles.total, { fontSize: totalSize, color: DESIGN.colors.accent }]}>
              {formatearPrecio(item.total || 0)}
            </Text>
            {item.items_json && (
              <Text style={[styles.cantidadItems, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                {item.items_json.length} producto(s)
              </Text>
            )}
          </View>
          <View style={styles.accion}>
            <Text style={[styles.verDetalle, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
              Ver detalle
            </Text>
            <Ionicons name="chevron-forward" size={iconSize * 0.7} color={DESIGN.colors.textTertiary} />
          </View>
        </View>

        {/* ✅ INFORMACIÓN DE ENVÍO */}
        {mostrarInfoEnvio && (
          <View style={[
            styles.infoEnvioContainer,
            {
              marginTop: isTablet ? 10 : isSmall ? 6 : 8,
              padding: isTablet ? 14 : isSmall ? 6 : 10,
              borderRadius: isTablet ? 12 : isSmall ? 6 : 10,
              backgroundColor: DESIGN.colors.surfaceHover || '#F8F6F2',
              borderColor: DESIGN.colors.border,
              borderWidth: 1,
            }
          ]}>
            {item.distancia_km !== undefined && item.distancia_km !== null && (
              <View style={styles.infoEnvioFila}>
                <Ionicons name="navigate" size={infoEnvioSize + 2} color={DESIGN.colors.accentSecondary} />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                  📏 Distancia: {item.distancia_km.toFixed(1)} km
                </Text>
              </View>
            )}

            {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null && (
              <View style={styles.infoEnvioFila}>
                <Ionicons name="time-outline" size={infoEnvioSize + 2} color={DESIGN.colors.accentSecondary} />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                  ⏱️ Tiempo estimado: {item.tiempo_estimado} min
                </Text>
              </View>
            )}

            <View style={styles.infoEnvioFila}>
              <Ionicons name="cash" size={infoEnvioSize + 2} color={DESIGN.colors.verde} />
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

            {item.tipo_entrega && (
              <View style={styles.infoEnvioFila}>
                <Ionicons name={item.tipo_entrega === 'retiro' ? 'storefront-outline' : 'home-outline'} size={infoEnvioSize + 2} color={DESIGN.colors.textTertiary} />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DESIGN.colors.textSecondary }]}>
                  {item.tipo_entrega === 'retiro' ? '📦 Retiro en local' : '🚚 Domicilio'}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [isTablet, isSmall, tarjetaPadding, pedidoIdSize, totalSize, estadoTextSize, infoEnvioSize, iconSize]);

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
          paddingTop: insets.top + (isTablet ? 20 : isSmall ? 6 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : isSmall ? 8 : 12,
        }
      ]}>
        <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
          📋 Mis Pedidos
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.counter, { fontSize: infoEnvioSize, color: DESIGN.colors.surface + '60' }]}>
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>
      </View>

      {/* ✅ LISTA DE PEDIDOS - CON FLEX:1 PARA QUE OCUPE TODO EL ESPACIO */}
      <View style={{ flex: 1 }}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
            <Text style={[styles.loadingText, { fontSize: isTablet ? 16 : isSmall ? 12 : 14, color: DESIGN.colors.surface + '70' }]}>
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
                paddingBottom: insets.bottom + 120,
                paddingTop: isTablet ? 8 : isSmall ? 4 : 6,
              }
            ]}
            showsVerticalScrollIndicator={true}
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
                <Ionicons name="receipt-outline" size={isTablet ? 80 : isSmall ? 50 : 60} color={DESIGN.colors.surface + '20'} />
                <Text style={[styles.emptyText, { fontSize: isTablet ? 20 : isSmall ? 16 : 18, color: DESIGN.colors.surface }]}>
                  No tienes pedidos aún
                </Text>
                <Text style={[styles.emptySubText, { fontSize: isTablet ? 15 : isSmall ? 12 : 13, color: DESIGN.colors.surface + '60' }]}>
                  Tus pedidos aparecerán aquí cuando realices tu primera compra 🍔
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
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
  list: {
    flexGrow: 1,
    paddingBottom: 120, // ✅ Espacio para que no se corte el último item
  },
  card: {
    borderWidth: 1,
    marginBottom: 12, // ✅ Espacio entre tarjetas
    backgroundColor: '#FFFFFF',
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
    marginLeft: 8,
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