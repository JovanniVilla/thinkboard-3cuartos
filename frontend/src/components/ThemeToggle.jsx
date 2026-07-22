import { useTheme } from "../lib/ThemeContext";
import { SunIcon, MoonIcon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle text-base-content hover:bg-base-content/10 transition-transform duration-300 hover:scale-105 active:scale-95"
      title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {theme === "light" ? (
        <MoonIcon className="size-5 transition-all duration-300 rotate-0 text-indigo-600" />
      ) : (
        <SunIcon className="size-5 transition-all duration-300 rotate-180 text-yellow-400" />
      )}
    </button>
  );
};

export default ThemeToggle;
