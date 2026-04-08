import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ADMIN_ALLOWLIST_EMAILS } from "../../constants/auth";
import { useAuth } from "../../hooks/useAuth";

const ADMIN_ROLES = new Set(["super_admin", "editor", "moderator"]);

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, requestPasswordReset, signOut, session, role } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Prevent login/admin redirect loop when a session exists but CMS role is missing.
    if (session && role && ADMIN_ROLES.has(role)) {
      navigate("/admin");
    }
  }, [session, role, navigate]);

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
    if (result.message) {
      setNotice(result.message);
    }
    const redirectTo = (location.state as { from?: string } | null)?.from || "/admin";
    navigate(redirectTo);
  };

  const onForgotPassword = async () => {
    if (!form.email.trim()) {
      setNotice("");
      setError("Please enter your email first.");
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
        <p className="text-sm text-slate-600">Use your Super Admin / Editor / Moderator account.</p>
        <p className="text-xs text-slate-500">Admin emails: {ADMIN_ALLOWLIST_EMAILS.join(", ")}</p>

        {session && !role ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>
              This account is authenticated, but no CMS role is assigned. Contact Super Admin, then sign
              in again.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-lg border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900"
            >
              Sign out
            </button>
          </div>
        ) : null}

        {session && role === "user" ? (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p>
              You are logged in as a normal user account. Admin dashboard access is allowed only for approved
              admin emails.
            </p>
            <Link
              to="/"
              className="block w-full rounded-lg border border-blue-300 bg-white px-4 py-2 text-center font-semibold text-blue-900"
            >
              Go to Home
            </Link>
          </div>
        ) : null}

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
          {resetLoading ? "Sending reset link..." : "Forgot password?"}
        </button>
        <Link
          to="/admin/signup"
          className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Create account (optional)
        </Link>
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
