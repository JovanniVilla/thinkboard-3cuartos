import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../lib/axios";
import MediaViewer from "./MediaViewer";
import PinLayer from "./PinLayer";
import SubtaskModal from "./SubtaskModal";
import { formatFileSize, isPdf as checkIsPdf } from "../../lib/fileUtils";
import {
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlayIcon,
  PlusIcon,
  ListOrderedIcon,
  XIcon,
  UserIcon,
  FileTextIcon,
  ImageIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AnnotationCanvas({
  file,
  parentTaskId,
  accounts = [],
  initialSubtaskId = null,
  initialPage = 1,
  onClose,
}) {
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [numPages, setNumPages] = useState(1);
  const [isPinMode, setIsPinMode] = useState(false);
  const [activeSubtaskId, setActiveSubtaskId] = useState(initialSubtaskId);
  const [pendingPin, setPendingPin] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("details"); // 'details' | 'comments'
  const [subtaskToEdit, setSubtaskToEdit] = useState(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [showSidebar, setShowSidebar] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const canvasWrapperRef = useRef(null);
  const modalRef = useRef(null);

  const isPdf = checkIsPdf(file?.mimeType, file?.originalName);

  // Fetch pins/subtasks for this file
  const fetchSubtasks = useCallback(async () => {
    if (!file?._id) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/files/${file._id}/subtasks`);
      setSubtasks(res.data || []);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      toast.error("Error al cargar los marcadores del archivo.");
    } finally {
      setIsLoading(false);
    }
  }, [file?._id]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Bloqueo estricto del scroll de fondo mientras la ventana flotante de anotaciones esté abierta
  useEffect(() => {
    if (!file) return;

    // 1. Guardar estilos originales de body y html
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";

    // 2. Bloquear cualquier contenedor con scroll en la vista subyacente (ej: NoteDetailPage o Kanban)
    const scrollContainers = Array.from(
      document.querySelectorAll(".overflow-y-auto, .overflow-auto")
    );
    const savedStyles = scrollContainers.map((node) => ({
      node,
      overflow: node.style.overflow,
      overflowY: node.style.overflowY,
    }));

    savedStyles.forEach(({ node }) => {
      if (node && (!modalRef.current || !modalRef.current.contains(node))) {
        node.style.overflow = "hidden";
        node.style.overflowY = "hidden";
      }
    });

    // 3. Interceptar eventos de rueda de ratón y táctiles para evitar propagación al fondo
    const preventScrollPropagation = (e) => {
      let node = e.target;
      let canScrollInside = false;

      while (node && node !== modalRef.current) {
        if (
          node.scrollHeight > node.clientHeight &&
          window.getComputedStyle(node).overflowY.match(/(auto|scroll)/)
        ) {
          const isDown = e.deltaY > 0;
          const atBottom =
            node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
          const atTop = node.scrollTop <= 0;
          if ((isDown && !atBottom) || (!isDown && !atTop)) {
            canScrollInside = true;
            break;
          }
        }
        node = node.parentElement;
      }

      if (!canScrollInside) {
        e.preventDefault();
      }
    };

    // 4. Control por teclado: ESC cierra el subtask modal o la ventana flotante
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (modalOpen) {
          setModalOpen(false);
          setPendingPin(null);
        } else if (onClose) {
          e.preventDefault();
          onClose();
        }
      }
    };

    window.addEventListener("wheel", preventScrollPropagation, {
      passive: false,
    });
    window.addEventListener("touchmove", preventScrollPropagation, {
      passive: false,
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;

      savedStyles.forEach(({ node, overflow, overflowY }) => {
        if (node) {
          node.style.overflow = overflow;
          node.style.overflowY = overflowY;
        }
      });

      window.removeEventListener("wheel", preventScrollPropagation);
      window.removeEventListener("touchmove", preventScrollPropagation);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [file, onClose, modalOpen]);

  // Track container width for responsive PDF rendering
  useEffect(() => {
    const updateWidth = () => {
      if (canvasWrapperRef.current) {
        setContainerWidth(canvasWrapperRef.current.clientWidth - 40);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [showSidebar]);

  // Handle PDF document load
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages || 1);
  };

  // Canvas click handler for placing new pins
  const handleCanvasClick = (e) => {
    if (!isPinMode) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Responsive percentage calculation:
    // xPercent = ((clientX - rect.left) / rect.width) * 100
    // yPercent = ((clientY - rect.top) / rect.height) * 100
    const xPercent = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const yPercent = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
    );

    const newMarker = {
      fileId: file._id,
      pageNumber: isPdf ? currentPage : 1,
      xPercent: Number(xPercent.toFixed(2)),
      yPercent: Number(yPercent.toFixed(2)),
    };

    setPendingPin(newMarker);
    setSubtaskToEdit(null);
    setModalInitialTab("details");
    setModalOpen(true);
  };

  const handleSelectPin = (subtask) => {
    setActiveSubtaskId(subtask._id);
    setSubtaskToEdit(subtask);
    setPendingPin(null);
    setModalInitialTab("details");
    setModalOpen(true);
  };

  const handleOpenComments = (task, e) => {
    if (e) e.stopPropagation();
    setActiveSubtaskId(task._id);
    setSubtaskToEdit(task);
    setPendingPin(null);
    setModalInitialTab("comments");
    setModalOpen(true);
  };

  const handleSubtaskSaved = (savedSubtask, isNew) => {
    if (isNew) {
      setSubtasks((prev) => [...prev, savedSubtask]);
      setActiveSubtaskId(savedSubtask._id);
      setIsPinMode(false); // Turn off pin mode after placing
    } else {
      setSubtasks((prev) =>
        prev.map((s) => (s._id === savedSubtask._id ? savedSubtask : s))
      );
    }
    setPendingPin(null);
  };

  const handleSubtaskDeleted = (deletedId) => {
    setSubtasks((prev) => prev.filter((s) => s._id !== deletedId));
    if (activeSubtaskId === deletedId) {
      setActiveSubtaskId(null);
    }
  };

  const handleQuickStatusToggle = async (subtask, e) => {
    e.stopPropagation();
    const nextStatus =
      subtask.status === "completed"
        ? "pending"
        : subtask.status === "pending"
        ? "in_progress"
        : "completed";

    try {
      const res = await api.patch(`/subtasks/${subtask._id}`, {
        status: nextStatus,
      });
      setSubtasks((prev) =>
        prev.map((s) => (s._id === subtask._id ? res.data.subtask : s))
      );
    } catch (err) {
      console.error("Error updating subtask status:", err);
      toast.error("Error al actualizar el estado de la subtarea.");
    }
  };

  // Filter subtasks for display
  const pageSubtasks = subtasks.filter((s) => {
    const pinPage = s.marker?.pageNumber ?? 1;
    if (isPdf && pinPage !== currentPage) return false;
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-7xl h-[94vh] bg-base-100 rounded-2xl shadow-2xl border border-base-content/15 flex flex-col overflow-hidden select-auto relative overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navbar */}
        <header className="h-14 bg-base-100 border-b border-base-content/10 px-3 sm:px-4 flex items-center justify-between flex-shrink-0 z-30 shadow-xs gap-2">
          {/* Left: Volver/Back button + File info */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-xs sm:btn-sm btn-ghost btn-circle text-base-content/70 hover:text-base-content flex-shrink-0"
                title="Volver a la tarea (Esc)"
              >
                <ArrowLeftIcon className="size-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              {isPdf ? (
                <FileTextIcon className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </div>
            <div className="truncate">
              <h2 className="text-xs sm:text-sm font-bold text-base-content truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {file.originalName}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-base-content/50">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>
                  {subtasks.length}{" "}
                  {subtasks.length === 1 ? "marcador" : "marcadores"}
                </span>
              </div>
            </div>
          </div>

          {/* Center: PDF Page controls */}
          {isPdf && numPages > 1 && (
            <div className="flex items-center gap-1.5 bg-base-200/80 px-2 py-1 rounded-xl border border-base-content/10">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="btn btn-ghost btn-xs btn-square"
                title="Página anterior"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-xs font-semibold px-1 text-base-content font-mono">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="btn btn-ghost btn-xs btn-square"
                title="Página siguiente"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Pin Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPinMode(!isPinMode)}
              className={`btn btn-xs sm:btn-sm gap-1.5 rounded-xl font-medium transition-all ${
                isPinMode
                  ? "btn-primary ring-2 ring-primary/40 shadow-md animate-pulse"
                  : "btn-outline border-base-content/20 hover:border-primary text-base-content"
              }`}
              title="Activar para hacer clic en el lienzo y colocar una subtarea"
            >
              <MapPinIcon className="size-3.5" />
              <span>
                {isPinMode ? "Modo Pin Activo" : "+ Añadir Marcador"}
              </span>
            </button>

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`btn btn-xs sm:btn-sm btn-ghost gap-1.5 rounded-xl ${
                showSidebar ? "text-primary bg-primary/10" : "text-base-content/60"
              }`}
              title="Ver lista de subtareas"
            >
              <ListOrderedIcon className="size-4" />
              <span className="hidden md:inline">Subtareas</span>
              <span className="badge badge-xs bg-base-200 border border-base-content/10 font-mono">
                {pageSubtasks.length}
              </span>
            </button>

            {/* Close viewer button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-xs sm:btn-sm btn-ghost gap-1 rounded-xl text-base-content/70 hover:text-base-content hover:bg-base-200 ml-1"
                title="Cerrar ventana flotante (Esc)"
              >
                <XIcon className="size-4" />
                <span className="hidden sm:inline font-medium">Cerrar</span>
              </button>
            )}
          </div>
        </header>

        {/* Pin Mode Instruction Banner */}
        {isPinMode && (
          <div className="bg-primary text-primary-content text-xs py-2 px-4 text-center font-medium shadow-md flex items-center justify-between gap-2 z-20 flex-wrap animate-in slide-in-from-top-2 duration-150 flex-shrink-0">
            <div className="flex items-center gap-2 mx-auto">
              <MapPinIcon className="size-4 animate-bounce" />
              <span>
                <strong>Modo marcador activo:</strong> Haz clic en cualquier parte de la imagen o documento para ubicar una nueva subtarea.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinMode(false)}
              className="btn btn-xs btn-ghost text-primary-content border border-primary-content/30 hover:bg-primary-focus font-normal"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Main Workspace (Canvas + Sidebar) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Canvas Area */}
          <div
            ref={canvasWrapperRef}
            className="flex-1 overflow-auto p-4 flex justify-center items-start bg-neutral-900/40 relative overscroll-contain"
          >
            {/* Interactive Canvas Container (Relative for absolute pins) */}
            <div
              onClick={handleCanvasClick}
              className={`relative inline-block max-w-full transition-all duration-150 ${
                isPinMode ? "cursor-crosshair ring-2 ring-primary/40 rounded-lg" : ""
              }`}
              style={{ position: "relative" }}
            >
              {/* Native Image or react-pdf Canvas */}
              <MediaViewer
                file={file}
                currentPage={currentPage}
                containerWidth={containerWidth}
                onDocumentLoadSuccess={handleDocumentLoadSuccess}
              />

              {/* Pin Layer (Absolute markers positioned via xPercent & yPercent) */}
              <PinLayer
                subtasks={subtasks}
                currentPage={currentPage}
                activeSubtaskId={activeSubtaskId}
                onSelectPin={handleSelectPin}
                pendingPin={pendingPin}
              />
            </div>
          </div>

          {/* Subtasks Sidebar */}
          {showSidebar && (
            <aside className="w-80 sm:w-96 bg-base-100 border-l border-base-content/10 flex flex-col flex-shrink-0 z-20 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-200">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-base-content/10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-base-content">
                    Subtareas y Marcadores
                  </h3>
                  <p className="text-[11px] text-base-content/50">
                    {isPdf ? `Página ${currentPage} • ` : ""}
                    {pageSubtasks.length} marcadores
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPinMode(true);
                    toast("Haz clic en el documento para colocar el pin", {
                      icon: "📍",
                    });
                  }}
                  className="btn btn-xs btn-primary gap-1 rounded-lg"
                >
                  <PlusIcon className="size-3" />
                  <span>Nuevo Pin</span>
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="px-4 py-2 border-b border-base-content/10 bg-base-200/50 flex gap-1">
                {[
                  { id: "all", label: "Todas" },
                  { id: "pending", label: "Pendientes" },
                  { id: "completed", label: "Listas" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterStatus(tab.id)}
                    className={`btn btn-xs rounded-lg flex-1 ${
                      filterStatus === tab.id
                        ? "btn-neutral text-xs font-semibold"
                        : "btn-ghost text-xs text-base-content/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subtasks List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="loading loading-spinner loading-sm text-primary" />
                  </div>
                ) : pageSubtasks.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <div className="p-3 bg-base-200 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-base-content/40">
                      <MapPinIcon className="size-6" />
                    </div>
                    <p className="text-xs font-semibold text-base-content">
                      No hay marcadores aún
                    </p>
                    <p className="text-[11px] text-base-content/50">
                      Activa el modo pin y haz clic en la imagen o PDF para crear tu
                      primera subtarea.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPinMode(true)}
                      className="btn btn-xs btn-outline btn-primary mt-2"
                    >
                      Activar Modo Pin
                    </button>
                  </div>
                ) : (
                  pageSubtasks.map((task, idx) => {
                    const isSelected = activeSubtaskId === task._id;
                    const isDone = task.status === "completed";

                    return (
                      <div
                        key={task._id}
                        onClick={() => handleSelectPin(task)}
                        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xs"
                            : "bg-base-200/50 hover:bg-base-200 border-base-content/10"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Quick Checkbox / Status toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusToggle(task, e)}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                              isDone
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : task.status === "in_progress"
                                ? "bg-blue-600 border-blue-700 text-white"
                                : "border-base-content/30 hover:border-primary text-transparent"
                            }`}
                            title={`Estado actual: ${task.status}. Clic para avanzar.`}
                          >
                            {isDone ? (
                              <CheckCircle2Icon className="size-3.5 stroke-[2.5]" />
                            ) : task.status === "in_progress" ? (
                              <PlayIcon className="size-2.5 fill-current" />
                            ) : (
                              <ClockIcon className="size-3 text-base-content/40" />
                            )}
                          </button>

                          {/* Title & metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isDone
                                    ? "line-through text-base-content/50"
                                    : "text-base-content"
                                }`}
                              >
                                <span className="font-mono text-primary mr-1">
                                  #{idx + 1}
                                </span>
                                {task.title}
                              </span>

                              {task.comments && task.comments.length > 0 && (
                                <span
                                  className="badge badge-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 gap-0.5 font-bold px-1.5 flex-shrink-0"
                                  title={`${task.comments.length} dudas/comentarios`}
                                >
                                  <MessageSquareIcon className="size-2.5" />
                                  <span>{task.comments.length}</span>
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-base-content/60 line-clamp-2 mt-0.5">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-base-content/5 text-[10px] text-base-content/50 gap-1.5">
                              {task.assignedTo ? (
                                <span className="flex items-center gap-1 font-medium text-base-content/70 truncate max-w-[90px]">
                                  <UserIcon className="size-3 flex-shrink-0" />
                                  <span className="truncate">{task.assignedTo.name}</span>
                                </span>
                              ) : (
                                <span>Sin asignar</span>
                              )}

                              {/* Botón para ver o agregar dudas/comentarios */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenComments(task, e)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all shadow-2xs ${
                                  task.comments && task.comments.length > 0
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100"
                                    : "bg-base-200/80 hover:bg-primary/10 hover:text-primary border-base-content/10 text-base-content/60"
                                }`}
                                title="Ver o agregar dudas y comentarios a este marcador"
                              >
                                <MessageSquareIcon className="size-2.5 flex-shrink-0" />
                                <span>
                                  {task.comments && task.comments.length > 0
                                    ? `${task.comments.length} ${task.comments.length === 1 ? 'duda' : 'dudas'}`
                                    : "+ Comentar"}
                                </span>
                              </button>

                              <span className="font-mono text-[9px] flex-shrink-0">
                                {task.marker?.xPercent?.toFixed(0)}%,{" "}
                                {task.marker?.yPercent?.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Subtask Modal for creating or editing pins */}
      <SubtaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingPin(null);
        }}
        parentTaskId={parentTaskId}
        subtask={subtaskToEdit}
        markerData={pendingPin}
        accounts={accounts}
        initialTab={modalInitialTab}
        onSaved={handleSubtaskSaved}
        onDeleted={handleSubtaskDeleted}
      />
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
