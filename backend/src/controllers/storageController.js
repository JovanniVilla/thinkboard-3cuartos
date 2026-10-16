import fs from "fs";
import path from "path";
import File from "../models/File.js";
import VideoNote from "../models/VideoNote.js";
import Subtask from "../models/Subtask.js";
import Note from "../models/Note.js";
import { UPLOADS_DIR } from "../middleware/upload.js";
import { reconcileFilesLifecycle } from "../utils/fileSync.js";
import { resolveFsPath } from "../cron/storageCleanup.js";

// 100 GB in bytes: 100 * 1024 * 1024 * 1024
const SERVER_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;

/**
 * Recursively scan directory to measure exact physical disk usage and file breakdowns.
 */
async function scanFolderRecursively(dir) {
  let totalBytes = 0;
  let fileCount = 0;
  const breakdown = {
    images: { bytes: 0, count: 0 },
    pdfs: { bytes: 0, count: 0 },
    videos: { bytes: 0, count: 0 },
    others: { bytes: 0, count: 0 },
  };

  if (!fs.existsSync(dir)) {
    return { totalBytes, fileCount, breakdown };
  }

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const size = stats.size;
          totalBytes += size;
          fileCount++;

          const ext = path.extname(entry.name).toLowerCase();
          if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
            breakdown.images.bytes += size;
            breakdown.images.count++;
          } else if (ext === ".pdf") {
            breakdown.pdfs.bytes += size;
            breakdown.pdfs.count++;
          } else if ([".webm", ".mp4", ".mkv", ".mov"].includes(ext)) {
            breakdown.videos.bytes += size;
            breakdown.videos.count++;
          } else {
            breakdown.others.bytes += size;
            breakdown.others.count++;
          }
        } catch (err) {
          console.warn("Could not stat file:", fullPath, err.message);
        }
      }
    }
  }

  await walk(dir);
  return { totalBytes, fileCount, breakdown };
}

/**
 * Format bytes to human readable string (e.g. "45.5 GB").
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * GET /api/storage/stats
 * Read real disk usage from UPLOADS_DIR and return breakdown & stats.
 * Access: Admin
 */
