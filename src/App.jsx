import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LanguageSelection from "./features/auth/LanguageSelection";
import AuthChoice from "./features/auth/AuthChoice";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import RoleEntry from "./features/auth/RoleEntry";
import ProfileSetup from "./features/auth/ProfileSetup";
import PatientDashboard from "./features/dashboard/patient/PatientDashboard";
import DoctorDashboard from "./features/dashboard/doctor/DoctorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { LocationProvider } from "./context/LocationContext";
import "./index.css"; // Ensure index.css is imported for variables

const App = () => {
  return (
    // 🟣 STEP 2: APPLY GLOBAL BACKGROUND (Official Requirement)
    <div 
      style={{ background: "var(--bg-gradient)" }} 
      className="min-h-screen selection:bg-emerald-100 selection:text-emerald-900"
    >
      <LocationProvider>
        <Router>
          <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          {/* STEP 1: App Opens (Language Page) */}
          <Route path="/" element={<PublicRoute><LanguageSelection /></PublicRoute>} />
          
          {/* STEP 2: Auth Choice Page */}
          <Route path="/auth-choice" element={<PublicRoute><AuthChoice /></PublicRoute>} />
          
          {/* STEP 3 & LOGIN */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          
          {/* Path for future Role Entry (Step 4) */}
          <Route path="/role-entry" element={<ProtectedRoute><RoleEntry /></ProtectedRoute>} />
          
          {/* STEP 5: Profile Setup */}
          <Route path="/profile-setup/:role" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

          {/* STEP 6: Dashboards */}
          <Route path="/dashboard/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </LocationProvider>
  </div>
);
};

export default App;
