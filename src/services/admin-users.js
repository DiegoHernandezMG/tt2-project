import { adminSupabase, adminSupabaseAnonKey } from "../lib/supabase-admin";
import { ADMIN_ROLES, ADMIN_STATUS } from "../constants/admin";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const splitFullName = (fullName) => {
  const clean = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!clean) return { nombre: "", apellido: "" };
  const [nombre, ...rest] = clean.split(" ");
  return { nombre, apellido: rest.join(" ") };
};

const nowIso = () => new Date().toISOString();

const createToken = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `token-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};
const isMissingColumnError = (error) =>
  /column .* does not exist/i.test(String(error?.message || ""));
const isForeignKeyViolationError = (error) =>
  error?.code === "23503" || /foreign key constraint/i.test(String(error?.message || ""));

const appendAuditLog = (event) => {
  adminSupabase
    .from("audit_logs")
    .insert({
      action: event.action,
      actor_email: event.actorEmail,
      target_email: event.targetEmail ?? null,
      metadata: event.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.warn("audit_log insert failed:", error.message);
    });
};

export const updateAdminProfile = async ({ adminId, nombre, apellido }) => {
  const { error } = await adminSupabase
    .from("admins")
    .update({ nombre: String(nombre || "").trim(), apellido: String(apellido || "").trim() })
    .eq("id_admin", adminId);
  if (error) throw new Error(`No se pudo actualizar el perfil: ${error.message}`);
};

export const listAuditLogs = async ({ limit = 50 } = {}) => {
  const { data, error } = await adminSupabase
    .from("audit_logs")
    .select("id, action, actor_email, target_email, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`No se pudieron cargar los logs: ${error.message}`);
  return data ?? [];
};

const toProfile = (record) => {
  if (!record) return null;
  return {
    id: record.id,
    authUserId: record.authUserId ?? null,
    fullName: record.fullName ?? "",
    email: normalizeEmail(record.email),
    role: record.role ?? null,
    status: record.status ?? null,
    lastLoginAt: record.lastLoginAt ?? null,
  };
};

export const getCurrentAdminProfile = async (user) => {
  if (!user?.email) return null;

  const email = normalizeEmail(user.email);
  const { data, error } = await adminSupabase
    .from("admins")
    .select("*")
    .eq("username", email)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar el perfil admin en Supabase: ${error.message}`);
  }

  const deriveStatus = (row) => {
    if (row.is_active) return ADMIN_STATUS.ACTIVE;
    if (!row.auth_user_id) return ADMIN_STATUS.INVITED_PENDING;
    return ADMIN_STATUS.SUSPENDED;
  };

  const record = data
    ? {
        id: data.id_admin,
        authUserId: data.auth_user_id ?? null,
        fullName: `${data.nombre || ""} ${data.apellido || ""}`.trim(),
        email: normalizeEmail(data.username || ""),
        role: data.role ?? null,
        status: deriveStatus(data),
        lastLoginAt: data.last_login_at ?? null,
      }
    : null;

  if (!record) return null;

  return toProfile(record);
};

export const registerLoginEvent = async (user) => {
  if (!user?.email) return;

  const email = normalizeEmail(user.email);
  const { error: updateError } = await adminSupabase
    .from("admins")
    .update({
      auth_user_id: user.id,
      last_login_at: user.last_sign_in_at || nowIso(),
    })
    .eq("username", email);

  if (updateError && !isMissingColumnError(updateError)) {
    throw new Error(`No se pudo registrar último acceso en admins: ${updateError.message}`);
  }

  appendAuditLog({
    action: "LOGIN_SUCCESS",
    actorEmail: email,
    targetEmail: email,
    metadata: {},
  });
};

