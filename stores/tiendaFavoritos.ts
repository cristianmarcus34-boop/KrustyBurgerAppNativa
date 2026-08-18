// stores/tiendaFavoritos.ts - VERSIÓN CON ELIMINAR
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Producto } from '../lib/tipos';

// ✅ INTERFAZ COMPLETA DE FAVORITO
interface Favorito {
    id: number;
    usuario_id: string;
    producto_id: number;
    contador: number;
    ultima_vez: string;
    fecha: string;
}

// ✅ INTERFAZ PARA DATOS PARCIALES
interface FavoritoResumen {
    producto_id: number;
    contador: number;
    ultima_vez: string;
}

interface EstadoFavoritos {
    favoritos: Producto[];
    favoritosData: FavoritoResumen[];
    cargando: boolean;
    cargarFavoritos: (usuarioId: string) => Promise<void>;
    agregarFavorito: (usuarioId: string, producto: Producto) => Promise<void>;
    incrementarContador: (usuarioId: string, productoId: number) => Promise<void>;
    eliminarFavorito: (usuarioId: string, productoId: number) => Promise<void>; // ✅ NUEVA FUNCIÓN
    limpiarFavoritos: () => void;
}

export const tiendaFavoritos = create<EstadoFavoritos>((set, get) => ({
    favoritos: [],
    favoritosData: [],
    cargando: false,

    cargarFavoritos: async (usuarioId) => {
        try {
            set({ cargando: true });

            const { data: favoritosData, error } = await supabase
                .from('favoritos')
                .select('producto_id, contador, ultima_vez')
                .eq('usuario_id', usuarioId)
                .order('contador', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error cargando favoritos:', error);
                set({ favoritos: [], favoritosData: [], cargando: false });
                return;
            }

            if (!favoritosData || favoritosData.length === 0) {
                set({ favoritos: [], favoritosData: [], cargando: false });
                return;
            }

            const productoIds = favoritosData.map((f) => f.producto_id);
            const { data: productosData, error: productosError } = await supabase
                .from('productos')
                .select('*')
                .in('id', productoIds);

            if (productosError) {
                console.error('Error cargando productos:', productosError);
                set({ favoritos: [], favoritosData: [], cargando: false });
                return;
            }

            const productosOrdenados = productosData?.sort((a, b) => {
                const contadorA = favoritosData.find((f) => f.producto_id === a.id)?.contador || 0;
                const contadorB = favoritosData.find((f) => f.producto_id === b.id)?.contador || 0;
                return contadorB - contadorA;
            });

            set({
                favoritos: productosOrdenados || [],
                favoritosData: favoritosData,
                cargando: false
            });
        } catch (error) {
            console.error('Error en cargarFavoritos:', error);
            set({ favoritos: [], favoritosData: [], cargando: false });
        }
    },

    agregarFavorito: async (usuarioId, producto) => {
        try {
            const { data: existente, error: checkError } = await supabase
                .from('favoritos')
                .select('id, contador')
                .eq('usuario_id', usuarioId)
                .eq('producto_id', producto.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error verificando favorito:', checkError);
                return;
            }

            if (existente) {
                await supabase
                    .from('favoritos')
                    .update({
                        contador: existente.contador + 1,
                        ultima_vez: new Date().toISOString()
                    })
                    .eq('id', existente.id);
            } else {
                await supabase
                    .from('favoritos')
                    .insert({
                        usuario_id: usuarioId,
                        producto_id: producto.id,
                        contador: 1,
                        ultima_vez: new Date().toISOString(),
                        fecha: new Date().toISOString()
                    });
            }

            await get().cargarFavoritos(usuarioId);
        } catch (error) {
            console.error('Error agregando favorito:', error);
        }
    },

    // ✅ NUEVA FUNCIÓN: ELIMINAR FAVORITO
    eliminarFavorito: async (usuarioId: string, productoId: number) => {
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

            // Recargar favoritos
            await get().cargarFavoritos(usuarioId);
        } catch (error) {
            console.error('Error eliminando favorito:', error);
        }
    },

    incrementarContador: async (usuarioId, productoId) => {
        try {
            const { data: existente, error } = await supabase
                .from('favoritos')
                .select('id, contador')
                .eq('usuario_id', usuarioId)
                .eq('producto_id', productoId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error verificando favorito:', error);
                return;
            }

            if (existente) {
                await supabase
                    .from('favoritos')
                    .update({
                        contador: existente.contador + 1,
                        ultima_vez: new Date().toISOString()
                    })
                    .eq('id', existente.id);
            }
        } catch (error) {
            console.error('Error incrementando contador:', error);
        }
    },

    limpiarFavoritos: () => {
        set({ favoritos: [], favoritosData: [], cargando: false });
    },
}));