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
import { notificacionService } from '../../services/notificacionService';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');
const logoImage = require('../../assets/logo-krusty.png');

export default function PantallaLogin(props: any) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const { iniciarSesion } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();

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

  const registrarNotificaciones = async (usuarioId: string) => {
    try {
      const permisos = await notificacionService.solicitarPermisos();
      if (permisos) {
        const registrado = await notificacionService.registrarToken(usuarioId);
        if (registrado) {
          console.log('✅ Notificaciones configuradas correctamente');
        } else {
          console.log('⚠️ No se pudo registrar el token FCM');
        }
      } else {
        console.log('⚠️ Permisos de notificación no concedidos');
      }
    } catch (error) {
      console.error('❌ Error configurando notificaciones:', error);
    }
  };

  const manejarLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setCargando(true);

    try {
      const error = await iniciarSesion(correo, contrasena);

      if (error) {
        Alert.alert('Error', error);
        setCargando(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        await registrarNotificaciones(session.user.id);
      }

    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const manejarInvitado = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await registrarNotificaciones(session.user.id);
      }
    } catch (error) {
      console.error('Error en invitado:', error);
    }
    props.navigation.navigate('Principal');
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const logoSize = isTablet ? 120 : isSmallPhone ? 80 : 100;
  const tituloSize = isTablet ? 40 : isSmallPhone ? 28 : 34;
  const subtituloSize = isTablet ? 18 : isSmallPhone ? 13 : 15;
  const labelSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
  const inputSize = isTablet ? 18 : isSmallPhone ? 15 : 16;
  const buttonTextSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
  const paddingTop = insets.top + (isTablet ? 40 : 20);

  return (
    // 🦈 GRADIENTE GORGORY: Azul marino → Gris
    <LinearGradient
      colors={[Colores.gorgoryAzul, Colores.gorgoryGris]}
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
                    borderRadius: logoSize / 2,
                  }
                ]}
                resizeMode="contain"
              />
            </View>
            {/* 🦈 Título en Blanco Gorgory */}
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
                transform: [{ translateY: slideUpAnim }],
              }
            ]}
          >
            <Text style={[estilos.label, { fontSize: labelSize }]}>
              Correo electrónico
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="mail-outline" size={22} color={Colores.gorgoryGris} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize, flex: 1, paddingRight: 12 }]}
                value={correo}
                onChangeText={setCorreo}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={Colores.gorgoryGris + '60'}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={Colores.gorgoryRojo}
                numberOfLines={1}
              />
            </View>

            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 20 }]}>
              Contraseña
            </Text>
            <View style={estilos.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color={Colores.gorgoryGris} style={estilos.inputIcon} />
              <TextInput
                style={[estilos.input, { fontSize: inputSize, flex: 1, paddingRight: 12 }]}
                value={contrasena}
                onChangeText={setContrasena}
                placeholder="Tu contraseña"
                placeholderTextColor={Colores.gorgoryGris + '60'}
                secureTextEntry={!mostrarContrasena}
                selectionColor={Colores.gorgoryRojo}
                numberOfLines={1}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                style={estilos.eyeButton}
              >
                <Ionicons
                  name={mostrarContrasena ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={Colores.gorgoryGris}
                />
              </TouchableOpacity>
            </View>

            {/* 🦈 Botón Rojo Gorgory */}
            <TouchableOpacity
              style={estilos.boton}
              onPress={manejarLogin}
              disabled={cargando}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colores.gorgoryRojo, Colores.gorgoryAzul]}
                style={estilos.botonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {cargando ? (
                  <ActivityIndicator color={Colores.gorgoryBlanco} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={buttonTextSize + 4} color={Colores.gorgoryBlanco} />
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
              style={estilos.botonInvitado}
              onPress={manejarInvitado}
              activeOpacity={0.6}
            >
              <Ionicons name="person-outline" size={20} color={Colores.gorgoryGris} />
              <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 16 : 14 }]}>
                Continuar como invitado
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    marginBottom: 16,
    shadowColor: Colores.gorgoryRojo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    backgroundColor: 'transparent',
    borderRadius: 100,
  },
  titulo: {
    fontWeight: '900',
    color: Colores.gorgoryBlanco,
    letterSpacing: 3,
    textShadowColor: Colores.gorgoryOscuro,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    color: Colores.gorgoryBlanco + '80',
    marginTop: 5,
    fontWeight: '300',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  formulario: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    color: Colores.gorgoryBlanco,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.gorgoryBlanco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colores.gorgoryGris + '30',
    paddingHorizontal: 14,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  input: {
    color: Colores.gorgoryAzul,
    paddingVertical: 12,
    paddingTop: 14,
  },
  eyeButton: {
    padding: 4,
    flexShrink: 0,
  },
  boton: {
    marginTop: 28,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colores.gorgoryRojo,
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
    color: Colores.gorgoryBlanco,
    letterSpacing: 1.5,
  },
  enlacesContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  enlace: {
    color: Colores.gorgoryBlanco + '70',
    fontWeight: '500',
  },
  enlaceDestacado: {
    color: Colores.gorgoryRojo,
    fontWeight: '700',
  },
  olvidoContainer: {
    paddingVertical: 4,
  },
  olvidoTexto: {
    color: Colores.gorgoryBlanco + '50',
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  separador: {
    flex: 1,
    height: 1,
    backgroundColor: Colores.gorgoryBlanco + '20',
  },
  separadorTexto: {
    color: Colores.gorgoryBlanco + '40',
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
    borderColor: Colores.gorgoryBlanco + '20',
    backgroundColor: Colores.gorgoryBlanco + '15',
  },
  botonInvitadoTexto: {
    color: Colores.gorgoryBlanco + '70',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});