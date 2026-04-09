import { Search } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { isAdminRole } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { siteNavItems, useSiteChrome } from "../../hooks/useSiteChrome";

export function SiteHeader() {
  const { siteTitle, authorName, authorAvatar, monogram } = useSiteChrome();
  const { session, role } = useAuth();

  return (
    <header className="sticky top-0 z-40 px-4 pt-5 md:px-8">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 rounded-[34px] border border-white/70 bg-[rgba(255,252,248,0.9)] px-4 py-4 shadow-[0_18px_48px_rgba(95,61,39,0.1)] backdrop-blur-xl md:px-6">
        <Link to="/" className="flex items-center gap-3 rounded-full bg-white/90 px-2.5 py-2 shadow-sm">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
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
            <p className="font-display text-lg text-brand-900 md:text-[1.15rem]">{siteTitle}</p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {siteNavItems.map((item) => (
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
        {siteNavItems.map((item) => (
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
  );
}
