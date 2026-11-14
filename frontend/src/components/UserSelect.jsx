import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDownIcon, UserIcon, UsersIcon, SearchIcon, XIcon, CheckIcon } from "lucide-react";

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

const UserSelect = ({
  users = [],
  value,
  onChange,
  placeholder = "— Seleccionar usuario —",
  variant = "select", // "select" | "button"
  isOpen,
  onToggle,
  onClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const handleToggle = useCallback(() => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalOpen((o) => !o);
    }
  }, [isControlled, onToggle]);

  const handleClose = useCallback(() => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
    setSearch("");
  }, [isControlled, onClose]);

  const selected = users.find(
    (u) =>
      (typeof u === "string" ? u : u.name)?.trim().toLowerCase() ===
      (value || "").trim().toLowerCase()
  );

  const hasAssigned = Boolean(value && value !== "Sin asignar");
  const displayName = typeof selected === "string" ? selected : (selected?.name || (hasAssigned ? value : ""));
  const displayColor = typeof selected === "object" ? selected?.color : "#0284c7";

  // Close on outside click and reset search
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [handleClose]);

  // Handle escape key and auto-focus search input when opened
  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
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
  }, [open, handleClose]);

  const handleSelect = (name) => {
    onChange(name);
    handleClose();
  };

  const query = normalizeText(search);

  const showUnassigned =
    !query ||
    normalizeText("sin asignar").includes(query) ||
    normalizeText("ninguno").includes(query);

  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const name = typeof u === "string" ? u : (u.name || "");
    const role = typeof u === "object" && (u.role || u.jobTitle) ? (u.role || u.jobTitle) : "";
    const email = typeof u === "object" && u.email ? u.email : "";

    return (
      normalizeText(name).includes(query) ||
      normalizeText(role).includes(query) ||
      normalizeText(email).includes(query)
    );
  });

  return (
    <div ref={ref} className={`relative popover-container ${variant === "button" ? "inline-block" : "w-full"}`}>
      {variant === "button" ? (
        <button
          type="button"
          className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg cursor-pointer"
          onClick={handleToggle}
          title={hasAssigned ? `Asignado a: ${displayName}` : "Asignar Miembro"}
        >
          {hasAssigned ? (
            <>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: displayColor || "#0284c7" }}
              >
                {getInitials(displayName)}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{displayName}</span>
            </>
          ) : (
            <>
              <UsersIcon className="size-4" />
              <span>Miembros</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-base-content/20 bg-base-100 hover:border-base-content/40 transition-colors text-sm cursor-pointer"
          onClick={handleToggle}
        >
          {hasAssigned ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: displayColor || "#0284c7" }}
              >
                {getInitials(displayName)}
              </span>
              <span className="font-semibold text-base-content truncate">{displayName}</span>
              {typeof selected === "object" && (selected.role || selected.jobTitle) && (
                <span className="text-xs text-base-content/50 truncate hidden sm:inline">
                  ({selected.role || selected.jobTitle})
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
      )}

      {open && (
        <div
          className={`absolute z-50 mt-1 bg-base-100 border border-base-content/15 rounded-xl shadow-2xl overflow-hidden flex flex-col popover-container ${
            variant === "button" ? "left-0 w-60 sm:w-64" : "w-full min-w-[220px]"
          }`}
        >
          {/* Header (when variant is button) */}
          {variant === "button" && (
            <div className="px-3 py-2 border-b border-base-content/10 flex items-center justify-between bg-base-200/40">
              <span className="text-xs font-bold text-base-content/70">Asignar Miembro</span>
              <button
                type="button"
                onClick={handleClose}
                className="text-base-content/40 hover:text-base-content p-0.5 rounded-md cursor-pointer transition-colors"
                title="Cerrar"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          )}

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
          <ul className="max-h-60 overflow-y-auto divide-y divide-base-content/5 p-1">
            {showUnassigned && (
              <li>
                <button
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-base-200 transition-colors cursor-pointer ${
                    !hasAssigned ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                  }`}
                  onClick={() => handleSelect("Sin asignar")}
                >
                  <span className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-xs text-base-content/60 flex-shrink-0">
                    <UserIcon className="size-3" />
                  </span>
                  <span className="text-base-content/70">Sin asignar</span>
                  {!hasAssigned && (
                    <CheckIcon className="ml-auto size-4 text-primary flex-shrink-0" />
                  )}
                </button>
              </li>
            )}

            {filteredUsers.map((u) => {
              const name = typeof u === "string" ? u : u.name;
              const role = typeof u === "object" ? (u.role || u.jobTitle) : "";
              const color = typeof u === "object" ? u.color : null;
              const key = typeof u === "object" ? (u._id || u.name) : u;
              const isSelected = (value || "").trim().toLowerCase() === name.trim().toLowerCase();

              return (
                <li key={key}>
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-base-200 transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/20 text-primary font-bold" : "text-base-content"
                    }`}
                    onClick={() => handleSelect(name)}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color || "#0284c7" }}
                    >
                      {getInitials(name)}
                    </span>
                    <div className="flex flex-col text-left truncate min-w-0">
                      <span className="font-semibold text-xs truncate">{name}</span>
                      {role && <span className="text-[10px] opacity-60 truncate">{role}</span>}
                    </div>
                    {isSelected && (
                      <CheckIcon className="ml-auto size-4 text-primary flex-shrink-0" />
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
