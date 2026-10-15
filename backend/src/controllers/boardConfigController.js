import BoardConfig from "../models/BoardConfig.js";
import Note from "../models/Note.js";
import Project from "../models/Project.js";

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
    const { projectKey, taskCounter, driveFolderLink, projectName } = req.body;
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
    if (driveFolderLink !== undefined) {
      boardConfig.driveFolderLink = driveFolderLink.trim();
    }
    if (projectName !== undefined) {
      boardConfig.projectName = projectName.trim().substring(0, 25);
    }

    const newProjectKey = (boardConfig.projectKey || "").trim().toUpperCase();
    let newPrefix = "";
    if (newProjectKey) {
      newPrefix = newProjectKey.endsWith("-") ? newProjectKey : `${newProjectKey}-`;
    }

    // Si hay una nueva clave global de tablero, actualizamos el globalKeyId de las notas
    if (newProjectKey) {
      const allNotes = await Note.find().sort({ createdAt: 1 });
      let currentCounter = boardConfig.taskCounter || 1;
      let isModifiedCounter = false;

      for (const note of allNotes) {
        if (note.globalKeyId && note.globalKeyId.includes("-")) {
          // Ya tiene un ID global, reemplazamos el prefijo manteniendo el número
          const parts = note.globalKeyId.split("-");
          const num = parts[parts.length - 1];
          note.globalKeyId = `${newPrefix}${num}`;
        } else if (note.keyId && !note.project && note.keyId.includes("-")) {
          // Caso legacy: tenía keyId general
          const parts = note.keyId.split("-");
          const num = parts[parts.length - 1];
          note.globalKeyId = `${newPrefix}${num}`;
        } else {
          // No tiene ID global, le asignamos uno nuevo consecutivo
          note.globalKeyId = `${newPrefix}${currentCounter}`;
          currentCounter++;
          isModifiedCounter = true;
        }

        // Si la nota no tiene projectKeyId, su keyId visible es el global
        if (!note.projectKeyId) {
          note.keyId = note.globalKeyId;
        } else {
          note.keyId = note.projectKeyId;
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

    const allNotes = await Note.find().sort({ createdAt: 1 });
    let updatedCount = 0;

    for (const note of allNotes) {
      let changed = false;

      // 1. Asignar globalKeyId si falta
      if (!note.globalKeyId) {
        if (note.keyId && !note.project && note.keyId.includes("-")) {
          note.globalKeyId = note.keyId;
        } else {
          note.globalKeyId = `${prefix}${currentCounter}`;
          currentCounter++;
        }
        changed = true;
      }

      // 2. Asignar projectKeyId si tiene proyecto con clave y no lo tiene
      if (note.project && !note.projectKeyId) {
        const proj = await Project.findById(note.project);
        if (proj && proj.projectKey && proj.projectKey.trim()) {
          const projRaw = proj.projectKey.trim().toUpperCase();
          const projPrefix = projRaw.endsWith("-") ? projRaw : `${projRaw}-`;
          const pCounter = proj.taskCounter || 1;
          note.projectKeyId = `${projPrefix}${pCounter}`;
          proj.taskCounter = pCounter + 1;
          await proj.save();
          changed = true;
        }
      }

      // 3. Sincronizar keyId
      const targetKeyId = note.projectKeyId || note.globalKeyId;
      if (note.keyId !== targetKeyId) {
        note.keyId = targetKeyId;
        changed = true;
      }

      if (changed) {
        await note.save();
        updatedCount++;
      }
    }

    boardConfig.taskCounter = currentCounter;
    await boardConfig.save();

    res.status(200).json({
      message: `Identificadores asignados y sincronizados exitosamente a ${updatedCount} tareas.`,
      boardConfig,
      updatedCount,
    });
  } catch (error) {
    console.error("Error in assignExistingKeys controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
