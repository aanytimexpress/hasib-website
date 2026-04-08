import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { MenuItem, SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";

interface LayoutMenus {
  header: MenuItem[];
  footer: MenuItem[];
}

const fallbackHeader = [
  { id: "1", label: "হোম", path: "/" },
  { id: "2", label: "পরিচিতি", path: "/about" },
  { id: "3", label: "ব্লগ", path: "/blog" },
  { id: "4", label: "পছন্দ", path: "/favorites" },
  { id: "5", label: "গ্যালারি", path: "/gallery" },
  { id: "6", label: "টাইমলাইন", path: "/timeline" },
  { id: "7", label: "যোগাযোগ", path: "/contact" }
];

export function PublicLayout() {
  const [menus, setMenus] = useState<LayoutMenus>({ header: [], footer: [] });
  const [siteTitle, setSiteTitle] = useState("Hasibur Rahman");
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: menusData } = await supabase.from("menus").select("*");
      const headerMenu = menusData?.find((item) => item.location === "header");
      const footerMenu = menusData?.find((item) => item.location === "footer");

      const menuIds = [headerMenu?.id, footerMenu?.id].filter(Boolean) as string[];
      const { data: menuItemsData } = menuIds.length
        ? await supabase.from("menu_items").select("*").in("menu_id", menuIds).order("sort_order")
        : { data: [] };

      setMenus({
        header: (menuItemsData ?? []).filter((item) => item.menu_id === headerMenu?.id),
        footer: (menuItemsData ?? []).filter((item) => item.menu_id === footerMenu?.id)
      });

      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["site_title"]);
      const titleSetting = (settingsData as SiteSetting[] | null)?.find((item) => item.key === "site_title");
      if (titleSetting?.value) {
        setSiteTitle(titleSetting.value);
      }

      const { data: socialData } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true });
      setSocials((socialData as SocialLink[]) ?? []);
    };

    void load();
  }, []);

  const navItems = menus.header.length ? menus.header : fallbackHeader;

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-hero-grid font-bengali text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <Link to="/" className="text-lg font-bold text-brand-800 md:text-xl">
            {siteTitle}
          </Link>
          <nav className="order-3 mt-2 flex w-full items-center gap-3 overflow-x-auto text-sm md:order-2 md:mt-0 md:w-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                    isActive ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <form onSubmit={onSearchSubmit} className="order-2 ml-auto flex gap-2 md:order-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="খুঁজুন..."
              className="w-40 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-brand-500 md:w-56"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Search
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white/85">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:px-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-700">
            {(menus.footer.length ? menus.footer : fallbackHeader).map((item) => (
              <Link key={item.id} to={item.path} className="hover:text-brand-700">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {socials.map((item) => (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="hover:text-brand-700">
                {item.platform}
              </a>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {new Date().getFullYear()} {siteTitle}. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}
