import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getFileUrl, isPdf as checkIsPdf } from "../../lib/fileUtils";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";

// Configure PDF.js worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function MediaViewer({
  file,
  currentPage = 1,
  containerWidth,
  onDocumentLoadSuccess,
  onMediaLoaded,
}) {
  const [loadError, setLoadError] = useState(null);

  if (!file) {
    return (
      <div className="flex items-center justify-center p-12 text-base-content/40 text-sm">
        No se ha seleccionado ningún archivo.
      </div>
    );
  }

  const isPdf = checkIsPdf(file.mimeType, file.originalName);
  const resolvedUrl = getFileUrl(file.fileUrl);

  const handleDocSuccess = (pdf) => {
    setLoadError(null);
    if (onDocumentLoadSuccess) {
      onDocumentLoadSuccess({ numPages: pdf.numPages });
    }
  };

  const handlePageRenderSuccess = () => {
    if (onMediaLoaded) onMediaLoaded();
  };

  const handleImageLoad = () => {
    if (onMediaLoaded) onMediaLoaded();
  };

  const handleDocError = (err) => {
    console.error("PDF load error:", err);
    setLoadError(err.message || "Error al cargar el documento PDF.");
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-center bg-base-200/50 rounded-2xl border border-dashed border-error/30">
        <AlertCircleIcon className="size-8 text-error" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-base-content">
            No se pudo visualizar el archivo
          </p>
          <p className="text-xs text-base-content/60 max-w-sm">{loadError}</p>
        </div>
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-xs btn-outline btn-primary mt-2"
        >
          Descargar o abrir en pestaña nueva
        </a>
      </div>
    );
  }

  return (
    <div className="select-none flex justify-center items-center">
      {isPdf ? (
        <Document
          file={resolvedUrl}
          onLoadSuccess={handleDocSuccess}
          onLoadError={handleDocError}
          loading={
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-content/60">
              <Loader2Icon className="size-8 animate-spin text-primary" />
              <span className="text-xs font-medium">Cargando PDF...</span>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={containerWidth ? Math.min(containerWidth, 1200) : undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={handlePageRenderSuccess}
            loading={
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            }
            className="shadow-xl rounded-lg overflow-hidden border border-base-content/10 bg-white"
          />
        </Document>
      ) : (
        <img
          src={resolvedUrl}
          alt={file.originalName || "Anotación visual"}
          className="block max-w-full h-auto rounded-lg shadow-xl border border-base-content/10 pointer-events-none select-none"
          onLoad={handleImageLoad}
          onError={() =>
            setLoadError("No se pudo cargar la imagen del servidor.")
          }
        />
      )}
    </div>
  );
}
