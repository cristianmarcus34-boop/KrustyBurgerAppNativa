import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Pedido } from '../lib/tipos';

interface EstadoPedidos {
  pedidos: Pedido[];
  pedidoActual: Pedido | null;
  cargando: boolean;
  cargarPedidosUsuario: (idUsuario: string) => Promise<void>;
  cargarTodosPedidos: () => Promise<void>;
  observarPedido: (idPedido: number) => void;
  actualizarEstado: (idPedido: number, estado: string) => Promise<void>;
  actualizarUbicacionRepartidor: (idPedido: number, latitud: number, longitud: number) => Promise<void>;
  crearPedido: (datos: Partial<Pedido>) => Promise<{ error: string | null; id: number | null }>;
}

export const tiendaPedidos = create<EstadoPedidos>((set, get) => ({
  pedidos: [],
  pedidoActual: null,
  cargando: false,

  cargarPedidosUsuario: async (idUsuario) => {
    try {
      set({ cargando: true });
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id_de_usuario', idUsuario)
        .order('creado_en', { ascending: false });
      if (error) { console.error('Error cargando pedidos:', error); set({ cargando: false }); return; }
      set({ pedidos: data as Pedido[] || [], cargando: false });
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      set({ cargando: false });
    }
  },

  cargarTodosPedidos: async () => {
    try {
      set({ cargando: true });
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) { console.error('Error cargando pedidos:', error); set({ cargando: false }); return; }
      set({ pedidos: data as Pedido[] || [], cargando: false });
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      set({ cargando: false });
    }
  },

  observarPedido: (idPedido) => {
    try {
      supabase
        .channel(`pedido_${idPedido}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${idPedido}` }, (payload) => {
          set({ pedidoActual: payload.new as Pedido });
        })
        .subscribe();
    } catch (error) {
      console.error('Error observando pedido:', error);
    }
  },

  actualizarEstado: async (idPedido, estado) => {
    try {
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', idPedido);
      if (error) console.error('Error actualizando estado:', error);
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  },

  actualizarUbicacionRepartidor: async (idPedido, latitud, longitud) => {
    try {
      const { error } = await supabase.from('pedidos').update({ lat_repartidor: latitud, repartidor_de_lng: longitud }).eq('id', idPedido);
      if (error) console.error('Error actualizando ubicacion:', error);
    } catch (error) {
      console.error('Error actualizando ubicacion:', error);
    }
  },

  crearPedido: async (datos) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .insert(datos)
        .select('id')
        .single();

      if (error) {
        console.error('Error creando pedido:', error);
        return { error: error.message, id: null };
      }

      set({ pedidos: [data as Pedido, ...get().pedidos] });
      return { error: null, id: data.id };
    } catch (error: any) {
      console.error('Error creando pedido:', error);
      return { error: error.message || 'Error desconocido', id: null };
    }
  },
}));