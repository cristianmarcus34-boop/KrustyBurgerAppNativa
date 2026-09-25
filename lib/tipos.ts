// lib/tipos.ts - COMPLETO Y ACTUALIZADO CON TODAS LAS PROPIEDADES
export type EstadoPedido = 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
export type RolUsuario = 'cliente' | 'admin' | 'repartidor';

// ============================================================
// 🆕 TIPOS PARA CUPONES
// ============================================================

export type TipoCupon = 'descuento' | 'envio_gratis' | 'producto_gratis' | '2x1';

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
    producto?: Producto | null;
}

export interface CuponUsuario {
    id: number;
    cupon_id: number;
    usuario_id: string;
    codigo_canje: string;
    cantidad_usos: number;
    fecha_canje: string | null;
    usado_en_pedido: boolean;
    pedido_id: number | null;
    created_at: string;
    cupon?: Cupon;
}

export interface CrearCuponDTO {
    titulo: string;
    descripcion?: string;
    tipo: TipoCupon;
    valor_descuento?: number | null;
    es_porcentaje?: boolean;
    producto_id?: number | null;
    cantidad_maxima?: number;
    usos_maximos?: number | null;
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

export interface DatosQR {
    codigo: string;
    titulo: string;
    tipo: TipoCupon;
    valor_descuento: number | null;
}

// ============================================================
// TIPOS DE PRODUCTOS Y PEDIDOS
// ============================================================

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    categoria: string;
    disponible?: boolean;
    stock?: number;
    es_vegetariano?: boolean;
    es_vegano?: boolean;
    sin_gluten?: boolean;
    popular?: boolean;
    destacado?: boolean;
    incluye_papas?: boolean;
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
    monto_pago?: number | null;
    vuelto?: number | null;

    // Descuentos y beneficios
    descuento_nivel?: number | null;
    descuento_cupon?: number | null;
    descuento_puntos?: number | null;
    nivel_cliente?: string | null;
    envio_gratis?: boolean | null;

    // ✅ Cupón aplicado
    cupon_aplicado_id?: number | null;
    cupon_aplicado_codigo?: string | null;
    cupon_descuento?: number | null;
}

// ============================================================
// TIPOS DE PERFIL Y USUARIO
// ============================================================

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
    acepta_promociones?: boolean;
    lat_cliente?: number | null;
    lng_cliente?: number | null;
    direccion_manual?: string | null;
    created_at?: string;
    nivel?: 'bronce' | 'plata' | 'oro' | 'platino';
    mes_actual_beneficios?: string;
}

export interface ElementoCarrito {
    producto: Producto;
    cantidad: number;
}

// ============================================================
// CONFIGURACIÓN DE ENVÍOS
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
// UBICACIÓN GUARDADA
// ============================================================

export interface UbicacionGuardada {
    latitude: number;
    longitude: number;
    direccion: string;
    seleccionadaPorUsuario?: boolean;
}

// ============================================================
// RECOMPENSAS
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

export interface CanjeConRecompensa {
    id: number;
    usuario_id: string;
    recompensa_id: number;
    puntos_usados: number;
    fecha: string;
    usado_en_pedido: boolean;
    pedido_id?: number | null;
    created_at: string;
    recompensas: {
        nombre: string;
        tipo: string;
        valor_descuento: number;
    } | null;
}

