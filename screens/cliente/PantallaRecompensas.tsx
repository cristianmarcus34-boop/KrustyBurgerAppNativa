// screens/cliente/PantallaRecompensas.tsx
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES
// ============================================================
const COLORS = {
    amarillo: '#F5C518',
    amarilloClaro: '#FFE066',
    amarilloOscuro: '#D4A800',
    rojo: '#E53935',
    rojoOscuro: '#B71C1C',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    blanco: '#FFFFFF',
    negro: '#0A0A0A',
    grisOscuro: '#1A1A1A',
    gris: '#333333',
    grisClaro: '#B0B0B0',
};

const { width, height } = Dimensions.get('window');

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    imagen?: string;
    activa: boolean;
}

export default function PantallaRecompensas(props: any) {
    const { perfil, actualizarPerfil } = tiendaAutenticacion();
    const insets = useSafeAreaInsets();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
    const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
    const [mensajeExito, setMensajeExito] = useState('');
    const [canjeando, setCanjeando] = useState(false);

    // ✅ Responsive
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    // ✅ Tamaños dinámicos
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const paddingTop = insets.top + (isTablet ? 30 : 20);
    const paddingBottom = insets.bottom + 20;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const puntosSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
    const puntosBadgePadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const iconoSize = isTablet ? 60 : isSmallPhone ? 44 : 50;
    const iconoContainer = isTablet ? 64 : isSmallPhone ? 48 : 54;
    const nombreSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const descSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
    const puntosTextSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
    const botonTextSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
    const botonPaddingH = isTablet ? 20 : isSmallPhone ? 12 : 16;
    const botonPaddingV = isTablet ? 12 : isSmallPhone ? 8 : 10;
    const modalWidth = isTablet ? '60%' : '85%';
    const modalPadding = isTablet ? 36 : isSmallPhone ? 20 : 24;
    const modalTituloSize = isTablet ? 26 : isSmallPhone ? 20 : 22;
    const modalTextSize = isTablet ? 16 : isSmallPhone ? 13 : 14;

    useEffect(() => { cargarRecompensas(); }, []);

    const cargarRecompensas = async () => {
        const { data } = await supabase
            .from('recompensas')
            .select('*')
            .eq('activa', true)
            .order('puntos_necesarios', { ascending: true });
        setRecompensas(data as Recompensa[] || []);
        setCargando(false);
    };

    const mostrarExito = (mensaje: string) => {
        setMensajeExito(mensaje);
        setMostrarModalExito(true);
        setTimeout(() => setMostrarModalExito(false), 2500);
    };

    const confirmarCanje = (recompensa: Recompensa) => {
        const puntos = perfil?.puntos_disponibles || 0;
        if (puntos < recompensa.puntos_necesarios) {
            mostrarExito('❌ Puntos insuficientes');
            return;
        }
        setRecompensaSeleccionada(recompensa);
        setMostrarModalConfirmar(true);
    };

    const canjear = async () => {
        if (!recompensaSeleccionada || !perfil) return;
        setMostrarModalConfirmar(false);
        setCanjeando(true);

        try {
            // ✅ USAR LA FUNCIÓN canjear_recompensa DE SUPABASE
            const { data, error } = await supabase
                .rpc('canjear_recompensa', {
                    p_usuario_id: perfil.id,
                    p_recompensa_id: recompensaSeleccionada.id
                });

            if (error) {
                console.error('Error al canjear:', error);
                mostrarExito('❌ Error al canjear recompensa');
                setCanjeando(false);
                return;
            }

            if (!data || !data[0]) {
                mostrarExito('❌ Error al procesar el canje');
                setCanjeando(false);
                return;
            }

            const resultado = data[0];

            if (!resultado.exito) {
                mostrarExito(`❌ ${resultado.mensaje}`);
                setCanjeando(false);
                return;
            }

            // ✅ ACTUALIZAR EL PERFIL CON LOS PUNTOS RESTANTES
            const { data: perfilActualizado, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', perfil.id)
                .single();

            if (perfilActualizado && !errorPerfil) {
                tiendaAutenticacion.setState({ perfil: perfilActualizado });
            }

            mostrarExito(`🎉 ¡Cupón canjeado! ${recompensaSeleccionada.nombre}`);
            cargarRecompensas();

        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarExito('❌ Error al canjear recompensa');
        } finally {
            setCanjeando(false);
        }
    };

    const getIconoPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return '💰';
            case 'PRODUCTO_GRATIS': return '🍔';
            case 'ENVIO_GRATIS': return '🚚';
            default: return '🎁';
        }
    };

    const getTituloTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return 'Descuento';
            case 'PRODUCTO_GRATIS': return 'Producto Gratis';
            case 'ENVIO_GRATIS': return 'Envío Gratis';
            default: return 'Recompensa';
        }
    };

    const renderRecompensa = ({ item }: { item: Recompensa }) => {
        const puntosDisponibles = perfil?.puntos_disponibles || 0;
        const disponible = puntosDisponibles >= item.puntos_necesarios;

        return (
            <View style={[
                estilos.tarjeta,
                disponible && estilos.tarjetaDisponible,
                {
                    padding: tarjetaPadding,
                    borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
                    borderColor: disponible ? COLORS.amarillo + '40' : COLORS.gris + '30',
                }
            ]}>
                <View style={[
                    estilos.tarjetaIcono,
                    {
                        width: iconoContainer,
                        height: iconoContainer,
                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                        backgroundColor: disponible ? COLORS.amarillo + '20' : COLORS.gris + '20',
                    }
                ]}>
                    <Text style={[estilos.icono, { fontSize: iconoSize }]}>
                        {getIconoPorTipo(item.tipo)}
                    </Text>
                </View>

                <View style={estilos.tarjetaInfo}>
                    <View style={estilos.tarjetaHeader}>
                        <Text style={[estilos.tarjetaNombre, { fontSize: nombreSize }]} numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <View style={[
                            estilos.tipoBadge,
                            {
                                paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8,
                                backgroundColor: disponible ? COLORS.amarillo + '20' : COLORS.gris + '20',
                            }
                        ]}>
                            <Text style={[
                                estilos.tipoBadgeTexto,
                                {
                                    fontSize: isTablet ? 11 : isSmallPhone ? 8 : 9,
                                    color: disponible ? COLORS.amarillo : COLORS.grisClaro,
                                }
                            ]}>
                                {getTituloTipo(item.tipo)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[estilos.tarjetaDesc, { fontSize: descSize }]} numberOfLines={2}>
                        {item.descripcion}
                    </Text>

                    <View style={estilos.tarjetaFooter}>
                        <View style={estilos.puntosContainer}>
                            <Text style={[estilos.puntosIconoSmall, { fontSize: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>⭐</Text>
                            <Text style={[
                                estilos.tarjetaPuntos,
                                {
                                    fontSize: puntosTextSize,
                                    color: disponible ? COLORS.amarillo : COLORS.grisClaro,
                                }
                            ]}>
                                {item.puntos_necesarios} pts
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                estilos.botonCanjear,
                                disponible && estilos.botonCanjearActivo,
                                {
                                    paddingHorizontal: botonPaddingH,
                                    paddingVertical: botonPaddingV,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: disponible ? COLORS.amarillo : COLORS.gris + '30',
                                }
                            ]}
                            onPress={() => confirmarCanje(item)}
                            disabled={!disponible || canjeando}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                estilos.botonCanjearTexto,
                                {
                                    fontSize: botonTextSize,
                                    color: disponible ? COLORS.negro : COLORS.grisClaro,
                                    fontWeight: disponible ? '700' : '500',
                                }
                            ]}>
                                {canjeando ? '⏳ Canjeando...' : disponible ? '🔓 Canjear' : '🔒 Bloqueado'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={estilos.contenedor}>
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ HEADER */}
            <View style={[
                estilos.header,
                {
                    paddingTop: paddingTop,
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                </TouchableOpacity>

                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
                    🎁 Recompensas
                </Text>

                <View style={[
                    estilos.puntosBadge,
                    {
                        paddingHorizontal: puntosBadgePadding,
                        paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                        borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 20,
                    }
                ]}>
                    <Text style={[estilos.puntosIcono, { fontSize: isTablet ? 18 : isSmallPhone ? 13 : 15 }]}>⭐</Text>
                    <Text style={[estilos.puntosTexto, { fontSize: puntosSize }]}>
                        {perfil?.puntos_disponibles || 0}
                    </Text>
                </View>
            </View>

            {/* ✅ CONTENIDO */}
            {cargando ? (
                <View style={estilos.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.amarillo} />
                    <Text style={[estilos.loadingTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                        Cargando recompensas...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={recompensas}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderRecompensa}
                    contentContainerStyle={[
                        estilos.lista,
                        {
                            paddingHorizontal: paddingHorizontal,
                            paddingBottom: paddingBottom + 20,
                            paddingTop: isTablet ? 12 : 8,
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={estilos.vacio}>
                            <Ionicons name="gift-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
                            <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                                No hay recompensas
                            </Text>
                            <Text style={[estilos.vacioSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                                Pronto tendremos nuevas recompensas para vos 🎉
                            </Text>
                        </View>
                    }
                />
            )}

            {/* ✅ MODAL CONFIRMAR */}
            <Modal visible={mostrarModalConfirmar} transparent animationType="fade">
                <View style={estilos.modalFondo}>
                    <View style={[
                        estilos.modal,
                        {
                            padding: modalPadding,
                            borderRadius: isTablet ? 28 : isSmallPhone ? 18 : 24,
                            width: modalWidth,
                            borderColor: COLORS.amarillo + '40',
                        }
                    ]}>
                        <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>🎁</Text>
                        <Text style={[estilos.modalTitulo, { fontSize: modalTituloSize }]}>
                            Confirmar Canje
                        </Text>
                        <Text style={[estilos.modalTexto, { fontSize: modalTextSize }]}>
                            Usar <Text style={estilos.modalTextoDestacado}>{recompensaSeleccionada?.puntos_necesarios} pts</Text> por:
                            {"\n"}
                            <Text style={estilos.modalTextoRecompensa}>"{recompensaSeleccionada?.nombre}"</Text>
                        </Text>

                        <View style={[estilos.modalBotones, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12 }]}>
                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalCancelar, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                }]}
                                onPress={() => setMostrarModalConfirmar(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[estilos.modalBoton, estilos.modalConfirmar, {
                                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    overflow: 'hidden',
                                }]}
                                onPress={canjear}
                                disabled={canjeando}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                                    style={estilos.modalConfirmarGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {canjeando ? (
                                        <ActivityIndicator size="small" color={COLORS.negro} />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.negro} />
                                            <Text style={[estilos.modalConfirmarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                                Canjear
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL ÉXITO */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={estilos.modalFondo}>
                    <View style={[
                        estilos.modal,
                        estilos.modalExito,
                        {
                            padding: modalPadding,
                            borderRadius: isTablet ? 28 : isSmallPhone ? 18 : 24,
                            width: modalWidth,
                            borderColor: COLORS.verdeClaro + '40',
                        }
                    ]}>
                        <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[estilos.modalTitulo, { fontSize: modalTituloSize, color: COLORS.verdeClaro }]}>
                            {mensajeExito}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: COLORS.negro,
    },
    fondoGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '10',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
    },
    puntosBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.amarillo + '15',
        borderWidth: 1,
        borderColor: COLORS.amarillo + '30',
        gap: 6,
    },
    puntosIcono: {},
    puntosTexto: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingTexto: {
        color: COLORS.grisClaro,
        fontWeight: '400',
        opacity: 0.7,
    },
    lista: {
        flexGrow: 1,
    },
    tarjeta: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.negro + '60',
        borderWidth: 1,
        marginBottom: 12,
        opacity: 0.6,
    },
    tarjetaDisponible: {
        opacity: 1,
        borderWidth: 2,
    },
    tarjetaIcono: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    icono: {},
    tarjetaInfo: {
        flex: 1,
    },
    tarjetaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        flexWrap: 'wrap',
        gap: 4,
    },
    tarjetaNombre: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        flex: 1,
    },
    tipoBadge: {
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    tipoBadgeTexto: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    tarjetaDesc: {
        color: COLORS.grisClaro,
        marginTop: 2,
        opacity: 0.7,
        lineHeight: 18,
    },
    tarjetaFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 6,
    },
    puntosContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    puntosIconoSmall: {},
    tarjetaPuntos: {
        fontWeight: 'bold',
    },
    botonCanjear: {
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    botonCanjearActivo: {
        borderColor: COLORS.amarillo,
    },
    botonCanjearTexto: {
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    vacio: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    vacioTexto: {
        color: COLORS.blanco,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    vacioSubtexto: {
        color: COLORS.grisClaro,
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.6,
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: COLORS.grisOscuro,
        alignItems: 'center',
        borderWidth: 2,
        maxWidth: 500,
    },
    modalExito: {
        borderWidth: 2,
    },
    modalIcono: {
        marginBottom: 12,
    },
    modalTitulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalTexto: {
        color: COLORS.grisClaro,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    modalTextoDestacado: {
        color: COLORS.amarillo,
        fontWeight: 'bold',
    },
    modalTextoRecompensa: {
        color: COLORS.blanco,
        fontWeight: 'bold',
    },
    modalBotones: {
        flexDirection: 'row',
        width: '100%',
    },
    modalBoton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    modalCancelar: {
        backgroundColor: COLORS.negro + '50',
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    modalCancelarTexto: {
        color: COLORS.blanco,
        fontWeight: '600',
    },
    modalConfirmar: {
        overflow: 'hidden',
    },
    modalConfirmarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: '100%',
        height: '100%',
    },
    modalConfirmarTexto: {
        color: COLORS.negro,
        fontWeight: 'bold',
    },
});