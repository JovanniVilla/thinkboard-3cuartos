import {
  SearchIcon,
  XIcon,
  ListIcon,
  Columns3Icon,
  FilterIcon,
  ArrowUpDownIcon,
} from "lucide-react";

const NoteFilters = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedUser,
  setSelectedUser,
  showCompleted,
  setShowCompleted,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  statuses = [],
  priorities = [],
  users = [],
  totalNotes = 0,
  filteredCount = 0,
}) => {
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    // Always sort by date when using this toggle to match the button text
    if (sortBy !== "createdAt") setSortBy("createdAt");
  };

  const hasActiveFilters = selectedStatus || selectedPriority || selectedUser || showCompleted;

  const clearFilters = () => {
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedUser("");
    setShowCompleted(false);
  };

  return (
    <div className="bg-base-100 rounded-xl p-3 sm:p-4 shadow-sm border border-base-content/10 mb-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Title and View Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Title and Count */}
          <div className="flex items-center gap-2 pl-1">
            <h2 className="font-bold text-lg text-base-content">Mis Tareas</h2>
            <span className="badge badge-primary badge-sm font-semibold">{totalNotes}</span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-base-content/10 hidden sm:block mx-1"></div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-base-200/80 p-1 rounded-lg border border-base-content/10">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`btn btn-sm gap-1.5 transition-all px-3 ${
                viewMode === "list"
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/70 hover:text-base-content"
              }`}
            >
              <ListIcon className="size-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`btn btn-sm gap-1.5 transition-all px-3 ${
                viewMode === "board"
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/70 hover:text-base-content"
              }`}
            >
              <Columns3Icon className="size-4" />
              <span className="hidden sm:inline">Tablero</span>
            </button>
          </div>
        </div>

        {/* Right Side: Search and Actions */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          
          {/* Search */}
          <div className="relative w-full sm:w-48 md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              className="input input-bordered input-sm w-full pl-9 bg-base-200/50 focus:bg-base-100 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                onClick={() => setSearchQuery("")}
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filters Dropdown */}
          <div className="dropdown dropdown-end w-full sm:w-auto">
            <div tabIndex={0} role="button" className="btn btn-sm btn-outline bg-base-200/50 border-base-content/20 hover:bg-base-200 font-normal w-full sm:w-auto gap-2">
              <FilterIcon className="size-4" />
              Filtros
              {hasActiveFilters && (
                <div className="badge badge-primary badge-xs size-2 p-0"></div>
              )}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[10] menu p-4 shadow-lg bg-base-100 rounded-box w-72 flex flex-col gap-4 mt-2 border border-base-content/10">
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Filtros</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                    Limpiar
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70 ml-1">Estado</label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200/50 font-normal"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {statuses.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70 ml-1">Prioridad</label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200/50 font-normal"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="">Todas las prioridades</option>
                  {priorities.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70 ml-1">Usuario</label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200/50 font-normal"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Todos los usuarios</option>
                  <option value="Sin asignar">Sin asignar</option>
                  {users.map((u) => (
                    <option key={u._id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="label cursor-pointer gap-2 bg-base-200/30 border border-base-content/10 px-3 py-2 rounded-lg mt-1">
                <span className="label-text text-sm whitespace-nowrap">Mostrar completados</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />
              </label>

            </ul>
          </div>

          {/* Sort Button */}
          <button
            type="button"
            onClick={toggleSortOrder}
            className="btn btn-sm btn-outline bg-base-200/50 border-base-content/20 hover:bg-base-200 font-normal w-full sm:w-auto gap-2"
          >
            <ArrowUpDownIcon className="size-4" />
            <span className="hidden sm:inline">Fecha</span>
            <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteFilters;
