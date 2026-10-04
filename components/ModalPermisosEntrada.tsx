// components/ModalPermisosEntrada.tsx - Versión Mejorada con copy claro
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DISENO } from '../lib/colores';
import { FUENTES } from '../lib/fuentes';

interface Props {
    visible: boolean;
    onAceptar: () => void;
    onOmitir: () => void;
}

export default function ModalPermisosEntrada({ visible, onAceptar, onOmitir }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* Icono Principal con Contenedor Decorativo */}
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={[DISENO.colors.accent + '20', DISENO.colors.accent + '05']}
                                style={styles.iconBackground}
                            >
                                <Ionicons name="notifications" size={40} color={DISENO.colors.accent} />
                                <View style={styles.miniBadge}>
                                    <Ionicons name="location" size={14} color="#FFF" />
                                </View>
                            </LinearGradient>
                        </View>

                        <Text style={styles.titulo} allowFontScaling={false}>
                            ¡Activá la experiencia Krusty! 🍔
                        </Text>

                        <Text style={styles.subtitulo} allowFontScaling={false}>
                            Al activar todo vas a recibir:
                        </Text>

                        {/* Beneficios detallados visualmente */}
                        <View style={styles.beneficiosContainer}>
                            <View style={styles.beneficioItem}>
                                <View style={styles.bulletIcon}>
                                    <Ionicons name="receipt" size={16} color={DISENO.colors.accent} />
                                </View>
                                <Text style={styles.beneficioTexto} allowFontScaling={false}>
                                    <Text style={styles.beneficioTextoNegrita}>Avisos de pedidos:</Text> confirmación, preparación y entrega
                                </Text>
                            </View>

                            <View style={styles.beneficioItem}>
                                <View style={styles.bulletIcon}>
                                    <Ionicons name="pricetags" size={16} color={DISENO.colors.accent} />
                                </View>
                                <Text style={styles.beneficioTexto} allowFontScaling={false}>
                                    <Text style={styles.beneficioTextoNegrita}>Ofertas y promos:</Text> descuentos y novedades exclusivas
                                </Text>
                            </View>

                            <View style={styles.beneficioItem}>
                                <View style={styles.bulletIcon}>
                                    <Ionicons name="navigate" size={16} color={DISENO.colors.accent} />
                                </View>
                                <Text style={styles.beneficioTexto} allowFontScaling={false}>
                                    <Text style={styles.beneficioTextoNegrita}>Seguimiento:</Text> mirá dónde está tu pedido en tiempo real
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.botonAceptar}
                            onPress={onAceptar}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[DISENO.colors.accent, DISENO.colors.accentSecondary || DISENO.colors.accent]}
                                style={styles.gradientBoton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.textoBotonAceptar} allowFontScaling={false}>
                                    ¡Dale, activar todo! 🚀
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.botonOmitir}
                            onPress={onOmitir}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.textoBotonOmitir} allowFontScaling={false}>
                                Ahora no, gracias
                            </Text>
                        </TouchableOpacity>

                        {/* ✅ NUEVO: Texto legal */}
                        <Text style={styles.legalText} allowFontScaling={false}>
                            Podés cambiar estas preferencias cuando quieras desde tu perfil
                        </Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

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
        maxWidth: 380,
        maxHeight: '85%',
        ...DISENO.shadow.lg,
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '15',
        overflow: 'hidden',
    },
    scrollContainer: {
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
    miniBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: DISENO.colors.accent,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: DISENO.colors.surface,
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
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
        includeFontPadding: false,
    },
    beneficiosContainer: {
        width: '100%',
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        gap: 12,
    },
    beneficioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bulletIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: DISENO.colors.accent + '15',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    beneficioTexto: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.text,
        flex: 1,
        lineHeight: 16,
        includeFontPadding: false,
    },
    beneficioTextoNegrita: {
        fontFamily: FUENTES.display,
        fontWeight: '600',
    },
    botonAceptar: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 12,
        ...DISENO.shadow.sm,
    },
    gradientBoton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoBotonAceptar: {
        fontFamily: FUENTES.display,
        fontSize: 15,
        color: '#FFFFFF',
        includeFontPadding: false,
    },
    botonOmitir: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    textoBotonOmitir: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        includeFontPadding: false,
    },
    legalText: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 16,
        lineHeight: 14,
        includeFontPadding: false,
    },
});