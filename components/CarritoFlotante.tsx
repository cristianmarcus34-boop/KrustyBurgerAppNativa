import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colores } from '../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES (consistente con las demás pantallas)
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

const { width, height } = Dimensions.get('window');

interface Props {
  cantidad: number;
  total: number;
  onPresionar: () => void;
}

export default function CarritoFlotante({ cantidad, total, onPresionar }: Props) {
  const insets = useSafeAreaInsets();

  if (cantidad === 0) return null;

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  // ✅ Tamaños responsive
  const bottomPosition = isTablet ? 90 : isSmallPhone ? 60 : 70;
  const paddingHorizontal = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const paddingVertical = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const borderRadius = isTablet ? 20 : isSmallPhone ? 14 : 16;
  const totalSize = isTablet ? 22 : isSmallPhone ? 16 : 18;
  const textSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const iconSize = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const contadorSize = isTablet ? 22 : isSmallPhone ? 18 : 20;
  const contadorTextSize = isTablet ? 12 : isSmallPhone ? 10 : 11;

  return (
    <TouchableOpacity
      style={[
        estilos.contenedor,
        {
          bottom: bottomPosition + insets.bottom,
          left: isTablet ? 40 : isSmallPhone ? 12 : 16,
          right: isTablet ? 40 : isSmallPhone ? 12 : 16,
          paddingHorizontal: paddingHorizontal,
          paddingVertical: paddingVertical,
          borderRadius: borderRadius,
        }
      ]}
      onPress={onPresionar}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[COLORS.amarillo, COLORS.amarilloOscuro]}
        style={[
          estilos.gradiente,
          {
            borderRadius: borderRadius,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={estilos.izquierda}>
          <View style={estilos.iconoCarrito}>
            <Ionicons name="cart" size={iconSize} color={COLORS.negro} />
            <View style={[
              estilos.contador,
              {
                width: contadorSize,
                height: contadorSize,
                borderRadius: contadorSize / 2,
              }
            ]}>
              <Text style={[estilos.contadorTexto, { fontSize: contadorTextSize }]}>
                {cantidad}
              </Text>
            </View>
          </View>
          <Text style={[estilos.total, { fontSize: totalSize }]}>
            ${total.toFixed(2)}
          </Text>
        </View>

        <View style={estilos.derecha}>
          <Text style={[estilos.textoVer, { fontSize: textSize }]}>
            Ver carrito
          </Text>
          <Ionicons name="arrow-forward" size={textSize + 2} color={COLORS.negro} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    zIndex: 999,
    elevation: 10,
    shadowColor: COLORS.amarillo,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  gradiente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  izquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoCarrito: {
    position: 'relative',
  },
  contador: {
    position: 'absolute',
    top: -6,
    right: -6,
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
  total: {
    color: COLORS.negro,
    fontWeight: 'bold',
  },
  derecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoVer: {
    color: COLORS.negro,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});