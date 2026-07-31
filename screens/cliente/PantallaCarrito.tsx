import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

export default function PantallaCarrito(props: any) {
  const { elementos, aumentarCantidad, disminuirCantidad, quitarProducto, vaciarCarrito, calcularTotal } = tiendaCarrito();
  const { perfil } = tiendaAutenticacion();
  const total = calcularTotal();
  const costoEnvio = elementos.length > 0 ? 2.99 : 0;

  const [cupones, setCupones] = useState<any[]>([]);
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [mostrarCupones, setMostrarCupones] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);

  useEffect(() => { cargarCupones(); }, [perfil, cuponAplicado]);

  const cargarCupones = async () => {
    if (!perfil?.id) return;
    const { data: canjesData } = await supabase
      .from('canjes')
      .select('id, recompensa_id, puntos_usados, fecha')
      .eq('usuario_id', perfil.id)
      .eq('usado_en_pedido', false);
    if (!canjesData || canjesData.length === 0) { setCupones([]); return; }
    const ids = canjesData.map((c: any) => c.recompensa_id);
    const { data: recompensasData } = await supabase.from('recompensas').select('*').in('id', ids);
    const cuponesCombinados = canjesData.map((canje: any) => ({
      ...canje, recompensas: recompensasData?.find((r: any) => r.id === canje.recompensa_id),
    }));
    setCupones(cuponesCombinados);
  };

  const aplicarCupon = (cupon: any) => { setCuponAplicado(cupon); setMostrarCupones(false); };

  const calcularDescuento = () => {
    if (!cuponAplicado || !cuponAplicado.recompensas) return 0;
    const r = cuponAplicado.recompensas;
    if (r.tipo === 'DESCUENTO') return (total * r.valor_descuento) / 100;
    if (r.tipo === 'ENVIO_GRATIS') return costoEnvio;
    return r.valor_descuento || 0;
  };

  const descuento = calcularDescuento();
  const totalFinal = total + costoEnvio - descuento;

  const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

  return (
    <View style={estilos.contenedor}>
      {elementos.length === 0 ? (
        <View style={estilos.vacio}>
          <Ionicons name="cart-outline" size={80} color={Colores.textoGris} />
          <Text style={estilos.vacioTexto}>Tu carrito esta vacio</Text>
          <Text style={estilos.vacioSubtexto}>Agrega productos del menu!</Text>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
            <Text style={estilos.botonVolverTexto}>Ir al menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList data={elementos} keyExtractor={item => item.producto.id?.toString() || Math.random().toString()} contentContainerStyle={estilos.lista}
            renderItem={({ item }) => (
              <View style={estilos.item}>
                {item.producto.imagen ? <Image source={{ uri: item.producto.imagen }} style={estilos.imagen} resizeMode="cover" /> : <View style={estilos.imagenPlaceholder}><Text style={estilos.emoji}>🍔</Text></View>}
                <View style={estilos.itemInfo}>
                  <Text style={estilos.itemNombre}>{item.producto.nombre}</Text>
                  <Text style={estilos.itemDescripcion} numberOfLines={1}>{item.producto.descripcion || ''}</Text>
                  <Text style={estilos.itemPrecioUnitario}>${precioUnitario(item.producto.precio).toFixed(2)} c/u</Text>
                  <Text style={estilos.itemPrecioTotal}>${(precioUnitario(item.producto.precio) * item.cantidad).toFixed(2)}</Text>
                </View>
                <View style={estilos.controles}>
                  <TouchableOpacity onPress={() => disminuirCantidad(item.producto.id)} style={estilos.botonControl}><Ionicons name="remove" size={18} color={Colores.textoClaro} /></TouchableOpacity>
                  <Text style={estilos.cantidad}>{item.cantidad}</Text>
                  <TouchableOpacity onPress={() => aumentarCantidad(item.producto.id)} style={estilos.botonControl}><Ionicons name="add" size={18} color={Colores.textoClaro} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => quitarProducto(item.producto.id)} style={estilos.botonEliminar}><Ionicons name="trash-outline" size={18} color={Colores.acento} /></TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={estilos.footer}>
            {cupones.length > 0 && !cuponAplicado && (
              <TouchableOpacity style={estilos.botonCupones} onPress={() => setMostrarCupones(true)}>
                <Ionicons name="pricetag" size={20} color={Colores.secundario} />
                <Text style={estilos.botonCuponesTexto}>Tenes {cupones.length} cupon(es) disponibles</Text>
              </TouchableOpacity>
            )}
            {cuponAplicado && (
              <View style={estilos.cuponAplicado}>
                <Ionicons name="checkmark-circle" size={20} color={Colores.primario} />
                <Text style={estilos.cuponAplicadoTexto}>Cupon: {cuponAplicado.recompensas?.nombre} (-${descuento.toFixed(2)})</Text>
                <TouchableOpacity onPress={() => setCuponAplicado(null)}><Ionicons name="close-circle" size={20} color={Colores.acento} /></TouchableOpacity>
              </View>
            )}
            <View style={estilos.resumen}>
              <View style={estilos.resumenFila}><Text style={estilos.resumenTexto}>Subtotal</Text><Text style={estilos.resumenValor}>${total.toFixed(2)}</Text></View>
              <View style={estilos.resumenFila}><Text style={estilos.resumenTexto}>Costo de envio</Text><Text style={estilos.resumenValor}>{cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? 'GRATIS' : `$${costoEnvio.toFixed(2)}`}</Text></View>
              {descuento > 0 && <View style={estilos.resumenFila}><Text style={[estilos.resumenTexto, { color: Colores.primario }]}>Descuento</Text><Text style={[estilos.resumenValor, { color: Colores.primario }]}>-${descuento.toFixed(2)}</Text></View>}
              <View style={[estilos.resumenFila, estilos.resumenTotal]}><Text style={estilos.totalTexto}>Total</Text><Text style={estilos.totalPrecio}>${totalFinal.toFixed(2)}</Text></View>
            </View>
            <TouchableOpacity style={estilos.botonPedido} onPress={() => {
              if (!perfil || !perfil.id) { setMostrarModalLogin(true); return; }
              props.navigation.navigate('Checkout', { cuponAplicado, descuento });
            }}>
              <Ionicons name="cart" size={22} color="white" />
              <Text style={estilos.botonPedidoTexto}>Ir al Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botonVaciar} onPress={vaciarCarrito}>
              <Text style={estilos.botonVaciarTexto}>Vaciar carrito</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={mostrarModalLogin} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalIcono}>🔐</Text>
            <Text style={estilos.modalTitulo}>Inicia sesion</Text>
            <Text style={estilos.modalTexto}>Debes iniciar sesion o crear una cuenta para realizar pedidos</Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalCancelar]} onPress={() => setMostrarModalLogin(false)}>
                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalConfirmar]} onPress={() => { setMostrarModalLogin(false); props.navigation.navigate('Login'); }}>
                <Ionicons name="log-in" size={18} color="white" />
                <Text style={estilos.modalConfirmarTexto}>Iniciar sesion</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 16 }} onPress={() => { setMostrarModalLogin(false); props.navigation.navigate('Registro'); }}>
              <Text style={{ color: Colores.secundario, fontSize: 14 }}>Crear una cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={mostrarCupones} transparent animationType="slide">
        <View style={estilos.modalFondo}>
          <View style={estilos.modalCupones}>
            <Text style={estilos.modalCuponTitulo}>🎫 Tus Cupones</Text>
            {cupones.length === 0 ? <Text style={estilos.vacioTexto}>No tenes cupones disponibles</Text> : cupones.map((c: any) => (
              <TouchableOpacity key={c.id} style={estilos.cuponItem} onPress={() => aplicarCupon(c)}>
                <Text style={estilos.cuponIcono}>🎫</Text>
                <View style={{ flex: 1 }}><Text style={estilos.cuponNombre}>{c.recompensas?.nombre}</Text><Text style={estilos.cuponDesc}>{c.recompensas?.descripcion}</Text></View>
                <Text style={estilos.cuponAplicar}>Usar →</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[estilos.botonPedido, { marginTop: 16 }]} onPress={() => setMostrarCupones(false)}><Text style={estilos.botonPedidoTexto}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  vacio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  vacioTexto: { fontSize: 20, fontWeight: 'bold', color: Colores.textoGris, marginTop: 16 },
  vacioSubtexto: { fontSize: 14, color: Colores.textoGris, marginTop: 8 },
  botonVolver: { marginTop: 20, backgroundColor: Colores.primario, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  botonVolverTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  lista: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, marginBottom: 10, borderRadius: 16, padding: 12 },
  imagen: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  imagenPlaceholder: { width: 70, height: 70, backgroundColor: Colores.secundario + '20', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emoji: { fontSize: 30 },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 15, fontWeight: 'bold', color: Colores.textoClaro },
  itemDescripcion: { fontSize: 11, color: Colores.textoGris, marginTop: 2 },
  itemPrecioUnitario: { fontSize: 11, color: Colores.textoGris, marginTop: 2 },
  itemPrecioTotal: { fontSize: 16, fontWeight: 'bold', color: Colores.primario, marginTop: 4 },
  controles: { alignItems: 'center', gap: 6, marginLeft: 8 },
  botonControl: { backgroundColor: Colores.primario, borderRadius: 15, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  cantidad: { color: Colores.textoClaro, fontSize: 14, fontWeight: 'bold' },
  botonEliminar: { marginTop: 4 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  botonCupones: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colores.secundario + '20', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  botonCuponesTexto: { color: Colores.secundario, fontWeight: 'bold' },
  cuponAplicado: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.primario + '20', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  cuponAplicadoTexto: { flex: 1, color: Colores.primario, fontWeight: 'bold', fontSize: 13 },
  resumen: { marginBottom: 16 },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenTexto: { fontSize: 14, color: Colores.textoGris },
  resumenValor: { fontSize: 14, color: Colores.textoClaro, fontWeight: '600' },
  resumenTotal: { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, marginTop: 4 },
  totalTexto: { fontSize: 18, fontWeight: 'bold', color: Colores.textoClaro },
  totalPrecio: { fontSize: 22, fontWeight: 'bold', color: Colores.secundario },
  botonPedido: { flexDirection: 'row', backgroundColor: Colores.primario, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  botonPedidoTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  botonVaciar: { alignItems: 'center', padding: 10 },
  botonVaciarTexto: { color: Colores.acento, fontSize: 14 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 30, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: Colores.secundario + '40' },
  modalIcono: { fontSize: 60, marginBottom: 12 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 8 },
  modalTexto: { fontSize: 14, color: Colores.textoGris, textAlign: 'center', marginBottom: 24 },
  modalBotones: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBoton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalCancelar: { backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
  modalCancelarTexto: { color: Colores.textoClaro, fontWeight: 'bold' },
  modalConfirmar: { backgroundColor: Colores.primario },
  modalConfirmarTexto: { color: 'white', fontWeight: 'bold' },
  modalCupones: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 24, width: '92%', maxHeight: '70%' },
  modalCuponTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 16, textAlign: 'center' },
  cuponItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoOscuro, borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
  cuponIcono: { fontSize: 30 },
  cuponNombre: { fontSize: 14, fontWeight: 'bold', color: Colores.textoClaro },
  cuponDesc: { fontSize: 11, color: Colores.textoGris, marginTop: 2 },
  cuponAplicar: { color: Colores.secundario, fontWeight: 'bold' },
});