// lib/cupones/cuponFisicoService.ts
import { supabase } from '../supabase';
import {
    CuponFisico,
    LoteCuponesFisicos,
    LoteResumen,
    GenerarLoteDTO,
} from './cuponFisicoTypes';

// ============================================================
// 🔐 GENERAR CÓDIGO HÍBRIDO
// ============================================================
const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I,O,0,1 para evitar confusión

const generarCodigoHibrido = (prefijo: string): string => {
    let random = '';
    for (let i = 0; i < 6; i++) {
        random += CARACTERES.charAt(Math.floor(Math.random() * CARACTERES.length));
    }
    return `${prefijo.toUpperCase()}-${random}`;
};

// ============================================================
// 🎟️ SERVICE
// ============================================================
export const cuponFisicoService = {

    /**
     * ✅ Genera un lote de N cupones físicos únicos.
     *
     * - Usa un bucle con verificación de duplicados en DB.
     * - Si un código ya existe (por colisión), genera otro.
     * - Inserta en una sola transacción (batch).
     */
    async generarLote(dto: GenerarLoteDTO): Promise<{
        success: boolean;
        lote?: LoteCuponesFisicos;
        cupones?: CuponFisico[];
        error?: string;
    }> {
        try {
            if (!dto.cupon_id) {
                return { success: false, error: 'Falta el cupón base' };
            }
            if (!dto.cantidad || dto.cantidad <= 0 || dto.cantidad > 5000) {
                return { success: false, error: 'Cantidad inválida (1-5000)' };
            }

            const prefijo = (dto.prefijo || 'KRU').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'KRU';

            // 1. Crear el lote
            const { data: lote, error: loteError } = await supabase
                .from('lotes_cupones_fisicos')
                .insert({
                    cupon_id: dto.cupon_id,
                    cantidad: dto.cantidad,
                    prefijo,
                    notas: dto.notas || null,
                    creado_por: (await supabase.auth.getUser()).data.user?.id ?? null,
                })
                .select()
                .single();

            if (loteError || !lote) {
                throw loteError || new Error('No se pudo crear el lote');
            }

            // 2. Generar códigos únicos (con verificación)
            const codigosUsados = new Set<string>();
            const codigos: string[] = [];

            for (let i = 0; i < dto.cantidad; i++) {
                let codigo = '';
                let intentos = 0;
                do {
                    codigo = generarCodigoHibrido(prefijo);
                    intentos++;
                    if (intentos > 100) {
                        throw new Error('No se pudo generar un código único tras 100 intentos');
                    }
                } while (codigosUsados.has(codigo));
                codigosUsados.add(codigo);
                codigos.push(codigo);
            }

            // 3. Verificar colisiones con la DB (en batch)
            const { data: existentes } = await supabase
                .from('cupones_fisicos')
                .select('codigo')
                .in('codigo', codigos);

            const setExistentes = new Set((existentes || []).map((c: any) => c.codigo));

            // Reemplazar los que ya existen
            for (let i = 0; i < codigos.length; i++) {
                let intentos = 0;
                while (setExistentes.has(codigos[i])) {
                    codigos[i] = generarCodigoHibrido(prefijo);
                    intentos++;
                    if (intentos > 100) {
                        throw new Error('Colisión de códigos persistente');
                    }
                }
            }

            // 4. Insertar en batch
            const filas = codigos.map((codigo, index) => ({
                lote_id: lote.id,
                cupon_id: dto.cupon_id,
                codigo,
                numero_en_lote: index + 1,
                estado: 'disponible' as const,
            }));

            const { data: cupones, error: cuponesError } = await supabase
                .from('cupones_fisicos')
                .insert(filas)
                .select();

            if (cuponesError || !cupones) {
                // Rollback manual del lote
                await supabase.from('lotes_cupones_fisicos').delete().eq('id', lote.id);
                throw cuponesError || new Error('No se pudieron crear los cupones');
            }

            return { success: true, lote, cupones };

        } catch (error: any) {
            console.error('❌ Error generando lote:', error);
            return {
                success: false,
                error: error?.message || 'Error al generar el lote',
            };
        }
    },

    /**
     * Lista todos los lotes con resumen.
     */
    async obtenerLotes(): Promise<LoteResumen[]> {
        try {
            const { data, error } = await supabase
                .from('vista_lotes_resumen')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            return (data || []) as LoteResumen[];
        } catch (error) {
            console.error('❌ Error obteniendo lotes:', error);
            return [];
        }
    },

    /**
     * Lista los cupones de un lote.
     */
    async obtenerCuponesDeLote(loteId: number): Promise<CuponFisico[]> {
        try {
            const { data, error } = await supabase
                .from('cupones_fisicos')
                .select('*')
                .eq('lote_id', loteId)
                .order('numero_en_lote', { ascending: true });

            if (error) throw error;
            return (data || []) as CuponFisico[];
        } catch (error) {
            console.error('❌ Error obteniendo cupones del lote:', error);
            return [];
        }
    },

    /**
     * Lista los cupones físicos de un cupón (plantilla).
     */
    async obtenerCuponesFisicosDeCupon(cuponId: number): Promise<CuponFisico[]> {
        try {
            const { data, error } = await supabase
                .from('cupones_fisicos')
                .select('*')
                .eq('cupon_id', cuponId)
                .order('creado_en', { ascending: false });

            if (error) throw error;
            return (data || []) as CuponFisico[];
        } catch (error) {
            console.error('❌ Error obteniendo cupones físicos:', error);
            return [];
        }
    },

    /**
     * Anula un cupón físico (NO se borra, solo se marca).
     */
    async anularCuponFisico(id: number, motivo: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('cupones_fisicos')
                .update({
                    estado: 'anulado',
                    anulado_en: new Date().toISOString(),
                    anulado_motivo: motivo || null,
                })
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error?.message || 'Error al anular' };
        }
    },

    /**
     * Marca un cupón físico como usado.
     */
    async marcarComoUsado(codigo: string, usuarioId?: string): Promise<{
        success: boolean;
        cupon?: CuponFisico;
        error?: string;
    }> {
        try {
            const { data, error } = await supabase
                .from('cupones_fisicos')
                .select('*')
                .eq('codigo', codigo.trim().toUpperCase())
                .maybeSingle();

            if (error) throw error;
            if (!data) return { success: false, error: 'Cupón no encontrado' };

            if (data.estado === 'usado') {
                return { success: false, error: 'Este cupón ya fue usado' };
            }
            if (data.estado === 'anulado') {
                return { success: false, error: 'Este cupón está anulado' };
            }

            const { error: updError } = await supabase
                .from('cupones_fisicos')
                .update({
                    estado: 'usado',
                    usado_en: new Date().toISOString(),
                    asignado_a: usuarioId || data.asignado_a,
                })
                .eq('id', data.id);

            if (updError) throw updError;

            return { success: true, cupon: { ...data, estado: 'usado' } };
        } catch (error: any) {
            return { success: false, error: error?.message || 'Error al marcar como usado' };
        }
    },

    /**
     * Busca un cupón físico por código.
     */
    async obtenerPorCodigo(codigo: string): Promise<CuponFisico | null> {
        try {
            const { data, error } = await supabase
                .from('cupones_fisicos')
                .select('*')
                .eq('codigo', codigo.trim().toUpperCase())
                .maybeSingle();

            if (error) throw error;
            return (data || null) as CuponFisico | null;
        } catch (error) {
            console.error('❌ Error buscando cupón físico:', error);
            return null;
        }
    },
};