export async function getStorageStats(req, res) {
  try {
    // 1. Run quick reconciliation to keep database state fresh
    await reconcileFilesLifecycle();

    // 2. Scan physical uploads directory
    const diskStats = await scanFolderRecursively(UPLOADS_DIR);

    // 3. Query DB counts for status categories
    const [fileStatusCounts, videoStatusCounts] = await Promise.all([
      File.aggregate([
        { $group: { _id: "$parentStatus", count: { $sum: 1 }, totalBytes: { $sum: "$size" } } },
      ]),
      VideoNote.aggregate([
        { $group: { _id: "$parentStatus", count: { $sum: 1 }, totalBytes: { $sum: "$sizeBytes" } } },
      ]),
    ]);

    const statusMap = {
      active: { count: 0, bytes: 0 },
      archived: { count: 0, bytes: 0 },
      deleted: { count: 0, bytes: 0 },
    };

    const processStatus = (list) => {
      list.forEach((item) => {
        const key = item._id || "active";
        if (statusMap[key]) {
          statusMap[key].count += item.count;
          statusMap[key].bytes += item.totalBytes || 0;
        }
      });
    };

    processStatus(fileStatusCounts);
    processStatus(videoStatusCounts);

    const totalDbCount =
      statusMap.active.count + statusMap.archived.count + statusMap.deleted.count;

    // Calculate percentages for breakdown by type
    const totalPhysicalBytes = diskStats.totalBytes;
    const calcPct = (bytes) =>
      totalPhysicalBytes > 0
        ? parseFloat(((bytes / totalPhysicalBytes) * 100).toFixed(1))
        : 0;

    const breakdown = {
      images: {
        bytes: diskStats.breakdown.images.bytes,
        formatted: formatBytes(diskStats.breakdown.images.bytes),
        count: diskStats.breakdown.images.count,
        percentage: calcPct(diskStats.breakdown.images.bytes),
      },
      pdfs: {
        bytes: diskStats.breakdown.pdfs.bytes,
        formatted: formatBytes(diskStats.breakdown.pdfs.bytes),
        count: diskStats.breakdown.pdfs.count,
        percentage: calcPct(diskStats.breakdown.pdfs.bytes),
      },
      videos: {
        bytes: diskStats.breakdown.videos.bytes,
        formatted: formatBytes(diskStats.breakdown.videos.bytes),
        count: diskStats.breakdown.videos.count,
        percentage: calcPct(diskStats.breakdown.videos.bytes),
      },
      others: {
        bytes: diskStats.breakdown.others.bytes,
        formatted: formatBytes(diskStats.breakdown.others.bytes),
        count: diskStats.breakdown.others.count,
        percentage: calcPct(diskStats.breakdown.others.bytes),
      },
    };

    const usagePercentage = parseFloat(
      ((totalPhysicalBytes / SERVER_LIMIT_BYTES) * 100).toFixed(2)
    );

    // Color tier: Green < 70%, Yellow >= 70% and < 90%, Red >= 90%
    let statusColor = "green";
    if (usagePercentage >= 90) {
      statusColor = "red";
    } else if (usagePercentage >= 70) {
      statusColor = "yellow";
    }

    res.status(200).json({
      totalBytes: totalPhysicalBytes,
      totalFormatted: formatBytes(totalPhysicalBytes),
      limitBytes: SERVER_LIMIT_BYTES,
      limitFormatted: "100 GB",
      freeBytes: Math.max(0, SERVER_LIMIT_BYTES - totalPhysicalBytes),
      freeFormatted: formatBytes(Math.max(0, SERVER_LIMIT_BYTES - totalPhysicalBytes)),
      usagePercentage,
      statusColor,
      physicalFileCount: diskStats.fileCount,
      breakdown,
      counts: {
        total: totalDbCount,
        active: statusMap.active.count,
        archived: statusMap.archived.count,
        orphans: statusMap.deleted.count,
      },
    });
  } catch (error) {
    console.error("Error in getStorageStats:", error);
    res.status(500).json({ message: "Error al calcular las estadísticas de almacenamiento." });
  }
}

/**
 * GET /api/storage/files
 * List all files and video notes with filtering and sorting.
 * Query params: ?type=all|image|pdf|video & status=all|active|archived|deleted & sort=size_desc|size_asc|date_desc|date_asc & search=...
 * Access: Admin
 */
