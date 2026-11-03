CREATE TABLE IF NOT EXISTS public.notification_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id bigint NOT NULL,
    usuario_id uuid NOT NULL,
    estado text NOT NULL,
    enviado_en timestamptz NOT NULL DEFAULT pg_catalog.now(),
    error text
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.notification_logs FROM PUBLIC, anon, authenticated;

DO $patch$
DECLARE
    v_definicion_funcion text;
BEGIN
    SELECT pg_catalog.pg_get_functiondef(
        'public.enviar_notificacion_cambio_estado()'::pg_catalog.regprocedure
    )
      INTO v_definicion_funcion;

    v_definicion_funcion := pg_catalog.replace(
        v_definicion_funcion,
        'INSERT INTO notification_logs',
        'INSERT INTO public.notification_logs'
    );

    IF v_definicion_funcion NOT LIKE '%INSERT INTO public.notification_logs%' THEN
        RAISE EXCEPTION
            'No se encontró la referencia a notification_logs en public.enviar_notificacion_cambio_estado()';
    END IF;

    EXECUTE v_definicion_funcion;
END;
$patch$;
