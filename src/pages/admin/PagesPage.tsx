import { useEffect, useMemo, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { HomepageSection, PageRecord } from "../../types/models";
import { supabase } from "../../lib/supabase";

const pageOptions = [
  { key: "home", label: "Homepage" },
  { key: "about", label: "About" },
  { key: "favorites", label: "Favorites" },
  { key: "timeline", label: "Timeline" },
  { key: "contact", label: "Contact" }
];

export default function PagesPage() {
  const [selected, setSelected] = useState("home");
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [form, setForm] = useState({ title: "", content: "", json_content: "{}" });
  const [message, setMessage] = useState("");

  const load = async () => {
    const [{ data: pageData }, { data: sectionData }] = await Promise.all([
      supabase.from("pages").select("*"),
      supabase.from("homepage_sections").select("*").order("sort_order", { ascending: true })
    ]);
    setPages((pageData as PageRecord[]) ?? []);
    setSections((sectionData as HomepageSection[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const currentPage = useMemo(() => pages.find((item) => item.slug === selected), [pages, selected]);

  useEffect(() => {
    if (selected === "home") return;
    setForm({
      title: currentPage?.title || "",
      content: currentPage?.content || "",
      json_content: JSON.stringify(currentPage?.json_content || {}, null, 2)
    });
  }, [currentPage, selected]);

  const savePage = async () => {
    try {
      const parsedJson = JSON.parse(form.json_content || "{}");
      if (currentPage) {
        await supabase
          .from("pages")
          .update({ title: form.title, content: form.content, json_content: parsedJson })
          .eq("id", currentPage.id);
      } else {
        await supabase.from("pages").insert({
          slug: selected,
          title: form.title || selected,
          content: form.content,
          json_content: parsedJson
        });
      }
      setMessage("Page saved successfully.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const updateSection = async (sectionId: string, payload: Partial<HomepageSection>) => {
    await supabase.from("homepage_sections").update(payload).eq("id", sectionId);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Pages Manager" description="Edit all static pages and homepage sections dynamically." />

      <div className="flex flex-wrap gap-2">
        {pageOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSelected(item.key)}
            className={`rounded-full px-4 py-2 text-sm ${
              selected === item.key ? "bg-brand-700 text-white" : "bg-white text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {selected === "home" ? (
        <AdminCard>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Homepage Sections</h3>
          {sections.length ? (
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{section.section_key}</p>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(event) => void updateSection(section.id, { enabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>
                  <input
                    value={section.title || ""}
                    onChange={(event) => {
                      setSections((prev) =>
                        prev.map((item) =>
                          item.id === section.id ? { ...item, title: event.target.value } : item
                        )
                      );
                    }}
                    onBlur={(event) => void updateSection(section.id, { title: event.target.value })}
                    className="mb-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    placeholder="Section title"
                  />
                  <textarea
                    value={section.content || ""}
                    onChange={(event) => {
                      setSections((prev) =>
                        prev.map((item) =>
                          item.id === section.id ? { ...item, content: event.target.value } : item
                        )
                      );
                    }}
                    onBlur={(event) => void updateSection(section.id, { content: event.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                    placeholder="Section content"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No homepage sections found." />
          )}
        </AdminCard>
      ) : (
        <AdminCard className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">{selected} page editor</h3>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">HTML Content</label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              rows={10}
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">JSON Content</label>
            <textarea
              value={form.json_content}
              onChange={(event) => setForm((prev) => ({ ...prev, json_content: event.target.value }))}
              rows={8}
              className="w-full rounded-lg border border-slate-300 p-2 font-mono text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => void savePage()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Save Page
          </button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </AdminCard>
      )}
    </div>
  );
}
