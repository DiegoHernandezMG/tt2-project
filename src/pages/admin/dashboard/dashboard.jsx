import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import AdminTopbar from "../../../components/admin-topbar/admin-topbar";
import { getPatientData, listDashboardProfiles } from "../../../services/dashboard";
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
  rows.push(["Onboarding completado en", profile?.onboarding_completado_en]);
  rows.push(["Registro", profile?.creado_en]);
  rows.push(["Estado", profile?.usuario_activo ? "Activo" : "Inactivo"]);
  rows.push([]);

  rows.push(["EVALUACIONES CLÍNICAS"]);
  rows.push(["Nivel", "OASIS", "ODSIS", "Bienestar", "Baseline OASIS", "Baseline ODSIS", "Enviada"]);
  for (const ev of patientData?.evaluaciones ?? []) {
    rows.push([ev.nivel, ev.oasis_total, ev.odsis_total, ev.bienestar_score, ev.baseline_oasis, ev.baseline_odsis, ev.enviada ? "Sí" : "No"]);
  }
  rows.push([]);

  rows.push(["NIVELES"]);
  rows.push(["Nivel", "Completado", "Desbloqueado siguiente", "Último acceso"]);
  for (const n of patientData?.niveles ?? []) {
    rows.push([n.nivel, n.completado ? "Sí" : "No", n.desbloqueado_siguiente ? "Sí" : "No", n.ultimo_acceso_en]);
  }
  rows.push([]);

  rows.push(["RESPUESTAS"]);
  rows.push(["Ejercicio", "Nivel", "Duración (seg)", "Completado en"]);
  for (const r of patientData?.respuestas ?? []) {
    rows.push([r.ejercicio_codigo, r.nivel, r.duracion_segundos, r.completado_en]);
  }
  rows.push([]);

  rows.push(["MÉTRICAS IA"]);
  rows.push(["Campo", "Valor"]);
  const m = patientData?.metricas?.[0];
  if (m) {
    rows.push(["Días de acceso", m.dias_acceso]);
    rows.push(["% Ejercicios completados", m.porcentaje_ejercicios]);
    rows.push(["Adherencia IA", m.resumen_adherencia_ia]);
    rows.push(["Tendencia emocional IA", m.tendencia_emocional_ia]);
    rows.push(["Recomendación IA", m.recomendacion_ia]);
  }

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
    const { evaluaciones, niveles, totalAccesos, metricas } = patientData;

    const nivelActual = niveles.reduce(
      (max, n) => (n.desbloqueado_siguiente || n.completado ? Math.max(max, n.nivel) : max),
      0,
    );

    const ultimaConexion = niveles.reduce((latest, n) => {
      if (!n.ultimo_acceso_en) return latest;
      return !latest || n.ultimo_acceso_en > latest ? n.ultimo_acceso_en : latest;
    }, null);

    const nivelMaxCompletado = niveles.reduce(
      (max, n) => (n.completado ? Math.max(max, n.nivel) : max),
      0,
    );

    const evalEnviadas = evaluaciones.filter((e) => e.enviada);
    const lastEval = evalEnviadas.at(-1) ?? null;
    const baseEval = evalEnviadas[0] ?? null;

    const latestMetrica = metricas[0] ?? null;

    return {
      nivelActual,
      ultimaConexion,
      nivelMaxCompletado,
      totalAccesos,
      lastEval,
      baseEval,
      latestMetrica,
    };
  }, [patientData]);

  const totalPatients = isLoadingProfiles ? "..." : profilesError ? EMPTY : profiles.length;

  const [exportingAll, setExportingAll] = useState(false);

  const handleExportAll = async () => {
    if (!profiles.length) return;
    setExportingAll(true);
    try {
      const wb = XLSX.utils.book_new();
      const results = await Promise.allSettled(
        profiles.map((p) => getPatientData(p.id_usuario)),
      );
      results.forEach((result, i) => {
        const profile = profiles[i];
        const data = result.status === "fulfilled" ? result.value : null;
        const ws = buildPatientSheet(profile, data, calcAge);
        XLSX.utils.book_append_sheet(wb, ws, sheetName(profile.fullName));
      });
      XLSX.writeFile(wb, `pacientes_serenamente_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

          {/* Summary */}
          <div className="grid grid--3 dashboard-summary">
            <div className="card stat-card">
              <p className="stat-title">Pacientes totales</p>
              <p className="stat-value">{totalPatients}</p>
            </div>
            <div className="card stat-card">
              <p className="stat-title">Nivel actual</p>
              <p className="stat-value">
                {isLoadingPatient ? "..." : stats?.nivelActual ? `Nivel ${stats.nivelActual}` : EMPTY}
              </p>
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
                  <p className="stat-label">Onboarding</p>
                  <p className="stat-detail">{fmtDate(selectedProfile?.onboarding_completado_en)}</p>
                </div>
                <div>
                  <p className="stat-label">Registro</p>
                  <p className="stat-detail">{fmtDate(selectedProfile?.creado_en)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <p className="purplelabel">Evaluaciones clínicas</p>
              <div className="stat-stack">
                <div>
                  <p className="stat-title">OASIS</p>
                  <p className="stat-value" style={{ fontSize: "1.4rem" }}>
                    {isLoadingPatient ? "..." : (
                      <ScoreDelta
                        baseline={stats?.baseEval?.baseline_oasis}
                        current={stats?.lastEval?.oasis_total}
                      />
                    )}
                  </p>
                </div>
                <div>
                  <p className="stat-title">ODSIS</p>
                  <p className="stat-value" style={{ fontSize: "1.4rem" }}>
                    {isLoadingPatient ? "..." : (
                      <ScoreDelta
                        baseline={stats?.baseEval?.baseline_odsis}
                        current={stats?.lastEval?.odsis_total}
                      />
                    )}
                  </p>
                </div>
                <div>
                  <p className="stat-title">Bienestar</p>
                  <p className="stat-value" style={{ fontSize: "1.4rem" }}>
                    {isLoadingPatient ? "..." : stats?.lastEval?.bienestar_score ?? EMPTY}
                  </p>
                </div>
              </div>
              <div className="divider" />
              <div className="stat-list">
                <p className="stat-title">Recomendación IA</p>
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : stats?.latestMetrica?.recomendacion_ia ? (
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}>
                    {stats.latestMetrica.recomendacion_ia}
                  </p>
                ) : (
                  <p className="muted">Sin datos por mostrar todavía.</p>
                )}
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
              <p className="stat-title">Análisis IA</p>
              <div className="stack">
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : stats?.latestMetrica ? (
                  <>
                    <div>
                      <p className="stat-label">Adherencia</p>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>
                        {stats.latestMetrica.resumen_adherencia_ia || EMPTY}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">Tendencia emocional</p>
                      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>
                        {stats.latestMetrica.tendencia_emocional_ia || EMPTY}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="muted">Sin datos por mostrar todavía.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid--2 dashboard-tables">
            <div className="card">
              <p className="stat-title">Últimas evaluaciones</p>
              <div className="table">
                <div className="table-row table-head">
                  <span>Nivel</span>
                  <span>OASIS</span>
                  <span>ODSIS</span>
                  <span>Bienestar</span>
                </div>
                {isLoadingPatient ? (
                  <p className="muted">Cargando...</p>
                ) : patientData?.evaluaciones?.length ? (
                  [...patientData.evaluaciones].reverse().map((ev) => (
                    <div key={ev.nivel} className="table-row">
                      <span>Nivel {ev.nivel}</span>
                      <span>{ev.oasis_total ?? EMPTY}</span>
                      <span>{ev.odsis_total ?? EMPTY}</span>
                      <span>{ev.bienestar_score ?? EMPTY}</span>
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
                  patientData.respuestas.map((r, i) => (
                    <div key={i} className="table-row">
                      <span>{r.ejercicio_codigo || EMPTY}</span>
                      <span>{r.nivel ?? EMPTY}</span>
                      <span>{fmtSeconds(r.duracion_segundos)}</span>
                      <span>{fmtDate(r.completado_en)}</span>
                    </div>
                  ))
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
