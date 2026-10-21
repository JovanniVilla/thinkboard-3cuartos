import { useState, useEffect, useRef, useCallback } from "react";
import { PlayIcon, PauseIcon, ClockIcon } from "lucide-react";
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

  // ─── 1. Auto-inicio: al abrir la nota empieza a correr automáticamente ───
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (!noteId) return;

    if (!hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const isAlreadyRunning =
        activeNoteEntry &&
        (activeNoteEntry.noteId?._id === noteId || activeNoteEntry.noteId === noteId);

      if (!isAlreadyRunning) {
        startNoteTimer(noteId, { silent: true });
      }
    }
  }, [noteId, activeNoteEntry, startNoteTimer]);

  // ─── 2. Auto-pausa: al cerrar o desmontar la nota se pausa automáticamente ─
  const activeEntryRef = useRef(activeNoteEntry);
  activeEntryRef.current = activeNoteEntry;

  useEffect(() => {
    return () => {
      const currentActive = activeEntryRef.current;
      const runningThisNote =
        currentActive &&
        (currentActive.noteId?._id === noteId || currentActive.noteId === noteId);

      if (runningThisNote && currentActive._id) {
        pauseNoteTimer(currentActive._id, { silent: true });
      }
    };
  }, [noteId, pauseNoteTimer]);

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
    <div
      className={`flex items-center justify-between gap-2.5 border px-3 py-2 rounded-xl shadow-xs transition-all w-full ${
        isCurrentNoteRunning
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-base-100 border-base-content/10"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative flex items-center justify-center shrink-0">
          {isCurrentNoteRunning && (
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {/* Icono fijo sin rotación */}
          <ClockIcon
            className={`w-4 h-4 transition-colors shrink-0 ${
              isCurrentNoteRunning ? "text-emerald-500" : "text-base-content/40"
            }`}
          />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50 hidden sm:inline shrink-0">
          Tiempo:
        </span>

        {/* Reloj digital - Verde cuando está corriendo como en el mockup */}
        <div className="font-mono text-sm sm:text-base font-bold flex items-center gap-1.5 min-w-0">
          <span
            className={`transition-colors truncate ${
              isCurrentNoteRunning ? "text-emerald-500" : "text-base-content"
            }`}
          >
            {formatDuration(displayTotalSeconds)}
          </span>
          <span className="text-xs font-normal text-base-content/50 shrink-0">
            ({hoursFormatted}h)
          </span>
        </div>
      </div>

      {/* Botón Iniciar / Pausar */}
      <button
        type="button"
        onClick={handleToggleTimer}
        className={`btn btn-xs sm:btn-sm gap-1.5 font-medium rounded-lg px-3 transition-all shrink-0 ${
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
            <span>Pausar</span>
          </>
        ) : (
          <>
            <PlayIcon className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar</span>
          </>
        )}
      </button>
    </div>
  );
};

export default NoteTimerWidget;
