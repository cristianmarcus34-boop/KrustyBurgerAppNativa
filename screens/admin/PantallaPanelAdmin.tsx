import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

export default function PantallaPanelAdmin(props: any) {
  // ✅ Todos los Hooks al principio, en el mismo orden SIEMPRE
  const [mostrarModal, setMostrarModal] = useState(false);
  const { cerrarSesion } = tiendaAutenticacion();

  // ✅ Función de callback memoizada (opcional, pero buena práctica)
  const confirmarCerrarSesion = useCallback(async () => {
    setMostrarModal(false);
    try {
      await cerrarSesion();
      console.log('✅ Sesión cerrada correctamente desde el store');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, [cerrarSesion]);

  // ✅ Resto del componente sin cambios
  return (
    <View style={estilos.contenedor}>
      <ScrollView>
        <View style={estilos.encabezado}>
          <Text style={estilos.titulo}>Panel Admin</Text>
          <TouchableOpacity onPress={() => setMostrarModal(true)}>
            <Ionicons name="log-out-outline" size={28} color={Colores.acento} />
          </TouchableOpacity>
        </View>

        <Text style={estilos.subtitulo}>Krusty Burger</Text>

        <View style={estilos.grid}>
          <TouchableOpacity style={estilos.tarjeta} onPress={() => props.navigation.navigate('GestionPedidos')}>
            <Ionicons name="receipt" size={40} color={Colores.secundario} />
            <Text style={estilos.tarjetaTitulo}>Pedidos</Text>
            <Text style={estilos.tarjetaSub}>Gestionar pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.tarjeta} onPress={() => props.navigation.navigate('GestionMenu')}>
            <Ionicons name="restaurant" size={40} color={Colores.primario} />
            <Text style={estilos.tarjetaTitulo}>Menu</Text>
            <Text style={estilos.tarjetaSub}>Editar productos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.tarjeta} onPress={() => props.navigation.navigate('GestionClientes')}>
            <Ionicons name="people" size={40} color="#2196F3" />
            <Text style={estilos.tarjetaTitulo}>Clientes</Text>
            <Text style={estilos.tarjetaSub}>Gestionar usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.tarjeta} onPress={() => props.navigation.navigate('Estadisticas')}>
            <Ionicons name="bar-chart" size={40} color="#9C27B0" />
            <Text style={estilos.tarjetaTitulo}>Estadisticas</Text>
            <Text style={estilos.tarjetaSub}>Ventas y mas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.tarjetaAncha} onPress={() => props.navigation.navigate('Principal')}>
            <Ionicons name="storefront" size={40} color="#FF9800" />
            <Text style={estilos.tarjetaTitulo}>Ver Tienda</Text>
            <Text style={estilos.tarjetaSub}>Ir al menu como cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.tarjetaAncha} onPress={() => setMostrarModal(true)}>
            <Ionicons name="log-out-outline" size={40} color={Colores.acento} />
            <Text style={estilos.tarjetaTitulo}>Cerrar Sesion</Text>
            <Text style={estilos.tarjetaSub}>Salir de la cuenta</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalIcono}>🍔</Text>
            <Text style={estilos.modalTitulo}>Cerrar Sesion</Text>
            <Text style={estilos.modalTexto}>Estas seguro de que queres salir?</Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalCancelar]} onPress={() => setMostrarModal(false)}>
                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalConfirmar]} onPress={confirmarCerrarSesion}>
                <Ionicons name="log-out-outline" size={18} color="white" />
                <Text style={estilos.modalConfirmarTexto}>Cerrar Sesion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60, paddingHorizontal: 20 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro },
  subtitulo: { fontSize: 14, color: Colores.textoGris, marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tarjeta: { width: '47%', backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 8 },
  tarjetaAncha: { width: '100%', backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 8 },
  tarjetaTitulo: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro, marginTop: 12 },
  tarjetaSub: { fontSize: 12, color: Colores.textoGris, marginTop: 4 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 30, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: Colores.secundario + '40' },
  modalIcono: { fontSize: 60, marginBottom: 12 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 8 },
  modalTexto: { fontSize: 14, color: Colores.textoGris, textAlign: 'center', marginBottom: 24 },
  modalBotones: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBoton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalCancelar: { backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
  modalCancelarTexto: { color: Colores.textoClaro, fontWeight: 'bold' },
  modalConfirmar: { backgroundColor: Colores.acento },
  modalConfirmarTexto: { color: 'white', fontWeight: 'bold' },
});