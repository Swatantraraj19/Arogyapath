
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  Stethoscope, 
  Calendar, 
  History, 
  UserCircle, 
  Settings, 
  LogOut,
  RefreshCw,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { logOut } from "../../firebase/services/auth";
import PatientOverview from "./components/PatientOverview";
import SymptomChecker from "./components/SymptomChecker";
import AppointmentList from "./components/AppointmentList";
import ProfileUpdate from "./components/ProfileUpdate";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { updateDoc, doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";

const PatientDashboard = () => {
  const { t } = useTranslation();
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [suggestedSpecialty, setSuggestedSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("Patna");
  const [profileData, setProfileData] = useState(null);

  // 🔄 REAL-TIME PATIENT PROFILE LISTENER
  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, "patients", currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching patient profile:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleTabChange = (tab, specialty = "") => {
    setActiveTab(tab);
    setSuggestedSpecialty(specialty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success(t("auth.sign_out_success"));
      navigate("/");
    } catch (error) {
      toast.error(t("auth.errorUnexpected"));
    }
  };

  const handleRoleSwitch = async () => {
    try {
      const targetRole = "doctor";
      await updateDoc(doc(db, "users", currentUser.uid), { role: targetRole });
      localStorage.setItem("roleVerified", targetRole);
      navigate("/dashboard/doctor");
    } catch (error) {
      toast.error("Failed to switch role");
    }
  };

  const navItems = [
    { id: "overview", icon: <LayoutDashboard size={20} />, label: t("dashboard.overview"), color: "emerald" },
    { id: "symptom", icon: <Stethoscope size={20} />, label: t("dashboard.symptom_checker"), color: "purple" },
    { id: "appointments", icon: <Calendar size={20} />, label: t("dashboard.appointments"), color: "blue" },
    { id: "history", icon: <History size={20} />, label: t("dashboard.history"), color: "amber" },
    { id: "profile", icon: <UserCircle size={20} />, label: t("dashboard.profile"), color: "indigo" },
    { id: "switch", icon: <RefreshCw size={20} />, label: t("dashboard.switch_to_doctor"), action: handleRoleSwitch, special: true, hoverColor: "blue" },
    { id: "logout", icon: <LogOut size={20} />, label: t("dashboard.sign_out"), action: handleLogout, danger: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-emerald-900 font-black tracking-widest text-xs uppercase animate-pulse">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  const displayData = profileData || userDoc;

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      userDoc={displayData}
      roleTitle="PATIENT ACCOUNT"
      roleColor="emerald"
      welcomeName={(displayData?.fullName || "there").split(" ")[0]}
      selectedCity={selectedCity}
      setSelectedCity={setSelectedCity}
    >
      {/* 🧩 TAB CONTENT */}
      {activeTab === "overview" && (
        <PatientOverview 
          t={t} 
          userDoc={displayData} 
          setActiveTab={handleTabChange} 
        />
      )}
      
      {activeTab === "symptom" && (
        <SymptomChecker 
          t={t} 
          setActiveTab={handleTabChange} 
          externalCity={selectedCity}
        />
      )}
      
      {activeTab === "appointments" && (
        <AppointmentList 
          role="patient" 
          appointments={[]} 
          t={t} 
          initialSearch={suggestedSpecialty}
          externalCity={selectedCity}
        />
      )}
      
      {activeTab === "profile" && (
        <ProfileUpdate 
          role="patient" 
          existingData={displayData} 
        />
      )}

      {/* 🚧 COMING SOON SECTIONS */}
      {(activeTab === "history") && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-[3rem] p-12 border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300">
            <History size={40} className="animate-pulse" />
          </div>
          <p className="text-gray-400 font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} module coming soon.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;
