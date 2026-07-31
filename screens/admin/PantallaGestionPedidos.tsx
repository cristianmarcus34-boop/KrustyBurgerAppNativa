import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Pedido } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

export default function PantallaGestionPedidos(props: any) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    const { data } = await supabase.from('pedidos').select('*').order('creado_en', { ascending: false });
    setPedidos(data as Pedido[] || []);
    setCargando(false);
  };

  const cambiarEstado = async (id: number, estado: string) => {
    await supabase.from('pedidos').update({ estado }).eq('id', id);
    cargarPedidos();
  };

  const estadoColor = (estado: string) => {
    const colores: any = {
      pendiente: Colores.pendiente, confirmado: Colores.confirmado,
      preparando: Colores.preparando, listo: Colores.listo,
      en_camino: Colores.enCamino, entregado: Colores.entregado, cancelado: Colores.cancelado
    };
    return colores[estado] || Colores.textoGris;
  };

  return (
    <View style={estilos.contenedor}>
      {/* Boton volver */}
      <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colores.textoClaro} />
        <Text style={estilos.textoVolver}>Volver</Text>
      </TouchableOpacity>

      <Text style={estilos.titulo}>Gestion de Pedidos</Text>
      <FlatList
        data={pedidos}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <View style={estilos.encabezado}>
              <Text style={estilos.pedidoId}>Pedido #{item.id}</Text>
              <View style={[estilos.estado, { backgroundColor: estadoColor(item.estado) + '30' }]}>
                <Text style={[estilos.estadoTexto, { color: estadoColor(item.estado) }]}>{item.estado}</Text>
              </View>
            </View>
            <Text style={estilos.total}>${item.total?.toFixed(2)}</Text>
            <View style={estilos.botones}>
              {item.estado === 'pendiente' && (
                <TouchableOpacity style={[estilos.boton, { backgroundColor: Colores.confirmado }]} onPress={() => cambiarEstado(item.id, 'confirmado')}>
                  <Text style={estilos.botonTexto}>Confirmar</Text>
                </TouchableOpacity>
              )}
              {item.estado === 'confirmado' && (
                <TouchableOpacity style={[estilos.boton, { backgroundColor: Colores.preparando }]} onPress={() => cambiarEstado(item.id, 'preparando')}>
                  <Text style={estilos.botonTexto}>Preparar</Text>
                </TouchableOpacity>
              )}
              {item.estado === 'preparando' && (
                <TouchableOpacity style={[estilos.boton, { backgroundColor: Colores.listo }]} onPress={() => cambiarEstado(item.id, 'listo')}>
                  <Text style={estilos.botonTexto}>Listo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={estilos.vacio}>No hay pedidos</Text>}
        refreshing={cargando}
        onRefresh={cargarPedidos}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60, paddingHorizontal: 16 },
  botonVolver: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  textoVolver: { color: Colores.textoClaro, fontSize: 16 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 20 },
  tarjeta: { backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 16, marginBottom: 12 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoId: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  estado: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  estadoTexto: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  total: { fontSize: 20, fontWeight: 'bold', color: Colores.primario, marginTop: 8 },
  botones: { flexDirection: 'row', gap: 8, marginTop: 12 },
  boton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  botonTexto: { color: 'white', fontWeight: 'bold' },
  vacio: { color: Colores.textoGris, textAlign: 'center', marginTop: 40, fontSize: 16 },
});