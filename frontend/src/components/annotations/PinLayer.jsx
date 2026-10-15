import React from "react";
import {
  CheckIcon,
  ClockIcon,
  PlayIcon,
  UserIcon,
  MapPinIcon,
} from "lucide-react";

export default function PinLayer({
  subtasks = [],
  currentPage = 1,
  activeSubtaskId = null,
  onSelectPin,
  pendingPin = null,
}) {
  // Filter subtasks for the current page (if pageNumber is specified, default 1)
  const visibleSubtasks = subtasks.filter((task) => {
    const page = task.marker?.pageNumber ?? 1;
    return page === currentPage;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-600",
          ring: "ring-emerald-400/40",
          text: "text-white",
          label: "Completada",
        };
      case "in_progress":
        return {
          bg: "bg-blue-600",
          border: "border-blue-700",
          ring: "ring-blue-400/40",
          text: "text-white",
          label: "En Progreso",
        };
      case "pending":
      default:
        return {
          bg: "bg-amber-500",
          border: "border-amber-600",
          ring: "ring-amber-400/40",
          text: "text-white",
          label: "Pendiente",
        };
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Existing Subtask Pins */}
      {visibleSubtasks.map((task, index) => {
        const xPercent = task.marker?.xPercent ?? task.xPercent;
        const yPercent = task.marker?.yPercent ?? task.yPercent;

        if (xPercent === undefined || yPercent === undefined) return null;

        const isSelected = activeSubtaskId === task._id;
        const colors = getStatusColor(task.status);

        return (
          <div
            key={task._id}
            style={{
              position: "absolute",
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              transform: "translate(-50%, -100%)",
            }}
            className="pointer-events-auto group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPin) onSelectPin(task);
            }}
          >
            {/* Pulsing ring on selected pin */}
            {isSelected && (
              <span
                className={`absolute -inset-2 rounded-full animate-ping opacity-75 ${colors.bg}`}
              />
            )}

            {/* Pin Marker Element */}
            <div
              className={`relative flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-full shadow-lg border-2 transition-all duration-200 transform group-hover:scale-110 ${
                colors.bg
              } ${colors.border} ${colors.text} ${
                isSelected
                  ? "scale-125 ring-4 " + colors.ring + " z-30"
                  : "hover:z-20"
              }`}
            >
              {task.status === "completed" ? (
                <CheckIcon className="size-3.5 stroke-[3]" />
              ) : task.status === "in_progress" ? (
                <PlayIcon className="size-3 fill-current" />
              ) : (
                <span className="text-[11px] font-bold font-mono">
                  {index + 1}
                </span>
              )}

              {/* Pin pointer triangle tip at bottom */}
              <div
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-[6px] ${
                  task.status === "completed"
                    ? "border-t-emerald-600"
                    : task.status === "in_progress"
                    ? "border-t-blue-700"
                    : "border-t-amber-600"
                }`}
              />
            </div>

            {/* Hover Tooltip Preview */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 transition-opacity">
              <div className="bg-base-300/95 backdrop-blur-md text-base-content text-xs rounded-xl py-1.5 px-3 shadow-2xl border border-base-content/15 whitespace-nowrap min-w-[140px] max-w-xs space-y-1">
                <div className="flex items-center justify-between gap-2 border-b border-base-content/10 pb-1">
                  <span className="font-bold text-[11px] text-base-content truncate">
                    #{index + 1} {task.title}
                  </span>
                  <span
                    className={`badge badge-xs text-[9px] px-1 font-semibold ${
                      task.status === "completed"
                        ? "badge-success text-white"
                        : task.status === "in_progress"
                        ? "badge-primary text-white"
                        : "badge-warning text-white"
                    }`}
                  >
                    {colors.label}
                  </span>
                </div>

                {task.description && (
                  <p className="text-[11px] text-base-content/70 truncate max-w-[200px]">
                    {task.description}
                  </p>
                )}

                {task.assignedTo && (
                  <div className="flex items-center gap-1.5 text-[10px] text-base-content/60 pt-0.5">
                    <UserIcon className="size-3" />
                    <span>{task.assignedTo.name || "Asignado"}</span>
                  </div>
                )}
              </div>
              <div className="w-2 h-2 bg-base-300 rotate-45 -mt-1 border-r border-b border-base-content/15" />
            </div>
          </div>
        );
      })}

      {/* Pending Pin Marker (while user is filling form for a new pin) */}
      {pendingPin && pendingPin.pageNumber === currentPage && (
        <div
          style={{
            position: "absolute",
            left: `${pendingPin.xPercent}%`,
            top: `${pendingPin.yPercent}%`,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none z-30 flex flex-col items-center animate-bounce"
        >
          <div className="p-1.5 bg-primary text-primary-content rounded-full shadow-2xl ring-4 ring-primary/30 flex items-center justify-center">
            <MapPinIcon className="size-5 fill-current" />
          </div>
          <span className="badge badge-primary badge-xs mt-1 text-[10px] shadow font-bold whitespace-nowrap">
            Nueva subtarea
          </span>
        </div>
      )}
    </div>
  );
}
