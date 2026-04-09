import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { localizeStaticText } from "../lib/locale";
import { SiteSetting, SocialLink } from "../types/models";

export const siteNavItems = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "লেখা", path: "/blog" },
  { label: "স্মৃতি", path: "/memories" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "টাইমলাইন", path: "/timeline" },
  { label: "যোগাযোগ", path: "/contact" }
];

export const siteFooterLinks = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "লেখা", path: "/blog" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "যোগাযোগ", path: "/contact" }
];

export function getMonogram(value: string) {
  const letters = Array.from(value.replace(/\s+/g, "")).slice(0, 2).join("");
  return letters || "হা";
}

export function useSiteChrome() {
  const [siteTitle, setSiteTitle] = useState("হাসিবুর রহমান জার্নাল");
  const [authorName, setAuthorName] = useState("হাসিবুর রহমান");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["site_title", "author_name", "author_avatar"]);

      const settings = (settingsData as SiteSetting[] | null) ?? [];
      const titleSetting = settings.find((item) => item.key === "site_title");
      const nameSetting = settings.find((item) => item.key === "author_name");
      const avatarSetting = settings.find((item) => item.key === "author_avatar");

      if (titleSetting?.value) setSiteTitle(titleSetting.value);
      if (nameSetting?.value) setAuthorName(nameSetting.value);
      if (avatarSetting?.value) setAuthorAvatar(avatarSetting.value);

      const { data: socialData } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true });
      setSocials((socialData as SocialLink[]) ?? []);
    };

    void load();
  }, []);

  const localizedSiteTitle = useMemo(() => localizeStaticText(siteTitle) || siteTitle, [siteTitle]);
  const localizedAuthorName = useMemo(() => localizeStaticText(authorName) || authorName, [authorName]);
  const monogram = useMemo(() => getMonogram(localizedAuthorName), [localizedAuthorName]);

  return {
    siteTitle: localizedSiteTitle,
    authorName: localizedAuthorName,
    authorAvatar,
    socials,
    monogram
  };
}
