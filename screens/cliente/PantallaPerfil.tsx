// screens/cliente/PantallaPerfil.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion } = tiendaAutenticacion(); // ✅ Agregar sesion
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const paddingBottom = insets.bottom + 20;

  useEffect(() => {
    if (perfil?.id) {
      cargarTotalPedidos();
    }
  }, [perfil]);

  const cargarTotalPedidos = async () => {
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('id_de_usuario', perfil?.id);
    setTotalPedidos(count || 0);
  };

  const confirmarCerrarSesion = async () => {
    setMostrarModal(false);
    try {
      await cerrarSesion();
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // ✅ Función para navegar al login (invitados)
  const navegarALogin = () => {
    props.navigation.navigate('Login');
  };

  const nivelCliente = (puntos: number) => {
    if (puntos >= 5000) return { icono: '💎', nombre: 'Platino', color: '#E5E4E2' };
    if (puntos >= 1500) return { icono: '👑', nombre: 'Oro', color: '#FFD700' };
    if (puntos >= 500) return { icono: '🥈', nombre: 'Plata', color: '#C0C0C0' };
    return { icono: '🥉', nombre: 'Bronce', color: '#CD7F32' };
  };

  const nivel = nivelCliente(perfil?.puntos_acumulados || 0);

  return (
    <View style={[estilos.contenedor, { paddingBottom: paddingBottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollContent}>
        <View style={[estilos.encabezado, { paddingHorizontal: paddingHorizontal }]}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarEmoji}>🍔</Text>
          </View>
          <Text style={[estilos.nombre, { fontSize: isTablet ? 26 : 22 }]}>
            {perfil?.nombre_cliente || 'Invitado'}
          </Text>
          <Text style={[estilos.correo, { fontSize: isTablet ? 16 : 14 }]}>
            {perfil?.email || 'Inicia sesión para ver tus datos'}
          </Text>

          {perfil?.id ? (
            // ✅ Usuario autenticado
            <>
              <View style={estilos.puntos}>
                <Text style={estilos.puntosIcono}>⭐</Text>
                <Text style={[estilos.puntosTexto, { fontSize: isTablet ? 16 : 14 }]}>
                  {perfil?.puntos_acumulados || 0} Krusty Points
                </Text>
              </View>

              <View style={[estilos.nivel, { backgroundColor: nivel.color + '20' }]}>
                <Text style={[estilos.nivelTexto, { color: nivel.color, fontSize: isTablet ? 16 : 14 }]}>
                  {nivel.icono} Nivel {nivel.nombre}
                </Text>
              </View>

              <View style={estilos.stats}>
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: isTablet ? 22 : 18 }]}>{totalPedidos}</Text>
                  <Text style={[estilos.statLabel, { fontSize: isTablet ? 13 : 11 }]}>Pedidos</Text>
                </View>
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: isTablet ? 22 : 18 }]}>{perfil?.puntos_acumulados || 0}</Text>
                  <Text style={[estilos.statLabel, { fontSize: isTablet ? 13 : 11 }]}>Puntos</Text>
                </View>
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: isTablet ? 22 : 18 }]}>
                    {perfil?.ultimo_acceso
                      ? new Date(perfil.ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                      : '---'}
                  </Text>
                  <Text style={[estilos.statLabel, { fontSize: isTablet ? 13 : 11 }]}>Ultimo acceso</Text>
                </View>
              </View>
            </>
          ) : (
            // ✅ Usuario invitado
            <View style={estilos.mensajeInvitado}>
              <Ionicons name="person-outline" size={40} color={Colores.textoGris} />
              <Text style={[estilos.textoInvitado, { fontSize: isTablet ? 18 : 16 }]}>
                Estás viendo como invitado
              </Text>
              <Text style={[estilos.textoInvitadoSub, { fontSize: isTablet ? 14 : 12 }]}>
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>
            </View>
          )}
        </View>

        <View style={[estilos.menu, { paddingHorizontal: paddingHorizontal }]}>
          {/* ✅ BOTÓN DE LOGIN PARA INVITADOS (se muestra solo si no está autenticado) */}
          {!perfil?.id && (
            <TouchableOpacity style={[estilos.menuItem, estilos.menuLogin]} onPress={navegarALogin}>
              <Ionicons name="log-in-outline" size={24} color={Colores.primario} />
              <Text style={[estilos.menuTexto, { color: Colores.primario, fontWeight: 'bold', fontSize: isTablet ? 17 : 16 }]}>
                Iniciar Sesión
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={estilos.menuItem} onPress={() => props.navigation.navigate('Pedidos')}>
            <Ionicons name="receipt-outline" size={24} color={Colores.textoClaro} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Mis Pedidos</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.menuItem} onPress={() => props.navigation.navigate('Recompensas')}>
            <Ionicons name="star-outline" size={24} color={Colores.secundario} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Recompensas</Text>
            <Text style={[estilos.menuValor, { fontSize: isTablet ? 13 : 12 }]}>Canjear puntos</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.menuItem}>
            <Ionicons name="location-outline" size={24} color={Colores.textoClaro} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Direcciones</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.menuItem}>
            <Ionicons name="card-outline" size={24} color={Colores.textoClaro} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Metodos de pago</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.menuItem}>
            <Ionicons name="gift-outline" size={24} color={Colores.primario} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Ofertas para vos</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color={Colores.textoClaro} />
            <Text style={[estilos.menuTexto, { fontSize: isTablet ? 17 : 16 }]}>Acerca de Krusty Burger</Text>
            <Ionicons name="chevron-forward" size={20} color={Colores.textoGris} />
          </TouchableOpacity>

          {/* ✅ BOTÓN DE CERRAR SESIÓN (solo visible para autenticados) */}
          {perfil?.id && (
            <TouchableOpacity style={[estilos.menuItem, estilos.menuCerrar]} onPress={() => setMostrarModal(true)}>
              <Ionicons name="log-out-outline" size={24} color={Colores.acento} />
              <Text style={[estilos.menuTexto, { color: Colores.acento, fontSize: isTablet ? 17 : 16 }]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
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
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  scrollContent: { flexGrow: 1 },
  encabezado: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  avatar: { width: 80, height: 80, backgroundColor: Colores.secundario + '30', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 40 },
  nombre: { fontWeight: 'bold', color: Colores.textoClaro },
  correo: { color: Colores.textoGris, marginTop: 4 },
  puntos: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.secundario + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  puntosIcono: { fontSize: 16, marginRight: 6 },
  puntosTexto: { fontWeight: 'bold', color: Colores.secundario },
  nivel: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  nivelTexto: { fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, paddingHorizontal: 20 },
  statItem: { alignItems: 'center' },
  statValor: { fontWeight: 'bold', color: Colores.textoClaro },
  statLabel: { color: Colores.textoGris, marginTop: 4 },
  mensajeInvitado: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  textoInvitado: { color: Colores.textoClaro, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  textoInvitadoSub: { color: Colores.textoGris, textAlign: 'center', marginTop: 4 },
  menu: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 16, marginBottom: 8 },
  menuTexto: { flex: 1, marginLeft: 12, color: Colores.textoClaro },
  menuValor: { color: Colores.secundario, marginRight: 8 },
  menuLogin: { borderWidth: 2, borderColor: Colores.primario },
  menuCerrar: { marginTop: 20 },
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