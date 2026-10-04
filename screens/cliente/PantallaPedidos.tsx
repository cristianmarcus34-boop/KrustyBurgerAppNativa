// screens/cliente/PantallaPedidos.tsx - V4 (Modo oscuro + Header fijo + Scroll debajo)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TouchableRipple } from 'react-native-paper';
import Animated2, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { Pedido } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 CONFIGURACIÓN DE ESTADOS (colores semánticos)
// ============================================================
const ESTADOS_CONFIG: Record<
  string,
  {
    label: string;
    icono: keyof typeof Ionicons.glyphMap;
    color: string;
    progreso: number;
  }
> = {
  pendiente: { label: 'Pendiente', icono: 'time-outline', color: '#FF9800', progreso: 1 },
  confirmado: { label: 'Confirmado', icono: 'checkmark-circle-outline', color: '#2196F3', progreso: 2 },
  preparando: { label: 'Preparando', icono: 'flame-outline', color: '#9C27B0', progreso: 3 },
  listo: { label: 'Listo', icono: 'bag-check-outline', color: '#4CAF50', progreso: 4 },
  en_camino: { label: 'En camino', icono: 'bicycle-outline', color: '#FF5722', progreso: 5 },
  entregado: { label: 'Entregado', icono: 'home-outline', color: '#4CAF50', progreso: 6 },
  cancelado: { label: 'Cancelado', icono: 'close-circle-outline', color: '#F44336', progreso: 0 },
};

const PASOS_TIMELINE = ['pendiente', 'preparando', 'en_camino', 'entregado'];

// Altura base del header (sin insets.top) — se usa para el paddingTop del FlatList
const HEADER_BASE_HEIGHT = 90;

// ============================================================
// 🧮 TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosPedidos {
  paddingHorizontal: number;
  headerTopPadding: number;
  headerBottomPadding: number;
  tituloSize: number;
  counterSize: number;
  cardPadding: number;
  cardRadius: number;
  cardMarginBottom: number;
  iconContainerSize: number;
  iconSize: number;
  pedidoIdSize: number;
  fechaSize: number;
  estadoSize: number;
  estadoPaddingH: number;
  estadoPaddingV: number;
  estadoRadius: number;
  totalSize: number;
  cantidadItemsSize: number;
  verDetalleSize: number;
  chevronSize: number;
  infoEnvioPadding: number;
  infoEnvioRadius: number;
  infoEnvioSize: number;
  timelineHeight: number;
  timelineDotSize: number;
  timelineLineWidth: number;
  emptyIconSize: number;
  emptyTextSize: number;
  emptySubtextSize: number;
  emptyButtonPaddingH: number;
  emptyButtonPaddingV: number;
  emptyButtonRadius: number;
  emptyButtonTextSize: number;
  emptyButtonIconSize: number;
  skeletonHeight: number;
  skeletonRadius: number;
}

