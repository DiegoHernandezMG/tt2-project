import { adminSupabase } from "../lib/supabase-admin";

const buildFullName = (nombre, apellidos) =>
  [nombre, apellidos]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

export const listDashboardProfiles = async () => {
  const { data, error } = await adminSupabase
    .from("perfiles")
    .select(
      `id_usuario, nombre, apellidos, fecha_nacimiento, es_mayor_edad,
       onboarding_completado_en, sexo, lugar_residencia,
       total_conexiones, usuario_activo, creado_en`,
    )
    .order("nombre", { ascending: true })
    .order("apellidos", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar perfiles: ${error.message}`);

  return (data || []).map((item) => ({
    id_usuario: item.id_usuario,
    nombre: item.nombre ?? "",
    apellidos: item.apellidos ?? "",
    fullName: buildFullName(item.nombre, item.apellidos) || "Sin nombre",
    fecha_nacimiento: item.fecha_nacimiento ?? null,
    es_mayor_edad: item.es_mayor_edad ?? null,
    onboarding_completado_en: item.onboarding_completado_en ?? null,
    sexo: item.sexo ?? null,
    lugar_residencia: item.lugar_residencia ?? null,
    total_conexiones: item.total_conexiones ?? 0,
    usuario_activo: item.usuario_activo ?? false,
    creado_en: item.creado_en ?? null,
  }));
};

export const getPatientData = async (userId) => {
  const session = await adminSupabase.auth.getSession();
  const accessToken = session?.data?.session?.access_token;

  const res = await fetch(
    `${adminSupabase.supabaseUrl}/functions/v1/get-patient-data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ userId }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudieron cargar los datos del paciente.");
  return data;
};
