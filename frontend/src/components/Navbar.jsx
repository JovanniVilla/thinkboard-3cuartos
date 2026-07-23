import { Link, useNavigate } from "react-router";
import { PlusIcon, Settings2Icon, LogOutIcon, UserIcon, ShieldIcon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

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
      <div className="w-full px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-3xl font-bold text-primary font-mono tracking-tight">ThinkBoard</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Board Settings - Admin only */}
            {isAdmin && (
              <Link to={"/board-settings"} className="btn btn-ghost btn-sm" title="Configuración del tablero">
                <Settings2Icon className="size-5" />
              </Link>
            )}

            <Link to={"/create"} className="btn btn-primary">
              <PlusIcon className="size-5" />
              <span className="hidden sm:inline">New Note</span>
            </Link>

            {/* User dropdown */}
            {user && (
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm gap-2 pl-2 pr-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{getInitials(user.name)}</span>
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
                      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{getInitials(user.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-base-content truncate">{user.name}</p>
                        <p className="text-xs text-base-content/50 truncate">{user.email}</p>
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

                  {/* Logout */}
                  <li>
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
