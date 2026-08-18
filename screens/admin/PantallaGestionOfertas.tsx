// screens/admin/PantallaGestionOfertas.tsx - ESTILO BLANCO Y ELEGANTE
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Dimensions,
    Animated,
    RefreshControl,
    Switch,
    Image,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Colores, getTematica } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - BLANCO Y ELEGANTE
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        card: '#FFFFFF',
        cardShadow: 'rgba(0,0,0,0.06)',
        cardShadowHeavy: 'rgba(0,0,0,0.08)',
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
        platino: '#78909C',
        oro: '#F9A825',
        plata: '#BDBDBD',
        bronce: '#A1887F',
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

const { width, height } = Dimensions.get('window');

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
// 📋 INTERFAZ
// ============================================================
interface Oferta {
    id: number;
    titulo: string;
    descripcion: string;
    descuento: string;
    precio_original: number | string;
    precio_oferta: number | string;
    activa: boolean;
    imagen?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    created_at?: string;
}

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaGestionOfertas(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();

    // ============================================================
    // 📦 ESTADOS
    // ============================================================
    const [ofertas, setOfertas] = useState<Oferta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalKey, setModalKey] = useState(0);
    const [ofertaEditando, setOfertaEditando] = useState<Oferta | null>(null);

    // ✅ Estados del formulario
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [descuento, setDescuento] = useState('');
    const [precioOriginal, setPrecioOriginal] = useState('');
    const [precioOferta, setPrecioOferta] = useState('');
    const [activa, setActiva] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [imagen, setImagen] = useState('');
    const [imagenUri, setImagenUri] = useState<string | null>(null);
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [imagenCargando, setImagenCargando] = useState(false);
    const [imagenTimestamp, setImagenTimestamp] = useState(0);

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        cargarOfertas();
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

        if (Platform.OS !== 'web') {
            ImagePicker.requestMediaLibraryPermissionsAsync();
        }
    }, []);

    // ============================================================
    // 🔄 FUNCIONES CRUD
    // ============================================================
    const cargarOfertas = async () => {
        try {
            const { data, error } = await supabase
                .from('ofertas')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('❌ Error cargando ofertas:', error);
                setOfertas([]);
            } else {
                setOfertas(data as Oferta[] || []);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setOfertas([]);
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const manejarRefresh = useCallback(() => {
        setRefrescando(true);
        cargarOfertas();
    }, []);

    // ============================================================
    // 📷 SUBIR IMAGEN
    // ============================================================
    const subirImagen = async (file: File) => {
        if (!file) return;

        setSubiendoImagen(true);
        setImagenCargando(true);

        try {
            const nombreArchivo = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

            const { error } = await supabase.storage
                .from('ofertas_imagenes')
                .upload(nombreArchivo, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type || 'image/jpeg',
                });

            if (error) {
                console.error('❌ Error subiendo imagen:', error);
                setSubiendoImagen(false);
                setImagenCargando(false);
                Alert.alert('Error', 'No se pudo subir la imagen: ' + error.message);
                return;
            }

            const { data: urlData } = supabase.storage
                .from('ofertas_imagenes')
                .getPublicUrl(nombreArchivo);

            const nuevaUrl = urlData.publicUrl;
            setImagen(nuevaUrl);
            setImagenUri(nuevaUrl);
            setImagenTimestamp(Date.now());
            setImagenCargando(false);
            setSubiendoImagen(false);
            setModalKey(prev => prev + 1);

            Alert.alert('✅ Éxito', 'Imagen subida correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo subir la imagen');
            setImagenCargando(false);
            setSubiendoImagen(false);
        }
    };

    // ============================================================
    // 📷 SELECCIONAR IMAGEN
    // ============================================================
    const seleccionarImagen = async () => {
        try {
            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setImagenUri(base64);
                        setImagen(base64);
                        setImagenTimestamp(Date.now());
                    };
                    reader.readAsDataURL(file);

                    try {
                        await subirImagen(file);
                    } catch (error) {
                        console.log('⚠️ No se pudo subir a Supabase');
                    }
                };
                input.click();
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                let uriParaPreview = asset.uri;
                if (asset.base64) {
                    uriParaPreview = `data:image/jpeg;base64,${asset.base64}`;
                }

                setImagenUri(uriParaPreview);
                setImagen(uriParaPreview);
                setImagenTimestamp(Date.now());

                if (asset.uri) {
                    try {
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        const fileType = asset.mimeType || 'image/jpeg';
                        const extension = fileType.split('/')[1] || 'jpg';
                        const file = new File([blob], `oferta_${Date.now()}.${extension}`, { type: fileType });
                        await subirImagen(file);
                    } catch (error) {
                        console.log('⚠️ No se pudo subir a Supabase, usando vista previa local');
                        setImagenCargando(false);
                        setSubiendoImagen(false);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error seleccionando imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    // ============================================================
    // 📝 FORMULARIO
    // ============================================================
    const abrirFormulario = (oferta?: Oferta) => {
        setTitulo('');
        setDescripcion('');
        setDescuento('');
        setPrecioOriginal('');
        setPrecioOferta('');
        setActiva(true);
        setFechaInicio('');
        setFechaFin('');
        setImagen('');
        setImagenUri(null);
        setImagenCargando(false);
        setSubiendoImagen(false);

        if (oferta) {
            setOfertaEditando(oferta);
            setTimeout(() => {
                setTitulo(oferta.titulo);
                setDescripcion(oferta.descripcion || '');
                setDescuento(oferta.descuento || '');
                setPrecioOriginal(String(oferta.precio_original || 0));
                setPrecioOferta(String(oferta.precio_oferta || 0));
                setActiva(oferta.activa !== undefined ? oferta.activa : true);
                setFechaInicio(oferta.fecha_inicio ? oferta.fecha_inicio.split('T')[0] : '');
                setFechaFin(oferta.fecha_fin ? oferta.fecha_fin.split('T')[0] : '');
                setImagen(oferta.imagen || '');
                setImagenUri(oferta.imagen || null);
                setImagenTimestamp(Date.now());
                setModalKey(prev => prev + 1);
                setModalVisible(true);
            }, 100);
        } else {
            setOfertaEditando(null);
            setModalKey(prev => prev + 1);
            setModalVisible(true);
        }
    };

    // ============================================================
    // 💾 GUARDAR OFERTA
    // ============================================================
    const guardarOferta = async () => {
        if (!titulo || !descuento || !precioOriginal || !precioOferta) {
            Alert.alert('Error', 'Completa todos los campos obligatorios');
            return;
        }

        const urlImagenFinal = imagenUri || imagen || null;

        const datos = {
            titulo,
            descripcion,
            descuento,
            precio_original: Number(precioOriginal),
            precio_oferta: Number(precioOferta),
            activa,
            fecha_inicio: fechaInicio || null,
            fecha_fin: fechaFin || null,
            imagen: urlImagenFinal,
        };

        try {
            if (ofertaEditando) {
                const { error } = await supabase
                    .from('ofertas')
                    .update(datos)
                    .eq('id', ofertaEditando.id);
                if (error) {
                    Alert.alert('Error', 'No se pudo actualizar la oferta: ' + error.message);
                    return;
                }
                Alert.alert('Éxito', 'Oferta actualizada correctamente');
            } else {
                const { error } = await supabase
                    .from('ofertas')
                    .insert(datos);
                if (error) {
                    Alert.alert('Error', 'No se pudo crear la oferta: ' + error.message);
                    return;
                }
                Alert.alert('Éxito', 'Oferta creada correctamente');
            }

            setModalVisible(false);
            setTimeout(() => {
                setImagen('');
                setImagenUri(null);
                setImagenCargando(false);
                setSubiendoImagen(false);
                cargarOfertas();
            }, 300);
        } catch (error) {
            console.error('❌ Error guardando oferta:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar la oferta');
        }
    };

    // ============================================================
    // 🗑️ ELIMINAR OFERTA
    // ============================================================
    const eliminarOferta = (id: number, titulo: string) => {
        Alert.alert(
            'Eliminar oferta',
            `¿Estás seguro de eliminar "${titulo}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('ofertas')
                            .delete()
                            .eq('id', id);
                        if (error) {
                            Alert.alert('Error', 'No se pudo eliminar la oferta');
                            return;
                        }
                        cargarOfertas();
                        Alert.alert('Éxito', 'Oferta eliminada correctamente');
                    }
                }
            ]
        );
    };

    // ============================================================
    // 🔄 TOGGLE ACTIVA
    // ============================================================
    const toggleActiva = async (id: number, estadoActual: boolean) => {
        const nuevoEstado = !estadoActual;
        const { error } = await supabase
            .from('ofertas')
            .update({ activa: nuevoEstado })
            .eq('id', id);
        if (!error) {
            cargarOfertas();
        } else {
            console.error('❌ Error cambiando estado:', error);
        }
    };

    // ============================================================
    // ❌ CERRAR MODAL
    // ============================================================
    const cerrarModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setTitulo('');
            setDescripcion('');
            setDescuento('');
            setPrecioOriginal('');
            setPrecioOferta('');
            setActiva(true);
            setFechaInicio('');
            setFechaFin('');
            setImagen('');
            setImagenUri(null);
            setImagenCargando(false);
            setSubiendoImagen(false);
            setOfertaEditando(null);
        }, 300);
    };

    // ============================================================
    // 📐 RESPONSIVE
    // ============================================================
    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const tarjetaPadding = isTablet ? 16 : isSmallPhone ? 10 : 12;
    const modalWidth = isTablet ? '70%' : '92%';

    const formatFecha = (fecha: string) => {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const obtenerUrlImagen = () => {
        if (imagenUri) return imagenUri;
        if (imagen) return imagen;
        return null;
    };

    const urlImagenPreview = obtenerUrlImagen();

    // ============================================================
    // 🖼️ RENDER DE OFERTA
    // ============================================================
    const renderOferta = ({ item, index }: { item: Oferta; index: number }) => {
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });
        const itemSlide = slideUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 * (index + 1), 0],
        });

        const imagenAltura = isTablet ? 180 : isSmallPhone ? 120 : 150;

        return (
            <Animated.View
                style={{
                    opacity: itemFade,
                    transform: [{ translateY: itemSlide }],
                }}
            >
                <View style={[
                    estilos.tarjeta,
                    {
                        padding: tarjetaPadding,
                        borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
                        borderColor: item.activa ? DESIGN.colors.verde + '30' : DESIGN.colors.border,
                        backgroundColor: DESIGN.colors.surface,
                    }
                ]}>
                    {/* IMAGEN */}
                    {item.imagen && (
                        <View style={estilos.tarjetaImagenContainer}>
                            <Image
                                key={item.id + '_' + item.imagen}
                                source={{ uri: item.imagen }}
                                style={[
                                    estilos.tarjetaImagen,
                                    {
                                        height: imagenAltura,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    }
                                ]}
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    {/* HEADER */}
                    <View style={estilos.tarjetaHeader}>
                        <View style={estilos.tarjetaInfo}>
                            <Text style={[estilos.tarjetaTitulo, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                                {item.titulo}
                            </Text>
                            <Text style={[estilos.tarjetaDescuento, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                🔥 {item.descuento}
                            </Text>
                        </View>
                        <View style={estilos.tarjetaAcciones}>
                            <Switch
                                value={item.activa}
                                onValueChange={() => toggleActiva(item.id, item.activa)}
                                trackColor={{ false: DESIGN.colors.border, true: DESIGN.colors.verde }}
                                thumbColor={item.activa ? DESIGN.colors.surface : DESIGN.colors.surface}
                            />
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: DESIGN.colors.accentSecondary + '15',
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                }]}
                                onPress={() => abrirFormulario(item)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.accentSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: DESIGN.colors.accent + '15',
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                }]}
                                onPress={() => eliminarOferta(item.id, item.titulo)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.accent} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* DETALLES */}
                    <View style={estilos.tarjetaDetalles}>
                        <Text style={[estilos.tarjetaDesc, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            {item.descripcion || 'Sin descripción'}
                        </Text>
                        <View style={estilos.tarjetaPrecios}>
                            <Text style={[estilos.tarjetaPrecioOriginal, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                {formatearPrecio(Number(item.precio_original))}
                            </Text>
                            <Text style={[estilos.tarjetaPrecioOferta, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                                {formatearPrecio(Number(item.precio_oferta))}
                            </Text>
                        </View>

                        {(item.fecha_inicio || item.fecha_fin) && (
                            <View style={estilos.tarjetaFechas}>
                                {item.fecha_inicio && (
                                    <Text style={[estilos.tarjetaFecha, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11 }]}>
                                        📅 Inicio: {formatFecha(item.fecha_inicio)}
                                    </Text>
                                )}
                                {item.fecha_fin && (
                                    <Text style={[estilos.tarjetaFecha, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11 }]}>
                                        📅 Fin: {formatFecha(item.fecha_fin)}
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={[
                            estilos.estadoBadge,
                            {
                                backgroundColor: item.activa ? DESIGN.colors.verde + '12' : DESIGN.colors.surfaceHover,
                                paddingHorizontal: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8,
                                alignSelf: 'flex-start',
                                marginTop: 6,
                            }
                        ]}>
                            <Text style={[
                                estilos.estadoBadgeTexto,
                                {
                                    fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                    color: item.activa ? DESIGN.colors.verde : DESIGN.colors.textTertiary,
                                }
                            ]}>
                                {item.activa ? '✅ Activa' : '❌ Inactiva'}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // ============================================================
    // 🏗️ RENDER PRINCIPAL
    // ============================================================
    const conteoActivas = ofertas.filter(o => o.activa).length;

    return (
        <View style={estilos.contenedor}>
            {/* Fondo blanco/crema suave */}
            <View style={estilos.background} />

            {/* HEADER CON GRADIENTE SUTIL */}
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                style={estilos.headerGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[
                    estilos.header,
                    {
                        paddingTop: insets.top + (isTablet ? 20 : 10),
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: isTablet ? 16 : 12,
                    }
                ]}>
                    <TouchableOpacity
                        style={estilos.botonVolver}
                        onPress={() => props.navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                    </TouchableOpacity>

                    <View style={estilos.headerCentro}>
                        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                            🎫 Gestionar Ofertas
                        </Text>
                        <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            {ofertas.length} ofertas · {conteoActivas} activas
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[estilos.botonAgregar, {
                            paddingHorizontal: isTablet ? 18 : isSmallPhone ? 12 : 16,
                            paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10,
                        }]}
                        onPress={() => abrirFormulario()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={isTablet ? 26 : isSmallPhone ? 18 : 22} color={DESIGN.colors.text} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* LISTA */}
            <FlatList
                data={ofertas}
                keyExtractor={item => item.id.toString()}
                renderItem={renderOferta}
                contentContainerStyle={[
                    estilos.lista,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 150,
                        paddingTop: isTablet ? 8 : 4,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={manejarRefresh}
                        tintColor={DESIGN.colors.accent}
                        colors={[DESIGN.colors.accent]}
                    />
                }
                ListEmptyComponent={
                    <View style={estilos.vacioContenedor}>
                        <Ionicons name="pricetag-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.textTertiary} />
                        <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                            No hay ofertas
                        </Text>
                        <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            Crea tu primera oferta presionando el botón +
                        </Text>
                    </View>
                }
            />

            {/* ============================================================
            MODAL - FORMULARIO
            ============================================================ */}
            <Modal
                key={modalKey}
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={estilos.modalFondo}>
                    <View style={estilos.modalBackdrop} />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={estilos.modalKeyboard}
                    >
                        <View style={[
                            estilos.modal,
                            {
                                padding: isTablet ? 32 : isSmallPhone ? 16 : 24,
                                borderRadius: isTablet ? 28 : 24,
                                width: modalWidth,
                                maxHeight: isTablet ? '85%' : '90%',
                                borderColor: DESIGN.colors.border,
                                backgroundColor: DESIGN.colors.surface,
                            }
                        ]}>
                            {/* HEADER DEL MODAL */}
                            <View style={estilos.modalHeader}>
                                <LinearGradient
                                    colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                                    style={estilos.modalHeaderGradiente}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="pricetag" size={isTablet ? 32 : isSmallPhone ? 24 : 28} color={DESIGN.colors.surface} />
                                    <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                                        {ofertaEditando ? '✏️ Editar Oferta' : '➕ Nueva Oferta'}
                                    </Text>
                                </LinearGradient>
                            </View>

                            {/* FORMULARIO */}
                            <ScrollView
                                style={estilos.modalScroll}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            >
                                {/* Título */}
                                <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                    <Ionicons name="pricetag-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Título *
                                </Text>
                                <TextInput
                                    style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                    value={titulo}
                                    onChangeText={setTitulo}
                                    placeholder="Ej: 2x1 en Hamburguesas"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    selectionColor={DESIGN.colors.accent}
                                />

                                {/* Descripción */}
                                <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                    <Ionicons name="document-text-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Descripción
                                </Text>
                                <TextInput
                                    style={[estilos.input, estilos.textArea, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                    value={descripcion}
                                    onChangeText={setDescripcion}
                                    placeholder="Descripción de la oferta"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    selectionColor={DESIGN.colors.accent}
                                />

                                {/* Descuento */}
                                <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                    <Ionicons name="flame-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Descuento *
                                </Text>
                                <TextInput
                                    style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                    value={descuento}
                                    onChangeText={setDescuento}
                                    placeholder="Ej: 20% OFF, 2x1"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    selectionColor={DESIGN.colors.accent}
                                />

                                {/* Precios - Fila */}
                                <View style={estilos.filaPrecios}>
                                    <View style={estilos.filaPrecioItem}>
                                        <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                            <Ionicons name="cash-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Original *
                                        </Text>
                                        <TextInput
                                            style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                            value={precioOriginal}
                                            onChangeText={setPrecioOriginal}
                                            placeholder="$"
                                            placeholderTextColor={DESIGN.colors.textTertiary}
                                            keyboardType="numeric"
                                            selectionColor={DESIGN.colors.accent}
                                        />
                                    </View>
                                    <View style={estilos.filaPrecioItem}>
                                        <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                            <Ionicons name="pricetag" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Oferta *
                                        </Text>
                                        <TextInput
                                            style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                            value={precioOferta}
                                            onChangeText={setPrecioOferta}
                                            placeholder="$"
                                            placeholderTextColor={DESIGN.colors.textTertiary}
                                            keyboardType="numeric"
                                            selectionColor={DESIGN.colors.accent}
                                        />
                                    </View>
                                </View>

                                {/* Fechas - Fila */}
                                <View style={estilos.filaFechas}>
                                    <View style={estilos.filaFechaItem}>
                                        <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                            <Ionicons name="calendar-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Inicio
                                        </Text>
                                        <TextInput
                                            style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                            value={fechaInicio}
                                            onChangeText={setFechaInicio}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={DESIGN.colors.textTertiary}
                                            selectionColor={DESIGN.colors.accent}
                                        />
                                    </View>
                                    <View style={estilos.filaFechaItem}>
                                        <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                            <Ionicons name="calendar-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Fin
                                        </Text>
                                        <TextInput
                                            style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                            value={fechaFin}
                                            onChangeText={setFechaFin}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={DESIGN.colors.textTertiary}
                                            selectionColor={DESIGN.colors.accent}
                                        />
                                    </View>
                                </View>

                                {/* IMAGEN */}
                                <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                    <Ionicons name="image-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Imagen (opcional)
                                </Text>

                                <TouchableOpacity
                                    style={[estilos.botonImagen, {
                                        padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        marginBottom: 10,
                                        borderColor: DESIGN.colors.border,
                                        backgroundColor: DESIGN.colors.surfaceHover,
                                    }]}
                                    onPress={seleccionarImagen}
                                    activeOpacity={0.7}
                                    disabled={subiendoImagen}
                                >
                                    {subiendoImagen ? (
                                        <ActivityIndicator size="small" color={DESIGN.colors.accent} />
                                    ) : (
                                        <Ionicons name="images-outline" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={DESIGN.colors.accent} />
                                    )}
                                    <Text style={[estilos.botonImagenTexto, {
                                        fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13,
                                        color: subiendoImagen ? DESIGN.colors.textTertiary : DESIGN.colors.accent,
                                    }]}>
                                        {subiendoImagen ? '⏳ Subiendo...' : '📷 Seleccionar imagen de la galería'}
                                    </Text>
                                </TouchableOpacity>

                                {/* PREVIEW DE IMAGEN */}
                                {urlImagenPreview ? (
                                    <View style={estilos.previaImagen}>
                                        <Image
                                            key={`preview_${imagenTimestamp}`}
                                            source={{ uri: urlImagenPreview }}
                                            style={[estilos.previaFoto, {
                                                height: isTablet ? 280 : isSmallPhone ? 180 : 220,
                                                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                            }]}
                                            resizeMode="cover"
                                            onError={() => setImagenCargando(false)}
                                            onLoad={() => setImagenCargando(false)}
                                            onLoadStart={() => setImagenCargando(true)}
                                            onLoadEnd={() => setImagenCargando(false)}
                                        />
                                        {imagenCargando && (
                                            <View style={estilos.loadingOverlay}>
                                                <ActivityIndicator size="large" color={DESIGN.colors.accent} />
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={[estilos.botonQuitarImagen, {
                                                width: isTablet ? 34 : isSmallPhone ? 24 : 28,
                                                height: isTablet ? 34 : isSmallPhone ? 24 : 28,
                                                borderRadius: isTablet ? 17 : isSmallPhone ? 12 : 14,
                                                backgroundColor: DESIGN.colors.accent + '90',
                                            }]}
                                            onPress={() => {
                                                setImagen('');
                                                setImagenUri(null);
                                                setImagenCargando(false);
                                                setImagenTimestamp(Date.now());
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="close" size={isTablet ? 20 : isSmallPhone ? 14 : 16} color={DESIGN.colors.surface} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={[estilos.sinImagen, {
                                        padding: isTablet ? 30 : isSmallPhone ? 20 : 24,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        height: isTablet ? 280 : isSmallPhone ? 180 : 220,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: DESIGN.colors.surfaceHover,
                                        borderColor: DESIGN.colors.border,
                                    }]}>
                                        <Ionicons name="image-outline" size={isTablet ? 60 : isSmallPhone ? 40 : 48} color={DESIGN.colors.textTertiary} />
                                        <Text style={[estilos.sinImagenTexto, {
                                            fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                            color: DESIGN.colors.textTertiary,
                                        }]}>
                                            Sin imagen seleccionada
                                        </Text>
                                    </View>
                                )}

                                {/* URL manual */}
                                <Text style={[estilos.label, {
                                    fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11,
                                    marginTop: 10,
                                    color: DESIGN.colors.textSecondary,
                                }]}>
                                    O pega la URL manualmente:
                                </Text>
                                <TextInput
                                    style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                    value={imagen}
                                    onChangeText={(text) => {
                                        setImagen(text);
                                        setImagenUri(text);
                                        setImagenTimestamp(Date.now());
                                    }}
                                    placeholder="https://ejemplo.com/oferta.jpg"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    autoCapitalize="none"
                                    selectionColor={DESIGN.colors.accent}
                                />

                                {/* SWITCH ACTIVA */}
                                <View style={estilos.switchContainer}>
                                    <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginBottom: 0 }]}>
                                        <Ionicons name="checkmark-circle-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={DESIGN.colors.accent} /> Activa
                                    </Text>
                                    <Switch
                                        value={activa}
                                        onValueChange={setActiva}
                                        trackColor={{ false: DESIGN.colors.border, true: DESIGN.colors.verde }}
                                        thumbColor={activa ? DESIGN.colors.surface : DESIGN.colors.surface}
                                    />
                                </View>
                            </ScrollView>

                            {/* BOTONES */}
                            <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12, marginTop: 16 }]}>
                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalCancelar, {
                                        paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        borderColor: DESIGN.colors.border,
                                        backgroundColor: DESIGN.colors.surfaceHover,
                                    }]}
                                    onPress={cerrarModal}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.textSecondary} />
                                    <Text style={[estilos.modalCancelarTexto, {
                                        fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                                        color: DESIGN.colors.textSecondary,
                                    }]}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[estilos.modalBoton, estilos.modalGuardar, {
                                        paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        overflow: 'hidden',
                                    }]}
                                    onPress={guardarOferta}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
                                        style={estilos.modalGuardarGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="save" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={DESIGN.colors.surface} />
                                        <Text style={[estilos.modalGuardarTexto, {
                                            fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                                            color: DESIGN.colors.surface,
                                        }]}>
                                            {ofertaEditando ? 'Actualizar' : 'Crear'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - BLANCOS Y ELEGANTES
// ============================================================
const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: DESIGN.colors.fondo,
    },
    headerGradiente: {
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
        shadowColor: DESIGN.colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCentro: {
        flex: 1,
        alignItems: 'center',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: '700',
        color: DESIGN.colors.surface,
        letterSpacing: -0.3,
    },
    contador: {
        color: DESIGN.colors.surface + '80',
        fontWeight: '400',
        marginTop: 2,
    },
    botonAgregar: {
        backgroundColor: DESIGN.colors.surface,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: DESIGN.colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 4,
    },
    lista: {
        flexGrow: 1,
    },

    // ============================================================
    // TARJETA
    // ============================================================
    tarjeta: {
        marginBottom: 10,
        borderWidth: 1,
        backgroundColor: DESIGN.colors.surface,
        shadowColor: DESIGN.colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    tarjetaImagenContainer: {
        marginBottom: 8,
    },
    tarjetaImagen: {
        width: '100%',
        backgroundColor: DESIGN.colors.surfaceHover,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tarjetaInfo: {
        flex: 1,
    },
    tarjetaTitulo: {
        fontWeight: '600',
        color: DESIGN.colors.text,
    },
    tarjetaDescuento: {
        color: DESIGN.colors.accentSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    tarjetaAcciones: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    botonAccion: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tarjetaDetalles: {
        borderTopWidth: 1,
        borderTopColor: DESIGN.colors.border,
        paddingTop: 8,
    },
    tarjetaDesc: {
        color: DESIGN.colors.textSecondary,
        opacity: 0.7,
        marginBottom: 6,
    },
    tarjetaPrecios: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tarjetaPrecioOriginal: {
        color: DESIGN.colors.textTertiary,
        textDecorationLine: 'line-through',
    },
    tarjetaPrecioOferta: {
        fontWeight: '700',
        color: DESIGN.colors.accent,
    },
    tarjetaFechas: {
        marginTop: 4,
    },
    tarjetaFecha: {
        color: DESIGN.colors.textTertiary,
    },
    estadoBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    estadoBadgeTexto: {
        fontWeight: '500',
    },

    // ============================================================
    // VACÍO
    // ============================================================
    vacioContenedor: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    vacio: {
        color: DESIGN.colors.text,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        color: DESIGN.colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },

    // ============================================================
    // MODAL
    // ============================================================
    modalFondo: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalKeyboard: {
        width: '100%',
        alignItems: 'center',
    },
    modal: {
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: DESIGN.colors.cardShadowHeavy,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 20,
    },
    modalHeader: {
        marginBottom: 16,
    },
    modalHeaderGradiente: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    modalTitulo: {
        fontWeight: '700',
        color: DESIGN.colors.surface,
    },
    modalScroll: {
        maxHeight: '70%',
        paddingHorizontal: 4,
    },
    label: {
        fontWeight: '600',
        color: DESIGN.colors.text,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: DESIGN.colors.surfaceHover,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
        color: DESIGN.colors.text,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    filaPrecios: {
        flexDirection: 'row',
        gap: 12,
    },
    filaPrecioItem: {
        flex: 1,
    },
    filaFechas: {
        flexDirection: 'row',
        gap: 12,
    },
    filaFechaItem: {
        flex: 1,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
    },
    botonImagen: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        gap: 10,
    },
    botonImagenTexto: {
        fontWeight: '600',
    },
    previaImagen: {
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: DESIGN.colors.surfaceHover,
    },
    previaFoto: {
        width: '100%',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    botonQuitarImagen: {
        position: 'absolute',
        top: 8,
        right: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: DESIGN.colors.surface,
    },
    sinImagen: {
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    sinImagenTexto: {
        marginTop: 6,
    },
    modalBotones: {
        flexDirection: 'row',
        marginTop: 8,
    },
    modalBoton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        overflow: 'hidden',
        borderWidth: 1,
    },
    modalCancelar: {
        borderWidth: 1,
    },
    modalCancelarTexto: {
        fontWeight: '600',
    },
    modalGuardar: {
        overflow: 'hidden',
    },
    modalGuardarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: '100%',
        height: '100%',
    },
    modalGuardarTexto: {
        fontWeight: '700',
    },
});