
import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, MessageSquare, Paperclip, Image as ImageIcon, X, FileText, Activity, AlertCircle, Sparkles, ChevronRight, Mic, MicOff, Stethoscope, Search } from "lucide-react";
import { toast } from "react-hot-toast";

const SymptomChecker = ({ t, setActiveTab, externalCity = "Patna" }) => {
  const doctors = [
    { id: 1, name: "Dr. Sameer Sharma", specialty: "Cardiologist", experience: "12 yrs", rating: 4.8, reviews: 124, clinicFee: "₹800", onlineFee: "₹600", clinicName: "Arogya Heart Care", address: "12/A, Medical Square, Lucknow", city: "Lucknow", phone: "+91 98765 43210" },
    { id: 2, name: "Dr. Anjali Gupta", specialty: "Dermatologist", experience: "8 yrs", rating: 4.9, reviews: 89, clinicFee: "₹1000", onlineFee: "₹750", clinicName: "Glow Skin Clinic", address: "45, Fashion Street, Delhi", city: "Delhi", phone: "+91 91234 56789" },
    { id: 3, name: "Dr. Rajesh Varma", specialty: "General Physician", experience: "15 yrs", rating: 4.7, reviews: 210, clinicFee: "₹500", onlineFee: "₹400", clinicName: "Patna Central Clinic", address: "Boring Road, Patna", city: "Patna", phone: "+91 88888 77777" },
    { id: 4, name: "Dr. Priya Iyer", specialty: "Pediatrician", experience: "10 yrs", rating: 4.9, reviews: 156, clinicFee: "₹700", onlineFee: "₹550", clinicName: "Arogya Kids Patna", address: "Kankarbagh Main Rd, Patna", city: "Patna", phone: "+91 77665 54433" },
    { id: 5, name: "Dr. Kabir Singh", specialty: "Orthopedic", experience: "14 yrs", rating: 4.6, reviews: 340, clinicFee: "₹900", onlineFee: "₹650", clinicName: "Bone & Joint Centre", address: "MG Road, Indiranagar, Bangalore", city: "Bangalore", phone: "+91 99009 90099" },
  ];
  const [symptomText, setSymptomText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // 🎤 Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join("");
        setSymptomText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error("Speech recognition failed. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return toast.error("Speech recognition is not supported in this browser.");
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success(t('symptom_checker.stop_listening'));
    } else {
      setSymptomText(""); 
      recognitionRef.current.start();
      setIsListening(true);
      toast.success(t('symptom_checker.listening'));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleAnalyzeSymptoms = () => {
    if (!symptomText.trim() && attachments.length === 0) {
      return toast.error("Please describe your symptoms or upload a report");
    }
    if (isListening) recognitionRef.current?.stop();
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAssessment({
        severity: "medium",
        title: t('symptom_checker.assessment_summary'),
        suggestion: "Our system identifies patterns consistent with a seasonal reaction. Your description suggest localized inflammation.",
        precautions: ["Hydrate", "Rest", "Monitor"],
        recommendation: "Book a consultation with a General Physician.",
        suggestedSpecialty: "General Physician"
      });
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      
      {/* 🚀 COMPACT VIBRANT HERO */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-600 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-indigo-500/10">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-[9px] font-black uppercase tracking-widest border border-white/30">
              <Sparkles size={12} className="text-emerald-300" /> {t('symptom_checker.multimodal_active')}
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] font-bold">
              <AlertCircle size={12} /> {t('symptom_checker.info_only')}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">{t('symptom_checker.title')}</h3>
            <p className="text-white/70 text-base md:text-lg font-medium max-w-xl">
              {t('symptom_checker.subtitle')}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-2xl rounded-[1.75rem] p-6 border border-white/20 space-y-4 relative">
            {/* 🎙️ LISTENING INDICATOR */}
            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-[10px] font-black animate-pulse border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                {t('symptom_checker.listening')}
              </div>
            )}

            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={isListening ? t('symptom_checker.listening_placeholder') : t('symptom_checker.placeholder')}
              className="w-full bg-transparent border-none text-white placeholder:text-white/30 text-xl font-bold focus:ring-0 focus:outline-none min-h-[100px] resize-none"
            />

            {/* 📁 ATTACHMENTS PREVIEW */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4">
                {attachments.map((attr) => (
                  <div key={attr.id} className="relative group animate-in zoom-in duration-300">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/30 bg-white/10 shadow-lg">
                      {attr.preview ? (
                        <img src={attr.preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                          <FileText size={16} className="text-emerald-300" />
                          <span className="text-[7px] mt-0.5 line-clamp-1 font-bold">{attr.name}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeAttachment(attr.id)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <X size={8} strokeWidth={4} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  multiple 
                  accept="image/*,.pdf"
                />
                <button 
                  onClick={toggleListening}
                  className={`
                    flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all font-black text-xs cursor-pointer border
                    ${isListening ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/40' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}
                  `}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} className="text-red-400" />}
                  {isListening ? t('symptom_checker.stop_listening') : t('symptom_checker.speak_symptoms')}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-black text-xs cursor-pointer border border-white/10"
                >
                  <Paperclip size={16} className="text-emerald-300" />
                  {t('symptom_checker.upload_file')}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-black text-xs cursor-pointer border border-white/10"
                >
                  <ImageIcon size={16} className="text-blue-300" />
                  {t('symptom_checker.upload_image')}
                </button>
              </div>

              <button
                onClick={handleAnalyzeSymptoms}
                disabled={isAnalyzing}
                className={`
                  w-full md:w-auto px-8 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2
                  ${isAnalyzing ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-white text-indigo-700 hover:scale-105 active:scale-95 shadow-lg'}
                `}
              >
                {isAnalyzing ? (
                  <Activity size={20} className="animate-pulse" />
                ) : (
                  <BrainCircuit size={20} />
                )}
                {isAnalyzing ? t('symptom_checker.analyzing') : t('symptom_checker.analyze')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-[60px]"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-[60px]"></div>
      </div>

      {/* 📋 COMPACT ASSESSMENT RESULT */}
      {assessment && (
        <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-emerald-50 shadow-xl shadow-emerald-900/5 animate-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${assessment.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Activity size={28} />
            </div>
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-2xl font-black text-gray-900 tracking-tight">{assessment.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${assessment.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {assessment.severity === 'medium' ? t('symptom_checker.severity_medium') : t('symptom_checker.severity_low')}
                  </span>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">"{assessment.suggestion}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h5 className="font-black text-gray-400 uppercase tracking-widest text-[9px]">{t('symptom_checker.precautions')}</h5>
                  <ul className="space-y-2">
                    {assessment.precautions.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  {/* OPTION 1: AI SUGGESTION */}
                  <button 
                    onClick={() => setActiveTab("appointments", assessment.suggestedSpecialty)}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-[0.98] text-center h-full"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Recommended</span>
                    <h5 className="text-base font-black leading-tight mb-4">Consult {assessment.suggestedSpecialty}</h5>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Book Now <ChevronRight size={12} />
                    </div>
                  </button>

                  {/* OPTION 2: MANUAL BOOKING */}
                  <button 
                    onClick={() => setActiveTab("appointments", "")}
                    className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-50 text-gray-900 rounded-[1.5rem] hover:border-emerald-200 hover:shadow-md transition-all active:scale-[0.98] text-center h-full"
                  >
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Manual Path</span>
                    <h5 className="text-base font-black leading-tight mb-4">Search All Doctors Manually</h5>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Book Now <ChevronRight size={12} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
