// lib/cupones/generadorPDFCupones.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Cupon } from './cuponTypes';
import { CuponFisico, EstiloPDF, OpcionesPDF } from './cuponFisicoTypes';

// ============================================================
// 🖼️ LOGO DESDE SUPABASE STORAGE
// ============================================================
const LOGO_URL = 'https://nurhcmttnwankriplcwv.supabase.co/storage/v1/object/public/logos/icon.png';

// ============================================================
// 🔤 FUENTE SIMPSONS DESDE SUPABASE STORAGE
// ============================================================
const SIMPSON_FONT_URL = 'https://nurhcmttnwankriplcwv.supabase.co/storage/v1/object/public/fonts/Simpsonfont.ttf';

// ============================================================
// 📱 URL DE DESCARGA DE LA APP
// ============================================================
const URL_DESCARGA_APP = '';

// ============================================================
// 🎨 PALETAS (3 viejos + 7 nuevos)
// ============================================================
const PALETAS: Record<EstiloPDF, {
  fondo: string;
  texto: string;
  acento: string;
  borde: string;
  qrBg: string;
}> = {
  retro: {
    fondo: '#F5C518',
    texto: '#1A1A1A',
    acento: '#E53935',
    borde: '#1A1A1A',
    qrBg: '#FFFFFF',
  },
  clean: {
    fondo: '#FFFFFF',
    texto: '#1A1A1A',
    acento: '#E53935',
    borde: '#E0E0E0',
    qrBg: '#FFFFFF',
  },
  mixto: {
    fondo: '#FFFFFF',
    texto: '#1A1A1A',
    acento: '#F5C518',
    borde: '#E53935',
    qrBg: '#FFFFFF',
  },
  arena: {
    fondo: '#FAF7F2',
    texto: '#2A2620',
    acento: '#C97B5A',
    borde: '#C97B5A',
    qrBg: '#FFFFFF',
  },
  oliva: {
    fondo: '#FFFFFF',
    texto: '#1F2419',
    acento: '#7A8B5C',
    borde: '#7A8B5C',
    qrBg: '#FFFFFF',
  },
  noir: {
    fondo: '#FFFFFF',
    texto: '#0A0A0A',
    acento: '#1A1A1A',
    borde: '#1A1A1A',
    qrBg: '#FFFFFF',
  },
  kraft: {
    fondo: '#F5E6D3',
    texto: '#3B2C1A',
    acento: '#8B6F47',
    borde: '#8B6F47',
    qrBg: '#FFFFFF',
  },
  durazno: {
    fondo: '#FFFFFF',
    texto: '#2A1F17',
    acento: '#E8A87C',
    borde: '#E8A87C',
    qrBg: '#FFFFFF',
  },
  menta: {
    fondo: '#FFFFFF',
    texto: '#1A2620',
    acento: '#7FA99B',
    borde: '#A8C5B8',
    qrBg: '#FFFFFF',
  },
  vino: {
    fondo: '#FFFFFF',
    texto: '#1A0E12',
    acento: '#7B2D3E',
    borde: '#7B2D3E',
    qrBg: '#FFFFFF',
  },
};

// ============================================================
// 📐 LAYOUT
// ============================================================
const LAYOUT = {
  cols: 2,
  rows: 4,
  qrSize: 16,
  logoTamano: 12,
  tituloSize: 10,
  descuentoSize: 17,
  codigoSize: 10,
  descSize: 7,
  terminosSize: 5,
  instruccionesSize: 6,
  paddingTop: '3mm',
  paddingX: '3mm',
};

const CUPONES_POR_HOJA = 8;

// ============================================================
// 📱 TEXTO DE INSTRUCCIONES
// ============================================================
const generarInstrucciones = (): string => {
  if (URL_DESCARGA_APP) {
    return `📱 Descargá la app en: ${URL_DESCARGA_APP}`;
  }
  return '📱 Escaneá con la app Krusty Burger · Buscala en Play Store';
};

