// screens/auth/PantallaResetPassword.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';

// ============================================================
// 🎨 PALETA DE COLORES
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

export default function PantallaResetPassword(props: any) {
    const [correo, setCorreo] = useState('');
    const [cargando, setCargando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [intentos, setIntentos] = useState(0);
    const [bloqueado, setBloqueado] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const { resetearContrasena } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // ✅ TIMER PARA DESBLOQUEO
    useEffect(() => {
        let interval: ReturnType<typeof setTimeout>;
        if (bloqueado && tiempoRestante > 0) {
            interval = setInterval(() => {
                setTiempoRestante(prev => {
                    if (prev <= 1) {
                        setBloqueado(false);
                        setIntentos(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [bloqueado, tiempoRestante]);

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

    const manejarReset = async () => {
        if (!correo) {
            Alert.alert('Error', 'Ingresa tu correo electrónico');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            Alert.alert('Error', 'Ingresa un correo electrónico válido');
            return;
        }

        if (bloqueado) {
            Alert.alert('⏳ Bloqueado temporalmente', `Espera ${Math.ceil(tiempoRestante / 60)} minutos para volver a intentar.`);
            return;
        }

        setCargando(true);
        const resultado = await resetearContrasena(correo);
        setCargando(false);

        if (resultado.success) {
            setEnviado(true);
            setIntentos(0);
        } else {
            setIntentos(prev => prev + 1);

            // ✅ MANEJO DE ERROR SEGÚN TIPO
            if (resultado.errorType === 'rate_limit') {
                // Bloquear por 1 hora (3600 segundos)
                setBloqueado(true);
                setTiempoRestante(3600);

                Alert.alert(
                    '⏳ Demasiados intentos',
                    'Has excedido el límite de intentos. Serás bloqueado por 1 hora.\n\n' +
                    '📌 Consejo: Revisa tu carpeta de SPAM por si el correo ya fue enviado.\n\n' +
                    '⏱️ Tiempo restante: 60 minutos',
                    [{ text: 'Entendido' }]
                );
            } else {
                // Mostrar el error específico
                Alert.alert('Error', resultado.error || 'No se pudo enviar el correo de recuperación');
            }
        }
    };

    const formatearTiempo = (segundos: number) => {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
    const paddingTop = insets.top + (isTablet ? 40 : 20);
    const tituloSize = isTablet ? 32 : isSmallPhone ? 24 : 28;
    const subtituloSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
    const labelSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
    const inputSize = isTablet ? 18 : isSmallPhone ? 15 : 16;
    const buttonTextSize = isTablet ? 18 : isSmallPhone ? 15 : 16;

    const estaBloqueado = bloqueado || intentos >= 3;

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
                    {/* ✅ HEADER CON ANIMACIÓN */}
                    <Animated.View
                        style={[
                            estilos.header,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={estilos.botonVolver}
                            onPress={() => props.navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                        </TouchableOpacity>

                        <View style={estilos.headerContent}>
                            <Text style={[estilos.icono, { fontSize: isTablet ? 64 : 48 }]}>🔐</Text>
                            <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                                Recuperar Contraseña
                            </Text>
                            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
                                {enviado
                                    ? 'Revisa tu correo para continuar'
                                    : 'Te enviaremos un enlace para restablecer tu contraseña'}
                            </Text>
                            {!enviado && (
                                <Text style={[estilos.intentosTexto, { fontSize: isTablet ? 13 : 11 }]}>
                                    Intentos: {intentos}/3
                                </Text>
                            )}
                        </View>
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
                        {!enviado ? (
                            <>
                                {/* Email */}
                                <Text style={[estilos.label, { fontSize: labelSize }]}>
                                    Correo electrónico
                                </Text>
                                <View style={estilos.inputContainer}>
                                    <Ionicons name="mail-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
                                    <TextInput
                                        style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                                        value={correo}
                                        onChangeText={setCorreo}
                                        placeholder="tucorreo@ejemplo.com"
                                        placeholderTextColor={COLORS.grisClaro + '60'}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        selectionColor={COLORS.amarillo}
                                        editable={!estaBloqueado}
                                    />
                                </View>

                                {/* ✅ INDICADOR DE BLOQUEO */}
                                {estaBloqueado && (
                                    <View style={estilos.bloqueadoContainer}>
                                        <Ionicons name="time-outline" size={isTablet ? 24 : 20} color={COLORS.amarillo} />
                                        <Text style={[estilos.bloqueadoTexto, { fontSize: isTablet ? 14 : 12 }]}>
                                            ⏳ Bloqueado: {formatearTiempo(tiempoRestante)}
                                        </Text>
                                    </View>
                                )}

                                {/* ✅ BOTÓN ENVIAR */}
                                <TouchableOpacity
                                    style={[estilos.boton, estaBloqueado && { opacity: 0.5 }]}
                                    onPress={manejarReset}
                                    disabled={estaBloqueado || cargando}
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
                                                <Ionicons name="send" size={buttonTextSize + 4} color={COLORS.negro} />
                                                <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                                                    {estaBloqueado ? '⏳ Bloqueado' : 'Enviar enlace'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* ✅ ENLACE A LOGIN */}
                                <TouchableOpacity
                                    style={estilos.enlaceLogin}
                                    onPress={() => props.navigation.navigate('Login')}
                                    activeOpacity={0.6}
                                >
                                    <Text style={[estilos.enlaceLoginTexto, { fontSize: isTablet ? 15 : 13 }]}>
                                        <Ionicons name="arrow-back" size={isTablet ? 16 : 14} color={COLORS.grisClaro} />
                                        {' '}Volver al inicio de sesión
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            // ✅ MENSAJE DE ÉXITO
                            <View style={estilos.exitoContainer}>
                                <View style={estilos.exitoIcono}>
                                    <Ionicons name="checkmark-circle" size={isTablet ? 80 : 60} color={COLORS.verdeClaro} />
                                </View>
                                <Text style={[estilos.exitoTitulo, { fontSize: isTablet ? 24 : 20 }]}>
                                    ¡Correo enviado! 📧
                                </Text>
                                <Text style={[estilos.exitoTexto, { fontSize: isTablet ? 16 : 14 }]}>
                                    Hemos enviado un enlace de recuperación a:
                                </Text>
                                <Text style={[estilos.exitoCorreo, { fontSize: isTablet ? 17 : 15 }]}>
                                    {correo}
                                </Text>
                                <Text style={[estilos.exitoInstrucciones, { fontSize: isTablet ? 14 : 12 }]}>
                                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                                </Text>
                                <Text style={[estilos.exitoSpam, { fontSize: isTablet ? 12 : 10 }]}>
                                    📌 Si no ves el correo, revisa tu carpeta de SPAM.
                                </Text>

                                <TouchableOpacity
                                    style={[estilos.boton, { marginTop: 20 }]}
                                    onPress={() => props.navigation.navigate('Login')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                        style={estilos.botonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="log-in" size={buttonTextSize + 4} color={COLORS.negro} />
                                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                                            Volver al inicio de sesión
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
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
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    botonVolver: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 4,
        zIndex: 10,
    },
    headerContent: {
        alignItems: 'center',
        marginTop: 10,
    },
    icono: {
        marginBottom: 8,
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitulo: {
        color: COLORS.grisClaro,
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.7,
    },
    intentosTexto: {
        color: COLORS.amarillo,
        marginTop: 4,
        opacity: 0.7,
    },
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
        height: 56,
        marginBottom: 20,
    },
    inputIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    input: {
        color: COLORS.blanco,
        paddingVertical: 12,
    },
    bloqueadoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.amarillo + '15',
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.amarillo + '20',
    },
    bloqueadoTexto: {
        color: COLORS.amarillo,
        fontWeight: '600',
    },
    boton: {
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
        letterSpacing: 1,
    },
    enlaceLogin: {
        marginTop: 16,
        alignItems: 'center',
    },
    enlaceLoginTexto: {
        color: COLORS.grisClaro,
        fontWeight: '500',
    },
    exitoContainer: {
        alignItems: 'center',
    },
    exitoIcono: {
        marginBottom: 16,
    },
    exitoTitulo: {
        fontWeight: 'bold',
        color: COLORS.verdeClaro,
        textAlign: 'center',
    },
    exitoTexto: {
        color: COLORS.grisClaro,
        textAlign: 'center',
        marginTop: 8,
    },
    exitoCorreo: {
        color: COLORS.blanco,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 4,
    },
    exitoInstrucciones: {
        color: COLORS.grisClaro,
        textAlign: 'center',
        marginTop: 12,
        opacity: 0.7,
        lineHeight: 20,
    },
    exitoSpam: {
        color: COLORS.amarillo,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.6,
    },
});