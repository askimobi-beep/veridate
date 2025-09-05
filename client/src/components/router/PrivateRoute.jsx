// src/routes/PrivateRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isLoggingOutRef } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    // If we got here because of a deliberate logout, don't preserve "from"
    if (isLoggingOutRef?.current) {
      isLoggingOutRef.current = false; // reset after one use
      return <Navigate to="/" replace state={{ loggedOut: true }} />;
    }
    // Blocked due to not logged in (deep link, expired session, etc.)
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const role = String(user.role || "").toLowerCase().trim();
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
