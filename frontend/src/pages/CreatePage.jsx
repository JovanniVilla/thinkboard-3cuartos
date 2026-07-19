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
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to={"/"} className="btn btn-ghost mb-6">
            <ArrowLeftIcon className="size-5" />
            Volver al Tablero
          </Link>

          <div className="card bg-base-100 shadow-sm border border-base-content/10">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Crear Nueva Tarea</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Título</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Título de la tarea"
                    className="input input-bordered w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Estado</span>
                    </label>
                    <StatusSelect
                      statuses={statuses}
                      value={status}
                      onChange={setStatus}
                      placeholder="— Seleccionar estado —"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Prioridad</span>
                    </label>
                    <PrioritySelect
                      priorities={priorities}
                      value={priority}
                      onChange={setPriority}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Asignar a</span>
                    </label>
                    <UserSelect
                      users={users}
                      value={user}
                      onChange={setUser}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Contenido / Descripción</span>
                  </label>
                  <textarea
                    placeholder="Escribe los detalles de la tarea aquí..."
                    className="textarea textarea-bordered h-32 w-full"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="card-actions justify-end pt-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Creando..." : "Crear Tarea"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreatePage;