export interface ResultadoCanjeRecompensa {
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
// NOTIFICACIONES
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
// ESTADÍSTICAS DE ADMIN
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
// REPARTIDOR
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
// SISTEMA DE PAGOS CON MERCADO PAGO
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

// ============================================================
// ACTIVIDAD RECIENTE (PERFIL)
// ============================================================

export interface ActividadReciente {
    id: string;
    tipo: 'pedido' | 'canje' | 'favorito';
    descripcion: string;
    fecha: string;
    icono: string;
    color: string;
}

// ============================================================
// NIVELES Y PROGRESO
// ============================================================

export interface NivelCliente {
    icono: string;
    nombre: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
    color: string;
    siguiente: string;
    progreso: number;
    puntos_requeridos: number;
}

export const NIVELES = {
    BRONCE: { puntos: 0, icono: '🥉', nombre: 'Bronce', color: '#A1887F' },
    PLATA: { puntos: 500, icono: '🥈', nombre: 'Plata', color: '#BDBDBD' },
    ORO: { puntos: 1500, icono: '👑', nombre: 'Oro', color: '#F9A825' },
    PLATINO: { puntos: 5000, icono: '💎', nombre: 'Platino', color: '#78909C' },
} as const;

export function obtenerNivel(puntos: number): NivelCliente {
    if (puntos >= 5000) {
        return {
            icono: NIVELES.PLATINO.icono,
            nombre: NIVELES.PLATINO.nombre,
            color: NIVELES.PLATINO.color,
            siguiente: '—',
            progreso: 100,
            puntos_requeridos: 5000,
        };
    }
    if (puntos >= 1500) {
        const progreso = ((puntos - 1500) / (5000 - 1500)) * 100;
        return {
            icono: NIVELES.ORO.icono,
            nombre: NIVELES.ORO.nombre,
            color: NIVELES.ORO.color,
            siguiente: 'Platino',
            progreso: Math.min(progreso, 100),
            puntos_requeridos: 5000,
        };
    }
    if (puntos >= 500) {
        const progreso = ((puntos - 500) / (1500 - 500)) * 100;
        return {
            icono: NIVELES.PLATA.icono,
            nombre: NIVELES.PLATA.nombre,
            color: NIVELES.PLATA.color,
            siguiente: 'Oro',
            progreso: Math.min(progreso, 100),
            puntos_requeridos: 1500,
        };
    }
    const progreso = (puntos / 500) * 100;
    return {
        icono: NIVELES.BRONCE.icono,
        nombre: NIVELES.BRONCE.nombre,
        color: NIVELES.BRONCE.color,
        siguiente: 'Plata',
        progreso: Math.min(progreso, 100),
        puntos_requeridos: 500,
    };
}

// ============================================================
// ESTADÍSTICAS DEL PERFIL
// ============================================================

export interface EstadisticasPerfil {
    totalPedidos: number;
    totalGastado: number;
    totalCanjes: number;
    puntosActuales: number;
    nivel: NivelCliente;
}

// ============================================================
// ELIMINACIÓN DE CUENTA
// ============================================================

export type EstadoSolicitudEliminacion = 'pendiente' | 'cancelada' | 'completada';

export interface SolicitudEliminacion {
    id: string;
    usuario_id: string;
    email: string;
    motivo: string;
    fecha_solicitud: string;
    fecha_eliminacion: string;
    estado: EstadoSolicitudEliminacion;
    creado_en: string;
    actualizado_en: string;
}

export interface ResultadoSolicitudEliminacion {
    success: boolean;
    error?: string;
    solicitud?: SolicitudEliminacion;
}

export interface EstadoEliminacion {
    tieneSolicitud: boolean;
    solicitud?: SolicitudEliminacion;
    diasRestantes?: number;
}

// ============================================================
// BENEFICIOS POR NIVEL
// ============================================================

export interface BeneficiosNivel {
    descuento: number;
    descuentoMinimo: number | null;
    descuentoLimiteDiario: number;
    envioGratis: boolean;
    envioGratisMinimo: number | null;
    productosGratisPorMes: number;
    accesoAnticipadoOfertas: boolean;
    soportePrioritario: boolean;
    prioridadEntrega: number;
    descripcion: string;
}

// ============================================================
// 🆕 RESULTADOS DE SERVICIOS
// ============================================================

export interface ResultadoServicio {
    success: boolean;
    error?: string;
    data?: any;
}

export interface ResultadoCupon {
    success: boolean;
    error?: string;
    yaAsignado?: boolean;
    cupon?: Cupon;
}

// ============================================================
// 🆕 ROOT STACK PARAM LIST PARA NAVEGACIÓN
// ============================================================

export type RootStackParamList = {
    // ============================================================
    // 🔐 AUTENTICACIÓN
    // ============================================================
    Login: undefined;
    Registro: undefined;              // ✅ AGREGADO
    ResetPassword: undefined;
    NuevaContrasena: { token?: string };
    Bienvenida: undefined;

    // ============================================================
    // 👤 CLIENTE
    // ============================================================
    Principal: undefined;
    Carrito: { cuponAplicado?: any } | undefined;  // ✅ Con params opcionales
    Ofertas: undefined;
    Seguimiento: { pedidoId?: number } | undefined;
    DetalleProducto: { productoId?: number } | undefined;
    DetalleOferta: { ofertaId?: number } | undefined;
    Recompensas: undefined;
    Checkout: undefined;
    NotificacionesUsuario: undefined;
    MisCupones: undefined;
    CanjearCupon: { codigo?: string } | undefined;
    Terminos: undefined;
    Privacidad: undefined;

    // ============================================================
    // 👑 ADMIN
    // ============================================================
    PanelAdmin: undefined;
    GestionPedidos: undefined;
    GestionMenu: undefined;
    GestionClientes: undefined;
    Estadisticas: undefined;
    GestionOfertas: undefined;
    ConfiguracionEnvios: undefined;
    GestionRecompensas: undefined;
    NotificacionesAdmin: undefined;
    ListaCupones: undefined;
    CrearCupon: undefined;
    EditarCupon: { cuponId: number };

    // ============================================================
    // 🛵 REPARTIDOR
    // ============================================================
    Transmision: undefined;
};