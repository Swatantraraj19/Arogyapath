import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, userDoc, loading } = useAuth();
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
    // 🔍 Extract the primary role from the URL (e.g., /dashboard/patient/settings -> 'patient')
    const pathSegments = location.pathname.split("/");
    const requestedRole = pathSegments[2]; // Index 2 is the segment after 'dashboard'
    
    // 🛡️ ULTIMATE SECURITY: Check the official database record
    const hasPermission = userDoc?.completedRoles?.includes(requestedRole);

    if (!hasPermission) {
      return <Navigate to="/role-entry" replace />;
    }

    // 🚀 SEAMLESS REDIRECT: Only if they are trying to enter the WRONG dashboard
    if (roleVerified && requestedRole && roleVerified !== requestedRole) {
      return <Navigate to={`/dashboard/${roleVerified}`} replace />;
    }

    // 🛡️ EMERGENCY FALLBACK: If no role is verified at all, go to Role Entry
    if (!roleVerified) {
      return <Navigate to="/role-entry" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
