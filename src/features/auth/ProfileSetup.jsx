import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { User, Phone, MapPin, Award, Activity, Camera, Mail, ClipboardList } from "lucide-react";

const ProfileSetup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useParams(); // 'patient' or 'doctor'
  const { currentUser, userDoc } = useAuth();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // 🛡️ MULTI-ROLE NAVIGATION GUARD
  useEffect(() => {
    // Only redirect if this SPECIFIC role is already finished
    if (userDoc?.completedRoles?.includes(role)) {
      navigate(`/dashboard/${role}`, { replace: true });
    }
  }, [userDoc, role, navigate]);

  // 🌓 Apply Role-Based Theme
  useEffect(() => {
    if (role) {
      document.body.setAttribute("data-role", role);
    }
  }, [role]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, photo: null })); // Clear photo error
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    
    // 1. Name Validation (Letters and dots only, 3+ chars)
    if (!data.fullName || !/^[a-zA-Z\s\.]{3,50}$/.test(data.fullName.trim())) {
      newErrors.fullName = t("profile_setup.error_name");
    }

    // 2. Phone Validation (Indian 10-digit)
    if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) {
      newErrors.phone = t("profile_setup.error_phone");
    }

    // 3. Photo Validation
    if (!preview) {
      newErrors.photo = t("profile_setup.error_photo");
    }

    // 4. Role-Specific Validations
    if (role === "patient") {
      const ageNum = parseInt(data.age);
      if (!data.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = t("profile_setup.error_age");
      }
      if (!data.location || data.location.trim().length < 5) {
        newErrors.location = t("profile_setup.error_location");
      } else if (!/[a-zA-Z]/.test(data.location)) {
        newErrors.location = t("profile_setup.error_invalid");
      }
      if (!data.gender) newErrors.gender = t("profile_setup.error_required");
      if (!data.bloodGroup) newErrors.bloodGroup = t("profile_setup.error_required");
    } else if (role === "doctor") {
      if (!data.specialization || !/^[a-zA-Z\s\.]{3,100}$/.test(data.specialization.trim())) {
        newErrors.specialization = t("profile_setup.error_specialization");
      }
      if (!data.experience) {
        newErrors.experience = t("profile_setup.error_required");
      } else if (parseInt(data.experience) < 0) {
        newErrors.experience = t("profile_setup.error_experience");
      }
      if (!data.license || data.license.trim().length < 5) {
        newErrors.license = t("profile_setup.error_license");
      }
      
      if (!data.clinicName || data.clinicName.trim().length < 3) {
        newErrors.clinicName = t("profile_setup.error_clinic_name");
      } else if (!/[a-zA-Z]/.test(data.clinicName)) {
        newErrors.clinicName = t("profile_setup.error_invalid");
      }
      
      if (!data.clinicAddress || data.clinicAddress.trim().length < 10) {
        newErrors.clinicAddress = t("profile_setup.error_clinic_address");
      } else if (!/[a-zA-Z]/.test(data.clinicAddress)) {
        newErrors.clinicAddress = t("profile_setup.error_invalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    // Patient Specific
    age: "",
    gender: "",
    bloodGroup: "",
    // Doctor Specific
    specialization: "",
    experience: "",
    license: "",
    clinicName: "",
    clinicAddress: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 🛡️ Special handling for Phone (digits only, max 10)
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "arogyapath_preset");
    formData.append("cloud_name", "dgpeicnzd");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dgpeicnzd/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // 🛡️ RUN VALIDATION
    if (!validateForm(formData)) {
      toast.error("Please fix the errors in the form before continuing");
      return;
    }

    try {
      setLoading(true);

      // ☁️ CLOUDINARY UPLOAD
      let uploadedPhotoUrl = preview; // fallback to current preview
      if (image) {
        toast.loading("Uploading profile photo...", { id: "uploading" });
        uploadedPhotoUrl = await uploadImageToCloudinary(image);
        toast.dismiss("uploading");
      }
      
      const profileData = {
        uid: currentUser.uid,
        email: currentUser.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: role,
        photoUrl: uploadedPhotoUrl, // 🚀 Permanent Cloudinary Link!
        updatedAt: serverTimestamp(),
      };

      if (role === "patient") {
        Object.assign(profileData, {
          age: formData.age,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          location: formData.location,
        });
      } else {
        Object.assign(profileData, {
          specialization: formData.specialization,
          experience: formData.experience,
          license: formData.license,
          clinicName: formData.clinicName,
          clinicAddress: formData.clinicAddress,
        });
      }

      // 1. Save to role-specific collection (e.g., /patients or /doctors)
      await setDoc(doc(db, role === "patient" ? "patients" : "doctors", currentUser.uid), profileData);
      
      // 2. Update core user doc with multi-role support
      await setDoc(doc(db, "users", currentUser.uid), {
        role: role, // Last used role
        completedRoles: arrayUnion(role), 
        onboardingComplete: true,
      }, { merge: true });
      
      // 🔑 VERIFY SESSION: Now that setup is done, user is verified for this SPECIFIC role
      localStorage.setItem("roleVerified", role);

      toast.success(t("profile_setup.success"));
      navigate(`/dashboard/${role}`, { replace: true });
    } catch (error) {
      console.error("Profile Setup Error:", error);
      toast.error(t("auth.errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-6 animate-in fade-in duration-1000">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">
            {role === "patient" ? t("profile_setup.title_patient") : t("profile_setup.title_doctor")}
          </h2>
          <p className="text-gray-500">{t("profile_setup.subtitle")}</p>
        </div>

        {/* PHOTO UPLOAD */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className={`
              w-24 h-24 rounded-full border-4 flex items-center justify-center overflow-hidden bg-gray-50 transition-all duration-300
              ${errors.photo ? 'border-red-500 shadow-lg shadow-red-100' : 
                (role === 'patient' ? 'border-emerald-100 group-hover:border-emerald-500' : 'border-blue-100 group-hover:border-blue-500')}
            `}>
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-300" />
              )}
            </div>
            <label className={`
              absolute bottom-0 right-0 p-1.5 rounded-full text-white cursor-pointer transition-transform hover:scale-110 shadow-lg
              ${role === 'patient' ? 'bg-emerald-600' : 'bg-blue-600'}
            `}>
              <Camera size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${errors.photo ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
            {errors.photo || t("profile_setup.profile_photo")}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COMMON FIELDS */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-400" /> {t("profile_setup.full_name")}
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Rahul Singh"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`input-standard ${errors.fullName ? 'border-red-500 focus:ring-red-100' : ''}`}
            />
            {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          {/* EMAIL (READONLY) */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" /> {t("profile_setup.email")}
            </label>
            <input
              type="email"
              readOnly
              value={currentUser?.email || ""}
              className="input-standard bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" /> {t("profile_setup.phone")}
            </label>
            <input
              type="tel"
              name="phone"
              maxLength="10"
              inputMode="numeric"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleInputChange}
              className={`input-standard ${errors.phone ? 'border-red-500 focus:ring-red-100' : ''}`}
            />
            {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
          </div>

          {role === "patient" ? (
            <>
              {/* PATIENT FIELDS */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.age")}</label>
                <input
                  type="number"
                  name="age"
                  placeholder="25"
                  value={formData.age}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.age ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.age && <p className="text-xs text-red-500 font-medium">{errors.age}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> {t("profile_setup.location")}
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="Lucknow, Uttar Pradesh"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.location ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.location && <p className="text-xs text-red-500 font-medium">{errors.location}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.gender")}</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`input-standard bg-white ${errors.gender ? 'border-red-500 focus:ring-red-100' : ''}`}
                >
                  <option value="">Select</option>
                  <option value="male">{t("profile_setup.gender_male")}</option>
                  <option value="female">{t("profile_setup.gender_female")}</option>
                  <option value="other">{t("profile_setup.gender_other")}</option>
                </select>
                {errors.gender && <p className="text-xs text-red-500 font-medium">{errors.gender}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity size={16} className="text-gray-400" /> {t("profile_setup.blood_group")}
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className={`input-standard bg-white ${errors.bloodGroup ? 'border-red-500 focus:ring-red-100' : ''}`}
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                  <option value="unknown">{t("profile_setup.blood_group_unknown")}</option>
                </select>
                {errors.bloodGroup && <p className="text-xs text-red-500 font-medium">{errors.bloodGroup}</p>}
              </div>
            </>
          ) : (
            <>
              {/* DOCTOR FIELDS */}
               <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ClipboardList size={16} className="text-gray-400" /> {t("profile_setup.specialization")}
                </label>
                <input
                  type="text"
                  name="specialization"
                  placeholder="Cardiologist"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.specialization ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.specialization && <p className="text-xs text-red-500 font-medium">{errors.specialization}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award size={16} className="text-gray-400" /> {t("profile_setup.experience")}
                </label>
                <input
                  type="number"
                  name="experience"
                  min="0"
                  placeholder="10"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.experience ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.experience && <p className="text-xs text-red-500 font-medium">{errors.experience}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.license")}</label>
                <input
                  type="text"
                  name="license"
                  placeholder="MCI-12345"
                  value={formData.license}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.license ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.license && <p className="text-xs text-red-500 font-medium">{errors.license}</p>}
              </div>

              <div className="md:col-span-2 space-y-1 pt-2">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.clinic_name")}</label>
                <input
                  type="text"
                  name="clinicName"
                  placeholder="City Health Center"
                  value={formData.clinicName}
                  onChange={handleInputChange}
                  className={`input-standard ${errors.clinicName ? 'border-red-500 focus:ring-red-100' : ''}`}
                />
                {errors.clinicName && <p className="text-xs text-red-500 font-medium">{errors.clinicName}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> {t("profile_setup.clinic_address")}
                </label>
                <textarea
                  name="clinicAddress"
                  rows="3"
                  placeholder="123, Medical Square, Lucknow..."
                  value={formData.clinicAddress}
                  onChange={handleInputChange}
                  className={`input-standard resize-none ${errors.clinicAddress ? 'border-red-500 focus:ring-red-100' : ''}`}
                ></textarea>
                {errors.clinicAddress && <p className="text-xs text-red-500 font-medium">{errors.clinicAddress}</p>}
              </div>
            </>
          )}

          <div className="md:col-span-2 pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-sm
                ${role === 'patient' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                  'bg-blue-600 hover:bg-blue-700 text-white'}
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {loading ? "..." : t("profile_setup.save_profile")}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button 
            onClick={() => navigate("/role-entry", { replace: true })}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
          >
            ← Change Role
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileSetup;
