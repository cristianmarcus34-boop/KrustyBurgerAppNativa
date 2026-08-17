// screens/cliente/PantallaDetalleProducto.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Producto } from '../../lib/tipos';
import { Colores, getTematica } from '../../lib/colores';

// ============================================================
// 📐 SISTEMA DE DISEÑO
// ============================================================
const DISEÑO = {
  BREAKPOINTS: {
    TABLET: 768,
    DESKTOP: 1024,
    SMALL_PHONE: 375,
  },
  TIPOGRAFIA: {
    HERO: { tablet: 38, normal: 30, small: 24 },
    TITULO: { tablet: 26, normal: 22, small: 18 },
    SUBTITULO: { tablet: 20, normal: 18, small: 16 },
    CUERPO: { tablet: 17, normal: 15, small: 13 },
    PEQUENO: { tablet: 15, normal: 13, small: 11 },
    MICRO: { tablet: 13, normal: 11, small: 9 },
  },
  ESPACIADO: {
    XL: { tablet: 48, normal: 32, small: 20 },
    LG: { tablet: 36, normal: 24, small: 16 },
    MD: { tablet: 28, normal: 20, small: 14 },
    SM: { tablet: 20, normal: 16, small: 12 },
    XS: { tablet: 14, normal: 10, small: 8 },
  },
  RADIO: {
    LG: { tablet: 28, normal: 20, small: 16 },
    MD: { tablet: 20, normal: 16, small: 12 },
    SM: { tablet: 14, normal: 10, small: 8 },
    XS: { tablet: 10, normal: 8, small: 6 },
  },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = Dimensions.get('window');

  const isTablet = width >= DISEÑO.BREAKPOINTS.TABLET;
  const isDesktop = width >= DISEÑO.BREAKPOINTS.DESKTOP;
  const isSmallPhone = width < DISEÑO.BREAKPOINTS.SMALL_PHONE;

  const getValor = useCallback((
    valores: { tablet: any; normal: any; small: any }
  ) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const getTexto = useCallback((
    escala: keyof typeof DISEÑO.TIPOGRAFIA
  ) => getValor(DISEÑO.TIPOGRAFIA[escala]), [getValor]);

  const getEspaciado = useCallback((
    escala: keyof typeof DISEÑO.ESPACIADO
  ) => getValor(DISEÑO.ESPACIADO[escala]), [getValor]);

  const getRadio = useCallback((
    escala: keyof typeof DISEÑO.RADIO
  ) => getValor(DISEÑO.RADIO[escala]), [getValor]);

  return {
    isTablet,
    isDesktop,
    isSmallPhone,
    width,
    height,
    getValor,
    getTexto,
    getEspaciado,
    getRadio,
  };
};

// ============================================================
// 📋 ETIQUETAS DE CATEGORÍAS
// ============================================================
const CATEGORIAS_ETIQUETAS: Record<string, { label: string; icono: string; color: string }> = {
  'burgers': { label: 'Hamburguesa', icono: '🍔', color: Colores.acento },
  'combos': { label: 'Combo', icono: '🍟', color: Colores.primario },
  'bebidas': { label: 'Bebida', icono: '🥤', color: Colores.azulHomero },
  'postres': { label: 'Postre', icono: '🍦', color: Colores.rosaMaggie },
  'acompanantes': { label: 'Acompañante', icono: '🍿', color: Colores.verdeKrusty },
};

// ============================================================
// 🏠 PANTALLA DETALLE PRODUCTO - SIN ENVÍO ESTIMADO
// ============================================================
export default function PantallaDetalleProducto(props: any) {
  // ✅ Hooks
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const temaKrusty = getTematica('krusty');

  // ✅ Obtener producto
  const producto: Producto = props.route?.params?.producto;

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;

  // ✅ Cálculo de precios
  const precio = useMemo(() =>
    typeof producto?.precio === 'number' ? producto.precio : Number(producto?.precio || 0)
    , [producto]);

  // ✅ Información de categoría
  const categoriaInfo = useMemo(() =>
    CATEGORIAS_ETIQUETAS[producto?.categoria || ''] || {
      label: 'Producto',
      icono: '🍔',
      color: Colores.secundario
    }
    , [producto]);

  // ============================================================
  // 📦 CÁLCULOS DE TAMAÑOS
  // ============================================================
  const tamanos = useMemo(() => ({
    padding: responsive.getEspaciado('LG'),
    imagenHeight: responsive.getValor({ tablet: 420, normal: 320, small: 240 }),
  }), [responsive]);

  // ============================================================
  // 🎬 EFECTOS
  // ============================================================
  useEffect(() => {
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
      Animated.spring(imageScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ============================================================
  // 🚫 VALIDACIÓN DE PRODUCTO
  // ============================================================
  if (!producto) {
    return (
      <View style={[styles.contenedor, { backgroundColor: Colores.fondoOscuro, justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
          style={styles.fondoGradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={[styles.errorTexto, { color: Colores.textoClaro, fontSize: responsive.getTexto('TITULO') }]}>
          Producto no encontrado
        </Text>
        <TouchableOpacity
          style={[styles.botonVolverError, { marginTop: 20 }]}
          onPress={() => props.navigation.goBack()}
        >
          <Text style={{ color: temaKrusty.secundario, fontWeight: 'bold' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // 🏗️ RENDER PRINCIPAL
  // ============================================================
  const padding = tamanos.padding;

  return (
    <View style={[styles.contenedor, { backgroundColor: Colores.fondoOscuro }]}>
      {/* Gradiente de fondo */}
      <LinearGradient
        colors={[temaKrusty.primario, Colores.verdeKrusty, Colores.fondoOscuro]}
        style={styles.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ============================================================ */}
      {/* 🔹 HEADER */}
      {/* ============================================================ */}
      <Animated.View style={[
        styles.header,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
          paddingHorizontal: padding,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 8 }),
          opacity: fadeAnim,
          transform: [{ translateY: slideUpAnim }],
        }
      ]}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.botonVolver}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[Colores.fondoOscuro + '60', Colores.fondoOscuro + '30']}
            style={styles.botonVolverGradient}
          >
            <Ionicons name="arrow-back" size={responsive.getValor({ tablet: 26, normal: 22, small: 18 })} color={Colores.textoClaro} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[
          styles.headerTitulo,
          {
            fontSize: responsive.getValor({ tablet: 15, normal: 13, small: 11 }),
            color: Colores.textoClaro,
            opacity: 0.8,
          }
        ]}>
          Detalle del producto
        </Text>

        <TouchableOpacity
          onPress={() => props.navigation.navigate('Carrito')}
          style={styles.botonCarrito}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[temaKrusty.secundario, temaKrusty.primario]}
            style={styles.botonCarritoGradient}
          >
            <Ionicons name="cart" size={responsive.getValor({ tablet: 20, normal: 18, small: 16 })} color={Colores.textoOscuro} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================ */}
      {/* 🔹 CONTENIDO */}
      {/* ============================================================ */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + responsive.getValor({ tablet: 40, normal: 30, small: 20 }),
        }}
      >
        {/* Imagen */}
        <Animated.View style={[
          styles.imagenContenedor,
          {
            height: tamanos.imagenHeight,
            transform: [{ scale: imageScale }],
          }
        ]}>
          {producto.imagen ? (
            <Image
              source={{ uri: producto.imagen }}
              style={styles.imagen}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              styles.imagenPlaceholder,
              { backgroundColor: Colores.secundario + '15' }
            ]}>
              <Text style={[styles.emojiGrande, { fontSize: responsive.getValor({ tablet: 100, normal: 80, small: 60 }) }]}>
                {categoriaInfo.icono}
              </Text>
            </View>
          )}

          {/* Badge de categoría */}
          <LinearGradient
            colors={[categoriaInfo.color + '80', categoriaInfo.color + '40']}
            style={[
              styles.categoriaBadge,
              {
                bottom: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
                right: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
                paddingHorizontal: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
                paddingVertical: responsive.getValor({ tablet: 8, normal: 6, small: 5 }),
                borderRadius: responsive.getRadio('SM'),
                borderColor: Colores.textoClaro + '15',
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[
              styles.categoriaTextoImagen,
              {
                fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 10 }),
                color: Colores.textoClaro,
              }
            ]}>
              {categoriaInfo.icono} {categoriaInfo.label}
            </Text>
          </LinearGradient>

          {/* Badge de disponibilidad */}
          {producto.disponible === false && (
            <LinearGradient
              colors={['#E53935', '#B71C1C']}
              style={[
                styles.badgeNoDisponible,
                {
                  top: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
                  left: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
                  paddingHorizontal: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                  paddingVertical: responsive.getValor({ tablet: 6, normal: 5, small: 4 }),
                  borderRadius: responsive.getRadio('XS'),
                }
              ]}
            >
              <Text style={[
                styles.badgeNoDisponibleTexto,
                { fontSize: responsive.getValor({ tablet: 12, normal: 10, small: 9 }) }
              ]}>
                No disponible
              </Text>
            </LinearGradient>
          )}
        </Animated.View>

        {/* Información */}
        <Animated.View
          style={[
            styles.info,
            {
              paddingHorizontal: padding,
              paddingTop: responsive.getValor({ tablet: 24, normal: 20, small: 16 }),
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            }
          ]}
        >
          {/* Nombre y precio */}
          <View style={styles.encabezado}>
            <View style={styles.encabezadoIzquierdo}>
              <Text style={[
                styles.nombre,
                {
                  fontSize: responsive.getTexto('TITULO'),
                  color: Colores.textoClaro,
                }
              ]}>
                {producto.nombre}
              </Text>
              <Text style={[
                styles.precio,
                {
                  fontSize: responsive.getTexto('HERO'),
                  color: temaKrusty.secundario,
                  marginTop: 4,
                }
              ]}>
                ${precio.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Descripción */}
          <View style={[
            styles.seccion,
            {
              marginTop: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
            }
          ]}>
            <Text style={[
              styles.seccionTitulo,
              {
                fontSize: responsive.getTexto('SUBTITULO'),
                color: Colores.textoClaro,
                marginBottom: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
              }
            ]}>
              📝 Descripción
            </Text>
            <Text style={[
              styles.descripcion,
              {
                fontSize: responsive.getTexto('CUERPO'),
                color: Colores.textoGris,
                lineHeight: responsive.getValor({ tablet: 28, normal: 24, small: 20 }),
              }
            ]}>
              {producto.descripcion || 'Deliciosa hamburguesa Krusty preparada con ingredientes frescos y la salsa secreta de la casa que la hace única. ¡Una experiencia de sabor inolvidable!'}
            </Text>
          </View>

          {/* Información Nutricional */}
          <View style={[
            styles.seccion,
            {
              marginTop: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
              marginBottom: responsive.getValor({ tablet: 20, normal: 16, small: 12 }),
            }
          ]}>
            <Text style={[
              styles.seccionTitulo,
              {
                fontSize: responsive.getTexto('SUBTITULO'),
                color: Colores.textoClaro,
                marginBottom: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
              }
            ]}>
              📊 Información Nutricional
            </Text>
            <View style={[
              styles.nutricional,
              {
                gap: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
              }
            ]}>
              {[
                { emoji: '🔥', label: 'Calorías', valor: '850' },
                { emoji: '🍗', label: 'Proteínas', valor: '35g' },
                { emoji: '🧈', label: 'Grasas', valor: '42g' },
                { emoji: '🍞', label: 'Carbohidratos', valor: '55g' },
              ].map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.nutriItem,
                    {
                      padding: responsive.getValor({ tablet: 14, normal: 10, small: 8 }),
                      borderRadius: responsive.getRadio('SM'),
                      width: responsive.getValor({ tablet: '24%', normal: '23%', small: '22%' }),
                      backgroundColor: Colores.fondoOscuro + '30',
                      borderColor: Colores.textoClaro + '6',
                      borderWidth: 1,
                    }
                  ]}
                >
                  <Text style={[
                    styles.nutriValor,
                    { fontSize: responsive.getValor({ tablet: 28, normal: 22, small: 18 }) }
                  ]}>
                    {item.emoji}
                  </Text>
                  <Text style={[
                    styles.nutriTexto,
                    {
                      fontSize: responsive.getValor({ tablet: 13, normal: 11, small: 9 }),
                      color: Colores.textoGris,
                      marginTop: 2,
                      textAlign: 'center',
                      fontWeight: '600',
                    }
                  ]}>
                    {item.valor}
                  </Text>
                  <Text style={[
                    styles.nutriLabel,
                    {
                      fontSize: responsive.getValor({ tablet: 10, normal: 9, small: 8 }),
                      color: Colores.textoGris,
                      opacity: 0.5,
                      textAlign: 'center',
                      marginTop: 1,
                    }
                  ]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colores.textoClaro + '8',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  botonVolver: {
    padding: 4,
  },
  botonVolverGradient: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitulo: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  botonCarrito: {
    padding: 4,
  },
  botonCarritoGradient: {
    padding: 8,
    borderRadius: 20,
  },

  // Error
  errorTexto: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botonVolverError: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colores.fondoOscuro + '40',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },

  // Scroll
  scroll: {
    flex: 1,
  },

  // Imagen
  imagenContenedor: {
    width: '100%',
    position: 'relative',
    backgroundColor: Colores.fondoOscuro + '40',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiGrande: {},
  categoriaBadge: {
    position: 'absolute',
    borderWidth: 1,
    zIndex: 10,
  },
  categoriaTextoImagen: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badgeNoDisponible: {
    position: 'absolute',
    zIndex: 10,
  },
  badgeNoDisponibleTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
  },

  // Información
  info: {
    flex: 1,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  encabezadoIzquierdo: {
    flex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  precio: {
    fontWeight: 'bold',
  },

  // Secciones
  seccion: {
    marginTop: 20,
  },
  seccionTitulo: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  descripcion: {
    opacity: 0.9,
  },

  // Nutricional
  nutricional: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutriItem: {
    alignItems: 'center',
  },
  nutriValor: {},
  nutriTexto: {
    fontWeight: '600',
  },
  nutriLabel: {},
});