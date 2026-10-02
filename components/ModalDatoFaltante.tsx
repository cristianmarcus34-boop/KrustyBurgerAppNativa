// components/ModalDatoFaltante.tsx
// Modal reutilizable para pedir datos faltantes del perfil:
// - teléfono
// - dirección
// - cumpleaños
// - bienvenida

import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DISENO } from '../lib/colores';
import { FUENTES } from '../lib/fuentes';
import { TipoDatoFaltante } from '../utils/perfilOnboardingHelper';

// ============================================================
// 📋 TIPOS
// ============================================================

interface Props {
    visible: boolean;
    tipo: TipoDatoFaltante;
    nombreUsuario?: string;
    /** Texto pre-cargado (por ej. teléfono que ya tenía) */
    valorInicial?: string;
    /** Si es true, no se muestra el botón "Ahora no" */
    obligatorio?: boolean;
    /** Callback con el valor ingresado */
    onGuardar: (valor: string) => Promise<void> | void;
    /** Callback si el usuario toca "Ahora no" o "Saltar" */
    onSaltar?: () => void;
}

// ============================================================
// 🧠 CONFIG POR TIPO DE DATO
// ============================================================

const CONFIG: Record<TipoDatoFaltante, {
    icono: keyof typeof Ionicons.glyphMap;
    emoji: string;
    titulo: string | ((nombre: string) => string);
    subtitulo: string;
    placeholder: string;
    keyboardType: 'default' | 'phone-pad' | 'number-pad' | 'numeric' | 'numbers-and-punctuation';
    textoGuardar: string;
    textoSaltar?: string;
    /** Formato especial (ej: cumpleaños DD/MM) */
    formatoEspecial?: 'cumpleanos';
}> = {
    bienvenida: {
        icono: 'sparkles',
        emoji: '🎉',
        titulo: (nombre) => `¡Hola, ${nombre}!`,
        subtitulo: 'Vamos a completar 2 cosas rápidas para que puedas pedir sin problemas.',
        placeholder: '',
        keyboardType: 'default',
        textoGuardar: 'Empezar',
        textoSaltar: 'Más tarde',
    },
    telefono: {
        icono: 'logo-whatsapp',
        emoji: '📱',
        titulo: 'Tu WhatsApp',
        subtitulo: 'Lo usamos para avisarte cuando tu pedido salga del local. Sin spam.',
        placeholder: '11 1234 5678',
        keyboardType: 'phone-pad',
        textoGuardar: 'Guardar',
        textoSaltar: 'Ahora no',
    },
    direccion: {
        icono: 'location',
        emoji: '📍',
        titulo: '¿Dónde te lo llevamos?',
        subtitulo: 'Podés usar tu ubicación actual o escribirla. La guardamos para la próxima.',
        placeholder: 'Calle y número',
        keyboardType: 'default',
        textoGuardar: 'Guardar',
        textoSaltar: 'Más tarde',
    },
    cumpleanos: {
        icono: 'gift',
        emoji: '🎂',
        titulo: '¿Cuándo es tu cumple?',
        subtitulo: 'Ese día te mandamos una burger gratis. Palabra de Krusty.',
        placeholder: 'DD/MM (ej: 14/05)',
        keyboardType: 'numbers-and-punctuation',  // ✅ permite "/"
        textoGuardar: 'Guardar',
        textoSaltar: 'Saltar',
        formatoEspecial: 'cumpleanos',
    },
};

// ============================================================
// 🛠️ HELPERS DE FORMATO
// ============================================================

/**
 * Auto-formatea el input de cumpleaños:
 * - Solo permite dígitos y "/"
 * - Si el usuario escribe "1405" → lo convierte a "14/05"
 */
const formatearInputCumpleanos = (texto: string): string => {
    const soloNumerosYBarra = texto.replace(/[^0-9/]/g, '');

    // Auto-formatear: si escribió 4 dígitos sin "/", agregamos la barra
    if (soloNumerosYBarra.length === 4 && !soloNumerosYBarra.includes('/')) {
        return `${soloNumerosYBarra.slice(0, 2)}/${soloNumerosYBarra.slice(2, 4)}`;
    }

    return soloNumerosYBarra;
};

/**
 * Valida el formato del cumpleaños DD/MM
 */
const esCumpleanosValido = (valor: string): boolean => {
    const limpio = valor.trim();
    const match = limpio.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!match) return false;

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);

    return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12;
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================

