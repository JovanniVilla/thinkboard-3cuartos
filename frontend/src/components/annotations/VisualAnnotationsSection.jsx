import React, { useState, useEffect, useCallback } from "react";
import api from "../../lib/axios";
import FileUploader from "./FileUploader";
import AnnotationCanvas from "./AnnotationCanvas";
import { formatFileSize, getFileUrl, isPdf as checkIsPdf } from "../../lib/fileUtils";
import {
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  MapPinIcon,
  EyeIcon,
  PaperclipIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function VisualAnnotationsSection({
  taskId,
  accounts = [],
  onSubtasksCountChange,
  onNoteRefresh,
}) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [activeFileForCanvas, setActiveFileForCanvas] = useState(null);

  const fetchFiles = useCallback(async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/${taskId}/files`);
      const data = res.data || [];
      setFiles(data);

      if (onSubtasksCountChange) {
        const totalSubtasks = data.reduce(
          (acc, f) => acc + (f.subtaskCount || 0),
          0
        );
        onSubtasksCountChange(totalSubtasks, data.length);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, onSubtasksCountChange]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadSuccess = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
    setIsUploaderOpen(false);
    // Optionally open the newly uploaded file in the canvas immediately
    setActiveFileForCanvas(newFile);
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar este archivo y todos sus marcadores de subtareas asociados?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/files/${fileId}`);
      toast.success("Archivo eliminado correctamente");
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      if (activeFileForCanvas?._id === fileId) {
        setActiveFileForCanvas(null);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar el archivo.");
    }
  };

  return (
    <div id="visual-annotations-section" className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PaperclipIcon className="size-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/70">
            Archivos y Anotaciones Visuales
          </h3>
          <span className="badge badge-sm bg-base-200 border border-base-content/10 font-mono text-[10px]">
            {files.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsUploaderOpen(true)}
          className="btn btn-xs btn-outline btn-primary gap-1 rounded-lg font-medium"
        >
          <PlusIcon className="size-3" />
          <span>Adjuntar Archivo</span>
        </button>
      </div>

      {/* Files Grid / List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-6 bg-base-200/30 rounded-xl border border-base-content/10">
          <span className="loading loading-spinner loading-sm text-primary" />
        </div>
      ) : files.length === 0 ? (
        <div
          onClick={() => setIsUploaderOpen(true)}
          className="p-6 rounded-2xl border-2 border-dashed border-base-content/15 hover:border-primary/50 bg-base-200/30 hover:bg-base-200/60 transition-all text-center cursor-pointer space-y-1.5"
        >
          <div className="p-3 bg-base-200 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-primary">
            <PaperclipIcon className="size-5" />
          </div>
          <p className="text-xs font-semibold text-base-content">
            No hay archivos adjuntos en esta tarea
          </p>
          <p className="text-[11px] text-base-content/50 max-w-sm mx-auto">
            Sube planos, imágenes o PDFs (hasta 50MB) para crear subtareas
            haciendo clic en coordenadas visuales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => {
            const isPdf = checkIsPdf(file.mimeType, file.originalName);
            const resolvedUrl = getFileUrl(file.fileUrl);

            return (
              <div
                key={file._id}
                onClick={() => setActiveFileForCanvas(file)}
                className="group relative bg-base-200/50 hover:bg-base-200 border border-base-content/10 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* File preview banner */}
                  <div className="w-full h-24 rounded-lg bg-base-300/80 mb-2 overflow-hidden flex items-center justify-center relative border border-base-content/5">
                    {isPdf ? (
                      <div className="flex flex-col items-center gap-1 text-base-content/50 group-hover:text-primary transition-colors">
                        <FileTextIcon className="size-8" />
                        <span className="text-[10px] font-mono uppercase font-bold">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={resolvedUrl}
                        alt={file.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    {/* Pins badge overlay */}
                    {file.subtaskCount > 0 && (
                      <div className="absolute top-1.5 right-1.5 badge badge-xs bg-primary text-primary-content font-bold shadow gap-1 py-1 px-1.5">
                        <MapPinIcon className="size-2.5" />
                        <span>{file.subtaskCount} pines</span>
                      </div>
                    )}
                  </div>

                  {/* Title & metadata */}
                  <p
                    className="text-xs font-semibold text-base-content truncate group-hover:text-primary transition-colors"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                  <p className="text-[10px] text-base-content/50 mt-0.5">
                    {formatFileSize(file.size)} •{" "}
                    {new Date(file.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-base-content/10 text-xs">
                  <span className="text-primary font-medium flex items-center gap-1 text-[11px]">
                    <EyeIcon className="size-3" />
                    <span>Ver y Anotar</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteFile(file._id, e)}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error"
                    title="Eliminar archivo"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <FileUploader
            taskId={taskId}
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setIsUploaderOpen(false)}
          />
        </div>
      )}

      {/* Fullscreen Interactive Annotation Canvas Modal */}
      {activeFileForCanvas && (
        <AnnotationCanvas
          file={activeFileForCanvas}
          parentTaskId={taskId}
          accounts={accounts}
          onClose={() => {
            setActiveFileForCanvas(null);
            fetchFiles(); // Refresh counts upon closing canvas
            if (onNoteRefresh) onNoteRefresh();
          }}
        />
      )}
    </div>
  );
}
