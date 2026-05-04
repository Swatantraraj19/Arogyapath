import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../firebase/services/auth";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  LogOut, LayoutDashboard, Settings, BrainCircuit,
  MessageSquare, FileText, RefreshCw, Calendar, User, UserCircle
} from "lucide-react";
import { toast } from "react-hot-toast";

// 🧩 COMPONENTS
import DashboardLayout from "../../components/layout/DashboardLayout";
import PatientOverview from "./components/PatientOverview";
import SymptomChecker from "./components/SymptomChecker";
import AppointmentList from "./components/AppointmentList";
import ProfileUpdate from "./components/ProfileUpdate";

const PatientDashboard = () => {
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
    const docRef = doc(db, "patients", currentUser.uid);
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
    const targetRole = "doctor";
    const completedRoles = userDoc?.completedRoles || [];

    if (completedRoles.includes(targetRole)) {
      const previousRole = userDoc?.role;
      try {
        const { updateDoc, doc } = await import("firebase/firestore");

        // 🔑 VERIFY LOCALLY FIRST: Prevents flicker during cloud sync
        localStorage.setItem("roleVerified", targetRole);
        document.body.setAttribute("data-role", targetRole);

        await updateDoc(doc(db, "users", currentUser.uid), { role: targetRole });
        navigate(`/dashboard/${targetRole}`);
      } catch (error) {
        if (previousRole) {
          localStorage.setItem("roleVerified", previousRole);
          document.body.setAttribute("data-role", previousRole);
        }
        toast.error("Failed to switch role in cloud. Reverting...");
      }
    } else {
      toast(t("dashboard.switch_to_doctor") + "...", { icon: "🔄" });
      navigate(`/profile-setup/${targetRole}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      sessionStorage.clear();
      localStorage.clear();
      document.body.removeAttribute("data-role");
      toast.success("Logged out successfully");
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
    { id: "symptom", icon: <BrainCircuit size={20} />, label: t("dashboard.symptom_checker") },
    { id: "appointments", icon: <Calendar size={20} />, label: t("dashboard.appointments") },
    { id: "history", icon: <FileText size={20} />, label: t("dashboard.history") },
    { id: "profile", icon: <UserCircle size={20} />, label: t("dashboard.profile") },
    { id: "switch", icon: <RefreshCw size={20} />, label: t("dashboard.switch_to_doctor"), action: handleRoleSwitch, special: true, hoverColor: "blue" },
    { id: "logout", icon: <LogOut size={20} />, label: t("dashboard.sign_out"), action: handleLogout, danger: true },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userDoc={profileData || userDoc}
      roleTitle="PATIENT ACCOUNT"
      roleColor="emerald"
      welcomeName={profileData?.fullName?.split(" ")[0] || userDoc?.fullName?.split(" ")[0] || "Friend"}
    >
      {/* 🧩 TAB CONTENT */}
      {activeTab === "overview" && <PatientOverview t={t} userDoc={profileData || userDoc} setActiveTab={setActiveTab} />}
      {activeTab === "symptom" && <SymptomChecker t={t} setActiveTab={setActiveTab} />}
      {activeTab === "appointments" && <AppointmentList role="patient" appointments={[]} />}
      {activeTab === "profile" && <ProfileUpdate role="patient" existingData={profileData || userDoc} />}

      {/* 🚧 COMING SOON SECTIONS */}
      {(activeTab === "history" || activeTab === "chat") && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-[3rem] p-12 border border-dashed border-gray-200 text-center space-y-4 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300">
            <Settings size={40} className="animate-spin-slow" />
          </div>
          <p className="text-gray-400 font-bold">This section is currently being updated with live data.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;
