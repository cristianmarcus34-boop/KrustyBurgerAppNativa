// lib/colores.ts

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
  fondoClaro: '#FFF8E1',
  fondoBlanco: '#FFFFFF',

  // ============================================================
  // ✏️ TEXTOS
  // ============================================================
  textoOscuro: '#0A0A0A',
  textoClaro: '#FFFFFF',
  textoGris: '#B0B0B0',
  textoAmarillo: '#F5C518',
  textoRojo: '#E53935',

  // ============================================================
  // 🎯 ESTADOS DE PEDIDOS
  // ============================================================
  pendiente: '#F5C518',
  confirmado: '#3949AB',
  preparando: '#FF6F00',
  listo: '#43A047',
  enCamino: '#7B1FA2',
  entregado: '#43A047',
  cancelado: '#E53935',

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
  gradientGorgory: ['#1A237E', '#78909C'] as const,    // Azul → Gris
  gradientFrink: ['#F5F5F5', '#9E9E9E'] as const,      // Blanco → Gris
  gradientHomero: ['#1A237E', '#F5C518'] as const,     // Azul → Amarillo
  gradientMarge: ['#43A047', '#F48FB1'] as const,      // Verde → Rosa
  gradientBart: ['#FF6F00', '#E53935'] as const,       // Naranja → Rojo
  gradientLisa: ['#7B1FA2', '#F48FB1'] as const,       // Morado → Rosa
  gradientBurns: ['#43A047', '#FFD700'] as const,      // Verde → Dorado
};