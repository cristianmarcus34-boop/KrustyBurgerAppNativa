// screens/auth/PantallaRegistro.tsx - COMPLETO CON CHECKBOX Y PRIVACIDAD
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO, useResponsive } from '../../lib/colores';
import { useToast, Toast } from '../../components/Toast';

const logoImage = require('../../assets/logo-krusty.png');

export default function PantallaRegistro(props: any) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const { registrarCliente } = tiendaAutenticacion();

  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const manejarRegistro = async () => {
    if (!nombre || !correo || !telefono || !contrasena) {
      toast.advertencia('Completa todos los campos');
      return;
    }

    if (!terminosAceptados) {
      toast.advertencia('Debes aceptar los Términos y Condiciones');
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

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

  const logoSize = responsive.getValor({ tablet: 100, normal: 85, small: 70 });
  const tituloSize = responsive.getValor({ tablet: 36, normal: 30, small: 26 });
  const subtituloSize = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
  const labelSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });
  const inputSize = responsive.getValor({ tablet: 17, normal: 15, small: 14 });
  const buttonTextSize = responsive.getValor({ tablet: 19, normal: 17, small: 15 });
  const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 24, small: 20 });
  const paddingTop = insets.top + responsive.spacing(15);

  return (
    <>
      <LinearGradient
        colors={[DISENO.colors.surface, DISENO.colors.surfaceHover]}
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

            <View style={estilos.bannerPuntosContainer}>
              <LinearGradient
                colors={[DISENO.colors.accentSecondary, DISENO.colors.accentSecondaryLight]}
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
                  color={DISENO.colors.textTertiary}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  selectionColor={DISENO.colors.accent}
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
                  color={DISENO.colors.textTertiary}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={DISENO.colors.accent}
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
                  color={DISENO.colors.textTertiary}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize }]}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="Tu número de teléfono"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  keyboardType="phone-pad"
                  selectionColor={DISENO.colors.accent}
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
                  color={DISENO.colors.textTertiary}
                  style={estilos.inputIcon}
                />
                <TextInput
                  style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                  value={contrasena}
                  onChangeText={setContrasena}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  secureTextEntry={!mostrarContrasena}
                  selectionColor={DISENO.colors.accent}
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={estilos.eyeButton}
                >
                  <Ionicons
                    name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={DISENO.colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* ✅ CHECKBOX DE TÉRMINOS */}
              <TouchableOpacity
                style={estilos.terminosCheckboxContainer}
                onPress={() => setTerminosAceptados(!terminosAceptados)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    estilos.checkbox,
                    terminosAceptados && estilos.checkboxActivo,
                    {
                      borderColor: terminosAceptados
                        ? DISENO.colors.accent
                        : DISENO.colors.border,
                      backgroundColor: terminosAceptados
                        ? DISENO.colors.accent
                        : 'transparent',
                    },
                  ]}
                >
                  {terminosAceptados && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={DISENO.colors.surface}
                    />
                  )}
                </View>
                <Text style={[estilos.terminosCheckboxTexto, { fontSize: isTablet ? 14 : 12 }]}>
                  Acepto los{' '}
                  <Text
                    style={estilos.terminosLink}
                    onPress={() => props.navigation.navigate('Terminos')}
                  >
                    Términos y Condiciones
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* ✅ ENLACE A POLÍTICA DE PRIVACIDAD */}
              <TouchableOpacity
                style={estilos.privacidadContainer}
                onPress={() => props.navigation.navigate('Privacidad')}
                activeOpacity={0.7}
              >
                <Text style={[estilos.privacidadTexto, { fontSize: isTablet ? 12 : 10 }]}>
                  📄 Ver <Text style={estilos.privacidadDestacado}>Política de Privacidad</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.boton}
                onPress={manejarRegistro}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                  style={estilos.botonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {cargando ? (
                    <ActivityIndicator
                      color={DISENO.colors.surface}
                      size="small"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="person-add"
                        size={buttonTextSize + 4}
                        color={DISENO.colors.surface}
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
                  color={DISENO.colors.textTertiary}
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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

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
    backgroundColor: DISENO.colors.fondo,
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
    ...DISENO.shadow.lg,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.25,
  },
  logoImage: {
    backgroundColor: 'transparent',
    borderRadius: 100,
  },
  titulo: {
    fontWeight: '900',
    color: DISENO.colors.accent,
    letterSpacing: 2,
  },
  subtitulo: {
    color: DISENO.colors.textSecondary,
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  bannerPuntosContainer: {
    marginVertical: 12,
    borderRadius: 14,
    overflow: 'hidden',
    ...DISENO.shadow.md,
    shadowColor: DISENO.colors.accentSecondary,
    shadowOpacity: 0.3,
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
    color: DISENO.colors.text,
    fontWeight: 'bold',
  },
  bannerPuntosDesc: {
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  formulario: {
    width: '100%',
    backgroundColor: DISENO.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...DISENO.shadow.md,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  label: {
    fontWeight: '600',
    color: DISENO.colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISENO.colors.fondo,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    color: DISENO.colors.text,
    paddingVertical: 12,
    paddingRight: 8,
    flex: 1,
  },
  eyeButton: {
    padding: 4,
  },
  // ✅ CHECKBOX
  terminosCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActivo: {
    borderWidth: 2,
  },
  terminosCheckboxTexto: {
    color: DISENO.colors.textSecondary,
    fontWeight: '400',
    flex: 1,
  },
  terminosLink: {
    color: DISENO.colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // ✅ PRIVACIDAD
  privacidadContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  privacidadTexto: {
    color: DISENO.colors.textTertiary,
    textAlign: 'center',
    fontWeight: '400',
  },
  privacidadDestacado: {
    color: DISENO.colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  boton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    ...DISENO.shadow.md,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.4,
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
    color: DISENO.colors.surface,
    letterSpacing: 1.5,
  },
  enlacesContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  enlace: {
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
  },
  enlaceDestacado: {
    color: DISENO.colors.accent,
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
    backgroundColor: DISENO.colors.border,
  },
  separadorTexto: {
    color: DISENO.colors.textTertiary,
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
    borderColor: DISENO.colors.border,
    backgroundColor: DISENO.colors.surfaceHover,
  },
  botonInvitadoTexto: {
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});