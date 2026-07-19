import { PenSquareIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Link } from "react-router";
import { formatDate } from "../lib/utils";
import api from "../lib/axios";
import toast from "react-hot-toast";

const NoteListView = ({
  notes = [],
  setNotes,
  statuses = [],
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta nota/tarea?")) return;

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
                className="cursor-pointer hover:bg-base-200 transition-colors py-3.5 max-w-md"
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

              return (
                <tr
                  key={note._id}
                  className="hover:bg-base-200/50 transition-colors group"
                >
                  <td className="font-semibold text-base-content max-w-xs">
                    <Link
                      to={`/note/${note._id}`}
                      className="hover:text-primary transition-colors block truncate"
                      title={note.title}
                    >
                      {note.title}
                    </Link>
                  </td>
                  <td className="text-base-content/70 max-w-md truncate">
                    <span title={note.content}>{note.content}</span>
                  </td>
                  <td>
                    <span
                      className="badge badge-sm font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: statusColor + "25",
                        color: statusColor,
                        borderColor: statusColor + "60",
                      }}
                    >
                      {note.status || "Pendiente"}
                    </span>
                  </td>
                  <td className="text-xs text-base-content/60 whitespace-nowrap">
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
