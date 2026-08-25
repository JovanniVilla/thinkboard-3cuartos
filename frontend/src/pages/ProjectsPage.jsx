import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { 
  ArrowLeftIcon, PlusIcon, Trash2Icon, CheckIcon, XIcon, FolderKeyIcon, PenIcon,
  CalendarIcon, UserIcon, LinkIcon, FileTextIcon, TargetIcon, LayersIcon
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useProjects } from "../lib/useProjects";
import { useProjectTypes } from "../lib/useProjectTypes";
import { useProjectStatuses } from "../lib/useProjectStatuses";
import { useAccounts } from "../lib/useAccounts";
import { useStatuses } from "../lib/useStatuses";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../lib/AuthContext";

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#00FF9D",
];

const EditProjectModal = ({ project, onSave, onClose }) => {
  const { projectTypes } = useProjectTypes();
  const { projectStatuses } = useProjectStatuses();
  const { accounts } = useAccounts();

  const [name, setName] = useState(project?.name || "");
  const [color, setColor] = useState(project?.color || "#3B82F6");
  const [description, setDescription] = useState(project?.description || "");
  
  const [projectType, setProjectType] = useState(project?.projectType || "General");
  const [status, setStatus] = useState(project?.status || "En planeación");
  const [objective, setObjective] = useState(project?.objective || "");
  const [briefUrl, setBriefUrl] = useState(project?.briefUrl || "");
  const [folderUrl, setFolderUrl] = useState(project?.folderUrl || "");
  const [assignedTo, setAssignedTo] = useState(project?.assignedTo || "Sin asignar");
  const [defaultAssignee, setDefaultAssignee] = useState(project?.defaultAssignee || "Sin asignar");
  const [endDate, setEndDate] = useState(project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del proyecto es requerido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), color, description, projectType, status, objective,
        briefUrl, folderUrl, assignedTo, defaultAssignee,
        endDate: endDate ? new Date(endDate).toISOString() : null
      };

      if (project) {
        const res = await api.put(`/projects/${project._id}`, payload);
        onSave(res.data, false);
        toast.success("Proyecto actualizado");
      } else {
        const res = await api.post("/projects", payload);
        onSave(res.data, true);
        toast.success("Proyecto creado");
      }
    } catch {
      toast.error("Error al guardar el proyecto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative border border-base-content/10 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <XIcon className="h-5 w-5" />
        </button>
        
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-base-content">
          <FolderKeyIcon className="text-primary size-6" />
          {project ? "Editar Proyecto" : "Nuevo Proyecto"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control md:col-span-2">
            <label className="label font-bold text-sm">Nombre del proyecto</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Rediseño Web, Campaña Marketing..."
              autoFocus
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label font-bold text-sm">Color distintivo</label>
            <div className="flex items-center gap-2 flex-wrap bg-base-200/50 p-3 rounded-xl border border-base-content/10">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Tipo de Proyecto</label>
            <select className="select select-bordered w-full" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <option value="General">General</option>
              {projectTypes.map((pt) => (
                <option key={pt._id} value={pt.name}>{pt.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Estado</label>
            <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="En planeación">En planeación</option>
              {projectStatuses.map((ps) => (
                <option key={ps._id} value={ps.name}>{ps.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label font-bold text-sm">Responsable del Proyecto</label>
            <select className="select select-bordered w-full" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="Sin asignar">Sin asignar</option>
              {accounts.filter(a => a.isApproved).map(a => (
                <option key={a._id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Asignado por defecto (Tareas)</label>
            <select className="select select-bordered w-full" value={defaultAssignee} onChange={(e) => setDefaultAssignee(e.target.value)}>
              <option value="Sin asignar">Sin asignar</option>
              {accounts.filter(a => a.isApproved).map(a => (
                <option key={a._id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Fecha de Cierre</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label font-bold text-sm">Objetivo (Opcional)</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ej. Lanzar v2 en Q3..."
            />
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Enlace al Brief</label>
            <input
              type="url"
              className="input input-bordered w-full"
              value={briefUrl}
              onChange={(e) => setBriefUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Carpeta del Proyecto</label>
            <input
              type="url"
              className="input input-bordered w-full"
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label font-bold text-sm">Descripción (Opcional)</label>
            <textarea
              className="textarea textarea-bordered h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del proyecto..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : "Guardar Proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { projects, setProjects, loading } = useProjects();
  const { statuses } = useStatuses();
  const { projectStatuses } = useProjectStatuses();
  const { user: currentUser, isAdmin, isTeam } = useAuth();
  
  const [editingProject, setEditingProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Derive "done" task statuses to calculate progress
  const doneStatuses = useMemo(() => {
    return statuses.filter(s => s.category === "done").map(s => s.name);
  }, [statuses]);

  const getStatusColor = (statusName) => {
    const s = projectStatuses.find(p => p.name === statusName);
    return s ? s.color : "#6B7280";
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar este proyecto? Las tareas vinculadas se quedarán sin proyecto.")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Proyecto eliminado");
    } catch {
      toast.error("Error al eliminar el proyecto");
    }
  };

  const handleSave = (savedProject, isNew) => {
    if (isNew) {
      setProjects((prev) => [savedProject, ...prev]);
    } else {
      setProjects((prev) => prev.map((p) => (p._id === savedProject._id ? savedProject : p)));
    }
    setIsModalOpen(false);
  };

  const openNewModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsModalOpen(true);
  };
  
  const canManageProjects = isAdmin || isTeam;

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      <div className="w-full px-4 sm:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-ghost btn-sm gap-1 text-base-content/70 hover:text-base-content">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-base-content">
                <FolderKeyIcon className="text-primary size-8" />
                Proyectos
              </h1>
              <p className="text-base-content/60 text-sm mt-1">
                Administra los proyectos disponibles en el tablero.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {canManageProjects && (
              <button onClick={openNewModal} className="btn btn-primary shadow-lg shadow-primary/20">
                <PlusIcon className="size-5" />
                Nuevo Proyecto
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-base-content/50">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="bg-base-100 inline-block p-8 rounded-3xl border border-base-content/10 shadow-xl">
              <FolderKeyIcon className="size-16 mx-auto text-base-content/20 mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay proyectos todavía</h3>
              <p className="text-base-content/60 max-w-md mx-auto mb-6">
                Crea un proyecto para empezar a agrupar y organizar las tareas por clientes o iniciativas.
              </p>
              {canManageProjects && (
                <button onClick={openNewModal} className="btn btn-primary">
                  <PlusIcon className="size-5" /> Crear el primer proyecto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => {
              const statusColor = getStatusColor(project.status);
              
              // Calculate progress
              const totalTasks = project.taskCount || 0;
              const completedTasks = project.noteStatuses ? project.noteStatuses.filter(s => doneStatuses.includes(s)).length : 0;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div 
                  key={project._id} 
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="card bg-base-100 shadow-sm border border-base-content/10 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col"
                >
                  <div 
                    className="h-2 w-full flex-shrink-0"
                    style={{ backgroundColor: project.color || "#3B82F6" }}
                  />
                  <div className="card-body p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="card-title text-xl mb-0 leading-tight text-base-content" title={project.name}>
                        {project.name}
                      </h2>
                      <div 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap"
                        style={{ backgroundColor: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40` }}
                      >
                        {project.status || "En planeación"}
                      </div>
                    </div>
                    
                    <p className="text-xs text-base-content/50 font-medium mb-3 flex items-center gap-1.5">
                      <LayersIcon className="size-3.5" />
                      {project.projectType || "General"}
                    </p>
                    
                    {project.objective && (
                      <p className="text-sm text-base-content/80 line-clamp-2 mb-4 flex-1">
                        <span className="font-semibold text-base-content/50 text-xs uppercase block mb-0.5">Objetivo</span>
                        {project.objective}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-base-content/70 mt-auto bg-base-200/50 p-3 rounded-xl border border-base-content/5">
                      <div className="flex items-center gap-1.5" title="Responsable">
                        <UserIcon className="size-4 opacity-50" />
                        <span className="truncate">{project.assignedTo || "Sin asignar"}</span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center gap-1.5" title="Fecha límite">
                          <CalendarIcon className="size-4 opacity-50" />
                          <span className="truncate">{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1 text-base-content/60">
                        <span>Progreso ({completedTasks}/{totalTasks})</span>
                        <span>{progress}%</span>
                      </div>
                      <progress className="progress progress-primary w-full h-2" value={progress} max="100"></progress>
                    </div>
                    
                    {canManageProjects && (
                      <div className="card-actions justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => openEditModal(project, e)} 
                          className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-primary"
                          title="Editar"
                        >
                          <PenIcon className="size-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(project._id, e)} 
                          className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-error"
                          title="Eliminar"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EditProjectModal 
          project={editingProject} 
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ProjectsPage;
