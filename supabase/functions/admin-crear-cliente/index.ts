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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return responder(405, { error: "Método no permitido." });
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
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

    const { data: perfilAdmin, error: errorPerfilAdmin } = await supabaseAdmin
      .from("perfiles")
      .select("rol")
      .eq("id", usuario.id)
      .maybeSingle();

    if (errorPerfilAdmin) {
      console.error(
        "No se pudo verificar el rol del operador:",
        errorPerfilAdmin,
      );
      return responder(500, {
        error: "No se pudo verificar el permiso de administración.",
      });
    }

    if (perfilAdmin?.rol !== "admin") {
      return responder(403, { error: "No tenés permiso para crear clientes." });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return responder(400, {
        error: "El cuerpo de la solicitud no es JSON válido.",
      });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return responder(400, { error: "Los datos del cliente no son válidos." });
    }

    const datos = body as Record<string, unknown>;
    const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
    const email = typeof datos.email === "string"
      ? datos.email.trim().toLowerCase()
      : "";
    const telefono = typeof datos.telefono === "string"
      ? datos.telefono.trim()
      : "";
    const password = typeof datos.password === "string" ? datos.password : "";

    if (!nombre || nombre.length > 100) {
      return responder(400, {
        error: "Ingresá un nombre de hasta 100 caracteres.",
      });
    }

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return responder(400, { error: "Ingresá un email válido." });
    }

    if (password.length < 6 || password.length > 128) {
      return responder(400, {
        error: "La contraseña debe tener entre 6 y 128 caracteres.",
      });
    }

    if (telefono.length > 30) {
      return responder(400, {
        error: "El teléfono supera el largo permitido.",
      });
    }

    const { data: usuarioCreado, error: errorCrearUsuario } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre_cliente: nombre,
          telefono,
        },
      });

    if (errorCrearUsuario || !usuarioCreado.user) {
      console.error(
        "No se pudo crear la cuenta del cliente:",
        errorCrearUsuario,
      );
      const emailDuplicado =
        errorCrearUsuario?.message.toLowerCase().includes("already") ||
        errorCrearUsuario?.message.toLowerCase().includes("registered");
      return responder(emailDuplicado ? 409 : 400, {
        error: emailDuplicado
          ? "Ya existe una cuenta con ese email."
          : "No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.",
      });
    }

    const nuevoUsuario = usuarioCreado.user;
    const { error: errorPerfil } = await supabaseAdmin.from("perfiles").insert({
      id: nuevoUsuario.id,
      nombre_cliente: nombre,
      email,
      telefono: telefono || null,
      rol: "cliente",
      puntos_acumulados: 500,
      puntos_disponibles: 500,
      activo: true,
      ultimo_acceso: new Date().toISOString(),
    });

    if (errorPerfil) {
      console.error("No se pudo crear el perfil del cliente:", errorPerfil);
      const { error: errorRollback } = await supabaseAdmin.auth.admin
        .deleteUser(nuevoUsuario.id);
      if (errorRollback) {
        console.error(
          "No se pudo revertir la cuenta creada sin perfil:",
          errorRollback,
        );
      }
      return responder(500, {
        error: "No se pudo completar el alta del cliente.",
      });
    }

    const { error: errorHistorial } = await supabaseAdmin.from(
      "historial_puntos",
    ).insert({
      usuario_id: nuevoUsuario.id,
      tipo: "bonus_bienvenida",
      puntos: 500,
      descripcion: "Bonus de bienvenida al registrarte 🎉",
    });

    if (errorHistorial) {
      console.warn(
        "No se pudo registrar el bonus de bienvenida:",
        errorHistorial,
      );
    }

    return responder(201, { success: true, userId: nuevoUsuario.id });
  } catch (error) {
    console.error("Error interno creando cliente:", error);
    return responder(500, { error: "Ocurrió un error al crear el cliente." });
  }
});
