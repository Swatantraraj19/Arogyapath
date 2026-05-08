import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, ChevronRight, Search, Video, Building2, X, AlertCircle, Phone, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";

const DoctorAppointmentList = ({ t }) => {
  const [activeSubTab, setActiveSubTab] = useState("upcoming");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock Data (Sync with Patient's Instant Booking)
  const [appointments, setAppointments] = useState([
    { id: 'AP-9821', patientName: "Rahul Sharma", age: "28", gender: "Male", phone: "+91 98765 43210", address: "Sector 14, Gurgaon, Haryana", date: "Today", time: "10:30 AM", type: "Clinic Visit", status: "confirmed", symptoms: "Persistent cough and mild fever for 3 days." },
    { id: 'AP-9822', patientName: "Priya Gupta", age: "34", gender: "Female", phone: "+91 88776 55443", address: "Model Town, Delhi", date: "Today", time: "12:00 PM", type: "Video Consult", status: "confirmed", symptoms: "Skin rash on arms, very itchy." },
    { id: 'ACT-4412', patientName: "Amit Verma", age: "45", gender: "Male", phone: "+91 77665 54433", address: "Phase 3, Mohali, Punjab", date: "Today", time: "02:30 PM", type: "Clinic Visit", status: "confirmed", symptoms: "Follow up for hypertension." },
    { id: 'TMW-1102', patientName: "Suman Devi", age: "52", gender: "Female", phone: "+91 99887 76655", address: "Jaipur, Rajasthan", date: "Tomorrow", time: "11:00 AM", type: "Clinic Visit", status: "confirmed", symptoms: "Joint pain in knees." },
    { id: 'HIS-1102', patientName: "Vikram Singh", age: "42", gender: "Male", phone: "+91 99887 11223", address: "Sector 4, Chandigarh", date: "Yesterday", time: "04:00 PM", type: "Clinic Visit", status: "completed", symptoms: "General checkup." }
  ]);

  const filteredAppointments = appointments.filter(app => {
    // 1. Filter by Status Tab
    if (activeSubTab === "upcoming") {
      if (!(app.status === "confirmed" || app.status === "active")) return false;
    } else if (activeSubTab === "completed") {
      if (app.status !== "completed") return false;
    } else if (activeSubTab === "cancelled") {
      if (app.status !== "cancelled") return false;
    }

    // 2. Filter by Consult Type
    if (filterType !== "All" && app.type !== filterType) return false;

    return true;
  }).filter(app => 
    app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🧬 Group Appointments by Date
  const groupedAppointments = filteredAppointments.reduce((groups, app) => {
    const date = app.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(app);
    return groups;
  }, {});

  const handleAction = (id, newStatus) => {
    setAppointments(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
    setIsDetailModalOpen(false);
    toast.success(`Appointment marked as ${newStatus}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔍 HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit">
          <button onClick={() => setActiveSubTab("upcoming")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "upcoming" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Upcoming</button>
          <button onClick={() => setActiveSubTab("completed")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "completed" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Completed</button>
          <button onClick={() => setActiveSubTab("cancelled")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "cancelled" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Cancelled</button>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search patient name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all text-sm font-bold text-gray-700"
          />
        </div>
      </div>

      {/* 🏷️ CONSULT TYPE FILTERS */}
      <div className="flex flex-wrap gap-2 px-1">
        {[
          { id: "All", label: "All Consults", icon: null },
          { id: "Clinic Visit", label: "Clinic", icon: <Building2 size={12} /> },
          { id: "Video Consult", label: "Video", icon: <Video size={12} /> }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
              filterType === type.id 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                : "bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:text-gray-600"
            }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {/* 📋 GROUPED APPOINTMENT LIST */}
      <div className="space-y-10">
        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">No appointments found for this category.</p>
          </div>
        ) : (
          Object.entries(groupedAppointments).map(([date, apps]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">{date}</h3>
                <div className="h-px w-full bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {apps.map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => { setSelectedAppointment(app); setIsDetailModalOpen(true); }}
                    className="group bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer flex items-center gap-6"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : app.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                      <User size={28} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : app.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {app.status}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">{app.id}</span>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{app.patientName}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">{app.age} yrs • {app.gender}</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Phone size={10} /> {app.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-left">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-xs font-black">{app.date}</span>
                      </div>
                      {app.status === 'active' ? (
                        <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-[11px] font-black uppercase tracking-widest">In Progress</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={14} />
                          <span className="text-[11px] font-bold">{app.time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <button className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 📄 DETAIL MODAL */}
      {isDetailModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><User size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Appointment Details</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedAppointment.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Patient Name</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.patientName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact Number</p>
                    <p className="text-sm font-black text-blue-600">{selectedAppointment.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Residential Address</p>
                    <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <MapPin size={12} className="text-red-500" />
                      {selectedAppointment.address}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Schedule</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.date}, {selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Reported Symptoms / Reason</p>
                  <div className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 italic">
                    "{selectedAppointment.symptoms}"
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                   <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      {selectedAppointment.type === 'Video Consult' ? <Video size={18} /> : <Building2 size={18} />}
                   </div>
                   <div>
                     <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">Consultation Mode</p>
                     <p className="text-sm font-black text-blue-800">{selectedAppointment.type}</p>
                   </div>
                </div>
              </div>

              <div className="pt-6 pb-6 px-6 border-t border-gray-50 flex gap-4">
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <button onClick={() => handleAction(selectedAppointment.id, 'cancelled')} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Cancel</button>
                    <button onClick={() => handleAction(selectedAppointment.id, 'active')} className="flex-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Start Consultation</button>
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
