import BoardConfig from "../models/BoardConfig.js";
import Note from "../models/Note.js";

export async function getBoardConfig(req, res) {
  try {
    let boardConfig = await BoardConfig.findOne();
    if (!boardConfig) {
      boardConfig = await BoardConfig.create({ projectKey: "", taskCounter: 1 });
    }
    res.status(200).json(boardConfig);
  } catch (error) {
    console.error("Error in getBoardConfig controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBoardConfig(req, res) {
  try {
    const { projectKey, taskCounter } = req.body;
    let boardConfig = await BoardConfig.findOne();
    if (!boardConfig) {
      boardConfig = new BoardConfig();
    }

    const oldProjectKey = (boardConfig.projectKey || "").trim().toUpperCase();
    let oldPrefix = "";
    if (oldProjectKey) {
      oldPrefix = oldProjectKey.endsWith("-") ? oldProjectKey : `${oldProjectKey}-`;
    }

    if (projectKey !== undefined) {
      boardConfig.projectKey = projectKey.trim().toUpperCase();
    }
    if (taskCounter !== undefined && !isNaN(taskCounter)) {
      boardConfig.taskCounter = Math.max(1, Number(taskCounter));
    }

    const newProjectKey = (boardConfig.projectKey || "").trim().toUpperCase();
    let newPrefix = "";
    if (newProjectKey) {
      newPrefix = newProjectKey.endsWith("-") ? newProjectKey : `${newProjectKey}-`;
    }

    // Si hay una nueva clave, procesamos todas las tareas
    if (newProjectKey) {
      const allNotes = await Note.find().sort({ createdAt: 1 });
      let currentCounter = boardConfig.taskCounter || 1;
      let isModifiedCounter = false;

      for (const note of allNotes) {
        if (note.keyId && note.keyId.includes("-")) {
          // Ya tiene un ID, reemplazamos el prefijo manteniendo el número
          const parts = note.keyId.split("-");
          const num = parts[parts.length - 1];
          note.keyId = `${newPrefix}${num}`;
        } else {
          // No tiene ID, le asignamos uno nuevo consecutivo
          note.keyId = `${newPrefix}${currentCounter}`;
          currentCounter++;
          isModifiedCounter = true;
        }
        await note.save();
      }

      if (isModifiedCounter) {
        boardConfig.taskCounter = currentCounter;
      }
    }

    const savedConfig = await boardConfig.save();
    res.status(200).json(savedConfig);
  } catch (error) {
    console.error("Error in updateBoardConfig controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function assignExistingKeys(req, res) {
  try {
    let boardConfig = await BoardConfig.findOne();
    if (!boardConfig || !boardConfig.projectKey || !boardConfig.projectKey.trim()) {
      return res.status(400).json({ message: "Configura un nombre clave de proyecto primero." });
    }

    const rawKey = boardConfig.projectKey.trim().toUpperCase();
    const prefix = rawKey.endsWith("-") ? rawKey : `${rawKey}-`;
    let currentCounter = boardConfig.taskCounter || 1;

    const notesWithoutKey = await Note.find({
      $or: [{ keyId: { $exists: false } }, { keyId: null }, { keyId: "" }],
    }).sort({ createdAt: 1 });

    for (const note of notesWithoutKey) {
      note.keyId = `${prefix}${currentCounter}`;
      currentCounter++;
      await note.save();
    }

    boardConfig.taskCounter = currentCounter;
    await boardConfig.save();

    res.status(200).json({
      message: `Identificadores asignados exitosamente a ${notesWithoutKey.length} tareas.`,
      boardConfig,
      updatedCount: notesWithoutKey.length,
    });
  } catch (error) {
    console.error("Error in assignExistingKeys controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
