import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../lib/colores';

const { width } = Dimensions.get('window');

export default function PantallaBienvenida({ navigation }: any) {
    return (
        <View style={estilos.contenedor}>
            {/* Logo */}
            <View style={estilos.logo}>
                <Text style={estilos.emoji}>🍔</Text>
                <Text style={estilos.titulo}>Krusty Burger</Text>
                <Text style={estilos.subtitulo}>Las más crujientes de la ciudad</Text>
            </View>

            {/* Features */}
            <View style={estilos.features}>
                <View style={estilos.featureItem}>
                    <Ionicons name="restaurant" size={24} color={Colores.secundario} />
                    <Text style={estilos.featureTexto}>Hamburguesas premium</Text>
                </View>
                <View style={estilos.featureItem}>
                    <Ionicons name="star" size={24} color={Colores.secundario} />
                    <Text style={estilos.featureTexto}>Ganá puntos Krusty</Text>
                </View>
                <View style={estilos.featureItem}>
                    <Ionicons name="bicycle" size={24} color={Colores.secundario} />
                    <Text style={estilos.featureTexto}>Delivery en tiempo real</Text>
                </View>
            </View>

            {/* Botones */}
            <View style={estilos.botones}>
                <TouchableOpacity style={estilos.botonIngresar} onPress={() => navigation.navigate('Login')}>
                    <Ionicons name="log-in" size={22} color="white" />
                    <Text style={estilos.botonIngresarTexto}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity style={estilos.botonRegistro} onPress={() => navigation.navigate('Registro')}>
                    <Ionicons name="person-add" size={22} color={Colores.secundario} />
                    <Text style={estilos.botonRegistroTexto}>Crear Cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity style={estilos.botonInvitado} onPress={() => navigation.navigate('Principal')}>
                    <Text style={estilos.botonInvitadoTexto}>Ver menú como invitado</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={estilos.footer}>© 2026 Krusty Burger - Todos los derechos reservados</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: Colores.fondoOscuro,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logo: { alignItems: 'center', marginBottom: 50 },
    emoji: { fontSize: 100 },
    titulo: { fontSize: 38, fontWeight: 'bold', color: Colores.secundario, marginTop: 16 },
    subtitulo: { fontSize: 16, color: Colores.textoGris, marginTop: 8, textAlign: 'center' },
    features: { width: '100%', marginBottom: 40, gap: 16 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 20 },
    featureTexto: { fontSize: 16, color: Colores.textoClaro },
    botones: { width: '100%', gap: 14 },
    botonIngresar: {
        flexDirection: 'row',
        backgroundColor: Colores.primario,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        elevation: 4,
    },
    botonIngresarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    botonRegistro: {
        flexDirection: 'row',
        backgroundColor: Colores.fondoTarjeta,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 2,
        borderColor: Colores.secundario,
    },
    botonRegistroTexto: { color: Colores.secundario, fontSize: 18, fontWeight: 'bold' },
    botonInvitado: { alignItems: 'center', paddingVertical: 12 },
    botonInvitadoTexto: { color: Colores.textoGris, fontSize: 14, textDecorationLine: 'underline' },
    footer: {
        position: 'absolute',
        bottom: 30,
        fontSize: 11,
        color: Colores.textoGris,
        textAlign: 'center',
    },
});