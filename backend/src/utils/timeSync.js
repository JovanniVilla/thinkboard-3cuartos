import mongoose from "mongoose";
import TimeEntry from "../models/TimeEntry.js";
import Note from "../models/Note.js";

/**
 * Recalculates and updates the cumulative timeSpent (in hours) on a Note document
 * based on all completed time entries for that note.
 *
 * @param {string|mongoose.Types.ObjectId} noteId
 * @returns {Promise<number>} Updated hours
 */
export async function syncNoteTimeSpent(noteId) {
  if (!noteId) return 0;

  try {
    const objectId = typeof noteId === "string" ? new mongoose.Types.ObjectId(noteId) : noteId;

    const note = await Note.findById(objectId).select("timeSpent");
    const currentNoteHours = Number(note?.timeSpent) || 0;

    const aggregation = await TimeEntry.aggregate([
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
        },
      },
    ]);

    const totalMs = aggregation[0]?.totalMs || 0;
    // Hours rounded to 2 decimals
    const hoursFromEntries = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;
    // Preservar el mayor entre lo acumulado por TimeEntry o el tiempo que ya tenía la nota
    const finalHours = Math.max(hoursFromEntries, currentNoteHours);

    await Note.findByIdAndUpdate(objectId, { timeSpent: finalHours });
    return finalHours;
  } catch (error) {
    console.error(`[timeSync] Error al sincronizar timeSpent para la nota ${noteId}:`, error);
    return 0;
  }
}
