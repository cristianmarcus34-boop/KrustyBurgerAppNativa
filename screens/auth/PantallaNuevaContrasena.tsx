// screens/auth/PantallaNuevaContrasena.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../../lib/colores';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import * as Linking from 'expo-linking';

const { width, height } = Dimensions.get('window');

export default function PantallaNuevaContrasena(props: any) {
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarContrasena1, setMostrarContrasena1] = useState(false);
    const [mostrarContrasena2, setMostrarContrasena2] = useState(false);
    const [tokenRecibido, setTokenRecibido] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('Esperando acción...');
    const { actualizarContrasena } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // ✅ RECIBIR EL TOKEN DE props.route.params
    useEffect(() => {
        console.log('🔍 Pantalla NuevaContrasena montada');
        console.log('📦 props.route.params:', props.route?.params);
        console.log('📦 props.route.params?.token:', props.route?.params?.token);

        const tokenFromParams = props.route?.params?.token;
        if (tokenFromParams) {
            console.log('🔑 Token recibido desde params:', tokenFromParams.substring(0, 30) + '...');
            setTokenRecibido(tokenFromParams);
            setError(null);
            setDebugInfo('✅ Token recibido desde params');
            autenticarConToken(tokenFromParams);
            return;
        }

        const verificarUrl = async () => {
            try {
                const url = await Linking.getInitialURL();
                console.log('🔗 URL inicial (fallback):', url);
                if (url) {
                    const tokenMatch = url.match(/token=([^&]+)/);
                    if (tokenMatch) {
                        const token = decodeURIComponent(tokenMatch[1]);
                        console.log('🔑 Token extraído de URL (fallback):', token.substring(0, 30) + '...');
                        setTokenRecibido(token);
                        setError(null);
                        setDebugInfo('✅ Token extraído de URL');
                        autenticarConToken(token);
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

        if (!tokenFromParams) {
            verificarUrl();
        }

        const subscription = Linking.addEventListener('url', (event) => {
            console.log('🔗 Evento de deep link recibido:', event.url);
            const url = event.url;
            const tokenMatch = url.match(/token=([^&]+)/);
            if (tokenMatch) {
                const token = decodeURIComponent(tokenMatch[1]);
                console.log('🔑 Token extraído de evento:', token.substring(0, 30) + '...');
                setTokenRecibido(token);
                setError(null);
                setDebugInfo('✅ Token recibido por evento');
                autenticarConToken(token);
            } else {
                setDebugInfo('⚠️ Evento sin token');
            }
        });

        return () => subscription.remove();
    }, []);

    const autenticarConToken = async (token: string) => {
        try {
            console.log('🔄 Autenticando con Supabase...');
            setDebugInfo('🔄 Autenticando...');
            const { data, error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: '',
            });

            if (error) {
                console.error('❌ Error autenticando:', error);
                setError('Token inválido o expirado');
                setDebugInfo('❌ Error: ' + error.message);
                Alert.alert('Error', 'El token de recuperación no es válido o ha expirado.');
            } else {
                console.log('✅ Autenticación exitosa');
                setDebugInfo('✅ Autenticado correctamente');
                Alert.alert('✅ Éxito', 'Token válido. Ingresa tu nueva contraseña.');
            }
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            setError('Error al autenticar');
            setDebugInfo('❌ Error en autenticación');
            Alert.alert('Error', 'Ocurrió un error al autenticar el token.');
        }
    };

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

    // ✅ FUNCIÓN DE ACTUALIZAR CON DEBUG EXTREMO
    const manejarActualizar = async () => {
        console.log('========================================');
        console.log('📝 BOTÓN PRESIONADO - Actualizar contraseña');
        console.log('📝 Token recibido:', tokenRecibido?.substring(0, 30) + '...');
        console.log('📝 Token es null?', tokenRecibido === null);
        console.log('📝 Nueva contraseña:', nuevaContrasena ? '***' : 'VACÍA');
        console.log('📝 Confirmar contraseña:', confirmarContrasena ? '***' : 'VACÍA');
        console.log('========================================');

        setDebugInfo('🔄 Procesando...');

        // ✅ VALIDACIONES
        if (!nuevaContrasena || !confirmarContrasena) {
            console.log('❌ Error: Campos vacíos');
            setDebugInfo('❌ Campos vacíos');
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }

        if (nuevaContrasena.length < 6) {
            console.log('❌ Error: Contraseña muy corta');
            setDebugInfo('❌ Contraseña corta');
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            console.log('❌ Error: Contraseñas no coinciden');
            setDebugInfo('❌ No coinciden');
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (!tokenRecibido) {
            console.log('❌ Error: No hay token');
            setDebugInfo('❌ Sin token');
            Alert.alert('Error', 'No hay token de autenticación. Solicita un nuevo enlace de recuperación.');
            return;
        }

        console.log('✅ Validaciones pasadas');
        setDebugInfo('✅ Validaciones OK');

        // ✅ Verificar sesión
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('📝 Sesión activa:', session ? 'Sí' : 'No');

            if (sessionError) {
                console.log('❌ Error obteniendo sesión:', sessionError);
                setDebugInfo('❌ Error de sesión');
                Alert.alert('Error', 'Error al verificar la sesión: ' + sessionError.message);
                return;
            }

            if (!session) {
                console.log('⚠️ No hay sesión, intentando autenticar...');
                setDebugInfo('🔄 Autenticando...');
                await autenticarConToken(tokenRecibido);
                const { data: { session: newSession } } = await supabase.auth.getSession();
                if (!newSession) {
                    console.log('❌ No se pudo establecer sesión');
                    setDebugInfo('❌ Sesión fallida');
                    Alert.alert('Error', 'No se pudo establecer sesión. El token puede haber expirado.');
                    return;
                }
            }

            console.log('✅ Sesión verificada. Actualizando...');
            setDebugInfo('🔄 Actualizando...');
            setCargando(true);

            const resultado = await actualizarContrasena(nuevaContrasena);
            console.log('📝 Resultado:', resultado);

            setCargando(false);

            if (resultado.success) {
                console.log('✅ Contraseña actualizada correctamente');
                setDebugInfo('✅ ¡Éxito!');
                Alert.alert(
                    '✅ ¡Éxito!',
                    'Tu contraseña ha sido actualizada correctamente',
                    [
                        {
                            text: 'Iniciar sesión',
                            onPress: () => props.navigation.navigate('Login'),
                        },
                    ]
                );
            } else {
                console.error('❌ Error:', resultado.error);
                setDebugInfo('❌ Error: ' + (resultado.error || 'Desconocido'));
                Alert.alert('Error', resultado.error || 'No se pudo actualizar la contraseña');
            }
        } catch (error) {
            console.error('❌ Error catastrófico:', error);
            setCargando(false);
            setDebugInfo('❌ Error catastrófico');
            Alert.alert('Error', 'Ocurrió un error inesperado');
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
                            <Text style={[estilos.icono, { fontSize: isTablet ? 64 : 48 }]}>🔑</Text>
                            <Text style={[estilos.titulo, { fontSize: tituloSize, color: Colores.frinkAzul }]}>
                                Nueva Contraseña
                            </Text>
                            <Text style={[estilos.subtitulo, { fontSize: subtituloSize, color: tokenRecibido ? Colores.verdeClaro : Colores.frinkGris }]}>
                                {tokenRecibido ? '✅ Token válido. Ingresa tu nueva contraseña.' : '"Glaaaven! Actualizá tu clave!" 🧪'}
                            </Text>
                            {tokenRecibido && (
                                <Text style={[estilos.tokenInfo, { fontSize: isTablet ? 12 : 10, color: Colores.verdeClaro }]}>
                                    🔑 Token recibido correctamente
                                </Text>
                            )}
                            {error && (
                                <Text style={[estilos.tokenInfo, { fontSize: isTablet ? 12 : 10, color: Colores.secundario }]}>
                                    ⚠️ {error}
                                </Text>
                            )}
                            {/* ✅ DEBUG INFO */}
                            <Text style={[estilos.debugInfo, { fontSize: isTablet ? 10 : 8, color: Colores.frinkGris }]}>
                                🐛 {debugInfo}
                            </Text>
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
                        <Text style={[estilos.label, { fontSize: labelSize, color: Colores.frinkAzul }]}>
                            Nueva contraseña
                        </Text>
                        <View style={estilos.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color={Colores.frinkGris} style={estilos.inputIcon} />
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize, flex: 1, color: Colores.frinkAzul }]}
                                value={nuevaContrasena}
                                onChangeText={setNuevaContrasena}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={Colores.frinkGris + '60'}
                                secureTextEntry={!mostrarContrasena1}
                                selectionColor={Colores.frinkAzul}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena1(!mostrarContrasena1)}
                                style={estilos.eyeButton}
                            >
                                <Ionicons
                                    name={mostrarContrasena1 ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={Colores.frinkGris}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16, color: Colores.frinkAzul }]}>
                            Confirmar contraseña
                        </Text>
                        <View style={estilos.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color={Colores.frinkGris} style={estilos.inputIcon} />
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize, flex: 1, color: Colores.frinkAzul }]}
                                value={confirmarContrasena}
                                onChangeText={setConfirmarContrasena}
                                placeholder="Repite tu nueva contraseña"
                                placeholderTextColor={Colores.frinkGris + '60'}
                                secureTextEntry={!mostrarContrasena2}
                                selectionColor={Colores.frinkAzul}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena2(!mostrarContrasena2)}
                                style={estilos.eyeButton}
                            >
                                <Ionicons
                                    name={mostrarContrasena2 ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={Colores.frinkGris}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* ✅ BOTÓN DE ACTUALIZAR CON DEBUG VISIBLE */}
                        <TouchableOpacity
                            style={[
                                estilos.boton,
                                (!tokenRecibido) && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                console.log('👆👆👆 BOTÓN DE ACTUALIZAR PRESIONADO 👆👆👆');
                                manejarActualizar();
                            }}
                            disabled={cargando || !tokenRecibido}
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
                                        <Ionicons name="save" size={buttonTextSize + 4} color={Colores.frinkBlanco} />
                                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize, color: Colores.frinkBlanco }]}>
                                            {tokenRecibido ? 'Actualizar contraseña' : '⏳ Esperando token...'}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* ✅ BOTÓN DE PRUEBA - SIEMPRE FUNCIONAL */}
                        <TouchableOpacity
                            style={{
                                marginTop: 16,
                                padding: 16,
                                backgroundColor: '#FF6B6B',
                                borderRadius: 12,
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#FFFFFF',
                            }}
                            onPress={() => {
                                console.log('🧪🧪🧪 BOTÓN DE PRUEBA PRESIONADO 🧪🧪🧪');
                                setDebugInfo('🧪 Botón de prueba presionado');
                                Alert.alert(
                                    '¡Prueba!',
                                    'El botón de prueba funciona correctamente.\n\n' +
                                    'Token: ' + (tokenRecibido ? '✅ Recibido' : '❌ No recibido') + '\n' +
                                    'Debug: ' + debugInfo
                                );
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                                🧪 BOTÓN DE PRUEBA
                            </Text>
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
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitulo: {
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.7,
        fontStyle: 'italic',
    },
    tokenInfo: {
        marginTop: 4,
        opacity: 0.8,
    },
    debugInfo: {
        marginTop: 8,
        opacity: 0.6,
        textAlign: 'center',
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
    },
    inputIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    input: {
        paddingVertical: 12,
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
});