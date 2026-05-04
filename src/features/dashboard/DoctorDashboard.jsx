import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../firebase/services/auth";
import {
  LogOut, LayoutDashboard, Users, Clock,
  FileText, RefreshCw, Settings, UserCircle
} from "lucide-react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// 🧩 COMPONENTS
import DashboardLayout from "../../components/layout/DashboardLayout";
import DoctorOverview from "./components/DoctorOverview";
import AppointmentList from "./components/AppointmentList";
import ProfileUpdate from "./components/ProfileUpdate";

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState(null);
  
  // 🚀 SCROLL TO TOP ON MOUNT
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also scroll the main container if it exists
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;
  }, []);

  // 🧬 Fetch Role-Specific Details (Deep Hydration)
  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, "doctors", currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProfileData({ ...userDoc, ...snap.data() });
      } else {
        setProfileData(userDoc);
      }
    });
    return () => unsubscribe();
  }, [currentUser, userDoc]);

  // 🔄 ROLE SWITCH LOGIC
  const handleRoleSwitch = async () => {
    const targetRole = "patient";
    const completedRoles = userDoc?.completedRoles || [];

    if (completedRoles.includes(targetRole)) {
      const previousRole = userDoc?.role;
      try {
        localStorage.setItem("roleVerified", targetRole);
        document.body.setAttribute("data-role", targetRole);

        await updateDoc(doc(db, "users", currentUser.uid), { role: targetRole });
        navigate(`/dashboard/${targetRole}`);
      } catch (error) {
        if (previousRole) {
          localStorage.setItem("roleVerified", previousRole);
          document.body.setAttribute("data-role", previousRole);
        }
        toast.error("Failed to sync role with cloud. Reverting...");
      }
    } else {
      toast(t("dashboard.switch_to_patient") + "...", { icon: "🔄" });
      navigate(`/profile-setup/${targetRole}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      sessionStorage.clear();
      localStorage.clear();
      document.body.removeAttribute("data-role");
      toast.success("Safe travels, Doctor!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // 🔗 NAVIGATION CONFIG
  // 📌 Auto Scroll to Top on Tab Change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const navItems = [
    { id: "overview", icon: <LayoutDashboard size={20} />, label: t("dashboard.overview") },
    { id: "requests", icon: <Users size={20} />, label: "New Requests" },
    { id: "appointments", icon: <Clock size={20} />, label: "Active Consults" },
    { id: "history", icon: <FileText size={20} />, label: "Patient History" },
    { id: "profile", icon: <UserCircle size={20} />, label: t("dashboard.profile") },
    { id: "switch", icon: <RefreshCw size={20} />, label: t("dashboard.switch_to_patient"), action: handleRoleSwitch, special: true, hoverColor: "emerald" },
    { id: "logout", icon: <LogOut size={20} />, label: t("dashboard.sign_out"), action: handleLogout, danger: true },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userDoc={profileData || userDoc}
      roleTitle="DOCTOR ACCOUNT"
      roleColor="blue"
      welcomeName={`Dr. ${(profileData?.fullName || userDoc?.fullName || "Consultant").split(" ")[0]}`}
    >
      {/* 🧩 TAB CONTENT */}
      {activeTab === "overview" && <DoctorOverview t={t} userDoc={profileData || userDoc} />}
      {activeTab === "profile" && <ProfileUpdate role="doctor" existingData={profileData || userDoc} />}

      {(activeTab === "requests" || activeTab === "appointments" || activeTab === "history") && (
        <AppointmentList role="doctor" appointments={[]} />
      )}

      {activeTab === "settings" && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-[3rem] p-12 border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-300">
            <Settings size={40} className="animate-spin-slow" />
          </div>
          <p className="text-gray-400 font-bold">Settings module coming soon.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorDashboard;
