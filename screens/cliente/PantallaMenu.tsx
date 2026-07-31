import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

const { width } = Dimensions.get('window');

const CATEGORIAS = ['Todas', 'burgers', 'combos', 'bebidas', 'postres', 'acompanantes'];

export default function PantallaMenu(props: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [cargando, setCargando] = useState(true);
  const { agregarProducto } = tiendaCarrito();

  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada]);

  const cargarProductos = async () => {
    setCargando(true);
    let consulta = supabase.from('productos').select('*');
    if (categoriaSeleccionada !== 'Todas') {
      consulta = consulta.eq('categoria', categoriaSeleccionada);
    }
    const { data } = await consulta;
    setProductos(data as Producto[] || []);
    setCargando(false);
  };

  const renderProducto = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={estilos.tarjetaProducto}
      onPress={() => props.navigation.navigate('DetalleProducto', { producto: item })}
      activeOpacity={0.8}
    >
      <View style={estilos.imagenContenedor}>
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={estilos.imagenProducto} resizeMode="cover" />
        ) : (
          <View style={estilos.imagenPlaceholder}>
            <Text style={estilos.emojiProducto}>🍔</Text>
          </View>
        )}
      </View>
      <View style={estilos.infoProducto}>
        <Text style={estilos.nombreProducto} numberOfLines={1}>{item.nombre}</Text>
        <Text style={estilos.descripcionProducto} numberOfLines={2}>
          {item.descripcion || 'Deliciosa hamburguesa Krusty'}
        </Text>
        <View style={estilos.filaPrecio}>
          <Text style={estilos.precioProducto}>
            ${typeof item.precio === 'number' ? item.precio.toFixed(2) : item.precio}
          </Text>
          <TouchableOpacity
            style={estilos.botonAgregar}
            onPress={() => agregarProducto(item)}
            activeOpacity={0.7}
          >
            <Text style={estilos.textoAgregar}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const etiquetasCategoria: Record<string, string> = {
    'burgers': '🍔 Hamburguesas',
    'combos': '🍟 Combos',
    'bebidas': '🥤 Bebidas',
    'postres': '🍦 Postres',
    'acompanantes': '🍿 Acompanantes',
  };

  return (
    <View style={estilos.contenedor}>
      {/* Titulo */}
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>🍔 Menu Krusty</Text>
      </View>

      {/* Categorias */}
      <View style={estilos.contenedorCategorias}>
        <FlatList
          horizontal
          data={CATEGORIAS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.listaCategorias}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[estilos.categoria, categoriaSeleccionada === item && estilos.categoriaActiva]}
              onPress={() => setCategoriaSeleccionada(item)}
              activeOpacity={0.7}
            >
              <Text style={[
                estilos.categoriaTexto,
                categoriaSeleccionada === item && estilos.categoriaTextoActivo
              ]}>
                {item === 'Todas' ? '🌟 Todas' : etiquetasCategoria[item] || item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {/* Productos */}
      {cargando ? (
        <ActivityIndicator size="large" color={Colores.secundario} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={estilos.listaProductos}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={estilos.vacioContenedor}>
              <Text style={estilos.vacioEmoji}>📭</Text>
              <Text style={estilos.vacio}>No hay productos en esta categoria</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondoOscuro
  },
  encabezado: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colores.textoClaro
  },
  contenedorCategorias: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 12,
    marginBottom: 8,
  },
  listaCategorias: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  categoria: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colores.fondoTarjeta
  },
  categoriaActiva: {
    backgroundColor: Colores.secundario
  },
  categoriaTexto: {
    color: Colores.textoGris,
    fontWeight: '600',
    fontSize: 13
  },
  categoriaTextoActivo: {
    color: Colores.fondoOscuro
  },
  listaProductos: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  tarjetaProducto: {
    flexDirection: 'row',
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    minHeight: 120,
  },
  imagenContenedor: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  imagenProducto: {
    width: '100%',
    height: '100%',
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colores.secundario + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emojiProducto: {
    fontSize: 40
  },
  infoProducto: {
    flex: 1,
    justifyContent: 'space-between'
  },
  nombreProducto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colores.textoClaro
  },
  descripcionProducto: {
    fontSize: 12,
    color: Colores.textoGris,
    marginTop: 4,
    lineHeight: 16,
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  precioProducto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colores.primario
  },
  botonAgregar: {
    backgroundColor: Colores.primario,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoAgregar: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: -2,
  },
  vacioContenedor: {
    alignItems: 'center',
    marginTop: 60,
  },
  vacioEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  vacio: {
    color: Colores.textoGris,
    textAlign: 'center',
    fontSize: 16
  },
});