// screens/cliente/PantallaCheckout.tsx - V8 (Modo oscuro + Lazy Skia + Lazy Mapa)
import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Animated,
    ActivityIndicator,
    Alert,
    Linking,
    useWindowDimensions,
    Platform,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated2, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    withSequence,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { TouchableRipple } from 'react-native-paper';

import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { useToast, Toast } from '../../components/Toast';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { useBeneficios } from '../../hooks/useBeneficios';
import { cuponService } from '../../lib/cupones/cuponService';
import { calcularResumenPedido } from '../../services/servicioPreciosPedido';
import { supabase } from '../../lib/supabase';
import { notificacionService } from '../../services/notificacionService';
import BotonUsarMiUbicacion from '../../components/BotonUsarMiUbicacion';
import { DireccionNormalizada } from '../../utils/ubicacionHelper';
import { solicitarPermisosCompletosApp } from '../../utils/permisosHelper';
import ModalDatoFaltante from '../../components/ModalDatoFaltante';

const MapaSelector = lazy(() => import('../../components/Mapa'));

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosCheckout {
    paddingHorizontal: number;
    headerTopPadding: number;
    headerBottomPadding: number;
    tituloSize: number;
    backIconSize: number;
    stepSize: number;
    stepLineWidth: number;
    stepLabelSize: number;
    sectionIconSize: number;
    sectionIconContainer: number;
    sectionTitleSize: number;
    sectionSubtitleSize: number;
    sectionMarginTop: number;
    sectionAccentWidth: number;
    sectionAccentHeight: number;
    cardPadding: number;
    cardRadius: number;
    cardMarginBottom: number;
    inputSize: number;
    inputPaddingH: number;
    inputPaddingV: number;
    inputIconSize: number;
    inputMinHeight: number;
    inputRadius: number;
    inputLabelSize: number;
    optionPadding: number;
    optionRadius: number;
    optionIconSize: number;
    optionTextSize: number;
    optionPriceSize: number;
    direccionPadding: number;
    direccionRadius: number;
    direccionLabelSize: number;
    direccionTextSize: number;
    direccionBadgeSize: number;
    infoEnvioPadding: number;
    infoEnvioRadius: number;
    infoEnvioTextSize: number;
    infoEnvioIconSize: number;
    efectivoPadding: number;
    efectivoRadius: number;
    efectivoTitleSize: number;
    efectivoSubtitleSize: number;
    efectivoInputSize: number;
    efectivoInputPaddingV: number;
    vueltoPadding: number;
    vueltoRadius: number;
    vueltoLabelSize: number;
    vueltoMontoSize: number;
    vueltoIconSize: number;
    resumenTextSize: number;
    resumenValorSize: number;
    totalTextSize: number;
    totalPriceSize: number;
    botonPaddingV: number;
    botonRadius: number;
    botonTextSize: number;
    botonIconSize: number;
    productoTextSize: number;
    productoPrecioSize: number;
    modalPadding: number;
    modalRadius: number;
    modalIconSize: number;
    modalTitleSize: number;
    modalTextSize: number;
    modalSubtextSize: number;
    modalDotSize: number;
    transModalWidth: number;
    transModalRadius: number;
    transModalHeaderPaddingV: number;
    transModalHeaderIconSize: number;
    transModalHeaderTitleSize: number;
    transModalBodyPadding: number;
    transModalMensajeSize: number;
    transModalAliasPadding: number;
    transModalAliasLabelSize: number;
    transModalAliasTextoSize: number;
    transModalCbuPadding: number;
    transModalCbuLabelSize: number;
    transModalCbuTextoSize: number;
    transModalMontoPadding: number;
    transModalMontoLabelSize: number;
    transModalMontoTextoSize: number;
    transModalPedidoIdSize: number;
    transModalBotonPaddingV: number;
    transModalBotonRadius: number;
    transModalBotonTextSize: number;
    transModalBotonIconSize: number;
    transModalFooterSize: number;
    beneficiosPadding: number;
    beneficiosRadius: number;
    beneficiosIconSize: number;
    beneficiosEmojiSize: number;
    beneficiosTitleSize: number;
    beneficiosDescSize: number;
    beneficioTagTextSize: number;
    beneficioTagIconSize: number;
    beneficioTagPaddingH: number;
    beneficioTagPaddingV: number;
    beneficioTagRadius: number;
}

const calcularTamanosCheckout = (
    width: number,
    height: number,
    isTablet: boolean,
    isDesktop: boolean,
    isSmallPhone: boolean,
): TamanosCheckout => {
    const paddingHorizontal = isDesktop ? 40 : isTablet ? 32 : isSmallPhone ? 14 : 18;
    const headerTopPadding = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 8 : 12;
    const headerBottomPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
    const tituloSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
    const backIconSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 18 : 20;
    const stepSize = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 20 : 24;
    const stepLineWidth = isDesktop ? 60 : isTablet ? 50 : isSmallPhone ? 30 : 40;
    const stepLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
    const sectionIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 18;
    const sectionIconContainer = isDesktop ? 40 : isTablet ? 38 : isSmallPhone ? 32 : 36;
    const sectionTitleSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 18;
    const sectionSubtitleSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
    const sectionMarginTop = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 16 : 18;
    const sectionAccentWidth = 4;
    const sectionAccentHeight = isDesktop ? 38 : isTablet ? 36 : isSmallPhone ? 30 : 34;
    const cardPadding = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
    const cardRadius = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
    const cardMarginBottom = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
    const inputSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 13 : 13.5;
    const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const inputPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const inputIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 17;
    const inputMinHeight = isDesktop ? 54 : isTablet ? 52 : isSmallPhone ? 46 : 48;
    const inputRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
    const inputLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 10 : 11;
    const optionPadding = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
    const optionRadius = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const optionIconSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 18 : 20;
    const optionTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
    const optionPriceSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
    const direccionPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
    const direccionRadius = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const direccionLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
    const direccionTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
    const direccionBadgeSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;
    const infoEnvioPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const infoEnvioRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
    const infoEnvioTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
    const infoEnvioIconSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 14 : 15;
    const efectivoPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 13;
    const efectivoRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
    const efectivoTitleSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const efectivoSubtitleSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 11 : 11;
    const efectivoInputSize = isDesktop ? 17 : isTablet ? 17 : isSmallPhone ? 15 : 16;
    const efectivoInputPaddingV = isDesktop ? 10 : isTablet ? 10 : isSmallPhone ? 8 : 9;
    const vueltoPadding = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 10 : 11;
    const vueltoRadius = isDesktop ? 10 : isSmallPhone ? 8 : 9;
    const vueltoLabelSize = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 11 : 12;
    const vueltoMontoSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 16 : 17;
    const vueltoIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 18 : 19;
    const resumenTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const resumenValorSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const totalTextSize = isDesktop ? 17 : isTablet ? 16 : isSmallPhone ? 14 : 15;
    const totalPriceSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 20;
    const botonPaddingV = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 15;
    const botonRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
    const botonTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 14 : 15;
    const botonIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 20;
    const productoTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const productoPrecioSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const modalPadding = isDesktop ? 40 : isTablet ? 34 : isSmallPhone ? 24 : 28;
    const modalRadius = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 22 : 24;
    const modalIconSize = isDesktop ? 80 : isTablet ? 72 : isSmallPhone ? 54 : 64;
    const modalTitleSize = isDesktop ? 22 : isTablet ? 21 : isSmallPhone ? 17 : 19;
    const modalTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const modalSubtextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
    const modalDotSize = isSmallPhone ? 8 : 10;
    const transModalWidth = isDesktop ? 500 : isTablet ? 480 : width * 0.92;
    const transModalRadius = isSmallPhone ? 16 : 20;
    const transModalHeaderPaddingV = isSmallPhone ? 12 : 14;
    const transModalHeaderIconSize = isSmallPhone ? 30 : 36;
    const transModalHeaderTitleSize = isSmallPhone ? 14 : 16;
    const transModalBodyPadding = isSmallPhone ? 16 : 20;
    const transModalMensajeSize = isSmallPhone ? 12 : 13;
    const transModalAliasPadding = isSmallPhone ? 12 : 14;
    const transModalAliasLabelSize = isSmallPhone ? 10 : 11;
    const transModalAliasTextoSize = isSmallPhone ? 14 : 16;
    const transModalCbuPadding = isSmallPhone ? 10 : 12;
    const transModalCbuLabelSize = isSmallPhone ? 9 : 10;
    const transModalCbuTextoSize = isSmallPhone ? 12 : 13;
    const transModalMontoPadding = isSmallPhone ? 10 : 12;
    const transModalMontoLabelSize = isSmallPhone ? 11 : 12;
    const transModalMontoTextoSize = isSmallPhone ? 22 : 26;
    const transModalPedidoIdSize = isSmallPhone ? 12 : 13;
    const transModalBotonPaddingV = isSmallPhone ? 10 : 12;
    const transModalBotonRadius = isSmallPhone ? 8 : 10;
    const transModalBotonTextSize = isSmallPhone ? 11 : 12;
    const transModalBotonIconSize = isSmallPhone ? 16 : 18;
    const transModalFooterSize = isSmallPhone ? 10 : 11;
    const beneficiosPadding = isSmallPhone ? 12 : 14;
    const beneficiosRadius = isSmallPhone ? 12 : 14;
    const beneficiosIconSize = isSmallPhone ? 32 : 36;
    const beneficiosEmojiSize = isSmallPhone ? 16 : 18;
    const beneficiosTitleSize = isSmallPhone ? 13 : 14;
    const beneficiosDescSize = isSmallPhone ? 11 : 12;
    const beneficioTagTextSize = isSmallPhone ? 11 : 12;
    const beneficioTagIconSize = isSmallPhone ? 12 : 14;
    const beneficioTagPaddingH = isSmallPhone ? 8 : 10;
    const beneficioTagPaddingV = isSmallPhone ? 4 : 5;
    const beneficioTagRadius = isSmallPhone ? 8 : 10;

    return {
        paddingHorizontal, headerTopPadding, headerBottomPadding, tituloSize, backIconSize,
        stepSize, stepLineWidth, stepLabelSize,
        sectionIconSize, sectionIconContainer, sectionTitleSize, sectionSubtitleSize,
        sectionMarginTop, sectionAccentWidth, sectionAccentHeight,
        cardPadding, cardRadius, cardMarginBottom,
        inputSize, inputPaddingH, inputPaddingV, inputIconSize, inputMinHeight, inputRadius, inputLabelSize,
        optionPadding, optionRadius, optionIconSize, optionTextSize, optionPriceSize,
        direccionPadding, direccionRadius, direccionLabelSize, direccionTextSize, direccionBadgeSize,
        infoEnvioPadding, infoEnvioRadius, infoEnvioTextSize, infoEnvioIconSize,
        efectivoPadding, efectivoRadius, efectivoTitleSize, efectivoSubtitleSize,
        efectivoInputSize, efectivoInputPaddingV,
        vueltoPadding, vueltoRadius, vueltoLabelSize, vueltoMontoSize, vueltoIconSize,
        resumenTextSize, resumenValorSize, totalTextSize, totalPriceSize,
        botonPaddingV, botonRadius, botonTextSize, botonIconSize,
        productoTextSize, productoPrecioSize,
        modalPadding, modalRadius, modalIconSize, modalTitleSize, modalTextSize, modalSubtextSize, modalDotSize,
        transModalWidth, transModalRadius, transModalHeaderPaddingV, transModalHeaderIconSize, transModalHeaderTitleSize,
        transModalBodyPadding, transModalMensajeSize, transModalAliasPadding, transModalAliasLabelSize,
        transModalAliasTextoSize, transModalCbuPadding, transModalCbuLabelSize, transModalCbuTextoSize,
        transModalMontoPadding, transModalMontoLabelSize, transModalMontoTextoSize, transModalPedidoIdSize,
        transModalBotonPaddingV, transModalBotonRadius, transModalBotonTextSize, transModalBotonIconSize,
        transModalFooterSize,
        beneficiosPadding, beneficiosRadius, beneficiosIconSize, beneficiosEmojiSize,
        beneficiosTitleSize, beneficiosDescSize,
        beneficioTagTextSize, beneficioTagIconSize, beneficioTagPaddingH, beneficioTagPaddingV, beneficioTagRadius,
    };
};

