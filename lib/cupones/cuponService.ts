// lib/cupones/cuponService.ts
import { supabase } from '../supabase';
import {
    Cupon,
    CuponUsuario,
    CrearCuponDTO,
    CanjearCuponDTO,
    ResultadoCanje,
} from './cuponTypes';

// ============================================================
// 🔧 TIPOS INTERNOS
// ============================================================

type ValidacionCupon = {
    valido: boolean;
    mensaje?: string;
};

type ResultadoRPC = {
    success: boolean;
    mensaje: string;
    cupon_id?: number;
    codigo?: string;
    titulo?: string;
    tipo?: Cupon['tipo'];
    valor_descuento?: number | null;
    es_porcentaje?: boolean;
    producto_id?: number | null;
    cantidad_usos?: number;
    usos_totales?: number;
    descuento_aplicado?: number | null;
    producto_gratis?: {
        id: number;
        nombre: string;
    } | null;
    pedido_id?: number | null;
    fecha_canje?: string;
};

// ============================================================
// 🎟️ SERVICE DE CUPONES
// ============================================================

export const cuponService = {

    // ============================================================
    // ✅ VERIFICAR ESTADO DEL CUPÓN (NUEVO)
    // ============================================================
    async verificarEstadoCupon(cuponId: number): Promise<{
        activo: boolean;
        expirado: boolean;
        futuro: boolean;
        agotado: boolean;
        usosRestantes: number | null;
        mensaje?: string;
    }> {
        try {
            const cupon = await this.obtenerCuponPorId(cuponId);
            if (!cupon) {
                return {
                    activo: false,
                    expirado: true,
                    futuro: false,
                    agotado: false,
                    usosRestantes: null,
                    mensaje: '❌ Cupón no encontrado',
                };
            }

            const ahora = new Date();
            const fechaInicio = new Date(cupon.fecha_inicio);
            const fechaExpiracion = new Date(cupon.fecha_expiracion);

            const expirado = ahora > fechaExpiracion;
            const futuro = ahora < fechaInicio;
            const agotado = cupon.usos_maximos !== null && cupon.usos_totales >= cupon.usos_maximos;
            const usosRestantes = cupon.usos_maximos !== null ? cupon.usos_maximos - cupon.usos_totales : null;

            let mensaje = '';
            if (!cupon.activo) {
                mensaje = '❌ El cupón está desactivado. Actívalo desde el panel de admin.';
            } else if (expirado) {
                const fechaFormateada = fechaExpiracion.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                mensaje = `⏰ El cupón expiró el ${fechaFormateada}`;
            } else if (futuro) {
                const fechaFormateada = fechaInicio.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                mensaje = `⏳ El cupón estará disponible a partir del ${fechaFormateada}`;
            } else if (agotado) {
                mensaje = '❌ Cupón agotado (límite global alcanzado)';
            }

            return {
                activo: cupon.activo,
                expirado,
                futuro,
                agotado,
                usosRestantes,
                mensaje,
            };
        } catch (error) {
            console.error('❌ Error verificando estado del cupón:', error);
            return {
                activo: false,
                expirado: false,
                futuro: false,
                agotado: false,
                usosRestantes: null,
                mensaje: '❌ Error al verificar el estado del cupón',
            };
        }
    },

    // ============================================================
    // 📋 CRUD DE CUPONES - ADMIN
    // ============================================================

    async obtenerCupones(activo?: boolean): Promise<Cupon[]> {
        try {
            let query = supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(
                        id,
                        nombre,
                        precio,
                        imagen
                    )
                `)
                .order('created_at', {
                    ascending: false,
                });

            if (activo !== undefined) {
                query = query.eq('activo', activo);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('❌ Error obteniendo cupones:', error);
            return [];
        }
    },

    // ============================================================
    // 🔎 OBTENER CUPÓN POR ID
    // ============================================================

    async obtenerCuponPorId(id: number): Promise<Cupon | null> {
        try {
            const { data, error } = await supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(
                        id,
                        nombre,
                        precio,
                        imagen
                    )
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data || null;

        } catch (error) {
            console.error('❌ Error obteniendo cupón:', error);
            return null;
        }
    },

    // ============================================================
    // 🔎 OBTENER CUPÓN POR CÓDIGO
    // ============================================================

    async obtenerCuponPorCodigo(codigo: string): Promise<Cupon | null> {
        try {
            const codigoNormalizado = codigo?.trim().toUpperCase();

            if (!codigoNormalizado) {
                return null;
            }

            const { data, error } = await supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(
                        id,
                        nombre,
                        precio,
                        imagen
                    )
                `)
                .eq('codigo', codigoNormalizado)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data || null;

        } catch (error) {
            console.error('❌ Error obteniendo cupón por código:', error);
            return null;
        }
    },

    // ============================================================
    // ➕ CREAR CUPÓN
    // ============================================================

    async crearCupon(datos: CrearCuponDTO): Promise<{
        success: boolean;
        data?: Cupon;
        error?: string;
    }> {
        try {
            const codigo = await this.generarCodigoUnico();

            const { data, error } = await supabase
                .from('cupones')
                .insert({
                    codigo,
                    titulo: datos.titulo,
                    descripcion: datos.descripcion || null,
                    tipo: datos.tipo,
                    valor_descuento: datos.valor_descuento ?? null,
                    es_porcentaje: datos.es_porcentaje ?? true,
                    producto_id: datos.producto_id ?? null,
                    cantidad_maxima: datos.cantidad_maxima ?? 1,
                    usos_totales: 0,
                    usos_maximos: datos.usos_maximos ?? null,
                    fecha_inicio: datos.fecha_inicio,
                    fecha_expiracion: datos.fecha_expiracion,
                    activo: datos.activo ?? true,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                data,
            };

        } catch (error: any) {
            console.error('❌ Error creando cupón:', error);
            return {
                success: false,
                error: typeof error?.message === 'string'
                    ? error.message
                    : 'No se pudo crear el cupón',
            };
        }
    },

    // ============================================================
    // ✏️ ACTUALIZAR CUPÓN
    // ============================================================

    async actualizarCupon(
        id: number,
        datos: Partial<CrearCuponDTO>
    ): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .update({
                    ...datos,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) {
                throw error;
            }

            return {
                success: true,
            };

        } catch (error: any) {
            console.error('❌ Error actualizando cupón:', error);
            return {
                success: false,
                error: typeof error?.message === 'string'
                    ? error.message
                    : 'No se pudo actualizar el cupón',
            };
        }
    },

    // ============================================================
    // 🗑️ DESACTIVAR CUPÓN
    // ============================================================

    async eliminarCupon(id: number): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .update({
                    activo: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) {
                throw error;
            }

            return {
                success: true,
            };

        } catch (error: any) {
            console.error('❌ Error eliminando cupón:', error);
            return {
                success: false,
                error: typeof error?.message === 'string'
                    ? error.message
                    : 'No se pudo eliminar el cupón',
            };
        }
    },

    // ============================================================
    // 🗑️ ELIMINAR CUPÓN PERMANENTEMENTE
    // ============================================================

    async eliminarCuponPermanente(id: number): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            return {
                success: true,
            };

        } catch (error: any) {
            console.error('❌ Error eliminando cupón permanentemente:', error);
            return {
                success: false,
                error: typeof error?.message === 'string'
                    ? error.message
                    : 'No se pudo eliminar el cupón',
            };
        }
    },

    // ============================================================
    // 👤 CUPONES DEL USUARIO
    // ============================================================

    async obtenerCuponesUsuario(usuarioId: string): Promise<CuponUsuario[]> {
        try {
            const { data, error } = await supabase
                .from('cupones_usuarios')
                .select(`
                    *,
                    cupon:cupones(
                        *,
                        producto:productos(
                            id,
                            nombre,
                            precio,
                            imagen
                        )
                    )
                `)
                .eq('usuario_id', usuarioId)
                .order('fecha_canje', {
                    ascending: false,
                    nullsFirst: false,
                });

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('❌ Error obteniendo cupones del usuario:', error);
            return [];
        }
    },

    // ============================================================
    // 🎟️ CUPONES DISPONIBLES
    // ============================================================

    async obtenerCuponesDisponibles(usuarioId: string): Promise<CuponUsuario[]> {
        try {
            if (!usuarioId) {
                return [];
            }

            const ahora = new Date().toISOString();

            const { data, error } = await supabase
                .from('cupones_usuarios')
                .select(`
                    *,
                    cupon:cupones!inner(
                        *,
                        producto:productos(
                            id,
                            nombre,
                            precio,
                            imagen
                        )
                    )
                `)
                .eq('usuario_id', usuarioId)
                .eq('usado_en_pedido', false)
                .eq('cantidad_usos', 0)
                .lt('cupon.fecha_inicio', ahora)
                .gt('cupon.fecha_expiracion', ahora)
                .eq('cupon.activo', true)
                .order('fecha_canje', {
                    ascending: false,
                    nullsFirst: false,
                });

            if (error) {
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error('❌ Error obteniendo cupones disponibles:', error);
            return [];
        }
    },

    // ============================================================
    // 🎟️ ASIGNAR CUPÓN A USUARIO (COMPLETAMENTE CORREGIDO)
    // ============================================================

    async asignarCuponAUsuario(
        cuponId: number,
        usuarioId: string
    ): Promise<{
        success: boolean;
        error?: string;
        yaAsignado?: boolean;
    }> {
        try {
            if (!usuarioId) {
                return {
                    success: false,
                    error: '❌ Usuario no identificado',
                };
            }

            const cupon = await this.obtenerCuponPorId(cuponId);

            if (!cupon) {
                return {
                    success: false,
                    error: '❌ Cupón no encontrado',
                };
            }

            // ============================================================
            // ✅ VALIDACIONES MEJORADAS (FECHAS, ACTIVO, ETC)
            // ============================================================

            const ahora = new Date();
            const fechaInicio = new Date(cupon.fecha_inicio);
            const fechaExpiracion = new Date(cupon.fecha_expiracion);

            // 1. Verificar si el cupón está inactivo
            if (!cupon.activo) {
                return {
                    success: false,
                    error: '❌ El cupón está desactivado. Actívalo desde el panel de admin.',
                };
            }

            // 2. Verificar si la fecha de inicio es inválida
            if (isNaN(fechaInicio.getTime())) {
                return {
                    success: false,
                    error: '❌ Fecha de inicio del cupón inválida',
                };
            }

            // 3. Verificar si la fecha de expiración es inválida
            if (isNaN(fechaExpiracion.getTime())) {
                return {
                    success: false,
                    error: '❌ Fecha de expiración del cupón inválida',
                };
            }

            // 4. Verificar si el cupón aún no comenzó
            if (ahora < fechaInicio) {
                const fechaFormateada = fechaInicio.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                return {
                    success: false,
                    error: `⏳ El cupón estará disponible a partir del ${fechaFormateada}`,
                };
            }

            // 5. Verificar si el cupón ya expiró
            if (ahora > fechaExpiracion) {
                const fechaFormateada = fechaExpiracion.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                return {
                    success: false,
                    error: `⏰ El cupón expiró el ${fechaFormateada}`,
                };
            }

            // ----------------------------------------------------
            // Verificar si ya existe
            // ----------------------------------------------------

            const {
                data: existente,
                error: existenteError,
            } = await supabase
                .from('cupones_usuarios')
                .select(`
                    id,
                    cantidad_usos,
                    usado_en_pedido
                `)
                .eq('cupon_id', cuponId)
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (existenteError) {
                throw existenteError;
            }

            // ----------------------------------------------------
            // Ya existe
            // ----------------------------------------------------

            if (existente) {
                if (existente.usado_en_pedido) {
                    return {
                        success: false,
                        error: '❌ Este cupón ya fue utilizado por el usuario',
                    };
                }

                if (
                    cupon.cantidad_maxima > 0 &&
                    existente.cantidad_usos >= cupon.cantidad_maxima
                ) {
                    return {
                        success: false,
                        error: '⚠️ El usuario ya alcanzó el límite de este cupón',
                    };
                }

                // ✅ El usuario ya tiene el cupón asignado (pero no usado)
                return {
                    success: true,
                    yaAsignado: true,
                };
            }

            // ----------------------------------------------------
            // Límite global
            // ----------------------------------------------------

            if (
                cupon.usos_maximos !== null &&
                cupon.usos_totales >= cupon.usos_maximos
            ) {
                return {
                    success: false,
                    error: '❌ Cupón agotado (límite global alcanzado)',
                };
            }

            // ----------------------------------------------------
            // Generar código interno
            // ----------------------------------------------------

            const codigoCanje = this.generarCodigoCanje(usuarioId, cuponId);

            const {
                error: insertError,
            } = await supabase
                .from('cupones_usuarios')
                .insert({
                    cupon_id: cuponId,
                    usuario_id: usuarioId,
                    codigo_canje: codigoCanje,
                    cantidad_usos: 0,
                    fecha_canje: null,
                    usado_en_pedido: false,
                    pedido_id: null,
                });

            if (insertError) {
                throw insertError;
            }

            return {
                success: true,
                yaAsignado: false,
            };

        } catch (error: any) {
            console.error('❌ Error asignando cupón:', error);

            // ✅ Manejo de errores mejorado con mensajes amigables
            let mensajeError = '❌ No se pudo asignar el cupón';

            if (error?.message) {
                const msg = error.message.toLowerCase();
                if (msg.includes('expir') || msg.includes('expired')) {
                    mensajeError = '⏰ Este cupón ya expiró';
                } else if (msg.includes('inactivo') || msg.includes('activo') || msg.includes('active')) {
                    mensajeError = '❌ El cupón está desactivado';
                } else if (msg.includes('límite') || msg.includes('limit')) {
                    mensajeError = '❌ El cupón alcanzó su límite de usos';
                } else if (msg.includes('duplicate') || msg.includes('unique')) {
                    mensajeError = 'ℹ️ Este cupón ya fue asignado a este usuario';
                } else {
                    mensajeError = error.message;
                }
            }

            return {
                success: false,
                error: mensajeError,
            };
        }
    },

    // ============================================================
    // 🔄 CANJEAR / RESERVAR CUPÓN
    // ============================================================

    async canjearCupon(datos: CanjearCuponDTO): Promise<ResultadoCanje> {
        try {
            console.log('🎟️ Iniciando canje/reserva:', {
                codigo: datos.codigo,
                usuarioId: datos.usuarioId,
                pedidoId: datos.pedidoId,
            });

            if (!datos.usuarioId) {
                return {
                    success: false,
                    mensaje: 'Usuario no identificado',
                };
            }

            const codigo = datos.codigo?.trim().toUpperCase();

            if (!codigo) {
                return {
                    success: false,
                    mensaje: 'Ingresá un código de cupón',
                };
            }

            const cupon = await this.obtenerCuponPorCodigo(codigo);

            if (!cupon) {
                return {
                    success: false,
                    mensaje: 'Cupón no encontrado',
                };
            }

            const validacion = this.validarDatosBasicosCupon(cupon);

            if (!validacion.valido) {
                return {
                    success: false,
                    mensaje: validacion.mensaje || 'Cupón no válido',
                };
            }

            if (
                cupon.usos_maximos !== null &&
                cupon.usos_totales >= cupon.usos_maximos
            ) {
                return {
                    success: false,
                    mensaje: 'Este cupón ya alcanzó su límite de usos',
                };
            }

            const {
                data: cuponUsuario,
                error: cuponUsuarioError,
            } = await supabase
                .from('cupones_usuarios')
                .select(`
                    id,
                    cantidad_usos,
                    usado_en_pedido,
                    pedido_id
                `)
                .eq('cupon_id', cupon.id)
                .eq('usuario_id', datos.usuarioId)
                .maybeSingle();

            if (cuponUsuarioError) {
                throw cuponUsuarioError;
            }

            if (cuponUsuario?.usado_en_pedido) {
                return {
                    success: false,
                    mensaje: 'Este cupón ya fue utilizado',
                };
            }

            if (cuponUsuario) {
                if (
                    cupon.cantidad_maxima > 0 &&
                    cuponUsuario.cantidad_usos >= cupon.cantidad_maxima
                ) {
                    return {
                        success: false,
                        mensaje: 'Ya alcanzaste el límite de usos de este cupón',
                    };
                }

                console.log('ℹ️ El usuario ya tenía el cupón asignado');

            } else {
                const codigoCanje = this.generarCodigoCanje(datos.usuarioId, cupon.id);

                const {
                    error: insertError,
                } = await supabase
                    .from('cupones_usuarios')
                    .insert({
                        cupon_id: cupon.id,
                        usuario_id: datos.usuarioId,
                        codigo_canje: codigoCanje,
                        cantidad_usos: 0,
                        fecha_canje: null,
                        usado_en_pedido: false,
                        pedido_id: null,
                    });

                if (insertError) {
                    throw insertError;
                }
            }

            let productoGratis: { id: number; nombre: string } | null = null;

            if (
                cupon.tipo === 'producto_gratis' &&
                cupon.producto_id
            ) {
                const {
                    data: producto,
                    error: productoError,
                } = await supabase
                    .from('productos')
                    .select('id, nombre')
                    .eq('id', cupon.producto_id)
                    .maybeSingle();

                if (productoError) {
                    console.error('⚠️ Error obteniendo producto gratis:', productoError);
                }

                if (producto) {
                    productoGratis = producto;
                }
            }

            let descuentoAplicado: number | null = null;

            if (
                cupon.tipo === 'descuento' &&
                cupon.valor_descuento !== null &&
                cupon.valor_descuento !== undefined
            ) {
                descuentoAplicado = Number(cupon.valor_descuento);
            }

            console.log('✅ Cupón reservado correctamente:', {
                cuponId: cupon.id,
                codigo: cupon.codigo,
                tipo: cupon.tipo,
            });

            return {
                success: true,
                mensaje: '¡Cupón canjeado exitosamente!',
                cupon,
                descuento_aplicado: descuentoAplicado ?? undefined,
                producto_gratis: productoGratis ?? undefined,
            };

        } catch (error: any) {
            console.error('❌ Error canjeando cupón:', error);
            return {
                success: false,
                mensaje: typeof error?.message === 'string'
                    ? error.message
                    : 'Error al canjear cupón',
            };
        }
    },

    // ============================================================
    // 🛒 FINALIZAR CUPÓN CON PEDIDO
    // ============================================================

    async finalizarCuponPedido(
        cuponId: number,
        usuarioId: string,
        pedidoId: number
    ): Promise<{
        success: boolean;
        mensaje: string;
        descuento?: number;
        envio_gratis?: boolean;
        producto_gratis?: {
            id: number;
            nombre: string;
        } | null;
    }> {
        try {
            if (!cuponId) {
                return {
                    success: false,
                    mensaje: 'Cupón no identificado',
                };
            }

            if (!usuarioId) {
                return {
                    success: false,
                    mensaje: 'Usuario no identificado',
                };
            }

            if (!pedidoId) {
                return {
                    success: false,
                    mensaje: 'Pedido no identificado',
                };
            }

            console.log('🎟️ Finalizando cupón con pedido:', {
                cuponId,
                usuarioId,
                pedidoId,
            });

            const {
                data,
                error,
            } = await supabase.rpc(
                'finalizar_cupon_pedido',
                {
                    p_cupon_id: cuponId,
                    p_usuario_id: usuarioId,
                    p_pedido_id: pedidoId,
                }
            );

            if (error) {
                console.error('❌ Error finalizando cupón:', error);
                return {
                    success: false,
                    mensaje: error.message || 'No se pudo aplicar el cupón al pedido',
                };
            }

            if (!data) {
                return {
                    success: false,
                    mensaje: 'El servidor no devolvió el resultado',
                };
            }

            const resultado = data as {
                success?: boolean;
                mensaje?: string;
                descuento?: number;
                envio_gratis?: boolean;
                producto_gratis?: {
                    id: number;
                    nombre: string;
                } | null;
            };

            console.log('✅ Cupón finalizado:', resultado);

            return {
                success: Boolean(resultado.success),
                mensaje: resultado.mensaje || 'Cupón aplicado al pedido',
                descuento: Number(resultado.descuento || 0),
                envio_gratis: Boolean(resultado.envio_gratis),
                producto_gratis: resultado.producto_gratis ?? null,
            };

        } catch (error: any) {
            console.error('❌ Error finalizando cupón:', error);
            return {
                success: false,
                mensaje: error?.message || 'Error al finalizar el cupón',
            };
        }
    },

    // ============================================================
    // ❌ LIBERAR CUPÓN RESERVADO
    // ============================================================

    async liberarCuponReservado(
        cuponId: number,
        usuarioId: string
    ): Promise<{
        success: boolean;
        mensaje: string;
    }> {
        try {
            if (!cuponId || !usuarioId) {
                return {
                    success: false,
                    mensaje: 'Datos del cupón incompletos',
                };
            }

            const {
                data,
                error,
            } = await supabase
                .from('cupones_usuarios')
                .select(`
                    id,
                    cantidad_usos,
                    usado_en_pedido,
                    pedido_id
                `)
                .eq('cupon_id', cuponId)
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                return {
                    success: true,
                    mensaje: 'No había cupón reservado',
                };
            }

            if (data.usado_en_pedido) {
                return {
                    success: false,
                    mensaje: 'El cupón ya fue utilizado y no puede liberarse',
                };
            }

            if (Number(data.cantidad_usos || 0) > 0) {
                return {
                    success: false,
                    mensaje: 'El cupón ya tiene un uso registrado',
                };
            }

            const {
                error: deleteError,
            } = await supabase
                .from('cupones_usuarios')
                .delete()
                .eq('id', data.id)
                .eq('usuario_id', usuarioId);

            if (deleteError) {
                throw deleteError;
            }

            return {
                success: true,
                mensaje: 'Cupón liberado correctamente',
            };

        } catch (error: any) {
            console.error('❌ Error liberando cupón:', error);
            return {
                success: false,
                mensaje: error?.message || 'No se pudo liberar el cupón',
            };
        }
    },

    // ============================================================
    // ✅ VALIDAR CUPÓN
    // ============================================================

    async validarCupon(cupon: Cupon, usuarioId: string): Promise<ValidacionCupon> {
        try {
            if (!usuarioId) {
                return {
                    valido: false,
                    mensaje: 'Usuario no identificado',
                };
            }

            const validacion = this.validarDatosBasicosCupon(cupon);

            if (!validacion.valido) {
                return {
                    valido: false,
                    mensaje: validacion.mensaje || 'Cupón no válido',
                };
            }

            if (
                cupon.usos_maximos !== null &&
                cupon.usos_totales >= cupon.usos_maximos
            ) {
                return {
                    valido: false,
                    mensaje: 'Este cupón ya alcanzó su límite de usos',
                };
            }

            const {
                data,
                error,
            } = await supabase
                .from('cupones_usuarios')
                .select(`
                    cantidad_usos,
                    usado_en_pedido
                `)
                .eq('cupon_id', cupon.id)
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (data?.usado_en_pedido) {
                return {
                    valido: false,
                    mensaje: 'Este cupón ya fue utilizado',
                };
            }

            if (
                data &&
                cupon.cantidad_maxima > 0 &&
                data.cantidad_usos >= cupon.cantidad_maxima
            ) {
                return {
                    valido: false,
                    mensaje: 'Ya alcanzaste el límite de usos de este cupón',
                };
            }

            return {
                valido: true,
            };

        } catch (error: any) {
            console.error('❌ Error validando cupón:', error);
            return {
                valido: false,
                mensaje: typeof error?.message === 'string'
                    ? error.message
                    : 'No se pudo validar el cupón',
            };
        }
    },

    // ============================================================
    // 🔒 VALIDACIONES INTERNAS (MEJORADAS CON MENSAJES CLAROS)
    // ============================================================

    validarDatosBasicosCupon(cupon: Cupon): ValidacionCupon {
        if (!cupon.activo) {
            return {
                valido: false,
                mensaje: '❌ El cupón está desactivado. Actívalo desde el panel de admin.',
            };
        }

        const ahora = new Date();
        const inicio = new Date(cupon.fecha_inicio);
        const expiracion = new Date(cupon.fecha_expiracion);

        if (Number.isNaN(inicio.getTime())) {
            return {
                valido: false,
                mensaje: '❌ Fecha de inicio del cupón inválida',
            };
        }

        if (Number.isNaN(expiracion.getTime())) {
            return {
                valido: false,
                mensaje: '❌ Fecha de expiración del cupón inválida',
            };
        }

        if (ahora < inicio) {
            const fechaFormateada = inicio.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            return {
                valido: false,
                mensaje: `⏳ El cupón estará disponible a partir del ${fechaFormateada}`,
            };
        }

        if (ahora > expiracion) {
            const fechaFormateada = expiracion.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            return {
                valido: false,
                mensaje: `⏰ El cupón expiró el ${fechaFormateada}`,
            };
        }

        return {
            valido: true,
        };
    },

    // ============================================================
    // 🔧 GENERAR CÓDIGO ÚNICO
    // ============================================================

    async generarCodigoUnico(): Promise<string> {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const MAX_INTENTOS = 50;

        for (let intento = 0; intento < MAX_INTENTOS; intento++) {
            let codigo = '';
            for (let i = 0; i < 8; i++) {
                codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }
            codigo = `KB${codigo}`;

            const {
                data,
                error,
            } = await supabase
                .from('cupones')
                .select('id')
                .eq('codigo', codigo)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                return codigo;
            }
        }

        throw new Error('No se pudo generar un código único');
    },

    // ============================================================
    // 🔐 CÓDIGO INTERNO DE CANJE
    // ============================================================

    generarCodigoCanje(usuarioId: string, cuponId: number): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const usuarioCorto = usuarioId.replace(/-/g, '').substring(0, 6).toUpperCase();
        return `CJ-${usuarioCorto}-${cuponId}-${timestamp}-${random}`;
    },

    // ============================================================
    // 💰 FORMATEAR DESCUENTO
    // ============================================================

    formatearDescuento(cupon: Cupon): string {
        if (cupon.tipo === 'envio_gratis') {
            return 'Envío gratis';
        }

        if (cupon.tipo === 'producto_gratis') {
            return 'Producto gratis';
        }

        if (cupon.tipo === '2x1') {
            return '2x1';
        }

        if (cupon.valor_descuento === null || cupon.valor_descuento === undefined) {
            return 'Gratis';
        }

        if (cupon.es_porcentaje) {
            return `${cupon.valor_descuento}% OFF`;
        }

        return `$${Number(cupon.valor_descuento).toFixed(2)} OFF`;
    },
};