import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EventApplication, Student, UserRole, StudentRegistrationRequest } from '../../types';
import {
  getAllApplications,
  preApproveApplication,
  completeEventApplication,
  enableStudentApplicationEditing,
  requestCorrectionApplication,
  rejectApplication,
  createStaffAnnouncement,
  getUserNotifications,
  syncApplicationsFromFirebase,
  subscribeToApplications,
  deleteApplication,
} from '../../services/firebase/firestoreService';
import { ExportManagement } from '../../components/common/ExportManagement';
import { SubmissionsPanel } from '../../components/common/SubmissionsPanel';
import { EventOutcomeAnalytics } from '../../components/common/EventOutcomeAnalytics';
import { WinnersCertificateShowcase } from '../../components/analytics/WinnersCertificateShowcase';
import { EventParticipationAnalytics } from '../../components/analytics/EventParticipationAnalytics';
import {
  getLocalStudents,
  syncStudentsFromFirebase,
  getStudentRegistrationRequests,
  saveStudentRegistrationRequests,
  approveStudentRegistrationRequest,
  rejectStudentRegistrationRequest,
  updateStaffProfile,
  changeStaffPassword,
  syncStudentRegistrationRequestsFromFirebase,
  subscribeToStudentRequests,
} from '../../services/firebase/authService';
import { uploadToCloudinary } from '../../services/cloudinary/cloudinaryService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import {
  CheckSquare,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  Search,
  Filter,
  Megaphone,
  GraduationCap,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Bell,
  Send,
  LayoutDashboard,
  FileText,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';

