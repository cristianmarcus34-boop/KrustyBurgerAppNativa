// deno-lint-ignore-file no-import-prefix

// ✅ AHORA USA EL ALIAS "std/"
import { serve } from 'https://raw.githubusercontent.com/denoland/deno_std/0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// TIPOS
// ============================================================

interface ItemPago {
    producto_id: number
    nombre: string
    cantidad: number
    precio_unitario: number
    total: number
    descripcion?: string
    imagen?: string
}

interface DatosCrearPreferencia {
    items: ItemPago[]
    pedidoId: number
    usuarioId: string
    total: number
    correo: string
    nombre?: string
    telefono?: string
}

interface WebhookPayload {
    id: string
    topic: 'payment' | 'merchant_order'
    action?: string
    date_created?: string
    user_id?: string
    api_version?: string
}

interface RespuestaAPI {
    exito: boolean
    error?: string
    idPreferencia?: string
    urlPago?: string
    urlPruebas?: string
    datos?: {
        estado: string
        mp_estado?: string | null
        mp_detalle_estado?: string | null
        mp_preference_id?: string | null
    }
    mensaje?: string
}

// ============================================================
// CONFIGURACIÓN
// ============================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? ''
const urlApp = Deno.env.get('URL_APP') ?? 'https://www.krustyburger.com.ar'

console.log('🚀 Función de pagos iniciada')

// ============================================================
// UTILIDADES
// ============================================================

function _mapearEstado(mpStatus: string): string {
    const map: Record<string, string> = {
        'approved': 'aprobado',
        'pending': 'pendiente',
        'in_process': 'pendiente',
        'in_mediation': 'pendiente',
        'rejected': 'rechazado',
        'cancelled': 'cancelado',
        'refunded': 'rechazado',
        'charged_back': 'rechazado',
    }
    return map[mpStatus] || 'pendiente'
}

// ============================================================
// 1. WEBHOOK
// ============================================================

async function manejarWebhook(body: WebhookPayload): Promise<RespuestaAPI> {
    console.log('🔔 Webhook recibido:', JSON.stringify(body, null, 2))

    const { id, topic } = body

    if (topic === 'payment') {
        const { data: transaccion, error: findError } = await supabase
            .from('transacciones')
            .select('*')
            .eq('mp_payment_id', id)
            .single()

        if (findError || !transaccion) {
            console.log('⚠️ Transacción no encontrada para payment:', id)
            return { exito: false, error: 'Transacción no encontrada' }
        }

        const { error: updateError } = await supabase
            .from('transacciones')
            .update({
                mp_estado: 'approved',
                mp_detalle_estado: 'approved',
                estado: 'aprobado',
                webhook_recibido: true,
                fecha_pago: new Date().toISOString()
            })
            .eq('id', transaccion.id)

        if (updateError) {
            console.error('❌ Error actualizando:', updateError)
            return { exito: false, error: updateError.message }
        }

        console.log(`✅ Pago actualizado: ${id} → aprobado`)
        return { exito: true }
    }

    return { exito: true, mensaje: 'Topic no procesado' }
}

// ============================================================
// 2. CREAR PREFERENCIA
// ============================================================

