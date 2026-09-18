// components/admin/CuponQRGenerator.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Share,
    Alert,
    Platform,
    Linking,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';

import { Cupon } from '../../lib/cupones/cuponTypes';
import { formatearDescuento, colorPorTipo, iconoPorTipo } from '../../lib/cupones/cuponUtils';
import { Colores } from '../../lib/colores';
import { useToast, Toast } from '../../components/Toast';

interface Props {
    visible: boolean;
    cupon: Cupon | null;
    onClose: () => void;
}

export default function CuponQRGenerator({ visible, cupon, onClose }: Props) {
    const toast = useToast();
    const qrRef = useRef<any>(null);
    const [guardando, setGuardando] = useState(false);

    if (!cupon) return null;

    // ✅ QR ahora contiene SOLO el código (sin pasar por la web)
    const datosQR = cupon.codigo;

    // ✅ Deep link (por si algún día se quiere usar)
    const urlDeepLink = `krustyburger://canjear?codigo=${cupon.codigo}`;

    // ✅ Guardar QR en galería
    const guardarQR = async () => {
        try {
            setGuardando(true);
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso necesario', 'Se necesita permiso para guardar');
                setGuardando(false);
                return;
            }
            const uri = await captureRef(qrRef.current, { format: 'png', quality: 1 });
            const asset = await MediaLibrary.createAssetAsync(uri);
            await MediaLibrary.createAlbumAsync('Krusty Burger', asset, false);
            toast.exito('✅ QR guardado en la galería');
        } catch (error) {
            console.error('Error guardando QR:', error);
            toast.error('No se pudo guardar');
        } finally {
            setGuardando(false);
        }
    };

    // ✅ Compartir QR
    const compartirQR = async () => {
        try {
            setGuardando(true);

            const uri = await captureRef(qrRef.current, { format: 'png', quality: 1 });

            const mensaje =
                `🎫 *CUPÓN KRUSTY BURGER*

📌 ${cupon.titulo}
💰 ${formatearDescuento(cupon)}
🔑 Código: ${cupon.codigo}
📅 Válido: ${new Date(cupon.fecha_expiracion).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                })}

🔗 Para canjear, abrí la app Krusty y escaneá el QR o ingresá el código.

🍔 Krusty Burger`;

            await Share.share({
                message: mensaje,
                url: uri,
                title: `Cupón ${cupon.codigo}`,
            });

            toast.exito('✅ QR compartido');

        } catch (error) {
            console.error('Error compartiendo QR:', error);

            try {
                const mensajeTexto =
                    `🎫 CUPÓN KRUSTY BURGER

📌 ${cupon.titulo}
💰 ${formatearDescuento(cupon)}
🔑 Código: ${cupon.codigo}

🍔 Krusty Burger`;

                await Share.share({
                    message: mensajeTexto,
                });
                toast.exito('✅ Código compartido');
            } catch (e) {
                toast.error('No se pudo compartir');
            }
        } finally {
            setGuardando(false);
        }
    };

    // ✅ Compartir solo el código
    const compartirEnlace = async () => {
        try {
            const mensaje =
                `🎫 Cupón Krusty Burger

📌 ${cupon.titulo}
💰 ${formatearDescuento(cupon)}
🔑 ${cupon.codigo}

🍔 Krusty Burger`;

            await Share.share({
                message: mensaje,
            });
            toast.exito('✅ Código compartido');
        } catch (error) {
            toast.error('No se pudo compartir');
        }
    };

    const tipoColor = colorPorTipo(cupon.tipo);
    const tipoIcono = iconoPorTipo(cupon.tipo);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header compacto */}
                    <LinearGradient
                        colors={[tipoColor, tipoColor + 'CC']}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerIcon}>{tipoIcono}</Text>
                            <Text style={styles.headerTitle} numberOfLines={1}>{cupon.titulo}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                        <View style={styles.body}>
                            {/* Código */}
                            <View style={styles.codigoContainer}>
                                <Text style={styles.codigoLabel}>CÓDIGO</Text>
                                <Text style={styles.codigoTexto}>{cupon.codigo}</Text>
                            </View>

                            {/* QR */}
                            <View style={styles.qrContainer}>
                                <View ref={qrRef} collapsable={false} style={styles.qrWrapper}>
                                    <QRCode
                                        value={datosQR}
                                        size={150}
                                        color={Colores.fondoOscuro}
                                        backgroundColor="white"
                                        quietZone={8}
                                    />
                                </View>
                            </View>

                            {/* Instrucción */}
                            <View style={styles.urlContainer}>
                                <Text style={styles.urlTexto}>📱 Escaneá desde la app Krusty</Text>
                                <Text style={styles.urlSubtexto}>O ingresá el código manualmente</Text>
                            </View>

                            {/* Detalles - Grid 2x2 */}
                            <View style={styles.detallesGrid}>
                                <View style={styles.detalleItem}>
                                    <Text style={styles.detalleLabel}>Tipo</Text>
                                    <Text style={[styles.detalleValor, { color: tipoColor }]}>
                                        {cupon.tipo.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.detalleItem}>
                                    <Text style={styles.detalleLabel}>Descuento</Text>
                                    <Text style={[styles.detalleValor, { color: tipoColor }]}>
                                        {formatearDescuento(cupon)}
                                    </Text>
                                </View>
                                <View style={styles.detalleItem}>
                                    <Text style={styles.detalleLabel}>Válido hasta</Text>
                                    <Text style={styles.detalleValor}>
                                        {new Date(cupon.fecha_expiracion).toLocaleDateString('es-AR')}
                                    </Text>
                                </View>
                                {cupon.usos_maximos && (
                                    <View style={styles.detalleItem}>
                                        <Text style={styles.detalleLabel}>Usos</Text>
                                        <Text style={styles.detalleValor}>
                                            {cupon.usos_maximos - cupon.usos_totales} / {cupon.usos_maximos}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Botones */}
                            <View style={styles.accionesContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionGuardar]}
                                    onPress={guardarQR}
                                    disabled={guardando}
                                >
                                    {guardando ? (
                                        <ActivityIndicator size="small" color={Colores.textoOscuro} />
                                    ) : (
                                        <>
                                            <Ionicons name="download-outline" size={18} color={Colores.textoOscuro} />
                                            <Text style={styles.actionText}>Guardar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionCompartir]}
                                    onPress={compartirQR}
                                    disabled={guardando}
                                >
                                    <Ionicons name="share-social-outline" size={18} color="#FFF" />
                                    <Text style={[styles.actionText, { color: '#FFF' }]}>Compartir QR</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Botón extra: compartir solo código */}
                            <TouchableOpacity
                                style={styles.enlaceBoton}
                                onPress={compartirEnlace}
                            >
                                <Ionicons name="key-outline" size={16} color={Colores.secundario} />
                                <Text style={styles.enlaceBotonText}>Compartir solo código</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
        </Modal>
    );
}

