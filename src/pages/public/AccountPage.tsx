import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { isAdminRole } from "../../constants/roles";
import { supabase } from "../../lib/supabase";
import { localizeRoleName, localizeStaticText, toBanglaNumber } from "../../lib/locale";

export default function AccountPage() {
  const navigate = useNavigate();
  const { session, profile, role, signOut } = useAuth();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [myCommentCount, setMyCommentCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (!profile?.id || !session?.user?.email) return;
      const [{ count: bookmarks }, { count: comments }] = await Promise.all([
        supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("author_email", session.user.email)
      ]);
      setBookmarkCount(bookmarks ?? 0);
      setMyCommentCount(comments ?? 0);
    };
    void run();
  }, [profile?.id, session?.user?.email]);

  const onSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/70 bg-white/72 p-6 shadow-[0_16px_45px_rgba(32,73,141,0.14)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">আমার ঘর</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
          স্বাগতম, {localizeStaticText(profile?.full_name || session?.user?.email || "পাঠক")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          ইমেইল: {session?.user?.email} • ভূমিকা: {localizeRoleName(role)}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 inline-flex rounded-full bg-brand-100 p-2 text-brand-700">
              <Bookmark size={16} />
            </p>
            <h3 className="text-lg font-semibold text-slate-900">সংরক্ষিত লেখা</h3>
            <p className="text-2xl font-bold text-brand-700">{toBanglaNumber(bookmarkCount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 inline-flex rounded-full bg-blue-100 p-2 text-blue-700">
              <FileText size={16} />
            </p>
            <h3 className="text-lg font-semibold text-slate-900">আমার মন্তব্য</h3>
            <p className="text-2xl font-bold text-blue-700">{toBanglaNumber(myCommentCount)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 inline-flex rounded-full bg-emerald-100 p-2 text-emerald-700">
              <ShieldCheck size={16} />
            </p>
            <h3 className="text-lg font-semibold text-slate-900">যাচাইকরণ</h3>
            <p className="text-sm text-slate-600">
              {session?.user?.email_confirmed_at ? "ইমেইল ভেরিফাই করা হয়েছে" : "ইমেইল ভেরিফিকেশন বাকি আছে"}
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/blog" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            লেখা পড়ুন
          </Link>
          {role && isAdminRole(role) ? (
            <Link to="/admin" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
              অ্যাডমিন ড্যাশবোর্ড
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <LogOut size={14} />
            বের হয়ে যান
          </button>
        </div>
      </section>
    </div>
  );
}