// ============================================================
// 🧱 CSS COMPARTIDO (para PDF y para Preview)
// ============================================================
const generarCSS = (paleta: typeof PALETAS[EstiloPDF]): string => `
  @font-face {
    font-family: 'Simpsonfont';
    src: url('${SIMPSON_FONT_URL}') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background: transparent;
    color: ${paleta.texto};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ============================================
     CUPÓN
     ============================================ */
  .cupon {
    border: 1.2px dashed ${paleta.borde};
    border-radius: 3px;
    padding: ${LAYOUT.paddingTop} ${LAYOUT.paddingX};
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: ${paleta.fondo};
    page-break-inside: avoid;
    position: relative;
    min-height: 0;
    width: 100%;
    height: 100%;
  }

  .cupon-header {
    display: flex;
    align-items: center;
    gap: 1.2mm;
    border-bottom: 0.8px solid ${paleta.borde}33;
    padding-bottom: 0.6mm;
    margin-bottom: 0.8mm;
    flex-shrink: 0;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo img {
    width: ${LAYOUT.logoTamano}mm;
    height: ${LAYOUT.logoTamano}mm;
    object-fit: contain;
    display: block;
  }

  .negocio {
    font-family: 'Simpsonfont', sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.5px;
    color: ${paleta.texto};
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
  }

  .cupon-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    min-height: 0;
    gap: 0.4mm;
  }

  .cupon-titulo {
    font-size: ${LAYOUT.tituloSize}px;
    font-weight: 800;
    color: ${paleta.texto};
    line-height: 1.05;
    text-transform: uppercase;
    max-height: ${LAYOUT.tituloSize * 2.2}px;
    overflow: hidden;
    width: 100%;
  }

  .cupon-desc {
    font-size: ${LAYOUT.descSize}px;
    color: ${paleta.texto}AA;
    line-height: 1.15;
    max-height: ${LAYOUT.descSize * 2.6}px;
    overflow: hidden;
    width: 100%;
    flex-shrink: 0;
  }

  .cupon-descuento {
    font-size: ${LAYOUT.descuentoSize}px;
    font-weight: 900;
    color: ${paleta.acento};
    letter-spacing: -0.3px;
    line-height: 1;
    margin: 0.2mm 0;
  }

  .cupon-qr {
    display: flex;
    justify-content: center;
    margin: 0.2mm 0;
  }

  .cupon-qr img {
    width: ${LAYOUT.qrSize - 3}mm;
    height: ${LAYOUT.qrSize - 3}mm;
    display: block;
  }

  .cupon-instrucciones {
    font-size: ${LAYOUT.instruccionesSize}px;
    color: ${paleta.texto}CC;
    line-height: 1.2;
    text-align: center;
    width: 100%;
    flex-shrink: 0;
    padding: 0 0.5mm;
  }

  .cupon-codigo {
    background: ${paleta.qrBg};
    border: 0.8px solid ${paleta.borde};
    border-radius: 2px;
    padding: 0.4mm 1.5mm;
    width: 100%;
    flex-shrink: 0;
  }

  .codigo-valor {
    font-family: 'Courier New', monospace;
    font-size: ${LAYOUT.codigoSize}px;
    font-weight: 900;
    letter-spacing: 0.5px;
    color: ${paleta.texto};
    line-height: 1.1;
  }

  .cupon-fecha {
    font-size: ${LAYOUT.descSize - 0.5}px;
    color: ${paleta.texto}CC;
    line-height: 1;
    flex-shrink: 0;
  }

  .cupon-terminos {
    font-size: ${LAYOUT.terminosSize}px;
    color: ${paleta.texto}88;
    line-height: 1.2;
    text-align: center;
    max-height: none;
    overflow: visible;
    flex-shrink: 0;
    margin-top: 0.3mm;
  }

  /* ============================================
     ESTILOS VIEJOS
     ============================================ */
  .cupon-retro {
    background: linear-gradient(135deg, #F5C518 0%, #FFE135 100%);
  }
  .cupon-retro .cupon-descuento {
    color: #E53935;
    text-shadow: 0.5px 0.5px 0 #FFFFFF;
  }

  .cupon-clean { background: #FFFFFF; }
  .cupon-clean .cupon-header { border-bottom: 1.5px solid #E53935; }

  .cupon-mixto {
    background: #FFFFFF;
    border: 1.5px solid #E53935;
  }
  .cupon-mixto .cupon-header {
    background: #F5C518;
    margin: -3mm -3mm 0.8mm;
    padding: 1.5mm 2mm;
    border-bottom: none;
  }
  .cupon-mixto .cupon-descuento { color: #E53935; }

  /* ============================================
     ESTILOS NUEVOS
     ============================================ */
  .cupon-arena {
    background: #FAF7F2;
    border: 1px dashed #C97B5A;
  }
  .cupon-arena .cupon-header { border-bottom: 1px solid #C97B5A40; }
  .cupon-arena .cupon-descuento { color: #C97B5A; }
  .cupon-arena .cupon-codigo {
    background: #FFFFFF;
    border: 1px solid #C97B5A;
    border-radius: 4px;
  }

  .cupon-oliva {
    background: #FFFFFF;
    border: 1px solid #7A8B5C;
  }
  .cupon-oliva .cupon-header { border-bottom: 1px solid #7A8B5C40; }
  .cupon-oliva .cupon-descuento { color: #7A8B5C; }
  .cupon-oliva .cupon-codigo {
    background: #F7F9F4;
    border: 1px solid #7A8B5C;
    border-radius: 4px;
  }

  .cupon-noir {
    background: #FFFFFF;
    border: 1px solid #1A1A1A;
  }
  .cupon-noir .cupon-header { border-bottom: 1px solid #1A1A1A40; }
  .cupon-noir .cupon-descuento { color: #1A1A1A; }
  .cupon-noir .cupon-codigo {
    background: #0A0A0A;
    border: 1px solid #0A0A0A;
    border-radius: 3px;
  }
  .cupon-noir .codigo-valor { color: #FFFFFF; }

  .cupon-kraft {
    background: #F5E6D3;
    border: 1px dashed #8B6F47;
  }
  .cupon-kraft .cupon-header { border-bottom: 1px solid #8B6F4740; }
  .cupon-kraft .cupon-descuento { color: #8B6F47; }
  .cupon-kraft .cupon-codigo {
    background: #FFFFFF;
    border: 1px solid #8B6F47;
    border-radius: 4px;
  }

  .cupon-durazno {
    background: #FFFFFF;
    border: 1px solid #E8A87C;
  }
  .cupon-durazno .cupon-header { border-bottom: 1px solid #E8A87C40; }
  .cupon-durazno .cupon-descuento { color: #E8A87C; }
  .cupon-durazno .cupon-codigo {
    background: #FFF9F5;
    border: 1px solid #E8A87C;
    border-radius: 4px;
  }

  .cupon-menta {
    background: #FFFFFF;
    border: 1px solid #A8C5B8;
  }
  .cupon-menta .cupon-header { border-bottom: 1px solid #A8C5B840; }
  .cupon-menta .cupon-descuento { color: #7FA99B; }
  .cupon-menta .cupon-codigo {
    background: #F5FAF7;
    border: 1px solid #A8C5B8;
    border-radius: 4px;
  }

  .cupon-vino {
    background: #FFFFFF;
    border: 1px solid #7B2D3E;
  }
  .cupon-vino .cupon-header {
    background: linear-gradient(135deg, #7B2D3E 0%, #9B4A5C 100%);
    margin: -3mm -3mm 0.8mm;
    padding: 1.5mm 2mm;
    border-bottom: none;
  }
  .cupon-vino .cupon-header .negocio { color: #FFFFFF; }
  .cupon-vino .cupon-descuento { color: #7B2D3E; }
  .cupon-vino .cupon-codigo {
    background: #FDF5F7;
    border: 1px solid #7B2D3E;
    border-radius: 4px;
  }
`;

