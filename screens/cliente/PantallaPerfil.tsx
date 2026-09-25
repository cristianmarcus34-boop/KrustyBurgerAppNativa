// screens/cliente/PantallaPerfil.tsx - CON SIMPSONFONT Y TEMA CLARO + NOTIFICACIONES + HISTORIAL DE PUNTOS
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  AppState,
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
  Linking,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { DISENO, useResponsive } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';
import BarraProgreso from '../../components/BarraProgreso';
import { servicioEliminacionCuenta } from '../../services/servicioEliminacionCuenta';
import { useBeneficios } from '../../hooks/useBeneficios';
import { notificacionService } from '../../services/notificacionService';
import {
  ActividadReciente,
  obtenerNivel,
  Perfil,
} from '../../lib/tipos';
import { FUENTES } from '../../lib/fuentes';

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
  requiereSesion?: boolean;
}

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaPerfil(props: any) {
  const { perfil, sesion, cerrarSesion, actualizarPerfil, cargarPerfil } = tiendaAutenticacion();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { nivel, beneficios } = useBeneficios(
    perfil?.puntos_acumulados || 0,
    perfil?.id
  );

  // ✅ ESTADOS
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPreferenciasNotificaciones, setMostrarPreferenciasNotificaciones] = useState(false);
  const [notificacionesPermitidas, setNotificacionesPermitidas] = useState(false);
  const [guardandoPreferenciasNotificaciones, setGuardandoPreferenciasNotificaciones] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
  const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // ✅ NUEVO: modal para ver foto en tamaño completo
  const [mostrarFotoCompleta, setMostrarFotoCompleta] = useState(false);

  const [totalGastado, setTotalGastado] = useState(0);
  const [totalCanjes, setTotalCanjes] = useState(0);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ultimosCanjes, setUltimosCanjes] = useState<any[]>([]);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [historialPuntos, setHistorialPuntos] = useState<any[]>([]);

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

  // ✅ ANIMACIONES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // ✅ Responsive
  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;
  const padding = responsive.getEspaciado('LG');

  const avatarSize = responsive.getValor({ tablet: 180, normal: 140, small: 120 });
  const nombreSize = responsive.getValor({ tablet: 24, normal: 20, small: 18 });
  const correoSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });
  const statValorSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });
  const statLabelSize = responsive.getValor({ tablet: 12, normal: 11, small: 10 });
  const menuTextSize = responsive.getValor({ tablet: 14, normal: 13, small: 12 });
  const labelSize = responsive.getValor({ tablet: 14, normal: 13, small: 12 });
  const inputSize = responsive.getValor({ tablet: 15, normal: 14, small: 13 });

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
    if (perfil?.id) {
      cargarTotalPedidos();
      cargarDatosPerfil();
      cargarEstadisticas();
      cargarNotificacionesNoLeidas();
      cargarHistorialPuntos();

      if (perfil.avatar_url) {
        setImagenPerfil(perfil.avatar_url);
      }
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [perfil]);

  useFocusEffect(
    useCallback(() => {
      if (perfil?.id) {
        cargarPerfil(perfil.id);
        cargarNotificacionesNoLeidas();
        cargarHistorialPuntos();
      }
      notificacionService.tienePermisos().then(setNotificacionesPermitidas);
    }, [perfil?.id])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        notificacionService.tienePermisos().then(setNotificacionesPermitidas);
      }
    });

    return () => subscription.remove();
  }, []);

  // ============================================================
  // 🔔 CARGAR CONTADOR DE NOTIFICACIONES
  // ============================================================
  const cargarNotificacionesNoLeidas = async () => {
    if (!perfil?.id) return;
    try {
      const noLeidas = await notificacionService.obtenerNotificaciones(perfil.id, true);
      setNotificacionesNoLeidas(noLeidas.length);
    } catch (error) {
      console.warn('⚠️ Error cargando notificaciones no leídas:', error);
      setNotificacionesNoLeidas(0);
    }
  };

  const cambiarConsentimientoPromociones = async (acepta: boolean) => {
    if (!perfil?.id || guardandoPreferenciasNotificaciones) return;

    setGuardandoPreferenciasNotificaciones(true);
    const resultado = await actualizarPerfil({ acepta_promociones: acepta });
    setGuardandoPreferenciasNotificaciones(false);

    if (!resultado.success) {
      Alert.alert('No se pudo guardar', resultado.error || 'Intentalo de nuevo más tarde.');
      return;
    }
  };

  const activarNotificaciones = async () => {
    let concedido = await notificacionService.tienePermisos();
    if (!concedido) {
      concedido = await notificacionService.solicitarPermisos();
    }

    setNotificacionesPermitidas(concedido);
    if (!concedido) {
      Alert.alert(
        'Permiso de notificaciones',
        'Para recibir avisos de pedidos, habilitá las notificaciones de Krusty Burger en los ajustes del dispositivo.',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Abrir ajustes',
            onPress: () => {
              Linking.openSettings().catch((error) => {
                console.error('No se pudieron abrir los ajustes:', error);
                Alert.alert('Error', 'No se pudieron abrir los ajustes del dispositivo.');
              });
            },
          },
        ]
      );
      return;
    }

    if (perfil?.id) {
      const registrado = await notificacionService.registrarToken(perfil.id);
      if (!registrado) {
        Alert.alert('Error', 'Se habilitaron los permisos, pero no se pudo registrar este dispositivo.');
      }
    }
  };

  // ============================================================
  // ⭐ CARGAR HISTORIAL DE PUNTOS
  // ============================================================
  const cargarHistorialPuntos = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('historial_puntos')
        .select('*')
        .eq('usuario_id', perfil.id)
        .order('fecha', { ascending: false })
        .limit(15);

      if (error) throw error;
      setHistorialPuntos(data || []);
    } catch (error) {
      console.warn('⚠️ Error cargando historial de puntos:', error);
      setHistorialPuntos([]);
    }
  };

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
          recompensas (nombre, tipo, valor_descuento)
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
            ? c.recompensas[0]?.nombre : 'Recompensa';
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
      cargarNotificacionesNoLeidas(),
      cargarHistorialPuntos(),
    ]);
    setRefrescando(false);
  };

  // ============================================================
  // 📍 COORDENADAS
  // ============================================================
  const obtenerCoordenadasDesdeDireccion = async (
    calle: string,
    numero: string
  ): Promise<{ lat: number | null; lng: number | null }> => {
    if (!calle || !numero) return { lat: null, lng: null };
    try {
      const direccionCompleta = `${calle} ${numero}`;
      const geocodeResultados = await Location.geocodeAsync(direccionCompleta);
      if (geocodeResultados && geocodeResultados.length > 0) {
        const { latitude, longitude } = geocodeResultados[0];
        return { lat: latitude, lng: longitude };
      }
      return { lat: null, lng: null };
    } catch (error) {
      console.error('❌ Error en geocodificación:', error);
      return { lat: null, lng: null };
    }
  };

  // ============================================================
  // 💾 ACTUALIZAR PERFIL
  // ============================================================
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
      }

      const { error } = await supabase.from('perfiles').update(datosActualizados).eq('id', perfil.id);
      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el perfil: ' + error.message);
        return;
      }

      await actualizarPerfil({ ...perfil, ...datosActualizados });
      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setModoEdicion(false);
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setCargandoActualizacion(false);
      setGeocodificando(false);
    }
  };

  // ============================================================
  // 📷 IMÁGENES
  // ============================================================
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
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const subirImagenPerfil = async (uri: string) => {
    if (!perfil || !perfil.id) return;
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
      Alert.alert('✅ Éxito', 'Foto de perfil actualizada');
    } catch (error: any) {
      Alert.alert('Error', `No se pudo subir la imagen: ${error.message}`);
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
      ]
    );
  };

  // ✅ NUEVO: al tocar el avatar, abrir la foto en grande (solo si tiene foto)
  const handlePressAvatar = () => {
    if (!perfil?.id) return;
    if (imagenPerfil) {
      setMostrarFotoCompleta(true);
    } else {
      // Si no tiene foto, directo al selector para que ponga una
      mostrarOpcionesFoto();
    }
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

  // ============================================================
  // ⭐ NIVEL
  // ============================================================
  const nivelFallback = obtenerNivel(perfil?.puntos_acumulados || 0);
  const nivelActual = nivel || nivelFallback;

  // ============================================================
  // 📋 MENU ITEMS
  // ============================================================
  const menuItems: MenuItem[] = [
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icono: 'notifications-outline',
      color: DISENO.colors.azul,
      subtitle: notificacionesNoLeidas > 0
        ? `${notificacionesNoLeidas} sin leer`
        : 'Ver notificaciones',
      navigate: 'NotificacionesUsuario',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'preferencias-notificaciones',
      label: 'Preferencias de notificaciones',
      icono: 'options-outline',
      color: DISENO.colors.accent,
      subtitle: 'Pedidos y promociones',
      navigate: '',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'pedidos',
      label: 'Mis Pedidos',
      icono: 'receipt-outline',
      color: DISENO.colors.success,
      navigate: 'Pedidos',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'cupones',
      label: 'Mis Cupones',
      icono: 'ticket-outline',
      color: DISENO.colors.accent,
      subtitle: 'Ver mis cupones disponibles',
      navigate: 'MisCupones',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'recompensas',
      label: 'Recompensas',
      icono: 'star-outline',
      color: DISENO.colors.rosa,
      subtitle: 'Canjear puntos',
      navigate: 'Recompensas',
      show: true,
      requiereSesion: true,
    },
    {
      id: 'privacidad',
      label: '🔒 Privacidad',
      icono: 'lock-closed-outline',
      color: DISENO.colors.info,
      navigate: 'Privacidad',
      show: true,
      requiereSesion: false,
    },
    {
      id: 'terminos',
      label: '📋 Términos',
      icono: 'document-text-outline',
      color: DISENO.colors.textSecondary,
      navigate: 'Terminos',
      show: true,
      requiereSesion: false,
    },
  ];

  // ============================================================
  // 🧭 HANDLE NAVIGATE
  // ============================================================
  const handleNavigate = (item: MenuItem) => {
    if (item.requiereSesion && !sesion) {
      Alert.alert(
        'Iniciá sesión',
        'Necesitás una cuenta para acceder a esta sección.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar sesión',
            onPress: () => props.navigation.navigate('Login'),
          },
          {
            text: 'Registrarme',
            onPress: () => props.navigation.navigate('Registro'),
          },
        ]
      );
      return;
    }

    if (item.id === 'preferencias-notificaciones') {
      setMostrarPreferenciasNotificaciones(true);
      notificacionService.tienePermisos().then(setNotificacionesPermitidas);
      return;
    }

    if (item.id === 'pedidos') {
      props.navigation.navigate('Principal', { screen: 'Pedidos' });
    } else {
      props.navigation.navigate(item.navigate);
    }
  };

  // ============================================================
  // 🏗️ RENDER
  // ============================================================
  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
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
          {/* ✅ AVATAR: onPress abre foto grande; cámara abre selector */}
          <View style={[
            styles.avatarWrapper,
            { width: avatarSize, height: avatarSize },
          ]}>
            <TouchableOpacity
              onPress={handlePressAvatar}
              activeOpacity={0.85}
              disabled={!perfil?.id}
              style={{ width: avatarSize, height: avatarSize }}
            >
              <View style={[
                styles.avatarContainer,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
              ]}>
                {imagenPerfil ? (
                  <Image
                    source={{ uri: imagenPerfil }}
                    style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
                  />
                ) : (
                  <Text style={[styles.avatarEmoji, { fontSize: isTablet ? 80 : isSmallPhone ? 50 : 64 }]}>
                    {perfil?.nombre_cliente?.charAt(0)?.toUpperCase() || '🍔'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* ✅ Ícono de cámara: SOLO este abre el selector de foto */}
            {perfil?.id && (
              <TouchableOpacity
                style={[
                  styles.cameraIcon,
                  {
                    width: isTablet ? 46 : 38,
                    height: isTablet ? 46 : 38,
                    borderRadius: isTablet ? 23 : 19,
                  }
                ]}
                onPress={mostrarOpcionesFoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={isTablet ? 24 : 20} color={DISENO.colors.surface} />
              </TouchableOpacity>
            )}
          </View>

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
                  <Text style={[styles.pointsText, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
                    {perfil?.puntos_acumulados || 0} Krusty Points
                  </Text>
                </View>
              </View>

              <View style={[styles.levelBadge, {
                paddingHorizontal: isTablet ? 20 : isSmallPhone ? 12 : 16,
                paddingVertical: isTablet ? 8 : isSmallPhone ? 5 : 6,
                borderRadius: isTablet ? 24 : isSmallPhone ? 14 : 18,
                borderColor: nivelActual.color + '30',
                width: '100%',
              }]}>
                <Text style={[styles.levelText, {
                  color: nivelActual.color,
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  marginBottom: 4,
                }]}>
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

              {beneficios && (
                <View style={styles.beneficiosContainer}>
                  <Text style={[styles.beneficiosTitle, { fontSize: isTablet ? 14 : 12 }]}>
                    🎁 Beneficios de tu nivel
                  </Text>

                  <View style={styles.beneficioItem}>
                    <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.accent + '15' }]}>
                      <Ionicons name="pricetag-outline" size={isTablet ? 18 : 16} color={DISENO.colors.accent} />
                    </View>
                    <Text style={[styles.beneficioText, { fontSize: isTablet ? 13 : 12 }]}>
                      {beneficios.descuento > 0
                        ? `${beneficios.descuento}% de descuento en todos tus pedidos`
                        : 'Acumulá puntos para obtener descuentos'}
                    </Text>
                  </View>

                  <View style={styles.beneficioItem}>
                    <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.success + '15' }]}>
                      <Ionicons name="bicycle-outline" size={isTablet ? 18 : 16} color={DISENO.colors.success} />
                    </View>
                    <Text style={[styles.beneficioText, { fontSize: isTablet ? 13 : 12 }]}>
                      {beneficios.envioGratis
                        ? (beneficios.envioGratisMinimo
                          ? `Envío gratis en pedidos > $${formatearPrecio(beneficios.envioGratisMinimo)}`
                          : 'Envío gratis en todos tus pedidos')
                        : 'Envío con costo estándar'}
                    </Text>
                  </View>

                  {beneficios.accesoAnticipadoOfertas && (
                    <View style={styles.beneficioItem}>
                      <View style={[styles.beneficioIcon, { backgroundColor: DISENO.colors.info + '15' }]}>
                        <Ionicons name="rocket-outline" size={isTablet ? 18 : 16} color={DISENO.colors.info} />
                      </View>
                      <Text style={[styles.beneficioText, { fontSize: isTablet ? 13 : 12 }]}>
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
              <Ionicons name="person-outline" size={isTablet ? 50 : 40} color={DISENO.colors.textTertiary} />
              <Text style={[styles.guestText, { fontSize: isTablet ? 18 : isSmallPhone ? 14 : 16 }]}>
                Estás viendo como invitado
              </Text>
              <Text style={[styles.guestSubText, { fontSize: isTablet ? 13 : isSmallPhone ? 11 : 12 }]}>
                Inicia sesión para acceder a tus pedidos, puntos y recompensas
              </Text>

              <TouchableOpacity
                style={styles.loginButtonGuest}
                onPress={() => props.navigation.navigate('Login')}
              >
                <LinearGradient
                  colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-in-outline" size={18} color={DISENO.colors.surface} />
                  <Text style={[styles.loginButtonText, { fontSize: isTablet ? 15 : 13 }]}>
                    Iniciar sesión / Registrarse
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Actividad Reciente */}
        {perfil?.id && actividadesRecientes.length > 0 && (
          <Animated.View style={[
            styles.actividadContainer,
            {
              paddingHorizontal: padding,
              marginTop: 8,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
            <Text style={[styles.actividadTitulo, { fontSize: isTablet ? 15 : 13 }]}>
              📈 Actividad reciente
            </Text>

            {actividadesRecientes.slice(0, 4).map((actividad, index) => (
              <View key={actividad.id} style={[styles.actividadItem, {
                paddingVertical: isTablet ? 12 : 10,
                borderBottomWidth: index < actividadesRecientes.length - 1 ? 1 : 0,
                borderBottomColor: DISENO.colors.border,
              }]}>
                <View style={styles.actividadIcono}>
                  <Ionicons name={actividad.icono as any} size={20} color={actividad.color} />
                </View>
                <View style={styles.actividadInfo}>
                  <Text style={[styles.actividadDesc, { fontSize: isTablet ? 13 : 12 }]}>
                    {actividad.descripcion}
                  </Text>
                  <Text style={[styles.actividadFecha, { fontSize: isTablet ? 11 : 10 }]}>
                    {new Date(actividad.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Historial de Puntos */}
        {perfil?.id && historialPuntos.length > 0 && (
          <Animated.View style={[
            styles.historialPuntosContainer,
            {
              paddingHorizontal: padding,
              marginTop: 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
            <Text style={[styles.historialPuntosTitulo, { fontSize: isTablet ? 15 : 13 }]}>
              ⭐ Historial de puntos
            </Text>

            {historialPuntos.slice(0, 10).map((item, index) => {
              const esPositivo = item.puntos > 0;
              const color = esPositivo ? DISENO.colors.success : DISENO.colors.accent;
              const esAdmin = item.tipo?.startsWith('ajuste_admin');
              const esBonus = item.tipo === 'bonus_bienvenida';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.historialPuntosItem,
                    {
                      paddingVertical: isTablet ? 12 : 10,
                      borderBottomWidth: index < historialPuntos.length - 1 ? 1 : 0,
                      borderBottomColor: DISENO.colors.border,
                    },
                  ]}
                >
                  <View style={[
                    styles.historialPuntosIcono,
                    {
                      backgroundColor: color + '15',
                      width: isTablet ? 40 : 34,
                      height: isTablet ? 40 : 34,
                      borderRadius: isTablet ? 20 : 17,
                    },
                  ]}>
                    <Ionicons
                      name={
                        esBonus ? 'gift' :
                          esAdmin ? 'shield-checkmark' :
                            esPositivo ? 'add-circle' : 'remove-circle'
                      }
                      size={isTablet ? 22 : 18}
                      color={color}
                    />
                  </View>

                  <View style={styles.historialPuntosInfo}>
                    <Text style={[
                      styles.historialPuntosDescripcion,
                      { fontSize: isTablet ? 13 : 12 },
                    ]} numberOfLines={2}>
                      {item.descripcion || 'Ajuste de puntos'}
                    </Text>
                    <Text style={[
                      styles.historialPuntosFecha,
                      { fontSize: isTablet ? 11 : 10 },
                    ]}>
                      {new Date(item.fecha).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text style={[
                    styles.historialPuntosCantidad,
                    {
                      fontSize: isTablet ? 15 : 13,
                      color: color,
                    },
                  ]}>
                    {esPositivo ? '+' : ''}{item.puntos}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Info del Perfil */}
        {perfil?.id && (
          <Animated.View style={[
            styles.infoContainer,
            {
              paddingHorizontal: padding,
              marginTop: 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.infoTitulo, { fontSize: isTablet ? 15 : 13 }]}>
                📋 Info contacto
              </Text>
              <TouchableOpacity onPress={() => setModoEdicion(!modoEdicion)} style={styles.editButton}>
                <Text style={[styles.editButtonText, { fontSize: isTablet ? 13 : 11 }]}>
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
                        <Text style={[styles.saveButtonText, { fontSize: isTablet ? 15 : 13 }]}>
                          {geocodificando ? '📍 Obteniendo ubicación...' : 'Guardando...'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.saveButtonText, { fontSize: isTablet ? 15 : 13 }]}>
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
          <Animated.View style={[
            styles.canjesContainer,
            {
              paddingHorizontal: padding,
              marginTop: 12,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
            <Text style={[styles.canjesTitulo, { fontSize: isTablet ? 15 : 13 }]}>
              🎁 Últimas recompensas canjeadas
            </Text>

            {ultimosCanjes.map((canje, index) => (
              <View key={canje.id} style={[styles.canjeItem, {
                paddingVertical: isTablet ? 12 : 10,
                borderBottomWidth: index < ultimosCanjes.length - 1 ? 1 : 0,
                borderBottomColor: DISENO.colors.border,
              }]}>
                <View style={styles.canjeIcono}>
                  <Text style={styles.canjeEmoji}>🎯</Text>
                </View>
                <View style={styles.canjeInfo}>
                  <Text style={[styles.canjeNombre, { fontSize: isTablet ? 13 : 12 }]}>
                    {canje.recompensas?.nombre || 'Recompensa'}
                  </Text>
                  <Text style={[styles.canjeDetalle, { fontSize: isTablet ? 11 : 10 }]}>
                    {canje.puntos_usados} pts • {canje.recompensas?.tipo === 'descuento'
                      ? `${canje.recompensas?.valor_descuento}% OFF`
                      : 'Producto gratis'}
                  </Text>
                </View>
                <Text style={[styles.canjeFecha, { fontSize: isTablet ? 10 : 9 }]}>
                  {new Date(canje.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* MENÚ DE NAVEGACIÓN */}
        <Animated.View style={[
          styles.menuContainer,
          {
            paddingHorizontal: padding,
            marginTop: 12,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}>
          {menuItems.map((item) => {
            const bloqueado = item.requiereSesion && !sesion;
            const tieneBadge = item.id === 'notificaciones' && notificacionesNoLeidas > 0;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, {
                  paddingVertical: isTablet ? 16 : isSmallPhone ? 12 : 14,
                  paddingHorizontal: isTablet ? 20 : 16,
                }]}
                onPress={() => handleNavigate(item)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icono as any} size={isTablet ? 22 : 20} color={item.color} />
                    {tieneBadge && (
                      <View style={[
                        styles.badgeNotificaciones,
                        {
                          backgroundColor: DISENO.colors.accent,
                          borderColor: DISENO.colors.surface,
                        }
                      ]}>
                        <Text style={styles.badgeNotificacionesTexto}>
                          {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.menuLabelContainer}>
                    <Text style={[styles.menuLabel, { fontSize: menuTextSize }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {bloqueado ? (
                      <Text style={[styles.menuSubtitle, { fontSize: isTablet ? 12 : 10 }]} numberOfLines={1}>
                        🔒 Iniciá sesión para acceder
                      </Text>
                    ) : item.subtitle ? (
                      <Text style={[styles.menuSubtitle, { fontSize: isTablet ? 12 : 10 }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons
                  name={bloqueado ? 'lock-closed-outline' : 'chevron-forward'}
                  size={isTablet ? 22 : 18}
                  color={bloqueado ? DISENO.colors.warning : DISENO.colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Cerrar Sesión */}
        {perfil?.id && (
          <Animated.View style={[
            styles.logoutContainer,
            {
              paddingHorizontal: padding,
              marginTop: 16,
              marginBottom: 20,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
            <TouchableOpacity style={styles.logoutButton} onPress={() => setMostrarModal(true)}>
              <Ionicons name="log-out-outline" size={22} color={DISENO.colors.danger} />
              <Text style={[styles.logoutText, { fontSize: isTablet ? 14 : 13 }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      <Modal
        visible={mostrarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            width: isTablet ? 400 : screenWidth - 40,
            padding: isTablet ? 32 : 24,
            borderRadius: DISENO.radius.xl,
          }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={48} color={DISENO.colors.danger} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}>
              ¿Cerrar sesión?
            </Text>
            <Text style={[styles.modalText, { fontSize: isTablet ? 14 : 13 }]}>
              ¿Estás seguro que querés cerrar sesión? Podrás volver a iniciar sesión cuando quieras.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setMostrarModal(false)}
              >
                <Text style={[styles.modalButtonText, { fontSize: isTablet ? 14 : 13 }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmarCerrarSesion}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonConfirmText, { fontSize: isTablet ? 14 : 13 }]}>
                  Sí, cerrar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={mostrarPreferenciasNotificaciones}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarPreferenciasNotificaciones(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            width: isTablet ? 460 : screenWidth - 40,
            padding: isTablet ? 28 : 22,
            borderRadius: DISENO.radius.xl,
          }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="notifications-outline" size={42} color={DISENO.colors.accent} />
            </View>
            <Text style={[styles.modalTitle, { fontSize: isTablet ? 20 : 18 }]}>
              Preferencias de notificaciones
            </Text>
            <Text style={[styles.modalText, { fontSize: isTablet ? 14 : 13 }]}>
              Elegí qué comunicaciones querés recibir. Podés cambiar estas preferencias cuando quieras.
            </Text>

            <View style={styles.notificationPreferenceRow}>
              <View style={styles.notificationPreferenceInfo}>
                <Text style={styles.notificationPreferenceTitle}>Avisos de pedidos</Text>
                <Text style={styles.notificationPreferenceDescription}>
                  Actualizaciones sobre confirmación, preparación y entrega. Se controlan desde los permisos del dispositivo.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.notificationPermissionButton}
                onPress={activarNotificaciones}
                activeOpacity={0.8}
              >
                <Text style={styles.notificationPermissionButtonText}>
                  {notificacionesPermitidas ? 'Administrar' : 'Activar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationPreferenceRow}>
              <View style={styles.notificationPreferenceInfo}>
                <Text style={styles.notificationPreferenceTitle}>Promociones y ofertas</Text>
                <Text style={styles.notificationPreferenceDescription}>
                  Acepto recibir novedades comerciales. Esta opción es independiente del permiso del dispositivo.
                </Text>
              </View>
              <Switch
                value={perfil?.acepta_promociones === true}
                onValueChange={cambiarConsentimientoPromociones}
                disabled={guardandoPreferenciasNotificaciones}
                trackColor={{ false: DISENO.colors.border, true: DISENO.colors.success }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Aceptar promociones y ofertas"
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { marginTop: 20, alignSelf: 'stretch' }]}
              onPress={() => setMostrarPreferenciasNotificaciones(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonConfirmText]}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ NUEVO: MODAL PARA VER LA FOTO EN TAMAÑO COMPLETO */}
      <Modal
        visible={mostrarFotoCompleta}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarFotoCompleta(false)}
        statusBarTranslucent
      >
        <View style={styles.fotoCompletaOverlay}>
          {/* Botón cerrar */}
          <TouchableOpacity
            style={[styles.fotoCompletaCerrar, { top: insets.top + 16 }]}
            onPress={() => setMostrarFotoCompleta(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Toca afuera para cerrar */}
          <TouchableOpacity
            style={styles.fotoCompletaTouchable}
            activeOpacity={1}
            onPress={() => setMostrarFotoCompleta(false)}
          >
            {imagenPerfil && (
              <Image
                source={{ uri: imagenPerfil }}
                style={styles.fotoCompletaImagen}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          {/* Botón para cambiar foto desde acá */}
          <TouchableOpacity
            style={[styles.fotoCompletaCambiar, { bottom: insets.bottom + 24 }]}
            onPress={() => {
              setMostrarFotoCompleta(false);
              setTimeout(() => mostrarOpcionesFoto(), 300);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            <Text style={styles.fotoCompletaCambiarTexto}>Cambiar foto</Text>
          </TouchableOpacity>
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
  // ✅ NUEVO: wrapper del avatar para posicionar el ícono de cámara
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    backgroundColor: DISENO.colors.surface,
    borderWidth: 4,
    borderColor: DISENO.colors.border,
    ...DISENO.shadow.md,
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    textAlign: 'center',
    color: DISENO.colors.text,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: DISENO.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: DISENO.colors.surface,
    ...DISENO.shadow.sm,
  },
  uploadingContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontFamily: FUENTES.regular,
    fontSize: 12,
    color: DISENO.colors.textSecondary,
  },
  name: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginTop: 12,
  },
  email: {
    fontFamily: FUENTES.regular,
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
  pointsIcon: {
    fontSize: 18,
  },
  pointsText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accentSecondary,
  },
  levelBadge: {
    marginTop: 8,
    backgroundColor: DISENO.colors.surface,
    borderWidth: 1,
    ...DISENO.shadow.sm,
  },
  levelText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    textAlign: 'center',
  },
  beneficiosContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.md,
    width: '100%',
    ...DISENO.shadow.sm,
  },
  beneficiosTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  statLabel: {
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginTop: 8,
  },
  guestSubText: {
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
  actividadInfo: {
    flex: 1,
  },
  actividadDesc: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  actividadFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    marginTop: 1,
  },
  historialPuntosContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    paddingVertical: 16,
    ...DISENO.shadow.sm,
  },
  historialPuntosTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  historialPuntosItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  historialPuntosIcono: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  historialPuntosInfo: {
    flex: 1,
  },
  historialPuntosDescripcion: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  historialPuntosFecha: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
    marginTop: 2,
  },
  historialPuntosCantidad: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: DISENO.colors.fondo,
    borderRadius: DISENO.radius.sm,
  },
  editButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.accent,
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
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.regular,
    fontWeight: '500',
    color: DISENO.colors.textSecondary,
    marginBottom: 4,
  },
  formInput: {
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
  },
  canjesContainer: {
    backgroundColor: DISENO.colors.surface,
    borderRadius: DISENO.radius.lg,
    paddingVertical: 16,
    ...DISENO.shadow.sm,
  },
  canjesTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
  },
  canjeDetalle: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    marginTop: 1,
  },
  canjeFecha: {
    fontFamily: FUENTES.regular,
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
    position: 'relative',
  },
  badgeNotificaciones: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeNotificacionesTexto: {
    fontFamily: FUENTES.display,
    fontSize: 9,
    fontWeight: '400',
    color: DISENO.colors.surface,
  },
  menuLabel: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  menuSubtitle: {
    fontFamily: FUENTES.regular,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
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
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  notificationPreferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
  },
  notificationPreferenceInfo: {
    flex: 1,
  },
  notificationPreferenceTitle: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.text,
    fontSize: 14,
  },
  notificationPreferenceDescription: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  notificationPermissionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: DISENO.colors.accent,
    borderRadius: DISENO.radius.sm,
  },
  notificationPermissionButtonText: {
    fontFamily: FUENTES.display,
    color: DISENO.colors.surface,
    fontSize: 12,
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
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.text,
  },
  modalButtonConfirmText: {
    color: DISENO.colors.surface,
  },
  loginButtonGuest: {
    borderRadius: DISENO.radius.md,
    overflow: 'hidden',
    marginTop: 16,
    width: '100%',
    maxWidth: 250,
  },
  loginButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.surface,
  },

  // ✅ NUEVOS ESTILOS: FOTO COMPLETA
  fotoCompletaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoCompletaTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoCompletaImagen: {
    width: '100%',
    height: '100%',
  },
  fotoCompletaCerrar: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoCompletaCambiar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    zIndex: 10,
  },
  fotoCompletaCambiarTexto: {
    fontFamily: FUENTES.display,
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});