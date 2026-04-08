import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { isAllowlistedAdminEmail } from "../constants/auth";
import { RoleName, UserProfile } from "../types/models";

interface AuthState {
  loading: boolean;
  initialized: boolean;
  session: Session | null;
  profile: UserProfile | null;
  role: RoleName | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signUp: (
    payload: { email: string; password: string; fullName: string }
  ) => Promise<{ error?: string; message?: string }>;
  resendSignupVerification: (email: string) => Promise<{ error?: string; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function fetchProfile(authUserId: string): Promise<{ profile: UserProfile | null; role: RoleName | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("*, role:roles(*)")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) {
    return { profile: null, role: null };
  }

  return {
    profile: data as UserProfile,
    role: data.role?.name ?? null
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  loading: true,
  initialized: false,
  session: null,
  profile: null,
  role: null,
  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { profile, role } = await fetchProfile(session.user.id);
      set({ session, profile, role, loading: false, initialized: true });
    } else {
      set({ session: null, profile: null, role: null, loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const { profile, role } = await fetchProfile(newSession.user.id);
        set({ session: newSession, profile, role, loading: false, initialized: true });
      } else {
        set({ session: null, profile: null, role: null, loading: false, initialized: true });
      }
    });
  },
  signIn: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (!signInResult.error) {
      await get().refreshProfile();
      return {};
    }

    const errorMessage = signInResult.error.message || "Login failed.";
    const isInvalidCredentials =
      errorMessage.toLowerCase().includes("invalid login credentials") ||
      errorMessage.toLowerCase().includes("invalid credentials");

    // For allowlisted admin emails, auto-provision first login to keep setup simple.
    if (isAllowlistedAdminEmail(normalizedEmail) && isInvalidCredentials) {
      const fullName = normalizedEmail.split("@")[0] || "Admin User";
      const signUpResult = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/admin/login` : undefined
        }
      });

      if (signUpResult.error) {
        return { error: signUpResult.error.message };
      }

      const retrySignIn = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (retrySignIn.error) {
        return { error: retrySignIn.error.message };
      }

      await get().refreshProfile();
      return { message: "Admin account created and signed in." };
    }

    return { error: errorMessage };
  },
  signUp: async ({ email, password, fullName }) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/admin/login` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      return { error: error.message };
    }

    if (data.session) {
      await get().refreshProfile();
      return { message: "Account created successfully. You are now signed in." };
    }

    return { message: "Account created. Check your email to verify, then sign in." };
  },
  resendSignupVerification: async (email) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/admin/login` : undefined;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
    });

    if (error) {
      return { error: error.message };
    }

    return { message: "Verification email sent again. Check inbox/spam." };
  },
  requestPasswordReset: async (email) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/admin/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    );
    if (error) {
      return { error: error.message };
    }
    return { message: "Password reset link sent. Check your email inbox." };
  },
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: error.message };
    }
    await get().refreshProfile();
    return {};
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, role: null });
  },
  refreshProfile: async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { profile, role } = await fetchProfile(session.user.id);
      set({ session, profile, role });
    } else {
      set({ session: null, profile: null, role: null });
    }
  }
}));

export function hasAnyRole(role: RoleName | null, allowed: RoleName[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
