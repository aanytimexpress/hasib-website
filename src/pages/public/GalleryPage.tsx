import { useEffect, useMemo, useState } from "react";
import { Images, X } from "lucide-react";
import { GalleryCategory, GalleryItem } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { toBanglaNumber } from "../../lib/locale";

export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: categoryData }, { data: itemsData }] = await Promise.all([
        supabase.from("gallery_categories").select("*").order("name"),
        supabase.from("gallery").select("*, category:gallery_categories(*)").order("sort_order", { ascending: true })
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
    <div className="page-shell">
      <section className="page-hero">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">ছবির অ্যালবাম</p>
            <h1 className="section-title">দৃশ্য, মুহূর্ত আর নীরব ফ্রেমের গ্যালারি</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700">
              জীবনের কিছু থেমে থাকা আলো, কিছু প্রিয় জায়গা, কিছু চুপচাপ সংরক্ষিত মুহূর্ত এখানে একসাথে রাখা আছে।
            </p>
          </div>
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm">
            <div className="inline-flex items-center gap-2 text-brand-800">
              <Images size={18} />
              <span className="text-sm font-semibold">মোট ছবি: {toBanglaNumber(filteredItems.length)}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              ক্যাটাগরি বেছে নিয়ে অ্যালবাম ঘুরে দেখুন, আর যেকোনো ছবিতে ক্লিক করলে বড় করে প্রিভিউ খুলবে।
            </p>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter ? "border border-brand-100 bg-white text-slate-700" : "bg-brand-700 text-white shadow-glow"}`}
            onClick={() => setFilter("")}
            type="button"
          >
            সব অ্যালবাম
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.slug ? "bg-brand-700 text-white shadow-glow" : "border border-brand-100 bg-white text-slate-700 hover:border-accent-300"
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
            className="group overflow-hidden rounded-[26px] border border-white/70 bg-paper-grain text-left shadow-paper transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(31,47,75,0.15)]"
          >
            <img
              src={item.thumbnail_url || item.image_url}
              alt={item.title}
              className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="space-y-1 p-4">
              <p className="truncate font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.category?.name || "সংরক্ষিত ফ্রেম"}</p>
            </div>
          </button>
        ))}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-5xl overflow-auto rounded-[30px] border border-white/10 bg-[rgba(12,18,30,0.96)] p-4 text-white md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl">{preview.title}</h2>
                {preview.category?.name ? <p className="mt-1 text-sm text-white/65">{preview.category.name}</p> : null}
              </div>
              <button type="button" onClick={() => setPreview(null)} className="ghost-button gap-2 border-white/20 bg-white/10 text-white hover:bg-white/15">
                <X size={16} />
                বন্ধ করুন
              </button>
            </div>
            <img src={preview.image_url} alt={preview.title} className="max-h-[70vh] w-full rounded-[24px] object-contain" />
            {preview.caption ? <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78">{preview.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
