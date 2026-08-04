// screens/admin/PantallaGestionOfertas.tsx
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
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES
// ============================================================
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

const { width, height } = Dimensions.get('window');

// ✅ FUNCIÓN PARA FORMATEAR PRECIOS DE FORMA SEGURA
const formatearPrecio = (precio: string | number | undefined): string => {
    if (precio === undefined || precio === null) return '0.00';
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    if (isNaN(numero)) return '0.00';
    return numero.toFixed(2);
};

// ✅ INTERFAZ
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

export default function PantallaGestionOfertas(props: any) {
    console.log('🔄 [PantallaGestionOfertas] Componente montado');

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

    const insets = useSafeAreaInsets();

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        console.log('📱 [PantallaGestionOfertas] useEffect ejecutado');
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

        solicitarPermisos();
    }, []);

    const solicitarPermisos = async () => {
        console.log('📷 [PantallaGestionOfertas] Solicitando permisos de galería');
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                console.warn('⚠️ [PantallaGestionOfertas] Permisos de galería denegados');
                Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
            } else {
                console.log('✅ [PantallaGestionOfertas] Permisos de galería concedidos');
            }
        }
    };

    const cargarOfertas = async () => {
        console.log('🔄 [Admin] Cargando ofertas...');
        try {
            const { data, error } = await supabase
                .from('ofertas')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('❌ Error cargando ofertas:', error);
                setOfertas([]);
            } else {
                console.log(`📦 [Admin] Ofertas cargadas: ${data?.length || 0}`);
                data?.forEach((item, index) => {
                    console.log(`🖼️ [Admin] Oferta ${index + 1} - ${item.titulo}: imagen = ${item.imagen || 'Sin imagen'}`);
                    console.log(`💰 [Admin] Precios: original=${item.precio_original}, oferta=${item.precio_oferta}`);
                });
                setOfertas(data as Oferta[] || []);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setOfertas([]);
        } finally {
            setCargando(false);
            setRefrescando(false);
            console.log('🏁 [Admin] Carga de ofertas finalizada');
        }
    };

    const manejarRefresh = useCallback(() => {
        console.log('🔄 [Admin] Refrescando ofertas (pull-to-refresh)');
        setRefrescando(true);
        cargarOfertas();
    }, []);

    // ✅ SUBIR IMAGEN - CORREGIDO CON FORCE UPDATE
    const subirImagen = async (file: File) => {
        if (!file) {
            console.warn('⚠️ [Admin] No se proporcionó archivo para subir');
            return;
        }

        setSubiendoImagen(true);
        setImagenCargando(true);
        console.log('📤 [Admin] Iniciando subida de imagen:', file.name);

        try {
            const nombreArchivo = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            console.log(`📤 [Admin] Nombre de archivo generado: ${nombreArchivo}`);

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

                if (error.message && error.message.includes('row-level security')) {
                    Alert.alert(
                        '❌ Error de permisos (RLS)',
                        'Las políticas de seguridad están bloqueando la subida.\n\n' +
                        '📌 SOLUCIÓN RÁPIDA:\n' +
                        '1. Ve a Supabase → Storage → Buckets\n' +
                        '2. Haz clic en "ofertas_imagenes"\n' +
                        '3. Ve a "Settings" (Configuración)\n' +
                        '4. Desactiva "Row Level Security (RLS)"',
                        [{ text: 'OK' }]
                    );
                } else if (error.message && error.message.includes('bucket')) {
                    Alert.alert(
                        '❌ Bucket no encontrado',
                        'El bucket "ofertas_imagenes" no existe.\n\n' +
                        '1. Ve a Supabase → Storage → Buckets\n' +
                        '2. Crea un bucket llamado "ofertas_imagenes"\n' +
                        '3. Activa "Public bucket"',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert('Error', 'No se pudo subir la imagen: ' + error.message);
                }
                return;
            }

            const { data: urlData } = supabase.storage
                .from('ofertas_imagenes')
                .getPublicUrl(nombreArchivo);

            console.log('✅ URL pública obtenida:', urlData.publicUrl);

            // ✅ ACTUALIZAR ESTADOS
            const nuevaUrl = urlData.publicUrl;
            setImagen(nuevaUrl);
            setImagenUri(nuevaUrl);
            setImagenTimestamp(Date.now());
            setImagenCargando(false);
            setSubiendoImagen(false);

            console.log('✅ Imagen subida correctamente. URL guardada en estado.');
            console.log('📦 imagen:', nuevaUrl);
            console.log('📦 imagenUri:', nuevaUrl);

            // ✅ FORZAR ACTUALIZACIÓN DE LA PREVIEW
            setModalKey(prev => prev + 1);

            Alert.alert('✅ Éxito', 'Imagen subida correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo subir la imagen');
            setImagenCargando(false);
            setSubiendoImagen(false);
        }
    };

    // ✅ SELECCIONAR IMAGEN - CORREGIDO
    const seleccionarImagen = async () => {
        console.log('📷 [Admin] Iniciando selección de imagen');
        try {
            if (Platform.OS === 'web') {
                console.log('🌐 [Admin] Modo web - usando input file');
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (!file) {
                        console.warn('⚠️ [Admin] No se seleccionó ningún archivo');
                        return;
                    }
                    console.log('📄 [Admin] Archivo seleccionado:', file.name);

                    // ✅ Mostrar preview inmediata
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setImagenUri(base64);
                        setImagen(base64);
                        setImagenTimestamp(Date.now());
                        console.log('✅ [Admin] Vista previa generada en base64');
                    };
                    reader.readAsDataURL(file);

                    try {
                        await subirImagen(file);
                    } catch (error) {
                        console.log('⚠️ No se pudo subir a Supabase, pero la preview local está visible');
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
                console.log('📄 [Admin] Imagen seleccionada desde galería:', asset.uri);

                // ✅ MOSTRAR PREVIEW INMEDIATA
                let uriParaPreview = asset.uri;

                // Si tiene base64, usar eso para mejor compatibilidad
                if (asset.base64) {
                    uriParaPreview = `data:image/jpeg;base64,${asset.base64}`;
                }

                setImagenUri(uriParaPreview);
                setImagen(uriParaPreview);
                setImagenTimestamp(Date.now());
                console.log('✅ [Admin] Vista previa establecida inmediatamente');

                // ✅ Intentar subir a Supabase
                if (asset.uri) {
                    try {
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        const fileType = asset.mimeType || 'image/jpeg';
                        const extension = fileType.split('/')[1] || 'jpg';
                        const file = new File([blob], `oferta_${Date.now()}.${extension}`, { type: fileType });
                        console.log('📤 [Admin] Subiendo archivo:', file.name);
                        await subirImagen(file);
                    } catch (error) {
                        console.log('⚠️ No se pudo subir a Supabase, usando vista previa local');
                        setImagenCargando(false);
                        setSubiendoImagen(false);
                    }
                }
            } else {
                console.log('ℹ️ [Admin] Selección de imagen cancelada por el usuario');
            }
        } catch (error) {
            console.error('❌ Error seleccionando imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const abrirFormulario = (oferta?: Oferta) => {
        console.log('📝 [Admin] Abriendo formulario:', oferta ? `Editar oferta ${oferta.id}` : 'Nueva oferta');

        // ✅ RESETEAR ESTADOS
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
            // ✅ Pequeño delay para asegurar que los estados se resetearon
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
                console.log('✅ [Admin] Datos de oferta cargados en formulario');
                console.log('🖼️ [Admin] Imagen de oferta:', oferta.imagen || 'Sin imagen');
            }, 100);
        } else {
            setOfertaEditando(null);
            setModalKey(prev => prev + 1);
            setModalVisible(true);
            console.log('✅ [Admin] Formulario de nueva oferta listo');
        }
    };

    // ✅ GUARDAR OFERTA - CORREGIDO
    const guardarOferta = async () => {
        console.log('💾 [Admin] Intentando guardar oferta');

        if (!titulo || !descuento || !precioOriginal || !precioOferta) {
            console.warn('⚠️ [Admin] Campos obligatorios faltantes');
            Alert.alert('Error', 'Completa todos los campos obligatorios');
            return;
        }

        // ✅ PRIORIDAD: imagenUri (que tiene la URL final de Supabase o la preview)
        const urlImagenFinal = imagenUri || imagen || null;

        console.log('📦 [Admin] Guardando oferta con imagen:', urlImagenFinal);
        console.log('📦 [Admin] imagenUri:', imagenUri);
        console.log('📦 [Admin] imagen:', imagen);

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

        console.log('📦 [Admin] Datos completos a guardar:', datos);

        try {
            if (ofertaEditando) {
                console.log(`🔄 [Admin] Actualizando oferta ID: ${ofertaEditando.id}`);
                const { error } = await supabase
                    .from('ofertas')
                    .update(datos)
                    .eq('id', ofertaEditando.id);
                if (error) {
                    console.error('❌ Error actualizando oferta:', error);
                    Alert.alert('Error', 'No se pudo actualizar la oferta: ' + error.message);
                    return;
                }
                console.log('✅ [Admin] Oferta actualizada correctamente');
                Alert.alert('Éxito', 'Oferta actualizada correctamente');
            } else {
                console.log('➕ [Admin] Creando nueva oferta');
                const { error } = await supabase
                    .from('ofertas')
                    .insert(datos);
                if (error) {
                    console.error('❌ Error creando oferta:', error);
                    Alert.alert('Error', 'No se pudo crear la oferta: ' + error.message);
                    return;
                }
                console.log('✅ [Admin] Oferta creada correctamente');
                Alert.alert('Éxito', 'Oferta creada correctamente');
            }

            setModalVisible(false);
            // ✅ Resetear estados después de guardar
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

    const eliminarOferta = (id: number, titulo: string) => {
        console.log(`🗑️ [Admin] Intentando eliminar oferta ID: ${id}, Título: "${titulo}"`);
        Alert.alert(
            'Eliminar oferta',
            `¿Estás seguro de eliminar "${titulo}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        console.log(`🗑️ [Admin] Confirmada eliminación de oferta ID: ${id}`);
                        const { error } = await supabase
                            .from('ofertas')
                            .delete()
                            .eq('id', id);
                        if (error) {
                            console.error('❌ Error eliminando oferta:', error);
                            Alert.alert('Error', 'No se pudo eliminar la oferta');
                            return;
                        }
                        console.log('✅ [Admin] Oferta eliminada correctamente');
                        cargarOfertas();
                        Alert.alert('Éxito', 'Oferta eliminada correctamente');
                    }
                }
            ]
        );
    };

    const toggleActiva = async (id: number, estadoActual: boolean) => {
        const nuevoEstado = !estadoActual;
        console.log(`🔄 [Admin] Cambiando estado de oferta ID: ${id} de ${estadoActual} a ${nuevoEstado}`);
        const { error } = await supabase
            .from('ofertas')
            .update({ activa: nuevoEstado })
            .eq('id', id);
        if (!error) {
            console.log('✅ [Admin] Estado actualizado correctamente');
            cargarOfertas();
        } else {
            console.error('❌ Error cambiando estado:', error);
        }
    };

    const cerrarModal = () => {
        console.log('❌ [Admin] Cerrando modal');
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
            console.log('🧹 [Admin] Formulario limpiado');
        }, 300);
    };

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

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

    // ✅ FUNCIÓN PARA OBTENER LA URL DE LA IMAGEN - PRIORIDAD
    const obtenerUrlImagen = () => {
        // Prioridad: imagenUri (que puede ser base64 o URL de Supabase)
        if (imagenUri) {
            console.log('🔍 [Admin] Usando imagenUri:', imagenUri.substring(0, 50) + '...');
            return imagenUri;
        }
        if (imagen) {
            console.log('🔍 [Admin] Usando imagen:', imagen.substring(0, 50) + '...');
            return imagen;
        }
        console.log('🔍 [Admin] Sin imagen disponible');
        return null;
    };

    const urlImagenPreview = obtenerUrlImagen();

    // ✅ RENDER OFERTA - CORREGIDO
    const renderOferta = ({ item, index }: { item: Oferta; index: number }) => {
        console.log(`🖼️ [Render] Oferta ${index + 1} - ${item.titulo}: imagen = ${item.imagen || 'Sin imagen'}`);

        const delay = index * 100;
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });
        const itemSlide = slideUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 * (index + 1), 0],
        });

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
                        borderColor: item.activa ? COLORS.verdeClaro + '40' : COLORS.grisClaro + '30',
                    }
                ]}>
                    {item.imagen && (
                        <View style={estilos.tarjetaImagenContainer}>
                            <Image
                                key={item.id + '_' + item.imagen + '_' + Date.now()}
                                source={{ uri: item.imagen }}
                                style={[
                                    estilos.tarjetaImagen,
                                    {
                                        height: isTablet ? 120 : isSmallPhone ? 80 : 100,
                                        borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    }
                                ]}
                                resizeMode="cover"
                                onError={(e) => {
                                    console.log('❌ Error cargando imagen en tarjeta:', e.nativeEvent.error);
                                    console.log('URL que falló:', item.imagen);
                                }}
                                onLoad={() => console.log('✅ Imagen cargada en tarjeta:', item.imagen)}
                            />
                        </View>
                    )}

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
                                trackColor={{ false: COLORS.gris, true: COLORS.verdeClaro }}
                                thumbColor={item.activa ? COLORS.blanco : COLORS.blanco}
                            />
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: COLORS.amarillo + '20',
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                }]}
                                onPress={() => abrirFormulario(item)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.amarillo} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[estilos.botonAccion, {
                                    backgroundColor: COLORS.rojo + '20',
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                }]}
                                onPress={() => eliminarOferta(item.id, item.titulo)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.rojo} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={estilos.tarjetaDetalles}>
                        <Text style={[estilos.tarjetaDesc, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            {item.descripcion || 'Sin descripción'}
                        </Text>
                        <View style={estilos.tarjetaPrecios}>
                            <Text style={[estilos.tarjetaPrecioOriginal, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                ${formatearPrecio(item.precio_original)}
                            </Text>
                            <Text style={[estilos.tarjetaPrecioOferta, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                                ${formatearPrecio(item.precio_oferta)}
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
                                backgroundColor: item.activa ? COLORS.verdeClaro + '20' : COLORS.grisClaro + '20',
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
                                    color: item.activa ? COLORS.verdeClaro : COLORS.grisClaro,
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

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

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
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                    🎫 Gestionar Ofertas
                </Text>
                <TouchableOpacity
                    style={[estilos.botonAgregar, {
                        paddingHorizontal: isTablet ? 18 : isSmallPhone ? 12 : 16,
                        paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10,
                    }]}
                    onPress={() => abrirFormulario()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={isTablet ? 26 : isSmallPhone ? 18 : 22} color={COLORS.negro} />
                </TouchableOpacity>
            </View>

            <View style={[estilos.contadorContainer, { paddingHorizontal: paddingHorizontal }]}>
                <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                    {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                </Text>
            </View>

            <FlatList
                data={ofertas}
                keyExtractor={item => item.id.toString()}
                renderItem={renderOferta}
                contentContainerStyle={[
                    estilos.lista,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 40,
                        paddingTop: isTablet ? 8 : 4,
                    }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={manejarRefresh}
                        tintColor={COLORS.amarillo}
                        colors={[COLORS.amarillo]}
                    />
                }
                ListEmptyComponent={
                    <View style={estilos.vacioContenedor}>
                        <Ionicons name="pricetag-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
                        <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                            No hay ofertas
                        </Text>
                        <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            Crea tu primera oferta presionando el botón +
                        </Text>
                    </View>
                }
            />

            {/* ✅ MODAL CON PREVIEW DE IMAGEN CORREGIDA */}
            <Modal
                key={modalKey}
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={estilos.modalFondo}>
                    <LinearGradient
                        colors={[COLORS.verde, COLORS.negro]}
                        style={estilos.modalGradiente}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <View style={[
                        estilos.modal,
                        {
                            padding: isTablet ? 32 : isSmallPhone ? 16 : 24,
                            borderRadius: isTablet ? 28 : 24,
                            width: modalWidth,
                            maxHeight: isTablet ? '80%' : '85%',
                            borderColor: COLORS.amarillo + '30',
                        }
                    ]}>
                        <View style={estilos.modalHeader}>
                            <LinearGradient
                                colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                style={estilos.modalHeaderGradiente}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="pricetag" size={isTablet ? 32 : isSmallPhone ? 24 : 28} color={COLORS.negro} />
                                <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                                    {ofertaEditando ? '✏️ Editar Oferta' : '➕ Nueva Oferta'}
                                </Text>
                            </LinearGradient>
                        </View>

                        <ScrollView
                            style={estilos.modalScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                <Ionicons name="pricetag-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Título *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={titulo}
                                onChangeText={setTitulo}
                                placeholder="Ej: 2x1 en Hamburguesas"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="document-text-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Descripción
                            </Text>
                            <TextInput
                                style={[estilos.input, estilos.textArea, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={descripcion}
                                onChangeText={setDescripcion}
                                placeholder="Descripción de la oferta"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="flame-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Descuento *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={descuento}
                                onChangeText={setDescuento}
                                placeholder="Ej: 20% OFF, 2x1"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="cash-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Precio Original *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={precioOriginal}
                                onChangeText={setPrecioOriginal}
                                placeholder="Ej: 9990"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                keyboardType="numeric"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="pricetag" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Precio Oferta *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={precioOferta}
                                onChangeText={setPrecioOferta}
                                placeholder="Ej: 7990"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                keyboardType="numeric"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="calendar-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Fecha Inicio (opcional)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={fechaInicio}
                                onChangeText={setFechaInicio}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="calendar-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Fecha Fin (opcional)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={fechaFin}
                                onChangeText={setFechaFin}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            {/* ✅ IMAGEN - PREVIEW CORREGIDA */}
                            <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginTop: 14 }]}>
                                <Ionicons name="image-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Imagen (opcional)
                            </Text>

                            <TouchableOpacity
                                style={[estilos.botonImagen, {
                                    padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    marginBottom: 10,
                                }]}
                                onPress={seleccionarImagen}
                                activeOpacity={0.7}
                                disabled={subiendoImagen}
                            >
                                {subiendoImagen ? (
                                    <ActivityIndicator size="small" color={COLORS.amarillo} />
                                ) : (
                                    <Ionicons name="images-outline" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={COLORS.amarillo} />
                                )}
                                <Text style={[estilos.botonImagenTexto, {
                                    fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13,
                                    color: subiendoImagen ? COLORS.grisClaro : COLORS.amarillo,
                                }]}>
                                    {subiendoImagen ? '⏳ Subiendo...' : '📷 Seleccionar imagen de la galería'}
                                </Text>
                            </TouchableOpacity>

                            {/* ✅ PREVIEW DE LA IMAGEN - CON FORCE UPDATE */}
                            {urlImagenPreview ? (
                                <View style={estilos.previaImagen}>
                                    <Image
                                        key={`preview_${imagenTimestamp}_${Date.now()}`}
                                        source={{ uri: urlImagenPreview }}
                                        style={[estilos.previaFoto, {
                                            height: isTablet ? 180 : isSmallPhone ? 120 : 150,
                                            borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                        }]}
                                        resizeMode="cover"
                                        onError={(e) => {
                                            console.log('❌ Error cargando imagen en preview:', e.nativeEvent.error);
                                            console.log('URL que falló:', urlImagenPreview);
                                            setImagenCargando(false);
                                        }}
                                        onLoad={() => {
                                            console.log('✅ Imagen cargada correctamente en preview');
                                            setImagenCargando(false);
                                        }}
                                        onLoadStart={() => {
                                            console.log('⏳ Comenzando a cargar imagen en preview...');
                                            setImagenCargando(true);
                                        }}
                                        onLoadEnd={() => {
                                            console.log('🏁 Carga de imagen en preview finalizada');
                                            setImagenCargando(false);
                                        }}
                                    />
                                    {imagenCargando && (
                                        <View style={estilos.loadingOverlay}>
                                            <ActivityIndicator size="large" color={COLORS.amarillo} />
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[estilos.botonQuitarImagen, {
                                            width: isTablet ? 34 : isSmallPhone ? 24 : 28,
                                            height: isTablet ? 34 : isSmallPhone ? 24 : 28,
                                            borderRadius: isTablet ? 17 : isSmallPhone ? 12 : 14,
                                        }]}
                                        onPress={() => {
                                            console.log('🗑️ [Admin] Eliminando imagen seleccionada');
                                            setImagen('');
                                            setImagenUri(null);
                                            setImagenCargando(false);
                                            setImagenTimestamp(Date.now());
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={isTablet ? 20 : isSmallPhone ? 14 : 16} color={COLORS.blanco} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={[estilos.sinImagen, {
                                    padding: isTablet ? 20 : isSmallPhone ? 12 : 16,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                }]}>
                                    <Ionicons name="image-outline" size={isTablet ? 40 : isSmallPhone ? 28 : 32} color={COLORS.grisClaro + '40'} />
                                    <Text style={[estilos.sinImagenTexto, {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                    }]}>
                                        Sin imagen seleccionada
                                    </Text>
                                </View>
                            )}

                            <Text style={[estilos.label, {
                                fontSize: isTablet ? 13 : isSmallPhone ? 10 : 11,
                                marginTop: 10,
                                opacity: 0.6,
                            }]}>
                                O pega la URL manualmente:
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}
                                value={imagen}
                                onChangeText={(text) => {
                                    console.log('📝 [Admin] URL de imagen manual:', text);
                                    setImagen(text);
                                    setImagenUri(text);
                                    setImagenTimestamp(Date.now());
                                }}
                                placeholder="https://ejemplo.com/oferta.jpg"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                autoCapitalize="none"
                                selectionColor={COLORS.amarillo}
                            />

                            <View style={estilos.switchContainer}>
                                <Text style={[estilos.label, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, marginBottom: 0 }]}>
                                    <Ionicons name="checkmark-circle-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Activa
                                </Text>
                                <Switch
                                    value={activa}
                                    onValueChange={setActiva}
                                    trackColor={{ false: COLORS.gris, true: COLORS.verdeClaro }}
                                    thumbColor={activa ? COLORS.blanco : COLORS.blanco}
                                />
                            </View>
                        </ScrollView>

                        <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12, marginTop: 16 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalCancelar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                                onPress={cerrarModal}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.blanco} />
                                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalGuardar, { paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14 }]}
                                onPress={guardarOferta}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                    style={estilos.modalGuardarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="save" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                                    <Text style={[estilos.modalGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                        {ofertaEditando ? 'Actualizar' : 'Crear'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '10',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    botonAgregar: {
        backgroundColor: COLORS.amarillo,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.amarillo,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    contadorContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '5',
    },
    contador: {
        color: COLORS.grisClaro,
        fontWeight: '500',
        opacity: 0.6,
    },
    lista: {
        flexGrow: 1,
    },
    tarjeta: {
        backgroundColor: COLORS.negro + '60',
        marginBottom: 10,
        borderWidth: 1,
    },
    tarjetaImagenContainer: {
        marginBottom: 8,
    },
    tarjetaImagen: {
        width: '100%',
        backgroundColor: COLORS.negro + '30',
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
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    tarjetaDescuento: {
        color: COLORS.amarillo,
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
        borderTopColor: COLORS.blanco + '8',
        paddingTop: 8,
    },
    tarjetaDesc: {
        color: COLORS.grisClaro,
        opacity: 0.7,
        marginBottom: 6,
    },
    tarjetaPrecios: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tarjetaPrecioOriginal: {
        color: COLORS.grisClaro,
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    tarjetaPrecioOferta: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    tarjetaFechas: {
        marginTop: 4,
    },
    tarjetaFecha: {
        color: COLORS.grisClaro,
        opacity: 0.6,
    },
    estadoBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    estadoBadgeTexto: {
        fontWeight: '600',
    },
    vacioContenedor: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    vacio: {
        color: COLORS.blanco,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        color: COLORS.grisClaro,
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 28,
    },
    modal: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        overflow: 'hidden',
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
        fontWeight: 'bold',
        color: COLORS.negro,
    },
    modalScroll: {
        maxHeight: '70%',
        paddingHorizontal: 4,
    },
    label: {
        fontWeight: '600',
        color: COLORS.blanco,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: COLORS.negro + '40',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        color: COLORS.blanco,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
        backgroundColor: COLORS.amarillo + '10',
        borderWidth: 2,
        borderColor: COLORS.amarillo + '20',
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
        backgroundColor: COLORS.negro + '40',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    botonQuitarImagen: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.negro + '75',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.blanco + '15',
    },
    sinImagen: {
        backgroundColor: COLORS.negro + '30',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    sinImagenTexto: {
        color: COLORS.grisClaro,
        opacity: 0.5,
        marginTop: 6,
    },
    modalBotones: {
        flexDirection: 'row',
        marginTop: 8,
    },
    modalBoton: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        overflow: 'hidden',
    },
    modalCancelar: {
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    modalCancelarTexto: {
        color: COLORS.blanco,
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
        color: COLORS.negro,
        fontWeight: 'bold',
    },
});