export default function ModalDatoFaltante({
    visible,
    tipo,
    nombreUsuario = '',
    valorInicial = '',
    obligatorio = false,
    onGuardar,
    onSaltar,
}: Props) {
    const [valor, setValor] = useState(valorInicial);
    const [guardando, setGuardando] = useState(false);

    const config = CONFIG[tipo];
    const esBienvenida = tipo === 'bienvenida';
    const esCumpleanos = config.formatoEspecial === 'cumpleanos';

    // Resetear el valor cada vez que se abre el modal
    useEffect(() => {
        if (visible) {
            setValor(valorInicial);
            setGuardando(false);
        }
    }, [visible, valorInicial]);

    // Handler del cambio de texto (con formato especial si aplica)
    const handleChangeText = (texto: string) => {
        if (esCumpleanos) {
            setValor(formatearInputCumpleanos(texto));
        } else {
            setValor(texto);
        }
    };

    const handleGuardar = async () => {
        if (guardando) return;

        // Validaciones
        if (!esBienvenida) {
            const limpio = valor.trim();
            if (tipo === 'telefono' && limpio.length < 6) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
                return;
            }
            if (tipo === 'direccion' && limpio.length < 5) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
                return;
            }
            if (tipo === 'cumpleanos' && !esCumpleanosValido(limpio)) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
                return;
            }
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        setGuardando(true);

        try {
            await onGuardar(valor.trim());
        } catch (error) {
            console.error('❌ [ModalDatoFaltante] Error guardando:', error);
        } finally {
            setGuardando(false);
        }
    };

    const handleSaltar = () => {
        Haptics.selectionAsync().catch(() => { });
        onSaltar?.();
    };

    const puedeGuardar = esBienvenida || valor.trim().length > 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={obligatorio ? undefined : handleSaltar}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.overlay}
            >
                <View style={styles.content}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ─── ÍCONO ─── */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[DISENO.colors.accent + '20', DISENO.colors.accent + '05']}
                                style={styles.iconBackground}
                            >
                                <Ionicons name={config.icono} size={40} color={DISENO.colors.accent} />
                                <View style={styles.emojiBadge}>
                                    <Text style={styles.emojiBadgeText} allowFontScaling={false}>
                                        {config.emoji}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* ─── TÍTULO ─── */}
                        <Text style={styles.titulo} allowFontScaling={false}>
                            {typeof config.titulo === 'function'
                                ? config.titulo(nombreUsuario || 'che')
                                : config.titulo}
                        </Text>

                        {/* ─── SUBTÍTULO ─── */}
                        <Text style={styles.subtitulo} allowFontScaling={false}>
                            {config.subtitulo}
                        </Text>

                        {/* ─── INPUT (solo si NO es bienvenida) ─── */}
                        {!esBienvenida && (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={valor}
                                    onChangeText={handleChangeText}
                                    placeholder={config.placeholder}
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    keyboardType={config.keyboardType}
                                    selectionColor={DISENO.colors.accent}
                                    maxLength={esCumpleanos ? 5 : undefined}
                                    autoFocus
                                    allowFontScaling={false}
                                />
                            </View>
                        )}

                        {/* ─── BOTÓN PRINCIPAL ─── */}
                        <TouchableOpacity
                            style={[
                                styles.botonPrincipal,
                                !puedeGuardar && styles.botonDeshabilitado,
                            ]}
                            onPress={handleGuardar}
                            disabled={guardando || !puedeGuardar}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[
                                    DISENO.colors.accent,
                                    DISENO.colors.accentSecondary || DISENO.colors.accent,
                                ]}
                                style={styles.botonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {guardando ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name={esBienvenida ? 'arrow-forward' : 'checkmark-circle'}
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.botonTexto} allowFontScaling={false}>
                                            {config.textoGuardar}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* ─── BOTÓN SALTAR (solo si no es obligatorio) ─── */}
                        {!obligatorio && config.textoSaltar && (
                            <TouchableOpacity
                                style={styles.botonSaltar}
                                onPress={handleSaltar}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.botonSaltarTexto} allowFontScaling={false}>
                                    {config.textoSaltar}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* ─── FOOTER INFO ─── */}
                        {!esBienvenida && (
                            <Text style={styles.footerInfo} allowFontScaling={false}>
                                🔒 Tus datos se guardan encriptados y no los compartimos.
                            </Text>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '85%',
        ...DISENO.shadow.lg,
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '15',
        overflow: 'hidden',
    },
    scroll: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '30',
    },
    emojiBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: DISENO.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: DISENO.colors.accent + '30',
    },
    emojiBadgeText: {
        fontSize: 15,
        includeFontPadding: false,
    },
    titulo: {
        fontFamily: FUENTES.display,
        fontSize: 21,
        color: DISENO.colors.text,
        textAlign: 'center',
        marginBottom: 8,
        includeFontPadding: false,
    },
    subtitulo: {
        fontFamily: FUENTES.regular,
        fontSize: 13.5,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 20,
        includeFontPadding: false,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        fontFamily: FUENTES.regular,
        fontSize: 16,
        color: DISENO.colors.text,
        backgroundColor: DISENO.colors.surfaceHover,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        textAlign: 'center',
        includeFontPadding: false,
    },
    botonPrincipal: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 8,
        ...DISENO.shadow.sm,
    },
    botonDeshabilitado: {
        opacity: 0.5,
    },
    botonGradient: {
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    botonTexto: {
        fontFamily: FUENTES.display,
        fontSize: 15,
        color: '#FFFFFF',
        includeFontPadding: false,
    },
    botonSaltar: {
        paddingVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    botonSaltarTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },
    footerInfo: {
        fontFamily: FUENTES.regular,
        fontSize: 10.5,
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 15,
        includeFontPadding: false,
    },
});