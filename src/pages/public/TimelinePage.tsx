import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { PageRecord, TimelineEvent } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";
import { formatDate } from "../../lib/date";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState<PageRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: timelineData }, { data: pageData }] = await Promise.all([
        supabase.from("timeline").select("*").order("sort_order", { ascending: true }),
        supabase.from("pages").select("*").eq("slug", "timeline").single()
      ]);
      setTimeline((timelineData as TimelineEvent[]) ?? []);
      setPage((pageData as PageRecord) ?? null);
    };
    void load();
  }, []);

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="space-y-4">
          <p className="section-kicker">সময়ের রেখা</p>
          <h1 className="section-title">জীবনের পথ ধরে সাজানো কিছু উল্লেখযোগ্য দিন</h1>
          <div
            className="prose-bn max-w-3xl"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.content || "<p>জীবনের উল্লেখযোগ্য ঘটনা, উপলক্ষ আর মোড় ঘোরানো সময়গুলো এখানে সাজানো আছে।</p>")
            }}
          />
        </div>
      </section>

      <section className="section-card">
        <div className="relative ml-2 border-l-2 border-brand-200 pl-6 md:ml-4 md:pl-8">
          {timeline.map((item) => (
            <article key={item.id} className="relative mb-8 rounded-[26px] border border-brand-100 bg-white/85 p-5 shadow-sm">
              <span className="absolute -left-[39px] top-6 h-4 w-4 rounded-full border-4 border-paper bg-accent-500 md:-left-[49px]" />
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                <Clock3 size={14} />
                {formatDate(item.event_date)}
              </div>
              <h2 className="mt-4 font-display text-3xl text-brand-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-8 text-slate-700">{item.description}</p>
            </article>
          ))}
          {!timeline.length ? <p className="text-sm text-slate-500">এখানে এখনো কোনো timeline event যোগ করা হয়নি।</p> : null}
        </div>
      </section>
    </div>
  );
}
