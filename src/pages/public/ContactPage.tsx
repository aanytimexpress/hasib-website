import { FormEvent, useEffect, useState } from "react";
import { Mail, Phone, SendHorizontal, MessageSquareHeart } from "lucide-react";
import { PageRecord, SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";

const FALLBACK_CONTACT_HTML =
  "<p>যোগাযোগের জন্য নিচের ফর্ম ব্যবহার করুন। আপনি মতামত, পরামর্শ বা ব্যক্তিগত কোনো বার্তা পাঠাতে পারেন।</p>";

type FormStatus = {
  type: "success" | "error";
  message: string;
};

export default function ContactPage() {
  const [page, setPage] = useState<PageRecord | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: pageData }, { data: settingsData }, { data: socialData }] = await Promise.all([
        supabase.from("pages").select("*").eq("slug", "contact").single(),
        supabase.from("site_settings").select("*").in("key", ["contact_email", "contact_phone"]),
        supabase.from("social_links").select("*").order("sort_order", { ascending: true })
      ]);
      setPage((pageData as PageRecord) ?? null);
      setSettings((settingsData as SiteSetting[]) ?? []);
      setSocials((socialData as SocialLink[]) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setStatus(null);
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim()
    });
    setSubmitting(false);

    if (error) {
      setStatus({ type: "error", message: "বার্তা পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন।" });
      return;
    }
    setStatus({ type: "success", message: "আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আন্তরিক ধন্যবাদ।" });
    setForm({ name: "", email: "", message: "" });
  };

  const contactEmail = settings.find((item) => item.key === "contact_email")?.value || "author@example.com";
  const contactPhone = settings.find((item) => item.key === "contact_phone")?.value || "উল্লেখ করা হয়নি";

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-10 text-center shadow-panel backdrop-blur-xl">
        <p className="text-base text-slate-600">যোগাযোগের অংশ প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white/85 via-sky-50/80 to-blue-100/70 p-7 shadow-[0_24px_70px_rgba(53,88,144,0.18)] backdrop-blur-xl md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            যোগাযোগ
          </p>
          <h1 className="mt-3 text-balance text-3xl font-bold text-slate-900 md:text-5xl">
            {page?.title || "যোগাযোগ করুন"}
          </h1>
          <div
            className="prose-bn mx-auto mt-3 max-w-3xl text-left md:text-center"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.content || FALLBACK_CONTACT_HTML)
            }}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-[26px] border border-white/70 bg-white/72 p-6 shadow-[0_16px_42px_rgba(29,64,121,0.14)] backdrop-blur-xl md:p-7">
          <h2 className="mb-4 inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <MessageSquareHeart size={22} className="text-brand-700" />
            বার্তা পাঠান
          </h2>

          <form className="space-y-3" onSubmit={(event) => void submit(event)}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
              placeholder="আপনার নাম"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
              placeholder="ইমেইল ঠিকানা"
            />
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500"
              placeholder="আপনার বার্তা লিখুন..."
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-800 disabled:opacity-70"
            >
              <SendHorizontal size={16} />
              {submitting ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
            </button>
          </form>

          {status ? (
            <p
              className={`mt-4 rounded-xl px-3 py-2 text-sm ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-[26px] border border-white/70 bg-white/72 p-5 shadow-[0_16px_40px_rgba(33,74,141,0.13)] backdrop-blur-xl md:p-6">
          <h2 className="text-xl font-semibold text-slate-900">যোগাযোগের ঠিকানা</h2>

          <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
            <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Mail size={16} className="text-brand-700" />
              ইমেইল
            </p>
            <p className="text-sm text-slate-700">{contactEmail}</p>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
            <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Phone size={16} className="text-brand-700" />
              ফোন
            </p>
            <p className="text-sm text-slate-700">{contactPhone}</p>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">সামাজিক মাধ্যম</h3>
            <div className="flex flex-wrap gap-2">
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.platform}
                </a>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
