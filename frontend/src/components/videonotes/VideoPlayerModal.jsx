import React from "react";
import { getFileUrl, formatFileSize, formatDuration } from "../../lib/fileUtils";
import {
  XIcon,
  DownloadIcon,
  Trash2Icon,
  ClockIcon,
  HardDriveIcon,
  CalendarIcon,
  VideoIcon,
} from "lucide-react";

export default function VideoPlayerModal({
  videoNote,
  onClose,
  onDelete,
  canDelete = true,
}) {
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-base-content/10 bg-base-200/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl flex-shrink-0">
              <VideoIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-sm sm:text-base font-bold text-base-content truncate"
                title={videoNote.title}
              >
                {videoNote.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-base-content/60">
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

          <div className="flex items-center gap-1.5 flex-shrink-0">
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

            {/* Close Button */}
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

          <div className="text-[11px] text-base-content/50">
            Grabación en 1080p con compresión optimizada
          </div>
        </div>
      </div>
    </div>
  );
}
