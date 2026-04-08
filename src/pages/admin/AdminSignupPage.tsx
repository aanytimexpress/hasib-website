import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ADMIN_ROLES = new Set(["super_admin", "editor", "moderator"]);

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const { signUp, resendSignupVerification, session, role } = useAuth();
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
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  useEffect(() => {
    if (session && role && ADMIN_ROLES.has(role)) {
      navigate("/admin");
      return;
    }
    if (session && role === "user") {
      navigate("/");
    }
  }, [session, role, navigate]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signUp({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(result.message || "Signup completed. You can now sign in.");
    setPendingVerificationEmail(form.email.trim().toLowerCase());
  };

  const onResendVerification = async () => {
    if (!pendingVerificationEmail) {
      setError("Email not found. Please submit signup form first.");
      return;
    }

    setError("");
    setNotice("");
    setResendLoading(true);
    const result = await resendSignupVerification(pendingVerificationEmail);
    setResendLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(result.message || "Verification email sent.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-teal-50 p-4 font-bengali">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel"
      >
        <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        <p className="text-sm text-slate-600">
          Only allowlisted emails become admin. All other registrations are created as normal users.
        </p>
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 p-2"
          placeholder="Full name"
        />
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
        <input
          type="password"
          required
          value={form.confirmPassword}
          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 p-2"
          placeholder="Confirm password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
        <Link
          to="/admin/login"
          className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to login
        </Link>
        {pendingVerificationEmail ? (
          <button
            type="button"
            onClick={() => void onResendVerification()}
            disabled={resendLoading}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
          >
            {resendLoading ? "Resending..." : "Resend verification email"}
          </button>
        ) : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
