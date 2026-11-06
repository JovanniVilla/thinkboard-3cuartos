import { useState, useEffect, useCallback } from "react";
import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Edit2Icon,
  PlusIcon,
  ShieldAlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  TargetIcon,
  BarChart3Icon,
  SaveIcon,
  TimerIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { formatDuration } from "../../lib/timeUtils";

const TimeTrackingAdminView = () => {
  const [activeSubTab, setActiveSubTab] = useState("report"); // "report" | "goals" | "audit"
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para Metas
  const [goalsUser, setGoalsUser] = useState("");
  const [weeklyGoals, setWeeklyGoals] = useState([
    { dayOfWeek: 1, name: "Lunes", targetHours: 8 },
    { dayOfWeek: 2, name: "Martes", targetHours: 8 },
    { dayOfWeek: 3, name: "Miércoles", targetHours: 8 },
    { dayOfWeek: 4, name: "Jueves", targetHours: 8 },
    { dayOfWeek: 5, name: "Viernes", targetHours: 8 },
    { dayOfWeek: 6, name: "Sábado", targetHours: 0 },
    { dayOfWeek: 7, name: "Domingo", targetHours: 0 },
  ]);
  const [savingGoals, setSavingGoals] = useState(false);

  // Estados para Auditoría
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Modales
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ started_at: "", ended_at: "", reason: "" });
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: "",
    type: "NOTE",
    noteId: "",
    startedAt: "",
    endedAt: "",
    reason: "",
  });

  // Cargar lista de usuarios para los filtros
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get("/accounts");
        setUsersList(res.data || []);
        if (res.data?.length > 0) {
          setGoalsUser((prev) => prev || res.data[0]._id);
        }
      } catch (err) {
        console.warn("Error al cargar lista de usuarios:", err);
      }
    };
    loadUsers();
  }, []);

  // Cargar Reporte Diario
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedUserId) params.append("userId", selectedUserId);

      const res = await api.get(`/admin/time/reports/daily?${params.toString()}`);
      setReportData(res.data);
    } catch {
      toast.error("Error al cargar reporte diario de tiempos");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedUserId]);

  useEffect(() => {
    if (activeSubTab === "report") {
      fetchReport();
    }
  }, [fetchReport, activeSubTab]);

  // Cargar Metas del usuario seleccionado
  const fetchGoals = useCallback(async () => {
    if (!goalsUser) return;
    try {
      const res = await api.get(`/admin/time/goals/${goalsUser}`);
      const daysMap = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const formatted = (res.data.goals || []).map((g) => ({
        dayOfWeek: g.dayOfWeek,
        name: daysMap[g.dayOfWeek - 1] || `Día ${g.dayOfWeek}`,
        targetHours: Number((g.targetSeconds / 3600).toFixed(1)),
      }));
      setWeeklyGoals(formatted);
    } catch {
      toast.error("Error al cargar metas del usuario");
    }
  }, [goalsUser]);

  useEffect(() => {
    if (activeSubTab === "goals" && goalsUser) {
      fetchGoals();
    }
  }, [fetchGoals, activeSubTab, goalsUser]);

  // Cargar Auditoría
  const fetchAudits = useCallback(async () => {
    setLoadingAudits(true);
    try {
      const res = await api.get("/admin/time/audits");
      setAuditLogs(res.data || []);
    } catch {
      toast.error("Error al cargar registros de auditoría");
    } finally {
      setLoadingAudits(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === "audit") {
      fetchAudits();
    }
  }, [fetchAudits, activeSubTab]);

  // Navegar de fecha
  const changeDateByDays = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  // Guardar Metas
  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      const payload = {
        goals: weeklyGoals.map((g) => ({
          dayOfWeek: g.dayOfWeek,
          targetSeconds: Math.round(Number(g.targetHours) * 3600),
        })),
      };
      await api.put(`/admin/time/goals/${goalsUser}`, payload);
      toast.success("Metas semanales guardadas exitosamente");
    } catch {
      toast.error("Error al guardar metas semanales");
    } finally {
      setSavingGoals(false);
    }
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    const startStr = entry.started_at ? new Date(entry.started_at).toISOString().slice(0, 16) : "";
    const endStr = entry.ended_at ? new Date(entry.ended_at).toISOString().slice(0, 16) : "";
    setEditForm({
      started_at: startStr,
      ended_at: endStr,
      reason: "",
    });
  };

  // Guardar Edición Manual
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.reason.trim()) {
      toast.error("La justificación es obligatoria");
      return;
    }

    try {
      await api.put(`/admin/time/entries/${editingEntry.id}`, {
        started_at: new Date(editForm.started_at).toISOString(),
        ended_at: editForm.ended_at ? new Date(editForm.ended_at).toISOString() : null,
        reason: editForm.reason.trim(),
      });
      toast.success("Registro de tiempo actualizado");
      setEditingEntry(null);
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al actualizar registro");
    }
  };

  // Crear Entrada Manual
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualForm.reason.trim()) {
      toast.error("La justificación es obligatoria");
      return;
    }
    if (!manualForm.userId || !manualForm.startedAt || !manualForm.endedAt) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      await api.post("/admin/time/entries/manual", {
        userId: manualForm.userId,
        type: manualForm.type,
        noteId: manualForm.type === "NOTE" ? manualForm.noteId : null,
        startedAt: new Date(manualForm.startedAt).toISOString(),
        endedAt: new Date(manualForm.endedAt).toISOString(),
        reason: manualForm.reason.trim(),
      });
      toast.success("Entrada manual creada con éxito");
      setIsManualModalOpen(false);
      setManualForm({
        userId: "",
        type: "NOTE",
        noteId: "",
        startedAt: "",
        endedAt: "",
        reason: "",
      });
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar bloque manual");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navegación del módulo */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-content/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <TimerIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-base-content">Control y Auditoría de Tiempos</h2>
            <p className="text-xs text-base-content/60">
              Seguimiento de jornada laboral, metas diarias y trazabilidad de horas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-base-200 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab("report")}
            className={`btn btn-xs rounded-lg gap-1.5 ${
              activeSubTab === "report" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
            }`}
          >
            <BarChart3Icon className="w-3.5 h-3.5" />
            Reportes Diarios
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("goals")}
            className={`btn btn-xs rounded-lg gap-1.5 ${
              activeSubTab === "goals" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
            }`}
          >
            <TargetIcon className="w-3.5 h-3.5" />
            Metas Semanales
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("audit")}
            className={`btn btn-xs rounded-lg gap-1.5 ${
              activeSubTab === "audit" ? "btn-primary shadow-xs" : "btn-ghost text-base-content/70"
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            Historial de Auditoría
          </button>
        </div>
      </div>

      {/* ─── SUBTAB 1: REPORTE DIARIO ─────────────────────────────────────── */}
      {activeSubTab === "report" && (
        <div className="space-y-6">
          {/* Barra de Filtros y Navegación de Fecha */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200/60 border border-base-content/10 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="btn btn-circle btn-xs btn-ghost"
                title="Día anterior"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-base-100 border border-base-content/10 px-3 py-1.5 rounded-xl shadow-xs">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-base-content focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="btn btn-circle btn-xs btn-ghost"
                title="Día siguiente"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                className="btn btn-xs btn-ghost text-xs text-base-content/70"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-base-content/50" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="select select-bordered select-xs w-44 bg-base-100"
                >
                  <option value="">Todos los usuarios</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="btn btn-primary btn-xs gap-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Bloque manual
              </button>
            </div>
          </div>

          {/* Listado de Reportes por Usuario */}
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-32 w-full rounded-2xl bg-base-200/60" />
              <div className="skeleton h-32 w-full rounded-2xl bg-base-200/60" />
            </div>
          ) : !reportData?.reports || reportData.reports.length === 0 ? (
            <div className="text-center py-12 bg-base-200/30 rounded-2xl border border-dashed border-base-content/20 space-y-2">
              <ClockIcon className="w-10 h-10 text-base-content/30 mx-auto" />
              <p className="text-sm font-semibold text-base-content/70">
                No hay registros de tiempo para la fecha seleccionada
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reportData.reports.map((userReport) => {
                const targetHours = (userReport.target_seconds / 3600).toFixed(1);
                const globalHours = (userReport.tracked_global_seconds / 3600).toFixed(2);
                const notesHours = (userReport.tracked_notes_seconds / 3600).toFixed(2);
                const idleHours = (userReport.idle_seconds / 3600).toFixed(2);

                const compliance = userReport.compliance_percentage;
                const isCompliant = compliance >= 100;

                return (
                  <div
                    key={userReport.user.id}
                    className="bg-base-100 border border-base-content/10 rounded-2xl p-5 shadow-xs space-y-4"
                  >
                    {/* Encabezado del usuario */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: userReport.user.color || "#3B82F6" }}
                        >
                          {userReport.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-base-content">
                            {userReport.user.name}
                          </h3>
                          <p className="text-xs text-base-content/50">
                            {userReport.user.job_title || userReport.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-base-content/50 block">Cumplimiento</span>
                          <span
                            className={`text-sm font-bold ${
                              isCompliant
                                ? "text-emerald-500"
                                : compliance >= 75
                                ? "text-primary"
                                : "text-amber-500"
                            }`}
                          >
                            {compliance}%
                          </span>
                        </div>
                        <div className="w-24 bg-base-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompliant ? "bg-emerald-500" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(compliance, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Métricas clave */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/40 p-3 rounded-xl text-center">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-base-content/50 uppercase font-semibold">
                          Meta Diaria
                        </span>
                        <p className="text-sm font-mono font-bold text-base-content">
                          {targetHours}h ({formatDuration(userReport.target_seconds)})
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-base-content/50 uppercase font-semibold">
                          Tiempo Conectado
                        </span>
                        <p className="text-sm font-mono font-bold text-primary">
                          {globalHours}h ({formatDuration(userReport.tracked_global_seconds)})
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-base-content/50 uppercase font-semibold">
                          Tiempo en Tareas
                        </span>
                        <p className="text-sm font-mono font-bold text-secondary">
                          {notesHours}h ({formatDuration(userReport.tracked_notes_seconds)})
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-base-content/50 uppercase font-semibold">
                          Tiempo Ocioso / No Imputado
                        </span>
                        <p className="text-sm font-mono font-bold text-warning">
                          {idleHours}h ({formatDuration(userReport.idle_seconds)})
                        </p>
                      </div>
                    </div>

                    {/* Desglose de Intervalos */}
                    {userReport.entries.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 block">
                          Sesiones del Día ({userReport.entries.length})
                        </span>
                        <div className="overflow-x-auto border border-base-content/10 rounded-xl">
                          <table className="table table-xs w-full">
                            <thead>
                              <tr className="bg-base-200/80">
                                <th>Tipo</th>
                                <th>Tarea / Concepto</th>
                                <th>Proyecto</th>
                                <th>Inicio</th>
                                <th>Fin</th>
                                <th>Duración</th>
                                <th>Estado</th>
                                <th className="text-right">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userReport.entries.map((ent) => {
                                const startStr = new Date(ent.started_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                                const endStr = ent.ended_at
                                  ? new Date(ent.ended_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "En curso";

                                return (
                                  <tr key={ent.id} className="hover:bg-base-200/40">
                                    <td>
                                      <span
                                        className={`badge badge-xs font-semibold ${
                                          ent.type === "GLOBAL"
                                            ? "badge-primary"
                                            : "badge-secondary"
                                        }`}
                                      >
                                        {ent.type}
                                      </span>
                                    </td>
                                    <td className="font-medium max-w-[200px] truncate">
                                      {ent.note_title ? (
                                        <span>
                                          {ent.note_key && (
                                            <span className="text-xs text-base-content/40 font-mono mr-1">
                                              [{ent.note_key}]
                                            </span>
                                          )}
                                          {ent.note_title}
                                        </span>
                                      ) : (
                                        <span className="italic text-base-content/50">Jornada General</span>
                                      )}
                                    </td>
                                    <td className="text-xs text-base-content/70">
                                      {ent.project_name}
                                    </td>
                                    <td className="font-mono text-xs">{startStr}</td>
                                    <td className="font-mono text-xs">{endStr}</td>
                                    <td className="font-mono text-xs font-bold">
                                      {formatDuration(ent.duration_seconds)}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge badge-ghost badge-xs ${
                                          ent.status === "RUNNING"
                                            ? "badge-success"
                                            : ent.status === "EDITED"
                                            ? "badge-warning"
                                            : ""
                                        }`}
                                      >
                                        {ent.status}
                                      </span>
                                    </td>
                                    <td className="text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(ent)}
                                        className="btn btn-ghost btn-xs text-base-content/70 hover:text-primary"
                                        title="Editar intervalo manualmente"
                                      >
                                        <Edit2Icon className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── SUBTAB 2: METAS SEMANALES ────────────────────────────────────── */}
      {activeSubTab === "goals" && (
        <div className="bg-base-100 border border-base-content/10 rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-base-content">Metas de Jornada por Usuario</h3>
            <p className="text-xs text-base-content/60">
              Define las horas laborales requeridas para cada día de la semana (Lunes a Domingo).
            </p>
          </div>

          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text font-semibold text-xs">Seleccionar Usuario</span>
            </label>
            <select
              value={goalsUser}
              onChange={(e) => setGoalsUser(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              {usersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.jobTitle || u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {weeklyGoals.map((day, idx) => (
              <div
                key={day.dayOfWeek}
                className="flex items-center justify-between p-3 bg-base-200/50 border border-base-content/10 rounded-xl"
              >
                <span className="font-semibold text-sm text-base-content">{day.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={day.targetHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const copy = [...weeklyGoals];
                      copy[idx].targetHours = val;
                      setWeeklyGoals(copy);
                    }}
                    className="input input-bordered input-sm w-24 text-right font-mono"
                  />
                  <span className="text-xs text-base-content/60">horas</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveGoals}
            disabled={savingGoals}
            className="btn btn-primary btn-sm gap-2"
          >
            <SaveIcon className="w-4 h-4" />
            {savingGoals ? "Guardando..." : "Guardar Configuración de Metas"}
          </button>
        </div>
      )}

      {/* ─── SUBTAB 3: HISTORIAL DE AUDITORÍA ──────────────────────────────── */}
      {activeSubTab === "audit" && (
        <div className="bg-base-100 border border-base-content/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-base-content">Bitácora de Modificaciones Manuales</h3>
            <p className="text-xs text-base-content/60">
              Registro inmutable de todos los ajustes y creaciones manuales ejecutadas por administradores.
            </p>
          </div>

          {loadingAudits ? (
            <div className="space-y-3">
              <div className="skeleton h-16 w-full rounded-xl bg-base-200/60" />
              <div className="skeleton h-16 w-full rounded-xl bg-base-200/60" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-10 bg-base-200/30 rounded-xl border border-dashed border-base-content/20 text-sm text-base-content/60">
              No hay modificaciones manuales registradas en el historial.
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-content/10 rounded-xl">
              <table className="table table-xs w-full">
                <thead>
                  <tr className="bg-base-200/80">
                    <th>Fecha del Cambio</th>
                    <th>Administrador</th>
                    <th>Usuario Afectado</th>
                    <th>Horario Anterior</th>
                    <th>Nuevo Horario</th>
                    <th>Motivo Obligatorio</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const changeDate = new Date(log.createdAt).toLocaleString();
                    const prevStart = log.previousStartedAt
                      ? new Date(log.previousStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-";
                    const prevEnd = log.previousEndedAt
                      ? new Date(log.previousEndedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-";
                    const newStart = log.newStartedAt
                      ? new Date(log.newStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-";
                    const newEnd = log.newEndedAt
                      ? new Date(log.newEndedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-";

                    return (
                      <tr key={log._id} className="hover:bg-base-200/40">
                        <td className="font-mono text-xs text-base-content/60">{changeDate}</td>
                        <td className="font-semibold text-xs text-primary">{log.adminId?.name || "Admin"}</td>
                        <td className="text-xs text-base-content">
                          {log.timeEntryId?.userId?.name || "Usuario"}
                        </td>
                        <td className="font-mono text-xs text-base-content/60">
                          {prevStart} - {prevEnd}
                        </td>
                        <td className="font-mono text-xs font-bold text-success">
                          {newStart} - {newEnd}
                        </td>
                        <td className="text-xs max-w-xs text-base-content/80 font-medium">
                          {log.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL DE EDICIÓN MANUAL DE INTERVALO ───────────────────────────── */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-base-100 border border-base-content/20 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-warning">
              <ShieldAlertIcon className="w-5 h-5" />
              <h3 className="font-bold text-lg text-base-content">Ajuste Manual de Tiempo</h3>
            </div>

            <p className="text-xs text-base-content/60">
              Toda modificación queda registrada permanentemente en la bitácora de auditoría inmutable.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Hora de Inicio</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.started_at}
                  onChange={(e) => setEditForm({ ...editForm, started_at: e.target.value })}
                  className="input input-bordered input-sm bg-base-200"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Hora de Fin</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.ended_at}
                  onChange={(e) => setEditForm({ ...editForm, ended_at: e.target.value })}
                  className="input input-bordered input-sm bg-base-200"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold text-error">
                    Motivo / Justificación (Obligatorio) *
                  </span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. El usuario olvidó cerrar el temporizador al salir a reunión..."
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  className="textarea textarea-bordered text-xs bg-base-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DE INSERCIÓN MANUAL DE TIEMPO ───────────────────────────── */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-base-100 border border-base-content/20 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-base-content">Insertar Bloque Manual de Tiempo</h3>

            <form onSubmit={handleSaveManual} className="space-y-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Usuario</span>
                </label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="select select-bordered select-sm bg-base-200"
                >
                  <option value="">Selecciona usuario...</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Tipo</span>
                </label>
                <select
                  value={manualForm.type}
                  onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}
                  className="select select-bordered select-sm bg-base-200"
                >
                  <option value="GLOBAL">Jornada General (GLOBAL)</option>
                  <option value="NOTE">Trabajo en Tarea (NOTE)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Fecha y Hora de Inicio</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={manualForm.startedAt}
                  onChange={(e) => setManualForm({ ...manualForm, startedAt: e.target.value })}
                  className="input input-bordered input-sm bg-base-200"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold">Fecha y Hora de Fin</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={manualForm.endedAt}
                  onChange={(e) => setManualForm({ ...manualForm, endedAt: e.target.value })}
                  className="input input-bordered input-sm bg-base-200"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-semibold text-error">
                    Motivo / Justificación *
                  </span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Justificación del tiempo manual agregado..."
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                  className="textarea textarea-bordered text-xs bg-base-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Crear Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingAdminView;
