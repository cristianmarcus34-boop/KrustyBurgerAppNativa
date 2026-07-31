import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Colores } from '../../lib/colores';

const { width } = Dimensions.get('window');

export default function PantallaInicio(props: any) {
  const { perfil } = tiendaAutenticacion();
  const { cantidadTotal } = tiendaCarrito();

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
    <ScrollView style={estilos.contenedor} showsVerticalScrollIndicator={false}>
      {/* Boton volver al panel admin (solo visible para admin) */}
      {perfil?.rol === 'admin' && (
        <TouchableOpacity
          style={estilos.botonAdmin}
          onPress={() => props.navigation.navigate('PanelAdmin')}
        >
          <Ionicons name="arrow-back" size={20} color={Colores.secundario} />
          <Text style={estilos.botonAdminTexto}>Volver al Panel</Text>
        </TouchableOpacity>
      )}

      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <View>
          <Text style={estilos.saludo}>Hola, {perfil?.nombre_cliente || 'Cliente'}!</Text>
          <Text style={estilos.puntos}>⭐ {perfil?.puntos_acumulados || 0} Krusty Points</Text>
        </View>
        <TouchableOpacity onPress={() => props.navigation.navigate('Carrito')} style={estilos.botonCarrito}>
          <Ionicons name="cart" size={28} color={Colores.secundario} />
          {cantidadTotal() > 0 && (
            <View style={estilos.contadorCarrito}>
              <Text style={estilos.contadorTexto}>{cantidadTotal()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Ofertas */}
      <Text style={estilos.seccionTitulo}>🔥 Ofertas del Dia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.carrusel}>
        {ofertas.map(oferta => (
          <TouchableOpacity key={oferta.id} style={[estilos.tarjetaOferta, { backgroundColor: oferta.color }]}>
            <Text style={estilos.ofertaDescuento}>{oferta.descuento}</Text>
            <Text style={estilos.ofertaTitulo}>{oferta.titulo}</Text>
            <Text style={estilos.ofertaPrecio}>${oferta.precio}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categorias */}
      <Text style={estilos.seccionTitulo}>🍔 Nuestro Menu</Text>
      <View style={estilos.categorias}>
        {categorias.map(cat => (
          <TouchableOpacity
            key={cat.nombre}
            style={[estilos.categoriaItem, { backgroundColor: cat.color + '20' }]}
            onPress={() => props.navigation.navigate('Menu')}
          >
            <Text style={estilos.categoriaIcono}>{cat.icono}</Text>
            <Text style={[estilos.categoriaTexto, { color: cat.color }]}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Favoritos */}
      <Text style={estilos.seccionTitulo}>⭐ Tus Favoritos</Text>
      <TouchableOpacity style={estilos.tarjetaFavorito} onPress={() => props.navigation.navigate('Menu')}>
        <Text style={estilos.emojiGrande}>🍔</Text>
        <View style={estilos.favoritoInfo}>
          <Text style={estilos.favoritoTitulo}>Krusty Burger Clasica</Text>
          <Text style={estilos.favoritoPrecio}>$7.99</Text>
        </View>
        <TouchableOpacity style={estilos.botonAgregar}>
          <Text style={estilos.botonAgregarTexto}>+ Agregar</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  botonAdmin: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, gap: 6 },
  botonAdminTexto: { color: Colores.secundario, fontSize: 14, fontWeight: 'bold' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  saludo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro },
  puntos: { fontSize: 14, color: Colores.secundario, marginTop: 4 },
  botonCarrito: { position: 'relative' },
  contadorCarrito: { position: 'absolute', top: -8, right: -8, backgroundColor: Colores.acento, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  contadorTexto: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  seccionTitulo: { fontSize: 20, fontWeight: 'bold', color: Colores.textoClaro, marginLeft: 20, marginTop: 24, marginBottom: 12 },
  carrusel: { paddingLeft: 20 },
  tarjetaOferta: { width: width * 0.7, borderRadius: 16, padding: 20, marginRight: 12, justifyContent: 'center' },
  ofertaDescuento: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  ofertaTitulo: { fontSize: 18, color: 'white', marginTop: 8 },
  ofertaPrecio: { fontSize: 24, fontWeight: 'bold', color: 'white', marginTop: 4 },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  categoriaItem: { width: (width - 56) / 2, borderRadius: 16, padding: 20, alignItems: 'center' },
  categoriaIcono: { fontSize: 40 },
  categoriaTexto: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  tarjetaFavorito: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.fondoTarjeta, marginHorizontal: 20, borderRadius: 16, padding: 16 },
  emojiGrande: { fontSize: 50, marginRight: 12 },
  favoritoInfo: { flex: 1 },
  favoritoTitulo: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  favoritoPrecio: { fontSize: 18, fontWeight: 'bold', color: Colores.primario, marginTop: 4 },
  botonAgregar: { backgroundColor: Colores.primario, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  botonAgregarTexto: { color: 'white', fontWeight: 'bold' },
});