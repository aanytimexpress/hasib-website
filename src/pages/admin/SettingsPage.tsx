import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { SiteSetting, SocialLink } from "../../types/models";

interface NoticeState {
  type: "success" | "error";
  text: string;
}

interface ProfileFormState {
  full_name: string;
  location: string;
  language: string;
  bio: string;
  avatar_url: string;
}

function parseLanguageInput(value: string) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuthStore();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" });
  const [newSocial, setNewSocial] = useState({ platform: "", url: "" });
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    full_name: "",
    location: "",
    language: "বাংলা, ইংরেজি",
    bio: "",
    avatar_url: ""
  });

  const load = async () => {
    const [{ data: settingsData, error: settingsError }, { data: socialData, error: socialError }] = await Promise.all([
      supabase.from("site_settings").select("*").order("key"),
      supabase.from("social_links").select("*").order("sort_order")
    ]);

    if (settingsError || socialError) {
      setNotice({
        type: "error",
        text: settingsError?.message || socialError?.message || "সেটিংস লোড করা যায়নি।"
      });
      return;
    }

    setSettings((settingsData as SiteSetting[]) ?? []);
    setSocials((socialData as SocialLink[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!profile) return;

    setProfileForm({
      full_name: profile.full_name ?? "",
      location: profile.location ?? "",
      language: (profile.language ?? []).join(", ") || "বাংলা, ইংরেজি",
      bio: profile.bio ?? "",
      avatar_url: profile.avatar_url ?? ""
    });
  }, [profile]);

  const saveCurrentProfile = async () => {
    if (!profile) {
      setNotice({ type: "error", text: "সক্রিয় অ্যাডমিন প্রোফাইল পাওয়া যায়নি। আবার লগইন করুন।" });
      return;
    }

    const fullName = profileForm.full_name.trim();
    if (!fullName) {
      setNotice({ type: "error", text: "নাম লিখতে হবে।" });
      return;
    }

    setProfileSaving(true);
    const payload = {
      full_name: fullName,
      location: profileForm.location.trim() || null,
      language: parseLanguageInput(profileForm.language),
      bio: profileForm.bio.trim() || null,
      avatar_url: profileForm.avatar_url.trim() || null
    };

    const { error } = await supabase.from("users").update(payload).eq("id", profile.id);

    if (error) {
      setProfileSaving(false);
      setNotice({ type: "error", text: error.message || "প্রোফাইল আপডেট করা যায়নি।" });
      return;
    }

    const authMetadata: { full_name: string; avatar_url?: string } = { full_name: fullName };
    if (payload.avatar_url) {
      authMetadata.avatar_url = payload.avatar_url;
    }

    await supabase.auth.updateUser({ data: authMetadata });
    await refreshProfile();
    setProfileSaving(false);
    setNotice({ type: "success", text: "অ্যাডমিন প্রোফাইল সফলভাবে হালনাগাদ হয়েছে।" });
  };

  const saveSetting = async (item: SiteSetting) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: item.value, description: item.description })
      .eq("id", item.id);

    if (error) {
      setNotice({ type: "error", text: error.message || "সেটিংস সংরক্ষণ করা যায়নি।" });
      return;
    }

    setNotice({ type: "success", text: "সাইট সেটিংস সংরক্ষণ হয়েছে।" });
    await load();
  };

  const addSetting = async () => {
    if (!newSetting.key.trim()) {
      setNotice({ type: "error", text: "নতুন সেটিংসের key লিখতে হবে।" });
      return;
    }

    const { error } = await supabase.from("site_settings").insert({
      key: newSetting.key.trim(),
      value: newSetting.value.trim(),
      description: newSetting.description.trim() || null
    });

    if (error) {
      setNotice({ type: "error", text: error.message || "নতুন সেটিংস যোগ করা যায়নি।" });
      return;
    }

    setNewSetting({ key: "", value: "", description: "" });
    setNotice({ type: "success", text: "নতুন সেটিংস যোগ হয়েছে।" });
    await load();
  };

  const deleteSetting = async (id: string) => {
    const { error } = await supabase.from("site_settings").delete().eq("id", id);

    if (error) {
      setNotice({ type: "error", text: error.message || "সেটিংস মুছা যায়নি।" });
      return;
    }

    setNotice({ type: "success", text: "সেটিংস মুছে ফেলা হয়েছে।" });
    await load();
  };

  const addSocial = async () => {
    if (!newSocial.platform.trim() || !newSocial.url.trim()) {
      setNotice({ type: "error", text: "প্ল্যাটফর্ম এবং লিংক দুটোই লিখতে হবে।" });
      return;
    }

    const { error } = await supabase.from("social_links").insert({
      platform: newSocial.platform.trim(),
      url: newSocial.url.trim(),
      sort_order: socials.length + 1
    });

    if (error) {
      setNotice({ type: "error", text: error.message || "সোশ্যাল লিংক যোগ করা যায়নি।" });
      return;
    }

    setNewSocial({ platform: "", url: "" });
    setNotice({ type: "success", text: "নতুন সোশ্যাল লিংক যোগ হয়েছে।" });
    await load();
  };

  const updateSocial = async (item: SocialLink) => {
    const { error } = await supabase
      .from("social_links")
      .update({ platform: item.platform, url: item.url })
      .eq("id", item.id);

    if (error) {
      setNotice({ type: "error", text: error.message || "সোশ্যাল লিংক সংরক্ষণ করা যায়নি।" });
      return;
    }

    setNotice({ type: "success", text: "সোশ্যাল লিংক সংরক্ষণ হয়েছে।" });
    await load();
  };

  const removeSocial = async (id: string) => {
    const { error } = await supabase.from("social_links").delete().eq("id", id);

    if (error) {
      setNotice({ type: "error", text: error.message || "সোশ্যাল লিংক মুছা যায়নি।" });
      return;
    }

    setNotice({ type: "success", text: "সোশ্যাল লিংক মুছে ফেলা হয়েছে।" });
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="সেটিংস ও অ্যাডমিন প্রোফাইল"
        description="এখান থেকে বর্তমান অ্যাডমিনের নাম, ছবি, bio, ভাষা, সাইট সেটিংস এবং footer/social link হালনাগাদ করতে পারবে।"
      />

      <AdminCard className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">আমার অ্যাডমিন প্রোফাইল</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              এই তথ্য sidebar-এ এবং account identity-তে সঙ্গে সঙ্গে দেখা যাবে। public site-এর branding আলাদা করে site settings দিয়েও নিয়ন্ত্রণ করা যাবে।
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[26px] border border-brand-100 bg-[#fff7f1] px-4 py-3 text-sm text-slate-600">
            {profileForm.avatar_url ? (
              <img src={profileForm.avatar_url} alt={profileForm.full_name || "অ্যাডমিন"} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6d6c2,#fff2e9)] text-base font-semibold text-[#9d4d28]">
                {(profileForm.full_name || "অ্যাডমিন").trim().slice(0, 1) || "আ"}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800">{profile?.email ?? "ইমেইল নেই"}</p>
              <p>{profile?.role?.label ?? "Super Admin"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">পূর্ণ নাম</span>
            <input
              value={profileForm.full_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
              placeholder="হাসিবুর রহমান"
              className="soft-input"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">ইমেইল</span>
            <input value={profile?.email ?? ""} disabled className="soft-input cursor-not-allowed opacity-75" />
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">অবস্থান</span>
            <input
              value={profileForm.location}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="বগুড়া, বাংলাদেশ"
              className="soft-input"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">ভাষা</span>
            <input
              value={profileForm.language}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, language: event.target.value }))}
              placeholder="বাংলা, ইংরেজি"
              className="soft-input"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
            <span className="font-medium">অ্যাভাটার URL</span>
            <input
              value={profileForm.avatar_url}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
              placeholder="https://..."
              className="soft-input"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
            <span className="font-medium">সংক্ষিপ্ত পরিচিতি</span>
            <textarea
              value={profileForm.bio}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="নিজের পরিচয়, লেখালেখির ধরন বা ব্যক্তিগত note লিখতে পারো।"
              className="soft-input min-h-32 resize-y"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void saveCurrentProfile()} disabled={profileSaving} className="soft-button disabled:cursor-not-allowed disabled:opacity-70">
            {profileSaving ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সংরক্ষণ করো"}
          </button>
          <button
            type="button"
            onClick={() =>
              setProfileForm({
                full_name: profile?.full_name ?? "",
                location: profile?.location ?? "",
                language: (profile?.language ?? []).join(", ") || "বাংলা, ইংরেজি",
                bio: profile?.bio ?? "",
                avatar_url: profile?.avatar_url ?? ""
              })
            }
            className="ghost-button"
          >
            আগের তথ্য ফিরিয়ে আনো
          </button>
        </div>
      </AdminCard>

      <AdminCard className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">সাইট সেটিংস</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">site title, author name, quote বা যেকোনো key-value setting এখান থেকে নিয়ন্ত্রণ করতে পারবে।</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1.5fr_auto]">
          <input
            value={newSetting.key}
            onChange={(event) => setNewSetting((prev) => ({ ...prev, key: event.target.value }))}
            placeholder="setting key"
            className="soft-input"
          />
          <input
            value={newSetting.value}
            onChange={(event) => setNewSetting((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="value"
            className="soft-input"
          />
          <input
            value={newSetting.description}
            onChange={(event) => setNewSetting((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="বিবরণ"
            className="soft-input"
          />
          <button type="button" onClick={() => void addSetting()} className="soft-button whitespace-nowrap">
            নতুন সেটিংস
          </button>
        </div>

        <div className="space-y-3">
          {settings.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-[24px] border border-brand-100/70 bg-[#fffaf6] p-4 lg:grid-cols-[1fr_1.3fr_1.4fr_auto_auto]">
              <div className="self-center">
                <p className="text-sm font-semibold text-slate-800">{item.key}</p>
                <p className="text-xs text-slate-500">সিস্টেম key</p>
              </div>
              <input
                value={item.value}
                onChange={(event) =>
                  setSettings((prev) => prev.map((setting) => (setting.id === item.id ? { ...setting, value: event.target.value } : setting)))
                }
                className="soft-input"
              />
              <input
                value={item.description ?? ""}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev.map((setting) =>
                      setting.id === item.id ? { ...setting, description: event.target.value || null } : setting
                    )
                  )
                }
                className="soft-input"
                placeholder="বিবরণ"
              />
              <button type="button" onClick={() => void saveSetting(item)} className="ghost-button px-4 py-3">
                সংরক্ষণ
              </button>
              <button type="button" onClick={() => void deleteSetting(item.id)} className="rounded-full border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                মুছো
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">সোশ্যাল লিংক</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">footer বা contact section-এ দেখানোর জন্য social profile লিংকগুলো এখান থেকে বদলাও।</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <input
            value={newSocial.platform}
            onChange={(event) => setNewSocial((prev) => ({ ...prev, platform: event.target.value }))}
            placeholder="Platform"
            className="soft-input"
          />
          <input
            value={newSocial.url}
            onChange={(event) => setNewSocial((prev) => ({ ...prev, url: event.target.value }))}
            placeholder="URL"
            className="soft-input"
          />
          <button type="button" onClick={() => void addSocial()} className="soft-button whitespace-nowrap">
            নতুন লিংক
          </button>
        </div>

        <div className="space-y-3">
          {socials.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-[24px] border border-brand-100/70 bg-[#fffaf6] p-4 md:grid-cols-[1fr_2fr_auto_auto]">
              <input
                value={item.platform}
                onChange={(event) =>
                  setSocials((prev) => prev.map((social) => (social.id === item.id ? { ...social, platform: event.target.value } : social)))
                }
                className="soft-input"
              />
              <input
                value={item.url}
                onChange={(event) =>
                  setSocials((prev) => prev.map((social) => (social.id === item.id ? { ...social, url: event.target.value } : social)))
                }
                className="soft-input"
              />
              <button type="button" onClick={() => void updateSocial(item)} className="ghost-button px-4 py-3">
                সংরক্ষণ
              </button>
              <button type="button" onClick={() => void removeSocial(item.id)} className="rounded-full border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                মুছো
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      {notice ? (
        <p
          className={`rounded-[22px] border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
