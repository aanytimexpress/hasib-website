import { useState } from "react";
import { generateAiSuggestions } from "../../lib/aiAssistant";

interface AiAssistantPanelProps {
  title: string;
  content: string;
  onApplySummary: (value: string) => void;
  onApplyTags: (value: string[]) => void;
  onApplyKeywords: (value: string[]) => void;
  onApplyReadingTime: (value: number) => void;
}

export function AiAssistantPanel({
  title,
  content,
  onApplySummary,
  onApplyTags,
  onApplyKeywords,
  onApplyReadingTime
}: AiAssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [preview, setPreview] = useState({
    summary: "",
    tags: [] as string[],
    seoKeywords: [] as string[],
    readingMinutes: 1
  });

  const run = async () => {
    setLoading(true);
    const result = await generateAiSuggestions({ title, content });
    setPreview(result);
    setHint(result.relatedHint);
    setLoading(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-900">AI Writing Assistant</h3>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Generating..." : "Generate Suggestions"}
        </button>
      </div>

      <div className="space-y-2 text-sm text-slate-700">
        <div>
          <p className="font-semibold">Summary</p>
          <p className="rounded bg-white p-2">{preview.summary || "No summary yet."}</p>
          <button
            type="button"
            onClick={() => onApplySummary(preview.summary)}
            className="mt-1 text-xs font-semibold text-brand-700"
          >
            Apply summary
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <p className="font-semibold">Tags</p>
            <p className="rounded bg-white p-2">{preview.tags.join(", ") || "No tags yet."}</p>
            <button
              type="button"
              onClick={() => onApplyTags(preview.tags)}
              className="mt-1 text-xs font-semibold text-brand-700"
            >
              Apply tags
            </button>
          </div>
          <div>
            <p className="font-semibold">SEO Keywords</p>
            <p className="rounded bg-white p-2">{preview.seoKeywords.join(", ") || "No keywords yet."}</p>
            <button
              type="button"
              onClick={() => onApplyKeywords(preview.seoKeywords)}
              className="mt-1 text-xs font-semibold text-brand-700"
            >
              Apply keywords
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded bg-white p-2">
          <span className="font-semibold">Reading time</span>
          <span>{preview.readingMinutes} min</span>
          <button
            type="button"
            onClick={() => onApplyReadingTime(preview.readingMinutes)}
            className="text-xs font-semibold text-brand-700"
          >
            Apply
          </button>
        </div>

        {hint ? <p className="rounded bg-white p-2 text-xs text-slate-600">{hint}</p> : null}
      </div>
    </div>
  );
}
