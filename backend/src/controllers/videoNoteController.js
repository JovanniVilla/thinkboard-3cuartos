import fs from "fs";
import path from "path";
import VideoNote from "../models/VideoNote.js";
import Note from "../models/Note.js";
import Subtask from "../models/Subtask.js";
import { UPLOADS_DIR, VIDEOS_UPLOADS_DIR } from "../middleware/upload.js";

/**
 * Upload a Video Note attached to a task (Note).
 * POST /api/tasks/:taskId/video-notes or POST /api/notes/:taskId/video-notes
 */
export const uploadVideoNote = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, durationSeconds, subtaskId } = req.body;

    // Verify parent task (Note) exists
    const note = await Note.findById(taskId);
    if (!note) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ message: "La tarea padre no fue encontrada." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo de video." });
    }

    const duration = Math.max(0, parseInt(durationSeconds, 10) || 0);
    const cleanTitle = (title && title.trim()) || `Video Nota - ${new Date().toLocaleDateString("es-ES")}`;

    const newVideoNote = new VideoNote({
      taskId: note._id,
      title: cleanTitle,
      fileUrl: `/uploads/videos/${req.file.filename}`,
      filePath: req.file.path,
      durationSeconds: duration,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype || "video/webm",
      subtaskId: subtaskId || null,
      createdBy: req.user?._id || null,
      parentStatus: note.archived ? "archived" : "active",
      markedForDeletionAt: null,
    });

    await newVideoNote.save();
    await newVideoNote.populate("createdBy", "name email color");

    // Format duration MM:SS
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    const formattedDuration = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const actor = req.user?.name || "Usuario";

    // Add activity record in Note
    note.activities.push({
      id: Date.now().toString(),
      type: "comment",
      text: `🎥 **Video Nota grabada:** [${cleanTitle}](${newVideoNote.fileUrl}) (${formattedDuration})`,
      user: actor,
      createdAt: new Date(),
    });

    // Add Video Note to the main checklist of the Note
    note.checklist.push({
      id: Date.now().toString(),
      title: `🎥 Video Nota: ${cleanTitle}`,
      completed: false,
      videoNoteId: newVideoNote._id,
      subtaskId: subtaskId || null,
    });

    await note.save();

    // If linked to a subtask, also log in subtask comments
    if (subtaskId) {
      try {
        await Subtask.findByIdAndUpdate(subtaskId, {
          $push: {
            comments: {
              user: req.user?._id || null,
              userName: actor,
              userColor: req.user?.color || "#3B82F6",
              text: `🎥 Video Nota adjunta: "${cleanTitle}" (${formattedDuration})`,
              createdAt: new Date(),
            },
          },
        });
      } catch (subErr) {
        console.warn("Could not attach comment to subtask:", subErr);
      }
    }

    res.status(201).json({
      message: "Video nota subida exitosamente",
      videoNote: newVideoNote,
    });
  } catch (error) {
    console.error("Error in uploadVideoNote controller:", error);
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: "Error al guardar la video nota." });
  }
};

/**
 * Get all video notes attached to a task.
 * GET /api/tasks/:taskId/video-notes or GET /api/notes/:taskId/video-notes
 */
export const getVideoNotesByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const videoNotes = await VideoNote.find({ taskId })
      .populate("createdBy", "name email color")
      .populate("subtaskId", "title marker")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(videoNotes);
  } catch (error) {
    console.error("Error in getVideoNotesByTask:", error);
    res.status(500).json({ message: "Error al obtener las video notas de la tarea." });
  }
};

/**
 * Get a single video note by ID.
 * GET /api/video-notes/:id
 */
export const getVideoNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const videoNote = await VideoNote.findById(id)
      .populate("createdBy", "name email color")
      .populate("subtaskId", "title marker");

    if (!videoNote) {
      return res.status(404).json({ message: "Video nota no encontrada." });
    }

    res.status(200).json(videoNote);
  } catch (error) {
    console.error("Error in getVideoNoteById:", error);
    res.status(500).json({ message: "Error al obtener la video nota." });
  }
};

/**
 * Stream a video note with full HTTP Range request support (206 Partial Content).
 * GET /api/video-notes/:id/stream
 */
