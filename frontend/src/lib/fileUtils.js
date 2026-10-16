/**
 * Resolves static file URL for both development (port 5001) and production environments.
 */
export function getFileUrl(fileUrl) {
  if (!fileUrl) return "";
  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://") ||
    fileUrl.startsWith("blob:")
  ) {
    return fileUrl;
  }
  const backendUrl =
    import.meta.env.MODE === "development" ? "http://localhost:5001" : "";
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${backendUrl}${cleanPath}`;
}

/**
 * Format bytes into human-readable string (e.g. 1.2 MB).
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if mime type or filename corresponds to a PDF.
 */
export function isPdf(mimeType = "", originalName = "") {
  return (
    mimeType === "application/pdf" ||
    (originalName && originalName.toLowerCase().endsWith(".pdf"))
  );
}

/**
 * Check if mime type or filename corresponds to an image.
 */
export function isImage(mimeType = "", originalName = "") {
  return (
    (mimeType && mimeType.startsWith("image/")) ||
    (originalName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(originalName))
  );
}

/**
 * Format duration in seconds to MM:SS string.
 */
export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

