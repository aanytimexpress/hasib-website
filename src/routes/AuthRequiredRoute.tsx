import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleName } from "../types/models";

interface AuthRequiredRouteProps {
  roles?: RoleName[];
}

export function AuthRequiredRoute({ roles }: AuthRequiredRouteProps) {
  const location = useLocation();
  const { loading, session, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bengali text-slate-700">
        আপনার তথ্য যাচাই করা হচ্ছে...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && (!role || !roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
