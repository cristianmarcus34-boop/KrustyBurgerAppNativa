// lib/cupones/cuponService.ts
import { supabase } from '../supabase';
import { Cupon, CuponUsuario, CrearCuponDTO, CanjearCuponDTO, ResultadoCanje, TipoCupon } from './cuponTypes';

export const cuponService = {

    // ============================================================
    // 📋 CRUD DE CUPONES (ADMIN)
    // ============================================================

    // ✅ Obtener todos los cupones
    async obtenerCupones(activo?: boolean): Promise<Cupon[]> {
        try {
            let query = supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(id, nombre, precio, imagen),
                    imagenes:cupones_imagenes(imagen_url, es_principal)
                `)
                .order('created_at', { ascending: false });

            if (activo !== undefined) {
                query = query.eq('activo', activo);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo cupones:', error);
            return [];
        }
    },

    // ✅ Obtener un cupón por ID
    async obtenerCuponPorId(id: number): Promise<Cupon | null> {
        try {
            const { data, error } = await supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(id, nombre, precio, imagen),
                    imagenes:cupones_imagenes(imagen_url, es_principal)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo cupón:', error);
            return null;
        }
    },

    // ✅ Obtener un cupón por código
    async obtenerCuponPorCodigo(codigo: string): Promise<Cupon | null> {
        try {
            const { data, error } = await supabase
                .from('cupones')
                .select(`
                    *,
                    producto:productos(id, nombre, precio, imagen)
                `)
                .eq('codigo', codigo)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo cupón por código:', error);
            return null;
        }
    },

    // ✅ Crear un cupón
    async crearCupon(datos: CrearCuponDTO): Promise<{ success: boolean; data?: Cupon; error?: string }> {
        try {
            // ✅ Generar código único
            const codigo = await this.generarCodigoUnico();

            const { data, error } = await supabase
                .from('cupones')
                .insert({
                    codigo,
                    titulo: datos.titulo,
                    descripcion: datos.descripcion || null,
                    tipo: datos.tipo,
                    valor_descuento: datos.valor_descuento || null,
                    es_porcentaje: datos.es_porcentaje !== undefined ? datos.es_porcentaje : true,
                    producto_id: datos.producto_id || null,
                    cantidad_maxima: datos.cantidad_maxima || 1,
                    usos_maximos: datos.usos_maximos || null,
                    fecha_inicio: datos.fecha_inicio,
                    fecha_expiracion: datos.fecha_expiracion,
                    activo: datos.activo !== undefined ? datos.activo : true,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('Error creando cupón:', error);
            return { success: false, error: error.message };
        }
    },

    // ✅ Actualizar un cupón
    async actualizarCupon(id: number, datos: Partial<CrearCuponDTO>): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .update({
                    ...datos,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error actualizando cupón:', error);
            return { success: false, error: error.message };
        }
    },

    // ✅ Eliminar un cupón (soft delete)
    async eliminarCupon(id: number): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .update({ activo: false, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error eliminando cupón:', error);
            return { success: false, error: error.message };
        }
    },

    // ✅ Eliminar permanentemente un cupón
    async eliminarCuponPermanente(id: number): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('cupones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error eliminando cupón permanentemente:', error);
            return { success: false, error: error.message };
        }
    },

    // ============================================================
    // 👤 CUPONES DE USUARIOS
    // ============================================================

    // ✅ Obtener cupones de un usuario
    async obtenerCuponesUsuario(usuarioId: string): Promise<CuponUsuario[]> {
        try {
            const { data, error } = await supabase
                .from('cupones_usuarios')
                .select(`
                    *,
                    cupon:cupones(*, producto:productos(id, nombre, precio, imagen))
                `)
                .eq('usuario_id', usuarioId)
                .order('fecha_canje', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo cupones del usuario:', error);
            return [];
        }
    },

    // ✅ Obtener cupones disponibles para un usuario (no usados, no expirados)
    async obtenerCuponesDisponibles(usuarioId: string): Promise<CuponUsuario[]> {
        try {
            const ahora = new Date().toISOString();
            const { data, error } = await supabase
                .from('cupones_usuarios')
                .select(`
                    *,
                    cupon:cupones!inner(
                        *,
                        producto:productos(id, nombre, precio, imagen)
                    )
                `)
                .eq('usuario_id', usuarioId)
                .eq('usado_en_pedido', false)
                .lt('cupon.fecha_inicio', ahora)
                .gt('cupon.fecha_expiracion', ahora)
                .eq('cupon.activo', true)
                .order('fecha_canje', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo cupones disponibles:', error);
            return [];
        }
    },

    // ✅ Asignar cupón a usuario
    async asignarCuponAUsuario(cuponId: number, usuarioId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // ✅ Verificar que el cupón existe y está activo
            const cupon = await this.obtenerCuponPorId(cuponId);
            if (!cupon) {
                return { success: false, error: 'Cupón no encontrado' };
            }

            if (!cupon.activo) {
                return { success: false, error: 'Cupón no está activo' };
            }

            // ✅ Verificar límite de usos totales
            if (cupon.usos_maximos && cupon.usos_totales >= cupon.usos_maximos) {
                return { success: false, error: 'Cupón agotado' };
            }

            // ✅ Verificar si el usuario ya tiene este cupón
            const { data: existente, error: existenteError } = await supabase
                .from('cupones_usuarios')
                .select('id, cantidad_usos')
                .eq('cupon_id', cuponId)
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (existenteError) throw existenteError;

            if (existente) {
                // ✅ Si ya lo tiene, verificar límite por usuario
                if (existente.cantidad_usos >= cupon.cantidad_maxima) {
                    return { success: false, error: 'Ya alcanzaste el límite de este cupón' };
                }

                // ✅ Incrementar usos
                const { error: updateError } = await supabase
                    .from('cupones_usuarios')
                    .update({
                        cantidad_usos: existente.cantidad_usos + 1,
                        fecha_canje: new Date().toISOString(),
                    })
                    .eq('id', existente.id);

                if (updateError) throw updateError;
            } else {
                // ✅ Crear nuevo registro
                const codigoCanje = this.generarCodigoCanje(usuarioId, cuponId);
                const { error: insertError } = await supabase
                    .from('cupones_usuarios')
                    .insert({
                        cupon_id: cuponId,
                        usuario_id: usuarioId,
                        codigo_canje: codigoCanje,
                        cantidad_usos: 1,
                    });

                if (insertError) throw insertError;
            }

            // ✅ Actualizar usos totales del cupón
            await supabase
                .from('cupones')
                .update({ usos_totales: cupon.usos_totales + 1 })
                .eq('id', cuponId);

            return { success: true };
        } catch (error: any) {
            console.error('Error asignando cupón a usuario:', error);
            return { success: false, error: error.message };
        }
    },

    // ============================================================
    // 🔄 CANJE DE CUPONES
    // ============================================================

    // ✅ Canjear cupón (por código QR o manual)
    async canjearCupon(datos: CanjearCuponDTO): Promise<ResultadoCanje> {
        try {
            // ✅ 1. Buscar el cupón por código
            const cupon = await this.obtenerCuponPorCodigo(datos.codigo);
            if (!cupon) {
                return { success: false, mensaje: 'Cupón no encontrado' };
            }

            // ✅ 2. Validar cupón
            const validacion = await this.validarCupon(cupon, datos.usuarioId);
            if (!validacion.valido) {
                return { success: false, mensaje: validacion.mensaje || 'Cupón no válido' };
            }

            // ✅ 3. Verificar si el usuario ya tiene/canjó este cupón
            const { data: canjeExistente, error: canjeError } = await supabase
                .from('cupones_usuarios')
                .select('id, usado_en_pedido, cantidad_usos')
                .eq('cupon_id', cupon.id)
                .eq('usuario_id', datos.usuarioId)
                .maybeSingle();

            if (canjeError) throw canjeError;

            let cuponUsuarioId: number;

            if (canjeExistente) {
                // ✅ Ya tiene el cupón, verificamos si ya lo usó
                if (canjeExistente.usado_en_pedido) {
                    return { success: false, mensaje: 'Este cupón ya fue utilizado' };
                }
                if (canjeExistente.cantidad_usos >= cupon.cantidad_maxima) {
                    return { success: false, mensaje: 'Ya alcanzaste el límite de usos de este cupón' };
                }
                cuponUsuarioId = canjeExistente.id;
            } else {
                // ✅ Asignar cupón al usuario
                const asignacion = await this.asignarCuponAUsuario(cupon.id, datos.usuarioId);
                if (!asignacion.success) {
                    return { success: false, mensaje: asignacion.error || 'Error al asignar cupón' };
                }

                // ✅ Obtener el ID del nuevo registro
                const { data: nuevoCanje, error: nuevoError } = await supabase
                    .from('cupones_usuarios')
                    .select('id')
                    .eq('cupon_id', cupon.id)
                    .eq('usuario_id', datos.usuarioId)
                    .single();

                if (nuevoError) throw nuevoError;
                cuponUsuarioId = nuevoCanje.id;
            }

            // ✅ 4. Calcular descuento
            let descuentoAplicado = 0;
            let productoGratis = null;

            switch (cupon.tipo) {
                case 'descuento':
                    if (cupon.es_porcentaje) {
                        // Porcentaje: necesitamos el total del pedido
                        // Se calculará en el checkout
                        descuentoAplicado = cupon.valor_descuento || 0;
                    } else {
                        descuentoAplicado = cupon.valor_descuento || 0;
                    }
                    break;
                case 'producto_gratis':
                    if (cupon.producto) {
                        productoGratis = {
                            id: cupon.producto.id,
                            nombre: cupon.producto.nombre,
                        };
                    }
                    break;
                case 'envio_gratis':
                    // Se aplicará en el checkout
                    break;
                case '2x1':
                    // Se aplicará en el checkout
                    break;
            }

            // ✅ 5. Marcar como usado en pedido si aplica
            if (datos.pedidoId) {
                await supabase
                    .from('cupones_usuarios')
                    .update({
                        usado_en_pedido: true,
                        pedido_id: datos.pedidoId,
                    })
                    .eq('id', cuponUsuarioId);
            }

            return {
                success: true,
                mensaje: '¡Cupón canjeado exitosamente!',
                cupon,
                descuento_aplicado: descuentoAplicado > 0 ? descuentoAplicado : undefined,
                producto_gratis: productoGratis || undefined,
            };
        } catch (error: any) {
            console.error('Error canjeando cupón:', error);
            return { success: false, mensaje: error.message || 'Error al canjear cupón' };
        }
    },

    // ============================================================
    // ✅ VALIDACIÓN DE CUPONES
    // ============================================================

    async validarCupon(cupon: Cupon, usuarioId: string): Promise<{ valido: boolean; mensaje?: string }> {
        const ahora = new Date();

        // ✅ Verificar si está activo
        if (!cupon.activo) {
            return { valido: false, mensaje: 'Cupón no está activo' };
        }

        // ✅ Verificar fechas
        const inicio = new Date(cupon.fecha_inicio);
        const expiracion = new Date(cupon.fecha_expiracion);

        if (ahora < inicio) {
            return { valido: false, mensaje: 'Cupón aún no disponible' };
        }

        if (ahora > expiracion) {
            return { valido: false, mensaje: 'Cupón expirado' };
        }

        // ✅ Verificar usos totales
        if (cupon.usos_maximos && cupon.usos_totales >= cupon.usos_maximos) {
            return { valido: false, mensaje: 'Cupón agotado' };
        }

        // ✅ Verificar si el usuario ya lo usó (límite por usuario)
        if (cupon.cantidad_maxima > 0) {
            const { data, error } = await supabase
                .from('cupones_usuarios')
                .select('cantidad_usos')
                .eq('cupon_id', cupon.id)
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            if (error) throw error;

            if (data && data.cantidad_usos >= cupon.cantidad_maxima) {
                return { valido: false, mensaje: 'Ya alcanzaste el límite de usos de este cupón' };
            }
        }

        return { valido: true };
    },

    // ============================================================
    // 🔧 UTILIDADES
    // ============================================================

    // ✅ Generar código único
    async generarCodigoUnico(): Promise<string> {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo: string = ''; // ✅ Inicializamos con string vacío
        let existe = true;

        while (existe) {
            codigo = '';
            for (let i = 0; i < 8; i++) {
                codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }
            // Añadir prefijo KB (Krusty Burger)
            codigo = `KB${codigo}`;

            const { data } = await supabase
                .from('cupones')
                .select('id')
                .eq('codigo', codigo)
                .maybeSingle();

            existe = !!data;
        }

        return codigo;
    },

    // ✅ Generar código de canje único
    generarCodigoCanje(usuarioId: string, cuponId: number): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `CJ${usuarioId.substring(0, 4)}${cuponId}${timestamp}${random}`;
    },

    // ✅ Formatear descuento para mostrar
    formatearDescuento(cupon: Cupon): string {
        if (!cupon.valor_descuento) return 'Gratis';

        if (cupon.tipo === 'envio_gratis') {
            return 'Envío gratis';
        }

        if (cupon.tipo === 'producto_gratis') {
            return 'Producto gratis';
        }

        if (cupon.tipo === '2x1') {
            return '2x1';
        }

        if (cupon.es_porcentaje) {
            return `${cupon.valor_descuento}% OFF`;
        }

        return `$${cupon.valor_descuento.toFixed(2)} OFF`;
    },
};