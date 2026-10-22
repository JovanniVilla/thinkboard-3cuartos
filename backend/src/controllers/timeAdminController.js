import mongoose from "mongoose";
import TimeEntry from "../models/TimeEntry.js";
import UserDailyGoal from "../models/UserDailyGoal.js";
import TimeEntryAudit from "../models/TimeEntryAudit.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import { syncNoteTimeSpent } from "../utils/timeSync.js";

/**
 * Reporte diario consolidado de horas y cumplimiento por usuario.
 * Query params: date (YYYY-MM-DD), userId (opcional).
 */
export async function getDailyReport(req, res) {
  try {
    const { date, userId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    // Normalizar a inicio y fin del día UTC
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Determinar día de la semana (1 = Lunes, 7 = Domingo)
    // getUTCDay() devuelve 0 (Domingo) a 6 (Sábado)
    const dayOfWeek = startOfDay.getUTCDay() === 0 ? 7 : startOfDay.getUTCDay();

    // Filtro de usuarios
    const userQuery = { isApproved: true };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userQuery._id = new mongoose.Types.ObjectId(userId);
    }

    const users = await User.find(userQuery).select("name email role color jobTitle");

    const reports = [];

    for (const u of users) {
      // 1. Obtener meta del usuario para este día de la semana
      const goal = await UserDailyGoal.findOne({
        userId: u._id,
        dayOfWeek,
      });

      // Valor por defecto: 8 horas (28800s) Lunes-Viernes, 0 para Sábado y Domingo
      const defaultSeconds = dayOfWeek >= 1 && dayOfWeek <= 5 ? 28800 : 0;
      const targetSeconds = goal ? goal.targetSeconds : defaultSeconds;

      // Purgar registros sub-3-segundo ya finalizados para mantener limpio el historial
      await TimeEntry.deleteMany({
        userId: u._id,
        status: { $in: ["PAUSED", "CLOSED_BY_TIMEOUT"] },
        endedAt: { $ne: null },
        $expr: {
          $lt: [{ $subtract: ["$endedAt", "$startedAt"] }, 3000],
        },
      }).catch(() => {});

      // 2. Obtener todas las entradas de tiempo en el rango del día
      const entries = await TimeEntry.find({
        userId: u._id,
        startedAt: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate("noteId", "title project keyId globalKeyId")
        .populate("projectId", "name projectKey color")
        .sort({ startedAt: 1 });

      let trackedGlobalSeconds = 0;
      let trackedNotesSeconds = 0;

      const formattedEntries = entries
        .map((entry) => {
          const endTime = entry.endedAt
            ? new Date(entry.endedAt)
            : entry.status === "RUNNING"
            ? new Date()
            : entry.lastPingAt;
          const durationSeconds = Math.max(0, Math.floor((endTime - new Date(entry.startedAt)) / 1000));

          if (entry.type === "GLOBAL") {
            trackedGlobalSeconds += durationSeconds;
          } else if (entry.type === "NOTE") {
            trackedNotesSeconds += durationSeconds;
          }

          return {
            id: entry._id,
            type: entry.type,
            note_id: entry.noteId?._id || null,
            note_title: entry.noteId?.title || null,
            note_key: entry.noteId?.keyId || entry.noteId?.globalKeyId || null,
            project_id: entry.projectId?._id || null,
            project_name: entry.projectId?.name || "Sin proyecto",
            started_at: entry.startedAt,
            ended_at: entry.endedAt,
            status: entry.status,
            duration_seconds: durationSeconds,
          };
        })
        .filter((entry) => entry.status === "RUNNING" || entry.duration_seconds >= 3);

      const idleSeconds = Math.max(0, trackedGlobalSeconds - trackedNotesSeconds);
      const compliancePercentage =
        targetSeconds > 0
          ? Number(((trackedGlobalSeconds / targetSeconds) * 100).toFixed(2))
          : trackedGlobalSeconds > 0
          ? 100
          : 0;

      reports.push({
        date: startOfDay.toISOString().split("T")[0],
        day_of_week: dayOfWeek,
        user: {
          id: u._id,
          name: u.name,
          email: u.email,
          color: u.color,
          job_title: u.jobTitle,
        },
        target_seconds: targetSeconds,
        tracked_global_seconds: trackedGlobalSeconds,
        tracked_notes_seconds: trackedNotesSeconds,
        idle_seconds: idleSeconds,
        compliance_percentage: compliancePercentage,
        entries: formattedEntries,
      });
    }

    res.json({
      date: startOfDay.toISOString().split("T")[0],
      reports,
    });
  } catch (error) {
    console.error("Error en getDailyReport:", error);
    res.status(500).json({ message: "Error al generar reporte diario" });
  }
}

/**
 * Obtiene la configuración de metas semanales de un usuario.
 */
export async function getUserGoals(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const goals = await UserDailyGoal.find({ userId }).sort({ dayOfWeek: 1 });

    // Armar estructura para los 7 días (1 = Lunes a 7 = Domingo)
    const result = [];
    for (let day = 1; day <= 7; day++) {
      const existing = goals.find((g) => g.dayOfWeek === day);
      const defaultSec = day >= 1 && day <= 5 ? 28800 : 0;
      result.push({
        dayOfWeek: day,
        targetSeconds: existing ? existing.targetSeconds : defaultSec,
        id: existing?._id || null,
      });
    }

    res.json({ userId, goals: result });
  } catch (error) {
    console.error("Error en getUserGoals:", error);
    res.status(500).json({ message: "Error al obtener metas del usuario" });
  }
}

/**
 * Actualiza o asigna las metas semanales de un usuario.
 */
export async function setUserGoals(req, res) {
  try {
    const { userId } = req.params;
    const { goals } = req.body; // Array de { dayOfWeek, targetSeconds }
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    if (!Array.isArray(goals)) {
      return res.status(400).json({ message: "Formato de metas inválido" });
    }

    for (const item of goals) {
      if (item.dayOfWeek >= 1 && item.dayOfWeek <= 7) {
        await UserDailyGoal.findOneAndUpdate(
          { userId, dayOfWeek: item.dayOfWeek },
          {
            userId,
            dayOfWeek: item.dayOfWeek,
            targetSeconds: Number(item.targetSeconds) || 0,
            createdBy: adminId,
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ message: "Metas actualizadas con éxito" });
  } catch (error) {
    console.error("Error en setUserGoals:", error);
    res.status(500).json({ message: "Error al guardar metas del usuario" });
  }
}

/**
 * Modificación manual administrativa de un intervalo con registro inmutable de auditoría.
 */
export async function updateTimeEntry(req, res) {
  try {
    const { id } = req.params;
    const { started_at, ended_at, reason } = req.body;
    const adminId = req.user._id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "La justificación (reason) es obligatoria para modificar un registro de tiempo" });
    }

    const entry = await TimeEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: "Entrada de tiempo no encontrada" });
    }

    const newStart = started_at ? new Date(started_at) : entry.startedAt;
    const newEnd = ended_at ? new Date(ended_at) : entry.endedAt;

    if (newEnd && newEnd < newStart) {
      return res.status(400).json({ message: "La fecha de fin no puede ser anterior a la de inicio" });
    }

    // Registrar en auditoría
    const audit = new TimeEntryAudit({
      timeEntryId: entry._id,
      adminId,
      previousStartedAt: entry.startedAt,
      previousEndedAt: entry.endedAt,
      newStartedAt: newStart,
      newEndedAt: newEnd,
      reason: reason.trim(),
    });
    await audit.save();

    // Actualizar la entrada
    entry.startedAt = newStart;
    entry.endedAt = newEnd;
    entry.status = "EDITED";
    await entry.save();

    if (entry.type === "NOTE" && entry.noteId) {
      await syncNoteTimeSpent(entry.noteId);
    }

    res.json({
      status: "UPDATED",
      entry_id: entry._id,
      audit_id: audit._id,
    });
  } catch (error) {
    console.error("Error en updateTimeEntry:", error);
    res.status(500).json({ message: "Error al actualizar entrada de tiempo" });
  }
}

