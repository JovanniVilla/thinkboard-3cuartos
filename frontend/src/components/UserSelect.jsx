import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, UserIcon, SearchIcon, XIcon, CheckIcon } from "lucide-react";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const normalizeText = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const UserSelect = ({ users = [], value, onChange, placeholder = "— Seleccionar usuario —" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const selected = users.find((u) => u.name === value);

  // Close on outside click and reset search
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle escape key and auto-focus search input when opened
  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
    setSearch("");
  };

  const query = normalizeText(search);

  const showUnassigned =
    !query ||
    normalizeText("sin asignar").includes(query) ||
    normalizeText("ninguno").includes(query);

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const name = typeof u === "string" ? u : (u.name || "");
    const role = typeof u === "object" && u.role ? u.role : "";
    const email = typeof u === "object" && u.email ? u.email : "";

    return (
      normalizeText(name).includes(query) ||
      normalizeText(role).includes(query) ||
      normalizeText(email).includes(query)
    );
  });

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
              style={{ backgroundColor: selected.color || "#3B82F6" }}
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
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-base-100 border border-base-content/15 rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* Search bar */}
          <div className="p-2 border-b border-base-content/10 bg-base-100 sticky top-0 z-10">
            <div className="relative flex items-center">
              <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 text-base-content/40 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-base-200/70 border border-base-content/15 rounded-md focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/40 transition-colors"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showUnassigned && filteredUsers.length === 0) {
                      handleSelect("Sin asignar");
                    } else if (filteredUsers.length === 1) {
                      const u = filteredUsers[0];
                      handleSelect(typeof u === "string" ? u : u.name);
                    }
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-base-content/40 hover:text-base-content p-0.5 rounded-full cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Users List */}
          <ul className="max-h-60 overflow-y-auto divide-y divide-base-content/5">
            {showUnassigned && (
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                    value === "Sin asignar" ? "bg-base-200 font-semibold" : ""
                  }`}
                  onClick={() => handleSelect("Sin asignar")}
                >
                  <span className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs text-base-content/60 flex-shrink-0">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-base-content/70">Sin asignar</span>
                  {value === "Sin asignar" && (
                    <CheckIcon className="ml-auto w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              </li>
            )}

            {filteredUsers.map((u) => {
              const name = typeof u === "string" ? u : u.name;
              const role = typeof u === "object" ? u.role : "";
              const color = typeof u === "object" ? u.color : null;
              const key = typeof u === "object" ? (u._id || u.name) : u;
              const isSelected = value === name;

              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-base-200 transition-colors ${
                      isSelected ? "bg-base-200 font-semibold" : ""
                    }`}
                    onClick={() => handleSelect(name)}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: color || "#3B82F6" }}
                    >
                      {getInitials(name)}
                    </span>
                    <div className="flex flex-col text-left truncate min-w-0">
                      <span className="font-semibold text-base-content text-xs truncate">{name}</span>
                      {role && <span className="text-[10px] text-base-content/50 truncate">{role}</span>}
                    </div>
                    {isSelected && (
                      <CheckIcon className="ml-auto w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}

            {!showUnassigned && filteredUsers.length === 0 && (
              <li className="px-3 py-6 text-xs text-center text-base-content/50 flex flex-col items-center gap-1.5">
                <UserIcon className="w-5 h-5 text-base-content/30" />
                <span>No se encontraron usuarios</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSelect;
