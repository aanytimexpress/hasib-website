import { DragEvent, useEffect, useMemo, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { Menu, MenuItem } from "../../types/models";
import { supabase } from "../../lib/supabase";

export default function MenuManagerPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [location, setLocation] = useState<"header" | "footer">("header");
  const [newItem, setNewItem] = useState({ label: "", path: "", target: "_self" as "_self" | "_blank" });
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: menuData }, { data: itemData }] = await Promise.all([
      supabase.from("menus").select("*").order("location"),
      supabase.from("menu_items").select("*").order("sort_order")
    ]);
    setMenus((menuData as Menu[]) ?? []);
    setItems((itemData as MenuItem[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const activeMenu = useMemo(() => menus.find((item) => item.location === location), [menus, location]);
  const activeItems = useMemo(
    () => items.filter((item) => item.menu_id === activeMenu?.id).sort((a, b) => a.sort_order - b.sort_order),
    [items, activeMenu]
  );

  const ensureMenu = async (): Promise<string | null> => {
    if (activeMenu?.id) return activeMenu.id;
    const { data, error } = await supabase
      .from("menus")
      .insert({ location, label: `${location} menu` })
      .select("*")
      .single();
    if (error || !data) return null;
    await load();
    return data.id;
  };

  const addItem = async () => {
    if (!newItem.label.trim() || !newItem.path.trim()) return;
    const menuId = await ensureMenu();
    if (!menuId) return;
    await supabase.from("menu_items").insert({
      menu_id: menuId,
      label: newItem.label,
      path: newItem.path,
      target: newItem.target,
      sort_order: activeItems.length + 1
    });
    setNewItem({ label: "", path: "", target: "_self" });
    await load();
  };

  const removeItem = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    await load();
  };

  const saveOrder = async (ordered: MenuItem[]) => {
    await Promise.all(
      ordered.map((item, index) => supabase.from("menu_items").update({ sort_order: index + 1 }).eq("id", item.id))
    );
    await load();
  };

  const onDropItem = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const working = [...activeItems];
    const dragIndex = working.findIndex((item) => item.id === dragId);
    const dropIndex = working.findIndex((item) => item.id === targetId);
    if (dragIndex === -1 || dropIndex === -1) return;
    const [moved] = working.splice(dragIndex, 1);
    working.splice(dropIndex, 0, moved);
    setDragId(null);
    await saveOrder(working);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Menu Manager" description="Manage header/footer menu with drag-and-drop ordering." />

      <AdminCard className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocation("header")}
            className={`rounded-full px-4 py-2 text-sm ${
              location === "header" ? "bg-brand-700 text-white" : "bg-slate-100"
            }`}
          >
            Header Menu
          </button>
          <button
            type="button"
            onClick={() => setLocation("footer")}
            className={`rounded-full px-4 py-2 text-sm ${
              location === "footer" ? "bg-brand-700 text-white" : "bg-slate-100"
            }`}
          >
            Footer Menu
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={newItem.label}
            onChange={(event) => setNewItem((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="Label"
            className="rounded-lg border border-slate-300 p-2"
          />
          <input
            value={newItem.path}
            onChange={(event) => setNewItem((prev) => ({ ...prev, path: event.target.value }))}
            placeholder="/path"
            className="rounded-lg border border-slate-300 p-2"
          />
          <select
            value={newItem.target}
            onChange={(event) => setNewItem((prev) => ({ ...prev, target: event.target.value as "_self" | "_blank" }))}
            className="rounded-lg border border-slate-300 p-2"
          >
            <option value="_self">Same tab</option>
            <option value="_blank">New tab</option>
          </select>
          <button
            type="button"
            onClick={() => void addItem()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Menu Item
          </button>
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">{location} menu items</h3>
        <div className="space-y-2">
          {activeItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={onDragOver}
              onDrop={() => void onDropItem(item.id)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">
                  {item.path} ({item.target})
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removeItem(item.id)}
                className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
