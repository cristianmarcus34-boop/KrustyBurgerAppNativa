ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Repartidores pueden ver pedidos disponibles y propios"
    ON public.pedidos;

CREATE POLICY "Repartidores pueden ver pedidos disponibles y propios"
    ON public.pedidos
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.perfiles AS perfil
            WHERE perfil.id = (SELECT auth.uid())
              AND perfil.rol = 'repartidor'
        )
        AND (
            estado = 'listo'
            OR (
                estado IN ('en_camino', 'en camino')
                AND (
                    repartidor_id IS NULL
                    OR repartidor_id = (SELECT auth.uid())
                )
            )
            OR (
                estado = 'entregado'
                AND repartidor_id = (SELECT auth.uid())
            )
        )
    );
