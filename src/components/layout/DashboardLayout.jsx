
import React, { useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import Sidebar from "./Sidebar";

const DashboardLayout = ({
  children,
  navItems,
  activeTab,
  setActiveTab,
  userDoc,
  roleTitle,
  roleColor = "emerald",
  welcomeName
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden font-sans">
      {/* 🔮 AMBIENT BACKGROUND ORBS */}
      <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-${roleColor}-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse`}></div>
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-${roleColor}-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse`}></div>

      {/* 📱 MOBILE TOGGLE */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-6 right-6 z-[60] p-4 bg-white shadow-xl shadow-${roleColor}-900/5 rounded-2xl text-${roleColor}-600 active:scale-90 transition-transform`}
      >
        {isSidebarOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
      </button>

      {/* SIDEBAR */}
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isSidebarOpen}
        setIsMobileOpen={setSidebarOpen}
        roleTitle={roleTitle}
        roleColor={roleColor}
      />

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto z-10 custom-scrollbar relative">

        {/* TOP BAR / HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="animate-in slide-in-from-left duration-700">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Hello, <span className={`text-${roleColor}-600`}>{welcomeName}</span>
            </h2>
            {/* <p className="text-gray-400 font-semibold mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 bg-${roleColor}-500 rounded-full animate-pulse`}></span>
              Live health monitoring active
            </p> */}
          </div>

          <div className="flex items-center gap-5 animate-in slide-in-from-right duration-700">
            <button className={`p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-${roleColor}-600 transition-all shadow-sm relative group`}>
              <Bell size={22} />
              <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* 👤 PROFILE QUICK VIEW */}
            <div className="flex items-center gap-4 pl-2 bg-white border border-gray-100 rounded-3xl p-1.5 pr-6 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className={`w-11 h-11 rounded-2xl overflow-hidden bg-${roleColor}-50 border border-${roleColor}-100 flex items-center justify-center`}>
                {userDoc?.photoUrl ? (
                  <img src={userDoc.photoUrl} alt="User Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                ) : (
                  <div className={`text-${roleColor}-600 font-black text-lg`}>
                    {userDoc?.fullName?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black text-gray-900 leading-none mb-1">
                  {userDoc?.fullName || "Arogya User"}
                </p>
                <p className={`text-[10px] font-black text-${roleColor}-600 uppercase tracking-widest leading-none`}>
                  {roleTitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🧩 DYNAMIC TAB CONTENT */}
        <div className="min-h-[60vh]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
