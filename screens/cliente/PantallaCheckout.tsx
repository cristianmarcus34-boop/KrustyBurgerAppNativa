// screens/cliente/PantallaCheckout.tsx - V2 RESPONSIVE
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    KeyboardAvoidingView,
    Platform,
    Linking,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';

import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO } from '../../lib/colores';
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

import MapaSelector from '../../components/Mapa';

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosCheckout {
    paddingHorizontal: number;
    headerTopPadding: number;
    headerBottomPadding: number;
    tituloSize: number;
    backIconSize: number;
    backButtonSize: number;
    // Sections
    seccionTituloSize: number;
    seccionMarginTop: number;
    // Inputs
    inputSize: number;
    inputPaddingH: number;
    inputPaddingV: number;
    inputIconSize: number;
    inputMinHeight: number;
    // Options
    optionPadding: number;
    optionRadius: number;
    optionIconSize: number;
    optionTextSize: number;
    optionPriceSize: number;
    // Dirección
    direccionPadding: number;
    direccionRadius: number;
    direccionLabelSize: number;
    direccionTextSize: number;
    direccionBadgeSize: number;
    // Info envío
    infoEnvioPadding: number;
    infoEnvioRadius: number;
    infoEnvioTextSize: number;
    infoEnvioIconSize: number;
    // Efectivo
    efectivoPadding: number;
    efectivoRadius: number;
    efectivoTitleSize: number;
    efectivoSubtitleSize: number;
    efectivoInputSize: number;
    efectivoInputPaddingV: number;
    // Vuelto
    vueltoPadding: number;
    vueltoRadius: number;
    vueltoLabelSize: number;
    vueltoMontoSize: number;
    vueltoIconSize: number;
    // Resumen
    resumenTextSize: number;
    resumenValorSize: number;
    totalTextSize: number;
    totalPriceSize: number;
    // Botón confirmar
    botonPaddingV: number;
    botonRadius: number;
    botonTextSize: number;
    botonIconSize: number;
    // Productos
    productoTextSize: number;
    productoPrecioSize: number;
    // Modal éxito
    modalPadding: number;
    modalRadius: number;
    modalIconSize: number;
    modalTitleSize: number;
    modalTextSize: number;
    modalSubtextSize: number;
    modalDotSize: number;
    // Modal transferencia
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
    // Beneficios
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
    const headerBottomPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 8 : 10;
    const tituloSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 17 : 20;
    const backIconSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 20 : 22;
    const backButtonSize = isSmallPhone ? 36 : 40;

    const seccionTituloSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
    const seccionMarginTop = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;

    const inputSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 13 : 13.5;
    const inputPaddingH = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const inputPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const inputIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
    const inputMinHeight = isDesktop ? 56 : isTablet ? 54 : isSmallPhone ? 48 : 50;

    const optionPadding = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
    const optionRadius = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
    const optionIconSize = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 20 : 22;
    const optionTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 12 : 14;
    const optionPriceSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;

    const direccionPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
    const direccionRadius = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const direccionLabelSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
    const direccionTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
    const direccionBadgeSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;

    const infoEnvioPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
    const infoEnvioRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
    const infoEnvioTextSize = isDesktop ? 13 : isTablet ? 13 : isSmallPhone ? 11 : 12;
    const infoEnvioIconSize = isDesktop ? 18 : isTablet ? 18 : isSmallPhone ? 16 : 17;

    const efectivoPadding = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 13;
    const efectivoRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
    const efectivoTitleSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 13 : 13;
    const efectivoSubtitleSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 11 : 11;
    const efectivoInputSize = isDesktop ? 17 : isTablet ? 17 : isSmallPhone ? 15 : 16;
    const efectivoInputPaddingV = isDesktop ? 10 : isTablet ? 10 : isSmallPhone ? 8 : 9;

    const vueltoPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 11;
    const vueltoRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
    const vueltoLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 12 : 12;
    const vueltoMontoSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 17 : 18;
    const vueltoIconSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 20 : 21;

    const resumenTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const resumenValorSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const totalTextSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 15 : 16;
    const totalPriceSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;

    const botonPaddingV = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 13 : 15;
    const botonRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
    const botonTextSize = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 15;
    const botonIconSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 20 : 22;

    const productoTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
    const productoPrecioSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 13 : 14;

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
    const beneficiosRadius = isSmallPhone ? 10 : 12;
    const beneficiosIconSize = isSmallPhone ? 32 : 36;
    const beneficiosEmojiSize = isSmallPhone ? 16 : 18;
    const beneficiosTitleSize = isSmallPhone ? 13 : 14;
    const beneficiosDescSize = isSmallPhone ? 11 : 12;
    const beneficioTagTextSize = isSmallPhone ? 11 : 12;
    const beneficioTagIconSize = isSmallPhone ? 12 : 14;
    const beneficioTagPaddingH = isSmallPhone ? 6 : 8;
    const beneficioTagPaddingV = isSmallPhone ? 3 : 4;
    const beneficioTagRadius = isSmallPhone ? 10 : 12;

    return {
        paddingHorizontal,
        headerTopPadding,
        headerBottomPadding,
        tituloSize,
        backIconSize,
        backButtonSize,
        seccionTituloSize,
        seccionMarginTop,
        inputSize,
        inputPaddingH,
        inputPaddingV,
        inputIconSize,
        inputMinHeight,
        optionPadding,
        optionRadius,
        optionIconSize,
        optionTextSize,
        optionPriceSize,
        direccionPadding,
        direccionRadius,
        direccionLabelSize,
        direccionTextSize,
        direccionBadgeSize,
        infoEnvioPadding,
        infoEnvioRadius,
        infoEnvioTextSize,
        infoEnvioIconSize,
        efectivoPadding,
        efectivoRadius,
        efectivoTitleSize,
        efectivoSubtitleSize,
        efectivoInputSize,
        efectivoInputPaddingV,
        vueltoPadding,
        vueltoRadius,
        vueltoLabelSize,
        vueltoMontoSize,
        vueltoIconSize,
        resumenTextSize,
        resumenValorSize,
        totalTextSize,
        totalPriceSize,
        botonPaddingV,
        botonRadius,
        botonTextSize,
        botonIconSize,
        productoTextSize,
        productoPrecioSize,
        modalPadding,
        modalRadius,
        modalIconSize,
        modalTitleSize,
        modalTextSize,
        modalSubtextSize,
        modalDotSize,
        transModalWidth,
        transModalRadius,
        transModalHeaderPaddingV,
        transModalHeaderIconSize,
        transModalHeaderTitleSize,
        transModalBodyPadding,
        transModalMensajeSize,
        transModalAliasPadding,
        transModalAliasLabelSize,
        transModalAliasTextoSize,
        transModalCbuPadding,
        transModalCbuLabelSize,
        transModalCbuTextoSize,
        transModalMontoPadding,
        transModalMontoLabelSize,
        transModalMontoTextoSize,
        transModalPedidoIdSize,
        transModalBotonPaddingV,
        transModalBotonRadius,
        transModalBotonTextSize,
        transModalBotonIconSize,
        transModalFooterSize,
        beneficiosPadding,
        beneficiosRadius,
        beneficiosIconSize,
        beneficiosEmojiSize,
        beneficiosTitleSize,
        beneficiosDescSize,
        beneficioTagTextSize,
        beneficioTagIconSize,
        beneficioTagPaddingH,
        beneficioTagPaddingV,
        beneficioTagRadius,
    };
};

