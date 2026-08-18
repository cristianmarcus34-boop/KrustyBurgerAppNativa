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
    // ✅ AGREGADO: Campo de disponibilidad
    disponible?: boolean; // Por defecto true si no existe
    // ✅ AGREGADO: Campos útiles para gestión de inventario
    stock?: number;
    es_vegetariano?: boolean;
    es_vegano?: boolean;
    sin_gluten?: boolean;
    popular?: boolean;
    destacado?: boolean;
    // ✅ AGREGADO: Campos de tiempo
    created_at?: string;
    updated_at?: string;
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
    ruta_puntos?: { latitude: number; longitude: number }[];
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
    // ✅ NUEVAS PROPIEDADES PARA PAGO EN EFECTIVO
    monto_pago?: number | null;   // Cuánto pagó el cliente
    vuelto?: number | null;       // Vuelto a devolver
}

export interface Perfil {
    id: string;
    nombre_cliente: string;
    email: string;
    puntos_acumulados: number;
    puntos_disponibles: number;
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
    avatar_url?: string | null;
    fcm_token?: string | null;
    lat_cliente?: number | null;
    lng_cliente?: number | null;
    direccion_manual?: string | null;
    created_at?: string;
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

// ============================================================
// 🆕 INTERFACES PARA RECOMPENSAS (ACTUALIZADAS)
// ============================================================

export interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string | null;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
    imagen?: string | null;
    created_at?: string;
    actualizado_en?: string;
}

export interface Canje {
    id: number;
    usuario_id: string;
    recompensa_id: number;
    puntos_usados: number;
    fecha: string;
    usado_en_pedido: boolean;
    pedido_id?: number | null;
    created_at?: string;
    recompensa?: Recompensa;
}

export interface ResultadoCanje {
    exito: boolean;
    mensaje: string;
    canje_id: number;
    puntos_restantes: number;
}

export interface CanjeCompleto extends Canje {
    usuario_nombre: string;
    usuario_email: string;
    puntos_actuales: number;
    recompensa_nombre: string;
    recompensa_tipo: string;
    puntos_necesarios: number;
    estado: 'Usado en pedido' | 'Usado (pendiente de pedido)' | 'Disponible';
}

// ============================================================
// 🆕 TIPOS PARA EL SISTEMA DE NOTIFICACIONES
// ============================================================

export interface Notificacion {
    id: number;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: 'pedido' | 'promocion' | 'recompensa' | 'sistema';
    leida: boolean;
    created_at: string;
    data?: any;
}

// ============================================================
// 🆕 TIPOS PARA ESTADÍSTICAS DE ADMIN
// ============================================================

export interface EstadisticasAdmin {
    total_pedidos: number;
    pedidos_hoy: number;
    pedidos_pendientes: number;
    ingresos_totales: number;
    ingresos_hoy: number;
    total_usuarios: number;
    total_recompensas_canjeadas: number;
    puntos_totales_canjeados: number;
    pedidos_por_estado: {
        estado: EstadoPedido;
        cantidad: number;
    }[];
}

// ============================================================
// 🆕 TIPOS PARA EL SISTEMA DE REPARTIDOR
// ============================================================

export interface RepartidorInfo {
    id: string;
    nombre_cliente: string;
    email: string;
    telefono?: string | null;
    latitud: number | null;
    longitud: number | null;
    ultimo_acceso: string;
    pedidos_activos: number;
}

// ============================================================
// 🆕 SISTEMA DE PAGOS CON MERCADO PAGO (EN CASTELLANO)
// ============================================================

export type EstadoTransaccion = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'expirado';

export interface Transaccion {
    id: string;
    usuario_id: string;
    pedido_id: number;

    mp_preference_id: string;
    mp_payment_id: string | null;
    mp_estado: string | null;
    mp_detalle_estado: string | null;

    monto_total: number;
    metodo_pago: string;
    estado: EstadoTransaccion;

    email_pagador: string | null;
    nombre_pagador: string | null;
    telefono_pagador: string | null;

    creado_en: string;
    actualizado_en: string;
    fecha_pago: string | null;
    fecha_expiracion: string | null;

    metadata: any;
    webhook_recibido: boolean;
}

export interface CrearTransaccionDTO {
    usuario_id: string;
    pedido_id: number;
    mp_preference_id: string;
    monto_total: number;
    metodo_pago: string;
    email_pagador?: string;
    nombre_pagador?: string;
    telefono_pagador?: string;
    metadata?: any;
}

export interface RespuestaMercadoPago {
    exito: boolean;
    id_preferencia?: string;
    url_pago?: string;
    url_pruebas?: string;
    error?: string;
}

export interface RespuestaEstadoPago {
    exito: boolean;
    datos?: {
        estado: EstadoTransaccion;
        mp_estado: string | null;
        mp_detalle_estado: string | null;
        mp_preference_id: string;
    };
    error?: string;
}

export interface WebhookMercadoPago {
    id: string;
    tema: 'payment' | 'merchant_order';
    accion?: string;
    fecha_creacion?: string;
    usuario_id?: string;
    version_api?: string;
}

export interface PagoMP {
    id: string;
    referencia_externa: string;
    id_preferencia: string;
    estado: string;
    detalle_estado: string;
    fecha_aprobacion: string | null;
    pagador: {
        email: string;
        nombre: string;
        telefono: {
            numero: string;
        };
    };
    monto: number;
}

export interface ItemPago {
    producto_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    descripcion?: string;
    imagen?: string;
}

export interface DatosPago {
    items: ItemPago[];
    pedidoId: number;
    usuarioId: string;
    total: number;
    correo: string;
    nombre?: string;
    telefono?: string;
}