CREATE OR REPLACE FUNCTION public.otorgar_puntos_pedido(pedido_id bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_usuario_id uuid;
    v_total double precision;
    v_puntos integer;
BEGIN
    SELECT p.id_de_usuario, p.total
      INTO v_usuario_id, v_total
      FROM public.pedidos AS p
     WHERE p.id = pedido_id;

    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Pedido no encontrado o sin usuario asociado';
    END IF;

    v_puntos := pg_catalog.floor(v_total / 100)::integer;

    IF v_puntos = 0 THEN
        RETURN 0;
    END IF;

    UPDATE public.perfiles
       SET puntos_acumulados = puntos_acumulados + v_puntos
     WHERE id = v_usuario_id;

    RETURN v_puntos;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_otorgar_puntos_al_entregar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.estado = 'entregado' AND OLD.estado IS DISTINCT FROM 'entregado' THEN
        PERFORM public.otorgar_puntos_pedido(NEW.id);
    END IF;

    RETURN NEW;
END;
$function$;
