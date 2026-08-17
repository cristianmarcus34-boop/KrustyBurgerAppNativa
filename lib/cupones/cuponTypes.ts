// lib/cupones/cuponTypes.ts

export type TipoCupon = 'descuento' | 'producto_gratis' | 'envio_gratis' | '2x1';

export interface Cupon {
    id: number;
    codigo: string;
    titulo: string;
    descripcion: string | null;
    tipo: TipoCupon;
    valor_descuento: number | null;
    es_porcentaje: boolean;
    producto_id: number | null;
    cantidad_maxima: number;
    usos_totales: number;
    usos_maximos: number | null;
    fecha_inicio: string;
    fecha_expiracion: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
    // Relaciones
    producto?: {
        id: number;
        nombre: string;
        precio: number;
        imagen: string | null;
    };
    imagenes?: { imagen_url: string; es_principal: boolean }[];
}

export interface CuponUsuario {
    id: number;
    cupon_id: number;
    usuario_id: string;
    fecha_canje: string;
    usado_en_pedido: boolean;
    pedido_id: number | null;
    codigo_canje: string | null;
    cupon?: Cupon;
}

export interface CrearCuponDTO {
    titulo: string;
    descripcion?: string;
    tipo: TipoCupon;
    valor_descuento?: number;
    es_porcentaje?: boolean;
    producto_id?: number;
    cantidad_maxima?: number;
    usos_maximos?: number;
    fecha_inicio: string;
    fecha_expiracion: string;
    activo?: boolean;
}

export interface CanjearCuponDTO {
    codigo: string;
    usuarioId: string;
    pedidoId?: number;
}

export interface ResultadoCanje {
    success: boolean;
    mensaje: string;
    cupon?: Cupon;
    descuento_aplicado?: number;
    producto_gratis?: {
        id: number;
        nombre: string;
    };
}