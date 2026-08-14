// screens/cliente/PantallaPerfil.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, useWindowDimensions, Animated, RefreshControl,
  Dimensions, TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { notificacionService } from '../../services/notificacionService';
import { Colores } from '../../lib/colores';

const { width, height } = Dimensions.get('window');

export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion, actualizarPerfil } = tiendaAutenticacion();
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

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

  const { width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    React.useCallback(() => {
      const contarNotificaciones = async () => {
        if (!perfil?.id) return;
        const data = await notificacionService.obtenerNotificaciones(perfil.id, true);
        setNotificacionesNoLeidas(data.length);
      };
      contarNotificaciones();
    }, [perfil?.id])
  );

  useEffect(() => {
    if (perfil?.id) {
      cargarTotalPedidos();
      cargarDatosPerfil();
      if (perfil.avatar_url) {
        setImagenPerfil(perfil.avatar_url);
      }
    }
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
  }, [perfil]);

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
    }
  };

  const cargarTotalPedidos = async () => {
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('id_de_usuario', perfil?.id);
    setTotalPedidos(count || 0);
  };

  const manejarRefresh = async () => {
    setRefrescando(true);
    await cargarTotalPedidos();
    cargarDatosPerfil();
    setRefrescando(false);
  };

  const actualizarDatosPerfil = async () => {
    if (!perfil?.id) return;

    setCargandoActualizacion(true);
    try {
      const datosActualizados = {
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
      };

      const { error } = await supabase
        .from('perfiles')
        .update(datosActualizados)
        .eq('id', perfil.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
        return;
      }

      await actualizarPerfil({ ...perfil, ...datosActualizados });

      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setModoEdicion(false);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setCargandoActualizacion(false);
    }
  };

  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para cambiar la foto de perfil');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar una foto');
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
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const subirImagenPerfil = async (uri: string) => {
    if (!perfil?.id) {
      console.log('❌ No hay usuario logueado');
      Alert.alert('Error', 'Debes iniciar sesión para cambiar la foto');
      return;
    }

    setSubiendoImagen(true);
    console.log('📷 Iniciando subida de imagen para usuario:', perfil.id);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('📷 Blob obtenido, tamaño:', blob.size, 'bytes');

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${perfil.id}.${fileExt}`;
      console.log('📷 Nombre de archivo:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Error en upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Imagen subida exitosamente:', data);

      const { data: urlData } = supabase.storage
        .from('perfiles')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('📷 URL pública:', publicUrl);

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError);
        throw updateError;
      }

      await actualizarPerfil({ ...perfil, avatar_url: publicUrl });
      setImagenPerfil(publicUrl);

      console.log('✅ Foto de perfil actualizada correctamente');
      Alert.alert('✅ Éxito', 'Foto de perfil actualizada correctamente');
    } catch (error: any) {
      console.error('❌ Error subiendo imagen:', error);
      Alert.alert('Error', `No se pudo subir la imagen: ${error.message || 'Error desconocido'}`);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const mostrarOpcionesFoto = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Selecciona una opción',
      [
        { text: '📷 Tomar foto', onPress: tomarFoto },
        { text: '🖼️ Elegir de galería', onPress: seleccionarImagen },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const confirmarCerrarSesion = async () => {
    setMostrarModal(false);
    try {
      await cerrarSesion();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navegarALogin = () => {
    props.navigation.navigate('Login');
  };

  const obtenerDireccionCompleta = () => {
    const partes = [];
    if (direccionCalle) partes.push(direccionCalle);
    if (direccionNumero) partes.push(direccionNumero);
    if (direccionPiso) partes.push(`Piso ${direccionPiso}`);
    if (direccionDepartamento) partes.push(`Depto ${direccionDepartamento}`);
    if (direccionBarrio) partes.push(direccionBarrio);
    if (direccionCiudad) partes.push(direccionCiudad);
    if (direccionCodigoPostal) partes.push(`CP ${direccionCodigoPostal}`);
    return partes.length > 0 ? partes.join(', ') : 'No especificada';
  };

  const nivelCliente = (puntos: number) => {
    if (puntos >= 5000) return { icono: '💎', nombre: 'Platino', color: Colores.platino, bg: Colores.platino + '20' };
    if (puntos >= 1500) return { icono: '👑', nombre: 'Oro', color: Colores.oro, bg: Colores.oro + '20' };
    if (puntos >= 500) return { icono: '🥈', nombre: 'Plata', color: Colores.plata, bg: Colores.plata + '20' };
    return { icono: '🥉', nombre: 'Bronce', color: Colores.bronce, bg: Colores.bronce + '20' };
  };

  const nivel = nivelCliente(perfil?.puntos_acumulados || 0);

  const isTablet = winWidth >= 768;
  const isSmallPhone = winWidth < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const paddingBottom = insets.bottom + 20;
  const avatarSize = isTablet ? 100 : isSmallPhone ? 70 : 80;
  const nombreSize = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const correoSize = isTablet ? 17 : isSmallPhone ? 12 : 14;
  const statValorSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const statLabelSize = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const menuTextSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const labelSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const inputSize = isTablet ? 16 : isSmallPhone ? 14 : 15;

  const menuItems = [
    {
      id: 'pedidos',
      label: 'Mis Pedidos',
      icono: 'receipt-outline',
      color: Colores.margeVerde,
      navigate: 'Pedidos',
      show: true
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: Colores.margeRosa,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true
    },
  ];

  return (
    <View style={estilos.contenedor}>
      {/* 💛 GRADIENTE MARGE: Verde → Rosa */}
      <LinearGradient
        colors={[Colores.margeVerde, Colores.margeRosa]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scrollContent,
          {
            paddingBottom: paddingBottom,
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={Colores.margeRosa}
            colors={[Colores.margeRosa]}
          />
        }
      >
        <Animated.View style={[
          estilos.encabezado,
          {
            paddingHorizontal: paddingHorizontal,
            paddingTop: insets.top + (isTablet ? 30 : 20),
            paddingBottom: isTablet ? 24 : 16,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }
        ]}>
          <TouchableOpacity
            onPress={perfil?.id ? mostrarOpcionesFoto : undefined}
            activeOpacity={0.8}
            disabled={!perfil?.id}
          >
            <View style={[
              estilos.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: Colores.margeRosa + '20',
                borderColor: Colores.margeRosa + '40',
              }
            ]}>
              {imagenPerfil ? (
                <Image
                  source={{ uri: imagenPerfil }}
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  }}
                />
              ) : (
                <Text style={[estilos.avatarEmoji, { fontSize: isTablet ? 50 : isSmallPhone ? 32 : 40 }]}>
                  {perfil?.nombre_cliente?.charAt(0)?.toUpperCase() || '🍔'}
                </Text>
              )}
              {perfil?.id && (
                <View style={estilos.camaraIcon}>
                  <Ionicons name="camera" size={isTablet ? 18 : 14} color={Colores.textoClaro} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {subiendoImagen && (
            <View style={estilos.subiendoImagen}>
              <ActivityIndicator size="small" color={Colores.margeRosa} />
              <Text style={estilos.subiendoImagenTexto}>Subiendo imagen...</Text>
            </View>
          )}

          <Text style={[estilos.nombre, { fontSize: nombreSize, color: Colores.textoClaro }]}>
            {perfil?.nombre_cliente || 'Invitado'}
          </Text>

          <Text style={[estilos.correo, { fontSize: correoSize, color: Colores.textoClaro + '70' }]}>
            {perfil?.email || 'Inicia sesión para ver tus datos'}
          </Text>

          {perfil?.id ? (
            <>
              <View style={estilos.puntos}>
                <LinearGradient
                  colors={[Colores.margeRosa, Colores.margeAzul]}
                  style={estilos.puntosGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={estilos.puntosIcono}>⭐</Text>
                  <Text style={[estilos.puntosTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                    {perfil?.puntos_acumulados || 0} Krusty Points
                  </Text>
                </LinearGradient>
              </View>

              <View style={[
                estilos.nivel,
                {
                  backgroundColor: nivel.bg,
                  paddingHorizontal: isTablet ? 20 : isSmallPhone ? 12 : 16,
                  paddingVertical: isTablet ? 8 : isSmallPhone ? 5 : 6,
                  borderRadius: isTablet ? 24 : isSmallPhone ? 14 : 18,
                }
              ]}>
                <Text style={[estilos.nivelTexto, {
                  color: nivel.color,
                  fontSize: isTablet ? 17 : isSmallPhone ? 13 : 15,
                }]}>
                  {nivel.icono} Nivel {nivel.nombre}
                </Text>
              </View>

              <View style={estilos.stats}>
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: statValorSize, color: Colores.textoClaro }]}>{totalPedidos}</Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize, color: Colores.textoClaro + '50' }]}>Pedidos</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: statValorSize, color: Colores.textoClaro }]}>{perfil?.puntos_acumulados || 0}</Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize, color: Colores.textoClaro + '50' }]}>Puntos</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: statValorSize, color: Colores.textoClaro }]}>
                    {perfil?.ultimo_acceso
                      ? new Date(perfil.ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                      : '---'}
                  </Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize, color: Colores.textoClaro + '50' }]}>Último acceso</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={estilos.mensajeInvitado}>
              <Ionicons name="person-outline" size={isTablet ? 50 : 40} color={Colores.textoClaro + '50'} />
              <Text style={[estilos.textoInvitado, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: Colores.textoClaro }]}>
                Estás viendo como invitado
              </Text>
              <Text style={[estilos.textoInvitadoSub, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: Colores.textoClaro + '60' }]}>
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>
            </View>
          )}
        </Animated.View>

        {perfil?.id && (
          <Animated.View style={[
            estilos.seccionInfo,
            {
              paddingHorizontal: paddingHorizontal,
              marginTop: 16,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }
          ]}>
            <TouchableOpacity
              style={[
                estilos.botonEditar,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  alignSelf: 'flex-end',
                  marginBottom: 12,
                  backgroundColor: modoEdicion ? Colores.margeVerde + '20' : Colores.margeRosa + '20',
                  borderColor: modoEdicion ? Colores.margeVerde + '30' : Colores.margeRosa + '30',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setModoEdicion(!modoEdicion)}
              activeOpacity={0.7}
            >
              <Text style={[
                estilos.botonEditarTexto,
                {
                  color: modoEdicion ? Colores.margeVerde : Colores.margeRosa,
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  fontWeight: '600',
                }
              ]}>
                {modoEdicion ? '✖ Cerrar edición' : '✏️ Editar perfil'}
              </Text>
            </TouchableOpacity>

            <View style={[
              estilos.cardInfo,
              {
                backgroundColor: Colores.textoOscuro + '40',
                borderRadius: isTablet ? 20 : isSmallPhone ? 12 : 16,
                padding: isTablet ? 24 : isSmallPhone ? 14 : 18,
                borderWidth: 1,
                borderColor: Colores.textoClaro + '8',
              }
            ]}>
              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="call-outline" size={isTablet ? 20 : 18} color={Colores.margeRosa} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8, color: Colores.textoClaro }]}>Teléfono</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize, color: Colores.textoClaro }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 11 1234-5678"
                    placeholderTextColor={Colores.textoClaro + '40'}
                    keyboardType="phone-pad"
                    selectionColor={Colores.margeRosa}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize, color: Colores.textoClaro + '70' }]}>
                    {telefono || 'No especificado'}
                  </Text>
                )}
              </View>

              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="location-outline" size={isTablet ? 20 : 18} color={Colores.margeRosa} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8, color: Colores.textoClaro }]}>Dirección</Text>
                </View>
                {modoEdicion ? (
                  <>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionCalle}
                        onChangeText={setDireccionCalle}
                        placeholder="Calle"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        selectionColor={Colores.margeRosa}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputSmall, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionNumero}
                        onChangeText={setDireccionNumero}
                        placeholder="N°"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        keyboardType="numeric"
                        selectionColor={Colores.margeRosa}
                      />
                    </View>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionPiso}
                        onChangeText={setDireccionPiso}
                        placeholder="Piso (opcional)"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        selectionColor={Colores.margeRosa}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionDepartamento}
                        onChangeText={setDireccionDepartamento}
                        placeholder="Depto (opcional)"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        selectionColor={Colores.margeRosa}
                      />
                    </View>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionBarrio}
                        onChangeText={setDireccionBarrio}
                        placeholder="Barrio"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        selectionColor={Colores.margeRosa}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize, color: Colores.textoClaro }]}
                        value={direccionCiudad}
                        onChangeText={setDireccionCiudad}
                        placeholder="Ciudad"
                        placeholderTextColor={Colores.textoClaro + '40'}
                        selectionColor={Colores.margeRosa}
                      />
                    </View>
                    <TextInput
                      style={[estilos.input, { fontSize: inputSize, color: Colores.textoClaro }]}
                      value={direccionCodigoPostal}
                      onChangeText={setDireccionCodigoPostal}
                      placeholder="Código Postal"
                      placeholderTextColor={Colores.textoClaro + '40'}
                      keyboardType="numeric"
                      selectionColor={Colores.margeRosa}
                    />
                  </>
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize, color: Colores.textoClaro + '70' }]}>
                    {obtenerDireccionCompleta()}
                  </Text>
                )}
              </View>

              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="restaurant-outline" size={isTablet ? 20 : 18} color={Colores.margeRosa} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8, color: Colores.textoClaro }]}>Preferencias alimentarias</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize, color: Colores.textoClaro }]}
                    value={preferenciasComida}
                    onChangeText={setPreferenciasComida}
                    placeholder="Ej: Sin gluten, Vegano, etc."
                    placeholderTextColor={Colores.textoClaro + '40'}
                    selectionColor={Colores.margeRosa}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize, color: Colores.textoClaro + '70' }]}>
                    {preferenciasComida || 'No especificadas'}
                  </Text>
                )}
              </View>

              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="card-outline" size={isTablet ? 20 : 18} color={Colores.margeRosa} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8, color: Colores.textoClaro }]}>Método de pago preferido</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize, color: Colores.textoClaro }]}
                    value={metodoPago}
                    onChangeText={setMetodoPago}
                    placeholder="Ej: Tarjeta de crédito, Efectivo, Mercado Pago"
                    placeholderTextColor={Colores.textoClaro + '40'}
                    selectionColor={Colores.margeRosa}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize, color: Colores.textoClaro + '70' }]}>
                    {metodoPago || 'No especificado'}
                  </Text>
                )}
              </View>

              {modoEdicion && (
                <TouchableOpacity
                  style={[
                    estilos.botonGuardar,
                    {
                      marginTop: 16,
                      paddingVertical: isTablet ? 14 : isSmallPhone ? 10 : 12,
                      borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                      backgroundColor: Colores.margeRosa,
                    }
                  ]}
                  onPress={actualizarDatosPerfil}
                  disabled={cargandoActualizacion}
                  activeOpacity={0.7}
                >
                  {cargandoActualizacion ? (
                    <ActivityIndicator size="small" color={Colores.textoOscuro} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={isTablet ? 22 : 18} color={Colores.textoOscuro} />
                      <Text style={[estilos.botonGuardarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                        Guardar cambios
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        <Animated.View style={[
          estilos.menu,
          {
            paddingHorizontal: paddingHorizontal,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
            marginTop: isTablet ? 8 : 4,
          }
        ]}>
          {!perfil?.id && (
            <TouchableOpacity
              style={[estilos.menuItem, estilos.menuLogin, {
                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                borderWidth: 2,
                borderColor: Colores.margeRosa,
              }]}
              onPress={navegarALogin}
              activeOpacity={0.7}
            >
              <Ionicons name="log-in-outline" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={Colores.margeRosa} />
              <Text style={[estilos.menuTexto, {
                color: Colores.margeRosa,
                fontWeight: 'bold',
                fontSize: menuTextSize,
                marginLeft: 12,
                flex: 1,
              }]}>
                Iniciar Sesión
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={Colores.textoClaro + '40'} />
            </TouchableOpacity>
          )}

          {perfil?.id && (
            <TouchableOpacity
              style={[estilos.menuItem, {
                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                backgroundColor: Colores.textoOscuro + '40',
                borderColor: Colores.textoClaro + '5',
                marginBottom: 8,
              }]}
              onPress={() => props.navigation.navigate('NotificacionesUsuario')}
              activeOpacity={0.7}
            >
              <View style={estilos.menuItemLeft}>
                <Ionicons name="notifications-outline" size={isTablet ? 26 : isSmallPhone ? 20 : 24} color={Colores.margeRosa} />
                <Text style={[estilos.menuTexto, { fontSize: menuTextSize, marginLeft: 12, color: Colores.textoClaro }]}>
                  Notificaciones
                </Text>
              </View>
              <View style={estilos.menuItemRight}>
                {notificacionesNoLeidas > 0 && (
                  <View style={estilos.badgeNotificaciones}>
                    <Text style={[estilos.badgeNotificacionesTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 9 : 10 }]}>
                      {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={Colores.textoClaro + '40'} />
              </View>
            </TouchableOpacity>
          )}

          {menuItems.map((item, index) => {
            if (!item.show) return null;
            return (
              <TouchableOpacity
                key={item.id}
                style={[estilos.menuItem, {
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                  backgroundColor: Colores.textoOscuro + '40',
                  borderColor: Colores.textoClaro + '5',
                  marginBottom: 8,
                }]}
                onPress={() => props.navigation.navigate(item.navigate)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icono as any} size={isTablet ? 26 : isSmallPhone ? 20 : 24} color={item.color} />
                <Text style={[estilos.menuTexto, {
                  fontSize: menuTextSize,
                  marginLeft: 12,
                  flex: 1,
                  color: Colores.textoClaro,
                }]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={[estilos.menuValor, {
                    fontSize: isTablet ? 13 : isSmallPhone ? 10 : 12,
                    marginRight: 8,
                    color: Colores.margeRosa,
                  }]}>
                    {item.subtitle}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={Colores.textoClaro + '40'} />
              </TouchableOpacity>
            );
          })}

          {perfil?.id && (
            <TouchableOpacity
              style={[estilos.menuItem, estilos.menuCerrar, {
                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                marginTop: 8,
                backgroundColor: Colores.secundario + '10',
                borderColor: Colores.secundario + '20',
              }]}
              onPress={() => setMostrarModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={isTablet ? 26 : isSmallPhone ? 20 : 24} color={Colores.secundario} />
              <Text style={[estilos.menuTexto, {
                color: Colores.secundario,
                fontSize: menuTextSize,
                marginLeft: 12,
              }]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={[
            estilos.modal,
            {
              padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
              borderRadius: isTablet ? 28 : 24,
              borderColor: Colores.secundario + '40',
              width: isTablet ? '60%' : '85%',
            }
          ]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>🚪</Text>
            <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22, color: Colores.textoClaro }]}>
              Cerrar Sesión
            </Text>
            <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: Colores.textoGris }]}>
              ¿Estás seguro de que quieres salir?
            </Text>
            <View style={estilos.modalBotones}>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalCancelar, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                }]}
                onPress={() => setMostrarModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[estilos.modalCancelarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.modalBoton, estilos.modalConfirmar, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                  borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                  overflow: 'hidden',
                }]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[Colores.secundario, Colores.secundarioOscuro]}
                  style={estilos.modalConfirmarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={Colores.textoClaro} />
                  <Text style={[estilos.modalConfirmarTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
                    Cerrar Sesión
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  scrollContent: {
    flexGrow: 1,
  },
  encabezado: {
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 12,
    shadowColor: Colores.margeRosa,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontWeight: 'bold',
    color: Colores.margeRosa,
  },
  camaraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colores.margeRosa,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Colores.textoOscuro,
  },
  subiendoImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: Colores.textoOscuro + '60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subiendoImagenTexto: {
    color: Colores.margeRosa,
    fontSize: 12,
  },
  nombre: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  correo: {
    marginTop: 4,
  },
  puntos: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colores.margeRosa,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  puntosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  puntosIcono: {
    fontSize: 16,
  },
  puntosTexto: {
    fontWeight: 'bold',
    color: Colores.textoOscuro,
  },
  nivel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  nivelTexto: {
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 10,
    backgroundColor: Colores.textoOscuro + '30',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '5',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colores.textoClaro + '10',
  },
  statValor: {
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
  },
  mensajeInvitado: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  textoInvitado: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  textoInvitadoSub: {
    textAlign: 'center',
    marginTop: 4,
  },
  seccionInfo: {
    marginBottom: 8,
  },
  botonEditar: {
    alignSelf: 'flex-end',
    borderWidth: 1,
  },
  botonEditarTexto: {
    fontWeight: '600',
  },
  cardInfo: {
    borderWidth: 1,
  },
  campo: {
    marginBottom: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
  },
  valor: {
    paddingVertical: 6,
  },
  input: {
    backgroundColor: Colores.textoOscuro + '40',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  inputFlex: {
    flex: 1,
  },
  inputSmall: {
    width: '30%',
  },
  filaInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonGuardarTexto: {
    fontWeight: 'bold',
    color: Colores.textoOscuro,
  },
  menu: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuTexto: {
    fontWeight: '500',
  },
  menuValor: {
    fontWeight: '600',
  },
  menuLogin: {
    backgroundColor: Colores.margeRosa + '10',
  },
  menuCerrar: {
    borderWidth: 1,
  },
  badgeNotificaciones: {
    backgroundColor: Colores.secundario,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNotificacionesTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
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
    marginBottom: 24,
  },
  modalBotones: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBoton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalCancelar: {
    backgroundColor: Colores.textoOscuro + '50',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  modalCancelarTexto: {
    color: Colores.textoClaro,
    fontWeight: '600',
  },
  modalConfirmar: {
    overflow: 'hidden',
  },
  modalConfirmarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    height: '100%',
  },
  modalConfirmarTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
  },
});