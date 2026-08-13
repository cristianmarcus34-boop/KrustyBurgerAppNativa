// stores/tiendaRecompensas.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Recompensa } from '../lib/tipos';

interface EstadoRecompensas {
    recompensas: Recompensa[];
    cargando: boolean;
    error: string | null;
    cargarRecompensas: () => Promise<void>;
    crearRecompensa: (datos: Omit<Recompensa, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
    actualizarRecompensa: (id: number, datos: Partial<Recompensa>) => Promise<{ success: boolean; error?: string }>;
    eliminarRecompensa: (id: number) => Promise<{ success: boolean; error?: string }>;
    toggleActiva: (id: number, activa: boolean) => Promise<{ success: boolean; error?: string }>;
    recargar: () => Promise<void>;
}

export const tiendaRecompensas = create<EstadoRecompensas>((set, get) => ({
    recompensas: [],
    cargando: false,
    error: null,

    cargarRecompensas: async () => {
        set({ cargando: true, error: null });
        try {
            const { data, error } = await supabase
                .from('recompensas')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            set({ recompensas: data as Recompensa[] || [], cargando: false });
        } catch (error: any) {
            console.error('❌ Error cargando recompensas:', error);
            set({ error: error.message, cargando: false });
        }
    },

    crearRecompensa: async (datos) => {
        try {
            const { data, error } = await supabase
                .from('recompensas')
                .insert([datos])
                .select()
                .single();

            if (error) throw error;

            // Actualizar lista local
            set(state => ({
                recompensas: [data, ...state.recompensas],
            }));

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error creando recompensa:', error);
            return { success: false, error: error.message };
        }
    },

    actualizarRecompensa: async (id, datos) => {
        try {
            const { error } = await supabase
                .from('recompensas')
                .update({ ...datos, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            // Actualizar lista local
            set(state => ({
                recompensas: state.recompensas.map(r =>
                    r.id === id ? { ...r, ...datos } : r
                ),
            }));

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error actualizando recompensa:', error);
            return { success: false, error: error.message };
        }
    },

    eliminarRecompensa: async (id) => {
        try {
            const { error } = await supabase
                .from('recompensas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                recompensas: state.recompensas.filter(r => r.id !== id),
            }));

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error eliminando recompensa:', error);
            return { success: false, error: error.message };
        }
    },

    toggleActiva: async (id, activa) => {
        try {
            const { error } = await supabase
                .from('recompensas')
                .update({ activa, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            // Actualizar lista local
            set(state => ({
                recompensas: state.recompensas.map(r =>
                    r.id === id ? { ...r, activa } : r
                ),
            }));

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error toggling recompensa:', error);
            return { success: false, error: error.message };
        }
    },

    recargar: async () => {
        await get().cargarRecompensas();
    },
}));