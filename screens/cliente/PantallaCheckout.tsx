// screens/cliente/PantallaCheckout.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Alert, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaPedidos } from '../../stores/tiendaPedidos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';
import { servicioEnvios } from '../../lib/servicioEnvios';

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

// ✅ COORDENADAS POR DEFECTO
const UBICACION_DEFAULT = {
    latitude: -34.776484410467525,
    longitude: -58.29220250409459,
};

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

    const total = calcularTotal();

    const cuponAplicado = props.route?.params?.cuponAplicado || null;
    const descuento = props.route?.params?.descuento || 0;
    const [totalFinal, setTotalFinal] = useState(total);

    // ✅ ESTADOS DE DIRECCIÓN
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

    // ✅ ESTADOS DEL MAPA Y BÚSQUEDA
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [buscandoDireccion, setBuscandoDireccion] = useState(false);
    const [direccionSugerida, setDireccionSugerida] = useState('');
    const [busquedaManual, setBusquedaManual] = useState('');

    const [direccionDelPerfil, setDireccionDelPerfil] = useState(false);

    // ✅ ESTADOS PARA ENVÍO DINÁMICO
    const [costoEnvioCalculado, setCostoEnvioCalculado] = useState(0);
    const [distanciaCliente, setDistanciaCliente] = useState<number | null>(null);
    const [distanciaFormateada, setDistanciaFormateada] = useState('');
    const [tiempoEstimado, setTiempoEstimado] = useState(0);
    const [calculandoEnvio, setCalculandoEnvio] = useState(false);
    const [envioDisponible, setEnvioDisponible] = useState(true);
    const [mensajeEnvio, setMensajeEnvio] = useState('');

    const mapRef = useRef<MapView>(null);

    // ✅ Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const dot1Anim = useRef(new Animated.Value(0)).current;
    const dot2Anim = useRef(new Animated.Value(0)).current;
    const dot3Anim = useRef(new Animated.Value(0)).current;

    // ✅ CARGAR DATOS DEL PERFIL Y UBICACIÓN GUARDADA AL MONTAR
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

        // ✅ CARGAR UBICACIÓN GUARDADA
        cargarUbicacionDesdeStore();
    }, []);

    // ✅ Función para cargar ubicación desde el store
    const cargarUbicacionDesdeStore = async () => {
        console.log('📍 Cargando ubicación desde store...');
        setCargandoUbicacion(true);

        try {
            // Primero intentar cargar desde AsyncStorage al store
            const ubicacionCargada = await cargarUbicacionTemporal();

            if (ubicacionCargada) {
                console.log('📍 Ubicación cargada desde AsyncStorage:', ubicacionCargada);
                setUbicacionSeleccionada({
                    latitude: ubicacionCargada.latitude,
                    longitude: ubicacionCargada.longitude,
                });
                setDireccion(ubicacionCargada.direccion);
                setDireccionCompleta(ubicacionCargada.direccion);
                setDireccionDelPerfil(false);
                calcularCostoEnvio(ubicacionCargada.latitude, ubicacionCargada.longitude);
                setCargandoUbicacion(false);
                return;
            }

            // Si no hay ubicación en AsyncStorage, verificar el store
            if (ubicacionStore) {
                console.log('📍 Usando ubicación del store:', ubicacionStore);
                setUbicacionSeleccionada({
                    latitude: ubicacionStore.latitude,
                    longitude: ubicacionStore.longitude,
                });
                setDireccion(ubicacionStore.direccion);
                setDireccionCompleta(ubicacionStore.direccion);
                setDireccionDelPerfil(false);
                calcularCostoEnvio(ubicacionStore.latitude, ubicacionStore.longitude);
                setCargandoUbicacion(false);
                return;
            }

            // Si no hay ubicación guardada, usar GPS
            console.log('📍 No hay ubicación guardada, usando GPS');
            await obtenerUbicacionActual();

        } catch (error) {
            console.error('❌ Error cargando ubicación guardada:', error);
            await obtenerUbicacionActual();
        } finally {
            setCargandoUbicacion(false);
        }
    };

    // ✅ Función para cargar datos del perfil
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

            if (direccionCompletaPerfil && !ubicacionStore) {
                setDireccion(direccionCompletaPerfil);
                setDireccionCompleta(direccionCompletaPerfil);
                setDireccionDelPerfil(true);
            }
        }
    };

    // ✅ ACTUALIZAR PERFIL CON LA NUEVA DIRECCIÓN
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

    // ✅ FUNCIÓN PARA CALCULAR COSTO DE ENVÍO
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

    // ✅ Recalcular totalFinal cuando cambia el costo de envío
    useEffect(() => {
        const costoEnvioFinal = tipoEntrega === 'retiro' ? 0 : costoEnvioCalculado;
        setTotalFinal(total + costoEnvioFinal - descuento);
    }, [costoEnvioCalculado, tipoEntrega, total, descuento]);

    // ✅ Cuando se selecciona una ubicación, recalcular envío
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

    // ✅ OBTENER UBICACIÓN ACTUAL
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

                    // ✅ GUARDAR EN STORE + ASYNCSTORAGE
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

    // ✅ OBTENER DIRECCIÓN DESDE COORDENADAS
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

    // ✅ BUSCAR DIRECCIÓN MANUALMENTE
    const buscarDireccionManual = async () => {
        if (busquedaManual.length < 3) {
            Alert.alert('Dirección muy corta', 'Ingresa al menos 3 caracteres para buscar');
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

                    // ✅ GUARDAR EN STORE + ASYNCSTORAGE
                    await guardarUbicacionTemporal({
                        latitude,
                        longitude,
                        direccion: direccionFormateada,
                    });
                }
                setMostrarMapa(true);
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }
            } else {
                Alert.alert('Dirección no encontrada', 'No se pudo encontrar la dirección ingresada. Intentá con otra.');
            }
        } catch (error) {
            console.log('Error buscando dirección:', error);
            Alert.alert('Error', 'No se pudo buscar la dirección');
        } finally {
            setBuscandoDireccion(false);
        }
    };

    // ✅ SELECCIONAR UBICACIÓN EN EL MAPA
    const seleccionarUbicacionEnMapa = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setUbicacionSeleccionada({ latitude, longitude });

        const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
        if (direccionObtenida) {
            setDireccionCompleta(direccionObtenida);
            setDireccion(direccionObtenida);
            setDireccionDelPerfil(false);

            // ✅ GUARDAR EN STORE + ASYNCSTORAGE
            await guardarUbicacionTemporal({
                latitude,
                longitude,
                direccion: direccionObtenida,
            });
        }

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
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

    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
    const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
    const seccionTituloSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
    const inputSize = isTablet ? 16 : isSmallPhone ? 13 : 14;
    const buttonTextSize = isTablet ? 20 : isSmallPhone ? 16 : 18;

    // ✅ CONFIRMAR PEDIDO
    const confirmarPedido = async () => {
        if (!direccion && tipoEntrega === 'domicilio') {
            Alert.alert('Error', 'Ingresa una dirección de entrega');
            return;
        }

        if (!telefono) {
            Alert.alert('Error', 'Ingresa un número de teléfono');
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

        const resultado = await crearPedido(datosPedido);
        setCargando(false);

        if (resultado.error) {
            Alert.alert('Error', resultado.error);
            return;
        }

        vaciarCarrito();
        setPedidoCreadoId(resultado.id);
        console.log(`✅ Pedido creado con ID: ${resultado.id}`);

        // ✅ LIMPIAR UBICACIÓN GUARDADA DESPUÉS DE CONFIRMAR
        await limpiarUbicacionTemporal();

        setMostrarModalExito(true);
        setTimeout(() => {
            setMostrarModalExito(false);
            props.navigation.navigate('Seguimiento', { pedidoId: resultado.id });
        }, 2500);
    };

    const precioUnitario = (precio: any) => typeof precio === 'number' ? precio : Number(precio);

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
            <LinearGradient
                colors={[COLORS.verde, COLORS.negro]}
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
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
                </TouchableOpacity>
                <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
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
                    }
                ]}
            >
                {/* ✅ INDICADOR DE CARGA DE UBICACIÓN */}
                {cargandoUbicacion && (
                    <View style={estilos.cargandoUbicacion}>
                        <ActivityIndicator size="small" color={COLORS.amarillo} />
                        <Text style={estilos.cargandoUbicacionTexto}>Cargando ubicación...</Text>
                    </View>
                )}

                {/* DATOS DE CONTACTO */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
                        📞 Datos de contacto
                    </Text>
                    <View style={estilos.inputContainer}>
                        <Ionicons name="call-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
                        <TextInput
                            style={[estilos.input, { fontSize: inputSize }]}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="Teléfono"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="phone-pad"
                            selectionColor={COLORS.amarillo}
                        />
                    </View>
                    {perfil?.telefono && (
                        <Text style={estilos.datosGuardados}>
                            📌 Cargado desde tu perfil
                        </Text>
                    )}
                </Animated.View>

                {/* ✅ INDICADOR DE GUARDANDO PERFIL */}
                {guardandoPerfil && (
                    <View style={estilos.guardandoPerfilContainer}>
                        <ActivityIndicator size="small" color={COLORS.amarillo} />
                        <Text style={estilos.guardandoPerfilTexto}>Guardando en tu perfil...</Text>
                    </View>
                )}

                {/* TIPO DE ENTREGA */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
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
                                        backgroundColor: tipoEntrega === t.id ? COLORS.amarillo : COLORS.negro + '40',
                                        borderColor: tipoEntrega === t.id ? COLORS.amarillo : COLORS.blanco + '10',
                                    }
                                ]}
                                onPress={() => setTipoEntrega(t.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={t.icono as any}
                                    size={isTablet ? 28 : 22}
                                    color={tipoEntrega === t.id ? COLORS.negro : COLORS.grisClaro}
                                />
                                <Text style={[
                                    estilos.opcionTexto,
                                    {
                                        fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                                        color: tipoEntrega === t.id ? COLORS.negro : COLORS.blanco,
                                    }
                                ]}>
                                    {t.label}
                                </Text>
                                <Text style={[
                                    estilos.opcionPrecio,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: tipoEntrega === t.id ? COLORS.negro : COLORS.grisClaro,
                                    }
                                ]}>
                                    {t.costo === 0 ? 'GRATIS' : `$${t.costo.toFixed(2)}`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ✅ DIRECCIÓN - CON BÚSQUEDA MANUAL Y CAMPO NO EDITABLE */}
                {tipoEntrega === 'domicilio' && (
                    <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                        <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
                            📍 Dirección de entrega
                        </Text>

                        {/* ✅ DIRECCIÓN DEL PERFIL (NO EDITABLE) */}
                        <View style={[
                            estilos.direccionPerfilContainer,
                            {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                backgroundColor: direccionDelPerfil ? COLORS.verdeClaro + '15' : COLORS.negro + '40',
                                borderColor: direccionDelPerfil ? COLORS.verdeClaro + '30' : COLORS.blanco + '10',
                            }
                        ]}>
                            <View style={estilos.direccionPerfilHeader}>
                                <Ionicons
                                    name={direccionDelPerfil ? "checkmark-circle" : "location-outline"}
                                    size={isTablet ? 22 : 18}
                                    color={direccionDelPerfil ? COLORS.verdeClaro : COLORS.grisClaro}
                                />
                                <Text style={[
                                    estilos.direccionPerfilLabel,
                                    {
                                        fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12,
                                        color: direccionDelPerfil ? COLORS.verdeClaro : COLORS.grisClaro,
                                    }
                                ]}>
                                    {direccionDelPerfil ? 'Dirección de tu perfil' : 'Dirección personalizada'}
                                </Text>
                                {ubicacionSeleccionada && !direccionDelPerfil && (
                                    <View style={estilos.ubicacionConfirmada}>
                                        <Ionicons name="checkmark-circle" size={isTablet ? 14 : 10} color={COLORS.verdeClaro} />
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
                                    color: direccionDelPerfil ? COLORS.blanco : COLORS.blanco,
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

                        {/* ✅ INFORMACIÓN DE ENVÍO DINÁMICO */}
                        {ubicacionSeleccionada && !calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={estilos.infoEnvioContainer}>
                                <View style={estilos.infoEnvioFila}>
                                    <Ionicons name="navigate" size={18} color={COLORS.amarillo} />
                                    <Text style={estilos.infoEnvioTexto}>
                                        📏 Distancia: {distanciaFormateada || 'Calculando...'}
                                    </Text>
                                </View>

                                {envioDisponible ? (
                                    <>
                                        <View style={estilos.infoEnvioFila}>
                                            <Ionicons name="cash" size={18} color={COLORS.verdeClaro} />
                                            <Text style={[estilos.infoEnvioTexto, { color: COLORS.verdeClaro }]}>
                                                💰 Costo de envío: ${costoEnvioCalculado.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={estilos.infoEnvioFila}>
                                            <Ionicons name="time-outline" size={18} color={COLORS.amarillo} />
                                            <Text style={[estilos.infoEnvioTexto, { color: COLORS.amarillo }]}>
                                                ⏱️ Tiempo estimado: {tiempoEstimado} min
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <View style={estilos.infoEnvioFila}>
                                        <Ionicons name="warning" size={18} color={COLORS.rojo} />
                                        <Text style={[estilos.infoEnvioTexto, { color: COLORS.rojo }]}>
                                            ⚠️ {mensajeEnvio}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {calculandoEnvio && tipoEntrega === 'domicilio' && (
                            <View style={estilos.infoEnvioContainer}>
                                <View style={estilos.infoEnvioFila}>
                                    <ActivityIndicator size="small" color={COLORS.amarillo} />
                                    <Text style={estilos.infoEnvioTexto}>Calculando envío...</Text>
                                </View>
                            </View>
                        )}

                        {/* ✅ BUSCADOR MANUAL DE DIRECCIÓN */}
                        <View style={estilos.buscadorManualContainer}>
                            <Text style={[estilos.buscadorManualLabel, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12 }]}>
                                🔍 Buscar dirección en el mapa
                            </Text>
                            <View style={estilos.buscadorManualFila}>
                                <TextInput
                                    style={[estilos.buscadorManualInput, { fontSize: inputSize }]}
                                    value={busquedaManual}
                                    onChangeText={setBusquedaManual}
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    placeholderTextColor={COLORS.grisClaro + '60'}
                                    selectionColor={COLORS.amarillo}
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
                                        <ActivityIndicator size="small" color={COLORS.negro} />
                                    ) : (
                                        <Ionicons name="search" size={isTablet ? 22 : 18} color={COLORS.negro} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ✅ BOTÓN SELECCIONAR EN MAPA */}
                        <TouchableOpacity
                            style={[estilos.botonMapa, {
                                padding: isTablet ? 16 : isSmallPhone ? 10 : 12,
                                borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                                marginTop: 8,
                            }]}
                            onPress={() => setMostrarMapa(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="map-outline" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={COLORS.amarillo} />
                            <Text style={[estilos.botonMapaTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                                📍 Seleccionar ubicación en el mapa
                            </Text>
                            <Ionicons name="chevron-forward" size={isTablet ? 20 : 16} color={COLORS.grisClaro} />
                        </TouchableOpacity>

                        {/* ✅ SUGERENCIA DE DIRECCIÓN ENCONTRADA */}
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
                                <Ionicons name="location" size={isTablet ? 20 : 16} color={COLORS.verdeClaro} />
                                <Text style={[estilos.sugerenciaTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                                    {direccionSugerida}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                )}

                {/* ✅ MODAL DEL MAPA */}
                <Modal
                    visible={mostrarMapa}
                    transparent={false}
                    animationType="slide"
                    onRequestClose={() => setMostrarMapa(false)}
                >
                    <View style={estilos.mapaModal}>
                        <View style={estilos.mapaHeader}>
                            <TouchableOpacity
                                style={estilos.mapaHeaderBoton}
                                onPress={() => setMostrarMapa(false)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={28} color={COLORS.blanco} />
                            </TouchableOpacity>
                            <Text style={estilos.mapaHeaderTitulo}>Selecciona tu ubicación</Text>
                            <TouchableOpacity
                                style={[estilos.mapaHeaderBoton, estilos.mapaHeaderConfirmar]}
                                onPress={() => setMostrarMapa(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={estilos.mapaHeaderConfirmarTexto}>Listo</Text>
                            </TouchableOpacity>
                        </View>

                        <MapView
                            ref={mapRef}
                            style={estilos.mapaCompleto}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={{
                                latitude: ubicacionSeleccionada?.latitude || UBICACION_DEFAULT.latitude,
                                longitude: ubicacionSeleccionada?.longitude || UBICACION_DEFAULT.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            onPress={seleccionarUbicacionEnMapa}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                        >
                            {ubicacionSeleccionada && (
                                <Marker
                                    coordinate={ubicacionSeleccionada}
                                    draggable
                                    onDragEnd={seleccionarUbicacionEnMapa}
                                    pinColor={COLORS.amarillo}
                                >
                                    <View style={estilos.marcadorPersonalizado}>
                                        <View style={estilos.marcadorPunto} />
                                    </View>
                                </Marker>
                            )}
                        </MapView>

                        <View style={estilos.mapaFooter}>
                            <Text style={estilos.mapaFooterTexto}>
                                Toca el mapa o arrastra el marcador para seleccionar tu ubicación
                            </Text>
                            <TouchableOpacity
                                style={estilos.botonMiUbicacion}
                                onPress={obtenerUbicacionActual}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="locate" size={24} color={COLORS.amarillo} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MÉTODO DE PAGO */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
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
                                        backgroundColor: metodoPago === m.id ? COLORS.amarillo : COLORS.negro + '40',
                                        borderColor: metodoPago === m.id ? COLORS.amarillo : COLORS.blanco + '10',
                                    }
                                ]}
                                onPress={() => setMetodoPago(m.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={m.icono as any}
                                    size={isTablet ? 26 : 20}
                                    color={metodoPago === m.id ? COLORS.negro : COLORS.grisClaro}
                                />
                                <Text style={[
                                    estilos.opcionTexto,
                                    {
                                        fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                                        color: metodoPago === m.id ? COLORS.negro : COLORS.blanco,
                                    }
                                ]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* NOTAS */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
                        📝 Notas (opcional)
                    </Text>
                    <View style={estilos.inputContainer}>
                        <Ionicons name="create-outline" size={22} color={COLORS.grisClaro} style={estilos.inputIcon} />
                        <TextInput
                            style={[estilos.input, estilos.textArea, { fontSize: inputSize }]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Sin cebolla, extra queso..."
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            multiline
                            numberOfLines={2}
                            selectionColor={COLORS.amarillo}
                        />
                    </View>
                </Animated.View>

                {/* PRODUCTOS */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
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

                {/* CUPÓN */}
                {cuponAplicado && (
                    <Animated.View style={[
                        estilos.seccion,
                        estilos.cuponSeccion,
                        { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }
                    ]}>
                        <Ionicons name="pricetag" size={isTablet ? 24 : 20} color={COLORS.amarillo} />
                        <Text style={[estilos.cuponTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                            Cupón: {cuponAplicado.recompensas?.nombre} (-${descuento.toFixed(2)})
                        </Text>
                    </Animated.View>
                )}

                {/* RESUMEN */}
                <Animated.View style={[estilos.seccion, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize }]}>
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
                            <Text style={[estilos.resumenTexto, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: COLORS.verdeClaro }]}>
                                Descuento
                            </Text>
                            <Text style={[estilos.resumenValor, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: COLORS.verdeClaro }]}>
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

                {/* BOTÓN CONFIRMAR */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
                    <TouchableOpacity
                        style={[estilos.botonConfirmar, cargando && { opacity: 0.6 }]}
                        onPress={confirmarPedido}
                        disabled={cargando}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
                            style={estilos.botonConfirmarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="checkmark-circle" size={isTablet ? 28 : 24} color={COLORS.negro} />
                            <Text style={[estilos.botonConfirmarTexto, { fontSize: buttonTextSize }]}>
                                {cargando ? 'Procesando...' : 'Confirmar Pedido'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* MODAL DE ÉXITO */}
            <Modal visible={mostrarModalExito} transparent animationType="fade">
                <View style={estilos.modalFondo}>
                    <View style={[
                        estilos.modal,
                        {
                            padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
                            borderRadius: isTablet ? 28 : 24,
                            borderColor: COLORS.verdeClaro,
                        }
                    ]}>
                        <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>✅</Text>
                        <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
                            ¡Pedido confirmado!
                        </Text>
                        <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
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
        </View>
    );
}

// ============================================================
// 📋 ESTILOS
// ============================================================
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
    },
    scroll: {
        flexGrow: 1,
    },
    seccion: {
        marginBottom: 20,
    },
    seccionTitulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.negro + '50',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    inputIcon: {
        marginRight: 12,
        marginTop: 12,
    },
    input: {
        flex: 1,
        color: COLORS.blanco,
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
        backgroundColor: COLORS.amarillo + '15',
        borderWidth: 1,
        borderColor: COLORS.amarillo + '20',
        marginBottom: 10,
    },
    botonMapaTexto: {
        color: COLORS.amarillo,
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
        backgroundColor: COLORS.verdeClaro + '15',
        borderWidth: 1,
        borderColor: COLORS.verdeClaro + '20',
        marginTop: 8,
        gap: 8,
    },
    sugerenciaTexto: {
        color: COLORS.verdeClaro,
        fontWeight: '500',
        flex: 1,
    },
    infoEnvioContainer: {
        backgroundColor: COLORS.negro + '30',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: COLORS.blanco + '8',
    },
    infoEnvioFila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 3,
    },
    infoEnvioTexto: {
        color: COLORS.grisClaro,
        fontSize: 13,
        fontWeight: '500',
    },
    mapaModal: {
        flex: 1,
        backgroundColor: COLORS.negro,
    },
    mapaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        backgroundColor: COLORS.negro,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '10',
    },
    mapaHeaderBoton: {
        padding: 8,
    },
    mapaHeaderTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    mapaHeaderConfirmar: {
        backgroundColor: COLORS.amarillo,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    mapaHeaderConfirmarTexto: {
        color: COLORS.negro,
        fontWeight: 'bold',
    },
    mapaCompleto: {
        flex: 1,
    },
    mapaFooter: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.negro + '80',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    mapaFooterTexto: {
        color: COLORS.grisClaro,
        fontSize: 12,
        flex: 1,
        marginRight: 12,
    },
    botonMiUbicacion: {
        backgroundColor: COLORS.amarillo + '20',
        padding: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: COLORS.amarillo + '30',
    },
    marcadorPersonalizado: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marcadorPunto: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.amarillo,
        borderWidth: 3,
        borderColor: COLORS.blanco,
        shadowColor: COLORS.amarillo,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    },
    productoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '5',
    },
    productoNombre: {
        color: COLORS.grisClaro,
        fontWeight: '500',
    },
    productoPrecio: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    cuponSeccion: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.amarillo + '15',
        borderRadius: 12,
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: COLORS.amarillo + '20',
    },
    cuponTexto: {
        color: COLORS.amarillo,
        fontWeight: 'bold',
        flex: 1,
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resumenTexto: {
        color: COLORS.grisClaro,
    },
    resumenValor: {
        color: COLORS.blanco,
        fontWeight: '600',
    },
    resumenTotal: {
        borderTopWidth: 1,
        borderTopColor: COLORS.blanco + '15',
        paddingTop: 10,
        marginTop: 4,
    },
    totalTexto: {
        fontWeight: 'bold',
        color: COLORS.blanco,
    },
    totalPrecio: {
        fontWeight: 'bold',
        color: COLORS.amarillo,
    },
    botonConfirmar: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.amarillo,
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
        color: COLORS.negro,
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
        backgroundColor: COLORS.grisOscuro,
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
        color: COLORS.verdeClaro,
        marginBottom: 8,
    },
    modalTexto: {
        color: COLORS.grisClaro,
        textAlign: 'center',
    },
    modalSubtexto: {
        color: COLORS.amarillo,
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
        backgroundColor: COLORS.amarillo,
    },
    cargandoUbicacion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.negro + '30',
        paddingVertical: 10,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.blanco + '5',
        gap: 10,
    },
    cargandoUbicacionTexto: {
        color: COLORS.grisClaro,
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
        color: COLORS.grisClaro,
        marginTop: 6,
        opacity: 0.6,
        fontStyle: 'italic',
    },
    guardandoPerfilContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.amarillo + '15',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: COLORS.amarillo + '20',
    },
    guardandoPerfilTexto: {
        color: COLORS.amarillo,
        fontSize: 13,
        fontWeight: '500',
    },
    ubicacionConfirmada: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.verdeClaro + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 4,
        marginLeft: 8,
    },
    ubicacionConfirmadaTexto: {
        color: COLORS.verdeClaro,
        fontWeight: '500',
    },
    datosGuardados: {
        color: COLORS.verdeClaro,
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
        color: COLORS.grisClaro,
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
        backgroundColor: COLORS.negro + '40',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        color: COLORS.blanco,
    },
    botonBuscar: {
        backgroundColor: COLORS.amarillo,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 50,
    },
});