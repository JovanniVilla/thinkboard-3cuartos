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
    const hours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

    await Note.findByIdAndUpdate(objectId, { timeSpent: hours });
    return hours;
  } catch (error) {
    console.error(`[timeSync] Error al sincronizar timeSpent para la nota ${noteId}:`, error);
    return 0;
  }
}
