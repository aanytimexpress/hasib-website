interface FontSizeControlProps {
  size: number;
  onChange: (size: number) => void;
}

export function FontSizeControl({ size, onChange }: FontSizeControlProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(14, size - 1))}
        className="rounded px-2 py-1 hover:bg-slate-100"
      >
        A-
      </button>
      <span className="text-xs text-slate-500">{size}px</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(24, size + 1))}
        className="rounded px-2 py-1 hover:bg-slate-100"
      >
        A+
      </button>
    </div>
  );
}
