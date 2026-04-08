import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, Search, X } from "lucide-react";
import { PostCard } from "../../components/public/PostCard";
import { usePosts } from "../../hooks/usePosts";
import { Category, Tag } from "../../types/models";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const categorySlug = searchParams.get("category") || "";
  const tagSlug = searchParams.get("tag") || "";
  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || 1);

  const { posts, total, loading } = usePosts({
    page,
    pageSize: PAGE_SIZE,
    categorySlug: categorySlug || undefined,
    tagSlug: tagSlug || undefined,
    query: query || undefined
  });

  useEffect(() => {
    const loadFilters = async () => {
      const [{ data: categoryData }, { data: tagData }] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("tags").select("*").order("name")
      ]);
      setCategories((categoryData as Category[]) ?? []);
      setTags((tagData as Tag[]) ?? []);
    };
    void loadFilters();
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const activeFilterCount = [categorySlug, tagSlug, query].filter(Boolean).length;

  const updateFilterParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">লেখার ঘর</p>
            <h1 className="section-title">ভাবনা, স্মৃতি আর দিনের নোট</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700">
              সব লেখাকে এমনভাবে সাজানো হয়েছে যাতে তুমি সহজে বিষয়, অনুভূতি বা শব্দ ধরে নিজের মতো করে পড়তে পারো।
            </p>
          </div>
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm">
            <p className="text-sm leading-7 text-slate-600">
              মোট <span className="font-semibold text-brand-900">{total}</span>টি লেখা পাওয়া গেছে
              {activeFilterCount ? `, ${activeFilterCount}টি filter সক্রিয় আছে।` : "।"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {categorySlug ? <span className="section-kicker">ক্যাটাগরি: {categorySlug}</span> : null}
              {tagSlug ? <span className="section-kicker">ট্যাগ: {tagSlug}</span> : null}
              {query ? <span className="section-kicker">খোঁজ: {query}</span> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-brand-800">
            <Filter size={18} />
            <span className="text-sm font-semibold uppercase tracking-[0.22em]">ফিল্টার</span>
          </div>
          {activeFilterCount ? (
            <button type="button" onClick={clearFilters} className="ghost-button gap-2">
              <X size={16} />
              সব মুছুন
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <select className="soft-input" value={categorySlug} onChange={(event) => updateFilterParam("category", event.target.value)}>
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select className="soft-input" value={tagSlug} onChange={(event) => updateFilterParam("tag", event.target.value)}>
            <option value="">সব ট্যাগ</option>
            {tags.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="soft-input pl-11"
              placeholder="শিরোনাম, ভাবনা বা কীওয়ার্ড লিখে খুঁজুন..."
              value={query}
              onChange={(event) => updateFilterParam("q", event.target.value)}
            />
          </label>
        </div>
      </section>

      {loading ? (
        <p className="section-card text-center text-slate-600">লেখাগুলো আনা হচ্ছে...</p>
      ) : posts.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <section className="section-card text-center">
          <h2 className="font-display text-3xl text-brand-900">এই ফিল্টারে কোনো লেখা পাওয়া যায়নি</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            অন্য ক্যাটাগরি, ট্যাগ বা শব্দ দিয়ে আবার চেষ্টা করতে পারো।
          </p>
          <div className="mt-5">
            <button type="button" onClick={clearFilters} className="soft-button">
              সব লেখা দেখুন
            </button>
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(Math.max(1, page - 1))}
          className="ghost-button disabled:cursor-not-allowed disabled:opacity-40"
        >
          আগের পাতা
        </button>
        <span className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-600">
          পাতা {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(Math.min(totalPages, page + 1))}
          className="soft-button disabled:cursor-not-allowed disabled:opacity-40"
        >
          পরের পাতা
        </button>
      </section>

      <section className="section-card flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(120deg,rgba(25,59,112,0.06),rgba(171,87,40,0.1),rgba(255,255,255,0.7))]">
        <div>
          <p className="section-kicker">আরও পড়ুন</p>
          <h2 className="mt-3 font-display text-3xl text-brand-900">স্মৃতি, ছবি আর ব্যক্তিগত পছন্দও ঘুরে দেখুন</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/favorites" className="ghost-button">
            প্রিয় জিনিস
          </Link>
          <Link to="/gallery" className="soft-button gap-2">
            গ্যালারি
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
