// ============================================================
// CONFIGURACIÓN - Apunta a Supabase Edge Functions
// ============================================================

const SUPABASE_URL = 'https://nurhcmttnwankriplcwv.supabase.co'
const FUNCTION_NAME = 'pagos'

// ============================================================
// TIPOS
// ============================================================

export interface RespuestaPago {
    exito: boolean
    idPreferencia?: string
    urlPago?: string
    urlPruebas?: string
    error?: string
}

export interface RespuestaEstado {
    exito: boolean
    datos?: {
        estado: string
        mp_estado: string | null
        mp_detalle_estado: string | null
        mp_preference_id: string
    }
    error?: string
}

export interface DatosCrearPago {
    items: {
        producto_id: number
        nombre: string
        cantidad: number
        precio_unitario: number
        total: number
        descripcion?: string
        imagen?: string
    }[]
    pedidoId: number
    usuarioId: string
    total: number
    correo: string
    nombre?: string
    telefono?: string
}

// ============================================================
// SERVICIO DE PAGOS
// ============================================================

export const servicioPagos = {

    /**
     * Crear preferencia de pago en Mercado Pago
     */
    async crearPreferencia(datos: DatosCrearPago): Promise<RespuestaPago> {
        try {
            console.log('💳 Creando preferencia de pago...')

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}/crear-preferencia`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(datos),
                }
            )

            const resultado = await response.json()

            if (!response.ok) {
                console.error('❌ Error en pago:', resultado)
                return {
                    exito: false,
                    error: resultado.error || 'Error al crear preferencia de pago',
                }
            }

            console.log('✅ Preferencia creada:', resultado)
            return resultado
        } catch (error: any) {
            console.error('❌ Error en servicioPagos.crearPreferencia:', error)
            return {
                exito: false,
                error: error.message || 'Error de conexión con el servidor',
            }
        }
    },

    /**
     * Verificar estado de un pago
     */
    async verificarEstado(pedidoId: number): Promise<RespuestaEstado> {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}/estado?pedidoId=${pedidoId}`
            )

            const resultado = await response.json()

            if (!response.ok) {
                return {
                    exito: false,
                    error: resultado.error || 'Error al verificar estado del pago',
                }
            }

            return resultado
        } catch (error: any) {
            console.error('❌ Error verificando estado:', error)
            return {
                exito: false,
                error: error.message || 'Error de conexión con el servidor',
            }
        }
    },
}