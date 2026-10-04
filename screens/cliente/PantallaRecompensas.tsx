// screens/cliente/PantallaRecompensas.tsx - V2 CON BENEFICIOS POR NIVEL
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, ActivityIndicator, Alert, useWindowDimensions, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { obtenerNivel, NIVELES } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isSmallPhone = width < 375;

    const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
        if (isDesktop || isTablet) return valores.tablet;
        if (isSmallPhone) return valores.small;
        return valores.normal;
    }, [isDesktop, isTablet, isSmallPhone]);

    return { isTablet, isDesktop, isSmallPhone, width, height, getValor };
};

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

// ============================================================
// 📊 CONFIGURACIÓN DE BENEFICIOS POR NIVEL
// (Debe reflejar la lógica de servicios/beneficiosService.ts)
// ============================================================
interface BeneficioNivel {
    key: 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
    puntos: number;
    icono: string;
    nombre: string;
    color: string;
    beneficios: string[];
}

const NIVELES_CONFIG: BeneficioNivel[] = [
    {
        key: 'BRONCE',
        puntos: 0,
        icono: '🥉',
        nombre: 'Bronce',
        color: '#A1887F',
        beneficios: [
            'Acumulá 1 punto por cada $100 de compra',
            'Acceso a promociones generales',
            'Envío estándar con costo',
        ],
    },
    {
        key: 'PLATA',
        puntos: 500,
        icono: '🥈',
        nombre: 'Plata',
        color: '#BDBDBD',
        beneficios: [
            'Todo lo de Bronce',
            '5% de descuento en todos los pedidos',
            'Envío gratis en compras > $5.000',
            'Promociones exclusivas',
        ],
    },
    {
        key: 'ORO',
        puntos: 1500,
        icono: '👑',
        nombre: 'Oro',
        color: '#F9A825',
        beneficios: [
            'Todo lo de Plata',
            '10% de descuento en todos los pedidos',
            'Envío gratis sin mínimo',
            'Prioridad en el despacho',
            'Acceso anticipado a ofertas',
        ],
    },
    {
        key: 'PLATINO',
        puntos: 5000,
        icono: '💎',
        nombre: 'Platino',
        color: '#78909C',
        beneficios: [
            'Todo lo de Oro',
            '15% de descuento en todos los pedidos',
            'Envío gratis sin mínimo',
            'Soporte prioritario',
            'Regalo sorpresa de cumpleaños',
            'Acceso VIP a eventos Krusty',
        ],
    },
];

