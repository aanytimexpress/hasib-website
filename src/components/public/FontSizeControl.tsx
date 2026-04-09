import { toBanglaNumber } from "../../lib/locale";

interface FontSizeControlProps {
  size: number;
  onChange: (size: number) => void;
}

export function FontSizeControl({ size, onChange }: FontSizeControlProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-3 py-2 text-sm text-brand-800">
      <button
        type="button"
        onClick={() => onChange(Math.max(14, size - 1))}
        className="rounded-full px-2 py-1 transition hover:bg-brand-50"
      >
        অ-
      </button>
      <span className="text-xs text-slate-500">{toBanglaNumber(size)} পিক্সেল</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(24, size + 1))}
        className="rounded-full px-2 py-1 transition hover:bg-brand-50"
      >
        অ+
      </button>
    </div>
  );
}
