// screens/auth/PantallaLogin.tsx - V2 100% RESPONSIVE + PERMISOS ONBOARDING
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
  Keyboard,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { notificacionService } from '../../services/notificacionService';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES, TAMANOS_DISPLAY } from '../../lib/fuentes';
import { RootStackParamList } from '../../lib/tipos';

// 🚀 Imports para la estrategia de permisos amigables
import { yaVioModalPermisos, marcarModalPermisosVisto, solicitarPermisosCompletosApp } from '../../utils/permisosHelper';
import ModalPermisosEntrada from '../../components/ModalPermisosEntrada';

WebBrowser.maybeCompleteAuthSession();

const logoImage = require('../../assets/logo-krusty.png');
const googleLogoImage = require('../../assets/google-g-logo.png');
const COLOR_TEXTO_SECUNDARIO_LOGIN = '#5F6368';
const COLOR_DETALLE_LOGIN = '#687078';
const COLOR_PUNTOS_LOGIN = '#705300';

type Navigation = {
  navigate: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  goBack: () => void;
};

const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'krusty_remember_email',
  REMEMBER_PASSWORD: 'krusty_remember_password',
  REMEMBER_ME: 'krusty_remember_me',
  LOGIN_ATTEMPTS: 'krusty_login_attempts',
  LOGIN_BLOCKED_UNTIL: 'krusty_login_blocked_until',
};

const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_SEGUNDOS = 60;

interface TamanosLogin {
  paddingHorizontal: number;
  paddingTop: number;
  paddingBottom: number;
  maxFormWidth: number;
  formPadding: number;
  formRadius: number;
  logoSize: number;
  logoMarginBottom: number;
  formTitleSize: number;
  formSubtitleSize: number;
  labelSize: number;
  inputTextSize: number;
  buttonTextSize: number;
  smallTextSize: number;
  legalTextSize: number;
  versionTextSize: number;
  inputHeight: number;
  inputPaddingH: number;
  inputRadius: number;
  iconSize: number;
  iconActionSize: number;
  buttonPaddingV: number;
  buttonRadius: number;
  sectionGap: number;
  errorIconSize: number;
  headerHeightPercent: number;
}

const calcularTamanosLogin = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmall: boolean,
): TamanosLogin => {
  const ancho = width;
  const paddingHorizontal = isDesktop ? 60 : isTablet ? 40 : isSmall ? 16 : 20;
  const maxFormWidth = isDesktop ? 480 : isTablet ? 460 : ancho;
  const formPadding = isDesktop ? 32 : isTablet ? 28 : isSmall ? 18 : 22;
  const formRadius = isDesktop ? 28 : 24;

  const anchoUtil = Math.min(ancho - paddingHorizontal * 2, maxFormWidth);
  const logoBase = anchoUtil * 0.45;
  const logoSize = isDesktop ? 200 : isTablet ? 180 : isSmall ? Math.min(logoBase, 130) : Math.min(logoBase, 160);
  const logoMarginBottom = isSmall ? 12 : 18;

  const formTitleSize = isDesktop ? 26 : isTablet ? 24 : isSmall ? 19 : 22;
  const formSubtitleSize = isDesktop ? 15 : isTablet ? 15 : isSmall ? 12.5 : 14;
  const labelSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 12.5 : 13.5;
  const inputTextSize = isDesktop ? 15 : isTablet ? 14 : isSmall ? 13 : 14;
  const buttonTextSize = isDesktop ? 20 : isTablet ? 19 : isSmall ? 16 : 18;
  const smallTextSize = isDesktop ? 13 : isTablet ? 13 : isSmall ? 11.5 : 12.5;
  const legalTextSize = isSmall ? 11 : 12;
  const versionTextSize = isSmall ? 10 : 11;

  const inputHeight = isDesktop ? 60 : isTablet ? 58 : isSmall ? 50 : 54;
  const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmall ? 12 : 14;
  const inputRadius = isDesktop ? 16 : isSmall ? 12 : 14;
  const iconSize = isDesktop ? 22 : isTablet ? 22 : isSmall ? 20 : 21;
  const iconActionSize = isDesktop ? 48 : isSmall ? 40 : 44;

  const buttonPaddingV = isDesktop ? 18 : isTablet ? 17 : isSmall ? 14 : 16;
  const buttonRadius = isSmall ? 12 : 14;
  const sectionGap = isSmall ? 10 : 14;
  const errorIconSize = isSmall ? 18 : 20;
  const headerHeightPercent = isSmall ? 38 : 42;
  const paddingTop = isSmall ? 8 : 12;
  const paddingBottom = isSmall ? 20 : 30;

  return {
    paddingHorizontal,
    paddingTop,
    paddingBottom,
    maxFormWidth,
    formPadding,
    formRadius,
    logoSize,
    logoMarginBottom,
    formTitleSize,
    formSubtitleSize,
    labelSize,
    inputTextSize,
    buttonTextSize,
    smallTextSize,
    legalTextSize,
    versionTextSize,
    inputHeight,
    inputPaddingH,
    inputRadius,
    iconSize,
    iconActionSize,
    buttonPaddingV,
    buttonRadius,
    sectionGap,
    errorIconSize,
    headerHeightPercent,
  };
};

