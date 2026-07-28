import { useState } from "react";
import { LockIcon, KeyRoundIcon, LoaderIcon } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

const ForcePasswordChange = () => {
  const { changePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Por favor completa ambos campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await changePassword(password);
      toast.success("Contraseña actualizada exitosamente");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-content/10">
        <div className="card-body">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 bg-warning/20 text-warning rounded-full flex items-center justify-center mb-4">
              <LockIcon className="size-8" />
            </div>
            <h2 className="card-title text-2xl font-bold">Cambio Obligatorio</h2>
            <p className="text-sm text-base-content/70 mt-2">
              Por seguridad, debes establecer una nueva contraseña antes de continuar usando el sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <KeyRoundIcon className="size-4" /> Nueva Contraseña
                </span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full focus:input-primary"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <KeyRoundIcon className="size-4" /> Confirmar Contraseña
                </span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full focus:input-primary"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderIcon className="size-5 animate-spin" /> Actualizando...
                </>
              ) : (
                "Guardar Contraseña"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
