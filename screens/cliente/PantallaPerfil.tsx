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

  // ✅ Estados del formulario de edición
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

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ✅ CONTAR NOTIFICACIONES NO LEÍDAS CADA VEZ QUE LA PANTALLA OBTIENE FOCO
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

  // ✅ Actualizar perfil
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

  // ✅ SELECCIONAR IMAGEN DE PERFIL
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
      // 1. Obtener el blob de la imagen
      console.log('📷 Obteniendo blob de la imagen...');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('📷 Blob obtenido, tamaño:', blob.size, 'bytes');

      // 2. Generar nombre único
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${perfil.id}.${fileExt}`; // 👈 SIN timestamp
      console.log('📷 Nombre de archivo:', fileName);

      // 3. USAR EL ENDPOINT DE SUBIDA CON LA RUTA CORRECTA
      console.log('📷 Subiendo a Supabase Storage...');

      // ✅ PRIMERO: Verificar si ya existe una imagen y eliminarla (opcional)
      // const { data: listData } = await supabase.storage
      //   .from('perfiles')
      //   .list('', { limit: 10 });

      // // Si existe una imagen con el mismo nombre, eliminarla
      // if (listData?.some(f => f.name === fileName)) {
      //   await supabase.storage.from('perfiles').remove([fileName]);
      // }

      // ✅ SEGUNDO: Subir la nueva imagen
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

      // 4. Obtener URL pública
      console.log('📷 Obteniendo URL pública...');
      const { data: urlData } = supabase.storage
        .from('perfiles')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('📷 URL pública:', publicUrl);

      // 5. Guardar URL en perfil
      console.log('📷 Guardando URL en perfil...');
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError);
        throw updateError;
      }

      // 6. Actualizar el store
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
    if (puntos >= 5000) return { icono: '💎', nombre: 'Platino', color: '#E5E4E2', bg: '#E5E4E2' + '20' };
    if (puntos >= 1500) return { icono: '👑', nombre: 'Oro', color: '#FFD700', bg: '#FFD700' + '20' };
    if (puntos >= 500) return { icono: '🥈', nombre: 'Plata', color: '#C0C0C0', bg: '#C0C0C0' + '20' };
    return { icono: '🥉', nombre: 'Bronce', color: '#CD7F32', bg: '#CD7F32' + '20' };
  };

  const nivel = nivelCliente(perfil?.puntos_acumulados || 0);

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

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
      color: COLORS.blanco,
      navigate: 'Pedidos',
      show: true
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: COLORS.amarillo,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true
    },
    {
      id: 'direcciones',
      label: 'Direcciones',
      icono: 'location-outline',
      color: COLORS.blanco,
      show: false
    },
    {
      id: 'pagos',
      label: 'Métodos de pago',
      icono: 'card-outline',
      color: COLORS.blanco,
      show: false
    },
    {
      id: 'ofertas',
      label: 'Ofertas para vos',
      icono: 'gift-outline',
      color: COLORS.verdeClaro,
      show: false
    },
    {
      id: 'acerca',
      label: 'Acerca de Krusty Burger',
      icono: 'information-circle-outline',
      color: COLORS.blanco,
      show: false
    },
  ];

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
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
            tintColor={COLORS.amarillo}
            colors={[COLORS.amarillo]}
          />
        }
      >
        {/* ✅ ENCABEZADO CON AVATAR - CON FOTO DE PERFIL */}
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
                backgroundColor: COLORS.amarillo + '20',
                borderColor: COLORS.amarillo + '40',
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
                  <Ionicons name="camera" size={isTablet ? 18 : 14} color={COLORS.blanco} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {subiendoImagen && (
            <View style={estilos.subiendoImagen}>
              <ActivityIndicator size="small" color={COLORS.amarillo} />
              <Text style={estilos.subiendoImagenTexto}>Subiendo imagen...</Text>
            </View>
          )}

          <Text style={[estilos.nombre, { fontSize: nombreSize }]}>
            {perfil?.nombre_cliente || 'Invitado'}
          </Text>

          <Text style={[estilos.correo, { fontSize: correoSize }]}>
            {perfil?.email || 'Inicia sesión para ver tus datos'}
          </Text>

          {perfil?.id ? (
            <>
              <View style={estilos.puntos}>
                <LinearGradient
                  colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
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
                  <Text style={[estilos.statValor, { fontSize: statValorSize }]}>{totalPedidos}</Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Pedidos</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: statValorSize }]}>{perfil?.puntos_acumulados || 0}</Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Puntos</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValor, { fontSize: statValorSize }]}>
                    {perfil?.ultimo_acceso
                      ? new Date(perfil.ultimo_acceso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                      : '---'}
                  </Text>
                  <Text style={[estilos.statLabel, { fontSize: statLabelSize }]}>Último acceso</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={estilos.mensajeInvitado}>
              <Ionicons name="person-outline" size={isTablet ? 50 : 40} color={COLORS.grisClaro + '50'} />
              <Text style={[estilos.textoInvitado, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                Estás viendo como invitado
              </Text>
              <Text style={[estilos.textoInvitadoSub, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ✅ SECCIÓN DE INFORMACIÓN PERSONAL (SOLO USUARIOS LOGUEADOS) */}
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
                  backgroundColor: modoEdicion ? COLORS.verdeClaro + '20' : COLORS.amarillo + '20',
                  borderColor: modoEdicion ? COLORS.verdeClaro + '30' : COLORS.amarillo + '30',
                  borderWidth: 1,
                }
              ]}
              onPress={() => setModoEdicion(!modoEdicion)}
              activeOpacity={0.7}
            >
              <Text style={[
                estilos.botonEditarTexto,
                {
                  color: modoEdicion ? COLORS.verdeClaro : COLORS.amarillo,
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
                backgroundColor: COLORS.negro + '40',
                borderRadius: isTablet ? 20 : isSmallPhone ? 12 : 16,
                padding: isTablet ? 24 : isSmallPhone ? 14 : 18,
                borderWidth: 1,
                borderColor: COLORS.blanco + '8',
              }
            ]}>
              {/* Teléfono */}
              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="call-outline" size={isTablet ? 20 : 18} color={COLORS.amarillo} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8 }]}>Teléfono</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 11 1234-5678"
                    placeholderTextColor={COLORS.grisClaro + '60'}
                    keyboardType="phone-pad"
                    selectionColor={COLORS.amarillo}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize }]}>
                    {telefono || 'No especificado'}
                  </Text>
                )}
              </View>

              {/* Dirección */}
              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="location-outline" size={isTablet ? 20 : 18} color={COLORS.amarillo} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8 }]}>Dirección</Text>
                </View>
                {modoEdicion ? (
                  <>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize }]}
                        value={direccionCalle}
                        onChangeText={setDireccionCalle}
                        placeholder="Calle"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        selectionColor={COLORS.amarillo}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputSmall, { fontSize: inputSize }]}
                        value={direccionNumero}
                        onChangeText={setDireccionNumero}
                        placeholder="N°"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        keyboardType="numeric"
                        selectionColor={COLORS.amarillo}
                      />
                    </View>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize }]}
                        value={direccionPiso}
                        onChangeText={setDireccionPiso}
                        placeholder="Piso (opcional)"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        selectionColor={COLORS.amarillo}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize }]}
                        value={direccionDepartamento}
                        onChangeText={setDireccionDepartamento}
                        placeholder="Depto (opcional)"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        selectionColor={COLORS.amarillo}
                      />
                    </View>
                    <View style={estilos.filaInputs}>
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize }]}
                        value={direccionBarrio}
                        onChangeText={setDireccionBarrio}
                        placeholder="Barrio"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        selectionColor={COLORS.amarillo}
                      />
                      <TextInput
                        style={[estilos.input, estilos.inputFlex, { fontSize: inputSize }]}
                        value={direccionCiudad}
                        onChangeText={setDireccionCiudad}
                        placeholder="Ciudad"
                        placeholderTextColor={COLORS.grisClaro + '60'}
                        selectionColor={COLORS.amarillo}
                      />
                    </View>
                    <TextInput
                      style={[estilos.input, { fontSize: inputSize }]}
                      value={direccionCodigoPostal}
                      onChangeText={setDireccionCodigoPostal}
                      placeholder="Código Postal"
                      placeholderTextColor={COLORS.grisClaro + '60'}
                      keyboardType="numeric"
                      selectionColor={COLORS.amarillo}
                    />
                  </>
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize }]}>
                    {obtenerDireccionCompleta()}
                  </Text>
                )}
              </View>

              {/* Preferencias alimentarias */}
              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="restaurant-outline" size={isTablet ? 20 : 18} color={COLORS.amarillo} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8 }]}>Preferencias alimentarias</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={preferenciasComida}
                    onChangeText={setPreferenciasComida}
                    placeholder="Ej: Sin gluten, Vegano, etc."
                    placeholderTextColor={COLORS.grisClaro + '60'}
                    selectionColor={COLORS.amarillo}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize }]}>
                    {preferenciasComida || 'No especificadas'}
                  </Text>
                )}
              </View>

              {/* Método de pago preferido */}
              <View style={estilos.campo}>
                <View style={estilos.labelContainer}>
                  <Ionicons name="card-outline" size={isTablet ? 20 : 18} color={COLORS.amarillo} />
                  <Text style={[estilos.label, { fontSize: labelSize, marginLeft: 8 }]}>Método de pago preferido</Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[estilos.input, { fontSize: inputSize }]}
                    value={metodoPago}
                    onChangeText={setMetodoPago}
                    placeholder="Ej: Tarjeta de crédito, Efectivo, Mercado Pago"
                    placeholderTextColor={COLORS.grisClaro + '60'}
                    selectionColor={COLORS.amarillo}
                  />
                ) : (
                  <Text style={[estilos.valor, { fontSize: inputSize }]}>
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
                      backgroundColor: COLORS.amarillo,
                    }
                  ]}
                  onPress={actualizarDatosPerfil}
                  disabled={cargandoActualizacion}
                  activeOpacity={0.7}
                >
                  {cargandoActualizacion ? (
                    <ActivityIndicator size="small" color={COLORS.negro} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={isTablet ? 22 : 18} color={COLORS.negro} />
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

        {/* ✅ MENÚ */}
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
                borderColor: COLORS.amarillo,
              }]}
              onPress={navegarALogin}
              activeOpacity={0.7}
            >
              <Ionicons name="log-in-outline" size={isTablet ? 28 : isSmallPhone ? 20 : 24} color={COLORS.amarillo} />
              <Text style={[estilos.menuTexto, {
                color: COLORS.amarillo,
                fontWeight: 'bold',
                fontSize: menuTextSize,
                marginLeft: 12,
                flex: 1,
              }]}>
                Iniciar Sesión
              </Text>
              <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={COLORS.grisClaro} />
            </TouchableOpacity>
          )}

          {perfil?.id && (
            <TouchableOpacity
              style={[estilos.menuItem, {
                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                backgroundColor: COLORS.negro + '40',
                borderColor: COLORS.blanco + '5',
                marginBottom: 8,
              }]}
              onPress={() => props.navigation.navigate('NotificacionesUsuario')}
              activeOpacity={0.7}
            >
              <View style={estilos.menuItemLeft}>
                <Ionicons name="notifications-outline" size={isTablet ? 26 : isSmallPhone ? 20 : 24} color={COLORS.blanco} />
                <Text style={[estilos.menuTexto, { fontSize: menuTextSize, marginLeft: 12 }]}>
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
                <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={COLORS.grisClaro} />
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
                  backgroundColor: COLORS.negro + '40',
                  borderColor: COLORS.blanco + '5',
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
                }]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={[estilos.menuValor, {
                    fontSize: isTablet ? 13 : isSmallPhone ? 10 : 12,
                    marginRight: 8,
                  }]}>
                    {item.subtitle}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={isTablet ? 24 : isSmallPhone ? 18 : 20} color={COLORS.grisClaro} />
              </TouchableOpacity>
            );
          })}

          {perfil?.id && (
            <TouchableOpacity
              style={[estilos.menuItem, estilos.menuCerrar, {
                borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                marginTop: 8,
                backgroundColor: COLORS.rojo + '10',
                borderColor: COLORS.rojo + '20',
              }]}
              onPress={() => setMostrarModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={isTablet ? 26 : isSmallPhone ? 20 : 24} color={COLORS.rojo} />
              <Text style={[estilos.menuTexto, {
                color: COLORS.rojo,
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

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={estilos.modalFondo}>
          <View style={[
            estilos.modal,
            {
              padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
              borderRadius: isTablet ? 28 : 24,
              borderColor: COLORS.rojo + '40',
              width: isTablet ? '60%' : '85%',
            }
          ]}>
            <Text style={[estilos.modalIcono, { fontSize: isTablet ? 80 : 60 }]}>🚪</Text>
            <Text style={[estilos.modalTitulo, { fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22 }]}>
              Cerrar Sesión
            </Text>
            <Text style={[estilos.modalTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
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
                  colors={[COLORS.rojo, COLORS.rojoOscuro]}
                  style={estilos.modalConfirmarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={isTablet ? 22 : isSmallPhone ? 16 : 20} color={COLORS.blanco} />
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
    backgroundColor: COLORS.negro,
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
    borderColor: COLORS.amarillo + '40',
    marginBottom: 12,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
  },
  camaraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.amarillo,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.negro,
  },
  subiendoImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: COLORS.negro + '60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subiendoImagenTexto: {
    color: COLORS.amarillo,
    fontSize: 12,
  },
  nombre: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 0.5,
  },
  correo: {
    color: COLORS.grisClaro,
    marginTop: 4,
    opacity: 0.7,
  },
  puntos: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.amarillo,
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
    color: COLORS.negro,
  },
  nivel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
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
    backgroundColor: COLORS.negro + '30',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.blanco + '5',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.blanco + '10',
  },
  statValor: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  statLabel: {
    color: COLORS.grisClaro,
    marginTop: 4,
    opacity: 0.6,
  },
  mensajeInvitado: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  textoInvitado: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  textoInvitadoSub: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
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
    color: COLORS.blanco,
  },
  valor: {
    color: COLORS.grisClaro,
    paddingVertical: 6,
  },
  input: {
    backgroundColor: COLORS.negro + '40',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
    color: COLORS.blanco,
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
    color: COLORS.negro,
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
    color: COLORS.blanco,
    fontWeight: '500',
  },
  menuValor: {
    color: COLORS.amarillo,
    fontWeight: '600',
  },
  menuLogin: {
    backgroundColor: COLORS.amarillo + '10',
  },
  menuCerrar: {
    borderWidth: 1,
  },
  badgeNotificaciones: {
    backgroundColor: COLORS.rojo,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNotificacionesTexto: {
    color: COLORS.blanco,
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
    backgroundColor: COLORS.grisOscuro,
    alignItems: 'center',
    borderWidth: 2,
  },
  modalIcono: {
    marginBottom: 12,
  },
  modalTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 8,
  },
  modalTexto: {
    color: COLORS.grisClaro,
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
    backgroundColor: COLORS.negro + '50',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  modalCancelarTexto: {
    color: COLORS.blanco,
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
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
});