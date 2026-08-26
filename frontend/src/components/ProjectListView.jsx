import { useNavigate } from "react-router";
import { PenIcon, Trash2Icon, LinkIcon, FolderIcon } from "lucide-react";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

const ProjectListView = ({ projects, projectStatuses, doneStatuses, canManageProjects, openEditModal, handleDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (statusName) => {
    const s = projectStatuses.find(p => p.name === statusName);
    return s ? s.color : "#6B7280";
  };

  return (
    <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200/50 text-base-content/60 text-xs">
              <th className="font-semibold py-4 w-4"></th>
              <th className="font-semibold py-4">Proyecto</th>
              <th className="font-semibold py-4">Estado</th>
              <th className="font-semibold py-4">Responsable</th>
              <th className="font-semibold py-4">Fechas</th>
              <th className="font-semibold py-4">Progreso</th>
              <th className="font-semibold py-4">Enlaces</th>
              {canManageProjects && <th className="font-semibold py-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const statusColor = getStatusColor(project.status);
              const totalTasks = project.taskCount || 0;
              const completedTasks = project.noteStatuses ? project.noteStatuses.filter(s => doneStatuses.includes(s)).length : 0;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <tr 
                  key={project._id} 
                  className="hover:bg-base-200/50 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <td className="p-0 pl-2">
                    <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: project.color || "#3B82F6" }} />
                  </td>
                  <td>
                    <div className="font-bold text-sm text-base-content">{project.name}</div>
                    <div className="text-xs text-base-content/50 truncate max-w-xs">{project.projectType || "General"}</div>
                  </td>
                  <td>
                    <div 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-block whitespace-nowrap"
                      style={{ backgroundColor: statusColor + '15', color: statusColor, border: `1px solid ${statusColor}30` }}
                    >
                      {project.status || "En planeación"}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                          <span>{getInitials(project.assignedTo)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold">{project.assignedTo || "Sin asignar"}</span>
                    </div>
                  </td>
                  <td>
                    {(project.startDate || project.endDate) ? (
                      <span className="text-xs text-base-content/80 font-medium whitespace-nowrap">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                        {" - "}
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/40">-</span>
                    )}
                  </td>
                  <td>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1 text-base-content/60">
                        <span>{completedTasks}/{totalTasks}</span>
                        <span>{progress}%</span>
                      </div>
                      <progress className="progress progress-primary w-full h-1.5" value={progress} max="100"></progress>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {project.briefUrl ? (
                        <a href={project.briefUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost btn-square text-base-content/50 hover:text-primary" title="Ver Brief">
                          <LinkIcon className="size-3.5" />
                        </a>
                      ) : <div className="w-6" />}
                      {project.folderUrl ? (
                        <a href={project.folderUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost btn-square text-base-content/50 hover:text-primary" title="Carpeta Drive">
                          <FolderIcon className="size-3.5" />
                        </a>
                      ) : <div className="w-6" />}
                    </div>
                  </td>
                  {canManageProjects && (
                    <td className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectListView;
