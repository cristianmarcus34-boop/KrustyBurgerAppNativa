// screens/admin/PantallaGestionHero.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useColores } from '../../lib/theme';
import { Shadows } from '../../lib/colores';

const HERO_ID = '00000000-0000-0000-0000-000000000001';

type Portada = {
    imagen_url: string | null;
    titulo: string | null;
    subtitulo: string | null;
};

export default function PantallaGestionHero() {
    const colores = useColores();
    const estilos = useMemo(() => crearEstilos(colores), [colores]);
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);

    const [imagenUrl, setImagenUrl] = useState('');
    const [titulo, setTitulo] = useState('');
    const [subtitulo, setSubtitulo] = useState('');
    const [urlManual, setUrlManual] = useState('');

    useEffect(() => {
        cargarPortada();
    }, []);

    const cargarPortada = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('hero_portada')
                .select('imagen_url, titulo, subtitulo')
                .eq('id', HERO_ID)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setImagenUrl(data.imagen_url || '');
                setTitulo(data.titulo || '');
                setSubtitulo(data.subtitulo || '');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo cargar la portada');
        } finally {
            setCargando(false);
        }
    };

    const elegirDeGaleria = async () => {
        try {
            const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permiso.granted) {
                Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería');
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,     // 👈 sin pantalla de recorte
                quality: 0.85,
            });

            if (resultado.canceled || !resultado.assets?.[0]) return;

            const asset = resultado.assets[0];
            await subirImagen(asset.uri);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo abrir la galería');
        }
    };

    const subirImagen = async (uri: string) => {
        setSubiendo(true);
        try {
            const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
            const nombreArchivo = `hero-${Date.now()}.${extension}`;

            const respuesta = await fetch(uri);
            const blob = await respuesta.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: errorSubida } = await supabase.storage
                .from('hero_portadas')
                .upload(nombreArchivo, arrayBuffer, {
                    contentType: blob.type || `image/${extension}`,
                    upsert: true,
                });

            if (errorSubida) throw errorSubida;

            const { data: urlData } = supabase.storage
                .from('hero_portadas')
                .getPublicUrl(nombreArchivo);

            if (!urlData?.publicUrl) throw new Error('No se obtuvo URL pública');

            setImagenUrl(urlData.publicUrl);
            Alert.alert('Listo', 'Imagen subida. No olvides guardar los cambios.');
        } catch (e: any) {
            Alert.alert('Error al subir', e.message || 'Intenta de nuevo');
        } finally {
            setSubiendo(false);
        }
    };

    const aplicarUrlManual = () => {
        if (!urlManual.trim()) return;
        setImagenUrl(urlManual.trim());
        setUrlManual('');
        Alert.alert('Listo', 'URL aplicada. Guardá los cambios.');
    };

    const guardar = async () => {
        setGuardando(true);
        try {
            const { error } = await supabase
                .from('hero_portada')
                .update({
                    imagen_url: imagenUrl.trim() || null,
                    titulo: titulo.trim() || null,
                    subtitulo: subtitulo.trim() || null,
                    actualizado_en: new Date().toISOString(),
                })
                .eq('id', HERO_ID);

            if (error) throw error;

            Alert.alert('✅ Guardado', 'La portada se actualizó correctamente');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo guardar');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarPortada = () => {
        Alert.alert(
            'Eliminar portada',
            '¿Seguro que querés quitar la imagen? Se mostrará el fallback por defecto.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('hero_portada')
                                .update({ imagen_url: null, titulo: null, subtitulo: null })
                                .eq('id', HERO_ID);
                            setImagenUrl('');
                            setTitulo('');
                            setSubtitulo('');
                            Alert.alert('Eliminada', 'La portada fue eliminada');
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    const padding = isDesktop ? 40 : isTablet ? 28 : 20;

    if (cargando) {
        return (
            <View style={[estilos.centrado, { backgroundColor: colores.fondo }]}>
                <ActivityIndicator size="large" color={colores.accent} />
                <Text style={[estilos.textoCargando, { color: colores.text }]}>
                    Cargando portada...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colores.fondo }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={{ padding, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={estilos.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[estilos.btnVolver, { backgroundColor: colores.card }]}
                    >
                        <Ionicons name="arrow-back" size={22} color={colores.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={[estilos.titulo, { color: colores.text }]}>
                            Hero Portada
                        </Text>
                        <Text style={[estilos.subtitulo, { color: colores.textSecondary }]}>
                            Imagen que se muestra en la pantalla de inicio
                        </Text>
                    </View>
                </View>

                {/* Preview */}
                <View style={[estilos.card, { backgroundColor: colores.card }]}>
                    <Text style={[estilos.label, { color: colores.text }]}>
                        Vista previa
                    </Text>
                    <View
                        style={[
                            estilos.preview,
                            { backgroundColor: colores.border || '#eee' },
                        ]}
                    >
                        {imagenUrl ? (
                            <Image
                                source={{ uri: imagenUrl }}
                                style={estilos.previewImg}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={estilos.previewVacio}>
                                <Ionicons
                                    name="image-outline"
                                    size={40}
                                    color={colores.textSecondary}
                                />
                                <Text style={{ color: colores.textSecondary, marginTop: 8 }}>
                                    Sin imagen
                                </Text>
                            </View>
                        )}

                        {(titulo || subtitulo) && (
                            <View style={estilos.previewOverlay}>
                                {titulo ? (
                                    <Text style={estilos.previewTitulo}>{titulo}</Text>
                                ) : null}
                                {subtitulo ? (
                                    <Text style={estilos.previewSubtitulo}>{subtitulo}</Text>
                                ) : null}
                            </View>
                        )}
                    </View>
                </View>

                {/* Subir imagen */}
                <View style={[estilos.card, { backgroundColor: colores.card }]}>
                    <Text style={[estilos.label, { color: colores.text }]}>Imagen</Text>

                    <TouchableOpacity
                        style={[estilos.btnPrimario, { backgroundColor: colores.accent }]}
                        onPress={elegirDeGaleria}
                        disabled={subiendo}
                    >
                        {subiendo ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                <Text style={estilos.btnPrimarioTexto}>
                                    Subir desde el celular
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={estilos.divisor}>
                        <View style={[estilos.linea, { backgroundColor: colores.border }]} />
                        <Text style={[estilos.oTexto, { color: colores.textSecondary }]}>
                            o pegá una URL
                        </Text>
                        <View style={[estilos.linea, { backgroundColor: colores.border }]} />
                    </View>

                    <View style={estilos.filaUrl}>
                        <TextInput
                            style={[
                                estilos.input,
                                {
                                    color: colores.text,
                                    borderColor: colores.border,
                                    backgroundColor: colores.fondo,
                                    flex: 1,
                                },
                            ]}
                            placeholder="https://..."
                            placeholderTextColor={colores.textSecondary}
                            value={urlManual}
                            onChangeText={setUrlManual}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={[estilos.btnSecundario, { borderColor: colores.accent }]}
                            onPress={aplicarUrlManual}
                        >
                            <Text style={{ color: colores.accent, fontWeight: '700' }}>
                                Aplicar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {imagenUrl ? (
                        <TouchableOpacity
                            style={estilos.btnEliminar}
                            onPress={eliminarPortada}
                        >
                            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                            <Text style={estilos.btnEliminarTexto}>Quitar portada</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Textos */}
                <View style={[estilos.card, { backgroundColor: colores.card }]}>
                    <Text style={[estilos.label, { color: colores.text }]}>
                        Textos (opcionales)
                    </Text>
                    <Text style={[estilos.ayuda, { color: colores.textSecondary }]}>
                        Si los dejás vacíos, la imagen ocupa todo el hero.
                    </Text>

                    <TextInput
                        style={[
                            estilos.input,
                            {
                                color: colores.text,
                                borderColor: colores.border,
                                backgroundColor: colores.fondo,
                                marginTop: 12,
                            },
                        ]}
                        placeholder="Título (ej: ¡Feliz Día del Niño!)"
                        placeholderTextColor={colores.textSecondary}
                        value={titulo}
                        onChangeText={setTitulo}
                        maxLength={60}
                    />

                    <TextInput
                        style={[
                            estilos.input,
                            {
                                color: colores.text,
                                borderColor: colores.border,
                                backgroundColor: colores.fondo,
                                marginTop: 12,
                            },
                        ]}
                        placeholder="Subtítulo (ej: 20% OFF en toda la tienda)"
                        placeholderTextColor={colores.textSecondary}
                        value={subtitulo}
                        onChangeText={setSubtitulo}
                        maxLength={100}
                    />
                </View>

                {/* Guardar */}
                <TouchableOpacity
                    style={[
                        estilos.btnGuardar,
                        {
                            backgroundColor: colores.accent,
                            opacity: guardando ? 0.6 : 1,
                        },
                    ]}
                    onPress={guardar}
                    disabled={guardando}
                >
                    {guardando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={estilos.btnGuardarTexto}>Guardar cambios</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const crearEstilos = (colores: any) =>
    StyleSheet.create({
        centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        textoCargando: { marginTop: 12, fontSize: 14 },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            gap: 12,
        },
        btnVolver: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
        },
        titulo: { fontSize: 22, fontWeight: '800' },
        subtitulo: { fontSize: 13, marginTop: 2 },
        card: {
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            ...Shadows.light.sm,
        },
        label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
        ayuda: { fontSize: 12, marginBottom: 4 },
        preview: {
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
        },
        previewImg: { width: '100%', height: '100%' },
        previewVacio: { justifyContent: 'center', alignItems: 'center' },
        previewOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 14,
            backgroundColor: 'rgba(0,0,0,0.45)',
        },
        previewTitulo: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '800',
        },
        previewSubtitulo: {
            color: '#fff',
            fontSize: 12,
            marginTop: 2,
        },
        btnPrimario: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
        },
        btnPrimarioTexto: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 15,
        },
        divisor: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 16,
            gap: 10,
        },
        linea: { flex: 1, height: 1 },
        oTexto: { fontSize: 12 },
        filaUrl: { flexDirection: 'row', gap: 8, alignItems: 'center' },
        input: {
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
        },
        btnSecundario: {
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        btnEliminar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 16,
            paddingVertical: 10,
        },
        btnEliminarTexto: {
            color: '#e74c3c',
            fontWeight: '700',
            fontSize: 14,
        },
        btnGuardar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 14,
            marginTop: 8,
            ...Shadows.light.md,
        },
        btnGuardarTexto: {
            color: '#fff',
            fontWeight: '800',
            fontSize: 16,
        },
    });