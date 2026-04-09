import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { SeoSync } from "./components/public/SeoSync";

function AuthRecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const type = search.get("type") || hash.get("type");
    const hasRecoveryToken = Boolean(
      search.get("code") ||
        search.get("token_hash") ||
        hash.get("token_hash") ||
        hash.get("access_token")
    );

    if (type === "recovery" && hasRecoveryToken && location.pathname !== "/auth/reset-password") {
      const params = new URLSearchParams(location.search);
      if (!params.has("mode")) {
        params.set("mode", "user");
      }
      const query = params.toString();
      const target = `/auth/reset-password${query ? `?${query}` : ""}${location.hash}`;
      navigate(target, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <>
      <AuthRecoveryRedirect />
      <SeoSync />
      <AppRoutes />
    </>
  );
}

export default App;
