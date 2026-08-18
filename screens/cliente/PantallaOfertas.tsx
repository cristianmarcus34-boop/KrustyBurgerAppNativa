// screens/cliente/PantallaOfertas.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Image,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';
import { formatearPrecio } from '../../lib/formateador';

// ============================================================
// 🎨 SISTEMA DE DISEÑO - CLARO Y ELEGANTE
// ============================================================
const DESIGN = {
  colors: {
    fondo: '#F5F2ED',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.04)',
    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',
    accent: '#E53935',
    accentLight: '#FF6B6B',
    accentSecondary: '#F5C518',
    accentSecondaryLight: '#FFE135',
    gradientStart: '#E53935',
    gradientEnd: '#F5C518',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    rosa: '#EC407A',
    azul: '#1A237E',
    azulClaro: '#3949AB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return { isTablet, isDesktop, isSmallPhone, width, height, getValor, spacing };
};

// ✅ INTERFAZ DE OFERTA
interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  descuento: string;
  precio_original: number;
  precio_oferta: number;
  activa: boolean;
  imagen?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export default function PantallaOfertas(props: any) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const responsive = useResponsive();
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

  const isTablet = responsive.isTablet;
  const isSmallPhone = responsive.isSmallPhone;

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

  const navegarADetalle = (oferta: Oferta) => {
    console.log(`👉 [PantallaOfertas] Navegando a detalle de oferta: ${oferta.titulo}`);
    props.navigation.navigate('DetalleOferta', { oferta });
  };

  const renderOferta = ({ item, index }: { item: Oferta; index: number }) => {
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });
    const itemSlide = slideUpAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20 * (index + 1), 0],
    });
    const colorOferta = getColorPorId(item.id);

    const imagenSize = isTablet ? 100 : isSmallPhone ? 70 : 80;
    const imagenRadius = isTablet ? 16 : isSmallPhone ? 10 : 12;

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
            styles.card,
            {
              padding: tarjetaPadding,
              borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
              borderColor: colorOferta + '40',
              backgroundColor: DESIGN.colors.surface,
              shadowColor: DESIGN.colors.cardShadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => navegarADetalle(item)}
        >
          {/* ✅ BADGE DE DESCUENTO */}
          <View style={[
            styles.descuentoBadge,
            {
              paddingHorizontal: isTablet ? 18 : isSmallPhone ? 10 : 14,
              paddingVertical: isTablet ? 10 : isSmallPhone ? 6 : 8,
              borderBottomLeftRadius: isTablet ? 18 : isSmallPhone ? 10 : 14,
              backgroundColor: colorOferta,
            }
          ]}>
            <Text style={[
              styles.descuentoTexto,
              {
                fontSize: descuentoSize,
                color: DESIGN.colors.surface,
              }
            ]}>
              🔥 {item.descuento}
            </Text>
          </View>

          <View style={styles.cardContent}>
            {/* ✅ IMAGEN */}
            {item.imagen ? (
              <Image
                source={{ uri: item.imagen }}
                style={[
                  styles.ofertaImagen,
                  {
                    width: imagenSize,
                    height: imagenSize,
                    borderRadius: imagenRadius,
                    marginRight: 16,
                  }
                ]}
                resizeMode="cover"
                onError={(e) => {
                  console.log('❌ Error cargando imagen:', e.nativeEvent.error);
                }}
              />
            ) : (
              <View style={[
                styles.emojiContainer,
                {
                  width: imagenSize,
                  height: imagenSize,
                  borderRadius: imagenRadius,
                  backgroundColor: colorOferta + '15',
                  marginRight: 16,
                }
              ]}>
                <Text style={[styles.emoji, { fontSize: imagenSize * 0.5 }]}>🏷️</Text>
              </View>
            )}

            {/* ✅ INFORMACIÓN */}
            <View style={styles.info}>
              <Text style={[
                styles.ofertaTitulo,
                {
                  fontSize: ofertaTituloSize,
                  color: colorOferta,
                }
              ]}>
                {item.titulo}
              </Text>
              <Text style={[
                styles.ofertaDesc,
                {
                  fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12,
                  color: DESIGN.colors.textSecondary,
                }
              ]} numberOfLines={2}>
                {item.descripcion || 'Descripción no disponible'}
              </Text>
              <View style={styles.precios}>
                <Text style={[
                  styles.precioOriginal,
                  {
                    fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                    color: DESIGN.colors.textTertiary,
                  }
                ]}>
                  {formatearPrecio(item.precio_original)}
                </Text>
                <Text style={[
                  styles.precioOferta,
                  {
                    fontSize: precioOfertaSize,
                    color: colorOferta,
                  }
                ]}>
                  {formatearPrecio(item.precio_oferta)}
                </Text>
              </View>
            </View>

            {/* ✅ FLECHA */}
            <Ionicons
              name="chevron-forward"
              size={isTablet ? 28 : isSmallPhone ? 18 : 24}
              color={DESIGN.colors.textTertiary}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DESIGN.colors.gradientStart, DESIGN.colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + (isTablet ? 20 : 10),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: isTablet ? 16 : 12,
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DESIGN.colors.surface} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: tituloSize, color: DESIGN.colors.surface }]}>
          🎫 Ofertas
        </Text>
        <View style={styles.headerRight}>
          <Text style={[styles.counter, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12, color: DESIGN.colors.surface + '60' }]}>
            {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
          </Text>
        </View>
      </View>

      {/* ✅ CONTENIDO */}
      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN.colors.accentSecondary} />
          <Text style={[styles.loadingText, { fontSize: isTablet ? 16 : isSmallPhone ? 13 : 14, color: DESIGN.colors.surface + '70' }]}>
            Cargando ofertas...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
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
              tintColor={DESIGN.colors.accentSecondary}
              colors={[DESIGN.colors.accentSecondary]}
            />
          }
        >
          {ofertas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={isTablet ? 80 : 60} color={DESIGN.colors.surface + '20'} />
              <Text style={[styles.emptyText, { fontSize: isTablet ? 20 : isSmallPhone ? 16 : 18, color: DESIGN.colors.surface }]}>
                No hay ofertas disponibles
              </Text>
              <Text style={[styles.emptySubText, { fontSize: isTablet ? 15 : isSmallPhone ? 12 : 13, color: DESIGN.colors.surface + '60' }]}>
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

// ============================================================
// 🎨 ESTILOS - CLAROS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN.colors.fondo,
  },
  backgroundGradient: {
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
    borderBottomColor: DESIGN.colors.surface + '10',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counter: {
    fontWeight: '500',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontWeight: '400',
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 1,
  },
  card: {
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ofertaImagen: {
    backgroundColor: DESIGN.colors.surfaceHover,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {},
  info: {
    flex: 1,
  },
  ofertaTitulo: {
    fontWeight: 'bold',
  },
  ofertaDesc: {
    marginTop: 2,
    opacity: 0.7,
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
  },
  precioOferta: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});