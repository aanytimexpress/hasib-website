import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { SeoSetting } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { slugify } from "../../lib/slug";

const emptyForm = {
  route_path: "/",
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  og_image: "",
  keywords: ""
};

export default function SeoPage() {
  const [records, setRecords] = useState<SeoSetting[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await supabase.from("seo_settings").select("*").order("route_path");
    setRecords((data as SeoSetting[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const payload = {
      route_path: form.route_path.startsWith("/") ? form.route_path : `/${form.route_path}`,
      meta_title: form.meta_title,
      meta_description: form.meta_description || null,
      canonical_url: form.canonical_url || null,
      og_image: form.og_image || null,
      keywords: form.keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    if (editingId) {
      await supabase.from("seo_settings").update(payload).eq("id", editingId);
    } else {
      await supabase.from("seo_settings").insert(payload);
    }
    setForm(emptyForm);
    setEditingId(null);
    setMessage("SEO settings saved.");
    await load();
  };

  const edit = (item: SeoSetting) => {
    setEditingId(item.id);
    setForm({
      route_path: item.route_path,
      meta_title: item.meta_title,
      meta_description: item.meta_description || "",
      canonical_url: item.canonical_url || "",
      og_image: item.og_image || "",
      keywords: (item.keywords ?? []).join(", ")
    });
  };

  const remove = async (id: string) => {
    await supabase.from("seo_settings").delete().eq("id", id);
    await load();
  };

  const generateOg = () => {
    if (!form.meta_title) return;
    const key = slugify(form.meta_title);
    setForm((prev) => ({
      ...prev,
      og_image: `${window.location.origin}/api/og?title=${encodeURIComponent(key)}`
    }));
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="SEO Manager" description="Meta title, description, OG, slug, and canonical URL controls." />

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{editingId ? "Edit SEO Record" : "Add SEO Record"}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Route Path</label>
            <div className="flex gap-2">
              <input
                value={form.route_path}
                onChange={(event) => setForm((prev) => ({ ...prev, route_path: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2"
                placeholder="/blog/my-post"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, route_path: `/${slugify(prev.meta_title || "page")}` }))}
                className="rounded bg-slate-100 px-2 text-xs"
              >
                Auto Slug
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Meta Title</label>
            <input
              value={form.meta_title}
              onChange={(event) => setForm((prev) => ({ ...prev, meta_title: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Meta Description</label>
            <textarea
              rows={3}
              value={form.meta_description}
              onChange={(event) => setForm((prev) => ({ ...prev, meta_description: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Canonical URL</label>
            <input
              value={form.canonical_url}
              onChange={(event) => setForm((prev) => ({ ...prev, canonical_url: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">OpenGraph Image URL</label>
            <div className="flex gap-2">
              <input
                value={form.og_image}
                onChange={(event) => setForm((prev) => ({ ...prev, og_image: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <button type="button" onClick={generateOg} className="rounded bg-slate-100 px-2 text-xs">
                Auto OG
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Keywords (comma separated)</label>
            <input
              value={form.keywords}
              onChange={(event) => setForm((prev) => ({ ...prev, keywords: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void save()} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Save SEO
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">SEO Records</h3>
        <div className="space-y-2">
          {records.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold text-slate-800">{item.route_path}</p>
              <p className="text-sm text-slate-600">{item.meta_title}</p>
              <p className="text-xs text-slate-500">{item.meta_description}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => edit(item)} className="rounded bg-slate-100 px-2 py-1 text-xs">
                  Edit
                </button>
                <button type="button" onClick={() => void remove(item.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {message ? <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
