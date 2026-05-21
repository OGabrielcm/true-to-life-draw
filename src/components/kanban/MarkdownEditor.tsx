import { useRef } from "react";
import { Bold, Italic, List } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "10rem" }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string, fallback: string) => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const selected = value.slice(s, e) || fallback;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    }, 0);
  };

  const insertList = () => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    if (value.slice(lineStart).startsWith("- ")) return;
    const next = value.slice(0, lineStart) + "- " + value.slice(lineStart);
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + 2, s + 2);
    }, 0);
  };

  return (
    <div>
      <div
        className="mb-1 flex items-center gap-0.5 border-b pb-1"
        style={{ borderWidth: "0.5px" }}
      >
        <button
          type="button"
          title="Negrito (**texto**)"
          onClick={() => wrap("**", "**", "texto")}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Itálico (*texto*)"
          onClick={() => wrap("*", "*", "texto")}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Lista (- item)"
          onClick={insertList}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/50">md</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/40"
        style={{ borderWidth: "0.5px", minHeight }}
      />
    </div>
  );
}
