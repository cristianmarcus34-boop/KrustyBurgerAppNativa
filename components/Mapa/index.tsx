// components/Mapa/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
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
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        if (ubicacionInicial) {
            setUbicacionSeleccionada(ubicacionInicial);
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: ubicacionInicial.latitude,
                    longitude: ubicacionInicial.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 500);
            }
        }
    }, [ubicacionInicial]);

    // ✅ Obtener dirección desde coordenadas
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

    // ✅ Obtener ubicación actual
    const obtenerUbicacionActual = async () => {
        setCargandoUbicacion(true);
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
                    setDireccion(direccionObtenida);
                }

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 500);
                }
            }
        } catch (error) {
            console.log('Error obteniendo ubicación:', error);
        } finally {
            setCargandoUbicacion(false);
        }
    };

    // ✅ Buscar dirección manual
    const buscarDireccionManual = async () => {
        if (busquedaManual.length < 3) return;

        setBuscando(true);
        try {
            const resultados = await Location.geocodeAsync(busquedaManual);
            if (resultados && resultados.length > 0) {
                const { latitude, longitude } = resultados[0];
                setUbicacionSeleccionada({ latitude, longitude });

                const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
                if (direccionObtenida) {
                    setDireccion(direccionObtenida);
                }

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }
                setBusquedaManual('');
            }
        } catch (error) {
            console.log('Error buscando dirección:', error);
        } finally {
            setBuscando(false);
        }
    };

    // ✅ Seleccionar ubicación en el mapa
    const seleccionarUbicacion = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setUbicacionSeleccionada({ latitude, longitude });

        const direccionObtenida = await obtenerDireccionDesdeCoordenadas(latitude, longitude);
        if (direccionObtenida) {
            setDireccion(direccionObtenida);
        }
    };

    // ✅ Confirmar ubicación
    const handleConfirmar = () => {
        if (ubicacionSeleccionada) {
            onConfirmar({
                latitude: ubicacionSeleccionada.latitude,
                longitude: ubicacionSeleccionada.longitude,
                direccion: direccion || `${ubicacionSeleccionada.latitude}, ${ubicacionSeleccionada.longitude}`,
            });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={estilos.contenedor}>
                {/* ✅ HEADER */}
                <View style={estilos.header}>
                    <TouchableOpacity
                        style={estilos.botonVolver}
                        onPress={onClose}
                        activeOpacity={0.7}
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
                        />
                        {buscando && (
                            <ActivityIndicator size="small" color={Colores.bartNaranja} />
                        )}
                    </View>

                    <TouchableOpacity
                        style={estilos.botonConfirmar}
                        onPress={handleConfirmar}
                        activeOpacity={0.7}
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
                        <Text style={estilos.footerDireccion} numberOfLines={2}>
                            {direccion || 'Selecciona una ubicación en el mapa'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={estilos.botonMiUbicacion}
                        onPress={obtenerUbicacionActual}
                        activeOpacity={0.7}
                        disabled={cargandoUbicacion}
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