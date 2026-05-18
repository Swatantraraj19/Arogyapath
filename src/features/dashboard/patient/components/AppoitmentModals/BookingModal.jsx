import React from "react";
import { X, Building2, Video, Loader2, CheckCircle2, Hash, Phone, MapPin } from "lucide-react";

const BookingModal = ({ 
  isOpen, onClose, bookingStep, selectedDoctor, consultationMode, setConsultationMode,
  availableDates, selectedDate, setSelectedDate, doctorSlots, selectedSlot, setSelectedSlot,
  isProcessing, confirmBooking, currentBookingId, t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {bookingStep === 1 ? (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900">{t("patient_appointments.confirm_appointment")}</h3>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.consultation_mode")}</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConsultationMode("clinic")} 
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "clinic" ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                  <Building2 size={18} /> {t("patient_appointments.clinic_visit")}
                </button>
                <button 
                  onClick={() => setConsultationMode("video")} 
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "video" ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                  <Video size={18} /> {t("patient_appointments.online_video")}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.select_date")}</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {availableDates.map(d => (
                  <button 
                    key={d.full} 
                    onClick={() => setSelectedDate(d.full)} 
                    className={`flex flex-col items-center min-w-[75px] py-4 rounded-2xl border-2 transition-all ${selectedDate === d.full ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100'}`}
                  >
                    <span className="text-[9px] font-black uppercase mb-1">{d.day}</span>
                    <span className="text-xl font-black">{d.date}</span>
                    <span className="text-[9px] font-bold opacity-60">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.select_time")}</p>
              <div className="grid grid-cols-2 gap-2">
                {doctorSlots.length > 0 ? (
                  doctorSlots.map(s => (
                    <button 
                      key={s.time} 
                      onClick={() => !s.isBooked && setSelectedSlot(s.time)} 
                      className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${s.isBooked ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed opacity-80' : selectedSlot === s.time ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'}`}
                    >
                      {s.time}
                      {s.isBooked && <span className="text-[8px] font-black uppercase tracking-tighter bg-red-100 px-1.5 py-0.5 rounded text-red-500">{t("patient_appointments.taken")}</span>}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 bg-gray-50 rounded-2xl text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t("patient_appointments.no_slots")}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={confirmBooking} 
              disabled={!selectedSlot || isProcessing} 
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${selectedSlot && !isProcessing ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-gray-100 text-gray-400'}`}
            >
              {isProcessing && <Loader2 size={20} className="animate-spin" />}
              {isProcessing ? t("patient_appointments.confirming") : `${t("patient_appointments.confirm_pay")} ${consultationMode === "clinic" ? selectedDoctor?.clinicFee || "₹800" : selectedDoctor?.onlineFee || "₹600"}`}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in duration-500">
              <CheckCircle2 size={50} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-gray-900">{t("patient_appointments.booking_confirmed")}</h3>
              <p className="text-gray-500 font-medium">{t("patient_appointments.appointment_with")} <span className="font-bold text-gray-900">{selectedDoctor?.fullName || selectedDoctor?.name}</span> {t("patient_appointments.is_confirmed")}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4 border border-gray-100 text-left">
              <div className="flex items-center justify-between text-xs font-bold border-b border-gray-200 pb-3">
                <span className="text-gray-400 flex items-center gap-2"><Hash size={14} /> {t("patient_appointments.booking_id")}</span>
                <span className="text-emerald-600 font-black tracking-widest">{currentBookingId}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.date_time")}</span>
                  <span className="text-gray-900">{selectedDate}, {selectedSlot}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.consultation_mode")}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] ${consultationMode === 'clinic' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {consultationMode === 'clinic' ? t("patient_appointments.clinic_visit") : t("patient_appointments.video_consultation")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.clinic_name")}</span>
                  <span className="text-gray-900">{selectedDoctor?.clinicName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-100 mt-2">
                  <span className="text-gray-400 flex items-center gap-2"><Phone size={14} className="text-blue-500" /> {t("patient_appointments.contact_doctor")}</span>
                  <span className="text-gray-900 font-black">{selectedDoctor?.doctorPhone || selectedDoctor?.phone || "N/A"}</span>
                </div>
                <div className="flex items-start justify-between text-xs font-bold pt-1">
                  <span className="text-gray-400 flex items-center gap-2 shrink-0"><MapPin size={14} className="text-emerald-500" /> {t("patient_appointments.clinic_address")}</span>
                  <span className="text-gray-900 text-right leading-relaxed max-w-[60%]">{selectedDoctor?.clinicAddress || selectedDoctor?.address}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all active:scale-95">
              {t("patient_appointments.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BookingModal);
