import { useState } from "react";
import {
  GripVerticalIcon,
  RotateCcwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
} from "lucide-react";
import {
  COLUMNS_CONFIG,
  DEFAULT_COLUMNS,
  DEFAULT_COLUMN_WIDTHS,
  getSavedColumnOrder,
  getSavedColumnWidths,
  persistColumnPreferences,
} from "../lib/columnPreferences";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

const ColumnManager = ({
  columnOrder: externalColumnOrder,
  columnWidths: externalColumnWidths,
  onOrderChange,
  onWidthsChange,
}) => {
  const { user, updatePreferences } = useAuth();

  // Internal state if not controlled externally
  const [internalOrder, setInternalOrder] = useState(() =>
    getSavedColumnOrder(user?._id, user?.preferences)
  );
  const [internalWidths, setInternalWidths] = useState(() =>
    getSavedColumnWidths(user?._id, user?.preferences)
  );

  const columnOrder = externalColumnOrder || internalOrder;
  const columnWidths = externalColumnWidths || internalWidths;

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dropIndicatorIdx, setDropIndicatorIdx] = useState(null);

  const updateAndSave = (newOrder, newWidths) => {
    if (onOrderChange) onOrderChange(newOrder);
    else setInternalOrder(newOrder);

    if (onWidthsChange) onWidthsChange(newWidths);
    else setInternalWidths(newWidths);

    persistColumnPreferences(user?._id, newOrder, newWidths, updatePreferences);
  };

  const moveColumn = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;

    const newOrder = [...columnOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    updateAndSave(newOrder, columnWidths);
  };

  const adjustWidth = (colId, delta) => {
    const minW = COLUMNS_CONFIG[colId]?.minWidth || 60;
    const currentW = columnWidths[colId] || COLUMNS_CONFIG[colId]?.defaultWidth || 100;
    const newW = Math.max(minW, Math.min(800, currentW + delta));

    const newWidths = { ...columnWidths, [colId]: newW };
    updateAndSave(columnOrder, newWidths);
  };

  const handleWidthInput = (colId, valueStr) => {
    const num = parseInt(valueStr, 10);
    if (isNaN(num)) return;
    const minW = COLUMNS_CONFIG[colId]?.minWidth || 60;
    const newW = Math.max(minW, Math.min(800, num));

    const newWidths = { ...columnWidths, [colId]: newW };
    updateAndSave(columnOrder, newWidths);
  };

  const handleReset = () => {
    const defaultOrder = [...DEFAULT_COLUMNS];
    const defaultWidths = { ...DEFAULT_COLUMN_WIDTHS };
    updateAndSave(defaultOrder, defaultWidths);
    toast.success("Columnas restablecidas a valores por defecto");
  };

  // Drag and drop within the list
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDropIndicatorIdx(index);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDropIndicatorIdx(null);
      return;
    }

    const newOrder = [...columnOrder];
    const [movedItem] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, movedItem);

    updateAndSave(newOrder, columnWidths);
    setDraggedIdx(null);
    setDropIndicatorIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDropIndicatorIdx(null);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
        <div>
          <h3 className="font-bold text-sm text-base-content">
            Organización y Ancho de Columnas
          </h3>
          <p className="text-xs text-base-content/60">
            Reordena las columnas con las flechas o arrastrándolas, y ajusta su ancho en píxeles.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10 shrink-0"
          title="Restablecer orden y anchos de fábrica"
        >
          <RotateCcwIcon className="size-3.5" />
          Restablecer
        </button>
      </div>

      {/* Column items list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {columnOrder.map((colId, index) => {
          const config = COLUMNS_CONFIG[colId];
          if (!config) return null;
          const width = columnWidths[colId] || config.defaultWidth;
          const isDragging = draggedIdx === index;
          const isDropTarget = dropIndicatorIdx === index;

          return (
            <div
              key={colId}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-2.5 rounded-xl border bg-base-100 hover:border-primary/40 transition-all ${
                isDragging ? "opacity-30 border-dashed border-primary" : "border-base-content/10"
              } ${isDropTarget ? "ring-2 ring-primary ring-offset-1 bg-primary/5" : ""}`}
            >
              {/* Left: Reorder buttons & Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content p-0.5 shrink-0"
                  title="Arrastra para reordenar"
                >
                  <GripVerticalIcon className="size-4" />
                </span>

                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveColumn(index, "up")}
                    className="btn btn-ghost btn-xs h-4 w-5 min-h-0 p-0 text-base-content/60 hover:text-primary disabled:opacity-20"
                    title="Mover arriba / izquierda"
                  >
                    <ArrowUpIcon className="size-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === columnOrder.length - 1}
                    onClick={() => moveColumn(index, "down")}
                    className="btn btn-ghost btn-xs h-4 w-5 min-h-0 p-0 text-base-content/60 hover:text-primary disabled:opacity-20"
                    title="Mover abajo / derecha"
                  >
                    <ArrowDownIcon className="size-3" />
                  </button>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-base-content truncate">
                      {config.label}
                    </span>
                    {config.responsiveClass && (
                      <span className="badge badge-xs text-[9px] bg-base-200 text-base-content/60 border-none shrink-0">
                        Oculto en móvil
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-base-content/50 truncate">
                    {config.description}
                  </span>
                </div>
              </div>

              {/* Right: Width controls */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => adjustWidth(colId, -15)}
                  disabled={width <= config.minWidth}
                  className="btn btn-ghost btn-xs btn-square h-6 w-6 min-h-0 border border-base-content/20 disabled:opacity-20"
                  title="Reducir 15px"
                >
                  <MinusIcon className="size-3" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthInput(colId, e.target.value)}
                    min={config.minWidth}
                    max={800}
                    step={10}
                    className="input input-xs input-bordered w-16 text-center font-mono font-semibold text-xs px-1"
                    title={`Mínimo: ${config.minWidth}px`}
                  />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-base-content/40 pointer-events-none">
                    px
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustWidth(colId, 15)}
                  disabled={width >= 800}
                  className="btn btn-ghost btn-xs btn-square h-6 w-6 min-h-0 border border-base-content/20 disabled:opacity-20"
                  title="Aumentar 15px"
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-base-content/50 flex items-center justify-between border-t border-base-content/10">
        <span className="flex items-center gap-1">
          <CheckIcon className="size-3.5 text-success" />
          Tus preferencias se guardan automáticamente.
        </span>
        <span className="font-mono text-[10px]">
          Total: {columnOrder.reduce((acc, id) => acc + (columnWidths[id] || COLUMNS_CONFIG[id]?.defaultWidth || 100), 0)}px
        </span>
      </div>
    </div>
  );
};

export default ColumnManager;

