import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 🛡️ LOBBY LOCK: 
  // Even if logged in, you CANNOT enter the Dashboard without the "Lobby Pass"
  const roleVerified = localStorage.getItem("roleVerified");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  // 🛡️ PLATINUM SECURITY: Role-Locked Key Check
  if (isDashboardRoute) {
    const requiredRole = location.pathname.split("/").pop(); // Get 'patient' or 'doctor' from URL
    if (roleVerified !== requiredRole) {
      return <Navigate to="/role-entry" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
