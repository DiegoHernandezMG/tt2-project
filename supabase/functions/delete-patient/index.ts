import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://socequdueibpqilbqwgx.supabase.co";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "Configuración incompleta en el servidor." }, 500);

  const serviceClient = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });

  // Verify caller is an active SUPER_ADMIN
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "No autorizado." }, 401);

  const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Token inválido." }, 401);

  const { data: admin } = await serviceClient
    .from("admins")
    .select("is_active, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!admin?.is_active) return json({ error: "Acceso denegado." }, 403);
  if (admin.role !== "SUPER_ADMIN") return json({ error: "Solo un SUPER_ADMIN puede eliminar pacientes." }, 403);

  const { userId } = await req.json();
  if (!userId) return json({ error: "userId requerido." }, 400);

  // Paso 1: Obtener IDs de sesiones del paciente
  const { data: sesiones } = await serviceClient
    .from("sesiones_evaluacion")
    .select("id")
    .eq("id_usuario", userId);

  const sessionIds = (sesiones ?? []).map((s: { id: string }) => s.id);

  // Paso 2: Borrar tablas que dependen de id_sesion
  if (sessionIds.length > 0) {
    await Promise.all([
      serviceClient.from("respuestas").delete().in("id_sesion", sessionIds),
      serviceClient.from("progreso_instrumento").delete().in("id_sesion", sessionIds),
      serviceClient.from("puntajes").delete().in("id_sesion", sessionIds),
      serviceClient.from("banderas_riesgo").delete().in("id_sesion", sessionIds),
    ]);
  }

  // Paso 3: Borrar tablas por id_usuario
  await Promise.all([
    serviceClient.from("seguimiento_diario").delete().eq("id_usuario", userId),
    serviceClient.from("evaluaciones_internivel").delete().eq("id_usuario", userId),
    serviceClient.from("intervencion_accesos_nivel").delete().eq("id_usuario", userId),
    serviceClient.from("intervencion_niveles_progreso").delete().eq("id_usuario", userId),
    serviceClient.from("intervencion_pantallas_estado").delete().eq("id_usuario", userId),
    serviceClient.from("intervencion_ejercicios_respuestas").delete().eq("id_usuario", userId),
    serviceClient.from("intervencion_metricas_nivel").delete().eq("id_usuario", userId),
    serviceClient.from("actividad_usuario").delete().eq("id_usuario", userId),
    serviceClient.from("eventos_canalizacion").delete().eq("id_usuario", userId),
    serviceClient.from("sesiones_evaluacion").delete().eq("id_usuario", userId),
  ]);

  // Paso 4: Borrar emotion_diary_entries (columna user_id)
  await serviceClient.from("emotion_diary_entries").delete().eq("user_id", userId);

  // Paso 5: Borrar perfil
  await serviceClient.from("perfiles").delete().eq("id_usuario", userId);

  // Paso 6: Eliminar usuario de auth.users
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: `Error al eliminar usuario: ${deleteError.message}` }, 500);

  return json({ success: true });
});
