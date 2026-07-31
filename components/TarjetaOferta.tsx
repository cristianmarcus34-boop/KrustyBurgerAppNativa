import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colores } from '../lib/colores';

const { width } = Dimensions.get('window');

interface Oferta {
  id: number;
  titulo: string;
  precio: string;
  descuento: string;
  color: string;
}

interface Props {
  oferta: Oferta;
  onPresionar: (oferta: Oferta) => void;
}

export default function TarjetaOferta({ oferta, onPresionar }: Props) {
  return (
    <TouchableOpacity 
      style={[estilos.tarjeta, { backgroundColor: oferta.color }]} 
      onPress={() => onPresionar(oferta)}
      activeOpacity={0.9}
    >
      <View style={estilos.contenido}>
        <View style={estilos.etiquetaDescuento}>
          <Text style={estilos.descuentoTexto}>{oferta.descuento}</Text>
        </View>
        <Text style={estilos.titulo}>{oferta.titulo}</Text>
        <Text style={estilos.precio}>${oferta.precio}</Text>
        <Text style={estilos.accion}>Pedir ahora ?</Text>
      </View>
      <Text style={estilos.emojiFondo}>??</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    width: width * 0.7,
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
  },
  contenido: { zIndex: 1 },
  etiquetaDescuento: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  descuentoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  titulo: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  precio: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  accion: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  emojiFondo: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    fontSize: 80,
    opacity: 0.3,
    transform: [{ rotate: '15deg' }],
  },
});