const calcularTamanosPedidos = (
  width: number,
  isTablet: boolean,
  isSmallPhone: boolean,
): TamanosPedidos => {
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const headerTopPadding = isTablet ? 20 : isSmallPhone ? 6 : 10;
  const headerBottomPadding = isTablet ? 16 : isSmallPhone ? 8 : 12;
  const tituloSize = isTablet ? 26 : isSmallPhone ? 18 : 21;
  const counterSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
  const cardPadding = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const cardRadius = isTablet ? 20 : isSmallPhone ? 14 : 18;
  const cardMarginBottom = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const iconContainerSize = isTablet ? 52 : isSmallPhone ? 38 : 44;
  const iconSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const pedidoIdSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
  const fechaSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
  const estadoSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
  const estadoPaddingH = isTablet ? 12 : isSmallPhone ? 8 : 10;
  const estadoPaddingV = isTablet ? 6 : isSmallPhone ? 4 : 5;
  const estadoRadius = isTablet ? 14 : isSmallPhone ? 8 : 10;
  const totalSize = isTablet ? 22 : isSmallPhone ? 16 : 18;
  const cantidadItemsSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
  const verDetalleSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
  const chevronSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const infoEnvioPadding = isTablet ? 14 : isSmallPhone ? 8 : 10;
  const infoEnvioRadius = isTablet ? 12 : isSmallPhone ? 8 : 10;
  const infoEnvioSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
  const timelineHeight = isTablet ? 40 : isSmallPhone ? 28 : 34;
  const timelineDotSize = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const timelineLineWidth = isTablet ? 40 : isSmallPhone ? 24 : 32;
  const emptyIconSize = isTablet ? 96 : isSmallPhone ? 60 : 78;
  const emptyTextSize = isTablet ? 20 : isSmallPhone ? 15 : 17;
  const emptySubtextSize = isTablet ? 14 : isSmallPhone ? 12 : 13;
  const emptyButtonPaddingH = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const emptyButtonPaddingV = isTablet ? 14 : isSmallPhone ? 11 : 12;
  const emptyButtonRadius = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const emptyButtonTextSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
  const emptyButtonIconSize = isTablet ? 22 : isSmallPhone ? 18 : 19;
  const skeletonHeight = isTablet ? 180 : isSmallPhone ? 130 : 150;
  const skeletonRadius = isTablet ? 20 : isSmallPhone ? 14 : 18;

  return {
    paddingHorizontal,
    headerTopPadding,
    headerBottomPadding,
    tituloSize,
    counterSize,
    cardPadding,
    cardRadius,
    cardMarginBottom,
    iconContainerSize,
    iconSize,
    pedidoIdSize,
    fechaSize,
    estadoSize,
    estadoPaddingH,
    estadoPaddingV,
    estadoRadius,
    totalSize,
    cantidadItemsSize,
    verDetalleSize,
    chevronSize,
    infoEnvioPadding,
    infoEnvioRadius,
    infoEnvioSize,
    timelineHeight,
    timelineDotSize,
    timelineLineWidth,
    emptyIconSize,
    emptyTextSize,
    emptySubtextSize,
    emptyButtonPaddingH,
    emptyButtonPaddingV,
    emptyButtonRadius,
    emptyButtonTextSize,
    emptyButtonIconSize,
    skeletonHeight,
    skeletonRadius,
  };
};

// ============================================================
// ⏳ SKELETON CARD
// ============================================================
const SkeletonCard: React.FC<{
  height: number;
  radius: number;
  colores: PaletaTema;
}> = ({ height, radius, colores }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: radius,
          backgroundColor: colores.surfaceHover,
          marginBottom: 12,
          opacity,
        },
      ]}
    />
  );
};

