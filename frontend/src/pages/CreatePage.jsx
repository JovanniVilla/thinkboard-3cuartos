import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import api from "../lib/axios";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useUsers } from "../lib/useUsers";
import StatusSelect from "../components/StatusSelect";
import PrioritySelect from "../components/PrioritySelect";
import UserSelect from "../components/UserSelect";
import MarkdownEditor from "../components/MarkdownEditor";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("Media");
  const [user, setUser] = useState("Sin asignar");
  const [loading, setLoading] = useState(false);

  const { statuses } = useStatuses();
  const { priorities } = usePriorities();
  const { users } = useUsers();

  const navigate = useNavigate();

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
      });

      toast.success("¡Tarea creada exitosamente!");
      navigate("/");
    } catch (error) {
      console.error("Error creating note", error);
      if (error.response?.status === 429) {
        toast.error("¡Demasiadas solicitudes! Espera unos segundos", {
          duration: 4000,
          icon: "💀",
        });
      } else {
        toast.error("Error al crear la tarea");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link to={"/"} className="btn btn-ghost mb-6 gap-1">
            <ArrowLeftIcon className="size-5" />
            Volver al Tablero
          </Link>

          <div className="card bg-base-100 shadow-sm border border-base-content/10">
            <div className="card-body p-6 sm:p-8 space-y-6">
              {/* Header section where Task Title is dominant! */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-base-content/40">
                  CREAR NUEVA TAREA
                </div>
                <input
                  type="text"
                  placeholder="Título de la tarea"
                  className="text-2xl sm:text-3xl font-extrabold text-base-content w-full bg-transparent border-0 border-b border-base-content/15 focus:border-primary pb-2 focus:outline-none placeholder:text-base-content/30 transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Status, Priority, User Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-base-200/50 rounded-xl border border-base-content/10">
                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Estado</span>
                  </label>
                  <StatusSelect
                    statuses={statuses}
                    value={status}
                    onChange={setStatus}
                    placeholder="— Seleccionar estado —"
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Prioridad</span>
                  </label>
                  <PrioritySelect
                    priorities={priorities}
                    value={priority}
                    onChange={setPriority}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Asignado a</span>
                  </label>
                  <UserSelect
                    users={users}
                    value={user}
                    onChange={setUser}
                  />
                </div>
              </div>

              {/* Markdown Editor for Content */}
              <div className="space-y-2">
                <label className="label pt-0 pb-1">
                  <span className="label-text font-bold text-base text-base-content">Contenido / Descripción (Markdown)</span>
                </label>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Escribe los detalles de la tarea en Markdown (puedes usar listas, **negrita**, tablas, etc.)"
                />
              </div>

              <div className="card-actions justify-end pt-4 border-t border-base-content/10">
                <button
                  type="button"
                  className="btn btn-primary px-8 gap-2"
                  disabled={loading || !title.trim() || !content.trim()}
                  onClick={handleSubmit}
                >
                  {loading ? "Creando..." : "Crear Tarea"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreatePage;
