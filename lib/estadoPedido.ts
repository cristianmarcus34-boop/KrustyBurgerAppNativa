import type { EstadoPedido } from './tipos';

export function normalizarEstadoPedido(
  estado: EstadoPedido | null | undefined
): EstadoPedido;
export function normalizarEstadoPedido(
  estado: string | null | undefined
): string;
export function normalizarEstadoPedido(estado: string | null | undefined): string {
  switch (estado?.trim().toLowerCase()) {
    case 'en cocina':
      return 'preparando';
    case 'en camino':
      return 'en_camino';
    default:
      return estado?.trim().toLowerCase() || 'pendiente';
  }
}

export const ESTADOS_ACTIVOS_PEDIDO = [
  'pendiente',
  'pago_pendiente',
  'confirmado',
  'preparando',
  'listo',
  'en_camino',
];

export const ESTADOS_FINALIZADOS_PEDIDO = ['entregado', 'cancelado'];
