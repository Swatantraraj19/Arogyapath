import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, ChevronRight, Search, Video, Building2, X, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const DoctorAppointmentList = ({ t }) => {
  const [activeSubTab, setActiveSubTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock Data for Doctors
  const [appointments, setAppointments] = useState([
    { id: 'REQ-9821', patientName: "Rahul Sharma", age: "28", gender: "Male", date: "Today", time: "10:30 AM", type: "Clinic Visit", status: "pending", symptoms: "Persistent cough and mild fever for 3 days." },
    { id: 'REQ-9822', patientName: "Priya Gupta", age: "34", gender: "Female", date: "Today", time: "12:00 PM", type: "Video Consult", status: "pending", symptoms: "Skin rash on arms, very itchy." },
    { id: 'ACT-4412', patientName: "Amit Verma", age: "45", gender: "Male", date: "Today", time: "02:30 PM", type: "Clinic Visit", status: "active", symptoms: "Follow up for hypertension." },
    { id: 'HIS-1102', patientName: "Suman Devi", age: "52", gender: "Female", date: "Yesterday", time: "11:00 AM", type: "Clinic Visit", status: "completed", symptoms: "Joint pain in knees." }
  ]);

  const filteredAppointments = appointments.filter(app => {
    if (activeSubTab === "requests") return app.status === "pending";
    if (activeSubTab === "active") return app.status === "active";
    if (activeSubTab === "history") return app.status === "completed" || app.status === "cancelled";
    return true;
  }).filter(app => 
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (id, newStatus) => {
    setAppointments(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
    toast.success(`Appointment ${newStatus === 'active' ? 'Accepted' : newStatus === 'completed' ? 'Completed' : 'Cancelled'}`);
    setIsDetailModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 🧭 NAVIGATION PILLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
          <button onClick={() => setActiveSubTab("requests")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "requests" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>New Requests</button>
          <button onClick={() => setActiveSubTab("active")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "active" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Active Consults</button>
          <button onClick={() => setActiveSubTab("history")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "history" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>History</button>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search patient name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-xs"
          />
        </div>
      </div>

      {/* 📋 LIST CONTENT */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100 min-h-[40vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeSubTab === 'requests' ? <AlertCircle size={40} /> : <Clock size={40} />}
            </div>
            <h4 className="text-xl font-black text-gray-900">No {activeSubTab} found</h4>
            <p className="text-gray-400 font-bold max-w-xs mx-auto">Your list is clear. New appointments will appear here.</p>
          </div>
        ) : (
          filteredAppointments.map(app => (
            <div key={app.id} onClick={() => { setSelectedAppointment(app); setIsDetailModalOpen(true); }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md transition-all cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${app.status === 'pending' ? 'bg-amber-50 text-amber-600' : app.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                <User size={28} />
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' : app.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {app.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{app.id}</span>
                </div>
                <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{app.patientName}</h4>
                <p className="text-xs font-bold text-gray-500">{app.age} yrs • {app.gender} • {app.type}</p>
              </div>

              <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-left">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-xs font-black">{app.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={14} />
                  <span className="text-[11px] font-bold">{app.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 📄 DETAIL MODAL */}
      {isDetailModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><User size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Appointment Details</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedAppointment.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.patientName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.date}, {selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reported Symptoms / Reason</p>
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 italic">
                    "{selectedAppointment.symptoms}"
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                     {selectedAppointment.type === 'Video Consult' ? <Video size={20} /> : <Building2 size={20} />}
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Consultation Mode</p>
                     <p className="text-sm font-black text-blue-800">{selectedAppointment.type}</p>
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex gap-4">
                {selectedAppointment.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(selectedAppointment.id, 'cancelled')} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Decline</button>
                    <button onClick={() => handleAction(selectedAppointment.id, 'active')} className="flex-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Accept Request</button>
                  </>
                )}
                {selectedAppointment.status === 'active' && (
                  <button onClick={() => handleAction(selectedAppointment.id, 'completed')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all">Mark as Completed</button>
                )}
                {(selectedAppointment.status === 'completed' || selectedAppointment.status === 'cancelled') && (
                  <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Close Record</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentList;
