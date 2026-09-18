// screens/admin/ModalGenerarCuponesFisicos.tsx
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { Cupon } from '../../lib/cupones/cuponTypes';
import { cuponFisicoService } from '../../lib/cupones/cuponFisicoService';
import { generarPDFCupones, compartirPDF } from '../../lib/cupones/generadorPDFCupones';
import { EstiloPDF } from '../../lib/cupones/cuponFisicoTypes';

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
        morado: '#7B1FA2',
    },
};

interface Props {
    visible: boolean;
    cupon: Cupon | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ModalGenerarCuponesFisicos({ visible, cupon, onClose, onSuccess }: Props) {
    const insets = useSafeAreaInsets();
    const [cantidad, setCantidad] = useState('50');
    const [prefijo, setPrefijo] = useState('KRU');
    const [estilo, setEstilo] = useState<EstiloPDF>('mixto');
    const [incluirQR, setIncluirQR] = useState(true);
    const [incluirTerminos, setIncluirTerminos] = useState(true);
    const [generando, setGenerando] = useState(false);
    const [paso, setPaso] = useState<'config' | 'generando' | 'listo'>('config');

    const reset = () => {
        setCantidad('50');
        setPrefijo('KRU');
        setEstilo('mixto');
        setIncluirQR(true);
        setIncluirTerminos(true);
        setGenerando(false);
        setPaso('config');
    };

    const handleClose = () => {
        if (generando) return;
        reset();
        onClose();
    };

    /**
     * ✅ Comparte el PDF y limpia el archivo temporal.
     * Se ejecuta en un setTimeout para que el modal ya esté desmontado
     * y la app no crashee al volver de WhatsApp.
     */
    const compartirYLimpiar = async (uri: string, titulo: string) => {
        try {
            await compartirPDF(uri, titulo);
        } catch (error) {
            console.warn('⚠️ Error o cancelación al compartir:', error);
        } finally {
            // ✅ Borrar el PDF temporal para no acumular en el cache
            try {
                await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (e) {
                // silencioso: si no se puede borrar, no pasa nada
            }
        }
    };

    const handleGenerar = async () => {
        if (!cupon) return;

        const cant = parseInt(cantidad);
        if (isNaN(cant) || cant <= 0 || cant > 5000) {
            Alert.alert('Error', 'Ingresá una cantidad válida (1 a 5000)');
            return;
        }

        setGenerando(true);
        setPaso('generando');

        try {
            // ============================================================
            // 1. Generar los cupones en la DB
            // ============================================================
            const resultado = await cuponFisicoService.generarLote({
                cupon_id: cupon.id,
                cantidad: cant,
                prefijo: prefijo || 'KRU',
            });

            if (!resultado.success || !resultado.cupones) {
                throw new Error(resultado.error || 'Error generando cupones');
            }

            // ============================================================
            // 2. Generar el PDF
            // ============================================================
            const pdf = await generarPDFCupones(cupon, resultado.cupones, {
                estilo,
                incluirQR,
                incluirTerminos,
                nombreNegocio: 'KRUSTY BURGER',
                telefono: '+54 11 1234-5678',
                direccion: 'Av. Siempre Viva 742',
            });

            if (!pdf.success || !pdf.uri) {
                throw new Error(pdf.error || 'Error generando PDF');
            }

            // ============================================================
            // 3. Notificar éxito al padre (refresca la lista de cupones)
            // ============================================================
            onSuccess?.();

            // ============================================================
            // 4. Cerrar el modal ANTES de compartir (evita crash al volver)
            // ============================================================
            setGenerando(false);
            setPaso('config');
            reset();
            onClose();

            // ============================================================
            // 5. Compartir con delay (la app ya está estable sin el modal)
            // ============================================================
            setTimeout(() => {
                compartirYLimpiar(pdf.uri!, `Cupones ${cupon.titulo}`);
            }, 400);

        } catch (error: any) {
            console.error('❌ Error:', error);
            Alert.alert('Error', error?.message || 'No se pudieron generar los cupones');
            setGenerando(false);
            setPaso('config');
        }
    };

    if (!cupon) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🎟️ Generar Cupones Físicos</Text>
                        <TouchableOpacity onPress={handleClose} disabled={generando}>
                            <Ionicons name="close" size={24} color={DESIGN.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        {paso === 'config' && (
                            <>
                                <View style={styles.cuponInfo}>
                                    <Text style={styles.cuponTitulo}>{cupon.titulo}</Text>
                                    <Text style={styles.cuponSub}>
                                        {cupon.tipo.replace('_', ' ').toUpperCase()} · {cupon.codigo}
                                    </Text>
                                </View>

                                {/* Cantidad */}
                                <Text style={styles.label}>Cantidad de cupones</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cantidad}
                                    onChangeText={setCantidad}
                                    keyboardType="numeric"
                                    placeholder="Ej: 50"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                />
                                <Text style={styles.helpText}>Máximo 5000 por lote</Text>

                                {/* Prefijo */}
                                <Text style={styles.label}>Prefijo del código</Text>
                                <TextInput
                                    style={styles.input}
                                    value={prefijo}
                                    onChangeText={(t) => setPrefijo(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                                    placeholder="KRU"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    autoCapitalize="characters"
                                    maxLength={6}
                                />
                                <Text style={styles.helpText}>Ej: KRU-A3F9B2</Text>

                                {/* Estilo */}
                                <Text style={styles.label}>Estilo visual</Text>
                                <View style={styles.estilosRow}>
                                    {(['retro', 'clean', 'mixto'] as EstiloPDF[]).map((e) => (
                                        <TouchableOpacity
                                            key={e}
                                            style={[styles.estiloBtn, estilo === e && styles.estiloBtnActive]}
                                            onPress={() => setEstilo(e)}
                                        >
                                            <Text style={[styles.estiloTexto, estilo === e && styles.estiloTextoActive]}>
                                                {e === 'retro' && '🎨 Retro'}
                                                {e === 'clean' && '⚪ Clean'}
                                                {e === 'mixto' && '🟡 Mixto'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Opciones */}
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Incluir QR</Text>
                                    <Switch value={incluirQR} onValueChange={setIncluirQR} />
                                </View>

                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>Incluir términos</Text>
                                    <Switch value={incluirTerminos} onValueChange={setIncluirTerminos} />
                                </View>

                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={18} color={DESIGN.colors.morado} />
                                    <Text style={styles.infoText}>
                                        8 cupones por hoja A4. Los códigos son únicos y no se pueden reusar nunca.
                                    </Text>
                                </View>
                            </>
                        )}

                        {paso === 'generando' && (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color={DESIGN.colors.morado} />
                                <Text style={styles.loadingText}>Generando cupones únicos...</Text>
                                <Text style={styles.loadingSub}>Esto puede tardar unos segundos</Text>
                            </View>
                        )}

                        {paso === 'listo' && (
                            <View style={styles.loadingBox}>
                                <Ionicons name="checkmark-circle" size={64} color={DESIGN.colors.verde} />
                                <Text style={styles.loadingText}>¡Cupones generados!</Text>
                                <Text style={styles.loadingSub}>El PDF se compartió automáticamente</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Botón */}
                    {paso === 'config' && (
                        <TouchableOpacity
                            style={[styles.botonGenerar, generando && styles.botonDisabled]}
                            onPress={handleGenerar}
                            disabled={generando}
                        >
                            <Ionicons name="print-outline" size={20} color="#FFF" />
                            <Text style={styles.botonTexto}>Generar y descargar PDF</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: DESIGN.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: DESIGN.colors.text,
    },
    body: {
        maxHeight: 500,
    },
    cuponInfo: {
        backgroundColor: DESIGN.colors.fondo,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    cuponTitulo: {
        fontSize: 16,
        fontWeight: '700',
        color: DESIGN.colors.text,
    },
    cuponSub: {
        fontSize: 12,
        color: DESIGN.colors.textSecondary,
        marginTop: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: DESIGN.colors.text,
        marginTop: 14,
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
    helpText: {
        fontSize: 11,
        color: DESIGN.colors.textTertiary,
        marginTop: 4,
    },
    estilosRow: {
        flexDirection: 'row',
        gap: 8,
    },
    estiloBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.fondo,
        alignItems: 'center',
    },
    estiloBtnActive: {
        backgroundColor: DESIGN.colors.morado + '20',
        borderColor: DESIGN.colors.morado,
    },
    estiloTexto: {
        fontSize: 13,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
    },
    estiloTextoActive: {
        color: DESIGN.colors.morado,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: DESIGN.colors.text,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: DESIGN.colors.morado + '10',
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: DESIGN.colors.morado,
        lineHeight: 16,
    },
    loadingBox: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: DESIGN.colors.text,
    },
    loadingSub: {
        fontSize: 13,
        color: DESIGN.colors.textSecondary,
    },
    botonGenerar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: DESIGN.colors.morado,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    botonDisabled: {
        opacity: 0.6,
    },
    botonTexto: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});