import mongoose from "mongoose";
import TimeEntry from "../models/TimeEntry.js";
import Note from "../models/Note.js";
import { syncNoteTimeSpent } from "../utils/timeSync.js";

/**
 * Retorna los temporizadores actualmente activos (RUNNING) del usuario autenticado
 * junto con el tiempo global acumulado en el día de hoy.
 */
export async function getActiveTimers(req, res) {
  try {
    const userId = req.user._id;

    // Buscar temporizadores en ejecución
    const runningEntries = await TimeEntry.find({
      userId,
      status: "RUNNING",
    })
      .populate("noteId", "title project keyId globalKeyId")
      .populate("projectId", "name projectKey color")
      .sort({ startedAt: -1 });

    // Calcular el inicio del día local / UTC (00:00:00)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Sumar el tiempo de las entradas GLOBAL finalizadas de hoy
    const globalAggregation = await TimeEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "GLOBAL",
          startedAt: { $gte: startOfToday },
          endedAt: { $ne: null },
        },
      },
      {
        $project: {
          durationMs: {
            $max: [{ $subtract: ["$endedAt", "$startedAt"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMs: { $sum: "$durationMs" },
        },
      },
    ]);

    let todayGlobalSeconds = Math.floor((globalAggregation[0]?.totalMs || 0) / 1000);

    // Si hay un temporizador GLOBAL en ejecución, sumar los segundos transcurridos
    const runningGlobal = runningEntries.find((e) => e.type === "GLOBAL");
    if (runningGlobal) {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(runningGlobal.startedAt).getTime()) / 1000));
      todayGlobalSeconds += elapsed;
    }

    res.json({
      running: runningEntries,
      todayGlobalSeconds,
      serverTime: new Date(),
    });
  } catch (error) {
    console.error("Error en getActiveTimers:", error);
    res.status(500).json({ message: "Error al obtener temporizadores activos" });
  }
}

/**
 * Inicia un temporizador (GLOBAL o NOTE).
 * Si es NOTE, pausa automáticamente cualquier otro temporizador de NOTE en ejecución del mismo usuario.
 */
export async function startTimer(req, res) {
  try {
    const userId = req.user._id;
    const { type, noteId } = req.body;

    if (!type || !["GLOBAL", "NOTE"].includes(type)) {
      return res.status(400).json({ message: "Tipo de temporizador inválido. Debe ser 'GLOBAL' o 'NOTE'" });
    }

    const now = new Date();
    let projectId = null;

    if (type === "NOTE") {
      if (!noteId) {
        return res.status(400).json({ message: "El noteId es requerido para temporizadores de tipo NOTE" });
      }

      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Nota no encontrada" });
      }
      projectId = note.project || null;

      // Exclusión mutua: Pausar cualquier otro temporizador de NOTE activo para este usuario
      const activeNotes = await TimeEntry.find({
        userId,
        type: "NOTE",
        status: "RUNNING",
      });

      for (const entry of activeNotes) {
        entry.endedAt = now;
        entry.status = "PAUSED";
        await entry.save();
        if (entry.noteId) {
          await syncNoteTimeSpent(entry.noteId);
        }
      }
    } else {
      // Si es GLOBAL, verificar si ya existe uno en ejecución
      const existingGlobal = await TimeEntry.findOne({
        userId,
        type: "GLOBAL",
        status: "RUNNING",
      });

      if (existingGlobal) {
        return res.status(200).json(existingGlobal);
      }
    }

    // Crear la nueva entrada
    const newEntry = new TimeEntry({
      userId,
      type,
      noteId: type === "NOTE" ? noteId : null,
      projectId,
      startedAt: now,
      lastPingAt: now,
      status: "RUNNING",
    });

    await newEntry.save();

    const populated = await TimeEntry.findById(newEntry._id)
      .populate("noteId", "title project keyId globalKeyId")
      .populate("projectId", "name projectKey color");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error en startTimer:", error);
    res.status(500).json({ message: "Error al iniciar temporizador" });
  }
}

/**
 * Pausa un temporizador activo especificado por su ID.
 * Permite recibir customEndedAt (ej. al disparar por inactividad).
 */
