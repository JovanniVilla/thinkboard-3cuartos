import { Link, useNavigate, useLocation } from "react-router";
import { PlusIcon, SettingsIcon, UserRoundCogIcon, LogOutIcon, UserIcon, ShieldIcon, FolderKeyIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../lib/AuthContext";
import { useBoardConfig } from "../lib/useBoardConfig";
import toast from "react-hot-toast";
import GlobalTimerWidget from "./timetracking/GlobalTimerWidget";

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { boardConfig } = useBoardConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada");
      navigate("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-base-300 border-b border-base-content/10 w-full">
      <div className="w-full px-2.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
            <h1 className="hidden sm:block text-2xl md:text-3xl font-bold text-primary font-mono tracking-tight truncate max-w-[180px] md:max-w-[300px]">{boardConfig?.projectName || "ThinkBoard"}</h1>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />

            <Link to={"/projects"} className="btn btn-ghost btn-circle btn-sm" title="Proyectos">
              <FolderKeyIcon className="size-4 sm:size-5" />
            </Link>

            <Link
              to={"/create"}
              state={{ returnTo: location.pathname + location.search }}
              className="btn btn-primary btn-sm px-2.5 sm:px-3 gap-1.5"
              title="New Note"
            >
              <PlusIcon className="size-4 sm:size-5" />
              <span className="hidden sm:inline font-medium">New Note</span>
            </Link>

            {/* Global Timer Widget */}
            {user && <GlobalTimerWidget />}

            {/* User dropdown */}
            {user && (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm p-0.5 sm:px-2 gap-2 rounded-full sm:rounded-lg"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-base-content/10 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                       style={{ backgroundColor: user.color || "#3B82F6" }}>
                    <span>{getInitials(user.name)}</span>
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-base-content/80 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border border-base-content/10 rounded-xl shadow-xl w-64 p-2 mt-2 z-50"
                >
                  {/* User info header */}
                  <li className="pointer-events-none px-3 py-2 border-b border-base-content/10 mb-1">
                    <div className="flex items-center gap-3 p-0 hover:bg-transparent">
                      <div className="w-10 h-10 rounded-full border border-base-content/10 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm"
                           style={{ backgroundColor: user.color || "#3B82F6" }}>
                        <span>{getInitials(user.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content truncate">{user.name}</p>
                        <p className="text-xs text-base-content/50 truncate">{user.jobTitle || user.email}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isAdmin ? (
                            <span className="badge badge-primary badge-xs gap-1">
                              <ShieldIcon className="size-2.5" />
                              Admin
                            </span>
                          ) : (
                            <span className="badge badge-ghost badge-xs gap-1">
                              <UserIcon className="size-2.5" />
                              Usuario
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>

                  {/* Profile Config */}
                  <li>
                    <Link
                      to="/profile"
                      onClick={() => document.activeElement?.blur()}
                      className="text-base-content hover:bg-base-200 font-medium gap-2"
                    >
                      <UserRoundCogIcon className="size-4" />
                      Configuración de perfil
                    </Link>
                  </li>

                  {/* Board Settings - Admin only */}
                  {isAdmin && (
                    <li>
                      <Link
                        to="/board-settings"
                        onClick={() => document.activeElement?.blur()}
                        className="text-base-content hover:bg-base-200 font-medium gap-2"
                      >
                        <SettingsIcon className="size-4" />
                        Gestión del Tablero
                      </Link>
                    </li>
                  )}

                  {/* Proyectos link on mobile dropdown */}
                  <li className="sm:hidden">
                    <Link
                      to="/projects"
                      onClick={() => document.activeElement?.blur()}
                      className="text-base-content hover:bg-base-200 font-medium gap-2"
                    >
                      <FolderKeyIcon className="size-4" />
                      Proyectos
                    </Link>
                  </li>

                  {/* Logout */}
                  <li className="border-t border-base-content/10 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="text-error hover:bg-error/10 hover:text-error font-medium gap-2"
                    >
                      <LogOutIcon className="size-4" />
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
