import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { 
  ArrowLeftIcon, PlusIcon, FolderKeyIcon, XIcon,
  LayoutGridIcon, ListIcon, ColumnsIcon
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

import ProjectGridView from "../components/ProjectGridView";
import ProjectListView from "../components/ProjectListView";
import ProjectKanbanView from "../components/ProjectKanbanView";

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
  const [startDate, setStartDate] = useState(project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "");
  const [endDate, setEndDate] = useState(project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "");

  const [contactName, setContactName] = useState(project?.contact?.name || "");
  const [contactPosition, setContactPosition] = useState(project?.contact?.position || "");
  const [contactPhone, setContactPhone] = useState(project?.contact?.phone || "");
  const [contactEmail, setContactEmail] = useState(project?.contact?.email || "");

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
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        contact: {
          name: contactName,
          position: contactPosition,
          phone: contactPhone,
          email: contactEmail
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-8">
      <div className="bg-base-100 w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-6 relative border border-base-content/10">
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
            <label className="label font-bold text-sm">Fecha de Inicio</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
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

          <div className="md:col-span-2 pt-4 mt-2 border-t border-base-content/10">
            <h4 className="font-bold text-base-content/80 text-sm">Contacto del Proyecto</h4>
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Nombre del Contacto</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Puesto</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={contactPosition}
              onChange={(e) => setContactPosition(e.target.value)}
              placeholder="Ej. Gerente de Marketing"
            />
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Teléfono</label>
            <input
              type="tel"
              className="input input-bordered w-full"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Ej. +52 55..."
            />
          </div>

          <div className="form-control">
            <label className="label font-bold text-sm">Correo Electrónico</label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Ej. juan@empresa.com"
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
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("project_view_mode") || "grid");

  useEffect(() => {
    localStorage.setItem("project_view_mode", viewMode);
  }, [viewMode]);

  // Derive "done" task statuses to calculate progress
  const doneStatuses = useMemo(() => {
    return statuses.filter(s => s.category === "done").map(s => s.name);
  }, [statuses]);

  const handleDelete = async (id) => {
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

  const openEditModal = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };
  
  const canManageProjects = isAdmin || isTeam;

  const viewProps = {
    projects,
    setProjects,
    projectStatuses,
    doneStatuses,
    canManageProjects,
    openEditModal,
    handleDelete
  };

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      <div className="w-full px-4 sm:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="join bg-base-100 rounded-xl border border-base-content/10 shadow-sm mr-2 p-1">
              <button 
                className={`join-item btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-ghost text-base-content/60"}`}
                onClick={() => setViewMode("grid")}
                title="Vista de Tarjetas"
              >
                <LayoutGridIcon className="size-4" />
              </button>
              <button 
                className={`join-item btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-ghost text-base-content/60"}`}
                onClick={() => setViewMode("list")}
                title="Vista de Lista"
              >
                <ListIcon className="size-4" />
              </button>
              <button 
                className={`join-item btn btn-sm ${viewMode === "kanban" ? "btn-primary" : "btn-ghost text-base-content/60"}`}
                onClick={() => setViewMode("kanban")}
                title="Vista Kanban"
              >
                <ColumnsIcon className="size-4" />
              </button>
            </div>

            <ThemeToggle />
            {canManageProjects && (
              <button onClick={openNewModal} className="btn btn-primary shadow-lg shadow-primary/20">
                <PlusIcon className="size-5" />
                <span className="hidden sm:inline">Nuevo Proyecto</span>
                <span className="sm:hidden">Nuevo</span>
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
          <div className="mt-4">
            {viewMode === "grid" && <ProjectGridView {...viewProps} />}
            {viewMode === "list" && <ProjectListView {...viewProps} />}
            {viewMode === "kanban" && <ProjectKanbanView {...viewProps} />}
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
