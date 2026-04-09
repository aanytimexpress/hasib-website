import { useEffect, useMemo, useState } from "react";
import { X, Search, Filter } from "lucide-react";
import { PostCard } from "../../components/public/PostCard";
import { usePosts } from "../../hooks/usePosts";
import { Category, Tag } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { useSearchParams } from "react-router-dom";

const PAGE_SIZE = 9;

function toValidPage(value: string | null): number {
  const parsed = Number(value || "1");
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const categorySlug = searchParams.get("category") || "";
  const tagSlug = searchParams.get("tag") || "";
  const query = searchParams.get("q") || "";
  const page = toValidPage(searchParams.get("page"));

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
  const hasFilters = Boolean(categorySlug || tagSlug || query);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.trim()) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    if (!next.get("page")) {
      next.set("page", "1");
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams({ page: "1" }));
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white/85 via-sky-50/80 to-blue-100/70 p-7 shadow-[0_24px_70px_rgba(53,88,144,0.18)] backdrop-blur-xl md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            বাংলা জার্নাল আর্কাইভ
          </p>
          <h1 className="mt-3 text-balance text-3xl font-bold text-slate-900 md:text-5xl">ব্লগ ও স্মৃতির খাতা</h1>
          <p className="mt-3 text-base leading-8 text-slate-700 md:text-lg">
            জীবন, স্মৃতি, অনুভূতি ও ব্যক্তিগত ভাবনার লেখাগুলো ক্যাটাগরি, ট্যাগ এবং সার্চ দিয়ে খুঁজে নিন।
          </p>
        </div>
      </section>

      <section className="rounded-[26px] border border-white/70 bg-white/72 p-5 shadow-[0_16px_40px_rgba(33,74,141,0.13)] backdrop-blur-xl md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Filter size={18} className="text-brand-700" />
            ফিল্টার ও সার্চ
          </h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              সব ক্লিয়ার
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
            value={categorySlug}
            onChange={(event) => {
              updateParams({ category: event.target.value || null, page: "1" });
            }}
          >
            <option value="">সব ক্যাটাগরি</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
            value={tagSlug}
            onChange={(event) => {
              updateParams({ tag: event.target.value || null, page: "1" });
            }}
          >
            <option value="">সব ট্যাগ</option>
            {tags.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="relative flex items-center">
            <Search size={16} className="pointer-events-none absolute left-3 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-brand-500"
              placeholder="ব্লগে সার্চ করুন..."
              value={query}
              onChange={(event) => {
                updateParams({ q: event.target.value || null, page: "1" });
              }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateParams({ q: null, page: "1" })}
                className="absolute right-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {categorySlug ? (
              <button
                type="button"
                onClick={() => updateParams({ category: null, page: "1" })}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-700"
              >
                Category: {categorySlug} <X size={14} />
              </button>
            ) : null}
            {tagSlug ? (
              <button
                type="button"
                onClick={() => updateParams({ tag: null, page: "1" })}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-700"
              >
                Tag: {tagSlug} <X size={14} />
              </button>
            ) : null}
            {query ? (
              <button
                type="button"
                onClick={() => updateParams({ q: null, page: "1" })}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-700"
              >
                Search: {query} <X size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="rounded-[24px] border border-white/70 bg-white/72 p-10 text-center shadow-panel backdrop-blur-xl">
          <p className="text-base text-slate-600">পোস্ট লোড হচ্ছে...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-[24px] border border-white/70 bg-white/72 p-10 text-center shadow-panel backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-slate-900">কোনো পোস্ট পাওয়া যায়নি</h3>
          <p className="mt-2 text-sm text-slate-600">ফিল্টার বা সার্চ পরিবর্তন করে আবার চেষ্টা করুন।</p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              সব ফিল্টার মুছুন
            </button>
          ) : null}
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">মোট পোস্ট: {total}</h2>
            <p className="text-sm text-slate-500">
              পেজ {page} / {totalPages}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