export const streamVideoNote = async (req, res) => {
  try {
    const { id } = req.params;
    const videoNote = await VideoNote.findById(id);
    if (!videoNote) {
      return res.status(404).json({ message: "Video nota no encontrada." });
    }

    // Resolve file path on disk (check recorded path and both directory fallbacks)
    let targetPath = videoNote.filePath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      targetPath = path.join(VIDEOS_UPLOADS_DIR, path.basename(videoNote.fileUrl));
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.join(UPLOADS_DIR, path.basename(videoNote.fileUrl));
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve(process.cwd(), `.${videoNote.fileUrl}`);
    }

    if (!fs.existsSync(targetPath)) {
      console.warn("Video file not found at:", targetPath);
      return res.status(404).json({ message: "Archivo de video no encontrado en el servidor." });
    }

    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const isMp4 = targetPath.toLowerCase().endsWith(".mp4");
    const contentType = isMp4 ? "video/mp4" : "video/webm";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true",
      };
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true",
      };
      res.writeHead(200, head);
      fs.createReadStream(targetPath).pipe(res);
    }
  } catch (error) {
    console.error("Error in streamVideoNote:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error al transmitir el video." });
    }
  }
};

/**
 * Delete a video note by ID.
 * DELETE /api/video-notes/:id
 */
export const deleteVideoNote = async (req, res) => {
  try {
    const { id } = req.params;

    const videoNote = await VideoNote.findById(id);
    if (!videoNote) {
      return res.status(404).json({ message: "Video nota no encontrada." });
    }

    // Authorization: only the creator or admin can delete
    const isOwner =
      videoNote.createdBy &&
      req.user &&
      videoNote.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta video nota." });
    }

    // Delete file from disk if path is tracked
    if (videoNote.filePath && fs.existsSync(videoNote.filePath)) {
      fs.unlink(videoNote.filePath, (err) => {
        if (err) console.error("Error unlinking video file:", err);
      });
    }

    // Log deletion activity and remove checklist item in parent note
    const actor = req.user?.name || "Usuario";
    await Note.findByIdAndUpdate(videoNote.taskId, {
      $pull: { checklist: { videoNoteId: videoNote._id } },
      $push: {
        activities: {
          id: Date.now().toString(),
          type: "action",
          text: `${actor} eliminó la video nota "${videoNote.title}"`,
          user: actor,
          createdAt: new Date(),
        },
      },
    });

    await VideoNote.findByIdAndDelete(id);

    res.status(200).json({ message: "Video nota eliminada exitosamente." });
  } catch (error) {
    console.error("Error in deleteVideoNote:", error);
    res.status(500).json({ message: "Error al eliminar la video nota." });
  }
};

/**
 * Update the status of a video note (e.g. 'pending' | 'resolved').
 * PATCH /api/video-notes/:id/status or PATCH /api/video-notes/:id
 */
export const updateVideoNoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "resolved"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Estado inválido. Debe ser 'pending' o 'resolved'." });
    }

    const videoNote = await VideoNote.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("createdBy", "name email color");

    if (!videoNote) {
      return res.status(404).json({ message: "Video nota no encontrada." });
    }

    const isCompleted = status === "resolved";

    // Synchronize parent Note checklist
    await Note.updateOne(
      { _id: videoNote.taskId, "checklist.videoNoteId": videoNote._id },
      { $set: { "checklist.$.completed": isCompleted } }
    );

    // Log action in Note activities
    const actor = req.user?.name || "Usuario";
    const statusLabel = isCompleted ? "resuelta" : "pendiente";
    await Note.findByIdAndUpdate(videoNote.taskId, {
      $push: {
        activities: {
          id: Date.now().toString(),
          type: "action",
          text: `${actor} marcó la video nota "${videoNote.title}" como ${statusLabel}`,
          user: actor,
          createdAt: new Date(),
        },
      },
    });

    res.status(200).json({
      message: `Video nota marcada como ${statusLabel}`,
      videoNote,
    });
  } catch (error) {
    console.error("Error in updateVideoNoteStatus:", error);
    res.status(500).json({ message: "Error al actualizar el estado de la video nota." });
  }
};
