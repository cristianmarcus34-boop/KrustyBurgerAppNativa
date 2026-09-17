// stores/tiendaFavoritos.ts - SISTEMA DUAL: FAVORITOS MANUALES + RANKING AUTO
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Producto } from '../lib/tipos';

// ============================================================
// 📋 TIPOS
// ============================================================
interface FavoritoRow {
    id: number;
    usuario_id: string;
    producto_id: number;
    contador: number;
    es_favorito: boolean;
    ultima_vez: string;
}

interface EstadoFavoritos {
    /** Productos con es_favorito = true (los que el usuario marcó con ❤️) */
    favoritosManuales: Producto[];
    /** Top 20 de productos más agregados al carrito (ranking automático) */
    topRanking: Producto[];
    /** Todos los IDs de productos que tienen es_favorito = true (para pintar el corazón rápido) */
    idsFavoritos: number[];

    cargando: boolean;

    // Acciones
    cargarFavoritos: (usuarioId: string) => Promise<void>;
    agregarFavoritoManual: (usuarioId: string, producto: Producto) => Promise<void>;
    eliminarFavoritoManual: (usuarioId: string, productoId: number) => Promise<void>;
    agregarAlRanking: (usuarioId: string, producto: Producto) => Promise<void>;
    limpiarFavoritos: () => void;
}

