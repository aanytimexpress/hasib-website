import { RefObject } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onInsertImage?: () => void;
}

function wrapSelected(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  onChange: (value: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "নতুন টেক্সট";
  const replacement = `${before}${selected}${after}`;
  const next =
    textarea.value.slice(0, start) + replacement + textarea.value.slice(end, textarea.value.length);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

export function RichTextEditor({ value, onChange, textareaRef, onInsertImage }: RichTextEditorProps) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-300 bg-white p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (textareaRef.current) {
              wrapSelected(textareaRef.current, "<strong>", "</strong>", onChange);
            }
          }}
          className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => {
            if (textareaRef.current) {
              wrapSelected(textareaRef.current, "<h2>", "</h2>", onChange);
            }
          }}
          className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => {
            if (textareaRef.current) {
              wrapSelected(textareaRef.current, "<blockquote>", "</blockquote>", onChange);
            }
          }}
          className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => {
            if (textareaRef.current) {
              wrapSelected(
                textareaRef.current,
                "<a href='https://'>",
                "</a>",
                onChange
              );
            }
          }}
          className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
        >
          Link
        </button>
        <button
          type="button"
          onClick={onInsertImage}
          className="rounded bg-brand-700 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-800"
        >
          Insert Image
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={18}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-7 outline-none focus:border-brand-500"
        placeholder="HTML বা লেখা লিখুন..."
      />
    </div>
  );
}
