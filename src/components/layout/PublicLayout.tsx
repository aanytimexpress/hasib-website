import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Search } from "lucide-react";
import { SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { isAdminRole } from "../../constants/roles";
import { localizeStaticText } from "../../lib/locale";

const navItems = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "লেখা", path: "/blog" },
  { label: "স্মৃতি", path: "/memories" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "টাইমলাইন", path: "/timeline" },
  { label: "যোগাযোগ", path: "/contact" }
];

const footerLinks = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "লেখা", path: "/blog" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "যোগাযোগ", path: "/contact" }
];

function getMonogram(value: string) {
  const letters = Array.from(value.replace(/\s+/g, "")).slice(0, 2).join("");
  return letters || "হা";
}

export function PublicLayout() {
  const [siteTitle, setSiteTitle] = useState("হাসিবুর রহমান জার্নাল");
  const [authorName, setAuthorName] = useState("হাসিবুর রহমান");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const { session, role } = useAuth();

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

  const localizedSiteTitle = localizeStaticText(siteTitle) || siteTitle;
  const localizedAuthorName = localizeStaticText(authorName) || authorName;
  const monogram = getMonogram(localizedAuthorName);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-bengali text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden">
        <div className="absolute left-[-6%] top-28 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,184,143,0.35),transparent_68%)] blur-2xl" />
        <div className="absolute right-[-4%] top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_70%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 px-4 pt-5 md:px-8">
        <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-[34px] border border-white/70 bg-[rgba(255,252,248,0.9)] px-4 py-4 shadow-[0_18px_48px_rgba(95,61,39,0.1)] backdrop-blur-xl md:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-full bg-white/90 px-2.5 py-2 shadow-sm">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={localizedAuthorName}
                loading="lazy"
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6d6c2,#fff2e9)] text-base font-semibold text-[#9d4d28]">
                {monogram}
              </div>
            )}
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d67446]">
                ব্যক্তিগত জার্নাল
              </p>
              <p className="font-display text-lg text-brand-900 md:text-[1.15rem]">{localizedSiteTitle}</p>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${
                    isActive
                      ? "bg-[#243a61] text-white shadow-[0_12px_28px_rgba(36,58,97,0.18)]"
                      : "text-slate-600 hover:bg-white hover:text-brand-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/search"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-brand-900"
              aria-label="খুঁজুন"
            >
              <Search size={18} />
            </NavLink>

            {session ? (
              <>
                <NavLink
                  to="/account"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-[#243a61] text-white" : "bg-white text-slate-700 hover:text-brand-900"
                    }`
                  }
                >
                  আমার ঘর
                </NavLink>
                {role && isAdminRole(role) ? (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive ? "bg-[#d67446] text-white" : "bg-[#fff4ee] text-[#a44b21] hover:bg-[#ffe8db]"
                      }`
                    }
                  >
                    অ্যাডমিন
                  </NavLink>
                ) : null}
              </>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-[#d67446] text-white" : "bg-[#fff4ee] text-[#a44b21] hover:bg-[#ffe8db]"
                  }`
                }
              >
                প্রবেশ
              </NavLink>
            )}
          </div>
        </div>

        <nav className="mx-auto mt-3 flex max-w-[1240px] items-center gap-2 overflow-x-auto pb-1 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${
                  isActive
                    ? "bg-[#243a61] text-white shadow-[0_12px_28px_rgba(36,58,97,0.18)]"
                    : "bg-white/85 text-slate-600 hover:bg-white hover:text-brand-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <Outlet />
      </main>

      <footer className="relative z-10 px-4 pb-8 md:px-8">
        <div className="editorial-panel mx-auto max-w-[1240px] px-5 py-8 md:px-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {footerLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 transition hover:text-brand-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#fff4ee] px-3 py-1.5 text-[#a44b21] transition hover:bg-white"
                >
                  {item.platform}
                </a>
              ))}
            </div>

            <p className="text-sm text-slate-500">&copy; {localizedSiteTitle}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
