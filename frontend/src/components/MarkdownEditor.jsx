import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";

import {
  BoldIcon,
  ItalicIcon,
  HeadingIcon,
  ListIcon,
  ListOrderedIcon,
  CheckSquareIcon,
  CodeIcon,
  QuoteIcon,
  LinkIcon,
  StrikethroughIcon,
} from "lucide-react";

// Toolbar component
const Toolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="bg-base-200/80 px-3 py-2 border-b border-base-content/15 flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('bold') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Negrita"
      >
        <BoldIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('italic') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Cursiva"
      >
        <ItalicIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('strike') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Tachado"
      >
        <StrikethroughIcon className="size-3.5" />
      </button>
      
      <span className="w-px h-4 bg-base-content/15 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('heading', { level: 3 }) ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Encabezado"
      >
        <HeadingIcon className="size-3.5" />
      </button>
      
      <span className="w-px h-4 bg-base-content/15 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('bulletList') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Lista con viñetas"
      >
        <ListIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('orderedList') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Lista numerada"
      >
        <ListOrderedIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('taskList') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Lista de tareas"
      >
        <CheckSquareIcon className="size-3.5" />
      </button>

      <span className="w-px h-4 bg-base-content/15 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('codeBlock') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Bloque de código"
      >
        <CodeIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('blockquote') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Cita"
      >
        <QuoteIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('URL del enlace:', previousUrl);
          
          if (url === null) return;
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
        className={`btn btn-ghost btn-xs btn-square ${editor.isActive('link') ? 'bg-base-300 text-primary' : 'text-base-content/80'}`}
        title="Enlace"
      >
        <LinkIcon className="size-3.5" />
      </button>
    </div>
  );
};

const MarkdownEditor = ({ value = "", onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-base max-w-none focus:outline-none min-h-[200px] p-4 bg-base-100',
      },
    },
    onUpdate: ({ editor }) => {
      // Serialize content back to Markdown
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  // Update editor content if value changes externally (e.g. initialization delay)
  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      // We only update if the external value differs from the editor's markdown,
      // avoiding cursor jumps when typing.
      if (value !== undefined) {
          editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return (
    <div className="border border-base-content/20 rounded-xl overflow-hidden bg-base-100 shadow-sm transition-all focus-within:border-primary/60">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      
      {/* Footer hint */}
      <div className="bg-base-200/40 px-3 py-1.5 border-t border-base-content/10 flex items-center justify-between text-[11px] text-base-content/50">
        <span>Editor visual avanzado (Markdown automático)</span>
        <span>{value.length} caracteres</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
