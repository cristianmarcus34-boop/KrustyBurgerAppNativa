import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ Paleta de colores Krusty
const KrustyColors = {
    rojo: '#E53935',
    rojoOscuro: '#C62828',
    amarillo: '#FDD835',
    amarilloClaro: '#FFF9C4',
    naranja: '#FB8C00',
    blanco: '#FFFFFF',
    negro: '#1A1A1A',
    gris: '#9E9E9E',
    grisClaro: '#F5F5F5',
};

export default function PantallaBienvenida({ navigation }: any) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    // ✅ Tamaños dinámicos
    const emojiSize = isTablet ? 130 : isSmallPhone ? 80 : 110;
    const tituloSize = isTablet ? 48 : isSmallPhone ? 30 : 40;
    const subtituloSize = isTablet ? 22 : isSmallPhone ? 14 : 18;
    const featureTextSize = isTablet ? 20 : isSmallPhone ? 14 : 17;
    const buttonTextSize = isTablet ? 24 : isSmallPhone ? 16 : 20;
    const buttonPadding = isTablet ? 24 : isSmallPhone ? 14 : 18;
    const featureIconSize = isTablet ? 32 : isSmallPhone ? 22 : 26;
    const logoMarginBottom = isTablet ? 50 : isSmallPhone ? 25 : 35;
    const featuresMarginBottom = isTablet ? 35 : isSmallPhone ? 20 : 25;
    const paddingHorizontal = isTablet ? 60 : isSmallPhone ? 20 : 30;
    const paddingTop = isTablet ? 60 : isSmallPhone ? 40 : 50;
    const paddingBottom = (isTablet ? 30 : isSmallPhone ? 20 : 25) + insets.bottom;

    return (
        <ScrollView
            contentContainerStyle={[
                estilos.contenedor,
                {
                    paddingHorizontal: paddingHorizontal,
                    paddingTop: paddingTop,
                    paddingBottom: paddingBottom,
                }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
        >
            {/* ✅ Logo con efecto de sombra y degradado */}
            <View style={[estilos.logo, { marginBottom: logoMarginBottom }]}>
                <View style={estilos.emojiContainer}>
                    <LinearGradient
                        colors={[KrustyColors.rojo, KrustyColors.rojoOscuro]}
                        style={estilos.emojiBackground}
                    >
                        <Text style={[estilos.emoji, { fontSize: emojiSize }]}>🍔</Text>
                    </LinearGradient>
                </View>
                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                    Krusty Burger
                </Text>
                <View style={estilos.taglineContainer}>
                    <Text style={[estilos.subtitulo, { fontSize: subtituloSize }]}>
                        Las más crujientes de la ciudad
                    </Text>
                </View>
            </View>

            {/* ✅ Features con diseño moderno */}
            <View style={[estilos.features, { marginBottom: featuresMarginBottom, gap: isTablet ? 20 : 14 }]}>
                <View style={estilos.featureItem}>
                    <View style={[estilos.featureIconWrapper, { backgroundColor: KrustyColors.rojo + '20' }]}>
                        <Ionicons name="restaurant" size={featureIconSize} color={KrustyColors.rojo} />
                    </View>
                    <Text style={[estilos.featureTexto, { fontSize: featureTextSize }]}>
                        Hamburguesas premium
                    </Text>
                </View>
                <View style={estilos.featureItem}>
                    <View style={[estilos.featureIconWrapper, { backgroundColor: KrustyColors.amarillo + '30' }]}>
                        <Ionicons name="star" size={featureIconSize} color={KrustyColors.naranja} />
                    </View>
                    <Text style={[estilos.featureTexto, { fontSize: featureTextSize }]}>
                        Ganá puntos Krusty
                    </Text>
                </View>
                <View style={estilos.featureItem}>
                    <View style={[estilos.featureIconWrapper, { backgroundColor: '#2196F3' + '20' }]}>
                        <Ionicons name="bicycle" size={featureIconSize} color="#2196F3" />
                    </View>
                    <Text style={[estilos.featureTexto, { fontSize: featureTextSize }]}>
                        Delivery en tiempo real
                    </Text>
                </View>
            </View>

            {/* ✅ Botones con diseño Krusty */}
            <View style={[estilos.botones, { gap: isTablet ? 20 : 14, marginBottom: isTablet ? 40 : 30 }]}>
                <TouchableOpacity
                    style={[
                        estilos.botonIngresar,
                        {
                            padding: buttonPadding,
                            borderRadius: isTablet ? 20 : 16,
                        }
                    ]}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[KrustyColors.rojo, KrustyColors.rojoOscuro]}
                        style={[estilos.botonGradient, { borderRadius: isTablet ? 20 : 16 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="log-in" size={buttonTextSize + 4} color={KrustyColors.blanco} />
                        <Text style={[estilos.botonIngresarTexto, { fontSize: buttonTextSize }]}>
                            Iniciar Sesión
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        estilos.botonRegistro,
                        {
                            padding: buttonPadding,
                            borderRadius: isTablet ? 20 : 16,
                            borderWidth: isTablet ? 3 : 2,
                        }
                    ]}
                    onPress={() => navigation.navigate('Registro')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-add" size={buttonTextSize + 4} color={KrustyColors.rojo} />
                    <Text style={[estilos.botonRegistroTexto, { fontSize: buttonTextSize }]}>
                        Crear Cuenta
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[estilos.botonInvitado, { paddingVertical: isTablet ? 16 : 12 }]}
                    onPress={() => navigation.navigate('Principal')}
                    activeOpacity={0.7}
                >
                    <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 18 : 14 }]}>
                        Ver menú como invitado
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ✅ Footer con diseño minimalista */}
            <View style={estilos.footerContainer}>
                <View style={estilos.footerDivider} />
                <Text style={[
                    estilos.footer,
                    {
                        fontSize: isTablet ? 14 : 11,
                    }
                ]}>
                    © 2026 Krusty Burger - Todos los derechos reservados
                </Text>
                <Text style={[estilos.footerSub, { fontSize: isTablet ? 12 : 10 }]}>
                    🍔 Hecho con amor y crujiencia
                </Text>
            </View>
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flexGrow: 1,
        backgroundColor: KrustyColors.negro,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    logo: {
        alignItems: 'center',
        width: '100%',
    },
    emojiContainer: {
        marginBottom: 12,
    },
    emojiBackground: {
        borderRadius: 100,
        padding: 20,
        shadowColor: KrustyColors.rojo,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    emoji: {
        color: KrustyColors.blanco,
    },
    titulo: {
        fontWeight: 'bold',
        color: KrustyColors.blanco,
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 2,
    },
    taglineContainer: {
        backgroundColor: KrustyColors.rojo + '20',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    subtitulo: {
        color: KrustyColors.amarillo,
        textAlign: 'center',
        fontWeight: '500',
    },
    features: {
        width: '100%',
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    featureIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTexto: {
        color: KrustyColors.grisClaro,
        flex: 1,
        fontWeight: '500',
    },
    botones: {
        width: '100%',
        gap: 14,
    },
    botonIngresar: {
        overflow: 'hidden',
        elevation: 4,
        shadowColor: KrustyColors.rojo,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    botonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        width: '100%',
    },
    botonIngresarTexto: {
        color: KrustyColors.blanco,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    botonRegistro: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 2,
        borderColor: KrustyColors.rojo,
    },
    botonRegistroTexto: {
        color: KrustyColors.rojo,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    botonInvitado: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    botonInvitadoTexto: {
        color: KrustyColors.gris,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    footerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 10,
        marginTop: 10,
    },
    footerDivider: {
        width: '60%',
        height: 1,
        backgroundColor: KrustyColors.gris + '30',
        marginBottom: 12,
    },
    footer: {
        color: KrustyColors.gris,
        textAlign: 'center',
    },
    footerSub: {
        color: KrustyColors.gris + '80',
        textAlign: 'center',
        marginTop: 4,
    },
});