export const listAdminUsers = async ({ search = "" } = {}) => {
  const { data, error } = await adminSupabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `No se pudieron cargar usuarios desde Supabase (tabla admins): ${error.message}`,
    );
  }

  const deriveStatus = (row) => {
    if (row.is_active) return ADMIN_STATUS.ACTIVE;
    if (!row.auth_user_id) return ADMIN_STATUS.INVITED_PENDING;
    return ADMIN_STATUS.SUSPENDED;
  };

  const users = (data || []).map((item) => ({
    id: item.id_admin,
    authUserId: item.auth_user_id ?? null,
    fullName: `${item.nombre || ""} ${item.apellido || ""}`.trim(),
    email: normalizeEmail(item.username || ""),
    role: item.role ?? null,
    status: deriveStatus(item),
    createdAt: item.created_at ?? null,
    lastLoginAt: item.last_login_at ?? null,
  }));

  const query = search.trim().toLowerCase();

  const filtered = !query
    ? users
    : users.filter((item) => {
        const text = `${item.fullName || ""} ${item.email || ""} ${item.role || ""}`.toLowerCase();
        return text.includes(query);
      });

  return filtered
    .sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
};

export const inviteAdminUser = async ({ fullName, email, role, invitedBy }) => {
  const parsedEmail = normalizeEmail(email);
  const parsedName = String(fullName || "").trim();
  const parsedRole =
    role === ADMIN_ROLES.SUPER_ADMIN ? ADMIN_ROLES.SUPER_ADMIN : ADMIN_ROLES.ADMIN;
  const inviterEmail = normalizeEmail(invitedBy);

  if (!parsedName) {
    throw new Error("El nombre es obligatorio.");
  }
  if (!parsedEmail) {
    throw new Error("El correo es obligatorio.");
  }
  if (parsedRole === ADMIN_ROLES.SUPER_ADMIN) {
    if (!inviterEmail) {
      throw new Error("No se pudo validar quién envía la invitación.");
    }
    const { data: inviter, error: inviterError } = await adminSupabase
      .from("admins")
      .select("role, is_active")
      .eq("username", inviterEmail)
      .maybeSingle();
    if (inviterError) {
      throw new Error(`No se pudo validar permisos del invitador: ${inviterError.message}`);
    }
    const canInviteSuperAdmin =
      inviter?.is_active && inviter?.role === ADMIN_ROLES.SUPER_ADMIN;
    if (!canInviteSuperAdmin) {
      throw new Error("Solo un SUPER_ADMIN activo puede invitar a otro SUPER_ADMIN.");
    }
  }

  const { data: existing, error: lookupError } = await adminSupabase
    .from("admins")
    .select("id_admin")
    .eq("username", parsedEmail)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`No se pudo validar correo en Supabase: ${lookupError.message}`);
  }
  if (existing) {
    throw new Error("Ya existe una cuenta con este correo.");
  }

  const { nombre, apellido } = splitFullName(parsedName);
  const newAdminRow = {
    id_admin: createToken(),
    nombre,
    apellido,
    username: parsedEmail,
    role: parsedRole,
    is_active: false,
  };
  const { error: insertError } = await adminSupabase
    .from("admins")
    .insert(newAdminRow);
  if (insertError) {
    throw new Error(`No se pudo crear la invitación en Supabase: ${insertError.message}`);
  }

  const newUser = {
    id: newAdminRow.id_admin,
    authUserId: null,
    fullName: parsedName,
    email: parsedEmail,
    role: parsedRole,
    status: ADMIN_STATUS.INVITED_PENDING,
    invitationToken: null,
    invitedBy: normalizeEmail(invitedBy),
    invitedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastLoginAt: null,
  };

  appendAuditLog({
    action: "INVITE_SENT",
    actorEmail: inviterEmail,
    targetEmail: parsedEmail,
    metadata: { role: parsedRole },
  });

  const activationLink = `${window.location.origin}/admin/activate?email=${encodeURIComponent(parsedEmail)}`;

  let emailSent = false;
  let emailError = null;
  try {
    const fnUrl = `${adminSupabase.supabaseUrl}/functions/v1/send-invitation-email`;
    const session = await adminSupabase.auth.getSession();
    const accessToken = session?.data?.session?.access_token;

    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        email: parsedEmail,
        fullName: parsedName,
        activationLink,
      }),
    });

    const resData = await res.json();
    if (res.ok && resData.success) {
      emailSent = true;
    } else {
      emailError = resData.error || "No se pudo enviar el correo.";
    }
  } catch (fetchError) {
    emailError = fetchError.message;
  }

  return {
    user: newUser,
    activationLink,
    emailSent,
    emailError,
  };
};

