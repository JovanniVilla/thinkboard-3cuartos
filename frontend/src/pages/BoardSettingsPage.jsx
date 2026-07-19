import { useState, useRef } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useUsers } from "../lib/useUsers";

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
  const [activeTab, setActiveTab] = useState("statuses"); // "statuses" | "priorities" | "users"

  // Data Hooks
  const { statuses, setStatuses, loading: loadingStatuses } = useStatuses();
  const { priorities, setPriorities, loading: loadingPriorities } = usePriorities();
  const { users, setUsers, loading: loadingUsers } = useUsers();

  // Create state
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
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

          {/* Navigation Tabs */}
          <div className="tabs tabs-boxed bg-base-100 p-1.5 rounded-xl shadow-sm border border-base-content/10 mb-6 flex">
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
              <span>Usuarios ({users.length})</span>
            </button>
          </div>

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

        </div>
      </div>
    </div>
  );
};

export default BoardSettingsPage;
