import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colores } from '../../lib/colores';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';
import { cuponService } from '../../lib/cupones/cuponService';

interface CuponCardProps {
    cuponUsuario: CuponUsuario;
    onPress?: () => void;
}

export default function CuponCard({
    cuponUsuario,
    onPress,
}: CuponCardProps) {

    const cupon = cuponUsuario.cupon;

    if (!cupon) return null;

    const expirado =
        new Date(cupon.fecha_expiracion) < new Date();

    const usado = cuponUsuario.usado_en_pedido;

    const estado = usado
        ? 'Usado'
        : expirado
            ? 'Expirado'
            : 'Activo';

    const esInactivo = usado || expirado;

    const tipoTexto =
        cupon.tipo === 'descuento'
            ? '💰 Descuento'
            : cupon.tipo === 'producto_gratis'
                ? '🎁 Producto Gratis'
                : cupon.tipo === 'envio_gratis'
                    ? '📦 Envío Gratis'
                    : cupon.tipo === '2x1'
                        ? '🔄 2x1'
                        : '🎟️ Cupón';

    return (
        <View
            style={[
                styles.card,
                esInactivo && styles.cardInactivo,
            ]}
        >
            <LinearGradient
                colors={
                    esInactivo
                        ? ['#333333', '#222222']
                        : [
                            Colores.primario + '33',
                            Colores.secundario + '33',
                        ]
                }
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >

                {/* ENCABEZADO */}
                <View style={styles.header}>

                    <View style={styles.tipo}>
                        <Text style={styles.tipoTexto}>
                            {tipoTexto}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.estado,
                            usado && styles.estadoInactivo,
                            expirado && styles.estadoInactivo,
                        ]}
                    >
                        <Text style={styles.estadoTexto}>
                            {estado}
                        </Text>
                    </View>

                </View>

                {/* TÍTULO */}
                <Text
                    style={[
                        styles.titulo,
                        esInactivo && styles.textoInactivo,
                    ]}
                >
                    {cupon.titulo}
                </Text>

                {/* DESCRIPCIÓN */}
                {cupon.descripcion && (
                    <Text
                        style={[
                            styles.descripcion,
                            esInactivo && styles.textoInactivo,
                        ]}
                    >
                        {cupon.descripcion}
                    </Text>
                )}

                {/* INFORMACIÓN */}
                <View style={styles.footer}>

                    <View style={styles.codigoContainer}>
                        <Text style={styles.codigoLabel}>
                            CÓDIGO
                        </Text>

                        <Text style={styles.codigo}>
                            {cupon.codigo}
                        </Text>
                    </View>

                    <View style={styles.valorContainer}>
                        <Text style={styles.valor}>
                            {cuponService.formatearDescuento(cupon)}
                        </Text>
                    </View>

                </View>

                {/* FECHA DE CANJE */}
                {cuponUsuario.fecha_canje && (
                    <Text style={styles.fecha}>
                        Canjeado:{' '}
                        {new Date(
                            cuponUsuario.fecha_canje
                        ).toLocaleDateString()}
                    </Text>
                )}

                {/* PEDIDO */}
                {cuponUsuario.pedido_id && (
                    <View style={styles.pedido}>
                        <Ionicons
                            name="receipt-outline"
                            size={14}
                            color={Colores.textoGris}
                        />

                        <Text style={styles.pedidoTexto}>
                            Pedido #{cuponUsuario.pedido_id}
                        </Text>
                    </View>
                )}

            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({

    card: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    cardInactivo: {
        opacity: 0.6,
    },

    gradient: {
        padding: 16,
        gap: 8,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    tipo: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },

    tipoTexto: {
        fontSize: 12,
        color: Colores.textoClaro,
        fontWeight: '500',
    },

    estado: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(76,175,80,0.2)',
    },

    estadoInactivo: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    estadoTexto: {
        fontSize: 11,
        color: Colores.textoClaro,
        fontWeight: '600',
    },

    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        marginTop: 4,
    },

    textoInactivo: {
        color: Colores.textoGris,
    },

    descripcion: {
        fontSize: 14,
        color: Colores.textoGris,
        lineHeight: 20,
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },

    codigoContainer: {
        gap: 2,
    },

    codigoLabel: {
        fontSize: 10,
        color: Colores.textoGris + '60',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    codigo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.textoClaro,
        letterSpacing: 1.5,
    },

    valorContainer: {
        backgroundColor: Colores.secundario + '20',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
    },

    valor: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colores.secundario,
    },

    fecha: {
        fontSize: 11,
        color: Colores.textoGris,
        marginTop: 4,
    },

    pedido: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },

    pedidoTexto: {
        fontSize: 12,
        color: Colores.textoGris,
    },
});