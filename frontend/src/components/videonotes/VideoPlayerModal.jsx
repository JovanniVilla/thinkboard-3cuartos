import React, { useState } from "react";
import api from "../../lib/axios";
import { getFileUrl, formatFileSize, formatDuration } from "../../lib/fileUtils";
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

  if (!videoNote) return null;

  const resolvedUrl = getFileUrl(videoNote.fileUrl);
  const authorName = videoNote.createdBy?.name || "Usuario";
  const authorColor = videoNote.createdBy?.color || "#3B82F6";

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

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
        onStatusChange(res.data.videoNote || { ...videoNote, status: nextStatus });
      }
    } catch (error) {
      console.error("Error updating video note status:", error);
      toast.error("Error al actualizar el estado de la video nota.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isResolved = currentStatus === "resolved";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col max-h-[95vh]"
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
                  {new Date(videoNote.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
              href={resolvedUrl}
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
        <div className="bg-black flex items-center justify-center relative flex-1 min-h-[300px] max-h-[70vh]">
          <video
            src={resolvedUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full max-h-[70vh] object-contain shadow-2xl"
          >
            Tu navegador no soporta la reproducción de video HTML5.
          </video>
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
}
