import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../lib/axios";
import { getFileUrl, formatFileSize, formatDuration } from "../../lib/fileUtils";
import {
  HardDriveIcon,
  Trash2Icon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  SearchIcon,
  ArrowUpDownIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  EyeIcon,
  SparklesIcon,
  FolderArchiveIcon,
  ClockIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router";

// Ring/donut chart SVG helper component
function StorageDonutChart({ breakdown, totalBytes }) {
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const imagesBytes = breakdown?.images?.bytes || 0;
  const pdfsBytes = breakdown?.pdfs?.bytes || 0;
  const videosBytes = breakdown?.videos?.bytes || 0;
  const sumBytes = imagesBytes + pdfsBytes + videosBytes;

  if (totalBytes === 0 || sumBytes === 0) {
    return (
      <div className="relative flex items-center justify-center w-[140px] h-[140px]">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-base-300 opacity-40"
          />
        </svg>
        <span className="absolute text-xs text-base-content/60 font-medium">0 Archivos</span>
      </div>
    );
  }

  // Calculate segment lengths
  const imgDash = (imagesBytes / sumBytes) * circumference;
  const pdfDash = (pdfsBytes / sumBytes) * circumference;
  const videoDash = (videosBytes / sumBytes) * circumference;

  const pdfOffset = -imgDash;
  const videoOffset = -(imgDash + pdfDash);

  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px]">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-base-300 opacity-30"
        />
        {/* Images: Sky blue */}
        {imgDash > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${imgDash} ${circumference}`}
            strokeDashoffset="0"
            className="transition-all duration-700 ease-out"
          />
        )}
        {/* PDFs: Orange/Amber */}
        {pdfDash > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeDasharray={`${pdfDash} ${circumference}`}
            strokeDashoffset={pdfOffset}
            className="transition-all duration-700 ease-out"
          />
        )}
        {/* Videos: Violet/Purple */}
        {videoDash > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#8B5CF6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${videoDash} ${circumference}`}
            strokeDashoffset={videoOffset}
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xs text-base-content/60 font-medium">Archivos</span>
        <span className="text-sm font-bold text-base-content">
          {(breakdown?.images?.count || 0) +
            (breakdown?.pdfs?.count || 0) +
            (breakdown?.videos?.count || 0)}
        </span>
      </div>
    </div>
  );
}

