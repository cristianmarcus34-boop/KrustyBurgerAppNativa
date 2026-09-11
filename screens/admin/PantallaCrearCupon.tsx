// screens/admin/PantallaCrearCupon.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colores } from '../../lib/colores';
import { cuponService } from '../../lib/cupones/cuponService';
import { TipoCupon } from '../../lib/cupones/cuponTypes';
import { useToast, Toast } from '../../components/Toast';
import {
    formatearDescuento,
    colorPorTipo,
    iconoPorTipo,
    tituloPorTipo
} from '../../lib/cupones/cuponUtils';

// ============================================================
// 🎨 DISEÑO
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        border: 'rgba(0,0,0,0.06)',
        accent: '#E53935',
        accentSecondary: '#F5C518',
        verde: '#43A047',
        fondoOscuro: '#1A1A1A',
        surfaceHover: '#F8F6F2',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
    },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;
    return { isTablet, isSmallPhone, width };
};

export default function PantallaCrearCupon({ navigation, route }: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

    // ✅ Modo edición
    const cuponId = route?.params?.cuponId;
    const esEdicion = !!cuponId;

    // ============================================================
    // ✅ ESTADOS
    // ============================================================
    const [cargando, setCargando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(esEdicion);
    const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
    const [mostrarFechaExpiracion, setMostrarFechaExpiracion] = useState(false);
    const [previewGenerado, setPreviewGenerado] = useState(false);

    // Datos del formulario
    const [formulario, setFormulario] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'descuento' as TipoCupon,
        valor_descuento: '',
        es_porcentaje: true,
        producto_id: '',
        cantidad_maxima: '1',
        usos_maximos: '',
        fecha_inicio: new Date(),
        fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
        activo: true,
    });

    // ============================================================
    // 📋 CARGAR DATOS PARA EDICIÓN
    // ============================================================
    useEffect(() => {
        if (esEdicion && cuponId) {
            cargarCuponParaEditar(cuponId);
        }
    }, [cuponId]);

    const cargarCuponParaEditar = async (id: number) => {
        try {
            setCargandoDatos(true);
            const cupon = await cuponService.obtenerCuponPorId(id);

            if (!cupon) {
                Alert.alert('Error', 'No se encontró el cupón');
                navigation.goBack();
                return;
            }

            setFormulario({
                titulo: cupon.titulo,
                descripcion: cupon.descripcion || '',
                tipo: cupon.tipo,
                valor_descuento: cupon.valor_descuento?.toString() || '',
                es_porcentaje: cupon.es_porcentaje,
                producto_id: cupon.producto_id?.toString() || '',
                cantidad_maxima: cupon.cantidad_maxima.toString(),
                usos_maximos: cupon.usos_maximos?.toString() || '',
                fecha_inicio: new Date(cupon.fecha_inicio),
                fecha_expiracion: new Date(cupon.fecha_expiracion),
                activo: cupon.activo,
            });
        } catch (error) {
            console.error('Error cargando cupón:', error);
            Alert.alert('Error', 'No se pudo cargar el cupón');
            navigation.goBack();
        } finally {
            setCargandoDatos(false);
        }
    };

    // ============================================================
    // 📋 MANEJADORES
    // ============================================================
    const actualizarCampo = (campo: string, valor: any) => {
        setFormulario(prev => ({ ...prev, [campo]: valor }));
        setPreviewGenerado(false);
    };

    const handleGuardar = async () => {
        // Validaciones
        if (!formulario.titulo.trim()) {
            toast.advertencia('El título es obligatorio');
            return;
        }

        if (formulario.tipo === 'descuento' && !formulario.valor_descuento) {
            toast.advertencia('El valor del descuento es obligatorio');
            return;
        }

        const valorDescuento = parseFloat(formulario.valor_descuento);
        if (formulario.tipo === 'descuento' && (isNaN(valorDescuento) || valorDescuento <= 0)) {
            toast.advertencia('El valor del descuento debe ser mayor a 0');
            return;
        }

        if (formulario.fecha_inicio >= formulario.fecha_expiracion) {
            toast.advertencia('La fecha de expiración debe ser posterior a la de inicio');
            return;
        }

        setCargando(true);
        try {
            const datos = {
                titulo: formulario.titulo.trim(),
                descripcion: formulario.descripcion.trim() || undefined,
                tipo: formulario.tipo,
                valor_descuento: formulario.tipo === 'descuento' ? valorDescuento : undefined,
                es_porcentaje: formulario.es_porcentaje,
                producto_id: formulario.producto_id ? parseInt(formulario.producto_id) : undefined,
                cantidad_maxima: parseInt(formulario.cantidad_maxima) || 1,
                usos_maximos: formulario.usos_maximos ? parseInt(formulario.usos_maximos) : undefined,
                fecha_inicio: formulario.fecha_inicio.toISOString(),
                fecha_expiracion: formulario.fecha_expiracion.toISOString(),
                activo: formulario.activo,
            };

            let resultado;
            if (esEdicion && cuponId) {
                resultado = await cuponService.actualizarCupon(cuponId, datos);
            } else {
                resultado = await cuponService.crearCupon(datos);
            }

            if (resultado.success) {
                toast.exito(esEdicion ? '✅ Cupón actualizado' : '✅ Cupón creado exitosamente');
                navigation.goBack();
            } else {
                toast.error(resultado.error || 'Error al guardar el cupón');
            }
        } catch (error: any) {
            console.error('Error guardando cupón:', error);
            toast.error(error?.message || 'Error al guardar el cupón');
        } finally {
            setCargando(false);
        }
    };

    // ============================================================
    // 🎨 RENDER
    // ============================================================
    const padding = responsive.isTablet ? 40 : 20;

    if (cargandoDatos) {
        return (
            <View style={[styles.centered, { backgroundColor: DESIGN.colors.fondo }]}>
                <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
                <Text style={styles.loadingText}>Cargando cupón...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <LinearGradient
                colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: padding }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {esEdicion ? '✏️ Editar Cupón' : '🎯 Crear Cupón'}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: padding, paddingBottom: insets.bottom + 40 }
                ]}
            >
                {/* Previsualización */}
                <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => setPreviewGenerado(!previewGenerado)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.previewButtonText}>
                        {previewGenerado ? '👆 Ocultar previsualización' : '👁️ Ver previsualización'}
                    </Text>
                </TouchableOpacity>

                {previewGenerado && (
                    <View style={[styles.previewCard, { backgroundColor: DESIGN.colors.surface }]}>
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewIcon}>
                                {iconoPorTipo(formulario.tipo)}
                            </Text>
                            <View style={styles.previewInfo}>
                                <Text style={styles.previewTitulo}>
                                    {formulario.titulo || 'Nuevo Cupón'}
                                </Text>
                                <Text style={styles.previewTipo}>
                                    {tituloPorTipo(formulario.tipo)}
                                </Text>
                            </View>
                        </View>
                        {formulario.descripcion ? (
                            <Text style={styles.previewDescripcion}>
                                {formulario.descripcion}
                            </Text>
                        ) : null}
                        <View style={styles.previewFooter}>
                            <Text style={[styles.previewDescuento, { color: colorPorTipo(formulario.tipo) }]}>
                                {formulario.tipo === 'descuento' && formulario.valor_descuento
                                    ? (formulario.es_porcentaje
                                        ? `${formulario.valor_descuento}% OFF`
                                        : `$${parseFloat(formulario.valor_descuento || '0').toFixed(2)} OFF`)
                                    : '🎁 Beneficio especial'
                                }
                            </Text>
                            <Text style={styles.previewCodigo}>KB••••••••</Text>
                        </View>
                    </View>
                )}

                {/* Formulario */}
                <View style={[styles.formCard, { backgroundColor: DESIGN.colors.surface }]}>
                    {/* Título */}
                    <View style={styles.campo}>
                        <Text style={styles.label}>Título *</Text>
                        <TextInput
                            style={styles.input}
                            value={formulario.titulo}
                            onChangeText={(text) => actualizarCampo('titulo', text)}
                            placeholder="Ej: Descuento de bienvenida"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                        />
                    </View>

                    {/* Descripción */}
                    <View style={styles.campo}>
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formulario.descripcion}
                            onChangeText={(text) => actualizarCampo('descripcion', text)}
                            placeholder="Descripción del cupón (opcional)"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Tipo de cupón */}
                    <View style={styles.campo}>
                        <Text style={styles.label}>Tipo de cupón *</Text>
                        <View style={styles.tiposContainer}>
                            {(['descuento', 'producto_gratis', 'envio_gratis', '2x1'] as TipoCupon[]).map((tipo) => (
                                <TouchableOpacity
                                    key={tipo}
                                    style={[
                                        styles.tipoButton,
                                        formulario.tipo === tipo && styles.tipoButtonActive,
                                        { borderColor: formulario.tipo === tipo ? colorPorTipo(tipo) : DESIGN.colors.border }
                                    ]}
                                    onPress={() => actualizarCampo('tipo', tipo)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.tipoIcon}>{iconoPorTipo(tipo)}</Text>
                                    <Text style={[
                                        styles.tipoLabel,
                                        formulario.tipo === tipo && { color: colorPorTipo(tipo), fontWeight: 'bold' }
                                    ]}>
                                        {tituloPorTipo(tipo)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Valor del descuento (solo para tipo descuento) */}
                    {formulario.tipo === 'descuento' && (
                        <View style={styles.campo}>
                            <Text style={styles.label}>Valor del descuento *</Text>
                            <View style={styles.valorContainer}>
                                <TextInput
                                    style={[styles.input, styles.valorInput]}
                                    value={formulario.valor_descuento}
                                    onChangeText={(text) => actualizarCampo('valor_descuento', text)}
                                    placeholder="Ej: 20"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    keyboardType="numeric"
                                />
                                <View style={styles.porcentajeSwitch}>
                                    <Text style={styles.switchLabel}>%</Text>
                                    <Switch
                                        value={formulario.es_porcentaje}
                                        onValueChange={(value) => actualizarCampo('es_porcentaje', value)}
                                        trackColor={{ false: DESIGN.colors.border, true: colorPorTipo('descuento') }}
                                    />
                                    <Text style={styles.switchLabel}>$</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Producto ID (solo para producto gratis) */}
                    {formulario.tipo === 'producto_gratis' && (
                        <View style={styles.campo}>
                            <Text style={styles.label}>ID del producto</Text>
                            <TextInput
                                style={styles.input}
                                value={formulario.producto_id}
                                onChangeText={(text) => actualizarCampo('producto_id', text)}
                                placeholder="ID del producto gratis"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helpText}>
                                💡 El producto con este ID se agregará gratis al pedido
                            </Text>
                        </View>
                    )}

                    {/* Fechas */}
                    <View style={styles.fechasContainer}>
                        <View style={[styles.campo, styles.fechaCampo]}>
                            <Text style={styles.label}>Fecha de inicio</Text>
                            <TouchableOpacity
                                style={styles.fechaButton}
                                onPress={() => setMostrarFechaInicio(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={20} color={DESIGN.colors.textSecondary} />
                                <Text style={styles.fechaText}>
                                    {formulario.fecha_inicio.toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>
                            {mostrarFechaInicio && (
                                <DateTimePicker
                                    value={formulario.fecha_inicio}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setMostrarFechaInicio(false);
                                        if (selectedDate) {
                                            actualizarCampo('fecha_inicio', selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>

                        <View style={[styles.campo, styles.fechaCampo]}>
                            <Text style={styles.label}>Fecha de expiración</Text>
                            <TouchableOpacity
                                style={styles.fechaButton}
                                onPress={() => setMostrarFechaExpiracion(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={20} color={DESIGN.colors.textSecondary} />
                                <Text style={styles.fechaText}>
                                    {formulario.fecha_expiracion.toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>
                            {mostrarFechaExpiracion && (
                                <DateTimePicker
                                    value={formulario.fecha_expiracion}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setMostrarFechaExpiracion(false);
                                        if (selectedDate) {
                                            actualizarCampo('fecha_expiracion', selectedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    </View>

                    {/* Límites */}
                    <View style={styles.fechasContainer}>
                        <View style={[styles.campo, styles.fechaCampo]}>
                            <Text style={styles.label}>Usos por usuario</Text>
                            <TextInput
                                style={styles.input}
                                value={formulario.cantidad_maxima}
                                onChangeText={(text) => actualizarCampo('cantidad_maxima', text)}
                                placeholder="1"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helpText}>Máximo de usos por usuario</Text>
                        </View>

                        <View style={[styles.campo, styles.fechaCampo]}>
                            <Text style={styles.label}>Usos totales</Text>
                            <TextInput
                                style={styles.input}
                                value={formulario.usos_maximos}
                                onChangeText={(text) => actualizarCampo('usos_maximos', text)}
                                placeholder="Ilimitado"
                                placeholderTextColor={DESIGN.colors.textTertiary}
                                keyboardType="numeric"
                            />
                            <Text style={styles.helpText}>Dejar vacío para ilimitado</Text>
                        </View>
                    </View>

                    {/* Activo */}
                    <View style={[styles.campo, styles.activoContainer]}>
                        <View>
                            <Text style={styles.label}>Cupón activo</Text>
                            <Text style={styles.helpText}>
                                {formulario.activo ? '✅ Disponible para canjear' : '❌ No disponible'}
                            </Text>
                        </View>
                        <Switch
                            value={formulario.activo}
                            onValueChange={(value) => actualizarCampo('activo', value)}
                            trackColor={{ false: DESIGN.colors.border, true: DESIGN.colors.verde }}
                        />
                    </View>
                </View>

                {/* Botón guardar */}
                <TouchableOpacity
                    style={[styles.botonGuardar, cargando && styles.botonGuardarDisabled]}
                    onPress={handleGuardar}
                    disabled={cargando}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                        style={styles.botonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {cargando ? (
                            <ActivityIndicator color={DESIGN.colors.text} size="small" />
                        ) : (
                            <>
                                <Ionicons
                                    name={esEdicion ? "save-outline" : "add-circle-outline"}
                                    size={24}
                                    color={DESIGN.colors.text}
                                />
                                <Text style={styles.botonText}>
                                    {esEdicion ? 'Actualizar Cupón' : 'Crear Cupón'}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
        </KeyboardAvoidingView>
    );
}

// ============================================================
// 🎨 ESTILOS
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
        height: 200,
        opacity: 0.1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 8,
    },
    previewButton: {
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    previewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    previewCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    previewIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    previewInfo: {
        flex: 1,
    },
    previewTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: DESIGN.colors.text,
    },
    previewTipo: {
        fontSize: 11,
        color: DESIGN.colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    previewDescripcion: {
        fontSize: 13,
        color: DESIGN.colors.textSecondary,
        marginBottom: 8,
    },
    previewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    previewDescuento: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    previewCodigo: {
        fontSize: 12,
        color: DESIGN.colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 1,
    },
    formCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        marginBottom: 16,
    },
    campo: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: DESIGN.colors.text,
        marginBottom: 6,
    },
    input: {
        backgroundColor: DESIGN.colors.fondo,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: DESIGN.colors.text,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    helpText: {
        fontSize: 11,
        color: DESIGN.colors.textTertiary,
        marginTop: 4,
    },
    tiposContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tipoButton: {
        flex: 1,
        minWidth: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 2,
        backgroundColor: DESIGN.colors.fondo,
    },
    tipoButtonActive: {
        backgroundColor: 'rgba(245, 197, 24, 0.08)',
        borderWidth: 2,
    },
    tipoIcon: {
        fontSize: 18,
    },
    tipoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
    },
    valorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    valorInput: {
        flex: 1,
    },
    porcentajeSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: DESIGN.colors.textSecondary,
    },
    fechasContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    fechaCampo: {
        flex: 1,
    },
    fechaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: DESIGN.colors.fondo,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    fechaText: {
        fontSize: 15,
        color: DESIGN.colors.text,
    },
    activoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    botonGuardar: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: DESIGN.colors.accentSecondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 20,
    },
    botonGuardarDisabled: {
        opacity: 0.6,
    },
    botonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    botonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DESIGN.colors.text,
    },
});