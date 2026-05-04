import React from "react";
import { Calendar, Clock, User, ChevronRight } from "lucide-react";

const AppointmentList = ({ role = "patient", appointments = [] }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Your Appointments</h2>
          <p className="text-gray-400 font-bold mt-1">Manage your upcoming and past consultations</p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 border border-dashed border-gray-200 text-center space-y-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Calendar size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black text-gray-900">No appointments found</p>
            <p className="text-gray-400 font-medium max-w-xs mx-auto">When you book a consultation, it will appear here in real-time.</p>
          </div>
          <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">
            Book My First Appointment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Real data mapping will go here in the next step */}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
