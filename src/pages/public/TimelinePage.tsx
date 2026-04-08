import { useEffect, useState } from "react";
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
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">{page?.title || "জীবনের টাইমলাইন"}</h1>
        <div
          className="prose-bn"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(page?.content || "<p>জীবনের উল্লেখযোগ্য ঘটনাগুলো এখানে যুক্ত করা হবে।</p>")
          }}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative ml-2 border-l-2 border-brand-200 pl-6">
          {timeline.map((item) => (
            <article key={item.id} className="relative mb-6">
              <span className="absolute -left-[34px] top-1 h-4 w-4 rounded-full border-2 border-brand-500 bg-white" />
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{formatDate(item.event_date)}</p>
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="text-sm leading-7 text-slate-700">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
