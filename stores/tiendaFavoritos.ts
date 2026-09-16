// stores/tiendaFavoritos.ts - ACTUALIZADO
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Producto } from '../lib/tipos';

interface EstadoFavoritos {
    favoritos: Producto[]; // Top 20 para mostrar en secciones especiales
    idsFavoritos: number[]; // Todos los IDs de favoritos para validación instantánea
    cargando: boolean;
    cargarFavoritos: (usuarioId: string) => Promise<void>;
    agregarFavorito: (usuarioId: string, producto: Producto) => Promise<void>;  // 👈 recibe producto completo
    eliminarFavorito: (usuarioId: string, productoId: number) => Promise<void>;
    limpiarFavoritos: () => void;
}

export const tiendaFavoritos = create<EstadoFavoritos>((set, get) => ({
    favoritos: [],
    idsFavoritos: [],
    cargando: false,

    cargarFavoritos: async (usuarioId) => {
        console.log('🎯 [Store] cargarFavoritos llamado con usuarioId =', usuarioId);
        try {
            set({ cargando: true });

            // 1. Traer TODOS los IDs de favoritos del usuario
            const { data: todosFavoritos, error: errorIds } = await supabase
                .from('favoritos')
                .select('producto_id')
                .eq('usuario_id', usuarioId);

            if (errorIds) {
                console.error('❌ [Store] Error cargando IDs:', errorIds);
            }

            // 👈 FILTRAR NULLS de los IDs
            const ids = (todosFavoritos || [])
                .map((f) => f.producto_id)
                .filter((id): id is number => id !== null && id !== undefined);

            console.log('🎯 [Store] IDs filtrados:', ids.length, '→', ids);

            // 2. Traer los favoritos para la lista visual
            const { data: favoritosData, error } = await supabase
                .from('favoritos')
                .select('producto_id, contador, ultima_vez')
                .eq('usuario_id', usuarioId)
                .not('producto_id', 'is', null)          // 👈 ignorar los null en la DB
                .order('ultima_vez', { ascending: false })  // 👈 quitar nullsFirst
                .limit(20);

            if (error) {
                console.error('❌ [Store] Error trayendo favoritosData:', error);
                set({ favoritos: [], idsFavoritos: ids, cargando: false });
                return;
            }

            if (!favoritosData || favoritosData.length === 0) {
                console.log('⚠️ [Store] No hay favoritos para mostrar');
                set({ favoritos: [], idsFavoritos: ids, cargando: false });
                return;
            }

            // 👈 Filtrar nulls también acá por las dudas
            const productoIds = favoritosData
                .map((f) => f.producto_id)
                .filter((id): id is number => id !== null && id !== undefined);

            console.log('🎯 [Store] productoIds a buscar:', productoIds.length, '→', productoIds);

            const { data: productosData, error: productosError } = await supabase
                .from('productos')
                .select('*')
                .in('id', productoIds);

            if (productosError) {
                console.error('❌ [Store] Error trayendo productosData:', productosError);
                set({ favoritos: [], idsFavoritos: ids, cargando: false });
                return;
            }

            console.log('🎯 [Store] productosData obtenidos:', productosData?.length || 0);

            // Ordenar según el orden de favoritosData
            const productosOrdenados = (productosData || []).sort((a, b) => {
                const indexA = favoritosData.findIndex((f) => f.producto_id === a.id);
                const indexB = favoritosData.findIndex((f) => f.producto_id === b.id);
                return indexA - indexB;
            });

            console.log('✅ [Store] favoritos finales:', productosOrdenados.length);

            set({
                favoritos: productosOrdenados,
                idsFavoritos: ids,
                cargando: false
            });
        } catch (error) {
            console.error('❌ [Store] Error en cargarFavoritos:', error);
            set({ favoritos: [], idsFavoritos: [], cargando: false });
        }
    },

    // 👈 AHORA recibe el producto completo
    agregarFavorito: async (usuarioId, producto) => {
        const productoId = Number(producto.id);
        if (!usuarioId || !productoId) return;

        // 1. Insert en Supabase con contador y fecha
        const { error } = await supabase
            .from('favoritos')
            .insert({
                usuario_id: String(usuarioId),
                producto_id: productoId,
                contador: 1,                                 // 👈 inicializar en 1
                ultima_vez: new Date().toISOString(),        // 👈 fecha actual
            });

        if (error && error.code !== '23505') {
            console.error("Error en Supabase al agregar favorito:", error);
            return;
        }

        // 2. Actualización optimista local: idsFavoritos Y favoritos
        set((state) => {
            const yaEstaEnIds = state.idsFavoritos.includes(productoId);
            const yaEstaEnFavoritos = state.favoritos.some(f => f.id === productoId);

            return {
                idsFavoritos: yaEstaEnIds
                    ? state.idsFavoritos
                    : [...state.idsFavoritos, productoId],

                // 👈 Agregar el producto al inicio de la lista, máximo 20
                favoritos: yaEstaEnFavoritos
                    ? state.favoritos
                    : [producto, ...state.favoritos].slice(0, 20),
            };
        });
    },

    eliminarFavorito: async (usuarioId, productoId) => {
        try {
            const { error } = await supabase
                .from('favoritos')
                .delete()
                .eq('usuario_id', usuarioId)
                .eq('producto_id', productoId);

            if (error) {
                console.error('Error eliminando favorito:', error);
                return;
            }

            // Actualización optimista local
            set((state) => ({
                favoritos: state.favoritos.filter((f) => f.id !== productoId),
                idsFavoritos: state.idsFavoritos.filter((id) => id !== Number(productoId)),
            }));
        } catch (error) {
            console.error('Error eliminando favorito:', error);
        }
    },

    limpiarFavoritos: () => {
        set({ favoritos: [], idsFavoritos: [], cargando: false });
    },
}));