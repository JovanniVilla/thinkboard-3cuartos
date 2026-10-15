import React, { useState, useEffect, useCallback } from "react";
import api from "../../lib/axios";
import { getFileUrl, formatFileSize, formatDuration } from "../../lib/fileUtils";
import VideoNoteRecorderModal from "./VideoNoteRecorderModal";
import VideoPlayerModal from "./VideoPlayerModal";
import {
  VideoIcon,
  PlusIcon,
  PlayIcon,
  Trash2Icon,
  ClockIcon,
  DownloadIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function VideoNotesSection({
  taskId,
  onVideoNotesCountChange,
  onNoteRefresh,
  isRecorderOpen,
  setIsRecorderOpen,
}) {
  const [videoNotes, setVideoNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalRecorderOpen, setInternalRecorderOpen] = useState(false);
  const [activeVideoForPlayer, setActiveVideoForPlayer] = useState(null);

  // Control coordinado del modal de grabación (desde prop externa o interno)
  const isModalOpen =
    isRecorderOpen !== undefined ? isRecorderOpen : internalRecorderOpen;
  const setModalOpen = (open) => {
    if (setIsRecorderOpen) {
      setIsRecorderOpen(open);
    } else {
      setInternalRecorderOpen(open);
    }
  };

  const fetchVideoNotes = useCallback(async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${taskId}/video-notes`);
      const data = res.data || [];
      setVideoNotes(data);

      if (onVideoNotesCountChange) {
        onVideoNotesCountChange(data.length);
      }
    } catch (error) {
      console.error("Error al obtener las video notas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, onVideoNotesCountChange]);

  useEffect(() => {
    fetchVideoNotes();
  }, [fetchVideoNotes]);

  const handleUploadSuccess = (newVideoNote) => {
    setVideoNotes((prev) => [newVideoNote, ...prev]);
    if (onVideoNotesCountChange) {
      onVideoNotesCountChange(videoNotes.length + 1);
    }
    if (onNoteRefresh) {
      onNoteRefresh();
    }
  };

  const handleDeleteVideoNote = async (videoNoteId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta video nota?")) {
      return;
    }

    try {
      await api.delete(`/video-notes/${videoNoteId}`);
      toast.success("Video nota eliminada correctamente");
      setVideoNotes((prev) => {
        const updated = prev.filter((v) => v._id !== videoNoteId);
        if (onVideoNotesCountChange) {
          onVideoNotesCountChange(updated.length);
        }
        return updated;
      });

      if (activeVideoForPlayer?._id === videoNoteId) {
        setActiveVideoForPlayer(null);
      }
      if (onNoteRefresh) {
        onNoteRefresh();
      }
    } catch (error) {
      console.error("Error al eliminar la video nota:", error);
      const msg =
        error.response?.data?.message || "Error al eliminar la video nota.";
      toast.error(msg);
    }
  };

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
    <div id="video-notes-section" className="space-y-3 pt-2">
      {/* Encabezado de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-error animate-pulse" />
          <VideoIcon className="size-4 text-error" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/70">
            Video Notas (Pantalla y Audio)
          </h3>
          <span className="badge badge-sm bg-base-200 border border-base-content/10 font-mono text-[10px]">
            {videoNotes.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn btn-xs btn-outline btn-error gap-1 rounded-lg font-medium shadow-2xs"
          title="Iniciar grabación de pantalla y micrófono"
        >
          <PlusIcon className="size-3" />
          <span>Grabar Video Nota</span>
        </button>
      </div>

      {/* Lista / Cuadrícula de Video Notas */}
      {isLoading ? (
        <div className="flex items-center justify-center p-6 bg-base-200/30 rounded-xl border border-base-content/10">
          <span className="loading loading-spinner loading-sm text-error" />
        </div>
      ) : videoNotes.length === 0 ? (
        <div
          onClick={() => setModalOpen(true)}
          className="p-6 rounded-2xl border-2 border-dashed border-base-content/15 hover:border-error/50 bg-base-200/30 hover:bg-base-200/60 transition-all text-center cursor-pointer space-y-1.5 group"
        >
          <div className="p-3 bg-error/10 text-error rounded-full w-10 h-10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <VideoIcon className="size-5" />
          </div>
          <p className="text-xs font-semibold text-base-content">
            No hay video notas grabadas en esta tarea
          </p>
          <p className="text-[11px] text-base-content/50 max-w-sm mx-auto leading-relaxed">
            Graba tu pantalla y micrófono (hasta 5 min en 1080p) para explicar
            cambios visuales, reportar incidencias o dar feedback interactivo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videoNotes.map((videoNote) => {
            const author = videoNote.createdBy;
            const authorName = author?.name || "Usuario";
            const authorColor = author?.color || "#3B82F6";
            const resolvedUrl = getFileUrl(videoNote.fileUrl);

            return (
              <div
                key={videoNote._id}
                onClick={() => setActiveVideoForPlayer(videoNote)}
                className="group relative bg-base-200/50 hover:bg-base-200 border border-base-content/10 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Banner de previsualización con reproductor ligero */}
                  <div className="w-full h-28 rounded-lg bg-black/90 mb-2 overflow-hidden flex items-center justify-center relative border border-base-content/5 group-hover:border-error/40 transition-colors">
                    <video
                      src={resolvedUrl}
                      preload="metadata"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Botón Play central superpuesto */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="size-9 rounded-full bg-error text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlayIcon className="size-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Badge de duración en esquina inferior derecha */}
                    <div className="absolute bottom-1.5 right-1.5 badge badge-xs bg-black/75 text-white font-mono text-[10px] font-bold border-none gap-1 py-1 px-1.5">
                      <ClockIcon className="size-2.5" />
                      <span>{formatDuration(videoNote.durationSeconds)}</span>
                    </div>
                  </div>

                  {/* Título y metadatos */}
                  <p
                    className="text-xs font-semibold text-base-content truncate group-hover:text-error transition-colors"
                    title={videoNote.title}
                  >
                    {videoNote.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-base-content/50 mt-1">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-xs inline-flex flex-shrink-0"
                        style={{ backgroundColor: authorColor }}
                      >
                        {getInitials(authorName)}
                      </span>
                      <span className="truncate">{authorName}</span>
                    </span>
                    <span>{formatFileSize(videoNote.sizeBytes)}</span>
                  </div>
                </div>

                {/* Pie de tarjeta con acciones rápidas */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-base-content/10 text-xs">
                  <span className="text-error font-medium flex items-center gap-1 text-[11px]">
                    <PlayIcon className="size-3 fill-current" />
                    <span>Reproducir</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Descargar video directamente */}
                    <a
                      href={resolvedUrl}
                      download={`${videoNote.title || "videonota"}.webm`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-primary"
                      title="Descargar video"
                    >
                      <DownloadIcon className="size-3.5" />
                    </a>

                    {/* Eliminar video nota */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideoNote(videoNote._id, e)}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error"
                      title="Eliminar video nota"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Grabación Nativa de Pantalla y Audio */}
      {isModalOpen && (
        <VideoNoteRecorderModal
          taskId={taskId}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Modal Reproductor HD Cinema */}
      {activeVideoForPlayer && (
        <VideoPlayerModal
          videoNote={activeVideoForPlayer}
          onClose={() => setActiveVideoForPlayer(null)}
          onDelete={() => handleDeleteVideoNote(activeVideoForPlayer._id)}
        />
      )}
    </div>
  );
}
