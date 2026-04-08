import { useEffect, useState } from "react";
import { PageRecord, UserProfile } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";

export default function AboutPage() {
  const [page, setPage] = useState<PageRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: pageData }, { data: userData }] = await Promise.all([
        supabase.from("pages").select("*").eq("slug", "about").single(),
        supabase.from("users").select("*, role:roles(*)").limit(1).single()
      ]);
      setPage((pageData as PageRecord) ?? null);
      setProfile((userData as UserProfile) ?? null);
    };
    void load();
  }, []);

  const education = (page?.json_content?.education as string[]) || [
    "Bogura Cantonment Public School and College",
    "Government Azizul Haque College"
  ];

  return (
    <div className="page-shell">
      <section className="page-hero">
        <p className="section-kicker">পরিচিতি</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div className="space-y-3">
            <h1 className="section-title">{profile?.full_name || "Hasibur Rahman"}</h1>
            <p className="text-base leading-8 text-slate-600">{profile?.location || "Bogura, Bangladesh"}</p>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            এই পাতায় লেখকের পথচলা, শিক্ষা, ভাষা আর ব্যক্তিগত লেখালেখির ভাবনা একটি উষ্ণ, সাহিত্যিক ফ্রেমে সাজানো আছে।
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
        <aside className="section-card space-y-4">
          <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">ভাষা</p>
            <p className="text-sm leading-7 text-slate-600">
              {(profile?.language ?? ["Bangla", "English"]).join(", ")}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-sm">
            <h2 className="mb-3 font-display text-2xl text-brand-900">শিক্ষা</h2>
            <ul className="list-inside list-disc space-y-2 text-sm leading-7 text-slate-700">
              {education.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="section-card">
          <h2 className="mb-4 font-display text-3xl text-brand-900">{page?.title || "আমার সম্পর্কে"}</h2>
          <div
            className="prose-bn"
            dangerouslySetInnerHTML={{
              __html:
                sanitizeHtml(page?.content || "") ||
                "<p>এই পাতার কনটেন্ট admin dashboard থেকে আপডেট করা যাবে।</p>"
            }}
          />
        </section>
      </div>
    </div>
  );
}
