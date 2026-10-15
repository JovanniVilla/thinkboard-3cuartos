import Subtask from "../models/Subtask.js";
import Note from "../models/Note.js";
import File from "../models/File.js";

/**
 * Create a new subtask with optional visual marker coordinates.
 * POST /api/subtasks
 */
export const createSubtask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, parentTaskId, marker } =
      req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "El título de la subtarea es obligatorio." });
    }

    if (!parentTaskId) {
      return res.status(400).json({ message: "El ID de la tarea padre es obligatorio." });
    }

    // Verify parent note exists
    const note = await Note.findById(parentTaskId);
    if (!note) {
      return res.status(404).json({ message: "La tarea padre no fue encontrada." });
    }

    // If marker with fileId is provided, validate coordinate percentages
    if (marker && marker.fileId) {
      const file = await File.findById(marker.fileId);
      if (!file) {
        return res.status(404).json({ message: "El archivo vinculado al marcador no existe." });
      }

      if (
        marker.xPercent === undefined ||
        marker.xPercent === null ||
        isNaN(Number(marker.xPercent)) ||
        marker.yPercent === undefined ||
        marker.yPercent === null ||
        isNaN(Number(marker.yPercent))
      ) {
        return res.status(400).json({
          message: "Las coordenadas del marcador (xPercent e yPercent) son obligatorias si se vincula a un archivo.",
        });
      }
    }

    const subtask = new Subtask({
      title: title.trim(),
      description: description ? description.trim() : "",
      assignedTo: assignedTo || null,
      status: status || "pending",
      parentTaskId: note._id,
      marker: marker?.fileId
        ? {
            fileId: marker.fileId,
            pageNumber: Number(marker.pageNumber) || 1,
            xPercent: Math.max(0, Math.min(100, Number(marker.xPercent))),
            yPercent: Math.max(0, Math.min(100, Number(marker.yPercent))),
          }
        : undefined,
    });

    await subtask.save();
    await subtask.populate("assignedTo", "name email color");

    res.status(201).json({
      message: "Subtarea creada exitosamente",
      subtask,
    });
  } catch (error) {
    console.error("Error in createSubtask:", error);
    res.status(500).json({ message: "Error al crear la subtarea." });
  }
};

/**
 * Get all subtasks/pins associated with a specific file.
 * GET /api/files/:fileId/subtasks
 * Optional query: ?page=1
 */
export const getFileSubtasks = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { page, pageNumber } = req.query;

    const query = { "marker.fileId": fileId };

    const targetPage = pageNumber || page;
    if (targetPage !== undefined && targetPage !== null && targetPage !== "") {
      query["marker.pageNumber"] = Number(targetPage);
    }

    const subtasks = await Subtask.find(query)
      .populate("assignedTo", "name email color")
      .sort({ createdAt: 1 });

    res.status(200).json(subtasks);
  } catch (error) {
    console.error("Error in getFileSubtasks:", error);
    res.status(500).json({ message: "Error al obtener las subtareas del archivo." });
  }
};

/**
 * Get all subtasks for a task.
 * GET /api/tasks/:taskId/subtasks
 */
export const getTaskSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const subtasks = await Subtask.find({ parentTaskId: taskId })
      .populate("assignedTo", "name email color")
      .populate("marker.fileId", "originalName mimeType fileUrl")
      .sort({ createdAt: 1 });

    res.status(200).json(subtasks);
  } catch (error) {
    console.error("Error in getTaskSubtasks:", error);
    res.status(500).json({ message: "Error al obtener las subtareas de la tarea." });
  }
};

/**
 * Update an existing subtask (status, title, description, assignedTo, marker).
 * PATCH /api/subtasks/:subtaskId
 */
export const updateSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, description, assignedTo, status, marker } = req.body;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtarea no encontrada." });
    }

    if (title !== undefined) subtask.title = title.trim();
    if (description !== undefined) subtask.description = description.trim();
    if (assignedTo !== undefined) subtask.assignedTo = assignedTo || null;
    if (status !== undefined) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Estado de subtarea inválido." });
      }
      subtask.status = status;
    }

    if (marker) {
      if (marker.fileId !== undefined) subtask.marker.fileId = marker.fileId;
      if (marker.pageNumber !== undefined) subtask.marker.pageNumber = Number(marker.pageNumber);
      if (marker.xPercent !== undefined)
        subtask.marker.xPercent = Math.max(0, Math.min(100, Number(marker.xPercent)));
      if (marker.yPercent !== undefined)
        subtask.marker.yPercent = Math.max(0, Math.min(100, Number(marker.yPercent)));
    }

    await subtask.save();
    await subtask.populate("assignedTo", "name email color");

    res.status(200).json({
      message: "Subtarea actualizada exitosamente",
      subtask,
    });
  } catch (error) {
    console.error("Error in updateSubtask:", error);
    res.status(500).json({ message: "Error al actualizar la subtarea." });
  }
};

/**
 * Delete a subtask.
 * DELETE /api/subtasks/:subtaskId
 */
export const deleteSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await Subtask.findByIdAndDelete(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtarea no encontrada." });
    }

    res.status(200).json({ message: "Subtarea eliminada correctamente." });
  } catch (error) {
    console.error("Error in deleteSubtask:", error);
    res.status(500).json({ message: "Error al eliminar la subtarea." });
  }
};
