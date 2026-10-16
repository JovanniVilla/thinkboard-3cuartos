import cron from "node-cron";
import fs from "fs";
import path from "path";
import File from "../models/File.js";
import VideoNote from "../models/VideoNote.js";
import Subtask from "../models/Subtask.js";
import Note from "../models/Note.js";
import { UPLOADS_DIR } from "../middleware/upload.js";
import { reconcileFilesLifecycle } from "../utils/fileSync.js";

/**
 * Resolves absolute filesystem path for a file or video note.
 */
export function resolveFsPath(doc) {
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    return doc.filePath;
  }

  // Fallback using fileUrl relative to UPLOADS_DIR
  if (doc.fileUrl) {
    // doc.fileUrl is like "/uploads/xxx.png" or "/uploads/videos/xxx.webm"
    const relativePart = doc.fileUrl.replace(/^\/?uploads\/?/, "");
    const candidate = path.join(UPLOADS_DIR, relativePart);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return doc.filePath || null;
}

/**
 * Safely delete a file from the filesystem.
 */
async function safeUnlink(filePath) {
  if (!filePath) return false;
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    // If file already deleted or inaccessible, log warning
    console.warn(`[storageCleanup] No se pudo borrar archivo físico en ${filePath}:`, err.message);
  }
  return false;
}

/**
 * Runs garbage collection for orphaned files older than the specified retention days (default 30 days).
 * 
 * @param {object} options
 * @param {number} options.retentionDays - Days after which markedForDeletionAt files are permanently purged. Default 30.
 * @param {boolean} options.dryRun - If true, calculates candidates without deleting.
 * @returns {Promise<{ filesDeleted: number, videosDeleted: number, freedBytes: number, errors: string[] }>}
 */
export async function runOrphanCleanup({ retentionDays = 30, dryRun = false } = {}) {
  const result = {
    filesDeleted: 0,
    videosDeleted: 0,
    freedBytes: 0,
    errors: [],
  };

  try {
    // First, run self-healing reconciliation to capture any tasks deleted without explicit sync
    await reconcileFilesLifecycle();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(
      `[storageCleanup] Buscando archivos huérfanos con fecha <= ${cutoffDate.toISOString()} (${retentionDays} días de gracia)...`
    );

    // 1. Purge orphaned File documents
    const orphanFiles = await File.find({
      parentStatus: "deleted",
      markedForDeletionAt: { $lte: cutoffDate },
    });

    for (const file of orphanFiles) {
      try {
        const filePath = resolveFsPath(file);
        let fileSize = file.size || 0;

        if (filePath && fs.existsSync(filePath)) {
          try {
            const stats = await fs.promises.stat(filePath);
            fileSize = stats.size;
          } catch {
            // keep file.size
          }
        }

        if (!dryRun) {
          await safeUnlink(filePath);
          // Delete associated visual subtasks / marker pins
          await Subtask.deleteMany({ "marker.fileId": file._id });
          await File.findByIdAndDelete(file._id);
        }

        result.filesDeleted++;
        result.freedBytes += fileSize;
      } catch (err) {
        console.error(`[storageCleanup] Error al procesar archivo ${file._id}:`, err);
        result.errors.push(`File ${file._id}: ${err.message}`);
      }
    }

    // 2. Purge orphaned VideoNote documents
    const orphanVideos = await VideoNote.find({
      parentStatus: "deleted",
      markedForDeletionAt: { $lte: cutoffDate },
    });

    for (const video of orphanVideos) {
      try {
        const filePath = resolveFsPath(video);
        let videoSize = video.sizeBytes || 0;

        if (filePath && fs.existsSync(filePath)) {
          try {
            const stats = await fs.promises.stat(filePath);
            videoSize = stats.size;
          } catch {
            // keep video.sizeBytes
          }
        }

        if (!dryRun) {
          await safeUnlink(filePath);
          // Remove checklist references in parent Note (if note exists)
          if (video.taskId) {
            await Note.findByIdAndUpdate(video.taskId, {
              $pull: { checklist: { videoNoteId: video._id } },
            }).catch(() => {});
          }
          await VideoNote.findByIdAndDelete(video._id);
        }

        result.videosDeleted++;
        result.freedBytes += videoSize;
      } catch (err) {
        console.error(`[storageCleanup] Error al procesar video nota ${video._id}:`, err);
        result.errors.push(`VideoNote ${video._id}: ${err.message}`);
      }
    }

    console.log(
      `[storageCleanup] Limpieza completada. Archivos eliminados: ${result.filesDeleted}, Videos: ${result.videosDeleted}, Bytes liberados: ${result.freedBytes}`
    );
  } catch (error) {
    console.error("[storageCleanup] Error general en ejecución de limpieza:", error);
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Initializes the node-cron scheduled job to run every day at 3:00 AM ('0 3 * * *').
 */
export function initStorageCronJob() {
  // Cron schedule: At 03:00 AM every day
  cron.schedule("0 3 * * *", async () => {
    console.log("⏰ [CronJob] Iniciando limpieza automática diaria de archivos huérfanos (3:00 AM)...");
    try {
      const summary = await runOrphanCleanup({ retentionDays: 30 });
      console.log("✅ [CronJob] Limpieza automática finalizada con éxito:", summary);
    } catch (err) {
      console.error("❌ [CronJob] Fallo en la limpieza automática programada:", err);
    }
  });

  console.log("🚀 [CronJob] Tarea programada de limpieza de almacenamiento registrada: '0 3 * * *' (03:00 AM diaria).");
}
