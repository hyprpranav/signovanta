import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Student } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Lock, Phone, Mail, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';

interface FirstTimeActivationModalProps {
  isOpen: boolean;
  student: Student;
  onSuccess: () => void;
}

export const FirstTimeActivationModal: React.FC<FirstTimeActivationModalProps> = ({
  isOpen,
  student,
  onSuccess,
}) => {
  const { completeFirstTimeLogin } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState(student.mobile || '');
  const [email, setEmail] = useState(student.email || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(student.profilePhotoUrl || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setUploadProgress(10);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, 'profile_photos', (pct) => {
        setUploadProgress(pct);
      });
      setProfilePhotoUrl(res.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.toUpperCase().trim() === student.registrationNumber.toUpperCase().trim()) {
      setError('New password cannot be the same as your Registration Number.');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      await completeFirstTimeLogin(newPassword, {
        mobile: mobile.trim(),
        email: email.trim(),
        profilePhotoUrl,
      });
      localStorage.setItem('signovanta_first_login_celebration', JSON.stringify({
        title: 'Your account is activated',
        message: 'Congratulations! Your SIGNOVANTA account is now active. You can submit your first event application from the dashboard.',
      }));
      window.dispatchEvent(new CustomEvent('signovanta:celebration-ready'));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete account activation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot close until mandatory password reset is completed
      title="Complete Account Activation"
      subtitle="First-time login setup: Set custom password & verify profile"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preloaded Non-Editable Identity Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Official Preloaded Identity
          </span>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{student.fullName}</h4>
              <p className="text-xs font-mono font-semibold text-blue-700">
                {student.registrationNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">{student.section}</span>
              <span className="text-[11px] text-slate-500">{student.department}</span>
            </div>
          </div>
        </div>

        {/* Profile Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Profile Photo (Optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-slate-400">Photo</span>
              )}
            </div>
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 transition-colors">
                <UploadCloud size={16} />
                <span>{uploadingPhoto ? `Uploading (${uploadProgress}%)...` : 'Upload Picture'}</span>
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

        {/* Mandatory Password Reset Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <Lock size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <Lock size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <Phone size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Mail size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            leftIcon={<CheckCircle2 size={16} />}
          >
            Activate Account & Enter Dashboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};
