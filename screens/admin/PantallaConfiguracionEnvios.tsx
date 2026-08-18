// screens/admin/PantallaConfiguracionEnvios.tsx - COMPLETO Y OPTIMIZADO
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaEnvios } from '../../stores/tiendaEnvios';
import { Colores } from '../../lib/colores';

const { width } = Dimensions.get('window');

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

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;

    return {
        isTablet,
        isSmallPhone,
        paddingHorizontal: isTablet ? 40 : isSmallPhone ? 12 : 16,
        tituloSize: isTablet ? 26 : isSmallPhone ? 18 : 22,
        labelSize: isTablet ? 14 : isSmallPhone ? 11 : 13,
        inputSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
        botonPadding: isTablet ? 14 : isSmallPhone ? 10 : 12,
        cardPadding: isTablet ? 20 : isSmallPhone ? 12 : 16,
    };
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaConfiguracionEnvios(props: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();

    // ✅ Store
    const {
        configuracion,
        configuracionLocal,
        cargando,
        cargarConfiguracion,
        actualizarConfiguracion,
        actualizarUbicacionLocal,
        recargar,
    } = tiendaEnvios();

    // ✅ Estados del formulario
    const [precioBase, setPrecioBase] = useState('');
    const [precioPorKm, setPrecioPorKm] = useState('');
    const [distanciaMinima, setDistanciaMinima] = useState('');
    const [distanciaMaxima, setDistanciaMaxima] = useState('');
    const [activo, setActivo] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [refrescando, setRefrescando] = useState(false);

    // ✅ Estados del local
    const [nombreLocal, setNombreLocal] = useState('');
    const [latitudLocal, setLatitudLocal] = useState('');
    const [longitudLocal, setLongitudLocal] = useState('');
    const [direccionLocal, setDireccionLocal] = useState('');
    const [telefonoLocal, setTelefonoLocal] = useState('');

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        console.log('🔄 [Pantalla] Montando componente...');
        cargarDatos();
    }, []);

    // ✅ SINCRONIZAR ESTADOS LOCALES CON EL STORE
    useEffect(() => {
        console.log('🔄 [Pantalla] Store actualizado, sincronizando UI...');

        if (configuracion) {
            console.log('📦 [Pantalla] Configuración recibida:', configuracion);
            setPrecioBase(String(configuracion.precio_base ?? 0));
            setPrecioPorKm(String(configuracion.precio_por_km ?? 0));
            setDistanciaMinima(String(configuracion.distancia_minima_km ?? 0));
            setDistanciaMaxima(String(configuracion.distancia_maxima_km ?? 0));
            setActivo(configuracion.activo ?? true);
        }

        if (configuracionLocal) {
            console.log('📦 [Pantalla] Ubicación recibida:', configuracionLocal);
            setNombreLocal(configuracionLocal.nombre || '');
            setLatitudLocal(String(configuracionLocal.latitud ?? 0));
            setLongitudLocal(String(configuracionLocal.longitud ?? 0));
            setDireccionLocal(configuracionLocal.direccion || '');
            setTelefonoLocal(configuracionLocal.telefono || '');
        }
    }, [configuracion, configuracionLocal]);

    // ============================================================
    // 🔄 FUNCIONES DE CARGA
    // ============================================================
    const cargarDatos = async () => {
        console.log('📦 [Pantalla] Cargando datos desde el store...');
        await cargarConfiguracion();
        console.log('✅ [Pantalla] Carga de datos completada');
    };

    const onRefresh = async () => {
        console.log('🔄 [Pantalla] Pull-to-refresh...');
        setRefrescando(true);
        await recargar();
        setRefrescando(false);
        console.log('✅ [Pantalla] Refresh completado');
    };

    // ============================================================
    // ✅ VALIDACIONES
    // ============================================================
    const validarNumero = (valor: string, nombre: string): number | null => {
        if (valor === '') return null;
        const num = parseFloat(valor.replace(',', '.'));
        if (isNaN(num)) {
            Alert.alert('Error', `${nombre} debe ser un número válido`);
            return null;
        }
        return num;
    };

    // ============================================================
    // 💾 GUARDAR CONFIGURACIÓN DE ENVÍOS
    // ============================================================
    const guardarConfiguracion = async () => {
        console.log('💾 [Pantalla] Guardando configuración de envíos...');

        const datos: any = {};

        const precioBaseNum = validarNumero(precioBase, 'Precio base');
        if (precioBaseNum !== null) datos.precio_base = precioBaseNum;

        const precioPorKmNum = validarNumero(precioPorKm, 'Precio por km');
        if (precioPorKmNum !== null) datos.precio_por_km = precioPorKmNum;

        const distanciaMinNum = validarNumero(distanciaMinima, 'Distancia mínima');
        if (distanciaMinNum !== null) datos.distancia_minima_km = distanciaMinNum;

        const distanciaMaxNum = validarNumero(distanciaMaxima, 'Distancia máxima');
        if (distanciaMaxNum !== null) {
            if (distanciaMaxNum <= 0) {
                Alert.alert('Error', 'La distancia máxima debe ser mayor a 0');
                return;
            }
            datos.distancia_maxima_km = distanciaMaxNum;
        }

        datos.activo = activo;

        if (Object.keys(datos).length === 0) {
            Alert.alert('Error', 'No hay datos para guardar');
            return;
        }

        setGuardando(true);

        try {
            const resultado = await actualizarConfiguracion(datos);

            if (!resultado.success) {
                Alert.alert('❌ Error', resultado.error || 'No se pudo actualizar');
                setGuardando(false);
                return;
            }

            // ✅ El store ya actualizó el estado, solo mostramos el mensaje
            Alert.alert('✅ Éxito', 'Configuración de envíos actualizada correctamente');

            // ✅ Forzar recarga para asegurar que todo esté sincronizado
            await recargar();

        } catch (error: any) {
            console.error('❌ [Pantalla] Error:', error);
            Alert.alert('❌ Error', error.message || 'No se pudo actualizar');
        } finally {
            setGuardando(false);
        }
    };

    // ============================================================
    // 💾 GUARDAR UBICACIÓN DEL LOCAL
    // ============================================================
    const guardarUbicacion = async () => {
        console.log('💾 [Pantalla] Guardando ubicación del local...');

        const lat = parseFloat(latitudLocal.replace(',', '.'));
        const lng = parseFloat(longitudLocal.replace(',', '.'));

        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Error', 'Latitud y Longitud deben ser números válidos');
            return;
        }

        if (lat < -90 || lat > 90) {
            Alert.alert('Error', 'La latitud debe estar entre -90 y 90');
            return;
        }
        if (lng < -180 || lng > 180) {
            Alert.alert('Error', 'La longitud debe estar entre -180 y 180');
            return;
        }

        const datos: any = {
            nombre: nombreLocal.trim() || 'Krusty Burger',
            latitud: lat,
            longitud: lng,
        };

        if (direccionLocal.trim()) {
            datos.direccion = direccionLocal.trim();
        }
        if (telefonoLocal.trim()) {
            datos.telefono = telefonoLocal.trim();
        }

        console.log('📦 [Pantalla] Datos a guardar:', datos);

        setGuardando(true);

        try {
            const resultado = await actualizarUbicacionLocal(datos);

            if (!resultado.success) {
                Alert.alert('❌ Error', resultado.error || 'No se pudo actualizar');
                setGuardando(false);
                return;
            }

            // ✅ El store ya actualizó el estado, solo mostramos el mensaje
            Alert.alert('✅ Éxito', 'Ubicación actualizada correctamente');

            // ✅ Forzar recarga para asegurar que todo esté sincronizado
            await recargar();

        } catch (error: any) {
            console.error('❌ [Pantalla] Error:', error);
            Alert.alert('❌ Error', error.message || 'No se pudo actualizar');
        } finally {
            setGuardando(false);
        }
    };

    // ============================================================
    // 📊 EJEMPLO DE CÁLCULO
    // ============================================================
    const calcularEjemplo = (distancia: number) => {
        const base = parseFloat(precioBase || '0');
        const porKm = parseFloat(precioPorKm || '0');
        const minKm = parseFloat(distanciaMinima || '0');
        const extra = Math.max(0, distancia - minKm);
        return base + (extra * porKm);
    };

    const distanciaMax = parseFloat(distanciaMaxima || '10');

    // ============================================================
    // ⏳ LOADING
    // ============================================================
    if (cargando && !refrescando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={estilos.loadingTexto}>Cargando configuración...</Text>
            </View>
        );
    }

    // ============================================================
    // 🏗️ RENDER PRINCIPAL
    // ============================================================
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
                    paddingTop: insets.top + (responsive.isTablet ? 20 : 10),
                    paddingHorizontal: responsive.paddingHorizontal,
                    paddingBottom: responsive.isTablet ? 16 : 12,
                }
            ]}>
                <TouchableOpacity
                    style={estilos.botonVolver}
                    onPress={() => props.navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={responsive.isTablet ? 28 : 24} color={COLORS.blanco} />
                </TouchableOpacity>

                <Text style={[estilos.titulo, { fontSize: responsive.tituloSize }]}>
                    🚚 Configuración de Envíos
                </Text>

                <TouchableOpacity
                    style={[estilos.botonRecargar, {
                        padding: responsive.isTablet ? 10 : 8,
                        borderRadius: responsive.isTablet ? 10 : 8,
                    }]}
                    onPress={onRefresh}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh-outline" size={responsive.isTablet ? 24 : 20} color={COLORS.amarillo} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        estilos.scroll,
                        {
                            paddingHorizontal: responsive.paddingHorizontal,
                            paddingBottom: insets.bottom + 120,
                            paddingTop: 8,
                        }
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refrescando}
                            onRefresh={onRefresh}
                            tintColor={COLORS.amarillo}
                            colors={[COLORS.amarillo]}
                        />
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* SECCIÓN: CONFIGURACIÓN DE ENVÍOS */}
                    <View style={estilos.seccion}>
                        <Text style={[estilos.seccionTitulo, { fontSize: responsive.isTablet ? 18 : 16 }]}>
                            💰 Tarifas de envío
                        </Text>

                        <View style={[estilos.card, { padding: responsive.cardPadding }]}>
                            <Text style={[estilos.label, { fontSize: responsive.labelSize }]}>
                                Precio base ($)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={precioBase}
                                onChangeText={setPrecioBase}
                                placeholder="1000.00"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Precio por km extra ($)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={precioPorKm}
                                onChangeText={setPrecioPorKm}
                                placeholder="150.00"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Distancia mínima incluida (km)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={distanciaMinima}
                                onChangeText={setDistanciaMinima}
                                placeholder="0"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Distancia máxima de cobertura (km)
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={distanciaMaxima}
                                onChangeText={setDistanciaMaxima}
                                placeholder="10"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <View style={estilos.activoContainer}>
                                <Text style={[estilos.label, { fontSize: responsive.labelSize, marginBottom: 0 }]}>
                                    Activo
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        estilos.toggle,
                                        {
                                            backgroundColor: activo ? COLORS.verdeClaro : COLORS.gris,
                                            width: responsive.isTablet ? 52 : 48,
                                            height: responsive.isTablet ? 30 : 28,
                                            borderRadius: responsive.isTablet ? 15 : 14,
                                        }
                                    ]}
                                    onPress={() => setActivo(!activo)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        estilos.toggleKnob,
                                        {
                                            width: responsive.isTablet ? 24 : 22,
                                            height: responsive.isTablet ? 24 : 22,
                                            borderRadius: responsive.isTablet ? 12 : 11,
                                            transform: [{ translateX: activo ? (responsive.isTablet ? 24 : 22) : 2 }],
                                            backgroundColor: COLORS.blanco,
                                        }
                                    ]} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[estilos.botonGuardar, {
                                    paddingVertical: responsive.botonPadding,
                                    borderRadius: responsive.isTablet ? 14 : 12,
                                    marginTop: 16,
                                    backgroundColor: COLORS.amarillo,
                                }]}
                                onPress={guardarConfiguracion}
                                disabled={guardando}
                                activeOpacity={0.7}
                            >
                                {guardando ? (
                                    <ActivityIndicator size="small" color={COLORS.negro} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={responsive.isTablet ? 22 : 18} color={COLORS.negro} />
                                        <Text style={[estilos.botonGuardarTexto, { fontSize: responsive.isTablet ? 16 : 14 }]}>
                                            Guardar tarifas
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SECCIÓN: UBICACIÓN DEL LOCAL */}
                    <View style={estilos.seccion}>
                        <Text style={[estilos.seccionTitulo, { fontSize: responsive.isTablet ? 18 : 16 }]}>
                            📍 Ubicación del local
                        </Text>

                        <View style={[estilos.card, { padding: responsive.cardPadding }]}>
                            <Text style={[estilos.label, { fontSize: responsive.labelSize }]}>
                                Nombre del local
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={nombreLocal}
                                onChangeText={setNombreLocal}
                                placeholder="Krusty Burger"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Latitud
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={latitudLocal}
                                onChangeText={setLatitudLocal}
                                placeholder="-34.776484410467525"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Longitud
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={longitudLocal}
                                onChangeText={setLongitudLocal}
                                placeholder="-58.29220250409459"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="decimal-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Dirección
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={direccionLocal}
                                onChangeText={setDireccionLocal}
                                placeholder="Av. Principal 1234, CABA"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                selectionColor={COLORS.amarillo}
                            />

                            <Text style={[estilos.label, { fontSize: responsive.labelSize, marginTop: 12 }]}>
                                Teléfono
                            </Text>
                            <TextInput
                                style={[estilos.input, { fontSize: responsive.inputSize }]}
                                value={telefonoLocal}
                                onChangeText={setTelefonoLocal}
                                placeholder="11 1234-5678"
                                placeholderTextColor={COLORS.grisClaro + '40'}
                                keyboardType="phone-pad"
                                selectionColor={COLORS.amarillo}
                            />

                            <TouchableOpacity
                                style={[estilos.botonGuardar, {
                                    paddingVertical: responsive.botonPadding,
                                    borderRadius: responsive.isTablet ? 14 : 12,
                                    marginTop: 16,
                                    backgroundColor: COLORS.amarilloClaro,
                                }]}
                                onPress={guardarUbicacion}
                                disabled={guardando}
                                activeOpacity={0.7}
                            >
                                {guardando ? (
                                    <ActivityIndicator size="small" color={COLORS.negro} />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={responsive.isTablet ? 22 : 18} color={COLORS.negro} />
                                        <Text style={[estilos.botonGuardarTexto, { fontSize: responsive.isTablet ? 16 : 14 }]}>
                                            Guardar ubicación
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SECCIÓN: EJEMPLO DE CÁLCULO */}
                    <View style={estilos.seccion}>
                        <Text style={[estilos.seccionTitulo, { fontSize: responsive.isTablet ? 18 : 16 }]}>
                            📊 Ejemplo de cálculo
                        </Text>

                        <View style={[estilos.card, { padding: responsive.cardPadding }]}>
                            <View style={estilos.ejemploFila}>
                                <Text style={[estilos.ejemploLabel, { fontSize: responsive.labelSize }]}>
                                    Distancia: 1 km
                                </Text>
                                <Text style={[estilos.ejemploValor, { fontSize: responsive.inputSize, color: COLORS.amarillo }]}>
                                    ${calcularEjemplo(1).toFixed(2)}
                                </Text>
                            </View>
                            <View style={estilos.ejemploFila}>
                                <Text style={[estilos.ejemploLabel, { fontSize: responsive.labelSize }]}>
                                    Distancia: 3 km
                                </Text>
                                <Text style={[estilos.ejemploValor, { fontSize: responsive.inputSize, color: COLORS.amarillo }]}>
                                    ${calcularEjemplo(3).toFixed(2)}
                                </Text>
                            </View>
                            <View style={estilos.ejemploFila}>
                                <Text style={[estilos.ejemploLabel, { fontSize: responsive.labelSize }]}>
                                    Distancia: 5 km
                                </Text>
                                <Text style={[estilos.ejemploValor, { fontSize: responsive.inputSize, color: COLORS.amarillo }]}>
                                    ${calcularEjemplo(5).toFixed(2)}
                                </Text>
                            </View>
                            <View style={estilos.ejemploFila}>
                                <Text style={[estilos.ejemploLabel, { fontSize: responsive.labelSize }]}>
                                    Distancia: {distanciaMax} km
                                </Text>
                                <Text style={[estilos.ejemploValor, { fontSize: responsive.inputSize, color: COLORS.verdeClaro }]}>
                                    ${calcularEjemplo(distanciaMax).toFixed(2)}
                                </Text>
                            </View>
                            <Text style={[estilos.ejemploNota, { fontSize: responsive.isTablet ? 12 : 11 }]}>
                                ⚠️ Costos calculados con la configuración actual.
                            </Text>
                            <Text style={[estilos.ejemploNota, { fontSize: responsive.isTablet ? 12 : 11 }]}>
                                🔄 Los cambios se reflejan al guardar.
                            </Text>
                        </View>
                    </View>

                    {/* INDICADOR DE ÚLTIMA ACTUALIZACIÓN */}
                    <View style={estilos.footerInfo}>
                        <Text style={[estilos.footerInfoTexto, { fontSize: responsive.isTablet ? 12 : 10 }]}>
                            {configuracion?.updated_at ?
                                `Última actualización: ${new Date(configuracion.updated_at).toLocaleString('es-AR')}` :
                                'Cargando...'
                            }
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.negro,
        gap: 16,
    },
    loadingTexto: {
        color: COLORS.grisClaro,
        fontSize: 16,
        fontWeight: '400',
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
    botonRecargar: {
        backgroundColor: COLORS.amarillo + '15',
        borderWidth: 1,
        borderColor: COLORS.amarillo + '20',
    },
    titulo: {
        fontWeight: 'bold',
        color: COLORS.blanco,
        letterSpacing: 1,
        flex: 1,
        textAlign: 'center',
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
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: COLORS.negro + '40',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
    },
    label: {
        fontWeight: '600',
        color: COLORS.blanco,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.negro + '50',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.blanco + '10',
        color: COLORS.blanco,
    },
    activoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    toggle: {
        justifyContent: 'center',
        padding: 2,
    },
    toggleKnob: {
        shadowColor: COLORS.negro,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    botonGuardar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.amarillo,
    },
    botonGuardarTexto: {
        color: COLORS.negro,
        fontWeight: 'bold',
    },
    ejemploFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.blanco + '5',
    },
    ejemploLabel: {
        color: COLORS.grisClaro,
        fontWeight: '500',
    },
    ejemploValor: {
        fontWeight: 'bold',
    },
    ejemploNota: {
        color: COLORS.grisClaro,
        marginTop: 8,
        opacity: 0.6,
        fontStyle: 'italic',
    },
    footerInfo: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.blanco + '5',
        marginTop: 8,
    },
    footerInfoTexto: {
        color: COLORS.grisClaro,
        opacity: 0.5,
    },
});