const ALIAS_TRANSFERENCIA = 'krustyburger2025';
const CUENTA_TRANSFERENCIA = 'CBU: 0000003100088376133432';

type ModoDireccion = 'vista' | 'texto' | 'formulario';

const asegurarPermisosUbicacion = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return true;
        const { status: nuevoStatus } = await Location.requestForegroundPermissionsAsync();
        if (nuevoStatus === 'granted') return true;
        return false;
    } catch (error) {
        return false;
    }
};

const obtenerDireccionDesdeCoordenadas = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const tienePermiso = await asegurarPermisosUbicacion();
        if (!tienePermiso) return null;
        const resultados = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (resultados && resultados.length > 0) {
            const lugar = resultados[0];
            const partes = [
                lugar.street || lugar.name,
                lugar.streetNumber,
                lugar.district,
                lugar.city,
                lugar.region,
            ].filter(Boolean);
            return partes.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        return null;
    } catch (error) {
        return null;
    }
};

// ============================================================
// 🎨 COLORES SEMÁNTICOS (dinámicos)
// ============================================================
const construirColores = (colores: PaletaTema) => ({
    bg: colores.fondo,
    card: colores.surface,
    cardBorder: colores.border,
    text: colores.text,
    textSec: colores.textSecondary,
    textTer: colores.textTertiary,
    accent: colores.accent,
    accentSoft: colores.accent + '12',
    accentBorder: colores.accent + '25',
    accentSecondary: colores.accentSecondary || colores.accent,
    success: colores.success,
    successSoft: colores.success + '12',
    successBorder: colores.success + '25',
    info: colores.info,
    infoSoft: colores.info + '12',
    infoBorder: colores.info + '25',
    warning: colores.warning,
    danger: colores.danger,
});

type SemanticColors = ReturnType<typeof construirColores>;

// ============================================================
// 🎊 CONFETI CON SKIA (LAZY LOAD)
// ============================================================
interface ConfetiParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
}

const ConfetiSkia: React.FC<{ activo: boolean }> = ({ activo }) => {
    const [Skia, setSkia] = useState<any>(null);
    const [particulas, setParticulas] = useState<ConfetiParticle[]>([]);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!activo || Skia) return;
        let mounted = true;
        import('@shopify/react-native-skia')
            .then((mod) => {
                if (mounted) setSkia(mod);
            })
            .catch(() => { });
        return () => {
            mounted = false;
        };
    }, [activo, Skia]);

    useEffect(() => {
        if (!activo || !Skia) {
            setParticulas([]);
            return;
        }

        const coloresConfeti = ['#E53935', '#F5C518', '#43A047', '#1E88E5', '#FF6F00', '#8E24AA'];
        const iniciales: ConfetiParticle[] = Array.from({ length: 40 }).map(() => ({
            x: Math.random() * 300,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 4,
            size: 4 + Math.random() * 6,
            color: coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
        }));

        setParticulas(iniciales);

        let lastTime = Date.now();
        const tick = () => {
            const now = Date.now();
            const dt = (now - lastTime) / 16;
            lastTime = now;

            setParticulas((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        x: p.x + p.vx * dt,
                        y: p.y + p.vy * dt,
                        rotation: p.rotation + p.rotationSpeed * dt,
                        vy: p.vy + 0.15 * dt,
                    }))
                    .filter((p) => p.y < 400)
            );

            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [activo, Skia]);

    if (!activo || !Skia || particulas.length === 0) return null;

    const { Canvas, Group, Rect } = Skia;

    return (
        <Canvas style={{ position: 'absolute', width: 300, height: 400 }} pointerEvents="none">
            <Group>
                {particulas.map((p: ConfetiParticle, i: number) => (
                    <Rect
                        key={i}
                        x={p.x}
                        y={p.y}
                        width={p.size}
                        height={p.size * 0.6}
                        color={p.color}
                        transform={[{ rotate: p.rotation }]}
                        origin={{ x: p.x + p.size / 2, y: p.y + p.size * 0.3 }}
                    />
                ))}
            </Group>
        </Canvas>
    );
};

