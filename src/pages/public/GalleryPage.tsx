import { useEffect, useMemo, useState } from "react";
import { GalleryCategory, GalleryItem } from "../../types/models";
import { supabase } from "../../lib/supabase";

export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: categoryData }, { data: itemsData }] = await Promise.all([
        supabase.from("gallery_categories").select("*").order("name"),
        supabase
          .from("gallery")
          .select("*, category:gallery_categories(*)")
          .order("sort_order", { ascending: true })
      ]);
      setCategories((categoryData as GalleryCategory[]) ?? []);
      setItems((itemsData as GalleryItem[]) ?? []);
    };
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return items.filter((item) => item.category?.slug === filter);
  }, [items, filter]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">গ্যালারি</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1.5 text-sm ${filter ? "bg-slate-100" : "bg-brand-700 text-white"}`}
            onClick={() => setFilter("")}
            type="button"
          >
            সব অ্যালবাম
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === item.slug ? "bg-brand-700 text-white" : "bg-slate-100"
              }`}
              onClick={() => setFilter(item.slug)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreview(item)}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <img
              src={item.thumbnail_url || item.image_url}
              alt={item.title}
              className="h-44 w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <p className="truncate px-3 py-2 text-sm font-medium text-slate-700">{item.title}</p>
          </button>
        ))}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-full w-full max-w-4xl overflow-auto rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{preview.title}</h2>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-md bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <img src={preview.image_url} alt={preview.title} className="max-h-[70vh] w-full rounded-xl object-contain" />
            {preview.caption ? <p className="mt-3 text-sm text-slate-600">{preview.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
