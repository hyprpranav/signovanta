import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { Button } from '../../components/common/Button';
import { FirstTimeActivationModal } from '../../components/common/FirstTimeActivationModal';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Lock,
  User,
  Mail,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onOpenFirebaseGuide: () => void;
  onNavigateToStaffRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onOpenFirebaseGuide,
  onNavigateToStaffRegister,
}) => {
  const { loginAsStudent, loginAsStaff, loginAsMasterAdmin } = useAuth();
  const [authPortal, setAuthPortal] = useState<'STUDENT' | 'STAFF' | 'ADMIN'>('STUDENT');

  // Student Form
  const [studentRegNo, setStudentRegNo] = useState('927624BEC066');
  const [studentPassword, setStudentPassword] = useState('927624BEC066');

  // Staff Form
  const [staffEmail, setStaffEmail] = useState('arunkumar.hod@college.edu');
  const [staffPassword, setStaffPassword] = useState('password123');

  // Master Admin Form
  const [adminPin, setAdminPin] = useState('admin123');

  // Activation Modal State
  const [activationStudent, setActivationStudent] = useState<Student | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginAsStudent(studentRegNo, studentPassword);
      if (res.requiresPasswordChange) {
        // Pre-create student object for activation modal
        setActivationStudent({
          id: `std_${studentRegNo.toLowerCase().trim()}`,
          registrationNumber: studentRegNo.toUpperCase().trim(),
          fullName: 'Siva Prakash K',
          email: `${studentRegNo.toLowerCase().trim()}@college.edu`,
          mobile: '9842109876',
          department: 'Electronics & Communication',
          academicYear: 'III Year',
          section: 'III Year V Section',
          status: 'NOT_ACTIVATED',
          isActivated: false,
          hasSetPassword: false,
          createdAt: new Date().toISOString(),
          eventCount: 0,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await loginAsStaff(staffEmail, staffPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Staff login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await loginAsMasterAdmin(adminPin);
    } catch (err: any) {
      setErrorMessage(err.message || 'Master Admin access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Helpers for Paired Verification
  const quickStudentFill = (reg: string) => {
    setStudentRegNo(reg);
    setStudentPassword(reg);
  };

  const quickStaffFill = (email: string) => {
    setStaffEmail(email);
    setStaffPassword('password123');
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

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Welcome to SIGNOVANTA
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Student Event Management & Multi-Tier Verification Gateway
            </p>
          </div>

          {/* Three Portal Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => {
                setAuthPortal('STUDENT');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authPortal === 'STUDENT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>

            <button
              onClick={() => {
                setAuthPortal('STAFF');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authPortal === 'STAFF'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase size={15} />
              <span>Staff / HOD</span>
            </button>

            <button
              onClick={() => {
                setAuthPortal('ADMIN');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authPortal === 'ADMIN'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Master Admin</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {authPortal === 'STUDENT' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registration Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    placeholder="e.g. 927624BEC066"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono uppercase"
                  />
                  <User size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Case-insensitive. Preloaded for 3rd Year cohorts.
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
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Initial password = Registration Number"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-blue-600 mt-1">
                  First login? Use your Registration Number as password.
                </p>
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} size="lg">
                Sign In as Student
              </Button>

              {/* Quick Select Preset Buttons for testing */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Cohort Demo Logins:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickStudentFill('927624BEC066')}
                    className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    927624BEC066 (V-Sec, First Time)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStudentFill('927624BEC014')}
                    className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    927624BEC014 (Active, 2 Events)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStudentFill('927624BCS008')}
                    className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    927624BCS008 (A-Sec, CSE)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStudentFill('927624BCE003')}
                    className="p-1.5 text-[11px] font-mono bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    927624BCE003 (C-Sec, Civil)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STAFF LOGIN FORM */}
          {authPortal === 'STAFF' && (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official College Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="faculty@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} size="lg">
                Sign In to Staff Portal
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateToStaffRegister}
                  className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>New Staff Member? Submit Registration Request</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Demo Staff Accounts */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Staff Demo Accounts:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickStaffFill('arunkumar.hod@college.edu')}
                    className="p-1.5 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    Dr. Arun Kumar (HOD)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStaffFill('priya.ahod@college.edu')}
                    className="p-1.5 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    Dr. Priya (AHOD)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStaffFill('ramesh.cse@college.edu')}
                    className="p-1.5 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-left truncate cursor-pointer"
                  >
                    Prof. Ramesh (STAFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickStaffFill('venkatesh.ece@college.edu')}
                    className="p-1.5 text-[11px] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-800 font-semibold text-left truncate cursor-pointer"
                  >
                    Dr. Venkatesh (PENDING)
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MASTER ADMIN LOGIN FORM */}
          {authPortal === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
                <strong>Privileged Single Master Admin Gateway:</strong> Access requires master administrator security key.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Administrator Security Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Enter Master Security Key"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Default PIN: admin123</p>
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} size="lg">
                Authenticate Master Admin
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 py-3">
        SIGNOVANTA Platform • Student Event Participation & Activity Monitoring System
      </div>

      {/* Mandatory First-Time Password Reset Modal */}
      {activationStudent && (
        <FirstTimeActivationModal
          isOpen={true}
          student={activationStudent}
          onSuccess={() => {
            setActivationStudent(null);
            setSuccessMessage('Account activated successfully! You are now logged in.');
          }}
        />
      )}
    </div>
  );
};

