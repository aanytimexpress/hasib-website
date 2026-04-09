import { ArrowUpRight, Settings, UserRound } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { RoleName } from "../../types/models";
import { useAuthStore } from "../../store/authStore";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { AdminSidebar } from "./AdminSidebar";

const roleLabels: Record<RoleName, string> = {
  super_admin: "সুপার অ্যাডমিন",
  editor: "সম্পাদক",
  moderator: "মডারেটর",
  user: "পাঠক"
};

export function AdminLayout() {
  const { profile, role } = useAuthStore();
  const roleLabel = role ? roleLabels[role] : "অ্যাডমিন";
  const languageText = profile?.language?.length ? profile.language.join(", ") : "বাংলা, ইংরেজি";

  return (
    <div className="relative min-h-screen overflow-x-hidden font-bengali text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] overflow-hidden">
        <div className="absolute left-[-6%] top-28 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,184,143,0.35),transparent_68%)] blur-2xl" />
        <div className="absolute right-[-4%] top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55),transparent_70%)] blur-3xl" />
      </div>

      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <section className="page-hero">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)] xl:items-end">
            <div>
              <span className="section-kicker">অ্যাডমিন কন্ট্রোল রুম</span>
              <h1 className="mt-4 font-display text-3xl leading-tight text-brand-900 md:text-5xl">
                তোমার জার্নালের সব নিয়ন্ত্রণ এখন এক জায়গায়
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                পোস্ট, পেজ, গ্যালারি, টাইমলাইন, SEO এবং প্রোফাইলের তথ্য এখান থেকেই গুছিয়ে হালনাগাদ করতে পারবে।
                এখন admin area-ও public site-এর মতো header এবং footer সহ দেখাবে, যাতে পুরো experience-টা একসাথে সংযুক্ত লাগে।
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin/settings" className="soft-button">
                  প্রোফাইল ও সেটিংস
                </Link>
                <Link to="/" target="_blank" rel="noreferrer" className="ghost-button">
                  সাইট দেখো
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3 text-brand-800">
                  <UserRound size={18} />
                  <p className="text-sm font-semibold">চলতি অ্যাডমিন পরিচয়</p>
                </div>
                <p className="text-xl font-semibold text-brand-900">{profile?.full_name ?? "অ্যাডমিন ব্যবহারকারী"}</p>
                <p className="mt-1 text-sm text-slate-600">{profile?.email ?? "ইমেইল সংযুক্ত নেই"}</p>
                <p className="mt-3 text-sm text-slate-500">ভূমিকা: {roleLabel}</p>
                <p className="text-sm text-slate-500">ভাষা: {languageText}</p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(36,58,97,0.96),rgba(52,88,135,0.92))] p-5 text-white shadow-sm">
                <div className="mb-3 flex items-center gap-3 text-white/90">
                  <Settings size={18} />
                  <p className="text-sm font-semibold">ঝটপট আপডেট</p>
                </div>
                <p className="text-lg font-semibold leading-8">নাম, ছবি, bio এবং ভাষার তথ্য settings থেকে বদলালে sidebar-এ সাথে সাথে দেখা যাবে।</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          <AdminSidebar />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
