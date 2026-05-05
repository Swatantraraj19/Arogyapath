
import React, { useState, useRef, useEffect } from "react";
import { Menu, X, Bell, Languages, ChevronDown, Check, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";

const DashboardLayout = ({
  children,
  navItems,
  activeTab,
  setActiveTab,
  userDoc,
  roleTitle,
  roleColor = "emerald",
  welcomeName,
  selectedCity = "Patna",
  setSelectedCity,
  cities = ["Patna", "Delhi", "Lucknow", "Mumbai", "Bangalore"]
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);
  const { i18n } = useTranslation();
  const dropdownRef = useRef(null);
  const locRef = useRef(null);

  const languages = [
    { code: "en", label: "English", flag: "EN" },
    { code: "hi", label: "हिन्दी", flag: "HI" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
      if (locRef.current && !locRef.current.contains(event.target)) {
        setIsLocOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

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
          </div>

          <div className="flex items-center gap-5 animate-in slide-in-from-right duration-700">
            
            {/* 📍 LOCATION DROPDOWN */}
            <div className="relative" ref={locRef}>
              <button 
                onClick={() => setIsLocOpen(!isLocOpen)}
                className={`flex items-center gap-2 p-2.5 bg-white border ${isLocOpen ? `border-blue-200 ring-4 ring-blue-50` : 'border-gray-100'} rounded-2xl text-gray-600 transition-all shadow-sm group active:scale-95`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <MapPin size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-1">
                  {selectedCity}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isLocOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLocOpen && (
                <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setSelectedCity(city); setIsLocOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        selectedCity === city 
                          ? `bg-blue-50 text-blue-600` 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 🌐 LANGUAGE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-2 p-2.5 bg-white border ${isLangOpen ? `border-${roleColor}-200 ring-4 ring-${roleColor}-50` : 'border-gray-100'} rounded-2xl text-gray-600 transition-all shadow-sm group active:scale-95`}
              >
                <div className={`w-8 h-8 rounded-xl bg-${roleColor}-50 flex items-center justify-center text-${roleColor}-600`}>
                  <Languages size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-1">
                  {currentLang.flag}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-3 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        i18n.language === lang.code 
                          ? `bg-${roleColor}-50 text-${roleColor}-600` 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {i18n.language === lang.code && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