export default function PantallaLogin(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation<Navigation>();

  const tamanos = React.useMemo(
    () =>
      calcularTamanosLogin(
        screenWidth,
        screenHeight,
        responsive.isTablet,
        responsive.isDesktop,
        responsive.isSmallPhone,
      ),
    [screenWidth, screenHeight, responsive.isTablet, responsive.isDesktop, responsive.isSmallPhone],
  );

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [recordarUsuario, setRecordarUsuario] = useState(false);
  const [cargandoRecordatorio, setCargandoRecordatorio] = useState(true);
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [mensajeErrorGeneral, setMensajeErrorGeneral] = useState<string | null>(null);

  // 🚀 Estados para el Modal de Permisos de Entrada
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);
  const [userIdLogueado, setUserIdLogueado] = useState<string | null>(null);

  const { iniciarSesion } = tiendaAutenticacion();

  const correoInputRef = useRef<TextInput>(null);
  const contrasenaInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    cargarCredencialesGuardadas();
    cargarEstadoBloqueo();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cargarEstadoBloqueo = async () => {
    try {
      const [attemptsStr, blockedUntilStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGIN_BLOCKED_UNTIL),
      ]);

      if (blockedUntilStr) {
        const blockedUntil = parseInt(blockedUntilStr, 10);
        const now = Date.now();

        if (blockedUntil > now) {
          const segundosRestantes = Math.ceil((blockedUntil - now) / 1000);
          setBloqueado(true);
          setTiempoRestante(segundosRestantes);
          setIntentosFallidos(MAX_INTENTOS);
          iniciarContadorBloqueo(segundosRestantes);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
          await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_BLOCKED_UNTIL);
          setIntentosFallidos(0);
          setBloqueado(false);
        }
      }

      if (attemptsStr) {
        const attempts = parseInt(attemptsStr, 10);
        if (!bloqueado && attempts < MAX_INTENTOS) {
          setIntentosFallidos(attempts);
        }
      }
    } catch (error) {
      console.error('Error cargando estado de bloqueo:', error);
    }
  };

  const guardarEstadoBloqueo = async (intentos: number, bloqueadoHasta?: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, String(intentos));
      if (bloqueadoHasta) {
        await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_BLOCKED_UNTIL, String(bloqueadoHasta));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_BLOCKED_UNTIL);
      }
    } catch (error) {
      console.error('Error guardando estado de bloqueo:', error);
    }
  };

  const iniciarContadorBloqueo = (segundos: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          setBloqueado(false);
          setIntentosFallidos(0);
          AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
          AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_BLOCKED_UNTIL);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const iniciarBloqueo = (segundos: number = TIEMPO_BLOQUEO_SEGUNDOS) => {
    const bloqueadoHasta = Date.now() + (segundos * 1000);
    setBloqueado(true);
    setTiempoRestante(segundos);
    guardarEstadoBloqueo(MAX_INTENTOS, bloqueadoHasta);
    iniciarContadorBloqueo(segundos);
  };

  const cargarCredencialesGuardadas = async () => {
    try {
      const [rememberMe, email, password] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_ME),
        SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_EMAIL),
        SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_PASSWORD),
      ]);

      if (rememberMe === 'true') {
        setRecordarUsuario(true);
        if (email) setCorreo(email);
        if (password) setContrasena(password);
      }
    } catch (error) {
      console.error('Error cargando credenciales:', error);
    } finally {
      setCargandoRecordatorio(false);
    }
  };

  const guardarCredenciales = async (email: string, password: string, remember: boolean) => {
    try {
      if (remember) {
        await Promise.all([
          SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_EMAIL, email),
          SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_PASSWORD, password),
          SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, 'true'),
        ]);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_EMAIL),
          SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_PASSWORD),
          SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_ME),
        ]);
      }
    } catch (error) {
      console.error('Error guardando credenciales:', error);
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const validarCampos = (): boolean => {
    const nuevosErrores: { correo?: string; contrasena?: string } = {};
    let isValid = true;

    if (!correo || correo.trim() === '') {
      nuevosErrores.correo = 'El correo electrónico es requerido';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo.trim())) {
        nuevosErrores.correo = 'Ingresa un correo electrónico válido';
        isValid = false;
      }
    }

    if (!contrasena || contrasena.trim() === '') {
      nuevosErrores.contrasena = 'La contraseña es requerida';
      isValid = false;
    } else if (contrasena.length < 6) {
      nuevosErrores.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    }

    setErrores(nuevosErrores);
    setMensajeErrorGeneral(null);

    if (!isValid) {
      shake();
      if (nuevosErrores.correo) correoInputRef.current?.focus();
      else if (nuevosErrores.contrasena) contrasenaInputRef.current?.focus();
    }

    return isValid;
  };

  const verificarConexion = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  };

  const obtenerMensajeErrorAmigable = (error: string): { titulo: string; mensaje: string } => {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('invalid login credentials')) {
      return {
        titulo: '❌ Credenciales inválidas',
        mensaje: 'El correo o la contraseña son incorrectos.\n\n📌 Verifica que:\n• El correo esté escrito correctamente\n• La contraseña sea la correcta\n• No tengas mayúsculas accidentales'
      };
    }
    if (errorLower.includes('user not found')) {
      return {
        titulo: '👤 Usuario no encontrado',
        mensaje: 'No encontramos una cuenta con este correo.\n\n📌 ¿Quieres crear una cuenta nueva?'
      };
    }
    if (errorLower.includes('email not confirmed')) {
      return {
        titulo: '📧 Correo no confirmado',
        mensaje: 'Tu correo aún no ha sido confirmado.\n\n📌 Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.'
      };
    }
    if (errorLower.includes('invalid email')) {
      return {
        titulo: '📧 Correo inválido',
        mensaje: 'El formato del correo electrónico no es válido.\n\n📌 Ejemplo: usuario@dominio.com'
      };
    }
    if (errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
      return {
        titulo: '⏳ Demasiados intentos',
        mensaje: 'Has superado el límite de intentos.\n\n⏱️ Espera 1 minuto y vuelve a intentarlo.'
      };
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return {
        titulo: '📡 Sin conexión',
        mensaje: 'No pudimos conectar con el servidor.\n\n📌 Verifica tu conexión a internet.'
      };
    }
    return {
      titulo: '⚠️ Error al iniciar sesión',
      mensaje: error || 'Ocurrió un error inesperado. Intenta nuevamente.'
    };
  };

  const manejarLogin = async () => {
    Keyboard.dismiss();

    if (bloqueado) {
      Alert.alert('⏳ Demasiados intentos', `Espera ${tiempoRestante} segundos.`);
      return;
    }

    if (!validarCampos()) return;

    const tieneConexion = await verificarConexion();
    if (!tieneConexion) {
      Alert.alert('📡 Sin conexión', 'Verifica tu red y vuelve a intentar.');
      return;
    }

    setCargando(true);
    setMensajeErrorGeneral(null);

    try {
      const resultado = await iniciarSesion(correo.trim(), contrasena);

      if (!resultado || !resultado.success) {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);
        await guardarEstadoBloqueo(nuevosIntentos);

        if (nuevosIntentos >= MAX_INTENTOS) {
          iniciarBloqueo(TIEMPO_BLOQUEO_SEGUNDOS);
          setCargando(false);
          Alert.alert('🔒 Demasiados intentos', `Espera ${TIEMPO_BLOQUEO_SEGUNDOS} segundos.`);
          return;
        }

        const errorOriginal = resultado?.error || 'Error al iniciar sesión';
        const errorAmigable = obtenerMensajeErrorAmigable(errorOriginal);

        shake();
        setMensajeErrorGeneral(errorAmigable.mensaje);
        Alert.alert(errorAmigable.titulo, errorAmigable.mensaje);
        setCargando(false);
        return;
      }

      await guardarEstadoBloqueo(0);
      await guardarCredenciales(correo.trim(), contrasena, recordarUsuario);

      setIntentosFallidos(0);
      setMensajeErrorGeneral(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserIdLogueado(session.user.id);
        const yaVisto = await yaVioModalPermisos();
        if (!yaVisto) {
          setMostrarModalPermisos(true);
        } else {
          try {
            await notificacionService.registrarToken(session.user.id);
          } catch (error) {
            console.log('⚠️ Error registrando notificaciones:', error);
          }
          navigation.navigate('Principal');
        }
      } else {
        navigation.navigate('Principal');
      }

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      shake();

      let mensajeError = 'Ocurrió un error inesperado.';
      let tituloError = '⚠️ Error';

      if (error?.message && typeof error.message === 'string') {
        const errorAmigable = obtenerMensajeErrorAmigable(error.message);
        tituloError = errorAmigable.titulo;
        mensajeError = errorAmigable.mensaje;
      }

      setMensajeErrorGeneral(mensajeError);
      Alert.alert(tituloError, mensajeError);
    } finally {
      setCargando(false);
    }
  };

  // 🚀 Acciones del Modal Amigable de Permisos
  const handleAceptarModalPermisos = async () => {
    setMostrarModalPermisos(false);
    await marcarModalPermisosVisto();
    if (userIdLogueado) {
      await solicitarPermisosCompletosApp(userIdLogueado);
    }
    navigation.navigate('Principal');
  };

  const handleOmitirModalPermisos = async () => {
    setMostrarModalPermisos(false);
    await marcarModalPermisosVisto();
    navigation.navigate('Principal');
  };

  const manejarGoogleLogin = async () => {
    try {
      setCargandoGoogle(true);
      setMensajeErrorGeneral(null);

      const redirectTo = makeRedirectUri({
        scheme: 'krustyburger',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL');

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type !== 'success' || !res.url) {
        return;
      }

      const url = res.url;
      const queryParams = new URLSearchParams(url.split('?')[1] || '');
      const code = queryParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else {
        const fragmentParams = new URLSearchParams(url.split('#')[1] || '');
        const access_token = fragmentParams.get('access_token');
        const refresh_token = fragmentParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error('No se recibieron credenciales de Google');
        }
      }

      // Después de Google Login exitoso, verificamos también los permisos
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserIdLogueado(session.user.id);
        const yaVisto = await yaVioModalPermisos();
        if (!yaVisto) {
          setMostrarModalPermisos(true);
        } else {
          await notificacionService.registrarToken(session.user.id);
          navigation.navigate('Principal');
        }
      }
    } catch (error: any) {
      console.error('❌ Error en Google Login:', error);
      Alert.alert('⚠️ Error con Google', error?.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setCargandoGoogle(false);
    }
  };

  const manejarInvitado = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await notificacionService.registrarToken(session.user.id);
      }
    } catch (error) {
      console.log('⚠️ Error en invitado:', error);
    }
    navigation.navigate('Principal');
  };

  const handleCorreoChange = (text: string) => {
    setCorreo(text);
    if (errores.correo) setErrores(prev => ({ ...prev, correo: undefined }));
    if (mensajeErrorGeneral) setMensajeErrorGeneral(null);
  };

  const handleContrasenaChange = (text: string) => {
    setContrasena(text);
    if (errores.contrasena) setErrores(prev => ({ ...prev, contrasena: undefined }));
    if (mensajeErrorGeneral) setMensajeErrorGeneral(null);
  };

  if (cargandoRecordatorio) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={DISENO.colors.accent} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.background} />

      <LinearGradient
        colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
        style={[estilos.headerGradiente, { height: `${tamanos.headerHeightPercent}%` }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            estilos.scroll,
            {
              paddingHorizontal: tamanos.paddingHorizontal,
              paddingTop: insets.top + tamanos.paddingTop,
              paddingBottom: insets.bottom + tamanos.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* LOGO */}
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
                style={{
                  width: tamanos.logoSize,
                  height: tamanos.logoSize,
                  backgroundColor: 'transparent',
                  borderRadius: 999,
                }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* FORMULARIO */}
          <Animated.View
            style={[
              estilos.formulario,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }, { translateX: shakeAnim }],
                width: '100%',
                maxWidth: tamanos.maxFormWidth,
                alignSelf: 'center',
                padding: tamanos.formPadding,
                borderRadius: tamanos.formRadius,
              },
            ]}
          >
            <View style={[estilos.formHeader, { marginBottom: tamanos.sectionGap + 4 }]}>
              <Text
                style={[estilos.formTitle, { fontSize: tamanos.formTitleSize }]}
                accessibilityRole="header"
                allowFontScaling={false}
              >
                ¡Bienvenidos!
              </Text>
              <Text
                style={[estilos.formSubtitle, { fontSize: tamanos.formSubtitleSize }]}
                allowFontScaling={false}
              >
                Iniciá sesión para continuar
              </Text>
            </View>

            {mensajeErrorGeneral && (
              <View
                style={estilos.errorGeneralContainer}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Ionicons
                  name="alert-circle"
                  size={tamanos.errorIconSize}
                  color={DISENO.colors.danger}
                />
                <Text style={estilos.errorGeneralTexto} allowFontScaling={false}>
                  {mensajeErrorGeneral}
                </Text>
              </View>
            )}

            <Text
              style={[estilos.label, { fontSize: tamanos.labelSize }]}
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
                errores.correo && estilos.inputError,
              ]}
            >
              <Ionicons
                name={errores.correo ? 'alert-circle' : 'mail-outline'}
                size={tamanos.iconSize}
                color={errores.correo ? DISENO.colors.danger : COLOR_DETALLE_LOGIN}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={correoInputRef}
                style={[estilos.input, { fontSize: tamanos.inputTextSize }]}
                value={correo}
                onChangeText={handleCorreoChange}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={COLOR_DETALLE_LOGIN}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                importantForAutofill="yes"
                accessibilityLabel="Correo electrónico"
                selectionColor={DISENO.colors.accent}
                editable={!cargando && !bloqueado}
                returnKeyType="next"
                onSubmitEditing={() => contrasenaInputRef.current?.focus()}
                allowFontScaling={false}
              />
              {correo.length > 0 && !errores.correo && (
                <TouchableOpacity
                  onPress={() => setCorreo('')}
                  style={[
                    estilos.iconActionButton,
                    { width: tamanos.iconActionSize, height: tamanos.iconActionSize },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Borrar correo electrónico"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={tamanos.iconSize - 2} color={COLOR_DETALLE_LOGIN} />
                </TouchableOpacity>
              )}
            </View>
            {errores.correo && (
              <Text
                style={[estilos.textoError, { fontSize: tamanos.smallTextSize }]}
                accessibilityLiveRegion="polite"
                allowFontScaling={false}
              >
                {errores.correo}
              </Text>
            )}

            <Text
              style={[
                estilos.label,
                { fontSize: tamanos.labelSize, marginTop: tamanos.sectionGap },
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
                errores.contrasena && estilos.inputError,
              ]}
            >
              <Ionicons
                name={errores.contrasena ? 'alert-circle' : 'lock-closed-outline'}
                size={tamanos.iconSize}
                color={errores.contrasena ? DISENO.colors.danger : COLOR_DETALLE_LOGIN}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={contrasenaInputRef}
                style={[estilos.input, { fontSize: tamanos.inputTextSize }]}
                value={contrasena}
                onChangeText={handleContrasenaChange}
                placeholder="Tu contraseña"
                placeholderTextColor={COLOR_DETALLE_LOGIN}
                secureTextEntry={!mostrarContrasena}
                autoComplete="current-password"
                importantForAutofill="yes"
                accessibilityLabel="Contraseña"
                selectionColor={DISENO.colors.accent}
                editable={!cargando && !bloqueado}
                returnKeyType="done"
                onSubmitEditing={manejarLogin}
                allowFontScaling={false}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                style={[
                  estilos.iconActionButton,
                  { width: tamanos.iconActionSize, height: tamanos.iconActionSize },
                ]}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                hitSlop={8}
              >
                <Ionicons
                  name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                  size={tamanos.iconSize}
                  color={COLOR_DETALLE_LOGIN}
                />
              </TouchableOpacity>
            </View>
            {errores.contrasena && (
              <Text
                style={[estilos.textoError, { fontSize: tamanos.smallTextSize }]}
                accessibilityLiveRegion="polite"
                allowFontScaling={false}
              >
                {errores.contrasena}
              </Text>
            )}

            <View style={[estilos.recordarContainer, { marginTop: tamanos.sectionGap }]}>
              <View style={estilos.recordarLeft}>
                <Switch
                  value={recordarUsuario}
                  onValueChange={setRecordarUsuario}
                  accessibilityLabel="Recordar usuario"
                  trackColor={{ false: DISENO.colors.border, true: DISENO.colors.accent }}
                  thumbColor={DISENO.colors.surface}
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
                <Text
                  style={[estilos.recordarTexto, { fontSize: tamanos.smallTextSize }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  Recordarme
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                activeOpacity={0.6}
                style={estilos.olvidoContainer}
                accessibilityRole="button"
                accessibilityLabel="¿Olvidaste tu contraseña?"
              >
                <Text
                  style={[estilos.olvidoTexto, { fontSize: tamanos.smallTextSize }]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {intentosFallidos > 0 && intentosFallidos < MAX_INTENTOS && (
              <View style={estilos.intentosContainer}>
                <Ionicons name="warning-outline" size={14} color={DISENO.colors.danger + '80'} />
                <Text
                  style={[estilos.intentosTexto, { fontSize: tamanos.smallTextSize - 1 }]}
                  allowFontScaling={false}
                >
                  {intentosFallidos} de {MAX_INTENTOS} intentos disponibles
                </Text>
              </View>
            )}

            {bloqueado && (
              <View style={estilos.bloqueoContainer}>
                <Ionicons name="time-outline" size={18} color={DISENO.colors.accent} />
                <Text
                  style={[estilos.bloqueoTexto, { fontSize: tamanos.smallTextSize + 1 }]}
                  allowFontScaling={false}
                >
                  ⏳ Bloqueado por {tiempoRestante} segundos
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                estilos.boton,
                {
                  marginTop: tamanos.sectionGap + 6,
                  borderRadius: tamanos.buttonRadius,
                },
                (cargando || bloqueado) && { opacity: 0.6 },
              ]}
              onPress={manejarLogin}
              disabled={cargando || bloqueado}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cargando ? 'Iniciando sesión' : 'Iniciar sesión'}
              accessibilityState={{ disabled: cargando || bloqueado, busy: cargando }}
            >
              <LinearGradient
                colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                style={[estilos.botonGradient, { paddingVertical: tamanos.buttonPaddingV }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {cargando ? (
                  <ActivityIndicator color={DISENO.colors.surface} size="small" />
                ) : bloqueado ? (
                  <>
                    <Ionicons
                      name="time"
                      size={tamanos.buttonTextSize + 4}
                      color={DISENO.colors.surface}
                    />
                    <Text
                      style={[estilos.textoBoton, { fontSize: tamanos.buttonTextSize }]}
                      allowFontScaling={false}
                    >
                      Espera {tiempoRestante}s
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="log-in"
                      size={tamanos.buttonTextSize + 4}
                      color={DISENO.colors.surface}
                    />
                    <Text
                      style={[estilos.textoBoton, { fontSize: tamanos.buttonTextSize }]}
                      allowFontScaling={false}
                    >
                      Iniciar Sesión
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={[estilos.separadorContainer, { marginTop: tamanos.sectionGap + 2 }]}>
              <View style={estilos.separador} />
              <Text
                style={[estilos.separadorTexto, { fontSize: tamanos.smallTextSize }]}
                allowFontScaling={false}
              >
                o
              </Text>
              <View style={estilos.separador} />
            </View>

            <TouchableOpacity
              style={[
                estilos.botonGoogle,
                { minHeight: tamanos.inputHeight, borderRadius: tamanos.inputRadius },
                cargandoGoogle && { opacity: 0.6 },
              ]}
              onPress={manejarGoogleLogin}
              disabled={cargandoGoogle || cargando}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cargandoGoogle ? 'Conectando con Google' : 'Continuar con Google'}
              accessibilityState={{ disabled: cargandoGoogle || cargando, busy: cargandoGoogle }}
            >
              {cargandoGoogle ? (
                <ActivityIndicator color="#1F1F1F" size="small" />
              ) : (
                <View style={estilos.googleButtonContent}>
                  <Image
                    source={googleLogoImage}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Text
                    style={[estilos.botonGoogleTexto, { fontSize: tamanos.inputTextSize }]}
                    allowFontScaling={false}
                  >
                    Continuar con Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.registroCard,
                { minHeight: tamanos.inputHeight, borderRadius: tamanos.inputRadius },
              ]}
              onPress={() => navigation.navigate('Registro')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Crear cuenta y recibir 500 puntos de bienvenida"
            >
              <Ionicons name="gift-outline" size={18} color={COLOR_PUNTOS_LOGIN} />
              <Text
                style={[estilos.registroCardTexto, { fontSize: tamanos.smallTextSize }]}
                numberOfLines={2}
                allowFontScaling={false}
              >
                ¿Nuevo por aquí? Creá tu cuenta y recibí{' '}
                <Text style={estilos.registroCardDestacado}>500 puntos</Text>
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLOR_DETALLE_LOGIN} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botonInvitado,
                { minHeight: tamanos.inputHeight - 6, borderRadius: tamanos.inputRadius },
              ]}
              onPress={manejarInvitado}
              activeOpacity={0.6}
              disabled={cargando}
              accessibilityRole="button"
              accessibilityLabel="Continuar como invitado"
              accessibilityState={{ disabled: cargando }}
            >
              <Ionicons name="person-outline" size={18} color={COLOR_DETALLE_LOGIN} />
              <Text
                style={[estilos.botonInvitadoTexto, { fontSize: tamanos.inputTextSize }]}
                allowFontScaling={false}
              >
                Continuar como invitado
              </Text>
            </TouchableOpacity>

            <View style={estilos.legalContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Terminos')} activeOpacity={0.6}>
                <Text
                  style={[estilos.legalTexto, { fontSize: tamanos.legalTextSize }]}
                  allowFontScaling={false}
                >
                  📋 Términos
                </Text>
              </TouchableOpacity>
              <Text style={estilos.legalSeparador}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Privacidad')} activeOpacity={0.6}>
                <Text
                  style={[estilos.legalTexto, { fontSize: tamanos.legalTextSize }]}
                  allowFontScaling={false}
                >
                  🔒 Privacidad
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[estilos.versionTexto, { fontSize: tamanos.versionTextSize }]}
              allowFontScaling={false}
            >
              v1.0.2
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🚀 MODAL AMIGABLE DE PERMISOS */}
      <ModalPermisosEntrada
        visible={mostrarModalPermisos}
        onAceptar={handleAceptarModalPermisos}
        onOmitir={handleOmitirModalPermisos}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: DISENO.colors.fondo },
  background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: DISENO.colors.fondo },
  headerGradiente: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  logoWrapper: { ...DISENO.shadow.lg, shadowColor: DISENO.colors.accent, shadowOpacity: 0.25 },
  formulario: { width: '100%', alignSelf: 'center', backgroundColor: DISENO.colors.surface, ...DISENO.shadow.lg, borderWidth: 1, borderColor: DISENO.colors.border },
  formHeader: { alignItems: 'center' },
  formTitle: { fontFamily: FUENTES.regular, color: DISENO.colors.text, fontWeight: '700', textAlign: 'center', lineHeight: 32, includeFontPadding: false },
  formSubtitle: { fontFamily: FUENTES.regular, color: COLOR_TEXTO_SECUNDARIO_LOGIN, marginTop: 4, textAlign: 'center', lineHeight: 20, includeFontPadding: false },
  label: { fontFamily: FUENTES.regular, fontWeight: '600', color: DISENO.colors.text, marginBottom: 4, letterSpacing: 0.2, lineHeight: 18, includeFontPadding: false },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISENO.colors.surfaceHover, borderWidth: 1.5, borderColor: DISENO.colors.border },
  inputError: { borderColor: DISENO.colors.danger, backgroundColor: DISENO.colors.danger + '10' },
  inputIcon: { marginRight: 10, flexShrink: 0 },
  input: { fontFamily: FUENTES.regular, color: DISENO.colors.text, paddingVertical: 0, flex: 1, includeFontPadding: false, textAlignVertical: 'center' },
  iconActionButton: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textoError: { fontFamily: FUENTES.regular, color: DISENO.colors.danger, marginTop: 4, marginLeft: 4, lineHeight: 18, includeFontPadding: false },
  errorGeneralContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: DISENO.colors.danger + '10', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: DISENO.colors.danger + '30' },
  errorGeneralTexto: { fontFamily: FUENTES.regular, color: DISENO.colors.danger, fontSize: 13, flex: 1, fontWeight: '500', lineHeight: 19, includeFontPadding: false },
  recordarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, gap: 6 },
  recordarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  recordarTexto: { fontFamily: FUENTES.regular, color: COLOR_TEXTO_SECUNDARIO_LOGIN, fontWeight: '500', includeFontPadding: false },
  olvidoContainer: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 2, flexShrink: 0 },
  olvidoTexto: { fontFamily: FUENTES.regular, color: COLOR_DETALLE_LOGIN, textDecorationLine: 'underline', fontWeight: '400', includeFontPadding: false },
  intentosContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 4 },
  intentosTexto: { fontFamily: FUENTES.regular, color: DISENO.colors.danger + '80', fontWeight: '500', includeFontPadding: false },
  bloqueoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6, backgroundColor: DISENO.colors.accent + '10', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  bloqueoTexto: { fontFamily: FUENTES.regular, color: DISENO.colors.accent, fontWeight: '600', includeFontPadding: false },
  boton: { overflow: 'hidden', ...DISENO.shadow.md, shadowColor: DISENO.colors.accent, shadowOpacity: 0.25 },
  botonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  textoBoton: { fontFamily: FUENTES.display, fontWeight: '400', color: DISENO.colors.surface, letterSpacing: 1, lineHeight: 24, includeFontPadding: false },
  botonGoogle: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#747775', paddingVertical: 10, paddingHorizontal: 12, marginTop: 10, marginBottom: 10 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  botonGoogleTexto: { color: '#1F1F1F', fontWeight: '500', lineHeight: 20, includeFontPadding: false },
  separadorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  separador: { flex: 1, height: 1, backgroundColor: DISENO.colors.border },
  separadorTexto: { fontFamily: FUENTES.regular, color: COLOR_DETALLE_LOGIN, paddingHorizontal: 16, fontWeight: '600', includeFontPadding: false },
  registroCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 8, marginBottom: 8, backgroundColor: '#FFF8DB', borderWidth: 1, borderColor: '#F0D675' },
  registroCardTexto: { fontFamily: FUENTES.regular, color: COLOR_TEXTO_SECUNDARIO_LOGIN, fontWeight: '400', flex: 1, lineHeight: 18, includeFontPadding: false },
  registroCardDestacado: { fontFamily: FUENTES.regular, color: COLOR_PUNTOS_LOGIN, fontWeight: '700' },
  botonInvitado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderWidth: 1, borderColor: DISENO.colors.border, backgroundColor: DISENO.colors.surfaceHover, marginTop: 4 },
  botonInvitadoTexto: { fontFamily: FUENTES.regular, color: COLOR_TEXTO_SECUNDARIO_LOGIN, fontWeight: '500', letterSpacing: 0.2, includeFontPadding: false },
  legalContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8, flexWrap: 'wrap' },
  legalTexto: { fontFamily: FUENTES.regular, color: COLOR_DETALLE_LOGIN, fontWeight: '400', textDecorationLine: 'underline', includeFontPadding: false },
  legalSeparador: { color: COLOR_DETALLE_LOGIN, fontSize: 10, opacity: 0.8 },
  versionTexto: { fontFamily: FUENTES.regular, color: COLOR_DETALLE_LOGIN, textAlign: 'center', marginTop: 10, includeFontPadding: false },
});