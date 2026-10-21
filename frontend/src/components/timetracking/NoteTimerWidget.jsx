import { useState, useEffect, useRef, useCallback } from "react";
import { PlayIcon, PauseIcon, TimerIcon } from "lucide-react";
import { useTimeTracking } from "../../lib/TimeTrackingContext";
import { formatDuration } from "../../lib/timeUtils";
import api from "../../lib/axios";

const NoteTimerWidget = ({ noteId, noteTitle, onTimeUpdated }) => {
  const {
    activeNoteEntry,
    startNoteTimer,
    pauseNoteTimer,
    getActiveNoteElapsedSeconds,
  } = useTimeTracking();

  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const isCurrentNoteRunning =
    activeNoteEntry &&
    (activeNoteEntry.noteId?._id === noteId || activeNoteEntry.noteId === noteId);

  // Cargar estadísticas acumuladas de la nota
  const fetchNoteStats = useCallback(async () => {
    if (!noteId) return;
    try {
      const res = await api.get(`/time/note/${noteId}/stats`);
      setTotalSeconds(res.data.totalSeconds || 0);
    } catch (err) {
      console.warn("Error al obtener estadísticas de tiempo de la nota:", err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNoteStats();
  }, [fetchNoteStats]);

  // Si se pausa la nota externamente o internamente, actualizar total acumulado
  useEffect(() => {
    if (!isCurrentNoteRunning) {
      fetchNoteStats();
      if (onTimeUpdated) onTimeUpdated();
    }
  }, [isCurrentNoteRunning, fetchNoteStats, onTimeUpdated]);

  // ─── Cleanup al desmontar: pausar si el usuario abandona la vista ─────────
  const activeEntryRef = useRef(activeNoteEntry);
  activeEntryRef.current = activeNoteEntry;

  useEffect(() => {
    return () => {
      const currentActive = activeEntryRef.current;
      const runningThisNote =
        currentActive &&
        (currentActive.noteId?._id === noteId || currentActive.noteId === noteId);

      if (runningThisNote && currentActive._id) {
        // Pausar en backend inmediatamente
        api.post("/time/pause", { entryId: currentActive._id }).catch(() => {});
      }
    };
  }, [noteId]);

  const handleToggleTimer = async () => {
    if (isCurrentNoteRunning) {
      await pauseNoteTimer(activeNoteEntry._id);
      await fetchNoteStats();
      if (onTimeUpdated) onTimeUpdated();
    } else {
      await startNoteTimer(noteId);
    }
  };

  const currentSessionElapsed = isCurrentNoteRunning ? getActiveNoteElapsedSeconds() : 0;
  const displayTotalSeconds = totalSeconds + currentSessionElapsed;
  const hoursFormatted = (displayTotalSeconds / 3600).toFixed(2);

  if (loading) {
    return (
      <div className="skeleton h-9 w-48 rounded-lg bg-base-200/60" />
    );
  }

  return (
    <div className="flex items-center gap-2 bg-base-200/50 border border-base-content/10 px-3 py-1.5 rounded-xl shadow-xs">
      <div className="flex items-center gap-1.5 text-base-content/70">
        <TimerIcon className={`w-4 h-4 ${isCurrentNoteRunning ? "text-secondary animate-spin" : "text-base-content/40"}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50 hidden sm:inline">
          Tiempo:
        </span>
      </div>

      {/* Reloj digital */}
      <div className="font-mono text-sm font-bold text-base-content flex items-center gap-1.5">
        <span className={isCurrentNoteRunning ? "text-secondary" : ""}>
          {formatDuration(displayTotalSeconds)}
        </span>
        <span className="text-xs font-normal text-base-content/50">
          ({hoursFormatted}h)
        </span>
      </div>

      {/* Botón Iniciar / Pausar */}
      <button
        type="button"
        onClick={handleToggleTimer}
        className={`btn btn-xs gap-1.5 font-medium rounded-lg px-2.5 transition-all ${
          isCurrentNoteRunning
            ? "btn-warning text-warning-content shadow-xs"
            : "btn-primary shadow-xs"
        }`}
        title={
          isCurrentNoteRunning
            ? `Pausar trabajo en: ${noteTitle || "esta tarea"}`
            : `Iniciar trabajo en: ${noteTitle || "esta tarea"}`
        }
      >
        {isCurrentNoteRunning ? (
          <>
            <PauseIcon className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Pausar</span>
          </>
        ) : (
          <>
            <PlayIcon className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Iniciar</span>
          </>
        )}
      </button>
    </div>
  );
};

export default NoteTimerWidget;
