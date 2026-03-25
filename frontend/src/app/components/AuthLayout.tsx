import { Outlet, Navigate } from "react-router";
import { useAuth } from "../state/auth";

export function AuthLayout() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
