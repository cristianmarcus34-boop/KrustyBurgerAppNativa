import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

export default function PantallaEstadisticas(props: any) {
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState({
        totalPedidos: 0,
        ingresosTotales: 0,
        pedidosPendientes: 0,
        pedidosHoy: 0,
        ticketPromedio: 0,
        clientesRegistrados: 0,
    });

    useEffect(() => { cargarEstadisticas(); }, []);

    const cargarEstadisticas = async () => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const { count: totalPedidos } = await supabase.from('pedidos').select('*', { count: 'exact', head: true });
        const { count: pendientes } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente');
        const { count: pedidosHoy } = await supabase.from('pedidos').select('*', { count: 'exact', head: true }).gte('creado_en', hoy.toISOString());
        const { count: clientes } = await supabase.from('perfiles').select('*', { count: 'exact', head: true });
        const { data: pedidos } = await supabase.from('pedidos').select('total');

        const ingresos = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        const ticketPromedio = totalPedidos ? ingresos / totalPedidos : 0;

        setStats({
            totalPedidos: totalPedidos || 0,
            ingresosTotales: ingresos,
            pedidosPendientes: pendientes || 0,
            pedidosHoy: pedidosHoy || 0,
            ticketPromedio,
            clientesRegistrados: clientes || 0,
        });
        setCargando(false);
    };

    const tarjetas = [
        { titulo: 'Total Pedidos', valor: stats.totalPedidos, icono: 'receipt', color: Colores.secundario },
        { titulo: 'Ingresos Totales', valor: `$${stats.ingresosTotales.toFixed(2)}`, icono: 'cash', color: Colores.primario },
        { titulo: 'Pendientes', valor: stats.pedidosPendientes, icono: 'time', color: Colores.pendiente },
        { titulo: 'Pedidos Hoy', valor: stats.pedidosHoy, icono: 'today', color: '#2196F3' },
        { titulo: 'Ticket Promedio', valor: `$${stats.ticketPromedio.toFixed(2)}`, icono: 'pricetag', color: '#9C27B0' },
        { titulo: 'Clientes', valor: stats.clientesRegistrados, icono: 'people', color: '#FF5722' },
    ];

    return (
        <View style={estilos.contenedor}>
            <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={Colores.textoClaro} />
                <Text style={estilos.textoVolver}>Volver</Text>
            </TouchableOpacity>

            <Text style={estilos.titulo}>Estadisticas</Text>

            {cargando ? (
                <ActivityIndicator size="large" color={Colores.secundario} style={{ marginTop: 60 }} />
            ) : (
                <ScrollView contentContainerStyle={estilos.grid} showsVerticalScrollIndicator={false}>
                    {tarjetas.map((t, i) => (
                        <View key={i} style={[estilos.tarjeta, { borderLeftColor: t.color }]}>
                            <Ionicons name={t.icono as any} size={32} color={t.color} />
                            <Text style={estilos.tarjetaValor}>{t.valor}</Text>
                            <Text style={estilos.tarjetaTitulo}>{t.titulo}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
    botonVolver: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 6 },
    textoVolver: { color: Colores.textoClaro, fontSize: 16 },
    titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginLeft: 20, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
    tarjeta: {
        width: '47%',
        backgroundColor: Colores.fondoTarjeta,
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        marginBottom: 4,
    },
    tarjetaValor: { fontSize: 24, fontWeight: 'bold', color: Colores.textoClaro, marginTop: 12 },
    tarjetaTitulo: { fontSize: 13, color: Colores.textoGris, marginTop: 4 },
});