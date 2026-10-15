import fs from "fs";
import File from "../models/File.js";
import Note from "../models/Note.js";
import Subtask from "../models/Subtask.js";

/**
 * Upload a file attached to a task (Note).
 * POST /api/tasks/:taskId/files
 */
export const uploadTaskFile = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify parent task (Note) exists
    const note = await Note.findById(taskId);
    if (!note) {
      // If note not found, clean up uploaded file
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(404).json({ message: "La tarea padre no fue encontrada." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se recibió ningún archivo." });
    }

    const newFile = new File({
      taskId: note._id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileUrl: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      size: req.file.size,
      uploadedBy: req.user?._id || null,
    });

    await newFile.save();
    await newFile.populate("uploadedBy", "name email color");

    res.status(201).json({
      message: "Archivo subido exitosamente",
      file: newFile,
    });
  } catch (error) {
    console.error("Error in uploadTaskFile:", error);
    // Cleanup file if error occurred
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: "Error al guardar el archivo adjunto." });
  }
};

/**
 * Get all files attached to a task.
 * GET /api/tasks/:taskId/files
 */
export const getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;

    const files = await File.find({ taskId })
      .populate("uploadedBy", "name email color")
      .sort({ createdAt: -1 })
      .lean();

    // Attach subtask count to each file
    const fileIds = files.map((f) => f._id);
    const subtaskCounts = await Subtask.aggregate([
      { $match: { "marker.fileId": { $in: fileIds } } },
      { $group: { _id: "$marker.fileId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    subtaskCounts.forEach((sc) => {
      countMap[sc._id.toString()] = sc.count;
    });

    const filesWithCount = files.map((file) => ({
      ...file,
      subtaskCount: countMap[file._id.toString()] || 0,
    }));

    res.status(200).json(filesWithCount);
  } catch (error) {
    console.error("Error in getTaskFiles:", error);
    res.status(500).json({ message: "Error al obtener los archivos de la tarea." });
  }
};

/**
 * Get a single file by ID.
 * GET /api/files/:fileId
 */
export const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId).populate(
      "uploadedBy",
      "name email color"
    );

    if (!file) {
      return res.status(404).json({ message: "Archivo no encontrado." });
    }

    res.status(200).json(file);
  } catch (error) {
    console.error("Error in getFileById:", error);
    res.status(500).json({ message: "Error al obtener el archivo." });
  }
};

/**
 * Delete a file and its associated subtasks/pins.
 * DELETE /api/files/:fileId
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "Archivo no encontrado." });
    }

    // Delete associated subtasks / pins
    await Subtask.deleteMany({ "marker.fileId": file._id });

    // Remove physical file from disk
    if (file.filePath && fs.existsSync(file.filePath)) {
      try {
        await fs.promises.unlink(file.filePath);
      } catch (err) {
        console.warn("Could not delete physical file:", file.filePath, err.message);
      }
    }

    // Delete file document
    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      message: "Archivo y sus subtareas asociadas eliminados correctamente.",
    });
  } catch (error) {
    console.error("Error in deleteFile:", error);
    res.status(500).json({ message: "Error al eliminar el archivo." });
  }
};
