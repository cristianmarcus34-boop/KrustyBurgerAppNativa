// screens/auth/PantallaResetPassword.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

export default function PantallaResetPassword(props: any) {
    const [correo, setCorreo] = useState('');
    const [cargando, setCargando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [intentos, setIntentos] = useState(0);
    const [bloqueado, setBloqueado] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState<{
        type: 'success' | 'error' | 'blocked';
        title: string;
        message: string;
        icon: string;
    }>({
        type: 'success',
        title: '',
        message: '',
        icon: '✅',
    });
    const { resetearContrasena } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
    const modalFadeAnim = useRef(new Animated.Value(0)).current;

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

    // ✅ ANIMACIÓN DEL MODAL
    useEffect(() => {
        if (modalVisible) {
            Animated.parallel([
                Animated.spring(modalScaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(modalFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            modalScaleAnim.setValue(0.8);
            modalFadeAnim.setValue(0);
        }
    }, [modalVisible]);

    const mostrarModal = (type: 'success' | 'error' | 'blocked', title: string, message: string, icon: string) => {
        setModalData({ type, title, message, icon });
        setModalVisible(true);
    };

    const formatearTiempo = (segundos: number) => {
        const horas = Math.floor(segundos / 3600);
        const mins = Math.floor((segundos % 3600) / 60);
        const secs = segundos % 60;

        if (horas > 0) {
            return `${horas}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const manejarReset = async () => {
        if (!correo) {
            mostrarModal(
                'error',
                '❌ Correo requerido',
                'Por favor, ingresa tu correo electrónico para continuar.',
                '📧'
            );
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            mostrarModal(
                'error',
                '❌ Correo inválido',
                'El formato del correo electrónico no es válido. Ej: usuario@email.com',
                '📧'
            );
            return;
        }

        if (bloqueado) {
            mostrarModal(
                'blocked',
                '⏳ Bloqueado temporalmente',
                `Has excedido el límite de intentos.\n\n⏱️ Espera ${formatearTiempo(tiempoRestante)} para volver a intentar.\n\n📌 Revisa tu carpeta de SPAM.`,
                '🔒'
            );
            return;
        }

        setCargando(true);
        const resultado = await resetearContrasena(correo);
        setCargando(false);

        if (resultado.success) {
            setEnviado(true);
            setIntentos(0);

            mostrarModal(
                'success',
                '📧 ¡Correo enviado!',
                `Hemos enviado un enlace de recuperación a:\n\n📬 ${correo}\n\n📌 IMPORTANTE:\n• Abre el enlace desde tu TELÉFONO\n• Revisa tu carpeta de SPAM\n• El enlace expira en 1 hora`,
                '🎉'
            );
        } else {
            setIntentos(prev => prev + 1);

            if (resultado.errorType === 'rate_limit') {
                setBloqueado(true);
                setTiempoRestante(3600);

                mostrarModal(
                    'blocked',
                    '⏳ Demasiados intentos',
                    `Has excedido el límite de intentos.\n\n🔒 Bloqueado por 1 hora.\n\n📌 Consejos:\n• Espera 1 hora\n• Revisa SPAM\n• Abre el enlace desde tu TELÉFONO\n\n⏱️ ${formatearTiempo(3600)} restantes`,
                    '🔒'
                );
            } else if (resultado.errorType === 'not_found') {
                mostrarModal(
                    'error',
                    '❌ Cuenta no encontrada',
                    `No existe una cuenta con el correo:\n\n📬 ${correo}\n\n¿Quieres crear una cuenta nueva?`,
                    '🔍'
                );
            } else {
                mostrarModal(
                    'error',
                    '❌ Error al enviar',
                    resultado.error || 'Ocurrió un error inesperado. Intenta nuevamente.',
                    '⚠️'
                );
            }
        }
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

    // ✅ COLORES DEL MODAL SEGÚN TIPO
    // ✅ COLORES DEL MODAL SEGÚN TIPO - CORREGIDO
    const getModalColors = () => {
        switch (modalData.type) {
            case 'success':
                return {
                    gradient: [Colores.verdeClaro, Colores.verdeOscuro] as const,
                    iconBg: Colores.verdeClaro + '20',
                    iconColor: Colores.verdeClaro,
                    titleColor: Colores.verdeClaro,
                };
            case 'error':
                return {
                    gradient: [Colores.secundario, Colores.secundarioOscuro] as const,
                    iconBg: Colores.secundario + '20',
                    iconColor: Colores.secundario,
                    titleColor: Colores.secundario,
                };
            case 'blocked':
                return {
                    gradient: [Colores.acento, Colores.acentoOscuro] as const,
                    iconBg: Colores.acento + '20',
                    iconColor: Colores.acento,
                    titleColor: Colores.acento,
                };
            default:
                return {
                    gradient: [Colores.primario, Colores.primarioOscuro] as const,
                    iconBg: Colores.primario + '20',
                    iconColor: Colores.primario,
                    titleColor: Colores.primario,
                };
        }
    };


    const modalColors = getModalColors() as {
        gradient: readonly [string, string];
        iconBg: string;
        iconColor: string;
        titleColor: string;
    };

    return (
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
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
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
                            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={Colores.frinkAzul} />
                        </TouchableOpacity>

                        <View style={estilos.headerContent}>
                            <Text style={[estilos.icono, { fontSize: isTablet ? 64 : 48 }]}>🔐</Text>
                            <Text style={[estilos.titulo, { fontSize: tituloSize, color: Colores.frinkAzul }]}>
                                Recuperar Contraseña
                            </Text>
                            <Text style={[estilos.subtitulo, { fontSize: subtituloSize, color: Colores.frinkGris }]}>
                                {enviado
                                    ? '✅ Revisa tu correo para continuar'
                                    : '"Glaaaven! Recuperemos tu acceso!" 🧪'}
                            </Text>
                            {!enviado && (
                                <Text style={[estilos.intentosTexto, { fontSize: isTablet ? 13 : 11, color: Colores.frinkAzul + '70' }]}>
                                    Intentos: {intentos}/3
                                </Text>
                            )}
                        </View>
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
                        {!enviado ? (
                            <>
                                <Text style={[estilos.label, { fontSize: labelSize, color: Colores.frinkAzul }]}>
                                    Correo electrónico
                                </Text>
                                <View style={estilos.inputContainer}>
                                    <Ionicons name="mail-outline" size={22} color={Colores.frinkGris} style={estilos.inputIcon} />
                                    <TextInput
                                        style={[estilos.input, { fontSize: inputSize, flex: 1, color: Colores.frinkAzul }]}
                                        value={correo}
                                        onChangeText={setCorreo}
                                        placeholder="tucorreo@ejemplo.com"
                                        placeholderTextColor={Colores.frinkGris + '60'}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        selectionColor={Colores.frinkAzul}
                                        editable={!estaBloqueado}
                                    />
                                </View>

                                {estaBloqueado && (
                                    <View style={estilos.bloqueadoContainer}>
                                        <Ionicons name="time-outline" size={isTablet ? 24 : 20} color={Colores.frinkAzul} />
                                        <Text style={[estilos.bloqueadoTexto, { fontSize: isTablet ? 14 : 12, color: Colores.frinkAzul }]}>
                                            ⏳ Bloqueado: {formatearTiempo(tiempoRestante)}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[estilos.boton, estaBloqueado && { opacity: 0.5 }]}
                                    onPress={manejarReset}
                                    disabled={estaBloqueado || cargando}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[Colores.frinkAmarillo, Colores.frinkAzul]}
                                        style={estilos.botonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {cargando ? (
                                            <ActivityIndicator color={Colores.frinkBlanco} size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={buttonTextSize + 4} color={Colores.frinkBlanco} />
                                                <Text style={[estilos.textoBoton, { fontSize: buttonTextSize, color: Colores.frinkBlanco }]}>
                                                    {estaBloqueado ? '⏳ Bloqueado' : 'Enviar enlace'}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={estilos.enlaceLogin}
                                    onPress={() => props.navigation.navigate('Login')}
                                    activeOpacity={0.6}
                                >
                                    <Text style={[estilos.enlaceLoginTexto, { fontSize: isTablet ? 15 : 13, color: Colores.frinkGris }]}>
                                        <Ionicons name="arrow-back" size={isTablet ? 16 : 14} color={Colores.frinkGris} />
                                        {' '}Volver al inicio de sesión
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            // ✅ VERSIÓN SIMPLIFICADA CUANDO YA SE ENVIÓ
                            <View style={estilos.exitoContainer}>
                                <View style={estilos.exitoIcono}>
                                    <Ionicons name="checkmark-circle" size={isTablet ? 80 : 60} color={Colores.verdeClaro} />
                                </View>
                                <Text style={[estilos.exitoTitulo, { fontSize: isTablet ? 24 : 20, color: Colores.verdeClaro }]}>
                                    ¡Correo enviado! 📧
                                </Text>
                                <Text style={[estilos.exitoTexto, { fontSize: isTablet ? 16 : 14, color: Colores.frinkGris }]}>
                                    Hemos enviado un enlace de recuperación a:
                                </Text>
                                <Text style={[estilos.exitoCorreo, { fontSize: isTablet ? 17 : 15, color: Colores.frinkAzul }]}>
                                    {correo}
                                </Text>
                                <Text style={[estilos.exitoInstrucciones, { fontSize: isTablet ? 14 : 12, color: Colores.frinkGris }]}>
                                    Revisa tu bandeja de entrada y sigue las instrucciones.
                                </Text>
                                <Text style={[estilos.exitoSpam, { fontSize: isTablet ? 12 : 10, color: Colores.frinkAzul + '70' }]}>
                                    📌 Si no ves el correo, revisa tu carpeta de SPAM.
                                </Text>
                                <Text style={[estilos.exitoImportante, { fontSize: isTablet ? 12 : 10, color: Colores.secundario }]}>
                                    ⚠️ IMPORTANTE: Abre el enlace desde tu TELÉFONO
                                </Text>

                                <TouchableOpacity
                                    style={[estilos.boton, { marginTop: 20 }]}
                                    onPress={() => props.navigation.navigate('Login')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[Colores.frinkAmarillo, Colores.frinkAzul]}
                                        style={estilos.botonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="log-in" size={buttonTextSize + 4} color={Colores.frinkBlanco} />
                                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize, color: Colores.frinkBlanco }]}>
                                            Volver al inicio de sesión
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ✅ MODAL MODERNO */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                onRequestClose={() => setModalVisible(false)}
            >
                <Animated.View
                    style={[
                        estilos.modalOverlay,
                        {
                            opacity: modalFadeAnim,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={estilos.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => { }}
                    >
                        <Animated.View
                            style={[
                                estilos.modalContainer,
                                {
                                    transform: [{ scale: modalScaleAnim }],
                                    borderColor: modalColors.iconColor + '40',
                                }
                            ]}
                        >
                            {/* ✅ CABECERA CON GRADIENTE */}
                            <LinearGradient
                                colors={modalColors.gradient}
                                style={estilos.modalHeader}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={[estilos.modalIconContainer, { backgroundColor: modalColors.iconBg }]}>
                                    <Text style={[estilos.modalIcon, { fontSize: isTablet ? 56 : 44 }]}>
                                        {modalData.icon}
                                    </Text>
                                </View>
                            </LinearGradient>

                            {/* ✅ CUERPO DEL MODAL */}
                            <View style={estilos.modalBody}>
                                <Text style={[estilos.modalTitle, { fontSize: isTablet ? 24 : 20, color: modalColors.titleColor }]}>
                                    {modalData.title}
                                </Text>

                                <View style={estilos.modalMessageContainer}>
                                    <Text style={[estilos.modalMessage, { fontSize: isTablet ? 16 : 14 }]}>
                                        {modalData.message}
                                    </Text>
                                </View>

                                {/* ✅ BOTÓN DE ACCIÓN */}
                                <TouchableOpacity
                                    style={estilos.modalButton}
                                    onPress={() => {
                                        setModalVisible(false);
                                        if (modalData.type === 'success') {
                                            // Si fue éxito, redirigir al login después de cerrar
                                            setTimeout(() => {
                                                props.navigation.navigate('Login');
                                            }, 300);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={modalColors.gradient}
                                        style={estilos.modalButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={[estilos.modalButtonText, { fontSize: isTablet ? 17 : 15 }]}>
                                            {modalData.type === 'success' ? '¡Entendido!' : 'Entendido'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </Modal>
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
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitulo: {
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.7,
        fontStyle: 'italic',
    },
    intentosTexto: {
        marginTop: 4,
        opacity: 0.7,
    },
    formulario: {
        width: '100%',
    },
    label: {
        fontWeight: '600',
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
        height: 56,
        marginBottom: 20,
    },
    inputIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    input: {
        paddingVertical: 12,
    },
    bloqueadoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colores.frinkAzul + '15',
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: Colores.frinkAzul + '20',
    },
    bloqueadoTexto: {
        fontWeight: '600',
    },
    boton: {
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
        letterSpacing: 1,
    },
    enlaceLogin: {
        marginTop: 16,
        alignItems: 'center',
    },
    enlaceLoginTexto: {
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
        textAlign: 'center',
    },
    exitoTexto: {
        textAlign: 'center',
        marginTop: 8,
    },
    exitoCorreo: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 4,
    },
    exitoInstrucciones: {
        textAlign: 'center',
        marginTop: 12,
        opacity: 0.7,
        lineHeight: 20,
    },
    exitoSpam: {
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.6,
    },
    exitoImportante: {
        textAlign: 'center',
        marginTop: 12,
        fontWeight: 'bold',
    },
    // ✅ ESTILOS DEL MODAL MODERNO
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    modalContainer: {
        backgroundColor: Colores.fondoOscuro,
        borderRadius: 24,
        width: '92%',
        maxWidth: 420,
        overflow: 'hidden',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 30,
    },
    modalHeader: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalIcon: {
        // Tamaño dinámico
    },
    modalBody: {
        padding: 24,
        paddingTop: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessageContainer: {
        backgroundColor: Colores.textoOscuro + '20',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: Colores.textoClaro + '8',
        marginBottom: 20,
    },
    modalMessage: {
        color: Colores.textoClaro,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButton: {
        borderRadius: 14,
        overflow: 'hidden',
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: Colores.textoClaro,
        fontWeight: '700',
        letterSpacing: 1,
    },
});