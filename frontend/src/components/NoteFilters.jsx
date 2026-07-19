import {
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  XIcon,
} from "lucide-react";

const NoteFilters = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  statuses = [],
  totalNotes = 0,
  filteredCount = 0,
}) => {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedStatus !== "" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  const handleReset = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="bg-base-100 rounded-xl p-4 shadow-sm border border-base-content/10 mb-6 space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Buscar tareas por título o contenido..."
            className="input input-bordered w-full pl-10 pr-10 bg-base-200/50 focus:bg-base-100 transition-colors text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
              onClick={() => setSearchQuery("")}
              title="Limpiar búsqueda"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wider flex-shrink-0">
            <FilterIcon className="size-3.5" />
            <span>Estado:</span>
          </div>
          <select
            className="select select-bordered select-sm bg-base-200/50 min-w-[150px]"
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
      </div>

      {/* Second row: Sorting and active status info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-base-content/10 text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            <ArrowUpDownIcon className="size-3.5" />
            <span>Ordenar por:</span>
          </span>
          <select
            className="select select-bordered select-sm bg-base-200/50"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Fecha de creación</option>
            <option value="title">Título (A-Z)</option>
            <option value="status">Estado</option>
            <option value="content">Contenido</option>
          </select>

          <button
            type="button"
            className="btn btn-outline btn-sm gap-1.5 px-3"
            onClick={toggleSortOrder}
            title={sortOrder === "asc" ? "Ascendente (A→Z, Antiguos primero)" : "Descendiente (Z→A, Recientes primero)"}
          >
            <span>{sortOrder === "asc" ? "Ascendente ↑" : "Descendente ↓"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <span className="text-xs text-base-content/60">
            Mostrando <strong className="text-base-content">{filteredCount}</strong> de{" "}
            <strong className="text-base-content">{totalNotes}</strong> tareas
          </span>

          {isFiltered && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
              onClick={handleReset}
            >
              <XIcon className="size-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteFilters;
