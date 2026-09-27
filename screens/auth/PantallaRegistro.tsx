// screens/auth/PantallaRegistro.tsx - V2 RESPONSIVE 100% (Galaxy A20 friendly)
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Keyboard,
  useWindowDimensions,
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
// 🛡️ HELPERS (a prueba de balas)
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
  if (!mensaje) return '❌ No pudimos crear tu cuenta. Intentá de nuevo en unos segundos.';
  for (const item of MENSAJES_ERROR) {
    if (mensaje.includes(item.match)) return item.mensaje;
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

const validarCampoRegistro = (
  campo: Exclude<CampoRegistro, 'terminos'>,
  valor: string,
) => {
  switch (campo) {
    case 'nombre':
      return valor.trim() ? undefined : 'Ingresá tu nombre completo.';
    case 'correo':
      if (!valor.trim()) return 'Ingresá tu correo electrónico.';
      return esEmailValido(valor) ? undefined : 'Revisá el formato del correo electrónico.';
    case 'telefono':
      if (!valor.trim()) return 'Ingresá tu teléfono con código de área.';
      return valor.replace(/\D/g, '').length >= 8
        ? undefined
        : 'Ingresá un teléfono válido con código de área.';
    case 'contrasena':
      if (!valor) return 'Creá una contraseña.';
      return valor.length >= 6 ? undefined : 'Usá al menos 6 caracteres.';
  }
};

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosRegistro {
  paddingHorizontal: number;
  maxContentWidth: number;
  cardPadding: number;
  // Logo y header
  logoSize: number;
  logoMarginBottom: number;
  tituloSize: number;
  subtituloSize: number;
  // Inputs
  inputHeight: number;
  inputPaddingH: number;
  inputRadius: number;
  inputSize: number;
  iconSize: number;
  eyeButtonSize: number;
  // Labels y textos
  labelSize: number;
  errorSize: number;
  hintSize: number;
  bannerTextSize: number;
  bannerDescSize: number;
  legalSize: number;
  enlaceSize: number;
  // Botones
  buttonTextSize: number;
  buttonPaddingV: number;
  buttonRadius: number;
  // Espaciados
  fieldSpacing: number;
  labelMarginBottom: number;
  bannerPadding: number;
  bannerIconSize: number;
  bannerIconContainerSize: number;
  checkboxSize: number;
}

const calcularTamanosRegistro = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,
): TamanosRegistro => {
  const isCompactHeight = height < 820;
  const isVeryCompactHeight = height < 700;

  // Padding lateral
  const paddingHorizontal = isDesktop
    ? 40
    : isTablet
      ? 32
      : isSmallPhone
        ? 16
        : 20;

  // Ancho máximo del contenido
  const maxContentWidth = isDesktop
    ? Math.min(width - paddingHorizontal * 2, 520)
    : isTablet
      ? Math.min(width - paddingHorizontal * 2, 520)
      : 500;

  // Padding de la card
  const cardPadding = isDesktop
    ? 28
    : isTablet
      ? 24
      : isCompactHeight
        ? 14
        : isSmallPhone
          ? 16
          : 20;

  // Logo
  const logoBase = isCompactHeight ? 0.35 : 0.42;
  const anchoUtil = Math.min(width - paddingHorizontal * 2, maxContentWidth);
  const logoSize = isDesktop
    ? 150
    : isTablet
      ? 140
      : isSmallPhone
        ? Math.min(anchoUtil * logoBase, 100)
        : Math.min(anchoUtil * logoBase, 125);

  const logoMarginBottom = isCompactHeight ? 6 : 12;

  // Títulos
  const tituloSize = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 22 : 26;
  const subtituloSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13.5;

  // Inputs
  const inputHeight = isDesktop
    ? 58
    : isTablet
      ? 56
      : isCompactHeight || isSmallPhone
        ? 50
        : 54;

  const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
  const inputRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
  const inputSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13.5 : 14.5;
  const iconSize = isDesktop ? 22 : isTablet ? 22 : isSmallPhone ? 18 : 20;
  const eyeButtonSize = isSmallPhone ? 40 : 44;

  // Textos
  const labelSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12.5 : 13.5;
  const errorSize = isDesktop ? 14 : isTablet ? 13.5 : isSmallPhone ? 12 : 13;
  const hintSize = isDesktop ? 13 : isTablet ? 13 : isSmallPhone ? 11.5 : 12.5;
  const bannerTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 13 : 14;
  const bannerDescSize = isDesktop ? 13 : isTablet ? 13 : isSmallPhone ? 11.5 : 12.5;
  const legalSize = isDesktop ? 14 : isTablet ? 13.5 : isSmallPhone ? 12 : 13;
  const enlaceSize = isDesktop ? 15 : isTablet ? 14.5 : isSmallPhone ? 13 : 14;

  // Botones
  const buttonTextSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 15 : 16;
  const buttonPaddingV = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const buttonRadius = isSmallPhone ? 12 : 14;

  // Espaciados
  const fieldSpacing = isCompactHeight ? 8 : isSmallPhone ? 12 : 14;
  const labelMarginBottom = isCompactHeight ? 4 : 6;

  // Banner
  const bannerPadding = isCompactHeight || isSmallPhone ? 8 : 12;
  const bannerIconSize = isCompactHeight ? 18 : 22;
  const bannerIconContainerSize = isCompactHeight ? 34 : 42;

  // Checkbox
  const checkboxSize = isDesktop ? 24 : isSmallPhone ? 20 : 22;

  return {
    paddingHorizontal,
    maxContentWidth,
    cardPadding,
    logoSize,
    logoMarginBottom,
    tituloSize,
    subtituloSize,
    inputHeight,
    inputPaddingH,
    inputRadius,
    inputSize,
    iconSize,
    eyeButtonSize,
    labelSize,
    errorSize,
    hintSize,
    bannerTextSize,
    bannerDescSize,
    legalSize,
    enlaceSize,
    buttonTextSize,
    buttonPaddingV,
    buttonRadius,
    fieldSpacing,
    labelMarginBottom,
    bannerPadding,
    bannerIconSize,
    bannerIconContainerSize,
    checkboxSize,
  };
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
  const [correoPendienteConfirmacion, setCorreoPendienteConfirmacion] = useState<string | null>(null);
  const [reenviandoConfirmacion, setReenviandoConfirmacion] = useState(false);
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  const { registrarCliente } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const toast = useToast();

  // ✅ HOOK REACTIVO A ROTACIÓN
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const tamanos = useMemo(
    () =>
      calcularTamanosRegistro(
        screenWidth,
        screenHeight,
        responsive.isTablet,
        responsive.isDesktop,
        responsive.isSmallPhone,
      ),
    [screenWidth, screenHeight, responsive.isTablet, responsive.isDesktop, responsive.isSmallPhone],
  );

  const isCompactHeight = screenHeight < 820;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const enviandoRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
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

  useEffect(() => {
    if (esperaReenvio <= 0) return;
    const temporizador = setTimeout(() => {
      setEsperaReenvio((actual) => Math.max(0, actual - 1));
    }, 1000);
    return () => clearTimeout(temporizador);
  }, [esperaReenvio]);

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
        Keyboard.dismiss();
        setCorreoPendienteConfirmacion(correoTrim);
        setEsperaReenvio(60);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
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

  const reenviarCorreoConfirmacion = async () => {
    if (!correoPendienteConfirmacion || reenviandoConfirmacion || esperaReenvio > 0) return;
    setReenviandoConfirmacion(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: correoPendienteConfirmacion,
      });
      if (error) {
        toast.error(obtenerMensajeError(error));
        return;
      }
      setEsperaReenvio(60);
      toast.exito('Listo, enviamos otro correo de confirmación.');
    } catch (error) {
      toast.error('No pudimos reenviar el correo. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setReenviandoConfirmacion(false);
    }
  };

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
            ref={scrollRef}
            contentContainerStyle={[
              estilos.scroll,
              {
                paddingHorizontal: tamanos.paddingHorizontal,
                paddingTop: insets.top + (isCompactHeight ? 4 : 12),
                paddingBottom: insets.bottom + (isCompactHeight ? 8 : 20),
                flexGrow: 1,
                justifyContent: isCompactHeight ? 'flex-start' : 'center',
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollsChildToFocus={Platform.OS === 'android'}
            bounces={false}
          >
            <View style={[estilos.contenidoCentral, { maxWidth: tamanos.maxContentWidth }]}>
              {/* ============ LOGO + TÍTULOS ============ */}
              <Animated.View
                style={[
                  estilos.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    marginBottom: tamanos.logoMarginBottom,
                  },
                ]}
              >
                <View style={estilos.logoWrapper}>
                  <Image
                    source={logoImage}
                    style={[
                      estilos.logoImage,
                      { width: tamanos.logoSize, height: tamanos.logoSize },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                <Text
                  style={[estilos.titulo, { fontSize: tamanos.tituloSize }]}
                  accessibilityRole="header"
                  allowFontScaling={false}
                  numberOfLines={2}
                >
                  {correoPendienteConfirmacion ? 'Revisá tu correo' : 'Creá tu cuenta'}
                </Text>
                {!isCompactHeight && !correoPendienteConfirmacion && (
                  <Text style={[estilos.subtitulo, { fontSize: tamanos.subtituloSize }]} allowFontScaling={false}>
                    Sumate a Krusty Burger y empezá a disfrutar.
                  </Text>
                )}
              </Animated.View>

              {correoPendienteConfirmacion ? (
                /* ============ CONFIRMACIÓN DE CORREO ============ */
                <View style={[estilos.confirmacionCard, { padding: tamanos.cardPadding }]}>
                  <View style={estilos.confirmacionIcono}>
                    <Ionicons name="mail-open-outline" size={30} color={DISENO.colors.accent} />
                  </View>
                  <Text
                    style={[estilos.confirmacionTitulo, { fontSize: tamanos.tituloSize - 4 }]}
                    allowFontScaling={false}
                  >
                    Un último paso
                  </Text>
                  <Text
                    style={[estilos.confirmacionTexto, { fontSize: tamanos.legalSize }]}
                    allowFontScaling={false}
                  >
                    Enviamos un enlace de confirmación a:
                  </Text>
                  <Text
                    style={[estilos.confirmacionCorreo, { fontSize: tamanos.legalSize + 2 }]}
                    selectable
                    allowFontScaling={false}
                    numberOfLines={2}
                  >
                    {correoPendienteConfirmacion}
                  </Text>
                  <Text
                    style={[estilos.confirmacionTexto, { fontSize: tamanos.legalSize }]}
                    allowFontScaling={false}
                  >
                    Abrí el correo para confirmar tu dirección. Si no lo encontrás, revisá Spam o Correo no deseado.
                  </Text>

                  <TouchableOpacity
                    style={[
                      estilos.confirmacionReenviar,
                      (esperaReenvio > 0 || reenviandoConfirmacion) && estilos.confirmacionReenviarDeshabilitado,
                    ]}
                    onPress={reenviarCorreoConfirmacion}
                    disabled={esperaReenvio > 0 || reenviandoConfirmacion}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: esperaReenvio > 0 || reenviandoConfirmacion,
                      busy: reenviandoConfirmacion,
                    }}
                  >
                    {reenviandoConfirmacion ? (
                      <ActivityIndicator color={DISENO.colors.accent} size="small" />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={18} color={DISENO.colors.accent} />
                        <Text
                          style={[estilos.confirmacionReenviarTexto, { fontSize: tamanos.legalSize }]}
                          allowFontScaling={false}
                        >
                          {esperaReenvio > 0 ? `Podés reenviar en ${esperaReenvio}s` : 'Reenviar correo'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={estilos.confirmacionVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[estilos.confirmacionVolverTexto, { fontSize: tamanos.enlaceSize }]}
                      allowFontScaling={false}
                    >
                      Volver al inicio de sesión
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* ============ BANNER PUNTOS ============ */}
                  <View
                    style={[
                      estilos.bannerPuntosContainer,
                      {
                        padding: tamanos.bannerPadding,
                        marginBottom: isCompactHeight ? 6 : 12,
                      },
                    ]}
                    accessibilityLabel="Beneficio de bienvenida: 500 puntos"
                  >
                    <View
                      style={[
                        estilos.bannerPuntosIcono,
                        {
                          width: tamanos.bannerIconContainerSize,
                          height: tamanos.bannerIconContainerSize,
                          borderRadius: tamanos.bannerIconContainerSize / 2,
                        },
                      ]}
                    >
                      <Ionicons name="gift-outline" size={tamanos.bannerIconSize} color={COLOR_PUNTOS} />
                    </View>
                    <View style={estilos.bannerPuntosTextos}>
                      <Text
                        style={[estilos.bannerPuntosTitulo, { fontSize: tamanos.bannerTextSize }]}
                        allowFontScaling={false}
                        numberOfLines={1}
                      >
                        500 puntos de bienvenida
                      </Text>
                      {!isCompactHeight && (
                        <Text
                          style={[estilos.bannerPuntosDesc, { fontSize: tamanos.bannerDescSize }]}
                          allowFontScaling={false}
                          numberOfLines={1}
                        >
                          Canjealos por descuentos y envíos gratis
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* ============ FORMULARIO ============ */}
                  <Animated.View
                    style={[
                      estilos.formulario,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        padding: tamanos.cardPadding,
                        maxWidth: tamanos.maxContentWidth,
                      },
                    ]}
                  >
                    {/* Nombre */}
                    <Text
                      style={[
                        estilos.label,
                        {
                          fontSize: tamanos.labelSize,
                          marginBottom: tamanos.labelMarginBottom,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Nombre completo
                    </Text>
                    <View
                      style={[
                        estilos.inputContainer,
                        {
                          height: tamanos.inputHeight,
                          paddingHorizontal: tamanos.inputPaddingH,
                          borderRadius: tamanos.inputRadius,
                        },
                        erroresCampos.nombre && estilos.inputError,
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={tamanos.iconSize}
                        color={COLOR_TEXTO_DETALLE}
                        style={estilos.inputIcon}
                      />
                      <TextInput
                        ref={nombreInputRef}
                        style={[estilos.input, { fontSize: tamanos.inputSize }]}
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
                        allowFontScaling={false}
                        onBlur={() =>
                          setErroresCampos((prev) => ({
                            ...prev,
                            nombre: validarCampoRegistro('nombre', nombre),
                          }))
                        }
                        onSubmitEditing={() => correoInputRef.current?.focus()}
                      />
                    </View>
                    {erroresCampos.nombre && (
                      <Text
                        style={[estilos.errorCampo, { fontSize: tamanos.errorSize }]}
                        accessibilityLiveRegion="polite"
                        allowFontScaling={false}
                      >
                        {erroresCampos.nombre}
                      </Text>
                    )}

                    {/* Correo */}
                    <Text
                      style={[
                        estilos.label,
                        {
                          fontSize: tamanos.labelSize,
                          marginTop: tamanos.fieldSpacing,
                          marginBottom: tamanos.labelMarginBottom,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Correo electrónico
                    </Text>
                    <View
                      style={[
                        estilos.inputContainer,
                        {
                          height: tamanos.inputHeight,
                          paddingHorizontal: tamanos.inputPaddingH,
                          borderRadius: tamanos.inputRadius,
                        },
                        erroresCampos.correo && estilos.inputError,
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={tamanos.iconSize}
                        color={erroresCampos.correo ? DISENO.colors.danger : COLOR_TEXTO_DETALLE}
                        style={estilos.inputIcon}
                      />
                      <TextInput
                        ref={correoInputRef}
                        style={[estilos.input, { fontSize: tamanos.inputSize }]}
                        value={correo}
                        onChangeText={(valor) => {
                          setCorreo(valor);
                          setErroresCampos((prev) => ({ ...prev, correo: undefined }));
                        }}
                        placeholder="tu@email.com"
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
                        allowFontScaling={false}
                        onBlur={() =>
                          setErroresCampos((prev) => ({
                            ...prev,
                            correo: validarCampoRegistro('correo', correo),
                          }))
                        }
                        onSubmitEditing={() => telefonoInputRef.current?.focus()}
                      />
                      {erroresCampos.correo && (
                        <Ionicons name="alert-circle" size={tamanos.iconSize} color={DISENO.colors.danger} />
                      )}
                    </View>
                    {erroresCampos.correo && (
                      <View style={estilos.errorCorreoContainer}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={tamanos.errorSize + 2}
                          color={DISENO.colors.danger}
                        />
                        <Text
                          style={[estilos.errorCorreoTexto, { fontSize: tamanos.errorSize }]}
                          accessibilityLiveRegion="polite"
                          allowFontScaling={false}
                        >
                          {erroresCampos.correo}
                        </Text>
                      </View>
                    )}

                    {/* Teléfono */}
                    <Text
                      style={[
                        estilos.label,
                        {
                          fontSize: tamanos.labelSize,
                          marginTop: tamanos.fieldSpacing,
                          marginBottom: tamanos.labelMarginBottom,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Teléfono con código de área (obligatorio)
                    </Text>
                    <View
                      style={[
                        estilos.inputContainer,
                        {
                          height: tamanos.inputHeight,
                          paddingHorizontal: tamanos.inputPaddingH,
                          borderRadius: tamanos.inputRadius,
                        },
                        erroresCampos.telefono && estilos.inputError,
                      ]}
                    >
                      <Ionicons
                        name="call-outline"
                        size={tamanos.iconSize}
                        color={COLOR_TEXTO_DETALLE}
                        style={estilos.inputIcon}
                      />
                      <TextInput
                        ref={telefonoInputRef}
                        style={[estilos.input, { fontSize: tamanos.inputSize }]}
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
                        accessibilityHint="Ingresá código de área y número, por ejemplo 11 1234 5678."
                        selectionColor={DISENO.colors.accent}
                        editable={!cargando}
                        returnKeyType="next"
                        allowFontScaling={false}
                        onBlur={() =>
                          setErroresCampos((prev) => ({
                            ...prev,
                            telefono: validarCampoRegistro('telefono', telefono),
                          }))
                        }
                        onSubmitEditing={() => contrasenaInputRef.current?.focus()}
                      />
                    </View>
                    {erroresCampos.telefono && (
                      <Text
                        style={[estilos.errorCampo, { fontSize: tamanos.errorSize }]}
                        accessibilityLiveRegion="polite"
                        allowFontScaling={false}
                      >
                        {erroresCampos.telefono}
                      </Text>
                    )}

                    {/* Contraseña */}
                    <Text
                      style={[
                        estilos.label,
                        {
                          fontSize: tamanos.labelSize,
                          marginTop: tamanos.fieldSpacing,
                          marginBottom: tamanos.labelMarginBottom,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Contraseña
                    </Text>
                    <View
                      style={[
                        estilos.inputContainer,
                        {
                          height: tamanos.inputHeight,
                          paddingHorizontal: tamanos.inputPaddingH,
                          borderRadius: tamanos.inputRadius,
                        },
                        erroresCampos.contrasena && estilos.inputError,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={tamanos.iconSize}
                        color={COLOR_TEXTO_DETALLE}
                        style={estilos.inputIcon}
                      />
                      <TextInput
                        ref={contrasenaInputRef}
                        style={[estilos.input, { fontSize: tamanos.inputSize }]}
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
                        allowFontScaling={false}
                        onBlur={() =>
                          setErroresCampos((prev) => ({
                            ...prev,
                            contrasena: validarCampoRegistro('contrasena', contrasena),
                          }))
                        }
                        onSubmitEditing={manejarRegistro}
                      />
                      <TouchableOpacity
                        onPress={() => setMostrarContrasena(!mostrarContrasena)}
                        style={[
                          estilos.eyeButton,
                          { width: tamanos.eyeButtonSize, height: tamanos.eyeButtonSize },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                        hitSlop={8}
                      >
                        <Ionicons
                          name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                          size={tamanos.iconSize}
                          color={COLOR_TEXTO_DETALLE}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={estilos.passwordHintContainer} accessibilityLiveRegion="polite">
                      <Ionicons
                        name={contrasena.length >= 6 ? 'checkmark-circle' : 'information-circle-outline'}
                        size={tamanos.hintSize + 3}
                        color={contrasena.length >= 6 ? '#2E7D32' : COLOR_TEXTO_DETALLE}
                      />
                      <Text
                        style={[
                          estilos.passwordHint,
                          { fontSize: tamanos.hintSize },
                          contrasena.length >= 6 && estilos.passwordHintSuccess,
                        ]}
                        allowFontScaling={false}
                      >
                        {contrasena.length >= 6
                          ? 'Requisito cumplido'
                          : contrasena.length > 0
                            ? `Te faltan ${6 - contrasena.length} caracteres`
                            : 'Mínimo 6 caracteres'}
                      </Text>
                    </View>
                    {erroresCampos.contrasena && (
                      <Text
                        style={[estilos.errorCampo, { fontSize: tamanos.errorSize }]}
                        accessibilityLiveRegion="polite"
                        allowFontScaling={false}
                      >
                        {erroresCampos.contrasena}
                      </Text>
                    )}

                    {/* Términos y privacidad */}
                    <View
                      style={[
                        estilos.legalContainer,
                        isCompactHeight && { marginTop: 8, padding: 8 },
                        { borderRadius: tamanos.inputRadius },
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
                                width: tamanos.checkboxSize,
                                height: tamanos.checkboxSize,
                                borderColor: terminosAceptados
                                  ? DISENO.colors.accent
                                  : COLOR_TEXTO_DETALLE,
                                backgroundColor: terminosAceptados
                                  ? DISENO.colors.accent
                                  : 'transparent',
                              },
                            ]}
                          >
                            {terminosAceptados && (
                              <Ionicons
                                name="checkmark"
                                size={tamanos.checkboxSize * 0.65}
                                color={DISENO.colors.surface}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                        <View style={estilos.terminosTextos}>
                          <Text
                            style={[estilos.terminosCheckboxTexto, { fontSize: tamanos.legalSize }]}
                            allowFontScaling={false}
                          >
                            Acepto los términos y condiciones.
                          </Text>
                          <TouchableOpacity
                            style={estilos.legalLinkItem}
                            onPress={() => props.navigation.navigate('Terminos')}
                            activeOpacity={0.7}
                            accessibilityRole="link"
                          >
                            <Text
                              style={[estilos.terminosLink, { fontSize: tamanos.legalSize }]}
                              allowFontScaling={false}
                            >
                              Leer Términos y Condiciones
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {erroresCampos.terminos && (
                        <Text
                          style={[estilos.errorCampo, { fontSize: tamanos.errorSize }]}
                          accessibilityLiveRegion="polite"
                          allowFontScaling={false}
                        >
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
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={tamanos.hintSize + 3}
                            color={DISENO.colors.accent}
                          />
                          <Text
                            style={[estilos.legalLinkTexto, { fontSize: tamanos.legalSize }]}
                            allowFontScaling={false}
                          >
                            Leer Política de Privacidad
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Botón principal */}
                    <TouchableOpacity
                      style={[
                        estilos.boton,
                        {
                          marginTop: isCompactHeight ? 10 : tamanos.fieldSpacing + 4,
                          borderRadius: tamanos.buttonRadius,
                        },
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
                          { paddingVertical: tamanos.buttonPaddingV },
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {cargando ? (
                          <ActivityIndicator color={DISENO.colors.surface} size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name="person-add"
                              size={tamanos.buttonTextSize + 4}
                              color={DISENO.colors.surface}
                            />
                            <Text
                              style={[estilos.textoBoton, { fontSize: tamanos.buttonTextSize }]}
                              allowFontScaling={false}
                            >
                              Crear cuenta
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Enlace a login */}
                    <View style={[estilos.enlacesContainer, isCompactHeight && { marginTop: 4 }]}>
                      <TouchableOpacity
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.6}
                        style={estilos.enlaceAccion}
                        accessibilityRole="button"
                        accessibilityLabel="Volver e iniciar sesión"
                      >
                        <Text
                          style={[estilos.enlace, { fontSize: tamanos.enlaceSize }]}
                          allowFontScaling={false}
                        >
                          ¿Ya tenés cuenta?{' '}
                          <Text style={estilos.enlaceDestacado}>Iniciá sesión</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={estilos.separadorContainer}>
                      <View style={estilos.separador} />
                      <Text
                        style={[estilos.separadorTexto, { fontSize: tamanos.hintSize }]}
                        allowFontScaling={false}
                      >
                        o
                      </Text>
                      <View style={estilos.separador} />
                    </View>

                    <TouchableOpacity
                      style={[
                        estilos.botonInvitado,
                        { minHeight: tamanos.inputHeight, borderRadius: tamanos.inputRadius },
                      ]}
                      onPress={() => props.navigation.navigate('Principal')}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel="Continuar como invitado"
                    >
                      <Ionicons name="person-outline" size={20} color={COLOR_TEXTO_DETALLE} />
                      <Text
                        style={[estilos.botonInvitadoTexto, { fontSize: tamanos.enlaceSize }]}
                        allowFontScaling={false}
                      >
                        Continuar como invitado
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
    </>
  );
}

// ============================================================
// 🎨 ESTILOS
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
  manchaFondo: { position: 'absolute', borderRadius: 999 },
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
  scroll: { flexGrow: 1, alignItems: 'center' },
  contenidoCentral: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoContainer: { alignItems: 'center', justifyContent: 'center', width: '100%' },
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
    lineHeight: 34,
    includeFontPadding: false,
  },
  subtitulo: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
    includeFontPadding: false,
  },

  // Banner puntos
  bannerPuntosContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#FFF8DB',
    borderWidth: 1,
    borderColor: '#F0D675',
  },
  bannerPuntosIcono: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEAA5',
  },
  bannerPuntosTextos: { flex: 1, minWidth: 0 },
  bannerPuntosTitulo: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: COLOR_PUNTOS,
    includeFontPadding: false,
  },
  bannerPuntosDesc: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    marginTop: 3,
    includeFontPadding: false,
  },

  // Confirmación correo
  confirmacionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0D675',
    ...DISENO.shadow.md,
  },
  confirmacionIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
    marginBottom: 16,
  },
  confirmacionTitulo: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DISENO.colors.text,
    textAlign: 'center',
    marginBottom: 8,
    includeFontPadding: false,
  },
  confirmacionTexto: {
    fontFamily: FUENTES.regular,
    lineHeight: 20,
    color: COLOR_TEXTO_SECUNDARIO,
    textAlign: 'center',
    includeFontPadding: false,
  },
  confirmacionCorreo: {
    maxWidth: '100%',
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: COLOR_PUNTOS,
    textAlign: 'center',
    marginVertical: 10,
    includeFontPadding: false,
  },
  confirmacionReenviar: {
    minHeight: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8DB',
    borderWidth: 1,
    borderColor: '#F0D675',
  },
  confirmacionReenviarDeshabilitado: { opacity: 0.65 },
  confirmacionReenviarTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DISENO.colors.accent,
    textAlign: 'center',
    includeFontPadding: false,
  },
  confirmacionVolver: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  confirmacionVolverTexto: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: COLOR_TEXTO_SECUNDARIO,
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },

  // Formulario
  formulario: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: DISENO.colors.surface,
    borderRadius: 24,
    ...DISENO.shadow.md,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  label: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.text,
    includeFontPadding: false,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  inputError: {
    borderColor: DISENO.colors.danger,
    backgroundColor: '#FFF7F6',
  },
  inputIcon: { marginRight: 10, flexShrink: 0 },
  input: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    paddingVertical: 0,
    flex: 1,
    minWidth: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eyeButton: { alignItems: 'center', justifyContent: 'center' },
  passwordHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginLeft: 4,
  },
  passwordHint: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_DETALLE,
    includeFontPadding: false,
  },
  passwordHintSuccess: { color: '#2E7D32', fontWeight: '600' },
  errorCampo: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger,
    marginTop: 5,
    marginLeft: 4,
    includeFontPadding: false,
    lineHeight: 18,
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
    flex: 1,
    includeFontPadding: false,
    lineHeight: 18,
  },

  // Legal
  legalContainer: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#FFFDF7',
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
  terminosTextos: { flex: 1, minWidth: 0, flexShrink: 1, gap: 2 },
  checkbox: {
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
    includeFontPadding: false,
  },
  terminosLink: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.accent,
    textDecorationLine: 'underline',
    includeFontPadding: false,
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
    includeFontPadding: false,
  },

  // Botón
  boton: {
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
    paddingHorizontal: 24,
  },
  textoBoton: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    letterSpacing: 1.5,
    includeFontPadding: false,
    lineHeight: 24,
  },

  // Enlaces
  enlacesContainer: { marginTop: 12, alignItems: 'center' },
  enlaceAccion: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  enlace: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    fontWeight: '500',
    includeFontPadding: false,
  },
  enlaceDestacado: {
    fontFamily: FUENTES.regular,
    fontWeight: '700',
    color: DISENO.colors.accent,
  },

  // Separador
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
    includeFontPadding: false,
  },

  // Invitado
  botonInvitado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
    backgroundColor: DISENO.colors.surfaceHover,
  },
  botonInvitadoTexto: {
    fontFamily: FUENTES.regular,
    color: COLOR_TEXTO_SECUNDARIO,
    fontWeight: '500',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});