// ============================================================
// 📐 ESTILOS
// ============================================================
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        maxHeight: '90%',
    },
    scroll: {
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    body: {
        padding: 16,
    },
    codigoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    codigoLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colores.textoGris,
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    codigoTexto: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.fondoOscuro,
        letterSpacing: 1.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    qrWrapper: {
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    urlContainer: {
        backgroundColor: Colores.primarioOscuro,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    urlTexto: {
        fontSize: 12,
        color: Colores.primario,
        fontWeight: '600',
    },
    urlSubtexto: {
        fontSize: 10,
        color: Colores.textoGris,
        marginTop: 2,
    },
    detallesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: Colores.primarioOscuro,
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
    },
    detalleItem: {
        width: '50%',
        paddingVertical: 3,
    },
    detalleLabel: {
        fontSize: 9,
        color: Colores.textoGris,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detalleValor: {
        fontSize: 12,
        fontWeight: '600',
        color: Colores.fondoOscuro,
        marginTop: 1,
    },
    accionesContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    actionGuardar: {
        backgroundColor: Colores.secundario,
    },
    actionCompartir: {
        backgroundColor: '#25D366',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colores.textoOscuro,
    },
    enlaceBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colores.secundario + '40',
    },
    enlaceBotonText: {
        fontSize: 12,
        color: Colores.secundario,
        fontWeight: '500',
    },
});