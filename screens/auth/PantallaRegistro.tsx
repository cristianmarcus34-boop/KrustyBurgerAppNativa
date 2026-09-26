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
const COLOR_TEXTO_SECUNDARIO = '#5F6368';
const COLOR_TEXTO_DETALLE = '#687078';
const COLOR_PUNTOS = '#705300';

type CampoRegistro = 'nombre' | 'correo' | 'telefono' | 'contrasena' | 'terminos';
type ErroresRegistro = Partial<Record<CampoRegistro, string>>;

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
  const [erroresCampos, setErroresCampos] = useState<ErroresRegistro>({});

  const { registrarCliente } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const enviandoRef = useRef(false);
  const nombreInputRef = useRef<TextInput>(null);
  const correoInputRef = useRef<TextInput>(null);
  const telefonoInputRef = useRef<TextInput>(null);
  const contrasenaInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

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

    try {
      const nombreTrim = nombre.trim();
      const correoTrim = correo.trim().toLowerCase();
      const telefonoTrim = telefono.trim();
      const errores: ErroresRegistro = {};

      if (!nombreTrim) errores.nombre = 'Ingresá tu nombre completo.';
      if (!correoTrim) {
        errores.correo = 'Ingresá tu correo electrónico.';
      } else if (!esEmailValido(correoTrim)) {
        errores.correo = 'Revisá el formato del correo electrónico.';
      }
      if (!telefonoTrim) {
        errores.telefono = 'Ingresá tu teléfono con código de área.';
      } else if (telefonoTrim.replace(/\D/g, '').length < 8) {
        errores.telefono = 'Ingresá un teléfono válido con código de área.';
      }
      if (!contrasena) {
        errores.contrasena = 'Creá una contraseña.';
      } else if (contrasena.length < 6) {
        errores.contrasena = 'Usá al menos 6 caracteres.';
      }
      if (!terminosAceptados) {
        errores.terminos = 'Necesitamos tu aceptación para crear la cuenta.';
      }

      setErroresCampos(errores);
      const camposEnOrden: Array<Exclude<CampoRegistro, 'terminos'>> = [
        'nombre',
        'correo',
        'telefono',
        'contrasena',
      ];
      const primerCampoConError = camposEnOrden.find((campo) => errores[campo]);
      if (primerCampoConError) {
        const refs: Record<Exclude<CampoRegistro, 'terminos'>, React.RefObject<TextInput | null>> = {
          nombre: nombreInputRef,
          correo: correoInputRef,
          telefono: telefonoInputRef,
          contrasena: contrasenaInputRef,
        };
        refs[primerCampoConError].current?.focus();
        return;
      }
      if (errores.terminos) return;

      setCargando(true);

      const emailExiste = await verificarEmailExistente(correoTrim);

      if (emailExiste === true) {
        setErroresCampos((prev) => ({
          ...prev,
          correo: 'Este correo ya está registrado. Probá iniciar sesión.',
        }));
        toast.error('📧 Este correo ya está registrado. Probá iniciar sesión o usá otro correo.');
        return;
      }

      let resultado: Awaited<ReturnType<typeof registrarCliente>>;
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
          setErroresCampos((prev) => ({
            ...prev,
            correo: 'Este correo ya está registrado. Probá iniciar sesión.',
          }));
        }

        toast.error(mensaje);
        return;
      }

      if (!resultado.success) {
        const mensajeAmigable = obtenerMensajeError(resultado.error);

        if (esErrorEmailDuplicado(resultado.error)) {
          setErroresCampos((prev) => ({
            ...prev,
            correo: 'Este correo ya está registrado. Probá iniciar sesión.',
          }));
        }

        toast.error(mensajeAmigable);
        return;
      }

      if (resultado.requiereConfirmacionCorreo) {
        toast.info('Cuenta creada. Revisá tu correo y confirmá la dirección para poder ingresar.');
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

  const { height: screenHeight, width: screenWidth, isTablet, isSmallPhone } = responsive;
  const isCompactHeight = screenHeight < 820;
  const isVeryCompactHeight = screenHeight < 700;

  const logoSize = isCompactHeight
    ? responsive.getValor({ tablet: 88, normal: 78, small: 68 })
    : responsive.getValor({ tablet: 150, normal: 125, small: 105 });
  const tituloSize = responsive.getValor({ tablet: 30, normal: 27, small: 24 });

  const labelSize = Math.max(14, responsive.getValor({ tablet: 16, normal: 14, small: 13 }));
  const inputSize = Math.max(16, responsive.getValor({ tablet: 17, normal: 16, small: 15 }));
  const buttonTextSize = Math.max(16, responsive.getValor({ tablet: 19, normal: 17, small: 15 }));
  const paddingHorizontal = responsive.getValor({ tablet: 32, normal: 20, small: 16 });
  const paddingTop = insets.top + (isCompactHeight ? 4 : responsive.spacing(12));
  const paddingBottom = insets.bottom + (isCompactHeight ? 8 : 20);
  const cardPadding = isCompactHeight
    ? responsive.getValor({ tablet: 16, normal: 14, small: 12 })
    : responsive.getValor({ tablet: 24, normal: 20, small: 16 });
  const fieldSpacing = isCompactHeight ? 8 : 16;
  const inputHeight = isCompactHeight ? 50 : 56;
  const maxContentWidth = isTablet ? Math.min(screenWidth - paddingHorizontal * 2, 520) : 500;
  const textoBannerSize = Math.max(14, responsive.getValor({ tablet: 16, normal: 14, small: 13 }));
  const textoLegalSize = Math.max(14, responsive.getValor({ tablet: 15, normal: 14, small: 13 }));

  return (
    <>
      <LinearGradient
        colors={['#FFF9EF', '#FFF2E5']}
        style={estilos.contenedor}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View pointerEvents="none" style={estilos.fondoDecorativo}>
          <View style={[estilos.manchaFondo, estilos.manchaAmarilla]} />
          <View style={[estilos.manchaFondo, estilos.manchaCoral]} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          style={estilos.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              estilos.scroll,
              {
                paddingHorizontal: paddingHorizontal,
                paddingTop: paddingTop,
                paddingBottom,
                flexGrow: 1,
                justifyContent: isCompactHeight ? 'flex-start' : 'center',
                alignItems: 'center',
                minHeight: isCompactHeight ? undefined : '100%',
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={[estilos.contenidoCentral, { maxWidth: maxContentWidth }]}>

              {/* LOGO */}
              <Animated.View
                style={[
                  estilos.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    marginBottom: isCompactHeight ? 8 : 14,
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

                <Text style={[estilos.titulo, { fontSize: tituloSize }]} accessibilityRole="header">
                  Creá tu cuenta
                </Text>
                {!isCompactHeight && (
                  <Text style={estilos.subtitulo}>
                    Sumate a Krusty Burger y empezá a disfrutar.
                  </Text>
                )}
              </Animated.View>

              <View
                style={[
                  estilos.bannerPuntosContainer,
                  {
                    padding: isCompactHeight || isSmallPhone ? 8 : 14,
                    marginBottom: isCompactHeight ? 6 : 12,
                  },
                ]}
                accessibilityLabel="Beneficio de bienvenida: 500 puntos"
              >
                <View
                  style={[
                    estilos.bannerPuntosIcono,
                    isCompactHeight && { width: 34, height: 34, borderRadius: 17 },
                  ]}
                >
                  <Ionicons name="gift-outline" size={isCompactHeight ? 18 : 22} color={COLOR_PUNTOS} />
                </View>
                <View style={estilos.bannerPuntosTextos}>
                  <Text style={[estilos.bannerPuntosTitulo, { fontSize: textoBannerSize }]}>
                    500 puntos de bienvenida
                  </Text>
                  {!isCompactHeight && (
                    <Text style={estilos.bannerPuntosDesc}>
                      Canjealos por descuentos y envíos gratis
                    </Text>
                  )}
                </View>
              </View>

              {/* FORMULARIO */}
              <Animated.View
                style={[
                  estilos.formulario,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                    padding: cardPadding,
                    width: '100%',
                    maxWidth: 500,
                    alignSelf: 'center',
                  },
                ]}
              >
                <Text style={[estilos.label, { fontSize: labelSize, marginBottom: isCompactHeight ? 4 : 7 }]}>Nombre completo</Text>
                <View style={[estilos.inputContainer, { height: inputHeight }, erroresCampos.nombre && estilos.inputError]}>
                  <Ionicons name="person-outline" size={22} color={COLOR_TEXTO_DETALLE} style={estilos.inputIcon} />
                  <TextInput
                    ref={nombreInputRef}
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={nombre}
                    onChangeText={(valor) => {
                      setNombre(valor);
                      setErroresCampos((prev) => ({ ...prev, nombre: undefined }));
                    }}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={COLOR_TEXTO_DETALLE}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    importantForAutofill="yes"
                    accessibilityLabel="Nombre completo"
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                    returnKeyType="next"
                    onSubmitEditing={() => correoInputRef.current?.focus()}
                  />
                </View>
                {erroresCampos.nombre && (
                  <Text style={estilos.errorCampo} accessibilityLiveRegion="polite">{erroresCampos.nombre}</Text>
                )}

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: fieldSpacing, marginBottom: isCompactHeight ? 4 : 7 }]}>
                  Correo electrónico
                </Text>
                <View
                  style={[
                    estilos.inputContainer,
                    { height: inputHeight },
                    erroresCampos.correo && estilos.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={erroresCampos.correo ? DISENO.colors.danger : COLOR_TEXTO_DETALLE}
                    style={estilos.inputIcon}
                  />
                  <TextInput
                    ref={correoInputRef}
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={correo}
                    onChangeText={(valor) => {
                      setCorreo(valor);
                      setErroresCampos((prev) => ({ ...prev, correo: undefined }));
                    }}
                    placeholder="nombre@correo.com"
                    placeholderTextColor={COLOR_TEXTO_DETALLE}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    importantForAutofill="yes"
                    accessibilityLabel="Correo electrónico"
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                    returnKeyType="next"
                    onSubmitEditing={() => telefonoInputRef.current?.focus()}
                  />
                  {erroresCampos.correo && (
                    <Ionicons name="alert-circle" size={20} color={DISENO.colors.danger} />
                  )}
                </View>

                {erroresCampos.correo && (
                  <View style={estilos.errorCorreoContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color={DISENO.colors.danger} />
                    <Text style={estilos.errorCorreoTexto} accessibilityLiveRegion="polite">
                      {erroresCampos.correo}
                    </Text>
                  </View>
                )}

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: fieldSpacing, marginBottom: isCompactHeight ? 4 : 7 }]}>Teléfono (obligatorio)</Text>
                <View style={[estilos.inputContainer, { height: inputHeight }, erroresCampos.telefono && estilos.inputError]}>
                  <Ionicons name="call-outline" size={22} color={COLOR_TEXTO_DETALLE} style={estilos.inputIcon} />
                  <TextInput
                    ref={telefonoInputRef}
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={telefono}
                    onChangeText={(valor) => {
                      setTelefono(valor);
                      setErroresCampos((prev) => ({ ...prev, telefono: undefined }));
                    }}
                    placeholder="Ej. 11 1234 5678"
                    placeholderTextColor={COLOR_TEXTO_DETALLE}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    importantForAutofill="yes"
                    accessibilityLabel="Teléfono obligatorio, incluí el código de área"
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                    returnKeyType="next"
                    onSubmitEditing={() => contrasenaInputRef.current?.focus()}
                  />
                </View>
                {erroresCampos.telefono && (
                  <Text style={estilos.errorCampo} accessibilityLiveRegion="polite">{erroresCampos.telefono}</Text>
                )}

                <Text style={[estilos.label, { fontSize: labelSize, marginTop: fieldSpacing, marginBottom: isCompactHeight ? 4 : 7 }]}>Contraseña</Text>
                <View style={[estilos.inputContainer, { height: inputHeight }, erroresCampos.contrasena && estilos.inputError]}>
                  <Ionicons name="lock-closed-outline" size={22} color={COLOR_TEXTO_DETALLE} style={estilos.inputIcon} />
                  <TextInput
                    ref={contrasenaInputRef}
                    style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                    value={contrasena}
                    onChangeText={(valor) => {
                      setContrasena(valor);
                      setErroresCampos((prev) => ({ ...prev, contrasena: undefined }));
                    }}
                    placeholder="Mín. 6 caracteres"
                    placeholderTextColor={COLOR_TEXTO_DETALLE}
                    secureTextEntry={!mostrarContrasena}
                    autoComplete="new-password"
                    importantForAutofill="yes"
                    accessibilityLabel="Contraseña"
                    selectionColor={DISENO.colors.accent}
                    editable={!cargando}
                    returnKeyType="done"
                    onSubmitEditing={manejarRegistro}
                  />
                  <TouchableOpacity
                    onPress={() => setMostrarContrasena(!mostrarContrasena)}
                    style={estilos.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color={COLOR_TEXTO_DETALLE}
                    />
                  </TouchableOpacity>
                </View>
                {!isVeryCompactHeight && (
                  <Text style={estilos.passwordHint}>Mínimo 6 caracteres</Text>
                )}
                {erroresCampos.contrasena && (
                  <Text style={estilos.errorCampo} accessibilityLiveRegion="polite">{erroresCampos.contrasena}</Text>
                )}

                {/* TÉRMINOS Y PRIVACIDAD */}
                <View
                  style={[
                    estilos.legalContainer,
                    isCompactHeight && { marginTop: 8, padding: 8 },
                  ]}
                >
                  <View style={estilos.terminosCheckboxContainer}>
                    <TouchableOpacity
                      style={estilos.checkboxAction}
                      onPress={() => {
                        setTerminosAceptados(!terminosAceptados);
                        setErroresCampos((prev) => ({ ...prev, terminos: undefined }));
                      }}
                      activeOpacity={0.7}
                      disabled={cargando}
                      accessibilityRole="checkbox"
                      accessibilityLabel="Acepto los Términos y Condiciones"
                      accessibilityState={{ checked: terminosAceptados, disabled: cargando }}
                    >
                      <View
                        style={[
                          estilos.checkbox,
                          {
                            borderColor: terminosAceptados ? DISENO.colors.accent : COLOR_TEXTO_DETALLE,
                            backgroundColor: terminosAceptados ? DISENO.colors.accent : 'transparent',
                          },
                        ]}
                      >
                        {terminosAceptados && (
                          <Ionicons name="checkmark" size={14} color={DISENO.colors.surface} />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={estilos.terminosTextos}>
                      <Text style={[estilos.terminosCheckboxTexto, { fontSize: textoLegalSize }]}>
                        Acepto los términos y condiciones.
                      </Text>
                      <TouchableOpacity
                        style={estilos.legalLinkItem}
                        onPress={() => props.navigation.navigate('Terminos')}
                        activeOpacity={0.7}
                        accessibilityRole="link"
                      >
                        <Text style={[estilos.terminosLink, { fontSize: textoLegalSize }]}>
                          Leer Términos y Condiciones
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {erroresCampos.terminos && (
                    <Text style={estilos.errorCampo} accessibilityLiveRegion="polite">
                      {erroresCampos.terminos}
                    </Text>
                  )}

                  <View style={[estilos.legalDivisor, isCompactHeight && { marginVertical: 4 }]} />

                  <View style={estilos.legalLinksContainer}>
                    <TouchableOpacity
                      style={estilos.legalLinkItem}
                      onPress={() => props.navigation.navigate('Privacidad')}
                      activeOpacity={0.7}
                      accessibilityRole="link"
                    >
                      <Ionicons name="shield-checkmark-outline" size={16} color={DISENO.colors.accent} />
                      <Text style={[estilos.legalLinkTexto, { fontSize: textoLegalSize }]}>Leer Política de Privacidad</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    estilos.boton,
                    isCompactHeight && { marginTop: 10 },
                    cargando && { opacity: 0.7 },
                  ]}
                  onPress={manejarRegistro}
                  disabled={cargando}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={cargando ? 'Creando cuenta' : 'Crear cuenta'}
                  accessibilityState={{ disabled: cargando, busy: cargando }}
                >
                  <LinearGradient
                    colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                    style={[
                      estilos.botonGradient,
                      isCompactHeight && { paddingVertical: 12 },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {cargando ? (
                      <ActivityIndicator color={DISENO.colors.surface} size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={buttonTextSize + 4} color={DISENO.colors.surface} />
                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                          {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={[estilos.enlacesContainer, isCompactHeight && { marginTop: 4 }]}>
                  <TouchableOpacity
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.6}
                    style={estilos.enlaceAccion}
                    accessibilityRole="button"
                    accessibilityLabel="Volver e iniciar sesión"
                  >
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
                  accessibilityRole="button"
                  accessibilityLabel="Continuar como invitado"
                >
                  <Ionicons name="person-outline" size={20} color={COLOR_TEXTO_DETALLE} />
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
  contenedor: { flex: 1, backgroundColor: '#FFF6EA' },
  fondoDecorativo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  manchaFondo: {
    position: 'absolute',
    borderRadius: 999,
  },
  manchaAmarilla: {
    width: 250,
    height: 250,
    top: -125,
    right: -95,
    backgroundColor: '#F5C518',
    opacity: 0.13,
  },
  manchaCoral: {
    width: 210,
    height: 210,
    bottom: -115,
    left: -100,
    backgroundColor: '#E53935',
    opacity: 0.08,
  },
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
    marginBottom: 14,
  },
  logoWrapper: {
    marginBottom: 8,
    ...DISENO.shadow.lg,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.25,
  },
  logoImage: { backgroundColor: 'transparent', borderRadius: 100 },
  titulo: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DISENO.colors.text,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FUENTES.regular,
    fontSize: 14,
    color: COLOR_TEXTO_SECUNDARIO,
    textAlign: 'center',
    marginTop: 4,
  },
  bannerPuntosContainer: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    backgroundColor: '#FFF8DB',
    borderWidth: 1,
    borderColor: '#F0D675',
  },
  bannerPuntosIcono: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#FCEAA5',
  },
  bannerPuntosTextos: { flex: 1 },
  bannerPuntosTitulo: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: COLOR_PUNTOS,
  },
  bannerPuntosDesc: {
    fontFamily: FUENTES.regular,
    fontSize: 13,
    color: COLOR_TEXTO_SECUNDARIO,
    marginTop: 3,
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
  label: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.text,
    marginBottom: 7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
    paddingHorizontal: 14,
    height: 56,
  },
  inputError: {
    borderColor: DISENO.colors.danger,
    backgroundColor: '#FFF7F6',
  },
  inputIcon: { marginRight: 12 },
  input: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    height: '100%',
    paddingVertical: 0,
    paddingTop: 0,
    paddingRight: 8,
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHint: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_DETALLE,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  errorCampo: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger,
    fontSize: 14,
    marginTop: 5,
    marginLeft: 4,
  },
  errorCorreoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorCorreoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger,
    fontSize: 14,
    flex: 1,
  },
  legalContainer: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#FFFDF7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  terminosCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
  },
  checkboxAction: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transform: [{ translateY: -10 }],
  },
  terminosTextos: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 2,
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
  terminosCheckboxTexto: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    fontWeight: '500',
    lineHeight: 20,
  },
  terminosLink: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  legalLinkTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.accent,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    letterSpacing: 1.5,
  },
  enlacesContainer: { marginTop: 12, alignItems: 'center' },
  enlaceAccion: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  enlace: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    fontWeight: '500',
  },
  enlaceDestacado: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DISENO.colors.accent,
  },
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  separador: { flex: 1, height: 1, backgroundColor: DISENO.colors.border },
  separadorTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: COLOR_TEXTO_DETALLE,
    paddingHorizontal: 16,
    fontSize: 12,
  },
  botonInvitado: {
    minHeight: 48,
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
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});