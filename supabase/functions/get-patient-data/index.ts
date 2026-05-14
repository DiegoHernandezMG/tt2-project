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

  // Verify caller is an active admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "No autorizado." }, 401);

  const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Token inválido." }, 401);

  const { data: admin } = await serviceClient
    .from("admins")
    .select("is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!admin?.is_active) return json({ error: "Acceso denegado." }, 403);

  const { userId } = await req.json();
  if (!userId) return json({ error: "userId requerido." }, 400);

  const now = new Date();
  const dow = now.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const [
    { data: evaluaciones },
    { data: niveles },
    { data: respuestas },
    { data: metricas },
    { data: accesos },
    { data: sesionFinal },
    { data: emociones },
  ] = await Promise.all([
    serviceClient
      .from("evaluaciones_internivel")
      .select("nivel, oasis_total, odsis_total, baseline_oasis, baseline_odsis, bienestar_score, enviada, enviada_en")
      .eq("id_usuario", userId)
      .order("nivel", { ascending: true }),

    serviceClient
      .from("intervencion_niveles_progreso")
      .select("nivel, pantalla_actual, completado, desbloqueado_siguiente, primer_acceso_en, ultimo_acceso_en, completado_en")
      .eq("id_usuario", userId)
      .order("nivel", { ascending: true }),

    serviceClient
      .from("intervencion_ejercicios_respuestas")
      .select("nivel, ejercicio_codigo, completado, completado_en, duracion_segundos")
      .eq("id_usuario", userId)
      .eq("completado", true)
      .order("completado_en", { ascending: false }),

    serviceClient
      .from("intervencion_metricas_nivel")
      .select("nivel, dias_acceso, porcentaje_ejercicios, resumen_adherencia_ia, tendencia_emocional_ia, recomendacion_ia, indicadores_json")
      .eq("id_usuario", userId)
      .order("nivel", { ascending: false })
      .limit(1),

    serviceClient
      .from("intervencion_accesos_nivel")
      .select("total_accesos")
      .eq("id_usuario", userId),

    serviceClient
      .from("sesiones_evaluacion")
      .select("tipo_sesion, completada_en")
      .eq("id_usuario", userId)
      .eq("tipo_sesion", "final")
      .maybeSingle(),

    serviceClient
      .from("seguimiento_diario")
      .select("emocion_clave, emocion_etiqueta, intensidad, fecha, registrado_en")
      .eq("id_usuario", userId)
      .gte("fecha", mondayStr)
      .lte("fecha", sundayStr)
      .order("registrado_en", { ascending: false }),
  ]);

  const totalAccesos = (accesos ?? []).reduce(
    (sum: number, row: { total_accesos: number }) => sum + (row.total_accesos ?? 0),
    0,
  );

  const { data: { user: authUser } } = await serviceClient.auth.admin.getUserById(userId);

  return json({
    evaluaciones: evaluaciones ?? [],
    niveles: niveles ?? [],
    respuestas: respuestas ?? [],
    metricas: metricas ?? [],
    totalAccesos,
    sesionFinal: sesionFinal ?? null,
    emocionesSemanales: emociones ?? [],
    email: authUser?.email ?? null,
  });
});
