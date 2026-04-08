import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">ব্লগ</h1>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr]">
          <select
            className="rounded-lg border border-slate-300 p-2 text-sm"
            value={categorySlug}
            onChange={(event) => {
              searchParams.set("category", event.target.value);
              searchParams.set("page", "1");
              setSearchParams(searchParams);
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
            className="rounded-lg border border-slate-300 p-2 text-sm"
            value={tagSlug}
            onChange={(event) => {
              searchParams.set("tag", event.target.value);
              searchParams.set("page", "1");
              setSearchParams(searchParams);
            }}
          >
            <option value="">সব ট্যাগ</option>
            {tags.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="ব্লগে সার্চ করুন..."
            value={query}
            onChange={(event) => {
              searchParams.set("q", event.target.value);
              searchParams.set("page", "1");
              setSearchParams(searchParams);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="rounded-xl bg-white p-8 text-center text-slate-600">Loading posts...</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => {
            searchParams.set("page", String(Math.max(1, page - 1)));
            setSearchParams(searchParams);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-slate-600">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => {
            searchParams.set("page", String(Math.min(totalPages, page + 1)));
            setSearchParams(searchParams);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