async function crearPreferencia(datos: DatosCrearPreferencia): Promise<RespuestaAPI> {
    try {
        console.log('💳 Creando preferencia de pago...')
        console.log('📦 Datos:', JSON.stringify(datos, null, 2))

        const { items, pedidoId, usuarioId, total, correo, nombre, telefono } = datos

        if (!items || !items.length) {
            return { exito: false, error: 'Se requiere al menos un item' }
        }
        if (!pedidoId || !usuarioId) {
            return { exito: false, error: 'pedidoId y usuarioId son requeridos' }
        }
        if (!correo) {
            return { exito: false, error: 'Correo del cliente es requerido' }
        }

        const preferenceData = {
            items: items.map((item: ItemPago) => ({
                id: item.producto_id?.toString() || `item_${Date.now()}`,
                title: item.nombre || 'Producto Krusty Burger',
                description: item.descripcion || 'Producto de Krusty Burger',
                quantity: Number(item.cantidad) || 1,
                unit_price: Number(item.precio_unitario) || 0,
                currency_id: 'ARS',
                picture_url: item.imagen || null,
                category_id: 'food',
            })),
            payer: {
                name: nombre || 'Cliente',
                email: correo || 'cliente@krustyburger.com',
                phone: { number: telefono || '0000000000' },
            },
            back_urls: {
                success: `${urlApp}/pago-exitoso`,
                failure: `${urlApp}/pago-fallido`,
                pending: `${urlApp}/pago-pendiente`,
            },
            auto_return: 'approved',
            notification_url: `${supabaseUrl}/functions/v1/pagos/webhook`,
            external_reference: pedidoId.toString(),
            metadata: {
                pedido_id: pedidoId,
                usuario_id: usuarioId,
            },
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            payment_methods: {
                installments: 1,
                default_installments: 1,
            },
        }

        console.log('📤 Enviando a Mercado Pago...')

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('❌ Error MP:', result)
            return { exito: false, error: result.message || 'Error en Mercado Pago' }
        }

        console.log('✅ Preferencia creada en MP:', result.id)

        const { error: dbError } = await supabase
            .from('transacciones')
            .insert({
                usuario_id: usuarioId,
                pedido_id: pedidoId,
                mp_preference_id: result.id,
                monto_total: total,
                metodo_pago: 'transferencia',
                estado: 'pendiente',
                email_pagador: correo,
                nombre_pagador: nombre,
                telefono_pagador: telefono,
                metadata: { preference: result, items },
                fecha_expiracion: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            })

        if (dbError) {
            console.error('❌ Error guardando transacción:', dbError)
            return { exito: false, error: 'Error al guardar transacción' }
        }

        console.log('✅ Transacción guardada en Supabase')

        return {
            exito: true,
            idPreferencia: result.id,
            urlPago: result.init_point,
            urlPruebas: result.sandbox_init_point,
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('❌ Error en crearPreferencia:', errorMessage)
        return { exito: false, error: errorMessage }
    }
}

// ============================================================
// 3. VERIFICAR ESTADO
// ============================================================

async function verificarEstado(pedidoId: number): Promise<RespuestaAPI> {
    try {
        console.log('📊 Verificando estado del pedido:', pedidoId)

        const { data, error } = await supabase
            .from('transacciones')
            .select('estado, mp_estado, mp_detalle_estado, mp_preference_id')
            .eq('pedido_id', pedidoId)
            .single()

        if (error) {
            console.error('❌ Error consultando:', error)
            return { exito: false, error: error.message }
        }

        console.log('✅ Estado consultado:', data?.estado)
        return { exito: true, datos: data }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('❌ Error:', errorMessage)
        return { exito: false, error: errorMessage }
    }
}

// ============================================================
// 4. MANEJADOR PRINCIPAL
// ============================================================

serve(async (req: Request) => {
    try {
        const url = new URL(req.url)
        const path = url.pathname.split('/').pop()

        console.log(`📥 ${req.method} /${path}`)

        if (path === 'webhook') {
            if (req.method !== 'POST') {
                return new Response('Method not allowed', { status: 405 })
            }
            const body: WebhookPayload = await req.json()
            const resultado = await manejarWebhook(body)
            return new Response(JSON.stringify(resultado), {
                status: resultado.exito ? 200 : 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (path === 'crear-preferencia') {
            if (req.method !== 'POST') {
                return new Response('Method not allowed', { status: 405 })
            }
            const body: DatosCrearPreferencia = await req.json()
            const resultado = await crearPreferencia(body)
            return new Response(JSON.stringify(resultado), {
                status: resultado.exito ? 200 : 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (path === 'estado') {
            if (req.method !== 'GET') {
                return new Response('Method not allowed', { status: 405 })
            }
            const pedidoId = parseInt(url.searchParams.get('pedidoId') || '0')
            if (!pedidoId) {
                return new Response(JSON.stringify({
                    exito: false,
                    error: 'pedidoId es requerido'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                })
            }
            const resultado = await verificarEstado(pedidoId)
            return new Response(JSON.stringify(resultado), {
                status: resultado.exito ? 200 : 404,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (path === 'health') {
            return new Response(JSON.stringify({
                estado: 'OK',
                timestamp: new Date().toISOString(),
                servicio: 'KrustyBurger - Pagos (Supabase Edge)'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({
            error: 'Ruta no encontrada',
            rutas_disponibles: [
                '/webhook (POST)',
                '/crear-preferencia (POST)',
                '/estado?pedidoId=123 (GET)',
                '/health (GET)'
            ]
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('❌ Error en el servidor:', errorMessage)
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})