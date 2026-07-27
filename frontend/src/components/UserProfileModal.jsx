import { useState, useEffect } from "react";
import { XIcon, PaletteIcon, UserIcon, BriefcaseIcon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setJobTitle(user.jobTitle || "");
      setColor(user.color || "#3B82F6");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name, color, jobTitle);
      toast.success("Perfil actualizado correctamente");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-base-content/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        <div className="p-5 border-b border-base-content/10 flex items-center justify-between bg-base-200/50">
          <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
            <UserIcon className="size-5 text-primary" />
            Configuración de Perfil
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square rounded-full hover:bg-base-300"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Nombre a mostrar</span>
              </label>
              <div className="relative">
                <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-bordered w-full pl-9 focus:input-primary"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Rol o Departamento</span>
              </label>
              <div className="relative">
                <BriefcaseIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="input input-bordered w-full pl-9 focus:input-primary"
                  placeholder="Ej. Diseño, Desarrollo, Coordinación"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1 flex items-center justify-between">
                <span className="label-text font-medium flex items-center gap-2">
                  <PaletteIcon className="size-4 text-base-content/60" />
                  Color de Avatar
                </span>
                <span className="text-xs text-base-content/50 uppercase font-mono">{color}</span>
              </label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 p-1 bg-base-100 border border-base-content/20 rounded-lg cursor-pointer hover:border-primary transition-colors"
                />
                <div className="flex-1 p-3 rounded-lg border border-base-content/10 bg-base-200/50 flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    {name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-medium opacity-80">
                    Así se verá tu avatar
                  </span>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-5 border-t border-base-content/10 bg-base-200/50 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="profile-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
