
// screens/cliente/PantallaCanjearCupon.tsx

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { cuponService } from '../../lib/cupones/cuponService';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';
import { Toast, useToast } from '../../components/Toast';
import CuponQR from '../../components/cupones/CuponQR';

export default function PantallaCanjearCupon(props: any) {
    const { perfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();

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

    // ============================================================
    // 🎫 Canjear cupón
    // ============================================================

    const handleCanjear = async (codigoRecibido?: string) => {
        const codigoParaCanjear = (
            codigoRecibido !== undefined ? codigoRecibido : codigo
        )
            .trim()
            .toUpperCase();

        if (!codigoParaCanjear) {
            advertencia('Ingresa o escanea un código de cupón');
            return;
        }

        if (!perfil?.id) {
            Alert.alert(
                'Inicia sesión',
                'Debes iniciar sesión para canjear cupones',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Iniciar sesión',
                        onPress: () =>
                            props.navigation.navigate('Login'),
                    },
                ]
            );
            return;
        }

        setCargando(true);

        try {
            const resultado = await cuponService.canjearCupon({
                codigo: codigoParaCanjear,
                usuarioId: perfil.id,
            });

            setResultadoCanje(resultado);
            setModalVisible(true);

            if (resultado.success) {
                exito(resultado.mensaje);
                setCodigo('');
            } else {
                toastError(resultado.mensaje);
            }
        } catch (err) {
            console.error('Error canjeando cupón:', err);
            toastError('Error al canjear el cupón');
        } finally {
            setCargando(false);
        }
    };

    // ============================================================
    // 📷 Abrir escáner
    // ============================================================

    const abrirScanner = () => {
        setModalVisible(false);
        setScaneando(true);
    };

    // ============================================================
    // 📷 Código detectado por CuponQR
    // ============================================================

    const handleCodigoDetectado = (codigoDetectado: string) => {
        const codigoLimpio = codigoDetectado.trim();

        if (!codigoLimpio) {
            return;
        }

        console.log('📷 Código recibido desde CuponQR:', codigoLimpio);

        setCodigo(codigoLimpio);
        setScaneando(false);

        // Canjeamos utilizando directamente el código detectado.
        // No dependemos de que setCodigo() haya terminado de actualizar el estado.
        setTimeout(() => {
            handleCanjear(codigoLimpio);
        }, 300);
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
    // 🔗 Verificar cupón recibido mediante deep link
    // ============================================================

    useEffect(() => {
        const url = props.route?.params?.url;

        if (!url) {
            return;
        }

        const match = url.match(/codigo=([^&]+)/);

        if (match) {
            const codigoDeepLink = decodeURIComponent(match[1]).trim();

            if (!codigoDeepLink) {
                return;
            }

            setCodigo(codigoDeepLink);

            // Igual que con el QR, enviamos directamente
            // el código para evitar depender de setCodigo().
            setTimeout(() => {
                handleCanjear(codigoDeepLink);
            }, 500);
        }
    }, [props.route?.params?.url]);

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
    // 🖥️ Pantalla principal
    // ============================================================

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    Colores.primario,
                    Colores.secundario,
                    Colores.fondoOscuro,
                ]}
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
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => props.navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={28}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <Text style={[styles.title, { fontSize: 24 }]}>
                        🎫 Canjear Cupón
                    </Text>

                    <View style={{ width: 28 }} />
                </View>

                {/* Tarjeta de canje */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Ingresa el código
                    </Text>

                    <Text style={styles.cardSubtitle}>
                        Escanea un código QR o ingresa el código manualmente
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={codigo}
                            onChangeText={setCodigo}
                            placeholder="Ej: KB8X7K9L2"
                            placeholderTextColor={
                                Colores.textoGris + '60'
                            }
                            autoCapitalize="characters"
                            maxLength={10}
                        />

                        {codigo.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setCodigo('')}
                                style={styles.clearButton}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={Colores.textoGris}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.buttonsRow}>
                        {/* Escanear QR */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonScan,
                            ]}
                            onPress={abrirScanner}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="scan-outline"
                                size={24}
                                color="#FFFFFF"
                            />

                            <Text
                                style={[
                                    styles.buttonText,
                                    styles.buttonTextScan,
                                ]}
                            >
                                Escanear QR
                            </Text>
                        </TouchableOpacity>

                        {/* Canjear */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonCanjear,
                            ]}
                            onPress={() => handleCanjear()}
                            disabled={
                                cargando || !codigo.trim()
                            }
                            activeOpacity={0.7}
                        >
                            {cargando ? (
                                <ActivityIndicator
                                    size="small"
                                    color={Colores.textoOscuro}
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="gift-outline"
                                        size={24}
                                        color={Colores.textoOscuro}
                                    />

                                    <Text
                                        style={[
                                            styles.buttonText,
                                            styles.buttonTextCanjear,
                                        ]}
                                    >
                                        Canjear
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tips */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>
                        💡 ¿Cómo funciona?
                    </Text>

                    <View style={styles.tipItem}>
                        <Ionicons
                            name="qr-code-outline"
                            size={20}
                            color={Colores.secundario}
                        />

                        <Text style={styles.tipText}>
                            Escanea el código QR que recibiste en tu cupón
                            físico o digital
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons
                            name="keypad-outline"
                            size={20}
                            color={Colores.secundario}
                        />

                        <Text style={styles.tipText}>
                            O ingresa manualmente el código de 10 caracteres
                        </Text>
                    </View>

                    <View style={styles.tipItem}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={Colores.secundario}
                        />

                        <Text style={styles.tipText}>
                            El cupón se aplicará automáticamente a tu pedido
                        </Text>
                    </View>
                </View>

                {/* Historial */}
                <TouchableOpacity
                    style={styles.historialButton}
                    onPress={() =>
                        props.navigation.navigate('MisCupones')
                    }
                >
                    <Ionicons
                        name="time-outline"
                        size={20}
                        color="#FFFFFF"
                    />

                    <Text style={styles.historialText}>
                        Ver mis cupones canjeados
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Colores.textoGris}
                    />
                </TouchableOpacity>
            </ScrollView>

            {/* ========================================================
                Modal de resultado
            ========================================================= */}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={cerrarModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {resultadoCanje?.success ? (
                            <>
                                <View style={styles.modalSuccessIcon}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={60}
                                        color="#4CAF50"
                                    />
                                </View>

                                <Text style={styles.modalTitle}>
                                    ¡Cupón canjeado! 🎉
                                </Text>

                                <Text style={styles.modalMessage}>
                                    {resultadoCanje.mensaje}
                                </Text>

                                {resultadoCanje.cupon && (
                                    <View style={styles.modalCuponInfo}>
                                        <Text
                                            style={
                                                styles.modalCuponTitulo
                                            }
                                        >
                                            {resultadoCanje.cupon.titulo}
                                        </Text>

                                        <Text
                                            style={
                                                styles.modalCuponDetalle
                                            }
                                        >
                                            {cuponService.formatearDescuento(
                                                resultadoCanje.cupon
                                            )}
                                        </Text>

                                        {resultadoCanje.descuento_aplicado && (
                                            <Text
                                                style={
                                                    styles.modalCuponValor
                                                }
                                            >
                                                {resultadoCanje.cupon
                                                    .es_porcentaje
                                                    ? `${resultadoCanje.descuento_aplicado}% de descuento`
                                                    : `$${resultadoCanje.descuento_aplicado.toFixed(
                                                        2
                                                    )} de descuento`}
                                            </Text>
                                        )}

                                        {resultadoCanje.producto_gratis && (
                                            <Text
                                                style={
                                                    styles.modalCuponValor
                                                }
                                            >
                                                🎁{' '}
                                                {
                                                    resultadoCanje
                                                        .producto_gratis
                                                        .nombre
                                                }{' '}
                                                gratis
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={cerrarModal}
                                >
                                    <Text
                                        style={styles.modalButtonText}
                                    >
                                        ¡Genial!
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.modalErrorIcon}>
                                    <Ionicons
                                        name="close-circle"
                                        size={60}
                                        color="#E53935"
                                    />
                                </View>

                                <Text style={styles.modalTitle}>
                                    No se pudo canjear 😕
                                </Text>

                                <Text style={styles.modalMessage}>
                                    {resultadoCanje?.mensaje ||
                                        'Error al canjear el cupón'}
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        styles.modalButtonError,
                                    ]}
                                    onPress={cerrarModal}
                                >
                                    <Text
                                        style={[
                                            styles.modalButtonText,
                                            styles.modalButtonTextError,
                                        ]}
                                    >
                                        Intentar de nuevo
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Toast */}
            <Toast
                visible={visible}
                mensaje={mensaje}
                tipo={tipo}
                ocultar={ocultar}
            />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================

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
        height: 300,
        opacity: 0.3,
    },

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },

    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    title: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    card: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },

    cardSubtitle: {
        fontSize: 14,
        color: Colores.textoGris,
        marginBottom: 20,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 2,
    },

    clearButton: {
        padding: 4,
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },

    buttonCanjear: {
        backgroundColor: Colores.secundario,
        shadowColor: Colores.secundario,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    buttonTextScan: {
        color: '#FFFFFF',
    },

    buttonTextCanjear: {
        color: Colores.textoOscuro,
    },

    tipsContainer: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },

    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },

    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },

    tipText: {
        fontSize: 14,
        color: Colores.textoGris,
        flex: 1,
    },

    historialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 16,
        gap: 12,
        marginBottom: 20,
    },

    historialText: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },

    // ============================================================
    // Modal
    // ============================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    modalContent: {
        backgroundColor: Colores.fondoOscuro,
        borderRadius: 28,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    modalSuccessIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    modalErrorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(229, 57, 53, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    modalMessage: {
        fontSize: 16,
        color: Colores.textoGris,
        textAlign: 'center',
        marginBottom: 20,
    },

    modalCuponInfo: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
    },

    modalCuponTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },

    modalCuponDetalle: {
        fontSize: 16,
        color: Colores.secundario,
        fontWeight: '600',
        marginBottom: 4,
    },

    modalCuponValor: {
        fontSize: 14,
        color: Colores.textoGris,
    },

    modalButton: {
        backgroundColor: Colores.secundario,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },

    modalButtonError: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    modalButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colores.textoOscuro,
    },

    modalButtonTextError: {
        color: '#FFFFFF',
    },
});

