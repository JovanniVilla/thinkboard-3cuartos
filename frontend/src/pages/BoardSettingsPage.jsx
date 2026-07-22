import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  GripVerticalIcon,
  CheckIcon,
  XIcon,
  ZapIcon,
  UserIcon,
  LayersIcon,
  FolderKeyIcon,
  SparklesIcon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
  KeyRoundIcon,
  ClockIcon,
  CheckCircle2Icon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useUsers } from "../lib/useUsers";
import { useAccounts } from "../lib/useAccounts";
import { useBoardConfig } from "../lib/useBoardConfig";
import { useAuth } from "../lib/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#00FF9D",
];

// ─── Inline-edit row for Status / Priority ──────────────────────────────────
const EditRow = ({ item, onSave, onCancel, endpoint, typeName }) => {
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(`El nombre del ${typeName} es requerido`);
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`${endpoint}/${item._id}`, { name: name.trim(), color });
      onSave(res.data);
      toast.success(`${typeName} actualizado`);
    } catch {
      toast.error(`Error al actualizar el ${typeName}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-base-200 p-3 space-y-3">
      <div className="flex items-center gap-3">
        <label
          className="relative w-9 h-9 rounded-full cursor-pointer flex-shrink-0 border-2 border-white/20 shadow-md overflow-hidden"
          style={{ backgroundColor: color }}
          title="Cambiar color"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input input-bordered input-sm flex-1 min-w-0"
          placeholder={`Nombre (${typeName})`}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onCancel();
          }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-125"
            style={{
              backgroundColor: c,
              outline: color === c ? `3px solid ${c}` : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-base-content/60">
        <span>Vista previa:</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-semibold border"
          style={{
            backgroundColor: color + "25",
            color: color,
            borderColor: color + "60",
          }}
        >
          {name || typeName}
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm gap-1" onClick={onCancel} disabled={saving}>
          <XIcon className="h-4 w-4" />
          Cancelar
        </button>
        <button type="button" className="btn btn-primary btn-sm gap-1" onClick={handleSave} disabled={saving || !name.trim()}>
          <CheckIcon className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
};

// ─── Inline-edit row for User ───────────────────────────────────────────────
const EditUserRow = ({ user, onSave, onCancel }) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role || "");
  const [email, setEmail] = useState(user.email || "");
  const [color, setColor] = useState(user.color);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del usuario es requerido");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/users/${user._id}`, {
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        color,
      });
      onSave(res.data);
      toast.success("Usuario actualizado");
    } catch {
      toast.error("Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-base-200 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3">
          <label
            className="relative w-9 h-9 rounded-full cursor-pointer flex-shrink-0 border-2 border-white/20 shadow-md overflow-hidden flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: color }}
            title="Cambiar color de avatar"
          >
            {name ? name.slice(0, 2).toUpperCase() : "?"}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered input-sm flex-1"
            placeholder="Nombre completo"
            autoFocus
          />
        </div>

        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input input-bordered input-sm w-full"
          placeholder="Rol (ej: Diseñador, PM)"
        />
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input input-bordered input-sm w-full"
        placeholder="Correo electrónico (opcional)"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-125"
            style={{
              backgroundColor: c,
              outline: color === c ? `3px solid ${c}` : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-sm gap-1" onClick={onCancel} disabled={saving}>
          <XIcon className="h-4 w-4" />
          Cancelar
        </button>
        <button type="button" className="btn btn-primary btn-sm gap-1" onClick={handleSave} disabled={saving || !name.trim()}>
          <CheckIcon className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const BoardSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("project"); // "project" | "statuses" | "priorities" | "users" | "accounts"

  // Data Hooks
  const { statuses, setStatuses, loading: loadingStatuses } = useStatuses();
  const { priorities, setPriorities, loading: loadingPriorities } = usePriorities();
  const { users, setUsers, loading: loadingUsers } = useUsers();
  const { accounts, setAccounts, loading: loadingAccounts } = useAccounts();
  const { boardConfig, setBoardConfig, loading: loadingConfig } = useBoardConfig();
  const { user: currentUser } = useAuth();

  // Create state
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Project Config state
  const [projectKeyInput, setProjectKeyInput] = useState("");
  const [taskCounterInput, setTaskCounterInput] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [assigningKeys, setAssigningKeys] = useState(false);

  useEffect(() => {
    if (boardConfig) {
      setProjectKeyInput(boardConfig.projectKey || "");
      setTaskCounterInput(boardConfig.taskCounter || 1);
    }
  }, [boardConfig]);

  // DnD refs
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // Switch tab resets inputs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setNewName("");
    setNewColor("#3B82F6");
    setNewRole("");
    setNewEmail("");
    setEditingId(null);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await api.put("/board-config", {
        projectKey: projectKeyInput.trim().toUpperCase(),
        taskCounter: Number(taskCounterInput) || 1,
      });
      setBoardConfig(res.data);
      setProjectKeyInput(res.data.projectKey || "");
      setTaskCounterInput(res.data.taskCounter || 1);
      toast.success("Configuración del proyecto guardada");
    } catch {
      toast.error("Error al guardar la configuración del proyecto");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAssignExistingKeys = async () => {
    if (!projectKeyInput.trim()) {
      toast.error("Primero ingresa y guarda un nombre clave de proyecto");
      return;
    }
    if (!window.confirm(`¿Deseas asignar identificadores secuenciales a todas las tareas existentes que no tienen ID usando el prefijo "${projectKeyInput.trim().toUpperCase()}"?`)) return;
    setAssigningKeys(true);
    try {
      await api.put("/board-config", {
        projectKey: projectKeyInput.trim().toUpperCase(),
        taskCounter: Number(taskCounterInput) || 1,
      });
      const res = await api.post("/board-config/assign-existing");
      setBoardConfig(res.data.boardConfig);
      setTaskCounterInput(res.data.boardConfig.taskCounter || 1);
      toast.success(res.data.message || "Identificadores asignados a las tareas existentes");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al asignar identificadores");
    } finally {
      setAssigningKeys(false);
    }
  };

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setCreating(true);
    try {
      if (activeTab === "statuses") {
        const res = await api.post("/status", { name: newName.trim(), color: newColor });
        setStatuses((prev) => [...prev, res.data]);
        toast.success("Estado creado");
      } else if (activeTab === "priorities") {
        const res = await api.post("/priorities", { name: newName.trim(), color: newColor });
        setPriorities((prev) => [...prev, res.data]);
        toast.success("Prioridad creada");
      } else if (activeTab === "users") {
        const res = await api.post("/users", {
          name: newName.trim(),
          color: newColor,
          role: newRole.trim() || "Miembro del equipo",
          email: newEmail.trim(),
        });
        setUsers((prev) => [...prev, res.data]);
        toast.success("Usuario creado");
      }
      setNewName("");
      setNewRole("");
      setNewEmail("");
      setNewColor("#3B82F6");
    } catch {
      toast.error("Error al crear el elemento");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id, endpoint, typeName, setList) => {
    if (!window.confirm(`¿Eliminar este ${typeName}? Las notas asociadas se restablecerán a su valor por defecto.`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      setList((prev) => prev.filter((item) => item._id !== id));
      toast.success(`${typeName} eliminado`);
    } catch {
      toast.error(`Error al eliminar el ${typeName}`);
    }
  };

  // ── Drag-and-Drop (Statuses / Priorities) ────────────────────────────────
  const handleDragStart = (e, index, id) => {
    dragIndex.current = index;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIndex.current = index;
  };

  const handleDrop = async (list, setList, endpoint) => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) {
      setDraggingId(null);
      return;
    }

    const reordered = [...list];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    const withOrder = reordered.map((s, i) => ({ ...s, order: i }));
    setList(withOrder);
    setDraggingId(null);
    dragIndex.current = null;
    dragOverIndex.current = null;

    try {
      await Promise.all(withOrder.map((s) => api.put(`${endpoint}/${s._id}`, { order: s.order })));
    } catch {
      toast.error("Error al guardar el orden");
    }
  };

  const handleDragEnd = () => setDraggingId(null);

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      <div className="w-full px-4 sm:px-8 py-8">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-4">
              <Link to="/" className="btn btn-ghost btn-sm gap-1">
                <ArrowLeftIcon className="h-4 w-4" />
                Volver al Tablero
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gestión del Tablero</h1>
                <p className="text-base-content/60 text-sm">
                  Personaliza estados, prioridades y miembros del equipo
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Tabs */}
          <div className="tabs tabs-boxed bg-base-100 p-1.5 rounded-xl shadow-sm border border-base-content/10 mb-6 flex">
            <button
              type="button"
              className={`tab flex-1 gap-2 rounded-lg font-semibold transition-all ${
                activeTab === "project" ? "tab-active bg-primary text-primary-content" : "text-base-content/70"
              }`}
              onClick={() => switchTab("project")}
            >
              <FolderKeyIcon className="w-4 h-4" />
              <span>Proyecto / ID</span>
            </button>

            <button
              type="button"
              className={`tab flex-1 gap-2 rounded-lg font-semibold transition-all ${
                activeTab === "statuses" ? "tab-active bg-primary text-primary-content" : "text-base-content/70"
              }`}
              onClick={() => switchTab("statuses")}
            >
              <LayersIcon className="w-4 h-4" />
              <span>Estados ({statuses.length})</span>
            </button>

            <button
              type="button"
              className={`tab flex-1 gap-2 rounded-lg font-semibold transition-all ${
                activeTab === "priorities" ? "tab-active bg-primary text-primary-content" : "text-base-content/70"
              }`}
              onClick={() => switchTab("priorities")}
            >
              <ZapIcon className="w-4 h-4" />
              <span>Prioridades ({priorities.length})</span>
            </button>

            <button
              type="button"
              className={`tab flex-1 gap-2 rounded-lg font-semibold transition-all ${
                activeTab === "users" ? "tab-active bg-primary text-primary-content" : "text-base-content/70"
              }`}
              onClick={() => switchTab("users")}
            >
              <UserIcon className="w-4 h-4" />
              <span>Miembros ({users.length})</span>
            </button>

            <button
              type="button"
              className={`tab flex-1 gap-2 rounded-lg font-semibold transition-all relative ${
                activeTab === "accounts" ? "tab-active bg-primary text-primary-content" : "text-base-content/70"
              }`}
              onClick={() => switchTab("accounts")}
            >
              <KeyRoundIcon className="w-4 h-4" />
              <span>Cuentas / Accesos ({accounts.length})</span>
              {accounts.some((a) => !a.isApproved) && (
                <span className="badge badge-warning badge-xs absolute -top-1 -right-1 animate-pulse">
                  {accounts.filter((a) => !a.isApproved).length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 0: PROYECTO / IDENTIFICADOR */}
          {activeTab === "project" && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold flex items-center gap-2 text-base-content">
                      <FolderKeyIcon className="size-6 text-primary" />
                      Identificador Único del Proyecto
                    </h2>
                    <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
                      Define el nombre clave de tu proyecto. Cada vez que se genere una tarea nueva, se le agregará este prefijo junto con un número secuencial para formar su identificador único (ej: <span className="font-mono font-bold text-primary">PROJ-1</span>, <span className="font-mono font-bold text-primary">PROJ-2</span>).
                    </p>
                  </div>

                  {loadingConfig ? (
                    <div className="text-center py-8 text-base-content/50">Cargando configuración…</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-base-200/50 rounded-2xl border border-base-content/10">
                        <div className="form-control">
                          <label className="label pt-0 pb-1.5">
                            <span className="label-text font-bold text-sm">Nombre clave del proyecto (Prefijo)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: PROJ, TB, DEV..."
                            className="input input-bordered font-mono font-bold uppercase text-lg"
                            value={projectKeyInput}
                            onChange={(e) => setProjectKeyInput(e.target.value.toUpperCase())}
                          />
                          <label className="label pb-0 pt-1">
                            <span className="label-text-alt text-base-content/50">Se convertirá en mayúsculas automáticamente.</span>
                          </label>
                        </div>

                        <div className="form-control">
                          <label className="label pt-0 pb-1.5">
                            <span className="label-text font-bold text-sm">Siguiente número de tarea</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="input input-bordered font-mono text-lg"
                            value={taskCounterInput}
                            onChange={(e) => setTaskCounterInput(e.target.value)}
                          />
                          <label className="label pb-0 pt-1">
                            <span className="label-text-alt text-base-content/50">Número consecutivo para la próxima tarea.</span>
                          </label>
                        </div>
                      </div>

                      {/* Preview & Save Button */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-base-content/80">Vista previa de la próxima tarea:</span>
                          <span className="badge badge-lg font-mono font-extrabold bg-primary text-primary-content px-3 py-3 shadow-sm">
                            {projectKeyInput.trim() ? `${projectKeyInput.trim().endsWith("-") ? projectKeyInput.trim() : projectKeyInput.trim() + "-"}${taskCounterInput || 1}` : "SIN CLAVE"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary gap-2"
                          onClick={handleSaveConfig}
                          disabled={savingConfig}
                        >
                          <CheckIcon className="size-4" />
                          {savingConfig ? "Guardando…" : "Guardar configuración"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Retroactive assignment */}
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body p-6 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-base-content">
                        <SparklesIcon className="size-5 text-amber-500" />
                        Asignar identificador a tareas existentes
                      </h3>
                      <p className="text-sm text-base-content/60 mt-1 max-w-xl leading-relaxed">
                        Si tienes tareas creadas anteriormente que no tienen un identificador único, puedes generárselo en orden cronológico utilizando la clave actual y continuando la numeración.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-secondary gap-2"
                      onClick={handleAssignExistingKeys}
                      disabled={assigningKeys || !projectKeyInput.trim()}
                    >
                      <SparklesIcon className="size-4" />
                      {assigningKeys ? "Asignando…" : "Asignar a tareas sin ID"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ESTADOS */}
          {activeTab === "statuses" && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="card-title text-lg">Estados actuales</h2>
                    <span className="text-xs text-base-content/40 flex items-center gap-1">
                      <GripVerticalIcon className="h-3 w-3" />
                      Arrastra para reordenar
                    </span>
                  </div>

                  {loadingStatuses ? (
                    <div className="text-center py-6 text-base-content/50">Cargando estados…</div>
                  ) : statuses.length === 0 ? (
                    <div className="text-center py-6 text-base-content/50">No hay estados configurados</div>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {statuses.map((status, index) => (
                        <li
                          key={status._id}
                          draggable={editingId !== status._id}
                          onDragStart={(e) => handleDragStart(e, index, status._id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={() => handleDrop(statuses, setStatuses, "/status")}
                          onDragEnd={handleDragEnd}
                          className={`transition-all duration-150 ${
                            draggingId === status._id ? "opacity-40 scale-95" : ""
                          }`}
                        >
                          {editingId === status._id ? (
                            <EditRow
                              item={status}
                              onSave={(updated) => {
                                setStatuses((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
                                setEditingId(null);
                              }}
                              onCancel={() => setEditingId(null)}
                              endpoint="/status"
                              typeName="Estado"
                            />
                          ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-200 transition-colors group border border-transparent hover:border-base-content/10">
                              <GripVerticalIcon className="h-4 w-4 text-base-content/25 cursor-grab active:cursor-grabbing flex-shrink-0" />
                              <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0"
                                style={{
                                  backgroundColor: status.color + "20",
                                  color: status.color,
                                  borderColor: status.color + "50",
                                }}
                              >
                                {status.name}
                              </span>
                              <span className="flex-1" />
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="btn btn-ghost btn-xs gap-1" onClick={() => setEditingId(status._id)}>
                                  Editar
                                </button>
                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(status._id, "/status", "estado", setStatuses)}>
                                  <Trash2Icon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Create status */}
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Agregar nuevo estado</h2>
                  <div className="flex flex-col gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Nombre del estado</span></label>
                      <input
                        type="text"
                        placeholder="Ej: Revisión, Bloqueado, Urgente…"
                        className="input input-bordered"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Color</span></label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewColor(color)}
                            className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: color, outline: newColor === color ? `3px solid ${color}` : "none", outlineOffset: "2px" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="card-actions justify-end">
                      <button className="btn btn-primary gap-2" onClick={handleCreate} disabled={creating || !newName.trim()}>
                        <PlusIcon className="h-4 w-4" />
                        {creating ? "Creando…" : "Crear Estado"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIORIDADES */}
          {activeTab === "priorities" && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="card-title text-lg">Prioridades actuales</h2>
                    <span className="text-xs text-base-content/40 flex items-center gap-1">
                      <GripVerticalIcon className="h-3 w-3" />
                      Arrastra para reordenar
                    </span>
                  </div>

                  {loadingPriorities ? (
                    <div className="text-center py-6 text-base-content/50">Cargando prioridades…</div>
                  ) : priorities.length === 0 ? (
                    <div className="text-center py-6 text-base-content/50">No hay prioridades configuradas</div>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {priorities.map((priority, index) => (
                        <li
                          key={priority._id}
                          draggable={editingId !== priority._id}
                          onDragStart={(e) => handleDragStart(e, index, priority._id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={() => handleDrop(priorities, setPriorities, "/priorities")}
                          onDragEnd={handleDragEnd}
                          className={`transition-all duration-150 ${
                            draggingId === priority._id ? "opacity-40 scale-95" : ""
                          }`}
                        >
                          {editingId === priority._id ? (
                            <EditRow
                              item={priority}
                              onSave={(updated) => {
                                setPriorities((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
                                setEditingId(null);
                              }}
                              onCancel={() => setEditingId(null)}
                              endpoint="/priorities"
                              typeName="Prioridad"
                            />
                          ) : (
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-200 transition-colors group border border-transparent hover:border-base-content/10">
                              <GripVerticalIcon className="h-4 w-4 text-base-content/25 cursor-grab active:cursor-grabbing flex-shrink-0" />
                              <ZapIcon className="w-4 h-4 flex-shrink-0" style={{ color: priority.color }} />
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0"
                                style={{
                                  backgroundColor: priority.color + "20",
                                  color: priority.color,
                                  borderColor: priority.color + "50",
                                }}
                              >
                                {priority.name}
                              </span>
                              <span className="flex-1" />
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="btn btn-ghost btn-xs gap-1" onClick={() => setEditingId(priority._id)}>
                                  Editar
                                </button>
                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(priority._id, "/priorities", "prioridad", setPriorities)}>
                                  <Trash2Icon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Create priority */}
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Agregar nueva prioridad</h2>
                  <div className="flex flex-col gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Nombre de la prioridad</span></label>
                      <input
                        type="text"
                        placeholder="Ej: Crítica, Opcional…"
                        className="input input-bordered"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Color</span></label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewColor(color)}
                            className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: color, outline: newColor === color ? `3px solid ${color}` : "none", outlineOffset: "2px" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="card-actions justify-end">
                      <button className="btn btn-primary gap-2" onClick={handleCreate} disabled={creating || !newName.trim()}>
                        <PlusIcon className="h-4 w-4" />
                        {creating ? "Creando…" : "Crear Prioridad"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USUARIOS */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Miembros del Equipo</h2>

                  {loadingUsers ? (
                    <div className="text-center py-6 text-base-content/50">Cargando usuarios…</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-6 text-base-content/50">No hay usuarios configurados</div>
                  ) : (
                    <ul className="space-y-3">
                      {users.map((user) => (
                        <li key={user._id}>
                          {editingId === user._id ? (
                            <EditUserRow
                              user={user}
                              onSave={(updated) => {
                                setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
                                setEditingId(null);
                              }}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <div className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-base-200 transition-colors group border border-base-content/10">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm"
                                  style={{ backgroundColor: user.color }}
                                >
                                  {user.name.slice(0, 2).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-base-content truncate">{user.name}</h3>
                                  <p className="text-xs text-base-content/60 truncate">
                                    {user.role || "Miembro del equipo"} {user.email ? `• ${user.email}` : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button className="btn btn-ghost btn-xs gap-1" onClick={() => setEditingId(user._id)}>
                                  Editar
                                </button>
                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(user._id, "/users", "usuario", setUsers)}>
                                  <Trash2Icon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Create user */}
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">Agregar nuevo miembro</h2>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label"><span className="label-text">Nombre completo *</span></label>
                        <input
                          type="text"
                          placeholder="Ej: Ana García"
                          className="input input-bordered"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label"><span className="label-text">Rol en el equipo</span></label>
                        <input
                          type="text"
                          placeholder="Ej: Diseñadora UX/UI, Tech Lead..."
                          className="input input-bordered"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text">Correo electrónico (opcional)</span></label>
                      <input
                        type="email"
                        placeholder="ejemplo@agencia.dev"
                        className="input input-bordered"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text">Color de avatar</span></label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewColor(color)}
                            className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                            style={{ backgroundColor: color, outline: newColor === color ? `3px solid ${color}` : "none", outlineOffset: "2px" }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-2">
                      <button className="btn btn-primary gap-2" onClick={handleCreate} disabled={creating || !newName.trim()}>
                        <PlusIcon className="h-4 w-4" />
                        {creating ? "Creando…" : "Agregar Miembro"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUENTAS Y AUTORIZACIONES */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/15 border border-warning/30 flex items-center justify-center text-warning">
                      <ClockIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-base-content/50 uppercase">Pendientes de aprobación</p>
                      <h3 className="text-2xl font-black text-base-content">
                        {accounts.filter((a) => !a.isApproved).length}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success">
                      <CheckCircle2Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-base-content/50 uppercase">Cuentas aprobadas</p>
                      <h3 className="text-2xl font-black text-base-content">
                        {accounts.filter((a) => a.isApproved).length}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                      <ShieldIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-base-content/50 uppercase">Administradores</p>
                      <h3 className="text-2xl font-black text-base-content">
                        {accounts.filter((a) => a.role === "admin").length}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounts Card */}
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h2 className="card-title text-lg flex items-center gap-2">
                        <KeyRoundIcon className="size-5 text-primary" />
                        Gestión de Cuentas y Autorizaciones
                      </h2>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Autoriza, revoca y asigna roles a los usuarios que se han registrado en la plataforma.
                      </p>
                    </div>
                  </div>

                  {loadingAccounts ? (
                    <div className="text-center py-8 text-base-content/50">Cargando cuentas…</div>
                  ) : accounts.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">No hay cuentas registradas</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr className="border-b border-base-content/10 text-base-content/60">
                            <th>Usuario</th>
                            <th>Estado</th>
                            <th>Rol</th>
                            <th>Fecha Registro</th>
                            <th className="text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-base-content/10">
                          {accounts.map((acc) => {
                            const isSelf = currentUser?._id === acc._id;
                            return (
                              <tr key={acc._id} className="hover:bg-base-200/50 transition-colors">
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                                      {acc.name ? acc.name.slice(0, 2).toUpperCase() : "?"}
                                    </div>
                                    <div>
                                      <div className="font-bold flex items-center gap-1.5">
                                        {acc.name}
                                        {isSelf && (
                                          <span className="badge badge-xs badge-neutral">Tú</span>
                                        )}
                                      </div>
                                      <div className="text-xs text-base-content/50 font-mono">{acc.email}</div>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {acc.isApproved ? (
                                    <span className="badge badge-success badge-sm gap-1 text-xs font-semibold">
                                      <CheckCircle2Icon className="size-3" />
                                      Autorizado
                                    </span>
                                  ) : (
                                    <span className="badge badge-warning badge-sm gap-1 text-xs font-semibold">
                                      <ClockIcon className="size-3" />
                                      Pendiente
                                    </span>
                                  )}
                                </td>

                                <td>
                                  <select
                                    className="select select-bordered select-sm font-semibold max-w-[130px]"
                                    value={acc.role}
                                    disabled={isSelf}
                                    onChange={async (e) => {
                                      const newRole = e.target.value;
                                      try {
                                        const res = await api.put(`/accounts/${acc._id}/role`, { role: newRole });
                                        setAccounts((prev) =>
                                          prev.map((a) => (a._id === acc._id ? res.data : a))
                                        );
                                        toast.success("Rol actualizado correctamente");
                                      } catch (error) {
                                        toast.error(error.response?.data?.message || "Error al cambiar rol");
                                      }
                                    }}
                                  >
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                  </select>
                                </td>

                                <td>
                                  <span className="text-xs text-base-content/60">
                                    {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }) : "—"}
                                  </span>
                                </td>

                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {!acc.isApproved ? (
                                      <button
                                        type="button"
                                        className="btn btn-success btn-sm gap-1 text-white shadow-sm"
                                        onClick={async () => {
                                          try {
                                            const res = await api.put(`/accounts/${acc._id}/approve`);
                                            setAccounts((prev) =>
                                              prev.map((a) => (a._id === acc._id ? res.data : a))
                                            );
                                            toast.success("Usuario autorizado correctamente");
                                          } catch (error) {
                                            toast.error(error.response?.data?.message || "Error al autorizar");
                                          }
                                        }}
                                        title="Autorizar acceso"
                                      >
                                        <UserCheckIcon className="size-4" />
                                        Autorizar
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-warning btn-sm gap-1"
                                        disabled={isSelf}
                                        onClick={async () => {
                                          if (!window.confirm(`¿Revocar el acceso a ${acc.name}? No podrá iniciar sesión hasta ser autorizado nuevamente.`)) return;
                                          try {
                                            const res = await api.put(`/accounts/${acc._id}/reject`);
                                            setAccounts((prev) =>
                                              prev.map((a) => (a._id === acc._id ? res.data : a))
                                            );
                                            toast.success("Acceso revocado");
                                          } catch (error) {
                                            toast.error(error.response?.data?.message || "Error al revocar");
                                          }
                                        }}
                                        title="Revocar acceso"
                                      >
                                        <UserXIcon className="size-4" />
                                        Revocar
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                                      disabled={isSelf}
                                      onClick={async () => {
                                        if (!window.confirm(`¿Estás seguro de eliminar permanentemente la cuenta de ${acc.name}?`)) return;
                                        try {
                                          await api.delete(`/accounts/${acc._id}`);
                                          setAccounts((prev) => prev.filter((a) => a._id !== acc._id));
                                          toast.success("Cuenta eliminada");
                                        } catch (error) {
                                          toast.error(error.response?.data?.message || "Error al eliminar");
                                        }
                                      }}
                                      title="Eliminar cuenta"
                                    >
                                      <Trash2Icon className="size-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BoardSettingsPage;
