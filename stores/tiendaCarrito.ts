// stores/tiendaCarrito.ts - CON FAVORITOS DIFERIDOS AL MÁXIMO
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Producto, ElementoCarrito } from '../lib/tipos';
import { tiendaFavoritos } from './tiendaFavoritos';
import { tiendaAutenticacion } from './tiendaAutenticacion';

interface EstadoCarrito {
  elementos: ElementoCarrito[];
  cargando: boolean;
  cargarCarrito: () => Promise<void>;
  agregarProducto: (producto: Producto) => Promise<void>;
  quitarProducto: (idProducto: number) => Promise<void>;
  aumentarCantidad: (idProducto: number) => Promise<void>;
  disminuirCantidad: (idProducto: number) => Promise<void>;
  vaciarCarrito: () => Promise<void>;
  calcularTotal: () => number;
  cantidadTotal: () => number;
}

export const tiendaCarrito = create<EstadoCarrito>((set, get) => ({
  elementos: [],
  cargando: true,

  cargarCarrito: async () => {
    try {
      const guardado = await AsyncStorage.getItem('carrito_krusty');
      if (guardado) {
        set({ elementos: JSON.parse(guardado), cargando: false });
      } else {
        set({ cargando: false });
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
      set({ cargando: false });
    }
  },

  // ✅ OPTIMIZADO: set() primero, todo lo demás diferido
  agregarProducto: async (producto) => {
    // 1. OBTENER ID DEL PRODUCTO
    const idProducto = producto.id || (producto as any).identificacion;

    // 2. ACTUALIZAR ESTADO INMEDIATAMENTE
    const nuevosElementos = [...get().elementos];
    const indice = nuevosElementos.findIndex(e => {
      const id = e.producto.id || (e.producto as any).identificacion;
      return id === idProducto;
    });

    if (indice !== -1) {
      nuevosElementos[indice] = {
        ...nuevosElementos[indice],
        cantidad: nuevosElementos[indice].cantidad + 1,
      };
    } else {
      nuevosElementos.push({ producto, cantidad: 1 });
    }

    // 3. SETEAR ESTADO → EL BADGE SE ACTUALIZA ACÁ
    set({ elementos: nuevosElementos });
    console.log('🛒 [Store] Producto agregado, cantidad total:', get().cantidadTotal());

    // 4. PERSISTIR EN BACKGROUND (diferido para no competir con el render)
    setTimeout(() => {
      AsyncStorage.setItem('carrito_krusty', JSON.stringify(nuevosElementos))
        .catch(error => console.error('Error guardando carrito:', error));
    }, 0);

    // 5. REGISTRAR FAVORITO MUY DIFERIDO (2 segundos después)
    //    Cuando ya nadie está mirando el badge, ahí hacemos las 2-3 requests
    //    a Supabase. NO bloquea la UI porque ya pasó el momento crítico.
    setTimeout(() => {
      try {
        const { perfil } = tiendaAutenticacion.getState();
        if (perfil?.id) {
          tiendaFavoritos.getState().agregarFavorito(perfil.id, producto)
            .catch(favError => console.log('⚠️ Error registrando favorito:', favError));
        }
      } catch (favError) {
        console.log('⚠️ Error registrando favorito:', favError);
      }
    }, 2000);
  },

  quitarProducto: async (idProducto) => {
    try {
      const elementos = get().elementos.filter(e => {
        const id = e.producto.id || (e.producto as any).identificacion;
        return id !== idProducto;
      });

      // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
      set({ elementos });
      console.log('🛒 [Store] Producto quitado, cantidad total:', get().cantidadTotal());

      // ✅ PERSISTIR EN BACKGROUND (diferido)
      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch(error => console.error('Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('Error quitando producto:', error);
    }
  },

  aumentarCantidad: async (idProducto) => {
    try {
      const elementos = get().elementos.map(e => {
        const id = e.producto.id || (e.producto as any).identificacion;
        if (id === idProducto) {
          return { ...e, cantidad: e.cantidad + 1 };
        }
        return e;
      });

      // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
      set({ elementos });
      console.log('🛒 [Store] Cantidad aumentada, total:', get().cantidadTotal());

      // ✅ PERSISTIR EN BACKGROUND (diferido)
      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch(error => console.error('Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('Error aumentando cantidad:', error);
    }
  },

  disminuirCantidad: async (idProducto) => {
    try {
      const elementos = get().elementos
        .map(e => {
          const id = e.producto.id || (e.producto as any).identificacion;
          if (id === idProducto) {
            return { ...e, cantidad: Math.max(0, e.cantidad - 1) };
          }
          return e;
        })
        .filter(e => e.cantidad > 0);

      // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
      set({ elementos });
      console.log('🛒 [Store] Cantidad disminuida, total:', get().cantidadTotal());

      // ✅ PERSISTIR EN BACKGROUND (diferido)
      setTimeout(() => {
        AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos))
          .catch(error => console.error('Error guardando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('Error disminuyendo cantidad:', error);
    }
  },

  vaciarCarrito: async () => {
    try {
      // ✅ ACTUALIZAR ESTADO INMEDIATAMENTE
      set({ elementos: [] });
      console.log('🛒 [Store] Carrito vaciado');

      // ✅ PERSISTIR EN BACKGROUND (diferido)
      setTimeout(() => {
        AsyncStorage.removeItem('carrito_krusty')
          .catch(error => console.error('Error eliminando carrito:', error));
      }, 0);
    } catch (error) {
      console.error('Error vaciando carrito:', error);
    }
  },

  calcularTotal: () => {
    return get().elementos.reduce((suma, e) => {
      const precio = typeof e.producto.precio === 'number'
        ? e.producto.precio
        : Number(e.producto.precio);
      return suma + (precio * e.cantidad);
    }, 0);
  },

  cantidadTotal: () => {
    return get().elementos.reduce((suma, e) => suma + e.cantidad, 0);
  },
}));