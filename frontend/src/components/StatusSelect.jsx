import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";

/**
 * Custom status selector showing a colored dot + name for each option.
 *
 * Props:
 *  - statuses: array of { _id, name, color }
 *  - value: current status name (string)
 *  - onChange: (name: string) => void
 *  - placeholder: string (optional)
 */
const StatusSelect = ({ statuses = [], value, onChange, placeholder = "— Seleccionar estado —" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = statuses.find((s) => s.name === value);

  // Close on outside click
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
      {/* Trigger button */}
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-base-content/20 bg-base-100 hover:border-base-content/40 transition-colors text-sm cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            />
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

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-content/15 rounded-lg shadow-xl overflow-hidden">
          {/* Optional empty option */}
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

          {statuses.length === 0 && (
            <li className="px-3 py-3 text-sm text-base-content/40 text-center">
              Sin estados configurados
            </li>
          )}

          {statuses.map((s) => (
            <li key={s._id}>
              <button
                type="button"
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-base-200 transition-colors ${
                  value === s.name ? "bg-base-200" : ""
                }`}
                onClick={() => handleSelect(s.name)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                  style={{
                    backgroundColor: s.color + "22",
                    color: s.color,
                    borderColor: s.color + "55",
                  }}
                >
                  {s.name}
                </span>
                {value === s.name && (
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

export default StatusSelect;
