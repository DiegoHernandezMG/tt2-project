import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import AdminTopbar from "../../../components/admin-topbar/admin-topbar";
import { getPatientData, listDashboardProfiles } from "../../../services/dashboard";
import { adminSupabase, adminSupabaseAnonKey } from "../../../lib/supabase-admin";
import { useAuth } from "../../../hooks/use-auth";
import { ADMIN_ROLES } from "../../../constants/admin";
import "./dashboard.css";

const EMPTY = "—";

const fmt = (value) => {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-MX", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtDate = (value) => {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
};

const calcAge = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const fmtSeconds = (secs) => {
  if (!secs) return EMPTY;
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

const EMOTION_EMOJIS = {
  entusiasmado: "🤩",
  alegre: "😄",
  relajado: "😌",
  en_calma: "🙂",
  inquieto: "😕",
  estresado: "😣",
  triste: "😢",
  enojado: "😤",
  agotado: "😴",
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function EmotionChart({ data }) {
  const weekDates = useMemo(() => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    for (const r of (data ?? [])) {
      if (!map[r.fecha]) map[r.fecha] = r;
    }
    return map;
  }, [data]);

  return (
    <div className="emotion-chart">
      {weekDates.map((date, i) => {
        const r = byDate[date];
        const barPx = r ? Math.max(Math.round((r.intensidad / 10) * 100), 10) : 6;
        const emoji = r ? (EMOTION_EMOJIS[r.emocion_clave] ?? "😐") : null;
        return (
          <div key={date} className="emotion-chart__col">
            <span className="emotion-chart__emoji">{emoji ?? ""}</span>
            <div className="emotion-chart__track">
              <div
                className={`emotion-chart__bar${r ? "" : " emotion-chart__bar--empty"}`}
                style={{ height: barPx }}
                title={r ? `${r.emocion_etiqueta}: ${r.intensidad}/10` : "Sin registro"}
              />
            </div>
            <span className="emotion-chart__label">{DAY_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function ScoreDelta({ baseline, current }) {
  if (baseline == null || current == null) return <span>{EMPTY}</span>;
  const delta = current - baseline;
  const sign = delta > 0 ? "+" : "";
  const color = delta < 0 ? "#0f7a6c" : delta > 0 ? "#b53f33" : "var(--muted)";
  return (
    <span>
      {current}{" "}
      <span style={{ fontSize: "12px", color }}>
        ({sign}{delta} vs base)
      </span>
    </span>
  );
}

const sheetName = (name) =>
  name.replace(/[\\/*?[\]:]/g, "").slice(0, 31) || "Paciente";

const buildPatientSheet = (profile, patientData, calcAge) => {
  const age = profile?.fecha_nacimiento ? calcAge(profile.fecha_nacimiento) : null;
  const rows = [];

  rows.push(["PERFIL DEL PACIENTE"]);
  rows.push(["Campo", "Valor"]);
  rows.push(["Nombre", profile?.fullName]);
  rows.push(["Sexo", profile?.sexo]);
  rows.push(["Edad", age ? `${age} años` : ""]);
  rows.push(["Lugar de residencia", profile?.lugar_residencia]);
  rows.push(["Fecha de nacimiento", profile?.fecha_nacimiento]);
  rows.push(["Total conexiones", profile?.total_conexiones]);
  rows.push(["Correo", patientData?.email ?? ""]);
  rows.push(["Registro", profile?.creado_en]);
  rows.push(["Estado", profile?.usuario_activo ? "Activo" : "Inactivo"]);
  rows.push([]);

  rows.push(["EVALUACIONES CLÍNICAS"]);
  rows.push(["Nivel", "OASIS", "ODSIS", "Baseline OASIS", "Baseline ODSIS", "Enviada"]);
  for (const ev of patientData?.evaluaciones ?? []) {
    rows.push([ev.nivel, ev.oasis_total, ev.odsis_total, ev.baseline_oasis, ev.baseline_odsis, ev.enviada ? "Sí" : "No"]);
  }
  rows.push([]);

  const completedLevels = new Set(
    (patientData?.evaluaciones ?? [])
      .filter((ev) => ev.enviada)
      .map((ev) => ev.nivel)
  );
  const maxCompletedLevel = completedLevels.size > 0 ? Math.max(...completedLevels) : 0;
  const sesionFinal = patientData?.sesionFinal;
  let estadoPrograma;
  if (maxCompletedLevel === 7) {
    estadoPrograma = sesionFinal?.completada_en ? "Finalizó programa" : "Evaluaciones finales pendientes";
  } else {
    estadoPrograma = maxCompletedLevel > 0 ? `En nivel ${maxCompletedLevel + 1}` : "Sin progreso registrado";
  }
  rows.push(["Estado del programa", estadoPrograma]);
  rows.push([]);

  rows.push(["NIVELES"]);
  rows.push(["Nivel", "Completado", "Último acceso"]);
  for (const n of patientData?.niveles ?? []) {
    rows.push([n.nivel, completedLevels.has(n.nivel) ? "Sí" : "No", n.ultimo_acceso_en]);
  }
  rows.push([]);

  rows.push(["RESPUESTAS"]);
  rows.push(["Ejercicio", "Nivel", "Duración (seg)", "Completado en"]);
  for (const r of patientData?.respuestas ?? []) {
    rows.push([r.ejercicio_codigo, r.nivel, r.duracion_segundos, r.completado_en]);
  }
  rows.push([]);

  rows.push(["SEGUIMIENTO DIARIO DE EMOCIONES (semana actual)"]);
  rows.push(["Fecha", "Día", "Emoción", "Intensidad"]);
  const diasES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  for (const e of patientData?.emocionesSemanales ?? []) {
    const diaNombre = diasES[new Date(e.fecha + "T00:00:00").getDay()];
    rows.push([e.fecha, diaNombre, e.emocion_etiqueta, e.intensidad]);
  }
  rows.push([]);

  return XLSX.utils.aoa_to_sheet(rows);
};


function Dashboard() {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState("");

  const [patientData, setPatientData] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoadingProfiles(true);
        const nextProfiles = await listDashboardProfiles();
        if (!isMounted) return;
        setProfiles(nextProfiles);
        setSelectedUserId(nextProfiles[0]?.id_usuario ?? "");
      } catch (err) {
        if (isMounted) setProfilesError(err.message || "No se pudieron cargar los perfiles.");
      } finally {
        if (isMounted) setIsLoadingProfiles(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedUserId) { setPatientData(null); return; }
    let isMounted = true;
    const load = async () => {
      setIsLoadingPatient(true);
      setPatientError("");
      try {
        const data = await getPatientData(selectedUserId);
        if (isMounted) setPatientData(data);
      } catch (err) {
        if (isMounted) setPatientError(err.message || "No se pudieron cargar los datos.");
      } finally {
        if (isMounted) setIsLoadingPatient(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [selectedUserId]);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      `${p.fullName} ${p.nombre} ${p.apellidos}`.toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id_usuario === selectedUserId) || null,
    [profiles, selectedUserId],
  );

  // Derived stats from patientData
  const stats = useMemo(() => {
    if (!patientData) return null;
    const { evaluaciones, niveles, totalAccesos, metricas, sesionFinal } = patientData;

    const evalEnviadas = evaluaciones.filter((e) => e.enviada);
    const nivelMaxCompletado = evalEnviadas.reduce((max, ev) => Math.max(max, ev.nivel), 0);

    let programStatus;
    if (nivelMaxCompletado === 7) {
      programStatus = sesionFinal?.completada_en ? "finalizado" : "finales_pendientes";
    } else {
      programStatus = "en_progreso";
    }

    const nivelActual = programStatus === "en_progreso" ? nivelMaxCompletado + 1 : null;

    const ultimaConexion = niveles.reduce((latest, n) => {
      if (!n.ultimo_acceso_en) return latest;
      return !latest || n.ultimo_acceso_en > latest ? n.ultimo_acceso_en : latest;
    }, null);

    const lastEval = evalEnviadas.at(-1) ?? null;
    const baseEval = evalEnviadas[0] ?? null;
    const latestMetrica = metricas[0] ?? null;

    return {
      nivelActual,
      nivelMaxCompletado,
      programStatus,
      ultimaConexion,
      totalAccesos,
      lastEval,
      baseEval,
      latestMetrica,
    };
  }, [patientData]);

  const totalPatients = isLoadingProfiles ? "..." : profilesError ? EMPTY : profiles.length;

  const { profile: adminProfile } = useAuth();
  const isSuperAdmin = adminProfile?.role === ADMIN_ROLES.SUPER_ADMIN;

  const [exportingAll, setExportingAll] = useState(false);
  const [exportAllError, setExportAllError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeletePatient = async () => {
    if (!selectedProfile) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const session = await adminSupabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      const res = await fetch(
        `${adminSupabase.supabaseUrl}/functions/v1/delete-patient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken ?? adminSupabaseAnonKey}`,
          },
          body: JSON.stringify({ userId: selectedProfile.id_usuario }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el paciente.");
      setProfiles((prev) => prev.filter((p) => p.id_usuario !== selectedProfile.id_usuario));
      setSelectedUserId("");
      setShowDeleteConfirm(false);
      setDeleteConfirmName("");
    } catch (err) {
      setDeleteError(err.message || "Error al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportAll = async () => {
    if (!profiles.length) return;
    setExportingAll(true);
    setExportAllError("");
    try {
      const wb = XLSX.utils.book_new();
      const results = await Promise.allSettled(
        profiles.map((p) => getPatientData(p.id_usuario)),
      );
      const usedNames = new Set();
      results.forEach((result, i) => {
        const profile = profiles[i];
        const data = result.status === "fulfilled" ? result.value : null;
        const ws = buildPatientSheet(profile, data, calcAge);
        let name = sheetName(profile.fullName);
        if (usedNames.has(name)) {
          name = `${name.slice(0, 28)} ${i + 1}`.slice(0, 31);
        }
        usedNames.add(name);
        XLSX.utils.book_append_sheet(wb, ws, name);
      });
      XLSX.writeFile(wb, `pacientes_serenamente_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      setExportAllError(err.message || "No se pudo exportar.");
    } finally {
      setExportingAll(false);
    }
  };

  const handleExport = () => {
    if (!selectedProfile || !patientData) return;
    const wb = XLSX.utils.book_new();
    const ws = buildPatientSheet(selectedProfile, patientData, calcAge);
    XLSX.utils.book_append_sheet(wb, ws, sheetName(selectedProfile.fullName));
    XLSX.writeFile(wb, `paciente_${selectedProfile.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="page dashboard-page">
      <section className="section">
        <div className="container">
          <AdminTopbar />

          <div className="dashboard-header">
            <div className="dashboard-controls">
              <label className="control">
                <span>Buscar paciente</span>
                <input
                  type="search"
                  placeholder="Nombre o ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="control">
                <span>Paciente</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isLoadingProfiles}
                >
                  <option value="">
                    {isLoadingProfiles ? "Cargando..." : profilesError ? "Error al cargar" : "Selecciona un paciente"}
                  </option>
                  {filteredProfiles.map((p) => (
                    <option key={p.id_usuario} value={p.id_usuario}>{p.fullName}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="dashboard-actions">
              <button
                type="button"
                className="button admin-access-button"
                onClick={handleExport}
                disabled={!selectedProfile || !patientData || isLoadingPatient}
              >
                {isLoadingPatient ? "Cargando..." : "Exportar paciente"}
              </button>
              <button
                type="button"
                className="button admin-access-button"
                onClick={handleExportAll}
                disabled={!profiles.length || isLoadingProfiles || exportingAll}
              >
                {exportingAll ? "Exportando..." : "Exportar todos"}
              </button>
            </div>
          </div>
          {exportAllError && <p className="login-error" style={{ marginBottom: 0 }}>{exportAllError}</p>}

          {/* Summary */}
          <div className="grid grid--3 dashboard-summary">
            <div className="card stat-card">
              <p className="stat-title">Pacientes totales</p>
              <p className="stat-value">{totalPatients}</p>
            </div>
            <div className="card stat-card">
              <p className="stat-title">Progreso</p>
              {isLoadingPatient ? (
                <p className="stat-value">...</p>
              ) : stats?.programStatus === "finalizado" ? (
                <p className="stat-value stat-value--success">✓ Finalizó programa</p>
              ) : stats?.programStatus === "finales_pendientes" ? (
                <p className="stat-value stat-value--warning">⚠ Eval. finales pendientes</p>
              ) : stats?.nivelActual ? (
                <p className="stat-value">{`Nivel ${stats.nivelActual}`}</p>
              ) : (
                <p className="stat-value">{EMPTY}</p>
              )}
            </div>
            <div className="card stat-card">
              <p className="stat-title">OASIS actual</p>
              <p className="stat-value">
                {isLoadingPatient ? "..." : stats?.lastEval?.oasis_total ?? EMPTY}
              </p>
            </div>
          </div>

          {patientError ? <p className="login-error" style={{ marginBottom: 16 }}>{patientError}</p> : null}

          {/* Profile + Scores */}
          <div className="grid grid--2 dashboard-patient">
            <div className="card">
              <div className="patient-header">
                <div>
                  <p className="purplelabel">Perfil del paciente</p>
                  <p className="stat-title">{selectedProfile?.fullName || EMPTY}</p>
                </div>
                <span className={`status ${selectedProfile?.usuario_activo ? "status--ok" : "status--off"}`}>
                  {selectedProfile ? (selectedProfile.usuario_activo ? "Activo" : "Inactivo") : "Sin datos"}
                </span>
              </div>
              <div className="patient-grid">
                <div>
                  <p className="stat-label">Sexo</p>
                  <p className="stat-detail">{selectedProfile?.sexo || EMPTY}</p>
                </div>
                <div>
                  <p className="stat-label">Residencia</p>
                  <p className="stat-detail">{selectedProfile?.lugar_residencia || EMPTY}</p>
                </div>
                <div>
                  <p className="stat-label">Edad</p>
                  <p className="stat-detail">
                    {selectedProfile?.fecha_nacimiento
                      ? `${calcAge(selectedProfile.fecha_nacimiento)} años`
                      : EMPTY}
                  </p>
                </div>
                <div>
                  <p className="stat-label">Conexiones</p>
                  <p className="stat-detail">{selectedProfile?.total_conexiones ?? EMPTY}</p>
                </div>
                <div>
                  <p className="stat-label">Correo</p>
                  <p className="stat-detail" style={{ wordBreak: "break-all" }}>{isLoadingPatient ? "..." : patientData?.email || EMPTY}</p>
                </div>
                <div>
                  <p className="stat-label">Registro</p>
                  <p className="stat-detail">{fmtDate(selectedProfile?.creado_en)}</p>
                </div>
              </div>

              {isSuperAdmin && selectedProfile && (
                <div className="patient-delete">
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); }}
                    >
                      Eliminar paciente
                    </button>
                  ) : (
                    <div className="delete-confirm">
                      <p className="delete-confirm__warning">
                        Esta acción eliminará permanentemente todos los registros de <strong>{selectedProfile.fullName}</strong>. Escribe su nombre para confirmar.
                      </p>
                      <input
                        className="login-input"
                        type="text"
                        placeholder={selectedProfile.fullName}
                        value={deleteConfirmName}
                        onChange={(e) => setDeleteConfirmName(e.target.value)}
                      />
                      {deleteError && <p className="login-error">{deleteError}</p>}
                      <div className="delete-confirm__actions">
                        <button
                          type="button"
                          className="button button--danger"
                          onClick={handleDeletePatient}
                          disabled={deleteConfirmName.trim() !== selectedProfile.fullName.trim() || isDeleting}
                        >
                          {isDeleting ? "Eliminando..." : "Confirmar eliminación"}
                        </button>
                        <button
                          type="button"
                          className="button"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(""); setDeleteError(""); }}
                          disabled={isDeleting}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card card--flex-col">
              <p className="purplelabel">Evaluaciones clínicas</p>
              <div className="stat-stack stat-stack--fill">
                <div className="stat-stack__item">
                  <p className="stat-title">OASIS</p>
                  <p className="stat-value">
                    {isLoadingPatient ? "..." : (
                      <ScoreDelta
                        baseline={stats?.baseEval?.baseline_oasis}
                        current={stats?.lastEval?.oasis_total}
                      />
                    )}
                  </p>
                </div>
                <div className="stat-stack__item">
                  <p className="stat-title">ODSIS</p>
                  <p className="stat-value">
                    {isLoadingPatient ? "..." : (
                      <ScoreDelta
                        baseline={stats?.baseEval?.baseline_odsis}
                        current={stats?.lastEval?.odsis_total}
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid--3 dashboard-details">
            <div className="card">
              <p className="stat-title">Evaluaciones por nivel</p>
              <div className="stack">
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : patientData?.evaluaciones?.length ? (
                  patientData.evaluaciones.map((ev) => (
                    <div key={ev.nivel} className="bar-row">
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px" }}>
                        Nivel {ev.nivel}
                      </span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.min(((ev.oasis_total ?? 0) / 20) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="bar-value">
                        OA {ev.oasis_total ?? EMPTY} / OD {ev.odsis_total ?? EMPTY}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Sin evaluaciones registradas.</p>
                )}
              </div>
            </div>

            <div className="card">
              <p className="stat-title">Plataforma</p>
              <div className="stack">
                <div className="list-row">
                  <span>Última conexión</span>
                  <span className="list-value">
                    {isLoadingPatient ? "..." : fmtDate(stats?.ultimaConexion)}
                  </span>
                </div>
                <div className="list-row">
                  <span>Nivel máx. completado</span>
                  <span className="list-value">
                    {isLoadingPatient ? "..." : stats?.nivelMaxCompletado ? `Nivel ${stats.nivelMaxCompletado}` : EMPTY}
                  </span>
                </div>
                <div className="list-row">
                  <span>Total interacciones</span>
                  <span className="list-value">
                    {isLoadingPatient ? "..." : stats?.totalAccesos ?? EMPTY}
                  </span>
                </div>
                <div className="list-row">
                  <span>Días de acceso</span>
                  <span className="list-value">
                    {isLoadingPatient ? "..." : stats?.latestMetrica?.dias_acceso ?? EMPTY}
                  </span>
                </div>
                <div className="list-row">
                  <span>Ejercicios completados</span>
                  <span className="list-value">
                    {isLoadingPatient ? "..." : `${stats?.latestMetrica?.porcentaje_ejercicios ?? EMPTY}%`}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <p className="stat-title">Seguimiento diario de emociones</p>
              {isLoadingPatient ? (
                <p className="muted">Cargando...</p>
              ) : (
                <EmotionChart data={patientData?.emocionesSemanales} />
              )}
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid--2 dashboard-tables">
            <div className="card">
              <p className="stat-title">Últimas evaluaciones</p>
              <div className="table table--3col">
                <div className="table-row table-head">
                  <span>Nivel</span>
                  <span>OASIS</span>
                  <span>ODSIS</span>
                </div>
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : patientData?.evaluaciones?.length ? (
                  [...patientData.evaluaciones].reverse().map((ev) => (
                    <div key={ev.nivel} className="table-row">
                      <span>Nivel {ev.nivel}</span>
                      <span>{ev.oasis_total ?? EMPTY}</span>
                      <span>{ev.odsis_total ?? EMPTY}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Sin evaluaciones registradas.</p>
                )}
              </div>
            </div>

            <div className="card">
              <p className="stat-title">Respuestas recientes</p>
              <div className="table">
                <div className="table-row table-head">
                  <span>Ejercicio</span>
                  <span>Nivel</span>
                  <span>Duración</span>
                  <span>Fecha</span>
                </div>
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : patientData?.respuestas?.length ? (
                  <div className="table-body-scroll">
                    {patientData.respuestas.map((r, i) => (
                      <div key={i} className="table-row">
                        <span>{r.ejercicio_codigo || EMPTY}</span>
                        <span>{r.nivel ?? EMPTY}</span>
                        <span>{fmtSeconds(r.duracion_segundos)}</span>
                        <span>{fmtDate(r.completado_en)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Sin respuestas registradas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
