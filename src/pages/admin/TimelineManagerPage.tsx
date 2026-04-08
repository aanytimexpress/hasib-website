import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { TimelineEvent } from "../../types/models";
import { supabase } from "../../lib/supabase";

const emptyForm = { event_date: "", title: "", description: "" };

export default function TimelineManagerPage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("timeline").select("*").order("sort_order");
    setEvents((data as TimelineEvent[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.event_date || !form.title) return;
    if (editingId) {
      await supabase.from("timeline").update(form).eq("id", editingId);
    } else {
      await supabase.from("timeline").insert({
        ...form,
        sort_order: events.length + 1
      });
    }
    setEditingId(null);
    setForm(emptyForm);
    await load();
  };

  const edit = (event: TimelineEvent) => {
    setEditingId(event.id);
    setForm({
      event_date: event.event_date,
      title: event.title,
      description: event.description || ""
    });
  };

  const remove = async (id: string) => {
    await supabase.from("timeline").delete().eq("id", id);
    await load();
  };

  const reorder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= events.length) return;
    const first = events[index];
    const second = events[targetIndex];
    await Promise.all([
      supabase.from("timeline").update({ sort_order: second.sort_order }).eq("id", first.id),
      supabase.from("timeline").update({ sort_order: first.sort_order }).eq("id", second.id)
    ]);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Timeline Manager" description="Add, edit, delete and reorder timeline events." />

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Event" : "Add Event"}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={form.event_date}
            onChange={(event) => setForm((prev) => ({ ...prev, event_date: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
          />
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Event title"
          />
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="rounded-lg border border-slate-300 p-2 md:col-span-2"
            placeholder="Event description"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void save()} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Save Event
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
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Timeline Events</h3>
        {events.length ? (
          <div className="space-y-2">
            {events.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-500">{item.event_date}</p>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-700">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(item)} className="rounded bg-slate-100 px-2 py-1 text-xs">
                    Edit
                  </button>
                  <button type="button" onClick={() => void remove(item.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                    Delete
                  </button>
                  <button type="button" onClick={() => void reorder(index, -1)} className="rounded bg-slate-100 px-2 py-1 text-xs">
                    Up
                  </button>
                  <button type="button" onClick={() => void reorder(index, 1)} className="rounded bg-slate-100 px-2 py-1 text-xs">
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No timeline events yet." />
        )}
      </AdminCard>
    </div>
  );
}
