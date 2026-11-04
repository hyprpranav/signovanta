import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FirstTimeActivationModal } from '../../components/common/FirstTimeActivationModal';
import { registerStaffRequest } from '../../services/firebase/authService';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Phone,
  Building,
} from 'lucide-react';

interface LoginPageProps {
  onOpenFirebaseGuide: () => void;
  onNavigateToStaffRegister?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onOpenFirebaseGuide,
}) => {
  const { universalLogin, loginAsAdminBoomikaQuick, submitStudentRequest } = useAuth();

  // Single Unified Login Credentials
  const [identifier, setIdentifier] = useState('927624BEC001');
  const [password, setPassword] = useState('927624BEC001');

  // Activation Modal State for first-time student login
  const [activationStudent, setActivationStudent] = useState<Student | null>(null);

  // Registration Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'STUDENT' | 'STAFF'>('STUDENT');

  // Student Request Form State
  const [reqStdName, setReqStdName] = useState('');
  const [reqStdRegNo, setReqStdRegNo] = useState('');
  const [reqStdSection, setReqStdSection] = useState('III Year ECE A');
  const [reqStdEmail, setReqStdEmail] = useState('');
  const [reqStdMobile, setReqStdMobile] = useState('');

  // Staff Request Form State
  const [reqStaffName, setReqStaffName] = useState('');
  const [reqStaffId, setReqStaffId] = useState('');
  const [reqStaffEmail, setReqStaffEmail] = useState('');
  const [reqStaffMobile, setReqStaffMobile] = useState('');
  const [reqStaffDesignation, setReqStaffDesignation] = useState('Assistant Professor');
  const [reqStaffRole, setReqStaffRole] = useState<'STAFF' | 'HOD' | 'AHOD'>('STAFF');
  const [reqStaffPassword, setReqStaffPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAdminLoading, setIsQuickAdminLoading] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);

  // Single unified submission handler
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await universalLogin(identifier, password);
      if (res.requiresPasswordChange && res.student) {
        setActivationStudent(res.student);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Master Admin Login
  const handleQuickAdminLogin = async () => {
    setErrorMessage(null);
    setIsQuickAdminLoading(true);
    try {
      await loginAsAdminBoomikaQuick();
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick Admin login failed.');
    } finally {
      setIsQuickAdminLoading(false);
    }
  };

  // Submit Student Registration Request
  const handleSubmitStudentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestErrorMessage(null);
    setIsSubmittingRequest(true);

    try {
      await submitStudentRequest({
        fullName: reqStdName,
        registrationNumber: reqStdRegNo,
        section: reqStdSection,
        email: reqStdEmail,
        mobile: reqStdMobile,
      });

      setRequestSuccessMessage(`Registration request for ${reqStdRegNo.toUpperCase()} submitted successfully! Admin Boomika will review and approve.`);
      setReqStdName('');
      setReqStdRegNo('');
      setReqStdEmail('');
      setReqStdMobile('');
    } catch (err: any) {
      setRequestErrorMessage(err.message || 'Failed to submit student request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit Staff Registration Request
  const handleSubmitStaffRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestErrorMessage(null);

    if (reqStaffPassword.length < 6) {
      setRequestErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await registerStaffRequest({
        fullName: reqStaffName,
        staffId: reqStaffId,
        email: reqStaffEmail,
        mobile: reqStaffMobile,
        department: 'Electronics & Communication Engineering',
        designation: reqStaffDesignation,
        requestedRole: reqStaffRole,
        password: reqStaffPassword,
      });

      setRequestSuccessMessage(`Faculty request for ${reqStaffName} submitted successfully! Admin Boomika will review and approve.`);
      setReqStaffName('');
      setReqStaffId('');
      setReqStaffEmail('');
      setReqStaffMobile('');
      setReqStaffPassword('');
    } catch (err: any) {
      setRequestErrorMessage(err.message || 'Failed to submit staff request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Quick fill helper for testing authentic credentials
  const fillSample = (id: string, pwd: string) => {
    setIdentifier(id);
    setPassword(pwd);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Bar with Branding & Cloud Setup Guide Pill */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl tracking-tight shadow-md">
            S
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block leading-none">
              SIGNOVANTA
            </span>
            <span className="text-[11px] text-blue-300 font-medium">
              Every Event. Every Approval. One Platform.
            </span>
          </div>
        </div>

        <button
          onClick={onOpenFirebaseGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Flame size={15} className="text-amber-400" />
          <span>Cloud Setup Guide</span>
        </button>
      </div>

      {/* SINGLE UNIFIED LOGIN CARD */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block mb-1">
              ECE Department Portal • 3rd Year
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Sign In to SIGNOVANTA
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter your credentials to access your dashboard automatically
            </p>
          </div>

          {/* 1-Click Master Admin Login Button */}
          <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-950">Master Admin Portal</span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                Admin: Boomika
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              isLoading={isQuickAdminLoading}
              onClick={handleQuickAdminLogin}
              className="bg-purple-900 hover:bg-purple-950 text-white font-bold"
            >
              <Sparkles size={14} className="mr-1.5 text-amber-300" />
              1-Click Master Admin Login (Boomika)
            </Button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SINGLE UNIFIED LOGIN FORM */}
          <form onSubmit={handleUnifiedSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Number or Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 927624BEC001 or boomika@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
                <User size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Students use Registration Number (case-insensitive) • Faculty & Admin use Email
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
                <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-blue-600 mt-1">
                First login as student? Your initial password is your Registration Number.
              </p>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} size="lg">
              Sign In to Dashboard
            </Button>

            {/* Quick Authentic Fill Chips */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Preset Authentic Logins:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillSample('927624BEC001', '927624BEC001')}
                  className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                >
                  927624BEC001 (ECE A)
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('927624BEC190', '927624BEC190')}
                  className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                >
                  927624BEC190 (ECE D)
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('priya.ece@college.edu', 'password123')}
                  className="p-1.5 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                >
                  Dr. Priya (AHOD ECE)
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('boomika@gmail.com', '927624')}
                  className="p-1.5 text-[11px] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-900 font-semibold text-left truncate cursor-pointer"
                >
                  Boomika (Admin)
                </button>
              </div>
            </div>

            {/* Registration Request Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(true);
                  setRequestSuccessMessage(null);
                  setRequestErrorMessage(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>New Student or Faculty? Submit Registration Request</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 py-3">
        SIGNOVANTA • Electronics & Communication Engineering • 3rd Year Event Gateway
      </div>

      {/* Mandatory First-Time Password Reset Modal */}
      {activationStudent && (
        <FirstTimeActivationModal
          isOpen={true}
          student={activationStudent}
          onSuccess={() => {
            setActivationStudent(null);
          }}
        />
      )}

      {/* REGISTRATION REQUEST MODAL (Student & Staff) */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Submit Registration Request"
        subtitle="Requests are routed directly to Master Admin Boomika for verification and activation"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Switcher Tab */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRequestType('STUDENT');
                setRequestErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                requestType === 'STUDENT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>New Student Request</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestType('STAFF');
                setRequestErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                requestType === 'STAFF'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase size={15} />
              <span>New Faculty Request</span>
            </button>
          </div>

          {/* Success Banner */}
          {requestSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{requestSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {requestErrorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{requestErrorMessage}</span>
            </div>
          )}

          {/* Student Request Form */}
          {requestType === 'STUDENT' && (
            <form onSubmit={handleSubmitStudentRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reqStdName}
                  onChange={(e) => setReqStdName(e.target.value)}
                  placeholder="e.g. SARAVANAN V"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reqStdRegNo}
                    onChange={(e) => setReqStdRegNo(e.target.value)}
                    placeholder="e.g. 927624BEC255"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ECE Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reqStdSection}
                    onChange={(e) => setReqStdSection(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="III Year ECE A">III Year ECE A</option>
                    <option value="III Year ECE B">III Year ECE B</option>
                    <option value="III Year ECE C">III Year ECE C</option>
                    <option value="III Year ECE D">III Year ECE D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={reqStdEmail}
                    onChange={(e) => setReqStdEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={reqStdMobile}
                    onChange={(e) => setReqStdMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmittingRequest}>
                  Submit Student Request
                </Button>
              </div>
            </form>
          )}

          {/* Staff Request Form */}
          {requestType === 'STAFF' && (
            <form onSubmit={handleSubmitStaffRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Faculty Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reqStaffName}
                  onChange={(e) => setReqStaffName(e.target.value)}
                  placeholder="e.g. Dr. K. Ramanathan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reqStaffId}
                    onChange={(e) => setReqStaffId(e.target.value)}
                    placeholder="e.g. ECE-FAC-04"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Electronics & Communication Engineering"
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={reqStaffEmail}
                    onChange={(e) => setReqStaffEmail(e.target.value)}
                    placeholder="ramanathan.ece@college.edu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={reqStaffMobile}
                    onChange={(e) => setReqStaffMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reqStaffDesignation}
                    onChange={(e) => setReqStaffDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requested Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reqStaffRole}
                    onChange={(e) => setReqStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="STAFF">Faculty Coordinator (STAFF)</option>
                    <option value="AHOD">Assistant HOD (AHOD)</option>
                    <option value="HOD">Head of Department (HOD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Choose Login Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={reqStaffPassword}
                  onChange={(e) => setReqStaffPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmittingRequest}>
                  Submit Faculty Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
