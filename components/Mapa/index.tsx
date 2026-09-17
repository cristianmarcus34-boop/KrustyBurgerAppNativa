// components/Mapa/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Keyboard,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Colores } from '../../lib/colores';
import { MarcadorPersonalizado } from './MarcadorPersonalizado';
import { estilos } from './MapaEstilos';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirmar: (ubicacion: { latitude: number; longitude: number; direccion: string }) => void;
    ubicacionInicial?: { latitude: number; longitude: number };
    direccionInicial?: string;
    titulo?: string;
}

// ============================================================
// ✅ HELPERS FUERA DEL COMPONENTE
// ============================================================

/**
 * Pide permisos de ubicación si no están concedidos.
 * Devuelve `true` si tiene permisos, `false` si no.
 */
const asegurarPermisosUbicacion = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') return true;

        console.log('📍 [Mapa] Solicitando permisos de ubicación...');
        const { status: nuevoStatus } = await Location.requestForegroundPermissionsAsync();
        if (nuevoStatus === 'granted') return true;

        console.warn('❌ [Mapa] Permisos de ubicación rechazados');
        return false;
    } catch (error) {
        console.error('❌ [Mapa] Error pidiendo permisos:', error);
        return false;
    }
};

/**
 * Convierte coordenadas en una dirección legible.
 * Pide permisos automáticamente si no los tiene.
 * Devuelve `null` si no se pudo obtener.
 */
const obtenerDireccionDesdeCoordenadas = async (lat: number, lng: number): Promise<string | null> => {
    try {
        const tienePermiso = await asegurarPermisosUbicacion();
        if (!tienePermiso) {
            console.warn('⚠️ [Mapa] Sin permisos, no se puede geocodificar');
            return null;
        }

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

            const direccion = partes.join(', ') || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            console.log('📍 [Mapa] Dirección obtenida:', direccion);
            return direccion;
        }

        return null;
    } catch (error) {
        console.error('❌ [Mapa] Error geocodificando:', error);
        return null;
    }
};

