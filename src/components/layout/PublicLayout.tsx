import { Outlet } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-bengali text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden">
        <div className="absolute left-[-6%] top-28 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,184,143,0.35),transparent_68%)] blur-2xl" />
        <div className="absolute right-[-4%] top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_70%)] blur-3xl" />
      </div>

      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
