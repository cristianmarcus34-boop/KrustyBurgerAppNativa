import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

export default function PantallaCheckout(props: any) {
    const { elementos, vaciarCarrito, calcularTotal } = tiendaCarrito();
    const { crearPedido } = tiendaPedidos();
    const { perfil } = tiendaAutenticacion();
    const total = calcularTotal();
    const costoEnvio = elementos.length > 0 ? 2.99 : 0;

    const cuponAplicado = props.route?.params?.cuponAplicado || null;
    const descuento = props.route?.params?.descuento || 0;
    const totalFinal = total + costoEnvio - descuento;

    const [direccion, setDireccion] = useState(perfil?.direccion_manual || '');
    const [telefono, setTelefono] = useState(perfil?.telefono || '');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [tipoEntrega, setTipoEntrega] = useState('domicilio');
    const [notas, setNotas] = useState('');
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [pedidoCreadoId, setPedidoCreadoId] = useState<number | null>(null);

    const metodosPago = [
        { id: 'efectivo', label: 'Efectivo', icono: 'cash' },
        { id: 'tarjeta', label: 'Tarjeta', icono: 'card' },
        { id: 'transferencia', label: 'Transferencia', icono: 'swap-horizontal' },
    ];

    const tiposEntrega = [
        { id: 'domicilio', label: 'Domicilio', icono: 'home', costo: 2.99 },
        { id: 'retiro', label: 'Retiro en local', icono: 'storefront', costo: 0 },
    ];

    const confirmarPedido = async () => {
        if (!direccion && tipoEntrega === 'domicilio') {
            Alert.alert('Error', 'Ingresa una direccion de entrega');
            return;
        }

        setCargando(true);

        const items = elementos.map(e => ({
            producto_id: e.producto.id, nombre: e.producto.nombre, cantidad: e.cantidad,
            precio_unitario: Number(e.producto.precio), total: Number(e.producto.precio) * e.cantidad,
        }));

        const envioSeleccionado = tiposEntrega.find(t => t.id === tipoEntrega);
        const costoEnvioFinal = cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS' ? 0 : (envioSeleccionado?.costo || 0);

        const datosPedido: any = {
            id_de_usuario: perfil?.id,
            cliente_nombre: perfil?.nombre_cliente,
            telefono: telefono,
            direccion: tipoEntrega === 'retiro' ? 'Retiro en local' : direccion,
            estado: 'pendiente',
            total_parcial: total,
            total: totalFinal,
            costo_envio: costoEnvioFinal,
            items_json: items,
            metodo_pago: metodoPago,
            tipo_entrega: tipoEntrega,
            notas: notas,
            puntos_usados: cuponAplicado?.puntos_usados || 0,
        };

        if (cuponAplicado) {
            await supabase.from('canjes').update({ usado_en_pedido: true }).eq('id', cuponAplicado.id);
        }

        const resultado = await crearPedido(datosPedido);
        setCargando(false);

        if (resultado.error) {
            Alert.alert('Error', resultado.error);
            return;
        }

        vaciarCarrito();
        setPedidoCreadoId(resultado.id);
        setMostrarModalExito(true);
        setTimeout(() => {
            setMostrarModalExito(false);
            props.navigation.navigate('Seguimiento', { pedidoId: resultado.id });
        }, 2500);
    };

    const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

    return (
        <View style={estilos.contenedor}>
            <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={Colores.textoClaro} />
                <Text style={estilos.textoVolver}>Volver al carrito</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scroll}>
                <Text style={estilos.titulo}>Checkout</Text>

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Datos de contacto</Text>
                    <TextInput style={estilos.input} value={telefono} onChangeText={setTelefono} placeholder="Telefono" placeholderTextColor="#666" keyboardType="phone-pad" />
                </View>

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Tipo de entrega</Text>
                    <View style={estilos.opciones}>
                        {tiposEntrega.map(t => (
                            <TouchableOpacity key={t.id} style={[estilos.opcion, tipoEntrega === t.id && estilos.opcionActiva]} onPress={() => setTipoEntrega(t.id)}>
                                <Ionicons name={t.icono as any} size={24} color={tipoEntrega === t.id ? Colores.fondoOscuro : Colores.textoClaro} />
                                <Text style={[estilos.opcionTexto, tipoEntrega === t.id && estilos.opcionTextoActiva]}>{t.label}</Text>
                                <Text style={[estilos.opcionPrecio, tipoEntrega === t.id && estilos.opcionTextoActiva]}>{t.costo === 0 ? 'GRATIS' : `$${t.costo.toFixed(2)}`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {tipoEntrega === 'domicilio' && (
                    <View style={estilos.seccion}>
                        <Text style={estilos.seccionTitulo}>Direccion de entrega</Text>
                        <TextInput style={[estilos.input, estilos.textArea]} value={direccion} onChangeText={setDireccion} placeholder="Calle, numero, piso, referencia" placeholderTextColor="#666" multiline numberOfLines={3} />
                    </View>
                )}

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Metodo de pago</Text>
                    <View style={estilos.opciones}>
                        {metodosPago.map(m => (
                            <TouchableOpacity key={m.id} style={[estilos.opcionPago, metodoPago === m.id && estilos.opcionActiva]} onPress={() => setMetodoPago(m.id)}>
                                <Ionicons name={m.icono as any} size={22} color={metodoPago === m.id ? Colores.fondoOscuro : Colores.textoClaro} />
                                <Text style={[estilos.opcionTexto, metodoPago === m.id && estilos.opcionTextoActiva]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Notas (opcional)</Text>
                    <TextInput style={[estilos.input, estilos.textArea]} value={notas} onChangeText={setNotas} placeholder="Sin cebolla, extra queso..." placeholderTextColor="#666" multiline numberOfLines={2} />
                </View>

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Productos ({elementos.length})</Text>
                    {elementos.map((e, i) => (
                        <View key={i} style={estilos.productoItem}>
                            <Text style={estilos.productoNombre}>{e.cantidad}x {e.producto.nombre}</Text>
                            <Text style={estilos.productoPrecio}>${(precioUnitario(e.producto.precio) * e.cantidad).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {cuponAplicado && (
                    <View style={[estilos.seccion, estilos.cuponSeccion]}>
                        <Ionicons name="pricetag" size={20} color={Colores.primario} />
                        <Text style={estilos.cuponTexto}>Cupon: {cuponAplicado.recompensas?.nombre} (-${descuento.toFixed(2)})</Text>
                    </View>
                )}

                <View style={estilos.seccion}>
                    <Text style={estilos.seccionTitulo}>Resumen</Text>
                    <View style={estilos.resumenFila}><Text style={estilos.resumenTexto}>Subtotal</Text><Text style={estilos.resumenValor}>${total.toFixed(2)}</Text></View>
                    <View style={estilos.resumenFila}><Text style={estilos.resumenTexto}>Costo de envio</Text><Text style={estilos.resumenValor}>{tipoEntrega === 'retiro' ? 'GRATIS' : `$${costoEnvio.toFixed(2)}`}</Text></View>
                    {descuento > 0 && <View style={estilos.resumenFila}><Text style={[estilos.resumenTexto, { color: Colores.primario }]}>Descuento</Text><Text style={[estilos.resumenValor, { color: Colores.primario }]}>-${descuento.toFixed(2)}</Text></View>}
                    <View style={[estilos.resumenFila, estilos.resumenTotal]}><Text style={estilos.totalTexto}>Total</Text><Text style={estilos.totalPrecio}>${totalFinal.toFixed(2)}</Text></View>
                </View>

                <TouchableOpacity style={[estilos.botonConfirmar, cargando && { opacity: 0.7 }]} onPress={confirmarPedido} disabled={cargando}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text style={estilos.botonConfirmarTexto}>{cargando ? 'Procesando...' : 'Confirmar Pedido'}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={estilos.modalFondo}>
                    <View style={[estilos.modal, { borderColor: Colores.primario }]}>
                        <Text style={estilos.modalIcono}>✅</Text>
                        <Text style={[estilos.modalTitulo, { color: Colores.primario }]}>Pedido confirmado!</Text>
                        <Text style={estilos.modalTexto}>Tu pedido esta siendo preparado</Text>
                        <Text style={estilos.modalSubtexto}>Redirigiendo al seguimiento...</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
    botonVolver: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 6 },
    textoVolver: { color: Colores.textoClaro, fontSize: 16 },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },
    titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 20 },
    seccion: { marginBottom: 20 },
    seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 10 },
    input: { backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#444', color: Colores.textoClaro },
    textArea: { minHeight: 70, textAlignVertical: 'top' },
    opciones: { gap: 8 },
    opcion: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 16, gap: 10 },
    opcionPago: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 14, gap: 10, flex: 1 },
    opcionActiva: { backgroundColor: Colores.secundario, borderWidth: 2, borderColor: Colores.secundario },
    opcionTexto: { flex: 1, fontSize: 15, color: Colores.textoClaro, fontWeight: '600' },
    opcionTextoActiva: { color: Colores.fondoOscuro },
    opcionPrecio: { fontSize: 14, color: Colores.textoGris, fontWeight: '600' },
    productoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    productoNombre: { fontSize: 14, color: Colores.textoClaro },
    productoPrecio: { fontSize: 14, fontWeight: 'bold', color: Colores.primario },
    cuponSeccion: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.primario + '20', borderRadius: 12, padding: 14, gap: 10 },
    cuponTexto: { fontSize: 14, color: Colores.primario, fontWeight: 'bold' },
    resumenFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    resumenTexto: { fontSize: 14, color: Colores.textoGris },
    resumenValor: { fontSize: 14, color: Colores.textoClaro, fontWeight: '600' },
    resumenTotal: { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10, marginTop: 4 },
    totalTexto: { fontSize: 18, fontWeight: 'bold', color: Colores.textoClaro },
    totalPrecio: { fontSize: 22, fontWeight: 'bold', color: Colores.secundario },
    botonConfirmar: { flexDirection: 'row', backgroundColor: Colores.primario, borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
    botonConfirmarTexto: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 30, width: '85%', alignItems: 'center', borderWidth: 2, borderColor: Colores.secundario + '40' },
    modalIcono: { fontSize: 60, marginBottom: 12 },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 8 },
    modalTexto: { fontSize: 14, color: Colores.textoGris, textAlign: 'center', marginBottom: 4 },
    modalSubtexto: { fontSize: 12, color: Colores.primario, marginTop: 12 },
});