import { PlayIcon, PauseIcon, ClockIcon } from "lucide-react";
import { Link } from "react-router";
import { useTimeTracking } from "../../lib/TimeTrackingContext";
import { formatDuration } from "../../lib/timeUtils";

const GlobalTimerWidget = () => {
  const {
    isGlobalRunning,
    todayGlobalSeconds,
    startGlobalTimer,
    pauseGlobalTimer,
    activeNoteEntry,
    loading,
  } = useTimeTracking();

  if (loading) {
    return (
      <div className="skeleton h-8 w-28 rounded-lg bg-base-200/60" />
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-base-200/70 border border-base-content/10 px-2.5 py-1 rounded-xl shadow-xs">
      {/* Indicador de pulso */}
      <div className="relative flex items-center justify-center">
        {isGlobalRunning ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-base-content/30" />
        )}
      </div>

      {/* Reloj y tiempo acumulado */}
      <div className="flex items-center gap-1 font-mono text-xs font-semibold text-base-content/90 select-none">
        <ClockIcon className="w-3.5 h-3.5 text-base-content/50" />
        <span>{formatDuration(todayGlobalSeconds)}</span>
      </div>

      {/* Botón Play / Pause */}
      <button
        type="button"
        onClick={isGlobalRunning ? pauseGlobalTimer : startGlobalTimer}
        className={`btn btn-circle btn-xs ${
          isGlobalRunning
            ? "btn-ghost text-warning hover:bg-warning/10"
            : "btn-primary shadow-xs"
        }`}
        title={isGlobalRunning ? "Pausar jornada general" : "Iniciar / Reanudar jornada"}
      >
        {isGlobalRunning ? (
          <PauseIcon className="w-3.5 h-3.5 fill-current" />
        ) : (
          <PlayIcon className="w-3.5 h-3.5 fill-current" />
        )}
      </button>

      {/* Indicador adicional si hay una tarea activa en ejecución (clic para ir a ella) */}
      {activeNoteEntry && (
        <Link
          to={`/note/${activeNoteEntry.noteId?._id || activeNoteEntry.noteId}`}
          className="flex items-center gap-1.5 pl-1.5 border-l border-base-content/15 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 max-w-[120px] sm:max-w-[160px] truncate transition-colors"
          title={`Tarea activa: ${activeNoteEntry.noteId?.title || "Tarea"} (clic para ver tarea)`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">{activeNoteEntry.noteId?.title || "Tarea"}</span>
        </Link>
      )}
    </div>
  );
};

export default GlobalTimerWidget;
