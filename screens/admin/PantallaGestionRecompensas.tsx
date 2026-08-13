// screens/admin/PantallaGestionRecompensas.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Modal, TextInput, ScrollView, Dimensions,
    Animated, RefreshControl, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
    imagen?: string;
    created_at?: string;
    updated_at?: string;
}

const TIPOS_RECOMPENSA = [
    { id: 'DESCUENTO', label: '💰 Descuento', icon: 'pricetag-outline' },
    { id: 'PRODUCTO_GRATIS', label: '🍔 Producto Gratis', icon: 'restaurant-outline' },
    { id: 'ENVIO_GRATIS', label: '🚚 Envío Gratis', icon: 'car-outline' },
];

export default function PantallaGestionRecompensas(props: any) {
    const insets = useSafeAreaInsets();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalKey, setModalKey] = useState(0);
    const [editando, setEditando] = useState<Recompensa | null>(null);

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [puntosNecesarios, setPuntosNecesarios] = useState('');
    const [tipo, setTipo] = useState<'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS'>('DESCUENTO');
    const [valorDescuento, setValorDescuento] = useState('');
    const [activa, setActiva] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        cargarRecompensas();
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

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const tarjetaPadding = isTablet ? 16 : isSmallPhone ? 10 : 12;
    const modalWidth = isTablet ? '70%' : '92%';
    const labelSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
    const inputSize = isTablet ? 16 : isSmallPhone ? 13 : 14;

    const cargarRecompensas = async () => {
        const { data, error } = await supabase
            .from('recompensas')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error cargando recompensas:', error);
            Alert.alert('Error', 'No se pudieron cargar las recompensas');
        } else {
            setRecompensas(data || []);
        }
        setCargando(false);
        setRefrescando(false);
    };

    const abrirFormulario = (recompensa?: Recompensa) => {
        setNombre('');
        setDescripcion('');
        setPuntosNecesarios('');
        setTipo('DESCUENTO');
        setValorDescuento('');
        setActiva(true);

        if (recompensa) {
            setEditando(recompensa);
            setTimeout(() => {
                setNombre(recompensa.nombre);
                setDescripcion(recompensa.descripcion || '');
                setPuntosNecesarios(String(recompensa.puntos_necesarios || 0));
                setTipo(recompensa.tipo || 'DESCUENTO');
                setValorDescuento(String(recompensa.valor_descuento || 0));
                setActiva(recompensa.activa !== undefined ? recompensa.activa : true);
                setModalKey(prev => prev + 1);
                setModalVisible(true);
            }, 50);
        } else {
            setEditando(null);
            setModalKey(prev => prev + 1);
            setModalVisible(true);
        }
    };

    const guardarRecompensa = async () => {
        if (!nombre || !puntosNecesarios) {
            Alert.alert('Error', 'Completa todos los campos obligatorios');
            return;
        }

        const puntos = parseInt(puntosNecesarios);
        if (isNaN(puntos) || puntos < 1) {
            Alert.alert('Error', 'Los puntos deben ser un número válido mayor a 0');
            return;
        }

        const datos = {
            nombre,
            descripcion: descripcion || '',
            puntos_necesarios: puntos,
            tipo,
            valor_descuento: parseFloat(valorDescuento) || 0,
            activa,
        };

        setGuardando(true);
        let error = null;

        if (editando) {
            const { error: updateError } = await supabase
                .from('recompensas')
                .update({
                    ...datos,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editando.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('recompensas')
                .insert([{
                    ...datos,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
            error = insertError;
        }

        setGuardando(false);

        if (error) {
            console.error('Error guardando recompensa:', error);
            Alert.alert('❌ Error', error.message || 'No se pudo guardar la recompensa');
        } else {
            Alert.alert('✅ Éxito', `Recompensa ${editando ? 'actualizada' : 'creada'} correctamente`);
            cerrarModal();
            cargarRecompensas();
        }
    };

    // ✅ FUNCIÓN SIMPLIFICADA - SOLO DESACTIVAR
    const eliminarRecompensa = (id: number, nombre: string) => {
        Alert.alert(
            'Desactivar recompensa',
            `¿Deseas desactivar "${nombre}"? Los canjes existentes se mantendrán.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desactivar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('recompensas')
                                .update({
                                    activa: false,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', id);

                            if (error) {
                                Alert.alert('❌ Error', error.message || 'No se pudo desactivar');
                            } else {
                                Alert.alert('✅ Éxito', 'Recompensa desactivada correctamente');
                                cargarRecompensas();
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            Alert.alert('❌ Error', 'Ocurrió un error inesperado');
                        }
                    }
                }
            ]
        );
    };

    const manejarToggleActiva = async (id: number, estadoActual: boolean) => {
        const { error } = await supabase
            .from('recompensas')
            .update({
                activa: !estadoActual,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            Alert.alert('❌ Error', error.message || 'No se pudo cambiar el estado');
        } else {
            cargarRecompensas();
        }
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setTimeout(() => {
            setNombre('');
            setDescripcion('');
            setPuntosNecesarios('');
            setTipo('DESCUENTO');
            setValorDescuento('');
            setActiva(true);
            setEditando(null);
        }, 300);
    };

    const onRefresh = async () => {
        setRefrescando(true);
        await cargarRecompensas();
    };

    const getTipoLabel = (tipo: string) => {
        return TIPOS_RECOMPENSA.find(t => t.id === tipo)?.label || tipo;
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'DESCUENTO': return '#FF6F00';
            case 'PRODUCTO_GRATIS': return '#2E7D32';
            case 'ENVIO_GRATIS': return '#00695C';
            default: return COLORS.grisClaro;
        }
    };

    const renderRecompensa = ({ item, index }: { item: Recompensa; index: number }) => {
        const delay = index * 100;
        const itemFade = fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
        });
        const itemSlide = slideUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 * (index + 1), 0],
        });
        const tipoColor = getTipoColor(item.tipo);

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
                        backgroundColor: item.activa ? COLORS.negro + '60' : COLORS.negro + '40',
                    }
                ]}>
                    <View style={estilos.tarjetaHeader}>
                        <View style={estilos.tarjetaInfo}>
                            <View style={estilos.tarjetaTituloContainer}>
                                <Text style={[estilos.tarjetaTitulo, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                                    {item.nombre}
                                </Text>
                                <View style={[
                                    estilos.tipoBadge,
                                    {
                                        backgroundColor: tipoColor + '20',
                                        paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                        paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                        borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8,
                                    }
                                ]}>
                                    <Text style={[
                                        estilos.tipoBadgeTexto,
                                        {
                                            fontSize: isTablet ? 11 : isSmallPhone ? 8 : 9,
                                            color: tipoColor,
                                        }
                                    ]}>
                                        {getTipoLabel(item.tipo)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[estilos.tarjetaDesc, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                {item.descripcion || 'Sin descripción'}
                            </Text>
                            <View style={estilos.tarjetaPuntosContainer}>
                                <Text style={[estilos.tarjetaPuntos, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                    ⭐ {item.puntos_necesarios} pts
                                </Text>
                                {item.valor_descuento > 0 && (
                                    <Text style={[estilos.tarjetaValor, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                        {item.tipo === 'DESCUENTO' ? `-${item.valor_descuento}%` : `$${item.valor_descuento}`}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={estilos.tarjetaAcciones}>
                            <Switch
                                value={item.activa}
                                onValueChange={() => manejarToggleActiva(item.id, item.activa)}
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
                                onPress={() => eliminarRecompensa(item.id, item.nombre)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.rojo} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    if (cargando && !refrescando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={[estilos.loadingTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                    Cargando recompensas...
                </Text>
            </View>
        );
    }

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
                    🎁 Gestionar Recompensas
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
                    {recompensas.length} {recompensas.length === 1 ? 'recompensa' : 'recompensas'}
                </Text>
            </View>

            <FlatList
                data={recompensas}
                keyExtractor={item => item.id.toString()}
                renderItem={renderRecompensa}
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
                        onRefresh={onRefresh}
                        tintColor={COLORS.amarillo}
                        colors={[COLORS.amarillo]}
                    />
                }
                ListEmptyComponent={
                    <View style={estilos.vacioContenedor}>
                        <Ionicons name="gift-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
                        <Text style={[estilos.vacio, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                            No hay recompensas
                        </Text>
                        <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            Crea tu primera recompensa presionando el botón +
                        </Text>
                    </View>
                }
            />

            {/* ✅ MODAL */}
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
                                <Ionicons name="gift" size={isTablet ? 32 : isSmallPhone ? 24 : 28} color={COLORS.negro} />
                                <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                                    {editando ? '✏️ Editar Recompensa' : '➕ Nueva Recompensa'}
                                </Text>
                            </LinearGradient>
                        </View>

                        <ScrollView
                            style={estilos.modalScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            <Text style={[estilos.label, { fontSize: labelSize }]}>
                                <Ionicons name="gift-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Nombre *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize }]}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Ej: 20% de descuento"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 14 }]}>
                                <Ionicons name="document-text-outline" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Descripción
                            </Text>
                            <TextInput
                                style={[estilos.input, estilos.textArea, { fontSize: inputSize }]}
                                value={descripcion}
                                onChangeText={setDescripcion}
                                placeholder="Descripción de la recompensa"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 14 }]}>
                                <Ionicons name="star" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Puntos necesarios *
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: inputSize }]}
                                value={puntosNecesarios}
                                onChangeText={setPuntosNecesarios}
                                placeholder="Ej: 500"
                                placeholderTextColor={COLORS.grisClaro + '60'}
                                keyboardType="numeric"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: labelSize, marginTop: 14 }]}>
                                <Ionicons name="pricetag" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Tipo de recompensa *
                            </Text>
                            <View style={[estilos.tiposContainer, { gap: isTablet ? 8 : 6 }]}>
                                {TIPOS_RECOMPENSA.map(t => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            estilos.tipoOpcion,
                                            {
                                                paddingVertical: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                                paddingHorizontal: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                                borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                                backgroundColor: tipo === t.id ? COLORS.amarillo : COLORS.negro + '40',
                                                borderColor: tipo === t.id ? COLORS.amarillo : COLORS.blanco + '10',
                                            }
                                        ]}
                                        onPress={() => setTipo(t.id as any)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={t.icon as any} size={isTablet ? 20 : isSmallPhone ? 14 : 16} color={tipo === t.id ? COLORS.negro : COLORS.grisClaro} />
                                        <Text style={[
                                            estilos.tipoOpcionTexto,
                                            {
                                                fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                                color: tipo === t.id ? COLORS.negro : COLORS.grisClaro,
                                                fontWeight: tipo === t.id ? '700' : '500',
                                            }
                                        ]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {tipo === 'DESCUENTO' && (
                                <>
                                    <Text style={[estilos.label, { fontSize: labelSize, marginTop: 14 }]}>
                                        <Ionicons name="pricetag" size={isTablet ? 18 : isSmallPhone ? 14 : 16} color={COLORS.amarillo} /> Porcentaje de descuento
                                    </Text>
                                    <TextInput
                                        style={[estilos.input, { fontSize: inputSize }]}
                                        value={valorDescuento}
                                        onChangeText={setValorDescuento}
                                        placeholder="Ej: 20"
                                        placeholderTextColor={COLORS.grisClaro + '60'}
                                        keyboardType="numeric"
                                        selectionColor={COLORS.amarillo}
                                    />
                                </>
                            )}

                            <View style={estilos.switchContainer}>
                                <Text style={[estilos.label, { fontSize: labelSize, marginBottom: 0 }]}>
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
                                onPress={guardarRecompensa}
                                disabled={guardando}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                    style={estilos.modalGuardarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {guardando ? (
                                        <ActivityIndicator size="small" color={COLORS.negro} />
                                    ) : (
                                        <>
                                            <Ionicons name="save" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                                            <Text style={[estilos.modalGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                                {editando ? 'Actualizar' : 'Crear'}
                                            </Text>
                                        </>
                                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: COLORS.negro,
    },
    loadingTexto: {
        color: COLORS.grisClaro,
        fontWeight: '400',
        opacity: 0.7,
    },
    tarjeta: {
        marginBottom: 10,
        borderWidth: 1,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tarjetaInfo: {
        flex: 1,
        marginRight: 8,
    },
    tarjetaTituloContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    tarjetaTitulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    tipoBadge: {
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    tipoBadgeTexto: {
        fontWeight: '600',
    },
    tarjetaDesc: {
        color: COLORS.grisClaro,
        opacity: 0.7,
        marginBottom: 4,
    },
    tarjetaPuntosContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    tarjetaPuntos: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    tarjetaValor: {
        color: COLORS.verdeClaro,
        fontWeight: '600',
    },
    tarjetaAcciones: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    botonAccion: {
        justifyContent: 'center',
        alignItems: 'center',
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
    tiposContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tipoOpcion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minWidth: '30%',
    },
    tipoOpcionTexto: {
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
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