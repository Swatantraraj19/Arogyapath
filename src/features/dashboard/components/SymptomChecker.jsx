import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, MessageSquare, Paperclip, Image as ImageIcon, X, FileText, Activity, AlertCircle, Sparkles, ChevronRight, Mic, MicOff } from "lucide-react";
import { toast } from "react-hot-toast";

const SymptomChecker = ({ t, setActiveTab }) => {
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
      toast.success("Stopped listening");
    } else {
      setSymptomText(""); // Clear previous text for a fresh start
      recognitionRef.current.start();
      setIsListening(true);
      toast.success("Listening... Please speak now.");
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
        title: "Assessment Summary",
        suggestion: "Our system identifies patterns consistent with a seasonal reaction. Your description suggest localized inflammation.",
        precautions: ["Hydrate", "Rest", "Monitor"],
        recommendation: "Book a consultation with a General Physician."
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
              <Sparkles size={12} className="text-emerald-300" /> Smart Diagnostic Suite
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] font-bold">
              <AlertCircle size={12} /> Info only
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Smart Symptom Checker</h3>
            <p className="text-white/70 text-base md:text-lg font-medium max-w-xl">
              Get instant medical insights by describing your condition. Our smart assistant helps you understand your symptoms in seconds.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-2xl rounded-[1.75rem] p-6 border border-white/20 space-y-4 relative">
            {/* 🎙️ LISTENING INDICATOR */}
            {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-[10px] font-black animate-pulse border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                Listening...
              </div>
            )}

            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={isListening ? "I'm listening... please speak." : "e.g. I have a persistent cough and mild fever..."}
              className="w-full bg-transparent border-none text-white placeholder:text-white/30 text-xl font-bold focus:ring-0 focus:outline-none min-h-[120px] resize-none"
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
                  {isListening ? "Stop Listening" : "Speak Symptoms"}
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-black text-xs cursor-pointer border border-white/10"
                >
                  <Paperclip size={16} className="text-emerald-300" />
                  Files
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-black text-xs cursor-pointer border border-white/10"
                >
                  <ImageIcon size={16} className="text-blue-300" />
                  Photos
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
                {isAnalyzing ? "Analyzing..." : "Analyze Now"}
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
                    {assessment.severity} Priority
                  </span>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium">"{assessment.suggestion}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <h5 className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Precautions</h5>
                  <ul className="space-y-2">
                    {assessment.precautions.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                  <h5 className="font-black text-emerald-700 uppercase tracking-widest text-[9px] mb-2">Recommendation</h5>
                  <p className="text-emerald-900 font-bold text-base leading-relaxed">{assessment.recommendation}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setActiveTab("appointments")}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-base hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-gray-200 cursor-pointer w-full sm:w-auto justify-center"
                >
                  Book Appointment Now
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
