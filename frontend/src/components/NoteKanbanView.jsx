import { useState } from "react";
import { PenSquareIcon, ArchiveIcon, ZapIcon, UserIcon, AtSignIcon, CalendarIcon, CheckIcon, TrendingUpIcon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { Link, useLocation } from "react-router";
import { formatDate } from "../lib/utils";
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

const NoteKanbanView = ({
  notes = [],
  setNotes,
  statuses = [],
  priorities = [],
  values = [],
  users = [],
  projects = [],
  selectedProject = "",
  onSelectProject,
  highlightedNoteId,
}) => {
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const { user } = useAuth();
  const location = useLocation();

  const getMentionCount = (note) => {
    if (!user?.name || !note.activities) return 0;
    return note.activities.reduce((acc, act) => {
      if (act.mentions?.includes(user.name) && !act.resolvedMentions?.includes(user.name)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  };

  const handleArchive = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que quieres archivar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success("Tarea archivada exitosamente");
    } catch (error) {
      console.error("Error in handleArchive", error);
      toast.error("Error al archivar la tarea");
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
    <div className="overflow-x-auto pb-6 h-full flex flex-col">
      <div className="flex items-start gap-6 min-w-max flex-1 min-h-0">
        {statuses.map((status) => {
          const columnNotes = notes.filter(
            (n) => n.status === status.name || (!n.status && status.name === "Pendiente")
          );

          const isOver = dragOverStatus === status.name;

          return (
            <div
              key={status._id}
              className={`w-80 flex-shrink-0 bg-base-100 rounded-xl border border-base-content/10 shadow-sm flex flex-col max-h-full transition-colors ${
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

                    const valueConfig = values.find((v) => v.name === (note.value || "Medio"));
                    const valueColor = valueConfig?.color || "#3B82F6";

                    const userConfig = users.find((u) => u.name === note.user);
                    const userColor = userConfig?.color || "#6B7280";

                    const projectId = typeof note.project === "object" ? note.project?._id : note.project;
                    const projectItem = projectId ? projects.find((p) => p._id === projectId) : null;
                    const isProjectFiltered = Boolean(projectItem && selectedProject === projectItem._id);

                    const mentionCount = getMentionCount(note);
                    const hasTopBadges = Boolean(note.projectKeyId || note.keyId || note.priority || note.value);
                    const hasSecondaryBadges = Boolean(
                      (note.labels && note.labels.length > 0) ||
                        mentionCount > 0 ||
                        note.startDate ||
                        note.dueDate
                    );

                    const actionButtons = (
                      <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
                        <Link
                          to={`/note/${note._id}`}
                          state={{ returnTo: location.pathname + location.search }}
                          className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary"
                          title="Editar"
                        >
                          <PenSquareIcon className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:bg-base-300/60 hover:text-base-content"
                          onClick={(e) => handleArchive(e, note._id)}
                          title="Archivar tarea"
                        >
                          <ArchiveIcon className="size-3.5" />
                        </button>
                      </div>
                    );

                    const titleLink = (
                      <Link
                        to={`/note/${note._id}`}
                        state={{ returnTo: location.pathname + location.search }}
                        className="font-semibold text-sm text-base-content hover:text-primary transition-colors break-words whitespace-normal block leading-snug"
                      >
                        {note.title}
                      </Link>
                    );

                    return (
                      <div
                        key={note._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note)}
                        onDragEnd={handleDragEnd}
                        className={`card bg-base-200/70 hover:bg-base-200 border transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm hover:shadow ${
                          highlightedNoteId === note._id
                            ? "border-primary ring-2 ring-primary bg-primary/10 shadow-lg animate-pulse"
                            : "border-base-content/10"
                        } ${
                          draggingNoteId === note._id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        <div className="card-body p-3.5 gap-2.5">
                          {hasTopBadges ? (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                                  {(note.projectKeyId || note.keyId) && (
                                    <span
                                      className="badge badge-xs h-auto px-2 py-0.5 leading-tight font-mono font-bold bg-primary/15 text-primary border border-primary/30 whitespace-nowrap"
                                      title={
                                        note.projectKeyId && note.globalKeyId
                                          ? `ID Proyecto: ${note.projectKeyId} | Global: ${note.globalKeyId}`
                                          : `ID: ${note.keyId || note.globalKeyId}`
                                      }
                                    >
                                      {note.projectKeyId || note.keyId}
                                    </span>
                                  )}
                                  {note.priority && (
                                    <span
                                      className="badge badge-xs h-auto font-bold gap-1 px-2 py-0.5 leading-tight whitespace-nowrap"
                                      style={{
                                        backgroundColor: priorityColor + "15",
                                        color: priorityColor,
                                        borderColor: priorityColor + "40",
                                      }}
                                    >
                                      <ZapIcon className="size-3 flex-shrink-0" />
                                      {note.priority}
                                    </span>
                                  )}
                                  {note.value && (
                                    <span
                                      className="badge badge-xs h-auto font-bold gap-1 px-2 py-0.5 leading-tight whitespace-nowrap"
                                      style={{
                                        backgroundColor: valueColor + "15",
                                        color: valueColor,
                                        borderColor: valueColor + "40",
                                      }}
                                      title={`Valor: ${note.value}`}
                                    >
                                      <TrendingUpIcon className="size-3 flex-shrink-0" />
                                      {note.value}
                                    </span>
                                  )}
                                </div>
                                {actionButtons}
                              </div>
                              {titleLink}
                            </>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">{titleLink}</div>
                              {actionButtons}
                            </div>
                          )}

                          {/* Badges Row */}
                          {hasSecondaryBadges && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Labels */}
                              {note.labels?.map((label, idx) => (
                                <span
                                  key={idx}
                                  className="badge badge-xs h-auto font-semibold px-2 py-0.5 leading-tight max-w-full truncate"
                                  style={{
                                    backgroundColor: label.color + "20",
                                    color: label.color,
                                    borderColor: label.color + "40",
                                  }}
                                  title={label.name}
                                >
                                  {label.name}
                                </span>
                              ))}

                              {/* Mentions badge */}
                              {mentionCount > 0 && (
                                <div
                                  className="flex items-center gap-1 bg-primary text-primary-content text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                                  title={`Tienes ${mentionCount} mención(es)`}
                                >
                                  <AtSignIcon className="size-3" />
                                  {mentionCount}
                                </div>
                              )}

                              {/* Dates Badge */}
                              {(note.startDate || note.dueDate) && (
                                <div
                                  className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                                    note.completedAt
                                      ? "bg-success/20 text-success border-success/30"
                                      : note.dueDate && new Date(note.dueDate) < new Date()
                                      ? "bg-error/20 text-error border-error/30"
                                      : "bg-base-200 text-base-content/70 border-base-content/10"
                                  }`}
                                  title={
                                    note.dueDate
                                      ? `Vence: ${new Date(note.dueDate).toLocaleString()}`
                                      : `Inicia: ${new Date(note.startDate).toLocaleString()}`
                                  }
                                >
                                  <CalendarIcon className="size-3" />
                                  {note.dueDate ? (
                                    <span>
                                      {new Date(note.dueDate).toLocaleDateString("es-ES", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  ) : (
                                    <span>
                                      {new Date(note.startDate).toLocaleDateString("es-ES", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                  {note.completedAt && <CheckIcon className="size-3" />}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer: Assignee, Project & Date */}
                          <div className="pt-2 border-t border-base-content/10 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-[11px] text-base-content/60">
                            <div
                              className="flex items-center gap-1.5 min-w-0 flex-1"
                              title={`Asignado a: ${note.user || "Sin asignar"}${userConfig?.jobTitle ? ` - ${userConfig.jobTitle}` : ""}`}
                            >
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
                              <span className="truncate font-medium text-base-content/80">
                                {note.user || "Sin asignar"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                              {projectItem && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onSelectProject) {
                                      onSelectProject(isProjectFiltered ? "" : projectItem._id);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all max-w-[115px] cursor-pointer hover:brightness-95 ${
                                    isProjectFiltered ? "ring-1 ring-primary shadow-xs" : ""
                                  }`}
                                  style={{
                                    backgroundColor: (projectItem.color || "#6B7280") + "18",
                                    color: projectItem.color || "#6B7280",
                                    borderColor: (projectItem.color || "#6B7280") + "45",
                                  }}
                                  title={
                                    isProjectFiltered
                                      ? `Quitar filtro de proyecto (${projectItem.name})`
                                      : `Filtrar por proyecto: ${projectItem.name}`
                                  }
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: projectItem.color || "#6B7280" }}
                                  />
                                  <span className="truncate">{projectItem.name}</span>
                                </button>
                              )}
                              <span className="whitespace-nowrap">{formatDate(new Date(note.createdAt))}</span>
                            </div>
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
