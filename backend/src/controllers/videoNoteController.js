import fs from "fs";
import VideoNote from "../models/VideoNote.js";
import Note from "../models/Note.js";
import Subtask from "../models/Subtask.js";

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

    // Log deletion activity in parent note
    const actor = req.user?.name || "Usuario";
    await Note.findByIdAndUpdate(videoNote.taskId, {
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
