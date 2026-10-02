// screens/cliente/PantallaPerfil.tsx - V4 RESPONSIVE + FIX IMAGEN + HOOK NOTIFICACIONES + USAR MI UBICACIÓN + FECHA NACIMIENTO
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';
import BarraProgreso from '../../components/BarraProgreso';
import { servicioEliminacionCuenta } from '../../services/servicioEliminacionCuenta';
import { useBeneficios } from '../../hooks/useBeneficios';
import { notificacionService } from '../../services/notificacionService';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { ActividadReciente, obtenerNivel, Perfil } from '../../lib/tipos';
import { FUENTES } from '../../lib/fuentes';

// ✅ Botón reutilizable de ubicación
import BotonUsarMiUbicacion from '../../components/BotonUsarMiUbicacion';
import { DireccionNormalizada } from '../../utils/ubicacionHelper';
import {
  formatearCumpleanosDDMM,
  parsearCumpleanosDDMM,
} from '../../utils/perfilOnboardingHelper';

// ============================================================
// 📋 TIPOS
// ============================================================
interface MenuItem {
  id: string;
  label: string;
  icono: string;
  color: string;
  navigate: string;
  show: boolean;
  subtitle?: string;
  requiereSesion?: boolean;
}

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosPerfil {
  padding: number;
  paddingTop: number;
  avatarSize: number;
  cameraIconSize: number;
  cameraIconRadius: number;
  cameraIconInnerSize: number;
  avatarBorderWidth: number;
  nombreSize: number;
  correoSize: number;
  pointsIconSize: number;
  pointsTextSize: number;
  levelBadgePaddingH: number;
  levelBadgePaddingV: number;
  levelBadgeRadius: number;
  levelTextSize: number;
  barraProgresoAltura: number;
  beneficiosPadding: number;
  beneficiosRadius: number;
  beneficiosTitleSize: number;
  beneficioIconSize: number;
  beneficioIconContainerSize: number;
  beneficioTextSize: number;
  statPaddingV: number;
  statValorSize: number;
  statLabelSize: number;
  seccionPaddingH: number;
  seccionPaddingV: number;
  seccionRadius: number;
  seccionMarginTop: number;
  seccionTituloSize: number;
  actividadItemPaddingV: number;
  actividadIconContainer: number;
  actividadIconSize: number;
  actividadDescSize: number;
  actividadFechaSize: number;
  historialItemPaddingV: number;
  historialIconContainer: number;
  historialIconSize: number;
  historialDescSize: number;
  historialFechaSize: number;
  historialCantidadSize: number;
  infoTituloSize: number;
  infoEditButtonPaddingH: number;
  infoEditButtonPaddingV: number;
  infoEditButtonTextSize: number;
  infoRowPaddingV: number;
  infoIconSize: number;
  infoTextSize: number;
  formLabelSize: number;
  formInputSize: number;
  formInputPaddingH: number;
  formInputPaddingV: number;
  formInputRadius: number;
  formGap: number;
  formTextAreaMinHeight: number;
  saveButtonPaddingV: number;
  saveButtonRadius: number;
  saveButtonTextSize: number;
  canjeItemPaddingV: number;
  canjeIconContainer: number;
  canjeEmojiSize: number;
  canjeNombreSize: number;
  canjeDetalleSize: number;
  canjeFechaSize: number;
  menuItemPaddingV: number;
  menuItemPaddingH: number;
  menuItemRadius: number;
  menuIconContainer: number;
  menuIconSize: number;
  menuLabelSize: number;
  menuSubtitleSize: number;
  menuChevronSize: number;
  menuBadgeSize: number;
  menuBadgeTextSize: number;
  logoutButtonPaddingV: number;
  logoutButtonPaddingH: number;
  logoutButtonRadius: number;
  logoutIconSize: number;
  logoutTextSize: number;
  modalPadding: number;
  modalRadius: number;
  modalIconSize: number;
  modalTitleSize: number;
  modalTextSize: number;
  modalButtonPaddingV: number;
  modalButtonRadius: number;
  modalButtonTextSize: number;
  notifPrefRowPaddingV: number;
  notifPrefTitleSize: number;
  notifPrefDescSize: number;
  notifPrefBtnPaddingH: number;
  notifPrefBtnPaddingV: number;
  notifPrefBtnRadius: number;
  notifPrefBtnTextSize: number;
  fotoCerrarSize: number;
  fotoCerrarIconSize: number;
  fotoCambiarPaddingH: number;
  fotoCambiarPaddingV: number;
  fotoCambiarRadius: number;
  fotoCambiarIconSize: number;
  fotoCambiarTextSize: number;
  guestIconSize: number;
  guestTextSize: number;
  guestSubTextSize: number;
  loginGuestPaddingV: number;
  loginGuestPaddingH: number;
  loginGuestRadius: number;
  loginGuestTextSize: number;
  loginGuestIconSize: number;
}

