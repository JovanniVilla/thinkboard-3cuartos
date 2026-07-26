import { PenSquareIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, ZapIcon, UserIcon, AtSignIcon } from "lucide-react";
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

const NoteListView = ({
  notes = [],
  setNotes,
  statuses = [],
  priorities = [],
  users = [],
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
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

  const handleHeaderClick = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUpIcon className="size-3.5 text-primary inline ml-1" />
    ) : (
      <ArrowDownIcon className="size-3.5 text-primary inline ml-1" />
    );
  };

  if (notes.length === 0) {
    return (
      <div className="bg-base-100 rounded-xl p-12 text-center border border-base-content/10">
        <p className="text-base-content/60">No se encontraron tareas que coincidan con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-xl shadow-sm border border-base-content/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          {/* Table Header */}
          <thead className="bg-base-200/60 text-base-content/70 text-xs uppercase tracking-wider">
            <tr>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5"
                onClick={() => handleHeaderClick("title")}
              >
                <div className="flex items-center gap-1">
                  <span>Título</span>
                  {renderSortIndicator("title")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5 max-w-xs hidden md:table-cell"
                onClick={() => handleHeaderClick("content")}
              >
                <div className="flex items-center gap-1">
                  <span>Contenido</span>
                  {renderSortIndicator("content")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5"
                onClick={() => handleHeaderClick("status")}
              >
                <div className="flex items-center gap-1">
                  <span>Estado</span>
                  {renderSortIndicator("status")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5"
                onClick={() => handleHeaderClick("priority")}
              >
                <div className="flex items-center gap-1">
                  <span>Prioridad</span>
                  {renderSortIndicator("priority")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5"
                onClick={() => handleHeaderClick("user")}
              >
                <div className="flex items-center gap-1">
                  <span>Usuario</span>
                  {renderSortIndicator("user")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5 hidden sm:table-cell"
                onClick={() => handleHeaderClick("createdAt")}
              >
                <div className="flex items-center gap-1">
                  <span>Fecha</span>
                  {renderSortIndicator("createdAt")}
                </div>
              </th>
              <th className="text-right py-3.5">Acciones</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-base-content/10">
            {notes.map((note) => {
              const statusConfig = statuses.find((s) => s.name === note.status);
              const statusColor = statusConfig?.color || "#6B7280";

              const priorityConfig = priorities.find((p) => p.name === note.priority);
              const priorityColor = priorityConfig?.color || "#3B82F6";

              const userConfig = users.find((u) => u.name === note.user);
              const userColor = userConfig?.color || "#6B7280";

              const cleanContent = stripMarkdown(note.content);

              return (
                <tr
                  key={note._id}
                  className="hover:bg-base-200/50 transition-colors group"
                >
                  <td className="font-semibold text-base-content max-w-xs">
                    <div className="flex items-start gap-2 min-w-0 pt-0.5">
                      {note.keyId && (
                        <span className="badge badge-xs font-mono font-bold bg-primary/15 text-primary border border-primary/30 flex-shrink-0">
                          {note.keyId}
                        </span>
                      )}
                      <Link
                        to={`/note/${note._id}`}
                        className="hover:text-primary transition-colors block break-words whitespace-normal"
                        title={note.title}
                      >
                        {note.title}
                      </Link>
                      {getMentionCount(note) > 0 && (
                        <div className="flex items-center gap-1 bg-primary text-primary-content text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex-shrink-0" title={`Tienes ${getMentionCount(note)} mención(es)`}>
                          <AtSignIcon className="size-3" />
                          {getMentionCount(note)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-base-content/70 max-w-xs truncate hidden md:table-cell">
                    <span title={cleanContent}>{cleanContent}</span>
                  </td>
                  <td>
                    <span
                      className="badge badge-sm font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: statusColor + "20",
                        color: statusColor,
                        borderColor: statusColor + "50",
                      }}
                    >
                      {note.status || "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge badge-xs font-bold gap-1 px-2 py-2 whitespace-nowrap"
                      style={{
                        backgroundColor: priorityColor + "15",
                        color: priorityColor,
                        borderColor: priorityColor + "40",
                      }}
                    >
                      <ZapIcon className="size-3" />
                      {note.priority || "Media"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 max-w-[140px]" title={note.user || "Sin asignar"}>
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
                      <span className="truncate text-xs font-medium text-base-content/80">
                        {note.user || "Sin asignar"}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs text-base-content/60 whitespace-nowrap hidden sm:table-cell">
                    {formatDate(new Date(note.createdAt))}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/note/${note._id}`}
                        className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary"
                        title="Editar tarea"
                      >
                        <PenSquareIcon className="size-4" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                        onClick={(e) => handleDelete(e, note._id)}
                        title="Eliminar tarea"
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
    </div>
  );
};

export default NoteListView;
