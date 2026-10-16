import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../../lib/axios";
import {
  getFileUrl,
  getVideoNoteStreamUrl,
  formatFileSize,
  formatDuration,
} from "../../lib/fileUtils";
import {
  XIcon,
  DownloadIcon,
  Trash2Icon,
  ClockIcon,
  HardDriveIcon,
  CalendarIcon,
  VideoIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  PlayIcon,
  AlertCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function VideoPlayerModal({
  videoNote,
  onClose,
  onDelete,
  onStatusChange,
  canDelete = true,
}) {
  const [currentStatus, setCurrentStatus] = useState(
    videoNote?.status || "pending"
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  const modalRef = useRef(null);
  const videoRef = useRef(null);

  // URLs de transmisión por rangos HTTP y fallback estático
  const streamUrl = getVideoNoteStreamUrl(videoNote);
  const staticUrl = getFileUrl(videoNote?.fileUrl);

  const authorName = videoNote?.createdBy?.name || "Usuario";
  const authorColor = videoNote?.createdBy?.color || "#3B82F6";

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Bloqueo estricto del scroll de fondo mientras la caja de luz esté abierta
  useEffect(() => {
    if (!videoNote) return;

    // 1. Guardar estilos originales del body y html
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";

    // 2. Bloquear cualquier contenedor con scroll en la vista subyacente (ej: NoteDetailPage)
    const scrollContainers = Array.from(
      document.querySelectorAll(".overflow-y-auto, .overflow-auto")
    );
    const savedStyles = scrollContainers.map((node) => ({
      node,
      overflow: node.style.overflow,
      overflowY: node.style.overflowY,
    }));

    scrollContainers.forEach(({ node }) => {
      if (!modalRef.current || !modalRef.current.contains(node)) {
        node.style.overflow = "hidden";
        node.style.overflowY = "hidden";
      }
    });

    // 3. Interceptar y cancelar eventos de rueda de ratón o táctiles para evitar propagación al fondo
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

    // 4. Control por teclado: ESC cierra el modal, Espacio controla play/pause sin scrollear la página
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.code === "Space") {
        const isEditingField = ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName
        );
        if (!isEditingField && videoRef.current) {
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
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
      // Restaurar estilos en el desmontaje
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;

      savedStyles.forEach(({ node, overflow, overflowY }) => {
        node.style.overflow = overflow;
        node.style.overflowY = overflowY;
      });

      window.removeEventListener("wheel", preventScrollPropagation);
      window.removeEventListener("touchmove", preventScrollPropagation);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [videoNote, onClose]);

  // Intentar reproducción automática sin romper si el navegador bloquea autoplay sin silenciar
  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay bloqueado por política del navegador; el usuario puede pulsar el botón de play
          console.log("Autoplay en espera de interacción del usuario:", err.message);
        });
      }
    }
  }, [streamUrl, staticUrl]);

  if (!videoNote) return null;

  const handleToggleStatus = async () => {
    const nextStatus = currentStatus === "resolved" ? "pending" : "resolved";
    setIsUpdatingStatus(true);
    try {
      const res = await api.patch(`/video-notes/${videoNote._id}/status`, {
        status: nextStatus,
      });
      setCurrentStatus(nextStatus);
      toast.success(
        nextStatus === "resolved"
          ? "Video nota marcada como resuelta"
          : "Video nota marcada como pendiente"
      );
      if (onStatusChange) {
        onStatusChange(
          res.data.videoNote || { ...videoNote, status: nextStatus }
        );
      }
    } catch (error) {
      console.error("Error updating video note status:", error);
      toast.error("Error al actualizar el estado de la video nota.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVideoCanvasClick = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleRetryPlayback = () => {
    setHasPlaybackError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const isResolved = currentStatus === "resolved";

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overscroll-contain"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-4xl bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col max-h-[95vh] overscroll-contain select-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-content/10 bg-base-200/50 gap-2 flex-wrap sm:flex-nowrap">
          {/* Left Title and Author */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl flex-shrink-0">
              <VideoIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className="text-sm sm:text-base font-bold text-base-content truncate"
                  title={videoNote.title}
                >
                  {videoNote.title}
                </h2>
                {isResolved ? (
                  <span className="badge badge-xs sm:badge-sm bg-success/20 text-success border border-success/30 font-bold gap-1 py-1 px-1.5 flex-shrink-0">
                    <CheckCircle2Icon className="size-2.5" />
                    <span>Resuelta</span>
                  </span>
                ) : (
                  <span className="badge badge-xs sm:badge-sm bg-warning/20 text-warning border border-warning/30 font-bold gap-1 py-1 px-1.5 flex-shrink-0">
                    <ClockIcon className="size-2.5" />
                    <span>Pendiente</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-base-content/60 mt-0.5">
                <span className="flex items-center gap-1">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-xs inline-flex"
                    style={{ backgroundColor: authorColor }}
                  >
                    {getInitials(authorName)}
                  </span>
                  <span>{authorName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {videoNote.createdAt ? (
                    new Date(videoNote.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  ) : (
                    "Fecha desconocida"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Status Toggle Button */}
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`btn btn-xs sm:btn-sm rounded-lg gap-1.5 font-semibold ${
                isResolved
                  ? "btn-outline btn-warning"
                  : "btn-success text-white"
              }`}
              title={
                isResolved
                  ? "Reabrir video nota (cambiar a pendiente)"
                  : "Marcar video nota como resuelta"
              }
            >
              {isUpdatingStatus ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isResolved ? (
                <>
                  <RotateCcwIcon className="size-3.5" />
                  <span>Marcar Pendiente</span>
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-3.5" />
                  <span>Marcar Resuelta</span>
                </>
              )}
            </button>

            {/* Direct Download Button */}
            <a
              href={staticUrl || streamUrl}
              download={`${videoNote.title || "videonota"}.webm`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary"
              title="Descargar video"
            >
              <DownloadIcon className="size-4" />
            </a>

            {/* Delete Button */}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(videoNote._id)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-error"
                title="Eliminar video nota"
              >
                <Trash2Icon className="size-4" />
              </button>
            )}

            {/* Return to Task Button */}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 rounded-lg text-base-content/70 hover:text-base-content font-medium ml-1"
              title="Cerrar el reproductor y volver a la tarea"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden md:inline">Volver a la tarea</span>
            </button>

            {/* Close Circle Button */}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              title="Cerrar reproductor"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Video Player Cinema Canvas */}
        <div
          className="bg-black flex items-center justify-center relative flex-1 min-h-[320px] max-h-[70vh] cursor-pointer group"
          onClick={handleVideoCanvasClick}
        >
          <video
            ref={videoRef}
            src={streamUrl || staticUrl}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn("Error en reproducción de video:", e);
              if (
                videoRef.current &&
                staticUrl &&
                videoRef.current.src !== staticUrl
              ) {
                videoRef.current.src = staticUrl;
                videoRef.current.load();
              } else {
                setHasPlaybackError(true);
              }
            }}
            className="w-full h-full max-h-[70vh] object-contain shadow-2xl"
          >
            {streamUrl && (
              <source
                src={streamUrl}
                type={videoNote.mimeType || "video/webm"}
              />
            )}
            {staticUrl && (
              <source
                src={staticUrl}
                type={videoNote.mimeType || "video/webm"}
              />
            )}
            Tu navegador no soporta la reproducción de video HTML5.
          </video>

          {/* Botón flotante grande de Play si está en pausa y listo */}
          {!isPlaying && !hasPlaybackError && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="absolute inset-0 m-auto size-16 rounded-full bg-primary/90 hover:bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-10"
              title="Reproducir video"
            >
              <PlayIcon className="size-8 ml-1 fill-white" />
            </button>
          )}

          {/* Mensaje de error de reproducción con opciones de recuperación */}
          {hasPlaybackError && (
            <div
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 text-white space-y-3 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircleIcon className="size-10 text-error" />
              <p className="font-semibold text-sm">
                No se pudo reproducir el video en streaming
              </p>
              <p className="text-xs text-white/70 max-w-md">
                El archivo podría estar finalizando su procesamiento o necesitar descarga directa.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetryPlayback}
                  className="btn btn-sm btn-primary rounded-lg gap-1.5"
                >
                  <RotateCcwIcon className="size-3.5" />
                  <span>Reintentar</span>
                </button>
                <a
                  href={staticUrl || streamUrl}
                  download={`${videoNote.title || "videonota"}.webm`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline text-white rounded-lg gap-1.5"
                >
                  <DownloadIcon className="size-3.5" />
                  <span>Descargar archivo</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Metadata Bar */}
        <div className="px-5 py-3 border-t border-base-content/10 bg-base-200/40 flex items-center justify-between text-xs text-base-content/70 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-mono">
              <ClockIcon className="size-3.5 text-primary" />
              <span>Duración:</span>
              <strong>{formatDuration(videoNote.durationSeconds)}</strong>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <HardDriveIcon className="size-3.5 text-primary" />
              <span>Peso:</span>
              <strong>{formatFileSize(videoNote.sizeBytes)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <ArrowLeftIcon className="size-3.5" />
              <span>Cerrar y volver a la tarea</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar a través de portal en document.body para desacoplar del contexto de apilamiento de la tarea
  if (typeof document === "undefined") {
    return modalContent;
  }
  return createPortal(modalContent, document.body);
}
