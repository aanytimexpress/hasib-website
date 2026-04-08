import { create } from "zustand";
import { Post } from "../types/models";

interface AdminState {
  sidebarOpen: boolean;
  darkMode: boolean;
  autosaveDrafts: Record<string, Partial<Post>>;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleDarkMode: () => void;
  setDraft: (id: string, draft: Partial<Post>) => void;
  removeDraft: (id: string) => void;
}

const initialDarkMode = localStorage.getItem("site_dark_mode") === "true";
const initialDrafts = (() => {
  try {
    const raw = localStorage.getItem("autosave_drafts");
    return raw ? (JSON.parse(raw) as Record<string, Partial<Post>>) : {};
  } catch {
    return {};
  }
})();

if (initialDarkMode) {
  document.documentElement.classList.add("dark");
}

export const useAdminStore = create<AdminState>((set) => ({
  sidebarOpen: true,
  darkMode: initialDarkMode,
  autosaveDrafts: initialDrafts,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem("site_dark_mode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
  setDraft: (id, draft) =>
    set((state) => {
      const autosaveDrafts = {
        ...state.autosaveDrafts,
        [id]: {
          ...(state.autosaveDrafts[id] ?? {}),
          ...draft
        }
      };
      localStorage.setItem("autosave_drafts", JSON.stringify(autosaveDrafts));
      return { autosaveDrafts };
    }),
  removeDraft: (id) =>
    set((state) => {
      const next = { ...state.autosaveDrafts };
      delete next[id];
      localStorage.setItem("autosave_drafts", JSON.stringify(next));
      return { autosaveDrafts: next };
    })
}));
