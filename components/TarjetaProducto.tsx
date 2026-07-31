import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Producto } from '../lib/tipos';
import { Colores } from '../lib/colores';

const { width } = Dimensions.get('window');

interface Props {
  producto: Producto;
  onAgregar: (producto: Producto) => void;
  onDetalle: (producto: Producto) => void;
}

export default function TarjetaProducto({ producto, onAgregar, onDetalle }: Props) {
  return (
    <TouchableOpacity style={estilos.tarjeta} onPress={() => onDetalle(producto)} activeOpacity={0.8}>
      <View style={estilos.imagen}>
        <Text style={estilos.emoji}>??</Text>
        {producto.precio < 5 && (
          <View style={estilos.etiqueta}>
            <Text style={estilos.etiquetaTexto}>íPopular!</Text>
          </View>
        )}
      </View>
      
      <View style={estilos.info}>
        <Text style={estilos.nombre} numberOfLines={1}>{producto.nombre}</Text>
        <Text style={estilos.descripcion} numberOfLines={2}>
          {producto.descripciín || 'Deliciosa hamburguesa Krusty'}
        </Text>
        
        <View style={estilos.fila}>
          <Text style={estilos.precio}>${producto.precio.toFixed(2)}</Text>
          <TouchableOpacity 
            style={estilos.botonAgregar} 
            onPress={() => onAgregar(producto)}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    width: (width - 48) / 2,
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagen: {
    height: 120,
    backgroundColor: Colores.secundario + '15',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emoji: { fontSize: 50 },
  etiqueta: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colores.acento,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etiquetaTexto: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  info: { padding: 12 },
  nombre: { fontSize: 14, fontWeight: 'bold', color: Colores.textoClaro },
  descripcion: { fontSize: 11, color: Colores.textoGris, marginTop: 4, minHeight: 30 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  precio: { fontSize: 18, fontWeight: 'bold', color: Colores.primario },
  botonAgregar: {
    backgroundColor: Colores.primario,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

