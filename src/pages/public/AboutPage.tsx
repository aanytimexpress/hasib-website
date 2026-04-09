import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Languages, NotebookPen } from "lucide-react";
import { PageRecord, UserProfile } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";

const DEFAULT_EDUCATION = [
  "Bogura Cantonment Public School and College",
  "Government Azizul Haque College"
];

const FALLBACK_ABOUT_HTML =
  "<p>এই পেইজের কনটেন্ট admin dashboard থেকে আপডেট করুন। আপনার পরিচয়, শিক্ষা, অভিজ্ঞতা এবং ব্যক্তিগত গল্প এখানে দেখানো হবে।</p>";

export default function AboutPage() {
  const [page, setPage] = useState<PageRecord | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: pageData }, { data: userData }] = await Promise.all([
        supabase.from("pages").select("*").eq("slug", "about").single(),
        supabase.from("users").select("*, role:roles(*)").limit(1).single()
      ]);
      setPage((pageData as PageRecord) ?? null);
      setProfile((userData as UserProfile) ?? null);
      setLoading(false);
    };
    void load();
  }, []);

  const education = useMemo(() => {
    const raw = page?.json_content?.education;
    if (!Array.isArray(raw)) return DEFAULT_EDUCATION;
    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }, [page?.json_content]);

  const languages =
    profile?.language && profile.language.length > 0 ? profile.language : ["Bangla", "English"];
  const fullName = profile?.full_name || "Hasibur Rahman";
  const location = profile?.location || "Bogura, Bangladesh";
  const avatarUrl =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=e5edff&color=1f4a8a&size=240`;

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-10 text-center shadow-panel backdrop-blur-xl">
        <p className="text-base text-slate-600">About section লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white/85 via-sky-50/80 to-blue-100/70 p-7 shadow-[0_24px_70px_rgba(53,88,144,0.18)] backdrop-blur-xl md:p-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <p className="rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            লেখকের পরিচয়
          </p>
          <h1 className="text-balance text-3xl font-bold text-slate-900 md:text-5xl">
            {page?.title || "আমার সম্পর্কে"}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-700 md:text-lg">
            এই জার্নালে আমি জীবনের গল্প, স্মৃতি, অনুভূতি এবং পথচলার অভিজ্ঞতা ভাগ করি।
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-5 rounded-[26px] border border-white/70 bg-white/72 p-5 shadow-[0_16px_40px_rgba(33,74,141,0.13)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={avatarUrl}
              alt={fullName}
              loading="lazy"
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
            />
            <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
            <p className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-slate-600">
              <MapPin size={14} />
              {location}
            </p>
          </div>

          <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
            <h3 className="mb-2 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Languages size={18} className="text-brand-700" />
              ভাষা
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
                >
                  {language}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
            <h3 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <GraduationCap size={18} className="text-brand-700" />
              শিক্ষা
            </h3>
            <ul className="space-y-2">
              {education.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-7 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </aside>

        <section className="rounded-[26px] border border-white/70 bg-white/72 p-6 shadow-[0_16px_42px_rgba(29,64,121,0.14)] backdrop-blur-xl md:p-8">
          <h3 className="mb-4 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <NotebookPen size={22} className="text-brand-700" />
            ব্যক্তিগত গল্প
          </h3>
          <div
            className="prose-bn"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.content || FALLBACK_ABOUT_HTML)
            }}
          />

          <div className="mt-6">
            <Link
              to="/blog"
              className="inline-flex items-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-800"
            >
              আমার লেখা পড়ুন
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
