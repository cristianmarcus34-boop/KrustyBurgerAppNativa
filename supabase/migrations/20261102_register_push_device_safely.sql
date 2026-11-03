CREATE OR REPLACE FUNCTION public.registrar_dispositivo_push(
    p_expo_push_token text,
    p_plataforma text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_usuario_id uuid := auth.uid();
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere una sesión para registrar el dispositivo';
    END IF;

    IF p_expo_push_token IS NULL
       OR pg_catalog.length(p_expo_push_token) < 20
       OR pg_catalog.length(p_expo_push_token) > 512
       OR p_plataforma IS NULL
       OR pg_catalog.length(p_plataforma) > 20 THEN
        RAISE EXCEPTION 'Los datos del dispositivo no son válidos';
    END IF;

    INSERT INTO public.dispositivos_push (
        expo_push_token,
        usuario_actual_id,
        plataforma,
        activo,
        ultima_actividad
    )
    VALUES (
        p_expo_push_token,
        v_usuario_id,
        p_plataforma,
        true,
        pg_catalog.clock_timestamp()
    )
    ON CONFLICT (expo_push_token) DO UPDATE
       SET usuario_actual_id = EXCLUDED.usuario_actual_id,
           plataforma = EXCLUDED.plataforma,
           activo = true,
           ultima_actividad = EXCLUDED.ultima_actividad;

    RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_dispositivo_push(text, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_dispositivo_push(text, text)
    TO authenticated;
