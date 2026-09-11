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
    KeyboardAvoidingView,
    Platform,
    Clipboard,
    Linking,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

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

export default function PantallaCheckout(props: any) {
    const responsive = useResponsive();
    const insets = useSafeAreaInsets();
    const { elementos, vaciarCarrito, calcularTotal } = tiendaCarrito();
    const { crearPedido } = tiendaPedidos();
    const {
        perfil,
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

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const dot1Anim = useRef(new Animated.Value(0)).current;
    const dot2Anim = useRef(new Animated.Value(0)).current;
    const dot3Anim = useRef(new Animated.Value(0)).current;

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;

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
            calcularCostoEnvio(ubicacionRecibida.latitude, ubicacionRecibida.longitude);
            setCargandoUbicacion(false);
            if (ubicacionRecibida.direccion) guardarUbicacionTemporal(ubicacionRecibida);
        } else {
            cargarUbicacionDesdeStore();
        }
    }, []);

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
                calcularCostoEnvio(ubicacionCargada.latitude, ubicacionCargada.longitude);
                setCargandoUbicacion(false);
                return;
            }
            if (ubicacionStore) {
                setUbicacionSeleccionada({ latitude: ubicacionStore.latitude, longitude: ubicacionStore.longitude });
                setDireccion(ubicacionStore.direccion || '');
                setDireccionCompleta(ubicacionStore.direccion || '');
                setDireccionDelPerfil(false);
                calcularCostoEnvio(ubicacionStore.latitude, ubicacionStore.longitude);
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
            if (direccion && direccionDelPerfil === false) datosActualizados.direccion_calle = direccion;
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
            }
        } catch (error) {
            console.error('Error calculando envío:', error);
            setEnvioDisponible(false);
            setMensajeEnvio('Error al calcular el envío');
        } finally {
            setCalculandoEnvio(false);
        }
    };

    useEffect(() => {
        if (ubicacionSeleccionada && tipoEntrega === 'domicilio') {
            calcularCostoEnvio(ubicacionSeleccionada.latitude, ubicacionSeleccionada.longitude);
        } else if (tipoEntrega === 'retiro') {
            setCostoEnvioCalculado(0);
            setEnvioDisponible(true);
            setDistanciaFormateada('');
            setTiempoEstimado(0);
        }
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
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
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
            }
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
        }
    };

    const obtenerDireccionDesdeCoordenadas = async (lat: number, lng: number): Promise<string | null> => {
        try {
            const resultados = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (resultados && resultados.length > 0) {
                const lugar = resultados[0];
                const partes = [lugar.street || lugar.name, lugar.streetNumber, lugar.district, lugar.city, lugar.region].filter(Boolean);
                return partes.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
            return null;
        } catch (error) {
            return null;
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

    const seleccionarUbicacionEnMapa = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setUbicacionSeleccionada({ latitude, longitude });
        const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
        if (direccionObtenida) {
            setDireccionCompleta(direccionObtenida);
            setDireccion(direccionObtenida);
            setDireccionDelPerfil(false);
            await guardarUbicacionTemporal({ latitude, longitude, direccion: direccionObtenida });
        }
    };

    const handleVolverAlCarrito = async () => {
        if (ubicacionSeleccionada) await guardarDireccionEnStore(ubicacionSeleccionada);
        props.navigation.goBack();
    };

    const handleConfirmarUbicacion = async (ubicacion: { latitude: number; longitude: number; direccion: string }) => {
        setUbicacionSeleccionada({ latitude: ubicacion.latitude, longitude: ubicacion.longitude });
        setDireccion(ubicacion.direccion);
        setDireccionCompleta(ubicacion.direccion);
        setDireccionDelPerfil(false);
        await guardarUbicacionTemporal({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
            direccion: ubicacion.direccion,
            seleccionadaPorUsuario: true,
        });
        calcularCostoEnvio(ubicacion.latitude, ubicacion.longitude);
        setMostrarMapa(false);
        toast.exito('📍 Ubicación seleccionada correctamente');
    };

    const copiarAlias = async () => {
        await Clipboard.setString(ALIAS_TRANSFERENCIA);
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

        if (cuponAplicado?.id && perfil?.id) {
            const resultadoCupon = await cuponService.finalizarCuponPedido(cuponAplicado.id, perfil.id, pedidoId);
            if (!resultadoCupon.success) {
                toast.advertencia(`El pedido #${pedidoId} fue creado, pero el cupón no pudo aplicarse: ${resultadoCupon.mensaje}`);
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

    return (
        <View style={styles.container}>
            {/* ✅ FONDO TEMA CLARO */}
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
                {/* ✅ SECCIÓN DE BENEFICIOS */}
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

                {/* ✅ DATOS DE CONTACTO */}
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

                {/* ✅ TIPO DE ENTREGA */}
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

                {/* ✅ DIRECCIÓN DE ENTREGA */}
                {tipoEntrega === 'domicilio' && (
                    <Animated.View style={[styles.section, {
                        opacity: fadeAnim, transform: [{ translateY: slideUpAnim }], marginTop: 12,
                    }]}>
                        <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DISENO.colors.text }]}>
                            📍 Dirección de entrega
                        </Text>

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
                        </View>

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

                        <View style={styles.buscadorManualContainer}>
                            <Text style={[styles.buscadorManualLabel, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DISENO.colors.textSecondary }]}>
                                🔍 Buscar dirección en el mapa
                            </Text>
                            <View style={styles.buscadorManualFila}>
                                <TextInput
                                    style={[styles.buscadorManualInput, { fontSize: inputSize, color: DISENO.colors.text, backgroundColor: DISENO.colors.surface, borderColor: DISENO.colors.border }]}
                                    value={busquedaManual}
                                    onChangeText={setBusquedaManual}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={DISENO.colors.textTertiary}
                                    selectionColor={DISENO.colors.accent}
                                />
                                <TouchableOpacity
                                    style={[styles.botonBuscar, {
                                        padding: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                        backgroundColor: DISENO.colors.accentSecondary,
                                    }]}
                                    onPress={buscarDireccionManual}
                                    activeOpacity={0.7}
                                    disabled={buscandoDireccion}
                                >
                                    {buscandoDireccion ? (
                                        <ActivityIndicator size="small" color={DISENO.colors.text} />
                                    ) : (
                                        <Ionicons name="search" size={isTablet ? 22 : 18} color={DISENO.colors.text} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.botonMapa, {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                marginTop: 8,
                                backgroundColor: DISENO.colors.surface,
                                borderColor: DISENO.colors.accent + '40',
                                borderWidth: 1,
                            }]}
                            onPress={() => setMostrarMapa(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="map-outline" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={DISENO.colors.accent} />
                            <Text style={[styles.botonMapaText, { fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14, color: DISENO.colors.accent }]}>
                                📍 Seleccionar ubicación en el mapa
                            </Text>
                            <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={DISENO.colors.textTertiary} />
                        </TouchableOpacity>

                        {direccionSugerida !== '' && direccion !== direccionSugerida && (
                            <TouchableOpacity
                                style={[styles.sugerenciaContainer, {
                                    padding: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: DISENO.colors.success + '15',
                                    borderColor: DISENO.colors.success + '20',
                                    borderWidth: 1,
                                }]}
                                onPress={() => {
                                    setDireccion(direccionSugerida);
                                    setDireccionCompleta(direccionSugerida);
                                    setDireccionSugerida('');
                                    setBusquedaManual('');
                                    setDireccionDelPerfil(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="location" size={isTablet ? 20 : 16} color={DISENO.colors.success} />
                                <Text style={[styles.sugerenciaText, { fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13, color: DISENO.colors.success }]}>
                                    {direccionSugerida}
                                </Text>
                            </TouchableOpacity>
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

                {/* ✅ MÉTODO DE PAGO */}
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

                {/* ✅ NOTAS */}
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

                {/* ✅ PRODUCTOS */}
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

                {/* ✅ RESUMEN */}
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

                {/* ✅ BOTÓN CONFIRMAR */}
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

            {/* ✅ MODAL DE ÉXITO */}
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

            {/* ✅ MODAL DE TRANSFERENCIA */}
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
    // ✅ TÍTULO CON SIMPSONFONT
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
    // ✅ SECTION TITLE CON SIMPSONFONT
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
    // ✅ INPUT CON FUENTE REGULAR
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
    // ✅ OPTION TEXT CON FUENTE REGULAR
    optionText: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        flex: 1,
    },
    // ✅ OPTION PRICE CON SIMPSONFONT
    optionPrice: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    botonMapa: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    // ✅ BOTON MAPA CON FUENTE REGULAR
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
    // ✅ INFO ENVIO CON FUENTE REGULAR
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
    // ✅ PRODUCTO NOMBRE CON FUENTE REGULAR
    productoNombre: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    // ✅ PRODUCTO PRECIO CON SIMPSONFONT
    productoPrecio: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    // ✅ RESUMEN TEXT CON FUENTE REGULAR
    resumenText: {
        fontFamily: FUENTES.regular,
        opacity: 0.8,
    },
    // ✅ RESUMEN VALOR CON SIMPSONFONT
    resumenValor: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    resumenTotal: {
        borderTopWidth: 1,
        paddingTop: 10,
        marginTop: 4,
    },
    // ✅ TOTAL TEXT CON SIMPSONFONT
    totalText: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    // ✅ TOTAL PRICE CON SIMPSONFONT
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
    // ✅ BOTÓN CONFIRMAR CON SIMPSONFONT
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
    // ✅ MODAL TITLE CON SIMPSONFONT
    modalTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        marginBottom: 8,
    },
    // ✅ MODAL TEXT CON FUENTE REGULAR
    modalText: {
        fontFamily: FUENTES.regular,
        textAlign: 'center',
        opacity: 0.8,
    },
    // ✅ MODAL SUBTEXT CON FUENTE REGULAR
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
    // ✅ LOADING CON FUENTE REGULAR
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
    // ✅ DIRECCION LABEL CON FUENTE REGULAR
    direccionPerfilLabel: {
        fontFamily: FUENTES.regular,
        fontWeight: '600',
        opacity: 0.8,
    },
    // ✅ DIRECCION TEXTO CON FUENTE REGULAR
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
    // ✅ DATOS GUARDADOS CON FUENTE REGULAR
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
    // ✅ BUSCADOR INPUT CON FUENTE REGULAR
    buscadorManualInput: {
        fontFamily: FUENTES.regular,
        flex: 1,
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
    // EFECTIVO
    efectivoContainer: {},
    // ✅ EFECTIVO TITLE CON SIMPSONFONT
    efectivoTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    // ✅ EFECTIVO SUBTITLE CON FUENTE REGULAR
    efectivoSubtitle: {
        fontFamily: FUENTES.regular,
        opacity: 0.8,
    },
    efectivoInputContainer: {},
    efectivoInputPrefix: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    // ✅ EFECTIVO INPUT CON SIMPSONFONT
    efectivoInput: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    efectivoInputSuffix: {
        fontFamily: FUENTES.regular,
        opacity: 0.6,
    },
    vueltoContainer: {},
    // ✅ VUELTO LABEL CON FUENTE REGULAR
    vueltoLabel: {
        fontFamily: FUENTES.regular,
        fontWeight: '500',
    },
    // ✅ VUELTO MONTO CON SIMPSONFONT
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
    // BENEFICIOS
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
    // ✅ BENEFICIOS TITLE CON SIMPSONFONT
    beneficiosTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
    },
    // ✅ BENEFICIOS DESC CON FUENTE REGULAR
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
    // ✅ BENEFICIO TAG CON FUENTE REGULAR
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
    // MODAL TRANSFERENCIA
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
    // ✅ TRANSFERENCIA HEADER TITLE CON SIMPSONFONT
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
    // ✅ MENSAJE CON FUENTE REGULAR
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
    // ✅ ALIAS TEXTO CON SIMPSONFONT
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
    // ✅ MONTO CON SIMPSONFONT
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
    // ✅ BOTÓN CON SIMPSONFONT
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