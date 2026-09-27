// screens/auth/PantallaNuevaContrasena.tsx - V2 RESPONSIVE 100%
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { Colores, useResponsive } from '../../lib/colores';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { RootStackParamList } from '../../lib/tipos';

// ✅ TIPADO DE NAVEGACIÓN
type Navigation = {
    navigate: <T extends keyof RootStackParamList>(
        screen: T,
        params?: RootStackParamList[T]
    ) => void;
    goBack: () => void;
    reset: (options: { index: number; routes: { name: keyof RootStackParamList }[] }) => void;
};

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosNueva {
    paddingHorizontal: number;
    maxFormWidth: number;
    tituloSize: number;
    subtituloSize: number;
    labelSize: number;
    inputSize: number;
    buttonTextSize: number;
    iconoSize: number;
    inputHeight: number;
    inputPaddingH: number;
    inputRadius: number;
    buttonPaddingV: number;
    buttonRadius: number;
    iconSize: number;
    eyeIconSize: number;
    eyeButtonSize: number;
    sectionGap: number;
    backIconSize: number;
    debugSize: number;
}

const calcularTamanosNueva = (
    width: number,
    isTablet: boolean,
    isDesktop: boolean,
    isSmallPhone: boolean,
): TamanosNueva => {
    const paddingHorizontal = isDesktop ? 60 : isTablet ? 40 : isSmallPhone ? 16 : 22;
    const maxFormWidth = isDesktop ? 480 : isTablet ? 460 : width;
    const tituloSize = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 22 : 26;
    const subtituloSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const labelSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12.5 : 13.5;
    const inputSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13.5 : 14.5;
    const buttonTextSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
    const iconoSize = isDesktop ? 72 : isTablet ? 64 : isSmallPhone ? 44 : 54;
    const inputHeight = isDesktop ? 60 : isTablet ? 58 : isSmallPhone ? 50 : 54;
    const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const inputRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
    const buttonPaddingV = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
    const buttonRadius = isSmallPhone ? 12 : 14;
    const iconSize = isDesktop ? 22 : isTablet ? 22 : isSmallPhone ? 20 : 21;
    const eyeIconSize = iconSize;
    const eyeButtonSize = isSmallPhone ? 40 : 44;
    const sectionGap = isSmallPhone ? 12 : 16;
    const backIconSize = isDesktop ? 28 : isTablet ? 28 : isSmallPhone ? 22 : 24;
    const debugSize = isSmallPhone ? 9 : 10;

    return {
        paddingHorizontal, maxFormWidth, tituloSize, subtituloSize, labelSize,
        inputSize, buttonTextSize, iconoSize, inputHeight, inputPaddingH,
        inputRadius, buttonPaddingV, buttonRadius, iconSize, eyeIconSize,
        eyeButtonSize, sectionGap, backIconSize, debugSize,
    };
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaNuevaContrasena() {
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarContrasena1, setMostrarContrasena1] = useState(false);
    const [mostrarContrasena2, setMostrarContrasena2] = useState(false);
    const [tokenRecibido, setTokenRecibido] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('Esperando acción...');
    const [autenticado, setAutenticado] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const [emailUsuario, setEmailUsuario] = useState<string | null>(null);

    const { actualizarContrasena, resetearContrasena } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Navigation>();
    const route = useRoute();

    const responsive = useResponsive();
    const { width: screenWidth } = useWindowDimensions();

    const tamanos = useMemo(
        () =>
            calcularTamanosNueva(
                screenWidth,
                responsive.isTablet,
                responsive.isDesktop,
                responsive.isSmallPhone,
            ),
        [screenWidth, responsive.isTablet, responsive.isDesktop, responsive.isSmallPhone],
    );

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // ============================================================
    // ✅ RECIBIR TOKEN
    // ============================================================
    useEffect(() => {
        console.log('🔍 Pantalla NuevaContrasena montada');
        console.log('📦 route.params:', route.params);

        const params = (route.params as { token?: string }) || {};
        const tokenFromParams = params.token;

        if (tokenFromParams) {
            console.log('🔑 Token recibido desde params:', tokenFromParams.substring(0, 30) + '...');
            setTokenRecibido(tokenFromParams);
            setError(null);
            setDebugInfo('✅ Token recibido desde params');

            try {
                const parts = tokenFromParams.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.email) {
                        setEmailUsuario(payload.email);
                        console.log('📧 Email extraído del token:', payload.email);
                    }
                }
            } catch (e) {
                console.log('⚠️ No se pudo extraer email del token');
            }

            setDebugInfo('✅ Token recibido. Presiona "Actualizar contraseña" para continuar.');
            return;
        }

        const verificarUrl = async () => {
            try {
                const url = await Linking.getInitialURL();
                console.log('🔗 URL inicial (fallback):', url);
                if (url) {
                    let token: string | null = null;
                    const hashMatch = url.match(/#access_token=([^&]+)/);
                    if (hashMatch) token = hashMatch[1];
                    if (!token) {
                        const tokenMatch = url.match(/access_token=([^&]+)/);
                        if (tokenMatch) token = tokenMatch[1];
                    }
                    if (token) {
                        setTokenRecibido(token);
                        setError(null);
                        setDebugInfo('✅ Token recibido. Presiona "Actualizar contraseña" para continuar.');
                    } else {
                        setDebugInfo('⚠️ URL sin token');
                    }
                } else {
                    setDebugInfo('ℹ️ Sin URL inicial');
                }
            } catch (error) {
                console.error('❌ Error verificando URL:', error);
                setDebugInfo('❌ Error en URL');
            }
        };

        if (!tokenFromParams) verificarUrl();

        const subscription = Linking.addEventListener('url', (event) => {
            console.log('🔗 Evento de deep link recibido:', event.url);
            const url = event.url;
            let token: string | null = null;
            const hashMatch = url.match(/#access_token=([^&]+)/);
            if (hashMatch) token = hashMatch[1];
            if (!token) {
                const tokenMatch = url.match(/access_token=([^&]+)/);
                if (tokenMatch) token = tokenMatch[1];
            }
            if (token) {
                setTokenRecibido(token);
                setError(null);
                setDebugInfo('✅ Token recibido. Presiona "Actualizar contraseña" para continuar.');
            } else {
                setDebugInfo('⚠️ Evento sin token');
            }
        });

        return () => subscription.remove();
    }, []);

    // ============================================================
    // ✅ AUTENTICAR CON TOKEN
    // ============================================================
    const autenticarConToken = async (token: string): Promise<boolean> => {
        try {
            setDebugInfo('🔄 Autenticando...');
            const { error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: '',
            });

            if (error) {
                try {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: 'recovery',
                    });
                    if (verifyError) {
                        if (
                            verifyError.message.toLowerCase().includes('expired') ||
                            verifyError.message.toLowerCase().includes('invalid')
                        ) {
                            setError('⏰ El enlace de recuperación ha expirado.');
                            setDebugInfo('❌ Token expirado');
                            return false;
                        }
                        setError('Token inválido o expirado. Solicita un nuevo enlace de recuperación.');
                        setDebugInfo('❌ Token inválido');
                        return false;
                    }
                    setAutenticado(true);
                    setDebugInfo('✅ Autenticado correctamente');
                    return true;
                } catch {
                    setError('Error al verificar el token. Solicita un nuevo enlace.');
                    setDebugInfo('❌ Error en verificación');
                    return false;
                }
            }

            setAutenticado(true);
            setDebugInfo('✅ Autenticado correctamente');
            return true;
        } catch {
            setError('Error al autenticar');
            setDebugInfo('❌ Error en autenticación');
            return false;
        }
    };

    // ============================================================
    // ✅ REENVIAR ENLACE
    // ============================================================
    const reenviarEnlace = async () => {
        if (!emailUsuario) {
            Alert.alert(
                'Correo no disponible',
                'No pudimos identificar tu correo. Por favor, solicita un nuevo enlace desde la pantalla de recuperación.',
                [
                    { text: 'Ir a recuperación', onPress: () => navigation.navigate('ResetPassword') },
                    { text: 'Cancelar', style: 'cancel' },
                ]
            );
            return;
        }

        setReenviando(true);
        try {
            const resultado = await resetearContrasena(emailUsuario);
            if (resultado.success) {
                Alert.alert(
                    '✅ Enlace reenviado',
                    `Hemos enviado un nuevo enlace de recuperación a:\n\n📬 ${emailUsuario}\n\n⏰ El enlace expira en 1 hora.\n\n📌 IMPORTANTE:\n• Abre el enlace desde tu TELÉFONO\n• Revisa tu carpeta de SPAM`,
                    [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Error al reenviar', resultado.error || 'No se pudo reenviar el enlace.', [
                    { text: 'Entendido' },
                ]);
            }
        } catch {
            Alert.alert('Error', 'No se pudo reenviar el enlace.');
        } finally {
            setReenviando(false);
        }
    };

    // ============================================================
    // ✅ ANIMACIÓN INICIAL
    // ============================================================
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    // ============================================================
    // ✅ ACTUALIZAR CONTRASEÑA
    // ============================================================
    const manejarActualizar = async () => {
        setDebugInfo('🔄 Procesando...');

        if (!nuevaContrasena || !confirmarContrasena) {
            setDebugInfo('❌ Campos vacíos');
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }
        if (nuevaContrasena.length < 6) {
            setDebugInfo('❌ Contraseña corta');
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (nuevaContrasena !== confirmarContrasena) {
            setDebugInfo('❌ No coinciden');
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        if (!tokenRecibido) {
            setDebugInfo('❌ Sin token');
            Alert.alert('Error', 'No hay token de autenticación. Solicita un nuevo enlace de recuperación.');
            return;
        }

        setDebugInfo('✅ Validaciones OK');
        setCargando(true);

        try {
            if (!autenticado) {
                const authResult = await autenticarConToken(tokenRecibido);
                if (!authResult) {
                    setCargando(false);
                    Alert.alert(
                        '⏰ Enlace expirado',
                        'El enlace de recuperación ha expirado o es inválido.\n\n¿Quieres reenviar un nuevo enlace a tu correo?',
                        [
                            { text: 'Reenviar enlace', onPress: reenviarEnlace },
                            { text: 'Cancelar', style: 'cancel', onPress: () => navigation.navigate('Login') },
                        ]
                    );
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setCargando(false);
                    Alert.alert('Error', 'No se pudo establecer sesión. El token puede haber expirado.');
                    return;
                }
                setAutenticado(true);
            }

            setDebugInfo('🔄 Actualizando contraseña...');
            const resultado = await actualizarContrasena(nuevaContrasena);
            setCargando(false);

            if (resultado.success) {
                setDebugInfo('✅ ¡Éxito!');
                Alert.alert(
                    '✅ ¡Éxito!',
                    'Tu contraseña ha sido actualizada correctamente.\n\nAhora puedes iniciar sesión con tu nueva contraseña.',
                    [
                        {
                            text: 'Iniciar sesión',
                            onPress: () => {
                                supabase.auth.signOut();
                                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                            },
                        },
                    ]
                );
            } else {
                setDebugInfo('❌ Error: ' + (resultado.error || 'Desconocido'));
                Alert.alert('Error', resultado.error || 'No se pudo actualizar la contraseña');
            }
        } catch {
            setCargando(false);
            setDebugInfo('❌ Error catastrófico');
            Alert.alert('Error', 'Ocurrió un error inesperado');
        }
    };

    const tokenValido =
        tokenRecibido !== null && !error?.includes('expirado') && !error?.includes('expired');
    const camposHabilitados = tokenValido && !cargando;

    // ============================================================
    // RENDER
    // ============================================================
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
                            paddingTop: insets.top + 12,
                            paddingBottom: insets.bottom + 20,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
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
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                            hitSlop={12}
                        >
                            <Ionicons name="arrow-back" size={tamanos.backIconSize} color={Colores.frinkAzul} />
                        </TouchableOpacity>

                        <View style={estilos.headerContent}>
                            <Text style={[estilos.icono, { fontSize: tamanos.iconoSize }]} allowFontScaling={false}>
                                🔑
                            </Text>
                            <Text
                                style={[estilos.titulo, { fontSize: tamanos.tituloSize, color: Colores.frinkAzul }]}
                                allowFontScaling={false}
                                numberOfLines={2}
                            >
                                Nueva Contraseña
                            </Text>
                            <Text
                                style={[
                                    estilos.subtitulo,
                                    {
                                        fontSize: tamanos.subtituloSize,
                                        color: tokenValido ? Colores.verdeClaro : Colores.secundario,
                                    },
                                ]}
                                allowFontScaling={false}
                                numberOfLines={2}
                            >
                                {tokenValido
                                    ? '✅ Token válido. Ingresa tu nueva contraseña.'
                                    : error?.includes('expirado') || error?.includes('expired')
                                        ? '⏰ El enlace ha expirado'
                                        : tokenRecibido
                                            ? '⚠️ Token inválido. Solicita un nuevo enlace.'
                                            : '"Glaaaven! Actualizá tu clave!" 🧪'}
                            </Text>
                            {tokenValido && (
                                <Text
                                    style={[
                                        estilos.tokenInfo,
                                        { fontSize: tamanos.debugSize + 2, color: Colores.verdeClaro },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    ✅ Token válido
                                </Text>
                            )}
                            {error && (
                                <Text
                                    style={[
                                        estilos.tokenInfo,
                                        { fontSize: tamanos.debugSize + 2, color: Colores.secundario },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    ⚠️ {error}
                                </Text>
                            )}
                            {emailUsuario && (
                                <Text
                                    style={[
                                        estilos.emailInfo,
                                        { fontSize: tamanos.debugSize + 2, color: Colores.frinkGris },
                                    ]}
                                    allowFontScaling={false}
                                    numberOfLines={1}
                                >
                                    📧 {emailUsuario}
                                </Text>
                            )}
                            <Text
                                style={[estilos.debugInfo, { fontSize: tamanos.debugSize, color: Colores.frinkGris }]}
                                allowFontScaling={false}
                            >
                                🐛 {debugInfo}
                            </Text>
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
                                alignSelf: 'center',
                            },
                        ]}
                    >
                        <Text
                            style={[estilos.label, { fontSize: tamanos.labelSize, color: Colores.frinkAzul }]}
                            allowFontScaling={false}
                        >
                            Nueva contraseña
                        </Text>
                        <View
                            style={[
                                estilos.inputContainer,
                                {
                                    height: tamanos.inputHeight,
                                    paddingHorizontal: tamanos.inputPaddingH,
                                    borderRadius: tamanos.inputRadius,
                                },
                            ]}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={tamanos.iconSize}
                                color={Colores.frinkGris}
                                style={estilos.inputIcon}
                            />
                            <TextInput
                                style={[estilos.input, { fontSize: tamanos.inputSize, color: Colores.frinkAzul }]}
                                value={nuevaContrasena}
                                onChangeText={setNuevaContrasena}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={Colores.frinkGris + '60'}
                                secureTextEntry={!mostrarContrasena1}
                                selectionColor={Colores.frinkAzul}
                                editable={camposHabilitados}
                                allowFontScaling={false}
                                returnKeyType="next"
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena1(!mostrarContrasena1)}
                                style={[
                                    estilos.eyeButton,
                                    { width: tamanos.eyeButtonSize, height: tamanos.eyeButtonSize },
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={mostrarContrasena1 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                hitSlop={8}
                            >
                                <Ionicons
                                    name={mostrarContrasena1 ? 'eye-outline' : 'eye-off-outline'}
                                    size={tamanos.eyeIconSize}
                                    color={Colores.frinkGris}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text
                            style={[
                                estilos.label,
                                {
                                    fontSize: tamanos.labelSize,
                                    marginTop: tamanos.sectionGap,
                                    color: Colores.frinkAzul,
                                },
                            ]}
                            allowFontScaling={false}
                        >
                            Confirmar contraseña
                        </Text>
                        <View
                            style={[
                                estilos.inputContainer,
                                {
                                    height: tamanos.inputHeight,
                                    paddingHorizontal: tamanos.inputPaddingH,
                                    borderRadius: tamanos.inputRadius,
                                },
                            ]}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={tamanos.iconSize}
                                color={Colores.frinkGris}
                                style={estilos.inputIcon}
                            />
                            <TextInput
                                style={[estilos.input, { fontSize: tamanos.inputSize, color: Colores.frinkAzul }]}
                                value={confirmarContrasena}
                                onChangeText={setConfirmarContrasena}
                                placeholder="Repite tu nueva contraseña"
                                placeholderTextColor={Colores.frinkGris + '60'}
                                secureTextEntry={!mostrarContrasena2}
                                selectionColor={Colores.frinkAzul}
                                editable={camposHabilitados}
                                allowFontScaling={false}
                                returnKeyType="done"
                                onSubmitEditing={manejarActualizar}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena2(!mostrarContrasena2)}
                                style={[
                                    estilos.eyeButton,
                                    { width: tamanos.eyeButtonSize, height: tamanos.eyeButtonSize },
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={mostrarContrasena2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                hitSlop={8}
                            >
                                <Ionicons
                                    name={mostrarContrasena2 ? 'eye-outline' : 'eye-off-outline'}
                                    size={tamanos.eyeIconSize}
                                    color={Colores.frinkGris}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                estilos.boton,
                                {
                                    marginTop: tamanos.sectionGap + 12,
                                    borderRadius: tamanos.buttonRadius,
                                },
                                (!tokenValido || cargando) && { opacity: 0.5 },
                            ]}
                            onPress={manejarActualizar}
                            disabled={!tokenValido || cargando}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !tokenValido || cargando, busy: cargando }}
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
                                        <Ionicons
                                            name="save"
                                            size={tamanos.buttonTextSize + 4}
                                            color={Colores.frinkBlanco}
                                        />
                                        <Text
                                            style={[
                                                estilos.textoBoton,
                                                { fontSize: tamanos.buttonTextSize, color: Colores.frinkBlanco },
                                            ]}
                                            allowFontScaling={false}
                                        >
                                            {tokenValido ? 'Actualizar contraseña' : '⏳ Token inválido'}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {!tokenValido && tokenRecibido && (
                            <TouchableOpacity
                                style={[
                                    estilos.botonReenviar,
                                    { marginTop: tamanos.sectionGap, paddingVertical: 12 },
                                ]}
                                onPress={reenviarEnlace}
                                disabled={reenviando}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                            >
                                {reenviando ? (
                                    <ActivityIndicator size="small" color={Colores.frinkAzul} />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="refresh-outline"
                                            size={tamanos.iconSize - 2}
                                            color={Colores.frinkAzul}
                                        />
                                        <Text style={estilos.botonReenviarTexto} allowFontScaling={false}>
                                            Reenviar enlace de recuperación
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={estilos.enlaceLogin}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.6}
                            accessibilityRole="button"
                        >
                            <Text
                                style={[
                                    estilos.enlaceLoginTexto,
                                    { fontSize: tamanos.debugSize + 3, color: Colores.frinkGris },
                                ]}
                                allowFontScaling={false}
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={tamanos.debugSize + 4}
                                    color={Colores.frinkGris}
                                />{' '}
                                Volver al inicio de sesión
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
    contenedor: { flex: 1 },
    keyboardView: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    botonVolver: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 4,
        zIndex: 10,
    },
    headerContent: { alignItems: 'center', marginTop: 10, paddingHorizontal: 8 },
    icono: { marginBottom: 8, includeFontPadding: false },
    titulo: {
        fontWeight: 'bold',
        letterSpacing: 1,
        textAlign: 'center',
        lineHeight: 34,
        includeFontPadding: false,
    },
    subtitulo: {
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.7,
        fontStyle: 'italic',
        lineHeight: 20,
        includeFontPadding: false,
    },
    tokenInfo: { marginTop: 4, opacity: 0.8, includeFontPadding: false },
    emailInfo: { marginTop: 4, opacity: 0.6, includeFontPadding: false },
    debugInfo: { marginTop: 8, opacity: 0.6, textAlign: 'center', includeFontPadding: false },
    formulario: { width: '100%', alignSelf: 'center' },
    label: {
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.5,
        includeFontPadding: false,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.textoClaro,
        borderWidth: 1,
        borderColor: Colores.frinkGris + '30',
    },
    inputIcon: { marginRight: 12, flexShrink: 0 },
    input: {
        paddingVertical: 0,
        flex: 1,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    eyeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
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
    textoBoton: {
        fontWeight: '800',
        letterSpacing: 1,
        includeFontPadding: false,
        lineHeight: 24,
    },
    botonReenviar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        backgroundColor: Colores.frinkAzul + '10',
        borderWidth: 1,
        borderColor: Colores.frinkAzul + '20',
    },
    botonReenviarTexto: {
        fontSize: 14,
        color: Colores.frinkAzul,
        fontWeight: '600',
        includeFontPadding: false,
    },
    enlaceLogin: {
        marginTop: 16,
        alignItems: 'center',
        minHeight: 40,
        justifyContent: 'center',
    },
    enlaceLoginTexto: { fontWeight: '500', includeFontPadding: false },
});