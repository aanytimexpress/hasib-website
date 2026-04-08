import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";

const navItems = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "ব্লগ", path: "/blog" },
  { label: "স্মৃতি", path: "/blog" },
  { label: "গ্যালারি", path: "/gallery" },
  { label: "টাইমলাইন", path: "/timeline" },
  { label: "যোগাযোগ", path: "/contact" }
];

const footerLinks = [
  { label: "হোম", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "ব্লগ", path: "/blog" },
  { label: "যোগাযোগ", path: "/contact" }
];

export function PublicLayout() {
  const location = useLocation();
  const [siteTitle, setSiteTitle] = useState("Hasibur Rahman");
  const [authorName, setAuthorName] = useState("Hasibur Rahman");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const isAdminRoute = location.pathname.startsWith("/admin");

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

  const avatarSrc =
    authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=e5edff&color=1f4a8a&size=160`;

  return (
    <div className="min-h-screen font-bengali text-slate-800">
      <header className="sticky top-0 z-40 px-3 pb-2 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-7xl rounded-[28px] border border-white/60 bg-white/55 px-3 py-3 shadow-[0_18px_50px_rgba(33,80,152,0.16)] backdrop-blur-2xl md:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="rounded-full bg-white/85 px-5 py-2 text-lg font-bold text-brand-800 shadow-sm md:text-xl"
            >
              {siteTitle}
            </Link>

            <nav className="order-3 mt-2 flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm md:order-2 md:mt-0 md:w-auto md:flex-1 md:justify-center md:text-[15px]">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-4 py-2 font-medium transition duration-300 ${
                      isActive
                        ? "bg-brand-700 text-white shadow-lg shadow-brand-200"
                        : "bg-white/75 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:text-brand-700"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-brand-700 text-white" : "bg-white/80 text-slate-700 hover:bg-white"
                  }`
                }
              >
                খোঁজ
              </NavLink>
              <NavLink
                to="/admin/login"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-slate-900 text-white" : "bg-white/80 text-slate-700 hover:bg-white"
                  }`
                }
              >
                লগইন
              </NavLink>
              <img
                src={avatarSrc}
                alt={authorName}
                loading="lazy"
                className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </header>

      <main
        className={
          isAdminRoute
            ? "mx-auto w-full px-0 pb-10 pt-4"
            : "mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:px-6 md:pt-6"
        }
      >
        <Outlet />
      </main>

      <footer className="mt-10 border-t border-white/50 bg-white/35 py-10 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 text-center md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {footerLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-full bg-white/70 px-4 py-1.5 text-sm text-slate-700 transition hover:bg-white hover:text-brand-700"
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
                className="rounded-full bg-white/60 px-3 py-1 text-slate-600 transition hover:bg-white hover:text-brand-700"
              >
                {item.platform}
              </a>
            ))}
          </div>

          <p className="text-sm text-slate-500">© {siteTitle}</p>
        </div>
      </footer>
    </div>
  );
}
