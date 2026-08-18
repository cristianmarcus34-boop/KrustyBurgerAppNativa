// screens/auth/PantallaLogin.tsx - VERSIÓN ROBUSTECIDA Y CON ESTILO BLANCO/ELEGANTE
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
  Dimensions,
  Image,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { notificacionService } from '../../services/notificacionService';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

const { width } = Dimensions.get('window');
const logoImage = require('../../assets/logo-krusty.png');

// ============================================================
// 🎨 SISTEMA DE DISEÑO - BLANCO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F8F7F5',
    surface: '#FFFFFF',
    surfaceHover: '#F5F4F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.05)',
    cardShadowHeavy: 'rgba(0,0,0,0.10)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.03)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentLight: '#FF6B6B',
    accentSecondary: '#F5C518',
    accentSecondaryLight: '#FFE135',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    error: '#E53935',
    errorBg: '#FEE8E8',
    success: '#43A047',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaLogin(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets(); // ✅ UN SOLO insets

  // ✅ ESTADOS
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [mensajeErrorGeneral, setMensajeErrorGeneral] = useState<string | null>(null);

  const { iniciarSesion } = tiendaAutenticacion();

  // ✅ REFS
  const correoInputRef = useRef<TextInput>(null);
  const contrasenaInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | null>(null);

  // ✅ ANIMACIONES
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

    // ✅ Limpiar timer al desmontar
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ✅ FUNCIÓN DE SHAKE PARA ERRORES
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ VALIDACIONES
  const validarCampos = (): boolean => {
    const nuevosErrores: { correo?: string; contrasena?: string } = {};
    let isValid = true;

    // Validar correo
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

    // Validar contraseña
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
      if (nuevosErrores.correo) {
        correoInputRef.current?.focus();
      } else if (nuevosErrores.contrasena) {
        contrasenaInputRef.current?.focus();
      }
    }

    return isValid;
  };

  // ✅ VERIFICAR CONEXIÓN A INTERNET - CON ABORTCONTROLLER
  const verificarConexion = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  };

  // ✅ INICIAR BLOQUEO TEMPORAL
  const iniciarBloqueo = (segundos: number = 30) => {
    setBloqueado(true);
    setTiempoRestante(segundos);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          setBloqueado(false);
          setIntentosFallidos(0);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ✅ MANEJAR LOGIN - ROBUSTECIDO
  const manejarLogin = async () => {
    Keyboard.dismiss();

    if (bloqueado) {
      Alert.alert(
        '⏳ Demasiados intentos',
        `Has excedido el número de intentos. Espera ${tiempoRestante} segundos para intentar nuevamente.`
      );
      return;
    }

    if (!validarCampos()) {
      return;
    }

    const tieneConexion = await verificarConexion();
    if (!tieneConexion) {
      Alert.alert(
        '📡 Sin conexión',
        'No hay conexión a internet. Verifica tu red y vuelve a intentar.'
      );
      return;
    }

    setCargando(true);
    setMensajeErrorGeneral(null);
    setErrores({});

    try {
      const resultado = await iniciarSesion(correo.trim(), contrasena);

      if (!resultado.success) {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);

        if (nuevosIntentos >= 5) {
          iniciarBloqueo(30);
          setCargando(false);
          Alert.alert(
            '🔒 Demasiados intentos',
            'Has superado el límite de intentos. Espera 30 segundos para volver a intentar.'
          );
          return;
        }

        let mensajeError = resultado.error || 'Error al iniciar sesión';
        let tituloError = '⚠️ Error';

        if (mensajeError.includes('Invalid login credentials') ||
          mensajeError.includes('Invalid credentials')) {
          mensajeError = '❌ Correo o contraseña incorrectos. Verifica tus datos.';
          tituloError = 'Credenciales inválidas';
        } else if (mensajeError.includes('User not found')) {
          mensajeError = '❌ No encontramos una cuenta con este correo.';
          tituloError = 'Usuario no encontrado';
        } else if (mensajeError.includes('Email not confirmed')) {
          mensajeError = '📧 Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.';
          tituloError = 'Correo no confirmado';
        } else if (mensajeError.includes('network') || mensajeError.includes('timeout')) {
          mensajeError = '📡 Error de conexión. Verifica tu internet y vuelve a intentar.';
          tituloError = 'Error de red';
        } else if (mensajeError.includes('rate limit')) {
          mensajeError = '⏳ Demasiadas solicitudes. Espera un momento y vuelve a intentar.';
          tituloError = 'Límite de intentos';
        }

        let mensajeCompleto = mensajeError;
        if (nuevosIntentos >= 3) {
          mensajeCompleto += '\n\n💡 ¿Olvidaste tu contraseña? Toca "¿Olvidaste tu contraseña?" para recuperarla.';
        }

        shake();
        setMensajeErrorGeneral(mensajeError);
        Alert.alert(tituloError, mensajeCompleto);
        setCargando(false);
        return;
      }

      setIntentosFallidos(0);
      setMensajeErrorGeneral(null);
      setErrores({});

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

      let mensajeError = 'Ocurrió un error inesperado. Intenta nuevamente.';
      let tituloError = 'Error inesperado';

      if (error?.message) {
        if (error.message.includes('network') || error.message.includes('timeout')) {
          mensajeError = '📡 Error de conexión. Verifica tu internet.';
          tituloError = 'Error de red';
        }
      }

      shake();
      setMensajeErrorGeneral(mensajeError);
      Alert.alert(tituloError, mensajeError);
    } finally {
      setCargando(false);
    }
  };

  // ✅ MANEJAR INVITADO
  const manejarInvitado = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await notificacionService.registrarToken(session.user.id);
      }
    } catch (error) {
      console.log('⚠️ Error en invitado:', error);
    }
    props.navigation.navigate('Principal');
  };

  // ✅ LIMPIAR ERRORES AL ESCRIBIR
  const handleCorreoChange = (text: string) => {
    setCorreo(text);
    if (errores.correo) {
      setErrores(prev => ({ ...prev, correo: undefined }));
    }
    if (mensajeErrorGeneral) {
      setMensajeErrorGeneral(null);
    }
  };

  const handleContrasenaChange = (text: string) => {
    setContrasena(text);
    if (errores.contrasena) {
      setErrores(prev => ({ ...prev, contrasena: undefined }));
    }
    if (mensajeErrorGeneral) {
      setMensajeErrorGeneral(null);
    }
  };

  // ✅ RESPONSIVE
  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

  const logoSize = isTablet ? 120 : isSmallPhone ? 80 : 100;
  const tituloSize = isTablet ? 40 : isSmallPhone ? 28 : 34;
  const subtituloSize = isTablet ? 18 : isSmallPhone ? 13 : 15;
  const labelSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
  const inputSize = isTablet ? 18 : isSmallPhone ? 12 : 13;
  const buttonTextSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
  const paddingTop = insets.top + (isTablet ? 40 : 20);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.background} />

      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
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
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
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
              Krusty Burger
            </Text>
            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
              "El Jefe tiene la última palabra" 🦈
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              estilos.formulario,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideUpAnim },
                  { translateX: shakeAnim }
                ],
              }
            ]}
          >
            {mensajeErrorGeneral && (
              <View style={estilos.errorGeneralContainer}>
                <Ionicons name="alert-circle" size={20} color={DESIGN.colors.error} />
                <Text style={estilos.errorGeneralTexto}>{mensajeErrorGeneral}</Text>
              </View>
            )}

            <Text style={[estilos.label, { fontSize: labelSize }]}>
              Correo electrónico
            </Text>
            <View style={[
              estilos.inputContainer,
              errores.correo && estilos.inputError
            ]}>
              <Ionicons
                name={errores.correo ? "alert-circle" : "mail-outline"}
                size={22}
                color={errores.correo ? DESIGN.colors.error : DESIGN.colors.textTertiary}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={correoInputRef}
                style={[estilos.input, { fontSize: inputSize }]}
                value={correo}
                onChangeText={handleCorreoChange}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={DESIGN.colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={DESIGN.colors.accent}
                editable={!cargando && !bloqueado}
                returnKeyType="next"
                onSubmitEditing={() => contrasenaInputRef.current?.focus()}
              />
              {correo.length > 0 && !errores.correo && (
                <TouchableOpacity onPress={() => setCorreo('')}>
                  <Ionicons name="close-circle" size={18} color={DESIGN.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            {errores.correo && (
              <Text style={estilos.textoError}>{errores.correo}</Text>
            )}

            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
              Contraseña
            </Text>
            <View style={[
              estilos.inputContainer,
              errores.contrasena && estilos.inputError
            ]}>
              <Ionicons
                name={errores.contrasena ? "alert-circle" : "lock-closed-outline"}
                size={22}
                color={errores.contrasena ? DESIGN.colors.error : DESIGN.colors.textTertiary}
                style={estilos.inputIcon}
              />
              <TextInput
                ref={contrasenaInputRef}
                style={[estilos.input, { fontSize: inputSize }]}
                value={contrasena}
                onChangeText={handleContrasenaChange}
                placeholder="Tu contraseña"
                placeholderTextColor={DESIGN.colors.textTertiary}
                secureTextEntry={!mostrarContrasena}
                selectionColor={DESIGN.colors.accent}
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
                  color={DESIGN.colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            {errores.contrasena && (
              <Text style={estilos.textoError}>{errores.contrasena}</Text>
            )}

            {intentosFallidos > 0 && intentosFallidos < 5 && (
              <View style={estilos.intentosContainer}>
                <Ionicons name="warning-outline" size={14} color={DESIGN.colors.error + '80'} />
                <Text style={estilos.intentosTexto}>
                  {intentosFallidos} de 5 intentos disponibles
                </Text>
              </View>
            )}

            {bloqueado && (
              <View style={estilos.bloqueoContainer}>
                <Ionicons name="time-outline" size={18} color={DESIGN.colors.accent} />
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
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={estilos.botonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {cargando ? (
                  <ActivityIndicator color={DESIGN.colors.surface} size="small" />
                ) : bloqueado ? (
                  <>
                    <Ionicons name="time" size={buttonTextSize + 4} color={DESIGN.colors.surface} />
                    <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                      Espera {tiempoRestante}s
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="log-in" size={buttonTextSize + 4} color={DESIGN.colors.surface} />
                    <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                      Iniciar Sesión
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={estilos.enlacesContainer}>
              <TouchableOpacity
                onPress={() => props.navigation.navigate('Registro')}
                activeOpacity={0.6}
              >
                <Text style={[estilos.enlace, { fontSize: isTablet ? 16 : 14 }]}>
                  ¿No tienes cuenta? <Text style={estilos.enlaceDestacado}>Regístrate</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => props.navigation.navigate('ResetPassword')}
                activeOpacity={0.6}
                style={estilos.olvidoContainer}
              >
                <Text style={[estilos.olvidoTexto, { fontSize: isTablet ? 14 : 12 }]}>
                  ¿Olvidaste tu contraseña?
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
              onPress={() => props.navigation.navigate('Registro')}
              activeOpacity={0.7}
            >
              <Ionicons name="gift-outline" size={18} color={DESIGN.colors.accentSecondary} />
              <Text style={[estilos.bannerLoginTexto, { fontSize: isTablet ? 14 : 12 }]}>
                🎁 ¿Nuevo? Gana <Text style={estilos.bannerLoginDestacado}>500 puntos</Text> al registrarte
              </Text>
              <Ionicons name="chevron-forward" size={16} color={DESIGN.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonInvitado}
              onPress={manejarInvitado}
              activeOpacity={0.6}
              disabled={cargando}
            >
              <Ionicons name="person-outline" size={20} color={DESIGN.colors.textSecondary} />
              <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 16 : 14 }]}>
                Continuar como invitado
              </Text>
            </TouchableOpacity>

            <Text style={estilos.versionTexto}>v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - BLANCOS Y ELEGANTES
// ============================================================
const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DESIGN.colors.fondo,
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrapper: {
    marginBottom: 16,
    shadowColor: DESIGN.colors.cardShadowHeavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 15,
  },
  logoImage: {
    backgroundColor: 'transparent',
  },
  titulo: {
    fontWeight: '800',
    color: DESIGN.colors.surface,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    color: DESIGN.colors.surface + '80',
    marginTop: 4,
    fontWeight: '300',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  formulario: {
    width: '100%',
    backgroundColor: DESIGN.colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  label: {
    fontWeight: '600',
    color: DESIGN.colors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.surfaceHover,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DESIGN.colors.border,
    paddingHorizontal: 14,
    height: 56,
  },
  inputError: {
    borderColor: DESIGN.colors.error,
    borderWidth: 1.5,
    backgroundColor: DESIGN.colors.errorBg,
  },
  inputIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  input: {
    color: DESIGN.colors.text,
    paddingVertical: 12,
    paddingTop: 15,
    flex: 1,
  },
  eyeButton: {
    padding: 4,
    flexShrink: 0,
  },
  textoError: {
    color: DESIGN.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorGeneralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN.colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: DESIGN.colors.error + '30',
  },
  errorGeneralTexto: {
    color: DESIGN.colors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  intentosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  intentosTexto: {
    color: DESIGN.colors.error + '80',
    fontSize: 12,
    fontWeight: '500',
  },
  bloqueoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
    backgroundColor: DESIGN.colors.accent + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bloqueoTexto: {
    color: DESIGN.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  boton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: DESIGN.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
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
    fontWeight: '600',
    color: DESIGN.colors.surface,
    letterSpacing: 1,

  },
  enlacesContainer: {
    marginTop: 18,
    alignItems: 'center',
    gap: 10,
  },
  enlace: {
    color: DESIGN.colors.textSecondary,
    fontWeight: '500',
  },
  enlaceDestacado: {
    color: DESIGN.colors.accent,
    fontWeight: '700',
  },
  olvidoContainer: {
    paddingVertical: 4,
  },
  olvidoTexto: {
    color: DESIGN.colors.textTertiary,
    textDecorationLine: 'underline',
    fontWeight: '400',
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
    backgroundColor: DESIGN.colors.border,
  },
  separadorTexto: {
    color: DESIGN.colors.textTertiary,
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
    backgroundColor: DESIGN.colors.accentSecondary + '10',
    borderWidth: 1,
    borderColor: DESIGN.colors.accentSecondary + '20',
  },
  bannerLoginTexto: {
    color: DESIGN.colors.textSecondary,
    fontWeight: '400',
    flex: 1,
    textAlign: 'center',
  },
  bannerLoginDestacado: {
    color: DESIGN.colors.accentSecondary,
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
    borderColor: DESIGN.colors.border,
    backgroundColor: DESIGN.colors.surfaceHover,
  },
  botonInvitadoTexto: {
    color: DESIGN.colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  versionTexto: {
    color: DESIGN.colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.5,
  },
});