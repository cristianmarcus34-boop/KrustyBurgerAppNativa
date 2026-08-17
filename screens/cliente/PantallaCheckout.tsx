// screens/cliente/PantallaCheckout.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Dimensions,
    Animated,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Clipboard,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

// ============================================================
// 🚫 COMENTADO TEMPORALMENTE - MERCADO PAGO (expo-web-browser)
// ============================================================
// import * as WebBrowser from 'expo-web-browser';
// import { tiendaPago } from '../../stores/tiendaPago';
// import { servicioPagos } from '../../services/servicioPagos';

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

const { width, height } = Dimensions.get('window');

const UBICACION_DEFAULT = {
    latitude: -34.776484410467525,
    longitude: -58.29220250409459,
};

// ✅ DECLARADAS FUERA DEL COMPONENTE PARA QUE LOS ESTILOS PUEDAN USARLAS
const isTablet = width >= 768;
const isSmallPhone = width < 375;

// ✅ ALIAS DE TRANSFERENCIA
const ALIAS_TRANSFERENCIA = 'krustyburger2025';
const CUENTA_TRANSFERENCIA = 'CBU: 1234567890123456789012';

export default function PantallaCheckout(props: any) {
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

    const insets = useSafeAreaInsets();
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

    // ✅ FUNCIÓN PARA OBTENER PRECIO UNITARIO
    const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

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
            // Guardar en el store para persistencia
            if (ubicacionRecibida.direccion) {
                guardarUbicacionTemporal(ubicacionRecibida);
            }
        } else {
            // Si no hay ubicación recibida, cargar desde store
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

    // ✅ seleccionarUbicacionEnMapa - ACTUALIZADO con guardado en store
    const seleccionarUbicacionEnMapa = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setUbicacionSeleccionada({ latitude, longitude });

        const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
        if (direccionObtenida) {
            setDireccionCompleta(direccionObtenida);
            setDireccion(direccionObtenida);
            setDireccionDelPerfil(false);

            // ✅ GUARDAR EN EL STORE
            await guardarUbicacionTemporal({
                latitude,
                longitude,
                direccion: direccionObtenida,
            });
            console.log('✅ Ubicación guardada desde el mapa');
        }
    };

    // ✅ FUNCIÓN PARA VOLVER AL CARRITO GUARDANDO LA DIRECCIÓN
    const handleVolverAlCarrito = async () => {
        if (ubicacionSeleccionada) {
            await guardarDireccionEnStore(ubicacionSeleccionada);
        }
        props.navigation.goBack();
    };

    // ✅ FUNCIÓN PARA CONFIRMAR UBICACIÓN DESDE EL MAPA
    const handleConfirmarUbicacion = async (ubicacion: { latitude: number; longitude: number; direccion: string }) => {
        setUbicacionSeleccionada({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
        });
        setDireccion(ubicacion.direccion);
        setDireccionCompleta(ubicacion.direccion);
        setDireccionDelPerfil(false);

        // ✅ Guardar en el store
        await guardarUbicacionTemporal({
            latitude: ubicacion.latitude,
            longitude: ubicacion.longitude,
            direccion: ubicacion.direccion,
        });

        // ✅ Calcular envío
        calcularCostoEnvio(ubicacion.latitude, ubicacion.longitude);

        setMostrarMapa(false);
        toast.exito('📍 Ubicación seleccionada correctamente');
    };

    // ============================================================
    // ✅ FUNCIÓN PARA COPIAR ALIAS
    // ============================================================
    const copiarAlias = async () => {
        await Clipboard.setString(ALIAS_TRANSFERENCIA);
        toast.exito('¡Alias copiado!');
    };

    // ============================================================
    // ✅ FUNCIÓN PARA ABRIR LA APP DEL BANCO
    // ============================================================
    const abrirBanco = () => {
        Linking.openURL('https://www.mercadopago.com.ar/').catch(() => {
            toast.info('Abrí tu app bancaria y transferí al alias');
        });
    };

    // ============================================================
    // CONFIRMAR PEDIDO - ACTUALIZADO CON MODAL DE TRANSFERENCIA
    // ============================================================
    const confirmarPedido = async () => {
        if (!direccion && tipoEntrega === 'domicilio') {
            toast.advertencia('Ingresa una dirección de entrega');
            return;
        }

        if (!telefono) {
            toast.advertencia('Ingresa un número de teléfono');
            return;
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

        const datosPedido: any = {
            id_de_usuario: perfil?.id,
            cliente_nombre: perfil?.nombre_cliente,
            telefono: telefono,
            direccion: tipoEntrega === 'retiro' ? 'Retiro en local' : direccionCompleta || direccion,
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

        if (cuponAplicado) {
            await supabase.from('canjes').update({ usado_en_pedido: true }).eq('id', cuponAplicado.id);
        }

        // ============================================================
        // 1. CREAR EL PEDIDO
        // ============================================================
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

        // ✅ VACIAR CARRITO Y LIMPIAR UBICACIÓN
        vaciarCarrito();
        await limpiarUbicacionTemporal();

        // ============================================================
        // 2. SI ES TRANSFERENCIA → MOSTRAR MODAL CON ALIAS
        // ============================================================
        if (metodoPago === 'transferencia') {
            console.log('🔴 TRANSFERENCIA SELECCIONADA - Pedido ID:', pedidoId);
            setCargando(false);
            setPedidoIdTransferencia(pedidoId);
            return;
        }

        // ============================================================
        // 3. OTROS MÉTODOS DE PAGO (efectivo, tarjeta)
        // ============================================================
        setCargando(false);

        setMostrarModalExito(true);
        setTimeout(() => {
            setMostrarModalExito(false);
            props.navigation.replace('Seguimiento', { pedidoId });
        }, 2500);
    };

    // ============================================================
    // ✅ CERRAR MODAL DE TRANSFERENCIA Y NAVEGAR A SEGUIMIENTO
    // ============================================================
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

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
    const tituloSize = isTablet ? 26 : isSmallPhone ? 18 : 20;
    const seccionTituloSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const inputSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
    const buttonTextSize = isTablet ? 20 : isSmallPhone ? 16 : 18;

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
                        estilos.modalLoaderDot,
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
        <View style={estilos.contenedor}>
            {/* 🛹 GRADIENTE BART: Naranja → Rojo */}
            <LinearGradient
                colors={[Colores.bartNaranja, Colores.bartRojo]}
                style={estilos.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[
                estilos.header,
                {
                    paddingTop: insets.top + (isTablet ? 20 : 10),
                    paddingHorizontal: paddingHorizontal,
                    paddingBottom: isTablet ? 16 : 12,
                }
            ]}>
                {/* ✅ Botón Volver - AHORA GUARDA LA DIRECCIÓN */}
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={handleVolverAlCarrito}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={Colores.textoClaro} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize, color: Colores.bartNaranja }]}>
                    Checkout
                </Text>
                <View style={{ width: isTablet ? 28 : 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 100,
                        paddingTop: isTablet ? 18 : 10,
                    }
                ]}
            >
                {cargandoUbicacion && (
                    <View style={estilos.cargandoUbicacion}>
                        <ActivityIndicator size="small" color={Colores.bartNaranja} />
                        <Text style={estilos.cargandoUbicacionTexto}>Cargando ubicación...</Text>
                    </View>
                )}

                {/* ✅ DATOS DE CONTACTO */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        📞 Datos de contacto
                    </Text>
                    <View style={estilos.inputContainer}>
                        <Ionicons name="call-outline" size={22} color={Colores.bartNaranja} style={estilos.inputIcon} />
                        <TextInput
                            style={[estilos.input, { fontSize: inputSize, color: Colores.textoClaro }]}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Teléfono"
                            placeholderTextColor={Colores.textoClaro + '40'}
                            keyboardType="phone-pad"
                            selectionColor={Colores.bartNaranja}
                        />
                    </View>
                    {perfil?.telefono && (
                        <Text style={estilos.datosGuardados}>
                            📌 Cargado desde tu perfil
                        </Text>
                    )}
                </Animated.View>

                {guardandoPerfil && (
                    <View style={estilos.guardandoPerfilContainer}>
                        <ActivityIndicator size="small" color={Colores.bartNaranja} />
                        <Text style={estilos.guardandoPerfilTexto}>Guardando en tu perfil...</Text>
                    </View>
                )}

                {/* ✅ TIPO DE ENTREGA */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        🚚 Tipo de entrega
                    </Text>
                    <View style={[estilos.opciones, { gap: isTablet ? 12 : 8 }]}>
                        {tiposEntrega.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    estilos.opcion,
                                    {
                                        padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        backgroundColor: tipoEntrega === t.id ? Colores.bartNaranja : Colores.textoOscuro + '40',
                                        borderColor: tipoEntrega === t.id ? Colores.bartNaranja : Colores.textoClaro + '10',
                                    }
                                ]}
                                onPress={() => setTipoEntrega(t.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={t.icono as any}
                                    size={isTablet ? 28 : 22}
                                    color={tipoEntrega === t.id ? Colores.textoOscuro : Colores.textoGris}
                                />
                                <Text style={[
                                    estilos.opcionTexto,
                                    {
                                        fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                        color: tipoEntrega === t.id ? Colores.textoOscuro : Colores.textoClaro,
                                    }
                                ]}>
                                    {t.label}
                                </Text>
                                <Text style={[
                                    estilos.opcionPrecio,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: tipoEntrega === t.id ? Colores.textoOscuro : Colores.textoGris,
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
                        estilos.seccion,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginTop: 12,
                        }
                    ]}>
                        <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                            📍 Dirección de entrega
                        </Text>

                        <View style={[
                            estilos.direccionPerfilContainer,
                            {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                backgroundColor: direccionDelPerfil ? Colores.verdeClaro + '15' : Colores.textoOscuro + '40',
                                borderColor: direccionDelPerfil ? Colores.verdeClaro + '30' : Colores.textoClaro + '10',
                            }
                        ]}>
                            <View style={estilos.direccionPerfilHeader}>
                                <Ionicons
                                    name={direccionDelPerfil ? "checkmark-circle" : "location-outline"}
                                    size={isTablet ? 22 : 18}
                                    color={direccionDelPerfil ? Colores.verdeClaro : Colores.bartNaranja}
                                />
                                <Text style={[
                                    estilos.direccionPerfilLabel,
                                    {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                        color: direccionDelPerfil ? Colores.verdeClaro : Colores.bartNaranja,
                                    }
                                ]}>
                                    {direccionDelPerfil ? 'Dirección de tu perfil' : 'Dirección personalizada'}
                                </Text>
                                {ubicacionSeleccionada && !direccionDelPerfil && (
                                    <View style={estilos.ubicacionConfirmada}>
                                        <Ionicons name="checkmark-circle" size={isTablet ? 14 : 10} color={Colores.verdeClaro} />
                                        <Text style={[estilos.ubicacionConfirmadaTexto, { fontSize: isTablet ? 10 : isSmallPhone ? 8 : 9 }]}>
                                            Confirmada
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                estilos.direccionPerfilTexto,
                                {
                                    fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                                    color: Colores.textoClaro,
                                }
                            ]}>
                                {direccion || 'No hay dirección cargada'}
                            </Text>
                            {direccionDelPerfil && (
                                <Text style={[
                                    estilos.direccionPerfilSubtexto,
                                    {
                                        fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11,
                                    }
                                ]}>
                                    💡 Para cambiar, usa el buscador o el mapa
                                </Text>
                            )}
                        </View>

                        {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={estilos.infoEnvioContainer}>
                                <View style={estilos.infoEnvioFila}>
                                    <Ionicons name="navigate" size={18} color={Colores.bartNaranja} />
                                    <Text style={estilos.infoEnvioTexto}>
                                        📏 Distancia: {distanciaFormateada || 'Calculando...'}
                                    </Text>
                                </View>

                                {envioDisponible ? (
                                    <>
                                        <View style={estilos.infoEnvioFila}>
                                            <Ionicons name="cash" size={18} color={Colores.verdeClaro} />
                                            <Text style={[estilos.infoEnvioTexto, { color: Colores.verdeClaro }]}>
                                                💰 Costo de envío: ${costoEnvioCalculado.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={estilos.infoEnvioFila}>
                                            <Ionicons name="time-outline" size={18} color={Colores.bartNaranja} />
                                            <Text style={[estilos.infoEnvioTexto, { color: Colores.bartNaranja }]}>
                                                ⏱️ Tiempo estimado: {tiempoEstimado} min
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <View style={estilos.infoEnvioFila}>
                                        <Ionicons name="warning" size={18} color={Colores.bartRojo} />
                                        <Text style={[estilos.infoEnvioTexto, { color: Colores.bartRojo }]}>
                                            ⚠️ {mensajeEnvio}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={estilos.infoEnvioContainer}>
                                <View style={estilos.infoEnvioFila}>
                                    <ActivityIndicator size="small" color={Colores.bartNaranja} />
                                    <Text style={estilos.infoEnvioTexto}>Calculando envío...</Text>
                                </View>
                            </View>
                        )}

                        <View style={estilos.buscadorManualContainer}>
                            <Text style={[estilos.buscadorManualLabel, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12 }]}>
                                🔍 Buscar dirección en el mapa
                            </Text>
                            <View style={estilos.buscadorManualFila}>
                                <TextInput
                                    style={[estilos.buscadorManualInput, { fontSize: inputSize, color: Colores.textoClaro }]}
                                    value={busquedaManual}
                                    onChangeText={setBusquedaManual}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={Colores.textoClaro + '40'}
                                    selectionColor={Colores.bartNaranja}
                                />
                                <TouchableOpacity
                                    style={[estilos.botonBuscar, {
                                        padding: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                                    }]}
                                    onPress={buscarDireccionManual}
                                    activeOpacity={0.7}
                                    disabled={buscandoDireccion}
                                >
                                    {buscandoDireccion ? (
                                        <ActivityIndicator size="small" color={Colores.textoOscuro} />
                                    ) : (
                                        <Ionicons name="search" size={isTablet ? 22 : 18} color={Colores.textoOscuro} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[estilos.botonMapa, {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                marginTop: 8,
                            }]}
                            onPress={() => setMostrarMapa(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="map-outline" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={Colores.bartNaranja} />
                            <Text style={[estilos.botonMapaTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                📍 Seleccionar ubicación en el mapa
                            </Text>
                            <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={Colores.textoGris} />
                        </TouchableOpacity>

                        {direccionSugerida !== '' && direccion !== direccionSugerida && (
                            <TouchableOpacity
                                style={[estilos.sugerenciaContainer, {
                                    padding: isTablet ? 14 : isSmallPhone ? 8 : 10,
                                    borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
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
                                <Ionicons name="location" size={isTablet ? 20 : 16} color={Colores.verdeClaro} />
                                <Text style={[estilos.sugerenciaTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                    {direccionSugerida}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* ✅ MAPA SELECTOR - COMPONENTE REUTILIZABLE */}
                <MapaSelector
                    visible={mostrarMapa}
                    onClose={() => setMostrarMapa(false)}
                    onConfirmar={handleConfirmarUbicacion}
                    ubicacionInicial={ubicacionSeleccionada || undefined}
                    direccionInicial={direccion}
                    titulo="📍 Selecciona tu ubicación"
                />

                {/* ✅ MÉTODO DE PAGO */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        💳 Método de pago
                    </Text>
                    <View style={[estilos.opciones, { flexDirection: 'row', gap: isTablet ? 12 : 8 }]}>
                        {metodosPago.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    estilos.opcionPago,
                                    {
                                        padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                        backgroundColor: metodoPago === m.id ? Colores.bartNaranja : Colores.textoOscuro + '40',
                                        borderColor: metodoPago === m.id ? Colores.bartNaranja : Colores.textoClaro + '10',
                                    }
                                ]}
                                onPress={() => setMetodoPago(m.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={m.icono as any}
                                    size={isTablet ? 26 : 20}
                                    color={metodoPago === m.id ? Colores.textoOscuro : Colores.textoGris}
                                />
                                <Text style={[
                                    estilos.opcionTexto,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: metodoPago === m.id ? Colores.textoOscuro : Colores.textoClaro,
                                    }
                                ]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ✅ NOTAS */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        📝 Notas (opcional)
                    </Text>
                    <View style={estilos.inputContainer}>
                        <Ionicons name="create-outline" size={22} color={Colores.bartNaranja} style={estilos.inputIcon} />
                        <TextInput
                            style={[estilos.input, estilos.textArea, { fontSize: inputSize, color: Colores.textoClaro }]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Sin cebolla, extra queso..."
                            placeholderTextColor={Colores.textoClaro + '40'}
                            multiline
                            numberOfLines={2}
                            selectionColor={Colores.bartNaranja}
                        />
                    </View>
                </Animated.View>

                {/* ✅ PRODUCTOS */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        🛒 Productos ({elementos.length})
                    </Text>
                    {elementos.map((e, i) => (
                        <View key={i} style={estilos.productoItem}>
                            <Text style={[estilos.productoNombre, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                {e.cantidad}x {e.producto.nombre}
                            </Text>
                            <Text style={[estilos.productoPrecio, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                ${(precioUnitario(e.producto.precio) * e.cantidad).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* ✅ CUPÓN */}
                {cuponAplicado && (
                    <Animated.View style={[
                        estilos.seccion,
                        estilos.cuponSeccion,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                            marginTop: 12,
                        }
                    ]}>
                        <Ionicons name="pricetag" size={isTablet ? 24 : 20} color={Colores.bartNaranja} />
                        <Text style={[estilos.cuponTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                            Cupón: {cuponAplicado.recompensas?.nombre} (-${descuento.toFixed(2)})
                        </Text>
                    </Animated.View>
                )}

                {/* ✅ RESUMEN */}
                <Animated.View style={[
                    estilos.seccion,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                        marginTop: 12,
                    }
                ]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, color: Colores.textoClaro }]}>
                        📊 Resumen
                    </Text>
                    <View style={estilos.resumenFila}>
                        <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Subtotal</Text>
                        <Text style={[estilos.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>${total.toFixed(2)}</Text>
                    </View>
                    <View style={estilos.resumenFila}>
                        <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>Costo de envío</Text>
                        <Text style={[estilos.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                            {tipoEntrega === 'retiro' ? 'GRATIS' :
                                (ubicacionSeleccionada ?
                                    (envioDisponible ? `$${costoEnvioCalculado.toFixed(2)}` : 'No disponible') :
                                    'Selecciona ubicación'
                                )
                            }
                        </Text>
                    </View>
                    {descuento > 0 && (
                        <View style={estilos.resumenFila}>
                            <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: Colores.verdeClaro }]}>
                                Descuento
                            </Text>
                            <Text style={[estilos.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: Colores.verdeClaro }]}>
                                -${descuento.toFixed(2)}
                            </Text>
                        </View>
                    )}
                    <View style={[estilos.resumenFila, estilos.resumenTotal]}>
                        <Text style={[estilos.totalTexto, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>Total</Text>
                        <Text style={[estilos.totalPrecio, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 24 }]}>
                            ${totalFinal.toFixed(2)}
                        </Text>
                    </View>
                </Animated.View>

                {/* ✅ BOTÓN CONFIRMAR */}
                <Animated.View style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }],
                    marginTop: 12,
                }}>
                    <TouchableOpacity
                        style={[estilos.botonConfirmar, cargando && { opacity: 0.6 }]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colores.bartNaranja, Colores.bartAzul]}
                            style={estilos.botonConfirmarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {cargando ? (
                                <ActivityIndicator color={Colores.textoOscuro} size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={isTablet ? 28 : 24} color={Colores.textoOscuro} />
                                    <Text style={[estilos.botonConfirmarTexto, { fontSize: buttonTextSize }]}>
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
                <View style={estilos.modalFondo}>
                    <View style={[
                        estilos.modal,
                        {
                            padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
                            borderRadius: isTablet ? 28 : 24,
                            borderColor: Colores.bartNaranja,
                        }
                    ]}>
                        <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22, color: Colores.bartNaranja }]}>
                            ¡Pedido confirmado!
                        </Text>
                        <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: Colores.textoGris }]}>
                            Tu pedido está siendo preparado
                        </Text>
                        <Text style={[estilos.modalSubtexto, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                            Redirigiendo al seguimiento...
                        </Text>
                        <View style={estilos.modalLoader}>
                            {renderLoaderDots()}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ============================================================
            ✅ MODAL PROFESIONAL PARA TRANSFERENCIA
            ============================================================ */}
            <Modal
                visible={mostrarModalTransferencia}
                transparent={true}
                animationType="fade"
                statusBarTranslucent={true}
                onRequestClose={cerrarModalTransferencia}
            >
                <View style={estilos.modalTransferenciaOverlay}>
                    <View style={[estilos.modalTransferencia, { maxWidth: isTablet ? 500 : width * 0.92 }]}>
                        <ScrollView
                            style={estilos.modalTransferenciaBodyScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        >
                            {/* Header con gradiente */}
                            <LinearGradient
                                colors={[Colores.bartNaranja, Colores.bartAzul]}
                                style={estilos.modalTransferenciaHeader}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="swap-horizontal-outline" size={isTablet ? 48 : 36} color={Colores.textoOscuro} />
                                <Text style={[estilos.modalTransferenciaTitulo, { fontSize: isTablet ? 24 : 18 }]}>
                                    Transferencia Bancaria
                                </Text>
                            </LinearGradient>

                            <View style={[estilos.modalTransferenciaBody, { paddingTop: 16 }]}>
                                <Text style={[estilos.modalTransferenciaMensaje, { fontSize: isTablet ? 16 : 14 }]}>
                                    Para completar tu pedido, realizá la transferencia a los siguientes datos:
                                </Text>

                                {/* Alias destacado */}
                                <View style={estilos.aliasContainer}>
                                    <Text style={[estilos.aliasLabel, { fontSize: isTablet ? 14 : 12 }]}>Alias</Text>
                                    <View style={estilos.aliasFila}>
                                        <Text style={[estilos.aliasTexto, { fontSize: isTablet ? 28 : 20 }]}>
                                            {ALIAS_TRANSFERENCIA}
                                        </Text>
                                        <TouchableOpacity onPress={copiarAlias} style={estilos.aliasBotonCopiar}>
                                            <Ionicons name="copy-outline" size={isTablet ? 24 : 20} color={Colores.bartNaranja} />
                                            <Text style={[estilos.aliasBotonCopiarTexto, { fontSize: isTablet ? 15 : 13 }]}>
                                                Copiar
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* CBU */}
                                <View style={estilos.cbuContainer}>
                                    <Text style={[estilos.cbuLabel, { fontSize: isTablet ? 13 : 11 }]}>CBU</Text>
                                    <Text style={[estilos.cbuTexto, { fontSize: isTablet ? 16 : 14 }]}>
                                        {CUENTA_TRANSFERENCIA}
                                    </Text>
                                </View>

                                {/* Monto */}
                                <View style={estilos.montoContainer}>
                                    <Text style={[estilos.montoLabel, { fontSize: isTablet ? 15 : 13 }]}>Monto a transferir</Text>
                                    <Text style={[estilos.montoTexto, { fontSize: isTablet ? 36 : 28 }]}>
                                        ${totalFinal.toFixed(2)}
                                    </Text>
                                </View>

                                <Text style={[estilos.pedidoNumero, { fontSize: isTablet ? 15 : 13 }]}>
                                    Pedido #{pedidoIdTransferencia}
                                </Text>

                                {/* Botones */}
                                <View style={[estilos.botonesTransferencia, { gap: isTablet ? 16 : 12 }]}>
                                    <TouchableOpacity
                                        style={[estilos.botonTransferencia, estilos.botonTransferenciaSecundario, { paddingVertical: isTablet ? 18 : 14 }]}
                                        onPress={cerrarModalTransferencia}
                                    >
                                        <Text style={[estilos.botonTransferenciaTexto, { fontSize: isTablet ? 17 : 15 }]}>
                                            Ya transferí
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[estilos.botonTransferencia, estilos.botonTransferenciaPrincipal, { paddingVertical: isTablet ? 18 : 14 }]}
                                        onPress={abrirBanco}
                                    >
                                        <Ionicons name="open-outline" size={isTablet ? 24 : 20} color={Colores.textoOscuro} />
                                        <Text style={[estilos.botonTransferenciaTexto, { fontSize: isTablet ? 17 : 15, color: Colores.textoOscuro }]}>
                                            Ir al banco
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[estilos.mensajeConfirmacion, { fontSize: isTablet ? 13 : 11 }]}>
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
// 📋 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: Colores.textoOscuro,
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
        borderBottomColor: Colores.textoClaro + '10',
    },
    botonVolver: {
        padding: 4,
    },
    titulo: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    seccion: {
        marginBottom: 20,
    },
    seccionTitulo: {
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colores.textoOscuro + '50',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
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
    opciones: {
        gap: 8,
    },
    opcion: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        gap: 10,
    },
    opcionPago: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        borderWidth: 1,
        gap: 8,
    },
    opcionTexto: {
        fontWeight: '600',
        flex: 1,
    },
    opcionPrecio: {
        fontWeight: '600',
    },
    botonMapa: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.primario + '15',
        borderWidth: 1,
        borderColor: Colores.primario + '40',
        marginBottom: 10,
    },
    botonMapaTexto: {
        color: Colores.primario,
        fontWeight: '600',
        flex: 1,
        marginLeft: 8,
    },
    buscandoContainer: {
        padding: 8,
    },
    sugerenciaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.verdeClaro + '15',
        borderWidth: 1,
        borderColor: Colores.verdeClaro + '20',
        marginTop: 8,
        gap: 8,
    },
    sugerenciaTexto: {
        color: Colores.verdeClaro,
        fontWeight: '500',
        flex: 1,
    },
    infoEnvioContainer: {
        backgroundColor: Colores.textoOscuro + '30',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '8',
    },
    infoEnvioFila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 3,
    },
    infoEnvioTexto: {
        color: Colores.textoGris,
        fontSize: 13,
        fontWeight: '500',
    },
    productoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colores.textoClaro + '5',
    },
    productoNombre: {
        color: Colores.textoGris,
        fontWeight: '500',
    },
    productoPrecio: {
        fontWeight: 'bold',
        color: Colores.bartNaranja,
    },
    cuponSeccion: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.bartNaranja + '15',
        borderRadius: 12,
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: Colores.primario + '40',
    },
    cuponTexto: {
        color: Colores.primario,
        fontWeight: 'bold',
        flex: 1,
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resumenTexto: {
        color: Colores.textoGris,
    },
    resumenValor: {
        color: Colores.textoClaro,
        fontWeight: '600',
    },
    resumenTotal: {
        borderTopWidth: 1,
        borderTopColor: Colores.textoClaro + '15',
        paddingTop: 10,
        marginTop: 4,
    },
    totalTexto: {
        fontWeight: 'bold',
        color: Colores.textoClaro,
    },
    totalPrecio: {
        fontWeight: 'bold',
        color: Colores.bartNaranja,
    },
    botonConfirmar: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: Colores.bartNaranja,
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
    botonConfirmarTexto: {
        color: Colores.textoOscuro,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: Colores.fondoOscuro,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 2,
    },
    modalIcono: {
        marginBottom: 12,
    },
    modalTitulo: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalTexto: {
        textAlign: 'center',
    },
    modalSubtexto: {
        color: Colores.bartNaranja,
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
        backgroundColor: Colores.bartNaranja,
    },
    cargandoUbicacion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colores.textoOscuro + '30',
        paddingVertical: 10,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '5',
        gap: 10,
    },
    cargandoUbicacionTexto: {
        color: Colores.textoGris,
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
        color: Colores.textoGris,
        marginTop: 6,
        opacity: 0.6,
        fontStyle: 'italic',
    },
    guardandoPerfilContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colores.bartNaranja + '15',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: Colores.bartNaranja + '20',
    },
    guardandoPerfilTexto: {
        color: Colores.bartNaranja,
        fontSize: 13,
        fontWeight: '500',
    },
    ubicacionConfirmada: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.verdeClaro + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
        marginLeft: 8,
    },
    ubicacionConfirmadaTexto: {
        color: Colores.verdeClaro,
        fontWeight: '500',
    },
    datosGuardados: {
        color: Colores.verdeClaro,
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
        color: Colores.textoGris,
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
        backgroundColor: Colores.textoOscuro + '40',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
    },
    botonBuscar: {
        backgroundColor: Colores.bartNaranja,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 50,
    },
    precioUnitario: {
        fontSize: 12,
        color: Colores.textoGris + '80',
    },
    // ============================================================
    // ✅ NUEVOS ESTILOS PARA MODAL DE TRANSFERENCIA
    // ============================================================
    modalTransferenciaOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalTransferencia: {
        backgroundColor: Colores.fondoOscuro,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colores.bartNaranja + '30',
        maxHeight: '90%',
        width: '100%',
    },
    modalTransferenciaBodyScroll: {
        maxHeight: '90%',
    },
    modalTransferenciaHeader: {
        padding: isTablet ? 24 : 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    modalTransferenciaTitulo: {
        fontWeight: 'bold',
        color: Colores.textoOscuro,
    },
    modalTransferenciaBody: {
        padding: isTablet ? 28 : 20,
    },
    modalTransferenciaMensaje: {
        color: Colores.textoGris,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    aliasContainer: {
        backgroundColor: Colores.bartNaranja + '10',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colores.bartNaranja + '20',
        marginBottom: 16,
    },
    aliasLabel: {
        color: Colores.textoGris,
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
        color: Colores.textoClaro,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    aliasBotonCopiar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.bartNaranja + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    aliasBotonCopiarTexto: {
        color: Colores.bartNaranja,
        fontWeight: '600',
    },
    cbuContainer: {
        backgroundColor: Colores.textoOscuro + '30',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
    },
    cbuLabel: {
        color: Colores.textoGris,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    cbuTexto: {
        color: Colores.textoClaro,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    montoContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colores.textoClaro + '10',
        marginBottom: 12,
    },
    montoLabel: {
        color: Colores.textoGris,
        marginBottom: 4,
    },
    montoTexto: {
        color: Colores.bartNaranja,
        fontWeight: 'bold',
    },
    pedidoNumero: {
        color: Colores.textoGris,
        textAlign: 'center',
        marginBottom: 20,
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
        backgroundColor: Colores.bartNaranja,
    },
    botonTransferenciaSecundario: {
        backgroundColor: Colores.textoOscuro + '40',
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
    },
    botonTransferenciaTexto: {
        fontWeight: '600',
        color: Colores.textoClaro,
    },
    mensajeConfirmacion: {
        color: Colores.textoGris,
        textAlign: 'center',
        marginTop: 14,
        lineHeight: 18,
        opacity: 0.7,
        fontStyle: 'italic',
    },
});