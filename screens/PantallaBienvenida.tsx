// screens/PantallaBienvenida.tsx - CON SIMPSONFONT (SIN TÍTULO/SUBTÍTULO)
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
import { FUENTES, TAMANOS_DISPLAY } from '../lib/fuentes';

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
            desc: 'Cada compra te acerca a increíbles recompensas. Acumulá puntos y canjealos por descuentos exclusivos y envíos sin costo. ¡Mientras más sumás, más beneficios desbloqueás! ⭐',
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

    // ✅ Tamaños más compactos
    const logoSize = isTablet ? 150 : isSmallPhone ? 110 : 130;
    const buttonTextSize = isTablet ? 16 : isSmallPhone ? 13 : 15;
    const buttonPadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
    const featureIconSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
    const paddingHorizontal = isTablet ? 48 : isSmallPhone ? 20 : 24;
    const paddingTop = isTablet ? 40 : isSmallPhone ? 20 : 28;

    const abrirWebAgencia = async () => {
        const url = 'https://www.agenciadigitalpowa.com.ar';
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
                {/* ✅ LOGO SOLO (sin título ni subtítulo) */}
                <Animated.View
                    style={[
                        estilos.logo,
                        {
                            marginBottom: isTablet ? 24 : 20,
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
                </Animated.View>

                {/* ✅ FEATURES EXPANDIBLES */}
                <View style={[estilos.features, { marginBottom: isTablet ? 24 : 18 }]}>
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
                                            paddingVertical: expandido ? 14 : 10,
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

                                        {/* ✅ TÍTULO DEL FEATURE CON SIMPSONFONT - MÁS CHICO */}
                                        <Text style={[
                                            estilos.featureTexto,
                                            {
                                                fontSize: isTablet ? 16 : isSmallPhone ? 14 : 15,
                                                color: Colores.textoOscuro,
                                            }
                                        ]}>
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
                                            {/* ✅ DESCRIPCIÓN CON FUENTE REGULAR - MÁS CHICA */}
                                            <Text style={[estilos.featureDesc, {
                                                fontSize: isTablet ? 13 : 11,
                                                color: Colores.textoOscuro,
                                            }]}>
                                                {item.desc}
                                            </Text>
                                            <TouchableOpacity
                                                style={[
                                                    estilos.featureDescBoton,
                                                    {
                                                        backgroundColor: item.color,
                                                        paddingHorizontal: isTablet ? 18 : 12,
                                                        paddingVertical: isTablet ? 6 : 5,
                                                    }
                                                ]}
                                                onPress={() => setFeatureExpandido(null)}
                                            >
                                                {/* ✅ BOTÓN "ENTENDIDO" CON SIMPSONFONT - MÁS CHICO */}
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
                            gap: isTablet ? 10 : 8,
                            marginBottom: isTablet ? 24 : 18,
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
                            {/* ✅ BOTÓN "INICIAR SESIÓN" CON SIMPSONFONT - MÁS CHICO */}
                            <Text style={[
                                estilos.botonIngresarTexto,
                                {
                                    fontSize: isTablet ? 18 : isSmallPhone ? 15 : 16,
                                }
                            ]}>
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
                        {/* ✅ BOTÓN "CREAR CUENTA" CON SIMPSONFONT - MÁS CHICO */}
                        <Text style={[
                            estilos.botonRegistroTexto,
                            {
                                fontSize: isTablet ? 18 : isSmallPhone ? 15 : 16,
                            }
                        ]}>
                            Crear Cuenta
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={estilos.botonInvitado}
                        onPress={() => navigation.navigate('Principal')}
                        activeOpacity={0.6}
                    >
                        <Text style={[estilos.botonInvitadoTexto, { fontSize: isTablet ? 13 : 11 }]}>
                            Ver menú como invitado
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* ✅ FOOTER */}
                <Animated.View style={[estilos.footerContainer, { opacity: fadeAnim }]}>
                    <View style={estilos.footerDivider} />

                    <Text style={[estilos.footer, {
                        fontSize: isTablet ? 11 : 9,
                        color: Colores.textoGris,
                    }]}>
                        © 2026 Krusty Burger
                    </Text>

                    <Text style={[estilos.version, {
                        fontSize: isTablet ? 9 : 8,
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
                                    width: isTablet ? 35 : 30,
                                    height: isTablet ? 35 : 30,
                                    resizeMode: 'contain',
                                }}
                            />
                            <Text style={[estilos.agenciaTexto, {
                                fontSize: isTablet ? 11 : 9,
                                color: Colores.textoGris,
                            }]}>
                                Desarrollo Digital Powa
                            </Text>
                            <Ionicons
                                name="open-outline"
                                size={isTablet ? 12 : 10}
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
// 🎨 ESTILOS
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

    // ============================================================
    // FEATURES
    // ============================================================
    features: {
        width: '100%',
        gap: 8,
    },
    featureItem: {
        borderRadius: Sizes.radius.md,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
        paddingHorizontal: 12,
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
        gap: 10,
    },
    featureIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: Sizes.radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    // ✅ TÍTULO DEL FEATURE CON SIMPSONFONT
    featureTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        flex: 1,
        color: Colores.textoOscuro,
        letterSpacing: 0.2,
    },
    featureDescContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colores.fondoClaro,
    },
    // ✅ DESCRIPCIÓN CON FUENTE REGULAR
    featureDesc: {
        fontFamily: FUENTES.regular,
        color: Colores.textoOscuro,
        lineHeight: 18,
        opacity: 0.85,
    },
    featureDescBoton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        marginBottom: 2,
        borderRadius: Sizes.radius.full,
    },
    // ✅ BOTÓN "ENTENDIDO" CON SIMPSONFONT
    featureDescBotonTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: Colores.textoClaro,
        letterSpacing: 0.3,
    },

    // ============================================================
    // BOTONES
    // ============================================================
    botones: {
        width: '100%',
        gap: 8,
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
    // ✅ BOTÓN "INICIAR SESIÓN" CON SIMPSONFONT
    botonIngresarTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: Colores.textoClaro,
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
    // ✅ BOTÓN "CREAR CUENTA" CON SIMPSONFONT
    botonRegistroTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: Colores.primario,
        letterSpacing: 0.5,
    },
    botonInvitado: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    // ✅ BOTÓN "INVITADO" CON FUENTE REGULAR
    botonInvitadoTexto: {
        fontFamily: FUENTES.regular,
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
        paddingTop: 6,
        marginTop: 6,
    },
    footerDivider: {
        width: '60%',
        height: 1,
        marginBottom: 10,
        backgroundColor: Colores.fondoClaro,
    },
    footer: {
        fontFamily: FUENTES.regular,
        color: Colores.textoGris,
        textAlign: 'center',
        fontWeight: '500',
    },
    version: {
        fontFamily: FUENTES.regular,
        color: Colores.textoGris + '60',
        textAlign: 'center',
        marginTop: 3,
    },

    // ============================================================
    // AGENCIA
    // ============================================================
    agenciaContainer: {
        marginTop: 10,
        alignItems: 'center',
        width: '100%',
    },
    agenciaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colores.fondoBlanco,
        paddingHorizontal: 10,
        paddingVertical: 5,
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
        fontFamily: FUENTES.regular,
        color: Colores.textoGris,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
});