export const deleteAdminUser = async ({ targetAdminId, actorEmail }) => {
  const parsedTargetId = String(targetAdminId || "").trim();
  const parsedActorEmail = normalizeEmail(actorEmail);

  if (!parsedTargetId) {
    throw new Error("No se pudo identificar el usuario a eliminar.");
  }
  if (!parsedActorEmail) {
    throw new Error("No se pudo validar quién solicita la eliminación.");
  }

  const { data: actor, error: actorError } = await adminSupabase
    .from("admins")
    .select("role, is_active")
    .eq("username", parsedActorEmail)
    .maybeSingle();
  if (actorError) {
    throw new Error(`No se pudo validar permisos del solicitante: ${actorError.message}`);
  }
  if (!actor?.is_active || actor?.role !== ADMIN_ROLES.SUPER_ADMIN) {
    throw new Error("Solo un SUPER_ADMIN activo puede eliminar cuentas ADMIN.");
  }

  const { data: target, error: targetError } = await adminSupabase
    .from("admins")
    .select("id_admin, username, role")
    .eq("id_admin", parsedTargetId)
    .maybeSingle();
  if (targetError) {
    throw new Error(`No se pudo validar el usuario objetivo: ${targetError.message}`);
  }
  if (!target) {
    throw new Error("El usuario ya no existe o fue eliminado previamente.");
  }
  if (target.role !== ADMIN_ROLES.ADMIN) {
    throw new Error("Solo se pueden eliminar cuentas con rol ADMIN.");
  }

  const { data: deletedRows, error: deleteError } = await adminSupabase
    .from("admins")
    .delete()
    .eq("id_admin", parsedTargetId)
    .select("id_admin");
  if (deleteError) {
    throw new Error(`No se pudo eliminar la cuenta en Supabase: ${deleteError.message}`);
  }
  if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
    throw new Error(
      "Supabase no eliminó la cuenta. Revisa políticas RLS/permisos de DELETE en la tabla admins.",
    );
  }

  appendAuditLog({
    action: "ADMIN_DELETED",
    actorEmail: parsedActorEmail,
    targetEmail: normalizeEmail(target.username || ""),
    metadata: {
      role: target.role,
      targetAdminId: parsedTargetId,
    },
  });

  return {
    id: parsedTargetId,
    email: normalizeEmail(target.username || ""),
    role: target.role,
  };
};

export const suspendAdminUser = async ({ targetAdminId, actorEmail }) => {
  const parsedActorEmail = normalizeEmail(actorEmail);
  const parsedTargetId = String(targetAdminId || "").trim();

  const { data: actor, error: actorError } = await adminSupabase
    .from("admins")
    .select("role, is_active")
    .eq("username", parsedActorEmail)
    .maybeSingle();
  if (actorError) throw new Error(`No se pudo validar permisos: ${actorError.message}`);
  if (!actor?.is_active || actor?.role !== ADMIN_ROLES.SUPER_ADMIN) {
    throw new Error("Solo un SUPER_ADMIN activo puede suspender cuentas.");
  }

  const { data: target, error: targetError } = await adminSupabase
    .from("admins")
    .select("id_admin, username, role, is_active, auth_user_id")
    .eq("id_admin", parsedTargetId)
    .maybeSingle();
  if (targetError) throw new Error(`No se pudo validar el usuario: ${targetError.message}`);
  if (!target) throw new Error("El usuario no existe.");
  if (target.role !== ADMIN_ROLES.ADMIN) throw new Error("Solo se pueden suspender cuentas ADMIN.");
  if (!target.is_active) throw new Error("La cuenta ya está suspendida o pendiente.");

  const { error: updateError } = await adminSupabase
    .from("admins")
    .update({ is_active: false })
    .eq("id_admin", parsedTargetId);
  if (updateError) throw new Error(`No se pudo suspender la cuenta: ${updateError.message}`);

  appendAuditLog({
    action: "ADMIN_SUSPENDED",
    actorEmail: parsedActorEmail,
    targetEmail: normalizeEmail(target.username),
    metadata: { targetAdminId: parsedTargetId },
  });

  return { id: parsedTargetId, email: normalizeEmail(target.username) };
};

