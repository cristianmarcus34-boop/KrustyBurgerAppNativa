// lib/fuentes.ts
import { Platform } from 'react-native';

// ============================================================
// 🎨 SISTEMA DE FUENTES
// ============================================================

export const FUENTES = {
    // ✅ Fuente principal (legible, para todo el cuerpo)
    regular: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
    }) as string,

    // ✅ Fuente Simpsons (para títulos y elementos destacados)
    display: 'Simpsonfont',

    // ✅ Fuente monoespaciada (para códigos)
    mono: Platform.select({
        ios: 'Courier',
        android: 'monospace',
        default: 'monospace',
    }) as string,
};

// ============================================================
// 📏 TAMAÑOS RECOMENDADOS PARA SIMPSONFONT
// ============================================================
// ⚠️ La fuente Simpsons es MÁS COMPACTA, así que hay que
// usar tamaños más grandes que con la fuente regular.

export const TAMANOS_DISPLAY = {
    hero: 44,       // Título principal de pantalla
    titulo: 36,     // Títulos de sección
    subtitulo: 28,  // Subtítulos
    boton: 24,      // Botones principales
    badge: 18,      // Badges / etiquetas
    numero: 42,     // Números grandes (puntos, total)
    tab: 16,        // Labels de la barra inferior
};

// ============================================================
// 🎯 GUÍA DE USO
// ============================================================

/*
✅ USA 'Simpsonfont' EN:
- Títulos principales de pantalla ("Mis Cupones")
- Headers destacados ("Krusty Burger")
- Botones principales ("Crear Cuenta", "Iniciar Sesión")
- Números grandes (500 pts, $2.500)
- Mensajes de éxito ("¡Cuenta creada!")
- Badges y etiquetas destacadas
- Labels de tabs en la barra inferior

❌ NO USES 'Simpsonfont' EN:
- Textos de input (nombre, correo, contraseña)
- Descripciones largas (párrafos)
- Labels de formulario (Correo electrónico, Contraseña)
- Precios ($2.500) ← usar regular
- Emails / URLs / Teléfonos
- Texto legal (Términos y Condiciones)
- Listas de datos
- Códigos de cupón ← usar 'mono'

⚠️ IMPORTANTE:
- Las fuentes custom IGNORAN 'fontWeight'
- Siempre usar 'fontWeight: 400' con Simpsonfont
- La fuente es más compacta → usar tamaños más grandes
*/