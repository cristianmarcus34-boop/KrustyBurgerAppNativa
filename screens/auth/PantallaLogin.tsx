// screens/auth/PantallaLogin.tsx - CON SIMPSONFONT Y TIPOS CENTRALIZADOS
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
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { notificacionService } from '../../services/notificacionService';
import { supabase } from '../../lib/supabase';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES, TAMANOS_DISPLAY } from '../../lib/fuentes';
import { RootStackParamList } from '../../lib/tipos';

const logoImage = require('../../assets/logo-krusty.png');

// ✅ TIPADO DE NAVEGACIÓN
type Navigation = {
  navigate: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  goBack: () => void;
};

// ✅ CLAVES PARA SECURE STORE Y ASYNC STORAGE
const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'krusty_remember_email',
  REMEMBER_PASSWORD: 'krusty_remember_password',
  REMEMBER_ME: 'krusty_remember_me',
  LOGIN_ATTEMPTS: 'krusty_login_attempts',
  LOGIN_BLOCKED_UNTIL: 'krusty_login_blocked_until',
};

// ✅ CONFIGURACIÓN DE BLOQUEO
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_SEGUNDOS = 60;

export default function PantallaLogin(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<Navigation>();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [recordarUsuario, setRecordarUsuario] = useState(false);
  const [cargandoRecordatorio, setCargandoRecordatorio] = useState(true);
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [mensajeErrorGeneral, setMensajeErrorGeneral] = useState<string | null>(null);

  const { iniciarSesion } = tiendaAutenticacion();

  const correoInputRef = useRef<TextInput>(null);
  const contrasenaInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | null>(null);

  // ============================================================
  // ✅ CARGAR CREDENCIALES Y ESTADO DE BLOQUEO
  // ============================================================
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

  // ✅ CARGAR ESTADO DE BLOQUEO
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
        try {
          await notificacionService.registrarToken(session.user.id);
        } catch (error) {
          console.log('⚠️ Error registrando notificaciones:', error);
        }
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

  // ============================================================
  // ✅ RESPONSIVE
  // ============================================================
  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

  // ✅ LOGO MÁS GRANDE
  const logoSize = responsive.getValor({ tablet: 220, normal: 180, small: 150 });
  const inputSize = responsive.getValor({ tablet: 14, normal: 13, small: 12 });
  const buttonTextSize = responsive.getValor({ tablet: 22, normal: 20, small: 18 });
  const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 24, small: 20 });
  const paddingTop = insets.top + responsive.spacing(20);

  const isSmallScreen = screenWidth < 380;

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
        style={estilos.headerGradiente}
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
              paddingHorizontal: paddingHorizontal,
              paddingTop: paddingTop,
              paddingBottom: insets.bottom + 30,
              flexGrow: 1,
              justifyContent: 'center',
              minHeight: '100%',
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ LOGO GRANDE SOLO */}
          <Animated.View
            style={[
              estilos.logoContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={estilos.logoWrapper}>
              <Image
                source={logoImage}
                style={[estilos.logoImage, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              estilos.formulario,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }, { translateX: shakeAnim }],
                width: '100%',
                maxWidth: 500,
                alignSelf: 'center',
              }
            ]}
          >
            {mensajeErrorGeneral && (
              <View style={estilos.errorGeneralContainer}>
                <Ionicons name="alert-circle" size={20} color={DISENO.colors.danger} />
                <Text style={estilos.errorGeneralTexto}>{mensajeErrorGeneral}</Text>
              </View>
            )}

            <Text style={[estilos.label, { fontSize: inputSize }]}>Correo electrónico</Text>
            <View style={[estilos.inputContainer, errores.correo && estilos.inputError]}>
              <Ionicons
                name={errores.correo ? "alert-circle" : "mail-outline"}
                size={22}
                color={errores.correo ? DISENO.colors.danger : DISENO.colors.textTertiary}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={correoInputRef}
                style={[estilos.input, { fontSize: inputSize }]}
                value={correo}
                onChangeText={handleCorreoChange}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={DISENO.colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={DISENO.colors.accent}
                editable={!cargando && !bloqueado}
                returnKeyType="next"
                onSubmitEditing={() => contrasenaInputRef.current?.focus()}
              />
              {correo.length > 0 && !errores.correo && (
                <TouchableOpacity onPress={() => setCorreo('')}>
                  <Ionicons name="close-circle" size={18} color={DISENO.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            {errores.correo && <Text style={estilos.textoError}>{errores.correo}</Text>}

            <Text style={[estilos.label, { fontSize: inputSize, marginTop: 16 }]}>Contraseña</Text>
            <View style={[estilos.inputContainer, errores.contrasena && estilos.inputError]}>
              <Ionicons
                name={errores.contrasena ? "alert-circle" : "lock-closed-outline"}
                size={22}
                color={errores.contrasena ? DISENO.colors.danger : DISENO.colors.textTertiary}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={contrasenaInputRef}
                style={[estilos.input, { fontSize: inputSize }]}
                value={contrasena}
                onChangeText={handleContrasenaChange}
                placeholder="Tu contraseña"
                placeholderTextColor={DISENO.colors.textTertiary}
                secureTextEntry={!mostrarContrasena}
                selectionColor={DISENO.colors.accent}
                editable={!cargando && !bloqueado}
                returnKeyType="done"
                onSubmitEditing={manejarLogin}
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
            {errores.contrasena && <Text style={estilos.textoError}>{errores.contrasena}</Text>}

            <View style={estilos.recordarContainer}>
              <View style={estilos.recordarLeft}>
                <Switch
                  value={recordarUsuario}
                  onValueChange={setRecordarUsuario}
                  trackColor={{ false: DISENO.colors.border, true: DISENO.colors.accent }}
                  thumbColor={recordarUsuario ? DISENO.colors.surface : DISENO.colors.surface}
                />
                <Text style={[estilos.recordarTexto, { fontSize: isSmallScreen ? 11 : inputSize - 1 }]}>
                  Recordar usuario
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                activeOpacity={0.6}
                style={estilos.olvidoContainer}
              >
                <Text style={[estilos.olvidoTexto, { fontSize: isSmallScreen ? 10 : inputSize - 2 }]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {intentosFallidos > 0 && intentosFallidos < MAX_INTENTOS && (
              <View style={estilos.intentosContainer}>
                <Ionicons name="warning-outline" size={14} color={DISENO.colors.danger + '80'} />
                <Text style={estilos.intentosTexto}>
                  {intentosFallidos} de {MAX_INTENTOS} intentos disponibles
                </Text>
              </View>
            )}

            {bloqueado && (
              <View style={estilos.bloqueoContainer}>
                <Ionicons name="time-outline" size={18} color={DISENO.colors.accent} />
                <Text style={estilos.bloqueoTexto}>
                  ⏳ Bloqueado por {tiempoRestante} segundos
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[estilos.boton, (cargando || bloqueado) && { opacity: 0.6 }]}
              onPress={manejarLogin}
              disabled={cargando || bloqueado}
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
                ) : bloqueado ? (
                  <>
                    <Ionicons name="time" size={buttonTextSize + 4} color={DISENO.colors.surface} />
                    <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                      Espera {tiempoRestante}s
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="log-in" size={buttonTextSize + 4} color={DISENO.colors.surface} />
                    <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                      Iniciar Sesión
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={estilos.enlacesContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Registro')} activeOpacity={0.6}>
                <Text style={[estilos.enlace, { fontSize: inputSize }]}>
                  ¿No tienes cuenta? <Text style={estilos.enlaceDestacado}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={estilos.separadorContainer}>
              <View style={estilos.separador} />
              <Text style={estilos.separadorTexto}>o</Text>
              <View style={estilos.separador} />
            </View>

            <TouchableOpacity
              style={estilos.bannerLogin}
              onPress={() => navigation.navigate('Registro')}
              activeOpacity={0.7}
            >
              <Ionicons name="gift-outline" size={18} color={DISENO.colors.accentSecondary} />
              <Text style={[estilos.bannerLoginTexto, { fontSize: inputSize - 1 }]}>
                🎁 ¿Nuevo? Gana <Text style={estilos.bannerLoginDestacado}>500 puntos</Text> al registrarte
              </Text>
              <Ionicons name="chevron-forward" size={16} color={DISENO.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonInvitado}
              onPress={manejarInvitado}
              activeOpacity={0.6}
              disabled={cargando}
            >
              <Ionicons name="person-outline" size={20} color={DISENO.colors.textTertiary} />
              <Text style={[estilos.botonInvitadoTexto, { fontSize: inputSize }]}>
                Continuar como invitado
              </Text>
            </TouchableOpacity>

            <View style={estilos.legalContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Terminos')}
                activeOpacity={0.6}
              >
                <Text style={[estilos.legalTexto, { fontSize: isTablet ? 12 : 10 }]}>
                  📋 Términos
                </Text>
              </TouchableOpacity>
              <Text style={estilos.legalSeparador}>•</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Privacidad')}
                activeOpacity={0.6}
              >
                <Text style={[estilos.legalTexto, { fontSize: isTablet ? 12 : 10 }]}>
                  🔒 Privacidad
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={estilos.versionTexto}>v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DISENO.colors.fondo,
  },
  headerGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  logoWrapper: {
    ...DISENO.shadow.lg,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.25,
  },
  logoImage: {
    backgroundColor: 'transparent',
    borderRadius: 999,
  },
  formulario: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: DISENO.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...DISENO.shadow.lg,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  label: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    color: DISENO.colors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISENO.colors.surfaceHover,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DISENO.colors.border,
    paddingHorizontal: 14,
    height: 56,
  },
  inputError: {
    borderColor: DISENO.colors.danger,
    backgroundColor: DISENO.colors.danger + '10',
  },
  inputIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  input: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    paddingVertical: 12,
    paddingTop: 15,
    flex: 1,
  },
  eyeButton: {
    padding: 4,
    flexShrink: 0,
  },
  textoError: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorGeneralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DISENO.colors.danger + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: DISENO.colors.danger + '30',
  },
  errorGeneralTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  recordarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  recordarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  recordarTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
  },
  olvidoContainer: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  olvidoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
  intentosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  intentosTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.danger + '80',
    fontSize: 12,
    fontWeight: '500',
  },
  bloqueoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: DISENO.colors.accent + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bloqueoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  boton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    ...DISENO.shadow.md,
    shadowColor: DISENO.colors.accent,
    shadowOpacity: 0.25,
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
    fontFamily: FUENTES.display,  // ✅ Simpsonfont
    fontWeight: '400',
    color: DISENO.colors.surface,
    letterSpacing: 1,
  },
  enlacesContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  enlace: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
  },
  enlaceDestacado: {
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: DISENO.colors.accentSecondary + '10',
    borderWidth: 1,
    borderColor: DISENO.colors.accentSecondary + '20',
  },
  bannerLoginTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '400',
    flex: 1,
    textAlign: 'center',
  },
  bannerLoginDestacado: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.accentSecondary,
    fontWeight: '700',
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
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  legalTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  legalSeparador: {
    color: DISENO.colors.textTertiary,
    fontSize: 10,
    opacity: 0.5,
  },
  versionTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.5,
  },
});