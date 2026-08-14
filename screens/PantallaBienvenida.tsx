import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, Animated, Dimensions, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../lib/colores';

const { width, height } = Dimensions.get('window');
const logoImage = require('../assets/logo-krusty.png');

export default function PantallaBienvenida({ navigation }: any) {
    const { width: winWidth, height: winHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // ✅ ESTADO PARA CONTROLAR QUÉ FEATURE ESTÁ EXPANDIDO
    const [featureExpandido, setFeatureExpandido] = useState<number | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const translateY = useRef(new Animated.Value(60)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const particulaAnim = useRef(new Animated.Value(0)).current;

    // ✅ DATOS DE FEATURES CON DESCRIPCIONES
    const featuresData = [
        {
            icon: 'restaurant',
            text: 'Hamburguesas premium',
            desc: 'Nuestras hamburguesas están hechas con carne 100% de primera calidad y los mejores ingredientes de Springfield. ¡La receta secreta de Krusty te va a encantar! 🍔'
        },
        {
            icon: 'star',
            text: 'Ganá puntos Krusty',
            desc: 'Cada compra te acerca a increíbles recompensas. Acumulá puntos y canjealos por descuentos, productos gratis y envíos sin costo. ⭐'
        },
        {
            icon: 'bicycle',
            text: 'Delivery en tiempo real',
            desc: 'Seguí tu pedido en vivo desde que sale del local hasta que llega a tu puerta. ¡Nunca más esperar sin saber! 🚲'
        },
    ];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
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
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(particulaAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(particulaAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const isTablet = winWidth >= 768;
    const isSmallPhone = winWidth < 375;

    const logoSize = isTablet ? 200 : isSmallPhone ? 140 : 170;
    const buttonTextSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const buttonPadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
    const featureIconSize = isTablet ? 24 : isSmallPhone ? 20 : 22;
    const logoMarginBottom = isTablet ? 30 : isSmallPhone ? 20 : 24;
    const featuresMarginBottom = isTablet ? 24 : isSmallPhone ? 16 : 20;
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 20 : 24;
    const paddingTop = isTablet ? 40 : isSmallPhone ? 20 : 30;
    const paddingBottom = (isTablet ? 30 : isSmallPhone ? 16 : 20) + insets.bottom;

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.3],
    });

    const particulaY = particulaAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, 50],
    });

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
        <LinearGradient
            colors={Colores.gradientKrusty}
            style={estilos.contenedor}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* ✅ PARTÍCULAS DE FONDO */}
            <Animated.View
                style={[
                    estilos.particula,
                    {
                        transform: [{ translateY: particulaY }],
                        opacity: glowOpacity,
                        top: '10%',
                        left: '10%',
                    }
                ]}
            >
                <Ionicons name="star" size={24} color={Colores.textoClaro + '20'} />
            </Animated.View>
            <Animated.View
                style={[
                    estilos.particula,
                    {
                        transform: [{ translateY: particulaY }],
                        opacity: glowOpacity,
                        bottom: '20%',
                        right: '10%',
                    }
                ]}
            >
                <Ionicons name="restaurant" size={20} color={Colores.textoClaro + '15'} />
            </Animated.View>
            <Animated.View
                style={[
                    estilos.particula,
                    {
                        transform: [{ translateY: particulaY }],
                        opacity: glowOpacity,
                        top: '30%',
                        right: '5%',
                    }
                ]}
            >
                <Ionicons name="bicycle" size={18} color={Colores.textoClaro + '15'} />
            </Animated.View>

            {/* ✅ SELECTOR DE IDIOMA */}
            <TouchableOpacity style={estilos.idiomaSelector}>
                <Ionicons name="language" size={20} color={Colores.textoClaro} />
                <Text style={estilos.idiomaTexto}>ES</Text>
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingTop: paddingTop,
                        paddingBottom: paddingBottom,
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
                            marginBottom: logoMarginBottom,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
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
                </Animated.View>

                {/* ✅ FEATURES EXPANDIBLES */}
                <View style={[estilos.features, { marginBottom: featuresMarginBottom, gap: isTablet ? 12 : 10 }]}>
                    {featuresData.map((item, index) => {
                        const itemTranslateY = translateY.interpolate({
                            inputRange: [0, 60],
                            outputRange: [0, 20 + index * 10],
                        });
                        const expandido = featureExpandido === index;

                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.9}
                                onPress={() => setFeatureExpandido(expandido ? null : index)}
                            >
                                <Animated.View
                                    style={[
                                        estilos.featureItem,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: itemTranslateY }],
                                            backgroundColor: expandido
                                                ? Colores.secundario + '15'
                                                : Colores.textoOscuro + '50',
                                            borderColor: expandido
                                                ? Colores.secundario
                                                : Colores.textoClaro + '15',
                                            paddingVertical: expandido ? 14 : 10,
                                        }
                                    ]}
                                >
                                    <View style={estilos.featureHeader}>
                                        <View style={estilos.featureIconWrapper}>
                                            <LinearGradient
                                                colors={expandido ? [Colores.secundario, Colores.secundarioOscuro] : [Colores.primario, Colores.primarioOscuro]}
                                                style={estilos.featureIconGradient}
                                            >
                                                <Ionicons name={item.icon as any} size={featureIconSize} color={expandido ? Colores.textoClaro : Colores.textoOscuro} />
                                            </LinearGradient>
                                        </View>
                                        <Text style={[estilos.featureTexto, { fontSize: isTablet ? 16 : 14 }]}>
                                            {item.text}
                                        </Text>
                                        <Ionicons
                                            name={expandido ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={expandido ? Colores.secundario : Colores.textoGris}
                                        />
                                    </View>

                                    {/* ✅ DESCRIPCIÓN EXPANDIDA */}
                                    {expandido && (
                                        <Animated.View style={estilos.featureDescContainer}>
                                            <Text style={[estilos.featureDesc, { fontSize: isTablet ? 14 : 12 }]}>
                                                {item.desc}
                                            </Text>
                                            <TouchableOpacity
                                                style={[estilos.featureDescBoton, { paddingHorizontal: isTablet ? 20 : 14, paddingVertical: isTablet ? 8 : 6 }]}
                                                onPress={() => setFeatureExpandido(null)}
                                            >
                                                <Text style={[estilos.featureDescBotonTexto, { fontSize: isTablet ? 13 : 11 }]}>
                                                    Entendido
                                                </Text>
                                            </TouchableOpacity>
                                        </Animated.View>
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
                            gap: isTablet ? 12 : 10,
                            marginBottom: isTablet ? 30 : 20,
                            opacity: fadeAnim,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            estilos.botonIngresar,
                            {
                                padding: 0,
                                borderRadius: isTablet ? 14 : 12,
                            }
                        ]}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colores.secundario, Colores.secundarioOscuro]}
                            style={[
                                estilos.botonGradient,
                                {
                                    borderRadius: isTablet ? 14 : 12,
                                    paddingVertical: buttonPadding,
                                    paddingHorizontal: buttonPadding * 1.5,
                                }
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="log-in" size={buttonTextSize} color={Colores.textoClaro} />
                            <Text style={[estilos.botonIngresarTexto, { fontSize: buttonTextSize, color: Colores.textoClaro }]}>
                                Iniciar Sesión
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            estilos.botonRegistro,
                            {
                                padding: buttonPadding,
                                borderRadius: isTablet ? 14 : 12,
                                borderWidth: isTablet ? 2 : 1.5,
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
                        style={[estilos.botonInvitado, { paddingVertical: isTablet ? 12 : 10 }]}
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
                    <LinearGradient
                        colors={[Colores.textoClaro + '30', 'transparent']}
                        style={estilos.footerDivider}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />

                    <Text style={[estilos.footer, { fontSize: isTablet ? 12 : 10 }]}>
                        © 2026 Krusty Burger
                    </Text>

                    <Text style={[estilos.version, { fontSize: isTablet ? 10 : 8 }]}>
                        v1.0.0
                    </Text>

                    <View style={estilos.agenciaContainer}>
                        <View style={estilos.agenciaDivider} />
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
                            <Text style={[estilos.agenciaTexto, { fontSize: isTablet ? 12 : 10 }]}>
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
        </LinearGradient>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
    },
    idiomaSelector: {
        position: 'absolute',
        top: 40,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colores.textoOscuro + '50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '20',
        zIndex: 10,
    },
    idiomaTexto: {
        color: Colores.textoClaro,
        fontSize: 12,
        fontWeight: '600',
    },
    particula: {
        position: 'absolute',
        zIndex: 0,
    },
    logo: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    logoImage: {
        backgroundColor: 'transparent',
        borderRadius: 100,
    },
    features: {
        width: '100%',
        gap: 10,
    },
    featureItem: {
        borderRadius: 12,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    featureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
    },
    featureIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        flexShrink: 0,
    },
    featureIconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTexto: {
        flex: 1,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    featureNeon: {
        position: 'absolute',
        right: -10,
        top: -10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colores.primario + '10',
        borderWidth: 1,
        borderColor: Colores.primario + '20',
    },
    featureDescContainer: {
        marginTop: 10,
        paddingTop: 10,
        paddingHorizontal: 14,
        paddingBottom: 4,
        borderTopWidth: 1,
        borderTopColor: Colores.textoClaro + '15',
    },
    featureDesc: {
        color: Colores.textoClaro,
        lineHeight: 22,
        opacity: 0.9,
    },
    featureDescBoton: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 4,
        backgroundColor: Colores.secundario,
        borderRadius: 20,
    },
    featureDescBotonTexto: {
        color: Colores.textoClaro,
        fontWeight: 'bold',
    },
    botones: {
        width: '100%',
        gap: 10,
    },
    botonIngresar: {
        overflow: 'hidden',
        elevation: 8,
        shadowColor: Colores.secundario,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    botonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
    },
    botonIngresarTexto: {
        fontWeight: '700',
        letterSpacing: 1,
    },
    botonRegistro: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: Colores.primario,
    },
    botonRegistroTexto: {
        color: Colores.primario,
        fontWeight: '600',
        letterSpacing: 1,
    },
    botonInvitado: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    botonInvitadoTexto: {
        color: Colores.textoClaro + '60',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
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
    },
    footer: {
        color: Colores.textoClaro + '50',
        textAlign: 'center',
        fontWeight: '500',
    },
    version: {
        color: Colores.textoClaro + '30',
        textAlign: 'center',
        marginTop: 4,
    },
    agenciaContainer: {
        marginTop: 12,
        alignItems: 'center',
        width: '100%',
    },
    agenciaDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colores.textoClaro + '15',
        marginBottom: 8,
    },
    agenciaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colores.textoOscuro + '50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 20,
        borderColor: Colores.primario + '20',
    },
    agenciaTexto: {
        color: Colores.textoClaro + '70',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});