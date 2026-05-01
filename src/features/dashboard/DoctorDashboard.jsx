
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../firebase/services/auth";
import { LogOut, Stethoscope, Users, ClipboardList, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      sessionStorage.clear();
      localStorage.clear(); // 🛡️ Clear Permanent Lobby Lock
      document.body.removeAttribute("data-role");
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handleBack);

    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  return (
    <div className="min-h-screen bg-blue-50/30 p-6 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ArogyaPath</h1>
              <p className="text-blue-600 font-medium text-sm">{t("role_entry.doctor_title")}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all duration-300"
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </header>

        {/* WELCOME SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl font-bold">Manage your practice with ease.</h2>
              <p className="text-blue-100 max-w-md">Review patient records, manage upcoming consultations, and update your clinic availability in real-time.</p>
              <button className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
                View Appointments
              </button>
            </div>
            {/* Abstract shapes for premium feel */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Users size={40} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">New Consultations?</h3>
              <p className="text-gray-500 text-sm">You have 0 pending requests for today.</p>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Clock />, label: "Schedule", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: <ClipboardList />, label: "Prescriptions", color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: <Users />, label: "Patients", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: <Stethoscope />, label: "Medical Library", color: "text-orange-600", bg: "bg-orange-50" },
          ].map((action, i) => (
            <button key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className={`w-12 h-12 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="font-bold text-gray-700">{action.label}</span>
            </button>
          ))}
        </section>

      </div>
    </div>
  );
};

export default DoctorDashboard;
