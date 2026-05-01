import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const LanguageSelection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // 🧠 ROLE-BASED SWITCH: Initializing with "patient" theme logic (Green)
    document.body.setAttribute("data-role", "patient");
  }, []);

  const handleLanguageSelect = (lng) => {
    i18n.changeLanguage(lng);
    navigate("/auth-choice");
  };

  return (
    // 🟣 STEP 6: SPACING SYSTEM
    <div className="flex items-center justify-center min-h-[90vh] p-6">
      <div className="max-w-md w-full text-center space-y-10 animate-in fade-in duration-1000">

        {/* LOGO SECTION */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src={logo}
            alt="ArogyaPath Logo"
            className="h-36 w-auto object-contain drop-shadow-sm"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Select Your Language
            </h1>
          </div>
        </div>

        {/* 🧱 STEP 3: STANDARD CARD DESIGN (REFINED) */}
        <div className="grid grid-cols-1 gap-4 px-4">

          {/* ENGLISH SELECTION CARD */}
          <button
            onClick={() => handleLanguageSelect("en")}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-600 p-6 flex items-center justify-between hover:shadow-md transition group text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">
              English
            </h2>
            <div className="bg-gray-50 p-2 rounded-full group-hover:bg-green-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-green-600 transition" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {/* HINDI SELECTION CARD */}
          <button
            onClick={() => handleLanguageSelect("hi")}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-600 p-6 flex items-center justify-between hover:shadow-md transition group text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">
              हिंदी
            </h2>
            <div className="bg-gray-50 p-2 rounded-full group-hover:bg-green-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-green-600 transition" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LanguageSelection;
