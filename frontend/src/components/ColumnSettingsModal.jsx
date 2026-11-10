import { XIcon, SlidersHorizontalIcon } from "lucide-react";
import ColumnManager from "./ColumnManager";

const ColumnSettingsModal = ({
  isOpen,
  onClose,
  columnOrder,
  columnWidths,
  onOrderChange,
  onWidthsChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-base-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-base-content/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-base-content/10 flex items-center justify-between bg-base-200/50">
          <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
            <SlidersHorizontalIcon className="size-5 text-primary" />
            Personalizar Columnas de Tareas
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square rounded-full hover:bg-base-300"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          <ColumnManager
            columnOrder={columnOrder}
            columnWidths={columnWidths}
            onOrderChange={onOrderChange}
            onWidthsChange={onWidthsChange}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-content/10 bg-base-200/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm px-6"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnSettingsModal;

