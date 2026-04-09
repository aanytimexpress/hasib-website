import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "রিসেট লিংক যাচাই করা যায়নি। নতুন লিংক নিয়ে আবার চেষ্টা করুন।";
}

export default function AuthResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const mode = useMemo(() => (searchParams.get("mode") === "admin" ? "admin" : "user"), [searchParams]);
  const navigate = useNavigate();
  const { loading, session, signOut, updatePassword, refreshProfile } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(true);
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const bootstrapRecoverySession = async () => {
      setRecoveryLoading(true);
      setRecoveryError("");

      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = query.get("code");
        const tokenHash = query.get("token_hash") || hash.get("token_hash");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const type = hash.get("type") || query.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash
          });
          if (verifyError) throw verifyError;
        } else if (accessToken && refreshToken && type === "recovery") {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error("রিসেট লিংকটি অনুপস্থিত বা মেয়াদোত্তীর্ণ হয়েছে।");
        }

        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname + `?mode=${mode}`);
        }

        await refreshProfile();
      } catch (recoverError) {
        if (!cancelled) {
          setRecoveryError(getErrorMessage(recoverError));
        }
      } finally {
        if (!cancelled) {
          setRecoveryLoading(false);
        }
      }
    };

    void bootstrapRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile, mode]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (form.password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("দুইটি পাসওয়ার্ড মিলছে না।");
      return;
    }

    setSaving(true);
    try {
      const result = await updatePassword(form.password);
      if (result.error) {
        setError(result.error);
        return;
      }

      await signOut();
      setNotice("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। আবার লগইন করুন।");
      window.setTimeout(() => {
        navigate(`/auth?mode=${mode}`);
      }, 1200);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  if (loading || recoveryLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bengali text-slate-700">
        পাসওয়ার্ড পুনরুদ্ধার প্রস্তুত করা হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,rgba(160,186,255,0.32),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(153,234,226,0.25),transparent_30%),linear-gradient(180deg,#f4f8ff_0%,#f8fbff_100%)] px-4 py-10 font-bengali md:px-6">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_60px_rgba(31,74,141,0.15)] backdrop-blur-xl md:p-8">
        <h1 className="text-3xl font-bold text-slate-900">নতুন পাসওয়ার্ড দিন</h1>

        {!session ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              {recoveryError || "রিসেট লিংকটি পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে। নতুন লিংক নিয়ে আবার চেষ্টা করুন।"}
            </p>
            <Link
              to={`/auth/forgot-password?mode=${mode}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              নতুন রিসেট লিংক নিন
            </Link>
          </>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">আপনার নতুন পাসওয়ার্ড সেট করুন।</p>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
              placeholder="নতুন পাসওয়ার্ড"
            />
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-brand-500"
              placeholder="পাসওয়ার্ড আবার লিখুন"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-70"
            >
              {saving ? "সংরক্ষণ করা হচ্ছে..." : "পাসওয়ার্ড হালনাগাদ করুন"}
            </button>
            {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
