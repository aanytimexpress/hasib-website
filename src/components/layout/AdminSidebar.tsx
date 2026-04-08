import { NavLink } from "react-router-dom";
import { LogOut, Menu as MenuIcon, Moon, Sun } from "lucide-react";
import { adminNavItems } from "../../constants/adminNav";
import { useAdminStore } from "../../store/adminStore";
import { useAuthStore } from "../../store/authStore";

export function AdminSidebar() {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useAdminStore();
  const { profile, role, signOut } = useAuthStore();
  const visibleNav = adminNavItems.filter((item) => (role ? item.roles.includes(role) : false));

  return (
    <aside
      className={`sticky top-24 h-[calc(100vh-6rem)] border-r border-slate-200 bg-white transition-all ${
        sidebarOpen ? "w-72" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button
          className="rounded-md p-2 hover:bg-slate-100"
          onClick={toggleSidebar}
          type="button"
          aria-label="toggle sidebar"
        >
          <MenuIcon size={18} />
        </button>
        {sidebarOpen ? <p className="font-semibold text-slate-700">CMS Admin</p> : null}
      </div>

      <nav className="space-y-1 p-3">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-brand-700 text-white shadow-md shadow-brand-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={17} />
              {sidebarOpen ? item.label : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {sidebarOpen ? (darkMode ? "Light mode" : "Dark mode") : null}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          <LogOut size={16} />
          {sidebarOpen ? "Sign out" : null}
        </button>
        {sidebarOpen ? (
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">{profile?.full_name ?? "Admin"}</p>
            <p>{profile?.email}</p>
            <p className="uppercase tracking-wide">{role}</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