// ============================================================
// 📌 CONSTANTES
// ============================================================
const ALIAS_TRANSFERENCIA = 'krustyburger2025';
const CUENTA_TRANSFERENCIA = 'CBU: 0000003100088376133432';

type ModoDireccion = 'vista' | 'texto' | 'formulario';

// ============================================================
// ✅ HELPERS
// ============================================================
const asegurarPermisosUbicacion = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return true;
        const { status: nuevoStatus } = await Location.requestForegroundPermissionsAsync();
        if (nuevoStatus === 'granted') return true;
        console.warn('❌ [Checkout] Permisos de ubicación rechazados');
        return false;
    } catch (error) {
        console.error('❌ [Checkout] Error pidiendo permisos:', error);
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
        console.error('❌ [Checkout] Error geocodificando:', error);
        return null;
    }
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaCheckout(props: any) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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
    const [pedidoCreadoId, setPedidoCreadoId] = useState<number | null>(null);
    const [guardandoPerfil, setGuardandoPerfil] = useState(false);
    const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

    const [montoConQuePaga, setMontoConQuePaga] = useState<string>('');
    const [vueltoCalculado, setVueltoCalculado] = useState<number>(0);
    const [mostrarVuelto, setMostrarVuelto] = useState(false);

    const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
    const [pedidoIdTransferencia, setPedidoIdTransferencia] = useState<number | null>(null);

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
    const [buscandoDireccion, setBuscandoDireccion] = useState(false);
    const [direccionSugerida, setDireccionSugerida] = useState('');
    const [busquedaManual, setBusquedaManual] = useState('');

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
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const dot1Anim = useRef(new Animated.Value(0)).current;
    const dot2Anim = useRef(new Animated.Value(0)).current;
    const dot3Anim = useRef(new Animated.Value(0)).current;

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

    // ============================================================
    // GUARD DE SESIÓN
    // ============================================================
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
        if (!sesion) return;
        cargarDatosPerfil();
        servicioEnvios.inicializar();

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
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

    const guardarDireccionEnStore = async (ubicacion: { latitude: number; longitude: number }) => {
        try {
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(
                ubicacion.latitude,
                ubicacion.longitude,
            );
            const ubicacionCompleta: UbicacionGuardada = {
                latitude: ubicacion.latitude,
                longitude: ubicacion.longitude,
                direccion: direccionObtenida || `${ubicacion.latitude}, ${ubicacion.longitude}`,
                seleccionadaPorUsuario: true,
            };
            await guardarUbicacionTemporal(ubicacionCompleta);
        } catch (error) {
            console.error('Error guardando dirección:', error);
        }
    };

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
            console.error('❌ Error cargando ubicación guardada:', error);
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
            console.error('❌ Error actualizando perfil:', error);
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
            console.error('❌ [Checkout] Error calculando envío:', error);
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
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
        }
    };

    const buscarDireccionManual = async () => {
        if (busquedaManual.length < 3) {
            toast.advertencia('Dirección muy corta - Ingresa al menos 3 caracteres');
            return;
        }
        setBuscandoDireccion(true);
        setDireccionSugerida('');
        try {
            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) {
                toast.advertencia('Necesitamos permiso de ubicación');
                return;
            }
            const resultados = await Location.geocodeAsync(busquedaManual);
            if (resultados && resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                setUbicacionSeleccionada({ latitude, longitude });
                const direccionFormateada = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
                if (direccionFormateada) {
                    setDireccionSugerida(direccionFormateada);
                    setDireccionCompleta(direccionFormateada);
                    setDireccion(direccionFormateada);
                    setDireccionDelPerfil(false);
                    await guardarUbicacionTemporal({ latitude, longitude, direccion: direccionFormateada });
                }
                setMostrarMapa(true);
            } else {
                toast.error('No se pudo encontrar la dirección ingresada');
            }
        } catch {
            toast.error('No se pudo buscar la dirección');
        } finally {
            setBuscandoDireccion(false);
        }
    };

    // ============================================================
    // EDICIÓN DE DIRECCIÓN
    // ============================================================
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
            console.error('❌ [Checkout] Error verificando dirección:', error);
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
            console.error('❌ [Checkout] Error aplicando dirección manual:', error);
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
        if (ubicacionSeleccionada) await guardarDireccionEnStore(ubicacionSeleccionada);
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

    const copiarAlias = async () => {
        await Clipboard.setStringAsync(ALIAS_TRANSFERENCIA);
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
        if (!direccion && tipoEntrega === 'domicilio') {
            toast.advertencia('Ingresa una dirección de entrega');
            return;
        }
        if (!telefono) {
            toast.advertencia('Ingresa un número de teléfono');
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
            .catch((err) => console.warn('⚠️ Error notificando admins (no crítico):', err));

        if (cuponAplicado?.id && perfil?.id) {
            const resultadoCupon = await cuponService.finalizarCuponPedido(cuponAplicado.id, perfil.id, pedidoId);
            if (!resultadoCupon.success) {
                toast.advertencia(
                    `El pedido #${pedidoId} fue creado, pero el cupón no pudo aplicarse: ${resultadoCupon.mensaje}`,
                );
            }
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
            } catch (error) {
                console.error('❌ Error marcando canje como usado:', error);
            }
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
        setTimeout(() => {
            setMostrarModalExito(false);
            props.navigation.replace('Seguimiento', { pedidoId });
        }, 2500);
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
        { id: 'transferencia', label: 'Transferencia', icono: 'swap-horizontal-outline' },
    ];

    const tiposEntrega = [
        {
            id: 'domicilio',
            label: 'Delivery',
            icono: 'home-outline',
            costo: envioGratisAplicado ? 0 : envioDisponible && costoEnvioCalculado > 0 ? costoEnvioCalculado : 0,
        },
        { id: 'retiro', label: 'Retiro en local', icono: 'storefront-outline', costo: 0 },
    ];

    const renderLoaderDots = () => {
        const dots = [
            { anim: dot1Anim },
            { anim: dot2Anim },
            { anim: dot3Anim },
        ];
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
                        backgroundColor: DISENO.colors.accent,
                        opacity,
                        transform: [{ scale }],
                    }}
                />
            );
        });
    };

    // ============================================================
    // RENDER TEMPRANO
    // ============================================================
    if (cargandoAuth || !sesion) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text
                    style={{
                        fontFamily: FUENTES.display,
                        marginTop: 16,
                        color: DISENO.colors.textSecondary,
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
        <View style={styles.container}>
            <LinearGradient
                colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* HEADER */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + tamanos.headerTopPadding,
                        paddingHorizontal: tamanos.paddingHorizontal,
                        paddingBottom: tamanos.headerBottomPadding,
                    },
                ]}
            >
                <TouchableOpacity style={styles.backButton} onPress={handleVolverAlCarrito} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={tamanos.backIconSize} color={DISENO.colors.text} />
                </TouchableOpacity>
                <Text
                    style={[styles.title, { fontSize: tamanos.tituloSize, color: DISENO.colors.text }]}
                    allowFontScaling={false}
                    numberOfLines={1}
                >
                    Confirmar Pedido
                </Text>
                <View style={{ width: tamanos.backIconSize }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingHorizontal: tamanos.paddingHorizontal,
                        paddingBottom: insets.bottom + 100,
                        paddingTop: tamanos.seccionMarginTop,
                    },
                ]}
            >
                {/* BENEFICIOS */}
                {perfil && beneficios && (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginBottom: 12,
                        }}
                    >
                        <View
                            style={{
                                padding: tamanos.beneficiosPadding,
                                borderRadius: tamanos.beneficiosRadius,
                                backgroundColor: DISENO.colors.surface,
                                borderWidth: 1,
                                borderColor: DISENO.colors.accentSecondary + '30',
                                ...DISENO.shadow.sm,
                            }}
                        >
                            <View style={styles.beneficiosHeader}>
                                <View
                                    style={{
                                        width: tamanos.beneficiosIconSize,
                                        height: tamanos.beneficiosIconSize,
                                        borderRadius: tamanos.beneficiosIconSize / 2,
                                        backgroundColor: DISENO.colors.accentSecondary + '15',
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
                                            color: DISENO.colors.accentSecondary,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {nivel?.nombre || 'Cliente'} {beneficios.descuento > 0 && `• ${beneficios.descuento}% OFF`}
                                    </Text>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.beneficiosDescSize,
                                            color: DISENO.colors.textSecondary,
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

                            <View style={styles.beneficiosList}>
                                {beneficios.descuento > 0 && (
                                    <View
                                        style={[
                                            styles.beneficioTag,
                                            {
                                                paddingHorizontal: tamanos.beneficioTagPaddingH,
                                                paddingVertical: tamanos.beneficioTagPaddingV,
                                                borderRadius: tamanos.beneficioTagRadius,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="pricetag-outline"
                                            size={tamanos.beneficioTagIconSize}
                                            color={DISENO.colors.accent}
                                        />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.beneficioTagTextSize,
                                                color: DISENO.colors.textSecondary,
                                                fontWeight: '500',
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {beneficios.descuento}% de descuento
                                        </Text>
                                    </View>
                                )}
                                {beneficios.envioGratis && (
                                    <View
                                        style={[
                                            styles.beneficioTag,
                                            {
                                                paddingHorizontal: tamanos.beneficioTagPaddingH,
                                                paddingVertical: tamanos.beneficioTagPaddingV,
                                                borderRadius: tamanos.beneficioTagRadius,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="bicycle-outline"
                                            size={tamanos.beneficioTagIconSize}
                                            color={DISENO.colors.success}
                                        />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.beneficioTagTextSize,
                                                color: DISENO.colors.textSecondary,
                                                fontWeight: '500',
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
                    </Animated.View>
                )}

                {cargandoUbicacion && (
                    <View style={styles.loadingUbicacion}>
                        <ActivityIndicator size="small" color={DISENO.colors.accent} />
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: 13,
                                color: DISENO.colors.textSecondary,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Cargando ubicación...
                        </Text>
                    </View>
                )}

                {/* TELÉFONO */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        📞 Datos de contacto
                    </Text>
                    <View
                        style={[
                            styles.inputContainer,
                            {
                                backgroundColor: DISENO.colors.surface,
                                borderColor: DISENO.colors.border,
                                minHeight: tamanos.inputMinHeight,
                                paddingHorizontal: tamanos.inputPaddingH,
                            },
                        ]}
                    >
                        <Ionicons
                            name="call-outline"
                            size={tamanos.inputIconSize}
                            color={DISENO.colors.accent}
                            style={{ marginRight: 10 }}
                        />
                        <TextInput
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.inputSize,
                                color: DISENO.colors.text,
                                flex: 1,
                                paddingVertical: tamanos.inputPaddingV,
                                includeFontPadding: false,
                                textAlignVertical: 'center',
                            }}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Teléfono"
                            placeholderTextColor={DISENO.colors.textTertiary}
                            keyboardType="phone-pad"
                            selectionColor={DISENO.colors.accent}
                            allowFontScaling={false}
                        />
                    </View>
                    {perfil?.telefono && (
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: 11,
                                color: DISENO.colors.success,
                                marginTop: 4,
                                opacity: 0.7,
                                fontStyle: 'italic',
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            📌 Cargado desde tu perfil
                        </Text>
                    )}
                </Animated.View>

                {guardandoPerfil && (
                    <View
                        style={{
                            backgroundColor: DISENO.colors.accentSecondary + '15',
                            borderColor: DISENO.colors.accentSecondary + '20',
                            borderWidth: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            marginBottom: 12,
                            gap: 10,
                        }}
                    >
                        <ActivityIndicator size="small" color={DISENO.colors.accentSecondary} />
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: 13,
                                color: DISENO.colors.accentSecondary,
                                fontWeight: '500',
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Guardando en tu perfil...
                        </Text>
                    </View>
                )}

                {/* TIPO ENTREGA */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        🚚 Tipo de entrega
                    </Text>
                    <View style={{ gap: isTablet ? 12 : 8 }}>
                        {tiposEntrega.map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                style={{
                                    padding: tamanos.optionPadding,
                                    borderRadius: tamanos.optionRadius,
                                    backgroundColor:
                                        tipoEntrega === t.id ? DISENO.colors.accentSecondary : DISENO.colors.surface,
                                    borderColor:
                                        tipoEntrega === t.id ? DISENO.colors.accentSecondary : DISENO.colors.border,
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                                onPress={() => setTipoEntrega(t.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={t.icono as any}
                                    size={tamanos.optionIconSize}
                                    color={tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary}
                                />
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.optionTextSize,
                                        color: tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                        fontWeight: '600',
                                        flex: 1,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {t.label}
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.optionPriceSize,
                                        color: tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {t.costo === 0 ? 'GRATIS' : formatearPrecio(t.costo)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* DIRECCIÓN */}
                {tipoEntrega === 'domicilio' && (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginTop: tamanos.seccionMarginTop,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: tamanos.seccionTituloSize,
                                color: DISENO.colors.text,
                                marginBottom: 10,
                                letterSpacing: 0.5,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            📍 Dirección de entrega
                        </Text>

                        {/* MODO VISTA */}
                        {modoDireccion === 'vista' && (
                            <>
                                <View
                                    style={{
                                        padding: tamanos.direccionPadding,
                                        borderRadius: tamanos.direccionRadius,
                                        backgroundColor: direccionDelPerfil
                                            ? DISENO.colors.success + '15'
                                            : DISENO.colors.surface,
                                        borderColor: direccionDelPerfil
                                            ? DISENO.colors.success + '30'
                                            : DISENO.colors.border,
                                        borderWidth: 1,
                                        marginBottom: 12,
                                    }}
                                >
                                    <View style={styles.direccionPerfilHeader}>
                                        <Ionicons
                                            name={direccionDelPerfil ? 'checkmark-circle' : 'location-outline'}
                                            size={tamanos.direccionBadgeSize + 4}
                                            color={direccionDelPerfil ? DISENO.colors.success : DISENO.colors.accent}
                                        />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.direccionLabelSize,
                                                color: direccionDelPerfil ? DISENO.colors.success : DISENO.colors.accent,
                                                fontWeight: '600',
                                                opacity: 0.8,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {direccionDelPerfil ? 'Dirección de tu perfil' : 'Dirección personalizada'}
                                        </Text>
                                        {ubicacionSeleccionada && !direccionDelPerfil && (
                                            <View
                                                style={{
                                                    backgroundColor: DISENO.colors.success + '15',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 6,
                                                    paddingVertical: 2,
                                                    borderRadius: 10,
                                                    gap: 3,
                                                    marginLeft: 6,
                                                }}
                                            >
                                                <Ionicons name="checkmark-circle" size={tamanos.direccionBadgeSize - 1} color={DISENO.colors.success} />
                                                <Text
                                                    style={{
                                                        fontFamily: FUENTES.regular,
                                                        fontSize: tamanos.direccionBadgeSize - 2,
                                                        color: DISENO.colors.success,
                                                        fontWeight: '500',
                                                        includeFontPadding: false,
                                                    }}
                                                    allowFontScaling={false}
                                                >
                                                    Confirmada
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.direccionTextSize,
                                            color: DISENO.colors.text,
                                            fontWeight: '500',
                                            lineHeight: 20,
                                            includeFontPadding: false,
                                            marginTop: 4,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {direccion || 'No hay dirección cargada'}
                                    </Text>

                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        <TouchableOpacity
                                            onPress={abrirEdicionDireccion}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                paddingVertical: 8,
                                                paddingHorizontal: 14,
                                                borderRadius: 10,
                                                backgroundColor: DISENO.colors.accent + '15',
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="pencil" size={14} color={DISENO.colors.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: 12,
                                                    fontWeight: '600',
                                                    color: DISENO.colors.accent,
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
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                paddingVertical: 8,
                                                paddingHorizontal: 14,
                                                borderRadius: 10,
                                                backgroundColor: DISENO.colors.info + '15',
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="map" size={14} color={DISENO.colors.info} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: 12,
                                                    fontWeight: '600',
                                                    color: DISENO.colors.info,
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Mapa
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* INFO ENVÍO */}
                                {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View
                                        style={[
                                            styles.infoEnvioContainer,
                                            {
                                                backgroundColor: DISENO.colors.surface,
                                                borderColor: DISENO.colors.border,
                                                padding: tamanos.infoEnvioPadding,
                                                borderRadius: tamanos.infoEnvioRadius,
                                            },
                                        ]}
                                    >
                                        <View style={styles.infoEnvioFila}>
                                            <Ionicons name="navigate" size={tamanos.infoEnvioIconSize} color={DISENO.colors.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.infoEnvioTextSize,
                                                    color: DISENO.colors.textSecondary,
                                                    fontWeight: '500',
                                                    includeFontPadding: false,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                📏 Distancia: {distanciaFormateada || 'Calculando...'}
                                            </Text>
                                        </View>
                                        {envioDisponible ? (
                                            <>
                                                <View style={styles.infoEnvioFila}>
                                                    <Ionicons name="cash" size={tamanos.infoEnvioIconSize} color={DISENO.colors.success} />
                                                    <Text
                                                        style={{
                                                            fontFamily: FUENTES.regular,
                                                            fontSize: tamanos.infoEnvioTextSize,
                                                            color: DISENO.colors.success,
                                                            fontWeight: '500',
                                                            includeFontPadding: false,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        💰 Costo de envío: {envioGratisAplicado ? 'GRATIS' : formatearPrecio(costoEnvioCalculado)}
                                                    </Text>
                                                </View>
                                                <View style={styles.infoEnvioFila}>
                                                    <Ionicons name="time-outline" size={tamanos.infoEnvioIconSize} color={DISENO.colors.accent} />
                                                    <Text
                                                        style={{
                                                            fontFamily: FUENTES.regular,
                                                            fontSize: tamanos.infoEnvioTextSize,
                                                            color: DISENO.colors.accent,
                                                            fontWeight: '500',
                                                            includeFontPadding: false,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        ⏱️ Tiempo estimado: {tiempoEstimado} min
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.infoEnvioFila}>
                                                <Ionicons name="warning" size={tamanos.infoEnvioIconSize} color={DISENO.colors.accent} />
                                                <Text
                                                    style={{
                                                        fontFamily: FUENTES.regular,
                                                        fontSize: tamanos.infoEnvioTextSize,
                                                        color: DISENO.colors.accent,
                                                        fontWeight: '500',
                                                        includeFontPadding: false,
                                                    }}
                                                    allowFontScaling={false}
                                                >
                                                    ⚠️ {mensajeEnvio}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View
                                        style={[
                                            styles.infoEnvioContainer,
                                            {
                                                backgroundColor: DISENO.colors.surface,
                                                borderColor: DISENO.colors.border,
                                                padding: tamanos.infoEnvioPadding,
                                                borderRadius: tamanos.infoEnvioRadius,
                                            },
                                        ]}
                                    >
                                        <View style={styles.infoEnvioFila}>
                                            <ActivityIndicator size="small" color={DISENO.colors.accent} />
                                            <Text
                                                style={{
                                                    fontFamily: FUENTES.regular,
                                                    fontSize: tamanos.infoEnvioTextSize,
                                                    color: DISENO.colors.textSecondary,
                                                    fontWeight: '500',
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

                        {/* MODO TEXTO */}
                        {modoDireccion === 'texto' && (
                            <View
                                style={{
                                    padding: tamanos.direccionPadding,
                                    borderRadius: tamanos.direccionRadius,
                                    backgroundColor: DISENO.colors.surface,
                                    borderColor: DISENO.colors.accent + '40',
                                    borderWidth: 1,
                                    marginBottom: 12,
                                }}
                            >
                                <View style={styles.direccionPerfilHeader}>
                                    <Ionicons name="pencil" size={tamanos.direccionBadgeSize + 6} color={DISENO.colors.accent} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.direccionLabelSize + 1,
                                            color: DISENO.colors.accent,
                                            fontWeight: '600',
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Editar dirección
                                    </Text>
                                </View>

                                <TextInput
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.inputSize,
                                        color: DISENO.colors.text,
                                        backgroundColor: DISENO.colors.surfaceHover,
                                        borderColor: DISENO.colors.border,
                                        borderWidth: 1,
                                        borderRadius: 12,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        marginTop: 8,
                                        includeFontPadding: false,
                                        textAlignVertical: 'top',
                                    }}
                                    value={direccionInput}
                                    onChangeText={setDireccionInput}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    selectionColor={DISENO.colors.accent}
                                    autoFocus
                                    multiline
                                    allowFontScaling={false}
                                />

                                {errorDireccion && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                        <Ionicons name="alert-circle" size={14} color={DISENO.colors.accent} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                color: DISENO.colors.accent,
                                                flex: 1,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {errorDireccion}
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                    <TouchableOpacity
                                        onPress={verificarDireccionTexto}
                                        disabled={verificandoDireccion}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 16,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.accentSecondary,
                                            opacity: verificandoDireccion ? 0.6 : 1,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        {verificandoDireccion ? (
                                            <ActivityIndicator size="small" color={DISENO.colors.text} />
                                        ) : (
                                            <Ionicons name="search" size={16} color={DISENO.colors.text} />
                                        )}
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 13,
                                                fontWeight: '600',
                                                color: DISENO.colors.text,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {verificandoDireccion ? 'Verificando...' : 'Verificar'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={async () => {
                                            const tienePermiso = await asegurarPermisosUbicacion();
                                            if (!tienePermiso) {
                                                toast.advertencia('Necesitamos permiso de ubicación');
                                                return;
                                            }
                                            setMostrarMapa(true);
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.info + '15',
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="map" size={14} color={DISENO.colors.info} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: DISENO.colors.info,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Mapa
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={cancelarEdicionDireccion}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={14} color={DISENO.colors.textSecondary} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: DISENO.colors.textSecondary,
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

                        {/* MODO FORMULARIO */}
                        {modoDireccion === 'formulario' && (
                            <View
                                style={{
                                    padding: tamanos.direccionPadding,
                                    borderRadius: tamanos.direccionRadius,
                                    backgroundColor: DISENO.colors.surface,
                                    borderColor: DISENO.colors.accent + '40',
                                    borderWidth: 1,
                                    marginBottom: 12,
                                }}
                            >
                                <View style={styles.direccionPerfilHeader}>
                                    <Ionicons
                                        name="warning"
                                        size={tamanos.direccionBadgeSize + 6}
                                        color={DISENO.colors.accent}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.direccionLabelSize + 1,
                                            color: DISENO.colors.accent,
                                            fontWeight: '600',
                                            flex: 1,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {errorDireccion || 'Completá la dirección manualmente'}
                                    </Text>
                                </View>

                                {/* Calle */}
                                <View style={{ marginTop: 10 }}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            fontWeight: '500',
                                            color: DISENO.colors.textSecondary,
                                            marginBottom: 4,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Calle *
                                    </Text>
                                    <TextInput
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                            borderWidth: 1,
                                            borderRadius: 12,
                                            paddingHorizontal: 14,
                                            paddingVertical: 12,
                                            includeFontPadding: false,
                                        }}
                                        value={camposManuales.calle}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, calle: t }))}
                                        placeholder="Ej: Av. Corrientes"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        selectionColor={DISENO.colors.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                {/* Número */}
                                <View style={{ marginTop: 8 }}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            fontWeight: '500',
                                            color: DISENO.colors.textSecondary,
                                            marginBottom: 4,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Número *
                                    </Text>
                                    <TextInput
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                            borderWidth: 1,
                                            borderRadius: 12,
                                            paddingHorizontal: 14,
                                            paddingVertical: 12,
                                            includeFontPadding: false,
                                        }}
                                        value={camposManuales.numero}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, numero: t }))}
                                        placeholder="Ej: 1234"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        keyboardType="number-pad"
                                        selectionColor={DISENO.colors.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                {/* Piso + Depto */}
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 11,
                                                fontWeight: '500',
                                                color: DISENO.colors.textSecondary,
                                                marginBottom: 4,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Piso
                                        </Text>
                                        <TextInput
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 12,
                                                includeFontPadding: false,
                                            }}
                                            value={camposManuales.piso}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, piso: t }))}
                                            placeholder="3"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 11,
                                                fontWeight: '500',
                                                color: DISENO.colors.textSecondary,
                                                marginBottom: 4,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Depto
                                        </Text>
                                        <TextInput
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 12,
                                                includeFontPadding: false,
                                            }}
                                            value={camposManuales.departamento}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, departamento: t }))}
                                            placeholder="A"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                </View>

                                {/* Barrio */}
                                <View style={{ marginTop: 8 }}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            fontWeight: '500',
                                            color: DISENO.colors.textSecondary,
                                            marginBottom: 4,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Barrio
                                    </Text>
                                    <TextInput
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                            borderWidth: 1,
                                            borderRadius: 12,
                                            paddingHorizontal: 14,
                                            paddingVertical: 12,
                                            includeFontPadding: false,
                                        }}
                                        value={camposManuales.barrio}
                                        onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, barrio: t }))}
                                        placeholder="Ej: San Nicolás"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        selectionColor={DISENO.colors.accent}
                                        allowFontScaling={false}
                                    />
                                </View>

                                {/* Ciudad + CP */}
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <View style={{ flex: 2 }}>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 11,
                                                fontWeight: '500',
                                                color: DISENO.colors.textSecondary,
                                                marginBottom: 4,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Ciudad
                                        </Text>
                                        <TextInput
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 12,
                                                includeFontPadding: false,
                                            }}
                                            value={camposManuales.ciudad}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, ciudad: t }))}
                                            placeholder="CABA"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 11,
                                                fontWeight: '500',
                                                color: DISENO.colors.textSecondary,
                                                marginBottom: 4,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            CP
                                        </Text>
                                        <TextInput
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 14,
                                                paddingVertical: 12,
                                                includeFontPadding: false,
                                            }}
                                            value={camposManuales.codigoPostal}
                                            onChangeText={(t) => setCamposManuales((prev) => ({ ...prev, codigoPostal: t }))}
                                            placeholder="1043"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            keyboardType="number-pad"
                                            selectionColor={DISENO.colors.accent}
                                            allowFontScaling={false}
                                        />
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                                    <TouchableOpacity
                                        onPress={aplicarDireccionManual}
                                        disabled={verificandoDireccion}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 16,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.accentSecondary,
                                            opacity: verificandoDireccion ? 0.6 : 1,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        {verificandoDireccion ? (
                                            <ActivityIndicator size="small" color={DISENO.colors.text} />
                                        ) : (
                                            <Ionicons name="checkmark-circle" size={16} color={DISENO.colors.text} />
                                        )}
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 13,
                                                fontWeight: '600',
                                                color: DISENO.colors.text,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {verificandoDireccion ? 'Verificando...' : 'Confirmar dirección'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setMostrarMapa(true)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.info + '15',
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="map" size={14} color={DISENO.colors.info} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: DISENO.colors.info,
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Usar mapa
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={volverAlModoTexto}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            paddingVertical: 10,
                                            paddingHorizontal: 14,
                                            borderRadius: 10,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="arrow-back" size={14} color={DISENO.colors.textSecondary} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: DISENO.colors.textSecondary,
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

                <MapaSelector
                    visible={mostrarMapa}
                    onClose={() => setMostrarMapa(false)}
                    onConfirmar={handleConfirmarUbicacion}
                    ubicacionInicial={ubicacionSeleccionada || undefined}
                    direccionInicial={direccion}
                    titulo="📍 Selecciona tu ubicación"
                />

                {/* MÉTODO PAGO */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        💳 Método de pago
                    </Text>
                    <View style={{ flexDirection: 'row', gap: isTablet ? 12 : 8 }}>
                        {metodosPago.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={{
                                    flex: 1,
                                    padding: tamanos.optionPadding,
                                    borderRadius: tamanos.optionRadius,
                                    backgroundColor:
                                        metodoPago === m.id ? DISENO.colors.accentSecondary : DISENO.colors.surface,
                                    borderColor:
                                        metodoPago === m.id ? DISENO.colors.accentSecondary : DISENO.colors.border,
                                    borderWidth: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                                onPress={() => {
                                    setMetodoPago(m.id);
                                    if (m.id !== 'efectivo') {
                                        setMontoConQuePaga('');
                                        setVueltoCalculado(0);
                                        setMostrarVuelto(false);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={m.icono as any}
                                    size={tamanos.optionIconSize}
                                    color={metodoPago === m.id ? DISENO.colors.text : DISENO.colors.textSecondary}
                                />
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.optionTextSize,
                                        color: metodoPago === m.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                        fontWeight: '600',
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    {m.label}
                                </Text>
                                {metodoPago === m.id && (
                                    <Ionicons name="checkmark-circle" size={16} color={DISENO.colors.text} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* EFECTIVO */}
                    {metodoPago === 'efectivo' && (
                        <View
                            style={{
                                marginTop: 12,
                                padding: tamanos.efectivoPadding,
                                borderRadius: tamanos.efectivoRadius,
                                backgroundColor: DISENO.colors.surface,
                                borderWidth: 1,
                                borderColor: DISENO.colors.accentSecondary + '30',
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.efectivoTitleSize,
                                    color: DISENO.colors.text,
                                    marginBottom: 8,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                💰 Pago en efectivo
                            </Text>

                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.efectivoSubtitleSize,
                                    color: DISENO.colors.textSecondary,
                                    marginBottom: 6,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Total a pagar:{' '}
                                <Text style={{ fontWeight: 'bold', color: DISENO.colors.accentSecondary }}>
                                    {formatearPrecio(totalFinal)}
                                </Text>
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: DISENO.colors.surfaceHover,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: DISENO.colors.border,
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    marginTop: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.efectivoInputSize,
                                        color: DISENO.colors.textSecondary,
                                        marginRight: 4,
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
                                        color: DISENO.colors.text,
                                        paddingVertical: tamanos.efectivoInputPaddingV,
                                        fontFamily: FUENTES.display,
                                        includeFontPadding: false,
                                    }}
                                    value={montoConQuePaga}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9.]/g, '');
                                        setMontoConQuePaga(cleaned);
                                        calcularVuelto(cleaned);
                                    }}
                                    placeholder="0.00"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    keyboardType="decimal-pad"
                                    selectionColor={DISENO.colors.accent}
                                    allowFontScaling={false}
                                />
                            </View>

                            {mostrarVuelto && vueltoCalculado > 0 && (
                                <View
                                    style={{
                                        marginTop: 10,
                                        padding: tamanos.vueltoPadding,
                                        borderRadius: tamanos.vueltoRadius,
                                        backgroundColor: DISENO.colors.success + '15',
                                        borderWidth: 1,
                                        borderColor: DISENO.colors.success + '30',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="cash-outline" size={tamanos.vueltoIconSize} color={DISENO.colors.success} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: tamanos.vueltoLabelSize,
                                                color: DISENO.colors.text,
                                                fontWeight: '500',
                                                includeFontPadding: false,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            💵 Vuelto:
                                        </Text>
                                    </View>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.vueltoMontoSize,
                                            color: DISENO.colors.success,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {formatearPrecio(vueltoCalculado)}
                                    </Text>
                                </View>
                            )}

                            {montoConQuePaga && !mostrarVuelto && parseFloat(montoConQuePaga) > 0 && (
                                <View
                                    style={{
                                        marginTop: 8,
                                        padding: 8,
                                        borderRadius: 8,
                                        backgroundColor: DISENO.colors.accent + '15',
                                        borderWidth: 1,
                                        borderColor: DISENO.colors.accent + '30',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <Ionicons name="warning" size={14} color={DISENO.colors.accent} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            color: DISENO.colors.accent,
                                            fontWeight: '500',
                                            flex: 1,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        El monto es insuficiente. El total es {formatearPrecio(totalFinal)}
                                    </Text>
                                </View>
                            )}

                            {(!montoConQuePaga || (montoConQuePaga && !mostrarVuelto)) && (
                                <TouchableOpacity
                                    style={{
                                        marginTop: 8,
                                        padding: 8,
                                        borderRadius: 8,
                                        backgroundColor: DISENO.colors.accentSecondary + '15',
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
                                            fontFamily: FUENTES.regular,
                                            fontSize: 11,
                                            color: DISENO.colors.accentSecondary,
                                            fontWeight: '500',
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

                {/* NOTAS */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        📝 Notas (opcional)
                    </Text>
                    <View
                        style={[
                            styles.inputContainer,
                            {
                                backgroundColor: DISENO.colors.surface,
                                borderColor: DISENO.colors.border,
                                paddingHorizontal: tamanos.inputPaddingH,
                                alignItems: 'flex-start',
                                paddingVertical: 4,
                            },
                        ]}
                    >
                        <Ionicons
                            name="create-outline"
                            size={tamanos.inputIconSize}
                            color={DISENO.colors.accent}
                            style={{ marginRight: 12, marginTop: 12 }}
                        />
                        <TextInput
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.inputSize,
                                color: DISENO.colors.text,
                                flex: 1,
                                paddingVertical: 12,
                                minHeight: 70,
                                includeFontPadding: false,
                                textAlignVertical: 'top',
                            }}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Sin cebolla, extra queso..."
                            placeholderTextColor={DISENO.colors.textTertiary}
                            multiline
                            numberOfLines={2}
                            selectionColor={DISENO.colors.accent}
                            allowFontScaling={false}
                        />
                    </View>
                </Animated.View>

                {/* PRODUCTOS */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        🛒 Productos ({elementos.length})
                    </Text>
                    {elementos.map((e, i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 6,
                                borderBottomWidth: 1,
                                borderBottomColor: DISENO.colors.border,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.productoTextSize,
                                    color: DISENO.colors.textSecondary,
                                    fontWeight: '500',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {e.cantidad}x {e.producto.nombre}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.productoPrecioSize,
                                    color: DISENO.colors.accent,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {formatearPrecio(precioUnitario(e.producto.precio) * e.cantidad)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* RESUMEN */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FUENTES.display,
                            fontSize: tamanos.seccionTituloSize,
                            color: DISENO.colors.text,
                            marginBottom: 10,
                            letterSpacing: 0.5,
                            includeFontPadding: false,
                        }}
                        allowFontScaling={false}
                    >
                        📊 Resumen
                    </Text>
                    <View style={styles.resumenFila}>
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.resumenTextSize,
                                color: DISENO.colors.textSecondary,
                                opacity: 0.8,
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
                                color: DISENO.colors.text,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            {formatearPrecio(subtotal)}
                        </Text>
                    </View>

                    {beneficios && beneficios.descuento > 0 && descuentoNivelAplicado > 0 && (
                        <View
                            style={[
                                styles.resumenFila,
                                {
                                    backgroundColor: DISENO.colors.accent + '08',
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    marginTop: 2,
                                },
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="pricetag-outline" size={14} color={DISENO.colors.accent} />
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.resumenTextSize,
                                        color: DISENO.colors.accent,
                                        includeFontPadding: false,
                                    }}
                                    allowFontScaling={false}
                                >
                                    Descuento {nivel?.nombre} ({beneficios.descuento}%)
                                </Text>
                            </View>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.resumenValorSize,
                                    color: DISENO.colors.success,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                -{formatearPrecio(descuentoNivelAplicado)}
                            </Text>
                        </View>
                    )}

                    {descuentoPuntos > 0 && (
                        <View style={styles.resumenFila}>
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.resumenTextSize,
                                    color: DISENO.colors.success,
                                    opacity: 0.8,
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
                                    color: DISENO.colors.success,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                -{formatearPrecio(descuentoPuntos)}
                            </Text>
                        </View>
                    )}

                    {descuentoCuponUI > 0 && (
                        <View style={styles.resumenFila}>
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.resumenTextSize,
                                    color: DISENO.colors.success,
                                    opacity: 0.8,
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
                                    color: DISENO.colors.success,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                -{formatearPrecio(descuentoCuponUI)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.resumenFila}>
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.resumenTextSize,
                                color: DISENO.colors.textSecondary,
                                opacity: 0.8,
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
                                color: DISENO.colors.text,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            {tipoEntrega === 'retiro'
                                ? 'GRATIS'
                                : envioGratisAplicado
                                    ? 'GRATIS (beneficio)'
                                    : envioGratisCupon
                                        ? 'GRATIS (cupón)'
                                        : ubicacionSeleccionada
                                            ? envioDisponible
                                                ? formatearPrecio(costoEnvioCalculado)
                                                : 'No disponible'
                                            : 'Selecciona ubicación'}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.resumenFila,
                            styles.resumenTotal,
                            { borderTopColor: DISENO.colors.border },
                        ]}
                    >
                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: tamanos.totalTextSize,
                                color: DISENO.colors.text,
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
                                color: DISENO.colors.accent,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            {formatearPrecio(totalFinal)}
                        </Text>
                    </View>

                    {metodoPago === 'efectivo' && mostrarVuelto && vueltoCalculado > 0 && (
                        <View
                            style={[
                                styles.resumenFila,
                                {
                                    marginTop: 4,
                                    paddingTop: 4,
                                    borderTopWidth: 1,
                                    borderTopColor: DISENO.colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    fontFamily: FUENTES.regular,
                                    fontSize: tamanos.resumenTextSize,
                                    color: DISENO.colors.success,
                                    fontWeight: '600',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                💵 Vuelto
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FUENTES.display,
                                    fontSize: tamanos.resumenValorSize,
                                    color: DISENO.colors.success,
                                    fontWeight: 'bold',
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                {formatearPrecio(vueltoCalculado)}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* BOTÓN CONFIRMAR */}
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: tamanos.seccionMarginTop,
                    }}
                >
                    <TouchableOpacity
                        style={[
                            styles.botonConfirmar,
                            {
                                borderRadius: tamanos.botonRadius,
                                ...(cargando ? { opacity: 0.6 } : {}),
                            },
                        ]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                            style={[styles.botonConfirmarGradient, { paddingVertical: tamanos.botonPaddingV }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {cargando ? (
                                <ActivityIndicator color={DISENO.colors.text} size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={tamanos.botonIconSize} color={DISENO.colors.text} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.botonTextSize,
                                            color: DISENO.colors.text,
                                            letterSpacing: 0.5,
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

            {/* MODAL ÉXITO */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modal,
                            {
                                padding: tamanos.modalPadding,
                                borderRadius: tamanos.modalRadius,
                                borderColor: DISENO.colors.accentSecondary,
                                borderWidth: 1,
                                backgroundColor: DISENO.colors.surface,
                                ...DISENO.shadow.lg,
                            },
                        ]}
                    >
                        <Text style={{ fontSize: tamanos.modalIconSize, marginBottom: 12 }} allowFontScaling={false}>
                            ✅
                        </Text>
                        <Text
                            style={{
                                fontFamily: FUENTES.display,
                                fontSize: tamanos.modalTitleSize,
                                color: DISENO.colors.accentSecondary,
                                marginBottom: 8,
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
                                color: DISENO.colors.textSecondary,
                                textAlign: 'center',
                                opacity: 0.8,
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            {metodoPago === 'efectivo' && mostrarVuelto
                                ? `💰 Pagás con ${formatearPrecio(
                                    parseFloat(montoConQuePaga.replace(',', '.')),
                                )}. Tu vuelto es ${formatearPrecio(vueltoCalculado)}`
                                : 'Tu pedido está siendo preparado'}
                        </Text>
                        <Text
                            style={{
                                fontFamily: FUENTES.regular,
                                fontSize: tamanos.modalSubtextSize,
                                color: DISENO.colors.accent,
                                marginTop: 12,
                                fontWeight: '500',
                                includeFontPadding: false,
                            }}
                            allowFontScaling={false}
                        >
                            Redirigiendo al seguimiento...
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                            {renderLoaderDots()}
                        </View>
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
                <View style={styles.modalTransferenciaOverlay}>
                    <View
                        style={{
                            width: tamanos.transModalWidth,
                            maxWidth: 480,
                            backgroundColor: DISENO.colors.surface,
                            borderColor: DISENO.colors.border,
                            borderRadius: tamanos.transModalRadius,
                            overflow: 'hidden',
                            borderWidth: 1,
                            maxHeight: '85%',
                            alignSelf: 'center',
                            ...DISENO.shadow.lg,
                        }}
                    >
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
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
                            <View style={styles.modalTransferenciaHeaderContent}>
                                <View
                                    style={{
                                        width: tamanos.transModalHeaderIconSize,
                                        height: tamanos.transModalHeaderIconSize,
                                        borderRadius: tamanos.transModalHeaderIconSize / 2,
                                        backgroundColor: DISENO.colors.text + '15',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name="swap-horizontal-outline"
                                        size={tamanos.transModalHeaderIconSize * 0.65}
                                        color={DISENO.colors.text}
                                    />
                                </View>
                                <Text
                                    style={{
                                        fontFamily: FUENTES.display,
                                        fontSize: tamanos.transModalHeaderTitleSize,
                                        color: DISENO.colors.text,
                                        letterSpacing: 0.3,
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
                                    color: DISENO.colors.textSecondary,
                                    textAlign: 'center',
                                    marginBottom: 16,
                                    lineHeight: 18,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                Para completar tu pedido, realizá la transferencia a los siguientes datos:
                            </Text>

                            <View
                                style={{
                                    backgroundColor: DISENO.colors.accentSecondary + '08',
                                    borderRadius: 12,
                                    padding: tamanos.transModalAliasPadding,
                                    borderWidth: 1,
                                    borderColor: DISENO.colors.accentSecondary + '20',
                                    marginBottom: 12,
                                }}
                            >
                                <View style={styles.modalTransferenciaAliasHeader}>
                                    <Ionicons name="cash-outline" size={16} color={DISENO.colors.textSecondary} />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.regular,
                                            fontSize: tamanos.transModalAliasLabelSize,
                                            fontWeight: '600',
                                            color: DISENO.colors.textSecondary,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            includeFontPadding: false,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Alias
                                    </Text>
                                </View>
                                <View style={styles.modalTransferenciaAliasRow}>
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalAliasTextoSize,
                                            color: DISENO.colors.text,
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
                                            backgroundColor: DISENO.colors.accent + '15',
                                            flexShrink: 0,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="copy-outline" size={18} color={DISENO.colors.accent} />
                                        <Text
                                            style={{
                                                fontFamily: FUENTES.regular,
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: DISENO.colors.accent,
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
                                    backgroundColor: DISENO.colors.surfaceHover,
                                    borderRadius: 10,
                                    padding: tamanos.transModalCbuPadding,
                                    borderWidth: 1,
                                    borderColor: DISENO.colors.border,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.transModalCbuLabelSize,
                                        fontWeight: '600',
                                        color: DISENO.colors.textTertiary,
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
                                        color: DISENO.colors.text,
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
                                    borderColor: DISENO.colors.border,
                                    marginBottom: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: FUENTES.regular,
                                        fontSize: tamanos.transModalMontoLabelSize,
                                        color: DISENO.colors.textSecondary,
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
                                        color: DISENO.colors.accent,
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
                                    color: DISENO.colors.textTertiary,
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
                                        backgroundColor: DISENO.colors.surfaceHover,
                                        borderColor: DISENO.colors.border,
                                    }}
                                    onPress={cerrarModalTransferencia}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={tamanos.transModalBotonIconSize}
                                        color={DISENO.colors.textSecondary}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalBotonTextSize,
                                            color: DISENO.colors.textSecondary,
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
                                        borderWidth: 1,
                                        minWidth: 0,
                                        backgroundColor: DISENO.colors.accentSecondary,
                                        borderColor: DISENO.colors.accentSecondary,
                                    }}
                                    onPress={abrirBanco}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="open-outline"
                                        size={tamanos.transModalBotonIconSize}
                                        color={DISENO.colors.text}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: FUENTES.display,
                                            fontSize: tamanos.transModalBotonTextSize,
                                            color: DISENO.colors.text,
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
                                    color: DISENO.colors.textTertiary,
                                    textAlign: 'center',
                                    lineHeight: 16,
                                    paddingBottom: 4,
                                    includeFontPadding: false,
                                }}
                                allowFontScaling={false}
                            >
                                ⏳ Una vez realizada la transferencia, presioná "Ya transferí"
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS (solo lo estático)
// ============================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DISENO.colors.fondo },
    backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
        includeFontPadding: false,
        flex: 1,
        textAlign: 'center',
    },
    scroll: { flexGrow: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1 },
    beneficiosHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    beneficiosList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    beneficioTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: DISENO.colors.surface,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    loadingUbicacion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        gap: 10,
        backgroundColor: DISENO.colors.surface,
    },
    direccionPerfilHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
        flexWrap: 'wrap',
    },
    infoEnvioContainer: { borderWidth: 1, marginBottom: 4, marginTop: 8 },
    infoEnvioFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
    resumenFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    resumenTotal: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
    botonConfirmar: { overflow: 'hidden', marginTop: 10, ...DISENO.shadow.md },
    botonConfirmarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: { width: '90%', maxWidth: 400, alignItems: 'center' },
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
        gap: 6,
        marginBottom: 6,
    },
    modalTransferenciaAliasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
});