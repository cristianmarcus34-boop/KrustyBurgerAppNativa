import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Animated, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';

// ============================================================
// 🎨 PALETA DE COLORES (consistente con las demás pantallas)
// ============================================================
const COLORS = {
  amarillo: '#F5C518',
  amarilloClaro: '#FFE066',
  amarilloOscuro: '#D4A800',
  rojo: '#E53935',
  rojoOscuro: '#B71C1C',
  verde: '#43A047',
  verdeClaro: '#66BB6A',
  blanco: '#FFFFFF',
  negro: '#0A0A0A',
  grisOscuro: '#1A1A1A',
  gris: '#333333',
  grisClaro: '#B0B0B0',
};

const { width, height } = Dimensions.get('window');
const logoImage = require('../../assets/logo-krusty.jpeg');

export default function PantallaRegistro(props: any) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const { registrarCliente } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const manejarRegistro = async () => {
    if (!nombre || !correo || !telefono || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    // ✅ Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido');
      return;
    }

    // ✅ Validación de contraseña
    if (contrasena.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // ✅ Validación de teléfono
    if (telefono.length < 8) {
      Alert.alert('Error', 'Ingresa un número de teléfono válido');
      return;
    }

    setCargando(true);
    const error = await registrarCliente({
      correo,
      contrasena,
      nombre,
      telefono
    });
    setCargando(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert(
        '¡Éxito! 🎉',
        'Cuenta creada correctamente. Ya puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => props.navigation.goBack() }]
      );
    }
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  // ✅ Tamaños dinámicos
  const logoSize = isTablet ? 100 : isSmallPhone ? 70 : 85;
  const tituloSize = isTablet ? 36 : isSmallPhone ? 26 : 30;
  const subtituloSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const labelSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const inputSize = isTablet ? 17 : isSmallPhone ? 14 : 15;
  const buttonTextSize = isTablet ? 19 : isSmallPhone ? 15 : 17;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
  const paddingTop = insets.top + (isTablet ? 30 : 15);

  return (
    <LinearGradient
      colors={[COLORS.verde, COLORS.negro]}
      style={estilos.contenedor}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            estilos.scroll,
            {
              paddingHorizontal: paddingHorizontal,
              paddingTop: paddingTop,
              paddingBottom: insets.bottom + 20,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ✅ LOGO Y TÍTULO CON ANIMACIÓN */}
          <Animated.View
            style={[
              estilos.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={estilos.logoWrapper}>
              <Image
                source={logoImage}
                style={[
                  estilos.logoImage,
                  {
                    width: logoSize,
                    height: logoSize,
                  }
                ]}
                resizeMode="contain"
              />
            </View>

            <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
              Crear Cuenta
            </Text>
            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
              Unite a Krusty Burger 🍔
            </Text>
          </Animated.View>

          {/* ✅ FORMULARIO CON ANIMACIÓN */}
          <Animated.View
            style={[
              estilos.formulario,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              }
            ]}
          >
            {/* Nombre */}
            <Text style={[estilos.label, { fontSize: labelSize }]}>
              Nombre completo
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="person-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre completo"
                placeholderTextColor={COLORS.grisClaro + '60'}
                selectionColor={COLORS.amarillo}
              />
            </View>

            {/* Correo */}
            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
              Correo electrónico
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="mail-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize }]}
                value={correo}
                onChangeText={setCorreo}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={COLORS.grisClaro + '60'}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={COLORS.amarillo}
              />
            </View>

            {/* Teléfono */}
            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
              Teléfono
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="call-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize }]}
                value={telefono}
                onChangeText={setTelefono}
                placeholder="Tu número de teléfono"
                placeholderTextColor={COLORS.grisClaro + '60'}
                keyboardType="phone-pad"
                selectionColor={COLORS.amarillo}
              />
            </View>

            {/* Contraseña */}
            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
              Contraseña
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                value={contrasena}
                onChangeText={setContrasena}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.grisClaro + '60'}
                secureTextEntry={!mostrarContrasena}
                selectionColor={COLORS.amarillo}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                style={estilos.eyeButton}
              >
                <Ionicons
                  name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.grisClaro}
                />
              </TouchableOpacity>
            </View>

            {/* ✅ BOTÓN DE REGISTRO */}
            <TouchableOpacity
              style={estilos.boton}
              onPress={manejarRegistro}
              disabled={cargando}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                style={estilos.botonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {cargando ? (
                  <ActivityIndicator color={COLORS.negro} size="small" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={buttonTextSize + 4} color={COLORS.negro} />
                    <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                      Crear Cuenta
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ✅ ENLACES */}
            <View style={estilos.enlacesContainer}>
              <TouchableOpacity
                onPress={() => props.navigation.goBack()}
                activeOpacity={0.6}
              >
                <Text style={[estilos.enlace, { fontSize: isTablet ? 16 : 14 }]}>
                  ¿Ya tienes cuenta? <Text style={estilos.enlaceDestacado}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* ✅ SEPARADOR */}
            <View style={estilos.separadorContainer}>
              <View style={estilos.separador} />
              <Text style={estilos.separadorTexto}>o</Text>
              <View style={estilos.separador} />
            </View>

            {/* ✅ BOTÓN DE INVITADO */}
            <TouchableOpacity
              style={estilos.botonInvitado}
              onPress={() => props.navigation.navigate('Principal')}
              activeOpacity={0.6}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.grisClaro} />
              <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 16 : 14 }]}>
                Continuar como invitado
              </Text>
            </TouchableOpacity>

            {/* ✅ TÉRMINOS Y CONDICIONES */}
            <TouchableOpacity
              style={estilos.terminosContainer}
              onPress={() => Alert.alert('Términos y Condiciones', 'Función en desarrollo')}
              activeOpacity={0.6}
            >
              <Text style={[estilos.terminosTexto, { fontSize: isTablet ? 12 : 10 }]}>
                Al registrarte, aceptas nuestros{' '}
                <Text style={estilos.terminosDestacado}>Términos y Condiciones</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // ✅ LOGO
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,

  },
  logoWrapper: {
    marginBottom: 12,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    backgroundColor: 'transparent',
    borderRadius: 100,
  },
  titulo: {
    fontWeight: '900',
    color: COLORS.blanco,
    letterSpacing: 2,
    textShadowColor: COLORS.negro,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    color: COLORS.grisClaro,
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  // ✅ FORMULARIO
  formulario: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    color: COLORS.blanco,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negro + '50',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    color: COLORS.blanco,
    paddingVertical: 12,
    paddingRight: 8,
  },
  eyeButton: {
    padding: 4,
  },
  // ✅ BOTÓN REGISTRO
  boton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  botonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  textoBoton: {
    fontWeight: '800',
    color: COLORS.negro,
    letterSpacing: 1.5,
  },
  // ✅ ENLACES
  enlacesContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  enlace: {
    color: COLORS.grisClaro,
    fontWeight: '500',
  },
  enlaceDestacado: {
    color: COLORS.amarillo,
    fontWeight: '700',
  },
  // ✅ SEPARADOR
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  separador: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.blanco + '15',
  },
  separadorTexto: {
    color: COLORS.grisClaro + '60',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  // ✅ BOTÓN INVITADO
  botonInvitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    backgroundColor: COLORS.negro + '30',
  },
  botonInvitadoTexto: {
    color: COLORS.grisClaro,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // ✅ TÉRMINOS
  terminosContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  terminosTexto: {
    color: COLORS.grisClaro + '60',
    textAlign: 'center',
    fontWeight: '400',
  },
  terminosDestacado: {
    color: COLORS.amarillo + '80',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});