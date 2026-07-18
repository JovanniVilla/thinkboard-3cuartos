import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon, PlusIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useStatuses } from "../lib/useStatuses";

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#00FF9D",
];

const BoardSettingsPage = () => {
  const { statuses, setStatuses, loading } = useStatuses();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("El nombre del estado es requerido");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/status", { name: newName, color: newColor });
      setStatuses((prev) => [...prev, res.data]);
      setNewName("");
      setNewColor("#3B82F6");
      toast.success("Estado creado");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el estado");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (status) => {
    setEditingId(status._id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      toast.error("El nombre del estado es requerido");
      return;
    }
    try {
      const res = await api.put(`/status/${id}`, { name: editName, color: editColor });
      setStatuses((prev) => prev.map((s) => (s._id === id ? res.data : s)));
      cancelEdit();
      toast.success("Estado actualizado");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este estado? Las notas asociadas se restablecerán a 'Pendiente'.")) return;
    try {
      await api.delete(`/status/${id}`);
      setStatuses((prev) => prev.filter((s) => s._id !== id));
      toast.success("Estado eliminado");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el estado");
    }
  };

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
              <p className="text-base-content/60 text-sm">Personaliza los estados de tus tareas</p>
            </div>
          </div>

          {/* Current statuses */}
          <div className="card bg-base-100 mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Estados actuales</h2>

              {loading ? (
                <div className="text-center py-6 text-base-content/50">Cargando estados...</div>
              ) : statuses.length === 0 ? (
                <div className="text-center py-6 text-base-content/50">No hay estados configurados</div>
              ) : (
                <ul className="space-y-3">
                  {statuses.map((status) => (
                    <li key={status._id}>
                      {editingId === status._id ? (
                        /* Edit row */
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-base-content/20 bg-base-200">
                          <div className="relative">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-base-content/20 cursor-pointer overflow-hidden"
                              style={{ backgroundColor: editColor }}
                            >
                              <input
                                type="color"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                title="Seleccionar color"
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input input-bordered input-sm flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(status._id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          {/* Preset colors in edit */}
                          <div className="flex gap-1">
                            {PRESET_COLORS.slice(0, 6).map((c) => (
                              <button
                                key={c}
                                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                  backgroundColor: c,
                                  borderColor: editColor === c ? "white" : "transparent",
                                }}
                                onClick={() => setEditColor(c)}
                              />
                            ))}
                          </div>
                          <button
                            className="btn btn-success btn-xs btn-square"
                            onClick={() => handleUpdate(status._id)}
                            title="Guardar"
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={cancelEdit}
                            title="Cancelar"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        /* Display row */
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="flex-1 font-medium">{status.name}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => startEdit(status)}
                              title="Editar"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDelete(status._id)}
                              title="Eliminar"
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
                {/* Name input */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre del estado</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Revisión, Bloqueado, Urgente..."
                    className="input input-bordered"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  />
                </div>

                {/* Color picker */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Color</span>
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-4 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: newColor === color ? "white" : "transparent",
                          boxShadow: newColor === color ? `0 0 0 2px ${color}` : "none",
                        }}
                        onClick={() => setNewColor(color)}
                        title={color}
                      />
                    ))}
                    {/* Custom color input */}
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full border-4 overflow-hidden cursor-pointer transition-transform hover:scale-110"
                        style={{
                          backgroundColor: newColor,
                          borderColor: !PRESET_COLORS.includes(newColor) ? "white" : "transparent",
                          boxShadow: !PRESET_COLORS.includes(newColor) ? `0 0 0 2px ${newColor}` : "none",
                        }}
                        title="Color personalizado"
                      >
                        <input
                          type="color"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-base-content/60">Vista previa:</span>
                    <span
                      className="badge badge-sm font-medium"
                      style={{ backgroundColor: newColor + "30", color: newColor, borderColor: newColor + "50" }}
                    >
                      {newName || "Estado"}
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                  >
                    <PlusIcon className="h-4 w-4" />
                    {creating ? "Creando..." : "Crear Estado"}
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
