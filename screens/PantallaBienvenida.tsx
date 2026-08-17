// screens/PantallaBienvenida.tsx - CORREGIDO
import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    ScrollView,
    Animated,
    Dimensions,
    Image,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores, Sizes, getTematica } from '../lib/colores';

const { width, height } = Dimensions.get('window');
const logoImage = require('../assets/logo-krusty.png');

export default function PantallaBienvenida({ navigation }: any) {
    const { width: winWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const temaClaro = getTematica('claro');

    const [featureExpandido, setFeatureExpandido] = useState<number | null>(null);

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.92)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    const featuresData = [
        {
            icon: 'restaurant',
            text: 'Hamburguesas premium',
            desc: 'Nuestras hamburguesas están hechas con carne 100% de primera calidad y los mejores ingredientes de Springfield. ¡La receta secreta de Krusty te va a encantar! 🍔',
            color: Colores.secundario,
            iconBg: Colores.secundario + '20',
        },
        {
            icon: 'star',
            text: 'Ganá puntos Krusty',
            desc: 'Cada compra te acerca a increíbles recompensas. Acumulá puntos y canjealos por descuentos, productos gratis y envíos sin costo. ⭐',
            color: Colores.primario,
            iconBg: Colores.primario + '20',
        },
        {
            icon: 'bicycle',
            text: 'Delivery en tiempo real',
            desc: 'Seguí tu pedido en vivo desde que sale del local hasta que llega a tu puerta. ¡Nunca más esperar sin saber! 🚲',
            color: Colores.verdeKrusty,
            iconBg: Colores.verdeKrusty + '20',
        },
    ];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 10,
                tension: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 700,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isTablet = winWidth >= 768;
    const isSmallPhone = winWidth < 375;

    const logoSize = isTablet ? 180 : isSmallPhone ? 120 : 150;
    const buttonTextSize = isTablet ? 17 : isSmallPhone ? 13 : 15;
    const buttonPadding = isTablet ? 16 : isSmallPhone ? 12 : 14;
    const featureIconSize = isTablet ? 22 : isSmallPhone ? 18 : 20;
    const paddingHorizontal = isTablet ? 48 : isSmallPhone ? 20 : 24;
    const paddingTop = isTablet ? 48 : isSmallPhone ? 24 : 32;

    const abrirWebAgencia = async () => {
        const url = 'https://agencia-powa.vercel.app';
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log("No se puede abrir la URL: " + url);
            }
        } catch (error) {
            console.error("Error al abrir el enlace:", error);
        }
    };

    return (
        <View style={estilos.contenedor}>
            {/* ✅ Fondo con gradiente suave */}
            <LinearGradient
                colors={[Colores.fondoClaro || '#F5F2ED', '#FFFFFF', Colores.fondoClaro || '#F5F2ED']}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ SELECTOR DE IDIOMA */}
            <TouchableOpacity style={[estilos.idiomaSelector, { top: insets.top + 16 }]}>
                <Ionicons name="language" size={18} color={Colores.textoOscuro} />
                <Text style={estilos.idiomaSelectorTexto}>ES</Text>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingTop: paddingTop,
                        paddingBottom: insets.bottom + 24,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* ✅ LOGO */}
                <Animated.View
                    style={[
                        estilos.logo,
                        {
                            marginBottom: isTablet ? 32 : 24,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }, { translateY: translateY }],
                        }
                    ]}
                >
                    <Image
                        source={logoImage}
                        style={[
                            estilos.logoImage,
                            {
                                width: logoSize,
                                height: logoSize,
                            }
                        ]}
                        resizeMode="contain"
                    />
                    <Text style={[estilos.logoSubtext, { fontSize: isTablet ? 14 : 11 }]}>
                        🍔 Desde Springfield para el mundo
                    </Text>
                </Animated.View>

                {/* ✅ FEATURES EXPANDIBLES */}
                <View style={[estilos.features, { marginBottom: isTablet ? 28 : 20 }]}>
                    {featuresData.map((item, index) => {
                        const expandido = featureExpandido === index;

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.9}
                                onPress={() => setFeatureExpandido(expandido ? null : index)}
                                style={styles.featureTouch}
                            >
                                <Animated.View
                                    style={[
                                        estilos.featureItem,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: translateY }],
                                            backgroundColor: expandido
                                                ? item.color + '15'
                                                : Colores.fondoBlanco,
                                            borderColor: expandido
                                                ? item.color + '40'
                                                : Colores.fondoClaro,
                                            paddingVertical: expandido ? 16 : 12,
                                        }
                                    ]}
                                >
                                    <View style={estilos.featureHeader}>
                                        <View style={[estilos.featureIconWrapper, { backgroundColor: item.iconBg }]}>
                                            <Ionicons
                                                name={item.icon as any}
                                                size={featureIconSize}
                                                color={item.color}
                                            />
                                        </View>
                                        <Text style={[estilos.featureTexto, {
                                            fontSize: isTablet ? 15 : 13,
                                            color: Colores.textoOscuro,
                                        }]}>
                                            {item.text}
                                        </Text>
                                        <Ionicons
                                            name={expandido ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color={expandido ? item.color : Colores.textoGris}
                                        />
                                    </View>

                                    {expandido && (
                                        <View style={estilos.featureDescContainer}>
                                            <Text style={[estilos.featureDesc, {
                                                fontSize: isTablet ? 14 : 12,
                                                color: Colores.textoOscuro,
                                            }]}>
                                                {item.desc}
                                            </Text>
                                            <TouchableOpacity
                                                style={[
                                                    estilos.featureDescBoton,
                                                    {
                                                        backgroundColor: item.color,
                                                        paddingHorizontal: isTablet ? 20 : 14,
                                                        paddingVertical: isTablet ? 8 : 6,
                                                    }
                                                ]}
                                                onPress={() => setFeatureExpandido(null)}
                                            >
                                                <Text style={[estilos.featureDescBotonTexto, { fontSize: isTablet ? 13 : 11 }]}>
                                                    Entendido
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ✅ BOTONES */}
                <Animated.View
                    style={[
                        estilos.botones,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: translateY }],
                            gap: isTablet ? 12 : 10,
                            marginBottom: isTablet ? 28 : 20,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={estilos.botonIngresar}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colores.secundario, Colores.secundarioOscuro]}
                            style={[
                                estilos.botonGradient,
                                {
                                    borderRadius: Sizes.radius.md,
                                    paddingVertical: buttonPadding,
                                }
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="log-in" size={buttonTextSize} color={Colores.textoClaro} />
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
                                borderRadius: Sizes.radius.md,
                                borderWidth: isTablet ? 2 : 1.5,
                                borderColor: Colores.primario,
                            }
                        ]}
                        onPress={() => navigation.navigate('Registro')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add" size={buttonTextSize + 2} color={Colores.primario} />
                        <Text style={[estilos.botonRegistroTexto, { fontSize: buttonTextSize }]}>
                            Crear Cuenta
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={estilos.botonInvitado}
                        onPress={() => navigation.navigate('Principal')}
                        activeOpacity={0.6}
                    >
                        <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 14 : 12 }]}>
                            Ver menú como invitado
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ✅ FOOTER */}
                <Animated.View style={[estilos.footerContainer, { opacity: fadeAnim }]}>
                    <View style={estilos.footerDivider} />

                    <Text style={[estilos.footer, {
                        fontSize: isTablet ? 12 : 10,
                        color: Colores.textoGris,
                    }]}>
                        © 2026 Krusty Burger
                    </Text>

                    <Text style={[estilos.version, {
                        fontSize: isTablet ? 10 : 8,
                        color: Colores.textoGris + '60',
                    }]}>
                        v1.0.0
                    </Text>

                    <View style={estilos.agenciaContainer}>
                        <TouchableOpacity
                            style={estilos.agenciaContent}
                            onPress={abrirWebAgencia}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={require('../assets/logo-agencia.png')}
                                style={{
                                    width: isTablet ? 18 : 14,
                                    height: isTablet ? 18 : 14,
                                    resizeMode: 'contain',
                                }}
                            />
                            <Text style={[estilos.agenciaTexto, {
                                fontSize: isTablet ? 12 : 10,
                                color: Colores.textoGris,
                            }]}>
                                Desarrollo Digital Powa
                            </Text>
                            <Ionicons
                                name="open-outline"
                                size={isTablet ? 14 : 10}
                                color={Colores.primario}
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - CORREGIDOS
// ============================================================
const styles = StyleSheet.create({
    featureTouch: {
        width: '100%',
    },
});

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: Colores.fondoClaro,
    },
    fondoGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ============================================================
    // IDIOMA SELECTOR
    // ============================================================
    idiomaSelector: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colores.fondoBlanco,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Sizes.radius.full,
        borderWidth: 1,
        borderColor: Colores.fondoClaro,
        shadowColor: Colores.textoOscuro + '06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    idiomaSelectorTexto: {
        color: Colores.textoOscuro,
        fontSize: 12,
        fontWeight: '600',
    },

    // ============================================================
    // LOGO
    // ============================================================
    logo: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoImage: {
        backgroundColor: 'transparent',
        borderRadius: 999,
    },
    logoSubtext: {
        color: Colores.textoGris,
        fontWeight: '400',
        letterSpacing: 0.5,
        marginTop: 4,
    },

    // ============================================================
    // FEATURES
    // ============================================================
    features: {
        width: '100%',
        gap: 10,
    },
    featureItem: {
        borderRadius: Sizes.radius.md,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
        paddingHorizontal: 14,
        backgroundColor: Colores.fondoBlanco,
        shadowColor: Colores.textoOscuro + '06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 2,
    },
    featureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: Sizes.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    featureTexto: {
        flex: 1,
        fontWeight: '600',
        color: Colores.textoOscuro,
        letterSpacing: 0.2,
    },
    featureDescContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colores.fondoClaro,
    },
    featureDesc: {
        color: Colores.textoOscuro,
        lineHeight: 22,
        opacity: 0.85,
    },
    featureDescBoton: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 2,
        borderRadius: Sizes.radius.full,
    },
    featureDescBotonTexto: {
        color: Colores.textoClaro,
        fontWeight: '600',
    },

    // ============================================================
    // BOTONES
    // ============================================================
    botones: {
        width: '100%',
        gap: 10,
    },
    botonIngresar: {
        overflow: 'hidden',
        borderRadius: Sizes.radius.md,
        shadowColor: Colores.secundario,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    botonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        paddingHorizontal: 20,
    },
    botonIngresarTexto: {
        color: Colores.textoClaro,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    botonRegistro: {
        flexDirection: 'row',
        backgroundColor: Colores.fondoBlanco,
        borderRadius: Sizes.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: Colores.primario,
        shadowColor: Colores.textoOscuro + '06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    botonRegistroTexto: {
        color: Colores.primario,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    botonInvitado: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    botonInvitadoTexto: {
        color: Colores.textoGris,
        textDecorationLine: 'underline',
        fontWeight: '400',
    },

    // ============================================================
    // FOOTER
    // ============================================================
    footerContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 8,
        marginTop: 8,
    },
    footerDivider: {
        width: '60%',
        height: 1,
        marginBottom: 12,
        backgroundColor: Colores.fondoClaro,
    },
    footer: {
        color: Colores.textoGris,
        textAlign: 'center',
        fontWeight: '500',
    },
    version: {
        color: Colores.textoGris + '60',
        textAlign: 'center',
        marginTop: 4,
    },

    // ============================================================
    // AGENCIA
    // ============================================================
    agenciaContainer: {
        marginTop: 12,
        alignItems: 'center',
        width: '100%',
    },
    agenciaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colores.fondoBlanco,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Sizes.radius.full,
        borderWidth: 1,
        borderColor: Colores.fondoClaro,
        shadowColor: Colores.textoOscuro + '06',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    agenciaTexto: {
        color: Colores.textoGris,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
});