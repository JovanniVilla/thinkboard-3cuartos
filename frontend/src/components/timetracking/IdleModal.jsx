import { ClockIcon, PlayIcon, XIcon, AlertCircleIcon } from "lucide-react";
import { useTimeTracking } from "../../lib/TimeTrackingContext";

const IdleModal = () => {
  const { isIdleModalOpen, idleInfo, resumeFromIdle, dismissIdleModal } = useTimeTracking();

  if (!isIdleModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-base-100 border border-base-content/20 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-warning/15 text-warning mx-auto flex items-center justify-center">
          <ClockIcon className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-base-content">Pausa por Inactividad</h3>
          <p className="text-sm text-base-content/70">
            Hemos detectado más de 5 minutos sin interacción. Tus contadores se pausaron automáticamente en el momento en que comenzó la inactividad.
          </p>
        </div>

        {idleInfo && (
          <div className="bg-base-200/70 border border-base-content/10 rounded-xl p-3 text-left text-xs space-y-1.5">
            <span className="font-semibold text-base-content/60 uppercase tracking-wider block mb-1">
              Contadores pausados:
            </span>
            {idleInfo.wasGlobalRunning && (
              <div className="flex items-center gap-2 text-base-content">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Jornada general (Contador Global)</span>
              </div>
            )}
            {idleInfo.wasNoteRunning && (
              <div className="flex items-center gap-2 text-base-content">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>Tarea: <strong>{idleInfo.noteTitle}</strong></span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={dismissIdleModal}
            className="btn btn-ghost btn-sm text-base-content/70"
          >
            <XIcon className="w-4 h-4 mr-1" />
            Mantener pausado
          </button>
          <button
            type="button"
            onClick={resumeFromIdle}
            className="btn btn-primary btn-sm gap-2 shadow-sm"
          >
            <PlayIcon className="w-4 h-4" />
            Reanudar contadores
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleModal;
