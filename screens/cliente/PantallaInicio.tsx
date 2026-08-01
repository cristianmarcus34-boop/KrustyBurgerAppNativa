import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Colores } from '../../lib/colores';

export default function PantallaInicio(props: any) {
  const { perfil } = tiendaAutenticacion();
  const { cantidadTotal } = tiendaCarrito();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ✅ Tamaños dinámicos según la pantalla
  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const saludoSize = isTablet ? 28 : isSmallPhone ? 18 : 22;
  const puntosSize = isTablet ? 18 : isSmallPhone ? 12 : 14;
  const seccionTituloSize = isTablet ? 26 : isSmallPhone ? 17 : 20;
  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const paddingTop = insets.top + (isTablet ? 20 : 10);
  const paddingBottom = insets.bottom + 20;
  const gapCategorias = isTablet ? 16 : 12;
  const cardWidth = isTablet ? width * 0.5 : width * 0.7;

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
        {/* Boton volver al panel admin (solo visible para admin) */}
        {perfil?.rol === 'admin' && (
          <TouchableOpacity
            style={[estilos.botonAdmin, { paddingHorizontal: paddingHorizontal, paddingTop: 10 }]}
            onPress={() => props.navigation.navigate('PanelAdmin')}
          >
            <Ionicons name="arrow-back" size={20} color={Colores.secundario} />
            <Text style={[estilos.botonAdminTexto, { fontSize: isTablet ? 16 : 14 }]}>Volver al Panel</Text>
          </TouchableOpacity>
        )}

        {/* Encabezado */}
        <View style={[estilos.encabezado, { paddingHorizontal: paddingHorizontal, paddingTop: 10 }]}>
          <View>
            <Text style={[estilos.saludo, { fontSize: saludoSize }]}>
              Hola, {perfil?.nombre_cliente || 'Cliente'}!
            </Text>
            <Text style={[estilos.puntos, { fontSize: puntosSize }]}>
              ⭐ {perfil?.puntos_acumulados || 0} Krusty Points
            </Text>
          </View>
          <TouchableOpacity onPress={() => props.navigation.navigate('Carrito')} style={estilos.botonCarrito}>
            <Ionicons name="cart" size={isTablet ? 34 : 28} color={Colores.secundario} />
            {cantidadTotal() > 0 && (
              <View style={estilos.contadorCarrito}>
                <Text style={estilos.contadorTexto}>{cantidadTotal()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Ofertas */}
        <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, marginLeft: paddingHorizontal }]}>
          🔥 Ofertas del Dia
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[estilos.carrusel, { paddingLeft: paddingHorizontal }]}
          contentContainerStyle={{ paddingRight: paddingHorizontal }}
        >
          {ofertas.map(oferta => (
            <TouchableOpacity
              key={oferta.id}
              style={[
                estilos.tarjetaOferta,
                {
                  backgroundColor: oferta.color,
                  width: cardWidth,
                  padding: isTablet ? 24 : 20,
                  marginRight: isTablet ? 16 : 12,
                }
              ]}
            >
              <Text style={[estilos.ofertaDescuento, { fontSize: isTablet ? 34 : 28 }]}>
                {oferta.descuento}
              </Text>
              <Text style={[estilos.ofertaTitulo, { fontSize: isTablet ? 22 : 18 }]}>
                {oferta.titulo}
              </Text>
              <Text style={[estilos.ofertaPrecio, { fontSize: isTablet ? 28 : 24 }]}>
                ${oferta.precio}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categorias */}
        <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, marginLeft: paddingHorizontal }]}>
          🍔 Nuestro Menu
        </Text>
        <View style={[estilos.categorias, { paddingHorizontal: paddingHorizontal, gap: gapCategorias }]}>
          {categorias.map(cat => {
            const itemWidth = (width - (paddingHorizontal * 2) - gapCategorias) / 2;
            return (
              <TouchableOpacity
                key={cat.nombre}
                style={[
                  estilos.categoriaItem,
                  {
                    width: itemWidth,
                    backgroundColor: cat.color + '20',
                    padding: isTablet ? 24 : 20,
                    borderRadius: isTablet ? 20 : 16,
                  }
                ]}
                onPress={() => props.navigation.navigate('Menu')}
              >
                <Text style={[estilos.categoriaIcono, { fontSize: isTablet ? 50 : 40 }]}>
                  {cat.icono}
                </Text>
                <Text style={[estilos.categoriaTexto, { fontSize: isTablet ? 18 : 16, color: cat.color }]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Favoritos */}
        <Text style={[estilos.seccionTitulo, { fontSize: seccionTituloSize, marginLeft: paddingHorizontal }]}>
          ⭐ Tus Favoritos
        </Text>
        <TouchableOpacity
          style={[
            estilos.tarjetaFavorito,
            {
              marginHorizontal: paddingHorizontal,
              padding: isTablet ? 20 : 16,
              borderRadius: isTablet ? 20 : 16,
            }
          ]}
          onPress={() => props.navigation.navigate('Menu')}
        >
          <Text style={[estilos.emojiGrande, { fontSize: isTablet ? 60 : 50 }]}>🍔</Text>
          <View style={estilos.favoritoInfo}>
            <Text style={[estilos.favoritoTitulo, { fontSize: isTablet ? 18 : 16 }]}>
              Krusty Burger Clasica
            </Text>
            <Text style={[estilos.favoritoPrecio, { fontSize: isTablet ? 20 : 18 }]}>
              $7.99
            </Text>
          </View>
          <TouchableOpacity style={[estilos.botonAgregar, { paddingHorizontal: isTablet ? 20 : 16, paddingVertical: isTablet ? 10 : 8 }]}>
            <Text style={[estilos.botonAgregarTexto, { fontSize: isTablet ? 16 : 14 }]}>+ Agregar</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ✅ ESPACIO EXTRA PARA LA BARRA DE NAVEGACIÓN (si el contenido es poco) */}
        <View style={{ height: paddingBottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  scrollContent: { flexGrow: 1 },
  botonAdmin: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botonAdminTexto: { color: Colores.secundario, fontWeight: 'bold' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  saludo: { fontWeight: 'bold', color: Colores.textoClaro },
  puntos: { color: Colores.secundario, marginTop: 4 },
  botonCarrito: { position: 'relative' },
  contadorCarrito: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colores.acento,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contadorTexto: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  seccionTitulo: { fontWeight: 'bold', color: Colores.textoClaro, marginTop: 24, marginBottom: 12 },
  carrusel: { flexDirection: 'row' },
  tarjetaOferta: { borderRadius: 16, justifyContent: 'center' },
  ofertaDescuento: { fontWeight: 'bold', color: 'white' },
  ofertaTitulo: { color: 'white', marginTop: 8 },
  ofertaPrecio: { fontWeight: 'bold', color: 'white', marginTop: 4 },
  categorias: { flexDirection: 'row', flexWrap: 'wrap' },
  categoriaItem: { alignItems: 'center', marginBottom: 8 },
  categoriaIcono: { marginBottom: 4 },
  categoriaTexto: { fontWeight: 'bold', textAlign: 'center' },
  tarjetaFavorito: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, marginBottom: 8 },
  emojiGrande: { marginRight: 12 },
  favoritoInfo: { flex: 1 },
  favoritoTitulo: { fontWeight: 'bold', color: Colores.textoClaro },
  favoritoPrecio: { fontWeight: 'bold', color: Colores.primario, marginTop: 4 },
  botonAgregar: { backgroundColor: Colores.primario, borderRadius: 20 },
  botonAgregarTexto: { color: 'white', fontWeight: 'bold' },
});