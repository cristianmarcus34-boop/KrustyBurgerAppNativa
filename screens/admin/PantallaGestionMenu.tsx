import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Producto } from '../../lib/tipos';
import { Colores } from '../../lib/colores';

export default function PantallaGestionMenu(props: any) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('burgers');
  const [imagen, setImagen] = useState('');

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('nombre');
    setProductos(data as Producto[] || []);
    setCargando(false);
  };

  const seleccionarImagen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setSubiendoImagen(true);
      const nombreArchivo = Date.now() + '_' + file.name.replace(/\s/g, '_');
      const { error } = await supabase.storage.from('productos_imagenes').upload(nombreArchivo, file);
      if (error) { Alert.alert('Error', 'No se pudo subir la imagen'); setSubiendoImagen(false); return; }
      const { data: urlData } = supabase.storage.from('productos_imagenes').getPublicUrl(nombreArchivo);
      setImagen(urlData.publicUrl);
      setSubiendoImagen(false);
    };
    input.click();
  };

  const abrirFormulario = (producto?: Producto) => {
    if (producto) {
      setProductoEditando(producto);
      setNombre(producto.nombre);
      setDescripcion(producto.descripcion || '');
      setPrecio(String(producto.precio));
      setCategoria(producto.categoria);
      setImagen(producto.imagen || '');
    } else {
      setProductoEditando(null);
      setNombre(''); setDescripcion(''); setPrecio(''); setCategoria('burgers'); setImagen('');
    }
    setModalVisible(true);
  };

  const guardarProducto = async () => {
    if (!nombre || !precio || !categoria) { Alert.alert('Error', 'Completa nombre, precio y categoria'); return; }
    const datos = { nombre, descripcion, precio: Number(precio), categoria, imagen: imagen || null };
    if (productoEditando) {
      await supabase.from('productos').update(datos).eq('id', productoEditando.id);
    } else {
      await supabase.from('productos').insert(datos);
    }
    setModalVisible(false);
    cargarProductos();
    Alert.alert('Exito', productoEditando ? 'Producto actualizado' : 'Producto creado');
  };

  const eliminarProducto = (id: number, nombre: string) => {
    Alert.alert('Eliminar producto', `Estas seguro de eliminar "${nombre}"?`, [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('productos').delete().eq('id', id); cargarProductos(); } }
    ]);
  };

  const categorias = ['burgers', 'combos', 'bebidas', 'postres', 'acompanantes'];

  return (
    <View style={estilos.contenedor}>
      <TouchableOpacity style={estilos.botonVolver} onPress={() => props.navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={Colores.textoClaro} />
        <Text style={estilos.textoVolver}>Volver</Text>
      </TouchableOpacity>

      <View style={estilos.encabezado}>
        <View><Text style={estilos.titulo}>Gestion de Menu</Text><Text style={estilos.contador}>{productos.length} productos</Text></View>
        <TouchableOpacity style={estilos.botonAgregar} onPress={() => abrirFormulario()}>
          <Ionicons name="add" size={24} color="white" /><Text style={estilos.textoAgregar}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={productos} keyExtractor={item => item.id.toString()} contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            {item.imagen ? <Image source={{ uri: item.imagen }} style={estilos.imagen} resizeMode="cover" /> : <View style={estilos.imagenPlaceholder}><Text style={estilos.emoji}>🍔</Text></View>}
            <View style={estilos.info}>
              <View style={estilos.categoriaBadge}><Text style={estilos.categoriaTexto}>{item.categoria}</Text></View>
              <Text style={estilos.nombre}>{item.nombre}</Text>
              <Text style={estilos.descripcion} numberOfLines={2}>{item.descripcion || 'Sin descripcion'}</Text>
              <Text style={estilos.precio}>${typeof item.precio === 'number' ? item.precio.toFixed(2) : item.precio}</Text>
            </View>
            <View style={estilos.acciones}>
              <TouchableOpacity style={estilos.botonAccion} onPress={() => abrirFormulario(item)}><Ionicons name="create" size={20} color={Colores.secundario} /></TouchableOpacity>
              <TouchableOpacity style={[estilos.botonAccion, estilos.botonEliminar]} onPress={() => eliminarProducto(item.id, item.nombre)}><Ionicons name="trash" size={20} color={Colores.acento} /></TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={estilos.vacioContenedor}><Ionicons name="restaurant-outline" size={60} color={Colores.textoGris} /><Text style={estilos.vacio}>No hay productos</Text></View>}
        refreshing={cargando} onRefresh={cargarProductos}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={estilos.modalFondo}>
          <View style={estilos.modal}>
            <Text style={estilos.modalTitulo}>{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</Text>
            <ScrollView style={estilos.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={estilos.label}>Nombre *</Text>
              <TextInput style={estilos.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Krusty Burger" placeholderTextColor="#666" />
              <Text style={estilos.label}>Descripcion</Text>
              <TextInput style={[estilos.input, estilos.textArea]} value={descripcion} onChangeText={setDescripcion} placeholder="Descripcion del producto" placeholderTextColor="#666" multiline numberOfLines={3} />
              <Text style={estilos.label}>Precio *</Text>
              <TextInput style={estilos.input} value={precio} onChangeText={setPrecio} placeholder="9500" placeholderTextColor="#666" keyboardType="numeric" />
              <Text style={estilos.label}>Categoria *</Text>
              <View style={estilos.categoriasGrid}>
                {categorias.map(cat => (
                  <TouchableOpacity key={cat} style={[estilos.categoriaOpcion, categoria === cat && estilos.categoriaOpcionActiva]} onPress={() => setCategoria(cat)}>
                    <Text style={[estilos.categoriaOpcionTexto, categoria === cat && estilos.categoriaOpcionTextoActiva]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={estilos.label}>Imagen</Text>
              <TouchableOpacity style={estilos.botonImagen} onPress={seleccionarImagen}>
                <Ionicons name="cloud-upload" size={24} color={Colores.secundario} />
                <Text style={estilos.botonImagenTexto}>{subiendoImagen ? 'Subiendo...' : imagen ? 'Imagen seleccionada' : 'Seleccionar imagen'}</Text>
              </TouchableOpacity>
              {imagen ? (
                <View style={estilos.previaImagen}>
                  <Image source={{ uri: imagen }} style={estilos.previaFoto} resizeMode="contain" />
                  <TouchableOpacity style={estilos.botonQuitarImagen} onPress={() => setImagen('')}>
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ) : null}
              <TextInput style={[estilos.input, { marginTop: 8 }]} value={imagen} onChangeText={setImagen} placeholder="O pega la URL manualmente" placeholderTextColor="#666" autoCapitalize="none" />
            </ScrollView>
            <View style={estilos.modalBotones}>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalCancelar]} onPress={() => setModalVisible(false)}><Text style={estilos.modalCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[estilos.modalBoton, estilos.modalGuardar]} onPress={guardarProducto}><Ionicons name="save" size={18} color="white" /><Text style={estilos.modalGuardarTexto}>{productoEditando ? 'Actualizar' : 'Crear'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
  botonVolver: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 6 },
  textoVolver: { color: Colores.textoClaro, fontSize: 16 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro },
  contador: { fontSize: 13, color: Colores.textoGris, marginTop: 2 },
  botonAgregar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.primario, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  textoAgregar: { color: 'white', fontWeight: 'bold' },
  lista: { paddingHorizontal: 16, paddingBottom: 20 },
  tarjeta: { flexDirection: 'row', backgroundColor: Colores.fondoTarjeta, borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center' },
  imagen: { width: 90, height: 90, borderRadius: 12, marginRight: 12 },
  imagenPlaceholder: { width: 90, height: 90, backgroundColor: Colores.secundario + '20', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emoji: { fontSize: 36 },
  info: { flex: 1 },
  categoriaBadge: { backgroundColor: Colores.secundario + '30', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 },
  categoriaTexto: { color: Colores.secundario, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
  nombre: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  descripcion: { fontSize: 12, color: Colores.textoGris, marginTop: 4, lineHeight: 16 },
  precio: { fontSize: 18, fontWeight: 'bold', color: Colores.primario, marginTop: 6 },
  acciones: { gap: 10, marginLeft: 8 },
  botonAccion: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colores.fondoOscuro, justifyContent: 'center', alignItems: 'center' },
  botonEliminar: { backgroundColor: Colores.acento + '20' },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  vacio: { color: Colores.textoGris, fontSize: 16, marginTop: 16 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: Colores.fondoTarjeta, borderRadius: 24, padding: 24, width: '92%', maxHeight: '85%' },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: Colores.textoClaro, marginBottom: 20, textAlign: 'center' },
  modalScroll: { maxHeight: '70%' },
  label: { fontSize: 14, fontWeight: '600', color: Colores.textoClaro, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colores.fondoOscuro, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#444', color: Colores.textoClaro },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoriaOpcion: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
  categoriaOpcionActiva: { backgroundColor: Colores.secundario, borderColor: Colores.secundario },
  categoriaOpcionTexto: { color: Colores.textoGris, fontSize: 12, fontWeight: '600' },
  categoriaOpcionTextoActiva: { color: Colores.fondoOscuro },
  botonImagen: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colores.primario + '20', borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: Colores.primario + '40', borderStyle: 'dashed' },
  botonImagenTexto: { color: Colores.textoClaro, fontSize: 14, fontWeight: '600' },
  previaImagen: { marginTop: 10, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previaFoto: { width: '100%', height: 180, borderRadius: 12 },
  botonQuitarImagen: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  modalBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBoton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  modalCancelar: { backgroundColor: Colores.fondoOscuro, borderWidth: 1, borderColor: '#444' },
  modalCancelarTexto: { color: Colores.textoClaro, fontWeight: 'bold' },
  modalGuardar: { backgroundColor: Colores.primario },
  modalGuardarTexto: { color: 'white', fontWeight: 'bold' },
});