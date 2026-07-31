import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Perfil } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

export default function PantallaGestionClientes(props: any) {
    const [clientes, setClientes] = useState<Perfil[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => { cargarClientes(); }, []);

    const cargarClientes = async () => {
        const { data } = await supabase.from('perfiles').select('*').order('ultimo_acceso', { ascending: false });
        setClientes(data as Perfil[] || []);
        setCargando(false);
    };

    const crearCliente = async () => {
        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Completa nombre, email y contraseña');
            return;
        }

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            Alert.alert('Error', error.message);
            return;
        }

        if (data.user) {
            await supabase.from('perfiles').insert({
                id: data.user.id,
                nombre_cliente: nombre,
                email,
                telefono: telefono || null,
                rol: 'cliente',
                puntos_acumulados: 100,
                ultimo_acceso: new Date().toISOString(),
            });
        }

        setModalVisible(false);
        setNombre(''); setEmail(''); setTelefono(''); setPassword('');
        cargarClientes();
        Alert.alert('Exito', 'Cliente creado correctamente');
    };

    const cambiarRol = async (id: string, nuevoRol: string) => {
        await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id);
        cargarClientes();
    };

    const eliminarCliente = (id: string, nombre: string) => {
        Alert.alert('Eliminar cliente', `Estas seguro de eliminar a "${nombre}"?`, [
            { text: 'Cancelar' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    await supabase.from('perfiles').delete().eq('id', id);
                    cargarClientes();
                }
            }
        ]);
    };

    const rolColor = (rol: string) => {
        const colores: any = { admin: '#FF5722', cliente: '#4CAF50', repartidor: '#2196F3' };
        return colores[rol] || Colores.textoGris;
    };

    const nivelCliente = (puntos: number) => {
        if (puntos >= 5000) return '💎 Platino';
        if (puntos >= 1500) return '👑 Oro';
        if (puntos >= 500) return '🥈 Plata';
        return '🥉 Bronce';
    };

    return (
        <View style={estilos.contenedor}>
            <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={Colores.textoClaro} />
                <Text style={estilos.textoVolver}>Volver</Text>
            </TouchableOpacity>

            <View style={estilos.encabezado}>
                <View>
                    <Text style={estilos.titulo}>Clientes</Text>
                    <Text style={estilos.contador}>{clientes.length} registrados</Text>
                </View>
                <TouchableOpacity style={estilos.botonAgregar} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={estilos.textoAgregar}>Nuevo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={clientes}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={estilos.tarjeta}>
                        <View style={estilos.fila}>
                            <View style={estilos.avatar}>
                                <Text style={estilos.avatarTexto}>{item.nombre_cliente?.charAt(0)?.toUpperCase() || '?'}</Text>
                            </View>
                            <View style={estilos.info}>
                                <Text style={estilos.nombre}>{item.nombre_cliente || 'Sin nombre'}</Text>
                                <Text style={estilos.email}>{item.email}</Text>
                                <Text style={estilos.telefono}>{item.telefono || 'Sin telefono'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => eliminarCliente(item.id, item.nombre_cliente || 'Cliente')}>
                                <Ionicons name="trash-outline" size={20} color={Colores.acento} />
                            </TouchableOpacity>
                        </View>
                        <View style={estilos.detalles}>
                            <View style={estilos.detalleItem}>
                                <Text style={estilos.detalleValor}>⭐ {item.puntos_acumulados || 0}</Text>
                                <Text style={estilos.detalleLabel}>Puntos</Text>
                            </View>
                            <View style={estilos.detalleItem}>
                                <Text style={estilos.detalleValor}>{nivelCliente(item.puntos_acumulados || 0)}</Text>
                                <Text style={estilos.detalleLabel}>Nivel</Text>
                            </View>
                            <View style={[estilos.rolBadge, { backgroundColor: rolColor(item.rol || 'cliente') + '30' }]}>
                                <Text style={[estilos.rolTexto, { color: rolColor(item.rol || 'cliente') }]}>{item.rol || 'cliente'}</Text>
                            </View>
                        </View>
                        <View style={estilos.acciones}>
                            <TouchableOpacity style={[estilos.botonAccion, { backgroundColor: '#4CAF50' }]} onPress={() => cambiarRol(item.id, 'cliente')}>
                                <Text style={estilos.botonAccionTexto}>Cliente</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[estilos.botonAccion, { backgroundColor: '#2196F3' }]} onPress={() => cambiarRol(item.id, 'repartidor')}>
                                <Text style={estilos.botonAccionTexto}>Repartidor</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[estilos.botonAccion, { backgroundColor: '#FF5722' }]} onPress={() => cambiarRol(item.id, 'admin')}>
                                <Text style={estilos.botonAccionTexto}>Admin</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={estilos.vacio}>No hay clientes registrados</Text>}
                refreshing={cargando} onRefresh={cargarClientes}
            />

            {/* Modal Nuevo Cliente */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={estilos.modalFondo}>
                    <View style={estilos.modal}>
                        <Text style={estilos.modalTitulo}>Nuevo Cliente</Text>
                        <ScrollView style={estilos.modalScroll} showsVerticalScrollIndicator={false}>
                            <Text style={estilos.label}>Nombre *</Text>
                            <TextInput style={estilos.input} value={nombre} onChangeText={setNombre} placeholder="Nombre completo" placeholderTextColor="#666" />
                            <Text style={estilos.label}>Email *</Text>
                            <TextInput style={estilos.input} value={email} onChangeText={setEmail} placeholder="cliente@ejemplo.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
                            <Text style={estilos.label}>Telefono</Text>
                            <TextInput style={estilos.input} value={telefono} onChangeText={setTelefono} placeholder="1134567890" placeholderTextColor="#666" keyboardType="phone-pad" />
                            <Text style={estilos.label}>Contraseña *</Text>
                            <TextInput style={estilos.input} value={password} onChangeText={setPassword} placeholder="Minimo 6 caracteres" placeholderTextColor="#666" secureTextEntry />
                        </ScrollView>
                        <View style={estilos.modalBotones}>
                            <TouchableOpacity style={[estilos.modalBoton, estilos.modalCancelar]} onPress={() => setModalVisible(false)}>
                                <Text style={estilos.modalCancelarTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[estilos.modalBoton, estilos.modalGuardar]} onPress={crearCliente}>
                                <Ionicons name="person-add" size={18} color="white" />
                                <Text style={estilos.modalGuardarTexto}>Crear Cliente</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60, paddingHorizontal: 16 },
    botonVolver: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
    textoVolver: { color: Colores.textoClaro, fontSize: 16 },
    encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro },
    contador: { fontSize: 14, color: Colores.textoGris },
    botonAgregar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.primario, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
    textoAgregar: { color: 'white', fontWeight: 'bold' },
    tarjeta: { backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 16, marginBottom: 12 },
    fila: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colores.secundario + '30', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarTexto: { fontSize: 22, fontWeight: 'bold', color: Colores.secundario },
    info: { flex: 1 },
    nombre: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
    email: { fontSize: 12, color: Colores.textoGris, marginTop: 2 },
    telefono: { fontSize: 12, color: Colores.textoGris, marginTop: 2 },
    detalles: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#333' },
    detalleItem: { alignItems: 'center' },
    detalleValor: { fontSize: 14, fontWeight: 'bold', color: Colores.textoClaro },
    detalleLabel: { fontSize: 10, color: Colores.textoGris, marginTop: 2 },
    rolBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    rolTexto: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
    acciones: { flexDirection: 'row', gap: 8, marginTop: 8 },
    botonAccion: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    botonAccionTexto: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    vacio: { color: Colores.textoGris, textAlign: 'center', marginTop: 40, fontSize: 16 },
    // Modal
    modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 24, width: '92%' },
    modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 20, textAlign: 'center' },
    modalScroll: { maxHeight: '70%' },
    label: { fontSize: 14, fontWeight: '600', color: Colores.textoClaro, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: Colores.fondoOscuro, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#444', color: Colores.textoClaro },
    modalBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalBoton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    modalCancelar: { backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
    modalCancelarTexto: { color: Colores.textoClaro, fontWeight: 'bold' },
    modalGuardar: { backgroundColor: Colores.primario },
    modalGuardarTexto: { color: 'white', fontWeight: 'bold' },
});