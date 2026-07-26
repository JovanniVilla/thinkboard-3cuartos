import { useState } from "react";
import { PenSquareIcon, Trash2Icon, ZapIcon, UserIcon, AtSignIcon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { Link } from "react-router";
import { formatDate, stripMarkdown } from "../lib/utils";
import api from "../lib/axios";
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

const NoteKanbanView = ({ notes = [], setNotes, statuses = [], priorities = [], users = [] }) => {
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const { user } = useAuth();

  const getMentionCount = (note) => {
    if (!user?.name || !note.activities) return 0;
    return note.activities.reduce((acc, act) => {
      if (act.mentions?.includes(user.name) && !act.resolvedMentions?.includes(user.name)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success("Tarea eliminada exitosamente");
    } catch (error) {
      console.error("Error in handleDelete", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleDragStart = (e, note) => {
    setDraggingNoteId(note._id);
    e.dataTransfer.setData("text/plain", note._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, statusName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== statusName) {
      setDragOverStatus(statusName);
    }
  };

  const handleDragLeave = (e, statusName) => {
    if (dragOverStatus === statusName) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (e, targetStatusName) => {
    e.preventDefault();
    setDragOverStatus(null);
    const noteId = e.dataTransfer.getData("text/plain") || draggingNoteId;
    if (!noteId) return;

    const note = notes.find((n) => n._id === noteId);
    if (!note || note.status === targetStatusName) {
      setDraggingNoteId(null);
      return;
    }

    const previousStatus = note.status;
    setNotes((prev) =>
      prev.map((n) => (n._id === noteId ? { ...n, status: targetStatusName } : n))
    );
    setDraggingNoteId(null);

    try {
      await api.put(`/notes/${noteId}`, {
        ...note,
        status: targetStatusName,
      });
      toast.success(`Movido a "${targetStatusName}"`);
    } catch (error) {
      console.error("Error updating status via drag drop:", error);
      toast.error("Error al mover la tarea");
      setNotes((prev) =>
        prev.map((n) => (n._id === noteId ? { ...n, status: previousStatus } : n))
      );
    }
  };

  const handleDragEnd = () => {
    setDraggingNoteId(null);
    setDragOverStatus(null);
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex items-start gap-6 min-w-max">
        {statuses.map((status) => {
          const columnNotes = notes.filter(
            (n) => n.status === status.name || (!n.status && status.name === "Pendiente")
          );

          const isOver = dragOverStatus === status.name;

          return (
            <div
              key={status._id}
              className={`w-80 flex-shrink-0 bg-base-100 rounded-xl border border-base-content/10 shadow-sm flex flex-col max-h-[calc(100vh-250px)] transition-colors ${
                isOver ? "ring-2 ring-primary bg-base-200/50" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, status.name)}
              onDragLeave={(e) => handleDragLeave(e, status.name)}
              onDrop={(e) => handleDrop(e, status.name)}
            >
              {/* Column Header */}
              <div
                className="p-3.5 border-b border-base-content/10 flex items-center justify-between rounded-t-xl border-t-4"
                style={{ borderTopColor: status.color }}
              >
                <div className="flex items-center gap-2 font-bold text-base-content">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="truncate max-w-[170px]" title={status.name}>
                    {status.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="badge badge-sm font-semibold px-2"
                    style={{
                      backgroundColor: status.color + "20",
                      color: status.color,
                      borderColor: status.color + "50",
                    }}
                  >
                    {columnNotes.length}
                  </span>
                </div>
              </div>

              {/* Column Cards */}
              <div className="p-3 overflow-y-auto flex-1 space-y-3 min-h-[150px]">
                {columnNotes.length === 0 ? (
                  <div className="h-full min-h-[120px] rounded-lg border-2 border-dashed border-base-content/10 flex items-center justify-center p-4 text-center">
                    <span className="text-xs text-base-content/40">
                      {isOver ? "Suelta la tarea aquí" : "Sin tareas en este estado"}
                    </span>
                  </div>
                ) : (
                  columnNotes.map((note) => {
                    const priorityConfig = priorities.find((p) => p.name === note.priority);
                    const priorityColor = priorityConfig?.color || "#3B82F6";

                    const userConfig = users.find((u) => u.name === note.user);
                    const userColor = userConfig?.color || "#6B7280";

                    const cleanContent = stripMarkdown(note.content);

                    return (
                      <div
                        key={note._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note)}
                        onDragEnd={handleDragEnd}
                        className={`card bg-base-200/70 hover:bg-base-200 border border-base-content/10 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm hover:shadow ${
                          draggingNoteId === note._id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        <div className="card-body p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {note.keyId && (
                                <span className="badge badge-xs font-mono font-bold bg-primary/15 text-primary border border-primary/30 mb-1 inline-block">
                                  {note.keyId}
                                </span>
                              )}
                              <Link
                                to={`/note/${note._id}`}
                                className="font-semibold text-sm text-base-content hover:text-primary transition-colors break-words whitespace-normal block"
                              >
                                {note.title}
                              </Link>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
                              <Link
                                to={`/note/${note._id}`}
                                className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary"
                                title="Editar"
                              >
                                <PenSquareIcon className="size-3.5" />
                              </Link>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                                onClick={(e) => handleDelete(e, note._id)}
                                title="Eliminar"
                              >
                                <Trash2Icon className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Priority badge */}
                            {note.priority && (
                              <div className="flex items-center">
                                <span
                                  className="badge badge-xs font-bold gap-1 px-2 py-2"
                                  style={{
                                    backgroundColor: priorityColor + "15",
                                    color: priorityColor,
                                    borderColor: priorityColor + "40",
                                  }}
                                >
                                  <ZapIcon className="size-3" />
                                  {note.priority}
                                </span>
                              </div>
                            )}

                            {/* Mentions badge */}
                            {getMentionCount(note) > 0 && (
                              <div className="flex items-center gap-1 bg-primary text-primary-content text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm" title={`Tienes ${getMentionCount(note)} mención(es)`}>
                                <AtSignIcon className="size-3" />
                                {getMentionCount(note)}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-base-content/70 line-clamp-3 leading-relaxed">
                            {cleanContent}
                          </p>

                          {/* Footer: Assignee & Date */}
                          <div className="pt-2 border-t border-base-content/10 flex items-center justify-between text-[11px] text-base-content/60">
                            <div className="flex items-center gap-1.5 truncate" title={`Asignado a: ${note.user || "Sin asignar"}`}>
                              {note.user && note.user !== "Sin asignar" ? (
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: userColor }}
                                >
                                  {getInitials(note.user)}
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 flex-shrink-0">
                                  <UserIcon className="size-3" />
                                </span>
                              )}
                              <span className="truncate max-w-[100px] font-medium text-base-content/80">
                                {note.user || "Sin asignar"}
                              </span>
                            </div>

                            <span>{formatDate(new Date(note.createdAt))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NoteKanbanView;
