// screens/admin/PantallaGestionPedidos.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Dimensions, Animated, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

// 👔 ESTADOS DE PEDIDO - CON COLORES BURNS
const ESTADOS_PEDIDO: Record<string, { label: string; color: string; icono: string; siguiente?: string }> = {
  pendiente: { label: 'Pendiente', color: Colores.burnsDorado, icono: 'time-outline', siguiente: 'confirmado' },
  confirmado: { label: 'Confirmado', color: Colores.burnsBlanco, icono: 'checkmark-circle-outline', siguiente: 'preparando' },
  preparando: { label: 'Preparando', color: Colores.burnsVerde, icono: 'cafe-outline', siguiente: 'listo' },
  listo: { label: 'Listo', color: Colores.burnsDorado, icono: 'restaurant-outline', siguiente: 'en_camino' },
  en_camino: { label: 'En camino', color: Colores.burnsRojo, icono: 'bicycle-outline', siguiente: 'entregado' },
  entregado: { label: 'Entregado', color: Colores.burnsVerde, icono: 'checkmark-done-outline' },
  cancelado: { label: 'Cancelado', color: Colores.burnsRojo, icono: 'close-circle-outline' },
};

export default function PantallaGestionPedidos(props: any) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    cargarPedidos();
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

  const cargarPedidos = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('creado_en', { ascending: false });
    setPedidos(data as Pedido[] || []);
    setCargando(false);
    setRefrescando(false);
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado })
        .eq('id', id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el estado');
        return;
      }

      Alert.alert(
        '✅ Estado actualizado',
        `El pedido #${id} ahora está "${ESTADOS_PEDIDO[estado]?.label || estado}"`,
        [{ text: 'OK' }]
      );
      cargarPedidos();
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar');
    }
  };

  const manejarRefresh = useCallback(() => {
    setRefrescando(true);
    cargarPedidos();
  }, []);

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const tituloSize = isTablet ? 26 : isSmallPhone ? 18 : 20;
  const tarjetaPadding = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const pedidoIdSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const totalSize = isTablet ? 24 : isSmallPhone ? 18 : 20;
  const estadoTextSize = isTablet ? 13 : isSmallPhone ? 10 : 11;
  const botonTextSize = isTablet ? 15 : isSmallPhone ? 11 : 13;
  const infoEnvioSize = isTablet ? 13 : isSmallPhone ? 10 : 11;

  const renderPedido = ({ item, index }: { item: Pedido; index: number }) => {
    const estadoInfo = ESTADOS_PEDIDO[item.estado] || ESTADOS_PEDIDO.pendiente;
    const isTerminado = item.estado === 'entregado' || item.estado === 'cancelado';
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });

    const tieneInfoEnvio = item.distancia_km !== undefined && item.distancia_km !== null;

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <View style={[
          estilos.tarjeta,
          {
            padding: tarjetaPadding,
            borderRadius: isTablet ? 20 : isSmallPhone ? 12 : 16,
            borderColor: estadoInfo.color + '40',
            backgroundColor: Colores.burnsNegro + '60',
          }
        ]}>
          <View style={estilos.encabezado}>
            <View style={estilos.pedidoInfo}>
              <Text style={[estilos.pedidoId, { fontSize: pedidoIdSize, color: Colores.burnsBlanco }]}>
                Pedido #{item.id}
              </Text>
              <Text style={[estilos.pedidoFecha, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: Colores.burnsBlanco + '50' }]}>
                {new Date(item.creado_en).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
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
              <Ionicons name={estadoInfo.icono as any} size={isTablet ? 16 : isSmallPhone ? 12 : 14} color={estadoInfo.color} />
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

          {tieneInfoEnvio && (
            <View style={[estilos.infoEnvioContainer, {
              backgroundColor: Colores.burnsNegro + '40',
              borderColor: Colores.burnsBlanco + '5',
            }]}>
              {item.distancia_km !== undefined && item.distancia_km !== null && (
                <View style={estilos.infoEnvioFila}>
                  <Ionicons name="navigate" size={isTablet ? 14 : 10} color={Colores.burnsDorado} />
                  <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize, color: Colores.burnsBlanco + '60' }]}>
                    📏 {item.distancia_km.toFixed(1)} km
                  </Text>
                </View>
              )}
              <View style={estilos.infoEnvioFila}>
                <Ionicons name="cash" size={isTablet ? 14 : 10} color={Colores.burnsDorado} />
                <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize, color: Colores.burnsBlanco + '60' }]}>
                  💰 ${item.costo_envio?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          )}

          <View style={[estilos.totalContainer, {
            borderTopColor: Colores.burnsBlanco + '8',
          }]}>
            <Text style={[estilos.totalLabel, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: Colores.burnsBlanco + '50' }]}>
              Total
            </Text>
            <Text style={[estilos.total, { fontSize: totalSize, color: Colores.burnsDorado }]}>
              ${item.total?.toFixed(2)}
            </Text>
          </View>

          {!isTerminado && estadoInfo.siguiente && (
            <View style={[estilos.botones, { gap: isTablet ? 12 : isSmallPhone ? 8 : 10 }]}>
              <TouchableOpacity
                style={[
                  estilos.boton,
                  {
                    backgroundColor: estadoInfo.color,
                    paddingHorizontal: isTablet ? 20 : isSmallPhone ? 12 : 16,
                    paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                  }
                ]}
                onPress={() => cambiarEstado(item.id, estadoInfo.siguiente!)}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-forward" size={isTablet ? 18 : isSmallPhone ? 12 : 16} color={Colores.burnsNegro} />
                <Text style={[estilos.botonTexto, { fontSize: botonTextSize, color: Colores.burnsNegro }]}>
                  Avanzar a {ESTADOS_PEDIDO[estadoInfo.siguiente]?.label || estadoInfo.siguiente}
                </Text>
              </TouchableOpacity>

              {item.estado !== 'cancelado' && (
                <TouchableOpacity
                  style={[
                    estilos.botonCancelar,
                    {
                      paddingHorizontal: isTablet ? 14 : isSmallPhone ? 10 : 12,
                      paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                      borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                      borderColor: Colores.burnsRojo,
                    }
                  ]}
                  onPress={() => cambiarEstado(item.id, 'cancelado')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={isTablet ? 18 : isSmallPhone ? 12 : 16} color={Colores.burnsRojo} />
                  <Text style={[estilos.botonCancelarTexto, { fontSize: botonTextSize, color: Colores.burnsRojo }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {isTerminado && (
            <View style={[estilos.estadoFinal, {
              borderTopColor: Colores.burnsBlanco + '8',
            }]}>
              <Ionicons
                name={item.estado === 'entregado' ? 'checkmark-circle' : 'close-circle'}
                size={isTablet ? 24 : 20}
                color={item.estado === 'entregado' ? Colores.burnsVerde : Colores.burnsRojo}
              />
              <Text style={[
                estilos.estadoFinalTexto,
                {
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  color: item.estado === 'entregado' ? Colores.burnsVerde : Colores.burnsRojo,
                }
              ]}>
                {item.estado === 'entregado' ? '✅ Pedido completado' : '❌ Pedido cancelado'}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[Colores.burnsVerde, Colores.burnsNegro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[
        estilos.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={Colores.burnsBlanco} />
        </TouchableOpacity>
        <Text style={[estilos.titulo, { fontSize: tituloSize, color: Colores.burnsDorado }]}>
          📋 Gestión de Pedidos
        </Text>
        <View style={{ width: isTablet ? 28 : 24 }} />
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPedido}
        contentContainerStyle={[
          estilos.lista,
          {
            paddingHorizontal: paddingHorizontal,
            paddingBottom: insets.bottom + 150,
            paddingTop: isTablet ? 12 : 8,
          }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Ionicons name="receipt-outline" size={isTablet ? 80 : 60} color={Colores.burnsBlanco + '20'} />
            <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16, color: Colores.burnsBlanco }]}>
              No hay pedidos
            </Text>
            <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: Colores.burnsBlanco + '40' }]}>
              Los pedidos aparecerán aquí cuando los clientes realicen compras
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={Colores.burnsDorado}
            colors={[Colores.burnsDorado]}
          />
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.burnsNegro,
  },
  fondoGradiente: {
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
    borderBottomColor: Colores.burnsBlanco + '10',
  },
  botonVolver: {
    padding: 4,
  },
  titulo: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  lista: {
    flexGrow: 1,
  },
  tarjeta: {
    marginBottom: 12,
    borderWidth: 1,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoId: {
    fontWeight: 'bold',
  },
  pedidoFecha: {
    marginTop: 2,
    opacity: 0.6,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estadoTexto: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  infoEnvioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  infoEnvioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoEnvioTexto: {
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontWeight: '500',
  },
  total: {
    fontWeight: 'bold',
  },
  botones: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  botonTexto: {
    fontWeight: 'bold',
  },
  botonCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  botonCancelarTexto: {
    fontWeight: '600',
  },
  estadoFinal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  estadoFinalTexto: {
    fontWeight: '600',
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  vacioTexto: {
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSubtexto: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});