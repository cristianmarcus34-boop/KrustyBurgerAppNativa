// screens/cliente/PantallaDetalleOferta.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
    Alert,
    ActivityIndicator,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Colores } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        card: '#FFFFFF',
        cardShadow: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.06)',
        borderLight: 'rgba(0,0,0,0.04)',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        accent: '#E53935',
        accentLight: '#FF6B6B',
        accentSecondary: '#F5C518',
        accentSecondaryLight: '#FFE135',
        gradientStart: '#E53935',
        gradientEnd: '#F5C518',
        verde: '#43A047',
        verdeClaro: '#66BB6A',
        rosa: '#EC407A',
        azul: '#1A237E',
        azulClaro: '#3949AB',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 999,
    },
};

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

// ✅ FUNCIÓN PARA OBTENER COLOR POR ID
const getColorPorId = (id: number) => {
    const colores = [
        '#FF5722', '#4CAF50', '#2196F3', '#9C27B0',
        '#FF9800', '#E91E63', '#00BCD4', '#8BC34A',
        '#FF6F00', '#2E7D32', '#00695C', '#4A148C'
    ];
    return colores[id % colores.length];
};

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

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;
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
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
    const imagenHeight = isTablet ? 400 : isSmallPhone ? 220 : 280;
    const imagenRadius = isTablet ? 24 : isSmallPhone ? 14 : 18;
    const tituloSize = isTablet ? 32 : isSmallPhone ? 22 : 26;
    const descSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const precioOfertaSize = isTablet ? 38 : isSmallPhone ? 26 : 32;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingBottom: insets.bottom + 120,
                    }
                ]}
            >
                {/* ✅ HEADER */}
                <View style={[
                    styles.header,
                    {
                        paddingTop: insets.top + (isTablet ? 20 : 10),
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: isTablet ? 16 : 12,
                    }
                ]}>
                    <TouchableOpacity
                        style={styles.backHeaderButton}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontSize: isTablet ? 24 : isSmallPhone ? 18 : 20, color: DESIGN.colors.surface }]}>
                        Oferta Especial
                    </Text>
                    <View style={{ width: isTablet ? 28 : 24 }} />
                </View>

                {/* ✅ CONTENIDO DE LA OFERTA */}
                <Animated.View style={[
                    styles.content,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingTop: isTablet ? 24 : 16,
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
                                        <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
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
                                        <Ionicons name="image-outline" size={isTablet ? 60 : isSmallPhone ? 40 : 50} color={DESIGN.colors.textTertiary + '40'} />
                                        <Text style={[styles.imageErrorText, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14, color: DESIGN.colors.textSecondary }]}>
                                            Error al cargar imagen
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={[styles.emojiLarge, { fontSize: isTablet ? 80 : isSmallPhone ? 50 : 60 }]}>
                                    🏷️
                                </Text>
                                <Text style={[styles.placeholderText, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14, color: DESIGN.colors.textSecondary }]}>
                                    Sin imagen disponible
                                </Text>
                            </View>
                        )}
                        <View style={[
                            styles.descuentoBadge,
                            {
                                paddingHorizontal: isTablet ? 18 : isSmallPhone ? 10 : 14,
                                paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                backgroundColor: colorOferta,
                            }
                        ]}>
                            <Text style={[styles.descuentoBadgeText, { fontSize: isTablet ? 18 : isSmallPhone ? 12 : 14, color: DESIGN.colors.surface }]}>
                                🔥 {oferta.descuento}
                            </Text>
                        </View>
                    </View>

                    {/* ✅ Título y descripción */}
                    <Text style={[styles.ofertaTitulo, {
                        fontSize: tituloSize,
                        color: colorOferta,
                    }]}>
                        {oferta.titulo}
                    </Text>

                    <Text style={[styles.ofertaDesc, {
                        fontSize: descSize,
                        color: DESIGN.colors.textSecondary,
                    }]}>
                        {oferta.descripcion || 'Oferta especial de Krusty Burger. ¡No te lo pierdas!'}
                    </Text>

                    {/* ✅ Precios */}
                    <View style={styles.preciosContainer}>
                        <View style={styles.precioOriginalContainer}>
                            <Text style={[styles.precioOriginalLabel, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14, color: DESIGN.colors.textSecondary }]}>
                                Precio original
                            </Text>
                            <Text style={[styles.precioOriginal, { fontSize: isTablet ? 22 : isSmallPhone ? 16 : 18, color: DESIGN.colors.textTertiary }]}>
                                {formatearPrecio(oferta.precio_original)}
                            </Text>
                        </View>
                        <View style={styles.precioOfertaContainer}>
                            <Text style={[styles.precioOfertaLabel, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14, color: DESIGN.colors.textSecondary }]}>
                                Precio oferta
                            </Text>
                            <Text style={[styles.precioOferta, {
                                fontSize: precioOfertaSize,
                                color: colorOferta,
                            }]}>
                                {formatearPrecio(oferta.precio_oferta)}
                            </Text>
                        </View>
                    </View>

                    {/* ✅ Ahorro */}
                    {ahorro > 0 && (
                        <View style={[
                            styles.ahorroContainer,
                            {
                                backgroundColor: colorOferta + '15',
                                borderColor: colorOferta + '30',
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                            }
                        ]}>
                            <Ionicons name="cash" size={isTablet ? 28 : isSmallPhone ? 18 : 22} color={colorOferta} />
                            <Text style={[styles.ahorroTexto, {
                                fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                color: colorOferta,
                            }]}>
                                ¡Ahorra {formatearPrecio(ahorro)}!
                            </Text>
                        </View>
                    )}

                    {/* ✅ Fechas */}
                    {(oferta.fecha_inicio || oferta.fecha_fin) && (
                        <View style={styles.fechasContainer}>
                            {oferta.fecha_inicio && (
                                <Text style={[styles.fechaTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                                    📅 Inicio: {new Date(oferta.fecha_inicio).toLocaleDateString('es-AR')}
                                </Text>
                            )}
                            {oferta.fecha_fin && (
                                <Text style={[styles.fechaTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
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
                    paddingBottom: insets.bottom + (isTablet ? 24 : 16),
                    paddingTop: isTablet ? 16 : 12,
                    opacity: fadeAnim,
                    backgroundColor: DESIGN.colors.surface + '90',
                    borderTopColor: DESIGN.colors.border,
                }
            ]}>
                <TouchableOpacity
                    style={[styles.addButton, { borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 14 }]}
                    onPress={agregarAlCarrito}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accentSecondaryLight]}
                        style={styles.addButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="cart" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={DESIGN.colors.text} />
                        <Text style={[styles.addButtonText, { fontSize: isTablet ? 20 : isSmallPhone ? 15 : 17, color: DESIGN.colors.text }]}>
                            Agregar al carrito
                        </Text>
                        <View style={[styles.priceButton, { borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8, backgroundColor: DESIGN.colors.text + '20' }]}>
                            <Text style={[styles.priceButtonText, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14, color: DESIGN.colors.text }]}>
                                {formatearPrecio(oferta.precio_oferta)}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: DESIGN.colors.fondo,
    },
    errorText: {
        color: DESIGN.colors.text,
        fontSize: 18,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: DESIGN.colors.accentSecondary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: DESIGN.colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    scroll: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.surface + '10',
    },
    backHeaderButton: {
        padding: 4,
    },
    headerTitle: {
        fontWeight: 'bold',
        letterSpacing: 1,
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
        backgroundColor: DESIGN.colors.surfaceHover,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DESIGN.colors.surface + '80',
        zIndex: 1,
    },
    imageError: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: DESIGN.colors.surface + '90',
        zIndex: 1,
    },
    imageErrorText: {
        marginTop: 8,
        opacity: 0.6,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        opacity: 0.5,
    },
    emojiLarge: {},
    descuentoBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    descuentoBadgeText: {
        fontWeight: 'bold',
    },
    ofertaTitulo: {
        fontWeight: 'bold',
        marginTop: 16,
        letterSpacing: 0.5,
    },
    ofertaDesc: {
        marginTop: 8,
        lineHeight: 24,
        opacity: 0.8,
    },
    preciosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingVertical: 16,
        backgroundColor: DESIGN.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
        shadowColor: DESIGN.colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    precioOriginalContainer: {
        alignItems: 'center',
    },
    precioOriginalLabel: {
        opacity: 0.6,
    },
    precioOriginal: {
        fontWeight: 'bold',
        textDecorationLine: 'line-through',
        opacity: 0.5,
        marginTop: 4,
    },
    precioOfertaContainer: {
        alignItems: 'center',
    },
    precioOfertaLabel: {
        opacity: 0.6,
    },
    precioOferta: {
        fontWeight: 'bold',
        marginTop: 4,
    },
    ahorroContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 16,
        borderWidth: 1,
    },
    ahorroTexto: {
        fontWeight: 'bold',
    },
    fechasContainer: {
        marginTop: 16,
        alignItems: 'center',
        gap: 4,
    },
    fechaTexto: {
        opacity: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        shadowColor: DESIGN.colors.cardShadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
    },
    addButton: {
        overflow: 'hidden',
        elevation: 8,
        shadowColor: DESIGN.colors.accentSecondary,
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
    addButtonText: {
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    priceButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    priceButtonText: {
        fontWeight: '700',
    },
});