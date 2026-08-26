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
  UsersIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  Edit3Icon,
  ChevronDownIcon,
  LinkIcon,
  SendIcon,
  FolderIcon,
  TargetIcon,
  LayersIcon,
  ZapIcon,
  PencilIcon,
  CheckIcon,
  FolderKeyIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  BriefcaseIcon,
  TelescopeIcon,
  CheckSquareIcon,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useProjectTypes } from "../lib/useProjectTypes";
import { useProjectStatuses } from "../lib/useProjectStatuses";
import { useAccounts } from "../lib/useAccounts";
import MarkdownRenderer from "../components/MarkdownRenderer";
import MarkdownEditor from "../components/MarkdownEditor";
import ThemeToggle from "../components/ThemeToggle";

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

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingScope, setIsEditingScope] = useState(false);

  const [newAcceptanceTitle, setNewAcceptanceTitle] = useState("");
  const [editingAcceptanceId, setEditingAcceptanceId] = useState(null);
  const [editingAcceptanceTitle, setEditingAcceptanceTitle] = useState("");
  const [expandAcceptance, setExpandAcceptance] = useState(false);
  const [hideCheckedAcceptance, setHideCheckedAcceptance] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const { projectTypes } = useProjectTypes();
  const { projectStatuses } = useProjectStatuses();
  const { accounts } = useAccounts();
  const accountsList = accounts.filter((a) => a.isApproved).map((a) => a.name);

  const titleTextareaRef = useRef(null);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [project?.name]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        const { tasks: projectTasks, ...projectData } = res.data;
        setProject(projectData);
        setTasks(projectTasks || []);
      } catch (error) {
        console.error("Error in fetching project", error);
        toast.error("Error al cargar el proyecto");
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const handleSaveProject = async (updatedFields = {}) => {
    const mergedProject = { ...project, ...updatedFields };
    if (!mergedProject.name?.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/projects/${id}`, mergedProject);
      setProject(res.data);
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Error al guardar el proyecto");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto?"))
      return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Proyecto eliminado");
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error al eliminar el proyecto");
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);

    const newActivity = {
      id: Date.now().toString(),
      type: "comment",
      text: commentText.trim(),
      user: currentUser?.name || "Usuario",
      createdAt: new Date().toISOString(),
    };

    const nextActivities = [...(project.activities || []), newActivity];

    try {
      const res = await api.put(`/projects/${id}`, {
        activities: nextActivities,
      });
      setProject(res.data);
      setCommentText("");
    } catch (error) {
      console.error("Error posting comment", error);
      toast.error("Error al enviar comentario");
    } finally {
      setPostingComment(false);
    }
  };

  const handleEditComment = async (activityId) => {
    if (!editingCommentText.trim()) {
      setEditingCommentId(null);
      return;
    }

    const updatedActivities = (project.activities || []).map((act) =>
      act.id === activityId || act._id === activityId
        ? {
            ...act,
            text: editingCommentText.trim(),
            editedAt: new Date().toISOString(),
          }
        : act,
    );

    try {
      const res = await api.put(`/projects/${id}`, {
        activities: updatedActivities,
      });
      setProject(res.data);
      toast.success("Comentario actualizado");
    } catch (error) {
      console.error("Error updating comment", error);
      toast.error("Error al actualizar comentario");
    } finally {
      setEditingCommentId(null);
    }
  };

  const handleAddAcceptance = () => {
    if (!newAcceptanceTitle.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      title: newAcceptanceTitle.trim(),
      completed: false,
    };
    const updated = [...(project.acceptanceCriteria || []), newItem];
    setProject({ ...project, acceptanceCriteria: updated });
    handleSaveProject({ acceptanceCriteria: updated });
    setNewAcceptanceTitle("");
  };

  const handleToggleAcceptance = (id) => {
    const updated = (project.acceptanceCriteria || []).map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setProject({ ...project, acceptanceCriteria: updated });
    handleSaveProject({ acceptanceCriteria: updated });
  };

  const handleDeleteAcceptance = (id) => {
    const updated = (project.acceptanceCriteria || []).filter(
      (item) => item.id !== id,
    );
    setProject({ ...project, acceptanceCriteria: updated });
    handleSaveProject({ acceptanceCriteria: updated });
  };

  const handleUpdateAcceptance = (id) => {
    if (!editingAcceptanceTitle.trim()) return;
    const updated = (project.acceptanceCriteria || []).map((item) =>
      item.id === id ? { ...item, title: editingAcceptanceTitle.trim() } : item,
    );
    setProject({ ...project, acceptanceCriteria: updated });
    handleSaveProject({ acceptanceCriteria: updated });
    setEditingAcceptanceId(null);
  };

  const handleDeleteAllAcceptance = () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar todos los criterios de aceptación?",
      )
    ) {
      setProject({ ...project, acceptanceCriteria: [] });
      handleSaveProject({ acceptanceCriteria: [] });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <LoaderIcon className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-xl border-b border-base-content/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link to="/projects" className="btn btn-ghost btn-circle btn-sm">
              <XIcon className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/70 bg-base-200 px-3 py-1.5 rounded-full">
              <FolderKeyIcon
                className="size-4"
                style={{ color: project.color }}
              />
              <span className="truncate max-w-[150px]">Proyecto</span>
            </div>
            {saving && (
              <span className="loading loading-spinner loading-xs text-primary ml-2"></span>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ThemeToggle />
            <button
              className="btn btn-ghost btn-sm text-error"
              onClick={handleDeleteProject}
              title="Eliminar proyecto"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        {/* Header Title (Full Width) */}
        <div className="flex flex-col gap-3">
          <textarea
            ref={titleTextareaRef}
            className="w-full resize-none overflow-hidden bg-transparent text-3xl md:text-4xl font-black text-base-content leading-tight focus:outline-none focus:ring-0 placeholder:text-base-content/20"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            onBlur={() => handleSaveProject()}
            placeholder="Nombre del proyecto..."
            rows={1}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN: Main Details */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Inline Properties Row */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-base-100 rounded-2xl border border-base-content/10 shadow-sm">
              {/* Status Dropdown */}
              <div className="dropdown dropdown-hover">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm btn-ghost gap-2 border border-base-content/10 hover:border-base-content/30 rounded-xl"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        projectStatuses.find((s) => s.name === project.status)
                          ?.color || "#6B7280",
                    }}
                  ></span>
                  {project.status || "Estado"}
                  <ChevronDownIcon className="size-3 opacity-50" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-content/10 mt-1"
                >
                  {projectStatuses.map((s) => (
                    <li key={s._id}>
                      <button
                        onClick={() => {
                          setProject({ ...project, status: s.name });
                          handleSaveProject({ status: s.name });
                          document.activeElement?.blur();
                        }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        ></span>
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Type Dropdown */}
              <div className="dropdown dropdown-hover">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm btn-ghost gap-2 border border-base-content/10 hover:border-base-content/30 rounded-xl"
                >
                  <LayersIcon className="size-4 opacity-70" />
                  {project.projectType || "Tipo"}
                  <ChevronDownIcon className="size-3 opacity-50" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-content/10 mt-1"
                >
                  <li key="general">
                    <button
                      onClick={() => {
                        setProject({ ...project, projectType: "General" });
                        handleSaveProject({ projectType: "General" });
                        document.activeElement?.blur();
                      }}
                    >
                      General
                    </button>
                  </li>
                  {projectTypes.map((pt) => (
                    <li key={pt._id}>
                      <button
                        onClick={() => {
                          setProject({ ...project, projectType: pt.name });
                          handleSaveProject({ projectType: pt.name });
                          document.activeElement?.blur();
                        }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: pt.color }}
                        ></span>
                        {pt.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assignee */}
              <div className="dropdown dropdown-hover">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-sm btn-ghost gap-2 border border-base-content/10 hover:border-base-content/30 rounded-xl"
                >
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                      <span>{getInitials(project.assignedTo)}</span>
                    </div>
                  </div>
                  <span>
                    {project.assignedTo === "Sin asignar"
                      ? "Responsable"
                      : project.assignedTo}
                  </span>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[60] menu p-2 shadow-xl bg-base-100 rounded-box w-56 border border-base-content/10 max-h-64 overflow-y-auto mt-1"
                >
                  <li>
                    <button
                      onClick={() => {
                        setProject({ ...project, assignedTo: "Sin asignar" });
                        handleSaveProject({ assignedTo: "Sin asignar" });
                        document.activeElement?.blur();
                      }}
                    >
                      Sin asignar
                    </button>
                  </li>
                  {accountsList.map((accName) => (
                    <li key={accName}>
                      <button
                        onClick={() => {
                          setProject({ ...project, assignedTo: accName });
                          handleSaveProject({ assignedTo: accName });
                          document.activeElement?.blur();
                        }}
                      >
                        {accName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Start Date */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-base-content/50 uppercase">
                  Inicio
                </span>
                <input
                  type="date"
                  className="input input-sm input-bordered rounded-xl bg-transparent border-base-content/10 text-xs hover:border-base-content/30 cursor-pointer"
                  title="Fecha de Inicio"
                  value={
                    project.startDate
                      ? new Date(project.startDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const newDate = e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null;
                    setProject({ ...project, startDate: newDate });
                    handleSaveProject({ startDate: newDate });
                  }}
                />
              </div>

              {/* End Date */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-base-content/50 uppercase">
                  Cierre
                </span>
                <input
                  type="date"
                  className="input input-sm input-bordered rounded-xl bg-transparent border-base-content/10 text-xs hover:border-base-content/30 cursor-pointer"
                  title="Fecha de Cierre"
                  value={
                    project.endDate
                      ? new Date(project.endDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const newDate = e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null;
                    setProject({ ...project, endDate: newDate });
                    handleSaveProject({ endDate: newDate });
                  }}
                />
              </div>
            </div>

            {/* Editable Objective */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-content/10 shadow-sm">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-base-content/80">
                <TargetIcon className="size-4 text-primary" /> Objetivo
                Principal
              </h3>
              <details className="mb-3 group bg-base-200/50 rounded-xl border border-base-content/5 text-xs text-base-content/70 cursor-pointer overflow-hidden">
                <summary className="p-3 font-bold text-base-content/90 hover:bg-base-300/50 transition-colors flex items-center justify-between outline-none list-none [&::-webkit-details-marker]:hidden">
                  <span>
                    Redacta objetivos SMARTER:{" "}
                    <span className="text-primary font-medium ml-1">Ver</span>
                  </span>
                  <svg
                    className="size-3 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-0 border-t border-base-content/5">
                  <ul className="list-none space-y-0.5 mt-2">
                    <li>
                      <strong className="text-base-content">
                        S (Specific):
                      </strong>{" "}
                      Claro, sin dudas y fácil de entender.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        M (Measurable):
                      </strong>{" "}
                      Con números/indicadores para medir el avance.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        A (Achievable):
                      </strong>{" "}
                      Realista según los recursos.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        R (Relevant):
                      </strong>{" "}
                      Que aporte valor real.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        T (Time-bound):
                      </strong>{" "}
                      Con fecha límite clara.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        E (Evaluated):
                      </strong>{" "}
                      Revisado de forma constante.
                    </li>
                    <li>
                      <strong className="text-base-content">
                        R (Reevaluated):
                      </strong>{" "}
                      Ajustable si cambian las condiciones.
                    </li>
                  </ul>
                </div>
              </details>

              {isEditingObjective ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <MarkdownEditor
                    value={project.objective || ""}
                    onChange={(val) =>
                      setProject({ ...project, objective: val })
                    }
                    onSave={() => {
                      setIsEditingObjective(false);
                      handleSaveProject();
                    }}
                    onCancel={() => {
                      setIsEditingObjective(false);
                    }}
                  />
                </div>
              ) : (
                <div
                  className="cursor-text prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-primary min-h-[100px] p-2 -m-2 rounded-xl hover:bg-base-200/50 transition-colors"
                  onClick={() => setIsEditingObjective(true)}
                >
                  {project.objective ? (
                    <MarkdownRenderer content={project.objective} />
                  ) : (
                    <span className="text-base-content/40 italic flex items-center gap-2 mt-4">
                      <PencilIcon className="size-4" />
                      Haz clic aquí para añadir el objetivo del proyecto...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-content/10 shadow-sm relative group min-h-[160px]">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-base-content/80">
                <Edit3Icon className="size-4 text-primary" /> Descripción
              </h3>
              {isEditingDescription ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <MarkdownEditor
                    value={project.description || ""}
                    onChange={(val) =>
                      setProject({ ...project, description: val })
                    }
                    onSave={() => {
                      setIsEditingDescription(false);
                      handleSaveProject();
                    }}
                    onCancel={() => {
                      setIsEditingDescription(false);
                    }}
                  />
                </div>
              ) : (
                <div
                  className="cursor-text prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-primary min-h-[100px] p-2 -m-2 rounded-xl hover:bg-base-200/50 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {project.description ? (
                    <MarkdownRenderer content={project.description} />
                  ) : (
                    <span className="text-base-content/40 italic flex items-center gap-2 mt-4">
                      <PencilIcon className="size-4" />
                      Haz clic aquí para añadir una descripción detallada del
                      proyecto...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Alcances del Proyecto */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-content/10 shadow-sm relative group min-h-[160px]">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-base-content/80">
                <TelescopeIcon className="size-4 text-primary" /> Alcances del
                Proyecto
              </h3>
              {isEditingScope ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <MarkdownEditor
                    value={project.scope || ""}
                    onChange={(val) => setProject({ ...project, scope: val })}
                    onSave={() => {
                      setIsEditingScope(false);
                      handleSaveProject();
                    }}
                    onCancel={() => {
                      setIsEditingScope(false);
                    }}
                  />
                </div>
              ) : (
                <div
                  className="cursor-text prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-primary min-h-[100px] p-2 -m-2 rounded-xl hover:bg-base-200/50 transition-colors"
                  onClick={() => setIsEditingScope(true)}
                >
                  {project.scope ? (
                    <MarkdownRenderer content={project.scope} />
                  ) : (
                    <span className="text-base-content/40 italic flex items-center gap-2 mt-4">
                      <PencilIcon className="size-4" />
                      Haz clic aquí para detallar los alcances del proyecto...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Criterios de Aceptación */}
            <div className="bg-base-100 p-5 rounded-2xl border border-base-content/10 shadow-sm relative group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-base-content/80">
                  <CheckSquareIcon className="size-4 text-primary" /> Criterios
                  de Aceptación
                </h3>

                <div className="flex items-center gap-2 text-xs flex-wrap justify-end">
                  {(Array.isArray(project.acceptanceCriteria)
                    ? project.acceptanceCriteria
                    : []
                  ).length > 4 && (
                    <button
                      type="button"
                      onClick={() => setExpandAcceptance(!expandAcceptance)}
                      className="btn btn-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-2.5 font-medium"
                    >
                      {expandAcceptance
                        ? "Contraer lista"
                        : `Ver todos (${(project.acceptanceCriteria || []).length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setHideCheckedAcceptance(!hideCheckedAcceptance)
                    }
                    className="btn btn-xs bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content rounded-lg px-2.5"
                  >
                    {hideCheckedAcceptance
                      ? "Mostrar completados"
                      : "Ocultar completados"}
                  </button>
                  {(Array.isArray(project.acceptanceCriteria)
                    ? project.acceptanceCriteria
                    : []
                  ).length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllAcceptance}
                      className="btn btn-xs bg-error/20 hover:bg-error/30 text-error border border-error/30 rounded-lg px-2.5"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono font-bold text-base-content/60 w-8">
                  {Array.isArray(project.acceptanceCriteria) &&
                  project.acceptanceCriteria.length > 0
                    ? Math.round(
                        (project.acceptanceCriteria.filter((i) => i.completed)
                          .length /
                          project.acceptanceCriteria.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
                <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 transition-all duration-300 rounded-full"
                    style={{
                      width: `${Array.isArray(project.acceptanceCriteria) && project.acceptanceCriteria.length > 0 ? Math.round((project.acceptanceCriteria.filter((i) => i.completed).length / project.acceptanceCriteria.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                <div
                  className={`space-y-2 ${expandAcceptance ? "" : "max-h-[240px] overflow-y-auto pr-1"}`}
                >
                  {(Array.isArray(project.acceptanceCriteria)
                    ? project.acceptanceCriteria
                    : []
                  )
                    .filter((item) => !hideCheckedAcceptance || !item.completed)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-base-200 hover:bg-base-300/80 border border-base-content/5 transition-colors group"
                      >
                        {editingAcceptanceId === item.id ? (
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <input
                              type="text"
                              className="flex-1 bg-base-100 border border-base-content/20 text-sm text-base-content rounded px-2.5 py-1 focus:border-primary focus:outline-none"
                              value={editingAcceptanceTitle}
                              onChange={(e) =>
                                setEditingAcceptanceTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleUpdateAcceptance(item.id);
                                } else if (e.key === "Escape") {
                                  setEditingAcceptanceId(null);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateAcceptance(item.id)}
                              className="text-success hover:text-success/80 transition-colors p-1"
                              title="Guardar cambios"
                            >
                              <CheckIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAcceptanceId(null)}
                              className="text-base-content/40 hover:text-base-content transition-colors p-1"
                              title="Cancelar"
                            >
                              <XIcon className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <label
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                              onDoubleClick={() => {
                                setEditingAcceptanceId(item.id);
                                setEditingAcceptanceTitle(item.title);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleAcceptance(item.id)}
                                className="checkbox checkbox-sm checkbox-primary rounded border-base-content/30"
                              />
                              <span
                                className={`text-sm ${
                                  item.completed
                                    ? "line-through text-base-content/40"
                                    : "text-base-content"
                                }`}
                              >
                                {item.title}
                              </span>
                            </label>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAcceptanceId(item.id);
                                  setEditingAcceptanceTitle(item.title);
                                }}
                                className="text-base-content/40 hover:text-primary transition-colors p-1"
                                title="Editar"
                              >
                                <PencilIcon className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAcceptance(item.id)}
                                className="text-base-content/40 hover:text-error transition-colors p-1"
                                title="Eliminar"
                              >
                                <Trash2Icon className="size-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>

                {/* Add New Acceptance Criteria Input */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Añadir criterio de aceptación..."
                      className="input input-sm input-bordered w-full pr-10 rounded-lg text-sm bg-base-100 focus:outline-none focus:border-primary/50"
                      value={newAcceptanceTitle}
                      onChange={(e) => setNewAcceptanceTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAcceptance();
                        }
                      }}
                    />
                    {newAcceptanceTitle.trim() && (
                      <button
                        type="button"
                        onClick={handleAddAcceptance}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Añadir"
                      >
                        <PlusIcon className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-base-100 p-5 rounded-2xl border border-base-content/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-base-content/80">
                  <CheckCircle2Icon className="size-4 text-primary" /> Tareas
                  del Proyecto ({tasks.length})
                </h3>
                <Link
                  to={`/create?projectId=${project._id}`}
                  className="btn btn-xs btn-primary btn-outline gap-1"
                >
                  <PlusIcon className="size-3" />
                  Nueva
                </Link>
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-base-content/50 italic py-4 text-center">
                  No hay tareas vinculadas a este proyecto todavía.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tasks.map((task) => (
                    <Link
                      key={task._id}
                      to={`/note/${task._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-base-content/10 hover:border-primary/50 hover:bg-base-200/50 transition-colors group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === "Completado" ? "bg-success" : "bg-primary"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${task.status === "Completado" ? "line-through opacity-60" : ""}`}
                        >
                          {task.title}
                        </p>
                      </div>
                      {task.user && task.user !== "Sin asignar" && (
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                            <span>{getInitials(task.user)}</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Activity / Chat Log (Moved to Left Column) */}
            <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm flex flex-col h-[500px]">
              <div className="p-4 border-b border-base-content/5 bg-base-200/30 flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquareIcon className="size-4" /> Log de Actividad
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!project.activities || project.activities.length === 0 ? (
                  <p className="text-center text-sm text-base-content/40 py-10">
                    No hay actividad registrada.
                  </p>
                ) : (
                  project.activities.map((act) => {
                    const actId = act.id || act._id;
                    const isEditing = editingCommentId === actId;

                    return (
                      <div key={actId} className="flex gap-3 group/comment">
                        <div className="avatar placeholder self-start">
                          <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold border border-primary/20">
                            <span>{getInitials(act.user)}</span>
                          </div>
                        </div>
                        <div className="flex-1 bg-base-200/50 rounded-2xl rounded-tl-sm p-3 border border-base-content/5 relative">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">
                                {act.user}
                              </span>
                              {act.editedAt && (
                                <span className="text-[9px] font-medium text-base-content/40 italic">
                                  (editado)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-base-content/50">
                              {formatDateActivity(act.createdAt)}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="mt-2">
                              <MarkdownEditor
                                value={editingCommentText}
                                onChange={setEditingCommentText}
                                placeholder="Edita tu comentario..."
                                minHeight="min-h-[60px]"
                                hideFooter
                                compactToolbar
                                users={accountsList}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="btn btn-xs btn-primary"
                                  onClick={() => handleEditComment(actId)}
                                  disabled={!editingCommentText.trim()}
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-a:text-primary relative">
                              <MarkdownRenderer content={act.text} />
                            </div>
                          )}

                          {act.type === "comment" &&
                            act.user === currentUser?.name &&
                            !isEditing && (
                              <button
                                className="absolute top-2 right-2 btn btn-xs btn-ghost btn-square opacity-0 group-hover/comment:opacity-100 transition-opacity bg-base-100/50 hover:bg-base-200"
                                onClick={() => {
                                  setEditingCommentId(actId);
                                  setEditingCommentText(act.text);
                                }}
                                title="Editar comentario"
                              >
                                <PencilIcon className="size-3 text-base-content/60 hover:text-primary" />
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-base-content/10 bg-base-200/20">
                <div className="flex flex-col gap-2">
                  <MarkdownEditor
                    value={commentText}
                    onChange={setCommentText}
                    placeholder="Escribe un comentario o nota..."
                    minHeight="min-h-[80px]"
                    hideFooter
                    compactToolbar
                    users={accountsList}
                  />
                  <div className="flex justify-end">
                    <button
                      className="btn btn-primary btn-sm gap-2"
                      onClick={handlePostComment}
                      disabled={postingComment || !commentText.trim()}
                    >
                      {postingComment ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <SendIcon className="size-4" />
                      )}
                      <span>Comentar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Config) */}
          <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-6">
            {/* Contacto Card */}
            <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-content/5 bg-base-200/30">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UsersIcon className="size-4" /> Contacto del Proyecto
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 flex items-center gap-1">
                    <UserIcon className="size-3" /> Nombre
                  </label>
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full"
                    placeholder="Nombre del contacto"
                    value={project.contact?.name || ""}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        contact: { ...project.contact, name: e.target.value },
                      })
                    }
                    onBlur={() => handleSaveProject()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 flex items-center gap-1">
                    <BriefcaseIcon className="size-3" /> Puesto
                  </label>
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full"
                    placeholder="Cargo o Puesto"
                    value={project.contact?.position || ""}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        contact: {
                          ...project.contact,
                          position: e.target.value,
                        },
                      })
                    }
                    onBlur={() => handleSaveProject()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 flex items-center gap-1">
                    <PhoneIcon className="size-3" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    className="input input-sm input-bordered w-full"
                    placeholder="Teléfono"
                    value={project.contact?.phone || ""}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        contact: { ...project.contact, phone: e.target.value },
                      })
                    }
                    onBlur={() => handleSaveProject()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 flex items-center gap-1">
                    <MailIcon className="size-3" /> Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="input input-sm input-bordered w-full"
                    placeholder="Correo"
                    value={project.contact?.email || ""}
                    onChange={(e) =>
                      setProject({
                        ...project,
                        contact: { ...project.contact, email: e.target.value },
                      })
                    }
                    onBlur={() => handleSaveProject()}
                  />
                </div>
              </div>
            </div>

            {/* Links Card */}
            <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-content/5 bg-base-200/30">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <LinkIcon className="size-4" /> Enlaces Rápidos
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 block">
                    Brief del Proyecto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      className="input input-sm input-bordered w-full"
                      placeholder="https://..."
                      value={project.briefUrl || ""}
                      onChange={(e) =>
                        setProject({ ...project, briefUrl: e.target.value })
                      }
                      onBlur={() => handleSaveProject()}
                    />
                    {project.briefUrl && (
                      <a
                        href={project.briefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-square btn-ghost text-primary"
                      >
                        <LinkIcon className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/60 mb-1 block">
                    Carpeta en Drive / Archivos
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      className="input input-sm input-bordered w-full"
                      placeholder="https://..."
                      value={project.folderUrl || ""}
                      onChange={(e) =>
                        setProject({ ...project, folderUrl: e.target.value })
                      }
                      onBlur={() => handleSaveProject()}
                    />
                    {project.folderUrl && (
                      <a
                        href={project.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-square btn-ghost text-primary"
                      >
                        <FolderIcon className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* System Settings Card */}
            <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-content/5 bg-base-200/30">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ZapIcon className="size-4" /> Automatizaciones
                </h3>
              </div>
              <div className="p-4">
                <label className="text-xs font-semibold text-base-content/60 mb-1 block">
                  Asignar nuevas tareas a:
                </label>
                <select
                  className="select select-sm select-bordered w-full"
                  value={project.defaultAssignee || "Sin asignar"}
                  onChange={(e) => {
                    setProject({ ...project, defaultAssignee: e.target.value });
                    handleSaveProject({ defaultAssignee: e.target.value });
                  }}
                >
                  <option value="Sin asignar">Sin asignar</option>
                  {accountsList.map((accName) => (
                    <option key={accName} value={accName}>
                      {accName}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-base-content/50 mt-2 leading-tight">
                  Al crear una tarea con este proyecto, se le asignará
                  automáticamente a este usuario si no se elige otro
                  explícitamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
