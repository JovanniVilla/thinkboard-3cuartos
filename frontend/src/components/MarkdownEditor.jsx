import { useState, useRef } from "react";
import {
  BoldIcon,
  ItalicIcon,
  HeadingIcon,
  ListIcon,
  CheckSquareIcon,
  CodeIcon,
  QuoteIcon,
  LinkIcon,
  EyeIcon,
  EditIcon,
  ColumnsIcon,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const MarkdownEditor = ({ value = "", onChange, placeholder = "Escribe aquí en formato Markdown..." }) => {
  const [mode, setMode] = useState("write"); // "write" | "preview" | "split"
  const textareaRef = useRef(null);

  // Helper to insert markdown syntax at cursor
  const insertFormatting = (prefix, suffix = prefix, placeholderText = "texto") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholderText;
    const newText =
      value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);

    onChange(newText);

    // Reset cursor position inside the formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const handleToolbarClick = (action) => {
    switch (action) {
      case "bold":
        insertFormatting("**", "**", "texto en negrita");
        break;
      case "italic":
        insertFormatting("*", "*", "texto en cursiva");
        break;
      case "heading":
        insertFormatting("### ", "", "Encabezado");
        break;
      case "list":
        insertFormatting("- ", "", "elemento de lista\n- otro elemento");
        break;
      case "checkbox":
        insertFormatting("- [ ] ", "", "tarea pendiente\n- [x] tarea completada");
        break;
      case "code":
        insertFormatting("```\n", "\n```", "código aquí");
        break;
      case "quote":
        insertFormatting("> ", "", "cita relevante");
        break;
      case "link":
        insertFormatting("[", "](https://ejemplo.com)", "texto del enlace");
        break;
      default:
        break;
    }
  };

  return (
    <div className="border border-base-content/20 rounded-xl overflow-hidden bg-base-100 shadow-sm transition-all focus-within:border-primary/60">
      {/* Top Bar: Toolbar & Mode Switcher */}
      <div className="bg-base-200/80 px-3 py-2 border-b border-base-content/15 flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Toolbar */}
        <div className={`flex items-center gap-1 flex-wrap ${mode === "preview" ? "opacity-30 pointer-events-none" : ""}`}>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("bold")}
            title="Negrita (**)"
          >
            <BoldIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("italic")}
            title="Cursiva (*)"
          >
            <ItalicIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("heading")}
            title="Título (###)"
          >
            <HeadingIcon className="size-3.5" />
          </button>
          <span className="w-px h-4 bg-base-content/15 mx-0.5" />
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("list")}
            title="Lista con viñetas (-)"
          >
            <ListIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("checkbox")}
            title="Lista de tareas (- [ ])"
          >
            <CheckSquareIcon className="size-3.5" />
          </button>
          <span className="w-px h-4 bg-base-content/15 mx-0.5" />
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("code")}
            title="Bloque de código (```)"
          >
            <CodeIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("quote")}
            title="Cita (>)"
          >
            <QuoteIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:bg-base-300"
            onClick={() => handleToolbarClick("link")}
            title="Enlace ([...](...))"
          >
            <LinkIcon className="size-3.5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-base-300/60 p-0.5 rounded-lg text-xs font-medium ml-auto">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === "write" ? "bg-base-100 shadow-sm text-primary font-bold" : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <EditIcon className="size-3" />
            <span>Escribir</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === "preview" ? "bg-base-100 shadow-sm text-primary font-bold" : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <EyeIcon className="size-3" />
            <span>Vista Previa</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === "split" ? "bg-base-100 shadow-sm text-primary font-bold" : "text-base-content/60 hover:text-base-content"
            }`}
            title="Vista dividida (Escribir + Vista Previa)"
          >
            <ColumnsIcon className="size-3" />
            <span>Dividido</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-0">
        {mode === "write" && (
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            className="textarea w-full min-h-[220px] p-4 bg-transparent border-0 focus:outline-none resize-y font-mono text-sm leading-relaxed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {mode === "preview" && (
          <div className="p-4 min-h-[220px] bg-base-100">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-base-content/40 italic text-sm">Nada para previsualizar. Escribe algo en la pestaña "Escribir".</p>
            )}
          </div>
        )}

        {mode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-content/15 min-h-[260px]">
            <textarea
              ref={textareaRef}
              placeholder={placeholder}
              className="textarea w-full h-full min-h-[260px] p-4 bg-transparent border-0 focus:outline-none resize-none font-mono text-sm leading-relaxed"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <div className="p-4 bg-base-200/20 overflow-y-auto max-h-[400px]">
              <div className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Vista Previa en Vivo</div>
              {value.trim() ? (
                <MarkdownRenderer content={value} />
              ) : (
                <p className="text-base-content/40 italic text-sm">Empieza a escribir a la izquierda...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="bg-base-200/40 px-3 py-1.5 border-t border-base-content/10 flex items-center justify-between text-[11px] text-base-content/50">
        <span>Soporta formato Markdown (tablas, checklists `- [ ]`, código, negrita `**`, etc.)</span>
        <span>{value.length} caracteres</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
