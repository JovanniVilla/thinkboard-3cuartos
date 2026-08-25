import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeftIcon, PlusIcon, Trash2Icon, CheckIcon, XIcon, FolderKeyIcon, PenIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useProjects } from "../lib/useProjects";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../lib/AuthContext";

const PRESET_COLORS = [
  "#6B7280", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#8B5CF6", "#EC4899", "#F43F5E", "#00FF9D",
];

const EditProjectModal = ({ project, onSave, onClose }) => {
  const [name, setName] = useState(project ? project.name : "");
  const [color, setColor] = useState(project ? project.color : "#3B82F6");
  const [description, setDescription] = useState(project ? project.description : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del proyecto es requerido");
      return;
    }
    setSaving(true);
    try {
      if (project) {
        const res = await api.put(`/projects/${project._id}`, { name: name.trim(), color, description });
        onSave(res.data, false);
        toast.success("Proyecto actualizado");
      } else {
        const res = await api.post("/projects", { name: name.trim(), color, description });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-base-100 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative border border-base-content/10">
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

        <div className="space-y-4">
          <div className="form-control">
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

          <div className="form-control">
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
            <label className="label font-bold text-sm">Descripción (Opcional)</label>
            <textarea
              className="textarea textarea-bordered h-24"
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
  const { projects, setProjects, loading } = useProjects();
  const { user: currentUser, isAdmin, isTeam } = useAuth();
  const [editingProject, setEditingProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            {projects.map((project) => (
              <div 
                key={project._id} 
                className="card bg-base-100 shadow-sm border border-base-content/10 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group overflow-hidden"
              >
                <div 
                  className="h-2 w-full"
                  style={{ backgroundColor: project.color || "#3B82F6" }}
                />
                <div className="card-body p-5">
                  <h2 className="card-title text-xl mb-1 truncate text-base-content" title={project.name}>
                    {project.name}
                  </h2>
                  <p className="text-sm text-base-content/60 line-clamp-2 min-h-[2.5rem]">
                    {project.description || "Sin descripción"}
                  </p>
                  
                  {canManageProjects && (
                    <div className="card-actions justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(project)} 
                        className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-primary"
                        title="Editar"
                      >
                        <PenIcon className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(project._id)} 
                        className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-error"
                        title="Eliminar"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
