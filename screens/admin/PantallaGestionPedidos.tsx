// screens/admin/PantallaGestionPedidos.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  RefreshControl,
  Modal,
  ActivityIndicator,
  ScrollView,
  Linking,
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

// ✅ ESTADOS QUE SE CONSIDERAN "FINALIZADOS" (para limpieza)
const ESTADOS_FINALIZADOS = ['entregado', 'cancelado'];

// ✅ ESTADOS ACTIVOS (los que NO se limpian)
const ESTADOS_ACTIVOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino'];

// ============================================================
// 🆕 INTERFAZ PARA PEDIDO CON DATOS DEL CLIENTE
// ============================================================
interface PedidoConCliente extends Pedido {
  cliente_nombre_completo?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  items_nombres?: string[];
}

export default function PantallaGestionPedidos(props: any) {
  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [mostrarModalLimpieza, setMostrarModalLimpieza] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [tipoLimpieza, setTipoLimpieza] = useState<'todos' | 'finalizados' | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoConCliente | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
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

  // ============================================================
  // ✅ CARGAR PEDIDOS CON DATOS DEL CLIENTE
  // ============================================================
  const cargarPedidos = async () => {
    try {
      // 1. Obtener todos los pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (pedidosError) throw pedidosError;

      if (!pedidosData || pedidosData.length === 0) {
        setPedidos([]);
        setCargando(false);
        setRefrescando(false);
        return;
      }

      // 2. Obtener IDs de usuarios únicos
      const userIds = [...new Set(pedidosData.map(p => p.id_de_usuario).filter(Boolean))];

      // 3. Obtener datos de los clientes
      let perfilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: perfilesData, error: perfilesError } = await supabase
          .from('perfiles')
          .select('id, nombre_cliente, email, telefono, direccion_calle, direccion_numero, direccion_piso, direccion_departamento, direccion_barrio, direccion_ciudad')
          .in('id', userIds);

        if (!perfilesError && perfilesData) {
          perfilesMap = perfilesData.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // 4. Combinar pedidos con datos del cliente
      const pedidosConCliente: PedidoConCliente[] = pedidosData.map(pedido => {
        const perfil = perfilesMap[pedido.id_de_usuario || ''] || {};

        // Construir dirección completa
        const partesDireccion = [];
        if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
        if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
        if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
        if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
        if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
        if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
        const direccionCompleta = partesDireccion.length > 0 ? partesDireccion.join(', ') : pedido.direccion || 'Sin dirección';

        // Obtener nombres de productos
        let itemsNombres: string[] = [];
        try {
          if (pedido.items_json && typeof pedido.items_json === 'string') {
            const items = JSON.parse(pedido.items_json);
            if (Array.isArray(items)) {
              itemsNombres = items.map(item => `${item.cantidad}x ${item.nombre}`);
            }
          } else if (Array.isArray(pedido.items_json)) {
            itemsNombres = (pedido.items_json as any[]).map(item => `${item.cantidad}x ${item.nombre}`);
          }
        } catch (e) {
          // Si no se puede parsear, mostrar mensaje genérico
          itemsNombres = ['Ver detalles del pedido'];
        }

        return {
          ...pedido,
          cliente_nombre_completo: perfil.nombre_cliente || pedido.cliente_nombre || 'Cliente',
          cliente_email: perfil.email || 'Sin email',
          cliente_telefono: perfil.telefono || pedido.telefono || 'Sin teléfono',
          cliente_direccion: direccionCompleta,
          items_nombres: itemsNombres,
        };
      });

      setPedidos(pedidosConCliente);
    } catch (error) {
      console.error('❌ Error cargando pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  // ============================================================
  // ✅ CONTAR PEDIDOS POR ESTADO
  // ============================================================
  const contarPedidos = () => {
    const total = pedidos.length;
    const activos = pedidos.filter(p => ESTADOS_ACTIVOS.includes(p.estado)).length;
    const finalizados = pedidos.filter(p => ESTADOS_FINALIZADOS.includes(p.estado)).length;
    return { total, activos, finalizados };
  };

  // ============================================================
  // ✅ LIMPIAR PEDIDOS
  // ============================================================
  const limpiarPedidos = async (tipo: 'todos' | 'finalizados') => {
    setLimpiando(true);
    setTipoLimpieza(tipo);

    try {
      let idsAEliminar: number[] = [];

      if (tipo === 'todos') {
        idsAEliminar = pedidos.map(p => p.id);
      } else {
        idsAEliminar = pedidos
          .filter(p => ESTADOS_FINALIZADOS.includes(p.estado))
          .map(p => p.id);
      }

      if (idsAEliminar.length === 0) {
        Alert.alert('⚠️ Sin pedidos', 'No hay pedidos para eliminar en esta categoría.');
        setLimpiando(false);
        setMostrarModalLimpieza(false);
        setTipoLimpieza(null);
        return;
      }

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .in('id', idsAEliminar);

      if (error) throw error;

      const mensaje = tipo === 'todos'
        ? `Se eliminaron ${idsAEliminar.length} pedidos correctamente.`
        : `Se eliminaron ${idsAEliminar.length} pedidos finalizados (entregados/cancelados).`;

      Alert.alert('✅ Limpieza completada', mensaje);
      await cargarPedidos();

    } catch (error: any) {
      console.error('❌ Error en limpieza:', error);
      Alert.alert('Error', 'Ocurrió un error al limpiar los pedidos.');
    } finally {
      setLimpiando(false);
      setMostrarModalLimpieza(false);
      setTipoLimpieza(null);
    }
  };

  // ============================================================
  // ✅ CAMBIAR ESTADO DEL PEDIDO
  // ============================================================
  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado })
        .eq('id', id);

      if (error) throw error;

      Alert.alert(
        '✅ Estado actualizado',
        `El pedido #${id} ahora está "${ESTADOS_PEDIDO[estado]?.label || estado}"`
      );
      cargarPedidos();
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar el estado');
    }
  };

  // ============================================================
  // ✅ LLAMAR AL CLIENTE
  // ============================================================
  const llamarCliente = (telefono: string) => {
    if (!telefono || telefono === 'Sin teléfono') {
      Alert.alert('⚠️ Sin teléfono', 'Este cliente no tiene un número de teléfono registrado.');
      return;
    }
    Linking.openURL(`tel:${telefono}`).catch(() => {
      Alert.alert('Error', 'No se pudo realizar la llamada');
    });
  };

  // ============================================================
  // ✅ ABRIR MODAL DE DETALLE
  // ============================================================
  const abrirDetalle = (pedido: PedidoConCliente) => {
    setPedidoSeleccionado(pedido);
    setMostrarModalDetalle(true);
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

  // ============================================================
  // ✅ RENDER DE CADA PEDIDO (MEJORADO)
  // ============================================================
  const renderPedido = ({ item, index }: { item: PedidoConCliente; index: number }) => {
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
    const tieneItems = item.items_nombres && item.items_nombres.length > 0;

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => abrirDetalle(item)}
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
            {/* ✅ ENCABEZADO: ID + ESTADO */}
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

            {/* ✅ CLIENTE */}
            <View style={estilos.clienteContainer}>
              <Ionicons name="person-outline" size={isTablet ? 16 : 14} color={Colores.burnsDorado} />
              <Text style={[estilos.clienteNombre, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: Colores.burnsBlanco }]}>
                {item.cliente_nombre_completo}
              </Text>
              <TouchableOpacity
                style={estilos.botonLlamar}
                onPress={() => llamarCliente(item.cliente_telefono || '')}
              >
                <Ionicons name="call-outline" size={isTablet ? 18 : 16} color={Colores.burnsDorado} />
              </TouchableOpacity>
            </View>

            {/* ✅ TELÉFONO Y EMAIL */}
            <View style={estilos.contactoContainer}>
              <View style={estilos.contactoItem}>
                <Ionicons name="call" size={isTablet ? 12 : 10} color={Colores.burnsBlanco + '40'} />
                <Text style={[estilos.contactoTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: Colores.burnsBlanco + '60' }]}>
                  {item.cliente_telefono || 'Sin teléfono'}
                </Text>
              </View>
              <View style={estilos.contactoItem}>
                <Ionicons name="mail" size={isTablet ? 12 : 10} color={Colores.burnsBlanco + '40'} />
                <Text style={[estilos.contactoTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: Colores.burnsBlanco + '60' }]}>
                  {item.cliente_email || 'Sin email'}
                </Text>
              </View>
            </View>

            {/* ✅ DIRECCIÓN (si es domicilio) */}
            {item.tipo_entrega === 'domicilio' && item.cliente_direccion && (
              <View style={estilos.direccionContainer}>
                <Ionicons name="location-outline" size={isTablet ? 14 : 12} color={Colores.burnsBlanco + '30'} />
                <Text style={[estilos.direccionTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: Colores.burnsBlanco + '50' }]}>
                  {item.cliente_direccion}
                </Text>
              </View>
            )}

            {/* ✅ PRODUCTOS (resumido) */}
            {tieneItems && (
              <View style={estilos.itemsContainer}>
                <Ionicons name="restaurant-outline" size={isTablet ? 14 : 12} color={Colores.burnsBlanco + '30'} />
                <Text style={[estilos.itemsTexto, { fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11, color: Colores.burnsBlanco + '50' }]}>
                  {item.items_nombres!.slice(0, 3).join(' · ')}
                  {item.items_nombres!.length > 3 && ` +${item.items_nombres!.length - 3} más`}
                </Text>
              </View>
            )}

            {/* ✅ INFO DE ENVÍO */}
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
                <View style={estilos.infoEnvioFila}>
                  <Ionicons name="time-outline" size={isTablet ? 14 : 10} color={Colores.burnsDorado} />
                  <Text style={[estilos.infoEnvioTexto, { fontSize: infoEnvioSize, color: Colores.burnsBlanco + '60' }]}>
                    ⏱️ {item.tiempo_estimado || 0} min
                  </Text>
                </View>
              </View>
            )}

            {/* ✅ TOTAL */}
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

            {/* ✅ BOTONES DE ACCIÓN */}
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
                    Avanzar
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
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const conteo = contarPedidos();

  return (
    <>
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

          <View style={estilos.headerCentro}>
            <Text style={[estilos.titulo, { fontSize: tituloSize, color: Colores.burnsDorado }]}>
              📋 Gestión de Pedidos
            </Text>
            <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: Colores.burnsBlanco + '50' }]}>
              {conteo.total} pedidos · {conteo.activos} activos · {conteo.finalizados} finalizados
            </Text>
          </View>

          <TouchableOpacity
            style={[
              estilos.botonLimpiar,
              {
                padding: isTablet ? 10 : 8,
                borderRadius: isTablet ? 12 : 10,
                backgroundColor: Colores.burnsRojo + '20',
                borderColor: Colores.burnsRojo + '30',
              }
            ]}
            onPress={() => setMostrarModalLimpieza(true)}
            activeOpacity={0.7}
            disabled={pedidos.length === 0}
          >
            <Ionicons name="trash-outline" size={isTablet ? 24 : 20} color={pedidos.length === 0 ? Colores.burnsBlanco + '20' : Colores.burnsRojo} />
          </TouchableOpacity>
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

      {/* ============================================================
      ✅ MODAL DE CONFIRMACIÓN PARA LIMPIAR
      ============================================================ */}
      <Modal
        visible={mostrarModalLimpieza}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setMostrarModalLimpieza(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={[
            estilos.modalContainer,
            {
              maxWidth: isTablet ? 500 : width * 0.9,
              padding: isTablet ? 32 : 24,
              borderRadius: isTablet ? 28 : 24,
            }
          ]}>
            <View style={estilos.modalIcono}>
              <Ionicons name="trash" size={isTablet ? 56 : 48} color={Colores.burnsRojo} />
            </View>

            <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 24 : 20, color: Colores.burnsBlanco }]}>
              Limpiar pedidos
            </Text>

            <Text style={[estilos.modalDescripcion, { fontSize: isTablet ? 16 : 14, color: Colores.burnsBlanco + '60' }]}>
              Esta acción eliminará pedidos de forma permanente.
              {conteo.finalizados > 0 && `\n\nActualmente hay ${conteo.finalizados} pedidos finalizados (entregados/cancelados).`}
            </Text>

            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[
                  estilos.modalBoton,
                  estilos.modalBotonSecundario,
                  {
                    paddingVertical: isTablet ? 14 : 12,
                    borderRadius: isTablet ? 14 : 12,
                    borderColor: Colores.burnsBlanco + '20',
                  }
                ]}
                onPress={() => setMostrarModalLimpieza(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalBotonTexto, { fontSize: isTablet ? 16 : 14, color: Colores.burnsBlanco }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  estilos.modalBoton,
                  estilos.modalBotonPeligro,
                  {
                    paddingVertical: isTablet ? 14 : 12,
                    borderRadius: isTablet ? 14 : 12,
                  }
                ]}
                onPress={() => limpiarPedidos('finalizados')}
                activeOpacity={0.7}
                disabled={conteo.finalizados === 0 || limpiando}
              >
                <Text style={[estilos.modalBotonTexto, { fontSize: isTablet ? 16 : 14, color: Colores.burnsBlanco }]}>
                  {limpiando && tipoLimpieza === 'finalizados' ? (
                    <ActivityIndicator size="small" color={Colores.burnsBlanco} />
                  ) : (
                    `Eliminar finalizados (${conteo.finalizados})`
                  )}
                </Text>
              </TouchableOpacity>
            </View>

            {conteo.total > 0 && (
              <TouchableOpacity
                style={[
                  estilos.modalBotonEliminarTodos,
                  {
                    paddingVertical: isTablet ? 12 : 10,
                    borderRadius: isTablet ? 12 : 10,
                    marginTop: 12,
                    borderColor: Colores.burnsRojo + '30',
                  }
                ]}
                onPress={() => {
                  Alert.alert(
                    '⚠️ Eliminar todos los pedidos',
                    '¿Estás seguro de que querés eliminar TODOS los pedidos? Esta acción no se puede deshacer.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar todos',
                        style: 'destructive',
                        onPress: () => limpiarPedidos('todos')
                      }
                    ]
                  );
                }}
                activeOpacity={0.7}
                disabled={limpiando}
              >
                <Text style={[estilos.modalBotonTexto, { fontSize: isTablet ? 14 : 12, color: Colores.burnsRojo }]}>
                  {limpiando && tipoLimpieza === 'todos' ? (
                    <ActivityIndicator size="small" color={Colores.burnsRojo} />
                  ) : (
                    `⚠️ Eliminar TODOS (${conteo.total} pedidos)`
                  )}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[estilos.modalCerrar, { marginTop: 16 }]}
              onPress={() => setMostrarModalLimpieza(false)}
            >
              <Ionicons name="close-circle" size={isTablet ? 32 : 28} color={Colores.burnsBlanco + '20'} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================================
      ✅ MODAL DE DETALLE DEL PEDIDO
      ============================================================ */}
      <Modal
        visible={mostrarModalDetalle}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setMostrarModalDetalle(false)}
      >
        <View style={estilos.modalDetalleOverlay}>
          <View style={[
            estilos.modalDetalleContainer,
            {
              maxWidth: isTablet ? 600 : width * 0.95,
              maxHeight: isTablet ? '80%' : '90%',
              padding: isTablet ? 28 : 20,
              borderRadius: isTablet ? 28 : 24,
            }
          ]}>
            {/* Header */}
            <View style={estilos.modalDetalleHeader}>
              <Text style={[estilos.modalDetalleTitulo, { fontSize: isTablet ? 24 : 20, color: Colores.burnsBlanco }]}>
                Pedido #{pedidoSeleccionado?.id}
              </Text>
              <TouchableOpacity
                onPress={() => setMostrarModalDetalle(false)}
                style={estilos.modalDetalleCerrar}
              >
                <Ionicons name="close" size={isTablet ? 28 : 24} color={Colores.burnsBlanco} />
              </TouchableOpacity>
            </View>

            {pedidoSeleccionado && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={estilos.modalDetalleScroll}
              >
                {/* Cliente */}
                <View style={estilos.modalDetalleSeccion}>
                  <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : 14, color: Colores.burnsDorado }]}>
                    👤 Cliente
                  </Text>
                  <Text style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 18 : 16, color: Colores.burnsBlanco }]}>
                    {pedidoSeleccionado.cliente_nombre_completo}
                  </Text>
                  <Text style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '60' }]}>
                    📧 {pedidoSeleccionado.cliente_email}
                  </Text>
                  <Text style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '60' }]}>
                    📞 {pedidoSeleccionado.cliente_telefono}
                  </Text>
                </View>

                {/* Dirección */}
                {pedidoSeleccionado.tipo_entrega === 'domicilio' && (
                  <View style={estilos.modalDetalleSeccion}>
                    <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : 14, color: Colores.burnsDorado }]}>
                      📍 Dirección
                    </Text>
                    <Text style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 15 : 13, color: Colores.burnsBlanco + '80' }]}>
                      {pedidoSeleccionado.cliente_direccion || 'Sin dirección'}
                    </Text>
                  </View>
                )}

                {/* Productos */}
                <View style={estilos.modalDetalleSeccion}>
                  <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : 14, color: Colores.burnsDorado }]}>
                    🛒 Productos
                  </Text>
                  {pedidoSeleccionado.items_nombres && pedidoSeleccionado.items_nombres.length > 0 ? (
                    pedidoSeleccionado.items_nombres.map((item, idx) => (
                      <Text key={idx} style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '80' }]}>
                        • {item}
                      </Text>
                    ))
                  ) : (
                    <Text style={[estilos.modalDetalleTexto, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '40' }]}>
                      No se pudieron cargar los productos
                    </Text>
                  )}
                </View>

                {/* Resumen */}
                <View style={estilos.modalDetalleSeccion}>
                  <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : 14, color: Colores.burnsDorado }]}>
                    📊 Resumen
                  </Text>
                  <View style={estilos.modalDetalleFila}>
                    <Text style={[estilos.modalDetalleLabel, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '50' }]}>
                      Subtotal
                    </Text>
                    <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco }]}>
                      ${pedidoSeleccionado.total_parcial?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <View style={estilos.modalDetalleFila}>
                    <Text style={[estilos.modalDetalleLabel, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco + '50' }]}>
                      Envío
                    </Text>
                    <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 14 : 12, color: Colores.burnsBlanco }]}>
                      ${pedidoSeleccionado.costo_envio?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  {pedidoSeleccionado.puntos_usados && pedidoSeleccionado.puntos_usados > 0 && (
                    <View style={estilos.modalDetalleFila}>
                      <Text style={[estilos.modalDetalleLabel, { fontSize: isTablet ? 14 : 12, color: Colores.burnsDorado }]}>
                        Puntos usados
                      </Text>
                      <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 14 : 12, color: Colores.burnsDorado }]}>
                        -${pedidoSeleccionado.puntos_usados}
                      </Text>
                    </View>
                  )}
                  <View style={[estilos.modalDetalleFila, estilos.modalDetalleTotal]}>
                    <Text style={[estilos.modalDetalleLabel, { fontSize: isTablet ? 18 : 16, color: Colores.burnsBlanco, fontWeight: 'bold' }]}>
                      TOTAL
                    </Text>
                    <Text style={[estilos.modalDetalleValor, { fontSize: isTablet ? 22 : 18, color: Colores.burnsDorado, fontWeight: 'bold' }]}>
                      ${pedidoSeleccionado.total?.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Estado actual */}
                <View style={estilos.modalDetalleSeccion}>
                  <Text style={[estilos.modalDetalleSeccionTitulo, { fontSize: isTablet ? 16 : 14, color: Colores.burnsDorado }]}>
                    📌 Estado actual
                  </Text>
                  <View style={[
                    estilos.modalDetalleEstado,
                    {
                      backgroundColor: (ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.color || Colores.burnsDorado) + '20',
                      borderColor: (ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.color || Colores.burnsDorado) + '30',
                    }
                  ]}>
                    <Ionicons
                      name={ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.icono as any || 'time-outline'}
                      size={isTablet ? 20 : 16}
                      color={ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.color || Colores.burnsDorado}
                    />
                    <Text style={[
                      estilos.modalDetalleEstadoTexto,
                      {
                        fontSize: isTablet ? 16 : 14,
                        color: ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.color || Colores.burnsDorado,
                      }
                    ]}>
                      {ESTADOS_PEDIDO[pedidoSeleccionado.estado]?.label || pedidoSeleccionado.estado}
                    </Text>
                  </View>
                </View>

                {/* Botón cerrar */}
                <TouchableOpacity
                  style={[
                    estilos.modalDetalleBotonCerrar,
                    {
                      paddingVertical: isTablet ? 14 : 12,
                      borderRadius: isTablet ? 14 : 12,
                      marginTop: 16,
                      backgroundColor: Colores.burnsDorado,
                    }
                  ]}
                  onPress={() => setMostrarModalDetalle(false)}
                >
                  <Text style={[estilos.modalDetalleBotonCerrarTexto, { fontSize: isTablet ? 16 : 14, color: Colores.burnsNegro }]}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============================================================
