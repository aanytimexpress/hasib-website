import { FormEvent, useEffect, useState } from "react";
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
    setStatus("আপনার বার্তা সফলভাবে পাঠানো হয়েছে।");
    setForm({ name: "", email: "", message: "" });
  };

  const contactEmail = settings.find((item) => item.key === "contact_email")?.value;
  const contactPhone = settings.find((item) => item.key === "contact_phone")?.value;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="mb-3 text-3xl font-bold text-slate-900">{page?.title || "যোগাযোগ"}</h1>
        <div
          className="prose-bn"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(page?.content || "<p>যোগাযোগের জন্য নিচের ফর্ম ব্যবহার করুন।</p>")
          }}
        />
        <form className="mt-5 space-y-3" onSubmit={(event) => void submit(event)}>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 p-2"
            placeholder="আপনার নাম"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 p-2"
            placeholder="ইমেইল"
          />
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 p-2"
            placeholder="বার্তা লিখুন"
          />
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Send Message
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </section>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-slate-900">Contact Info</h2>
        <p className="text-sm text-slate-700">Email: {contactEmail || "author@example.com"}</p>
        <p className="text-sm text-slate-700">Phone: {contactPhone || "-"}</p>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Social Links</h3>
          {socials.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block text-sm text-brand-700">
              {item.platform}
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
