import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeftIcon, LoaderIcon, Trash2Icon } from "lucide-react";
import { useStatuses } from "../lib/useStatuses";
import { usePriorities } from "../lib/usePriorities";
import { useUsers } from "../lib/useUsers";
import StatusSelect from "../components/StatusSelect";
import PrioritySelect from "../components/PrioritySelect";
import UserSelect from "../components/UserSelect";
import MarkdownEditor from "../components/MarkdownEditor";

const NoteDetailPage = () => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { statuses } = useStatuses();
  const { priorities } = usePriorities();
  const { users } = useUsers();

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        setNote(res.data);
      } catch (error) {
        console.error("Error in fetching note", error);
        toast.error("Error al cargar la tarea");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Tarea eliminada");
      navigate("/");
    } catch (error) {
      console.error("Error deleting the note:", error);
      toast.error("Error al eliminar la tarea");
    }
  };

  const handleSave = async () => {
    if (!note.title.trim() || !note.content.trim()) {
      toast.error("El título y el contenido son obligatorios");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/notes/${id}`, note);
      toast.success("Tarea actualizada exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error saving the note:", error);
      toast.error("Error al actualizar la tarea");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <LoaderIcon className="animate-spin size-10 text-primary" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <p className="text-base-content/60">Tarea no encontrada</p>
        <Link to="/" className="btn btn-primary btn-sm">Volver al tablero</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Top Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="btn btn-ghost gap-1">
              <ArrowLeftIcon className="h-5 w-5" />
              Volver al Tablero
            </Link>
            <button type="button" onClick={handleDelete} className="btn btn-error btn-outline gap-1.5">
              <Trash2Icon className="h-4 w-4" />
              Eliminar Tarea
            </button>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-content/10">
            <div className="card-body p-6 sm:p-8 space-y-6">
              {/* Header section where Task Title is dominant! */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-base-content/40">
                  EDITANDO TAREA
                </div>
                <input
                  type="text"
                  placeholder="Título de la tarea"
                  className="text-2xl sm:text-3xl font-extrabold text-base-content w-full bg-transparent border-0 border-b border-base-content/15 focus:border-primary pb-2 focus:outline-none placeholder:text-base-content/30 transition-colors"
                  value={note.title}
                  onChange={(e) => setNote({ ...note, title: e.target.value })}
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
                    value={note.status || "Pendiente"}
                    onChange={(val) => setNote({ ...note, status: val })}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Prioridad</span>
                  </label>
                  <PrioritySelect
                    priorities={priorities}
                    value={note.priority || "Media"}
                    onChange={(val) => setNote({ ...note, priority: val })}
                  />
                </div>

                <div className="form-control">
                  <label className="label pt-0 pb-1">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Asignado a</span>
                  </label>
                  <UserSelect
                    users={users}
                    value={note.user || "Sin asignar"}
                    onChange={(val) => setNote({ ...note, user: val })}
                  />
                </div>
              </div>

              {/* Markdown Editor for Content */}
              <div className="space-y-2">
                <label className="label pt-0 pb-1">
                  <span className="label-text font-bold text-base text-base-content">Contenido / Descripción (Markdown)</span>
                </label>
                <MarkdownEditor
                  value={note.content}
                  onChange={(val) => setNote({ ...note, content: val })}
                  placeholder="Escribe los detalles de la tarea en Markdown (puedes usar listas, **negrita**, tablas, etc.)"
                />
              </div>

              <div className="card-actions justify-end pt-4 border-t border-base-content/10">
                <button type="button" className="btn btn-primary px-8 gap-2" disabled={saving} onClick={handleSave}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NoteDetailPage;
