/* // screens/admin/PantallaGestionCupones.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cuponService } from '../../lib/cupones/cuponService';
import { Cupon, TipoCupon, CrearCuponDTO } from '../../lib/cupones/cuponTypes';
import { Colores } from '../../lib/colores';
import { generarDatosQR, generarUrlCupon } from '../../lib/cupones/generadorQR';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';

// Componente de tarjeta de cupón para admin
const CuponAdminCard = ({ cupon, onPress, onToggle, onDelete }: any) => {
    const expirado = new Date(cupon.fecha_expiracion) < new Date();
    const activo = cupon.activo && !expirado;

    return (
        <TouchableOpacity
            style={[styles.adminCuponCard, !activo && styles.adminCuponCardInactivo]}
            onPress={() => onPress(cupon)}
            activeOpacity={0.7}
        >
            <View style={styles.adminCuponHeader}>
                <View style={styles.adminCuponInfo}>
                    <Text style={[styles.adminCuponTitulo, !activo && styles.adminCuponTituloInactivo]}>
                        {cupon.titulo}
                    </Text>
                    <Text style={styles.adminCuponCodigo}>{cupon.codigo}</Text>
                </View>
                <View style={[styles.adminCuponEstado, activo ? styles.adminCuponEstadoActivo : styles.adminCuponEstadoInactivo]}>
                    <Text style={styles.adminCuponEstadoTexto}>
                        {activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            <View style={styles.adminCuponBody}>
                <Text style={styles.adminCuponTipo}>
                    {cupon.tipo === 'descuento' && '💰 Descuento'}
                    {cupon.tipo === 'producto_gratis' && '🎁 Producto Gratis'}
                    {cupon.tipo === 'envio_gratis' && '📦 Envío Gratis'}
                    {cupon.tipo === '2x1' && '🔄 2x1'}
                </Text>
                <Text style={styles.adminCuponValor}>
                    {cuponService.formatearDescuento(cupon)}
                </Text>
            </View>

            <View style={styles.adminCuponFooter}>
                <Text style={styles.adminCuponUsos}>
                    Usos: {cupon.usos_totales}{cupon.usos_maximos ? ` / ${cupon.usos_maximos}` : ''}
                </Text>
                <Text style={styles.adminCuponFecha}>
                    Expira: {new Date(cupon.fecha_expiracion).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.adminCuponActions}>
                <TouchableOpacity
                    style={[styles.adminActionButton, styles.adminActionToggle]}
                    onPress={() => onToggle(cupon)}
                >
                    <Ionicons
                        name={cupon.activo ? 'eye-outline' : 'eye-off-outline'}
                        size={18}
                        color={cupon.activo ? '#4CAF50' : Colores.textoGris}
                    />
                    <Text style={[styles.adminActionText, cupon.activo ? styles.adminActionTextActivo : styles.adminActionTextInactivo]}>
                        {cupon.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.adminActionButton, styles.adminActionDelete]}
                    onPress={() => onDelete(cupon)}
                >
                    <Ionicons name="trash-outline" size={18} color={Colores.primario} />
                    <Text style={styles.adminActionTextDelete}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default function PantallaGestionCupones({ navigation }: any) {
    const { perfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState<Cupon | null>(null);

    // Estado del formulario
    const [form, setForm] = useState<CrearCuponDTO>({
        titulo: '',
        descripcion: '',
        tipo: 'descuento',
        valor_descuento: 10,
        es_porcentaje: true,
        cantidad_maxima: 1,
        usos_maximos: undefined,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activo: true,
    });

    const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
    const [mostrarFechaExpiracion, setMostrarFechaExpiracion] = useState(false);

    const cargarCupones = useCallback(async () => {
        try {
            const data = await cuponService.obtenerCupones();
            setCupones(data);
        } catch (err) {
            console.error('Error cargando cupones:', err);
            Alert.alert('Error', 'No se pudieron cargar los cupones');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, []);

    useEffect(() => {
        cargarCupones();
    }, [cargarCupones]);

    const onRefresh = () => {
        setRefrescando(true);
        cargarCupones();
    };

    // ✅ Crear o actualizar cupón
    const handleGuardarCupon = async () => {
        // Validaciones
        if (!form.titulo.trim()) {
            Alert.alert('Error', 'El título es obligatorio');
            return;
        }
        if (!form.fecha_inicio || !form.fecha_expiracion) {
            Alert.alert('Error', 'Las fechas son obligatorias');
            return;
        }
        if (new Date(form.fecha_expiracion) <= new Date(form.fecha_inicio)) {
            Alert.alert('Error', 'La fecha de expiración debe ser posterior a la fecha de inicio');
            return;
        }
        if (form.tipo === 'descuento' && !form.valor_descuento) {
            Alert.alert('Error', 'El valor del descuento es obligatorio');
            return;
        }

        try {
            let resultado;
            if (editando) {
                resultado = await cuponService.actualizarCupon(editando.id, form);
            } else {
                resultado = await cuponService.crearCupon(form);
            }

            if (resultado.success) {
                Alert.alert('Éxito', editando ? 'Cupón actualizado' : 'Cupón creado');
                setModalVisible(false);
                setEditando(null);
                resetForm();
                cargarCupones();
            } else {
                Alert.alert('Error', resultado.error || 'Error al guardar el cupón');
            }
        } catch (err) {
            console.error('Error guardando cupón:', err);
            Alert.alert('Error', 'Error al guardar el cupón');
        }
    };

    // ✅ Eliminar cupón
    const handleEliminarCupon = (cupon: Cupon) => {
        Alert.alert(
            'Eliminar cupón',
            `¿Estás seguro que quieres eliminar "${cupon.titulo}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const resultado = await cuponService.eliminarCupon(cupon.id);
                        if (resultado.success) {
                            Alert.alert('Éxito', 'Cupón eliminado');
                            cargarCupones();
                        } else {
                            Alert.alert('Error', resultado.error || 'Error al eliminar');
                        }
                    },
                },
            ]
        );
    };

    // ✅ Toggle activo/inactivo
    const handleToggleCupon = async (cupon: Cupon) => {
        const resultado = await cuponService.actualizarCupon(cupon.id, {
            activo: !cupon.activo,
        });
        if (resultado.success) {
            cargarCupones();
        } else {
            Alert.alert('Error', resultado.error || 'Error al actualizar');
        }
    };

    const resetForm = () => {
        setForm({
            titulo: '',
            descripcion: '',
            tipo: 'descuento',
            valor_descuento: 10,
            es_porcentaje: true,
            cantidad_maxima: 1,
            usos_maximos: undefined,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            activo: true,
        });
        setEditando(null);
    };

    const abrirModalEdicion = (cupon?: Cupon) => {
        if (cupon) {
            setEditando(cupon);
            setForm({
                titulo: cupon.titulo,
                descripcion: cupon.descripcion || '',
                tipo: cupon.tipo,
                valor_descuento: cupon.valor_descuento || undefined,
                es_porcentaje: cupon.es_porcentaje,
                cantidad_maxima: cupon.cantidad_maxima,
                usos_maximos: cupon.usos_maximos || undefined,
                fecha_inicio: cupon.fecha_inicio.split('T')[0],
                fecha_expiracion: cupon.fecha_expiracion.split('T')[0],
                activo: cupon.activo,
            });
        } else {
            resetForm();
        }
        setModalVisible(true);
    };

    if (cargando) {
        return (
            <View style={[styles.centrado, { backgroundColor: Colores.fondoOscuro }]}>
                <ActivityIndicator size="large" color={Colores.secundario} />
                <Text style={styles.cargandoTexto}>Cargando cupones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colores.primario, Colores.secundario, Colores.fondoOscuro]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={[Colores.secundario]} />}
            >
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>🏷️ Gestionar Cupones</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => abrirModalEdicion()}
                    >
                        <Ionicons name="add" size={28} color={Colores.textoOscuro} />
                    </TouchableOpacity>
                </View>

                {/* Estadísticas *
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumero}>{cupones.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumero, { color: '#4CAF50' }]}>
                            {cupones.filter(c => c.activo && new Date(c.fecha_expiracion) > new Date()).length}
                        </Text>
                        <Text style={styles.statLabel}>Activos</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumero, { color: Colores.primario }]}>
                            {cupones.filter(c => !c.activo || new Date(c.fecha_expiracion) < new Date()).length}
                        </Text>
                        <Text style={styles.statLabel}>Inactivos</Text>
                    </View>
                </View>

                {/* Lista de cupones }
                {cupones.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="ticket-outline" size={64} color={Colores.textoGris + '40'} />
                        <Text style={styles.emptyTitle}>No hay cupones</Text>
                        <Text style={styles.emptyText}>Crea tu primer cupón para empezar a ofrecer promociones</Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => abrirModalEdicion()}
                        >
                            <Text style={styles.emptyButtonText}>Crear cupón</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.cuponesList}>
                        {cupones.map((cupon) => (
                            <CuponAdminCard
                                key={cupon.id}
                                cupon={cupon}
                                onPress={(c: Cupon) => {
                                    navigation.navigate('DetalleCuponAdmin', { cuponId: c.id });
                                }}
                                onToggle={handleToggleCupon}
                                onDelete={handleEliminarCupon}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* ✅ Modal de Crear/Editar }
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    setEditando(null);
                    resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editando ? '✏️ Editar Cupón' : '🎫 Nuevo Cupón'}
                            </Text>

                            {/* Título }
                            <Text style={styles.modalLabel}>Título *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={form.titulo}
                                onChangeText={(text) => setForm({ ...form, titulo: text })}
                                placeholder="Ej: 20% de descuento en hamburguesas"
                                placeholderTextColor={Colores.textoGris + '40'}
                            />

                            {/* Descripción }
                            <Text style={styles.modalLabel}>Descripción</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalInputMultiline]}
                                value={form.descripcion}
                                onChangeText={(text) => setForm({ ...form, descripcion: text })}
                                placeholder="Descripción del cupón"
                                placeholderTextColor={Colores.textoGris + '40'}
                                multiline
                                numberOfLines={3}
                            />

                            {/* Tipo }
                            <Text style={styles.modalLabel}>Tipo de cupón *</Text>
                            <View style={styles.modalTipoContainer}>
                                {(['descuento', 'producto_gratis', 'envio_gratis', '2x1'] as TipoCupon[]).map((tipo) => (
                                    <TouchableOpacity
                                        key={tipo}
                                        style={[
                                            styles.modalTipoBoton,
                                            form.tipo === tipo && styles.modalTipoBotonActivo,
                                        ]}
                                        onPress={() => setForm({ ...form, tipo })}
                                    >
                                        <Text style={[styles.modalTipoTexto, form.tipo === tipo && styles.modalTipoTextoActivo]}>
                                            {tipo === 'descuento' && '💰 Descuento'}
                                            {tipo === 'producto_gratis' && '🎁 Gratis'}
                                            {tipo === 'envio_gratis' && '📦 Envío'}
                                            {tipo === '2x1' && '🔄 2x1'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Valor del descuento (solo para descuento) }
                            {form.tipo === 'descuento' && (
                                <>
                                    <Text style={styles.modalLabel}>Valor del descuento *</Text>
                                    <View style={styles.modalValorContainer}>
                                        <TextInput
                                            style={[styles.modalInput, styles.modalInputValor]}
                                            value={form.valor_descuento?.toString() || ''}
                                            onChangeText={(text) => setForm({ ...form, valor_descuento: parseFloat(text) || 0 })}
                                            keyboardType="numeric"
                                            placeholder="10"
                                            placeholderTextColor={Colores.textoGris + '40'}
                                        />
                                        <View style={styles.modalValorTipoContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.modalValorTipo,
                                                    form.es_porcentaje && styles.modalValorTipoActivo,
                                                ]}
                                                onPress={() => setForm({ ...form, es_porcentaje: true })}
                                            >
                                                <Text style={[styles.modalValorTipoTexto, form.es_porcentaje && styles.modalValorTipoTextoActivo]}>
                                                    %
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.modalValorTipo,
                                                    !form.es_porcentaje && styles.modalValorTipoActivo,
                                                ]}
                                                onPress={() => setForm({ ...form, es_porcentaje: false })}
                                            >
                                                <Text style={[styles.modalValorTipoTexto, !form.es_porcentaje && styles.modalValorTipoTextoActivo]}>
                                                    $
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Límites }
                            <View style={styles.modalRow}>
                                <View style={styles.modalCol}>
                                    <Text style={styles.modalLabel}>Por usuario</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={form.cantidad_maxima?.toString() || ''}
                                        onChangeText={(text) => setForm({ ...form, cantidad_maxima: parseInt(text) || 1 })}
                                        keyboardType="numeric"
                                        placeholder="1"
                                        placeholderTextColor={Colores.textoGris + '40'}
                                    />
                                </View>
                                <View style={styles.modalCol}>
                                    <Text style={styles.modalLabel}>Usos totales</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={form.usos_maximos?.toString() || ''}
                                        onChangeText={(text) => setForm({ ...form, usos_maximos: text ? parseInt(text) : undefined })}
                                        keyboardType="numeric"
                                        placeholder="Ilimitado"
                                        placeholderTextColor={Colores.textoGris + '40'}
                                    />
                                </View>
                            </View>

                            {/* Fechas }
                            <View style={styles.modalRow}>
                                <View style={styles.modalCol}>
                                    <Text style={styles.modalLabel}>Fecha inicio *</Text>
                                    <TouchableOpacity
                                        style={styles.modalDateButton}
                                        onPress={() => setMostrarFechaInicio(true)}
                                    >
                                        <Text style={styles.modalDateText}>
                                            {form.fecha_inicio ? new Date(form.fecha_inicio).toLocaleDateString() : 'Seleccionar'}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={20} color={Colores.textoGris} />
                                    </TouchableOpacity>
                                    {mostrarFechaInicio && (
                                        <DateTimePicker
                                            value={new Date(form.fecha_inicio || Date.now())}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setMostrarFechaInicio(false);
                                                if (selectedDate) {
                                                    setForm({ ...form, fecha_inicio: selectedDate.toISOString().split('T')[0] });
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                                <View style={styles.modalCol}>
                                    <Text style={styles.modalLabel}>Fecha expiración *</Text>
                                    <TouchableOpacity
                                        style={styles.modalDateButton}
                                        onPress={() => setMostrarFechaExpiracion(true)}
                                    >
                                        <Text style={styles.modalDateText}>
                                            {form.fecha_expiracion ? new Date(form.fecha_expiracion).toLocaleDateString() : 'Seleccionar'}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={20} color={Colores.textoGris} />
                                    </TouchableOpacity>
                                    {mostrarFechaExpiracion && (
                                        <DateTimePicker
                                            value={new Date(form.fecha_expiracion || Date.now())}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                setMostrarFechaExpiracion(false);
                                                if (selectedDate) {
                                                    setForm({ ...form, fecha_expiracion: selectedDate.toISOString().split('T')[0] });
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Activo }
                            <View style={styles.modalSwitchContainer}>
                                <Text style={styles.modalLabel}>Cupón activo</Text>
                                <Switch
                                    value={form.activo !== false}
                                    onValueChange={(value) => setForm({ ...form, activo: value })}
                                    trackColor={{ false: '#333', true: Colores.secundario + '80' }}
                                    thumbColor={form.activo !== false ? Colores.secundario : '#888'}
                                />
                            </View>

                            {/* Botones }
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonCancel]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        setEditando(null);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonSave]}
                                    onPress={handleGuardarCupon}
                                >
                                    <Text style={styles.modalButtonSaveText}>
                                        {editando ? 'Actualizar' : 'Crear'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colores.fondoOscuro,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
        opacity: 0.2,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colores.fondoOscuro,
    },
    cargandoTexto: {
        color: Colores.textoGris,
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: Colores.secundario,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumero: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: Colores.textoGris,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    // Admin Cupon Card
    adminCuponCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    adminCuponCardInactivo: {
        opacity: 0.5,
    },
    adminCuponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    adminCuponInfo: {
        flex: 1,
    },
    adminCuponTitulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    adminCuponTituloInactivo: {
        color: Colores.textoGris,
    },
    adminCuponCodigo: {
        fontSize: 12,
        color: Colores.textoGris,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    adminCuponEstado: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    adminCuponEstadoActivo: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    adminCuponEstadoInactivo: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    adminCuponEstadoTexto: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    adminCuponBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    adminCuponTipo: {
        fontSize: 13,
        color: Colores.textoGris,
    },
    adminCuponValor: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colores.secundario,
    },
    adminCuponFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    adminCuponUsos: {
        fontSize: 12,
        color: Colores.textoGris,
    },
    adminCuponFecha: {
        fontSize: 12,
        color: Colores.textoGris,
    },
    adminCuponActions: {
        flexDirection: 'row',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 12,
    },
    adminActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    adminActionToggle: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    adminActionDelete: {
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
    },
    adminActionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    adminActionTextActivo: {
        color: '#4CAF50',
    },
    adminActionTextInactivo: {
        color: Colores.textoGris,
    },
    adminActionTextDelete: {
        color: Colores.primario,
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colores.textoGris,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    emptyButton: {
        marginTop: 24,
        backgroundColor: Colores.secundario,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 14,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoOscuro,
    },
    cuponesList: {
        paddingBottom: 20,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colores.fondoOscuro,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalInputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalInputValor: {
        flex: 1,
    },
    modalTipoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    modalTipoBoton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalTipoBotonActivo: {
        backgroundColor: Colores.secundario + '30',
        borderColor: Colores.secundario,
    },
    modalTipoTexto: {
        fontSize: 13,
        color: Colores.textoGris,
    },
    modalTipoTextoActivo: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    modalValorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalValorTipoContainer: {
        flexDirection: 'row',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalValorTipo: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    modalValorTipoActivo: {
        backgroundColor: Colores.secundario + '30',
    },
    modalValorTipoTexto: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoGris,
    },
    modalValorTipoTextoActivo: {
        color: '#FFFFFF',
    },
    modalRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCol: {
        flex: 1,
    },
    modalDateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalDateText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    modalSwitchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalButtonSave: {
        backgroundColor: Colores.secundario,
    },
    modalButtonCancelText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colores.textoGris,
    },
    modalButtonSaveText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoOscuro,
    },
});*/