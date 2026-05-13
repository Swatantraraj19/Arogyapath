import React from "react";
import { Video, Building2, CheckCircle2 } from "lucide-react";

const MyBookingCard = ({ app, onClick, onCancel, onRate }) => (
  <div
    onClick={() => onClick(app)}
    className={`bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between gap-4 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all ${app.status === 'cancelled' ? 'opacity-60' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${app.status === 'completed' ? 'bg-gray-50 border-gray-100 text-gray-400' : app.status === 'cancelled' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
        {app.mode === 'video' ? <Video size={24} /> : <Building2 size={24} />}
      </div>
      <div className="text-left">
        <h5 className={`font-black text-gray-900 leading-tight ${app.status === 'cancelled' ? 'opacity-50' : ''}`}>{app.doctorName}</h5>
        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{app.date} • {app.time}</p>
      </div>
    </div>

    <div className="flex flex-col items-end gap-2 shrink-0 min-w-[110px]">
      {app.status === 'completed' ? (
        <>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-100">Completed</span>
          {!app.hasRated ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRate(app.id); }}
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
          {app.meetingRoomId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://meet.jit.si/${app.meetingRoomId}`, '_blank');
              }}
              className="text-[10px] font-black text-white bg-blue-600 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-1.5 active:scale-95 animate-pulse"
            >
              <Video size={14} />
              Join Call
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(app.id); }}
            className="text-[9px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  </div>
);

export default React.memo(MyBookingCard);
