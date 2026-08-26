import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import {
  XIcon,
  CheckCircle2Icon,
  Edit3Icon,
  MessageSquareIcon,
  ChevronDownIcon,
  ZapIcon,
  FolderKeyIcon,
  UserIcon,
  CheckSquareIcon,
  PlusIcon,
  Trash2Icon
} from "lucide-react";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useAccounts } from "../lib/useAccounts";
import { useProjects } from "../lib/useProjects";
import MarkdownEditor from "../components/MarkdownEditor";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

const CreatePage = () => {
  const { statuses } = useStatuses();
  const { priorities } = usePriorities();
  const { accounts } = useAccounts();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("Media");
  const [user, setUser] = useState("Sin asignar");
  const [project, setProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Initialize from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get("projectId");
    
    if (projectId && projects.length > 0 && !project) {
      setProject(projectId);
      const proj = projects.find(p => p._id === projectId);
      if (proj && proj.defaultAssignee && proj.defaultAssignee !== "Sin asignar") {
        setUser(proj.defaultAssignee);
      }
    }
  }, [location.search, projects]);

  const titleTextareaRef = useRef(null);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, {
      id: Date.now().toString(),
      title: newChecklistItem.trim(),
      completed: false
    }]);
    setNewChecklistItem("");
  };

  const handleToggleChecklistItem = (id) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleDeleteChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const progressPercent = checklist.length === 0 
    ? 0 
    : Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("El título y el contenido son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await api.post("/notes", {
        title,
        content,
        status: status || statuses[0]?.name || "Pendiente",
        priority: priority || "Media",
        user: user || "Sin asignar",
        project: project || null,
        checklist,
      });

      toast.success("¡Tarea creada exitosamente!");
      navigate("/");
    } catch (error) {
      console.error("Error creating note", error);
      if (error.response?.status === 429) {
        toast.error("¡Demasiadas solicitudes! Espera unos segundos");
      } else {
        toast.error("Error al crear la tarea");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = status || statuses[0]?.name || "Pendiente";
  const statusColor = statuses.find(s => s.name === currentStatus)?.color || "#6B7280";
  const priorityColor = priorities.find(p => p.name === priority)?.color || "#6B7280";
  const currentProject = projects.find(p => p._id === project);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={() => navigate("/")}>
      {/* Card Detail Modal Window Container */}
      <div className="w-full max-w-5xl bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl overflow-hidden mt-4 mb-12 flex-shrink-0 flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div className="flex items-start justify-between px-3 py-2 border-b border-base-content/10 bg-base-100 gap-2">
          
          <div className="flex flex-1 items-center gap-2 flex-wrap text-base-content/60">
            {/* Status Dropdown */}
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap">
                <span>{currentStatus}</span>
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1">
                {statuses.map((st) => (
                  <li key={st._id}>
                    <button type="button" onClick={() => setStatus(st.name)} className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${currentStatus === st.name ? "bg-primary/20 text-primary font-bold" : "text-base-content"}`}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color || "#6B7280" }} />
                        {st.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Dropdown */}
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap">
                <ZapIcon className="size-4 flex-shrink-0" style={{ color: priorityColor }} />
                <span>{priority}</span>
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1">
                {priorities.map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => setPriority(p.name)} className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${priority === p.name ? "bg-primary/20 text-primary font-bold" : "text-base-content"}`}>
                      <span className="flex items-center gap-2">
                        <ZapIcon className="size-4" style={{ color: p.color }} />
                        {p.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Project Dropdown */}
            <div className="dropdown">
              <label tabIndex={0} className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content font-medium gap-1.5 rounded-lg cursor-pointer px-2.5 flex-nowrap whitespace-nowrap">
                <FolderKeyIcon className="size-4 flex-shrink-0" style={{ color: currentProject?.color || "#6B7280" }} />
                <span>{currentProject?.name || "Sin proyecto"}</span>
                <ChevronDownIcon className="size-4 text-base-content/60 flex-shrink-0" />
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-xl w-48 border border-base-content/10 z-50 mt-1">
                <li>
                  <button type="button" onClick={() => setProject("")} className={`text-sm py-2 rounded-lg font-medium flex items-center gap-2 ${!project ? "bg-primary/20 text-primary font-bold" : "text-base-content"}`}>
                    <FolderKeyIcon className="size-4 text-base-content/60" />
                    Sin proyecto
                  </button>
                </li>
                {projects.map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => setProject(p._id)} className={`text-sm py-2 rounded-lg font-medium flex items-center justify-between ${project === p._id ? "bg-primary/20 text-primary font-bold" : "text-base-content"}`}>
                      <span className="flex items-center gap-2">
                        <FolderKeyIcon className="size-4" style={{ color: p.color }} />
                        {p.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <span className="badge bg-base-200 text-base-content/50 border border-base-content/10 font-mono font-bold text-xs px-2 py-1 whitespace-nowrap italic">
              Nueva Tarea
            </span>
          </div>

          <button type="button" onClick={() => navigate("/")} className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-base-content flex-shrink-0">
             <XIcon className="size-5" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[400px]">
          {/* Left Column */}
          <div className="flex-1 p-4 sm:p-5 md:p-6 overflow-y-auto bg-base-100 flex flex-col">
             
             {/* Title */}
             <div className="flex items-start gap-3 mb-6">
               <div className="mt-1 flex-shrink-0">
                 <CheckCircle2Icon className="size-6 text-base-content/30" />
               </div>
               <textarea
                 ref={titleTextareaRef}
                 className="w-full resize-none overflow-hidden bg-transparent text-xl md:text-2xl font-bold text-base-content leading-tight focus:outline-none focus:ring-0 placeholder:text-base-content/30"
                 placeholder="Título de la tarea"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 autoFocus
                 rows={1}
               />
             </div>
             
             {/* Description */}
             <div className="mt-2 flex gap-3 group relative flex-1">
               <div className="mt-1 flex-shrink-0 text-base-content/50">
                 <Edit3Icon className="size-5" />
               </div>
               <div className="flex-1 min-w-0 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-base-content">Descripción</h3>
                 </div>
                 <div className="flex-1 border border-base-content/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
                   <MarkdownEditor
                     value={content}
                     onChange={setContent}
                   />
                 </div>
               </div>
             </div>

             {/* Checklist Section */}
             <div className="mt-8 flex gap-3 group relative">
               <div className="mt-1 flex-shrink-0 text-base-content/50">
                 <CheckSquareIcon className="size-5" />
               </div>
               <div className="flex-1 min-w-0 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-base-content">Checklist</h3>
                 </div>
                 
                 {checklist.length > 0 && (
                   <div className="flex items-center gap-3 mb-4">
                     <span className="text-xs font-mono font-bold text-base-content/60 w-8">{progressPercent}%</span>
                     <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                       <div
                         className="bg-primary h-2.5 transition-all duration-300 rounded-full"
                         style={{ width: `${progressPercent}%` }}
                       />
                     </div>
                   </div>
                 )}

                 <div className="space-y-2">
                   {checklist.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-base-200 hover:bg-base-300/80 border border-base-content/5 transition-colors group/item">
                       <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                         <input
                           type="checkbox"
                           checked={item.completed}
                           onChange={() => handleToggleChecklistItem(item.id)}
                           className="checkbox checkbox-sm checkbox-primary rounded border-base-content/30"
                         />
                         <span className={`text-sm ${item.completed ? "line-through text-base-content/40" : "text-base-content"}`}>
                           {item.title}
                         </span>
                       </label>
                       <button
                         type="button"
                         onClick={() => handleDeleteChecklistItem(item.id)}
                         className="text-error/40 hover:text-error transition-colors p-1 opacity-0 group-hover/item:opacity-100"
                         title="Eliminar"
                       >
                         <Trash2Icon className="size-4" />
                       </button>
                     </div>
                   ))}
                   
                   <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 mt-2">
                     <input
                       type="text"
                       className="input input-sm flex-1 bg-base-100 border border-base-content/20 text-sm focus:border-primary"
                       placeholder="Añadir un elemento..."
                       value={newChecklistItem}
                       onChange={(e) => setNewChecklistItem(e.target.value)}
                     />
                     <button
                       type="submit"
                       disabled={!newChecklistItem.trim()}
                       className="btn btn-sm btn-primary btn-square rounded-lg"
                     >
                       <PlusIcon className="size-4" />
                     </button>
                   </form>
                 </div>
               </div>
             </div>

             <div className="mt-8 pt-4 border-t border-base-content/10 flex justify-end gap-3">
               <button className="btn btn-ghost" onClick={() => navigate("/")}>
                 Cancelar
               </button>
               <button
                 className="btn btn-primary px-8"
                 disabled={loading || !title.trim() || !content.trim()}
                 onClick={handleSubmit}
               >
                 {loading ? "Creando..." : "Crear Tarea"}
               </button>
             </div>
          </div>

          {/* Right Column (Activity/Comments) */}
          <div className="w-full md:w-80 lg:w-[380px] bg-base-200/50 flex-shrink-0 border-l border-base-content/10 flex flex-col relative h-[500px] md:h-auto overflow-hidden">
             
             {/* Members section in the right column */}
             <div className="p-4 border-b border-base-content/10 bg-base-200/80">
               <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                 <UserIcon className="size-4" /> Asignar a
               </h3>
               <div className="dropdown w-full">
                  <div tabIndex={0} role="button" className="btn btn-sm btn-ghost gap-2 w-full justify-start border border-base-content/10 hover:border-base-content/30 rounded-xl bg-base-100">
                    {user !== "Sin asignar" ? (
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                          <span>{getInitials(user)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-base-content/40">
                        <UserIcon className="size-3" />
                      </div>
                    )}
                    <span className="truncate">{user}</span>
                    <ChevronDownIcon className="size-4 ml-auto opacity-50" />
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[60] menu p-2 shadow-xl bg-base-100 rounded-box w-full border border-base-content/10 mt-1 max-h-60 overflow-y-auto">
                    <li>
                      <button onClick={() => { setUser("Sin asignar"); document.activeElement.blur(); }} className={`text-sm py-2 rounded-lg font-medium ${user === "Sin asignar" ? "bg-primary/20 text-primary" : ""}`}>
                        <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 mr-2">
                          <UserIcon className="size-3" />
                        </div>
                        Sin asignar
                      </button>
                    </li>
                    {accounts.map((acc) => (
                      <li key={acc._id}>
                        <button onClick={() => { setUser(acc.name); document.activeElement.blur(); }} className={`text-sm py-2 rounded-lg font-medium ${user === acc.name ? "bg-primary/20 text-primary" : ""}`}>
                          <div className="avatar placeholder mr-2">
                            <div className="bg-primary text-primary-content rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                              <span>{getInitials(acc.name)}</span>
                            </div>
                          </div>
                          {acc.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
             </div>

             <div className="p-4 border-b border-base-content/10 flex items-center justify-between bg-base-200/80">
               <h3 className="font-bold text-sm flex items-center gap-2">
                 <MessageSquareIcon className="size-4" /> Comentarios y Actividad
               </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
               <MessageSquareIcon className="size-10 mb-2 opacity-50" />
               <p className="text-sm font-medium">Guarda la tarea primero</p>
               <p className="text-xs max-w-[200px]">Podrás añadir comentarios y ver el historial de actividad una vez creada la tarea.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreatePage;
