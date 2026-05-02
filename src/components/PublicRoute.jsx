import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { currentUser, userDoc, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (currentUser) {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");

    // 🔑 SCENARIO 1: Fresh Login (Icon Lobby)
    if (justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn");
      return <Navigate to="/role-entry" replace />;
    }

    // 🔑 SCENARIO 2: Returning User / Back Button
    const roleVerified = localStorage.getItem("roleVerified");

    // 🛡️ MULTI-ROLE SECURITY: Redirect to dashboard only if role is verified AND completed
    if (roleVerified && userDoc?.completedRoles?.includes(roleVerified)) {
      return <Navigate to={`/dashboard/${roleVerified}`} replace />;
    }
    
    // Default: If not verified for this session, force them to Role Selection
    return <Navigate to="/role-entry" replace />;
  }

  return children;
};

export default PublicRoute;
