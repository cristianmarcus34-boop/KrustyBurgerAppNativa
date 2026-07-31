import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

export default function PantallaDetalleProducto(props: any) {
  const producto: Producto = props.route?.params?.producto;
  const { agregarProducto } = tiendaCarrito();

  if (!producto) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.errorTexto}>Producto no encontrado</Text>
      </View>
    );
  }

  const manejarAgregar = () => {
    agregarProducto(producto);
    Alert.alert('Agregado!', `${producto.nombre} se agrego al carrito`, [
      { text: 'Seguir viendo', onPress: () => props.navigation.goBack() },
      { text: 'Ver carrito', onPress: () => props.navigation.navigate('Carrito') },
    ]);
  };

  const precio = typeof producto.precio === 'number' ? producto.precio : Number(producto.precio);

  return (
    <ScrollView style={estilos.contenedor} showsVerticalScrollIndicator={false}>
      {/* Imagen */}
      <View style={estilos.imagenContenedor}>
        {producto.imagen ? (
          <Image source={{ uri: producto.imagen }} style={estilos.imagen} resizeMode="cover" />
        ) : (
          <View style={estilos.imagenPlaceholder}>
            <Text style={estilos.emojiGrande}>🍔</Text>
          </View>
        )}
        <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={estilos.info}>
        <View style={estilos.encabezado}>
          <View style={estilos.categoriaBadge}>
            <Text style={estilos.categoriaTexto}>{producto.categoria}</Text>
          </View>
          <Text style={estilos.nombre}>{producto.nombre}</Text>
          <Text style={estilos.precio}>${precio.toFixed(2)}</Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Descripcion</Text>
          <Text style={estilos.descripcion}>
            {producto.descripcion || 'Deliciosa hamburguesa Krusty preparada con ingredientes frescos y la salsa secreta de la casa.'}
          </Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Informacion nutricional</Text>
          <View style={estilos.nutricional}>
            <View style={estilos.nutriItem}>
              <Text style={estilos.nutriValor}>🔥</Text>
              <Text style={estilos.nutriTexto}>850 Cal</Text>
            </View>
            <View style={estilos.nutriItem}>
              <Text style={estilos.nutriValor}>🍗</Text>
              <Text style={estilos.nutriTexto}>35g Prot</Text>
            </View>
            <View style={estilos.nutriItem}>
              <Text style={estilos.nutriValor}>🧈</Text>
              <Text style={estilos.nutriTexto}>42g Grasas</Text>
            </View>
            <View style={estilos.nutriItem}>
              <Text style={estilos.nutriValor}>🍞</Text>
              <Text style={estilos.nutriTexto}>55g Carb</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Boton agregar */}
      <View style={estilos.footer}>
        <TouchableOpacity style={estilos.botonAgregar} onPress={manejarAgregar}>
          <Ionicons name="cart" size={24} color="white" />
          <Text style={estilos.botonAgregarTexto}>Agregar al carrito - ${precio.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro },
  errorTexto: { color: Colores.textoClaro, fontSize: 18, textAlign: 'center', marginTop: 100 },
  imagenContenedor: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: Colores.fondoTarjeta,
  },
  imagen: { width: '100%', height: '100%' },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colores.secundario + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emojiGrande: { fontSize: 100 },
  botonVolver: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { padding: 20 },
  encabezado: { marginBottom: 20 },
  categoriaBadge: {
    backgroundColor: Colores.secundario + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoriaTexto: { color: Colores.secundario, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  nombre: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 4 },
  precio: { fontSize: 32, fontWeight: 'bold', color: Colores.primario },
  seccion: { marginTop: 20 },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 8 },
  descripcion: { fontSize: 15, color: Colores.textoGris, lineHeight: 22 },
  nutricional: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  nutriItem: { alignItems: 'center', backgroundColor: Colores.fondoTarjeta, borderRadius: 12, padding: 12, width: '23%' },
  nutriValor: { fontSize: 20 },
  nutriTexto: { fontSize: 10, color: Colores.textoGris, marginTop: 4, textAlign: 'center' },
  footer: { padding: 20, paddingBottom: 40 },
  botonAgregar: {
    flexDirection: 'row',
    backgroundColor: Colores.primario,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  botonAgregarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});