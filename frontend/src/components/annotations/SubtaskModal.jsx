import React, { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import { useAuth } from "../../lib/AuthContext";
import {
  XIcon,
  CheckCircle2Icon,
  Trash2Icon,
  MapPinIcon,
  MessageSquareIcon,
  SendIcon,
  InfoIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

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
  const { user: currentUser } = useAuth();
  const isEditing = Boolean(subtask?._id);

  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'comments'
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("pending");
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const commentsEndRef = useRef(null);

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
      setComments(subtask.comments || []);
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setStatus("pending");
      setComments([]);
      setActiveTab("details");
    }
  }, [subtask, isOpen]);

  // Scroll to bottom of comments when new comment is added or tab switched
  useEffect(() => {
    if (activeTab === "comments") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, comments.length]);

  if (!isOpen) return null;

  const currentMarker = isEditing ? subtask?.marker : markerData;

  const handleSubmitDetails = async (e) => {
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

        toast.success("Subtarea y checklist actualizados");
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
        toast.success("Subtarea creada y añadida al checklist");
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

    if (
      !window.confirm(
        "¿Seguro que deseas eliminar este marcador? Se retirará también del checklist de la tarea."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/subtasks/${subtask._id}`);
      toast.success("Subtarea eliminada del checklist y del archivo");
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !subtask?._id) return;

    setIsSendingComment(true);
    try {
      const res = await api.post(`/subtasks/${subtask._id}/comments`, {
        text: newCommentText.trim(),
      });

      const updatedSubtask = res.data.subtask;
      setComments(updatedSubtask.comments || []);
      setNewCommentText("");
      toast.success("Comentario registrado");

      if (onSaved) {
        onSaved(updatedSubtask, false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(
        error.response?.data?.message || "Error al enviar el comentario."
      );
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("¿Deseas eliminar este comentario?")) return;

    try {
      const res = await api.delete(
        `/subtasks/${subtask._id}/comments/${commentId}`
      );
      setComments(res.data.subtask.comments || []);
      toast.success("Comentario eliminado");
      if (onSaved) {
        onSaved(res.data.subtask, false);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error al eliminar el comentario.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-base-100 rounded-2xl border border-base-content/10 shadow-2xl w-full max-w-lg overflow-hidden text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-content/10 bg-base-200/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <MapPinIcon className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-base-content">
                {isEditing ? "Marcador de Subtarea" : "Nueva Subtarea en Marcador"}
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

        {/* Tabs navigation for existing subtasks */}
        {isEditing && (
          <div className="flex border-b border-base-content/10 bg-base-100 px-5 pt-2 gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/60 hover:text-base-content"
              }`}
            >
              <InfoIcon className="size-3.5" />
              <span>Información</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "comments"
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/60 hover:text-base-content"
              }`}
            >
              <MessageSquareIcon className="size-3.5" />
              <span>Dudas y Comentarios</span>
              {comments.length > 0 && (
                <span className="badge badge-xs bg-primary text-primary-content font-bold px-1.5 py-0.5">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab 1: Details Form */}
        {(!isEditing || activeTab === "details") && (
          <form
            onSubmit={handleSubmitDetails}
            className="p-5 space-y-4 overflow-y-auto flex-1"
          >
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
              <p className="text-[10px] text-base-content/40 mt-1">
                Se sincroniza automáticamente con el checklist de la tarea.
              </p>
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
                  <span>Eliminar Pin</span>
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
        )}

        {/* Tab 2: Comments & Doubts Discussion Thread */}
        {isEditing && activeTab === "comments" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Comments Feed */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-base-200/30">
              {comments.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-2">
                  <div className="p-3 bg-base-200 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-base-content/40">
                    <MessageSquareIcon className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-base-content">
                    Sin preguntas ni dudas aún
                  </p>
                  <p className="text-[11px] text-base-content/50 max-w-xs mx-auto">
                    Usa este hilo para consultar información técnica, solicitar
                    más detalles o aclarar dudas sobre este punto del archivo.
                  </p>
                </div>
              ) : (
                comments.map((c) => {
                  const isAuthor =
                    currentUser &&
                    (c.user === currentUser._id ||
                      c.user?._id === currentUser._id ||
                      currentUser.role === "admin");

                  const commentDate = new Date(c.createdAt).toLocaleDateString(
                    "es-ES",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <div
                      key={c._id}
                      className="group flex items-start gap-2.5 text-xs text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-xs mt-0.5"
                        style={{ backgroundColor: c.userColor || "#3B82F6" }}
                      >
                        {getInitials(c.userName)}
                      </div>

                      <div className="flex-1 bg-base-100 p-2.5 rounded-xl border border-base-content/10 shadow-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-base-content">
                            {c.userName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-base-content/40 font-mono">
                              {commentDate}
                            </span>
                            {isAuthor && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c._id)}
                                className="opacity-0 group-hover:opacity-100 text-base-content/40 hover:text-error transition-opacity p-0.5"
                                title="Eliminar comentario"
                              >
                                <Trash2Icon className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-base-content/80 break-words whitespace-pre-wrap">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input Footer */}
            <form
              onSubmit={handleAddComment}
              className="p-3 bg-base-100 border-t border-base-content/10 flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escribe una duda o solicita información..."
                className="input input-sm input-bordered flex-1 rounded-xl text-xs focus:input-primary"
              />
              <button
                type="submit"
                disabled={isSendingComment || !newCommentText.trim()}
                className="btn btn-sm btn-primary rounded-xl px-3 gap-1"
                title="Enviar comentario o duda"
              >
                {isSendingComment ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <SendIcon className="size-3.5" />
                )}
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
