
import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, ChevronRight, Search, Star, MapPin, Filter, Stethoscope, Mic, MicOff, X, AlertCircle, CheckCircle2, Video, Building2, Phone, Hash } from "lucide-react";
import { toast } from "react-hot-toast";

const AppointmentList = ({ role = "patient", t, initialSearch = "", externalCity = "Patna" }) => {
  const [activeSubTab, setActiveSubTab] = useState("find");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isListening, setIsListening] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // 🕒 Booking States
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationMode, setConsultationMode] = useState("clinic");
  const [bookingStep, setBookingStep] = useState(1);
  const [currentBookingId, setCurrentBookingId] = useState("");

  // ⭐ Rating States
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingAppointmentId, setRatingAppointmentId] = useState(null);
  
  const recognitionRef = useRef(null);

  // Mock Appointments for "My Bookings"
  const [myBookings, setMyBookings] = useState([
    { id: 'app_1', doctorName: "Dr. Sameer Sharma", specialty: "Cardiologist", date: "Oct 24, 2023", time: "10:30 AM", status: "completed", mode: "clinic", hasRated: false },
    { id: 'app_2', doctorName: "Dr. Anjali Gupta", specialty: "Dermatologist", date: "Oct 28, 2023", time: "05:00 PM", status: "upcoming", mode: "video", hasRated: false },
    { id: 'app_3', doctorName: "Dr. Rajesh Varma", specialty: "General Physician", date: "Oct 20, 2023", time: "11:00 AM", status: "cancelled", mode: "clinic", hasRated: false }
  ]);

  const doctors = [
    { id: 1, name: "Dr. Sameer Sharma", specialty: "Cardiologist", experience: "12 yrs", rating: 4.8, reviews: 124, clinicFee: "₹800", onlineFee: "₹600", clinicName: "Arogya Heart Care", address: "12/A, Medical Square, Lucknow", city: "Lucknow", phone: "+91 98765 43210" },
    { id: 2, name: "Dr. Anjali Gupta", specialty: "Dermatologist", experience: "8 yrs", rating: 4.9, reviews: 89, clinicFee: "₹1000", onlineFee: "₹750", clinicName: "Glow Skin Clinic", address: "45, Fashion Street, Delhi", city: "Delhi", phone: "+91 91234 56789" },
    { id: 3, name: "Dr. Rajesh Varma", specialty: "General Physician", experience: "15 yrs", rating: 4.7, reviews: 210, clinicFee: "₹500", onlineFee: "₹400", clinicName: "Patna Central Clinic", address: "Boring Road, Patna", city: "Patna", phone: "+91 88888 77777" },
    { id: 4, name: "Dr. Priya Iyer", specialty: "Pediatrician", experience: "10 yrs", rating: 4.9, reviews: 156, clinicFee: "₹700", onlineFee: "₹550", clinicName: "Arogya Kids Patna", address: "Kankarbagh Main Rd, Patna", city: "Patna", phone: "+91 77665 54433" },
    { id: 5, name: "Dr. Kabir Singh", specialty: "Orthopedic", experience: "14 yrs", rating: 4.6, reviews: 340, clinicFee: "₹900", onlineFee: "₹650", clinicName: "Bone & Joint Centre", address: "MG Road, Indiranagar, Bangalore", city: "Bangalore", phone: "+91 99009 90099" },
  ];

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      full: d.toDateString()
    };
  });

  const morningSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "11:30 AM"];
  const eveningSlots = ["05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep(1);
    setSelectedDate(availableDates[0].full);
    setSelectedSlot(null);
    setConsultationMode("clinic");
    setIsBookingModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedSlot) return toast.error("Please select a time slot");
    const newId = `AP-${Math.floor(Math.random() * 9000) + 1000}`;
    setCurrentBookingId(newId);
    setBookingStep(2);
    toast.success("Appointment Confirmed!");
  };

  const handleViewBooking = (app) => {
    // Find the doctor object to get clinic details
    const doctor = doctors.find(d => d.name === app.doctorName);
    setSelectedDoctor(doctor || { name: app.doctorName });
    setSelectedDate(app.date);
    setSelectedSlot(app.time);
    setConsultationMode(app.mode);
    setCurrentBookingId(app.id);
    setBookingStep(2);
    setIsBookingModalOpen(true);
  };

  const handleCancelAppointment = (appId) => {
    if (window.confirm("Are you sure?")) {
      setMyBookings(prev => prev.map(app => app.id === appId ? { ...app, status: 'cancelled' } : app));
      toast.success("Cancelled");
    }
  };

  const openRatingModal = (appId) => {
    setRatingAppointmentId(appId);
    setRatingValue(0);
    setIsRatingModalOpen(true);
  };

  const submitRating = () => {
    setMyBookings(prev => prev.map(app => app.id === ratingAppointmentId ? { ...app, hasRated: true } : app));
    setIsRatingModalOpen(false);
    toast.success("Rated!");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-700 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('appointments.title')}</h2>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button onClick={() => setActiveSubTab("find")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'find' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t('appointments.find_doctors')}
            </button>
            <button onClick={() => setActiveSubTab("my")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'my' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t('appointments.my_bookings')}
            </button>
          </div>
        </div>

        {activeSubTab === "find" && (
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Search Input */}
            <div className="relative group flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder={isListening ? "Listening..." : "Search doctor or specialty..."} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 outline-none transition-all font-bold text-sm" 
              />
            </div>
          </div>
        )}
      </div>

      {activeSubTab === "find" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors
            .filter(d => (externalCity === "All" || d.city === externalCity))
            .filter(d => 
              d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((doc) => (
            <div key={doc.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all overflow-hidden shadow-inner">
                    <User size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-wider">{doc.specialty}</div>
                      <div className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase tracking-wider">
                        <MapPin size={8} className="mr-1" /> {doc.city}
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors leading-tight">{doc.name}</h4>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-y border-gray-50 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rating</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-gray-700">{doc.rating}</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-100"></div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Experience</span>
                    <span className="text-xs font-black text-gray-700 mt-0.5">{doc.experience}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-500 shrink-0">
                      <Building2 size={12} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 truncate">{doc.clinicName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                      <MapPin size={12} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 leading-relaxed line-clamp-2">{doc.address}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleBookClick(doc)} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-gray-200">Book Appointment</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {myBookings.map(app => (
            <div 
              key={app.id} 
              onClick={() => handleViewBooking(app)}
              className={`bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between gap-4 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all ${app.status === 'cancelled' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${app.status === 'completed' ? 'bg-gray-50 border-gray-100 text-gray-400' : app.status === 'cancelled' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  {app.mode === 'video' ? <Video size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h5 className={`font-black text-gray-900 leading-tight ${app.status === 'cancelled' ? 'line-through opacity-50' : ''}`}>{app.doctorName}</h5>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{app.date} • {app.time}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 shrink-0 min-w-[110px]">
                {app.status === 'completed' ? (
                  <>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-100">Completed</span>
                    {!app.hasRated ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openRatingModal(app.id); }}
                        className="text-[10px] font-black text-white bg-amber-500 px-4 py-1.5 rounded-xl uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-900/10 active:scale-95"
                      >
                        Rate Now
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-gray-400 flex items-center gap-1 mt-1"><CheckCircle2 size={10} className="text-emerald-500" /> Rated</span>
                    )}
                  </>
                ) : app.status === 'cancelled' ? (
                  <span className="text-[9px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-red-100">Cancelled</span>
                ) : (
                  <>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-blue-100">Upcoming</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCancelAppointment(app.id); }}
                      className="text-[9px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ⭐ RATING MODAL */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600"><Star size={32} className="fill-amber-600" /></div>
            <div><h3 className="text-2xl font-black text-gray-900">Rate your visit</h3><p className="text-gray-500 text-xs font-medium mt-1">How was your experience?</p></div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRatingValue(star)}>
                  <Star size={36} className={`${(hoverRating || ratingValue) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} transition-colors`} />
                </button>
              ))}
            </div>
            <button onClick={submitRating} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">Submit Review</button>
          </div>
        </div>
      )}

      {/* 🗓️ UPDATED BOOKING MODAL WITH RECEIPT DETAILS */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
            {bookingStep === 1 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between"><h3 className="text-2xl font-black text-gray-900">Confirm Appointment</h3><button onClick={() => setIsBookingModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500"><X size={20} /></button></div>
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Consultation Mode</p>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setConsultationMode("clinic")} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "clinic" ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-gray-100 text-gray-500'}`}><Building2 size={18} /> Clinic Visit</button>
                      <button onClick={() => setConsultationMode("video")} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "video" ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}><Video size={18} /> Online Video</button>
                   </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Date</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {availableDates.map((d, idx) => (
                      <button key={idx} onClick={() => setSelectedDate(d.full)} className={`flex flex-col items-center min-w-[75px] py-4 rounded-2xl border-2 transition-all ${selectedDate === d.full ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100'}`}>
                        <span className="text-[9px] font-black uppercase mb-1">{d.day}</span><span className="text-xl font-black">{d.date}</span><span className="text-[9px] font-bold opacity-60">{d.month}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Time</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[...morningSlots, ...eveningSlots].map(slot => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all ${selectedSlot === slot ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-100'}`}>{slot}</button>
                    ))}
                  </div>
                </div>
                <button onClick={confirmBooking} disabled={!selectedSlot} className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl ${selectedSlot ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  Confirm & Pay {consultationMode === "clinic" ? selectedDoctor?.clinicFee : selectedDoctor?.onlineFee}
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in duration-500"><CheckCircle2 size={50} /></div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-gray-900">Booking Confirmed!</h3>
                  <p className="text-gray-500 font-medium">Your appointment with <span className="font-bold text-gray-900">{selectedDoctor?.name}</span> is confirmed.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4 border border-gray-100 text-left">
                   <div className="flex items-center justify-between text-xs font-bold border-b border-gray-200 pb-3">
                     <span className="text-gray-400 flex items-center gap-2"><Hash size={14}/> Booking ID</span>
                     <span className="text-emerald-600 font-black tracking-widest">{currentBookingId}</span>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-400">Date & Time</span>
                        <span className="text-gray-900">{selectedDate}, {selectedSlot}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-400">Consultation Mode</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] ${consultationMode === 'clinic' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{consultationMode === 'clinic' ? 'Clinic Visit' : 'Video Consultation'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-400">Clinic Name</span>
                        <span className="text-gray-900">{selectedDoctor?.clinicName}</span>
                      </div>
                      <div className="flex items-start justify-between text-xs font-bold pt-1">
                        <span className="text-gray-400 flex items-center gap-2 shrink-0"><MapPin size={14} className="text-emerald-500"/> Clinic Address</span>
                        <span className="text-gray-900 text-right leading-relaxed max-w-[60%]">{selectedDoctor?.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold pt-1">
                        <span className="text-gray-400 flex items-center gap-2"><Phone size={14} className="text-emerald-500"/> Contact Number</span>
                        <span className="text-gray-900 font-black">{selectedDoctor?.phone}</span>
                      </div>
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-gray-200">
                     <span className="text-gray-400">Consultation Fee</span>
                     <span className="text-emerald-600 font-black">{consultationMode === "clinic" ? selectedDoctor?.clinicFee : selectedDoctor?.onlineFee} Paid</span>
                   </div>
                </div>

                <button onClick={() => setIsBookingModalOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all active:scale-95">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
