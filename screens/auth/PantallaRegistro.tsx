// screens/auth/PantallaRegistro.tsx - COMPLETO CON TIPOGRAFÍA SIMPSON
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { FUENTES } from '../../lib/fuentes';
import { useToast, Toast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';

const logoImage = require('../../assets/logo-krusty.png');

// ============================================================
// 🛡️ HELPERS GLOBALES (a prueba de balas)
// ============================================================

const stringSeguro = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (valor instanceof Error) return valor.message || '';
  if (typeof valor === 'object') {
    try {
      const obj = valor as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.error === 'string') return obj.error;
      if (typeof obj.detalle === 'string') return obj.detalle;
      if (typeof obj.detail === 'string') return obj.detail;
      return JSON.stringify(valor);
    } catch {
      return 'Error desconocido';
    }
  }
  return String(valor);
};

const MENSAJES_ERROR: Array<{ match: string; mensaje: string }> = [
  { match: 'already registered', mensaje: '📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.' },
  { match: 'already exists', mensaje: '📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.' },
  { match: 'already in use', mensaje: '📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.' },
  { match: 'duplicate key', mensaje: '📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.' },
  { match: 'user already', mensaje: '📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.' },
  { match: 'email not confirmed', mensaje: '✉️ Tenés que confirmar tu correo antes de continuar. Revisá tu bandeja de entrada.' },
  { match: 'password should be at least 6', mensaje: '🔒 La contraseña debe tener al menos 6 caracteres.' },
  { match: 'password is too short', mensaje: '🔒 La contraseña es muy corta. Usá al menos 6 caracteres.' },
  { match: 'invalid email', mensaje: '📧 El correo no es válido. Revisá que esté bien escrito.' },
  { match: 'unable to validate email', mensaje: '📧 El correo no es válido. Revisá que esté bien escrito.' },
  { match: 'signup is disabled', mensaje: '⚠️ El registro está deshabilitado temporalmente. Probá más tarde.' },
  { match: 'signups not allowed', mensaje: '⚠️ El registro está deshabilitado temporalmente. Probá más tarde.' },
  { match: 'database error saving new user', mensaje: '⚠️ Hubo un problema al crear tu cuenta. Intentá de nuevo en unos minutos.' },
  { match: 'database error', mensaje: '⚠️ Hubo un problema al crear tu cuenta. Intentá de nuevo en unos minutos.' },
  { match: 'rate limit', mensaje: '⏳ Demasiados intentos. Esperá unos minutos antes de volver a intentar.' },
  { match: 'too many requests', mensaje: '⏳ Demasiados intentos. Esperá unos minutos antes de volver a intentar.' },
  { match: 'network', mensaje: '📶 Parece que no tenés conexión. Verificá tu internet e intentá de nuevo.' },
  { match: 'fetch', mensaje: '📶 Parece que no tenés conexión. Verificá tu internet e intentá de nuevo.' },
  { match: 'timeout', mensaje: '⏱️ La conexión tardó demasiado. Intentá de nuevo.' },
];

const obtenerMensajeError = (error: unknown): string => {
  const mensaje = stringSeguro(error).toLowerCase().trim();

  if (!mensaje) {
    return '❌ No pudimos crear tu cuenta. Intentá de nuevo en unos segundos.';
  }

  for (const item of MENSAJES_ERROR) {
    if (mensaje.includes(item.match)) {
      return item.mensaje;
    }
  }

  return '❌ No pudimos crear tu cuenta. Intentá de nuevo en unos segundos.';
};

const esErrorEmailDuplicado = (error: unknown): boolean => {
  const mensaje = stringSeguro(error).toLowerCase();
  return (
    mensaje.includes('already') ||
    mensaje.includes('duplicate') ||
    mensaje.includes('exists') ||
    mensaje.includes('unique constraint')
  );
};

const esEmailValido = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// ============================================================
// 🧩 COMPONENTE
// ============================================================

