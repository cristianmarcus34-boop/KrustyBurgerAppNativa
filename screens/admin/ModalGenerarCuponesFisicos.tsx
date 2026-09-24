// screens/admin/ModalGenerarCuponesFisicos.tsx
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
    ActivityIndicator, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview';
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

// ✅ Lista de estilos con label y color para el selector
const ESTILOS_DISPONIBLES: { id: EstiloPDF; label: string; color: string }[] = [
    { id: 'retro', label: '🎨 Retro', color: '#F5C518' },
    { id: 'clean', label: '⚪ Clean', color: '#E0E0E0' },
    { id: 'mixto', label: '🟡 Mixto', color: '#F5C518' },
    { id: 'arena', label: '🏖️ Arena', color: '#C97B5A' },
    { id: 'oliva', label: '🌿 Oliva', color: '#7A8B5C' },
    { id: 'noir', label: '⚫ Noir', color: '#1A1A1A' },
    { id: 'kraft', label: '📦 Kraft', color: '#8B6F47' },
    { id: 'durazno', label: '🍑 Durazno', color: '#E8A87C' },
    { id: 'menta', label: '🌱 Menta', color: '#A8C5B8' },
    { id: 'vino', label: '🍷 Vino', color: '#7B2D3E' },
];

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

    // ✅ Preview
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewEstiloIndex, setPreviewEstiloIndex] = useState(0);

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

    const compartirYLimpiar = async (uri: string, titulo: string) => {
        try {
            await compartirPDF(uri, titulo);
        } catch (error) {
            console.warn('⚠️ Error o cancelación al compartir:', error);
        } finally {
            try {
                await FileSystem.deleteAsync(uri, { idempotent: true });
            } catch (e) {
                // silencioso
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
            const resultado = await cuponFisicoService.generarLote({
                cupon_id: cupon.id,
                cantidad: cant,
                prefijo: prefijo || 'KRU',
            });

            if (!resultado.success || !resultado.cupones) {
                throw new Error(resultado.error || 'Error generando cupones');
            }

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

            onSuccess?.();

            setGenerando(false);
            setPaso('config');
            reset();
            onClose();

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

    // ✅ Abrir preview con el estilo actual seleccionado
    const handleAbrirPreview = () => {
        const idx = ESTILOS_DISPONIBLES.findIndex((e) => e.id === estilo);
        setPreviewEstiloIndex(idx >= 0 ? idx : 0);
        setPreviewVisible(true);
    };

    const handlePreviewAnterior = () => {
        setPreviewEstiloIndex((prev) =>
            prev === 0 ? ESTILOS_DISPONIBLES.length - 1 : prev - 1
        );
    };

    const handlePreviewSiguiente = () => {
        setPreviewEstiloIndex((prev) =>
            prev === ESTILOS_DISPONIBLES.length - 1 ? 0 : prev + 1
        );
    };

    // ✅ Genera el HTML de preview para el estilo actual
    const generarPreviewHTML = (): string => {
        if (!cupon) return '';
        const estiloActual = ESTILOS_DISPONIBLES[previewEstiloIndex];
        const colorPrimario = estiloActual.color;
        const esOscuro = estiloActual.id === 'noir';
        const textoPrincipal = esOscuro ? '#FFFFFF' : '#1A1A1A';
        const textoSecundario = esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)';
        const fondoCard = esOscuro ? '#1A1A1A' : '#FFFFFF';
        const bordeCard = esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #E8E4DD;
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .hoja {
    width: 100%;
    max-width: 420px;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  .cupon {
    background: ${fondoCard};
    border: 1px dashed ${bordeCard};
    border-radius: 8px;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    min-height: 140px;
  }
  .cupon::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: ${colorPrimario};
  }
  .negocio {
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: ${colorPrimario};
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .titulo {
    font-size: 12px;
    font-weight: 800;
    color: ${textoPrincipal};
    line-height: 1.2;
    margin-bottom: 3px;
  }
  .desc {
    font-size: 8px;
    color: ${textoSecundario};
    line-height: 1.3;
    margin-bottom: 6px;
    flex: 1;
  }
  .qr {
    width: 44px;
    height: 44px;
    background: #FFFFFF;
    border: 1px solid ${bordeCard};
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px 0;
  }
  .qr svg { width: 36px; height: 36px; }
  .codigo {
    font-size: 8px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: ${textoPrincipal};
    letter-spacing: 0.8px;
    background: ${esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
    padding: 2px 6px;
    border-radius: 3px;
    margin-top: 2px;
  }
  .terminos {
    font-size: 6px;
    color: ${textoSecundario};
    margin-top: 4px;
    line-height: 1.2;
  }
  .footer {
    font-size: 6px;
    color: ${textoSecundario};
    margin-top: 2px;
  }
  .badge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 7px;
    font-weight: 800;
    color: #FFF;
    background: ${colorPrimario};
    padding: 2px 5px;
    border-radius: 3px;
  }
</style>
</head>
<body>
  <div class="hoja">
    ${[1, 2, 3, 4].map(() => `
    <div class="cupon">
      <div class="badge">${cupon.tipo === 'descuento' ? '%' : '🎁'}</div>
      <div class="negocio">KRUSTY BURGER</div>
      <div class="titulo">${cupon.titulo}</div>
      <div class="desc">${cupon.descripcion || 'Cupón válido por tiempo limitado'}</div>
      ${incluirQR ? `
      <div class="qr">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#FFF"/>
          <rect x="5" y="5" width="25" height="25" fill="#000"/>
          <rect x="10" y="10" width="15" height="15" fill="#FFF"/>
          <rect x="13" y="13" width="9" height="9" fill="#000"/>
          <rect x="70" y="5" width="25" height="25" fill="#000"/>
          <rect x="75" y="10" width="15" height="15" fill="#FFF"/>
          <rect x="78" y="13" width="9" height="9" fill="#000"/>
          <rect x="5" y="70" width="25" height="25" fill="#000"/>
          <rect x="10" y="75" width="15" height="15" fill="#FFF"/>
          <rect x="13" y="78" width="9" height="9" fill="#000"/>
          <rect x="40" y="10" width="8" height="8" fill="#000"/>
          <rect x="55" y="15" width="8" height="8" fill="#000"/>
          <rect x="40" y="30" width="8" height="8" fill="#000"/>
          <rect x="55" y="40" width="8" height="8" fill="#000"/>
          <rect x="10" y="45" width="8" height="8" fill="#000"/>
          <rect x="25" y="50" width="8" height="8" fill="#000"/>
          <rect x="40" y="55" width="8" height="8" fill="#000"/>
          <rect x="70" y="45" width="8" height="8" fill="#000"/>
          <rect x="85" y="50" width="8" height="8" fill="#000"/>
          <rect x="45" y="70" width="8" height="8" fill="#000"/>
          <rect x="60" y="75" width="8" height="8" fill="#000"/>
          <rect x="75" y="80" width="8" height="8" fill="#000"/>
          <rect x="40" y="85" width="8" height="8" fill="#000"/>
          <rect x="55" y="90" width="8" height="8" fill="#000"/>
        </svg>
      </div>
      ` : ''}
      <div class="codigo">KRU-A3F9B2</div>
      ${incluirTerminos ? `
      <div class="terminos">Válido hasta 31/12/2025. No acumulable.</div>
      ` : ''}
      <div class="footer">Av. Siempre Viva 742 · +54 11 1234-5678</div>
    </div>
    `).join('')}
  </div>
</body>
</html>
        `;
    };

    if (!cupon) return null;

    return (
        <>
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

                                    {/* Estilo + Preview */}
                                    <View style={styles.estiloHeader}>
                                        <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Estilo visual</Text>
                                        <TouchableOpacity
                                            style={styles.previewBtn}
                                            onPress={handleAbrirPreview}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="eye-outline" size={16} color={DESIGN.colors.morado} />
                                            <Text style={styles.previewBtnText}>Previsualizar</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.estilosGrid}>
                                        {ESTILOS_DISPONIBLES.map((item) => {
                                            const activo = estilo === item.id;
                                            return (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[
                                                        styles.estiloBtn,
                                                        activo && styles.estiloBtnActive,
                                                    ]}
                                                    onPress={() => setEstilo(item.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View
                                                        style={[
                                                            styles.estiloColorDot,
                                                            {
                                                                backgroundColor: item.color,
                                                                borderColor: activo
                                                                    ? DESIGN.colors.morado
                                                                    : DESIGN.colors.border,
                                                                borderWidth: activo ? 2 : 1,
                                                            },
                                                        ]}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.estiloTexto,
                                                            activo && styles.estiloTextoActive,
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
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

            {/* ✅ Modal de Previsualización */}
            <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
                <View style={styles.previewOverlay}>
                    <View style={[styles.previewModal, { paddingBottom: insets.bottom + 16 }]}>
                        {/* Header preview */}
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>👁️ Previsualización</Text>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                <Ionicons name="close" size={24} color={DESIGN.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Nombre del estilo actual */}
                        <View style={styles.previewEstiloBadge}>
                            <View
                                style={[
                                    styles.previewEstiloDot,
                                    { backgroundColor: ESTILOS_DISPONIBLES[previewEstiloIndex].color },
                                ]}
                            />
                            <Text style={styles.previewEstiloNombre}>
                                {ESTILOS_DISPONIBLES[previewEstiloIndex].label}
                            </Text>
                        </View>

                        {/* WebView */}
                        <View style={styles.previewWebViewContainer}>
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: generarPreviewHTML() }}
                                style={styles.previewWebView}
                                scrollEnabled={true}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>

                        {/* Controles de navegación */}
                        <View style={styles.previewControls}>
                            <TouchableOpacity
                                style={styles.previewArrow}
                                onPress={handlePreviewAnterior}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={24} color={DESIGN.colors.morado} />
                            </TouchableOpacity>

                            <Text style={styles.previewCounter}>
                                {previewEstiloIndex + 1} / {ESTILOS_DISPONIBLES.length}
                            </Text>

                            <TouchableOpacity
                                style={styles.previewArrow}
                                onPress={handlePreviewSiguiente}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-forward" size={24} color={DESIGN.colors.morado} />
                            </TouchableOpacity>
                        </View>

                        {/* Botón seleccionar este estilo */}
                        <TouchableOpacity
                            style={styles.previewSelectBtn}
                            onPress={() => {
                                setEstilo(ESTILOS_DISPONIBLES[previewEstiloIndex].id);
                                setPreviewVisible(false);
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                            <Text style={styles.previewSelectBtnText}>Usar este estilo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
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
    // ✅ Header de estilo con botón preview
    estiloHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 6,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: DESIGN.colors.morado + '15',
        borderWidth: 1,
        borderColor: DESIGN.colors.morado + '30',
    },
    previewBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: DESIGN.colors.morado,
    },
    // ✅ Grid de estilos (2 columnas)
    estilosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    estiloBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
        backgroundColor: DESIGN.colors.fondo,
        width: '48%',
    },
    estiloBtnActive: {
        backgroundColor: DESIGN.colors.morado + '20',
        borderColor: DESIGN.colors.morado,
    },
    estiloColorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    estiloTexto: {
        fontSize: 12,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
        flex: 1,
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

    // ✅ Modal de preview
    previewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    previewModal: {
        backgroundColor: DESIGN.colors.surface,
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        maxHeight: '92%',
        padding: 16,
        alignItems: 'center',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: DESIGN.colors.text,
    },
    previewEstiloBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: DESIGN.colors.fondo,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 12,
    },
    previewEstiloDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    previewEstiloNombre: {
        fontSize: 13,
        fontWeight: '600',
        color: DESIGN.colors.text,
    },
    previewWebViewContainer: {
        width: '100%',
        height: 340,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#E8E4DD',
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    previewWebView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    previewControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 12,
        paddingHorizontal: 8,
    },
    previewArrow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DESIGN.colors.morado + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: DESIGN.colors.morado + '30',
    },
    previewCounter: {
        fontSize: 14,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
    },
    previewSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: DESIGN.colors.morado,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        marginTop: 12,
    },
    previewSelectBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});