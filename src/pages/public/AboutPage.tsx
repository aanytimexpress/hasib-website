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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name || "Hasibur Rahman"}</h1>
        <p className="text-sm text-slate-600">{profile?.location || "Bogura, Bangladesh"}</p>
        <p className="text-sm text-slate-600">Languages: {(profile?.language ?? ["Bangla", "English"]).join(", ")}</p>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-800">Education</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
            {education.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">{page?.title || "আমার সম্পর্কে"}</h2>
        <div
          className="prose-bn"
          dangerouslySetInnerHTML={{
            __html:
              sanitizeHtml(page?.content || "") ||
              "<p>এই পেইজের কন্টেন্ট admin dashboard থেকে আপডেট করুন।</p>"
          }}
        />
      </section>
    </div>
  );
}
