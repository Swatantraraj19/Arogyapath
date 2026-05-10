import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, MapPin, Mic, MicOff, RefreshCw, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation } from "../../../../context/LocationContext";
import { db } from "../../../../firebase/config";
import { useAuth } from "../../../../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

// Modals & Components
import RatingModal from "./AppoitmentModals/RatingModal";
import BookingModal from "./AppoitmentModals/BookingModal";
import FindDoctorCard from "./AppoitmentCards/FindDoctorCard";
import MyBookingCard from "./AppoitmentCards/MyBookingCard";

const PatientAppointment = ({ t, initialSearch = "" }) => {
  const { currentUser } = useAuth();
  const {
    selectedCity: externalCity,
    handleDetectLocation: onDetectLocation,
    isLocating
  } = useLocation();
  const [activeSubTab, setActiveSubTab] = useState("find");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearch);
  const [isListening, setIsListening] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // 🕒 Booking States
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationMode, setConsultationMode] = useState("clinic");
  const [bookingStep, setBookingStep] = useState(1);
  const [currentBookingId, setCurrentBookingId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ⭐ Rating States
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingAppointmentId, setRatingAppointmentId] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState([]);

  const recognitionRef = useRef(null);

  // 📥 Fetch Doctors from Firestore
  useEffect(() => {
    const q = query(collection(db, "doctors"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(docs);
    });
    return () => unsubscribe();
  }, []);

  // 📥 Fetch Patient's Bookings
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedBookings = bookings.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setMyBookings(sortedBookings);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 🔄 SMART DEBOUNCE LOGIC
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync initialSearch
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setActiveSubTab("find");
    }
  }, [initialSearch]);

  const availableDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      full: `${year}-${month}-${day}`
    };
  }), []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return toast.error("Not supported");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const format12h = useCallback((time24) => {
    if (!time24) return "";
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }, []);

  const [bookedSlots, setBookedSlots] = useState([]);
  const availabilityUnsubscribeRef = useRef(null);
  const bookingsUnsubscribeRef = useRef(null);

  const handleBookClick = useCallback(async (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep(1);
    setSelectedDate(availableDates[0].full);
    setSelectedSlot(null);
    setConsultationMode("clinic");
    setIsBookingModalOpen(true);
    setDoctorSlots([]);

    if (availabilityUnsubscribeRef.current) availabilityUnsubscribeRef.current();
    if (bookingsUnsubscribeRef.current) bookingsUnsubscribeRef.current();

    const availRef = doc(db, "availability", doctor.id);
    availabilityUnsubscribeRef.current = onSnapshot(availRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedDoctor(prev => ({ ...prev, availability: data }));
      }
    });

    const appointmentsRef = collection(db, "appointments");
    const q = query(
      appointmentsRef,
      where("doctorId", "==", doctor.id),
      where("status", "==", "upcoming")
    );

    bookingsUnsubscribeRef.current = onSnapshot(q, (snapshot) => {
      const taken = snapshot.docs.map(doc => ({
        date: doc.data().rawDate,
        time: doc.data().time
      }));
      setBookedSlots(taken);
    });
  }, [availableDates]);

  useEffect(() => {
    if (!isBookingModalOpen) {
      if (availabilityUnsubscribeRef.current) availabilityUnsubscribeRef.current();
      if (bookingsUnsubscribeRef.current) bookingsUnsubscribeRef.current();
      availabilityUnsubscribeRef.current = null;
      bookingsUnsubscribeRef.current = null;
    }
  }, [isBookingModalOpen]);

  const generateSlotsForDate = useCallback((dateStr, availability) => {
    if (!availability) return setDoctorSlots([]);
    if (availability.blockedDates?.includes(dateStr)) {
      setDoctorSlots([]);
      return;
    }
    const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = availability.weeklySchedule?.find(d => d.day === dayName);

    if (daySchedule && daySchedule.slots) {
      const duration = parseInt(availability.slotDuration) || 30;
      let generatedSlots = [];
      daySchedule.slots.forEach(interval => {
        const parseMinutes = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const formatFromMinutes = (mins) => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };
        let current = parseMinutes(interval.start);
        const end = parseMinutes(interval.end);
        while (current + duration <= end) {
          const slot = format12h(formatFromMinutes(current));
          
          // 🕒 Check if slot is in the past (only for today)
          let isPast = false;
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;

          if (dateStr === todayStr) {
            const [slotH, slotM] = formatFromMinutes(current).split(':').map(Number);
            const nowH = today.getHours();
            const nowM = today.getMinutes();
            if (slotH < nowH || (slotH === nowH && slotM <= nowM)) {
              isPast = true;
            }
          }

          const isTaken = bookedSlots.some(b => b.date === dateStr && b.time === slot);
          if (!generatedSlots.some(s => s.time === slot)) {
            generatedSlots.push({ 
              time: slot, 
              isBooked: isTaken || isPast,
              isPast: isPast 
            });
          }
          current += duration;
        }
      });
      setDoctorSlots(generatedSlots);
    } else {
      setDoctorSlots([]);
    }
  }, [bookedSlots, format12h]);

  useEffect(() => {
    if (selectedDoctor?.availability && selectedDate) {
      generateSlotsForDate(selectedDate, selectedDoctor.availability);
    }
  }, [selectedDate, selectedDoctor?.availability, bookedSlots, generateSlotsForDate]);

  const confirmBooking = async () => {
    if (!currentUser) return toast.error("Please login first");
    if (!selectedSlot) return toast.error("Please select a time slot");
    setIsProcessing(true);
    try {
      const lockId = `${selectedDoctor.id}_${selectedDate}_${selectedSlot.replace(/\s+/g, '')}`;
      const lockRef = doc(db, "slot_locks", lockId);
      const appointmentRef = doc(collection(db, "appointments"));
      const pRef = doc(db, "patients", currentUser.uid);
      const pSnap = await getDoc(pRef);
      const realPatientName = pSnap.exists() ? pSnap.data().fullName : "Patient";
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let generatedId = '';
      for (let i = 0; i < 5; i++) {
        generatedId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await runTransaction(db, async (transaction) => {
        const lockSnap = await transaction.get(lockRef);
        if (lockSnap.exists()) {
          throw new Error("This slot has just been booked by someone else!");
        }
        const appointmentData = {
          bookingId: generatedId,
          patientId: currentUser.uid,
          patientName: realPatientName,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.fullName || selectedDoctor.name,
          doctorPhone: selectedDoctor.phone || "N/A",
          specialty: selectedDoctor.specialization || selectedDoctor.specialty,
          clinicName: selectedDoctor.clinicName || "Arogya Clinic",
          address: selectedDoctor.clinicAddress || selectedDoctor.address,
          date: new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rawDate: selectedDate,
          time: selectedSlot,
          status: "upcoming",
          mode: consultationMode,
          createdAt: serverTimestamp(),
          hasRated: false
        };
        transaction.set(lockRef, {
          patientId: currentUser.uid,
          bookedAt: serverTimestamp(),
          appointmentId: appointmentRef.id
        });
        transaction.set(appointmentRef, appointmentData);
      });
      setCurrentBookingId(generatedId);
      setBookingStep(2);
      toast.success("Appointment Confirmed!");
    } catch (error) {
      console.error("Booking Transaction Error:", error);
      toast.error(error.message || "Failed to book appointment. Please try again.", { icon: '🚫' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewBooking = useCallback((app) => {
    const doctor = doctors.find(d => d.id === app.doctorId);
    setSelectedDoctor(doctor || {
      fullName: app.doctorName,
      clinicName: app.clinicName,
      clinicAddress: app.address,
      doctorPhone: app.doctorPhone
    });
    setSelectedDate(app.date);
    setSelectedSlot(app.time);
    setConsultationMode(app.mode);
    setCurrentBookingId(app.bookingId || app.id.slice(0, 8).toUpperCase());
    setBookingStep(2);
    setIsBookingModalOpen(true);
  }, [doctors]);

  const handleCancelAppointment = useCallback(async (appId) => {
    if (window.confirm("Are you sure?")) {
      try {
        await setDoc(doc(db, "appointments", appId), { status: 'cancelled' }, { merge: true });
        toast.success("Appointment Cancelled Successfully");
      } catch (error) {
        toast.error("Failed to cancel appointment");
      }
    }
  }, []);

  const submitRating = useCallback(async () => {
    if (ratingValue === 0) return toast.error("Please select stars");
    try {
      await setDoc(doc(db, "appointments", ratingAppointmentId), {
        hasRated: true,
        rating: ratingValue
      }, { merge: true });
      setIsRatingModalOpen(false);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Failed to submit rating");
    }
  }, [ratingValue, ratingAppointmentId]);

  // 🧠 SMART SEARCH LOGIC (Synonyms + Keyword Splitting + Ranking)
  const filteredDoctors = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (!query && (!externalCity || externalCity === "All")) return doctors;

    const synonymMap = {
      'heart': 'cardiologist', 'dil': 'cardiologist',
      'skin': 'dermatologist', 'tvacha': 'dermatologist',
      'child': 'pediatrician', 'bacha': 'pediatrician',
      'bone': 'orthopedic', 'haddi': 'orthopedic',
      'eye': 'ophthalmologist', 'aankh': 'ophthalmologist',
      'brain': 'neurologist', 'dimag': 'neurologist',
      'teeth': 'dentist', 'daant': 'dentist',
      'kidney': 'nephrologist', 'urologist': 'urologist',
      'cancer': 'oncologist', 'stomach': 'gastroenterologist',
      'pait': 'gastroenterologist', 'hormone': 'endocrinologist'
    };

    const keywords = query.split(/\s+/).map(k => synonymMap[k] || k);

    return doctors
      .map(d => {
        let score = 0;
        const name = (d.fullName || d.name || "").toLowerCase();
        const specKey = (d.specialization || d.specialty || "General Physician").toLowerCase().replace(/\s+/g, '_');
        const spec = t(`profile_setup.spec_${specKey}`).toLowerCase();
        const loc = (d.location || d.city || "").toLowerCase();

        // Check if doctor matches the selected city
        const cityMatch = !externalCity || externalCity === "All" || loc.includes(externalCity.toLowerCase());
        if (!cityMatch) return null;

        if (!query) return { ...d, score: 1 };

        // Calculate relevance score based on keywords
        const matchesAll = keywords.every(kw => {
          if (name.includes(kw)) { score += 10; return true; }
          if (spec.includes(kw)) { score += 5; return true; }
          if (loc.includes(kw)) { score += 2; return true; }
          return false;
        });

        return matchesAll ? { ...d, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [debouncedSearchQuery, externalCity, doctors, t]);

  const filteredBookings = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    return myBookings.filter(app =>
      (app.doctorName || "").toLowerCase().includes(query) ||
      (app.bookingId || "").toLowerCase().includes(query) ||
      (app.specialty || "").toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, myBookings]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-700 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight text-left">Appointments</h2>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button onClick={() => setActiveSubTab("find")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'find' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Find Doctors</button>
            <button onClick={() => setActiveSubTab("my")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'my' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>My Bookings</button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder={activeSubTab === 'find' ? "Search doctor or specialty..." : "Search by doctor or Booking ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 outline-none transition-all font-bold text-sm"
            />
            <button onClick={toggleListening} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-100'}`}>
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "find" ? (
        !externalCity ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-[40px] border-2 border-dashed border-gray-100 animate-in fade-in zoom-in duration-500 text-center col-span-full">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6 animate-pulse"><MapPin size={40} /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Location Required</h3>
            <p className="text-gray-500 font-bold max-w-sm mb-8 mx-auto">Please select your city to discover the best doctors and specialists near you.</p>
            <button onClick={onDetectLocation} disabled={isLocating} className={`flex items-center gap-2 px-6 py-3 ${isLocating ? 'bg-gray-100 text-gray-400' : 'bg-red-600 text-white shadow-xl shadow-red-900/10'} rounded-2xl font-black text-sm transition-all`}>
              {isLocating ? <><RefreshCw size={16} className="animate-spin" /> Locating...</> : <><MapPin size={16} /> Detect Location</>}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredDoctors.map(doc => <FindDoctorCard key={doc.id} doc={doc} t={t} onBook={handleBookClick} />)}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Calendar size={32} /></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">No Bookings Found</p>
            </div>
          ) : filteredBookings.map(app => (
            <MyBookingCard key={app.id} app={app} onClick={handleViewBooking} onCancel={handleCancelAppointment} onRate={(id) => { setRatingAppointmentId(id); setRatingValue(0); setIsRatingModalOpen(true); }} />
          ))}
        </div>
      )}

      {/* RENDER MODALS */}
      <RatingModal 
        isOpen={isRatingModalOpen} 
        onClose={() => setIsRatingModalOpen(false)}
        ratingValue={ratingValue}
        setRatingValue={setRatingValue}
        hoverRating={hoverRating}
        setHoverRating={setHoverRating}
        onSubmit={submitRating}
      />

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingStep={bookingStep}
        selectedDoctor={selectedDoctor}
        consultationMode={consultationMode}
        setConsultationMode={setConsultationMode}
        availableDates={availableDates}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        doctorSlots={doctorSlots}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        isProcessing={isProcessing}
        confirmBooking={confirmBooking}
        currentBookingId={currentBookingId}
      />
    </div>
  );
};

export default PatientAppointment;