export default function PantallaRegistro(props: any) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  const { registrarCliente } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const enviandoRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (errorCorreo && correo) {
      setErrorCorreo(null);
    }
  }, [correo]);

  const verificarEmailExistente = useCallback(async (email: string): Promise<boolean | null> => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.warn('⚠️ No se pudo verificar email:', error.message);
        return null;
      }

      return !!data;
    } catch (error) {
      console.warn('⚠️ Excepción verificando email:', error);
      return null;
    }
  }, []);

  const manejarRegistro = useCallback(async () => {
    if (enviandoRef.current || cargando) return;
    enviandoRef.current = true;

    setErrorCorreo(null);

    try {
      const nombreTrim = nombre.trim();
      const correoTrim = correo.trim().toLowerCase();
      const telefonoTrim = telefono.trim();

      if (!nombreTrim || !correoTrim || !telefonoTrim || !contrasena) {
        toast.advertencia('Completá todos los campos');
        return;
      }

      if (!terminosAceptados) {
        toast.advertencia('Tenés que aceptar los Términos y Condiciones');
        return;
      }

      if (!esEmailValido(correoTrim)) {
        toast.error('📧 El correo no es válido. Revisá que esté bien escrito.');
        return;
      }

      if (contrasena.length < 6) {
        toast.advertencia('🔒 La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (telefonoTrim.length < 8) {
        toast.advertencia('📞 Ingresá un número de teléfono válido');
        return;
      }

      setCargando(true);

      const emailExiste = await verificarEmailExistente(correoTrim);

      if (emailExiste === true) {
        setErrorCorreo('Este correo ya está registrado. Probá iniciar sesión.');
        toast.error('📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.');
        return;
      }

      let resultado: unknown;
      try {
        resultado = await registrarCliente({
          correo: correoTrim,
          contrasena,
          nombre: nombreTrim,
          telefono: telefonoTrim,
        });
      } catch (excepcion) {
        console.error('❌ [Registro] Excepción:', excepcion);
        const mensaje = obtenerMensajeError(excepcion);

        if (esErrorEmailDuplicado(excepcion)) {
          setErrorCorreo('Este correo ya está registrado. Probá iniciar sesión.');
        }

        toast.error(mensaje);
        return;
      }

      let mensajeError = '';
      if (typeof resultado === 'string') {
        mensajeError = resultado;
      } else if (resultado && typeof resultado === 'object' && 'error' in resultado) {
        mensajeError = stringSeguro((resultado as { error: unknown }).error);
      }

      if (mensajeError) {
        const mensajeAmigable = obtenerMensajeError(mensajeError);

        if (esErrorEmailDuplicado(mensajeError)) {
          setErrorCorreo('Este correo ya está registrado. Probá iniciar sesión.');
        }

        toast.error(mensajeAmigable);
        return;
      }

      toast.exito('¡Cuenta creada con éxito! 🎉');
      setTimeout(() => {
        try {
          props.navigation.goBack();
        } catch {
          // Silencioso
        }
      }, 1500);

    } catch (error) {
      console.error('❌ [Registro] Error inesperado:', error);
      toast.error('❌ Algo salió mal. Intentá de nuevo en unos segundos.');
    } finally {
      setCargando(false);
      enviandoRef.current = false;
    }
  }, [
    cargando,
    nombre,
    correo,
    telefono,
    contrasena,
    terminosAceptados,
    toast,
    registrarCliente,
    verificarEmailExistente,
    props.navigation,
  ]);

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

  const logoSize = responsive.getValor({ tablet: 180, normal: 150, small: 120 });
  const tituloSize = responsive.getValor({ tablet: 36, normal: 30, small: 26 });

  const labelSize = responsive.getValor({ tablet: 15, normal: 14, small: 12 });
  const inputSize = responsive.getValor({ tablet: 17, normal: 13, small: 14 });
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
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100%',
              },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={estilos.contenidoCentral}>

              {/* LOGO */}
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
                      { width: logoSize, height: logoSize },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                  ¡Crear Cuenta!
                </Text>
              </Animated.View>

              {/* BANNER DE PUNTOS */}
              <View style={estilos.bannerPuntosContainer}>
                <LinearGradient
                  colors={[DISENO.colors.accentSecondary, DISENO.colors.accentSecondaryLight]}
                  style={estilos.bannerPuntosGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={estilos.bannerPuntosEmoji}>🎁</Text>
                  <View style={estilos.bannerPuntosTextos}>
                    <Text style={[estilos.bannerPuntosTitulo, { fontSize: isTablet ? 17 : 14 }]}>
                      ¡Regístrate y obtén 500 puntos!
                    </Text>
                    <Text style={[estilos.bannerPuntosDesc, { fontSize: isTablet ? 13 : 11 }]}>
                      Canjealos por descuentos, envíos gratis y más
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* FORMULARIO */}
              <Animated.View
                style={[
                  estilos.formulario,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                    width: '100%',
                    maxWidth: 500,
                    alignSelf: 'center',
                  },
                ]}
              >
                <Text style={[estilos.label, { fontSize: labelSize }]}>Nombre</Text>
                <View style={estilos.inputContainer}>
                  <Ionicons name="person-outline" size={22} color={DISENO.colors.textTertiary} style={estilos.inputIcon} />
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                  />
                </View>

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
                  Correo electrónico
                </Text>
                <View
                  style={[
                    estilos.inputContainer,
                    errorCorreo && { borderColor: DISENO.colors.accent, borderWidth: 2 },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={errorCorreo ? DISENO.colors.accent : DISENO.colors.textTertiary}
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
                    autoCorrect={false}
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                  />
                  {errorCorreo && (
                    <Ionicons name="alert-circle" size={20} color={DISENO.colors.accent} />
                  )}
                </View>

                {errorCorreo && (
                  <View style={estilos.errorCorreoContainer}>
                    <Ionicons name="alert-circle-outline" size={14} color={DISENO.colors.accent} />
                    <Text style={[estilos.errorCorreoTexto, { fontSize: isTablet ? 13 : 11 }]}>
                      {errorCorreo}
                    </Text>
                  </View>
                )}

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>Teléfono</Text>
                <View style={estilos.inputContainer}>
                  <Ionicons name="call-outline" size={22} color={DISENO.colors.textTertiary} style={estilos.inputIcon} />
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Tu teléfono"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    keyboardType="phone-pad"
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                  />
                </View>

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>Contraseña</Text>
                <View style={estilos.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color={DISENO.colors.textTertiary} style={estilos.inputIcon} />
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                    value={contrasena}
                    onChangeText={setContrasena}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    secureTextEntry={!mostrarContrasena}
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                  />
                  <TouchableOpacity onPress={() => setMostrarContrasena(!mostrarContrasena)} style={estilos.eyeButton}>
                    <Ionicons
                      name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color={DISENO.colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>

                {/* TÉRMINOS Y PRIVACIDAD */}
                <View style={estilos.legalContainer}>
                  <TouchableOpacity
                    style={estilos.terminosCheckboxContainer}
                    onPress={() => setTerminosAceptados(!terminosAceptados)}
                    activeOpacity={0.7}
                    disabled={cargando}
                  >
                    <View
                      style={[
                        estilos.checkbox,
                        {
                          borderColor: terminosAceptados ? DISENO.colors.accent : DISENO.colors.azul,
                          backgroundColor: terminosAceptados ? DISENO.colors.accent : 'transparent',
                        },
                      ]}
                    >
                      {terminosAceptados && (
                        <Ionicons name="checkmark" size={14} color={DISENO.colors.surface} />
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

                  <View style={estilos.legalDivisor} />

                  <View style={estilos.legalLinksContainer}>
                    <TouchableOpacity
                      style={estilos.legalLinkItem}
                      onPress={() => props.navigation.navigate('Terminos')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text-outline" size={14} color={DISENO.colors.accent} />
                      <Text style={[estilos.legalLinkTexto, { fontSize: isTablet ? 12 : 11 }]}>Términos</Text>
                    </TouchableOpacity>

                    <View style={estilos.legalLinkSeparador} />

                    <TouchableOpacity
                      style={estilos.legalLinkItem}
                      onPress={() => props.navigation.navigate('Privacidad')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shield-checkmark-outline" size={14} color={DISENO.colors.accent} />
                      <Text style={[estilos.legalLinkTexto, { fontSize: isTablet ? 12 : 11 }]}>Privacidad</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[estilos.boton, cargando && { opacity: 0.7 }]}
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
                      <ActivityIndicator color={DISENO.colors.surface} size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={buttonTextSize + 4} color={DISENO.colors.surface} />
                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>Crear Cuenta</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={estilos.enlacesContainer}>
                  <TouchableOpacity onPress={() => props.navigation.goBack()} activeOpacity={0.6}>
                    <Text style={[estilos.enlace, { fontSize: isTablet ? 16 : 14 }]}>
                      ¿Ya tienes cuenta?{' '}
                      <Text style={estilos.enlaceDestacado}>Inicia sesión</Text>
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
                  <Ionicons name="person-outline" size={20} color={DISENO.colors.textTertiary} />
                  <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 16 : 14 }]}>
                    Continuar como invitado
                  </Text>
                </TouchableOpacity>
              </Animated.View>

            </View>
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

// ============================================================
// 🎨 ESTILOS - CON TIPOGRAFÍA SIMPSON
// ============================================================
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: DISENO.colors.fondo },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  contenidoCentral: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 12,
    ...DISENO.shadow.lg,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.25,
  },
  logoImage: { backgroundColor: 'transparent', borderRadius: 100 },
  // ✅ TÍTULO CON SIMPSONFONT
  titulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
    width: '70%',
  },
  bannerPuntosContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginBottom: 12,
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
  bannerPuntosEmoji: { fontSize: 32 },
  bannerPuntosTextos: { flex: 1 },
  // ✅ BANNER TÍTULO CON SIMPSONFONT
  bannerPuntosTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  // ✅ BANNER DESCRIPCIÓN CON FUENTE REGULAR
  bannerPuntosDesc: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  formulario: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: DISENO.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...DISENO.shadow.md,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  // ✅ LABEL CON SIMPSONFONT
  label: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
  inputIcon: { marginRight: 12 },
  // ✅ INPUT CON FUENTE REGULAR
  input: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    paddingVertical: 12,
    paddingRight: 8,
    flex: 1,
  },
  eyeButton: { padding: 4 },
  // ✅ ERROR CON FUENTE REGULAR
  errorCorreoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorCorreoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accent,
    fontWeight: '600',
    flex: 1,
  },
  legalContainer: {
    marginTop: 20,
    width: '100%',
    backgroundColor: DISENO.colors.fondo,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  terminosCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  // ✅ CHECKBOX TEXTO CON FUENTE REGULAR
  terminosCheckboxTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '400',
    flex: 1,
    lineHeight: 18,
  },
  // ✅ LINK DE TÉRMINOS CON SIMPSONFONT
  terminosLink: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
    textDecorationLine: 'underline',
  },
  legalDivisor: {
    height: 1,
    backgroundColor: DISENO.colors.border,
    marginVertical: 12,
    width: '100%',
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  legalLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  // ✅ LEGAL LINK CON SIMPSONFONT
  legalLinkTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
  },
  legalLinkSeparador: {
    width: 1,
    height: 14,
    backgroundColor: DISENO.colors.border,
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
  // ✅ BOTÓN TEXTO CON SIMPSONFONT
  textoBoton: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    letterSpacing: 1.5,
  },
  enlacesContainer: { marginTop: 18, alignItems: 'center' },
  // ✅ ENLACE CON FUENTE REGULAR
  enlace: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
  },
  // ✅ ENLACE DESTACADO CON SIMPSONFONT
  enlaceDestacado: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
  },
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  separador: { flex: 1, height: 1, backgroundColor: DISENO.colors.border },
  // ✅ SEPARADOR TEXTO CON SIMPSONFONT
  separadorTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.textTertiary,
    paddingHorizontal: 16,
    fontSize: 12,
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
  // ✅ BOTÓN INVITADO CON FUENTE REGULAR
  botonInvitadoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});