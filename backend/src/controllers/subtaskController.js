import Subtask from "../models/Subtask.js";
import Note from "../models/Note.js";
import File from "../models/File.js";

/**
 * Create a new subtask with optional visual marker coordinates.
 * Automatically synchronizes with the parent Note's checklist.
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

    // Automatically sync pin as an item in parent Note's checklist
    const checklistItemId = subtask._id.toString();
    const checklistItem = {
      id: checklistItemId,
      title: subtask.title,
      completed: subtask.status === "completed",
      subtaskId: subtask._id,
      fileId: subtask.marker?.fileId || null,
      pageNumber: subtask.marker?.pageNumber || 1,
    };

    subtask.checklistId = checklistItemId;
    await subtask.save();

    await Note.findByIdAndUpdate(note._id, {
      $push: { checklist: checklistItem },
    });

    await subtask.populate("assignedTo", "name email color");

    res.status(201).json({
      message: "Subtarea creada y agregada al checklist exitosamente",
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
      .populate("comments.user", "name email color")
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
      .populate("comments.user", "name email color")
      .sort({ createdAt: 1 });

    res.status(200).json(subtasks);
  } catch (error) {
    console.error("Error in getTaskSubtasks:", error);
    res.status(500).json({ message: "Error al obtener las subtareas de la tarea." });
  }
};

/**
 * Update an existing subtask (status, title, description, assignedTo, marker).
 * Synchronizes title and completed state to the parent Note's checklist.
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

    // Sincronizar título y estado en el checklist de la Note padre
    await Note.updateOne(
      {
        _id: subtask.parentTaskId,
        $or: [
          { "checklist.subtaskId": subtask._id },
          { "checklist.id": subtask._id.toString() },
          ...(subtask.checklistId ? [{ "checklist.id": subtask.checklistId }] : []),
        ],
      },
      {
        $set: {
          "checklist.$.title": subtask.title,
          "checklist.$.completed": subtask.status === "completed",
        },
      }
    );

    await subtask.populate("assignedTo", "name email color");
    await subtask.populate("comments.user", "name email color");

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
 * Delete a subtask and remove it from parent Note's checklist.
 * DELETE /api/subtasks/:subtaskId
 */
export const deleteSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtarea no encontrada." });
    }

    // Remover el ítem del checklist en la Note padre
    await Note.updateOne(
      { _id: subtask.parentTaskId },
      {
        $pull: {
          checklist: {
            $or: [
              { subtaskId: subtask._id },
              { id: subtask._id.toString() },
              ...(subtask.checklistId ? [{ id: subtask.checklistId }] : []),
            ],
          },
        },
      }
    );

    await Subtask.findByIdAndDelete(subtaskId);

    res.status(200).json({
      message: "Subtarea eliminada y retirada del checklist correctamente.",
    });
  } catch (error) {
    console.error("Error in deleteSubtask:", error);
    res.status(500).json({ message: "Error al eliminar la subtarea." });
  }
};

/**
 * Add a comment or doubt to a subtask pin.
 * POST /api/subtasks/:subtaskId/comments
 */
export const addSubtaskComment = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "El texto del comentario o duda es obligatorio." });
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtarea no encontrada." });
    }

    const userName = req.user?.name || "Usuario";
    const userColor = req.user?.color || "#3B82F6";

    const newComment = {
      user: req.user?._id || null,
      userName,
      userColor,
      text: text.trim(),
      createdAt: new Date(),
    };

    subtask.comments.push(newComment);
    await subtask.save();

    // Registrar en activities de la Note padre para visibilidad de equipo
    const cleanText = text.trim();
    const preview =
      cleanText.length > 80 ? `${cleanText.substring(0, 80)}...` : cleanText;
    const activityText = `💬 ${userName} comentó en el marcador "${subtask.title}": "${preview}"`;

    await Note.findByIdAndUpdate(subtask.parentTaskId, {
      $push: {
        activities: {
          id: Date.now().toString(),
          type: "comment",
          text: activityText,
          user: userName,
          createdAt: new Date(),
        },
      },
    });

    await subtask.populate("assignedTo", "name email color");
    await subtask.populate("comments.user", "name email color");

    res.status(201).json({
      message: "Comentario agregado exitosamente",
      subtask,
      comment: subtask.comments[subtask.comments.length - 1],
    });
  } catch (error) {
    console.error("Error in addSubtaskComment:", error);
    res.status(500).json({ message: "Error al agregar el comentario a la subtarea." });
  }
};

/**
 * Delete a comment from a subtask pin.
 * DELETE /api/subtasks/:subtaskId/comments/:commentId
 */
export const deleteSubtaskComment = async (req, res) => {
  try {
    const { subtaskId, commentId } = req.params;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtarea no encontrada." });
    }

    const comment = subtask.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado." });
    }

    // Solo el autor o un admin puede eliminar el comentario
    const isAuthor =
      req.user && comment.user && comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar este comentario." });
    }

    subtask.comments.pull(commentId);
    await subtask.save();

    await subtask.populate("assignedTo", "name email color");
    await subtask.populate("comments.user", "name email color");

    res.status(200).json({
      message: "Comentario eliminado exitosamente",
      subtask,
    });
  } catch (error) {
    console.error("Error in deleteSubtaskComment:", error);
    res.status(500).json({ message: "Error al eliminar el comentario." });
  }
};
