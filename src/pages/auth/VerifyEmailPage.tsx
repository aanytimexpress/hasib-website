import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { isAdminRole } from "../../constants/roles";
import { supabase } from "../../lib/supabase";

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "ইমেইল যাচাইকরণ সম্পন্ন করা যায়নি।";
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, role, resendSignupVerification } = useAuth();

  const mode = useMemo(() => (searchParams.get("mode") === "admin" ? "admin" : "user"), [searchParams]);
  const emailFromQuery = (searchParams.get("email") || "").trim().toLowerCase();

  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [message, setMessage] = useState("ইনবক্স খুলে ভেরিফিকেশন লিংকে ক্লিক করুন।");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runVerification = async () => {
      setStatus("verifying");
      setMessage("ভেরিফিকেশন লিংক যাচাই করা হচ্ছে...");

      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = query.get("code");
        const tokenHash = query.get("token_hash") || hash.get("token_hash");
        const type = query.get("type") || hash.get("type") || "signup";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: type as "signup" | "email_change",
            token_hash: tokenHash
          });
          if (error) throw error;
        } else {
          setStatus("idle");
          setMessage("ইমেইল লিংকটি এখনো খোলা হয়নি। ইনবক্স থেকে লিংকে ক্লিক করুন।");
          return;
        }

        if (!cancelled) {
          setStatus("verified");
          setMessage("ইমেইল সফলভাবে ভেরিফাই হয়েছে। এখন আপনি এগিয়ে যেতে পারেন।");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(normalizeError(error));
        }
      }
    };

    void runVerification();
    return () => {
      cancelled = true;
    };
  }, []);

  const onResend = async () => {
    const email = emailFromQuery || session?.user?.email || "";
    if (!email) {
      setStatus("error");
      setMessage("ইমেইল ঠিকানা পাওয়া যায়নি। আবার সাইনআপ করে চেষ্টা করুন।");
      return;
    }
    setResendLoading(true);
    const redirectTo = `${window.location.origin}/auth/verify-email?mode=${mode}&email=${encodeURIComponent(email)}`;
    const result = await resendSignupVerification(email, { redirectTo });
    setResendLoading(false);

    if (result.error) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    setStatus("idle");
    setMessage(result.message || "ভেরিফিকেশন ইমেইল আবার পাঠানো হয়েছে।");
  };

  const continueTarget = session && role ? (isAdminRole(role) ? "/admin" : "/account") : `/auth?mode=${mode}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_12%,rgba(160,186,255,0.32),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(153,234,226,0.25),transparent_30%),linear-gradient(180deg,#f4f8ff_0%,#f8fbff_100%)] px-4 py-10 font-bengali md:px-6">
      <div className="mx-auto w-full max-w-lg rounded-[28px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_20px_60px_rgba(31,74,141,0.15)] backdrop-blur-xl md:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          {status === "verified" ? <CheckCircle2 size={26} /> : <Mail size={24} />}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">ইমেইল যাচাইকরণ</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void onResend()}
            disabled={resendLoading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            <RefreshCw size={15} />
            {resendLoading ? "পাঠানো হচ্ছে..." : "ইমেইল আবার পাঠান"}
          </button>
          <Link
            to={continueTarget}
            className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            এগিয়ে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
