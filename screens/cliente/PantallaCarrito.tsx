// screens/cliente/PantallaCarrito.tsx - V4 (Modo oscuro + Swipe-to-delete + expo-image)
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image as RNImage,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated2, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TouchableRipple } from 'react-native-paper';

import { tiendaCarrito } from '../../stores/tiendaCarrito';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { supabase } from '../../lib/supabase';
import { useColores, type PaletaTema } from '../../lib/theme';
import { FUENTES } from '../../lib/fuentes';
import { servicioEnvios } from '../../lib/servicioEnvios';
import { UbicacionGuardada } from '../../lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { cuponService } from '../../lib/cupones/cuponService';
import { useBeneficios } from '../../hooks/useBeneficios';
import { calcularResumenPedido } from '../../services/servicioPreciosPedido';

// ============================================================
// 📌 CONSTANTES
// ============================================================
const MAX_PORCENTAJE_PUNTOS = 0.25;
const MINIMO_PARA_PUNTOS = 15000;
const MINIMO_PUNTOS_CANJE = 100;
const VALOR_POR_PUNTO = 100;
const SWIPE_THRESHOLD = -90;

// ============================================================
// 🧮 SISTEMA DE TAMAÑOS RESPONSIVE
// ============================================================
interface TamanosCarrito {
  padding: number;
  headerPaddingTop: number;
  headerPaddingBottom: number;
  tituloSize: number;
  backIconSize: number;
  itemPadding: number;
  itemRadius: number;
  itemImageSize: number;
  itemImageRadius: number;
  itemEmojiSize: number;
  itemNameSize: number;
  itemPriceSize: number;
  controlButtonSize: number;
  controlIconSize: number;
  controlQuantitySize: number;
  deleteIconSize: number;
  footerMarginTop: number;
  footerPadding: number;
  footerRadius: number;
  puntosPaddingV: number;
  puntosPaddingH: number;
  puntosTextSize: number;
  puntosLabelSize: number;
  puntosChevronSize: number;
  avisoPaddingV: number;
  avisoPaddingH: number;
  avisoTextoSize: number;
  avisoSubSize: number;
  nivelPadding: number;
  nivelEmojiSize: number;
  nivelTituloSize: number;
  nivelDetalleSize: number;
  summaryPadding: number;
  summaryRadius: number;
  summaryLabelSize: number;
  summaryValueSize: number;
  totalLabelSize: number;
  totalPriceSize: number;
  cuponTextSize: number;
  cuponSubtextSize: number;
  cuponIconSize: number;
  cuponPaddingH: number;
  cuponPaddingV: number;
  cuponRadius: number;
  ahorroPaddingV: number;
  ahorroPaddingH: number;
  ahorroEmojiSize: number;
  ahorroTextoSize: number;
  ahorroRadius: number;
  checkoutPaddingV: number;
  checkoutRadius: number;
  checkoutTextSize: number;
  checkoutIconSize: number;
  checkoutPricePaddingH: number;
  checkoutPricePaddingV: number;
  checkoutPriceTextSize: number;
  checkoutPriceRadius: number;
  emptyButtonPaddingV: number;
  emptyButtonPaddingH: number;
  emptyButtonRadius: number;
  emptyIconSize: number;
  emptyButtonTextSize: number;
  emptyButtonIconSize: number;
  emptyCartIconSize: number;
  emptyTextSize: number;
  emptySubtextSize: number;
  cuponVacioPadding: number;
  cuponVacioRadius: number;
  cuponVacioIconSize: number;
  cuponVacioTituloSize: number;
  cuponVacioDetalleSize: number;
  vaciarPaddingV: number;
  vaciarTextSize: number;
  modalLoginPadding: number;
  modalLoginRadius: number;
  modalLoginIconSize: number;
  modalLoginTitleSize: number;
  modalLoginTextSize: number;
  modalLoginButtonPaddingV: number;
  modalLoginButtonRadius: number;
  modalLoginButtonTextSize: number;
  modalLoginButtonIconSize: number;
  modalLoginLinkSize: number;
  modalPuntosPadding: number;
  modalPuntosRadius: number;
  modalPuntosWidth: number;
  modalPuntosTitleSize: number;
  modalPuntosSubtitleSize: number;
  modalPuntosInfoPadding: number;
  modalPuntosInfoRadius: number;
  modalPuntosInfoLabelSize: number;
  modalPuntosInfoValueSize: number;
  modalPuntosInputLabelSize: number;
  modalPuntosInputRadius: number;
  modalPuntosInputBtnPaddingH: number;
  modalPuntosInputBtnPaddingV: number;
  modalPuntosInputBtnIconSize: number;
  modalPuntosInputFieldSize: number;
  modalPuntosInputFieldPaddingH: number;
  modalPuntosInputFieldPaddingV: number;
  modalPuntosHintSize: number;
  modalPuntosDescuentoPadding: number;
  modalPuntosDescuentoRadius: number;
  modalPuntosDescuentoLabelSize: number;
  modalPuntosDescuentoValueSize: number;
  modalPuntosBotonesPaddingV: number;
  modalPuntosBotonesRadius: number;
  modalPuntosBotonesTextSize: number;
  modalPuntosMinimoSize: number;
}

