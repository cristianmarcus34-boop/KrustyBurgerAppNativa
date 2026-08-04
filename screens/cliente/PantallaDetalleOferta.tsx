// screens/cliente/PantallaDetalleOferta.tsx
import React, { useEffect, useRef, useState } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

// ✅ PALETA DE COLORES
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

// ✅ FUNCIÓN PARA FORMATEAR PRECIOS DE FORMA SEGURA
const formatearPrecio = (precio: string | number | undefined): string => {
    if (precio === undefined || precio === null) return '0.00';
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(numero)) return '0.00';
    return numero.toFixed(2);
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
            <View style={estilos.centrado}>
                <Text style={estilos.errorTexto}>Oferta no encontrada</Text>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                >
                    <Text style={estilos.botonVolverTexto}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;
    const colorOferta = getColorPorId(oferta.id);

    // ✅ Calcular ahorro
    const calcularAhorro = () => {
        const original = typeof oferta.precio_original === 'string'
            ? parseFloat(oferta.precio_original)
            : oferta.precio_original;
        const ofertaPrecio = typeof oferta.precio_oferta === 'string'
            ? parseFloat(oferta.precio_oferta)
            : oferta.precio_oferta;

        if (original && ofertaPrecio && !isNaN(original) && !isNaN(ofertaPrecio)) {
            return (original - ofertaPrecio).toFixed(2);
        }
        return '0.00';
    };

    const agregarAlCarrito = () => {
        console.log('🛒 [DetalleOferta] Agregando al carrito:', oferta.titulo);

        // ✅ Convertir oferta a producto para agregar al carrito
        const producto = {
            id: oferta.id,
            nombre: oferta.titulo,
            descripcion: oferta.descripcion || 'Oferta especial',
            precio: typeof oferta.precio_oferta === 'string'
                ? parseFloat(oferta.precio_oferta)
                : oferta.precio_oferta || 0,
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

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingBottom: insets.bottom + 120,
                    }
                ]}
            >
                {/* ✅ HEADER */}
                <View style={[
                    estilos.header,
                    {
                        paddingTop: insets.top + (isTablet ? 20 : 10),
                        paddingHorizontal: isTablet ? 40 : isSmallPhone ? 16 : 20,
                        paddingBottom: isTablet ? 16 : 12,
                    }
                ]}>
                    <TouchableOpacity
                        style={estilos.botonVolverHeader}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                    </TouchableOpacity>
                    <Text style={[estilos.titulo, { fontSize: isTablet ? 24 : isSmallPhone ? 18 : 20 }]}>
                        Oferta Especial
                    </Text>
                    <View style={{ width: isTablet ? 28 : 24 }} />
                </View>

                {/* ✅ CONTENIDO DE LA OFERTA */}
                <Animated.View style={[
                    estilos.contenido,
                    {
                        paddingHorizontal: isTablet ? 40 : isSmallPhone ? 16 : 20,
                        paddingTop: isTablet ? 24 : 16,
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    {/* ✅ IMAGEN CON LOADING Y ERROR */}
                    <View style={[
                        estilos.imagenContenedor,
                        {
                            height: isTablet ? 300 : isSmallPhone ? 180 : 220,
                            borderRadius: isTablet ? 20 : isSmallPhone ? 12 : 16,
                            backgroundColor: colorOferta + '20',
                            borderColor: colorOferta + '30',
                        }
                    ]}>
                        {oferta.imagen ? (
                            <>
                                {imagenCargando && (
                                    <View style={estilos.loadingImagen}>
                                        <ActivityIndicator size="large" color={COLORS.amarillo} />
                                    </View>
                                )}
                                <Image
                                    source={{ uri: oferta.imagen }}
                                    style={[
                                        estilos.imagen,
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
                                        console.log('URL que falló:', oferta.imagen);
                                        setImagenCargando(false);
                                        setImagenError(true);
                                    }}
                                />
                                {imagenError && (
                                    <View style={estilos.errorImagen}>
                                        <Ionicons name="image-outline" size={isTablet ? 60 : isSmallPhone ? 40 : 50} color={COLORS.grisClaro + '40'} />
                                        <Text style={[estilos.errorImagenTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                                            Error al cargar imagen
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={estilos.placeholderImagen}>
                                <Text style={[estilos.emojiGrande, { fontSize: isTablet ? 80 : isSmallPhone ? 50 : 60 }]}>
                                    🏷️
                                </Text>
                                <Text style={[estilos.placeholderTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                                    Sin imagen disponible
                                </Text>
                            </View>
                        )}
                        <View style={[
                            estilos.descuentoBadge,
                            {
                                paddingHorizontal: isTablet ? 18 : isSmallPhone ? 10 : 14,
                                paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                backgroundColor: colorOferta,
                            }
                        ]}>
                            <Text style={[estilos.descuentoBadgeTexto, { fontSize: isTablet ? 18 : isSmallPhone ? 12 : 14 }]}>
                                🔥 {oferta.descuento}
                            </Text>
                        </View>
                    </View>

                    {/* ✅ Título y descripción */}
                    <Text style={[estilos.ofertaTitulo, {
                        fontSize: isTablet ? 32 : isSmallPhone ? 22 : 26,
                        color: colorOferta,
                    }]}>
                        {oferta.titulo}
                    </Text>

                    <Text style={[estilos.ofertaDesc, {
                        fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16,
                    }]}>
                        {oferta.descripcion || 'Oferta especial de Krusty Burger. ¡No te lo pierdas!'}
                    </Text>

                    {/* ✅ Precios con formateo seguro */}
                    <View style={estilos.preciosContainer}>
                        <View style={estilos.precioOriginalContainer}>
                            <Text style={[estilos.precioOriginalLabel, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                                Precio original
                            </Text>
                            <Text style={[estilos.precioOriginal, { fontSize: isTablet ? 22 : isSmallPhone ? 16 : 18 }]}>
                                ${formatearPrecio(oferta.precio_original)}
                            </Text>
                        </View>
                        <View style={estilos.precioOfertaContainer}>
                            <Text style={[estilos.precioOfertaLabel, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                                Precio oferta
                            </Text>
                            <Text style={[estilos.precioOferta, {
                                fontSize: isTablet ? 38 : isSmallPhone ? 26 : 32,
                                color: colorOferta,
                            }]}>
                                ${formatearPrecio(oferta.precio_oferta)}
                            </Text>
                        </View>
                    </View>

                    {/* ✅ Ahorro */}
                    <View style={[
                        estilos.ahorroContainer,
                        {
                            backgroundColor: colorOferta + '15',
                            borderColor: colorOferta + '30',
                            padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                            borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                        }
                    ]}>
                        <Ionicons name="cash" size={isTablet ? 28 : isSmallPhone ? 18 : 22} color={colorOferta} />
                        <Text style={[estilos.ahorroTexto, {
                            fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                            color: colorOferta,
                        }]}>
                            ¡Ahorra ${calcularAhorro()}!
                        </Text>
                    </View>

                    {/* ✅ Fechas */}
                    {(oferta.fecha_inicio || oferta.fecha_fin) && (
                        <View style={estilos.fechasContainer}>
                            {oferta.fecha_inicio && (
                                <Text style={[estilos.fechaTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                    📅 Inicio: {new Date(oferta.fecha_inicio).toLocaleDateString('es-AR')}
                                </Text>
                            )}
                            {oferta.fecha_fin && (
                                <Text style={[estilos.fechaTexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                    📅 Fin: {new Date(oferta.fecha_fin).toLocaleDateString('es-AR')}
                                </Text>
                            )}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* ✅ BOTÓN AGREGAR AL CARRITO (FIXED) */}
            <Animated.View style={[
                estilos.footer,
                {
                    paddingHorizontal: isTablet ? 40 : isSmallPhone ? 16 : 20,
                    paddingBottom: insets.bottom + (isTablet ? 24 : 16),
                    paddingTop: isTablet ? 16 : 12,
                    opacity: fadeAnim,
                }
            ]}>
                <TouchableOpacity
                    style={[estilos.botonAgregar, { borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 14 }]}
                    onPress={agregarAlCarrito}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                        style={estilos.botonAgregarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="cart" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={COLORS.negro} />
                        <Text style={[estilos.botonAgregarTexto, { fontSize: isTablet ? 20 : isSmallPhone ? 15 : 17 }]}>
                            Agregar al carrito
                        </Text>
                        <View style={[estilos.precioBoton, { borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8 }]}>
                            <Text style={[estilos.precioBotonTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                                ${formatearPrecio(oferta.precio_oferta)}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: COLORS.negro,
    },
    fondoGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: COLORS.negro,
    },
    errorTexto: {
        color: COLORS.blanco,
        fontSize: 18,
        textAlign: 'center',
    },
    botonVolver: {
        marginTop: 20,
        backgroundColor: COLORS.amarillo,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    botonVolverTexto: {
        color: COLORS.negro,
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
        borderBottomColor: COLORS.blanco + '10',
    },
    botonVolverHeader: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    contenido: {
        flex: 1,
    },
    imagenContenedor: {
        width: '100%',
        overflow: 'hidden',
        borderWidth: 2,
        position: 'relative',
    },
    imagen: {
        width: '100%',
        height: '100%',
    },
    loadingImagen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1,
    },
    errorImagen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
    },
    errorImagenTexto: {
        color: COLORS.grisClaro,
        marginTop: 8,
        opacity: 0.6,
    },
    placeholderImagen: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderTexto: {
        color: COLORS.grisClaro,
        opacity: 0.5,
        marginTop: 8,
    },
    emojiGrande: {
        // Tamaño dinámico
    },
    descuentoBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    descuentoBadgeTexto: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    ofertaTitulo: {
        fontWeight: 'bold',
        marginTop: 16,
        letterSpacing: 0.5,
    },
    ofertaDesc: {
        color: COLORS.grisClaro,
        marginTop: 8,
        lineHeight: 24,
        opacity: 0.8,
    },
    preciosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.negro + '30',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.blanco + '8',
    },
    precioOriginalContainer: {
        alignItems: 'center',
    },
    precioOriginalLabel: {
        color: COLORS.grisClaro,
        opacity: 0.6,
    },
    precioOriginal: {
        fontWeight: 'bold',
        color: COLORS.grisClaro,
        textDecorationLine: 'line-through',
        opacity: 0.5,
        marginTop: 4,
    },
    precioOfertaContainer: {
        alignItems: 'center',
    },
    precioOfertaLabel: {
        color: COLORS.blanco,
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
        color: COLORS.grisClaro,
        opacity: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.negro + '80',
        borderTopWidth: 1,
        borderTopColor: COLORS.blanco + '8',
    },
    botonAgregar: {
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.amarillo,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    botonAgregarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    botonAgregarTexto: {
        color: COLORS.negro,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    precioBoton: {
        backgroundColor: COLORS.negro + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    precioBotonTexto: {
        color: COLORS.negro,
        fontWeight: '700',
    },
});