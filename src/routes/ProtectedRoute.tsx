import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleName } from "../types/models";
import { hasAnyRole } from "../store/authStore";

interface ProtectedRouteProps {
  roles?: RoleName[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const location = useLocation();
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bengali text-slate-700">
        Loading admin panel...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && !hasAnyRole(role, roles)) {
    if (role) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
