
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colores } from '../../lib/colores';
import { cuponService } from '../../lib/cupones/cuponService';
import { CuponUsuario } from '../../lib/cupones/cuponTypes';

interface CuponSelectorProps {
    usuarioId: string;
    cuponSeleccionado?: CuponUsuario | null;
    onSeleccionar: (cupon: CuponUsuario | null) => void;
    onVerTodos?: () => void;
    refrescar?: number;
}

export const CuponSelector: React.FC<CuponSelectorProps> = ({
    usuarioId,
    cuponSeleccionado = null,
    onSeleccionar,
    onVerTodos,
    refrescar = 0,
}) => {
    const [cupones, setCupones] = useState<CuponUsuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState(false);

    const cargarCupones = async () => {
        if (!usuarioId) {
            setCupones([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const disponibles =
                await cuponService.obtenerCuponesDisponibles(usuarioId);

            setCupones(disponibles);
        } catch (error) {
            console.error(
                'Error cargando cupones disponibles:',
                error
            );
            setCupones([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCupones();
    }, [usuarioId, refrescar]);

    const obtenerTextoDescuento = (cupon: CuponUsuario): string => {
        if (!cupon.cupon) {
            return 'Beneficio disponible';
        }

        return cuponService.formatearDescuento(cupon.cupon);
    };

    const obtenerIcono = (
        cupon: CuponUsuario
    ): keyof typeof Ionicons.glyphMap => {
        switch (cupon.cupon?.tipo) {
            case 'envio_gratis':
                return 'bicycle-outline';

            case 'producto_gratis':
                return 'gift-outline';

            case '2x1':
                return 'pricetags-outline';

            default:
                return 'ticket-outline';
        }
    };

    const seleccionarCupon = (cupon: CuponUsuario) => {
        if (
            cuponSeleccionado?.id === cupon.id
        ) {
            onSeleccionar(null);
            return;
        }

        onSeleccionar(cupon);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Ionicons
                            name="ticket-outline"
                            size={21}
                            color={Colores.primario}
                        />

                        <Text style={styles.title}>
                            Mis cupones
                        </Text>
                    </View>
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="small"
                        color={Colores.primario}
                    />

                    <Text style={styles.loadingText}>
                        Buscando tus cupones...
                    </Text>
                </View>
            </View>
        );
    }

    if (cupones.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Ionicons
                            name="ticket-outline"
                            size={21}
                            color={Colores.primario}
                        />

                        <Text style={styles.title}>
                            ¿Tenés un cupón?
                        </Text>
                    </View>
                </View>

                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="ticket-outline"
                        size={30}
                        color={Colores.textoGris}
                    />

                    <View style={styles.emptyTextContainer}>
                        <Text style={styles.emptyTitle}>
                            No tenés cupones disponibles
                        </Text>

                        <Text style={styles.emptyText}>
                            Podés ingresar un código o escanear
                            un QR para agregar uno.
                        </Text>
                    </View>

                    {onVerTodos && (
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onVerTodos}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Agregar cupón
                            </Text>

                            <Ionicons
                                name="arrow-forward"
                                size={16}
                                color={Colores.primario}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    const cuponesVisibles = expandido
        ? cupones
        : cupones.slice(0, 2);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons
                        name="ticket-outline"
                        size={21}
                        color={Colores.primario}
                    />

                    <Text style={styles.title}>
                        Mis cupones
                    </Text>

                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {cupones.length}
                        </Text>
                    </View>
                </View>

                {onVerTodos && (
                    <TouchableOpacity
                        onPress={onVerTodos}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewAllText}>
                            Ver todos
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.list}>
                {cuponesVisibles.map((cuponUsuario) => {
                    const seleccionado =
                        cuponSeleccionado?.id === cuponUsuario.id;

                    const cupon = cuponUsuario.cupon;

                    if (!cupon) {
                        return null;
                    }

                    return (
                        <TouchableOpacity
                            key={cuponUsuario.id}
                            onPress={() =>
                                seleccionarCupon(cuponUsuario)
                            }
                            activeOpacity={0.88}
                            style={[
                                styles.couponWrapper,
                                seleccionado &&
                                styles.couponWrapperSelected,
                            ]}
                        >
                            <LinearGradient
                                colors={[
                                    Colores.fondoBlanco,
                                    'rgba(255, 193, 7, 0.05)',
                                ]}
                                start={{
                                    x: 0,
                                    y: 0,
                                }}
                                end={{
                                    x: 1,
                                    y: 1,
                                }}
                                style={styles.couponCard}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name={obtenerIcono(
                                            cuponUsuario
                                        )}
                                        size={24}
                                        color={Colores.primario}
                                    />
                                </View>

                                <View style={styles.couponInfo}>
                                    <Text
                                        style={styles.couponTitle}
                                        numberOfLines={1}
                                    >
                                        {cupon.titulo}
                                    </Text>

                                    <Text
                                        style={styles.discountText}
                                    >
                                        {obtenerTextoDescuento(
                                            cuponUsuario
                                        )}
                                    </Text>

                                    {cupon.descripcion && (
                                        <Text
                                            style={styles.description}
                                            numberOfLines={1}
                                        >
                                            {cupon.descripcion}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.selectionContainer}>
                                    <View
                                        style={[
                                            styles.radio,
                                            seleccionado &&
                                            styles.radioSelected,
                                        ]}
                                    >
                                        {seleccionado && (
                                            <Ionicons
                                                name="checkmark"
                                                size={15}
                                                color={
                                                    Colores.krustyBlanco
                                                }
                                            />
                                        )}
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {cupones.length > 2 && (
                <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() =>
                        setExpandido(!expandido)
                    }
                    activeOpacity={0.7}
                >
                    <Text style={styles.expandButtonText}>
                        {expandido
                            ? 'Mostrar menos'
                            : `Ver ${cupones.length - 2} cupón${cupones.length - 2 === 1
                                ? ''
                                : 'es'
                            } más`}
                    </Text>

                    <Ionicons
                        name={
                            expandido
                                ? 'chevron-up'
                                : 'chevron-down'
                        }
                        size={17}
                        color={Colores.primario}
                    />
                </TouchableOpacity>
            )}

            {cuponSeleccionado && (
                <View style={styles.selectedInfo}>
                    <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={Colores.primario}
                    />

                    <Text style={styles.selectedInfoText}>
                        Cupón seleccionado. Se aplicará al pedido.
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            onSeleccionar(null)
                        }
                        activeOpacity={0.7}
                    >
                        <Text style={styles.removeText}>
                            Quitar
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 18,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colores.textoOscuro,
    },

    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colores.primario,
    },

    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colores.primario,
    },

    loadingContainer: {
        minHeight: 70,
        borderRadius: 14,
        backgroundColor: Colores.fondoBlanco,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 9,
    },

    loadingText: {
        fontSize: 13,
        color: Colores.textoGrisOscuro,
    },

    emptyContainer: {
        borderRadius: 14,
        backgroundColor: Colores.fondoBlanco,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    emptyTextContainer: {
        flex: 1,
    },

    emptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colores.textoOscuro,
        marginBottom: 3,
    },

    emptyText: {
        fontSize: 12,
        lineHeight: 17,
        color: Colores.textoGrisOscuro,
    },

    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },

    secondaryButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colores.primario,
    },

    list: {
        gap: 9,
    },

    couponWrapper: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
    },

    couponWrapperSelected: {
        borderWidth: 2,
        borderColor: Colores.primario,
    },

    couponCard: {
        minHeight: 78,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.14)',
        marginRight: 11,
    },

    couponInfo: {
        flex: 1,
    },

    couponTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colores.textoOscuro,
        marginBottom: 3,
    },

    discountText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colores.primario,
        marginBottom: 2,
    },

    description: {
        fontSize: 11,
        color: Colores.textoGrisOscuro,
    },

    selectionContainer: {
        marginLeft: 10,
    },

    radio: {
        width: 23,
        height: 23,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    radioSelected: {
        borderColor: Colores.primario,
        backgroundColor: Colores.primario,
    },

    expandButton: {
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },

    expandButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colores.primario,
    },

    selectedInfo: {
        marginTop: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 193, 7, 0.09)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },

    selectedInfoText: {
        flex: 1,
        fontSize: 12,
        color: Colores.textoOscuro,
        fontWeight: '600',
    },

    removeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colores.textoRojo,
    },
});

export default CuponSelector;

