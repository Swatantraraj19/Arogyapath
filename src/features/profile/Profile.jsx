import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { 
  User, Mail, Phone, MapPin, 
  Camera, Save, ShieldCheck, 
  Activity, Award, Building2,
  Loader2
} from "lucide-react";

const Profile = () => {
  const { t } = useTranslation();
  const { currentUser, userDoc } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 🖼️ CLOUDINARY IMAGE UPLOAD HANDLER
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validation
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image must be smaller than 2MB");
    }

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "arogyapath_preset");
    data.append("cloud_name", "dgpeicnzd");

    try {
      // 2. Upload to Cloudinary
      const res = await fetch("https://api.cloudinary.com/v1_1/dgpeicnzd/image/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      const photoUrl = result.secure_url;

      // 3. Update Firestore (Both Master and Role)
      const role = userDoc.role;
      await updateDoc(doc(db, "users", currentUser.uid), { photoUrl });
      await updateDoc(doc(db, role === "patient" ? "patients" : "doctors", currentUser.uid), { photoUrl });

      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Cloudinary Error:", error);
      toast.error(error.message || "Failed to upload to Cloudinary");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    location: "",
    age: "",
    specialization: "",
    experience: "",
    clinicName: "",
    clinicAddress: "",
    bloodGroup: "",
    gender: "",
    license: "",
  });
  const [errors, setErrors] = useState({});

  // 🔄 LOAD DATA
  useEffect(() => {
    if (userDoc) {
      setFormData({
        fullName: userDoc.fullName || "",
        phone: userDoc.phone || "",
        location: userDoc.location || "",
        age: userDoc.age || "",
        specialization: userDoc.specialization || "",
        experience: userDoc.experience || "",
        clinicName: userDoc.clinicName || "",
        clinicAddress: userDoc.clinicAddress || "",
        bloodGroup: userDoc.bloodGroup || "",
        gender: userDoc.gender || "",
        license: userDoc.license || "",
      });
    }
  }, [userDoc]);

  // 🛡️ VALIDATION ENGINE
  const validate = (data) => {
    const newErrors = {};
    const isDoctor = userDoc?.role === "doctor";

    if (!data.fullName || data.fullName.length < 3 || !/^[a-zA-Z\s]+$/.test(data.fullName)) {
      newErrors.fullName = t("profile_setup.error_name");
    }

    if (!data.phone || !/^[6-9][0-9]{9}$/.test(data.phone)) {
      newErrors.phone = t("profile_setup.error_phone");
    }

    if (!isDoctor) {
      if (!data.age || data.age < 1 || data.age > 120) newErrors.age = t("profile_setup.error_age");
      if (!data.location || data.location.length < 5) newErrors.location = t("profile_setup.error_location");
      if (!data.gender) newErrors.gender = t("profile_setup.error_required");
      if (!data.bloodGroup) newErrors.bloodGroup = t("profile_setup.error_required");
    } else {
      if (!data.specialization || !/^[a-zA-Z\s]+$/.test(data.specialization)) newErrors.specialization = t("profile_setup.error_specialization");
      if (!data.experience || data.experience < 0) newErrors.experience = t("profile_setup.error_experience");
      if (!data.license || data.license.length < 5) newErrors.license = t("profile_setup.error_license");
      if (!data.clinicName || data.clinicName.length < 3 || !/^[a-zA-Z0-9\s,.-]+$/.test(data.clinicName)) newErrors.clinicName = t("profile_setup.error_clinic_name");
      if (!data.clinicAddress || data.clinicAddress.length < 10 || !/^[a-zA-Z0-9\s,.-]+$/.test(data.clinicAddress)) newErrors.clinicAddress = t("profile_setup.error_clinic_address");
      if (!data.location || data.location.length < 5) newErrors.location = t("profile_setup.error_location");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setFormData({ ...formData, fullName: value });
    if (errors.fullName) setErrors({ ...errors, fullName: "" });
  };

  const handleSpecializationChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setFormData({ ...formData, specialization: value });
    if (errors.specialization) setErrors({ ...errors, specialization: "" });
  };

  const handleClinicChange = (e, field) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9\s,.-]/g, "");
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData({ ...formData, phone: value });
      if (errors.phone) setErrors({ ...errors, phone: "" });
    }
  };

  const handleAgeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) {
      setFormData({ ...formData, age: value });
      if (errors.age) setErrors({ ...errors, age: "" });
    }
  };

  const handleCancel = () => {
    if (userDoc) {
      setFormData({
        fullName: userDoc.fullName || "",
        phone: userDoc.phone || "",
        location: userDoc.location || "",
        age: userDoc.age || "",
        specialization: userDoc.specialization || "",
        experience: userDoc.experience || "",
        clinicName: userDoc.clinicName || "",
        clinicAddress: userDoc.clinicAddress || "",
        bloodGroup: userDoc.bloodGroup || "",
        gender: userDoc.gender || "",
        license: userDoc.license || "",
      });
      setErrors({});
      toast.success("Changes discarded");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return toast.error("Please fix the errors in the form");
    
    setLoading(true);
    try {
      // 1. Update Master Record
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: formData.fullName,
      });

      // 2. Update Role-Specific Record (FILTERED)
      const role = userDoc.role;
      const filteredData = {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
      };

      if (role === "patient") {
        Object.assign(filteredData, {
          age: formData.age,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
        });
      } else {
        Object.assign(filteredData, {
          specialization: formData.specialization,
          experience: formData.experience,
          license: formData.license,
          clinicName: formData.clinicName,
          clinicAddress: formData.clinicAddress,
        });
      }

      await updateDoc(doc(db, role === "patient" ? "patients" : "doctors", currentUser.uid), filteredData);

      toast.success(t("profile_setup.success"));
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = userDoc?.role === "doctor";
  const roleColor = isDoctor ? "blue" : "emerald";

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* 👤 PROFILE HEADER CARD */}
      <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-200/50 border border-gray-50 flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <div className={`w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-${roleColor}-50 shadow-lg relative`}>
            <img 
              src={userDoc?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDoc?.fullName || "User")}&background=${roleColor === 'emerald' ? '10b981' : '2563eb'}&color=fff`} 
              className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-30' : 'opacity-100'}`}
              alt="Profile"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className={`text-${roleColor}-600 animate-spin`} size={40} />
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
          
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current.click()}
            className={`absolute -bottom-2 -right-2 p-4 bg-${roleColor}-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100`}
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{userDoc?.fullName}</h2>
            <ShieldCheck className={`text-${roleColor}-500`} size={28} />
          </div>
          <p className="text-gray-400 font-bold text-lg">{currentUser?.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-4">
            <span className={`px-5 py-2 bg-${roleColor}-50 text-${roleColor}-700 rounded-full text-xs font-black uppercase tracking-widest`}>
              Verified {userDoc?.role}
            </span>
            {isDoctor && (
              <span className="px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
                {userDoc?.specialization}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 📝 EDIT FORM */}
      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
          <h3 className="text-2xl font-black text-gray-900 border-b border-gray-50 pb-6">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  value={formData.fullName}
                  onChange={handleNameChange}
                  className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.fullName ? "ring-2 ring-red-500/10" : ""}`}
                />
              </div>
              {errors.fullName && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.phone ? "ring-2 ring-red-500/10" : ""}`}
                  placeholder="10-digit number"
                />
              </div>
              {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.phone}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Location / Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.location ? "ring-2 ring-red-500/10" : ""}`}
                />
              </div>
              {errors.location && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.location}</p>}
            </div>

            {!isDoctor && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Age</label>
                  <input 
                    type="text"
                    value={formData.age}
                    onChange={handleAgeChange}
                    className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.age ? "ring-2 ring-red-500/10" : ""}`}
                    placeholder="Enter age"
                  />
                  {errors.age && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.age}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t("profile_setup.gender")}</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.gender ? "ring-2 ring-red-500/10" : ""}`}
                  >
                    <option value="male">{t("profile_setup.gender_male")}</option>
                    <option value="female">{t("profile_setup.gender_female")}</option>
                    <option value="other">{t("profile_setup.gender_other")}</option>
                  </select>
                  {errors.gender && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.gender}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t("profile_setup.blood_group")}</label>
                  <select 
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                    className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.bloodGroup ? "ring-2 ring-red-500/10" : ""}`}
                  >
                    <option value="unknown">{t("profile_setup.blood_group_unknown")}</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.bloodGroup && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.bloodGroup}</p>}
                </div>
              </>
            )}

            {isDoctor && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Medical License No.</label>
                  <input 
                    value={formData.license}
                    onChange={(e) => setFormData({...formData, license: e.target.value})}
                    className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.license ? "ring-2 ring-red-500/10" : ""}`}
                  />
                  {errors.license && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.license}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Specialization</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={formData.specialization}
                      onChange={handleSpecializationChange}
                      className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.specialization ? "ring-2 ring-red-500/10" : ""}`}
                    />
                  </div>
                  {errors.specialization && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.specialization}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Years of Experience</label>
                  <input 
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.experience ? "ring-2 ring-red-500/10" : ""}`}
                  />
                  {errors.experience && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.experience}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Clinic Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={formData.clinicName}
                      onChange={(e) => handleClinicChange(e, "clinicName")}
                      className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.clinicName ? "ring-2 ring-red-500/10" : ""}`}
                    />
                  </div>
                  {errors.clinicName && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.clinicName}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Clinic Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      value={formData.clinicAddress}
                      onChange={(e) => handleClinicChange(e, "clinicAddress")}
                      className={`w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-${roleColor}-500/20 ${errors.clinicAddress ? "ring-2 ring-red-500/10" : ""}`}
                    />
                  </div>
                  {errors.clinicAddress && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.clinicAddress}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 💾 ACTIONS CARD */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-sm space-y-6">
            <h4 className="font-black text-gray-900 text-xl">Quick Actions</h4>
            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-${roleColor}-600 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-${roleColor}-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50`}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={22} />}
              Save Changes
            </button>
            <button 
              type="button"
              onClick={handleCancel}
              className="w-full py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black text-lg transition-all hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>

          <div className={`bg-${roleColor}-600 rounded-[3rem] p-8 text-white space-y-4`}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <h4 className="font-black text-xl leading-tight">Profile Security</h4>
            <p className="text-white/70 text-sm font-medium leading-relaxed">Your data is encrypted and protected. Only authorized medical staff can view your health records.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