const calcularTamanosCarrito = (
  width: number,
  height: number,
  isTablet: boolean,
  isDesktop: boolean,
  isSmallPhone: boolean,
): TamanosCarrito => {
  const padding = isDesktop ? 40 : isTablet ? 32 : isSmallPhone ? 14 : 18;
  const headerPaddingTop = isDesktop ? 16 : isTablet ? 16 : isSmallPhone ? 8 : 12;
  const headerPaddingBottom = isDesktop ? 12 : isTablet ? 12 : isSmallPhone ? 8 : 10;
  const tituloSize = isDesktop ? 24 : isTablet ? 22 : isSmallPhone ? 17 : 20;
  const backIconSize = isDesktop ? 26 : isTablet ? 24 : isSmallPhone ? 20 : 22;
  const itemPadding = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const itemRadius = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 16;
  const itemImageSize = isDesktop ? 80 : isTablet ? 76 : isSmallPhone ? 58 : 68;
  const itemImageRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const itemEmojiSize = isDesktop ? 32 : isTablet ? 30 : isSmallPhone ? 24 : 28;
  const itemNameSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const itemPriceSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const controlButtonSize = isDesktop ? 32 : isTablet ? 30 : isSmallPhone ? 24 : 28;
  const controlIconSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const controlQuantitySize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const deleteIconSize = isDesktop ? 18 : isTablet ? 17 : isSmallPhone ? 14 : 16;
  const footerMarginTop = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 10 : 12;
  const footerPadding = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const footerRadius = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const puntosPaddingV = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 10;
  const puntosPaddingH = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 14 : 16;
  const puntosTextSize = isDesktop ? 15 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const puntosLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const puntosChevronSize = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 15;
  const avisoPaddingV = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 10;
  const avisoPaddingH = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 14;
  const avisoTextoSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const avisoSubSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;
  const nivelPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const nivelEmojiSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const nivelTituloSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const nivelDetalleSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;
  const summaryPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const summaryRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const summaryLabelSize = isDesktop ? 13 : isTablet ? 12.5 : isSmallPhone ? 11 : 12;
  const summaryValueSize = isDesktop ? 13 : isTablet ? 12.5 : isSmallPhone ? 11 : 12;
  const totalLabelSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 14 : 15;
  const totalPriceSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 16 : 18;
  const cuponTextSize = isDesktop ? 13 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const cuponSubtextSize = isDesktop ? 11 : isTablet ? 11 : isSmallPhone ? 10 : 10;
  const cuponIconSize = isDesktop ? 18 : isSmallPhone ? 16 : 17;
  const cuponPaddingH = isDesktop ? 10 : isSmallPhone ? 8 : 9;
  const cuponPaddingV = isDesktop ? 8 : isSmallPhone ? 6 : 7;
  const cuponRadius = isDesktop ? 10 : 8;
  const ahorroPaddingV = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 9 : 10;
  const ahorroPaddingH = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const ahorroEmojiSize = isDesktop ? 18 : isTablet ? 16 : isSmallPhone ? 14 : 15;
  const ahorroTextoSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const ahorroRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const checkoutPaddingV = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const checkoutRadius = isDesktop ? 16 : isSmallPhone ? 12 : 14;
  const checkoutTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const checkoutIconSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 17 : 18;
  const checkoutPricePaddingH = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const checkoutPricePaddingV = isDesktop ? 5 : isSmallPhone ? 3 : 4;
  const checkoutPriceTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const checkoutPriceRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const emptyButtonPaddingV = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const emptyButtonPaddingH = isDesktop ? 28 : isTablet ? 26 : isSmallPhone ? 20 : 24;
  const emptyButtonRadius = isDesktop ? 14 : isSmallPhone ? 10 : 12;
  const emptyIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const emptyButtonTextSize = isDesktop ? 16 : isTablet ? 15 : isSmallPhone ? 13 : 14;
  const emptyButtonIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const emptyCartIconSize = isDesktop ? 100 : isTablet ? 90 : isSmallPhone ? 60 : 78;
  const emptyTextSize = isDesktop ? 20 : isTablet ? 19 : isSmallPhone ? 15 : 17;
  const emptySubtextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const cuponVacioPadding = isSmallPhone ? 12 : 14;
  const cuponVacioRadius = isSmallPhone ? 10 : 12;
  const cuponVacioIconSize = isSmallPhone ? 20 : 22;
  const cuponVacioTituloSize = isSmallPhone ? 11 : 12;
  const cuponVacioDetalleSize = isSmallPhone ? 10 : 11;
  const vaciarPaddingV = isSmallPhone ? 4 : 6;
  const vaciarTextSize = isSmallPhone ? 10 : 11;
  const modalLoginPadding = isDesktop ? 30 : isTablet ? 28 : isSmallPhone ? 20 : 24;
  const modalLoginRadius = isDesktop ? 24 : isSmallPhone ? 18 : 20;
  const modalLoginIconSize = isDesktop ? 60 : isTablet ? 60 : isSmallPhone ? 44 : 52;
  const modalLoginTitleSize = isDesktop ? 18 : isTablet ? 18 : isSmallPhone ? 15 : 16;
  const modalLoginTextSize = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 12 : 13;
  const modalLoginButtonPaddingV = isDesktop ? 14 : isTablet ? 13 : isSmallPhone ? 11 : 12;
  const modalLoginButtonRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const modalLoginButtonTextSize = isDesktop ? 14 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const modalLoginButtonIconSize = isDesktop ? 18 : isSmallPhone ? 16 : 17;
  const modalLoginLinkSize = isDesktop ? 13 : isSmallPhone ? 11 : 12;
  const modalPuntosPadding = isDesktop ? 28 : isTablet ? 24 : isSmallPhone ? 16 : 20;
  const modalPuntosRadius = isDesktop ? 24 : isSmallPhone ? 18 : 22;
  const modalPuntosWidth = isDesktop ? width * 0.5 : isTablet ? width * 0.6 : width * 0.92;
  const modalPuntosTitleSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 15 : 17;
  const modalPuntosSubtitleSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosInfoPadding = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 12;
  const modalPuntosInfoRadius = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const modalPuntosInfoLabelSize = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 10 : 10.5;
  const modalPuntosInfoValueSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 16 : 18;
  const modalPuntosInputLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosInputRadius = isDesktop ? 12 : isSmallPhone ? 8 : 10;
  const modalPuntosInputBtnPaddingH = isDesktop ? 16 : isTablet ? 14 : isSmallPhone ? 12 : 13;
  const modalPuntosInputBtnPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosInputBtnIconSize = isDesktop ? 22 : isTablet ? 20 : isSmallPhone ? 18 : 19;
  const modalPuntosInputFieldSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 16 : 17;
  const modalPuntosInputFieldPaddingH = isDesktop ? 12 : isTablet ? 10 : isSmallPhone ? 8 : 9;
  const modalPuntosInputFieldPaddingV = isDesktop ? 10 : isTablet ? 8 : isSmallPhone ? 6 : 7;
  const modalPuntosHintSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;
  const modalPuntosDescuentoPadding = isDesktop ? 12 : isTablet ? 11 : isSmallPhone ? 8 : 10;
  const modalPuntosDescuentoRadius = isDesktop ? 12 : isSmallPhone ? 9 : 10;
  const modalPuntosDescuentoLabelSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosDescuentoValueSize = isDesktop ? 20 : isTablet ? 18 : isSmallPhone ? 15 : 17;
  const modalPuntosBotonesPaddingV = isDesktop ? 14 : isTablet ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosBotonesRadius = isDesktop ? 12 : isSmallPhone ? 10 : 11;
  const modalPuntosBotonesTextSize = isDesktop ? 13 : isTablet ? 12 : isSmallPhone ? 11 : 12;
  const modalPuntosMinimoSize = isDesktop ? 11 : isTablet ? 10 : isSmallPhone ? 9 : 10;

  return {
    padding,
    headerPaddingTop, headerPaddingBottom, tituloSize, backIconSize,
    itemPadding, itemRadius, itemImageSize, itemImageRadius, itemEmojiSize,
    itemNameSize, itemPriceSize, controlButtonSize, controlIconSize, controlQuantitySize, deleteIconSize,
    footerMarginTop, footerPadding, footerRadius,
    puntosPaddingV, puntosPaddingH, puntosTextSize, puntosLabelSize, puntosChevronSize,
    avisoPaddingV, avisoPaddingH, avisoTextoSize, avisoSubSize,
    nivelPadding, nivelEmojiSize, nivelTituloSize, nivelDetalleSize,
    summaryPadding, summaryRadius, summaryLabelSize, summaryValueSize, totalLabelSize, totalPriceSize,
    cuponTextSize, cuponSubtextSize, cuponIconSize, cuponPaddingH, cuponPaddingV, cuponRadius,
    ahorroPaddingV, ahorroPaddingH, ahorroEmojiSize, ahorroTextoSize, ahorroRadius,
    checkoutPaddingV, checkoutRadius, checkoutTextSize, checkoutIconSize,
    checkoutPricePaddingH, checkoutPricePaddingV, checkoutPriceTextSize, checkoutPriceRadius,
    emptyButtonPaddingV, emptyButtonPaddingH, emptyButtonRadius, emptyIconSize, emptyButtonTextSize, emptyButtonIconSize,
    emptyCartIconSize, emptyTextSize, emptySubtextSize,
    cuponVacioPadding, cuponVacioRadius, cuponVacioIconSize, cuponVacioTituloSize, cuponVacioDetalleSize,
    vaciarPaddingV, vaciarTextSize,
    modalLoginPadding, modalLoginRadius, modalLoginIconSize, modalLoginTitleSize, modalLoginTextSize,
    modalLoginButtonPaddingV, modalLoginButtonRadius, modalLoginButtonTextSize, modalLoginButtonIconSize, modalLoginLinkSize,
    modalPuntosPadding, modalPuntosRadius, modalPuntosWidth, modalPuntosTitleSize, modalPuntosSubtitleSize,
    modalPuntosInfoPadding, modalPuntosInfoRadius, modalPuntosInfoLabelSize, modalPuntosInfoValueSize,
    modalPuntosInputLabelSize, modalPuntosInputRadius, modalPuntosInputBtnPaddingH, modalPuntosInputBtnPaddingV,
    modalPuntosInputBtnIconSize, modalPuntosInputFieldSize, modalPuntosInputFieldPaddingH, modalPuntosInputFieldPaddingV,
    modalPuntosHintSize, modalPuntosDescuentoPadding, modalPuntosDescuentoRadius, modalPuntosDescuentoLabelSize,
    modalPuntosDescuentoValueSize, modalPuntosBotonesPaddingV, modalPuntosBotonesRadius, modalPuntosBotonesTextSize,
    modalPuntosMinimoSize,
  };
};

// ============================================================
// 🎴 ITEM CON SWIPE-TO-DELETE
// ============================================================
interface ItemCarritoProps {
  item: any;
  tamanos: TamanosCarrito;
  onAumentar: (id: number) => void;
  onDisminuir: (id: number) => void;
  onEliminar: (id: number) => void;
  onPressItem: (item: any) => void;
  colores: PaletaTema;
  estilos: any;
}

