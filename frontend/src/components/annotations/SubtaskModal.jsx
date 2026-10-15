import React, { useState, useEffect } from "react";
import api from "../../lib/axios";
import {
  XIcon,
  CheckCircle2Icon,
  Trash2Icon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
  FileTextIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SubtaskModal({
  isOpen,
  onClose,
  parentTaskId,
  subtask = null, // Existing subtask if editing
  markerData = null, // { fileId, pageNumber, xPercent, yPercent } if creating new
  accounts = [], // List of users to assign
  onSaved, // Callback (savedSubtask, isNew) => void
  onDeleted, // Callback (subtaskId) => void
}) {
  const isEditing = Boolean(subtask?._id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title || "");
      setDescription(subtask.description || "");
      setAssignedTo(
        typeof subtask.assignedTo === "object"
          ? subtask.assignedTo?._id || ""
          : subtask.assignedTo || ""
      );
      setStatus(subtask.status || "pending");
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setStatus("pending");
    }
  }, [subtask, isOpen]);

  if (!isOpen) return null;

  const currentMarker = isEditing ? subtask?.marker : markerData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título de la subtarea es obligatorio.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Update existing subtask
        const response = await api.patch(`/subtasks/${subtask._id}`, {
          title: title.trim(),
          description: description.trim(),
          assignedTo: assignedTo || null,
          status,
        });

        toast.success("Subtarea actualizada");
        if (onSaved) onSaved(response.data.subtask, false);
      } else {
        // Create new subtask
        const payload = {
          title: title.trim(),
          description: description.trim(),
          assignedTo: assignedTo || null,
          status,
          parentTaskId,
          marker: currentMarker,
        };

        const response = await api.post("/subtasks", payload);
        toast.success("Subtarea creada con éxito");
        if (onSaved) onSaved(response.data.subtask, true);
      }

      onClose();
    } catch (error) {
      console.error("Error saving subtask:", error);
      toast.error(
        error.response?.data?.message || "Error al guardar la subtarea."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subtask?._id) return;

    if (!window.confirm("¿Seguro que deseas eliminar este marcador de subtarea?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/subtasks/${subtask._id}`);
      toast.success("Subtarea eliminada");
      if (onDeleted) onDeleted(subtask._id);
      onClose();
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar la subtarea."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-base-100 rounded-2xl border border-base-content/10 shadow-2xl w-full max-w-md overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-content/10 bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <MapPinIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-base-content">
                {isEditing ? "Detalle de Subtarea" : "Nueva Subtarea en Marcador"}
              </h3>
              {currentMarker && (
                <span className="text-[11px] text-base-content/50 font-mono">
                  X: {Number(currentMarker.xPercent || 0).toFixed(1)}% | Y:{" "}
                  {Number(currentMarker.yPercent || 0).toFixed(1)}%
                  {currentMarker.pageNumber ? ` | Pág. ${currentMarker.pageNumber}` : ""}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-base-content"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-1">
              Título <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar cotización en la esquina superior..."
              className="input input-sm input-bordered w-full rounded-xl text-sm focus:input-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-1">
              Descripción o Instrucciones
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade notas o detalles de la subtarea..."
              className="textarea textarea-bordered w-full rounded-xl text-xs resize-none focus:textarea-primary"
            />
          </div>

          {/* Status & Assignee Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select select-sm select-bordered w-full rounded-xl text-xs"
              >
                <option value="pending">🟡 Pendiente</option>
                <option value="in_progress">🔵 En Progreso</option>
                <option value="completed">🟢 Completada</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-1">
                Asignado a
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="select select-sm select-bordered w-full rounded-xl text-xs"
              >
                <option value="">Sin asignar</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-base-content/10">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-1.5"
              >
                <Trash2Icon className="size-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-sm btn-primary gap-1.5 font-medium"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <CheckCircle2Icon className="size-4" />
                )}
                <span>{isEditing ? "Guardar cambios" : "Crear pin"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
