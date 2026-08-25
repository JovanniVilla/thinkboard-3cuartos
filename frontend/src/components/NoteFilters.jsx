import { useState } from "react";
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
  selectedProject,
  setSelectedProject,
  showCompleted,
  setShowCompleted,
  showMyTasks,
  setShowMyTasks,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  statuses = [],
  priorities = [],
  users = [],
  projects = [],
  totalNotes = 0,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    // Always sort by date when using this toggle to match the button text
    if (sortBy !== "createdAt") setSortBy("createdAt");
  };

  const hasActiveFilters = selectedStatus || selectedPriority || selectedUser || selectedProject || showCompleted || showMyTasks;

  const clearFilters = () => {
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedUser("");
    setSelectedProject("");
    setShowCompleted(false);
    setShowMyTasks(false);
  };

  return (
    <div className="bg-base-100 rounded-xl p-2 sm:p-3 shadow-sm border border-base-content/10 mb-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Title and Count */}
        <div className="flex items-center gap-2 pl-1">
          <h2 className="font-bold text-base sm:text-lg text-base-content whitespace-nowrap">Tareas</h2>
          <span className="badge badge-primary badge-sm font-semibold">{totalNotes}</span>
        </div>

        {/* Right Side: View Mode & Icons */}
        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-base-200/80 p-1 rounded-lg border border-base-content/10 mr-0.5 sm:mr-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`btn btn-xs sm:btn-sm gap-1.5 transition-all px-2 sm:px-3 ${
                viewMode === "list"
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/70 hover:text-base-content"
              }`}
            >
              <ListIcon className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`btn btn-xs sm:btn-sm gap-1.5 transition-all px-2 sm:px-3 ${
                viewMode === "board"
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/70 hover:text-base-content"
              }`}
            >
              <Columns3Icon className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Tablero</span>
            </button>
          </div>

          {/* Mobile Search Toggle */}
          <button 
            type="button" 
            className={`btn btn-sm btn-outline bg-base-200/50 border-base-content/20 sm:hidden px-2 ${showMobileSearch ? 'bg-base-300' : ''}`}
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <SearchIcon className="size-4" />
          </button>

          {/* Filters Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-sm btn-outline bg-base-200/50 border-base-content/20 hover:bg-base-200 font-normal gap-2 px-2 sm:px-3 relative">
              <FilterIcon className="size-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <div className="badge badge-primary badge-xs size-2 p-0 absolute top-1 right-1 sm:static sm:top-auto sm:right-auto"></div>
              )}
            </div>
            <ul tabIndex={0} className="dropdown-content z-50 menu p-4 shadow-lg bg-base-100 rounded-box w-72 flex flex-col gap-4 mt-2 border border-base-content/10">
              
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70 ml-1">Proyecto</label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200/50 font-normal"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  <option value="">Todos los proyectos</option>
                  <option value="Sin asignar">Sin proyecto</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="label cursor-pointer gap-2 bg-base-200/30 border border-base-content/10 px-3 py-2 rounded-lg mt-1">
                <span className="label-text text-sm whitespace-nowrap">Mis tareas</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={showMyTasks}
                  onChange={(e) => setShowMyTasks(e.target.checked)}
                />
              </label>

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
            className="btn btn-sm btn-outline bg-base-200/50 border-base-content/20 hover:bg-base-200 font-normal gap-1 sm:gap-2 px-2 sm:px-3 relative"
            title={`Ordenar por fecha ${sortOrder === "asc" ? "ascendente" : "descendente"}`}
          >
            <ArrowUpDownIcon className="size-4" />
            <span className="hidden sm:inline">Fecha</span>
            <span className="hidden sm:inline">{sortOrder === "asc" ? "↑" : "↓"}</span>
          </button>
          
          {/* Desktop Search Input */}
          <div className="relative hidden sm:block w-48 md:w-64 ml-1">
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
        </div>

        {/* Mobile Search Input (full width, shown when toggled) */}
        {showMobileSearch && (
          <div className="relative w-full sm:hidden mt-1 mb-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              className="input input-bordered input-sm w-full pl-9 bg-base-200/50 focus:bg-base-100 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
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
        )}
      </div>
    </div>
  );
};

export default NoteFilters;
