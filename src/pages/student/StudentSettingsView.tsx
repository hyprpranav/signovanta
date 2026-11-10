import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { changeStudentPassword, getLocalStudents, saveLocalStudents, updateStudentProfile } from '../../services/firebase/authService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import { Button } from '../../components/common/Button';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  UploadCloud,
  Save,
  Lock,
} from 'lucide-react';

export const StudentSettingsView: React.FC = () => {
  const { studentData, updateCurrentStudentProfile } = useAuth();

  // Profile Form State
  const [mobile, setMobile] = useState(studentData?.mobile || '');
  const [fullName, setFullName] = useState(studentData?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(studentData?.dateOfBirth || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(studentData?.profilePhotoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  if (!studentData) return null;

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadProgress(15);
    setProfileErrorMsg(null);

    try {
      const res = await uploadToCloudinary(file, 'profile_photos', (pct) => {
        setUploadProgress(pct);
      });
      setProfilePhotoUrl(res.url);

      // Persist in local storage, auth context, and remote Firestore
      void updateStudentProfile(studentData.id, {
        profilePhotoUrl: res.url,
        profilePhotoPublicId: res.publicId,
      });

      updateCurrentStudentProfile({
        profilePhotoUrl: res.url,
        profilePhotoPublicId: res.publicId,
      });
      window.dispatchEvent(
        new CustomEvent('signovanta:student-updated', {
          detail: { registrationNumber: studentData.registrationNumber },
        })
      );
      window.dispatchEvent(new Event('signovanta:data-updated'));
      setProfileSuccessMsg('✓ Profile photo updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await updateStudentProfile(studentData.id, {
        mobile: mobile.trim(),
        fullName: fullName.trim(),
        dateOfBirth,
        profilePhotoUrl,
      });

      updateCurrentStudentProfile({
        mobile: mobile.trim(),
        fullName: fullName.trim(),
        dateOfBirth,
        profilePhotoUrl,
      });

      setProfileSuccessMsg('✓ Profile details saved successfully in Firebase!');
      window.dispatchEvent(
        new CustomEvent('signovanta:student-updated', {
          detail: { registrationNumber: studentData.registrationNumber },
        })
      );
      window.dispatchEvent(new Event('signovanta:data-updated'));
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordErrorMsg('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeStudentPassword(
        studentData.registrationNumber,
        currentPassword,
        newPassword
      );

      setPasswordSuccessMsg('✓ Password updated successfully! Use your new password for future logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-2xl overflow-hidden ring-4 ring-blue-100 shadow-md">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={studentData.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{studentData.fullName ? studentData.fullName.charAt(0).toUpperCase() : 'S'}</span>
            )}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900">{studentData.fullName}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
              {studentData.registrationNumber}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Section: {studentData.section}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{studentData.email}</p>
          <p className="text-xs text-blue-700 font-semibold">{studentData.department}</p>
        </div>
      </div>

      {/* Side-by-Side: Profile Details & Password Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Student Profile & Contact Form */}
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <User size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
                <p className="text-[11px] text-slate-500">Edit contact details & upload photo</p>
              </div>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Photo Upload Row */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden ring-2 ring-white shadow-xs shrink-0 flex items-center justify-center">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">Profile Picture</span>
              <label className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-xs">
                <UploadCloud size={13} />
                <span>{uploadingPhoto ? `Uploading (${uploadProgress}%)...` : 'Upload New Photo'}</span>
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

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <Phone size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Institutional Info (Read Only) */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Official Email:</span>
              <span className="font-semibold text-slate-800">{studentData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registration Number:</span>
              <span className="font-mono font-bold text-blue-900">{studentData.registrationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Academic Section:</span>
              <span className="font-bold text-slate-800">{studentData.section}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingProfile}
              leftIcon={<Save size={14} />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Profile Details
            </Button>
          </div>
        </form>

        {/* Right Column: Password Change Form */}
        <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <KeyRound size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign-In Password</h3>
              <p className="text-[11px] text-slate-500">Change your student login password</p>
            </div>
          </div>

          {passwordSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2 text-[11px] text-slate-500">
            <Lock size={14} className="text-slate-400 shrink-0" />
            <span>Use at least 6 characters. Passwords are saved securely.</span>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isChangingPassword}
              leftIcon={<KeyRound size={14} />}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
