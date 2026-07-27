import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon, XIcon, ClockIcon } from "lucide-react";

registerLocale("es", es);

const formatDisplayDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const DatesPopover = ({
  startDate: initialStartDate,
  dueDate: initialDueDate,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState(!!initialDueDate);
  // Which picker is active: "start" | "due" | null
  const [activePicker, setActivePicker] = useState(null);

  const [startDate, setStartDate] = useState(
    initialStartDate ? new Date(initialStartDate) : new Date()
  );
  const [dueDate, setDueDate] = useState(
    initialDueDate
      ? new Date(initialDueDate)
      : new Date(new Date().setDate(new Date().getDate() + 1))
  );

  // Sync internal state with props when opened
  useEffect(() => {
    if (isOpen) {
      setHasStartDate(!!initialStartDate);
      setHasDueDate(!!initialDueDate);
      setStartDate(
        initialStartDate ? new Date(initialStartDate) : new Date()
      );
      setDueDate(
        initialDueDate
          ? new Date(initialDueDate)
          : new Date(new Date().setDate(new Date().getDate() + 1))
      );
      setActivePicker(null);
    }
  }, [isOpen, initialStartDate, initialDueDate]);

  const handleSave = () => {
    onSave({
      startDate: hasStartDate ? startDate.toISOString() : null,
      dueDate: hasDueDate ? dueDate.toISOString() : null,
    });
    setIsOpen(false);
  };

  const handleRemove = () => {
    onSave({ startDate: null, dueDate: null });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-xs sm:btn-sm bg-base-200 hover:bg-base-300 border border-base-content/10 text-base-content gap-1.5 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="size-4" />
        <span>Fechas</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Popover Card */}
          <div className="absolute left-0 top-full mt-2 bg-base-100 border border-base-content/10 rounded-xl shadow-2xl z-50 flex flex-col"
               style={{ width: activePicker ? "auto" : "20rem" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
              <span className="font-bold text-base-content text-sm flex-1 text-center">
                Fechas
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-base-content/60 hover:text-base-content absolute right-3"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex">
              {/* Left: controls */}
              <div className="p-4 space-y-4 text-sm w-80 flex-shrink-0">
                {/* Start date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={hasStartDate}
                      onChange={(e) => {
                        setHasStartDate(e.target.checked);
                        if (e.target.checked) setActivePicker("start");
                        else if (activePicker === "start") setActivePicker(null);
                      }}
                    />
                    <span className="font-semibold">Fecha de inicio</span>
                  </label>
                  {hasStartDate && (
                    <button
                      type="button"
                      className={`input input-sm input-bordered w-full text-xs text-left ${
                        activePicker === "start"
                          ? "border-primary ring-1 ring-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setActivePicker(
                          activePicker === "start" ? null : "start"
                        )
                      }
                    >
                      {formatDisplayDate(startDate)}
                    </button>
                  )}
                </div>

                {/* Due date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={hasDueDate}
                      onChange={(e) => {
                        setHasDueDate(e.target.checked);
                        if (e.target.checked) setActivePicker("due");
                        else if (activePicker === "due") setActivePicker(null);
                      }}
                    />
                    <span className="font-semibold">Fecha de vencimiento</span>
                  </label>
                  {hasDueDate && (
                    <button
                      type="button"
                      className={`input input-sm input-bordered w-full text-xs text-left ${
                        activePicker === "due"
                          ? "border-primary ring-1 ring-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setActivePicker(activePicker === "due" ? null : "due")
                      }
                    >
                      {formatDisplayDate(dueDate)}
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-full"
                    onClick={handleSave}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm w-full text-base-content/60 hover:bg-base-200"
                    onClick={handleRemove}
                  >
                    Quitar
                  </button>
                </div>
              </div>

              {/* Right: inline calendar (only when a picker is active) */}
              {activePicker && (
                <div className="border-l border-base-content/10 bg-base-100 rounded-r-xl p-2 flex-shrink-0">
                  <DatePicker
                    selected={activePicker === "start" ? startDate : dueDate}
                    onChange={(date) => {
                      if (activePicker === "start") setStartDate(date);
                      else setDueDate(date);
                    }}
                    inline
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Hora"
                    locale="es"
                    minDate={
                      activePicker === "due" && hasStartDate
                        ? startDate
                        : null
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatesPopover;
