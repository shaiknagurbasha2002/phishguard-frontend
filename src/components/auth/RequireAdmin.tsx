import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/context/UsersContext";

export function RequireAdmin() {
  const { loading, currentUserId, isAdmin } = useCurrentUser();
  const roleFromStorage =
    typeof window !== "undefined" ? localStorage.getItem("phishguard_user_role") : null;
  const hasToken = typeof window !== "undefined" ? Boolean(localStorage.getItem("phishguard_auth_token")) : false;
  const isAdminByStorage = roleFromStorage === "ROLE_ADMIN";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }
  if (!currentUserId && !hasToken) return <Navigate to="/login" replace />;
  if (!isAdmin && !isAdminByStorage) return <Navigate to="/" replace />;
  return <Outlet />;
}
