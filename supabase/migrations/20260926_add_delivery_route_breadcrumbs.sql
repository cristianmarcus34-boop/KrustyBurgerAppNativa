CREATE TABLE IF NOT EXISTS public.seguimiento_pedidos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    registrado_en timestamptz NOT NULL,
    CONSTRAINT seguimiento_pedidos_pedido_registro_unique UNIQUE (pedido_id, registrado_en)
);

ALTER TABLE public.seguimiento_pedidos ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.seguimiento_pedidos TO authenticated;

DROP POLICY IF EXISTS "Clientes y repartidores pueden ver el recorrido de sus pedidos"
    ON public.seguimiento_pedidos;
CREATE POLICY "Clientes y repartidores pueden ver el recorrido de sus pedidos"
    ON public.seguimiento_pedidos
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.pedidos
            WHERE pedidos.id = seguimiento_pedidos.pedido_id
              AND (
                  pedidos.id_de_usuario = (SELECT auth.uid())
                  OR pedidos.repartidor_id = (SELECT auth.uid())
              )
        )
    );

CREATE OR REPLACE FUNCTION public.registrar_punto_seguimiento(
    p_pedido_id bigint,
    p_latitud double precision,
    p_longitud double precision,
    p_registrado_en timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_repartidor_id uuid;
    v_estado text;
    v_ultimo public.seguimiento_pedidos%ROWTYPE;
    v_distancia_m double precision;
    v_filas_insertadas integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Se requiere una sesión para registrar ubicaciones';
    END IF;

    IF p_latitud IS NULL OR p_longitud IS NULL
       OR p_latitud NOT BETWEEN -90 AND 90
       OR p_longitud NOT BETWEEN -180 AND 180
       OR p_registrado_en IS NULL
       OR p_registrado_en > pg_catalog.clock_timestamp() + interval '30 seconds'
       OR p_registrado_en < pg_catalog.clock_timestamp() - interval '5 minutes' THEN
        RAISE EXCEPTION 'La ubicación recibida no es válida o está vencida';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(p_pedido_id);

    SELECT pedidos.repartidor_id, pedidos.estado
      INTO v_repartidor_id, v_estado
      FROM public.pedidos
     WHERE pedidos.id = p_pedido_id;

    IF v_repartidor_id IS DISTINCT FROM auth.uid() OR v_estado IS DISTINCT FROM 'en_camino' THEN
        RETURN false;
    END IF;

    SELECT *
      INTO v_ultimo
      FROM public.seguimiento_pedidos
     WHERE pedido_id = p_pedido_id
     ORDER BY registrado_en DESC
     LIMIT 1;

    IF FOUND THEN
        IF p_registrado_en <= v_ultimo.registrado_en THEN
            RETURN false;
        END IF;

        v_distancia_m := 6371000 * 2 * pg_catalog.asin(
            pg_catalog.sqrt(
                pg_catalog.least(
                    1,
                    pg_catalog.power(pg_catalog.sin(pg_catalog.radians(p_latitud - v_ultimo.latitud) / 2), 2)
                    + pg_catalog.cos(pg_catalog.radians(v_ultimo.latitud))
                    * pg_catalog.cos(pg_catalog.radians(p_latitud))
                    * pg_catalog.power(pg_catalog.sin(pg_catalog.radians(p_longitud - v_ultimo.longitud) / 2), 2)
                )
            )
        );

        IF v_distancia_m < 20
           AND p_registrado_en < v_ultimo.registrado_en + interval '30 seconds' THEN
            RETURN false;
        END IF;
    END IF;

    INSERT INTO public.seguimiento_pedidos (pedido_id, latitud, longitud, registrado_en)
    VALUES (p_pedido_id, p_latitud, p_longitud, p_registrado_en)
    ON CONFLICT (pedido_id, registrado_en) DO NOTHING;
    GET DIAGNOSTICS v_filas_insertadas = ROW_COUNT;

    DELETE FROM public.seguimiento_pedidos
     WHERE seguimiento_pedidos.pedido_id = p_pedido_id
       AND seguimiento_pedidos.id IN (
           SELECT id
             FROM public.seguimiento_pedidos
            WHERE pedido_id = p_pedido_id
            ORDER BY registrado_en DESC
            OFFSET 1000
       );

    RETURN v_filas_insertadas > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_punto_seguimiento(bigint, double precision, double precision, timestamptz)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_punto_seguimiento(bigint, double precision, double precision, timestamptz)
    TO authenticated;

DO $publication$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'seguimiento_pedidos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.seguimiento_pedidos;
    END IF;
END;
$publication$;
