import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const store = useAuthStore();
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (!initialized && loading && !session) {
      void initialize();
    }
  }, [initialized, loading, session, initialize]);

  return store;
}