// 📋 ESTILOS
// ============================================================
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
  headerCentro: {
    flex: 1,
    alignItems: 'center',
  },
  botonVolver: {
    padding: 4,
  },
  titulo: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contador: {
    fontWeight: '400',
    marginTop: 2,
  },
  botonLimpiar: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // ✅ NUEVOS ESTILOS PARA DATOS DEL CLIENTE
  clienteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  clienteNombre: {
    flex: 1,
    fontWeight: '600',
  },
  botonLlamar: {
    padding: 4,
  },
  contactoContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  contactoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactoTexto: {
    fontWeight: '400',
  },
  direccionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  direccionTexto: {
    flex: 1,
    fontWeight: '400',
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itemsTexto: {
    flex: 1,
    fontWeight: '400',
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
  // ============================================================
  // ✅ ESTILOS DEL MODAL DE LIMPIEZA
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colores.burnsNegro + '95',
    borderWidth: 1,
    borderColor: Colores.burnsRojo + '30',
    width: '100%',
    alignItems: 'center',
  },
  modalIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colores.burnsRojo + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescripcion: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBotonSecundario: {
    borderWidth: 1,
  },
  modalBotonPeligro: {
    backgroundColor: Colores.burnsRojo,
    borderWidth: 1,
    borderColor: Colores.burnsRojo,
  },
  modalBotonTexto: {
    fontWeight: 'bold',
  },
  modalBotonEliminarTodos: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalCerrar: {
    padding: 4,
  },
  // ============================================================
  // ✅ ESTILOS DEL MODAL DE DETALLE
  // ============================================================
  modalDetalleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDetalleContainer: {
    backgroundColor: Colores.burnsNegro + '95',
    borderWidth: 1,
    borderColor: Colores.burnsDorado + '20',
    width: '100%',
  },
  modalDetalleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colores.burnsBlanco + '10',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalDetalleTitulo: {
    fontWeight: 'bold',
  },
  modalDetalleCerrar: {
    padding: 4,
  },
  modalDetalleScroll: {
    paddingBottom: 8,
  },
  modalDetalleSeccion: {
    marginBottom: 16,
  },
  modalDetalleSeccionTitulo: {
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalDetalleTexto: {
    paddingVertical: 2,
  },
  modalDetalleFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalDetalleLabel: {
    fontWeight: '500',
  },
  modalDetalleValor: {
    fontWeight: '600',
  },
  modalDetalleTotal: {
    borderTopWidth: 1,
    borderTopColor: Colores.burnsBlanco + '15',
    paddingTop: 8,
    marginTop: 4,
  },
  modalDetalleEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalDetalleEstadoTexto: {
    fontWeight: 'bold',
  },
  modalDetalleBotonCerrar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetalleBotonCerrarTexto: {
    fontWeight: 'bold',
  },
});