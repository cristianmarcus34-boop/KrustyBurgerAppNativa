// components/cupones/CuponQR.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../../lib/colores';

interface CuponQRProps {
    onCodigoDetectado: (codigo: string) => void;
    onCerrar: () => void;
}

export default function CuponQR({
    onCodigoDetectado,
    onCerrar,
}: CuponQRProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [procesando, setProcesando] = useState(false);

    // ============================================================
    // 📷 Permisos
    // ============================================================

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.mensaje}>
                    Verificando permisos de cámara...
                </Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Ionicons
                    name="camera-outline"
                    size={64}
                    color={Colores.secundario}
                    style={styles.iconoPermiso}
                />

                <Text style={styles.titulo}>
                    Necesitamos acceso a la cámara
                </Text>

                <Text style={styles.descripcion}>
                    Para escanear el código QR de tu cupón necesitamos
                    utilizar la cámara del dispositivo.
                </Text>

                <TouchableOpacity
                    style={styles.botonPermiso}
                    onPress={async () => {
                        const resultado = await requestPermission();

                        if (!resultado.granted) {
                            Alert.alert(
                                'Permiso requerido',
                                'Debes permitir el acceso a la cámara para poder escanear el código QR.'
                            );
                        }
                    }}
                >
                    <Ionicons
                        name="camera"
                        size={22}
                        color={Colores.textoOscuro}
                    />

                    <Text style={styles.botonPermisoTexto}>
                        Permitir cámara
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.botonCancelar}
                    onPress={onCerrar}
                >
                    <Text style={styles.botonCancelarTexto}>
                        Cancelar
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ============================================================
    // 🔎 Normalizador de códigos escaneados
    // ============================================================
    // Acepta 4 formatos distintos y extrae el código en todos:
    //   1. Código plano:           KRU-A2TV32
    //   2. URL web:                https://krustyburger.com.ar/canjear?codigo=KRU-A2TV32
    //   3. Deep link:              krustyburger://canjear?codigo=KRU-A2TV32
    //   4. JSON viejo:             {"tipo":"CUPON_KRUSTY","codigo":"KRU-A2TV32",...}
    // ============================================================
    const normalizarCodigoEscaneado = (data: string): string => {
        const limpio = data.trim();

        // Caso 1: URL web → extraer ?codigo=
        try {
            const url = new URL(limpio);
            const codigo = url.searchParams.get('codigo');
            if (codigo) {
                return codigo.trim().toUpperCase();
            }
        } catch {
            // no es URL válida, seguimos
        }

        // Caso 2: deep link → extraer ?codigo= (por si URL falla)
        const matchDeepLink = limpio.match(/[?&]codigo=([A-Z0-9-]+)/i);
        if (matchDeepLink) {
            return matchDeepLink[1].trim().toUpperCase();
        }

        // Caso 3: JSON viejo → extraer .codigo
        try {
            const json = JSON.parse(limpio);
            if (json?.codigo) {
                return String(json.codigo).trim().toUpperCase();
            }
        } catch {
            // no es JSON, seguimos
        }

        // Caso 4: código plano
        return limpio.toUpperCase();
    };

    // ============================================================
    // 🔎 QR detectado
    // ============================================================

    const handleBarcodeScanned = ({
        data,
        type,
    }: {
        data: string;
        type: string;
    }) => {
        if (procesando) {
            return;
        }

        if (!data || !data.trim()) {
            return;
        }

        setProcesando(true);

        const codigoNormalizado = normalizarCodigoEscaneado(data);

        console.log('📷 QR detectado:', {
            type,
            dataOriginal: data,
            codigoNormalizado,
        });

        // Enviamos el código normalizado al componente padre.
        onCodigoDetectado(codigoNormalizado);
    };

    // ============================================================
    // 📱 Scanner
    // ============================================================

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={
                    procesando ? undefined : handleBarcodeScanned
                }
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onCerrar}
                    style={styles.botonVolver}
                >
                    <Ionicons
                        name="arrow-back"
                        size={28}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitulo}>
                    📷 Escanear QR
                </Text>

                <View style={styles.headerEspacio} />
            </View>

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.scannerFrame}>
                    {/* Esquinas visuales */}
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View
                        style={[styles.corner, styles.cornerBottomRight]}
                    />
                </View>

                <Text style={styles.instrucciones}>
                    Coloca el código QR dentro del recuadro
                </Text>

                <Text style={styles.subInstrucciones}>
                    El código se detectará automáticamente
                </Text>
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
                style={styles.botonCerrar}
                onPress={onCerrar}
            >
                <Ionicons
                    name="close"
                    size={24}
                    color="#FFFFFF"
                />

                <Text style={styles.botonCerrarTexto}>
                    Cancelar
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },

    mensaje: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 30,
    },

    iconoPermiso: {
        marginBottom: 20,
    },

    titulo: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 30,
    },

    descripcion: {
        color: '#CCCCCC',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 35,
        marginBottom: 28,
    },

    botonPermiso: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colores.secundario,
        paddingVertical: 14,
        paddingHorizontal: 26,
        borderRadius: 14,
        minWidth: 200,
    },

    botonPermisoTexto: {
        color: Colores.textoOscuro,
        fontSize: 16,
        fontWeight: 'bold',
    },

    botonCancelar: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },

    botonCancelarTexto: {
        color: '#FFFFFF',
        fontSize: 16,
    },

    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,

        backgroundColor: 'rgba(0,0,0,0.55)',
    },

    botonVolver: {
        padding: 8,
    },

    headerTitulo: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },

    headerEspacio: {
        width: 44,
    },

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        justifyContent: 'center',
        alignItems: 'center',

        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    scannerFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },

    corner: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderColor: Colores.secundario,
    },

    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },

    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },

    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },

    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },

    instrucciones: {
        marginTop: 30,
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '600',
        paddingHorizontal: 40,
    },

    subInstrucciones: {
        marginTop: 8,
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 40,
    },

    botonCerrar: {
        position: 'absolute',
        bottom: 45,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        backgroundColor: 'rgba(0,0,0,0.65)',

        paddingVertical: 12,
        paddingHorizontal: 24,

        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',

        gap: 8,
    },

    botonCerrarTexto: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});