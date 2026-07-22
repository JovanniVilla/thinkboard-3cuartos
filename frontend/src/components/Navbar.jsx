import { Link } from "react-router";
import { PlusIcon, Settings2Icon } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
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
            <Link to={"/board-settings"} className="btn btn-ghost btn-sm" title="Configuración del tablero">
              <Settings2Icon className="size-5" />
            </Link>
            <Link to={"/create"} className="btn btn-primary">
              <PlusIcon className="size-5" />
              <span>New Note</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