const calcularTamanosPerfil = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,
): TamanosPerfil => {
  const padding = isDesktop ? 40 : isTablet ? 32 : isSmallPhone ? 14 : 18;
  const paddingTop = isDesktop ? 30 : isTablet ? 26 : isSmallPhone ? 16 : 20;

  const anchoUtil = width - padding * 2;
  const avatarBase = anchoUtil * 0.35;
  const avatarSize = isDesktop
    ? Math.min(avatarBase, 200)
    : isTablet
      ? Math.min(avatarBase, 180)
      : isSmallPhone
        ? Math.min(avatarBase, 120)
        : Math.min(avatarBase, 140);

  const cameraIconSize = isDesktop ? 48 : isTablet ? 46 : isSmallPhone ? 34 : 38;
  const cameraIconRadius = cameraIconSize / 2;
  const cameraIconInnerSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 16 : 18;
  const avatarBorderWidth = isDesktop ? 5 : isSmallPhone ? 3 : 4;

  const nombreSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 18 : 21;
  const correoSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const pointsIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 17;
  const pointsTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;

  const levelBadgePaddingH = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 12 : 16;
  const levelBadgePaddingV = isDesktop ? 8 : isTablet ? 7 : isSmallPhone ? 5 : 6;
  const levelBadgeRadius = isDesktop ? 24 : isSmallPhone ? 14 : 18;
  const levelTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const barraProgresoAltura = isSmallPhone ? 5 : 6;

  const beneficiosPadding = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const beneficiosRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const beneficiosTitleSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 12;
  const beneficioIconSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const beneficioIconContainerSize = isDesktop ? 36 : isTablet ? 34 : isSmallPhone ? 28 : 32;
  const beneficioTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;

  const statPaddingV = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const statValorSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const statLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 10 : 11;

  const seccionPaddingH = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const seccionPaddingV = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const seccionRadius = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 12 : 14;
  const seccionMarginTop = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const seccionTituloSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;

  const actividadItemPaddingV = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const actividadIconContainer = isDesktop ? 40 : isTablet ? 38 : isSmallPhone ? 30 : 34;
  const actividadIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 18;
  const actividadDescSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const actividadFechaSize = isDesktop ? 11 : isSmallPhone ? 9 : 10;

  const historialItemPaddingV = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const historialIconContainer = isDesktop ? 40 : isTablet ? 38 : isSmallPhone ? 30 : 34;
  const historialIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const historialDescSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const historialFechaSize = isDesktop ? 11 : isSmallPhone ? 9 : 10;
  const historialCantidadSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;

  const infoTituloSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const infoEditButtonPaddingH = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const infoEditButtonPaddingV = isDesktop ? 6 : isSmallPhone ? 4 : 5;
  const infoEditButtonTextSize = isDesktop ? 13 : isSmallPhone ? 11 : 12;
  const infoRowPaddingV = isDesktop ? 6 : isSmallPhone ? 4 : 5;
  const infoIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const infoTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;

  const formLabelSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const formInputSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const formInputPaddingH = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const formInputPaddingV = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const formInputRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const formGap = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const formTextAreaMinHeight = isDesktop ? 90 : isSmallPhone ? 70 : 80;
  const saveButtonPaddingV = isDesktop ? 16 : isSmallPhone ? 12 : 14;
  const saveButtonRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const saveButtonTextSize = isDesktop ? 15 : isSmallPhone ? 12 : 13;

  const canjeItemPaddingV = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const canjeIconContainer = isDesktop ? 40 : isSmallPhone ? 30 : 34;
  const canjeEmojiSize = isDesktop ? 20 : isSmallPhone ? 16 : 18;
  const canjeNombreSize = isDesktop ? 13 : isSmallPhone ? 11 : 12;
  const canjeDetalleSize = isDesktop ? 11 : isSmallPhone ? 9 : 10;
  const canjeFechaSize = isDesktop ? 10 : isSmallPhone ? 8 : 9;

  const menuItemPaddingV = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 11 : 13;
  const menuItemPaddingH = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const menuItemRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const menuIconContainer = isDesktop ? 44 : isTablet ? 42 : isSmallPhone ? 34 : 38;
  const menuIconSize = isDesktop ? 22 : isTablet ? 21 : isSmallPhone ? 18 : 19;
  const menuLabelSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 12.5;
  const menuSubtitleSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const menuChevronSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const menuBadgeSize = isDesktop ? 20 : isSmallPhone ? 16 : 18;
  const menuBadgeTextSize = isDesktop ? 10 : isSmallPhone ? 8 : 9;

  const logoutButtonPaddingV = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const logoutButtonPaddingH = isDesktop ? 28 : isSmallPhone ? 20 : 24;
  const logoutButtonRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const logoutIconSize = isDesktop ? 22 : isSmallPhone ? 18 : 20;
  const logoutTextSize = isDesktop ? 14 : isSmallPhone ? 12 : 13;

  const modalPadding = isDesktop ? 32 : isTablet ? 28 : isSmallPhone ? 20 : 24;
  const modalRadius = isDesktop ? 24 : isSmallPhone ? 18 : 20;
  const modalIconSize = isDesktop ? 48 : isSmallPhone ? 36 : 42;
  const modalTitleSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 18;
  const modalTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const modalButtonPaddingV = isDesktop ? 14 : isSmallPhone ? 11 : 12;
  const modalButtonRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const modalButtonTextSize = isDesktop ? 14 : isSmallPhone ? 12 : 13;

  const notifPrefRowPaddingV = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const notifPrefTitleSize = isDesktop ? 14 : isSmallPhone ? 12 : 13;
  const notifPrefDescSize = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const notifPrefBtnPaddingH = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const notifPrefBtnPaddingV = isDesktop ? 9 : isSmallPhone ? 7 : 8;
  const notifPrefBtnRadius = isDesktop ? 10 : isSmallPhone ? 8 : 9;
  const notifPrefBtnTextSize = isDesktop ? 13 : isSmallPhone ? 11 : 12;

  const fotoCerrarSize = isDesktop ? 52 : isTablet ? 48 : isSmallPhone ? 40 : 44;
  const fotoCerrarIconSize = isDesktop ? 32 : isTablet ? 30 : isSmallPhone ? 24 : 28;
  const fotoCambiarPaddingH = isDesktop ? 24 : isSmallPhone ? 16 : 20;
  const fotoCambiarPaddingV = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const fotoCambiarRadius = isDesktop ? 28 : isSmallPhone ? 20 : 24;
  const fotoCambiarIconSize = isDesktop ? 22 : isSmallPhone ? 18 : 20;
  const fotoCambiarTextSize = isDesktop ? 15 : isSmallPhone ? 13 : 14;

  const guestIconSize = isDesktop ? 50 : isTablet ? 48 : isSmallPhone ? 36 : 42;
  const guestTextSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const guestSubTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const loginGuestPaddingV = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const loginGuestPaddingH = isDesktop ? 20 : isSmallPhone ? 14 : 16;
  const loginGuestRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const loginGuestTextSize = isDesktop ? 15 : isSmallPhone ? 12 : 13;
  const loginGuestIconSize = isDesktop ? 20 : isSmallPhone ? 16 : 18;

  return {
    padding, paddingTop,
    avatarSize, cameraIconSize, cameraIconRadius, cameraIconInnerSize, avatarBorderWidth,
    nombreSize, correoSize, pointsIconSize, pointsTextSize,
    levelBadgePaddingH, levelBadgePaddingV, levelBadgeRadius, levelTextSize, barraProgresoAltura,
    beneficiosPadding, beneficiosRadius, beneficiosTitleSize, beneficioIconSize, beneficioIconContainerSize, beneficioTextSize,
    statPaddingV, statValorSize, statLabelSize,
    seccionPaddingH, seccionPaddingV, seccionRadius, seccionMarginTop, seccionTituloSize,
    actividadItemPaddingV, actividadIconContainer, actividadIconSize, actividadDescSize, actividadFechaSize,
    historialItemPaddingV, historialIconContainer, historialIconSize, historialDescSize, historialFechaSize, historialCantidadSize,
    infoTituloSize, infoEditButtonPaddingH, infoEditButtonPaddingV, infoEditButtonTextSize,
    infoRowPaddingV, infoIconSize, infoTextSize,
    formLabelSize, formInputSize, formInputPaddingH, formInputPaddingV, formInputRadius, formGap,
    formTextAreaMinHeight, saveButtonPaddingV, saveButtonRadius, saveButtonTextSize,
    canjeItemPaddingV, canjeIconContainer, canjeEmojiSize, canjeNombreSize, canjeDetalleSize, canjeFechaSize,
    menuItemPaddingV, menuItemPaddingH, menuItemRadius,
    menuIconContainer, menuIconSize, menuLabelSize, menuSubtitleSize, menuChevronSize, menuBadgeSize, menuBadgeTextSize,
    logoutButtonPaddingV, logoutButtonPaddingH, logoutButtonRadius, logoutIconSize, logoutTextSize,
    modalPadding, modalRadius, modalIconSize, modalTitleSize, modalTextSize, modalButtonPaddingV, modalButtonRadius, modalButtonTextSize,
    notifPrefRowPaddingV, notifPrefTitleSize, notifPrefDescSize,
    notifPrefBtnPaddingH, notifPrefBtnPaddingV, notifPrefBtnRadius, notifPrefBtnTextSize,
    fotoCerrarSize, fotoCerrarIconSize, fotoCambiarPaddingH, fotoCambiarPaddingV, fotoCambiarRadius, fotoCambiarIconSize, fotoCambiarTextSize,
    guestIconSize, guestTextSize, guestSubTextSize,
    loginGuestPaddingV, loginGuestPaddingH, loginGuestRadius, loginGuestTextSize, loginGuestIconSize,
  };
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion, actualizarPerfil, cargarPerfil } = tiendaAutenticacion();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isSmallPhone = screenWidth < 375;

  const tamanos = useMemo(
    () => calcularTamanosPerfil(screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone),
    [screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone],
  );

  const { nivel, beneficios } = useBeneficios(perfil?.puntos_acumulados || 0, perfil?.id);

  const {
    notificacionesPermitidas,
    verificarPermisosNotificaciones,
    activarNotificaciones,
  } = useNotificaciones();

  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPreferenciasNotificaciones, setMostrarPreferenciasNotificaciones] = useState(false);
  const [guardandoPreferenciasNotificaciones, setGuardandoPreferenciasNotificaciones] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
  const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [mostrarFotoCompleta, setMostrarFotoCompleta] = useState(false);

  const [totalGastado, setTotalGastado] = useState(0);
  const [totalCanjes, setTotalCanjes] = useState(0);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ultimosCanjes, setUltimosCanjes] = useState<any[]>([]);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [historialPuntos, setHistorialPuntos] = useState<any[]>([]);

  const [telefono, setTelefono] = useState('');
  const [direccionCalle, setDireccionCalle] = useState('');
  const [direccionNumero, setDireccionNumero] = useState('');
  const [direccionPiso, setDireccionPiso] = useState('');
  const [direccionDepartamento, setDireccionDepartamento] = useState('');
  const [direccionBarrio, setDireccionBarrio] = useState('');
  const [direccionCiudad, setDireccionCiudad] = useState('');
  const [direccionCodigoPostal, setDireccionCodigoPostal] = useState('');
  const [preferenciasComida, setPreferenciasComida] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [cumpleanos, setCumpleanos] = useState('');
  const [geocodificando, setGeocodificando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    if (perfil?.id) {
      cargarTotalPedidos();
      cargarDatosPerfil();
      cargarEstadisticas();
      cargarNotificacionesNoLeidas();
      cargarHistorialPuntos();
      if (perfil.avatar_url) setImagenPerfil(perfil.avatar_url);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [perfil]);

  useFocusEffect(
    useCallback(() => {
      if (perfil?.id) {
        cargarPerfil(perfil.id);
        cargarNotificacionesNoLeidas();
        cargarHistorialPuntos();
      }
      verificarPermisosNotificaciones();
    }, [perfil?.id]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        verificarPermisosNotificaciones();
      }
    });
    return () => subscription.remove();
  }, []);

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  const cargarNotificacionesNoLeidas = async () => {
    if (!perfil?.id) return;
    try {
      const noLeidas = await notificacionService.obtenerNotificaciones(perfil.id, true);
      setNotificacionesNoLeidas(noLeidas.length);
    } catch {
      setNotificacionesNoLeidas(0);
    }
  };

  const cambiarConsentimientoPromociones = async (acepta: boolean) => {
    if (!perfil?.id || guardandoPreferenciasNotificaciones) return;
    setGuardandoPreferenciasNotificaciones(true);
    const resultado = await actualizarPerfil({ acepta_promociones: acepta });
    setGuardandoPreferenciasNotificaciones(false);
    if (!resultado.success) {
      Alert.alert('No se pudo guardar', resultado.error || 'Intentalo de nuevo más tarde.');
    }
  };

  const activarNotificacionesHandler = async () => {
    const ok = await activarNotificaciones();
    if (ok) {
      await verificarPermisosNotificaciones();
    }
  };

  const cargarHistorialPuntos = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('historial_puntos')
        .select('*')
        .eq('usuario_id', perfil.id)
        .order('fecha', { ascending: false })
        .limit(15);
      if (error) throw error;
      setHistorialPuntos(data || []);
    } catch {
      setHistorialPuntos([]);
    }
  };

  const cargarDatosPerfil = () => {
    if (perfil) {
      setTelefono(perfil.telefono || '');
      setDireccionCalle(perfil.direccion_calle || '');
      setDireccionNumero(perfil.direccion_numero || '');
      setDireccionPiso(perfil.direccion_piso || '');
      setDireccionDepartamento(perfil.direccion_departamento || '');
      setDireccionBarrio(perfil.direccion_barrio || '');
      setDireccionCiudad(perfil.direccion_ciudad || '');
      setDireccionCodigoPostal(perfil.direccion_codigo_postal || '');
      setPreferenciasComida(perfil.preferencias_comida || '');
      setMetodoPago(perfil.metodo_pago || '');
      setCumpleanos(formatearCumpleanosDDMM((perfil as any)?.fecha_nacimiento));
    }
  };

  const cargarTotalPedidos = async () => {
    if (!perfil?.id) return;
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('id_de_usuario', perfil.id);
    setTotalPedidos(count || 0);
  };

  const cargarEstadisticas = async () => {
    if (!perfil?.id) return;
    setCargandoEstadisticas(true);
    try {
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('total, estado')
        .eq('id_de_usuario', perfil.id);
      if (pedidos) {
        const total = pedidos
          .filter((p) => p.estado === 'entregado')
          .reduce((sum, p) => sum + (p.total || 0), 0);
        setTotalGastado(total);
        setTotalPedidos(pedidos.length);
      }
      const { count: canjesCount } = await supabase
        .from('canjes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', perfil.id);
      setTotalCanjes(canjesCount || 0);
      const { data: canjes } = await supabase
        .from('canjes')
        .select(`id, puntos_usados, usado_en_pedido, created_at, recompensas (nombre, tipo, valor_descuento)`)
        .eq('usuario_id', perfil.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (canjes) {
        const canjesMapeados = canjes.map((c: any) => ({
          id: c.id,
          puntos_usados: c.puntos_usados,
          usado_en_pedido: c.usado_en_pedido,
          created_at: c.created_at,
          recompensas: c.recompensas && c.recompensas.length > 0 ? c.recompensas[0] : null,
        }));
        setUltimosCanjes(canjesMapeados);
      }
      await cargarActividadReciente();
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const cargarActividadReciente = async () => {
    if (!perfil?.id) return;
    try {
      const actividades: ActividadReciente[] = [];
      const { data: pedidosRecientes } = await supabase
        .from('pedidos')
        .select('id, estado, total, creado_en')
        .eq('id_de_usuario', perfil.id)
        .order('creado_en', { ascending: false })
        .limit(3);
      if (pedidosRecientes) {
        pedidosRecientes.forEach((p: any) => {
          const estadoMap: Record<string, { icono: string; texto: string; color: string }> = {
            entregado: { icono: 'checkmark-circle', texto: '✅ Entregado', color: DISENO.colors.success },
            pendiente: { icono: 'time', texto: '⏳ Pendiente', color: DISENO.colors.accentSecondary },
            confirmado: { icono: 'checkmark-circle-outline', texto: '✅ Confirmado', color: DISENO.colors.info },
            preparando: { icono: 'restaurant', texto: '🍔 Preparando', color: DISENO.colors.warning },
            en_camino: { icono: 'bicycle', texto: '🚴 En camino', color: DISENO.colors.azul },
          };
          const estadoInfo = estadoMap[p.estado] || estadoMap.pendiente;
          actividades.push({
            id: `pedido-${p.id}`,
            tipo: 'pedido',
            descripcion: `Pedido #${String(p.id).slice(-4)} - ${estadoInfo.texto}`,
            fecha: p.creado_en,
            icono: estadoInfo.icono,
            color: estadoInfo.color,
          });
        });
      }
      const { data: canjesRecientes } = await supabase
        .from('canjes')
        .select('id, puntos_usados, created_at, recompensas(nombre)')
        .eq('usuario_id', perfil.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (canjesRecientes) {
        canjesRecientes.forEach((c: any) => {
          const nombreRecompensa =
            c.recompensas && c.recompensas.length > 0 ? c.recompensas[0]?.nombre : 'Recompensa';
          actividades.push({
            id: `canje-${c.id}`,
            tipo: 'canje',
            descripcion: `🎁 Canjeaste ${c.puntos_usados} pts por "${nombreRecompensa}"`,
            fecha: c.created_at,
            icono: 'gift',
            color: DISENO.colors.rosa,
          });
        });
      }
      actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setActividadesRecientes(actividades.slice(0, 5));
    } catch (error) {
      console.error('❌ Error cargando actividad reciente:', error);
    }
  };

  const manejarRefresh = async () => {
    setRefrescando(true);
    await Promise.all([
      cargarTotalPedidos(),
      cargarDatosPerfil(),
      cargarEstadisticas(),
      cargarNotificacionesNoLeidas(),
      cargarHistorialPuntos(),
    ]);
    setRefrescando(false);
  };

  // ============================================================
  // COORDENADAS
  // ============================================================
  const obtenerCoordenadasDesdeDireccion = async (
    calle: string,
    numero: string,
  ): Promise<{ lat: number | null; lng: number | null }> => {
    if (!calle || !numero) return { lat: null, lng: null };
    try {
      const direccionCompleta = `${calle} ${numero}`;
      const geocodeResultados = await Location.geocodeAsync(direccionCompleta);
      if (geocodeResultados && geocodeResultados.length > 0) {
        const { latitude, longitude } = geocodeResultados[0];
        return { lat: latitude, lng: longitude };
      }
      return { lat: null, lng: null };
    } catch (error) {
      console.error('❌ Error en geocodificación:', error);
      return { lat: null, lng: null };
    }
  };

  // ============================================================
  // ✅ Handler para "Usar mi ubicación actual" en Perfil
  // ============================================================
  const handleUbicacionPerfil = (direccion: DireccionNormalizada) => {
    console.log('📍 [Perfil] Ubicación obtenida:', direccion);

    setDireccionCalle(direccion.calle);
    setDireccionNumero(direccion.numero);
    setDireccionPiso(direccion.piso);
    setDireccionDepartamento(direccion.departamento);
    setDireccionBarrio(direccion.barrio);
    setDireccionCiudad(direccion.ciudad);
    setDireccionCodigoPostal(direccion.codigoPostal);

    Alert.alert(
      '📍 Dirección detectada',
      direccion.tieneDireccionReal
        ? `Detectamos:\n${direccion.direccionCompleta}\n\nRevisá los campos y presioná "Guardar cambios" para confirmar.`
        : 'Obtuvimos tus coordenadas pero no pudimos detectar la dirección exacta. Completala manualmente.',
      [{ text: 'Entendido' }],
    );
  };

  // ============================================================
  // ACTUALIZAR PERFIL
  // ============================================================
  const actualizarDatosPerfil = async () => {
    if (!perfil || !perfil.id) {
      Alert.alert('❌ Error', 'No se pudo identificar tu cuenta.');
      return;
    }
    if ((direccionCalle || direccionNumero) && (!direccionCalle || !direccionNumero)) {
      Alert.alert('⚠️️ Dirección incompleta', 'Si querés guardar una dirección, completá tanto la calle como el número.');
      return;
    }

    // Validar cumpleaños si lo cargó
    let fechaNacimientoISO: string | null = null;
    if (cumpleanos && cumpleanos.trim().length > 0) {
      fechaNacimientoISO = parsearCumpleanosDDMM(cumpleanos);
      if (!fechaNacimientoISO) {
        Alert.alert('⚠️ Fecha inválida', 'El cumpleaños debe tener el formato DD/MM. Por ejemplo: 14/05');
        return;
      }
    }

    setCargandoActualizacion(true);
    setGeocodificando(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (direccionCalle && direccionNumero) {
        const coordenadas = await obtenerCoordenadasDesdeDireccion(direccionCalle, direccionNumero);
        lat = coordenadas.lat;
        lng = coordenadas.lng;
      }

      const datosActualizados: any = {
        telefono: telefono || null,
        direccion_calle: direccionCalle || null,
        direccion_numero: direccionNumero || null,
        direccion_piso: direccionPiso || null,
        direccion_departamento: direccionDepartamento || null,
        direccion_barrio: direccionBarrio || null,
        direccion_ciudad: direccionCiudad || null,
        direccion_codigo_postal: direccionCodigoPostal || null,
        preferencias_comida: preferenciasComida || null,
        metodo_pago: metodoPago || null,
        fecha_nacimiento: fechaNacimientoISO,
      };

      if (lat !== null && lng !== null) {
        datosActualizados.lat_cliente = lat;
        datosActualizados.lng_cliente = lng;
      }

      const { error } = await supabase.from('perfiles').update(datosActualizados).eq('id', perfil.id);
      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
        return;
      }

      await actualizarPerfil({ ...perfil, ...datosActualizados });
      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setModoEdicion(false);
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setCargandoActualizacion(false);
      setGeocodificando(false);
    }
  };

  // ============================================================
  // 📷 IMÁGENES
  // ============================================================
  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImagenPerfil(uri);
        await subirImagenPerfil(uri);
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImagenPerfil(uri);
        await subirImagenPerfil(uri);
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const subirImagenPerfil = async (uri: string) => {
    if (!perfil?.id) return;
    setSubiendoImagen(true);

    try {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${perfil.id}.${ext}`;

      console.log('📤 [Perfil] Subiendo imagen:', { uri, fileName, contentType });

      const response = await fetch(uri);
      const blob = await response.blob();

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(fileName, arrayBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ [Perfil] Error al subir:', uploadError);
        Alert.alert('Error al subir imagen', uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage.from('perfiles').getPublicUrl(fileName);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ [Perfil] Error al actualizar perfil:', updateError);
        Alert.alert('Error al guardar', updateError.message);
        return;
      }

      await actualizarPerfil({ ...perfil, avatar_url: publicUrl });
      setImagenPerfil(publicUrl);

      Alert.alert('✅ Éxito', 'Foto de perfil actualizada');
    } catch (error: any) {
      console.error('❌ [Perfil] Error catastrófico:', error);
      Alert.alert('Error', `No se pudo subir la imagen: ${error.message || 'Desconocido'}`);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const mostrarOpcionesFoto = () => {
    Alert.alert('Cambiar foto de perfil', 'Selecciona una opción', [
      { text: '📷 Tomar foto', onPress: tomarFoto },
      { text: '🖼️ Elegir de galería', onPress: seleccionarImagen },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handlePressAvatar = () => {
    if (!perfil?.id) return;
    if (imagenPerfil) {
      setMostrarFotoCompleta(true);
    } else {
      mostrarOpcionesFoto();
    }
  };

  const confirmarCerrarSesion = async () => {
    setMostrarModal(false);
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const obtenerDireccionCompleta = () => {
    const partes: string[] = [];
    if (direccionCalle) partes.push(direccionCalle);
    if (direccionNumero) partes.push(direccionNumero);
    if (direccionPiso) partes.push(`Piso ${direccionPiso}`);
    if (direccionDepartamento) partes.push(`Depto ${direccionDepartamento}`);
    if (direccionBarrio) partes.push(direccionBarrio);
    if (direccionCiudad) partes.push(direccionCiudad);
    if (direccionCodigoPostal) partes.push(`CP ${direccionCodigoPostal}`);
    return partes.length > 0 ? partes.join(', ') : 'No especificada';
  };

  const nivelFallback = obtenerNivel(perfil?.puntos_acumulados || 0);
  const nivelActual = nivel || nivelFallback;

  // ============================================================
  // MENÚ ITEMS
  // ============================================================
  const menuItems: MenuItem[] = [
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icono: 'notifications-outline',
      color: DISENO.colors.azul,
      subtitle: notificacionesNoLeidas > 0 ? `${notificacionesNoLeidas} sin leer` : 'Ver notificaciones',
      navigate: 'NotificacionesUsuario',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'preferencias-notificaciones',
      label: 'Preferencias de notificaciones',
      icono: 'options-outline',
      color: DISENO.colors.accent,
      subtitle: 'Pedidos y promociones',
      navigate: '',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'pedidos',
      label: 'Mis Pedidos',
      icono: 'receipt-outline',
      color: DISENO.colors.success,
      navigate: 'Pedidos',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'cupones',
      label: 'Mis Cupones',
      icono: 'ticket-outline',
      color: DISENO.colors.accent,
      subtitle: 'Ver mis cupones disponibles',
      navigate: 'MisCupones',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: DISENO.colors.rosa,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'privacidad',
      label: '🔒 Privacidad',
      icono: 'lock-closed-outline',
      color: DISENO.colors.info,
      navigate: 'Privacidad',
      show: true,
      requiereSesion: false,
    },
    {
      id: 'terminos',
      label: '📋 Términos',
      icono: 'document-text-outline',
      color: DISENO.colors.textSecondary,
      navigate: 'Terminos',
      show: true,
      requiereSesion: false,
    },
  ];

  const handleNavigate = (item: MenuItem) => {
    if (item.requiereSesion && !sesion) {
      Alert.alert('Iniciá sesión', 'Necesitás una cuenta para acceder a esta sección.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => props.navigation.navigate('Login') },
        { text: 'Registrarme', onPress: () => props.navigation.navigate('Registro') },
      ]);
      return;
    }
    if (item.id === 'preferencias-notificaciones') {
      setMostrarPreferenciasNotificaciones(true);
      verificarPermisosNotificaciones();
      return;
    }
    if (item.id === 'pedidos') {
      props.navigation.navigate('Principal', { screen: 'Pedidos' });
    } else {
      props.navigation.navigate(item.navigate);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={DISENO.colors.accent}
            colors={[DISENO.colors.accent]}
          />
        }
      >
        <Animated.View
          style={[
            styles.header,
            {
              paddingHorizontal: tamanos.padding,
              paddingTop: insets.top + tamanos.paddingTop,
              paddingBottom: 16,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {/* AVATAR */}
          <View
            style={{
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              width: tamanos.avatarSize,
              height: tamanos.avatarSize,
            }}
          >
            <TouchableOpacity
              onPress={handlePressAvatar}
              activeOpacity={0.85}
              disabled={!perfil?.id}
              style={{ width: tamanos.avatarSize, height: tamanos.avatarSize }}
            >
              <View
                style={[
                  styles.avatarContainer,
                  {
                    width: tamanos.avatarSize,
                    height: tamanos.avatarSize,
                    borderRadius: tamanos.avatarSize / 2,
                    borderWidth: tamanos.avatarBorderWidth,
                  },
                ]}
              >
                {imagenPerfil ? (
                  <Image
                    source={{ uri: imagenPerfil }}
                    style={{
                      width: tamanos.avatarSize,
                      height: tamanos.avatarSize,
                      borderRadius: tamanos.avatarSize / 2,
                    }}
                  />
                ) : (
                  <Text
                    style={[styles.avatarEmoji, { fontSize: tamanos.avatarSize * 0.45 }]}
                    allowFontScaling={false}
                  >
                    {perfil?.nombre_cliente?.charAt(0)?.toUpperCase() || '🍔'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {perfil?.id && (
              <TouchableOpacity
                style={[
                  styles.cameraIcon,
                  {
                    width: tamanos.cameraIconSize,
                    height: tamanos.cameraIconSize,
                    borderRadius: tamanos.cameraIconRadius,
                    borderWidth: 3,
                    bottom: 4,
                    right: 4,
                  },
                ]}
                onPress={mostrarOpcionesFoto}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="camera"
                  size={tamanos.cameraIconInnerSize}
                  color={DISENO.colors.surface}
                />
              </TouchableOpacity>
            )}
          </View>

          {subiendoImagen && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={DISENO.colors.accent} />
              <Text style={styles.uploadingText} allowFontScaling={false}>
                Subiendo imagen...
              </Text>
            </View>
          )}

          <Text style={[styles.name, { fontSize: tamanos.nombreSize }]} allowFontScaling={false}>
            {perfil?.nombre_cliente || 'Invitado'}
          </Text>

          <Text style={[styles.email, { fontSize: tamanos.correoSize }]} allowFontScaling={false}>
            {perfil?.email || 'Inicia sesión para ver tus datos'}
          </Text>

          {perfil?.id ? (
            <>
              <View style={styles.pointsContainer}>
                <View style={styles.pointsWrapper}>
                  <Text style={{ fontSize: tamanos.pointsIconSize }} allowFontScaling={false}>
                    ⭐
                  </Text>
                  <Text
                    style={[styles.pointsText, { fontSize: tamanos.pointsTextSize }]}
                    allowFontScaling={false}
                  >
                    {perfil?.puntos_acumulados || 0} Krusty Points
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.levelBadge,
                  {
                    paddingHorizontal: tamanos.levelBadgePaddingH,
                    paddingVertical: tamanos.levelBadgePaddingV,
                    borderRadius: tamanos.levelBadgeRadius,
                    borderColor: nivelActual.color + '30',
                    width: '100%',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: nivelActual.color,
                      fontSize: tamanos.levelTextSize,
                      marginBottom: 4,
                    },
                  ]}
                  allowFontScaling={false}
                >
                  {nivelActual.icono} Nivel {nivelActual.nombre}
                  {nivelActual.siguiente !== '—' && ` → ${nivelActual.siguiente}`}
                </Text>

                <BarraProgreso
                  progreso={nivelActual.progreso}
                  color={nivelActual.color}
                  altura={tamanos.barraProgresoAltura}
                  label={`${Math.round(nivelActual.progreso)}%`}
                />
              </View>

              {beneficios && (
                <View
                  style={[
                    styles.beneficiosContainer,
                    {
                      padding: tamanos.beneficiosPadding,
                      borderRadius: tamanos.beneficiosRadius,
                    },
                  ]}
                >
                  <Text
                    style={[styles.beneficiosTitle, { fontSize: tamanos.beneficiosTitleSize }]}
                    allowFontScaling={false}
                  >
                    🎁 Beneficios de tu nivel
                  </Text>

                  <View style={styles.beneficioItem}>
                    <View
                      style={[
                        styles.beneficioIcon,
                        {
                          backgroundColor: DISENO.colors.accent + '15',
                          width: tamanos.beneficioIconContainerSize,
                          height: tamanos.beneficioIconContainerSize,
                          borderRadius: tamanos.beneficioIconContainerSize / 2,
                        },
                      ]}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={tamanos.beneficioIconSize}
                        color={DISENO.colors.accent}
                      />
                    </View>
                    <Text
                      style={[styles.beneficioText, { fontSize: tamanos.beneficioTextSize }]}
                      allowFontScaling={false}
                    >
                      {beneficios.descuento > 0
                        ? `${beneficios.descuento}% de descuento en todos tus pedidos`
                        : 'Acumulá puntos para obtener descuentos'}
                    </Text>
                  </View>

                  <View style={styles.beneficioItem}>
                    <View
                      style={[
                        styles.beneficioIcon,
                        {
                          backgroundColor: DISENO.colors.success + '15',
                          width: tamanos.beneficioIconContainerSize,
                          height: tamanos.beneficioIconContainerSize,
                          borderRadius: tamanos.beneficioIconContainerSize / 2,
                        },
                      ]}
                    >
                      <Ionicons
                        name="bicycle-outline"
                        size={tamanos.beneficioIconSize}
                        color={DISENO.colors.success}
                      />
                    </View>
                    <Text
                      style={[styles.beneficioText, { fontSize: tamanos.beneficioTextSize }]}
                      allowFontScaling={false}
                    >
                      {beneficios.envioGratis
                        ? beneficios.envioGratisMinimo
                          ? `Envío gratis en pedidos > $${formatearPrecio(beneficios.envioGratisMinimo)}`
                          : 'Envío gratis en todos tus pedidos'
                        : 'Envío con costo estándar'}
                    </Text>
                  </View>

                  {beneficios.accesoAnticipadoOfertas && (
                    <View style={styles.beneficioItem}>
                      <View
                        style={[
                          styles.beneficioIcon,
                          {
                            backgroundColor: DISENO.colors.info + '15',
                            width: tamanos.beneficioIconContainerSize,
                            height: tamanos.beneficioIconContainerSize,
                            borderRadius: tamanos.beneficioIconContainerSize / 2,
                          },
                        ]}
                      >
                        <Ionicons
                          name="rocket-outline"
                          size={tamanos.beneficioIconSize}
                          color={DISENO.colors.info}
                        />
                      </View>
                      <Text
                        style={[styles.beneficioText, { fontSize: tamanos.beneficioTextSize }]}
                        allowFontScaling={false}
                      >
                        🚀 Acceso anticipado a ofertas exclusivas
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={[styles.stats, { paddingVertical: tamanos.statPaddingV }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: tamanos.statValorSize }]} allowFontScaling={false}>
                    {totalPedidos}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: tamanos.statLabelSize }]} allowFontScaling={false}>
                    Pedidos
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: tamanos.statValorSize }]} allowFontScaling={false}>
                    {formatearPrecio(totalGastado)}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: tamanos.statLabelSize }]} allowFontScaling={false}>
                    Gastado
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: tamanos.statValorSize }]} allowFontScaling={false}>
                    {totalCanjes}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: tamanos.statLabelSize }]} allowFontScaling={false}>
                    Canjes
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.guestMessage}>
              <Ionicons name="person-outline" size={tamanos.guestIconSize} color={DISENO.colors.textTertiary} />
              <Text style={[styles.guestText, { fontSize: tamanos.guestTextSize }]} allowFontScaling={false}>
                Estás viendo como invitado
              </Text>
              <Text
                style={[styles.guestSubText, { fontSize: tamanos.guestSubTextSize }]}
                allowFontScaling={false}
              >
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>

              <TouchableOpacity
                style={[
                  styles.loginButtonGuest,
                  {
                    paddingVertical: tamanos.loginGuestPaddingV,
                    paddingHorizontal: tamanos.loginGuestPaddingH,
                    borderRadius: tamanos.loginGuestRadius,
                  },
                ]}
                onPress={() => props.navigation.navigate('Login')}
              >
                <LinearGradient
                  colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                  style={[styles.loginButtonGradient, { gap: 8 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={tamanos.loginGuestIconSize}
                    color={DISENO.colors.surface}
                  />
                  <Text
                    style={[styles.loginButtonText, { fontSize: tamanos.loginGuestTextSize }]}
                    allowFontScaling={false}
                  >
                    Iniciar sesión / Registrarse
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* ACTIVIDAD RECIENTE */}
        {perfil?.id && actividadesRecientes.length > 0 && (
          <Animated.View
            style={[
              styles.actividadContainer,
              {
                paddingHorizontal: tamanos.seccionPaddingH,
                paddingVertical: tamanos.seccionPaddingV,
                marginHorizontal: tamanos.padding,
                marginTop: tamanos.seccionMarginTop,
                borderRadius: tamanos.seccionRadius,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text
              style={[styles.actividadTitulo, { fontSize: tamanos.seccionTituloSize }]}
              allowFontScaling={false}
            >
              📈 Actividad reciente
            </Text>

            {actividadesRecientes.slice(0, 4).map((actividad, index) => (
              <View
                key={actividad.id}
                style={[
                  styles.actividadItem,
                  {
                    paddingVertical: tamanos.actividadItemPaddingV,
                    borderBottomWidth: index < actividadesRecientes.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.actividadIcono,
                    {
                      width: tamanos.actividadIconContainer,
                      height: tamanos.actividadIconContainer,
                      borderRadius: tamanos.actividadIconContainer / 2,
                    },
                  ]}
                >
                  <Ionicons
                    name={actividad.icono as any}
                    size={tamanos.actividadIconSize}
                    color={actividad.color}
                  />
                </View>
                <View style={styles.actividadInfo}>
                  <Text
                    style={[styles.actividadDesc, { fontSize: tamanos.actividadDescSize }]}
                    allowFontScaling={false}
                  >
                    {actividad.descripcion}
                  </Text>
                  <Text
                    style={[styles.actividadFecha, { fontSize: tamanos.actividadFechaSize }]}
                    allowFontScaling={false}
                  >
                    {new Date(actividad.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* HISTORIAL PUNTOS */}
        {perfil?.id && historialPuntos.length > 0 && (
          <Animated.View
            style={[
              styles.historialPuntosContainer,
              {
                paddingHorizontal: tamanos.seccionPaddingH,
                paddingVertical: tamanos.seccionPaddingV,
                marginHorizontal: tamanos.padding,
                marginTop: tamanos.seccionMarginTop,
                borderRadius: tamanos.seccionRadius,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text
              style={[styles.historialPuntosTitulo, { fontSize: tamanos.seccionTituloSize }]}
              allowFontScaling={false}
            >
              ⭐ Historial de puntos
            </Text>

            {historialPuntos.slice(0, 10).map((item, index) => {
              const esPositivo = item.puntos > 0;
              const color = esPositivo ? DISENO.colors.success : DISENO.colors.accent;
              const esAdmin = item.tipo?.startsWith('ajuste_admin');
              const esBonus = item.tipo === 'bonus_bienvenida';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.historialPuntosItem,
                    {
                      paddingVertical: tamanos.historialItemPaddingV,
                      borderBottomWidth: index < historialPuntos.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.historialPuntosIcono,
                      {
                        backgroundColor: color + '15',
                        width: tamanos.historialIconContainer,
                        height: tamanos.historialIconContainer,
                        borderRadius: tamanos.historialIconContainer / 2,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        esBonus ? 'gift' : esAdmin ? 'shield-checkmark' : esPositivo ? 'add-circle' : 'remove-circle'
                      }
                      size={tamanos.historialIconSize}
                      color={color}
                    />
                  </View>
                  <View style={styles.historialPuntosInfo}>
                    <Text
                      style={[styles.historialPuntosDescripcion, { fontSize: tamanos.historialDescSize }]}
                      numberOfLines={2}
                      allowFontScaling={false}
                    >
                      {item.descripcion || 'Ajuste de puntos'}
                    </Text>
                    <Text
                      style={[styles.historialPuntosFecha, { fontSize: tamanos.historialFechaSize }]}
                      allowFontScaling={false}
                    >
                      {new Date(item.fecha).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historialPuntosCantidad,
                      { fontSize: tamanos.historialCantidadSize, color },
                    ]}
                    allowFontScaling={false}
                  >
                    {esPositivo ? '+' : ''}
                    {item.puntos}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* INFO PERFIL */}
        {perfil?.id && (
          <Animated.View
            style={[
              styles.infoContainer,
              {
                paddingHorizontal: tamanos.seccionPaddingH,
                paddingVertical: tamanos.seccionPaddingV,
                marginHorizontal: tamanos.padding,
                marginTop: tamanos.seccionMarginTop,
                borderRadius: tamanos.seccionRadius,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.infoHeader}>
              <Text style={[styles.infoTitulo, { fontSize: tamanos.infoTituloSize }]} allowFontScaling={false}>
                📋 Info contacto
              </Text>
              <TouchableOpacity
                onPress={() => setModoEdicion(!modoEdicion)}
                style={[
                  styles.editButton,
                  {
                    paddingHorizontal: tamanos.infoEditButtonPaddingH,
                    paddingVertical: tamanos.infoEditButtonPaddingV,
                  },
                ]}
              >
                <Text
                  style={[styles.editButtonText, { fontSize: tamanos.infoEditButtonTextSize }]}
                  allowFontScaling={false}
                >
                  {modoEdicion ? 'Cancelar' : '✏️ Editar'}
                </Text>
              </TouchableOpacity>
            </View>

            {modoEdicion ? (
              <View>
                {/* 📱 TELÉFONO */}
                <View style={{ marginBottom: tamanos.formGap }}>
                  <Text
                    style={[styles.formLabel, { fontSize: tamanos.formLabelSize }]}
                    allowFontScaling={false}
                  >
                    📱 Teléfono
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        fontSize: tamanos.formInputSize,
                        paddingHorizontal: tamanos.formInputPaddingH,
                        paddingVertical: tamanos.formInputPaddingV,
                        borderRadius: tamanos.formInputRadius,
                      },
                    ]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 11 1234 5678"
                    keyboardType="phone-pad"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    allowFontScaling={false}
                  />
                </View>

                {/* 🎂 CUMPLEAÑOS */}
                <View style={{ marginBottom: tamanos.formGap }}>
                  <Text
                    style={[styles.formLabel, { fontSize: tamanos.formLabelSize }]}
                    allowFontScaling={false}
                  >
                    🎂 Cumpleaños
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        fontSize: tamanos.formInputSize,
                        paddingHorizontal: tamanos.formInputPaddingH,
                        paddingVertical: tamanos.formInputPaddingV,
                        borderRadius: tamanos.formInputRadius,
                      },
                    ]}
                    value={cumpleanos}
                    onChangeText={(text) => {
                      // Permitir solo dígitos y "/"
                      const soloNumerosYBarra = text.replace(/[^0-9/]/g, '');
                      // Auto-formatear: si el usuario escribe "1405" → "14/05"
                      let formateado = soloNumerosYBarra;
                      if (soloNumerosYBarra.length === 4 && !soloNumerosYBarra.includes('/')) {
                        formateado = `${soloNumerosYBarra.slice(0, 2)}/${soloNumerosYBarra.slice(2, 4)}`;
                      }
                      setCumpleanos(formateado);
                    }}
                    placeholder="DD/MM (ej: 14/05)"
                    keyboardType="numbers-and-punctuation"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    allowFontScaling={false}
                    maxLength={5}
                  />
                  <Text
                    style={{
                      fontFamily: FUENTES.regular,
                      fontSize: 11,
                      color: DISENO.colors.textTertiary,
                      marginTop: 4,
                      fontStyle: 'italic',
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    🎁 Ese día te mandamos una promo especial
                  </Text>
                </View>

                {/* 📍 DIRECCIÓN */}
                <View style={{ marginBottom: tamanos.formGap }}>
                  <Text
                    style={[styles.formLabel, { fontSize: tamanos.formLabelSize }]}
                    allowFontScaling={false}
                  >
                    📍 Dirección
                  </Text>

                  {/* ✅ Botón "Usar mi ubicación actual" */}
                  <View style={{ marginBottom: 10 }}>
                    <BotonUsarMiUbicacion
                      onUbicacionObtenida={handleUbicacionPerfil}
                      texto="Usar mi ubicación actual"
                      variante="primario"
                    />
                  </View>

                  <View style={[styles.direccionRow, { gap: 8, marginBottom: 8 }]}>
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionCalle,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionCalle}
                      onChangeText={setDireccionCalle}
                      placeholder="Calle"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionNumero,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionNumero}
                      onChangeText={setDireccionNumero}
                      placeholder="N°"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                  </View>
                  <View style={[styles.direccionRow, { gap: 8, marginBottom: 8 }]}>
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionPiso,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionPiso}
                      onChangeText={setDireccionPiso}
                      placeholder="Piso"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionDepto,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionDepartamento}
                      onChangeText={setDireccionDepartamento}
                      placeholder="Depto"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        fontSize: tamanos.formInputSize,
                        paddingHorizontal: tamanos.formInputPaddingH,
                        paddingVertical: tamanos.formInputPaddingV,
                        borderRadius: tamanos.formInputRadius,
                        marginBottom: 8,
                      },
                    ]}
                    value={direccionBarrio}
                    onChangeText={setDireccionBarrio}
                    placeholder="Barrio"
                    placeholderTextColor={DISENO.colors.textTertiary}
                    allowFontScaling={false}
                  />
                  <View style={[styles.direccionRow, { gap: 8 }]}>
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionCiudad,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionCiudad}
                      onChangeText={setDireccionCiudad}
                      placeholder="Ciudad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.direccionCP,
                        {
                          fontSize: tamanos.formInputSize,
                          paddingHorizontal: tamanos.formInputPaddingH,
                          paddingVertical: tamanos.formInputPaddingV,
                          borderRadius: tamanos.formInputRadius,
                        },
                      ]}
                      value={direccionCodigoPostal}
                      onChangeText={setDireccionCodigoPostal}
                      placeholder="CP"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                      allowFontScaling={false}
                    />
                  </View>
                </View>

                {/* 🍽️ PREFERENCIAS DE COMIDA */}
                <View style={{ marginBottom: tamanos.formGap }}>
                  <Text
                    style={[styles.formLabel, { fontSize: tamanos.formLabelSize }]}
                    allowFontScaling={false}
                  >
                    🍽️ Preferencias de comida
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      styles.textArea,
                      {
                        fontSize: tamanos.formInputSize,
                        paddingHorizontal: tamanos.formInputPaddingH,
                        paddingVertical: tamanos.formInputPaddingV,
                        borderRadius: tamanos.formInputRadius,
                        minHeight: tamanos.formTextAreaMinHeight,
                      },
                    ]}
                    value={preferenciasComida}
                    onChangeText={setPreferenciasComida}
                    placeholder="Ej: Sin TACC, vegetariano, etc."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={DISENO.colors.textTertiary}
                    allowFontScaling={false}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      borderRadius: tamanos.saveButtonRadius,
                    },
                  ]}
                  onPress={actualizarDatosPerfil}
                  disabled={cargandoActualizacion || geocodificando}
                >
                  <LinearGradient
                    colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                    style={[styles.saveButtonGradient, { paddingVertical: tamanos.saveButtonPaddingV }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {cargandoActualizacion || geocodificando ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={[styles.saveButtonText, { fontSize: tamanos.saveButtonTextSize }]}
                          allowFontScaling={false}
                        >
                          {geocodificando ? '📍 Obteniendo ubicación...' : 'Guardando...'}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[styles.saveButtonText, { fontSize: tamanos.saveButtonTextSize }]}
                        allowFontScaling={false}
                      >
                        ✅ Guardar cambios
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoDisplay}>
                <View style={[styles.infoRow, { paddingVertical: tamanos.infoRowPaddingV }]}>
                  <Ionicons name="call-outline" size={tamanos.infoIconSize} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: tamanos.infoTextSize }]} allowFontScaling={false}>
                    {telefono || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.infoRow, { paddingVertical: tamanos.infoRowPaddingV }]}>
                  <Ionicons name="gift-outline" size={tamanos.infoIconSize} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: tamanos.infoTextSize }]} allowFontScaling={false}>
                    {cumpleanos ? `🎂 ${cumpleanos}` : 'Cumpleaños no especificado'}
                  </Text>
                </View>
                <View style={[styles.infoRow, { paddingVertical: tamanos.infoRowPaddingV }]}>
                  <Ionicons name="location-outline" size={tamanos.infoIconSize} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: tamanos.infoTextSize }]} allowFontScaling={false}>
                    {obtenerDireccionCompleta()}
                  </Text>
                </View>
                <View style={[styles.infoRow, { paddingVertical: tamanos.infoRowPaddingV }]}>
                  <Ionicons name="restaurant-outline" size={tamanos.infoIconSize} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: tamanos.infoTextSize }]} allowFontScaling={false}>
                    {preferenciasComida || 'Sin preferencias'}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* ÚLTIMOS CANJES */}
        {perfil?.id && ultimosCanjes.length > 0 && (
          <Animated.View
            style={[
              styles.canjesContainer,
              {
                paddingHorizontal: tamanos.seccionPaddingH,
                paddingVertical: tamanos.seccionPaddingV,
                marginHorizontal: tamanos.padding,
                marginTop: tamanos.seccionMarginTop,
                borderRadius: tamanos.seccionRadius,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={[styles.canjesTitulo, { fontSize: tamanos.seccionTituloSize }]} allowFontScaling={false}>
              🎁 Últimas recompensas canjeadas
            </Text>

            {ultimosCanjes.map((canje, index) => (
              <View
                key={canje.id}
                style={[
                  styles.canjeItem,
                  {
                    paddingVertical: tamanos.canjeItemPaddingV,
                    borderBottomWidth: index < ultimosCanjes.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.canjeIcono,
                    {
                      width: tamanos.canjeIconContainer,
                      height: tamanos.canjeIconContainer,
                      borderRadius: tamanos.canjeIconContainer / 2,
                    },
                  ]}
                >
                  <Text style={{ fontSize: tamanos.canjeEmojiSize }} allowFontScaling={false}>
                    🎯
                  </Text>
                </View>
                <View style={styles.canjeInfo}>
                  <Text
                    style={[styles.canjeNombre, { fontSize: tamanos.canjeNombreSize }]}
                    allowFontScaling={false}
                  >
                    {canje.recompensas?.nombre || 'Recompensa'}
                  </Text>
                  <Text
                    style={[styles.canjeDetalle, { fontSize: tamanos.canjeDetalleSize }]}
                    allowFontScaling={false}
                  >
                    {canje.puntos_usados} pts •{' '}
                    {canje.recompensas?.tipo === 'descuento'
                      ? `${canje.recompensas?.valor_descuento}% OFF`
                      : 'Producto gratis'}
                  </Text>
                </View>
                <Text
                  style={[styles.canjeFecha, { fontSize: tamanos.canjeFechaSize }]}
                  allowFontScaling={false}
                >
                  {new Date(canje.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* MENÚ NAVEGACIÓN */}
        <Animated.View
          style={{
            paddingHorizontal: tamanos.padding,
            marginTop: tamanos.seccionMarginTop,
            gap: 8,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          {menuItems.map((item) => {
            const bloqueado = item.requiereSesion && !sesion;
            const tieneBadge = item.id === 'notificaciones' && notificacionesNoLeidas > 0;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    paddingVertical: tamanos.menuItemPaddingV,
                    paddingHorizontal: tamanos.menuItemPaddingH,
                    borderRadius: tamanos.menuItemRadius,
                  },
                ]}
                onPress={() => handleNavigate(item)}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIcon,
                      {
                        backgroundColor: item.color + '15',
                        width: tamanos.menuIconContainer,
                        height: tamanos.menuIconContainer,
                        borderRadius: tamanos.menuIconContainer / 2,
                      },
                    ]}
                  >
                    <Ionicons name={item.icono as any} size={tamanos.menuIconSize} color={item.color} />
                    {tieneBadge && (
                      <View
                        style={[
                          styles.badgeNotificaciones,
                          {
                            backgroundColor: DISENO.colors.accent,
                            borderColor: DISENO.colors.surface,
                            minWidth: tamanos.menuBadgeSize,
                            height: tamanos.menuBadgeSize,
                            borderRadius: tamanos.menuBadgeSize / 2,
                            paddingHorizontal: 4,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.badgeNotificacionesTexto, { fontSize: tamanos.menuBadgeTextSize }]}
                          allowFontScaling={false}
                        >
                          {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.menuLabelContainer}>
                    <Text
                      style={[styles.menuLabel, { fontSize: tamanos.menuLabelSize }]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {item.label}
                    </Text>
                    {bloqueado ? (
                      <Text
                        style={[styles.menuSubtitle, { fontSize: tamanos.menuSubtitleSize }]}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        🔒 Iniciá sesión para acceder
                      </Text>
                    ) : item.subtitle ? (
                      <Text
                        style={[styles.menuSubtitle, { fontSize: tamanos.menuSubtitleSize }]}
                        numberOfLines={1}
                        allowFontScaling={false}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons
                  name={bloqueado ? 'lock-closed-outline' : 'chevron-forward'}
                  size={tamanos.menuChevronSize}
                  color={bloqueado ? DISENO.colors.warning : DISENO.colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* CERRAR SESIÓN */}
        {perfil?.id && (
          <Animated.View
            style={{
              alignItems: 'center',
              paddingHorizontal: tamanos.padding,
              marginTop: tamanos.seccionMarginTop,
              marginBottom: 20,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  paddingVertical: tamanos.logoutButtonPaddingV,
                  paddingHorizontal: tamanos.logoutButtonPaddingH,
                  borderRadius: tamanos.logoutButtonRadius,
                },
              ]}
              onPress={() => setMostrarModal(true)}
            >
              <Ionicons name="log-out-outline" size={tamanos.logoutIconSize} color={DISENO.colors.danger} />
              <Text
                style={[styles.logoutText, { fontSize: tamanos.logoutTextSize }]}
                allowFontScaling={false}
              >
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* MODAL CERRAR SESIÓN */}
      <Modal
        visible={mostrarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                width: isTablet ? 400 : screenWidth - 40,
                padding: tamanos.modalPadding,
                borderRadius: tamanos.modalRadius,
              },
            ]}
          >
            <View style={{ marginBottom: 12 }}>
              <Ionicons name="log-out-outline" size={tamanos.modalIconSize} color={DISENO.colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: tamanos.modalTitleSize }]} allowFontScaling={false}>
              ¿Cerrar sesión?
            </Text>
            <Text style={[styles.modalText, { fontSize: tamanos.modalTextSize }]} allowFontScaling={false}>
              ¿Estás seguro que querés cerrar sesión? Podrás volver a iniciar sesión cuando quieras.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { paddingVertical: tamanos.modalButtonPaddingV, borderRadius: tamanos.modalButtonRadius },
                ]}
                onPress={() => setMostrarModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: tamanos.modalButtonTextSize }]} allowFontScaling={false}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  { paddingVertical: tamanos.modalButtonPaddingV, borderRadius: tamanos.modalButtonRadius },
                ]}
                onPress={confirmarCerrarSesion}
              >
                <Text
                  style={[styles.modalButtonText, styles.modalButtonConfirmText, { fontSize: tamanos.modalButtonTextSize }]}
                  allowFontScaling={false}
                >
                  Sí, cerrar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PREFERENCIAS NOTIFICACIONES */}
      <Modal
        visible={mostrarPreferenciasNotificaciones}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarPreferenciasNotificaciones(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMostrarPreferenciasNotificaciones(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }}
            style={[
              styles.modalContent,
              {
                width: isTablet ? 500 : screenWidth - 32,
                padding: tamanos.modalPadding,
                borderRadius: tamanos.modalRadius,
                alignItems: 'stretch',
              },
            ]}
          >
            {/* ─── HEADER con X ─── */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
              <TouchableOpacity
                onPress={() => setMostrarPreferenciasNotificaciones(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: DISENO.colors.surfaceHover,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={DISENO.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ─── TÍTULO ─── */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: tamanos.modalIconSize,
                  height: tamanos.modalIconSize,
                  borderRadius: tamanos.modalIconSize / 2,
                  backgroundColor: DISENO.colors.accent + '15',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={tamanos.modalIconSize * 0.55}
                  color={DISENO.colors.accent}
                />
              </View>
              <Text
                style={[styles.modalTitle, { fontSize: tamanos.modalTitleSize, marginBottom: 4 }]}
                allowFontScaling={false}
              >
                Preferencias de notificaciones
              </Text>
              <Text
                style={[styles.modalText, { fontSize: tamanos.modalTextSize, marginBottom: 0 }]}
                allowFontScaling={false}
              >
                Elegí qué comunicaciones querés recibir. Podés cambiarlas cuando quieras.
              </Text>
            </View>

            {/* ─── SECCIÓN 1: AVISOS DE PEDIDOS ─── */}
            <View
              style={{
                backgroundColor: DISENO.colors.surfaceHover,
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: DISENO.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: DISENO.colors.accent + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="receipt-outline" size={18} color={DISENO.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FUENTES.display,
                      fontSize: tamanos.notifPrefTitleSize,
                      color: DISENO.colors.text,
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    Avisos de pedidos
                  </Text>
                  <Text
                    style={{
                      fontFamily: FUENTES.regular,
                      fontSize: tamanos.notifPrefDescSize,
                      color: notificacionesPermitidas
                        ? DISENO.colors.success
                        : DISENO.colors.textTertiary,
                      includeFontPadding: false,
                      marginTop: 1,
                    }}
                    allowFontScaling={false}
                  >
                    {notificacionesPermitidas
                      ? '✓ Activadas en este dispositivo'
                      : 'Desactivadas — no recibirás avisos'}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontFamily: FUENTES.regular,
                  fontSize: tamanos.notifPrefDescSize,
                  color: DISENO.colors.textSecondary,
                  lineHeight: 16,
                  includeFontPadding: false,
                  marginBottom: 10,
                }}
                allowFontScaling={false}
              >
                Confirmación, preparación, en camino y entrega de tus pedidos.{'\n'}
                <Text style={{ fontStyle: 'italic', color: DISENO.colors.textTertiary }}>
                  Se controla desde los permisos del sistema operativo.
                </Text>
              </Text>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: tamanos.notifPrefBtnPaddingV,
                  paddingHorizontal: tamanos.notifPrefBtnPaddingH,
                  borderRadius: tamanos.notifPrefBtnRadius,
                  backgroundColor: notificacionesPermitidas
                    ? DISENO.colors.success + '15'
                    : DISENO.colors.accent,
                  borderWidth: notificacionesPermitidas ? 1 : 0,
                  borderColor: notificacionesPermitidas
                    ? DISENO.colors.success + '40'
                    : 'transparent',
                }}
                onPress={activarNotificacionesHandler}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={notificacionesPermitidas ? 'settings-outline' : 'notifications'}
                  size={16}
                  color={notificacionesPermitidas ? DISENO.colors.success : DISENO.colors.surface}
                />
                <Text
                  style={{
                    fontFamily: FUENTES.display,
                    fontSize: tamanos.notifPrefBtnTextSize,
                    color: notificacionesPermitidas
                      ? DISENO.colors.success
                      : DISENO.colors.surface,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {notificacionesPermitidas ? 'Administrar en ajustes' : 'Activar notificaciones'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─── SECCIÓN 2: NOVEDADES Y PROMOS ESPECIALES ─── */}
            <View
              style={{
                backgroundColor: DISENO.colors.surfaceHover,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor:
                  perfil?.acepta_promociones === true
                    ? DISENO.colors.accentSecondary + '40'
                    : DISENO.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: DISENO.colors.accentSecondary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="pricetags-outline" size={18} color={DISENO.colors.accentSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FUENTES.display,
                      fontSize: tamanos.notifPrefTitleSize,
                      color: DISENO.colors.text,
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    Novedades y promos especiales
                  </Text>
                  <Text
                    style={{
                      fontFamily: FUENTES.regular,
                      fontSize: tamanos.notifPrefDescSize,
                      color: perfil?.acepta_promociones
                        ? DISENO.colors.success
                        : DISENO.colors.textTertiary,
                      includeFontPadding: false,
                      marginTop: 1,
                    }}
                    allowFontScaling={false}
                  >
                    {perfil?.acepta_promociones ? '✓ Activadas' : 'Desactivadas'}
                  </Text>
                </View>
                <Switch
                  value={perfil?.acepta_promociones === true}
                  onValueChange={cambiarConsentimientoPromociones}
                  disabled={guardandoPreferenciasNotificaciones}
                  trackColor={{ false: DISENO.colors.border, true: DISENO.colors.success }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Aceptar novedades y promos especiales"
                />
              </View>

              <Text
                style={{
                  fontFamily: FUENTES.regular,
                  fontSize: tamanos.notifPrefDescSize,
                  color: DISENO.colors.textSecondary,
                  lineHeight: 16,
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Lanzamientos, combos nuevos y promos exclusivas.{'\n'}
                <Text style={{ fontStyle: 'italic', color: DISENO.colors.textTertiary }}>
                  Las ofertas activas del día llegan igual, siempre que tengas las notificaciones activadas.
                </Text>
              </Text>

              {perfil?.acepta_promociones === true && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 10,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: DISENO.colors.success + '10',
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color={DISENO.colors.success} />
                  <Text
                    style={{
                      fontFamily: FUENTES.regular,
                      fontSize: 11,
                      color: DISENO.colors.success,
                      flex: 1,
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    Vas a recibir novedades y promos especiales
                  </Text>
                </View>
              )}
            </View>

            {/* ─── BOTÓN "ENTENDIDO" ─── */}
            <TouchableOpacity
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: DISENO.colors.success,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                ...DISENO.shadow.sm,
              }}
              onPress={() => setMostrarPreferenciasNotificaciones(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontFamily: FUENTES.display,
                  fontSize: 14,
                  color: '#FFFFFF',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Entendido
              </Text>
            </TouchableOpacity>

            {/* ─── FOOTER INFORMATIVO ─── */}
            <Text
              style={{
                fontFamily: FUENTES.regular,
                fontSize: 11,
                color: DISENO.colors.textTertiary,
                textAlign: 'center',
                marginTop: 12,
                includeFontPadding: false,
              }}
              allowFontScaling={false}
            >
              Podés cambiar estas preferencias en cualquier momento desde tu perfil.
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL FOTO COMPLETA */}
      <Modal
        visible={mostrarFotoCompleta}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarFotoCompleta(false)}
        statusBarTranslucent
      >
        <View style={styles.fotoCompletaOverlay}>
          <TouchableOpacity
            style={[
              styles.fotoCompletaCerrar,
              {
                top: insets.top + 16,
                width: tamanos.fotoCerrarSize,
                height: tamanos.fotoCerrarSize,
                borderRadius: tamanos.fotoCerrarSize / 2,
              },
            ]}
            onPress={() => setMostrarFotoCompleta(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={tamanos.fotoCerrarIconSize} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fotoCompletaTouchable}
            activeOpacity={1}
            onPress={() => setMostrarFotoCompleta(false)}
          >
            {imagenPerfil && (
              <Image source={{ uri: imagenPerfil }} style={styles.fotoCompletaImagen} resizeMode="contain" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fotoCompletaCambiar,
              {
                bottom: insets.bottom + 24,
                paddingHorizontal: tamanos.fotoCambiarPaddingH,
                paddingVertical: tamanos.fotoCambiarPaddingV,
                borderRadius: tamanos.fotoCambiarRadius,
              },
            ]}
            onPress={() => {
              setMostrarFotoCompleta(false);
              setTimeout(() => mostrarOpcionesFoto(), 300);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={tamanos.fotoCambiarIconSize} color="#FFFFFF" />
            <Text style={[styles.fotoCompletaCambiarTexto, { fontSize: tamanos.fotoCambiarTextSize }]} allowFontScaling={false}>
              Cambiar foto
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DISENO.colors.fondo },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: DISENO.colors.surface,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContent: { flexGrow: 1 },
  header: { alignItems: 'center', backgroundColor: 'transparent' },
  avatarContainer: {
    backgroundColor: DISENO.colors.surface,
    borderColor: DISENO.colors.border,
    ...DISENO.shadow.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    textAlign: 'center',
    color: DISENO.colors.text,
    includeFontPadding: false,
  },
  cameraIcon: {
    position: 'absolute',
    backgroundColor: DISENO.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  uploadingContainer: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadingText: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textSecondary,
    includeFontPadding: false,
  },
  name: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginTop: 12,
    includeFontPadding: false,
    lineHeight: 30,
  },
  email: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 18,
  },
  pointsContainer: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 4 },
  pointsWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pointsText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accentSecondary,
    includeFontPadding: false,
    lineHeight: 18,
  },
  levelBadge: {
    marginTop: 8,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    ...DISENO.shadow.sm,
  },
  levelText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
  beneficiosContainer: {
    marginTop: 12,
    backgroundColor: DISENO.colors.surface,
    width: '100%',
    ...DISENO.shadow.sm,
  },
  beneficiosTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 10,
    includeFontPadding: false,
    lineHeight: 20,
  },
  beneficioItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  beneficioIcon: { justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  beneficioText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    flex: 1,
    includeFontPadding: false,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    ...DISENO.shadow.sm,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    includeFontPadding: false,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 16,
  },
  statDivider: { width: 1, backgroundColor: DISENO.colors.border },
  guestMessage: { alignItems: 'center', marginTop: 16, padding: 20 },
  guestText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginTop: 8,
    includeFontPadding: false,
    lineHeight: 22,
  },
  guestSubText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
    includeFontPadding: false,
    lineHeight: 18,
  },
  loginButtonGuest: { overflow: 'hidden', marginTop: 16, width: '100%', maxWidth: 280 },
  loginButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    includeFontPadding: false,
  },
  actividadContainer: { backgroundColor: DISENO.colors.surface, ...DISENO.shadow.sm },
  actividadTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
    includeFontPadding: false,
    lineHeight: 20,
  },
  actividadItem: { flexDirection: 'row', alignItems: 'center', borderBottomColor: DISENO.colors.border },
  actividadIcono: {
    backgroundColor: DISENO.colors.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actividadInfo: { flex: 1 },
  actividadDesc: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  actividadFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    marginTop: 1,
    includeFontPadding: false,
    lineHeight: 14,
  },
  historialPuntosContainer: { backgroundColor: DISENO.colors.surface, ...DISENO.shadow.sm },
  historialPuntosTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
    includeFontPadding: false,
    lineHeight: 20,
  },
  historialPuntosItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: DISENO.colors.border,
    gap: 12,
  },
  historialPuntosIcono: { justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  historialPuntosInfo: { flex: 1 },
  historialPuntosDescripcion: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  historialPuntosFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 14,
  },
  historialPuntosCantidad: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 20,
  },
  infoContainer: { backgroundColor: DISENO.colors.surface, ...DISENO.shadow.sm },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    includeFontPadding: false,
    lineHeight: 20,
  },
  editButton: { backgroundColor: DISENO.colors.fondo, borderRadius: DISENO.radius.sm },
  editButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
    includeFontPadding: false,
  },
  infoDisplay: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    flex: 1,
    fontWeight: '400',
    includeFontPadding: false,
    lineHeight: 18,
  },
  formLabel: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    color: DISENO.colors.textSecondary,
    marginBottom: 4,
    includeFontPadding: false,
  },
  formInput: {
    fontFamily: FUENTES.regular,
    backgroundColor: DISENO.colors.fondo,
    color: DISENO.colors.text,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  direccionRow: { flexDirection: 'row' },
  direccionCalle: { flex: 2 },
  direccionNumero: { flex: 1 },
  direccionPiso: { flex: 1 },
  direccionDepto: { flex: 1 },
  direccionCiudad: { flex: 2 },
  direccionCP: { flex: 1 },
  textArea: { textAlignVertical: 'top' },
  saveButton: { overflow: 'hidden', marginTop: 8 },
  saveButtonGradient: { alignItems: 'center', justifyContent: 'center' },
  saveButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    includeFontPadding: false,
  },
  canjesContainer: { backgroundColor: DISENO.colors.surface, ...DISENO.shadow.sm },
  canjesTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
    includeFontPadding: false,
    lineHeight: 20,
  },
  canjeItem: { flexDirection: 'row', alignItems: 'center', borderBottomColor: DISENO.colors.border },
  canjeIcono: {
    backgroundColor: DISENO.colors.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  canjeInfo: { flex: 1 },
  canjeNombre: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
    includeFontPadding: false,
    lineHeight: 18,
  },
  canjeDetalle: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 1,
    includeFontPadding: false,
    lineHeight: 14,
  },
  canjeFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    includeFontPadding: false,
    lineHeight: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuLabelContainer: { flex: 1, marginRight: 8 },
  menuIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  badgeNotificaciones: {
    position: 'absolute',
    top: -4,
    right: -4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeNotificacionesTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
    includeFontPadding: false,
  },
  menuLabel: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    includeFontPadding: false,
    lineHeight: 18,
  },
  menuSubtitle: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    marginTop: 1,
    includeFontPadding: false,
    lineHeight: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    borderColor: DISENO.colors.danger + '30',
  },
  logoutText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.danger,
    includeFontPadding: false,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DISENO.colors.surface,
    alignItems: 'center',
    ...DISENO.shadow.lg,
  },
  modalTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 24,
  },
  modalText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    includeFontPadding: false,
  },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalButton: { flex: 1, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: DISENO.colors.fondo },
  modalButtonConfirm: { backgroundColor: DISENO.colors.danger },
  modalButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    includeFontPadding: false,
  },
  modalButtonConfirmText: { color: DISENO.colors.surface },

  // FOTO COMPLETA
  fotoCompletaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoCompletaTouchable: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  fotoCompletaImagen: { width: '100%', height: '100%' },
  fotoCompletaCerrar: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoCompletaCambiar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  fotoCompletaCambiarTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: '#FFFFFF',
    includeFontPadding: false,
  },
});