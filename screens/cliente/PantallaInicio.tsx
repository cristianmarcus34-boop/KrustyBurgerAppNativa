import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES (consistente con PantallaBienvenida)
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

export default function PantallaInicio(props: any) {
  const { perfil } = tiendaAutenticacion();
  const { cantidadTotal } = tiendaCarrito();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ✅ Breakpoints para responsive
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;
  const isMediumPhone = width >= 375 && width < 768;

  // ✅ TAMAÑOS RESPONSIVE - Ajustados para que todo entre bien
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const gapCategorias = isTablet ? 16 : isSmallPhone ? 10 : 12;
  const paddingTop = insets.top + (isTablet ? 20 : 10);
  const paddingBottom = insets.bottom + 20;

  // 📱 SALUDO Y PUNTOS
  const saludoSize = isTablet ? 26 : isSmallPhone ? 16 : 20;
  const puntosSize = isTablet ? 15 : isSmallPhone ? 10 : 12;
  const puntosPadding = isTablet ? 12 : isSmallPhone ? 8 : 10;

  // 🛒 CARRITO - RESPONSIVE (AHORA ENTRA BIEN)
  const carritoSize = isTablet ? 48 : isSmallPhone ? 38 : 44;
  const carritoPadding = isTablet ? 10 : isSmallPhone ? 8 : 9;
  const carritoIconSize = isTablet ? 26 : isSmallPhone ? 20 : 24;
  const contadorSize = isTablet ? 20 : isSmallPhone ? 16 : 18;
  const contadorTextSize = isTablet ? 11 : isSmallPhone ? 9 : 10;

  // 📝 SECCIONES
  const seccionTituloSize = isTablet ? 22 : isSmallPhone ? 15 : 18;
  const seccionMarginTop = isTablet ? 24 : isSmallPhone ? 16 : 20;

  // 🎴 OFERTAS
  const cardWidth = isTablet ? width * 0.45 : isSmallPhone ? width * 0.75 : width * 0.7;
  const cardPadding = isTablet ? 20 : isSmallPhone ? 14 : 18;
  const ofertaDescuentoSize = isTablet ? 32 : isSmallPhone ? 22 : 28;
  const ofertaTituloSize = isTablet ? 18 : isSmallPhone ? 13 : 16;
  const ofertaPrecioSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const cardMinHeight = isTablet ? 140 : isSmallPhone ? 110 : 130;

  // 📂 CATEGORÍAS
  const categoriaPadding = isTablet ? 20 : isSmallPhone ? 14 : 18;
  const categoriaIconSize = isTablet ? 44 : isSmallPhone ? 32 : 38;
  const categoriaTextSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const categoriaBorderRadius = isTablet ? 20 : isSmallPhone ? 14 : 16;

  // ⭐ FAVORITOS
  const favoritoPadding = isTablet ? 18 : isSmallPhone ? 12 : 16;
  const favoritoEmojiSize = isTablet ? 50 : isSmallPhone ? 38 : 44;
  const favoritoEmojiContainer = isTablet ? 54 : isSmallPhone ? 44 : 50;
  const favoritoTituloSize = isTablet ? 17 : isSmallPhone ? 13 : 15;
  const favoritoPrecioSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const botonAgregarPaddingH = isTablet ? 18 : isSmallPhone ? 12 : 16;
  const botonAgregarPaddingV = isTablet ? 9 : isSmallPhone ? 6 : 8;
  const botonAgregarTextSize = isTablet ? 15 : isSmallPhone ? 11 : 13;

  // ✅ Datos de ofertas
  const ofertas = [
    { id: 1, titulo: 'Krusty Burger Doble', precio: '8.99', descuento: '20% OFF', color: '#FF5722' },
    { id: 2, titulo: 'Combo Krusty + Papas', precio: '12.99', descuento: '15% OFF', color: '#4CAF50' },
    { id: 3, titulo: 'Malteada Gratis', precio: '0.00', descuento: 'GRATIS', color: '#FFC107' },
  ];

  const categorias = [
    { nombre: 'Hamburguesas', icono: '🍔', color: '#FF5722' },
    { nombre: 'Combos', icono: '🍟', color: '#FFC107' },
    { nombre: 'Bebidas', icono: '🥤', color: '#2196F3' },
    { nombre: 'Postres', icono: '🍦', color: '#E91E63' },
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
            paddingTop: paddingTop,
          }
        ]}
      >
        {/* ✅ BOTÓN ADMIN (solo visible para admin) */}
        {perfil?.rol === 'admin' && (
          <TouchableOpacity
            style={[estilos.botonAdmin, { paddingHorizontal: paddingHorizontal }]}
            onPress={() => props.navigation.navigate('PanelAdmin')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={isTablet ? 20 : 16} color={COLORS.amarillo} />
            <Text style={[estilos.botonAdminTexto, { fontSize: isTablet ? 16 : 13 }]}>
              Volver al Panel
            </Text>
          </TouchableOpacity>
        )}

        {/* ✅ ENCABEZADO */}
        <View style={[estilos.encabezado, {
          paddingHorizontal: paddingHorizontal,
          paddingTop: isTablet ? 8 : isSmallPhone ? 4 : 6,
        }]}>
          <View style={estilos.encabezadoIzquierdo}>
            <Text style={[estilos.saludo, { fontSize: saludoSize }]}>
              ¡Hola, {perfil?.nombre_cliente || 'Cliente'}! 👋
            </Text>
            <View style={[
              estilos.puntosContainer,
              {
                paddingHorizontal: puntosPadding,
                paddingVertical: isTablet ? 5 : isSmallPhone ? 3 : 4,
              }
            ]}>
              <Ionicons name="star" size={puntosSize + 2} color={COLORS.amarillo} />
              <Text style={[estilos.puntos, { fontSize: puntosSize }]}>
                {perfil?.puntos_acumulados || 0} Krusty Points
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => props.navigation.navigate('Carrito')}
            style={estilos.botonCarrito}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
              style={[
                estilos.carritoGradient,
                {
                  width: carritoSize,
                  height: carritoSize,
                  padding: carritoPadding,
                }
              ]}
            >
              <Ionicons name="cart" size={carritoIconSize} color={COLORS.negro} />
              {cantidadTotal() > 0 && (
                <View style={[
                  estilos.contadorCarrito,
                  {
                    width: contadorSize,
                    height: contadorSize,
                    borderRadius: contadorSize / 2,
                  }
                ]}>
                  <Text style={[estilos.contadorTexto, { fontSize: contadorTextSize }]}>
                    {cantidadTotal()}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ✅ OFERTAS DEL DÍA */}
        <Text style={[estilos.seccionTitulo, {
          fontSize: seccionTituloSize,
          marginLeft: paddingHorizontal,
          marginTop: seccionMarginTop,
        }]}>
          🔥 Ofertas del Día
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[estilos.carrusel, { paddingLeft: paddingHorizontal }]}
          contentContainerStyle={{
            paddingRight: paddingHorizontal,
            gap: isTablet ? 16 : isSmallPhone ? 10 : 12
          }}
        >
          {ofertas.map(oferta => (
            <TouchableOpacity
              key={oferta.id}
              style={[
                estilos.tarjetaOferta,
                {
                  backgroundColor: oferta.color + '20',
                  width: cardWidth,
                  padding: cardPadding,
                  borderColor: oferta.color,
                  minHeight: cardMinHeight,
                }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[estilos.ofertaDescuento, {
                fontSize: ofertaDescuentoSize,
                color: oferta.color
              }]}>
                {oferta.descuento}
              </Text>
              <Text style={[estilos.ofertaTitulo, { fontSize: ofertaTituloSize }]}>
                {oferta.titulo}
              </Text>
              <Text style={[estilos.ofertaPrecio, { fontSize: ofertaPrecioSize }]}>
                ${oferta.precio}
              </Text>
              <TouchableOpacity
                style={[estilos.botonVerOferta, {
                  backgroundColor: oferta.color,
                  paddingVertical: isTablet ? 6 : isSmallPhone ? 4 : 5,
                  paddingHorizontal: isTablet ? 14 : isSmallPhone ? 10 : 12,
                }]}
                activeOpacity={0.7}
              >
                <Text style={[estilos.botonVerOfertaTexto, {
                  fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11
                }]}>
                  Ver Oferta
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ✅ CATEGORÍAS */}
        <Text style={[estilos.seccionTitulo, {
          fontSize: seccionTituloSize,
          marginLeft: paddingHorizontal,
          marginTop: seccionMarginTop,
        }]}>
          🍔 Nuestro Menú
        </Text>
        <View style={[estilos.categorias, {
          paddingHorizontal: paddingHorizontal,
          gap: gapCategorias
        }]}>
          {categorias.map((cat, index) => {
            const itemWidth = (width - (paddingHorizontal * 2) - gapCategorias) / 2;
            return (
              <TouchableOpacity
                key={cat.nombre}
                style={[
                  estilos.categoriaItem,
                  {
                    width: itemWidth,
                    backgroundColor: cat.color + '15',
                    padding: categoriaPadding,
                    borderRadius: categoriaBorderRadius,
                    borderColor: cat.color + '30',
                  }
                ]}
                onPress={() => props.navigation.navigate('Menu')}
                activeOpacity={0.7}
              >
                <Text style={[estilos.categoriaIcono, { fontSize: categoriaIconSize }]}>
                  {cat.icono}
                </Text>
                <Text style={[estilos.categoriaTexto, {
                  fontSize: categoriaTextSize,
                  color: cat.color
                }]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ✅ TUS FAVORITOS */}
        <Text style={[estilos.seccionTitulo, {
          fontSize: seccionTituloSize,
          marginLeft: paddingHorizontal,
          marginTop: seccionMarginTop,
        }]}>
          ⭐ Tus Favoritos
        </Text>
        <TouchableOpacity
          style={[
            estilos.tarjetaFavorito,
            {
              marginHorizontal: paddingHorizontal,
              padding: favoritoPadding,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
            }
          ]}
          onPress={() => props.navigation.navigate('Menu')}
          activeOpacity={0.7}
        >
          <View style={[
            estilos.favoritoEmojiContainer,
            {
              width: favoritoEmojiContainer,
              height: favoritoEmojiContainer,
              borderRadius: favoritoEmojiContainer / 2,
            }
          ]}>
            <Text style={[estilos.emojiGrande, { fontSize: favoritoEmojiSize }]}>🍔</Text>
          </View>
          <View style={estilos.favoritoInfo}>
            <Text style={[estilos.favoritoTitulo, { fontSize: favoritoTituloSize }]}>
              Krusty Burger Clásica
            </Text>
            <Text style={[estilos.favoritoPrecio, { fontSize: favoritoPrecioSize }]}>
              $7.99
            </Text>
          </View>
          <TouchableOpacity
            style={[
              estilos.botonAgregar,
              {
                paddingHorizontal: botonAgregarPaddingH,
                paddingVertical: botonAgregarPaddingV,
              }
            ]}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
              style={estilos.botonAgregarGradient}
            >
              <Text style={[estilos.botonAgregarTexto, { fontSize: botonAgregarTextSize }]}>
                + Agregar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ✅ ESPACIO EXTRA PARA LA BARRA DE NAVEGACIÓN */}
        <View style={{ height: paddingBottom + 20 }} />
      </ScrollView>
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
  // ✅ BOTÓN ADMIN
  botonAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  botonAdminTexto: {
    color: COLORS.amarillo,
    fontWeight: '600',
  },
  // ✅ ENCABEZADO
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  encabezadoIzquierdo: {
    flex: 1,
    marginRight: 12,
  },
  saludo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  puntosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: COLORS.negro + '40',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  puntos: {
    color: COLORS.amarillo,
    fontWeight: '600',
  },
  // ✅ CARRITO - RESPONSIVE
  botonCarrito: {
    position: 'relative',
    flexShrink: 0,
  },
  carritoGradient: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorCarrito: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: COLORS.rojo,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.negro,
  },
  contadorTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  // ✅ SECCIONES
  seccionTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginBottom: 10,
  },
  // ✅ OFERTAS
  carrusel: {
    flexDirection: 'row',
  },
  tarjetaOferta: {
    borderRadius: 16,
    justifyContent: 'center',
    borderWidth: 2,
  },
  ofertaDescuento: {
    fontWeight: 'bold',
  },
  ofertaTitulo: {
    color: COLORS.blanco,
    marginTop: 6,
    fontWeight: '600',
  },
  ofertaPrecio: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    marginTop: 4,
  },
  botonVerOferta: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  botonVerOfertaTexto: {
    color: COLORS.blanco,
    fontWeight: '600',
  },
  // ✅ CATEGORÍAS
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoriaItem: {
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  categoriaIcono: {
    marginBottom: 2,
  },
  categoriaTexto: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // ✅ FAVORITOS
  tarjetaFavorito: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.negro + '60',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.amarillo + '20',
  },
  favoritoEmojiContainer: {
    backgroundColor: COLORS.amarillo + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emojiGrande: {
    marginRight: 0,
  },
  favoritoInfo: {
    flex: 1,
    marginRight: 8,
  },
  favoritoTitulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
  },
  favoritoPrecio: {
    fontWeight: 'bold',
    color: COLORS.amarillo,
    marginTop: 2,
  },
  botonAgregar: {
    borderRadius: 20,
    overflow: 'hidden',
    flexShrink: 0,
  },
  botonAgregarGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonAgregarTexto: {
    color: COLORS.negro,
    fontWeight: 'bold',
  },
});