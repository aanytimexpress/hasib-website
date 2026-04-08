import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unable to validate reset link. Request a new link and try again.";
}

export default function ResetPasswordPage() {
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
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const type = hash.get("type") || query.get("type");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else if (accessToken && refreshToken && type === "recovery") {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) {
            throw sessionError;
          }
        }

        // Clean temporary auth params from URL after capture.
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname);
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
  }, [refreshProfile]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const result = await updatePassword(form.password);
    if (result.error) {
      setSaving(false);
      setError(result.error);
      return;
    }

    await signOut();
    setSaving(false);
    setNotice("Password updated successfully. Please sign in again.");
    window.setTimeout(() => {
      navigate("/admin/login");
    }, 1200);
  };

  if (loading || recoveryLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bengali text-slate-700">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-teal-50 p-4 font-bengali">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>

        {!session ? (
          <>
            <p className="text-sm text-slate-600">
              {recoveryError || "Reset link was not found or has expired. Request a new link from login page."}
            </p>
            <Link
              to="/admin/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Login
            </Link>
          </>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
            <p className="text-sm text-slate-600">Set your new password.</p>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2"
              placeholder="New password"
            />
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
              placeholder="Confirm new password"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white disabled:opacity-70"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
            {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
