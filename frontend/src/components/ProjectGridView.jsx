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
        const initials = project.assignedTo ? project.assignedTo.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "";

        return (
          <div 
            key={project._id} 
            onClick={() => navigate(`/projects/${project._id}`)}
            className="bg-base-100 shadow-sm border border-base-content/10 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col rounded-[2rem] p-6 relative"
          >
            {/* Top Row: Status Pill & Actions */}
            <div className="flex items-start justify-between mb-4">
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: statusColor + '15', color: statusColor }}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: statusColor }}></div>
                {project.status || "En planeación"}
              </div>
              
              {canManageProjects && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-base-100/90 backdrop-blur-sm rounded-full px-1.5 py-1.5 shadow-sm border border-base-content/5 -mt-1 -mr-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(project); }} 
                    className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-primary"
                    title="Editar"
                  >
                    <PenIcon className="size-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }} 
                    className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-error"
                    title="Eliminar"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Title */}
            <h2 className="text-[1.35rem] font-extrabold mb-3 text-base-content leading-tight tracking-tight" title={project.name}>
              {project.name}
            </h2>
            
            {/* Type & Objective */}
            <div className="flex-1">
              {project.projectType && (
                <p className="text-xs font-semibold text-primary/70 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                  <LayersIcon className="size-3.5" />
                  {project.projectType}
                </p>
              )}
              
              {project.objective && (
                <p className="text-base-content/60 text-[15px] line-clamp-3 leading-relaxed">
                  {project.objective}
                </p>
              )}
            </div>
            
            {/* Progress */}
            <div className="mt-8 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] text-base-content/70 font-medium flex items-center gap-2">
                  Progreso
                  <span className="text-[11px] font-normal opacity-70 bg-base-content/5 px-1.5 py-0.5 rounded-md">
                    {completedTasks}/{totalTasks}
                  </span>
                </span>
                <span className="font-extrabold text-[16px] text-base-content">{progress}%</span>
              </div>
              <div className="w-full bg-base-content/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-primary" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-base-content/5 pt-5 flex items-center justify-between">
              {/* Avatar */}
              <div className="flex items-center" title={`Responsable: ${project.assignedTo || "Sin asignar"}`}>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm border-[3px] border-base-100"
                  style={{ backgroundColor: project.color || '#6366f1' }}
                >
                  {initials || <UserIcon className="size-4" />}
                </div>
              </div>

              {/* Dates */}
              {(project.startDate || project.endDate) && (
                <div className="text-[15px] text-base-content/60 font-medium text-right">
                  {project.endDate ? (
                    <>Entrega: <span className="text-base-content/80 font-semibold">{new Date(project.endDate).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}</span></>
                  ) : (
                    <>Inicio: <span className="text-base-content/80 font-semibold">{new Date(project.startDate).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}</span></>
                  )}
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
