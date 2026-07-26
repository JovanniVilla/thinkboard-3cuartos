import {
  SearchIcon,
  XIcon,
  ListIcon,
  Columns3Icon,
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
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  statuses = [],
  priorities = [],
  users = [],
  totalNotes = 0,
}) => {
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    // Always sort by date when using this toggle to match the button text
    if (sortBy !== "createdAt") setSortBy("createdAt");
  };

  return (
    <div className="bg-base-100 rounded-xl p-3 shadow-sm border border-base-content/10 mb-6 w-full overflow-x-auto">
      <div className="flex items-center gap-3 min-w-max">
        
        {/* Title and Count */}
        <div className="flex items-center gap-2 pl-2">
          <h2 className="font-bold text-lg text-base-content">Mis Tareas</h2>
          <span className="badge badge-primary badge-sm font-semibold">{totalNotes} total</span>
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
            <span>Lista</span>
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
            <span>Tablero</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-48 lg:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            className="input input-bordered input-sm w-full pl-9 bg-base-200/50"
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

        {/* Selects */}
        <select
          className="select select-bordered select-sm bg-base-200/50 font-normal w-auto"
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

        <select
          className="select select-bordered select-sm bg-base-200/50 font-normal w-auto"
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

        <select
          className="select select-bordered select-sm bg-base-200/50 font-normal w-auto"
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

        {/* Sort Button */}
        <button
          type="button"
          onClick={toggleSortOrder}
          className="btn btn-outline btn-sm font-normal bg-base-200/50 border-base-content/20 hover:bg-base-200"
        >
          Ordenar: Fecha {sortOrder === "asc" ? "↑" : "↓"}
        </button>

      </div>
    </div>
  );
};

export default NoteFilters;