/**
 * Inserción manual de un bloque de tiempo por olvido del usuario.
 */
export async function createManualTimeEntry(req, res) {
  try {
    const { userId, type, noteId, startedAt, endedAt, reason } = req.body;
    const adminId = req.user._id;

    if (!userId || !type || !startedAt || !endedAt || !reason?.trim()) {
      return res.status(400).json({
        message: "Todos los campos (userId, type, startedAt, endedAt, reason) son obligatorios",
      });
    }

    const start = new Date(startedAt);
    const end = new Date(endedAt);

    if (end <= start) {
      return res.status(400).json({ message: "La fecha de fin debe ser posterior a la de inicio" });
    }

    let projectId = null;
    if (type === "NOTE") {
      if (!noteId) {
        return res.status(400).json({ message: "noteId es requerido para entradas de tipo NOTE" });
      }
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Nota no encontrada" });
      }
      projectId = note.project || null;
    }

    const newEntry = new TimeEntry({
      userId,
      type,
      noteId: type === "NOTE" ? noteId : null,
      projectId,
      startedAt: start,
      endedAt: end,
      lastPingAt: end,
      status: "EDITED",
    });

    await newEntry.save();

    // Registro de auditoría
    const audit = new TimeEntryAudit({
      timeEntryId: newEntry._id,
      adminId,
      previousStartedAt: start,
      previousEndedAt: end,
      newStartedAt: start,
      newEndedAt: end,
      reason: `Creación manual: ${reason.trim()}`,
    });
    await audit.save();

    if (type === "NOTE" && noteId) {
      await syncNoteTimeSpent(noteId);
    }

    res.status(201).json({
      status: "CREATED",
      entry: newEntry,
      audit_id: audit._id,
    });
  } catch (error) {
    console.error("Error en createManualTimeEntry:", error);
    res.status(500).json({ message: "Error al crear entrada manual de tiempo" });
  }
}

/**
 * Historial de auditoría de cambios manuales.
 */
export async function getAuditLogs(req, res) {
  try {
    const { timeEntryId } = req.query;
    const query = {};
    if (timeEntryId && mongoose.Types.ObjectId.isValid(timeEntryId)) {
      query.timeEntryId = timeEntryId;
    }

    const audits = await TimeEntryAudit.find(query)
      .populate("adminId", "name email color")
      .populate({
        path: "timeEntryId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "noteId", select: "title keyId" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(audits);
  } catch (error) {
    console.error("Error en getAuditLogs:", error);
    res.status(500).json({ message: "Error al obtener registros de auditoría" });
  }
}

/**
 * Endpoint de mantenimiento para purgar registros con duración menor a 3 segundos.
 */
export async function cleanZeroDurationEntries(req, res) {
  try {
    const result = await TimeEntry.deleteMany({
      status: { $in: ["PAUSED", "CLOSED_BY_TIMEOUT"] },
      endedAt: { $ne: null },
      $expr: {
        $lt: [{ $subtract: ["$endedAt", "$startedAt"] }, 3000],
      },
    });

    res.json({
      status: "SUCCESS",
      deleted_count: result.deletedCount,
      message: `Se eliminaron ${result.deletedCount} registros con duración menor a 3 segundos`,
    });
  } catch (error) {
    console.error("Error en cleanZeroDurationEntries:", error);
    res.status(500).json({ message: "Error al limpiar registros de 0 segundos" });
  }
}
