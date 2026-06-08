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
  const [bookingStatusTab, setBookingStatusTab] = useState("upcoming"); // 🕒 Track Upcoming, Completed, Cancelled
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

  // 👨‍👩‍👧 Family Member Booking States
  const [bookingFor, setBookingFor] = useState("myself");
  const [familyMember, setFamilyMember] = useState({ name: "", age: "", gender: "Male", phone: "" });

  // ⭐ Rating States
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingAppointmentId, setRatingAppointmentId] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState([]);
  
  // 📑 Pagination States
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const recognitionRef = useRef(null);

  // 📥 Fetch Doctors from Firestore (Restored Original Logic)
  useEffect(() => {
    const q = query(collection(db, "doctors"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(docs);
    });
    return () => unsubscribe();
  }, []);

  // 📥 Fetch Patient's Real-time Upcoming Bookings
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid),
      where("status", "==", "upcoming")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const upcomingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyBookings(prev => {
        const historyData = prev.filter(b => b.status !== "upcoming");
        return [...upcomingData, ...historyData];
      });
    }, (error) => {
      console.error("Error fetching upcoming bookings:", error);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 📥 Fetch History with Pagination
  const fetchHistory = useCallback(async (isLoadMore = false) => {
    if (!currentUser || (isLoadMore && !lastVisible)) return;

    setIsMoreLoading(true);
    try {
      const { getDocs, limit, startAfter, orderBy } = await import("firebase/firestore");
      
      let q = query(
        collection(db, "appointments"),
        where("patientId", "==", currentUser.uid),
        where("status", "==", bookingStatusTab),
        orderBy("rawDate", "desc"),
        limit(10)
      );

      if (isLoadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 10);

      setMyBookings(prev => {
        const upcomingData = prev.filter(b => b.status === "upcoming");
        const otherHistory = isLoadMore 
          ? prev.filter(b => b.status !== "upcoming") 
          : prev.filter(b => b.status !== "upcoming" && b.status !== bookingStatusTab);
        return [...upcomingData, ...otherHistory, ...newHistory];
      });
    } catch (error) {
      console.error("Error fetching patient history:", error);
      toast.error(t("patient_appointments.failed_load_history"));
    } finally {
      setIsMoreLoading(false);
    }
  }, [currentUser, bookingStatusTab, lastVisible, t]);

  // 🔄 Trigger fetch when tab changes
  useEffect(() => {
    if (bookingStatusTab !== "upcoming" && activeSubTab === "my") {
      setLastVisible(null);
      setHasMore(true);
      fetchHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingStatusTab, activeSubTab]);

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
    if (!recognitionRef.current) return toast.error(t("symptom_checker.not_supported"));
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, t]);

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
    setBookingStep(0);  // 👨‍👩‍👧 Start at Step 0: Who is this for?
    setBookingFor("myself"); // Reset to default
    setFamilyMember({ name: "", age: "", gender: "Male", phone: "" }); // Reset form
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

  const confirmBooking = async (action) => {
    // 👨‍👩‍👧 Step 0 → Step 1: Just move forward, no Firestore call yet
    if (action === "proceed_to_step1") {
      setBookingStep(1);
      return;
    }

    // Step 1 → Confirm: actual Firestore booking
    if (!currentUser) return toast.error(t("auth.session_not_found"));
    if (!selectedSlot) return toast.error(t("patient_appointments.select_time_slot"));
    setIsProcessing(true);
    try {
      const lockId = `${selectedDoctor.id}_${selectedDate}_${selectedSlot.replace(/\s+/g, '')}`;
      const lockRef = doc(db, "slot_locks", lockId);
      const appointmentRef = doc(collection(db, "appointments"));
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let generatedId = '';
      for (let i = 0; i < 5; i++) {
        generatedId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await runTransaction(db, async (transaction) => {
        // 🛡️ Fetch Patient (account owner) Data within transaction
        const pRef = doc(db, "patients", currentUser.uid);
        const pSnap = await transaction.get(pRef);
        const pData = pSnap.exists() ? pSnap.data() : {};

        const lockSnap = await transaction.get(lockRef);
        if (lockSnap.exists()) {
          throw new Error("This slot has just been booked by someone else!");
        }

        // 👨‍👩‍👧 Use family member data OR account owner data
        const isFamily = bookingFor === "family";
        const appointmentData = {
          bookingId: generatedId,
          patientId: currentUser.uid,  // Always the account owner's UID
          patientName: isFamily ? familyMember.name : (pData.fullName || currentUser.displayName || "Patient"),
          patientAge: isFamily ? familyMember.age : (pData.age || "N/A"),
          patientGender: isFamily ? familyMember.gender : (pData.gender || "N/A"),
          patientPhone: isFamily ? familyMember.phone : (pData.phone || currentUser.phoneNumber || "N/A"),
          // Family member extra fields (only set when booking for family)
          ...(isFamily && {
            isForFamily: true,
            bookedBy: pData.fullName || currentUser.displayName || "Account Owner",
          }),
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
      toast.success(t("patient_appointments.appointment_confirmed"));
    } catch (error) {
      console.error("Booking Transaction Error:", error);
      toast.error(error.message || t("patient_appointments.failed_book"), { icon: '🚫' });
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
    if (window.confirm(t("patient_appointments.are_you_sure"))) {
      try {
        const { deleteDoc, getDoc } = await import("firebase/firestore");
        const appRef = doc(db, "appointments", appId);
        const appSnap = await getDoc(appRef);
        
        if (appSnap.exists()) {
          const appData = appSnap.data();
          // 🛡️ Construct lockId: doctorId_rawDate_time
          const lockId = `${appData.doctorId}_${appData.rawDate}_${appData.time.replace(/\s+/g, '')}`;
          await deleteDoc(doc(db, "slot_locks", lockId));
        }

        await setDoc(appRef, { status: 'cancelled' }, { merge: true });
        toast.success(t("patient_appointments.appointment_cancelled"));
      } catch (error) {
        console.error("Cancellation Error:", error);
        toast.error(t("patient_appointments.failed_cancel"));
      }
    }
  }, [t]);

  const submitRating = useCallback(async () => {
    if (ratingValue === 0) return toast.error(t("patient_appointments.select_stars"));
    try {
      const { doc, runTransaction } = await import("firebase/firestore");
      
      await runTransaction(db, async (transaction) => {
        const appRef = doc(db, "appointments", ratingAppointmentId);
        const appSnap = await transaction.get(appRef);
        if (!appSnap.exists()) throw new Error("Appointment not found");
        
        const appData = appSnap.data();
        const docRef = doc(db, "doctors", appData.doctorId);
        const docSnap = await transaction.get(docRef);
        
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const oldPoints = Number(docData.totalRatingPoints || 0);
          const oldCount = Number(docData.reviewCount || 0);
          
          const newPoints = oldPoints + ratingValue;
          const newCount = oldCount + 1;
          const newAvg = (newPoints / newCount).toFixed(1);
          
          transaction.update(docRef, {
            totalRatingPoints: newPoints,
            reviewCount: newCount,
            rating: newAvg
          });
        }
        
        transaction.update(appRef, {
          hasRated: true,
          rating: ratingValue
        });
      });

      setIsRatingModalOpen(false);
      toast.success(t("patient_appointments.feedback_success"), { icon: '⭐' });
    } catch (error) {
      console.error("Rating Error:", error);
      toast.error(t("patient_appointments.failed_submit_rating"));
    }
  }, [ratingValue, ratingAppointmentId, t]);

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
    
    // 🛠️ Helper for 24h conversion (needed for sorting)
    const to24h = (timeStr) => {
      if (!timeStr) return "00:00";
      const parts = timeStr.split(' ');
      if (parts.length < 2) return "00:00";
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    let result = myBookings.filter(app => {
      // 1. 🔍 Search Filtering
      const matchesSearch = (app.doctorName || "").toLowerCase().includes(query) ||
                            (app.bookingId || "").toLowerCase().includes(query) ||
                            (app.specialty || "").toLowerCase().includes(query);
      
      if (!matchesSearch) return false;

      // 2. 📑 Tab Filtering
      if (bookingStatusTab === "upcoming") {
        return app.status === "upcoming";
      } else if (bookingStatusTab === "completed") {
        return app.status === "completed";
      } else if (bookingStatusTab === "cancelled") {
        return app.status === "cancelled";
      }
      return true;
    });

    // 🔄 Dynamic Sorting: Ascending for Upcoming, Descending for others
    result.sort((a, b) => {
      const dateA = a.rawDate || a.date || "";
      const dateB = b.rawDate || b.date || "";
      const dateDiff = dateA.localeCompare(dateB);

      const multiplier = bookingStatusTab === "upcoming" ? 1 : -1;

      if (dateDiff !== 0) return dateDiff * multiplier;
      
      // Time comparison if dates are same
      return to24h(a.time).localeCompare(to24h(b.time)) * multiplier;
    });

    return result;
  }, [debouncedSearchQuery, myBookings, bookingStatusTab]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-700 pb-20">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight text-left">{t("dashboard.appointments")}</h2>
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button onClick={() => setActiveSubTab("find")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'find' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t("patient_appointments.find_doctors")}</button>
            <button onClick={() => setActiveSubTab("my")} className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'my' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t("patient_appointments.my_bookings")}</button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder={activeSubTab === 'find' ? t("patient_appointments.search_doctor") : t("patient_appointments.search_booking")}
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
      
      {/* 📑 Status Tabs for My Bookings */}
      {activeSubTab === "my" && (
        <div className="flex w-full overflow-x-auto gap-1.5 md:gap-2 px-1 pb-1 animate-in fade-in slide-in-from-left-4 duration-500 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {["upcoming", "completed", "cancelled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setBookingStatusTab(tab)}
              className={`flex-1 whitespace-nowrap px-2 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                bookingStatusTab === tab
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                  : "bg-white text-gray-400 border border-gray-100 hover:border-emerald-200 hover:text-gray-600"
              }`}
            >
              {t("patient_appointments." + tab)}
            </button>
          ))}
        </div>
      )}

      {activeSubTab === "find" ? (
        !externalCity ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-[40px] border-2 border-dashed border-gray-100 animate-in fade-in zoom-in duration-500 text-center col-span-full">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6 animate-pulse"><MapPin size={40} /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{t("patient_appointments.location_required")}</h3>
            <p className="text-gray-500 font-bold max-w-sm mb-8 mx-auto">{t("patient_appointments.location_desc")}</p>
            <button onClick={onDetectLocation} disabled={isLocating} className={`flex items-center gap-2 px-6 py-3 ${isLocating ? 'bg-gray-100 text-gray-400' : 'bg-red-600 text-white shadow-xl shadow-red-900/10'} rounded-2xl font-black text-sm transition-all`}>
              {isLocating ? <><RefreshCw size={16} className="animate-spin" /> {t("patient_appointments.locating")}</> : <><MapPin size={16} /> {t("patient_appointments.detect_location")}</>}
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
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t("patient_appointments.no_bookings_found")}</p>
            </div>
          ) : filteredBookings.map(app => (
            <MyBookingCard key={app.id} app={app} onClick={handleViewBooking} onCancel={handleCancelAppointment} onRate={(id) => { setRatingAppointmentId(id); setRatingValue(0); setIsRatingModalOpen(true); }} t={t} />
          ))}
        </div>
      )}

      {/* 📑 LOAD MORE BUTTON FOR PATIENTS */}
      {activeSubTab === "my" && bookingStatusTab !== "upcoming" && hasMore && (
        <div className="flex justify-center py-10 animate-in fade-in duration-500">
          <button
            onClick={() => fetchHistory(true)}
            disabled={isMoreLoading}
            className={`group flex items-center gap-3 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              isMoreLoading 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-emerald-600 border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {isMoreLoading ? (
              <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
            ) : (
              <RefreshCw size={14} className="group-hover:rotate-180 transition-all duration-500" />
            )}
            {isMoreLoading ? t("patient_appointments.loading_history") : t("patient_appointments.load_more")}
          </button>
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
        t={t}
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
        t={t}
        bookingFor={bookingFor}
        setBookingFor={setBookingFor}
        familyMember={familyMember}
        setFamilyMember={setFamilyMember}
      />
    </div>
  );
};

export default PatientAppointment;
