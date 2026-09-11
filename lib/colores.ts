// lib/colores.ts
import { Dimensions, useWindowDimensions } from 'react-native';
import { useCallback } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================
// 📐 TAMAÑOS Y ESPACIADOS
// ============================================================
export const Sizes = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 28,
    full: 999,
  },
  icon: {
    xs: 12, sm: 16, md: 20, lg: 24, xl: 28, '2xl': 32, '3xl': 40,
  },
  avatar: {
    sm: 32, md: 44, lg: 56, xl: 72, '2xl': 96,
  },
  height: {
    input: 48, button: 50, buttonLarge: 56, header: 64, tabBar: 72,
  },
  maxWidth: {
    container: 480, card: 360, modal: 400,
  },
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isTablet: SCREEN_WIDTH >= 768,
    isSmallPhone: SCREEN_WIDTH < 375,
  },
};

// ============================================================
// 📝 TIPOGRAFÍA
// ============================================================
export const Typography = {
  fontFamily: {
    regular: 'System', medium: 'System', bold: 'System',
  },
  fontSize: {
    xs: 10, sm: 12, md: 14, lg: 16, xl: 18,
    '2xl': 22, '3xl': 26, '4xl': 32, '5xl': 40,
  },
  lineHeight: {
    xs: 14, sm: 16, md: 20, lg: 22, xl: 26,
    '2xl': 30, '3xl': 34, '4xl': 42, '5xl': 50,
  },
  fontWeight: {
    thin: '100' as const, light: '300' as const, regular: '400' as const,
    medium: '500' as const, semibold: '600' as const, bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    tight: -0.5, normal: 0, wide: 0.5, wider: 1,
  },
};

