import { useEffect, useMemo, useState } from "react";
import AdminTopbar from "../../../components/admin-topbar/admin-topbar";
import {
  ADMIN_ROLES,
  ADMIN_STATUS,
  ADMIN_ROLE_LABELS,
  ADMIN_STATUS_LABELS,
} from "../../../constants/admin";
import {
  deleteAdminUser,
  inviteAdminUser,
  listAdminUsers,
  listAuditLogs,
  reactivateAdminUser,
  resendInvitationEmail,
  suspendAdminUser,
} from "../../../services/admin-users";
import { useAuth } from "../../../hooks/use-auth";
import "./users.css";

const AUDIT_ACTION_LABELS = {
  LOGIN_SUCCESS: "Inicio de sesión",
  INVITE_SENT: "Invitación enviada",
  INVITE_ACTIVATED: "Cuenta activada",
  ADMIN_DELETED: "Admin eliminado",
  ADMIN_SUSPENDED: "Admin suspendido",
  ADMIN_REACTIVATED: "Admin reactivado",
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};


function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [invitationResult, setInvitationResult] = useState(null);
  const [inviteRole, setInviteRole] = useState(ADMIN_ROLES.ADMIN);
  const [resendState, setResendState] = useState({});
  const [suspendState, setSuspendState] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAdminUsers({ search });
      setRows(result);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await listAuditLogs();
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const stats = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "ACTIVE") acc.active += 1;
        if (row.status === "INVITED_PENDING") acc.pending += 1;
        return acc;
      },
      { total: 0, active: 0, pending: 0 },
    );
  }, [rows]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setDeleteResult("");
    setInvitationResult(null);
    try {
      const result = await inviteAdminUser({
        fullName,
        email,
        role: inviteRole,
        invitedBy: user?.email,
      });
      setInvitationResult(result);
      setFullName("");
      setEmail("");
      await loadUsers();
      loadAuditLogs();
    } catch (inviteError) {
      setError(inviteError.message || "No se pudo enviar la invitación.");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (row) => {
    setResendState((prev) => ({ ...prev, [row.id]: { sending: true, sent: false, error: null } }));
    try {
      await resendInvitationEmail({ email: row.email, fullName: row.fullName });
      setResendState((prev) => ({ ...prev, [row.id]: { sending: false, sent: true, error: null } }));
    } catch (resendError) {
      setResendState((prev) => ({ ...prev, [row.id]: { sending: false, sent: false, error: resendError.message } }));
    }
  };

  const handleSuspend = async (row) => {
    setSuspendState((prev) => ({ ...prev, [row.id]: { loading: true, error: null } }));
    try {
      await suspendAdminUser({ targetAdminId: row.id, actorEmail: user?.email });
      setSuspendState((prev) => ({ ...prev, [row.id]: { loading: false, error: null } }));
      await loadUsers();
      loadAuditLogs();
    } catch (err) {
      setSuspendState((prev) => ({ ...prev, [row.id]: { loading: false, error: err.message } }));
    }
  };

  const handleReactivate = async (row) => {
    setSuspendState((prev) => ({ ...prev, [row.id]: { loading: true, error: null } }));
    try {
      await reactivateAdminUser({ targetAdminId: row.id, actorEmail: user?.email });
      setSuspendState((prev) => ({ ...prev, [row.id]: { loading: false, error: null } }));
      await loadUsers();
      loadAuditLogs();
    } catch (err) {
      setSuspendState((prev) => ({ ...prev, [row.id]: { loading: false, error: err.message } }));
    }
  };

  const openDeleteModal = (row) => {
    setError("");
    setDeleteResult("");
    setDeleteTarget(row);
    setDeleteConfirmText("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmText("");
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!deleteTarget) return;

    const expectedEmail = String(deleteTarget.email || "").trim().toLowerCase();
    const parsedConfirm = String(deleteConfirmText || "").trim().toLowerCase();

    if (parsedConfirm !== expectedEmail) {
      setError("Escribe exactamente el correo para confirmar la eliminación.");
      return;
    }

    setDeleting(true);
    setError("");
    setDeleteResult("");
    try {
      await deleteAdminUser({
        targetAdminId: deleteTarget.id,
        actorEmail: user?.email,
      });
      setDeleteResult(`Se eliminó la cuenta ADMIN: ${deleteTarget.email}.`);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      await loadUsers();
      loadAuditLogs();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la cuenta ADMIN.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page users-page">
      <section className="section">
        <div className="container">
          <AdminTopbar />

          <div className="users-header">
            <div>
              <p className="purplelabel">Gestión de acceso</p>
              <p className="stat-title">Usuarios administradores</p>
              <p>
                Invita psicólogos y revisa el estado de acceso al dashboard.
              </p>
            </div>
            <label className="control">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Nombre, correo o rol"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="users-grid">
            <form className="card invite-card" onSubmit={handleInvite}>
              <div className="invite-card-top">
                <p className="purplelabel">Invitar psicólogo</p>
                <p className="stat-title">Nueva cuenta ADMIN</p>
              </div>

              <div className="invite-card-fields">
                <input
                  id="invite-full-name"
                  className="login-input"
                  type="text"
                  placeholder="Nombre y apellido"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />

                <input
                  id="invite-email"
                  className="login-input"
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <select
                  id="invite-role"
                  className="invite-card-select"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                  required
                >
                  <option value={ADMIN_ROLES.ADMIN}>{ADMIN_ROLE_LABELS[ADMIN_ROLES.ADMIN]}</option>
                  <option value={ADMIN_ROLES.SUPER_ADMIN}>{ADMIN_ROLE_LABELS[ADMIN_ROLES.SUPER_ADMIN]}</option>
                </select>

                <button
                  type="submit"
                  className="button admin-access-button invite-card-btn"
                  disabled={saving}
                >
                  {saving ? "Enviando..." : "Enviar invitación"}
                </button>
              </div>

              {invitationResult ? (
                <div className="users-invite-success">
                  {invitationResult.emailSent ? (
                    <>
                      <p className="users-invite-success-title">Invitación enviada por correo</p>
                      <p className="users-invite-success-sub">
                        Se envió el link de activación a <strong>{invitationResult.user.email}</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="users-invite-success-title">Invitación creada</p>
                      {invitationResult.emailError ? (
                        <p className="users-invite-email-warn">
                          No se pudo enviar el correo automáticamente. Copia el link manualmente.
                        </p>
                      ) : null}
                      <p className="users-invite-link-label">Link de activación:</p>
                      <div className="users-invite-link-row">
                        <span className="users-invite-link-text">{invitationResult.activationLink}</span>
                        <button
                          type="button"
                          className="users-copy-button"
                          onClick={() => navigator.clipboard.writeText(invitationResult.activationLink)}
                        >
                          Copiar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </form>

            <div className="card users-stats-mini">
              <p className="purplelabel">Resumen</p>
              <div className="users-stats-mini-items">
                <div className="users-stats-mini-item">
                  <p className="stat-label">Total</p>
                  <p className="users-stats-mini-val">{stats.total}</p>
                </div>
                <div className="users-stats-mini-item">
                  <p className="stat-label">Activos</p>
                  <p className="users-stats-mini-val">{stats.active}</p>
                </div>
                <div className="users-stats-mini-item">
                  <p className="stat-label">Invitados pendientes</p>
                  <p className="users-stats-mini-val">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="card users-table-card">
              <p className="purplelabel">Listado</p>
              {loading ? <p className="muted">Cargando usuarios...</p> : null}
              {!loading && rows.length === 0 ? (
                <p className="muted">No hay usuarios registrados.</p>
              ) : null}
              {!loading && rows.length > 0 ? (
                <div className="users-table-scroll"><div className="users-table">
                  <div className="users-table-row users-table-head">
                    <span>Nombre</span>
                    <span>Correo</span>
                    <span>Rol</span>
                    <span>Estado</span>
                    <span>Último acceso</span>
                    <span>Activación</span>
                    <span>Acciones</span>
                  </div>
                  {rows.map((row) => (
                    <div className="users-table-row" key={row.id}>
                      <span>{row.fullName || "—"}</span>
                      <span>{row.email}</span>
                      <span>
                        {ADMIN_ROLE_LABELS[row.role] || row.role || "—"}
                      </span>
                      <span>
                        {ADMIN_STATUS_LABELS[row.status] || row.status || "—"}
                      </span>
                      <span>{formatDate(row.lastLoginAt)}</span>
                      <span className="users-resend-cell">
                        {row.status === "INVITED_PENDING" ? (() => {
                          const rs = resendState[row.id];
                          if (rs?.sent) return <span className="users-resend-sent">Enviado</span>;
                          if (rs?.error) return <span className="users-resend-error" title={rs.error}>Error al enviar</span>;
                          return (
                            <button
                              type="button"
                              className="users-resend-button"
                              disabled={rs?.sending}
                              onClick={() => handleResend(row)}
                            >
                              {rs?.sending ? "Enviando..." : "Reenviar"}
                            </button>
                          );
                        })() : "—"}
                      </span>
                      <span className="users-actions-cell">
                        {row.role === ADMIN_ROLES.ADMIN ? (
                          <>
                            {row.status === ADMIN_STATUS.ACTIVE && (
                              <button
                                type="button"
                                className="users-suspend-button"
                                disabled={suspendState[row.id]?.loading}
                                title={suspendState[row.id]?.error || undefined}
                                onClick={() => handleSuspend(row)}
                              >
                                {suspendState[row.id]?.loading ? "..." : "Suspender"}
                              </button>
                            )}
                            {row.status === ADMIN_STATUS.SUSPENDED && (
                              <button
                                type="button"
                                className="users-reactivate-button"
                                disabled={suspendState[row.id]?.loading}
                                title={suspendState[row.id]?.error || undefined}
                                onClick={() => handleReactivate(row)}
                              >
                                {suspendState[row.id]?.loading ? "..." : "Reactivar"}
                              </button>
                            )}
                            <button
                              type="button"
                              className="users-delete-button"
                              onClick={() => openDeleteModal(row)}
                            >
                              Eliminar
                            </button>
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  ))}
                </div></div>
              ) : null}
            </div>

            <div className="card audit-card">
              <p className="purplelabel">Historial de acciones</p>
              <p className="stat-title">Registro de actividad</p>
              {auditLoading ? (
                <p className="muted">Cargando historial...</p>
              ) : auditLogs.length === 0 ? (
                <p className="muted">No hay acciones registradas.</p>
              ) : (
                <div className="audit-table-scroll">
                  <div className="audit-table">
                    <div className="audit-row audit-head">
                      <span>Acción</span>
                      <span>Actor</span>
                      <span>Objetivo</span>
                      <span>Fecha</span>
                    </div>
                    {auditLogs.map((log) => (
                      <div key={log.id} className="audit-row">
                        <span className={`audit-action audit-action--${log.action.toLowerCase()}`}>
                          {AUDIT_ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span>{log.actor_email}</span>
                        <span>{log.target_email || "—"}</span>
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {deleteResult ? <p className="users-success">{deleteResult}</p> : null}
          {error ? <p className="login-error users-error">{error}</p> : null}

          {deleteTarget ? (
            <div
              className="users-modal-backdrop"
              role="presentation"
              onClick={closeDeleteModal}
            >
              <div
                className="users-modal card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-admin-title"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="purplelabel">Eliminar cuenta ADMIN</p>
                <h3 id="delete-admin-title" className="users-modal-title">
                  Confirma la eliminación
                </h3>
                <p className="users-modal-copy">
                  Esta acción quitará el acceso al dashboard para:
                </p>
                <p className="users-modal-target">
                  {deleteTarget.fullName || "Sin nombre"} · {deleteTarget.email} ·{" "}
                  {ADMIN_ROLE_LABELS[deleteTarget.role] || deleteTarget.role}
                </p>

                <form onSubmit={handleDelete} className="users-modal-form">
                  <label className="control" htmlFor="delete-confirm-input">
                    <span>Escribe el correo para confirmar</span>
                    <input
                      id="delete-confirm-input"
                      className="users-modal-input"
                      type="text"
                      value={deleteConfirmText}
                      placeholder={deleteTarget.email}
                      onChange={(event) => setDeleteConfirmText(event.target.value)}
                      autoFocus
                    />
                  </label>

                  <div className="users-modal-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={closeDeleteModal}
                      disabled={deleting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="button users-delete-confirm-button"
                      disabled={deleting}
                    >
                      {deleting ? "Eliminando..." : "Eliminar ADMIN"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default UsersPage;
