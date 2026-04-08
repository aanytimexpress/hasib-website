import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { PostCard } from "../../components/public/PostCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [draftQuery, setDraftQuery] = useState(query);
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (draftQuery.trim()) next.set("q", draftQuery.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="space-y-4">
          <p className="section-kicker">খোঁজ</p>
          <h1 className="section-title">শব্দ ধরে খুঁজে নিন পছন্দের লেখা</h1>
          <p className="max-w-2xl text-base leading-8 text-slate-700">
            শিরোনাম, ভাবনা, অনুভূতি বা কোনো নির্দিষ্ট শব্দ লিখে খুঁজুন। মিল পাওয়া লেখা এখানে সাজানো থাকবে।
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="soft-input pl-11"
                placeholder="যেমন: স্মৃতি, শৈশব, ভ্রমণ, বই..."
              />
            </label>
            <button type="submit" className="soft-button">
              খুঁজুন
            </button>
          </form>
        </div>
      </section>

      <section className="section-card">
        <h2 className="font-display text-3xl text-brand-900">{query ? `“${query}” এর ফলাফল` : "সার্চ শুরু করুন"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {query ? `${results.length}টি লেখা পাওয়া গেছে।` : "উপরে একটি শব্দ বা বাক্য লিখে সার্চ দিন।"}
        </p>
      </section>

      {loading ? (
        <p className="section-card text-center text-slate-600">লেখা খোঁজা হচ্ছে...</p>
      ) : results.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <PostCard key={item.id} post={item} />
          ))}
        </section>
      ) : query ? (
        <section className="section-card text-center">
          <h2 className="font-display text-3xl text-brand-900">কোনো মিল পাওয়া যায়নি</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            অন্য শব্দ, কম কীওয়ার্ড, বা আলাদা বানান ব্যবহার করে আবার চেষ্টা করুন।
          </p>
        </section>
      ) : null}
    </div>
  );
}
