// screens/cliente/PantallaDetalleProducto.tsx - CON INFO "INCLUYE PAPAS"
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Producto } from '../../lib/tipos';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';

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

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor };
};

// ============================================================
// 📋 ETIQUETAS DE CATEGORÍAS
// ============================================================
const CATEGORIAS_ETIQUETAS: Record<string, { label: string; icono: string; color: string }> = {
  'burgers': { label: 'Hamburguesa', icono: '🍔', color: DISENO.colors.accent },
  'combos': { label: 'Combo', icono: '🍟', color: DISENO.colors.accentSecondary },
  'bebidas': { label: 'Bebida', icono: '🥤', color: DISENO.colors.azul },
  'postres': { label: 'Postre', icono: '🍦', color: DISENO.colors.rosa },
  'acompanantes': { label: 'Acompañante', icono: '🍿', color: DISENO.colors.verde },
};

// ============================================================
// 🏠 COMPONENTE
// ============================================================
export default function PantallaDetalleProducto(props: any) {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();

  const { agregarProducto, cantidadTotal } = tiendaCarrito();
  const { idsFavoritos, agregarFavoritoManual, eliminarFavoritoManual } = tiendaFavoritos();
  const { perfil, sesion } = tiendaAutenticacion();

  const producto: Producto = props.route?.params?.producto;

  const [cantidad, setCantidad] = useState(1);
  const [imagenCargando, setImagenCargando] = useState(true);
  const [imagenError, setImagenError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;

  const precio = useMemo(
    () => (typeof producto?.precio === 'number' ? producto.precio : Number(producto?.precio || 0)),
    [producto]
  );

  const precioTotal = useMemo(() => precio * cantidad, [precio, cantidad]);

  const categoriaInfo = useMemo(
    () =>
      CATEGORIAS_ETIQUETAS[producto?.categoria || ''] || {
        label: 'Producto',
        icono: '🍔',
        color: DISENO.colors.accent,
      },
    [producto]
  );

  const esFavorito = useMemo(() => {
    if (!producto?.id) return false;
    return idsFavoritos?.includes(Number(producto.id));
  }, [idsFavoritos, producto?.id]);

  const disponible = producto?.disponible !== false;

  const tiempoPreparacion = useMemo(() => {
    const tiempos: Record<string, string> = {
      burgers: '15-20 min',
      combos: '15-25 min',
      bebidas: '2-5 min',
      postres: '3-5 min',
      acompanantes: '8-12 min',
    };
    return tiempos[producto?.categoria || ''] || '10-15 min';
  }, [producto]);

  // ✅ Tamaños
  const padding = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
  const imagenHeight = responsive.getValor({ tablet: 420, normal: 320, small: 240 });
  const imagenRadius = responsive.getValor({ tablet: 24, normal: 18, small: 14 });
  const nombreSize = responsive.getValor({ tablet: 26, normal: 22, small: 18 });
  const precioSize = responsive.getValor({ tablet: 30, normal: 26, small: 22 });
  const seccionTituloSize = responsive.getValor({ tablet: 16, normal: 14, small: 13 });
  const cuerpoSize = responsive.getValor({ tablet: 15, normal: 13, small: 12 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const incrementarCantidad = () => setCantidad((c) => Math.min(c + 1, 99));
  const decrementarCantidad = () => setCantidad((c) => Math.max(c - 1, 1));

  const handleAgregarAlCarrito = useCallback(() => {
    if (!disponible) return;

    agregarProducto(producto, cantidad);

    Alert.alert(
      '🎉 ¡Agregado!',
      `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${producto.nombre} al carrito`,
      [
        { text: 'Seguir viendo', style: 'cancel' },
        {
          text: 'Ver carrito',
          onPress: () => props.navigation.navigate('Carrito'),
        },
      ]
    );
  }, [cantidad, producto, disponible, agregarProducto, props.navigation]);

  const handleToggleFavorito = useCallback(async () => {
    if (!producto?.id) return;

    if (!perfil?.id) {
      Alert.alert(
        'Iniciá sesión',
        'Necesitás una cuenta para guardar tus favoritos.',
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

    const usuarioId = String(perfil.id);
    const productoId = Number(producto.id);

    try {
      if (esFavorito) {
        await eliminarFavoritoManual(usuarioId, productoId);
      } else {
        await agregarFavoritoManual(usuarioId, producto);
      }
    } catch (error) {
      console.error('❌ Error toggle favorito:', error);
      Alert.alert('Error', 'No pudimos actualizar tus favoritos');
    }
  }, [producto, perfil?.id, esFavorito, agregarFavoritoManual, eliminarFavoritoManual, props.navigation]);

  if (!producto) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient
          colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={[styles.errorText, { fontSize: nombreSize }]}>Producto no encontrado</Text>
        <TouchableOpacity
          style={styles.botonVolverError}
          onPress={() => props.navigation.goBack()}
        >
          <Text style={styles.botonVolverErrorText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <LinearGradient
        colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
        style={styles.headerGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 12, small: 10 }),
            paddingHorizontal: padding,
            paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.botonHeader}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={responsive.getValor({ tablet: 28, normal: 24, small: 22 })}
            color={DISENO.colors.surface}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitulo,
            {
              fontSize: responsive.getValor({ tablet: 22, normal: 18, small: 16 }),
              color: DISENO.colors.surface,
            },
          ]}
        >
          Detalle
        </Text>

        <View style={styles.headerBotonesDerecha}>
          <TouchableOpacity
            onPress={handleToggleFavorito}
            style={styles.botonHeader}
            activeOpacity={0.7}
          >
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={responsive.getValor({ tablet: 26, normal: 22, small: 20 })}
              color={esFavorito ? DISENO.colors.accentSecondary : DISENO.colors.surface}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => props.navigation.navigate('Carrito')}
            style={styles.botonHeader}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cart"
              size={responsive.getValor({ tablet: 26, normal: 22, small: 20 })}
              color={DISENO.colors.surface}
            />
            {cantidadTotal() > 0 && (
              <View style={styles.badgeCarrito}>
                <Text style={styles.badgeCarritoTexto}>
                  {cantidadTotal() > 99 ? '99+' : cantidadTotal()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            insets.bottom + responsive.getValor({ tablet: 140, normal: 130, small: 120 }),
        }}
      >
        <Animated.View
          style={[
            styles.imagenContenedor,
            {
              height: imagenHeight,
              marginHorizontal: padding,
              marginTop: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
              borderRadius: imagenRadius,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
          {producto.imagen && !imagenError ? (
            <>
              {imagenCargando && (
                <View style={styles.imagenSkeleton}>
                  <Animated.View style={styles.imagenSkeletonShimmer} />
                </View>
              )}
              <Image
                source={{ uri: producto.imagen }}
                style={[styles.imagen, { opacity: imagenCargando ? 0 : 1 }]}
                resizeMode="cover"
                onLoadStart={() => setImagenCargando(true)}
                onLoad={() => setImagenCargando(false)}
                onError={() => {
                  setImagenCargando(false);
                  setImagenError(true);
                }}
              />
            </>
          ) : (
            <View
              style={[
                styles.imagenPlaceholder,
                { backgroundColor: categoriaInfo.color + '15' },
              ]}
            >
              <Text
                style={[
                  styles.emojiGrande,
                  { fontSize: responsive.getValor({ tablet: 100, normal: 80, small: 60 }) },
                ]}
              >
                {categoriaInfo.icono}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={[categoriaInfo.color, categoriaInfo.color + 'CC']}
            style={[
              styles.categoriaBadge,
              {
                bottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                right: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                paddingHorizontal: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                paddingVertical: responsive.getValor({ tablet: 8, normal: 6, small: 5 }),
                borderRadius: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[
                styles.categoriaTextoImagen,
                {
                  fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  color: DISENO.colors.surface,
                },
              ]}
            >
              {categoriaInfo.icono} {categoriaInfo.label}
            </Text>
          </LinearGradient>

          {!disponible && (
            <LinearGradient
              colors={['#E53935', '#B71C1C']}
              style={[
                styles.badgeNoDisponible,
                {
                  top: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                  left: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                  paddingHorizontal: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                  paddingVertical: responsive.getValor({ tablet: 6, normal: 5, small: 4 }),
                  borderRadius: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeNoDisponibleTexto,
                  { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 9 }) },
                ]}
              >
                No disponible
              </Text>
            </LinearGradient>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.info,
            {
              paddingHorizontal: padding,
              paddingTop: responsive.getValor({ tablet: 24, normal: 20, small: 16 }),
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Text style={[styles.nombre, { fontSize: nombreSize, color: DISENO.colors.text }]}>
            {producto.nombre}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={DISENO.colors.oro} />
              <Text style={styles.ratingTexto}>4.8</Text>
              <Text style={styles.ratingOpiniones}>(120 opiniones)</Text>
            </View>
            <View style={styles.tiempoContainer}>
              <Ionicons name="time-outline" size={16} color={DISENO.colors.textSecondary} />
              <Text style={styles.tiempoTexto}>{tiempoPreparacion}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.precio,
              { fontSize: precioSize, color: DISENO.colors.accent, marginTop: 8 },
            ]}
          >
            {formatearPrecio(precio)}
          </Text>

          {/* ✅ NUEVO: Sección "Incluye" (solo si incluye_papas) */}
          {producto.incluye_papas && (
            <View
              style={[
                styles.incluyeContainer,
                {
                  marginTop: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                  padding: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  borderRadius: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                },
              ]}
            >
              <View style={styles.incluyeHeader}>
                <Ionicons name="gift-outline" size={18} color={DISENO.colors.verde} />
                <Text
                  style={[
                    styles.incluyeTitulo,
                    { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }) },
                  ]}
                >
                  Incluye
                </Text>
              </View>
              <View style={styles.incluyeItem}>
                <Ionicons name="checkmark-circle" size={16} color={DISENO.colors.verde} />
                <Text
                  style={[
                    styles.incluyeTexto,
                    { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }) },
                  ]}
                >
                  🍟 Papas fritas
                </Text>
              </View>
            </View>
          )}

          <View
            style={[
              styles.seccion,
              { marginTop: responsive.getValor({ tablet: 20, normal: 16, small: 12 }) },
            ]}
          >
            <Text
              style={[
                styles.seccionTitulo,
                {
                  fontSize: seccionTituloSize,
                  color: DISENO.colors.text,
                  marginBottom: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                },
              ]}
            >
              📝 Descripción
            </Text>
            <Text
              style={[
                styles.descripcion,
                {
                  fontSize: cuerpoSize,
                  color: DISENO.colors.textSecondary,
                  lineHeight: responsive.getValor({ tablet: 24, normal: 22, small: 20 }),
                },
              ]}
            >
              {producto.descripcion ||
                'Delicioso producto Krusty preparado con ingredientes frescos y la salsa secreta de la casa que lo hace único. ¡Una experiencia de sabor inolvidable!'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          styles.footer,
          {
            paddingHorizontal: padding,
            paddingBottom:
              insets.bottom + responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
            paddingTop: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
            opacity: fadeAnim,
            backgroundColor: DISENO.colors.surface + 'F5',
            borderTopColor: DISENO.colors.border,
          },
        ]}
      >
        <View style={styles.footerContenido}>
          <View
            style={[
              styles.cantidadSelector,
              {
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                borderColor: DISENO.colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.cantidadBoton}
              onPress={decrementarCantidad}
              disabled={cantidad <= 1}
              activeOpacity={0.7}
            >
              <Ionicons
                name="remove"
                size={responsive.getValor({ tablet: 22, normal: 18, small: 16 })}
                color={cantidad <= 1 ? DISENO.colors.textTertiary : DISENO.colors.text}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.cantidadTexto,
                { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }) },
              ]}
            >
              {cantidad}
            </Text>

            <TouchableOpacity
              style={styles.cantidadBoton}
              onPress={incrementarCantidad}
              disabled={cantidad >= 99}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={responsive.getValor({ tablet: 22, normal: 18, small: 16 })}
                color={DISENO.colors.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                opacity: disponible ? 1 : 0.5,
              },
            ]}
            onPress={handleAgregarAlCarrito}
            disabled={!disponible}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                disponible
                  ? [DISENO.colors.accentSecondary, DISENO.colors.accent]
                  : [DISENO.colors.grisClaro, DISENO.colors.gris]
              }
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name={disponible ? 'cart' : 'close-circle'}
                size={responsive.getValor({ tablet: 20, normal: 16, small: 14 })}
                color={DISENO.colors.text}
              />
              <Text
                style={[
                  styles.addButtonText,
                  { fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }) },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {disponible ? `Agregar ${cantidad > 1 ? `(${cantidad})` : ''}` : 'No disponible'}
              </Text>
              {disponible && (
                <View
                  style={[
                    styles.priceButton,
                    {
                      borderRadius: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                      backgroundColor: DISENO.colors.text + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priceButtonText,
                      { fontSize: responsive.getValor({ tablet: 12, normal: 11, small: 10 }) },
                    ]}
                    numberOfLines={1}
                  >
                    {formatearPrecio(precioTotal)}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DISENO.colors.fondo },
  backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerGradiente: {
    position: 'absolute', top: 0, left: 0, right: 0,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    height: '19%',
    shadowColor: DISENO.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  botonHeader: { padding: 4, position: 'relative' },
  headerBotonesDerecha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitulo: {
    fontFamily: FUENTES.display, fontWeight: '400', letterSpacing: 0.5, flex: 1, textAlign: 'center',
  },
  badgeCarrito: {
    position: 'absolute', top: -2, right: -6,
    backgroundColor: DISENO.colors.accentSecondary,
    borderRadius: 8, minWidth: 18, height: 18, paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: DISENO.colors.surface,
  },
  badgeCarritoTexto: {
    color: DISENO.colors.text, fontSize: 8, fontWeight: '600', fontFamily: FUENTES.display,
  },
  errorText: { fontFamily: FUENTES.display, fontWeight: '400', color: DISENO.colors.text, textAlign: 'center' },
  botonVolverError: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: DISENO.colors.accentSecondary, ...DISENO.shadow.sm,
  },
  botonVolverErrorText: {
    fontFamily: FUENTES.display, fontWeight: '400', color: DISENO.colors.text, fontSize: 16,
  },
  scroll: { flex: 1 },
  imagenContenedor: {
    width: 'auto', overflow: 'hidden', position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
    borderWidth: 1, borderColor: DISENO.colors.border,
  },
  imagen: { width: '100%', height: '100%' },
  imagenSkeleton: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: DISENO.colors.surfaceHover,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  imagenSkeletonShimmer: {
    width: '60%', height: 4, borderRadius: 2, backgroundColor: DISENO.colors.borderLight,
  },
  imagenPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  emojiGrande: {},
  categoriaBadge: { position: 'absolute', zIndex: 10 },
  categoriaTextoImagen: {
    fontFamily: FUENTES.display, fontWeight: '400', letterSpacing: 0.5,
  },
  badgeNoDisponible: { position: 'absolute', zIndex: 10 },
  badgeNoDisponibleTexto: {
    fontFamily: FUENTES.regular, color: DISENO.colors.surface, fontWeight: 'bold',
  },
  info: { flex: 1 },
  nombre: { fontFamily: FUENTES.display, fontWeight: '400', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTexto: { fontFamily: FUENTES.display, fontWeight: '400', fontSize: 13, color: DISENO.colors.text },
  ratingOpiniones: { fontFamily: FUENTES.regular, fontSize: 11, color: DISENO.colors.textTertiary },
  tiempoContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tiempoTexto: { fontFamily: FUENTES.regular, fontSize: 12, color: DISENO.colors.textSecondary },
  precio: { fontFamily: FUENTES.display, fontWeight: '400' },
  // ✅ NUEVO: sección "Incluye"
  incluyeContainer: {
    backgroundColor: DISENO.colors.verde + '10',
    borderWidth: 1,
    borderColor: DISENO.colors.verde + '30',
    gap: 6,
  },
  incluyeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  incluyeTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    color: DISENO.colors.verde,
    letterSpacing: 0.3,
  },
  incluyeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incluyeTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
  },
  seccion: { marginTop: 20 },
  seccionTitulo: { fontFamily: FUENTES.display, fontWeight: '400', letterSpacing: 0.3 },
  descripcion: { fontFamily: FUENTES.regular, opacity: 0.9 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1,
    shadowColor: DISENO.colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 8,
  },
  footerContenido: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cantidadSelector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, backgroundColor: DISENO.colors.surface, height: 44,
  },
  cantidadBoton: { width: 40, height: '100%', justifyContent: 'center', alignItems: 'center' },
  cantidadTexto: {
    fontFamily: FUENTES.display, fontWeight: '400', minWidth: 28, textAlign: 'center',
    color: DISENO.colors.text,
  },
  addButton: {
    flex: 1, overflow: 'hidden', elevation: 8,
    shadowColor: DISENO.colors.accentSecondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  addButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, paddingHorizontal: 10, height: 44,
  },
  addButtonText: {
    fontFamily: FUENTES.display, fontWeight: '300', letterSpacing: 0.3,
    color: DISENO.colors.text, flexShrink: 1,
  },
  priceButton: { paddingHorizontal: 4, paddingVertical: 0, flexShrink: 0 },
  priceButtonText: { fontFamily: FUENTES.display, fontWeight: '400', color: DISENO.colors.text },
});