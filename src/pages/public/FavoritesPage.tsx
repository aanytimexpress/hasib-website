import { useEffect, useMemo, useState } from "react";
import { Favorite, PageRecord } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";
import { toBanglaNumber } from "../../lib/locale";

const typeLabels: Record<Favorite["type"], string> = {
  players: "খেলোয়াড়",
  teams: "দল",
  foods: "খাবার",
  books: "বই",
  flowers: "ফুল",
  places: "স্থান",
  games: "খেলা",
  colors: "রঙ"
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [page, setPage] = useState<PageRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: favoriteData }, { data: pageData }] = await Promise.all([
        supabase.from("favorites").select("*").order("type").order("sort_order"),
        supabase.from("pages").select("*").eq("slug", "favorites").single()
      ]);
      setFavorites((favoriteData as Favorite[]) ?? []);
      setPage((pageData as PageRecord) ?? null);
    };
    void load();
  }, []);

  const grouped = useMemo(() => {
    return favorites.reduce<Record<string, Favorite[]>>((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [favorites]);

  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="section-kicker">পছন্দের তালিকা</p>
        <h1 className="section-title mt-4">{page?.title || "আমার পছন্দ"}</h1>
        <div
          className="prose-bn mt-4 max-w-3xl"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(page?.content || "<p>ড্যাশবোর্ড থেকে এই অংশ সম্পাদনা করুন।</p>")
          }}
        />
      </section>

      <section className="space-y-5">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="section-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-brand-900">{typeLabels[type as Favorite["type"]] ?? type}</h2>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500">
                {toBanglaNumber(items.length)} টি
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-sm">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-40 bg-hero-grid" />
                  )}
                  <div className="space-y-2 p-4">
                    <p className="font-display text-2xl text-brand-900">{item.title}</p>
                    {item.description ? <p className="text-sm leading-7 text-slate-600">{item.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
