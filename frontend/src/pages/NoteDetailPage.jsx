import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import {
  LoaderIcon,
  Trash2Icon,
  XIcon,
  PlusIcon,
  CalendarIcon,
  CheckSquareIcon,
  UsersIcon,
  PaperclipIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  Edit3Icon,
  ChevronDownIcon,
  ImageIcon,
  MoreHorizontalIcon,
  SendIcon,
} from "lucide-react";
import { useStatuses } from "../lib/useStatuses";
import { useUsers } from "../lib/useUsers";
import MarkdownEditor from "../components/MarkdownEditor";
import MarkdownRenderer from "../components/MarkdownRenderer";

const DEFAULT_LABEL_COLORS = [
  { name: "Terminado", color: "#10B981" },
  { name: "En Progreso", color: "#3B82F6" },
  { name: "Pendiente", color: "#F59E0B" },
  { name: "Bloqueado", color: "#EF4444" },
  { name: "Urgente", color: "#EC4899" },
  { name: "Diseño", color: "#8B5CF6" },
  { name: "Backend", color: "#06B6D4" },
];

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDateActivity = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const NoteDetailPage = () => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Comments and Activity state
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Checklist state
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [hideChecked, setHideChecked] = useState(false);

  // Labels popover state
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState("");

  const { statuses } = useStatuses();
  const { users } = useUsers();

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.data);
      } catch (error) {
        console.error("Error in fetching note", error);
        toast.error("Error al cargar la tarea");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleDeleteNote = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Tarea eliminada");
      navigate("/");
    } catch (error) {
      console.error("Error deleting the note:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleSaveNote = async (updatedFields = {}) => {
    const mergedNote = { ...note, ...updatedFields };
    if (!mergedNote.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/notes/${id}`, mergedNote);
      setNote(res.data);
      toast.success("Tarea guardada exitosamente");
    } catch (error) {
      console.error("Error saving the note:", error);
      toast.error("Error al guardar la tarea");
    } finally {
      setSaving(false);
    }
  };

  // Add Comment handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const res = await api.post(`/notes/${id}/comments`, {
        text: commentText.trim(),
        user: note.user || "Usuario",
      });
      setNote(res.data);
      setCommentText("");
      toast.success("Comentario publicado");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error al publicar el comentario");
    } finally {
      setPostingComment(false);
    }
  };

  // Labels handlers
  const toggleLabel = (labelObj) => {
    const currentLabels = note.labels || [];
    const exists = currentLabels.some((l) => l.name.toLowerCase() === labelObj.name.toLowerCase());
    let nextLabels;
    if (exists) {
      nextLabels = currentLabels.filter((l) => l.name.toLowerCase() !== labelObj.name.toLowerCase());
    } else {
      nextLabels = [...currentLabels, { name: labelObj.name, color: labelObj.color }];
    }
    const updated = { ...note, labels: nextLabels };
    setNote(updated);
    handleSaveNote({ labels: nextLabels });
  };

  const handleAddCustomLabel = () => {
    if (!customLabelInput.trim()) return;
    const name = customLabelInput.trim();
    const color = DEFAULT_LABEL_COLORS[Math.floor(Math.random() * DEFAULT_LABEL_COLORS.length)].color;
    toggleLabel({ name, color });
    setCustomLabelInput("");
  };

  // Checklist handlers
  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      title: newChecklistTitle.trim(),
      completed: false,
    };

    const nextChecklist = [...(note.checklist || []), newItem];
    setNote({ ...note, checklist: nextChecklist });
    setNewChecklistTitle("");
    handleSaveNote({ checklist: nextChecklist });
  };

  const handleToggleChecklistItem = (itemId) => {
    const nextChecklist = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setNote({ ...note, checklist: nextChecklist });
    handleSaveNote({ checklist: nextChecklist });
  };

  const handleDeleteChecklistItem = (itemId) => {
    const nextChecklist = (note.checklist || []).filter((item) => item.id !== itemId);
    setNote({ ...note, checklist: nextChecklist });
    handleSaveNote({ checklist: nextChecklist });
  };

  const handleDeleteAllChecklist = () => {
    if (!window.confirm("¿Deseas eliminar toda la lista de comprobación?")) return;
    const nextChecklist = [];
    setNote({ ...note, checklist: nextChecklist });
    handleSaveNote({ checklist: nextChecklist });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141518] flex items-center justify-center">
        <LoaderIcon className="animate-spin size-10 text-primary" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[#141518] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-gray-400">Tarea no encontrada</p>
        <Link to="/" className="btn btn-primary btn-sm">
          Volver al tablero
        </Link>
      </div>
    );
  }

  // Checklist calculations
  const checklistItems = note.checklist || [];
  const completedCount = checklistItems.filter((i) => i.completed).length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const displayedChecklist = hideChecked ? checklistItems.filter((i) => !i.completed) : checklistItems;

  const currentStatus = note.status || "Pendiente";
  const userColor = users.find((u) => u.name === note.user)?.color || "#3B82F6";

  return (
    <div className="min-h-screen bg-[#141518] text-gray-100 p-2 sm:p-6 flex justify-center items-start w-full">
      {/* Card Detail Modal Window Container */}
      <div className="w-full max-w-5xl mx-auto bg-[#1E1F24] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-2 sm:my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-[#1E1F24]">
          <div className="flex items-center gap-3">
            {/* Status Dropdown Pill */}
            <div className="dropdown">
              <label
                tabIndex={0}
                className="btn btn-sm bg-[#2A2C33] hover:bg-[#32353E] border-0 text-gray-200 font-semibold gap-2 rounded-lg cursor-pointer"
              >
                <span>{currentStatus}</span>
                <ChevronDownIcon className="size-4 text-gray-400" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-xl bg-[#2A2C33] rounded-xl w-48 border border-gray-700 z-50 mt-1"
              >
                {statuses.map((st) => (
                  <li key={st._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNote({ ...note, status: st.name });
                        handleSaveNote({ status: st.name });
                      }}
                      className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${
                        currentStatus === st.name ? "bg-primary/20 text-primary font-bold" : "text-gray-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: st.color || "#6B7280" }}
                        />
                        {st.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {note.keyId && (
              <span className="badge bg-primary/20 text-primary border border-primary/30 font-mono font-bold text-xs px-2.5 py-2">
                {note.keyId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            <button
              type="button"
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              title="Imagen de portada"
            >
              <ImageIcon className="size-5" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              title="Opciones"
            >
              <MoreHorizontalIcon className="size-5" />
            </button>
            <Link
              to="/"
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Cerrar vista"
            >
              <XIcon className="size-5" />
            </Link>
          </div>
        </div>

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* Left Column (Main Card Content) */}
          <div className="lg:col-span-8 p-6 sm:p-8 space-y-7 border-b lg:border-b-0 lg:border-r border-gray-800">
            {/* Title Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2Icon className="size-7 text-gray-400 mt-1 flex-shrink-0" />
                <textarea
                  className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-white border-0 border-b border-transparent focus:border-primary focus:outline-none transition-colors py-1 resize-none overflow-hidden leading-tight"
                  value={note.title}
                  rows={1}
                  onChange={(e) => {
                    setNote({ ...note, title: e.target.value });
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onBlur={() => handleSaveNote({ title: note.title })}
                  placeholder="Título de la tarjeta"
                  ref={(textarea) => {
                    if (textarea) {
                      textarea.style.height = 'auto';
                      textarea.style.height = textarea.scrollHeight + 'px';
                    }
                  }}
                />
              </div>

              {/* Quick Action Buttons Row */}
              <div className="flex items-center gap-2 flex-wrap text-sm pt-1">
                <button
                  type="button"
                  onClick={() => setShowLabelMenu(!showLabelMenu)}
                  className="btn btn-xs sm:btn-sm bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 gap-1.5 rounded-lg"
                >
                  <PlusIcon className="size-4" />
                  <span>Add</span>
                </button>

                <button
                  type="button"
                  className="btn btn-xs sm:btn-sm bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 gap-1.5 rounded-lg"
                  onClick={() => toast("Función de fechas próximamente", { icon: "📅" })}
                >
                  <CalendarIcon className="size-4" />
                  <span>Dates</span>
                </button>

                <button
                  type="button"
                  className="btn btn-xs sm:btn-sm bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 gap-1.5 rounded-lg"
                  onClick={() => {
                    const el = document.getElementById("add-checklist-input");
                    if (el) el.focus();
                  }}
                >
                  <CheckSquareIcon className="size-4" />
                  <span>Checklist</span>
                </button>

                {/* Assign member dropdown button */}
                <div className="dropdown dropdown-bottom">
                  <label
                    tabIndex={0}
                    className="btn btn-xs sm:btn-sm bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 gap-1.5 rounded-lg cursor-pointer"
                  >
                    <UsersIcon className="size-4" />
                    <span>Members</span>
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow-xl bg-[#2A2C33] rounded-xl w-52 border border-gray-700 z-50 mt-1"
                  >
                    <li className="menu-title text-xs text-gray-400">Asignar Miembro</li>
                    {users.map((u) => (
                      <li key={u._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setNote({ ...note, user: u.name });
                            handleSaveNote({ user: u.name });
                          }}
                          className={`text-sm py-2 rounded-lg flex items-center justify-between ${
                            note.user === u.name ? "bg-primary/20 text-primary font-bold" : "text-gray-300"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: u.color }}
                            >
                              {getInitials(u.name)}
                            </span>
                            {u.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-xs sm:btn-sm bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 gap-1.5 rounded-lg"
                  onClick={() => toast("Función de adjuntos próximamente", { icon: "📎" })}
                >
                  <PaperclipIcon className="size-4" />
                  <span>Attachment</span>
                </button>
              </div>
            </div>

            {/* Labels (Etiquetas) Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Labels</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {(note.labels || []).map((lbl, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: lbl.color || "#10B981" }}
                  >
                    <span>{lbl.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleLabel(lbl)}
                      className="opacity-70 hover:opacity-100 hover:bg-black/20 rounded p-0.5"
                      title="Quitar etiqueta"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                ))}

                {/* Add Label Button & Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLabelMenu(!showLabelMenu)}
                    className="p-2 bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 rounded-lg transition-colors flex items-center justify-center"
                    title="Agregar etiqueta"
                  >
                    <PlusIcon className="size-4" />
                  </button>

                  {showLabelMenu && (
                    <div className="absolute left-0 mt-2 w-64 bg-[#262830] border border-gray-700 rounded-xl shadow-2xl p-4 z-50 space-y-3 text-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                        <span className="font-bold text-gray-200">Etiquetas</span>
                        <button
                          type="button"
                          onClick={() => setShowLabelMenu(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {DEFAULT_LABEL_COLORS.map((defLabel) => {
                          const isSelected = (note.labels || []).some(
                            (l) => l.name.toLowerCase() === defLabel.name.toLowerCase()
                          );
                          return (
                            <button
                              key={defLabel.name}
                              type="button"
                              onClick={() => toggleLabel(defLabel)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                              style={{ backgroundColor: defLabel.color }}
                            >
                              <span>{defLabel.name}</span>
                              {isSelected && <CheckCircle2Icon className="size-4" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Add Custom Label */}
                      <div className="pt-2 border-t border-gray-700 space-y-2">
                        <input
                          type="text"
                          className="w-full bg-[#1E1F24] border border-gray-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:border-primary focus:outline-none"
                          placeholder="Nueva etiqueta personalizada..."
                          value={customLabelInput}
                          onChange={(e) => setCustomLabelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomLabel();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomLabel}
                          className="w-full btn btn-xs btn-primary rounded-lg text-xs"
                        >
                          Crear Etiqueta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3Icon className="size-5 text-gray-400" />
                  <h3 className="font-bold text-base text-gray-200">Description</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  className="btn btn-xs bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 rounded-lg px-3"
                >
                  {isEditingDescription ? "Vista previa" : "Edit"}
                </button>
              </div>

              <div className="bg-[#18191C] rounded-xl p-4 border border-gray-800/80">
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <MarkdownEditor
                      value={note.content}
                      onChange={(val) => setNote({ ...note, content: val })}
                      placeholder="Escribe los detalles de la tarea en Markdown..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDescription(false);
                        handleSaveNote({ content: note.content });
                      }}
                      className="btn btn-sm btn-primary px-5 rounded-lg"
                    >
                      Guardar descripción
                    </button>
                  </div>
                ) : (
                  <MarkdownRenderer content={note.content} className="text-gray-300" />
                )}
              </div>
            </div>

            {/* Checklist Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquareIcon className="size-5 text-gray-400" />
                  <h3 className="font-bold text-base text-gray-200">Checklist</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setHideChecked(!hideChecked)}
                    className="btn btn-xs bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 rounded-lg px-2.5"
                  >
                    {hideChecked ? "Mostrar completados" : "Hide checked items"}
                  </button>
                  {totalCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllChecklist}
                      className="btn btn-xs bg-error/20 hover:bg-error/30 text-error border border-error/30 rounded-lg px-2.5"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-gray-400 w-8">{progressPercent}%</span>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items List */}
              <div className="space-y-2">
                {displayedChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#18191C] hover:bg-[#212328] border border-gray-800/60 transition-colors group"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="checkbox checkbox-sm checkbox-primary rounded border-gray-600"
                      />
                      <span
                        className={`text-sm ${
                          item.completed ? "line-through text-gray-500" : "text-gray-200"
                        }`}
                      >
                        {item.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-error transition-opacity p-1"
                      title="Eliminar elemento"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                ))}

                {/* Add Item Form */}
                <form onSubmit={handleAddChecklistItem} className="pt-2 flex items-center gap-2">
                  <input
                    id="add-checklist-input"
                    type="text"
                    className="flex-1 bg-[#18191C] border border-gray-700/80 text-sm text-white rounded-lg px-3 py-2 focus:border-primary focus:outline-none placeholder:text-gray-500"
                    placeholder="Add an item"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistTitle.trim()}
                    className="btn btn-sm btn-primary rounded-lg gap-1"
                  >
                    <PlusIcon className="size-4" />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Actions: Save & Delete */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={handleDeleteNote}
                className="btn btn-error btn-outline btn-sm gap-1.5 rounded-lg"
              >
                <Trash2Icon className="size-4" />
                <span>Eliminar Tarea</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveNote()}
                disabled={saving}
                className="btn btn-primary px-6 rounded-lg gap-2"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>

          {/* Right Column: Comments and Activity (Registro de Mensajes y Actividad) */}
          <div className="lg:col-span-4 p-6 sm:p-8 bg-[#1B1C20] flex flex-col space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="size-5 text-gray-400" />
                <h3 className="font-bold text-base text-gray-200">Comments and activity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-xs bg-[#2B2D35] hover:bg-[#353842] border border-gray-700/60 text-gray-300 rounded-lg px-2.5"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 mt-1"
                  style={{ backgroundColor: userColor }}
                >
                  {getInitials(note.user)}
                </span>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={3}
                    className="w-full bg-[#141518] border border-gray-700 text-sm text-gray-200 rounded-xl p-3 focus:border-primary focus:outline-none placeholder:text-gray-500 resize-none transition-colors"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={postingComment || !commentText.trim()}
                      className="btn btn-xs sm:btn-sm btn-primary rounded-lg gap-1.5"
                    >
                      <SendIcon className="size-3.5" />
                      <span>{postingComment ? "Enviando..." : "Comentar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Activity Feed */}
            {showDetails && (
              <div className="space-y-4 pt-2 overflow-y-auto max-h-[500px] pr-1">
                {(note.activities || []).length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-6">No hay actividad registrada aún</p>
                ) : (
                  [...(note.activities || [])]
                    .reverse()
                    .map((act, idx) => (
                      <div key={act.id || idx} className="flex items-start gap-3 text-xs">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                          style={{ backgroundColor: act.type === "comment" ? "#3B82F6" : "#6B7280" }}
                        >
                          {getInitials(act.user)}
                        </span>
                        <div className="space-y-1 flex-1 min-w-0 bg-[#141518]/60 p-2.5 rounded-xl border border-gray-800/80">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-gray-200">{act.user || "Usuario"}</span>
                            <span className="text-[10px] text-gray-500">{formatDateActivity(act.createdAt)}</span>
                          </div>
                          <p className={`text-gray-300 leading-relaxed ${act.type === "action" ? "italic text-gray-400" : ""}`}>
                            {act.text}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
