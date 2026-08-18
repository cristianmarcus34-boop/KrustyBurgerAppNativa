// screens/cliente/PantallaPerfil.tsx - VERSIÓN BLANCA Y ELEGANTE
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Animated,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - BLANCO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F8F7F5',
    surface: '#FFFFFF',
    surfaceHover: '#F5F4F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.05)',
    cardShadowHeavy: 'rgba(0,0,0,0.08)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.03)',
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
    rosaClaro: '#F06292',
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

// ============================================================
// 📋 TIPOS LOCALES
// ============================================================
interface MenuItem {
  id: string;
  label: string;
  icono: string;
  color: string;
  navigate: string;
  show: boolean;
  subtitle?: string;
}

export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion, actualizarPerfil } = tiendaAutenticacion();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

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
    if (!perfil?.id) return;
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('id_de_usuario', perfil.id);
    setTotalPedidos(count || 0);
  };

  const manejarRefresh = async () => {
    setRefrescando(true);
    await Promise.all([cargarTotalPedidos(), cargarDatosPerfil()]);
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
      Alert.alert('Error', 'Debes iniciar sesión para cambiar la foto');
      return;
    }

    setSubiendoImagen(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${perfil.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('perfiles').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', perfil.id);

      if (updateError) throw updateError;

      await actualizarPerfil({ ...perfil, avatar_url: publicUrl });
      setImagenPerfil(publicUrl);
      Alert.alert('✅ Éxito', 'Foto de perfil actualizada correctamente');
    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
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
    if (puntos >= 5000) return { icono: '💎', nombre: 'Platino', color: DESIGN.colors.platino };
    if (puntos >= 1500) return { icono: '👑', nombre: 'Oro', color: DESIGN.colors.oro };
    if (puntos >= 500) return { icono: '🥈', nombre: 'Plata', color: DESIGN.colors.plata };
    return { icono: '🥉', nombre: 'Bronce', color: DESIGN.colors.bronce };
  };

  const nivel = nivelCliente(perfil?.puntos_acumulados || 0);
  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = isTablet ? 40 : isSmallPhone ? 16 : 20;

  // Tamaños responsivos
  const avatarSize = isTablet ? 120 : isSmallPhone ? 80 : 90;
  const nombreSize = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const correoSize = isTablet ? 17 : isSmallPhone ? 12 : 14;
  const statValorSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const statLabelSize = isTablet ? 14 : isSmallPhone ? 10 : 12;
  const menuTextSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const labelSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const inputSize = isTablet ? 16 : isSmallPhone ? 14 : 15;

  const menuItems: MenuItem[] = [
    {
      id: 'pedidos',
      label: 'Mis Pedidos',
      icono: 'receipt-outline',
      color: DESIGN.colors.verde,
      navigate: 'Pedidos',
      show: true,
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: DESIGN.colors.rosa,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true,
    },
  ];

  const handleNavigate = (item: MenuItem) => {
    if (item.id === 'pedidos') {
      props.navigation.navigate('Principal', {
        screen: 'Pedidos',
      });
    } else {
      props.navigation.navigate(item.navigate);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fondo blanco/crema suave - SIN GRADIENTE NARANJA */}
      <View style={styles.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 120,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={DESIGN.colors.accent}
            colors={[DESIGN.colors.accent]}
          />
        }
      >
        <Animated.View
          style={[
            styles.header,
            {
              paddingHorizontal: padding,
              paddingTop: insets.top + (isTablet ? 30 : 20),
              paddingBottom: isTablet ? 24 : 16,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {/* Avatar con borde sutil */}
          <TouchableOpacity
            onPress={perfil?.id ? mostrarOpcionesFoto : undefined}
            activeOpacity={0.8}
            disabled={!perfil?.id}
          >
            <View
              style={[
                styles.avatarContainer,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  borderColor: DESIGN.colors.border,
                },
              ]}
            >
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
                <Text
                  style={[
                    styles.avatarEmoji,
                    { fontSize: isTablet ? 50 : isSmallPhone ? 32 : 40 },
                  ]}
                >
                  {perfil?.nombre_cliente?.charAt(0)?.toUpperCase() || '🍔'}
                </Text>
              )}
              {perfil?.id && (
                <View style={styles.cameraIcon}>
                  <Ionicons
                    name="camera"
                    size={isTablet ? 18 : 14}
                    color={DESIGN.colors.surface}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {subiendoImagen && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={DESIGN.colors.accent} />
              <Text style={styles.uploadingText}>Subiendo imagen...</Text>
            </View>
          )}

          <Text style={[styles.name, { fontSize: nombreSize }]}>
            {perfil?.nombre_cliente || 'Invitado'}
          </Text>

          <Text style={[styles.email, { fontSize: correoSize }]}>
            {perfil?.email || 'Inicia sesión para ver tus datos'}
          </Text>

          {perfil?.id ? (
            <>
              {/* Puntos - ahora más sutil */}
              <View style={styles.pointsContainer}>
                <View style={styles.pointsWrapper}>
                  <Text style={styles.pointsIcon}>⭐</Text>
                  <Text
                    style={[
                      styles.pointsText,
                      { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 },
                    ]}
                  >
                    {perfil?.puntos_acumulados || 0} Krusty Points
                  </Text>
                </View>
              </View>

              {/* Nivel - badge limpio */}
              <View
                style={[
                  styles.levelBadge,
                  {
                    paddingHorizontal: isTablet ? 20 : isSmallPhone ? 12 : 16,
                    paddingVertical: isTablet ? 8 : isSmallPhone ? 5 : 6,
                    borderRadius: isTablet ? 24 : isSmallPhone ? 14 : 18,
                    borderColor: nivel.color + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: nivel.color,
                      fontSize: isTablet ? 17 : isSmallPhone ? 13 : 15,
                    },
                  ]}
                >
                  {nivel.icono} Nivel {nivel.nombre}
                </Text>
              </View>

              {/* Stats - tarjeta blanca */}
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: statValorSize }]}>
                    {totalPedidos}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>
                    Pedidos
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: statValorSize }]}>
                    {perfil?.puntos_acumulados || 0}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>
                    Puntos
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: statValorSize }]}>
                    {perfil?.ultimo_acceso
                      ? new Date(perfil.ultimo_acceso).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                      })
                      : '---'}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>
                    Último acceso
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // Guest view - limpio y minimalista
            <View style={styles.guestMessage}>
              <Ionicons
                name="person-outline"
                size={isTablet ? 50 : 40}
                color={DESIGN.colors.textTertiary}
              />
              <Text
                style={[
                  styles.guestText,
                  { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 },
                ]}
              >
                Estás viendo como invitado
              </Text>
              <Text
                style={[
                  styles.guestSubText,
                  { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 },
                ]}
              >
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>
            </View>
          )}
        </Animated.View>

        {perfil?.id && (
          <Animated.View
            style={[
              styles.infoSection,
              {
                paddingHorizontal: padding,
                marginTop: 16,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Editar perfil - botón sutil */}
            <TouchableOpacity
              style={[
                styles.editButton,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: modoEdicion
                    ? DESIGN.colors.verde + '12'
                    : DESIGN.colors.surfaceHover,
                  borderColor: modoEdicion
                    ? DESIGN.colors.verde + '25'
                    : DESIGN.colors.border,
                },
              ]}
              onPress={() => setModoEdicion(!modoEdicion)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.editButtonText,
                  {
                    color: modoEdicion ? DESIGN.colors.verde : DESIGN.colors.textSecondary,
                    fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  },
                ]}
              >
                {modoEdicion ? '✖ Cerrar edición' : '✏️ Editar perfil'}
              </Text>
            </TouchableOpacity>

            {/* Tarjeta de información - BLANCA */}
            <View
              style={[
                styles.infoCard,
                {
                  borderRadius: isTablet ? 20 : isSmallPhone ? 12 : 16,
                  padding: isTablet ? 24 : isSmallPhone ? 14 : 18,
                  borderColor: DESIGN.colors.border,
                  backgroundColor: DESIGN.colors.surface,
                },
              ]}
            >
              <View style={styles.field}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="call-outline"
                    size={isTablet ? 20 : 18}
                    color={DESIGN.colors.textSecondary}
                  />
                  <Text style={[styles.label, { fontSize: labelSize, marginLeft: 8 }]}>
                    Teléfono
                  </Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[styles.input, { fontSize: inputSize }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 11 1234-5678"
                    placeholderTextColor={DESIGN.colors.textTertiary}
                    keyboardType="phone-pad"
                    selectionColor={DESIGN.colors.accent}
                  />
                ) : (
                  <Text style={[styles.value, { fontSize: inputSize }]}>
                    {telefono || 'No especificado'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="location-outline"
                    size={isTablet ? 20 : 18}
                    color={DESIGN.colors.textSecondary}
                  />
                  <Text style={[styles.label, { fontSize: labelSize, marginLeft: 8 }]}>
                    Dirección
                  </Text>
                </View>
                {modoEdicion ? (
                  <>
                    <View style={styles.rowInputs}>
                      <TextInput
                        style={[styles.input, styles.inputFlex, { fontSize: inputSize }]}
                        value={direccionCalle}
                        onChangeText={setDireccionCalle}
                        placeholder="Calle"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        selectionColor={DESIGN.colors.accent}
                      />
                      <TextInput
                        style={[styles.input, styles.inputSmall, { fontSize: inputSize }]}
                        value={direccionNumero}
                        onChangeText={setDireccionNumero}
                        placeholder="N°"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        keyboardType="numeric"
                        selectionColor={DESIGN.colors.accent}
                      />
                    </View>
                    <View style={styles.rowInputs}>
                      <TextInput
                        style={[styles.input, styles.inputFlex, { fontSize: inputSize }]}
                        value={direccionPiso}
                        onChangeText={setDireccionPiso}
                        placeholder="Piso (opcional)"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        selectionColor={DESIGN.colors.accent}
                      />
                      <TextInput
                        style={[styles.input, styles.inputFlex, { fontSize: inputSize }]}
                        value={direccionDepartamento}
                        onChangeText={setDireccionDepartamento}
                        placeholder="Depto (opcional)"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        selectionColor={DESIGN.colors.accent}
                      />
                    </View>
                    <View style={styles.rowInputs}>
                      <TextInput
                        style={[styles.input, styles.inputFlex, { fontSize: inputSize }]}
                        value={direccionBarrio}
                        onChangeText={setDireccionBarrio}
                        placeholder="Barrio"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        selectionColor={DESIGN.colors.accent}
                      />
                      <TextInput
                        style={[styles.input, styles.inputFlex, { fontSize: inputSize }]}
                        value={direccionCiudad}
                        onChangeText={setDireccionCiudad}
                        placeholder="Ciudad"
                        placeholderTextColor={DESIGN.colors.textTertiary}
                        selectionColor={DESIGN.colors.accent}
                      />
                    </View>
                    <TextInput
                      style={[styles.input, { fontSize: inputSize }]}
                      value={direccionCodigoPostal}
                      onChangeText={setDireccionCodigoPostal}
                      placeholder="Código Postal"
                      placeholderTextColor={DESIGN.colors.textTertiary}
                      keyboardType="numeric"
                      selectionColor={DESIGN.colors.accent}
                    />
                  </>
                ) : (
                  <Text style={[styles.value, { fontSize: inputSize }]}>
                    {obtenerDireccionCompleta()}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="restaurant-outline"
                    size={isTablet ? 20 : 18}
                    color={DESIGN.colors.textSecondary}
                  />
                  <Text style={[styles.label, { fontSize: labelSize, marginLeft: 8 }]}>
                    Preferencias alimentarias
                  </Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[styles.input, { fontSize: inputSize }]}
                    value={preferenciasComida}
                    onChangeText={setPreferenciasComida}
                    placeholder="Ej: Sin gluten, Vegano, etc."
                    placeholderTextColor={DESIGN.colors.textTertiary}
                    selectionColor={DESIGN.colors.accent}
                  />
                ) : (
                  <Text style={[styles.value, { fontSize: inputSize }]}>
                    {preferenciasComida || 'No especificadas'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <View style={styles.labelContainer}>
                  <Ionicons
                    name="card-outline"
                    size={isTablet ? 20 : 18}
                    color={DESIGN.colors.textSecondary}
                  />
                  <Text style={[styles.label, { fontSize: labelSize, marginLeft: 8 }]}>
                    Método de pago preferido
                  </Text>
                </View>
                {modoEdicion ? (
                  <TextInput
                    style={[styles.input, { fontSize: inputSize }]}
                    value={metodoPago}
                    onChangeText={setMetodoPago}
                    placeholder="Ej: Tarjeta de crédito, Efectivo, Mercado Pago"
                    placeholderTextColor={DESIGN.colors.textTertiary}
                    selectionColor={DESIGN.colors.accent}
                  />
                ) : (
                  <Text style={[styles.value, { fontSize: inputSize }]}>
                    {metodoPago || 'No especificado'}
                  </Text>
                )}
              </View>

              {modoEdicion && (
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      marginTop: 16,
                      paddingVertical: isTablet ? 14 : isSmallPhone ? 10 : 12,
                      borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                      backgroundColor: DESIGN.colors.accent,
                    },
                  ]}
                  onPress={actualizarDatosPerfil}
                  disabled={cargandoActualizacion}
                  activeOpacity={0.7}
                >
                  {cargandoActualizacion ? (
                    <ActivityIndicator size="small" color={DESIGN.colors.surface} />
                  ) : (
                    <>
                      <Ionicons
                        name="save-outline"
                        size={isTablet ? 22 : 18}
                        color={DESIGN.colors.surface}
                      />
                      <Text
                        style={[
                          styles.saveButtonText,
                          { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 },
                        ]}
                      >
                        Guardar cambios
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Menú */}
        <Animated.View
          style={[
            styles.menu,
            {
              paddingHorizontal: padding,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
              marginTop: isTablet ? 8 : 4,
            },
          ]}
        >
          {!perfil?.id && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.menuLogin,
                {
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                  borderWidth: 1.5,
                  borderColor: DESIGN.colors.accent,
                },
              ]}
              onPress={navegarALogin}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-in-outline"
                size={isTablet ? 28 : isSmallPhone ? 20 : 24}
                color={DESIGN.colors.accent}
              />
              <Text
                style={[
                  styles.menuText,
                  {
                    color: DESIGN.colors.accent,
                    fontWeight: '700',
                    fontSize: menuTextSize,
                    marginLeft: 12,
                    flex: 1,
                  },
                ]}
              >
                Iniciar Sesión
              </Text>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : isSmallPhone ? 18 : 20}
                color={DESIGN.colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {perfil?.id && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                  marginBottom: 8,
                  backgroundColor: DESIGN.colors.surface,
                  borderColor: DESIGN.colors.border,
                },
              ]}
              onPress={() => props.navigation.navigate('NotificacionesUsuario')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={isTablet ? 26 : isSmallPhone ? 20 : 24}
                  color={DESIGN.colors.textSecondary}
                />
                <Text style={[styles.menuText, { fontSize: menuTextSize, marginLeft: 12 }]}>
                  Notificaciones
                </Text>
              </View>
              <View style={styles.menuItemRight}>
                <Ionicons
                  name="chevron-forward"
                  size={isTablet ? 24 : isSmallPhone ? 18 : 20}
                  color={DESIGN.colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          )}

          {menuItems.map((item) => {
            if (!item.show) return null;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                    padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                    marginBottom: 8,
                    backgroundColor: DESIGN.colors.surface,
                    borderColor: DESIGN.colors.border,
                  },
                ]}
                onPress={() => handleNavigate(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icono as any}
                  size={isTablet ? 26 : isSmallPhone ? 20 : 24}
                  color={item.color}
                />
                <Text
                  style={[
                    styles.menuText,
                    {
                      fontSize: menuTextSize,
                      marginLeft: 12,
                      flex: 1,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text
                    style={[
                      styles.menuSubtitle,
                      {
                        fontSize: isTablet ? 13 : isSmallPhone ? 10 : 12,
                        marginRight: 8,
                        color: item.color,
                      },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={isTablet ? 24 : isSmallPhone ? 18 : 20}
                  color={DESIGN.colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}

          {/* Cerrar Sesión - Botón destacado pero elegante */}
          {perfil?.id && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.menuLogout,
                {
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  padding: isTablet ? 18 : isSmallPhone ? 12 : 14,
                  marginTop: 12,
                  backgroundColor: DESIGN.colors.surface,
                  borderColor: DESIGN.colors.accent + '30',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setMostrarModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={isTablet ? 28 : isSmallPhone ? 22 : 24}
                  color={DESIGN.colors.accent}
                />
                <Text
                  style={[
                    styles.menuText,
                    {
                      color: DESIGN.colors.accent,
                      fontSize: menuTextSize,
                      marginLeft: 12,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Cerrar Sesión
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 24 : isSmallPhone ? 18 : 20}
                color={DESIGN.colors.accent}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de confirmación - elegante */}
      <Modal visible={mostrarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modal,
              {
                padding: isTablet ? 40 : isSmallPhone ? 24 : 30,
                borderRadius: isTablet ? 28 : 24,
                borderColor: DESIGN.colors.border,
                width: isTablet ? '60%' : '85%',
                backgroundColor: DESIGN.colors.surface,
              },
            ]}
          >
            <Text style={[styles.modalIcon, { fontSize: isTablet ? 80 : 60 }]}>🚪</Text>
            <Text
              style={[
                styles.modalTitle,
                {
                  fontSize: isTablet ? 26 : isSmallPhone ? 20 : 22,
                  color: DESIGN.colors.text,
                },
              ]}
            >
              Cerrar Sesión
            </Text>
            <Text
              style={[
                styles.modalText,
                {
                  fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                  color: DESIGN.colors.textSecondary,
                },
              ]}
            >
              ¿Estás seguro de que quieres salir?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancel,
                  {
                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                    borderColor: DESIGN.colors.border,
                    backgroundColor: DESIGN.colors.surfaceHover,
                  },
                ]}
                onPress={() => setMostrarModal(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                      color: DESIGN.colors.textSecondary,
                    },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  {
                    paddingVertical: isTablet ? 16 : isSmallPhone ? 10 : 14,
                    borderRadius: isTablet ? 14 : isSmallPhone ? 10 : 12,
                    overflow: 'hidden',
                    backgroundColor: DESIGN.colors.accent,
                  },
                ]}
                onPress={confirmarCerrarSesion}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-out-outline"
                  size={isTablet ? 22 : isSmallPhone ? 16 : 20}
                  color={DESIGN.colors.surface}
                />
                <Text
                  style={[
                    styles.modalConfirmText,
                    {
                      fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14,
                      color: DESIGN.colors.surface,
                    },
                  ]}
                >
                  Cerrar Sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS - BLANCOS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DESIGN.colors.fondo,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 12,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: DESIGN.colors.surface,
  },
  avatarEmoji: {
    fontWeight: 'bold',
    color: DESIGN.colors.accent,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DESIGN.colors.accent,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: DESIGN.colors.surface,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: DESIGN.colors.surface + '95',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadingText: {
    color: DESIGN.colors.accent,
    fontSize: 12,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.3,
    color: DESIGN.colors.text,
  },
  email: {
    marginTop: 4,
    color: DESIGN.colors.textSecondary,
  },
  pointsContainer: {
    marginTop: 12,
    backgroundColor: DESIGN.colors.surfaceHover,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  pointsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsIcon: {
    fontSize: 16,
  },
  pointsText: {
    fontWeight: '600',
    color: DESIGN.colors.text,
  },
  levelBadge: {
    marginTop: 8,
    borderWidth: 1,
    backgroundColor: DESIGN.colors.surface,
  },
  levelText: {
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 10,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: DESIGN.colors.border,
  },
  statValue: {
    fontWeight: '700',
    color: DESIGN.colors.text,
  },
  statLabel: {
    marginTop: 4,
    color: DESIGN.colors.textSecondary,
  },
  guestMessage: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  guestText: {
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    color: DESIGN.colors.text,
  },
  guestSubText: {
    textAlign: 'center',
    marginTop: 4,
    color: DESIGN.colors.textSecondary,
  },
  infoSection: {
    marginBottom: 8,
  },
  editButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    borderWidth: 1,
  },
  editButtonText: {
    fontWeight: '500',
  },
  infoCard: {
    borderWidth: 1,
    backgroundColor: DESIGN.colors.surface,
    shadowColor: DESIGN.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  field: {
    marginBottom: 14,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    color: DESIGN.colors.text,
  },
  value: {
    paddingVertical: 6,
    color: DESIGN.colors.textSecondary,
  },
  input: {
    backgroundColor: DESIGN.colors.surfaceHover,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    color: DESIGN.colors.text,
  },
  inputFlex: {
    flex: 1,
  },
  inputSmall: {
    width: '30%',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: DESIGN.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontWeight: '700',
    color: DESIGN.colors.surface,
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
  menuText: {
    fontWeight: '500',
    color: DESIGN.colors.text,
  },
  menuSubtitle: {
    fontWeight: '600',
  },
  menuLogin: {
    backgroundColor: DESIGN.colors.accent + '06',
  },
  menuLogout: {
    shadowColor: DESIGN.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeNotifications: {
    backgroundColor: DESIGN.colors.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeNotificationsText: {
    color: DESIGN.colors.surface,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: DESIGN.colors.cardShadowHeavy,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: DESIGN.colors.text,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 24,
    color: DESIGN.colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalCancel: {
    backgroundColor: DESIGN.colors.surfaceHover,
    borderWidth: 1,
  },
  modalCancelText: {
    color: DESIGN.colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    color: DESIGN.colors.surface,
    fontWeight: '700',
  },
});