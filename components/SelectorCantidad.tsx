import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../lib/colores';

interface Props {
  cantidad: number;
  onAumentar: () => void;
  onDisminuir: () => void;
  minimo?: number;
  maximo?: number;
}

export default function SelectorCantidad({ 
  cantidad, 
  onAumentar, 
  onDisminuir, 
  minimo = 0, 
  maximo = 99 
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <TouchableOpacity 
        style={[estilos.boton, cantidad <= minimo && estilos.botonDeshabilitado]} 
        onPress={onDisminuir}
        disabled={cantidad <= minimo}
      >
        <Ionicons 
          name="remove" 
          size={20} 
          color={cantidad <= minimo ? Colores.textoGris : Colores.textoClaro} 
        />
      </TouchableOpacity>
      
      <Text style={estilos.cantidad}>{cantidad}</Text>
      
      <TouchableOpacity 
        style={[estilos.boton, cantidad >= maximo && estilos.botonDeshabilitado]} 
        onPress={onAumentar}
        disabled={cantidad >= maximo}
      >
        <Ionicons 
          name="add" 
          size={20} 
          color={cantidad >= maximo ? Colores.textoGris : Colores.textoClaro} 
        />
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 12,
    padding: 4,
  },
  boton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colores.primario + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    backgroundColor: Colores.fondoTarjeta,
    opacity: 0.5,
  },
  cantidad: {
    color: Colores.textoClaro,
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
});

