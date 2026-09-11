// screens/cliente/PantallaOfertas.tsx - TEMA CLARO UNIFICADO
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { DISENO } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { formatearPrecio } from '../../lib/formateador';

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

  // ✅ Tamaños unificados con el resto de pantallas
  const paddingHorizontal = responsive.getValor({ tablet: 40, normal: 20, small: 16 });
  const tituloSize = responsive.getValor({ tablet: 24, normal: 20, small: 17 });
  const tarjetaPadding = responsive.getValor({ tablet: 20, normal: 16, small: 12 });
  const ofertaTituloSize = responsive.getValor({ tablet: 16, normal: 14, small: 12 });
  const precioOfertaSize = responsive.getValor({ tablet: 22, normal: 18, small: 16 });
  const descuentoSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });
  const descSize = responsive.getValor({ tablet: 13, normal: 12, small: 11 });
  const precioOriginalSize = responsive.getValor({ tablet: 14, normal: 12, small: 11 });

  // ✅ Paleta de marca (sin naranja)
  const PALETA_OFERTAS = [
    DISENO.colors.accent,          // 🔴 Rojo Krusty
    DISENO.colors.accentSecondary, // 🟡 Amarillo Krusty
    DISENO.colors.verde,           // 🟢 Verde
    DISENO.colors.rosa,            // 🌸 Rosa
    DISENO.colors.azul,            // 🔵 Azul
    DISENO.colors.verdeClaro,      // 🟢 Verde claro
    DISENO.colors.azulClaro,       // 🔵 Azul claro
    DISENO.colors.accentLight,     // 🔴 Rojo claro
  ];

  const getColorPorId = (id: number) => PALETA_OFERTAS[id % PALETA_OFERTAS.length];

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

    const imagenSize = responsive.getValor({ tablet: 100, normal: 80, small: 70 });
    const imagenRadius = responsive.getValor({ tablet: 16, normal: 12, small: 10 });

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
              borderRadius: responsive.getValor({ tablet: 20, normal: 16, small: 14 }),
              borderColor: colorOferta + '40',
              borderWidth: 1,
              backgroundColor: DISENO.colors.surface,
              shadowColor: colorOferta + '25',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 4,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => navegarADetalle(item)}
        >
          {/* ✅ BADGE DE DESCUENTO CON GRADIENTE */}
          <LinearGradient
            colors={[colorOferta, colorOferta + 'CC']}
            style={[
              styles.descuentoBadge,
              {
                paddingHorizontal: responsive.getValor({ tablet: 18, normal: 14, small: 10 }),
                paddingVertical: responsive.getValor({ tablet: 10, normal: 8, small: 6 }),
                borderBottomLeftRadius: responsive.getValor({ tablet: 18, normal: 14, small: 10 }),
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[
              styles.descuentoTexto,
              { fontSize: descuentoSize, color: DISENO.colors.surface }
            ]}>
              🔥 {item.descuento}
            </Text>
          </LinearGradient>

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
              <Text
                style={[
                  styles.ofertaTitulo,
                  { fontSize: ofertaTituloSize, color: colorOferta }
                ]}
                numberOfLines={1}
              >
                {item.titulo}
              </Text>
              <Text
                style={[
                  styles.ofertaDesc,
                  { fontSize: descSize, color: DISENO.colors.textSecondary }
                ]}
                numberOfLines={2}
              >
                {item.descripcion || 'Descripción no disponible'}
              </Text>
              <View style={styles.precios}>
                <Text style={[
                  styles.precioOriginal,
                  { fontSize: precioOriginalSize, color: DISENO.colors.textTertiary }
                ]}>
                  {formatearPrecio(item.precio_original)}
                </Text>
                <Text style={[
                  styles.precioOferta,
                  { fontSize: precioOfertaSize, color: colorOferta }
                ]}>
                  {formatearPrecio(item.precio_oferta)}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={responsive.getValor({ tablet: 28, normal: 24, small: 18 })}
              color={DISENO.colors.textTertiary}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ✅ FONDO CLARO (igual que Menu/Recompensas) */}
      <LinearGradient
        colors={[DISENO.colors.fondo, DISENO.colors.surface, DISENO.colors.fondo]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ GRADIENTE SOLO EN EL HEADER */}
      <LinearGradient
        colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
        style={styles.headerGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ✅ HEADER */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + responsive.getValor({ tablet: 20, normal: 12, small: 10 }),
          paddingHorizontal: paddingHorizontal,
          paddingBottom: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => props.navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={responsive.getValor({ tablet: 28, normal: 24, small: 22 })}
            color={DISENO.colors.surface}
          />
        </TouchableOpacity>

        {/* ✅ TÍTULO CON SIMPSONFONT */}
        <Text style={[styles.title, { fontSize: tituloSize, color: DISENO.colors.surface }]}>
          🎫 Ofertas
        </Text>

        <View style={styles.headerRight}>
          <Text style={[
            styles.counter,
            {
              fontSize: responsive.getValor({ tablet: 14, normal: 12, small: 11 }),
              color: DISENO.colors.surface + 'CC',
            }
          ]}>
            {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
          </Text>
        </View>
      </View>

      {/* ✅ CONTENIDO */}
      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DISENO.colors.accent} />
          <Text style={[
            styles.loadingText,
            {
              fontSize: responsive.getValor({ tablet: 16, normal: 14, small: 13 }),
              color: DISENO.colors.textSecondary,
            }
          ]}>
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
              paddingTop: responsive.getValor({ tablet: 16, normal: 12, small: 10 }),
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={manejarRefresh}
              tintColor={DISENO.colors.accent}
              colors={[DISENO.colors.accent]}
            />
          }
        >
          {ofertas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="pricetag-outline"
                size={responsive.getValor({ tablet: 80, normal: 70, small: 60 })}
                color={DISENO.colors.textTertiary + '40'}
              />
              {/* ✅ EMPTY CON SIMPSONFONT */}
              <Text style={[
                styles.emptyText,
                {
                  fontSize: responsive.getValor({ tablet: 18, normal: 16, small: 14 }),
                  color: DISENO.colors.text,
                }
              ]}>
                No hay ofertas disponibles
              </Text>
              {/* ✅ SUBTEXT CON FUENTE REGULAR */}
              <Text style={[
                styles.emptySubText,
                {
                  fontSize: responsive.getValor({ tablet: 14, normal: 13, small: 12 }),
                  color: DISENO.colors.textSecondary,
                }
              ]}>
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
// 🎨 ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DISENO.colors.fondo,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // ✅ GRADIENTE SOLO DEL HEADER (mismo tamaño que en Menú)
  headerGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: '19%',
    shadowColor: DISENO.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  // ✅ TÍTULO CON SIMPSONFONT
  title: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.5,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ✅ CONTADOR CON FUENTE REGULAR
  counter: {
    fontFamily: FUENTES.regular,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  // ✅ LOADING CON FUENTE REGULAR
  loadingText: {
    fontFamily: FUENTES.regular,
    fontWeight: '400',
    opacity: 0.7,
  },
  scroll: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  descuentoBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  // ✅ DESCUENTO CON SIMPSONFONT
  descuentoTexto: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ofertaImagen: {
    backgroundColor: DISENO.colors.surfaceHover,
    borderWidth: 1,
    borderColor: DISENO.colors.border,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {},
  info: {
    flex: 1,
  },
  // ✅ TÍTULO OFERTA CON SIMPSONFONT
  ofertaTitulo: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  // ✅ DESCRIPCIÓN CON FUENTE REGULAR
  ofertaDesc: {
    fontFamily: FUENTES.regular,
    marginTop: 2,
    opacity: 0.7,
    lineHeight: 16,
  },
  precios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  // ✅ PRECIO ORIGINAL CON FUENTE REGULAR
  precioOriginal: {
    fontFamily: FUENTES.regular,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  // ✅ PRECIO OFERTA CON SIMPSONFONT
  precioOferta: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  // ✅ EMPTY CON SIMPSONFONT
  emptyText: {
    fontFamily: FUENTES.display,
    fontWeight: '400',
    marginTop: 16,
    textAlign: 'center',
  },
  // ✅ SUBTEXT CON FUENTE REGULAR
  emptySubText: {
    fontFamily: FUENTES.regular,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});