import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

export default function PantallaRegistro(props: any) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const { registrarCliente } = tiendaAutenticacion();

  const manejarRegistro = async () => {
    if (!nombre || !correo || !telefono || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setCargando(true);
    const error = await registrarCliente({ correo, contrasena, nombre, telefono });
    setCargando(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('¡Exito!', 'Cuenta creada. Ya puedes iniciar sesion.');
      props.navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.logo}>
          <Text style={estilos.emoji}>🍔</Text>
          <Text style={estilos.titulo}>Crear Cuenta</Text>
          <Text style={estilos.subtitulo}>Unite a Krusty Burger</Text>
        </View>
        <View style={estilos.formulario}>
          <Text style={estilos.label}>Nombre completo</Text>
          <TextInput
            style={estilos.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            placeholderTextColor="#666"
          />

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

          <Text style={estilos.label}>Telefono</Text>
          <TextInput
            style={estilos.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Tu telefono"
            keyboardType="phone-pad"
            placeholderTextColor="#666"
          />

          <Text style={estilos.label}>Contraseña</Text>
          <TextInput
            style={estilos.input}
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Minimo 6 caracteres"
            secureTextEntry
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={estilos.boton}
            onPress={manejarRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={estilos.textoBoton}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => props.navigation.goBack()}>
            <Text style={estilos.enlace}>¿Ya tienes cuenta? Inicia sesion</Text>
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
    marginBottom: 30
  },
  emoji: {
    fontSize: 60
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colores.secundario,
    marginTop: 12
  },
  subtitulo: {
    fontSize: 14,
    color: Colores.textoGris,
    marginTop: 4,
  },
  formulario: {
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colores.textoClaro,
    marginBottom: 6,
    marginTop: 14
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