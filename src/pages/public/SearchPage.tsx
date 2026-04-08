import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { PostCard } from "../../components/public/PostCard";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .textSearch("search_vector", query, { type: "websearch" })
        .limit(24);

      if (error) {
        const { data: fallback } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(24);
        setResults((fallback as Post[]) ?? []);
      } else {
        setResults((data as Post[]) ?? []);
      }

      setLoading(false);
    };
    void run();
  }, [query]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">Search</h1>
        <p className="text-sm text-slate-600">
          "{query}" এর জন্য {results.length} টি ফলাফল পাওয়া গেছে।
        </p>
      </section>

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-600">Searching...</p>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <PostCard key={item.id} post={item} />
          ))}
        </section>
      )}
    </div>
  );
}
