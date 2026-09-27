// screens/cliente/PantallaCarrito.tsx - V2 RESPONSIVE
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { cuponService } from '../../lib/cupones/cuponService';
import { useBeneficios } from '../../hooks/useBeneficios';
import { calcularResumenPedido } from '../../services/servicioPreciosPedido';

// ============================================================
// 📌 CONSTANTES
// ============================================================
const MAX_PORCENTAJE_PUNTOS = 0.25;
const MINIMO_PARA_PUNTOS = 15000;
const MINIMO_PUNTOS_CANJE = 100;
const VALOR_POR_PUNTO = 100;

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosCarrito {
  padding: number;
  // Header
  headerPaddingTop: number;
  headerPaddingBottom: number;
  tituloSize: number;
  backIconSize: number;
  // Item
  itemPadding: number;
  itemRadius: number;
  itemImageSize: number;
  itemImageRadius: number;
  itemEmojiSize: number;
  itemNameSize: number;
  itemPriceSize: number;
  controlButtonSize: number;
  controlIconSize: number;
  controlQuantitySize: number;
  deleteIconSize: number;
  // Footer
  footerMarginTop: number;
  footerPadding: number;
  footerRadius: number;
  // Puntos button
  puntosPaddingV: number;
  puntosPaddingH: number;
  puntosTextSize: number;
  puntosLabelSize: number;
  puntosChevronSize: number;
  // Aviso
  avisoPaddingV: number;
  avisoPaddingH: number;
  avisoTextoSize: number;
  avisoSubSize: number;
  // Nivel
  nivelPadding: number;
  nivelEmojiSize: number;
  nivelTituloSize: number;
  nivelDetalleSize: number;
  // Summary
  summaryPadding: number;
  summaryRadius: number;
  summaryLabelSize: number;
  summaryValueSize: number;
  totalLabelSize: number;
  totalPriceSize: number;
  cuponTextSize: number;
  cuponSubtextSize: number;
  cuponIconSize: number;
  cuponPaddingH: number;
  cuponPaddingV: number;
  cuponRadius: number;
  ahorroPaddingV: number;
  ahorroPaddingH: number;
  ahorroEmojiSize: number;
  ahorroTextoSize: number;
  ahorroRadius: number;
  // Checkout
  checkoutPaddingV: number;
  checkoutRadius: number;
  checkoutTextSize: number;
  checkoutIconSize: number;
  checkoutPricePaddingH: number;
  checkoutPricePaddingV: number;
  checkoutPriceTextSize: number;
  checkoutPriceRadius: number;
  // Empty cart
  emptyButtonPaddingV: number;
  emptyButtonPaddingH: number;
  emptyButtonRadius: number;
  emptyIconSize: number;
  emptyButtonTextSize: number;
  emptyButtonIconSize: number;
  // Empty state
  emptyCartIconSize: number;
  emptyTextSize: number;
  emptySubtextSize: number;
  cuponVacioPadding: number;
  cuponVacioRadius: number;
  cuponVacioIconSize: number;
  cuponVacioTituloSize: number;
  cuponVacioDetalleSize: number;
  vaciarPaddingV: number;
  vaciarTextSize: number;
  // Modal login
  modalLoginPadding: number;
  modalLoginRadius: number;
  modalLoginIconSize: number;
  modalLoginTitleSize: number;
  modalLoginTextSize: number;
  modalLoginButtonPaddingV: number;
  modalLoginButtonRadius: number;
  modalLoginButtonTextSize: number;
  modalLoginButtonIconSize: number;
  modalLoginLinkSize: number;
  // Modal puntos
  modalPuntosPadding: number;
  modalPuntosRadius: number;
  modalPuntosWidth: number;
  modalPuntosTitleSize: number;
  modalPuntosSubtitleSize: number;
  modalPuntosInfoPadding: number;
  modalPuntosInfoRadius: number;
  modalPuntosInfoLabelSize: number;
  modalPuntosInfoValueSize: number;
  modalPuntosInputLabelSize: number;
  modalPuntosInputRadius: number;
  modalPuntosInputBtnPaddingH: number;
  modalPuntosInputBtnPaddingV: number;
  modalPuntosInputBtnIconSize: number;
  modalPuntosInputFieldSize: number;
  modalPuntosInputFieldPaddingH: number;
  modalPuntosInputFieldPaddingV: number;
  modalPuntosHintSize: number;
  modalPuntosDescuentoPadding: number;
  modalPuntosDescuentoRadius: number;
  modalPuntosDescuentoLabelSize: number;
  modalPuntosDescuentoValueSize: number;
  modalPuntosBotonesPaddingV: number;
  modalPuntosBotonesRadius: number;
  modalPuntosBotonesTextSize: number;
  modalPuntosMinimoSize: number;
}

