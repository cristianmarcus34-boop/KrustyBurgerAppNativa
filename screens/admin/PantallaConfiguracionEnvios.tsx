// screens/admin/PantallaConfiguracionEnvios.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
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

export default function PantallaConfiguracionEnvios(props: any) {
    const insets = useSafeAreaInsets();
    const {
        configuracion,
        configuracionLocal,
        cargando,
        cargarConfiguracion,
        actualizarConfiguracion,
        actualizarUbicacionLocal
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

    const isTablet = width >= 768;
    const paddingHorizontal = isTablet ? 40 : 16;

    // ✅ CARGAR DATOS AL MONTAR
    useEffect(() => {
        console.log('🔄 [ConfigEnvios] Montando componente...');
        cargarDatos();
    }, []);

    // ✅ FUNCIÓN PARA CARGAR DATOS
    const cargarDatos = async () => {
        console.log('📦 [ConfigEnvios] Cargando datos...');
        await cargarConfiguracion();
        // Los estados se actualizarán automáticamente por el useEffect de abajo
    };

    // ✅ SINCRONIZAR ESTADOS LOCALES CON EL STORE
    useEffect(() => {
        console.log('🔄 [ConfigEnvios] Store actualizado, sincronizando UI...');

        if (configuracion) {
            console.log('📦 Configuración:', configuracion);
            setPrecioBase(String(configuracion.precio_base || 0));
            setPrecioPorKm(String(configuracion.precio_por_km || 0));
            setDistanciaMinima(String(configuracion.distancia_minima_km || 0));
            setDistanciaMaxima(String(configuracion.distancia_maxima_km || 0));
            setActivo(configuracion.activo !== undefined ? configuracion.activo : true);
        }

        if (configuracionLocal) {
            console.log('📦 Ubicación:', configuracionLocal);
            setNombreLocal(configuracionLocal.nombre || '');
            setLatitudLocal(String(configuracionLocal.latitud || 0));
            setLongitudLocal(String(configuracionLocal.longitud || 0));
            setDireccionLocal(configuracionLocal.direccion || '');
            setTelefonoLocal(configuracionLocal.telefono || '');
        }
    }, [configuracion, configuracionLocal]); // ✅ Se ejecuta cuando cambia el store

    // ✅ GUARDAR CONFIGURACIÓN DE ENVÍOS
    const guardarConfiguracion = async () => {
        console.log('💾 [ConfigEnvios] Guardando configuración...');

        const datos: any = {};
        if (precioBase) datos.precio_base = parseFloat(precioBase);
        if (precioPorKm) datos.precio_por_km = parseFloat(precioPorKm);
        if (distanciaMinima) datos.distancia_minima_km = parseFloat(distanciaMinima);
        if (distanciaMaxima) datos.distancia_maxima_km = parseFloat(distanciaMaxima);
        datos.activo = activo;

        // ✅ Validaciones
        if (datos.precio_base !== undefined && datos.precio_base < 0) {
            Alert.alert('Error', 'El precio base no puede ser negativo');
            return;
        }
        if (datos.precio_por_km !== undefined && datos.precio_por_km < 0) {
            Alert.alert('Error', 'El precio por km no puede ser negativo');
            return;
        }
        if (datos.distancia_maxima_km !== undefined && datos.distancia_maxima_km <= 0) {
            Alert.alert('Error', 'La distancia máxima debe ser mayor a 0');
            return;
        }

        setGuardando(true);

        try {
            // ✅ Actualizar en Supabase directamente
            const { error } = await supabase
                .from('configuracion_envios')
                .update({
                    ...datos,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) {
                console.error('❌ Error en Supabase:', error);
                Alert.alert('❌ Error', error.message);
                setGuardando(false);
                return;
            }

            console.log('✅ Actualizado en Supabase');

            // ✅ RECARGAR DATOS DESDE SUPABASE
            await cargarConfiguracion();

            // ✅ Los estados se actualizarán automáticamente por el useEffect

            Alert.alert('✅ Éxito', 'Configuración de envíos actualizada correctamente');

        } catch (error: any) {
            console.error('❌ Error:', error);
            Alert.alert('❌ Error', error.message || 'No se pudo actualizar');
        } finally {
            setGuardando(false);
        }
    };

    // ✅ GUARDAR UBICACIÓN DEL LOCAL
    const guardarUbicacion = async () => {
        console.log('💾 [ConfigEnvios] Guardando ubicación...');

        const datos: any = {};
        if (nombreLocal) datos.nombre = nombreLocal;
        if (latitudLocal) datos.latitud = parseFloat(latitudLocal);
        if (longitudLocal) datos.longitud = parseFloat(longitudLocal);
        if (direccionLocal) datos.direccion = direccionLocal;
        if (telefonoLocal) datos.telefono = telefonoLocal;

        // ✅ Validaciones
        if (datos.latitud !== undefined && (datos.latitud < -90 || datos.latitud > 90)) {
            Alert.alert('Error', 'La latitud debe estar entre -90 y 90');
            return;
        }
        if (datos.longitud !== undefined && (datos.longitud < -180 || datos.longitud > 180)) {
            Alert.alert('Error', 'La longitud debe estar entre -180 y 180');
            return;
        }

        setGuardando(true);

        try {
            // ✅ Actualizar en Supabase directamente
            const { error } = await supabase
                .from('configuracion_local')
                .update({
                    ...datos,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) {
                console.error('❌ Error en Supabase:', error);
                Alert.alert('❌ Error', error.message);
                setGuardando(false);
                return;
            }

            console.log('✅ Ubicación actualizada en Supabase');

            // ✅ RECARGAR DATOS
            await cargarConfiguracion();

            Alert.alert('✅ Éxito', 'Ubicación actualizada correctamente');

        } catch (error: any) {
            console.error('❌ Error:', error);
            Alert.alert('❌ Error', error.message);
        } finally {
            setGuardando(false);
        }
    };

    // ✅ PULL-TO-REFRESH
    const onRefresh = async () => {
        console.log('🔄 [ConfigEnvios] Pull-to-refresh...');
        setRefrescando(true);
        await cargarDatos();
        setRefrescando(false);
        console.log('✅ [ConfigEnvios] Refresh completado');
    };

    if (cargando && !refrescando) {
        return (
            <View style={estilos.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.amarillo} />
                <Text style={estilos.loadingTexto}>Cargando configuración...</Text>
            </View>
        );
    }

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
                <Text style={[estilos.titulo, { fontSize: isTablet ? 26 : 22 }]}>
                    🚚 Configuración de Envíos
                </Text>
                <TouchableOpacity
                    style={[estilos.botonRecargar, {
                        padding: isTablet ? 10 : 8,
                        borderRadius: isTablet ? 10 : 8,
                    }]}
                    onPress={onRefresh}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh-outline" size={isTablet ? 24 : 20} color={COLORS.amarillo} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    estilos.scroll,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 150,
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
            >
                {/* ✅ SECCIÓN: CONFIGURACIÓN DE ENVÍOS */}
                <View style={estilos.seccion}>
                    <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                        💰 Tarifas de envío
                    </Text>

                    <View style={estilos.card}>
                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13 }]}>Precio base ($)</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={precioBase}
                            onChangeText={setPrecioBase}
                            placeholder="1000.00"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Precio por km extra ($)</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={precioPorKm}
                            onChangeText={setPrecioPorKm}
                            placeholder="150.00"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Distancia mínima incluida (km)</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={distanciaMinima}
                            onChangeText={setDistanciaMinima}
                            placeholder="0"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Distancia máxima de cobertura (km)</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={distanciaMaxima}
                            onChangeText={setDistanciaMaxima}
                            placeholder="10"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <View style={estilos.activoContainer}>
                            <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginBottom: 0 }]}>Activo</Text>
                            <TouchableOpacity
                                style={[
                                    estilos.toggle,
                                    {
                                        backgroundColor: activo ? COLORS.verdeClaro : COLORS.gris,
                                        width: isTablet ? 52 : 48,
                                        height: isTablet ? 30 : 28,
                                        borderRadius: isTablet ? 15 : 14,
                                    }
                                ]}
                                onPress={() => setActivo(!activo)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    estilos.toggleKnob,
                                    {
                                        width: isTablet ? 24 : 22,
                                        height: isTablet ? 24 : 22,
                                        borderRadius: isTablet ? 12 : 11,
                                        transform: [{ translateX: activo ? (isTablet ? 24 : 22) : 2 }],
                                        backgroundColor: COLORS.blanco,
                                    }
                                ]} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[estilos.botonGuardar, {
                                paddingVertical: isTablet ? 14 : 12,
                                borderRadius: isTablet ? 14 : 12,
                                marginTop: 16,
                            }]}
                            onPress={guardarConfiguracion}
                            disabled={guardando}
                            activeOpacity={0.7}
                        >
                            {guardando ? (
                                <ActivityIndicator size="small" color={COLORS.negro} />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={isTablet ? 22 : 18} color={COLORS.negro} />
                                    <Text style={[estilos.botonGuardarTexto, { fontSize: isTablet ? 16 : 14 }]}>
                                        Guardar tarifas
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ✅ SECCIÓN: UBICACIÓN DEL LOCAL */}
                <View style={estilos.seccion}>
                    <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                        📍 Ubicación del local
                    </Text>

                    <View style={estilos.card}>
                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13 }]}>Nombre del local</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={nombreLocal}
                            onChangeText={setNombreLocal}
                            placeholder="Krusty Burger"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Latitud</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={latitudLocal}
                            onChangeText={setLatitudLocal}
                            placeholder="-34.776484410467525"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Longitud</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={longitudLocal}
                            onChangeText={setLongitudLocal}
                            placeholder="-58.29220250409459"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="decimal-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Dirección</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={direccionLocal}
                            onChangeText={setDireccionLocal}
                            placeholder="Av. Principal 1234, CABA"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            selectionColor={COLORS.amarillo}
                        />

                        <Text style={[estilos.label, { fontSize: isTablet ? 14 : 13, marginTop: 12 }]}>Teléfono</Text>
                        <TextInput
                            style={[estilos.input, { fontSize: isTablet ? 16 : 14 }]}
                            value={telefonoLocal}
                            onChangeText={setTelefonoLocal}
                            placeholder="11 1234-5678"
                            placeholderTextColor={COLORS.grisClaro + '60'}
                            keyboardType="phone-pad"
                            selectionColor={COLORS.amarillo}
                        />

                        <TouchableOpacity
                            style={[estilos.botonGuardar, {
                                paddingVertical: isTablet ? 14 : 12,
                                borderRadius: isTablet ? 14 : 12,
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
                                    <Ionicons name="save-outline" size={isTablet ? 22 : 18} color={COLORS.negro} />
                                    <Text style={[estilos.botonGuardarTexto, { fontSize: isTablet ? 16 : 14 }]}>
                                        Guardar ubicación
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ✅ SECCIÓN: EJEMPLO DE CÁLCULO */}
                <View style={estilos.seccion}>
                    <Text style={[estilos.seccionTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                        📊 Ejemplo de cálculo
                    </Text>

                    <View style={estilos.card}>
                        <View style={estilos.ejemploFila}>
                            <Text style={[estilos.ejemploLabel, { fontSize: isTablet ? 14 : 13 }]}>Distancia: 1 km</Text>
                            <Text style={[estilos.ejemploValor, { fontSize: isTablet ? 16 : 14, color: COLORS.amarillo }]}>
                                ${(parseFloat(precioBase || '0') + Math.max(0, 1 - parseFloat(distanciaMinima || '0')) * parseFloat(precioPorKm || '0')).toFixed(2)}
                            </Text>
                        </View>
                        <View style={estilos.ejemploFila}>
                            <Text style={[estilos.ejemploLabel, { fontSize: isTablet ? 14 : 13 }]}>Distancia: 3 km</Text>
                            <Text style={[estilos.ejemploValor, { fontSize: isTablet ? 16 : 14, color: COLORS.amarillo }]}>
                                ${(parseFloat(precioBase || '0') + Math.max(0, 3 - parseFloat(distanciaMinima || '0')) * parseFloat(precioPorKm || '0')).toFixed(2)}
                            </Text>
                        </View>
                        <View style={estilos.ejemploFila}>
                            <Text style={[estilos.ejemploLabel, { fontSize: isTablet ? 14 : 13 }]}>Distancia: 5 km</Text>
                            <Text style={[estilos.ejemploValor, { fontSize: isTablet ? 16 : 14, color: COLORS.amarillo }]}>
                                ${(parseFloat(precioBase || '0') + Math.max(0, 5 - parseFloat(distanciaMinima || '0')) * parseFloat(precioPorKm || '0')).toFixed(2)}
                            </Text>
                        </View>
                        <View style={estilos.ejemploFila}>
                            <Text style={[estilos.ejemploLabel, { fontSize: isTablet ? 14 : 13 }]}>Distancia: {parseFloat(distanciaMaxima || '10')} km</Text>
                            <Text style={[estilos.ejemploValor, { fontSize: isTablet ? 16 : 14, color: COLORS.verdeClaro }]}>
                                ${(parseFloat(precioBase || '0') + Math.max(0, parseFloat(distanciaMaxima || '10') - parseFloat(distanciaMinima || '0')) * parseFloat(precioPorKm || '0')).toFixed(2)}
                            </Text>
                        </View>
                        <Text style={[estilos.ejemploNota, { fontSize: isTablet ? 12 : 11 }]}>
                            ⚠️ Costos calculados con la configuración actual.
                        </Text>
                        <Text style={[estilos.ejemploNota, { fontSize: isTablet ? 12 : 11 }]}>
                            🔄 Los cambios se reflejan al guardar.
                        </Text>
                    </View>
                </View>

                {/* ✅ INDICADOR DE ÚLTIMA ACTUALIZACIÓN */}
                <View style={estilos.footerInfo}>
                    <Text style={[estilos.footerInfoTexto, { fontSize: isTablet ? 12 : 10 }]}>
                        {configuracion?.updated_at ?
                            `Última actualización: ${new Date(configuracion.updated_at).toLocaleString('es-AR')}` :
                            'Cargando...'
                        }
                    </Text>
                </View>
            </ScrollView>
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