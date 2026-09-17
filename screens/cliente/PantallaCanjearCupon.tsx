// screens/cliente/PantallaCanjearCupon.tsx - CON TEMA CLARO Y SIMPSONFONT
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

import { cuponService } from '../../lib/cupones/cuponService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO, useResponsive } from '../../lib/colores';
import { Toast, useToast } from '../../components/Toast';
import CuponQR from '../../components/cupones/CuponQR';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';
import { FUENTES } from '../../lib/fuentes';

// ✅ TIPADO DE NAVEGACIÓN
type RootStackParamList = {
    Login: undefined;
    Registro: undefined;
    MisCupones: undefined;
    Carrito: { cuponAplicado?: any };
    CanjearCupon: { codigo?: string };
};

type Navigation = {
    navigate: <T extends keyof RootStackParamList>(
        screen: T,
        params?: RootStackParamList[T]
    ) => void;
    goBack: () => void;
    replace: (screen: keyof RootStackParamList, params?: any) => void;
};

export default function PantallaCanjearCupon() {
    // ✅ NUEVO: sesion + cargandoAuth
    const { perfil, sesion, cargando: cargandoAuth } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const navigation = useNavigation<Navigation>();
    const route = useRoute();

    // ============================================================
    // 🔔 Toast
    // ============================================================
    const {
        visible,
        mensaje,
        tipo,
        ocultar,
        exito,
        error: toastError,
        advertencia,
    } = useToast();

    // ============================================================
    // ✅ Estados
    // ============================================================
    const [codigo, setCodigo] = useState('');
    const [scaneando, setScaneando] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [resultadoCanje, setResultadoCanje] = useState<any>(null);

    // ✅ Estados para mostrar cupones disponibles
    const [cuponesDisponibles, setCuponesDisponibles] = useState<CuponUsuario[]>([]);
    const [cargandoCupones, setCargandoCupones] = useState(false);
    const [mostrarCupones, setMostrarCupones] = useState(true);

    // ============================================================
    // 📋 Obtener parámetros de deep link
    // ============================================================
    const params = route.params as { codigo?: string } || {};
    const codigoInicial = params.codigo || '';

    // ============================================================
    // 🔒 GUARD DE SESIÓN
    // ============================================================
    useEffect(() => {
        if (!cargandoAuth && !sesion) {
            Alert.alert(
                'Iniciá sesión',
                'Necesitás una cuenta para canjear cupones.',
                [
                    {
                        text: 'Volver',
                        style: 'cancel',
                        onPress: () => navigation.goBack(),
                    },
                    {
                        text: 'Iniciar sesión',
                        onPress: () => navigation.replace('Login'),
                    },
                    {
                        text: 'Registrarme',
                        onPress: () => navigation.replace('Registro'),
                    },
                ],
                { cancelable: false }
            );
        }
    }, [sesion, cargandoAuth]);

    // ============================================================
    // 📋 Cargar cupones disponibles del usuario
    // ============================================================
    const cargarCuponesDisponibles = useCallback(async () => {
        if (!perfil?.id) {
            setCuponesDisponibles([]);
            return;
        }

        setCargandoCupones(true);
        try {
            const data = await cuponService.obtenerCuponesDisponibles(perfil.id);
            setCuponesDisponibles(data);
        } catch (error) {
            console.error('Error cargando cupones disponibles:', error);
        } finally {
            setCargandoCupones(false);
        }
    }, [perfil?.id]);

    // ✅ FIX: useFocusEffect ahora depende de perfil?.id para re-cargar si cambia
    useFocusEffect(
        useCallback(() => {
            if (perfil?.id) {
                cargarCuponesDisponibles();
            }
        }, [perfil?.id, cargarCuponesDisponibles])
    );

    // ============================================================
    // ✅ PROCESAR DEEP LINK AUTOMÁTICAMENTE
    // ============================================================
    useEffect(() => {
        // ✅ Solo si hay sesión
        if (codigoInicial && sesion) {
            setCodigo(codigoInicial);

            const timer = setTimeout(() => {
                handleCanjear(codigoInicial);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [codigoInicial, sesion]);

    // ============================================================
    // 📋 Copiar código al portapapeles
    // ============================================================
    const copiarCodigo = async (codigoACopiar: string) => {
        try {
            await Clipboard.setStringAsync(codigoACopiar);
            exito(`✅ Código ${codigoACopiar} copiado`);
        } catch (error) {
            console.error('Error copiando:', error);
            toastError('No se pudo copiar el código');
        }
    };

    // ============================================================
    // 🎫 Canjear / reservar cupón
    // ============================================================
    const handleCanjear = async (codigoRecibido?: string) => {
        const codigoParaCanjear = (codigoRecibido !== undefined ? codigoRecibido : codigo)
            .trim()
            .toUpperCase();

        if (!codigoParaCanjear) {
            advertencia('Ingresá o escaneá un código de cupón');
            return;
        }

        if (!perfil?.id) {
            Alert.alert(
                'Iniciá sesión',
                'Debés iniciar sesión para canjear cupones',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Iniciar sesión',
                        onPress: () => navigation.navigate('Login'),
                    },
                ]
            );
            return;
        }

        if (cargando) return;

        setCargando(true);

        try {
            const resultado = await cuponService.canjearCupon({
                codigo: codigoParaCanjear,
                usuarioId: perfil.id,
            });

            setResultadoCanje(resultado);
            setModalVisible(true);

            if (resultado.success) {
                exito(resultado.mensaje || 'Cupón disponible');
                setCodigo('');
                await cargarCuponesDisponibles();
            } else {
                toastError(resultado.mensaje || 'No se pudo canjear el cupón');
            }
        } catch (err) {
            console.error('❌ Error canjeando cupón:', err);
            setResultadoCanje({
                success: false,
                mensaje: 'Error al canjear el cupón',
            });
            setModalVisible(true);
            toastError('Error al canjear el cupón');
        } finally {
            setCargando(false);
        }
    };

    // ============================================================
    // 📷 Abrir escáner
    // ============================================================
    const abrirScanner = () => {
        if (cargando) return;
        setModalVisible(false);
        setResultadoCanje(null);
        setScaneando(true);
    };

    // ============================================================
    // 📷 Código detectado por CuponQR
    // ============================================================
    const handleCodigoDetectado = (codigoDetectado: string) => {
        const codigoLimpio = codigoDetectado.trim().toUpperCase();
        if (!codigoLimpio) return;

        setCodigo(codigoLimpio);
        setScaneando(false);

        setTimeout(() => {
            handleCanjear(codigoLimpio);
        }, 250);
    };

    // ============================================================
    // ❌ Cerrar modal
    // ============================================================
    const cerrarModal = () => {
        setModalVisible(false);
        setResultadoCanje(null);
        setCodigo('');
    };

    // ============================================================
    // 🛒 Ir al carrito con el cupón
    // ============================================================
    const irAlCarrito = () => {
        if (!resultadoCanje?.success || !resultadoCanje?.cupon) {
            cerrarModal();
            return;
        }

        const cupon = resultadoCanje.cupon;

        setModalVisible(false);
        setResultadoCanje(null);
        setCodigo('');

        navigation.navigate('Carrito', { cuponAplicado: cupon });
    };

    // ============================================================
    // 🔒 RENDER TEMPRANO: invitado o cargando auth → spinner
    // ============================================================
    if (cargandoAuth || !sesion) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={{
                    fontFamily: FUENTES.display,
                    marginTop: 16,
                    color: DISENO.colors.textSecondary,
                    fontSize: 14,
                }}>
                    {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
                </Text>
            </View>
        );
    }

    // ============================================================
    // 📷 Pantalla del escáner
    // ============================================================
    if (scaneando) {
        return (
            <CuponQR
                onCodigoDetectado={handleCodigoDetectado}
                onCerrar={() => setScaneando(false)}
            />
        );
    }

    // ============================================================
    // 🎨 Render cupón disponible
    // ============================================================
    const renderCuponDisponible = ({ item }: { item: CuponUsuario }) => {
        const cupon = item.cupon;
        if (!cupon) return null;

        const tipoIcono = cupon.tipo === 'descuento' ? '🏷️' :
            cupon.tipo === 'envio_gratis' ? '🚚' :
                cupon.tipo === 'producto_gratis' ? '🎁' : '🎫';

        const tipoColor =
            cupon.tipo === 'descuento' ? DISENO.colors.success :
                cupon.tipo === 'producto_gratis' ? DISENO.colors.warning :
                    cupon.tipo === 'envio_gratis' ? DISENO.colors.info :
                        DISENO.colors.morado;

        return (
            <TouchableOpacity
                style={[
                    styles.cuponDisponibleCard,
                    { borderLeftColor: tipoColor, borderLeftWidth: 4 }
                ]}
                onPress={() => {
                    setCodigo(cupon.codigo);
                    handleCanjear(cupon.codigo);
                }}
                activeOpacity={0.7}
            >
                <View style={styles.cuponDisponibleHeader}>
                    <View style={[styles.cuponDisponibleIconWrapper, { backgroundColor: tipoColor + '20' }]}>
                        <Text style={styles.cuponDisponibleIcon}>{tipoIcono}</Text>
                    </View>
                    <Text style={styles.cuponDisponibleTitulo} numberOfLines={1}>
                        {cupon.titulo}
                    </Text>
                </View>

                <View style={styles.cuponDisponibleFooter}>
                    <View style={styles.cuponDisponibleCodigoContainer}>
                        <Text style={styles.cuponDisponibleCodigoLabel}>CÓDIGO</Text>
                        <Text style={styles.cuponDisponibleCodigo}>
                            {cupon.codigo}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.cuponDisponibleCopiar}
                        onPress={() => copiarCodigo(cupon.codigo)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="copy-outline" size={16} color={DISENO.colors.accent} />
                        <Text style={styles.cuponDisponibleCopiarText}>Copiar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // ============================================================
    // 🖥️ Pantalla principal
    // ============================================================
    const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
    const cardPadding = responsive.getValor({ tablet: 28, normal: 20, small: 16 });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 40,
                        paddingHorizontal: paddingHorizontal,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={26} color={DISENO.colors.text} />
                    </TouchableOpacity>

                    <Text style={[
                        styles.title,
                        { fontSize: responsive.getValor({ tablet: 22, normal: 19, small: 16 }) }
                    ]}>
                        🎫 Canjear Cupón
                    </Text>

                    <View style={{ width: 26 }} />
                </View>

                {/* ✅ INDICADOR DE DEEP LINK */}
                {codigoInicial && (
                    <View style={styles.deepLinkIndicator}>
                        <Ionicons name="link-outline" size={18} color={DISENO.colors.accentSecondary} />
                        <Text style={styles.deepLinkIndicatorText}>
                            Cupón recibido: {codigoInicial}
                        </Text>
                    </View>
                )}

                {/* TARJETA DE CANJE */}
                <View style={[styles.card, { padding: cardPadding }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIcon}>
                            <Ionicons name="gift" size={28} color={DISENO.colors.surface} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Ingresá el código</Text>
                            <Text style={styles.cardSubtitle}>
                                Escaneá un QR o ingresá el código manualmente
                            </Text>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="keypad-outline" size={20} color={DISENO.colors.accent} />
                        <TextInput
                            style={styles.input}
                            value={codigo}
                            onChangeText={setCodigo}
                            placeholder="Ej: KB8X7K9L2"
                            placeholderTextColor={DISENO.colors.textTertiary}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={10}
                            editable={!cargando}
                        />
                        {codigo.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setCodigo('')}
                                style={styles.clearButton}
                                disabled={cargando}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle" size={20} color={DISENO.colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.buttonsRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonScan]}
                            onPress={abrirScanner}
                            disabled={cargando}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="scan-outline" size={22} color={DISENO.colors.accent} />
                            <Text style={[styles.buttonText, styles.buttonTextScan]}>
                                Escanear QR
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonCanjear,
                                (cargando || !codigo.trim()) && styles.buttonDisabled,
                            ]}
                            onPress={() => handleCanjear()}
                            disabled={cargando || !codigo.trim()}
                            activeOpacity={0.7}
                        >
                            {cargando ? (
                                <ActivityIndicator size="small" color={DISENO.colors.surface} />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color={DISENO.colors.surface} />
                                    <Text style={[styles.buttonText, styles.buttonTextCanjear]}>
                                        Canjear
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CUPONES DISPONIBLES */}
                {perfil?.id && (
                    <View style={styles.cuponesDisponiblesContainer}>
                        <TouchableOpacity
                            style={styles.cuponesDisponiblesHeader}
                            onPress={() => setMostrarCupones(!mostrarCupones)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cuponesDisponiblesHeaderLeft}>
                                <Ionicons name="ticket" size={22} color={DISENO.colors.accentSecondary} />
                                <Text style={styles.cuponesDisponiblesHeaderText}>
                                    Tus cupones disponibles
                                </Text>
                                <View style={styles.cuponesDisponiblesBadge}>
                                    <Text style={styles.cuponesDisponiblesBadgeText}>
                                        {cuponesDisponibles.length}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name={mostrarCupones ? 'chevron-up' : 'chevron-down'}
                                size={22}
                                color={DISENO.colors.textSecondary}
                            />
                        </TouchableOpacity>

                        {mostrarCupones && (
                            <View style={styles.cuponesDisponiblesList}>
                                {cargandoCupones ? (
                                    <View style={styles.cuponesLoading}>
                                        <ActivityIndicator size="small" color={DISENO.colors.accent} />
                                        <Text style={styles.cuponesLoadingText}>
                                            Cargando tus cupones...
                                        </Text>
                                    </View>
                                ) : cuponesDisponibles.length === 0 ? (
                                    <View style={styles.cuponesEmpty}>
                                        <Ionicons name="ticket-outline" size={40} color={DISENO.colors.textTertiary} />
                                        <Text style={styles.cuponesEmptyText}>
                                            No tienes cupones disponibles
                                        </Text>
                                        <Text style={styles.cuponesEmptySubtext}>
                                            Escaneá un QR o ingresá un código para canjear uno
                                        </Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={cuponesDisponibles}
                                        keyExtractor={(item) => item.id.toString()}
                                        renderItem={renderCuponDisponible}
                                        scrollEnabled={false}
                                        contentContainerStyle={styles.cuponesListContent}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* TIPS */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>💡 ¿Cómo funciona?</Text>

                    <View style={styles.tipItem}>
                        <View style={[styles.tipIconWrapper, { backgroundColor: DISENO.colors.accent + '15' }]}>
                            <Ionicons name="qr-code-outline" size={18} color={DISENO.colors.accent} />
                        </View>
                        <Text style={styles.tipText}>
                            Escaneá el código QR que recibiste en tu cupón físico o digital
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <View style={[styles.tipIconWrapper, { backgroundColor: DISENO.colors.accentSecondary + '20' }]}>
                            <Ionicons name="keypad-outline" size={18} color={DISENO.colors.accentSecondary} />
                        </View>
                        <Text style={styles.tipText}>
                            O ingresá manualmente el código de 10 caracteres
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <View style={[styles.tipIconWrapper, { backgroundColor: DISENO.colors.success + '15' }]}>
                            <Ionicons name="copy-outline" size={18} color={DISENO.colors.success} />
                        </View>
                        <Text style={styles.tipText}>
                            Copiá el código desde "Tus cupones disponibles" y pegálo aquí
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <View style={[styles.tipIconWrapper, { backgroundColor: DISENO.colors.info + '15' }]}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={DISENO.colors.info} />
                        </View>
                        <Text style={styles.tipText}>
                            El cupón se aplicará automáticamente a tu pedido al confirmar la compra
                        </Text>
                    </View>
                </View>

                {/* HISTORIAL */}
                <TouchableOpacity
                    style={styles.historialButton}
                    onPress={() => navigation.navigate('MisCupones')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="time-outline" size={22} color={DISENO.colors.text} />
                    <Text style={styles.historialText}>Ver mis cupones</Text>
                    <Ionicons name="chevron-forward" size={20} color={DISENO.colors.textSecondary} />
                </TouchableOpacity>
            </ScrollView>

            {/* MODAL DE RESULTADO */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { padding: responsive.getValor({ tablet: 40, normal: 28, small: 20 }) }]}>
                        {resultadoCanje?.success ? (
                            <>
                                <View style={styles.modalSuccessIcon}>
                                    <Ionicons name="checkmark-circle" size={60} color={DISENO.colors.success} />
                                </View>

                                <Text style={styles.modalTitle}>¡Cupón disponible! 🎉</Text>

                                <Text style={styles.modalMessage}>
                                    {resultadoCanje.mensaje || 'El cupón está listo para utilizarse.'}
                                </Text>

                                {resultadoCanje.cupon && (
                                    <View style={styles.modalCuponInfo}>
                                        <Text style={styles.modalCuponTitulo}>
                                            {resultadoCanje.cupon.titulo}
                                        </Text>

                                        <View style={styles.modalCuponCodigoContainer}>
                                            <Text style={styles.modalCuponCodigo}>
                                                {resultadoCanje.cupon.codigo}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.modalCuponCopiar}
                                                onPress={() => copiarCodigo(resultadoCanje.cupon.codigo)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="copy-outline" size={16} color={DISENO.colors.accent} />
                                                <Text style={styles.modalCuponCopiarText}>Copiar</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={styles.modalCuponDetalle}>
                                            {cuponService.formatearDescuento(resultadoCanje.cupon)}
                                        </Text>

                                        {resultadoCanje.cupon.tipo === 'descuento' &&
                                            resultadoCanje.cupon.valor_descuento !== null &&
                                            resultadoCanje.cupon.valor_descuento !== undefined && (
                                                <Text style={styles.modalCuponValor}>
                                                    {resultadoCanje.cupon.es_porcentaje
                                                        ? `${resultadoCanje.cupon.valor_descuento}% de descuento`
                                                        : `$${Number(resultadoCanje.cupon.valor_descuento).toFixed(2)} de descuento`}
                                                </Text>
                                            )}

                                        {resultadoCanje.producto_gratis && (
                                            <Text style={styles.modalCuponValor}>
                                                🎁 {resultadoCanje.producto_gratis.nombre} gratis
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={irAlCarrito}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="cart-outline" size={22} color={DISENO.colors.surface} />
                                    <Text style={styles.modalButtonText}>Ir al carrito</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalSecondaryButton}
                                    onPress={cerrarModal}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalSecondaryButtonText}>
                                        Seguir viendo cupones
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.modalErrorIcon}>
                                    <Ionicons name="close-circle" size={60} color={DISENO.colors.danger} />
                                </View>

                                <Text style={styles.modalTitle}>No se pudo canjear 😕</Text>

                                <Text style={styles.modalMessage}>
                                    {resultadoCanje?.mensaje || 'Error al canjear el cupón'}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonError]}
                                    onPress={cerrarModal}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.modalButtonText, styles.modalButtonTextError]}>
                                        Intentar de nuevo
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* TOAST */}
            <Toast visible={visible} mensaje={mensaje} tipo={tipo} ocultar={ocultar} />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - TEMA CLARO Y COLORIDO
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DISENO.colors.fondo,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scroll: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 8,
    },
    backButton: {
        padding: 10,
        borderRadius: 14,
        backgroundColor: DISENO.colors.surface,
        ...DISENO.shadow.sm,
    },
    title: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.amarillo,
        letterSpacing: 0.5,
    },
    deepLinkIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DISENO.colors.accentSecondary + '15',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: DISENO.colors.accentSecondary + '30',
    },
    deepLinkIndicatorText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.accentSecondary,
        fontWeight: '500',
        flex: 1,
    },
    card: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: 16,
        ...DISENO.shadow.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    cardHeaderIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: DISENO.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        ...DISENO.shadow.sm,
    },
    cardTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 18,
        color: DISENO.colors.text,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        lineHeight: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: DISENO.colors.border,
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 10,
    },
    input: {
        fontFamily: 'monospace',
        flex: 1,
        paddingVertical: 14,
        fontSize: 12,
        fontWeight: '600',
        color: DISENO.colors.text,
        letterSpacing: 2,
    },
    clearButton: {
        padding: 6,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    buttonScan: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderWidth: 1.5,
        borderColor: DISENO.colors.accent + '30',
    },
    buttonCanjear: {
        backgroundColor: DISENO.colors.accent,
        shadowColor: DISENO.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.55,
    },
    buttonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
    },
    buttonTextScan: {
        color: DISENO.colors.accent,
    },
    buttonTextCanjear: {
        color: DISENO.colors.surface,
    },
    cuponesDisponiblesContainer: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: 16,
        ...DISENO.shadow.sm,
    },
    cuponesDisponiblesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    cuponesDisponiblesHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cuponesDisponiblesHeaderText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 14,
        color: DISENO.colors.text,
    },
    cuponesDisponiblesBadge: {
        backgroundColor: DISENO.colors.accentSecondary + '30',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 14,
    },
    cuponesDisponiblesBadgeText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 12,
        color: DISENO.colors.text,
    },
    cuponesDisponiblesList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    cuponesListContent: {
        gap: 10,
    },
    cuponDisponibleCard: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    cuponDisponibleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    cuponDisponibleIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cuponDisponibleIcon: {
        fontSize: 18,
    },
    cuponDisponibleTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 13,
        color: DISENO.colors.text,
        flex: 1,
    },
    cuponDisponibleFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    cuponDisponibleCodigoContainer: {
        flex: 1,
    },
    cuponDisponibleCodigoLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 9,
        color: DISENO.colors.textTertiary,
        letterSpacing: 1,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    cuponDisponibleCodigo: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: DISENO.colors.text,
        letterSpacing: 1,
    },
    cuponDisponibleCopiar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: DISENO.colors.accent + '15',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '30',
    },
    cuponDisponibleCopiarText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 10,
        color: DISENO.colors.accent,
    },
    cuponesLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 24,
    },
    cuponesLoadingText: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
    },
    cuponesEmpty: {
        alignItems: 'center',
        paddingVertical: 28,
        gap: 8,
    },
    cuponesEmptyText: {
        fontFamily: FUENTES.display,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
        fontWeight: '400',
    },
    cuponesEmptySubtext: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    tipsContainer: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    tipsTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 16,
        color: DISENO.colors.text,
        marginBottom: 14,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    tipIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    historialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DISENO.colors.surface,
        borderRadius: 14,
        padding: 16,
        gap: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.sm,
    },
    historialText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        flex: 1,
        fontSize: 14,
        color: DISENO.colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: DISENO.colors.surface,
        borderRadius: 28,
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        ...DISENO.shadow.lg,
    },
    modalSuccessIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: DISENO.colors.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalErrorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: DISENO.colors.danger + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 22,
        color: DISENO.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalCuponInfo: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: 14,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalCuponTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 16,
        color: DISENO.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalCuponCodigoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    modalCuponCodigo: {
        fontFamily: 'monospace',
        fontSize: 16,
        color: DISENO.colors.text,
        letterSpacing: 1.5,
        fontWeight: 'bold',
    },
    modalCuponCopiar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: DISENO.colors.accent + '15',
        borderWidth: 1,
        borderColor: DISENO.colors.accent + '30',
    },
    modalCuponCopiarText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 10,
        color: DISENO.colors.accent,
    },
    modalCuponDetalle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 15,
        color: DISENO.colors.accent,
        marginBottom: 4,
    },
    modalCuponValor: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: DISENO.colors.accent,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        ...DISENO.shadow.md,
    },
    modalButtonError: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    modalButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        fontSize: 15,
        color: DISENO.colors.surface,
    },
    modalButtonTextError: {
        color: DISENO.colors.text,
    },
    modalSecondaryButton: {
        marginTop: 14,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    modalSecondaryButtonText: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
});