export default function PantallaRecompensas(props: any) {
    const { perfil, sesion, cargando: cargandoAuth, actualizarPerfil } = tiendaAutenticacion();
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();

    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
    const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
    const [mensajeExito, setMensajeExito] = useState('');
    const [canjeando, setCanjeando] = useState(false);

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    // ✅ Tamaños
    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
    const paddingTop = insets.top + (isTablet ? 30 : 20);
    const paddingBottom = insets.bottom + 20;
    const tituloSize = isTablet ? 24 : isSmallPhone ? 17 : 20;
    const puntosSize = isTablet ? 14 : isSmallPhone ? 11 : 12;
    const puntosBadgePadding = isTablet ? 14 : isSmallPhone ? 10 : 12;
    const tarjetaPadding = isTablet ? 18 : isSmallPhone ? 12 : 14;
    const iconoSize = isTablet ? 60 : isSmallPhone ? 44 : 50;
    const iconoContainer = isTablet ? 64 : isSmallPhone ? 48 : 54;
    const nombreSize = isTablet ? 14 : isSmallPhone ? 12 : 13;
    const descSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
    const puntosTextSize = isTablet ? 13 : isSmallPhone ? 11 : 12;
    const botonTextSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
    const botonPaddingH = isTablet ? 20 : isSmallPhone ? 12 : 16;
    const botonPaddingV = isTablet ? 12 : isSmallPhone ? 8 : 10;
    const modalWidth = isTablet ? '60%' : '85%';
    const modalPadding = isTablet ? 36 : isSmallPhone ? 20 : 24;
    const modalTituloSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
    const modalTextSize = isTablet ? 14 : isSmallPhone ? 12 : 13;

    // 🎯 Datos del nivel actual
    const puntosActuales = perfil?.puntos_acumulados || 0;
    const nivelActual = useMemo(() => obtenerNivel(puntosActuales), [puntosActuales]);
    const nivelActualKey = useMemo(() => {
        if (puntosActuales >= 5000) return 'PLATINO';
        if (puntosActuales >= 1500) return 'ORO';
        if (puntosActuales >= 500) return 'PLATA';
        return 'BRONCE';
    }, [puntosActuales]);

    // ============================================================
    // 🔒 GUARD DE SESIÓN
    // ============================================================
    useEffect(() => {
        if (!cargandoAuth && !sesion) {
            console.log('🔒 [Recompensas] Sin sesión → redirigiendo a Login');

            Alert.alert(
                'Iniciá sesión',
                'Necesitás una cuenta para canjear recompensas.',
                [
                    {
                        text: 'Volver',
                        style: 'cancel',
                        onPress: () => props.navigation.goBack(),
                    },
                    {
                        text: 'Iniciar sesión',
                        onPress: () => props.navigation.replace('Login'),
                    },
                    {
                        text: 'Registrarme',
                        onPress: () => props.navigation.replace('Registro'),
                    },
                ],
                { cancelable: false }
            );
        }
    }, [sesion, cargandoAuth]);

    useEffect(() => {
        if (sesion) {
            cargarRecompensas();
        } else {
            setCargando(false);
        }
    }, [sesion]);

    const cargarRecompensas = async () => {
        try {
            const { data } = await supabase
                .from('recompensas')
                .select('*')
                .eq('activa', true)
                .order('puntos_necesarios', { ascending: true });
            setRecompensas(data as Recompensa[] || []);
        } finally {
            setCargando(false);
        }
    };

    const mostrarExito = (mensaje: string) => {
        setMensajeExito(mensaje);
        setMostrarModalExito(true);
        setTimeout(() => setMostrarModalExito(false), 2500);
    };

    const confirmarCanje = (recompensa: Recompensa) => {
        if (puntosActuales < recompensa.puntos_necesarios) {
            mostrarExito('❌ Puntos insuficientes');
            return;
        }
        setRecompensaSeleccionada(recompensa);
        setMostrarModalConfirmar(true);
    };

    const canjear = async () => {
        if (!recompensaSeleccionada || !perfil || !sesion) return;
        setMostrarModalConfirmar(false);
        setCanjeando(true);

        try {
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

            const { data: perfilActualizado, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', perfil.id)
                .single();

            if (perfilActualizado && !errorPerfil) {
                await actualizarPerfil(perfilActualizado);
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

    const getColorPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return DISENO.colors.accent;
            case 'PRODUCTO_GRATIS': return DISENO.colors.success;
            case 'ENVIO_GRATIS': return DISENO.colors.info;
            default: return DISENO.colors.accentSecondary;
        }
    };

    const renderRecompensa = ({ item }: { item: Recompensa }) => {
        const disponible = puntosActuales >= item.puntos_necesarios;
        const tipoColor = getColorPorTipo(item.tipo);
        const faltantes = Math.max(0, item.puntos_necesarios - puntosActuales);

        return (
            <View style={[
                styles.card,
                {
                    padding: tarjetaPadding,
                    borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
                    borderColor: disponible ? tipoColor + '50' : DISENO.colors.border,
                    borderWidth: disponible ? 1.5 : 1,
                    backgroundColor: DISENO.colors.surface,
                    opacity: disponible ? 1 : 0.85,
                    ...DISENO.shadow.sm,
                }
            ]}>
                <View style={[
                    styles.cardIcon,
                    {
                        width: iconoContainer,
                        height: iconoContainer,
                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                        backgroundColor: disponible ? tipoColor + '15' : DISENO.colors.surfaceHover,
                    }
                ]}>
                    <Text style={[styles.icon, { fontSize: iconoSize }]}>
                        {getIconoPorTipo(item.tipo)}
                    </Text>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardName, { fontSize: nombreSize, color: DISENO.colors.text }]} numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <View style={[
                            styles.typeBadge,
                            {
                                paddingHorizontal: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                paddingVertical: isTablet ? 4 : isSmallPhone ? 2 : 3,
                                borderRadius: isTablet ? 12 : isSmallPhone ? 6 : 8,
                                backgroundColor: disponible ? tipoColor + '15' : DISENO.colors.surfaceHover,
                                borderColor: disponible ? tipoColor + '40' : DISENO.colors.border,
                            }
                        ]}>
                            <Text style={[
                                styles.typeBadgeText,
                                {
                                    fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9,
                                    color: disponible ? tipoColor : DISENO.colors.textTertiary,
                                }
                            ]}>
                                {getTituloTipo(item.tipo)}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.cardDesc, { fontSize: descSize, color: DISENO.colors.textSecondary }]} numberOfLines={2}>
                        {item.descripcion}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.pointsContainer}>
                            <Text style={[styles.pointsIconSmall, { fontSize: isTablet ? 14 : isSmallPhone ? 10 : 12 }]}>⭐</Text>
                            <Text style={[
                                styles.cardPoints,
                                {
                                    fontSize: puntosTextSize,
                                    color: disponible ? DISENO.colors.accentSecondary : DISENO.colors.textTertiary,
                                }
                            ]}>
                                {item.puntos_necesarios} pts
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.redeemButton,
                                {
                                    paddingHorizontal: botonPaddingH,
                                    paddingVertical: botonPaddingV,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: disponible ? DISENO.colors.accentSecondary : DISENO.colors.surfaceHover,
                                    borderColor: disponible ? DISENO.colors.accentSecondary : DISENO.colors.border,
                                }
                            ]}
                            onPress={() => confirmarCanje(item)}
                            disabled={!disponible || canjeando}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.redeemButtonText,
                                {
                                    fontSize: botonTextSize,
                                    color: disponible ? DISENO.colors.text : DISENO.colors.textTertiary,
                                }
                            ]}>
                                {canjeando ? '⏳' : disponible ? '🔓 Canjear' : '🔒 Bloqueado'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ✅ NUEVO: Texto "Faltan X pts" si no está disponible */}
                    {!disponible && (
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: isSmallPhone ? 10 : 11,
                                color: DISENO.colors.textTertiary,
                                marginTop: 6,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Te faltan {faltantes} pts para canjear
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const tieneRecompensasDisponibles = recompensas.some(r => puntosActuales >= r.puntos_necesarios);

    // ============================================================
    // 🔒 RENDER TEMPRANO: invitado o cargando auth → spinner
    // ============================================================
    if (cargandoAuth || !sesion) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                    style={styles.backgroundGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={DISENO.colors.accent} />
                    <Text style={[styles.loadingText, { fontSize: 13, color: DISENO.colors.textSecondary }]}>
                        {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ HEADER */}
            <View style={[
                styles.header,
                {
                    paddingTop: paddingTop,
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 26 : 22} color={DISENO.colors.text} />
                </TouchableOpacity>

                <Text style={[styles.title, { fontSize: tituloSize, color: DISENO.colors.text }]}>
                    🎁 Recompensas
                </Text>

                <View style={[
                    styles.pointsBadge,
                    {
                        paddingHorizontal: puntosBadgePadding,
                        paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
                        borderRadius: isTablet ? 24 : isSmallPhone ? 16 : 20,
                        backgroundColor: DISENO.colors.surface,
                        borderColor: DISENO.colors.accentSecondary + '40',
                        borderWidth: 1,
                        ...DISENO.shadow.sm,
                    }
                ]}>
                    <Text style={[styles.pointsIcon, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>⭐</Text>
                    <Text style={[styles.pointsText, { fontSize: puntosSize, color: DISENO.colors.accentSecondary }]}>
                        {puntosActuales}
                    </Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: paddingBottom + 20,
                }}
            >
                {/* ═══════════════════════════════════════════════════ */}
                {/* 🏆 SECCIÓN: TU NIVEL ACTUAL (CARD DESTACADA)       */}
                {/* ═══════════════════════════════════════════════════ */}
                <View
                    style={{
                        marginTop: 8,
                        marginBottom: 16,
                        borderRadius: isTablet ? 20 : 16,
                        overflow: 'hidden',
                        ...DISENO.shadow.sm,
                    }}
                >
                    <LinearGradient
                        colors={[nivelActual.color + '25', nivelActual.color + '08']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            padding: isTablet ? 20 : 16,
                            borderWidth: 1,
                            borderColor: nivelActual.color + '30',
                            borderRadius: isTablet ? 20 : 16,
                        }}
                    >
                        {/* Fila: ícono + datos nivel */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <View
                                style={{
                                    width: isTablet ? 64 : 54,
                                    height: isTablet ? 64 : 54,
                                    borderRadius: (isTablet ? 64 : 54) / 2,
                                    backgroundColor: nivelActual.color + '20',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                    borderWidth: 2,
                                    borderColor: nivelActual.color + '40',
                                }}
                            >
                                <Text style={{ fontSize: isTablet ? 32 : 26 }} allowFontScaling={false}>
                                    {nivelActual.icono}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: isTablet ? 18 : 16,
                                        color: nivelActual.color,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Nivel {nivelActual.nombre}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: isTablet ? 13 : 12,
                                        color: DISENO.colors.textSecondary,
                                        marginTop: 2,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {puntosActuales} pts acumulados
                                </Text>
                            </View>

                            {nivelActual.siguiente !== '—' && (
                                <View
                                    style={{
                                        alignItems: 'flex-end',
                                        paddingLeft: 10,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 10,
                                            color: DISENO.colors.textTertiary,
                                            textTransform: 'uppercase',
                                            letterSpacing: 1,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Siguiente
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: isTablet ? 14 : 12,
                                            color: DISENO.colors.text,
                                            marginTop: 2,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {nivelActual.siguiente}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Progreso al siguiente nivel */}
                        {nivelActual.siguiente !== '—' ? (
                            <>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            color: DISENO.colors.textSecondary,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Progreso al siguiente nivel
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: 11,
                                            color: nivelActual.color,
                                            fontWeight: '600',
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {Math.round(nivelActual.progreso)}%
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: DISENO.colors.surface + '80',
                                        overflow: 'hidden',
                                        marginBottom: 8,
                                    }}
                                >
                                    <LinearGradient
                                        colors={[nivelActual.color, nivelActual.color + '80']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: `${nivelActual.progreso}%`,
                                            height: '100%',
                                            borderRadius: 4,
                                        }}
                                    />
                                </View>

                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: 11,
                                        color: DISENO.colors.textSecondary,
                                        textAlign: 'center',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Te faltan{' '}
                                    <Text style={{ fontWeight: '600', color: nivelActual.color }}>
                                        {Math.max(0, nivelActual.puntos_requeridos - puntosActuales)} pts
                                    </Text>
                                    {' '}para {nivelActual.siguiente}
                                </Text>
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: 14,
                                        color: nivelActual.color,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    🎉 ¡Alcanzaste el nivel máximo!
                                </Text>
                            </View>
                        )}
                    </LinearGradient>
                </View>

                {/* ═══════════════════════════════════════════════════ */}
                {/* 💎 SECCIÓN: BENEFICIOS POR NIVEL                   */}
                {/* ═══════════════════════════════════════════════════ */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                        <Ionicons name="trophy-outline" size={20} color={DISENO.colors.accent} />
                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: isTablet ? 18 : 16,
                                color: DISENO.colors.text,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Beneficios por nivel
                        </Text>
                    </View>

                    {NIVELES_CONFIG.map((nivel) => {
                        const esActual = nivel.key === nivelActualKey;
                        const esFuturo = nivel.puntos > puntosActuales;
                        const esPasado = !esActual && !esFuturo;

                        return (
                            <View
                                key={nivel.key}
                                style={{
                                    marginBottom: 10,
                                    borderRadius: isTablet ? 16 : 14,
                                    borderWidth: esActual ? 2 : 1,
                                    borderColor: esActual
                                        ? nivel.color + '80'
                                        : DISENO.colors.border,
                                    backgroundColor: esActual
                                        ? nivel.color + '10'
                                        : DISENO.colors.surface,
                                    overflow: 'hidden',
                                    opacity: esFuturo ? 0.85 : 1,
                                    ...(esActual ? DISENO.shadow.sm : {}),
                                }}
                            >
                                {/* Header del nivel */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: isTablet ? 14 : 12,
                                        paddingBottom: isTablet ? 10 : 8,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: isTablet ? 44 : 38,
                                            height: isTablet ? 44 : 38,
                                            borderRadius: (isTablet ? 44 : 38) / 2,
                                            backgroundColor: esFuturo
                                                ? DISENO.colors.surfaceHover
                                                : nivel.color + '20',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 10,
                                        }}
                                    >
                                        <Text style={{ fontSize: isTablet ? 22 : 18 }} allowFontScaling={false}>
                                            {nivel.icono}
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.display,
                                                    fontSize: isTablet ? 15 : 14,
                                                    color: esFuturo ? DISENO.colors.textSecondary : DISENO.colors.text,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {nivel.nombre}
                                            </Text>
                                            {esActual && (
                                                <View
                                                    style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        borderRadius: 8,
                                                        backgroundColor: nivel.color,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontFamily: FUENTES.display,
                                                            fontSize: 9,
                                                            color: '#FFFFFF',
                                                            includeFontPadding: false,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        TU NIVEL
                                                    </Text>
                                                </View>
                                            )}
                                            {esPasado && (
                                                <Ionicons name="checkmark-circle" size={14} color={DISENO.colors.success} />
                                            )}
                                        </View>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: isTablet ? 12 : 11,
                                                color: DISENO.colors.textTertiary,
                                                marginTop: 2,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {nivel.puntos === 0
                                                ? 'Desde 0 pts'
                                                : `${nivel.puntos} pts`}
                                        </Text>
                                    </View>

                                    {esFuturo && (
                                        <View
                                            style={{
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                                borderRadius: 8,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: 10,
                                                    color: DISENO.colors.textTertiary,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Faltan {nivel.puntos - puntosActuales} pts
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Lista de beneficios */}
                                <View
                                    style={{
                                        paddingHorizontal: isTablet ? 14 : 12,
                                        paddingBottom: isTablet ? 14 : 12,
                                        paddingTop: 4,
                                        borderTopWidth: 1,
                                        borderTopColor: DISENO.colors.border + '60',
                                    }}
                                >
                                    {nivel.beneficios.map((beneficio, idx) => (
                                        <View
                                            key={idx}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                marginTop: 8,
                                                gap: 8,
                                            }}
                                        >
                                            <Ionicons
                                                name={esFuturo ? 'lock-closed' : 'checkmark-circle'}
                                                size={14}
                                                color={esFuturo ? DISENO.colors.textTertiary : DISENO.colors.success}
                                                style={{ marginTop: 2 }}
                                            />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: isTablet ? 13 : 12,
                                                    color: esFuturo ? DISENO.colors.textTertiary : DISENO.colors.text,
                                                    flex: 1,
                                                    lineHeight: 18,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {beneficio}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* ═══════════════════════════════════════════════════ */}
                {/* 🎁 SECCIÓN: RECOMPENSAS CANJEABLES                 */}
                {/* ═══════════════════════════════════════════════════ */}
                <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                        <Ionicons name="gift-outline" size={20} color={DISENO.colors.accent} />
                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: isTablet ? 18 : 16,
                                color: DISENO.colors.text,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Canjeá tus puntos
                        </Text>
                    </View>

                    <Text
                        style={{
                            fontFamily: FUENTES.regular,
                            fontSize: isTablet ? 13 : 12,
                            color: DISENO.colors.textSecondary,
                            marginBottom: 12,
                            lineHeight: 18,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        También podés canjear tus puntos como descuento directo en el carrito al finalizar tu compra.
                    </Text>

                    {cargando ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={DISENO.colors.accent} />
                        </View>
                    ) : recompensas.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="gift-outline"
                                size={isTablet ? 80 : 60}
                                color={DISENO.colors.textTertiary + '40'}
                            />
                            <Text
                                style={[
                                    styles.emptyText,
                                    {
                                        fontSize: isTablet ? 17 : isSmallPhone ? 14 : 15,
                                        color: DISENO.colors.text,
                                    },
                                ]}
                                allowFontScaling={false}
                            >
                                No hay recompensas disponibles
                            </Text>
                            <Text
                                style={[
                                    styles.emptySubtext,
                                    {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                        color: DISENO.colors.textSecondary,
                                    },
                                ]}
                                allowFontScaling={false}
                            >
                                Pronto tendremos nuevas recompensas para vos 🎉
                            </Text>
                        </View>
                    ) : (
                        recompensas.map((item) => (
                            <React.Fragment key={item.id}>
                                {renderRecompensa({ item })}
                            </React.Fragment>
                        ))
                    )}

                    {/* Mensaje si no hay recompensas disponibles pero tiene puntos */}
                    {!cargando && recompensas.length > 0 && !tieneRecompensasDisponibles && puntosActuales > 0 && (
                        <View
                            style={[
                                styles.helpMessage,
                                {
                                    padding: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    backgroundColor: DISENO.colors.surface,
                                    borderColor: DISENO.colors.accent + '25',
                                    borderWidth: 1,
                                    marginTop: 8,
                                    marginBottom: 16,
                                    ...DISENO.shadow.sm,
                                },
                            ]}
                        >
                            <Ionicons
                                name="bulb-outline"
                                size={isTablet ? 26 : isSmallPhone ? 20 : 24}
                                color={DISENO.colors.accent}
                            />
                            <View style={styles.helpMessageTextContainer}>
                                <Text
                                    style={[
                                        styles.helpMessageTitle,
                                        { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DISENO.colors.text },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    💡 ¿Sabías que podés usar tus puntos?
                                </Text>
                                <Text
                                    style={[
                                        styles.helpMessageText,
                                        {
                                            fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                            color: DISENO.colors.textSecondary,
                                        },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    Aunque no haya recompensas disponibles ahora, podés usar tus {puntosActuales} puntos
                                    como descuento en tu próximo pedido. Simplemente agregá productos al carrito y
                                    aplicá tus puntos en el checkout.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ✅ MODAL CONFIRMAR */}
            <Modal visible={mostrarModalConfirmar} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modal,
                            {
                                padding: modalPadding,
                                borderRadius: isTablet ? 24 : isSmallPhone ? 18 : 20,
                                width: modalWidth,
                                borderColor: DISENO.colors.border,
                                borderWidth: 1,
                                backgroundColor: DISENO.colors.surface,
                                ...DISENO.shadow.lg,
                            },
                        ]}
                    >
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 72 : 56 }]}>🎁</Text>
                        <Text style={[styles.modalTitle, { fontSize: modalTituloSize, color: DISENO.colors.text }]}>
                            Confirmar Canje
                        </Text>
                        <Text style={[styles.modalText, { fontSize: modalTextSize, color: DISENO.colors.textSecondary }]}>
                            Usar{' '}
                            <Text style={[styles.modalTextHighlight, { color: DISENO.colors.accent }]}>
                                {recompensaSeleccionada?.puntos_necesarios} pts
                            </Text>{' '}
                            por:{'\n'}
                            <Text style={[styles.modalTextReward, { color: DISENO.colors.text }]}>
                                "{recompensaSeleccionada?.nombre}"
                            </Text>
                        </Text>

                        <View style={[styles.modalButtons, { gap: isTablet ? 14 : isSmallPhone ? 8 : 12 }]}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    {
                                        paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        backgroundColor: DISENO.colors.surfaceHover,
                                        borderColor: DISENO.colors.border,
                                        borderWidth: 1,
                                    },
                                ]}
                                onPress={() => setMostrarModalConfirmar(false)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.modalCancelText,
                                        { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.textSecondary },
                                    ]}
                                    allowFontScaling={false}
                                >
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    {
                                        paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                                        borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        backgroundColor: DISENO.colors.accentSecondary,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        ...DISENO.shadow.sm,
                                    },
                                ]}
                                onPress={canjear}
                                disabled={canjeando}
                                activeOpacity={0.7}
                            >
                                {canjeando ? (
                                    <ActivityIndicator size="small" color={DISENO.colors.text} />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={isTablet ? 20 : isSmallPhone ? 16 : 18}
                                            color={DISENO.colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.modalConfirmText,
                                                { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.text },
                                            ]}
                                            allowFontScaling={false}
                                        >
                                            Canjear
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL ÉXITO */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modal,
                            {
                                padding: modalPadding,
                                borderRadius: isTablet ? 24 : isSmallPhone ? 18 : 20,
                                width: modalWidth,
                                borderColor: DISENO.colors.success + '40',
                                borderWidth: 1,
                                backgroundColor: DISENO.colors.surface,
                                ...DISENO.shadow.lg,
                            },
                        ]}
                    >
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 72 : 56 }]}>✅</Text>
                        <Text style={[styles.modalTitle, { fontSize: modalTituloSize, color: DISENO.colors.success }]}>
                            {mensajeExito}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DISENO.colors.fondo,
    },
    backgroundGradient: {
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
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
        color: DISENO.colors.text,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pointsIcon: {},
    pointsText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 40,
    },
    loadingText: {
        fontFamily: FUENTES.regular,
        fontWeight: '400',
        opacity: 0.7,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    icon: {},
    cardInfo: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        flexWrap: 'wrap',
        gap: 4,
    },
    cardName: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        flex: 1,
    },
    typeBadge: {
        borderWidth: 1,
    },
    typeBadgeText: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    cardDesc: {
        fontFamily: FUENTES.regular,
        marginTop: 2,
        opacity: 0.75,
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 6,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pointsIconSmall: {},
    cardPoints: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    redeemButton: {
        borderWidth: 1,
        ...DISENO.shadow.xs,
    },
    redeemButtonText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontFamily: FUENTES.regular,
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.7,
    },
    helpMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    helpMessageTextContainer: {
        flex: 1,
    },
    helpMessageTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginBottom: 2,
    },
    helpMessageText: {
        fontFamily: FUENTES.regular,
        lineHeight: 16,
        opacity: 0.85,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        alignItems: 'center',
        maxWidth: 500,
    },
    modalIcon: {
        marginBottom: 12,
    },
    modalTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        fontFamily: FUENTES.regular,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalTextHighlight: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    modalTextReward: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    modalConfirmText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
});