import { FormEvent, useEffect, useState } from "react";
import { Mail, Phone, Send, Share2 } from "lucide-react";
import { PageRecord, SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";

export default function ContactPage() {
  const [page, setPage] = useState<PageRecord | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: pageData }, { data: settingsData }, { data: socialData }] = await Promise.all([
        supabase.from("pages").select("*").eq("slug", "contact").single(),
        supabase.from("site_settings").select("*").in("key", ["contact_email", "contact_phone"]),
        supabase.from("social_links").select("*").order("sort_order", { ascending: true })
      ]);
      setPage((pageData as PageRecord) ?? null);
      setSettings((settingsData as SiteSetting[]) ?? []);
      setSocials((socialData as SocialLink[]) ?? []);
    };
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name,
      email: form.email,
      message: form.message
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("আপনার বার্তা সফলভাবে পাঠানো হয়েছে। দ্রুতই যোগাযোগ করা হবে।");
    setForm({ name: "", email: "", message: "" });
  };

  const contactEmail = settings.find((item) => item.key === "contact_email")?.value;
  const contactPhone = settings.find((item) => item.key === "contact_phone")?.value;

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">যোগাযোগ</p>
            <h1 className="section-title">কথা বলতে চাইলে এই দরজাটাই খোলা</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700">
              লেখা, সহযোগিতা, মতামত কিংবা শুধু একটি শুভেচ্ছা পাঠাতে চাইলে নিচের ফর্ম ব্যবহার করতে পারো।
            </p>
          </div>
          <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2"><Mail size={16} /> {contactEmail || "author@example.com"}</div>
              <div className="inline-flex items-center gap-2"><Phone size={16} /> {contactPhone || "ফোন নম্বর যোগ করা হয়নি"}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="section-card">
          <div
            className="prose-bn"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(page?.content || "<p>যোগাযোগের জন্য নিচের ফর্মটি ব্যবহার করুন।</p>")
            }}
          />

          <form className="mt-6 space-y-3" onSubmit={(event) => void submit(event)}>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="soft-input"
              placeholder="আপনার নাম"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="soft-input"
              placeholder="ইমেইল ঠিকানা"
            />
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              className="soft-input min-h-[180px] resize-y"
              placeholder="যে কথা বলতে চান, এখানে লিখুন"
            />
            <button type="submit" className="soft-button gap-2">
              <Send size={16} />
              বার্তা পাঠান
            </button>
            {status ? <p className="text-sm text-slate-600">{status}</p> : null}
          </form>
        </section>

        <aside className="space-y-4">
          <div className="section-card space-y-4">
            <div>
              <p className="section-kicker">যোগাযোগের ঠিকানা</p>
              <h2 className="mt-3 font-display text-3xl text-brand-900">সরাসরি সংযোগ</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-[24px] bg-white/85 px-4 py-4">
                <p className="mb-1 font-semibold text-brand-900">ইমেইল</p>
                <p>{contactEmail || "author@example.com"}</p>
              </div>
              <div className="rounded-[24px] bg-white/85 px-4 py-4">
                <p className="mb-1 font-semibold text-brand-900">ফোন</p>
                <p>{contactPhone || "এখনো যোগ করা হয়নি"}</p>
              </div>
            </div>
          </div>

          <div className="section-card space-y-4">
            <div className="inline-flex items-center gap-2 text-brand-800">
              <Share2 size={18} />
              <span className="text-sm font-semibold uppercase tracking-[0.22em]">সামাজিক মাধ্যম</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-brand-100 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-accent-300 hover:text-brand-700"
                >
                  {item.platform}
                </a>
              ))}
              {!socials.length ? <p className="text-sm text-slate-500">এখনো সামাজিক লিংক যোগ করা হয়নি।</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
