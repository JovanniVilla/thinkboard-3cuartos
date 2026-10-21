import cron from "node-cron";
import TimeEntry from "../models/TimeEntry.js";
import { syncNoteTimeSpent } from "../utils/timeSync.js";

/**
 * Cierra automáticamente temporizadores que no han enviado heartbeat en los últimos 90 segundos.
 */
export async function reconcileAbandonedTimers() {
  try {
    const cutoffDate = new Date(Date.now() - 90 * 1000); // 90 segundos atrás

    const abandonedEntries = await TimeEntry.find({
      status: "RUNNING",
      lastPingAt: { $lt: cutoffDate },
    });

    if (abandonedEntries.length === 0) return;

    console.log(`⏰ [TimeReconcile] Encontrados ${abandonedEntries.length} temporizadores abandonados. Cerrando...`);

    for (const entry of abandonedEntries) {
      entry.endedAt = entry.lastPingAt || cutoffDate;
      entry.status = "CLOSED_BY_TIMEOUT";
      await entry.save();

      if (entry.type === "NOTE" && entry.noteId) {
        await syncNoteTimeSpent(entry.noteId);
      }
    }

    console.log(`✅ [TimeReconcile] Se cerraron ${abandonedEntries.length} temporizadores por timeout.`);
  } catch (error) {
    console.error("❌ [TimeReconcile] Error en reconciliación de temporizadores:", error);
  }
}

/**
 * Realiza el particionado de intervalos que cruzan la medianoche UTC.
 * Si un temporizador empezó ayer y sigue corriendo hoy, lo corta a las 23:59:59.999
 * y abre un nuevo bloque a las 00:00:00.000 de hoy.
 */
export async function partitionMidnightTimers() {
  try {
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const crossMidnightEntries = await TimeEntry.find({
      status: "RUNNING",
      startedAt: { $lt: todayMidnight },
    });

    if (crossMidnightEntries.length === 0) return;

    console.log(`⏰ [TimeReconcile] Particionando ${crossMidnightEntries.length} temporizadores que cruzan medianoche...`);

    for (const entry of crossMidnightEntries) {
      const yesterdayEnd = new Date(todayMidnight.getTime() - 1); // 23:59:59.999

      // Cerrar el bloque del día anterior
      entry.endedAt = yesterdayEnd;
      entry.status = "PAUSED";
      await entry.save();

      if (entry.type === "NOTE" && entry.noteId) {
        await syncNoteTimeSpent(entry.noteId);
      }

      // Abrir el bloque continuo para el nuevo día
      const continuedEntry = new TimeEntry({
        userId: entry.userId,
        type: entry.type,
        noteId: entry.noteId,
        projectId: entry.projectId,
        startedAt: todayMidnight,
        lastPingAt: now,
        status: "RUNNING",
      });

      await continuedEntry.save();
    }

    console.log(`✅ [TimeReconcile] Particionado de medianoche finalizado.`);
  } catch (error) {
    console.error("❌ [TimeReconcile] Error en particionado de medianoche:", error);
  }
}

/**
 * Inicializa las tareas programadas con node-cron.
 */
export function initTimeTrackingCronJob() {
  // Se ejecuta cada minuto: '* * * * *'
  cron.schedule("* * * * *", async () => {
    await reconcileAbandonedTimers();
    await partitionMidnightTimers();
  });

  console.log("🚀 [CronJob] Tarea programada de Time Tracking registrada: '* * * * *' (cada minuto).");
}
