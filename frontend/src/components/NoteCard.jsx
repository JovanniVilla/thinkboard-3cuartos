import { PenSquareIcon, Trash2Icon, ZapIcon, UserIcon } from "lucide-react";
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

const NoteCard = ({ note, setNotes, statuses = [], priorities = [], users = [] }) => {
  const statusConfig = statuses.find((s) => s.name === note.status);
  const statusColor = statusConfig?.color || "#6B7280";

  const priorityConfig = priorities.find((p) => p.name === note.priority);
  const priorityColor = priorityConfig?.color || "#3B82F6";

  const userConfig = users.find((u) => u.name === note.user);
  const userColor = userConfig?.color || "#6B7280";

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success("Tarea eliminada correctamente");
    } catch (error) {
      console.error("Error in handleDelete", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const cleanContent = stripMarkdown(note.content);

  return (
    <Link
      to={`/note/${note._id}`}
      className="card bg-base-100 hover:shadow-lg transition-all duration-200 border-t-4 border-solid overflow-hidden border border-base-content/10"
      style={{ borderTopColor: statusColor }}
    >
      <div className="card-body p-4 space-y-3">
        {/* Title and Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {note.keyId && (
              <span className="badge badge-sm font-mono font-bold bg-primary/15 text-primary border border-primary/30 flex-shrink-0">
                {note.keyId}
              </span>
            )}
            <h3 className="card-title text-base text-base-content line-clamp-1">{note.title}</h3>
          </div>
          {note.status && (
            <span
              className="badge badge-sm font-semibold flex-shrink-0"
              style={{
                backgroundColor: statusColor + "20",
                color: statusColor,
                borderColor: statusColor + "50",
              }}
            >
              {note.status}
            </span>
          )}
        </div>

        {/* Priority badge */}
        <div className="flex items-center gap-2">
          {note.priority && (
            <span
              className="badge badge-xs font-bold gap-1 px-2 py-2"
              style={{
                backgroundColor: priorityColor + "15",
                color: priorityColor,
                borderColor: priorityColor + "40",
              }}
              title={`Prioridad: ${note.priority}`}
            >
              <ZapIcon className="size-3" />
              {note.priority}
            </span>
          )}
        </div>

        <p className="text-sm text-base-content/70 line-clamp-3 leading-relaxed">{cleanContent}</p>

        {/* Footer: User avatar, Date, Actions */}
        <div className="pt-3 border-t border-base-content/10 flex items-center justify-between text-xs text-base-content/60">
          <div className="flex items-center gap-2" title={`Asignado a: ${note.user || "Sin asignar"}`}>
            {note.user && note.user !== "Sin asignar" ? (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm flex-shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {getInitials(note.user)}
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 flex-shrink-0">
                <UserIcon className="size-3.5" />
              </span>
            )}
            <span className="truncate max-w-[110px] text-base-content/80 font-medium">
              {note.user || "Sin asignar"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>{formatDate(new Date(note.createdAt))}</span>
            <div className="flex items-center gap-0.5">
              <span className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary">
                <PenSquareIcon className="size-3.5" />
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                onClick={(e) => handleDelete(e, note._id)}
                title="Eliminar tarea"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
export default NoteCard;
