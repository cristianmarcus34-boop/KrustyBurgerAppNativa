import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: string;
    valor_descuento: number;
}

export default function PantallaRecompensas(props: any) {
    const { perfil } = tiendaAutenticacion();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
    const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
    const [mensajeExito, setMensajeExito] = useState('');

    useEffect(() => { cargarRecompensas(); }, []);

    const cargarRecompensas = async () => {
        const { data } = await supabase.from('recompensas').select('*').eq('activa', true);
        setRecompensas(data as Recompensa[] || []);
        setCargando(false);
    };

    const mostrarExito = (mensaje: string) => {
        setMensajeExito(mensaje);
        setMostrarModalExito(true);
        setTimeout(() => setMostrarModalExito(false), 2500);
    };

    const confirmarCanje = (recompensa: Recompensa) => {
        const puntos = perfil?.puntos_acumulados || 0;
        if (puntos < recompensa.puntos_necesarios) { mostrarExito('Puntos insuficientes'); return; }
        setRecompensaSeleccionada(recompensa);
        setMostrarModalConfirmar(true);
    };

    const canjear = async () => {
        if (!recompensaSeleccionada || !perfil) return;
        setMostrarModalConfirmar(false);
        const puntosRestantes = (perfil?.puntos_acumulados || 0) - recompensaSeleccionada.puntos_necesarios;

        const { error: errorPerfil } = await supabase.from('perfiles').update({ puntos_acumulados: puntosRestantes }).eq('id', perfil.id);
        if (errorPerfil) { console.error('Error actualizando puntos:', errorPerfil); mostrarExito('Error al canjear'); return; }

        const { error: errorCanje } = await supabase.from('canjes').insert({
            usuario_id: perfil.id, recompensa_id: recompensaSeleccionada.id,
            puntos_usados: recompensaSeleccionada.puntos_necesarios, fecha: new Date().toISOString(), usado_en_pedido: false,
        });
        if (errorCanje) { console.error('Error guardando canje:', errorCanje); mostrarExito('Error al guardar cupon'); return; }

        // Refrescar perfil
        const { data: perfilActualizado } = await supabase.from('perfiles').select('*').eq('id', perfil.id).single();
        if (perfilActualizado) { tiendaAutenticacion.setState({ perfil: perfilActualizado as any }); }

        mostrarExito(`Cupon guardado: ${recompensaSeleccionada.nombre}`);
        cargarRecompensas();
    };

    return (
        <View style={estilos.contenedor}>
            <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}><Ionicons name="arrow-back" size={24} color={Colores.textoClaro} /><Text style={estilos.textoVolver}>Volver</Text></TouchableOpacity>
            <View style={estilos.encabezado}><Text style={estilos.titulo}>Recompensas</Text><View style={estilos.puntosBadge}><Text style={estilos.puntosIcono}>⭐</Text><Text style={estilos.puntosTexto}>{perfil?.puntos_acumulados || 0} pts</Text></View></View>
            {cargando ? <ActivityIndicator size="large" color={Colores.secundario} style={{ marginTop: 60 }} /> : (
                <FlatList data={recompensas} keyExtractor={item => item.id.toString()} contentContainerStyle={estilos.lista}
                    renderItem={({ item }) => {
                        const disponible = (perfil?.puntos_acumulados || 0) >= item.puntos_necesarios;
                        return (
                            <View style={[estilos.tarjeta, disponible && estilos.tarjetaDisponible]}>
                                <View style={[estilos.tarjetaIcono, { backgroundColor: disponible ? Colores.secundario + '30' : Colores.fondoOscuro }]}><Text style={estilos.icono}>{item.tipo === 'DESCUENTO' ? '💸' : item.tipo === 'PRODUCTO_GRATIS' ? '🍔' : '🚚'}</Text></View>
                                <View style={estilos.tarjetaInfo}><Text style={estilos.tarjetaNombre}>{item.nombre}</Text><Text style={estilos.tarjetaDesc}>{item.descripcion}</Text><Text style={[estilos.tarjetaPuntos, { color: disponible ? Colores.secundario : Colores.textoGris }]}>{item.puntos_necesarios} puntos</Text></View>
                                <TouchableOpacity style={[estilos.botonCanjear, disponible && estilos.botonCanjearActivo]} onPress={() => confirmarCanje(item)} disabled={!disponible}><Text style={[estilos.botonCanjearTexto, disponible && { color: Colores.fondoOscuro }]}>{disponible ? 'Canjear' : 'Sin pts'}</Text></TouchableOpacity>
                            </View>
                        );
                    }}
                    ListEmptyComponent={<View style={estilos.vacio}><Ionicons name="gift-outline" size={60} color={Colores.textoGris} /><Text style={estilos.vacioTexto}>No hay recompensas</Text></View>}
                />
            )}
            <Modal visible={mostrarModalConfirmar} transparent animationType="fade">
                <View style={estilos.modalFondo}><View style={estilos.modal}><Text style={estilos.modalIcono}>🎁</Text><Text style={estilos.modalTitulo}>Confirmar Canje</Text><Text style={estilos.modalTexto}>Usar {recompensaSeleccionada?.puntos_necesarios} pts por{"\n"}"{recompensaSeleccionada?.nombre}"?</Text>
                    <View style={estilos.modalBotones}><TouchableOpacity style={[estilos.modalBoton, estilos.modalCancelar]} onPress={() => setMostrarModalConfirmar(false)}><Text style={estilos.modalCancelarTexto}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[estilos.modalBoton, estilos.modalConfirmar]} onPress={canjear}><Ionicons name="checkmark-circle" size={18} color="white" /><Text style={estilos.modalConfirmarTexto}>Canjear</Text></TouchableOpacity></View></View></View>
            </Modal>
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={estilos.modalFondo}><View style={[estilos.modal, { borderColor: Colores.primario }]}><Text style={estilos.modalIcono}>✅</Text><Text style={[estilos.modalTitulo, { color: Colores.primario }]}>{mensajeExito}</Text></View></View>
            </Modal>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
    botonVolver: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 6 },
    textoVolver: { color: Colores.textoClaro, fontSize: 16 },
    encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro },
    puntosBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.secundario + '20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    puntosIcono: { fontSize: 16 },
    puntosTexto: { fontSize: 16, fontWeight: 'bold', color: Colores.secundario },
    lista: { padding: 16 },
    tarjeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 16, marginBottom: 12, opacity: 0.5 },
    tarjetaDisponible: { opacity: 1, borderWidth: 1, borderColor: Colores.secundario + '40' },
    tarjetaIcono: { width: 55, height: 55, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    icono: { fontSize: 26 },
    tarjetaInfo: { flex: 1 },
    tarjetaNombre: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
    tarjetaDesc: { fontSize: 12, color: Colores.textoGris, marginTop: 4 },
    tarjetaPuntos: { fontSize: 16, fontWeight: 'bold', marginTop: 6 },
    botonCanjear: { backgroundColor: Colores.fondoOscuro, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    botonCanjearActivo: { backgroundColor: Colores.secundario },
    botonCanjearTexto: { color: Colores.textoGris, fontWeight: 'bold', fontSize: 12 },
    vacio: { alignItems: 'center', marginTop: 60 },
    vacioTexto: { color: Colores.textoGris, fontSize: 16, marginTop: 16 },
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
});