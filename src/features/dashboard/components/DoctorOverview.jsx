import React from "react";
import { Users, Clock, MessageCircle, Check, ClipboardList } from "lucide-react";

const DoctorOverview = ({ t, userDoc }) => {
  const stats = [
    { icon: <Users size={24} />, label: "Patients", value: "0", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: <Clock size={24} />, label: "Consults", value: "0", color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: <MessageCircle size={24} />, label: "Messages", value: "0", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: <Check size={24} />, label: "Completed", value: "0", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 🚀 HERO SECTION */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
        <div className="relative z-10 flex flex-col xl:flex-row items-center gap-10">
          <div className="flex-1 space-y-6 text-left">
            <h3 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">Your Practice, <br/> Redefined.</h3>
            <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-md">Review patient records, manage upcoming consultations, and update your clinic availability in real-time.</p>
            <button className="bg-white text-blue-800 px-10 py-5 rounded-[1.5rem] font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95">
              <ClipboardList size={24} />
              View Schedule
            </button>
          </div>
          <div className="hidden xl:flex w-64 h-64 bg-white/10 rounded-[3rem] backdrop-blur-sm border border-white/20 items-center justify-center rotate-3">
            <ClipboardList size={100} className="text-white/40" />
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]"></div>
      </div>

      {/* 📊 PRACTICE STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4 hover:scale-[1.03] transition-all group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorOverview;
