import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isAllowlistedAdminEmail } from "../../constants/auth";

export default function AuthSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = useMemo(() => (searchParams.get("mode") === "admin" ? "admin" : "user"), [searchParams]);
  const { signUp, resendSignupVerification } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const isAdminMode = mode === "admin";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.fullName.trim()) {
      setError("পূর্ণ নাম দিন।");
      return;
    }
    if (form.password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("পাসওয়ার্ড মিলছে না।");
      return;
    }

    if (isAdminMode && !isAllowlistedAdminEmail(form.email)) {
      setError("এই ইমেইল allowlisted নয়। Admin হিসেবে signup সম্ভব নয়।");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/verify-email?mode=${mode}`;
    const result = await signUp(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      },
      { redirectTo }
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const email = form.email.trim().toLowerCase();
    setPendingEmail(email);
    setNotice(result.message || "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল ভেরিফাই করুন।");

    if (!result.message?.toLowerCase().includes("signed in")) {
      navigate(`/auth/verify-email?email=${encodeURIComponent(email)}&mode=${mode}`);
    } else {
      navigate(isAdminMode ? "/admin" : "/account");
    }
  };

  const onResend = async () => {
    if (!pendingEmail) {
      setError("আগে signup করুন, তারপর resend দিন।");
      return;
    }
    setError("");
    setNotice("");
    setResendLoading(true);
    const redirectTo = `${window.location.origin}/auth/verify-email?mode=${mode}`;
    const result = await resendSignupVerification(pendingEmail, { redirectTo });
    setResendLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(result.message || "ভেরিফিকেশন ইমেইল আবার পাঠানো হয়েছে।");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,rgba(160,186,255,0.32),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(153,234,226,0.25),transparent_30%),linear-gradient(180deg,#f4f8ff_0%,#f8fbff_100%)] px-4 py-10 font-bengali md:px-6">
      <div className="mx-auto w-full max-w-lg rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(31,74,141,0.15)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          {isAdminMode ? "Admin Registration" : "User Registration"}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {isAdminMode ? "Admin Signup" : "Create New User Account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isAdminMode
            ? "Only allowlisted email gets admin role."
            : "নতুন account তৈরি করুন, ইমেইল ভেরিফাই করে login করুন।"}
        </p>

        <form className="mt-5 space-y-3" onSubmit={(event) => void onSubmit(event)}>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
            placeholder="Full name"
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
            placeholder="Email"
          />
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
            placeholder="Password"
          />
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
            placeholder="Confirm password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-70"
          >
            {loading ? "Creating..." : isAdminMode ? "Create Admin Account" : "Create User Account"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link to={isAdminMode ? "/admin/login" : "/auth?mode=user"} className="rounded-full bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100">
            Back to login
          </Link>
          {pendingEmail ? (
            <button
              type="button"
              onClick={() => void onResend()}
              disabled={resendLoading}
              className="rounded-full bg-white px-3 py-1.5 text-brand-700 hover:bg-brand-50 disabled:opacity-70"
            >
              {resendLoading ? "Resending..." : "Resend verification email"}
            </button>
          ) : null}
        </div>

        {notice ? <p className="mt-3 text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
