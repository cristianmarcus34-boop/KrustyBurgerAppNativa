import { create } from 'zustand'

export type EstadoTransaccion = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'expirado'

interface EstadoPagoStore {
    idPreferencia: string | null
    urlPago: string | null
    cargando: boolean
    error: string | null
    estadoPago: EstadoTransaccion | null

    setPreferencia: (id: string, url: string) => void
    setCargando: (cargando: boolean) => void
    setError: (error: string | null) => void
    setEstadoPago: (estado: EstadoTransaccion | null) => void
    reiniciar: () => void
}

export const tiendaPago = create<EstadoPagoStore>((set) => ({
    idPreferencia: null,
    urlPago: null,
    cargando: false,
    error: null,
    estadoPago: null,

    setPreferencia: (idPreferencia, urlPago) => set({ idPreferencia, urlPago }),
    setCargando: (cargando) => set({ cargando }),
    setError: (error) => set({ error }),
    setEstadoPago: (estadoPago) => set({ estadoPago }),
    reiniciar: () => set({
        idPreferencia: null,
        urlPago: null,
        cargando: false,
        error: null,
        estadoPago: null,
    }),
}))