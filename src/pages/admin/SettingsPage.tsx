import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" });
  const [newSocial, setNewSocial] = useState({ platform: "", url: "" });
  const [message, setMessage] = useState("");

  const load = async () => {
    const [{ data: settingsData }, { data: socialData }] = await Promise.all([
      supabase.from("site_settings").select("*").order("key"),
      supabase.from("social_links").select("*").order("sort_order")
    ]);
    setSettings((settingsData as SiteSetting[]) ?? []);
    setSocials((socialData as SocialLink[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveSetting = async (item: SiteSetting) => {
    await supabase.from("site_settings").update({ value: item.value }).eq("id", item.id);
    setMessage("Setting updated.");
    await load();
  };

  const addSetting = async () => {
    if (!newSetting.key.trim()) return;
    await supabase.from("site_settings").insert(newSetting);
    setNewSetting({ key: "", value: "", description: "" });
    await load();
  };

  const deleteSetting = async (id: string) => {
    await supabase.from("site_settings").delete().eq("id", id);
    await load();
  };

  const addSocial = async () => {
    if (!newSocial.platform.trim() || !newSocial.url.trim()) return;
    await supabase.from("social_links").insert({
      ...newSocial,
      sort_order: socials.length + 1
    });
    setNewSocial({ platform: "", url: "" });
    await load();
  };

  const updateSocial = async (item: SocialLink) => {
    await supabase.from("social_links").update({ platform: item.platform, url: item.url }).eq("id", item.id);
    await load();
  };

  const removeSocial = async (id: string) => {
    await supabase.from("social_links").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Settings" description="Site settings, author details, and social links." />

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Site Settings</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={newSetting.key}
            onChange={(event) => setNewSetting((prev) => ({ ...prev, key: event.target.value }))}
            placeholder="setting key"
            className="rounded-lg border border-slate-300 p-2"
          />
          <input
            value={newSetting.value}
            onChange={(event) => setNewSetting((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="value"
            className="rounded-lg border border-slate-300 p-2"
          />
          <button
            type="button"
            onClick={() => void addSetting()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Setting
          </button>
        </div>
        <div className="space-y-2">
          {settings.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_2fr_auto_auto]">
              <p className="self-center text-sm font-semibold text-slate-800">{item.key}</p>
              <input
                value={item.value}
                onChange={(event) =>
                  setSettings((prev) => prev.map((setting) => (setting.id === item.id ? { ...setting, value: event.target.value } : setting)))
                }
                className="rounded border border-slate-300 p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveSetting(item)}
                className="rounded bg-slate-100 px-2 py-1 text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => void deleteSetting(item.id)}
                className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Social Links</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={newSocial.platform}
            onChange={(event) => setNewSocial((prev) => ({ ...prev, platform: event.target.value }))}
            placeholder="Platform"
            className="rounded-lg border border-slate-300 p-2"
          />
          <input
            value={newSocial.url}
            onChange={(event) => setNewSocial((prev) => ({ ...prev, url: event.target.value }))}
            placeholder="URL"
            className="rounded-lg border border-slate-300 p-2"
          />
          <button
            type="button"
            onClick={() => void addSocial()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Social
          </button>
        </div>
        <div className="space-y-2">
          {socials.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_2fr_auto_auto]">
              <input
                value={item.platform}
                onChange={(event) =>
                  setSocials((prev) => prev.map((social) => (social.id === item.id ? { ...social, platform: event.target.value } : social)))
                }
                className="rounded border border-slate-300 p-2 text-sm"
              />
              <input
                value={item.url}
                onChange={(event) =>
                  setSocials((prev) => prev.map((social) => (social.id === item.id ? { ...social, url: event.target.value } : social)))
                }
                className="rounded border border-slate-300 p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void updateSocial(item)}
                className="rounded bg-slate-100 px-2 py-1 text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => void removeSocial(item.id)}
                className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      {message ? <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
