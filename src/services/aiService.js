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
    specialty: { en: "Cardiologist", hi: "हृदय रोग विशेषज्ञ" },
    possibleIssues: { en: ["Cardiac evaluation required"], hi: ["हृदय मूल्यांकन की आवश्यकता है"] },
    precautions: { en: ["Rest immediately", "Avoid exertion", "Seek emergency help"], hi: ["तुरंत आराम करें", "परिश्रम से बचें", "आपातकालीन सहायता लें"] },
    baseSeverity: "high"
  },
  {
    id: "dermatology",
    keywords: ["skin", "rash", "itch", "pimple", "acne", "khujli"],
    aliases: ["skin allergy", "red spots", "itching", "skin problem"],
    specialty: { en: "Dermatologist", hi: "त्वचा विशेषज्ञ" },
    possibleIssues: { en: ["Dermatological assessment suggested"], hi: ["त्वचा मूल्यांकन का सुझाव"] },
    precautions: { en: ["Avoid scratching", "Keep area clean", "Apply soothing lotion"], hi: ["खुजली न करें", "क्षेत्र को साफ रखें", "सुखदायक लोशन लगाएं"] },
    baseSeverity: "low"
  },
  {
    id: "neurology",
    keywords: ["headache", "migraine", "dizzy", "nerve", "sar dard"],
    aliases: ["blurred vision", "fainting", "head pain", "chakkar"],
    specialty: { en: "Neurologist", hi: "न्यूरोलॉजिस्ट" },
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
      } catch (e) { console.warn("Cooldown skipped"); }
    }

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
        
        if (confidence >= MIN_CONFIDENCE || (isEmergency && rule.id === "cardiology")) {
          matches.push({
            ...rule,
            confidence: Math.round(confidence),
            displaySpecialty: rule.specialty[language] || rule.specialty['en'],
            displayPrecautions: rule.precautions[language] || rule.precautions['en'],
            displayIssues: rule.possibleIssues[language] || rule.possibleIssues['en']
          });
        }
      }
    });

    matches.sort((a, b) => b.confidence - a.confidence);
    const result = formatFinalResponse(matches, isEmergency, language);

    if (userId) {
      try { await saveCheckHistory(userId, symptoms, result); } catch (e) { console.warn("Save failed"); }
    }

    return result;

  } catch (error) {
    console.error("Engine Error:", error);
    throw error;
  }
};

const formatFinalResponse = (matches, isEmergency, language) => {
  if (matches.length === 0) {
    return {
      suggestion: language === 'hi' ? "कृपया सामान्य चिकित्सक से सलाह लें।" : "Please consult a General Physician.",
      primarySpecialist: language === 'hi' ? "सामान्य चिकित्सक" : "General Physician",
      secondarySpecialists: [],
      precautions: language === 'hi' ? ["आराम करें", "पर्याप्त पानी पिएं"] : ["Rest well", "Stay hydrated"],
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
    suggestion: language === 'hi' 
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
