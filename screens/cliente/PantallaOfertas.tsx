// screens/cliente/PantallaOfertas.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

// ============================================================
// 🎨 PALETA DE COLORES
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

// ✅ FUNCIÓN PARA FORMATEAR PRECIOS DE FORMA SEGURA
const formatearPrecio = (precio: string | number | undefined): string => {
  if (precio === undefined || precio === null) return '0.00';
  const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (isNaN(numero)) return '0.00';
  return numero.toFixed(2);
};

// ✅ INTERFAZ DE OFERTA
interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  descuento: string;
  precio_original: number | string;
  precio_oferta: number | string;
  activa: boolean;
  imagen?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export default function PantallaOfertas(props: any) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const insets = useSafeAreaInsets();

  // ✅ Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    console.log('🔄 [PantallaOfertas] Componente montado');
    cargarOfertas();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cargarOfertas = async () => {
    console.log('📦 [PantallaOfertas] Cargando ofertas...');
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activa', true);

      if (error) {
        console.error('❌ Error cargando ofertas:', error);
        setOfertas([]);
      } else {
        console.log(`📦 [PantallaOfertas] Ofertas cargadas: ${data?.length || 0}`);
        // ✅ Verificar imágenes
        data?.forEach((item, index) => {
          console.log(`🖼️ [PantallaOfertas] Oferta ${index + 1} - ${item.titulo}: imagen = ${item.imagen || 'Sin imagen'}`);
        });
        setOfertas(data as Oferta[] || []);
      }
    } catch (error) {
      console.error('❌ Error en cargarOfertas:', error);
      setOfertas([]);
    } finally {
      setCargando(false);
      setRefrescando(false);
      console.log('🏁 [PantallaOfertas] Carga de ofertas finalizada');
    }
  };

  const manejarRefresh = async () => {
    console.log('🔄 [PantallaOfertas] Refrescando ofertas...');
    setRefrescando(true);
    await cargarOfertas();
  };

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 12 : 16;
  const tituloSize = isTablet ? 34 : isSmallPhone ? 24 : 28;
  const tarjetaPadding = isTablet ? 20 : isSmallPhone ? 12 : 16;
  const ofertaTituloSize = isTablet ? 20 : isSmallPhone ? 15 : 17;
  const precioOfertaSize = isTablet ? 28 : isSmallPhone ? 20 : 24;
  const descuentoSize = isTablet ? 16 : isSmallPhone ? 12 : 14;

  const getColorPorId = (id: number) => {
    const colores = [
      '#FF5722', '#4CAF50', '#2196F3', '#9C27B0',
      '#FF9800', '#E91E63', '#00BCD4', '#8BC34A',
      '#FF6F00', '#2E7D32', '#00695C', '#4A148C'
    ];
    return colores[id % colores.length];
  };

  // ✅ Navegar al detalle de la oferta
  const navegarADetalle = (oferta: Oferta) => {
    console.log(`👉 [PantallaOfertas] Navegando a detalle de oferta: ${oferta.titulo}`);
    props.navigation.navigate('DetalleOferta', { oferta });
  };

  const renderOferta = ({ item, index }: { item: Oferta; index: number }) => {
    const delay = index * 100;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });
    const colorOferta = getColorPorId(item.id);

    return (
      <Animated.View
        key={item.id}
        style={{
          opacity: itemFade,
          transform: [{ translateY: itemSlide }],
        }}
      >
        <TouchableOpacity
          style={[
            estilos.tarjeta,
            {
              padding: tarjetaPadding,
              borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
              borderColor: colorOferta + '40',
              backgroundColor: colorOferta + '10',
            }
          ]}
          activeOpacity={0.8}
          onPress={() => navegarADetalle(item)}
        >
          {/* ✅ BADGE DE DESCUENTO */}
          <View style={[
            estilos.descuentoBadge,
            {
              paddingHorizontal: isTablet ? 18 : isSmallPhone ? 10 : 14,
              paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
              borderBottomLeftRadius: isTablet ? 18 : isSmallPhone ? 10 : 14,
              backgroundColor: colorOferta,
            }
          ]}>
            <Text style={[
              estilos.descuentoTexto,
              {
                fontSize: descuentoSize,
                color: COLORS.blanco,
              }
            ]}>
              🔥 {item.descuento}
            </Text>
          </View>

          <View style={estilos.tarjetaContenido}>
            {/* ✅ IMAGEN O PLACEHOLDER */}
            {item.imagen ? (
              <Image
                source={{ uri: item.imagen }}
                style={[
                  estilos.imagenOferta,
                  {
                    width: isTablet ? 70 : isSmallPhone ? 50 : 60,
                    height: isTablet ? 70 : isSmallPhone ? 50 : 60,
                    borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                    marginRight: 14,
                  }
                ]}
                resizeMode="cover"
                onError={(e) => {
                  console.log('❌ Error cargando imagen en PantallaOfertas:', e.nativeEvent.error);
                  console.log('URL que falló:', item.imagen);
                }}
                onLoad={() => console.log('✅ Imagen cargada en PantallaOfertas:', item.imagen)}
              />
            ) : (
              <View style={[
                estilos.emojiContenedor,
                {
                  width: isTablet ? 70 : isSmallPhone ? 50 : 60,
                  height: isTablet ? 70 : isSmallPhone ? 50 : 60,
                  borderRadius: isTablet ? 16 : isSmallPhone ? 10 : 12,
                  backgroundColor: colorOferta + '20',
                  marginRight: 14,
                }
              ]}>
                <Text style={[estilos.emoji, { fontSize: isTablet ? 36 : isSmallPhone ? 24 : 30 }]}>🏷️</Text>
              </View>
            )}

            {/* ✅ INFORMACIÓN */}
            <View style={estilos.info}>
              <Text style={[
                estilos.ofertaTitulo,
                {
                  fontSize: ofertaTituloSize,
                  color: colorOferta,
                }
              ]}>
                {item.titulo}
              </Text>
              <Text style={[
                estilos.ofertaDesc,
                {
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                }
              ]} numberOfLines={2}>
                {item.descripcion || 'Descripción no disponible'}
              </Text>
              <View style={estilos.precios}>
                <Text style={[
                  estilos.precioOriginal,
                  {
                    fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                  }
                ]}>
                  ${formatearPrecio(item.precio_original)}
                </Text>
                <Text style={[
                  estilos.precioOferta,
                  {
                    fontSize: precioOfertaSize,
                    color: colorOferta,
                  }
                ]}>
                  ${formatearPrecio(item.precio_oferta)}
                </Text>
              </View>
            </View>

            {/* ✅ FLECHA */}
            <Ionicons
              name="chevron-forward"
              size={isTablet ? 28 : isSmallPhone ? 18 : 24}
              color={COLORS.grisClaro}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[COLORS.verde, COLORS.negro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        estilos.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.blanco} />
        </TouchableOpacity>
        <Text style={[estilos.titulo, { fontSize: tituloSize }]}>
          🎫 Ofertas
        </Text>
        <View style={estilos.headerRight}>
          <Text style={[estilos.contador, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
            {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
          </Text>
        </View>
      </View>

      {/* ✅ CONTENIDO */}
      {cargando ? (
        <View style={estilos.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.amarillo} />
          <Text style={[estilos.loadingTexto, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14 }]}>
            Cargando ofertas...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            estilos.scroll,
            {
              paddingHorizontal: paddingHorizontal,
              paddingBottom: insets.bottom + 150,
              paddingTop: isTablet ? 8 : 4,
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={COLORS.amarillo}
              colors={[COLORS.amarillo]}
            />
          }
        >
          {ofertas.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons name="pricetag-outline" size={isTablet ? 80 : 60} color={COLORS.grisClaro + '30'} />
              <Text style={[estilos.vacioTexto, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18 }]}>
                No hay ofertas disponibles
              </Text>
              <Text style={[estilos.vacioSub, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13 }]}>
                Vuelve pronto para ver nuevas promociones 🚀
              </Text>
            </View>
          ) : (
            ofertas.map((item, index) => renderOferta({ item, index }))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.negro,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blanco + '10',
  },
  botonVolver: {
    padding: 4,
    marginRight: 8,
  },
  titulo: {
    fontWeight: 'bold',
    color: COLORS.blanco,
    letterSpacing: 1,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contador: {
    color: COLORS.grisClaro,
    fontWeight: '500',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTexto: {
    color: COLORS.grisClaro,
    fontWeight: '400',
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 1,
  },
  tarjeta: {
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  descuentoBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  descuentoTexto: {
    fontWeight: 'bold',
  },
  tarjetaContenido: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagenOferta: {
    backgroundColor: COLORS.negro + '20',
    borderWidth: 1,
    borderColor: COLORS.blanco + '10',
  },
  emojiContenedor: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    // Tamaño dinámico
  },
  info: {
    flex: 1,
  },
  ofertaTitulo: {
    fontWeight: 'bold',
  },
  ofertaDesc: {
    marginTop: 2,
    opacity: 0.7,
    color: COLORS.grisClaro,
  },
  precios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  precioOriginal: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
    color: COLORS.grisClaro,
  },
  precioOferta: {
    fontWeight: 'bold',
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  vacioTexto: {
    color: COLORS.blanco,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  vacioSub: {
    color: COLORS.grisClaro,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});