export default function MapaSelector({
    visible,
    onClose,
    onConfirmar,
    ubicacionInicial,
    direccionInicial = '',
    titulo = 'Selecciona tu ubicación',
}: Props) {
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(
        ubicacionInicial || { latitude: -34.776484410467525, longitude: -58.29220250409459 }
    );
    const [direccion, setDireccion] = useState(direccionInicial);
    const [buscando, setBuscando] = useState(false);
    const [busquedaManual, setBusquedaManual] = useState('');
    const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
    const [cargandoDireccion, setCargandoDireccion] = useState(false);
    const mapRef = useRef<MapView>(null);

    // ✅ Sincronizar cuando cambia la ubicación inicial
    useEffect(() => {
        if (ubicacionInicial && visible) {
            setUbicacionSeleccionada(ubicacionInicial);
            setDireccion(direccionInicial);
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: ubicacionInicial.latitude,
                    longitude: ubicacionInicial.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 500);
            }
        }
    }, [ubicacionInicial, direccionInicial, visible]);

    // ✅ Pedir permisos al abrir el modal
    useEffect(() => {
        if (visible) {
            asegurarPermisosUbicacion();
        }
    }, [visible]);

    // ✅ Obtener ubicación actual
    const obtenerUbicacionActual = async () => {
        setCargandoUbicacion(true);
        try {
            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) {
                Alert.alert(
                    'Permisos necesarios',
                    'Necesitamos permiso de ubicación para centrar el mapa en tu posición actual. Habilitalo desde los ajustes del teléfono.'
                );
                return;
            }

            const ubicacion = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = ubicacion.coords;
            setUbicacionSeleccionada({ latitude, longitude });

            setCargandoDireccion(true);
            const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
            if (direccionObtenida) {
                setDireccion(direccionObtenida);
            }
            setCargandoDireccion(false);

            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 500);
            }
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
        } finally {
            setCargandoUbicacion(false);
        }
    };

    // ✅ Buscar dirección manual
    const buscarDireccionManual = async () => {
        if (busquedaManual.length < 3) {
            return;
        }

        setBuscando(true);

        if (Platform.OS === 'ios') {
            Keyboard.dismiss();
        } else {
            Keyboard.dismiss();
        }

        try {
            console.log('🔍 Buscando dirección:', busquedaManual);

            const tienePermiso = await asegurarPermisosUbicacion();
            if (!tienePermiso) {
                Alert.alert(
                    'Permisos necesarios',
                    'Necesitamos permiso de ubicación para buscar direcciones.'
                );
                return;
            }

            const resultados = await Location.geocodeAsync(busquedaManual);

            if (resultados && resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                console.log('📍 Ubicación encontrada:', latitude, longitude);

                setUbicacionSeleccionada({ latitude, longitude });

                setCargandoDireccion(true);
                const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
                console.log('📌 Dirección obtenida:', direccionObtenida);

                if (direccionObtenida) {
                    setDireccion(direccionObtenida);
                } else {
                    setDireccion(busquedaManual);
                }
                setCargandoDireccion(false);

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }

                setBusquedaManual('');
            } else {
                console.log('⚠️ No se encontraron resultados para:', busquedaManual);
                Alert.alert(
                    'Sin resultados',
                    'No pudimos encontrar esa dirección. Probá con otra búsqueda.'
                );
            }
        } catch (error) {
            console.log('❌ Error buscando dirección:', error);
            Alert.alert(
                'Error',
                'Hubo un problema al buscar la dirección. Intentá de nuevo.'
            );
        } finally {
            setBuscando(false);
        }
    };

    // ✅ Seleccionar ubicación en el mapa (al tocar o arrastrar)
    const seleccionarUbicacion = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;

        setUbicacionSeleccionada({ latitude, longitude });

        // ✅ Mostrar indicador mientras se geocodifica
        setCargandoDireccion(true);
        const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
        setCargandoDireccion(false);

        if (direccionObtenida) {
            setDireccion(direccionObtenida);
        } else {
            // ✅ Si falla el geocoding, mostrar mensaje claro
            // NO usar coordenadas crudas como fallback
            console.warn('⚠️ [Mapa] No se pudo obtener la dirección, manteniendo la anterior');
            // Dejar la dirección anterior o limpiarla
            // setDireccion('');  // 👈 Descomentar si querés limpiar
        }
    };

    // ✅ Confirmar ubicación
    const handleConfirmar = () => {
        if (!ubicacionSeleccionada) return;

        // ✅ Si no hay dirección válida, NO confirmar
        if (!direccion || direccion.includes(', -') || direccion.match(/^-?\d+\.\d+, -?\d+\.\d+$/)) {
            Alert.alert(
                'Dirección no disponible',
                'No pudimos obtener la dirección de esta ubicación. Por favor:\n\n' +
                '1. Verificá que la app tenga permisos de ubicación\n' +
                '2. Tocá de nuevo el mapa o arrastrá el marcador\n' +
                '3. Esperá unos segundos a que aparezca la dirección',
                [{ text: 'Entendido' }]
            );
            return;
        }

        onConfirmar({
            latitude: ubicacionSeleccionada.latitude,
            longitude: ubicacionSeleccionada.longitude,
            direccion: direccion,
        });
    };

    // ✅ Prevenir que el modal se cierre al tocar fuera
    const handleClose = () => {
        if (!buscando) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <View style={estilos.contenedor}>
                {/* ✅ HEADER */}
                <View style={estilos.header}>
                    <TouchableOpacity
                        style={estilos.botonVolver}
                        onPress={handleClose}
                        activeOpacity={0.7}
                        disabled={buscando}
                    >
                        <Ionicons name="arrow-back" size={28} color={Colores.textoClaro} />
                    </TouchableOpacity>

                    {/* ✅ Buscador */}
                    <View style={estilos.buscadorContainer}>
                        <Ionicons name="search" size={20} color={Colores.textoGris} />
                        <TextInput
                            style={estilos.buscadorInput}
                            placeholder="Buscar dirección..."
                            placeholderTextColor={Colores.textoGris + '60'}
                            value={busquedaManual}
                            onChangeText={setBusquedaManual}
                            onSubmitEditing={buscarDireccionManual}
                            returnKeyType="search"
                            autoCapitalize="words"
                            editable={!buscando}
                        />
                        {busquedaManual.length > 0 && !buscando && (
                            <TouchableOpacity
                                onPress={() => setBusquedaManual('')}
                                style={estilos.botonLimpiar}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle" size={20} color={Colores.textoGris} />
                            </TouchableOpacity>
                        )}
                        {buscando && (
                            <ActivityIndicator size="small" color={Colores.bartNaranja} />
                        )}
                    </View>

                    <TouchableOpacity
                        style={estilos.botonConfirmar}
                        onPress={handleConfirmar}
                        activeOpacity={0.7}
                        disabled={buscando || cargandoDireccion}
                    >
                        <LinearGradient
                            colors={[Colores.bartNaranja, Colores.bartAzul]}
                            style={estilos.botonConfirmarGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={estilos.botonConfirmarTexto}>✅ Listo</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ✅ MAPA */}
                <MapView
                    ref={mapRef}
                    style={estilos.mapa}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: ubicacionSeleccionada.latitude,
                        longitude: ubicacionSeleccionada.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    onPress={seleccionarUbicacion}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                >
                    {ubicacionSeleccionada && (
                        <Marker
                            coordinate={ubicacionSeleccionada}
                            draggable
                            onDragEnd={seleccionarUbicacion}
                        >
                            <MarcadorPersonalizado
                                color={Colores.bartNaranja}
                                size="normal"
                            />
                        </Marker>
                    )}
                </MapView>

                {/* ✅ FOOTER */}
                <View style={estilos.footer}>
                    <View style={estilos.footerInfo}>
                        <Ionicons name="location" size={20} color={Colores.bartNaranja} />
                        {cargandoDireccion ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ActivityIndicator size="small" color={Colores.bartNaranja} />
                                <Text style={estilos.footerDireccion} numberOfLines={2}>
                                    Obteniendo dirección...
                                </Text>
                            </View>
                        ) : (
                            <Text style={estilos.footerDireccion} numberOfLines={2}>
                                {direccion || 'Selecciona una ubicación en el mapa'}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={estilos.botonMiUbicacion}
                        onPress={obtenerUbicacionActual}
                        activeOpacity={0.7}
                        disabled={cargandoUbicacion || buscando}
                    >
                        {cargandoUbicacion ? (
                            <ActivityIndicator size="small" color={Colores.bartNaranja} />
                        ) : (
                            <Ionicons name="locate" size={24} color={Colores.bartNaranja} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* ✅ INSTRUCCIONES */}
                <View style={estilos.instrucciones}>
                    <Text style={estilos.instruccionesTexto}>
                        👆 Toca el mapa o arrastra el marcador para seleccionar tu ubicación
                    </Text>
                </View>
            </View>
        </Modal>
    );
}