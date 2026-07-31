import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../lib/colores';

interface Props {
  cantidad: number;
  total: number;
  onPresionar: () => void;
}

export default function CarritoFlotante({ cantidad, total, onPresionar }: Props) {
  if (cantidad === 0) return null;

  return (
    <TouchableOpacity style={estilos.contenedor} onPress={onPresionar} activeOpacity={0.9}>
      <View style={estilos.izquierda}>
        <View style={estilos.iconoCarrito}>
          <Ionicons name="cart" size={24} color="white" />
          <View style={estilos.contador}>
            <Text style={estilos.contadorTexto}>{cantidad}</Text>
          </View>
        </View>
        <Text style={estilos.total}>${total.toFixed(2)}</Text>
      </View>
      <View style={estilos.derecha}>
        <Text style={estilos.textoVer}>Ver carrito</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: Colores.primario,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  izquierda: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoCarrito: { position: 'relative' },
  contador: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colores.acento,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  total: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoVer: { color: 'white', fontSize: 14, fontWeight: '600' },
});