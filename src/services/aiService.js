import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from "firebase/firestore";

/**
 * 🏥 ArogyaPath Ultimate Guidance Engine (v5.2)
 * Bug Fix: Added precautions data and order-independent token matching.
 */

const MIN_CONFIDENCE = 20; 
const MAX_CHARS = 500;
const COOLDOWN_MINUTES = 1;

const STEM_WHITELIST = ["diabetes", "gas", "measles", "arthritis", "stasis", "psoriasis"];

const HINGLISH_MAP = {
  "seene": "chest", "dard": "pain", "saans": "breathing", "sar": "head", 
  "khujli": "itch", "pet": "stomach", "bukhaar": "fever", "aankh": "eye",
  "daant": "tooth", "haddi": "bone", "chakkar": "dizzy"
};

const SEVERITY_MODIFIERS = {
  high: ["severe", "sudden", "unbearable", "intense", "bahut zyada", "tez", "emergency"],
  low: ["mild", "slight", "minor", "thoda", "kabhi kabhi"]
};

const EMERGENCY_KEYWORDS = [
  "unconscious", "seizure", "blood vomiting", "heavy bleeding", 
  "heart attack", "cannot breathe", "shortness of breath", "chest pain"
];

const SYMPTOM_RULES = [
  {
    id: "cardiology",
    keywords: ["heart", "chest pain", "palpitation", "arrhythmia", "seene me dard"],
    aliases: ["chest tightness", "pain in chest", "breathing issue"],
    specialty: { en: "Cardiologist", hi: "Cardiologist" },
    possibleIssues: { en: ["Cardiac evaluation required"], hi: ["हृदय मूल्यांकन की आवश्यकता है"] },
    precautions: { en: ["Rest immediately", "Avoid exertion", "Seek emergency help"], hi: ["तुरंत आराम करें", "परिश्रम से बचें", "आपातकालीन सहायता लें"] },
    baseSeverity: "high"
  },
  {
    id: "dermatology",
    keywords: ["skin", "rash", "itch", "pimple", "acne", "khujli"],
    aliases: ["skin allergy", "red spots", "itching", "skin problem"],
    specialty: { en: "Dermatologist", hi: "Dermatologist" },
    possibleIssues: { en: ["Dermatological assessment suggested"], hi: ["त्वचा मूल्यांकन का सुझाव"] },
    precautions: { en: ["Avoid scratching", "Keep area clean", "Apply soothing lotion"], hi: ["खुजली न करें", "क्षेत्र को साफ रखें", "सुखदायक लोशन लगाएं"] },
    baseSeverity: "low"
  },
  {
    id: "neurology",
    keywords: ["headache", "migraine", "dizzy", "nerve", "sar dard"],
    aliases: ["blurred vision", "fainting", "head pain", "chakkar"],
    specialty: { en: "Neurologist", hi: "Neurologist" },
    possibleIssues: { en: ["Neurological assessment needed"], hi: ["न्यूरोलॉजिकल मूल्यांकन की आवश्यकता"] },
    precautions: { en: ["Rest in dark room", "Hydrate well", "Monitor symptoms"], hi: ["अंधेरे कमरे में आराम करें", "अच्छी तरह से हाइड्रेट रहें", "लक्षणों की निगरानी करें"] },
    baseSeverity: "medium"
  }
];

const normalizeWord = (word) => {
  if (!word) return "";
  let w = word.toLowerCase().trim();
  w = HINGLISH_MAP[w] || w;
  if (STEM_WHITELIST.includes(w)) return w;
  return w.replace(/ing$|s$|es$/i, '');
};

// 🏠 OLD HARDCODED RULES SYSTEM (FALLBACK SAFETY NET)
const analyzeSymptomsLocal = (symptoms, language = "en") => {
  const rawInput = symptoms.toLowerCase();
  const tokens = rawInput.split(/[\s,.;?]+/).map(normalizeWord).filter(t => t.length > 1);

  const isEmergency = EMERGENCY_KEYWORDS.some(ek => rawInput.includes(ek));
  let matches = [];

  SYMPTOM_RULES.forEach(rule => {
    let score = 0;
    let matchedCount = 0;

    const allTerms = [...rule.keywords.map(k => ({ t: k, w: 5 })), ...rule.aliases.map(a => ({ t: a, w: 2 }))];

    allTerms.forEach(term => {
      const termTokens = term.t.split(" ").map(normalizeWord).filter(t => t.length > 1);
      const isMatch = termTokens.every(tt => tokens.includes(tt));
      if (isMatch) {
        score += term.w;
        matchedCount++;
      }
    });

    if (matchedCount > 0) {
      if (isEmergency && rule.id === "cardiology" && rawInput.includes("chest")) score += 10;
      const confidence = Math.min((score / 10) * 100, 100);
      
      const isHindi = language && language.startsWith('hi');
      
      if (confidence >= MIN_CONFIDENCE || (isEmergency && rule.id === "cardiology")) {
        matches.push({
          ...rule,
          confidence: Math.round(confidence),
          displaySpecialty: (isHindi && rule.specialty['hi']) ? rule.specialty['hi'] : rule.specialty['en'],
          displayPrecautions: (isHindi && rule.precautions['hi']) ? rule.precautions['hi'] : rule.precautions['en'],
          displayIssues: (isHindi && rule.possibleIssues['hi']) ? rule.possibleIssues['hi'] : rule.possibleIssues['en']
        });
      }
    }
  });

  matches.sort((a, b) => b.confidence - a.confidence);
  return formatFinalResponse(matches, isEmergency, language);
};

