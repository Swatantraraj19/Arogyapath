
import React, { useState } from "react";
import { BrainCircuit, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

const SymptomChecker = ({ t }) => {
  const [symptomText, setSymptomText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const handleAnalyzeSymptoms = () => {
    if (!symptomText.trim()) return toast.error("Please describe your symptoms");
    setIsAnalyzing(true);
    
    // 🧬 SIMULATING AI ANALYSIS
    setTimeout(() => {
      setIsAnalyzing(false);
      setAssessment({
        severity: "medium",
        suggestion: "Your symptoms suggest a possible mild viral infection. Please rest and stay hydrated. Consult a doctor if fever persists.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 🧠 AI INPUT HERO */}
      <div className="bg-gradient-to-br from-indigo-600 to-emerald-800 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
            <BrainCircuit size={14} /> AI Powered Assessment
          </div>
          <h3 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">AI Symptom Checker</h3>
          
          <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 space-y-6 max-w-4xl">
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="e.g. I have a persistent cough and mild fever..."
              className="w-full bg-transparent border-none text-white placeholder:text-white/40 text-xl font-medium focus:ring-0 min-h-[120px] resize-none"
            />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm font-medium italic">Describe your symptoms in detail for better accuracy.</p>
              <button
                onClick={handleAnalyzeSymptoms}
                disabled={isAnalyzing}
                className={`
                  w-full md:w-auto px-10 py-4 rounded-[1.25rem] font-black text-lg transition-all flex items-center justify-center gap-3
                  ${isAnalyzing ? 'bg-white/20 cursor-not-allowed' : 'bg-white text-indigo-900 hover:shadow-xl active:scale-95'}
                `}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* 📋 ASSESSMENT RESULT */}
      {assessment && (
        <div className="bg-white rounded-[3rem] p-10 border border-emerald-100 shadow-xl shadow-emerald-900/5 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-start gap-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${assessment.severity === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <MessageSquare size={32} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-black text-gray-900">Preliminary Assessment</h4>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${assessment.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {assessment.severity} Severity
                </span>
              </div>
              <p className="text-gray-500 text-lg leading-relaxed font-medium">
                {assessment.suggestion}
              </p>
              <div className="pt-4">
                <button className="text-emerald-600 font-black flex items-center gap-2 hover:underline">
                  Talk to a Doctor about this result →
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
