import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Correo y contraseña son obligatorios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate invitation exists and is pending
    const { data: admin, error: lookupError } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("username", email.trim().toLowerCase())
      .maybeSingle();

    if (lookupError) {
      return new Response(
        JSON.stringify({ error: "No se pudo validar la invitación." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!admin) {
      return new Response(
        JSON.stringify({ error: "No existe una invitación para este correo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (admin.is_active) {
      return new Response(
        JSON.stringify({ error: "Esta cuenta ya fue activada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fullName = `${admin.nombre || ""} ${admin.apellido || ""}`.trim();
    const userMetadata = {
      role: admin.role,
      status: "ACTIVE",
      full_name: fullName,
    };

    let userId: string;

    // Try to create the auth user
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (!createError) {
      userId = createData.user.id;
    } else {
      // User already exists in auth — find them and update their password
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase(),
      );

      if (!existing) {
        return new Response(
          JSON.stringify({ error: "No se pudo crear ni encontrar la cuenta." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password, user_metadata: userMetadata },
      );

      if (updateAuthError) {
        return new Response(
          JSON.stringify({ error: "No se pudo actualizar la contraseña." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = existing.id;
    }

    // Activate admin record
    await supabaseAdmin
      .from("admins")
      .update({ is_active: true, auth_user_id: userId })
      .eq("id_admin", admin.id_admin);

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error interno: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
