import { useState } from "react";
import { PenSquareIcon, Trash2Icon, PlusIcon } from "lucide-react";
import { Link } from "react-router";
import { formatDate } from "../lib/utils";
import api from "../lib/axios";
import toast from "react-hot-toast";

const NoteKanbanView = ({ notes = [], setNotes, statuses = [] }) => {
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
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

    // Optimistic update locally
    const previousStatus = note.status;
    setNotes((prev) =>
      prev.map((n) => (n._id === noteId ? { ...n, status: targetStatusName } : n))
    );
    setDraggingNoteId(null);

    // Call API
    try {
      await api.put(`/notes/${noteId}`, {
        title: note.title,
        content: note.content,
        status: targetStatusName,
      });
      toast.success(`Movido a "${targetStatusName}"`);
    } catch (error) {
      console.error("Error updating status via drag drop:", error);
      toast.error("Error al mover la tarea");
      // Revert optimistic update on failure
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
                  columnNotes.map((note) => (
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
                          <Link
                            to={`/note/${note._id}`}
                            className="font-semibold text-sm text-base-content hover:text-primary transition-colors line-clamp-2 block"
                          >
                            {note.title}
                          </Link>
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

                        <p className="text-xs text-base-content/70 line-clamp-3">
                          {note.content}
                        </p>

                        <div className="pt-2 border-t border-base-content/10 flex items-center justify-between text-[11px] text-base-content/50">
                          <span>{formatDate(new Date(note.createdAt))}</span>
                          <span className="italic">Arrastra para mover</span>
                        </div>
                      </div>
                    </div>
                  ))
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
