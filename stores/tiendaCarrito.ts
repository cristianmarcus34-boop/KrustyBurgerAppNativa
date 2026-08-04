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

  agregarProducto: async (producto) => {
    try {
      const elementos = [...get().elementos];
      const idProducto = producto.id || (producto as any).identificacion;
      const indice = elementos.findIndex(e => {
        const id = e.producto.id || (e.producto as any).identificacion;
        return id === idProducto;
      });

      if (indice !== -1) {
        elementos[indice].cantidad += 1;
      } else {
        elementos.push({ producto, cantidad: 1 });
      }

      set({ elementos });
      await AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos));

      // ✅ REGISTRAR FAVORITO (si el usuario está autenticado)
      try {
        const { perfil } = tiendaAutenticacion.getState();
        if (perfil?.id) {
          // Esperar a que se registre el favorito
          await tiendaFavoritos.getState().agregarFavorito(perfil.id, producto);
        }
      } catch (favError) {
        console.log('⚠️ Error registrando favorito:', favError);
        // No interrumpir el flujo del carrito
      }

    } catch (error) {
      console.error('Error agregando producto:', error);
    }
  },

  quitarProducto: async (idProducto) => {
    try {
      const elementos = get().elementos.filter(e => {
        const id = e.producto.id || (e.producto as any).identificacion;
        return id !== idProducto;
      });
      set({ elementos });
      await AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos));
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
      set({ elementos });
      await AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos));

      // ✅ AL AUMENTAR CANTIDAD, TAMBIÉN INCREMENTAR FAVORITO
      try {
        const { perfil } = tiendaAutenticacion.getState();
        if (perfil?.id) {
          // Buscar el producto para obtener sus datos
          const producto = get().elementos.find(e => {
            const id = e.producto.id || (e.producto as any).identificacion;
            return id === idProducto;
          })?.producto;

          if (producto) {
            await tiendaFavoritos.getState().agregarFavorito(perfil.id, producto);
          }
        }
      } catch (favError) {
        console.log('⚠️ Error incrementando favorito:', favError);
      }

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

      set({ elementos });
      await AsyncStorage.setItem('carrito_krusty', JSON.stringify(elementos));
    } catch (error) {
      console.error('Error disminuyendo cantidad:', error);
    }
  },

  vaciarCarrito: async () => {
    try {
      set({ elementos: [] });
      await AsyncStorage.removeItem('carrito_krusty');
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