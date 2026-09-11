// screens/cliente/PantallaDetalleOferta.tsx - CON SIMPSONFONT Y TEMA CLARO
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isSmallPhone = width < 375;

    const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
        if (isDesktop || isTablet) return valores.tablet;
        if (isSmallPhone) return valores.small;
        return valores.normal;
    }, [isDesktop, isTablet, isSmallPhone]);

    const spacing = (base: number) => {
        if (isTablet) return base * 1.5;
        if (isSmallPhone) return base * 0.75;
        return base;
    };

    return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

// ============================================================
// 🎨 PALETA DE MARCA (misma que PantallaOfertas)
// ============================================================
const PALETA_OFERTAS = [
    DISENO.colors.accent,          // 🔴 Rojo Krusty
    DISENO.colors.accentSecondary, // 🟡 Amarillo Krusty
    DISENO.colors.verde,           // 🟢 Verde
    DISENO.colors.rosa,            // 🌸 Rosa
    DISENO.colors.azul,            // 🔵 Azul
    DISENO.colors.verdeClaro,      // 🟢 Verde claro
    DISENO.colors.azulClaro,       // 🔵 Azul claro
    DISENO.colors.accentLight,     // 🔴 Rojo claro
];

const getColorPorId = (id: number) => PALETA_OFERTAS[id % PALETA_OFERTAS.length];