interface StaffDashboardProps {
  activeTab?: string;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ activeTab: requestedTab }) => {
  const { currentUser, staffData } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submissions' | 'student_requests' | 'announcements' | 'exports' | 'analytics' | 'settings'>('dashboard');
  const [submissionsSubTab, setSubmissionsSubTab] = useState<'pre_approvals' | 'certificates' | 'all'>('pre_approvals');
  const [applications, setApplications] = useState<EventApplication[]>(() =>
    getAllApplications().filter(a => a.status !== 'DRAFT')
  );
  const [students, setStudents] = useState(() => getLocalStudents());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentRequests, setStudentRequests] = useState<StudentRegistrationRequest[]>(() => getStudentRegistrationRequests());
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);

  // Staff Profile State
  const [staffName, setStaffName] = useState(() => currentUser?.displayName || staffData?.fullName || 'Faculty Member');
  const [staffEmail, setStaffEmail] = useState(() => currentUser?.email || staffData?.email || '');
  const [staffMobile, setStaffMobile] = useState(() => staffData?.mobile || '9876543210');
  const [staffDob, setStaffDob] = useState(() => staffData?.dateOfBirth || '1985-05-20');
  const [staffDepartment, setStaffDepartment] = useState(() => staffData?.department || 'Electronics & Communication Engineering');
  const [staffDesignation, setStaffDesignation] = useState(() => staffData?.designation || 'Faculty Coordinator');
  const [staffCabin, setStaffCabin] = useState(() => staffData?.cabinNumber || 'ECE-Block-302');
  const [staffPhotoUrl, setStaffPhotoUrl] = useState(() => currentUser?.profilePhotoUrl || staffData?.profilePhotoUrl || '');
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const [uploadStaffPhotoProgress, setUploadStaffPhotoProgress] = useState(0);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Staff Password Change State
  const [currentStaffPassword, setCurrentStaffPassword] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [confirmStaffPassword, setConfirmStaffPassword] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStaffPhoto(true);
    setUploadStaffPhotoProgress(15);
    try {
      const res = await uploadToCloudinary(file, 'profile_photos', (pct) => {
        setUploadStaffPhotoProgress(pct);
      });
      setStaffPhotoUrl(res.url);

      if (staffData?.staffId) {
        await updateStaffProfile(staffData.staffId, {
          profilePhotoUrl: res.url,
        });
      }

      const stored = localStorage.getItem('signovanta_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.profilePhotoUrl = res.url;
        localStorage.setItem('signovanta_current_user', JSON.stringify(parsed));
      }
      setProfileSuccessMsg('✓ Faculty profile photo uploaded to Cloudinary & saved!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleSaveStaffProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (staffData?.staffId) {
        await updateStaffProfile(staffData.staffId, {
          fullName: staffName.trim(),
          email: staffEmail.trim().toLowerCase(),
          mobile: staffMobile.trim(),
          dateOfBirth: staffDob,
          department: staffDepartment,
          designation: staffDesignation.trim(),
          cabinNumber: staffCabin.trim(),
          profilePhotoUrl: staffPhotoUrl,
        });
      }

      const stored = localStorage.getItem('signovanta_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.displayName = staffName;
        parsed.email = staffEmail;
        parsed.department = staffDepartment;
        parsed.designation = staffDesignation;
        parsed.profilePhotoUrl = staffPhotoUrl;
        localStorage.setItem('signovanta_current_user', JSON.stringify(parsed));
      }

      setProfileSuccessMsg('✓ Faculty profile updated and saved permanently in Firebase!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangeStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentStaffPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (!newStaffPassword || newStaffPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newStaffPassword !== confirmStaffPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    try {
      if (staffData?.staffId) {
        await changeStaffPassword(
          staffData.staffId,
          currentUser?.email || staffEmail,
          currentStaffPassword,
          newStaffPassword
        );
      }

      setPasswordSuccessMsg('✓ Password updated successfully in Firebase! Please use your new password for future sign-ins.');
      setCurrentStaffPassword('');
      setNewStaffPassword('');
      setConfirmStaffPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update password');
    }
  };

  const handleApproveStudentReq = (reqId: string) => {
    try {
      approveStudentRegistrationRequest(reqId);
      setStudentRequests(getStudentRegistrationRequests());
      setStudents(getLocalStudents());
      window.dispatchEvent(new CustomEvent('signovanta:data-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to approve student request.');
    }
  };

  const handleRejectStudentReq = (reqId: string) => {
    try {
      rejectStudentRegistrationRequest(reqId);
      setStudentRequests(getStudentRegistrationRequests());
      window.dispatchEvent(new CustomEvent('signovanta:data-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to reject student request.');
    }
  };

  useEffect(() => {
    if (!requestedTab) return;
    if (requestedTab === 'approvals' || requestedTab === 'pre_approvals') {
      setActiveTab('submissions');
      setSubmissionsSubTab('pre_approvals');
    } else if (requestedTab === 'certificates' || requestedTab === 'certificate_verification') {
      setActiveTab('submissions');
      setSubmissionsSubTab('certificates');
    } else if (requestedTab === 'submissions') {
      setActiveTab('submissions');
    } else if (requestedTab === 'my_profile') {
      setActiveTab('settings');
    } else if (['dashboard', 'student_requests', 'announcements', 'exports', 'analytics', 'settings'].includes(requestedTab)) {
      setActiveTab(requestedTab as any);
    }
  }, [requestedTab]);

  useEffect(() => {
    void Promise.all([syncApplicationsFromFirebase(), syncStudentsFromFirebase(), syncStudentRegistrationRequestsFromFirebase()])
      .then(([remoteApplications, remoteStudents, remoteRequests]) => {
        setApplications(remoteApplications.filter(a => a.status !== 'DRAFT'));
        setStudents(remoteStudents);
        setStudentRequests(remoteRequests);
      });

    const unsubApps = subscribeToApplications((remote) => {
      setApplications(remote.filter(a => a.status !== 'DRAFT'));
    });
    const unsubReqs = subscribeToStudentRequests((remote) => {
      setStudentRequests(remote);
    });

    return () => {
      unsubApps();
      unsubReqs();
    };
  }, []);

  useEffect(() => {
    const refreshStudents = () => setStudents(getLocalStudents());
    window.addEventListener('signovanta:student-updated', refreshStudents);
    return () => window.removeEventListener('signovanta:student-updated', refreshStudents);
  }, []);

  // Review Modal state
  const [selectedApp, setSelectedApp] = useState<EventApplication | null>(null);
  const [actionType, setActionType] = useState<'pre_approve' | 'complete' | 'correct' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!currentUser || !staffData) return null;

  const role = currentUser.role;

  // Filter queues
  const preApprovalQueue = applications.filter(a =>
    ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED'].includes(a.status)
  );

  const certificateVerificationQueue = applications.filter(a =>
    ['CERTIFICATE_SUBMITTED', 'FINAL_VERIFICATION'].includes(a.status)
  );

  const completedList = applications.filter(a => a.status === 'COMPLETED');

  const reloadApps = () => {
    setApplications(getAllApplications().filter(a => a.status !== 'DRAFT'));
  };

  const handleActionConfirm = () => {
    if (!selectedApp || !actionType) return;
    setIsProcessing(true);

    try {
      if (actionType === 'pre_approve') {
        preApproveApplication(
          selectedApp.id,
          currentUser.uid,
          currentUser.displayName,
          currentUser.role,
          remarks || 'Approved for event participation.'
        );
      } else if (actionType === 'complete') {
        completeEventApplication(
          selectedApp.id,
          currentUser.uid,
          currentUser.displayName,
          currentUser.role,
          remarks || 'Certificates successfully verified.'
        );
      } else if (actionType === 'correct') {
        requestCorrectionApplication(
          selectedApp.id,
          currentUser.uid,
          currentUser.displayName,
          currentUser.role,
          remarks
        );
      } else if (actionType === 'reject') {
        rejectApplication(
          selectedApp.id,
          currentUser.uid,
          currentUser.displayName,
          currentUser.role,
          remarks
        );
      }

      reloadApps();
      setSelectedApp(null);
      setActionType(null);
      setRemarks('');
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnnouncementSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAnnouncementStatus(null);
    try {
      const authorLabel = `${currentUser.displayName || 'Faculty'} (${staffData?.designation || 'Staff'})`;
      createStaffAnnouncement(announcementTitle, announcementMessage, authorLabel);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setAnnouncementStatus('✓ Announcement posted! It is now visible to all students, staff, and admin.');
      window.dispatchEvent(new CustomEvent('signovanta:data-updated'));
    } catch (err) {
      setAnnouncementStatus(err instanceof Error ? err.message : 'Failed to post announcement.');
    }
  };

  const announcements = getUserNotifications('ALL');

  return (
    <div className="space-y-6">
      {/* 1. Tab: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Dynamic Role Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Staff & Department Oversight
                  </span>
                  <Badge role={role} size="sm" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Welcome, {staffData.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 font-medium">
                  <span className="bg-white/10 px-2 py-0.5 rounded font-bold text-white">
                    Role: {role}
                  </span>
                  <span>•</span>
                  <span>Department: {staffData.department}</span>
                  <span>•</span>
                  <span>Staff ID: {staffData.staffId}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-full font-bold">
                  ✓ Active Authenticated Session
                </span>
              </div>
            </div>
          </div>

          {/* 5 Live Database Count Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Students</span>
              <strong className="block text-2xl font-black mt-1">{students.length}</strong>
              <span className="text-[11px] text-white/80">3rd Year ECE</span>
            </div>

            <div
              onClick={() => {
                setActiveTab('submissions');
                setSubmissionsSubTab('pre_approvals');
              }}
              className="bg-amber-500 rounded-2xl p-4 text-white shadow-sm cursor-pointer hover:bg-amber-600 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Pre-Approval Queue</span>
              <strong className="block text-2xl font-black mt-1">{preApprovalQueue.length}</strong>
              <span className="text-[11px] text-white/80">50% Verification →</span>
            </div>

            <div
              onClick={() => {
                setActiveTab('submissions');
                setSubmissionsSubTab('certificates');
              }}
              className="bg-purple-600 rounded-2xl p-4 text-white shadow-sm cursor-pointer hover:bg-purple-700 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Certificates to Verify</span>
              <strong className="block text-2xl font-black mt-1">{certificateVerificationQueue.length}</strong>
              <span className="text-[11px] text-white/80">100% Verification →</span>
            </div>

            <div
              onClick={() => {
                setActiveTab('submissions');
                setSubmissionsSubTab('all');
              }}
              className="bg-emerald-600 rounded-2xl p-4 text-white shadow-sm cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Completed</span>
              <strong className="block text-2xl font-black mt-1">{completedList.length}</strong>
              <span className="text-[11px] text-white/80">Verified Events →</span>
            </div>

            <div
              onClick={() => setActiveTab('analytics')}
              className="bg-amber-600 rounded-2xl p-4 text-white shadow-sm cursor-pointer hover:bg-amber-700 transition-colors"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Winning Students</span>
              <strong className="block text-2xl font-black mt-1">
                {new Set(applications.filter(app => app.prizeWon).map(app => app.studentRegNo)).size}
              </strong>
              <span className="text-[11px] text-white/80">View Analytics →</span>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Faculty Workspace Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('submissions');
                  setSubmissionsSubTab('pre_approvals');
                }}
                className="flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-500 text-white rounded-xl">
                    <CheckSquare size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">Pre-Approvals (50%)</span>
                    <span className="text-[11px] text-amber-700 font-semibold">{preApprovalQueue.length} pending review</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-amber-800" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('submissions');
                  setSubmissionsSubTab('certificates');
                }}
                className="flex items-center justify-between p-3.5 bg-purple-50 hover:bg-purple-100/70 border border-purple-200/80 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-purple-600 text-white rounded-xl">
                    <FileCheck size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-purple-950 block">Certificates (100%)</span>
                    <span className="text-[11px] text-purple-700 font-semibold">{certificateVerificationQueue.length} pending check</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-purple-800" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('student_requests')}
                className="flex items-center justify-between p-3.5 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/80 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-blue-600 text-white rounded-xl">
                    <GraduationCap size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-blue-950 block">Student Requests</span>
                    <span className="text-[11px] text-blue-700 font-semibold">{studentRequests.filter(r => r.status === 'PENDING').length} awaiting</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-blue-800" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-slate-800 text-white rounded-xl">
                    <Megaphone size={16} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Post Announcement</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Broadcast message</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Department Analytics summary */}
          <EventParticipationAnalytics students={students} applications={applications} isStaffOrAdminView />
        </div>
      )}

      {activeTab === 'exports' && (
        <ExportManagement students={students} staff={[]} applications={applications} />
      )}
      {activeTab === 'analytics' && <EventOutcomeAnalytics applications={applications} />}

      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
          <form onSubmit={handleAnnouncementSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Announce to Students</h2>
              <p className="text-xs text-slate-500 mt-1">This message will be delivered to every student notification center.</p>
            </div>
            {announcementStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${announcementStatus.startsWith('Announcement posted') ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                {announcementStatus}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
              <input value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} required maxLength={120} placeholder="e.g. Hackathon registration deadline" className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
              <textarea value={announcementMessage} onChange={(event) => setAnnouncementMessage(event.target.value)} required maxLength={1000} rows={6} placeholder="Write the announcement for all students..." className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <Button type="submit" variant="primary" leftIcon={<Megaphone size={15} />}>Post Announcement</Button>
          </form>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Posted Announcements</h2>
              <p className="text-xs text-slate-500 mt-1">Broadcast messages sent to students.</p>
            </div>
            {announcements.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">No announcements posted yet.</div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xs font-bold text-slate-900">{announcement.title}</h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(announcement.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{announcement.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Submissions Hub (50% Pre-Approvals, 100% Certificate Verification, All Submissions) */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* Submissions Hub Sub-Nav Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubmissionsSubTab('pre_approvals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                submissionsSubTab === 'pre_approvals'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <CheckSquare size={15} />
              <span>50% Pre-Approval Requests</span>
              {preApprovalQueue.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    submissionsSubTab === 'pre_approvals' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                  }`}
                >
                  {preApprovalQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubmissionsSubTab('certificates')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                submissionsSubTab === 'certificates'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileCheck size={15} />
              <span>100% Certificate Verification</span>
              {certificateVerificationQueue.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    submissionsSubTab === 'certificates' ? 'bg-purple-400 text-white' : 'bg-purple-600 text-white'
                  }`}
                >
                  {certificateVerificationQueue.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubmissionsSubTab('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                submissionsSubTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText size={15} />
              <span>All Submissions & Completed Events</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  submissionsSubTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {applications.length}
              </span>
            </button>
          </div>

          {/* Submissions Sub-Tab 1: Pre-Approval Queue (50% stage) */}
          {submissionsSubTab === 'pre_approvals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Pre-Event Verification Queue (Grants 50% Progress)
                </h2>
                <span className="text-xs text-slate-500">{preApprovalQueue.length} pending review</span>
              </div>

          {preApprovalQueue.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">Pre-Approval Queue Clean</p>
              <p className="text-xs text-slate-500 mt-1">All student submissions are verified.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preApprovalQueue.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {app.applicationNumber}
                        </span>
                        <span className="text-xs font-bold text-blue-700">{app.eventCategory}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{app.eventName}</h3>
                      <p className="text-xs text-slate-500">
                        {app.studentName} ({app.studentRegNo}) • {app.section}
                      </p>
                    </div>
                    <Badge status={app.status} />
                  </div>

                  <div className="text-xs bg-slate-50 p-3 rounded-2xl text-slate-600 space-y-1">
                    <p>
                      <strong>Host:</strong> {app.institutionName} ({app.eventLocation})
                    </p>
                    <p>
                      <strong>Dates:</strong> {app.startDate} to {app.endDate} ({app.eventMode})
                    </p>
                    <p>
                      <strong>Participation:</strong> {app.participationType}{' '}
                      {app.teamName ? `(Team: ${app.teamName})` : ''}
                    </p>
                    <p className="line-clamp-2 text-slate-500 mt-1">{app.eventDescription}</p>
                  </div>

                  {app.brochureUrl && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Brochure Attached</span>
                      <a
                        href={app.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span>View Brochure</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setSelectedStudent(students.find(student => student.registrationNumber === app.studentRegNo) || null)}>View Student</Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('pre_approve');
                      }}
                      className="flex-1 font-bold"
                    >
                      Pre-Approve (50%)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('correct');
                      }}
                    >
                      Correction
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('reject');
                      }}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions Sub-Tab 2: Certificate Verification (100% stage) */}
      {submissionsSubTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Post-Event Certificate Verification (Grants 100% Completion)
            </h2>
            <span className="text-xs text-slate-500">
              {certificateVerificationQueue.length} awaiting verification
            </span>
          </div>

          {certificateVerificationQueue.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <FileCheck size={36} className="mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-bold text-slate-700">No Certificates Pending</p>
              <p className="text-xs text-slate-500 mt-1">All post-event uploads are up to date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificateVerificationQueue.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {app.applicationNumber}
                        </span>
                        <Badge status={app.status} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{app.eventName}</h3>
                      <p className="text-xs text-slate-500">
                        {app.studentName} ({app.studentRegNo})
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5">
                    <p><strong>100% Submitted:</strong> {app.postEventSubmittedAt ? new Date(app.postEventSubmittedAt).toLocaleString() : 'Not available'}</p>
                    <p><strong>50% Approved:</strong> {app.preApprovedByName ? `${app.preApprovedByName} • ${app.preApprovedAt ? new Date(app.preApprovedAt).toLocaleString() : 'Time unavailable'}` : 'Pending'}</p>
                    <p>
                      <strong>Prize Standing:</strong>{' '}
                      {app.prizeWon ? (
                        <span className="text-emerald-700 font-bold">
                          🏆 {app.prizeCategory} ({app.achievementDescription || 'Awarded'})
                        </span>
                      ) : (
                        <span>Participated Only</span>
                      )}
                    </p>
                    <p className="text-slate-600">
                      <strong>Outcomes:</strong> {app.actualParticipationDetails}
                    </p>
                  </div>

                  {/* Certificate links */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    {app.winnerCertUrl && (
                      <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="font-bold text-amber-900">Winner Certificate:</span>
                        <a
                          href={app.winnerCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                        >
                          View Document <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {app.participationCertUrl && (
                      <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl">
                        <span className="font-semibold text-slate-700">Participation Certificate:</span>
                        <a
                          href={app.participationCertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                        >
                          View Document <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setSelectedStudent(students.find(student => student.registrationNumber === app.studentRegNo) || null)}>View Student</Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('complete');
                      }}
                      className="flex-1 font-bold"
                    >
                      Verify & Mark 100% Completed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setActionType('correct');
                      }}
                    >
                      Request Correction
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hall of Fame & Verified Winner Certificates */}
          <div className="pt-4">
            <WinnersCertificateShowcase
              applications={applications}
              title="🏆 Verified Winner Certificates & Hall of Fame"
              subtitle="Review uploaded trophies and certificates across all sections"
            />
          </div>
        </div>
      )}

      {/* Submissions Sub-Tab 3: All Submissions & Completed Events Directory */}
      {submissionsSubTab === 'all' && (
        <SubmissionsPanel
          applications={applications}
          editorUid={currentUser?.uid || 'staff-user'}
          editorName={currentUser?.displayName || 'Staff'}
          editorRole={currentUser?.role || 'STAFF'}
          onUpdate={updated => setApplications(current => current.map(item => item.id === updated.id ? updated : item))}
          onEnableStudentEdit={application => {
            try {
              const updated = enableStudentApplicationEditing(
                application.id,
                currentUser?.uid || 'staff-user',
                currentUser?.displayName || 'Staff',
                currentUser?.role || 'STAFF'
              );
              setApplications(current => current.map(item => item.id === updated.id ? updated : item));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Unable to enable student editing.');
            }
          }}
          onComplete={application => {
            setSelectedApp(application);
            setActionType('complete');
          }}
          onApprove={application => {
            setSelectedApp(application);
            setActionType('pre_approve');
          }}
          onReject={application => {
            setSelectedApp(application);
            setActionType('reject');
          }}
          onDelete={async application => {
            if (!window.confirm(`Delete the rejected submission "${application.eventName}"?`)) return;
            try {
              await deleteApplication(application.id);
              setApplications(current => current.filter(item => item.id !== application.id));
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Deletion failed.');
            }
          }}
        />
      )}
    </div>
  )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <EventParticipationAnalytics students={students} applications={applications} isStaffOrAdminView />
          <EventOutcomeAnalytics applications={applications} />
        </div>
      )}

      {/* Tab: Student Registration Requests (Staff Verification) */}
      {activeTab === 'student_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="text-blue-600" size={18} />
                <span>Student Registration Requests ({studentRequests.filter(r => r.status === 'PENDING').length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Review and approve new 3rd year ECE student self-registrations
              </p>
            </div>
          </div>

          {studentRequests.filter(r => r.status === 'PENDING').length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">No Pending Student Requests</p>
              <p className="text-xs text-slate-500 mt-1">All student registration records are up to date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentRequests.filter(r => r.status === 'PENDING').map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{req.fullName}</h4>
                      <p className="text-xs font-mono font-bold text-blue-700">{req.registrationNumber}</p>
                      <p className="text-xs text-slate-500">{req.section} • {req.department}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      PENDING
                    </span>
                  </div>

                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl space-y-0.5 text-slate-600">
                    <p><strong>Mobile:</strong> {req.mobile || 'N/A'}</p>
                    <p><strong>Email:</strong> {req.email}</p>
                    <p className="text-[11px] text-slate-400">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleApproveStudentReq(req.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Approve Student
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRejectStudentReq(req.id)}
                      className="text-rose-600 hover:bg-rose-50 font-bold"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Staff Profile & Security Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl overflow-hidden ring-4 ring-slate-100 shadow-md shrink-0">
              {staffPhotoUrl ? (
                <img src={staffPhotoUrl} alt={staffName} className="w-full h-full object-cover" />
              ) : (
                <span>{staffName ? staffName.charAt(0).toUpperCase() : 'F'}</span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{staffName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {staffDesignation}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {currentUser?.role || 'STAFF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{staffEmail}</p>
              <p className="text-xs text-blue-700 font-semibold">{staffDepartment} • Cabin: {staffCabin}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Edit Profile */}
            <form onSubmit={handleSaveStaffProfile} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <User size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Faculty Details</h3>
                  <p className="text-[11px] text-slate-500">Edit and update your profile information</p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={staffMobile}
                    onChange={(e) => setStaffMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={staffDob}
                    onChange={(e) => setStaffDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabin Number</label>
                  <input
                    type="text"
                    value={staffCabin}
                    onChange={(e) => setStaffCabin(e.target.value)}
                    placeholder="e.g. ECE-Block-302"
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden ring-2 ring-white shadow-xs shrink-0 flex items-center justify-center">
                  {staffPhotoUrl ? (
                    <img src={staffPhotoUrl} alt="Faculty Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Faculty Profile Picture</span>
                  <label className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer transition-colors shadow-xs">
                    <UploadCloud size={13} />
                    <span>{uploadingStaffPhoto ? `Uploading (${uploadStaffPhotoProgress}%)...` : 'Upload to Cloudinary'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffPhotoUpload}
                      disabled={uploadingStaffPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Direct Photo URL (Optional)</label>
                <input
                  type="url"
                  value={staffPhotoUrl}
                  onChange={(e) => setStaffPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Save Faculty Profile
                </Button>
              </div>
            </form>

            {/* 2. Change Password */}
            <form onSubmit={handleChangeStaffPassword} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sign-In Password</h3>
                  <p className="text-[11px] text-slate-500">Update your faculty account sign-in password</p>
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
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentStaffPassword}
                    onChange={(e) => setCurrentStaffPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-3 pr-9 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmStaffPassword}
                  onChange={(e) => setConfirmStaffPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" leftIcon={<KeyRound size={14} />} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Confirmation Modal */}
      {selectedStudent && (
        <Modal isOpen={true} onClose={() => setSelectedStudent(null)} title="Student Profile" subtitle="Review student information and submitted events" maxWidth="xl">
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold">
                {selectedStudent.fullName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold">{selectedStudent.fullName}</h3>
                <p className="mt-0.5 text-xs text-blue-100">{selectedStudent.registrationNumber} • {selectedStudent.section}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Register Number', selectedStudent.registrationNumber, true],
                ['Email Address', selectedStudent.email || 'Not provided', false],
                ['Phone Number', selectedStudent.mobile || 'Not provided', false],
                ['Events Participated', String(selectedStudent.eventCount || 0), false],
              ].map(([label, value, mono]) => (
                <div key={label as string} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className={`mt-1 break-words text-sm font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
            <section className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submitted Events & Documents</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Track submissions and approval progress</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).length}
                </span>
              </div>
              <div className="space-y-3 p-4">
                {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).map(app => (
                  <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-slate-900">{app.eventName}</strong>
                      <Badge status={app.status} size="sm" />
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                      <p><span className="block text-[10px] font-semibold uppercase text-slate-400">Submitted</span><span className="font-medium text-slate-700">{new Date(app.createdAt).toLocaleString()}</span></p>
                      <p><span className="block text-[10px] font-semibold uppercase text-slate-400">Pre-approval</span><span className="font-medium text-slate-700">{app.preApprovedByName ? `${app.preApprovedByName}${app.preApprovedAt ? ` • ${new Date(app.preApprovedAt).toLocaleString()}` : ''}` : 'Pending'}</span></p>
                    </div>
                  </div>
                ))}
                {applications.filter(app => app.studentRegNo === selectedStudent.registrationNumber).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center">
                    <p className="text-sm font-semibold text-slate-700">No event submissions found</p>
                    <p className="mt-1 text-xs text-slate-500">Submitted events and approval details will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </Modal>
      )}

      {selectedApp && actionType && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedApp(null);
            setActionType(null);
          }}
          title={
            actionType === 'pre_approve'
              ? 'Grant Pre-Event Approval (50%)'
              : actionType === 'complete'
              ? 'Verify Certificates & Complete (100%)'
              : actionType === 'correct'
              ? 'Request Correction from Student'
              : 'Reject Application'
          }
          subtitle={`Application: ${selectedApp.applicationNumber} - ${selectedApp.eventName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Reviewer Remarks / Instructions
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  actionType === 'correct'
                    ? 'State clearly what corrections or missing documents are required...'
                    : actionType === 'reject'
                    ? 'Reason for rejection...'
                    : 'Approval remarks for student records...'
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedApp(null);
                  setActionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={
                  actionType === 'pre_approve' || actionType === 'complete'
                    ? 'primary'
                    : actionType === 'reject'
                    ? 'danger'
                    : 'secondary'
                }
                size="sm"
                isLoading={isProcessing}
                onClick={handleActionConfirm}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