export async function getStorageFiles(req, res) {
  try {
    const {
      type = "all",
      status = "all",
      sort = "size_desc",
      search = "",
      page = 1,
      limit = 50,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));

    // Ensure status synchronization is up to date
    await reconcileFilesLifecycle();

    const fileFilters = {};
    const videoFilters = {};

    // 1. Filter by parentStatus
    if (status !== "all" && ["active", "archived", "deleted"].includes(status)) {
      fileFilters.parentStatus = status;
      videoFilters.parentStatus = status;
    }

    // 2. Fetch File documents if type includes images or pdfs
    let files = [];
    if (type === "all" || type === "image" || type === "pdf") {
      if (type === "image") {
        fileFilters.mimeType = { $regex: /^image\//i };
      } else if (type === "pdf") {
        fileFilters.mimeType = "application/pdf";
      }

      files = await File.find(fileFilters)
        .populate("uploadedBy", "name email color")
        .populate("taskId", "title keyId archived status")
        .lean();
    }

    // 3. Fetch VideoNote documents if type includes videos
    let videos = [];
    if (type === "all" || type === "video") {
      videos = await VideoNote.find(videoFilters)
        .populate("createdBy", "name email color")
        .populate("taskId", "title keyId archived status")
        .lean();
    }

    // 4. Normalize records to a unified schema
    const normalizedFiles = files.map((f) => {
      const isPdfFile =
        f.mimeType === "application/pdf" ||
        (f.originalName && f.originalName.toLowerCase().endsWith(".pdf"));
      const isImgFile =
        (f.mimeType && f.mimeType.startsWith("image/")) ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.originalName || "");

      const detectedType = isPdfFile ? "pdf" : isImgFile ? "image" : "other";

      return {
        _id: f._id,
        fileModel: "File",
        originalName: f.originalName,
        fileUrl: f.fileUrl,
        filePath: f.filePath,
        size: f.size || 0,
        sizeFormatted: formatBytes(f.size || 0),
        mimeType: f.mimeType,
        fileType: detectedType,
        parentStatus: f.parentStatus || (f.taskId?.archived ? "archived" : f.taskId ? "active" : "deleted"),
        markedForDeletionAt: f.markedForDeletionAt,
        createdAt: f.createdAt,
        task: f.taskId
          ? {
              _id: f.taskId._id,
              title: f.taskId.title,
              keyId: f.taskId.keyId,
              archived: f.taskId.archived,
              status: f.taskId.status,
            }
          : null,
        user: f.uploadedBy
          ? {
              _id: f.uploadedBy._id,
              name: f.uploadedBy.name,
              email: f.uploadedBy.email,
              color: f.uploadedBy.color || "#3B82F6",
            }
          : null,
      };
    });

    const normalizedVideos = videos.map((v) => ({
      _id: v._id,
      fileModel: "VideoNote",
      originalName: v.title,
      fileUrl: v.fileUrl,
      filePath: v.filePath,
      size: v.sizeBytes || 0,
      sizeFormatted: formatBytes(v.sizeBytes || 0),
      mimeType: v.mimeType || "video/webm",
      fileType: "video",
      durationSeconds: v.durationSeconds,
      parentStatus: v.parentStatus || (v.taskId?.archived ? "archived" : v.taskId ? "active" : "deleted"),
      markedForDeletionAt: v.markedForDeletionAt,
      createdAt: v.createdAt,
      task: v.taskId
        ? {
            _id: v.taskId._id,
            title: v.taskId.title,
            keyId: v.taskId.keyId,
            archived: v.taskId.archived,
            status: v.taskId.status,
          }
        : null,
      user: v.createdBy
        ? {
            _id: v.createdBy._id,
            name: v.createdBy.name,
            email: v.createdBy.email,
            color: v.createdBy.color || "#3B82F6",
          }
        : null,
    }));

    let allItems = [...normalizedFiles, ...normalizedVideos];

    // 5. Client search query filter (matches file name, task title, or task keyId)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      allItems = allItems.filter((item) => {
        const matchesName = item.originalName?.toLowerCase().includes(q);
        const matchesTask = item.task?.title?.toLowerCase().includes(q);
        const matchesKey = item.task?.keyId?.toLowerCase().includes(q);
        const matchesUser = item.user?.name?.toLowerCase().includes(q);
        return matchesName || matchesTask || matchesKey || matchesUser;
      });
    }

    // 6. Sorting
    allItems.sort((a, b) => {
      if (sort === "size_desc") return b.size - a.size;
      if (sort === "size_asc") return a.size - b.size;
      if (sort === "date_asc") return new Date(a.createdAt) - new Date(b.createdAt);
      // default: date_desc
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 7. Pagination
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / parsedLimit) || 1;
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginatedItems = allItems.slice(startIndex, startIndex + parsedLimit);

    res.status(200).json({
      files: paginatedItems,
      pagination: {
        total: totalItems,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in getStorageFiles:", error);
    res.status(500).json({ message: "Error al obtener la lista de archivos." });
  }
}

/**
 * DELETE /api/storage/files/:fileId
 * Delete a single file or video note physically from disk and database.
 * Access: Admin or Uploader / Owner
 */
export async function deleteStorageFile(req, res) {
  try {
    const { fileId } = req.params;

    // Check File collection first
    let fileDoc = await File.findById(fileId);
    let isVideo = false;

    if (!fileDoc) {
      fileDoc = await VideoNote.findById(fileId);
      if (fileDoc) {
        isVideo = true;
      }
    }

    if (!fileDoc) {
      return res.status(404).json({ message: "El archivo especificado no existe." });
    }

    // Authorization: admin or uploader
    const uploaderId = isVideo ? fileDoc.createdBy : fileDoc.uploadedBy;
    const isOwner =
      uploaderId && req.user && uploaderId.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "No tienes permiso para eliminar este archivo.",
      });
    }

    // Delete physical file from disk
    const filePath = resolveFsPath(fileDoc);
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn(`Could not delete physical file ${filePath}:`, err.message);
      }
    }

    if (isVideo) {
      // Remove checklist item in parent Note if linked
      if (fileDoc.taskId) {
        await Note.findByIdAndUpdate(fileDoc.taskId, {
          $pull: { checklist: { videoNoteId: fileDoc._id } },
        }).catch(() => {});
      }
      await VideoNote.findByIdAndDelete(fileId);
    } else {
      // Remove visual subtasks
      await Subtask.deleteMany({ "marker.fileId": fileDoc._id });
      await File.findByIdAndDelete(fileId);
    }

    res.status(200).json({
      message: "Archivo eliminado exitosamente del disco y de la base de datos.",
      fileId,
    });
  } catch (error) {
    console.error("Error in deleteStorageFile:", error);
    res.status(500).json({ message: "Error al eliminar el archivo." });
  }
}

