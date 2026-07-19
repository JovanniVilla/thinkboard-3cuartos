import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ZapIcon } from "lucide-react";

const PrioritySelect = ({ priorities = [], value, onChange, placeholder = "— Seleccionar prioridad —" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = priorities.find((p) => p.name === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-base-content/20 bg-base-100 hover:border-base-content/40 transition-colors text-sm cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <ZapIcon className="w-4 h-4 flex-shrink-0" style={{ color: selected.color }} />
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0"
              style={{
                backgroundColor: selected.color + "22",
                color: selected.color,
                borderColor: selected.color + "55",
              }}
            >
              {selected.name}
            </span>
          </>
        ) : (
          <span className="text-base-content/40">{placeholder}</span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 text-base-content/40 ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-content/15 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {placeholder && !value && (
            <li>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-base-content/40 hover:bg-base-200 transition-colors"
                onClick={() => handleSelect("")}
              >
                {placeholder}
              </button>
            </li>
          )}

          {priorities.length === 0 && (
            <li className="px-3 py-3 text-sm text-base-content/40 text-center">
              Sin prioridades configuradas
            </li>
          )}

          {priorities.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-base-200 transition-colors ${
                  value === p.name ? "bg-base-200" : ""
                }`}
                onClick={() => handleSelect(p.name)}
              >
                <ZapIcon className="w-4 h-4 flex-shrink-0" style={{ color: p.color }} />
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: p.color + "22",
                    color: p.color,
                    borderColor: p.color + "55",
                  }}
                >
                  {p.name}
                </span>
                {value === p.name && (
                  <span className="ml-auto text-primary text-xs font-bold">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PrioritySelect;