export const reactivateAdminUser = async ({ targetAdminId, actorEmail }) => {
  const parsedActorEmail = normalizeEmail(actorEmail);
  const parsedTargetId = String(targetAdminId || "").trim();

  const { data: actor, error: actorError } = await adminSupabase
    .from("admins")
    .select("role, is_active")
    .eq("username", parsedActorEmail)
    .maybeSingle();
  if (actorError) throw new Error(`No se pudo validar permisos: ${actorError.message}`);
  if (!actor?.is_active || actor?.role !== ADMIN_ROLES.SUPER_ADMIN) {
    throw new Error("Solo un SUPER_ADMIN activo puede reactivar cuentas.");
  }

  const { data: target, error: targetError } = await adminSupabase
    .from("admins")
    .select("id_admin, username, role, is_active, auth_user_id")
    .eq("id_admin", parsedTargetId)
    .maybeSingle();
  if (targetError) throw new Error(`No se pudo validar el usuario: ${targetError.message}`);
  if (!target) throw new Error("El usuario no existe.");
  if (target.role !== ADMIN_ROLES.ADMIN) throw new Error("Solo se pueden reactivar cuentas ADMIN.");
  if (target.is_active) throw new Error("La cuenta ya está activa.");
  if (!target.auth_user_id) throw new Error("Esta cuenta nunca fue activada. Usa 'Reenviar' para enviar la invitación.");

  const { error: updateError } = await adminSupabase
    .from("admins")
    .update({ is_active: true })
    .eq("id_admin", parsedTargetId);
  if (updateError) throw new Error(`No se pudo reactivar la cuenta: ${updateError.message}`);

  appendAuditLog({
    action: "ADMIN_REACTIVATED",
    actorEmail: parsedActorEmail,
    targetEmail: normalizeEmail(target.username),
    metadata: { targetAdminId: parsedTargetId },
  });

  return { id: parsedTargetId, email: normalizeEmail(target.username) };
};

export const resendInvitationEmail = async ({ email, fullName }) => {
  const parsedEmail = normalizeEmail(email);
  if (!parsedEmail) throw new Error("Correo obligatorio.");

  const { data: admin, error: lookupError } = await adminSupabase
    .from("admins")
    .select("is_active")
    .eq("username", parsedEmail)
    .maybeSingle();

  if (lookupError) throw new Error(`No se pudo validar el usuario: ${lookupError.message}`);
  if (!admin) throw new Error("No existe una invitación para este correo.");
  if (admin.is_active) throw new Error("Esta cuenta ya fue activada.");

  const activationLink = `${window.location.origin}/admin/activate?email=${encodeURIComponent(parsedEmail)}`;

  const fnUrl = `${adminSupabase.supabaseUrl}/functions/v1/send-invitation-email`;
  const session = await adminSupabase.auth.getSession();
  const accessToken = session?.data?.session?.access_token;

  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ email: parsedEmail, fullName, activationLink }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || "No se pudo reenviar el correo.");
  }

  return { activationLink };
};

export const activateAdminInvitation = async ({ email, password }) => {
  const parsedEmail = normalizeEmail(email);

  if (!parsedEmail) {
    throw new Error("Correo obligatorio.");
  }

  const fnUrl = `${adminSupabase.supabaseUrl}/functions/v1/activate-admin-account`;
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminSupabaseAnonKey}`,
    },
    body: JSON.stringify({ email: parsedEmail, password }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || "No se pudo activar la cuenta.");
  }

  appendAuditLog({
    action: "INVITE_ACTIVATED",
    actorEmail: parsedEmail,
    targetEmail: parsedEmail,
    metadata: {},
  });

  return {
    user: {
      authUserId: resData.userId,
      email: parsedEmail,
    },
  };
};
