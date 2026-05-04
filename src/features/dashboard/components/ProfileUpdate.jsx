import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../context/AuthContext";
import { User, Phone, MapPin, Award, Activity, Camera, Mail, ClipboardList } from "lucide-react";

const ProfileUpdate = ({ role, existingData }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(existingData?.photoUrl || null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: existingData?.fullName || "",
    phone: existingData?.phone || "",
    age: existingData?.age || "",
    gender: existingData?.gender || "",
    bloodGroup: existingData?.bloodGroup || "",
    location: existingData?.location || "",
    specialization: existingData?.specialization || "",
    experience: existingData?.experience || "",
    license: existingData?.license || "",
    clinicName: existingData?.clinicName || "",
    clinicAddress: existingData?.clinicAddress || "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error(t("profile_setup.error_image_size"));
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      if (errors.photo) setErrors({ ...errors, photo: null });
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!preview && !image) newErrors.photo = t("profile_setup.error_photo");
    if (!data.fullName.trim() || data.fullName.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(data.fullName)) {
      newErrors.fullName = t("profile_setup.error_name");
    }
    if (!data.phone.trim() || !/^[6-9]\d{9}$/.test(data.phone)) newErrors.phone = t("profile_setup.error_phone");
    if (!data.location.trim() || data.location.trim().length < 3 || !/^[a-zA-Z\s,]+$/.test(data.location)) {
      newErrors.location = t("profile_setup.error_location");
    }

    if (role === "patient") {
      const ageNum = parseInt(data.age);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) newErrors.age = t("profile_setup.error_age");
      if (!data.gender) newErrors.gender = t("profile_setup.error_gender");
      if (!data.bloodGroup) newErrors.bloodGroup = t("profile_setup.error_blood_group");
    } else {
      if (!String(data.specialization).trim() || data.specialization.trim().length < 5 || !/^[a-zA-Z\s]+$/.test(data.specialization)) {
        newErrors.specialization = t("profile_setup.error_specialization");
      }
      const expNum = parseInt(data.experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 100) {
        newErrors.experience = t("profile_setup.error_experience");
      }
      if (!String(data.license).trim() || data.license.trim().length < 5 || !/^(?=.*[a-zA-Z])[a-zA-Z0-9-]+$/.test(data.license)) {
        newErrors.license = t("profile_setup.error_license");
      }
      if (!String(data.clinicName).trim() || data.clinicName.trim().length < 10 || !/^(?=.*[a-zA-Z]).+$/.test(data.clinicName)) {
        newErrors.clinicName = t("profile_setup.error_clinic_name");
      }
      if (!String(data.clinicAddress).trim() || data.clinicAddress.trim().length < 10 || !/^(?=.*[a-zA-Z]).+$/.test(data.clinicAddress)) {
        newErrors.clinicAddress = t("profile_setup.error_clinic_address");
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.warn("Validation Errors:", newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "arogyapath_preset");
    formData.append("cloud_name", "dgpeicnzd");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dgpeicnzd/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return toast.error(t("profile_setup.error_fix"));

    try {
      setLoading(true);
      let photoUrl = preview;
      if (image) {
        toast.loading("Uploading photo...", { id: "uploading" });
        photoUrl = await uploadImageToCloudinary(image);
        toast.dismiss("uploading");
      }
      
      const profileData = {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        photoUrl: photoUrl || "",
        role: role,
        uid: currentUser.uid,
        email: currentUser.email,
        createdAt: existingData?.createdAt || new Date().toISOString(),
        ...(role === "patient" ? {
          age: formData.age,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup
        } : {
          specialization: formData.specialization,
          experience: formData.experience,
          license: formData.license,
          clinicName: formData.clinicName,
          clinicAddress: formData.clinicAddress
        })
      };

      // 1. Save to role-specific collection (No merge to clear stray fields)
      await setDoc(doc(db, role === "patient" ? "patients" : "doctors", currentUser.uid), profileData);
      
      // 2. Update core user doc (Merge to keep other account settings)
      await setDoc(doc(db, "users", currentUser.uid), {
        fullName: profileData.fullName,
        photoUrl: photoUrl,
        onboardingComplete: true,
        completedRoles: arrayUnion(role)
      }, { merge: true });
        
      toast.success(t("profile_setup.success"));
    } catch (error) {
      toast.error(t("auth.errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
          <div className="relative group">
            <div className={`
              w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 transition-all duration-300
              ${errors.photo ? 'border-red-500' : (role === 'patient' ? 'border-emerald-50' : 'border-blue-50')}
            `}>
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={60} className="text-gray-200" />
              )}
            </div>
            <label className={`absolute -bottom-2 -right-2 p-3 rounded-2xl text-white cursor-pointer shadow-lg hover:scale-110 transition-transform ${role === 'patient' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h3 className={`text-3xl font-black leading-tight ${role === 'patient' ? 'text-emerald-600' : 'text-blue-600'}`}>
              Edit Your Profile
            </h3>
            <p className="text-gray-400 font-medium italic">{t("profile_setup.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-400" /> {t("profile_setup.full_name")}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`input-standard ${errors.fullName ? 'border-red-500' : ''}`}
            />
            {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          <div className="md:col-span-2 space-y-1 opacity-60">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" /> {t("profile_setup.email")}
            </label>
            <input type="email" value={currentUser?.email || ""} readOnly className="input-standard bg-gray-50 cursor-not-allowed" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" /> {t("profile_setup.phone")}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`input-standard ${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" /> {t("profile_setup.location")}
            </label>
            <input
              type="text"
              name="location"
              spellCheck="false"
              value={formData.location}
              onChange={handleInputChange}
              className={`input-standard ${errors.location ? 'border-red-500' : ''}`}
            />
            {errors.location && <p className="text-xs text-red-500 font-medium">{errors.location}</p>}
          </div>

          {role === "patient" ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.age")}</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={`input-standard ${errors.age ? 'border-red-500' : ''}`} />
                {errors.age && <p className="text-xs text-red-500 font-medium">{errors.age}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t("profile_setup.gender")}</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className={`input-standard ${errors.gender ? 'border-red-500' : ''}`}>
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
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={`input-standard ${errors.bloodGroup ? 'border-red-500' : ''}`}>
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  <option value="unknown">{t("profile_setup.blood_group_unknown")}</option>
                </select>
                {errors.bloodGroup && <p className="text-xs text-red-500 font-medium">{errors.bloodGroup}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ClipboardList size={16} className="text-gray-400" /> {t("profile_setup.specialization")}
                </label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} className={`input-standard ${errors.specialization ? 'border-red-500' : ''}`} />
                {errors.specialization && <p className="text-xs text-red-500 font-medium">{errors.specialization}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Award size={16} className="text-gray-400" /> {t("profile_setup.experience")}
                </label>
                <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} className={`input-standard ${errors.experience ? 'border-red-500' : ''}`} />
                {errors.experience && <p className="text-xs text-red-500 font-medium">{errors.experience}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Activity size={16} className="text-gray-400" /> {t("profile_setup.license")}
                </label>
                <input type="text" name="license" value={formData.license} onChange={handleInputChange} className={`input-standard ${errors.license ? 'border-red-500' : ''}`} />
                {errors.license && <p className="text-xs text-red-500 font-medium">{errors.license}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">
                  {t("profile_setup.clinic_name")}
                </label>
                <input type="text" name="clinicName" value={formData.clinicName} onChange={handleInputChange} className={`input-standard ${errors.clinicName ? 'border-red-500' : ''}`} />
                {errors.clinicName && <p className="text-xs text-red-500 font-medium">{errors.clinicName}</p>}
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> {t("profile_setup.clinic_address")}
                </label>
                <textarea 
                  name="clinicAddress" 
                  rows="3" 
                  spellCheck="false"
                  value={formData.clinicAddress} 
                  onChange={handleInputChange} 
                  className={`input-standard resize-none ${errors.clinicAddress ? 'border-red-500' : ''}`} 
                />
                {errors.clinicAddress && <p className="text-xs text-red-500 font-medium">{errors.clinicAddress}</p>}
              </div>
            </>
          )}

          <div className="md:col-span-2 pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-[0.98] ${
                role === 'patient' 
                  ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' 
                  : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
              } ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? "..." : t("profile_setup.save_profile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;
