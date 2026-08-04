// components/TarjetaOferta.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ============================================================
// 🎨 INTERFACES
// ============================================================
interface Oferta {
  id: number;
  titulo: string;
  precio?: string | number;
  descuento: string;
  color: string;
  imagen?: string;
  precio_original?: number | string;
  precio_oferta?: number | string;
  descripcion?: string;
  activa?: boolean;
}

interface Props {
  oferta: Oferta;
  onPresionar: (oferta: Oferta) => void;
  estilo?: 'default' | 'compact' | 'featured';
}

// ============================================================
// 🎨 CONSTANTES
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

// ============================================================
// 🛠️ FUNCIONES UTILITARIAS
// ============================================================
const formatearPrecio = (precio: string | number | undefined): string => {
  if (precio === undefined || precio === null) return '0.00';
  const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (isNaN(numero)) return '0.00';
  return numero.toFixed(2);
};

const obtenerColor = (id: number): string => {
  const colores = [
    '#FF5722', '#4CAF50', '#2196F3', '#9C27B0',
    '#FF9800', '#E91E63', '#00BCD4', '#8BC34A',
    '#FF6F00', '#2E7D32', '#00695C', '#4A148C'
  ];
  return colores[id % colores.length];
};

// ============================================================
// 📱 COMPONENTE PRINCIPAL
// ============================================================
export default function TarjetaOferta({
  oferta,
  onPresionar,
  estilo = 'default'
}: Props) {
  // Logs para debugging
  console.log('🖼️ [TarjetaOferta] Renderizando:', oferta.titulo);
  console.log('🖼️ [TarjetaOferta] Imagen:', oferta.imagen || 'Sin imagen');
  console.log('📐 [TarjetaOferta] Estilo:', estilo);

  // ✅ Determinar tamaños según estilo
  const esFeatured = estilo === 'featured';
  const esCompact = estilo === 'compact';

  const imagenHeight = esFeatured ? 160 : esCompact ? 80 : 120;
  const paddingVertical = esFeatured ? 20 : esCompact ? 10 : 16;
  const paddingHorizontal = esFeatured ? 20 : esCompact ? 12 : 16;
  const borderRadius = esFeatured ? 24 : esCompact ? 12 : 20;
  const minHeight = esFeatured ? 280 : esCompact ? 140 : 220;

  const colorPrincipal = oferta.color || obtenerColor(oferta.id);
  const colorFondo = colorPrincipal + '15';
  const colorBorde = colorPrincipal + '40';

  // ✅ Función para manejar error de imagen
  const handleImageError = (e: any) => {
    console.log('❌ Error cargando imagen:', e.nativeEvent.error);
    console.log('URL que falló:', oferta.imagen);
  };

  // ✅ Función para manejar carga exitosa
  const handleImageLoad = () => {
    console.log('✅ Imagen cargada correctamente:', oferta.imagen);
  };

  return (
    <TouchableOpacity
      style={[
        estilos.tarjeta,
        {
          paddingVertical,
          paddingHorizontal,
          borderRadius,
          minHeight,
          backgroundColor: colorFondo,
          borderColor: colorBorde,
        }
      ]}
      onPress={() => onPresionar(oferta)}
      activeOpacity={0.85}
    >
      {/* ✅ GLOW DE FONDO */}
      <View style={[estilos.glowFondo, { backgroundColor: colorPrincipal + '10' }]} />

      <View style={estilos.contenido}>
        {/* ✅ IMAGEN DE LA OFERTA */}
        {oferta.imagen ? (
          <Image
            source={{ uri: oferta.imagen }}
            style={[
              estilos.imagenOferta,
              {
                height: imagenHeight,
                borderRadius: esFeatured ? 16 : esCompact ? 8 : 12,
              }
            ]}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <View style={[
            estilos.sinImagen,
            {
              height: imagenHeight,
              borderRadius: esFeatured ? 16 : esCompact ? 8 : 12,
              backgroundColor: colorPrincipal + '20',
            }
          ]}>
            <Ionicons
              name="image-outline"
              size={esFeatured ? 48 : esCompact ? 28 : 36}
              color={colorPrincipal + '60'}
            />
            <Text style={[
              estilos.sinImagenTexto,
              {
                fontSize: esFeatured ? 14 : esCompact ? 10 : 12,
                color: colorPrincipal + '60',
              }
            ]}>
              Sin imagen
            </Text>
          </View>
        )}

        {/* ✅ ETIQUETA DE DESCUENTO */}
        <View style={[
          estilos.etiquetaDescuento,
          {
            backgroundColor: colorPrincipal + '40',
            paddingHorizontal: esFeatured ? 14 : esCompact ? 8 : 12,
            paddingVertical: esFeatured ? 8 : esCompact ? 4 : 6,
            borderRadius: esFeatured ? 14 : esCompact ? 8 : 12,
            marginTop: esFeatured ? 12 : esCompact ? 6 : 10,
          }
        ]}>
          <Text style={[
            estilos.descuentoTexto,
            {
              fontSize: esFeatured ? 16 : esCompact ? 11 : 14,
              color: colorPrincipal,
            }
          ]}>
            🔥 {oferta.descuento}
          </Text>
        </View>

        {/* ✅ TÍTULO */}
        <Text style={[
          estilos.titulo,
          {
            fontSize: esFeatured ? 22 : esCompact ? 14 : 18,
            marginTop: esFeatured ? 8 : esCompact ? 4 : 6,
          }
        ]}>
          {oferta.titulo}
        </Text>

        {/* ✅ PRECIOS */}
        <View style={[
          estilos.preciosContainer,
          { marginTop: esFeatured ? 8 : esCompact ? 4 : 6 }
        ]}>
          {oferta.precio_original && (
            <Text style={[
              estilos.precioOriginal,
              {
                fontSize: esFeatured ? 16 : esCompact ? 12 : 14,
              }
            ]}>
              ${formatearPrecio(oferta.precio_original)}
            </Text>
          )}
          <Text style={[
            estilos.precio,
            {
              fontSize: esFeatured ? 32 : esCompact ? 20 : 26,
              color: colorPrincipal,
            }
          ]}>
            ${formatearPrecio(oferta.precio_oferta || oferta.precio)}
          </Text>
        </View>

        {/* ✅ DESCRIPCIÓN (si existe) */}
        {oferta.descripcion && !esCompact && (
          <Text style={[
            estilos.descripcion,
            {
              fontSize: esFeatured ? 14 : 12,
              marginTop: esFeatured ? 8 : 6,
            }
          ]} numberOfLines={2}>
            {oferta.descripcion}
          </Text>
        )}

        {/* ✅ BOTÓN DE ACCIÓN */}
        <TouchableOpacity
          style={[
            estilos.botonAccion,
            {
              backgroundColor: colorPrincipal,
              paddingVertical: esFeatured ? 10 : esCompact ? 6 : 8,
              paddingHorizontal: esFeatured ? 20 : esCompact ? 12 : 16,
              borderRadius: esFeatured ? 14 : esCompact ? 8 : 12,
              marginTop: esFeatured ? 12 : esCompact ? 8 : 10,
              alignSelf: 'flex-start',
            }
          ]}
          onPress={() => onPresionar(oferta)}
          activeOpacity={0.7}
        >
          <Text style={[
            estilos.botonAccionTexto,
            {
              fontSize: esFeatured ? 16 : esCompact ? 12 : 14,
              color: COLORS.blanco,
            }
          ]}>
            Ver oferta →
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// 📋 ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  tarjeta: {
    width: width * 0.7,
    marginRight: 16,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glowFondo: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.3,
  },
  contenido: {
    zIndex: 1,
    flex: 1,
  },
  imagenOferta: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sinImagen: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  sinImagenTexto: {
    fontWeight: '500',
    marginTop: 4,
  },
  etiquetaDescuento: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  descuentoTexto: {
    fontWeight: 'bold',
  },
  titulo: {
    color: COLORS.blanco,
    fontWeight: 'bold',
  },
  preciosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  precioOriginal: {
    color: COLORS.grisClaro,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  precio: {
    fontWeight: 'bold',
  },
  descripcion: {
    color: COLORS.grisClaro,
    opacity: 0.7,
    lineHeight: 16,
  },
  botonAccion: {
    overflow: 'hidden',
  },
  botonAccionTexto: {
    fontWeight: 'bold',
  },
});

// ============================================================
// 🎯 EXPORTACIÓN ADICIONAL
// ============================================================
export { formatearPrecio, obtenerColor };