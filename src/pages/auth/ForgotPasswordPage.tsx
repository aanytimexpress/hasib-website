import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const mode = useMemo(() => (searchParams.get("mode") === "admin" ? "admin" : "user"), [searchParams]);
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/reset-password?mode=${mode}`;
    const result = await requestPasswordReset(email, { redirectTo });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(result.message || "পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে।");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,rgba(160,186,255,0.32),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(153,234,226,0.25),transparent_30%),linear-gradient(180deg,#f4f8ff_0%,#f8fbff_100%)] px-4 py-10 font-bengali md:px-6">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(31,74,141,0.15)] backdrop-blur-xl md:p-8">
        <h1 className="text-3xl font-bold text-slate-900">পাসওয়ার্ড পুনরুদ্ধার</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "admin"
            ? "অ্যাডমিন অ্যাকাউন্টের জন্য রিসেট লিংক আপনার ইমেইলে পাঠানো হবে।"
            : "আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার লিংক ইমেইলে পাঠানো হবে।"}
        </p>

        <form className="mt-5 space-y-3" onSubmit={(event) => void onSubmit(event)}>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
            placeholder="ইমেইল ঠিকানা"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-70"
          >
            {loading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
          </button>
        </form>

        <Link
          to={mode === "admin" ? "/admin/login" : "/auth?mode=user"}
          className="mt-4 block rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          লগইনে ফিরে যান
        </Link>

        {notice ? <p className="mt-3 text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
