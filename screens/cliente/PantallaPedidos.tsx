// screens/cliente/PantallaPedidos.tsx - CON SIMPSONFONT Y TEMA CLARO
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { Pedido } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 CONFIGURACIÓN DE ESTADOS
// ============================================================
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

  const isTablet = width >= 768;
  const isSmall = width < 375;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (perfil) {
      cargarPedidosUsuario(perfil.id);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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

  // ✅ Tamaños (Simpsonfont reducido)
  const paddingHorizontal = isTablet ? 40 : isSmall ? 12 : 16;
  const tituloSize = isTablet ? 24 : isSmall ? 17 : 20;
  const tarjetaPadding = isTablet ? 20 : isSmall ? 12 : 16;
  const pedidoIdSize = isTablet ? 15 : isSmall ? 12 : 13;
  const totalSize = isTablet ? 20 : isSmall ? 15 : 17;
  const estadoTextSize = isTablet ? 11 : isSmall ? 9 : 10;
  const infoEnvioSize = isTablet ? 12 : isSmall ? 10 : 11;
  const iconSize = isTablet ? 26 : isSmall ? 16 : 22;

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
            borderRadius: isTablet ? 18 : isSmall ? 12 : 16,
            borderColor: estadoInfo.color + '40',
            borderWidth: 1,
            backgroundColor: DISENO.colors.surface,
            ...DISENO.shadow.sm,
          }
        ]}
        onPress={() => props.navigation.navigate('Seguimiento', { pedidoId: item.id })}
        activeOpacity={0.8}
      >
        {/* ENCABEZADO */}
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
              {/* ✅ PEDIDO ID CON SIMPSONFONT */}
              <Text style={[styles.pedidoId, { fontSize: pedidoIdSize, color: DISENO.colors.text }]}>
                Pedido #{item.id}
              </Text>
              <Text style={[styles.fecha, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
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
              paddingHorizontal: isTablet ? 12 : isSmall ? 8 : 10,
              paddingVertical: isTablet ? 5 : isSmall ? 3 : 4,
              borderRadius: isTablet ? 14 : isSmall ? 8 : 10,
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

        {/* DETALLES Y PRECIO */}
        <View style={[styles.detalles, { borderTopColor: DISENO.colors.border }]}>
          <View>
            {/* ✅ TOTAL CON SIMPSONFONT */}
            <Text style={[styles.total, { fontSize: totalSize, color: DISENO.colors.accent }]}>
              {formatearPrecio(item.total || 0)}
            </Text>
            {item.items_json && (
              <Text style={[styles.cantidadItems, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
                {item.items_json.length} producto(s)
              </Text>
            )}
          </View>
          <View style={styles.accion}>
            <Text style={[styles.verDetalle, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
              Ver detalle
            </Text>
            <Ionicons name="chevron-forward" size={iconSize * 0.7} color={DISENO.colors.textTertiary} />
          </View>
        </View>

        {/* INFORMACIÓN DE ENVÍO */}
        {mostrarInfoEnvio && (
          <View style={[
            styles.infoEnvioContainer,
            {
              marginTop: isTablet ? 10 : isSmall ? 6 : 8,
              padding: isTablet ? 14 : isSmall ? 8 : 10,
              borderRadius: isTablet ? 12 : isSmall ? 8 : 10,
              backgroundColor: DISENO.colors.surfaceHover,
              borderColor: DISENO.colors.border,
              borderWidth: 1,
            }
          ]}>
            {item.distancia_km !== undefined && item.distancia_km !== null && (
              <View style={styles.infoEnvioFila}>
                <Ionicons name="navigate" size={infoEnvioSize + 2} color={DISENO.colors.accentSecondary} />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
                  📏 Distancia: {item.distancia_km.toFixed(1)} km
                </Text>
              </View>
            )}

            {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null && (
              <View style={styles.infoEnvioFila}>
                <Ionicons name="time-outline" size={infoEnvioSize + 2} color={DISENO.colors.accentSecondary} />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
                  ⏱️ Tiempo estimado: {item.tiempo_estimado} min
                </Text>
              </View>
            )}

            <View style={styles.infoEnvioFila}>
              <Ionicons name="cash" size={infoEnvioSize + 2} color={DISENO.colors.success} />
              <Text style={[
                styles.infoEnvioTexto,
                {
                  fontSize: infoEnvioSize,
                  color: item.costo_envio && item.costo_envio > 0 ? DISENO.colors.success : DISENO.colors.textTertiary,
                }
              ]}>
                💰 Costo de envío: {item.costo_envio && item.costo_envio > 0 ? formatearPrecio(item.costo_envio) : 'Gratis'}
              </Text>
            </View>

            {item.tipo_entrega && (
              <View style={styles.infoEnvioFila}>
                <Ionicons
                  name={item.tipo_entrega === 'retiro' ? 'storefront-outline' : 'home-outline'}
                  size={infoEnvioSize + 2}
                  color={DISENO.colors.textTertiary}
                />
                <Text style={[styles.infoEnvioTexto, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
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
      {/* ✅ FONDO TEMA CLARO */}
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* HEADER */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : isSmall ? 6 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : isSmall ? 8 : 12,
        }
      ]}>
        {/* ✅ TÍTULO CON SIMPSONFONT */}
        <Text style={[styles.title, { fontSize: tituloSize, color: DISENO.colors.text }]}>
          📋 Mis Pedidos
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.counter, { fontSize: infoEnvioSize, color: DISENO.colors.textSecondary }]}>
            {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>
      </View>

      {/* LISTA */}
      <View style={{ flex: 1 }}>
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DISENO.colors.accent} />
            <Text style={[styles.loadingText, {
              fontSize: isTablet ? 14 : isSmall ? 12 : 13,
              color: DISENO.colors.textSecondary,
            }]}>
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
                tintColor={DISENO.colors.accent}
                colors={[DISENO.colors.accent]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="receipt-outline"
                  size={isTablet ? 80 : isSmall ? 50 : 60}
                  color={DISENO.colors.textTertiary + '40'}
                />
                {/* ✅ EMPTY CON SIMPSONFONT */}
                <Text style={[styles.emptyText, {
                  fontSize: isTablet ? 18 : isSmall ? 15 : 16,
                  color: DISENO.colors.text,
                }]}>
                  No tienes pedidos aún
                </Text>
                <Text style={[styles.emptySubText, {
                  fontSize: isTablet ? 13 : isSmall ? 11 : 12,
                  color: DISENO.colors.textSecondary,
                }]}>
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
// 🎨 ESTILOS - TEMA CLARO CON SIMPSONFONT
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
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
  },
  // ✅ TÍTULO CON SIMPSONFONT
  title: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 1,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ✅ CONTADOR CON FUENTE REGULAR
  counter: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  // ✅ LOADING CON FUENTE REGULAR
  loadingText: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
    opacity: 0.7,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
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
  // ✅ PEDIDO ID CON SIMPSONFONT
  pedidoId: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  // ✅ FECHA CON FUENTE REGULAR
  fecha: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
    opacity: 0.6,
  },
  estado: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  // ✅ ESTADO CON FUENTE REGULAR (texto pequeño)
  estadoTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  // ✅ TOTAL CON SIMPSONFONT
  total: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  // ✅ CANTIDAD CON FUENTE REGULAR
  cantidadItems: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
    opacity: 0.6,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // ✅ VER DETALLE CON FUENTE REGULAR
  verDetalle: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    opacity: 0.7,
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
  // ✅ INFO ENVÍO CON FUENTE REGULAR
  infoEnvioTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
    opacity: 0.85,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  // ✅ EMPTY CON SIMPSONFONT
  emptyText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
  },
  // ✅ SUBTEXT CON FUENTE REGULAR
  emptySubText: {
    fontFamily: FUENTES.regular,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});