export const analyzeSymptoms = async (symptoms, userId = null, language = "en") => {
  try {
    if (symptoms.length > MAX_CHARS) throw new Error("Input too long");

    if (userId) {
      try {
        const recentCheck = await getRecentCheck(userId);
        if (recentCheck) {
          const diff = (new Date() - recentCheck.createdAt.toDate()) / (1000 * 60);
          if (diff < COOLDOWN_MINUTES) throw new Error(`Wait ${Math.ceil(COOLDOWN_MINUTES - diff)}m.`);
        }
      } catch (error) { console.warn("Cooldown skipped:", error); }
    }

    let result;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API Key missing, using local fallback");
    }

    try {
      // 🚀 CALL GEMINI API
      const isHindi = language && language.startsWith('hi');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze these medical symptoms in ${isHindi ? 'Hindi' : 'English'}.
Symptoms description: "${symptoms}"

You must output ONLY a valid JSON object matching the schema below. Do not wrap it in markdown block, do not include any backticks or explanatory text. Just the raw JSON.

JSON Schema:
{
  "suggestion": "Brief doctor consultation advice statement in the target language (e.g. Primary Guidance: Dentist consultation recommended)",
  "primarySpecialist": "The single most appropriate doctor specialty in English (e.g. Cardiologist, Dentist, Dermatologist, Pediatrician, Neurologist, Orthopedist, General Physician, Gynecologist, Ophthalmologist)",
  "secondarySpecialists": ["Up to 2 other alternative doctor specialties in English"],
  "precautions": ["List of 2-3 temporary steps or precautions in the target language"],
  "possibleIssues": ["List of 1-2 potential common causes or issues in the target language"],
  "confidence": number (an integer between 20 and 100 based on your confidence),
  "emergency": boolean (true ONLY if severe medical emergency signs like chest pain, heavy bleeding, unconsciousness, severe breathing problems),
  "disclaimer": "Not a diagnosis. Seek professional medical advice."
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP status: ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Empty text returned from Gemini API");

      result = JSON.parse(text);
      result.type = "AI Smart Guidance";
    } catch (apiError) {
      console.warn("Gemini API failed, using local rule-engine fallback:", apiError);
      result = analyzeSymptomsLocal(symptoms, language);
      result.type = "Local Fallback Guidance";
    }

    if (userId) {
      try { await saveCheckHistory(userId, symptoms, result); } catch (error) { console.warn("Save failed:", error); }
    }

    return result;

  } catch (error) {
    console.error("Engine Error:", error);
    throw error;
  }
};

const formatFinalResponse = (matches, isEmergency, language) => {
  const isHindi = language && language.startsWith('hi');
  
  if (matches.length === 0) {
    return {
      suggestion: isHindi ? "कृपया सामान्य चिकित्सक से सलाह लें।" : "Please consult a General Physician.",
      primarySpecialist: "General Physician",
      secondarySpecialists: [],
      precautions: isHindi ? ["आराम करें", "पर्याप्त पानी पिएं"] : ["Rest well", "Stay hydrated"],
      possibleIssues: [],
      confidence: 0,
      emergency: isEmergency,
      type: "Guidance",
      disclaimer: "Legal Disclaimer: Not a diagnosis."
    };
  }

  const primary = matches[0];
  const secondary = matches.slice(1, 3).map(m => m.displaySpecialty);

  return {
    suggestion: isHindi 
      ? `प्राथमिक सुझाव: ${primary.displaySpecialty} मूल्यांकन।`
      : `Primary Guidance: ${primary.displaySpecialty} evaluation recommended.`,
    primarySpecialist: primary.displaySpecialty,
    secondarySpecialists: secondary,
    precautions: primary.displayPrecautions,
    possibleIssues: [...new Set(matches.flatMap(m => m.displayIssues))],
    confidence: primary.confidence,
    emergency: isEmergency,
    type: "Smart Guidance",
    disclaimer: "Not a diagnosis. Seek professional advice."
  };
};

const getRecentCheck = async (userId) => {
  const q = query(collection(db, "symptomChecks"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};

const saveCheckHistory = async (userId, symptoms, result) => {
  await addDoc(collection(db, "symptomChecks"), { userId, symptoms, result, createdAt: serverTimestamp() });
};
