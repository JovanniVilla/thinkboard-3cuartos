import { useNavigate } from "react-router";
import { PenIcon, Trash2Icon, UserIcon, CalendarIcon, LayersIcon } from "lucide-react";

const ProjectGridView = ({ projects, projectStatuses, doneStatuses, canManageProjects, openEditModal, handleDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (statusName) => {
    const s = projectStatuses.find(p => p.name === statusName);
    return s ? s.color : "#6B7280";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => {
        const statusColor = getStatusColor(project.status);
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
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-1.5" title="Fechas">
                    <CalendarIcon className="size-4 opacity-50 flex-shrink-0" />
                    <span className="truncate">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                      {" - "}
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                    </span>
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
                    onClick={(e) => { e.stopPropagation(); openEditModal(project); }} 
                    className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-primary"
                    title="Editar"
                  >
                    <PenIcon className="size-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }} 
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
  );
};

export default ProjectGridView;
