import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import { getLocalStudents, saveLocalStudents } from '../../services/firebase/authService';
import { Button } from '../../components/common/Button';
import {
  User,
  Mail,
  Phone,
  Building,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { currentUser, studentData, updateCurrentStudentProfile } = useAuth();
  const [mobile, setMobile] = useState(studentData?.mobile || '');
  const [fullName, setFullName] = useState(studentData?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(studentData?.dateOfBirth || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(studentData?.profilePhotoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser || !studentData) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadProgress(15);
    setErrorMsg(null);

    try {
      const res = await uploadToCloudinary(file, 'profile_photos', (pct) => {
        setUploadProgress(pct);
      });
      setProfilePhotoUrl(res.url);

      // Auto save photo
      const list = getLocalStudents();
      const idx = list.findIndex(s => s.id === studentData.id);
      if (idx !== -1) {
        list[idx].profilePhotoUrl = res.url;
        list[idx].profilePhotoPublicId = res.publicId;
        saveLocalStudents(list);
        updateCurrentStudentProfile({
          profilePhotoUrl: res.url,
          profilePhotoPublicId: res.publicId,
        });
        window.dispatchEvent(new CustomEvent('signovanta:student-updated', { detail: { registrationNumber: studentData.registrationNumber } }));
        window.dispatchEvent(new Event('signovanta:data-updated'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const list = getLocalStudents();
      const idx = list.findIndex(s => s.id === studentData.id);
      if (idx !== -1) {
        list[idx].mobile = mobile.trim();
        list[idx].email = studentData.email;
        list[idx].fullName = fullName.trim();
        list[idx].dateOfBirth = dateOfBirth;
        list[idx].profilePhotoUrl = profilePhotoUrl;
        saveLocalStudents(list);

        updateCurrentStudentProfile({
          mobile: mobile.trim(),
          fullName: fullName.trim(),
          dateOfBirth,
          profilePhotoUrl,
        });

        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Profile & Settings</h1>
          <p className="text-xs text-slate-500">
            View verified institutional identity and update contact details
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Avatar Card */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="relative w-24 h-24 rounded-3xl bg-slate-200 border-2 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={studentData.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-slate-400" />
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h3 className="text-base font-bold text-slate-900">{studentData.fullName}</h3>
            <p className="text-xs font-mono font-bold text-blue-700">
              {studentData.registrationNumber}
            </p>
            <label className="inline-block cursor-pointer">
              <div className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-xs">
                <UploadCloud size={14} />
                <span>
                  {uploadingPhoto
                    ? `Uploading (${uploadProgress}%)...`
                    : 'Upload Picture (Cloudinary)'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Official Non-Editable Institutional Records */}
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} />
            <span>Official Institutional Records (Managed by Master Admin)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Registration Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {studentData.registrationNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Full Name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 px-2 py-1 text-xs bg-white border border-blue-200 rounded-lg font-bold" />
            </div>
            <div>
              <span className="text-slate-500 block">Academic Section</span>
              <span className="font-bold text-slate-900">{studentData.section}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-bold text-slate-900">{studentData.department}</span>
            </div>
          </div>
        </div>

        {/* Permitted Editable Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Permitted Student Contact Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
                <Phone size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={studentData.email}
                  readOnly
                  disabled
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <Mail size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
