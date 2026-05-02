
import React from "react";
import { BrainCircuit, Activity, Droplet, ShieldCheck, PlusCircle } from "lucide-react";

const PatientOverview = ({ t, userDoc }) => {
  const stats = [
    { icon: <Activity size={24} />, label: "Heart Rate", value: "72 bpm", color: "text-rose-600", bg: "bg-rose-50" },
    { icon: <Droplet size={24} />, label: "Blood Group", value: userDoc?.bloodGroup || "O+", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: <ShieldCheck size={24} />, label: "Health Score", value: "94/100", color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 🚀 HERO SECTION */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
        <div className="relative z-10 flex flex-col xl:flex-row items-center gap-10">
          <div className="flex-1 space-y-6 text-left">
            <h3 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">Your Health, <br/> Your Priority.</h3>
            <p className="text-emerald-100 text-lg font-medium leading-relaxed max-w-md">Track your vitals, analyze symptoms with AI, and book consultations with top medical experts—all in one place.</p>
            <button className="bg-white text-emerald-800 px-10 py-5 rounded-[1.5rem] font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95">
              <PlusCircle size={24} />
              Book Appointment
            </button>
          </div>
          <div className="hidden xl:flex w-64 h-64 bg-white/10 rounded-[3rem] backdrop-blur-sm border border-white/20 items-center justify-center rotate-3">
            <BrainCircuit size={100} className="text-white/40" />
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px]"></div>
      </div>

      {/* 📊 VITALS TRACKER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 hover:scale-[1.02] transition-all group">
            <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientOverview;
