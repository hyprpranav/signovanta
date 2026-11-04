import React, { useState } from 'react';
import { registerStaffRequest } from '../../services/firebase/authService';
import { Button } from '../../components/common/Button';
import {
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  User,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

interface StaffRegisterPageProps {
  onBackToLogin: () => void;
}

export const StaffRegisterPage: React.FC<StaffRegisterPageProps> = ({ onBackToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [department, setDepartment] = useState('Electronics & Communication');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [requestedRole, setRequestedRole] = useState<'STAFF' | 'HOD' | 'AHOD'>('STAFF');
  const [supportingInfo, setSupportingInfo] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await registerStaffRequest({
        fullName: fullName.trim(),
        staffId: staffId.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        department,
        designation: designation.trim(),
        requestedRole,
        supportingInfo: supportingInfo.trim(),
        password,
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-xl w-full mx-auto my-auto">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <button
              onClick={onBackToLogin}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Staff Registration & Role Request</h2>
              <p className="text-xs text-slate-500">
                Submit faculty credentials for Master Administrator approval
              </p>
            </div>
          </div>

          {/* Success screen */}
          {isSubmitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Registration Request Submitted!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your staff registration request is now <strong>PENDING</strong> Master Administrator approval. Once approved, you can log in with your credentials.
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 max-w-md mx-auto">
                <strong>Notice:</strong> Your requested role (<strong>{requestedRole}</strong>) will be reviewed by the administration before privileges are activated.
              </div>
              <Button variant="primary" onClick={onBackToLogin}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Access Policy:</strong> All faculty accounts must be verified and granted permissions by the Master Administrator before dashboard access is permitted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. K. Raman"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff ID / Employee Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. STF105"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official College Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty@college.edu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Associate Professor"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Requested Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Requested Privileged Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STAFF', 'AHOD', 'HOD'] as const).map((r) => (
                    <label
                      key={r}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all ${
                        requestedRole === r
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requestedRole"
                        checked={requestedRole === r}
                        onChange={() => setRequestedRole(r)}
                        className="hidden"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: The requested role does not automatically become active. Master Admin verifies and assigns your final role.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supporting Information / Reason for Role
                </label>
                <textarea
                  rows={2}
                  value={supportingInfo}
                  onChange={(e) => setSupportingInfo(e.target.value)}
                  placeholder="e.g. Appointed as department coordinator for third-year hackathon pre-approvals..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth isLoading={isLoading} size="lg">
                  Submit Staff Role Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

