import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { UserIcon, LayersIcon } from "lucide-react";
import api from "../lib/axios";
import toast from "react-hot-toast";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

const ProjectKanbanView = ({ projects, setProjects, projectStatuses, doneStatuses, canManageProjects }) => {
  const navigate = useNavigate();
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  
  // To avoid rapid drag issues
  const dragCounter = useRef(0);

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
    // Slight delay to allow the drag image to be created before hiding the original
    setTimeout(() => {
      e.target.classList.add("opacity-50");
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedProject(null);
    setDragOverStatus(null);
    e.target.classList.remove("opacity-50");
    dragCounter.current = 0;
  };

  const handleDragEnter = (e, statusName) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedProject && draggedProject.status !== statusName) {
      setDragOverStatus(statusName);
    }
  };

  const handleDragLeave = (e, statusName) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverStatus(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetStatusName) => {
    e.preventDefault();
    setDragOverStatus(null);
    dragCounter.current = 0;

    if (!draggedProject || draggedProject.status === targetStatusName) return;
    if (!canManageProjects) {
      toast.error("No tienes permisos para mover proyectos");
      return;
    }

    const projectId = draggedProject._id;
    const previousStatus = draggedProject.status;

    // Optimistic update
    setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: targetStatusName } : p));

    try {
      await api.put(`/projects/${projectId}`, { status: targetStatusName });
      toast.success(`Proyecto movido a ${targetStatusName}`);
    } catch (error) {
      console.error("Error moving project:", error);
      toast.error("Error al mover el proyecto");
      // Revert on error
      setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: previousStatus } : p));
    }
  };

  // Group projects by status
  const columns = projectStatuses.map(status => {
    return {
      ...status,
      items: projects.filter(p => p.status === status.name || (!p.status && status.name === "En planeación"))
    };
  });

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x items-start">
      {columns.map(col => (
        <div 
          key={col._id} 
          className="flex-shrink-0 w-80 flex flex-col snap-start"
          onDragEnter={(e) => handleDragEnter(e, col.name)}
          onDragLeave={(e) => handleDragLeave(e, col.name)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.name)}
        >
          {/* Column Header */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
            <h3 className="font-bold text-sm text-base-content/80 flex-1 truncate">{col.name}</h3>
            <span className="text-xs font-semibold text-base-content/50 bg-base-300/50 px-2 py-0.5 rounded-full">
              {col.items.length}
            </span>
          </div>

          {/* Column Body */}
          <div 
            className={`flex flex-col gap-3 min-h-[150px] rounded-2xl p-2 transition-colors ${
              dragOverStatus === col.name ? "bg-primary/5 border border-primary/20" : "bg-base-200/50"
            }`}
          >
            {col.items.length === 0 && dragOverStatus !== col.name && (
              <div className="flex items-center justify-center h-24 text-xs font-semibold text-base-content/30 italic">
                Sin proyectos
              </div>
            )}
            
            {col.items.map(project => {
              const totalTasks = project.taskCount || 0;
              const completedTasks = project.noteStatuses ? project.noteStatuses.filter(s => doneStatuses.includes(s)).length : 0;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={project._id}
                  draggable={canManageProjects}
                  onDragStart={(e) => handleDragStart(e, project)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/projects/${project._id}`)}
                  className="bg-base-100 p-4 rounded-xl shadow-sm border border-base-content/10 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-1.5 h-full self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: project.color || "#3B82F6" }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-base-content leading-tight mb-1">{project.name}</h4>
                      <p className="text-[10px] text-base-content/50 font-medium flex items-center gap-1">
                        <LayersIcon className="size-3" />
                        <span className="truncate">{project.projectType || "General"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 w-full">
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1 text-base-content/50">
                      <span>{completedTasks}/{totalTasks} Tareas</span>
                      <span>{progress}%</span>
                    </div>
                    <progress className="progress progress-primary w-full h-1" value={progress} max="100"></progress>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-content/5">
                    <div className="flex items-center gap-1.5">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold">
                          <span>{getInitials(project.assignedTo)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-base-content/60 truncate max-w-[80px]">
                        {project.assignedTo === "Sin asignar" ? "Sin resp." : project.assignedTo}
                      </span>
                    </div>
                    {(project.startDate || project.endDate) && (
                      <span className="text-[10px] font-semibold text-base-content/50 whitespace-nowrap">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                        {" - "}
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectKanbanView;
