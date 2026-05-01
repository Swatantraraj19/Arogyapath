
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../firebase/services/auth";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  LogOut,
  User,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Droplet,
  ShieldCheck,
  Bell,
  Search,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";

const PatientDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // 🛡️ FETCH REAL PATIENT DATA
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!currentUser) return;
        const docRef = doc(db, "patients", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handleBack);

    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  // 🔒 LOGOUT LOGIC
  const handleLogout = async () => {
    try {
      await logOut();
      sessionStorage.clear();
      localStorage.clear();
      document.body.removeAttribute("data-role");
      toast.success("Safe travels!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-700 font-bold animate-pulse">Healing the data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex relative overflow-hidden">

      {/* 🟢 DECORATIVE BACKGROUND ELEMENTS */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[100px] -ml-48 -mb-48"></div>

      {/* 📱 MOBILE MENU TOGGLE */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-white shadow-md rounded-2xl text-emerald-600"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🏰 SIDEBAR (The Navigation Core) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 p-8 flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Activity size={22} />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">ArogyaPath</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: <Activity size={20} />, label: "Overview", active: true },
            { icon: <Calendar size={20} />, label: "Appointments" },
            { icon: <Clock size={20} />, label: "Records" },
            { icon: <ShieldCheck size={20} />, label: "Insurance" },
            { icon: <User size={20} />, label: "Family" },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold transition-all duration-300
                ${item.active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto z-10">

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {t("common.welcome")}, {profile?.fullName?.split(" ")[0] || "Guest"}!
            </h2>
            <p className="text-gray-500 font-medium">Keep track of your health updates and activities.</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 transition-colors shadow-sm relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-gray-100 shadow-sm">
              <img
                src={profile?.photoUrl || "https://ui-avatars.com/api/?name=User&background=10b981&color=fff"}
                alt="Profile"
                className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-50"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{profile?.fullName}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Patient</p>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: <Droplet size={24} />, label: "Blood Group", value: profile?.bloodGroup || "O+", color: "text-red-500", bg: "bg-red-50" },
            { icon: <Calendar size={24} />, label: "Age", value: `${profile?.age || "24"} Years`, color: "text-blue-500", bg: "bg-blue-50" },
            { icon: <MapPin size={24} />, label: "Location", value: profile?.location || "Delhi, India", color: "text-emerald-500", bg: "bg-emerald-50" },
            { icon: <Phone size={24} />, label: "Phone", value: profile?.phone || "N/A", color: "text-orange-500", bg: "bg-orange-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg font-extrabold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LOWER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* APPOINTMENT BANNER */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-200 group">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold leading-tight">Need a professional <br /> medical consultation?</h3>
                  <p className="text-emerald-100 text-lg opacity-90">Find specialized doctors near you and book an appointment in seconds.</p>
                  <button className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-extrabold text-lg hover:scale-105 transition-transform shadow-xl">
                    Find Doctors Now
                  </button>
                </div>
                <div className="hidden md:block w-48 h-48 bg-white/10 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
                  <Calendar size={60} />
                </div>
              </div>
              {/* Abstract Glass circles */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* RECENT RECORDS */}
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-extrabold text-gray-900">Recent Health Records</h4>
                <button className="text-emerald-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  View All <ChevronRight size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Routine Checkup", date: "Oct 24, 2023", doctor: "Dr. Sharma", status: "Completed" },
                  { title: "Blood Test", date: "Sep 12, 2023", doctor: "MedLab India", status: "Pending" },
                ].map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{record.title}</p>
                        <p className="text-xs text-gray-400 font-medium">{record.doctor} • {record.date}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider
                      ${record.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}
                    `}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (Health Score & Tips) */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm text-center space-y-6">
              <h4 className="text-lg font-extrabold text-gray-900">Your Health Score</h4>
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                  <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={402} strokeDashoffset={402 - (402 * 85) / 100} className="text-emerald-500 transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-gray-900">85%</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Excellent</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                You're doing great! Complete your profile to reach 100%.
              </p>
            </div>

            <div className="bg-emerald-50/50 rounded-[2rem] p-8 border border-emerald-100 shadow-sm">
              <h4 className="text-lg font-extrabold text-emerald-900 mb-4">Daily Health Tip</h4>
              <p className="text-emerald-700 font-medium leading-relaxed italic">
                "Drinking 8 glasses of water a day keeps your energy high and your skin glowing. Stay hydrated!"
              </p>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};

export default PatientDashboard;
