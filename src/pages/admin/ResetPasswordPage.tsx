import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { loading, session, signOut, updatePassword } = useAuth();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (form.password.length < 6) {
      setError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("দুইটি পাসওয়ার্ড মিলছে না।");
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
    setNotice("পাসওয়ার্ড সফলভাবে আপডেট হয়েছে। আবার লগইন করুন।");
    window.setTimeout(() => {
      navigate("/admin/login");
    }, 1200);
  };

  if (loading) {
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
              রিসেট লিংক পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে। আবার reset link নিতে Login page-এ যান।
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
            <p className="text-sm text-slate-600">নতুন পাসওয়ার্ড সেট করুন।</p>
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
