import { useState } from "react";
import { PenSquareIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, ZapIcon, UserIcon, AtSignIcon, ListChecksIcon, CheckCircle2Icon, PlusIcon, CalendarIcon, CheckIcon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useLabels } from "../lib/useLabels";
import { Link, useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const { labels: boardLabels } = useLabels();
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  const handleLabelToggle = (note, labelObj) => {
    const currentLabels = note.labels || [];
    const exists = currentLabels.some((l) => l.name.toLowerCase() === labelObj.name.toLowerCase());
    let nextLabels;
    if (exists) {
      nextLabels = currentLabels.filter((l) => l.name.toLowerCase() !== labelObj.name.toLowerCase());
    } else {
      nextLabels = [...currentLabels, { name: labelObj.name, color: labelObj.color }];
    }
    handleInlineEdit(note._id, "labels", nextLabels);
  };

  const handleInlineEdit = async (noteId, field, value) => {
    const note = notes.find(n => n._id === noteId);
    if (!note || note[field] === value) return;

    const previousValue = note[field];
    // Optimistic update
    setNotes(prev => prev.map(n => n._id === noteId ? { ...n, [field]: value } : n));

    try {
      await api.put(`/notes/${noteId}`, { ...note, [field]: value });
      toast.success("Tarea actualizada");
    } catch (error) {
      console.error("Error updating note", error);
      toast.error("Error al actualizar la tarea");
      // Revert on error
      setNotes(prev => prev.map(n => n._id === noteId ? { ...n, [field]: previousValue } : n));
    }
  };
  
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
      <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[300px]">
        <table className="table w-full">
          {/* Table Header */}
          <thead className="bg-base-200/95 backdrop-blur text-base-content/70 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th
                className="cursor-pointer hover:bg-base-300 transition-colors py-3.5 w-24"
                onClick={() => handleHeaderClick("keyId")}
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  {renderSortIndicator("keyId")}
                </div>
              </th>
              <th
                className="cursor-pointer hover:bg-base-300 transition-colors py-3.5"
                onClick={() => handleHeaderClick("title")}
              >
                <div className="flex items-center gap-1">
                  <span>Nombre</span>
                  {renderSortIndicator("title")}
                </div>
              </th>
              <th className="py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-1 text-base-content/70">
                  <span>Checklist</span>
                </div>
              </th>
              <th className="py-3.5 hidden lg:table-cell">
                <div className="flex items-center gap-1 text-base-content/70">
                  <span>Etiquetas</span>
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
              <th className="py-3.5 hidden md:table-cell">
                <div className="flex items-center gap-1 text-base-content/70">
                  <span>Fechas</span>
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

              return (
                <tr
                  key={note._id}
                  className="hover:bg-base-200/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/note/${note._id}`)}
                >
                  <td className="font-medium text-base-content/70">
                    {note.keyId ? (
                      <span className="badge badge-sm font-mono font-bold bg-primary/15 text-primary border border-primary/30 whitespace-nowrap">
                        {note.keyId}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40">-</span>
                    )}
                  </td>
                  <td className="font-semibold text-base-content max-w-xs">
                    <div className="flex items-start gap-2 min-w-0 pt-0.5 group/title">
                      {editingTitleId === note._id ? (
                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            className="input input-xs input-bordered w-full font-semibold"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleInlineEdit(note._id, "title", editingTitleValue);
                                setEditingTitleId(null);
                              } else if (e.key === "Escape") {
                                setEditingTitleId(null);
                              }
                            }}
                            autoFocus
                            onBlur={() => {
                              handleInlineEdit(note._id, "title", editingTitleValue);
                              setEditingTitleId(null);
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <Link
                            to={`/note/${note._id}`}
                            className="hover:text-primary transition-colors block break-words whitespace-normal"
                            title={note.title}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {note.title}
                          </Link>
                          <button
                            type="button"
                            className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 text-base-content/50 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(note._id);
                              setEditingTitleValue(note.title);
                            }}
                            title="Editar título"
                          >
                            <PenSquareIcon className="size-3.5" />
                          </button>
                        </>
                      )}
                      
                      {getMentionCount(note) > 0 && editingTitleId !== note._id && (
                        <div className="flex items-center gap-1 bg-primary text-primary-content text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex-shrink-0" title={`Tienes ${getMentionCount(note)} mención(es)`}>
                          <AtSignIcon className="size-3" />
                          {getMentionCount(note)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    {note.checklist?.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-base-content/70" title={`${note.checklist.filter(i => i.completed).length} de ${note.checklist.length} completados`}>
                        <ListChecksIcon className="size-4 opacity-70" />
                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40">-</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell max-w-[150px]">
                    <div className="dropdown dropdown-bottom dropdown-end" onClick={(e) => e.stopPropagation()}>
                      <div tabIndex={0} role="button" className="flex flex-wrap gap-1 min-h-[24px] items-center hover:bg-base-200 p-1 rounded transition-colors" title="Editar etiquetas">
                        {note.labels?.length > 0 ? (
                          note.labels.map((label, idx) => (
                            <span
                              key={idx}
                              className="badge badge-xs font-semibold px-1.5 py-1.5 truncate max-w-[120px]"
                              style={{
                                backgroundColor: label.color + "20",
                                color: label.color,
                                borderColor: label.color + "40",
                              }}
                            >
                              {label.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-base-content/40 hover:text-base-content/80 flex items-center gap-1 w-full"><PlusIcon className="size-3" /> Añadir</span>
                        )}
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[60] menu p-1.5 shadow-xl bg-base-100 rounded-box w-52 border border-base-content/10">
                        {boardLabels.length === 0 && (
                          <li className="text-xs text-base-content/50 p-2 text-center">No hay etiquetas creadas</li>
                        )}
                        {boardLabels.map((defLabel) => {
                          const isSelected = (note.labels || []).some(
                            (l) => l.name.toLowerCase() === defLabel.name.toLowerCase()
                          );
                          return (
                            <li key={defLabel._id || defLabel.name}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleLabelToggle(note, defLabel);
                                }}
                                className="text-xs py-2 px-2 flex items-center justify-between w-full hover:bg-base-200 rounded-lg text-left"
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: defLabel.color }} />
                                  <span className="truncate font-medium text-base-content">{defLabel.name}</span>
                                </span>
                                {isSelected && <CheckCircle2Icon className="size-4 text-primary" />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </td>

                  <td>
                    <div className="dropdown dropdown-bottom dropdown-end" onClick={(e) => e.stopPropagation()}>
                      <div
                        tabIndex={0}
                        role="button"
                        className="badge badge-sm font-medium whitespace-nowrap border"
                        style={{
                          backgroundColor: statusColor + "20",
                          color: statusColor,
                          borderColor: statusColor + "50",
                        }}
                      >
                        {note.status || "Pendiente"}
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[60] menu p-1.5 shadow-xl bg-base-100 rounded-box w-40 border border-base-content/10">
                        {statuses.map((st) => (
                          <li key={st._id}>
                            <a
                              onClick={() => {
                                handleInlineEdit(note._id, "status", st.name);
                                document.activeElement.blur();
                              }}
                              className={`text-xs py-1.5 px-2 ${note.status === st.name ? "bg-primary/10 text-primary font-bold" : ""}`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full mr-1 flex-shrink-0" style={{ backgroundColor: st.color || "#6B7280" }} />
                              <span className="truncate">{st.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                  <td>
                    <div className="dropdown dropdown-bottom dropdown-end" onClick={(e) => e.stopPropagation()}>
                      <div
                        tabIndex={0}
                        role="button"
                        className="badge badge-xs font-bold gap-1 px-2 py-2 whitespace-nowrap border"
                        style={{
                          backgroundColor: priorityColor + "15",
                          color: priorityColor,
                          borderColor: priorityColor + "40",
                        }}
                      >
                        <ZapIcon className="size-3" />
                        {note.priority || "Media"}
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[60] menu p-1.5 shadow-xl bg-base-100 rounded-box w-36 border border-base-content/10">
                        {priorities.map((p) => (
                          <li key={p._id}>
                            <a
                              onClick={() => {
                                handleInlineEdit(note._id, "priority", p.name);
                                document.activeElement.blur();
                              }}
                              className={`text-xs py-1.5 px-2 ${note.priority === p.name ? "bg-primary/10 text-primary font-bold" : ""}`}
                            >
                              <ZapIcon className="size-3 flex-shrink-0" style={{ color: p.color }} />
                              <span className="truncate">{p.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    {(note.startDate || note.dueDate) ? (
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border inline-flex ${
                        note.completedAt ? "bg-success/20 text-success border-success/30" : 
                        (note.dueDate && new Date(note.dueDate) < new Date()) ? "bg-error/20 text-error border-error/30" : "bg-base-200 text-base-content/70 border-base-content/10"
                      }`} title={
                        note.dueDate ? `Vence: ${new Date(note.dueDate).toLocaleString()}` : `Inicia: ${new Date(note.startDate).toLocaleString()}`
                      }>
                        <CalendarIcon className="size-3" />
                        {note.dueDate ? (
                          <span>
                            {new Date(note.dueDate).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                          </span>
                        ) : (
                          <span>
                            {new Date(note.startDate).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {note.completedAt && <CheckIcon className="size-3" />}
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40">-</span>
                    )}
                  </td>
                  <td>
                    <div className="dropdown dropdown-bottom dropdown-end" onClick={(e) => e.stopPropagation()}>
                      <div tabIndex={0} role="button" className="flex items-center gap-2 max-w-[140px] hover:bg-base-200 p-1 rounded transition-colors" title={`${note.user || "Sin asignar"}${userConfig?.jobTitle ? ` - ${userConfig.jobTitle}` : ""}`}>
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
                      <ul tabIndex={0} className="dropdown-content z-[60] menu p-1.5 shadow-xl bg-base-100 rounded-box w-48 border border-base-content/10">
                        {users.map((u) => (
                          <li key={u._id}>
                            <a
                              onClick={() => {
                                handleInlineEdit(note._id, "user", u.name);
                                document.activeElement.blur();
                              }}
                              className={`text-xs py-1.5 px-2 ${note.user === u.name ? "bg-primary/10 text-primary font-bold" : ""}`}
                            >
                              <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: u.color || "#3B82F6" }}
                              >
                                {getInitials(u.name)}
                              </span>
                              <span className="truncate">{u.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
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
                        onClick={(e) => e.stopPropagation()}
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
