import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, requestPasswordReset, session } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/admin");
    }
  }, [session, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    const result = await signIn(form.email, form.password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const redirectTo = (location.state as { from?: string } | null)?.from || "/admin";
    navigate(redirectTo);
  };

  const onForgotPassword = async () => {
    if (!form.email.trim()) {
      setNotice("");
      setError("পাসওয়ার্ড রিসেট করতে আগে আপনার Email দিন।");
      return;
    }

    setError("");
    setNotice("");
    setResetLoading(true);
    const result = await requestPasswordReset(form.email.trim());
    setResetLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(result.message || "Password reset link sent.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-teal-50 p-4 font-bengali">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel"
      >
        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-600">Super Admin / Editor / Moderator credentials ব্যবহার করুন।</p>
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 p-2"
          placeholder="Email"
        />
        <input
          type="password"
          required
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 p-2"
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => void onForgotPassword()}
          disabled={resetLoading}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
        >
          {resetLoading ? "Sending reset link..." : "পাসওয়ার্ড ভুলে গেছেন?"}
        </button>
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
