import { Bookmark, BookmarkCheck } from "lucide-react";
import { useMemo, useState } from "react";

interface BookmarkButtonProps {
  slug: string;
}

const storageKey = "bookmarked_posts";

function readBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function BookmarkButton({ slug }: BookmarkButtonProps) {
  const initial = useMemo(() => readBookmarks().includes(slug), [slug]);
  const [saved, setSaved] = useState(initial);

  const toggle = () => {
    const existing = readBookmarks();
    const next = saved ? existing.filter((item) => item !== slug) : Array.from(new Set([...existing, slug]));
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(!saved);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-4 py-2 text-sm text-brand-800 transition hover:border-accent-300 hover:bg-white"
    >
      {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      {saved ? "সংরক্ষিত" : "সংরক্ষণ"}
    </button>
  );
}
