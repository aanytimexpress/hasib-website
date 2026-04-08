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

    if (type === "recovery" && hasRecoveryToken && location.pathname !== "/admin/reset-password") {
      navigate(`/admin/reset-password${location.search}${location.hash}`, { replace: true });
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