// ============================================================
// 📊 TIMELINE VISUAL
// ============================================================
const Timeline: React.FC<{
  estado: string;
  tamanos: TamanosPedidos;
  color: string;
  colores: PaletaTema;
}> = ({ estado, tamanos, color, colores }) => {
  const esCancelado = estado === 'cancelado';
  const progresoActual = ESTADOS_CONFIG[estado]?.progreso || 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 4,
        height: tamanos.timelineHeight,
      }}
    >
      {PASOS_TIMELINE.map((paso, index) => {
        const pasoProgreso = ESTADOS_CONFIG[paso].progreso;
        const completado = !esCancelado && pasoProgreso <= progresoActual;
        const esActual = !esCancelado && pasoProgreso === progresoActual;

        return (
          <React.Fragment key={paso}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: tamanos.timelineDotSize,
                  height: tamanos.timelineDotSize,
                  borderRadius: tamanos.timelineDotSize / 2,
                  backgroundColor: completado ? color : colores.surfaceHover,
                  borderWidth: 2,
                  borderColor: completado ? color : colores.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: esActual ? 1.15 : 1 }],
                }}
              >
                {completado && (
                  <Ionicons name="checkmark" size={tamanos.timelineDotSize * 0.6} color="#FFF" />
                )}
              </View>
              <Text
                style={{
                  fontFamily: FUENTES.regular,
                  fontSize: tamanos.fechaSize - 1,
                  color: completado ? color : colores.textTertiary,
                  marginTop: 4,
                  textAlign: 'center',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
                numberOfLines={1}
              >
                {ESTADOS_CONFIG[paso].label}
              </Text>
            </View>
            {index < PASOS_TIMELINE.length - 1 && (
              <View
                style={{
                  width: tamanos.timelineLineWidth,
                  height: 2,
                  backgroundColor:
                    !esCancelado && ESTADOS_CONFIG[PASOS_TIMELINE[index + 1]].progreso <= progresoActual
                      ? color
                      : colores.border,
                  marginHorizontal: 2,
                  marginBottom: tamanos.timelineDotSize + 12,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaPedidos(props: any) {
  const { pedidos, cargando, cargarPedidosUsuario, limpiarPedidos } = tiendaPedidos();
  const { perfil, sesion, cargando: cargandoAuth } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const [refrescando, setRefrescando] = useState(false);
  const { width } = useWindowDimensions();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const tamanos = useMemo(
    () => calcularTamanosPedidos(width, isTablet, isSmallPhone),
    [width, isTablet, isSmallPhone],
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // 🎯 Altura total del header (safe area + header base)
  const headerTotalHeight = insets.top + HEADER_BASE_HEIGHT;

  // ============================================================
  // 🔒 GUARD DE SESIÓN
  // ============================================================
  useEffect(() => {
    if (!cargandoAuth && !sesion) {
      Alert.alert(
        'Iniciá sesión',
        'Necesitás una cuenta para ver tus pedidos.',
        [
          {
            text: 'Volver',
            style: 'cancel',
            onPress: () => {
              try {
                props.navigation.navigate('Principal', { screen: 'Inicio' });
              } catch (e) {
                props.navigation.goBack();
              }
            },
          },
          {
            text: 'Iniciar sesión',
            onPress: () => props.navigation.replace('Login'),
          },
          {
            text: 'Registrarme',
            onPress: () => props.navigation.replace('Registro'),
          },
        ],
        { cancelable: false },
      );
    }
  }, [sesion, cargandoAuth]);

  useEffect(() => {
    if (perfil?.id) {
      cargarPedidosUsuario(perfil.id);
    } else {
      limpiarPedidos();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [perfil]);

  const manejarRefresh = async () => {
    if (!sesion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setRefrescando(true);
    if (perfil?.id) {
      await cargarPedidosUsuario(perfil.id);
    }
    setRefrescando(false);
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_CONFIG[estado] || ESTADOS_CONFIG.pendiente;
  };

  const renderPedido = useCallback(
    ({ item, index }: { item: Pedido; index: number }) => {
      const estado = item.estado || 'pendiente';
      const estadoInfo = getEstadoInfo(estado);
      const mostrarInfoEnvio =
        item.distancia_km !== undefined && item.distancia_km !== null;
      const esCancelado = estado === 'cancelado';

      const handlePress = () => {
        Haptics.selectionAsync().catch(() => { });
        if (!sesion) {
          Alert.alert('Iniciá sesión', 'Necesitás una cuenta para ver el detalle del pedido.');
          return;
        }
        props.navigation.navigate('Seguimiento', { pedidoId: item.id });
      };

      return (
        <Animated2.View entering={FadeInDown.delay(index * 60).springify()}>
          <TouchableRipple
            onPress={handlePress}
            borderless
            rippleColor={estadoInfo.color + '15'}
            style={[
              estilos.card,
              {
                padding: tamanos.cardPadding,
                borderRadius: tamanos.cardRadius,
                borderColor: estadoInfo.color + '40',
                marginBottom: tamanos.cardMarginBottom,
                backgroundColor: colores.surface,
              },
            ]}
          >
            <View style={estilos.cardInner}>
              {/* HEADER DEL PEDIDO */}
              <View style={estilos.cardHeader}>
                <View style={estilos.pedidoInfo}>
                  <View
                    style={[
                      estilos.iconContainer,
                      {
                        width: tamanos.iconContainerSize,
                        height: tamanos.iconContainerSize,
                        borderRadius: tamanos.iconContainerSize / 2,
                        backgroundColor: estadoInfo.color + '15',
                      },
                    ]}
                  >
                    <Ionicons
                      name={estadoInfo.icono}
                      size={tamanos.iconSize}
                      color={estadoInfo.color}
                    />
                  </View>
                  <View style={estilos.pedidoTexto}>
                    <Text
                      style={[
                        estilos.pedidoId,
                        { fontSize: tamanos.pedidoIdSize, color: colores.text },
                      ]}
                      allowFontScaling={false}
                    >
                      Pedido #{item.id}
                    </Text>
                    <Text
                      style={[
                        estilos.fecha,
                        { fontSize: tamanos.fechaSize, color: colores.textSecondary },
                      ]}
                      allowFontScaling={false}
                    >
                      {item.creado_en
                        ? new Date(item.creado_en).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Sin fecha'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    estilos.estado,
                    {
                      backgroundColor: estadoInfo.color + '15',
                      paddingHorizontal: tamanos.estadoPaddingH,
                      paddingVertical: tamanos.estadoPaddingV,
                      borderRadius: tamanos.estadoRadius,
                      borderColor: estadoInfo.color + '30',
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilos.estadoTexto,
                      { fontSize: tamanos.estadoSize, color: estadoInfo.color },
                    ]}
                    allowFontScaling={false}
                  >
                    {estadoInfo.label}
                  </Text>
                </View>
              </View>

              {/* TIMELINE */}
              {!esCancelado && (
                <Timeline
                  estado={estado}
                  tamanos={tamanos}
                  color={estadoInfo.color}
                  colores={colores}
                />
              )}

              {/* DETALLES PRINCIPALES */}
              <View
                style={[
                  estilos.detalles,
                  {
                    borderTopColor: colores.border,
                    marginTop: esCancelado ? 12 : 6,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      estilos.total,
                      { fontSize: tamanos.totalSize, color: colores.accent },
                    ]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(item.total || 0)}
                  </Text>
                  {item.items_json && (
                    <Text
                      style={[
                        estilos.cantidadItems,
                        { fontSize: tamanos.cantidadItemsSize, color: colores.textSecondary },
                      ]}
                      allowFontScaling={false}
                    >
                      {item.items_json.length}{' '}
                      {item.items_json.length === 1 ? 'producto' : 'productos'}
                    </Text>
                  )}
                </View>
                <View style={estilos.accion}>
                  <Text
                    style={[
                      estilos.verDetalle,
                      { fontSize: tamanos.verDetalleSize, color: colores.accent },
                    ]}
                    allowFontScaling={false}
                  >
                    Ver detalle
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={tamanos.chevronSize}
                    color={colores.accent}
                  />
                </View>
              </View>

              {/* INFO DE ENVÍO */}
              {mostrarInfoEnvio && (
                <View
                  style={[
                    estilos.infoEnvioContainer,
                    {
                      padding: tamanos.infoEnvioPadding,
                      borderRadius: tamanos.infoEnvioRadius,
                      marginTop: tamanos.cardMarginBottom,
                      backgroundColor: colores.surfaceHover,
                      borderColor: colores.border,
                    },
                  ]}
                >
                  {item.distancia_km !== undefined && item.distancia_km !== null && (
                    <View style={estilos.infoEnvioFila}>
                      <Ionicons
                        name="navigate"
                        size={tamanos.infoEnvioSize + 2}
                        color={colores.info}
                      />
                      <Text
                        style={[
                          estilos.infoEnvioTexto,
                          { fontSize: tamanos.infoEnvioSize, color: colores.textSecondary },
                        ]}
                        allowFontScaling={false}
                      >
                        Distancia:{' '}
                        <Text style={{ color: colores.text, fontWeight: '600' }}>
                          {item.distancia_km.toFixed(1)} km
                        </Text>
                      </Text>
                    </View>
                  )}

                  {item.tiempo_estimado !== undefined && item.tiempo_estimado !== null && (
                    <View style={estilos.infoEnvioFila}>
                      <Ionicons
                        name="time-outline"
                        size={tamanos.infoEnvioSize + 2}
                        color={colores.warning}
                      />
                      <Text
                        style={[
                          estilos.infoEnvioTexto,
                          { fontSize: tamanos.infoEnvioSize, color: colores.textSecondary },
                        ]}
                        allowFontScaling={false}
                      >
                        Tiempo estimado:{' '}
                        <Text style={{ color: colores.text, fontWeight: '600' }}>
                          {item.tiempo_estimado} min
                        </Text>
                      </Text>
                    </View>
                  )}

                  <View style={estilos.infoEnvioFila}>
                    <Ionicons
                      name="cash-outline"
                      size={tamanos.infoEnvioSize + 2}
                      color={item.costo_envio && item.costo_envio > 0 ? colores.success : colores.textTertiary}
                    />
                    <Text
                      style={[
                        estilos.infoEnvioTexto,
                        {
                          fontSize: tamanos.infoEnvioSize,
                          color:
                            item.costo_envio && item.costo_envio > 0
                              ? colores.success
                              : colores.textTertiary,
                          fontWeight: '600',
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Envío:{' '}
                      {item.costo_envio && item.costo_envio > 0
                        ? formatearPrecio(item.costo_envio)
                        : 'Gratis'}
                    </Text>
                  </View>

                  {item.tipo_entrega && (
                    <View style={estilos.infoEnvioFila}>
                      <Ionicons
                        name={item.tipo_entrega === 'retiro' ? 'storefront-outline' : 'home-outline'}
                        size={tamanos.infoEnvioSize + 2}
                        color={colores.textSecondary}
                      />
                      <Text
                        style={[
                          estilos.infoEnvioTexto,
                          { fontSize: tamanos.infoEnvioSize, color: colores.textSecondary },
                        ]}
                        allowFontScaling={false}
                      >
                        {item.tipo_entrega === 'retiro' ? 'Retiro en local' : 'Envío a domicilio'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableRipple>
        </Animated2.View>
      );
    },
    [tamanos, sesion, colores, estilos],
  );

  // ============================================================
  // 🔒 RENDER TEMPRANO
  // ============================================================
  if (cargandoAuth || !sesion) {
    return (
      <View style={estilos.container}>
        <LinearGradient
          colors={[colores.fondo, colores.surface, colores.fondo]}
          style={estilos.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={colores.accent} />
          <Text
            style={[
              estilos.loadingText,
              {
                fontSize: tamanos.cantidadItemsSize,
                color: colores.textSecondary,
              },
            ]}
            allowFontScaling={false}
          >
            {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.container}>
      <LinearGradient
        colors={[colores.fondo, colores.surface, colores.fondo]}
        style={estilos.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* 🎯 HEADER FLOTANTE (queda fijo arriba, el scroll pasa por debajo) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          elevation: 10,
        }}
        pointerEvents="box-none"
      >
        {/* Gradiente del header */}
        <LinearGradient
          colors={[colores.accent, colores.accentSecondary || colores.accent]}
          style={[
            estilos.headerGradient,
            {
              height: headerTotalHeight,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Contenido del header (botón + título + contador) */}
        <Animated.View
          style={[
            estilos.header,
            {
              paddingTop: insets.top + tamanos.headerTopPadding,
              paddingHorizontal: tamanos.paddingHorizontal,
              paddingBottom: tamanos.headerBottomPadding,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={estilos.headerLeft}>
            <Text
              style={[estilos.title, { fontSize: tamanos.tituloSize, color: '#FFF' }]}
              allowFontScaling={false}
            >
              Mis Pedidos
            </Text>
          </View>
          <View
            style={[
              estilos.counterPill,
              {
                paddingHorizontal: tamanos.counterSize + 4,
                paddingVertical: tamanos.counterSize * 0.4,
                borderRadius: 999,
              },
            ]}
          >
            <Text
              style={[estilos.counter, { fontSize: tamanos.counterSize, color: '#FFF' }]}
              allowFontScaling={false}
            >
              {pedidos.length}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* 🎯 LISTA con paddingTop = altura total del header + extra */}
      <View style={{ flex: 1 }}>
        {cargando ? (
          <View
            style={[
              estilos.loadingContainer,
              {
                paddingHorizontal: tamanos.paddingHorizontal,
                paddingTop: headerTotalHeight + 20, // 🆕 respeta el header fijo
              },
            ]}
          >
            <SkeletonCard height={tamanos.skeletonHeight} radius={tamanos.skeletonRadius} colores={colores} />
            <SkeletonCard height={tamanos.skeletonHeight} radius={tamanos.skeletonRadius} colores={colores} />
            <SkeletonCard height={tamanos.skeletonHeight} radius={tamanos.skeletonRadius} colores={colores} />
          </View>
        ) : (
          <FlatList
            data={pedidos}
            renderItem={renderPedido}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={[
              estilos.list,
              {
                paddingHorizontal: tamanos.paddingHorizontal,
                paddingBottom: insets.bottom + 160,
                // 🆕 paddingTop = altura del header + extra para que la primer card arranque más abajo
                paddingTop: headerTotalHeight + (isTablet ? 30 : isSmallPhone ? 20 : 24),
              },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={manejarRefresh}
                tintColor={colores.accent}
                colors={[colores.accent]}
                progressViewOffset={headerTotalHeight} // 🆕 el spinner aparece debajo del header
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            initialNumToRender={6}
            windowSize={5}
            ListEmptyComponent={
              <Animated2.View
                entering={FadeIn.duration(500)}
                style={estilos.emptyContainer}
              >
                <View
                  style={[
                    estilos.emptyIconWrap,
                    {
                      backgroundColor: colores.accent + '10',
                      borderColor: colores.accent + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={tamanos.emptyIconSize * 0.55}
                    color={colores.accent}
                  />
                </View>
                <Text
                  style={[
                    estilos.emptyText,
                    { fontSize: tamanos.emptyTextSize, color: colores.text },
                  ]}
                  allowFontScaling={false}
                >
                  No tenés pedidos aún
                </Text>
                <Text
                  style={[
                    estilos.emptySubText,
                    { fontSize: tamanos.emptySubtextSize, color: colores.textSecondary },
                  ]}
                  allowFontScaling={false}
                >
                  Tus pedidos aparecerán acá cuando realices tu primera compra 🍔
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                    props.navigation.navigate('Principal', { screen: 'Menu' });
                  }}
                  style={[
                    estilos.emptyButton,
                    {
                      paddingHorizontal: tamanos.emptyButtonPaddingH,
                      paddingVertical: tamanos.emptyButtonPaddingV,
                      borderRadius: tamanos.emptyButtonRadius,
                      shadowColor: colores.accent,
                    },
                  ]}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[colores.accent, colores.accentSecondary || colores.accent]}
                    style={estilos.emptyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons
                      name="restaurant-outline"
                      size={tamanos.emptyButtonIconSize}
                      color="#FFF"
                    />
                    <Text
                      style={[
                        estilos.emptyButtonText,
                        { fontSize: tamanos.emptyButtonTextSize, color: '#FFF' },
                      ]}
                      allowFontScaling={false}
                    >
                      Ver menú
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated2.View>
            }
          />
        )}
      </View>
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

    headerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    counterPill: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 40,
    },
    counter: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      includeFontPadding: false,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingTop: 20,
    },
    loadingText: {
      fontFamily: FUENTES.regular,
      fontWeight: '400',
      opacity: 0.7,
    },

    list: {
      flexGrow: 1,
    },

    card: {
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      overflow: 'hidden',
    },
    cardInner: {},
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    pedidoInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    fecha: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      opacity: 0.7,
    },
    estado: {
      alignSelf: 'flex-start',
      marginLeft: 8,
      borderWidth: 1,
    },
    estadoTexto: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      textTransform: 'capitalize',
    },

    detalles: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 12,
    },
    total: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    cantidadItems: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      opacity: 0.7,
    },
    accion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    verDetalle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
    },

    infoEnvioContainer: {
      borderWidth: 1,
      gap: 6,
    },
    infoEnvioFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoEnvioTexto: {
      fontFamily: FUENTES.regular,
      fontWeight: '500',
      flex: 1,
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 20,
    },
    emptyIconWrap: {
      width: 130,
      height: 130,
      borderRadius: 65,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 2,
    },
    emptyText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      marginTop: 4,
      textAlign: 'center',
      includeFontPadding: false,
    },
    emptySubText: {
      fontFamily: FUENTES.regular,
      textAlign: 'center',
      marginTop: 8,
      opacity: 0.8,
      lineHeight: 20,
      maxWidth: 300,
    },
    emptyButton: {
      marginTop: 24,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
    emptyButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    emptyButtonText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });