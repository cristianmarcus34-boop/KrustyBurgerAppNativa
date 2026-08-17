// components/TarjetaProducto.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Producto } from '../lib/tipos';
import { Colores, getTematica } from '../lib/colores';

// ✅ IMPORTAR FORMATEADOR DE PRECIOS
import { formatearPrecio } from '../lib/formateador';

const { width } = Dimensions.get('window');

interface Props {
  producto: Producto;
  onAgregar: (producto: Producto) => void;
  onDetalle: (producto: Producto) => void;
  modoGrid?: boolean;
}

export default function TarjetaProducto({ producto, onAgregar, onDetalle, modoGrid = true }: Props) {
  const temaKrusty = getTematica('krusty');

  // ✅ Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(20)).current;

  // ✅ Estados
  const [isPressed, setIsPressed] = useState(false);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);

  // ✅ Efecto de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Manejadores con feedback visual
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleAgregar = () => {
    setMostrarFeedback(true);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        friction: 3,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onAgregar(producto);

    setTimeout(() => {
      setMostrarFeedback(false);
    }, 1500);
  };

  // ✅ Obtener color de categoría
  const getColorCategoria = (categoria: string) => {
    const colores: Record<string, string> = {
      'burgers': Colores.acento,
      'combos': Colores.primario,
      'bebidas': Colores.azulHomero,
      'postres': Colores.rosaMaggie,
      'acompanantes': Colores.verdeKrusty,
    };
    return colores[categoria] || Colores.secundario;
  };

  const colorCategoria = getColorCategoria(producto.categoria || '');
  const isDisponible = producto.disponible !== false;
  const esPopular = producto.popular || producto.precio < 5;
  const esPremium = producto.precio > 15; // ✅ Definimos qué es premium

  // ✅ TAMAÑOS RESPONSIVOS
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  // ✅ Cálculo de anchos
  let cardWidth;
  if (modoGrid) {
    const paddingHorizontal = 16;
    const gapEntreColumnas = isTablet ? 20 : 14;
    const columnas = 2;
    const espacioTotal = (paddingHorizontal * 2) + (gapEntreColumnas * (columnas - 1));
    cardWidth = (width - espacioTotal) / columnas;
  } else {
    cardWidth = width - 32;
  }

  // ✅ Tamaños para modo grid
  const imagenHeight = modoGrid
    ? (isTablet ? 140 : isSmallPhone ? 100 : 120)
    : (isTablet ? 180 : 150);

  const paddingCard = modoGrid
    ? (isTablet ? 12 : isSmallPhone ? 10 : 11)
    : (isTablet ? 16 : 14);

  const nombreSize = modoGrid
    ? (isTablet ? 15 : isSmallPhone ? 12 : 14)
    : (isTablet ? 18 : 16);

  const precioSize = modoGrid
    ? (isTablet ? 18 : isSmallPhone ? 15 : 16)
    : (isTablet ? 22 : 19);

  const descripcionSize = modoGrid
    ? (isTablet ? 12 : isSmallPhone ? 10 : 11)
    : (isTablet ? 14 : 12);

  const botonSize = modoGrid
    ? (isTablet ? 32 : isSmallPhone ? 28 : 30)
    : (isTablet ? 40 : 36);

  const emojiSize = modoGrid
    ? (isTablet ? 45 : isSmallPhone ? 30 : 40)
    : (isTablet ? 55 : 45);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideUpAnim },
            { scale: scaleAnim },
          ],
          width: cardWidth,
          marginBottom: isTablet ? 14 : 10,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          estilos.tarjeta,
          {
            backgroundColor: Colores.fondoOscuro + '80',
            borderColor: isPressed ? colorCategoria + '50' : Colores.textoClaro + '8',
            borderRadius: isTablet ? 16 : isSmallPhone ? 12 : 14,
            padding: paddingCard,
          }
        ]}
        onPress={() => onDetalle(producto)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!isDisponible}
      >
        {/* ✅ Gradiente de fondo sutil */}
        <LinearGradient
          colors={[colorCategoria + '06', 'transparent']}
          style={estilos.gradienteFondo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* ============================================================ */}
        {/* 🔹 IMAGEN / PLACEHOLDER */}
        {/* ============================================================ */}
        <View style={[
          estilos.imagenContainer,
          {
            height: imagenHeight,
            borderRadius: isTablet ? 12 : isSmallPhone ? 10 : 11,
            backgroundColor: colorCategoria + '12',
          }
        ]}>
          {producto.imagen ? (
            <Image
              source={{ uri: producto.imagen }}
              style={[estilos.imagen, { borderRadius: isTablet ? 12 : isSmallPhone ? 10 : 11 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={estilos.emojiContainer}>
              <Text style={[estilos.emoji, { fontSize: emojiSize }]}>
                {producto.categoria === 'burgers' ? '🍔' :
                  producto.categoria === 'combos' ? '🍟' :
                    producto.categoria === 'bebidas' ? '🥤' :
                      producto.categoria === 'postres' ? '🍦' : '🍿'}
              </Text>
            </View>
          )}

          {/* ✅ Badge de popular */}
          {esPopular && isDisponible && (
            <View style={[
              estilos.badgePopular,
              {
                backgroundColor: temaKrusty.primario,
                paddingHorizontal: isTablet ? 8 : 6,
                paddingVertical: isTablet ? 3 : 2,
                borderRadius: isTablet ? 10 : 8,
                top: isTablet ? 8 : 6,
                right: isTablet ? 8 : 6,
                gap: 3,
              }
            ]}>
              <Ionicons name="flame" size={isTablet ? 12 : 10} color={Colores.textoClaro} />
              <Text style={[
                estilos.badgePopularTexto,
                { fontSize: isTablet ? 10 : 8 }
              ]}>
                Popular
              </Text>
            </View>
          )}

          {/* ✅ Badge de no disponible */}
          {!isDisponible && (
            <View style={[
              estilos.badgeNoDisponible,
              {
                backgroundColor: 'rgba(0,0,0,0.75)',
                paddingHorizontal: isTablet ? 10 : 8,
                paddingVertical: isTablet ? 5 : 3,
                borderRadius: isTablet ? 10 : 8,
              }
            ]}>
              <Text style={[
                estilos.badgeNoDisponibleTexto,
                { fontSize: isTablet ? 11 : 9 }
              ]}>
                No disponible
              </Text>
            </View>
          )}

          {/* ✅ Categoría tag */}
          <View style={[
            estilos.categoriaTag,
            {
              backgroundColor: colorCategoria + '25',
              paddingHorizontal: isTablet ? 8 : 6,
              paddingVertical: isTablet ? 3 : 2,
              borderRadius: isTablet ? 10 : 8,
              bottom: isTablet ? 8 : 6,
              left: isTablet ? 8 : 6,
            }
          ]}>
            <Text style={[
              estilos.categoriaTagTexto,
              {
                fontSize: isTablet ? 10 : 8,
                color: colorCategoria,
              }
            ]}>
              {producto.categoria || 'Producto'}
            </Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 🔹 INFORMACIÓN */}
        {/* ============================================================ */}
        <View style={[
          estilos.infoContainer,
          {
            paddingTop: isTablet ? 10 : isSmallPhone ? 8 : 10,
            gap: isTablet ? 3 : 2,
          }
        ]}>
          <Text style={[
            estilos.nombre,
            {
              fontSize: nombreSize,
              color: Colores.textoClaro,
            }
          ]} numberOfLines={1}>
            {producto.nombre}
          </Text>

          <Text style={[
            estilos.descripcion,
            {
              fontSize: descripcionSize,
              color: Colores.textoGris,
              minHeight: modoGrid ? (isTablet ? 30 : 24) : (isTablet ? 36 : 30),
            }
          ]} numberOfLines={2}>
            {producto.descripcion || 'Deliciosa hamburguesa Krusty 🍔'}
          </Text>

          {/* ============================================================ */}
          {/* 🔹 PRECIO Y BOTÓN */}
          {/* ============================================================ */}
          <View style={[
            estilos.filaInferior,
            {
              marginTop: isTablet ? 8 : 6,
            }
          ]}>
            {/* ✅ Contenedor de precio con badge premium AL LADO */}
            <View style={estilos.precioContainer}>
              <Text style={[
                estilos.precio,
                {
                  fontSize: precioSize,
                  color: temaKrusty.secundario,
                }
              ]}>
                {/* ✅ PRECIO FORMATEADO SIN DECIMALES Y CON SEPARADOR DE MILES */}
                {formatearPrecio(typeof producto.precio === 'number' ? producto.precio : Number(producto.precio))}
              </Text>

              {/* ✅ Badge Premium - AHORA AL LADO DEL PRECIO, no debajo */}
              {esPremium && isDisponible && (
                <View style={[
                  estilos.badgePremium,
                  {
                    backgroundColor: Colores.primario + '20',
                    paddingHorizontal: isTablet ? 6 : 4,
                    paddingVertical: isTablet ? 2 : 1,
                    borderRadius: isTablet ? 8 : 6,
                    borderWidth: 1,
                    borderColor: Colores.primario + '30',
                  }
                ]}>
                  <Text style={[
                    estilos.badgePremiumTexto,
                    {
                      fontSize: isTablet ? 8 : 7,
                      color: Colores.primario,
                      fontWeight: 'bold',
                    }
                  ]}>
                    ⭐ Premium
                  </Text>
                </View>
              )}
            </View>

            {/* ✅ Botón agregar */}
            <TouchableOpacity
              style={[
                estilos.botonAgregar,
                {
                  width: botonSize,
                  height: botonSize,
                  borderRadius: botonSize / 2,
                  opacity: isDisponible ? 1 : 0.4,
                }
              ]}
              onPress={handleAgregar}
              activeOpacity={0.7}
              disabled={!isDisponible}
            >
              <LinearGradient
                colors={[temaKrusty.secundario, temaKrusty.primario]}
                style={estilos.botonAgregarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={mostrarFeedback ? 'checkmark' : 'add'}
                  size={botonSize * 0.5}
                  color={Colores.textoOscuro}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ✅ Feedback de agregado */}
          {mostrarFeedback && (
            <Animated.View style={[
              estilos.feedbackContainer,
              {
                backgroundColor: Colores.verdeKrusty + '90',
                paddingVertical: isTablet ? 3 : 2,
                paddingHorizontal: isTablet ? 10 : 8,
                borderRadius: isTablet ? 10 : 8,
                marginTop: isTablet ? 4 : 3,
              }
            ]}>
              <Text style={[
                estilos.feedbackTexto,
                {
                  fontSize: isTablet ? 11 : 9,
                  color: Colores.textoClaro,
                }
              ]}>
                ✓ Agregado
              </Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  tarjeta: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  gradienteFondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  imagenContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {},

  // Badges
  badgePopular: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  badgePopularTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  badgeNoDisponible: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeNoDisponibleTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoriaTag: {
    position: 'absolute',
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colores.textoClaro + '10',
  },
  categoriaTagTexto: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ✅ Badge Premium - MEJORADO
  badgePremium: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  badgePremiumTexto: {
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },

  // Información
  infoContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  nombre: {
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  descripcion: {
    opacity: 0.8,
    lineHeight: 16,
  },

  // Precio y botón
  filaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap', // ✅ Para que el badge no se corte
  },
  precio: {
    fontWeight: 'bold',
  },
  botonAgregar: {
    overflow: 'hidden',
    shadowColor: Colores.secundario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0,
  },
  botonAgregarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Feedback
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  feedbackTexto: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});