import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, UserRound, MailCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { isAllowlistedAdminEmail } from "../../constants/auth";
import { isAdminRole } from "../../constants/roles";
import { useAuthStore } from "../../store/authStore";

function getFriendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "ইমেইল ভেরিফাই করা হয়নি। আগে ইমেইল ভেরিফাই করুন।";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
  }
  if (lower.includes("too many requests")) {
    return "অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।";
  }
  return message;
}

export default function AuthPortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { session, role, signIn, signOut, refreshProfile, loading } = useAuth();

  const [userForm, setUserForm] = useState({ email: "", password: "" });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [userError, setUserError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [userNotice, setUserNotice] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const isAdminPath = location.pathname.startsWith("/admin");
  const mode = useMemo(() => {
    if (isAdminPath) return "admin";
    return searchParams.get("mode") === "admin" ? "admin" : "user";
  }, [isAdminPath, searchParams]);

  useEffect(() => {
    if (!session || !role) return;
    if (isAdminRole(role)) {
      navigate("/admin");
      return;
    }
    navigate("/account");
  }, [session, role, navigate]);

  const onUserLogin = async (event: FormEvent) => {
    event.preventDefault();
    setUserError("");
    setUserNotice("");
    setUserLoading(true);

    const result = await signIn(userForm.email, userForm.password);
    setUserLoading(false);

    if (result.error) {
      setUserError(getFriendlyError(result.error));
      return;
    }

    await refreshProfile();
    const latestRole = useAuthStore.getState().role;
    if (latestRole && isAdminRole(latestRole)) {
      navigate("/admin");
      return;
    }
    setUserNotice("প্রবেশ সফল হয়েছে।");
    const redirectTo = (location.state as { from?: string } | null)?.from || "/account";
    navigate(redirectTo);
  };

  const onAdminLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAdminError("");
    setAdminNotice("");
    setAdminLoading(true);

    const result = await signIn(adminForm.email, adminForm.password);
    setAdminLoading(false);

    if (result.error) {
      setAdminError(getFriendlyError(result.error));
      return;
    }

    await refreshProfile();
    const latestRole = useAuthStore.getState().role;
    if (!latestRole || !isAdminRole(latestRole)) {
      await signOut();
      setAdminError("এই অ্যাকাউন্টে অ্যাডমিন ড্যাশবোর্ডে প্রবেশাধিকার নেই।");
      return;
    }

    setAdminNotice(result.message || "অ্যাডমিন প্রবেশ সফল হয়েছে।");
    const redirectTo = (location.state as { from?: string } | null)?.from || "/admin";
    navigate(redirectTo);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bengali text-slate-700">
        লগইন ব্যবস্থা প্রস্তুত করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_12%,rgba(164,191,255,0.35),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(167,243,237,0.28),transparent_34%),linear-gradient(180deg,#f3f8ff_0%,#f5f8ff_100%)] px-4 py-8 font-bengali md:px-6">
      <div className="mx-auto w-full max-w-6xl rounded-[32px] border border-white/70 bg-white/60 p-5 shadow-[0_25px_70px_rgba(27,78,152,0.16)] backdrop-blur-2xl md:p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Hasibur Rahman Journal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">দুই ধরনের প্রবেশপথ</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            পাঠক ও অ্যাডমিন - দুই ধরনের লগইন একই জায়গা থেকে নিরাপদভাবে পরিচালনা করুন।
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`rounded-3xl border bg-white/75 p-5 shadow-sm ${mode === "user" ? "border-brand-300" : "border-slate-200"}`}>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-brand-100 p-2 text-brand-700">
                <UserRound size={18} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">পাঠক লগইন</h2>
            </div>

            <form className="space-y-3" onSubmit={(event) => void onUserLogin(event)}>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
                placeholder="ইমেইল ঠিকানা"
              />
              <input
                type="password"
                required
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
                placeholder="পাসওয়ার্ড"
              />
              <button
                type="submit"
                disabled={userLoading}
                className="w-full rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-70"
              >
                {userLoading ? "প্রবেশ করা হচ্ছে..." : "পাঠক হিসেবে প্রবেশ করুন"}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link to="/auth/signup?mode=user" className="rounded-full bg-white px-3 py-1.5 text-brand-700 hover:bg-brand-50">
                নতুন অ্যাকাউন্ট খুলুন
              </Link>
              <Link to="/auth/forgot-password?mode=user" className="rounded-full bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-100">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            {userNotice ? <p className="mt-3 text-sm text-emerald-600">{userNotice}</p> : null}
            {userError ? <p className="mt-3 text-sm text-red-600">{userError}</p> : null}
          </section>

          <section className={`rounded-3xl border bg-white/80 p-5 shadow-sm ${mode === "admin" ? "border-brand-300" : "border-slate-200"}`}>
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-700">
                <Shield size={18} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">অ্যাডমিন লগইন</h2>
            </div>

            <form className="space-y-3" onSubmit={(event) => void onAdminLogin(event)}>
              <input
                type="email"
                required
                value={adminForm.email}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
                placeholder="অ্যাডমিন ইমেইল"
              />
              <input
                type="password"
                required
                value={adminForm.password}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
                placeholder="পাসওয়ার্ড"
              />
              <button
                type="submit"
                disabled={adminLoading}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-black disabled:opacity-70"
              >
                {adminLoading ? "অ্যাক্সেস যাচাই করা হচ্ছে..." : "অ্যাডমিন হিসেবে প্রবেশ করুন"}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link to="/auth/signup?mode=admin" className="rounded-full bg-white px-3 py-1.5 text-brand-700 hover:bg-brand-50">
                অ্যাডমিন অ্যাকাউন্ট খুলুন
              </Link>
              <Link to="/auth/forgot-password?mode=admin" className="rounded-full bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-100">
                পাসওয়ার্ড রিসেট করুন
              </Link>
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="inline-flex items-center gap-1 font-semibold">
                <MailCheck size={14} />
                অ্যাডমিন নোট
              </p>
              <p className="mt-1">
                শুধুমাত্র অনুমোদিত ইমেইল থেকেই অ্যাডমিন ভূমিকা পাওয়া যাবে। {isAllowlistedAdminEmail(adminForm.email) ? "আপনার দেওয়া ইমেইলটি অনুমোদিত তালিকায় আছে।" : "অনুমোদিত ইমেইল ব্যবহার করুন।"}
              </p>
            </div>

            {adminNotice ? <p className="mt-3 text-sm text-emerald-600">{adminNotice}</p> : null}
            {adminError ? <p className="mt-3 text-sm text-red-600">{adminError}</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
