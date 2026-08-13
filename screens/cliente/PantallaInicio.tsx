import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Animated,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaFavoritos } from '../../stores/tiendaFavoritos';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

export default function PantallaInicio(props: any) {
  const { perfil } = tiendaAutenticacion();
  const { cantidadTotal, agregarProducto } = tiendaCarrito();
  const { favoritos, favoritosData, cargando: cargandoFavoritos, cargarFavoritos, limpiarFavoritos } = tiendaFavoritos();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [ofertas, setOfertas] = useState<any[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const arrowTranslate = useRef(new Animated.Value(10)).current;

  const isTablet = width >= 768;
  const isSmallPhone = width < 375;

  const cargarOfertas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activa', true);

      if (error) {
        console.error('Error cargando ofertas:', error);
        setOfertas([]);
      } else {
        console.log(`📦 Ofertas cargadas en Inicio: ${data?.length || 0}`);
        setOfertas(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setOfertas([]);
    } finally {
      setCargandoOfertas(false);
    }
  }, []);

  const cargarFavoritosUsuario = useCallback(async () => {
    if (perfil?.id) {
      await cargarFavoritos(perfil.id);
    } else {
      limpiarFavoritos();
    }
  }, [perfil?.id, cargarFavoritos, limpiarFavoritos]);

  useEffect(() => {
    cargarOfertas();
    cargarFavoritosUsuario();

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

    const timeout1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(arrowOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(arrowTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    const timeout2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(arrowTranslate, {
          toValue: 10,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [cargarOfertas, cargarFavoritosUsuario]);

  const paddingHorizontal = isTablet ? 40 : isSmallPhone ? 16 : 20;
  const gapCategorias = isTablet ? 16 : isSmallPhone ? 10 : 12;
  const paddingTop = insets.top + (isTablet ? 20 : 10);
  const paddingBottom = insets.bottom + 20;

  const saludoSize = isTablet ? 26 : isSmallPhone ? 16 : 20;
  const puntosSize = isTablet ? 15 : isSmallPhone ? 10 : 12;
  const puntosPadding = isTablet ? 12 : isSmallPhone ? 8 : 10;

  const carritoSize = isTablet ? 52 : isSmallPhone ? 42 : 48;
  const carritoPadding = isTablet ? 10 : isSmallPhone ? 8 : 9;
  const carritoIconSize = isTablet ? 26 : isSmallPhone ? 20 : 24;

  const contadorSize = isTablet ? 30 : isSmallPhone ? 24 : 26;
  const contadorTextSize = isTablet ? 15 : isSmallPhone ? 12 : 13;
  const contadorTop = isTablet ? -6 : isSmallPhone ? -4 : -5;
  const contadorRight = isTablet ? -6 : isSmallPhone ? -4 : -5;
  const contadorBorderWidth = isTablet ? 2.5 : isSmallPhone ? 2 : 2;

  const seccionTituloSize = isTablet ? 22 : isSmallPhone ? 15 : 18;
  const seccionMarginTop = isTablet ? 24 : isSmallPhone ? 16 : 20;

  const cardPadding = isTablet ? 20 : isSmallPhone ? 14 : 18;
  const ofertaDescuentoSize = isTablet ? 32 : isSmallPhone ? 22 : 28;
  const ofertaTituloSize = isTablet ? 18 : isSmallPhone ? 13 : 16;
  const ofertaPrecioSize = isTablet ? 26 : isSmallPhone ? 18 : 22;
  const cardMinHeight = isTablet ? 190 : isSmallPhone ? 160 : 180;

  const categoriaPadding = isTablet ? 20 : isSmallPhone ? 14 : 18;
  const categoriaIconSize = isTablet ? 44 : isSmallPhone ? 32 : 38;
  const categoriaTextSize = isTablet ? 16 : isSmallPhone ? 12 : 14;
  const categoriaBorderRadius = isTablet ? 20 : isSmallPhone ? 14 : 16;

  const favoritoPadding = isTablet ? 18 : isSmallPhone ? 12 : 16;
  const favoritoEmojiSize = isTablet ? 50 : isSmallPhone ? 38 : 44;
  const favoritoEmojiContainer = isTablet ? 54 : isSmallPhone ? 44 : 50;
  const favoritoTituloSize = isTablet ? 17 : isSmallPhone ? 13 : 15;
  const favoritoPrecioSize = isTablet ? 18 : isSmallPhone ? 14 : 16;
  const botonAgregarPaddingH = isTablet ? 18 : isSmallPhone ? 12 : 16;
  const botonAgregarPaddingV = isTablet ? 9 : isSmallPhone ? 6 : 8;
  const botonAgregarTextSize = isTablet ? 15 : isSmallPhone ? 11 : 13;

  const getCardWidth = () => {
    const availableWidth = width - paddingHorizontal * 2;
    if (isTablet) {
      return availableWidth * 0.45;
    } else if (isSmallPhone) {
      return availableWidth * 0.75;
    } else {
      return availableWidth * 0.7;
    }
  };

  const cardWidth = getCardWidth();

  const categorias = [
    { nombre: 'Hamburguesas', icono: '🍔', color: Colores.acento },
    { nombre: 'Combos', icono: '🍟', color: Colores.primario },
    { nombre: 'Bebidas', icono: '🥤', color: Colores.azulHomero },
    { nombre: 'Postres', icono: '🍦', color: Colores.rosaMaggie },
  ];

  const getColorPorId = useCallback((id: number) => {
    const colores = [
      Colores.acento, Colores.verdeKrusty, Colores.azulHomero, Colores.moradoLisa,
      Colores.primario, Colores.rosaMaggie, Colores.verdeClaro, Colores.secundario
    ];
    return colores[id % colores.length];
  }, []);

  const renderOferta = useCallback(({ item, index }: { item: any; index: number }) => {
    const colorOferta = getColorPorId(item.id);
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });

    const tieneEnvioGratis = item.descuento?.toLowerCase().includes('envío gratis') ||
      item.descuento?.toLowerCase().includes('envio gratis');

    return (
      <Animated.View
        key={item.id}
        style={[
          {
            opacity: itemFade,
            width: cardWidth,
            marginRight: isTablet ? 16 : isSmallPhone ? 10 : 12,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            estilos.tarjetaOferta,
            {
              backgroundColor: colorOferta + '15',
              padding: cardPadding,
              borderColor: colorOferta,
              minHeight: cardMinHeight,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => {
            props.navigation.navigate('DetalleOferta', { oferta: item });
          }}
        >
          {tieneEnvioGratis && (
            <View style={[
              estilos.badgeEnvioGratis,
              {
                backgroundColor: Colores.verdeKrusty,
                paddingHorizontal: isTablet ? 12 : 8,
                paddingVertical: isTablet ? 6 : 4,
                borderRadius: isTablet ? 10 : 8,
                gap: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }
            ]}>
              <Ionicons name="rocket" size={isTablet ? 16 : 12} color={Colores.textoClaro} />
              <Text style={[
                estilos.badgeEnvioGratisTexto,
                {
                  fontSize: isTablet ? 11 : 9,
                  color: Colores.textoClaro,
                  fontWeight: 'bold',
                }
              ]}>
                🚚 Envío gratis
              </Text>
            </View>
          )}

          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[
                estilos.ofertaImagen,
                {
                  width: '100%',
                  height: isTablet ? 120 : isSmallPhone ? 80 : 100,
                  borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                  marginBottom: 10,
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              estilos.ofertaSinImagen,
              {
                height: isTablet ? 120 : isSmallPhone ? 80 : 100,
                borderRadius: isTablet ? 12 : isSmallPhone ? 8 : 10,
                marginBottom: 10,
                backgroundColor: colorOferta + '20',
              }
            ]}>
              <Ionicons name="image-outline" size={isTablet ? 40 : isSmallPhone ? 28 : 32} color={Colores.textoGris + '40'} />
              <Text style={[estilos.ofertaSinImagenTexto, { fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11 }]}>
                Sin imagen
              </Text>
            </View>
          )}

          <Text style={[estilos.ofertaDescuento, {
            fontSize: ofertaDescuentoSize,
            color: colorOferta
          }]}>
            🔥 {item.descuento}
          </Text>
          <Text style={[estilos.ofertaTitulo, { fontSize: ofertaTituloSize }]} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={[estilos.ofertaPrecio, { fontSize: ofertaPrecioSize }]}>
            ${item.precio_oferta?.toFixed(2)}
          </Text>
          <Text style={[estilos.ofertaPrecioOriginal, { fontSize: isTablet ? 14 : isSmallPhone ? 11 : 12 }]}>
            Antes: ${item.precio_original?.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={[estilos.botonVerOferta, {
              backgroundColor: colorOferta,
              paddingVertical: isTablet ? 6 : isSmallPhone ? 4 : 5,
              paddingHorizontal: isTablet ? 14 : isSmallPhone ? 10 : 12,
            }]}
            activeOpacity={0.7}
            onPress={() => {
              props.navigation.navigate('DetalleOferta', { oferta: item });
            }}
          >
            <Text style={[estilos.botonVerOfertaTexto, {
              fontSize: isTablet ? 12 : isSmallPhone ? 10 : 11
            }]}>
              Ver Oferta
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [cardWidth, isTablet, cardPadding, cardMinHeight, ofertaDescuentoSize, ofertaTituloSize, ofertaPrecioSize, fadeAnim, props.navigation, getColorPorId]);

  const renderFavorito = useCallback(({ item, index }: { item: any; index: number }) => {
    const contador = favoritosData.find((f) => f.producto_id === item.id)?.contador || 1;
    const itemFade = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 1],
    });

    const favoritoWidth = isTablet ? width * 0.35 : isSmallPhone ? width * 0.75 : width * 0.6;

    return (
      <Animated.View
        key={item.id}
        style={[
          {
            opacity: itemFade,
            width: favoritoWidth,
            marginRight: isTablet ? 16 : isSmallPhone ? 10 : 12,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            estilos.tarjetaFavorito,
            {
              padding: favoritoPadding,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 16,
              borderColor: Colores.primario + '20',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: Colores.fondoOscuro + '60',
              borderWidth: 1,
            }
          ]}
          onPress={() => props.navigation.navigate('DetalleProducto', { producto: item })}
          activeOpacity={0.7}
        >
          {item.imagen ? (
            <Image
              source={{ uri: item.imagen }}
              style={[
                estilos.favoritoImagen,
                {
                  width: favoritoEmojiContainer,
                  height: favoritoEmojiContainer,
                  borderRadius: favoritoEmojiContainer / 2,
                  marginBottom: 10,
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              estilos.favoritoEmojiContainer,
              {
                width: favoritoEmojiContainer,
                height: favoritoEmojiContainer,
                borderRadius: favoritoEmojiContainer / 2,
                marginBottom: 10,
                backgroundColor: Colores.primario + '15',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: Colores.primario + '30',
              }
            ]}>
              <Text style={[estilos.emojiGrande, { fontSize: favoritoEmojiSize }]}>🍔</Text>
            </View>
          )}

          <View style={[
            estilos.favoritoInfo,
            {
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}>
            <View style={[
              estilos.favoritoHeader,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }
            ]}>
              <Text style={[estilos.favoritoTitulo, { fontSize: favoritoTituloSize }]} numberOfLines={1}>
                {item.nombre}
              </Text>
              {contador > 1 && (
                <View style={[
                  estilos.favoritoContadorBadge,
                  {
                    backgroundColor: Colores.primario + '20',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colores.primario + '30',
                  }
                ]}>
                  <Text style={[
                    estilos.favoritoContadorTexto,
                    {
                      color: Colores.primario,
                      fontSize: 9,
                      fontWeight: 'bold',
                    }
                  ]}>
                    ×{contador}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[estilos.favoritoPrecio, { fontSize: favoritoPrecioSize }]} numberOfLines={1}>
              ${item.precio?.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              estilos.botonAgregar,
              {
                marginTop: 8,
                paddingHorizontal: botonAgregarPaddingH,
                paddingVertical: botonAgregarPaddingV,
                borderRadius: 20,
                overflow: 'hidden',
                width: '100%',
              }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              agregarProducto(item);
              Alert.alert('🎉', `${item.nombre} agregado al carrito`);
            }}
          >
            <LinearGradient
              colors={[Colores.primario, Colores.primarioOscuro]}
              style={[
                estilos.botonAgregarGradient,
                {
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }
              ]}
            >
              <Text style={[estilos.botonAgregarTexto, { fontSize: botonAgregarTextSize }]}>
                + Agregar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [favoritosData, fadeAnim, isTablet, width, favoritoPadding, favoritoEmojiContainer, favoritoEmojiSize, favoritoTituloSize, favoritoPrecioSize, botonAgregarPaddingH, botonAgregarPaddingV, botonAgregarTextSize, agregarProducto, props.navigation]);

  const onRefresh = useCallback(() => {
    setCargandoOfertas(true);
    cargarOfertas();
    cargarFavoritosUsuario();
  }, [cargarOfertas, cargarFavoritosUsuario]);

  return (
    <View style={estilos.contenedor}>
      <LinearGradient
        colors={[Colores.verdeKrusty, Colores.fondoOscuro]}
        style={estilos.fondoGradiente}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scrollContent,
          {
            paddingBottom: paddingBottom,
            paddingTop: paddingTop,
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={cargandoOfertas}
            onRefresh={onRefresh}
            tintColor={Colores.primario}
            colors={[Colores.primario]}
          />
        }
      >
        {perfil?.rol === 'admin' && (
          <TouchableOpacity
            style={[estilos.botonAdmin, {
              paddingHorizontal: paddingHorizontal,
              marginBottom: 8,
            }]}
            onPress={() => props.navigation.navigate('PanelAdmin')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={isTablet ? 20 : 16} color={Colores.primario} />
            <Text style={[estilos.botonAdminTexto, { fontSize: isTablet ? 16 : 13 }]}>
              Volver al Panel
            </Text>
          </TouchableOpacity>
        )}

        <View style={[estilos.encabezado, {
          paddingHorizontal: paddingHorizontal,
          paddingTop: isTablet ? 8 : isSmallPhone ? 4 : 6,
          marginBottom: 16,
        }]}>
          <View style={estilos.encabezadoIzquierdo}>
            <Text style={[estilos.saludo, { fontSize: saludoSize }]}>
              ¡Hola, {perfil?.nombre_cliente || 'Cliente'}! 👋
            </Text>
            <View style={[
              estilos.puntosContainer,
              {
                paddingHorizontal: puntosPadding,
                paddingVertical: isTablet ? 5 : isSmallPhone ? 3 : 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
                backgroundColor: Colores.fondoOscuro + '40',
                borderRadius: 20,
                alignSelf: 'flex-start',
              }
            ]}>
              <Ionicons name="star" size={puntosSize + 2} color={Colores.primario} />
              <Text style={[estilos.puntos, { fontSize: puntosSize }]}>
                {perfil?.puntos_acumulados || 0} Krusty Points
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => props.navigation.navigate('Carrito')}
            style={estilos.botonCarrito}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colores.primario, Colores.primarioOscuro]}
              style={[
                estilos.carritoGradient,
                {
                  width: carritoSize,
                  height: carritoSize,
                  padding: carritoPadding,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              ]}
            >
              <Ionicons name="cart" size={carritoIconSize} color={Colores.textoOscuro} />
              {cantidadTotal() > 0 && (
                <View style={[
                  estilos.contadorCarrito,
                  {
                    width: contadorSize,
                    height: contadorSize,
                    borderRadius: contadorSize / 2,
                    top: contadorTop,
                    right: contadorRight,
                    borderWidth: contadorBorderWidth,
                    borderColor: Colores.textoOscuro,
                    backgroundColor: Colores.secundario,
                    shadowColor: Colores.textoOscuro,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 5,
                    position: 'absolute',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                ]}>
                  <Text style={[
                    estilos.contadorTexto,
                    {
                      fontSize: contadorTextSize,
                      fontWeight: '900',
                      color: Colores.textoClaro,
                      textShadowColor: Colores.textoOscuro,
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                      textAlign: 'center',
                      includeFontPadding: false,
                    }
                  ]}>
                    {cantidadTotal() > 99 ? '99+' : cantidadTotal()}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ✅ OFERTAS */}
        <View style={[estilos.seccionWrapper, { marginBottom: isTablet ? 20 : isSmallPhone ? 12 : 16 }]}>
          <View style={estilos.seccionHeader}>
            <Text style={[estilos.seccionTitulo, {
              fontSize: seccionTituloSize,
              marginLeft: paddingHorizontal,
              fontWeight: 'bold',
              color: Colores.textoClaro,
              flex: 1,
            }]}>
              🔥 Ofertas del Día
            </Text>
            {ofertas.length > 0 && (
              <Animated.View style={[
                estilos.scrollIndicator,
                {
                  opacity: arrowOpacity,
                  transform: [{ translateX: arrowTranslate }],
                  marginRight: paddingHorizontal,
                }
              ]}>
                <View style={[
                  estilos.scrollIndicatorContent,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: Colores.primario + '15',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: Colores.primario + '30',
                  }
                ]}>
                  <Text style={[
                    estilos.scrollIndicatorTexto,
                    {
                      color: Colores.primario,
                      fontSize: 11,
                      fontWeight: '600',
                    }
                  ]}>Desliza</Text>
                  <Ionicons name="chevron-forward-circle" size={20} color={Colores.primario} />
                </View>
              </Animated.View>
            )}
          </View>

          {ofertas.length === 0 ? (
            <View style={[estilos.tarjetaOferta, {
              backgroundColor: Colores.textoGris + '15',
              width: cardWidth,
              padding: cardPadding,
              borderColor: Colores.textoGris + '20',
              minHeight: cardMinHeight,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: paddingHorizontal,
              borderRadius: 16,
              borderWidth: 2,
            }]}>
              <Text style={[estilos.ofertaTitulo, { fontSize: ofertaTituloSize, color: Colores.textoGris }]}>
                No hay ofertas
              </Text>
              <Text style={[estilos.ofertaDescuento, {
                fontSize: ofertaDescuentoSize - 10,
                color: Colores.textoGris
              }]}>
                Vuelve pronto 🚀
              </Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={ofertas}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOferta}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: paddingHorizontal,
                paddingVertical: 8,
              }}
              snapToInterval={cardWidth + (isTablet ? 16 : isSmallPhone ? 10 : 12)}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          )}
        </View>

        <View style={estilos.separador} />

        {/* ✅ CATEGORÍAS */}
        <View style={estilos.seccionWrapper}>
          <Text style={[estilos.seccionTitulo, {
            fontSize: seccionTituloSize,
            marginLeft: paddingHorizontal,
            marginTop: 0,
            marginBottom: 10,
            fontWeight: 'bold',
            color: Colores.textoClaro,
          }]}>
            🍔 Nuestro Menú
          </Text>
          <View style={[estilos.categorias, {
            paddingHorizontal: paddingHorizontal,
            gap: gapCategorias,
            flexDirection: 'row',
            flexWrap: 'wrap',
          }]}>
            {categorias.map((cat, index) => {
              const itemWidth = (width - (paddingHorizontal * 2) - gapCategorias) / 2;
              return (
                <TouchableOpacity
                  key={cat.nombre}
                  style={[
                    estilos.categoriaItem,
                    {
                      width: itemWidth,
                      backgroundColor: cat.color + '15',
                      padding: categoriaPadding,
                      borderRadius: categoriaBorderRadius,
                      borderColor: cat.color + '30',
                      alignItems: 'center',
                      marginBottom: 8,
                      borderWidth: 1,
                    }
                  ]}
                  onPress={() => props.navigation.navigate('Menu')}
                  activeOpacity={0.7}
                >
                  <Text style={[estilos.categoriaIcono, { fontSize: categoriaIconSize }]}>
                    {cat.icono}
                  </Text>
                  <Text style={[estilos.categoriaTexto, {
                    fontSize: categoriaTextSize,
                    color: cat.color,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={estilos.separador} />

        {/* ✅ FAVORITOS */}
        <View style={estilos.seccionWrapper}>
          <View style={estilos.seccionHeader}>
            <Text style={[estilos.seccionTitulo, {
              fontSize: seccionTituloSize,
              marginLeft: paddingHorizontal,
              fontWeight: 'bold',
              color: Colores.textoClaro,
              flex: 1,
            }]}>
              ⭐ Tus Favoritos
            </Text>
            {favoritos.length > 0 && (
              <Text style={[estilos.verTodos, {
                fontSize: isTablet ? 14 : isSmallPhone ? 10 : 12,
                marginRight: paddingHorizontal,
                color: Colores.primario,
                fontWeight: '600',
                opacity: 0.7,
              }]}>
                Ver todos →
              </Text>
            )}
          </View>

          {cargandoFavoritos ? (
            <View style={[estilos.favoritoLoading, {
              marginHorizontal: paddingHorizontal,
              padding: isTablet ? 24 : isSmallPhone ? 14 : 18,
              borderRadius: isTablet ? 18 : isSmallPhone ? 12 : 14,
              minHeight: isTablet ? 120 : isSmallPhone ? 80 : 100,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Colores.fondoOscuro + '40',
              borderWidth: 1,
              borderColor: Colores.textoClaro + '5',
            }]}>
              <ActivityIndicator size={isTablet ? 'large' : 'small'} color={Colores.primario} />
              <Text style={[estilos.favoritoLoadingTexto, {
                fontSize: isTablet ? 16 : isSmallPhone ? 12 : 14,
                marginTop: isTablet ? 12 : 8,
                color: Colores.textoGris,
                fontWeight: '400',
                opacity: 0.7,
              }]}>
                Cargando tus favoritos...
              </Text>
            </View>
          ) : favoritos.length > 0 ? (
            <FlatList
              horizontal
              data={favoritos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFavorito}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: paddingHorizontal,
                paddingVertical: isTablet ? 8 : isSmallPhone ? 4 : 6,
              }}
              snapToInterval={(isTablet ? width * 0.33 : isSmallPhone ? width * 0.75 : width * 0.6) + (isTablet ? 16 : isSmallPhone ? 8 : 12)}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          ) : (
            <View style={[estilos.favoritoVacio, {
              marginHorizontal: paddingHorizontal,
              padding: isTablet ? 32 : isSmallPhone ? 18 : 24,
              borderRadius: isTablet ? 20 : isSmallPhone ? 14 : 16,
              minHeight: isTablet ? 140 : isSmallPhone ? 90 : 110,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Colores.fondoOscuro + '40',
              borderWidth: 1,
              borderColor: Colores.textoClaro + '5',
            }]}>
              <Ionicons name="heart-outline" size={isTablet ? 56 : isSmallPhone ? 32 : 44} color={Colores.textoGris + '40'} />
              <Text style={[estilos.favoritoVacioTitulo, {
                fontSize: isTablet ? 20 : isSmallPhone ? 14 : 17,
                marginTop: isTablet ? 12 : 8,
                fontWeight: 'bold',
                color: Colores.textoGris,
                textAlign: 'center',
              }]}>
                No tienes favoritos aún
              </Text>
              <Text style={[estilos.favoritoVacioSubtexto, {
                fontSize: isTablet ? 15 : isSmallPhone ? 11 : 13,
                marginTop: isTablet ? 6 : 4,
                color: Colores.textoGris,
                textAlign: 'center',
                opacity: 0.6,
              }]}>
                Los productos que más pidas aparecerán aquí 🍔
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: paddingBottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondoOscuro,
  },
  fondoGradiente: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  botonAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  botonAdminTexto: {
    color: Colores.primario,
    fontWeight: '600',
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encabezadoIzquierdo: {
    flex: 1,
    marginRight: 12,
  },
  saludo: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
  },
  puntosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: Colores.fondoOscuro + '40',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  puntos: {
    color: Colores.primario,
    fontWeight: '600',
  },
  botonCarrito: {
    position: 'relative',
    flexShrink: 0,
  },
  carritoGradient: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorCarrito: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  seccionWrapper: {
    marginVertical: 4,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seccionTitulo: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
    flex: 1,
  },
  verTodos: {
    color: Colores.primario,
    fontWeight: '600',
    opacity: 0.7,
  },
  separador: {
    height: 8,
  },
  scrollIndicator: {
    marginTop: 8,
  },
  scrollIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colores.primario + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colores.primario + '30',
  },
  scrollIndicatorTexto: {
    color: Colores.primario,
    fontSize: 11,
    fontWeight: '600',
  },
  tarjetaOferta: {
    borderRadius: 16,
    justifyContent: 'center',
    borderWidth: 2,
  },
  ofertaDescuento: {
    fontWeight: 'bold',
  },
  ofertaTitulo: {
    color: Colores.textoClaro,
    marginTop: 6,
    fontWeight: '600',
  },
  ofertaPrecio: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
    marginTop: 4,
  },
  ofertaPrecioOriginal: {
    color: Colores.textoGris,
    textDecorationLine: 'line-through',
    marginTop: 2,
    opacity: 0.6,
  },
  botonVerOferta: {
    marginTop: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  botonVerOfertaTexto: {
    color: Colores.textoClaro,
    fontWeight: '600',
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoriaItem: {
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  categoriaIcono: {
    marginBottom: 2,
  },
  categoriaTexto: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  favoritoLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colores.fondoOscuro + '40',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '5',
  },
  favoritoLoadingTexto: {
    color: Colores.textoGris,
    fontWeight: '400',
    opacity: 0.7,
  },
  favoritoVacio: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colores.fondoOscuro + '40',
    borderWidth: 1,
    borderColor: Colores.textoClaro + '5',
  },
  favoritoVacioTitulo: {
    fontWeight: 'bold',
    color: Colores.textoGris,
    textAlign: 'center',
  },
  favoritoVacioSubtexto: {
    color: Colores.textoGris,
    textAlign: 'center',
    opacity: 0.6,
  },
  tarjetaFavorito: {
    backgroundColor: Colores.fondoOscuro + '60',
    borderWidth: 1,
    borderColor: Colores.primario + '15',
  },
  favoritoImagen: {
    borderWidth: 2,
    borderColor: Colores.primario + '30',
  },
  favoritoEmojiContainer: {
    backgroundColor: Colores.primario + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colores.primario + '30',
  },
  emojiGrande: {
    marginRight: 0,
  },
  favoritoInfo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favoritoContadorBadge: {
    backgroundColor: Colores.primario + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colores.primario + '30',
  },
  favoritoContadorTexto: {
    color: Colores.primario,
    fontSize: 9,
    fontWeight: 'bold',
  },
  favoritoTitulo: {
    fontWeight: 'bold',
    color: Colores.textoClaro,
  },
  favoritoPrecio: {
    fontWeight: 'bold',
    color: Colores.primario,
    marginTop: 2,
  },
  botonAgregar: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  botonAgregarGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  botonAgregarTexto: {
    color: Colores.textoOscuro,
    fontWeight: 'bold',
  },
  ofertaImagen: {
    width: '100%',
    backgroundColor: Colores.fondoOscuro + '20',
  },
  ofertaSinImagen: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colores.fondoOscuro + '30',
    borderWidth: 1,
    borderColor: Colores.textoGris + '20',
    borderStyle: 'dashed',
  },
  ofertaSinImagenTexto: {
    color: Colores.textoGris,
    opacity: 0.5,
    marginTop: 6,
  },
  badgeEnvioGratis: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeEnvioGratisTexto: {
    color: Colores.textoClaro,
    fontWeight: 'bold',
  },
});