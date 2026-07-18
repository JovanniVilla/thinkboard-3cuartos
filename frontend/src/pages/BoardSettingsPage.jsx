import { useState, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  GripVerticalIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useStatuses } from "../lib/useStatuses";

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#00FF9D",
];

// ─── Inline-edit row ────────────────────────────────────────────────────────
const EditRow = ({ status, onSave, onCancel }) => {
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del estado es requerido");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/status/${status._id}`, { name: name.trim(), color });
      onSave(res.data);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-base-200 p-3 space-y-3">
      {/* Name + color swatch */}
      <div className="flex items-center gap-3">
        {/* Color swatch / native picker */}
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
          placeholder="Nombre del estado"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onCancel();
          }}
        />
      </div>

      {/* Preset palette */}
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

      {/* Preview */}
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
          {name || "Estado"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm gap-1"
          onClick={onCancel}
          disabled={saving}
        >
          <XIcon className="h-4 w-4" />
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-1"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const BoardSettingsPage = () => {
  const { statuses, setStatuses, loading } = useStatuses();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // DnD refs
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("El nombre del estado es requerido");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/status", { name: newName.trim(), color: newColor });
      setStatuses((prev) => [...prev, res.data]);
      setNewName("");
      setNewColor("#3B82F6");
      toast.success("Estado creado");
    } catch {
      toast.error("Error al crear el estado");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este estado? Las notas asociadas se restablecerán a 'Pendiente'.")) return;
    try {
      await api.delete(`/status/${id}`);
      setStatuses((prev) => prev.filter((s) => s._id !== id));
      toast.success("Estado eliminado");
    } catch {
      toast.error("Error al eliminar el estado");
    }
  };

  // ── Edit save ───────────────────────────────────────────────────────────
  const handleEditSave = (updated) => {
    setStatuses((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditingId(null);
  };

  // ── Drag-and-Drop ────────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState(null);

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

  const handleDrop = async () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) {
      setDraggingId(null);
      return;
    }

    // Reorder locally
    const reordered = [...statuses];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    // Assign new order values
    const withOrder = reordered.map((s, i) => ({ ...s, order: i }));
    setStatuses(withOrder);
    setDraggingId(null);
    dragIndex.current = null;
    dragOverIndex.current = null;

    // Persist to backend (fire-and-forget per item)
    try {
      await Promise.all(withOrder.map((s) => api.put(`/status/${s._id}`, { order: s.order })));
    } catch {
      toast.error("Error al guardar el orden");
    }
  };

  const handleDragEnd = () => setDraggingId(null);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="btn btn-ghost btn-sm">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Configuración del Tablero</h1>
              <p className="text-base-content/60 text-sm">
                Personaliza y ordena los estados de tus tareas
              </p>
            </div>
          </div>

          {/* Status list */}
          <div className="card bg-base-100 mb-6">
            <div className="card-body">
              <div className="flex items-center justify-between mb-1">
                <h2 className="card-title text-lg">Estados actuales</h2>
                <span className="text-xs text-base-content/40 flex items-center gap-1">
                  <GripVerticalIcon className="h-3 w-3" />
                  Arrastra para reordenar
                </span>
              </div>

              {loading ? (
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
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      className={`transition-all duration-150 ${
                        draggingId === status._id ? "opacity-40 scale-95" : ""
                      } ${
                        draggingId && draggingId !== status._id && dragOverIndex.current === index
                          ? "ring-2 ring-primary rounded-xl"
                          : ""
                      }`}
                    >
                      {editingId === status._id ? (
                        <EditRow
                          status={status}
                          onSave={handleEditSave}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-base-200 transition-colors group">
                          {/* Drag handle */}
                          <GripVerticalIcon className="h-4 w-4 text-base-content/25 cursor-grab active:cursor-grabbing flex-shrink-0" />

                          {/* Color dot */}
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.color }}
                          />

                          {/* Badge preview */}
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

                          {/* Actions — visible on hover */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="btn btn-ghost btn-xs gap-1"
                              onClick={() => setEditingId(status._id)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDelete(status._id)}
                            >
                              <Trash2Icon className="h-3 w-3" />
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

          {/* Create new status */}
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Agregar nuevo estado</h2>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre del estado</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Revisión, Bloqueado, Urgente…"
                    className="input input-bordered"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  />
                </div>

                {/* Color */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Color</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          outline: newColor === color ? `3px solid ${color}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                    {/* Custom picker */}
                    <label
                      className="relative w-8 h-8 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-base-content/30 flex items-center justify-center hover:border-base-content/60 transition-colors"
                      style={!PRESET_COLORS.includes(newColor) ? { backgroundColor: newColor, border: "none", outline: `3px solid ${newColor}`, outlineOffset: "2px" } : {}}
                      title="Color personalizado"
                    >
                      {PRESET_COLORS.includes(newColor) && <span className="text-base-content/40 text-xs">+</span>}
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-base-content/50">Vista previa:</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{
                        backgroundColor: newColor + "25",
                        color: newColor,
                        borderColor: newColor + "60",
                      }}
                    >
                      {newName || "Estado"}
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <button
                    className="btn btn-primary gap-2"
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                  >
                    <PlusIcon className="h-4 w-4" />
                    {creating ? "Creando…" : "Crear Estado"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BoardSettingsPage;
