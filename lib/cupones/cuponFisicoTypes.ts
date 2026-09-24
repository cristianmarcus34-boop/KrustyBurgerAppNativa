// lib/cupones/cuponFisicoTypes.ts

export type EstadoCuponFisico = 'disponible' | 'asignado' | 'usado' | 'anulado';

export type EstiloPDF =
    | 'retro'
    | 'clean'
    | 'mixto'
    | 'arena'
    | 'oliva'
    | 'noir'
    | 'kraft'
    | 'durazno'
    | 'menta'
    | 'vino';

export interface LoteCuponesFisicos {
    id: number;
    cupon_id: number;
    cantidad: number;
    prefijo: string;
    creado_por: string | null;
    creado_en: string;
    notas: string | null;
}

export interface CuponFisico {
    id: number;
    lote_id: number;
    cupon_id: number;
    codigo: string;
    numero_en_lote: number;
    estado: EstadoCuponFisico;
    asignado_a: string | null;
    asignado_en: string | null;
    usado_en: string | null;
    anulado_en: string | null;
    anulado_motivo: string | null;
    creado_en: string;
}

export interface LoteResumen {
    id: number;
    cupon_id: number;
    cupon_titulo: string;
    cupon_tipo: string;
    cantidad: number;
    prefijo: string;
    creado_en: string;
    creado_por: string | null;
    total_generados: number;
    disponibles: number;
    asignados: number;
    usados: number;
    anulados: number;
}

export interface GenerarLoteDTO {
    cupon_id: number;
    cantidad: number;
    prefijo?: string;
    notas?: string;
}

export interface OpcionesPDF {
    estilo: EstiloPDF;
    incluirQR: boolean;
    incluirTerminos: boolean;
    terminos?: string;
    nombreNegocio?: string;
    telefono?: string;
    direccion?: string;
}