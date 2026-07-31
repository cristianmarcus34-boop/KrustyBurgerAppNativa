import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { Pedido } from '../../lib/tipos';

export default function PantallaPedidos(props: any) {
  const { pedidos, cargando, cargarPedidosUsuario } = tiendaPedidos();
  const { perfil } = tiendaAutenticacion();

  useEffect(() => {
    if (perfil) cargarPedidosUsuario(perfil.id);
  }, [perfil]);

  const estadoColor = (estado: string) => {
    const colores: any = {
      pendiente: Colores.pendiente,
      confirmado: Colores.confirmado,
      preparando: Colores.preparando,
      listo: Colores.listo,
      en_camino: Colores.enCamino,
      entregado: Colores.entregado,
      cancelado: Colores.cancelado
    };
    return colores[estado] || Colores.textoGris;
  };

  const estadoIcono = (estado: string): keyof typeof Ionicons.glyphMap => {
    const iconos: any = {
      pendiente: 'time-outline',
      confirmado: 'checkmark-circle-outline',
      preparando: 'flame-outline',
      listo: 'bag-check-outline',
      en_camino: 'bicycle-outline',
      entregado: 'home-outline',
      cancelado: 'close-circle-outline',
    };
    return iconos[estado] || 'help-circle-outline';
  };

  const renderPedido = ({ item }: { item: Pedido }) => {
    const estado = item.estado || 'pendiente';
    return (
      <TouchableOpacity
        style={estilos.tarjeta}
        onPress={() => props.navigation.navigate('Seguimiento', { pedidoId: item.id })}
        activeOpacity={0.8}
      >
        <View style={estilos.encabezadoPedido}>
          <View style={estilos.pedidoInfo}>
            <Ionicons name={estadoIcono(estado)} size={24} color={estadoColor(estado)} />
            <View style={estilos.pedidoTexto}>
              <Text style={estilos.pedidoId}>Pedido #{item.id}</Text>
              <Text style={estilos.fecha}>
                {item.creado_en ? new Date(item.creado_en).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'Sin fecha'}
              </Text>
            </View>
          </View>
          <View style={[estilos.estado, { backgroundColor: estadoColor(estado) + '30' }]}>
            <Text style={[estilos.estadoTexto, { color: estadoColor(estado) }]}>
              {estado.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={estilos.detalles}>
          <Text style={estilos.total}>${item.total?.toFixed(2) || '0.00'}</Text>
          {item.items_json && (
            <Text style={estilos.cantidadItems}>
              {item.items_json.length} producto(s)
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>📋 Mis Pedidos</Text>

      {cargando ? (
        <ActivityIndicator size="large" color={Colores.secundario} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={estilos.vacioContenedor}>
              <Ionicons name="receipt-outline" size={60} color={Colores.textoGris} />
              <Text style={estilos.vacio}>No tienes pedidos aun</Text>
              <Text style={estilos.vacioSub}>Tus pedidos apareceran aqui</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginLeft: 20, marginBottom: 20 },
  lista: { padding: 16 },
  tarjeta: {
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  encabezadoPedido: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pedidoInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pedidoTexto: {},
  pedidoId: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  estado: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  estadoTexto: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  fecha: { fontSize: 12, color: Colores.textoGris, marginTop: 2 },
  detalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  total: { fontSize: 22, fontWeight: 'bold', color: Colores.primario },
  cantidadItems: { fontSize: 12, color: Colores.textoGris },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  vacio: { color: Colores.textoGris, fontSize: 18, marginTop: 16, fontWeight: 'bold' },
  vacioSub: { color: Colores.textoGris, fontSize: 14, marginTop: 8 },
});