export default function StorageManagementView() {
  // Stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Files state
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Filters state
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'image' | 'pdf' | 'video'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'archived' | 'deleted'
  const [sortOrder, setSortOrder] = useState("size_desc"); // 'size_desc' | 'size_asc' | 'date_asc' | 'date_desc'
  const [searchQuery, setSearchQuery] = useState("");

  // Action modals
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [purgingOrphans, setPurgingOrphans] = useState(false);

  // Fetch stats from backend (Section 6.A real disk scan)
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await api.get("/storage/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error al obtener estadísticas de almacenamiento:", err);
      toast.error("No se pudo cargar el estado del almacenamiento.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch files with current filters
  const fetchFiles = useCallback(async (page = 1) => {
    try {
      setLoadingFiles(true);
      const params = new URLSearchParams({
        type: typeFilter,
        status: statusFilter,
        sort: sortOrder,
        page: page.toString(),
        limit: "50",
      });
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await api.get(`/storage/files?${params.toString()}`);
      setFiles(res.data.files || []);
      setPagination(
        res.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 }
      );
    } catch (err) {
      console.error("Error al obtener lista de archivos:", err);
      toast.error("Error al cargar la lista de archivos.");
    } finally {
      setLoadingFiles(false);
    }
  }, [typeFilter, statusFilter, sortOrder, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFiles(1);
  }, [fetchFiles]);

  // Handle single file deletion
  const handleDeleteFile = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      await api.delete(`/storage/files/${deleteCandidate._id}`);
      toast.success("Archivo eliminado correctamente");
      setDeleteCandidate(null);
      // Refresh both stats and list
      fetchStats();
      fetchFiles(pagination.page);
    } catch (err) {
      console.error("Error al eliminar archivo:", err);
      toast.error(err.response?.data?.message || "No se pudo eliminar el archivo");
    } finally {
      setDeleting(false);
    }
  };

  // Handle bulk orphan cleanup
  const handleBulkPurge = async () => {
    try {
      setPurgingOrphans(true);
      const res = await api.delete("/storage/files/bulk-orphans");
      toast.success(
        `Limpieza completada: ${res.data.deletedCount} archivo(s) huérfano(s) eliminados (${res.data.freedFormatted} liberados).`
      );
      setShowBulkModal(false);
      fetchStats();
      fetchFiles(1);
    } catch (err) {
      console.error("Error al vaciar huérfanos:", err);
      toast.error(err.response?.data?.message || "Error al vaciar archivos huérfanos.");
    } finally {
      setPurgingOrphans(false);
    }
  };

  // Progress Bar styling and color tier
  const usagePercentage = stats?.usagePercentage || 0;

  const progressBarBgClass = useMemo(() => {
    if (usagePercentage >= 90) return "bg-rose-500";
    if (usagePercentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  }, [usagePercentage]);

  const orphanCount = stats?.counts?.orphans || 0;

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-content/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <HardDriveIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-base-content">
                Gestión de Almacenamiento y Archivos
              </h2>
              <p className="text-sm text-base-content/70">
                Auditoría en tiempo real del disco (límite de 100 GB), ciclo de vida de archivos y recolección de basura.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2"
            onClick={() => {
              fetchStats();
              fetchFiles(pagination.page);
            }}
            disabled={loadingStats || loadingFiles}
            title="Recargar métricas y archivos"
          >
            <RefreshCwIcon
              className={`w-4 h-4 ${loadingStats || loadingFiles ? "animate-spin text-primary" : ""}`}
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── Section A: Panel de Métricas (Storage Progress) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Progress Card (2 cols on large screen) */}
        <div className="lg:col-span-2 card bg-base-100 border border-base-content/10 shadow-sm overflow-hidden">
          <div className="card-body p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                  Consumo del Servidor
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight text-base-content">
                    {stats?.totalFormatted || "0 B"}
                  </span>
                  <span className="text-sm text-base-content/60 font-medium">
                    de {stats?.limitFormatted || "100 GB"} utilizados
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`badge font-semibold text-xs py-3 px-3 rounded-lg border ${
                    usagePercentage >= 90
                      ? "badge-error"
                      : usagePercentage >= 70
                      ? "badge-warning"
                      : "badge-success"
                  }`}
                >
                  {usagePercentage}% del disco
                </span>
                <span className="badge badge-outline text-xs py-3 px-3 rounded-lg text-base-content/70">
                  Libre: {stats?.freeFormatted || "100 GB"}
                </span>
              </div>
            </div>

            {/* Custom Dynamic Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-base-300 h-4 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarBgClass}`}
                  style={{ width: `${Math.min(100, Math.max(1, usagePercentage))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-base-content/60 px-0.5">
                <span>0 GB</span>
                <span className="text-emerald-500 font-medium">Zona Segura &lt;70%</span>
                <span className="text-amber-500 font-medium">Alerta 70%-90%</span>
                <span className="text-rose-500 font-medium">Crítico &gt;90%</span>
                <span>100 GB</span>
              </div>
            </div>

            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-base-content/10">
              <div className="p-3 bg-base-200/50 rounded-xl">
                <div className="text-xs text-base-content/60 flex items-center gap-1.5">
                  <FolderArchiveIcon className="w-3.5 h-3.5" />
                  <span>Total BD</span>
                </div>
                <div className="text-lg font-bold mt-1 text-base-content">
                  {stats?.counts?.total || 0}
                </div>
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2Icon className="w-3.5 h-3.5" />
                  <span>Activos</span>
                </div>
                <div className="text-lg font-bold mt-1 text-base-content">
                  {stats?.counts?.active || 0}
                </div>
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl">
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>Archivados</span>
                </div>
                <div className="text-lg font-bold mt-1 text-base-content">
                  {stats?.counts?.archived || 0}
                </div>
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl">
                <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangleIcon className="w-3.5 h-3.5" />
                  <span>Huérfanos</span>
                </div>
                <div className="text-lg font-bold mt-1 text-base-content flex items-center gap-2">
                  <span>{orphanCount}</span>
                  {orphanCount > 0 && (
                    <span className="badge badge-error badge-xs animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Donut & Legend Card */}
        <div className="card bg-base-100 border border-base-content/10 shadow-sm">
          <div className="card-body p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-base-content/70">
                Distribución por Tipo
              </h3>
              <span className="text-xs text-base-content/50">Físico en disco</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              {/* Donut Chart */}
              <StorageDonutChart
                breakdown={stats?.breakdown}
                totalBytes={stats?.totalBytes || 0}
              />

              {/* Legend with percentages */}
              <div className="flex-1 space-y-2.5 w-full">
                {/* Videos */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                    <span className="font-medium text-base-content flex items-center gap-1">
                      <VideoIcon className="w-3.5 h-3.5 text-violet-500" />
                      Videos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-base-content">
                      {stats?.breakdown?.videos?.percentage || 0}%
                    </span>
                    <span className="text-base-content/50 ml-1.5">
                      ({stats?.breakdown?.videos?.formatted || "0 B"})
                    </span>
                  </div>
                </div>

                {/* PDFs */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-medium text-base-content flex items-center gap-1">
                      <FileTextIcon className="w-3.5 h-3.5 text-amber-500" />
                      PDFs
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-base-content">
                      {stats?.breakdown?.pdfs?.percentage || 0}%
                    </span>
                    <span className="text-base-content/50 ml-1.5">
                      ({stats?.breakdown?.pdfs?.formatted || "0 B"})
                    </span>
                  </div>
                </div>

                {/* Images */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-medium text-base-content flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      Imágenes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-base-content">
                      {stats?.breakdown?.images?.percentage || 0}%
                    </span>
                    <span className="text-base-content/50 ml-1.5">
                      ({stats?.breakdown?.images?.formatted || "0 B"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-base-content/10 text-[11px] text-base-content/60 flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Cron Job automático: diario a las 03:00 AM (gracia de 30 días).</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: Barra de Filtros y Acciones ────────────────────────── */}
      <div className="card bg-base-100 border border-base-content/10 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left filters: Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[260px] flex-1">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                placeholder="Buscar por nombre, ID o tarea..."
                className="input input-sm input-bordered w-full pl-9 pr-3 text-sm focus:outline-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => setSearchQuery("")}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-base-200/80 p-1 rounded-lg">
              {[
                { id: "all", label: "Todos", icon: null },
                { id: "image", label: "Imágenes", icon: ImageIcon },
                { id: "pdf", label: "PDFs", icon: FileTextIcon },
                { id: "video", label: "Videos", icon: VideoIcon },
              ].map((t) => {
                const IconComponent = t.icon;
                const active = typeFilter === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-xs rounded-md transition-all ${
                      active
                        ? "btn-primary text-primary-content shadow-sm"
                        : "btn-ghost text-base-content/70 hover:bg-base-300"
                    }`}
                    onClick={() => setTypeFilter(t.id)}
                  >
                    {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter by Parent Task Status */}
            <select
              className="select select-sm select-bordered text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Estado: Todos</option>
              <option value="active">🟢 Tarea Activa</option>
              <option value="archived">🟡 Tarea Archivada (Candidato)</option>
              <option value="deleted">🔴 Tarea Borrada (Huérfano)</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDownIcon className="w-3.5 h-3.5 text-base-content/50" />
              <select
                className="select select-sm select-bordered text-xs"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="size_desc">Tamaño: Mayor a Menor</option>
                <option value="size_asc">Tamaño: Menor a Mayor</option>
                <option value="date_desc">Fecha: Más recientes</option>
                <option value="date_asc">Fecha: Más antiguos</option>
              </select>
            </div>
          </div>

          {/* Right Action: Bulk Purge Orphans */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm gap-2 font-semibold transition-all ${
                orphanCount > 0
                  ? "btn-error text-white shadow-sm hover:brightness-110"
                  : "btn-disabled bg-base-200 text-base-content/40 border-transparent cursor-not-allowed"
              }`}
              onClick={() => setShowBulkModal(true)}
              disabled={orphanCount === 0}
              title={
                orphanCount === 0
                  ? "No se han detectado archivos huérfanos"
                  : `Eliminar los ${orphanCount} archivos huérfanos del disco`
              }
            >
              <Trash2Icon className="w-4 h-4" />
              <span>Vaciar archivos huérfanos</span>
              {orphanCount > 0 && (
                <span className="badge badge-sm bg-white text-error font-bold">
                  {orphanCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section C: Tabla de Archivos (Data Table) ────────────────────── */}
      <div className="card bg-base-100 border border-base-content/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm sm:table-md w-full">
            <thead className="bg-base-200/60 text-base-content/70 text-xs uppercase tracking-wider">
              <tr>
                <th className="w-16">Vista Previa</th>
                <th>Nombre Original</th>
                <th>Peso</th>
                <th>Tipo</th>
                <th>Tarea Asociada</th>
                <th>Propietario</th>
                <th>Fecha de Subida</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-content/5">
              {loadingFiles ? (
                // Skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td>
                      <div className="w-10 h-10 bg-base-300 rounded-lg" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-300 rounded w-48 mb-1" />
                      <div className="h-3 bg-base-300 rounded w-24" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-300 rounded w-16" />
                    </td>
                    <td>
                      <div className="h-5 bg-base-300 rounded w-16" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-300 rounded w-32" />
                    </td>
                    <td>
                      <div className="h-6 bg-base-300 rounded-full w-20" />
                    </td>
                    <td>
                      <div className="h-4 bg-base-300 rounded w-24" />
                    </td>
                    <td className="text-right">
                      <div className="h-8 bg-base-300 rounded w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="p-3 bg-base-200 rounded-full text-base-content/50">
                        <FolderArchiveIcon className="w-8 h-8" />
                      </div>
                      <p className="font-semibold text-base-content">
                        No se encontraron archivos
                      </p>
                      <p className="text-xs text-base-content/60">
                        No hay archivos que coincidan con los filtros seleccionados o el criterio de búsqueda.
                      </p>
                      {(typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline mt-2"
                          onClick={() => {
                            setTypeFilter("all");
                            setStatusFilter("all");
                            setSearchQuery("");
                          }}
                        >
                          Restablecer filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                files.map((file) => {
                  const isVid = file.fileType === "video";
                  const isPdfFile = file.fileType === "pdf";
                  const isImg = file.fileType === "image";

                  return (
                    <tr
                      key={`${file.fileModel}-${file._id}`}
                      className="hover:bg-base-200/40 transition-colors"
                    >
                      {/* Vista Previa Thumbnail */}
                      <td>
                        <div
                          className="w-11 h-11 rounded-lg border border-base-content/10 bg-base-200 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-xs"
                          onClick={() => setPreviewItem(file)}
                          title="Click para vista previa"
                        >
                          {isImg ? (
                            <img
                              src={getFileUrl(file.fileUrl)}
                              alt={file.originalName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : isPdfFile ? (
                            <div className="flex flex-col items-center justify-center text-amber-500">
                              <FileTextIcon className="w-5 h-5" />
                              <span className="text-[9px] font-bold">PDF</span>
                            </div>
                          ) : isVid ? (
                            <div className="flex flex-col items-center justify-center text-violet-500">
                              <VideoIcon className="w-5 h-5" />
                              <span className="text-[9px] font-bold">
                                {file.durationSeconds
                                  ? formatDuration(file.durationSeconds)
                                  : "VIDEO"}
                              </span>
                            </div>
                          ) : (
                            <FolderArchiveIcon className="w-5 h-5 text-base-content/40" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <EyeIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </td>

                      {/* Nombre Original */}
                      <td>
                        <div className="max-w-[240px] truncate">
                          <button
                            type="button"
                            className="font-medium text-sm text-base-content hover:text-primary transition-colors text-left truncate block w-full"
                            onClick={() => setPreviewItem(file)}
                            title={file.originalName}
                          >
                            {file.originalName}
                          </button>
                          <span className="text-[11px] text-base-content/50 block truncate">
                            {file.mimeType}
                          </span>
                        </div>
                      </td>

                      {/* Peso */}
                      <td>
                        <span className="font-mono text-xs font-semibold text-base-content">
                          {file.sizeFormatted || formatFileSize(file.size)}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td>
                        {isImg ? (
                          <span className="badge badge-sm badge-info badge-outline gap-1 font-medium">
                            <ImageIcon className="w-3 h-3" /> Imagen
                          </span>
                        ) : isPdfFile ? (
                          <span className="badge badge-sm badge-warning badge-outline gap-1 font-medium">
                            <FileTextIcon className="w-3 h-3" /> PDF
                          </span>
                        ) : isVid ? (
                          <span className="badge badge-sm badge-secondary badge-outline gap-1 font-medium">
                            <VideoIcon className="w-3 h-3" /> Video
                          </span>
                        ) : (
                          <span className="badge badge-sm badge-ghost gap-1">
                            Otro
                          </span>
                        )}
                      </td>

                      {/* Tarea Asociada */}
                      <td>
                        {file.task ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/note/${file.task._id}`}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 truncate max-w-[180px]"
                                title={file.task.title}
                              >
                                {file.task.keyId && (
                                  <span className="font-mono text-[10px] text-base-content/60">
                                    [{file.task.keyId}]
                                  </span>
                                )}
                                <span className="truncate">{file.task.title}</span>
                                <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                              </Link>
                            </div>
                            <div>
                              {file.parentStatus === "archived" ? (
                                <span className="badge badge-xs badge-warning font-medium">
                                  Archivada (Candidato)
                                </span>
                              ) : (
                                <span className="badge badge-xs badge-success font-medium">
                                  Activa
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="badge badge-sm badge-error text-white font-medium gap-1">
                            <AlertTriangleIcon className="w-3 h-3" />
                            Huérfano (Borrada)
                          </span>
                        )}
                      </td>

                      {/* Propietario */}
                      <td>
                        {file.user ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
                              style={{ backgroundColor: file.user.color || "#3B82F6" }}
                            >
                              {(file.user.name || "U")[0].toUpperCase()}
                            </div>
                            <span className="text-xs truncate max-w-[110px]" title={file.user.name}>
                              {file.user.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-base-content/50 italic">
                            Desconocido
                          </span>
                        )}
                      </td>

                      {/* Fecha de Subida */}
                      <td>
                        <span className="text-xs text-base-content/70 whitespace-nowrap">
                          {file.createdAt
                            ? new Date(file.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary"
                            onClick={() => setPreviewItem(file)}
                            title="Ver vista previa"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-error"
                            onClick={() => setDeleteCandidate(file)}
                            title="Eliminar archivo del servidor"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count footer */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-base-content/10 gap-3 text-xs text-base-content/70">
            <div>
              Mostrando{" "}
              <span className="font-semibold text-base-content">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-base-content">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-base-content">
                {pagination.total}
              </span>{" "}
              archivos
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                disabled={pagination.page <= 1 || loadingFiles}
                onClick={() => fetchFiles(pagination.page - 1)}
              >
                Anterior
              </button>
              <span className="px-2 font-medium">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                disabled={pagination.page >= pagination.totalPages || loadingFiles}
                onClick={() => fetchFiles(pagination.page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Vista Previa Lightbox / Player ────────────────────────── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="card bg-base-100 max-w-3xl w-full max-h-[90vh] shadow-2xl border border-base-content/10 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-content/10 bg-base-200/50">
              <div className="flex items-center gap-2 truncate pr-2">
                {previewItem.fileType === "image" && (
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                )}
                {previewItem.fileType === "pdf" && (
                  <FileTextIcon className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                {previewItem.fileType === "video" && (
                  <VideoIcon className="w-4 h-4 text-violet-500 shrink-0" />
                )}
                <span className="font-semibold text-sm truncate" title={previewItem.originalName}>
                  {previewItem.originalName}
                </span>
                <span className="text-xs text-base-content/60 font-mono">
                  ({previewItem.sizeFormatted})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost btn-circle"
                onClick={() => setPreviewItem(null)}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-base-300/30">
              {previewItem.fileType === "image" && (
                <img
                  src={getFileUrl(previewItem.fileUrl)}
                  alt={previewItem.originalName}
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
                />
              )}

              {previewItem.fileType === "pdf" && (
                <div className="w-full h-[65vh] flex flex-col items-center justify-center space-y-4">
                  <FileTextIcon className="w-16 h-16 text-amber-500" />
                  <p className="text-sm font-medium text-base-content">
                    Documento PDF adjunto
                  </p>
                  <a
                    href={getFileUrl(previewItem.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                    Abrir PDF en pestaña nueva
                  </a>
                </div>
              )}

              {previewItem.fileType === "video" && (
                <div className="w-full flex items-center justify-center">
                  <video
                    src={getFileUrl(previewItem.fileUrl)}
                    controls
                    autoPlay
                    className="max-h-[65vh] w-full rounded-lg bg-black shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-base-200/50 border-t border-base-content/10 flex items-center justify-between text-xs text-base-content/70">
              <div>
                Subido el:{" "}
                <span className="font-medium text-base-content">
                  {new Date(previewItem.createdAt).toLocaleString("es-ES")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getFileUrl(previewItem.fileUrl)}
                  download={previewItem.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs btn-outline gap-1"
                >
                  <ExternalLinkIcon className="w-3 h-3" />
                  Descargar
                </a>
                <button
                  type="button"
                  className="btn btn-xs btn-error text-white gap-1"
                  onClick={() => {
                    setDeleteCandidate(previewItem);
                    setPreviewItem(null);
                  }}
                >
                  <Trash2Icon className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Single File Deletion ──────────────────────────── */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => !deleting && setDeleteCandidate(null)}
        >
          <div
            className="card bg-base-100 max-w-md w-full shadow-2xl border border-error/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-6 space-y-4">
              <div className="flex items-center gap-3 text-error">
                <div className="p-2.5 rounded-full bg-error/10">
                  <AlertTriangleIcon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-base-content">
                  ¿Eliminar archivo permanentemente?
                </h3>
              </div>

              <p className="text-sm text-base-content/80 leading-relaxed">
                Estás a punto de borrar el archivo{" "}
                <span className="font-semibold text-base-content break-all">
                  "{deleteCandidate.originalName}"
                </span>{" "}
                ({deleteCandidate.sizeFormatted}).
              </p>

              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-medium space-y-1">
                <p>• Se borrará el archivo físico del disco del servidor.</p>
                <p>• Se eliminarán las marcas y subtareas visuales asociadas.</p>
                <p>• Esta acción es inmediata y no se puede deshacer.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setDeleteCandidate(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-error text-white gap-2"
                  onClick={handleDeleteFile}
                  disabled={deleting}
                >
                  {deleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2Icon className="w-4 h-4" />
                  )}
                  <span>Eliminar del Servidor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Bulk Orphan Purge ─────────────────────────────── */}
      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => !purgingOrphans && setShowBulkModal(false)}
        >
          <div
            className="card bg-base-100 max-w-lg w-full shadow-2xl border-2 border-error/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-6 space-y-4">
              <div className="flex items-center gap-3 text-error">
                <div className="p-3 rounded-xl bg-error/10">
                  <Trash2Icon className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    Vaciar Archivos Huérfanos
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Recolección masiva de basura del servidor
                  </p>
                </div>
              </div>

              <p className="text-sm text-base-content/80 leading-relaxed">
                Se han detectado{" "}
                <span className="font-bold text-error">
                  {orphanCount} archivo(s) huérfano(s)
                </span>{" "}
                cuyas tareas asociadas han sido eliminadas.
              </p>

              <div className="p-3.5 bg-base-200 rounded-xl space-y-2 text-xs text-base-content/80">
                <div className="font-semibold text-base-content flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-warning" />
                  ¿Qué sucederá al confirmar?
                </div>
                <ul className="list-disc list-inside space-y-1 text-base-content/70">
                  <li>Se borrarán los archivos físicos de la carpeta de uploads.</li>
                  <li>Se purgarán los registros huérfanos de la base de datos.</li>
                  <li>Se liberará inmediatamente espacio en disco para el límite de 100 GB.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowBulkModal(false)}
                  disabled={purgingOrphans}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-error text-white gap-2"
                  onClick={handleBulkPurge}
                  disabled={purgingOrphans}
                >
                  {purgingOrphans ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Trash2Icon className="w-4 h-4" />
                  )}
                  <span>Confirmar y Vaciar {orphanCount} Huérfanos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
