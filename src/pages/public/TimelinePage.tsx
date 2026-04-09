import { useEffect, useState } from "react";
import { CalendarDays, Milestone } from "lucide-react";
import { PageRecord, TimelineEvent } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";
import { formatDate } from "../../lib/date";

const FALLBACK_TIMELINE_HTML =
  "<p>জীবনের উল্লেখযোগ্য সময়, ঘটনা ও গুরুত্বপূর্ণ মুহূর্তগুলো এখানে সাজানো থাকবে।</p>";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState<PageRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: timelineData }, { data: pageData }] = await Promise.all([
        supabase.from("timeline").select("*").order("sort_order", { ascending: true }),
        supabase.from("pages").select("*").eq("slug", "timeline").single()
      ]);
      setTimeline((timelineData as TimelineEvent[]) ?? []);
      setPage((pageData as PageRecord) ?? null);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-10 text-center shadow-panel backdrop-blur-xl">
        <p className="text-base text-slate-600">Timeline লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white/85 via-sky-50/80 to-blue-100/70 p-7 shadow-[0_24px_70px_rgba(53,88,144,0.18)] backdrop-blur-xl md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            জীবনের টাইমলাইন
          </p>
          <h1 className="mt-3 text-balance text-3xl font-bold text-slate-900 md:text-5xl">
            {page?.title || "জীবনের পথচলা"}
          </h1>
          <div
            className="prose-bn mx-auto mt-3 max-w-3xl text-left md:text-center"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.content || FALLBACK_TIMELINE_HTML)
            }}
          />
        </div>
      </section>

      <section className="rounded-[26px] border border-white/70 bg-white/72 p-6 shadow-[0_16px_42px_rgba(29,64,121,0.14)] backdrop-blur-xl md:p-8">
        <h2 className="mb-6 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <Milestone size={22} className="text-brand-700" />
          গুরুত্বপূর্ণ মুহূর্ত
        </h2>

        {timeline.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-8 text-center">
            <p className="text-slate-600">এখনও কোনো timeline event যোগ করা হয়নি।</p>
          </div>
        ) : (
          <div className="relative pl-7 md:pl-10">
            <span className="absolute left-2 top-0 h-full w-[2px] bg-gradient-to-b from-brand-300 via-brand-200 to-sky-100" />
            <div className="space-y-4">
              {timeline.map((item) => (
                <article
                  key={item.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md md:p-5"
                >
                  <span className="absolute -left-[31px] top-6 h-4 w-4 rounded-full border-2 border-brand-500 bg-white shadow-sm" />
                  <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700">
                    <CalendarDays size={13} />
                    {formatDate(item.event_date)}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900 md:text-xl">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-7 text-slate-700 md:text-base">{item.description}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