const ItemCarrito: React.FC<ItemCarritoProps> = ({
  item, tamanos, onAumentar, onDisminuir, onEliminar, onPressItem, colores, estilos,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const itemScale = useSharedValue(1);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = next < 0 ? next : next * 0.15;
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD || e.velocityX < -700) {
        translateX.value = withTiming(-500, { duration: 220 });
        runOnJS(triggerHaptic)();
        runOnJS(onEliminar)(item.producto.id);
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const itemStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: itemScale.value },
    ],
  }));

  const trashStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [SWIPE_THRESHOLD, -20],
      [1, 0],
      Extrapolate.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  return (
    <View style={estilos.swipeContainer}>
      <Animated2.View style={[estilos.trashBackground, trashStyle]}>
        <LinearGradient
          colors={['#E53935', '#B71C1C']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Ionicons name="trash" size={26} color="#FFF" />
        <Text style={estilos.trashText} allowFontScaling={false}>
          Eliminar
        </Text>
      </Animated2.View>

      <GestureDetector gesture={pan}>
        <Animated2.View style={[itemStyle]}>
          <TouchableRipple
            onPress={() => onPressItem(item)}
            borderless
            rippleColor={colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            style={[
              estilos.item,
              {
                padding: tamanos.itemPadding,
                borderRadius: tamanos.itemRadius,
                backgroundColor: colores.surface,
                borderColor: colores.border,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {item.producto.imagen ? (
                <View
                  style={[
                    estilos.imagenWrap,
                    {
                      width: tamanos.itemImageSize,
                      height: tamanos.itemImageSize,
                      borderRadius: tamanos.itemImageRadius,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.producto.imagen }}
                    style={estilos.imagen}
                    contentFit="cover"
                    transition={200}
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    cachePolicy="memory-disk"
                  />
                </View>
              ) : (
                <View
                  style={[
                    estilos.imagenPlaceholder,
                    {
                      width: tamanos.itemImageSize,
                      height: tamanos.itemImageSize,
                      borderRadius: tamanos.itemImageRadius,
                      backgroundColor: colores.surfaceHover,
                    },
                  ]}
                >
                  <Text style={{ fontSize: tamanos.itemEmojiSize }} allowFontScaling={false}>
                    🍔
                  </Text>
                </View>
              )}

              <View style={estilos.itemInfo}>
                <Text
                  style={[
                    estilos.itemNombre,
                    { fontSize: tamanos.itemNameSize, color: colores.text },
                  ]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {item.producto.nombre}
                </Text>
                <Text
                  style={[
                    estilos.itemPrecioUnitario,
                    { fontSize: tamanos.itemPriceSize - 3, color: colores.textSecondary },
                  ]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(
                    typeof item.producto.precio === 'number'
                      ? item.producto.precio
                      : Number(item.producto.precio)
                  )}{' '}
                  c/u
                </Text>
                <Text
                  style={[
                    estilos.itemPrecioTotal,
                    { fontSize: tamanos.itemPriceSize, color: colores.accent },
                  ]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(
                    (typeof item.producto.precio === 'number'
                      ? item.producto.precio
                      : Number(item.producto.precio)) * item.cantidad
                  )}
                </Text>
              </View>

              <View style={estilos.controles}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => { });
                    onDisminuir(item.producto.id);
                  }}
                  style={[
                    estilos.botonControl,
                    {
                      width: tamanos.controlButtonSize,
                      height: tamanos.controlButtonSize,
                      borderRadius: tamanos.controlButtonSize / 2,
                      backgroundColor: colores.accentSecondary,
                    },
                  ]}
                  activeOpacity={0.7}
                  hitSlop={4}
                >
                  <Ionicons name="remove" size={tamanos.controlIconSize} color={colores.text} />
                </TouchableOpacity>

                <Text
                  style={[
                    estilos.cantidad,
                    { fontSize: tamanos.controlQuantitySize, color: colores.text },
                  ]}
                  allowFontScaling={false}
                >
                  {item.cantidad}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => { });
                    onAumentar(item.producto.id);
                  }}
                  style={[
                    estilos.botonControl,
                    {
                      width: tamanos.controlButtonSize,
                      height: tamanos.controlButtonSize,
                      borderRadius: tamanos.controlButtonSize / 2,
                      backgroundColor: colores.accentSecondary,
                    },
                  ]}
                  activeOpacity={0.7}
                  hitSlop={4}
                >
                  <Ionicons name="add" size={tamanos.controlIconSize} color={colores.text} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableRipple>
        </Animated2.View>
      </GestureDetector>
    </View>
  );
};

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaCarrito(props: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ✅ TEMA
  const colores = useColores();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const isSmallPhone = screenWidth < 375;

  const tamanos = useMemo(
    () => calcularTamanosCarrito(screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone),
    [screenWidth, screenHeight, isTablet, isDesktop, isSmallPhone],
  );

  const { elementos, aumentarCantidad, disminuirCantidad, quitarProducto, vaciarCarrito, calcularTotal } = tiendaCarrito();
  const {
    perfil,
    sesion,
    ubicacionSeleccionada: ubicacionStore,
    cargarUbicacionTemporal,
    guardarUbicacionTemporal,
    limpiarUbicacionTemporal,
  } = tiendaAutenticacion();

  const { nivel, beneficios, calcularDescuento, tieneEnvioGratis } = useBeneficios(
    perfil?.puntos_acumulados || 0,
    perfil?.id,
  );

  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState(0);
  const [puntosMaximos, setPuntosMaximos] = useState(0);
  const [puntosOriginales, setPuntosOriginales] = useState(0);
  const [puntosOriginalesAntesCanje, setPuntosOriginalesAntesCanje] = useState(0);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);
  const [cuponPuntosAplicado, setCuponPuntosAplicado] = useState<any>(null);
  const [cuponAplicado, setCuponAplicado] = useState<any>(
    () => props.route?.params?.cuponAplicado || null,
  );
  const intentoRecuperarCupon = useRef(false);
  const [inputPuntos, setInputPuntos] = useState('');

  const [costoEnvioEstimado, setCostoEnvioEstimado] = useState(0);
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [distanciaFormateada, setDistanciaFormateada] = useState('');
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [envioDisponible, setEnvioDisponible] = useState(true);
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [ubicacionGuardada, setUbicacionGuardada] = useState<UbicacionGuardada | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  const shineX = useSharedValue(-1);
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value * 300 }],
  }));

  useEffect(() => {
    shineX.value = withRepeat(
      withTiming(1, { duration: 2200 }),
      -1,
      false,
    );
  }, []);

  const total = calcularTotal();
  const totalProductos = elementos.reduce((sum, item) => sum + item.cantidad, 0);

  // ============================================================
  // REGLAS DE PUNTOS
  // ============================================================
  const puedeUsarPuntos = useMemo(() => {
    if (!perfil?.id) return false;
    return total >= MINIMO_PARA_PUNTOS;
  }, [total, perfil?.id]);

  const faltaParaUsarPuntos = useMemo(() => {
    if (total >= MINIMO_PARA_PUNTOS) return 0;
    return MINIMO_PARA_PUNTOS - total;
  }, [total]);

  const puntosMaximosPermitidos = useMemo(() => {
    if (!puedeUsarPuntos) return 0;
    const maxEnPesos = total * MAX_PORCENTAJE_PUNTOS;
    const maxEnPuntos = Math.floor(maxEnPesos / VALOR_POR_PUNTO) * VALOR_POR_PUNTO;
    return maxEnPuntos;
  }, [total, puedeUsarPuntos]);

  const porcentajeDescuentoNivel = useMemo(() => {
    if (!beneficios) return 0;
    return beneficios.descuento || 0;
  }, [beneficios]);

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (perfil) {
      cargarPuntosUsuario();
    } else {
      setPuntosMaximos(0);
      setPuntosOriginales(0);
      setPuntosOriginalesAntesCanje(0);
      setInputPuntos('');
      setPuntosSeleccionados(0);
      setCuponPuntosAplicado(null);
    }
  }, [perfil]);

  useEffect(() => {
    const cuponRecibido = props.route?.params?.cuponAplicado;
    if (cuponRecibido) setCuponAplicado(cuponRecibido);
  }, [props.route?.params?.cuponAplicado]);

  useEffect(() => {
    if (!perfil?.id || cuponAplicado || intentoRecuperarCupon.current) return;
    intentoRecuperarCupon.current = true;

    const recuperarCuponDisponible = async () => {
      const cuponesDisponibles = await cuponService.obtenerCuponesDisponibles(perfil.id);
      const cuponReservado = cuponesDisponibles[0]?.cupon;
      if (cuponReservado) setCuponAplicado(cuponReservado);
    };

    recuperarCuponDisponible();
  }, [perfil?.id, cuponAplicado]);

  useEffect(() => {
    cargarUbicacionDesdeStore();
  }, []);

  useEffect(() => {
    if (ubicacionGuardada && elementos.length > 0) {
      calcularEnvioEstimado();
    } else {
      setCostoEnvioEstimado(0);
      setDistanciaEstimada(null);
      setDistanciaFormateada('');
      setEnvioDisponible(true);
      setMensajeEnvio('');
    }
  }, [ubicacionGuardada, elementos.length]);

  useFocusEffect(
    useCallback(() => {
      const recargarUbicacion = async () => {
        if (perfil) {
          const partesDireccion: string[] = [];
          if (perfil.direccion_calle) partesDireccion.push(perfil.direccion_calle);
          if (perfil.direccion_numero) partesDireccion.push(perfil.direccion_numero);
          if (perfil.direccion_piso) partesDireccion.push(`Piso ${perfil.direccion_piso}`);
          if (perfil.direccion_departamento) partesDireccion.push(`Depto ${perfil.direccion_departamento}`);
          if (perfil.direccion_barrio) partesDireccion.push(perfil.direccion_barrio);
          if (perfil.direccion_ciudad) partesDireccion.push(perfil.direccion_ciudad);
          if (perfil.direccion_codigo_postal) partesDireccion.push(`CP ${perfil.direccion_codigo_postal}`);

          const direccionCompleta = partesDireccion.length > 0 ? partesDireccion.join(', ') : '';

          if (direccionCompleta) {
            const ubicacionPerfil: UbicacionGuardada = {
              latitude: perfil.lat_cliente || -34.776484410467525,
              longitude: perfil.lng_cliente || -58.29220250409459,
              direccion: direccionCompleta,
              seleccionadaPorUsuario: false,
            };
            setUbicacionGuardada(ubicacionPerfil);
            await guardarUbicacionTemporal(ubicacionPerfil);
            setCargandoUbicacion(false);
            return;
          }
        }

        const ubicacionCargada = await cargarUbicacionTemporal();
        if (ubicacionCargada) {
          setUbicacionGuardada(ubicacionCargada);
          setCargandoUbicacion(false);
          return;
        }

        const ubicacionDefault: UbicacionGuardada = {
          latitude: -34.776484410467525,
          longitude: -58.29220250409459,
          direccion: 'Local Krusty Burger',
          seleccionadaPorUsuario: false,
        };
        setUbicacionGuardada(ubicacionDefault);
        await guardarUbicacionTemporal(ubicacionDefault);
        setCargandoUbicacion(false);
      };

      recargarUbicacion();
    }, [perfil]),
  );

  // ============================================================
  // FUNCIONES DE CARGA
  // ============================================================
  const cargarUbicacionDesdeStore = async () => {
    setCargandoUbicacion(true);
    try {
      const ubicacionCargada = await cargarUbicacionTemporal();
      if (ubicacionCargada) {
        setUbicacionGuardada(ubicacionCargada);
        setCargandoUbicacion(false);
        return;
      }
      if (ubicacionStore) {
        setUbicacionGuardada(ubicacionStore);
        setCargandoUbicacion(false);
        return;
      }
      const ubicacionDefault: UbicacionGuardada = {
        latitude: -34.776484410467525,
        longitude: -58.29220250409459,
        direccion: 'Local Krusty Burger',
        seleccionadaPorUsuario: false,
      };
      setUbicacionGuardada(ubicacionDefault);
      await guardarUbicacionTemporal(ubicacionDefault);
    } catch (error) {
      console.error('❌ [Carrito] Error cargando ubicación:', error);
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const calcularEnvioEstimado = async () => {
    if (!ubicacionGuardada) return;
    setCalculandoEnvio(true);
    try {
      const resultado = await servicioEnvios.calcularCostoEnvio(
        ubicacionGuardada.latitude,
        ubicacionGuardada.longitude,
      );
      if (resultado.esValido && resultado.dentroCobertura) {
        setCostoEnvioEstimado(resultado.costo);
        setDistanciaEstimada(resultado.distancia);
        setDistanciaFormateada(resultado.distanciaFormateada);
        setEnvioDisponible(true);
        setMensajeEnvio('');
      } else {
        setEnvioDisponible(false);
        setMensajeEnvio(resultado.mensaje || 'No disponible');
        setCostoEnvioEstimado(0);
        setDistanciaEstimada(null);
      }
    } catch (error) {
      console.error('Error calculando envío:', error);
      setEnvioDisponible(false);
      setMensajeEnvio('Error al calcular envío');
      setCostoEnvioEstimado(0);
    } finally {
      setCalculandoEnvio(false);
    }
  };

  const cargarPuntosUsuario = async () => {
    if (!perfil?.id) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('puntos_acumulados')
        .eq('id', perfil.id)
        .single();
      if (error) throw error;
      const puntos = data?.puntos_acumulados || 0;
      setPuntosMaximos(puntos);
      setPuntosOriginales(puntos);
      setPuntosOriginalesAntesCanje(0);
      setInputPuntos('');
    } catch (error) {
      console.error('Error cargando puntos:', error);
      setPuntosMaximos(0);
      setPuntosOriginales(0);
    }
  };

  // ============================================================
  // MANEJADORES DE PUNTOS
  // ============================================================
  const restaurarPuntos = async () => {
    if (!perfil?.id) return;
    const puntosARestaurar =
      cuponPuntosAplicado?.puntos_antes_canje || puntosOriginalesAntesCanje || puntosOriginales;
    if (puntosARestaurar === 0) return;

    try {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ puntos_acumulados: puntosARestaurar })
        .eq('id', perfil.id);

      if (updateError) {
        console.error('❌ Error restaurando puntos:', updateError);
        return;
      }

      setPuntosMaximos(puntosARestaurar);
      setPuntosOriginales(puntosARestaurar);
      setPuntosOriginalesAntesCanje(0);
      setCuponPuntosAplicado(null);
      setPuntosSeleccionados(0);
      setInputPuntos('');
      await cargarPuntosUsuario();
    } catch (error) {
      console.error('❌ Error restaurando puntos:', error);
    }
  };

  const quitarDescuento = () => {
    Haptics.selectionAsync().catch(() => { });
    restaurarPuntos();
  };

  const handleInputPuntos = (text: string) => {
    const num = parseInt(text) || 0;
    if (num < 0) return;
    const limitado = Math.min(num, puntosMaximosPermitidos, puntosMaximos);
    setInputPuntos(limitado.toString());
    setPuntosSeleccionados(limitado);
  };

  const canjearPuntos = async () => {
    if (!puedeUsarPuntos) {
      Alert.alert(
        'Mínimo de compra',
        `Necesitás un mínimo de ${formatearPrecio(MINIMO_PARA_PUNTOS)} para usar tus puntos. Agregá ${formatearPrecio(faltaParaUsarPuntos)} más.`,
      );
      return;
    }
    if (puntosSeleccionados < MINIMO_PUNTOS_CANJE) {
      Alert.alert(
        `Mínimo ${MINIMO_PUNTOS_CANJE} puntos`,
        `Necesitás al menos ${MINIMO_PUNTOS_CANJE} puntos para canjear (${formatearPrecio(MINIMO_PUNTOS_CANJE)} de descuento)`,
      );
      return;
    }
    if (puntosSeleccionados > puntosMaximos) {
      Alert.alert('Puntos insuficientes', `Tenés ${puntosMaximos} puntos disponibles`);
      return;
    }
    if (puntosSeleccionados > puntosMaximosPermitidos) {
      Alert.alert(
        'Tope máximo alcanzado',
        `El máximo que podés canjear es ${puntosMaximosPermitidos} pts (25% del total)`,
      );
      return;
    }

    const descuentoEnPesos = Math.floor(puntosSeleccionados / VALOR_POR_PUNTO) * VALOR_POR_PUNTO;
    const puntosAntesCanje = puntosMaximos;

    setCanjeandoPuntos(true);
    try {
      const { data: recompensa, error: recompensaError } = await supabase
        .from('recompensas')
        .select('id')
        .eq('nombre', 'Descuento por puntos')
        .single();
      if (recompensaError) throw recompensaError;

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ puntos_acumulados: puntosMaximos - puntosSeleccionados })
        .eq('id', perfil!.id);
      if (updateError) throw updateError;

      const { error: canjeError } = await supabase
        .from('canjes')
        .insert({
          usuario_id: perfil!.id,
          recompensa_id: recompensa.id,
          puntos_usados: puntosSeleccionados,
          usado_en_pedido: false,
          created_at: new Date().toISOString(),
        });
      if (canjeError) throw canjeError;

      setPuntosOriginalesAntesCanje(puntosAntesCanje);
      setPuntosMaximos(puntosMaximos - puntosSeleccionados);
      setPuntosOriginales(puntosOriginales - puntosSeleccionados);

      const cuponVirtual = {
        id: Date.now(),
        recompensas: {
          nombre: `${formatearPrecio(descuentoEnPesos)} de descuento`,
          descripcion: `Canjeado por ${puntosSeleccionados} puntos`,
          tipo: 'DESCUENTO_FIJO',
          valor_descuento: descuentoEnPesos,
        },
        puntos_usados: puntosSeleccionados,
        puntos_antes_canje: puntosAntesCanje,
      };

      setCuponPuntosAplicado(cuponVirtual);
      setMostrarModalPuntos(false);
      setPuntosSeleccionados(0);
      setInputPuntos('');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });

      Alert.alert(
        '🎉 ¡Éxito!',
        `Canjeaste ${puntosSeleccionados} puntos por ${formatearPrecio(descuentoEnPesos)} de descuento`,
        [{ text: '¡Genial!' }],
      );

      await cargarPuntosUsuario();
    } catch (error) {
      console.error('Error canjeando puntos:', error);
      Alert.alert('❌ Error', 'No se pudo canjear los puntos. Intentá de nuevo.');
    } finally {
      setCanjeandoPuntos(false);
    }
  };

  const cancelarCanje = () => {
    setPuntosSeleccionados(0);
    setInputPuntos('');
    setMostrarModalPuntos(false);
  };

  // ============================================================
  // CÁLCULOS
  // ============================================================
  const descuentoNivel = beneficios ? calcularDescuento(total) : 0;
  const envioGratisNivel = beneficios ? tieneEnvioGratis(total) : false;

  const resumenPedido = calcularResumenPedido({
    subtotal: total,
    cuponAplicado,
    cuponPuntosAplicado,
    descuentoNivel,
    costoEnvio: envioDisponible ? costoEnvioEstimado : 0,
    tipoEntrega: 'domicilio',
    envioGratisNivel,
  });

  const descuentoPuntos = resumenPedido.descuentoPuntos;
  const descuentoCupon = resumenPedido.descuentoCupon;
  const descuento = resumenPedido.descuentoTotal;
  const cuponEsEnvioGratis = resumenPedido.envioGratisPorCupon;
  const cuponEsDescuento = String(cuponAplicado?.tipo || '').toLowerCase() === 'descuento';
  const envioGratisPorPuntos = resumenPedido.envioGratisPorPuntos;
  const envioGratisPorCupon = resumenPedido.envioGratisPorCupon;
  const totalFinal = resumenPedido.totalFinal;

  const ahorroPorEnvio =
    envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel ? costoEnvioEstimado : 0;
  const ahorroTotal = descuento + ahorroPorEnvio;
  const mostrarAhorro = ahorroTotal > 0;

  const padding = tamanos.padding;

  // ============================================================
  // MANEJADORES DE ITEM
  // ============================================================
  const handleEliminarItem = useCallback((id: number) => {
    quitarProducto(id);
  }, [quitarProducto]);

  const handlePressItem = useCallback((item: any) => {
    if (item?.producto) {
      props.navigation.navigate('DetalleProducto', { producto: item.producto });
    }
  }, [props.navigation]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ItemCarrito
        item={item}
        tamanos={tamanos}
        onAumentar={aumentarCantidad}
        onDisminuir={disminuirCantidad}
        onEliminar={handleEliminarItem}
        onPressItem={handlePressItem}
        colores={colores}
        estilos={estilos}
      />
    ),
    [tamanos, aumentarCantidad, disminuirCantidad, handleEliminarItem, handlePressItem, colores, estilos],
  );

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (elementos.length === 0) {
    return (
      <View style={estilos.container}>
        <LinearGradient
          colors={[colores.fondo, colores.surface, colores.fondo]}
          style={estilos.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View
          style={[
            estilos.headerMini,
            {
              paddingTop: insets.top + tamanos.headerPaddingTop,
              paddingHorizontal: padding,
              paddingBottom: tamanos.headerPaddingBottom,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={[
              estilos.backButtonGlass,
              {
                backgroundColor: colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
                borderColor: colores.border,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={tamanos.backIconSize} color={colores.text} />
          </TouchableOpacity>
          <Text
            style={[estilos.headerTitleMini, { fontSize: tamanos.tituloSize, color: colores.text }]}
            allowFontScaling={false}
          >
            Carrito
          </Text>
          <View style={{ width: tamanos.backIconSize + 20 }} />
        </View>

        <View style={estilos.emptyContainer}>
          <View
            style={[
              estilos.emptyIconCircle,
              {
                backgroundColor: colores.accent + '10',
                borderColor: colores.accent + '18',
              },
            ]}
          >
            <Ionicons
              name="cart-outline"
              size={tamanos.emptyCartIconSize * 0.6}
              color={colores.accent}
            />
          </View>
          <Text
            style={[estilos.emptyText, { fontSize: tamanos.emptyTextSize, color: colores.text }]}
            allowFontScaling={false}
          >
            Tu carrito está vacío
          </Text>
          <Text
            style={[
              estilos.emptySubtext,
              { fontSize: tamanos.emptySubtextSize, color: colores.textSecondary },
            ]}
            allowFontScaling={false}
          >
            Agregá productos del menú para empezar 🍔
          </Text>

          {cuponAplicado && (
            <View
              style={[
                estilos.cuponVacioCard,
                {
                  padding: tamanos.cuponVacioPadding,
                  borderRadius: tamanos.cuponVacioRadius,
                  backgroundColor: colores.surface,
                  borderColor: colores.accent + '30',
                },
              ]}
            >
              <View
                style={[
                  estilos.cuponVacioIconWrap,
                  { backgroundColor: colores.accent + '12' },
                ]}
              >
                <Ionicons
                  name="ticket-outline"
                  size={tamanos.cuponVacioIconSize}
                  color={colores.accent}
                />
              </View>
              <View style={estilos.cuponVacioContenido}>
                <Text
                  style={[
                    estilos.cuponVacioTitulo,
                    { fontSize: tamanos.cuponVacioTituloSize, color: colores.text },
                  ]}
                  allowFontScaling={false}
                >
                  Cupón listo: {cuponAplicado.codigo || 'Aplicado'}
                </Text>
                <Text
                  style={[
                    estilos.cuponVacioDetalle,
                    { fontSize: tamanos.cuponVacioDetalleSize, color: colores.textSecondary },
                  ]}
                  allowFontScaling={false}
                >
                  {cuponAplicado.titulo || 'Se aplicará al confirmar tu pedido.'}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[estilos.emptyButton, { borderRadius: tamanos.emptyButtonRadius }]}
            onPress={() => props.navigation.navigate('Principal', { screen: 'Menu' })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colores.accent, colores.accentSecondary]}
              style={[
                estilos.emptyButtonGradient,
                {
                  paddingHorizontal: tamanos.emptyButtonPaddingH,
                  paddingVertical: tamanos.emptyButtonPaddingV,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="restaurant"
                size={tamanos.emptyButtonIconSize}
                color="#FFF"
              />
              <Text
                style={[
                  estilos.emptyButtonText,
                  { fontSize: tamanos.emptyButtonTextSize, color: '#FFF' },
                ]}
                allowFontScaling={false}
              >
                Ir al Menú
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <View style={estilos.container}>
      <LinearGradient
        colors={[colores.fondo, colores.surface, colores.fondo]}
        style={estilos.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View
        style={[
          estilos.header,
          {
            paddingTop: insets.top + tamanos.headerPaddingTop,
            paddingHorizontal: padding,
            paddingBottom: tamanos.headerPaddingBottom,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={[
            estilos.backButtonGlass,
            {
              backgroundColor: colores.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
              borderColor: colores.border,
            },
          ]}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={tamanos.backIconSize} color={colores.text} />
        </TouchableOpacity>

        <View style={estilos.headerTitleBlock}>
          <Text
            style={[estilos.headerTitle, { fontSize: tamanos.tituloSize, color: colores.text }]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            Carrito
          </Text>
          <Text style={[estilos.headerSubtitle, { color: colores.textSecondary }]} allowFontScaling={false}>
            {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
            vaciarCarrito();
          }}
          style={[
            estilos.trashAllButton,
            {
              backgroundColor: colores.accent + '10',
              borderColor: colores.accent + '25',
            },
          ]}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={tamanos.backIconSize} color={colores.accent} />
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={elementos}
        keyExtractor={(item) => item.producto.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          estilos.list,
          {
            paddingHorizontal: padding,
            paddingTop: 6,
            paddingBottom: 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListFooterComponent={
          <View
            style={[
              estilos.footerContainer,
              {
                marginTop: tamanos.footerMarginTop,
                padding: tamanos.footerPadding,
                borderRadius: tamanos.footerRadius,
                backgroundColor: colores.surface,
                borderColor: colores.border,
              },
            ]}
          >
            {/* BOTÓN DE PUNTOS */}
            {puedeUsarPuntos ? (
              <TouchableOpacity
                style={[
                  estilos.puntosButton,
                  {
                    borderRadius: tamanos.footerRadius - 4,
                    marginBottom: 12,
                    overflow: 'hidden',
                    borderColor: colores.accentSecondary + '40',
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => { });
                  if (cuponPuntosAplicado) {
                    setPuntosMaximos(puntosOriginalesAntesCanje || puntosOriginales);
                  }
                  setPuntosSeleccionados(0);
                  setInputPuntos('');
                  setMostrarModalPuntos(true);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colores.accentSecondary + '28', colores.accentSecondary + '10']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: tamanos.puntosPaddingV,
                    paddingHorizontal: tamanos.puntosPaddingH,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[
                        estilos.puntosStarWrap,
                        { backgroundColor: colores.accentSecondary },
                      ]}
                    >
                      <Ionicons name="star" size={16} color="#FFF" />
                    </View>
                    <Text
                      style={[
                        estilos.puntosButtonText,
                        { color: colores.text, fontSize: tamanos.puntosTextSize },
                      ]}
                      allowFontScaling={false}
                    >
                      {puntosMaximos} pts disponibles
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      style={[
                        estilos.puntosButtonLabel,
                        {
                          color: colores.accent,
                          fontSize: tamanos.puntosLabelSize,
                          backgroundColor: colores.accent + '15',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 999,
                        },
                      ]}
                      allowFontScaling={false}
                    >
                      Canjear
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={tamanos.puntosChevronSize}
                      color={colores.accent}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ) : sesion && !puedeUsarPuntos ? (
              <View
                style={[
                  estilos.avisoMinimo,
                  {
                    paddingVertical: tamanos.avisoPaddingV,
                    paddingHorizontal: tamanos.avisoPaddingH,
                    borderRadius: tamanos.footerRadius - 4,
                    marginBottom: 12,
                    backgroundColor: colores.isDark ? 'rgba(255,167,38,0.15)' : '#FFF3E0',
                    borderColor: colores.isDark ? 'rgba(255,167,38,0.4)' : '#FFB74D',
                  },
                ]}
              >
                <Ionicons name="information-circle" size={18} color={colores.warning} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      estilos.avisoMinimoTexto,
                      { color: colores.warning, fontSize: tamanos.avisoTextoSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Agregá {formatearPrecio(faltaParaUsarPuntos)} más para usar tus {puntosMaximos} pts
                  </Text>
                  <Text
                    style={[
                      estilos.avisoMinimoSub,
                      { color: colores.warning, fontSize: tamanos.avisoSubSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Mínimo de compra: {formatearPrecio(MINIMO_PARA_PUNTOS)}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* BADGE NIVEL */}
            {sesion && nivel && (
              <View
                style={[
                  estilos.nivelBadge,
                  {
                    backgroundColor: (nivel.color || colores.accentSecondary) + '15',
                    borderColor: (nivel.color || colores.accentSecondary) + '40',
                    padding: tamanos.nivelPadding,
                    borderRadius: tamanos.footerRadius - 4,
                  },
                ]}
              >
                <Text style={{ fontSize: tamanos.nivelEmojiSize }} allowFontScaling={false}>
                  {nivel.icono || '🏆'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      estilos.nivelBadgeTitulo,
                      {
                        color: nivel.color || colores.accentSecondary,
                        fontSize: tamanos.nivelTituloSize,
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    Nivel {nivel.nombre || 'Sin nivel'}
                  </Text>
                  <Text
                    style={[
                      estilos.nivelBadgeDetalle,
                      { color: colores.textSecondary, fontSize: tamanos.nivelDetalleSize },
                    ]}
                    allowFontScaling={false}
                  >
                    {porcentajeDescuentoNivel > 0
                      ? `Tenés ${porcentajeDescuentoNivel}% de descuento en todos tus pedidos`
                      : 'Sumá puntos para desbloquear descuentos 🎯'}
                  </Text>
                </View>
              </View>
            )}

            {/* RESUMEN */}
            <View
              style={[
                estilos.summary,
                {
                  backgroundColor: colores.surfaceHover,
                  borderColor: colores.border,
                  borderRadius: tamanos.summaryRadius,
                  padding: tamanos.summaryPadding,
                },
              ]}
            >
              <View style={estilos.summaryRow}>
                <Text
                  style={[
                    estilos.summaryLabel,
                    { color: colores.textSecondary, fontSize: tamanos.summaryLabelSize },
                  ]}
                  allowFontScaling={false}
                >
                  Productos ({totalProductos})
                </Text>
                <Text
                  style={[
                    estilos.summaryValue,
                    { color: colores.text, fontSize: tamanos.summaryValueSize },
                  ]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(total)}
                </Text>
              </View>

              {!calculandoEnvio && (
                <View style={estilos.summaryRow}>
                  <Text
                    style={[
                      estilos.summaryLabel,
                      { color: colores.textSecondary, fontSize: tamanos.summaryLabelSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Envío
                  </Text>
                  <Text
                    style={[
                      estilos.summaryValue,
                      { color: colores.text, fontSize: tamanos.summaryValueSize },
                      (envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel) && {
                        color: colores.success,
                      },
                    ]}
                    allowFontScaling={false}
                  >
                    {envioGratisPorPuntos || envioGratisPorCupon || envioGratisNivel
                      ? 'GRATIS'
                      : envioDisponible
                        ? formatearPrecio(costoEnvioEstimado)
                        : mensajeEnvio || '$0'}
                  </Text>
                </View>
              )}

              {descuentoNivel > 0 && (
                <View style={estilos.summaryRow}>
                  <Text
                    style={[
                      estilos.summaryLabel,
                      { color: colores.success, fontSize: tamanos.summaryLabelSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Descuento {nivel?.nombre || ''}
                  </Text>
                  <Text
                    style={[
                      estilos.summaryValue,
                      { color: colores.success, fontSize: tamanos.summaryValueSize },
                    ]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoNivel)}
                  </Text>
                </View>
              )}

              {descuentoPuntos > 0 && (
                <View style={estilos.summaryRow}>
                  <Text
                    style={[
                      estilos.summaryLabel,
                      { color: colores.success, fontSize: tamanos.summaryLabelSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Descuento por puntos
                  </Text>
                  <Text
                    style={[
                      estilos.summaryValue,
                      { color: colores.success, fontSize: tamanos.summaryValueSize },
                    ]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoPuntos)}
                  </Text>
                </View>
              )}

              {descuentoCupon > 0 && (
                <View style={estilos.summaryRow}>
                  <Text
                    style={[
                      estilos.summaryLabel,
                      { color: colores.success, fontSize: tamanos.summaryLabelSize },
                    ]}
                    allowFontScaling={false}
                  >
                    Descuento cupón
                  </Text>
                  <Text
                    style={[
                      estilos.summaryValue,
                      { color: colores.success, fontSize: tamanos.summaryValueSize },
                    ]}
                    allowFontScaling={false}
                  >
                    -{formatearPrecio(descuentoCupon)}
                  </Text>
                </View>
              )}

              {/* Cupón puntos aplicado */}
              {cuponPuntosAplicado && (
                <View
                  style={[
                    estilos.cuponAplicado,
                    {
                      backgroundColor: colores.success + '15',
                      borderColor: colores.success + '30',
                      borderRadius: tamanos.cuponRadius,
                      paddingHorizontal: tamanos.cuponPaddingH,
                      paddingVertical: tamanos.cuponPaddingV,
                    },
                  ]}
                >
                  <Ionicons name="star" size={tamanos.cuponIconSize - 3} color={colores.success} />
                  <Text
                    style={[
                      estilos.cuponAplicadoText,
                      { color: colores.success, fontSize: tamanos.cuponTextSize },
                    ]}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {cuponPuntosAplicado.recompensas?.nombre}
                  </Text>
                  <TouchableOpacity onPress={quitarDescuento} activeOpacity={0.7} hitSlop={6}>
                    <Ionicons name="close-circle" size={tamanos.cuponIconSize} color={colores.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Cupón aplicado */}
              {cuponAplicado && (
                <View
                  style={[
                    estilos.cuponAplicado,
                    {
                      backgroundColor: colores.success + '15',
                      borderColor: colores.success + '30',
                      borderRadius: tamanos.cuponRadius,
                      paddingHorizontal: tamanos.cuponPaddingH,
                      paddingVertical: tamanos.cuponPaddingV,
                    },
                  ]}
                >
                  <Ionicons name="ticket" size={tamanos.cuponIconSize - 3} color={colores.success} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        estilos.cuponAplicadoText,
                        { color: colores.success, fontSize: tamanos.cuponTextSize },
                      ]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {cuponAplicado.codigo || 'Cupón aplicado'}
                    </Text>
                    <Text
                      style={[
                        estilos.cuponAplicadoSubtext,
                        { color: colores.textSecondary, fontSize: tamanos.cuponSubtextSize },
                      ]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {cuponAplicado.titulo || 'Cupón disponible'}
                      {cuponEsEnvioGratis ? ' · Envío gratis' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setCuponAplicado(null)} activeOpacity={0.7} hitSlop={6}>
                    <Ionicons name="close-circle" size={tamanos.cuponIconSize} color={colores.accent} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Ahorro */}
              {mostrarAhorro && (
                <View
                  style={[
                    estilos.ahorroContainer,
                    {
                      paddingVertical: tamanos.ahorroPaddingV,
                      paddingHorizontal: tamanos.ahorroPaddingH,
                      borderRadius: tamanos.ahorroRadius,
                      marginTop: 8,
                      borderColor: colores.success + '30',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[colores.success + '20', colores.success + '08']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={{ fontSize: tamanos.ahorroEmojiSize }} allowFontScaling={false}>
                    🎉
                  </Text>
                  <Text
                    style={[
                      estilos.ahorroTexto,
                      { fontSize: tamanos.ahorroTextoSize, color: colores.success },
                    ]}
                    allowFontScaling={false}
                  >
                    ¡Ahorrás {formatearPrecio(ahorroTotal)}!
                  </Text>
                </View>
              )}

              {/* Total */}
              <View style={[estilos.summaryRow, estilos.summaryTotal, { borderTopColor: colores.border }]}>
                <Text
                  style={[
                    estilos.totalLabel,
                    { color: colores.text, fontSize: tamanos.totalLabelSize },
                  ]}
                  allowFontScaling={false}
                >
                  Total
                </Text>
                <Text
                  style={[
                    estilos.totalPrice,
                    { color: colores.accent, fontSize: tamanos.totalPriceSize },
                  ]}
                  allowFontScaling={false}
                >
                  {formatearPrecio(totalFinal)}
                </Text>
              </View>
            </View>

            {/* BOTÓN CHECKOUT con shine */}
            <TouchableOpacity
              style={[
                estilos.checkoutButton,
                {
                  borderRadius: tamanos.checkoutRadius,
                  shadowColor: colores.accent,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                if (!perfil || !perfil.id) {
                  setMostrarModalLogin(true);
                  return;
                }
                props.navigation.navigate('Checkout', {
                  cuponPuntosAplicado,
                  cuponAplicado,
                  ubicacionGuardada,
                });
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colores.accent, colores.accentSecondary]}
                style={[
                  estilos.checkoutButtonGradient,
                  { paddingVertical: tamanos.checkoutPaddingV },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Animated2.View
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: 80,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      transform: [{ skewX: '-20deg' }],
                    },
                    shineStyle,
                  ]}
                  pointerEvents="none"
                />

                <Ionicons name="cart" size={tamanos.checkoutIconSize} color={colores.text} />
                <Text
                  style={[
                    estilos.checkoutButtonText,
                    { fontSize: tamanos.checkoutTextSize, color: colores.text },
                  ]}
                  allowFontScaling={false}
                >
                  Finalizar compra
                </Text>
                <View
                  style={[
                    estilos.checkoutPrice,
                    {
                      backgroundColor: colores.text + '18',
                      paddingHorizontal: tamanos.checkoutPricePaddingH,
                      paddingVertical: tamanos.checkoutPricePaddingV,
                      borderRadius: tamanos.checkoutPriceRadius,
                      borderColor: colores.text + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilos.checkoutPriceText,
                      { fontSize: tamanos.checkoutPriceTextSize, color: colores.text },
                    ]}
                    allowFontScaling={false}
                  >
                    {formatearPrecio(totalFinal)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* VACIAR CARRITO */}
            <TouchableOpacity
              style={[estilos.emptyCartButton, { paddingVertical: tamanos.vaciarPaddingV }]}
              onPress={vaciarCarrito}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  estilos.emptyCartText,
                  { fontSize: tamanos.vaciarTextSize, color: colores.textTertiary },
                ]}
                allowFontScaling={false}
              >
                Vaciar carrito
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL LOGIN */}
      <Modal visible={mostrarModalLogin} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View
            style={[
              estilos.modal,
              {
                backgroundColor: colores.surface,
                borderRadius: tamanos.modalLoginRadius,
                padding: tamanos.modalLoginPadding,
              },
            ]}
          >
            <View
              style={[
                estilos.modalIconCircle,
                { backgroundColor: colores.accent + '12' },
              ]}
            >
              <Ionicons name="lock-closed" size={32} color={colores.accent} />
            </View>
            <Text
              style={[estilos.modalTitle, { fontSize: tamanos.modalLoginTitleSize, color: colores.text }]}
              allowFontScaling={false}
            >
              Necesitás una cuenta
            </Text>
            <Text
              style={[
                estilos.modalText,
                { color: colores.textSecondary, fontSize: tamanos.modalLoginTextSize },
              ]}
              allowFontScaling={false}
            >
              Para hacer tu pedido tenés que iniciar sesión o registrarte.
            </Text>

            <View style={estilos.modalButtons}>
              <TouchableOpacity
                style={[
                  estilos.modalButton,
                  estilos.modalCancel,
                  {
                    paddingVertical: tamanos.modalLoginButtonPaddingV,
                    borderRadius: tamanos.modalLoginButtonRadius,
                    backgroundColor: colores.surfaceHover,
                    borderColor: colores.border,
                  },
                ]}
                onPress={() => setMostrarModalLogin(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    estilos.modalCancelText,
                    { color: colores.textSecondary, fontSize: tamanos.modalLoginButtonTextSize },
                  ]}
                  allowFontScaling={false}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  estilos.modalButton,
                  estilos.modalConfirm,
                  {
                    paddingVertical: tamanos.modalLoginButtonPaddingV,
                    borderRadius: tamanos.modalLoginButtonRadius,
                  },
                ]}
                onPress={() => {
                  setMostrarModalLogin(false);
                  props.navigation.navigate('Login');
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colores.accent, colores.accentSecondary]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Ionicons
                  name="log-in"
                  size={tamanos.modalLoginButtonIconSize}
                  color="#FFF"
                />
                <Text
                  style={[
                    estilos.modalConfirmText,
                    { color: '#FFF', fontSize: tamanos.modalLoginButtonTextSize },
                  ]}
                  allowFontScaling={false}
                >
                  Ingresar
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ marginTop: 14, paddingVertical: 8 }}
              onPress={() => {
                setMostrarModalLogin(false);
                props.navigation.navigate('Registro');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: FUENTES.regular,
                  fontSize: tamanos.modalLoginLinkSize,
                  color: colores.accent,
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                ¿No tenés cuenta? Registrate gratis
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PUNTOS */}
      <Modal visible={mostrarModalPuntos} transparent animationType="slide">
        <View style={estilos.modalOverlay}>
          <View
            style={[
              estilos.modalPuntos,
              {
                backgroundColor: colores.surface,
                borderColor: colores.border,
                borderRadius: tamanos.modalPuntosRadius,
                width: tamanos.modalPuntosWidth,
                maxWidth: 450,
                padding: tamanos.modalPuntosPadding,
                borderWidth: 1,
                alignSelf: 'center',
              },
            ]}
          >
            <View style={estilos.modalPuntosHandle}>
              <View style={[estilos.modalPuntosHandleBar, { backgroundColor: colores.textTertiary }]} />
            </View>

            <View style={{ marginBottom: 4 }}>
              <Text
                style={[
                  estilos.modalPuntosTitle,
                  {
                    fontSize: tamanos.modalPuntosTitleSize,
                    color: colores.text,
                    textAlign: 'center',
                  },
                ]}
                allowFontScaling={false}
              >
                Canjear Puntos
              </Text>
              <Text
                style={[
                  estilos.modalPuntosSubtitle,
                  {
                    fontSize: tamanos.modalPuntosSubtitleSize,
                    color: colores.textSecondary,
                    textAlign: 'center',
                    marginBottom: 12,
                  },
                ]}
                allowFontScaling={false}
              >
                Ingresá cuántos puntos querés canjear
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colores.accentSecondary + '08',
                borderRadius: tamanos.modalPuntosInfoRadius,
                padding: tamanos.modalPuntosInfoPadding,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colores.accentSecondary + '20',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoLabelSize,
                    color: colores.textSecondary,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Disponibles
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoValueSize,
                    color: colores.accentSecondary,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {puntosMaximos} pts
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoLabelSize,
                    color: colores.textSecondary,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Máximo canje
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosInfoValueSize,
                    color: colores.accent,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {Math.min(puntosMaximos, puntosMaximosPermitidos)} pts
                </Text>
              </View>
            </View>

            <View style={{ width: '100%', marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: tamanos.modalPuntosInputLabelSize,
                  color: colores.textSecondary,
                  marginBottom: 6,
                  fontWeight: '500',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Cantidad de puntos
              </Text>
              <View
                style={{
                  borderColor: colores.border,
                  backgroundColor: colores.surfaceHover,
                  borderRadius: tamanos.modalPuntosInputRadius,
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: tamanos.modalPuntosInputBtnPaddingH,
                    paddingVertical: tamanos.modalPuntosInputBtnPaddingV,
                    backgroundColor: colores.surface,
                    borderRightWidth: 1,
                    borderRightColor: colores.border,
                    borderTopLeftRadius: tamanos.modalPuntosInputRadius,
                    borderBottomLeftRadius: tamanos.modalPuntosInputRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const nuevo = Math.max(0, puntosSeleccionados - 100);
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={tamanos.modalPuntosInputBtnIconSize} color={colores.text} />
                </TouchableOpacity>

                <TextInput
                  style={{
                    fontSize: tamanos.modalPuntosInputFieldSize,
                    color: colores.text,
                    paddingHorizontal: tamanos.modalPuntosInputFieldPaddingH,
                    paddingVertical: tamanos.modalPuntosInputFieldPaddingV,
                    flex: 1,
                    textAlign: 'center',
                    minWidth: 60,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  value={inputPuntos}
                  onChangeText={handleInputPuntos}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colores.textTertiary}
                  selectionColor={colores.accent}
                  allowFontScaling={false}
                />

                <TouchableOpacity
                  style={{
                    paddingHorizontal: tamanos.modalPuntosInputBtnPaddingH,
                    paddingVertical: tamanos.modalPuntosInputBtnPaddingV,
                    backgroundColor: colores.surface,
                    borderLeftWidth: 1,
                    borderLeftColor: colores.border,
                    borderTopRightRadius: tamanos.modalPuntosInputRadius,
                    borderBottomRightRadius: tamanos.modalPuntosInputRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const nuevo = Math.min(
                      Math.min(puntosMaximos, puntosMaximosPermitidos),
                      puntosSeleccionados + 100,
                    );
                    setPuntosSeleccionados(nuevo);
                    setInputPuntos(nuevo.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={tamanos.modalPuntosInputBtnIconSize} color={colores.text} />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: tamanos.modalPuntosHintSize,
                  color: colores.textSecondary,
                  textAlign: 'center',
                  marginTop: 6,
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Máximo 25% del total ({puntosMaximosPermitidos} pts ={' '}
                {formatearPrecio(Math.floor(puntosMaximosPermitidos / 100) * 100)})
              </Text>
            </View>

            {puntosSeleccionados > 0 && (
              <View
                style={{
                  backgroundColor: colores.accentSecondary + '12',
                  borderRadius: tamanos.modalPuntosDescuentoRadius,
                  padding: tamanos.modalPuntosDescuentoPadding,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colores.accentSecondary + '30',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosDescuentoLabelSize,
                    color: colores.text,
                    fontWeight: '500',
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Descuento:
                </Text>
                <Text
                  style={{
                    fontSize: tamanos.modalPuntosDescuentoValueSize,
                    color: colores.accent,
                    fontFamily: FUENTES.display,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  {formatearPrecio(Math.floor(puntosSeleccionados / 100) * 100)}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: tamanos.modalPuntosBotonesPaddingV,
                  borderRadius: tamanos.modalPuntosBotonesRadius,
                  alignItems: 'center',
                  backgroundColor: colores.surfaceHover,
                  borderWidth: 1,
                  borderColor: colores.border,
                }}
                onPress={cancelarCanje}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: colores.textSecondary,
                    fontWeight: '600',
                    fontSize: tamanos.modalPuntosBotonesTextSize,
                    includeFontPadding: false,
                  }}
                  allowFontScaling={false}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: tamanos.modalPuntosBotonesPaddingV,
                  borderRadius: tamanos.modalPuntosBotonesRadius,
                  alignItems: 'center',
                  backgroundColor:
                    puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                      ? colores.accentSecondary
                      : colores.surfaceHover,
                  borderWidth: 1,
                  borderColor:
                    puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                      ? colores.accentSecondary
                      : colores.border,
                }}
                onPress={canjearPuntos}
                disabled={canjeandoPuntos || puntosSeleccionados < MINIMO_PUNTOS_CANJE}
                activeOpacity={0.85}
              >
                {canjeandoPuntos ? (
                  <ActivityIndicator size="small" color={colores.text} />
                ) : (
                  <Text
                    style={{
                      color:
                        puntosSeleccionados >= MINIMO_PUNTOS_CANJE
                          ? colores.text
                          : colores.textTertiary,
                      fontWeight: 'bold',
                      fontSize: tamanos.modalPuntosBotonesTextSize,
                      fontFamily: FUENTES.display,
                      includeFontPadding: false,
                    }}
                    allowFontScaling={false}
                  >
                    {puntosSeleccionados < MINIMO_PUNTOS_CANJE
                      ? `Mínimo ${MINIMO_PUNTOS_CANJE} pts`
                      : 'Canjear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {puntosSeleccionados < MINIMO_PUNTOS_CANJE && puntosSeleccionados > 0 && (
              <Text
                style={{
                  fontSize: tamanos.modalPuntosMinimoSize,
                  color: colores.accent,
                  textAlign: 'center',
                  marginTop: 8,
                  fontWeight: '500',
                  includeFontPadding: false,
                }}
                allowFontScaling={false}
              >
                Mínimo {MINIMO_PUNTOS_CANJE} puntos ({formatearPrecio(MINIMO_PUNTOS_CANJE)} de descuento)
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// 🎨 ESTILOS DINÁMICOS
// ============================================================
const crearEstilos = (colores: PaletaTema) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },
    backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerMini: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButtonGlass: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    trashAllButton: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
    },
    headerTitleBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    headerTitleMini: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      letterSpacing: 0.5,
      includeFontPadding: false,
    },
    headerSubtitle: {
      fontFamily: FUENTES.regular,
      fontSize: 11,
      marginTop: 2,
      includeFontPadding: false,
    },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconCircle: {
      width: 130, height: 130, borderRadius: 65,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 2,
    },
    emptyText: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      textAlign: 'center',
      includeFontPadding: false,
      lineHeight: 26,
    },
    emptySubtext: {
      fontFamily: FUENTES.regular,
      marginTop: 8,
      textAlign: 'center',
      includeFontPadding: false,
      lineHeight: 20,
    },
    emptyButton: { marginTop: 24, overflow: 'hidden' },
    emptyButtonGradient: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      shadowColor: colores.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    emptyButtonText: { fontFamily: FUENTES.display, fontWeight: '600', includeFontPadding: false },

    cuponVacioCard: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      maxWidth: 380,
      marginTop: 20,
      marginBottom: 4,
      gap: 10,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    cuponVacioIconWrap: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center',
    },
    cuponVacioContenido: { flex: 1 },
    cuponVacioTitulo: {
      fontFamily: FUENTES.display,
      fontWeight: '600',
      includeFontPadding: false,
      lineHeight: 16,
    },
    cuponVacioDetalle: {
      fontFamily: FUENTES.regular,
      marginTop: 3,
      lineHeight: 16,
      includeFontPadding: false,
    },

    list: { flexGrow: 1 },

    swipeContainer: {
      position: 'relative',
      marginBottom: 10,
      borderRadius: 16,
      overflow: 'hidden',
    },
    trashBackground: {
      position: 'absolute',
      top: 0, bottom: 0, right: 0, left: 0,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: 28,
      flexDirection: 'row',
      gap: 8,
      borderRadius: 16,
    },
    trashText: {
      color: '#FFF',
      fontFamily: FUENTES.display,
      fontSize: 14,
      fontWeight: '600',
      includeFontPadding: false,
      alignSelf: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    imagenWrap: {
      marginRight: 12,
      overflow: 'hidden',
      backgroundColor: colores.surfaceHover,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    imagen: { width: '100%', height: '100%' },
    imagenPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colores.border,
    },
    itemInfo: { flex: 1 },
    itemNombre: {
      fontFamily: FUENTES.display,
      fontWeight: '400',
      letterSpacing: 0.3,
      includeFontPadding: false,
      lineHeight: 20,
    },
    itemPrecioUnitario: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      includeFontPadding: false,
    },
    itemPrecioTotal: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      marginTop: 3,
      includeFontPadding: false,
      lineHeight: 22,
    },
    controles: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6 },
    botonControl: {
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colores.accentSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
    },
    cantidad: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      minWidth: 26,
      textAlign: 'center',
      includeFontPadding: false,
    },

    footerContainer: {
      borderWidth: 1,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    },

    puntosButton: { overflow: 'hidden', borderWidth: 1 },
    puntosStarWrap: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: colores.accentSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
    },
    puntosButtonText: {
      fontFamily: FUENTES.display,
      fontWeight: '600',
      includeFontPadding: false,
    },
    puntosButtonLabel: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      includeFontPadding: false,
    },

    avisoMinimo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1.5,
    },
    avisoMinimoTexto: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 18, fontWeight: '700' },
    avisoMinimoSub: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 16, marginTop: 3 },

    nivelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      marginBottom: 10,
    },
    nivelBadgeTitulo: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.3,
      includeFontPadding: false,
      lineHeight: 18,
    },
    nivelBadgeDetalle: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      includeFontPadding: false,
      lineHeight: 14,
    },

    summary: { marginBottom: 10, borderWidth: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    summaryLabel: { fontFamily: FUENTES.regular, includeFontPadding: false, lineHeight: 18 },
    summaryValue: { fontFamily: FUENTES.regular, fontWeight: '500', includeFontPadding: false, lineHeight: 18 },
    summaryTotal: {
      borderTopWidth: 1,
      paddingTop: 8,
      marginTop: 6,
    },
    totalLabel: { fontFamily: FUENTES.display, fontWeight: '700', includeFontPadding: false, lineHeight: 22 },
    totalPrice: { fontFamily: FUENTES.display, fontWeight: '700', includeFontPadding: false, lineHeight: 24 },

    cuponAplicado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginVertical: 5,
      borderWidth: 1,
    },
    cuponAplicadoText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      flex: 1,
      includeFontPadding: false,
      lineHeight: 16,
    },
    cuponAplicadoSubtext: {
      fontFamily: FUENTES.regular,
      marginTop: 2,
      includeFontPadding: false,
      lineHeight: 14,
    },

    ahorroContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      overflow: 'hidden',
    },
    ahorroTexto: { fontFamily: FUENTES.display, fontWeight: '700', includeFontPadding: false },

    checkoutButton: {
      overflow: 'hidden',
      marginBottom: 6,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
    },
    checkoutButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      overflow: 'hidden',
    },
    checkoutButtonText: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      letterSpacing: 0.3,
      includeFontPadding: false,
    },
    checkoutPrice: {
      borderWidth: 1,
    },
    checkoutPriceText: { fontFamily: FUENTES.display, fontWeight: '700', includeFontPadding: false },
    emptyCartButton: { alignItems: 'center' },
    emptyCartText: { fontFamily: FUENTES.regular, fontWeight: '500', opacity: 0.6, includeFontPadding: false },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25, shadowRadius: 40, elevation: 20,
    },
    modalIconCircle: {
      width: 70, height: 70, borderRadius: 35,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
      includeFontPadding: false,
    },
    modalText: {
      fontFamily: FUENTES.regular,
      textAlign: 'center',
      marginBottom: 24,
      opacity: 0.85,
      includeFontPadding: false,
      lineHeight: 19,
    },
    modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    modalButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      overflow: 'hidden',
    },
    modalCancel: { borderWidth: 1 },
    modalCancelText: { fontFamily: FUENTES.display, fontWeight: '600', includeFontPadding: false },
    modalConfirm: { overflow: 'hidden' },
    modalConfirmText: { fontFamily: FUENTES.display, fontWeight: '700', includeFontPadding: false },

    modalPuntos: { alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 20 },
    modalPuntosHandle: { alignItems: 'center', paddingBottom: 12 },
    modalPuntosHandleBar: {
      width: 40, height: 4, borderRadius: 2,
    },
    modalPuntosTitle: {
      fontFamily: FUENTES.display,
      fontWeight: '700',
      includeFontPadding: false,
      lineHeight: 24,
    },
    modalPuntosSubtitle: {
      fontFamily: FUENTES.regular,
      fontWeight: '400',
      includeFontPadding: false,
      lineHeight: 18,
    },
  });