export async function pauseTimer(req, res) {
  try {
    const userId = req.user._id;
    const { entryId, customEndedAt } = req.body;

    if (!entryId) {
      return res.status(400).json({ message: "entryId es requerido" });
    }

    const entry = await TimeEntry.findOne({
      _id: entryId,
      userId,
    });

    if (!entry) {
      return res.status(404).json({ message: "Temporizador no encontrado o no pertenece al usuario" });
    }

    if (entry.status !== "RUNNING") {
      return res.status(200).json({
        id: entry._id,
        status: entry.status,
        ended_at: entry.endedAt,
        message: "El temporizador ya no estaba en ejecución",
      });
    }

    let end = customEndedAt ? new Date(customEndedAt) : new Date();
    // Validar que endedAt no sea anterior a startedAt
    if (end < entry.startedAt) {
      end = entry.startedAt;
    }

    entry.endedAt = end;
    entry.status = "PAUSED";
    await entry.save();

    if (entry.type === "NOTE" && entry.noteId) {
      await syncNoteTimeSpent(entry.noteId);
    }

    const durationSeconds = Math.max(0, Math.floor((entry.endedAt - entry.startedAt) / 1000));

    res.json({
      id: entry._id,
      status: "PAUSED",
      ended_at: entry.endedAt,
      duration_seconds: durationSeconds,
    });
  } catch (error) {
    console.error("Error en pauseTimer:", error);
    res.status(500).json({ message: "Error al pausar temporizador" });
  }
}

/**
 * Recibe señales periódicas de heartbeat cada 30s para mantener vivas las sesiones activas.
 */
export async function heartbeat(req, res) {
  try {
    const userId = req.user._id;
    const { activeEntryIds } = req.body;

    if (!Array.isArray(activeEntryIds) || activeEntryIds.length === 0) {
      return res.json({ status: "ACK", updated: 0, server_time: new Date() });
    }

    const now = new Date();
    // Validación estricta de propiedad
    const result = await TimeEntry.updateMany(
      {
        _id: { $in: activeEntryIds },
        userId,
        status: "RUNNING",
      },
      {
        $set: { lastPingAt: now },
      }
    );

    res.json({
      status: "ACK",
      updated: result.modifiedCount,
      server_time: now,
    });
  } catch (error) {
    console.error("Error en heartbeat:", error);
    res.status(500).json({ message: "Error en procesamiento de heartbeat" });
  }
}

/**
 * Cierre 'graceful' compatible con navigator.sendBeacon para beforeunload / visibilidad.
 */
export async function beaconStop(req, res) {
  try {
    const userId = req.user._id;
    let entryIds = [];

    // Manejar payloads en JSON o strings
    if (req.body?.entryIds && Array.isArray(req.body.entryIds)) {
      entryIds = req.body.entryIds;
    } else if (req.body?.entryId) {
      entryIds = [req.body.entryId];
    } else if (typeof req.body === "string") {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed.entryIds) entryIds = parsed.entryIds;
        else if (parsed.entryId) entryIds = [parsed.entryId];
      } catch {
        // Ignorar error de parsing
      }
    }

    const now = new Date();

    const query = {
      userId,
      status: "RUNNING",
    };

    if (entryIds.length > 0) {
      query._id = { $in: entryIds };
    }

    const running = await TimeEntry.find(query);
    for (const entry of running) {
      entry.endedAt = now;
      entry.status = "PAUSED";
      await entry.save();
      if (entry.type === "NOTE" && entry.noteId) {
        await syncNoteTimeSpent(entry.noteId);
      }
    }

    res.status(200).json({ status: "STOPPED", count: running.length });
  } catch (error) {
    console.error("Error en beaconStop:", error);
    res.status(500).json({ message: "Error al detener por beacon" });
  }
}

/**
 * Estadísticas de tiempo acumulado para una nota específica.
 */
export async function getNoteTimeStats(req, res) {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de nota inválido" });
    }

    const objectId = new mongoose.Types.ObjectId(noteId);

    // Sumar todos los intervalos completados de la nota
    const totalAggregation = await TimeEntry.aggregate([
      {
        $match: {
          noteId: objectId,
          endedAt: { $ne: null },
        },
      },
      {
        $project: {
          durationMs: {
            $max: [{ $subtract: ["$endedAt", "$startedAt"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMs: { $sum: "$durationMs" },
          entriesCount: { $sum: 1 },
        },
      },
    ]);

    const totalSeconds = Math.floor((totalAggregation[0]?.totalMs || 0) / 1000);
    const entriesCount = totalAggregation[0]?.entriesCount || 0;

    // Verificar si el usuario actual tiene este temporizador corriendo
    const currentRunning = await TimeEntry.findOne({
      noteId: objectId,
      userId,
      status: "RUNNING",
    });

    res.json({
      noteId,
      totalSeconds,
      entriesCount,
      isRunningForUser: !!currentRunning,
      currentRunningEntry: currentRunning || null,
    });
  } catch (error) {
    console.error("Error en getNoteTimeStats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas de la nota" });
  }
}
