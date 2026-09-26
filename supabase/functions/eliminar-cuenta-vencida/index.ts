import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en la Edge Function.",
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const responder = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: corsHeaders });

const datosUsuario = [
  { tabla: "pedidos", columnaUsuario: "id_de_usuario" },
  { tabla: "notificaciones", columnaUsuario: "usuario_id" },
  { tabla: "historial_puntos", columnaUsuario: "usuario_id" },
  { tabla: "canjes", columnaUsuario: "usuario_id" },
  { tabla: "favoritos", columnaUsuario: "usuario_id" },
] as const;

const restaurarSolicitudPendiente = async (solicitudId: string) => {
  const { error } = await supabaseAdmin
    .from("solicitudes_eliminacion")
    .update({
      estado: "pendiente",
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", solicitudId)
    .eq("estado", "completada");

  if (error) {
    console.error("No se pudo restaurar la solicitud de eliminación:", error);
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const token = request.headers
    .get("Authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return responder(401, { error: "Iniciá sesión para continuar." });
  }

  try {
    const { data: usuarioAutenticado, error: errorAutenticacion } =
      await supabaseAdmin.auth.getUser(token);
    const usuario = usuarioAutenticado.user;

    if (errorAutenticacion || !usuario) {
      return responder(401, { error: "La sesión no es válida o venció." });
    }

    const ahora = new Date();
    const { data: solicitud, error: errorSolicitud } = await supabaseAdmin
      .from("solicitudes_eliminacion")
      .select("id, fecha_eliminacion")
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente")
      .order("fecha_solicitud", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorSolicitud) {
      console.error("No se pudo verificar la solicitud de eliminación:", errorSolicitud);
      return responder(500, { error: "No se pudo verificar la solicitud." });
    }

    if (!solicitud) {
      return responder(200, { deleted: false });
    }

    const fechaEliminacion = Date.parse(solicitud.fecha_eliminacion);
    if (!Number.isFinite(fechaEliminacion)) {
      console.error("La solicitud tiene una fecha de eliminación no válida.");
      return responder(500, { error: "La fecha de eliminación no es válida." });
    }

    if (fechaEliminacion > ahora.getTime()) {
      return responder(200, { deleted: false });
    }

    const { data: solicitudProcesada, error: errorReclamo } = await supabaseAdmin
      .from("solicitudes_eliminacion")
      .update({
        estado: "completada",
        actualizado_en: ahora.toISOString(),
      })
      .eq("id", solicitud.id)
      .eq("usuario_id", usuario.id)
      .eq("estado", "pendiente")
      .lte("fecha_eliminacion", ahora.toISOString())
      .select("id")
      .maybeSingle();

    if (errorReclamo) {
      console.error("No se pudo procesar la solicitud vencida:", errorReclamo);
      return responder(500, { error: "No se pudo procesar la solicitud." });
    }

    if (!solicitudProcesada) {
      return responder(200, { deleted: false });
    }

    for (const { tabla, columnaUsuario } of datosUsuario) {
      const { error } = await supabaseAdmin
        .from(tabla)
        .delete()
        .eq(columnaUsuario, usuario.id);

      if (error) {
        console.error(`No se pudieron eliminar los datos de ${tabla}:`, error);
        await restaurarSolicitudPendiente(solicitud.id);
        return responder(500, {
          error: "No se pudieron eliminar todos los datos de la cuenta.",
        });
      }
    }

    const { error: errorPerfil } = await supabaseAdmin
      .from("perfiles")
      .delete()
      .eq("id", usuario.id);

    if (errorPerfil) {
      console.error("No se pudo eliminar el perfil:", errorPerfil);
      await restaurarSolicitudPendiente(solicitud.id);
      return responder(500, { error: "No se pudo eliminar el perfil." });
    }

    const { error: errorUsuario } = await supabaseAdmin.auth.admin.deleteUser(
      usuario.id,
    );

    if (errorUsuario) {
      console.error("No se pudo eliminar el usuario de Auth:", errorUsuario);
      await restaurarSolicitudPendiente(solicitud.id);
      return responder(500, { error: "No se pudo eliminar la cuenta." });
    }

    return responder(200, { deleted: true });
  } catch (error) {
    console.error("Error interno al eliminar la cuenta vencida:", error);
    return responder(500, { error: "Ocurrió un error al eliminar la cuenta." });
  }
});