/**
 * DELETE /api/storage/files/bulk-orphans
 * Delete all files marked as 'deleted' (orphans) from disk and database.
 * Access: Admin
 */
export async function bulkDeleteOrphanFiles(req, res) {
  try {
    // 1. Reconcile to ensure all deleted tasks have their files tagged
    await reconcileFilesLifecycle();

    // 2. Find all orphan files
    const orphanFiles = await File.find({ parentStatus: "deleted" });
    const orphanVideos = await VideoNote.find({ parentStatus: "deleted" });

    let deletedCount = 0;
    let freedBytes = 0;

    // Purge File orphans
    for (const file of orphanFiles) {
      const filePath = resolveFsPath(file);
      let size = file.size || 0;

      if (filePath && fs.existsSync(filePath)) {
        try {
          const stats = await fs.promises.stat(filePath);
          size = stats.size;
          await fs.promises.unlink(filePath);
        } catch (unlinkErr) {
          console.warn("Unlink error in bulk-orphans:", unlinkErr.message);
        }
      }

      await Subtask.deleteMany({ "marker.fileId": file._id });
      await File.findByIdAndDelete(file._id);
      deletedCount++;
      freedBytes += size;
    }

    // Purge VideoNote orphans
    for (const video of orphanVideos) {
      const filePath = resolveFsPath(video);
      let size = video.sizeBytes || 0;

      if (filePath && fs.existsSync(filePath)) {
        try {
          const stats = await fs.promises.stat(filePath);
          size = stats.size;
          await fs.promises.unlink(filePath);
        } catch (unlinkErr) {
          console.warn("Unlink error in bulk-orphans for video:", unlinkErr.message);
        }
      }

      if (video.taskId) {
        await Note.findByIdAndUpdate(video.taskId, {
          $pull: { checklist: { videoNoteId: video._id } },
        }).catch(() => {});
      }

      await VideoNote.findByIdAndDelete(video._id);
      deletedCount++;
      freedBytes += size;
    }

    res.status(200).json({
      message: "Archivos huérfanos eliminados correctamente.",
      deletedCount,
      freedBytes,
      freedFormatted: formatBytes(freedBytes),
    });
  } catch (error) {
    console.error("Error in bulkDeleteOrphanFiles:", error);
    res.status(500).json({ message: "Error al vaciar los archivos huérfanos." });
  }
}
