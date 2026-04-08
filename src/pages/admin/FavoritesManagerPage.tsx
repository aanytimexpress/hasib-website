import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { Favorite } from "../../types/models";
import { supabase } from "../../lib/supabase";

const types: Favorite["type"][] = ["players", "teams", "foods", "books", "flowers", "places", "games", "colors"];

const emptyForm = {
  type: "players" as Favorite["type"],
  title: "",
  description: "",
  image_url: ""
};

export default function FavoritesManagerPage() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("favorites").select("*").order("type").order("sort_order");
    setItems((data as Favorite[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    if (editingId) {
      await supabase.from("favorites").update(form).eq("id", editingId);
    } else {
      await supabase.from("favorites").insert({
        ...form,
        sort_order: items.filter((item) => item.type === form.type).length + 1
      });
    }
    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  const edit = (item: Favorite) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      description: item.description || "",
      image_url: item.image_url || ""
    });
  };

  const remove = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Favorites Manager" description="Manage players, teams, foods, books and all favorites groups." />

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{editingId ? "Edit Favorite" : "Add Favorite"}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Favorite["type"] }))}
            className="rounded-lg border border-slate-300 p-2"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Title"
          />
          <input
            value={form.image_url}
            onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2 md:col-span-2"
            placeholder="Image URL (optional)"
          />
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            className="rounded-lg border border-slate-300 p-2 md:col-span-2"
            placeholder="Description"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void save()} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Save
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
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Favorites List</h3>
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-500">{item.type}</p>
                <p className="font-semibold text-slate-800">{item.title}</p>
                {item.description ? <p className="text-sm text-slate-700">{item.description}</p> : null}
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => edit(item)} className="rounded bg-slate-100 px-2 py-1 text-xs">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No favorites yet." />
        )}
      </AdminCard>
    </div>
  );
}