// ============================================================
// 📦 STORE
// ============================================================
export const tiendaFavoritos = create<EstadoFavoritos>((set, get) => ({
    favoritosManuales: [],
    topRanking: [],
    idsFavoritos: [],
    cargando: false,

    // ============================================================
    // 🔄 CARGAR: trae los dos sets por separado
    // ============================================================
    cargarFavoritos: async (usuarioId) => {
        if (!usuarioId) {
            console.warn('⚠️ [Favoritos] cargarFavoritos sin usuarioId');
            set({ favoritosManuales: [], topRanking: [], idsFavoritos: [], cargando: false });
            return;
        }

        try {
            set({ cargando: true });

            // 1. Traer TODOS los registros del usuario (id, producto_id, contador, es_favorito)
            const { data: filas, error } = await supabase
                .from('favoritos')
                .select('id, producto_id, contador, es_favorito, ultima_vez')
                .eq('usuario_id', usuarioId)
                .not('producto_id', 'is', null);

            if (error) {
                console.error('❌ [Favoritos] Error cargando filas:', error);
                set({ cargando: false });
                return;
            }

            if (!filas || filas.length === 0) {
                console.log('ℹ️ [Favoritos] Usuario sin favoritos');
                set({
                    favoritosManuales: [],
                    topRanking: [],
                    idsFavoritos: [],
                    cargando: false,
                });
                return;
            }

            // 2. Filtrar los que son favoritos manuales (corazón)
            const idsManuales = filas
                .filter((f: any) => f.es_favorito === true)
                .map((f: any) => f.producto_id)
                .filter((id: number | null): id is number => id !== null);

            // 3. Armar el top 20 del ranking (ordenado por contador DESC, ultima_vez DESC)
            const topRankingIds = [...filas]
                .filter((f: any) => (f.contador || 0) > 0)
                .sort((a: any, b: any) => {
                    if (b.contador !== a.contador) return b.contador - a.contador;
                    return new Date(b.ultima_vez).getTime() - new Date(a.ultima_vez).getTime();
                })
                .slice(0, 20)
                .map((f: any) => f.producto_id)
                .filter((id: number | null): id is number => id !== null);

            // 4. Juntar todos los IDs únicos de productos que necesitamos traer
            const todosLosIds = Array.from(new Set([...idsManuales, ...topRankingIds]));

            if (todosLosIds.length === 0) {
                set({
                    favoritosManuales: [],
                    topRanking: [],
                    idsFavoritos: [],
                    cargando: false,
                });
                return;
            }

            // 5. Traer los productos en UNA sola consulta
            const { data: productos, error: prodError } = await supabase
                .from('productos')
                .select('*')
                .in('id', todosLosIds);

            if (prodError) {
                console.error('❌ [Favoritos] Error cargando productos:', prodError);
                set({ cargando: false });
                return;
            }

            const productosMap = new Map<number, Producto>(
                (productos || []).map((p: any) => [p.id, p as Producto])
            );

            // 6. Armar las dos listas ordenadas según los IDs
            const favoritosManuales = idsManuales
                .map((id) => productosMap.get(id))
                .filter((p): p is Producto => p !== undefined);

            const topRanking = topRankingIds
                .map((id) => productosMap.get(id))
                .filter((p): p is Producto => p !== undefined);

            console.log('✅ [Favoritos] Cargados:', {
                manuales: favoritosManuales.length,
                ranking: topRanking.length,
            });

            set({
                favoritosManuales,
                topRanking,
                idsFavoritos: idsManuales,
                cargando: false,
            });
        } catch (error) {
            console.error('❌ [Favoritos] Error inesperado:', error);
            set({ cargando: false });
        }
    },

    // ============================================================
    // ❤️ AGREGAR FAVORITO MANUAL (corazón)
    // ============================================================
    agregarFavoritoManual: async (usuarioId, producto) => {
        const productoId = Number(producto.id);
        if (!usuarioId || !productoId) return;

        try {
            // 1. Buscar si ya existe el registro
            const { data: existente } = await supabase
                .from('favoritos')
                .select('id, contador, es_favorito')
                .eq('usuario_id', String(usuarioId))
                .eq('producto_id', productoId)
                .maybeSingle();

            if (existente) {
                // 2a. Ya existe → solo marcar es_favorito = true
                const { error } = await supabase
                    .from('favoritos')
                    .update({ es_favorito: true })
                    .eq('id', existente.id);

                if (error) {
                    console.error('❌ [Favoritos] Error actualizando a favorito:', error);
                    return;
                }
            } else {
                // 2b. No existe → insertar con es_favorito=true y contador=0
                const { error } = await supabase
                    .from('favoritos')
                    .insert({
                        usuario_id: String(usuarioId),
                        producto_id: productoId,
                        contador: 0,
                        es_favorito: true,
                        ultima_vez: new Date().toISOString(),
                    });

                if (error) {
                    console.error('❌ [Favoritos] Error insertando favorito:', error);
                    return;
                }
            }

            // 3. Actualización optimista local
            set((state) => {
                const yaEsta = state.idsFavoritos.includes(productoId);
                return {
                    idsFavoritos: yaEsta
                        ? state.idsFavoritos
                        : [...state.idsFavoritos, productoId],
                    favoritosManuales: yaEsta
                        ? state.favoritosManuales
                        : [producto, ...state.favoritosManuales],
                };
            });
        } catch (error) {
            console.error('❌ [Favoritos] Error en agregarFavoritoManual:', error);
        }
    },

    // ============================================================
    // 💔 ELIMINAR FAVORITO MANUAL
    // ============================================================
    eliminarFavoritoManual: async (usuarioId, productoId) => {
        if (!usuarioId || !productoId) return;

        try {
            const id = Number(productoId);

            // 1. Buscar si existe el registro
            const { data: existente } = await supabase
                .from('favoritos')
                .select('id, contador')
                .eq('usuario_id', String(usuarioId))
                .eq('producto_id', id)
                .maybeSingle();

            if (!existente) return;

            // 2. Si el contador es 0 (nunca lo pidió), borramos la fila
            //    Si el contador es > 0 (ya lo pidió), solo desmarcamos es_favorito
            if ((existente.contador || 0) > 0) {
                const { error } = await supabase
                    .from('favoritos')
                    .update({ es_favorito: false })
                    .eq('id', existente.id);

                if (error) {
                    console.error('❌ [Favoritos] Error desmarcando favorito:', error);
                    return;
                }
            } else {
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .eq('id', existente.id);

                if (error) {
                    console.error('❌ [Favoritos] Error eliminando favorito:', error);
                    return;
                }
            }

            // 3. Actualización optimista local
            set((state) => ({
                idsFavoritos: state.idsFavoritos.filter((i) => i !== id),
                favoritosManuales: state.favoritosManuales.filter((f) => f.id !== id),
            }));
        } catch (error) {
            console.error('❌ [Favoritos] Error en eliminarFavoritoManual:', error);
        }
    },

    // ============================================================
    // 📊 AGREGAR AL RANKING (auto, cuando agrega al carrito)
    // ============================================================
    agregarAlRanking: async (usuarioId, producto) => {
        const productoId = Number(producto.id);
        if (!usuarioId || !productoId) return;

        try {
            // 1. Buscar si ya existe
            const { data: existente } = await supabase
                .from('favoritos')
                .select('id, contador')
                .eq('usuario_id', String(usuarioId))
                .eq('producto_id', productoId)
                .maybeSingle();

            if (existente) {
                // 2a. Ya existe → incrementar contador
                const { error } = await supabase
                    .from('favoritos')
                    .update({
                        contador: (existente.contador || 0) + 1,
                        ultima_vez: new Date().toISOString(),
                    })
                    .eq('id', existente.id);

                if (error) {
                    console.error('❌ [Favoritos] Error incrementando contador:', error);
                    return;
                }
            } else {
                // 2b. No existe → insertar con contador=1, es_favorito=false
                const { error } = await supabase
                    .from('favoritos')
                    .insert({
                        usuario_id: String(usuarioId),
                        producto_id: productoId,
                        contador: 1,
                        es_favorito: false,
                        ultima_vez: new Date().toISOString(),
                    });

                if (error) {
                    console.error('❌ [Favoritos] Error insertando ranking:', error);
                    return;
                }
            }

            // 3. Actualización optimista del ranking
            set((state) => {
                const yaEstaEnRanking = state.topRanking.some((p) => p.id === productoId);
                const nuevoRanking = yaEstaEnRanking
                    ? [producto, ...state.topRanking.filter((p) => p.id !== productoId)]
                    : [producto, ...state.topRanking];

                return {
                    topRanking: nuevoRanking.slice(0, 20),
                };
            });
        } catch (error) {
            console.error('❌ [Favoritos] Error en agregarAlRanking:', error);
        }
    },

    // ============================================================
    // 🧹 LIMPIAR
    // ============================================================
    limpiarFavoritos: () => {
        console.log('🧹 [Favoritos] Limpiando estado');
        set({
            favoritosManuales: [],
            topRanking: [],
            idsFavoritos: [],
            cargando: false,
        });
    },
}));