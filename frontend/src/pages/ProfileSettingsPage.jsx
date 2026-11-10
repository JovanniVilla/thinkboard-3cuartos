import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeftIcon,
  PaletteIcon,
  UserIcon,
  BriefcaseIcon,
  SlidersHorizontalIcon,
  CheckIcon,
  MailIcon,
  ShieldIcon,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import ColumnManager from "../components/ColumnManager";
import ThemeToggle from "../components/ThemeToggle";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#3B82F6", "#6366F1", "#8B5CF6", "#A600FF",
  "#EC4899", "#F43F5E", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#10B981", "#06B6D4",
];

const ProfileSettingsPage = () => {
  const { user, isAdmin, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "columns" ? "columns" : "profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setJobTitle(user.jobTitle || "");
      setColor(user.color || "#3B82F6");
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "profile" ? {} : { tab }, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name.trim(), color, jobTitle.trim());
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al actualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetChanges = () => {
    if (!user) return;
    setName(user.name || "");
    setJobTitle(user.jobTitle || "");
    setColor(user.color || "#3B82F6");
  };

  const hasChanges =
    user &&
    (name !== (user.name || "") ||
      jobTitle !== (user.jobTitle || "") ||
      color !== (user.color || "#3B82F6"));

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col">
        {/* Page Header */}
        <div className="relative mb-6 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 w-full md:w-auto">
            <Link to="/" className="btn btn-ghost btn-sm gap-1 -ml-3 md:ml-0">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver al Tablero
            </Link>
            <div className="mt-2 md:mt-0">
              <h1 className="text-2xl md:text-2xl font-bold tracking-tight text-base-content flex items-center gap-2">
                <UserIcon className="size-6 text-primary" />
                Configuración de Perfil
              </h1>
              <p className="text-base-content/60 text-sm mt-0.5">
                Administra tu información personal y tus preferencias de visualización
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 md:relative md:top-auto md:right-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-1 gap-4 md:gap-6 flex-col md:flex-row items-start">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto bg-base-100 p-2 rounded-xl shadow-sm border border-base-content/10">
            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === "profile"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "hover:bg-base-200 text-base-content/70"
              }`}
            >
              <UserIcon className="size-4 shrink-0" />
              <span>Datos de Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("columns")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === "columns"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "hover:bg-base-200 text-base-content/70"
              }`}
            >
              <SlidersHorizontalIcon className="size-4 shrink-0" />
              <span>Columnas de Tareas</span>
            </button>
          </div>

          {/* Tab Panel */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === "profile" && (
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <form onSubmit={handleSubmit} className="card-body p-5 sm:p-8 space-y-6">
                  {/* User Summary Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-base-content/10">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 transition-colors"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-base-content truncate">
                          {name || "Tu Nombre"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60 mt-0.5">
                          {user?.email && (
                            <span className="flex items-center gap-1">
                              <MailIcon className="size-3.5" />
                              {user.email}
                            </span>
                          )}
                          {jobTitle && (
                            <span className="badge badge-ghost badge-sm font-medium">
                              {jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAdmin ? (
                        <span className="badge badge-primary badge-sm gap-1 py-2.5 px-3 font-medium">
                          <ShieldIcon className="size-3" />
                          Administrador
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm gap-1 py-2.5 px-3 font-medium">
                          <UserIcon className="size-3" />
                          Miembro del equipo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="form-control sm:col-span-2">
                      <label className="label py-1">
                        <span className="label-text font-medium">Nombre a mostrar</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input input-bordered w-full pl-10 focus:input-primary"
                          placeholder="Tu nombre completo"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control sm:col-span-2">
                      <label className="label py-1">
                        <span className="label-text font-medium">Rol o Departamento</span>
                      </label>
                      <div className="relative">
                        <BriefcaseIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="input input-bordered w-full pl-10 focus:input-primary"
                          placeholder="Ej. Diseño, Desarrollo, Coordinación"
                        />
                      </div>
                    </div>

                    <div className="form-control sm:col-span-2">
                      <label className="label py-1 flex items-center justify-between">
                        <span className="label-text font-medium flex items-center gap-2">
                          <PaletteIcon className="size-4 text-base-content/60" />
                          Color de Avatar
                        </span>
                        <span className="text-xs text-base-content/50 uppercase font-mono">
                          {color}
                        </span>
                      </label>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1 p-4 rounded-xl border border-base-content/10 bg-base-200/40">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-12 h-12 p-1 bg-base-100 border border-base-content/20 rounded-lg cursor-pointer hover:border-primary transition-colors shrink-0"
                            title="Seleccionar color personalizado"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PRESET_COLORS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setColor(preset)}
                                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                                style={{
                                  backgroundColor: preset,
                                  outline:
                                    color.toLowerCase() === preset.toLowerCase()
                                      ? `2px solid ${preset}`
                                      : "none",
                                  outlineOffset: "2px",
                                }}
                                title={preset}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:ml-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-base-content/10">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {initials}
                          </div>
                          <span className="text-xs font-medium text-base-content/70">
                            Así se verá tu avatar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-base-content/10 flex items-center justify-end gap-3">
                    {hasChanges && (
                      <button
                        type="button"
                        onClick={handleResetChanges}
                        className="btn btn-ghost"
                        disabled={isSubmitting}
                      >
                        Descartar cambios
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <CheckIcon className="size-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "columns" && (
              <div className="card bg-base-100 shadow-sm border border-base-content/10">
                <div className="card-body p-5 sm:p-8">
                  <ColumnManager />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;

