import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, UserIcon } from "lucide-react";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const UserSelect = ({ users = [], value, onChange, placeholder = "— Seleccionar usuario —" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = users.find((u) => u.name === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-base-content/20 bg-base-100 hover:border-base-content/40 transition-colors text-sm cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <div className="flex items-center gap-2 truncate">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            >
              {getInitials(selected.name)}
            </span>
            <span className="font-semibold text-base-content truncate">{selected.name}</span>
            {selected.role && (
              <span className="text-xs text-base-content/50 truncate hidden sm:inline">
                ({selected.role})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-base-content/60">
            <span className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs text-base-content/60">
              <UserIcon className="w-3.5 h-3.5" />
            </span>
            <span>{value || placeholder}</span>
          </div>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 text-base-content/40 ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-content/15 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          <li>
            <button
              type="button"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                value === "Sin asignar" ? "bg-base-200" : ""
              }`}
              onClick={() => handleSelect("Sin asignar")}
            >
              <span className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs text-base-content/60">
                <UserIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-base-content/70">Sin asignar</span>
              {value === "Sin asignar" && (
                <span className="ml-auto text-primary text-xs font-bold">✓</span>
              )}
            </button>
          </li>

          {users.map((u) => (
            <li key={u._id}>
              <button
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                  value === u.name ? "bg-base-200" : ""
                }`}
                onClick={() => handleSelect(u.name)}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: u.color }}
                >
                  {getInitials(u.name)}
                </span>
                <div className="flex flex-col text-left truncate">
                  <span className="font-semibold text-base-content text-xs">{u.name}</span>
                  {u.role && <span className="text-[10px] text-base-content/50">{u.role}</span>}
                </div>
                {value === u.name && (
                  <span className="ml-auto text-primary text-xs font-bold">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSelect;
