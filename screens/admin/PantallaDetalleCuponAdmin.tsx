// screens/admin/PantallaDetalleCuponAdmin.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { cuponService } from '../../lib/cupones/cuponService';
import { Cupon } from '../../lib/cupones/cuponTypes';
import { generarDatosQR, generarUrlCupon } from '../../lib/cupones/generadorQR';
import { Colores } from '../../lib/colores';

export default function PantallaDetalleCuponAdmin({ route, navigation }: any) {
    const { cuponId } = route.params;
    const insets = useSafeAreaInsets();

    const [cupon, setCupon] = useState<Cupon | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarCupon();
    }, [cuponId]);

    const cargarCupon = async () => {
        try {
            const data = await cuponService.obtenerCuponPorId(cuponId);
            setCupon(data);
        } catch (error) {
            console.error('Error cargando cupón:', error);
            Alert.alert('Error', 'No se pudo cargar el cupón');
        } finally {
            setCargando(false);
        }
    };

    const handleShare = async () => {
        if (!cupon) return;
        try {
            const url = generarUrlCupon(cupon.codigo);
            await Share.share({
                message: `🎫 ¡Cupón Krusty Burger!\n\n${cupon.titulo}\n${cupon.descripcion || ''}\n\nCódigo: ${cupon.codigo}\n\nEscanea el QR o ingresa el código en la app para canjearlo.\n\n${url}`,
                title: cupon.titulo,
            });
        } catch (error) {
            console.error('Error compartiendo:', error);
        }
    };

    const handleCopyCode = async () => {
        if (!cupon) return;
        await Clipboard.setStringAsync(cupon.codigo);
        Alert.alert('¡Copiado!', 'Código copiado al portapapeles');
    };

    if (cargando) {
        return (
            <View style={[styles.centrado, { backgroundColor: Colores.fondoOscuro }]}>
                <ActivityIndicator size="large" color={Colores.secundario} />
            </View>
        );
    }

    if (!cupon) {
        return (
            <View style={[styles.centrado, { backgroundColor: Colores.fondoOscuro }]}>
                <Text style={styles.errorText}>Cupón no encontrado</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colores.primario, Colores.secundario]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color={Colores.textoClaro} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Detalle del Cupón</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <QRCode
                        value={generarDatosQR(cupon)}
                        size={200}
                        color={Colores.textoOscuro}
                        backgroundColor="white"
                    />
                    <Text style={styles.qrLabel}>Código QR para canjear</Text>
                </View>

                {/* Info del cupón */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitulo}>{cupon.titulo}</Text>
                    {cupon.descripcion && (
                        <Text style={styles.infoDescripcion}>{cupon.descripcion}</Text>
                    )}

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Código</Text>
                        <TouchableOpacity style={styles.infoCodigoContainer} onPress={handleCopyCode}>
                            <Text style={styles.infoCodigo}>{cupon.codigo}</Text>
                            <Ionicons name="copy-outline" size={18} color={Colores.textoGris} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tipo</Text>
                        <Text style={styles.infoValue}>
                            {cupon.tipo === 'descuento' && '💰 Descuento'}
                            {cupon.tipo === 'producto_gratis' && '🎁 Producto Gratis'}
                            {cupon.tipo === 'envio_gratis' && '📦 Envío Gratis'}
                            {cupon.tipo === '2x1' && '🔄 2x1'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Valor</Text>
                        <Text style={[styles.infoValue, { color: Colores.secundario, fontWeight: 'bold' }]}>
                            {cuponService.formatearDescuento(cupon)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Usos</Text>
                        <Text style={styles.infoValue}>
                            {cupon.usos_totales}{cupon.usos_maximos ? ` / ${cupon.usos_maximos}` : ''}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Por usuario</Text>
                        <Text style={styles.infoValue}>{cupon.cantidad_maxima}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Válido desde</Text>
                        <Text style={styles.infoValue}>
                            {new Date(cupon.fecha_inicio).toLocaleDateString()}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Expira</Text>
                        <Text style={[styles.infoValue, new Date(cupon.fecha_expiracion) < new Date() && { color: Colores.primario }]}>
                            {new Date(cupon.fecha_expiracion).toLocaleDateString()}
                            {new Date(cupon.fecha_expiracion) < new Date() && ' ⚠️ Expirado'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Estado</Text>
                        <View style={[styles.estadoBadge, cupon.activo ? styles.estadoActivo : styles.estadoInactivo]}>
                            <Text style={styles.estadoText}>
                                {cupon.activo ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Acciones */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.actionShare]} onPress={handleShare}>
                        <Ionicons name="share-social-outline" size={24} color={Colores.textoOscuro} />
                        <Text style={styles.actionButtonText}>Compartir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionPrint]}
                        onPress={() => {
                            // Función para imprimir (usando expo-print o similar)
                            Alert.alert('Imprimir', 'Funcionalidad de impresión disponible');
                        }}
                    >
                        <Ionicons name="print-outline" size={24} color={Colores.textoOscuro} />
                        <Text style={styles.actionButtonText}>Imprimir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionEdit]}
                        onPress={() => navigation.navigate('GestionCupones', { editCuponId: cupon.id })}
                    >
                        <Ionicons name="pencil-outline" size={24} color={Colores.textoOscuro} />
                        <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        height: 300,
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
    },
    errorText: {
        color: Colores.textoGris,
        fontSize: 18,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: Colores.textoClaro,
    },
    qrContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    qrLabel: {
        color: Colores.textoGris,
        marginTop: 12,
        fontSize: 14,
    },
    infoContainer: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        gap: 12,
    },
    infoTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        marginBottom: 4,
    },
    infoDescripcion: {
        fontSize: 14,
        color: Colores.textoGris,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    infoLabel: {
        fontSize: 14,
        color: Colores.textoGris,
    },
    infoValue: {
        fontSize: 14,
        color: Colores.textoClaro,
    },
    infoCodigoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoCodigo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    estadoBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    estadoActivo: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    estadoInactivo: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    estadoText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colores.textoClaro,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    actionShare: {
        backgroundColor: Colores.secundario,
    },
    actionPrint: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionEdit: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colores.textoOscuro,
    },
});