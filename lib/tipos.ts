// lib/tipos.ts
export type EstadoPedido = 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
export type RolUsuario = 'cliente' | 'admin' | 'repartidor';

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    categoria: string;
}

export interface ElementoPedido {
    producto_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
}

export interface Pedido {
    id: number;
    creado_en: string;
    cliente_nombre: string | null;
    estado: EstadoPedido;
    total: number | null;
    direccion: string | null;
    telefono: string | null;
    metodo_pago: string | null;
    tipo_entrega: string | null;
    notas: string | null;
    resumenes_de_elementos: string | null;
    lat_repartidor: number | null;
    repartidor_de_lng: number | null;
    repartidor_id: string | null;
    token_fcm: string | null;
    id_de_usuario: string | null;
    lat_cliente: number | null;
    lng_cliente: number | null;
    items_json: ElementoPedido[] | null;
    puntos_usados: number | null;
    notas_cliente: string | null;
    total_parcial: number | null;
    costo_envio: number | null;
    volver: number | null;
    encabezado_repartidor: string | null;
    distancia_km?: number | null;
    tiempo_estimado?: number | null;
}

export interface Perfil {
    id: string;
    nombre_cliente: string;
    email: string;
    puntos_acumulados: number;
    ultimo_acceso: string;
    rol: 'cliente' | 'admin' | 'repartidor';
    telefono?: string | null;
    direccion_calle?: string | null;
    direccion_numero?: string | null;
    direccion_piso?: string | null;
    direccion_departamento?: string | null;
    direccion_barrio?: string | null;
    direccion_ciudad?: string | null;
    direccion_codigo_postal?: string | null;
    preferencias_comida?: string | null;
    metodo_pago?: string | null;
}

export interface ElementoCarrito {
    producto: Producto;
    cantidad: number;
}

// ============================================================
// 🆕 INTERFACES PARA CONFIGURACIÓN DE ENVÍOS
// ============================================================

export interface ConfiguracionEnvio {
    id: number;
    tipo: string;
    precio_base: number;
    precio_por_km: number;
    distancia_minima_km: number;
    distancia_maxima_km: number;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ConfiguracionLocal {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    direccion: string;
    telefono: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// 🆕 INTERFAZ PARA UBICACIÓN GUARDADA
// ============================================================

export interface UbicacionGuardada {
    latitude: number;
    longitude: number;
    direccion: string;
}