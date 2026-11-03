DROP POLICY IF EXISTS "Repartidores pueden iniciar y actualizar sus entregas"
    ON public.pedidos;

CREATE OR REPLACE FUNCTION public.actualizar_pedido_repartidor(
    p_pedido_id bigint,
    p_latitud double precision,
    p_longitud double precision,
    p_reanudar boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_usuario_id uuid := auth.uid();
    v_perfil public.perfiles%ROWTYPE;
    v_filas_actualizadas integer;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere una sesión para actualizar el pedido';
    END IF;

    SELECT *
      INTO v_perfil
      FROM public.perfiles
     WHERE id = v_usuario_id
       AND rol = 'repartidor';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solo un repartidor puede iniciar o reanudar una entrega';
    END IF;

    IF p_pedido_id IS NULL
       OR p_latitud IS NULL
       OR p_longitud IS NULL
       OR p_latitud NOT BETWEEN -90 AND 90
       OR p_longitud NOT BETWEEN -180 AND 180 THEN
        RAISE EXCEPTION 'Los datos del pedido o la ubicación no son válidos';
    END IF;

    IF p_reanudar THEN
        UPDATE public.pedidos
           SET lat_repartidor = p_latitud,
               repartidor_de_lng = p_longitud
         WHERE id = p_pedido_id
           AND estado IN ('en_camino', 'en camino')
           AND repartidor_id = v_usuario_id;
    ELSE
        UPDATE public.pedidos
           SET estado = 'en_camino',
               repartidor_id = v_usuario_id,
               encabezado_repartidor = COALESCE(v_perfil.nombre_cliente, 'Repartidor Krusty'),
               telefono_repartidor = v_perfil.telefono,
               lat_repartidor = p_latitud,
               repartidor_de_lng = p_longitud
         WHERE id = p_pedido_id
           AND estado = 'listo'
           AND (
               repartidor_id IS NULL
               OR repartidor_id = v_usuario_id
           );
    END IF;

    GET DIAGNOSTICS v_filas_actualizadas = ROW_COUNT;
    RETURN v_filas_actualizadas > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.actualizar_pedido_repartidor(bigint, double precision, double precision, boolean)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_pedido_repartidor(bigint, double precision, double precision, boolean)
    TO authenticated;

CREATE OR REPLACE FUNCTION public.confirmar_entrega_repartidor(p_pedido_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_usuario_id uuid := auth.uid();
    v_filas_actualizadas integer;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere una sesión para confirmar la entrega';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.perfiles
        WHERE id = v_usuario_id
          AND rol = 'repartidor'
    ) THEN
        RAISE EXCEPTION 'Solo un repartidor puede confirmar la entrega';
    END IF;

    IF p_pedido_id IS NULL THEN
        RAISE EXCEPTION 'El pedido indicado no es válido';
    END IF;

    UPDATE public.pedidos
       SET estado = 'entregado'
     WHERE id = p_pedido_id
       AND estado IN ('en_camino', 'en camino')
       AND repartidor_id = v_usuario_id;

    GET DIAGNOSTICS v_filas_actualizadas = ROW_COUNT;
    RETURN v_filas_actualizadas > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirmar_entrega_repartidor(bigint)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_entrega_repartidor(bigint)
    TO authenticated;
