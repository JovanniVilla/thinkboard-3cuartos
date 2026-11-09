import { useMemo } from "react";
import { SearchIcon, XIcon, LayersIcon } from "lucide-react";

const ProjectFilters = ({
  projectTypes = [],
  projects = [],
  selectedType = "all",
  onSelectType,
  searchQuery = "",
  onSearchChange,
  totalProjects = 0,
  filteredCount = 0,
}) => {
  // Compute available types with their colors and project counts
  const availableTypes = useMemo(() => {
    const typeMap = new Map();

    // 1. Configured types from backend
    (projectTypes || []).forEach((pt) => {
      if (pt.name) {
        const cleanName = pt.name.trim();
        typeMap.set(cleanName.toLowerCase(), {
          name: cleanName,
          color: pt.color || "#3B82F6",
          count: 0,
        });
      }
    });

    // 2. Types from existing projects that might not be in config (e.g. "General")
    (projects || []).forEach((p) => {
      const cleanName = (p.projectType || "General").trim();
      const lower = cleanName.toLowerCase();
      if (!typeMap.has(lower)) {
        typeMap.set(lower, {
          name: cleanName,
          color: "#6B7280",
          count: 0,
        });
      }
    });

    // 3. Count matching projects for each type
    (projects || []).forEach((p) => {
      const cleanName = (p.projectType || "General").trim();
      const lower = cleanName.toLowerCase();
      if (typeMap.has(lower)) {
        typeMap.get(lower).count += 1;
      }
    });

    return Array.from(typeMap.values());
  }, [projectTypes, projects]);

  const currentTypeObj = useMemo(() => {
    if (!selectedType || selectedType === "all") return null;
    return (
      availableTypes.find(
        (t) => t.name.toLowerCase() === selectedType.toLowerCase()
      ) || null
    );
  }, [availableTypes, selectedType]);

  const hasActiveFilter =
    (selectedType && selectedType !== "all") || Boolean(searchQuery.trim());

  const handleClearFilters = () => {
    onSelectType("all");
    if (onSearchChange) onSearchChange("");
  };

  const handleTypeClick = (typeName) => {
    if (selectedType.toLowerCase() === typeName.toLowerCase()) {
      onSelectType("all");
    } else {
      onSelectType(typeName);
    }
  };

  return (
    <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-sm p-3 sm:p-4 mb-6">
      {/* ─────────────────────────────────────────────────────────────
          1. Mobile View (< sm): Dropdown Selector instead of lateral scroll
         ───────────────────────────────────────────────────────────── */}
      <div className="sm:hidden flex flex-col gap-2.5 w-full">
        {/* Dropdown for Project Type */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {currentTypeObj ? (
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none z-10"
                style={{ backgroundColor: currentTypeObj.color || "#3B82F6" }}
              />
            ) : (
              <LayersIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary pointer-events-none z-10" />
            )}
            <select
              className="select select-sm h-10 min-h-[40px] select-bordered w-full text-xs font-semibold rounded-xl pl-9 pr-8 focus:outline-primary bg-base-100"
              value={selectedType}
              onChange={(e) => onSelectType(e.target.value)}
            >
              <option value="all">Todos los tipos ({totalProjects})</option>
              {availableTypes.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.name} ({type.count})
                </option>
              ))}
            </select>
          </div>

          {selectedType !== "all" && (
            <button
              type="button"
              onClick={() => onSelectType("all")}
              className="btn btn-sm h-10 min-h-[40px] btn-ghost text-xs text-base-content/60 hover:text-error px-2.5 rounded-xl shrink-0 border border-base-content/10"
              title="Quitar filtro de tipo"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Search Input on mobile */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input input-sm h-10 min-h-[40px] input-bordered w-full pl-8 pr-7 text-xs rounded-xl focus:outline-primary bg-base-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                title="Limpiar búsqueda"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-sm h-10 min-h-[40px] btn-ghost text-xs text-base-content/60 hover:text-error gap-1 px-2.5 font-normal rounded-xl shrink-0"
              title="Limpiar todos los filtros"
            >
              <XIcon className="size-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Active filter summary info on mobile */}
        {hasActiveFilter && (
          <div className="flex items-center justify-between text-[11px] font-medium text-base-content/60 px-1 pt-0.5">
            <span>
              Mostrando <strong className="text-base-content">{filteredCount}</strong> de{" "}
              <strong className="text-base-content">{totalProjects}</strong> proyectos
            </span>
            {selectedType !== "all" && (
              <span className="badge badge-primary badge-xs py-2 px-2 font-semibold truncate max-w-[150px]">
                {selectedType}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Desktop / Tablet View (>= sm): Pills + Search Row
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Filter by Project Type (Pills) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-base-content/60 uppercase tracking-wide shrink-0 mr-1 select-none">
            <LayersIcon className="size-4 text-primary" />
            <span>Tipo de Proyecto:</span>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0 flex-1">
            {/* "Todos" Pill */}
            <button
              type="button"
              onClick={() => onSelectType("all")}
              className={`btn btn-sm h-8 min-h-[32px] rounded-xl transition-all whitespace-nowrap font-medium text-xs gap-1.5 shrink-0 px-3 ${
                selectedType === "all"
                  ? "btn-primary text-primary-content shadow-sm"
                  : "bg-base-200/60 hover:bg-base-200 text-base-content/70 border border-base-content/5"
              }`}
            >
              <span>Todos</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedType === "all"
                    ? "bg-white/25 text-white"
                    : "bg-base-content/10 text-base-content/60"
                }`}
              >
                {totalProjects}
              </span>
            </button>

            {/* Individual Project Types */}
            {availableTypes.map((type) => {
              const isSelected =
                selectedType.toLowerCase() === type.name.toLowerCase();
              return (
                <button
                  key={type.name}
                  type="button"
                  onClick={() => handleTypeClick(type.name)}
                  className={`btn btn-sm h-8 min-h-[32px] rounded-xl transition-all whitespace-nowrap font-medium text-xs gap-1.5 shrink-0 px-3 ${
                    isSelected
                      ? "btn-primary text-primary-content shadow-sm"
                      : "bg-base-200/60 hover:bg-base-200 text-base-content/70 border border-base-content/5"
                  }`}
                  title={`Filtrar por ${type.name} (${type.count} proyectos)`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                      isSelected ? "bg-white" : ""
                    }`}
                    style={isSelected ? {} : { backgroundColor: type.color }}
                  />
                  <span>{type.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-base-content/10 text-base-content/60"
                    }`}
                  >
                    {type.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Search & Filter Summary/Clear */}
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-base-content/5 justify-end">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-base-content/40" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input input-sm h-8 min-h-[32px] input-bordered w-full pl-8 pr-7 text-xs rounded-xl focus:outline-primary bg-base-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                title="Limpiar búsqueda"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>

          {/* Filter count badge & Clear */}
          {hasActiveFilter && (
            <div className="flex items-center gap-1.5">
              <span className="badge badge-sm badge-ghost text-[11px] font-medium text-base-content/70 py-2.5">
                {filteredCount} de {totalProjects}
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-sm h-8 min-h-[32px] btn-ghost text-xs text-base-content/60 hover:text-error gap-1 px-2 font-normal rounded-xl"
                title="Limpiar todos los filtros"
              >
                <XIcon className="size-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;
