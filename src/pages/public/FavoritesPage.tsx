import { useEffect, useMemo, useState } from "react";
import { Favorite, PageRecord } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";

const typeLabels: Record<Favorite["type"], string> = {
  players: "Players",
  teams: "Teams",
  foods: "Foods",
  books: "Books",
  flowers: "Flowers",
  places: "Places",
  games: "Games",
  colors: "Colors"
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
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{page?.title || "আমার পছন্দ"}</h1>
        <div
          className="prose-bn"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(page?.content || "<p>ড্যাশবোর্ড থেকে এই অংশ সম্পাদনা করুন।</p>")
          }}
        />
      </section>

      <section className="space-y-4">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              {typeLabels[type as Favorite["type"]] ?? type}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="mb-2 h-36 w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
