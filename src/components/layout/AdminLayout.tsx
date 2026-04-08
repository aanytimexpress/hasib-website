import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-ui">
      <AdminSidebar />
      <div className="w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h1 className="text-lg font-semibold text-slate-800">Hasibur Rahman CMS Dashboard</h1>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
