import React, { useState, useRef } from "react";
import api from "../../lib/axios";
import { formatFileSize } from "../../lib/fileUtils";
import {
  UploadCloudIcon,
  FileIcon,
  XIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export default function FileUploader({ taskId, onUploadSuccess, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setErrorMessage("");

    if (!file) return false;

    // Check size limit (50MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("El archivo supera el límite de 50MB (HTTP 413).");
      toast.error("Archivo superior a 50MB (Límite estricto excedido)");
      return false;
    }

    // Check extension
    const nameLower = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    if (!isAllowed) {
      setErrorMessage(
        "Formato no permitido. Solo se aceptan imágenes (.jpg, .png) y documentos PDF (.pdf)."
      );
      toast.error("Formato no compatible");
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !taskId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post(`/tasks/${taskId}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      toast.success("Archivo subido exitosamente");
      if (onUploadSuccess) {
        onUploadSuccess(response.data.file);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Explicit handling of HTTP 413 Payload Too Large
      if (error.response?.status === 413) {
        const msg = "Archivo superior a 50MB. El servidor rechazó la subida (HTTP 413).";
        setErrorMessage(msg);
        toast.error("Archivo superior a 50MB");
      } else {
        const msg =
          error.response?.data?.message ||
          "Error al subir el archivo. Inténtalo de nuevo.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = selectedFile?.name?.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-base-100 rounded-2xl border border-base-content/10 shadow-2xl overflow-hidden p-6 max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-base-content/10 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <UploadCloudIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-base-content">
              Subir Archivo para Anotaciones
            </h3>
            <p className="text-xs text-base-content/60">
              Imágenes JPG, PNG o documentos PDF (máx. 50MB)
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs">
          <AlertTriangleIcon className="size-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-base-content/20 hover:border-primary/50 hover:bg-base-200/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
          />
          <div className="p-4 bg-base-200 rounded-full text-primary shadow-inner">
            <UploadCloudIcon className="size-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-base-content">
              Arrastra tu archivo aquí o{" "}
              <span className="text-primary underline">selecciona uno</span>
            </p>
            <p className="text-xs text-base-content/50">
              Soporta JPG, PNG y PDF (Límite estricto de 50MB)
            </p>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/70 border border-base-content/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                {isPdf ? (
                  <FileTextIcon className="size-5" />
                ) : (
                  <ImageIcon className="size-5" />
                )}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-base-content truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-base-content/50">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
                title="Quitar archivo"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-base-content/70">
                <span>Subiendo archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="btn btn-sm btn-primary gap-2 font-medium"
            >
              {isUploading ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Subiendo ({uploadProgress}%)</span>
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-4" />
                  <span>Subir archivo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
