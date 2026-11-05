import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FirstTimeActivationModal } from '../../components/common/FirstTimeActivationModal';
import { registerStaffRequest } from '../../services/firebase/authService';
import {
  Lock,
  User,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Phone,
  Building,
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToStaffRegister?: () => void;
  onBackToLanding?: () => void;
  initialOpenRegister?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToLanding,
  initialOpenRegister = false,
}) => {
  const { universalLogin, submitStudentRequest } = useAuth();

  // Single Unified Login Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Activation Modal State for first-time student login
  const [activationStudent, setActivationStudent] = useState<Student | null>(null);

  // Registration Request Modal
  const [showRequestModal, setShowRequestModal] = useState(initialOpenRegister);
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Bar with Branding & Back to Home */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src="/signovanta-logo.png"
            alt="SIGNOVANTA Logo"
            className="w-10 h-10 rounded-2xl object-contain bg-slate-950 p-1 border border-slate-700 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                SIGNOVANTA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-800">
                v2.0
              </span>
            </div>
            <span className="text-[11px] text-blue-300 font-medium">
              Every Event. Every Approval. One Platform.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Institutional Branding on large screens */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-2xl">
            <img
              src="/mkce-logo.png"
              alt="MKCE"
              title="M. Kumarasamy College of Engineering (Autonomous)"
              className="w-7 h-7 object-contain rounded-lg bg-white p-0.5 shadow-2xs"
            />
            <img
              src="/ece-logo.png"
              alt="ECE"
              title="Department of Electronics and Communication Engineering"
              className="w-7 h-7 object-contain rounded-lg bg-white p-0.5 shadow-2xs"
            />
          </div>

          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>← Back to Home</span>
            </button>
          )}
        </div>
      </div>

      {/* SINGLE UNIFIED LOGIN CARD */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Header with College, Department and Platform Logos */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5 pb-1">
              <img
                src="/mkce-logo.png"
                alt="MKCE Logo"
                title="M. Kumarasamy College of Engineering"
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-2xs"
              />
              <img
                src="/signovanta-logo.png"
                alt="SIGNOVANTA Logo"
                title="SIGNOVANTA Platform"
                className="w-12 h-12 object-contain rounded-2xl bg-slate-950 p-1.5 border border-slate-300 shadow-sm"
              />
              <img
                src="/ece-logo.png"
                alt="ECE Logo"
                title="ECE Department"
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-2xs"
              />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block">
              ECE Department Portal • 3rd Year
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Sign In to SIGNOVANTA
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              M. Kumarasamy College of Engineering, Karur
            </p>
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
                  placeholder="e.g. 927624BEC001 or email address"
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
      <div className="text-center text-xs text-slate-500 py-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src="/mkce-logo.png" alt="MKCE" className="w-5 h-5 rounded-sm bg-white p-0.5 object-contain" />
          <img src="/ece-logo.png" alt="ECE" className="w-5 h-5 rounded-sm bg-white p-0.5 object-contain" />
          <img src="/signovanta-logo.png" alt="SIGNOVANTA" className="w-5 h-5 rounded-sm bg-slate-950 p-0.5 object-contain" />
        </div>
        <p>M. Kumarasamy College of Engineering, Karur • Department of Electronics and Communication Engineering</p>
        <div className="text-slate-400 flex flex-wrap items-center justify-center gap-2 pt-0.5">
          <span>SIGNOVANTA Platform • Crafted with Pride by</span>
          <span className="text-white font-extrabold bg-blue-950/80 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-lg text-xs">
            HARISH PRANAV S
          </span>
          <a href="tel:7845693765" className="text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1">
            📞 7845693765
          </a>
          <span className="text-slate-600">•</span>
          <a href="mailto:harishpranavs259@gmail.com" className="text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1">
            ✉️ harishpranavs259@gmail.com
          </a>
        </div>
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
