import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "SerenaMente <noreply@serenamente2.com>";
const REDIRECT_TO = "https://tt2-project.vercel.app/mobile-verify-email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, metadata } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Correo y contraseña son obligatorios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    if (!serviceRoleKey || !resendApiKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user without email confirmation
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: metadata ?? {},
    });

    if (createError && !createError.message.includes("already been registered")) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate signup verification link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { redirectTo: REDIRECT_TO },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return new Response(
        JSON.stringify({ error: "No se pudo generar el enlace de verificación." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const verificationLink = linkData.properties.action_link;
    const nombre = metadata?.nombre ?? "";

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirma tu correo — SerenaMente</title>
</head>
<body style="margin:0;padding:0;background:#f4ece4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ece4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#410f7a;padding:32px 40px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">SerenaMente</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Confirma tu correo electrónico</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#8b7b6b;font-weight:600;">Verificación de cuenta</p>
              <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;font-weight:700;line-height:1.3;">
                ${nombre ? `Hola, ${nombre}` : "¡Ya casi estás listo!"}
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4a4a5a;line-height:1.6;">
                Gracias por registrarte en <strong>SerenaMente</strong>. Para activar tu cuenta haz clic en el siguiente botón.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#410f7a;border-radius:12px;padding:14px 28px;">
                    <a href="${verificationLink}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:block;">
                      Confirmar correo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#8b7b6b;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;font-size:12px;color:#410f7a;word-break:break-all;background:#f4ece4;padding:10px 12px;border-radius:8px;">
                ${verificationLink}
              </p>

              <p style="margin:0;font-size:13px;color:#8b7b6b;line-height:1.5;">
                Si no creaste esta cuenta, puedes ignorar este correo.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #ede5db;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#a89888;">
                © ${new Date().getFullYear()} SerenaMente — Bienestar emocional basado en evidencia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email.trim().toLowerCase()],
        subject: "Confirma tu correo — SerenaMente",
        html,
      }),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error interno: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
