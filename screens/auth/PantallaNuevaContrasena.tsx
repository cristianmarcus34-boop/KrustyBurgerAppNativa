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

export default function PantallaNuevaContrasena(props: any) {
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarContrasena1, setMostrarContrasena1] = useState(false);
    const [mostrarContrasena2, setMostrarContrasena2] = useState(false);
    const { actualizarContrasena } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

    // ✅ Animaciones
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

    const manejarActualizar = async () => {
        if (!nuevaContrasena || !confirmarContrasena) {
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }

        if (nuevaContrasena.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        setCargando(true);
        const resultado = await actualizarContrasena(nuevaContrasena);
        setCargando(false);

        if (resultado.success) {
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
            Alert.alert('Error', resultado.error || 'No se pudo actualizar la contraseña');
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
                            <Text style={[estilos.icono, { fontSize: isTablet ? 64 : 48 }]}>🔑</Text>
                            <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                                Nueva Contraseña
                            </Text>
                            <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
                                Ingresa tu nueva contraseña
                            </Text>
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
                        {/* Nueva Contraseña */}
                        <Text style={[estilos.label, { fontSize: labelSize }]}>
                            Nueva contraseña
                        </Text>
                        <View style={estilos.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                                value={nuevaContrasena}
                                onChangeText={setNuevaContrasena}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                secureTextEntry={!mostrarContrasena1}
                                selectionColor={COLORS.amarillo}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena1(!mostrarContrasena1)}
                                style={estilos.eyeButton}
                            >
                                <Ionicons
                                    name={mostrarContrasena1 ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={COLORS.grisClaro}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirmar Contraseña */}
                        <Text style={[estilos.label, { fontSize: labelSize, marginTop: 16 }]}>
                            Confirmar contraseña
                        </Text>
                        <View style={estilos.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize, flex: 1 }]}
                                value={confirmarContrasena}
                                onChangeText={setConfirmarContrasena}
                                placeholder="Repite tu nueva contraseña"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                secureTextEntry={!mostrarContrasena2}
                                selectionColor={COLORS.amarillo}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarContrasena2(!mostrarContrasena2)}
                                style={estilos.eyeButton}
                            >
                                <Ionicons
                                    name={mostrarContrasena2 ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={COLORS.grisClaro}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* ✅ BOTÓN ACTUALIZAR */}
                        <TouchableOpacity
                            style={estilos.boton}
                            onPress={manejarActualizar}
                            disabled={cargando}
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
                                        <Ionicons name="save" size={buttonTextSize + 4} color={COLORS.negro} />
                                        <Text style={[estilos.textoBoton, { fontSize: buttonTextSize }]}>
                                            Actualizar contraseña
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
    },
    inputIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    input: {
        color: COLORS.blanco,
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
});