// screens/cliente/PantallaCheckout.tsx - CON SIMPSONFONT Y TEMA CLARO
import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const ALIAS_TRANSFERENCIA = 'krustyburger2025';
const CUENTA_TRANSFERENCIA = 'CBU: 0000003100088376133432';

// ============================================================
// 🎯 TIPO: MODO DE EDICIÓN DE DIRECCIÓN
// ============================================================
type ModoDireccion = 'vista' | 'texto' | 'formulario';

// ============================================================
// ✅ HELPERS FUERA DEL COMPONENTE
// ============================================================
const asegurarPermisosUbicacion = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return true;

        console.log('📍 [Checkout] Solicitando permisos de ubicación...');
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
        if (!tienePermiso) {
            console.warn('⚠️ [Checkout] Sin permisos, no se puede geocodificar');
            return null;
        }

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

            const direccion = partes.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            console.log('📍 [Checkout] Dirección obtenida:', direccion);
            return direccion;
        }

        return null;
    } catch (error) {
        console.error('❌ [Checkout] Error geocodificando:', error);
        return null;
    }
};

export default function PantallaCheckout(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
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
        limpiarUbicacionTemporal
    } = tiendaAutenticacion();

    const {
        nivel,
        beneficios,
        calcularDescuento,
        tieneEnvioGratis,
        descripcionBeneficios
    } = useBeneficios(perfil?.puntos_acumulados || 0, perfil?.id);

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
    } | null>(ubicacionRecibida ? {
        latitude: ubicacionRecibida.latitude,
        longitude: ubicacionRecibida.longitude,
    } : null);
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

    // ✅ NUEVO: estados para la edición de dirección
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

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

    // ============================================================
    // 🔒 GUARD DE SESIÓN
    // ============================================================
    useEffect(() => {
        if (!cargandoAuth && !sesion) {
            console.log('🔒 [Checkout] Sin sesión → redirigiendo a Login');

            Alert.alert(
                'Iniciá sesión',
                'Necesitás una cuenta para confirmar tu pedido.',
                [
                    {
                        text: 'Volver al carrito',
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

    const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

    const calcularVuelto = (montoPago: string) => {
        const pago = parseFloat(montoPago.replace(',', '.'));
        if (isNaN(pago) || pago <= 0) {
            setVueltoCalculado(0);
            setMostrarVuelto(false);
            return;
        }
        const totalAPagar = totalFinal;
        const vuelto = pago - totalAPagar;
        if (vuelto >= 0) {
            setVueltoCalculado(vuelto);
            setMostrarVuelto(true);
        } else {
            setVueltoCalculado(0);
            setMostrarVuelto(false);
        }
    };

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

            const partesDireccion = [];
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
        costoEnvioCalculado, tipoEntrega, calcularTotal, beneficios,
        cuponAplicado, cuponPuntosAplicado, calcularDescuento, tieneEnvioGratis,
    ]);

    const guardarDireccionEnStore = async (ubicacion: { latitude: number; longitude: number }) => {
        try {
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(ubicacion.latitude, ubicacion.longitude);
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
                setUbicacionSeleccionada({ latitude: ubicacionCargada.latitude, longitude: ubicacionCargada.longitude });
                setDireccion(ubicacionCargada.direccion || '');
                setDireccionCompleta(ubicacionCargada.direccion || '');
                setDireccionDelPerfil(false);
                setCargandoUbicacion(false);
                return;
            }
            if (ubicacionStore) {
                setUbicacionSeleccionada({ latitude: ubicacionStore.latitude, longitude: ubicacionStore.longitude });
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
            const partesDireccion = [];
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

            // ✅ NUEVO: si el usuario cargó datos manuales, los guardamos en el perfil
            if (camposManuales.calle) datosActualizados.direccion_calle = camposManuales.calle;
            if (camposManuales.numero) datosActualizados.direccion_numero = camposManuales.numero;
            if (camposManuales.piso) datosActualizados.direccion_piso = camposManuales.piso;
            if (camposManuales.departamento) datosActualizados.direccion_departamento = camposManuales.departamento;
            if (camposManuales.barrio) datosActualizados.direccion_barrio = camposManuales.barrio;
            if (camposManuales.ciudad) datosActualizados.direccion_ciudad = camposManuales.ciudad;
            if (camposManuales.codigoPostal) datosActualizados.direccion_codigo_postal = camposManuales.codigoPostal;

            if (Object.keys(datosActualizados).length > 0) {
                await actualizarPerfil(datosActualizados);
            }
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
        } finally {
            setGuardandoPerfil(false);
        }
    };

    const calcularCostoEnvio = async (lat: number, lng: number) => {
        console.log('🚚 [Checkout] Calculando envío para:', lat, lng);

        setCalculandoEnvio(true);
        try {
            const resultado = await servicioEnvios.calcularCostoEnvio(lat, lng);

            console.log('🚚 [Checkout] Resultado:', {
                esValido: resultado.esValido,
                dentroCobertura: resultado.dentroCobertura,
                costo: resultado.costo,
                distancia: resultado.distancia,
            });

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

        if (ultimaUbicacionCalculada.current === key) {
            console.log('🚚 [Checkout] Ya calculado para esta ubicación, skip');
            return;
        }

        ultimaUbicacionCalculada.current = key;
        calcularCostoEnvio(ubicacionSeleccionada.latitude, ubicacionSeleccionada.longitude);
    }, [ubicacionSeleccionada, tipoEntrega]);

    useEffect(() => {
        if (mostrarModalExito) {
            const animateDot = (anim: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                        Animated.delay(200),
                    ])
                );
            };
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
            if (!tienePermiso) {
                console.log('⚠️ [Checkout] Sin permisos para obtener ubicación actual');
                return;
            }

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
        } catch (error) {
            toast.error('No se pudo buscar la dirección');
        } finally {
            setBuscandoDireccion(false);
        }
    };

    // ============================================================
    // ✅ NUEVO: MANEJADORES DE EDICIÓN DE DIRECCIÓN
    // ============================================================

    /**
     * Abre el modo edición con el texto actual de la dirección
     */
    const abrirEdicionDireccion = () => {
        setDireccionInput(direccionCompleta || direccion || '');
        setErrorDireccion(null);
        setModoDireccion('texto');
    };

    /**
     * Cancela la edición y vuelve al modo vista
     */
    const cancelarEdicionDireccion = () => {
        setModoDireccion('vista');
        setErrorDireccion(null);
        setDireccionInput('');
    };

    /**
     * Verifica la dirección escrita en texto libre
     * - Si la encuentra → actualiza dirección + coordenadas + calcula envío
     * - Si NO la encuentra → pasa al modo formulario
     */
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

                // Reverse geocode para obtener la dirección "formateada" por el sistema
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

                // ✅ Descomponer la dirección en campos para guardar en el perfil
                // (opcional: si querés guardar los datos separados, hacerlo acá)
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
                // ❌ No la encontró → pasamos al formulario manual
                console.log('⚠️ [Checkout] Geocoder no encontró la dirección, pasando a formulario');
                setErrorDireccion('No pudimos encontrar esa dirección. Completala manualmente:');
                setModoDireccion('formulario');

                // Pre-llenamos los campos por si el texto tenía algo útil
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

    /**
     * Aplica la dirección cargada manualmente en el formulario.
     * Intenta geocodificar la dirección completa construida con los campos.
     * - Si la encuentra → calcula envío
     * - Si NO la encuentra → abre el mapa como fallback
     */
    const aplicarDireccionManual = async () => {
        if (!camposManuales.calle || !camposManuales.numero) {
            setErrorDireccion('Completá al menos calle y número');
            return;
        }

        setVerificandoDireccion(true);
        setErrorDireccion(null);

        // Construir dirección completa
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
                // ❌ No encontró la dirección ni con el formulario
                Alert.alert(
                    '📍 Necesitamos tu ubicación exacta',
                    'No pudimos ubicar esa dirección en el mapa. Elegí tu ubicación exacta con el mapa para continuar.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Abrir mapa',
                            onPress: () => setMostrarMapa(true),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('❌ [Checkout] Error aplicando dirección manual:', error);
            setErrorDireccion('Hubo un error al verificar la dirección');
        } finally {
            setVerificandoDireccion(false);
        }
    };

    /**
     * Vuelve al modo texto desde el formulario
     */
    const volverAlModoTexto = () => {
        setModoDireccion('texto');
        setErrorDireccion(null);
    };

    const handleVolverAlCarrito = async () => {
        if (ubicacionSeleccionada) await guardarDireccionEnStore(ubicacionSeleccionada);
        props.navigation.goBack();
    };

    const handleConfirmarUbicacion = async (ubicacion: { latitude: number; longitude: number; direccion: string }) => {
        console.log('🗺️ [Checkout] Ubicación confirmada desde mapa:', ubicacion);

        setUbicacionSeleccionada({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude
        });
        setDireccion(ubicacion.direccion);
        setDireccionCompleta(ubicacion.direccion);
        setDireccionDelPerfil(false);

        // ✅ Al usar el mapa, descomponemos la dirección en campos manuales
        // para guardarla en el perfil al confirmar (opcional)
        // Por ahora, solo limpiamos los campos manuales
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
            } catch (error) { }
        }
        try {
            await Linking.openURL('https://www.mercadopago.com.ar/');
            toast.info('🌐 Abriendo Mercado Pago web');
        } catch (error) {
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

        const items = elementos.map(e => ({
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
            telefono: telefono,
            direccion: tipoEntrega === 'retiro' ? 'Retiro en local' : direccionCompleta || direccion || 'Sin dirección',
            estado: 'pendiente',
            total_parcial: resumen.subtotal,
            total: resumen.totalFinal,
            costo_envio: resumen.costoEnvioFinal,
            items_json: items,
            metodo_pago: metodoPago,
            tipo_entrega: tipoEntrega,
            notas: notas,
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

        // ✅ NUEVO: Notificar a los admins del nuevo pedido (no bloqueante)
        notificacionService.notificarAdminsNuevoPedido({
            id: pedidoId,
            cliente_nombre: perfil?.nombre_cliente,
            total: resumen.totalFinal,
            cantidad_items: elementos.length,
            tipo_entrega: tipoEntrega,
        }).catch((err) => {
            console.warn('⚠️ Error notificando admins (no crítico):', err);
        });

        if (cuponAplicado?.id && perfil?.id) {
            const resultadoCupon = await cuponService.finalizarCuponPedido(cuponAplicado.id, perfil.id, pedidoId);
            if (!resultadoCupon.success) {
                toast.advertencia(`El pedido #${pedidoId} fue creado, pero el cupón no pudo aplicarse: ${resultadoCupon.mensaje}`);
            }
        }

        if (cuponPuntosAplicado?.puntos_usados > 0 && perfil?.id && pedidoId) {
            try {
                const { data: canjesRecientes, error: errorBuscar } = await supabase
                    .from('canjes')
                    .select('id')
                    .eq('usuario_id', perfil.id)
                    .eq('puntos_usados', cuponPuntosAplicado.puntos_usados)
                    .eq('usado_en_pedido', false)
                    .order('fecha', { ascending: false })
                    .limit(1);

                if (errorBuscar) {
                    console.error('❌ Error buscando canje:', errorBuscar);
                } else if (canjesRecientes && canjesRecientes.length > 0) {
                    const canjeId = canjesRecientes[0].id;
                    const { error: errorUpdate } = await supabase
                        .from('canjes')
                        .update({
                            usado_en_pedido: true,
                            pedido_id: pedidoId,
                        })
                        .eq('id', canjeId);

                    if (errorUpdate) {
                        console.error('❌ Error actualizando canje:', errorUpdate);
                    } else {
                        console.log(`✅ Canje #${canjeId} asociado al pedido #${pedidoId}`);
                    }
                } else {
                    console.warn('⚠️ No se encontró canje pendiente para asociar');
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
            costo: envioGratisAplicado ? 0 : (envioDisponible && costoEnvioCalculado > 0 ? costoEnvioCalculado : 0)
        },
        { id: 'retiro', label: 'Retiro en local', icono: 'storefront-outline', costo: 0 },
    ];

    const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
    const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 17 });
    const seccionTituloSize = responsive.getValor({ tablet: 16, normal: 14, small: 13 });
    const inputSize = responsive.getValor({ tablet: 15, normal: 14, small: 13 });
    const buttonTextSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });

    const renderLoaderDots = () => {
        const dots = [
            { anim: dot1Anim, delay: 0 },
            { anim: dot2Anim, delay: 200 },
            { anim: dot3Anim, delay: 400 },
        ];
        return dots.map((dot, index) => {
            const opacity = dot.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
            const scale = dot.anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
            return (
                <Animated.View
                    key={index}
                    style={[styles.modalLoaderDot, { opacity, transform: [{ scale }] }]}
                />
            );
        });
    };

    // ============================================================
    // 🔒 RENDER TEMPRANO: invitado o cargando auth → spinner
    // ============================================================
    if (cargandoAuth || !sesion) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DISENO.colors.accent} />
                <Text style={{
                    fontFamily: FUENTES.display,
                    marginTop: 16,
                    color: DISENO.colors.textSecondary,
                    fontSize: 14,
                }}>
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

            <View style={[
                styles.header,
                {
                    paddingTop: insets.top + (isTablet ? 20 : 10),
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity style={styles.backButton} onPress={handleVolverAlCarrito} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={isTablet ? 26 : 22} color={DISENO.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: tituloSize, color: DISENO.colors.text }]}>
                    Confirmar Pedido
                </Text>
                <View style={{ width: isTablet ? 26 : 22 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 100,
                        paddingTop: isTablet ? 18 : 10,
                    }
                ]}
            >
                {perfil && beneficios && (
                    <Animated.View style={[styles.beneficiosSection, {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }]}>
                        <View style={[styles.beneficiosCard, {
                            padding: isTablet ? 16 : 12,
                            borderRadius: isTablet ? 14 : 12,
                            backgroundColor: DISENO.colors.surface,
                            borderWidth: 1,
                            borderColor: DISENO.colors.accentSecondary + '30',
                            ...DISENO.shadow.sm,
                        }]}>
                            <View style={styles.beneficiosHeader}>
                                <View style={styles.beneficiosIconContainer}>
                                    <Text style={styles.beneficiosIcon}>{nivel?.icono || '⭐'}</Text>
                                </View>
                                <View style={styles.beneficiosInfo}>
                                    <Text style={[styles.beneficiosTitle, {
                                        fontSize: isTablet ? 14 : 13,
                                        color: DISENO.colors.accentSecondary,
                                    }]}>
                                        {nivel?.nombre || 'Cliente'} {beneficios.descuento > 0 && `• ${beneficios.descuento}% OFF`}
                                    </Text>
                                    <Text style={[styles.beneficiosDesc, {
                                        fontSize: isTablet ? 12 : 11,
                                        color: DISENO.colors.textSecondary,
                                    }]}>
                                        {descripcionBeneficios || 'Acumulá puntos para subir de nivel'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.beneficiosList}>
                                {beneficios.descuento > 0 && (
                                    <View style={styles.beneficioTag}>
                                        <Ionicons name="pricetag-outline" size={14} color={DISENO.colors.accent} />
                                        <Text style={[styles.beneficioTagText, { fontSize: isTablet ? 12 : 11 }]}>
                                            {beneficios.descuento}% de descuento
                                        </Text>
                                    </View>
                                )}
                                {beneficios.envioGratis && (
                                    <View style={styles.beneficioTag}>
                                        <Ionicons name="bicycle-outline" size={14} color={DISENO.colors.success} />
                                        <Text style={[styles.beneficioTagText, { fontSize: isTablet ? 12 : 11 }]}>
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
                        <Text style={[styles.loadingUbicacionText, { color: DISENO.colors.textSecondary }]}>
                            Cargando ubicación...
                        </Text>
                    </View>
                )}

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }],
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        📞 Datos de contacto
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border }]}>
                        <Ionicons name="call-outline" size={22} color={DISENO.colors.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { fontSize: inputSize, color: DISENO.colors.text }]}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Teléfono"
                            placeholderTextColor={DISENO.colors.textTertiary}
                            keyboardType="phone-pad"
                            selectionColor={DISENO.colors.accent}
                        />
                    </View>
                    {perfil?.telefono && (
                        <Text style={[styles.datosGuardados, { color: DISENO.colors.success }]}>
                            📌 Cargado desde tu perfil
                        </Text>
                    )}
                </Animated.View>

                {guardandoPerfil && (
                    <View style={[styles.guardandoPerfilContainer, { backgroundColor: DISENO.colors.accentSecondary + '15', borderColor: DISENO.colors.accentSecondary + '20' }]}>
                        <ActivityIndicator size="small" color={DISENO.colors.accentSecondary} />
                        <Text style={[styles.guardandoPerfilText, { color: DISENO.colors.accentSecondary }]}>
                            Guardando en tu perfil...
                        </Text>
                    </View>
                )}

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        🚚 Tipo de entrega
                    </Text>
                    <View style={[styles.options, { gap: isTablet ? 12 : 8 }]}>
                        {tiposEntrega.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[styles.option, {
                                    padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                                    borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                    backgroundColor: tipoEntrega === t.id ? DISENO.colors.accentSecondary : DISENO.colors.surface,
                                    borderColor: tipoEntrega === t.id ? DISENO.colors.accentSecondary : DISENO.colors.border,
                                }]}
                                onPress={() => setTipoEntrega(t.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={t.icono as any}
                                    size={isTablet ? 28 : 22}
                                    color={tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary}
                                />
                                <Text style={[styles.optionText, {
                                    fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                    color: tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                }]}>
                                    {t.label}
                                </Text>
                                <Text style={[styles.optionPrice, {
                                    fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                    color: tipoEntrega === t.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                }]}>
                                    {t.costo === 0 ? 'GRATIS' : formatearPrecio(t.costo)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {tipoEntrega === 'domicilio' && (
                    <Animated.View style={[styles.section, {
                        opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                    }]}>
                        <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                            📍 Dirección de entrega
                        </Text>

                        {/* ============================================================ */}
                        {/* ✅ MODO VISTA: solo muestra la dirección + botón editar       */}
                        {/* ============================================================ */}
                        {modoDireccion === 'vista' && (
                            <>
                                <View style={[styles.direccionPerfilContainer, {
                                    padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    backgroundColor: direccionDelPerfil ? DISENO.colors.success + '15' : DISENO.colors.surface,
                                    borderColor: direccionDelPerfil ? DISENO.colors.success + '30' : DISENO.colors.border,
                                }]}>
                                    <View style={styles.direccionPerfilHeader}>
                                        <Ionicons
                                            name={direccionDelPerfil ? "checkmark-circle" : "location-outline"}
                                            size={isTablet ? 22 : 18}
                                            color={direccionDelPerfil ? DISENO.colors.success : DISENO.colors.accent}
                                        />
                                        <Text style={[styles.direccionPerfilLabel, {
                                            fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                            color: direccionDelPerfil ? DISENO.colors.success : DISENO.colors.accent,
                                        }]}>
                                            {direccionDelPerfil ? 'Dirección de tu perfil' : 'Dirección personalizada'}
                                        </Text>
                                        {ubicacionSeleccionada && !direccionDelPerfil && (
                                            <View style={[styles.ubicacionConfirmada, { backgroundColor: DISENO.colors.success + '15' }]}>
                                                <Ionicons name="checkmark-circle" size={isTablet ? 14 : 10} color={DISENO.colors.success} />
                                                <Text style={[styles.ubicacionConfirmadaText, { fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9, color: DISENO.colors.success }]}>
                                                    Confirmada
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.direccionPerfilTexto, {
                                        fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14,
                                        color: DISENO.colors.text,
                                    }]}>
                                        {direccion || 'No hay dirección cargada'}
                                    </Text>

                                    {/* Botones de acción en modo vista */}
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
                                            <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.accent }}>
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
                                            <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.info }}>
                                                Mapa
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Info del envío calculado */}
                                {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View style={[styles.infoEnvioContainer, { backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border }]}>
                                        <View style={styles.infoEnvioFila}>
                                            <Ionicons name="navigate" size={18} color={DISENO.colors.accent} />
                                            <Text style={[styles.infoEnvioText, { color: DISENO.colors.textSecondary }]}>
                                                📏 Distancia: {distanciaFormateada || 'Calculando...'}
                                            </Text>
                                        </View>
                                        {envioDisponible ? (
                                            <>
                                                <View style={styles.infoEnvioFila}>
                                                    <Ionicons name="cash" size={18} color={DISENO.colors.success} />
                                                    <Text style={[styles.infoEnvioText, { color: DISENO.colors.success }]}>
                                                        💰 Costo de envío: {envioGratisAplicado ? 'GRATIS' : formatearPrecio(costoEnvioCalculado)}
                                                    </Text>
                                                </View>
                                                <View style={styles.infoEnvioFila}>
                                                    <Ionicons name="time-outline" size={18} color={DISENO.colors.accent} />
                                                    <Text style={[styles.infoEnvioText, { color: DISENO.colors.accent }]}>
                                                        ⏱️ Tiempo estimado: {tiempoEstimado} min
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.infoEnvioFila}>
                                                <Ionicons name="warning" size={18} color={DISENO.colors.accent} />
                                                <Text style={[styles.infoEnvioText, { color: DISENO.colors.accent }]}>
                                                    ⚠️ {mensajeEnvio}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {calculandoEnvio && tipoEntrega === 'domicilio' && (
                                    <View style={[styles.infoEnvioContainer, { backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border }]}>
                                        <View style={styles.infoEnvioFila}>
                                            <ActivityIndicator size="small" color={DISENO.colors.accent} />
                                            <Text style={[styles.infoEnvioText, { color: DISENO.colors.textSecondary }]}>Calculando envío...</Text>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        {/* ============================================================ */}
                        {/* ✅ MODO TEXTO: input libre + botón verificar                  */}
                        {/* ============================================================ */}
                        {modoDireccion === 'texto' && (
                            <View style={[styles.direccionPerfilContainer, {
                                padding: isTablet ? 16 : 12,
                                borderRadius: isTablet ? 14 : 12,
                                backgroundColor: DISENO.colors.surface,
                                borderColor: DISENO.colors.accent + '40',
                            }]}>
                                <View style={styles.direccionPerfilHeader}>
                                    <Ionicons name="pencil" size={isTablet ? 20 : 18} color={DISENO.colors.accent} />
                                    <Text style={[styles.direccionPerfilLabel, {
                                        fontSize: isTablet ? 14 : 13,
                                        color: DISENO.colors.accent,
                                    }]}>
                                        Editar dirección
                                    </Text>
                                </View>

                                <TextInput
                                    style={[styles.buscadorManualInput, {
                                        fontSize: inputSize,
                                        color: DISENO.colors.text,
                                        backgroundColor: DISENO.colors.surfaceHover,
                                        borderColor: DISENO.colors.border,
                                        marginTop: 8,
                                    }]}
                                    value={direccionInput}
                                    onChangeText={setDireccionInput}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    selectionColor={DISENO.colors.accent}
                                    autoFocus
                                    multiline
                                />

                                {errorDireccion && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                        <Ionicons name="alert-circle" size={14} color={DISENO.colors.accent} />
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, color: DISENO.colors.accent, flex: 1 }}>
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 13, fontWeight: '600', color: DISENO.colors.text }}>
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.info }}>
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.textSecondary }}>
                                            Cancelar
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* ============================================================ */}
                        {/* ✅ MODO FORMULARIO: campos manuales (geocoder falló)          */}
                        {/* ============================================================ */}
                        {modoDireccion === 'formulario' && (
                            <View style={[styles.direccionPerfilContainer, {
                                padding: isTablet ? 16 : 12,
                                borderRadius: isTablet ? 14 : 12,
                                backgroundColor: DISENO.colors.surface,
                                borderColor: DISENO.colors.accent + '40',
                            }]}>
                                <View style={styles.direccionPerfilHeader}>
                                    <Ionicons name="warning" size={isTablet ? 20 : 18} color={DISENO.colors.accent} />
                                    <Text style={[styles.direccionPerfilLabel, {
                                        fontSize: isTablet ? 14 : 13,
                                        color: DISENO.colors.accent,
                                        flex: 1,
                                    }]}>
                                        {errorDireccion || 'Completá la dirección manualmente'}
                                    </Text>
                                </View>

                                {/* Calle */}
                                <View style={{ marginTop: 10 }}>
                                    <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                        Calle *
                                    </Text>
                                    <TextInput
                                        style={[styles.buscadorManualInput, {
                                            fontSize: inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                        }]}
                                        value={camposManuales.calle}
                                        onChangeText={(t) => setCamposManuales(prev => ({ ...prev, calle: t }))}
                                        placeholder="Ej: Av. Corrientes"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        selectionColor={DISENO.colors.accent}
                                    />
                                </View>

                                {/* Número */}
                                <View style={{ marginTop: 8 }}>
                                    <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                        Número *
                                    </Text>
                                    <TextInput
                                        style={[styles.buscadorManualInput, {
                                            fontSize: inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                        }]}
                                        value={camposManuales.numero}
                                        onChangeText={(t) => setCamposManuales(prev => ({ ...prev, numero: t }))}
                                        placeholder="Ej: 1234"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        keyboardType="number-pad"
                                        selectionColor={DISENO.colors.accent}
                                    />
                                </View>

                                {/* Piso + Depto en fila */}
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                            Piso
                                        </Text>
                                        <TextInput
                                            style={[styles.buscadorManualInput, {
                                                fontSize: inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                            }]}
                                            value={camposManuales.piso}
                                            onChangeText={(t) => setCamposManuales(prev => ({ ...prev, piso: t }))}
                                            placeholder="3"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                            Depto
                                        </Text>
                                        <TextInput
                                            style={[styles.buscadorManualInput, {
                                                fontSize: inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                            }]}
                                            value={camposManuales.departamento}
                                            onChangeText={(t) => setCamposManuales(prev => ({ ...prev, departamento: t }))}
                                            placeholder="A"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                        />
                                    </View>
                                </View>

                                {/* Barrio */}
                                <View style={{ marginTop: 8 }}>
                                    <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                        Barrio
                                    </Text>
                                    <TextInput
                                        style={[styles.buscadorManualInput, {
                                            fontSize: inputSize,
                                            color: DISENO.colors.text,
                                            backgroundColor: DISENO.colors.surfaceHover,
                                            borderColor: DISENO.colors.border,
                                        }]}
                                        value={camposManuales.barrio}
                                        onChangeText={(t) => setCamposManuales(prev => ({ ...prev, barrio: t }))}
                                        placeholder="Ej: San Nicolás"
                                        placeholderTextColor={DISENO.colors.textTertiary}
                                        selectionColor={DISENO.colors.accent}
                                    />
                                </View>

                                {/* Ciudad + CP en fila */}
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                            Ciudad
                                        </Text>
                                        <TextInput
                                            style={[styles.buscadorManualInput, {
                                                fontSize: inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                            }]}
                                            value={camposManuales.ciudad}
                                            onChangeText={(t) => setCamposManuales(prev => ({ ...prev, ciudad: t }))}
                                            placeholder="CABA"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            selectionColor={DISENO.colors.accent}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 11, fontWeight: '500', color: DISENO.colors.textSecondary, marginBottom: 4 }}>
                                            CP
                                        </Text>
                                        <TextInput
                                            style={[styles.buscadorManualInput, {
                                                fontSize: inputSize,
                                                color: DISENO.colors.text,
                                                backgroundColor: DISENO.colors.surfaceHover,
                                                borderColor: DISENO.colors.border,
                                            }]}
                                            value={camposManuales.codigoPostal}
                                            onChangeText={(t) => setCamposManuales(prev => ({ ...prev, codigoPostal: t }))}
                                            placeholder="1043"
                                            placeholderTextColor={DISENO.colors.textTertiary}
                                            keyboardType="number-pad"
                                            selectionColor={DISENO.colors.accent}
                                        />
                                    </View>
                                </View>

                                {/* Botones */}
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 13, fontWeight: '600', color: DISENO.colors.text }}>
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.info }}>
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
                                        <Text style={{ fontFamily: FUENTES.regular, fontSize: 12, fontWeight: '600', color: DISENO.colors.textSecondary }}>
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

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        💳 Método de pago
                    </Text>
                    <View style={[styles.options, { flexDirection: 'row', gap: isTablet ? 12 : 8 }]}>
                        {metodosPago.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.optionPago, {
                                    padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                    borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                    backgroundColor: metodoPago === m.id ? DISENO.colors.accentSecondary : DISENO.colors.surface,
                                    borderColor: metodoPago === m.id ? DISENO.colors.accentSecondary : DISENO.colors.border,
                                }]}
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
                                    size={isTablet ? 26 : 20}
                                    color={metodoPago === m.id ? DISENO.colors.text : DISENO.colors.textSecondary}
                                />
                                <Text style={[styles.optionText, {
                                    fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                    color: metodoPago === m.id ? DISENO.colors.text : DISENO.colors.textSecondary,
                                }]}>
                                    {m.label}
                                </Text>
                                {metodoPago === m.id && (
                                    <Ionicons name="checkmark-circle" size={isTablet ? 20 : 16} color={DISENO.colors.text} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {metodoPago === 'efectivo' && (
                        <View style={[styles.efectivoContainer, {
                            marginTop: 12,
                            padding: isTablet ? 16 : isSmallPhone ? 12 : 14,
                            borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                            backgroundColor: DISENO.colors.surface,
                            borderWidth: 1,
                            borderColor: DISENO.colors.accentSecondary + '30',
                        }]}>
                            <Text style={[styles.efectivoTitle, {
                                fontSize: isTablet ? 14 : isSmallPhone ? 13 : 13,
                                color: DISENO.colors.text,
                                marginBottom: 8,
                            }]}>
                                💰 Pago en efectivo
                            </Text>

                            <Text style={[styles.efectivoSubtitle, {
                                fontSize: isTablet ? 12 : isSmallPhone ? 11 : 11,
                                color: DISENO.colors.textSecondary,
                                marginBottom: 6,
                            }]}>
                                Total a pagar: <Text style={{ fontWeight: 'bold', color: DISENO.colors.accentSecondary }}>
                                    {formatearPrecio(totalFinal)}
                                </Text>
                            </Text>

                            <View style={[styles.efectivoInputContainer, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: DISENO.colors.surfaceHover,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: DISENO.colors.border,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                marginTop: 4,
                            }]}>
                                <Text style={[styles.efectivoInputPrefix, {
                                    fontSize: isTablet ? 17 : isSmallPhone ? 16 : 16,
                                    color: DISENO.colors.textSecondary,
                                    marginRight: 4,
                                }]}>
                                    $
                                </Text>
                                <TextInput
                                    style={[styles.efectivoInput, {
                                        flex: 1,
                                        fontSize: isTablet ? 17 : isSmallPhone ? 16 : 16,
                                        color: DISENO.colors.text,
                                        paddingVertical: 10,
                                    }]}
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
                                />
                            </View>

                            {mostrarVuelto && vueltoCalculado > 0 && (
                                <View style={[styles.vueltoContainer, {
                                    marginTop: 10,
                                    padding: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: DISENO.colors.success + '15',
                                    borderWidth: 1,
                                    borderColor: DISENO.colors.success + '30',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="cash-outline" size={isTablet ? 24 : 20} color={DISENO.colors.success} />
                                        <Text style={[styles.vueltoLabel, {
                                            fontSize: isTablet ? 13 : isSmallPhone ? 12 : 12,
                                            color: DISENO.colors.text,
                                        }]}>
                                            💵 Vuelto:
                                        </Text>
                                    </View>
                                    <Text style={[styles.vueltoMonto, {
                                        fontSize: isTablet ? 20 : isSmallPhone ? 18 : 18,
                                        color: DISENO.colors.success,
                                    }]}>
                                        {formatearPrecio(vueltoCalculado)}
                                    </Text>
                                </View>
                            )}

                            {montoConQuePaga && !mostrarVuelto && parseFloat(montoConQuePaga) > 0 && (
                                <View style={[styles.efectivoError, {
                                    marginTop: 8,
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    backgroundColor: DISENO.colors.accent + '15',
                                    borderWidth: 1,
                                    borderColor: DISENO.colors.accent + '30',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }]}>
                                    <Ionicons name="warning" size={isTablet ? 18 : 14} color={DISENO.colors.accent} />
                                    <Text style={[styles.efectivoErrorText, {
                                        fontSize: isTablet ? 12 : isSmallPhone ? 11 : 11,
                                        color: DISENO.colors.accent,
                                    }]}>
                                        El monto es insuficiente. El total es {formatearPrecio(totalFinal)}
                                    </Text>
                                </View>
                            )}

                            {(!montoConQuePaga || (montoConQuePaga && !mostrarVuelto)) && (
                                <TouchableOpacity
                                    style={[styles.efectivoSugerencia, {
                                        marginTop: 8,
                                        padding: isTablet ? 8 : isSmallPhone ? 6 : 8,
                                        borderRadius: isTablet ? 8 : isSmallPhone ? 6 : 8,
                                        backgroundColor: DISENO.colors.accentSecondary + '15',
                                        alignSelf: 'flex-start',
                                    }]}
                                    onPress={() => {
                                        const totalStr = totalFinal.toFixed(2);
                                        setMontoConQuePaga(totalStr);
                                        calcularVuelto(totalStr);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.efectivoSugerenciaText, {
                                        fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                        color: DISENO.colors.accentSecondary,
                                    }]}>
                                        💡 Pagar con el monto exacto
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Animated.View>

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        📝 Notas (opcional)
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border }]}>
                        <Ionicons name="create-outline" size={22} color={DISENO.colors.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.textArea, { fontSize: inputSize, color: DISENO.colors.text }]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Sin cebolla, extra queso..."
                            placeholderTextColor={DISENO.colors.textTertiary}
                            multiline
                            numberOfLines={2}
                            selectionColor={DISENO.colors.accent}
                        />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        🛒 Productos ({elementos.length})
                    </Text>
                    {elementos.map((e, i) => (
                        <View key={i} style={[styles.productoItem, { borderBottomColor: DISENO.colors.border }]}>
                            <Text style={[styles.productoNombre, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.textSecondary }]}>
                                {e.cantidad}x {e.producto.nombre}
                            </Text>
                            <Text style={[styles.productoPrecio, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DISENO.colors.accent }]}>
                                {formatearPrecio(precioUnitario(e.producto.precio) * e.cantidad)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View style={[styles.section, {
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                        📊 Resumen
                    </Text>
                    <View style={styles.resumenFila}>
                        <Text style={[styles.resumenText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.text }]}>{formatearPrecio(subtotal)}</Text>
                    </View>

                    {beneficios && beneficios.descuento > 0 && descuentoNivelAplicado > 0 && (
                        <View style={[styles.resumenFila, styles.resumenBeneficio]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="pricetag-outline" size={14} color={DISENO.colors.accent} />
                                <Text style={[styles.resumenText, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DISENO.colors.accent }]}>
                                    Descuento {nivel?.nombre} ({beneficios.descuento}%)
                                </Text>
                            </View>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DISENO.colors.success }]}>
                                -{formatearPrecio(descuentoNivelAplicado)}
                            </Text>
                        </View>
                    )}

                    {descuentoPuntos > 0 && (
                        <View style={styles.resumenFila}>
                            <Text style={[styles.resumenText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success }]}>
                                Descuento por puntos
                            </Text>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success }]}>
                                -{formatearPrecio(descuentoPuntos)}
                            </Text>
                        </View>
                    )}

                    {descuentoCuponUI > 0 && (
                        <View style={styles.resumenFila}>
                            <Text style={[styles.resumenText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success }]}>
                                Descuento cupón {cuponAplicado?.codigo ? `(${cuponAplicado.codigo})` : ''}
                            </Text>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success }]}>
                                -{formatearPrecio(descuentoCuponUI)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.resumenFila}>
                        <Text style={[styles.resumenText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.textSecondary }]}>Costo de envío</Text>
                        <Text style={[styles.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.text }]}>
                            {tipoEntrega === 'retiro' ? 'GRATIS' :
                                (envioGratisAplicado ? 'GRATIS (beneficio)' :
                                    (envioGratisCupon ? 'GRATIS (cupón)' :
                                        (ubicacionSeleccionada ?
                                            (envioDisponible ? formatearPrecio(costoEnvioCalculado) : 'No disponible') :
                                            'Selecciona ubicación')))}
                        </Text>
                    </View>

                    <View style={[styles.resumenFila, styles.resumenTotal, { borderTopColor: DISENO.colors.border }]}>
                        <Text style={[styles.totalText, { fontSize: isTablet ? 18 : isSmallPhone ? 16 : 17, color: DISENO.colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20, color: DISENO.colors.accent }]}>
                            {formatearPrecio(totalFinal)}
                        </Text>
                    </View>

                    {metodoPago === 'efectivo' && mostrarVuelto && vueltoCalculado > 0 && (
                        <View style={[styles.resumenFila, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: DISENO.colors.border }]}>
                            <Text style={[styles.resumenText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success, fontWeight: '600' }]}>
                                💵 Vuelto
                            </Text>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success, fontWeight: 'bold' }]}>
                                {formatearPrecio(vueltoCalculado)}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                <Animated.View style={{
                    opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                }}>
                    <TouchableOpacity
                        style={[styles.botonConfirmar, cargando && { opacity: 0.6 }]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                            style={styles.botonConfirmarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {cargando ? (
                                <ActivityIndicator color={DISENO.colors.text} size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={isTablet ? 26 : 22} color={DISENO.colors.text} />
                                    <Text style={[styles.botonConfirmarText, { fontSize: buttonTextSize, color: DISENO.colors.text }]}>
                                        {metodoPago === 'transferencia' ? 'Pagar con Transferencia' : 'Confirmar Pedido'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, {
                        padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
                        borderRadius: isTablet ? 28 : 24,
                        borderColor: DISENO.colors.accentSecondary,
                        borderWidth: 1,
                        backgroundColor: DISENO.colors.surface,
                        ...DISENO.shadow.lg,
                    }]}>
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[styles.modalTitle, { fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20, color: DISENO.colors.accentSecondary }]}>
                            ¡Pedido confirmado!
                        </Text>
                        <Text style={[styles.modalText, { fontSize: isTablet ? 14 : isSmallPhone ? 13 : 13, color: DISENO.colors.textSecondary }]}>
                            {metodoPago === 'efectivo' && mostrarVuelto
                                ? `💰 Pagás con ${formatearPrecio(parseFloat(montoConQuePaga.replace(',', '.')))}. Tu vuelto es ${formatearPrecio(vueltoCalculado)}`
                                : 'Tu pedido está siendo preparado'}
                        </Text>
                        <Text style={[styles.modalSubtext, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DISENO.colors.accent }]}>
                            Redirigiendo al seguimiento...
                        </Text>
                        <View style={styles.modalLoader}>
                            {renderLoaderDots()}
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={mostrarModalTransferencia}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalTransferenciaOverlay}>
                    <View style={[styles.modalTransferencia, {
                        width: isTablet ? 480 : responsive.width * 0.92,
                        maxWidth: 480,
                        backgroundColor: DISENO.colors.surface,
                        borderColor: DISENO.colors.border,
                        borderRadius: 20,
                        overflow: 'hidden',
                        borderWidth: 1,
                        ...DISENO.shadow.lg,
                    }]}>
                        <LinearGradient
                            colors={[DISENO.colors.accent, DISENO.colors.accentSecondary]}
                            style={styles.modalTransferenciaHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.modalTransferenciaHeaderContent}>
                                <View style={styles.modalTransferenciaHeaderIcon}>
                                    <Ionicons name="swap-horizontal-outline" size={24} color={DISENO.colors.text} />
                                </View>
                                <Text style={styles.modalTransferenciaHeaderTitle}>
                                    Transferencia
                                </Text>
                            </View>
                        </LinearGradient>

                        <ScrollView
                            style={styles.modalTransferenciaBodyScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalTransferenciaBodyContent}
                        >
                            <Text style={styles.modalTransferenciaMensaje}>
                                Para completar tu pedido, realizá la transferencia a los siguientes datos:
                            </Text>

                            <View style={styles.modalTransferenciaAliasContainer}>
                                <View style={styles.modalTransferenciaAliasHeader}>
                                    <Ionicons name="cash-outline" size={16} color={DISENO.colors.textSecondary} />
                                    <Text style={styles.modalTransferenciaAliasLabel}>Alias</Text>
                                </View>
                                <View style={styles.modalTransferenciaAliasRow}>
                                    <Text style={styles.modalTransferenciaAliasTexto} numberOfLines={1} adjustsFontSizeToFit>
                                        {ALIAS_TRANSFERENCIA}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={copiarAlias}
                                        style={styles.modalTransferenciaAliasCopiar}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="copy-outline" size={18} color={DISENO.colors.accent} />
                                        <Text style={styles.modalTransferenciaAliasCopiarText}>Copiar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalTransferenciaCbuContainer}>
                                <Text style={styles.modalTransferenciaCbuLabel}>CBU</Text>
                                <Text style={styles.modalTransferenciaCbuTexto} numberOfLines={1} adjustsFontSizeToFit>
                                    {CUENTA_TRANSFERENCIA}
                                </Text>
                            </View>

                            <View style={styles.modalTransferenciaMontoContainer}>
                                <Text style={styles.modalTransferenciaMontoLabel}>Monto a transferir</Text>
                                <Text style={styles.modalTransferenciaMontoTexto}>
                                    {formatearPrecio(totalFinal)}
                                </Text>
                            </View>

                            <Text style={styles.modalTransferenciaPedidoId}>
                                Pedido #{pedidoIdTransferencia}
                            </Text>

                            <View style={styles.modalTransferenciaBotones}>
                                <TouchableOpacity
                                    style={[styles.modalTransferenciaBoton, styles.modalTransferenciaBotonSecundario]}
                                    onPress={cerrarModalTransferencia}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color={DISENO.colors.textSecondary} />
                                    <Text style={styles.modalTransferenciaBotonSecundarioText}>
                                        Ya transferí
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalTransferenciaBoton, styles.modalTransferenciaBotonPrincipal]}
                                    onPress={abrirBanco}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="open-outline" size={18} color={DISENO.colors.text} />
                                    <Text style={styles.modalTransferenciaBotonPrincipalText}>
                                        Mercado Pago
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalTransferenciaFooter}>
                                ⏳ Una vez realizada la transferencia, presioná "Ya transferí"
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Toast
                visible={toast.visible}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                ocultar={toast.ocultar}
            />
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS - TEMA CLARO CON SIMPSONFONT
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
    },
    scroll: {
        flexGrow: 1,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    inputIcon: {
        marginRight: 12,
        marginTop: 12,
    },
    input: {
        fontFamily: FUENTES.regular,
        flex: 1,
        paddingVertical: 12,
        paddingRight: 8,
    },
    textArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    options: { gap: 8 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        gap: 10,
    },
    optionPago: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        gap: 8,
    },
    optionText: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        flex: 1,
    },
    optionPrice: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    botonMapa: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    botonMapaText: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        flex: 1,
        marginLeft: 8,
    },
    sugerenciaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    sugerenciaText: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
        flex: 1,
    },
    infoEnvioContainer: {
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
        borderWidth: 1,
    },
    infoEnvioFila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 3,
    },
    infoEnvioText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '500',
    },
    productoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
    },
    productoNombre: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    productoPrecio: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resumenText: {
        fontFamily: FUENTES.regular,
        opacity: 0.8,
    },
    resumenValor: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    resumenTotal: {
        borderTopWidth: 1,
        paddingTop: 10,
        marginTop: 4,
    },
    totalText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    totalPrice: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    botonConfirmar: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        ...DISENO.shadow.md,
    },
    botonConfirmarGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 24,
    },
    botonConfirmarText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        letterSpacing: 0.5,
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
    },
    modalIcon: { marginBottom: 12 },
    modalTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginBottom: 8,
    },
    modalText: {
        fontFamily: FUENTES.regular,
        textAlign: 'center',
        opacity: 0.8,
    },
    modalSubtext: {
        fontFamily: FUENTES.regular,
        marginTop: 12,
        fontWeight: '500',
    },
    modalLoader: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    modalLoaderDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: DISENO.colors.accent,
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
    loadingUbicacionText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '500',
    },
    direccionPerfilContainer: {
        borderWidth: 1,
        marginBottom: 12,
    },
    direccionPerfilHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
        flexWrap: 'wrap',
    },
    direccionPerfilLabel: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        opacity: 0.8,
    },
    direccionPerfilTexto: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
        lineHeight: 20,
    },
    direccionPerfilSubtexto: {
        fontFamily: FUENTES.regular,
        marginTop: 6,
        opacity: 0.6,
        fontStyle: 'italic',
    },
    guardandoPerfilContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
    },
    guardandoPerfilText: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '500',
    },
    ubicacionConfirmada: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
        marginLeft: 8,
    },
    ubicacionConfirmadaText: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    datosGuardados: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    buscadorManualContainer: {
        marginTop: 8,
        marginBottom: 4,
    },
    buscadorManualLabel: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
        marginBottom: 6,
        opacity: 0.7,
    },
    buscadorManualFila: {
        flexDirection: 'row',
        gap: 8,
    },
    buscadorManualInput: {
        fontFamily: FUENTES.regular,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
    },
    botonBuscar: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 50,
    },
    efectivoContainer: {},
    efectivoTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    efectivoSubtitle: {
        fontFamily: FUENTES.regular,
        opacity: 0.8,
    },
    efectivoInputContainer: {},
    efectivoInputPrefix: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    efectivoInput: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    efectivoInputSuffix: {
        fontFamily: FUENTES.regular,
        opacity: 0.6,
    },
    vueltoContainer: {},
    vueltoLabel: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    vueltoMonto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    efectivoError: {},
    efectivoErrorText: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    efectivoSugerencia: {},
    efectivoSugerenciaText: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    beneficiosSection: {
        marginBottom: 12,
    },
    beneficiosCard: {
        marginBottom: 4,
    },
    beneficiosHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    beneficiosIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DISENO.colors.accentSecondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    beneficiosIcon: { fontSize: 18 },
    beneficiosInfo: { flex: 1 },
    beneficiosTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    beneficiosDesc: {
        fontFamily: FUENTES.regular,
        opacity: 0.8,
    },
    beneficiosList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    beneficioTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: DISENO.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    beneficioTagText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
    beneficioTagSub: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textTertiary,
    },
    resumenBeneficio: {
        backgroundColor: DISENO.colors.accent + '08',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 2,
    },
    modalTransferenciaOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalTransferencia: {
        width: '100%',
        maxHeight: '85%',
        alignSelf: 'center',
    },
    modalTransferenciaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    modalTransferenciaHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    },
    modalTransferenciaHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: DISENO.colors.text + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTransferenciaHeaderTitle: {
        fontFamily: FUENTES.display,
        fontSize: 16,
        fontWeight: '400',
        color: DISENO.colors.text,
        letterSpacing: 0.3,
    },
    modalTransferenciaBodyScroll: {
        maxHeight: '80%',
    },
    modalTransferenciaBodyContent: {
        padding: 20,
        paddingBottom: 8,
    },
    modalTransferenciaMensaje: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        color: DISENO.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    modalTransferenciaAliasContainer: {
        backgroundColor: DISENO.colors.accentSecondary + '08',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: DISENO.colors.accentSecondary + '20',
        marginBottom: 12,
    },
    modalTransferenciaAliasHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    modalTransferenciaAliasLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        fontWeight: '600',
        color: DISENO.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalTransferenciaAliasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    modalTransferenciaAliasTexto: {
        fontFamily: FUENTES.display,
        fontSize: 16,
        fontWeight: '400',
        color: DISENO.colors.text,
        letterSpacing: 0.5,
        flexShrink: 1,
    },
    modalTransferenciaAliasCopiar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: DISENO.colors.accent + '15',
        flexShrink: 0,
    },
    modalTransferenciaAliasCopiarText: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        fontWeight: '600',
        color: DISENO.colors.accent,
    },
    modalTransferenciaCbuContainer: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: 12,
    },
    modalTransferenciaCbuLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 10,
        fontWeight: '600',
        color: DISENO.colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    modalTransferenciaCbuTexto: {
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: '500',
        color: DISENO.colors.text,
        letterSpacing: 0.3,
    },
    modalTransferenciaMontoContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: DISENO.colors.border,
        marginBottom: 12,
    },
    modalTransferenciaMontoLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: DISENO.colors.textSecondary,
        marginBottom: 2,
    },
    modalTransferenciaMontoTexto: {
        fontFamily: FUENTES.display,
        fontSize: 26,
        fontWeight: '400',
        color: DISENO.colors.accent,
    },
    modalTransferenciaPedidoId: {
        fontFamily: FUENTES.regular,
        textAlign: 'center',
        fontSize: 13,
        color: DISENO.colors.textTertiary,
        marginBottom: 16,
    },
    modalTransferenciaBotones: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
        width: '100%',
    },
    modalTransferenciaBoton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        minWidth: 0,
    },
    modalTransferenciaBotonPrincipal: {
        backgroundColor: DISENO.colors.accentSecondary,
        borderColor: DISENO.colors.accentSecondary,
    },
    modalTransferenciaBotonSecundario: {
        backgroundColor: DISENO.colors.surfaceHover,
        borderColor: DISENO.colors.border,
    },
    modalTransferenciaBotonPrincipalText: {
        fontFamily: FUENTES.display,
        fontSize: 12,
        fontWeight: '400',
        color: DISENO.colors.text,
    },
    modalTransferenciaBotonSecundarioText: {
        fontFamily: FUENTES.display,
        fontSize: 12,
        fontWeight: '400',
        color: DISENO.colors.textSecondary,
    },
    modalTransferenciaFooter: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        lineHeight: 16,
        paddingBottom: 4,
    },
});