// ============================================================
// 🧱 HTML DEL CUPÓN (cuerpo, sin CSS)
// ============================================================
const generarBodyCupon = (
  cupon: Cupon,
  cuponFisico: CuponFisico,
  opciones: OpcionesPDF,
): string => {
  const descuentoTexto = (() => {
    if (cupon.tipo === 'envio_gratis') return 'ENVÍO GRATIS';
    if (cupon.tipo === 'producto_gratis') return 'PRODUCTO GRATIS';
    if (cupon.tipo === '2x1') return '2x1';
    if (cupon.valor_descuento == null) return 'GRATIS';
    return cupon.es_porcentaje
      ? `${cupon.valor_descuento}% OFF`
      : `$${Number(cupon.valor_descuento).toFixed(0)} OFF`;
  })();

  const fechaExp = new Date(cupon.fecha_expiracion).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  const terminos = opciones.terminos || 'Válido hasta la fecha. Un uso por cupón.';
  const nombreNegocio = opciones.nombreNegocio || 'KRUSTY BURGER';
  const descripcion = (cupon.descripcion || '').slice(0, 40);
  const instrucciones = generarInstrucciones();

  const urlCanje = `https://krustyburger.com.ar/canjear?codigo=${cuponFisico.codigo}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(urlCanje)}`;

  return `
    <div class="cupon cupon-${opciones.estilo}">
      <div class="cupon-header">
        <div class="logo">
          <img src="${LOGO_URL}" alt="${nombreNegocio}" onerror="this.style.display='none'" />
        </div>
        <div class="negocio">${nombreNegocio}</div>
      </div>

      <div class="cupon-body">
        <div class="cupon-titulo">${cupon.titulo}</div>
        ${descripcion ? `<div class="cupon-desc">${descripcion}</div>` : ''}

        <div class="cupon-descuento">${descuentoTexto}</div>

        ${opciones.incluirQR ? `
          <div class="cupon-qr">
            <img src="${qrUrl}" alt="QR" />
          </div>
        ` : ''}

        <div class="cupon-instrucciones">${instrucciones}</div>

        <div class="cupon-codigo">
          <div class="codigo-valor">${cuponFisico.codigo}</div>
        </div>

        <div class="cupon-fecha">Hasta ${fechaExp}</div>

        ${opciones.incluirTerminos ? `
          <div class="cupon-terminos">${terminos}</div>
        ` : ''}
      </div>
    </div>
  `;
};

