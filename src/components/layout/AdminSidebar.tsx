import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu as MenuIcon, Moon, Settings, Sun } from "lucide-react";
import { adminNavItems } from "../../constants/adminNav";
import { getMonogram } from "../../hooks/useSiteChrome";
import { useAdminStore } from "../../store/adminStore";
import { useAuthStore } from "../../store/authStore";

const roleLabels: Record<string, string> = {
  super_admin: "সুপার অ্যাডমিন",
  editor: "সম্পাদক",
  moderator: "মডারেটর",
  user: "পাঠক"
};

export function AdminSidebar() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useAdminStore();
  const { profile, role, signOut } = useAuthStore();
  const visibleNav = adminNavItems.filter((item) => (role ? item.roles.includes(role) : false));
  const displayName = profile?.full_name?.trim() || "অ্যাডমিন";
  const roleLabel = role ? roleLabels[role] ?? "অ্যাডমিন" : "অ্যাডমিন";
  const initials = getMonogram(displayName);

  return (
    <aside
      className={`editorial-panel flex w-full shrink-0 flex-col overflow-hidden border border-white/80 bg-[rgba(255,252,248,0.92)] transition-all duration-300 lg:sticky lg:top-28 ${
        sidebarOpen ? "lg:w-72" : "lg:w-20"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#eadfd2] px-4 py-4">
        <button
          className="rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-brand-900"
          onClick={toggleSidebar}
          type="button"
          aria-label="সাইডবার খোলা বা বন্ধ করুন"
        >
          <MenuIcon size={18} />
        </button>
        {sidebarOpen ? (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent-600">কন্ট্রোল রুম</p>
            <p className="font-display text-lg text-brand-900">Hasibur Rahman CMS</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-brand-700 text-white shadow-[0_16px_32px_rgba(36,58,97,0.18)]"
                    : "text-slate-700 hover:bg-white hover:text-brand-900"
                }`
              }
            >
              <Icon size={17} />
              {sidebarOpen ? item.label : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-[#eadfd2] bg-[#fffaf6] p-3">
        <Link
          to="/admin/settings"
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white hover:text-brand-900"
        >
          <Settings size={16} />
          {sidebarOpen ? "প্রোফাইল ও সেটিংস" : null}
        </Link>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white hover:text-brand-900"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {sidebarOpen ? (darkMode ? "উজ্জ্বল মোড" : "গাঢ় মোড") : null}
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white hover:text-brand-900"
        >
          <LogOut size={16} />
          {sidebarOpen ? "সাইন আউট" : null}
        </button>

        {sidebarOpen ? (
          <div className="rounded-[24px] bg-white px-3 py-3 text-xs text-slate-600 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6d6c2,#fff2e9)] text-sm font-semibold text-[#9d4d28]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent-700">{roleLabel}</p>
              </div>
            </div>
            <p className="truncate">{profile?.email ?? "ইমেইল পাওয়া যায়নি"}</p>
            <p className="mt-1 text-slate-500">নিচের settings থেকে এই পরিচয় বদলাতে পারবে।</p>
          </div>
        ) : (
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6d6c2,#fff2e9)] text-sm font-semibold text-[#9d4d28]">
            {initials}
          </div>
        )}
      </div>
    </aside>
  );
}
