import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpenText, Images, LayoutDashboard, Mail, Search, Sparkles, TimerReset, UserRound } from "lucide-react";
import { SiteSetting, SocialLink } from "../../types/models";
import { supabase } from "../../lib/supabase";

const navItems = [
  { label: "নীড়পাতা", path: "/", icon: Sparkles },
  { label: "আমার পরিচয়", path: "/about", icon: UserRound },
  { label: "লেখার ঘর", path: "/blog", icon: BookOpenText },
  { label: "প্রিয় জিনিস", path: "/favorites", icon: Sparkles },
  { label: "গ্যালারি", path: "/gallery", icon: Images },
  { label: "সময়ের রেখা", path: "/timeline", icon: TimerReset },
  { label: "যোগাযোগ", path: "/contact", icon: Mail }
];

const footerLinks = [
  { label: "নীড়পাতা", path: "/" },
  { label: "পরিচিতি", path: "/about" },
  { label: "লেখাগুলো", path: "/blog" },
  { label: "প্রিয় জিনিস", path: "/favorites" },
  { label: "যোগাযোগ", path: "/contact" }
];

export function PublicLayout() {
  const location = useLocation();
  const [siteTitle, setSiteTitle] = useState("হাসিবের খাতা");
  const [authorName, setAuthorName] = useState("হাসিবুর রহমান");
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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f2e4d8&color=27446b&size=160`;

  return (
    <div className="min-h-screen font-bengali text-slate-800">
      <header className="sticky top-0 z-40 px-3 pb-3 pt-4 md:px-6">
        <div className="mx-auto w-full max-w-7xl rounded-[34px] border border-white/70 bg-paper-grain px-4 py-4 shadow-paper backdrop-blur-2xl md:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-brand-100/80 pb-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-brand-700">
                Bengali Personal Journal
              </p>
              <Link to="/" className="font-display text-2xl text-brand-900 transition hover:text-accent-700 md:text-3xl">
                {siteTitle}
              </Link>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                শব্দ, স্মৃতি, ছবি আর অনুভূতির মোলায়েম আর্কাইভ। প্রতিটি পাতায় থাকুক বাংলা ভাষার উষ্ণতা।
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/78 px-3 py-2 shadow-sm">
              <img
                src={avatarSrc}
                alt={authorName}
                loading="lazy"
                className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-md"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-brand-900">{authorName}</p>
                <p className="text-xs text-slate-500">ব্যক্তিগত লেখালেখি, স্মৃতি আর জীবনযাপনের খোলা নথি</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="order-2 flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm md:order-1 md:w-auto md:flex-1 md:text-[15px]">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 font-medium transition duration-300 ${
                        isActive
                          ? "border-brand-700 bg-brand-700 text-white shadow-glow"
                          : "border-white/70 bg-white/78 text-slate-700 hover:-translate-y-0.5 hover:border-accent-200 hover:bg-white hover:text-brand-700"
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="order-1 ml-auto flex items-center gap-2 md:order-2">
              <NavLink
                to="/search"
                className={({ isActive }) =>
                  isActive ? "soft-button gap-2" : "ghost-button gap-2"
                }
              >
                <Search size={16} />
                খোঁজ
              </NavLink>
              <NavLink
                to="/admin/login"
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-accent-600 text-white shadow-glow"
                      : "border border-brand-200 bg-white/82 text-brand-800 hover:border-accent-300 hover:bg-white"
                  }`
                }
              >
                <LayoutDashboard size={16} />
                লগইন
              </NavLink>
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

      <footer className="mt-10 border-t border-white/50 bg-paper-grain py-10 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-6">
          <div className="space-y-3">
            <p className="section-kicker">লেখার আশ্রয়</p>
            <h2 className="font-display text-2xl text-brand-900">{siteTitle}</h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              এই সাইটে জমে থাকে ব্যক্তিগত স্মৃতি, দিনলিপি, ভালো লাগা আর জীবনের ছড়িয়ে থাকা ছোট ছোট দৃশ্য।
              প্রতিটি বিভাগ এমনভাবে সাজানো, যেন পড়তে পড়তে মনে হয় আপনি একটুখানি শান্ত কাগজের পৃথিবীতে ঢুকে গেছেন।
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl text-brand-900">দ্রুত পথ</h3>
            <div className="flex flex-wrap gap-2">
              {footerLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-full border border-white/70 bg-white/78 px-4 py-1.5 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl text-brand-900">সংযোগ</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {socials.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-slate-600 transition hover:bg-white hover:text-brand-700"
                >
                  {item.platform}
                </a>
              ))}
              {!socials.length ? (
                <span className="rounded-full border border-dashed border-brand-200 px-3 py-1.5 text-slate-500">
                  সামাজিক লিংক এখনো যোগ করা হয়নি
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">© {siteTitle}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
