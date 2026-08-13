// hooks/useNotificaciones.ts
import { useEffect, useState } from 'react';
import { notificacionService } from '../services/notificacionService';
import { tiendaAutenticacion } from '../stores/tiendaAutenticacion';

// ✅ Definir el tipo de notificación
interface Notificacion {
    id: number;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    leida: boolean;
    created_at: string;
}

export const useNotificaciones = () => {
    const { perfil } = tiendaAutenticacion();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidas, setNoLeidas] = useState(0);

    useEffect(() => {
        if (!perfil?.id) return;

        const cargarNotificaciones = async () => {
            try {
                const notis = await notificacionService.obtenerNotificacionesNoLeidas(perfil.id);
                // ✅ CORREGIDO: Tipado correcto
                setNotificaciones(notis as Notificacion[]);
                setNoLeidas(notis.length);
            } catch (error) {
                console.error('Error cargando notificaciones:', error);
            }
        };

        cargarNotificaciones();

        // Escuchar notificaciones entrantes
        const { subscription, responseSubscription } = notificacionService.escucharNotificaciones();

        return () => {
            subscription.remove();
            responseSubscription.remove();
        };
    }, [perfil?.id]);

    // ✅ FUNCIONES CON TIPADO CORRECTO
    const marcarComoLeida = async (notificacionId: number) => {
        if (!perfil?.id) return false;
        const resultado = await notificacionService.marcarComoLeida(notificacionId);
        if (resultado) {
            // Actualizar lista local
            setNotificaciones(prev =>
                prev.map(n =>
                    n.id === notificacionId ? { ...n, leida: true } : n
                )
            );
            setNoLeidas(prev => Math.max(0, prev - 1));
        }
        return resultado;
    };

    const marcarTodasComoLeidas = async () => {
        if (!perfil?.id) return false;
        const resultado = await notificacionService.marcarTodasComoLeidas(perfil.id);
        if (resultado) {
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
            setNoLeidas(0);
        }
        return resultado;
    };

    return {
        notificaciones,
        noLeidas,
        marcarComoLeida,
        marcarTodasComoLeidas,
    };
};