export default function PantallaDetalleOferta(props: any) {
    const oferta = props.route?.params?.oferta;
    const { agregarProducto } = tiendaCarrito();
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();

    // ✅ Estados
    const [imagenCargando, setImagenCargando] = useState(true);
    const [imagenError, setImagenError] = useState(false);

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        console.log('🔄 [DetalleOferta] Cargando detalle de oferta:', oferta?.titulo);
        console.log('🖼️ [DetalleOferta] Imagen:', oferta?.imagen || 'Sin imagen');
        console.log('💰 [DetalleOferta] Precios:', {
            original: oferta?.precio_original,
            oferta: oferta?.precio_oferta
        });

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    if (!oferta) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Oferta no encontrada</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => props.navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const colorOferta = getColorPorId(oferta.id);

    // ✅ Calcular ahorro
    const calcularAhorro = (): number => {
        const original = oferta.precio_original;
        const ofertaPrecio = oferta.precio_oferta;

        if (original && ofertaPrecio && !isNaN(original) && !isNaN(ofertaPrecio)) {
            return original - ofertaPrecio;
        }
        return 0;
    };

    const agregarAlCarrito = () => {
        console.log('🛒 [DetalleOferta] Agregando al carrito:', oferta.titulo);

        const producto = {
            id: oferta.id,
            nombre: oferta.titulo,
            descripcion: oferta.descripcion || 'Oferta especial',
            precio: oferta.precio_oferta || 0,
            categoria: 'ofertas',
            imagen: oferta.imagen || null,
        };

        agregarProducto(producto);

        Alert.alert(
            '🎉 ¡Agregado!',
            `${oferta.titulo} se agregó al carrito con descuento especial`,
            [
                {
                    text: 'Seguir viendo',
                    style: 'cancel'
                },
                {
                    text: 'Ver carrito',
                    onPress: () => props.navigation.navigate('Carrito')
                }
            ]
        );
    };

    const ahorro = calcularAhorro();

    // ✅ Tamaños responsivos
    const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
    const imagenHeight = responsive.getValor({ tablet: 400, normal: 280, small: 220 });
    const imagenRadius = responsive.getValor({ tablet: 24, normal: 18, small: 14 });
    const tituloSize = responsive.getValor({ tablet: 28, normal: 22, small: 18 });
    const descSize = responsive.getValor({ tablet: 16, normal: 14, small: 13 });
    const precioOfertaSize = responsive.getValor({ tablet: 34, normal: 26, small: 24 });
    const headerTitleSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });

    return (
        <View style={styles.container}>
            {/* ✅ FONDO CLARO */}
            <LinearGradient
                colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ GRADIENTE SOLO EN EL HEADER */}
            <LinearGradient
                colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                style={styles.headerGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingBottom: insets.bottom + 140,
                    }
                ]}
            >
                {/* ✅ HEADER */}
                <View style={[
                    styles.header,
                    {
                        paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 12, small: 10 }),
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                    }
                ]}>
                    <TouchableOpacity
                        style={styles.backHeaderButton}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={responsive.getValor({ tablet: 28, normal: 24, small: 22 })}
                            color={DISENO.colors.surface}
                        />
                    </TouchableOpacity>

                    {/* ✅ TÍTULO CON SIMPSONFONT */}
                    <Text style={[
                        styles.headerTitle,
                        { fontSize: headerTitleSize, color: DISENO.colors.surface }
                    ]}>
                        Oferta Especial
                    </Text>

                    <View style={{ width: responsive.getValor({ tablet: 28, normal: 24, small: 22 }) }} />
                </View>

                {/* ✅ CONTENIDO DE LA OFERTA */}
                <Animated.View style={[
                    styles.content,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingTop: responsive.getValor({ tablet: 24, normal: 16, small: 12 }),
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    {/* ✅ IMAGEN */}
                    <View style={[
                        styles.imageContainer,
                        {
                            height: imagenHeight,
                            borderRadius: imagenRadius,
                            backgroundColor: colorOferta + '20',
                            borderColor: colorOferta + '30',
                        }
                    ]}>
                        {oferta.imagen ? (
                            <>
                                {imagenCargando && (
                                    <View style={styles.imageLoading}>
                                        <ActivityIndicator size="large" color={colorOferta} />
                                    </View>
                                )}
                                <Image
                                    source={{ uri: oferta.imagen }}
                                    style={[
                                        styles.image,
                                        { opacity: imagenCargando ? 0 : 1 }
                                    ]}
                                    resizeMode="cover"
                                    onLoadStart={() => {
                                        console.log('⏳ [DetalleOferta] Cargando imagen...');
                                        setImagenCargando(true);
                                        setImagenError(false);
                                    }}
                                    onLoad={() => {
                                        console.log('✅ [DetalleOferta] Imagen cargada correctamente');
                                        setImagenCargando(false);
                                    }}
                                    onError={(e) => {
                                        console.log('❌ [DetalleOferta] Error cargando imagen:', e.nativeEvent.error);
                                        setImagenCargando(false);
                                        setImagenError(true);
                                    }}
                                />
                                {imagenError && (
                                    <View style={styles.imageError}>
                                        <Ionicons
                                            name="image-outline"
                                            size={responsive.getValor({ tablet: 60, normal: 50, small: 40 })}
                                            color={DISENO.colors.textTertiary + '40'}
                                        />
                                        <Text style={[
                                            styles.imageErrorText,
                                            {
                                                fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                                                color: DISENO.colors.textSecondary,
                                            }
                                        ]}>
                                            Error al cargar imagen
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                {/* ✅ Emoji SIN fontFamily */}
                                <Text style={[styles.emojiLarge, { fontSize: responsive.getValor({ tablet: 80, normal: 60, small: 50 }) }]}>
                                    🏷️
                                </Text>
                                <Text style={[
                                    styles.placeholderText,
                                    {
                                        fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                                        color: DISENO.colors.textSecondary,
                                    }
                                ]}>
                                    Sin imagen disponible
                                </Text>
                            </View>
                        )}

                        {/* ✅ BADGE DE DESCUENTO CON GRADIENTE */}
                        <LinearGradient
                            colors={[colorOferta, colorOferta + 'CC']}
                            style={[
                                styles.descuentoBadge,
                                {
                                    paddingHorizontal: responsive.getValor({ tablet: 18, normal: 14, small: 10 }),
                                    paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                                    borderRadius: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                                }
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* ✅ DESCUENTO CON SIMPSONFONT */}
                            <Text style={[
                                styles.descuentoBadgeText,
                                {
                                    fontSize: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                                    color: DISENO.colors.surface,
                                }
                            ]}>
                                🔥 {oferta.descuento}
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* ✅ TÍTULO CON SIMPSONFONT */}
                    <Text style={[
                        styles.ofertaTitulo,
                        { fontSize: tituloSize, color: colorOferta }
                    ]}>
                        {oferta.titulo}
                    </Text>

                    {/* ✅ DESCRIPCIÓN CON FUENTE REGULAR */}
                    <Text style={[
                        styles.ofertaDesc,
                        { fontSize: descSize, color: DISENO.colors.textSecondary }
                    ]}>
                        {oferta.descripcion || 'Oferta especial de Krusty Burger. ¡No te lo pierdas!'}
                    </Text>

                    {/* ✅ PRECIOS */}
                    <View style={styles.preciosContainer}>
                        <View style={styles.precioOriginalContainer}>
                            <Text style={[
                                styles.precioOriginalLabel,
                                {
                                    fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                                    color: DISENO.colors.textSecondary,
                                }
                            ]}>
                                Precio original
                            </Text>
                            {/* ✅ PRECIO ORIGINAL CON FUENTE REGULAR */}
                            <Text style={[
                                styles.precioOriginal,
                                {
                                    fontSize: responsive.getValor({ tablet: 20, normal: 16, small: 14 }),
                                    color: DISENO.colors.textTertiary,
                                }
                            ]}>
                                {formatearPrecio(oferta.precio_original)}
                            </Text>
                        </View>
                        <View style={styles.precioOfertaContainer}>
                            <Text style={[
                                styles.precioOfertaLabel,
                                {
                                    fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                                    color: DISENO.colors.textSecondary,
                                }
                            ]}>
                                Precio oferta
                            </Text>
                            {/* ✅ PRECIO OFERTA CON SIMPSONFONT */}
                            <Text style={[
                                styles.precioOferta,
                                { fontSize: precioOfertaSize, color: colorOferta }
                            ]}>
                                {formatearPrecio(oferta.precio_oferta)}
                            </Text>
                        </View>
                    </View>

                    {/* ✅ AHORRO */}
                    {ahorro > 0 && (
                        <View style={[
                            styles.ahorroContainer,
                            {
                                backgroundColor: colorOferta + '15',
                                borderColor: colorOferta + '30',
                                padding: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                                borderRadius: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                            }
                        ]}>
                            <Ionicons
                                name="cash"
                                size={responsive.getValor({ tablet: 28, normal: 22, small: 18 })}
                                color={colorOferta}
                            />
                            {/* ✅ AHORRO CON SIMPSONFONT */}
                            <Text style={[
                                styles.ahorroTexto,
                                {
                                    fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                                    color: colorOferta,
                                }
                            ]}>
                                ¡Ahorra {formatearPrecio(ahorro)}!
                            </Text>
                        </View>
                    )}

                    {/* ✅ FECHAS */}
                    {(oferta.fecha_inicio || oferta.fecha_fin) && (
                        <View style={styles.fechasContainer}>
                            {oferta.fecha_inicio && (
                                <Text style={[
                                    styles.fechaTexto,
                                    {
                                        fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                                        color: DISENO.colors.textSecondary,
                                    }
                                ]}>
                                    📅 Inicio: {new Date(oferta.fecha_inicio).toLocaleDateString('es-AR')}
                                </Text>
                            )}
                            {oferta.fecha_fin && (
                                <Text style={[
                                    styles.fechaTexto,
                                    {
                                        fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                                        color: DISENO.colors.textSecondary,
                                    }
                                ]}>
                                    📅 Fin: {new Date(oferta.fecha_fin).toLocaleDateString('es-AR')}
                                </Text>
                            )}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* ✅ BOTÓN AGREGAR AL CARRITO */}
            <Animated.View style={[
                styles.footer,
                {
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: insets.bottom + responsive.getValor({ tablet: 24, normal: 16, small: 12 }),
                    paddingTop: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                    opacity: fadeAnim,
                    backgroundColor: DISENO.colors.surface + 'F5',
                    borderTopColor: DISENO.colors.border,
                }
            ]}>
                <TouchableOpacity
                    style={[
                        styles.addButton,
                        { borderRadius: responsive.getValor({ tablet: 18, normal: 14, small: 12 }) }
                    ]}
                    onPress={agregarAlCarrito}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[DISENO.colors.accentSecondary, DISENO.colors.accent]}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons
                            name="cart"
                            size={responsive.getValor({ tablet: 26, normal: 22, small: 20 })}
                            color={DISENO.colors.text}
                        />
                        {/* ✅ BOTÓN CON SIMPSONFONT */}
                        <Text style={[
                            styles.addButtonText,
                            {
                                fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
                                color: DISENO.colors.text,
                            }
                        ]}>
                            Agregar al carrito
                        </Text>
                        <View style={[
                            styles.priceButton,
                            {
                                borderRadius: responsive.getValor({ tablet: 12, normal: 8, small: 6 }),
                                backgroundColor: DISENO.colors.text + '20',
                            }
                        ]}>

                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - TEMA CLARO CON FUENTES
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DISENO.colors.fondo,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    // ✅ GRADIENTE SOLO EN EL HEADER
    headerGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        height: '19%',
        shadowColor: DISENO.colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: DISENO.colors.fondo,
    },
    // ✅ ERROR CON FUENTE REGULAR
    errorText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.text,
        fontSize: 18,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: DISENO.colors.accentSecondary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    // ✅ BOTÓN VOLVER CON SIMPSONFONT
    backButtonText: {
        fontFamily: FUENTES.display,
        color: DISENO.colors.text,
        fontWeight: '400',
        fontSize: 16,
    },
    scroll: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backHeaderButton: {
        padding: 4,
    },
    // ✅ HEADER TITLE CON SIMPSONFONT
    headerTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        letterSpacing: 0.5,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        overflow: 'hidden',
        borderWidth: 2,
        position: 'relative',
        backgroundColor: DISENO.colors.surfaceHover,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLoading: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DISENO.colors.surface + '80',
        zIndex: 1,
    },
    imageError: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DISENO.colors.surface + '90',
        zIndex: 1,
    },
    // ✅ ERROR IMAGEN CON FUENTE REGULAR
    imageErrorText: {
        fontFamily: FUENTES.regular,
        marginTop: 8,
        opacity: 0.6,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ PLACEHOLDER CON FUENTE REGULAR
    placeholderText: {
        fontFamily: FUENTES.regular,
        marginTop: 8,
        opacity: 0.5,
    },
    emojiLarge: {},
    descuentoBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    // ✅ DESCUENTO CON SIMPSONFONT
    descuentoBadgeText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    // ✅ TÍTULO OFERTA CON SIMPSONFONT
    ofertaTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginTop: 16,
        letterSpacing: 0.3,
    },
    // ✅ DESCRIPCIÓN CON FUENTE REGULAR
    ofertaDesc: {
        fontFamily: FUENTES.regular,
        marginTop: 8,
        lineHeight: 22,
        opacity: 0.8,
    },
    preciosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingVertical: 16,
        backgroundColor: DISENO.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        shadowColor: DISENO.colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    precioOriginalContainer: {
        alignItems: 'center',
    },
    // ✅ LABEL CON FUENTE REGULAR
    precioOriginalLabel: {
        fontFamily: FUENTES.regular,
        opacity: 0.6,
    },
    // ✅ PRECIO ORIGINAL CON FUENTE REGULAR
    precioOriginal: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        textDecorationLine: 'line-through',
        opacity: 0.5,
        marginTop: 4,
    },
    precioOfertaContainer: {
        alignItems: 'center',
    },
    // ✅ LABEL CON FUENTE REGULAR
    precioOfertaLabel: {
        fontFamily: FUENTES.regular,
        opacity: 0.6,
    },
    // ✅ PRECIO OFERTA CON SIMPSONFONT
    precioOferta: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginTop: 4,
        fontSize: 8,
    },
    ahorroContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 16,
        borderWidth: 1,
    },
    // ✅ AHORRO CON SIMPSONFONT
    ahorroTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 8,
    },
    fechasContainer: {
        marginTop: 16,
        alignItems: 'center',
        gap: 4,
    },
    // ✅ FECHA CON FUENTE REGULAR
    fechaTexto: {
        fontFamily: FUENTES.regular,
        opacity: 0.7,
    },
    footer: {
        position: 'absolute',
        fontSize: 10,
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        shadowColor: DISENO.colors.cardShadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
    },
    addButton: {
        overflow: 'hidden',
        elevation: 8,
        shadowColor: DISENO.colors.accentSecondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    // ✅ BOTÓN AGREGAR CON SIMPSONFONT
    addButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        letterSpacing: 0.5,
        fontSize: 7,
    },
    priceButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    // ✅ PRECIO EN BOTÓN CON SIMPSONFONT
    priceButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
    },
});