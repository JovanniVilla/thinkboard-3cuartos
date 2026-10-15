import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Easypanel/Docker, the persistent volume is mounted at /app/uploads.
// Because "npm start --prefix backend" changes cwd to /app/backend,
// path.resolve(process.cwd(), "uploads") previously resolved to /app/backend/uploads (outside the volume).
// Now we guarantee it uses the mounted volume:
// 1. process.env.UPLOADS_DIR if provided
// 2. "/app/uploads" if running in Docker/Easypanel (/app exists)
// 3. Local development fallback to <project_root>/uploads
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ||
  (fs.existsSync("/app")
    ? "/app/uploads"
    : path.resolve(__dirname, "../../../uploads"));

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("No se pudo crear UPLOADS_DIR:", err);
  }
}

// Allowed MIME types: images (.jpg, .jpeg, .png, .webp) and PDF documents
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Re-verify directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Clean original filename and append timestamp + random suffix to prevent collisions
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  },
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Tipo de archivo no permitido. Solo se permiten archivos JPG, PNG y PDF."
    );
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  }
};

// Multer instance with 50MB limit
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB strict limit
  },
  fileFilter,
});

/**
 * Middleware wrapper for single file upload on field "file".
 * Captures MulterError LIMIT_FILE_SIZE and returns HTTP 413.
 */
export const uploadSingleFile = (req, res, next) => {
  const singleUpload = upload.single("file");

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "Payload Too Large",
            message: "El archivo supera el límite máximo permitido de 50MB.",
          });
        }
        return res.status(400).json({
          error: "Multer Error",
          message: err.message,
        });
      }

      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({
          error: "Invalid File Type",
          message: err.message,
        });
      }

      return res.status(500).json({
        error: "Upload Error",
        message: err.message || "Error al procesar la subida del archivo.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Bad Request",
        message: "No se ha proporcionado ningún archivo para subir.",
      });
    }

    next();
  });
};

export default upload;
