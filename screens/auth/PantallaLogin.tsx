import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

export default function PantallaLogin(props: any) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = tiendaAutenticacion();

  const manejarLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setCargando(true);
    const error = await iniciarSesion(correo, contrasena);
    setCargando(false);
    if (error) Alert.alert('Error', error);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.logo}>
          <Text style={estilos.emoji}>🍔</Text>
          <Text style={estilos.titulo}>Krusty Burger</Text>
          <Text style={estilos.subtitulo}>¡Las mas crujientes!</Text>
        </View>
        <View style={estilos.formulario}>
          <Text style={estilos.label}>Correo electronico</Text>
          <TextInput
            style={estilos.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
          />

          <Text style={estilos.label}>Contraseña</Text>
          <TextInput
            style={estilos.input}
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Tu contraseña"
            secureTextEntry
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={estilos.boton}
            onPress={manejarLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={estilos.textoBoton}>Iniciar Sesion</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => props.navigation.navigate('Registro')}>
            <Text style={estilos.enlace}>¿No tienes cuenta? Registrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondoOscuro
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  logo: {
    alignItems: 'center',
    marginBottom: 40
  },
  emoji: {
    fontSize: 80
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colores.secundario,
    marginTop: 12
  },
  subtitulo: {
    fontSize: 16,
    color: Colores.textoGris,
    marginTop: 4
  },
  formulario: {
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colores.textoClaro,
    marginBottom: 6,
    marginTop: 16
  },
  input: {
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    color: Colores.textoClaro
  },
  boton: {
    backgroundColor: Colores.primario,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  textoBoton: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  enlace: {
    color: Colores.secundario,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14
  },
});