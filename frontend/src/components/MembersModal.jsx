import { useState, useEffect } from "react";
import { XIcon, UserIcon, CheckIcon } from "lucide-react";

const getInitials = (name = "") => {
  if (!name || name === "Sin asignar") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const MembersModal = ({
  isOpen,
  onClose,
  selectedUser = "Sin asignar",
  onSelectUser,
  accounts = []
}) => {
  const [search, setSearch] = useState("");

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAccounts = (accounts || []).filter((acc) =>
    (acc.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (acc.email && acc.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs sm:max-w-sm bg-base-100 border border-base-content/15 rounded-2xl shadow-2xl p-4 text-base-content space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
          <span className="font-bold text-sm text-base-content">Miembros</span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
            title="Cerrar"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar miembros"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm w-full bg-base-200 border border-base-content/20 rounded-lg text-sm focus:border-primary focus:outline-none"
            autoFocus
          />
        </div>

        {/* Currently Assigned (Miembros de la tarjeta) */}
        {selectedUser && selectedUser !== "Sin asignar" && (
          <div>
            <div className="text-xs font-semibold text-base-content/60 mb-1.5">
              Miembros de la tarjeta
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-base-200/80 border border-base-content/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="avatar placeholder flex-shrink-0">
                  <div className="bg-primary text-primary-content rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                    <span>{getInitials(selectedUser)}</span>
                  </div>
                </div>
                <span className="text-sm font-medium truncate">{selectedUser}</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectUser("Sin asignar")}
                className="p-1.5 hover:bg-base-content/10 rounded-lg text-base-content/60 hover:text-error transition-colors"
                title="Quitar miembro"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Board Members List (Miembros del tablero) */}
        <div>
          <div className="text-xs font-semibold text-base-content/60 mb-1.5">
            Miembros del tablero
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {/* Option: Sin asignar */}
            <button
              type="button"
              onClick={() => {
                onSelectUser("Sin asignar");
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                selectedUser === "Sin asignar"
                  ? "bg-primary/20 text-primary font-bold"
                  : "hover:bg-base-200 text-base-content"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center text-base-content/40 flex-shrink-0">
                  <UserIcon className="size-3.5" />
                </div>
                <span className="text-sm font-medium">Sin asignar</span>
              </div>
              {selectedUser === "Sin asignar" && (
                <CheckIcon className="size-4 text-primary flex-shrink-0" />
              )}
            </button>

            {/* Filtered accounts list */}
            {filteredAccounts.map((acc) => {
              const isAssigned = selectedUser === acc.name;
              return (
                <button
                  key={acc._id}
                  type="button"
                  onClick={() => {
                    onSelectUser(isAssigned ? "Sin asignar" : acc.name);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                    isAssigned
                      ? "bg-primary/20 text-primary font-bold"
                      : "hover:bg-base-200 text-base-content"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="avatar placeholder flex-shrink-0">
                      <div
                        className="rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: acc.color || "#3B82F6" }}
                      >
                        <span>{getInitials(acc.name)}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{acc.name}</div>
                      {acc.email && (
                        <div className="text-[11px] text-base-content/50 truncate">
                          {acc.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAssigned && (
                    <CheckIcon className="size-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredAccounts.length === 0 && (
              <div className="text-center py-4 text-xs text-base-content/50">
                No se encontraron miembros
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
