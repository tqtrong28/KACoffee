import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";

type Props = {
  actorType: "customer" | "employee";
  roles?: string[];
  redirectTo?: string;
};

export function ProtectedRoute({ actorType, roles, redirectTo }: Props) {
  const { session, me } = useAuthStore();

  if (!session) {
    return <Navigate to={redirectTo ?? (actorType === "customer" ? "/login" : "/admin/login")} replace />;
  }

  if (session.actor_type !== actorType) {
    return <Navigate to="/" replace />;
  }

  if (roles && me?.role && !roles.includes(me.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