// ============================================================
// 📄 HTML COMPLETO DEL PDF (múltiples cupones)
// ============================================================
export const generarHTMLPDF = (
  cupon: Cupon,
  cuponesFisicos: CuponFisico[],
  opciones: OpcionesPDF,
): string => {
  const paleta = PALETAS[opciones.estilo];
  const totalHojas = Math.ceil(cuponesFisicos.length / CUPONES_POR_HOJA);

  const hojas: CuponFisico[][] = [];
  for (let i = 0; i < cuponesFisicos.length; i += CUPONES_POR_HOJA) {
    hojas.push(cuponesFisicos.slice(i, i + CUPONES_POR_HOJA));
  }

  const hojasHTML = hojas.map((cuponesHoja, hojaIndex) => {
    const cuponesHTML = cuponesHoja
      .map((cf) => generarBodyCupon(cupon, cf, opciones))
      .join('');

    return `
      <div class="hoja">
        <div class="grid">
          ${cuponesHTML}
        </div>
        <div class="page-number">Página ${hojaIndex + 1} de ${totalHojas}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Cupones - ${cupon.titulo}</title>
      <style>
        ${generarCSS(paleta)}

        @page {
          size: A4;
          margin: 5mm;
        }

        .hoja {
          width: 100%;
          height: 287mm;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }

        .hoja:last-child { page-break-after: auto; }

        .grid {
          display: grid;
          grid-template-columns: repeat(${LAYOUT.cols}, 1fr);
          grid-template-rows: repeat(${LAYOUT.rows}, 1fr);
          gap: 2.5mm;
          flex: 1;
          min-height: 0;
        }

        .page-number {
          text-align: center;
          font-size: 7px;
          color: #999;
          padding-top: 1mm;
          height: 5mm;
        }
      </style>
    </head>
    <body>
      ${hojasHTML}
    </body>
    </html>
  `;
};

// ============================================================
// 👁️ HTML DE PREVIEW (un solo cupón, para WebView)
// ============================================================
export const generarHTMLPreview = (
  cupon: Cupon,
  estilo: EstiloPDF,
  opciones?: Partial<OpcionesPDF>,
): string => {
  const paleta = PALETAS[estilo];

  const opcionesCompletas: OpcionesPDF = {
    estilo,
    incluirQR: opciones?.incluirQR ?? true,
    incluirTerminos: opciones?.incluirTerminos ?? true,
    terminos: opciones?.terminos,
    nombreNegocio: opciones?.nombreNegocio || 'KRUSTY BURGER',
  };

  // ✅ Cupón "falso" de ejemplo para el preview
  //    Usamos el código del cupón base + un sufijo random para que se vea real
  const codigoEjemplo = `${cupon.codigo || 'KRU'}-A3F9B2`;

  const cuponFisicoEjemplo: CuponFisico = {
    id: 0,
    lote_id: 0,
    cupon_id: cupon.id || 0,
    codigo: codigoEjemplo,
    numero_en_lote: 1,
    estado: 'disponible',
    asignado_a: null,
    asignado_en: null,
    usado_en: null,
    anulado_en: null,
    anulado_motivo: null,
    creado_en: new Date().toISOString(),
  };

  const bodyCupon = generarBodyCupon(cupon, cuponFisicoEjemplo, opcionesCompletas);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        ${generarCSS(paleta)}

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #F5F2ED;
        }

        body {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .preview-wrapper {
          width: 100%;
          max-width: 380px;
          aspect-ratio: 1 / 1.35;
          display: flex;
          align-items: stretch;
        }

        .cupon {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div class="preview-wrapper">
        ${bodyCupon}
      </div>
    </body>
    </html>
  `;
};

// ============================================================
// 📄 GENERAR PDF
// ============================================================
export const generarPDFCupones = async (
  cupon: Cupon,
  cuponesFisicos: CuponFisico[],
  opciones: OpcionesPDF,
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    if (!cuponesFisicos.length) {
      return { success: false, error: 'No hay cupones para imprimir' };
    }

    const html = generarHTMLPDF(cupon, cuponesFisicos, opciones);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    return { success: true, uri };
  } catch (error: any) {
    console.error('❌ Error generando PDF:', error);
    return { success: false, error: error?.message || 'Error al generar PDF' };
  }
};

// ============================================================
// 📤 COMPARTIR PDF
// ============================================================
export const compartirPDF = async (uri: string, titulo: string): Promise<boolean> => {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: titulo,
      UTI: 'com.adobe.pdf',
    });
    return true;
  } catch (error) {
    console.error('❌ Error compartiendo PDF:', error);
    return false;
  }
};