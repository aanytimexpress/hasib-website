import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { isAllowlistedAdminEmail } from "../constants/auth";
import { RoleName, UserProfile } from "../types/models";

interface AuthRedirectOptions {
  redirectTo?: string;
}

interface AuthState {
  loading: boolean;
  initialized: boolean;
  session: Session | null;
  profile: UserProfile | null;
  role: RoleName | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signUp: (
    payload: { email: string; password: string; fullName: string },
    options?: AuthRedirectOptions
  ) => Promise<{ error?: string; message?: string }>;
  resendSignupVerification: (
    email: string,
    options?: AuthRedirectOptions
  ) => Promise<{ error?: string; message?: string }>;
  requestPasswordReset: (
    email: string,
    options?: AuthRedirectOptions
  ) => Promise<{ error?: string; message?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  repairProfile: () => Promise<{ error?: string; message?: string }>;
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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

async function ensureCurrentUserProfile(session: Session): Promise<{ error?: string }> {
  const email = session.user.email?.trim().toLowerCase();
  if (!email) {
    return { error: "Authenticated user email is missing." };
  }

  const { error: rpcError } = await supabase.rpc("ensure_current_user_profile");
  if (!rpcError) {
    return {};
  }

  const expectedRole = isAllowlistedAdminEmail(email) ? "super_admin" : "user";
  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", expectedRole)
    .maybeSingle();

  if (roleError || !roleData?.id) {
    return { error: rpcError.message || roleError?.message || "Failed to resolve role." };
  }

  const fullName =
    (session.user.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "User";
  const { error: upsertError } = await supabase.from("users").upsert(
    {
      auth_user_id: session.user.id,
      email,
      full_name: fullName,
      role_id: roleData.id
    },
    { onConflict: "auth_user_id" }
  );

  if (upsertError) {
    return { error: rpcError.message || upsertError.message };
  }

  return {};
}

async function loadProfileForSession(
  session: Session
): Promise<{ profile: UserProfile | null; role: RoleName | null; repairError?: string }> {
  let result = await fetchProfile(session.user.id);
  if (result.profile || result.role) {
    return result;
  }

  const repair = await ensureCurrentUserProfile(session);
  if (repair.error) {
    return { ...result, repairError: repair.error };
  }

  result = await fetchProfile(session.user.id);
  return result;
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
      const { profile, role } = await loadProfileForSession(session);
      set({ session, profile, role, loading: false, initialized: true });
    } else {
      set({ session: null, profile: null, role: null, loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const { profile, role } = await loadProfileForSession(newSession);
        set({ session: newSession, profile, role, loading: false, initialized: true });
      } else {
        set({ session: null, profile: null, role: null, loading: false, initialized: true });
      }
    });
  },
  signIn: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (!signInResult.error) {
        await get().refreshProfile();
        return {};
      }

      const errorMessage = signInResult.error.message || "Login failed.";
      return { error: errorMessage };
    } catch (error) {
      return { error: toErrorMessage(error, "Login failed. Please try again.") };
    }
  },
  signUp: async ({ email, password, fullName }, options) => {
    const defaultRedirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/verify-email` : undefined;
    const redirectTo = options?.redirectTo || defaultRedirect;
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
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
  resendSignupVerification: async (email, options) => {
    const defaultRedirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/verify-email` : undefined;
    const redirectTo = options?.redirectTo || defaultRedirect;
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
  requestPasswordReset: async (email, options) => {
    const defaultRedirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
    const redirectTo = options?.redirectTo || defaultRedirect;
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      redirectTo ? { redirectTo } : undefined
    );
    if (error) {
      return { error: error.message };
    }
    return { message: "Password reset link sent. Check your email inbox." };
  },
  updatePassword: async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { error: error.message };
      }
      await get().refreshProfile();
      return {};
    } catch (error) {
      return { error: toErrorMessage(error, "Password update failed. Please try again.") };
    }
  },
  repairProfile: async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return { error: "No active session found. Please sign in again." };
      }

      const repair = await ensureCurrentUserProfile(session);
      await get().refreshProfile();
      const currentRole = get().role;
      if (currentRole) {
        return { message: `Role synced successfully: ${currentRole}.` };
      }
      if (repair.error) {
        return { error: repair.error };
      }
      return { error: "Profile is still missing. Run SQL patch once, then sign in again." };
    } catch (error) {
      return { error: toErrorMessage(error, "Could not sync profile right now.") };
    }
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
      const { profile, role } = await loadProfileForSession(session);
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
