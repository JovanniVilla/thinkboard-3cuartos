import { useEffect, useState, useRef } from "react";
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
  ZapIcon,
  PencilIcon,
  CheckIcon,
  FolderIcon,
  ArchiveIcon,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useStatuses } from "../lib/useStatuses";
import { useAccounts } from "../lib/useAccounts";
import { usePriorities } from "../lib/usePriorities";
import MarkdownRenderer from "../components/MarkdownRenderer";
import ThemeToggle from "../components/ThemeToggle";
import MarkdownEditor from "../components/MarkdownEditor";

import { useLabels } from "../lib/useLabels";
import { useProjects } from "../lib/useProjects";
import { useBoardConfig } from "../lib/useBoardConfig";
import DatesPopover from "../components/DatesPopover";
import { FolderKeyIcon } from "lucide-react";

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
  
  const titleTextareaRef = useRef(null);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [note?.title]);

  const { boardConfig } = useBoardConfig();

  // Comments and Activity state
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  // Edit Comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");

  // Checklist state
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [hideChecked, setHideChecked] = useState(true);
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [expandChecklist, setExpandChecklist] = useState(false);

  // Labels popover state
  const [showLabelMenu, setShowLabelMenu] = useState(false);

  const { statuses } = useStatuses();
  const { labels: boardLabels } = useLabels();
  const { priorities } = usePriorities();
  const { accounts } = useAccounts();
  const { projects } = useProjects();
  const accountsList = accounts.map((acc) => acc.name);
  const { user: currentUser } = useAuth();

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
    if (!window.confirm("¿Estás seguro de que deseas archivar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Tarea archivada");
      navigate("/");
    } catch (error) {
      console.error("Error archiving the note:", error);
      toast.error("Error al archivar la tarea");
    }
  };

  const handleSaveNote = async (updatedFields = {}) => {
    const mergedNote = { ...note, ...updatedFields };
    if (!mergedNote.title?.trim()) {
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

  const handleEditTaskLink = () => {
    const currentLink = note.taskDriveLink || "";
    const newLink = window.prompt("Introduce el enlace de Google Drive para los archivos de esta tarea:", currentLink);
    if (newLink !== null) {
      const trimmedLink = newLink.trim();
      setNote({ ...note, taskDriveLink: trimmedLink });
      handleSaveNote({ taskDriveLink: trimmedLink });
    }
  };

  const extractMentions = (text) => {
    const matches = [...text.matchAll(/data-id="([^"]+)"/g)];
    return [...new Set(matches.map(m => m[1]))];
  };

  const handleResolveMention = (activityId) => {
    if (!currentUser?.name || !note.activities) return;
    const nextActivities = note.activities.map(act => {
      if (act.id === activityId || act._id === activityId) {
        return {
          ...act,
          resolvedMentions: [...(act.resolvedMentions || []), currentUser.name]
        };
      }
      return act;
    });
    setNote({ ...note, activities: nextActivities });
    handleSaveNote({ activities: nextActivities });
  };

  const handleSaveEditedComment = (activityId) => {
    if (!editedCommentText.trim() || !note.activities) return;
    const nextActivities = note.activities.map(act => {
      if (act.id === activityId || act._id === activityId) {
        return {
          ...act,
          text: editedCommentText.trim(),
          mentions: extractMentions(editedCommentText),
          updatedAt: new Date().toISOString(),
        };
      }
      return act;
    });
    setNote({ ...note, activities: nextActivities });
    handleSaveNote({ activities: nextActivities });
    setEditingCommentId(null);
    setEditedCommentText("");
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
        mentions: extractMentions(commentText),
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

  // Add Reply handler
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setPostingReply(true);
    try {
      const res = await api.post(`/notes/${id}/comments`, {
        text: replyText.trim(),
        user: note.user || "Usuario",
        parentId: parentId,
        mentions: extractMentions(replyText),
      });
      setNote(res.data);
      setReplyText("");
      setReplyingToId(null);
      toast.success("Respuesta publicada");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Error al publicar la respuesta");
    } finally {
      setPostingReply(false);
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

  const handleUpdateChecklistItem = (itemId) => {
    if (!editingChecklistTitle.trim()) {
      setEditingChecklistId(null);
      return;
    }
    const nextChecklist = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, title: editingChecklistTitle.trim() } : item
    );
    setNote({ ...note, checklist: nextChecklist });
    handleSaveNote({ checklist: nextChecklist });
    setEditingChecklistId(null);
    setEditingChecklistTitle("");
  };

  const handleDeleteAllChecklist = () => {
    if (!window.confirm("¿Deseas eliminar toda la lista de comprobación?")) return;
    const nextChecklist = [];
    setNote({ ...note, checklist: nextChecklist });
    handleSaveNote({ checklist: nextChecklist });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <LoaderIcon className="animate-spin size-10 text-primary" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 text-base-content bg-black/40 backdrop-blur-sm">
        <div className="bg-base-100 p-8 rounded-2xl shadow-2xl text-center space-y-4">
          <p className="text-base-content/60 font-semibold">Tarea no encontrada</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Volver al tablero
          </Link>
        </div>
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
  const assignedUserConfig = accounts.find((a) => a.name === note.user);
  const userColor = assignedUserConfig?.color || "#3B82F6";
  const userJobTitle = assignedUserConfig?.jobTitle || "";

  // Comments & activity calculations
  const activities = note.activities || [];
  const allComments = activities.filter((act) => act.type === "comment");
  const mainComments = allComments.filter((act) => !act.parentId);
  const replies = allComments.filter((act) => act.parentId);

  // Sort main comments chronologically to correctly extract the last 3 comments
  const sortedMainComments = [...mainComments].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const displayedMainComments = showAllComments
    ? sortedMainComments
    : sortedMainComments.length > 3
    ? sortedMainComments.slice(-3)
    : sortedMainComments;

  // Filter actions and allowed main comments
  const displayedMainItems = activities.filter((act) => {
    if (act.type === "action") return true;
    if (act.type === "comment" && !act.parentId) {
      return displayedMainComments.some((c) => c._id === act._id || c.id === act.id);
    }
    return false;
  });

  // Sort main items descending by date for displaying newest first
  const sortedMainItems = [...displayedMainItems].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-black/40 backdrop-blur-sm text-base-content"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          navigate("/");
        }
      }}
    >
      {/* Card Detail Modal Window Container */}
      <div className="w-full max-w-5xl bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden mt-4 mb-12 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="flex items-start justify-between px-3 py-2 border-b border-base-content/10 bg-base-100 gap-2">
          
          {/* Main Group: Status, Priority, ID, and other tools (wraps internally) */}
          <div className="flex flex-1 items-center gap-2 flex-wrap text-base-content/60">
            {/* Status Dropdown Pill */}
            <div className="dropdown">
              <label
                tabIndex={0}
                className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap"
              >
                <span>{currentStatus}</span>
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1"
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
                        currentStatus === st.name ? "bg-primary/20 text-primary font-bold" : "text-base-content"
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

            {/* Priority Dropdown Pill */}
            <div className="dropdown">
              <label
                tabIndex={0}
                className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap"
              >
                {(() => {
                  const currentPriority = (priorities || []).find(p => p.name === note.priority);
                  return (
                    <>
                      <ZapIcon className="size-4 flex-shrink-0" style={{ color: currentPriority?.color || "#6B7280" }} />
                      <span>{note.priority || "Media"}</span>
                    </>
                  );
                })()}
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1"
              >
                {(priorities || []).map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNote({ ...note, priority: p.name });
                        handleSaveNote({ priority: p.name });
                      }}
                      className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${
                        note.priority === p.name ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ZapIcon className="size-4" style={{ color: p.color }} />
                        {p.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Project Dropdown Pill */}
            <div className="dropdown">
              <label
                tabIndex={0}
                className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap"
              >
                {(() => {
                  const currentProject = (projects || []).find(p => p._id === note.project);
                  return (
                    <>
                      <FolderKeyIcon className="size-4 flex-shrink-0" style={{ color: currentProject?.color || "#6B7280" }} />
                      <span>{currentProject?.name || "Sin proyecto"}</span>
                    </>
                  );
                })()}
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1"
              >
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setNote({ ...note, project: "" });
                      handleSaveNote({ project: "" });
                    }}
                    className={`text-sm py-2 rounded-lg font-medium flex items-center gap-2 ${
                      !note.project ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                    }`}
                  >
                    <FolderKeyIcon className="size-4 text-base-content/60" />
                    Sin proyecto
                  </button>
                </li>
                {(projects || []).map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNote({ ...note, project: p._id });
                        handleSaveNote({ project: p._id });
                      }}
                      className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${
                        note.project === p._id ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FolderKeyIcon className="size-4" style={{ color: p.color }} />
                        {p.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {note.keyId && (
              <span className="badge bg-primary/20 text-primary border border-primary/30 font-mono font-bold text-xs px-2 py-1 whitespace-nowrap">
                {note.keyId}
              </span>
            )}

            {/* Other header tools */}
            <div className="flex items-center gap-0.5 mr-1 sm:mr-2 bg-base-200/50 p-0.5 rounded-lg border border-base-content/10">
              {note.taskDriveLink ? (
                <>
                  <a
                    href={note.taskDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-xs sm:btn-sm btn-ghost gap-1 sm:gap-2 text-primary px-1.5 sm:px-3"
                    title="Carpeta de archivos de esta tarea"
                  >
                    <FolderIcon className="size-4" />
                    <span className="hidden sm:inline">Archivos Tarea</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleEditTaskLink}
                    className="btn btn-xs sm:btn-sm btn-ghost btn-square text-base-content/60 hover:text-primary"
                    title="Editar enlace de la carpeta"
                  >
                    <Edit3Icon className="size-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEditTaskLink}
                  className="btn btn-xs sm:btn-sm btn-ghost gap-1 sm:gap-2 text-base-content/60 hover:text-primary px-1.5 sm:px-3"
                  title="Añadir carpeta de Google Drive"
                >
                  <FolderIcon className="size-4" />
                  <span className="hidden sm:inline">+ Drive Tarea</span>
                </button>
              )}
            </div>

            {boardConfig?.driveFolderLink && (
              <a 
                href={boardConfig.driveFolderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline btn-primary gap-2 mr-2"
                title="Carpeta del proyecto en Drive"
              >
                <FolderIcon className="size-4" />
                <span className="hidden sm:inline">Carpeta del Proyecto</span>
              </a>
            )}
            
            <ThemeToggle />
            
            <button
              type="button"
              className="p-1.5 hover:bg-base-200 rounded-lg transition-colors"
              title="Imagen de portada"
            >
              <ImageIcon className="size-5" />
            </button>
          </div>

          {/* Right Group: More and Close (always top right) */}
          <div className="flex items-center gap-1 text-base-content/60">
            <button
              type="button"
              className="p-1.5 hover:bg-base-200 rounded-lg transition-colors"
              title="Opciones"
            >
              <MoreHorizontalIcon className="size-5" />
            </button>
            <Link
              to="/"
              className="p-1.5 hover:bg-base-200 rounded-lg transition-colors text-base-content/60 hover:text-base-content"
              title="Cerrar vista"
            >
              <XIcon className="size-5" />
            </Link>
          </div>
        </div>

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column (Main Card Content) */}
          <div className="lg:col-span-8 p-3 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-base-content/10">
            {/* Title Section */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2Icon className="size-6 text-base-content/50 mt-1 flex-shrink-0" />
                <textarea
                  ref={titleTextareaRef}
                  className="w-full bg-transparent text-xl sm:text-2xl font-semibold tracking-normal text-base-content/95 font-sans border-0 border-b border-transparent focus:border-primary focus:outline-none transition-colors py-0.5 resize-none overflow-hidden leading-snug"
                  value={note.title}
                  rows={1}
                  onChange={(e) => {
                    setNote({ ...note, title: e.target.value });
                  }}
                  onBlur={() => handleSaveNote({ title: note.title })}
                  placeholder="Título de la tarjeta"
                />
              </div>

              {/* Quick Action Buttons Row */}
              <div className="flex items-center gap-1.5 flex-wrap text-sm pt-0">
                <button
                  type="button"
                  onClick={() => setShowLabelMenu(!showLabelMenu)}
                  className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg"
                >
                  <PlusIcon className="size-4" />
                  <span>Etiqueta</span>
                </button>

                <DatesPopover 
                  startDate={note.startDate} 
                  dueDate={note.dueDate}
                  onSave={(dates) => {
                    setNote({ ...note, ...dates });
                    handleSaveNote(dates);
                  }}
                />

                <button
                  type="button"
                  className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg"
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
                    className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg cursor-pointer"
                  >
                    <UsersIcon className="size-4" />
                    <span>Members</span>
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-52 border border-base-content/10 z-50 mt-1"
                  >
                    <li className="menu-title text-xs text-base-content/50">Asignar Miembro</li>
                    {accounts.map((u) => (
                      <li key={u._id}>
                        <button
                          type="button"
                          onClick={() => {
                            setNote({ ...note, user: u.name });
                            handleSaveNote({ user: u.name });
                          }}
                          className={`text-sm py-2 rounded-lg flex items-center justify-between ${
                            note.user === u.name ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: u.color || "#3B82F6" }}
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
                  className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg"
                  onClick={() => toast("Función de adjuntos próximamente", { icon: "📎" })}
                >
                  <PaperclipIcon className="size-4" />
                  <span>Attachment</span>
                </button>
              </div>
            </div>

            {/* Labels (Etiquetas) Section */}
            <div className="flex items-center gap-2.5 flex-wrap py-0">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 flex-shrink-0">Etiquetas:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
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
                    className="p-2 bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content rounded-lg transition-colors flex items-center justify-center"
                    title="Agregar etiqueta"
                  >
                    <PlusIcon className="size-4" />
                  </button>

                  {showLabelMenu && (
                    <div className="absolute left-0 mt-2 w-64 bg-base-100 border border-base-content/10 rounded-xl shadow-2xl p-4 z-50 space-y-3 text-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
                        <span className="font-bold text-base-content">Etiquetas</span>
                        <button
                          type="button"
                          onClick={() => setShowLabelMenu(false)}
                          className="text-base-content/60 hover:text-base-content"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 pb-2">
                        {boardLabels.map((defLabel) => {
                          const isSelected = (note.labels || []).some(
                            (l) => l.name.toLowerCase() === defLabel.name.toLowerCase()
                          );
                          return (
                            <button
                              key={defLabel._id || defLabel.name}
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
                        {boardLabels.length === 0 && (
                          <div className="text-center text-xs text-base-content/50 py-2">
                            No hay etiquetas. Configúralas en los ajustes del tablero.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dates Display Section */}
            {(note.startDate || note.dueDate) && (
              <div className="flex items-center gap-4 py-2 text-sm">
                {note.startDate && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 block mb-1">Inicio:</span>
                    <span className="badge badge-lg border border-base-content/10 bg-base-200 gap-1.5 font-medium">
                      <CalendarIcon className="size-3.5 opacity-70" />
                      {new Date(note.startDate).toLocaleString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {note.dueDate && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 block mb-1">Vencimiento:</span>
                    <span className={`badge badge-lg border gap-1.5 font-medium ${
                      note.completedAt ? "bg-success/20 text-success border-success/30" : 
                      new Date(note.dueDate) < new Date() ? "bg-error/20 text-error border-error/30" : "bg-base-200 border-base-content/10"
                    }`}>
                      <CalendarIcon className="size-3.5 opacity-70" />
                      {new Date(note.dueDate).toLocaleString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {note.completedAt && <CheckIcon className="size-3.5" />}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description Section */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3Icon className="size-5 text-base-content/60" />
                  <h3 className="font-bold text-base text-base-content">Descripción</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  className="btn btn-xs bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content rounded-lg px-3"
                >
                  {isEditingDescription ? "Vista previa" : "Editar"}
                </button>
              </div>

              <div className="bg-base-200/50 rounded-xl p-4 border border-base-content/10">
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <MarkdownEditor
                      value={note.content}
                      onChange={(val) => setNote({ ...note, content: val })}
                      placeholder="Añade una descripción más detallada..."
                      users={accountsList}
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
                  <MarkdownRenderer content={note.content} className="text-base-content/80" />
                )}
              </div>
            </div>

            {/* Checklist Section */}
            <div className="space-y-2.5 pt-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquareIcon className="size-5 text-base-content/60" />
                  <h3 className="font-bold text-base text-base-content">Checklist</h3>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                  {displayedChecklist.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setExpandChecklist(!expandChecklist)}
                      className="btn btn-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-2.5 font-medium"
                    >
                      {expandChecklist ? "Contraer lista" : `Ver todas (${displayedChecklist.length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setHideChecked(!hideChecked)}
                    className="btn btn-xs bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content rounded-lg px-2.5"
                  >
                    {hideChecked ? "Mostrar completados" : "Ocultar completados"}
                  </button>
                  {totalCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllChecklist}
                      className="btn btn-xs bg-error/20 hover:bg-error/30 text-error border border-error/30 rounded-lg px-2.5"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-base-content/60 w-8">{progressPercent}%</span>
                <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items List Container */}
              <div className="space-y-3">
                <div className={`space-y-2 ${expandChecklist ? "" : "max-h-[240px] overflow-y-auto pr-1"}`}>
                  {displayedChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-base-200 hover:bg-base-300/80 border border-base-content/5 transition-colors group"
                  >
                    {editingChecklistId === item.id ? (
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <input
                          type="text"
                          className="flex-1 bg-base-100 border border-base-content/20 text-sm text-base-content rounded px-2.5 py-1 focus:border-primary focus:outline-none"
                          value={editingChecklistTitle}
                          onChange={(e) => setEditingChecklistTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleUpdateChecklistItem(item.id);
                            } else if (e.key === "Escape") {
                              setEditingChecklistId(null);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateChecklistItem(item.id)}
                          className="text-success hover:text-success/80 transition-colors p-1"
                          title="Guardar cambios"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingChecklistId(null)}
                          className="text-base-content/40 hover:text-base-content transition-colors p-1"
                          title="Cancelar"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklistItem(item.id)}
                            className="checkbox checkbox-sm checkbox-primary rounded border-base-content/30"
                          />
                          <span
                            className={`text-sm ${
                              item.completed ? "line-through text-base-content/40" : "text-base-content"
                            }`}
                          >
                            {item.title}
                          </span>
                        </label>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChecklistId(item.id);
                              setEditingChecklistTitle(item.title);
                            }}
                            className="text-base-content/40 hover:text-primary transition-colors p-1"
                            title="Editar elemento"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="text-base-content/40 hover:text-error transition-colors p-1"
                            title="Eliminar elemento"
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                </div>

                {displayedChecklist.length > 4 && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandChecklist(!expandChecklist)}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      {expandChecklist ? "▲ Contraer lista de tareas" : `▼ Ver las ${displayedChecklist.length} tareas en lista completa`}
                    </button>
                  </div>
                )}

                {/* Add Item Form */}
                <form onSubmit={handleAddChecklistItem} className="pt-1 flex items-center gap-2">
                  <input
                    id="add-checklist-input"
                    type="text"
                    className="flex-1 bg-base-200 border border-base-content/10 text-sm text-base-content rounded-lg px-3 py-2 focus:border-primary focus:outline-none placeholder:text-base-content/40"
                    placeholder="Escribe un nuevo elemento..."
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
            <div className="flex items-center justify-between pt-6 border-t border-base-content/10">
              <button
                type="button"
                onClick={handleDeleteNote}
                className="btn btn-error btn-outline btn-sm gap-1.5 rounded-lg"
              >
                <ArchiveIcon className="size-4" />
                <span>Archivar Tarea</span>
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
          <div className="lg:col-span-4 p-4 sm:p-5 bg-base-200/50 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="size-5 text-base-content/60" />
                <h3 className="font-bold text-base text-base-content">Comments and activity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-xs bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content rounded-lg px-2.5"
              >
                {showDetails ? "Hide details" : "Show details"}
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="flex items-start gap-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 mt-1"
                  style={{ backgroundColor: userColor }}
                >
                  {getInitials(note.user)}
                </span>
                <div className="flex-1 space-y-2">
                  <MarkdownEditor
                    value={commentText}
                    onChange={setCommentText}
                    placeholder="Escribe un comentario..."
                    minHeight="min-h-[80px]"
                    hideFooter
                    compactToolbar
                    users={accountsList}
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
              <div className="space-y-3 pt-2 overflow-y-auto max-h-[500px]">
                {mainComments.length > 3 && (
                  <div className="flex justify-center pb-2 border-b border-base-content/5">
                    <button
                      type="button"
                      onClick={() => setShowAllComments(!showAllComments)}
                      className="btn btn-xs btn-outline btn-secondary rounded-lg px-3 gap-1"
                    >
                      {showAllComments ? "Mostrar solo últimos 3 comentarios" : `Ver todos los comentarios (${mainComments.length})`}
                    </button>
                  </div>
                )}
                {sortedMainItems.length === 0 ? (
                  <p className="text-xs text-base-content/40 italic text-center py-6">No hay actividad registrada aún</p>
                ) : (
                  sortedMainItems.map((act, idx) => {
                    if (act.type === "action") {
                      return (
                        <div key={act.id || idx} className="flex items-start gap-2 text-xs">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                            style={{ backgroundColor: "#6B7280" }}
                          >
                            {getInitials(act.user)}
                          </span>
                          <div className="space-y-1 flex-1 min-w-0 bg-base-100/60 p-2.5 rounded-xl border border-base-content/10">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-base-content">{act.user || "Usuario"}</span>
                              <span className="text-[10px] text-base-content/50">{formatDateActivity(act.createdAt)}</span>
                            </div>
                            <p className="text-base-content/50 leading-relaxed italic">
                              {act.text}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // For comments
                    const commentReplies = replies
                      .filter((r) => r.parentId === act.id || r.parentId === act._id)
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    return (
                      <div key={act.id || idx} className="space-y-2">
                        {/* Main Comment Row */}
                        <div className="flex items-start gap-2 text-xs">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                            style={{ backgroundColor: accounts.find(a => a.name === act.user)?.color || "#3B82F6" }}
                          >
                            {getInitials(act.user)}
                          </span>
                          <div className="space-y-1 flex-1 min-w-0 bg-base-100/60 p-2.5 rounded-xl border border-base-content/10">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-base-content">{act.user || "Usuario"}</span>
                              <span className="text-[10px] text-base-content/50">
                                {formatDateActivity(act.createdAt)}
                                {act.createdAt !== act.updatedAt && act.updatedAt && " (editado)"}
                              </span>
                            </div>
                            {editingCommentId === (act.id || act._id) ? (
                              <div className="mt-2">
                                <MarkdownEditor
                                  value={editedCommentText}
                                  onChange={setEditedCommentText}
                                  placeholder="Edita tu comentario..."
                                  minHeight="min-h-[60px]"
                                  hideFooter
                                  compactToolbar
                                  users={accountsList}
                                />
                                <div className="flex justify-end gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditedCommentText("");
                                    }}
                                    className="btn btn-ghost btn-xs rounded text-[10px] h-6 min-h-0"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedComment(act.id || act._id)}
                                    disabled={!editedCommentText.trim()}
                                    className="btn btn-primary btn-xs rounded text-[10px] h-6 min-h-0 px-2"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="prose prose-sm prose-base break-words max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                                <MarkdownRenderer content={act.text} />
                              </div>
                            )}
                            <div className="flex justify-end gap-3 pt-1 items-center">
                              {act.mentions?.includes(currentUser?.name) && !act.resolvedMentions?.includes(currentUser?.name) && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveMention(act.id || act._id)}
                                  className="text-[10px] flex items-center gap-1 text-primary hover:text-primary-focus font-semibold bg-primary/10 px-1.5 py-0.5 rounded"
                                  title="Marcar mención como atendida"
                                >
                                  <CheckIcon className="size-3" />
                                  Atendido
                                </button>
                              )}
                              {act.user === currentUser?.name && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(act.id || act._id);
                                    setEditedCommentText(act.text);
                                  }}
                                  className="text-[10px] text-base-content/50 hover:text-primary hover:underline font-semibold"
                                >
                                  Editar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (replyingToId === act.id) {
                                    setReplyingToId(null);
                                    setReplyText("");
                                  } else {
                                    setReplyingToId(act.id);
                                    setReplyText("");
                                  }
                                }}
                                className="text-[10px] text-primary hover:underline font-semibold"
                              >
                                Responder
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingToId === act.id && (
                          <form onSubmit={(e) => handleAddReply(e, act.id)} className="ml-10 flex gap-2 items-start mt-1">
                            <div className="flex-1">
                              <MarkdownEditor
                                value={replyText}
                                onChange={setReplyText}
                                placeholder="Escribe una respuesta..."
                                minHeight="min-h-[60px]"
                                hideFooter
                                compactToolbar
                                users={accountsList}
                              />
                              <div className="flex justify-end gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyText("");
                                  }}
                                  className="btn btn-ghost btn-xs rounded text-[10px] h-6 min-h-0"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  disabled={postingReply || !replyText.trim()}
                                  className="btn btn-primary btn-xs rounded text-[10px] h-6 min-h-0 px-2"
                                >
                                  {postingReply ? "Enviando..." : "Responder"}
                                </button>
                              </div>
                            </div>
                          </form>
                        )}

                        {/* Replies List */}
                        {commentReplies.length > 0 && (
                          <div className="ml-10 space-y-2 border-l-2 border-base-content/10 pl-3 mt-1">
                            {commentReplies.map((rep, rIdx) => (
                              <div key={rep.id || rIdx} className="flex items-start gap-2 text-[11px]">
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                                  style={{ backgroundColor: accounts.find(a => a.name === rep.user)?.color || "#10B981" }}
                                >
                                  {getInitials(rep.user)}
                                </span>
                                <div className="space-y-1 flex-1 min-w-0 bg-base-100/30 p-2 rounded-lg border border-base-content/5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-semibold text-base-content">{rep.user || "Usuario"}</span>
                                    <span className="text-[9px] text-base-content/45">
                                      {formatDateActivity(rep.createdAt)}
                                      {rep.createdAt !== rep.updatedAt && rep.updatedAt && " (editado)"}
                                    </span>
                                  </div>
                                  {editingCommentId === (rep.id || rep._id) ? (
                                    <div className="mt-2">
                                      <MarkdownEditor
                                        value={editedCommentText}
                                        onChange={setEditedCommentText}
                                        placeholder="Edita tu respuesta..."
                                        minHeight="min-h-[50px]"
                                        hideFooter
                                        compactToolbar
                                        users={accountsList}
                                      />
                                      <div className="flex justify-end gap-1.5 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditedCommentText("");
                                          }}
                                          className="btn btn-ghost btn-xs rounded text-[9px] h-5 min-h-0 px-1.5"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditedComment(rep.id || rep._id)}
                                          disabled={!editedCommentText.trim()}
                                          className="btn btn-primary btn-xs rounded text-[9px] h-5 min-h-0 px-2"
                                        >
                                          Guardar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="prose prose-sm prose-base break-words max-w-none text-[11px] prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                                      <MarkdownRenderer content={rep.text} />
                                    </div>
                                  )}
                                  <div className="flex justify-end gap-3 items-center mt-1">
                                    {rep.mentions?.includes(currentUser?.name) && !rep.resolvedMentions?.includes(currentUser?.name) && (
                                      <button
                                        type="button"
                                        onClick={() => handleResolveMention(rep.id || rep._id)}
                                        className="text-[9px] flex items-center gap-1 text-primary hover:text-primary-focus font-semibold bg-primary/10 px-1.5 py-0.5 rounded"
                                        title="Marcar mención como atendida"
                                      >
                                        <CheckIcon className="size-3" />
                                        Atendido
                                      </button>
                                    )}
                                    {rep.user === currentUser?.name && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(rep.id || rep._id);
                                          setEditedCommentText(rep.text);
                                        }}
                                        className="text-[9px] text-base-content/50 hover:text-primary hover:underline font-semibold"
                                      >
                                        Editar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
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
