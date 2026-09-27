// screens/auth/PantallaResetPassword.tsx - V2 RESPONSIVE
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Modal, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores, useResponsive } from '../../lib/colores';

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosReset {
    paddingHorizontal: number;
    paddingTop: number;
    paddingBottom: number;
    maxFormWidth: number;
    // Textos
    tituloSize: number;
    subtituloSize: number;
    labelSize: number;
    inputSize: number;
    buttonTextSize: number;
    intentosSize: number;
    smallTextSize: number;
    // Layout
    iconoSize: number;
    inputHeight: number;
    inputPaddingH: number;
    inputRadius: number;
    buttonPaddingV: number;
    buttonRadius: number;
    iconSize: number;
    sectionGap: number;
    backIconSize: number;
    // Modal
    modalMaxWidth: number;
    modalPadding: number;
    modalIconContainerSize: number;
    modalIconSize: number;
    modalTitleSize: number;
    modalMessageSize: number;
    modalButtonTextSize: number;
    modalButtonPaddingV: number;
}

const calcularTamanosReset = (
    width: number,
    height: number,
    isTablet: boolean,
    isDesktop: boolean,
    isSmallPhone: boolean,
): TamanosReset => {
    const paddingHorizontal = isDesktop ? 60 : isTablet ? 40 : isSmallPhone ? 16 : 22;
    const maxFormWidth = isDesktop ? 480 : isTablet ? 460 : width;
    const iconoSize = isDesktop ? 72 : isTablet ? 64 : isSmallPhone ? 44 : 54;
    const tituloSize = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 22 : 26;
    const subtituloSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const labelSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12.5 : 13.5;
    const inputSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13.5 : 14.5;
    const buttonTextSize = isDesktop ? 19 : isTablet ? 18 : isSmallPhone ? 15 : 17;
    const intentosSize = isDesktop ? 13 : isTablet ? 13 : isSmallPhone ? 11 : 12;
    const smallTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;

    const inputHeight = isDesktop ? 60 : isTablet ? 58 : isSmallPhone ? 50 : 54;
    const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const inputRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
    const buttonPaddingV = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
    const buttonRadius = isSmallPhone ? 12 : 14;
    const iconSize = isDesktop ? 22 : isTablet ? 22 : isSmallPhone ? 20 : 21;
    const sectionGap = isSmallPhone ? 12 : 16;
    const backIconSize = isDesktop ? 28 : isTablet ? 28 : isSmallPhone ? 22 : 24;

    // Modal
    const modalMaxWidth = isDesktop ? 440 : isTablet ? 420 : 400;
    const modalPadding = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 18 : 22;
    const modalIconContainerSize = isDesktop ? 92 : isTablet ? 88 : isSmallPhone ? 64 : 76;
    const modalIconSize = isDesktop ? 52 : isTablet ? 48 : isSmallPhone ? 36 : 44;
    const modalTitleSize = isDesktop ? 24 : isTablet ? 23 : isSmallPhone ? 18 : 20;
    const modalMessageSize = isDesktop ? 15 : isTablet ? 15 : isSmallPhone ? 12.5 : 14;
    const modalButtonTextSize = isDesktop ? 17 : isTablet ? 16 : isSmallPhone ? 14 : 15;
    const modalButtonPaddingV = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;

    return {
        paddingHorizontal,
        paddingTop: 8,
        paddingBottom: 24,
        maxFormWidth,
        tituloSize,
        subtituloSize,
        labelSize,
        inputSize,
        buttonTextSize,
        intentosSize,
        smallTextSize,
        iconoSize,
        inputHeight,
        inputPaddingH,
        inputRadius,
        buttonPaddingV,
        buttonRadius,
        iconSize,
        sectionGap,
        backIconSize,
        modalMaxWidth,
        modalPadding,
        modalIconContainerSize,
        modalIconSize,
        modalTitleSize,
        modalMessageSize,
        modalButtonTextSize,
        modalButtonPaddingV,
    };
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaResetPassword(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const tamanos = useMemo(
        () =>
            calcularTamanosReset(
                screenWidth,
                screenHeight,
                responsive.isTablet,
                responsive.isDesktop,
                responsive.isSmallPhone,
            ),
        [screenWidth, screenHeight, responsive.isTablet, responsive.isDesktop, responsive.isSmallPhone],
    );

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
    }>({ type: 'success', title: '', message: '', icon: '✅' });

    const { resetearContrasena } = tiendaAutenticacion();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
    const modalFadeAnim = useRef(new Animated.Value(0)).current;

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
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (modalVisible) {
            Animated.parallel([
                Animated.spring(modalScaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                Animated.timing(modalFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
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
        if (horas > 0) return `${horas}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    const manejarReset = async () => {
        if (!correo) {
            mostrarModal('error', '❌ Correo requerido', 'Por favor, ingresa tu correo electrónico para continuar.', '📧');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            mostrarModal('error', '❌ Correo inválido', 'El formato del correo electrónico no es válido. Ej: usuario@email.com', '📧');
            return;
        }
        if (bloqueado) {
            mostrarModal('blocked', '⏳ Bloqueado temporalmente', `Has excedido el límite de intentos.\n\n⏱️ Espera ${formatearTiempo(tiempoRestante)} para volver a intentar.\n\n📌 Revisa tu carpeta de SPAM.`, '🔒');
            return;
        }

        setCargando(true);
        const resultado = await resetearContrasena(correo);
        setCargando(false);

        if (resultado.success) {
            setEnviado(true);
            setIntentos(0);
            mostrarModal('success', '📧 ¡Correo enviado!', `Hemos enviado un enlace de recuperación a:\n\n📬 ${correo}\n\n📌 IMPORTANTE:\n• Abre el enlace desde tu TELÉFONO\n• Revisa tu carpeta de SPAM\n• El enlace expira en 1 hora`, '🎉');
        } else {
            setIntentos(prev => prev + 1);
            if (resultado.errorType === 'rate_limit') {
                setBloqueado(true);
                setTiempoRestante(3600);
                mostrarModal('blocked', '⏳ Demasiados intentos', `Has excedido el límite de intentos.\n\n🔒 Bloqueado por 1 hora.\n\n📌 Consejos:\n• Espera 1 hora\n• Revisa SPAM\n• Abre el enlace desde tu TELÉFONO\n\n⏱️ ${formatearTiempo(3600)} restantes`, '🔒');
            } else if (resultado.errorType === 'not_found') {
                mostrarModal('error', '❌ Cuenta no encontrada', `No existe una cuenta con el correo:\n\n📬 ${correo}\n\n¿Quieres crear una cuenta nueva?`, '🔍');
            } else {
                mostrarModal('error', '❌ Error al enviar', resultado.error || 'Ocurrió un error inesperado. Intenta nuevamente.', '⚠️');
            }
        }
    };

    const estaBloqueado = bloqueado || intentos >= 3;

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
                            paddingHorizontal: tamanos.paddingHorizontal,
                            paddingTop: insets.top + tamanos.paddingTop,
                            paddingBottom: insets.bottom + tamanos.paddingBottom,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* ============ HEADER ============ */}
                    <Animated.View
                        style={[
                            estilos.header,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <TouchableOpacity
                            style={estilos.botonVolver}
                            onPress={() => props.navigation.goBack()}
                            activeOpacity={0.7}
                            hitSlop={12}
                        >
                            <Ionicons name="arrow-back" size={tamanos.backIconSize} color={Colores.frinkAzul} />
                        </TouchableOpacity>

                        <View style={estilos.headerContent}>
                            <Text
                                style={[estilos.icono, { fontSize: tamanos.iconoSize }]}
                                allowFontScaling={false}
                            >
                                🔐
                            </Text>
                            <Text
                                style={[estilos.titulo, { fontSize: tamanos.tituloSize, color: Colores.frinkAzul }]}
                                allowFontScaling={false}
                                numberOfLines={2}
                            >
                                Recuperar Contraseña
                            </Text>
                            <Text
                                style={[estilos.subtitulo, { fontSize: tamanos.subtituloSize, color: Colores.frinkGris }]}
                                allowFontScaling={false}
                                numberOfLines={2}
                            >
                                {enviado
                                    ? '✅ Revisa tu correo para continuar'
                                    : '"Glaaaven! Recuperemos tu acceso!" 🧪'}
                            </Text>
                            {!enviado && (
                                <Text
                                    style={[
                                        estilos.intentosTexto,
                                        { fontSize: tamanos.intentosSize, color: Colores.frinkAzul + '70' },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    Intentos: {intentos}/3
                                </Text>
                            )}
                        </View>
                    </Animated.View>

                    {/* ============ FORMULARIO ============ */}
                    <Animated.View
                        style={[
                            estilos.formulario,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideUpAnim }],
                                maxWidth: tamanos.maxFormWidth,
                            },
                        ]}
                    >
                        {!enviado ? (
                            <>
                                <Text
                                    style={[estilos.label, { fontSize: tamanos.labelSize, color: Colores.frinkAzul }]}
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
                                            marginBottom: tamanos.sectionGap,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        size={tamanos.iconSize}
                                        color={Colores.frinkGris}
                                        style={estilos.inputIcon}
                                    />
                                    <TextInput
                                        style={[estilos.input, { fontSize: tamanos.inputSize, color: Colores.frinkAzul }]}
                                        value={correo}
                                        onChangeText={setCorreo}
                                        placeholder="tucorreo@ejemplo.com"
                                        placeholderTextColor={Colores.frinkGris + '60'}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        selectionColor={Colores.frinkAzul}
                                        editable={!estaBloqueado}
                                        allowFontScaling={false}
                                        returnKeyType="send"
                                        onSubmitEditing={manejarReset}
                                    />
                                </View>

                                {estaBloqueado && (
                                    <View
                                        style={[
                                            estilos.bloqueadoContainer,
                                            { marginBottom: tamanos.sectionGap, paddingVertical: 10 },
                                        ]}
                                    >
                                        <Ionicons name="time-outline" size={tamanos.iconSize} color={Colores.frinkAzul} />
                                        <Text
                                            style={[estilos.bloqueadoTexto, { fontSize: tamanos.smallTextSize, color: Colores.frinkAzul }]}
                                            allowFontScaling={false}
                                        >
                                            ⏳ Bloqueado: {formatearTiempo(tiempoRestante)}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[
                                        estilos.boton,
                                        { borderRadius: tamanos.buttonRadius },
                                        estaBloqueado && { opacity: 0.5 },
                                    ]}
                                    onPress={manejarReset}
                                    disabled={estaBloqueado || cargando}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[Colores.frinkAmarillo, Colores.frinkAzul]}
                                        style={[estilos.botonGradient, { paddingVertical: tamanos.buttonPaddingV }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {cargando ? (
                                            <ActivityIndicator color={Colores.frinkBlanco} size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={tamanos.buttonTextSize + 4} color={Colores.frinkBlanco} />
                                                <Text
                                                    style={[estilos.textoBoton, { fontSize: tamanos.buttonTextSize, color: Colores.frinkBlanco }]}
                                                    allowFontScaling={false}
                                                >
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
                                    <Text
                                        style={[estilos.enlaceLoginTexto, { fontSize: tamanos.smallTextSize, color: Colores.frinkGris }]}
                                        allowFontScaling={false}
                                    >
                                        <Ionicons name="arrow-back" size={tamanos.smallTextSize + 1} color={Colores.frinkGris} />
                                        {' '}Volver al inicio de sesión
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={estilos.exitoContainer}>
                                <View style={{ marginBottom: tamanos.sectionGap }}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={tamanos.iconoSize + 20}
                                        color={Colores.verdeClaro}
                                    />
                                </View>
                                <Text
                                    style={[estilos.exitoTitulo, { fontSize: tamanos.tituloSize - 6, color: Colores.verdeClaro }]}
                                    allowFontScaling={false}
                                >
                                    ¡Correo enviado! 📧
                                </Text>
                                <Text
                                    style={[estilos.exitoTexto, { fontSize: tamanos.smallTextSize + 1, color: Colores.frinkGris }]}
                                    allowFontScaling={false}
                                >
                                    Hemos enviado un enlace de recuperación a:
                                </Text>
                                <Text
                                    style={[estilos.exitoCorreo, { fontSize: tamanos.smallTextSize + 2, color: Colores.frinkAzul }]}
                                    allowFontScaling={false}
                                    numberOfLines={1}
                                >
                                    {correo}
                                </Text>
                                <Text
                                    style={[estilos.exitoInstrucciones, { fontSize: tamanos.smallTextSize, color: Colores.frinkGris }]}
                                    allowFontScaling={false}
                                >
                                    Revisa tu bandeja de entrada y sigue las instrucciones.
                                </Text>
                                <Text
                                    style={[estilos.exitoSpam, { fontSize: tamanos.smallTextSize - 1, color: Colores.frinkAzul + '70' }]}
                                    allowFontScaling={false}
                                >
                                    📌 Si no ves el correo, revisa tu carpeta de SPAM.
                                </Text>
                                <Text
                                    style={[estilos.exitoImportante, { fontSize: tamanos.smallTextSize - 1, color: Colores.secundario }]}
                                    allowFontScaling={false}
                                >
                                    ⚠️ IMPORTANTE: Abre el enlace desde tu TELÉFONO
                                </Text>

                                <TouchableOpacity
                                    style={[estilos.boton, { marginTop: 20, borderRadius: tamanos.buttonRadius }]}
                                    onPress={() => props.navigation.navigate('Login')}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[Colores.frinkAmarillo, Colores.frinkAzul]}
                                        style={[estilos.botonGradient, { paddingVertical: tamanos.buttonPaddingV }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="log-in" size={tamanos.buttonTextSize + 4} color={Colores.frinkBlanco} />
                                        <Text
                                            style={[estilos.textoBoton, { fontSize: tamanos.buttonTextSize, color: Colores.frinkBlanco }]}
                                            allowFontScaling={false}
                                        >
                                            Volver al inicio de sesión
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ============ MODAL ============ */}
            <Modal visible={modalVisible} transparent animationType="none" onRequestClose={() => setModalVisible(false)}>
                <Animated.View style={[estilos.modalOverlay, { opacity: modalFadeAnim }]}>
                    <TouchableOpacity style={estilos.modalBackdrop} activeOpacity={1} onPress={() => { }}>
                        <Animated.View
                            style={[
                                estilos.modalContainer,
                                {
                                    transform: [{ scale: modalScaleAnim }],
                                    borderColor: modalColors.iconColor + '40',
                                    maxWidth: tamanos.modalMaxWidth,
                                },
                            ]}
                        >
                            <LinearGradient colors={modalColors.gradient} style={[estilos.modalHeader, { paddingVertical: tamanos.modalPadding }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <View
                                    style={[
                                        estilos.modalIconContainer,
                                        {
                                            backgroundColor: modalColors.iconBg,
                                            width: tamanos.modalIconContainerSize,
                                            height: tamanos.modalIconContainerSize,
                                            borderRadius: tamanos.modalIconContainerSize / 2,
                                        },
                                    ]}
                                >
                                    <Text style={{ fontSize: tamanos.modalIconSize }} allowFontScaling={false}>
                                        {modalData.icon}
                                    </Text>
                                </View>
                            </LinearGradient>

                            <View style={[estilos.modalBody, { padding: tamanos.modalPadding }]}>
                                <Text
                                    style={[estilos.modalTitle, { fontSize: tamanos.modalTitleSize, color: modalColors.titleColor }]}
                                    allowFontScaling={false}
                                >
                                    {modalData.title}
                                </Text>
                                <View style={estilos.modalMessageContainer}>
                                    <Text
                                        style={[estilos.modalMessage, { fontSize: tamanos.modalMessageSize }]}
                                        allowFontScaling={false}
                                    >
                                        {modalData.message}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={estilos.modalButton}
                                    onPress={() => {
                                        setModalVisible(false);
                                        if (modalData.type === 'success') {
                                            setTimeout(() => props.navigation.navigate('Login'), 300);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={modalColors.gradient}
                                        style={[estilos.modalButtonGradient, { paddingVertical: tamanos.modalButtonPaddingV }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text
                                            style={[estilos.modalButtonText, { fontSize: tamanos.modalButtonTextSize }]}
                                            allowFontScaling={false}
                                        >
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
    contenedor: { flex: 1 },
    keyboardView: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    botonVolver: { position: 'absolute', top: 0, left: 0, padding: 4, zIndex: 10 },
    headerContent: { alignItems: 'center', marginTop: 10, paddingHorizontal: 8 },
    icono: { marginBottom: 8 },
    titulo: { fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
    subtitulo: { marginTop: 6, textAlign: 'center', opacity: 0.7, fontStyle: 'italic' },
    intentosTexto: { marginTop: 4, opacity: 0.7 },
    formulario: { width: '100%', alignSelf: 'center' },
    label: { fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.textoClaro,
        borderWidth: 1,
        borderColor: Colores.frinkGris + '30',
    },
    inputIcon: { marginRight: 12, flexShrink: 0 },
    input: { paddingVertical: 0, flex: 1, includeFontPadding: false, textAlignVertical: 'center' },
    bloqueadoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colores.frinkAzul + '15',
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: Colores.frinkAzul + '20',
    },
    bloqueadoTexto: { fontWeight: '600' },
    boton: {
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
        paddingHorizontal: 24,
    },
    textoBoton: { fontWeight: '800', letterSpacing: 1, includeFontPadding: false },
    enlaceLogin: { marginTop: 16, alignItems: 'center', minHeight: 40, justifyContent: 'center' },
    enlaceLoginTexto: { fontWeight: '500', includeFontPadding: false },
    exitoContainer: { alignItems: 'center' },
    exitoTitulo: { fontWeight: 'bold', textAlign: 'center', includeFontPadding: false },
    exitoTexto: { textAlign: 'center', marginTop: 8, includeFontPadding: false },
    exitoCorreo: { fontWeight: 'bold', textAlign: 'center', marginTop: 4, includeFontPadding: false },
    exitoInstrucciones: { textAlign: 'center', marginTop: 12, opacity: 0.7, lineHeight: 20, includeFontPadding: false },
    exitoSpam: { textAlign: 'center', marginTop: 8, opacity: 0.6, includeFontPadding: false },
    exitoImportante: { textAlign: 'center', marginTop: 12, fontWeight: 'bold', includeFontPadding: false },

    // Modal
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
        overflow: 'hidden',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 30,
    },
    modalHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalBody: { alignItems: 'center' },
    modalTitle: { fontWeight: 'bold', textAlign: 'center', marginBottom: 12, includeFontPadding: false },
    modalMessageContainer: {
        backgroundColor: Colores.textoOscuro + '20',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: Colores.textoClaro + '8',
        marginBottom: 20,
    },
    modalMessage: { color: Colores.textoClaro, textAlign: 'center', lineHeight: 22, includeFontPadding: false },
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
    modalButtonGradient: { alignItems: 'center', justifyContent: 'center' },
    modalButtonText: { color: Colores.textoClaro, fontWeight: '700', letterSpacing: 1, includeFontPadding: false },
});