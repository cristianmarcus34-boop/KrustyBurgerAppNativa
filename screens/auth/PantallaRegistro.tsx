import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { useToast, Toast } from '../../components/Toast';

const { width, height } = Dimensions.get('window');
const logoImage = require('../../assets/logo-krusty.png');

export default function PantallaRegistro(props: any) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const { registrarCliente } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();

  // ✅ Toast
  const toast = useToast();

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
    // ✅ Validaciones con toast - USANDO LOS ATAJOS
    if (!nombre || !correo || !telefono || !contrasena) {
      toast.advertencia('Completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      toast.error('Correo electrónico inválido');
      return;
    }

    if (contrasena.length < 6) {
      toast.advertencia('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (telefono.length < 8) {
      toast.advertencia('Ingresa un número de teléfono válido');
      return;
    }

    setCargando(true);
    const resultado = await registrarCliente({
      correo,
      contrasena,
      nombre,
      telefono,
    });
    setCargando(false);

    // ✅ Manejar el resultado
    if (typeof resultado === 'string' && resultado) {
      toast.error(resultado);
    } else if (resultado && typeof resultado === 'object' && 'error' in resultado) {
      toast.error(resultado.error || 'Error al registrarse');
    } else {
      toast.exito('¡Cuenta creada con éxito! 🎉');
      setTimeout(() => {
        props.navigation.goBack();
      }, 1500);
    }
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const logoSize = isTablet ? 100 : isSmallPhone ? 70 : 85;
  const tituloSize = isTablet ? 36 : isSmallPhone ? 26 : 30;
  const subtituloSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const labelSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const inputSize = isTablet ? 17 : isSmallPhone ? 14 : 15;
  const buttonTextSize = isTablet ? 19 : isSmallPhone ? 15 : 17;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
  const paddingTop = insets.top + (isTablet ? 30 : 15);

  return (
    <>
      <LinearGradient
        colors={[Colores.frinkBlanco, Colores.frinkGris]}
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
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                estilos.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
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
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>

              <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                ¡Crear Cuenta!
              </Text>
              <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
                "Glaaaven! Un nuevo usuario!" 🧪
              </Text>
            </Animated.View>

            {/* BANNER DESTACADO */}
            <View style={estilos.bannerPuntosContainer}>
              <LinearGradient
                colors={[Colores.primario, Colores.primarioOscuro]}
                style={estilos.bannerPuntosGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={estilos.bannerPuntosEmoji}>🎁</Text>
                <View style={estilos.bannerPuntosTextos}>
                  <Text
                    style={[
                      estilos.bannerPuntosTitulo,
                      { fontSize: isTablet ? 17 : 14 },
                    ]}
                  >
                    ¡Regístrate y obtén 500 puntos!
                  </Text>
                  <Text
                    style={[
                      estilos.bannerPuntosDesc,
                      { fontSize: isTablet ? 13 : 11 },
                    ]}
                  >
                    Canjealos por descuentos, envíos gratis y más
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <Animated.View
              style={[
                estilos.formulario,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <Text style={[estilos.label, { fontSize: labelSize }]}>
                Nombre completo
              </Text>
              <View style={estilos.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={Colores.frinkGris}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={Colores.frinkGris + '60'}
                  selectionColor={Colores.frinkAzul}
                />
              </View>

              <Text
                style={[
                  estilos.label,
                  { fontSize: labelSize, marginTop: 16 },
                ]}
              >
                Correo electrónico
              </Text>
              <View style={estilos.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={Colores.frinkGris}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor={Colores.frinkGris + '60'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={Colores.frinkAzul}
                />
              </View>

              <Text
                style={[
                  estilos.label,
                  { fontSize: labelSize, marginTop: 16 },
                ]}
              >
                Teléfono
              </Text>
              <View style={estilos.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={22}
                  color={Colores.frinkGris}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Tu número de teléfono"
                  placeholderTextColor={Colores.frinkGris + '60'}
                  keyboardType="phone-pad"
                  selectionColor={Colores.frinkAzul}
                />
              </View>

              <Text
                style={[
                  estilos.label,
                  { fontSize: labelSize, marginTop: 16 },
                ]}
              >
                Contraseña
              </Text>
              <View style={estilos.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={Colores.frinkGris}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                  value={contrasena}
                  onChangeText={setContrasena}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colores.frinkGris + '60'}
                  secureTextEntry={!mostrarContrasena}
                  selectionColor={Colores.frinkAzul}
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={estilos.eyeButton}
                >
                  <Ionicons
                    name={
                      mostrarContrasena ? 'eye-outline' : 'eye-off-outline'
                    }
                    size={22}
                    color={Colores.frinkGris}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={estilos.boton}
                onPress={manejarRegistro}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colores.frinkAmarillo, Colores.frinkAzul]}
                  style={estilos.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {cargando ? (
                    <ActivityIndicator
                      color={Colores.frinkBlanco}
                      size="small"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="person-add"
                        size={buttonTextSize + 4}
                        color={Colores.frinkBlanco}
                      />
                      <Text
                        style={[
                          estilos.textoBoton,
                          { fontSize: buttonTextSize },
                        ]}
                      >
                        Crear Cuenta
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={estilos.enlacesContainer}>
                <TouchableOpacity
                  onPress={() => props.navigation.goBack()}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      estilos.enlace,
                      { fontSize: isTablet ? 16 : 14 },
                    ]}
                  >
                    ¿Ya tienes cuenta?{' '}
                    <Text style={estilos.enlaceDestacado}>
                      Inicia sesión
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={estilos.separadorContainer}>
                <View style={estilos.separador} />
                <Text style={estilos.separadorTexto}>o</Text>
                <View style={estilos.separador} />
              </View>

              <TouchableOpacity
                style={estilos.botonInvitado}
                onPress={() => props.navigation.navigate('Principal')}
                activeOpacity={0.6}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colores.frinkGris}
                />
                <Text
                  style={[
                    estilos.botonInvitadoTexto,
                    { fontSize: isTablet ? 16 : 14 },
                  ]}
                >
                  Continuar como invitado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.terminosContainer}
                onPress={() => toast.info('Función en desarrollo')}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    estilos.terminosTexto,
                    { fontSize: isTablet ? 12 : 10 },
                  ]}
                >
                  Al registrarte, aceptas nuestros{' '}
                  <Text style={estilos.terminosDestacado}>
                    Términos y Condiciones
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ✅ Toast */}
      <Toast
        visible={toast.visible}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        ocultar={toast.ocultar}
      />
    </>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    marginBottom: 12,
    shadowColor: Colores.frinkAzul,
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
    color: Colores.frinkAzul,
    letterSpacing: 2,
  },
  subtitulo: {
    color: Colores.frinkAzul + '80',
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  bannerPuntosContainer: {
    marginVertical: 12,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colores.primario,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  bannerPuntosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  bannerPuntosEmoji: {
    fontSize: 32,
  },
  bannerPuntosTextos: {
    flex: 1,
  },
  bannerPuntosTitulo: {
    color: Colores.textoOscuro,
    fontWeight: 'bold',
  },
  bannerPuntosDesc: {
    color: Colores.textoOscuro + '80',
    marginTop: 2,
  },
  formulario: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    color: Colores.frinkAzul,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.textoClaro,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colores.frinkGris + '30',
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    color: Colores.frinkAzul,
    paddingVertical: 12,
    paddingRight: 8,
    flex: 1,
  },
  eyeButton: {
    padding: 4,
  },
  boton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colores.frinkAmarillo,
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
    color: Colores.frinkBlanco,
    letterSpacing: 1.5,
  },
  enlacesContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  enlace: {
    color: Colores.frinkGris,
    fontWeight: '500',
  },
  enlaceDestacado: {
    color: Colores.frinkAzul,
    fontWeight: '700',
  },
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  separador: {
    flex: 1,
    height: 1,
    backgroundColor: Colores.frinkGris + '30',
  },
  separadorTexto: {
    color: Colores.frinkGris + '60',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  botonInvitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.frinkGris + '20',
    backgroundColor: Colores.textoClaro + '80',
  },
  botonInvitadoTexto: {
    color: Colores.frinkGris,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  terminosContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  terminosTexto: {
    color: Colores.frinkAzul + '70',
    textAlign: 'center',
    fontWeight: '400',
  },
  terminosDestacado: {
    color: Colores.frinkAzul,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});