// ============================================================
// 🚀 STEPS VISUALES
// ============================================================
const StepsBar: React.FC<{
    pasoActual: 0 | 1 | 2;
    tamanos: TamanosCheckout;
    C: SemanticColors;
}> = ({ pasoActual, tamanos, C }) => {
    const pasos = ['Carrito', 'Checkout', 'Listo'];
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {pasos.map((paso, i) => {
                const activo = i <= pasoActual;
                const esActual = i === pasoActual;
                return (
                    <React.Fragment key={paso}>
                        <View style={{ alignItems: 'center' }}>
                            <View
                                style={{
                                    width: tamanos.stepSize,
                                    height: tamanos.stepSize,
                                    borderRadius: tamanos.stepSize / 2,
                                    backgroundColor: activo ? C.accent : C.bg,
                                    borderWidth: 2,
                                    borderColor: activo ? C.accent : C.cardBorder,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {i < pasoActual ? (
                                    <Ionicons name="checkmark" size={tamanos.stepSize * 0.55} color="#FFF" />
                                ) : (
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            color: activo ? '#FFF' : C.textTer,
                                            fontSize: tamanos.stepSize * 0.42,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {i + 1}
                                    </Text>
                                )}
                            </View>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.stepLabelSize,
                                    color: esActual ? C.accent : C.textTer,
                                    marginTop: 4,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {paso}
                            </Text>
                        </View>
                        {i < pasos.length - 1 && (
                            <View
                                style={{
                                    width: tamanos.stepLineWidth,
                                    height: 2,
                                    backgroundColor: i < pasoActual ? C.accent : C.cardBorder,
                                    marginHorizontal: 6,
                                    marginBottom: 16,
                                }}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

// ============================================================
// 🎨 HEADER DE SECCIÓN
// ============================================================
const SectionHeader: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    color: string;
    tamanos: TamanosCheckout;
    C: SemanticColors;
}> = ({ icon, title, subtitle, color, tamanos, C }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
            style={{
                width: tamanos.sectionAccentWidth,
                height: tamanos.sectionAccentHeight,
                borderRadius: tamanos.sectionAccentWidth / 2,
                backgroundColor: color,
                marginRight: 12,
            }}
        />
        <View
            style={{
                width: tamanos.sectionIconContainer,
                height: tamanos.sectionIconContainer,
                borderRadius: tamanos.sectionIconContainer / 2,
                backgroundColor: color + '15',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
            }}
        >
            <Ionicons name={icon} size={tamanos.sectionIconSize} color={color} />
        </View>
        <View style={{ flex: 1 }}>
            <Text
                style={{
                    fontFamily: FUENTES.display,
                    fontSize: tamanos.sectionTitleSize,
                    fontWeight: '700',
                    color: C.text,
                    letterSpacing: -0.3,
                    lineHeight: tamanos.sectionTitleSize * 1.2,
                    includeFontPadding: false,
                }}
                allowFontScaling={false}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    style={{
                        fontFamily: FUENTES.regular,
                        fontSize: tamanos.sectionSubtitleSize,
                        color: C.textTer,
                        marginTop: 2,
                        includeFontPadding: false,
                        lineHeight: tamanos.sectionSubtitleSize * 1.3,
                    }}
                    allowFontScaling={false}
                >
                    {subtitle}
                </Text>
            )}
        </View>
    </View>
);

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaCheckout(props: any) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // ✅ TEMA
    const colores = useColores();
    const estilos = useMemo(() => crearEstilos(colores), [colores]);
    const C = useMemo(() => construirColores(colores), [colores]);

    const isTablet = screenWidth >= 768;
    const isDesktop = screenWidth >= 1024;
    const isSmallPhone = screenWidth < 375;

    const tamanos = useMemo(
        () => calcularTamanosCheckout(screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone),
        [screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone],
    );

    const { elementos, vaciarCarrito, calcularTotal } = tiendaCarrito();
    const { crearPedido } = tiendaPedidos();
    const {
        perfil,
        sesion,
        cargando: cargandoAuth,
        actualizarPerfil,
        ubicacionSeleccionada: ubicacionStore,
        guardarUbicacionTemporal,
        cargarUbicacionTemporal,
        limpiarUbicacionTemporal,
    } = tiendaAutenticacion();

    const { nivel, beneficios, calcularDescuento, tieneEnvioGratis, descripcionBeneficios } =
        useBeneficios(perfil?.puntos_acumulados || 0, perfil?.id);

    const toast = useToast();

    const cuponAplicado = props.route?.params?.cuponAplicado || null;
    const cuponPuntosAplicado = props.route?.params?.cuponPuntosAplicado || null;
    const ubicacionRecibida = props.route?.params?.ubicacionGuardada || null;

    const [totalFinal, setTotalFinal] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [descuentoNivelAplicado, setDescuentoNivelAplicado] = useState(0);
    const [envioGratisAplicado, setEnvioGratisAplicado] = useState(false);

    const [direccion, setDireccion] = useState('');
    const [direccionCompleta, setDireccionCompleta] = useState('');
    const [telefono, setTelefono] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [tipoEntrega, setTipoEntrega] = useState('domicilio');
    const [notas, setNotas] = useState('');
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [guardandoPerfil, setGuardandoPerfil] = useState(false);
    const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

    const [montoConQuePaga, setMontoConQuePaga] = useState<string>('');
    const [vueltoCalculado, setVueltoCalculado] = useState<number>(0);
    const [mostrarVuelto, setMostrarVuelto] = useState(false);

    const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
    const [pedidoIdTransferencia, setPedidoIdTransferencia] = useState<number | null>(null);
    const [mostrarModalTelefono, setMostrarModalTelefono] = useState(false);

    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<{
        latitude: number;
        longitude: number;
    } | null>(
        ubicacionRecibida
            ? {
                latitude: ubicacionRecibida.latitude,
                longitude: ubicacionRecibida.longitude,
            }
            : null,
    );

    const [direccionDelPerfil, setDireccionDelPerfil] = useState(false);

    const [costoEnvioCalculado, setCostoEnvioCalculado] = useState(0);
    const [distanciaCliente, setDistanciaCliente] = useState<number | null>(null);
    const [distanciaFormateada, setDistanciaFormateada] = useState('');
    const [tiempoEstimado, setTiempoEstimado] = useState(0);
    const [calculandoEnvio, setCalculandoEnvio] = useState(false);
    const [envioDisponible, setEnvioDisponible] = useState(true);
    const [mensajeEnvio, setMensajeEnvio] = useState('');

    const [modoDireccion, setModoDireccion] = useState<ModoDireccion>('vista');
    const [direccionInput, setDireccionInput] = useState('');
    const [verificandoDireccion, setVerificandoDireccion] = useState(false);
    const [camposManuales, setCamposManuales] = useState({
        calle: '',
        numero: '',
        piso: '',
        departamento: '',
        barrio: '',
        ciudad: '',
        codigoPostal: '',
    });
    const [errorDireccion, setErrorDireccion] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(20)).current;
    const dot1Anim = useRef(new Animated.Value(0)).current;
    const dot2Anim = useRef(new Animated.Value(0)).current;
    const dot3Anim = useRef(new Animated.Value(0)).current;

    const shineX = useSharedValue(-1);
    const shineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shineX.value * 350 }],
    }));

    const ultimaUbicacionCalculada = useRef<string>('');

    const precioUnitario = (precio: any) => (typeof precio === 'number' ? precio : Number(precio));

    const calcularVuelto = (montoPago: string) => {
        const pago = parseFloat(montoPago.replace(',', '.'));
        if (isNaN(pago) || pago <= 0) {
            setVueltoCalculado(0);
            setMostrarVuelto(false);
            return;
        }
        const vuelto = pago - totalFinal;
        if (vuelto >= 0) {
            setVueltoCalculado(vuelto);
            setMostrarVuelto(true);
        } else {
            setVueltoCalculado(0);
            setMostrarVuelto(false);
        }
    };

    useEffect(() => {
        if (!cargandoAuth && !sesion) {
            Alert.alert(
                'Iniciá sesión',
                'Necesitás una cuenta para confirmar tu pedido.',
                [
                    { text: 'Volver al carrito', style: 'cancel', onPress: () => props.navigation.goBack() },
                    { text: 'Iniciar sesión', onPress: () => props.navigation.replace('Login') },
                    { text: 'Registrarme', onPress: () => props.navigation.replace('Registro') },
                ],
                { cancelable: false },
            );
        }
    }, [sesion, cargandoAuth]);

    useEffect(() => {
        if (pedidoIdTransferencia !== null) {
            setMostrarModalTransferencia(true);
        }
    }, [pedidoIdTransferencia]);

    useEffect(() => {
        shineX.value = withRepeat(withTiming(1, { duration: 2200 }), -1, false);
    }, []);

    useEffect(() => {
        if (!sesion) return;
        cargarDatosPerfil();
        servicioEnvios.inicializar();

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]).start();

        if (ubicacionRecibida) {
            setUbicacionSeleccionada({
                latitude: ubicacionRecibida.latitude,
                longitude: ubicacionRecibida.longitude,
            });
            setDireccion(ubicacionRecibida.direccion || '');
            setDireccionCompleta(ubicacionRecibida.direccion || '');
            setDireccionDelPerfil(false);
            setCargandoUbicacion(false);
            if (ubicacionRecibida.direccion) guardarUbicacionTemporal(ubicacionRecibida);
        } else {
            cargarUbicacionDesdeStore();
        }
    }, [sesion]);

    useEffect(() => {
        if (perfil) {
            if (perfil.telefono && !telefono) setTelefono(perfil.telefono);

            const partesDireccion: string[] = [];
            if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
            if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
            if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
            if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
            if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
            if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
            if (perfil.direccion_codigo_postal) partesDireccion.push(`CP ${perfil.direccion_codigo_postal}`);

            const direccionCompletaPerfil = partesDireccion.length > 0 ? partesDireccion.join(', ') : '';

            if (direccionCompletaPerfil && !ubicacionSeleccionada && !ubicacionRecibida) {
                setDireccion(direccionCompletaPerfil);
                setDireccionCompleta(direccionCompletaPerfil);
                setDireccionDelPerfil(true);
            }
        }
    }, [perfil]);

    useEffect(() => {
        const totalActual = calcularTotal();
        const descuentoNivel = beneficios ? calcularDescuento(totalActual) : 0;
        const envioGratisNivel = beneficios ? tieneEnvioGratis(totalActual) : false;

        const resumen = calcularResumenPedido({
            subtotal: totalActual,
            cuponAplicado,
            cuponPuntosAplicado,
            descuentoNivel,
            costoEnvio: tipoEntrega === 'retiro' ? 0 : costoEnvioCalculado,
            tipoEntrega,
            envioGratisNivel,
        });

        setSubtotal(resumen.subtotal);
        setDescuentoNivelAplicado(resumen.descuentoNivel);
        setEnvioGratisAplicado(resumen.envioGratis);
        setTotalFinal(resumen.totalFinal);
    }, [
        costoEnvioCalculado,
        tipoEntrega,
        calcularTotal,
        beneficios,
        cuponAplicado,
        cuponPuntosAplicado,
        calcularDescuento,
        tieneEnvioGratis,
    ]);

    const cargarUbicacionDesdeStore = async () => {
        setCargandoUbicacion(true);
        try {
            const ubicacionCargada = await cargarUbicacionTemporal();
            if (ubicacionCargada) {
                setUbicacionSeleccionada({
                    latitude: ubicacionCargada.latitude,
                    longitude: ubicacionCargada.longitude,
                });
                setDireccion(ubicacionCargada.direccion || '');
                setDireccionCompleta(ubicacionCargada.direccion || '');
                setDireccionDelPerfil(false);
                setCargandoUbicacion(false);
                return;
            }
            if (ubicacionStore) {
                setUbicacionSeleccionada({
                    latitude: ubicacionStore.latitude,
                    longitude: ubicacionStore.longitude,
                });
                setDireccion(ubicacionStore.direccion || '');
                setDireccionCompleta(ubicacionStore.direccion || '');
                setDireccionDelPerfil(false);
                setCargandoUbicacion(false);
                return;
            }
            await obtenerUbicacionActual();
        } catch (error) {
            await obtenerUbicacionActual();
        } finally {
            setCargandoUbicacion(false);
        }
    };

    const cargarDatosPerfil = () => {
        if (perfil) {
            setTelefono(perfil.telefono || '');
            const partesDireccion: string[] = [];
            if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
            if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
            if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
            if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
            if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
            if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
            if (perfil.direccion_codigo_postal) partesDireccion.push(`CP ${perfil.direccion_codigo_postal}`);

            const direccionCompletaPerfil = partesDireccion.length > 0 ? partesDireccion.join(', ') : '';
            if (direccionCompletaPerfil && !ubicacionStore && !ubicacionRecibida) {
                setDireccion(direccionCompletaPerfil);
                setDireccionCompleta(direccionCompletaPerfil);
                setDireccionDelPerfil(true);
            }
        }
    };

    const guardarDireccionEnPerfil = async () => {
        if (!perfil?.id) return;
        setGuardandoPerfil(true);
        try {
            const datosActualizados: any = {};
            if (telefono) datosActualizados.telefono = telefono;
            if (camposManuales.calle) datosActualizados.direccion_calle = camposManuales.calle;
            if (camposManuales.numero) datosActualizados.direccion_numero = camposManuales.numero;
            if (camposManuales.piso) datosActualizados.direccion_piso = camposManuales.piso;
            if (camposManuales.departamento) datosActualizados.direccion_departamento = camposManuales.departamento;
            if (camposManuales.barrio) datosActualizados.direccion_barrio = camposManuales.barrio;
            if (camposManuales.ciudad) datosActualizados.direccion_ciudad = camposManuales.ciudad;
            if (camposManuales.codigoPostal) datosActualizados.direccion_codigo_postal = camposManuales.codigoPostal;
            if (Object.keys(datosActualizados).length > 0) await actualizarPerfil(datosActualizados);
        } catch (error) {
        } finally {
            setGuardandoPerfil(false);
        }
    };

    const calcularCostoEnvio = async (lat: number, lng: number) => {
        setCalculandoEnvio(true);
        try {
            const resultado = await servicioEnvios.calcularCostoEnvio(lat, lng);
            if (resultado.esValido && resultado.dentroCobertura) {
                setCostoEnvioCalculado(resultado.costo);
                setDistanciaCliente(resultado.distancia);
                setDistanciaFormateada(resultado.distanciaFormateada);
                setTiempoEstimado(resultado.tiempoEstimado);
                setEnvioDisponible(true);
                setMensajeEnvio('');
            } else {
                setEnvioDisponible(false);
                setMensajeEnvio(resultado.mensaje || 'No disponible');
                setCostoEnvioCalculado(0);
                setDistanciaFormateada('');
                setTiempoEstimado(0);
            }
        } catch (error) {
            setEnvioDisponible(false);
            setMensajeEnvio('Error al calcular el envío');
        } finally {
            setCalculandoEnvio(false);
        }
    };

    useEffect(() => {
        if (!ubicacionSeleccionada || tipoEntrega !== 'domicilio') {
            if (tipoEntrega === 'retiro') {
                setCostoEnvioCalculado(0);
                setEnvioDisponible(true);
                setDistanciaFormateada('');
                setTiempoEstimado(0);
                ultimaUbicacionCalculada.current = '';
            }
            return;
        }

        const key = `${ubicacionSeleccionada.latitude.toFixed(6)},${ubicacionSeleccionada.longitude.toFixed(6)}`;
        if (ultimaUbicacionCalculada.current === key) return;
        ultimaUbicacionCalculada.current = key;
        calcularCostoEnvio(ubicacionSeleccionada.latitude, ubicacionSeleccionada.longitude);
    }, [ubicacionSeleccionada, tipoEntrega]);

    useEffect(() => {
        if (mostrarModalExito) {
            const animateDot = (anim: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                        Animated.delay(200),
                    ]),
                );
            Animated.parallel([
                animateDot(dot1Anim, 0),
                animateDot(dot2Anim, 200),
                animateDot(dot3Anim, 400),
            ]).start();
        } else {
            dot1Anim.setValue(0);
            dot2Anim.setValue(0);
            dot3Anim.setValue(0);
        }
    }, [mostrarModalExito]);

    const obtenerUbicacionActual = async () => {
        try {
            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) return;
            const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = ubicacion.coords;
            setUbicacionSeleccionada({ latitude, longitude });
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
            if (direccionObtenida) {
                setDireccionCompleta(direccionObtenida);
                setDireccion(direccionObtenida);
                setDireccionDelPerfil(false);
                await guardarUbicacionTemporal({ latitude, longitude, direccion: direccionObtenida });
            }
        } catch (error) { }
    };

    const abrirEdicionDireccion = () => {
        setDireccionInput(direccionCompleta || direccion || '');
        setErrorDireccion(null);
        setModoDireccion('texto');
    };

    const cancelarEdicionDireccion = () => {
        setModoDireccion('vista');
        setErrorDireccion(null);
        setDireccionInput('');
    };

    const verificarDireccionTexto = async () => {
        const texto = direccionInput.trim();
        if (texto.length < 5) {
            setErrorDireccion('Ingresá una dirección más completa');
            return;
        }
        setVerificandoDireccion(true);
        setErrorDireccion(null);
        try {
            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) {
                setErrorDireccion('Necesitamos permiso de ubicación para verificar');
                setVerificandoDireccion(false);
                return;
            }
            const resultados = await Location.geocodeAsync(texto);
            if (resultados && resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                const direccionFormateada = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
                setUbicacionSeleccionada({ latitude, longitude });
                setDireccion(texto);
                setDireccionCompleta(direccionFormateada || texto);
                setDireccionDelPerfil(false);
                await guardarUbicacionTemporal({
                    latitude,
                    longitude,
                    direccion: direccionFormateada || texto,
                    seleccionadaPorUsuario: true,
                });
                setCamposManuales({
                    calle: '',
                    numero: '',
                    piso: '',
                    departamento: '',
                    barrio: '',
                    ciudad: '',
                    codigoPostal: '',
                });
                setModoDireccion('vista');
                toast.exito('📍 Dirección verificada');
            } else {
                setErrorDireccion('No pudimos encontrar esa dirección. Completala manualmente:');
                setModoDireccion('formulario');
                setCamposManuales({
                    calle: texto,
                    numero: '',
                    piso: '',
                    departamento: '',
                    barrio: '',
                    ciudad: '',
                    codigoPostal: '',
                });
            }
        } catch (error) {
            setErrorDireccion('Hubo un error al verificar. Completala manualmente:');
            setModoDireccion('formulario');
        } finally {
            setVerificandoDireccion(false);
        }
    };

    const aplicarDireccionManual = async () => {
        if (!camposManuales.calle || !camposManuales.numero) {
            setErrorDireccion('Completá al menos calle y número');
            return;
        }
        setVerificandoDireccion(true);
        setErrorDireccion(null);

        const partes = [
            `${camposManuales.calle} ${camposManuales.numero}`,
            camposManuales.piso ? `Piso ${camposManuales.piso}` : '',
            camposManuales.departamento ? `Depto ${camposManuales.departamento}` : '',
            camposManuales.barrio,
            camposManuales.ciudad,
            camposManuales.codigoPostal ? `CP ${camposManuales.codigoPostal}` : '',
        ].filter(Boolean);

        const direccionConstruida = partes.join(', ');

        try {
            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) {
                setErrorDireccion('Necesitamos permiso de ubicación para calcular el envío');
                setVerificandoDireccion(false);
                return;
            }
            const resultados = await Location.geocodeAsync(direccionConstruida);
            if (resultados && resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                setUbicacionSeleccionada({ latitude, longitude });
                setDireccion(direccionConstruida);
                setDireccionCompleta(direccionConstruida);
                setDireccionDelPerfil(false);
                await guardarUbicacionTemporal({
                    latitude,
                    longitude,
                    direccion: direccionConstruida,
                    seleccionadaPorUsuario: true,
                });
                setModoDireccion('vista');
                toast.exito('📍 Dirección guardada');
            } else {
                Alert.alert(
                    '📍 Necesitamos tu ubicación exacta',
                    'No pudimos ubicar esa dirección en el mapa. Elegí tu ubicación exacta con el mapa para continuar.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Abrir mapa', onPress: () => setMostrarMapa(true) },
                    ],
                );
            }
        } catch (error) {
            setErrorDireccion('Hubo un error al verificar la dirección');
        } finally {
            setVerificandoDireccion(false);
        }
    };

    const volverAlModoTexto = () => {
        setModoDireccion('texto');
        setErrorDireccion(null);
    };

    const handleVolverAlCarrito = async () => {
        if (ubicacionSeleccionada) {
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(
                ubicacionSeleccionada.latitude,
                ubicacionSeleccionada.longitude,
            );
            const ubicacionCompleta: UbicacionGuardada = {
                latitude: ubicacionSeleccionada.latitude,
                longitude: ubicacionSeleccionada.longitude,
                direccion: direccionObtenida || `${ubicacionSeleccionada.latitude}, ${ubicacionSeleccionada.longitude}`,
                seleccionadaPorUsuario: true,
            };
            await guardarUbicacionTemporal(ubicacionCompleta);
        }
        props.navigation.goBack();
    };

    const handleConfirmarUbicacion = async (ubicacion: {
        latitude: number;
        longitude: number;
        direccion: string;
    }) => {
        setUbicacionSeleccionada({ latitude: ubicacion.latitude, longitude: ubicacion.longitude });
        setDireccion(ubicacion.direccion);
        setDireccionCompleta(ubicacion.direccion);
        setDireccionDelPerfil(false);
        setCamposManuales({
            calle: '',
            numero: '',
            piso: '',
            departamento: '',
            barrio: '',
            ciudad: '',
            codigoPostal: '',
        });
        await guardarUbicacionTemporal({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
            direccion: ubicacion.direccion,
            seleccionadaPorUsuario: true,
        });
        setMostrarMapa(false);
        setModoDireccion('vista');
        setErrorDireccion(null);
        toast.exito('📍 Ubicación seleccionada correctamente');
    };

    const handleUbicacionActual = async (direccion: DireccionNormalizada) => {
        console.log('📍 [Checkout] Ubicación obtenida:', direccion);

        setUbicacionSeleccionada({
            latitude: direccion.latitude,
            longitude: direccion.longitude,
        });

        setCamposManuales({
            calle: direccion.calle,
            numero: direccion.numero,
            piso: direccion.piso,
            departamento: direccion.departamento,
            barrio: direccion.barrio,
            ciudad: direccion.ciudad,
            codigoPostal: direccion.codigoPostal,
        });

        const direccionTexto = direccion.direccionCompleta || direccion.calle || 'Ubicación actual';
        setDireccion(direccionTexto);
        setDireccionCompleta(direccionTexto);
        setDireccionDelPerfil(false);

        await guardarUbicacionTemporal({
            latitude: direccion.latitude,
            longitude: direccion.longitude,
            direccion: direccionTexto,
            seleccionadaPorUsuario: true,
        });

        setModoDireccion('vista');
        setErrorDireccion(null);

        toast.exito('📍 Ubicación detectada correctamente');
    };

    const handleGuardarTelefonoCheckout = async (valor: string) => {
        const limpio = valor.trim();
        if (limpio.length < 6) return;

        setTelefono(limpio);
        setMostrarModalTelefono(false);

        if (perfil?.id) {
            try {
                await actualizarPerfil({ telefono: limpio });
            } catch (error) {
                console.warn('⚠️ No se pudo guardar el teléfono en el perfil:', error);
            }
        }

        toast.exito('📱 Teléfono guardado');
    };

    const copiarAlias = async () => {
        await Clipboard.setStringAsync(ALIAS_TRANSFERENCIA);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        toast.exito('¡Alias copiado!');
    };

    const abrirBanco = async () => {
        const schemes = ['mercadopago://', 'mercadopago.com.ar://', 'mp://', 'mercadopago://home'];
        for (const scheme of schemes) {
            try {
                const puedeAbrir = await Linking.canOpenURL(scheme);
                if (puedeAbrir) {
                    await Linking.openURL(scheme);
                    toast.exito('📱 Abriendo Mercado Pago');
                    return;
                }
            } catch { }
        }
        try {
            await Linking.openURL('https://www.mercadopago.com.ar/');
            toast.info('🌐 Abriendo Mercado Pago web');
        } catch {
            toast.error('No se pudo abrir Mercado Pago');
        }
    };

    const confirmarPedido = async () => {
        if (!sesion || !perfil?.id) {
            Alert.alert('Iniciá sesión', 'Necesitás una cuenta para confirmar el pedido.');
            return;
        }

        const tieneNotif = await notificacionService.tienePermisos();
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();

        if (!tieneNotif || locStatus !== 'granted') {
            Alert.alert(
                '📍 Permisos necesarios para el envío',
                'Para enviarte alertas en tiempo real y rastrear tu pedido, necesitamos que habilites las notificaciones y la ubicación.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Activar ahora',
                        onPress: async () => {
                            await solicitarPermisosCompletosApp(perfil.id);
                        },
                    },
                ],
            );
            return;
        }

        if (!direccion && tipoEntrega === 'domicilio') {
            toast.advertencia('Ingresa una dirección de entrega');
            return;
        }

        const telefonoValido = telefono && telefono.trim().length >= 6;
        if (!telefonoValido) {
            setMostrarModalTelefono(true);
            return;
        }

        const totalActual = calcularTotal();
        const descuentoNivel = beneficios ? calcularDescuento(totalActual) : 0;
        const envioGratisNivel = beneficios ? tieneEnvioGratis(totalActual) : false;
        const resumen = calcularResumenPedido({
            subtotal: totalActual,
            cuponAplicado,
            cuponPuntosAplicado,
            descuentoNivel,
            costoEnvio: tipoEntrega === 'retiro' ? 0 : costoEnvioCalculado,
            tipoEntrega,
            envioGratisNivel,
        });

        const totalFinalActual = resumen.totalFinal;
        setSubtotal(resumen.subtotal);
        setDescuentoNivelAplicado(resumen.descuentoNivel);
        setEnvioGratisAplicado(resumen.envioGratis);
        setTotalFinal(totalFinalActual);

        if (metodoPago === 'efectivo') {
            const pago = parseFloat(montoConQuePaga.replace(',', '.'));
            if (isNaN(pago) || pago < totalFinalActual) {
                toast.advertencia('El monto ingresado es insuficiente');
                return;
            }
        }

        setCargando(true);
        await guardarDireccionEnPerfil();

        const items = elementos.map((e) => ({
            producto_id: e.producto.id,
            nombre: e.producto.nombre,
            cantidad: e.cantidad,
            precio_unitario: Number(e.producto.precio),
            total: Number(e.producto.precio) * e.cantidad,
            descripcion: e.producto.descripcion || '',
            imagen: e.producto.imagen || '',
        }));

        const datosPedido: any = {
            id_de_usuario: perfil?.id,
            cliente_nombre: perfil?.nombre_cliente,
            telefono,
            direccion: tipoEntrega === 'retiro' ? 'Retiro en local' : direccionCompleta || direccion || 'Sin dirección',
            estado: 'pendiente',
            total_parcial: resumen.subtotal,
            total: resumen.totalFinal,
            costo_envio: resumen.costoEnvioFinal,
            items_json: items,
            metodo_pago: metodoPago,
            tipo_entrega: tipoEntrega,
            notas,
            puntos_usados: cuponPuntosAplicado?.puntos_usados || 0,
            lat_cliente: ubicacionSeleccionada?.latitude || null,
            lng_cliente: ubicacionSeleccionada?.longitude || null,
            distancia_km: distanciaCliente,
            tiempo_estimado: tiempoEstimado,
            descuento_nivel: resumen.descuentoNivel,
            descuento_cupon: resumen.descuentoCupon,
            descuento_puntos: resumen.descuentoPuntos,
            envio_gratis: resumen.envioGratis,
            nivel_cliente: nivel?.nombre || 'Bronce',
        };

        if (metodoPago === 'efectivo' && montoConQuePaga && mostrarVuelto) {
            datosPedido.monto_pago = parseFloat(montoConQuePaga.replace(',', '.'));
            datosPedido.vuelto = vueltoCalculado;
        }

        const resultado = await crearPedido(datosPedido);
        if (resultado.error) {
            toast.error(resultado.error);
            setCargando(false);
            return;
        }

        const pedidoId = resultado.id;
        if (!pedidoId) {
            toast.error('Error: No se pudo obtener el ID del pedido');
            setCargando(false);
            return;
        }

        notificacionService
            .notificarAdminsNuevoPedido({
                id: pedidoId,
                cliente_nombre: perfil?.nombre_cliente,
                total: resumen.totalFinal,
                cantidad_items: elementos.length,
                tipo_entrega: tipoEntrega,
            })
            .catch((err) => console.warn('⚠️ Error notificando admins:', err));

        if (cuponAplicado?.id && perfil?.id) {
            await cuponService.finalizarCuponPedido(cuponAplicado.id, perfil.id, pedidoId);
        }

        if (cuponPuntosAplicado?.puntos_usados > 0 && perfil?.id && pedidoId) {
            try {
                const { data: canjesRecientes } = await supabase
                    .from('canjes')
                    .select('id')
                    .eq('usuario_id', perfil.id)
                    .eq('puntos_usados', cuponPuntosAplicado.puntos_usados)
                    .eq('usado_en_pedido', false)
                    .order('fecha', { ascending: false })
                    .limit(1);

                if (canjesRecientes && canjesRecientes.length > 0) {
                    const canjeId = canjesRecientes[0].id;
                    await supabase
                        .from('canjes')
                        .update({ usado_en_pedido: true, pedido_id: pedidoId })
                        .eq('id', canjeId);
                }
            } catch (error) { }
        }

        vaciarCarrito();
        await limpiarUbicacionTemporal();

        if (metodoPago === 'transferencia') {
            setCargando(false);
            setPedidoIdTransferencia(pedidoId);
            return;
        }

        setCargando(false);
        setMostrarModalExito(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        setTimeout(() => {
            setMostrarModalExito(false);
            props.navigation.replace('Seguimiento', { pedidoId });
        }, 2800);
    };

    const cerrarModalTransferencia = () => {
        setMostrarModalTransferencia(false);
        const pedidoId = pedidoIdTransferencia;
        setPedidoIdTransferencia(null);
        if (pedidoId) {
            props.navigation.replace('Seguimiento', { pedidoId, transferenciaPendiente: true });
        }
    };

    const resumenUI = calcularResumenPedido({
        subtotal: calcularTotal(),
        cuponAplicado,
        cuponPuntosAplicado,
        descuentoNivel: beneficios ? calcularDescuento(calcularTotal()) : 0,
        costoEnvio: tipoEntrega === 'retiro' ? 0 : costoEnvioCalculado,
        tipoEntrega,
        envioGratisNivel: beneficios ? tieneEnvioGratis(calcularTotal()) : false,
    });
    const descuentoPuntos = resumenUI.descuentoPuntos;
    const descuentoCuponUI = resumenUI.descuentoCupon;
    const envioGratisCupon = resumenUI.envioGratisPorCupon;

    const metodosPago = [
        { id: 'efectivo', label: 'Efectivo', icono: 'cash-outline' },
        { id: 'transferencia', label: 'Transferir', icono: 'swap-horizontal-outline' },
    ];

    const tiposEntrega = [
        {
            id: 'domicilio',
            label: 'Delivery',
            subtitle: 'Te lo llevamos a tu puerta',
            icono: 'home-outline',
            costo: envioGratisAplicado ? 0 : envioDisponible && costoEnvioCalculado > 0 ? costoEnvioCalculado : 0,
        },
        { id: 'retiro', label: 'Retiro en local', subtitle: 'Pasás a buscarlo', icono: 'storefront-outline', costo: 0 },
    ];

    const renderLoaderDots = () => {
        const dots = [{ anim: dot1Anim }, { anim: dot2Anim }, { anim: dot3Anim }];
        return dots.map((dot, index) => {
            const opacity = dot.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
            const scale = dot.anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
            return (
                <Animated.View
                    key={index}
                    style={{
                        width: tamanos.modalDotSize,
                        height: tamanos.modalDotSize,
                        borderRadius: tamanos.modalDotSize / 2,
                        backgroundColor: C.accent,
                        opacity,
                        transform: [{ scale }],
                    }}
                />
            );
        });
    };

    if (cargandoAuth || !sesion) {
        return (
            <View style={[estilos.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text
                    style={{
                        fontFamily: FUENTES.display,
                        marginTop: 16,
                        color: C.textSec,
                        fontSize: 14,
                        includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                >
                    {cargandoAuth ? 'Verificando sesión...' : 'Redirigiendo...'}
                </Text>
            </View>
        );
    }

    return (
        <View style={estilos.container}>
            <LinearGradient
                colors={[colores.fondo, colores.surface, colores.fondo]}
                style={estilos.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />



            {/* 🎯 HEADER FLOTANTE (encima del scroll) */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    elevation: 10,
                }}
                pointerEvents="box-none"
            >
                {/* Gradiente del header */}
                <LinearGradient
                    colors={[C.accent, C.accentSecondary]}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: insets.top + tamanos.headerTopPadding + 180,
                        borderBottomLeftRadius: 28,
                        borderBottomRightRadius: 28,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                    }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Fila del header */}
                <View
                    style={[
                        estilos.header,
                        {
                            paddingTop: insets.top + tamanos.headerTopPadding,
                            paddingHorizontal: tamanos.paddingHorizontal,
                            paddingBottom: tamanos.headerBottomPadding,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={estilos.backButtonGlass}
                        onPress={handleVolverAlCarrito}
                        activeOpacity={0.7}
                        hitSlop={8}
                    >
                        <Ionicons name="arrow-back" size={tamanos.backIconSize} color="#FFF" />
                    </TouchableOpacity>
                    <Text
                        style={[estilos.title, { fontSize: tamanos.tituloSize, color: '#FFF' }]}
                        allowFontScaling={false}
                        numberOfLines={1}
                    >
                        Confirmar Pedido
                    </Text>
                    <View style={{ width: tamanos.backIconSize + 16 }} />
                </View>

                {/* STEPS (dentro del header flotante) */}
                <View
                    style={[
                        estilos.stepsContainer,
                        {
                            paddingHorizontal: tamanos.paddingHorizontal,
                            paddingTop: 12,
                            paddingBottom: 20,
                        },
                    ]}
                >
                    <StepsBar pasoActual={1} tamanos={tamanos} C={C} />
                </View>
            </View>

            <View
                style={[
                    estilos.stepsContainer,
                    {
                        paddingHorizontal: tamanos.paddingHorizontal,
                        paddingTop: 12,
                        paddingBottom: 20,
                    },
                ]}
            >
                <StepsBar pasoActual={1} tamanos={tamanos} C={C} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: tamanos.paddingHorizontal,
                        paddingBottom: insets.bottom + 120,
                        // 🎯 paddingTop = altura del header flotante + un margen extra
                        paddingTop: insets.top + tamanos.headerTopPadding + 100 + tamanos.headerBottomPadding + 20,
                    },
                ]}
            >
                {/* 🎁 BENEFICIOS DE NIVEL */}
                {perfil && beneficios && (nivel || beneficios.descuento > 0 || beneficios.envioGratis) && (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginBottom: tamanos.cardMarginBottom,
                            marginTop: tamanos.sectionMarginTop,
                        }}
                    >
                        <View style={{ borderRadius: tamanos.beneficiosRadius, overflow: 'hidden' }}>
                            <LinearGradient
                                colors={[C.accent + '18', C.accentSecondary + '08']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View
                                style={{
                                    padding: tamanos.beneficiosPadding,
                                    borderWidth: 1,
                                    borderColor: C.accentBorder,
                                    borderRadius: tamanos.beneficiosRadius,
                                }}
                            >
                                <View style={estilos.beneficiosHeader}>
                                    <View
                                        style={{
                                            width: tamanos.beneficiosIconSize,
                                            height: tamanos.beneficiosIconSize,
                                            borderRadius: tamanos.beneficiosIconSize / 2,
                                            backgroundColor: C.accent + '20',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: tamanos.beneficiosEmojiSize }} allowFontScaling={false}>
                                            {nivel?.icono || '⭐'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: tamanos.beneficiosTitleSize,
                                                color: C.accent,
                                                fontWeight: '700',
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {nivel?.nombre || 'Cliente'}
                                        </Text>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.beneficiosDescSize,
                                                color: C.textSec,
                                                includeFontPadding: false,
                                                marginTop: 2,
                                            }}
                                            allowFontScaling={false}
                                            numberOfLines={2}
                                        >
                                            {descripcionBeneficios || 'Acumulá puntos para subir de nivel'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={estilos.beneficiosList}>
                                    {beneficios.descuento > 0 && (
                                        <View
                                            style={[
                                                estilos.beneficioTag,
                                                {
                                                    paddingHorizontal: tamanos.beneficioTagPaddingH,
                                                    paddingVertical: tamanos.beneficioTagPaddingV,
                                                    borderRadius: tamanos.beneficioTagRadius,
                                                    backgroundColor: colores.surface,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                        >
                                            <Ionicons name="pricetag-outline" size={tamanos.beneficioTagIconSize} color={C.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.beneficioTagTextSize,
                                                    color: C.accent,
                                                    fontWeight: '600',
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {beneficios.descuento}% OFF
                                            </Text>
                                        </View>
                                    )}
                                    {beneficios.envioGratis && (
                                        <View
                                            style={[
                                                estilos.beneficioTag,
                                                {
                                                    paddingHorizontal: tamanos.beneficioTagPaddingH,
                                                    paddingVertical: tamanos.beneficioTagPaddingV,
                                                    borderRadius: tamanos.beneficioTagRadius,
                                                    backgroundColor: colores.surface,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                        >
                                            <Ionicons name="bicycle-outline" size={tamanos.beneficioTagIconSize} color={C.success} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.beneficioTagTextSize,
                                                    color: C.success,
                                                    fontWeight: '600',
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Envío gratis
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* 📞 CONTACTO */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="person-outline"
                        title="Datos de contacto"
                        subtitle="¿A qué número te avisamos?"
                        color={C.accent}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View
                        style={[
                            estilos.card,
                            {
                                padding: tamanos.cardPadding,
                                borderRadius: tamanos.cardRadius,
                                marginTop: 12,
                                backgroundColor: colores.surface,
                                borderColor: colores.border,
                            },
                        ]}
                    >
                        <Text
                            style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, marginBottom: 6, color: colores.textSecondary }]}
                            allowFontScaling={false}
                        >
                            Teléfono / WhatsApp
                        </Text>
                        <View
                            style={[
                                estilos.inputWrap,
                                {
                                    borderRadius: tamanos.inputRadius,
                                    minHeight: tamanos.inputMinHeight,
                                    paddingHorizontal: tamanos.inputPaddingH,
                                    borderColor: telefono ? C.successBorder : colores.border,
                                    backgroundColor: telefono ? C.successSoft : colores.fondo,
                                },
                            ]}
                        >
                            <Ionicons
                                name={telefono ? 'checkmark-circle' : 'call-outline'}
                                size={tamanos.inputIconSize}
                                color={telefono ? C.success : C.textTer}
                            />
                            <TextInput
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.inputSize,
                                    color: C.text,
                                    flex: 1,
                                    paddingVertical: tamanos.inputPaddingV,
                                    marginLeft: 10,
                                    includeFontPadding: false,
                                    textAlignVertical: 'center',
                                }}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="Ej: 11 1234 5678"
                                placeholderTextColor={C.textTer}
                                keyboardType="phone-pad"
                                selectionColor={C.accent}
                                allowFontScaling={false}
                            />
                        </View>
                        {perfil?.telefono && (
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.inputLabelSize,
                                    color: C.success,
                                    marginTop: 6,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                ✓ Cargado desde tu perfil
                            </Text>
                        )}
                    </View>
                </Animated.View>

                {/* 🚚 TIPO DE ENTREGA */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="bicycle-outline"
                        title="Tipo de entrega"
                        subtitle="¿Cómo lo querés recibir?"
                        color={C.accent}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View style={{ gap: isTablet ? 10 : 8, marginTop: 12 }}>
                        {tiposEntrega.map((t) => {
                            const isSelected = tipoEntrega === t.id;
                            return (
                                <TouchableRipple
                                    key={t.id}
                                    onPress={() => {
                                        Haptics.selectionAsync().catch(() => { });
                                        setTipoEntrega(t.id);
                                    }}
                                    borderless
                                    rippleColor={C.accent + '15'}
                                    style={[
                                        estilos.optionCard,
                                        {
                                            padding: tamanos.optionPadding,
                                            borderRadius: tamanos.optionRadius,
                                            backgroundColor: isSelected ? C.accentSoft : colores.surface,
                                            borderColor: isSelected ? C.accent : colores.border,
                                            borderWidth: isSelected ? 1.5 : 1,
                                        },
                                    ]}
                                >
                                    <View style={estilos.optionInner}>
                                        <View
                                            style={[
                                                estilos.optionIconWrap,
                                                {
                                                    width: tamanos.optionIconSize + 16,
                                                    height: tamanos.optionIconSize + 16,
                                                    borderRadius: (tamanos.optionIconSize + 16) / 2,
                                                    backgroundColor: isSelected ? C.accent + '20' : colores.fondo,
                                                },
                                            ]}
                                        >
                                            <Ionicons
                                                name={t.icono as any}
                                                size={tamanos.optionIconSize}
                                                color={isSelected ? C.accent : C.textSec}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.display,
                                                    fontSize: tamanos.optionTextSize,
                                                    color: isSelected ? C.text : C.textSec,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {t.label}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.sectionSubtitleSize,
                                                    color: C.textTer,
                                                    marginTop: 2,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {t.subtitle}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.display,
                                                    fontSize: tamanos.optionPriceSize,
                                                    color: isSelected ? C.accent : C.textTer,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {t.costo === 0 ? 'GRATIS' : formatearPrecio(t.costo)}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={16} color={C.accent} style={{ marginTop: 4 }} />
                                            )}
                                        </View>
                                    </View>
                                </TouchableRipple>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* 📍 DIRECCIÓN */}
                {tipoEntrega === 'domicilio' && (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginBottom: tamanos.cardMarginBottom,
                        }}
                    >
                        <SectionHeader
                            icon="location-outline"
                            title="Dirección de entrega"
                            subtitle="¿Dónde te lo llevamos?"
                            color={C.info}
                            tamanos={tamanos}
                            C={C}
                        />

                        {modoDireccion === 'vista' && (
                            <>
                                <View style={{ marginTop: 12, marginBottom: 10 }}>
                                    <BotonUsarMiUbicacion
                                        onUbicacionObtenida={handleUbicacionActual}
                                        texto="Usar mi ubicación actual"
                                        variante="primario"
                                    />
                                </View>

                                <View
                                    style={[
                                        estilos.card,
                                        {
                                            padding: tamanos.cardPadding,
                                            borderRadius: tamanos.cardRadius,
                                            borderColor: direccionDelPerfil ? C.successBorder : colores.border,
                                            backgroundColor: direccionDelPerfil ? C.successSoft : colores.surface,
                                        },
                                    ]}
                                >
                                    <View style={estilos.direccionHeader}>
                                        <Ionicons
                                            name={direccionDelPerfil ? 'checkmark-circle' : 'location'}
                                            size={tamanos.direccionBadgeSize + 6}
                                            color={direccionDelPerfil ? C.success : C.info}
                                        />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: tamanos.direccionLabelSize,
                                                color: direccionDelPerfil ? C.success : C.info,
                                                marginLeft: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {direccionDelPerfil ? 'Dirección guardada' : 'Dirección actual'}
                                        </Text>
                                    </View>

                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.direccionTextSize,
                                            color: C.text,
                                            lineHeight: 20,
                                            marginTop: 8,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                        numberOfLines={3}
                                    >
                                        {direccion || 'No hay dirección cargada'}
                                    </Text>

                                    <View style={estilos.direccionActions}>
                                        <TouchableOpacity
                                            onPress={abrirEdicionDireccion}
                                            style={[
                                                estilos.smallButton,
                                                {
                                                    backgroundColor: C.accentSoft,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 10,
                                                },
                                            ]}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="pencil" size={14} color={C.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.display,
                                                    fontSize: 12,
                                                    color: C.accent,
                                                    marginLeft: 4,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Editar
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={async () => {
                                                const tienePermiso = await asegurarPermisosUbicacion();
                                                if (!tienePermiso) {
                                                    toast.advertencia('Necesitamos permiso de ubicación para el mapa');
                                                    return;
                                                }
                                                setMostrarMapa(true);
                                            }}
                                            style={[
                                                estilos.smallButton,
                                                {
                                                    backgroundColor: C.infoSoft,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 10,
                                                },
                                            ]}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="map" size={14} color={C.info} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.display,
                                                    fontSize: 12,
                                                    color: C.info,
                                                    marginLeft: 4,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Mapa
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View
                                        style={[
                                            estilos.infoEnvioBox,
                                            {
                                                padding: tamanos.infoEnvioPadding,
                                                borderRadius: tamanos.infoEnvioRadius,
                                                marginTop: 10,
                                                borderColor: colores.border,
                                                backgroundColor: colores.surface,
                                            },
                                        ]}
                                    >
                                        {distanciaFormateada ? (
                                            <View style={estilos.infoEnvioRow}>
                                                <Ionicons name="navigate" size={tamanos.infoEnvioIconSize} color={C.info} />
                                                <Text
                                                    style={{
                                                        fontFamily: FUENTES.regular,
                                                        fontSize: tamanos.infoEnvioTextSize,
                                                        color: C.textSec,
                                                        marginLeft: 8,
                                                        includeFontPadding: false,
                                                    }}
                                                    allowFontScaling={false}
                                                >
                                                    Distancia:{' '}
                                                    <Text style={{ color: C.text, fontWeight: '600' }}>{distanciaFormateada}</Text>
                                                </Text>
                                            </View>
                                        ) : null}
                                        {envioDisponible ? (
                                            <>
                                                <View style={estilos.infoEnvioRow}>
                                                    <Ionicons
                                                        name="cash-outline"
                                                        size={tamanos.infoEnvioIconSize}
                                                        color={envioGratisAplicado ? C.success : C.textSec}
                                                    />
                                                    <Text
                                                        style={{
                                                            fontFamily: FUENTES.regular,
                                                            fontSize: tamanos.infoEnvioTextSize,
                                                            color: C.textSec,
                                                            marginLeft: 8,
                                                            includeFontPadding: false,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        Envío:{' '}
                                                        <Text
                                                            style={{
                                                                color: envioGratisAplicado ? C.success : C.text,
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            {envioGratisAplicado ? 'GRATIS' : formatearPrecio(costoEnvioCalculado)}
                                                        </Text>
                                                    </Text>
                                                </View>
                                                {tiempoEstimado > 0 && (
                                                    <View style={estilos.infoEnvioRow}>
                                                        <Ionicons name="time-outline" size={tamanos.infoEnvioIconSize} color={C.textSec} />
                                                        <Text
                                                            style={{
                                                                fontFamily: FUENTES.regular,
                                                                fontSize: tamanos.infoEnvioTextSize,
                                                                color: C.textSec,
                                                                marginLeft: 8,
                                                                includeFontPadding: false,
                                                            }}
                                                            allowFontScaling={false}
                                                        >
                                                            Llega en{' '}
                                                            <Text style={{ color: C.text, fontWeight: '600' }}>{tiempoEstimado} min</Text>
                                                        </Text>
                                                    </View>
                                                )}
                                            </>
                                        ) : (
                                            <View style={estilos.infoEnvioRow}>
                                                <Ionicons name="warning-outline" size={tamanos.infoEnvioIconSize} color={C.warning} />
                                                <Text
                                                    style={{
                                                        fontFamily: FUENTES.regular,
                                                        fontSize: tamanos.infoEnvioTextSize,
                                                        color: C.warning,
                                                        marginLeft: 8,
                                                        flex: 1,
                                                        includeFontPadding: false,
                                                    }}
                                                    allowFontScaling={false}
                                                >
                                                    {mensajeEnvio}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View
                                        style={[
                                            estilos.infoEnvioBox,
                                            {
                                                padding: tamanos.infoEnvioPadding,
                                                borderRadius: tamanos.infoEnvioRadius,
                                                marginTop: 10,
                                                borderColor: colores.border,
                                                backgroundColor: colores.surface,
                                            },
                                        ]}
                                    >
                                        <View style={estilos.infoEnvioRow}>
                                            <ActivityIndicator size="small" color={C.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.infoEnvioTextSize,
                                                    color: C.textSec,
                                                    marginLeft: 8,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Calculando envío...
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        {modoDireccion === 'texto' && (
                            <View
                                style={[
                                    estilos.card,
                                    {
                                        padding: tamanos.cardPadding,
                                        borderRadius: tamanos.cardRadius,
                                        marginTop: 12,
                                        borderColor: C.accent,
                                        borderWidth: 1.5,
                                        backgroundColor: colores.surface,
                                    },
                                ]}
                            >
                                <View style={estilos.direccionHeader}>
                                    <Ionicons name="pencil" size={tamanos.direccionBadgeSize + 6} color={C.accent} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.direccionLabelSize + 1,
                                            color: C.accent,
                                            marginLeft: 6,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Editar dirección
                                    </Text>
                                </View>

                                <TextInput
                                    style={[
                                        estilos.textArea,
                                        {
                                            fontSize: tamanos.inputSize,
                                            paddingHorizontal: tamanos.inputPaddingH,
                                            paddingVertical: tamanos.inputPaddingV,
                                            borderRadius: tamanos.inputRadius,
                                            marginTop: 10,
                                            color: colores.text,
                                            backgroundColor: colores.fondo,
                                            borderColor: colores.border,
                                        },
                                    ]}
                                    value={direccionInput}
                                    onChangeText={setDireccionInput}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={C.textTer}
                                    selectionColor={C.accent}
                                    autoFocus
                                    multiline
                                    allowFontScaling={false}
                                />

                                {errorDireccion && (
                                    <View style={estilos.errorRow}>
                                        <Ionicons name="alert-circle" size={14} color={C.danger} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                color: C.danger,
                                                marginLeft: 6,
                                                flex: 1,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {errorDireccion}
                                        </Text>
                                    </View>
                                )}

                                <View style={estilos.direccionActions}>
                                    <TouchableOpacity
                                        onPress={verificarDireccionTexto}
                                        disabled={verificandoDireccion}
                                        style={[
                                            estilos.actionButtonPrimary,
                                            {
                                                paddingVertical: 10,
                                                paddingHorizontal: 16,
                                                borderRadius: 10,
                                                opacity: verificandoDireccion ? 0.6 : 1,
                                                backgroundColor: C.accent,
                                            },
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        {verificandoDireccion ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Ionicons name="search" size={14} color="#FFF" />
                                        )}
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: 13,
                                                color: '#FFF',
                                                marginLeft: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {verificandoDireccion ? 'Verificando...' : 'Verificar'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={cancelarEdicionDireccion}
                                        style={[
                                            estilos.actionButtonSecondary,
                                            {
                                                paddingVertical: 10,
                                                paddingHorizontal: 14,
                                                borderRadius: 10,
                                                backgroundColor: colores.fondo,
                                                borderColor: colores.border,
                                            },
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={14} color={C.textSec} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: 12,
                                                color: C.textSec,
                                                marginLeft: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Cancelar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {modoDireccion === 'formulario' && (
                            <View
                                style={[
                                    estilos.card,
                                    {
                                        padding: tamanos.cardPadding,
                                        borderRadius: tamanos.cardRadius,
                                        marginTop: 12,
                                        borderColor: C.warning,
                                        borderWidth: 1.5,
                                        backgroundColor: colores.surface,
                                    },
                                ]}
                            >
                                <View style={estilos.direccionHeader}>
                                    <Ionicons name="warning" size={tamanos.direccionBadgeSize + 6} color={C.warning} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.direccionLabelSize + 1,
                                            color: C.warning,
                                            marginLeft: 6,
                                            flex: 1,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {errorDireccion || 'Completá la dirección manualmente'}
                                    </Text>
                                </View>

                                <View style={{ marginTop: 12 }}>
                                    <Text
                                        style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                        allowFontScaling={false}
                                    >
                                        Calle *
                                    </Text>
                                    <TextInput
                                        style={[
                                            estilos.textInput,
                                            {
                                                fontSize: tamanos.inputSize,
                                                paddingHorizontal: tamanos.inputPaddingH,
                                                paddingVertical: tamanos.inputPaddingV,
                                                borderRadius: tamanos.inputRadius,
                                                marginTop: 4,
                                                color: colores.text,
                                                backgroundColor: colores.fondo,
                                                borderColor: colores.border,
                                            },
                                        ]}
                                        value={camposManuales.calle}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, calle: t }))}
                                        placeholder="Ej: Av. Corrientes"
                                        placeholderTextColor={C.textTer}
                                        selectionColor={C.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                <View style={{ marginTop: 10 }}>
                                    <Text
                                        style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                        allowFontScaling={false}
                                    >
                                        Número *
                                    </Text>
                                    <TextInput
                                        style={[
                                            estilos.textInput,
                                            {
                                                fontSize: tamanos.inputSize,
                                                paddingHorizontal: tamanos.inputPaddingH,
                                                paddingVertical: tamanos.inputPaddingV,
                                                borderRadius: tamanos.inputRadius,
                                                marginTop: 4,
                                                color: colores.text,
                                                backgroundColor: colores.fondo,
                                                borderColor: colores.border,
                                            },
                                        ]}
                                        value={camposManuales.numero}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, numero: t }))}
                                        placeholder="Ej: 1234"
                                        placeholderTextColor={C.textTer}
                                        keyboardType="number-pad"
                                        selectionColor={C.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                            allowFontScaling={false}
                                        >
                                            Piso
                                        </Text>
                                        <TextInput
                                            style={[
                                                estilos.textInput,
                                                {
                                                    fontSize: tamanos.inputSize,
                                                    paddingHorizontal: tamanos.inputPaddingH,
                                                    paddingVertical: tamanos.inputPaddingV,
                                                    borderRadius: tamanos.inputRadius,
                                                    marginTop: 4,
                                                    color: colores.text,
                                                    backgroundColor: colores.fondo,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                            value={camposManuales.piso}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, piso: t }))}
                                            placeholder="3"
                                            placeholderTextColor={C.textTer}
                                            selectionColor={C.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                            allowFontScaling={false}
                                        >
                                            Depto
                                        </Text>
                                        <TextInput
                                            style={[
                                                estilos.textInput,
                                                {
                                                    fontSize: tamanos.inputSize,
                                                    paddingHorizontal: tamanos.inputPaddingH,
                                                    paddingVertical: tamanos.inputPaddingV,
                                                    borderRadius: tamanos.inputRadius,
                                                    marginTop: 4,
                                                    color: colores.text,
                                                    backgroundColor: colores.fondo,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                            value={camposManuales.departamento}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, departamento: t }))}
                                            placeholder="A"
                                            placeholderTextColor={C.textTer}
                                            selectionColor={C.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                </View>

                                <View style={{ marginTop: 10 }}>
                                    <Text
                                        style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                        allowFontScaling={false}
                                    >
                                        Barrio
                                    </Text>
                                    <TextInput
                                        style={[
                                            estilos.textInput,
                                            {
                                                fontSize: tamanos.inputSize,
                                                paddingHorizontal: tamanos.inputPaddingH,
                                                paddingVertical: tamanos.inputPaddingV,
                                                borderRadius: tamanos.inputRadius,
                                                marginTop: 4,
                                                color: colores.text,
                                                backgroundColor: colores.fondo,
                                                borderColor: colores.border,
                                            },
                                        ]}
                                        value={camposManuales.barrio}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, barrio: t }))}
                                        placeholder="Ej: San Nicolás"
                                        placeholderTextColor={C.textTer}
                                        selectionColor={C.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                    <View style={{ flex: 2 }}>
                                        <Text
                                            style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                            allowFontScaling={false}
                                        >
                                            Ciudad
                                        </Text>
                                        <TextInput
                                            style={[
                                                estilos.textInput,
                                                {
                                                    fontSize: tamanos.inputSize,
                                                    paddingHorizontal: tamanos.inputPaddingH,
                                                    paddingVertical: tamanos.inputPaddingV,
                                                    borderRadius: tamanos.inputRadius,
                                                    marginTop: 4,
                                                    color: colores.text,
                                                    backgroundColor: colores.fondo,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                            value={camposManuales.ciudad}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, ciudad: t }))}
                                            placeholder="CABA"
                                            placeholderTextColor={C.textTer}
                                            selectionColor={C.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, color: colores.textSecondary }]}
                                            allowFontScaling={false}
                                        >
                                            CP
                                        </Text>
                                        <TextInput
                                            style={[
                                                estilos.textInput,
                                                {
                                                    fontSize: tamanos.inputSize,
                                                    paddingHorizontal: tamanos.inputPaddingH,
                                                    paddingVertical: tamanos.inputPaddingV,
                                                    borderRadius: tamanos.inputRadius,
                                                    marginTop: 4,
                                                    color: colores.text,
                                                    backgroundColor: colores.fondo,
                                                    borderColor: colores.border,
                                                },
                                            ]}
                                            value={camposManuales.codigoPostal}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, codigoPostal: t }))}
                                            placeholder="1043"
                                            placeholderTextColor={C.textTer}
                                            keyboardType="number-pad"
                                            selectionColor={C.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                </View>

                                <View style={[estilos.direccionActions, { marginTop: 14 }]}>
                                    <TouchableOpacity
                                        onPress={aplicarDireccionManual}
                                        disabled={verificandoDireccion}
                                        style={[
                                            estilos.actionButtonPrimary,
                                            {
                                                paddingVertical: 10,
                                                paddingHorizontal: 16,
                                                borderRadius: 10,
                                                opacity: verificandoDireccion ? 0.6 : 1,
                                                backgroundColor: C.accent,
                                            },
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        {verificandoDireccion ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                                        )}
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: 13,
                                                color: '#FFF',
                                                marginLeft: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {verificandoDireccion ? 'Verificando...' : 'Confirmar'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={volverAlModoTexto}
                                        style={[
                                            estilos.actionButtonSecondary,
                                            {
                                                paddingVertical: 10,
                                                paddingHorizontal: 14,
                                                borderRadius: 10,
                                                backgroundColor: colores.fondo,
                                                borderColor: colores.border,
                                            },
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="arrow-back" size={14} color={C.textSec} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: 12,
                                                color: C.textSec,
                                                marginLeft: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Volver
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Animated.View>
                )}

                {mostrarMapa && (
                    <Suspense fallback={null}>
                        <MapaSelector
                            visible={mostrarMapa}
                            onClose={() => setMostrarMapa(false)}
                            onConfirmar={handleConfirmarUbicacion}
                            ubicacionInicial={ubicacionSeleccionada || undefined}
                            direccionInicial={direccion}
                            titulo="📍 Seleccioná tu ubicación"
                        />
                    </Suspense>
                )}

                {/* 💳 MÉTODO DE PAGO */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="card-outline"
                        title="Método de pago"
                        subtitle="¿Cómo vas a pagar?"
                        color={C.accent}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        {metodosPago.map((m) => {
                            const isSelected = metodoPago === m.id;
                            return (
                                <TouchableRipple
                                    key={m.id}
                                    onPress={() => {
                                        Haptics.selectionAsync().catch(() => { });
                                        setMetodoPago(m.id);
                                        if (m.id !== 'efectivo') {
                                            setMontoConQuePaga('');
                                            setVueltoCalculado(0);
                                            setMostrarVuelto(false);
                                        }
                                    }}
                                    borderless
                                    rippleColor={C.accent + '15'}
                                    style={[
                                        estilos.payMethodCard,
                                        {
                                            padding: tamanos.optionPadding,
                                            borderRadius: tamanos.optionRadius,
                                            backgroundColor: isSelected ? C.accentSoft : colores.surface,
                                            borderColor: isSelected ? C.accent : colores.border,
                                            borderWidth: isSelected ? 1.5 : 1,
                                        },
                                    ]}
                                >
                                    <View style={estilos.payMethodInner}>
                                        <Ionicons
                                            name={m.icono as any}
                                            size={tamanos.optionIconSize}
                                            color={isSelected ? C.accent : C.textSec}
                                        />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: tamanos.optionTextSize,
                                                color: isSelected ? C.text : C.textSec,
                                                marginTop: 6,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {m.label}
                                        </Text>
                                    </View>
                                </TouchableRipple>
                            );
                        })}
                    </View>

                    {metodoPago === 'efectivo' && (
                        <View
                            style={[
                                estilos.card,
                                {
                                    padding: tamanos.efectivoPadding,
                                    borderRadius: tamanos.efectivoRadius,
                                    marginTop: 10,
                                    backgroundColor: colores.surface,
                                    borderColor: colores.border,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.efectivoSubtitleSize,
                                    color: C.textSec,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Total a pagar:{' '}
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        color: C.accent,
                                        fontSize: tamanos.efectivoTitleSize,
                                    }}
                                >
                                    {formatearPrecio(totalFinal)}
                                </Text>
                            </Text>

                            <Text
                                style={[estilos.inputLabel, { fontSize: tamanos.inputLabelSize, marginTop: 10, color: colores.textSecondary }]}
                                allowFontScaling={false}
                            >
                                ¿Con cuánto vas a pagar?
                            </Text>
                            <View
                                style={[
                                    estilos.inputWrap,
                                    {
                                        borderRadius: tamanos.inputRadius,
                                        minHeight: tamanos.inputMinHeight,
                                        paddingHorizontal: tamanos.inputPaddingH,
                                        marginTop: 6,
                                        borderColor: mostrarVuelto ? C.successBorder : colores.border,
                                        backgroundColor: mostrarVuelto ? C.successSoft : colores.fondo,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.efectivoInputSize,
                                        color: C.textSec,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    $
                                </Text>
                                <TextInput
                                    style={{
                                        flex: 1,
                                        fontSize: tamanos.efectivoInputSize,
                                        color: C.text,
                                        paddingVertical: tamanos.efectivoInputPaddingV,
                                        fontFamily: FUENTES.display,
                                        marginLeft: 4,
                                        includeFontPadding: false,
                                    }}
                                    value={montoConQuePaga}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9.]/g, '');
                                        setMontoConQuePaga(cleaned);
                                        calcularVuelto(cleaned);
                                    }}
                                    placeholder="0.00"
                                    placeholderTextColor={C.textTer}
                                    keyboardType="decimal-pad"
                                    selectionColor={C.accent}
                                    allowFontScaling={false}
                                />
                            </View>

                            {mostrarVuelto && vueltoCalculado > 0 && (
                                <View
                                    style={[
                                        estilos.vueltoBox,
                                        {
                                            padding: tamanos.vueltoPadding,
                                            borderRadius: tamanos.vueltoRadius,
                                            marginTop: 10,
                                            backgroundColor: C.successSoft,
                                            borderColor: C.successBorder,
                                        },
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="cash-outline" size={tamanos.vueltoIconSize} color={C.success} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.vueltoLabelSize,
                                                color: C.text,
                                                marginLeft: 8,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Tu vuelto
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.vueltoMontoSize,
                                            color: C.success,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {formatearPrecio(vueltoCalculado)}
                                    </Text>
                                </View>
                            )}

                            {montoConQuePaga && !mostrarVuelto && parseFloat(montoConQuePaga) > 0 && (
                                <View style={[estilos.errorRow, { marginTop: 10 }]}>
                                    <Ionicons name="alert-circle" size={14} color={C.warning} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 12,
                                            color: C.warning,
                                            marginLeft: 6,
                                            flex: 1,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        El monto es menor al total ({formatearPrecio(totalFinal)})
                                    </Text>
                                </View>
                            )}

                            {(!montoConQuePaga || (montoConQuePaga && !mostrarVuelto)) && (
                                <TouchableOpacity
                                    style={{
                                        marginTop: 10,
                                        paddingVertical: 8,
                                        paddingHorizontal: 12,
                                        borderRadius: 8,
                                        backgroundColor: C.accentSoft,
                                        alignSelf: 'flex-start',
                                    }}
                                    onPress={() => {
                                        const totalStr = totalFinal.toFixed(2);
                                        setMontoConQuePaga(totalStr);
                                        calcularVuelto(totalStr);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: 12,
                                            color: C.accent,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        💡 Pagar con el monto exacto
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Animated.View>

                {/* 📝 NOTAS */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="create-outline"
                        title="Notas"
                        subtitle="¿Algo que debamos saber? (opcional)"
                        color={C.textSec}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View
                        style={[
                            estilos.card,
                            {
                                padding: tamanos.cardPadding,
                                borderRadius: tamanos.cardRadius,
                                marginTop: 12,
                                backgroundColor: colores.surface,
                                borderColor: colores.border,
                            },
                        ]}
                    >
                        <TextInput
                            style={[
                                estilos.textArea,
                                {
                                    fontSize: tamanos.inputSize,
                                    paddingHorizontal: tamanos.inputPaddingH,
                                    paddingVertical: tamanos.inputPaddingV,
                                    borderRadius: tamanos.inputRadius,
                                    minHeight: 80,
                                    color: colores.text,
                                    backgroundColor: colores.fondo,
                                    borderColor: colores.border,
                                },
                            ]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Ej: sin cebolla, extra queso..."
                            placeholderTextColor={C.textTer}
                            multiline
                            numberOfLines={3}
                            selectionColor={C.accent}
                            allowFontScaling={false}
                        />
                    </View>
                </Animated.View>

                {/* 🛒 PRODUCTOS */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="bag-handle-outline"
                        title={`Tu pedido (${elementos.length})`}
                        subtitle="Productos en el carrito"
                        color={C.accent}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View
                        style={[
                            estilos.card,
                            {
                                padding: tamanos.cardPadding,
                                borderRadius: tamanos.cardRadius,
                                marginTop: 12,
                                backgroundColor: colores.surface,
                                borderColor: colores.border,
                            },
                        ]}
                    >
                        {elementos.map((e, i) => (
                            <View
                                key={i}
                                style={[
                                    estilos.productRow,
                                    {
                                        paddingVertical: 10,
                                        borderBottomWidth: i < elementos.length - 1 ? 1 : 0,
                                        borderBottomColor: colores.border,
                                    },
                                ]}
                            >
                                <View style={[estilos.productQty, { backgroundColor: C.accentSoft }]}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: 12,
                                            color: C.accent,
                                            fontWeight: '700',
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {e.cantidad}x
                                    </Text>
                                </View>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.productoTextSize,
                                        color: C.text,
                                        flex: 1,
                                        marginLeft: 10,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                    numberOfLines={1}
                                >
                                    {e.producto.nombre}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.productoPrecioSize,
                                        color: C.text,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {formatearPrecio(precioUnitario(e.producto.precio) * e.cantidad)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* 📊 RESUMEN */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: tamanos.cardMarginBottom,
                    }}
                >
                    <SectionHeader
                        icon="receipt-outline"
                        title="Resumen"
                        subtitle="Detalle de tu pedido"
                        color={C.accent}
                        tamanos={tamanos}
                        C={C}
                    />

                    <View
                        style={[
                            estilos.card,
                            {
                                padding: tamanos.cardPadding,
                                borderRadius: tamanos.cardRadius,
                                marginTop: 12,
                                backgroundColor: colores.surface,
                                borderColor: colores.border,
                            },
                        ]}
                    >
                        <View style={estilos.summaryRow}>
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.resumenTextSize,
                                    color: C.textSec,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Subtotal
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.resumenValorSize,
                                    color: C.text,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {formatearPrecio(subtotal)}
                            </Text>
                        </View>

                        {descuentoNivelAplicado > 0 && (
                            <View style={[estilos.summaryRow, { marginTop: 6 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="pricetag-outline" size={14} color={C.success} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.resumenTextSize,
                                            color: C.success,
                                            marginLeft: 6,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Descuento {nivel?.nombre}
                                    </Text>
                                </View>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.resumenValorSize,
                                        color: C.success,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    -{formatearPrecio(descuentoNivelAplicado)}
                                </Text>
                            </View>
                        )}

                        {descuentoPuntos > 0 && (
                            <View style={[estilos.summaryRow, { marginTop: 6 }]}>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.resumenTextSize,
                                        color: C.success,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Descuento por puntos
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.resumenValorSize,
                                        color: C.success,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    -{formatearPrecio(descuentoPuntos)}
                                </Text>
                            </View>
                        )}

                        {descuentoCuponUI > 0 && (
                            <View style={[estilos.summaryRow, { marginTop: 6 }]}>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.resumenTextSize,
                                        color: C.success,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Descuento cupón {cuponAplicado?.codigo ? `(${cuponAplicado.codigo})` : ''}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.resumenValorSize,
                                        color: C.success,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    -{formatearPrecio(descuentoCuponUI)}
                                </Text>
                            </View>
                        )}

                        <View style={[estilos.summaryRow, { marginTop: 6 }]}>
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.resumenTextSize,
                                    color: C.textSec,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Costo de envío
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.resumenValorSize,
                                    color: tipoEntrega === 'retiro' || envioGratisAplicado ? C.success : C.text,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {tipoEntrega === 'retiro'
                                    ? 'GRATIS'
                                    : envioGratisAplicado
                                        ? 'GRATIS'
                                        : envioGratisCupon
                                            ? 'GRATIS (cupón)'
                                            : ubicacionSeleccionada
                                                ? envioDisponible
                                                    ? formatearPrecio(costoEnvioCalculado)
                                                    : 'No disponible'
                                                : '—'}
                            </Text>
                        </View>

                        <View
                            style={[
                                estilos.summaryRow,
                                estilos.summaryTotal,
                                { marginTop: 12, paddingTop: 12, borderTopColor: colores.border },
                            ]}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.totalTextSize,
                                    color: C.text,
                                    fontWeight: '700',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Total
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.totalPriceSize,
                                    color: C.accent,
                                    fontWeight: '700',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {formatearPrecio(totalFinal)}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* ✅ CONFIRMAR */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 8,
                    }}
                >
                    <TouchableOpacity
                        style={[
                            estilos.confirmButton,
                            {
                                borderRadius: tamanos.botonRadius,
                                opacity: cargando ? 0.6 : 1,
                                shadowColor: C.accent,
                            },
                        ]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[C.accent, C.accentSecondary]}
                            style={[
                                estilos.confirmButtonGradient,
                                { paddingVertical: tamanos.botonPaddingV },
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Animated2.View
                                style={[
                                    {
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        width: 100,
                                        backgroundColor: 'rgba(255,255,255,0.25)',
                                        transform: [{ skewX: '-20deg' }],
                                    },
                                    shineStyle,
                                ]}
                                pointerEvents="none"
                            />

                            {cargando ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={tamanos.botonIconSize} color="#FFF" />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.botonTextSize,
                                            color: '#FFF',
                                            marginLeft: 8,
                                            letterSpacing: 0.3,
                                            fontWeight: '700',
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {metodoPago === 'transferencia' ? 'Pagar con Transferencia' : 'Confirmar Pedido'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* MODAL ÉXITO CON CONFETI */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={estilos.modalOverlay}>
                    <View
                        style={[
                            estilos.modal,
                            {
                                padding: tamanos.modalPadding,
                                borderRadius: tamanos.modalRadius,
                                borderColor: C.successBorder,
                                borderWidth: 1,
                                backgroundColor: C.card,
                                overflow: 'hidden',
                            },
                        ]}
                    >
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
                            <ConfetiSkia activo={mostrarModalExito} />
                        </View>

                        <View style={[estilos.modalIconCircle, { backgroundColor: colores.success + '20', borderColor: colores.success + '40' }]}>
                            <Ionicons name="checkmark" size={tamanos.modalIconSize * 0.5} color={C.success} />
                        </View>

                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: tamanos.modalTitleSize,
                                color: C.success,
                                marginBottom: 8,
                                textAlign: 'center',
                                fontWeight: '700',
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            ¡Pedido confirmado!
                        </Text>
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.modalTextSize,
                                color: C.textSec,
                                textAlign: 'center',
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            {metodoPago === 'efectivo' && mostrarVuelto
                                ? `Pagás con ${formatearPrecio(parseFloat(montoConQuePaga.replace(',', '.')))}. Tu vuelto es ${formatearPrecio(vueltoCalculado)}`
                                : 'Tu pedido está siendo preparado'}
                        </Text>
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.modalSubtextSize,
                                color: C.accent,
                                marginTop: 12,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Redirigiendo al seguimiento...
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>{renderLoaderDots()}</View>
                    </View>
                </View>
            </Modal>

            {/* MODAL TRANSFERENCIA */}
            <Modal
                visible={mostrarModalTransferencia}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={estilos.modalTransferenciaOverlay}>
                    <View
                        style={{
                            width: tamanos.transModalWidth,
                            maxWidth: 480,
                            backgroundColor: C.card,
                            borderColor: C.cardBorder,
                            borderRadius: tamanos.transModalRadius,
                            overflow: 'hidden',
                            borderWidth: 1,
                            maxHeight: '85%',
                            alignSelf: 'center',
                        }}
                    >
                        <LinearGradient
                            colors={[C.accent, C.accentSecondary]}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: tamanos.transModalHeaderPaddingV,
                            }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={estilos.modalTransferenciaHeaderContent}>
                                <View
                                    style={{
                                        width: tamanos.transModalHeaderIconSize,
                                        height: tamanos.transModalHeaderIconSize,
                                        borderRadius: tamanos.transModalHeaderIconSize / 2,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="swap-horizontal-outline"
                                        size={tamanos.transModalHeaderIconSize * 0.65}
                                        color="#FFF"
                                    />
                                </View>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.transModalHeaderTitleSize,
                                        color: '#FFF',
                                        letterSpacing: 0.3,
                                        marginLeft: 10,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Transferencia
                                </Text>
                            </View>
                        </LinearGradient>

                        <ScrollView
                            style={{ maxHeight: '80%' }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                padding: tamanos.transModalBodyPadding,
                                paddingBottom: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.transModalMensajeSize,
                                    color: C.textSec,
                                    textAlign: 'center',
                                    marginBottom: 16,
                                    lineHeight: 18,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Para completar tu pedido, realizá la transferencia:
                            </Text>

                            <View
                                style={{
                                    backgroundColor: C.accentSoft,
                                    borderRadius: 12,
                                    padding: tamanos.transModalAliasPadding,
                                    borderWidth: 1,
                                    borderColor: C.accentBorder,
                                    marginBottom: 12,
                                }}
                            >
                                <View style={estilos.modalTransferenciaAliasHeader}>
                                    <Ionicons name="cash-outline" size={16} color={C.accent} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.transModalAliasLabelSize,
                                            fontWeight: '600',
                                            color: C.accent,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            marginLeft: 6,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Alias
                                    </Text>
                                </View>
                                <View style={estilos.modalTransferenciaAliasRow}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalAliasTextoSize,
                                            color: C.text,
                                            letterSpacing: 0.5,
                                            flexShrink: 1,
                                            includeFontPadding: false,
                                        }}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        allowFontScaling={false}
                                    >
                                        {ALIAS_TRANSFERENCIA}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={copiarAlias}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            borderRadius: 6,
                                            backgroundColor: C.accent + '15',
                                            flexShrink: 0,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="copy-outline" size={16} color={C.accent} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.display,
                                                fontSize: 12,
                                                color: C.accent,
                                                fontWeight: '600',
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Copiar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View
                                style={{
                                    backgroundColor: C.bg,
                                    borderRadius: 10,
                                    padding: tamanos.transModalCbuPadding,
                                    borderWidth: 1,
                                    borderColor: C.cardBorder,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.transModalCbuLabelSize,
                                        fontWeight: '600',
                                        color: C.textTer,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        marginBottom: 2,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    CBU
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: tamanos.transModalCbuTextoSize,
                                        fontWeight: '500',
                                        color: C.text,
                                        letterSpacing: 0.3,
                                        includeFontPadding: false,
                                    }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    allowFontScaling={false}
                                >
                                    {CUENTA_TRANSFERENCIA}
                                </Text>
                            </View>

                            <View
                                style={{
                                    alignItems: 'center',
                                    paddingVertical: tamanos.transModalMontoPadding,
                                    borderTopWidth: 1,
                                    borderBottomWidth: 1,
                                    borderColor: C.cardBorder,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.transModalMontoLabelSize,
                                        color: C.textSec,
                                        marginBottom: 2,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Monto a transferir
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.transModalMontoTextoSize,
                                        color: C.accent,
                                        fontWeight: '700',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {formatearPrecio(totalFinal)}
                                </Text>
                            </View>

                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    textAlign: 'center',
                                    fontSize: tamanos.transModalPedidoIdSize,
                                    color: C.textTer,
                                    marginBottom: 16,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Pedido #{pedidoIdTransferencia}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, width: '100%' }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        paddingVertical: tamanos.transModalBotonPaddingV,
                                        paddingHorizontal: 10,
                                        borderRadius: tamanos.transModalBotonRadius,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        borderWidth: 1,
                                        minWidth: 0,
                                        backgroundColor: C.bg,
                                        borderColor: C.cardBorder,
                                    }}
                                    onPress={cerrarModalTransferencia}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={tamanos.transModalBotonIconSize}
                                        color={C.textSec}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalBotonTextSize,
                                            color: C.textSec,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Ya transferí
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        paddingVertical: tamanos.transModalBotonPaddingV,
                                        paddingHorizontal: 10,
                                        borderRadius: tamanos.transModalBotonRadius,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        minWidth: 0,
                                        backgroundColor: C.accent,
                                    }}
                                    onPress={abrirBanco}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="open-outline" size={tamanos.transModalBotonIconSize} color="#FFF" />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalBotonTextSize,
                                            color: '#FFF',
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Mercado Pago
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.transModalFooterSize,
                                    color: C.textTer,
                                    textAlign: 'center',
                                    lineHeight: 16,
                                    paddingBottom: 4,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                ⏳ Una vez transferido, presioná "Ya transferí"
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ModalDatoFaltante
                visible={mostrarModalTelefono}
                tipo="telefono"
                nombreUsuario={perfil?.nombre_cliente || ''}
                valorInicial={telefono}
                obligatorio={true}
                onGuardar={handleGuardarTelefonoCheckout}
                onSaltar={() => setMostrarModalTelefono(false)}
            />

            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colores.fondo },
        backgroundGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },

        headerGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        backButtonGlass: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.20)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
        },
        title: {
            fontFamily: FUENTES.display,
            fontWeight: '700',
            letterSpacing: 0.5,
            includeFontPadding: false,
            flex: 1,
            textAlign: 'center',
        },
        stepsContainer: {
            alignItems: 'center',
        },
        scroll: { flexGrow: 1 },
        card: {
            backgroundColor: colores.surface,
            borderWidth: 1,
            borderColor: colores.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
        },
        inputWrap: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colores.border,
            backgroundColor: colores.fondo,
        },
        textInput: {
            fontFamily: FUENTES.regular,
            color: colores.text,
            backgroundColor: colores.fondo,
            borderWidth: 1,
            borderColor: colores.border,
            includeFontPadding: false,
        },
        textArea: {
            fontFamily: FUENTES.regular,
            color: colores.text,
            backgroundColor: colores.fondo,
            borderWidth: 1,
            borderColor: colores.border,
            textAlignVertical: 'top',
            includeFontPadding: false,
        },
        inputLabel: {
            fontFamily: FUENTES.regular,
            color: colores.textSecondary,
            includeFontPadding: false,
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
        },
        optionIconWrap: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        optionInner: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        payMethodInner: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        payMethodCard: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        direccionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        direccionActions: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
        },
        smallButton: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        actionButtonPrimary: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colores.accent,
        },
        actionButtonSecondary: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colores.fondo,
            borderWidth: 1,
            borderColor: colores.border,
        },
        errorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
        },
        infoEnvioBox: {
            borderWidth: 1,
        },
        infoEnvioRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 3,
        },
        vueltoBox: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colores.success + '12',
            borderWidth: 1,
            borderColor: colores.success + '25',
        },
        productRow: {
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomColor: colores.border,
        },
        productQty: {
            width: 30,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        summaryTotal: {
            borderTopWidth: 1,
            borderTopColor: colores.border,
        },
        confirmButton: {
            overflow: 'hidden',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 6,
        },
        confirmButtonGradient: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            overflow: 'hidden',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modal: {
            width: '90%',
            maxWidth: 400,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 40,
            elevation: 20,
        },
        modalIconCircle: {
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 2,
        },
        modalTransferenciaOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
        },
        modalTransferenciaHeaderContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flexShrink: 1,
        },
        modalTransferenciaAliasHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
        },
        modalTransferenciaAliasRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
        },
        beneficiosHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
        beneficiosList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
        beneficioTag: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 1,
        },
    });