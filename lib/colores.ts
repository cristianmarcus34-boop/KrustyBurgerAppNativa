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
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 40,
  },
  avatar: {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 72,
    '2xl': 96,
  },
  height: {
    input: 48,
    button: 50,
    buttonLarge: 56,
    header: 64,
    tabBar: 72,
  },
  maxWidth: {
    container: 480,
    card: 360,
    modal: 400,
  },
  // ✅ RESPONSIVE
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
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeight: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 22,
    xl: 26,
    '2xl': 30,
    '3xl': 34,
    '4xl': 42,
    '5xl': 50,
  },
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ============================================================
// 🌓 SOMBRAS
// ============================================================
export const Shadows = {
  // Sombras claras (modo claro)
  light: {
    xs: {
      shadowColor: 'rgba(0,0,0,0.04)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 1,
    },
    sm: {
      shadowColor: 'rgba(0,0,0,0.06)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0,0,0,0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0,0,0,0.10)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: 'rgba(0,0,0,0.12)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  // Sombras oscuras (modo oscuro)
  dark: {
    xs: {
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 1,
    },
    sm: {
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: 'rgba(0,0,0,0.6)',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};

// ============================================================
// 🎨 COLORES COMPLETOS
// ============================================================
export const Colores = {
  // ============================================================
  // 🟡 COLORES PRINCIPALES - SIMPSONS
  // ============================================================
  primario: '#F5C518',
  primarioOscuro: '#D4A800',
  primarioClaro: '#FFE135',
  primarioTransparente: '#F5C51820',

  // ============================================================
  // 🔴 COLORES SECUNDARIOS - KRUSTY
  // ============================================================
  secundario: '#E53935',
  secundarioOscuro: '#C62828',
  secundarioClaro: '#FF6B6B',
  secundarioTransparente: '#E5393520',

  // ============================================================
  // 🎪 COLORES DEL CIRCO - KRUSTY BURGER
  // ============================================================
  acento: '#FF6F00',
  acentoClaro: '#FFA726',
  acentoOscuro: '#E65100',

  // ============================================================
  // 🟢 COLORES DE MARCA - HAMBURGUESA
  // ============================================================
  verdeKrusty: '#43A047',
  verdeClaro: '#66BB6A',
  verdeOscuro: '#2E7D32',

  // ============================================================
  // 👕 COLORES DE PERSONAJES
  // ============================================================
  azulHomero: '#1A237E',
  azulClaro: '#3949AB',
  rosaMaggie: '#F48FB1',
  moradoLisa: '#7B1FA2',
  naranjaBart: '#FF6F00',
  verdeMarge: '#43A047',

  // ============================================================
  // 🦈 JEFE GORGORY (Login - Autoridad)
  // ============================================================
  gorgoryAzul: '#1A237E',
  gorgoryAzulClaro: '#283593',
  gorgoryRojo: '#D32F2F',
  gorgoryGris: '#78909C',
  gorgoryBlanco: '#ECEFF1',
  gorgoryOscuro: '#0D1445',

  // ============================================================
  // 🤡 KRUSTY (Marca principal)
  // ============================================================
  krustyRojo: '#E53935',
  krustyAmarillo: '#F5C518',
  krustyNaranja: '#FF6F00',
  krustyBlanco: '#FFFFFF',
  krustyNegro: '#0A0A0A',

  // ============================================================
  // 🍔 HOMERO SIMPSON (Inicio - Familia)
  // ============================================================
  homeroAzul: '#1A237E',
  homeroBlanco: '#FFFFFF',
  homeroPiel: '#F5C518',
  homeroCafe: '#4E342E',
  homeroGris: '#9E9E9E',

  // ============================================================
  // 💛 MARGE SIMPSON (Perfil - Hogar)
  // ============================================================
  margeVerde: '#43A047',
  margeAzul: '#1A237E',
  margeRosa: '#F48FB1',
  margePiel: '#F5C518',
  margeBlanco: '#FFFFFF',

  // ============================================================
  // 🛹 BART SIMPSON (Carrito - Rebeldía)
  // ============================================================
  bartNaranja: '#FF6F00',
  bartAzul: '#1A237E',
  bartRojo: '#E53935',
  bartPiel: '#F5C518',
  bartBlanco: '#FFFFFF',

  // ============================================================
  // 🎷 LISA SIMPSON (Pedidos - Inteligencia)
  // ============================================================
  lisaMorado: '#7B1FA2',
  lisaRosa: '#F48FB1',
  lisaBlanco: '#FFFFFF',
  lisaPiel: '#F5C518',
  lisaAmarillo: '#FFD700',

  // ============================================================
  // 👔 SEÑOR BURNS (Admin - Poder)
  // ============================================================
  burnsVerde: '#43A047',
  burnsNegro: '#0A0A0A',
  burnsRojo: '#D32F2F',
  burnsDorado: '#FFD700',
  burnsBlanco: '#F5F5F5',

  // ============================================================
  // 🧪 PROFESOR FRINK (Registro - Ciencia)
  // ============================================================
  frinkBlanco: '#F5F5F5',
  frinkGris: '#9E9E9E',
  frinkAmarillo: '#FDD835',
  frinkAzul: '#42A5F5',
  frinkVerde: '#66BB6A',
  frinkNaranja: '#FF7043',

  // ============================================================
  // 🚲 REPARTIDOR (Transmision - Entrega)
  // ============================================================
  repartidorVerde: '#43A047',
  repartidorAmarillo: '#F5C518',
  repartidorNegro: '#0A0A0A',
  repartidorBlanco: '#FFFFFF',
  repartidorNaranja: '#FF6F00',

  // ============================================================
  // 🏠 CASA DE LOS SIMPSONS
  // ============================================================
  casaPared: '#FFE0B2',
  casaTecho: '#8D6E63',
  casaPuerta: '#4E342E',
  casaVentana: '#64B5F6',

  // ============================================================
  // 🌙 FONDOS Y GENERALES
  // ============================================================
  fondoOscuro: '#1A1A1A',
  fondoOscuroClaro: '#2A2A2A',
  fondoTarjeta: '#2A2A2A',
  fondoClaro: '#F5F2ED',
  fondoBlanco: '#FFFFFF',

  // ============================================================
  // ✏️ TEXTOS
  // ============================================================
  textoOscuro: '#1A1A1A',
  textoClaro: '#FFFFFF',
  textoGris: '#B0B0B0',
  textoGrisOscuro: '#6B6B6B',
  textoAmarillo: '#F5C518',
  textoRojo: '#E53935',

  // ============================================================
  // 🎯 ESTADOS DE PEDIDOS
  // ============================================================
  estado: {
    pendiente: '#F5C518',
    confirmado: '#3949AB',
    preparando: '#FF6F00',
    listo: '#43A047',
    enCamino: '#7B1FA2',
    entregado: '#43A047',
    cancelado: '#E53935',
  },

  // ============================================================
  // 🏅 RECOMPENSAS
  // ============================================================
  bronce: '#CD7F32',
  plata: '#C0C0C0',
  oro: '#FFD700',
  platino: '#E5E4E2',

  // ============================================================
  // 🎨 GRADIENTES TEMÁTICOS
  // ============================================================
  gradientKrusty: ['#E53935', '#D4A800'] as const,
  gradientCirco: ['#FF6F00', '#F5C518'] as const,
  gradientSimpsons: ['#F5C518', '#FFE135'] as const,
  gradientHamburguesa: ['#43A047', '#D4A800'] as const,
  gradientNoche: ['#1A1A1A', '#0A0A0A'] as const,
  gradientFuego: ['#E53935', '#FF6F00'] as const,

  // ============================================================
  // 🎨 GRADIENTES DE PERSONAJES
  // ============================================================
  gradientGorgory: ['#1A237E', '#78909C'] as const,
  gradientFrink: ['#F5F5F5', '#9E9E9E'] as const,
  gradientHomero: ['#1A237E', '#F5C518'] as const,
  gradientMarge: ['#43A047', '#F48FB1'] as const,
  gradientBart: ['#FF6F00', '#E53935'] as const,
  gradientLisa: ['#7B1FA2', '#F48FB1'] as const,
  gradientBurns: ['#43A047', '#FFD700'] as const,
  gradientKrustyCompleto: ['#E53935', '#F5C518', '#FF6F00'] as const,

  // ============================================================
  // 🆕 TEMÁTICAS UNIFICADAS
  // ============================================================
  tematicas: {
    bart: {
      primario: '#FF6F00',
      secundario: '#E53935',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#FF6F00', '#E53935'] as const,
    },
    lisa: {
      primario: '#7B1FA2',
      secundario: '#F48FB1',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#7B1FA2', '#F48FB1'] as const,
    },
    burns: {
      primario: '#43A047',
      secundario: '#FFD700',
      fondo: '#0A0A0A',
      texto: '#F5F5F5',
      gradiente: ['#43A047', '#FFD700'] as const,
    },
    homero: {
      primario: '#F5C518',
      secundario: '#1A237E',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#1A237E', '#F5C518'] as const,
    },
    marge: {
      primario: '#43A047',
      secundario: '#F48FB1',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#43A047', '#F48FB1'] as const,
    },
    krusty: {
      primario: '#E53935',
      secundario: '#F5C518',
      verde: '#43A047',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#E53935', '#43A047'] as const,
    },
    frink: {
      primario: '#42A5F5',
      secundario: '#FDD835',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#42A5F5', '#FDD835'] as const,
    },
    springfield: {
      primario: '#43A047',
      secundario: '#42A5F5',
      fondo: '#1A1A1A',
      texto: '#FFFFFF',
      gradiente: ['#43A047', '#42A5F5'] as const,
    },
    // ✅ TEMÁTICA CLARA (para perfil elegante)
    claro: {
      primario: '#E53935',
      secundario: '#F5C518',
      fondo: '#F5F2ED',
      fondoCard: '#FFFFFF',
      texto: '#1A1A1A',
      textoSecundario: 'rgba(0,0,0,0.55)',
      textoTerciario: 'rgba(0,0,0,0.30)',
      borde: 'rgba(0,0,0,0.06)',
      sombra: 'rgba(0,0,0,0.06)',
      gradiente: ['#E53935', '#F5C518'] as const,
    },
    // ✅ TEMÁTICA OSCURA
    oscuro: {
      primario: '#E53935',
      secundario: '#F5C518',
      fondo: '#0D0D0D',
      fondoCard: 'rgba(255,255,255,0.04)',
      texto: '#FFFFFF',
      textoSecundario: 'rgba(255,255,255,0.6)',
      textoTerciario: 'rgba(255,255,255,0.3)',
      borde: 'rgba(255,255,255,0.06)',
      sombra: 'rgba(0,0,0,0.3)',
      gradiente: ['#E53935', '#F5C518'] as const,
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

export const getTematicaClara = (): Tematica => {
  return Colores.tematicas.claro;
};

export const getTematicaOscura = (): Tematica => {
  return Colores.tematicas.oscuro;
};

export type ColorKey = keyof typeof Colores;
export type EstadoColor = keyof typeof Colores.estado;

// ============================================================
// 📐 SISTEMA DE DISEÑO - DISEÑO (para usar en todas las pantallas)
// ============================================================

// ✅ DISEÑO DE TIPOGRAFÍA RESPONSIVE
export const DISEÑO = {
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
// 🎯 HOOK RESPONSIVE CENTRALIZADO
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

  const getTexto = useCallback((escala: keyof typeof DISEÑO.TIPOGRAFIA) =>
    getValor(DISEÑO.TIPOGRAFIA[escala]), [getValor]);

  const getEspaciado = useCallback((escala: keyof typeof DISEÑO.ESPACIADO) =>
    getValor(DISEÑO.ESPACIADO[escala]), [getValor]);

  const getRadio = useCallback((escala: keyof typeof DISEÑO.RADIO) =>
    getValor(DISEÑO.RADIO[escala]), [getValor]);

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
    spacing
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

// ============================================================
// ✅ OBJETO DE DISEÑO UNIFICADO (para usar en lugar de DESIGN local)
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
    success: Colores.verdeKrusty,
    successLight: Colores.verdeClaro,
    warning: Colores.naranjaBart,
    danger: Colores.secundario,
    info: Colores.azulClaro,
    platino: '#78909C',
    oro: '#F9A825',
    plata: '#BDBDBD',
    bronce: '#A1887F',
    rosa: '#EC407A',
    rosaClaro: '#F06292',
    azul: '#1A237E',
    azulClaro: '#3949AB',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    // ✅ Para botones con gradiente
    gradientButtonStart: Colores.secundario,
    gradientButtonEnd: Colores.primario,
  },
  spacing: Sizes.spacing,
  radius: Sizes.radius,
  shadow: Shadows.light,
  typography: Typography,
  isTablet: Sizes.screen.isTablet,
  isSmallPhone: Sizes.screen.isSmallPhone,
  screenWidth: Sizes.screen.width,
  screenHeight: Sizes.screen.height,
  // ✅ DISEÑO RESPONSIVE
  diseño: DISEÑO,
  // ✅ Funciones de diseño
  getValor: (valores: { tablet: any; normal: any; small: any }) => {
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getTexto: (escala: keyof typeof DISEÑO.TIPOGRAFIA) => {
    const valores = DISEÑO.TIPOGRAFIA[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getEspaciado: (escala: keyof typeof DISEÑO.ESPACIADO) => {
    const valores = DISEÑO.ESPACIADO[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
  getRadio: (escala: keyof typeof DISEÑO.RADIO) => {
    const valores = DISEÑO.RADIO[escala];
    if (Sizes.screen.isTablet) return valores.tablet;
    if (Sizes.screen.isSmallPhone) return valores.small;
    return valores.normal;
  },
};

export default Colores;