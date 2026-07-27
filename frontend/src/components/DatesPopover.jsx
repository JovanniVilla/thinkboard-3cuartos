import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon, XIcon } from "lucide-react";

registerLocale("es", es);

const DatesPopover = ({
  startDate: initialStartDate,
  dueDate: initialDueDate,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState(!!initialDueDate);
  
  const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate) : new Date());
  const [dueDate, setDueDate] = useState(initialDueDate ? new Date(initialDueDate) : new Date(new Date().setDate(new Date().getDate() + 1)));

  // Sync internal state with props when opened
  useEffect(() => {
    if (isOpen) {
      setHasStartDate(!!initialStartDate);
      setHasDueDate(!!initialDueDate);
      setStartDate(initialStartDate ? new Date(initialStartDate) : new Date());
      setDueDate(initialDueDate ? new Date(initialDueDate) : new Date(new Date().setDate(new Date().getDate() + 1)));
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
          {/* Backdrop for closing popover */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Popover Card */}
          <div className="absolute left-0 top-full mt-2 w-80 bg-base-100 border border-base-content/10 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <span className="font-bold text-base-content text-sm text-center flex-1">Fechas</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-base-content/60 hover:text-base-content absolute right-4"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={hasStartDate}
                    onChange={(e) => setHasStartDate(e.target.checked)}
                  />
                  <span className="font-semibold">Fecha de inicio</span>
                </label>
                {hasStartDate && (
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="d MMMM yyyy HH:mm"
                    locale="es"
                    className="input input-sm input-bordered w-full text-xs"
                    wrapperClassName="w-full"
                    popperPlacement="right-start"
                    popperClassName="dates-popover-calendar"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={hasDueDate}
                    onChange={(e) => setHasDueDate(e.target.checked)}
                  />
                  <span className="font-semibold">Fecha de vencimiento</span>
                </label>
                {hasDueDate && (
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Hora"
                    dateFormat="d MMMM yyyy HH:mm"
                    locale="es"
                    className="input input-sm input-bordered w-full text-xs"
                    wrapperClassName="w-full"
                    minDate={hasStartDate ? startDate : null}
                    popperPlacement="right-start"
                    popperClassName="dates-popover-calendar"
                  />
                )}
              </div>

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
          </div>
        </>
      )}
    </div>
  );
};

export default DatesPopover;
