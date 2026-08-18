// screens/cliente/PantallaCheckout.tsx
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
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { useToast, Toast } from '../../components/Toast';
import { UbicacionGuardada } from '../../lib/tipos';

// ✅ IMPORTAR MAPA SELECTOR
import MapaSelector from '../../components/Mapa';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        surfaceHover: '#F8F6F2',
        card: '#FFFFFF',
        cardShadow: 'rgba(0,0,0,0.06)',
        border: 'rgba(0,0,0,0.06)',
        borderLight: 'rgba(0,0,0,0.04)',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        accent: '#E53935',
        accentLight: '#FF6B6B',
        accentSecondary: '#F5C518',
        accentSecondaryLight: '#FFE135',
        gradientStart: '#E53935',
        gradientEnd: '#F5C518',
        verde: '#43A047',
        verdeClaro: '#66BB6A',
        rosa: '#EC407A',
        azul: '#1A237E',
        azulClaro: '#3949AB',
        platino: '#78909C',
        oro: '#F9A825',
        plata: '#BDBDBD',
        bronce: '#A1887F',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        full: 999,
    },
};

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

    const spacing = (base: number) => {
        if (isTablet) return base * 1.5;
        if (isSmallPhone) return base * 0.75;
        return base;
    };

    return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

// ✅ ALIAS DE TRANSFERENCIA
const ALIAS_TRANSFERENCIA = 'krustyburger2025';
const CUENTA_TRANSFERENCIA = 'CBU: 1234567890123456789012';

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

    const toast = useToast();

    const total = calcularTotal();

    // ✅ Recibir datos del carrito
    const cuponAplicado = props.route?.params?.cuponAplicado || null;
    const descuento = props.route?.params?.descuento || 0;
    const ubicacionRecibida = props.route?.params?.ubicacionGuardada || null;

    const [totalFinal, setTotalFinal] = useState(total);

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

    // ✅ ESTADO PARA PAGO EN EFECTIVO
    const [montoConQuePaga, setMontoConQuePaga] = useState<string>('');
    const [vueltoCalculado, setVueltoCalculado] = useState<number>(0);
    const [mostrarVuelto, setMostrarVuelto] = useState(false);

    // ✅ ESTADO PARA MODAL DE TRANSFERENCIA
    const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
    const [pedidoIdTransferencia, setPedidoIdTransferencia] = useState<number | null>(null);

    // ✅ ESTADO PARA EL MAPA
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

    // ✅ FUNCIÓN PARA OBTENER PRECIO UNITARIO
    const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

    // ✅ CALCULAR VUELTO
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

    // ✅ EFECTO PARA MOSTRAR MODAL CUANDO SE SETEA EL ID
    useEffect(() => {
        if (pedidoIdTransferencia !== null) {
            console.log('🔴 useEffect: Mostrando modal para pedido:', pedidoIdTransferencia);
            setMostrarModalTransferencia(true);
        }
    }, [pedidoIdTransferencia]);

    useEffect(() => {
        cargarDatosPerfil();
        servicioEnvios.inicializar();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // ✅ Si recibimos ubicación del carrito, usarla
        if (ubicacionRecibida) {
            console.log('📍 Usando ubicación recibida del carrito:', ubicacionRecibida);
            setUbicacionSeleccionada({
                latitude: ubicacionRecibida.latitude,
                longitude: ubicacionRecibida.longitude,
            });
            setDireccion(ubicacionRecibida.direccion || '');
            setDireccionCompleta(ubicacionRecibida.direccion || '');
            setDireccionDelPerfil(false);
            calcularCostoEnvio(ubicacionRecibida.latitude, ubicacionRecibida.longitude);
            setCargandoUbicacion(false);
            if (ubicacionRecibida.direccion) {
                guardarUbicacionTemporal(ubicacionRecibida);
            }
        } else {
            cargarUbicacionDesdeStore();
        }
    }, []);

    // ✅ GUARDAR DIRECCIÓN EN EL STORE
    const guardarDireccionEnStore = async (ubicacion: { latitude: number; longitude: number }) => {
        try {
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(
                ubicacion.latitude,
                ubicacion.longitude
            );

            const ubicacionCompleta: UbicacionGuardada = {
                latitude: ubicacion.latitude,
                longitude: ubicacion.longitude,
                direccion: direccionObtenida || `${ubicacion.latitude}, ${ubicacion.longitude}`,
            };

            await guardarUbicacionTemporal(ubicacionCompleta);
            console.log('✅ Dirección guardada en el store');
        } catch (error) {
            console.error('Error guardando dirección:', error);
        }
    };

    const cargarUbicacionDesdeStore = async () => {
        console.log('📍 Cargando ubicación desde store...');
        setCargandoUbicacion(true);

        try {
            const ubicacionCargada = await cargarUbicacionTemporal();

            if (ubicacionCargada) {
                console.log('📍 Ubicación cargada desde AsyncStorage:', ubicacionCargada);
                setUbicacionSeleccionada({
                    latitude: ubicacionCargada.latitude,
                    longitude: ubicacionCargada.longitude,
                });
                setDireccion(ubicacionCargada.direccion || '');
                setDireccionCompleta(ubicacionCargada.direccion || '');
                setDireccionDelPerfil(false);
                calcularCostoEnvio(ubicacionCargada.latitude, ubicacionCargada.longitude);
                setCargandoUbicacion(false);
                return;
            }

            if (ubicacionStore) {
                console.log('📍 Usando ubicación del store:', ubicacionStore);
                setUbicacionSeleccionada({
                    latitude: ubicacionStore.latitude,
                    longitude: ubicacionStore.longitude,
                });
                setDireccion(ubicacionStore.direccion || '');
                setDireccionCompleta(ubicacionStore.direccion || '');
                setDireccionDelPerfil(false);
                calcularCostoEnvio(ubicacionStore.latitude, ubicacionStore.longitude);
                setCargandoUbicacion(false);
                return;
            }

            console.log('📍 No hay ubicación guardada, usando GPS');
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
            if (direccion && direccionDelPerfil === false) {
                datosActualizados.direccion_calle = direccion;
            }

            if (Object.keys(datosActualizados).length > 0) {
                await actualizarPerfil(datosActualizados);
                console.log('✅ Perfil actualizado con los datos de checkout');
            }
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
        const costoEnvioFinal = tipoEntrega === 'retiro' ? 0 : costoEnvioCalculado;
        setTotalFinal(total + costoEnvioFinal - descuento);
    }, [costoEnvioCalculado, tipoEntrega, total, descuento]);

    useEffect(() => {
        if (ubicacionSeleccionada && tipoEntrega === 'domicilio') {
            calcularCostoEnvio(
                ubicacionSeleccionada.latitude,
                ubicacionSeleccionada.longitude
            );
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
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0.3,
                            duration: 400,
                            useNativeDriver: true,
                        }),
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
                const ubicacion = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                const { latitude, longitude } = ubicacion.coords;
                setUbicacionSeleccionada({ latitude, longitude });

                const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
                if (direccionObtenida) {
                    setDireccionCompleta(direccionObtenida);
                    setDireccion(direccionObtenida);
                    setDireccionDelPerfil(false);

                    await guardarUbicacionTemporal({
                        latitude,
                        longitude,
                        direccion: direccionObtenida,
                    });
                }
            }
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
        }
    };

    const obtenerDireccionDesdeCoordenadas = async (lat: number, lng: number): Promise<string | null> => {
        try {
            const resultados = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng,
            });
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
            console.log('Error en geocodificación:', error);
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

                    await guardarUbicacionTemporal({
                        latitude,
                        longitude,
                        direccion: direccionFormateada,
                    });
                }
                setMostrarMapa(true);
            } else {
                toast.error('No se pudo encontrar la dirección ingresada');
            }
        } catch (error) {
            console.log('Error buscando dirección:', error);
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

            await guardarUbicacionTemporal({
                latitude,
                longitude,
                direccion: direccionObtenida,
            });
            console.log('✅ Ubicación guardada desde el mapa');
        }
    };

    const handleVolverAlCarrito = async () => {
        if (ubicacionSeleccionada) {
            await guardarDireccionEnStore(ubicacionSeleccionada);
        }
        props.navigation.goBack();
    };

    // ✅ FUNCIÓN PARA CONFIRMAR UBICACIÓN DESDE EL MAPA - GUARDA DIRECCIÓN COMPLETA
    const handleConfirmarUbicacion = async (ubicacion: { latitude: number; longitude: number; direccion: string }) => {
        console.log('📍 Ubicación confirmada desde el mapa:', ubicacion);

        // ✅ Guardar ubicación seleccionada
        setUbicacionSeleccionada({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
        });

        // ✅ Guardar dirección COMPLETA (no solo la calle)
        setDireccion(ubicacion.direccion);
        setDireccionCompleta(ubicacion.direccion);
        setDireccionDelPerfil(false);

        // ✅ Guardar en el store para persistencia
        await guardarUbicacionTemporal({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
            direccion: ubicacion.direccion,
        });

        // ✅ Calcular envío con la nueva ubicación
        calcularCostoEnvio(ubicacion.latitude, ubicacion.longitude);

        setMostrarMapa(false);
        toast.exito('📍 Ubicación seleccionada correctamente');
    };

    const copiarAlias = async () => {
        await Clipboard.setString(ALIAS_TRANSFERENCIA);
        toast.exito('¡Alias copiado!');
    };

    const abrirBanco = () => {
        Linking.openURL('https://www.mercadopago.com.ar/').catch(() => {
            toast.info('Abrí tu app bancaria y transferí al alias');
        });
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

        // ✅ Validar pago en efectivo
        if (metodoPago === 'efectivo') {
            const pago = parseFloat(montoConQuePaga.replace(',', '.'));
            if (isNaN(pago) || pago < totalFinal) {
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

        const costoEnvioFinal = cuponAplicado?.recompensas?.tipo === 'ENVIO_GRATIS'
            ? 0
            : (envioDisponible && tipoEntrega === 'domicilio' ? costoEnvioCalculado : 0);

        // ✅ Asegurar que se guarda la dirección completa
        const datosPedido: any = {
            id_de_usuario: perfil?.id,
            cliente_nombre: perfil?.nombre_cliente,
            telefono: telefono,
            direccion: tipoEntrega === 'retiro'
                ? 'Retiro en local'
                : direccionCompleta || direccion || 'Sin dirección',
            estado: 'pendiente',
            total_parcial: total,
            total: totalFinal,
            costo_envio: costoEnvioFinal,
            items_json: items,
            metodo_pago: metodoPago,
            tipo_entrega: tipoEntrega,
            notas: notas,
            puntos_usados: cuponAplicado?.puntos_usados || 0,
            lat_cliente: ubicacionSeleccionada?.latitude || null,
            lng_cliente: ubicacionSeleccionada?.longitude || null,
            distancia_km: distanciaCliente,
            tiempo_estimado: tiempoEstimado,
        };

        // ✅ Si es efectivo, guardar el vuelto
        if (metodoPago === 'efectivo' && montoConQuePaga && mostrarVuelto) {
            datosPedido.monto_pago = parseFloat(montoConQuePaga.replace(',', '.'));
            datosPedido.vuelto = vueltoCalculado;
        }

        if (cuponAplicado) {
            await supabase.from('canjes').update({ usado_en_pedido: true }).eq('id', cuponAplicado.id);
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

        console.log(`✅ Pedido creado con ID: ${pedidoId}`);
        console.log(`📍 Dirección guardada en pedido: ${datosPedido.direccion}`);
        console.log(`📍 Coordenadas: lat=${datosPedido.lat_cliente}, lng=${datosPedido.lng_cliente}`);

        vaciarCarrito();
        await limpiarUbicacionTemporal();

        if (metodoPago === 'transferencia') {
            console.log('🔴 TRANSFERENCIA SELECCIONADA - Pedido ID:', pedidoId);
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
            props.navigation.replace('Seguimiento', { pedidoId });
        }
    };

    const metodosPago = [
        { id: 'efectivo', label: 'Efectivo', icono: 'cash-outline' },
        { id: 'tarjeta', label: 'Tarjeta', icono: 'card-outline' },
        { id: 'transferencia', label: 'Transferencia', icono: 'swap-horizontal-outline' },
    ];

    const tiposEntrega = [
        {
            id: 'domicilio',
            label: 'Domicilio',
            icono: 'home-outline',
            costo: envioDisponible && costoEnvioCalculado > 0 ? costoEnvioCalculado : 0
        },
        {
            id: 'retiro',
            label: 'Retiro en local',
            icono: 'storefront-outline',
            costo: 0
        },
    ];

    const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
    const tituloSize = responsive.getValor({ tablet: 28, normal: 24, small: 18 });
    const seccionTituloSize = responsive.getValor({ tablet: 18, normal: 16, small: 14 });
    const inputSize = responsive.getValor({ tablet: 16, normal: 14, small: 13 });
    const buttonTextSize = responsive.getValor({ tablet: 20, normal: 18, small: 16 });

    const renderLoaderDots = () => {
        const dots = [
            { anim: dot1Anim, delay: 0 },
            { anim: dot2Anim, delay: 200 },
            { anim: dot3Anim, delay: 400 },
        ];
        return dots.map((dot, index) => {
            const opacity = dot.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
            });
            const scale = dot.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
            });
            return (
                <Animated.View
                    key={index}
                    style={[
                        styles.modalLoaderDot,
                        {
                            opacity,
                            transform: [{ scale }],
                        }
                    ]}
                />
            );
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleVolverAlCarrito}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
                    Confirmar Pedido
                </Text>
                <View style={{ width: isTablet ? 28 : 24 }} />
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
                {cargandoUbicacion && (
                    <View style={styles.loadingUbicacion}>
                        <ActivityIndicator size="small" color={DESIGN.colors.accentSecondary} />
                        <Text style={[styles.loadingUbicacionText, { color: DESIGN.colors.textSecondary }]}>
                            Cargando ubicación...
                        </Text>
                    </View>
                )}

                {/* ✅ DATOS DE CONTACTO */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        📞 Datos de contacto
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }]}>
                        <Ionicons name="call-outline" size={22} color={DESIGN.colors.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { fontSize: inputSize, color: DESIGN.colors.text }]}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Teléfono"
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            keyboardType="phone-pad"
                            selectionColor={DESIGN.colors.accent}
                        />
                    </View>
                    {perfil?.telefono && (
                        <Text style={[styles.datosGuardados, { color: DESIGN.colors.verde }]}>
                            📌 Cargado desde tu perfil
                        </Text>
                    )}
                </Animated.View>

                {guardandoPerfil && (
                    <View style={[styles.guardandoPerfilContainer, { backgroundColor: DESIGN.colors.accentSecondary + '15', borderColor: DESIGN.colors.accentSecondary + '20' }]}>
                        <ActivityIndicator size="small" color={DESIGN.colors.accentSecondary} />
                        <Text style={[styles.guardandoPerfilText, { color: DESIGN.colors.accentSecondary }]}>
                            Guardando en tu perfil...
                        </Text>
                    </View>
                )}

                {/* ✅ TIPO DE ENTREGA */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        🚚 Tipo de entrega
                    </Text>
                    <View style={[styles.options, { gap: isTablet ? 12 : 8 }]}>
                        {tiposEntrega.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.option,
                                    {
                                        padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        backgroundColor: tipoEntrega === t.id ? DESIGN.colors.accentSecondary : DESIGN.colors.surface + '80',
                                        borderColor: tipoEntrega === t.id ? DESIGN.colors.accentSecondary : DESIGN.colors.border,
                                    }
                                ]}
                                onPress={() => setTipoEntrega(t.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={t.icono as any}
                                    size={isTablet ? 28 : 22}
                                    color={tipoEntrega === t.id ? DESIGN.colors.text : DESIGN.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.optionText,
                                    {
                                        fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                        color: tipoEntrega === t.id ? DESIGN.colors.text : DESIGN.colors.textSecondary,
                                    }
                                ]}>
                                    {t.label}
                                </Text>
                                <Text style={[
                                    styles.optionPrice,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: tipoEntrega === t.id ? DESIGN.colors.text : DESIGN.colors.textSecondary,
                                    }
                                ]}>
                                    {t.costo === 0 ? 'GRATIS' : `$${t.costo.toFixed(2)}`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ✅ DIRECCIÓN DE ENTREGA */}
                {tipoEntrega === 'domicilio' && (
                    <Animated.View style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginTop: 12,
                        }
                    ]}>
                        <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                            📍 Dirección de entrega
                        </Text>

                        <View style={[
                            styles.direccionPerfilContainer,
                            {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                backgroundColor: direccionDelPerfil ? DESIGN.colors.verde + '15' : DESIGN.colors.surface + '80',
                                borderColor: direccionDelPerfil ? DESIGN.colors.verde + '30' : DESIGN.colors.border,
                            }
                        ]}>
                            <View style={styles.direccionPerfilHeader}>
                                <Ionicons
                                    name={direccionDelPerfil ? "checkmark-circle" : "location-outline"}
                                    size={isTablet ? 22 : 18}
                                    color={direccionDelPerfil ? DESIGN.colors.verde : DESIGN.colors.accent}
                                />
                                <Text style={[
                                    styles.direccionPerfilLabel,
                                    {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                        color: direccionDelPerfil ? DESIGN.colors.verde : DESIGN.colors.accent,
                                    }
                                ]}>
                                    {direccionDelPerfil ? 'Dirección de tu perfil' : 'Dirección personalizada'}
                                </Text>
                                {ubicacionSeleccionada && !direccionDelPerfil && (
                                    <View style={[styles.ubicacionConfirmada, { backgroundColor: DESIGN.colors.verde + '15' }]}>
                                        <Ionicons name="checkmark-circle" size={isTablet ? 14 : 10} color={DESIGN.colors.verde} />
                                        <Text style={[styles.ubicacionConfirmadaText, { fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9, color: DESIGN.colors.verde }]}>
                                            Confirmada
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.direccionPerfilTexto,
                                {
                                    fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                                    color: DESIGN.colors.text,
                                }
                            ]}>
                                {direccion || 'No hay dirección cargada'}
                            </Text>
                            {direccionDelPerfil && (
                                <Text style={[
                                    styles.direccionPerfilSubtexto,
                                    {
                                        fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                        color: DESIGN.colors.textSecondary,
                                    }
                                ]}>
                                    💡 Para cambiar, usa el buscador o el mapa
                                </Text>
                            )}
                        </View>

                        {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={[styles.infoEnvioContainer, { backgroundColor: DESIGN.colors.surface + '80', borderColor: DESIGN.colors.border }]}>
                                <View style={styles.infoEnvioFila}>
                                    <Ionicons name="navigate" size={18} color={DESIGN.colors.accent} />
                                    <Text style={[styles.infoEnvioText, { color: DESIGN.colors.textSecondary }]}>
                                        📏 Distancia: {distanciaFormateada || 'Calculando...'}
                                    </Text>
                                </View>

                                {envioDisponible ? (
                                    <>
                                        <View style={styles.infoEnvioFila}>
                                            <Ionicons name="cash" size={18} color={DESIGN.colors.verde} />
                                            <Text style={[styles.infoEnvioText, { color: DESIGN.colors.verde }]}>
                                                💰 Costo de envío: ${costoEnvioCalculado.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.infoEnvioFila}>
                                            <Ionicons name="time-outline" size={18} color={DESIGN.colors.accent} />
                                            <Text style={[styles.infoEnvioText, { color: DESIGN.colors.accent }]}>
                                                ⏱️ Tiempo estimado: {tiempoEstimado} min
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.infoEnvioFila}>
                                        <Ionicons name="warning" size={18} color={DESIGN.colors.accent} />
                                        <Text style={[styles.infoEnvioText, { color: DESIGN.colors.accent }]}>
                                            ⚠️ {mensajeEnvio}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={[styles.infoEnvioContainer, { backgroundColor: DESIGN.colors.surface + '80', borderColor: DESIGN.colors.border }]}>
                                <View style={styles.infoEnvioFila}>
                                    <ActivityIndicator size="small" color={DESIGN.colors.accentSecondary} />
                                    <Text style={[styles.infoEnvioText, { color: DESIGN.colors.textSecondary }]}>Calculando envío...</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.buscadorManualContainer}>
                            <Text style={[styles.buscadorManualLabel, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12, color: DESIGN.colors.textSecondary }]}>
                                🔍 Buscar dirección en el mapa
                            </Text>
                            <View style={styles.buscadorManualFila}>
                                <TextInput
                                    style={[styles.buscadorManualInput, { fontSize: inputSize, color: DESIGN.colors.text, backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }]}
                                    value={busquedaManual}
                                    onChangeText={setBusquedaManual}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    selectionColor={DESIGN.colors.accent}
                                />
                                <TouchableOpacity
                                    style={[styles.botonBuscar, {
                                        padding: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                        backgroundColor: DESIGN.colors.accentSecondary,
                                    }]}
                                    onPress={buscarDireccionManual}
                                    activeOpacity={0.7}
                                    disabled={buscandoDireccion}
                                >
                                    {buscandoDireccion ? (
                                        <ActivityIndicator size="small" color={DESIGN.colors.text} />
                                    ) : (
                                        <Ionicons name="search" size={isTablet ? 22 : 18} color={DESIGN.colors.text} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.botonMapa, {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                marginTop: 8,
                                backgroundColor: DESIGN.colors.accent + '10',
                                borderColor: DESIGN.colors.accent + '30',
                            }]}
                            onPress={() => setMostrarMapa(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="map-outline" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={DESIGN.colors.accent} />
                            <Text style={[styles.botonMapaText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.accent }]}>
                                📍 Seleccionar ubicación en el mapa
                            </Text>
                            <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={DESIGN.colors.textTertiary} />
                        </TouchableOpacity>

                        {direccionSugerida !== '' && direccion !== direccionSugerida && (
                            <TouchableOpacity
                                style={[styles.sugerenciaContainer, {
                                    padding: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: DESIGN.colors.verde + '15',
                                    borderColor: DESIGN.colors.verde + '20',
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
                                <Ionicons name="location" size={isTablet ? 20 : 16} color={DESIGN.colors.verde} />
                                <Text style={[styles.sugerenciaText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.verde }]}>
                                    {direccionSugerida}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* ✅ MAPA SELECTOR */}
                <MapaSelector
                    visible={mostrarMapa}
                    onClose={() => setMostrarMapa(false)}
                    onConfirmar={handleConfirmarUbicacion}
                    ubicacionInicial={ubicacionSeleccionada || undefined}
                    direccionInicial={direccion}
                    titulo="📍 Selecciona tu ubicación"
                />

                {/* ✅ MÉTODO DE PAGO CON EFECTIVO Y VUELTO */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        💳 Método de pago
                    </Text>
                    <View style={[styles.options, { flexDirection: 'row', gap: isTablet ? 12 : 8 }]}>
                        {metodosPago.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    styles.optionPago,
                                    {
                                        padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        backgroundColor: metodoPago === m.id ? DESIGN.colors.accentSecondary : DESIGN.colors.surface + '80',
                                        borderColor: metodoPago === m.id ? DESIGN.colors.accentSecondary : DESIGN.colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setMetodoPago(m.id);
                                    // ✅ Reiniciar campos de efectivo al cambiar
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
                                    color={metodoPago === m.id ? DESIGN.colors.text : DESIGN.colors.textSecondary}
                                />
                                <Text style={[
                                    styles.optionText,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: metodoPago === m.id ? DESIGN.colors.text : DESIGN.colors.textSecondary,
                                    }
                                ]}>
                                    {m.label}
                                </Text>
                                {metodoPago === m.id && (
                                    <Ionicons name="checkmark-circle" size={isTablet ? 20 : 16} color={DESIGN.colors.text} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ✅ SECCIÓN DE PAGO EN EFECTIVO CON VUELTO */}
                    {metodoPago === 'efectivo' && (
                        <View style={[styles.efectivoContainer, {
                            marginTop: 12,
                            padding: isTablet ? 16 : isSmallPhone ? 12 : 14,
                            borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                            backgroundColor: DESIGN.colors.surface + '90',
                            borderWidth: 1,
                            borderColor: DESIGN.colors.accentSecondary + '30',
                        }]}>
                            <Text style={[styles.efectivoTitle, {
                                fontSize: isTablet ? 15 : isSmallPhone ? 13 : 14,
                                color: DESIGN.colors.text,
                                fontWeight: '600',
                                marginBottom: 8,
                            }]}>
                                💰 Pago en efectivo
                            </Text>

                            <Text style={[styles.efectivoSubtitle, {
                                fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                color: DESIGN.colors.textSecondary,
                                marginBottom: 6,
                            }]}>
                                Total a pagar: <Text style={{ fontWeight: 'bold', color: DESIGN.colors.accentSecondary }}>
                                    ${totalFinal.toFixed(2)}
                                </Text>
                            </Text>

                            {/* ✅ Campo para ingresar el monto con el que paga */}
                            <View style={[styles.efectivoInputContainer, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: DESIGN.colors.surfaceHover,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: DESIGN.colors.border,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                marginTop: 4,
                            }]}>
                                <Text style={[styles.efectivoInputPrefix, {
                                    fontSize: isTablet ? 18 : isSmallPhone ? 16 : 17,
                                    color: DESIGN.colors.textSecondary,
                                    fontWeight: 'bold',
                                    marginRight: 4,
                                }]}>
                                    $
                                </Text>
                                <TextInput
                                    style={[styles.efectivoInput, {
                                        flex: 1,
                                        fontSize: isTablet ? 18 : isSmallPhone ? 16 : 17,
                                        color: DESIGN.colors.text,
                                        paddingVertical: 10,
                                        fontWeight: '600',
                                    }]}
                                    value={montoConQuePaga}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9.]/g, '');
                                        setMontoConQuePaga(cleaned);
                                        calcularVuelto(cleaned);
                                    }}
                                    placeholder="0.00"
                                    placeholderTextColor={DESIGN.colors.textTertiary}
                                    keyboardType="decimal-pad"
                                    selectionColor={DESIGN.colors.accent}
                                />
                                <Text style={[styles.efectivoInputSuffix, {
                                    fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                    color: DESIGN.colors.textSecondary,
                                }]}>
                                    {montoConQuePaga ? `(${montoConQuePaga})` : '(ingresá el monto)'}
                                </Text>
                            </View>

                            {/* ✅ Mostrar el vuelto calculado */}
                            {mostrarVuelto && vueltoCalculado > 0 && (
                                <View style={[styles.vueltoContainer, {
                                    marginTop: 10,
                                    padding: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    backgroundColor: DESIGN.colors.verde + '15',
                                    borderWidth: 1,
                                    borderColor: DESIGN.colors.verde + '30',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="cash-outline" size={isTablet ? 24 : 20} color={DESIGN.colors.verde} />
                                        <Text style={[styles.vueltoLabel, {
                                            fontSize: isTablet ? 14 : isSmallPhone ? 12 : 13,
                                            color: DESIGN.colors.text,
                                            fontWeight: '500',
                                        }]}>
                                            💵 Vuelto:
                                        </Text>
                                    </View>
                                    <Text style={[styles.vueltoMonto, {
                                        fontSize: isTablet ? 22 : isSmallPhone ? 18 : 20,
                                        fontWeight: 'bold',
                                        color: DESIGN.colors.verde,
                                    }]}>
                                        ${vueltoCalculado.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {/* ✅ Mensaje de error si el monto es insuficiente */}
                            {montoConQuePaga && !mostrarVuelto && parseFloat(montoConQuePaga) > 0 && (
                                <View style={[styles.efectivoError, {
                                    marginTop: 8,
                                    padding: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    borderRadius: isTablet ? 10 : isSmallPhone ? 6 : 8,
                                    backgroundColor: DESIGN.colors.accent + '15',
                                    borderWidth: 1,
                                    borderColor: DESIGN.colors.accent + '30',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }]}>
                                    <Ionicons name="warning" size={isTablet ? 18 : 14} color={DESIGN.colors.accent} />
                                    <Text style={[styles.efectivoErrorText, {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                        color: DESIGN.colors.accent,
                                        fontWeight: '500',
                                    }]}>
                                        El monto es insuficiente. El total es ${totalFinal.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {/* ✅ Botón de sugerencia para monto exacto */}
                            {(!montoConQuePaga || (montoConQuePaga && !mostrarVuelto)) && (
                                <TouchableOpacity
                                    style={[styles.efectivoSugerencia, {
                                        marginTop: 8,
                                        padding: isTablet ? 8 : isSmallPhone ? 6 : 8,
                                        borderRadius: isTablet ? 8 : isSmallPhone ? 6 : 8,
                                        backgroundColor: DESIGN.colors.accentSecondary + '15',
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
                                        color: DESIGN.colors.accentSecondary,
                                        fontWeight: '500',
                                    }]}>
                                        💡 Pagar con el monto exacto
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Animated.View>

                {/* ✅ NOTAS */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        📝 Notas (opcional)
                    </Text>
                    <View style={[styles.inputContainer, { backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }]}>
                        <Ionicons name="create-outline" size={22} color={DESIGN.colors.accent} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.textArea, { fontSize: inputSize, color: DESIGN.colors.text }]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Sin cebolla, extra queso..."
                            placeholderTextColor={DESIGN.colors.textTertiary}
                            multiline
                            numberOfLines={2}
                            selectionColor={DESIGN.colors.accent}
                        />
                    </View>
                </Animated.View>

                {/* ✅ PRODUCTOS */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        🛒 Productos ({elementos.length})
                    </Text>
                    {elementos.map((e, i) => (
                        <View key={i} style={[styles.productoItem, { borderBottomColor: DESIGN.colors.border }]}>
                            <Text style={[styles.productoNombre, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>
                                {e.cantidad}x {e.producto.nombre}
                            </Text>
                            <Text style={[styles.productoPrecio, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.accentSecondary }]}>
                                ${(precioUnitario(e.producto.precio) * e.cantidad).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* ✅ RESUMEN */}
                <Animated.View style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[styles.sectionTitle, { fontSize: seccionTituloSize, color: DESIGN.colors.text }]}>
                        📊 Resumen
                    </Text>
                    <View style={styles.resumenFila}>
                        <Text style={[styles.resumenText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>${total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.resumenFila}>
                        <Text style={[styles.resumenText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.textSecondary }]}>Costo de envío</Text>
                        <Text style={[styles.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.text }]}>
                            {tipoEntrega === 'retiro' ? 'GRATIS' :
                                (ubicacionSeleccionada ?
                                    (envioDisponible ? `$${costoEnvioCalculado.toFixed(2)}` : 'No disponible') :
                                    'Selecciona ubicación'
                                )
                            }
                        </Text>
                    </View>
                    {descuento > 0 && (
                        <View style={styles.resumenFila}>
                            <Text style={[styles.resumenText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.verde }]}>
                                Descuento
                            </Text>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.verde }]}>
                                -${descuento.toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.resumenFila, styles.resumenTotal, { borderTopColor: DESIGN.colors.border }]}>
                        <Text style={[styles.totalText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 24, color: DESIGN.colors.accentSecondary }]}>
                            ${totalFinal.toFixed(2)}
                        </Text>
                    </View>

                    {/* ✅ Mostrar vuelto en el resumen si está seleccionado */}
                    {metodoPago === 'efectivo' && mostrarVuelto && vueltoCalculado > 0 && (
                        <View style={[styles.resumenFila, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: DESIGN.colors.border }]}>
                            <Text style={[styles.resumenText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.verde, fontWeight: '600' }]}>
                                💵 Vuelto
                            </Text>
                            <Text style={[styles.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.verde, fontWeight: 'bold' }]}>
                                ${vueltoCalculado.toFixed(2)}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* ✅ BOTÓN CONFIRMAR */}
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                    marginTop: 12,
                }}>
                    <TouchableOpacity
                        style={[styles.botonConfirmar, cargando && { opacity: 0.6 }]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                            style={styles.botonConfirmarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {cargando ? (
                                <ActivityIndicator color={DESIGN.colors.text} size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={isTablet ? 28 : 24} color={DESIGN.colors.text} />
                                    <Text style={[styles.botonConfirmarText, { fontSize: buttonTextSize, color: DESIGN.colors.text }]}>
                                        {metodoPago === 'transferencia' ? 'Pagar con Transferencia' : 'Confirmar Pedido'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ✅ MODAL DE ÉXITO (para efectivo/tarjeta) */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modal,
                        {
                            padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
                            borderRadius: isTablet ? 28 : 24,
                            borderColor: DESIGN.colors.accentSecondary,
                            backgroundColor: DESIGN.colors.surface,
                        }
                    ]}>
                        <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[styles.modalTitle, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22, color: DESIGN.colors.accentSecondary }]}>
                            ¡Pedido confirmado!
                        </Text>
                        <Text style={[styles.modalText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.textSecondary }]}>
                            {metodoPago === 'efectivo' && mostrarVuelto
                                ? `💰 Pagás con $${parseFloat(montoConQuePaga.replace(',', '.')).toFixed(2)}. Tu vuelto es $${vueltoCalculado.toFixed(2)}`
                                : 'Tu pedido está siendo preparado'}
                        </Text>
                        <Text style={[styles.modalSubtext, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.accent }]}>
                            Redirigiendo al seguimiento...
                        </Text>
                        <View style={styles.modalLoader}>
                            {renderLoaderDots()}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✅ MODAL PROFESIONAL PARA TRANSFERENCIA */}
            <Modal
                visible={mostrarModalTransferencia}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
                onRequestClose={cerrarModalTransferencia}
            >
                <View style={styles.modalTransferenciaOverlay}>
                    <View style={[styles.modalTransferencia, { maxWidth: isTablet ? 500 : responsive.width * 0.92, backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.accentSecondary + '30' }]}>
                        <ScrollView
                            style={styles.modalTransferenciaBodyScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            {/* Header con gradiente */}
                            <LinearGradient
                                colors={[DESIGN.colors.accentSecondary, DESIGN.colors.accent]}
                                style={[styles.modalTransferenciaHeader, { padding: isTablet ? 24 : 18 }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="swap-horizontal-outline" size={isTablet ? 48 : 36} color={DESIGN.colors.text} />
                                <Text style={[styles.modalTransferenciaTitulo, { fontSize: isTablet ? 24 : 18, color: DESIGN.colors.text }]}>
                                    Transferencia Bancaria
                                </Text>
                            </LinearGradient>

                            <View style={[styles.modalTransferenciaBody, { padding: isTablet ? 28 : 20 }]}>
                                <Text style={[styles.modalTransferenciaMensaje, { fontSize: isTablet ? 16 : 14, color: DESIGN.colors.textSecondary }]}>
                                    Para completar tu pedido, realizá la transferencia a los siguientes datos:
                                </Text>

                                {/* Alias destacado */}
                                <View style={[styles.aliasContainer, { backgroundColor: DESIGN.colors.accentSecondary + '10', borderColor: DESIGN.colors.accentSecondary + '20' }]}>
                                    <Text style={[styles.aliasLabel, { fontSize: isTablet ? 14 : 12, color: DESIGN.colors.textSecondary }]}>Alias</Text>
                                    <View style={styles.aliasFila}>
                                        <Text style={[styles.aliasTexto, { fontSize: isTablet ? 28 : 20, color: DESIGN.colors.text }]}>
                                            {ALIAS_TRANSFERENCIA}
                                        </Text>
                                        <TouchableOpacity onPress={copiarAlias} style={[styles.aliasBotonCopiar, { backgroundColor: DESIGN.colors.accentSecondary + '20' }]}>
                                            <Ionicons name="copy-outline" size={isTablet ? 24 : 20} color={DESIGN.colors.accentSecondary} />
                                            <Text style={[styles.aliasBotonCopiarText, { fontSize: isTablet ? 15 : 13, color: DESIGN.colors.accentSecondary }]}>
                                                Copiar
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* CBU */}
                                <View style={[styles.cbuContainer, { backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}>
                                    <Text style={[styles.cbuLabel, { fontSize: isTablet ? 13 : 11, color: DESIGN.colors.textSecondary }]}>CBU</Text>
                                    <Text style={[styles.cbuTexto, { fontSize: isTablet ? 16 : 14, color: DESIGN.colors.text }]}>
                                        {CUENTA_TRANSFERENCIA}
                                    </Text>
                                </View>

                                {/* Monto */}
                                <View style={[styles.montoContainer, { borderColor: DESIGN.colors.border }]}>
                                    <Text style={[styles.montoLabel, { fontSize: isTablet ? 15 : 13, color: DESIGN.colors.textSecondary }]}>Monto a transferir</Text>
                                    <Text style={[styles.montoTexto, { fontSize: isTablet ? 36 : 28, color: DESIGN.colors.accentSecondary }]}>
                                        ${totalFinal.toFixed(2)}
                                    </Text>
                                </View>

                                <Text style={[styles.pedidoNumero, { fontSize: isTablet ? 15 : 13, color: DESIGN.colors.textSecondary }]}>
                                    Pedido #{pedidoIdTransferencia}
                                </Text>

                                {/* Botones */}
                                <View style={[styles.botonesTransferencia, { gap: isTablet ? 16 : 12 }]}>
                                    <TouchableOpacity
                                        style={[styles.botonTransferencia, styles.botonTransferenciaSecundario, { paddingVertical: isTablet ? 18 : 14, backgroundColor: DESIGN.colors.surfaceHover, borderColor: DESIGN.colors.border }]}
                                        onPress={cerrarModalTransferencia}
                                    >
                                        <Text style={[styles.botonTransferenciaText, { fontSize: isTablet ? 17 : 15, color: DESIGN.colors.textSecondary }]}>
                                            Ya transferí
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.botonTransferencia, styles.botonTransferenciaPrincipal, { paddingVertical: isTablet ? 18 : 14, backgroundColor: DESIGN.colors.accentSecondary }]}
                                        onPress={abrirBanco}
                                    >
                                        <Ionicons name="open-outline" size={isTablet ? 24 : 20} color={DESIGN.colors.text} />
                                        <Text style={[styles.botonTransferenciaText, { fontSize: isTablet ? 17 : 15, color: DESIGN.colors.text }]}>
                                            Ir al banco
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.mensajeConfirmacion, { fontSize: isTablet ? 13 : 11, color: DESIGN.colors.textSecondary }]}>
                                    ⏳ Una vez realizada la transferencia, presioná "Ya transferí" y el local confirmará tu pago.
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ✅ TOAST */}
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
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
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
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.surface + '10',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
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
        flex: 1,
        paddingVertical: 12,
        paddingRight: 8,
    },
    textArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    options: {
        gap: 8,
    },
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
        fontWeight: '600',
        flex: 1,
    },
    optionPrice: {
        fontWeight: '600',
    },
    botonMapa: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 10,
    },
    botonMapaText: {
        fontWeight: '600',
        flex: 1,
        marginLeft: 8,
    },
    sugerenciaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 8,
        gap: 8,
    },
    sugerenciaText: {
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
        fontWeight: '500',
    },
    productoPrecio: {
        fontWeight: 'bold',
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resumenText: {
        opacity: 0.8,
    },
    resumenValor: {
        fontWeight: '600',
    },
    resumenTotal: {
        borderTopWidth: 1,
        paddingTop: 10,
        marginTop: 4,
    },
    totalText: {
        fontWeight: 'bold',
    },
    totalPrice: {
        fontWeight: 'bold',
    },
    botonConfirmar: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: DESIGN.colors.accentSecondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        marginTop: 10,
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
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 2,
    },
    modalIcon: {
        marginBottom: 12,
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalText: {
        textAlign: 'center',
        opacity: 0.8,
    },
    modalSubtext: {
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
        backgroundColor: DESIGN.colors.accentSecondary,
    },
    loadingUbicacion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
        gap: 10,
        backgroundColor: DESIGN.colors.surface + '80',
    },
    loadingUbicacionText: {
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
        fontWeight: '600',
        opacity: 0.8,
    },
    direccionPerfilTexto: {
        fontWeight: '500',
        lineHeight: 20,
    },
    direccionPerfilSubtexto: {
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
        fontWeight: '500',
    },
    datosGuardados: {
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
        fontWeight: '500',
        marginBottom: 6,
        opacity: 0.7,
    },
    buscadorManualFila: {
        flexDirection: 'row',
        gap: 8,
    },
    buscadorManualInput: {
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
    // ✅ ESTILOS PARA PAGO EN EFECTIVO
    efectivoContainer: {
        // Estilos aplicados dinámicamente
    },
    efectivoTitle: {
        fontWeight: '600',
    },
    efectivoSubtitle: {
        opacity: 0.8,
    },
    efectivoInputContainer: {
        // Estilos aplicados dinámicamente
    },
    efectivoInputPrefix: {
        fontWeight: 'bold',
    },
    efectivoInput: {
        fontWeight: '600',
    },
    efectivoInputSuffix: {
        opacity: 0.6,
    },
    vueltoContainer: {
        // Estilos aplicados dinámicamente
    },
    vueltoLabel: {
        fontWeight: '500',
    },
    vueltoMonto: {
        fontWeight: 'bold',
    },
    efectivoError: {
        // Estilos aplicados dinámicamente
    },
    efectivoErrorText: {
        fontWeight: '500',
    },
    efectivoSugerencia: {
        // Estilos aplicados dinámicamente
    },
    efectivoSugerenciaText: {
        fontWeight: '500',
    },
    // ✅ MODAL TRANSFERENCIA
    modalTransferenciaOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalTransferencia: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        maxHeight: '90%',
        width: '100%',
    },
    modalTransferenciaBodyScroll: {
        maxHeight: '90%',
    },
    modalTransferenciaHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    modalTransferenciaTitulo: {
        fontWeight: 'bold',
    },
    modalTransferenciaBody: {},
    modalTransferenciaMensaje: {
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
        opacity: 0.8,
    },
    aliasContainer: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    aliasLabel: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    aliasFila: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aliasTexto: {
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    aliasBotonCopiar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    aliasBotonCopiarText: {
        fontWeight: '600',
    },
    cbuContainer: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    cbuLabel: {
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    cbuTexto: {
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    montoContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        marginBottom: 12,
    },
    montoLabel: {
        marginBottom: 4,
    },
    montoTexto: {
        fontWeight: 'bold',
    },
    pedidoNumero: {
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.7,
    },
    botonesTransferencia: {
        flexDirection: 'row',
        gap: 12,
    },
    botonTransferencia: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    botonTransferenciaPrincipal: {
        borderWidth: 1,
        borderColor: DESIGN.colors.accentSecondary,
    },
    botonTransferenciaSecundario: {
        borderWidth: 1,
    },
    botonTransferenciaText: {
        fontWeight: '600',
    },
    mensajeConfirmacion: {
        textAlign: 'center',
        marginTop: 14,
        lineHeight: 18,
        opacity: 0.7,
        fontStyle: 'italic',
    },
});