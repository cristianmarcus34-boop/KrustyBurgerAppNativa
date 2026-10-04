// screens/cliente/PantallaDetalleProducto.tsx - V2 Premium (Rediseño Visual + Tamaños escalados)
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
import * as Haptics from 'expo-haptics';
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
  const [cantidadAnim] = useState(new Animated.Value(1));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

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

  // ============================================================
  // ✅ TAMAÑOS ESCALADOS (jerarquía visual pro)
  // ============================================================
  const padding = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
  const imagenHeight = responsive.getValor({ tablet: 480, normal: 380, small: 300 });
  const imagenRadius = responsive.getValor({ tablet: 28, normal: 24, small: 20 });
  const nombreSize = responsive.getValor({ tablet: 34, normal: 30, small: 25 });
  const precioSize = responsive.getValor({ tablet: 38, normal: 32, small: 26 });
  const seccionTituloSize = responsive.getValor({ tablet: 20, normal: 17, small: 15 });
  const cuerpoSize = responsive.getValor({ tablet: 17, normal: 15, small: 14 });
  const headerTituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 18 });
  const iconSize = responsive.getValor({ tablet: 24, normal: 21, small: 19 });
  const iconButtonSize = responsive.getValor({ tablet: 44, normal: 40, small: 36 });
  const ratingTextSize = responsive.getValor({ tablet: 15, normal: 14, small: 13 });
  const metaPaddingH = responsive.getValor({ tablet: 12, normal: 10, small: 8 });
  const metaPaddingV = responsive.getValor({ tablet: 6, normal: 5, small: 4 });
  const sectionSpacing = responsive.getValor({ tablet: 26, normal: 22, small: 18 });
  const bottomSpacing = responsive.getValor({ tablet: 160, normal: 145, small: 130 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.spring(badgeScale, {
      toValue: 1,
      delay: 400,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const incrementarCantidad = () => {
    if (cantidad >= 99) return;
    Haptics.selectionAsync().catch(() => { });
    setCantidad((c) => Math.min(c + 1, 99));
    Animated.sequence([
      Animated.timing(cantidadAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.spring(cantidadAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const decrementarCantidad = () => {
    if (cantidad <= 1) return;
    Haptics.selectionAsync().catch(() => { });
    setCantidad((c) => Math.max(c - 1, 1));
    Animated.sequence([
      Animated.timing(cantidadAnim, { toValue: 0.85, duration: 120, useNativeDriver: true }),
      Animated.spring(cantidadAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleAgregarAlCarrito = useCallback(() => {
    if (!disponible) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
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

    Haptics.selectionAsync().catch(() => { });

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
        <View style={styles.errorIconWrap}>
          <Ionicons name="fast-food-outline" size={42} color={DISENO.colors.accent} />
        </View>
        <Text style={[styles.errorText, { fontSize: nombreSize }]}>Producto no encontrado</Text>
        <TouchableOpacity
          style={styles.botonVolverError}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.botonVolverErrorText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* FONDO */}
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* HEADER GRADIENTE CON CURVA ABAJO */}
      <LinearGradient
        colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
        style={[
          styles.headerGradiente,
          {
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* HEADER */}
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
          onPress={() => {
            Haptics.selectionAsync().catch(() => { });
            props.navigation.goBack();
          }}
          style={[
            styles.botonHeader,
            {
              width: iconButtonSize,
              height: iconButtonSize,
              borderRadius: iconButtonSize / 2,
            },
          ]}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-back"
            size={iconSize}
            color={DISENO.colors.surface}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitulo,
            {
              fontSize: headerTituloSize,
              color: DISENO.colors.surface,
            },
          ]}
          numberOfLines={1}
        >
          Detalle
        </Text>

        <View style={styles.headerBotonesDerecha}>
          <TouchableOpacity
            onPress={handleToggleFavorito}
            style={[
              styles.botonHeader,
              {
                width: iconButtonSize,
                height: iconButtonSize,
                borderRadius: iconButtonSize / 2,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={iconSize}
              color={esFavorito ? DISENO.colors.accentSecondary : DISENO.colors.surface}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => props.navigation.navigate('Carrito')}
            style={[
              styles.botonHeader,
              {
                width: iconButtonSize,
                height: iconButtonSize,
                borderRadius: iconButtonSize / 2,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name="cart"
              size={iconSize}
              color={DISENO.colors.surface}
            />
            {cantidadTotal() > 0 && (
              <Animated.View
                style={[
                  styles.badgeCarrito,
                  { transform: [{ scale: badgeScale }] },
                ]}
              >
                <Text style={styles.badgeCarritoTexto}>
                  {cantidadTotal() > 99 ? '99+' : cantidadTotal()}
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* SCROLL */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + bottomSpacing,
        }}
      >
        {/* IMAGEN PRINCIPAL */}
        <Animated.View
          style={[
            styles.imagenContenedor,
            {
              height: imagenHeight,
              marginHorizontal: padding,
              marginTop: responsive.getValor({ tablet: 18, normal: 16, small: 12 }),
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
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.25)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.55 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
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

          {/* Badge de categoría (glass) */}
          <View
            style={[
              styles.categoriaBadge,
              {
                bottom: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                right: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                paddingHorizontal: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                paddingVertical: responsive.getValor({ tablet: 8, normal: 7, small: 6 }),
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
              },
            ]}
          >
            <Text
              style={[
                styles.categoriaTextoImagen,
                {
                  fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }),
                },
              ]}
            >
              {categoriaInfo.icono} {categoriaInfo.label}
            </Text>
          </View>

          {/* Badge NO disponible */}
          {!disponible && (
            <LinearGradient
              colors={['#E53935', '#B71C1C']}
              style={[
                styles.badgeNoDisponible,
                {
                  top: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                  left: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                  paddingHorizontal: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                  paddingVertical: responsive.getValor({ tablet: 7, normal: 6, small: 5 }),
                  borderRadius: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginRight: 5 }} />
              <Text
                style={[
                  styles.badgeNoDisponibleTexto,
                  { fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 10 }) },
                ]}
              >
                No disponible
              </Text>
            </LinearGradient>
          )}

          {/* Precio flotante */}
          <View
            style={[
              styles.precioFlotante,
              {
                top: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                right: responsive.getValor({ tablet: 18, normal: 14, small: 12 }),
                paddingHorizontal: responsive.getValor({ tablet: 16, normal: 14, small: 11 }),
                paddingVertical: responsive.getValor({ tablet: 9, normal: 8, small: 6 }),
                borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
              },
            ]}
          >
            <Text
              style={[
                styles.precioFlotanteTexto,
                { fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }) },
              ]}
            >
              {formatearPrecio(precio)}
            </Text>
          </View>
        </Animated.View>

        {/* INFO */}
        <Animated.View
          style={[
            styles.info,
            {
              paddingHorizontal: padding,
              paddingTop: sectionSpacing,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Text style={[styles.nombre, { fontSize: nombreSize, color: DISENO.colors.text }]}>
            {producto.nombre}
          </Text>

          {/* META */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.ratingContainer,
                {
                  paddingHorizontal: metaPaddingH,
                  paddingVertical: metaPaddingV,
                },
              ]}
            >
              <Ionicons name="star" size={ratingTextSize} color="#FFB800" />
              <Text style={[styles.ratingTexto, { fontSize: ratingTextSize }]}>4.8</Text>
              <Text style={[styles.ratingOpiniones, { fontSize: ratingTextSize - 2 }]}>(120)</Text>
            </View>

            <View style={styles.dotSeparator} />

            <View
              style={[
                styles.tiempoContainer,
                {
                  paddingHorizontal: metaPaddingH,
                  paddingVertical: metaPaddingV,
                },
              ]}
            >
              <Ionicons name="time-outline" size={ratingTextSize} color={DISENO.colors.textSecondary} />
              <Text style={[styles.tiempoTexto, { fontSize: ratingTextSize }]}>
                {tiempoPreparacion}
              </Text>
            </View>
          </View>

          {/* PRECIO destacado */}
          <View style={styles.precioRow}>
            <Text
              style={[
                styles.precio,
                { fontSize: precioSize, color: DISENO.colors.accent },
              ]}
            >
              {formatearPrecio(precio)}
            </Text>
            <Text style={[styles.precioUnidad, { fontSize: cuerpoSize - 3 }]}> / unidad</Text>
          </View>

          {/* SECCIÓN "INCLUYE" */}
          {producto.incluye_papas && (
            <View
              style={[
                styles.incluyeContainer,
                {
                  marginTop: sectionSpacing - 4,
                  padding: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                  borderRadius: responsive.getValor({ tablet: 16, normal: 14, small: 12 }),
                },
              ]}
            >
              <LinearGradient
                colors={[DISENO.colors.verde + '18', DISENO.colors.verde + '06']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.incluyeHeader}>
                <View style={styles.incluyeIconWrap}>
                  <Ionicons name="gift" size={ratingTextSize + 1} color="#FFF" />
                </View>
                <Text
                  style={[
                    styles.incluyeTitulo,
                    { fontSize: cuerpoSize },
                  ]}
                >
                  Incluye en tu pedido
                </Text>
              </View>
              <View style={styles.incluyeItem}>
                <View style={styles.incluyeCheckWrap}>
                  <Ionicons name="checkmark" size={ratingTextSize - 2} color="#FFF" />
                </View>
                <Text
                  style={[
                    styles.incluyeTexto,
                    { fontSize: cuerpoSize },
                  ]}
                >
                  🍟 Papas fritas
                </Text>
              </View>
            </View>
          )}

          {/* DESCRIPCIÓN */}
          <View style={[styles.seccion, { marginTop: sectionSpacing }]}>
            <View style={styles.seccionHeader}>
              <View style={styles.seccionAccent} />
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
                Descripción
              </Text>
            </View>
            <Text
              style={[
                styles.descripcion,
                {
                  fontSize: cuerpoSize,
                  color: DISENO.colors.textSecondary,
                  lineHeight: cuerpoSize * 1.55,
                },
              ]}
            >
              {producto.descripcion ||
                'Delicioso producto Krusty preparado con ingredientes frescos y la salsa secreta de la casa que lo hace único. ¡Una experiencia de sabor inolvidable!'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* FOOTER */}
      <Animated.View
        style={[
          styles.footer,
          {
            paddingHorizontal: padding,
            paddingBottom:
              insets.bottom + responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
            paddingTop: responsive.getValor({ tablet: 12, normal: 10, small: 8 }),
            opacity: fadeAnim,
          },
        ]}
      >
        <LinearGradient
          colors={[DISENO.colors.surface + '00', DISENO.colors.surface + 'F8', DISENO.colors.surface]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.footerContenido}>
          {/* SELECTOR DE CANTIDAD */}
          <View
            style={[
              styles.cantidadSelector,
              {
                borderRadius: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                height: iconButtonSize + 8,
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
                size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })}
                color={cantidad <= 1 ? DISENO.colors.textTertiary : DISENO.colors.text}
              />
            </TouchableOpacity>

            <Animated.Text
              style={[
                styles.cantidadTexto,
                {
                  fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }),
                  transform: [{ scale: cantidadAnim }],
                },
              ]}
            >
              {cantidad}
            </Animated.Text>

            <TouchableOpacity
              style={styles.cantidadBoton}
              onPress={incrementarCantidad}
              disabled={cantidad >= 99}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })}
                color={DISENO.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* BOTÓN AGREGAR */}
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
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                disponible
                  ? [DISENO.colors.accentSecondary, DISENO.colors.accent]
                  : [DISENO.colors.grisClaro, DISENO.colors.gris]
              }
              style={[styles.addButtonGradient, { height: iconButtonSize + 8 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.addButtonIconWrap}>
                <Ionicons
                  name={disponible ? 'cart' : 'close-circle'}
                  size={responsive.getValor({ tablet: 18, normal: 15, small: 13 })}
                  color={DISENO.colors.text}
                />
              </View>
              <Text
                style={[
                  styles.addButtonText,
                  { fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }) },
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
                    { borderRadius: responsive.getValor({ tablet: 10, normal: 8, small: 6 }) },
                  ]}
                >
                  <Text
                    style={[
                      styles.priceButtonText,
                      { fontSize: responsive.getValor({ tablet: 13, normal: 12, small: 11 }) },
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

  // ---------- HEADER ----------
  headerGradiente: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '19%',
    shadowColor: DISENO.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  botonHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    position: 'relative',
  },
  headerBotonesDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  badgeCarrito: {
    position: 'absolute', top: -3, right: -5,
    backgroundColor: DISENO.colors.accentSecondary,
    borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: DISENO.colors.surface,
  },
  badgeCarritoTexto: {
    color: DISENO.colors.text, fontSize: 9, fontWeight: '700', fontFamily: FUENTES.display,
  },

  // ---------- ERROR ----------
  errorIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: DISENO.colors.accent + '12',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1,
    borderColor: DISENO.colors.accent + '25',
  },
  errorText: {
    fontFamily: FUENTES.display, fontWeight: '400',
    color: DISENO.colors.text, textAlign: 'center',
  },
  botonVolverError: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: DISENO.colors.accentSecondary,
    shadowColor: DISENO.colors.accentSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  botonVolverErrorText: {
    fontFamily: FUENTES.display, fontWeight: '400',
    color: DISENO.colors.text, fontSize: 16,
  },

  // ---------- SCROLL / IMAGEN ----------
  scroll: { flex: 1 },
  imagenContenedor: {
    width: 'auto', overflow: 'hidden', position: 'relative',
    backgroundColor: DISENO.colors.surfaceHover,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
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

  categoriaBadge: {
    position: 'absolute', zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriaTextoImagen: {
    fontFamily: FUENTES.display, fontWeight: '400',
    letterSpacing: 0.3, color: DISENO.colors.text,
  },
  badgeNoDisponible: {
    position: 'absolute', zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  badgeNoDisponibleTexto: {
    fontFamily: FUENTES.regular, color: '#FFF', fontWeight: 'bold',
  },
  precioFlotante: {
    position: 'absolute', zIndex: 10,
    backgroundColor: DISENO.colors.accent,
    shadowColor: DISENO.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  precioFlotanteTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },

  // ---------- INFO ----------
  info: { flex: 1 },
  nombre: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
    lineHeight: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF6E0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFE5A8',
  },
  ratingTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    color: DISENO.colors.text,
  },
  ratingOpiniones: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
  },
  dotSeparator: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: DISENO.colors.textTertiary,
  },
  tiempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: DISENO.colors.surfaceHover,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  tiempoTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textSecondary,
  },
  precioRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
  },
  precio: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  precioUnidad: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.textTertiary,
  },

  // ---------- INCLUYE ----------
  incluyeContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: DISENO.colors.verde + '30',
    gap: 10,
    overflow: 'hidden',
    shadowColor: DISENO.colors.verde,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 2,
  },
  incluyeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  incluyeIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: DISENO.colors.verde,
    alignItems: 'center', justifyContent: 'center',
  },
  incluyeTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '600',
    color: DISENO.colors.verde,
    letterSpacing: 0.3,
  },
  incluyeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  incluyeCheckWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: DISENO.colors.verde,
    alignItems: 'center', justifyContent: 'center',
  },
  incluyeTexto: {
    fontFamily: FUENTES.regular,
    color: DISENO.colors.text,
    fontWeight: '500',
  },

  // ---------- DESCRIPCIÓN ----------
  seccion: {},
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  seccionAccent: {
    width: 4, height: 22, borderRadius: 2,
    backgroundColor: DISENO.colors.accent,
    marginRight: 10,
  },
  seccionTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  descripcion: {
    fontFamily: FUENTES.regular,
    opacity: 0.9,
  },

  // ---------- FOOTER ----------
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    borderTopColor: DISENO.colors.border,
    shadowColor: DISENO.colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 12,
    overflow: 'hidden',
  },
  footerContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cantidadSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DISENO.colors.border,
    backgroundColor: DISENO.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cantidadBoton: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
    color: DISENO.colors.text,
  },
  addButton: {
    flex: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: DISENO.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: DISENO.colors.text,
    flexShrink: 1,
  },
  priceButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  priceButtonText: {
    fontFamily: FUENTES.display,
    fontWeight: '700',
    color: DISENO.colors.text,
    letterSpacing: -0.2,
  },
});