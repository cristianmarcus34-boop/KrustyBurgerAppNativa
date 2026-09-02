// screens/cliente/PantallaPerfil.tsx - COMPLETA CON ELIMINACIÓN DE CUENTA Y BENEFICIOS
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { DISENO, useResponsive } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';
import BarraProgreso from '../../components/BarraProgreso';
import { servicioEliminacionCuenta } from '../../services/servicioEliminacionCuenta';
import { useBeneficios } from '../../hooks/useBeneficios';
import {
  ActividadReciente,
  obtenerNivel,
  Perfil,
} from '../../lib/tipos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion, actualizarPerfil } = tiendaAutenticacion();
  const { favoritos } = tiendaFavoritos();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  // ✅ HOOK DE BENEFICIOS
  const { nivel, beneficios } = useBeneficios(
    perfil?.puntos_acumulados || 0,
    perfil?.id
  );

  // ✅ ESTADOS
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
  const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const [totalGastado, setTotalGastado] = useState(0);
  const [totalCanjes, setTotalCanjes] = useState(0);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ultimosCanjes, setUltimosCanjes] = useState<any[]>([]);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

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
  const [geocodificando, setGeocodificando] = useState(false);

  // ✅ ESTADOS PARA ELIMINACIÓN DE CUENTA
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [motivoEliminacion, setMotivoEliminacion] = useState('');
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [tieneSolicitudEliminacion, setTieneSolicitudEliminacion] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState(0);

  // ✅ ANIMACIONES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ✅ Responsive
  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = responsive.getEspaciado('LG');

  const avatarSize = responsive.getValor({ tablet: 120, normal: 90, small: 80 });
  const nombreSize = responsive.getValor({ tablet: 28, normal: 24, small: 20 });
  const correoSize = responsive.getValor({ tablet: 17, normal: 14, small: 12 });
  const statValorSize = responsive.getValor({ tablet: 26, normal: 22, small: 18 });
  const statLabelSize = responsive.getValor({ tablet: 14, normal: 12, small: 10 });
  const menuTextSize = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
  const labelSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });
  const inputSize = responsive.getValor({ tablet: 16, normal: 15, small: 14 });

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    if (perfil?.id) {
      cargarTotalPedidos();
      cargarDatosPerfil();
      cargarEstadisticas();
      verificarEstadoEliminacion();
      if (perfil.avatar_url) {
        setImagenPerfil(perfil.avatar_url);
      }
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [perfil]);

  // ============================================================
  // 🔄 FUNCIONES DE CARGA
  // ============================================================
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

  const cargarEstadisticas = async () => {
    if (!perfil?.id) return;
    setCargandoEstadisticas(true);

    try {
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('total, estado')
        .eq('id_de_usuario', perfil.id);

      if (!pedidosError && pedidos) {
        const total = pedidos
          .filter(p => p.estado === 'entregado')
          .reduce((sum, p) => sum + (p.total || 0), 0);
        setTotalGastado(total);
        setTotalPedidos(pedidos.length);
      }

      const { count: canjesCount, error: canjesError } = await supabase
        .from('canjes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', perfil.id);

      if (!canjesError) {
        setTotalCanjes(canjesCount || 0);
      }

      const { data: canjes, error: canjesDataError } = await supabase
        .from('canjes')
        .select(`
          id,
          puntos_usados,
          usado_en_pedido,
          created_at,
          recompensas (
            nombre,
            tipo,
            valor_descuento
          )
        `)
        .eq('usuario_id', perfil.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!canjesDataError && canjes) {
        const canjesMapeados = canjes.map((c: any) => ({
          id: c.id,
          puntos_usados: c.puntos_usados,
          usado_en_pedido: c.usado_en_pedido,
          created_at: c.created_at,
          recompensas: c.recompensas && c.recompensas.length > 0 ? c.recompensas[0] : null
        }));
        setUltimosCanjes(canjesMapeados);
      }

      await cargarActividadReciente();

    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const cargarActividadReciente = async () => {
    if (!perfil?.id) return;

    try {
      const actividades: ActividadReciente[] = [];

      const { data: pedidosRecientes } = await supabase
        .from('pedidos')
        .select('id, estado, total, creado_en')
        .eq('id_de_usuario', perfil.id)
        .order('creado_en', { ascending: false })
        .limit(3);

      if (pedidosRecientes) {
        pedidosRecientes.forEach((p: any) => {
          const estadoMap: Record<string, { icono: string; texto: string; color: string }> = {
            'entregado': { icono: 'checkmark-circle', texto: '✅ Entregado', color: DISENO.colors.success },
            'pendiente': { icono: 'time', texto: '⏳ Pendiente', color: DISENO.colors.accentSecondary },
            'confirmado': { icono: 'checkmark-circle-outline', texto: '✅ Confirmado', color: DISENO.colors.info },
            'preparando': { icono: 'restaurant', texto: '🍔 Preparando', color: DISENO.colors.warning },
            'en_camino': { icono: 'bicycle', texto: '🚴 En camino', color: DISENO.colors.azul },
          };
          const estadoInfo = estadoMap[p.estado] || estadoMap.pendiente;

          actividades.push({
            id: `pedido-${p.id}`,
            tipo: 'pedido',
            descripcion: `Pedido #${String(p.id).slice(-4)} - ${estadoInfo.texto}`,
            fecha: p.creado_en,
            icono: estadoInfo.icono,
            color: estadoInfo.color,
          });
        });
      }

      const { data: canjesRecientes } = await supabase
        .from('canjes')
        .select('id, puntos_usados, created_at, recompensas(nombre)')
        .eq('usuario_id', perfil.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (canjesRecientes) {
        canjesRecientes.forEach((c: any) => {
          const nombreRecompensa = c.recompensas && c.recompensas.length > 0
            ? c.recompensas[0]?.nombre
            : 'Recompensa';
          actividades.push({
            id: `canje-${c.id}`,
            tipo: 'canje',
            descripcion: `🎁 Canjeaste ${c.puntos_usados} pts por "${nombreRecompensa}"`,
            fecha: c.created_at,
            icono: 'gift',
            color: DISENO.colors.rosa,
          });
        });
      }

      actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setActividadesRecientes(actividades.slice(0, 5));

    } catch (error) {
      console.error('❌ Error cargando actividad reciente:', error);
    }
  };

  const manejarRefresh = async () => {
    setRefrescando(true);
    await Promise.all([
      cargarTotalPedidos(),
      cargarDatosPerfil(),
      cargarEstadisticas(),
      verificarEstadoEliminacion(),
    ]);
    setRefrescando(false);
  };

  // ✅ VERIFICAR ESTADO DE ELIMINACIÓN
  const verificarEstadoEliminacion = async () => {
    if (!perfil?.id) return;
    const estado = await servicioEliminacionCuenta.obtenerEstadoEliminacion(perfil.id);
    setTieneSolicitudEliminacion(estado.tieneSolicitud);
    setDiasRestantes(estado.diasRestantes || 0);
  };

  // ✅ FUNCIÓN PARA OBTENER COORDENADAS
  const obtenerCoordenadasDesdeDireccion = async (calle: string, numero: string): Promise<{ lat: number | null; lng: number | null }> => {
    if (!calle || !numero) {
      return { lat: null, lng: null };
    }

    try {
      const direccionCompleta = `${calle} ${numero}`;
      console.log('📍 Geocodificando:', direccionCompleta);

      const geocodeResultados = await Location.geocodeAsync(direccionCompleta);

      if (geocodeResultados && geocodeResultados.length > 0) {
        const { latitude, longitude } = geocodeResultados[0];
        console.log('✅ Coordenadas obtenidas:', latitude, longitude);
        return { lat: latitude, lng: longitude };
      } else {
        console.warn('⚠️ No se encontraron coordenadas para:', direccionCompleta);
        return { lat: null, lng: null };
      }
    } catch (error) {
      console.error('❌ Error en geocodificación:', error);
      return { lat: null, lng: null };
    }
  };

  // ✅ ACTUALIZAR PERFIL CON GEOCODIFICACIÓN
  const actualizarDatosPerfil = async () => {
    if (!perfil || !perfil.id) {
      Alert.alert('❌ Error', 'No se pudo identificar tu cuenta.');
      return;
    }

    if ((direccionCalle || direccionNumero) && (!direccionCalle || !direccionNumero)) {
      Alert.alert('⚠️ Dirección incompleta', 'Si querés guardar una dirección, completá tanto la calle como el número.');
      return;
    }

    setCargandoActualizacion(true);
    setGeocodificando(true);

    try {
      let lat = null;
      let lng = null;

      if (direccionCalle && direccionNumero) {
        const coordenadas = await obtenerCoordenadasDesdeDireccion(direccionCalle, direccionNumero);
        lat = coordenadas.lat;
        lng = coordenadas.lng;
      }

      const datosActualizados: any = {
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

      if (lat !== null && lng !== null) {
        datosActualizados.lat_cliente = lat;
        datosActualizados.lng_cliente = lng;
        console.log('📍 Guardando coordenadas en perfil:', lat, lng);
      } else if (direccionCalle && direccionNumero) {
        Alert.alert(
          '⚠️ Coordenadas no encontradas',
          'No se pudieron obtener las coordenadas de la dirección ingresada. La dirección se guardará pero no podrás calcular distancias de envío.',
          [{ text: 'Entendido' }]
        );
      }

      const { error } = await supabase
        .from('perfiles')
        .update(datosActualizados)
        .eq('id', perfil.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
        return;
      }

      await actualizarPerfil({ ...perfil, ...datosActualizados });

      if (lat !== null && lng !== null) {
        Alert.alert('✅ Éxito', 'Perfil actualizado correctamente con ubicación');
      } else {
        Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      }

      setModoEdicion(false);
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setCargandoActualizacion(false);
      setGeocodificando(false);
    }
  };

  // ✅ SOLICITAR ELIMINACIÓN DE CUENTA
  const solicitarEliminacionCuenta = async () => {
    if (!perfil || !perfil.id || !perfil.email) {
      Alert.alert(
        '❌ Error',
        'No se pudo identificar tu cuenta. Por favor, cerrá sesión y volvé a iniciar.'
      );
      return;
    }

    if (!motivoEliminacion || motivoEliminacion.trim().length < 10) {
      Alert.alert(
        '📝 Motivo requerido',
        'Por favor, contanos con más detalle por qué querés eliminar tu cuenta. Esto nos ayuda a mejorar.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!passwordConfirmacion || passwordConfirmacion.length < 6) {
      Alert.alert(
        '🔒 Contraseña requerida',
        'Ingresá tu contraseña para confirmar la eliminación de tu cuenta.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCargandoEliminar(true);

    try {
      const resultado = await servicioEliminacionCuenta.solicitarEliminacion(
        perfil.id,
        perfil.email,
        motivoEliminacion.trim(),
        passwordConfirmacion
      );

      if (!resultado.success) {
        Alert.alert('❌ Error', resultado.error || 'Ocurrió un error. Intentá nuevamente.');
        setCargandoEliminar(false);
        return;
      }

      const fechaEliminacion = new Date(resultado.solicitud!.fecha_eliminacion);
      const fechaFormateada = fechaEliminacion.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      Alert.alert(
        '✅ Solicitud enviada',
        `Tu solicitud de eliminación fue recibida.\n\n📅 Tu cuenta será eliminada el ${fechaFormateada}.\n\nSi iniciás sesión antes de esa fecha, la eliminación se cancelará automáticamente.\n\nGracias por habernos elegido 🍔`,
        [
          {
            text: 'Entendido',
            onPress: () => {
              setMostrarModalEliminar(false);
              setPasswordConfirmacion('');
              setMotivoEliminacion('');
              cerrarSesion();
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'Bienvenida' }],
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('❌ Error', 'Ocurrió un error inesperado. Intentá nuevamente.');
    } finally {
      setCargandoEliminar(false);
    }
  };

  // ✅ CANCELAR ELIMINACIÓN
  const cancelarEliminacion = async () => {
    if (!perfil || !perfil.id) {
      Alert.alert('❌ Error', 'No se pudo identificar tu cuenta.');
      return;
    }

    Alert.alert(
      '🔄 Cancelar eliminación',
      '¿Estás seguro que querés cancelar la eliminación de tu cuenta?',
      [
        {
          text: 'Sí, cancelar',
          onPress: async () => {
            const resultado = await servicioEliminacionCuenta.cancelarEliminacion(perfil.id);
            if (resultado.success) {
              setTieneSolicitudEliminacion(false);
              setDiasRestantes(0);
              Alert.alert('✅ Cancelado', 'Tu cuenta ya no será eliminada.');
            } else {
              Alert.alert('❌ Error', resultado.error || 'No se pudo cancelar.');
            }
          },
          style: 'destructive'
        },
        { text: 'No', style: 'cancel' }
      ]
    );
  };

  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
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
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
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
    if (!perfil || !perfil.id) {
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

  // ✅ OBTENER NIVEL (fallback si useBeneficios no carga)
  const nivelFallback = obtenerNivel(perfil?.puntos_acumulados || 0);
  const nivelActual = nivel || nivelFallback;

  // ✅ MENU ITEMS
  const menuItems: MenuItem[] = [
    {
      id: 'pedidos',
      label: 'Mis Pedidos',
      icono: 'receipt-outline',
      color: DISENO.colors.success,
      navigate: 'Pedidos',
      show: true,
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: DISENO.colors.rosa,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true,
    },
    {
      id: 'privacidad',
      label: '🔒 Privacidad',
      icono: 'lock-closed-outline',
      color: DISENO.colors.info,
      navigate: 'Privacidad',
      show: true,
    },
    {
      id: 'terminos',
      label: '📋 Términos',
      icono: 'document-text-outline',
      color: DISENO.colors.textSecondary,
      navigate: 'Terminos',
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

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefresh}
            tintColor={DISENO.colors.accent}
            colors={[DISENO.colors.accent]}
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
          {/* Avatar */}
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
                  borderColor: DISENO.colors.border,
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
                    color={DISENO.colors.surface}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {subiendoImagen && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={DISENO.colors.accent} />
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
              <View style={styles.pointsContainer}>
                <View style={styles.pointsWrapper}>
                  <Text style={styles.pointsIcon}>⭐</Text>
                  <Text style={[styles.pointsText, { fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14 }]}>
                    {perfil?.puntos_acumulados || 0} Krusty Points
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.levelBadge,
                  {
                    paddingHorizontal: isTablet ? 20 : isSmallPhone ? 12 : 16,
                    paddingVertical: isTablet ? 8 : isSmallPhone ? 5 : 6,
                    borderRadius: isTablet ? 24 : isSmallPhone ? 14 : 18,
                    borderColor: nivelActual.color + '30',
                    width: '100%',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.levelText,
                    {
                      color: nivelActual.color,
                      fontSize: isTablet ? 17 : isSmallPhone ? 13 : 15,
                      marginBottom: 4,
                    },
                  ]}
                >
                  {nivelActual.icono} Nivel {nivelActual.nombre}
                  {nivelActual.siguiente !== '—' && ` → ${nivelActual.siguiente}`}
                </Text>
                <BarraProgreso
                  progreso={nivelActual.progreso}
                  color={nivelActual.color}
                  altura={6}
                  label={`${Math.round(nivelActual.progreso)}%`}
                />
              </View>

              {/* ✅ SECCIÓN DE BENEFICIOS - NUEVA */}
              {beneficios && (
                <View style={styles.beneficiosContainer}>
                  <Text style={[styles.beneficiosTitle, { fontSize: isTablet ? 16 : 14 }]}>
                    🎁 Beneficios de tu nivel
                  </Text>

                  {/* Descuento */}
                  <View style={styles.beneficioItem}>
                    <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.accent + '15' }]}>
                      <Ionicons name="pricetag-outline" size={isTablet ? 18 : 16} color={DISENO.colors.accent} />
                    </View>
                    <Text style={[styles.beneficioText, { fontSize: isTablet ? 14 : 13 }]}>
                      {beneficios.descuento > 0
                        ? `${beneficios.descuento}% de descuento en todos tus pedidos`
                        : 'Acumulá puntos para obtener descuentos'}
                    </Text>
                  </View>

                  {/* Envío gratis */}
                  <View style={styles.beneficioItem}>
                    <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.success + '15' }]}>
                      <Ionicons name="bicycle-outline" size={isTablet ? 18 : 16} color={DISENO.colors.success} />
                    </View>
                    <Text style={[styles.beneficioText, { fontSize: isTablet ? 14 : 13 }]}>
                      {beneficios.envioGratis
                        ? (beneficios.envioGratisMinimo
                          ? `Envío gratis en pedidos > $${formatearPrecio(beneficios.envioGratisMinimo)}`
                          : 'Envío gratis en todos tus pedidos')
                        : 'Envío con costo estándar'}
                    </Text>
                  </View>



                  {/* Acceso anticipado a ofertas */}
                  {beneficios.accesoAnticipadoOfertas && (
                    <View style={styles.beneficioItem}>
                      <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.info + '15' }]}>
                        <Ionicons name="rocket-outline" size={isTablet ? 18 : 16} color={DISENO.colors.info} />
                      </View>
                      <Text style={[styles.beneficioText, { fontSize: isTablet ? 14 : 13 }]}>
                        🚀 Acceso anticipado a ofertas exclusivas
                      </Text>
                    </View>
                  )}
                </View>
              )}

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
                    {formatearPrecio(totalGastado)}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>
                    Gastado
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: statValorSize }]}>
                    {totalCanjes}
                  </Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>
                    Canjes
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.guestMessage}>
              <Ionicons
                name="person-outline"
                size={isTablet ? 50 : 40}
                color={DISENO.colors.textTertiary}
              />
              <Text style={[styles.guestText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                Estás viendo como invitado
              </Text>
              <Text style={[styles.guestSubText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Actividad Reciente */}
        {perfil?.id && actividadesRecientes.length > 0 && (
          <Animated.View
            style={[
              styles.actividadContainer,
              {
                paddingHorizontal: padding,
                marginTop: 8,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={[styles.actividadTitulo, { fontSize: isTablet ? 18 : 16 }]}>
              📈 Actividad reciente
            </Text>

            {actividadesRecientes.slice(0, 4).map((actividad, index) => (
              <View
                key={actividad.id}
                style={[
                  styles.actividadItem,
                  {
                    paddingVertical: isTablet ? 12 : 10,
                    borderBottomWidth: index < actividadesRecientes.length - 1 ? 1 : 0,
                    borderBottomColor: DISENO.colors.border,
                  },
                ]}
              >
                <View style={styles.actividadIcono}>
                  <Ionicons name={actividad.icono as any} size={20} color={actividad.color} />
                </View>
                <View style={styles.actividadInfo}>
                  <Text style={[styles.actividadDesc, { fontSize: isTablet ? 14 : 13 }]}>
                    {actividad.descripcion}
                  </Text>
                  <Text style={[styles.actividadFecha, { fontSize: isTablet ? 12 : 11 }]}>
                    {new Date(actividad.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Info del Perfil */}
        {perfil?.id && (
          <Animated.View
            style={[
              styles.infoContainer,
              {
                paddingHorizontal: padding,
                marginTop: 12,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <View style={styles.infoHeader}>
              <Text style={[styles.infoTitulo, { fontSize: isTablet ? 18 : 16 }]}>
                📋 Información de contacto
              </Text>
              <TouchableOpacity
                onPress={() => setModoEdicion(!modoEdicion)}
                style={styles.editButton}
              >
                <Text style={[styles.editButtonText, { fontSize: isTablet ? 14 : 12 }]}>
                  {modoEdicion ? 'Cancelar' : '✏️ Editar'}
                </Text>
              </TouchableOpacity>
            </View>

            {modoEdicion ? (
              <View style={styles.editForm}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { fontSize: labelSize }]}>📱 Teléfono</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: inputSize }]}
                    value={telefono}
                    onChangeText={setTelefono}
                    placeholder="Ej: 11 1234 5678"
                    keyboardType="phone-pad"
                    placeholderTextColor={DISENO.colors.textTertiary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { fontSize: labelSize }]}>📍 Dirección</Text>
                  <View style={styles.direccionRow}>
                    <TextInput
                      style={[styles.formInput, styles.direccionCalle, { fontSize: inputSize }]}
                      value={direccionCalle}
                      onChangeText={setDireccionCalle}
                      placeholder="Calle"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                    <TextInput
                      style={[styles.formInput, styles.direccionNumero, { fontSize: inputSize }]}
                      value={direccionNumero}
                      onChangeText={setDireccionNumero}
                      placeholder="N°"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                  </View>
                  <View style={styles.direccionRow}>
                    <TextInput
                      style={[styles.formInput, styles.direccionPiso, { fontSize: inputSize }]}
                      value={direccionPiso}
                      onChangeText={setDireccionPiso}
                      placeholder="Piso"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                    <TextInput
                      style={[styles.formInput, styles.direccionDepto, { fontSize: inputSize }]}
                      value={direccionDepartamento}
                      onChangeText={setDireccionDepartamento}
                      placeholder="Depto"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={[styles.formInput, { fontSize: inputSize }]}
                    value={direccionBarrio}
                    onChangeText={setDireccionBarrio}
                    placeholder="Barrio"
                    placeholderTextColor={DISENO.colors.textTertiary}
                  />
                  <View style={styles.direccionRow}>
                    <TextInput
                      style={[styles.formInput, styles.direccionCiudad, { fontSize: inputSize }]}
                      value={direccionCiudad}
                      onChangeText={setDireccionCiudad}
                      placeholder="Ciudad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                    <TextInput
                      style={[styles.formInput, styles.direccionCP, { fontSize: inputSize }]}
                      value={direccionCodigoPostal}
                      onChangeText={setDireccionCodigoPostal}
                      placeholder="CP"
                      keyboardType="number-pad"
                      placeholderTextColor={DISENO.colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { fontSize: labelSize }]}>🍽️ Preferencias de comida</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea, { fontSize: inputSize }]}
                    value={preferenciasComida}
                    onChangeText={setPreferenciasComida}
                    placeholder="Ej: Sin TACC, vegetariano, etc."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={DISENO.colors.textTertiary}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={actualizarDatosPerfil}
                  disabled={cargandoActualizacion || geocodificando}
                >
                  <LinearGradient
                    colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {cargandoActualizacion || geocodificando ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={[styles.saveButtonText, { fontSize: isTablet ? 18 : 16 }]}>
                          {geocodificando ? '📍 Obteniendo ubicación...' : 'Guardando...'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { fontSize: isTablet ? 18 : 16 }]}>
                        ✅ Guardar cambios
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoDisplay}>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: inputSize }]}>
                    {telefono || 'No especificado'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: inputSize }]}>
                    {obtenerDireccionCompleta()}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="restaurant-outline" size={20} color={DISENO.colors.textSecondary} />
                  <Text style={[styles.infoText, { fontSize: inputSize }]}>
                    {preferenciasComida || 'Sin preferencias'}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Últimos Canjes */}
        {perfil?.id && ultimosCanjes.length > 0 && (
          <Animated.View
            style={[
              styles.canjesContainer,
              {
                paddingHorizontal: padding,
                marginTop: 12,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={[styles.canjesTitulo, { fontSize: isTablet ? 18 : 16 }]}>
              🎁 Últimas recompensas canjeadas
            </Text>

            {ultimosCanjes.map((canje, index) => (
              <View
                key={canje.id}
                style={[
                  styles.canjeItem,
                  {
                    paddingVertical: isTablet ? 12 : 10,
                    borderBottomWidth: index < ultimosCanjes.length - 1 ? 1 : 0,
                    borderBottomColor: DISENO.colors.border,
                  },
                ]}
              >
                <View style={styles.canjeIcono}>
                  <Text style={styles.canjeEmoji}>🎯</Text>
                </View>
                <View style={styles.canjeInfo}>
                  <Text style={[styles.canjeNombre, { fontSize: isTablet ? 14 : 13 }]}>
                    {canje.recompensas?.nombre || 'Recompensa'}
                  </Text>
                  <Text style={[styles.canjeDetalle, { fontSize: isTablet ? 12 : 11 }]}>
                    {canje.puntos_usados} pts • {canje.recompensas?.tipo === 'descuento'
                      ? `${canje.recompensas?.valor_descuento}% OFF`
                      : 'Producto gratis'}
                  </Text>
                </View>
                <Text style={[styles.canjeFecha, { fontSize: isTablet ? 11 : 10 }]}>
                  {new Date(canje.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Menú de navegación */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              paddingHorizontal: padding,
              marginTop: 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 12 : 14,
                  paddingHorizontal: isTablet ? 20 : 16,
                  backgroundColor: DISENO.colors.surface,
                  borderRadius: DISENO.radius.md,
                  marginBottom: 8,
                  ...DISENO.shadow.sm,
                },
              ]}
              onPress={() => handleNavigate(item)}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: item.color + '15' },
                  ]}
                >
                  <Ionicons name={item.icono as any} size={isTablet ? 24 : 20} color={item.color} />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text style={[styles.menuLabel, { fontSize: menuTextSize }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.menuSubtitle, { fontSize: isTablet ? 13 : 11 }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 22 : 18}
                color={DISENO.colors.textTertiary}
              />
            </TouchableOpacity>
          ))}

          {/* ✅ BOTÓN DE ELIMINAR CUENTA */}
          {perfil?.id && (
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 12 : 14,
                  paddingHorizontal: isTablet ? 20 : 16,
                  backgroundColor: DISENO.colors.surface,
                  borderRadius: DISENO.radius.md,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: tieneSolicitudEliminacion ? DISENO.colors.accentSecondary + '30' : DISENO.colors.danger + '30',
                  ...DISENO.shadow.sm,
                },
              ]}
              onPress={() => {
                if (tieneSolicitudEliminacion) {
                  Alert.alert(
                    '⏳ Eliminación programada',
                    `Tu cuenta está programada para eliminarse en ${diasRestantes} días.\n\n¿Querés cancelar la eliminación?`,
                    [
                      {
                        text: 'Cancelar eliminación',
                        onPress: cancelarEliminacion,
                        style: 'destructive',
                      },
                      {
                        text: 'Seguir así',
                        style: 'cancel',
                      },
                    ]
                  );
                } else {
                  setMostrarModalEliminar(true);
                }
              }}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    {
                      backgroundColor: tieneSolicitudEliminacion
                        ? DISENO.colors.accentSecondary + '15'
                        : DISENO.colors.danger + '15'
                    },
                  ]}
                >
                  <Ionicons
                    name={tieneSolicitudEliminacion ? "time-outline" : "trash-outline"}
                    size={isTablet ? 24 : 20}
                    color={tieneSolicitudEliminacion ? DISENO.colors.accentSecondary : DISENO.colors.danger}
                  />
                </View>
                <View style={styles.menuLabelContainer}>
                  <Text
                    style={[
                      styles.menuLabel,
                      {
                        fontSize: menuTextSize,
                        color: tieneSolicitudEliminacion ? DISENO.colors.accentSecondary : DISENO.colors.danger,
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {tieneSolicitudEliminacion
                      ? `⏳ Eliminación en ${diasRestantes} días`
                      : 'Eliminar cuenta'
                    }
                  </Text>
                  <Text style={[styles.menuSubtitle, { fontSize: isTablet ? 13 : 11 }]} numberOfLines={1}>
                    {tieneSolicitudEliminacion
                      ? 'Tu cuenta será eliminada automáticamente'
                      : 'Eliminá permanentemente tu cuenta y datos'
                    }
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={isTablet ? 22 : 18}
                color={DISENO.colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Cerrar Sesión */}
        {perfil?.id && (
          <Animated.View
            style={[
              styles.logoutContainer,
              {
                paddingHorizontal: padding,
                marginTop: 16,
                marginBottom: 20,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setMostrarModal(true)}
            >
              <Ionicons name="log-out-outline" size={22} color={DISENO.colors.danger} />
              <Text style={[styles.logoutText, { fontSize: isTablet ? 17 : 15 }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* ============================================================
      🚨 MODAL DE ELIMINACIÓN DE CUENTA
      ============================================================ */}
      <Modal
        visible={mostrarModalEliminar}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setMostrarModalEliminar(false);
          setPasswordConfirmacion('');
          setMotivoEliminacion('');
        }}
      >
        <View style={styles.modalEliminarOverlay}>
          <View style={[
            styles.modalEliminarContainer,
            {
              width: isTablet ? 480 : SCREEN_WIDTH - 32,
              maxWidth: 480,
            }
          ]}>
            {/* Header con gradiente */}
            <LinearGradient
              colors={['#E53935', '#C62828']}
              style={styles.modalEliminarHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalEliminarHeaderContent}>
                <View style={styles.modalEliminarIconContainer}>
                  <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.modalEliminarTitle}>Eliminar cuenta</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setMostrarModalEliminar(false);
                  setPasswordConfirmacion('');
                  setMotivoEliminacion('');
                }}
                style={styles.modalEliminarClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={styles.modalEliminarBodyScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalEliminarBodyContent}
            >
              {/* ⚠️ Advertencia */}
              <View style={styles.modalEliminarWarning}>
                <Ionicons name="warning-outline" size={22} color="#E53935" />
                <Text style={styles.modalEliminarWarningText}>
                  Esta acción es <Text style={{ fontWeight: '700', color: '#E53935' }}>permanente e irreversible</Text>
                </Text>
              </View>

              <Text style={styles.modalEliminarSubtitle}>
                Tu cuenta será eliminada <Text style={{ fontWeight: '700', color: '#F5C518' }}>en 30 días</Text>.
                Si iniciás sesión durante este período, la eliminación se cancelará automáticamente.
                {'\n\n'}
                Perderás acceso a:
                {'\n'}• Todos tus pedidos e historial
                {'\n'}• Tus puntos y recompensas acumulados
                {'\n'}• Tus datos personales guardados
              </Text>

              {/* ✅ CONTRASEÑA */}
              <View style={styles.modalEliminarInputGroup}>
                <Text style={styles.modalEliminarLabel}>
                  <Ionicons name="lock-closed-outline" size={16} color="#F5C518" />
                  {' '}Confirmá tu contraseña <Text style={{ color: '#E53935' }}>*</Text>
                </Text>
                <View style={styles.modalEliminarPasswordContainer}>
                  <TextInput
                    style={styles.modalEliminarInput}
                    placeholder="Ingresá tu contraseña"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!mostrarPassword}
                    value={passwordConfirmacion}
                    onChangeText={setPasswordConfirmacion}
                    autoCapitalize="none"
                    selectionColor="#F5C518"
                  />
                  <TouchableOpacity
                    onPress={() => setMostrarPassword(!mostrarPassword)}
                    style={styles.modalEliminarPasswordToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ✅ MOTIVO - OBLIGATORIO */}
              <View style={styles.modalEliminarInputGroup}>
                <Text style={styles.modalEliminarLabel}>
                  <Ionicons name="chatbubble-outline" size={16} color="#F5C518" />
                  {' '}¿Por qué te vas? <Text style={{ color: '#E53935' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.modalEliminarInput, styles.modalEliminarTextArea]}
                  placeholder="Ayudanos a mejorar contándonos tu experiencia..."
                  placeholderTextColor="#94A3B8"
                  value={motivoEliminacion}
                  onChangeText={setMotivoEliminacion}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  selectionColor="#F5C518"
                />
                {motivoEliminacion.length > 0 && (
                  <Text style={[
                    styles.modalEliminarContador,
                    { color: motivoEliminacion.length >= 10 ? '#43A047' : '#E53935' }
                  ]}>
                    {motivoEliminacion.length}/500 caracteres
                  </Text>
                )}
              </View>

              {/* ✅ VALIDACIONES */}
              {motivoEliminacion.length > 0 && motivoEliminacion.length < 10 && (
                <Text style={styles.modalEliminarError}>
                  <Ionicons name="alert-circle-outline" size={14} color="#E53935" />
                  {' '}El motivo debe tener al menos 10 caracteres
                </Text>
              )}

              {/* ✅ BOTONES */}
              <View style={styles.modalEliminarBotones}>
                <TouchableOpacity
                  style={[styles.modalEliminarBoton, styles.modalEliminarBotonSecundario]}
                  onPress={() => {
                    setMostrarModalEliminar(false);
                    setPasswordConfirmacion('');
                    setMotivoEliminacion('');
                  }}
                  activeOpacity={0.7}
                  disabled={cargandoEliminar}
                >
                  <Text style={styles.modalEliminarBotonSecundarioText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalEliminarBoton,
                    styles.modalEliminarBotonPeligro,
                    (!passwordConfirmacion || motivoEliminacion.length < 10) && styles.modalEliminarBotonDisabled
                  ]}
                  onPress={solicitarEliminacionCuenta}
                  activeOpacity={0.7}
                  disabled={cargandoEliminar || !passwordConfirmacion || motivoEliminacion.length < 10}
                >
                  {cargandoEliminar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.modalEliminarBotonPeligroText}>
                        Solicitar eliminación
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.modalEliminarFooter}>
                🔒 Tendrás 30 días para cancelar la eliminación si cambias de opinión
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================
      🚪 MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN
      ============================================================ */}
      <Modal
        visible={mostrarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                width: isTablet ? 400 : SCREEN_WIDTH - 40,
                padding: isTablet ? 32 : 24,
                borderRadius: DISENO.radius.xl,
              },
            ]}
          >
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={48} color={DISENO.colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: isTablet ? 22 : 18 }]}>
              ¿Cerrar sesión?
            </Text>
            <Text style={[styles.modalText, { fontSize: isTablet ? 16 : 14 }]}>
              ¿Estás seguro que querés cerrar sesión? Podrás volver a iniciar sesión cuando quieras.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setMostrarModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: isTablet ? 16 : 14 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmarCerrarSesion}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonConfirmText, { fontSize: isTablet ? 16 : 14 }]}>
                  Sí, cerrar sesión
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
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: DISENO.colors.surface,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    backgroundColor: DISENO.colors.surface,
    borderWidth: 3,
    borderColor: DISENO.colors.border,
    ...DISENO.shadow.md,
    overflow: 'visible',
    position: 'relative',
  },
  avatarEmoji: {
    textAlign: 'center',
    lineHeight: undefined,
    color: DISENO.colors.text,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: DISENO.colors.accent,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DISENO.colors.surface,
  },
  uploadingContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: DISENO.colors.textSecondary,
  },
  name: {
    fontWeight: '700',
    color: DISENO.colors.text,
    marginTop: 12,
  },
  email: {
    color: DISENO.colors.textSecondary,
    marginTop: 2,
  },
  pointsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  pointsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pointsIcon: { fontSize: 18 },
  pointsText: {
    fontWeight: '600',
    color: DISENO.colors.accentSecondary,
  },
  levelBadge: {
    marginTop: 8,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    ...DISENO.shadow.sm,
  },
  levelText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  // ✅ ESTILOS PARA BENEFICIOS
  beneficiosContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    width: '100%',
    ...DISENO.shadow.sm,
  },
  beneficiosTitle: {
    fontWeight: '600',
    color: DISENO.colors.text,
    marginBottom: 10,
  },
  beneficioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  beneficioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  beneficioText: {
    color: DISENO.colors.textSecondary,
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    ...DISENO.shadow.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    color: DISENO.colors.text,
  },
  statLabel: {
    color: DISENO.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: DISENO.colors.border,
  },
  guestMessage: {
    alignItems: 'center',
    marginTop: 16,
    padding: 20,
  },
  guestText: {
    color: DISENO.colors.text,
    fontWeight: '600',
    marginTop: 8,
  },
  guestSubText: {
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  actividadContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    paddingVertical: 16,
    ...DISENO.shadow.sm,
  },
  actividadTitulo: {
    fontWeight: '600',
    color: DISENO.colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actividadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actividadIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DISENO.colors.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actividadInfo: { flex: 1 },
  actividadDesc: {
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  actividadFecha: {
    color: DISENO.colors.textTertiary,
    marginTop: 1,
  },
  infoContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    paddingVertical: 16,
    ...DISENO.shadow.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoTitulo: {
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: DISENO.colors.fondo,
    borderRadius: DISENO.radius.sm,
  },
  editButtonText: {
    color: DISENO.colors.accent,
    fontWeight: '500',
  },
  infoDisplay: {
    paddingHorizontal: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoText: {
    color: DISENO.colors.text,
    flex: 1,
    fontWeight: '400',
  },
  editForm: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontWeight: '500',
    color: DISENO.colors.textSecondary,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: DISENO.colors.fondo,
    borderRadius: DISENO.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: DISENO.colors.text,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  direccionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  direccionCalle: { flex: 2 },
  direccionNumero: { flex: 1 },
  direccionPiso: { flex: 1 },
  direccionDepto: { flex: 1 },
  direccionCiudad: { flex: 2 },
  direccionCP: { flex: 1 },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: DISENO.colors.surface,
    fontWeight: '600',
  },
  canjesContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    paddingVertical: 16,
    ...DISENO.shadow.sm,
  },
  canjesTitulo: {
    fontWeight: '600',
    color: DISENO.colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  canjeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  canjeIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DISENO.colors.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  canjeEmoji: { fontSize: 18 },
  canjeInfo: { flex: 1 },
  canjeNombre: {
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  canjeDetalle: {
    color: DISENO.colors.textSecondary,
    marginTop: 1,
  },
  canjeFecha: {
    color: DISENO.colors.textTertiary,
  },
  menuContainer: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    ...DISENO.shadow.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuLabelContainer: {
    flex: 1,
    marginRight: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  menuLabel: {
    fontWeight: '500',
    color: DISENO.colors.text,
  },
  menuSubtitle: {
    color: DISENO.colors.textTertiary,
    marginTop: 1,
  },
  logoutContainer: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    borderWidth: 1,
    borderColor: DISENO.colors.danger + '30',
  },
  logoutText: {
    fontWeight: '500',
    color: DISENO.colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.xl,
    alignItems: 'center',
    ...DISENO.shadow.lg,
  },
  modalIcon: { marginBottom: 12 },
  modalTitle: {
    fontWeight: '700',
    color: DISENO.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: DISENO.radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: DISENO.colors.fondo,
  },
  modalButtonConfirm: {
    backgroundColor: DISENO.colors.danger,
  },
  modalButtonText: {
    fontWeight: '600',
    color: DISENO.colors.text,
  },
  modalButtonConfirmText: {
    color: DISENO.colors.surface,
  },
  // ============================================================
  // 🎨 ESTILOS PARA EL MODAL DE ELIMINACIÓN
  // ============================================================
  modalEliminarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalEliminarContainer: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    maxHeight: '90%',
  },
  modalEliminarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalEliminarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalEliminarIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEliminarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalEliminarClose: {
    padding: 8,
  },
  modalEliminarBodyScroll: {
    maxHeight: '80%',
  },
  modalEliminarBodyContent: {
    padding: 20,
    paddingBottom: 8,
  },
  modalEliminarWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.15)',
    marginBottom: 16,
  },
  modalEliminarWarningText: {
    fontSize: 14,
    color: '#B0B0B0',
    flex: 1,
  },
  modalEliminarSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalEliminarInputGroup: {
    marginBottom: 16,
  },
  modalEliminarLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B0B0B0',
    marginBottom: 8,
  },
  modalEliminarPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
  },
  modalEliminarInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
  },
  modalEliminarPasswordToggle: {
    padding: 8,
  },
  modalEliminarTextArea: {
    minHeight: 80,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  modalEliminarContador: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.7,
  },
  modalEliminarError: {
    fontSize: 12,
    color: '#E53935',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalEliminarBotones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalEliminarBoton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalEliminarBotonSecundario: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalEliminarBotonSecundarioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  modalEliminarBotonPeligro: {
    backgroundColor: '#E53935',
  },
  modalEliminarBotonPeligroText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalEliminarBotonDisabled: {
    opacity: 0.5,
  },
  modalEliminarFooter: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});