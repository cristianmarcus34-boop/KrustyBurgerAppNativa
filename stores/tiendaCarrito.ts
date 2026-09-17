// stores/tiendaCarrito.ts - CON AGREGAR POR CANTIDAD Y RANKING DIFERIDO
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Producto, ElementoCarrito } from '../lib/tipos';
import { tiendaFavoritos } from './tiendaFavoritos';
import { tiendaAutenticacion } from './tiendaAutenticacion';

// ============================================================
// ⏱️ TIMERS DE RANKING POR PRODUCTO
// ============================================================
// Guardamos los timers acá para poder cancelarlos si el producto
// se quita del carrito antes de los 2s.
const timersRanking: Record<string, ReturnType<typeof setTimeout>> = {};

const getProductoId = (producto: Producto): string | null => {
  const id = producto?.id || (producto as any)?.identificacion;
  return id != null ? String(id) : null;
};

// ============================================================
// 📦 STORE
// ============================================================
interface EstadoCarrito {
  elementos: ElementoCarrito[];
  cargando: boolean;

  cargarCarrito: () => Promise<void>;
  agregarProducto: (producto: Producto, cantidad?: number) => Promise<void>;
  quitarProducto: (idProducto: number | string) => Promise<void>;
  aumentarCantidad: (idProducto: number | string) => Promise<void>;
  disminuirCantidad: (idProducto: number | string) => Promise<void>;
  vaciarCarrito: () => Promise<void>;
  calcularTotal: () => number;
  cantidadTotal: () => number;
}

export const tiendaCarrito = create<EstadoCarrito>((set, get) => ({
  elementos: [],
  cargando: true,

  // ============================================================
  // 🔄 CARGAR
  // ============================================================
  cargarCarrito: async () => {
    try {
      const guardado = await AsyncStorage.getItem('carrito_krusty');
      if (guardado) {
        set({ elementos: JSON.parse(guardado), cargando: false });
      } else {
        set({ cargando: false });
      }
    } catch (error) {
      console.error('❌ Error cargando carrito:', error);
      set({ cargando: false });
    }
  },

  // ============================================================
  // ➕ AGREGAR PRODUCTO (con cantidad)
  // ============================================================
  agregarProducto: async (producto, cantidad = 1) => {
    const idProducto = getProductoId(producto);
    if (!idProducto || cantidad <= 0) return;

    // 1. Actualizar estado INMEDIATAMENTE
    const nuevosElementos = [...get().elementos];
    const indice = nuevosElementos.findIndex((e) => getProductoId(e.producto) === idProducto);

    if (indice !== -1) {
      nuevosElementos[indice] = {
        ...nuevosElementos[indice],
        cantidad: nuevosElementos[indice].cantidad + cantidad,
      };
    } else {
      nuevosElementos.push({ producto, cantidad });
    }

    set({ elementos: nuevosElementos });
    console.log('🛒 [Carrito] Producto agregado x', cantidad, '→ total:', get().cantidadTotal());

    // 2. Persistir en background
    setTimeout(() => {
      AsyncStorage.setItem('carrito_krusty', JSON.stringify(nuevosElementos))
        .catch((error) => console.error('❌ Error guardando carrito:', error));
    }, 0);

    // 3. Ranking diferido (2s) — SOLO UNA VEZ por producto, y cancelable
    //    Si el timer ya existe, lo cancelamos y lo recreamos para acumular.
    if (timersRanking[idProducto]) {
      clearTimeout(timersRanking[idProducto]);
      delete timersRanking[idProducto];
    }

    timersRanking[idProducto] = setTimeout(() => {
      try {
        // ✅ Solo registrar si el producto SIGUE en el carrito
        const sigueEnCarrito = get().elementos.some(
          (e) => getProductoId(e.producto) === idProducto
        );

        if (!sigueEnCarrito) {
          console.log('⏭️ [Ranking] Producto ya no está en carrito, skip:', idProducto);
          delete timersRanking[idProducto];
          return;
        }

        const { perfil } = tiendaAutenticacion.getState();
        if (perfil?.id) {
          tiendaFavoritos
            .getState()
            .agregarAlRanking(String(perfil.id), producto)
            .catch((favError) =>
              console.log('⚠️ [Ranking] Error registrando:', favError)
            );
        }
      } catch (favError) {
        console.log('⚠️ [Ranking] Error inesperado:', favError);
      } finally {
        delete timersRanking[idProducto];
      }
    }, 2000);
  },

  // ============================================================
  // ➖ QUITAR PRODUCTO
  // ============================================================
  quitarProducto: async (idProducto) => {
    try {
      const id = String(idProducto);

      // ✅ Cancelar timer de ranking si existe
      if (timersRanking[id]) {
        clearTimeout(timersRanking[id]);
        delete timersRanking[id];
      }

      const elementos = get().elementos.filter(
        (e) => getProductoId(e.producto) !== id
      );

      set({ elementos });
      console.log('🛒 [Carrito] Producto quitado → total:', get().cantidadTotal());

      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch((error) => console.error('❌ Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('❌ Error quitando producto:', error);
    }
  },

  // ============================================================
  // ⬆️ AUMENTAR
  // ============================================================
  aumentarCantidad: async (idProducto) => {
    try {
      const id = String(idProducto);
      const elementos = get().elementos.map((e) => {
        if (getProductoId(e.producto) === id) {
          return { ...e, cantidad: e.cantidad + 1 };
        }
        return e;
      });

      set({ elementos });

      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch((error) => console.error('❌ Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('❌ Error aumentando cantidad:', error);
    }
  },

  // ============================================================
  // ⬇️ DISMINUIR
  // ============================================================
  disminuirCantidad: async (idProducto) => {
    try {
      const id = String(idProducto);
      const elementos = get().elementos
        .map((e) => {
          if (getProductoId(e.producto) === id) {
            return { ...e, cantidad: Math.max(0, e.cantidad - 1) };
          }
          return e;
        })
        .filter((e) => e.cantidad > 0);

      // ✅ Si el producto llegó a 0 y fue eliminado, cancelar timer
      const sigueExistiendo = elementos.some(
        (e) => getProductoId(e.producto) === id
      );
      if (!sigueExistiendo && timersRanking[id]) {
        clearTimeout(timersRanking[id]);
        delete timersRanking[id];
      }

      set({ elementos });

      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch((error) => console.error('❌ Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('❌ Error disminuyendo cantidad:', error);
    }
  },

  // ============================================================
  // 🗑️ VACIAR
  // ============================================================
  vaciarCarrito: async () => {
    try {
      // ✅ Cancelar TODOS los timers
      Object.keys(timersRanking).forEach((id) => {
        clearTimeout(timersRanking[id]);
        delete timersRanking[id];
      });

      set({ elementos: [] });

      setTimeout(() => {
        AsyncStorage.removeItem('carrito_krusty')
          .catch((error) => console.error('❌ Error eliminando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('❌ Error vaciando carrito:', error);
    }
  },

  // ============================================================
  // 💰 CÁLCULOS
  // ============================================================
  calcularTotal: () => {
    return get().elementos.reduce((suma, e) => {
      const precio =
        typeof e.producto.precio === 'number'
          ? e.producto.precio
          : Number(e.producto.precio);
      return suma + precio * e.cantidad;
    }, 0);
  },

  cantidadTotal: () => {
    return get().elementos.reduce((suma, e) => suma + e.cantidad, 0);
  },
}));