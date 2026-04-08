import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { RoleName, UserProfile } from "../types/models";

interface AuthState {
  loading: boolean;
  initialized: boolean;
  session: Session | null;
  profile: UserProfile | null;
  role: RoleName | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    await get().refreshProfile();
    return {};
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