// ============================================================
// 🌓 SOMBRAS
// ============================================================
export const Shadows = {
  light: {
    xs: { shadowColor: 'rgba(0,0,0,0.04)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1 },
    sm: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: 'rgba(0,0,0,0.10)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 },
    xl: { shadowColor: 'rgba(0,0,0,0.12)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 24, elevation: 12 },
  },
  dark: {
    xs: { shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1 },
    sm: { shadowColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: 'rgba(0,0,0,0.4)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: 'rgba(0,0,0,0.5)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 },
    xl: { shadowColor: 'rgba(0,0,0,0.6)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 24, elevation: 12 },
  },
};

// ============================================================
// 🎨 COLORES COMPLETOS
// ============================================================
export const Colores = {
  primario: '#F5C518',
  primarioOscuro: '#D4A800',
  primarioClaro: '#FFE135',
  primarioTransparente: '#F5C51820',

  secundario: '#E53935',
  secundarioOscuro: '#C62828',
  secundarioClaro: '#FF6B6B',
  secundarioTransparente: '#E5393520',

  acento: '#FF6F00',
  acentoClaro: '#FFA726',
  acentoOscuro: '#E65100',

  verdeKrusty: '#43A047',
  verdeClaro: '#66BB6A',
  verdeOscuro: '#2E7D32',

  azulHomero: '#1A237E',
  azulClaro: '#3949AB',
  rosaMaggie: '#F48FB1',
  moradoLisa: '#7B1FA2',
  naranjaBart: '#FF6F00',
  verdeMarge: '#43A047',

  gorgoryAzul: '#1A237E',
  gorgoryAzulClaro: '#283593',
  gorgoryRojo: '#D32F2F',
  gorgoryGris: '#78909C',
  gorgoryBlanco: '#ECEFF1',
  gorgoryOscuro: '#0D1445',

  krustyRojo: '#E53935',
  krustyAmarillo: '#F5C518',
  krustyNaranja: '#FF6F00',
  krustyBlanco: '#FFFFFF',
  krustyNegro: '#0A0A0A',

  homeroAzul: '#1A237E',
  homeroBlanco: '#FFFFFF',
  homeroPiel: '#F5C518',
  homeroCafe: '#4E342E',
  homeroGris: '#9E9E9E',

  margeVerde: '#43A047',
  margeAzul: '#1A237E',
  margeRosa: '#F48FB1',
  margePiel: '#F5C518',
  margeBlanco: '#FFFFFF',

  bartNaranja: '#FF6F00',
  bartAzul: '#1A237E',
  bartRojo: '#E53935',
  bartPiel: '#F5C518',
  bartBlanco: '#FFFFFF',

  lisaMorado: '#7B1FA2',
  lisaRosa: '#F48FB1',
  lisaBlanco: '#FFFFFF',
  lisaPiel: '#F5C518',
  lisaAmarillo: '#FFD700',

  burnsVerde: '#43A047',
  burnsNegro: '#0A0A0A',
  burnsRojo: '#D32F2F',
  burnsDorado: '#FFD700',
  burnsBlanco: '#F5F5F5',

  frinkBlanco: '#F5F5F5',
  frinkGris: '#9E9E9E',
  frinkAmarillo: '#FDD835',
  frinkAzul: '#42A5F5',
  frinkVerde: '#66BB6A',
  frinkNaranja: '#FF7043',

  repartidorVerde: '#43A047',
  repartidorAmarillo: '#F5C518',
  repartidorNegro: '#0A0A0A',
  repartidorBlanco: '#FFFFFF',
  repartidorNaranja: '#FF6F00',

  casaPared: '#FFE0B2',
  casaTecho: '#8D6E63',
  casaPuerta: '#4E342E',
  casaVentana: '#64B5F6',

  fondoOscuro: '#1A1A1A',
  fondoOscuroClaro: '#2A2A2A',
  fondoTarjeta: '#2A2A2A',
  fondoClaro: '#F5F2ED',
  fondoBlanco: '#FFFFFF',

  textoOscuro: '#1A1A1A',
  textoClaro: '#FFFFFF',
  textoGris: '#B0B0B0',
  textoGrisOscuro: '#6B6B6B',
  textoAmarillo: '#F5C518',
  textoRojo: '#E53935',

  estado: {
    pendiente: '#F5C518',
    confirmado: '#3949AB',
    preparando: '#FF6F00',
    listo: '#43A047',
    enCamino: '#7B1FA2',
    entregado: '#43A047',
    cancelado: '#E53935',
  },

  bronce: '#CD7F32',
  plata: '#C0C0C0',
  oro: '#FFD700',
  platino: '#E5E4E2',

  gradientKrusty: ['#E53935', '#D4A800'] as const,
  gradientCirco: ['#FF6F00', '#F5C518'] as const,
  gradientSimpsons: ['#F5C518', '#FFE135'] as const,
  gradientHamburguesa: ['#43A047', '#D4A800'] as const,
  gradientNoche: ['#1A1A1A', '#0A0A0A'] as const,
  gradientFuego: ['#E53935', '#FF6F00'] as const,

  gradientGorgory: ['#1A237E', '#78909C'] as const,
  gradientFrink: ['#F5F5F5', '#9E9E9E'] as const,
  gradientHomero: ['#1A237E', '#F5C518'] as const,
  gradientMarge: ['#43A047', '#F48FB1'] as const,
  gradientBart: ['#FF6F00', '#E53935'] as const,
  gradientLisa: ['#7B1FA2', '#F48FB1'] as const,
  gradientBurns: ['#43A047', '#FFD700'] as const,
  gradientKrustyCompleto: ['#E53935', '#F5C518', '#FF6F00'] as const,

  tematicas: {
    bart: { primario: '#FF6F00', secundario: '#E53935', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#FF6F00', '#E53935'] as const },
    lisa: { primario: '#7B1FA2', secundario: '#F48FB1', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#7B1FA2', '#F48FB1'] as const },
    burns: { primario: '#43A047', secundario: '#FFD700', fondo: '#0A0A0A', texto: '#F5F5F5', gradiente: ['#43A047', '#FFD700'] as const },
    homero: { primario: '#F5C518', secundario: '#1A237E', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#1A237E', '#F5C518'] as const },
    marge: { primario: '#43A047', secundario: '#F48FB1', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#43A047', '#F48FB1'] as const },
    krusty: { primario: '#E53935', secundario: '#F5C518', verde: '#43A047', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#E53935', '#43A047'] as const },
    frink: { primario: '#42A5F5', secundario: '#FDD835', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#42A5F5', '#FDD835'] as const },
    springfield: { primario: '#43A047', secundario: '#42A5F5', fondo: '#1A1A1A', texto: '#FFFFFF', gradiente: ['#43A047', '#42A5F5'] as const },
    claro: {
      primario: '#E53935', secundario: '#F5C518', fondo: '#F5F2ED', fondoCard: '#FFFFFF',
      texto: '#1A1A1A', textoSecundario: 'rgba(0,0,0,0.55)', textoTerciario: 'rgba(0,0,0,0.30)',
      borde: 'rgba(0,0,0,0.06)', sombra: 'rgba(0,0,0,0.06)', gradiente: ['#E53935', '#F5C518'] as const,
    },
    oscuro: {
      primario: '#E53935', secundario: '#F5C518', fondo: '#0D0D0D', fondoCard: 'rgba(255,255,255,0.04)',
      texto: '#FFFFFF', textoSecundario: 'rgba(255,255,255,0.6)', textoTerciario: 'rgba(255,255,255,0.3)',
      borde: 'rgba(255,255,255,0.06)', sombra: 'rgba(0,0,0,0.3)', gradiente: ['#E53935', '#F5C518'] as const,
    },
  },
};

// ============================================================
// 🎯 TIPOS Y FUNCIONES
// ============================================================
export type PersonajeKey = keyof typeof Colores.tematicas;
export type Tematica = {
  primario: string;
  secundario: string;
  fondo: string;
  texto: string;
  gradiente: readonly [string, string];
  [key: string]: any;
};

export const getTematica = (personaje: PersonajeKey): Tematica => {
  return Colores.tematicas[personaje] || Colores.tematicas.krusty;
};

export const getTematicaConFallback = (personaje: string): Tematica => {
  if (personaje in Colores.tematicas) {
    return Colores.tematicas[personaje as PersonajeKey];
  }
  return Colores.tematicas.krusty;
};

export const getTematicaClara = (): Tematica => Colores.tematicas.claro;
export const getTematicaOscura = (): Tematica => Colores.tematicas.oscuro;

export type ColorKey = keyof typeof Colores;
export type EstadoColor = keyof typeof Colores.estado;

// ============================================================
// 📐 ESCALAS RESPONSIVE (antes estaba mal llamado DISEÑO)
// ============================================================
export const ESCALAS_RESPONSIVE = {
  BREAKPOINTS: { TABLET: 768, DESKTOP: 1024, SMALL_PHONE: 375 },
  TIPOGRAFIA: {
    HERO: { tablet: 28, normal: 22, small: 18 },
    TITULO: { tablet: 22, normal: 18, small: 15 },
    SUBTITULO: { tablet: 18, normal: 15, small: 13 },
    CUERPO: { tablet: 16, normal: 14, small: 12 },
    PEQUENO: { tablet: 14, normal: 12, small: 10 },
    MICRO: { tablet: 12, normal: 10, small: 9 },
  },
  ESPACIADO: {
    XL: { tablet: 32, normal: 20, small: 14 },
    LG: { tablet: 24, normal: 16, small: 12 },
    MD: { tablet: 20, normal: 14, small: 10 },
    SM: { tablet: 14, normal: 10, small: 8 },
    XS: { tablet: 10, normal: 8, small: 6 },
  },
  RADIO: {
    LG: { tablet: 20, normal: 16, small: 12 },
    MD: { tablet: 16, normal: 12, small: 10 },
    SM: { tablet: 12, normal: 10, small: 8 },
    XS: { tablet: 8, normal: 6, small: 4 },
  },
};

// ============================================================
// ✅ OBJETO DE DISEÑO UNIFICADO (AHORA UNO SOLO)
// ============================================================
export const DISENO = {
  colors: {
    fondo: Colores.fondoClaro,
    surface: Colores.fondoBlanco,
    surfaceHover: '#F8F6F2',
    card: Colores.fondoBlanco,
    cardShadow: 'rgba(0,0,0,0.06)',
    cardShadowHeavy: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.04)',

    text: Colores.textoOscuro,
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',

    accent: Colores.secundario,
    accentLight: Colores.secundarioClaro,
    accentSecondary: Colores.primario,
    accentSecondaryLight: Colores.primarioClaro,

    gradientStart: Colores.secundario,
    gradientEnd: Colores.primario,
    gradientButtonStart: Colores.secundario,
    gradientButtonEnd: Colores.primario,

    success: Colores.verdeKrusty,
    successLight: Colores.verdeClaro,
    warning: Colores.naranjaBart,
    danger: Colores.secundario,
    info: Colores.azulClaro,

    morado: '#7B1FA2',
    moradoClaro: '#9C27B0',
    moradoOscuro: '#4A148C',
    rosa: '#EC407A',
    rosaClaro: '#F06292',
    rosaMaggie: '#F48FB1',
    azul: '#1A237E',
    azulClaro: '#3949AB',
    azulHomero: '#1A237E',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    verdeOscuro: '#2E7D32',
    verdeMarge: '#43A047',
    naranja: '#FF6F00',
    naranjaClaro: '#FFA726',
    naranjaBart: '#FF6F00',

    platino: '#78909C',
    oro: '#F9A825',
    plata: '#BDBDBD',
    bronce: '#A1887F',

    blanco: '#FFFFFF',
    negro: '#1A1A1A',
    gris: '#9E9E9E',
    grisClaro: '#E0E0E0',
    grisOscuro: '#616161',
    amarillo: '#F5C518',
    amarilloClaro: '#FFE135',
    amarilloOscuro: '#D4A800',
    rojo: '#E53935',
    rojoClaro: '#FF6B6B',
    rojoOscuro: '#C62828',
  },

  spacing: Sizes.spacing,
  radius: Sizes.radius,
  shadow: Shadows.light,
  typography: Typography,

  // ✅ Escalas responsive accesibles desde DISENO
  TIPOGRAFIA: ESCALAS_RESPONSIVE.TIPOGRAFIA,
  ESPACIADO: ESCALAS_RESPONSIVE.ESPACIADO,
  RADIO: ESCALAS_RESPONSIVE.RADIO,
  BREAKPOINTS: ESCALAS_RESPONSIVE.BREAKPOINTS,

  isTablet: Sizes.screen.isTablet,
  isSmallPhone: Sizes.screen.isSmallPhone,
  screenWidth: Sizes.screen.width,
  screenHeight: Sizes.screen.height,

  // Funciones helper
  getValor: (valores: { tablet: any; normal: any; small: any }) => {
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getTexto: (escala: keyof typeof ESCALAS_RESPONSIVE.TIPOGRAFIA) => {
    const valores = ESCALAS_RESPONSIVE.TIPOGRAFIA[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getEspaciado: (escala: keyof typeof ESCALAS_RESPONSIVE.ESPACIADO) => {
    const valores = ESCALAS_RESPONSIVE.ESPACIADO[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getRadio: (escala: keyof typeof ESCALAS_RESPONSIVE.RADIO) => {
    const valores = ESCALAS_RESPONSIVE.RADIO[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
};

// ============================================================
// 🎯 HOOK RESPONSIVE CENTRALIZADO (UNO SOLO)
// ============================================================
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isSmallPhone = width < 375;

  const getValor = useCallback((valores: { tablet: any; normal: any; small: any }) => {
    if (isDesktop || isTablet) return valores.tablet;
    if (isSmallPhone) return valores.small;
    return valores.normal;
  }, [isDesktop, isTablet, isSmallPhone]);

  const getTexto = useCallback((escala: keyof typeof ESCALAS_RESPONSIVE.TIPOGRAFIA) =>
    getValor(ESCALAS_RESPONSIVE.TIPOGRAFIA[escala]), [getValor]);

  const getEspaciado = useCallback((escala: keyof typeof ESCALAS_RESPONSIVE.ESPACIADO) =>
    getValor(ESCALAS_RESPONSIVE.ESPACIADO[escala]), [getValor]);

  const getRadio = useCallback((escala: keyof typeof ESCALAS_RESPONSIVE.RADIO) =>
    getValor(ESCALAS_RESPONSIVE.RADIO[escala]), [getValor]);

  const spacing = (base: number) => {
    if (isTablet) return base * 1.5;
    if (isSmallPhone) return base * 0.75;
    return base;
  };

  return {
    isTablet,
    isDesktop,
    isSmallPhone,
    width,
    height,
    getValor,
    getTexto,
    getEspaciado,
    getRadio,
    spacing,
  };
};

// ============================================================
// ✅ FUNCIÓN RESPONSIVE SIMPLE
// ============================================================
export function responsiveSize(
  base: number,
  tabletMultiplier: number = 1.5,
  smallMultiplier: number = 0.75
): number {
  const isTablet = Sizes.screen.isTablet;
  const isSmallPhone = Sizes.screen.isSmallPhone;

  if (isTablet) return base * tabletMultiplier;
  if (isSmallPhone) return base * smallMultiplier;
  return base;
}

export default Colores;