const calcularTamanosCarrito = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,
): TamanosCarrito => {
  const padding = isDesktop ? 40 : isTablet ? 32 : isSmallPhone ? 14 : 18;

  const headerPaddingTop = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 8 : 12;
  const headerPaddingBottom = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 8 : 10;
  const tituloSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 17 : 20;
  const backIconSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 20 : 22;

  const itemPadding = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const itemRadius = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 14;
  const itemImageSize = isDesktop ? 80 : isTablet ? 76 : isSmallPhone ? 58 : 68;
  const itemImageRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const itemEmojiSize = isDesktop ? 32 : isTablet ? 30 : isSmallPhone ? 24 : 28;
  const itemNameSize = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const itemPriceSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const controlButtonSize = isDesktop ? 32 : isTablet ? 30 : isSmallPhone ? 24 : 28;
  const controlIconSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const controlQuantitySize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const deleteIconSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;

  const footerMarginTop = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const footerPadding = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const footerRadius = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;

  const puntosPaddingV = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 10;
  const puntosPaddingH = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const puntosTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const puntosLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const puntosChevronSize = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 15;

  const avisoPaddingV = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 10;
  const avisoPaddingH = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 14;
  const avisoTextoSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const avisoSubSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;

  const nivelPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const nivelEmojiSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const nivelTituloSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const nivelDetalleSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;

  const summaryPadding = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const summaryRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const summaryLabelSize = isDesktop ? 12 : isTablet ? 11.5 : isSmallPhone ? 10 : 11;
  const summaryValueSize = isDesktop ? 12 : isTablet ? 11.5 : isSmallPhone ? 10 : 11;
  const totalLabelSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 13 : 14;
  const totalPriceSize = isDesktop ? 17 : isTablet ? 16 : isSmallPhone ? 14 : 15;
  const cuponTextSize = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const cuponSubtextSize = isDesktop ? 10 : isTablet ? 10 : isSmallPhone ? 9 : 10;
  const cuponIconSize = isDesktop ? 18 : isSmallPhone ? 16 : 17;
  const cuponPaddingH = isDesktop ? 8 : isSmallPhone ? 6 : 7;
  const cuponPaddingV = isDesktop ? 4 : isSmallPhone ? 3 : 4;
  const cuponRadius = isDesktop ? 8 : 6;
  const ahorroPaddingV = isDesktop ? 10 : isTablet ? 9 : isSmallPhone ? 7 : 8;
  const ahorroPaddingH = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 8 : 10;
  const ahorroEmojiSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const ahorroTextoSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const ahorroRadius = isDesktop ? 10 : isSmallPhone ? 8 : 9;

  const checkoutPaddingV = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const checkoutRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const checkoutTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const checkoutIconSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 16 : 17;
  const checkoutPricePaddingH = isDesktop ? 10 : isSmallPhone ? 6 : 8;
  const checkoutPricePaddingV = isDesktop ? 4 : isSmallPhone ? 2 : 3;
  const checkoutPriceTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const checkoutPriceRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;

  const emptyButtonPaddingV = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const emptyButtonPaddingH = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 20 : 24;
  const emptyButtonRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const emptyIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const emptyButtonTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const emptyButtonIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;

  const emptyCartIconSize = isDesktop ? 100 : isTablet ? 90 : isSmallPhone ? 60 : 78;
  const emptyTextSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 15 : 17;
  const emptySubtextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const cuponVacioPadding = isSmallPhone ? 12 : 14;
  const cuponVacioRadius = isSmallPhone ? 10 : 12;
  const cuponVacioIconSize = isSmallPhone ? 20 : 22;
  const cuponVacioTituloSize = isSmallPhone ? 11 : 12;
  const cuponVacioDetalleSize = isSmallPhone ? 10 : 11;
  const vaciarPaddingV = isSmallPhone ? 4 : 6;
  const vaciarTextSize = isSmallPhone ? 10 : 11;

  const modalLoginPadding = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 20 : 24;
  const modalLoginRadius = isDesktop ? 24 : isSmallPhone ? 18 : 20;
  const modalLoginIconSize = isDesktop ? 60 : isTablet ? 60 : isSmallPhone ? 44 : 52;
  const modalLoginTitleSize = isDesktop ? 18 : isTablet ? 18 : isSmallPhone ? 15 : 16;
  const modalLoginTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const modalLoginButtonPaddingV = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const modalLoginButtonRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const modalLoginButtonTextSize = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const modalLoginButtonIconSize = isDesktop ? 18 : isSmallPhone ? 16 : 17;
  const modalLoginLinkSize = isDesktop ? 13 : isSmallPhone ? 11 : 12;

  const modalPuntosPadding = isDesktop ? 28 : isTablet ? 24 : isSmallPhone ? 16 : 20;
  const modalPuntosRadius = isDesktop ? 24 : isSmallPhone ? 18 : 22;
  const modalPuntosWidth = isDesktop ? width * 0.5 : isTablet ? width * 0.6 : width * 0.92;
  const modalPuntosTitleSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 15 : 17;
  const modalPuntosSubtitleSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosInfoPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const modalPuntosInfoRadius = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const modalPuntosInfoLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 10 : 10.5;
  const modalPuntosInfoValueSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const modalPuntosInputLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosInputRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const modalPuntosInputBtnPaddingH = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const modalPuntosInputBtnPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosInputBtnIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const modalPuntosInputFieldSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 16 : 17;
  const modalPuntosInputFieldPaddingH = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 9;
  const modalPuntosInputFieldPaddingV = isDesktop ? 10 : isTablet ? 8 : isSmallPhone ? 6 : 7;
  const modalPuntosHintSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;
  const modalPuntosDescuentoPadding = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 8 : 10;
  const modalPuntosDescuentoRadius = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const modalPuntosDescuentoLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosDescuentoValueSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 15 : 17;
  const modalPuntosBotonesPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosBotonesRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosBotonesTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosMinimoSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;

  return {
    padding,
    headerPaddingTop, headerPaddingBottom, tituloSize, backIconSize,
    itemPadding, itemRadius, itemImageSize, itemImageRadius, itemEmojiSize,
    itemNameSize, itemPriceSize, controlButtonSize, controlIconSize, controlQuantitySize, deleteIconSize,
    footerMarginTop, footerPadding, footerRadius,
    puntosPaddingV, puntosPaddingH, puntosTextSize, puntosLabelSize, puntosChevronSize,
    avisoPaddingV, avisoPaddingH, avisoTextoSize, avisoSubSize,
    nivelPadding, nivelEmojiSize, nivelTituloSize, nivelDetalleSize,
    summaryPadding, summaryRadius, summaryLabelSize, summaryValueSize, totalLabelSize, totalPriceSize,
    cuponTextSize, cuponSubtextSize, cuponIconSize, cuponPaddingH, cuponPaddingV, cuponRadius,
    ahorroPaddingV, ahorroPaddingH, ahorroEmojiSize, ahorroTextoSize, ahorroRadius,
    checkoutPaddingV, checkoutRadius, checkoutTextSize, checkoutIconSize,
    checkoutPricePaddingH, checkoutPricePaddingV, checkoutPriceTextSize, checkoutPriceRadius,
    emptyButtonPaddingV, emptyButtonPaddingH, emptyButtonRadius, emptyIconSize, emptyButtonTextSize, emptyButtonIconSize,
    emptyCartIconSize, emptyTextSize, emptySubtextSize,
    cuponVacioPadding, cuponVacioRadius, cuponVacioIconSize, cuponVacioTituloSize, cuponVacioDetalleSize,
    vaciarPaddingV, vaciarTextSize,
    modalLoginPadding, modalLoginRadius, modalLoginIconSize, modalLoginTitleSize, modalLoginTextSize,
    modalLoginButtonPaddingV, modalLoginButtonRadius, modalLoginButtonTextSize, modalLoginButtonIconSize, modalLoginLinkSize,
    modalPuntosPadding, modalPuntosRadius, modalPuntosWidth, modalPuntosTitleSize, modalPuntosSubtitleSize,
    modalPuntosInfoPadding, modalPuntosInfoRadius, modalPuntosInfoLabelSize, modalPuntosInfoValueSize,
    modalPuntosInputLabelSize, modalPuntosInputRadius, modalPuntosInputBtnPaddingH, modalPuntosInputBtnPaddingV,
    modalPuntosInputBtnIconSize, modalPuntosInputFieldSize, modalPuntosInputFieldPaddingH, modalPuntosInputFieldPaddingV,
    modalPuntosHintSize, modalPuntosDescuentoPadding, modalPuntosDescuentoRadius, modalPuntosDescuentoLabelSize,
    modalPuntosDescuentoValueSize, modalPuntosBotonesPaddingV, modalPuntosBotonesRadius, modalPuntosBotonesTextSize,
    modalPuntosMinimoSize,
  };
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaCarrito(props: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isSmallPhone = screenWidth < 375;

  const tamanos = useMemo(
    () => calcularTamanosCarrito(screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone),
    [screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone],
  );

  const { elementos, aumentarCantidad, disminuirCantidad, quitarProducto, vaciarCarrito, calcularTotal } = tiendaCarrito();
  const {
    perfil,
    sesion,
    ubicacionSeleccionada: ubicacionStore,
    cargarUbicacionTemporal,
    guardarUbicacionTemporal,
    limpiarUbicacionTemporal,
  } = tiendaAutenticacion();

  const { nivel, beneficios, calcularDescuento, tieneEnvioGratis } = useBeneficios(
    perfil?.puntos_acumulados || 0,
    perfil?.id,
  );

  // Estados
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState(0);
  const [puntosMaximos, setPuntosMaximos] = useState(0);
  const [puntosOriginales, setPuntosOriginales] = useState(0);
  const [puntosOriginalesAntesCanje, setPuntosOriginalesAntesCanje] = useState(0);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);
  const [cuponPuntosAplicado, setCuponPuntosAplicado] = useState<any>(null);
  const [cuponAplicado, setCuponAplicado] = useState<any>(
    () => props.route?.params?.cuponAplicado || null,
  );
  const intentoRecuperarCupon = useRef(false);
  const [inputPuntos, setInputPuntos] = useState('');

  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState(0);
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [distanciaFormateada, setDistanciaFormateada] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [ubicacionGuardada, setUbicacionGuardada] = useState<UbicacionGuardada | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  const total = calcularTotal();
  const totalProductos = elementos.reduce((sum, item) => sum + item.cantidad, 0);

  // ============================================================
  // 🆕 REGLAS DE PUNTOS
  // ============================================================
  const puedeUsarPuntos = useMemo(() => {
    if (!perfil?.id) return false;
    return total >= MINIMO_PARA_PUNTOS;
  }, [total, perfil?.id]);

  const faltaParaUsarPuntos = useMemo(() => {
    if (total >= MINIMO_PARA_PUNTOS) return 0;
    return MINIMO_PARA_PUNTOS - total;
  }, [total]);

  const puntosMaximosPermitidos = useMemo(() => {
    if (!puedeUsarPuntos) return 0;
    const maxEnPesos = total * MAX_PORCENTAJE_PUNTOS;
    const maxEnPuntos = Math.floor(maxEnPesos / VALOR_POR_PUNTO) * VALOR_POR_PUNTO;
    return maxEnPuntos;
  }, [total, puedeUsarPuntos]);

  const porcentajeDescuentoNivel = useMemo(() => {
    if (!beneficios) return 0;
    return beneficios.descuento || 0;
  }, [beneficios]);

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (perfil) {
      cargarPuntosUsuario();
    } else {
      setPuntosMaximos(0);
      setPuntosOriginales(0);
      setPuntosOriginalesAntesCanje(0);
      setInputPuntos('');
      setPuntosSeleccionados(0);
      setCuponPuntosAplicado(null);
    }
  }, [perfil]);

  useEffect(() => {
    const cuponRecibido = props.route?.params?.cuponAplicado;
    if (cuponRecibido) setCuponAplicado(cuponRecibido);
  }, [props.route?.params?.cuponAplicado]);

  useEffect(() => {
    if (!perfil?.id || cuponAplicado || intentoRecuperarCupon.current) return;
    intentoRecuperarCupon.current = true;

    const recuperarCuponDisponible = async () => {
      const cuponesDisponibles = await cuponService.obtenerCuponesDisponibles(perfil.id);
      const cuponReservado = cuponesDisponibles[0]?.cupon;
      if (cuponReservado) setCuponAplicado(cuponReservado);
    };

    recuperarCuponDisponible();
  }, [perfil?.id, cuponAplicado]);

  useEffect(() => {
    cargarUbicacionDesdeStore();
  }, []);

  useEffect(() => {
    if (ubicacionGuardada && elementos.length > 0) {
      calcularEnvioEstimado();
    } else {
      setCostoEnvioEstimado(0);
      setDistanciaEstimada(null);
      setDistanciaFormateada('');
      setEnvioDisponible(true);
      setMensajeEnvio('');
    }
  }, [ubicacionGuardada, elementos.length]);

  useFocusEffect(
    useCallback(() => {
      const recargarUbicacion = async () => {
        if (perfil) {
          const partesDireccion: string[] = [];
          if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
          if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
          if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
          if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
          if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
          if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
          if (perfil.direccion_codigo_postal) partesDireccion.push(`CP ${perfil.direccion_codigo_postal}`);

          const direccionCompleta = partesDireccion.length > 0 ? partesDireccion.join(', ') : '';

          if (direccionCompleta) {
            const ubicacionPerfil: UbicacionGuardada = {
              latitude: perfil.lat_cliente || -34.776484410467525,
              longitude: perfil.lng_cliente || -58.29220250409459,
              direccion: direccionCompleta,
              seleccionadaPorUsuario: false,
            };
            setUbicacionGuardada(ubicacionPerfil);
            await guardarUbicacionTemporal(ubicacionPerfil);
            setCargandoUbicacion(false);
            return;
          }
        }

        const ubicacionCargada = await cargarUbicacionTemporal();
        if (ubicacionCargada) {
          setUbicacionGuardada(ubicacionCargada);
          setCargandoUbicacion(false);
          return;
        }

        const ubicacionDefault: UbicacionGuardada = {
          latitude: -34.776484410467525,
          longitude: -58.29220250409459,
          direccion: 'Local Krusty Burger',
          seleccionadaPorUsuario: false,
        };
        setUbicacionGuardada(ubicacionDefault);
        await guardarUbicacionTemporal(ubicacionDefault);
        setCargandoUbicacion(false);
      };

      recargarUbicacion();
    }, [perfil]),
  );

  // ============================================================
  // FUNCIONES DE CARGA
  // ============================================================
  const cargarUbicacionDesdeStore = async () => {
    setCargandoUbicacion(true);
    try {
      const ubicacionCargada = await cargarUbicacionTemporal();
      if (ubicacionCargada) {
        setUbicacionGuardada(ubicacionCargada);
        setCargandoUbicacion(false);
        return;
      }
      if (ubicacionStore) {
        setUbicacionGuardada(ubicacionStore);
        setCargandoUbicacion(false);
        return;
      }
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
        seleccionadaPorUsuario: false,
      };
      setUbicacionGuardada(ubicacionDefault);
      await guardarUbicacionTemporal(ubicacionDefault);
    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const calcularEnvioEstimado = async () => {
    if (!ubicacionGuardada) return;
    setCalculandoEnvio(true);
    try {
      const resultado = await servicioEnvios.calcularCostoEnvio(
        ubicacionGuardada.latitude,
        ubicacionGuardada.longitude,
      );
      if (resultado.esValido && resultado.dentroCobertura) {
        setCostoEnvioEstimado(resultado.costo);
        setDistanciaEstimada(resultado.distancia);
        setDistanciaFormateada(resultado.distanciaFormateada);
        setEnvioDisponible(true);
        setMensajeEnvio('');
      } else {
        setEnvioDisponible(false);
        setMensajeEnvio(resultado.mensaje || 'No disponible');
        setCostoEnvioEstimado(0);
        setDistanciaEstimada(null);
      }
    } catch (error) {
      console.error('Error calculando envío:', error);
      setEnvioDisponible(false);
      setMensajeEnvio('Error al calcular envío');
      setCostoEnvioEstimado(0);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  const cargarPuntosUsuario = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('puntos_acumulados')
        .eq('id', perfil.id)
        .single();
      if (error) throw error;
      const puntos = data?.puntos_acumulados || 0;
      setPuntosMaximos(puntos);
      setPuntosOriginales(puntos);
      setPuntosOriginalesAntesCanje(0);
      setInputPuntos('');
    } catch (error) {
      console.error('Error cargando puntos:', error);
      setPuntosMaximos(0);
      setPuntosOriginales(0);
    }
  };

  // ============================================================
  // MANEJADORES DE PUNTOS
  // ============================================================
  const restaurarPuntos = async () => {
    if (!perfil?.id) return;
    const puntosARestaurar =
      cuponPuntosAplicado?.puntos_antes_canje || puntosOriginalesAntesCanje || puntosOriginales;
    if (puntosARestaurar === 0) return;

    try {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ puntos_acumulados: puntosARestaurar })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ Error restaurando puntos:', updateError);
        return;
      }

      setPuntosMaximos(puntosARestaurar);
      setPuntosOriginales(puntosARestaurar);
      setPuntosOriginalesAntesCanje(0);
      setCuponPuntosAplicado(null);
      setPuntosSeleccionados(0);
      setInputPuntos('');
      await cargarPuntosUsuario();
    } catch (error) {
      console.error('❌ Error restaurando puntos:', error);
    }
  };

  const quitarDescuento = () => {
    restaurarPuntos();
  };

  const handleInputPuntos = (text: string) => {
    const num = parseInt(text) || 0;
    if (num < 0) return;
    const limitado = Math.min(num, puntosMaximosPermitidos, puntosMaximos);
    setInputPuntos(limitado.toString());
    setPuntosSeleccionados(limitado);
  };

  const canjearPuntos = async () => {
    if (!puedeUsarPuntos) {
      Alert.alert(
        'Mínimo de compra',
        `Necesitás un mínimo de ${formatearPrecio(MINIMO_PARA_PUNTOS)} para usar tus puntos. Agregá ${formatearPrecio(faltaParaUsarPuntos)} más.`,
      );
      return;
    }
    if (puntosSeleccionados < MINIMO_PUNTOS_CANJE) {
      Alert.alert(
        `Mínimo ${MINIMO_PUNTOS_CANJE} puntos`,
        `Necesitás al menos ${MINIMO_PUNTOS_CANJE} puntos para canjear (${formatearPrecio(MINIMO_PUNTOS_CANJE)} de descuento)`,
      );
      return;
    }
    if (puntosSeleccionados > puntosMaximos) {
      Alert.alert('Puntos insuficientes', `Tenés ${puntosMaximos} puntos disponibles`);
      return;
    }
    if (puntosSeleccionados > puntosMaximosPermitidos) {
      Alert.alert(
        'Tope máximo alcanzado',
        `El máximo que podés canjear es ${puntosMaximosPermitidos} pts (25% del total)`,
      );
      return;
    }

    const descuentoEnPesos = Math.floor(puntosSeleccionados / VALOR_POR_PUNTO) * VALOR_POR_PUNTO;
    const puntosAntesCanje = puntosMaximos;

    setCanjeandoPuntos(true);
    try {
      const { data: recompensa, error: recompensaError } = await supabase
        .from('recompensas')
        .select('id')
        .eq('nombre', 'Descuento por puntos')
        .single();
      if (recompensaError) throw recompensaError;

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ puntos_acumulados: puntosMaximos - puntosSeleccionados })
        .eq('id', perfil!.id);
      if (updateError) throw updateError;

      const { error: canjeError } = await supabase
        .from('canjes')
        .insert({
          usuario_id: perfil!.id,
          recompensa_id: recompensa.id,
          puntos_usados: puntosSeleccionados,
          usado_en_pedido: false,
          created_at: new Date().toISOString(),
        });
      if (canjeError) throw canjeError;

      setPuntosOriginalesAntesCanje(puntosAntesCanje);
      setPuntosMaximos(puntosMaximos - puntosSeleccionados);
      setPuntosOriginales(puntosOriginales - puntosSeleccionados);

      const cuponVirtual = {
        id: Date.now(),
        recompensas: {
          nombre: `${formatearPrecio(descuentoEnPesos)} de descuento`,
          descripcion: `Canjeado por ${puntosSeleccionados} puntos`,
          tipo: 'DESCUENTO_FIJO',
          valor_descuento: descuentoEnPesos,
        },
        puntos_usados: puntosSeleccionados,
        puntos_antes_canje: puntosAntesCanje,
      };

      setCuponPuntosAplicado(cuponVirtual);
      setMostrarModalPuntos(false);
      setPuntosSeleccionados(0);
      setInputPuntos('');

      Alert.alert(
        '🎉 ¡Éxito!',
        `Canjeaste ${puntosSeleccionados} puntos por ${formatearPrecio(descuentoEnPesos)} de descuento`,
        [{ text: '¡Genial!' }],
      );

      await cargarPuntosUsuario();
    } catch (error) {
      console.error('Error canjeando puntos:', error);
      Alert.alert('❌ Error', 'No se pudo canjear los puntos. Intentá de nuevo.');
    } finally {
      setCanjeandoPuntos(false);
    }
  };

  const cancelarCanje = () => {
    setPuntosSeleccionados(0);
    setInputPuntos('');
    setMostrarModalPuntos(false);
  };

  // ============================================================
  // CÁLCULOS
  // ============================================================
  const descuentoNivel = beneficios ? calcularDescuento(total) : 0;
  const envioGratisNivel = beneficios ? tieneEnvioGratis(total) : false;

  const resumenPedido = calcularResumenPedido({
    subtotal: total,
    cuponAplicado,
    cuponPuntosAplicado,
    descuentoNivel,
    costoEnvio: envioDisponible ? costoEnvioEstimado : 0,
    tipoEntrega: 'domicilio',
    envioGratisNivel,
  });

  const descuentoPuntos = resumenPedido.descuentoPuntos;
  const descuentoCupon = resumenPedido.descuentoCupon;
  const descuento = resumenPedido.descuentoTotal;
  const cuponEsEnvioGratis = resumenPedido.envioGratisPorCupon;
  const cuponEsDescuento = String(cuponAplicado?.tipo || '').toLowerCase() === 'descuento';
  const envioGratisPorPuntos = resumenPedido.envioGratisPorPuntos;
  const envioGratisPorCupon = resumenPedido.envioGratisPorCupon;
  const totalFinal = resumenPedido.totalFinal;

  const ahorroPorEnvio =
    envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel ? costoEnvioEstimado : 0;
  const ahorroTotal = descuento + ahorroPorEnvio;
  const mostrarAhorro = ahorroTotal > 0;

  const padding = tamanos.padding;

  // ============================================================
  // RENDER ITEM
  // ============================================================
  const precioUnitario = (precio: any) => (typeof precio === 'number' ? precio : Number(precio));

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const itemFade = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

      return (
        <Animated.View style={{ opacity: itemFade, transform: [{ translateY: slideUpAnim }] }}>
          <View
            style={[
              styles.item,
              {
                padding: tamanos.itemPadding,
                borderRadius: tamanos.itemRadius,
                backgroundColor: DISENO.colors.surface,
                borderColor: DISENO.colors.border,
                ...DISENO.shadow.sm,
              },
            ]}
          >
            {item.producto.imagen ? (
              <Image
                source={{ uri: item.producto.imagen }}
                style={[
                  styles.imagen,
                  {
                    width: tamanos.itemImageSize,
                    height: tamanos.itemImageSize,
                    borderRadius: tamanos.itemImageRadius,
                  },
                ]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.imagenPlaceholder,
                  {
                    width: tamanos.itemImageSize,
                    height: tamanos.itemImageSize,
                    borderRadius: tamanos.itemImageRadius,
                    backgroundColor: DISENO.colors.surfaceHover,
                  },
                ]}
              >
                <Text style={{ fontSize: tamanos.itemEmojiSize }} allowFontScaling={false}>
                  🍔
                </Text>
              </View>
            )}

            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemNombre,
                  { fontSize: tamanos.itemNameSize, color: DISENO.colors.text },
                ]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {item.producto.nombre}
              </Text>
              <Text
                style={[
                  styles.itemPrecioTotal,
                  { fontSize: tamanos.itemPriceSize, color: DISENO.colors.accent },
                ]}
                allowFontScaling={false}
              >
                {formatearPrecio(precioUnitario(item.producto.precio) * item.cantidad)}
              </Text>
            </View>

            <View style={styles.controles}>
              <TouchableOpacity
                onPress={() => disminuirCantidad(item.producto.id)}
                style={[
                  styles.botonControl,
                  {
                    width: tamanos.controlButtonSize,
                    height: tamanos.controlButtonSize,
                    borderRadius: tamanos.controlButtonSize / 2,
                    backgroundColor: DISENO.colors.accentSecondary,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={tamanos.controlIconSize} color={DISENO.colors.text} />
              </TouchableOpacity>

              <Text
                style={[
                  styles.cantidad,
                  { fontSize: tamanos.controlQuantitySize, color: DISENO.colors.text },
                ]}
                allowFontScaling={false}
              >
                {item.cantidad}
              </Text>

              <TouchableOpacity
                onPress={() => aumentarCantidad(item.producto.id)}
                style={[
                  styles.botonControl,
                  {
                    width: tamanos.controlButtonSize,
                    height: tamanos.controlButtonSize,
                    borderRadius: tamanos.controlButtonSize / 2,
                    backgroundColor: DISENO.colors.accentSecondary,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={tamanos.controlIconSize} color={DISENO.colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => quitarProducto(item.producto.id)}
                style={styles.botonEliminar}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={tamanos.deleteIconSize}
                  color={DISENO.colors.accent}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      );
    },
    [tamanos, fadeAnim, slideUpAnim, disminuirCantidad, aumentarCantidad, quitarProducto],
  );

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (elementos.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="cart-outline"
            size={tamanos.emptyCartIconSize}
            color={DISENO.colors.textTertiary}
          />
          <Text
            style={[styles.emptyText, { fontSize: tamanos.emptyTextSize, color: DISENO.colors.text }]}
            allowFontScaling={false}
          >
            Tu carrito está vacío
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { fontSize: tamanos.emptySubtextSize, color: DISENO.colors.textSecondary },
            ]}
            allowFontScaling={false}
          >
            Agrega productos del menú 🍔
          </Text>
          {cuponAplicado && (
            <View
              style={[
                styles.cuponVacioCard,
                { padding: tamanos.cuponVacioPadding, borderRadius: tamanos.cuponVacioRadius },
              ]}
            >
              <Ionicons
                name="ticket-outline"
                size={tamanos.cuponVacioIconSize}
                color={DISENO.colors.accent}
              />
              <View style={styles.cuponVacioContenido}>
                <Text
                  style={[
                    styles.cuponVacioTitulo,
                    { fontSize: tamanos.cuponVacioTituloSize },
                  ]}
                  allowFontScaling={false}
                >
                  Cupón listo para usar: {cuponAplicado.codigo || 'Cupón aplicado'}
                </Text>
                <Text
                  style={[
                    styles.cuponVacioDetalle,
                    { fontSize: tamanos.cuponVacioDetalleSize },
                  ]}
                  allowFontScaling={false}
                >
                  {cuponAplicado.titulo || 'Agregá productos y se aplicará al confirmar tu pedido.'}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.emptyButton, { borderRadius: tamanos.emptyButtonRadius }]}
            onPress={() => props.navigation.navigate('Principal', { screen: 'Menu' })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
              style={[
                styles.emptyButtonGradient,
                {
                  paddingHorizontal: tamanos.emptyButtonPaddingH,
                  paddingVertical: tamanos.emptyButtonPaddingV,
                },
              ]}
            >
              <Ionicons
                name="restaurant"
                size={tamanos.emptyButtonIconSize}
                color={DISENO.colors.text}
              />
              <Text
                style={[
                  styles.emptyButtonText,
                  { fontSize: tamanos.emptyButtonTextSize, color: DISENO.colors.text },
                ]}
                allowFontScaling={false}
              >
                Ir al Menú
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
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
            paddingTop: insets.top + tamanos.headerPaddingTop,
            paddingHorizontal: padding,
            paddingBottom: tamanos.headerPaddingBottom,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={tamanos.backIconSize} color={DISENO.colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { fontSize: tamanos.tituloSize, color: DISENO.colors.text }]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          🛒 Carrito
        </Text>
        <View style={{ width: tamanos.backIconSize }} />
      </View>

      {/* LISTA */}
      <FlatList
        data={elementos}
        keyExtractor={(item) => item.producto.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: padding,
            paddingTop: 6,
            paddingBottom: 220,
          },
        ]}
        showsVerticalScrollIndicator={true}
        renderItem={renderItem}
        ListFooterComponent={
          <View
            style={[
              styles.footerContainer,
              {
                marginTop: tamanos.footerMarginTop,
                padding: tamanos.footerPadding,
                borderRadius: tamanos.footerRadius,
                backgroundColor: DISENO.colors.surface,
                borderColor: DISENO.colors.border,
                ...DISENO.shadow.md,
              },
            ]}
          >
            {/* BOTÓN DE PUNTOS */}
            {puedeUsarPuntos ? (
              <TouchableOpacity
                style={[
                  styles.puntosButton,
                  {
                    backgroundColor: DISENO.colors.accentSecondary + '10',
                    borderColor: DISENO.colors.accentSecondary + '40',
                    borderWidth: 1.5,
                    paddingVertical: tamanos.puntosPaddingV,
                    paddingHorizontal: tamanos.puntosPaddingH,
                    borderRadius: tamanos.footerRadius - 2,
                    marginBottom: 10,
                    ...DISENO.shadow.sm,
                  },
                ]}
                onPress={() => {
                  if (cuponPuntosAplicado) {
                    setPuntosMaximos(puntosOriginalesAntesCanje || puntosOriginales);
                  }
                  setPuntosSeleccionados(0);
                  setInputPuntos('');
                  setMostrarModalPuntos(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.puntosButtonContent}>
                  <View style={styles.puntosButtonLeft}>
                    <Text
                      style={[
                        styles.puntosButtonText,
                        { color: DISENO.colors.text, fontSize: tamanos.puntosTextSize },
                      ]}
                      allowFontScaling={false}
                    >
                      ⭐ {puntosMaximos} pts
                    </Text>
                  </View>
                  <View style={styles.puntosButtonRight}>
                    <Text
                      style={[
                        styles.puntosButtonLabel,
                        {
                          color: DISENO.colors.accent,
                          fontSize: tamanos.puntosLabelSize,
                          backgroundColor: DISENO.colors.accent + '10',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Canjear X descuento
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={tamanos.puntosChevronSize}
                      color={DISENO.colors.accent}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ) : sesion && !puedeUsarPuntos ? (
              <View
                style={[
                  styles.avisoMinimo,
                  {
                    backgroundColor: '#FFF3E0',
                    borderColor: '#FFB74D',
                    borderWidth: 1.5,
                    paddingVertical: tamanos.avisoPaddingV,
                    paddingHorizontal: tamanos.avisoPaddingH,
                    borderRadius: tamanos.footerRadius - 2,
                    marginBottom: 10,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avisoMinimoTexto,
                    {
                      color: '#E65100',
                      fontSize: tamanos.avisoTextoSize,
                      fontWeight: '700',
                      textAlign: 'center',
                    },
                  ]}
                  allowFontScaling={false}
                >
                  🛒 Agregá {formatearPrecio(faltaParaUsarPuntos)} más para usar tus {puntosMaximos} pts
                </Text>
                <Text
                  style={[
                    styles.avisoMinimoSub,
                    {
                      color: '#BF360C',
                      fontSize: tamanos.avisoSubSize,
                      fontWeight: '500',
                      textAlign: 'center',
                      marginTop: 3,
                    },
                  ]}
                  allowFontScaling={false}
                >
                  Mínimo de compra: {formatearPrecio(MINIMO_PARA_PUNTOS)}
                </Text>
              </View>
            ) : null}

            {/* BADGE NIVEL */}
            {sesion && nivel && (
              <View
                style={[
                  styles.nivelBadge,
                  {
                    backgroundColor: (nivel.color || DISENO.colors.accentSecondary) + '12',
                    borderColor: (nivel.color || DISENO.colors.accentSecondary) + '40',
                    padding: tamanos.nivelPadding,
                    borderRadius: tamanos.footerRadius - 2,
                  },
                ]}
              >
                <Text
                  style={{ fontSize: tamanos.nivelEmojiSize }}
                  allowFontScaling={false}
                >
                  {nivel.icono || '🏆'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.nivelBadgeTitulo,
                      {
                        color: nivel.color || DISENO.colors.accentSecondary,
                        fontSize: tamanos.nivelTituloSize,
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    Nivel {nivel.nombre || 'Sin nivel'}
                  </Text>
                  {porcentajeDescuentoNivel > 0 ? (
                    <Text
                      style={[
                        styles.nivelBadgeDetalle,
                        { color: DISENO.colors.textSecondary, fontSize: tamanos.nivelDetalleSize },
                      ]}
                      allowFontScaling={false}
                    >
                      Tenés {porcentajeDescuentoNivel}% de descuento en todos tus pedidos
                    </Text>
                  ) : (
                    <Text
                      style={[
                        styles.nivelBadgeDetalle,
                        { color: DISENO.colors.textSecondary, fontSize: tamanos.nivelDetalleSize },
                      ]}
                      allowFontScaling={false}
                    >
                      Sumá puntos para desbloquear descuentos 🎯
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* RESUMEN */}
            <View
              style={[
                styles.summary,
                {
                  backgroundColor: DISENO.colors.surfaceHover,
                  borderColor: DISENO.colors.border,
                  borderRadius: tamanos.summaryRadius,
                  padding: tamanos.summaryPadding,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text
                  style={[styles.summaryLabel, { color: DISENO.colors.textSecondary, fontSize: tamanos.summaryLabelSize }]}
                  allowFontScaling={false}
                >
                  Productos ({totalProductos})
                </Text>
                <Text
                  style={[styles.summaryValue, { color: DISENO.colors.text, fontSize: tamanos.summaryValueSize }]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(total)}
                </Text>
              </View>

              {!calculandoEnvio && (
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: DISENO.colors.textSecondary, fontSize: tamanos.summaryLabelSize }]}
                    allowFontScaling={false}
                  >
                    {envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel
                      ? '🚚 Envío '
                      : '🚚 Envío'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: DISENO.colors.text, fontSize: tamanos.summaryValueSize },
                        (envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel) && {
                          color: DISENO.colors.success,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      {envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel
                        ? 'GRATIS'
                        : envioDisponible
                          ? formatearPrecio(costoEnvioEstimado)
                          : mensajeEnvio || '$0'}
                    </Text>
                  </View>
                </View>
              )}

              {descuentoNivel > 0 && (
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: DISENO.colors.success, fontSize: tamanos.summaryLabelSize }]}
                    allowFontScaling={false}
                  >
                    🏆 Descuento {nivel?.nombre || ''}
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: DISENO.colors.success, fontSize: tamanos.summaryValueSize }]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoNivel)}
                  </Text>
                </View>
              )}

              {descuentoPuntos > 0 && (
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: DISENO.colors.success, fontSize: tamanos.summaryLabelSize }]}
                    allowFontScaling={false}
                  >
                    🎯 Descuento por puntos
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: DISENO.colors.success, fontSize: tamanos.summaryValueSize }]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoPuntos)}
                  </Text>
                </View>
              )}

              {descuentoCupon > 0 && (
                <View style={styles.summaryRow}>
                  <Text
                    style={[styles.summaryLabel, { color: DISENO.colors.success, fontSize: tamanos.summaryLabelSize }]}
                    allowFontScaling={false}
                  >
                    🎟️ Descuento cupón
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: DISENO.colors.success, fontSize: tamanos.summaryValueSize }]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoCupon)}
                  </Text>
                </View>
              )}

              {cuponPuntosAplicado && (
                <View
                  style={[
                    styles.cuponAplicado,
                    {
                      backgroundColor: DISENO.colors.success + '15',
                      borderColor: DISENO.colors.success + '20',
                      borderRadius: tamanos.cuponRadius,
                      paddingHorizontal: tamanos.cuponPaddingH,
                      paddingVertical: tamanos.cuponPaddingV,
                    },
                  ]}
                >
                  <Text
                    style={[styles.cuponAplicadoText, { color: DISENO.colors.success, fontSize: tamanos.cuponTextSize }]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {cuponPuntosAplicado.recompensas?.nombre}
                  </Text>
                  <TouchableOpacity onPress={quitarDescuento} activeOpacity={0.7}>
                    <Ionicons
                      name="close-circle"
                      size={tamanos.cuponIconSize}
                      color={DISENO.colors.accent}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {cuponAplicado && (
                <View
                  style={[
                    styles.cuponAplicado,
                    {
                      backgroundColor: DISENO.colors.success + '15',
                      borderColor: DISENO.colors.success + '20',
                      borderRadius: tamanos.cuponRadius,
                      paddingHorizontal: tamanos.cuponPaddingH,
                      paddingVertical: tamanos.cuponPaddingV,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.cuponAplicadoText, { color: DISENO.colors.success, fontSize: tamanos.cuponTextSize }]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      🎟️ {cuponAplicado.codigo || 'Cupón aplicado'}
                    </Text>
                    <Text
                      style={[
                        styles.cuponAplicadoSubtext,
                        { color: DISENO.colors.textSecondary, fontSize: tamanos.cuponSubtextSize },
                      ]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {cuponAplicado.titulo || 'Cupón disponible'}
                      {cuponEsEnvioGratis ? ' · Envío gratis' : ''}
                      {cuponEsDescuento && cuponAplicado.es_porcentaje
                        ? ` · ${cuponAplicado.valor_descuento}% de descuento`
                        : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setCuponAplicado(null)} activeOpacity={0.7}>
                    <Ionicons
                      name="close-circle"
                      size={tamanos.cuponIconSize}
                      color={DISENO.colors.accent}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {mostrarAhorro && (
                <View
                  style={[
                    styles.ahorroContainer,
                    {
                      backgroundColor: DISENO.colors.success + '12',
                      borderColor: DISENO.colors.success + '30',
                      paddingVertical: tamanos.ahorroPaddingV,
                      paddingHorizontal: tamanos.ahorroPaddingH,
                      borderRadius: tamanos.ahorroRadius,
                      marginTop: 8,
                      marginBottom: 6,
                    },
                  ]}
                >
                  <Text style={{ fontSize: tamanos.ahorroEmojiSize }} allowFontScaling={false}>
                    🎉
                  </Text>
                  <Text
                    style={[
                      styles.ahorroTexto,
                      { fontSize: tamanos.ahorroTextoSize, color: DISENO.colors.success },
                    ]}
                    allowFontScaling={false}
                  >
                    ¡Ahorrás {formatearPrecio(ahorroTotal)}!
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text
                  style={[styles.totalLabel, { color: DISENO.colors.text, fontSize: tamanos.totalLabelSize }]}
                  allowFontScaling={false}
                >
                  Total
                </Text>
                <Text
                  style={[styles.totalPrice, { color: DISENO.colors.accent, fontSize: tamanos.totalPriceSize }]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(totalFinal)}
                </Text>
              </View>
            </View>

            {/* BOTÓN CHECKOUT */}
            <TouchableOpacity
              style={[styles.checkoutButton, { borderRadius: tamanos.checkoutRadius }]}
              onPress={() => {
                if (!perfil || !perfil.id) {
                  setMostrarModalLogin(true);
                  return;
                }
                props.navigation.navigate('Checkout', {
                  cuponPuntosAplicado,
                  cuponAplicado,
                  ubicacionGuardada,
                });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                style={[styles.checkoutButtonGradient, { paddingVertical: tamanos.checkoutPaddingV }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cart" size={tamanos.checkoutIconSize} color={DISENO.colors.text} />
                <Text
                  style={[
                    styles.checkoutButtonText,
                    { fontSize: tamanos.checkoutTextSize, color: DISENO.colors.text },
                  ]}
                  allowFontScaling={false}
                >
                  Finalizar compra
                </Text>
                <View
                  style={[
                    styles.checkoutPrice,
                    {
                      backgroundColor: DISENO.colors.text + '15',
                      paddingHorizontal: tamanos.checkoutPricePaddingH,
                      paddingVertical: tamanos.checkoutPricePaddingV,
                      borderRadius: tamanos.checkoutPriceRadius,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.checkoutPriceText,
                      { fontSize: tamanos.checkoutPriceTextSize, color: DISENO.colors.text },
                    ]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(totalFinal)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* VACIAR CARRITO */}
            <TouchableOpacity
              style={[styles.emptyCartButton, { paddingVertical: tamanos.vaciarPaddingV }]}
              onPress={vaciarCarrito}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.emptyCartText,
                  { fontSize: tamanos.vaciarTextSize, color: DISENO.colors.textTertiary },
                ]}
                allowFontScaling={false}
              >
                Vaciar carrito
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL LOGIN */}
      <Modal visible={mostrarModalLogin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: DISENO.colors.surface,
                borderColor: DISENO.colors.border,
                borderWidth: 1,
                borderRadius: tamanos.modalLoginRadius,
                padding: tamanos.modalLoginPadding,
                ...DISENO.shadow.lg,
              },
            ]}
          >
            <Text style={{ fontSize: tamanos.modalLoginIconSize, marginBottom: 12 }} allowFontScaling={false}>
              🔐
            </Text>
            <Text
              style={[styles.modalTitle, { fontSize: tamanos.modalLoginTitleSize, color: DISENO.colors.text }]}
              allowFontScaling={false}
            >
              Necesitás una cuenta
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: DISENO.colors.textSecondary, fontSize: tamanos.modalLoginTextSize },
              ]}
              allowFontScaling={false}
            >
              Para hacer tu pedido tenés que iniciar sesión o registrarte.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancel,
                  {
                    backgroundColor: DISENO.colors.surfaceHover,
                    borderColor: DISENO.colors.border,
                    paddingVertical: tamanos.modalLoginButtonPaddingV,
                    borderRadius: tamanos.modalLoginButtonRadius,
                  },
                ]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: DISENO.colors.textSecondary, fontSize: tamanos.modalLoginButtonTextSize },
                  ]}
                  allowFontScaling={false}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  {
                    backgroundColor: DISENO.colors.accentSecondary,
                    paddingVertical: tamanos.modalLoginButtonPaddingV,
                    borderRadius: tamanos.modalLoginButtonRadius,
                  },
                ]}
                onPress={() => {
                  setMostrarModalLogin(false);
                  props.navigation.navigate('Login');
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-in"
                  size={tamanos.modalLoginButtonIconSize}
                  color={DISENO.colors.text}
                />
                <Text
                  style={[
                    styles.modalConfirmText,
                    { color: DISENO.colors.text, fontSize: tamanos.modalLoginButtonTextSize },
                  ]}
                  allowFontScaling={false}
                >
                  Ingresar
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ marginTop: 14, paddingVertical: 8 }}
              onPress={() => {
                setMostrarModalLogin(false);
                props.navigation.navigate('Registro');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: FUENTES.regular,
                  fontSize: tamanos.modalLoginLinkSize,
                  color: DISENO.colors.accent,
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                ¿No tenés cuenta? Registrate gratis
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PUNTOS */}
      <Modal visible={mostrarModalPuntos} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalPuntos,
              {
                backgroundColor: DISENO.colors.surface,
                borderColor: DISENO.colors.border,
                borderRadius: tamanos.modalPuntosRadius,
                width: tamanos.modalPuntosWidth,
                maxWidth: 450,
                padding: tamanos.modalPuntosPadding,
                borderWidth: 1,
                alignSelf: 'center',
                ...DISENO.shadow.lg,
              },
            ]}
          >
            <View style={{ marginBottom: 4 }}>
              <Text
                style={[
                  styles.modalPuntosTitle,
                  {
                    fontSize: tamanos.modalPuntosTitleSize,
                    color: DISENO.colors.text,
                    textAlign: 'center',
                  },
                ]}
                allowFontScaling={false}
              >
                ⭐ Canjear Puntos
              </Text>
              <Text
                style={[
                  styles.modalPuntosSubtitle,
                  {
                    fontSize: tamanos.modalPuntosSubtitleSize,
                    color: DISENO.colors.textSecondary,
                    textAlign: 'center',
                    marginBottom: 12,
                  },
                ]}
                allowFontScaling={false}
              >
                Ingresá cuántos puntos querés canjear
              </Text>
            </View>

            <View
              style={{
                backgroundColor: DISENO.colors.accentSecondary + '08',
                borderRadius: tamanos.modalPuntosInfoRadius,
                padding: tamanos.modalPuntosInfoPadding,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: DISENO.colors.accentSecondary + '20',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoLabelSize,
                    color: DISENO.colors.textSecondary,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Puntos disponibles
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoValueSize,
                    color: DISENO.colors.accentSecondary,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {puntosMaximos} pts
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoLabelSize,
                    color: DISENO.colors.textSecondary,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Máximo canjeable
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoValueSize,
                    color: DISENO.colors.accent,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {Math.min(puntosMaximos, puntosMaximosPermitidos)} pts
                </Text>
              </View>
            </View>

            <View style={{ width: '100%', marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: tamanos.modalPuntosInputLabelSize,
                  color: DISENO.colors.textSecondary,
                  marginBottom: 6,
                  fontWeight: '500',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Cantidad de puntos
              </Text>
              <View
                style={{
                  borderColor: DISENO.colors.border,
                  backgroundColor: DISENO.colors.surfaceHover,
                  borderRadius: tamanos.modalPuntosInputRadius,
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: tamanos.modalPuntosInputBtnPaddingH,
                    paddingVertical: tamanos.modalPuntosInputBtnPaddingV,
                    backgroundColor: DISENO.colors.surface,
                    borderRightWidth: 1,
                    borderRightColor: DISENO.colors.border,
                    borderTopLeftRadius: tamanos.modalPuntosInputRadius,
                    borderBottomLeftRadius: tamanos.modalPuntosInputRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const nuevo = Math.max(0, puntosSeleccionados - 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="remove"
                    size={tamanos.modalPuntosInputBtnIconSize}
                    color={DISENO.colors.text}
                  />
                </TouchableOpacity>

                <TextInput
                  style={{
                    fontSize: tamanos.modalPuntosInputFieldSize,
                    color: DISENO.colors.text,
                    paddingHorizontal: tamanos.modalPuntosInputFieldPaddingH,
                    paddingVertical: tamanos.modalPuntosInputFieldPaddingV,
                    flex: 1,
                    textAlign: 'center',
                    minWidth: 60,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  value={inputPuntos}
                  onChangeText={handleInputPuntos}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={DISENO.colors.textTertiary}
                  selectionColor={DISENO.colors.accent}
                  allowFontScaling={false}
                />

                <TouchableOpacity
                  style={{
                    paddingHorizontal: tamanos.modalPuntosInputBtnPaddingH,
                    paddingVertical: tamanos.modalPuntosInputBtnPaddingV,
                    backgroundColor: DISENO.colors.surface,
                    borderLeftWidth: 1,
                    borderLeftColor: DISENO.colors.border,
                    borderTopRightRadius: tamanos.modalPuntosInputRadius,
                    borderBottomRightRadius: tamanos.modalPuntosInputRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const nuevo = Math.min(
                      Math.min(puntosMaximos, puntosMaximosPermitidos),
                      puntosSeleccionados + 100,
                    );
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="add"
                    size={tamanos.modalPuntosInputBtnIconSize}
                    color={DISENO.colors.text}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: tamanos.modalPuntosHintSize,
                  color: DISENO.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 6,
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                💡 Máximo 25% del total ({puntosMaximosPermitidos} pts ={' '}
                {formatearPrecio(Math.floor(puntosMaximosPermitidos / 100) * 100)})
              </Text>
            </View>

            {puntosSeleccionados > 0 && (
              <View
                style={{
                  backgroundColor: DISENO.colors.accentSecondary + '08',
                  borderRadius: tamanos.modalPuntosDescuentoRadius,
                  padding: tamanos.modalPuntosDescuentoPadding,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: DISENO.colors.accentSecondary + '20',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosDescuentoLabelSize,
                    color: DISENO.colors.text,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  💰 Descuento:
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosDescuentoValueSize,
                    color: DISENO.colors.accent,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {formatearPrecio(Math.floor(puntosSeleccionados / 100) * 100)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: tamanos.modalPuntosBotonesPaddingV,
                  borderRadius: tamanos.modalPuntosBotonesRadius,
                  alignItems: 'center',
                  backgroundColor: DISENO.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor: DISENO.colors.border,
                }}
                onPress={cancelarCanje}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: DISENO.colors.textSecondary,
                    fontWeight: '600',
                    fontSize: tamanos.modalPuntosBotonesTextSize,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: tamanos.modalPuntosBotonesPaddingV,
                  borderRadius: tamanos.modalPuntosBotonesRadius,
                  alignItems: 'center',
                  backgroundColor:
                    puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                      ? DISENO.colors.accentSecondary
                      : DISENO.colors.surfaceHover,
                  borderWidth: 1,
                  borderColor:
                    puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                      ? DISENO.colors.accentSecondary
                      : DISENO.colors.border,
                }}
                onPress={canjearPuntos}
                disabled={canjeandoPuntos || puntosSeleccionados < MINIMO_PUNTOS_CANJE}
                activeOpacity={0.7}
              >
                {canjeandoPuntos ? (
                  <ActivityIndicator size="small" color={DISENO.colors.text} />
                ) : (
                  <Text
                    style={{
                      color:
                        puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                          ? DISENO.colors.text
                          : DISENO.colors.textTertiary,
                      fontWeight: 'bold',
                      fontSize: tamanos.modalPuntosBotonesTextSize,
                      fontFamily: FUENTES.display,
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    {puntosSeleccionados < MINIMO_PUNTOS_CANJE
                      ? `Mínimo ${MINIMO_PUNTOS_CANJE} pts`
                      : '✅ Canjear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {puntosSeleccionados < MINIMO_PUNTOS_CANJE && puntosSeleccionados > 0 && (
              <Text
                style={{
                  fontSize: tamanos.modalPuntosMinimoSize,
                  color: DISENO.colors.accent,
                  textAlign: 'center',
                  marginTop: 8,
                  fontWeight: '500',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                ⚠️ Mínimo {MINIMO_PUNTOS_CANJE} puntos ({formatearPrecio(MINIMO_PUNTOS_CANJE)} de descuento)
              </Text>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 24,
  },
  emptySubtext: {
    fontFamily: FUENTES.regular,
    marginTop: 8,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  cuponVacioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginTop: 20,
    marginBottom: 4,
    gap: 10,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.accent + '30',
    ...DISENO.shadow.sm,
  },
  cuponVacioContenido: { flex: 1 },
  cuponVacioTitulo: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 16,
  },
  cuponVacioDetalle: {
    fontFamily: FUENTES.regular,
    marginTop: 3,
    color: DISENO.colors.textSecondary,
    lineHeight: 16,
    includeFontPadding: false,
  },
  emptyButton: { marginTop: 24, overflow: 'hidden', ...DISENO.shadow.md },
  emptyButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyButtonText: { fontFamily: FUENTES.display, fontWeight: '400', includeFontPadding: false },
  list: { flexGrow: 1 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1 },
  imagen: { marginRight: 10, backgroundColor: DISENO.colors.surfaceHover },
  imagenPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  itemInfo: { flex: 1 },
  itemNombre: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
    includeFontPadding: false,
    lineHeight: 18,
  },
  itemPrecioTotal: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 20,
  },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6 },
  botonControl: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  cantidad: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    minWidth: 24,
    textAlign: 'center',
    includeFontPadding: false,
  },
  botonEliminar: { padding: 4, marginLeft: 2 },
  footerContainer: { borderWidth: 1, marginBottom: 20 },
  avisoMinimo: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avisoMinimoTexto: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 18 },
  avisoMinimoSub: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 16 },
  summary: { marginBottom: 10, borderWidth: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 18 },
  summaryValue: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 22,
  },
  totalPrice: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 24,
  },
  cuponAplicado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    borderWidth: 1,
  },
  cuponAplicadoText: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    flex: 1,
    includeFontPadding: false,
    lineHeight: 16,
  },
  cuponAplicadoSubtext: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 14,
  },
  ahorroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  ahorroTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  checkoutButton: { overflow: 'hidden', marginBottom: 6, ...DISENO.shadow.md },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  checkoutPrice: {
    borderWidth: 1,
    borderColor: DISENO.colors.text + '10',
  },
  checkoutPriceText: { fontFamily: FUENTES.display, fontWeight: '400', includeFontPadding: false },
  emptyCartButton: { alignItems: 'center' },
  emptyCartText: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    opacity: 0.5,
    includeFontPadding: false,
  },
  puntosButton: { flex: 1 },
  puntosButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  puntosButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntosButtonRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  puntosButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
  },
  puntosButtonLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '600',
    marginLeft: 6,
    includeFontPadding: false,
  },
  modalPuntos: { alignSelf: 'center' },
  modalPuntosTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 24,
  },
  modalPuntosSubtitle: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 18,
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
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginBottom: 8,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 22,
  },
  modalText: {
    fontFamily: FUENTES.regular,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    includeFontPadding: false,
    lineHeight: 18,
  },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalCancel: { borderWidth: 1 },
  modalCancelText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
  },
  modalConfirm: { borderWidth: 1, borderColor: DISENO.colors.accentSecondary },
  modalConfirmText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
  },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  nivelBadgeTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
    includeFontPadding: false,
    lineHeight: 18,
  },
  nivelBadgeDetalle: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 14,
  },
});